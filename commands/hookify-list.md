---
description: Lista todas las reglas configuradas de hookify
---

# Listar Reglas de Hookify

Busca y muestra todas las reglas de hookify en una tabla formateada.

## Pasos

1. Buscar todos los archivos `.claude/hookify.*.local.md`
2. Leer el frontmatter de cada archivo:
   - `name`
   - `enabled`
   - `event`
   - `action`
   - `pattern`
3. Mostrarlos en una tabla:

| Regla | Habilitada | Evento | Patrón | Archivo |
|---|---|---|---|---|

4. Mostrar la cantidad de reglas y recordar al usuario que `/hookify-configure` puede cambiar su estado posteriormente.
