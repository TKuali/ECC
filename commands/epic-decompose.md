---
description: Desglosa una épica en tareas hijas sin crear ramas de tareas.
---

# /epic-decompose

Concilia el desglose de tareas para un issue de épica.

```bash
node scripts/github-coordination.js decompose <issue-number> --repo <owner/repo>
```

Qué hace este comando:

1. Lee el cuerpo del issue de la épica en busca de listas de verificación de tareas y referencias de dependencias.
2. Almacena la descomposición en el bloque de coordinación.
3. Mantiene las ramas de tareas fuera del flujo de trabajo.
4. Añade un comentario de auditoría conciso.

Alias de compatibilidad:

- `/plan`
- `/prp-plan`
