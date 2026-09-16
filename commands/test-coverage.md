---
description: Analiza la cobertura, identifica brechas y genera pruebas faltantes para alcanzar el umbral objetivo.
---

# Cobertura de Pruebas (Test Coverage)

Analiza la cobertura de pruebas, identifica brechas y genera las pruebas faltantes para alcanzar 80%+ de cobertura.

## Paso 1: Detectar el Framework de Pruebas

| Indicador | Comando de Cobertura |
|---|---|
| `jest.config.*` o `package.json` jest | `npx jest --coverage --coverageReporters=json-summary` |
| `vitest.config.*` | `npx vitest run --coverage` |
| `pytest.ini` / `pyproject.toml` pytest | `pytest --cov=src --cov-report=json` |
| `Cargo.toml` | `cargo llvm-cov --json` |
| `pom.xml` con JaCoCo | `mvn test jacoco:report` |
| `go.mod` | `go test -coverprofile=coverage.out ./...` |

## Paso 2: Analizar el Reporte de Cobertura

1. Ejecutar el comando de cobertura
2. Analizar la salida (resumen JSON o salida en terminal)
3. Listar los archivos **por debajo del 80% de cobertura**, ordenados de peor a mejor
4. Para cada archivo con baja cobertura, identificar:
   - Funciones o métodos no probados
   - Cobertura de ramas faltante (if/else, switch, rutas de error)
   - Código muerto que infla el denominador

## Paso 3: Generar Pruebas Faltantes

Para cada archivo con baja cobertura, generar pruebas siguiendo esta prioridad:

1. **Ruta feliz (Happy path)** — Funcionalidad central con entradas válidas
2. **Manejo de errores** — Entradas inválidas, datos faltantes, fallos de red
3. **Casos límite (Edge cases)** — Arreglos vacíos, null/undefined, valores límite (0, -1, MAX_INT)
4. **Cobertura de ramas** — Cada if/else, caso de switch, operador ternario

### Reglas de Generación de Pruebas

- Colocar las pruebas junto al código fuente: `foo.ts` → `foo.test.ts` (o según la convención del proyecto)
- Utilizar los patrones de pruebas existentes del proyecto (estilo de importación, librería de aserciones, estrategia de mocks)
- Simular dependencias externas con mocks (base de datos, APIs, sistema de archivos)
- Cada prueba debe ser independiente — sin estado mutable compartido entre pruebas
- Nombrar las pruebas descriptivamente: `test_create_user_with_duplicate_email_returns_409`

## Paso 4: Verificar

1. Ejecutar la suite completa de pruebas — todas las pruebas deben pasar
2. Volver a ejecutar la cobertura — verificar la mejora
3. Si continúa por debajo del 80%, repetir el Paso 3 para las brechas restantes

## Paso 5: Reporte

Mostrar comparación antes/después:

```
Reporte de Cobertura
──────────────────────────────
Archivo                Antes   Después
src/services/auth.ts   45%     88%
src/utils/validation.ts 32%    82%
──────────────────────────────
Total:                 67%     84%  PASS:
```

## Áreas de Enfoque

- Funciones con bifurcaciones complejas (alta complejidad ciclomática)
- Manejadores de error y bloques catch
- Funciones utilitarias usadas en todo el código base
- Manejadores de endpoints de API (flujo petición → respuesta)
- Casos límite: null, undefined, cadena vacía, arreglo vacío, cero, números negativos
