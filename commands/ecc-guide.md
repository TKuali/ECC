---
description: Navega por los agentes, habilidades, comandos, hooks, perfiles de instalación y documentación actuales de ECC desde la superficie viva del repositorio.
---

# /ecc-guide

Usa este comando como un mapa interactivo de Everything Claude Code. Ayuda al usuario a descubrir el componente adecuado de ECC para su tarea sin volcar todo el README ni conteos de catálogo desactualizados.

## Uso

```text
/ecc-guide
/ecc-guide setup
/ecc-guide skills
/ecc-guide commands
/ecc-guide hooks
/ecc-guide install
/ecc-guide find: <consulta>
/ecc-guide <nombre-de-archivo-o-funcionalidad>
```

## Reglas de Operación

1. Leer los archivos actuales del repositorio antes de responder cuando el checkout esté disponible.
2. Preferir datos actuales del sistema de archivos/catálogo frente a conteos prefijados.
3. Mantener la primera respuesta breve, ofreciendo luego opciones específicas de profundización.
4. Enlazar a los usuarios con los archivos canónicos en lugar de copiar secciones extensas.
5. No inventar comandos, habilidades, agentes o perfiles de instalación que no estén presentes.

## Qué Inspeccionar

Usar estos archivos como mapa canónico:

- `README.md` para rutas de instalación, guía de reinicio/desinstalación y posicionamiento general
- `AGENTS.md` para guía de colaboradores y estructura del proyecto
- `agent.yaml` para la superficie exportada de agentes y comandos
- `commands/` para adaptadores (shims) de comandos de barra diagonal mantenidos
- `skills/*/SKILL.md` para flujos de trabajo reutilizables de habilidades
- `agents/*.md` para roles de agentes delegados
- `hooks/README.md` y `hooks/hooks.json` para el comportamiento de los hooks
- `manifests/install-*.json` para módulos de instalación selectiva, componentes y perfiles
- `scripts/ci/catalog.js --json` para conteos en vivo del catálogo al ejecutar dentro de ECC

## Patrones de Respuesta

### Sin Argumentos

Ofrecer un menú compacto:

- configuración e instalación
- elección de habilidades
- adaptadores de compatibilidad de comandos
- agentes y delegación
- hooks y seguridad
- resolución de problemas de instalación
- búsqueda de una funcionalidad específica

Luego preguntar qué desea hacer a continuación.

### Búsqueda por Tema

Para temas como `skills`, `commands`, `hooks`, `install` o `agents`:

1. Resumir la superficie actual en 3 a 6 viñetas.
2. Apuntar a los directorios/archivos canónicos.
3. Sugerir uno o dos comandos que puedan verificar el estado.
4. Evitar listas exhaustivas a menos que el usuario lo solicite.

### Modo de Búsqueda

Para `find: <consulta>`:

1. Buscar en los archivos relevantes con `rg`.
2. Agrupar resultados por tipo: habilidades, comandos, agentes, reglas, docs, hooks.
3. Retornar las coincidencias más sólidas primero con rutas de archivo.
4. Recomendar la acción siguiente para cada coincidencia.

### Búsqueda por Funcionalidad

Para un nombre de funcionalidad específico:

1. Comprobar primero las rutas exactas, como `skills/<name>/SKILL.md`, `commands/<name>.md` y `agents/<name>.md`.
2. Si la búsqueda exacta no tiene éxito, buscar con `rg`.
3. Explicar qué hace la funcionalidad, cuándo usarla y cuál es el archivo canónico.
4. Mencionar funcionalidades adyacentes solo si reducen la confusión.

## Comandos Relacionados

- `/project-init` para incorporación adaptada al stack tecnológico de un proyecto objetivo
- `/harness-audit` para puntuación determinista de preparación del repositorio
- `/skill-health` para revisiones de calidad de habilidades
- `/skill-create` para extraer una nueva habilidad del historial local de git
- `/security-scan` para revisión de seguridad de la configuración de Claude/OpenCode
