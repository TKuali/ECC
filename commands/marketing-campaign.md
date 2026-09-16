---
description: Planifica y ejecuta una campaña completa de marketing. Acepta un brief de producto y devuelve posicionamiento, texto para landing page, secuencia de emails, posts para redes, variantes de anuncios, guiones de video y un calendario de contenidos. También puede auditar textos existentes para evaluar su conversión.
allowed-tools: ["Read", "Grep", "Glob", "WebSearch", "WebFetch", "Write"]
---

# /marketing-campaign

Planifica y ejecuta una campaña de marketing desde el brief inicial hasta el conjunto completo de contenidos.

## Uso

```
/marketing-campaign                          # Solicitar el brief interactivamente
/marketing-campaign [brief de producto]       # Campaña completa desde brief en línea
/marketing-campaign copy [tipo]              # Entregable individual únicamente
/marketing-campaign review [archivo-o-brief] # Auditoría de textos para conversión y consistencia de marca
```

## Qué Hace

1. **Investigación** — Perfila al público objetivo y mapea competidores antes de escribir nada
2. **Posicionamiento** — Fija el ángulo de la campaña y el perfil de tono primero
3. **Producción de Textos** — Genera todo el conjunto de contenido en el orden correcto (landing page → emails → redes → anuncios → guiones de video → calendario)
4. **Revisión** — Pasa toda la salida por una lista de verificación de conversión y consistencia de marca

## Modos

### Modo Campaña Completa

Proporciona un brief de producto que contenga:
- Nombre y descripción del producto
- Público objetivo (específico, no genérico)
- Problema central que resuelve el producto
- Beneficio principal / resultado
- Pautas de tono
- Canales requeridos
- Meta de lanzamiento o cronograma

El agente devuelve todos los entregables de la campaña en orden, con un resumen de revisión de copy al final.

### Modo Entregable Individual

```
/marketing-campaign copy landing-page
/marketing-campaign copy email-sequence
/marketing-campaign copy social-posts
/marketing-campaign copy ads
/marketing-campaign copy video-scripts
```

Requiere que el posicionamiento esté definido previamente. Ejecuta el modo completo o proporciona el ángulo antes de solicitar un entregable individual.

### Modo Revisión de Copy

```
/marketing-campaign review ruta/a/copy.md
/marketing-campaign review "pega el texto aqui"
```

Devuelve una auditoría estructurada evaluando:
- Prueba de claridad de 5 segundos (contenido sobre el pliegue / above-the-fold)
- Calidad de los llamados a la acción (CTA) (específicos, ganados, uno por pieza)
- Consistencia del tono de marca
- Especificidad y respaldo de las afirmaciones
- Adecuación nativa a la plataforma
- Consistencia multicanal

### Plantilla de Brief

```markdown
Producto: [nombre]
Descripción: [1-3 oraciones sobre lo que hace]
Audiencia: [quién, específicamente]
Problema: [el dolor específico que resuelve el producto]
Beneficio: [el resultado que obtiene el usuario]
Tono: [adjetivos + qué evitar]
Canales: [landing page, email, LinkedIn, X, anuncios, video]
Meta: [lanzamiento, lista de espera, registros, visibilidad — y cronograma]
```

### Ubicación de Salida

Al guardar los activos de la campaña, la convención es `.claude/campaigns/{campaign-name}/`:

```
.claude/campaigns/product-launch/
├── positioning.md
├── landing-page.md
├── email-sequence.md
├── social-posts.md
├── ad-copy.md
├── video-scripts.md
└── content-calendar.md
```

Confirmar la ubicación de guardado antes de escribir archivos.

### Ejemplos

```
/marketing-campaign Construye una campaña de lanzamiento de 7 días para una plataforma de carreras con IA para estudiantes universitarios del Reino Unido.
```

```
/marketing-campaign copy landing-page
```

```
/marketing-campaign review .claude/campaigns/the-key/landing-page.md
```

## Delegación de Agentes

Este comando invoca:
- `marketing-agent` — planificación de campañas y producción de textos
- `brand-voice` — captura de voz cuando se necesita fijar el tono en múltiples salidas
- `content-engine` — producción de contenido social nativo para cada plataforma
- `crosspost` — distribución multiplataforma
- `market-research` — inteligencia competitiva o de audiencia profunda

## Comandos Relacionados

- `/plan` — Planificación estratégica antes de una campaña
- `/plan-prd` — Documento de requisitos de producto antes de armar el brief
- `/code-review` — Revisar el código tras la implementación de una landing page

---

*Parte de [Everything Claude Code](https://github.com/affaan-m/everything-claude-code)*
