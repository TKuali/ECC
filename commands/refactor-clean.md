---
description: Identifica y elimina de forma segura código muerto con verificación tras cada cambio.
---

# Limpieza y Refactorización (Refactor Clean)

Identifica y elimina de forma segura código muerto con verificación de pruebas en cada paso.

## Paso 1: Detectar Código Muerto

Ejecutar herramientas de análisis según el tipo de proyecto:

| Herramienta | Qué Detecta | Comando |
|---|---|---|
| knip | Exportaciones, archivos y dependencias no utilizados | `npx knip` |
| depcheck | Dependencias npm no utilizadas | `npx depcheck` |
| ts-prune | Exportaciones TypeScript no utilizadas | `npx ts-prune` |
| vulture | Código Python no utilizado | `vulture src/` |
| deadcode | Código Go no utilizado | `deadcode ./...` |
| cargo-udeps | Dependencias Rust no utilizadas | `cargo +nightly udeps` |

Si no hay herramientas disponibles, usar Grep para encontrar exportaciones con cero importaciones:
```
# Encontrar exportaciones, luego verificar si están importadas en alguna parte
```

## Paso 2: Categorizar Hallazgos

Clasificar hallazgos en niveles de seguridad:

| Nivel | Ejemplos | Acción |
|---|---|---|
| **SAFE (Seguro)** | Utilidades no utilizadas, helpers de prueba, funciones internas | Eliminar con confianza |
| **CAUTION (Precaución)** | Componentes, rutas de API, middleware | Verificar que no haya imports dinámicos o consumidores externos |
| **DANGER (Peligro)** | Archivos de configuración, puntos de entrada, definiciones de tipos | Investigar exhaustivamente antes de tocar |

## Paso 3: Bucle de Eliminación Segura

Para cada elemento del nivel SAFE:

1. **Ejecutar la suite completa de pruebas** — Establecer línea base (todo en verde)
2. **Eliminar el código muerto** — Usar la herramienta de edición para una remoción quirúrgica
3. **Volver a ejecutar las pruebas** — Verificar que nada se haya roto
4. **Si las pruebas fallan** — Revertir de inmediato con `git checkout -- <archivo>` y omitir este elemento
5. **Si las pruebas pasan** — Pasar al siguiente elemento

## Paso 4: Manejar Elementos de PRECAUCIÓN (CAUTION)

Antes de eliminar elementos CAUTION:
- Buscar importaciones dinámicas: `import()`, `require()`, `__import__`
- Buscar referencias por cadenas de texto: nombres de rutas o de componentes en configuraciones
- Comprobar si se exporta desde la API pública de un paquete
- Verificar que no existan consumidores externos (verificar paquetes dependientes si está publicado)

## Paso 5: Consolidar Duplicados

Tras eliminar código muerto, buscar:
- Funciones casi duplicadas (>80% similares) — unificarlas en una
- Definiciones de tipo redundantes — consolidarlas
- Funciones wrapper que no aportan valor — reemplazarlas en línea (inline)
- Re-exportaciones sin propósito — eliminar indirecciones innecesarias

## Paso 6: Resumen

Reportar resultados:

```
Limpieza de Código Muerto
──────────────────────────────
Eliminados:  12 funciones no utilizadas
             3 archivos no utilizados
             5 dependencias no utilizadas
Omitidos:    2 elementos (pruebas fallidas)
Ahorro:      ~450 líneas eliminadas
──────────────────────────────
Todas las pruebas pasadas PASS:
```

## Reglas

- **Nunca eliminar sin ejecutar las pruebas primero**
- **Una eliminación a la vez** — Los cambios atómicos facilitan la reversión
- **Omitir en caso de duda** — Es preferible conservar código muerto que romper producción
- **No refactorizar durante la limpieza** — Separar responsabilidades (limpiar primero, refactorizar después)
