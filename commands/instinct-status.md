---
name: instinct-status
description: Muestra los instintos aprendidos (del proyecto + globales) con su nivel de confianza
command: true
---

# Comando Instinct Status

Muestra los instintos aprendidos para el proyecto actual junto con los instintos globales, agrupados por dominio.

## Implementación

Ejecuta el CLI de instintos, resolviendo la raíz activa del plugin ECC de la misma forma que lo hacen `hooks/hooks.json` y los demás comandos de barra diagonal (`/sessions`, `/skill-health`) — variable de entorno → instalación estándar → raíces de plugins conocidas → caché de plugins → respaldo.
Esto evita la divergencia que ocurre cuando `CLAUDE_PLUGIN_ROOT` no está configurado mientras todavía existe un directorio heredado `~/.claude/skills/continuous-learning-v2/` (#2037).

```bash
ECC_ROOT="${CLAUDE_PLUGIN_ROOT:-$(node -e "var r=(function(){var p=require('path'),f=require('fs'),o=require('os');var e=process.env.CLAUDE_PLUGIN_ROOT;if(e&&e.trim())return e.trim();var d=p.join(o.homedir(),'.claude');function L(x){try{return require(p.join(x,'scripts','lib','resolve-ecc-root')).resolveEccRoot()}catch(_){return null}}var r=L(d);if(r)return r;var s=['ecc','ecc@ecc','marketplaces/ecc','everything-claude-code','everything-claude-code@everything-claude-code','marketplaces/everything-claude-code'];for(var i=0;i<s.length;i++){r=L(p.join(d,'plugins',s[i]));if(r)return r}try{var g=['ecc','everything-claude-code'];for(var j=0;j<g.length;j++){var c=p.join(d,'plugins','cache',g[j]);var O=f.readdirSync(c);for(var k=0;k<O.length;k++){var q=p.join(c,O[k]);var V=f.readdirSync(q);for(var m=0;m<V.length;m++){r=L(p.join(q,V[m]));if(r)return r}}}}catch(_){}return d})();console.log(r)")}"
python3 "$ECC_ROOT/skills/continuous-learning-v2/scripts/instinct-cli.py" status
```

## Uso

```
/instinct-status
```

## Qué Hacer

1. Detectar el contexto del proyecto actual (hash de ruta/remoto git)
2. Leer los instintos del proyecto desde `~/.claude/homunculus/projects/<project-id>/instincts/`
3. Leer los instintos globales desde `~/.claude/homunculus/instincts/`
4. Combinar con reglas de precedencia (el proyecto prevalece sobre lo global ante colisiones de IDs)
5. Mostrar agrupados por dominio con barras de confianza y estadísticas de observación

## Formato de Salida

```
============================================================
  ESTADO DE INSTINTOS - 12 en total
============================================================

  Proyecto: mi-app (a1b2c3d4e5f6)
  Instintos de proyecto: 8
  Instintos globales:    4

## ÁMBITO DE PROYECTO (mi-app)
  ### FLUJO DE TRABAJO (3)
    ███████░░░  70%  grep-before-edit [proyecto]
              disparador: al modificar código

## GLOBAL (aplicables a todos los proyectos)
  ### SEGURIDAD (2)
    █████████░  85%  validate-user-input [global]
              disparador: al manejar entradas de usuario
```
