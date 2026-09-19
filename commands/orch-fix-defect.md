---
description: Orquesta la corrección de un error — reproduce el fallo como una prueba de regresión fallida, corrige hasta que pase a verde, revisa y realiza un commit controlado. Envoltorio para la skill orch-fix-defect.
---

# /orch-fix-defect

Inicia manualmente el orquestador **orch-fix-defect**: demuestra el error con una prueba en rojo, y luego corrige hasta que esté en verde.

## Uso

```
/orch-fix-defect <qué está roto>
```

Ejemplos:

```
/orch-fix-defect el poller se cae ante una respuesta vacía de NWS
/orch-fix-defect el inicio de sesión devuelve 500 cuando el correo contiene un signo más
```

## Qué hace este comando

Invoca la skill `orch-fix-defect` pasando `$ARGUMENTS` como la solicitud. La skill
(a través del motor compartido `orch-pipeline`):

1. Clasificará el tamaño (base predeterminada: pequeño, a menudo trivial); delimitará la causa raíz con `code-explorer` si no queda clara.
2. **Escribirá una nueva prueba de regresión fallida** que reproduzca el error, y luego corregirá el código hasta que pase a verde. (Demostrar el error primero es lo que convierte esto en una corrección real y no en un ajuste casual).
3. Invocará a `code-reviewer` (+ `security-reviewer` si el defecto se encuentra en una ruta sensible).
4. Realizará el commit en formato convencional `fix:`. → **CONTROL 2 (GATE 2)** (confirmar antes del commit).

Usa este comando únicamente cuando un comportamiento esté **roto/incorrecto** — no para cambios intencionados
de comportamiento (`/orch-change-feature`) ni para nuevas capacidades (`/orch-add-feature`).

Si `$ARGUMENTS` está vacío, solicita al usuario que describa el defecto.
