---
description: Revisión exhaustiva de código Rust para comprobación de propiedad (ownership), tiempos de vida (lifetimes), manejo de errores, uso de unsafe y patrones idiomáticos. Invoca al agente rust-reviewer.
---

# Revisión de Código Rust

Este comando invoca al agente **rust-reviewer** para una revisión de código exhaustiva y especializada en Rust.

## Qué hace este comando

1. **Verificar Comprobaciones Automatizadas**: Ejecuta `cargo check`, `cargo clippy -- -D warnings`, `cargo fmt --check` y `cargo test` — se detiene si alguna falla
2. **Identificar Cambios en Rust**: Encuentra archivos `.rs` modificados mediante `git diff HEAD~1` (o `git diff main...HEAD` para PRs)
3. **Ejecutar Auditoría de Seguridad**: Ejecuta `cargo audit` si está disponible
4. **Escaneo de Seguridad**: Comprueba el uso de código `unsafe`, inyección de comandos y credenciales hardcodeadas
5. **Revisión de Propiedad (Ownership)**: Analiza clonaciones innecesarias, problemas de lifetimes y patrones de préstamo
6. **Generar Reporte**: Categoriza problemas por severidad

## Cuándo usarlo

Usa `/rust-review` cuando:
- Después de escribir o modificar código Rust
- Antes de confirmar cambios (commit) en Rust
- Al revisar pull requests con código Rust
- Al incorporarse a un nuevo proyecto en Rust
- Para aprender patrones idiomáticos de Rust

## Categorías de Revisión

### CRÍTICO (Debe Corregirse)
- Uso de `unwrap()`/`expect()` sin comprobar en rutas de código de producción
- Bloques `unsafe` sin comentario `// SAFETY:` que documente sus invariantes
- Inyección SQL mediante interpolación de cadenas en consultas
- Inyección de comandos mediante entradas no validadas en `std::process::Command`
- Credenciales hardcodeadas
- Uso tras liberación (use-after-free) mediante punteros crudos (`raw pointers`)

### ALTO (Debería Corregirse)
- Uso innecesario de `.clone()` para satisfacer al borrow checker
- Parámetro de tipo `String` donde un `&str` o `impl AsRef<str>` sea suficiente
- Bloqueos en contexto asíncrono (`std::thread::sleep`, `std::fs`)
- Límites `Send`/`Sync` faltantes en tipos compartidos
- Coincidencia comodín `_ =>` en enumeraciones críticas para el negocio
- Funciones extensas (>50 líneas)

### MEDIO (A Considerar)
- Asignaciones de memoria innecesarias en rutas críticas (hot paths)
- Falta de `with_capacity` cuando el tamaño es conocido
- Advertencias de Clippy suprimidas sin justificación
- API pública sin documentación `///`
- Considerar `#[must_use]` en tipos de retorno donde ignorar el valor represente un probable error

## Comprobaciones Automatizadas Ejecutadas

```bash
# Puerta de compilación (debe pasar antes de la revisión)
cargo check

# Lints y sugerencias
cargo clippy -- -D warnings

# Formateo
cargo fmt --check

# Pruebas
cargo test

# Auditoría de seguridad (si está disponible)
if command -v cargo-audit >/dev/null; then cargo audit; else echo "cargo-audit no instalado"; fi
```

## Ejemplo de Uso

````text
Usuario: /rust-review

Agente:
# Reporte de Revisión de Código Rust

## Archivos Revisados
- src/service/user.rs (modificado)
- src/handler/api.rs (modificado)

## Resultados de Análisis Estático
- Compilación: Exitosa
- Clippy: Sin advertencias
- Formato: Aprobado
- Pruebas: Todas aprobadas

## Problemas Encontrados

[CRITICAL] unwrap sin comprobar en Ruta de Producción
Archivo: src/service/user.rs:28
Problema: Uso de `.unwrap()` en el resultado de una consulta a la base de datos
```rust
let user = db.find_by_id(id).unwrap();  // Pánico si el usuario no existe
```
Solución: Propagar el error con contexto
```rust
let user = db.find_by_id(id)
    .context("failed to fetch user")?;
```

[HIGH] Clonación Innecesaria
Archivo: src/handler/api.rs:45
Problema: Clonar String para satisfacer al borrow checker
```rust
let name = user.name.clone();
process(&user, &name);
```
Solución: Reestructurar para evitar el clonado
```rust
let result = process_name(&user.name);
use_user(&user, result);
```

## Resumen
- CRITICAL: 1
- HIGH: 1
- MEDIUM: 0

Recomendación: Bloquear fusión hasta corregir problemas CRITICAL
````

## Criterios de Aprobación

| Estado | Condición |
|--------|-----------|
| Aprobar | Sin problemas CRITICAL o HIGH |
| Advertencia | Solo problemas MEDIUM (fusionar con precaución) |
| Bloquear | Problemas CRITICAL o HIGH encontrados |

## Integración con Otros Comandos

- Usa `/rust-test` primero para asegurar que las pruebas pasen
- Usa `/rust-build` si ocurren errores de compilación
- Usa `/rust-review` antes de hacer commit
- Usa `/code-review` para aspectos generales independientes de Rust

## Relacionado

- Agente: `agents/rust-reviewer.md`
- Skills: `skills/rust-patterns/`, `skills/rust-testing/`
