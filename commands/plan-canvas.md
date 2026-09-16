---
description: Abre un plan o artefacto HTML en el Plan Canvas del navegador para una revisión interactiva con anotaciones y aprobación.
argument-hint: "[ruta/al/artefacto.plan.md | ruta/al/artefacto.html]"
---

# Comando Plan Canvas

Abre un artefacto local en el Plan Canvas —la interfaz de revisión en el navegador de ECC— donde el usuario puede anotar elementos, chatear contigo y aprobar el plan o solicitar cambios sin salir de la página.

Este comando es un punto de entrada liviano sobre la skill `plan-canvas`. Consulta esa skill para ver el flujo de trabajo completo y las reglas.

## Qué hace este comando

1. Resuelve el artefacto: la ruta indicada, de lo contrario el archivo más reciente en `.claude/plans/*.plan.md`, o pregunta qué revisar.
2. `ecc-plan-canvas open <artifact>` — abre el navegador del usuario.
3. `ecc-plan-canvas await <artifact>` — espera hasta recibir retroalimentación, veredicto o fin de sesión; se mantiene en ejecución.
4. Aplica las observaciones al archivo del artefacto (el canvas se recarga en vivo), responde con `await <artifact> --reply "..."`, y repite hasta que el usuario apruebe o termine la sesión.

Un veredicto `approve` cuenta como confirmación del plan para controles estilo `/plan`: detén la espera, finaliza la sesión con `end` y comienza la implementación.

## Ejemplo

```
Usuario: /plan-canvas .claude/plans/notificaciones.plan.md

Asistente: (ejecuta open + await, se abre el navegador)
...el usuario hace clic en "Solicitar cambios" con dos anotaciones...
Asistente: (edita el plan, responde en el canvas, espera nuevamente)
...el usuario hace clic en "Aprobar plan"...
Asistente: Plan aprobado en el canvas — comenzando la implementación.
```

## Relacionado

- Skill `plan-canvas` — flujo completo, estructuras JSON de retroalimentación y reglas
- `/plan` — genera los artefactos de planes que este comando revisa
- Fuentes: `scripts/plan-canvas.js`, `scripts/lib/plan-canvas/`
