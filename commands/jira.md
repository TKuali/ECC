---
description: Obtiene un ticket de Jira, analiza requisitos, actualiza estado o añade comentarios. Utiliza la habilidad jira-integration y MCP o API REST.
---

# Comando Jira

Interactúa con tickets de Jira directamente desde tu flujo de trabajo — consulta tickets, analiza requisitos, añade comentarios y cambia el estado.

## Uso

```
/jira get <CLAVE-TICKET>          # Obtener y analizar un ticket
/jira comment <CLAVE-TICKET>      # Añadir un comentario de progreso
/jira transition <CLAVE-TICKET>   # Cambiar el estado del ticket
/jira search <JQL>                # Buscar incidencias con JQL
```

## Qué Hace Este Comando

1. **Obtener y Analizar** — Consulta un ticket de Jira y extrae requisitos, criterios de aceptación, escenarios de prueba y dependencias
2. **Comentar** — Añade actualizaciones estructuradas de progreso a un ticket
3. **Transición** — Mueve un ticket a través de los estados del flujo de trabajo (Por hacer → En progreso → Listo)
4. **Buscar** — Encuentra incidencias utilizando consultas JQL

## Cómo Funciona

### `/jira get <CLAVE-TICKET>`

1. Consultar el ticket desde Jira (mediante MCP `jira_get_issue` o API REST)
2. Extraer todos los campos: resumen, descripción, criterios de aceptación, prioridad, etiquetas, incidencias vinculadas
3. Opcionalmente consultar comentarios para contexto adicional
4. Producir un análisis estructurado:

```
Ticket: PROJ-1234
Resumen: [título]
Estado: [estado]
Prioridad: [prioridad]
Tipo: [Historia/Error/Tarea]

Requisitos:
1. [requisito extraído]
2. [requisito extraído]

Criterios de Aceptación:
- [ ] [criterio del ticket]

Escenarios de Prueba:
- Ruta Feliz: [descripción]
- Caso de Error: [descripción]
- Caso Límite: [descripción]

Dependencias:
- [incidencias vinculadas, APIs, servicios]

Próximos Pasos Recomendados:
- /plan para crear el plan de implementación
- habilidad `tdd-workflow` para implementar con pruebas primero
```

### `/jira comment <CLAVE-TICKET>`

1. Resumir el progreso de la sesión actual (lo construido, probado, confirmado)
2. Formatear como un comentario estructurado
3. Publicar en el ticket de Jira

### `/jira transition <CLAVE-TICKET>`

1. Consultar las transiciones disponibles para el ticket
2. Mostrar opciones al usuario
3. Ejecutar la transición seleccionada

### `/jira search <JQL>`

1. Ejecutar la consulta JQL contra Jira
2. Devolver una tabla resumen de incidencias coincidentes

## Prerrequisitos

Este comando requiere credenciales de Jira. Elige una opción:

**Opción A — Servidor MCP (recomendado):**
Añade `jira` a tu configuración de `mcpServers` (ver `mcp-configs/mcp-servers.json` para la plantilla).

**Opción B — Variables de entorno:**
```bash
export JIRA_URL="https://tuorganizacion.atlassian.net"
export JIRA_EMAIL="tu.email@ejemplo.com"
export JIRA_API_TOKEN="tu-api-token"
```

Si faltan credenciales, detenerse e indicar al usuario cómo configurarlas.

## Integración con Otros Comandos

Tras analizar un ticket:
- Usa `/plan` para crear un plan de implementación a partir de los requisitos
- Usa la habilidad `tdd-workflow` para implementar mediante desarrollo guiado por pruebas
- Usa `/code-review` tras la implementación
- Usa `/jira comment` para publicar el progreso de vuelta en el ticket
- Usa `/jira transition` para mover el ticket al finalizar el trabajo

## Relacionado

- **Habilidad:** `skills/jira-integration/`
- **Configuración MCP:** `mcp-configs/mcp-servers.json` → `jira`
