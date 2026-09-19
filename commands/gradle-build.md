---
description: Corrige errores de compilación de Gradle para proyectos Android y KMP.
---

# Corrección de Compilación Gradle (Gradle Build Fix)

Corrige incrementalmente errores de compilación y ensamble de Gradle para proyectos de Android y Kotlin Multiplatform (KMP).

## Paso 1: Detectar la Configuración de Compilación

Identifica el tipo de proyecto y ejecuta la compilación adecuada:

| Indicador | Comando de Compilación |
|-----------|------------------------|
| `build.gradle.kts` + `composeApp/` (KMP) | `./gradlew composeApp:compileKotlinMetadata 2>&1` |
| `build.gradle.kts` + `app/` (Android) | `./gradlew app:compileDebugKotlin 2>&1` |
| `settings.gradle.kts` con módulos | `./gradlew assemble 2>&1` |
| Detekt configurado | `./gradlew detekt 2>&1` |

Verifica también `gradle.properties` y `local.properties` para la configuración.

## Paso 2: Analizar y Agrupar Errores

1. Ejecuta el comando de compilación y captura la salida.
2. Separa los errores de compilación de Kotlin de los errores de configuración de Gradle.
3. Agrupa por módulo y ruta de archivo.
4. Ordena: primero errores de configuración, luego errores de compilación por orden de dependencia.

## Paso 3: Bucle de Corrección

Para cada error:

1. **Leer el archivo** — Contexto completo alrededor de la línea del error.
2. **Diagnosticar** — Categorías comunes:
   - Importación faltante o referencia no resuelta.
   - Discordancia de tipos o tipos incompatibles.
   - Dependencia faltante en `build.gradle.kts`.
   - Discrepancia entre expect/actual (KMP).
   - Error del compilador de Compose.
3. **Corregir mínimamente** — El cambio más pequeño que resuelva el error.
4. **Volver a compilar** — Verifica la solución y revisa si surgen nuevos errores.
5. **Continuar** — Pasa al siguiente error.

## Paso 4: Medidas de Protección (Guardrails)

Detente y consulta al usuario si:
- La corrección introduce más errores de los que resuelve.
- El mismo error persiste tras 3 intentos.
- El error requiere añadir nuevas dependencias o modificar la estructura modular.
- La sincronización de Gradle falla por sí misma (error en la fase de configuración).
- El error se encuentra en código generado (Room, SQLDelight, KSP).

## Paso 5: Resumen

Informa:
- Errores corregidos (módulo, archivo, descripción).
- Errores restantes.
- Nuevos errores introducidos (debe ser cero).
- Siguientes pasos sugeridos.

## Correcciones Comunes de Gradle/KMP

| Error | Solución |
|-------|----------|
| Referencia no resuelta en `commonMain` | Verifica si la dependencia está en `commonMain.dependencies {}` |
| Declaración expect sin actual | Añade la implementación `actual` en cada conjunto de fuentes de plataforma |
| Discordancia de versión del compilador Compose | Alinea las versiones del compilador de Kotlin y Compose en `libs.versions.toml` |
| Clase duplicada | Busca dependencias en conflicto con `./gradlew dependencies` |
| Error de KSP | Ejecuta `./gradlew kspCommonMainKotlinMetadata` para regenerar |
| Problema de caché de configuración | Revisa entradas de tareas no serializables |
