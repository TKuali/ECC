---
description: Revisión exhaustiva de código Go en cuanto a patrones idiomáticos, seguridad en concurrencia, manejo de errores y seguridad. Invoca al agente go-reviewer.
---

# Revisión de Código Go

Este comando invoca al agente **go-reviewer** para una revisión de código completa y especializada en Go.

## Qué hace este comando

1. **Identificar cambios en Go**: Encuentra archivos `.go` modificados mediante `git diff`
2. **Ejecutar análisis estático**: Ejecuta `go vet`, `staticcheck` y `golangci-lint`
3. **Escaneo de seguridad**: Busca inyecciones SQL/comandos y condiciones de carrera
4. **Revisión de concurrencia**: Analiza seguridad en goroutines, uso de canales y patrones de mutex
5. **Comprobación de Go idiomático**: Verifica que el código siga las convenciones y mejores prácticas de Go
6. **Generar reporte**: Categoriza problemas por severidad

## Cuándo usarlo

Usa `/go-review` cuando:
- Después de escribir o modificar código Go
- Antes de confirmar cambios (commit) en Go
- Al revisar pull requests con código Go
- Al incorporarse a un nuevo proyecto en Go
- Para aprender patrones idiomáticos de Go

## Categorías de Revisión

### CRÍTICO (Debe Corregirse)
- Vulnerabilidades de inyección SQL o de comandos
- Condiciones de carrera sin sincronización
- Fugas de goroutines (goroutine leaks)
- Credenciales hardcodeadas
- Uso inseguro de punteros (`unsafe.Pointer`)
- Errores ignorados en rutas críticas

### ALTO (Debería Corregirse)
- Falta de encapsulación de errores con contexto (`fmt.Errorf` con `%w`)
- Uso de `panic` en lugar de devolver errores
- `context.Context` no propagado
- Canales sin búfer que provocan bloqueos mutuos (deadlocks)
- Errores de interfaz no implementada
- Falta de protección con mutex

### MEDIO (A Considerar)
- Patrones de código no idiomáticos
- Falta de comentarios de godoc en exportaciones públicas
- Concatenación de cadenas ineficiente
- Slices no preasignados
- Pruebas dirigidas por tablas (table-driven tests) no utilizadas

## Comprobaciones Automatizadas Ejecutadas

```bash
# Análisis estático
go vet ./...

# Comprobaciones avanzadas (si están instaladas)
staticcheck ./...
golangci-lint run

# Detección de carreras
go build -race ./...

# Vulnerabilidades de seguridad
govulncheck ./...
```

## Ejemplo de Uso

```text
Usuario: /go-review

Agente:
# Reporte de Revisión de Código Go

## Archivos Revisados
- internal/handler/user.go (modificado)
- internal/service/auth.go (modificado)

## Resultados de Análisis Estático
✓ go vet: Sin problemas
✓ staticcheck: Sin problemas

## Problemas Encontrados

[CRITICAL] Condición de Carrera
Archivo: internal/service/auth.go:45
Problema: Mapa compartido accedido sin sincronización
```go
var cache = map[string]*Session{}  // ¡Acceso concurrente!

func GetSession(id string) *Session {
    return cache[id]  // Condición de carrera
}
```
Solución: Usar sync.RWMutex o sync.Map
```go
var (
    cache   = map[string]*Session{}
    cacheMu sync.RWMutex
)

func GetSession(id string) *Session {
    cacheMu.RLock()
    defer cacheMu.RUnlock()
    return cache[id]
}
```

[HIGH] Falta Contexto en el Error
Archivo: internal/handler/user.go:28
Problema: Error retornado sin contexto explicativo
```go
return err  // Sin contexto
```
Solución: Envolver con contexto
```go
return fmt.Errorf("get user %s: %w", userID, err)
```

## Resumen
- CRITICAL: 1
- HIGH: 1
- MEDIUM: 0

Recomendación: FAIL: Bloquear fusión hasta corregir problemas CRITICAL
```

## Criterios de Aprobación

| Estado | Condición |
|--------|-----------|
| PASS: Aprobar | Sin problemas CRITICAL o HIGH |
| WARNING: Advertencia | Solo problemas MEDIUM (fusionar con precaución) |
| FAIL: Bloquear | Problemas CRITICAL o HIGH encontrados |

## Integración con Otros Comandos

- Usa `/go-test` primero para garantizar que las pruebas pasen
- Usa `/go-build` si ocurren errores de compilación
- Usa `/go-review` antes de hacer commit
- Usa `/code-review` para aspectos generales no específicos de Go

## Relacionado

- Agente: `agents/go-reviewer.md`
- Skills: `skills/golang-patterns/`, `skills/golang-testing/`
