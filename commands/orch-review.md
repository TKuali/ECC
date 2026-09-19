---
description: Ejecuta el flujo de trabajo nativo orch-review sobre un diff (cambios locales o un PR de GitHub) e informa los hallazgos bloqueantes frente a los consultivos. Interfaz para el flujo de trabajo orch-review.
argument-hint: [numero-pr | url-pr | en blanco para cambios locales no confirmados]
---

# /orch-review

Interfaz para `workflows/orch-review.workflow.js` —la adaptación nativa en Workflow de la Fase 5 (Revisión) de orch-pipeline—. Este comando calcula un diff, se lo entrega al flujo de trabajo y presenta el resultado. El flujo de trabajo asume la distribución en abanico (un revisor por dimensión, desduplicación y verificación adversarial); este comando gestiona la entrada y la salida.

**Entrada**: $ARGUMENTS

---

## Selección de Modo

| Entrada | Modo |
|---|---|
| En blanco | **Modo Local** — revisa cambios sin confirmar |
| Número (ej. `42`) o URL de PR | **Modo PR** — revisa un PR de GitHub |

---

## Fase 1 — RECOPILAR (GATHER)

Construye el diff unificado y los metadatos requeridos por el flujo de trabajo.

**Modo Local:**

```bash
git diff --name-only HEAD          # changedFiles
git diff HEAD                      # diff text
```

Si el diff está vacío, detén la ejecución: "No hay nada para revisar."

**Modo PR:**

Primero deriva un **identificador numérico seguro de PR** a partir de `$ARGUMENTS` — nunca pases el argumento crudo al shell. Acepta un entero simple o el número final de una URL `https://github.com/<owner>/<repo>/pull/<N>`. Rechaza cualquier otro formato (texto adicional, metacaracteres de shell, URLs que no sean de PR) y detén con error. Usa únicamente el entero extraído `<NUMBER>` abajo:

```bash
gh pr diff <NUMBER>                       # diff text
gh pr view <NUMBER> --json files \
  --jq '.files[].path'                    # changedFiles
```

Si no se encuentra el PR, detén la ejecución con error.

Luego deriva `language` a partir de la extensión dominante de los archivos modificados (por ejemplo `.ts`/`.tsx` a `typescript`, `.py` a `python`, `.go` a `go`). Déjalo sin definir cuando el cambio sea mixto o no sea código — el flujo de trabajo simplemente omitirá al revisor específico de lenguaje.

## Fase 2 — INVOCAR (INVOKE)

Invoca la herramienta Workflow. El flujo de trabajo valida su propia entrada y falla de forma cerrada si el diff falta o está vacío, por lo que siempre debes pasar un `diff` con contenido.

```jsonc
Workflow({
  scriptPath: "workflows/orch-review.workflow.js",
  args: {
    diff: "<texto del diff unificado de la Fase 1>", // requerido
    language: "typescript",                          // opcional
    changedFiles: ["src/auth.ts"]                    // opcional — alimenta el disparador de seguridad
  }
})
```

El flujo de trabajo distribuye revisores en paralelo, desduplica los hallazgos basándose en el fragmento de evidencia normalizado y ejecuta un verificador adversarial sobre cada hallazgo único CRITICAL/HIGH. Retorna:

```jsonc
{
  "verdict": "APPROVE" | "CHANGES_REQUESTED",
  "incomplete": false,                 // true si una dimensión de revisión falló al ejecutarse
  "failedDimensions": [ /* { dimension, error } */ ],
  "blocking": [ /* hallazgos confirmados CRITICAL/HIGH + no verificables */ ],
  "advisory": [ /* hallazgos MEDIUM/LOW + refutados de forma adversarial */ ],
  "stats": { "dimensions": 3, "failed": 0, "raw": 11, "unique": 4, "confirmed": 3, "unverified": 0, "uncertain": 0, "refuted": 1 }
}
```

## Fase 3 — REPORTAR (REPORT)

Presenta el resultado al usuario (este es el control de revisión humana; el flujo de trabajo no realiza commits):

- Encabeza con el veredicto `verdict` y la línea estadística `stats` (dimensiones, reducción de brutos a únicos).
- Enumera cada hallazgo bloqueante `blocking` con su archivo, severidad y evidencia — estos deben subsanarse antes de un commit. Los hallazgos etiquetados como "no se pudo verificar" permanecen en `blocking` por diseño; señálalos como pendientes de confirmación manual.
- Enumera brevemente los hallazgos consultivos `advisory` (elementos MEDIUM/LOW y refutados por el verificador).
- Si `incomplete` es true, indica qué dimensiones en `failedDimensions` no se ejecutaron y aclara que, por lo tanto, el veredicto no es una aprobación limpia.

## Contrato de Cierre Seguro (Fail-Closed)

Este comando nunca debe presentar un veredicto APPROVE limpio cuando la revisión no pudo ejecutarse en su totalidad. Si la herramienta Workflow genera un error, reporta el fallo — no recurras a una revisión manual improvisada ni des a entender que el diff fue aprobado.

---

## Casos Límite

- **Sin CLI `gh` (Modo PR)**: detén e informa al usuario que el Modo PR requiere `gh`; sugiere usar el Modo Local sobre una rama descargada localmente.
- **Diff grande**: el flujo de trabajo limita automáticamente la concurrencia de revisores, por lo que un diff extenso es más lento pero seguro; advierte al usuario que puede demorar más.
- **Archivos binarios o generados**: descártalos de `changedFiles` antes de invocar — añaden ruido al disparador de seguridad sin aportar contenido revisable.
