---
description: Ejecuta pruebas de Flutter/Dart, informa fallas y corrige problemas de prueba incrementalmente. Cubre pruebas unitarias, de widgets, golden y de integración.
---

# Pruebas de Flutter (Flutter Test)

Este comando ejecuta la suite de pruebas de Flutter y reporta los resultados. Cuando ocurren fallas, diagnostica y corrige los problemas de manera incremental.

## Qué hace este comando

1. **Ejecutar pruebas**: Ejecuta `flutter test` (o se limita a archivos modificados)
2. **Analizar fallas**: Identifica pruebas fallidas por tipo y causa
3. **Corregir incrementalmente**: Una falla a la vez donde sea posible
4. **Verificar**: Vuelve a ejecutar tras cada corrección
5. **Reportar**: Muestra un resumen de cobertura y las fallas restantes

## Cuándo usarlo

Usa `/flutter-test` cuando:
- Después de implementar una función para verificar que nada se haya roto
- Después de ejecutar `/flutter-build` para asegurar que las pruebas pasen
- Para comprobar la cobertura de pruebas en código nuevo
- Cuando un archivo de prueba específico esté fallando
- Antes de enviar un PR

## Comandos ejecutados

```bash
# Ejecutar todas las pruebas
flutter test 2>&1

# Ejecutar con cobertura
flutter test --coverage 2>&1

# Ejecutar archivo de prueba específico
flutter test test/unit/domain/usecases/get_user_test.dart 2>&1

# Ejecutar pruebas que coincidan con un patrón de nombre
flutter test --name "CartBloc" 2>&1

# Ejecutar pruebas de integración (requiere dispositivo/emulador)
flutter test integration_test/ 2>&1

# Actualizar archivos golden cuando se hagan cambios visuales intencionales
flutter test --update-goldens 2>&1
```

## Ejemplo de Sesión

````text
Usuario: /flutter-test

Agente:
# Ejecución de Pruebas Flutter

## Ejecución de Pruebas

```
$ flutter test
00:05 +42 -2: Algunas pruebas fallaron.

FAILED: test/unit/data/user_repository_test.dart
  UserRepository getById
    returns null when user not found
    Expected: null
    Actual: User(id: 'test-id', name: 'Test User')

FAILED: test/widget/cart_page_test.dart
  CartPage
    shows empty state when cart is empty
    Expected: exactly one widget with text 'Your cart is empty'
    Found: no widget with text 'Your cart is empty'
```

## Corrección 1: Prueba de Repositorio

Archivo: test/unit/data/user_repository_test.dart
Falla: `getById` retorna un usuario cuando debería retornar null para un ID inexistente

Causa raíz: La preparación de la prueba añade un usuario con ID 'test-id' pero consulta con 'missing-id'.
Solución: Prueba actualizada para consultar con 'missing-id' — la preparación era correcta, la consulta errónea.

```
$ flutter test test/unit/data/user_repository_test.dart
1 test passed.
```

## Corrección 2: Prueba de Widget

Archivo: test/widget/cart_page_test.dart
Falla: Widget de texto de estado vacío no encontrado

Causa raíz: El mensaje de estado vacío fue renombrado de 'Your cart is empty' a 'Cart is empty' en el widget.
Solución: Texto de la prueba actualizado para coincidir con el texto actual del widget.

```
$ flutter test test/widget/cart_page_test.dart
1 test passed.
```

## Ejecución Final

```
$ flutter test --coverage
Todas las 44 pruebas pasaron.
Cobertura: 84.2% (objetivo: 80%)
```

## Resumen

| Métrica | Valor |
|---------|-------|
| Total de pruebas | 44 |
| Exitosas | 44 |
| Fallidas | 0 |
| Cobertura | 84.2% |

Estado de pruebas: PASS ✓
````

## Fallas Comunes de Pruebas

| Falla | Solución Típica |
|-------|-----------------|
| `Expected: <X> Actual: <Y>` | Actualizar aserción o corregir implementación |
| `Widget not found` | Corregir selector de finder o actualizar prueba tras renombre de widget |
| `Golden file not found` | Ejecutar `flutter test --update-goldens` para generar |
| `Golden mismatch` | Inspeccionar diff; ejecutar `--update-goldens` si el cambio fue intencional |
| `MissingPluginException` | Simular (mock) canal de plataforma en la preparación de la prueba |
| `LateInitializationError` | Inicializar campos `late` en `setUp()` |
| `pumpAndSettle timed out` | Reemplazar con llamadas explícitas a `pump(Duration)` |

## Comandos Relacionados

- `/flutter-build` — Corrige errores de compilación antes de ejecutar pruebas
- `/flutter-review` — Revisa código después de que las pruebas pasen
- Skill `tdd-workflow` — Flujo de trabajo de desarrollo guiado por pruebas

## Relacionado

- Agente: `agents/flutter-reviewer.md`
- Agente: `agents/dart-build-resolver.md`
- Skill: `skills/flutter-dart-code-review/`
- Reglas: `rules/dart/testing.md`
