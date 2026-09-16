---
description: Aplica el flujo de trabajo de TDD para C++. Escribe pruebas de GoogleTest primero, luego implementa. Verifica la cobertura con gcov/lcov.
---

# Comando TDD para C++

Este comando aplica la metodología de desarrollo guiado por pruebas (TDD) para código C++ utilizando GoogleTest/GoogleMock junto con CMake/CTest.

## Qué hace este comando

1. **Definir Interfaces**: Estructura primero las firmas de clases y funciones
2. **Escribir Pruebas**: Crea casos de prueba completos con GoogleTest (ROJO / RED)
3. **Ejecutar Pruebas**: Verifica que las pruebas fallen por la razón correcta
4. **Implementar Código**: Escribe el código mínimo necesario para pasar (VERDE / GREEN)
5. **Refactorizar**: Mejora el código manteniendo las pruebas en verde
6. **Verificar Cobertura**: Asegura un 80%+ de cobertura

## Cuándo usarlo

Usa `/cpp-test` cuando:
- Estés implementando nuevas funciones o clases en C++
- Agregues cobertura de pruebas a código existente
- Corrijas errores (escribe la prueba que falla primero)
- Construyas lógica de negocio crítica
- Aprendas o apliques el flujo de trabajo de TDD en C++

## Ciclo TDD

```
ROJO (RED)     → Escribir prueba con GoogleTest que falle
VERDE (GREEN)  → Implementar el código mínimo para pasar
REFACTOR       → Mejorar el código manteniendo las pruebas en verde
REPETIR        → Siguiente caso de prueba
```

## Ejemplo de Sesión

````text
Usuario: /cpp-test Necesito una función para validar direcciones de correo electrónico

Agente:
# Sesión TDD: Validador de Correo

## Paso 1: Definir Interfaz

```cpp
// validator/email.hpp
#pragma once
#include <string>
#include <expected>

enum class EmailError {
    Empty,
    InvalidFormat
};

std::expected<void, EmailError> validate_email(const std::string& email);
```

## Paso 2: Escribir Pruebas (ROJO)

```cpp
// validator/email_test.cpp
#include <gtest/gtest.h>
#include "email.hpp"

TEST(ValidateEmail, AcceptsSimpleEmail) {
    auto result = validate_email("user@example.com");
    EXPECT_TRUE(result.has_value());
}

TEST(ValidateEmail, AcceptsSubdomain) {
    EXPECT_TRUE(validate_email("user@mail.example.com").has_value());
}

TEST(ValidateEmail, AcceptsPlus) {
    EXPECT_TRUE(validate_email("user+tag@example.com").has_value());
}

TEST(ValidateEmail, RejectsEmpty) {
    auto result = validate_email("");
    ASSERT_FALSE(result.has_value());
    EXPECT_EQ(result.error(), EmailError::Empty);
}

TEST(ValidateEmail, RejectsNoAtSign) {
    EXPECT_FALSE(validate_email("userexample.com").has_value());
}

TEST(ValidateEmail, RejectsNoDomain) {
    EXPECT_FALSE(validate_email("user@").has_value());
}

TEST(ValidateEmail, RejectsNoLocalPart) {
    EXPECT_FALSE(validate_email("@example.com").has_value());
}
```

## Paso 3: Ejecutar Pruebas - Verificar FALLA

```bash
$ cmake --build build && ctest --test-dir build --output-on-failure

1/1 Test #1: email_validator_test .....***Failed
    --- undefined reference to `validate_email`

FAIL
```

✓ Las pruebas fallan como se esperaba (no implementado).

## Paso 4: Implementar Código Mínimo (VERDE)

```cpp
// validator/email.cpp
#include "email.hpp"
#include <regex>

std::expected<void, EmailError> validate_email(const std::string& email) {
    if (email.empty()) {
        return std::unexpected(EmailError::Empty);
    }
    static const std::regex pattern(R"([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})");
    if (!std::regex_match(email, pattern)) {
        return std::unexpected(EmailError::InvalidFormat);
    }
    return {};
}
```

## Paso 5: Ejecutar Pruebas - Verificar ÉXITO

```bash
$ cmake --build build && ctest --test-dir build --output-on-failure

1/1 Test #1: email_validator_test .....   Passed    0.01 sec

100% tests passed.
```

✓ ¡Todas las pruebas pasan!

## Paso 6: Verificar Cobertura

```bash
$ cmake -DCMAKE_CXX_FLAGS="--coverage" -B build && cmake --build build
$ ctest --test-dir build
$ lcov --capture --directory build --output-file coverage.info
$ lcov --list coverage.info

validator/email.cpp     | 100%
```

✓ Cobertura: 100%

## ¡TDD Completado!
````

## Patrones de Prueba

### Pruebas Básicas
```cpp
TEST(SuiteName, TestName) {
    EXPECT_EQ(add(2, 3), 5);
    EXPECT_NE(result, nullptr);
    EXPECT_TRUE(is_valid);
    EXPECT_THROW(func(), std::invalid_argument);
}
```

### Accesorios de Prueba (Fixtures)
```cpp
class DatabaseTest : public ::testing::Test {
protected:
    void SetUp() override { db_ = create_test_db(); }
    void TearDown() override { db_.reset(); }
    std::unique_ptr<Database> db_;
};

TEST_F(DatabaseTest, InsertsRecord) {
    db_->insert("key", "value");
    EXPECT_EQ(db_->get("key"), "value");
}
```

### Pruebas Parametrizadas
```cpp
class PrimeTest : public ::testing::TestWithParam<std::pair<int, bool>> {};

TEST_P(PrimeTest, ChecksPrimality) {
    auto [input, expected] = GetParam();
    EXPECT_EQ(is_prime(input), expected);
}

INSTANTIATE_TEST_SUITE_P(Primes, PrimeTest, ::testing::Values(
    std::make_pair(2, true),
    std::make_pair(4, false),
    std::make_pair(7, true)
));
```

## Comandos de Cobertura

```bash
# Compilar con cobertura
cmake -DCMAKE_CXX_FLAGS="--coverage" -DCMAKE_EXE_LINKER_FLAGS="--coverage" -B build

# Ejecutar pruebas
cmake --build build && ctest --test-dir build

# Generar reporte de cobertura
lcov --capture --directory build --output-file coverage.info
lcov --remove coverage.info '/usr/*' --output-file coverage.info
genhtml coverage.info --output-directory coverage_html
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
- Ejecutar pruebas después de cada cambio
- Usar `EXPECT_*` (continúa la ejecución) sobre `ASSERT_*` (se detiene) cuando sea apropiado
- Probar el comportamiento, no los detalles de implementación
- Incluir casos extremos (vacío, nulo, valores máximos, condiciones de borde)

**QUÉ NO HACER:**
- Escribir implementación antes de las pruebas
- Saltar la fase ROJA
- Probar métodos privados directamente (probar a través de la API pública)
- Usar `sleep` en pruebas
- Ignorar pruebas intermitentes (flaky tests)

## Comandos Relacionados

- `/cpp-build` - Corrige errores de compilación
- `/cpp-review` - Revisa el código después de implementar
- Skill `verification-loop` - Ejecuta el bucle de verificación completo

## Relacionado

- Skill: `skills/cpp-testing/`
- Skill: `skills/tdd-workflow/`
