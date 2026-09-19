---
description: Ejecuta un plan de implementación multimodelo manteniendo a Claude como el único con permisos de escritura en el sistema de archivos.
---

# Execute - Ejecución Colaborativa Multimodelo

Ejecución colaborativa multimodelo - Obtener prototipo a partir del plan → Claude refactoriza e implementa → Auditoría multimodelo y entrega.

> **Prerrequisito:** Requiere el entorno de ejecución externo `ccg-workflow`, el cual **no** forma parte de la instalación base de ECC. Inicialízalo con `npx ccg-workflow` para aprovisionar `~/.claude/bin/codeagent-wrapper` y los archivos de rol `~/.claude/.ccg/prompts/*` de los que depende este comando. Sin ese entorno, este comando no funcionará correctamente.

$ARGUMENTS

---

## Protocolos Fundamentales

- **Protocolo de Lenguaje**: Usar **inglés** al interactuar con herramientas/modelos externos, comunicarse con el usuario en su propio idioma
- **Soberanía del Código**: Los modelos externos tienen **cero acceso de escritura en el sistema de archivos**, todas las modificaciones las realiza Claude
- **Refactorización de Prototipo en Bruto**: Tratar el Unified Diff de Codex/Antigravity como un "prototipo borrador", obligando a refactorizarlo a código de grado de producción
- **Mecanismo de Contención de Pérdidas (Stop-Loss)**: No avanzar a la siguiente fase hasta que la salida de la fase actual esté validada
- **Prerrequisito**: Solo ejecutar después de que el usuario haya respondido explícitamente "S" (o "Y") a la salida de `/ccg:plan` (si falta, debe confirmarse primero)

---

## Especificación de Llamadas Multimodelo

**Sintaxis de Llamada** (en paralelo: usar `run_in_background: true`):

```
# Llamada para reanudar sesión (recomendado) - Prototipo de Implementación
Bash({
  command: "~/.claude/bin/codeagent-wrapper {{LITE_MODE_FLAG}}--backend <codex|antigravity> resume <SESSION_ID> - \"$PWD\" <<'EOF'
ROLE_FILE: <role prompt path>
<TASK>
Requirement: <task description>
Context: <plan content + target files>
</TASK>
OUTPUT: Unified Diff Patch ONLY. Strictly prohibit any actual modifications.
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "Breve descripción"
})

# Llamada de nueva sesión - Prototipo de Implementación
Bash({
  command: "~/.claude/bin/codeagent-wrapper {{LITE_MODE_FLAG}}--backend <codex|antigravity> - \"$PWD\" <<'EOF'
ROLE_FILE: <role prompt path>
<TASK>
Requirement: <task description>
Context: <plan content + target files>
</TASK>
OUTPUT: Unified Diff Patch ONLY. Strictly prohibit any actual modifications.
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "Breve descripción"
})
```

**Sintaxis de Llamada para Auditoría** (Revisión de Código / Auditoría):

```
Bash({
  command: "~/.claude/bin/codeagent-wrapper {{LITE_MODE_FLAG}}--backend <codex|antigravity> resume <SESSION_ID> - \"$PWD\" <<'EOF'
ROLE_FILE: <role prompt path>
<TASK>
Scope: Audit the final code changes.
Inputs:
- The applied patch (git diff / final unified diff)
- The touched files (relevant excerpts if needed)
Constraints:
- Do NOT modify any files.
- Do NOT output tool commands that assume filesystem access.
</TASK>
OUTPUT:
1) A prioritized list of issues (severity, file, rationale)
2) Concrete fixes; if code changes are needed, include a Unified Diff Patch in a fenced code block.
EOF",
  run_in_background: true,
  timeout: 3600000,
  description: "Breve descripción"
})
```

**Notas sobre Parámetros del Modelo**:
- No se requiere ningún indicador extra de modelo para `--backend antigravity` o `--backend codex`; `codeagent-wrapper` selecciona el modelo por defecto de cada backend.

**Prompts de Roles**:

| Fase | Codex | Antigravity |
|------|-------|-------------|
| Implementación | `~/.claude/.ccg/prompts/codex/architect.md` | `~/.claude/.ccg/prompts/antigravity/frontend.md` |
| Revisión | `~/.claude/.ccg/prompts/codex/reviewer.md` | `~/.claude/.ccg/prompts/antigravity/reviewer.md` |

**Reutilización de Sesión**: Si `/ccg:plan` suministró SESSION_ID, usa `resume <SESSION_ID>` para reutilizar el contexto.

**Espera de Tareas en Segundo Plano** (tiempo de espera máximo 600000ms = 10 minutos):

```
TaskOutput({ task_id: "<task_id>", block: true, timeout: 600000 })
```

**IMPORTANTE**:
- Debe especificarse `timeout: 600000`, de lo contrario los 30 segundos por defecto generarán un tiempo de espera prematuro.
- Si tras 10 minutos continúa sin completarse, sigue consultando con `TaskOutput`, **NUNCA abortes el proceso**.
- Si la espera se omite por timeout, **DEBE llamarse a `AskUserQuestion` para consultar al usuario si seguir esperando o cancelar la tarea**.

---

## Flujo de Trabajo de Ejecución

**Tarea de Ejecución**: $ARGUMENTS

### Fase 0: Lectura del Plan

`[Modo: Preparación]`

1. **Identificar Tipo de Entrada**:
   - Ruta del archivo de plan (ej., `.claude/plan/xxx.md`)
   - Descripción directa de la tarea

2. **Leer Contenido del Plan**:
   - Si se dio la ruta del archivo de plan, leerlo y analizarlo
   - Extraer: tipo de tarea, pasos de implementación, archivos clave, SESSION_ID

3. **Confirmación Previa a la Ejecución**:
   - Si la entrada es una "descripción directa de tarea" o el plan carece de `SESSION_ID` / archivos clave: confirmar primero con el usuario
   - Si no se puede constatar que el usuario haya respondido "S/Y" al plan: debe confirmarse nuevamente antes de continuar

4. **Enrutamiento por Tipo de Tarea**:

   | Tipo de Tarea | Detección | Ruta |
   |---------------|-----------|------|
   | **Frontend** | Páginas, componentes, UI, estilos, maquetación | Antigravity |
   | **Backend** | API, interfaces, base de datos, lógica, algoritmos | Codex |
   | **Fullstack** | Contiene tanto frontend como backend | Codex ∥ Antigravity en paralelo |

---

### Fase 1: Recuperación Rápida de Contexto

`[Modo: Recuperación]`

**Si el MCP ace-tool está disponible**, utilízalo para una recuperación rápida de contexto:

Basándote en la lista de "Archivos Clave" del plan, invoca `mcp__ace-tool__search_context`:

```
mcp__ace-tool__search_context({
  query: "<consulta semántica basada en el contenido del plan, incluidos archivos clave, módulos y nombres de funciones>",
  project_root_path: "$PWD"
})
```

**Estrategia de Recuperación**:
- Extraer rutas destino de la tabla de "Archivos Clave" del plan
- Construir consulta semántica que abarque: archivos de entrada, módulos de dependencia y definiciones de tipos relacionadas
- Si los resultados son insuficientes, realizar 1-2 recuperaciones recursivas adicionales

**Si el MCP ace-tool NO está disponible**, utiliza las herramientas nativas de Claude Code:
1. **Glob**: Localiza los archivos destino desde la tabla de "Archivos Clave" del plan (ej., `Glob("src/components/**/*.tsx")`)
2. **Grep**: Busca símbolos clave, nombres de función y tipos en todo el código
3. **Read**: Lee los archivos encontrados para reunir el contexto completo
4. **Task (agente Explore)**: Para una exploración más amplia, usa `Task` con `subagent_type: "Explore"`

**Tras la Recuperación**:
- Organizar los fragmentos de código recopilados
- Confirmar que se dispone del contexto íntegro para la implementación
- Avanzar a la Fase 3

---

### Fase 3: Adquisición de Prototipo

`[Modo: Prototipo]`

**Enrutamiento según Tipo de Tarea**:

#### Ruta A: Frontend/UI/Estilos → Antigravity

**Límite**: Contexto < 32k tokens

1. Llamar a Antigravity (usar `~/.claude/.ccg/prompts/antigravity/frontend.md`)
2. Entrada: Contenido del plan + contexto recuperado + archivos destino
3. SALIDA: `Unified Diff Patch ONLY. Strictly prohibit any actual modifications.`
4. **Antigravity es la autoridad en diseño frontend; su prototipo CSS/React/Vue constituye la línea base visual final**
5. **ADVERTENCIA**: Ignorar sugerencias de lógica de backend emitidas por Antigravity
6. Si el plan incluye `ANTIGRAVITY_SESSION`: preferir `resume <ANTIGRAVITY_SESSION>`

#### Ruta B: Backend/Lógica/Algoritmos → Codex

1. Llamar a Codex (usar `~/.claude/.ccg/prompts/codex/architect.md`)
2. Entrada: Contenido del plan + contexto recuperado + archivos destino
3. SALIDA: `Unified Diff Patch ONLY. Strictly prohibit any actual modifications.`
4. **Codex es la autoridad en lógica de backend; aprovecha su razonamiento lógico y capacidad de depuración**
5. Si el plan incluye `CODEX_SESSION`: preferir `resume <CODEX_SESSION>`

#### Ruta C: Fullstack → Llamadas en Paralelo

1. **Llamadas en Paralelo** (`run_in_background: true`):
   - Antigravity: Procesa la parte de frontend
   - Codex: Procesa la parte de backend
2. Esperar los resultados completos de ambos modelos con `TaskOutput`
3. Cada uno utiliza el `SESSION_ID` correspondiente del plan para ejecutar `resume` (crear nueva sesión si falta)

**Sigue las instrucciones marcadas como `IMPORTANTE` en la `Especificación de Llamadas Multimodelo` anterior**

---

### Fase 4: Implementación del Código

`[Modo: Implementación]`

**Claude, como Soberano del Código, ejecuta los siguientes pasos**:

1. **Leer el Diff**: Analizar el parche Unified Diff devuelto por Codex/Antigravity

2. **Entorno de Pruebas Mental**:
   - Simular la aplicación del Diff sobre los archivos destino
   - Comprobar la consistencia lógica
   - Identificar posibles conflictos o efectos secundarios

3. **Refactorizar y Limpiar**:
   - Refactorizar el "prototipo en bruto" hacia **código empresarial altamente legible y mantenible**
   - Eliminar código redundante
   - Garantizar el cumplimiento de los estándares existentes del proyecto
   - **No generar comentarios/documentación a menos que sea indispensable**, el código debe ser autoexplicativo

4. **Alcance Mínimo**:
   - Cambios estrictamente acotados al alcance del requisito
   - **Revisión obligatoria** ante posibles efectos secundarios
   - Realizar correcciones puntuales y dirigidas

5. **Aplicar los Cambios**:
   - Utilizar herramientas de edición/escritura para ejecutar las modificaciones reales
   - **Modificar solo el código necesario**, sin afectar nunca el resto de funcionalidades existentes del usuario

6. **Autoverificación** (fuertemente recomendada):
   - Ejecutar el lint, verificación de tipos y tests existentes del proyecto (priorizando el alcance mínimo afectado)
   - En caso de fallos: corregir regresiones antes de pasar a la Fase 5

---

### Fase 5: Auditoría y Entrega

`[Modo: Auditoría]`

#### 5.1 Auditoría Automática

**Una vez aplicados los cambios, DEBE llamarse inmediatamente en paralelo** a Codex y Antigravity para la revisión de código (Code Review):

1. **Revisión de Codex** (`run_in_background: true`):
   - ROLE_FILE: `~/.claude/.ccg/prompts/codex/reviewer.md`
   - Entrada: Diff de los cambios aplicados + archivos destino
   - Enfoque: Seguridad, rendimiento, manejo de errores, corrección lógica

2. **Revisión de Antigravity** (`run_in_background: true`):
   - ROLE_FILE: `~/.claude/.ccg/prompts/antigravity/reviewer.md`
   - Entrada: Diff de los cambios aplicados + archivos destino
   - Enfoque: Accesibilidad, consistencia de diseño, experiencia de usuario

Espera los resultados completos de revisión con `TaskOutput`. Prefiere reutilizar las sesiones de la Fase 3 (`resume <SESSION_ID>`) para mantener la coherencia del contexto.

#### 5.2 Integrar y Corregir

1. Sintetizar las observaciones de revisión de Codex + Antigravity
2. Ponderar según las reglas de confianza: Backend sigue a Codex, Frontend sigue a Antigravity
3. Ejecutar las correcciones necesarias
4. Repetir la Fase 5.1 según sea necesario (hasta que el riesgo sea plenamente aceptable)

#### 5.3 Confirmación de Entrega

Tras superar la auditoría, reportar al usuario:

```markdown
## Ejecución Completada

### Resumen de Cambios
| Archivo | Operación | Descripción |
|---------|-----------|-------------|
| ruta/al/archivo.ts | Modificado | Descripción |

### Resultados de la Auditoría
- Codex: <Aprobado/Encontró N problemas>
- Antigravity: <Aprobado/Encontró N problemas>

### Recomendaciones
1. [ ] <Pasos de prueba sugeridos>
2. [ ] <Pasos de verificación sugeridos>
```

---

## Reglas Clave

1. **Soberanía del Código** – Todas las modificaciones de archivos las realiza Claude; los modelos externos carecen de acceso de escritura
2. **Refactorización de Prototipos en Bruto** – La salida de Codex/Antigravity se trata como borrador y debe refactorizarse
3. **Reglas de Confianza** – Backend sigue a Codex, Frontend sigue a Antigravity
4. **Cambios Mínimos** – Modificar únicamente el código necesario, sin efectos secundarios
5. **Auditoría Obligatoria** – Siempre debe ejecutarse una revisión de código multimodelo tras los cambios

---

## Uso

```bash
# Ejecutar archivo de plan
/ccg:execute .claude/plan/feature-name.md

# Ejecutar tarea directamente (para planes ya debatidos en el contexto)
/ccg:execute implementar autenticación de usuarios basada en el plan previo
```

---

## Relación con /ccg:plan

1. `/ccg:plan` genera el plan + SESSION_ID
2. El usuario confirma con "S" / "Y"
3. `/ccg:execute` lee el plan, reutiliza SESSION_ID y lleva a cabo la implementación
