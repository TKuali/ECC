---
description: Aplica el flujo de trabajo de TDD para Rust. Escribe pruebas primero, luego implementa. Verifica más del 80% de cobertura con cargo-llvm-cov.
---

# Comando TDD para Rust

Este comando aplica la metodología de desarrollo guiado por pruebas (TDD) para código Rust utilizando `#[test]`, rstest, proptest y mockall.

## Qué hace este comando

1. **Definir Tipos/Traits**: Estructura las firmas de funciones con `todo!()`
2. **Escribir Pruebas**: Crea un módulo de pruebas exhaustivo (ROJO / RED)
3. **Ejecutar Pruebas**: Verifica que las pruebas fallen por el motivo correcto
4. **Implementar Código**: Escribe el código mínimo necesario para pasar (VERDE / GREEN)
5. **Refactorizar**: Mejora el código manteniendo las pruebas en verde
6. **Verificar Cobertura**: Asegura un 80%+ de cobertura con cargo-llvm-cov

## Cuándo usarlo

Usa `/rust-test` cuando:
- Estés implementando nuevas funciones, métodos o traits en Rust
- Agregues cobertura de pruebas a código Rust existente
- Corrijas errores (escribe primero la prueba fallida)
- Construyas lógica de negocio crítica
- Aprendas o apliques el flujo de trabajo de TDD en Rust

## Ciclo TDD

```
ROJO (RED)     -> Escribir prueba fallida primero
VERDE (GREEN)  -> Implementar código mínimo para pasar
REFACTOR       -> Mejorar el código manteniendo las pruebas en verde
REPETIR        -> Siguiente caso de prueba
```

## Ejemplo de Sesión

````text
Usuario: /rust-test Necesito una función para validar el registro de usuarios

Agente:
# Sesión TDD: Validador de Registro

## Paso 1: Definir Interfaz

```rust
// src/validator.rs
pub struct RegistrationRequest {
    pub name: String,
    pub email: String,
    pub password: String,
}

pub enum ValidationResult {
    Valid,
    Invalid(Vec<String>),
}

pub fn validate_registration(request: &RegistrationRequest) -> ValidationResult {
    todo!()
}
```

## Paso 2: Escribir Pruebas (ROJO)

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn valid_registration_returns_valid() {
        let request = RegistrationRequest {
            name: "Alice".into(),
            email: "alice@example.com".into(),
            password: "SecureP@ss1".into(),
        };
        assert!(matches!(validate_registration(&request), ValidationResult::Valid));
    }

    #[test]
    fn blank_name_returns_invalid() {
        let request = RegistrationRequest {
            name: "".into(),
            email: "alice@example.com".into(),
            password: "SecureP@ss1".into(),
        };
        match validate_registration(&request) {
            ValidationResult::Invalid(errors) => {
                assert!(errors.contains(&"Name is required".to_string()));
            }
            ValidationResult::Valid => panic!("expected Invalid"),
        }
    }

    #[test]
    fn invalid_email_returns_invalid() {
        let request = RegistrationRequest {
            name: "Alice".into(),
            email: "not-an-email".into(),
            password: "SecureP@ss1".into(),
        };
        assert!(matches!(
            validate_registration(&request),
            ValidationResult::Invalid(_)
        ));
    }

    #[test]
    fn short_password_returns_invalid() {
        let request = RegistrationRequest {
            name: "Alice".into(),
            email: "alice@example.com".into(),
            password: "short".into(),
        };
        assert!(matches!(
            validate_registration(&request),
            ValidationResult::Invalid(_)
        ));
    }
}
```

## Paso 3: Ejecutar Pruebas — Verificar FALLA

```bash
$ cargo test
running 4 tests
test tests::valid_registration_returns_valid ... FAILED (not yet implemented)
test tests::blank_name_returns_invalid ... FAILED
test tests::invalid_email_returns_invalid ... FAILED
test tests::short_password_returns_invalid ... FAILED
```

Las pruebas fallan como se esperaba (pánico de todo!).

## Paso 4: Implementar Código Mínimo (VERDE)

```rust
pub fn validate_registration(request: &RegistrationRequest) -> ValidationResult {
    let mut errors = Vec::new();

    if request.name.trim().is_empty() {
        errors.push("Name is required".into());
    }
    if !request.email.contains('@') {
        errors.push("Invalid email format".into());
    }
    if request.password.len() < 8 {
        errors.push("Password must be at least 8 characters".into());
    }

    if errors.is_empty() {
        ValidationResult::Valid
    } else {
        ValidationResult::Invalid(errors)
    }
}
```

## Paso 5: Ejecutar Pruebas — Verificar ÉXITO

```bash
$ cargo test
running 4 tests
test tests::valid_registration_returns_valid ... ok
test tests::blank_name_returns_invalid ... ok
test tests::invalid_email_returns_invalid ... ok
test tests::short_password_returns_invalid ... ok

test result: ok. 4 passed; 0 failed
```

¡Todas las pruebas pasaron!

## Paso 6: Verificar Cobertura

```bash
$ cargo llvm-cov
Coverage: 100.0% of lines
```

Cobertura: 100%

## ¡TDD Completado!
````

## Patrones de Prueba

### Pruebas Unitarias

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn adds_two_numbers() {
        assert_eq!(add(2, 3), 5);
    }

    #[test]
    fn handles_error() -> Result<(), Box<dyn std::error::Error>> {
        let result = parse_config(r#"port = 8080"#)?;
        assert_eq!(result.port, 8080);
        Ok(())
    }
}
```

### Pruebas Parametrizadas con rstest

```rust
use rstest::{rstest, fixture};

#[rstest]
#[case("hello", 5)]
#[case("", 0)]
#[case("rust", 4)]
fn test_string_length(#[case] input: &str, #[case] expected: usize) {
    assert_eq!(input.len(), expected);
}
```

### Pruebas Asíncronas

```rust
#[tokio::test]
async fn fetches_data_successfully() {
    let client = TestClient::new().await;
    let result = client.get("/data").await;
    assert!(result.is_ok());
}
```

### Pruebas Basadas en Propiedades

```rust
use proptest::prelude::*;

proptest! {
    #[test]
    fn encode_decode_roundtrip(input in ".*") {
        let encoded = encode(&input);
        let decoded = decode(&encoded).unwrap();
        assert_eq!(input, decoded);
    }
}
```

## Comandos de Cobertura

```bash
# Reporte resumido
cargo llvm-cov

# Reporte HTML
cargo llvm-cov --html

# Fallar si está por debajo del umbral
cargo llvm-cov --fail-under-lines 80

# Ejecutar prueba específica
cargo test test_name

# Ejecutar mostrando la salida
cargo test -- --nocapture

# Ejecutar sin detenerse en el primer fallo
cargo test --no-fail-fast
```

## Objetivos de Cobertura

| Tipo de Código | Objetivo |
|----------------|----------|
| Lógica de negocio crítica | 100% |
| API pública | 90%+ |
| Código general | 80%+ |
| Generado / bindings FFI | Excluir |

## Mejores Prácticas de TDD

**QUÉ HACER:**
- Escribir la prueba PRIMERO, antes de cualquier implementación
- Ejecutar pruebas tras cada cambio
- Usar `assert_eq!` en lugar de `assert!` para obtener mejores mensajes de error
- Usar `?` en pruebas que devuelven `Result` para salidas más limpias
- Probar el comportamiento, no la implementación
- Incluir casos límite (vacío, límites, rutas de error)

**QUÉ NO HACER:**
- Escribir implementación antes de las pruebas
- Saltar la fase ROJA
- Usar `#[should_panic]` cuando `Result::is_err()` funcione
- Usar `sleep()` en pruebas — usar canales o `tokio::time::pause()`
- Mockear todo — preferir pruebas de integración cuando sea factible

## Comandos Relacionados

- `/rust-build` - Corrige errores de compilación
- `/rust-review` - Revisa el código tras la implementación
- Skill `verification-loop` - Ejecuta el bucle de verificación completo

## Relacionado

- Skill: `skills/rust-testing/`
- Skill: `skills/rust-patterns/`
