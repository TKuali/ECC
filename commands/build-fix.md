---
description: Detecta el sistema de compilación del proyecto y corrige incrementalmente errores de compilación y tipos con cambios mínimos y seguros.
---

# Compilar y Corregir (Build and Fix)

Corrige incrementalmente errores de compilación y de tipos con cambios mínimos y seguros.

## Paso 1: Detectar el Sistema de Compilación

Identifica la herramienta de compilación del proyecto y ejecuta la compilación:

| Indicador | Comando de Compilación |
|-----------|------------------------|
| `package.json` con script `build` | `npm run build` o `pnpm build` |
| `tsconfig.json` (solo TypeScript) | `npx tsc --noEmit` |
| `Cargo.toml` | `cargo build 2>&1` |
| `pom.xml` | `mvn compile` |
| `build.gradle` | `./gradlew compileJava` |
| `go.mod` | `go build ./...` |
| `pyproject.toml` | `python -m compileall -q .` o `mypy .` |

## Paso 2: Analizar y Agrupar Errores

1. Ejecuta el comando de compilación y captura stderr.
2. Agrupa los errores por ruta de archivo.
3. Ordena por orden de dependencia (corrige importaciones/tipos antes que errores de lógica).
4. Cuenta el total de errores para el seguimiento del progreso.

## Paso 3: Bucle de Corrección (Un Error a la Vez)

Para cada error:

1. **Leer el archivo** — Usa la herramienta de lectura para ver el contexto del error (10 líneas alrededor del error).
2. **Diagnosticar** — Identifica la causa raíz (importación faltante, tipo incorrecto, error de sintaxis).
3. **Corregir mínimamente** — Usa la herramienta de edición para aplicar el cambio más pequeño que resuelva el error.
4. **Volver a compilar** — Verifica que el error haya desaparecido y que no se hayan introducido nuevos errores.
5. **Avanzar al siguiente** — Continúa con los errores restantes.

## Paso 4: Medidas de Protección (Guardrails)

Detente y consulta al usuario si:
- Una corrección introduce **más errores de los que resuelve**.
- El **mismo error persiste tras 3 intentos** (probablemente sea un problema más profundo).
- La corrección requiere **cambios arquitectónicos** (no solo una corrección de compilación).
- Los errores de compilación se deben a **dependencias faltantes** (se requiere `npm install`, `cargo add`, etc.).

## Paso 5: Resumen

Muestra los resultados:
- Errores corregidos (con rutas de archivo).
- Errores restantes (si los hay).
- Nuevos errores introducidos (debería ser cero).
- Pasos siguientes sugeridos para problemas no resueltos.

## Estrategias de Recuperación

| Situación | Acción |
|-----------|--------|
| Módulo/importación faltante | Verifica si el paquete está instalado; sugiere el comando de instalación |
| Discordancia de tipos | Lee ambas definiciones de tipos; ajusta el tipo más específico |
| Dependencia circular | Identifica el ciclo con el gráfico de importaciones; sugiere extracción |
| Conflicto de versiones | Revisa `package.json` / `Cargo.toml` para restricciones de versiones |
| Mala configuración de la herramienta de compilación | Lee el archivo de configuración; compara con los valores predeterminados funcionales |

Corrige un error a la vez por seguridad. Prefiere diffs mínimos en lugar de refactorizaciones grandes.
