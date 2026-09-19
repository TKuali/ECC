---
name: projects
description: Lista proyectos conocidos y sus estadísticas de instintos
command: true
---

# Comando Projects

Lista las entradas del registro de proyectos y los conteos de instintos/observaciones por proyecto para continuous-learning-v2.

## Implementación

Ejecuta el CLI de instintos usando la ruta raíz del plugin:

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/skills/continuous-learning-v2/scripts/instinct-cli.py" projects
```

O si `CLAUDE_PLUGIN_ROOT` no está configurado (instalación manual):

```bash
python3 ~/.claude/skills/continuous-learning-v2/scripts/instinct-cli.py projects
```

## Uso

```bash
/projects
```

## Qué Hacer

1. Leer `~/.claude/homunculus/projects.json`
2. Para cada proyecto, mostrar:
   - Nombre del proyecto, id, raíz, remoto
   - Conteos de instintos personales y heredados
   - Conteo de eventos de observación
   - Marca temporal de última visualización
3. También mostrar los totales globales de instintos
