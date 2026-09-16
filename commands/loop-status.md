---
description: Inspecciona el estado del bucle activo, progreso, señales de fallo e intervención recomendada.
---

# Comando Loop Status

Inspecciona el estado del bucle activo, su progreso y señales de fallo.

Este comando de barra diagonal solo puede ejecutarse después de que la sesión actual lo desencole. Si necesitas inspeccionar una sesión atascada o secundaria, ejecuta el CLI empaquetado desde otra terminal:

```bash
npx --package ecc-universal ecc loop-status --json
```

El CLI escanea los archivos JSONL de transcripción local de Claude en `~/.claude/projects/**` y reporta llamadas obsoletas a `ScheduleWakeup` o llamadas a la herramienta `Bash` que no tengan un `tool_result` coincidente.

## Uso

`/loop-status [--watch]`

## Qué Reportar

- patrón de bucle activo
- fase actual y último punto de control exitoso
- comprobaciones fallidas (si las hay)
- desviación estimada de tiempo/costo
- intervención recomendada (continuar/pausar/detener)

## CLI Multisesión

- `ecc loop-status --json` emite un estado legible por máquina para las transcripciones locales recientes de Claude.
- `ecc loop-status --home <dir>` escanea un directorio home diferente al inspeccionar otro perfil local o espacio de trabajo montado.
- `ecc loop-status --transcript <session.jsonl>` inspecciona una transcripción directamente.
- `ecc loop-status --bash-timeout-seconds 1800` ajusta el umbral de tiempo límite para Bash estancado.
- `ecc loop-status --exit-code` finaliza con código `2` cuando se detectan señales de bucle o herramientas estancadas, o `1` cuando las transcripciones no se pueden escanear.
- `--exit-code` con `--watch` requiere `--watch-count` para que los scripts de vigilancia no esperen indefinidamente la salida del proceso.
- `ecc loop-status --watch` actualiza el estado periódicamente hasta ser interrumpido.
- `ecc loop-status --watch --watch-count 3 --exit-code` actualiza un número acotado de veces y finaliza con el estado más alto observado.
- `ecc loop-status --watch --watch-count 3` emite un flujo delimitado para scripts y traspasos de tareas.
- `ecc loop-status --watch --write-dir ~/.claude/loops` mantiene `index.json` y capturas de estado en JSON por sesión para terminales secundarias o scripts de monitoreo.

## Modo Watch

Cuando `--watch` está presente, actualiza el estado periódicamente. Con `--json`, cada actualización se emite como un objeto JSON por línea para que otra terminal o script pueda consumir el flujo.

## Archivos de Instantáneas (Snapshots)

Usa `--write-dir <dir>` cuando un proceso independiente necesite inspeccionar el estado del bucle sin esperar a que la sesión actual de Claude desencole `/loop-status`. El CLI escribe:

- `index.json` con una fila por cada sesión inspeccionada.
- `<session-id>.json` con la carga de estado completa para esa sesión.

Estos archivos son instantáneas del análisis de transcripciones locales. No controlan ni establecen tiempos límite en las llamadas a herramientas del runtime de Claude Code.

## Argumentos

$ARGUMENTS:
- `--watch` opcional
