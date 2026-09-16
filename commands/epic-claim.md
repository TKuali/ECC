---
description: Reclama un issue de tipo épica, registra el estado de coordinación y sincroniza la asignación local.
---

# /epic-claim

Reclama un issue de épica como la fuente única de verdad para una unidad de trabajo.

Usa el script de coordinación:

```bash
node scripts/github-coordination.js claim <issue-number> --repo <owner/repo> --actor <login>
```

Qué hace este comando:

1. Carga el cuerpo del issue y el bloque de coordinación.
2. Marca la épica como reclamada en el estado del issue en GitHub.
3. Actualiza las etiquetas y la caché local de SQLite.
4. Añade un comentario de auditoría correspondiente al reclamo.

Alias de compatibilidad:

- `/orch-add-feature`
- `/orch-change-feature`
- `/prp-implement`
