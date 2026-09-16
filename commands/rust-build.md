---
description: Corrige incrementalmente errores de compilación de Rust, problemas del borrow checker y de dependencias. Invoca al agente rust-build-resolver para correcciones mínimas y quirúrgicas.
---

# Compilación y Corrección de Rust

Este comando invoca al agente **rust-build-resolver** para corregir incrementalmente errores de compilación de Rust con cambios mínimos.

## Qué hace este comando

1. **Ejecutar diagnósticos**: Ejecuta `cargo check`, `cargo clippy`, `cargo fmt --check`
2. **Analizar errores**: Identifica códigos de error y archivos afectados
3. **Corregir incrementalmente**: Un error a la vez
4. **Verificar cada corrección**: Vuelve a ejecutar `cargo check` tras cada cambio
5. **Reportar resumen**: Muestra lo que se corrigió y lo que queda pendiente

## Cuándo usarlo

Usa `/rust-build` cuando:
- `cargo build` o `cargo check` fallen con errores
- `cargo clippy` reporte advertencias
- Errores del borrow checker o tiempos de vida (lifetimes) bloqueen la compilación
- Falle la resolución de dependencias de Cargo
- Después de traer cambios (pull) que rompen la compilación

## Comandos de diagnóstico ejecutados

```bash
# Verificación principal de compilación
cargo check 2>&1

# Lints y sugerencias
cargo clippy -- -D warnings 2>&1

# Comprobación de formato
cargo fmt --check 2>&1

# Problemas de dependencias
cargo tree --duplicates

# Auditoría de seguridad (si está disponible)
if command -v cargo-audit >/dev/null; then cargo audit; else echo "cargo-audit no instalado"; fi
```

## Ejemplo de Sesión

````text
Usuario: /rust-build

Agente:
# Resolución de Compilación Rust

## Diagnósticos Iniciales

```bash
$ cargo check
error[E0502]: cannot borrow `map` as mutable because it is also borrowed as immutable
  --> src/service/cache.rs:25:5
error[E0308]: mismatched types
  --> src/handler/api.rs:42:12
error[E0425]: cannot find value `db` in this scope
  --> src/handler/api.rs:58:9
```

Errores encontrados: 3

## Corrección 1: Error del Borrow Checker

Archivo: src/service/cache.rs:25
Error: E0502 — no se puede prestar `map` como mutable porque ya está prestado como inmutable
Causa: El préstamo inmutable sigue activo durante la inserción mutable

```rust
// Cambiado: reestructurado para finalizar el préstamo inmutable antes del acceso mutable
if !map.contains_key("key") {
    map.insert("key".into(), default);
}
```

```bash
$ cargo check
# 2 errores restantes
```

## Corrección 2: Discordancia de tipos

Archivo: src/handler/api.rs:42
Error: E0308 — tipos no coincidentes: se esperaba `usize`, se encontró `&str`

```rust
// Cambiado
let count = params.get("count");
// A
let count: usize = params.get("count")
    .and_then(|s| s.parse().ok())
    .unwrap_or(0);
```

```bash
$ cargo check
# 1 error restante
```

## Corrección 3: Nombre no resuelto

Archivo: src/handler/api.rs:58
Error: E0425 — no se encuentra el valor `db` en este ámbito
Causa: Importación faltante

```rust
// Añadido
use crate::db;
```

```bash
$ cargo check
# ¡Compilación exitosa!
```

## Verificación Final

```bash
$ cargo clippy -- -D warnings
# Sin advertencias

$ cargo test
running 6 tests
test service::cache::tests::test_insert ... ok
test service::cache::tests::test_get ... ok
test handler::api::tests::test_parse_count ... ok
test handler::api::tests::test_missing_count ... ok
test handler::api::tests::test_db_import ... ok
test handler::api::tests::test_response ... ok

test result: ok. 6 passed; 0 failed; 0 ignored
```

## Resumen

| Métrica | Cantidad |
|---------|----------|
| Errores de compilación corregidos | 3 |
| Advertencias de Clippy corregidas | 0 |
| Archivos modificados | 2 |
| Problemas restantes | 0 |

Estado de compilación: SUCCESS
````

## Errores Comunes Corregidos

| Error | Solución Típica |
|-------|-----------------|
| `cannot borrow as mutable` | Reestructurar para terminar primero el préstamo inmutable; clonar solo si está justificado |
| `does not live long enough` | Usar un tipo propio (owned) o añadir anotación de lifetime |
| `cannot move out of` | Reestructurar para tomar propiedad; clonar solo como último recurso |
| `mismatched types` | Añadir `.into()`, `as` o conversión explícita |
| `trait X not implemented` | Añadir `#[derive(Trait)]` o implementar manualmente |
| `unresolved import` | Añadir a Cargo.toml o corregir ruta en `use` |
| `cannot find value` | Añadir import o corregir ruta |

## Estrategia de Corrección

1. **Errores de compilación primero** - El código debe compilar
2. **Advertencias de Clippy segundo** - Corregir construcciones sospechosas
3. **Formateo tercero** - Cumplimiento de `cargo fmt`
4. **Una corrección a la vez** - Verificar cada cambio
5. **Cambios mínimos** - No refactorizar, solo corregir

## Condiciones de Parada

El agente se detendrá y reportará si:
- El mismo error persiste tras 3 intentos
- La solución introduce más errores
- Requiere cambios arquitectónicos
- Un error del borrow checker exige rediseñar la propiedad de datos

## Comandos Relacionados

- `/rust-test` - Ejecuta pruebas tras compilar con éxito
- `/rust-review` - Revisa la calidad del código
- Skill `verification-loop` - Bucle completo de verificación

## Relacionado

- Agente: `agents/rust-build-resolver.md`
- Skill: `skills/rust-patterns/`
