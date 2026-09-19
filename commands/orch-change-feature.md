---
description: Orquesta la modificación de una característica existente y funcional hacia un nuevo comportamiento deseado — actualiza las pruebas a la nueva especificación, modifica la implementación, revisa y realiza un commit controlado. Envoltorio para la skill orch-change-feature.
---

# /orch-change-feature

Inicia manualmente el orquestador **orch-change-feature**: cambia un comportamiento que ya funciona hacia una nueva especificación deseada, priorizando las pruebas.

## Uso

```
/orch-change-feature <el nuevo comportamiento deseado>
```

Ejemplos:

```
/orch-change-feature hacer que nws-poller alerte a las 2 advertencias en lugar de 3
/orch-change-feature en lugar de ordenar por fecha, ordenar por prioridad
```

## Qué hace este comando

Invoca la skill `orch-change-feature` pasando `$ARGUMENTS` como la solicitud. La skill
(a través del motor compartido `orch-pipeline`):

1. Clasificará el tamaño (base predeterminada: pequeño) e indicará el nivel.
2. Realizará una planificación ligera solo si el nuevo comportamiento requiere investigación. → **CONTROL 1 (GATE 1)** (aprobar plan de pruebas modificadas).
3. **Actualizará las pruebas existentes** para expresar el nuevo comportamiento, y luego modificará la
   implementación hasta que pase a verde. (Modificar primero las pruebas es lo que define a esto como un
   ajuste y no una corrección de errores).
4. Ejecutará `code-reviewer` (+ `security-reviewer` ante un desencadenador de seguridad) y luego realizará el commit. → **CONTROL 2 (GATE 2)**.

Usa este comando únicamente cuando la característica **funciona** pero debe comportarse de otra manera — no para
errores de código (`/orch-fix-defect`) ni para características completamente nuevas (`/orch-add-feature`).

Si `$ARGUMENTS` está vacío, consulta al usuario qué comportamiento desea cambiar.
