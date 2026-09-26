//@ upstairs rooms and the expansion: interiors, lab, roof, heat, wholesale
  // ── Upstairs is two rooms now: the owner's flat (office stairs) and the connoisseur lounge (its own stair from the lobby) ──
  var DIVX = 2.0;   // the dividing wall; the flat is west of it, the lounge east
  var vip = { g: null, h: null, bubble: null, state: 'away', path: [], t: 0, up: false };
  function stair2Y(x, z, up) { if (x > STAIR2.x1 - 0.15 && x < STAIR2.x2 + 0.15 && z > STAIR2.z1 - 0.05 && z < STAIR2.z2 + 0.3) return UP.y * clamp((x - STAIR2.x1) / (STAIR2.x2 - STAIR2.x1), 0, 1); return up ? UP.y : 0; }
  function buildVipWing() {
    var S2 = STAIR2, n = 16, rise = UP.y / n, run = (S2.x2 - S2.x1) / n, sw = S2.z2 - S2.z1, sz = (S2.z1 + S2.z2) / 2, carpet = colorMat(0x5a1f2a, 0.95), brass = colorMat(0xc9a24a, 0.35, 0.8);
    // the lounge stair: carpeted treads rising along the lobby's back wall, brass rail on the open side
    for (var i = 0; i < n; i++) { box(run, rise, sw, MAT.darkwood, S2.x1 + run * (i + 0.5), rise * (i + 0.5), sz, { cast: true }); box(run, 0.02, sw - 0.2, carpet, S2.x1 + run * (i + 0.5), rise * (i + 1) + 0.011, sz, { cast: false }); box(run, rise * (i + 1), 0.04, MAT.darkwood, S2.x1 + run * (i + 0.5), rise * (i + 1) / 2, S2.z2 - 0.02, { cast: true }); }
    var railLen = Math.hypot(UP.y, S2.x2 - S2.x1) + 0.3, railA = Math.atan2(UP.y, S2.x2 - S2.x1); var rail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, railLen, 10), brass); rail.rotation.z = railA - Math.PI / 2; rail.position.set((S2.x1 + S2.x2) / 2, UP.y / 2 + 0.95, S2.z2 - 0.02); world.group.add(rail);
    for (var p = 0; p <= 8; p++) box(0.03, 0.9, 0.03, brass, S2.x1 + (S2.x2 - S2.x1) * p / 8, UP.y * p / 8 + 0.45, S2.z2 - 0.02);
    world.obstacles.push({ x1: S2.x1 - 0.15, x2: S2.x2 + 0.2, z1: S2.z2 + 0.3, z2: S2.z2 + 0.42, tag: 'stairrail', floorLevel: 'any' });   // open side, both floors
    world.obstacles.push({ x1: S2.x2 + 0.15, x2: S2.x2 + 0.27, z1: S2.z1 - 0.1, z2: S2.z2 + 0.42, tag: 'stairend', floorLevel: 0 });        // nobody walks in under the high end
    world.obstacles.push({ x1: S2.x1 - 0.2, x2: S2.x1 - 0.08, z1: S2.z1 - 0.2, z2: S2.z2 + 0.42, tag: 'wellrail', floorLevel: 1 });        // upstairs: the low end of the well
    world.obstacles.push({ x1: S2.x1 - 0.2, x2: S2.x2 + 0.1, z1: S2.z1 - 0.2, z2: S2.z1 - 0.08, tag: 'wellrail2', floorLevel: 1 });        // upstairs: the wall side of the well
    upBox(S2.x2 - S2.x1 + 0.3, 0.05, 0.05, brass, (S2.x1 + S2.x2) / 2, 1.0, S2.z1 - 0.14); upBox(0.05, 0.05, sw + 0.6, brass, S2.x1 - 0.14, 1.0, sz + 0.1); upBox(S2.x2 - S2.x1 + 0.3, 0.05, 0.05, brass, (S2.x1 + S2.x2) / 2, 1.0, S2.z2 + 0.36);
    for (var q = 0; q <= 6; q++) { upBox(0.03, 1.0, 0.03, brass, S2.x1 - 0.14 + (S2.x2 - S2.x1 + 0.3) * q / 6, 0.5, S2.z1 - 0.14); upBox(0.03, 1.0, 0.03, brass, S2.x1 - 0.14 + (S2.x2 - S2.x1 + 0.3) * q / 6, 0.5, S2.z2 + 0.36); }
    signPlane(['CONNOISSEUR LOUNGE ↑', 'members and their host only'], 1.5, 0.4, S2.x1 - 0.2, 2.5, 4.13, 0, { titleColor: '#e8c27a', bg: '#14100c' });
    [[S2.x1 - 0.35, S2.z2 + 0.2], [S2.x1 - 0.35, S2.z1 + 0.1]].forEach(function (pp) { cyl(0.03, 0.05, 1.0, brass, pp[0], 0.5, pp[1], null, 10); }); var rope = box(0.03, 0.03, 0.9, carpet, S2.x1 - 0.35, 0.9, sz + 0.15, { cast: false });
    // the dividing wall, with a private door at the kitchen end
    upBox(0.2, UP.h, 3.0, MAT.wall, DIVX, UP.h / 2, -7.5, { solid: true, tag: 'wall' }); upBox(0.2, UP.h, 13.8, MAT.wall, DIVX, UP.h / 2, 2.1, { solid: true, tag: 'wall' }); upBox(0.2, UP.h - 2.2, 1.2, MAT.wall, DIVX, 2.2 + (UP.h - 2.2) / 2, -5.4);
    slideDoor('flat', DIVX, UP.y, -5.4, false, 1, 'door to your flat', false); signPlane(['PRIVATE', 'the owner lives here'], 0.9, 0.3, DIVX + 0.11, UP.y + 2.45, -5.4, Math.PI / 2, { titleColor: '#ff6b6b' });
    
    // the lounge itself: bar, neon, velvet, low light
    var velvet = colorMat(0x3a1430, 0.95), gold = brass; signPlane(['THE CONNOISSEUR', 'by appointment'], 3.0, 0.8, 7.2, UP.y + 2.35, -ROOM.z + 0.03, 0, { size: 56, bg: '#0d0a10', titleColor: '#e8c27a', color: '#b9a88a', line: 'rgba(232,194,122,.6)' });
    upBox(3.4, 1.05, 0.6, MAT.darkwood, 7.2, 0.525, -8.4, { solid: true, tag: 'vipbar' }); upBox(3.5, 0.05, 0.7, colorMat(0x16120e, 0.2, 0.4), 7.2, 1.075, -8.4, { cast: false }); for (var bt = 0; bt < 7; bt++) upBox(0.07, 0.26, 0.07, colorMat([0x2e7d4f, 0x8a5a2a, 0xb5121b, 0xe8c27a][bt % 4], 0.2, 0.3), 6.0 + bt * 0.4, 1.23, -8.55, { cast: false });
    [[5.2, -7.4], [6.5, -7.4], [7.9, -7.4], [9.2, -7.4]].forEach(function (s) { var st = cyl(0.18, 0.18, 0.06, velvet, s[0], UP.y + 0.72, s[1], null, 14); cyl(0.03, 0.03, 0.7, gold, s[0], UP.y + 0.35, s[1], null, 8); });
    var rug = new THREE.Mesh(new THREE.CircleGeometry(2.6, 28), colorMat(0x4a1830, 1)); rug.rotation.x = -Math.PI / 2; rug.position.set(7.4, UP.y + 0.004, -1.6); rug.receiveShadow = true; world.group.add(rug);
  }
  function flatDoorSet(open) { if (!world.vipDoor) return; world.vipDoor.open = open; world.vipDoor.mesh.visible = !open; world.obstacles = world.obstacles.filter(function (o) { return o.tag !== 'flatdoor'; }); if (!open) world.obstacles.push({ x1: DIVX - 0.12, x2: DIVX + 0.12, z1: -6.0, z2: -4.8, tag: 'flatdoor', floorLevel: 1 }); }
  // a connoisseur books the lounge: they come up their own stair, take the armchair, and wait to be served something excellent
  function vipSay(t, col) { var ob = vip.bubble.material.map; vip.bubble.material.map = textTex([t], 512, 160, { size: 40, titleColor: col || '#e8c27a' }); vip.bubble.material.needsUpdate = true; if (ob) ob.dispose(); vip.bubble.visible = true; vip.sayT = 4; }
  function vipSeat() { return propInst.vipTable ? propWorld('vipTable', 0.95, 0) : { x: 8.35, z: -1.6 }; }
  function startVip() {
    if (S.vip || vip.state !== 'away' || !shop().open || !hasLic('premium')) return false;
    if (!vip.g) { vip.g = new THREE.Group(); world.group.add(vip.g); vip.bubble = sprite(textTex(['…'], 512, 160, { size: 40 }), 1.6, 0.5, 0, 2.3, 0, vip.g); }
    if (vip.h) { vip.g.remove(vip.h); disposeTree(vip.h); } world.interact = world.interact.filter(function (m) { return !m.userData.vipHit; });
    vip.h = makeHuman({ skin: pick(SKINS), hair: pick(HAIRS), shirt: 0x1d1d26, pants: 0x15151c, coat: 0x2a2233, glasses: true, watch: true, necklace: true, longSleeve: true, shoes: 0x111111, mood: 'neutral' }); vip.g.add(vip.h);
    var hb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.7, 0.8), MAT.none); hb.position.y = 0.9; hb.userData.vipHit = true; vip.h.add(hb); interactable(hb, { kind: 'vip' });
    var kinds = ['joints', 'bags'].filter(function (k) { return S.pkg[k] && S.pkg[k].n > 0; }); var kind = kinds.length ? pick(kinds) : 'joints'; var seat = vipSeat(), S2 = STAIR2, sz = (S2.z1 + S2.z2) / 2;
    S.vip = { who: pick(['Mr Alder', 'Dame Okafor', 'The Count', 'Ms Laurent', 'Dr Vega']), kind: kind, qty: kind === 'joints' ? randi(3, 5) : randi(2, 3), minQ: 70, given: 0, until: now() + 240000 };
    vip.path = [{ x: 6.5, z: 11.6 }, { x: 0.6, z: 11.4 }, { x: 0, z: 9.7 }, { x: 0.8, z: 7.6 }, { x: S2.x1 - 0.6, z: sz }, { x: S2.x2 + 0.5, z: sz }, { x: seat.x - 0.2, z: seat.z + 1.4 }, { x: seat.x, z: seat.z }]; vip.g.position.set(vip.path[0].x, 0, vip.path[0].z); vip.g.visible = true; vip.state = 'in'; vip.up = false; vip.bubble.visible = false;
    sfx('rare'); toast('🥂 ' + S.vip.who + ' has booked the lounge: ' + S.vip.qty + ' ' + kindName(kind, S.vip.qty) + ', quality ' + S.vip.minQ + ' or better, served upstairs', 'rare'); logEvent('🥂 ' + S.vip.who + ' is on the way up to the connoisseur lounge', 'rare'); return true;
  }
  function vipLeave(text, col) { if (vip.state === 'away' || vip.state === 'out') return; standBack(vip.h); vip.h.position.y = 0; var S2 = STAIR2, sz = (S2.z1 + S2.z2) / 2; vipSay(text, col); vip.state = 'out'; vip.path = [{ x: S2.x2 + 0.5, z: sz }, { x: S2.x1 - 0.6, z: sz }, { x: 0.8, z: 7.6 }, { x: 0, z: 9.7 }, { x: 0.6, z: 11.4 }, { x: 16, z: 11.6 }]; S.vip = null; save(); }
  function serveVip(h) {
    var v = S.vip; if (!v || vip.state !== 'sit') { toast('They\'re still on their way up', ''); return; }
    if (!h || h.kind !== v.kind) { toast(v.who + ' is waiting for ' + (v.qty - v.given) + ' ' + kindName(v.kind, v.qty - v.given) + ' at quality ' + v.minQ + '+', ''); return; }
    var q = h.qSum / h.n, thc = h.thcSum / h.n; if (q < v.minQ) { vipSay('I am afraid that is rather ordinary.', '#ff6b6b'); toast(v.who + ' won\'t touch anything under quality ' + v.minQ, 'bad'); return; }
    var give = Math.min(v.qty - v.given, h.n); v.given += give; v.paid = (v.paid || 0) + unitPrice(v.kind, q, thc) * give * 3; h.n -= give; h.qSum -= q * give; h.thcSum -= thc * give; if (h.n <= 0) S.held = null; sfx('rustle');
    if (v.given < v.qty) { vipSay('Lovely. ' + (v.qty - v.given) + ' more, if you would.', '#e8c27a'); return; }
    var pay = Math.round(v.paid), tip = Math.round(pay * 0.2); S.till += pay; S.tips += tip; S.rep += 8; S.stats.vip = (S.stats.vip || 0) + 1; bookSale(pay); sfx('cash'); toast('🥂 ' + v.who + ' paid ' + money(pay) + ' and left ' + money(tip) + ' on the table (rep +8)', 'good'); logEvent('🥂 Lounge service for ' + v.who + ': ' + money(pay) + ' and a ' + money(tip) + ' tip (rep +8)', 'good'); hud(); vipLeave('Exquisite. Until next time.', '#6fdc8c');
  }
  function updateVip(dt) {
    if (vip.state === 'away') { if (!S.vip && hasLic('premium') && shop().open && Math.random() < dt / 360) startVip(); return; }
    var g = vip.g; if (vip.sayT > 0) { vip.sayT -= dt; if (vip.sayT <= 0) vip.bubble.visible = false; }
    if (vip.state === 'in' || vip.state === 'out') {
      var done = walkAlong(g, vip.path, 1.25, dt); var onStair = g.position.x > STAIR2.x1 - 0.15 && g.position.x < STAIR2.x2 + 0.15 && g.position.z > STAIR2.z1 - 0.05 && g.position.z < STAIR2.z2 + 0.3; if (onStair) vip.up = g.position.x > (STAIR2.x1 + STAIR2.x2) / 2; g.position.y = stair2Y(g.position.x, g.position.z, vip.up); animateHuman(vip.h, dt, 'walk', 1.25, null);
      if (done) { if (vip.state === 'out') { vip.state = 'away'; g.visible = false; world.interact = world.interact.filter(function (m) { return !m.userData.vipHit; }); } else { vip.state = 'sit'; g.position.y = UP.y; g.rotation.y = -Math.PI / 2; vipSay(S.vip ? S.vip.qty + ' × ' + kindName(S.vip.kind, S.vip.qty) + ' · q' + S.vip.minQ + '+' : '…'); } }
      return;
    }
    if (vip.state === 'sit') { animateHuman(vip.h, dt, 'idle', 0, player.floor === 1 ? player.pos : null); vip.h.position.y = -0.32; var P = vip.h.userData.parts; P.lLeg.rotation.x = -1.4; P.rLeg.rotation.x = -1.4; P.lLeg.userData.knee.rotation.x = 1.4; P.rLeg.userData.knee.rotation.x = 1.4; if (!S.vip || now() > S.vip.until) { S.rep = Math.max(0, S.rep - 3); logEvent('🥂 The lounge guest gave up waiting (rep -3)', 'bad'); toast('🥂 Your lounge guest left unserved (rep -3)', 'bad'); vip.h.position.y = 0; vipLeave('I do not wait.', '#ff6b6b'); } }
  }
  function vipPrompt(d, h) {
    if (d.kind === 'flatDoor') return world.vipDoor && world.vipDoor.open ? 'Close the door to your flat' : 'Your flat <small>private · E opens the door</small>';
    if (d.kind === 'vip') { var v = S.vip; if (!v) return ''; return v.who + ' <small>wants ' + (v.qty - v.given) + ' ' + kindName(v.kind, v.qty - v.given) + ' · quality ' + v.minQ + '+ · pays triple</small>'; }
    return '';
  }
  function vipInteract(d, h) { if (d.kind === 'flatDoor') { flatDoorSet(!world.vipDoor.open); sfx('click'); return true; } if (d.kind === 'vip') { serveVip(h); return true; } return false; }
  // ── Expansion: walk-in interiors, the extraction lab, the roof greenhouse, heat and police, wholesale, the garage, more staff, deliveries, a second shop, weather, blackouts ──
  var CIG_KEYS = ['cigNS', 'cigNB', 'cigLS', 'cigLB'];   // what the basement packer makes; the cabinet also sells what the lab makes
  CIG_SKUS.cart = { name: 'RF vape cart', type: 'side', size: 1, price: 35, col: 0x2b2f35, top: 0xe8c27a };
  CIG_SKUS.hash = { name: 'RF pressed hash (1 g)', type: 'side', size: 1, price: 28, col: 0x4a3a22, top: 0x8a6a3a };
  CIG_SKUS.gummy = { name: 'RF gummies', type: 'side', size: 1, price: 9, col: 0xd64b8a, top: 0xfff3c8 };
  CIG_SKUS.choc = { name: 'RF chocolate bar', type: 'side', size: 1, price: 12, col: 0x5a3a1e, top: 0xe8c27a };
  var ROOF_Y = 3.75 + 3.0 + 0.36;   /* UP is declared further down the file, so its numbers are repeated here */
  var ZONES = {
    lab:  { x1: 14, x2: 24, z1: -6, z2: 2, spawn: [19, 0.8, Math.PI], exit: { x: -7.6, z: -3.0, floor: -1, yaw: -Math.PI / 2 }, name: 'Extraction lab' },
    bank: { x1: 30, x2: 42, z1: -6, z2: 2, spawn: [36, 0.8, 0], exit: { x: -30, z: 25.4, floor: 0, yaw: 0 }, name: 'First Harvest Bank' },
    gun:  { x1: 48, x2: 58, z1: -6, z2: 2, spawn: [53, 0.8, 0], exit: { x: -8, z: 25.4, floor: 0, yaw: 0 }, name: 'Iron & Oak Arms' }
  };
  var exp = { zoneLight: null, zone: '', wx: null, wxKind: '', beacon: null, dropHit: null, getaway: null, opT: 0, heatBand: 0, roofBeds: [], roofSigns: [], genLed: null };
  function xs() { if (!S.x || typeof S.x !== 'object') S.x = {}; var X = S.x; if (typeof X.heat !== 'number') X.heat = 0; if (!X.staff) X.staff = { driver: false, operator: false, night: false }; if (!X.lab) X.lab = { job: null, out: { cart: 0, hash: 0, gummy: 0, choc: 0 } }; if (typeof X.lab.out.hash !== 'number') X.lab.out.hash = 0; if (!X.roof) X.roof = [0, 1, 2, 3, 4, 5].map(function () { return { stage: 'empty', t: 0 }; }); if (!X.garage) X.garage = {}; if (!X.weather) X.weather = { kind: 'clear', until: 0 }; if (!X.bagline) X.bagline = { on: false, t: 0 }; if (!Array.isArray(X.jobs)) X.jobs = []; if (!X.jobT) X.jobT = { ph: 120, tab: 60 }; if (!X.tablet) X.tablet = 'dock'; if (!S.car) carState(); if (!S.car.cigs) S.car.cigs = {}; return X; }
  function powerOn() { return !!S.upgrades.generator || now() > (xs().blackoutUntil || 0); }
  function season() { return ['Spring', 'Summer', 'Autumn', 'Winter'][Math.floor(((S.day || 1) - 1) / 7) % 4]; }
  function weekend() { var d = (S.day || 1) % 7; return d === 6 || d === 0; }
  function footfall() { var w = xs().weather.kind, f = WSTUNE.footfall * (w === 'storm' ? 0.6 : w === 'rain' ? 0.8 : w === 'snow' ? 0.75 : 1); if (weekend()) f *= 1.3; if ((S.day || 1) % 28 >= 25) f *= 1.5; return f; }
  function addHeat(n, why) { var X = xs(); X.heat = clamp(X.heat + n, 0, 100); var band = X.heat >= 90 ? 3 : X.heat >= 60 ? 2 : X.heat >= 30 ? 1 : 0; if (band > exp.heatBand) toast(['', '🚔 The police have started to notice you', '🚔 You\'re being watched. Expect an inspection.', '🚔 You\'re the talk of the precinct'][band] + ' (heat ' + Math.round(X.heat) + ')', 'bad'); exp.heatBand = band; }
  function trunkCap(vid) { var b = WSCAR && WSCAR.trunk ? WSCAR.trunk : 40; if ((vid || drive.veh) === 'van') b = Math.round(b * 2.5); return xs().garage.trunk ? Math.round(b * 3) : b; }
  function carVmax() { var b = WSCAR && WSCAR.vmax ? WSCAR.vmax : 24; return xs().garage.engine ? Math.round(b * 4 / 3) : b; }
  // walk-in rooms sit on the basement level, far apart, and share one lamp that follows you
  function enterZone(id) { var Z = ZONES[id]; if (!Z) return; if (sit.on) standUp(); tobFade(function () { player.floor = -1; player.pos.set(Z.spawn[0], BASE.y + 1.65, Z.z2 - Z.spawn[1] - 0.6); player.vel.set(0, 0, 0); player.yaw = Z.spawn[2] === Math.PI ? 0 : 0; player.pitch = 0; exp.zone = id; exp.zoneLight.position.set((Z.x1 + Z.x2) / 2, BASE.y + 2.7, (Z.z1 + Z.z2) / 2); exp.zoneLight.intensity = 1.1; toast('🚪 ' + Z.name, ''); }); }
  function leaveZone(id) { var Z = ZONES[id]; tobFade(function () { player.floor = Z.exit.floor; player.pos.set(Z.exit.x, (Z.exit.floor === -1 ? BASE.y : 0) + 1.65, Z.exit.z); player.vel.set(0, 0, 0); player.yaw = Z.exit.yaw; exp.zone = ''; exp.zoneLight.intensity = 0; }); }
  function buildExpansion() {
    var Y = BASE.y, steel = colorMat(0x9aa0a6, 0.35, 0.8), dark = colorMat(0x2b2f35, 0.5, 0.6), brass = colorMat(0xc9a24a, 0.35, 0.8), glassM = new THREE.MeshPhysicalMaterial({ color: 0xbfe0ff, transparent: true, opacity: 0.25, roughness: 0.05 });
    function bb(w, h, d, m, x, y, z, o) { o = o || {}; o.floorLevel = -1; return box(w, h, d, m, x, Y + y, z, o); }
    function hit(w, h, d, x, y, z, data) { var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), MAT.none); m.position.set(x, y, z); world.group.add(m); interactable(m, data); return m; }
    function person(x, y, z, yaw, spec, data) { var h = makeHuman(spec); h.position.set(x, y, z); h.rotation.y = yaw; world.group.add(h); var hb = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.9, 0.9), MAT.none); hb.position.y = 0.95; h.add(hb); interactable(hb, data); return h; }
    exp.zoneLight = new THREE.PointLight(0xfff0d8, 0, 20, 1.3); scene.add(exp.zoneLight);
    Object.keys(ZONES).forEach(function (id) { var Z = ZONES[id], w = Z.x2 - Z.x1, d = Z.z2 - Z.z1, cx = (Z.x1 + Z.x2) / 2, cz = (Z.z1 + Z.z2) / 2, wm = colorMat(id === 'bank' ? 0xe9e4d8 : id === 'gun' ? 0x6b5a48 : 0xdfe4e8, 0.9);
      floorPlane(id === 'gun' ? MAT.planks : MAT.tile, Z.x1, Z.x2, Z.z1, Z.z2, 1.6, Y + 0.001); bb(w + 0.6, 3.2, 0.3, wm, cx, 1.6, Z.z1 - 0.15, { solid: true, tag: 'wall' }); bb(w + 0.6, 3.2, 0.3, wm, cx, 1.6, Z.z2 + 0.15, { solid: true, tag: 'wall' }); bb(0.3, 3.2, d, wm, Z.x1 - 0.15, 1.6, cz, { solid: true, tag: 'wall' }); bb(0.3, 3.2, d, wm, Z.x2 + 0.15, 1.6, cz, { solid: true, tag: 'wall' }); bb(w + 0.6, 0.3, d + 0.6, dark, cx, 3.35, cz, { cast: true }); bb(w - 2, 0.04, d - 2, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff0d8, emissiveIntensity: 0.7 }), cx, 3.18, cz, { cast: false });
      bb(1.3, 2.3, 0.08, MAT.darkwood, Z.spawn[0], 1.15, Z.z2 - 0.02, { cast: false }); signPlane(['EXIT'], 0.6, 0.22, Z.spawn[0], Y + 2.55, Z.z2 - 0.03, Math.PI, { size: 40, titleColor: '#6fdc8c' }); hit(1.5, 2.3, 0.8, Z.spawn[0], Y + 1.15, Z.z2 - 0.3, { kind: 'zoneExit', zone: id }); });
    // the bank: a teller line behind glass, brass posts, an ATM and the vault door at the back
    var BK = ZONES.bank; bb(10, 1.1, 0.7, MAT.darkwood, 36, 0.55, -3.2, { solid: true, tag: 'zone' }); bb(10, 0.05, 0.8, colorMat(0xe9e4d8, 0.3), 36, 1.12, -3.2, { cast: false }); bb(10, 1.3, 0.04, glassM, 36, 1.8, -3.2, { cast: false }); [32.5, 36, 39.5].forEach(function (tx, i) { bb(0.06, 1.3, 0.06, brass, tx - 1.7, 1.8, -3.2, { cast: false }); if (i < 2) person(tx, Y, -4.2, 0, { shirt: 0xf4f1ea, pants: 0x1d2433, coat: 0x1d2433, glasses: i === 0, longSleeve: true, mood: 'happy' }, { kind: 'zoneClerk', poi: 'bank' }); });
    var vd = cyl(1.1, 1.1, 0.25, steel, 36, Y + 1.5, -5.8, null, 28); vd.rotation.x = Math.PI / 2; var vw = cyl(0.35, 0.35, 0.12, brass, 36, Y + 1.5, -5.62, null, 8); vw.rotation.x = Math.PI / 2; bb(0.7, 1.8, 0.5, dark, 41.4, 0.9, -1.5, { solid: true, tag: 'zone' }); bb(0.5, 0.35, 0.02, glowMat(0x39a0ff, 1.0), 41.4, 1.35, -1.24, { cast: false }); hit(0.9, 1.9, 0.9, 41.4, Y + 0.95, -1.4, { kind: 'zoneClerk', poi: 'bank' });
    [[33, 0], [39, 0]].forEach(function (p) { cyl(0.03, 0.05, 1.0, brass, p[0], Y + 0.5, p[1], null, 10); }); bb(6, 0.03, 0.03, colorMat(0x5a1f2a, 0.9), 36, 0.92, 0, { cast: false }); signPlane(['FIRST HARVEST BANK', 'your money is safe with us'], 5, 0.9, 36, Y + 2.7, BK.z1 + 0.03, 0, { size: 50, bg: '#0e1a2a', titleColor: '#8fc0ff' });
    // the gun store: racks on the back wall, a glass counter, a clerk who has seen it all
    bb(8, 1.0, 0.7, MAT.darkwood, 53, 0.5, -3.0, { solid: true, tag: 'zone' }); bb(7.8, 0.3, 0.6, glassM, 53, 1.15, -3.0, { cast: false }); for (var gi = 0; gi < 6; gi++) { bb(0.06, 0.06, 0.34, dark, 50.2 + gi * 1.1, 1.08, -3.0, { cast: false }); var rf = bb(1.3, 0.09, 0.05, gi % 2 ? MAT.darkwood : dark, 50 + gi * 1.2, 2.0 - (gi % 3) * 0.35, -5.9, { cast: false }); bb(0.35, 0.16, 0.05, MAT.darkwood, 49.5 + gi * 1.2, 1.97 - (gi % 3) * 0.35, -5.9, { cast: false }); }
    bb(8, 2.0, 0.04, colorMat(0x8a7a5a, 0.9), 53, 1.7, -5.96, { cast: false }); person(53, Y, -4.0, 0, { shirt: 0x3a4a2a, pants: 0x2a2a2a, beard: true, hat: 'cap', capColor: 0x2a2a2a, longSleeve: true }, { kind: 'zoneClerk', poi: 'gun' }); [[49, 0.5], [57, 0.5]].forEach(function (p) { bb(1.2, 1.8, 0.5, dark, p[0], 0.9, p[1], { solid: true, tag: 'zone' }); for (var s = 0; s < 4; s++) bb(1.0, 0.18, 0.4, colorMat([0x6b5a2a, 0x2f5f8a, 0xb5121b, 0x3a3a3a][s], 0.7), p[0], 0.3 + s * 0.42, p[1] + 0.06, { cast: false }); });
    signPlane(['IRON & OAK', 'arms · ammunition · armour'], 4, 0.8, 53, Y + 2.75, ZONES.gun.z1 + 0.03, 0, { size: 50, bg: '#1a0e0a', titleColor: '#ff8a70' });
    // the lab: a closed-loop extractor, a vacuum oven, a cart filler and a confectionery depositor; its door is on the basement's left wall
    bb(0.08, 2.3, 1.3, colorMat(0xdfe4e8, 0.6), BASE.x1 + 0.04, 1.15, -3.0, { cast: false }); signPlane(['EXTRACTION LAB', 'carts · gummies · chocolate'], 1.5, 0.4, BASE.x1 + 0.05, Y + 2.6, -3.0, Math.PI / 2, { titleColor: '#8fc0ff' }); hit(0.8, 2.3, 1.4, BASE.x1 + 0.3, Y + 1.15, -3.0, { kind: 'zoneDoor', zone: 'lab' });
    [16, 17.2, 18.4].forEach(function (tx, i) { cyl(0.4, 0.4, 1.6 + i * 0.2, steel, tx, Y + 0.9 + i * 0.1, -4.8, null, 18); cyl(0.12, 0.12, 0.3, dark, tx, Y + 1.85 + i * 0.2, -4.8, null, 10); }); var pp = cyl(0.05, 0.05, 3.2, colorMat(0xb04a2a, 0.4, 0.5), 17.2, Y + 2.35, -4.8, null, 8); pp.rotation.z = Math.PI / 2; bb(3.6, 0.1, 1.2, dark, 17.2, 0.05, -4.8, { solid: true, tag: 'zone' });
    bb(1.2, 1.0, 0.9, steel, 20.5, 0.5, -5.2, { solid: true, tag: 'zone' }); bb(1.0, 0.7, 0.06, glassM, 20.5, 0.55, -4.72, { cast: false }); bb(2.4, 0.9, 0.8, steel, 22.4, 0.45, -2.0, { solid: true, tag: 'zone' }); for (var ci = 0; ci < 8; ci++) bb(0.05, 0.12, 0.05, colorMat(0xe8c27a, 0.3, 0.6), 21.5 + ci * 0.25, 0.97, -2.0, { cast: false });
    signPlane(['EXTRACTOR', 'E to run a batch'], 1.4, 0.4, 17.2, Y + 2.8, ZONES.lab.z1 + 0.03, 0, {}); hit(4.0, 2.4, 1.6, 17.2, Y + 1.2, -4.6, { kind: 'labRig' }); hit(2.6, 1.6, 1.2, 22.4, Y + 0.9, -2.0, { kind: 'labRig' });
    // the roof: ladder in the flat, a greenhouse with six beds, a parapet
    var ghN0 = world.group.children.length;   /* the ladder, the roof hatch, the glasshouse and its beds belong to the Roof Greenhouse DLC: kept in exp.ghParts */
    var RY = ROOF_Y; for (var lr = 0; lr < 9; lr++) upBox(0.5, 0.03, 0.03, steel, -11.78, 0.3 + lr * 0.34, -3.0); [-0.25, 0.25].forEach(function (o) { upBox(0.04, 3.2, 0.04, steel, -11.78, 1.6, -3.0 + o); }); hit(0.7, 3.0, 0.9, -11.6, UP.y + 1.5, -3.0, { kind: 'roofUp', dlc: 'greenhouse' }); signPlane(['ROOF ↑', 'greenhouse'], 0.7, 0.26, -11.88, UP.y + 2.75, -2.0, Math.PI / 2, { titleColor: '#8fd17a' });
    var ghParts = world.group.children.slice(ghN0);
    [[0, -ROOM.z + 0.1, ROOM.x * 2, 0.2], [0, ROOM.z - 0.1, ROOM.x * 2, 0.2], [-ROOM.x + 0.1, 0, 0.2, ROOM.z * 2], [ROOM.x - 0.1, 0, 0.2, ROOM.z * 2]].forEach(function (pw) { box(pw[2], 0.9, pw[3], MAT.brick, pw[0], RY + 0.45, pw[1]); });   /* the parapet is the building's own */
    var ghN1 = world.group.children.length;
    box(0.9, 0.08, 0.9, dark, -10.6, RY + 0.04, -3.0, { cast: false }); hit(1.0, 1.0, 1.0, -10.6, RY + 0.4, -3.0, { kind: 'roofDown', dlc: 'greenhouse' });
    var GH = { x1: -4, x2: 8, z1: -6, z2: 3 }; [[GH.x1, GH.z1], [GH.x2, GH.z1], [GH.x1, GH.z2], [GH.x2, GH.z2], [2, GH.z1], [2, GH.z2]].forEach(function (p) { box(0.08, 2.6, 0.08, MAT.white, p[0], RY + 1.3, p[1]); }); box(GH.x2 - GH.x1, 2.4, 0.03, glassM, 2, RY + 1.3, GH.z1, { cast: false }); box(0.03, 2.4, GH.z2 - GH.z1, glassM, GH.x1, RY + 1.3, -1.5, { cast: false }); box(0.03, 2.4, GH.z2 - GH.z1, glassM, GH.x2, RY + 1.3, -1.5, { cast: false }); var rf1 = box(GH.x2 - GH.x1 + 0.3, 0.04, 5.0, glassM, 2, RY + 3.2, -3.7, { cast: false }); rf1.rotation.x = 0.28; var rf2 = box(GH.x2 - GH.x1 + 0.3, 0.04, 5.0, glassM, 2, RY + 3.2, 0.7, { cast: false }); rf2.rotation.x = -0.28;
    xs().roof.forEach(function (b, i) { var bx = -2.4 + (i % 3) * 4.0, bz = i < 3 ? -4.2 : 0.6; box(2.8, 0.45, 1.4, MAT.darkwood, bx, RY + 0.225, bz); box(2.6, 0.04, 1.2, colorMat(0x3a2a1c, 1), bx, RY + 0.46, bz, { cast: false }); world.obstacles.push({ x1: bx - 1.4, x2: bx + 1.4, z1: bz - 0.7, z2: bz + 0.7, tag: 'roofbed', floorLevel: 2 });
      var pg = new THREE.Group(); pg.position.set(bx, RY + 0.47, bz); world.group.add(pg); for (var pl = 0; pl < 5; pl++) { var st = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 1.1, 6), MAT.stem); st.position.set(-1.0 + pl * 0.5, 0.55, 0); pg.add(st); var bud = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.9, 7), MAT.leaf); bud.position.set(-1.0 + pl * 0.5, 0.95, 0); pg.add(bud); } pg.visible = false; exp.roofBeds.push(pg); hit(2.9, 1.6, 1.5, bx, RY + 0.8, bz, { kind: 'roofBed', idx: i, dlc: 'greenhouse' }); });
    exp.ghParts = ghParts.concat(world.group.children.slice(ghN1));
    // owner's garage over the bay, the generator by the back wall, the staff roster in the office
    [[5.5, -14.0], [9.9, -14.0], [5.5, -16.6], [9.9, -16.6]].forEach(function (p) { box(0.1, 2.6, 0.1, dark, p[0], 1.3, p[1]); }); box(4.8, 0.1, 3.0, colorMat(0x5f666e, 0.5, 0.6), 7.7, 2.65, -15.3, { cast: true }); signPlane(['GARAGE'], 1.2, 0.3, 7.7, 2.45, -13.95, 0, { size: 40, titleColor: '#f2c21a', bg: '#101410' });
    box(1.4, 1.0, 0.8, colorMat(0xf2c21a, 0.6, 0.3), 0.2, 0.5, -13.2, { solid: true, tag: 'gen' }); box(1.2, 0.3, 0.6, dark, 0.2, 1.15, -13.2); cyl(0.05, 0.05, 0.9, dark, 0.7, 1.7, -13.2, null, 8); exp.genLed = box(0.08, 0.08, 0.02, glowMat(0xff3030, 0.4), -0.3, 0.8, -12.79, { cast: false }); hit(1.5, 1.5, 1.0, 0.2, 0.75, -13.1, { kind: 'generator' });
    fixtureFromBuild('keyHook', 'key hook', -Math.PI / 2, function () {
      var brass = colorMat(0xc9a24a, 0.35, 0.8), board = colorMat(0x6b4a2a, 0.8), hx = -4.13;
      box(0.03, 0.2, 0.26, board, hx, 1.5, -0.4, { cast: false });
      [-0.07, 0.07].forEach(function (dz) { var pin = cyl(0.008, 0.008, 0.05, brass, hx - 0.025, 1.48, -0.4 + dz, null, 8); pin.rotation.z = Math.PI / 2; cyl(0.012, 0.012, 0.012, brass, hx - 0.05, 1.465, -0.4 + dz, null, 8).rotation.z = Math.PI / 2; });
      signPlane(['KEYS'], 0.2, 0.05, hx - 0.016, 1.575, -0.4, -Math.PI / 2, { size: 24, bg: '#6b4a2a', titleColor: '#e8c27a', line: 'rgba(0,0,0,0)' });
      var ring = new THREE.Group(); ring.position.set(hx - 0.05, 0, -0.47); world.group.add(ring); world.keyRing = ring;
      var loop = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.004, 8, 16), brass); loop.position.y = 1.45; loop.rotation.y = Math.PI / 2; ring.add(loop);
      for (var k = 0; k < 3; k++) { var b = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.045, 0.01), k === 1 ? colorMat(0x9aa0a6, 0.4, 0.7) : brass); b.position.set(0, 1.405, -0.015 + k * 0.015); ring.add(b); }
      var hit = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42, 0.42), MAT.none); hit.position.set(hx - 0.1, 1.48, -0.42); world.group.add(hit); interactable(hit, { kind: 'keyHook' });
    });
//#if desk
    fixtureFromBuild('roster', 'staff roster', -Math.PI / 2, function () { box(0.04, 1.0, 1.2, colorMat(0x8a6a3a, 0.9), -4.13, 1.7, 2.35, { cast: false }); signPlane(['STAFF ROSTER', 'driver · operator · night guard'], 1.1, 0.36, -4.16, 1.95, 2.35, -Math.PI / 2, { size: 24 }); hit(0.4, 1.2, 1.3, -4.25, 1.7, 2.35, { kind: 'roster' }); });   /* on the office side of the hall wall: on the back wall it overlapped the desk screen */
//#else
    fixtureFromBuild('roster', 'staff roster', -Math.PI / 2, function () { box(0.04, 1.0, 1.2, colorMat(0x8a6a3a, 0.9), -4.13, 1.7, 2.35, { cast: false }); signPlane(['STAFF ROSTER', 'driver · operator · night guard'], 1.1, 0.36, -4.16, 1.95, 2.35, -Math.PI / 2, { size: 24 }); hit(0.4, 1.2, 1.3, -4.25, 1.7, 2.35, { kind: 'roster' }); });   /* on the office side of the hall wall, clear of the dashboard */
//#endif
    // two more doors in town: the tobacconist who buys your cartons wholesale, and the police
    /* the tobacconist and the precinct are landmarks in buildCity now, placed before anything else claims the ground */
    CITY.pois.push({ id: 'tobac', name: 'Corner Tobacconist', x: 40, z: 8, col: '#e8c27a' }, { id: 'police', name: 'Police precinct', x: CITY.police.x, z: CITY.police.z + CITY.police.d / 2, col: '#5aa0d8' });
    // delivery drop marker and the weather
    /* a pool of drop markers: the round can have several stops out at once, so one beacon and one hit box per open job */
    exp.beacons = []; exp.dropHits = []; exp.rings = [];
    for (var bi = 0; bi < JOB_MAX; bi++) {
      var bc = cyl(0.5, 0.5, 14, new THREE.MeshBasicMaterial({ color: 0x6fdc8c, transparent: true, opacity: 0.35 }), 0, 7, 0, null, 12); bc.castShadow = false; bc.visible = false; exp.beacons.push(bc);
      var rg = new THREE.Mesh(new THREE.RingGeometry(1.5, 2.15, 26), new THREE.MeshBasicMaterial({ color: 0x6fdc8c, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }));
      rg.rotation.x = -Math.PI / 2; rg.position.y = 0.07; rg.visible = false; rg.castShadow = rg.receiveShadow = false; world.group.add(rg); exp.rings.push(rg);   /* the column washes out against a pale building in daylight; the ring on the ground does not */
      exp.dropHits.push(hit(2.4, 2.4, 2.4, 0, -50, 0, { kind: 'dropoff', idx: bi }));
    }
    var wn = 900, wgeo = new THREE.BufferGeometry(), wpos = new Float32Array(wn * 3); for (var wi = 0; wi < wn; wi++) { wpos[wi * 3] = (Math.random() - 0.5) * 36; wpos[wi * 3 + 1] = Math.random() * 16; wpos[wi * 3 + 2] = (Math.random() - 0.5) * 36; } wgeo.setAttribute('position', new THREE.BufferAttribute(wpos, 3)); exp.wx = new THREE.Points(wgeo, new THREE.PointsMaterial({ color: 0xcfe0f0, size: 0.09, transparent: true, opacity: 0.7, depthWrite: false })); exp.wx.visible = false; exp.wx.frustumCulled = false; scene.add(exp.wx);
  }
  function outdoors() { if (drive.on || player.floor === 2) return true; if (player.floor !== 0) return false; var x = player.pos.x, z = player.pos.z; return Math.abs(x) > ROOM.x + 0.3 || z > ROOM.z + 0.2 || z < -12.6 || (z < -ROOM.z - 0.2 && (x < -0.2 || x > SEC.x2 + 0.2)); }
  function updateExpansion(dt) {
    var X = xs(), W = X.weather;
    // weather and season
    if (WSFEST.snow && W.kind !== 'snow') { W.kind = 'snow'; W.until = now() + 3600000; exp.wxKind = 'snow'; }   /* a seasonal pack keeps the snow falling */
    if (now() > W.until) { var se = season(), r = Math.random(); W.kind = se === 'Winter' ? (r < 0.45 ? 'snow' : r < 0.6 ? 'clear' : 'clear') : r < (se === 'Autumn' ? 0.4 : 0.22) ? 'rain' : r < (se === 'Summer' ? 0.3 : 0.45) && se !== 'Spring' ? 'storm' : 'clear'; W.until = now() + randi(150, 320) * 1000; if (exp.wxKind && exp.wxKind !== W.kind) toast({ clear: '🌤️ It\'s clearing up', rain: '🌧️ It\'s started to rain, so fewer people are out', storm: '⛈️ A storm is rolling in and the street is emptying', snow: '❄️ It\'s snowing' }[W.kind], ''); exp.wxKind = W.kind; }
    var wet = W.kind !== 'clear', show = wet && outdoors(); exp.wx.visible = show; exp.wxMix = lerp(exp.wxMix || 0, show && W.kind === 'snow' ? 1 : 0, 0.04);   /* how much of the snow look applies: eased, and only out of doors */
    var fogN = show ? (W.kind === 'storm' ? 14 : W.kind === 'rain' ? 20 : 30) : 30;   /* indoors keeps the clear-weather fog: shutting the door should not fog the room */
    var fogF = show ? (W.kind === 'storm' ? 55 : W.kind === 'rain' ? 80 : 120) : 110;   /* the flakes carry the snow; the fog must not white out every texture in town */
    scene.fog.near = lerp(scene.fog.near, fogN, 0.02); scene.fog.far = lerp(scene.fog.far, fogF, 0.02);
    if (show) { var fall = W.kind === 'snow' ? 1.6 : 15, arr = exp.wx.geometry.attributes.position; for (var i = 0; i < arr.count; i++) { var y = arr.getY(i) - fall * dt; if (y < 0) y += 16; arr.setY(i, y); if (W.kind === 'snow') arr.setX(i, arr.getX(i) + Math.sin(y * 2 + i) * dt * 0.4); } arr.needsUpdate = true; exp.wx.position.set(camera.position.x, camera.position.y - 6, camera.position.z); exp.wx.material.size = W.kind === 'snow' ? 0.14 : 0.07; exp.wx.material.opacity = W.kind === 'snow' ? 0.9 : 0.55; }
    // fireworks over the town after dark, from a seasonal pack
    if (WSFEST.fireworks) { exp.fwT = (exp.fwT || 0) - dt; if (exp.fwT <= 0) { exp.fwT = randf(2.4, 6.5); if (nightNow() && outdoors()) { var fx2 = camera.position.x + randf(-55, 55), fz2 = camera.position.z + randf(-55, 55); burst(fx2, randf(16, 30), fz2, [0xff6b6b, 0xffc857, 0x6fdc8c, 0x7fd4ff, 0xff9ad2][randi(0, 4)], 46, 'up'); sfx('gunshot'); } } }
    // blackouts
    var wasOn = exp.powerWas !== false, on = powerOn(); if (on !== wasOn) { exp.powerWas = on; applyShopState(); if (!on) { sfx('bad'); toast('⚡ Power cut. The lights and every machine are down' + (S.upgrades.generator ? '.' : '. A generator would have covered this.'), 'bad'); logEvent('⚡ Power cut across the block', 'bad'); } else toast('⚡ Power is back', 'good'); }
    if (on && !S.upgrades.generator && Math.random() < dt / (W.kind === 'storm' ? 240 : 1500)) X.blackoutUntil = now() + randi(60, 110) * 1000;
    if (S.upgrades.generator && now() < (X.blackoutUntil || 0) && !exp.genSaid) { exp.genSaid = true; toast('⚡ Power cut. Your generator kicked in, so nothing stopped.', 'good'); } if (now() > (X.blackoutUntil || 0)) exp.genSaid = false;
    if (exp.genLed) exp.genLed.material.emissiveIntensity = S.upgrades.generator ? 1.6 : 0.2; if (exp.genLed && S.upgrades.generator) { exp.genLed.material.color.setHex(0x39d353); exp.genLed.material.emissive.setHex(0x39d353); }
    // heat cools off; at high heat an inspector turns up
    X.heat = Math.max(0, X.heat - dt * 0.03); if (X.heat < 25) exp.heatBand = 0;
    if (X.heat >= 60 && Math.random() < dt / 260) { var fine = 200 + Math.round((S.pocket || 0) * 0.25); fine = Math.min(fine, S.bank + S.vault + S.till + (S.pocket || 0)); var fromPocket = Math.min(S.pocket || 0, fine); S.pocket -= fromPocket; drawFunds(fine - fromPocket); X.heat = Math.max(0, X.heat - 25); sfx('siren'); toast('🚔 Inspection. Undeclared cash and paperwork: ' + money(fine) + ' in fines', 'bad'); logEvent('🚔 Police inspection: ' + money(fine) + ' in fines. Bank your pocket cash and lie low.', 'bad'); hud(); }
    // the lab and the bag line run only with power
    if (on) {
      labTick(dt);
      var BL = X.bagline; if (BL.on && S.upgrades.bagline) { BL.t += dt; if (BL.t >= 4) { BL.t = 0; var sid = Object.keys(S.stash).filter(function (k) { return S.stash[k].g >= bagGrams(); }).sort(function (a, b) { return S.stash[b].g - S.stash[a].g; })[0]; if (sid && (S.supplies.bag || 0) > 0) { var d = stashDraw(sid, bagGrams()); S.supplies.bag--; lotAdd('bags', sid, 1, clamp(d.q + 3, 20, 100), d.thc); syncGoods(); world.dirty = true; } } }
    }
    // roof beds grow in daylight; rain helps, winter slows them
    roofTick(dt);
    // staff: the operator keeps the basement fed
    exp.opT += dt; if (exp.opT > 5) { exp.opT = 0; if (X.staff.operator && hasLic('tobacco')) { var T = tob(); T.bays.forEach(function (b) { if (b.stage === 'ready') { b.stage = 'empty'; b.t = 0; T.leaf += TOB.bayKg; } else if (b.stage === 'empty' && S.bank >= TOB.sowCost) { S.bank -= TOB.sowCost; b.stage = 'grow'; b.t = 0; } }); T.kiln.on = T.shred.on = T.maker.on = T.packer.on = true; if (T.mat < 20 && S.bank >= TOB.matCost) { S.bank -= TOB.matCost; T.mat += TOB.matUnits; } } }
    // night: someone tries the back if nobody is watching
    if (nightNow() && !X.staff.night && Math.random() < dt / 700) { var T2 = tob(), tot = CIG_KEYS.reduce(function (a, k) { return a + T2.packs[k]; }, 0), beds = X.roof.filter(function (b) { return b.stage === 'ready'; }); if (tot > 20) { CIG_KEYS.forEach(function (k) { T2.packs[k] = Math.floor(T2.packs[k] * 0.7); }); syncTobRack(); sfx('bad'); toast('🌙 Break-in. Someone got into the basement and took cartons off the finished goods rack', 'bad'); logEvent('🌙 Night break-in: about ' + Math.round(tot * 0.3) + ' packs gone from the basement. A night guard would have stopped it.', 'bad'); } else if (beds.length) { beds[0].stage = 'empty'; beds[0].t = 0; toast('🌙 Someone climbed up and stripped a roof bed', 'bad'); logEvent('🌙 A ready roof bed was stripped overnight', 'bad'); } }
    updateJobs(dt);
    // the getaway car: catch it with yours and the loot comes back
    var G = exp.getaway; if (G) { G.t += dt; G.g.position.x += G.dir * 13 * dt; if (drive.on && Math.hypot(drive.g.position.x - G.g.position.x, drive.g.position.z - G.g.position.z) < (X.garage.bar ? 4.6 : 3.4)) { returnLoot(G.loot); S.rep += 4; sfx('hit'); toast('💥 You ran the getaway car off the road. Everything they took is back (rep +4)', 'good'); logEvent('🚗 You caught the getaway car', 'good'); world.group.remove(G.g); disposeTree(G.g); exp.getaway = null; } else if (Math.abs(G.g.position.x) > CITY.x - 3 || G.t > 40) { logEvent('💨 The getaway car made it out of town with ' + (G.loot.grabbed > 0 ? money(G.loot.grabbed) : 'your goods'), 'bad'); world.group.remove(G.g); disposeTree(G.g); exp.getaway = null; } }
  }
  // Called once the world is built, and by the tests after they switch a DLC: its props rebuild (hidden or back), the
  // roof greenhouse and its ladder come and go. The Workshop reloads the page when you apply, so in play it runs at boot.
  function applyDlcWorld(rebuild) {
    var gh = dlcOn('greenhouse'); (exp.ghParts || []).forEach(function (o) { if (exp.roofBeds.indexOf(o) < 0) o.visible = gh; });
    if (!gh) exp.roofBeds.forEach(function (g) { g.visible = false; }); else roofTick(0, true);
    if (rebuild) Object.keys(PROP_DLC).forEach(function (id) { if (propInst[id]) buildProp(id); });
  }
  function labTick(dt) {   // a lab batch runs down its timer; the caller decides whether there is power
    if (!dlcOn('lab')) return;   /* switched off: a running batch waits */
    var X = xs(), J = X.lab.job; if (J) { J.t += dt; if (J.t >= J.dur) { X.lab.out[J.sku] += J.n; X.lab.job = null; sfx('ok'); toast('🧪 Lab batch done: ' + J.n + ' × ' + CIG_SKUS[J.sku].name + ' waiting on the lab shelf', 'good'); save(); } }
  }
  function roofTick(dt, catchUp) {   // catchUp: time already scaled for the daylight share, so the hour it happens to be now does not matter
    var X = xs(), W = X.weather, gh = dlcOn('greenhouse');   /* switched off: the beds wait as they are */
    X.roof.forEach(function (b, i) { if (gh && b.stage === 'grow' && (catchUp || !nightNow())) { b.t += dt * (W.kind === 'rain' ? 1.5 : 1) * (season() === 'Winter' ? 0.5 : 1); if (b.t >= 260) { b.stage = 'ready'; toast('🌿 Roof bed ' + (i + 1) + ' is ready', 'good'); } } var g = exp.roofBeds[i]; if (g) { g.visible = gh && b.stage !== 'empty'; var sc = b.stage === 'ready' ? 1 : 0.1 + clamp(b.t / 260, 0, 1) * 0.9; g.scale.set(1, sc, 1); } });
  }
