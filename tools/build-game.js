// Builds game/grow3d.js (and the desk copy) from the parts in src/.
//
// The game still ships as ONE file inside ONE closure, so nothing changes at run time and any
// static host can serve game/ as it is. The parts exist so the code can be read, reviewed and
// changed a system at a time. Never edit game/grow3d.js by hand: edit src/ and run `npm run build`.
//
// How the parts join:
//   src/NN-name.js        in both builds, in file-name order
//   src/NN-name.desk.js   only in the desk build (the office wall screen that reads the desk's API)
//   src/NN-name.shop.js   only in the standalone build (the shop dashboard drawn from the save)
//   //#if desk ... //#else ... //#endif    (or //#if shop) at column 0: a small difference inside a shared part
//   //@ ...                                 at column 0: a note for the reader, left out of the build
//
// Usage:
//   node tools/build-game.js            build the standalone copy, and the desk copy when .desk-path is set
//   node tools/build-game.js --check    exit 1 if a built copy differs from what is on disk, or a check fails
//   node tools/build-game.js --stdout desk|shop
//
// .desk-path (git-ignored, one line) is the desk's public folder or its grow3d.js; GROWCO_DESK does the same.
// With it set, the build also copies the files both builds share unchanged (the guide, the menu, creative
// mode, the Workshop, the stylesheet, the report form) from game/ to the desk, and --check compares them.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const SHOP_OUT = path.join(ROOT, 'game', 'grow3d.js');
const MARKER = /^\/\/#(if (desk|shop)|else|endif)\s*$/;
const SHARED = ['guide.js', 'menu.js', 'menu.css', 'grow3d-creative.js', 'workshop.js', 'grow3d.css', 'report.js'];   // identical in both builds

function deskOut() {
  let p = process.env.GROWCO_DESK || '';
  const f = path.join(ROOT, '.desk-path');
  if (!p && fs.existsSync(f)) p = fs.readFileSync(f, 'utf8').split(/\r?\n/)[0].trim();
  if (!p) return null;
  return /\.js$/i.test(p) ? p : path.join(p, 'grow3d.js');
}

function parts(flavor) {
  return fs.readdirSync(SRC).filter((n) => /^\d\d-.*\.js$/.test(n)).sort().filter((n) => {
    const m = /\.(desk|shop)\.js$/.exec(n);
    return !m || m[1] === flavor;
  });
}

function build(flavor) {
  const problems = [];
  const names = parts(flavor);
  const text = names.map((n) => fs.readFileSync(path.join(SRC, n), 'utf8')).join('');
  const out = [], stack = [];
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    const m = MARKER.exec(line);
    if (m) {
      if (m[2]) stack.push({ want: m[2] === flavor, inElse: false });
      else if (m[1] === 'else') { const top = stack[stack.length - 1]; if (!top || top.inElse) problems.push('stray //#else at joined line ' + (i + 1)); else top.inElse = true; }
      else if (!stack.pop()) problems.push('stray //#endif at joined line ' + (i + 1));
      return;
    }
    if (/^\/\/@/.test(line)) return;
    if (stack.every((s) => s.want !== s.inElse)) out.push(line);
  });
  if (stack.length) problems.push(stack.length + ' //#if block(s) never closed');
  const js = out.join('\n');
  // one closure means a second `function foo(` silently replaces the first: refuse to build that
  const seen = {};
  (js.match(/^  function [A-Za-z0-9_$]+\(/gm) || []).forEach((d) => { const n = d.slice(11, -1); seen[n] = (seen[n] || 0) + 1; });
  Object.keys(seen).filter((n) => seen[n] > 1).forEach((n) => problems.push('function ' + n + ' is declared ' + seen[n] + ' times at the top level (' + flavor + ' build)'));
  return { js, names, problems };
}

function main() {
  const args = process.argv.slice(2);
  const check = args.includes('--check');
  const si = args.indexOf('--stdout');
  if (si >= 0) { const r = build(args[si + 1] || 'shop'); if (r.problems.length) { console.error(r.problems.join('\n')); process.exit(1); } process.stdout.write(r.js); return; }
  const targets = [{ flavor: 'shop', file: SHOP_OUT }];
  const desk = deskOut();
  if (desk) targets.push({ flavor: 'desk', file: desk });
  let bad = false;
  for (const t of targets) {
    const r = build(t.flavor);
    if (r.problems.length) { bad = true; console.error('build-game (' + t.flavor + '): ' + r.problems.join('\n  ')); continue; }
    const cur = fs.existsSync(t.file) ? fs.readFileSync(t.file, 'utf8') : null;
    if (check) {
      if (cur !== r.js) { bad = true; console.error('build-game: ' + path.relative(ROOT, t.file) + ' is not what src/ builds. Edit src/, not the built file, then run npm run build.'); }
      else console.log('build-game: ' + (t.flavor === 'shop' ? 'game/grow3d.js' : 'desk grow3d.js') + ' matches src/ (' + r.names.length + ' parts)');
    } else if (cur !== r.js) { fs.writeFileSync(t.file, r.js); console.log('build-game: wrote ' + t.file + ' (' + r.names.length + ' parts, ' + r.js.split('\n').length + ' lines)'); }
    else console.log('build-game: ' + t.file + ' already up to date');
  }
  // the other files both builds run unchanged: game/ is their only source, the desk gets a copy
  if (desk) {
    const deskDir = path.dirname(desk);
    for (const n of SHARED) {
      const from = path.join(ROOT, 'game', n), to = path.join(deskDir, n);
      const a = fs.readFileSync(from, 'utf8'), b = fs.existsSync(to) ? fs.readFileSync(to, 'utf8') : null;
      if (a === b) continue;
      if (check) { bad = true; console.error('build-game: the desk copy of ' + n + ' differs from game/' + n + '. Run npm run build.'); }
      else { fs.writeFileSync(to, a); console.log('build-game: copied game/' + n + ' to the desk'); }
    }
  }
  if (!desk && !check) console.log('build-game: no .desk-path set, so only the standalone copy was built');
  if (bad) process.exit(1);
}

if (require.main === module) main();
module.exports = { build, parts, deskOut };
