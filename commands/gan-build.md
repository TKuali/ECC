---
description: Ejecuta un bucle de construcción generador/evaluador para tareas de implementación con iteraciones delimitadas y puntuación.
---

# Construcción de Entorno Estilo GAN (GAN-Style Harness Build)

Analiza lo siguiente a partir de $ARGUMENTS:
1. `brief` — descripción en una línea del usuario sobre qué construir
2. `--max-iterations N` — (opcional, por defecto 15) ciclos máximos generador-evaluador
3. `--pass-threshold N` — (opcional, por defecto 7.0) puntuación ponderada para aprobar
4. `--skip-planner` — (opcional) omitir el planificador, asumir que spec.md ya existe
5. `--eval-mode MODE` — (opcional, por defecto "playwright") uno de: playwright, screenshot, code-only

Este comando orquesta un bucle de compilación de tres agentes inspirado en el artículo de diseño de entornos de marzo de 2026 de Anthropic.

### Fase 0: Configuración
1. Crear el directorio `gan-harness/` en la raíz del proyecto
2. Crear subdirectorios: `gan-harness/feedback/`, `gan-harness/screenshots/`
3. Inicializar git si aún no está inicializado
4. Registrar hora de inicio y configuración

### Fase 1: Planificación (Agente Planner)
A menos que `--skip-planner` esté definido:
1. Lanzar el agente `gan-planner` mediante la herramienta Task con el resumen del usuario
2. Esperar a que genere `gan-harness/spec.md` y `gan-harness/eval-rubric.md`
3. Mostrar el resumen de la especificación al usuario
4. Proceder a la Fase 2

### Fase 2: Bucle Generador-Evaluador
```
iteration = 1
while iteration <= max_iterations:

    # GENERAR
    Lanzar agente gan-generator mediante la herramienta Task:
    - Leer spec.md
    - Si iteration > 1: leer feedback/feedback-{iteration-1}.md
    - Construir/mejorar la aplicación
    - Asegurar que el servidor de desarrollo esté corriendo
    - Confirmar cambios (commit)

    # Esperar a que el generador finalice

    # EVALUAR
    Lanzar agente gan-evaluator mediante la herramienta Task:
    - Leer eval-rubric.md y spec.md
    - Probar la aplicación en vivo (modo: playwright/screenshot/code-only)
    - Puntuar contra la rúbrica
    - Escribir feedback en feedback/feedback-{iteration}.md

    # Esperar a que el evaluador finalice

    # COMPROBAR PUNTUACIÓN
    Leer feedback/feedback-{iteration}.md
    Extraer puntuación total ponderada

    if score >= pass_threshold:
        Registrar "APROBADO en iteración {iteration} con puntuación {score}"
        Break

    if iteration >= 3 y la puntuación no ha mejorado en las últimas 2 iteraciones:
        Registrar "ESTANCAMIENTO detectado — deteniendo anticipadamente"
        Break

    iteration += 1
```

### Fase 3: Resumen
1. Leer todos los archivos de feedback
2. Mostrar puntuaciones finales e historial de iteraciones
3. Mostrar progresión de puntuación: `iteración 1: 4.2 → iteración 2: 5.8 → ... → iteración N: 7.5`
4. Listar cualquier problema restante de la evaluación final
5. Reportar tiempo total y costo estimado

### Salida

```markdown
## Reporte de Construcción del Entorno GAN

**Resumen:** [prompt original]
**Resultado:** PASS/FAIL
**Iteraciones:** N / max
**Puntuación Final:** X.X / 10

### Progresión de Puntuación
| Iter | Diseño | Originalidad | Calidad Técnica | Funcionalidad | Total |
|---|---|---|---|---|---|
| 1 | ... | ... | ... | ... | X.X |
| 2 | ... | ... | ... | ... | X.X |
| N | ... | ... | ... | ... | X.X |

### Problemas Restantes
- [Cualquier problema de la evaluación final]

### Archivos Creados
- gan-harness/spec.md
- gan-harness/eval-rubric.md
- gan-harness/feedback/feedback-001.md hasta feedback-NNN.md
- gan-harness/generator-state.md
- gan-harness/build-report.md
```

Escribir el informe completo en `gan-harness/build-report.md`.
