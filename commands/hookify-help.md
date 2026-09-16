---
description: Obtiene ayuda sobre el sistema hookify
---

# Ayuda de Hookify

Muestra la documentación completa de hookify.

## Descripción General del Sistema de Hooks

Hookify crea archivos de reglas que se integran con el sistema de hooks de Claude Code para prevenir comportamientos no deseados.

### Tipos de Eventos

- `bash`: se activa con el uso de la herramienta Bash y evalúa patrones en los comandos
- `file`: se activa con el uso de las herramientas Write/Edit y evalúa rutas de archivo
- `stop`: se activa cuando finaliza una sesión
- `prompt`: se activa al enviar mensajes de usuario y evalúa patrones en las entradas
- `all`: se activa en todos los eventos

### Formato de Archivo de Regla

Los archivos se almacenan como `.claude/hookify.{name}.local.md`:

```yaml
---
name: nombre-descriptivo
enabled: true
event: bash|file|stop|prompt|all
action: block|warn
pattern: "patron regex a coincidir"
---
Mensaje a mostrar cuando la regla se active.
Admite múltiples líneas.
```

### Comandos

- `/hookify [descripcion]` crea nuevas reglas y autoanaliza la conversación si no se proporciona descripción
- `/hookify-list` lista las reglas configuradas
- `/hookify-configure` activa o desactiva reglas

### Consejos para Patrones

- utilizar sintaxis regex
- para `bash`, evaluar contra la cadena completa del comando
- para `file`, evaluar contra la ruta del archivo
- probar los patrones antes del despliegue
