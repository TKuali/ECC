---
description: Corrige incrementalmente errores de compilación de Kotlin/Gradle, advertencias del compilador y problemas de dependencias. Invoca al agente kotlin-build-resolver para correcciones quirúrgicas mínimas.
---

# Compilación y Corrección de Kotlin

Este comando invoca al agente **kotlin-build-resolver** para corregir incrementalmente errores de compilación de Kotlin con cambios mínimos.

## Qué hace este comando

1. **Ejecutar diagnósticos**: Ejecuta `./gradlew build`, `detekt`, `ktlintCheck`
2. **Analizar errores**: Agrupa por archivo y ordena por severidad
3. **Corregir incrementalmente**: Un error a la vez
4. **Verificar cada corrección**: Vuelve a compilar tras cada cambio
5. **Reportar resumen**: Muestra lo que se corrigió y lo que queda pendiente

## Cuándo usarlo

Usa `/kotlin-build` cuando:
- `./gradlew build` falle con errores
- El compilador de Kotlin reporte errores
- `./gradlew detekt` reporte violaciones
- La resolución de dependencias de Gradle falle
- Después de traer cambios (pull) que rompen la compilación

## Comandos de diagnóstico ejecutados

```bash
# Verificación principal de compilación
./gradlew build 2>&1

# Análisis estático
./gradlew detekt 2>&1 || echo "detekt no configurado"
./gradlew ktlintCheck 2>&1 || echo "ktlint no configurado"

# Problemas de dependencias
./gradlew dependencies --configuration runtimeClasspath 2>&1 | head -100

# Actualización profunda opcional cuando los cachés o metadatos de dependencias sean sospechosos
./gradlew build --refresh-dependencies
```

## Ejemplo de Sesión

````text
Usuario: /kotlin-build

Agente:
# Resolución de Compilación Kotlin

## Diagnósticos Iniciales

```bash
$ ./gradlew build
e: src/main/kotlin/com/example/service/UserService.kt:25:15 Unresolved reference: UserRepository
e: src/main/kotlin/com/example/routes/UserRoutes.kt:42:9 Type mismatch: inferred type is String but Int was expected
e: src/main/kotlin/com/example/routes/UserRoutes.kt:58:5 'when' expression must be exhaustive
```

Errores encontrados: 3

## Corrección 1: Referencia no resuelta

Archivo: src/main/kotlin/com/example/service/UserService.kt:25
Error: Unresolved reference: UserRepository
Causa: Importación faltante

```kotlin
// Importación añadida
import com.example.repository.UserRepository
```

```bash
$ ./gradlew build
# 2 errores restantes
```

## Corrección 2: Discordancia de tipos

Archivo: src/main/kotlin/com/example/routes/UserRoutes.kt:42
Error: Type mismatch: inferred type is String but Int was expected

```kotlin
// Cambiado
val count = call.parameters["count"]
// A
val count = call.parameters["count"]?.toIntOrNull()
    ?: return@get call.respond(HttpStatusCode.BadRequest, "Invalid count")
```

```bash
$ ./gradlew build
# 1 error restante
```

## Corrección 3: Expresión When no exhaustiva

Archivo: src/main/kotlin/com/example/routes/UserRoutes.kt:58
Error: 'when' expression must be exhaustive

```kotlin
// Rama faltante añadida
when (user.role) {
    Role.ADMIN -> handleAdmin(user)
    Role.USER -> handleUser(user)
    Role.MODERATOR -> handleModerator(user) // Añadido
}
```

```bash
$ ./gradlew build
# ¡Compilación exitosa!
```

## Verificación Final

```bash
$ ./gradlew detekt
# Sin problemas

$ ./gradlew test
# Todas las pruebas pasaron
```

## Resumen

| Métrica | Cantidad |
|---------|----------|
| Errores de compilación corregidos | 3 |
| Problemas de detekt corregidos | 0 |
| Archivos modificados | 2 |
| Problemas restantes | 0 |

Estado de compilación: PASS: ÉXITO
````

## Errores Comunes Corregidos

| Error | Solución Típica |
|-------|-----------------|
| `Unresolved reference: X` | Añadir import o dependencia |
| `Type mismatch` | Corregir conversión de tipo o asignación |
| `'when' must be exhaustive` | Añadir ramas faltantes de clases selladas |
| `Suspend function can only be called from coroutine` | Añadir modificador `suspend` |
| `Smart cast impossible` | Usar `val` local o `let` |
| `None of the following candidates is applicable` | Corregir tipos de argumentos |
| `Could not resolve dependency` | Corregir versión o añadir repositorio |

## Estrategia de Corrección

1. **Errores de compilación primero** - El código debe compilar
2. **Violaciones de detekt segundo** - Corregir problemas de calidad de código
3. **Advertencias de ktlint tercero** - Corregir formato
4. **Una corrección a la vez** - Verificar cada cambio
5. **Cambios mínimos** - No refactorizar, solo corregir

## Condiciones de Parada

El agente se detendrá y reportará si:
- El mismo error persiste tras 3 intentos
- La solución introduce más errores
- Requiere cambios arquitectónicos
- Faltan dependencias externas

## Comandos Relacionados

- `/kotlin-test` - Ejecuta pruebas tras compilar con éxito
- `/kotlin-review` - Revisa la calidad del código
- Skill `verification-loop` - Bucle completo de verificación

## Relacionado

- Agente: `agents/kotlin-build-resolver.md`
- Skill: `skills/kotlin-patterns/`
