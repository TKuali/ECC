---
name: promote
description: Promueve instintos de ámbito de proyecto al ámbito global
command: true
---

# Comando Promote

Promueve instintos desde el ámbito de proyecto al ámbito global en continuous-learning-v2.

## Implementación

Ejecuta el CLI de instintos usando la ruta raíz del plugin:

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/skills/continuous-learning-v2/scripts/instinct-cli.py" promote [instinct-id] [--force] [--dry-run]
```

O si `CLAUDE_PLUGIN_ROOT` no está configurado (instalación manual):

```bash
python3 ~/.claude/skills/continuous-learning-v2/scripts/instinct-cli.py promote [instinct-id] [--force] [--dry-run]
```

## Uso

```bash
/promote                      # Autodetectar candidatos a promoción
/promote --dry-run            # Previsualizar candidatos a autopromoción
/promote --force              # Promover todos los candidatos calificados sin confirmación
/promote grep-before-edit     # Promover un instinto específico del proyecto actual
```

## Qué Hacer

1. Detectar el proyecto actual
2. Si se proporciona `instinct-id`, promover únicamente ese instinto (si está presente en el proyecto actual)
3. De lo contrario, encontrar candidatos entre proyectos que:
   - Aparezcan en al menos 2 proyectos
   - Cumplan con el umbral de confianza
4. Escribir los instintos promovidos en `~/.claude/homunculus/instincts/personal/` con `scope: global`
