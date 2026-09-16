---
description: Revisión exhaustiva de código C++ para seguridad de memoria, modismos modernos de C++, concurrencia y seguridad. Invoca al agente cpp-reviewer.
---

# Revisión de Código C++

Este comando invoca al agente **cpp-reviewer** para una revisión de código exhaustiva y específica de C++.

## Qué hace este comando

1. **Identificar cambios en C++**: Encuentra archivos modificados `.cpp`, `.hpp`, `.cc`, `.h` mediante `git diff`
2. **Ejecutar análisis estático**: Ejecuta `clang-tidy` y `cppcheck`
3. **Escaneo de seguridad de memoria**: Busca `new`/`delete` manuales, desbordamientos de búfer, uso tras liberación (use-after-free)
4. **Revisión de concurrencia**: Analiza seguridad de hilos (thread safety), uso de mutex, condiciones de carrera de datos
5. **Comprobación de C++ moderno**: Verifica que el código siga las convenciones y mejores prácticas de C++17/20
6. **Generar reporte**: Categoriza problemas por severidad

## Cuándo usarlo

Usa `/cpp-review` cuando:
- Después de escribir o modificar código C++
- Antes de confirmar cambios en C++
- Al revisar pull requests con código C++
- Al integrarse a un nuevo proyecto en C++
- Al verificar posibles problemas de seguridad de memoria

## Categorías de Revisión

### CRÍTICO (Debe Corregirse)
- Uso de `new`/`delete` manual sin RAII
- Desbordamientos de búfer y uso tras liberación (use-after-free)
- Condiciones de carrera de datos sin sincronización
- Inyección de comandos a través de `system()`
- Lectura de variables no inicializadas
- Desreferencias de punteros nulos

### ALTO (Debería Corregirse)
- Violaciones de la Regla de los Cinco (Rule of Five)
- Falta de `std::lock_guard` / `std::scoped_lock`
- Hilos separados (detached threads) sin gestión adecuada de su ciclo de vida
- Conversiones al estilo C en lugar de `static_cast`/`dynamic_cast`
- Falta de corrección de `const` (const correctness)

### MEDIO (A Considerar)
- Copias innecesarias (pasar por valor en lugar de `const&`)
- Falta de `reserve()` en contenedores de tamaño conocido
- `using namespace std;` en encabezados (.h/.hpp)
- Falta de `[[nodiscard]]` en valores de retorno importantes
- Metaprogramación de plantillas excesivamente compleja

## Comprobaciones Automatizadas Ejecutadas

```bash
# Análisis estático
clang-tidy --checks='*,-llvmlibc-*' src/*.cpp -- -std=c++17

# Análisis adicional
cppcheck --enable=all --suppress=missingIncludeSystem src/

# Compilación con advertencias
cmake --build build -- -Wall -Wextra -Wpedantic
```

## Ejemplo de Uso

```text
Usuario: /cpp-review

Agente:
# Reporte de Revisión de Código C++

## Archivos Revisados
- src/handler/user.cpp (modificado)
- src/service/auth.cpp (modificado)

## Resultados de Análisis Estático
✓ clang-tidy: 2 advertencias
✓ cppcheck: Sin problemas

## Problemas Encontrados

[CRITICAL] Fuga de Memoria
Archivo: src/service/auth.cpp:45
Problema: `new` manual sin el `delete` correspondiente
```cpp
auto* session = new Session(userId);  // ¡Fuga de memoria!
cache[userId] = session;
```
Solución: Usar `std::unique_ptr`
```cpp
auto session = std::make_unique<Session>(userId);
cache[userId] = std::move(session);
```

[HIGH] Falta Referencia Const
Archivo: src/handler/user.cpp:28
Problema: Objeto grande pasado por valor
```cpp
void processUser(User user) {  // Copia innecesaria
```
Solución: Pasar por referencia constante
```cpp
void processUser(const User& user) {
```

## Resumen
- CRITICAL: 1
- HIGH: 1
- MEDIUM: 0

Recomendación: FAIL: Bloquear fusión hasta corregir problemas CRITICAL
```

## Criterios de Aprobación

| Estado | Condición |
|--------|-----------|
| PASS: Aprobar | Sin problemas CRITICAL o HIGH |
| WARNING: Advertencia | Solo problemas MEDIUM (fusionar con precaución) |
| FAIL: Bloquear | Problemas CRITICAL o HIGH encontrados |

## Integración con Otros Comandos

- Usa `/cpp-test` primero para garantizar que las pruebas pasen
- Usa `/cpp-build` si ocurren errores de compilación
- Usa `/cpp-review` antes de hacer commit
- Usa `/code-review` para aspectos generales no específicos de C++

## Relacionado

- Agente: `agents/cpp-reviewer.md`
- Skills: `skills/cpp-coding-standards/`, `skills/cpp-testing/`
