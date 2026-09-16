---
description: Revisión exhaustiva de código Kotlin en cuanto a patrones idiomáticos, seguridad ante nulos, concurrencia con corrutinas y seguridad. Invoca al agente kotlin-reviewer.
---

# Revisión de Código Kotlin

Este comando invoca al agente **kotlin-reviewer** para una revisión de código exhaustiva y especializada en Kotlin.

## Qué hace este comando

1. **Identificar cambios en Kotlin**: Encuentra archivos `.kt` y `.kts` modificados mediante `git diff`
2. **Compilar y ejecutar análisis estático**: Ejecuta `./gradlew build`, `detekt`, `ktlintCheck`
3. **Escaneo de seguridad**: Busca inyecciones SQL/comandos y credenciales hardcodeadas
4. **Revisión de seguridad nula**: Analiza el uso de `!!`, manejo de tipos de plataforma y conversiones inseguras
5. **Revisión de corrutinas**: Comprueba concurrencia estructurada, uso de dispatchers y cancelación
6. **Generar reporte**: Categoriza problemas por severidad

## Cuándo usarlo

Usa `/kotlin-review` cuando:
- Después de escribir o modificar código Kotlin
- Antes de confirmar cambios (commit) en Kotlin
- Al revisar pull requests con código Kotlin
- Al incorporarse a un nuevo proyecto en Kotlin
- Para aprender patrones idiomáticos de Kotlin

## Categorías de Revisión

### CRÍTICO (Debe Corregirse)
- Vulnerabilidades de inyección SQL o de comandos
- Desenvolvimiento forzado `!!` sin justificación
- Violaciones de seguridad nula en tipos de plataforma
- Uso de `GlobalScope` (violación de concurrencia estructurada)
- Credenciales hardcodeadas
- Deserialización insegura

### ALTO (Debería Corregirse)
- Estado mutable donde baste el inmutable
- Llamadas bloqueantes dentro del contexto de corrutinas
- Falta de comprobaciones de cancelación en bucles largos
- Expresión `when` no exhaustiva en tipos sellados
- Funciones extensas (>50 líneas)
- Anidamiento profundo (>4 niveles)

### MEDIO (A Considerar)
- Código Kotlin no idiomático (patrones estilo Java)
- Comas finales faltantes (trailing commas)
- Mal uso o anidamiento de funciones de alcance (scope functions)
- Falta de `Sequence` para cadenas largas de operaciones en colecciones
- Tipos explícitos redundantes

## Comprobaciones Automatizadas Ejecutadas

```bash
# Comprobación de compilación
./gradlew build

# Análisis estático
./gradlew detekt

# Comprobación de formato
./gradlew ktlintCheck

# Pruebas
./gradlew test
```

## Ejemplo de Uso

````text
Usuario: /kotlin-review

Agente:
# Reporte de Revisión de Código Kotlin

## Archivos Revisados
- src/main/kotlin/com/example/service/UserService.kt (modificado)
- src/main/kotlin/com/example/routes/UserRoutes.kt (modificado)

## Resultados de Análisis Estático
✓ Compilación: Exitosa
✓ detekt: Sin problemas
ADVERTENCIA: ktlint: 2 advertencias de formato

## Problemas Encontrados

[CRITICAL] Seguridad Nula con Desenvolvimiento Forzado
Archivo: src/main/kotlin/com/example/service/UserService.kt:28
Problema: Uso de !! en resultado nullable del repositorio
```kotlin
val user = repository.findById(id)!!  // Riesgo de NullPointerException
```
Solución: Usar llamada segura con manejo de errores
```kotlin
val user = repository.findById(id)
    ?: throw UserNotFoundException("User $id not found")
```

[HIGH] Uso de GlobalScope
Archivo: src/main/kotlin/com/example/routes/UserRoutes.kt:45
Problema: Usar GlobalScope rompe la concurrencia estructurada
```kotlin
GlobalScope.launch {
    notificationService.sendWelcome(user)
}
```
Solución: Usar el scope de corrutina de la llamada
```kotlin
launch {
    notificationService.sendWelcome(user)
}
```

## Resumen
- CRITICAL: 1
- HIGH: 1
- MEDIUM: 0

Recomendación: FAIL: Bloquear fusión hasta corregir problemas CRITICAL
````

## Criterios de Aprobación

| Estado | Condición |
|--------|-----------|
| PASS: Aprobar | Sin problemas CRITICAL o HIGH |
| WARNING: Advertencia | Solo problemas MEDIUM (fusionar con precaución) |
| FAIL: Bloquear | Problemas CRITICAL o HIGH encontrados |

## Integración con Otros Comandos

- Usa `/kotlin-test` primero para asegurar que las pruebas pasen
- Usa `/kotlin-build` si ocurren errores de compilación
- Usa `/kotlin-review` antes de hacer commit
- Usa `/code-review` para aspectos generales independientes del lenguaje

## Relacionado

- Agente: `agents/kotlin-reviewer.md`
- Skills: `skills/kotlin-patterns/`, `skills/kotlin-testing/`
