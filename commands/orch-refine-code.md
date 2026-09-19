---
description: Orquesta una refactorización que preserva el comportamiento — confirma que las pruebas estén en verde, reestructura sin alterar el comportamiento, mantiene las pruebas en verde, revisa y realiza un commit controlado. Envoltorio para la skill orch-refine-code.
---

# /orch-refine-code

Inicia manualmente el orquestador **orch-refine-code**: mejora la estructura manteniendo el comportamiento exactamente idéntico, utilizando la suite de pruebas existente como red de seguridad.

## Uso

```
/orch-refine-code <qué reestructurar>
```

Ejemplos:

```
/orch-refine-code extraer el cliente HTTP de NWS fuera de poller.py
/orch-refine-code eliminar código muerto y duplicación en el módulo dashboard
```

## Qué hace este comando

Invoca la skill `orch-refine-code` pasando `$ARGUMENTS` como la solicitud. La skill
(a través del motor compartido `orch-pipeline`):

1. Clasificará el tamaño (base predeterminada: estándar — las reestructuraciones tocan múltiples archivos).
2. Confirmará que las pruebas relevantes existan y estén en **verde antes** de tocar el código; añadirá pruebas de caracterización primero si la cobertura es escasa. Planificará la reestructuración. → **CONTROL 1 (GATE 1)**.
3. Reestructurará en pasos pequeños, volviendo a ejecutar las pruebas tras cada cambio (sin nuevas pruebas de comportamiento — la suite existente demuestra que el comportamiento no cambió). Las limpiezas de código muerto y duplicados se delegan a `refactor-cleaner`.
4. Ejecutará `code-reviewer`, y realizará el commit como `refactor:` (el diff debe ser neutro en comportamiento). → **CONTROL 2 (GATE 2)**.

Usa este comando únicamente cuando el comportamiento **no deba** cambiar. Si el comportamiento debe modificarse en absoluto, usa `/orch-change-feature` o `/orch-fix-defect`.

Si `$ARGUMENTS` está vacío, consulta al usuario qué desea refactorizar o pulir.
