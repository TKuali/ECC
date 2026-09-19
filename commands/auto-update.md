---
description: Obtiene los últimos cambios del repositorio de ECC y reinstala los destinos gestionados actuales.
disable-model-invocation: true
---

# Actualización Automática (Auto Update)

Actualiza ECC desde su repositorio ascendente (upstream) y regenera la instalación administrada del contexto actual utilizando la solicitud original de install-state.

## Uso

```bash
# Previsualizar la actualización sin mutar nada
ECC_ROOT="${CLAUDE_PLUGIN_ROOT:-$(node -e "var r=(function(){var p=require('path'),f=require('fs'),o=require('os');var e=process.env.CLAUDE_PLUGIN_ROOT;if(e&&e.trim())return e.trim();var d=p.join(o.homedir(),'.claude');function L(x){try{return require(p.join(x,'scripts','lib','resolve-ecc-root')).resolveEccRoot({probe:p.join('scripts','auto-update.js')})}catch(_){return null}}var r=L(d);if(r)return r;var s=['ecc','ecc@ecc','marketplaces/ecc','everything-claude-code','everything-claude-code@everything-claude-code','marketplaces/everything-claude-code'];for(var i=0;i<s.length;i++){r=L(p.join(d,'plugins',s[i]));if(r)return r}try{var g=['ecc','everything-claude-code'];for(var j=0;j<g.length;j++){var c=p.join(d,'plugins','cache',g[j]);var O=f.readdirSync(c);for(var k=0;k<O.length;k++){var q=p.join(c,O[k]);var V=f.readdirSync(q);for(var m=0;m<V.length;m++){r=L(p.join(q,V[m]));if(r)return r}}}}catch(_){}return d})();console.log(r)")}"
node "$ECC_ROOT/scripts/auto-update.js" --dry-run

# Actualizar únicamente archivos administrados por Cursor en el proyecto actual
node "$ECC_ROOT/scripts/auto-update.js" --target cursor

# Sobrescribir la raíz del repositorio de ECC explícitamente
node "$ECC_ROOT/scripts/auto-update.js" --repo-root /path/to/everything-claude-code
```

## Notas

- Este comando utiliza la solicitud de install-state registrada y vuelve a ejecutar `install-apply.js` tras incorporar los últimos cambios del repositorio.
- La reinstalación es intencional: maneja cambios de nombre y eliminaciones del upstream que `repair.js` no puede reconstruir de manera segura a partir de operaciones desactualizadas únicamente.
- Usa `--dry-run` primero si deseas ver el plan de reinstalación reconstruido antes de realizar cualquier cambio.
