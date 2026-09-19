---
description: Orquesta la inicialización de un MVP funcional a partir de un documento de diseño/especificación — ingesta, partición en rebanadas (slices), andamiaje, TDD, revisión y commit controlado (reutiliza el harness GAN). Envoltorio para la skill orch-build-mvp.
---

# /orch-build-mvp

Inicia manualmente el orquestador **orch-build-mvp**: convierte un documento SDD/PRD/diseño de sistema en una rebanada vertical funcional de extremo a extremo.

## Uso

```
/orch-build-mvp <ruta al documento de diseño/especificación>
```

Ejemplos:

```
/orch-build-mvp civicpulse/docs/SDD-v0.6.md
```

## Qué hace este comando

Invoca la skill `orch-build-mvp` pasando `$ARGUMENTS` como la ruta del documento. La skill
(a través del motor compartido `orch-pipeline`, cubriendo el pipeline completo que incluye Scaffold):

1. Leerá la especificación; extraerá el alcance, las decisiones fijadas y una lista de características ordenada en **rebanadas verticales delgadas** (un camino de extremo a extremo primero). → **CONTROL 1 (GATE 1)** (aprobar plan de rebanadas).
2. Construirá el andamiaje (scaffolding) de la primera rebanada de extremo a extremo.
3. Reutilizará el harness GAN: traducirá el SDD en `gan-harness/spec.md` + `eval-rubric.md`, y luego ejecutará `/gan-build "<brief>" --skip-planner` (bucle generador → evaluador) hasta que la puntuación apruebe o se estabilice.
4. Ejecutará `code-reviewer` (+ `security-reviewer` ante cualquier rebanada que involucre seguridad), y realizará el commit del andamiaje y de cada rebanada como commits independientes con formato `feat:`. → **CONTROL 2 (GATE 2)**.

Si `$ARGUMENTS` está vacío, solicita al usuario la ruta hacia el documento de diseño o especificación.
