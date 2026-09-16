---
description: "Alias de /pr para la serie de flujos de trabajo PRP. Úsalo al crear un pull request a mitad del flujo PRP; de lo contrario usa /pr."
argument-hint: "[rama-base] (por defecto: main)"
---

# Crear Pull Request

> Adaptado de PRPs-agentic-eng por Wirasm. Parte de la serie de flujos de trabajo PRP.

**Entrada**: `$ARGUMENTS` — opcional, puede contener el nombre de una rama base y/o flags (ej., `--draft`).

**Parseo de `$ARGUMENTS`**:
- Extraer flags reconocidos (`--draft`)
- Tratar el texto restante como el nombre de la rama base
- Predeterminar la rama base en `main` si no se especifica ninguna

---

## Fase 1 — VALIDAR

Comprueba las condiciones previas:

```bash
git branch --show-current
git status --short
git log origin/<base>..HEAD --oneline
```

| Comprobación | Condición | Acción si Falla |
|---|---|---|
| No estar en rama base | Rama actual ≠ base | Detener: "Cambia a una rama de característica primero." |
| Directorio de trabajo limpio | Sin cambios sin confirmar | Advertir: "Tienes cambios sin confirmar. Haz commit o stash primero. Usa `/prp-commit` para hacer commit." |
| Tiene commits por delante | `git log origin/<base>..HEAD` no está vacío | Detener: "No hay commits por delante de `<base>`. Nada que incluir en el PR." |
| No existe PR previo | `gh pr list --head <branch> --json number` está vacío | Detener: "El PR ya existe: #<número>. Usa `gh pr view <número> --web` para abrirlo." |

Si todas las comprobaciones pasan, continúa.

---

## Fase 2 — DESCUBRIR

### Plantilla de PR

Busca la plantilla de PR en el siguiente orden:

1. Directorio `.github/PULL_REQUEST_TEMPLATE/` — si existe, lista los archivos y permite elegir (o usa `default.md`)
2. `.github/PULL_REQUEST_TEMPLATE.md`
3. `.github/pull_request_template.md`
4. `docs/pull_request_template.md`

Si se encuentra, léela y usa su estructura para el cuerpo del PR.

### Análisis de Commits

```bash
git log origin/<base>..HEAD --format="%h %s" --reverse
```

Analiza los commits para determinar:
- **Título del PR**: Usa el formato de commit convencional con prefijo de tipo — `feat: ...`, `fix: ...`, etc.
  - Si hay múltiples tipos, usa el dominante
  - Si es un solo commit, usa su mensaje tal cual
- **Resumen de cambios**: Agrupa los commits por tipo/área

### Análisis de Archivos

```bash
git diff origin/<base>..HEAD --stat
git diff origin/<base>..HEAD --name-only
```

Categoriza los archivos modificados: código fuente, pruebas, documentación, configuración, migraciones.

### Artefactos PRP

Comprueba si existen artefactos PRP relacionados:
- `.claude/PRPs/reports/` — Reportes de implementación
- `.claude/PRPs/plans/` — Planes ejecutados
- `.claude/PRPs/prds/` — PRDs relacionados

Haz referencia a estos en el cuerpo del PR si existen.

---

## Fase 3 — EMPUJAR (PUSH)

```bash
git push -u origin HEAD
```

Si el push falla debido a divergencia:
```bash
git fetch origin
git rebase origin/<base>
git push -u origin HEAD
```

Si ocurren conflictos durante el rebase, detén e informa al usuario.

---

## Fase 4 — CREAR

### Con Plantilla

Si se encontró una plantilla de PR en la Fase 2, completa cada sección utilizando el análisis de commits y archivos. Conserva todas las secciones de la plantilla — deja las secciones como "N/A" si no corresponden en lugar de eliminarlas.

### Sin Plantilla

Utiliza este formato predeterminado:

```markdown
## Resumen

<descripción de 1-2 oraciones sobre qué hace este PR y por qué>

## Cambios

<lista con viñetas de cambios agrupados por área>

## Archivos Modificados

<tabla o lista de archivos modificados con tipo de cambio: Añadido/Modificado/Eliminado>

## Pruebas

<descripción de cómo se probaron los cambios, o "Requiere pruebas">

## Issues Relacionados

<issues vinculados con Closes/Fixes/Relates to #N, o "Ninguno">
```

### Crear el PR

```bash
gh pr create \
  --title "<título del PR>" \
  --base <rama-base> \
  --body "<cuerpo del PR>"
  # Añade --draft si se detectó el flag --draft en $ARGUMENTS
```

---

## Fase 5 — VERIFICAR

```bash
gh pr view --json number,url,title,state,baseRefName,headRefName,additions,deletions,changedFiles
gh pr checks --json name,status,conclusion 2>/dev/null || true
```

---

## Fase 6 — SALIDA

Informa al usuario:

```
PR #<número>: <título>
URL: <url>
Rama: <head> → <base>
Cambios: +<adiciones> -<eliminaciones> en <changedFiles> archivos

Comprobaciones de CI: <resumen de estado o "pendiente" o "ninguna configurada">

Artefactos referenciados:
  - <cualquier reporte/plan PRP vinculado en el PR>

Siguientes pasos:
  - gh pr view <número> --web   → abrir en el navegador
  - /code-review <número>       → revisar el PR
  - gh pr merge <número>        → fusionar cuando esté listo
```

---

## Casos Límite

- **Sin CLI `gh`**: Detén con: "Se requiere GitHub CLI (`gh`). Instálalo en: <https://cli.github.com/>"
- **No autenticado**: Detén con: "Ejecuta `gh auth login` primero."
- **Force push necesario**: Si el remoto divergió y se hizo rebase, usa `git push --force-with-lease` (nunca `--force`).
- **Múltiples plantillas de PR**: Si `.github/PULL_REQUEST_TEMPLATE/` tiene varios archivos, lístalos y pide al usuario que elija.
- **PR grande (>20 archivos)**: Advierte sobre el tamaño del PR. Sugiere dividirlo si los cambios son lógicamente separables.
