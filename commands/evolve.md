---
name: evolve
description: Analiza instintos y sugiere o genera estructuras evolucionadas
command: true
---

# Comando Evolve

## Implementación

Ejecuta el CLI de instintos usando la ruta raíz del plugin:

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/skills/continuous-learning-v2/scripts/instinct-cli.py" evolve [--generate]
```

O si `CLAUDE_PLUGIN_ROOT` no está configurado (instalación manual):

```bash
python3 ~/.claude/skills/continuous-learning-v2/scripts/instinct-cli.py evolve [--generate]
```

Analiza instintos y agrupa los relacionados en estructuras de nivel superior:
- **Comandos**: Cuando los instintos describen acciones invocadas por el usuario
- **Habilidades (Skills)**: Cuando los instintos describen comportamientos activados automáticamente
- **Agentes**: Cuando los instintos describen procesos complejos de múltiples pasos

## Uso

```
/evolve                    # Analizar todos los instintos y sugerir evoluciones
/evolve --generate         # También generar archivos en evolved/{skills,commands,agents}
```

## Reglas de Evolución

### → Comando (Invocado por el Usuario)
Cuando los instintos describen acciones que un usuario solicitaría explícitamente:
- Múltiples instintos sobre "cuando el usuario pide..."
- Instintos con disparadores como "al crear un nuevo X"
- Instintos que siguen una secuencia repetible

Ejemplo:
- `new-table-step1`: "al añadir una tabla a la base de datos, crear migración"
- `new-table-step2`: "al añadir una tabla a la base de datos, actualizar esquema"
- `new-table-step3`: "al añadir una tabla a la base de datos, regenerar tipos"

→ Crea el comando: **new-table**

### → Habilidad (Activada Automáticamente)
Cuando los instintos describen comportamientos que deberían ocurrir automáticamente:
- Disparadores de coincidencia de patrones
- Respuestas de manejo de errores
- Aplicación de estilos de código

Ejemplo:
- `prefer-functional`: "al escribir funciones, preferir estilo funcional"
- `use-immutable`: "al modificar estado, usar patrones inmutables"
- `avoid-classes`: "al diseñar módulos, evitar diseño basado en clases"

→ Crea la habilidad: `functional-patterns`

### → Agente (Requiere Profundidad/Aislamiento)
Cuando los instintos describen procesos complejos y de múltiples pasos que se benefician del aislamiento:
- Flujos de depuración
- Secuencias de refactorización
- Tareas de investigación

Ejemplo:
- `debug-step1`: "al depurar, primero revisar logs"
- `debug-step2`: "al depurar, aislar el componente que falla"
- `debug-step3`: "al depurar, crear reproducción mínima"
- `debug-step4`: "al depurar, verificar la solución con pruebas"

→ Crea el agente: **debugger**

## Qué Hacer

1. Detectar el contexto del proyecto actual
2. Leer los instintos del proyecto + globales (el proyecto tiene precedencia ante colisiones de ID)
3. Agrupar instintos por patrones de disparador/dominio
4. Identificar:
   - Candidatos a habilidad (grupos de disparadores con 2+ instintos)
   - Candidatos a comando (instintos de flujo de trabajo de alta confianza)
   - Candidatos a agente (grupos más grandes y de alta confianza)
5. Mostrar candidatos a promoción (proyecto -> global) cuando corresponda
6. Si se pasa `--generate`, escribir archivos en:
   - Ámbito de proyecto: `~/.claude/homunculus/projects/<project-id>/evolved/`
   - Respaldo global: `~/.claude/homunculus/evolved/`

## Formato de Salida

```
============================================================
  ANÁLISIS DE EVOLUCIÓN - 12 instintos
  Proyecto: mi-app (a1b2c3d4e5f6)
  Ámbito de proyecto: 8 | Global: 4
============================================================

Instintos de alta confianza (>=80%): 5

## CANDIDATOS A HABILIDAD
1. Grupo: "añadir pruebas"
   Instintos: 3
   Confianza prom.: 82%
   Dominios: testing
   Ámbitos: proyecto

## CANDIDATOS A COMANDO (2)
  /adding-tests
    Desde: test-first-workflow [proyecto]
    Confianza: 84%

## CANDIDATOS A AGENTE (1)
  adding-tests-agent
    Cubre 3 instintos
    Confianza prom.: 82%
```

## Banderas (Flags)

- `--generate`: Genera archivos evolucionados además de la salida del análisis

## Formato de Archivos Generados

### Comando
```markdown
---
name: new-table
description: Crea una nueva tabla de base de datos con migración, actualización de esquema y generación de tipos
command: /new-table
evolved_from:
  - new-table-migration
  - update-schema
  - regenerate-types
---

# Comando New Table

[Contenido generado según los instintos agrupados]

## Pasos
1. ...
2. ...
```

### Habilidad
```markdown
---
name: functional-patterns
description: Aplica patrones de programación funcional
evolved_from:
  - prefer-functional
  - use-immutable
  - avoid-classes
---

# Habilidad Functional Patterns

[Contenido generado según los instintos agrupados]
```

### Agente
```markdown
---
name: debugger
description: Agente sistemático de depuración
model: sonnet
evolved_from:
  - debug-check-logs
  - debug-isolate
  - debug-reproduce
---

# Agente Debugger

[Contenido generado según los instintos agrupados]
```
