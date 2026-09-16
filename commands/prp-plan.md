---
description: Crea un plan exhaustivo de implementación de características con análisis del código base y extracción de patrones
argument-hint: <descripción de la característica | ruta/hacia/prd.md>
---

> Adaptado de PRPs-agentic-eng por Wirasm. Parte de la serie de flujos de trabajo PRP.

# Planificación PRP (PRP Plan)

Crea un plan de implementación detallado e independiente que captura todos los patrones, convenciones y contexto del código base necesarios para implementar una característica en una sola pasada.

**Filosofía Central**: Un gran plan contiene todo lo necesario para implementar sin requerir preguntas adicionales. Cada patrón, cada convención, cada detalle crítico — capturado una vez, referenciado en todo momento.

**Regla de Oro**: Si necesitarías buscar en el código base durante la implementación, captura ese conocimiento AHORA en el plan.

---

## Fase 0 — DETECTAR

Determina el tipo de entrada a partir de `$ARGUMENTS`:

| Patrón de Entrada | Detección | Acción |
|---|---|---|
| Ruta que termina en `.prd.md` | Ruta a archivo PRD | Analizar PRD, buscar la siguiente fase pendiente |
| Ruta a `.md` con "Implementation Phases" | Documento tipo PRD | Analizar fases, buscar la siguiente pendiente |
| Ruta a cualquier otro archivo | Archivo de referencia | Leer archivo como contexto, tratar como texto libre |
| Texto en lenguaje libre | Descripción de característica | Avanzar directamente a la Fase 1 |
| Vacío / en blanco | Sin entrada | Preguntar al usuario qué característica planificar |

### Análisis de PRD (cuando la entrada es un PRD)

1. Lee el archivo PRD con `cat "$PRD_PATH"`
2. Analiza la sección **Implementation Phases**
3. Encuentra fases por estado:
   - Busca fases `pending`
   - Revisa cadenas de dependencias (una fase puede depender de que fases previas estén `complete`)
   - Selecciona la **siguiente fase pendiente elegible**
4. Extrae de la fase seleccionada:
   - Nombre y descripción de la fase
   - Criterios de aceptación
   - Dependencias de fases previas
   - Notas de alcance o restricciones
5. Utiliza la descripción de la fase como la característica a planificar

Si no quedan fases pendientes, informa que todas las fases están completadas.

---

## Fase 1 — PARSEAR (PARSE)

Extrae y aclara los requerimientos de la característica.

### Comprensión de la Característica

A partir de la entrada (fase de PRD o descripción en texto libre), identifica:

- **Qué** se está construyendo (entregable concreto)
- **Por qué** es importante (valor para el usuario)
- **Quién** lo utiliza (usuario o sistema objetivo)
- **Dónde** encaja (qué parte del código base)

### Historia de Usuario

Formato:
```
Como [tipo de usuario],
Quiero [capacidad],
Para [beneficio].
```

### Evaluación de Complejidad

| Nivel | Indicadores | Alcance Típico |
|---|---|---|
| **Pequeño** | Archivo único, cambio aislado, sin dependencias nuevas | 1-3 archivos, <100 líneas |
| **Mediano** | Múltiples archivos, sigue patrones existentes, conceptos nuevos menores | 3-10 archivos, 100-500 líneas |
| **Grande** | Preocupaciones transversales, patrones nuevos, integraciones externas | 10+ archivos, 500+ líneas |
| **XL** | Cambios arquitectónicos, nuevos subsistemas, migración requerida | 20+ archivos, considerar dividir |

### Control de Ambigüedad (Ambiguity Gate)

Si alguno de estos puntos no está claro, **DETENTE y pregunta al usuario** antes de continuar:

- El entregable central es vago
- Los criterios de éxito no están definidos
- Existen múltiples interpretaciones válidas
- El enfoque técnico presenta grandes incógnitas

NO adivines. Pregunta. Un plan construido sobre suposiciones fracasa durante la implementación.

---

## Fase 2 — EXPLORAR (EXPLORE)

Reúne inteligencia profunda del código base. Busca en el repositorio directamente para cada una de las siguientes categorías.

### Búsqueda en el Código Base (8 Categorías)

Para cada categoría, busca usando grep, find y lectura de archivos:

1. **Implementaciones Similares** — Encuentra características existentes que se asemejen a la planeada. Busca patrones, endpoints, componentes o módulos análogos.

2. **Convenciones de Nomenclatura** — Identifica cómo se nombran archivos, funciones, variables, clases y exportaciones en el área relevante del código base.

3. **Manejo de Errores** — Identifica cómo se capturan, propagan, registran y devuelven los errores a los usuarios en rutas de código similares.

4. **Patrones de Logging** — Identifica qué se registra, en qué nivel y con qué formato.

5. **Definiciones de Tipos** — Encuentra tipos, interfaces y esquemas relevantes, y cómo están organizados.

6. **Patrones de Prueba** — Identifica cómo se prueban características similares. Anota ubicación de archivos de prueba, nombres, patrones de setup/teardown y estilos de aserción.

7. **Configuración** — Encuentra archivos de configuración relevantes, variables de entorno y feature flags.

8. **Dependencias** — Identifica paquetes, importaciones y módulos internos utilizados por características similares.

### Análisis del Código Base (5 Trazas)

Lee archivos relevantes para trazar:

1. **Puntos de Entrada** — ¿Cómo entra una solicitud/acción al sistema y llega al área que estás modificando?
2. **Flujo de Datos** — ¿Cómo se mueven los datos a través de las rutas de código pertinentes?
3. **Cambios de Estado** — ¿Qué estado se modifica y dónde?
4. **Contratos** — ¿Qué interfaces, APIs o protocolos deben respetarse?
5. **Patrones** — ¿Qué patrones arquitectónicos se utilizan (repositorio, servicio, controlador, etc.)?

### Tabla Unificada de Descubrimiento

Compila los hallazgos en una única referencia:

| Categoría | Archivo:Líneas | Patrón | Fragmento Clave |
|---|---|---|---|
| Nomenclatura | `src/services/userService.ts:1-5` | Servicios en camelCase, tipos en PascalCase | `export class UserService` |
| Errores | `src/middleware/errorHandler.ts:10-25` | Clase personalizada AppError | `throw new AppError(...)` |
| ... | ... | ... | ... |

---

## Fase 3 — INVESTIGAR (RESEARCH)

Si la característica involucra librerías externas, APIs o tecnologías no familiares:

1. Busca en la web la documentación oficial
2. Encuentra ejemplos de uso y mejores prácticas
3. Identifica advertencias o detalles críticos específicos de la versión

Formatea cada hallazgo como:

```
KEY_INSIGHT: [lo que aprendiste]
APPLIES_TO: [a qué parte del plan afecta esto]
GOTCHA: [advertencias o problemas específicos de versión]
```

Si la característica utiliza únicamente patrones internos bien conocidos, omite esta fase y anota: "No se requiere investigación externa — la característica utiliza patrones internos consolidados."

---

## Fase 4 — DISEÑAR (DESIGN)

### Transformación de UX (si corresponde)

Documenta la experiencia de usuario antes y después:

**Antes:**
```
┌─────────────────────────────┐
│  [Experiencia actual]       │
│  Muestra el flujo actual,   │
│  lo que el usuario ve/hace  │
└─────────────────────────────┘
```

**Después:**
```
┌─────────────────────────────┐
│  [Nueva experiencia]        │
│  Muestra el flujo mejorado, │
│  qué cambia para el usuario │
└─────────────────────────────┘
```

### Cambios en Interacción

| Punto de Contacto | Antes | Después | Notas |
|---|---|---|---|
| ... | ... | ... | ... |

Si la característica es puramente de backend o interna sin impacto en UX, anota: "Cambio interno — sin transformación de UX de cara al usuario."

---

## Fase 5 — ARQUITECTURA (ARCHITECT)

### Diseño Estratégico

Define el enfoque de implementación:

- **Enfoque**: Estrategia de alto nivel (ej., "Añadir nueva capa de servicio siguiendo el patrón de repositorio existente")
- **Alternativas Consideradas**: Qué otros enfoques se evaluaron y por qué fueron descartados
- **Alcance**: Límites concretos de lo que SÍ se construirá
- **FUERA de Alcance**: Lista explícita de lo que NO se construirá (evita desviaciones de alcance durante la implementación)

---

## Fase 6 — GENERAR (GENERATE)

Redacta el documento de plan completo utilizando la plantilla siguiente. Guárdalo en `.claude/PRPs/plans/{nombre-en-kebab-case}.plan.md`.

Crea el directorio si no existe:
```bash
mkdir -p .claude/PRPs/plans
```

### Plantilla de Plan

````markdown
# Plan: [Nombre de la Característica]

## Resumen
[Descripción general de 2-3 oraciones]

## Historia de Usuario
Como [usuario], quiero [capacidad], para [beneficio].

## Problema → Solución
[Estado actual] → [Estado deseado]

## Metadatos
- **Complejidad**: [Pequeño | Mediano | Grande | XL]
- **PRD de Origen**: [ruta o "N/A"]
- **Fase de PRD**: [nombre de la fase o "N/A"]
- **Archivos Estimados**: [cantidad]

---

## Diseño UX

### Antes
[Diagrama ASCII o "N/A — cambio interno"]

### Después
[Diagrama ASCII o "N/A — cambio interno"]

### Cambios de Interacción
| Punto de Contacto | Antes | Después | Notas |
|---|---|---|---|

---

## Lectura Obligatoria

Archivos que DEBEN leerse antes de implementar:

| Prioridad | Archivo | Líneas | Motivo |
|---|---|---|---|
| P0 (crítico) | `ruta/al/archivo` | 1-50 | Patrón principal a seguir |
| P1 (importante) | `ruta/al/archivo` | 10-30 | Tipos relacionados |
| P2 (referencia) | `ruta/al/archivo` | todas | Implementación similar |

## Documentación Externa

| Tema | Fuente | Conclusión Clave |
|---|---|---|
| ... | ... | ... |

---

## Patrones a Reflejar

Patrones de código descubiertos en el código base. Síguelos al pie de la letra.

### NAMING_CONVENTION
// FUENTE: [archivo:líneas]
[fragmento de código real mostrando el patrón de nombres]

### ERROR_HANDLING
// FUENTE: [archivo:líneas]
[fragmento de código real mostrando el manejo de errores]

### LOGGING_PATTERN
// FUENTE: [archivo:líneas]
[fragmento de código real mostrando el logging]

### REPOSITORY_PATTERN
// FUENTE: [archivo:líneas]
[fragmento de código real mostrando el acceso a datos]

### SERVICE_PATTERN
// FUENTE: [archivo:líneas]
[fragmento de código real mostrando la capa de servicio]

### TEST_STRUCTURE
// FUENTE: [archivo:líneas]
[fragmento de código real mostrando la estructura de pruebas]

---

## Archivos a Modificar

| Archivo | Acción | Justificación |
|---|---|---|
| `ruta/al/archivo.ts` | CREAR | Nuevo servicio para la característica |
| `ruta/al/existente.ts` | ACTUALIZAR | Añadir nuevo método |

## FUERA de Alcance

- [Elemento explícito 1 fuera de alcance]
- [Elemento explícito 2 fuera de alcance]

---

## Tareas Paso a Paso

### Tarea 1: [Nombre]
- **ACCIÓN**: [Qué hacer]
- **IMPLEMENTAR**: [Código/lógica específica a escribir]
- **REFLEJAR**: [Patrón de la sección Patrones a Reflejar a seguir]
- **IMPORTACIONES**: [Importaciones requeridas]
- **DETALLE CRÍTICO (GOTCHA)**: [Trampa conocida a evitar]
- **VALIDAR**: [Cómo verificar que esta tarea es correcta]

### Tarea 2: [Nombre]
- **ACCIÓN**: ...
- **IMPLEMENTAR**: ...
- **REFLEJAR**: ...
- **IMPORTACIONES**: ...
- **DETALLE CRÍTICO (GOTCHA)**: ...
- **VALIDAR**: ...

[Continuar para todas las tareas...]

---

## Estrategia de Pruebas

### Pruebas Unitarias

| Prueba | Entrada | Salida Esperada | ¿Caso Límite? |
|---|---|---|---|
| ... | ... | ... | ... |

### Lista de Verificación de Casos Límite
- [ ] Entrada vacía
- [ ] Entrada de tamaño máximo
- [ ] Tipos inválidos
- [ ] Acceso concurrente
- [ ] Fallo de red (si aplica)
- [ ] Permiso denegado

---

## Comandos de Validación

### Análisis Estático
```bash
# Ejecutar verificador de tipos
[comando de comprobación de tipos específico del proyecto]
```
ESPERADO: Cero errores de tipos

### Pruebas Unitarias
```bash
# Ejecutar pruebas del área afectada
[comando de prueba específico del proyecto]
```
ESPERADO: Todas las pruebas pasan

### Suite Completa de Pruebas
```bash
# Ejecutar suite completa de pruebas
[comando de prueba completa específico del proyecto]
```
ESPERADO: Sin regresiones

### Validación de Base de Datos (si aplica)
```bash
# Verificar esquema/migraciones
[comando de BD específico del proyecto]
```
ESPERADO: Esquema actualizado

### Validación en Navegador (si aplica)
```bash
# Iniciar servidor de desarrollo y verificar
[comando de servidor de desarrollo específico del proyecto]
```
ESPERADO: La característica funciona según el diseño

### Validación Manual
- [ ] [Lista de verificación de comprobación manual paso a paso]

---

## Criterios de Aceptación
- [ ] Todas las tareas completadas
- [ ] Todos los comandos de validación aprobados
- [ ] Pruebas escritas y pasando
- [ ] Sin errores de tipos
- [ ] Sin errores de lint
- [ ] Coincide con el diseño de UX (si aplica)

## Lista de Verificación de Finalización
- [ ] El código sigue los patrones descubiertos
- [ ] El manejo de errores coincide con el estilo del código base
- [ ] El logging sigue las convenciones del código base
- [ ] Las pruebas siguen los patrones de prueba
- [ ] Sin valores fijos o codificados a mano (hardcoded)
- [ ] Documentación actualizada (si es necesario)
- [ ] Sin adiciones de alcance innecesarias
- [ ] Autónomo — sin necesidad de hacer preguntas durante la implementación

## Riesgos
| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| ... | ... | ... | ... |

## Notas
[Contexto adicional, decisiones u observaciones]
````

---

## Salida

### Guardar el Plan

Escribe el plan generado en:
```
.claude/PRPs/plans/{nombre-de-caracteristica-en-kebab-case}.plan.md
```

### Actualizar PRD (si la entrada fue un PRD)

Si este plan se generó a partir de una fase de un PRD:
1. Actualiza el estado de la fase de `pending` a `in-progress`
2. Añade la ruta del archivo del plan como referencia en la fase

### Reportar al Usuario

```
## Plan Creado

- **Archivo**: .claude/PRPs/plans/{nombre-de-caracteristica-en-kebab-case}.plan.md
- **PRD de Origen**: [ruta o "N/A"]
- **Fase**: [nombre de la fase o "independiente"]
- **Complejidad**: [nivel]
- **Alcance**: [N archivos, M tareas]
- **Patrones Clave**: [los 3 principales patrones descubiertos]
- **Investigación Externa**: [temas investigados o "no requerida"]
- **Riesgos**: [riesgo principal o "ninguno identificado"]
- **Puntuación de Confianza**: [1-10] — probabilidad de implementación en una sola pasada

> Siguiente paso: Ejecuta `/prp-implement .claude/PRPs/plans/{name}.plan.md` para ejecutar este plan.
```

---

## Verificación

Antes de finalizar, verifica el plan con estas listas de control:

### Exhaustividad de Contexto
- [ ] Todos los archivos relevantes descubiertos y documentados
- [ ] Convenciones de nomenclatura capturadas con ejemplos
- [ ] Patrones de manejo de errores documentados
- [ ] Patrones de pruebas identificados
- [ ] Dependencias listadas

### Preparación para la Implementación
- [ ] Cada tarea contiene ACCIÓN, IMPLEMENTAR, REFLEJAR y VALIDAR
- [ ] Ninguna tarea requiere búsquedas adicionales en el código base
- [ ] Rutas de importación especificadas
- [ ] Trampas conocidas (GOTCHAs) documentadas cuando corresponda

### Fidelidad a los Patrones
- [ ] Los fragmentos de código son ejemplos reales del código base (no inventados)
- [ ] Las referencias de FUENTE apuntan a archivos y números de línea reales
- [ ] Los patrones cubren nombres, errores, logging, acceso a datos y pruebas
- [ ] El nuevo código será indistinguible del código existente

### Cobertura de Validación
- [ ] Comandos de análisis estático especificados
- [ ] Comandos de prueba especificados
- [ ] Verificación de compilación incluida

### Claridad de UX
- [ ] Estados antes/después documentados (o marcados como N/A)
- [ ] Cambios de interacción listados
- [ ] Casos límite de UX identificados

### Prueba de Cero Conocimiento Previo
Un desarrollador no familiarizado con este repositorio debería ser capaz de implementar la característica usando ÚNICAMENTE este plan, sin buscar en el código ni hacer preguntas. Si no es así, añade el contexto faltante.

---

## Siguientes Pasos

- Ejecuta `/prp-implement <ruta-del-plan>` para ejecutar este plan
- Ejecuta `/plan` para una planificación conversacional rápida sin artefactos
- Ejecuta `/prp-prd` para crear un PRD primero si el alcance no está claro
