// Zips the packaged Windows build into dist/RF-Grow-Co-win64-v<version>.zip, ready to attach to a release.
var cp = require('child_process'), path = require('path'), fs = require('fs'); var v = require('../package.json').version;
var dir = path.join(__dirname, '..', 'dist', 'RF Grow Co-win32-x64'), zip = path.join(__dirname, '..', 'dist', 'RF-Grow-Co-win64-v' + v + '.zip');
if (!fs.existsSync(dir)) { console.error('run "npm run dist" first'); process.exit(1); } if (fs.existsSync(zip)) fs.unlinkSync(zip);
cp.execFileSync('powershell', ['-NoProfile', '-Command', "Compress-Archive -Path '" + dir + "' -DestinationPath '" + zip + "'"], { stdio: 'inherit' }); console.log(zip);
