---
description: Revisión exhaustiva de código React/JSX para corrección de hooks, rendimiento de renderizado, límites de componentes servidor/cliente, accesibilidad y seguridad específica de React. Invoca al agente react-reviewer (y a typescript-reviewer de forma conjunta en cambios TSX/JSX).
---

# Revisión de Código React

Este comando invoca al agente **react-reviewer** para una revisión de código especializada en React. Para pull requests que modifiquen archivos `.tsx`/`.jsx`, deben ejecutarse tanto `react-reviewer` como `typescript-reviewer` — cada uno posee un ámbito de responsabilidad diferenciado.

## Qué hace este comando

1. **Identificar Cambios en React**: Encuentra archivos modificados `.tsx`/`.jsx` (y archivos `.ts`/`.js` que contengan React) mediante `git diff`
2. **Ejecutar Lint**: Ejecuta `eslint` con `eslint-plugin-react-hooks` y `eslint-plugin-jsx-a11y`
3. **Comprobar Tipos**: Ejecuta `tsc --noEmit` o el comando canónico de verificación de tipos del proyecto
4. **Revisar Ámbitos Específicos de React**: Reglas de hooks, límites de RSC, accesibilidad, rendimiento de renderizado y seguridad específica de React
5. **Generar Reporte**: Categoriza los problemas por severidad (CRITICAL / HIGH / MEDIUM)

## Cuándo usarlo

Usa `/react-review` cuando:

- Un PR o commit toque archivos `.tsx`/`.jsx`
- Después de escribir o modificar componentes React, hooks personalizados o páginas
- Antes de fusionar código React
- Al auditar accesibilidad en componentes de interfaz de usuario
- Al revisar un hook nuevo en cuanto a las reglas de hooks y dependencias correctas
- Al auditar los límites entre componentes de servidor y cliente en Next.js App Router

Para cambios puros en `.ts`/`.js` sin imports de React, usa `/code-review` (general) o invoca a `typescript-reviewer` directamente.

## Alcance frente a `/code-review` y Revisión de TypeScript

| Herramienta | Alcance |
|---|---|
| `react-reviewer` (este comando) | Reglas de hooks, JSX, RSC, a11y, seguridad específica de React, rendimiento de renderizado |
| `typescript-reviewer` | TS/JS genérico — abuso de `any`, corrección asíncrona, seguridad en Node |
| `security-reviewer` | Auditoría de seguridad a nivel de todo el proyecto |
| `/code-review` | Revisión genérica de cambios sin confirmar o de PRs |

En un PR con TSX/JSX, invoca tanto a `react-reviewer` como a `typescript-reviewer`. Los hallazgos de cada uno no se solapan por diseño.

## Categorías de Revisión

### CRÍTICO (Debe Corregirse)

- `dangerouslySetInnerHTML` con entradas sin sanitizar
- `href`/`src` con URLs de usuario no validadas (`javascript:`, `data:`)
- Server Actions sin validación de entradas
- Secretos expuestos en el bundle del cliente (`NEXT_PUBLIC_*`, `VITE_*`, `REACT_APP_*`)
- `localStorage`/`sessionStorage` para tokens de sesión
- Llamadas condicionales a hooks (viola las Reglas de los Hooks)
- Mutación directa del estado
- Hook llamado fuera de un componente o hook personalizado

### ALTO (Debería Corregirse)

- Dependencias faltantes en `useEffect`/`useMemo`/`useCallback` (deshabilitar `exhaustive-deps` sin justificación)
- Efecto utilizado para calcular estado derivado
- Efecto sin función de limpieza (cleanup)
- Cierres obsoletos (stale closures) en manejadores o intervalos
- Importaciones exclusivas de servidor en componentes cliente
- Datos sensibles filtrados a través de props a componentes cliente
- Server Actions sin comprobaciones de autenticación
- Violaciones de accesibilidad (etiquetas faltantes, elementos interactivos no semánticos, mal uso de ARIA)
- `key={index}` en listas dinámicas
- Estado duplicado o cadenas de `useEffect`

### MEDIO (A Considerar)

- Sobre-memorización sin ganancia medida
- Creación de nuevo objeto o función inline como prop para un hijo memorizado
- Suspense únicamente en la raíz de la ruta (sin revelación progresiva)
- Listas largas sin virtualización
- Valores de alta frecuencia leídos mediante `useContext`
- Validación casera en formularios no triviales
- Prop drilling más allá de 3 niveles
- Componentes de más de 200 líneas
- Componentes de clase en código nuevo

## Comprobaciones Automatizadas Ejecutadas

```bash
# Lint (requerido para cualquier revisión significativa)
npx eslint . --ext .tsx,.jsx,.ts,.js

# Comprobación de tipos (se omite limpiamente en proyectos solo JS)
npm run typecheck --if-present
[ -f tsconfig.json ] && tsc --noEmit -p tsconfig.json

# Reglas específicas de a11y
npx eslint . --rule 'jsx-a11y/alt-text: error' \
              --rule 'jsx-a11y/anchor-is-valid: error' \
              --rule 'jsx-a11y/click-events-have-key-events: error'

# Seguridad de dependencias
npm audit
```

Si `eslint-plugin-react-hooks` o `eslint-plugin-jsx-a11y` no están configurados, la revisión marcará la carencia como un problema de configuración HIGH y continuará.

## Ejemplo de Uso

````text
Usuario: /react-review

Agente:
# Reporte de Revisión de Código React

## Archivos Revisados
- src/components/UserCard.tsx (modificado)
- src/hooks/useUser.ts (nuevo)

## Resultados de Lint
PASS: eslint limpio
PASS: comprobación de tipos limpia

## Problemas Encontrados

[CRITICAL] dangerouslySetInnerHTML sin sanitizar
Archivo: src/components/UserCard.tsx:42
Problema: Biografía controlada por el usuario renderizada como HTML crudo.
Motivo: Riesgo de XSS mediante etiquetas script almacenadas en la entrada del usuario.
Solución: Sanitizar con DOMPurify o renderizar como texto plano:
```tsx
import DOMPurify from "isomorphic-dompurify";
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(user.bio) }} />
```

[HIGH] Falta limpieza de efecto
Archivo: src/hooks/useUser.ts:18
Problema: Llamada a `fetch` sin AbortController; riesgo de ejecutar setState en un componente desmontado.
Solución: Añadir AbortController y su limpieza:
```ts
useEffect(() => {
  const ac = new AbortController();
  fetch(`/api/users/${id}`, { signal: ac.signal })
    .then(r => r.json())
    .then(setUser);
  return () => ac.abort();
}, [id]);
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

- Ejecuta `/react-build` primero si la compilación está rota
- Ejecuta `/react-test` para asegurar que las pruebas de componentes pasen
- Ejecuta `/react-review` antes de fusionar
- Usa `/code-review` para aspectos generales no específicos de React en el mismo PR

## Relacionado

- Agente: `agents/react-reviewer.md`
- Agente complementario: `agents/typescript-reviewer.md` (ejecutar conjuntamente en PRs de TSX/JSX)
- Skills: `skills/react-patterns/`, `skills/react-testing/`, `skills/accessibility/`
- Reglas: `rules/react/`
