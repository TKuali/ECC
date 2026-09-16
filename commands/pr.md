---
description: "Crea una PR de GitHub desde la rama actual con commits sin publicar — detecta plantillas, analiza cambios y hace push"
argument-hint: "[rama-base] (por defecto: main)"
---

# Crear Pull Request

**Entrada**: `$ARGUMENTS` — opcional, puede contener el nombre de una rama base y/o banderas (p. ej., `--draft`).

**Analizar `$ARGUMENTS`**:
- Extraer cualquier bandera reconocida (`--draft`)
- Tratar el texto restante como el nombre de la rama base
- Usar `main` por defecto si no se especifica ninguna rama base

---

## Fase 1 — VALIDAR (VALIDATE)

Comprobar condiciones previas:

```bash
git branch --show-current
git status --short
git log origin/<base>..HEAD --oneline
```

| Comprobación | Condición | Acción ante Fallo |
|---|---|---|
| No estar en la rama base | Rama actual ≠ base | Detener: "Cambia a una rama de funcionalidad (feature branch) primero." |
| Directorio de trabajo limpio | Sin cambios no confirmados | Advertir: "Tienes cambios no confirmados. Haz commit o stash primero." |
| Tiene commits por delante | `git log origin/<base>..HEAD` no vacío | Detener: "No hay commits por delante de `<base>`. Nada para crear PR." |
| No existe PR previa | `gh pr list --head <branch> --json number` está vacío | Detener: "La PR ya existe: #<number>. Usa `gh pr view <number> --web` para abrirla." |

Si todas las comprobaciones pasan, continuar.

---

## Fase 2 — DESCUBRIR (DISCOVER)

### Plantilla de PR

Buscar la plantilla de PR en este orden:

1. Directorio `.github/PULL_REQUEST_TEMPLATE/` — si existe, listar archivos y permitir que el usuario elija (o usar `default.md`)
2. `.github/PULL_REQUEST_TEMPLATE.md`
3. `.github/pull_request_template.md`
4. `docs/pull_request_template.md`

Si se encuentra, leerla y usar su estructura para el cuerpo de la PR.

### Análisis de Commits

```bash
git log origin/<base>..HEAD --format="%h %s" --reverse
```

Analizar los commits para determinar:
- **Título de la PR**: Usar formato de commits convencionales con prefijo de tipo — `feat: ...`, `fix: ...`, etc.
  - Si hay múltiples tipos, usar el dominante
  - Si hay un solo commit, usar su mensaje tal cual
- **Resumen de cambios**: Agrupar commits por tipo/área

### Análisis de Archivos

```bash
git diff origin/<base>..HEAD --stat
git diff origin/<base>..HEAD --name-only
```

Categorizar archivos modificados: fuente, pruebas, documentación, configuración, migraciones.

### Artefactos de Planificación

Comprobar si existen artefactos relacionados producidos por `/plan-prd`, `/plan` o el flujo legado de PRP:
- `.claude/prds/` — PRDs de los cuales esta PR implementa un hito
- `.claude/plans/` — Planes ejecutados por esta PR
- `.claude/PRPs/prds/` — PRDs legados de PRP
- `.claude/PRPs/plans/` — Planes de implementación legados de PRP
- `.claude/PRPs/reports/` — Reportes de implementación legados de PRP

Hacer referencia a ellos en el cuerpo de la PR si existen.

---

## Fase 3 — PUSH

```bash
git push -u origin HEAD
```

Si el push falla debido a divergencia:
```bash
git fetch origin
git rebase origin/<base>
git push -u origin HEAD
```

Si ocurren conflictos de rebase, detenerse e informar al usuario.

---

## Fase 4 — CREAR (CREATE)

### Con Plantilla

Si se encontró una plantilla de PR en la Fase 2, completar cada sección utilizando el análisis de commits y archivos. Conservar todas las secciones de la plantilla — dejarlas como "N/A" si no aplican en lugar de eliminarlas.

### Sin Plantilla

Utilizar este formato por defecto:

```markdown
## Resumen

<1-2 oraciones describiendo qué hace esta PR y por qué>

## Cambios

<lista con viñetas de cambios agrupados por área>

## Archivos Modificados

<tabla o lista de archivos modificados con tipo de cambio: Agregado/Modificado/Eliminado>

## Pruebas

<descripción de cómo se probaron los cambios, o "Requiere pruebas">

## Incidencias Relacionadas

<incidencias vinculadas con Closes/Fixes/Relates to #N, o "Ninguna">
```

### Crear la PR

```bash
gh pr create \
  --title "<PR title>" \
  --base <base-branch> \
  --body "<PR body>"
  # Añadir --draft si se detectó la bandera --draft en $ARGUMENTS
```

---

## Fase 5 — VERIFICAR (VERIFY)

```bash
gh pr view --json number,url,title,state,baseRefName,headRefName,additions,deletions,changedFiles
gh pr checks --json name,status,conclusion 2>/dev/null || true
```

---

## Fase 6 — SALIDA (OUTPUT)

Reportar al usuario:

```
PR #<number>: <title>
URL: <url>
Rama: <head> → <base>
Cambios: +<additions> -<deletions> en <changedFiles> archivos

Verificaciones CI: <resumen de estado o "pendiente" o "ninguna configurada">

Artefactos referenciados:
  - <cualquier PRD/plan enlazado en el cuerpo de la PR>

Próximos pasos:
  - gh pr view <number> --web   → abrir en navegador
  - /code-review <number>       → revisar la PR
  - gh pr merge <number>        → fusionar cuando esté lista
```

---

## Casos Límite

- **Sin CLI de `gh`**: Detenerse con: "Se requiere GitHub CLI (`gh`). Instalar: <https://cli.github.com/>"
- **Sin autenticación**: Detenerse con: "Ejecuta primero `gh auth login`."
- **Se requiere Force Push**: Si el remoto divergió y se hizo rebase, usar `git push --force-with-lease` (nunca `--force`).
- **Múltiples plantillas de PR**: Si `.github/PULL_REQUEST_TEMPLATE/` tiene varios archivos, listarlos y pedirle al usuario que elija.
- **PR grande (>20 archivos)**: Advertir sobre el tamaño de la PR. Sugerir dividirla si los cambios son lógicamente separables.
