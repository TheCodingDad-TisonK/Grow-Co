// Refuse to build an installer without the app icon.
//
// electron-builder does not treat a missing icon as an error: it logs
// "default Electron icon is used" and carries on, so a broken brand step ships a
// generic Electron app and nobody notices until it is on someone's desktop.
// That is exactly what happened from v1.3 to v1.8. This runs between the brand
// render and electron-builder, and fails the build instead.
var fs = require('fs'), path = require('path');
var ico = path.join(__dirname, '..', 'build', 'icon.ico');

if (!fs.existsSync(ico)) {
  console.error('\n  build/icon.ico is missing.\n  Run "npm run icon" and check it printed the build/icon.ico line.\n');
  process.exit(1);
}
var buf = fs.readFileSync(ico);
// an ICO starts 00 00 01 00, then a little-endian count of the images it holds
if (buf.length < 1000 || buf[0] !== 0 || buf[1] !== 0 || buf[2] !== 1 || buf[3] !== 0) {
  console.error('\n  build/icon.ico is not a usable icon file (' + buf.length + ' bytes).\n');
  process.exit(1);
}
var count = buf.readUInt16LE(4);
if (count < 4) {
  console.error('\n  build/icon.ico only holds ' + count + ' size(s); Windows wants the full set down to 16px.\n');
  process.exit(1);
}
console.log('icon check: build/icon.ico, ' + count + ' sizes, ' + buf.length + ' bytes');
