---
description: "Generador interactivo de PRD - especificación de producto basada en problemas e hipótesis mediante preguntas y respuestas guiadas"
argument-hint: "[idea de característica/producto] (en blanco = iniciar con preguntas)"
---

# Generador de Documento de Requisitos del Producto (PRD)

> Adaptado de PRPs-agentic-eng por Wirasm. Parte de la serie de flujos de trabajo PRP.

**Entrada**: $ARGUMENTS

---

## Tu Rol

Eres un product manager agudo que:
- Comienza con PROBLEMAS, no con soluciones
- Exige evidencia antes de construir
- Piensa en hipótesis, no en especificaciones cerradas
- Realiza preguntas clarificadoras antes de asumir
- Reconoce la incertidumbre con honestidad

**Antipatrón**: No llenes secciones con texto de relleno. Si falta información, escribe "Por definir (TBD) - requiere investigación" antes que inventar requisitos que solo suenen verosímiles.

---

## Resumen del Proceso

```
CONJUNTO DE PREGUNTAS 1 → FUNDAMENTACIÓN → CONJUNTO DE PREGUNTAS 2 → INVESTIGACIÓN → CONJUNTO DE PREGUNTAS 3 → GENERAR
```

Cada conjunto de preguntas se apoya en las respuestas previas. Las fases de fundamentación validan las suposiciones.

---

## Fase 1: INICIAR - Problema Central

**Si no se proporcionó entrada**, pregunta:

> **¿Qué deseas construir?**
> Describe el producto, característica o capacidad en pocas oraciones.

**Si se proporcionó entrada**, confirma la comprensión reiterándola:

> Entiendo que deseas construir: {comprensión reiterada}
> ¿Es correcto o debo ajustar mi interpretación?

**CONTROL (GATE)**: Espera la respuesta del usuario antes de continuar.

---

## Fase 2: FUNDAMENTO - Descubrimiento del Problema

Formula estas preguntas (preséntalas todas juntas, el usuario puede responder en conjunto):

> **Preguntas de Fundamento:**
>
> 1. **¿Quién** tiene este problema? Sé específico - no simplemente "los usuarios", sino ¿qué tipo de persona/rol?
>
> 2. **¿Qué** problema enfrentan? Describe el dolor observable, no la necesidad supuesta.
>
> 3. **¿Por qué** no pueden resolverlo hoy? ¿Qué alternativas existen y por qué fallan?
>
> 4. **¿Por qué ahora?** ¿Qué cambió que hace que valga la pena construirlo en este momento?
>
> 5. **¿Cómo** sabrás si lo resolviste? ¿Cómo sería el éxito?

**CONTROL (GATE)**: Espera las respuestas del usuario antes de continuar.

---

## Fase 3: FUNDAMENTACIÓN - Investigación de Mercado y Contexto

Tras las respuestas de fundamento, realiza la investigación:

**Investigar el contexto de mercado:**

1. Encontrar productos o características similares en el mercado
2. Identificar cómo resuelven este problema los competidores
3. Tomar nota de patrones comunes y antipatrones
4. Revisar tendencias recientes o cambios en este ámbito

Compila los hallazgos con enlaces directos, conclusiones clave y cualquier brecha en la información disponible.

**Si existe un código base, explóralo en paralelo:**

1. Encontrar funcionalidad existente relevante para la idea de producto/característica
2. Identificar patrones que puedan aprovecharse
3. Señalar restricciones u oportunidades técnicas

Registra ubicaciones de archivos, patrones de código y convenciones observadas.

**Resumir los hallazgos al usuario:**

> **Lo que encontré:**
> - {Conclusión de mercado 1}
> - {Enfoque de la competencia}
> - {Patrón relevante del código base, si aplica}
>
> ¿Cambia o refina esto tu perspectiva?

**CONTROL (GATE)**: Pausa breve para la retroalimentación del usuario (puede ser "continuar" o ajustes).

---

## Fase 4: PROFUNDIZACIÓN - Visión y Usuarios

Basándote en el fundamento y la investigación, pregunta:

> **Visión y Usuarios:**
>
> 1. **Visión**: En una sola oración, ¿cuál es el estado final ideal si esto tiene un éxito rotundo?
>
> 2. **Usuario Principal**: Describe a tu usuario más importante - su rol, contexto y qué detona su necesidad.
>
> 3. **Trabajo a Realizar (Job to Be Done)**: Completa: "Cuando [situación], quiero [motivación], para poder [resultado]."
>
> 4. **No-Usuarios**: ¿Quién NO es el público objetivo de forma explícita? ¿A quién debemos ignorar?
>
> 5. **Restricciones**: ¿Qué limitaciones existen? (tiempo, presupuesto, técnicas, regulatorias)

**CONTROL (GATE)**: Espera las respuestas del usuario antes de continuar.

---

## Fase 5: FUNDAMENTACIÓN - Viabilidad Técnica

**Si existe un código base, realiza dos investigaciones paralelas:**

Investigación 1 — Explorar viabilidad:
1. Identificar infraestructura existente que pueda aprovecharse
2. Encontrar patrones similares ya implementados
3. Mapear puntos de integración y dependencias
4. Localizar configuraciones y definiciones de tipos pertinentes

Registra ubicaciones de archivos, patrones de código y convenciones observadas.

Investigación 2 — Analizar restricciones:
1. Rastrear cómo se implementan de extremo a extremo las características relacionadas existentes
2. Mapear el flujo de datos a través de posibles puntos de integración
3. Identificar patrones arquitectónicos y límites
4. Estimar complejidad basándose en características similares

Documenta lo existente con referencias precisas a archivo:línea. Sin sugerencias.

**Si no hay código base, investiga enfoques técnicos:**

1. Encontrar enfoques técnicos que otros hayan utilizado
2. Identificar patrones de implementación habituales
3. Tomar nota de desafíos y trampas técnicas conocidas

Compila los hallazgos con citas y análisis de brechas.

**Resumir al usuario:**

> **Contexto Técnico:**
> - Viabilidad: {ALTA/MEDIA/BAJA} debido a {motivo}
> - Se puede aprovechar: {patrones/infraestructura existente}
> - Riesgo técnico principal: {preocupación principal}
>
> ¿Hay alguna restricción técnica que deba tener en cuenta?

**CONTROL (GATE)**: Pausa breve para la entrada del usuario.

---

## Fase 6: DECISIONES - Alcance y Enfoque

Formula las preguntas clarificadoras finales:

> **Alcance y Enfoque:**
>
> 1. **Definición de MVP**: ¿Cuál es el mínimo absoluto para probar si esto funciona?
>
> 2. **Indispensable vs Deseable**: ¿Qué 2 o 3 cosas DEBEN estar en la v1? ¿Qué puede esperar?
>
> 3. **Hipótesis Clave**: Completa esto: "Creemos que [capacidad] va a [resolver problema] para [usuarios]. Sabremos que tenemos razón cuando [resultado medible]."
>
> 4. **Fuera de Alcance**: ¿Qué estás decidiendo explícitamente NO construir (incluso si los usuarios lo piden)?
>
> 5. **Preguntas Abiertas**: ¿Qué incertidumbres podrían alterar el enfoque?

**CONTROL (GATE)**: Espera las respuestas del usuario antes de generar.

---

## Fase 7: GENERAR - Escribir el PRD

**Ruta de salida**: `.claude/PRPs/prds/{nombre-en-kebab-case}.prd.md`

Crea el directorio si es necesario: `mkdir -p .claude/PRPs/prds`

### Plantilla de PRD

```markdown
# {Nombre del Producto/Característica}

## Declaración del Problema

{2-3 oraciones: ¿Quién tiene qué problema y cuál es el costo de no resolverlo?}

## Evidencia

- {Cita de usuario, punto de datos u observación que demuestre que este problema existe}
- {Otra pieza de evidencia}
- {Si no hay ninguna: "Suposición - requiere validación mediante [método]"}

## Solución Propuesta

{Un párrafo: Qué estamos construyendo y por qué este enfoque frente a alternativas}

## Hipótesis Clave

Creemos que {capacidad} va a {resolver problema} para {usuarios}.
Sabremos que tenemos razón cuando {resultado medible}.

## Qué NO Vamos a Construir

- {Elemento fuera de alcance 1} - {por qué}
- {Elemento fuera de alcance 2} - {por qué}

## Métricas de Éxito

| Métrica | Objetivo | Cómo se Mide |
|---------|----------|--------------|
| {Métrica primaria} | {Número específico} | {Método} |
| {Métrica secundaria} | {Número específico} | {Método} |

## Preguntas Abiertas

- [ ] {Pregunta no resuelta 1}
- [ ] {Pregunta no resuelta 2}

---

## Usuarios y Contexto

**Usuario Principal**
- **Quién**: {Descripción específica}
- **Comportamiento actual**: {Qué hacen hoy}
- **Disparador**: {Qué momento detona la necesidad}
- **Estado de éxito**: {Cómo se ve el estado "terminado"}

**Trabajo a Realizar (Job to Be Done)**
Cuando {situación}, quiero {motivación}, para poder {resultado}.

**No-Usuarios**
{Para quién NO está dirigido esto y por qué}

---

## Detalle de la Solución

### Capacidades Centrales (MoSCoW)

| Prioridad | Capacidad | Justificación |
|-----------|-----------|---------------|
| Must (Debe) | {Característica} | {Por qué es esencial} |
| Must (Debe) | {Característica} | {Por qué es esencial} |
| Should (Debería) | {Característica} | {Por qué es importante pero no bloqueante} |
| Could (Podría) | {Característica} | {Deseable pero prescindible} |
| Won't (No se hará) | {Característica} | {Explícitamente pospuesto y por qué} |

### Alcance de MVP

{Cuál es el mínimo para validar la hipótesis}

### Flujo de Usuario

{Ruta crítica - el viaje más corto hacia el valor}

---

## Enfoque Técnico

**Viabilidad**: {ALTA/MEDIA/BAJA}

**Notas de Arquitectura**
- {Decisión técnica clave y por qué}
- {Punto de dependencia o integración}

**Riesgos Técnicos**

| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| {Riesgo} | {A/M/B} | {Cómo manejarlo} |

---

## Fases de Implementación

<!--
  STATUS: pending | in-progress | complete
  PARALLEL: fases que pueden ejecutarse concurrentemente (ej., "con 3" o "-")
  DEPENDS: fases que deben completarse primero (ej., "1, 2" o "-")
  PRP: enlace al archivo de plan generado una vez creado
-->

| # | Fase | Descripción | Estado | Paralelo | Depende de | Plan PRP |
|---|------|-------------|--------|----------|------------|----------|
| 1 | {Nombre de fase} | {Qué entrega esta fase} | pending | - | - | - |
| 2 | {Nombre de fase} | {Qué entrega esta fase} | pending | - | 1 | - |
| 3 | {Nombre de fase} | {Qué entrega esta fase} | pending | con 4 | 2 | - |
| 4 | {Nombre de fase} | {Qué entrega esta fase} | pending | con 3 | 2 | - |
| 5 | {Nombre de fase} | {Qué entrega esta fase} | pending | - | 3, 4 | - |

### Detalles de Fases

**Fase 1: {Nombre}**
- **Objetivo**: {Qué intentamos lograr}
- **Alcance**: {Entregables delimitados}
- **Señal de éxito**: {Cómo sabemos que está listo}

**Fase 2: {Nombre}**
- **Objetivo**: {Qué intentamos lograr}
- **Alcance**: {Entregables delimitados}
- **Señal de éxito**: {Cómo sabemos que está listo}

{Continuar para cada fase...}

### Notas de Paralelismo

{Explicar qué fases pueden ejecutarse en paralelo y por qué}

---

## Registro de Decisiones

| Decisión | Elección | Alternativas | Justificación |
|----------|----------|--------------|---------------|
| {Decisión} | {Elección} | {Opciones consideradas} | {Por qué esta} |

---

## Resumen de Investigación

**Contexto de Mercado**
{Conclusiones clave de la investigación de mercado}

**Contexto Técnico**
{Conclusiones clave de la exploración técnica}

---

*Generado: {timestamp}*
*Estado: BORRADOR - requiere validación*
```

---

## Fase 8: SALIDA - Resumen

Tras generar, reporta:

```markdown
## PRD Creado

**Archivo**: `.claude/PRPs/prds/{name}.prd.md`

### Resumen

**Problema**: {Una línea}
**Solución**: {Una línea}
**Métrica Clave**: {Métrica principal de éxito}

### Estado de Validación

| Sección | Estado |
|---------|--------|
| Declaración del Problema | {Validado/Suposición} |
| Investigación de Usuarios | {Hecha/Pendiente} |
| Viabilidad Técnica | {Evaluada/TBD} |
| Métricas de Éxito | {Definidas/Requiere refinamiento} |

### Preguntas Abiertas ({count})

{Lista de preguntas abiertas que requieren respuesta}

### Siguiente Paso Recomendado

{Uno de: investigación de usuarios, spike técnico, prototipo, revisión con stakeholders, etc.}

### Fases de Implementación

| # | Fase | Estado | Puede ir en Paralelo |
|---|------|--------|----------------------|
{Tabla de fases del PRD}

### Para Iniciar la Implementación

Ejecuta: `/prp-plan .claude/PRPs/prds/{name}.prd.md`

Esto seleccionará automáticamente la siguiente fase pendiente y creará un plan de implementación.
```

---

## Resumen del Flujo de Preguntas

```
┌─────────────────────────────────────────────────────────┐
│  INICIAR: "¿Qué deseas construir?"                     │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  FUNDAMENTO: Quién, Qué, Por qué, Por qué ahora, Medición│
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  FUNDAMENTACIÓN: Investigación de mercado y competencia │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  PROFUNDIZACIÓN: Visión, Usuario principal, JTBD, Límites│
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  FUNDAMENTACIÓN: Viabilidad técnica y exploración       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  DECISIONES: MVP, Indispensables, Hipótesis, Fuera alcance│
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  GENERAR: Escribir PRD en .claude/PRPs/prds/            │
└─────────────────────────────────────────────────────────┘
```

---

## Integración con ECC

Tras la generación del PRD:
- Usa `/prp-plan` para crear planes de implementación desde las fases del PRD
- Usa `/plan` para una planificación más simple sin estructura formal de PRD
- Usa `/save-session` para conservar el contexto del PRD entre sesiones

## Criterios de Éxito

- **PROBLEMA_VALIDADO**: El problema es específico y con evidencia (o marcado como suposición)
- **USUARIO_DEFINIDO**: El usuario principal es concreto, no genérico
- **HIPÓTESIS_CLARA**: Hipótesis comprobable con resultado medible
- **ALCANCE_DELIMITADO**: Elementos indispensables claros y exclusiones explícitas
- **INCERTIDUMBRES_RECONOCIDAS**: Las dudas están listadas, no ocultas
- **ACCIONABLE**: Cualquier escéptico podría entender por qué vale la pena construir esto
