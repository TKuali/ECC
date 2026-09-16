---
description: Genera un reporte de costos local de Claude Code a partir del registro de métricas de cost-tracker de ECC.
argument-hint: [csv]
---

# Reporte de Costos (Cost Report)

Resume el gasto local de Claude Code por día, modelo y sesión a partir del registro de métricas generado por el hook `stop:cost-tracker` de ECC.

## Dónde viven los datos

El rastreador añade un objeto JSON por cada finalización de sesión en `~/.claude/metrics/costs.jsonl`. Cada fila es una **captura acumulativa para esa sesión**, por lo que el informe toma la **última fila por cada `session_id`** y suma a través de las sesiones (sumar cada fila contaría varias veces).

Esquema de fila:
`{ timestamp, session_id, transcript_path, model, input_tokens, output_tokens, cache_write_tokens, cache_read_tokens, estimated_cost_usd }`

## Qué hace este comando

1. Verifica que exista `~/.claude/metrics/costs.jsonl`. Si no existe, informa al usuario que el rastreador aún no está configurado (se llena tras finalizar la primera sesión con el hook `stop:cost-tracker` habilitado).
2. Reduce las filas a la captura más reciente por sesión y realiza la agregación.
3. Presenta un reporte compacto, o exporta las filas recientes como CSV cuando el argumento es `csv`.

Se utiliza `node` en lugar de `sqlite3`/`jq` para que funcione de manera idéntica en macOS, Linux y Windows.

## Reporte

```bash
node -e '
const fs=require("fs"),os=require("os"),path=require("path");
const f=path.join(os.homedir(),".claude","metrics","costs.jsonl");
if(!fs.existsSync(f)){console.log("Cost tracker not set up: "+f+" not found. Enable the stop:cost-tracker hook and finish a session first.");process.exit(0);}
const rows=fs.readFileSync(f,"utf8").split(/\r?\n/).filter(Boolean).map(l=>{try{return JSON.parse(l)}catch{return null}}).filter(Boolean);
const bySession=new Map();
for(const r of rows){const k=r.session_id||r.transcript_path||r.timestamp;const p=bySession.get(k);if(!p||String(r.timestamp)>String(p.timestamp))bySession.set(k,r);}
const latest=[...bySession.values()];
const cost=r=>Number(r.estimated_cost_usd)||0;
const day=r=>String(r.timestamp||"").slice(0,10);
const today=new Date().toISOString().slice(0,10);
const d=new Date(Date.now()-864e5).toISOString().slice(0,10);
const sum=a=>a.reduce((s,r)=>s+cost(r),0);
const f4=n=>"$"+n.toFixed(4);
console.log("=== Cost summary ===");
console.log("today:     "+f4(sum(latest.filter(r=>day(r)===today))));
console.log("yesterday: "+f4(sum(latest.filter(r=>day(r)===d))));
console.log("total:     "+f4(sum(latest))+"  ("+latest.length+" sessions)");
const by=(key)=>{const m=new Map();for(const r of latest){const k=key(r)||"(unknown)";m.set(k,(m.get(k)||0)+cost(r));}return [...m.entries()].sort((a,b)=>b[1]-a[1]);};
console.log("\n=== By model ===");for(const [k,v] of by(r=>r.model))console.log(f4(v).padStart(12)+"  "+k);
console.log("\n=== Last 7 days ===");
const days=new Map();for(const r of latest){const k=day(r);days.set(k,(days.get(k)||0)+cost(r));}
[...days.entries()].sort((a,b)=>b[0]<a[0]?-1:1).slice(0,7).forEach(([k,v])=>console.log(k+"  "+f4(v)));
'
```

## Exportación CSV (`/cost-report csv`)

```bash
node -e '
const fs=require("fs"),os=require("os"),path=require("path");
const f=path.join(os.homedir(),".claude","metrics","costs.jsonl");
if(!fs.existsSync(f)){console.error("no data");process.exit(0);}
const rows=fs.readFileSync(f,"utf8").split(/\r?\n/).filter(Boolean).map(l=>{try{return JSON.parse(l)}catch{return null}}).filter(Boolean).slice(-100);
console.log("timestamp,session_id,model,input_tokens,output_tokens,cache_write_tokens,cache_read_tokens,estimated_cost_usd");
for(const r of rows)console.log([r.timestamp,r.session_id,r.model,r.input_tokens,r.output_tokens,r.cache_write_tokens,r.cache_read_tokens,r.estimated_cost_usd].join(","));
'
```

## Formato del Reporte

1. Resumen: hoy, ayer, total, conteo de sesiones.
2. Por modelo: modelos ordenados por costo total.
3. Últimos siete días: fecha y costo.

Confía en los valores precalculados de `estimated_cost_usd` registrados por el rastreador; no reestimes precios a partir de tokens brutos aquí.
