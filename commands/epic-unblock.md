---
description: Revisa los issues de épicas bloqueadas y reactiva cualquiera cuyas dependencias se hayan cerrado.
---

# /epic-unblock

Revisa épicas bloqueadas cuyas dependencias declaradas ya han sido completadas.

```bash
node scripts/github-coordination.js unblock --repo <owner/repo>
```

Qué hace este comando:

1. Escanea los issues de épicas en el repositorio.
2. Comprueba la lista de dependencias de cada épica bloqueada.
3. Traslada las épicas completamente desbloqueadas al estado listas (ready).
4. Actualiza etiquetas, comentarios y capturas instantáneas locales.

Alias de compatibilidad:

- `/loop-status`
