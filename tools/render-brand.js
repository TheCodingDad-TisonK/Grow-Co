// Renders the brand assets from brand/*.html with Electron, so every size comes out of one source.
//   npm run brand
// Produces brand/png/icon-<size>.png, brand/png/wordmark*.png, game/logo*.png and build/icon.ico.
const { app, BrowserWindow } = require('electron');
const path = require('path'), fs = require('fs');
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'brand', 'png');
const ICON_SIZES = [16, 24, 32, 48, 64, 128, 256, 512, 1024];
const SIMPLE_AT_OR_BELOW = 32;   // tiny icons drop the sprout, or it turns to mush

function url(file, query) { return 'file://' + path.join(root, 'brand', file).replace(/\\/g, '/') + '?' + query; }

async function shoot(win, address, w, h, outPath) {
  await win.setContentSize(w, h);
  await win.loadURL(address);
  await new Promise(r => setTimeout(r, 140));   // let the image decode and the layout settle
  const img = await win.webContents.capturePage({ x: 0, y: 0, width: w, height: h });
  fs.writeFileSync(outPath, img.toPNG());
  return outPath;
}

app.disableHardwareAcceleration();
// Destroying the render window leaves Electron with no windows, and its default
// window-all-closed handler quits the app on the spot. That killed the process before
// the .ico was written, so CI shipped installers with the stock Electron icon while a
// stale build/icon.ico on the author's disk hid it locally. Nothing quits but us.
app.on('window-all-closed', function () {});
app.whenReady().then(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const win = new BrowserWindow({ width: 512, height: 512, show: false, frame: false, transparent: true, backgroundColor: '#00000000', useContentSize: true, webPreferences: { offscreen: false } });

  for (const s of ICON_SIZES) {
    const simple = s <= SIMPLE_AT_OR_BELOW ? 1 : 0;
    await shoot(win, url('icon.html', 'size=' + s + '&simple=' + simple), s, s, path.join(outDir, 'icon-' + s + '.png'));
    console.log('icon-' + s + '.png');
  }

  // the horizontal lockup, measured by the page itself so there is no dead space around it
  for (const [w, name] of [[1200, 'wordmark'], [600, 'wordmark@600'], [1200, 'wordmark-light']]) {
    const dark = name === 'wordmark-light' ? 0 : 1;
    await win.setContentSize(Math.round(w * 1.5), 600);
    await win.loadURL(url('wordmark.html', 'w=' + w + '&dark=' + dark));
    await new Promise(r => setTimeout(r, 160));
    const [mw, mh] = (win.getTitle().match(/(\d+)x(\d+)/) || [0, w, 300]).slice(1).map(Number);
    const img = await win.webContents.capturePage({ x: 0, y: 0, width: mw, height: mh });
    fs.writeFileSync(path.join(outDir, name + '.png'), img.toPNG());
    console.log(name + '.png  ' + mw + 'x' + mh);
  }
  // what the game and the packager actually use
  fs.copyFileSync(path.join(outDir, 'icon-512.png'), path.join(root, 'game', 'logo.png'));
  fs.copyFileSync(path.join(outDir, 'icon-256.png'), path.join(root, 'game', 'logo-256.png'));
  fs.copyFileSync(path.join(outDir, 'wordmark.png'), path.join(root, 'game', 'wordmark.png'));

  const mod = require('png-to-ico'); const pngToIco = mod.default || mod;
  const icoFrom = [16, 24, 32, 48, 64, 128, 256].map(s => path.join(outDir, 'icon-' + s + '.png'));
  const buf = await pngToIco(icoFrom);
  fs.mkdirSync(path.join(root, 'build'), { recursive: true });
  fs.writeFileSync(path.join(root, 'build', 'icon.ico'), buf);
  console.log('build/icon.ico  (' + icoFrom.length + ' sizes, ' + buf.length + ' bytes)');
  win.destroy();
  app.quit();
}).catch(e => { console.error(e); app.exit(1); });
