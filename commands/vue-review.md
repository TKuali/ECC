---
description: Revisión exhaustiva de código Vue.js para comprobar la corrección de Composition API, reactividad, patrones de composables, seguridad en plantillas, accesibilidad y rendimiento específico de Vue. Invoca al agente vue-reviewer (y a typescript-reviewer conjuntamente en cambios .vue/.ts).
---

# Revisión de Código Vue

Este comando invoca al agente **vue-reviewer** para una revisión de código especializada en Vue. Para pull requests que modifiquen archivos `.vue` o archivos `.ts`/`.js` vinculados a Vue, deben ejecutarse tanto `vue-reviewer` como `typescript-reviewer` — cada uno posee un ámbito de responsabilidad diferenciado.

## Qué hace este comando

1. **Identificar Cambios en Vue**: Encuentra archivos `.vue` modificados y archivos `.ts`/`.js` relacionados mediante `git diff`
2. **Ejecutar Lint**: Ejecuta `eslint` con `eslint-plugin-vue`
3. **Comprobar Tipos**: Ejecuta `vue-tsc --noEmit` o el comando canónico de comprobación de tipos del proyecto
4. **Revisar Ámbitos Específicos de Vue**: Reactividad, composables, seguridad en plantillas, accesibilidad y rendimiento específico de Vue
5. **Generar Reporte**: Categoriza los problemas por severidad (CRITICAL / HIGH / MEDIUM)

## Cuándo usarlo

Usa `/vue-review` cuando:

- Un PR o commit toque archivos `.vue`
- Después de escribir o modificar componentes Vue, composables o almacenes (stores) de Pinia
- Antes de fusionar código Vue
- Al auditar la seguridad en plantillas (`v-html`, enlaces de URL)
- Al revisar un composable nuevo en cuanto a su corrección
- Al auditar guardas y navegación de Vue Router
- Al revisar rutas de servidor Nuxt o código específico de SSR

Para cambios puros en `.ts`/`.js` sin imports de Vue, usa `/code-review` (general) o invoca a `typescript-reviewer` directamente.

## Alcance frente a `/code-review` y Revisión de TypeScript

| Herramienta | Alcance |
|---|---|
| `vue-reviewer` (este comando) | Reactividad, composables, seguridad en plantillas, a11y, rendimiento en Vue, Pinia/Router |
| `typescript-reviewer` | TS/JS genérico — abuso de `any`, corrección asíncrona, seguridad en Node |
| `security-reviewer` | Auditoría de seguridad a nivel de todo el proyecto |
| `/code-review` | Revisión genérica de cambios sin confirmar o de PRs |

En un PR con archivos `.vue` o código relacionado con Vue, invoca tanto a `vue-reviewer` como a `typescript-reviewer`. Los hallazgos de cada uno no se solapan por diseño.

## Categorías de Revisión

### CRÍTICO (Debe Corregirse)

- `v-html` con entradas sin sanitizar
- `:href`/`:src` con URLs de usuario no validadas (`javascript:`, `data:`)
- Secretos expuestos en el bundle cliente (`VITE_*`, `public` runtimeConfig en Nuxt)
- Endpoint del servidor sin validación de entradas (Nuxt Nitro)
- `localStorage`/`sessionStorage` para tokens de sesión
- Desestructuración de props reactivas en Vue < 3.5 (rompe la reactividad)
- Reemplazo completo de objetos con `reactive()` (rompe los watchers)
- Fuente de watcher que rastrea un objeto ref en lugar de `.value`

### ALTO (Debería Corregirse)

- Composable con efectos secundarios a nivel de módulo
- Falta de limpieza en composables (watchers, intervalos, escuchadores de eventos)
- `v-for` sin `:key` o con `key={index}`
- `v-if` + `v-for` en el mismo elemento
- Mutación directa de props
- Falta de validación en props
- Guarda de ruta que retorna false sin redirección
- `useRoute().params` desestructurado en nivel superior (crea una captura estática)
- `v-model` vinculado a una propiedad computada sin setter
- Violaciones de accesibilidad (etiquetas faltantes, elementos interactivos no semánticos)
- Mutación directa de propiedades de la store fuera de actions

### MEDIO (A Considerar)

- Uso de Options API en código nuevo de Vue 3
- Componentes de más de 300 líneas
- `v-show` donde `v-if` sea más apropiado (o viceversa)
- Falta de `:max` en `<KeepAlive>`
- Falta de `shallowRef` para grandes volúmenes de datos reemplazados
- Validación personalizada en lugar de una librería de formularios probada
- `defineExpose` exponiendo más elementos de los necesarios
- `inheritAttrs` no deshabilitado cuando se usa `v-bind="$attrs"`

## Comprobaciones Automatizadas Ejecutadas

```bash
# Lint (requerido)
npx eslint . --ext .vue,.ts,.js

# Comprobación de tipos específica de Vue
vue-tsc --noEmit

# Reglas de seguridad específicas
npx eslint . --rule 'vue/no-v-html: warn' \
              --rule 'vue/no-template-target-blank: error'

# Seguridad de dependencias
npm audit
```

Si `eslint-plugin-vue` o `vue-tsc` no están configurados, la revisión señalará la carencia como un problema de configuración HIGH y continuará.

## Ejemplo de Uso

````text
Usuario: /vue-review

Agente:
# Reporte de Revisión de Código Vue

## Archivos Revisados
- src/components/UserCard.vue (modificado)
- src/composables/useUser.ts (nuevo)
- src/stores/useUserStore.ts (modificado)

## Resultados de Lint
PASS: eslint limpio
PASS: vue-tsc limpio

## Problemas Encontrados

[CRITICAL] v-html sin sanitizar
Archivo: src/components/UserCard.vue:15
Problema: Biografía controlada por el usuario renderizada como HTML crudo mediante v-html.
Motivo: Riesgo de XSS mediante etiquetas script en la entrada del usuario.
Solución: Sanitizar con DOMPurify o renderizar como texto:
```vue
<script setup>
import DOMPurify from "dompurify";
const safeBio = computed(() => DOMPurify.sanitize(user.bio));
</script>
<template>
  <div v-html="safeBio" />
</template>
```

[HIGH] Watcher en composable sin función de limpieza
Archivo: src/composables/useUser.ts:22
Problema: La llamada a `watch` dispara un fetch sin AbortController; respuestas obsoletas pueden sobrescribir datos nuevos.
Solución: Usar onCleanup para abortar:
```ts
watch(userId, async (newId, _old, onCleanup) => {
  const controller = new AbortController();
  onCleanup(() => controller.abort());
  const data = await fetch(`/api/users/${newId}`, { signal: controller.signal });
  user.value = await data.json();
});
```

## Resumen
- CRITICAL: 1
- HIGH: 1
- MEDIUM: 0

Recomendación: FAIL: Bloquear fusión hasta corregir el problema CRITICAL
````

## Criterios de Aprobación

| Estado | Condición |
|---|---|
| PASS: Aprobar | Sin problemas CRITICAL o HIGH |
| WARNING: Advertencia | Solo problemas MEDIUM (fusionar con precaución) |
| FAIL: Bloquear | Problemas CRITICAL o HIGH encontrados |

## Integración con Otros Comandos

- Ejecuta primero el comando de compilación de tu proyecto si la compilación falla
- Ejecuta pruebas para asegurar que las pruebas de componentes pasen
- Ejecuta `/vue-review` antes de fusionar código Vue
- Usa `/code-review` para aspectos generales no específicos de Vue en el mismo PR

## Relacionado

- Agente: `agents/vue-reviewer.md`
- Agente complementario: `agents/typescript-reviewer.md` (ejecutar conjuntamente para TS/JS vinculado a Vue)
- Skills: `skills/vue-patterns/`
- Reglas: `rules/vue/`
