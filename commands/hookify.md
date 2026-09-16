---
description: Crea hooks para evitar comportamientos no deseados a partir del análisis de la conversación o instrucciones explícitas
---

# Comando Hookify

Crea reglas de hook para evitar comportamientos no deseados de Claude Code analizando patrones de conversación o instrucciones explícitas del usuario.

## Uso

`/hookify [descripcion del comportamiento a evitar]`

Si no se proporcionan argumentos, analiza la conversación actual para encontrar comportamientos que valga la pena prevenir.

## Flujo de Trabajo

### Paso 1: Recopilar Información del Comportamiento

- Con argumentos: analiza la descripción del usuario del comportamiento no deseado
- Sin argumentos: utiliza el agente `conversation-analyzer` para encontrar:
  - correcciones explícitas
  - reacciones de frustración ante errores repetidos
  - cambios revertidos
  - problemas similares repetitivos

### Paso 2: Presentar Hallazgos

Mostrar al usuario:

- descripción del comportamiento
- tipo de evento propuesto
- patrón o coincidencia propuesta
- acción propuesta

### Paso 3: Generar Archivos de Regla

Para cada regla aprobada, crear un archivo en `.claude/hookify.{name}.local.md`:

```yaml
---
name: nombre-regla
enabled: true
event: bash|file|stop|prompt|all
action: block|warn
pattern: "patron regex"
---
Mensaje mostrado cuando la regla se active.
```

### Paso 4: Confirmar

Reportar las reglas creadas y cómo gestionarlas con `/hookify-list` y `/hookify-configure`.
