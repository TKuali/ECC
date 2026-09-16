---
description: Crea, verifica o lista puntos de control (checkpoints) del flujo de trabajo tras ejecutar comprobaciones de verificación.
---

# Comando Checkpoint

Crea o verifica un punto de control en tu flujo de trabajo.

## Uso

`/checkpoint [create|verify|list] [nombre]`

## Crear Punto de Control (Create Checkpoint)

Al crear un punto de control:

1. Ejecuta `/verify quick` para asegurar que el estado actual esté limpio
2. Crea un stash de git o commit con el nombre del punto de control
3. Registra el punto de control en `.claude/checkpoints.log`:

```bash
echo "$(date +%Y-%m-%d-%H:%M) | $CHECKPOINT_NAME | $(git rev-parse --short HEAD)" >> .claude/checkpoints.log
```

4. Informa que el punto de control fue creado

## Verificar Punto de Control (Verify Checkpoint)

Al verificar frente a un punto de control:

1. Lee el punto de control desde el registro
2. Compara el estado actual con el punto de control:
   - Archivos añadidos desde el punto de control
   - Archivos modificados desde el punto de control
   - Tasa de aprobación de pruebas ahora vs antes
   - Cobertura ahora vs antes

3. Reporta:
```
COMPARACIÓN CON PUNTO DE CONTROL: $NAME
=======================================
Archivos modificados: X
Pruebas: +Y aprobadas / -Z fallidas
Cobertura: +X% / -Y%
Compilación: [PASS/FAIL]
```

## Listar Puntos de Control (List Checkpoints)

Muestra todos los puntos de control con:
- Nombre
- Marca de tiempo
- SHA de Git
- Estado (actual, por detrás, por delante)

## Flujo de Trabajo

Flujo típico de puntos de control:

```
[Inicio] --> /checkpoint create "inicio-caracteristica"
   |
[Implementar] --> /checkpoint create "nucleo-completado"
   |
[Probar] --> /checkpoint verify "nucleo-completado"
   |
[Refactorizar] --> /checkpoint create "refactor-completado"
   |
[PR] --> /checkpoint verify "inicio-caracteristica"
```

## Argumentos

$ARGUMENTS:
- `create <nombre>` - Crea un punto de control con nombre
- `verify <nombre>` - Verifica frente a un punto de control nombrado
- `list` - Muestra todos los puntos de control
- `clear` - Elimina puntos de control antiguos (mantiene los últimos 5)
