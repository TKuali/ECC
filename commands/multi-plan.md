---
description: Crea un plan de implementación multimodelo sin modificar código de producción.
---

# Plan - Planificación Colaborativa Multimodelo

Planificación colaborativa multimodelo - Recuperación de contexto + Análisis con doble modelo → Generación de plan de implementación paso a paso.

> **Prerrequisito:** Requiere el entorno de ejecución externo `ccg-workflow`, el cual **no** forma parte de la instalación base de ECC. Inicialízalo con `npx ccg-workflow` para aprovisionar `~/.claude/bin/codeagent-wrapper` y los archivos de rol `~/.claude/.ccg/prompts/*` de los que depende este comando. Sin ese entorno, este comando no funcionará correctamente.

$ARGUMENTS

---

## Protocolos Fundamentales

- **Protocolo de Lenguaje**: Usar **inglés** al interactuar con herramientas/modelos externos, comunicarse con el usuario en su propio idioma
- **Paralelismo Obligatorio**: Las llamadas a Codex/Antigravity DEBEN usar `run_in_background: true` (incluidas llamadas a un solo modelo, para no bloquear el hilo principal)
- **Soberanía del Código**: Los modelos externos tienen **cero acceso de escritura en el sistema de archivos**, todas las modificaciones las realiza Claude
- **Mecanismo de Contención de Pérdidas (Stop-Loss)**: No avanzar a la siguiente fase hasta que la salida de la fase actual haya sido validada
- **Solo Planificación**: Este comando permite leer contexto y escribir en los archivos de plan `.claude/plan/*`, pero **NUNCA modificar código de producción**

---

## Especificación de Llamadas Multimodelo

**Sintaxis de Llamada** (en paralelo: usar `run_in_background: true`):

```
Bash({
  command: "~/.claude/bin/codeagent-wrapper {{LITE_MODE_FLAG}}--backend <codex|antigravity> - \"$PWD\" <<'EOF'
ROLE_FILE: <role prompt path>
<TASK>
Requirement: <enhanced requirement>
Context: <retrieved project context>
</TASK>
OUTPUT: Step-by-step implementation plan with pseudo-code. DO NOT modify any files.
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "Breve descripción"
})
```

**Notas sobre Parámetros del Modelo**:
- No se requiere ningún indicador extra de modelo para `--backend antigravity` o `--backend codex`; `codeagent-wrapper` selecciona el modelo por defecto de cada backend.

**Prompts de Roles**:

| Fase | Codex | Antigravity |
|-------|-------|-------------|
| Análisis | `~/.claude/.ccg/prompts/codex/analyzer.md` | `~/.claude/.ccg/prompts/antigravity/analyzer.md` |
| Planificación | `~/.claude/.ccg/prompts/codex/architect.md` | `~/.claude/.ccg/prompts/antigravity/architect.md` |

**Reutilización de Sesión**: Cada llamada devuelve `SESSION_ID: xxx` (habitualmente emitido por el wrapper), **DEBE guardarse** para su posterior uso en `/ccg:execute`.

**Espera de Tareas en Segundo Plano** (tiempo de espera máximo 600000ms = 10 minutos):

```
TaskOutput({ task_id: "<task_id>", block: true, timeout: 600000 })
```

**IMPORTANTE**:
- Debe especificarse `timeout: 600000`, de lo contrario el valor predeterminado de 30 segundos provocará un tiempo de espera prematuro.
- Si aún no se completa tras 10 minutos, continúa consultando con `TaskOutput`, **NUNCA finalices el proceso abruptamente**.
- Si la espera se interrumpe por tiempo de espera, **DEBE llamarse a `AskUserQuestion` para consultar al usuario si continuar esperando o finalizar la tarea**.

---

## Flujo de Trabajo de Ejecución

**Tarea de Planificación**: $ARGUMENTS

### Fase 1: Recuperación Completa de Contexto

`[Modo: Investigación]`

#### 1.1 Mejora de Prompt (DEBE ejecutarse primero)

**Si el MCP ace-tool está disponible**, invoca la herramienta `mcp__ace-tool__enhance_prompt`:

```
mcp__ace-tool__enhance_prompt({
  prompt: "$ARGUMENTS",
  conversation_history: "<últimos 5-10 turnos de conversación>",
  project_root_path: "$PWD"
})
```

Espera el prompt mejorado y **sustituye el $ARGUMENTS original por el resultado mejorado** para todas las fases siguientes.

**Si el MCP ace-tool NO está disponible**: Omite este paso y utiliza el `$ARGUMENTS` original tal como está para todas las fases posteriores.

#### 1.2 Recuperación de Contexto

**Si el MCP ace-tool está disponible**, invoca la herramienta `mcp__ace-tool__search_context`:

```
mcp__ace-tool__search_context({
  query: "<consulta semántica basada en el requisito mejorado>",
  project_root_path: "$PWD"
})
```

- Construye la consulta semántica usando lenguaje natural (Dónde/Qué/Cómo)
- **NUNCA respondas basándote en suposiciones**

**Si el MCP ace-tool NO está disponible**, utiliza las herramientas nativas de Claude Code como alternativa:
1. **Glob**: Encuentra archivos relevantes por patrón (ej., `Glob("**/*.ts")`, `Glob("src/**/*.py")`)
2. **Grep**: Busca símbolos clave, nombres de función, definiciones de clase (ej., `Grep("className|functionName")`)
3. **Read**: Lee los archivos detectados para reunir el contexto completo
4. **Task (agente Explore)**: Para una exploración profunda, usa `Task` con `subagent_type: "Explore"` para rastrear el código base

#### 1.3 Verificación de Exhaustividad

- Se deben obtener **definiciones y firmas completas** de las clases, funciones y variables pertinentes.
- Si el contexto es insuficiente, activa una **recuperación recursiva**.
- Prioriza en la salida: archivo de entrada + número de línea + nombre del símbolo clave; añade fragmentos mínimos de código solo cuando sea necesario resolver ambigüedades.

#### 1.4 Alineación de Requisitos

- Si los requisitos todavía presentan ambigüedad, **DEBES** plantear preguntas orientadoras al usuario.
- Continuar hasta que los límites del requisito estén perfectamente delimitados (sin omisiones ni redundancias).

### Fase 2: Análisis Colaborativo Multimodelo

`[Modo: Análisis]`

#### 2.1 Distribuir Entradas

**Llamada en paralelo** a Codex y Antigravity (`run_in_background: true`):

Distribuye el **requisito original** (sin opiniones preestablecidas) a ambos modelos:

1. **Análisis de Backend con Codex**:
   - ROLE_FILE: `~/.claude/.ccg/prompts/codex/analyzer.md`
   - Enfoque: Factibilidad técnica, impacto en la arquitectura, consideraciones de rendimiento, riesgos potenciales
   - SALIDA: Soluciones desde múltiples perspectivas + análisis de pros y contras

2. **Análisis de Frontend con Antigravity**:
   - ROLE_FILE: `~/.claude/.ccg/prompts/antigravity/analyzer.md`
   - Enfoque: Impacto en UI/UX, experiencia de usuario, diseño visual
   - SALIDA: Soluciones desde múltiples perspectivas + análisis de pros y contras

Espera los resultados completos de ambos modelos con `TaskOutput`. **Guarda el SESSION_ID** (`CODEX_SESSION` y `ANTIGRAVITY_SESSION`).

#### 2.2 Validación Cruzada

Integra perspectivas e itera para optimizar:

1. **Identificar consensos** (señal sólida)
2. **Identificar divergencias** (requiere sopesar alternativas)
3. **Fortalezas complementarias**: La lógica de backend sigue a Codex, el diseño de frontend sigue a Antigravity
4. **Razonamiento lógico**: Elimina brechas lógicas en las soluciones propuestas

#### 2.3 (Opcional pero Recomendado) Borrador de Plan con Doble Modelo

Para mitigar el riesgo de omisiones en el plan sintetizado por Claude, se puede solicitar en paralelo a ambos modelos un "borrador de plan" (aún con **PROHIBICIÓN TOTAL** de modificar archivos):

1. **Borrador de Plan Codex** (Autoridad en Backend):
   - ROLE_FILE: `~/.claude/.ccg/prompts/codex/architect.md`
   - SALIDA: Plan paso a paso + pseudocódigo (enfoque: flujo de datos / casos extremos / manejo de errores / estrategia de pruebas)

2. **Borrador de Plan Antigravity** (Autoridad en Frontend):
   - ROLE_FILE: `~/.claude/.ccg/prompts/antigravity/architect.md`
   - SALIDA: Plan paso a paso + pseudocódigo (enfoque: arquitectura de información / interacción / accesibilidad / consistencia visual)

Espera los resultados completos de ambos modelos con `TaskOutput`, registrando las diferencias clave entre sus sugerencias.

#### 2.4 Generar el Plan de Implementación (Versión Final de Claude)

Sintetiza ambos análisis y genera el **Plan de Implementación Paso a Paso**:

```markdown
## Plan de Implementación: <Nombre de la Tarea>

### Tipo de Tarea
- [ ] Frontend (→ Antigravity)
- [ ] Backend (→ Codex)
- [ ] Fullstack (→ Paralelo)

### Solución Técnica
<Solución óptima sintetizada del análisis conjunto de Codex + Antigravity>

### Pasos de Implementación
1. <Paso 1> - Entregable esperado
2. <Paso 2> - Entregable esperado
...

### Archivos Clave
| Archivo | Operación | Descripción |
|---------|-----------|-------------|
| ruta/al/archivo.ts:L10-L50 | Modificar | Descripción |

### Riesgos y Mitigación
| Riesgo | Mitigación |
|--------|------------|

### SESSION_ID (para uso de /ccg:execute)
- CODEX_SESSION: <session_id>
- ANTIGRAVITY_SESSION: <session_id>
```

### Fin de la Fase 2: Entrega del Plan (Sin Ejecución)

**Las responsabilidades de `/ccg:plan` concluyen aquí; se DEBEN ejecutar las siguientes acciones**:

1. Presentar el plan de implementación completo al usuario (incluyendo pseudocódigo)
2. Guardar el plan en `.claude/plan/<nombre-caracteristica>.md` (extrae el nombre de la característica a partir del requisito, ej., `user-auth`, `payment-module`)
3. Mostrar el aviso en **texto en negrita** (DEBE usarse la ruta real del archivo guardado):

---
**Plan generado y guardado en `.claude/plan/nombre-real-caracteristica.md`**

**Por favor revisa el plan anterior. Puedes:**
- **Modificar el plan**: Indícame qué ajustes necesitas y actualizaré el plan
- **Ejecutar el plan**: Copia el siguiente comando en una nueva sesión

```
/ccg:execute .claude/plan/nombre-real-caracteristica.md
```
---

**NOTA**: ¡El `nombre-real-caracteristica.md` anterior DEBE reemplazarse por el nombre de archivo real guardado!

4. **Finalizar inmediatamente la respuesta actual** (Detenerse aquí. Sin más llamadas a herramientas.)

**TOTALMENTE PROHIBIDO**:
- Preguntar al usuario "S/N" y luego auto-ejecutar (la ejecución es responsabilidad exclusiva de `/ccg:execute`)
- Cualquier operación de escritura en código de producción
- Invocar automáticamente `/ccg:execute` o cualquier acción de implementación
- Seguir disparando llamadas a modelos si el usuario no ha solicitado explícitamente modificaciones

---

## Guardado de Planes

Una vez completada la planificación, guarda el plan en:

- **Primera planificación**: `.claude/plan/<nombre-caracteristica>.md`
- **Versiones iterativas**: `.claude/plan/<nombre-caracteristica>-v2.md`, `.claude/plan/<nombre-caracteristica>-v3.md`...

La escritura del archivo del plan debe completarse antes de presentarlo al usuario.

---

## Flujo de Modificación del Plan

Si el usuario solicita modificaciones al plan:

1. Ajusta el contenido del plan basándote en la retroalimentación del usuario
2. Actualiza el archivo `.claude/plan/<nombre-caracteristica>.md`
3. Vuelve a presentar el plan modificado
4. Solicita nuevamente al usuario que lo revise o ejecute

---

## Siguientes Pasos

Una vez aprobado por el usuario, ejecuta **manualmente**:

```bash
/ccg:execute .claude/plan/<nombre-caracteristica>.md
```

---

## Reglas Clave

1. **Solo planificar, sin implementación** – Este comando no ejecuta ningún cambio de código
2. **Sin preguntas de confirmación S/N** – Solo presenta el plan y deja que el usuario decida el siguiente paso
3. **Reglas de Confianza** – El Backend sigue a Codex, el Frontend sigue a Antigravity
4. Los modelos externos tienen **cero acceso de escritura en el sistema de archivos**
5. **Paso de SESSION_ID** – El plan debe incluir `CODEX_SESSION` / `ANTIGRAVITY_SESSION` al final (para uso con `/ccg:execute resume <SESSION_ID>`)
