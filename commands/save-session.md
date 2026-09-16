---
description: Guarda el estado de la sesión actual en un archivo fechado en ~/.claude/session-data/ para que el trabajo pueda reanudarse en una sesión futura con contexto completo.
---

# Comando Guardar Sesión (Save Session)

Captura todo lo ocurrido durante esta sesión —lo que se construyó, lo que funcionó, lo que falló, lo que queda pendiente— y escríbelo en un archivo fechado para que la siguiente sesión pueda continuar exactamente donde terminó esta.

## Cuándo usarlo

- Al final de una jornada o sesión de trabajo antes de cerrar Claude Code
- Antes de alcanzar los límites de contexto (ejecuta esto primero y luego inicia una sesión limpia)
- Después de resolver un problema complejo que desees recordar
- Cada vez que necesites transferir contexto a una sesión futura

## Proceso

### Paso 1: Recopilar contexto

Antes de escribir el archivo, reúne:

- Lee todos los archivos modificados durante esta sesión (usa git diff o repasa la conversación)
- Revisa lo que se debatió, se intentó y se decidió
- Toma nota de cualquier error encontrado y cómo se resolvió (o no)
- Comprueba el estado actual de pruebas y compilación si es relevante

### Paso 2: Crear la carpeta de sesiones si no existe

Crea la carpeta canónica de sesiones en el directorio home de Claude del usuario:

```bash
mkdir -p ~/.claude/session-data
```

### Paso 3: Escribir el archivo de sesión

Crea `~/.claude/session-data/AAAA-MM-DD-<short-id>-session.tmp`, utilizando la fecha real de hoy y un identificador corto (short-id) que cumpla con las reglas impuestas por `SESSION_FILENAME_REGEX` en `session-manager.js`:

- Caracteres compatibles: letras `a-z` / `A-Z`, dígitos `0-9`, guiones `-`, guiones bajos `_`
- Longitud mínima de compatibilidad: 1 carácter
- Estilo recomendado para archivos nuevos: letras minúsculas, dígitos y guiones con 8 o más caracteres para evitar colisiones

Ejemplos válidos: `abc123de`, `a1b2c3d4`, `frontend-worktree-1`, `ChezMoi_2`
Evitar en archivos nuevos: `A`, `test_id1`, `ABC123de`

Ejemplo completo de nombre válido: `2024-01-15-abc123de-session.tmp`

El nombre de archivo heredado `AAAA-MM-DD-session.tmp` sigue siendo válido, pero los nuevos archivos de sesión deben preferir la forma con short-id para evitar colisiones en el mismo día.

### Paso 4: Poblar el archivo con todas las secciones siguientes

Escribe cada sección con honestidad. No omitas secciones — escribe "Nada aún" o "N/A" si una sección genuinamente no tiene contenido. Un archivo incompleto es peor que una sección honestamente vacía.

### Paso 5: Mostrar el archivo al usuario

Tras escribirlo, muestra el contenido completo y pregunta:

```
Sesión guardada en [ruta real resuelta al archivo de sesión]

¿Se ve preciso? ¿Hay algo que corregir o añadir antes de cerrar?
```

Espera la confirmación. Realiza modificaciones si se solicitan.

---

## Formato del Archivo de Sesión

```markdown
# Sesión: AAAA-MM-DD

**Iniciada:** [hora aproximada si se conoce]
**Última Actualización:** [hora actual]
**Proyecto:** [nombre o ruta del proyecto]
**Tema:** [resumen de una línea sobre qué trató esta sesión]

---

## Qué Estamos Construyendo

[1-3 párrafos describiendo la característica, corrección de error o tarea. Incluye
suficiente contexto para que alguien sin memoria previa de esta sesión entienda el objetivo.
Incluye: qué hace, por qué es necesario, cómo encaja en el sistema general.]

---

## Qué FUNCIONÓ (con evidencias)

[Lista únicamente lo que esté confirmado que funciona. Para cada elemento incluye POR QUÉ
sabes que funciona — prueba superada, probado en navegador, Postman devolvió 200, etc.
Sin evidencia, muévelo a "Qué no se ha intentado aún".]

- **[cosa que funciona]** — confirmado por: [evidencia específica]
- **[cosa que funciona]** — confirmado por: [evidencia específica]

Si aún no hay nada confirmado: "Nada confirmado como funcional todavía — todos los enfoques siguen en progreso o sin probar."

---

## Qué NO Funcionó (y por qué)

[Esta es la sección más importante. Lista cada enfoque probado que haya fallado.
Para cada fallo escribe la razón EXACTA para que la siguiente sesión no lo vuelva a intentar.
Sé específico: "lanzó el error X debido a Y" es útil. "no funcionó" no lo es.]

- **[enfoque probado]** — falló debido a: [motivo exacto / mensaje de error]
- **[enfoque probado]** — falló debido a: [motivo exacto / mensaje de error]

Si nada falló: "No hay enfoques fallidos todavía."

---

## Qué NO se ha Intentado Aún

[Enfoques prometedores pero no probados. Ideas surgidas de la conversación.
Soluciones alternativas que valga la pena explorar. Sé lo bastante específico para que
la siguiente sesión sepa con exactitud qué probar.]

- [enfoque / idea]
- [enfoque / idea]

Si no hay nada en cola: "No se identificaron enfoques no probados específicos."

---

## Estado Actual de los Archivos

[Cada archivo tocado en esta sesión. Sé preciso con el estado de cada uno.]

| Archivo           | Estado         | Notas                      |
| ----------------- | -------------- | -------------------------- |
| `path/to/file.ts` | PASS: Completo    | [qué hace]                 |
| `path/to/file.ts` |  En Progreso | [qué está hecho, qué falta]|
| `path/to/file.ts` | FAIL: Roto        | [cuál es el problema]      |
| `path/to/file.ts` |  No Iniciado | [planificado pero no tocado]|

Si no se tocaron archivos: "No se modificaron archivos en esta sesión."

---

## Decisiones Tomadas

[Opciones de arquitectura, concesiones aceptadas, enfoques elegidos y motivos.
Esto evita que la siguiente sesión vuelva a debatir decisiones ya tomadas.]

- **[decisión]** — motivo: [por qué se eligió sobre alternativas]

Si no hubo decisiones significativas: "No se tomaron decisiones importantes en esta sesión."

---

## Bloqueadores y Preguntas Abiertas

[Cualquier aspecto no resuelto que la siguiente sesión deba abordar o investigar.
Preguntas que surgieron pero no fueron respondidas. Dependencias externas pendientes.]

- [bloqueador / pregunta abierta]

Si no hay: "No hay bloqueadores activos."

---

## Siguiente Paso Exacto

[Si se conoce: La acción más importante que realizar al reanudar. Sé lo bastante
preciso para que reanudar no requiera pensar por dónde empezar.]

[Si no se conoce: "Siguiente paso no determinado — revisar las secciones 'Qué NO se ha intentado aún'
y 'Bloqueadores' para decidir la dirección antes de comenzar."]

---

## Notas de Entorno y Configuración

[Rellenar solo si es relevante — comandos necesarios para ejecutar el proyecto, variables
de entorno requeridas, servicios que deben estar corriendo, etc. Omitir si es configuración estándar.]

[Si no hay: omitir esta sección completamente.]
```

---

## Ejemplo de Salida

```markdown
# Sesión: 2024-01-15

**Iniciada:** ~2pm
**Última Actualización:** 5:30pm
**Proyecto:** my-app
**Tema:** Construcción de autenticación JWT con cookies httpOnly

---

## Qué Estamos Construyendo

Sistema de autenticación de usuarios para la app en Next.js. Los usuarios se registran con correo/contraseña,
reciben un JWT almacenado en una cookie httpOnly (no en localStorage), y las rutas protegidas
verifican la validez del token mediante middleware. El objetivo es mantener la sesión tras recargar
la página sin exponer el token a JavaScript.

---

## Qué FUNCIONÓ (con evidencias)

- **Endpoint `/api/auth/register`** — confirmado por: POST en Postman devuelve 200 con el objeto de
  usuario, fila visible en el panel de Supabase, hash de bcrypt guardado correctamente
- **Generación de JWT en `lib/auth.ts`** — confirmado por: prueba unitaria aprobada
  (`npm test -- auth.test.ts`), token decodificado en jwt.io muestra el payload correcto
- **Hash de contraseña** — confirmado por: `bcrypt.compare()` retorna true en la prueba

---

## Qué NO Funcionó (y por qué)

- **Librería Next-Auth** — falló debido a: conflicto con nuestro adaptador personalizado de Prisma,
  arrojó "Cannot use adapter with credentials provider in this configuration" en cada
  solicitud. No vale la pena depurarlo — impone demasiadas restricciones para nuestra configuración.
- **Guardar JWT en localStorage** — falló debido a: el renderizado SSR ocurre antes de que
  localStorage esté disponible, provocando error de discordancia de hidratación en cada carga.
  Este enfoque es fundamentalmente incompatible con el SSR de Next.js.

---

## Qué NO se ha Intentado Aún

- Guardar el JWT como cookie httpOnly en la respuesta de la ruta de login (solución más probable)
- Usar `cookies()` de `next/headers` para leer el token en componentes de servidor
- Escribir middleware.ts para proteger rutas comprobando la existencia de la cookie

---

## Estado Actual de los Archivos

| Archivo                          | Estado         | Notas                                           |
| -------------------------------- | -------------- | ----------------------------------------------- |
| `app/api/auth/register/route.ts` | PASS: Completo    | Funciona, testeado                              |
| `app/api/auth/login/route.ts`    |  En Progreso | Genera token pero aún no establece la cookie    |
| `lib/auth.ts`                    | PASS: Completo    | Helpers de JWT, todos testeados                 |
| `middleware.ts`                  |  No Iniciado | Protección de rutas, requiere lectura de cookie |
| `app/login/page.tsx`             |  No Iniciado | Interfaz no iniciada                            |

---

## Decisiones Tomadas

- **Cookie httpOnly sobre localStorage** — motivo: previene robo de tokens por XSS, funciona con SSR
- **Autenticación propia sobre Next-Auth** — motivo: Next-Auth entra en conflicto con nuestra configuración de Prisma

---

## Bloqueadores y Preguntas Abiertas

- ¿Funciona `cookies().set()` dentro de un Route Handler o solo en Server Actions? Requiere comprobación.

---

## Siguiente Paso Exacto

En `app/api/auth/login/route.ts`, tras generar el JWT, establecerlo como una cookie
httpOnly usando `cookies().set('token', jwt, { httpOnly: true, secure: true, sameSite: 'strict' })`.
Luego probar con Postman — la respuesta debe incluir el encabezado `Set-Cookie`.
```

---

## Notas

- Cada sesión tiene su propio archivo — nunca añadas contenido al final de un archivo de sesión previo
- La sección "Qué NO Funcionó" es la más crítica — sesiones futuras reintentarán a ciegas enfoques fallidos si falta
- Si el usuario solicita guardar a mitad de sesión, guarda lo conocido hasta el momento y marca con claridad los elementos en progreso
- El archivo está pensado para ser leído por Claude al comienzo de la siguiente sesión mediante `/resume-session`
- Usa el almacén canónico global de sesiones: `~/.claude/session-data/`
- Prefiere el formato de nombre con short-id (`AAAA-MM-DD-<short-id>-session.tmp`) para cualquier archivo nuevo de sesión
