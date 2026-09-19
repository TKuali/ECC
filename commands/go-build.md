---
description: Corrige incrementalmente errores de compilación de Go, advertencias de go vet y problemas de linter. Invoca al agente go-build-resolver para correcciones quirúrgicas mínimas.
---

# Compilación y Corrección de Go

Este comando invoca al agente **go-build-resolver** para corregir incrementalmente errores de compilación de Go con cambios mínimos.

## Qué hace este comando

1. **Ejecutar diagnósticos**: Ejecuta `go build`, `go vet`, `staticcheck`
2. **Analizar errores**: Agrupa por archivo y ordena por severidad
3. **Corregir incrementalmente**: Un error a la vez
4. **Verificar cada corrección**: Vuelve a compilar tras cada cambio
5. **Reportar resumen**: Muestra lo que se corrigió y lo que queda pendiente

## Cuándo usarlo

Usa `/go-build` cuando:
- `go build ./...` falle con errores
- `go vet ./...` reporte problemas
- `golangci-lint run` muestre advertencias
- Las dependencias de módulos estén rotas
- Después de traer cambios (pull) que rompen la compilación

## Comandos de diagnóstico ejecutados

```bash
# Verificación principal de compilación
go build ./...

# Análisis estático
go vet ./...

# Linting extendido (si está disponible)
staticcheck ./...
golangci-lint run

# Problemas de módulos
go mod verify
go mod tidy -v
```

## Ejemplo de Sesión

```text
Usuario: /go-build

Agente:
# Resolución de Compilación Go

## Diagnósticos Iniciales

```bash
$ go build ./...
internal/service/user.go:25:15: undefined: UserRepository
internal/handler/api.go:42:9: cannot use x (type string) as type int
internal/handler/api.go:58:2: missing return at end of function
```

Errores encontrados: 3

## Corrección 1: Identificador no definido

Archivo: internal/service/user.go:25
Error: undefined: UserRepository
Causa: Importación faltante

```go
// Importación añadida
import "project/internal/repository"

// Cambiado
var repo UserRepository
// A
var repo repository.UserRepository
```

```bash
$ go build ./...
# 2 errores restantes
```

## Corrección 2: Discordancia de tipos

Archivo: internal/handler/api.go:42
Error: cannot use x (type string) as type int

```go
// Cambiado
count := params.Get("count")
// A
countStr := params.Get("count")
count, _ := strconv.Atoi(countStr)
```

```bash
$ go build ./...
# 1 error restante
```

## Corrección 3: Retorno faltante

Archivo: internal/handler/api.go:58
Error: missing return at end of function

```go
func GetUser(id string) (*User, error) {
    if id == "" {
        return nil, ErrInvalidID
    }
    user := findUser(id)
    // Retorno faltante añadido
    return user, nil
}
```

```bash
$ go build ./...
# ¡Compilación exitosa!
```

## Verificación Final

```bash
$ go vet ./...
# Sin problemas

$ go test ./...
ok      project/internal/service   0.015s
ok      project/internal/handler   0.023s
```

## Resumen

| Métrica | Cantidad |
|---------|----------|
| Errores de compilación corregidos | 3 |
| Advertencias de vet corregidas | 0 |
| Archivos modificados | 2 |
| Problemas restantes | 0 |

Estado de compilación: PASS: ÉXITO
```

## Errores Comunes Corregidos

| Error | Solución Típica |
|-------|-----------------|
| `undefined: X` | Añadir import o corregir error tipográfico |
| `cannot use X as Y` | Conversión de tipo o corregir asignación |
| `missing return` | Añadir sentencia return |
| `X does not implement Y` | Añadir método faltante |
| `import cycle` | Reestructurar paquetes |
| `declared but not used` | Eliminar o usar la variable |
| `cannot find package` | Ejecutar `go get` o `go mod tidy` |

## Estrategia de Corrección

1. **Errores de compilación primero** - El código debe compilar
2. **Advertencias de vet segundo** - Corregir construcciones sospechosas
3. **Advertencias de linter tercero** - Estilo y mejores prácticas
4. **Una corrección a la vez** - Verificar cada cambio
5. **Cambios mínimos** - No refactorizar, solo corregir

## Condiciones de Parada

El agente se detendrá y reportará si:
- El mismo error persiste tras 3 intentos
- La solución introduce más errores
- Requiere cambios arquitectónicos
- Faltan dependencias externas

## Comandos Relacionados

- `/go-test` - Ejecuta pruebas tras compilar con éxito
- `/go-review` - Revisa la calidad del código
- Skill `verification-loop` - Bucle completo de verificación

## Relacionado

- Agente: `agents/go-build-resolver.md`
- Skill: `skills/golang-patterns/`
