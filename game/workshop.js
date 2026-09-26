// Workshop: content packs for Grow Co. One file, used by both builds, loaded BEFORE grow3d.js.
//
// A pack is a plain JSON manifest. It can add things to the tables the game actually reads
// (strains, lights, tents, orderable supplies), retune a few numbers, and carry 3D models
// exported from Blender as .glb/.gltf that replace the meshes the game builds by hand.
//
//   { "id": "you.mypack", "name": "My Pack", "author": "you", "icon": "🌱",
//     "blurb": "one line",
//     "strains":  [ { id, name, emoji, seed, growMs, yield, thc, lvl, bud, hair, leaf } ],
//     "lights":   [ { id, name, spd, qual, price, color, intensity } ],
//     "tents":    [ { slots, price, cols, rows, lic } ],
//     "supplies": [ { id, ico, name, price, qty, hint, stock, sell } ],
//     "tune":     { footfall: 1.2, seedCost: 0.8, upgradeCost: 1.0 },
//     "city":     { grow: 60, rows: 2 },
//     "models":   { "item:joints": "joints.glb" } }
//
// A DLC is a built-in pack with "dlc": "<id>" and no tables: it switches a whole part of the game on, and the game
// asks RF_WORKSHOP.dlc(id) before it lets you in. An imported pack can never be a DLC (validate() drops the field).
//
// A bundle is a pack with "bundle": ["id", "id"] and no content of its own.
// Packs in the same "group" are mutually exclusive (the tuning packs use this).
//
// Storage: the enabled list and user manifests live in localStorage; model binaries are far
// too big for that, so they live in IndexedDB and are fetched after boot, then hot-swapped in.
(function () {
  'use strict';
  var LS_KEY = 'rfgrowco-workshop', DB_NAME = 'rfgc-workshop', DB_STORE = 'models', DB_VER = 1;
  var MAX_MODEL = 12 * 1024 * 1024;   // one model file; a Blender export of a prop is normally far under this

  // ── built-in packs ────────────────────────────────────────────────
  // Only tables the game genuinely reads. Nothing here adds an upgrade or a cigarette SKU,
  // because those need code behind them and would sit in your shop doing nothing.
  var BUILTIN = [
    // DLC: parts of the game that are not in a new shop until you switch them on. All free. Switching one off hides it
    // and keeps the save exactly as it is, so switching it back on brings everything back.
    { id: 'rf.dlc.tobacco', dlc: 'tobacco', name: 'RF Smoking: the Tobacco Works', icon: '🚬', author: 'TheCodingDad', kind: 'DLC',
      what: 'the basement works · tablet rounds',
      blurb: 'The cigarette line in the basement, the tobacco licence, the delivery tablet and its rounds, and the Corner Tobacconist.' },
    { id: 'rf.dlc.lab', dlc: 'lab', name: 'The Extraction Lab', icon: '🧪', author: 'TheCodingDad', kind: 'DLC',
      what: 'carts · gummies · chocolate · hash',
      blurb: 'The lab off the basement turns low-grade bud into vape carts, gummies, chocolate and pressed hash for the cabinet.' },
    { id: 'rf.dlc.greenhouse', dlc: 'greenhouse', name: 'The Roof Greenhouse', icon: '🌿', author: 'TheCodingDad', kind: 'DLC',
      what: 'six roof beds',
      blurb: 'Six beds on the roof, up the ladder in the flat. They grow on daylight, with the Cultivation permit II.' },
    { id: 'rf.dlc.dev', dlc: 'dev', name: 'Dev Tools', icon: '🛠', author: 'TheCodingDad', kind: 'DLC',
      what: 'cheats in the pause menu',
      blurb: 'The cheat menu: money, stock, customers and robberies on demand, the clock, levels and teleports.' },
    { id: 'rf.seeds.heritage', name: 'Heritage Genetics', icon: '🌱', author: 'TheCodingDad', kind: 'Seeds',
      blurb: 'Four old-school cultivars for the early and middle game.',
      strains: [
        { id: 'skunk', name: 'Old Skunk', emoji: '🦨', seed: 14, growMs: 600000, yield: 15, thc: 1.15, lvl: 1, bud: 0x84b45c, hair: 0xd9a23a, leaf: 0x4a9a3e },
        { id: 'cheese', name: 'Barn Cheese', emoji: '🧀', seed: 26, growMs: 780000, yield: 20, thc: 1.35, lvl: 3, bud: 0xd6cf7a, hair: 0xe8b04a, leaf: 0x5aa84c },
        { id: 'northern', name: 'Northern Frost', emoji: '❄️', seed: 40, growMs: 960000, yield: 19, thc: 1.65, lvl: 5, bud: 0xcfe0e8, hair: 0x9fc7e8, leaf: 0x3f8f6a },
        { id: 'afghan', name: 'Afghan Brick', emoji: '🧱', seed: 55, growMs: 1140000, yield: 27, thc: 1.5, lvl: 7, bud: 0x9a7a4a, hair: 0xc98a3a, leaf: 0x3a7a34 }
      ] },
    { id: 'rf.seeds.exotic', name: 'Exotic Cultivars', icon: '🌈', author: 'TheCodingDad', kind: 'Seeds',
      blurb: 'Three slow, expensive, very strong plants for a shop that has room to wait.',
      strains: [
        { id: 'opal', name: 'Opal Frost', emoji: '💠', seed: 120, growMs: 1440000, yield: 24, thc: 2.6, lvl: 10, bud: 0xbfe6ff, hair: 0xff9ad2, leaf: 0x4a6fd6 },
        { id: 'sunset', name: 'Sunset Sherbet', emoji: '🌇', seed: 145, growMs: 1560000, yield: 26, thc: 2.8, lvl: 12, bud: 0xffab6f, hair: 0xff4f7a, leaf: 0x6a4a9e },
        { id: 'midnight', name: 'Midnight Cake', emoji: '🌑', seed: 190, growMs: 1740000, yield: 30, thc: 3.1, lvl: 14, bud: 0x6a5a8a, hair: 0xd6b0ff, leaf: 0x2f2f5a }
      ] },
    { id: 'rf.grow.lighting', name: 'Pro Lighting Rack', icon: '💡', author: 'TheCodingDad', kind: 'Grow room',
      blurb: 'Two more lamps between the LED panel and the quantum board, and a bigger tent at the top end.',
      lights: [
        { id: 'cmh', name: 'Ceramic MH', spd: 1.7, qual: 15, price: 340, color: 0xffe9c8, intensity: 5.2 },
        { id: 'bar', name: 'LED bar array', spd: 2.5, qual: 30, price: 2100, color: 0xfff0ff, intensity: 8.2 }
      ],
      tents: [ { slots: 24, price: 12000, cols: 6, rows: 4, lic: 'cult3' } ] },
    { id: 'rf.shop.counter', name: 'Counter Culture', icon: '🛍️', author: 'TheCodingDad', kind: 'Retail',
      blurb: 'More for the counter display and the machines: rolling trays, cones, energy cans and flapjacks.',
      supplies: [
        { id: 'rtray', ico: '🪵', name: 'Rolling trays (×5)', price: 25, qty: 5, stock: 'display', sell: 12, hint: 'Counter display' },
        { id: 'rcone', ico: '🍦', name: 'Pre-rolled cones (×20)', price: 16, qty: 20, stock: 'display', sell: 3, hint: 'Counter display' },
        { id: 'energy', ico: '⚡', name: 'Energy cans (case of 12)', price: 24, qty: 12, stock: 'vend', hint: 'Restock the vending machine' },
        { id: 'flapjack', ico: '🥮', name: 'Flapjacks (box of 12)', price: 18, qty: 12, stock: 'vend', hint: 'Restock the vending machine' }
      ] },
    { id: 'rf.shop.packaging', name: 'Baggies & Boxes', icon: '🛍️', author: 'TheCodingDad', kind: 'Retail',
      blurb: 'More ways to package what you sell: mylar pouches, gift tins, half-ounce bags and jars.',
      supplies: [
        { id: 'mylar', ico: '🥡', name: 'Mylar pouches (×20)', price: 22, qty: 20, hint: 'Smarter packaging for eighths' },
        { id: 'bigbag', ico: '👜', name: 'Half-ounce bags (×10)', price: 18, qty: 10, hint: 'For the bigger orders' },
        { id: 'tin', ico: '🪙', name: 'Gift tins (×6)', price: 30, qty: 6, stock: 'display', sell: 14, hint: 'Counter display' },
        { id: 'stash', ico: '🫙', name: 'Stash jars (×4)', price: 26, qty: 4, stock: 'display', sell: 18, hint: 'Counter display' }
      ] },
    { id: 'rf.city.bigger', name: 'Bigger City', icon: '🏙️', author: 'TheCodingDad', kind: 'World',
      blurb: 'The town keeps going: the map grows by half again, with more blocks out past the avenues.',
      city: { grow: 56, rows: 2 } },
    { id: 'rf.city.life', name: 'City Life', icon: '🎬', author: 'TheCodingDad', kind: 'World',
      blurb: 'Two more places worth walking to: a grocery that wholesales your machine stock, and a picture house.',
      places: [
        { id: 'grocer', name: 'Halloway\'s Grocery', sub: 'grocery · wholesale trade', x: -6, z: -26, w: 15, d: 13, h: 8.5, colour: 0xb8a98a, doorColour: 0x4aa35a, pin: '#6fd08a',
          sells: [ { item: 'drink', off: 0.25 }, { item: 'snack', off: 0.25 }, { item: 'cup', off: 0.3 }, { item: 'beans', off: 0.2 }, { item: 'mix', off: 0.2 } ] },
        { id: 'cinema', name: 'The Roxy', sub: 'two screens · matinees daily', x: 31, z: -26, w: 20, d: 14, h: 11, colour: 0x6a5f7a, doorColour: 0xd64b8a, pin: '#e07ab0',
          service: { label: '🎬 Buy a ticket and sit through a film', note: 'a couple of hours out of the shop: the police lose interest and word gets round', cost: 14, heat: -12, rep: 1, daily: true } }
      ] },
    { id: 'rf.season.xmas', name: 'Christmas', icon: '🎄', author: 'TheCodingDad', kind: 'Seasonal', group: 'season',
      blurb: 'Snow that doesn\'t let up, a festive strain and things for the counter display in December.',
      festive: { snow: true },
      strains: [ { id: 'candycane', name: 'Candy Cane Kush', emoji: '🍬', seed: 44, growMs: 900000, yield: 21, thc: 1.8, lvl: 4, bud: 0xf4dce0, hair: 0xd0201a, leaf: 0x2f7a4a } ],
      supplies: [
        { id: 'cracker', ico: '🎉', name: 'Crackers (box of 12)', price: 20, qty: 12, stock: 'display', sell: 6, hint: 'Counter display · December only in spirit' },
        { id: 'mince', ico: '🥧', name: 'Mince pies (box of 12)', price: 14, qty: 12, stock: 'vend', hint: 'Restock the vending machine' }
      ] },
    { id: 'rf.season.newyear', name: 'New Year', icon: '🎆', author: 'TheCodingDad', kind: 'Seasonal', group: 'season',
      blurb: 'Fireworks over the town after dark, a midnight strain and something fizzy for the machines.',
      festive: { fireworks: true },
      strains: [ { id: 'midnightgold', name: 'Midnight Gold', emoji: '🥂', seed: 90, growMs: 1200000, yield: 25, thc: 2.5, lvl: 8, bud: 0xe8c27a, hair: 0xfff3c8, leaf: 0x3a5a3a } ],
      supplies: [
        { id: 'fizz', ico: '🍾', name: 'Fizz (case of 12)', price: 34, qty: 12, stock: 'vend', hint: 'Restock the vending machine' },
        { id: 'sparkler', ico: '✨', name: 'Sparklers (×20)', price: 12, qty: 20, stock: 'display', sell: 4, hint: 'Counter display' }
      ] },
    { id: 'rf.car.motorpool', name: 'Motor Pool', icon: '🚙', author: 'TheCodingDad', kind: 'Vehicle', group: 'car',
      blurb: 'A bigger, faster estate in the garage: deep red, a much larger boot and a lot more top end.',
      vehicle: { name: 'RF Estate', colour: 0x8a1c1c, vmax: 30, trunk: 90 } },
    { id: 'rf.car.van', name: 'The Old Van', icon: '🚐', author: 'TheCodingDad', kind: 'Vehicle', group: 'car',
      blurb: 'Slow, cream, and it swallows an enormous load. For a shop that lives on the delivery round.',
      vehicle: { name: 'Delivery Van', colour: 0xe4dcc4, vmax: 19, trunk: 160 } },
    { id: 'rf.tune.hustle', name: 'Hustle Mode', icon: '🔥', author: 'TheCodingDad', kind: 'Balance', group: 'tune',
      blurb: 'Seeds and gear cost far more and fewer people come through the door. For a shop that has got too comfortable.',
      tune: { footfall: 0.8, seedCost: 1.6, upgradeCost: 1.45 } },
    { id: 'rf.tune.easy', name: 'Easy Street', icon: '🌤️', author: 'TheCodingDad', kind: 'Balance', group: 'tune',
      blurb: 'Cheaper seeds and gear and a much busier shop. For pottering about.',
      tune: { footfall: 1.4, seedCost: 0.6, upgradeCost: 0.7 } },
    { id: 'rf.bundle.grower', name: 'Grower\'s Bundle', icon: '📦', author: 'TheCodingDad', kind: 'Bundle',
      blurb: 'Heritage Genetics, Exotic Cultivars and the Pro Lighting Rack together.',
      bundle: ['rf.seeds.heritage', 'rf.seeds.exotic', 'rf.grow.lighting'] },
    { id: 'rf.bundle.retail', name: 'Retail Bundle', icon: '🏪', author: 'TheCodingDad', kind: 'Bundle',
      blurb: 'Counter Culture and Baggies & Boxes: everything to sell and everything to sell it in.',
      bundle: ['rf.shop.counter', 'rf.shop.packaging'] },
    { id: 'rf.bundle.everything', name: 'The Lot', icon: '🎁', author: 'TheCodingDad', kind: 'Bundle',
      blurb: 'Every content pack, city included. Seasonal and balance packs are left alone: pick one of each yourself.',
      bundle: ['rf.seeds.heritage', 'rf.seeds.exotic', 'rf.grow.lighting', 'rf.shop.counter', 'rf.shop.packaging', 'rf.city.bigger', 'rf.city.life'] }
  ];

  // ── storage ───────────────────────────────────────────────────────
  function readState() {
    try { var raw = localStorage.getItem(LS_KEY); var s = raw ? JSON.parse(raw) : null; if (!s || typeof s !== 'object') s = {}; }
    catch (e) { s = {}; }
    if (!Array.isArray(s.on)) s.on = [];
    if (!Array.isArray(s.user)) s.user = [];
    return s;
  }
  function writeState(s) { try { localStorage.setItem(LS_KEY, JSON.stringify(s)); return true; } catch (e) { return false; } }
  var state = readState();
  // DLC arrived in v1.26, switched off. A shop that already uses one keeps it: the first time this version runs, any
  // save holding the tobacco licence, lab stock or a sown roof bed switches that DLC on. Dev Tools always start off.
  function dlcFromSaves(saves) {
    var on = {};
    saves.forEach(function (s) {
      if (!s || typeof s !== 'object') return;
      var x = s.x && typeof s.x === 'object' ? s.x : {}, lab = x.lab && typeof x.lab === 'object' ? x.lab : {}, out = lab.out || {}, cab = s.cigStock || {};
      if (s.lic && s.lic.tobacco) on['rf.dlc.tobacco'] = 1;
      if (lab.job || ['cart', 'hash', 'gummy', 'choc'].some(function (k) { return out[k] > 0 || cab[k] > 0; })) on['rf.dlc.lab'] = 1;
      if (Array.isArray(x.roof) && x.roof.some(function (b) { return b && b.stage && b.stage !== 'empty'; })) on['rf.dlc.greenhouse'] = 1;
    });
    return Object.keys(on);
  }
  function savesOnDisk() {   // every save of either build: rfgrowco-slot1..3 and developer saves, the desk's rf-grow-v1 and rf-grow-<name>
    var out = [];
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (!/^(rfgrowco-|rf-grow-)/.test(k) || /-(broken|workshop|settings)$/.test(k)) continue; try { var s = JSON.parse(localStorage.getItem(k)); if (s && typeof s === 'object' && !Array.isArray(s) && (typeof s.bank === 'number' || typeof s.day === 'number')) out.push(s); } catch (e) {} } } catch (e) {}
    return out;
  }
  if (!state.dlcSeeded) { state.dlcSeeded = true; dlcFromSaves(savesOnDisk()).forEach(function (id) { if (state.on.indexOf(id) < 0) state.on.push(id); }); writeState(state); }

  function allPacks() { return BUILTIN.concat(state.user); }
  function byId(id) { var a = allPacks(); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function isOn(id) { return state.on.indexOf(id) >= 0; }
  function dlc(id) { for (var i = 0; i < BUILTIN.length; i++) if (BUILTIN[i].dlc === id) return isOn(BUILTIN[i].id); return false; }
  function isBuiltin(id) { for (var i = 0; i < BUILTIN.length; i++) if (BUILTIN[i].id === id) return true; return false; }

  function setOn(id, on) {
    var p = byId(id); if (!p) return;
    if (on) {
      if (p.group) allPacks().forEach(function (o) { if (o !== p && o.group === p.group) drop(o.id); });   /* one balance pack at a time */
      if (state.on.indexOf(id) < 0) state.on.push(id);
      if (p.bundle) p.bundle.forEach(function (b) { if (byId(b) && state.on.indexOf(b) < 0) state.on.push(b); });
    } else {
      drop(id);
      if (p.bundle) p.bundle.forEach(drop);
    }
    writeState(state);
  }
  function drop(id) { var i = state.on.indexOf(id); if (i >= 0) state.on.splice(i, 1); }

  // a bundle reads as on only when everything it contains is on
  function effectiveOn(p) { return p.bundle ? p.bundle.length > 0 && p.bundle.every(isOn) : isOn(p.id); }

  // ── validating an imported pack ───────────────────────────────────
  var NUM = function (v) { return typeof v === 'number' && isFinite(v); };
  function fail(m) { throw new Error(m); }
  function validate(p) {
    if (!p || typeof p !== 'object') fail('That file isn\'t a pack.');
    if (typeof p.id !== 'string' || !/^[a-z0-9][a-z0-9._-]{2,63}$/i.test(p.id)) fail('A pack needs an "id" like "you.mypack" (letters, digits, dots, dashes).');
    if (typeof p.name !== 'string' || !p.name.trim()) fail('A pack needs a "name".');
    var out = { id: p.id, name: String(p.name).slice(0, 60), author: String(p.author || 'unknown').slice(0, 40), icon: String(p.icon || '🧩').slice(0, 4), kind: String(p.kind || 'Pack').slice(0, 20), blurb: String(p.blurb || '').slice(0, 160), user: true };
    if (p.group) out.group = String(p.group).slice(0, 20);
    if (Array.isArray(p.bundle)) out.bundle = p.bundle.filter(function (x) { return typeof x === 'string'; }).slice(0, 40);
    if (Array.isArray(p.strains)) out.strains = p.strains.slice(0, 40).map(function (s, i) {
      if (typeof s.id !== 'string' || !s.id) fail('Strain ' + (i + 1) + ' needs an id.');
      return { id: s.id, name: String(s.name || s.id).slice(0, 40), emoji: String(s.emoji || '🌿').slice(0, 4),
        seed: Math.max(1, +s.seed || 20), growMs: Math.max(30000, +s.growMs || 600000), yield: Math.max(1, +s.yield || 14),
        thc: Math.max(0.1, Math.min(4, +s.thc || 1.2)), lvl: Math.max(1, Math.round(+s.lvl || 1)),
        bud: +s.bud || 0x7fc96b, hair: +s.hair || 0xffb347, leaf: +s.leaf || 0x4caf50 };
    });
    if (Array.isArray(p.lights)) out.lights = p.lights.slice(0, 20).map(function (l, i) {
      if (typeof l.id !== 'string' || !l.id) fail('Light ' + (i + 1) + ' needs an id.');
      return { id: l.id, name: String(l.name || l.id).slice(0, 40), spd: Math.max(0.5, +l.spd || 1), qual: +l.qual || 0, price: Math.max(0, +l.price || 0), color: +l.color || 0xfff1d0, intensity: Math.max(0, +l.intensity || 0) };
    });
    if (Array.isArray(p.tents)) out.tents = p.tents.slice(0, 12).map(function (t) {
      return { slots: Math.max(1, Math.round(+t.slots || 4)), price: Math.max(0, +t.price || 0), cols: Math.max(1, Math.round(+t.cols || 2)), rows: Math.max(1, Math.round(+t.rows || 2)), lic: t.lic ? String(t.lic).slice(0, 20) : undefined };
    });
    if (Array.isArray(p.supplies)) out.supplies = p.supplies.slice(0, 40).map(function (s, i) {
      if (typeof s.id !== 'string' || !s.id) fail('Supply ' + (i + 1) + ' needs an id.');
      var o = { id: s.id, ico: String(s.ico || '📦').slice(0, 4), name: String(s.name || s.id).slice(0, 48), price: Math.max(0, +s.price || 5), hint: String(s.hint || '').slice(0, 80) };
      if (NUM(+s.qty) && +s.qty > 1) o.qty = Math.round(+s.qty);
      if (s.stock === 'display' || s.stock === 'vend' || s.stock === 'coffee') o.stock = s.stock;
      if (NUM(+s.sell) && +s.sell > 0) o.sell = +s.sell;
      return o;
    });
    if (p.tune && typeof p.tune === 'object') { out.tune = {}; ['footfall', 'seedCost', 'upgradeCost'].forEach(function (k) { if (NUM(+p.tune[k])) out.tune[k] = Math.max(0.1, Math.min(10, +p.tune[k])); }); }
    if (p.city && typeof p.city === 'object') { out.city = {}; if (NUM(+p.city.grow)) out.city.grow = Math.max(0, Math.min(120, +p.city.grow)); if (NUM(+p.city.rows)) out.city.rows = Math.max(0, Math.min(4, Math.round(+p.city.rows))); }
    if (Array.isArray(p.places)) out.places = p.places.slice(0, 12).map(function (q, i) {
      if (typeof q.id !== 'string' || !q.id) fail('Place ' + (i + 1) + ' needs an id.');
      var o = { id: q.id, name: String(q.name || q.id).slice(0, 40), sub: String(q.sub || '').slice(0, 48),
        x: Math.max(-200, Math.min(200, +q.x || 0)), z: Math.max(-200, Math.min(200, +q.z || 0)),
        w: Math.max(6, Math.min(40, +q.w || 16)), d: Math.max(6, Math.min(40, +q.d || 14)), h: Math.max(4, Math.min(30, +q.h || 9)),
        colour: NUM(+q.colour) ? +q.colour : 0x8d949c, doorColour: NUM(+q.doorColour) ? +q.doorColour : 0x6fdc8c,
        face: q.face === -1 ? -1 : 1, pin: String(q.pin || '#6fdc8c').slice(0, 9) };
      if (Array.isArray(q.sells)) o.sells = q.sells.slice(0, 14).map(function (r) { return { item: String(r.item || '').slice(0, 30), off: Math.max(0, Math.min(0.9, +r.off || 0)) }; }).filter(function (r) { return r.item; });
      if (q.service && typeof q.service === 'object') o.service = { label: String(q.service.label || 'Pay for it').slice(0, 60), note: String(q.service.note || '').slice(0, 90), cost: Math.max(0, +q.service.cost || 0), heat: Math.max(-60, Math.min(60, +q.service.heat || 0)), rep: Math.max(-10, Math.min(10, +q.service.rep || 0)), daily: q.service.daily !== false };
      return o;
    });
    if (p.festive && typeof p.festive === 'object') { out.festive = { snow: !!p.festive.snow, fireworks: !!p.festive.fireworks }; }
    if (p.vehicle && typeof p.vehicle === 'object') {
      out.vehicle = { name: String(p.vehicle.name || 'Car').slice(0, 30) };
      if (NUM(+p.vehicle.colour)) out.vehicle.colour = +p.vehicle.colour;
      if (NUM(+p.vehicle.vmax)) out.vehicle.vmax = Math.max(6, Math.min(60, +p.vehicle.vmax));
      if (NUM(+p.vehicle.trunk)) out.vehicle.trunk = Math.max(10, Math.min(400, Math.round(+p.vehicle.trunk)));
    }
    if (p.models && typeof p.models === 'object') { out.models = {}; Object.keys(p.models).slice(0, 60).forEach(function (k) { if (typeof p.models[k] === 'string') out.models[k] = p.models[k]; }); }
    return out;
  }

  // ── the merged view the game reads at boot ────────────────────────
  function activePacks() { return allPacks().filter(function (p) { return !p.bundle && isOn(p.id); }); }
  function collect(field) { var out = []; activePacks().forEach(function (p) { if (Array.isArray(p[field])) out = out.concat(p[field]); }); return out; }
  function tune() {
    var t = { market: 1, footfall: 1, seedCost: 1, upgradeCost: 1 };
    activePacks().forEach(function (p) { if (p.tune) Object.keys(p.tune).forEach(function (k) { if (t[k] !== undefined) t[k] *= p.tune[k]; }); });
    return t;
  }

  // ── models: IndexedDB in, GLTFLoader out ──────────────────────────
  var db = null, dbFail = false;
  function openDb() {
    return new Promise(function (res) {
      if (db) return res(db); if (dbFail || !window.indexedDB) return res(null);
      var rq;
      try { rq = indexedDB.open(DB_NAME, DB_VER); } catch (e) { dbFail = true; return res(null); }
      rq.onupgradeneeded = function () { var d = rq.result; if (!d.objectStoreNames.contains(DB_STORE)) d.createObjectStore(DB_STORE); };
      rq.onsuccess = function () { db = rq.result; res(db); };
      rq.onerror = function () { dbFail = true; res(null); };
    });
  }
  function dbPut(key, blob) { return openDb().then(function (d) { if (!d) return false; return new Promise(function (res) { var tx = d.transaction(DB_STORE, 'readwrite'); tx.objectStore(DB_STORE).put(blob, key); tx.oncomplete = function () { res(true); }; tx.onerror = function () { res(false); }; }); }); }
  function dbGet(key) { return openDb().then(function (d) { if (!d) return null; return new Promise(function (res) { var tx = d.transaction(DB_STORE, 'readonly'), rq = tx.objectStore(DB_STORE).get(key); rq.onsuccess = function () { res(rq.result || null); }; rq.onerror = function () { res(null); }; }); }); }
  function dbDel(prefix) { return openDb().then(function (d) { if (!d) return; return new Promise(function (res) { var tx = d.transaction(DB_STORE, 'readwrite'), st = tx.objectStore(DB_STORE), rq = st.openCursor(); rq.onsuccess = function () { var c = rq.result; if (!c) return; if (String(c.key).indexOf(prefix) === 0) st.delete(c.key); c.continue(); }; tx.oncomplete = function () { res(); }; tx.onerror = function () { res(); }; }); }); }

  var models = {}, modelsDone = false, readyCbs = [];
  function modelKeys() {   // every "slot" an enabled pack wants to replace, last pack wins
    var map = {};
    activePacks().forEach(function (p) { if (p.models) Object.keys(p.models).forEach(function (k) { map[k] = p.id + '::' + p.models[k]; }); });
    return map;
  }
  function loadModels() {
    var want = modelKeys(), keys = Object.keys(want);
    if (!keys.length || !window.THREE || !THREE.GLTFLoader) { finish(); return; }
    var loader = new THREE.GLTFLoader(), left = keys.length;
    keys.forEach(function (slot) {
      dbGet(want[slot]).then(function (blob) {
        if (!blob) { if (!--left) finish(); return; }
        var url = URL.createObjectURL(blob);
        loader.load(url, function (gltf) {
          URL.revokeObjectURL(url);
          var root = gltf.scene || (gltf.scenes && gltf.scenes[0]);
          if (root) { root.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); models[slot] = root; }
          if (!--left) finish();
        }, null, function () { URL.revokeObjectURL(url); if (!--left) finish(); });
      });
    });
    function finish() { modelsDone = true; readyCbs.splice(0).forEach(function (f) { try { f(); } catch (e) {} }); }
  }

  // ── import / export ───────────────────────────────────────────────
  // A pack arrives either as a bare .json manifest, or as a .json plus its .glb files chosen together.
  function importFiles(fileList) {
    var files = Array.prototype.slice.call(fileList || []);
    var manifest = files.filter(function (f) { return /\.json$/i.test(f.name); })[0];
    var glbs = files.filter(function (f) { return /\.(glb|gltf)$/i.test(f.name); });
    if (!manifest) return Promise.reject(new Error('Pick the pack\'s .json file. Any .glb models can be selected at the same time.'));
    return manifest.text().then(function (txt) {
      var raw; try { raw = JSON.parse(txt); } catch (e) { throw new Error('That .json file could not be read: ' + e.message); }
      var p = validate(raw);
      if (isBuiltin(p.id)) throw new Error('"' + p.id + '" is the id of a pack that ships with the game. Give yours a different id.');
      var need = p.models ? Object.keys(p.models).map(function (k) { return p.models[k]; }) : [];
      var missing = need.filter(function (n) { return !glbs.some(function (f) { return f.name === n; }); });
      if (missing.length) throw new Error('This pack wants ' + missing.join(', ') + '. Select the .json and its .glb files together.');
      var over = glbs.filter(function (f) { return f.size > MAX_MODEL; })[0];
      if (over) throw new Error(over.name + ' is ' + Math.round(over.size / 1048576) + ' MB. Keep a model under ' + (MAX_MODEL / 1048576) + ' MB.');
      return dbDel(p.id + '::').then(function () {
        return Promise.all(glbs.map(function (f) { return dbPut(p.id + '::' + f.name, f); }));
      }).then(function (oks) {
        if (oks.some(function (o) { return o === false; })) throw new Error('The models could not be stored. Your browser may be blocking site data.');
        var i = state.user.map(function (u) { return u.id; }).indexOf(p.id);
        if (i >= 0) state.user[i] = p; else state.user.push(p);
        if (!writeState(state)) throw new Error('The pack could not be saved. Site data may be full.');
        return p;
      });
    });
  }
  function removePack(id) {
    if (isBuiltin(id)) return false;
    state.user = state.user.filter(function (u) { return u.id !== id; });
    drop(id); writeState(state); dbDel(id + '::');
    return true;
  }
  function exportPack(id) {
    var p = byId(id); if (!p) return;
    var copy = JSON.parse(JSON.stringify(p)); delete copy.user;
    var blob = new Blob([JSON.stringify(copy, null, 2)], { type: 'application/json' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = id + '.json';
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  window.RF_WORKSHOP = {
    version: 1,
    packs: function () { return allPacks().map(function (p) { return { id: p.id, name: p.name, author: p.author, icon: p.icon, kind: p.kind, blurb: p.blurb, group: p.group, bundle: p.bundle || null, user: !!p.user, dlc: p.dlc || null, on: effectiveOn(p), counts: counts(p) }; }); },
    isOn: isOn, setOn: setOn, dlc: dlc, dlcFromSaves: dlcFromSaves,
    strains: function () { return collect('strains'); },
    lights: function () { return collect('lights'); },
    tents: function () { return collect('tents'); },
    supplies: function () { return collect('supplies'); },
    tune: tune,
    city: function () { var c = { grow: 0, rows: 0 }; activePacks().forEach(function (p) { if (p.city) { c.grow += p.city.grow || 0; c.rows += p.city.rows || 0; } }); return c; },
    places: function () { return collect('places'); },
    festive: function () { var f = { snow: false, fireworks: false }; activePacks().forEach(function (p) { if (p.festive) { if (p.festive.snow) f.snow = true; if (p.festive.fireworks) f.fireworks = true; } }); return f; },
    vehicle: function () { var v = null; activePacks().forEach(function (p) { if (p.vehicle) v = p.vehicle; }); return v; },
    activeCount: function () { return activePacks().length; },
    model: function (slot) { var m = models[slot]; return m ? m.clone(true) : null; },
    hasModels: function () { return Object.keys(models).length > 0; },
    onModelsReady: function (fn) { if (modelsDone) fn(); else readyCbs.push(fn); },
    loadModels: loadModels,
    importFiles: importFiles, removePack: removePack, exportPack: exportPack, validate: validate,
    example: function () {
      return { id: 'you.firstpack', name: 'My First Pack', author: 'you', icon: '🌱', kind: 'Seeds',
        blurb: 'A strain of my own.',
        strains: [{ id: 'mystrain', name: 'House Special', emoji: '🏠', seed: 30, growMs: 720000, yield: 18, thc: 1.6, lvl: 2, bud: 0x88cc66, hair: 0xffaa33, leaf: 0x449944 }],
        models: { 'item:joints': 'joints.glb' } };
    }
  };
  function counts(p) {
    if (p.bundle) return p.bundle.length + ' packs';
    if (p.dlc) return p.what || 'DLC';
    var bits = [];
    if (p.strains) bits.push(p.strains.length + ' strain' + (p.strains.length === 1 ? '' : 's'));
    if (p.lights) bits.push(p.lights.length + ' lamp' + (p.lights.length === 1 ? '' : 's'));
    if (p.tents) bits.push(p.tents.length + ' tent' + (p.tents.length === 1 ? '' : 's'));
    if (p.supplies) bits.push(p.supplies.length + ' item' + (p.supplies.length === 1 ? '' : 's'));
    if (p.models) bits.push(Object.keys(p.models).length + ' model' + (Object.keys(p.models).length === 1 ? '' : 's'));
    if (p.city) bits.push('a bigger map');
    if (p.places) bits.push(p.places.length + ' place' + (p.places.length === 1 ? '' : 's'));
    if (p.vehicle) bits.push(p.vehicle.name);
    if (p.festive) bits.push(p.festive.fireworks ? 'fireworks' : 'snow');
    if (p.tune) bits.push('balance');
    return bits.join(' · ') || 'nothing yet';
  }
})();
