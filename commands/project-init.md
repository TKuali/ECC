---
description: Detecta el stack de un proyecto y produce un plan de incorporación de ECC en modo simulado utilizando los manifiestos de instalación y mapeos de stack del repositorio.
---

# /project-init

Crea un plan de incorporación a ECC seguro y revisable para el proyecto actual. Este comando debe comenzar en modo de prueba preliminar (dry-run) y solo escribir archivos tras la aprobación explícita del usuario.

## Uso

```text
/project-init
/project-init --dry-run
/project-init --target claude
/project-init --target cursor
/project-init --skills continuous-learning-v2,security-review
/project-init --config ecc-install.json
```

## Reglas de Seguridad

1. Por defecto en modo dry-run. No modificar `CLAUDE.md`, archivos de configuración, reglas, habilidades ni el estado de instalación hasta que el usuario apruebe el plan concreto.
2. Conservar las directrices existentes del proyecto. Si `CLAUDE.md`, `.claude/settings.local.json`, `.cursor/`, `.codex/`, `.gemini/`, `.opencode/`, `.codebuddy/`, `.joycode/` o `.qwen/` ya existen, inspeccionarlos y proponer un plan de fusión/anexado en lugar de sobrescribir.
3. Usar las herramientas del instalador y manifiestos de ECC. No copiar archivos a mano ni clonar remotos arbitrarios como atajo de instalación.
4. Mantener los permisos acotados. Cualquier configuración generada debe coincidir con las herramientas de compilación/prueba/linter detectadas y evitar acceso indiscriminado al shell.
5. Reportar con exactitud qué cambiaría antes de aplicar cualquier acción.

## Entradas de Detección

Leer la raíz del proyecto actual y detectar señales del stack a partir de:

- archivos de gestor de paquetes: `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lockb`
- manifiestos de lenguaje: `pyproject.toml`, `requirements.txt`, `go.mod`, `Cargo.toml`, `pom.xml`, `build.gradle`, `build.gradle.kts`
- archivos de frameworks: `next.config.*`, `vite.config.*`, `tailwind.config.*`, `Dockerfile`, `docker-compose.yml`
- configuración de ECC: `ecc-install.json`
- mapa de stacks opcional: `config/project-stack-mappings.json` en el repositorio de ECC

Cuando el repositorio de ECC esté disponible localmente, usar `config/project-stack-mappings.json` como referencia de stack a reglas/habilidades. Si no está disponible, utilizar los manifiestos de ECC instalados y las elecciones explícitas del usuario.

## Flujo de Planificación

1. Identificar el entorno de destino. Por defecto `claude` a menos que el usuario solicite `cursor`, `codex`, `gemini`, `opencode`, `codebuddy`, `joycode` o `qwen`.
2. Detectar stacks a partir de los archivos del proyecto y mostrar la evidencia de cada coincidencia.
3. Resolver el plan de ECC más conciso y útil:
   - el proyecto tiene un `ecc-install.json`: `node scripts/install-plan.js --config ecc-install.json --json`
   - el usuario nombró un perfil: `node scripts/install-plan.js --profile <profile> --target <target> --json`
   - el usuario nombró habilidades: `node scripts/install-plan.js --skills <skill-ids> --target <target> --json`
   - solo se detectaron stacks de lenguajes: usar el dry-run legado de instalación de lenguaje con esos nombres de lenguajes
4. Ejecutar un comando de aplicación en modo dry-run antes de escribir:

```bash
node scripts/install-apply.js --target <target> --dry-run --json <language-or-profile-args>
```

5. Resumir stacks detectados, módulos/componentes/habilidades seleccionados, rutas de destino, módulos incompatibles omitidos y archivos que se modificarían.
6. Pedir aprobación antes de ejecutar el comando real de aplicación.

## Contrato de Salida

Retornar:

1. evidencia del stack detectado
2. entorno de destino propuesto
3. comando dry-run exacto utilizado
4. comando exacto a ejecutar tras la aprobación
5. archivos/directorios que se crearían o modificarían
6. advertencias sobre archivos existentes, permisos amplios, scripts faltantes o destinos incompatibles

## Guía para CLAUDE.md

Si el usuario solicita un `CLAUDE.md` inicial, generarlo por separado del plan del instalador y mantenerlo minimalista:

- comando de compilación, si se detecta
- comando de pruebas, si se detecta
- comando de linter/comprobación de tipos, si se detecta
- comando de servidor de desarrollo, si se detecta
- notas específicas del repositorio a partir de scripts de paquetes o manifiestos existentes

Nunca reemplazar un `CLAUDE.md` existente sin mostrar un diff y obtener aprobación.

## Relacionado

- `config/project-stack-mappings.json` para referencias de stack a capacidades
- `scripts/install-plan.js` para resolución determinista de planes
- `scripts/install-apply.js` para operaciones de dry-run y aplicación
- `/ecc-guide` para descubrimiento interactivo de funcionalidades antes de instalar
