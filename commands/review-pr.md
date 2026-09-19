---
description: Revisión exhaustiva de PR utilizando agentes especializados
---

# Revisión de PR (Review PR)

Ejecuta una revisión exhaustiva desde múltiples perspectivas de una pull request.

## Uso

`/review-pr [numero-PR-o-URL] [--focus=comments|tests|errors|types|code|simplify]`

Si no se especifica ningún PR, revisa el PR de la rama actual. Si no se especifica ningún foco, ejecuta la pila completa de revisión.

## Pasos

1. Identificar el PR:
   - usar `gh pr view` para obtener detalles del PR, archivos modificados y diff
2. Encontrar guías del proyecto:
   - buscar `CLAUDE.md`, configuración de linter, configuración de TypeScript y convenciones del repositorio
3. Ejecutar agentes de revisión especializados:
   - `code-reviewer`
   - `comment-analyzer`
   - `pr-test-analyzer`
   - `silent-failure-hunter`
   - `type-design-analyzer`
   - `code-simplifier`
4. Agregar resultados:
   - deduplicar hallazgos superpuestos
   - clasificar por severidad
5. Reportar hallazgos agrupados por severidad

## Regla de Confianza

Solo reportar problemas con nivel de confianza >= 80:

- Crítico: errores lógicos (bugs), seguridad, pérdida de datos
- Importante: pruebas faltantes, problemas de calidad, violaciones de estilo
- Asesoría: sugerencias únicamente cuando se soliciten explícitamente
