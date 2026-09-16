---
description: Revisa código Flutter/Dart en busca de patrones idiomáticos, mejores prácticas de widgets, gestión de estado, rendimiento, accesibilidad y seguridad. Invoca al agente flutter-reviewer.
---

# Revisión de Código Flutter

Este comando invoca al agente **flutter-reviewer** para revisar los cambios en el código Flutter/Dart.

## Qué hace este comando

1. **Recopilar contexto**: Revisa `git diff --staged` y `git diff`
2. **Inspeccionar proyecto**: Verifica `pubspec.yaml`, `analysis_options.yaml`, solución de gestión de estado
3. **Escaneo previo de seguridad**: Busca secretos codificados y problemas críticos de seguridad
4. **Revisión completa**: Aplica la lista de verificación completa de revisión
5. **Reportar hallazgos**: Muestra los problemas agrupados por severidad con guía de corrección

## Prerrequisitos

Antes de ejecutar `/flutter-review`, asegúrate de:
1. **La compilación pasa** — ejecuta `/flutter-build` primero; una revisión en código roto es incompleta
2. **Las pruebas pasan** — ejecuta `/flutter-test` para confirmar que no haya regresiones
3. **Sin conflictos de fusión** — resuelve todos los conflictos para que el diff refleje solo cambios intencionales
4. **`flutter analyze` está limpio** — corrige advertencias del analizador antes de la revisión

## Cuándo usarlo

Usa `/flutter-review` cuando:
- Antes de enviar un PR con cambios de Flutter/Dart (tras pasar compilación y pruebas)
- Después de implementar una nueva función para detectar problemas a tiempo
- Al revisar código Flutter de otra persona
- Para auditar un widget, componente de gestión de estado o clase de servicio
- Antes de un lanzamiento a producción

## Áreas de Revisión

| Área | Severidad |
|------|-----------|
| Secretos hardcodeados, HTTP en texto plano | CRITICAL |
| Violaciones de arquitectura, antipatrones de gestión de estado | CRITICAL |
| Problemas de reconstrucción de widgets, fugas de recursos | HIGH |
| Falta de `dispose()`, uso de `BuildContext` tras un await | HIGH |
| Seguridad nula de Dart, falta de estados de carga/error | HIGH |
| Propagación de const, composición de widgets | HIGH |
| Rendimiento: trabajo pesado en `build()` | HIGH |
| Accesibilidad, etiquetas semánticas | MEDIUM |
| Falta de pruebas para transiciones de estado | HIGH |
| Cadenas de texto sin internacionalizar (l10n) | MEDIUM |
| Higiene de dependencias en Pub | LOW |

## Ejemplo de Sesión

````text
Usuario: /flutter-review

Agente:
# Revisión de Código Flutter

## Contexto

Archivos modificados:
- lib/features/auth/presentation/login_page.dart
- lib/features/auth/data/auth_repository_impl.dart

Gestión de estado: Riverpod (detectado desde pubspec.yaml)
Arquitectura: orientada a características (feature-first)

## Escaneo Previo de Seguridad

✓ No se detectaron secretos hardcodeados
✓ Sin llamadas HTTP en texto plano

## Hallazgos de la Revisión

[HIGH] BuildContext utilizado tras brecha asíncrona sin verificación de mounted
Archivo: lib/features/auth/presentation/login_page.dart:67
Problema: Se llama a `context.go('/home')` tras `await auth.login(...)` sin verificación `mounted`.
Solución: Añadir `if (!context.mounted) return;` antes de cualquier navegación tras awaits (Flutter 3.7+).

[HIGH] Estado de error de AsyncValue no manejado
Archivo: lib/features/auth/presentation/login_page.dart:42
Problema: `ref.watch(authProvider)` cambia en carga/datos pero no tiene rama para `error`.
Solución: Añadir el caso de error a la expresión switch o llamada `when()` para mostrar un mensaje al usuario.

[MEDIUM] Cadena de texto fija no localizada
Archivo: lib/features/auth/presentation/login_page.dart:89
Problema: `Text('Login')` — texto visible para el usuario sin usar el sistema de localización.
Solución: Usar el acceso l10n del proyecto: `Text(context.l10n.loginButton)`.

## Resumen de Revisión

| Severidad | Cantidad | Estado |
|-----------|----------|--------|
| CRITICAL  | 0        | pass   |
| HIGH      | 2        | block  |
| MEDIUM    | 1        | info   |
| LOW       | 0        | note   |

Veredicto: BLOCK — Los problemas HIGH deben corregirse antes de fusionar.
````

## Criterios de Aprobación

- **Aprobar**: Sin problemas CRITICAL o HIGH
- **Bloquear**: Cualquier problema CRITICAL o HIGH debe corregirse antes de fusionar

## Comandos Relacionados

- `/flutter-build` — Corrige errores de compilación primero
- `/flutter-test` — Ejecuta pruebas antes de revisar
- `/code-review` — Revisión general de código (independiente del lenguaje)

## Relacionado

- Agente: `agents/flutter-reviewer.md`
- Skill: `skills/flutter-dart-code-review/`
- Reglas: `rules/dart/`
