//@ settings, the save state and the per-strain stash
  // ── Settings ──────────────────────────────────────────────────────
  var DEFAULT_SETTINGS = { quality: 'high', fov: 75, sens: 1.0, invertY: false, sound: true, fps: false, dayNight: 'cycle', dayLength: '20', headBob: true, hudScale: 1.0 };
  var SET = {};
  function loadSettings() {
    SET = {}; for (var k in DEFAULT_SETTINGS) SET[k] = DEFAULT_SETTINGS[k];
    try { var raw = localStorage.getItem(SETTINGS_KEY); if (raw) { var o = JSON.parse(raw); for (var j in o) if (j in SET) SET[j] = o[j]; if (o.dayLength === undefined && o.dayNight === 'clock') SET.dayNight = 'cycle'; } } catch (e) {}   // settings saved before the cycle existed move onto it once
    return SET;
  }
  function saveSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(SET)); } catch (e) {} }

  // ── State ─────────────────────────────────────────────────────────
  var S;
  var SAVE_V = 2;   /* the save's shape version: when the shape of S changes, bump this and add a step to migrate() */
  function fresh() {
    return {
      v: SAVE_V, bank: 220, xp: 0, level: 1, rep: 0,
      till: 0, tips: 0, vault: 0, pocket: 0, pending: [], courier: null,   // cash lives in places until you move it
      units: { vending: 1, lobbyCoffee: 1, arcade: 1, fridge: 1 },   // how many of each machine the shop owns
      storage: {}, order: null, deliveries: [],
      display: { lighter: 6, rpaper: 4, rgrinder: 1 }, noCustomersUntil: 0, courierBanUntil: 0,
      stock: { bags: {}, joints: {}, cookies: {} }, staff: { worker: false, task: 'idle', guardTask: 'door' },   // the back-room stock cabinet for packed goods; who works here and what they are on
      hotbar: [null, null, null, null, null, null], slot: 0,   // what you carry: six slots, the active one is what E and G act on   // counter display stock; cooldowns after trouble   // the back room and what the machines hold
      supplies: { soil: 0, pot: 1, nutrients: 0, remedy: 0, bag: 0, paper: 0, tip: 0, grinder: 0, jar: 1 },
      light: 'none', tent: 0, upgrades: {}, lic: {},
      rh: { grow: 62, dry: 62 }, dehum: { grow: 55, dry: 55 },
      clock: 9, day: 1,   // in-game time of day (hours) and day counter for the day/night cycle   // room humidity and each dehumidifier's target (0 = off)
      plants: [], batches: [],
      cured: { g: 0, qSum: 0, thcSum: 0 },
      pkg: { bags: { n: 0, qSum: 0, thcSum: 0 }, joints: { n: 0, qSum: 0, thcSum: 0 }, cookies: { n: 0, qSum: 0, thcSum: 0 } },   // derived totals, kept in step with stash/lots by syncTotals()
      stash: {}, lots: { bags: {}, joints: {}, cookies: {} },   // per strain: stash[strain] = {g,qSum,thcSum}; lots[kind][strain] = {n,qSum,thcSum}
      market: 1.0, event: null, customer: null,
      log: [], stats: { harvested: 0, sold: 0, earned: 0, plants: 0 },
      books: { monthGross: 0, dayGross: 0, exciseDue: 0, lastDayCosts: 0, arrears: 0, month: 1, lastBill: null, dayOther: 0, monthOther: 0 },   // the ledger: what has been taken, what is owed
      lastTick: now(), lastEvent: now(), lastCustomer: now(), created: now(), steps3d: 0,
      intro: { i: 0, done: false, skipped: false },   // the guided intro, only for a brand new shop
      potSoil: {}, held: null,
      vip: null, car: null, flyerDay: 0,   // where the car was left and what is in its trunk
      tob: null, cigStock: {}, cigShutter: false,   // the basement line, the cabinet behind the counter and its roller shutter
      armory: { pepper: false, taser: false, pistol: false, shotgun: false, rifle: false, ak: false, spray: 0, rounds: 0, shells: 0, cartridges: 0, bullets: 0 }   // what the weapon locker holds
    };
  }
  // A save that will not read or will not normalise never stops the shop opening. The game falls back to a fresh
  // shop in memory, keeps a copy of the save under SAVE + '-broken' for a bug report, and never writes over the slot
  // for the rest of the session. A failure later in the boot reloads the page once with RECOVER_KEY set, which
  // lands here and takes the same fresh path.
  var RECOVER_KEY = 'rfgc-recover', bootIssue = '', saveBlocked = false;
  var BOOT_FRESH_MSG = 'Your saved game wouldn\'t load, so this is a fresh shop that won\'t be saved. The old save is untouched, and a copy is kept for a bug report (F7).';
  function recoverTag(raw) { return SAVE + ':' + (raw ? raw.length : 0); }   /* a save that has changed since is tried again */
  function keepBrokenSave(raw) { if (!raw) return; try { localStorage.setItem(SAVE + '-broken', raw); } catch (e) {} }
  function load() {
    var raw = null, retry = false;
    try { raw = localStorage.getItem(SAVE); } catch (e) {}
    try { retry = sessionStorage.getItem(RECOVER_KEY) === recoverTag(raw); } catch (e) {}
    if (!retry) {
      try { S = raw ? JSON.parse(raw) : null; if (raw && (!S || typeof S !== 'object')) throw new Error('the save is not an object'); return loadNormalise(); }
      catch (e) { console.error('Grow Co.: the save in ' + SAVE + ' would not load, starting a fresh shop in memory', e); }
    }
    keepBrokenSave(raw); saveBlocked = true; bootIssue = BOOT_FRESH_MSG;
    S = fresh(); return loadNormalise();
  }
  function loadNormalise() {
    var from = S && typeof S === 'object' && typeof S.v === 'number' ? S.v : 1;   /* read before the defaults below fill in v */
    if (!S || typeof S !== 'object') { S = fresh(); from = SAVE_V; }
    if (S.cash !== undefined && S.bank === undefined) { S.bank = S.cash; delete S.cash; }   // older saves: the one cash number becomes the bank balance
    if (!S.lic && S.stats && S.stats.earned > 0) { S.lic = { retail: true, catering: true, amusement: true, lounge: true }; if (S.tent >= 2) S.lic.cult2 = true; }   // a shop that was already trading keeps what it could do before licences existed
    var f = fresh();
    for (var k in f) if (S[k] === undefined) S[k] = f[k];
    for (var k1 in f) { var fd = f[k1], sd = S[k1]; if (fd && sd && typeof fd === 'object' && typeof sd === 'object' && !Array.isArray(fd) && !Array.isArray(sd)) for (var k2 in fd) if (sd[k2] === undefined) sd[k2] = fd[k2]; }   /* one level down too: books, box, rh */
    for (var sk in f.supplies) if (S.supplies[sk] === undefined) S.supplies[sk] = f.supplies[sk];
    if (!S.potSoil || typeof S.potSoil !== 'object') S.potSoil = {};
    // older saves kept one pooled stash and one pile per kind: file them under the starter strain
    if (!S.stash || typeof S.stash !== 'object') S.stash = {}; if (!S.lots || !S.lots.bags) S.lots = { bags: {}, joints: {}, cookies: {} }; if (!S.lots.cookies) S.lots.cookies = {}; if (!S.stock) S.stock = { bags: {}, joints: {}, cookies: {} }; if (!S.staff) S.staff = { worker: false, task: 'idle', guardTask: 'door' }; if (!S.pkg.cookies) S.pkg.cookies = { n: 0, qSum: 0, thcSum: 0 };
    if (!Object.keys(S.stash).length && S.cured && S.cured.g > 0) S.stash.sunflower = { g: S.cured.g, qSum: S.cured.qSum, thcSum: S.cured.thcSum };
    ['bags', 'joints', 'cookies'].forEach(function (k) { if (!Object.keys(S.lots[k]).length && S.pkg && S.pkg[k] && S.pkg[k].n > 0) S.lots[k].sunflower = { n: S.pkg[k].n, qSum: S.pkg[k].qSum, thcSum: S.pkg[k].thcSum }; });
    syncTotals(); bindHotbar();
    S.vip = null;   /* the lounge guest is a runtime figure: a saved one can never be served or sent away, and blocks every later guest */
    S.tent = clamp(Math.floor(+S.tent || 0), 0, TENTS.length - 1);   /* a tent from a content pack that has since been switched off */
    if (!S.intro) S.intro = { i: 0, done: false, skipped: false };
    if (!S.intro.done && !S.intro.skipped && S.intro.i === 0 && ((S.stats && S.stats.earned > 0) || S.day > 1 || S.plants.length || S.xp > 0)) S.intro.skipped = true;   /* a shop that is already running never gets handed a tutorial */
    // plants keep a fixed pot (slot); older saves get the first free ones
    var used = {}; S.plants.forEach(function (p) { if (typeof p.slot === 'number') used[p.slot] = true; });
    S.plants.forEach(function (p) { if (typeof p.slot !== 'number') { var k = 0; while (used[k]) k++; p.slot = k; used[k] = true; } });
    if (S.held && typeof S.held !== 'object') S.held = null;
    return migrate(S, from);
  }
  // One place for save upgrades. It only ever fills in what a save is missing, never changes a value it has, and every
  // step is safe to run twice. `from` is the version the save was written at (1 for saves from before versions).
  function migrate(s, from) {
    function plain(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }
    function fill(dst, src, depth) { for (var k in src) { if (dst[k] === undefined) dst[k] = src[k]; else if (depth > 0 && plain(dst[k]) && plain(src[k])) fill(dst[k], src[k], depth - 1); } }
    fill(s, fresh(), 2);   /* the top level, then objects one and two levels down */
    if (plain(s.tob) && s.tob.bays) fill(s.tob, tobFresh(), 2);   /* a basement line saved before a machine or a pack size existed */
    if (plain(s.x) && plain(s.x.lab) && plain(s.x.lab.out)) { var out = s.x.lab.out; if (typeof out.gummy !== 'number') out.gummy = 0; if (typeof out.choc !== 'number') out.choc = 0; }
    /* version steps go here, each gated on `from` (version 1 to 2 needs nothing beyond the fills above) */
    s.v = SAVE_V;
    return s;
  }
  var saveT = null;
  var saveFailed = false;
  function writeSave() { if (saveBlocked) return; try { localStorage.setItem(SAVE, JSON.stringify(S)); saveFailed = false; } catch (e) { if (!saveFailed) { saveFailed = true; try { toast('⚠ The game could not save: the storage is full or blocked', 'bad'); } catch (e2) {} } } }
  function save() { if (saveT) return; saveT = setTimeout(function () { saveT = null; writeSave(); }, 300); }
  function saveNow() { if (saveT) { clearTimeout(saveT); saveT = null; } writeSave(); }   /* the debounce would lose the last change when the window closes */
  window.addEventListener('pagehide', function () { if (ui.started) saveNow(); }); window.addEventListener('beforeunload', function () { if (ui.started) saveNow(); });
  function slots() { return TENTS[S.tent].slots; }
  function lightObj() { for (var i = 0; i < LIGHTS.length; i++) if (LIGHTS[i].id === S.light) return LIGHTS[i]; return LIGHTS[0]; }
  function lightIdx() { for (var i = 0; i < LIGHTS.length; i++) if (LIGHTS[i].id === S.light) return i; return 0; }
  // ── Per-strain stash and packed lots ──
  function stashOf(id) { return S.stash[id] || (S.stash[id] = { g: 0, qSum: 0, thcSum: 0 }); }
  function lotOf(kind, id) { return S.lots[kind][id] || (S.lots[kind][id] = { n: 0, qSum: 0, thcSum: 0 }); }
  function stashAdd(id, grams, q, thc) { var s = stashOf(id); s.g += grams; s.qSum += q * grams; s.thcSum += thc * grams; syncTotals(); }
  function stashDraw(id, n) { var s = stashOf(id); var q = s.g > 0 ? s.qSum / s.g : 0, thc = s.g > 0 ? s.thcSum / s.g : 1; s.g -= n; s.qSum -= q * n; s.thcSum -= thc * n; if (s.g < 0.05) { s.g = 0; s.qSum = 0; s.thcSum = 0; } syncTotals(); return { q: q, thc: thc }; }
  function lotAdd(kind, id, n, q, thc) { var l = lotOf(kind, id); l.n += n; l.qSum += q * n; l.thcSum += thc * n; syncTotals(); }
  function stockOf(kind, id) { if (!S.stock[kind]) S.stock[kind] = {}; return S.stock[kind][id] || (S.stock[kind][id] = { n: 0, qSum: 0, thcSum: 0 }); }
  function stockCount() { var n = 0; ['bags', 'joints', 'cookies'].forEach(function (k) { Object.keys(S.stock[k] || {}).forEach(function (id) { n += S.stock[k][id].n; }); }); return n; }
  function isGoods(h) { return !!h && (h.kind === 'bags' || h.kind === 'joints' || h.kind === 'cookies'); }
  function stockStore(h) { var l = stockOf(h.kind, h.strain || 'sunflower'); l.n += h.n; l.qSum += h.qSum; l.thcSum += h.thcSum; toast('🗄️ ' + h.n + ' ' + kindName(h.kind, h.n) + ' locked in the stock cabinet', 'good'); S.held = null; sfx('putdown'); ui.refreshOpen(); }
  function stockDraw(kind, id, n) { var l = stockOf(kind, id); n = Math.min(n, l.n); if (n <= 0) return null; var q = l.qSum / l.n, thc = l.thcSum / l.n; l.n -= n; l.qSum -= q * n; l.thcSum -= thc * n; if (l.n <= 0) { l.n = 0; l.qSum = 0; l.thcSum = 0; } return { n: n, qSum: q * n, thcSum: thc * n }; }
  function stockTake(kind, id, n) { if (hotbarFull()) { toast('Your hands are full (G puts things down)', 'bad'); return; } var d = stockDraw(kind, id, n); if (!d) return; take({ kind: kind, strain: id, n: d.n, qSum: d.qSum, thcSum: d.thcSum }); toast('Took ' + d.n + ' ' + strainById(id).name + ' ' + kindName(kind, d.n), ''); ui.refreshOpen(); }
  function stockToShelf(kind, id) { var d = stockDraw(kind, id, 9999); if (!d) return; var l = lotOf(kind, id); l.n += d.n; l.qSum += d.qSum; l.thcSum += d.thcSum; syncTotals(); syncGoods(); }
  function shelfToStock(kind, id) { var l = lotOf(kind, id); if (l.n <= 0) return; var s = stockOf(kind, id); s.n += l.n; s.qSum += l.qSum; s.thcSum += l.thcSum; l.n = 0; l.qSum = 0; l.thcSum = 0; syncTotals(); syncGoods(); }
  function lotDraw(kind, id, n) { var l = lotOf(kind, id); n = Math.min(n, l.n); var q = l.n ? l.qSum / l.n : 0, thc = l.n ? l.thcSum / l.n : 1; l.n -= n; l.qSum -= q * n; l.thcSum -= thc * n; if (l.n <= 0) { l.n = 0; l.qSum = 0; l.thcSum = 0; } syncTotals(); return { n: n, q: q, thc: thc }; }
  function lotCount(kind, id) { if (!id) return S.pkg[kind].n; var l = S.lots[kind][id]; return l ? l.n : 0; }
  function strainsWithGoods() { var out = {}; Object.keys(S.stash).forEach(function (k) { if (S.stash[k].g > 0) out[k] = 1; }); ['bags', 'joints', 'cookies'].forEach(function (kd) { Object.keys(S.lots[kd]).forEach(function (k) { if (S.lots[kd][k].n > 0) out[k] = 1; }); }); return Object.keys(out); }
  function syncTotals() {
    var c = { g: 0, qSum: 0, thcSum: 0 }; Object.keys(S.stash).forEach(function (k) { var s = S.stash[k]; c.g += s.g; c.qSum += s.qSum; c.thcSum += s.thcSum; }); S.cured = c;
    ['bags', 'joints', 'cookies'].forEach(function (kd) { var t = { n: 0, qSum: 0, thcSum: 0 }; Object.keys(S.lots[kd]).forEach(function (k) { var l = S.lots[kd][k]; t.n += l.n; t.qSum += l.qSum; t.thcSum += l.thcSum; }); S.pkg[kd] = t; });
  }
  function curedAvgQ() { return S.cured.g > 0 ? S.cured.qSum / S.cured.g : 0; }
  function curedAvgThc() { return S.cured.g > 0 ? S.cured.thcSum / S.cured.g : 1; }
  function plantById(pid) { for (var i = 0; i < S.plants.length; i++) if (S.plants[i].id === pid) return S.plants[i]; return null; }
  function plantAtSlot(slot) { for (var i = 0; i < S.plants.length; i++) if (S.plants[i].slot === slot) return S.plants[i]; return null; }

