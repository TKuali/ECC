---
description: Publica una actualización validada de la épica en el issue y en la caché local.
---

# /epic-publish

Publica una actualización de coordinación validada en GitHub.

```bash
node scripts/github-coordination.js publish <issue-number> --repo <owner/repo>
```

Qué hace este comando:

1. Revalida la épica antes de publicar.
2. Actualiza el bloque de coordinación en el cuerpo del issue.
3. Añade un comentario de publicación conciso.
4. Registra la captura instantánea local final.

Alias de compatibilidad:

- `/pr`
- `/prp-pr`
