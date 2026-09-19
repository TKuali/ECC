---
description: Revisión exhaustiva de código Python para cumplimiento de PEP 8, anotaciones de tipos, seguridad y modismos pitónicos. Invoca al agente python-reviewer.
---

# Revisión de Código Python

Este comando invoca al agente **python-reviewer** para una revisión de código exhaustiva y especializada en Python.

## Qué hace este comando

1. **Identificar cambios en Python**: Encuentra archivos `.py` modificados mediante `git diff`
2. **Ejecutar análisis estático**: Ejecuta `ruff`, `mypy`, `pylint`, `black --check`
3. **Escaneo de seguridad**: Busca inyecciones SQL, inyecciones de comandos y deserialización insegura
4. **Revisión de seguridad de tipos**: Analiza anotaciones de tipos y errores de mypy
5. **Comprobación de código pitónico**: Verifica que el código siga PEP 8 y las mejores prácticas de Python
6. **Generar reporte**: Categoriza problemas por severidad

## Cuándo usarlo

Usa `/python-review` cuando:
- Después de escribir o modificar código Python
- Antes de confirmar cambios (commit) en Python
- Al revisar pull requests con código Python
- Al incorporarse a un nuevo proyecto en Python
- Para aprender patrones y modismos pitónicos

## Categorías de Revisión

### CRÍTICO (Debe Corregirse)
- Vulnerabilidades de inyección SQL o de comandos
- Uso inseguro de `eval()` o `exec()`
- Deserialización insegura con `pickle`
- Credenciales hardcodeadas
- Carga insegura de YAML (`yaml.load` sin SafeLoader)
- Cláusulas `except:` desnudas que ocultan errores

### ALTO (Debería Corregirse)
- Falta de anotaciones de tipos en funciones públicas
- Argumentos predeterminados mutables
- Ocultar excepciones silenciosamente
- No utilizar administradores de contexto (`with`) para recursos
- Bucles estilo C en lugar de comprensiones de lista/generadores
- Usar `type()` en lugar de `isinstance()`
- Condiciones de carrera sin candados (locks)

### MEDIO (A Considerar)
- Violaciones de formato de PEP 8
- Falta de docstrings en funciones públicas
- Sentencias `print` en lugar de logging
- Operaciones de cadena ineficientes
- Números mágicos sin constantes con nombre
- No utilizar f-strings para formateo
- Creación innecesaria de listas intermedias

## Comprobaciones Automatizadas Ejecutadas

```bash
# Verificación de tipos
mypy .

# Linting y formateo
ruff check .
black --check .
isort --check-only .

# Escaneo de seguridad
bandit -r .

# Auditoría de dependencias
pip-audit
safety check

# Pruebas
pytest --cov=app --cov-report=term-missing
```

## Ejemplo de Uso

```text
Usuario: /python-review

Agente:
# Reporte de Revisión de Código Python

## Archivos Revisados
- app/routes/user.py (modificado)
- app/services/auth.py (modificado)

## Resultados de Análisis Estático
✓ ruff: Sin problemas
✓ mypy: Sin errores
ADVERTENCIA: black: 2 archivos necesitan reformateo
✓ bandit: Sin problemas de seguridad

## Problemas Encontrados

[CRITICAL] Vulnerabilidad de Inyección SQL
Archivo: app/routes/user.py:42
Problema: Entrada de usuario interpolada directamente en la consulta SQL
```python
query = f"SELECT * FROM users WHERE id = {user_id}"  # Incorrecto
```
Solución: Usar consulta parametrizada
```python
query = "SELECT * FROM users WHERE id = %s"  # Correcto
cursor.execute(query, (user_id,))
```

[HIGH] Argumento Predeterminado Mutable
Archivo: app/services/auth.py:18
Problema: Argumento predeterminado mutable causa estado compartido entre llamadas
```python
def process_items(items=[]):  # Incorrecto
    items.append("new")
    return items
```
Solución: Usar None como predeterminado
```python
def process_items(items=None):  # Correcto
    if items is None:
        items = []
    items.append("new")
    return items
```

[MEDIUM] Falta de Anotaciones de Tipos
Archivo: app/services/auth.py:25
Problema: Función pública sin anotaciones de tipos
```python
def get_user(user_id):  # Incorrecto
    return db.find(user_id)
```
Solución: Añadir pistas de tipos
```python
def get_user(user_id: str) -> Optional[User]:  # Correcto
    return db.find(user_id)
```

[MEDIUM] Sin Administrador de Contexto
Archivo: app/routes/user.py:55
Problema: Archivo no cerrado si ocurre una excepción
```python
f = open("config.json")  # Incorrecto
data = f.read()
f.close()
```
Solución: Usar administrador de contexto
```python
with open("config.json") as f:  # Correcto
    data = f.read()
```

## Resumen
- CRITICAL: 1
- HIGH: 1
- MEDIUM: 2

Recomendación: FAIL: Bloquear fusión hasta corregir problemas CRITICAL

## Formateo Requerido
Ejecutar: `black app/routes/user.py app/services/auth.py`
```

## Criterios de Aprobación

| Estado | Condición |
|--------|-----------|
| PASS: Aprobar | Sin problemas CRITICAL o HIGH |
| WARNING: Advertencia | Solo problemas MEDIUM (fusionar con precaución) |
| FAIL: Bloquear | Problemas CRITICAL o HIGH encontrados |

## Integración con Otros Comandos

- Usa la skill `tdd-workflow` primero para asegurar que las pruebas pasen
- Usa `/code-review` para aspectos generales independientes de Python
- Usa `/python-review` antes de hacer commit
- Usa `/build-fix` si fallan las herramientas de análisis estático

## Revisiones Específicas de Frameworks

### Proyectos Django
El revisor verifica:
- Problemas de consultas N+1 (usar `select_related` y `prefetch_related`)
- Migraciones faltantes para cambios en modelos
- Uso de SQL directo cuando el ORM es aplicable
- Falta de `transaction.atomic()` para operaciones de múltiples pasos

### Proyectos FastAPI
El revisor verifica:
- Mala configuración de CORS
- Modelos Pydantic para validación de solicitudes
- Corrección de modelos de respuesta
- Uso apropiado de async/await
- Patrones de inyección de dependencias

### Proyectos Flask
El revisor verifica:
- Manejo de contexto (contexto de aplicación, contexto de petición)
- Manejo adecuado de errores
- Organización mediante Blueprints
- Gestión de configuración

## Relacionado

- Agente: `agents/python-reviewer.md`
- Skills: `skills/python-patterns/`, `skills/python-testing/`

## Correcciones Comunes

### Añadir Anotaciones de Tipos
```python
# Antes
def calculate(x, y):
    return x + y

# Después
from typing import Union

def calculate(x: Union[int, float], y: Union[int, float]) -> Union[int, float]:
    return x + y
```

### Usar Administradores de Contexto
```python
# Antes
f = open("file.txt")
data = f.read()
f.close()

# Después
with open("file.txt") as f:
    data = f.read()
```

### Usar Comprensiones de Listas
```python
# Antes
result = []
for item in items:
    if item.active:
        result.append(item.name)

# Después
result = [item.name for item in items if item.active]
```

### Corregir Valores Predeterminados Mutables
```python
# Antes
def append(value, items=[]):
    items.append(value)
    return items

# Después
def append(value, items=None):
    if items is None:
        items = []
    items.append(value)
    return items
```

### Usar f-strings (Python 3.6+)
```python
# Antes
name = "Alice"
greeting = "Hello, " + name + "!"
greeting2 = "Hello, {}".format(name)

# Después
greeting = f"Hello, {name}!"
```

### Corregir Concatenación de Cadenas en Bucles
```python
# Antes
result = ""
for item in items:
    result += str(item)

# Después
result = "".join(str(item) for item in items)
```

## Compatibilidad de Versiones de Python

El revisor señala cuando el código utiliza características de versiones más recientes de Python:

| Característica | Versión Mínima de Python |
|----------------|--------------------------|
| Anotaciones de tipos | 3.5+ |
| f-strings | 3.6+ |
| Operador morsa (`:=`) | 3.8+ |
| Parámetros solo por posición | 3.8+ |
| Sentencias match (`match/case`) | 3.10+ |
| Uniones de tipos (&#96;x &#124; None&#96;) | 3.10+ |

Asegúrate de que el archivo `pyproject.toml` o `setup.py` de tu proyecto especifique la versión mínima correcta de Python.
