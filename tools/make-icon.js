// Builds build/icon.ico from game/rf-icon.png for the Windows executable.
var fs = require('fs'), path = require('path'); var mod = require('png-to-ico'); var pngToIco = mod.default || mod;
var out = path.join(__dirname, '..', 'build'); fs.mkdirSync(out, { recursive: true });
pngToIco(path.join(__dirname, '..', 'game', 'rf-icon.png')).then(function (buf) { fs.writeFileSync(path.join(out, 'icon.ico'), buf); console.log('build/icon.ico written'); }).catch(function (e) { console.error('icon failed: ' + e.message); process.exit(1); });
