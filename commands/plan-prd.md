---
description: "Genera un PRD ágil y centrado en el problema, y lo delega a /plan para la planificación de la implementación."
argument-hint: "[idea de producto/característica] (en blanco = comenzar con preguntas)"
---

# Comando PRD

Produce un **Documento de Requisitos del Producto (PRD)** —el artefacto de la fase de requerimientos en el SDLC—. Captura *qué* debe ser realidad para tener éxito y *por qué*, deteniéndose antes del *cómo*. La descomposición de la implementación se delega en `/plan`.

**Entrada**: `$ARGUMENTS`

## Alcance de este comando

| Este comando sí hace | Este comando NO hace |
|---|---|
| Enmarcar el problema y los usuarios | Diseñar la arquitectura |
| Capturar criterios de éxito y alcance | Elegir archivos o escribir patrones |
| Listar preguntas abiertas y riesgos | Enumerar tareas de implementación |
| Escribir `.claude/prds/{name}.prd.md` | Producir un plan de implementación — eso corresponde a `/plan` |

Si te encuentras escribiendo detalles de implementación, detente y elimínalos. Pertenecen a `/plan`.

**Regla anti-relleno**: Cuando falte información, escribe `Por definir (TBD) — necesita validación mediante {método}`. Nunca inventes requisitos que solo suenen verosímiles.

## Flujo de Trabajo

Cuatro fases. Cada fase es un control único: haz las preguntas, espera al usuario y luego avanza. Sin bucles anidados ni protocolos de investigación paralelos excesivos.

### Fase 1 — ENMARCAR (FRAME)

Si `$ARGUMENTS` está vacío, pregunta:

> ¿Qué deseas construir? En una o dos oraciones.

Si se proporciona, replantéalo en una sola oración y pregunta:

> Entendido: *{replanteamiento}*. ¿Es correcto o debo ajustarlo?

Luego realiza las preguntas de encuadre en un solo conjunto:

> 1. **¿Quién** tiene este problema? (rol o segmento específico)
> 2. **¿Cuál** es el dolor observable? (describe comportamiento, no necesidades asumidas)
> 3. **¿Por qué** no pueden resolverlo con lo que existe actualmente?
> 4. **¿Por qué ahora?** — ¿qué cambió que hace que valga la pena abordarlo en este momento?

Espera la respuesta del usuario. No continúes sin respuestas (o un "omitir" explícito).

### Fase 2 — FUNDAMENTAR (GROUND)

Solicita evidencias. Es la fase más corta y la de mayor impacto:

> ¿Qué evidencia tienes de que este problema es real y vale la pena resolverlo? (citas de usuarios, tickets de soporte, métricas, comportamientos observados, soluciones provisionales fallidas — cualquier dato concreto)

Si el usuario no tiene ninguna, registra la sección de Evidencia del PRD como `Suposición — necesita validación mediante {investigación de usuarios | analíticas | prototipo}`. Esto mantiene la honestidad del PRD.

### Fase 3 — DECIDIR (DECIDE)

Alcance e hipótesis en un solo conjunto:

> 1. **Hipótesis** — Completa: *Creemos que **{capacidad}** va a **{resolver el problema}** para **{usuarios}**. Sabremos que tenemos razón cuando **{resultado medible}**.*
> 2. **MVP** — ¿Cuál es lo mínimo indispensable para probar la hipótesis?
> 3. **Fuera de alcance** — ¿Qué decides explícitamente **no** construir (incluso si los usuarios lo piden)?
> 4. **Preguntas abiertas** — ¿Qué incertidumbres podrían alterar el enfoque?

Espera las respuestas.

### Fase 4 — GENERAR Y DELEGAR (GENERATE & HAND OFF)

Crea el directorio si es necesario, escribe el PRD y presenta el reporte.

```bash
mkdir -p .claude/prds
```

**Ruta de salida**: `.claude/prds/{nombre-en-kebab-case}.prd.md`

#### Plantilla de PRD

```markdown
# {Nombre del Producto / Característica}

## Problema
{2–3 oraciones: quién tiene qué problema y cuál es el costo de dejarlo sin resolver}

## Evidencia
- {Cita de usuario, punto de datos u observación}
- {O BIEN: "Suposición — necesita validación mediante {método}"}

## Usuarios
- **Primario**: {rol, contexto, qué detona la necesidad}
- **No dirigido a**: {a quién excluye explícitamente esto}

## Hipótesis
Creemos que **{capacidad}** va a **{resolver el problema}** para **{usuarios}**.
Sabremos que tenemos razón cuando **{resultado medible}**.

## Métricas de Éxito
| Métrica | Objetivo | Cómo se mide |
|---|---|---|
| {primaria} | {número} | {método} |

## Alcance
**MVP** — {lo mínimo para probar la hipótesis}

**Fuera de alcance**
- {elemento} — {por qué se pospone}

## Hitos de Entrega
<!-- Resultados de negocio, no tareas de ingeniería. /plan convierte cada uno en un plan. -->
<!-- Estado: pending | in-progress | complete -->

| # | Hito | Resultado | Estado | Plan |
|---|---|---|---|---|
| 1 | {nombre} | {cambio visible para el usuario} | pending | — |
| 2 | {nombre} | {cambio visible para el usuario} | pending | — |

## Preguntas Abiertas
- [ ] {pregunta que podría cambiar el alcance o enfoque}

## Riesgos
| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|

---
*Estado: BORRADOR — solo requisitos. Planificación de implementación pendiente vía /plan.*
```

#### Reporte al usuario

```
PRD creado: .claude/prds/{name}.prd.md

Problema:   {una línea}
Hipótesis:  {una línea}
MVP:        {una línea}

Estado de validación:
  Problema  {validado | suposición}
  Usuarios  {concreto | genérico — refinar}
  Métricas  {definidas | TBD}

Preguntas abiertas: {cantidad}

Siguiente paso: /plan .claude/prds/{name}.prd.md
  → /plan tomará el siguiente hito pendiente y producirá un plan de implementación.
```

## Integración

- `/plan <ruta-al-prd>` — consume el PRD y genera un plan de implementación para el siguiente hito pendiente.
- Skill `tdd-workflow` — implementa el plan priorizando las pruebas.
- `/pr` — abre un PR que hace referencia al PRD y al plan.

## Criterios de Éxito

- **PROBLEMA_CLARO**: el problema es específico y con evidencia (o marcado como suposición).
- **USUARIO_CONCRETO**: el usuario primario es un rol específico, no "los usuarios".
- **HIPÓTESIS_COMPROBABLE**: incluye un resultado medible.
- **ALCANCE_DELIMITADO**: MVP explícito y exclusiones fuera de alcance explícitas.
- **SIN_DETALLES_DE_IMPLEMENTACIÓN**: no contiene rutas de archivos, librerías o listas de tareas — si aparecen, muévelas al paso `/plan`.

Información de fondo sobre el flujo de markdown por etapas: [docs/PLAN-PRD-PATTERN.md](../docs/PLAN-PRD-PATTERN.md).
