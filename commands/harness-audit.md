---
description: Ejecuta una auditoría determinista del entorno del repositorio y devuelve una tarjeta de puntuación priorizada.
---

# Comando Harness Audit

Ejecuta una auditoría determinista del entorno (harness) del repositorio y devuelve una tarjeta de puntuación priorizada.

## Uso

`/harness-audit [alcance] [--format text|json] [--root ruta]`

- `alcance` (opcional): `repo` (por defecto), `hooks`, `skills`, `commands`, `agents`
- `--format`: estilo de salida (`text` por defecto, `json` para automatización)
- `--root`: audita una ruta específica en lugar del directorio de trabajo actual

## Motor Determinista

Ejecutar siempre:

```bash
node scripts/harness-audit.js <scope> --format <text|json> [--root <path>]
```

Este script es la fuente fidedigna para puntuaciones y comprobaciones. No inventar dimensiones adicionales ni puntos improvisados.

Versión de la rúbrica: `2026-05-19`.

El script calcula hasta 12 categorías fijas (normalizadas de `0-10` cada una). Las primeras siete siempre aplican; Integración con GitHub siempre aplica; las categorías de destino de despliegue aplican únicamente cuando se detecta el marcador correspondiente.

1. Cobertura de Herramientas (Tool Coverage)
2. Eficiencia de Contexto (Context Efficiency)
3. Barreras de Calidad (Quality Gates)
4. Persistencia de Memoria (Memory Persistence)
5. Cobertura de Evaluación (Eval Coverage)
6. Salvaguardas de Seguridad (Security Guardrails)
7. Eficiencia de Costos (Cost Efficiency)
8. Integración con GitHub (GitHub Integration)
9. Integración con Vercel *(cuando `vercel.json` o `.vercel/` están presentes)*
10. Integración con Netlify *(cuando `netlify.toml` o `.netlify/` están presentes)*
11. Integración con Cloudflare *(cuando `wrangler.toml` o `wrangler.jsonc` están presentes)*
12. Integración con Fly *(cuando `fly.toml` está presente)*

Las puntuaciones se derivan de comprobaciones explícitas de archivos/reglas y son reproducibles para el mismo commit.
El script audita el directorio de trabajo actual por defecto y detecta automáticamente si el objetivo es el propio repositorio de ECC o un proyecto consumidor que utiliza ECC.

## Contrato de Salida

Retornar:

1. `overall_score` sobre `max_score`. `max_score` depende de qué categorías son aplicables al objetivo; nunca asumir un total fijo.
2. `applicable_categories[]` y `category_count` describiendo qué categorías contribuyeron.
3. Puntuaciones por categoría y hallazgos concretos.
4. Comprobaciones fallidas con rutas de archivo exactas.
5. Las 3 acciones principales de la salida determinista (`top_actions`).
6. Habilidades de ECC sugeridas para aplicar a continuación.

## Lista de Verificación

- Usar la salida del script directamente; no volver a puntuar manualmente.
- Si se solicita `--format json`, devolver el JSON del script sin modificaciones.
- Si se solicita texto, resumir las comprobaciones fallidas y las acciones principales.
- Incluir rutas de archivo exactas desde `checks[]` y `top_actions[]`.

## Ejemplo de Resultado

```text
Harness Audit (repo, repo): 71/80
- Tool Coverage: 10/10 (10/10 pts)
- Context Efficiency: 9/10 (9/10 pts)
- Quality Gates: 10/10 (10/10 pts)
- GitHub Integration: 2/10 (2/10 pts)

Top 3 Actions:
1) [GitHub Integration] Añadir al menos un workflow en .github/workflows/. (.github/workflows/)
2) [Security Guardrails] Añadir controles de seguridad previos para prompts/herramientas en hooks/hooks.json. (hooks/hooks.json)
3) [Eval Coverage] Aumentar la cobertura de pruebas automatizadas en scripts/hooks/lib. (tests/)
```

## Argumentos

$ARGUMENTS:
- `repo|hooks|skills|commands|agents` (alcance opcional)
- `--format text|json` (formato de salida opcional)
