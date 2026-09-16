---
description: Aplica el flujo de trabajo de TDD para Go. Escribe pruebas guiadas por tablas primero, luego implementa. Verifica más del 80% de cobertura con go test -cover.
---

# Comando TDD para Go

Este comando aplica la metodología de desarrollo guiado por pruebas (TDD) para código Go utilizando patrones de pruebas idiomáticos de Go.

## Qué hace este comando

1. **Definir Tipos/Interfaces**: Estructura primero las firmas de funciones
2. **Escribir Pruebas Guiadas por Tablas**: Crea casos de prueba completos (ROJO / RED)
3. **Ejecutar Pruebas**: Verifica que las pruebas fallen por la razón correcta
4. **Implementar Código**: Escribe el código mínimo necesario para pasar (VERDE / GREEN)
5. **Refactorizar**: Mejora el código manteniendo las pruebas en verde
6. **Verificar Cobertura**: Asegura un 80%+ de cobertura

## Cuándo usarlo

Usa `/go-test` cuando:
- Estés implementando nuevas funciones en Go
- Agregues cobertura de pruebas a código existente
- Corrijas errores (escribe la prueba fallida primero)
- Construyas lógica de negocio crítica
- Aprendas o apliques el flujo de trabajo de TDD en Go

## Ciclo TDD

```
ROJO (RED)     → Escribir prueba dirigida por tablas que falle
VERDE (GREEN)  → Implementar el código mínimo para pasar
REFACTOR       → Mejorar el código manteniendo las pruebas en verde
REPETIR        → Siguiente caso de prueba
```

## Ejemplo de Sesión

````text
Usuario: /go-test Necesito una función para validar direcciones de correo electrónico

Agente:
# Sesión TDD: Validador de Correo

## Paso 1: Definir Interfaz

```go
// validator/email.go
package validator

// ValidateEmail comprueba si la cadena dada es una dirección de correo válida.
// Retorna nil si es válida, o un error que describe el problema en caso contrario.
func ValidateEmail(email string) error {
    panic("not implemented")
}
```

## Paso 2: Escribir Pruebas Guiadas por Tablas (ROJO)

```go
// validator/email_test.go
package validator

import (
    "testing"
)

func TestValidateEmail(t *testing.T) {
    tests := []struct {
        name    string
        email   string
        wantErr bool
    }{
        // Correos válidos
        {"correo simple", "user@example.com", false},
        {"con subdominio", "user@mail.example.com", false},
        {"con signo más", "user+tag@example.com", false},
        {"con puntos", "first.last@example.com", false},

        // Correos inválidos
        {"cadena vacía", "", true},
        {"sin arroba", "userexample.com", true},
        {"sin dominio", "user@", true},
        {"sin parte local", "@example.com", true},
        {"doble arroba", "user@@example.com", true},
        {"espacios", "user @example.com", true},
        {"sin tld", "user@example", true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := ValidateEmail(tt.email)
            if tt.wantErr && err == nil {
                t.Errorf("ValidateEmail(%q) = nil; se esperaba error", tt.email)
            }
            if !tt.wantErr && err != nil {
                t.Errorf("ValidateEmail(%q) = %v; se esperaba nil", tt.email, err)
            }
        })
    }
}
```

## Paso 3: Ejecutar Pruebas - Verificar FALLA

```bash
$ go test ./validator/...

--- FAIL: TestValidateEmail (0.00s)
    --- FAIL: TestValidateEmail/simple_email (0.00s)
        panic: not implemented

FAIL
```

✓ Las pruebas fallan como se esperaba (panic).

## Paso 4: Implementar Código Mínimo (VERDE)

```go
// validator/email.go
package validator

import (
    "errors"
    "regexp"
)

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

var (
    ErrEmailEmpty   = errors.New("el correo electrónico no puede estar vacío")
    ErrEmailInvalid = errors.New("el formato del correo electrónico no es válido")
)

func ValidateEmail(email string) error {
    if email == "" {
        return ErrEmailEmpty
    }
    if !emailRegex.MatchString(email) {
        return ErrEmailInvalid
    }
    return nil
}
```

## Paso 5: Ejecutar Pruebas - Verificar ÉXITO

```bash
$ go test ./validator/...

PASS
ok      project/validator    0.003s
```

✓ ¡Todas las pruebas pasaron!

## Paso 6: Verificar Cobertura

```bash
$ go test -cover ./validator/...

PASS
coverage: 100.0% of statements
ok      project/validator    0.003s
```

✓ Cobertura: 100%

## ¡TDD Completado!
````

## Patrones de Prueba

### Pruebas Guiadas por Tablas
```go
tests := []struct {
    name     string
    input    InputType
    want     OutputType
    wantErr  bool
}{
    {"caso 1", input1, want1, false},
    {"caso 2", input2, want2, true},
}

for _, tt := range tests {
    t.Run(tt.name, func(t *testing.T) {
        got, err := Function(tt.input)
        // aserciones
    })
}
```

### Pruebas en Paralelo
```go
for _, tt := range tests {
    tt := tt // Captura
    t.Run(tt.name, func(t *testing.T) {
        t.Parallel()
        // cuerpo de la prueba
    })
}
```

### Funciones Auxiliares de Prueba (Helpers)
```go
func setupTestDB(t *testing.T) *sql.DB {
    t.Helper()
    db := createDB()
    t.Cleanup(func() { db.Close() })
    return db
}
```

## Comandos de Cobertura

```bash
# Cobertura básica
go test -cover ./...

# Perfil de cobertura
go test -coverprofile=coverage.out ./...

# Ver en el navegador
go tool cover -html=coverage.out

# Cobertura por función
go tool cover -func=coverage.out

# Con detección de condiciones de carrera
go test -race -cover ./...
```

## Objetivos de Cobertura

| Tipo de Código | Objetivo |
|----------------|----------|
| Lógica de negocio crítica | 100% |
| APIs públicas | 90%+ |
| Código general | 80%+ |
| Código generado | Excluir |

## Mejores Prácticas de TDD

**QUÉ HACER:**
- Escribir la prueba PRIMERO, antes de cualquier implementación
- Ejecutar pruebas tras cada cambio
- Usar pruebas dirigidas por tablas para cobertura exhaustiva
- Probar el comportamiento, no los detalles de implementación
- Incluir casos límite (vacío, nil, valores máximos)

**QUÉ NO HACER:**
- Escribir implementación antes de las pruebas
- Saltar la fase ROJA
- Probar funciones privadas directamente
- Usar `time.Sleep` en pruebas
- Ignorar pruebas intermitentes

## Comandos Relacionados

- `/go-build` - Corrige errores de compilación
- `/go-review` - Revisa el código tras la implementación
- Skill `verification-loop` - Ejecuta el bucle de verificación completo

## Relacionado

- Skill: `skills/golang-testing/`
- Skill: `skills/tdd-workflow/`
