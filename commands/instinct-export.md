---
name: instinct-export
description: Exporta instintos del ámbito de proyecto/global a un archivo
command: /instinct-export
---

# Comando Instinct Export

Exporta instintos a un formato compartible. Ideal para:
- Compartir con compañeros de equipo
- Transferir a una nueva máquina
- Contribuir a las convenciones del proyecto

## Uso

```
/instinct-export                           # Exportar todos los instintos personales
/instinct-export --domain testing          # Exportar solo instintos de testing
/instinct-export --min-confidence 0.7      # Exportar solo instintos de alta confianza
/instinct-export --output team-instincts.yaml
/instinct-export --scope project --output project-instincts.yaml
```

## Qué Hacer

1. Detectar el contexto del proyecto actual
2. Cargar instintos según el ámbito seleccionado:
   - `project`: solo el proyecto actual
   - `global`: solo global
   - `all`: proyecto + global combinados (por defecto)
3. Aplicar filtros (`--domain`, `--min-confidence`)
4. Escribir la exportación en formato YAML en un archivo (o en stdout si no se proporciona ruta de salida)

## Formato de Salida

Crea un archivo YAML:

```yaml
# Exportación de Instintos
# Generado: 2025-01-22
# Origen: personal
# Total: 12 instintos

---
id: prefer-functional-style
trigger: "when writing new functions"
confidence: 0.8
domain: code-style
source: session-observation
scope: project
project_id: a1b2c3d4e5f6
project_name: my-app
---

# Preferir Estilo Funcional

## Acción
Usar patrones funcionales por encima de clases.
```

## Banderas (Flags)

- `--domain <nombre>`: Exportar únicamente el dominio especificado
- `--min-confidence <n>`: Umbral mínimo de confianza
- `--output <archivo>`: Ruta del archivo de salida (imprime en stdout si se omite)
- `--scope <project|global|all>`: Ámbito de exportación (por defecto: `all`)
