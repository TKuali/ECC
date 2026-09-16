---
description: Analiza un proyecto y genera comandos de servicio PM2 para servicios detectados de frontend, backend o base de datos.
---

# Inicialización de PM2 (PM2 Init)

Autoanaliza el proyecto y genera comandos de servicio de PM2.

**Comando**: `$ARGUMENTS`

---

## Flujo de Trabajo

1. Verificar PM2 (instalar vía `npm install -g pm2` si no existe)
2. Escanear el proyecto para identificar servicios (frontend/backend/base de datos)
3. Generar archivos de configuración y archivos de comandos individuales

---

## Detección de Servicios

| Tipo | Detección | Puerto por Defecto |
|---|---|---|
| Vite | vite.config.* | 5173 |
| Next.js | next.config.* | 3000 |
| Nuxt | nuxt.config.* | 3000 |
| CRA | react-scripts en package.json | 3000 |
| Express/Node | directorio server/backend/api + package.json | 3000 |
| FastAPI/Flask | requirements.txt / pyproject.toml | 8000 |
| Go | go.mod / main.go | 8080 |

**Prioridad de Detección de Puertos**: Especificado por usuario > .env > archivo de configuración > argumentos de scripts > puerto por defecto

---

## Archivos Generados

```
project/
├── ecosystem.config.cjs              # Configuración de PM2
├── {backend}/start.cjs               # Wrapper de Python (si aplica)
└── .claude/
    ├── commands/
    │   ├── pm2-all.md                # Iniciar todos + monitor
    │   ├── pm2-all-stop.md           # Detener todos
    │   ├── pm2-all-restart.md        # Reiniciar todos
    │   ├── pm2-{port}.md             # Iniciar individual + logs
    │   ├── pm2-{port}-stop.md        # Detener individual
    │   ├── pm2-{port}-restart.md     # Reiniciar individual
    │   ├── pm2-logs.md               # Ver todos los logs
    │   └── pm2-status.md             # Ver estado
    └── scripts/
        ├── pm2-logs-{port}.ps1       # Logs de servicio individual
        └── pm2-monit.ps1             # Monitor de PM2
```

---

## Configuración en Windows (IMPORTANTE)

### ecosystem.config.cjs

**Debe usar extensión `.cjs`**

```javascript
module.exports = {
  apps: [
    // Node.js (Vite/Next/Nuxt)
    {
      name: 'project-3000',
      cwd: './packages/web',
      script: 'node_modules/vite/bin/vite.js',
      args: '--port 3000',
      interpreter: 'C:/Program Files/nodejs/node.exe',
      env: { NODE_ENV: 'development' }
    },
    // Python
    {
      name: 'project-8000',
      cwd: './backend',
      script: 'start.cjs',
      interpreter: 'C:/Program Files/nodejs/node.exe',
      env: { PYTHONUNBUFFERED: '1' }
    }
  ]
}
```

**Rutas de scripts por framework:**

| Framework | script | args |
|---|---|---|
| Vite | `node_modules/vite/bin/vite.js` | `--port {port}` |
| Next.js | `node_modules/next/dist/bin/next` | `dev -p {port}` |
| Nuxt | `node_modules/nuxt/bin/nuxt.mjs` | `dev --port {port}` |
| Express | `src/index.js` o `server.js` | - |

### Script Wrapper de Python (start.cjs)

```javascript
const { spawn } = require('child_process');
const proc = spawn('python', ['-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '8000', '--reload'], {
  cwd: __dirname, stdio: 'inherit', windowsHide: true
});
proc.on('close', (code) => process.exit(code));
```

---

## Plantillas de Archivos de Comando (Contenido Mínimo)

### pm2-all.md (Iniciar todos + monitor)
````markdown
Inicia todos los servicios y abre el monitor de PM2.
```bash
cd "{PROJECT_ROOT}" && pm2 start ecosystem.config.cjs && start wt.exe -d "{PROJECT_ROOT}" pwsh -NoExit -c "pm2 monit"
```
````

### pm2-all-stop.md
````markdown
Detiene todos los servicios.
```bash
cd "{PROJECT_ROOT}" && pm2 stop all
```
````

### pm2-all-restart.md
````markdown
Reinicia todos los servicios.
```bash
cd "{PROJECT_ROOT}" && pm2 restart all
```
````

### pm2-{port}.md (Iniciar individual + logs)
````markdown
Inicia {name} ({port}) y abre los logs.
```bash
cd "{PROJECT_ROOT}" && pm2 start ecosystem.config.cjs --only {name} && start wt.exe -d "{PROJECT_ROOT}" pwsh -NoExit -c "pm2 logs {name}"
```
````

### pm2-{port}-stop.md
````markdown
Detiene {name} ({port}).
```bash
cd "{PROJECT_ROOT}" && pm2 stop {name}
```
````

### pm2-{port}-restart.md
````markdown
Reinicia {name} ({port}).
```bash
cd "{PROJECT_ROOT}" && pm2 restart {name}
```
````

### pm2-logs.md
````markdown
Ver todos los logs de PM2.
```bash
cd "{PROJECT_ROOT}" && pm2 logs
```
````

### pm2-status.md
````markdown
Ver estado de PM2.
```bash
cd "{PROJECT_ROOT}" && pm2 status
```
````

### Scripts PowerShell (pm2-logs-{port}.ps1)
```powershell
Set-Location "{PROJECT_ROOT}"
pm2 logs {name}
```

### Scripts PowerShell (pm2-monit.ps1)
```powershell
Set-Location "{PROJECT_ROOT}"
pm2 monit
```

---

## Reglas Clave

1. **Archivo de configuración**: `ecosystem.config.cjs` (no .js)
2. **Node.js**: Especificar la ruta de bin directamente + intérprete
3. **Python**: Script wrapper en Node.js + `windowsHide: true`
4. **Abrir nueva ventana**: `start wt.exe -d "{path}" pwsh -NoExit -c "comando"`
5. **Contenido mínimo**: Cada archivo de comando contiene solo 1-2 líneas de descripción + bloque bash
6. **Ejecución directa**: Sin análisis de IA necesario, solo ejecutar el comando bash

---

## Ejecutar

Según `$ARGUMENTS`, ejecutar la inicialización:

1. Escanear el proyecto en busca de servicios
2. Generar `ecosystem.config.cjs`
3. Generar `{backend}/start.cjs` para servicios Python (si aplica)
4. Generar archivos de comando en `.claude/commands/`
5. Generar archivos de script en `.claude/scripts/`
6. **Actualizar el archivo CLAUDE.md del proyecto** con información de PM2 (ver a continuación)
7. **Mostrar resumen de finalización** con comandos de terminal

---

## Post-Inicialización: Actualizar CLAUDE.md

Tras generar los archivos, anexar la sección de PM2 al `CLAUDE.md` del proyecto (crearlo si no existe):

````markdown
## Servicios PM2

| Puerto | Nombre | Tipo |
|---|---|---|
| {port} | {name} | {type} |

**Comandos de Terminal:**
```bash
pm2 start ecosystem.config.cjs   # Primera vez
pm2 start all                    # Después de la primera vez
pm2 stop all / pm2 restart all
pm2 start {name} / pm2 stop {name}
pm2 logs / pm2 status / pm2 monit
pm2 save                         # Guardar lista de procesos
pm2 resurrect                    # Restaurar lista guardada
```
````

**Reglas para actualizar CLAUDE.md:**
- Si la sección de PM2 ya existe, reemplazarla
- Si no existe, anexar al final
- Mantener el contenido esencial y conciso

---

## Post-Inicialización: Mostrar Resumen

Tras generar todos los archivos, mostrar:

```
## PM2 Init Completado

**Servicios:**

| Puerto | Nombre | Tipo |
|---|---|---|
| {port} | {name} | {type} |

**Comandos de Claude:** /pm2-all, /pm2-all-stop, /pm2-{port}, /pm2-{port}-stop, /pm2-logs, /pm2-status

**Comandos de Terminal:**
## Primera vez (con archivo de configuración)
pm2 start ecosystem.config.cjs && pm2 save

## Después de la primera vez (simplificado)
pm2 start all          # Iniciar todos
pm2 stop all           # Detener todos
pm2 restart all        # Reiniciar todos
pm2 start {name}       # Iniciar individual
pm2 stop {name}        # Detener individual
pm2 logs               # Ver logs
pm2 monit              # Panel de monitor
pm2 resurrect          # Restaurar procesos guardados

**Consejo:** Ejecuta `pm2 save` después del primer inicio para habilitar los comandos simplificados.
```
