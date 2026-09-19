---
description: Corrige incrementalmente errores del analizador de Dart y fallas de compilación de Flutter. Invoca al agente dart-build-resolver para correcciones mínimas y quirúrgicas.
---

# Compilación y Corrección de Flutter

Este comando invoca al agente **dart-build-resolver** para corregir incrementalmente errores de compilación de Dart/Flutter con cambios mínimos.

## Qué hace este comando

1. **Ejecutar diagnósticos**: Ejecuta `flutter analyze`, `flutter pub get`
2. **Analizar errores**: Agrupa por archivo y ordena por severidad
3. **Corregir incrementalmente**: Un error a la vez
4. **Verificar cada corrección**: Vuelve a ejecutar el análisis tras cada cambio
5. **Reportar resumen**: Muestra lo que se corrigió y lo que queda pendiente

## Cuándo usarlo

Usa `/flutter-build` cuando:
- `flutter analyze` reporte errores
- `flutter build` falle para cualquier plataforma
- `dart pub get` / `flutter pub get` falle con conflictos de versión
- `build_runner` no logre generar código
- Después de traer cambios (pull) que rompen la compilación

## Comandos de diagnóstico ejecutados

```bash
# Análisis
flutter analyze 2>&1

# Dependencias
flutter pub get 2>&1

# Generación de código (si el proyecto usa build_runner)
dart run build_runner build --delete-conflicting-outputs 2>&1

# Compilaciones de plataforma
flutter build apk 2>&1
flutter build web 2>&1
```

## Ejemplo de Sesión

````text
Usuario: /flutter-build

Agente:
# Resolución de Compilación Flutter

## Diagnósticos Iniciales

```
$ flutter analyze
Analyzing project...

  error • lib/features/user/data/user_repository_impl.dart:34:16 •
    A value of type 'String?' can't be assigned to a variable of type 'String'. •
    invalid_assignment

  error • lib/features/cart/presentation/cart_page.dart:58:5 •
    The method 'add' isn't defined for the type 'List<Item>'.
    Try correcting the name to the name of an existing method, or defining a method named 'add'. •
    undefined_method

2 errores encontrados.
```

## Corrección 1: Seguridad Nula (Null Safety)

Archivo: lib/features/user/data/user_repository_impl.dart:34
Error: A value of type 'String?' can't be assigned to type 'String'

Cambiado:
```dart
final id = response.id;
```
A:
```dart
final id = response.id ?? '';
```

```
$ flutter analyze
1 error encontrado.
```

## Corrección 2: Lista Inmutable

Archivo: lib/features/cart/presentation/cart_page.dart:58
Error: The method 'add' isn't defined for the type 'List<Item>'
Causa: El estado contiene una lista no modificable; la mutación pasa por Cubit

Cambiado:
```dart
state.items.add(item);
```
A:
```dart
context.read<CartCubit>().addItem(item);
// Nota: Cubit expone métodos con nombre (addItem, removeItem);
// .add(event) es la API de eventos de BLoC — no los mezcles.
```

```
$ flutter analyze
¡No se encontraron problemas!
```

## Verificación Final

```
$ flutter test
Todos los tests pasaron.
```

## Resumen

| Métrica | Cantidad |
|---------|----------|
| Errores de análisis corregidos | 2 |
| Archivos modificados | 2 |
| Problemas restantes | 0 |

Estado de compilación: PASS ✓
````

## Errores Comunes Corregidos

| Error | Solución Típica |
|-------|-----------------|
| `A value of type 'X?' can't be assigned to 'X'` | Añadir `?? default` o protección contra nulos |
| `The name 'X' isn't defined` | Añadir import o corregir error tipográfico |
| `Non-nullable instance field must be initialized` | Añadir inicializador o `late` |
| `Version solving failed` | Ajustar restricciones de versión en pubspec.yaml |
| `Missing concrete implementation of 'X'` | Implementar el método faltante de la interfaz |
| `build_runner: Part of X expected` | Eliminar `.g.dart` obsoleto y regenerar |

## Estrategia de Corrección

1. **Errores de análisis primero** — el código debe estar libre de errores
2. **Triaje de advertencias segundo** — corregir advertencias que puedan causar fallos en tiempo de ejecución
3. **Conflictos de pub tercero** — corregir resolución de dependencias
4. **Una corrección a la vez** — verificar cada cambio
5. **Cambios mínimos** — no refactorizar, solo corregir

## Condiciones de Parada

El agente se detendrá y reportará si:
- El mismo error persiste tras 3 intentos
- La solución introduce más errores
- Requiere cambios arquitectónicos
- Los conflictos de actualización de paquetes requieren decisión del usuario

## Comandos Relacionados

- `/flutter-test` — Ejecuta pruebas después de compilar con éxito
- `/flutter-review` — Revisa la calidad del código
- Skill `verification-loop` — Bucle completo de verificación

## Relacionado

- Agente: `agents/dart-build-resolver.md`
- Skill: `skills/flutter-dart-code-review/`
