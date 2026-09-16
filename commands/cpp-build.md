---
description: Corrige incrementalmente errores de compilación de C++, problemas de CMake y de enlazador. Invoca al agente cpp-build-resolver para correcciones quirúrgicas mínimas.
---

# Compilación y Corrección de C++

Este comando invoca al agente **cpp-build-resolver** para corregir incrementalmente errores de compilación de C++ con cambios mínimos.

## Qué hace este comando

1. **Ejecutar diagnósticos**: Ejecuta `cmake --build`, `clang-tidy`, `cppcheck`
2. **Analizar errores**: Agrupa por archivo y ordena por severidad
3. **Corregir incrementalmente**: Un error a la vez
4. **Verificar cada corrección**: Vuelve a compilar después de cada cambio
5. **Reportar resumen**: Muestra lo que se corrigió y lo que queda pendiente

## Cuándo usarlo

Usa `/cpp-build` cuando:
- `cmake --build build` falla con errores
- Hay errores de enlazador (referencias no definidas, definiciones múltiples)
- Fallas de instanciación de plantillas (templates)
- Problemas de includes/dependencias
- Después de traer cambios (pull) que rompen la compilación

## Comandos de diagnóstico ejecutados

```bash
# Configuración de CMake
cmake -B build -S .

# Compilación
cmake --build build 2>&1 | head -100

# Análisis estático (si está disponible)
clang-tidy src/*.cpp -- -std=c++17
cppcheck --enable=all src/
```

## Ejemplo de Sesión

```text
Usuario: /cpp-build

Agente:
# Resolución de Compilación C++

## Diagnósticos Iniciales

```bash
$ cmake --build build
src/service/user.cpp:25:15: error: use of undeclared identifier 'UserRepository'
src/handler/api.cpp:42:9: error: no matching function for call to 'process'
src/handler/api.cpp:58:1: error: non-void function does not return a value
```

Errores encontrados: 3

## Corrección 1: Identificador no declarado

Archivo: src/service/user.cpp:25
Error: uso de identificador no declarado 'UserRepository'
Causa: Include faltante

```cpp
// Include añadido
#include "repository/user_repository.hpp"
```

```bash
$ cmake --build build
# 2 errores restantes
```

## Corrección 2: Función no coincidente

Archivo: src/handler/api.cpp:42
Error: no matching function for call to 'process'

```cpp
// Cambiado
process(params.get("count"));
// A
process(std::stoi(params.get("count")));
```

```bash
$ cmake --build build
# 1 error restante
```

## Corrección 3: Retorno faltante

Archivo: src/handler/api.cpp:58
Error: non-void function does not return a value

```cpp
std::optional<User> getUser(const std::string& id) {
    if (id.empty()) {
        return std::nullopt;
    }
    auto user = findUser(id);
    // Retorno faltante añadido
    return user;
}
```

```bash
$ cmake --build build
# ¡Compilación exitosa!
```

## Verificación Final

```bash
$ ctest --test-dir build --output-on-failure
Test project build
    1/5 Test #1: unit_tests ........   Passed    0.02 sec
    2/5 Test #2: integration_tests    Passed    0.15 sec
Todos los tests pasaron.
```

## Resumen

| Métrica | Cantidad |
|---------|----------|
| Errores de compilación corregidos | 3 |
| Errores de enlazador corregidos | 0 |
| Archivos modificados | 2 |
| Problemas restantes | 0 |

Estado de compilación: PASS: ÉXITO
```

## Errores Comunes Corregidos

| Error | Solución Típica |
|-------|-----------------|
| `undeclared identifier` | Añadir `#include` o corregir error tipográfico |
| `no matching function` | Corregir tipos de argumentos o añadir sobrecarga |
| `undefined reference` | Enlazar librería o añadir implementación |
| `multiple definition` | Usar `inline` o mover al archivo .cpp |
| `incomplete type` | Reemplazar declaración anticipada con `#include` |
| `no member named X` | Corregir nombre del miembro o include |
| `cannot convert X to Y` | Añadir conversión adecuada (cast) |
| `CMake Error` | Corregir configuración en CMakeLists.txt |

## Estrategia de Corrección

1. **Errores de compilación primero** - El código debe compilar
2. **Errores de enlazador segundo** - Resolver referencias indefinidas
3. **Advertencias tercero** - Corregir con `-Wall -Wextra`
4. **Una corrección a la vez** - Verificar cada cambio
5. **Cambios mínimos** - No refactorizar, solo corregir

## Condiciones de Parada

El agente se detendrá y reportará si:
- El mismo error persiste tras 3 intentos
- La solución introduce más errores
- Requiere cambios arquitectónicos
- Faltan dependencias externas

## Comandos Relacionados

- `/cpp-test` - Ejecuta pruebas después de compilar con éxito
- `/cpp-review` - Revisa la calidad del código
- Skill `verification-loop` - Bucle completo de verificación

## Relacionado

- Agente: `agents/cpp-build-resolver.md`
- Skill: `skills/cpp-coding-standards/`
