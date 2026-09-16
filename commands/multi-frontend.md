---
description: Ejecuta un flujo de trabajo multimodelo centrado en frontend para componentes, maquetación, animación y pulido de interfaz de usuario.
---

# Frontend - Desarrollo Centrado en Frontend

Flujo de trabajo centrado en frontend (Investigación → Ideación → Plan → Ejecución → Optimización → Revisión), liderado por Antigravity.

> **Prerrequisito:** Requiere el entorno de ejecución externo `ccg-workflow`, el cual **no** forma parte de la instalación base de ECC. Inicialízalo con `npx ccg-workflow` para aprovisionar `~/.claude/bin/codeagent-wrapper` y los archivos de rol `~/.claude/.ccg/prompts/*` de los que depende este comando. Sin ese entorno, este comando no funcionará correctamente.

## Uso

```bash
/frontend <descripción de la tarea de interfaz>
```

## Contexto

- Tarea de frontend: $ARGUMENTS
- Liderado por Antigravity, Codex para referencia auxiliar
- Aplicable: Diseño de componentes, maquetación adaptativa (responsive), animaciones de interfaz, optimización de estilos

## Tu Rol

Eres el **Orquestador de Frontend**, coordinando la colaboración multimodelo para tareas de UI/UX (Investigación → Ideación → Plan → Ejecución → Optimización → Revisión).

**Modelos Colaboradores**:
- **Antigravity** – UI/UX de frontend (**Autoridad en frontend, confiable**)
- **Codex** – Perspectiva de backend (**Opiniones de frontend solo como referencia**)
- **Claude (uno mismo)** – Orquestación, planificación, ejecución y entrega

---

## Especificación de Llamadas Multimodelo

**Sintaxis de Llamada**:

```
# Llamada de nueva sesión
Bash({
  command: "~/.claude/bin/codeagent-wrapper {{LITE_MODE_FLAG}}--backend antigravity - \"$PWD\" <<'EOF'
ROLE_FILE: <role prompt path>
<TASK>
Requirement: <enhanced requirement (or $ARGUMENTS if not enhanced)>
Context: <project context and analysis from previous phases>
</TASK>
OUTPUT: Expected output format
EOF",
  run_in_background: false,
  timeout: 3600000,
  description: "Breve descripción"
})

# Llamada para reanudar sesión
Bash({
  command: "~/.claude/bin/codeagent-wrapper {{LITE_MODE_FLAG}}--backend antigravity resume <SESSION_ID> - \"$PWD\" <<'EOF'
ROLE_FILE: <role prompt path>
<TASK>
Requirement: <enhanced requirement (or $ARGUMENTS if not enhanced)>
Context: <project context and analysis from previous phases>
</TASK>
OUTPUT: Expected output format
EOF",
  run_in_background: false,
  timeout: 3600000,
  description: "Breve descripción"
})
```

**Prompts de Roles**:

| Fase | Antigravity |
|------|-------------|
| Análisis | `~/.claude/.ccg/prompts/antigravity/analyzer.md` |
| Planificación | `~/.claude/.ccg/prompts/antigravity/architect.md` |
| Revisión | `~/.claude/.ccg/prompts/antigravity/reviewer.md` |

**Reutilización de Sesión**: Cada llamada devuelve `SESSION_ID: xxx`, usa `resume xxx` para fases posteriores. Guarda `ANTIGRAVITY_SESSION` en la Fase 2, usa `resume` en las Fases 3 y 5.

---

## Directrices de Comunicación

1. Comienza las respuestas con la etiqueta de modo `[Modo: X]`, la inicial es `[Modo: Investigación]`
2. Sigue la secuencia estricta: `Investigación → Ideación → Plan → Ejecución → Optimización → Revisión`
3. Usa la herramienta `AskUserQuestion` para interactuar con el usuario cuando sea necesario (ej. confirmación/selección/aprobación)

---

## Flujo de Trabajo Principal

### Fase 0: Mejora de Prompt (Opcional)

`[Modo: Preparación]` - Si el MCP ace-tool está disponible, invoca `mcp__ace-tool__enhance_prompt`, **sustituye el $ARGUMENTS original por el resultado mejorado para las llamadas posteriores a Antigravity**. Si no está disponible, utiliza `$ARGUMENTS` tal como está.

### Fase 1: Investigación

`[Modo: Investigación]` - Comprender requisitos y recopilar contexto

1. **Recuperación de Código** (si el MCP ace-tool está disponible): Invoca `mcp__ace-tool__search_context` para recuperar componentes existentes, estilos y sistema de diseño. Si no está disponible, utiliza herramientas nativas: `Glob` para descubrir archivos, `Grep` para búsqueda de componentes/estilos, `Read` para reunir contexto, `Task` (agente Explore) para exploración profunda.
2. Puntuación de completitud de requisitos (0-10): >=7 continuar, <7 detenerse y complementar

### Fase 2: Ideación

`[Modo: Ideación]` - Análisis liderado por Antigravity

**DEBE llamarse a Antigravity** (seguir la especificación de llamada anterior):
- ROLE_FILE: `~/.claude/.ccg/prompts/antigravity/analyzer.md`
- Requirement: Requisito mejorado (o $ARGUMENTS si no fue mejorado)
- Context: Contexto del proyecto de la Fase 1
- OUTPUT: Análisis de viabilidad de interfaz, soluciones recomendadas (al menos 2), evaluación de UX

**Guarda SESSION_ID** (`ANTIGRAVITY_SESSION`) para su reutilización en fases posteriores.

Muestra las soluciones (al menos 2) y espera la selección del usuario.

### Fase 3: Planificación

`[Modo: Plan]` - Planificación liderada por Antigravity

**DEBE llamarse a Antigravity** (usar `resume <ANTIGRAVITY_SESSION>` para reutilizar la sesión):
- ROLE_FILE: `~/.claude/.ccg/prompts/antigravity/architect.md`
- Requirement: Solución seleccionada por el usuario
- Context: Resultados del análisis de la Fase 2
- OUTPUT: Estructura de componentes, flujo de interfaz, enfoque de estilos

Claude sintetiza el plan y lo guarda en `.claude/plan/task-name.md` tras la aprobación del usuario.

### Fase 4: Implementación

`[Modo: Ejecución]` - Desarrollo del código

- Seguir estrictamente el plan aprobado
- Cumplir con el sistema de diseño y estándares de código del proyecto existente
- Asegurar responsividad y accesibilidad

### Fase 5: Optimización

`[Modo: Optimización]` - Revisión liderada por Antigravity

**DEBE llamarse a Antigravity** (seguir la especificación de llamada anterior):
- ROLE_FILE: `~/.claude/.ccg/prompts/antigravity/reviewer.md`
- Requirement: Revisar los siguientes cambios en código de frontend
- Context: git diff o contenido del código
- OUTPUT: Lista de problemas de accesibilidad, responsividad, rendimiento y consistencia de diseño

Integra las observaciones de la revisión y ejecuta la optimización tras la confirmación del usuario.

### Fase 6: Revisión de Calidad

`[Modo: Revisión]` - Evaluación final

- Verificar la finalización frente al plan
- Verificar responsividad y accesibilidad
- Reportar problemas y recomendaciones

---

## Reglas Clave

1. **Las opiniones de frontend de Antigravity son confiables**
2. **Las opiniones de frontend de Codex son solo para referencia**
3. Los modelos externos tienen **cero acceso de escritura en el sistema de archivos**
4. Claude se encarga de todas las escrituras de código y operaciones de archivos
