---
description: Ejecuta un plan de implementación con rigurosos bucles de validación
argument-hint: <ruta/hacia/plan.md>
---

> Adaptado de PRPs-agentic-eng por Wirasm. Parte de la serie de flujos de trabajo PRP.

# Implementación PRP (PRP Implement)

Ejecuta un archivo de plan paso a paso con validación continua. Cada cambio se verifica inmediatamente — nunca acumules un estado roto.

**Filosofía Central**: Los bucles de validación detectan errores temprano. Ejecuta comprobaciones tras cada cambio. Corrige los problemas inmediatamente.

**Regla de Oro**: Si una validación falla, corrígela antes de continuar. Nunca acumules un estado roto.

---

## Fase 0 — DETECTAR

### Detección de Gestor de Paquetes

| Archivo Existente | Gestor de Paquetes | Ejecutor |
|---|---|---|
| `bun.lockb` | bun | `bun run` |
| `pnpm-lock.yaml` | pnpm | `pnpm run` |
| `yarn.lock` | yarn | `yarn` |
| `package-lock.json` | npm | `npm run` |
| `pyproject.toml` o `requirements.txt` | uv / pip | `uv run` o `python -m` |
| `Cargo.toml` | cargo | `cargo` |
| `go.mod` | go | `go` |

### Scripts de Validación

Revisa `package.json` (o equivalente) para ver scripts disponibles:

```bash
# Para proyectos Node.js
cat package.json | grep -A 20 '"scripts"'
```

Anota los comandos disponibles para: type-check, lint, test, build.

---

## Fase 1 — CARGAR (LOAD)

Lee el archivo del plan:

```bash
cat "$ARGUMENTS"
```

Extrae estas secciones del plan:
- **Resumen** — Qué se está construyendo
- **Patrones a Reflejar** — Convenciones de código a seguir
- **Archivos a Modificar** — Qué crear o modificar
- **Tareas Paso a Paso** — Secuencia de implementación
- **Comandos de Validación** — Cómo verificar la corrección
- **Criterios de Aceptación** — Definición de terminado (DoD)

Si el archivo no existe o no es un plan válido:
```
Error: Archivo de plan no encontrado o inválido.
Ejecuta /prp-plan <descripción-de-característica> para crear un plan primero.
```

**PUNTO DE CONTROL**: Plan cargado. Todas las secciones identificadas. Tareas extraídas.

---

## Fase 2 — PREPARAR (PREPARE)

### Estado de Git

```bash
git branch --show-current
git status --porcelain
```

### Decisión de Rama

| Estado Actual | Acción |
|---|---|
| En rama de característica | Usar la rama actual |
| En main, árbol limpio | Crear rama de característica: `git checkout -b feat/{plan-name}` |
| En main, árbol sucio | **DETENER** — Pedir al usuario guardar en stash o hacer commit primero |
| En un worktree de git para esta característica | Usar el worktree |

### Sincronizar Remoto

```bash
git pull --rebase origin $(git branch --show-current) 2>/dev/null || true
```

**PUNTO DE CONTROL**: En la rama correcta. Árbol de trabajo listo. Remoto sincronizado.

---

## Fase 3 — EJECUTAR (EXECUTE)

Procesa cada tarea del plan de manera secuencial.

### Bucle por Tarea

Para cada tarea en **Tareas Paso a Paso**:

1. **Leer referencia MIRROR** — Abre el archivo de patrón referenciado en el campo MIRROR de la tarea. Comprende la convención antes de escribir código.

2. **Implementar** — Escribe el código siguiendo el patrón con exactitud. Aplica las advertencias GOTCHA. Usa los IMPORTS especificados.

3. **Validar inmediatamente** — Tras CADA cambio de archivo:
   ```bash
   # Ejecuta verificación de tipos (ajusta el comando según el proyecto)
   [comando de type-check de la Fase 0]
   ```
   Si el chequeo de tipos falla → corrige el error antes de pasar al siguiente archivo.

4. **Registrar progreso** — Registra: `[hecho] Tarea N: [nombre de tarea] — completada`

### Manejo de Desviaciones

Si la implementación debe desviarse del plan:
- Anota **QUÉ** cambió
- Anota **POR QUÉ** cambió
- Continúa con el enfoque corregido
- Estas desviaciones se incluirán en el reporte final

**PUNTO DE CONTROL**: Todas las tareas ejecutadas. Desviaciones registradas.

---

## Fase 4 — VALIDAR (VALIDATE)

Ejecuta todos los niveles de validación del plan. Corrige problemas en cada nivel antes de avanzar.

### Nivel 1: Análisis Estático

```bash
# Comprobación de tipos — se requieren cero errores
[comando de type-check del proyecto]

# Linting — corregir automáticamente donde sea posible
[comando de lint del proyecto]
[comando de lint-fix del proyecto]
```

Si quedan errores de lint tras la corrección automática, corrígelos manualmente.

### Nivel 2: Pruebas Unitarias

Escribe pruebas para cada nueva función (según lo indicado en la Estrategia de Pruebas del plan).

```bash
[comando de prueba del proyecto para el área afectada]
```

- Cada función necesita al menos una prueba
- Cubre los casos límite listados en el plan
- Si una prueba falla → corrige la implementación (no la prueba, a menos que la prueba sea incorrecta)

### Nivel 3: Comprobación de Compilación

```bash
[comando de compilación del proyecto]
```

La compilación debe tener éxito con cero errores.

### Nivel 4: Pruebas de Integración (si corresponde)

```bash
# Iniciar servidor, ejecutar pruebas, detener servidor
[comando de servidor de desarrollo del proyecto] &
SERVER_PID=$!

# Esperar a que el servidor esté listo (ajustar puerto según corresponda)
SERVER_READY=0
for i in $(seq 1 30); do
  if curl -sf http://localhost:PORT/health >/dev/null 2>&1; then
    SERVER_READY=1
    break
  fi
  sleep 1
done

if [ "$SERVER_READY" -ne 1 ]; then
  kill "$SERVER_PID" 2>/dev/null || true
  echo "ERROR: El servidor no inició en 30s" >&2
  exit 1
fi

[comando de pruebas de integración]
TEST_EXIT=$?

kill "$SERVER_PID" 2>/dev/null || true
wait "$SERVER_PID" 2>/dev/null || true

exit "$TEST_EXIT"
```

### Nivel 5: Pruebas de Casos Límite

Revisa los casos límite de la lista de verificación de la Estrategia de Pruebas del plan.

**PUNTO DE CONTROL**: Los 5 niveles de validación aprobados. Cero errores.

---

## Fase 5 — REPORTAR (REPORT)

### Crear Reporte de Implementación

```bash
mkdir -p .claude/PRPs/reports
```

Escribe el reporte en `.claude/PRPs/reports/{plan-name}-report.md`:

```markdown
# Reporte de Implementación: [Nombre de la Característica]

## Resumen
[Qué se implementó]

## Estimación vs Realidad

| Métrica | Previsto (Plan) | Real |
|---|---|---|
| Complejidad | [del plan] | [real] |
| Confianza | [del plan] | [real] |
| Archivos Modificados | [del plan] | [conteo real] |

## Tareas Completadas

| # | Tarea | Estado | Notas |
|---|---|---|---|
| 1 | [nombre de tarea] | [hecho] Completo | |
| 2 | [nombre de tarea] | [hecho] Completo | Desviado — [motivo] |

## Resultados de Validación

| Nivel | Estado | Notas |
|---|---|---|
| Análisis Estático | [hecho] Aprobado | |
| Pruebas Unitarias | [hecho] Aprobado | N pruebas escritas |
| Compilación | [hecho] Aprobado | |
| Integración | [hecho] Aprobado | o N/A |
| Casos Límite | [hecho] Aprobado | |

## Archivos Modificados

| Archivo | Acción | Líneas |
|---|---|---|
| `ruta/al/archivo` | CREADO | +N |
| `ruta/al/archivo` | ACTUALIZADO | +N / -M |

## Desviaciones del Plan
[Listar cualquier desviación con QUÉ y POR QUÉ, o "Ninguna"]

## Problemas Encontrados
[Listar cualquier problema y cómo se resolvió, o "Ninguno"]

## Pruebas Escritas

| Archivo de Prueba | Pruebas | Cobertura |
|---|---|---|
| `ruta/a/prueba` | N pruebas | [área cubierta] |

## Siguientes Pasos
- [ ] Revisión de código mediante `/code-review`
- [ ] Crear PR mediante `/prp-pr`
```

### Actualizar PRD (si corresponde)

Si esta implementación correspondió a una fase de un PRD:
1. Actualiza el estado de la fase de `in-progress` a `complete`
2. Añade la ruta del reporte como referencia

### Archivar Plan

```bash
mkdir -p .claude/PRPs/plans/completed
mv "$ARGUMENTS" .claude/PRPs/plans/completed/
```

**PUNTO DE CONTROL**: Reporte creado. PRD actualizado. Plan archivado.

---

## Fase 6 — SALIDA

Informa al usuario:

```
## Implementación Completada

- **Plan**: [ruta del archivo de plan] → archivado en completed/
- **Rama**: [nombre de la rama actual]
- **Estado**: [hecho] Todas las tareas completadas

### Resumen de Validación

| Verificación | Estado |
|---|---|
| Verificación de Tipos | [hecho] |
| Lint | [hecho] |
| Pruebas | [hecho] (N escritas) |
| Compilación | [hecho] |
| Integración | [hecho] o N/A |

### Archivos Modificados
- [N] archivos creados, [M] archivos actualizados

### Desviaciones
[Resumen o "Ninguna — implementado exactamente según el plan"]

### Artefactos
- Reporte: `.claude/PRPs/reports/{name}-report.md`
- Plan Archivado: `.claude/PRPs/plans/completed/{name}.plan.md`

### Progreso del PRD (si corresponde)
| Fase | Estado |
|---|---|
| Fase 1 | [hecho] Completo |
| Fase 2 | [siguiente] |
| ... | ... |

> Siguiente paso: Ejecuta `/prp-pr` para crear un pull request, o `/code-review` para revisar los cambios primero.
```

---

## Manejo de Fallos

### Falla la Comprobación de Tipos
1. Lee con atención el mensaje de error
2. Corrige el error de tipo en el archivo fuente
3. Vuelve a ejecutar la comprobación de tipos
4. Continúa solo cuando esté limpio

### Fallan las Pruebas
1. Identifica si el error está en la implementación o en la prueba
2. Corrige la causa raíz (usualmente la implementación)
3. Vuelve a ejecutar las pruebas
4. Continúa solo cuando estén en verde

### Falla el Lint
1. Ejecuta la corrección automática primero
2. Si persisten errores, corrígelos manualmente
3. Vuelve a ejecutar lint
4. Continúa solo cuando esté limpio

### Falla la Compilación
1. Usualmente es un problema de tipos o importaciones — revisa el mensaje de error
2. Corrige el archivo afectado
3. Vuelve a compilar
4. Continúa solo cuando sea exitoso

### Fallan las Pruebas de Integración
1. Verifica que el servidor haya iniciado correctamente
2. Verifica que el endpoint/ruta exista
3. Comprueba que el formato de la solicitud coincida con el esperado
4. Corrige y vuelve a ejecutar

---

## Criterios de Éxito

- **TAREAS_COMPLETAS**: Todas las tareas del plan ejecutadas
- **TIPOS_PASAN**: Cero errores de tipos
- **LINT_PASA**: Cero errores de lint
- **PRUEBAS_PASAN**: Todas las pruebas en verde, nuevas pruebas escritas
- **COMPILACIÓN_PASA**: Compilación exitosa
- **REPORTE_CREADO**: Reporte de implementación guardado
- **PLAN_ARCHIVADO**: Plan movido a `completed/`

---

## Siguientes Pasos

- Ejecuta `/code-review` para revisar cambios antes de hacer commit
- Ejecuta `/prp-commit` para hacer commit con un mensaje descriptivo
- Ejecuta `/prp-pr` para crear un pull request
- Ejecuta `/prp-plan <siguiente-fase>` si el PRD contiene más fases
