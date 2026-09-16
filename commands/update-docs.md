---
description: Sincroniza la documentación a partir de fuentes fidedignas de código como scripts, esquemas, rutas y exportaciones.
---

# Actualizar Documentación (Update Documentation)

Sincroniza la documentación con la base de código, generándola a partir de los archivos que representan la fuente de la verdad.

## Paso 1: Identificar las Fuentes de la Verdad

| Fuente | Genera |
|---|---|
| Scripts en `package.json` | Referencia de comandos disponibles |
| `.env.example` | Documentación de variables de entorno |
| `openapi.yaml` / archivos de rutas | Referencia de endpoints de la API |
| Exportaciones de código fuente | Documentación de la API pública |
| `Dockerfile` / `docker-compose.yml` | Documentación de configuración de infraestructura |

## Paso 2: Generar Referencia de Scripts

1. Leer `package.json` (o `Makefile`, `Cargo.toml`, `pyproject.toml`)
2. Extraer todos los scripts/comandos con sus descripciones
3. Generar una tabla de referencia:

```markdown
| Comando | Descripción |
|---|---|
| `npm run dev` | Iniciar servidor de desarrollo con recarga en caliente |
| `npm run build` | Compilación de producción con comprobación de tipos |
| `npm test` | Ejecutar suite de pruebas con cobertura |
```

## Paso 3: Generar Documentación de Entorno

1. Leer `.env.example` (o `.env.template`, `.env.sample`)
2. Extraer todas las variables con sus propósitos
3. Categorizar como obligatorias u opcionales
4. Documentar el formato esperado y valores válidos

```markdown
| Variable | Obligatoria | Descripción | Ejemplo |
|---|---|---|---|
| `DATABASE_URL` | Sí | Cadena de conexión PostgreSQL | `postgres://user:pass@host:5432/db` |
| `LOG_LEVEL` | No | Verbosidad de logs (por defecto: info) | `debug`, `info`, `warn`, `error` |
```

## Paso 4: Actualizar Guía de Contribución

Generar o actualizar `docs/CONTRIBUTING.md` con:
- Configuración del entorno de desarrollo (prerrequisitos, pasos de instalación)
- Scripts disponibles y sus objetivos
- Procedimientos de prueba (cómo ejecutar y escribir nuevas pruebas)
- Cumplimiento de estilo de código (linter, formateador, hooks de pre-commit)
- Lista de verificación para envío de PRs

## Paso 5: Actualizar Runbook

Generar o actualizar `docs/RUNBOOK.md` con:
- Procedimientos de despliegue (paso a paso)
- Endpoints de comprobación de salud y monitorización
- Problemas comunes y sus soluciones
- Procedimientos de reversión (rollback)
- Canales de alerta y vías de escalado

## Paso 6: Verificación de Desactualización (Staleness)

1. Encontrar archivos de documentación no modificados en más de 90 días
2. Cruzar con los cambios recientes en el código fuente
3. Marcar documentos potencialmente obsoletos para revisión manual

## Paso 7: Mostrar Resumen

```
Actualización de Documentación
──────────────────────────────
Actualizado: docs/CONTRIBUTING.md (tabla de scripts)
Actualizado: docs/ENV.md (3 variables nuevas)
Marcado:     docs/DEPLOY.md (desactualizado hace 142 días)
Omitido:     docs/API.md (no se detectaron cambios)
──────────────────────────────
```

## Reglas

- **Fuente única de la verdad**: Generar siempre a partir de código, nunca editar manualmente secciones generadas
- **Preservar secciones manuales**: Actualizar solo las secciones autogeneradas; mantener intacto el texto redactado a mano
- **Marcar contenido generado**: Usar marcadores `<!-- AUTO-GENERATED -->` alrededor de secciones generadas
- **No crear documentación sin solicitud**: Crear nuevos archivos de documentación únicamente si el comando lo solicita explícitamente
