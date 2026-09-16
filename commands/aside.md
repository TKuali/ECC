---
description: Responde a una pregunta secundaria rápida sin interrumpir ni perder el contexto de la tarea actual. Reanuda el trabajo automáticamente tras responder.
---

# Comando Aside

Haz una pregunta a mitad de la tarea y obtén una respuesta inmediata y enfocada — luego continúa justo donde lo dejaste. La tarea activa, los archivos y el contexto nunca se modifican.

## Cuándo Usar

- Sientes curiosidad por algo mientras Claude trabaja y no quieres perder impulso
- Necesitas una explicación rápida del código que Claude está editando actualmente
- Quieres una segunda opinión o aclaración sobre una decisión sin descarrilar la tarea
- Necesitas entender un error, concepto o patrón antes de que Claude continúe
- Deseas preguntar algo no relacionado con la tarea actual sin iniciar una nueva sesión

## Uso

```
/aside <tu pregunta>
/aside ¿qué retorna realmente esta función?
/aside ¿este patrón es seguro para hilos (thread-safe)?
/aside ¿por qué usamos X en lugar de Y aquí?
/aside ¿cuál es la diferencia entre foo() y bar()?
/aside ¿deberíamos preocuparnos por la consulta N+1 que acabamos de agregar?
```

## Proceso

### Paso 1: Congelar el estado de la tarea actual

Antes de responder nada, tomar nota mentalmente de:
- ¿Cuál es la tarea activa? (en qué archivo, funcionalidad o problema se estaba trabajando)
- ¿Qué paso estaba en progreso en el momento en que se invocó `/aside`?
- ¿Qué estaba a punto de ocurrir a continuación?

NO tocar, editar, crear ni eliminar ningún archivo durante el aside.

### Paso 2: Responder la pregunta directamente

Responder la pregunta de la forma más concisa que siga siendo completa y útil.

- Empezar con la respuesta directa, no con el razonamiento
- Mantenerlo breve — si se necesita una explicación completa, ofrecer profundizar tras la tarea
- Si la pregunta es sobre el archivo o código actual sobre el que se trabaja, referenciarlo con precisión (ruta del archivo y número de línea si es relevante)
- Si para responder se requiere leer un archivo, leerlo — pero solo lectura, nunca escritura

Formatear la respuesta como:

```
ASIDE: [replantear la pregunta brevemente]

[Tu respuesta aquí]

— De vuelta a la tarea: [descripción de una línea de lo que se estaba haciendo]
```

### Paso 3: Reanudar la tarea principal

Tras entregar la respuesta, continuar inmediatamente la tarea activa desde el punto exacto en que se pausó. No pedir permiso para reanudar a menos que la respuesta del aside haya revelado un bloqueo o un motivo para reconsiderar el enfoque actual (ver Casos Límite).

---

## Casos Límite

**No se proporciona pregunta (`/aside` sin texto posterior):**
Responder:
```
ASIDE: no se proporcionó ninguna pregunta

¿Qué te gustaría saber? (haz tu pregunta y responderé sin perder el contexto de la tarea actual)

— De vuelta a la tarea: [descripción de una línea de lo que se estaba haciendo]
```

**La pregunta revela un problema potencial con la tarea actual:**
Marcarlo con claridad antes de reanudar:
```
ASIDE: [respuesta]

WARNING: Nota: Esta respuesta sugiere [problema] con el enfoque actual. ¿Deseas resolver esto antes de continuar o procedemos según lo planeado?
```
Esperar la decisión del usuario antes de reanudar.

**La pregunta es en realidad un cambio de rumbo en la tarea (no una duda secundaria):**
Si la pregunta implica cambiar lo que se está construyendo (p. ej., `/aside en realidad usemos Redis en su lugar`), clarificar:
```
ASIDE: Eso parece un cambio de rumbo, no solo una pregunta secundaria.
¿Deseas:
  (a) Responder esto como información únicamente y mantener el plan actual
  (b) Pausar la tarea actual y cambiar de enfoque
```
Esperar la respuesta del usuario — no hacer suposiciones.

**La pregunta es sobre el archivo o código actualmente abierto:**
Responder a partir del contexto en vivo. Si el archivo se leyó antes en la sesión, referenciarlo directamente. Si no, leerlo ahora (solo lectura) y responder con una referencia archivo:línea.

**No hay tarea activa (nada en progreso al invocar `/aside`):**
Utilizar de todos modos la plantilla estándar para mantener la consistencia:
```
ASIDE: [replantear la pregunta brevemente]

[Tu respuesta aquí]

— De vuelta a la tarea: no hay tarea activa para reanudar
```

**La pregunta requiere una respuesta extensa:**
Dar la respuesta esencial de manera concisa y luego ofrecer:
```
Esa es la versión corta. ¿Deseas una explicación más detallada después de terminar [tarea actual]?
```

**Múltiples preguntas `/aside` consecutivas:**
Responder cada una en secuencia. Tras la última respuesta, reanudar la tarea principal. No perder el estado de la tarea a través de una cadena de asides.

**La respuesta del aside implica que se necesita un cambio de código:**
Anotar el cambio necesario pero no realizarlo durante el aside:
```
ASIDE: [respuesta]

 Vale la pena corregir: [qué debería cambiarse]. Lo marcaré después de la tarea actual a menos que desees abordarlo ahora.
```

**La pregunta es ambigua o demasiado vaga:**
Hacer una sola pregunta de aclaración — la más breve posible para obtener la información necesaria para responder. No hacer preguntas múltiples.

---

## Ejemplo de Salida

```
Usuario: /aside ¿qué hace realmente fetchWithRetry()?

ASIDE: ¿qué hace fetchWithRetry()?

fetchWithRetry() (src/api/retry.ts:12) intenta la petición hasta 3 veces con
retroceso exponencial (exponential backoff: 250ms → 500ms → 1s). Solo reintenta ante
respuestas 5xx y errores de red — los errores 4xx se tratan como definitivos y no se reintentan.

— De vuelta a la tarea: refactorizando el middleware de autenticación en src/middleware/auth.ts
```

```
Usuario: /aside ¿el enfoque que estamos usando es seguro para hilos?

ASIDE: ¿el enfoque actual es seguro para hilos (thread-safe)?

No — el objeto de caché compartido en src/cache/store.ts:34 se muta sin bloqueo (locking).
Bajo peticiones concurrentes esto genera una condición de carrera. Es de bajo riesgo en un servidor
Node.js de proceso único, pero sería un problema real con worker threads o en modo clúster.

WARNING: Nota: Esto podría afectar la funcionalidad que estamos construyendo. ¿Deseas abordar esto ahora o continuar y solucionarlo en una tarea posterior?
```

---

## Notas

- Nunca modificar archivos durante un aside — solo acceso de lectura
- El aside es una pausa en la conversación, no una tarea nueva — la tarea original siempre debe reanudarse
- Mantener las respuestas enfocadas: el objetivo es desbloquear al usuario rápidamente, no dar una conferencia
- Si un aside desata un debate más amplio, terminar la tarea actual primero a menos que el aside revele un bloqueo crítico
- Los asides no se guardan en archivos de sesión a menos que sean explícitamente relevantes para el resultado de la tarea
