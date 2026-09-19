---
description: Aplica el flujo de trabajo de TDD para Kotlin. Escribe pruebas con Kotest primero, luego implementa. Verifica más del 80% de cobertura con Kover.
---

# Comando TDD para Kotlin

Este comando aplica la metodología de desarrollo guiado por pruebas (TDD) para código Kotlin utilizando Kotest, MockK y Kover.

## Qué hace este comando

1. **Definir Tipos/Interfaces**: Estructura primero las firmas de funciones
2. **Escribir Pruebas con Kotest**: Crea especificaciones de prueba completas (ROJO / RED)
3. **Ejecutar Pruebas**: Verifica que las pruebas fallen por la razón correcta
4. **Implementar Código**: Escribe el código mínimo necesario para pasar (VERDE / GREEN)
5. **Refactorizar**: Mejora el código manteniendo las pruebas en verde
6. **Verificar Cobertura**: Asegura un 80%+ de cobertura con Kover

## Cuándo usarlo

Usa `/kotlin-test` cuando:
- Estés implementando nuevas funciones o clases en Kotlin
- Agregues cobertura de pruebas a código Kotlin existente
- Corrijas errores (escribe la prueba fallida primero)
- Construyas lógica de negocio crítica
- Aprendas o apliques el flujo de trabajo de TDD en Kotlin

## Ciclo TDD

```
ROJO (RED)     -> Escribir prueba con Kotest que falle
VERDE (GREEN)  -> Implementar el código mínimo para pasar
REFACTOR       -> Mejorar el código manteniendo las pruebas en verde
REPETIR        -> Siguiente caso de prueba
```

## Ejemplo de Sesión

````text
Usuario: /kotlin-test Necesito una función para validar solicitudes de registro de usuario

Agente:
# Sesión TDD: Validador de Registro

## Paso 1: Definir Interfaz

```kotlin
// validator/RegistrationValidator.kt
package com.example.validator

data class RegistrationRequest(
    val name: String,
    val email: String,
    val password: String,
)

sealed class ValidationResult {
    data object Valid : ValidationResult()
    data class Invalid(val errors: List<String>) : ValidationResult()
}

fun validateRegistration(request: RegistrationRequest): ValidationResult {
    TODO("not implemented")
}
```

## Paso 2: Escribir Pruebas con Kotest (ROJO)

```kotlin
// validator/RegistrationValidatorTest.kt
package com.example.validator

import io.kotest.core.spec.style.FunSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.types.shouldBeInstanceOf

class RegistrationValidatorTest : FunSpec({
    test("registro válido retorna Valid") {
        val request = RegistrationRequest(
            name = "Alice",
            email = "alice@example.com",
            password = "SecureP@ss1",
        )

        val result = validateRegistration(request)

        result.shouldBeInstanceOf<ValidationResult.Valid>()
    }

    test("nombre en blanco retorna Invalid") {
        val request = RegistrationRequest(
            name = "",
            email = "alice@example.com",
            password = "SecureP@ss1",
        )

        val result = validateRegistration(request)

        val invalid = result.shouldBeInstanceOf<ValidationResult.Invalid>()
        invalid.errors shouldBe listOf("Name is required")
    }

    test("correo inválido retorna Invalid") {
        val request = RegistrationRequest(
            name = "Alice",
            email = "not-an-email",
            password = "SecureP@ss1",
        )

        val result = validateRegistration(request)

        val invalid = result.shouldBeInstanceOf<ValidationResult.Invalid>()
        invalid.errors shouldBe listOf("Invalid email format")
    }

    test("contraseña corta retorna Invalid") {
        val request = RegistrationRequest(
            name = "Alice",
            email = "alice@example.com",
            password = "short",
        )

        val result = validateRegistration(request)

        val invalid = result.shouldBeInstanceOf<ValidationResult.Invalid>()
        invalid.errors shouldBe listOf("Password must be at least 8 characters")
    }

    test("múltiples errores retorna todos los errores") {
        val request = RegistrationRequest(
            name = "",
            email = "bad",
            password = "short",
        )

        val result = validateRegistration(request)

        val invalid = result.shouldBeInstanceOf<ValidationResult.Invalid>()
        invalid.errors.size shouldBe 3
    }
})
```

## Paso 3: Ejecutar Pruebas - Verificar FALLA

```bash
$ ./gradlew test

RegistrationValidatorTest > valid registration returns Valid FAILED
  kotlin.NotImplementedError: An operation is not implemented

FAILED (5 tests, 0 passed, 5 failed)
```

✓ Las pruebas fallan como se esperaba (NotImplementedError).

## Paso 4: Implementar Código Mínimo (VERDE)

```kotlin
// validator/RegistrationValidator.kt
package com.example.validator

private val EMAIL_REGEX = Regex("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")
private const val MIN_PASSWORD_LENGTH = 8

fun validateRegistration(request: RegistrationRequest): ValidationResult {
    val errors = buildList {
        if (request.name.isBlank()) add("Name is required")
        if (!EMAIL_REGEX.matches(request.email)) add("Invalid email format")
        if (request.password.length < MIN_PASSWORD_LENGTH) add("Password must be at least $MIN_PASSWORD_LENGTH characters")
    }

    return if (errors.isEmpty()) ValidationResult.Valid
    else ValidationResult.Invalid(errors)
}
```

## Paso 5: Ejecutar Pruebas - Verificar ÉXITO

```bash
$ ./gradlew test

RegistrationValidatorTest > valid registration returns Valid PASSED
RegistrationValidatorTest > blank name returns Invalid PASSED
RegistrationValidatorTest > invalid email returns Invalid PASSED
RegistrationValidatorTest > short password returns Invalid PASSED
RegistrationValidatorTest > multiple errors returns all errors PASSED

PASSED (5 tests, 5 passed, 0 failed)
```

✓ ¡Todas las pruebas pasaron!

## Paso 6: Verificar Cobertura

```bash
$ ./gradlew koverHtmlReport

Coverage: 100.0% of statements
```

✓ Cobertura: 100%

## ¡TDD Completado!
````

## Patrones de Prueba

### StringSpec (El más simple)

```kotlin
class CalculatorTest : StringSpec({
    "sumar dos números positivos" {
        Calculator.add(2, 3) shouldBe 5
    }
})
```

### BehaviorSpec (BDD)

```kotlin
class OrderServiceTest : BehaviorSpec({
    Given("una orden válida") {
        When("es realizada") {
            Then("debería ser confirmada") { /* ... */ }
        }
    }
})
```

### Pruebas Basadas en Datos (Data-Driven)

```kotlin
class ParserTest : FunSpec({
    context("entradas válidas") {
        withData("2026-01-15", "2026-12-31", "2000-01-01") { input ->
            parseDate(input).shouldNotBeNull()
        }
    }
})
```

### Pruebas de Corrutinas

```kotlin
class AsyncServiceTest : FunSpec({
    test("la obtención concurrente se completa") {
        runTest {
            val result = service.fetchAll()
            result.shouldNotBeEmpty()
        }
    }
})
```

## Comandos de Cobertura

```bash
# Ejecutar pruebas con cobertura
./gradlew koverHtmlReport

# Verificar umbrales de cobertura
./gradlew koverVerify

# Reporte XML para CI
./gradlew koverXmlReport

# Abrir reporte HTML
open build/reports/kover/html/index.html

# Ejecutar clase de prueba específica
./gradlew test --tests "com.example.UserServiceTest"

# Ejecutar con salida detallada
./gradlew test --info
```

## Objetivos de Cobertura

| Tipo de Código | Objetivo |
|----------------|----------|
| Lógica de negocio crítica | 100% |
| APIs públicas | 90%+ |
| Código general | 80%+ |
| Código generado | Excluir |

## Mejores Prácticas de TDD

**QUÉ HACER:**
- Escribir la prueba PRIMERO, antes de cualquier implementación
- Ejecutar pruebas tras cada cambio
- Usar comparadores (matchers) de Kotest para aserciones expresivas
- Usar `coEvery`/`coVerify` de MockK para funciones `suspend`
- Probar el comportamiento, no los detalles de implementación
- Incluir casos límite (vacío, null, valores máximos)

**QUÉ NO HACER:**
- Escribir implementación antes de las pruebas
- Saltar la fase ROJA
- Probar funciones privadas directamente
- Usar `Thread.sleep()` en pruebas de corrutinas
- Ignorar pruebas intermitentes

## Comandos Relacionados

- `/kotlin-build` - Corrige errores de compilación
- `/kotlin-review` - Revisa el código tras la implementación
- Skill `verification-loop` - Ejecuta el bucle de verificación completo

## Relacionado

- Skill: `skills/kotlin-testing/`
- Skill: `skills/tdd-workflow/`
