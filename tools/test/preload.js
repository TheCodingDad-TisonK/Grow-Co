// Loaded into the test window before any of the game's own scripts (the window runs with context isolation
// off, so this shares the page's globals). From here on the game only ever sees this clock and these timers:
// time moves when a test moves it, never on its own, so a test runs the same on every machine and a rule that
// takes minutes of game time (patience, curing, a robber's nerve) takes milliseconds.
'use strict';
(function () {
  const realSetTimeout = window.setTimeout.bind(window);
  const RealDate = window.Date;
  let T = RealDate.now();

  class FakeDate extends RealDate {
    constructor(...a) { if (a.length) super(...a); else super(T); }
    static now() { return T; }
  }
  window.Date = FakeDate;

  const timers = new Map(); let seq = 1;
  const errors = [];
  window.setTimeout = function (fn, ms, ...args) { const id = seq++; timers.set(id, { fn, args, due: T + (+ms || 0), every: 0 }); return id; };
  window.setInterval = function (fn, ms, ...args) { const every = Math.max(1, +ms || 0), id = seq++; timers.set(id, { fn, args, due: T + every, every }); return id; };
  window.clearTimeout = window.clearInterval = function (id) { timers.delete(id); };
  window.requestAnimationFrame = function () { return 0; };   // frames happen only when a test asks for one
  window.cancelAnimationFrame = function () {};

  // run every timer that falls due before the clock reaches T + ms, in order, then land on T + ms
  function advance(ms) {
    const end = T + ms;
    for (;;) {
      let next = null;
      for (const [id, t] of timers) if (t.due <= end && (!next || t.due < next.t.due)) next = { id, t };
      if (!next) break;
      T = Math.max(T, next.t.due);
      if (next.t.every) next.t.due += next.t.every; else timers.delete(next.id);
      try { if (typeof next.t.fn === 'function') next.t.fn(...next.t.args); } catch (e) { errors.push('in a timer: ' + (e && e.stack || e)); }
    }
    T = end;
  }

  window.addEventListener('error', (e) => errors.push((e.message || 'error') + ' @ ' + String(e.filename || '').split('/').pop() + ':' + e.lineno));
  window.addEventListener('unhandledrejection', (e) => errors.push('unhandled rejection: ' + (e.reason && (e.reason.stack || e.reason.message) || e.reason)));
  const realConsoleError = console.error;
  console.error = function (...a) { errors.push('console.error: ' + a.map(String).join(' ')); return realConsoleError.apply(console, a); };

  // a seeded Math.random: the same test draws the same numbers every run, so a failure can be run again and looked at
  function seeded(seed) { let a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // every DLC on, before workshop.js reads its state: the suite tests the whole game (tests/dlc.test.js switches them off)
  try { localStorage.setItem('rfgrowco-workshop', JSON.stringify({ on: ['rf.dlc.tobacco', 'rf.dlc.lab', 'rf.dlc.greenhouse', 'rf.dlc.dev'], user: [], dlcSeeded: true })); } catch (e) {}

  const seedArg = new URLSearchParams(location.search).get('seed');
  if (seedArg) Math.random = seeded(+seedArg);   // before any game script runs, so the whole page is reproducible

  const H = window.__H = {
    errors,
    seed(n) { Math.random = seeded(n); },
    get R() { return window.RFGROW; },
    get S() { return window.RFGROW.S; },
    get T() { return window.RFGROW.test; },
    get I() { return window.RFGROW.internal; },
    now: () => T,
    advance,
    sleep: (ms) => new Promise((r) => realSetTimeout(r, ms)),   // real time, for the page's own async work

    // bring the game up to the point where a player is standing in the shop
    async boot() {
      for (let i = 0; i < 600; i++) { const b = document.getElementById('g3-start-btn'); if (window.RFGROW && b && !b.disabled && b.offsetParent !== undefined) break; advance(100); await H.sleep(5); }
      if (!window.RFGROW) throw new Error('the game never came up: ' + errors.slice(0, 3).join(' | '));
      document.getElementById('g3-start-btn').click();
      for (let i = 0; i < 200 && !window.RFGROW.ui.started; i++) { advance(100); await H.sleep(5); }
      if (!window.RFGROW.ui.started) throw new Error('the start button did not start the game');
      window.THREE.Clock.prototype.getDelta = () => 0.05;   // every frame is 50 ms of game time
      H.I.renderer.render = () => {};                        // the tests check rules, not pixels
      H.R.hooks.unlock.push(() => true);                     // a lost pointer lock never opens the pause menu
      H.R.player.locked = true;
      const S = H.S; S.noCustomersUntil = T + 365 * 864e5;   // nobody walks in unless the test sends them
      S.lastEvent = T + 365 * 864e5;                         // no random events (a 420 rush, a tip, a robbery) unless the test starts one
      if (S.intro) { S.intro.done = true; S.intro.skipped = true; }
      return H;
    },
    frame(n) { for (let i = 0; i < (n || 1); i++) { advance(50); window.RFGROW.stepFrame(); } },   // 20 frames = 1 s
    step(sec) { H.frame(Math.round(sec * 20)); },
    until(fn, maxSec, what, each) { for (let i = 0; i < maxSec * 20; i++) { if (fn()) return; if (each) each(); H.frame(1); } if (!fn()) throw new Error('waited ' + maxSec + ' s for ' + (what || String(fn).slice(0, 100))); },

    // customers the test sends in: every card is good (a bad one is turned away at the door, which is its own test)
    arrive(n) { const took = []; for (let i = 0; i < (n || 1); i++) took.push(H.R.customerArrives(false)); H.validIds(); return took; },
    validIds() { const S = H.S; [S.customer].concat(H.R.lineup().map((m) => m.c)).forEach((c) => { if (c && c.id) { c.id.ok = true; c.id.flaw = -1; } }); },
    // pass as the last argument of until() while a test is only setting the scene: nobody runs out of patience meanwhile
    patience() { const S = H.S; if (S.customer) S.customer.until = T + 600000; H.R.lineup().forEach((m) => { if (m.c) m.waited = 0; }); },

    ok(c, msg) { if (!c) throw new Error(msg || 'expected something true'); },
    eq(a, b, msg) { if (a !== b) throw new Error((msg ? msg + ': ' : '') + 'got ' + JSON.stringify(a) + ', expected ' + JSON.stringify(b)); },
    near(a, b, tol, msg) { if (!(Math.abs(a - b) <= tol)) throw new Error((msg ? msg + ': ' : '') + 'got ' + a + ', expected ' + b + ' within ' + tol); },

    key(code, extra) { document.dispatchEvent(new KeyboardEvent('keydown', Object.assign({ code, bubbles: true }, extra))); },
    mouseDown(button) { H.I.renderer.domElement.dispatchEvent(new MouseEvent('mousedown', { button, bubbles: true })); },
    mouseUp(button) { document.dispatchEvent(new MouseEvent('mouseup', { button, bubbles: true })); },
    // Math.random pinned to a value (or a function) until the returned function is called
    random(v) { const real = Math.random; Math.random = typeof v === 'function' ? v : () => v; return () => { Math.random = real; }; },
    hold(item) { const S = H.S; S.hotbar = [null, null, null, null, null, null]; S.slot = 0; if (item) H.R.take(item); return H.R.held(); },
  };
})();
