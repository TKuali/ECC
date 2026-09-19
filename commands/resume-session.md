---
description: Carga el archivo de sesión más reciente desde ~/.claude/session-data/ y reanuda el trabajo con contexto completo desde donde concluyó la última sesión.
---

# Comando Reanudar Sesión (Resume Session)

Carga el último estado de sesión guardado y oriéntate completamente antes de realizar cualquier trabajo.
Este comando es la contraparte de `/save-session`.

## Cuándo usarlo

- Al comenzar una nueva sesión para continuar el trabajo de un día anterior
- Después de iniciar una sesión limpia debido a límites de contexto
- Al recibir un archivo de sesión de otra fuente (simplemente proporciona la ruta del archivo)
- Cada vez que dispongas de un archivo de sesión y desees que Claude lo asimile por completo antes de continuar

## Uso

```
/resume-session                                                      # carga el archivo más reciente en ~/.claude/session-data/
/resume-session 2024-01-15                                           # carga la sesión más reciente para esa fecha
/resume-session ~/.claude/session-data/2024-01-15-abc123de-session.tmp  # carga un archivo de sesión actual con id corto
/resume-session ~/.claude/sessions/2024-01-15-session.tmp               # carga un archivo específico en formato heredado
```

## Proceso

### Paso 1: Encontrar el archivo de sesión

Si no se proporciona ningún argumento:

1. Revisa `~/.claude/session-data/`
2. Lee los candidatos que coincidan con `*-session.tmp` y aplica la clasificación de candidatos siguiente
3. Carga el candidato con mayor puntuación
4. Si la carpeta no existe o no tiene archivos aptos coincidentes, informa al usuario:
   ```
   No se encontraron archivos de sesión en ~/.claude/session-data/
   Ejecuta /save-session al final de una sesión para crear uno.
   ```
   Luego detén la ejecución.

Si se proporciona un argumento:

- Si parece una fecha (`AAAA-MM-DD`), busca primero en `~/.claude/session-data/`, y luego en el directorio heredado
  `~/.claude/sessions/`, archivos que coincidan con `AAAA-MM-DD-session.tmp` (formato heredado) o
  `AAAA-MM-DD-<shortid>-session.tmp` (formato actual), aplica la clasificación de candidatos entre
  todas las coincidencias y carga el candidato mejor clasificado para esa fecha
- Si parece una ruta de archivo, lee exactamente ese archivo directamente. No apliques clasificación ni
  sustituyas por otro archivo, incluso si el solicitado está vacío o existe otro más reciente
- Si no se encuentra, infórmalo claramente y detén la ejecución

#### Clasificación de candidatos para búsquedas implícitas o por fecha

Clasifica únicamente los candidatos descubiertos automáticamente. Nunca uses esta clasificación para una ruta de archivo explícita.

1. Descarta archivos que sean ilegibles, vacíos, solo de espacios en blanco o que solo contengan encabezados, metadatos,
   separadores y valores de marcador de posición como `[Session context goes here]`, `- [ ]`, un simple `-` o `[relevant files]`.
2. Descarta resúmenes generados con una sola tarea y sin contenido poblado en archivos modificados, herramientas usadas,
   completadas, en progreso, notas o rutas de contexto a cargar. Esta regla estructural filtra
   ecos de sintetizadores de un solo mensaje sin depender de textos específicos de prompt.
3. Conserva candidatos con contenido sustancial poblado: trabajo completado, trabajo en progreso, notas concretas
   para la siguiente sesión, rutas concretas de contexto, múltiples tareas, archivos modificados o herramientas utilizadas.
4. Entre los candidatos sustanciales elegibles, prefiere la fecha de modificación más reciente.
5. Si las fechas de modificación son iguales, prefiere más secciones pobladas, luego más contenido sin marcadores
   de posición, luego mayor tamaño en bytes y finalmente la ruta resuelta lexicográficamente menor. Cuenta secciones
   y contenido poblado solo tras retirar encabezados, metadatos, separadores y texto de relleno.
   Estos desempates finales hacen que la selección sea determinista.

### Paso 2: Leer el archivo de sesión completo

Lee el archivo en su totalidad. No lo resumas todavía.

### Paso 3: Confirmar comprensión

Responde con un informe estructurado exactamente en este formato:

```
SESIÓN CARGADA: [ruta real resuelta al archivo]
════════════════════════════════════════════════

PROYECTO: [nombre del proyecto / tema del archivo]

QUÉ ESTAMOS CONSTRUYENDO:
[resumen de 2-3 oraciones en tus propias palabras]

ESTADO ACTUAL:
PASS: Funcionando: [cantidad] elementos confirmados
 En Progreso: [listar archivos que están en progreso]
 No Iniciado: [listar planificados pero aún sin tocar]

QUÉ NO VOLVER A INTENTAR:
[listar cada enfoque fallido con su motivo — esto es crítico]

PREGUNTAS ABIERTAS / BLOQUEADORES:
[listar bloqueadores o preguntas sin responder]

SIGUIENTE PASO:
[siguiente paso exacto si está definido en el archivo]
[si no está definido: "No se definió siguiente paso — se recomienda revisar 'Qué NO se ha intentado aún' juntos antes de comenzar"]

════════════════════════════════════════════════
Listo para continuar. ¿Qué te gustaría hacer?
```

### Paso 4: Esperar al usuario

NO comiences a trabajar automáticamente. NO toques ningún archivo. Espera a que el usuario indique qué hacer a continuación.

Si el siguiente paso está claramente definido en el archivo de sesión y el usuario dice "continuar", "sí" o similar — procede con ese paso exacto.

Si no hay siguiente paso definido — pregunta al usuario por dónde empezar y opcionalmente sugiere un enfoque de la sección "Qué NO se ha intentado aún".

---

## Casos Límite

**Múltiples sesiones para la misma fecha** (`2024-01-15-session.tmp`, `2024-01-15-abc123de-session.tmp`):
Aplica la clasificación de candidatos entre cada archivo coincidente heredado y de formato actual. Una sesión sustancial
debe prevalecer sobre un marcador de posición más reciente o un eco de un mensaje; la fecha de modificación decide entre candidatos elegibles.

**El archivo de sesión referencia archivos que ya no existen:**
Indícalo durante el informe — "ADVERTENCIA: `path/to/file.ts` está referenciado en la sesión pero no fue encontrado en el disco."

**El archivo de sesión tiene más de 7 días:**
Señala la brecha — "ADVERTENCIA: Esta sesión es de hace N días (umbral: 7 días). Las cosas pueden haber cambiado." — luego continúa normalmente.

**El usuario proporciona directamente una ruta de archivo (ej. enviada por un compañero):**
Léela y sigue el mismo proceso de informe — el formato es el mismo independientemente del origen.

**El archivo de sesión está vacío o malformado:**
Para descubrimiento implícito o por fecha, descártalo y continúa clasificando el resto de candidatos. Si no queda
ningún candidato admisible, informa: "Se encontraron archivos de sesión pero parecen vacíos o ilegibles. Es posible
que debas crear uno nuevo con /save-session." Para una ruta explícita, informa que el archivo solicitado está
vacío o es ilegible sin cargar ningún sustituto.

---

## Ejemplo de Salida

```
SESIÓN CARGADA: /Users/you/.claude/session-data/2024-01-15-abc123de-session.tmp
════════════════════════════════════════════════

PROYECTO: my-app — Autenticación JWT

QUÉ ESTAMOS CONSTRUYENDO:
Autenticación de usuarios con tokens JWT almacenados en cookies httpOnly.
Los endpoints de registro e inicio de sesión están parcialmente listos. La protección de rutas
mediante middleware aún no ha comenzado.

ESTADO ACTUAL:
PASS: Funcionando: 3 elementos (endpoint de registro, generación de JWT, hash de contraseñas)
 En Progreso: app/api/auth/login/route.ts (el token funciona, la cookie aún no se establece)
 No Iniciado: middleware.ts, app/login/page.tsx

QUÉ NO VOLVER A INTENTAR:
FAIL: Next-Auth — genera conflicto con el adaptador personalizado de Prisma, arrojó error de adaptador en cada solicitud
FAIL: localStorage para JWT — produce discordancia en la hidratación de SSR, incompatible con Next.js

PREGUNTAS ABIERTAS / BLOQUEADORES:
- ¿Funciona cookies().set() dentro de un Route Handler o únicamente en Server Actions?

SIGUIENTE PASO:
En app/api/auth/login/route.ts — establecer el JWT como una cookie httpOnly usando
cookies().set('token', jwt, { httpOnly: true, secure: true, sameSite: 'strict' })
y luego probar con Postman para verificar el encabezado Set-Cookie en la respuesta.

════════════════════════════════════════════════
Listo para continuar. ¿Qué te gustaría hacer?
```

---

## Notas

- Nunca modifiques el archivo de sesión al cargarlo — es un registro histórico de solo lectura
- El formato del informe es fijo — no omitas secciones incluso si están vacías
- "Qué no volver a intentar" debe mostrarse siempre, incluso si solo dice "Ninguno" — es demasiado importante para ignorarlo
- Tras reanudar, el usuario puede querer ejecutar `/save-session` nuevamente al final de la nueva sesión para crear un nuevo archivo fechado
