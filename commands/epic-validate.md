---
description: Valida la preparación, dependencias y política de coordinación de una épica.
---

# /epic-validate

Valida un issue individual de épica antes de publicar o transferir a revisión.

```bash
node scripts/github-coordination.js validate <issue-number> --repo <owner/repo>
```

Qué verifica este comando:

1. El estado de coordinación existe y puede analizarse.
2. El estado de validación cumple con la política establecida.
3. Las dependencias declaradas están cerradas.
4. La épica está lista para la siguiente etapa del flujo de trabajo.

Alias de compatibilidad:

- `/quality-gate`
