// The test runner: `npm test`. Each test in tests/*.test.js runs against the real game (the built
// game/grow3d.js) in a hidden Electron window, on a fresh page, on the fake clock from preload.js.
//
//   npm test                    every test
//   npm test -- line            only tests whose file or name contains "line"
//
// A test file is a list of calls to test(name, async (h) => { ... }); the body runs inside the page, where
// h is the helper set in tools/test/preload.js (h.step, h.until, h.eq, h.T for the game's test handle...).
// Anything the page throws or logs as an error while a test runs fails that test.
'use strict';
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const ROOT = path.join(__dirname, '..', '..');
const TEST_DIR = path.join(ROOT, 'tests');
const PER_TEST_MS = 120000;
const filter = process.argv.slice(2).filter((a) => !/^-/.test(a) && !/run\.js$/i.test(a) && a !== '.').join(' ').toLowerCase();

app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'growco-test-')));   // never the player's saves
app.commandLine.appendSwitch('enable-unsafe-swiftshader');   // WebGL with no GPU, as on a CI runner
if (process.env.CI) app.disableHardwareAcceleration();

function discover() {
  const out = [];
  for (const file of fs.readdirSync(TEST_DIR).filter((n) => /\.test\.js$/.test(n)).sort()) {
    const src = fs.readFileSync(path.join(TEST_DIR, file), 'utf8');
    const names = [];
    new Function('test', src)((name) => names.push(name));   // only collects the names; bodies run in the page
    names.forEach((name, index) => { if (!filter || (file + ' ' + name).toLowerCase().includes(filter)) out.push({ file, src, name, index }); });
  }
  return out;
}

// a test file can pull a repo file into the page ahead of itself: `// @include tools/balance/model.js`
function includes(src) {
  return (src.match(/^\/\/ @include (.+)$/gm) || []).map((l) => fs.readFileSync(path.join(ROOT, l.slice(12).trim()), 'utf8')).join('\n');
}

function inPage(t) {
  return '(async () => {\n  const H = window.__H, list = [];\n  const test = (name, fn) => list.push(fn);\n' + includes(t.src) + '\n' + t.src +
    '\n  const t0 = performance.now();\n  try {\n    await H.boot();\n    await list[' + t.index + '](H);\n' +
    '    const errs = H.errors.slice();\n    return { ok: !errs.length, err: errs.length ? "errors during the test:\\n      " + errs.slice(0, 5).join("\\n      ") : "", ms: Math.round(performance.now() - t0) };\n' +
    '  } catch (e) {\n    return { ok: false, err: String(e && e.stack || e).split("\\n").slice(0, ' + (process.env.TEST_VERBOSE ? 80 : 4) + ').join("\\n      ") + (H.errors.length ? "\\n      page errors: " + H.errors.slice(0, 3).join(" | ") : ""), ms: Math.round(performance.now() - t0) };\n  }\n})()';
}

async function runOne(win, t) {
  await win.loadURL('about:blank');   // leave the last test's page first: the game saves on the way out, and that save must not reach the next test
  await win.webContents.session.clearStorageData({ storages: ['localstorage', 'indexdb'] });
  let seed = 2166136261; for (const ch of t.file + '/' + t.name) seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619) >>> 0;   // a fixed seed per test: reruns draw the same numbers
  await win.loadFile(path.join(ROOT, 'game', 'index.html'), { query: { save: 'test', seed: String(seed) } });
  let timer;
  const timeout = new Promise((ok) => { timer = setTimeout(() => ok({ ok: false, err: 'no result after ' + PER_TEST_MS / 1000 + ' s', ms: PER_TEST_MS }), PER_TEST_MS); });
  const res = await Promise.race([win.webContents.executeJavaScript(inPage(t), true).catch((e) => ({ ok: false, err: 'could not run: ' + e.message, ms: 0 })), timeout]);
  clearTimeout(timer);
  return res;
}

app.whenReady().then(async () => {
  const tests = discover();
  if (!tests.length) { console.log('no tests match "' + filter + '"'); app.exit(1); return; }
  const win = new BrowserWindow({
    show: false, width: 1280, height: 720,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: false, nodeIntegration: false, sandbox: false, backgroundThrottling: false },
  });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  console.log('Grow Co. tests: ' + tests.length + (filter ? ' matching "' + filter + '"' : '') + '\n');
  let failed = 0, file = '';
  const t0 = Date.now();
  for (const t of tests) {
    if (t.file !== file) { file = t.file; console.log(file); }
    const r = await runOne(win, t);
    if (r.ok) console.log('  ok    ' + t.name + '  (' + r.ms + ' ms)');
    else { failed++; console.log('  FAIL  ' + t.name + '  (' + r.ms + ' ms)\n      ' + r.err); }
  }
  console.log('\n' + (tests.length - failed) + ' passed, ' + failed + ' failed, ' + Math.round((Date.now() - t0) / 1000) + ' s');
  app.exit(failed ? 1 : 0);
});
