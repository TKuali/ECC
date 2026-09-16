#!/usr/bin/env node
/**
 * find-dupes.mjs — duplicate-code scanner for the dry-refactor skill.
 *
 * Zero dependencies. Node >= 18. Uses only node:fs, node:path, node:crypto,
 * node:child_process (git, optional).
 *
 * PASSES
 *   exact       (default)  text-level. Lines are trimmed, blank lines dropped,
 *                          nothing else is normalized. Works on .js .jsx .ts .tsx.
 *                          Can match inside comments and strings — judgment is
 *                          the skill's job, not the scanner's.
 *   normalized  (--normalized, EXPERIMENTAL, ADVISORY) token-level for .js .jsx
 *                          only. Renames a deliberately restricted subset of local
 *                          identifiers to positional placeholders so renamed copies
 *                          can match. Anything it cannot resolve reliably is left
 *                          untouched or the file is skipped with a reason. Never
 *                          authorizes extraction on its own.
 *
 * OUTPUT (default dir .dry-refactor/)
 *   raw-findings.json   scanner evidence only — never edited by the skill
 *   coverage.json       files scanned / ignored / failed, normalization coverage
 *   stdout              markdown summary (or JSON with --json)
 *
 * USAGE
 *   node find-dupes.mjs [paths...] [options]
 *     --min-lines N        exact pass window (default 6)
 *     --min-tokens N       normalized pass window (default 40)
 *     --min-chars N        drop blocks with fewer non-space chars (default 120)
 *     --normalized         also run the experimental normalized pass
 *     --changed            mark findings touching uncommitted changes (vs HEAD)
 *     --diff-base REF      mark findings touching changes vs REF (e.g. main)
 *     --changed-only       print only findings that intersect changes
 *     --ignore GLOB        extra ignore pattern (repeatable)
 *     --out DIR            output directory (default .dry-refactor)
 *     --baseline FILE      compare against a previous raw-findings.json
 *     --json               print raw JSON to stdout instead of markdown
 *     --top N              findings shown in markdown (default 25)
 *     --dump-eligible      print normalized-pass eligible names per file (debug)
 *     --no-write           do not write output files
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const VERSION = '1.0.0';

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

export function parseArgs(argv) {
  const opts = {
    paths: [],
    minLines: 6,
    minTokens: 40,
    minChars: 120,
    normalized: false,
    changed: false,
    diffBase: null,
    changedOnly: false,
    ignore: [],
    out: '.dry-refactor',
    baseline: null,
    json: false,
    top: 25,
    dumpEligible: false,
    write: true,
    maxBucket: 500,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case '--min-lines': opts.minLines = Number(next()); break;
      case '--min-tokens': opts.minTokens = Number(next()); break;
      case '--min-chars': opts.minChars = Number(next()); break;
      case '--normalized': opts.normalized = true; break;
      case '--changed': opts.changed = true; break;
      case '--diff-base': opts.diffBase = next(); break;
      case '--changed-only': opts.changedOnly = true; break;
      case '--ignore': opts.ignore.push(next()); break;
      case '--out': opts.out = next(); break;
      case '--baseline': opts.baseline = next(); break;
      case '--json': opts.json = true; break;
      case '--top': opts.top = Number(next()); break;
      case '--dump-eligible': opts.dumpEligible = true; break;
      case '--no-write': opts.write = false; break;
      case '--max-bucket': opts.maxBucket = Number(next()); break;
      case '-h': case '--help': opts.help = true; break;
      default:
        if (a.startsWith('--')) throw new Error(`Unknown option: ${a}`);
        opts.paths.push(a);
    }
  }
  if (opts.paths.length === 0) opts.paths = ['.'];
  return opts;
}

// ---------------------------------------------------------------------------
// File collection
// ---------------------------------------------------------------------------

export const EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);
export const NORMALIZED_EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.cjs']);

export const DEFAULT_IGNORES = [
  '**/node_modules/**', '**/dist/**', '**/build/**', '**/coverage/**', '**/.git/**',
  '**/.next/**', '**/out/**', '**/.dry-refactor/**',
  '**/*.min.js', '**/*.test.*', '**/*.spec.*', '**/*.stories.*',
  '**/__tests__/**', '**/__mocks__/**', '**/*.d.ts', '**/*.generated.*',
  '**/package-lock.json', '**/yarn.lock', '**/pnpm-lock.yaml',
];

export function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        i++;
        if (glob[i + 1] === '/') { i++; re += '(?:.*/)?'; } else re += '.*';
      } else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else if ('.+^${}()|[]\\'.includes(c)) re += '\\' + c;
    else re += c;
  }
  return new RegExp('^' + re + '$');
}

function toPosix(p) { return p.split(path.sep).join('/'); }

export function collectFiles(paths, extraIgnores = []) {
  const ignores = [...DEFAULT_IGNORES, ...extraIgnores].map((g) => ({ g, re: globToRegExp(g) }));
  const files = [];
  const ignored = [];
  const failed = [];
  const seen = new Set();

  const isIgnored = (absPath) => {
    const rel = toPosix(path.relative(process.cwd(), absPath)) || '.';
    const candidates = [rel, toPosix(absPath)];
    for (const { g, re } of ignores) {
      if (candidates.some((c) => re.test(c))) return g;
    }
    return null;
  };

  const walk = (p) => {
    let st;
    try { st = fs.statSync(p); } catch (e) { failed.push({ file: p, reason: `stat failed: ${e.message}` }); return; }
    if (st.isDirectory()) {
      const why = isIgnored(p);
      if (why) { ignored.push({ file: p, reason: `ignored by ${why}` }); return; }
      let entries;
      try { entries = fs.readdirSync(p, { withFileTypes: true }); } catch (e) { failed.push({ file: p, reason: `readdir failed: ${e.message}` }); return; }
      entries.sort((a, b) => a.name.localeCompare(b.name));
      for (const ent of entries) walk(path.join(p, ent.name));
      return;
    }
    if (!st.isFile()) return;
    const ext = path.extname(p).toLowerCase();
    if (!EXTENSIONS.has(ext)) return; // silently skip non-source files
    const why = isIgnored(p);
    if (why) { ignored.push({ file: p, reason: `ignored by ${why}` }); return; }
    if (seen.has(p)) return;
    seen.add(p);
    files.push(p);
  };

  for (const p of paths) walk(path.resolve(p));
  return { files, ignored, failed };
}

export function sha1(s) { return crypto.createHash('sha1').update(s).digest('hex'); }

// ---------------------------------------------------------------------------
// Generic pairwise clone detection over unit sequences
// ---------------------------------------------------------------------------
//
// docs: [{ id, units: [...], unitText(j) }]  — units are comparable strings or
// tokens. `keyOf(doc, i, W)` returns a window hash. `extend(...)` grows a pair.
//
// Returns classes: [{ contentKey, span, locations:[{doc, start, end}] }]
// where start/end are unit indexes, end exclusive.

function detectPairs(docs, W, keyOf, unitsEqual, initPairState, opts) {
  const buckets = new Map();
  for (let d = 0; d < docs.length; d++) {
    const n = docs[d].units.length;
    for (let i = 0; i + W <= n; i++) {
      const k = keyOf(docs[d], i, W);
      let arr = buckets.get(k);
      if (!arr) { arr = []; buckets.set(k, arr); }
      arr.push([d, i]);
    }
  }

  const covered = new Map(); // `${dA}|${dB}|${iA-iB}` -> Set of iA covered
  const pairs = [];
  const largeBuckets = [];

  for (const [, arr] of buckets) {
    if (arr.length < 2) continue;
    if (arr.length > opts.maxBucket) { largeBuckets.push(arr.length); continue; }
    for (let x = 0; x < arr.length; x++) {
      for (let y = x + 1; y < arr.length; y++) {
        let [dA, iA] = arr[x];
        let [dB, iB] = arr[y];
        if (dA === dB && iA === iB) continue;
        if (dA > dB || (dA === dB && iA > iB)) { [dA, iA, dB, iB] = [dB, iB, dA, iA]; }
        if (dA === dB && iB - iA < W) continue; // overlapping self-window
        const ck = `${dA}|${dB}|${iA - iB}`;
        let cov = covered.get(ck);
        if (cov && cov.has(iA)) continue;

        const A = docs[dA], B = docs[dB];
        const state = initPairState(A, iA, B, iB, W);
        if (!state) continue; // initial window not consistent under pair rules
        let sA = iA, sB = iB, eA = iA + W, eB = iB + W;
        // forward
        while (eA < A.units.length && eB < B.units.length) {
          if (dA === dB && eA >= sB) break;
          if (!unitsEqual(A, eA, B, eB, state)) break;
          eA++; eB++;
        }
        // backward
        while (sA > 0 && sB > 0) {
          if (dA === dB && eA > sB - 1) break;
          if (!unitsEqual(A, sA - 1, B, sB - 1, state)) break;
          sA--; sB--;
        }
        if (dA === dB && eA > sB) { // safety: clip self overlap
          eA = sB; eB = sB + (eA - sA);
        }
        if (!cov) { cov = new Set(); covered.set(ck, cov); }
        for (let p = sA; p < eA; p++) cov.add(p);
        pairs.push({ dA, sA, eA, dB, sB, eB, state });
      }
    }
  }
  return { pairs, largeBuckets };
}

// ---------------------------------------------------------------------------
// EXACT pass (line-based)
// ---------------------------------------------------------------------------

export function prepareExactDoc(id, source) {
  const lines = source.split(/\r?\n/);
  const units = [];
  const lineNo = [];
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t === '') continue;
    units.push(t);
    lineNo.push(i + 1);
  }
  return { id, units, lineNo };
}

export function scanExact(docs, opts) {
  const W = opts.minLines;
  const keyOf = (doc, i, W) => sha1(doc.units.slice(i, i + W).join('\n'));
  const unitsEqual = (A, a, B, b) => A.units[a] === B.units[b];
  const initPairState = () => ({});
  const { pairs, largeBuckets } = detectPairs(docs, W, keyOf, unitsEqual, initPairState, opts);

  // group by content
  const classes = new Map();
  for (const p of pairs) {
    const A = docs[p.dA], B = docs[p.dB];
    const content = A.units.slice(p.sA, p.eA).join('\n');
    const key = sha1(content);
    let cls = classes.get(key);
    if (!cls) { cls = { contentKey: key, content, locations: new Map() }; classes.set(key, cls); }
    cls.locations.set(`${p.dA}:${p.sA}`, { d: p.dA, s: p.sA, e: p.eA });
    cls.locations.set(`${p.dB}:${p.sB}`, { d: p.dB, s: p.sB, e: p.eB });
    void B;
  }

  const findings = [];
  for (const cls of classes.values()) {
    const locs = [...cls.locations.values()];
    if (locs.length < 2) continue;
    const chars = cls.content.replace(/\s+/g, '').length;
    if (chars < opts.minChars) continue;
    const span = locs[0].e - locs[0].s;
    findings.push({
      id: 'D-' + cls.contentKey.slice(0, 8),
      match_type: 'exact',
      advisory: false,
      lines: span,
      approx_tokens: (cls.content.match(/[\p{L}\p{N}_$]+|[^\s\p{L}\p{N}_$]/gu) || []).length,
      chars,
      content_hash: cls.contentKey,
      locations: locs.map((l) => ({
        file: docs[l.d].id,
        start_line: docs[l.d].lineNo[l.s],
        end_line: docs[l.d].lineNo[l.e - 1],
      })),
      preview: cls.content.split('\n').slice(0, 3).join('\n'),
    });
  }
  return { findings, largeBuckets };
}

// ---------------------------------------------------------------------------
// NORMALIZED pass (token-based, EXPERIMENTAL)
// ---------------------------------------------------------------------------

export const KEYWORDS = new Set([
  'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do',
  'else', 'enum', 'export', 'extends', 'false', 'finally', 'for', 'function', 'if', 'implements', 'import',
  'in', 'instanceof', 'interface', 'let', 'new', 'null', 'package', 'private', 'protected', 'public',
  'return', 'static', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void', 'while',
  'with', 'yield',
  // contextual / never-normalize
  'of', 'from', 'as', 'get', 'set', 'async', 'undefined', 'NaN', 'Infinity', 'arguments', 'globalThis',
]);

const PUNCTUATORS = [
  '>>>=', '...', '===', '!==', '**=', '<<=', '>>=', '>>>', '&&=', '||=', '??=',
  '=>', '==', '!=', '<=', '>=', '&&', '||', '??', '?.', '++', '--', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '**', '<<', '>>',
  '{', '}', '(', ')', '[', ']', ';', ',', '<', '>', '+', '-', '*', '/', '%', '&', '|', '^', '!', '~', '?', ':', '=', '.', '@', '#',
];

const REGEX_ALLOWED_PREV_PUNCT = new Set(['(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '^', '~',
  '=>', '==', '===', '!=', '!==', '&&', '||', '??', '+=', '-=', '*=', '/=', '%=', '<<', '>>', '>>>', '...']);
const REGEX_ALLOWED_PREV_KW = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw', 'case', 'do', 'else', 'await', 'yield']);

const ID_START = /[\p{L}_$]/u;
const ID_PART = /[\p{L}\p{N}_$\u200C\u200D]/u;

/**
 * Lex JavaScript/JSX into tokens. Comments and whitespace are dropped.
 * Returns { tokens, error } — on error the file must be skipped for normalization.
 */
export function lex(src) {
  const tokens = [];
  let i = 0, line = 1;
  const n = src.length;
  const push = (t, v) => tokens.push({ t, v, line });
  const prevSig = () => tokens[tokens.length - 1];

  const regexAllowed = () => {
    const p = prevSig();
    if (!p) return true;
    if (p.t === 'p') return REGEX_ALLOWED_PREV_PUNCT.has(p.v);
    if (p.t === 'kw') return REGEX_ALLOWED_PREV_KW.has(p.v);
    return false;
  };

  const scanTemplate = (start) => { // start at backtick, returns end index (after closing backtick) or -1
    let j = start + 1;
    while (j < n) {
      const c = src[j];
      if (c === '\\') { j += 2; continue; }
      if (c === '`') return j + 1;
      if (c === '\n') line++;
      if (c === '$' && src[j + 1] === '{') {
        j += 2;
        let depth = 1;
        while (j < n && depth > 0) {
          const d = src[j];
          if (d === '\\') { j += 2; continue; }
          if (d === '`') { const e = scanTemplate(j); if (e < 0) return -1; j = e; continue; }
          if (d === '"' || d === "'") { const e = scanString(j); if (e < 0) return -1; j = e; continue; }
          if (d === '{') depth++;
          else if (d === '}') depth--;
          else if (d === '\n') line++;
          j++;
        }
        if (depth > 0) return -1;
        continue;
      }
      j++;
    }
    return -1;
  };

  const scanString = (start) => { // returns end index (after quote) or -1
    const q = src[start];
    let j = start + 1;
    while (j < n) {
      const c = src[j];
      if (c === '\\') { j += 2; continue; }
      if (c === q) return j + 1;
      if (c === '\n') return -1;
      j++;
    }
    return -1;
  };

  while (i < n) {
    const c = src[i];
    if (c === '\n') { line++; i++; continue; }
    if (c === ' ' || c === '\t' || c === '\r' || c === '\f' || c === '\v' || c === '\u00a0' || c === '\ufeff') { i++; continue; }
    // comments
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      if (end < 0) return { tokens, error: `unterminated block comment at line ${line}` };
      for (let k = i; k < end; k++) if (src[k] === '\n') line++;
      i = end + 2; continue;
    }
    // strings
    if (c === '"' || c === "'") {
      const e = scanString(i);
      if (e < 0) {
        // JSX text recovery: an apostrophe in tag text on the same line as a ">"
        // (e.g. <p>Don't panic</p>) is not a string. Treat the quote as punctuation.
        const sameLineTagClose = tokens.some((t) => t.line === line && t.t === 'p' && (t.v === '>' || t.v === '/>'));
        if (sameLineTagClose) { push('p', c); i++; continue; }
        return { tokens, error: `unterminated string at line ${line} (possible multi-line JSX text with an apostrophe)` };
      }
      push('str', src.slice(i, e)); i = e; continue;
    }
    if (c === '`') {
      const startLine = line;
      const e = scanTemplate(i);
      if (e < 0) return { tokens, error: `unterminated template literal at line ${startLine}` };
      tokens.push({ t: 'tpl', v: src.slice(i, e), line: startLine }); i = e; continue;
    }
    // numbers
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) {
      const m = /^(0[xX][0-9a-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|(?:[0-9][0-9_]*\.?[0-9_]*|\.[0-9][0-9_]*)(?:[eE][+-]?[0-9_]+)?)n?/.exec(src.slice(i));
      push('num', m[0]); i += m[0].length; continue;
    }
    // identifiers / keywords / private names
    if (ID_START.test(c) || (c === '#' && ID_START.test(src[i + 1] || ''))) {
      let j = i + (c === '#' ? 1 : 0);
      while (j < n && ID_PART.test(src[j])) j++;
      const word = src.slice(i, j);
      if (c === '#') push('priv', word);
      else if (KEYWORDS.has(word)) push('kw', word);
      else push('id', word);
      i = j; continue;
    }
    // JSX self-closing tag end: "/>" is never division-then-greater in valid JS
    if (c === '/' && src[i + 1] === '>') { push('p', '/>'); i += 2; continue; }
    // regex literal
    if (c === '/' && regexAllowed()) {
      let j = i + 1, inClass = false, ok = false;
      while (j < n) {
        const d = src[j];
        if (d === '\\') { j += 2; continue; }
        if (d === '\n') break;
        if (inClass) { if (d === ']') inClass = false; }
        else if (d === '[') inClass = true;
        else if (d === '/') { ok = true; break; }
        j++;
      }
      if (!ok) return { tokens, error: `unterminated regex literal at line ${line}` };
      j++;
      while (j < n && ID_PART.test(src[j])) j++;
      push('re', src.slice(i, j)); i = j; continue;
    }
    // punctuators
    let matched = null;
    for (const p of PUNCTUATORS) { if (src.startsWith(p, i)) { matched = p; break; } }
    if (matched) { push('p', matched); i += matched.length; continue; }
    return { tokens, error: `unexpected character ${JSON.stringify(c)} at line ${line}` };
  }
  return { tokens, error: null };
}

const PAIRS = { '(': ')', '{': '}', '[': ']' };

/** One pass over the tokens: index of opening bracket -> index of its match (or -1). */
function buildMatchMap(tokens) {
  const map = new Map();
  const stack = [];
  for (let k = 0; k < tokens.length; k++) {
    const t = tokens[k];
    if (t.t !== 'p') continue;
    if (PAIRS[t.v]) { stack.push([t.v, k]); continue; }
    if (t.v === ')' || t.v === '}' || t.v === ']') {
      // pop until a matching opener (tolerates unbalanced input)
      for (let s = stack.length - 1; s >= 0; s--) {
        if (PAIRS[stack[s][0]] === t.v) { map.set(stack[s][1], k); stack.length = s; break; }
      }
    }
  }
  return map;
}

function findMatching(tokens, openIdx, open, close, matchMap) {
  if (matchMap) { const m = matchMap.get(openIdx); return m === undefined ? -1 : m; }
  let depth = 0;
  for (let k = openIdx; k < tokens.length; k++) {
    const t = tokens[k];
    if (t.t !== 'p') continue;
    if (t.v === open) depth++;
    else if (t.v === close) { depth--; if (depth === 0) return k; }
  }
  return -1;
}

/**
 * Compute the set of identifier names eligible for normalization in one file.
 *
 * Restricted subset (v1): a name is eligible only if it is declared EXACTLY ONCE
 * via a simple `const/let/var x`, `function x`, a simple non-destructured
 * parameter, `catch (x)`, or `x =>`, AND it never appears in any excluded
 * position anywhere in the file. Excluded positions refuse to guess: property
 * access, property keys/labels, JSX tags/attributes/text, shorthand or
 * destructuring patterns, imports/exports, class names, call position
 * (callee names are preserved), and adjacent identifiers.
 *
 * Returns { eligible:Set, declared:Map, excluded:Set }
 */
export function computeEligible(tokens) {
  const declared = new Map();
  const excluded = new Set();
  const matchMap = buildMatchMap(tokens);
  // innermost enclosing bracket for each token index ('{', '(', '[' or null)
  const enclosing = new Array(tokens.length).fill(null);
  {
    const stack = [];
    for (let k = 0; k < tokens.length; k++) {
      const t = tokens[k];
      enclosing[k] = stack.length ? stack[stack.length - 1] : null;
      if (t.t !== 'p') continue;
      if (PAIRS[t.v]) stack.push(t.v);
      else if (t.v === ')' || t.v === '}' || t.v === ']') {
        for (let q = stack.length - 1; q >= 0; q--) if (PAIRS[stack[q]] === t.v) { stack.length = q; break; }
      }
    }
  }
  const decl = (name) => declared.set(name, (declared.get(name) || 0) + 1);
  const excl = (name) => excluded.add(name);
  const isId = (t) => t && t.t === 'id';
  const isP = (t, v) => t && t.t === 'p' && t.v === v;
  const isKw = (t, v) => t && t.t === 'kw' && t.v === v;

  const excludeRange = (a, b) => { for (let k = a; k <= b; k++) if (isId(tokens[k])) excl(tokens[k].v); };

  const handleParams = (openIdx) => {
    const close = findMatching(tokens, openIdx, '(', ')', matchMap);
    if (close < 0) { excludeRange(openIdx, tokens.length - 1); return close; }
    let simple = true;
    for (let k = openIdx + 1; k < close; k++) {
      const t = tokens[k];
      if (t.t === 'p' && (t.v === '{' || t.v === '[' || t.v === '=' || t.v === '...' || t.v === '(')) { simple = false; break; }
    }
    if (!simple) { excludeRange(openIdx + 1, close - 1); return close; }
    for (let k = openIdx + 1; k < close; k++) if (isId(tokens[k])) decl(tokens[k].v);
    return close;
  };

  for (let k = 0; k < tokens.length; k++) {
    const t = tokens[k];
    const prev = tokens[k - 1];
    const next = tokens[k + 1];

    if (t.t === 'kw') {
      if (t.v === 'const' || t.v === 'let' || t.v === 'var') {
        if (isId(next)) {
          const after = tokens[k + 2];
          if (after && ((after.t === 'p' && [',', ';', '=', ')'].includes(after.v)) || (after.t === 'kw' && (after.v === 'of' || after.v === 'in')))) decl(next.v);
          else excl(next.v);
        } else if (next && next.t === 'p' && (next.v === '{' || next.v === '[')) {
          const close = findMatching(tokens, k + 1, next.v, next.v === '{' ? '}' : ']', matchMap);
          excludeRange(k + 1, close < 0 ? tokens.length - 1 : close);
        }
      } else if (t.v === 'function') {
        let j = k + 1;
        if (isP(tokens[j], '*')) j++;
        if (isId(tokens[j])) { decl(tokens[j].v); j++; }
        if (isP(tokens[j], '(')) handleParams(j);
      } else if (t.v === 'catch') {
        if (isP(next, '(') && isId(tokens[k + 2]) && isP(tokens[k + 3], ')')) decl(tokens[k + 2].v);
        else if (isP(next, '(')) { const close = findMatching(tokens, k + 1, '(', ')', matchMap); excludeRange(k + 1, close < 0 ? tokens.length - 1 : close); }
      } else if (t.v === 'class') {
        if (isId(next)) excl(next.v);
      } else if (t.v === 'import') {
        if (isP(next, '(')) continue; // dynamic import
        let j = k + 1;
        while (j < tokens.length && !isKw(tokens[j], 'from') && !isP(tokens[j], ';') && tokens[j].t !== 'str') { if (isId(tokens[j])) excl(tokens[j].v); j++; }
      } else if (t.v === 'export') {
        if (isKw(next, 'default')) { if (isId(tokens[k + 2])) excl(tokens[k + 2].v); }
        else if (isP(next, '{')) { const close = findMatching(tokens, k + 1, '{', '}', matchMap); excludeRange(k + 1, close < 0 ? tokens.length - 1 : close); }
        else if (next && next.t === 'kw' && ['const', 'let', 'var', 'class'].includes(next.v)) { if (isId(tokens[k + 2])) excl(tokens[k + 2].v); }
        else if (isKw(next, 'function') || (isKw(next, 'async') && isKw(tokens[k + 2], 'function'))) {
          let j = isKw(next, 'function') ? k + 2 : k + 3;
          if (isP(tokens[j], '*')) j++;
          if (isId(tokens[j])) excl(tokens[j].v);
        }
      }
      continue;
    }

    if (t.t === 'p' && t.v === '(') {
      const close = findMatching(tokens, k, '(', ')', matchMap);
      if (close > 0 && isP(tokens[close + 1], '=>')) {
        // arrow params, unless this "(" is a call/declaration handled elsewhere
        const p = tokens[k - 1];
        const isCallOrDecl = isId(p) || (p && p.t === 'kw' && p.v === 'function') || isP(p, ')') || isP(p, ']');
        if (!isCallOrDecl) handleParams(k);
      }
      continue;
    }

    if (t.t !== 'id') continue;
    const name = t.v;

    // single-identifier arrow param:  x => ...
    if (isP(next, '=>') && !isP(prev, ')')) decl(name);

    // --- exclusion contexts ---
    if (prev && prev.t === 'p' && (prev.v === '.' || prev.v === '?.')) excl(name);
    if (isP(next, ':')) excl(name);
    if (isP(next, '(')) excl(name);                           // callee names preserved
    if (isP(prev, '<')) excl(name);                           // JSX tag
    if (isP(prev, '/') && isP(tokens[k - 2], '<')) excl(name); // JSX closing tag
    if (isP(prev, '>')) excl(name);                           // JSX text (and comparisons — safe loss)
    if (isP(next, '=') && prev && (prev.t === 'id' || prev.t === 'str' || isP(prev, '}') || isP(prev, '>'))) excl(name); // JSX attribute
    if (isId(prev) || isId(next)) excl(name);                 // adjacent identifiers (JSX text / boolean attrs)
    if (enclosing[k] === '{' && prev && prev.t === 'p' && (prev.v === '{' || prev.v === ',') && next && next.t === 'p' && (next.v === ',' || next.v === '}')) excl(name); // shorthand / destructuring inside { }
  }

  const eligible = new Set();
  for (const [name, count] of declared) {
    if (count === 1 && !excluded.has(name) && !KEYWORDS.has(name)) eligible.add(name);
  }
  return { eligible, declared, excluded };
}

export function prepareNormalizedDoc(id, source) {
  const { tokens, error } = lex(source);
  if (error) return { id, error, units: [] };
  const { eligible } = computeEligible(tokens);
  return { id, tokens, eligible, units: tokens, error: null };
}

// Relabel eligible identifiers in a token window by order of first appearance.
function relabelWindow(doc, i, W) {
  const map = new Map();
  const out = new Array(W);
  for (let k = 0; k < W; k++) {
    const t = doc.units[i + k];
    if (t.t === 'id' && doc.eligible.has(t.v)) {
      let lbl = map.get(t.v);
      if (!lbl) { lbl = '$' + (map.size + 1); map.set(t.v, lbl); }
      out[k] = lbl;
    } else out[k] = t.t === 'tpl' ? t.v.replace(/\s+/g, ' ') : t.v;
  }
  return out;
}

export function scanNormalized(docs, opts) {
  const W = opts.minTokens;
  const live = docs.filter((d) => !d.error);
  const keyOf = (doc, i, W) => sha1(relabelWindow(doc, i, W).join(' '));

  // A pair state is a bijection between eligible identifiers of A and B.
  const tokEqual = (A, a, B, b, state) => {
    const ta = A.units[a], tb = B.units[b];
    const ea = ta.t === 'id' && A.eligible.has(ta.v);
    const eb = tb.t === 'id' && B.eligible.has(tb.v);
    if (ea !== eb) return false;
    if (!ea) return ta.t === tb.t && ta.v === tb.v;
    const mapped = state.ab.get(ta.v);
    if (mapped !== undefined) return mapped === tb.v;
    if (state.ba.has(tb.v)) return false;
    state.ab.set(ta.v, tb.v); state.ba.set(tb.v, ta.v);
    return true;
  };
  const initPairState = (A, iA, B, iB, W) => {
    const state = { ab: new Map(), ba: new Map() };
    for (let k = 0; k < W; k++) if (!tokEqual(A, iA + k, B, iB + k, state)) return null;
    return state;
  };
  // Backward extension must not break the bijection; tokEqual handles it (adds mappings).
  const { pairs, largeBuckets } = detectPairs(live, W, keyOf, tokEqual, initPairState, opts);

  const classes = new Map();
  for (const p of pairs) {
    const A = live[p.dA];
    const content = relabelWindow(A, p.sA, p.eA - p.sA).join(' ');
    const key = sha1(content);
    let cls = classes.get(key);
    if (!cls) { cls = { contentKey: key, content, locations: new Map() }; classes.set(key, cls); }
    cls.locations.set(`${p.dA}:${p.sA}`, { d: p.dA, s: p.sA, e: p.eA });
    cls.locations.set(`${p.dB}:${p.sB}`, { d: p.dB, s: p.sB, e: p.eB });
  }

  const findings = [];
  for (const cls of classes.values()) {
    const locs = [...cls.locations.values()];
    if (locs.length < 2) continue;
    const chars = cls.content.replace(/\s+/g, '').length;
    if (chars < opts.minChars) continue;
    findings.push({
      id: 'N-' + cls.contentKey.slice(0, 8),
      match_type: 'normalized',
      advisory: true,
      tokens: locs[0].e - locs[0].s,
      chars,
      content_hash: cls.contentKey,
      locations: locs.map((l) => {
        const doc = live[l.d];
        return {
          file: doc.id,
          start_line: doc.units[l.s].line,
          end_line: doc.units[l.e - 1].line,
          start_token: l.s,
          end_token: l.e,
        };
      }),
      preview: cls.content.slice(0, 160),
    });
  }
  for (const f of findings) f.lines = Math.max(...f.locations.map((l) => l.end_line - l.start_line + 1));
  return { findings, largeBuckets };
}

// ---------------------------------------------------------------------------
// Changes (git)
// ---------------------------------------------------------------------------

export function parseUnifiedDiff(text) {
  const ranges = new Map(); // path -> [[start,end],...]
  let current = null;
  for (const line of text.split('\n')) {
    if (line.startsWith('+++ ')) {
      const p = line.slice(4).trim();
      current = p === '/dev/null' ? null : p.replace(/^b\//, '');
      if (current && !ranges.has(current)) ranges.set(current, []);
      continue;
    }
    if (!current) continue;
    const m = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(line);
    if (m) {
      const start = Number(m[1]);
      const count = m[2] === undefined ? 1 : Number(m[2]);
      if (count > 0) ranges.get(current).push([start, start + count - 1]);
    }
  }
  return ranges;
}

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}

export function getChangedRanges(opts) {
  if (!opts.changed && !opts.diffBase) return null;
  let root;
  try { root = git(['rev-parse', '--show-toplevel'], process.cwd()).trim(); }
  catch { return { error: 'not a git repository (changes could not be determined)', root: null, ranges: new Map() }; }
  const ref = opts.diffBase || 'HEAD';
  let diff = '';
  try { diff = git(['diff', '-U0', '--no-color', ref, '--'], root); }
  catch (e) { return { error: `git diff against ${ref} failed`, root, ranges: new Map() }; }
  const ranges = parseUnifiedDiff(diff);
  try {
    const untracked = git(['ls-files', '--others', '--exclude-standard'], root).split('\n').filter(Boolean);
    for (const u of untracked) ranges.set(u, [[1, Number.MAX_SAFE_INTEGER]]);
  } catch { /* ignore */ }
  return { error: null, root, ref, ranges };
}

export function markChanges(findings, changes) {
  if (!changes || !changes.root) return;
  for (const f of findings) {
    let any = false;
    for (const loc of f.locations) {
      const rel = toPosix(path.relative(changes.root, path.resolve(loc.file)));
      const rs = changes.ranges.get(rel);
      loc.in_changes = !!(rs && rs.some(([s, e]) => s <= loc.end_line && e >= loc.start_line));
      if (loc.in_changes) any = true;
    }
    f.intersects_changes = any;
  }
}

// ---------------------------------------------------------------------------
// Baseline compare
// ---------------------------------------------------------------------------

export function compareBaseline(prevJson, findings) {
  const prevIds = new Set((prevJson.findings || []).map((f) => f.id));
  const curIds = new Set(findings.map((f) => f.id));
  return {
    eliminated: [...prevIds].filter((id) => !curIds.has(id)),
    new: [...curIds].filter((id) => !prevIds.has(id)),
    remaining: [...curIds].filter((id) => prevIds.has(id)),
  };
}

// ---------------------------------------------------------------------------
// Subsumption: normalized findings fully inside a single exact finding
// ---------------------------------------------------------------------------

export function markSubsumed(findings) {
  const exact = findings.filter((f) => f.match_type === 'exact');
  for (const f of findings) {
    if (f.match_type !== 'normalized') continue;
    for (const ex of exact) {
      const ok = f.locations.every((l) => ex.locations.some((el) => {
        if (el.file !== l.file) return false;
        const overlap = Math.min(el.end_line, l.end_line) - Math.max(el.start_line, l.start_line) + 1;
        return overlap > 0 && overlap / (l.end_line - l.start_line + 1) >= 0.9;
      }));
      if (ok) { f.subsumed_by = ex.id; break; }
    }
  }
}

// ---------------------------------------------------------------------------
// Clustering: fragments that live in the same files close together usually
// belong to ONE duplicated function/component whose meaningful differences
// (endpoint strings, state setter names, dependencies) split the match.
// Clusters are a hint for judgment, not a finding.
// ---------------------------------------------------------------------------

export function clusterFindings(findings, gap = 30) {
  const byFiles = new Map();
  for (const f of findings) {
    if (f.subsumed_by) continue;
    const files = [...new Set(f.locations.map((l) => l.file))].sort();
    if (files.length < 2 && f.locations.length < 2) continue;
    const key = files.join('|');
    if (!byFiles.has(key)) byFiles.set(key, []);
    byFiles.get(key).push(f);
  }
  let n = 0;
  for (const group of byFiles.values()) {
    if (group.length < 2) continue;
    group.sort((a, b) => Math.min(...a.locations.map((l) => l.start_line)) - Math.min(...b.locations.map((l) => l.start_line)));
    let current = [group[0]];
    const flush = () => {
      if (current.length >= 2) { n++; for (const f of current) f.cluster = `C-${n}`; }
      current = [];
    };
    for (let i = 1; i < group.length; i++) {
      const prev = current[current.length - 1], cur = group[i];
      const near = cur.locations.every((l) => prev.locations.some((p) => p.file === l.file && Math.abs(l.start_line - p.end_line) <= gap));
      if (near) current.push(cur); else { flush(); current = [cur]; }
    }
    flush();
  }
  return n;
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

export function run(opts) {
  const started = Date.now();
  const { files, ignored, failed } = collectFiles(opts.paths, opts.ignore);
  const sources = new Map();
  const readFailed = [];
  const fileHashes = {};
  for (const f of files) {
    try {
      const s = fs.readFileSync(f, 'utf8');
      sources.set(f, s);
      fileHashes[toPosix(path.relative(process.cwd(), f))] = sha1(s);
    } catch (e) { readFailed.push({ file: f, reason: `read failed: ${e.message}` }); }
  }

  const rel = (f) => toPosix(path.relative(process.cwd(), f));

  // exact
  const exactDocs = [...sources].map(([f, s]) => prepareExactDoc(rel(f), s));
  const exact = scanExact(exactDocs, opts);
  let findings = exact.findings;

  // normalized
  const normalizedCoverage = { enabled: opts.normalized, attempted: 0, supported: 0, skipped: [] };
  let normalizedDocs = [];
  if (opts.normalized) {
    for (const [f, s] of sources) {
      const ext = path.extname(f).toLowerCase();
      normalizedCoverage.attempted++;
      if (!NORMALIZED_EXTENSIONS.has(ext)) {
        normalizedCoverage.skipped.push({ file: rel(f), reason: `typescript not supported by the normalized pass in v1 (${ext})` });
        continue;
      }
      const doc = prepareNormalizedDoc(rel(f), s);
      if (doc.error) { normalizedCoverage.skipped.push({ file: rel(f), reason: `normalization skipped: ${doc.error}` }); continue; }
      normalizedCoverage.supported++;
      normalizedDocs.push(doc);
    }
    const norm = scanNormalized(normalizedDocs, opts);
    findings = findings.concat(norm.findings);
    markSubsumed(findings);
    exact.largeBuckets.push(...norm.largeBuckets);
  }

  const clusters = clusterFindings(findings);

  // changes
  const changes = getChangedRanges(opts);
  if (changes) markChanges(findings, changes);

  // impact ordering: lines * locations, exact first
  findings.sort((a, b) => {
    const ia = a.lines * a.locations.length, ib = b.lines * b.locations.length;
    if (a.match_type !== b.match_type) return a.match_type === 'exact' ? -1 : 1;
    return ib - ia;
  });

  const scope = opts.paths.map((p) => toPosix(path.relative(process.cwd(), path.resolve(p)) || '.'));
  const result = {
    version: VERSION,
    generated_at: new Date(started).toISOString(),
    cwd: toPosix(process.cwd()),
    scope,
    config: {
      min_lines: opts.minLines, min_tokens: opts.minTokens, min_chars: opts.minChars,
      normalized: opts.normalized, changed: opts.changed, diff_base: opts.diffBase, ignore: opts.ignore,
    },
    changes: changes ? { ref: changes.ref || null, error: changes.error, files_with_changes: changes.ranges.size } : null,
    summary: {
      files_scanned: sources.size,
      exact_findings: findings.filter((f) => f.match_type === 'exact').length,
      normalized_findings: findings.filter((f) => f.match_type === 'normalized' && !f.subsumed_by).length,
      normalized_subsumed: findings.filter((f) => f.subsumed_by).length,
      clusters,
      intersecting_changes: changes ? findings.filter((f) => f.intersects_changes).length : null,
      duplicated_lines_exact: findings.filter((f) => f.match_type === 'exact').reduce((s, f) => s + f.lines * (f.locations.length - 1), 0),
    },
    file_hashes: fileHashes,
    findings,
  };
  const coverage = {
    version: VERSION,
    generated_at: result.generated_at,
    files_considered: files.length + ignored.length,
    files_scanned: sources.size,
    files_ignored: ignored.map((x) => ({ file: rel(x.file), reason: x.reason })),
    files_failed: [...failed, ...readFailed].map((x) => ({ file: rel(x.file), reason: x.reason })),
    large_buckets_skipped: exact.largeBuckets,
    normalized: normalizedCoverage,
    duration_ms: Date.now() - started,
  };

  let baseline = null;
  if (opts.baseline) {
    try { baseline = compareBaseline(JSON.parse(fs.readFileSync(opts.baseline, 'utf8')), findings); }
    catch (e) { baseline = { error: `baseline unreadable: ${e.message}` }; }
  }
  const eligibleDump = opts.dumpEligible ? Object.fromEntries(normalizedDocs.map((d) => [d.id, [...d.eligible].sort()])) : null;

  if (opts.write) {
    fs.mkdirSync(opts.out, { recursive: true });
    fs.writeFileSync(path.join(opts.out, 'raw-findings.json'), JSON.stringify(result, null, 2));
    fs.writeFileSync(path.join(opts.out, 'coverage.json'), JSON.stringify(coverage, null, 2));
  }
  return { result, coverage, baseline, eligibleDump };
}

// ---------------------------------------------------------------------------
// Markdown
// ---------------------------------------------------------------------------

export function renderMarkdown({ result, coverage, baseline, eligibleDump }, opts) {
  const L = [];
  const s = result.summary;
  L.push(`# dry-refactor scan — ${result.scope.join(', ')}`);
  L.push('');
  L.push(`Files scanned: ${s.files_scanned} · Exact findings: ${s.exact_findings} · Duplicated lines (exact, beyond first copy): ${s.duplicated_lines_exact}`);
  if (result.config.normalized) L.push(`Normalized findings (advisory): ${s.normalized_findings} (+${s.normalized_subsumed} subsumed by exact)`);
  if (result.changes) L.push(`Changes vs ${result.changes.ref}: ${result.changes.files_with_changes} files changed · findings touching changes: ${s.intersecting_changes}${result.changes.error ? ` · ${result.changes.error}` : ''}`);
  L.push('');
  let list = result.findings.filter((f) => !f.subsumed_by);
  if (opts.changedOnly) list = list.filter((f) => f.intersects_changes);
  L.push(`## Findings (top ${Math.min(opts.top, list.length)} of ${list.length}, by impact)`);
  L.push('');
  L.push('| ID | Type | Lines | Copies | Cluster | Locations |');
  L.push('|---|---|---|---|---|---|');
  for (const f of list.slice(0, opts.top)) {
    const locs = f.locations.map((l) => `${l.file}:${l.start_line}-${l.end_line}${l.in_changes ? ' (changed)' : ''}`).join('<br>');
    L.push(`| ${f.id} | ${f.match_type}${f.advisory ? ' (advisory)' : ''} | ${f.lines} | ${f.locations.length} | ${f.cluster || ''} | ${locs} |`);
  }
  if (s.clusters) L.push(`\nClusters (${s.clusters}): fragments in the same files close together — read them as ONE candidate whose meaningful differences split the match.`);
  L.push('');
  L.push('## Coverage');
  L.push('');
  L.push(`- Considered: ${coverage.files_considered} · scanned: ${coverage.files_scanned} · ignored: ${coverage.files_ignored.length} · failed: ${coverage.files_failed.length}`);
  if (coverage.large_buckets_skipped.length) L.push(`- Large duplicate buckets skipped (>${opts.maxBucket} occurrences): ${coverage.large_buckets_skipped.length}`);
  if (coverage.normalized.enabled) {
    L.push(`- Normalized pass: attempted ${coverage.normalized.attempted}, supported ${coverage.normalized.supported}, skipped ${coverage.normalized.skipped.length}`);
    for (const sk of coverage.normalized.skipped.slice(0, 20)) L.push(`  - ${sk.file}: ${sk.reason}`);
    if (coverage.normalized.skipped.length > 20) L.push(`  - … ${coverage.normalized.skipped.length - 20} more in coverage.json`);
  }
  if (coverage.files_failed.length) for (const f of coverage.files_failed) L.push(`- FAILED ${f.file}: ${f.reason}`);
  if (baseline) {
    L.push('');
    L.push('## Baseline comparison');
    L.push('');
    if (baseline.error) L.push(`- ${baseline.error}`);
    else L.push(`- Eliminated: ${baseline.eliminated.length} · New: ${baseline.new.length} · Remaining: ${baseline.remaining.length}${baseline.eliminated.length ? ` (eliminated: ${baseline.eliminated.join(', ')})` : ''}`);
  }
  if (eligibleDump) {
    L.push('');
    L.push('## Eligible names (normalized pass, debug)');
    for (const [file, names] of Object.entries(eligibleDump)) L.push(`- ${file}: ${names.join(', ') || '(none)'}`);
  }
  L.push('');
  L.push(`Raw output: ${opts.write ? path.join(opts.out, 'raw-findings.json') + ', ' + path.join(opts.out, 'coverage.json') : '(not written, --no-write)'}`);
  return L.join('\n');
}

function main() {
  let opts;
  try { opts = parseArgs(process.argv.slice(2)); }
  catch (e) { console.error(e.message); process.exit(2); }
  if (opts.help) {
    console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('*/')[0].replace(/^\/\*\*?\s?/, '').replace(/^ \* ?/gm, ''));
    return;
  }
  const out = run(opts);
  if (opts.json) console.log(JSON.stringify({ ...out.result, coverage: out.coverage, baseline: out.baseline, eligible: out.eligibleDump }, null, 2));
  else console.log(renderMarkdown(out, opts));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
