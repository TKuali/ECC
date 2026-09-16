---
description: Ejecuta AgentShield contra superficies de agentes, hooks, MCP, permisos y secretos.
agent: ecc:security-reviewer
subtask: true
---

# Comando Security Scan

Ejecuta AgentShield contra el proyecto actual o una ruta objetivo, y luego convierte los hallazgos en un plan de remediación priorizado.

## Uso

`/security-scan [ruta] [--format text|json|markdown|html] [--min-severity low|medium|high|critical] [--fix]`

- `ruta` (opcional): por defecto el proyecto actual. Usa una ruta `.claude/`, la raíz del repositorio o un directorio de plantillas controlado.
- `--format`: formato de salida. Usa `json` para CI, `markdown` para traspasos de tareas, y `html` para reportes de revisión independientes.
- `--min-severity`: filtra hallazgos de menor prioridad.
- `--fix`: aplica únicamente las correcciones de AgentShield marcadas explícitamente como seguras y autocorregibles.

## Motor Determinista

Preferir el escáner empaquetado:

```bash
npx ecc-agentshield scan --path "${TARGET_PATH:-.}" --format text
```

Para desarrollo local de AgentShield, ejecutar desde la copia local de AgentShield:

```bash
npm run scan -- --path "${TARGET_PATH:-.}" --format text
```

No inventar hallazgos. Utilizar la salida de AgentShield como fuente de verdad y separar los hechos del escáner del juicio posterior.

## Lista de Verificación de Revisión

1. Identificar primero los hallazgos en tiempo de ejecución activos:
   - secretos hardcodeados
   - permisos excesivamente amplios
   - hooks ejecutables
   - servidores MCP con shell, sistema de archivos, transporte remoto o `npx` sin versión fijada
   - prompts de agentes que manejan contenido no confiable sin defensas
2. Separar el inventario de menor confianza:
   - ejemplos en documentación
   - ejemplos en plantillas
   - manifiestos de plugins
   - configuraciones locales opcionales del proyecto
3. Para cada hallazgo crítico o alto, reportar:
   - ruta del archivo
   - severidad
   - confianza en tiempo de ejecución
   - por qué importa
   - remediación exacta
   - si es seguro autocorregirlo
4. Si se solicita `--fix`, detallar las modificaciones previstas antes de aplicar las soluciones.
5. Volver a ejecutar el escaneo tras las correcciones y reportar la puntuación antes/después.

## Contrato de Salida

Retornar:

1. Calificación de seguridad y puntuación.
2. Conteos por severidad y confianza en tiempo de ejecución.
3. Hallazgos críticos/altos con rutas exactas.
4. Hallazgos de menor confianza agrupados por separado.
5. Un orden de remediación.
6. Comandos ejecutados y si el escaneo fue local, CI o respaldado por npx.

## Patrón para CI

Usar AgentShield en GitHub Actions para barreras obligatorias:

```yaml
- uses: affaan-m/agentshield@v1
  with:
    path: "."
    min-severity: "medium"
    fail-on-findings: true
```

## Enlaces

- Habilidad: `skills/security-scan/SKILL.md`
- Agente: `agents/security-reviewer.md`
- Escáner: <https://github.com/affaan-m/agentshield>

## Argumentos

$ARGUMENTS:
- ruta objetivo opcional
- banderas opcionales de AgentShield
