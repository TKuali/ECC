---
description: Sincroniza los cuerpos de los issues de épicas, etiquetas y capturas de coordinación local desde GitHub.
---

# /epic-sync

Ejecuta una sincronización determinista para issues de épicas.

```bash
node scripts/github-coordination.js sync --repo <owner/repo>
```

Qué hace este comando:

1. Lee los cuerpos de los issues como el estado canónico de la épica.
2. Concilia el bloque de coordinación con las etiquetas.
3. Escribe una nueva captura instantánea local para cada issue de épica.
4. Mantiene la caché de SQLite alineada con GitHub.

Alias de compatibilidad:

- `/projects`
- `/work-items sync-github`
