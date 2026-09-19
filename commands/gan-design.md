---
description: Ejecuta un bucle de diseño generador/evaluador para trabajos visuales o frontend con iteraciones delimitadas y puntuación.
---

# Entorno de Diseño Estilo GAN (GAN-Style Design Harness)

Analiza lo siguiente a partir de $ARGUMENTS:
1. `brief` — descripción del diseño a crear indicada por el usuario
2. `--max-iterations N` — (opcional, por defecto 10) ciclos máximos de diseño-evaluación
3. `--pass-threshold N` — (opcional, por defecto 7.5) puntuación ponderada para aprobar (umbral más alto por defecto para diseño)

Un bucle de dos agentes (Generador + Evaluador) enfocado en la calidad del diseño frontend. Sin planificador — el brief ES la especificación.

Este es el mismo modo que Anthropic utilizó para sus experimentos de diseño frontend, logrando avances creativos como el museo de arte holandés en 3D con perspectiva CSS y navegación por portales.

### Configuración
1. Crear el directorio `gan-harness/`
2. Escribir el brief directamente como `gan-harness/spec.md`
3. Escribir un archivo `gan-harness/eval-rubric.md` orientado al diseño con mayor peso en Calidad de Diseño y Originalidad

### Rúbrica de Evaluación Específica de Diseño
```markdown
### Calidad de Diseño (peso: 0.35)
### Originalidad (peso: 0.30)
### Calidad Técnica (peso: 0.25)
### Funcionalidad (peso: 0.10)
```

Nota: El peso de Originalidad es mayor (0.30 frente a 0.20) para impulsar la innovación creativa. El peso de Funcionalidad es menor ya que el modo diseño prioriza la calidad visual.

### Bucle
Igual a la Fase 2 de `/project:gan-build`, pero:
- Se omite el planificador
- Se utiliza la rúbrica enfocada en diseño
- El prompt del Generador enfatiza la calidad visual por encima de la completitud funcional
- El prompt del Evaluador enfatiza "¿esto ganaría un premio de diseño?" por encima de "¿funcionan todas las características?"

### Diferencia Clave respecto a gan-build
Al Generador se le indica: "Tu objetivo PRINCIPAL es la excelencia visual. Una aplicación deslumbrante a medio terminar supera a una fea pero funcional. Impulsa saltos creativos — layouts poco convencionales, animaciones personalizadas y esquemas de color distintivos."
