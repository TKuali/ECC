---
name: prune
description: Elimina instintos pendientes con más de 30 días que nunca fueron promovidos
command: true
---

# Purgar Instintos Pendientes (Prune)

Elimina los instintos pendientes caducados que se autogeneraron pero nunca fueron revisados ni promovidos.

## Implementación

Ejecuta el CLI de instintos usando la ruta raíz del plugin:

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/skills/continuous-learning-v2/scripts/instinct-cli.py" prune
```

O si `CLAUDE_PLUGIN_ROOT` no está configurado (instalación manual):

```bash
python3 ~/.claude/skills/continuous-learning-v2/scripts/instinct-cli.py prune
```

## Uso

```
/prune                    # Eliminar instintos con más de 30 días
/prune --max-age 60      # Umbral de antigüedad personalizado (días)
/prune --dry-run         # Previsualizar sin eliminar
```
