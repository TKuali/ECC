---
description: Aplica el flujo de trabajo de TDD para React. Escribe primero las pruebas con React Testing Library (centradas en el comportamiento y con prioridad en accesibilidad) y luego implementa los componentes. Detecta Vitest o Jest y verifica los objetivos de cobertura.
---

# Comando TDD para React

Este comando aplica la metodología de desarrollo guiado por pruebas (TDD) para React utilizando React Testing Library junto con Vitest o Jest, detectados en tiempo de ejecución.

## Qué hace este comando

1. **Definir la Firma del Componente**: Estructura el componente, el tipo de props y las exportaciones
2. **Escribir Pruebas de Comportamiento Primero**: Consultas de RTL (priorizando roles), `userEvent`, MSW para red — ROJO (RED)
3. **Ejecutar Pruebas**: Verificar que fallen por el motivo correcto
4. **Implementar Código Mínimo**: Lo justo y necesario para pasar — VERDE (GREEN)
5. **Refactorizar**: Mejorar el código manteniendo las pruebas en verde
6. **Verificar Cobertura**: Cumplir con los objetivos fijados en [rules/react/testing.md](../rules/react/testing.md)

## Cuándo usarlo

Usa `/react-test` cuando:

- Estés implementando un nuevo componente de React o un hook personalizado
- Agregues cobertura de pruebas a un componente no testeado
- Corrijas un error (escribe primero la prueba que falla reproduciendo el error)
- Construyas formularios, máquinas de estado o interfaces críticas para la accesibilidad
- Te incorpores al flujo de trabajo con RTL + Vitest/Jest

## Ciclo TDD

```
ROJO (RED)      -> Escribir prueba fallida para el siguiente comportamiento
VERDE (GREEN)   -> Implementar código mínimo del componente para pasar
REFACTOR        -> Mejorar el componente manteniendo las pruebas en verde
REPETIR         -> Siguiente comportamiento
```

## Detección del Ejecutor de Pruebas (Test Runner)

```bash
test -f vitest.config.ts -o -f vitest.config.js -o -f vite.config.ts   # Vitest
grep -l '"jest"' package.json                                          # Jest
```

Se prefiere Vitest para proyectos nuevos basados en Vite; se respeta Jest en configuraciones existentes.

## Ejemplo de Sesión

````text
Usuario: /react-test Necesito un componente SearchInput con búsqueda con retardo (debounced search)

Agente:
# Sesión TDD: SearchInput

## Paso 1: Definir Firma

```tsx
// src/components/SearchInput.tsx
type Props = {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
};

export function SearchInput({ onSearch, placeholder, debounceMs }: Props) {
  throw new Error("not implemented");
}
```

## Paso 2: Escribir Pruebas de Comportamiento (ROJO)

```tsx
// src/components/SearchInput.test.tsx
import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchInput } from "./SearchInput";

describe("SearchInput", () => {
  test("se renderiza con placeholder", () => {
    render(<SearchInput onSearch={() => {}} placeholder="Search users" />);
    expect(screen.getByPlaceholderText("Search users")).toBeInTheDocument();
  });

  test("llama a onSearch después de escribir", async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onSearch = vi.fn();
    render(<SearchInput onSearch={onSearch} debounceMs={300} />);

    await user.type(screen.getByRole("textbox"), "alice");

    expect(onSearch).not.toHaveBeenCalled();        // antes del debounce
    vi.advanceTimersByTime(300);
    expect(onSearch).toHaveBeenCalledWith("alice"); // después del debounce

    vi.useRealTimers();
  });

  test("no llama a onSearch cuando la escritura se pausa y luego continúa", async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onSearch = vi.fn();
    render(<SearchInput onSearch={onSearch} debounceMs={300} />);

    await user.type(screen.getByRole("textbox"), "ali");
    vi.advanceTimersByTime(200);                    // mitad del debounce
    await user.type(screen.getByRole("textbox"), "ce");
    vi.advanceTimersByTime(300);

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("alice");

    vi.useRealTimers();
  });

  test("es accesible y navegable con el teclado", () => {
    render(<SearchInput onSearch={() => {}} />);
    const input = screen.getByRole("textbox");
    input.focus();
    expect(input).toHaveFocus();
  });
});
```

## Paso 3: Ejecutar Pruebas — Verificar FALLA

```bash
$ vitest run src/components/SearchInput.test.tsx

× src/components/SearchInput.test.tsx (4 tests) ✘ Error: not implemented
```

✓ Las pruebas fallan como se esperaba.

## Paso 4: Implementar Código Mínimo (VERDE)

```tsx
import { useEffect, useState } from "react";

export function SearchInput({ onSearch, placeholder, debounceMs = 300 }: Props) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const id = setTimeout(() => onSearch(query), debounceMs);
    return () => clearTimeout(id);
  }, [query, onSearch, debounceMs]);

  return (
    <input
      type="text"
      value={query}
      placeholder={placeholder}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
}
```

## Paso 5: Ejecutar Pruebas — Verificar ÉXITO

```bash
$ vitest run src/components/SearchInput.test.tsx

✓ src/components/SearchInput.test.tsx (4 tests) 47ms
```

## Paso 6: Cobertura

```bash
$ vitest run --coverage src/components/SearchInput.test.tsx

% Stmts: 100  % Branch: 100  % Funcs: 100  % Lines: 100
```

## ¡TDD Completado!
````

## Patrones de Prueba

### Comportamiento, no implementación

Usa `getByRole`, `getByLabelText`, `getByText`. Evita `container.querySelector` y hacer aserciones sobre el estado interno del componente.

### `userEvent.setup()` por prueba

```tsx
const user = userEvent.setup();
await user.click(screen.getByRole("button", { name: /save/i }));
```

### MSW para peticiones de red

```tsx
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

server.use(http.post("/api/users", () => HttpResponse.json({ id: "1" }, { status: 201 })));
```

### Hooks personalizados

```tsx
const { result } = renderHook(() => useCounter(0));
act(() => result.current.increment());
expect(result.current.count).toBe(1);
```

### Accesibilidad

```tsx
import { axe } from "vitest-axe";
expect(await axe(container)).toHaveNoViolations();
```

## Objetivos de Cobertura

| Capa | Objetivo |
|---|---|
| Utilidades puras | >=90% |
| Hooks personalizados | >=85% |
| Componentes presentacionales | >=80% |
| Componentes contenedores | >=70% |
| Páginas | Cubiertas por E2E por separado |

Configura estos umbrales en `vitest.config.ts` / `jest.config.js` para exigir su cumplimiento en CI.

## Antipatrones a Evitar

- `container.querySelector(...)` — esquiva las consultas de accesibilidad
- Aserciones sobre el número de renderizados
- Mockear `react` directamente (`jest.mock("react", ...)`)
- Mockear componentes hijos por defecto (mockear solo si el hijo tiene efectos secundarios pesados)
- Ignorar advertencias de `act()` — señalan errores reales
- Pruebas de instantánea (snapshot) de componentes renderizados (frágiles y aprobadas sin revisar) — usa diff visual de Playwright/Cypress en su lugar

## Comandos de Prueba

```bash
# Vitest
vitest                              # modo watch
vitest run                          # ejecución única
vitest run --coverage               # con cobertura
vitest run path/to/file.test.tsx    # archivo único

# Jest
jest --watch
jest --coverage
jest path/to/file.test.tsx

# Modo CI
CI=true vitest run --coverage
```

## Comandos Relacionados

- `/react-build` — corrige errores de compilación antes de ejecutar pruebas
- `/react-review` — revisa el código tras la implementación
- Skill `verification-loop` — bucle completo de verificación

## Relacionado

- Skills: `skills/react-testing/`, `skills/tdd-workflow/`, `skills/accessibility/`, `skills/e2e-testing/`
- Reglas: `rules/react/testing.md`
- Agentes: `react-reviewer` (revisa calidad de pruebas), `tdd-guide` (aplica el proceso TDD)
