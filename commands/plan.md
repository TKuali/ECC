---
description: Reitera los requisitos, evalúa riesgos y crea un plan de implementación paso a paso. ESPERA la CONFIRMACIÓN del usuario antes de tocar cualquier código.
argument-hint: "[descripción de la característica | ruta/hacia/*.prd.md]"
---

# Comando Plan

Este comando crea un plan de implementación exhaustivo antes de escribir una sola línea de código. Acepta tanto requisitos en texto libre como un archivo markdown de PRD.

Se ejecuta de forma integrada (inline) por defecto. No llames a la herramienta Task ni a ningún subagente de manera predeterminada. Esto mantiene a `/plan` funcional en instalaciones de plugins que solo distribuyen comandos sin archivos de agentes.

## Qué hace este comando

1. **Reiterar Requisitos** - Aclara lo que se necesita construir
2. **Identificar Riesgos** - Saca a la luz posibles problemas y bloqueadores
3. **Crear Plan por Pasos** - Desglosa la implementación en fases
4. **Esperar Confirmación** - DEBE recibir la aprobación del usuario antes de proceder

## Cuándo usarlo

Usa `/plan` cuando:
- Comiences una nueva característica
- Realices cambios arquitectónicos significativos
- Trabajes en refactorizaciones complejas
- Múltiples archivos/componentes vayan a verse afectados
- Los requisitos sean poco claros o ambiguos

## Cómo funciona

El asistente:

1. **Analizará la solicitud** y reiterará los requisitos en términos claros
2. **Fundamentará el plan** en patrones relevantes del código base cuando el repositorio esté disponible
3. **Desglosará en fases** con pasos específicos y accionables
4. **Identificará dependencias** entre componentes
5. **Evaluará riesgos** y bloqueadores potenciales
6. **Estimará la complejidad** (Alta/Media/Baja)
7. **Presentará el plan** y ESPERARÁ tu confirmación explícita

## Modos de Entrada

| Entrada | Modo | Comportamiento |
|---|---|---|
| `ruta/hacia/nombre.prd.md` | Modo artefacto PRD | Lee el PRD, selecciona el siguiente hito de entrega o fase de implementación pendiente y escribe `.claude/plans/{nombre}.plan.md` |
| Cualquier otra ruta markdown | Modo referencia | Lee el archivo como contexto y genera un plan inline |
| Texto libre | Modo conversacional | Genera un plan inline |
| Entrada vacía | Modo aclaración | Pregunta qué se desea planificar |

En el modo artefacto PRD, crea `.claude/plans/` si es necesario. Si el PRD contiene una tabla de `Delivery Milestones`, actualiza solo la fila seleccionada de `pending` a `in-progress` y asigna en su celda `Plan` la ruta del plan generado. Si el PRD utiliza el formato heredado `.claude/PRPs/prds/` con `Implementation Phases`, léelo sin migrar las rutas.

## Fundamentación en Patrones (Pattern Grounding)

Antes de redactar el plan, busca en el código base las convenciones que la implementación deba reflejar. Captura el ejemplo principal para cada categoría relevante con referencias a los archivos:

| Categoría | Qué capturar |
|---|---|
| Nomenclatura | Nombres de archivos, funciones, tipos, comandos o scripts en el área afectada |
| Manejo de errores | Cómo se lanzan, devuelven, registran o gestionan los fallos de manera controlada |
| Logging | Niveles, formato y qué eventos se registran |
| Acceso a datos | Patrones de repositorio, servicio, consultas o sistema de archivos |
| Pruebas | Ubicación de archivos de prueba, framework, fixtures y estilo de aserciones |

Si no existe código similar, indícalo explícitamente. No inventes un patrón.

## Salida del Artefacto PRD

Cuando se invoque con un archivo `.prd.md`, escribe el plan en `.claude/plans/{nombre-en-kebab-case}.plan.md` utilizando esta estructura:

````markdown
# Plan: {Nombre de la Característica}

**PRD de Origen**: {ruta}
**Hito Seleccionado**: {nombre del hito o fase}
**Complejidad**: {Pequeña | Mediana | Grande}

## Resumen
{2-3 oraciones}

## Patrones a Reflejar
| Categoría | Origen | Patrón |
|---|---|---|
| Nomenclatura | `ruta:línea` | {descripción corta} |
| Errores | `ruta:línea` | {descripción corta} |
| Pruebas | `ruta:línea` | {descripción corta} |

## Archivos a Modificar
| Archivo | Acción | Motivo |
|---|---|---|
| `ruta` | CREATE / UPDATE / DELETE | {motivo} |

## Tareas
### Tarea 1: {nombre}
- **Acción**: {qué hacer}
- **Reflejar**: {patrón a seguir}
- **Validar**: {comando que demuestra la corrección}

## Validación
```bash
{comandos de validación específicos del proyecto}
```

## Riesgos
| Riesgo | Probabilidad | Mitigación |
|---|---|---|

## Aceptación
- [ ] Todas las tareas completadas
- [ ] La validación pasa con éxito
- [ ] Patrones reflejados, no reinventados
````

Tras escribir el artefacto, reporta su ruta y ESPERA la confirmación antes de escribir código.

> **Revisión visual:** en lugar de solicitar una confirmación por texto, puedes abrir el
> artefacto en el Plan Canvas del navegador (`/plan-canvas` o la skill `plan-canvas`):
> el usuario anota el plan en la misma página y hace clic en **Approve plan** o **Request
> changes**, lo cual llega como tu señal de confirmación.

## Ejemplo de Uso

```
Usuario: /plan Necesito añadir notificaciones en tiempo real cuando los mercados se resuelvan

Asistente:
# Plan de Implementación: Notificaciones en Tiempo Real para Resolución de Mercados

## Reiteración de Requisitos
- Enviar notificaciones a los usuarios cuando se resuelvan los mercados que siguen
- Admitir múltiples canales de notificación (en la app, correo, webhook)
- Garantizar que las notificaciones se entreguen de forma confiable
- Incluir el resultado del mercado y el resultado de la posición del usuario

## Fases de Implementación

### Fase 1: Esquema de Base de Datos
- Añadir tabla de notificaciones con columnas: id, user_id, market_id, type, status, created_at
- Añadir tabla user_notification_preferences para preferencias de canal
- Crear índices en user_id y market_id para rendimiento

### Fase 2: Servicio de Notificaciones
- Crear servicio de notificaciones en lib/notifications.ts
- Implementar cola de notificaciones usando BullMQ/Redis
- Añadir lógica de reintento para entregas fallidas
- Crear plantillas de notificación

### Fase 3: Puntos de Integración
- Conectar con la lógica de resolución de mercado (cuando el estado cambie a "resolved")
- Consultar todos los usuarios con posiciones en el mercado
- Encolar notificaciones para cada usuario

### Fase 4: Componentes de Frontend
- Crear componente NotificationBell en el encabezado
- Añadir modal NotificationList
- Implementar actualizaciones en tiempo real mediante suscripciones de Supabase
- Añadir página de preferencias de notificación

## Dependencias
- Redis (para la cola)
- Servicio de correo (SendGrid/Resend)
- Suscripciones en tiempo real de Supabase

## Riesgos
- ALTO: Entregabilidad del correo (requiere SPF/DKIM)
- MEDIO: Rendimiento con más de 1000 usuarios por mercado
- MEDIO: Spam de notificaciones si los mercados se resuelven con frecuencia
- BAJO: Sobrecarga de suscripciones en tiempo real

## Complejidad Estimada: MEDIA
- Backend: 4-6 horas
- Frontend: 3-4 horas
- Pruebas: 2-3 horas
- Total: 9-13 horas

**ESPERANDO CONFIRMACIÓN**: ¿Deseas continuar con este plan? (sí/no/modificar)
```

## Notas Importantes

**CRÍTICO**: Este comando **NO** escribirá ningún código hasta que confirmes explícitamente el plan con "sí", "proceder" o una respuesta afirmativa equivalente.

Si deseas cambios, responde con:
- "modificar: [tus cambios]"
- "enfoque diferente: [alternativa]"
- "omitir la fase 2 y realizar la fase 3 primero"

## Integración con Otros Comandos

Después de planificar:
- Usa `/plan-canvas` para gestionar la aprobación de manera visual en el navegador (anotar + aprobar)
- Usa la skill `tdd-workflow` para implementar guiado por pruebas
- Usa `/build-fix` si se presentan errores de compilación
- Usa `/code-review` para revisar la implementación terminada
- Usa `/pr` o `/prp-pr` para abrir un pull request

> **¿Necesitas primero definir los requisitos?** Usa `/plan-prd` para generar un PRD ágil en `.claude/prds/{nombre}.prd.md`.
>
> **¿Necesitas el flujo PRP heredado?** Usa `/prp-plan` para una planificación profunda con artefactos en `.claude/PRPs/`. Usa `/prp-implement` para ejecutar esos planes con bucles de validación rigurosos.

## Agente Planner Opcional

ECC también incluye un agente `planner` para instalaciones manuales que incluyen archivos de agentes. Úsalo solo cuando el entorno local ya exponga ese subagente y el usuario solicite explícitamente delegar la planificación.

Si el subagente `planner` no está disponible, continúa planificando de manera inline en lugar de mostrar un error de tipo "Agent type 'planner' not found".

Para instalaciones manuales, el archivo fuente reside en:
`agents/planner.md`
