---
description: Configura tu gestor de paquetes preferido (npm/pnpm/yarn/bun)
disable-model-invocation: true
---

# Configuración del Gestor de Paquetes (Package Manager Setup)

Configura tu gestor de paquetes preferido para este proyecto o de forma global.

## Uso

```bash
# Detectar el gestor de paquetes actual
node scripts/setup-package-manager.js --detect

# Establecer preferencia global
node scripts/setup-package-manager.js --global pnpm

# Establecer preferencia de proyecto
node scripts/setup-package-manager.js --project bun

# Listar gestores de paquetes disponibles
node scripts/setup-package-manager.js --list
```

## Prioridad de Detección

Al determinar qué gestor de paquetes usar, se comprueba el siguiente orden:

1. **Variable de entorno**: `CLAUDE_PACKAGE_MANAGER`
2. **Configuración de proyecto**: `.claude/package-manager.json`
3. **package.json**: campo `packageManager`
4. **Archivo de bloqueo (lock file)**: Presencia de package-lock.json, yarn.lock, pnpm-lock.yaml o bun.lockb
5. **Configuración global**: `~/.claude/package-manager.json`
6. **Respaldo (fallback)**: Primer gestor de paquetes disponible (pnpm > bun > yarn > npm)

## Archivos de Configuración

### Configuración Global
```json
// ~/.claude/package-manager.json
{
  "packageManager": "pnpm"
}
```

### Configuración de Proyecto
```json
// .claude/package-manager.json
{
  "packageManager": "bun"
}
```

### package.json
```json
{
  "packageManager": "pnpm@8.6.0"
}
```

## Variable de Entorno

Establece `CLAUDE_PACKAGE_MANAGER` para anular todos los demás métodos de detección:

```bash
# Windows (PowerShell)
$env:CLAUDE_PACKAGE_MANAGER = "pnpm"

# macOS/Linux
export CLAUDE_PACKAGE_MANAGER=pnpm
```

## Ejecutar la Detección

Para ver los resultados actuales de detección del gestor de paquetes, ejecuta:

```bash
node scripts/setup-package-manager.js --detect
```
