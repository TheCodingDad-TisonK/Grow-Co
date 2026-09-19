// Electron shell for RF Grow Co.: one window, no browser chrome, the game loaded from ./game.
// The game itself is plain HTML + JavaScript and also runs from any static web server.
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

let win = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1024,
    minHeight: 600,
    backgroundColor: '#07110b',
    title: 'RF Grow Co.',
    icon: path.join(__dirname, 'game', 'rf-icon.png'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false   // the shop keeps running while the window is in the background
    }
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, 'game', 'index.html'));
  win.once('ready-to-show', () => { win.maximize(); win.show(); });

  // F11 toggles fullscreen, Ctrl+Shift+I opens the developer tools, Ctrl+R reloads (the game autosaves)
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); event.preventDefault(); }
    else if (input.control && input.shift && input.key.toLowerCase() === 'i') { win.webContents.toggleDevTools(); event.preventDefault(); }
    else if (input.control && !input.shift && input.key.toLowerCase() === 'r') { win.reload(); event.preventDefault(); }
  });

  // the game never navigates anywhere; anything that tries opens in the real browser instead
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (event, url) => { if (!url.startsWith('file:')) { event.preventDefault(); shell.openExternal(url); } });
  win.on('closed', () => { win = null; });
}

// one running copy: a second launch focuses the first, so two windows never fight over the same save
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(createWindow);
  app.on('window-all-closed', () => app.quit());
}
