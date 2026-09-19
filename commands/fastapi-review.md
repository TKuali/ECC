---
description: Revisa una aplicación FastAPI en cuanto a arquitectura, corrección asíncrona, inyección de dependencias, esquemas de Pydantic, seguridad, rendimiento y capacidad de prueba.
---

# Revisión de FastAPI

Invoca al agente `fastapi-reviewer` para una revisión especializada de FastAPI.

## Uso

```text
/fastapi-review [archivo-o-directorio]
```

## Áreas de Revisión

- Fábrica de aplicaciones, límites de routers, middlewares y manejadores de excepciones.
- Separación de esquemas de solicitud y respuesta con Pydantic.
- Inyección de dependencias para sesiones de base de datos, autenticación, paginación y configuraciones.
- Patrones asíncronos para bases de datos y peticiones HTTP externas.
- CORS, autenticación, límites de tasa (rate limiting), registro de logs y manejo de secretos.
- Metadatos de OpenAPI y modelos de respuesta documentados.
- Configuración del cliente de pruebas y sobreescrituras de dependencias.

## Salida Esperada

```text
[SEVERIDAD] Título corto del problema
Archivo: ruta/al/archivo.py:42
Problema: Qué está mal y por qué es importante.
Solución: Cambio concreto a realizar.
```

## Relacionado

- Agente: `fastapi-reviewer`
- Skill: `fastapi-patterns`
- Comando: `/python-review`
- Skill: `security-scan`
