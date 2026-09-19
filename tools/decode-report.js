// Pulls the savegame out of a player's bug report.
//   node tools/decode-report.js report.txt            writes report.save.json next to it
//   gh issue view 12 --json body --jq .body | node tools/decode-report.js -     reads the report from stdin
// It prints how to load that save into a developer slot of the game.
var fs = require('fs'), zlib = require('zlib'), path = require('path');
var arg = process.argv[2]; if (!arg) { console.error('usage: node tools/decode-report.js <report.txt | ->'); process.exit(1); }
var text = arg === '-' ? fs.readFileSync(0, 'utf8') : fs.readFileSync(arg, 'utf8');
var m = text.match(/----- SAVE \(([^)]+)\) -----\s*([A-Za-z0-9+/=\s]+?)\s*----- END SAVE -----/);
if (!m) { console.error('No savegame block in this report. The player may have unticked "Attach my savegame".'); process.exit(2); }
var buf = Buffer.from(m[2].replace(/\s+/g, ''), 'base64'), json = m[1].indexOf('gzip') === 0 ? zlib.gunzipSync(buf).toString('utf8') : buf.toString('utf8');
var save = JSON.parse(json), out = arg === '-' ? 'report.save.json' : arg.replace(/\.[^.]*$/, '') + '.save.json';
fs.writeFileSync(out, JSON.stringify(save, null, 2));
console.log('Savegame written to ' + path.resolve(out));
console.log('Day ' + save.day + ', level ' + save.level + ', bank $' + Math.round(save.bank) + ', rep ' + Math.round(save.rep));
console.log('');
console.log('To load it: npm run serve, open http://127.0.0.1:8420/?save=bug and press F12. In the console run:');
console.log('  localStorage.setItem("rfgrowco-bug", JSON.stringify(<paste the contents of the json file>)); location.reload();');
