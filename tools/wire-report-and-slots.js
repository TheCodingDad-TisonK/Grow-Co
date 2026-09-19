// One-time wiring for the 1.1.0 features (save slots, bug reports). Kept as a record; not meant to be run again.
var fs = require('fs'), path = require('path'); var root = path.join(__dirname, '..');
function edit(rel, fn) { var f = path.join(root, rel), s = fs.readFileSync(f, 'utf8'), o = fn(s); if (o === s) { console.error('no change: ' + rel); process.exit(1); } fs.writeFileSync(f, o); }
function rep(s, a, b) { if (s.split(a).length !== 2) { console.error('anchor: ' + a.slice(0, 70)); process.exit(1); } return s.replace(a, b); }

// the save key follows the active slot; an old single save becomes slot 1 once
edit('game/grow3d.js', function (s) {
  return rep(s, "return q ? 'rfgrowco-' + q.replace(/[^a-z0-9_-]/gi, '') : 'rfgrowco-v1'; } catch (e) { return 'rfgrowco-v1'; } })();",
    "if (q) return 'rfgrowco-' + q.replace(/[^a-z0-9_-]/gi, ''); var sl = +(localStorage.getItem('rfgrowco-slot') || 1); if (!(sl >= 1 && sl <= 3)) sl = 1; if (!localStorage.getItem('rfgrowco-slot1') && localStorage.getItem('rfgrowco-v1')) { localStorage.setItem('rfgrowco-slot1', localStorage.getItem('rfgrowco-v1')); localStorage.removeItem('rfgrowco-v1'); } return 'rfgrowco-slot' + sl; } catch (e) { return 'rfgrowco-slot1'; } })();   /* three save slots; the main menu picks one and reloads */");
});
edit('game/index.html', function (s) {
  s = rep(s, '<script src="guide.js"></script>', '<script src="version.js"></script>\n<script src="report.js"></script>\n<script src="guide.js"></script>');
  s = rep(s, '<button class="g3-btn" data-menu="dev">', '<button class="g3-btn" data-menu="bug">🐞 Report a bug (F7)</button>\n      <button class="g3-btn" data-menu="dev">');
  return s;
});
edit('game/menu.css', function (s) {
  return s + [
    '/* save slots */',
    '.rf-slots { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }',
    '.rf-slot { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border: 1px solid rgba(120,200,140,.18); border-radius: 12px; background: rgba(255,255,255,.03); text-align: left; }',
    '.rf-slot.on { border-color: rgba(111,220,140,.55); background: rgba(111,220,140,.08); }',
    '.rf-slot-info { flex: 1; min-width: 0; } .rf-slot-info b { display: block; font-size: 14px; } .rf-slot-info span { font-size: 12px; color: #8fa596; }',
    '.rf-slot button { border: 1px solid rgba(120,200,140,.22); background: rgba(255,255,255,.05); color: inherit; padding: 9px 14px; border-radius: 10px; font-size: 14px; cursor: pointer; font-family: inherit; }',
    '.rf-slot button:hover { background: rgba(255,255,255,.1); }',
    '.rf-slot button.primary { background: linear-gradient(180deg, #3fbf68, #2c9a51); border-color: #57d580; color: #062010; font-weight: 600; }',
    '.rf-slot button.danger { border-color: rgba(255,107,107,.4); color: #ff8a8a; padding: 9px 10px; } .rf-slot-gap { width: 40px; }',
    '.rf-menu-btns.row { flex-direction: row; margin-top: 8px; } .rf-menu-btns.row button { flex: 1; font-size: 13px; padding: 10px 8px; }',
    '/* bug report form */',
    '.rf-report { z-index: 230; background: rgba(3,7,5,.88); }',
    '.rf-report-card { width: 760px; max-width: 94vw; max-height: 92vh; overflow-y: auto; padding: 26px 28px; border: 1px solid rgba(120,200,140,.25); border-radius: 18px; background: rgba(14,20,16,.97); box-shadow: 0 30px 80px rgba(0,0,0,.7); text-align: left; }',
    '.rf-report-card h2 { margin: 0 0 6px; font-size: 24px; } .rfr-lead { margin: 0 0 16px; color: #9fb8a6; font-size: 13.5px; line-height: 1.5; }',
    '.rf-report-card label { display: block; font-size: 13px; color: #c9dccd; margin-bottom: 12px; } .rf-report-card label span { float: right; font-size: 11px; color: #6f8577; }',
    '.rf-report-card input:not([type=checkbox]), .rf-report-card select, .rf-report-card textarea { display: block; width: 100%; box-sizing: border-box; margin-top: 5px; padding: 9px 10px; border-radius: 9px; border: 1px solid rgba(120,200,140,.25); background: #0a120d; color: #e8f1ea; font: 14px "Segoe UI", system-ui, sans-serif; }',
    '.rf-report-card textarea { resize: vertical; line-height: 1.45; } .rf-report-card select option { background: #0a120d; }',
    '.rf-report-card input:focus, .rf-report-card select:focus, .rf-report-card textarea:focus { outline: none; border-color: #6fdc8c; }',
    '.rfr-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 14px; }',
    '.rfr-checks { margin: 4px 0 10px; } .rfr-check { display: flex !important; align-items: flex-start; gap: 8px; margin-bottom: 7px !important; } .rfr-check small { color: #6f8577; margin-left: 4px; }',
    '.rfr-note { font-size: 12px; color: #8fa596; background: rgba(255,255,255,.04); border-radius: 10px; padding: 10px 12px; line-height: 1.5; margin-bottom: 14px; } .rfr-note a { color: #6fdc8c; }',
    '.rfr-btns { display: flex; flex-wrap: wrap; gap: 8px; } .rfr-btns button { border: 1px solid rgba(120,200,140,.22); background: rgba(255,255,255,.05); color: #e8f1ea; padding: 11px 16px; border-radius: 11px; font: 14px "Segoe UI", system-ui, sans-serif; cursor: pointer; }',
    '.rfr-btns button:hover { background: rgba(255,255,255,.1); } .rfr-btns button.primary { background: linear-gradient(180deg, #3fbf68, #2c9a51); border-color: #57d580; color: #062010; font-weight: 600; }',
    '.rfr-err { color: #ff8a8a; font-size: 13px; margin-top: 10px; min-height: 16px; } .rfr-preview { font: 12px Consolas, monospace !important; white-space: pre; }',
    '.rfr-steps { margin: 0 0 14px; padding-left: 22px; font-size: 14.5px; line-height: 1.6; color: #c9dccd; } .rfr-steps li { margin-bottom: 8px; } .rfr-steps b { color: #6fdc8c; }',
    '@media (max-width: 640px) { .rfr-grid { grid-template-columns: 1fr; } }',
    ''].join('\n');
});
var p = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
p.version = '1.1.0';
p.scripts.version = 'node tools/sync-version.js';
p.scripts.check = 'node tools/sync-version.js && node --check game/grow3d.js && node --check game/grow3d-creative.js && node --check game/menu.js && node --check game/guide.js && node --check game/report.js && node --check main.js';
fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify(p, null, 2) + '\n');
console.log('wired');
