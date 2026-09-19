---
description: Recomienda el mejor nivel de modelo para la tarea actual según complejidad, riesgo y presupuesto.
---

# Comando Model Route

Recomienda el mejor nivel de modelo para la tarea actual según su complejidad y presupuesto.

## Uso

`/model-route [descripcion-tarea] [--budget low|med|high]`

## Heurística de Enrutamiento

- `haiku`: cambios mecánicos deterministas y de bajo riesgo
- `sonnet`: valor por defecto para implementación y refactorizaciones
- `opus`: arquitectura, revisión profunda, requisitos ambiguos

## Salida Requerida

- modelo recomendado
- nivel de confianza
- por qué encaja este modelo
- modelo de respaldo si el primer intento falla

## Argumentos

$ARGUMENTS:
- `[descripcion-tarea]` texto libre opcional
- `--budget low|med|high` opcional
