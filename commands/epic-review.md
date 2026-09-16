---
description: Marca la revisión de la épica como solicitada, aprobada o con cambios requeridos.
---

# /epic-review

Coordina el estado de revisión para un issue de épica.

```bash
node scripts/github-coordination.js review <issue-number> --repo <owner/repo> --review approved
```

Qué hace este comando:

1. Actualiza el estado de revisión en el bloque de coordinación.
2. Sincroniza las etiquetas de revisión en GitHub.
3. Registra el resultado de la revisión en un comentario de auditoría.
4. Mantiene la caché local alineada con el cuerpo del issue.

Alias de compatibilidad:

- `/review-pr`
- `/code-review`
