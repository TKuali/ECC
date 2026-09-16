---
description: "Commit rápido con selección de archivos en lenguaje natural — describe qué confirmar en lenguaje sencillo"
argument-hint: "[descripción del objetivo] (en blanco = todos los cambios)"
---

# Commit Inteligente (Smart Commit)

> Adaptado de PRPs-agentic-eng por Wirasm. Parte de la serie de flujos de trabajo PRP.

**Entrada**: $ARGUMENTS

---

## Fase 1 — EVALUAR

```bash
git status --short
```

Si la salida está vacía → detenerse: "No hay nada para hacer commit."

Muestra al usuario un resumen de lo que ha cambiado (añadidos, modificados, eliminados, sin seguimiento).

---

## Fase 2 — INTERPRETAR Y PREPARAR (STAGE)

Interpreta `$ARGUMENTS` para determinar qué archivos preparar:

| Entrada | Interpretación | Comando Git |
|---|---|---|
| *(en blanco / vacío)* | Preparar todo | `git add -A` |
| `staged` | Usar lo que ya esté preparado | *(sin git add)* |
| `*.ts` o `*.py` etc. | Preparar archivos que coincidan con el patrón | `git add '*.ts'` |
| `except tests` | Preparar todo y luego desmarcar pruebas | `git add -A && git reset -- '**/*.test.*' '**/*.spec.*' '**/test_*' 2>/dev/null \|\| true` |
| `only new files` | Preparar solo archivos sin seguimiento (untracked) | `git ls-files --others --exclude-standard \| grep . && git ls-files --others --exclude-standard \| xargs git add` |
| `the auth changes` | Interpretar a partir del estado/diff — buscar archivos de autenticación | `git add <archivos coincidentes>` |
| Nombres de archivos específicos | Preparar esos archivos | `git add <archivos>` |

Para entradas en lenguaje natural (como "los cambios de autenticación"), coteja la salida de `git status` y `git diff` para identificar los archivos pertinentes. Muestra al usuario qué archivos estás preparando y por qué.

```bash
git add <archivos determinados>
```

Tras preparar, verifica:
```bash
git diff --cached --stat
```

Si no hay nada preparado, detente: "Ningún archivo coincidió con tu descripción."

---

## Fase 3 — CONFIRMAR (COMMIT)

Redacta un mensaje de commit de una sola línea en modo imperativo:

```
{tipo}: {descripción}
```

Tipos:
- `feat` — Nueva característica o funcionalidad
- `fix` — Corrección de errores
- `refactor` — Reestructuración de código sin cambios de comportamiento
- `docs` — Cambios en la documentación
- `test` — Incorporación o actualización de pruebas
- `chore` — Tareas de compilación, configuración, dependencias
- `perf` — Mejoras de rendimiento
- `ci` — Cambios en integración y entrega continua (CI/CD)

Reglas:
- Modo imperativo ("añadir característica" en vez de "añadida característica")
- Minúsculas tras el prefijo del tipo
- Sin punto al final
- Menos de 72 caracteres
- Describe QUÉ cambió, no CÓMO

```bash
git commit -m "{tipo}: {descripción}"
```

---

## Fase 4 — SALIDA

Informa al usuario:

```
Confirmado: {hash_short}
Mensaje:    {tipo}: {descripción}
Archivos:   {count} archivo(s) modificado(s)

Siguientes pasos:
  - git push           → subir al repositorio remoto
  - /prp-pr            → crear un pull request
  - /code-review       → revisar antes de subir
```

---

## Ejemplos

| Tú dices | Qué ocurre |
|---|---|
| `/prp-commit` | Prepara todo y autogenera el mensaje |
| `/prp-commit staged` | Hace commit solo de lo que ya esté preparado |
| `/prp-commit *.ts` | Prepara todos los archivos TypeScript y hace commit |
| `/prp-commit except tests` | Prepara todo excepto los archivos de prueba |
| `/prp-commit the database migration` | Busca archivos de migración de BD desde el estado y los prepara |
| `/prp-commit only new files` | Prepara solo los archivos nuevos sin seguimiento |
