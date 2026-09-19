---
description: Orquesta la creación de una característica completamente nueva de principio a fin — investigación, plan, TDD, revisión y commit controlado. Envoltorio que activa la skill orch-add-feature.
---

# /orch-add-feature

Inicia manualmente el orquestador **orch-add-feature**: un pipeline estructurado de
Investigación → Plan → TDD → Revisión → Commit para capacidades totalmente nuevas.

## Uso

```
/orch-add-feature <qué agregar>
```

Ejemplos:

```
/orch-add-feature añadir inicio de sesión OAuth2 a nws-poller
/orch-add-feature soportar exportación CSV en el dashboard
```

## Qué hace este comando

Invoca la skill `orch-add-feature` pasando `$ARGUMENTS` como la solicitud. La skill
(a través del motor compartido `orch-pipeline`):

1. Clasificará el tamaño e indicará el nivel en una sola línea.
2. Investigará librerías/patrones existentes y planificará una `task_list`. → **CONTROL 1 (GATE 1)** (aprobar plan).
3. Aplicará TDD a cada tarea (nuevas pruebas que fallan → verde) y luego invocará a `code-reviewer`
   (+ `security-reviewer` si se tocan puntos críticos de seguridad).
4. Realizará el commit siguiendo el formato convencional `feat:`. → **CONTROL 2 (GATE 2)** (confirmar antes del commit).

Respeta ambos controles — no escribas implementación antes del Control 1, no realices commits antes del Control 2.

Si `$ARGUMENTS` está vacío, consulta al usuario qué capacidad desea añadir.
