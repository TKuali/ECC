---
description: Escanea la estructura del proyecto y genera mapas de código arquitectónicos optimizados en consumo de tokens.
---

# Actualizar Mapas de Código (Update Codemaps)

Analiza la estructura del código base y genera documentación de arquitectura optimizada en tokens.

## Paso 1: Escanear Estructura del Proyecto

1. Identificar el tipo de proyecto (monorepositorio, app única, librería, microservicio)
2. Encontrar todos los directorios de código fuente (src/, lib/, app/, packages/)
3. Mapear puntos de entrada (main.ts, index.ts, app.py, main.go, etc.)

## Paso 2: Generar Mapas de Código

Crear o actualizar los mapas de código en `docs/CODEMAPS/` (o `.reports/codemaps/`):

| Archivo | Contenido |
|---|---|
| `architecture.md` | Diagrama general del sistema, límites de servicios, flujo de datos |
| `backend.md` | Rutas de API, cadena de middleware, mapeo servicio → repositorio |
| `frontend.md` | Árbol de páginas, jerarquía de componentes, flujo de gestión de estado |
| `data.md` | Tablas de base de datos, relaciones, historial de migraciones |
| `dependencies.md` | Servicios externos, integraciones de terceros, librerías compartidas |

### Formato de Mapa de Código

Cada mapa debe ser reducido en tokens — optimizado para el consumo del contexto por la IA:

```markdown
# Arquitectura Backend

## Rutas
POST /api/users → UserController.create → UserService.create → UserRepo.insert
GET  /api/users/:id → UserController.get → UserService.findById → UserRepo.findById

## Archivos Clave
src/services/user.ts (lógica de negocio, 120 líneas)
src/repos/user.ts (acceso a base de datos, 80 líneas)

## Dependencias
- PostgreSQL (almacén de datos principal)
- Redis (caché de sesiones, limitador de tasa)
- Stripe (procesamiento de pagos)
```

## Paso 3: Detección de Diferencias (Diff)

1. Si existen mapas de código previos, calcular el porcentaje de diferencia
2. Si los cambios son > 30%, mostrar el diff y solicitar aprobación del usuario antes de sobrescribir
3. Si los cambios son <= 30%, actualizar directamente

## Paso 4: Añadir Metadatos

Añadir una cabecera de frescura a cada mapa de código:

```markdown
<!-- Generated: 2026-02-11 | Files scanned: 142 | Token estimate: ~800 -->
```

## Paso 5: Guardar Reporte de Análisis

Escribir un resumen en `.reports/codemap-diff.txt`:
- Archivos añadidos/eliminados/modificados desde el último escaneo
- Nuevas dependencias detectadas
- Cambios de arquitectura (nuevas rutas, nuevos servicios, etc.)
- Advertencias de desactualización para docs no actualizados en más de 90 días

## Consejos

- Centrarse en la **estructura de alto nivel**, no en detalles de implementación
- Preferir **rutas de archivo y firmas de función** antes que bloques enteros de código
- Mantener cada mapa de código por debajo de **1000 tokens** para una carga de contexto eficiente
- Usar diagramas ASCII para flujos de datos en lugar de descripciones extensas
- Ejecutar tras la incorporación de funcionalidades grandes o sesiones de refactorización
