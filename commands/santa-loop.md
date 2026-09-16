---
description: Bucle de convergencia de doble revisión adversaria — dos revisores de modelos independientes deben aprobar antes de desplegar el código.
---

# Bucle Santa (Santa Loop)

Bucle de convergencia de doble revisión adversaria utilizando la habilidad santa-method. Dos revisores independientes —diferentes modelos, sin contexto compartido— deben devolver ambos NICE (Aprobado) antes de que el código sea publicado.

## Propósito

Ejecutar dos revisores independientes (Claude Opus + un modelo externo) contra la salida de la tarea actual. Ambos deben retornar NICE antes de subir el código. Si alguno retorna NAUGHTY (Desaprobado), se corrigen todos los problemas señalados, se crea un commit y se vuelven a ejecutar revisores limpios — hasta un máximo de 3 rondas.

## Uso

```
/santa-loop [archivo-o-glob | descripción]
```

## Flujo de Trabajo

### Paso 1: Identificar qué Revisar

Determinar el alcance a partir de `$ARGUMENTS` o tomar los cambios no confirmados:

```bash
git diff --name-only HEAD
```

Leer todos los archivos modificados para construir el contexto completo de revisión. Si `$ARGUMENTS` especifica una ruta, archivo o descripción, utilizar eso como alcance.

### Paso 2: Construir la Rúbrica

Construir una rúbrica adecuada para los tipos de archivo bajo revisión. Cada criterio debe tener una condición objetiva de PASS/FAIL (Aprobado/Fallido). Incluir como mínimo:

| Criterio | Condición de Aprobación |
|---|---|
| Corrección | Lógica sólida, sin errores, maneja casos límite |
| Seguridad | Sin secretos, inyección, XSS o vulnerabilidades OWASP Top 10 |
| Manejo de errores | Errores manejados explícitamente, sin supresiones silenciosas |
| Completitud | Todos los requisitos abordados, sin casos faltantes |
| Consistencia interna | Sin contradicciones entre archivos o secciones |
| Sin regresiones | Los cambios no rompen el comportamiento existente |

Agregar criterios específicos del dominio según los tipos de archivo (p. ej., seguridad de tipos para TS, seguridad de memoria para Rust, seguridad de migraciones para SQL).

### Paso 3: Doble Revisión Independiente

Lanzar dos revisores **en paralelo** usando la herramienta Agent (ambos en un solo mensaje para ejecución concurrente). Ambos deben completarse antes de pasar a la puerta de veredicto.

Cada revisor evalúa cada criterio de la rúbrica como PASS o FAIL, y devuelve un JSON estructurado:

```json
{
  "verdict": "PASS" | "FAIL",
  "checks": [
    {"criterion": "...", "result": "PASS|FAIL", "detail": "..."}
  ],
  "critical_issues": ["..."],
  "suggestions": ["..."]
}
```

La puerta de veredicto (Paso 4) asigna estos resultados a NICE/NAUGHTY: ambos PASS → NICE, si alguno es FAIL → NAUGHTY.

#### Revisor A: Agente Claude (siempre se ejecuta)

Lanzar un Agente (subagent_type: `code-reviewer`, model: `opus`) con la rúbrica completa + todos los archivos bajo revisión. El mensaje debe incluir:
- La rúbrica completa
- Todo el contenido de los archivos bajo revisión
- "Eres un revisor de calidad independiente. NO has visto ninguna otra revisión. Tu trabajo es encontrar problemas, no aprobar."
- Retornar el veredicto JSON estructurado indicado arriba

#### Revisor B: Modelo Externo (respaldo en Claude solo si no hay CLI externo instalado)

Primero, detectar qué CLIs están disponibles:
```bash
command -v codex >/dev/null 2>&1 && echo "codex" || true
command -v gemini >/dev/null 2>&1 && echo "gemini" || true
```

Construir el prompt del revisor (rúbrica e instrucciones idénticas a las del Revisor A) y escribirlo en un archivo temporal único:
```bash
PROMPT_FILE=$(mktemp /tmp/santa-reviewer-b-XXXXXX.txt)
cat > "$PROMPT_FILE" << 'EOF'
... rúbrica completa + contenido de archivos + instrucciones del revisor ...
EOF
```

Usar el primer CLI disponible:

**Codex CLI** (si está instalado)
```bash
codex exec --sandbox read-only -m gpt-5.4 -C "$(pwd)" - < "$PROMPT_FILE"
rm -f "$PROMPT_FILE"
```

**Gemini CLI** (si está instalado y codex no)
```bash
gemini -p "$(cat "$PROMPT_FILE")" -m gemini-2.5-pro
rm -f "$PROMPT_FILE"
```

**Respaldo de Agente Claude** (solo si ni `codex` ni `gemini` están instalados)
Lanzar un segundo Agente Claude (subagent_type: `code-reviewer`, model: `opus`). Registrar una advertencia de que ambos revisores comparten la misma familia de modelos — no se logró diversidad real de modelos, pero el aislamiento de contexto sigue aplicándose.

En todos los casos, el revisor debe devolver el mismo veredicto JSON estructurado que el Revisor A.

### Paso 4: Puerta de Veredicto

- **Ambos PASS** → **NICE** — proceder al Paso 6 (push)
- **Cualquiera FAIL** → **NAUGHTY** — combinar todos los problemas críticos de ambos revisores, deduplicar y proceder al Paso 5

### Paso 5: Ciclo de Corrección (ruta NAUGHTY)

1. Mostrar todos los problemas críticos de ambos revisores
2. Corregir cada problema señalado — modificar únicamente lo que fue señalado, sin refactorizaciones espontáneas no solicitadas
3. Confirmar todas las correcciones en un único commit:
   ```
   fix: address santa-loop review findings (round N)
   ```
4. Volver a ejecutar el Paso 3 con **revisores limpios** (sin memoria de rondas anteriores)
5. Repetir hasta que ambos devuelvan PASS

**Máximo 3 iteraciones.** Si sigue en NAUGHTY tras 3 rondas, detenerse y presentar los problemas restantes:

```
SANTA LOOP ESCALATION (exceeded 3 iterations)

Problemas restantes tras 3 rondas:
- [listar todos los problemas críticos no resueltos de ambos revisores]

Se requiere revisión manual antes de continuar.
```

NO hacer push.

### Paso 6: Push (ruta NICE)

Cuando ambos revisores devuelven PASS:

```bash
git push -u origin HEAD
```

### Paso 7: Reporte Final

Imprimir el reporte de salida (ver sección Salida a continuación).

## Salida

```
SANTA VERDICT: [NICE / NAUGHTY (escalated)]

Revisor A (Claude Opus):   [PASS/FAIL]
Revisor B ([modelo usado]): [PASS/FAIL]

Coincidencias:
  Señalados por ambos:   [problemas detectados por ambos]
  Solo Revisor A:        [problemas detectados solo por A]
  Solo Revisor B:        [problemas detectados solo por B]

Iteraciones: [N]/3
Resultado:   [PUSHED / ESCALATED TO USER]
```

## Notas

- El Revisor A (Claude Opus) siempre se ejecuta — garantiza al menos un revisor fuerte sin importar las herramientas.
- La diversidad de modelos es el objetivo para el Revisor B. GPT-5.4 o Gemini 2.5 Pro brindan independencia real — datos de entrenamiento distintos, diferentes sesgos y puntos ciegos. El respaldo exclusivo de Claude aún aporta valor mediante aislamiento de contexto, pero pierde diversidad de modelos.
- Se utilizan los modelos más potentes disponibles: Opus para el Revisor A, GPT-5.4 o Gemini 2.5 Pro para el Revisor B.
- Los revisores externos se ejecutan con `--sandbox read-only` (Codex) para evitar mutaciones en el repositorio durante la revisión.
- Revisores nuevos en cada ronda evitan sesgos de anclaje de hallazgos previos.
- La rúbrica es la entrada más importante. Ajústala si los revisores aprueban sin rigor o marcan temas estilísticos subjetivos.
- Los commits se realizan en rondas NAUGHTY para que las correcciones se preserven incluso si el bucle se interrumpe.
- El push solo ocurre tras obtener NICE — nunca a mitad del bucle.
