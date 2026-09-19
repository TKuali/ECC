---
description: Corrige incrementalmente fallas de compilación en React (Vite, webpack, Next.js, CRA, Parcel, esbuild, Bun) — errores de compilación JSX/TSX, discrepancias de hidratación, fallas en límites entre componentes de servidor/cliente y tipos faltantes. Invoca al agente react-build-resolver para correcciones quirúrgicas mínimas.
---

# Compilación y Corrección de React

Este comando invoca al agente **react-build-resolver** para corregir incrementalmente errores de compilación en React con cambios mínimos.

## Qué hace este comando

1. **Detectar el Sistema de Compilación**: Identifica Vite, webpack, Next.js, CRA, Parcel, esbuild o Bun
2. **Ejecutar la Compilación**: Ejecuta el script de compilación del proyecto
3. **Analizar Errores**: Agrupa por capa (TypeScript / configuración de empaquetador / tiempo de ejecución / hidratación)
4. **Corregir Incrementalmente**: Un error a la vez, volviendo a compilar tras cada cambio
5. **Reportar Resumen**: Muestra lo que se corrigió y lo que queda pendiente

## Cuándo usarlo

Usa `/react-build` cuando:

- `npm run build` (o su equivalente con pnpm/yarn/bun) falle
- Errores de compilación JSX/TSX tras una actualización de TypeScript o React
- Errores de discordancia de hidratación en Next.js en tiempo de ejecución
- Errores en los límites de componentes de servidor/cliente en el App Router
- Después de instalar o actualizar `react`, `react-dom`, `@types/react` o un empaquetador
- Tipos faltantes o errores de "module not found" relacionados con React

## Alcance

Este comando se encarga de fallas de **compilación, empaquetado e hidratación en React**. Para errores puros de tipos en TypeScript sin relación con React, usa `/build-fix` (genérico) en su lugar.

## Comandos de Diagnóstico Ejecutados

```bash
# Script de compilación del proyecto (preferido)
npm run build --if-present
pnpm build 2>/dev/null
yarn build 2>/dev/null
bun run build 2>/dev/null

# Comprobación de tipos independiente
npm run typecheck --if-present
tsc --noEmit -p tsconfig.json

# Alternativas específicas del empaquetador
next build                          # Next.js
vite build                          # Vite
react-scripts build                 # CRA
webpack --mode=production           # webpack
parcel build src/index.html         # Parcel
bun build ./src/index.tsx --outdir=dist
```

## Ejemplo de Sesión

````text
Usuario: /react-build

Agente:
# Resolución de Compilación React

## Sistema de Compilación Detectado
Vite (vite.config.ts presente, @vitejs/plugin-react en dependencias)

## Diagnósticos Iniciales

```bash
$ npm run build
> tsc -b && vite build

src/components/UserCard.tsx:1:8 - error TS6133: 'React' is declared but its value is never read.
src/components/Modal.tsx:12:15 - error TS7016: Could not find a declaration file for module 'react-portal'.
src/pages/Home.tsx:42:5 - error: 'useState' is not defined
```

Errores encontrados: 3

## Corrección 1: Resto de la transformación antigua de JSX

Archivo: src/components/UserCard.tsx:1
Causa: `tsconfig.json` ya usa `"jsx": "react-jsx"`; la importación explícita `import React` no se utiliza.

```tsx
// Eliminado
- import React from 'react';
```

```bash
$ npm run build
# 2 errores restantes
```

## Corrección 2: Tipos faltantes

Archivo: src/components/Modal.tsx
Causa: `@types/react-portal` no está instalado.

```bash
$ npm i -D @types/react-portal
added 1 package
```

```bash
$ npm run build
# 1 error restante
```

## Corrección 3: Importación de hook faltante

Archivo: src/pages/Home.tsx
Causa: `useState` se referencia pero no está importado.

```tsx
- import { useEffect } from "react";
+ import { useEffect, useState } from "react";
```

```bash
$ npm run build
# ¡Compilación exitosa!
```

## Verificación Final

```bash
$ npm run build
✓ built in 2.34s

$ npm test
✓ 47 tests passed
```

## Resumen

| Métrica | Cantidad |
|---------|----------|
| Errores de compilación corregidos | 3 |
| Archivos modificados | 2 |
| Dependencias añadidas | 1 (@types/react-portal) |
| Problemas restantes | 0 |

Estado de compilación: PASS: ÉXITO
````

## Errores Comunes Corregidos

| Error | Solución Típica |
|---|---|
| `'React' is not defined` | Configurar `"jsx": "react-jsx"` en tsconfig (React 17+) |
| Falta `@types/react` | `npm i -D @types/react @types/react-dom` |
| `Unexpected token '<'` | Añadir `@vitejs/plugin-react` / `babel-loader` |
| `You're importing a component that needs useState` (Next.js) | Añadir `"use client"` o mover el hook a un componente cliente hijo |
| `Module not found: Can't resolve 'fs'` (Next.js) | Eliminar import de `fs` o mover la lógica a un Server Component / ruta API |
| `Hydration failed because the initial UI does not match` | Mover `Date.now()`/`Math.random()`/`window.*` a un `useEffect` |
| `Invalid hook call` | Múltiples copias de React — desduplicar mediante `resolutions`/`overrides` |
| `Element type is invalid` | Discordancia entre import default y nombrado |

## Estrategia de Corrección

1. **Errores de compilación primero** — el código debe compilar
2. **Errores de hidratación segundo** — afectan la corrección en producción
3. **Configuración de empaquetador tercero** — restaurar la corrección de plugins/loaders
4. **Una corrección a la vez** — verificar cada cambio
5. **Cambios mínimos** — nunca usar `// @ts-ignore` sin justificación
6. **Volver a compilar tras cada cambio** — detectar nuevos errores de inmediato

## Condiciones de Parada

El agente se detendrá y reportará si:

- El mismo error persiste tras 3 intentos
- La solución introduce más errores de los que resuelve
- Requiere un cambio arquitectónico que excede una resolución de compilación (ej. rediseñar los límites de RSC)
- La versión del empaquetador ya no es compatible con la versión mayor de React instalada

## Comandos Relacionados

- `/react-test` — ejecuta pruebas tras lograr una compilación exitosa
- `/react-review` — revisa la calidad del código después de compilar
- `/build-fix` — corrector genérico de compilación (no específico de React)
- Skill `verification-loop` — bucle completo de verificación

## Relacionado

- Agente: `agents/react-build-resolver.md`
- Skills: `skills/react-patterns/`, `skills/frontend-patterns/`
- Reglas: `rules/react/coding-style.md`, `rules/react/patterns.md`
