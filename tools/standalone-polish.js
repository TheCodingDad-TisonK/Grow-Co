// Second pass of the standalone conversion: leftover desk wording and a better default spot for the staff roster.
var fs = require('fs'), path = require('path'); var file = path.join(__dirname, '..', 'game', 'grow3d.js'); var src = fs.readFileSync(file, 'utf8'), n = 0;
function rep(a, b) { var i = src.indexOf(a); if (i < 0) { console.error('MISSING: ' + a.slice(0, 80)); process.exit(1); } if (src.indexOf(a, i + 1) >= 0) { console.error('NOT UNIQUE: ' + a.slice(0, 80)); process.exit(1); } src = src.slice(0, i) + b + src.slice(i + a.length); n++; }
rep("'🖥️ Live desk'", "'📊 Shop dashboard'");
rep("desk: 'Live desk', growcam:", "desk: 'Shop dashboard', growcam:");
rep("// ── Live desk board (office wall screen fed by the desk's own API) ──", "// ── Shop dashboard (office wall screen) ──");
rep("// ── Live desk board: a rotating five-page screen fed by", "// ── Shop dashboard: a rotating five-page screen fed by");
rep("fixtureFromBuild('roster', 'staff roster', 0, function () { box(1.5, 1.0, 0.04, colorMat(0x8a6a3a, 0.9), -7.5, 1.6, -1.86, { cast: false }); signPlane(['STAFF ROSTER', 'driver · basement operator · night guard'], 1.4, 0.4, -7.5, 1.85, -1.83, 0, { size: 24 }); hit(1.6, 1.2, 0.4, -7.5, 1.6, -1.75, { kind: 'roster' }); });",
    "fixtureFromBuild('roster', 'staff roster', -Math.PI / 2, function () { box(0.04, 1.0, 1.2, colorMat(0x8a6a3a, 0.9), -4.13, 1.7, 2.35, { cast: false }); signPlane(['STAFF ROSTER', 'driver · operator · night guard'], 1.1, 0.36, -4.16, 1.95, 2.35, -Math.PI / 2, { size: 24 }); hit(0.4, 1.2, 1.3, -4.25, 1.7, 2.35, { kind: 'roster' }); });   /* on the office side of the hall wall, clear of the dashboard */");
fs.writeFileSync(file, src); console.log('polish applied: ' + n);
