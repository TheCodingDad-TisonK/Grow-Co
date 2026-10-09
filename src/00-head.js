//@ file header: the engine's setup (the renderer, the slot, the settings), the shop's own utilities
/* ============================================================
   Grow Co.: a first-person shop simulator in 3D.
   Runs in its own window (grow3d.html). Same save key as the 2D
   game (rf-grow-v1) so progress carries over both ways. Economy
   is the same engine: buy, grow, cure, package, sell for cash.
   Rendering: three.js r128 (vendor/three), procedural everything.
   On Co Engine since 1.29.0: the engine's parts come first in the build
   (co.json names them); these are the shop's.
   ============================================================ */
  // GAME carries the game's hooks for the engine (it is CO.game); every part adds its own, 36-boot the boot steps.
  var GAME = {};
  // the settings the engine keeps beside its own (sens, invertY, quality, sound, vol, fps, fov, film, bob)
  var DEFAULT_SETTINGS = { quality: 'high', fov: 75, sens: 1.0, invertY: false, sound: true, fps: false, dayNight: 'cycle', dayLength: '20', headBob: true, hudScale: 1.0 };
  // three save slots; the main menu picks one and reloads. A save from before the slots moves into slot 1 once.
  try { if (!localStorage.getItem('rfgrowco-slot1') && localStorage.getItem('rfgrowco-v1')) { localStorage.setItem('rfgrowco-slot1', localStorage.getItem('rfgrowco-v1')); localStorage.removeItem('rfgrowco-v1'); } } catch (e) {}
  // the engine: the renderer and the scene (no palette: the shop draws its own textures), the slot (?save=<name> for a save of its own),
  // the settings, no engine input (the shop binds its own keys and mouse), a debounced save, the sun and the fog as the shop had them
  CO.setup({ canvas: 'g3-canvas', save: 'rfgrowco', slots: 3, game: GAME, settings: DEFAULT_SETTINGS, input: false, palette: false, post: false, saveDebounce: 300, exposure: 0.78, near: 0.2, far: 200, spawn: { x: 0, z: 1.6, yaw: Math.PI },
    background: 0x9fb7d0, fog: { color: 0x9fb7d0, near: 30, far: 110 }, hemi: { sky: 0xbcd8ff, ground: 0x3a2f22, intensity: 0.32 }, sun: { color: 0xfff1d6, intensity: 1.1, box: 34, near: 1, far: 60, mapSize: 2048, bias: -0.0008, normalBias: 0, radius: 1, target: [0, 0, 0] }, lightBudget: 12 });
  if (SET.dayNight === 'clock') SET.dayNight = 'cycle';   // settings saved before the cycle existed move onto it once
  var money = function (n) { return '$' + Math.floor(n).toLocaleString('en-US'); };
  var gram = function (n) { return (Math.round(n * 10) / 10) + 'g'; };

