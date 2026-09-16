---
description: Inicia un patrón de bucle autónomo gestionado con valores de seguridad por defecto y condiciones de parada explícitas.
---

# Comando Loop Start

Inicia un patrón de bucle autónomo gestionado con valores de seguridad predeterminados.

## Uso

`/loop-start [pattern] [--mode safe|fast]`

- `pattern`: `sequential`, `continuous-pr`, `rfc-dag`, `infinite`
- `--mode`:
  - `safe` (por defecto): barreras de calidad estrictas y puntos de control (checkpoints)
  - `fast`: barreras reducidas para mayor velocidad

## Flujo

1. Confirmar el estado del repositorio y la estrategia de ramas.
2. Seleccionar el patrón de bucle y la estrategia de niveles de modelo.
3. Habilitar los hooks/perfiles requeridos para el modo elegido.
4. Crear el plan del bucle y escribir el runbook en `.claude/plans/`.
5. Mostrar los comandos para iniciar y supervisar el bucle.

## Comprobaciones de Seguridad Obligatorias

- Verificar que las pruebas pasen antes de la primera iteración del bucle.
- Asegurar que `ECC_HOOK_PROFILE` no esté deshabilitado globalmente.
- Asegurar que el bucle tenga una condición de parada explícita.

## Argumentos

$ARGUMENTS:
- `<pattern>` opcional (`sequential|continuous-pr|rfc-dag|infinite`)
- `--mode safe|fast` opcional
