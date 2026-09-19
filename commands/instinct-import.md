---
name: instinct-import
description: Importa instintos desde un archivo o URL al ámbito del proyecto o global
command: true
---

# Comando Instinct Import

## Implementación

Ejecuta el CLI de instintos usando la ruta raíz del plugin:

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/skills/continuous-learning-v2/scripts/instinct-cli.py" import <file-or-url> [--dry-run] [--force] [--min-confidence 0.7] [--scope project|global]
```

O si `CLAUDE_PLUGIN_ROOT` no está establecido (instalación manual):

```bash
python3 ~/.claude/skills/continuous-learning-v2/scripts/instinct-cli.py import <file-or-url>
```

Importa instintos desde rutas de archivos locales o URLs HTTP(S).

## Uso

```
/instinct-import team-instincts.yaml
/instinct-import https://github.com/org/repo/instincts.yaml
/instinct-import team-instincts.yaml --dry-run
/instinct-import team-instincts.yaml --scope global --force
```

## Qué Hacer

1. Obtener el archivo de instintos (ruta local o URL)
2. Analizar y validar el formato
3. Comprobar duplicados con instintos existentes
4. Fusionar o añadir nuevos instintos
5. Guardar en el directorio de instintos heredados:
   - Ámbito de proyecto: `~/.claude/homunculus/projects/<project-id>/instincts/inherited/`
   - Ámbito global: `~/.claude/homunculus/instincts/inherited/`

## Proceso de Importación

```
 Importando instintos desde: team-instincts.yaml
================================================

Se encontraron 12 instintos para importar.

Analizando conflictos...

## Nuevos Instintos (8)
Estos serán añadidos:
  ✓ use-zod-validation (confianza: 0.7)
  ✓ prefer-named-exports (confianza: 0.65)
  ✓ test-async-functions (confianza: 0.8)
  ...

## Instintos Duplicados (3)
Ya existen instintos similares:
  WARNING: prefer-functional-style
     Local: 0.8 confianza, 12 observaciones
     Importado: 0.7 confianza
     → Mantener local (mayor confianza)

  WARNING: test-first-workflow
     Local: 0.75 confianza
     Importado: 0.9 confianza
     → Actualizar al importado (mayor confianza)

¿Importar 8 nuevos, actualizar 1?
```

## Comportamiento de Fusión (Merge)

Al importar un instinto con un ID existente:
- El importado de mayor confianza se convierte en candidato de actualización
- El importado de igual o menor confianza se omite
- El usuario confirma a menos que se use `--force`

## Rastreo de Origen

Los instintos importados se marcan con:
```yaml
source: inherited
scope: project
imported_from: "team-instincts.yaml"
project_id: "a1b2c3d4e5f6"
project_name: "my-project"
```

## Banderas (Flags)

- `--dry-run`: Previsualización sin importar
- `--force`: Omitir solicitud de confirmación
- `--min-confidence <n>`: Importar únicamente instintos por encima del umbral
- `--scope <project|global>`: Seleccionar ámbito de destino (por defecto: `project`)

## Salida

Tras la importación:
```
PASS: ¡Importación completada!

Añadidos: 8 instintos
Actualizados: 1 instinto
Omitidos: 3 instintos (ya existe confianza igual o mayor)

Nuevos instintos guardados en: ~/.claude/homunculus/instincts/inherited/

Ejecuta /instinct-status para ver todos los instintos.
```
