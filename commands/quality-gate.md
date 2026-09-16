---
description: Ejecuta el control de calidad del formateador de ECC para un solo archivo e informa los pasos de remediación.
---

# Comando Quality Gate

Punto de entrada del operador para el control de calidad del formateador que normalmente se ejecuta como el hook PostToolUse `post:quality-gate` (`scripts/hooks/quality-gate.js`).

## Cómo funciona realmente

El control de calidad es una verificación de formato para un solo archivo impulsada por la entrada del hook, no por indicadores de CLI:

- El script lee el objetivo desde el JSON de stdin del hook (`tool_input.file_path`); no toma un argumento de ruta directo en CLI.
- Los modificadores de comportamiento son variables de entorno:
  - `ECC_QUALITY_GATE_FIX=true` - aplica correcciones de formato en lugar de solo verificar.
  - `ECC_QUALITY_GATE_STRICT=true` - registra las fallas del formateador como fallas del control.
- Cobertura por tipo de archivo:
  - `.ts/.tsx/.js/.jsx/.json/.md` - `check` de Biome o Prettier `--check`, cualquiera que use el proyecto (JS/TS bajo Biome se omite aquí porque `post-edit-format` ya ejecuta `biome check --write`).
  - `.go` - `gofmt`
  - `.py` - `ruff format`
- Las comprobaciones de lint y tipos no forman parte de este control. Usa la skill `verification-loop` o las skills de verificación de lenguaje para pipelines de lint/tipos/pruebas.

## Uso

Para ejecutar el control manualmente contra un archivo, canaliza el JSON estilo hook hacia el script (configura primero las variables de entorno si deseas corregir o modo estricto):

```bash
echo '{"tool_input":{"file_path":"src/example.ts"}}' \
  | ECC_QUALITY_GATE_FIX=true node scripts/hooks/quality-gate.js
```

Luego, informa los hallazgos del formateador y los pasos de remediación concretos.

## Notas

La integración del hook se realiza a través del despachador asíncrono PostToolUse en `hooks/hooks.json`. Su registro interno conserva el identificador `post:quality-gate` y los perfiles `standard`/`strict`.

## Argumentos

$ARGUMENTS:

- `[path]` archivo opcional a verificar. El script en sí no toma argumentos de CLI; cuando se proporciona una ruta, sustitúyela como `tool_input.file_path` en el JSON de stdin mostrado arriba antes de ejecutar el comando.
