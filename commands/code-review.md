---
description: Revisión de código — cambios locales no confirmados o PR de GitHub (pasa el número/URL del PR para el modo PR)
argument-hint: [numero-pr | url-pr | vacio para revision local]
---

# Revisión de Código (Code Review)

> Modo de revisión de PR adaptado de PRPs-agentic-eng por Wirasm. Parte de la serie de flujos de trabajo PRP.

**Entrada**: $ARGUMENTS

---

## Selección de Modo

Si `$ARGUMENTS` contiene un número de PR, URL de PR o `--pr`:
→ Saltar al **Modo de Revisión de PR** a continuación.

De lo contrario:
→ Usar el **Modo de Revisión Local**.

---

## Modo de Revisión Local

Revisión exhaustiva de seguridad y calidad de los cambios no confirmados.

### Fase 1 — RECOLECCIÓN (GATHER)

```bash
git diff --name-only HEAD
```

Si no hay archivos modificados, detenerse: "Nada que revisar."

### Fase 2 — REVISIÓN (REVIEW)

Leer cada archivo modificado en su totalidad. Verificar:

**Problemas de Seguridad (CRÍTICO):**
- Credenciales, claves de API o tokens hardcodeados
- Vulnerabilidades de inyección SQL
- Vulnerabilidades XSS
- Falta de validación de entradas
- Dependencias inseguras
- Riesgos de path traversal (salto de directorio)

**Calidad de Código (ALTO):**
- Funciones > 50 líneas
- Archivos > 800 líneas
- Profundidad de anidamiento > 4 niveles
- Falta de manejo de errores
- Sentencias console.log
- Comentarios TODO/FIXME
- Falta de JSDoc para APIs públicas

**Mejores Prácticas (MEDIO):**
- Patrones de mutación (usar inmutabilidad en su lugar)
- Uso de emojis en código/comentarios
- Falta de pruebas para código nuevo
- Problemas de accesibilidad (a11y)

### Fase 3 — REPORTE (REPORT)

Generar reporte con:
- Severidad: CRÍTICO, ALTO, MEDIO, BAJO
- Ubicación del archivo y números de línea
- Descripción del problema
- Corrección sugerida

Bloquear el commit si se encuentran problemas CRÍTICOS o ALTOS.
Nunca aprobar código con vulnerabilidades de seguridad.

---

## Modo de Revisión de PR

Revisión exhaustiva de PR en GitHub — obtiene el diff, lee los archivos completos, ejecuta validaciones y publica la revisión.

### Fase 1 — OBTENER (FETCH)

Analizar la entrada para determinar el PR:

| Entrada | Acción |
|---|---|
| Número (p. ej. `42`) | Usar como número de PR |
| URL (`github.com/.../pull/42`) | Extraer número de PR |
| Nombre de rama | Buscar PR mediante `gh pr list --head <branch>` |

```bash
gh pr view <NUMBER> --json number,title,body,author,baseRefName,headRefName,changedFiles,additions,deletions
gh pr diff <NUMBER>
```

Si no se encuentra el PR, detenerse con error. Almacenar los metadatos del PR para fases posteriores.

### Fase 2 — CONTEXTO (CONTEXT)

Construir el contexto de revisión:

1. **Reglas del proyecto** — Leer `CLAUDE.md`, `.claude/docs/` y cualquier guía de contribución
2. **Artefactos de planificación** — Comprobar `.claude/prds/`, `.claude/plans/`, `.claude/reviews/` y los legados `.claude/PRPs/{prds,plans,reports,reviews}/` para contexto relacionado con este PR
3. **Intención del PR** — Analizar la descripción del PR en busca de metas, issues vinculados y planes de pruebas
4. **Archivos modificados** — Listar todos los archivos modificados y categorizarlos por tipo (fuente, pruebas, configuración, documentación)

### Fase 3 — REVISIÓN (REVIEW)

Leer cada archivo modificado **en su totalidad** (no solo los fragmentos del diff — se necesita el contexto circundante).

Para revisiones de PR, obtener el contenido completo del archivo en la revisión cabecera del PR:
```bash
gh pr diff <NUMBER> --name-only | while IFS= read -r file; do
  gh api "repos/{owner}/{repo}/contents/$file?ref=<head-branch>" --jq '.content' | base64 -d
done
```

Aplicar la lista de verificación de revisión en 7 categorías:

| Categoría | Qué Verificar |
|---|---|
| **Corrección** | Errores lógicos, errores off-by-one, manejo de nulos, casos límite, condiciones de carrera |
| **Seguridad de Tipos** | Discordancias de tipo, conversiones inseguras (unsafe casts), uso de `any`, genéricos faltantes |
| **Cumplimiento de Patrones** | Coincidencia con convenciones del proyecto (nombres, estructura de archivos, manejo de errores, imports) |
| **Seguridad** | Inyecciones, fallos de autenticación, exposición de secretos, SSRF, path traversal, XSS |
| **Rendimiento** | Consultas N+1, índices faltantes, bucles sin límite, fugas de memoria, cargas pesadas |
| **Completitud** | Pruebas faltantes, manejo de errores faltante, migraciones incompletas, documentación faltante |
| **Mantenibilidad** | Código muerto, números mágicos, anidamiento profundo, nombres confusos, tipos faltantes |

Asignar severidad a cada hallazgo:

| Severidad | Significado | Acción |
|---|---|---|
| **CRÍTICO** | Vulnerabilidad de seguridad o riesgo de pérdida de datos | Debe solucionarse antes de fusionar |
| **ALTO** | Error o fallo lógico que probablemente cause problemas | Debería solucionarse antes de fusionar |
| **MEDIO** | Problema de calidad de código o mejor práctica omitida | Corrección recomendada |
| **BAJO** | Detalle de estilo o sugerencia menor | Opcional |

### Fase 4 — VALIDAR (VALIDATE)

Ejecutar los comandos de validación disponibles:

Detectar el tipo de proyecto según los archivos de configuración (`package.json`, `Cargo.toml`, `go.mod`, `pyproject.toml`, etc.), luego ejecutar los comandos apropiados:

**Node.js / TypeScript** (tiene `package.json`):
```bash
npm run typecheck 2>/dev/null || npx tsc --noEmit 2>/dev/null  # Comprobación de tipos
npm run lint                                                    # Lint
npm test                                                        # Pruebas
npm run build                                                   # Compilación
```

**Rust** (tiene `Cargo.toml`):
```bash
cargo clippy -- -D warnings  # Lint
cargo test                   # Pruebas
cargo build                  # Compilación
```

**Go** (tiene `go.mod`):
```bash
go vet ./...    # Lint
go test ./...   # Pruebas
go build ./...  # Compilación
```

**Python** (tiene `pyproject.toml` / `setup.py`):
```bash
pytest  # Pruebas
```

Ejecutar únicamente los comandos aplicables al tipo de proyecto detectado. Registrar aprobación/fallo para cada uno.

### Fase 5 — DECIDIR (DECIDE)

Formar la recomendación según los hallazgos:

| Condición | Decisión |
|---|---|
| Cero problemas CRÍTICOS/ALTOS, validación exitosa | **APPROVE** (Aprobar) |
| Solo problemas MEDIOS/BAJOS, validación exitosa | **APPROVE** (Aprobar con comentarios) |
| Cualquier problema ALTO o fallo de validación | **REQUEST CHANGES** (Solicitar cambios) |
| Cualquier problema CRÍTICO | **BLOCK** (Bloquear — debe corregirse antes de fusionar) |

Casos especiales:
- PR en borrador (Draft PR) → Usar siempre **COMMENT** (no aprobar/bloquear)
- Solo cambios en documentación/configuración → Revisión más ligera, foco en corrección
- Bandera explícita `--approve` o `--request-changes` → Sobrescribir decisión (pero reportar todos los hallazgos)

### Fase 6 — REPORTAR (REPORT)

Crear el artefacto de revisión en `.claude/reviews/pr-<NUMBER>-review.md` a menos que el repositorio ya use `.claude/PRPs/reviews/` para este flujo:

```markdown
# Revisión de PR: #<NUMBER> — <TITLE>

**Revisado**: <date>
**Autor**: <author>
**Rama**: <head> → <base>
**Decisión**: APPROVE | REQUEST CHANGES | BLOCK

## Resumen
<1-2 oraciones de evaluación general>

## Hallazgos

### CRÍTICO
<hallazgos o "Ninguno">

### ALTO
<hallazgos o "Ninguno">

### MEDIO
<hallazgos o "Ninguno">

### BAJO
<hallazgos o "Ninguno">

## Resultados de Validación

| Verificación | Resultado |
|---|---|
| Comprobación de tipos | Aprobado / Fallido / Omitido |
| Lint | Aprobado / Fallido / Omitido |
| Pruebas | Aprobado / Fallido / Omitido |
| Compilación | Aprobado / Fallido / Omitido |

## Archivos Revisados
<lista de archivos con tipo de cambio: Agregado/Modificado/Eliminado>
```

### Fase 7 — PUBLICAR (PUBLISH)

Publicar la revisión en GitHub:

```bash
# Si APPROVE
gh pr review <NUMBER> --approve --body "<resumen de la revisión>"

# Si REQUEST CHANGES
gh pr review <NUMBER> --request-changes --body "<resumen con correcciones requeridas>"

# Si solo COMMENT (PR en borrador o informativo)
gh pr review <NUMBER> --comment --body "<resumen>"
```

Para comentarios inline en líneas específicas, usar la API de comentarios de revisión de GitHub:
```bash
gh api "repos/{owner}/{repo}/pulls/<NUMBER>/comments" \
  -f body="<comentario>" \
  -f path="<archivo>" \
  -F line=<line-number> \
  -f side="RIGHT" \
  -f commit_id="$(gh pr view <NUMBER> --json headRefOid --jq .headRefOid)"
```

Alternativamente, publicar una revisión única con múltiples comentarios inline simultáneamente:
```bash
gh api "repos/{owner}/{repo}/pulls/<NUMBER>/reviews" \
  -f event="COMMENT" \
  -f body="<resumen general>" \
  --input comments.json  # [{"path": "archivo", "line": N, "body": "comentario"}, ...]
```

### Fase 8 — SALIDA (OUTPUT)

Reportar al usuario:

```
PR #<NUMBER>: <TITLE>
Decisión: <APPROVE|REQUEST_CHANGES|BLOCK>

Problemas: <critical_count> críticos, <high_count> altos, <medium_count> medios, <low_count> bajos
Validación: <pass_count>/<total_count> verificaciones aprobadas

Artefactos:
  Revisión: .claude/reviews/pr-<NUMBER>-review.md
  GitHub: <PR URL>

Próximos pasos:
  - <sugerencias contextuales basadas en la decisión>
```

---

## Casos Límite

- **Sin CLI de `gh`**: Volver a revisión solo local (leer el diff, omitir publicación en GitHub). Advertir al usuario.
- **Ramas divergentes**: Sugerir `git fetch origin && git rebase origin/<base>` antes de revisar.
- **PRs grandes (>50 archivos)**: Advertir sobre el alcance de la revisión. Centrarse primero en cambios de código fuente, luego pruebas y finalmente configuración/docs.
