// Finds identifiers that are used but never declared — exactly the class of
// mistake `node --check` lets through (the syntax is valid, after all).
// Usage: node check.js
const fs = require('fs');

const BUILTINS = new Set([
  'window','document','navigator','location','console','chrome','setTimeout',
  'clearTimeout','setInterval','clearInterval','Math','Number','String','Boolean',
  'Array','Object','JSON','Set','Map','RegExp','Date','Promise','Error','parseInt',
  'parseFloat','isNaN','undefined','null','true','false','this','arguments',
  'MutationObserver','Element','Node','NodeList','requestAnimationFrame','URL',
  'CustomEvent','Event','getComputedStyle','structuredClone','queueMicrotask',
  'Infinity','NaN','globalThis','Symbol','WeakMap','WeakSet','Intl','module','require'
]);

let bad = 0;
for (const file of ['content.js', 'inject.js']) {
  const src = fs.readFileSync(file, 'utf8');
  // Strip comments, strings and regexes so they cannot produce matches
  const code = src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/[^\n]*/g, ' ')
    .replace(/`(?:\\.|[^`\\])*`/g, '``')
    .replace(/'(?:\\.|[^'\\])*'/g, "''")
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/\/(?![*/])(?:\\.|\[(?:\\.|[^\]\\])*\]|[^/\\\n])+\/[gimsuy]*/g, '0');

  const declared = new Set(BUILTINS);
  // Read declarations from the RAW source — the stripping above mangles lines
  // like `const X = /regex/;` beyond recognition.
  for (const m of src.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g)) declared.add(m[1]);
  for (const m of src.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)/g)) declared.add(m[1]);
  const add = (re, group = 1) => {
    let m; while ((m = re.exec(code))) {
      for (const part of m[group].split(/[\s,{}[\]:]+/)) {
        const id = part.replace(/=.*$/, '').trim();
        if (/^[A-Za-z_$][\w$]*$/.test(id)) declared.add(id);
      }
    }
  };
  add(/\b(?:const|let|var)\s+([^=;\n]+?)\s*[=;]/g);
  add(/\bfunction\s+([A-Za-z_$][\w$]*)/g);
  add(/\bfunction\s*\(([^)]*)\)/g);
  add(/\bcatch\s*\(([^)]*)\)/g);
  add(/\(([^()]*)\)\s*=>/g);
  add(/\bfor\s*\(\s*(?:const|let|var)\s+([^\s;)]+)/g);
  add(/([A-Za-z_$][\w$]*)\s*=>/g);
  add(/\b([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/g);   // Methodenkurzform

  // Used identifiers: only those that are not property accesses
  const used = new Map();
  const re = /(^|[^.\w$])([A-Za-z_$][\w$]*)/g;
  let m;
  while ((m = re.exec(code))) {
    const id = m[2];
    if (declared.has(id)) continue;
    if (/^(if|else|for|while|do|return|break|continue|new|typeof|instanceof|in|of|delete|void|try|catch|finally|throw|switch|case|default|class|extends|super|yield|await|async|export|import|from|as|let|const|var|function)$/.test(id)) continue;
    const line = code.slice(0, m.index).split('\n').length;
    if (!used.has(id)) used.set(id, line);
  }

  // Report ALL_CAPS names only — the rest are usually object-literal keys and
  // would be noise.
  // Object keys are not variable references: `X01: 'X01'` und
  // `{ X01, ... }` beide ausschliessen.
  const isKey = (id) =>
    new RegExp('[{,\\n]\\s*' + id + '\\s*:').test(src) ||
    new RegExp("['\"]" + id + "['\"]\\s*:").test(src);
  const suspects = [...used].filter(([id]) => /^[A-Z][A-Z0-9_]*$/.test(id) && !isKey(id));
  if (suspects.length) {
    bad += suspects.length;
    console.log(`\n${file}:`);
    for (const [id, line] of suspects) console.log(`  Zeile ${line}: ${id} used but never declared`);
  }
}
console.log(bad ? `\n${bad} problem(s)` : 'no undeclared identifiers found');
process.exit(bad ? 1 : 0);
