// Reads the game's own tables and constants out of src/, so the balance model never works from a copy.
// Each name is a `var NAME = <literal>;` at the top of a part; the literal is cut out with a small scanner
// (strings, comments and regexes skipped) and evaluated on its own.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC = path.join(__dirname, '..', '..', 'src');

// where each value lives, so a moved table fails loudly here instead of quietly reading nothing
const WANT = {
  '01-config.js': ['STRAINS', 'SUPPLIES', 'ACC', 'LIGHTS', 'TENTS', 'UPGRADES', 'LICENCES', 'DRY_MS_BASE', 'CURE_CAP_BASE', 'THIRST_RATE', 'HAZARD_CHANCE', 'XP_PER_LEVEL'],
  '03-log-sound.js': ['ECON', 'COST'],
  '10-staff-paths.js': ['WORKER_HIRE', 'WORKER_WAGE', 'CREW_MAX'],
  '13-basement.js': ['CIG_SKUS', 'TOB'],
  '31-models-machines.js': ['WALKUP_RATE', 'WALKUP_CAP'],
};

// the text of the initialiser after `var NAME = `, up to the `,` or `;` that ends it at depth 0
function initialiser(text, name) {
  const re = new RegExp('(?:var |,\\s*)' + name + ' = ');
  const m = re.exec(text);
  if (!m) throw new Error('balance: ' + name + ' not found');
  let i = m.index + m[0].length, depth = 0, start = i;
  for (; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (c === '/' && n === '/') { i = text.indexOf('\n', i); if (i < 0) break; continue; }
    if (c === '/' && n === '*') { i = text.indexOf('*/', i + 2) + 1; continue; }
    if (c === '"' || c === "'" || c === '`') { const q = c; for (i++; i < text.length && text[i] !== q; i++) if (text[i] === '\\') i++; continue; }
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') depth--;
    else if ((c === ';' || c === ',') && depth === 0) break;
  }
  return text.slice(start, i).trim();
}

function load() {
  const out = {};
  // what the literals may call while they are evaluated: the licence text names tent sizes, and the stock tables use hex colours only
  const sandbox = { tentSizes: () => 'bigger', window: {}, Math };
  vm.createContext(sandbox);
  for (const file of Object.keys(WANT)) {
    const text = fs.readFileSync(path.join(SRC, file), 'utf8');
    for (const name of WANT[file]) sandbox[name] = out[name] = vm.runInContext('(' + initialiser(text, name) + ')', sandbox);   // later values may read earlier ones (WORKER_WAGE is COST.payRate)
  }
  return out;
}

module.exports = { load, initialiser };
