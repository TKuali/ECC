---
description: Desarrollo guiado de funcionalidades centrado en la comprensión del código base y la arquitectura
---

# Desarrollo Guiado de Funcionalidades (Feature Dev)

Un flujo de trabajo estructurado para el desarrollo de funcionalidades que prioriza entender el código existente antes de escribir código nuevo.

## Fases

### 1. Descubrimiento
- leer atentamente la solicitud de la funcionalidad
- identificar requisitos, restricciones y criterios de aceptación
- hacer preguntas de aclaración si la solicitud es ambigua

### 2. Exploración del Código Base
- usar `code-explorer` para analizar el código existente relevante
- rastrear rutas de ejecución y capas de arquitectura
- comprender puntos de integración y convenciones

### 3. Preguntas de Aclaración
- presentar los hallazgos de la exploración
- hacer preguntas dirigidas sobre diseño y casos límite
- esperar la respuesta del usuario antes de continuar

### 4. Diseño de Arquitectura
- usar `code-architect` para diseñar la funcionalidad
- proporcionar el plan maestro (blueprint) de implementación
- esperar la aprobación antes de implementar

### 5. Implementación
- implementar la funcionalidad siguiendo el diseño aprobado
- preferir TDD donde sea oportuno
- mantener commits pequeños y enfocados

### 6. Revisión de Calidad
- usar `code-reviewer` para revisar la implementación
- resolver problemas críticos e importantes
- verificar la cobertura de pruebas

### 7. Resumen
- resumir lo que se construyó
- listar elementos de seguimiento o limitaciones
- proporcionar instrucciones de prueba
