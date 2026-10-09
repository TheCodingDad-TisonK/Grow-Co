//@ upstairs rooms and the expansion: interiors, lab, roof, heat, wholesale
  // ── Upstairs is two rooms now: the owner's flat (office stairs) and the connoisseur lounge (its own stair from the lobby) ──
  var DIVX = 2.0;   // the dividing wall; the flat is west of it, the lounge east
  var vip = { g: null, h: null, bubble: null, state: 'away', path: [], t: 0, up: false };
  function stair2Y(x, z, up) { if (x > STAIR2.x1 - 0.15 && x < STAIR2.x2 + 0.15 && z > STAIR2.z1 - 0.05 && z < STAIR2.z2 + 0.3) return UP.y * clamp((x - STAIR2.x1) / (STAIR2.x2 - STAIR2.x1), 0, 1); return up ? UP.y : 0; }
  function buildVipWing() {
    var S2 = STAIR2, n = 16, rise = UP.y / n, run = (S2.x2 - S2.x1) / n, sw = S2.z2 - S2.z1, sz = (S2.z1 + S2.z2) / 2, carpet = colorMat(0x5a1f2a, 0.95), brass = colorMat(0xc9a24a, 0.35, 0.8);
    // the lounge stair: carpeted treads rising along the lobby's back wall, brass rail on the open side
    for (var i = 0; i < n; i++) { box(run, rise, sw, MAT.darkwood, S2.x1 + run * (i + 0.5), rise * (i + 0.5), sz, { cast: true }); box(run, 0.02, sw - 0.2, carpet, S2.x1 + run * (i + 0.5), rise * (i + 1) + 0.011, sz, { cast: false }); box(run, rise * (i + 1), 0.04, MAT.darkwood, S2.x1 + run * (i + 0.5), rise * (i + 1) / 2, S2.z2 - 0.02, { cast: true }); }
    var railLen = Math.hypot(UP.y, S2.x2 - S2.x1) + 0.3, railA = Math.atan2(UP.y, S2.x2 - S2.x1); var rail = new THREE.Mesh(roundCylGeo(0.025, 0.025, railLen, 10), brass); rail.rotation.z = railA - Math.PI / 2; rail.position.set((S2.x1 + S2.x2) / 2, UP.y / 2 + 0.95, S2.z2 - 0.02); world.group.add(rail);
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
  function vipSay(t, col) { var ob = vip.bubble.material.map; vip.bubble.material.map = signTex([t], 512, 160, { size: 40, titleColor: col || '#e8c27a' }); vip.bubble.material.needsUpdate = true; if (ob) ob.dispose(); vip.bubble.visible = true; vip.sayT = 4; }
  function vipSeat() { return propInst.vipTable ? growPropWorld('vipTable', 0.95, 0) : { x: 8.35, z: -1.6 }; }
  function startVip() {
    if (S.vip || vip.state !== 'away' || !shop().open || !hasLic('premium')) return false;
    if (!vip.g) { vip.g = new THREE.Group(); world.group.add(vip.g); vip.bubble = sprite(signTex(['…'], 512, 160, { size: 40 }), 1.6, 0.5, 0, 2.3, 0, vip.g); }
    if (vip.h) { vip.g.remove(vip.h); dropTree(vip.h); } world.interact = world.interact.filter(function (m) { return !m.userData.vipHit; });
    vip.h = makePerson({ skin: pick(SKINS), hair: pick(HAIRS), shirt: 0x1d1d26, pants: 0x15151c, coat: 0x2a2233, glasses: true, watch: true, necklace: true, longSleeve: true, shoes: 0x111111, mood: 'neutral' }); vip.g.add(vip.h);
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
      var done = walkMesh(g, vip.path, 1.25, dt); var onStair = g.position.x > STAIR2.x1 - 0.15 && g.position.x < STAIR2.x2 + 0.15 && g.position.z > STAIR2.z1 - 0.05 && g.position.z < STAIR2.z2 + 0.3; if (onStair) vip.up = g.position.x > (STAIR2.x1 + STAIR2.x2) / 2; g.position.y = stair2Y(g.position.x, g.position.z, vip.up); animatePerson(vip.h, dt, 'walk', 1.25, null);
      if (done) { if (vip.state === 'out') { vip.state = 'away'; g.visible = false; world.interact = world.interact.filter(function (m) { return !m.userData.vipHit; }); } else { vip.state = 'sit'; g.position.y = UP.y; g.rotation.y = -Math.PI / 2; vipSay(S.vip ? S.vip.qty + ' × ' + kindName(S.vip.kind, S.vip.qty) + ' · q' + S.vip.minQ + '+' : '…'); } }
      return;
    }
    if (vip.state === 'sit') { animatePerson(vip.h, dt, 'idle', 0, player.floor === 1 ? player.pos : null); vip.h.position.y = -0.32; var P = vip.h.userData.parts; P.lLeg.rotation.x = -1.4; P.rLeg.rotation.x = -1.4; P.lLeg.userData.knee.rotation.x = 1.4; P.rLeg.userData.knee.rotation.x = 1.4; if (!S.vip || now() > S.vip.until) { S.rep = Math.max(0, S.rep - 3); logEvent('🥂 The lounge guest gave up waiting (rep -3)', 'bad'); toast('🥂 Your lounge guest left unserved (rep -3)', 'bad'); vip.h.position.y = 0; vipLeave('I do not wait.', '#ff6b6b'); } }
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
  function seasonLabel() { return ['Spring', 'Summer', 'Autumn', 'Winter'][Math.floor(((S.day || 1) - 1) / 7) % 4]; }
  function weekend() { var d = (S.day || 1) % 7; return d === 6 || d === 0; }
  function footfall() { var w = xs().weather.kind, f = WSTUNE.footfall * (w === 'storm' ? 0.6 : w === 'rain' ? 0.8 : w === 'snow' ? 0.75 : 1); if (weekend()) f *= 1.3; if ((S.day || 1) % 28 >= 25) f *= 1.5; return f * dlcFootfall(); }
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
    function person(x, y, z, yaw, spec, data) { var h = makePerson(spec); h.position.set(x, y, z); h.rotation.y = yaw; world.group.add(h); var hb = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.9, 0.9), MAT.none); hb.position.y = 0.95; h.add(hb); interactable(hb, data); return h; }
    exp.zoneLight = new THREE.PointLight(0xfff0d8, 0, 20, 1.3); scene.add(exp.zoneLight);
    Object.keys(ZONES).forEach(function (id) { var Z = ZONES[id], w = Z.x2 - Z.x1, d = Z.z2 - Z.z1, cx = (Z.x1 + Z.x2) / 2, cz = (Z.z1 + Z.z2) / 2, wm = colorMat(id === 'bank' ? 0xe9e4d8 : id === 'gun' ? 0x6b5a48 : 0xdfe4e8, 0.9);
      floorPlane(id === 'gun' ? MAT.planks : MAT.tile, Z.x1, Z.x2, Z.z1, Z.z2, 1.6, Y + 0.001); bb(w + 0.6, 3.2, 0.3, wm, cx, 1.6, Z.z1 - 0.15, { solid: true, tag: 'wall' }); bb(w + 0.6, 3.2, 0.3, wm, cx, 1.6, Z.z2 + 0.15, { solid: true, tag: 'wall' }); bb(0.3, 3.2, d, wm, Z.x1 - 0.15, 1.6, cz, { solid: true, tag: 'wall' }); bb(0.3, 3.2, d, wm, Z.x2 + 0.15, 1.6, cz, { solid: true, tag: 'wall' }); bb(w + 0.6, 0.3, d + 0.6, dark, cx, 3.35, cz, { cast: true }); bb(w - 2, 0.04, d - 2, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff0d8, emissiveIntensity: 0.7 }), cx, 3.18, cz, { cast: false });
      bb(1.3, 2.3, 0.08, MAT.darkwood, Z.spawn[0], 1.15, Z.z2 - 0.02, { cast: false }); signPlane(['EXIT'], 0.6, 0.22, Z.spawn[0], Y + 2.55, Z.z2 - 0.03, Math.PI, { size: 40, titleColor: '#6fdc8c' }); hit(1.5, 2.3, 0.8, Z.spawn[0], Y + 1.15, Z.z2 - 0.3, { kind: 'zoneExit', zone: id }); });
    // the bank: a teller line behind glass, brass posts, an ATM and the vault door at the back
    var BK = ZONES.bank; bb(10, 1.1, 0.7, MAT.darkwood, 36, 0.55, -3.2, { solid: true, tag: 'zone' }); bb(10, 0.05, 0.8, colorMat(0xe9e4d8, 0.3), 36, 1.12, -3.2, { cast: false }); bb(10, 1.3, 0.04, glassM, 36, 1.8, -3.2, { cast: false }); [32.5, 36, 39.5].forEach(function (tx, i) { bb(0.06, 1.3, 0.06, brass, tx - 1.7, 1.8, -3.2, { cast: false }); if (i < 2) person(tx, Y, -4.2, 0, { shirt: 0xf4f1ea, pants: 0x1d2433, coat: 0x1d2433, glasses: i === 0, longSleeve: true, mood: 'happy' }, { kind: 'zoneClerk', poi: 'bank' }); });
    var vd = cyl(1.1, 1.1, 0.25, steel, 36, Y + 1.5, -5.8, null, 28); vd.rotation.x = Math.PI / 2; var vw = cyl(0.35, 0.35, 0.12, brass, 36, Y + 1.5, -5.62, null, 8); vw.rotation.x = Math.PI / 2; bb(0.7, 1.8, 0.5, dark, 41.4, 0.9, -1.5, { solid: true, tag: 'zone' }); bb(0.5, 0.35, 0.02, emitMat(0x39a0ff, 1.0), 41.4, 1.35, -1.24, { cast: false }); hit(0.9, 1.9, 0.9, 41.4, Y + 0.95, -1.4, { kind: 'zoneClerk', poi: 'bank' });
    [[33, 0], [39, 0]].forEach(function (p) { cyl(0.03, 0.05, 1.0, brass, p[0], Y + 0.5, p[1], null, 10); }); bb(6, 0.03, 0.03, colorMat(0x5a1f2a, 0.9), 36, 0.92, 0, { cast: false }); signPlane(['FIRST HARVEST BANK', 'your money is safe with us'], 5, 0.9, 36, Y + 2.7, BK.z1 + 0.03, 0, { size: 50, bg: '#0e1a2a', titleColor: '#8fc0ff' });
    // the gun store: racks on the back wall, a glass counter, a clerk who has seen it all
    bb(8, 1.0, 0.7, MAT.darkwood, 53, 0.5, -3.0, { solid: true, tag: 'zone' }); bb(7.8, 0.3, 0.6, glassM, 53, 1.15, -3.0, { cast: false }); for (var gi = 0; gi < 6; gi++) { bb(0.06, 0.06, 0.34, dark, 50.2 + gi * 1.1, 1.08, -3.0, { cast: false }); var rf = bb(1.3, 0.09, 0.05, gi % 2 ? MAT.darkwood : dark, 50 + gi * 1.2, 2.0 - (gi % 3) * 0.35, -5.9, { cast: false }); bb(0.35, 0.16, 0.05, MAT.darkwood, 49.5 + gi * 1.2, 1.97 - (gi % 3) * 0.35, -5.9, { cast: false }); }
    bb(8, 2.0, 0.04, colorMat(0x8a7a5a, 0.9), 53, 1.7, -5.96, { cast: false }); person(53, Y, -4.0, 0, { shirt: 0x3a4a2a, pants: 0x2a2a2a, beard: true, hat: 'cap', capColor: 0x2a2a2a, longSleeve: true }, { kind: 'zoneClerk', poi: 'gun' }); [[49, 0.5], [57, 0.5]].forEach(function (p) { bb(1.2, 1.8, 0.5, dark, p[0], 0.9, p[1], { solid: true, tag: 'zone' }); for (var s = 0; s < 4; s++) bb(1.0, 0.18, 0.4, colorMat([0x6b5a2a, 0x2f5f8a, 0xb5121b, 0x3a3a3a][s], 0.7), p[0], 0.3 + s * 0.42, p[1] + 0.06, { cast: false }); });
    signPlane(['IRON & OAK', 'arms · ammunition · armour'], 4, 0.8, 53, Y + 2.75, ZONES.gun.z1 + 0.03, 0, { size: 50, bg: '#1a0e0a', titleColor: '#ff8a70' });
    (function bankDetail() {
      var oak = MAT.darkwood, gm = MAT.gunmetal, carpet = new THREE.MeshStandardMaterial({ map: TEX.fabric, color: 0x5a1f2a, roughness: 1 }), leather = colorMat(0x3a2418, 0.55);
      bb(10, 0.12, 0.03, brass, 36, 0.06, -2.835, { cast: false }); for (var p = 0; p < 8; p++) bb(1.05, 0.7, 0.025, oak, 31.6 + p * 1.257, 0.62, -2.84, { cast: false, r: 0.01 });
      bb(10.06, 0.06, 0.1, brass, 36, 2.48, -3.2, { cast: false }); bb(0.06, 1.3, 0.06, brass, 40.97, 1.8, -3.2, { cast: false });
      [32.5, 36, 39.5].forEach(function (tx, i) {
        bb(0.5, 0.012, 0.3, brass, tx, 1.151, -3.0, { cast: false }); var gr = cyl(0.09, 0.09, 0.02, brass, tx, Y + 1.75, -3.17, null, 20); gr.rotation.x = Math.PI / 2; for (var s = 0; s < 4; s++) bb(0.12, 0.008, 0.002, MAT.black, tx, 1.71 + s * 0.027, -3.157, { cast: false, sharp: true });
        signPlane([i < 2 ? 'TELLER ' + (i + 1) : 'CLOSED'], 0.7, 0.16, tx, Y + 2.3, -3.16, 0, { size: 30, bg: '#0e1a2a', titleColor: i < 2 ? '#8fc0ff' : '#c98a7a' });
        bb(0.34, 0.26, 0.03, MAT.black, tx + 0.6, 1.3, -3.42, { cast: false, r: 0.008 }).rotation.y = Math.PI; bb(0.1, 0.12, 0.08, gm, tx + 0.6, 1.17, -3.44, { cast: false });
      });
      bb(2.9, 2.9, 0.1, gm, 36, 1.5, -5.93, { cast: false }); var ring = new THREE.Mesh(new THREE.TorusGeometry(1.14, 0.07, 12, 48), steel); ring.position.set(36, Y + 1.5, -5.72); world.group.add(ring);
      for (var b = 0; b < 12; b++) { var a = b * Math.PI / 6; var bolt = cyl(0.055, 0.055, 0.06, brass, 36 + Math.cos(a) * 0.88, Y + 1.5 + Math.sin(a) * 0.88, -5.66, null, 12); bolt.rotation.x = Math.PI / 2; }
      for (var sp = 0; sp < 4; sp++) { var spoke = box(0.9, 0.045, 0.045, brass, 36, Y + 1.5, -5.54, { cast: false, r: 0.012 }); spoke.rotation.z = sp * Math.PI / 4; } var hub = cyl(0.09, 0.09, 0.1, brass, 36, Y + 1.5, -5.52, null, 16); hub.rotation.x = Math.PI / 2;
      bb(0.22, 1.7, 0.22, steel, 34.72, 1.5, -5.75, { r: 0.03 }); [0.95, 2.05].forEach(function (y) { bb(0.34, 0.12, 0.16, steel, 34.85, y, -5.72, { cast: false }); });
      /* the ATM: a surround, a keypad shelf, slots for the card and the cash */
      bb(0.78, 0.06, 0.56, gm, 41.4, 1.83, -1.5); bb(0.58, 0.43, 0.02, MAT.gloss, 41.4, 1.35, -1.245, { cast: false }); var ks = bb(0.5, 0.03, 0.2, gm, 41.4, 1.06, -1.18, { r: 0.01 }); ks.rotation.x = 0.25; for (var k = 0; k < 12; k++) { var key = bb(0.035, 0.01, 0.03, colorMat(0xd0d3d8, 0.5), 41.33 + (k % 3) * 0.045, 1.078 - Math.floor(k / 3) * 0.011, -1.24 + Math.floor(k / 3) * 0.042, { cast: false, r: 0.003 }); key.rotation.x = 0.25; }
      bb(0.12, 0.014, 0.012, emitMat(0x6fdc8c, 1.2), 41.58, 1.13, -1.243, { cast: false, sharp: true }); bb(0.4, 0.03, 0.02, MAT.black, 41.4, 0.85, -1.243, { cast: false }); signPlane(['ATM'], 0.5, 0.16, 41.4, Y + 1.68, -1.243, 0, { size: 30, bg: '#0e1a2a', titleColor: '#8fc0ff' });
      [[33, 0], [39, 0]].forEach(function (p) { cyl(0.16, 0.18, 0.03, brass, p[0], Y + 0.015, p[1], null, 24); var ball = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 10), brass); ball.position.set(p[0], Y + 1.03, p[1]); world.group.add(ball); });
      bb(2.4, 0.012, 4.5, carpet, 36, 0.007, -0.5, { cast: false, sharp: true }); bb(2.5, 0.01, 0.06, brass, 36, 0.008, -2.76, { cast: false, sharp: true });
      bb(0.55, 0.05, 1.6, oak, 30.3, 1.05, -0.6, { solid: true, tag: 'zone' }); [-1.3, 0.1].forEach(function (z) { bb(0.5, 1.03, 0.06, oak, 30.3, 0.515, z); }); bb(0.2, 0.06, 0.26, brass, 30.3, 1.105, -1.0, { cast: false }); bb(0.17, 0.05, 0.22, MAT.white, 30.3, 1.13, -1.0, { cast: false, sharp: true }); cyl(0.03, 0.035, 0.03, brass, 30.25, Y + 1.09, -0.3, null, 12); var pen = cyl(0.006, 0.006, 0.15, MAT.black, 30.25, Y + 1.17, -0.3, null, 6); pen.rotation.z = 0.35;
      bb(0.55, 0.12, 1.7, leather, 41.55, 0.47, 0.75, { solid: true, tag: 'zone', r: 0.04 }); [-0.75, 0.75].forEach(function (z) { bb(0.5, 0.41, 0.05, brass, 41.55, 0.205, 0.75 + z, { cast: false }); });
      [30.02, 41.98].forEach(function (x) { bb(0.03, 1.0, 8, oak, x, 0.5, -2, { cast: false, sharp: true }); bb(0.05, 0.05, 8, brass, x, 1.02, -2, { cast: false }); });
      var ck = cyl(0.3, 0.3, 0.04, colorMat(0xf6f2e6, 0.5), 39.6, Y + 2.35, -5.97, null, 32); ck.rotation.x = Math.PI / 2; var cr = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 10, 40), brass); cr.position.set(39.6, Y + 2.35, -5.95); world.group.add(cr); var h1 = box(0.02, 0.2, 0.004, MAT.black, 39.6, Y + 2.42, -5.945, { cast: false, sharp: true }); h1.rotation.z = -0.5; h1.position.x += 0.04; var h2 = box(0.014, 0.26, 0.004, MAT.black, 39.6, Y + 2.35, -5.944, { cast: false, sharp: true }); h2.rotation.z = 1.2; h2.position.x -= 0.1;
      [33, 36, 39].forEach(function (x) { cyl(0.008, 0.008, 0.55, brass, x, Y + 2.9, -0.6, null, 8); var sh = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 14), new THREE.MeshStandardMaterial({ color: 0xfff6e2, emissive: 0xffe9c0, emissiveIntensity: 0.9, roughness: 0.4 })); sh.position.set(x, Y + 2.5, -0.6); world.group.add(sh); cyl(0.05, 0.08, 0.05, brass, x, Y + 2.66, -0.6, null, 14); });
    })();
    (function gunDetail() {
      var gm = MAT.gunmetal, walnut = MAT.darkwood, felt = new THREE.MeshStandardMaterial({ map: TEX.fabric, color: 0x3a1418, roughness: 1 }), olive = colorMat(0x4a5232, 0.85), enamel = colorMat(0x1f4a35, 0.35, 0.2);
      for (var gi = 0; gi < 6; gi++) {
        var gx = 50 + gi * 1.2, gy = 2.0 - (gi % 3) * 0.35;
        var brl = cyl(0.016, 0.016, 0.5, gm, gx + 0.9, Y + gy + 0.015, -5.9, null, 10); brl.rotation.z = Math.PI / 2; bb(0.02, 0.03, 0.012, gm, gx + 1.12, gy + 0.04, -5.9, { cast: false });
        if (gi % 2 === 0) { var sc = cyl(0.026, 0.026, 0.32, MAT.black, gx + 0.1, Y + gy + 0.09, -5.9, null, 12); sc.rotation.z = Math.PI / 2; [-0.08, 0.08].forEach(function (o) { bb(0.02, 0.03, 0.03, gm, gx + 0.1 + o, gy + 0.055, -5.9, { cast: false }); }); } else { var mg = bb(0.06, 0.16, 0.035, gm, gx + 0.08, gy - 0.11, -5.9, { cast: false }); mg.rotation.z = 0.2; }
        var tg = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 6, 14), gm); tg.position.set(gx - 0.18, Y + gy - 0.06, -5.9); world.group.add(tg);
        [-0.4, 0.45].forEach(function (o) { var pegm = cyl(0.01, 0.01, 0.1, brass, gx + o, Y + gy - 0.06, -5.91, null, 8); pegm.rotation.x = Math.PI / 2; });
      }
      bb(8, 0.05, 0.26, walnut, 53, 2.42, -5.82); [49.6, 51, 53, 55, 56.4].forEach(function (x, i) { if (i % 2) { var hm = new THREE.Mesh(new THREE.SphereGeometry(0.15, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), olive); hm.position.set(x, Y + 2.445, -5.82); hm.scale.z = 1.2; world.group.add(hm); } else for (var s = 0; s < 3; s++) bb(0.22, 0.09, 0.14, colorMat([0xb5121b, 0x2f5f8a, 0x6b5a2a][s], 0.7), x + (s % 2) * 0.05, 2.49 + s * 0.09, -5.82, { cast: false }); });
      for (var ci = 0; ci < 6; ci++) {
        var px = 50.75 + ci * 1.1; if (px > 56.6) break;
        bb(0.8, 0.012, 0.42, felt, px, 1.007, -3.0, { cast: false, sharp: true }); bb(0.2, 0.028, 0.036, ci % 3 === 1 ? MAT.chrome : gm, px - 0.1, 1.03, -3.06, { cast: false }); var gp = bb(0.05, 0.026, 0.11, ci % 2 ? walnut : MAT.black, px - 0.17, 1.029, -3.0, { cast: false }); gp.rotation.y = 0.25;
        bb(0.11, 0.05, 0.07, colorMat([0xb5121b, 0x2f5f8a, 0x6b5a2a][ci % 3], 0.7), px + 0.2, 1.04, -3.05, { cast: false }); bb(0.11, 0.05, 0.07, colorMat([0x2f5f8a, 0x6b5a2a, 0xb5121b][ci % 3], 0.7), px + 0.22, 1.04, -2.94, { cast: false }); bb(0.1, 0.03, 0.002, MAT.white, px, 1.03, -2.82, { cast: false, sharp: true });
      }
      [-2.7, -3.3].forEach(function (z) { bb(7.84, 0.02, 0.02, brass, 53, 1.305, z, { cast: false }); }); [49.1, 56.9].forEach(function (x) { bb(0.02, 0.3, 0.62, brass, x, 1.15, -3.0, { cast: false }); });
      var rail = cyl(0.025, 0.025, 7.6, brass, 53, Y + 0.2, -2.56, null, 12); rail.rotation.z = Math.PI / 2; [49.6, 51.9, 54.1, 56.4].forEach(function (x) { bb(0.03, 0.03, 0.1, brass, x, 0.2, -2.61, { cast: false }); }); for (var pl = 0; pl < 10; pl++) bb(0.76, 0.9, 0.02, walnut, 49.4 + pl * 0.8, 0.5, -2.64, { cast: false, r: 0.008 });
      bb(0.42, 0.13, 0.4, MAT.black, 56.3, 1.375, -3.0, { r: 0.015 }); bb(0.3, 0.2, 0.02, MAT.gloss, 56.3, 1.54, -3.12, { cast: false }).rotation.x = -0.3;
      cyl(0.2, 0.22, 0.03, gm, 49.0, Y + 0.015, -5.3, null, 20); cyl(0.02, 0.02, 1.1, MAT.chrome, 49.0, Y + 0.56, -5.3, null, 8); bb(0.5, 0.62, 0.27, colorMat(0x23271f, 0.8), 49.0, 1.38, -5.3, { r: 0.09 }); [[-0.12, 1.45], [0.12, 1.45], [-0.12, 1.24], [0.12, 1.24]].forEach(function (pk) { bb(0.18, 0.15, 0.02, colorMat(0x2f3429, 0.8), 49.0 + pk[0], pk[1], -5.155, { cast: false, r: 0.01 }); }); [-0.19, 0.19].forEach(function (o) { bb(0.09, 0.2, 0.2, colorMat(0x23271f, 0.8), 49.0 + o, 1.74, -5.3, { r: 0.03 }); });
      signPlane(['RANGE RULES', 'muzzle down · finger off · eyes and ears on'], 1.8, 0.5, 57.97, Y + 1.9, -1.2, -Math.PI / 2, { titleColor: '#ff8a70', bg: '#1a0e0a' }); signPlane(['LICENCE CHECKED', 'on every sale'], 1.2, 0.4, 48.03, Y + 1.9, -1.2, Math.PI / 2, { titleColor: '#ffc857', bg: '#1a0e0a' });
      bb(0.8, 0.4, 0.5, olive, 48.75, 0.2, 1.4, { solid: true, tag: 'zone', r: 0.015 }); var c2 = bb(0.8, 0.4, 0.5, olive, 48.8, 0.6, 1.42, { r: 0.015 }); c2.rotation.y = 0.12; [[48.75, 0.2], [48.8, 0.6]].forEach(function (cr) { bb(0.82, 0.04, 0.52, gm, cr[0], cr[1] + 0.13, 1.41, { cast: false }); bb(0.1, 0.06, 0.02, MAT.chrome, cr[0], cr[1] + 0.05, 1.145, { cast: false }); });
      bb(3.4, 0.012, 2.2, new THREE.MeshStandardMaterial({ map: TEX.fabric, color: 0x4a2a1c, roughness: 1 }), 53, 0.007, -0.7, { cast: false, sharp: true });
      [50.5, 53, 55.5].forEach(function (x) { cyl(0.008, 0.008, 0.6, MAT.black, x, Y + 2.88, -1.6, null, 8); cyl(0.06, 0.26, 0.2, enamel, x, Y + 2.5, -1.6, null, 24); var bl = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 10), new THREE.MeshStandardMaterial({ color: 0xfff6e2, emissive: 0xffe9c0, emissiveIntensity: 1.1 })); bl.position.set(x, Y + 2.43, -1.6); world.group.add(bl); });
    })();
    // the lab: a closed-loop extractor, a vacuum oven, a cart filler and a confectionery depositor; its door is on the basement's left wall
    bb(0.08, 2.3, 1.3, colorMat(0xdfe4e8, 0.6), BASE.x1 + 0.04, 1.15, -3.0, { cast: false }); signPlane(['EXTRACTION LAB', 'carts · gummies · chocolate'], 1.5, 0.4, BASE.x1 + 0.05, Y + 2.6, -3.0, Math.PI / 2, { titleColor: '#8fc0ff' }); hit(0.8, 2.3, 1.4, BASE.x1 + 0.3, Y + 1.15, -3.0, { kind: 'zoneDoor', zone: 'lab' });
    [16, 17.2, 18.4].forEach(function (tx, i) { cyl(0.4, 0.4, 1.6 + i * 0.2, steel, tx, Y + 0.9 + i * 0.1, -4.8, null, 18); cyl(0.12, 0.12, 0.3, dark, tx, Y + 1.85 + i * 0.2, -4.8, null, 10); }); var pp = cyl(0.05, 0.05, 3.2, colorMat(0xb04a2a, 0.4, 0.5), 17.2, Y + 2.35, -4.8, null, 8); pp.rotation.z = Math.PI / 2; bb(3.6, 0.1, 1.2, dark, 17.2, 0.05, -4.8, { solid: true, tag: 'zone' });
    bb(1.2, 1.0, 0.9, steel, 20.5, 0.5, -5.2, { solid: true, tag: 'zone' }); bb(1.0, 0.7, 0.06, glassM, 20.5, 0.55, -4.72, { cast: false }); bb(2.4, 0.9, 0.8, steel, 22.4, 0.45, -2.0, { solid: true, tag: 'zone' }); for (var ci = 0; ci < 8; ci++) bb(0.05, 0.12, 0.05, colorMat(0xe8c27a, 0.3, 0.6), 21.5 + ci * 0.25, 0.97, -2.0, { cast: false });
    signPlane(['EXTRACTOR', 'E to run a batch'], 1.4, 0.4, 17.2, Y + 2.8, ZONES.lab.z1 + 0.03, 0, {}); hit(4.0, 2.4, 1.6, 17.2, Y + 1.2, -4.6, { kind: 'labRig' }); hit(2.6, 1.6, 1.2, 22.4, Y + 0.9, -2.0, { kind: 'labRig' });
    (function labDetail() {
      var ss = MAT.steel, gm = MAT.gunmetal, copper = colorMat(0xb87333, 0.3, 1), white = colorMat(0xf2f4f5, 0.4, 0.05);
      [16, 17.2, 18.4].forEach(function (tx, i) {
        var top = Y + 1.7 + i * 0.2; var dome = new THREE.Mesh(new THREE.SphereGeometry(0.4, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), ss); dome.scale.y = 0.45; dome.position.set(tx, top, -4.8); dome.castShadow = true; world.group.add(dome);
        [0.35, 1.0, top - Y - 0.25].forEach(function (y) { var band = new THREE.Mesh(new THREE.TorusGeometry(0.405, 0.018, 8, 28), gm); band.rotation.x = Math.PI / 2; band.position.set(tx, Y + y, -4.8); world.group.add(band); });
        var g1 = cyl(0.07, 0.07, 0.03, ss, tx, Y + 1.25, -4.38, null, 20); g1.rotation.x = Math.PI / 2; var f1 = cyl(0.058, 0.058, 0.005, white, tx, Y + 1.25, -4.362, null, 20); f1.rotation.x = Math.PI / 2; var nd = box(0.004, 0.045, 0.002, colorMat(0xc0271b, 0.5), tx + 0.01, Y + 1.262, -4.358, { cast: false, sharp: true }); nd.rotation.z = -0.7 + i * 0.6;
        cyl(0.03, 0.03, 0.08, copper, tx + 0.3, Y + 0.5, -4.45, null, 10).rotation.x = Math.PI / 2; var wheel = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.01, 6, 16), colorMat(0xd0201a, 0.4)); wheel.position.set(tx + 0.3, Y + 0.5, -4.39); world.group.add(wheel);
        cyl(0.05, 0.05, 0.5, glassM, tx - 0.2, Y + 0.9, -4.41, null, 12); cyl(0.04, 0.04, 0.3, colorMat(0xd9a23a, 0.3, 0, { transparent: true, opacity: 0.8 }), tx - 0.2, Y + 0.8, -4.41, null, 12);
        [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]].forEach(function (l) { bb(0.06, 0.1, 0.06, gm, tx + l[0], 0.15, -4.8 + l[1], { sharp: true, cast: false }); });
      });
      [16.6, 17.8].forEach(function (x) { var el = cyl(0.04, 0.04, 0.5, copper, x, Y + 2.1, -4.8, null, 10); el.rotation.z = Math.PI / 2; var fl = cyl(0.07, 0.07, 0.03, gm, x, Y + 2.1, -4.8, null, 14); fl.rotation.z = Math.PI / 2; });
      bb(0.5, 1.5, 0.3, MAT.gloss, 19.5, 0.95, -5.7, { r: 0.015 }); var rd = readout(0.34, 0.2, '#8fc0ff'); rd.position.set(19.5, Y + 1.35, -5.545); world.group.add(rd); rd.userData.draw(['Closed loop', 'solvent recovery', 'jacket 38 °C', 'vacuum holding']); [[-0.1, 0x6fdc8c], [0, 0xf0b94d], [0.1, 0xff6b5e]].forEach(function (b) { var bt = cyl(0.022, 0.022, 0.02, colorMat(b[1], 0.35), 19.5 + b[0], Y + 1.05, -5.54, null, 14); bt.rotation.x = Math.PI / 2; });
      /* the vacuum oven: a door with a porthole, a handle, a control strip */
      bb(1.04, 0.84, 0.03, gm, 20.5, 0.52, -4.735, { cast: false, r: 0.01 }); var port = cyl(0.26, 0.26, 0.02, MAT.gloss, 20.5, Y + 0.55, -4.71, null, 28); port.rotation.x = Math.PI / 2; var pg2 = cyl(0.21, 0.21, 0.01, glassM, 20.5, Y + 0.55, -4.695, null, 28); pg2.rotation.x = Math.PI / 2; bb(0.04, 0.4, 0.05, MAT.chrome, 20.96, 0.55, -4.69); bb(1.2, 0.14, 0.04, MAT.gloss, 20.5, 1.08, -4.76, { cast: false }); var od = readout(0.3, 0.09, '#f0b94d'); od.position.set(20.3, Y + 1.08, -4.735); world.group.add(od); od.userData.draw(['60 °C  ·  -29 inHg']);
      /* the depositor: a hopper, a row of nozzles, a belt of moulds */
      cyl(0.3, 0.12, 0.4, ss, 21.7, Y + 1.35, -2.0, null, 24); cyl(0.31, 0.31, 0.02, MAT.chrome, 21.7, Y + 1.56, -2.0, null, 24); bb(0.3, 0.3, 0.5, gm, 21.7, 1.05, -2.0, { r: 0.02 }); for (var nz = 0; nz < 4; nz++) cyl(0.012, 0.006, 0.06, MAT.chrome, 21.7, Y + 0.93, -2.18 + nz * 0.12, null, 8);
      bb(1.6, 0.03, 0.5, colorMat(0x16181b, 0.8), 22.7, 0.915, -2.0, { cast: false }); for (var md = 0; md < 5; md++) { bb(0.24, 0.02, 0.4, colorMat(0xe05a8a, 0.5), 22.1 + md * 0.3, 0.94, -2.0, { cast: false, sharp: true }); for (var cv = 0; cv < 6; cv++) bb(0.06, 0.012, 0.09, colorMat([0xff6b5e, 0xf0b94d, 0x6fdc8c][cv % 3], 0.4, 0, { transparent: true, opacity: 0.9 }), 22.04 + md * 0.3 + (cv % 2) * 0.12, 0.955, -2.13 + Math.floor(cv / 2) * 0.13, { cast: false, sharp: true }); }
      /* along the right wall: a fume hood and a bench of glassware */
      bb(1.8, 0.9, 0.7, white, 22.9, 0.45, -5.4, { solid: true, tag: 'zone' }); bb(1.84, 0.04, 0.74, MAT.counterTop, 22.9, 0.92, -5.4, { cast: false }); bb(1.8, 1.3, 0.06, white, 22.9, 1.6, -5.72); [-0.88, 0.88].forEach(function (sx) { bb(0.05, 1.3, 0.7, white, 22.9 + sx, 1.6, -5.4); }); bb(1.8, 0.2, 0.7, white, 22.9, 2.3, -5.4); bb(1.7, 0.6, 0.02, glassM, 22.9, 1.9, -5.06, { cast: false }); bb(0.4, 0.5, 0.4, gm, 22.9, 2.65, -5.4);
      [[22.4, 0.06, 0.16, 0x7cc4ff], [22.7, 0.045, 0.12, 0x6fdc8c], [23.0, 0.07, 0.2, 0xf0b94d], [23.3, 0.05, 0.1, 0xff6b5e]].forEach(function (f) { cyl(f[1], f[1] * 1.1, f[2], glassM, f[0], Y + 0.94 + f[2] / 2, -5.35, null, 16); cyl(f[1] * 0.9, f[1], f[2] * 0.55, colorMat(f[3], 0.2, 0, { transparent: true, opacity: 0.75 }), f[0], Y + 0.945 + f[2] * 0.275, -5.35, null, 14); });
      bb(2.2, 0.85, 0.7, ss, 15.6, 0.425, 0.9, { solid: true, tag: 'zone' }); bb(2.24, 0.04, 0.74, ss, 15.6, 0.87, 0.9, { cast: false }); for (var jr = 0; jr < 6; jr++) { cyl(0.06, 0.06, 0.14, MAT.jar, 14.8 + jr * 0.3, Y + 0.96, 1.0, null, 16); cyl(0.05, 0.05, 0.09, colorMat([0xd9a23a, 0x8a5a2a, 0xd9a23a, 0x6a3a1a, 0xe8c27a, 0x8a5a2a][jr], 0.4), 14.8 + jr * 0.3, Y + 0.94, 1.0, null, 12); cyl(0.062, 0.062, 0.015, MAT.jarLid, 14.8 + jr * 0.3, Y + 1.04, 1.0, null, 16); }
      bb(0.34, 0.4, 0.06, colorMat(0x2fa84f, 0.6), 14.2, 1.7, -2.0); signPlane(['EYE WASH'], 0.3, 0.1, 14.17, Y + 2.0, -2.0, Math.PI / 2, { size: 20, bg: '#2fa84f', color: '#fff', titleColor: '#fff', line: 'rgba(255,255,255,.6)' });
      bb(0.4, 0.02, 0.4, MAT.black, 19.5, 0.012, -1.5, { cast: false, sharp: true }); for (var dg = 0; dg < 5; dg++) bb(0.34, 0.006, 0.03, gm, 19.5, 0.024, -1.64 + dg * 0.07, { cast: false, sharp: true });
    })();
    // the roof: ladder in the flat, a greenhouse with six beds, a parapet
    var ghN0 = world.group.children.length;   /* the ladder, the roof hatch, the glasshouse and its beds belong to the Roof Greenhouse DLC: kept in exp.ghParts */
    var RY = ROOF_Y; for (var lr = 0; lr < 9; lr++) upBox(0.5, 0.03, 0.03, steel, -11.78, 0.3 + lr * 0.34, -3.0); [-0.25, 0.25].forEach(function (o) { upBox(0.04, 3.2, 0.04, steel, -11.78, 1.6, -3.0 + o); }); hit(0.7, 3.0, 0.9, -11.6, UP.y + 1.5, -3.0, { kind: 'roofUp', dlc: 'greenhouse' }); signPlane(['ROOF ↑', 'greenhouse'], 0.7, 0.26, -11.88, UP.y + 2.75, -2.0, Math.PI / 2, { titleColor: '#8fd17a' });
    var ghParts = world.group.children.slice(ghN0);
    [[0, -ROOM.z + 0.1, ROOM.x * 2, 0.2], [0, ROOM.z - 0.1, ROOM.x * 2, 0.2], [-ROOM.x + 0.1, 0, 0.2, ROOM.z * 2], [ROOM.x - 0.1, 0, 0.2, ROOM.z * 2]].forEach(function (pw) { box(pw[2], 0.9, pw[3], MAT.brick, pw[0], RY + 0.45, pw[1]); });   /* the parapet is the building's own */
    var ghN1 = world.group.children.length;
    box(0.9, 0.08, 0.9, dark, -10.6, RY + 0.04, -3.0, { cast: false }); hit(1.0, 1.0, 1.0, -10.6, RY + 0.4, -3.0, { kind: 'roofDown', dlc: 'greenhouse' });
    var GH = { x1: -4, x2: 8, z1: -6, z2: 3 }; [[GH.x1, GH.z1], [GH.x2, GH.z1], [GH.x1, GH.z2], [GH.x2, GH.z2], [2, GH.z1], [2, GH.z2]].forEach(function (p) { box(0.08, 2.6, 0.08, MAT.white, p[0], RY + 1.3, p[1]); }); box(GH.x2 - GH.x1, 2.4, 0.03, glassM, 2, RY + 1.3, GH.z1, { cast: false }); box(0.03, 2.4, GH.z2 - GH.z1, glassM, GH.x1, RY + 1.3, -1.5, { cast: false }); box(0.03, 2.4, GH.z2 - GH.z1, glassM, GH.x2, RY + 1.3, -1.5, { cast: false }); var rf1 = box(GH.x2 - GH.x1 + 0.3, 0.04, 5.0, glassM, 2, RY + 3.2, -3.7, { cast: false }); rf1.rotation.x = 0.28; var rf2 = box(GH.x2 - GH.x1 + 0.3, 0.04, 5.0, glassM, 2, RY + 3.2, 0.7, { cast: false }); rf2.rotation.x = -0.28;
    xs().roof.forEach(function (b, i) { var bx = -2.4 + (i % 3) * 4.0, bz = i < 3 ? -4.2 : 0.6; box(2.8, 0.45, 1.4, MAT.darkwood, bx, RY + 0.225, bz); box(2.6, 0.04, 1.2, colorMat(0x3a2a1c, 1), bx, RY + 0.46, bz, { cast: false }); world.obstacles.push({ x1: bx - 1.4, x2: bx + 1.4, z1: bz - 0.7, z2: bz + 0.7, tag: 'roofbed', floorLevel: 2 });
      var pg = new THREE.Group(); pg.position.set(bx, RY + 0.47, bz); world.group.add(pg); for (var pl = 0; pl < 5; pl++) { var fig = plantFigure(STRAINS[(i + pl) % Math.min(5, STRAINS.length)]); fig.position.set(-1.0 + pl * 0.5, 0, ((pl * 7) % 3 - 1) * 0.12); fig.rotation.y = pl * 1.9; fig.userData.set(0.95, 1.35); pg.add(fig); } pg.visible = false;
      [-0.62, 0.62].forEach(function (dz) { var dl = cyl(0.012, 0.012, 2.6, MAT.black, bx, RY + 0.5, bz + dz * 0.5, null, 8); dl.rotation.z = Math.PI / 2; }); [[-1.36, -0.66], [1.36, -0.66], [-1.36, 0.66], [1.36, 0.66]].forEach(function (c4) { box(0.09, 0.5, 0.09, MAT.wood, bx + c4[0], RY + 0.25, bz + c4[1]); }); exp.roofBeds.push(pg); hit(2.9, 1.6, 1.5, bx, RY + 0.8, bz, { kind: 'roofBed', idx: i, dlc: 'greenhouse' }); });
    (function greenhouseDetail() {
      var alu = MAT.alu, GW = GH.x2 - GH.x1, GD = GH.z2 - GH.z1, cx = 2, cz = -1.5;
      [0.02, 1.25, 2.5].forEach(function (y) { box(GW, 0.05, 0.05, alu, cx, RY + y, GH.z1, { sharp: true }); box(GW, 0.05, 0.05, alu, cx, RY + y, GH.z2, { sharp: true }); box(0.05, 0.05, GD, alu, GH.x1, RY + y, cz, { sharp: true }); box(0.05, 0.05, GD, alu, GH.x2, RY + y, cz, { sharp: true }); });
      for (var m = 1; m < 6; m++) { var mx = GH.x1 + m * GW / 6; box(0.04, 2.5, 0.04, alu, mx, RY + 1.25, GH.z1, { sharp: true }); if (Math.abs(mx - 2) > 1) box(0.04, 2.5, 0.04, alu, mx, RY + 1.25, GH.z2, { sharp: true }); var r1 = box(0.04, 0.04, 4.9, alu, mx, RY + 3.2, -3.7, { sharp: true }); r1.rotation.x = 0.28; var r2 = box(0.04, 0.04, 4.9, alu, mx, RY + 3.2, 0.7, { sharp: true }); r2.rotation.x = -0.28; }
      for (var n = 1; n < 4; n++) { var nz = GH.z1 + n * GD / 4; box(0.04, 2.5, 0.04, alu, GH.x1, RY + 1.25, nz, { sharp: true }); box(0.04, 2.5, 0.04, alu, GH.x2, RY + 1.25, nz, { sharp: true }); }
      box(GW + 0.4, 0.08, 0.08, alu, cx, RY + 3.88, cz, { sharp: true }); box(1.9, 0.06, 0.06, alu, 2, RY + 2.1, GH.z2, { sharp: true }); [1.05, 2.95].forEach(function (x) { box(0.06, 2.1, 0.06, alu, x, RY + 1.05, GH.z2, { sharp: true }); });
      box(GW - 0.4, 0.02, 1.0, colorMat(0x8d8a80, 1), cx, RY + 0.012, -1.8, { cast: false, sharp: true });   /* a gravel walk between the two rows of beds */
      box(1.6, 0.05, 0.6, MAT.wood, 6.9, RY + 0.9, 2.5); legs4({ box: function (w, h, d, mt, x, y, z) { return box(w, h, d, mt, x + 6.9, RY + y, z + 2.5); } }, 1.6, 0.6, 0.88, MAT.wood, 0.06, 0.06); box(1.5, 0.03, 0.5, MAT.wood, 6.9, RY + 0.3, 2.5, { cast: false });
      [[6.4, 0.12], [6.75, 0.1], [7.1, 0.12], [7.4, 0.09]].forEach(function (p) { cyl(p[1], p[1] * 0.75, p[1] * 1.3, MAT.pot, p[0], RY + 0.925 + p[1] * 0.65, 2.5, null, 18); }); box(0.36, 0.22, 0.26, colorMat(0x5a3a22, 1), 6.6, RY + 0.43, 2.5); cyl(0.11, 0.13, 0.26, colorMat(0x3a8fd6, 0.45, 0.35), 7.3, RY + 0.45, 2.5, null, 18);
      var hp = cyl(0.025, 0.025, GW - 0.6, colorMat(0x2f6fb0, 0.4, 0.1), cx, RY + 2.4, GH.z1 + 0.2, null, 8); hp.rotation.z = Math.PI / 2; for (var sp = 0; sp < 6; sp++) cyl(0.02, 0.006, 0.08, MAT.brass, GH.x1 + 1 + sp * 2, RY + 2.34, GH.z1 + 0.2, null, 8);
      var fanR = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.03, 8, 28), MAT.gunmetal); fanR.position.set(GH.x2 - 0.02, RY + 1.9, -4.5); fanR.rotation.y = Math.PI / 2; world.group.add(fanR); for (var fbk = 0; fbk < 4; fbk++) { var fb2 = box(0.02, 0.56, 0.1, MAT.alu, GH.x2 - 0.02, RY + 1.9, -4.5, { sharp: true, cast: false }); fb2.rotation.x = fbk * Math.PI / 4; }
      signPlane(['ROOF GREENHOUSE', 'six beds · daylight only'], 1.6, 0.34, 2, RY + 2.75, GH.z2 + 0.04, 0, { titleColor: '#8fd17a' });
    })();
    exp.ghParts = ghParts.concat(world.group.children.slice(ghN1));
    (function roofKit() {   /* what is on any flat roof: a water tank, two condensers, vent cowls, a roof light, a dish */
      var RYk = ROOF_Y, gm = MAT.gunmetal;
      cyl(0.9, 0.9, 1.5, colorMat(0x8d949c, 0.45, 0.6), -9.5, RYk + 1.15, 5.5, null, 28); cyl(0.95, 0.2, 0.4, colorMat(0x767d85, 0.45, 0.6), -9.5, RYk + 2.1, 5.5, null, 28); [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]].forEach(function (l) { box(0.1, 0.4, 0.1, gm, -9.5 + l[0], RYk + 0.2, 5.5 + l[1], { sharp: true }); }); world.obstacles.push({ x1: -10.5, x2: -8.5, z1: 4.5, z2: 6.5, tag: 'roofkit', floorLevel: 2 });
      [[9.8, 6.4], [9.8, 4.9]].forEach(function (p) { box(1.0, 0.8, 0.7, colorMat(0xd0d4d8, 0.5, 0.3), p[0], RYk + 0.5, p[1], { r: 0.02 }); box(0.9, 0.1, 0.6, gm, p[0], RYk + 0.05, p[1], { sharp: true, cast: false }); var gr = cyl(0.26, 0.26, 0.03, MAT.black, p[0], RYk + 0.91, p[1], null, 24); for (var s = 0; s < 3; s++) { var bl = box(0.46, 0.006, 0.05, gm, p[0], RYk + 0.93, p[1], { sharp: true, cast: false }); bl.rotation.y = s * Math.PI / 3; } world.obstacles.push({ x1: p[0] - 0.5, x2: p[0] + 0.5, z1: p[1] - 0.35, z2: p[1] + 0.35, tag: 'roofkit', floorLevel: 2 }); });
      [[-7, -7], [10, -7.5], [-10.5, -6.5]].forEach(function (p) { cyl(0.14, 0.14, 0.5, colorMat(0xb9bec4, 0.4, 0.7), p[0], RYk + 0.25, p[1], null, 16); var cw = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), colorMat(0xb9bec4, 0.4, 0.7)); cw.scale.y = 0.6; cw.position.set(p[0], RYk + 0.55, p[1]); world.group.add(cw); });
      box(1.8, 0.3, 1.2, MAT.trim, -7.5, RYk + 0.15, 1.5); var rl = box(1.6, 0.05, 1.0, MAT.glass, -7.5, RYk + 0.36, 1.5, { cast: false }); rl.rotation.z = 0.12; world.obstacles.push({ x1: -8.4, x2: -6.6, z1: 0.9, z2: 2.1, tag: 'roofkit', floorLevel: 2 });
      cyl(0.03, 0.03, 0.9, gm, 10.6, RYk + 0.45, -2, null, 8); var dish = new THREE.Mesh(new THREE.SphereGeometry(0.45, 20, 8, 0, Math.PI * 2, 0, Math.PI / 3.2), colorMat(0xe8e8ee, 0.4, 0.2, { side: THREE.DoubleSide })); dish.position.set(10.6, RYk + 1.1, -2); dish.rotation.set(-2.2, 0, 0.4); world.group.add(dish);
    })();
    // owner's garage over the bay, the generator by the back wall, the staff roster in the office
    [[5.5, -14.0], [9.9, -14.0], [5.5, -16.6], [9.9, -16.6]].forEach(function (p) { box(0.1, 2.6, 0.1, dark, p[0], 1.3, p[1]); }); box(4.8, 0.1, 3.0, colorMat(0x5f666e, 0.5, 0.6), 7.7, 2.65, -15.3, { cast: true }); signPlane(['GARAGE'], 1.2, 0.3, 7.7, 2.45, -13.95, 0, { size: 40, titleColor: '#f2c21a', bg: '#101410' });
    box(1.4, 1.0, 0.8, colorMat(0xf2c21a, 0.6, 0.3), 0.2, 0.5, -13.2, { solid: true, tag: 'gen' }); box(1.2, 0.3, 0.6, dark, 0.2, 1.15, -13.2); cyl(0.05, 0.05, 0.9, dark, 0.7, 1.7, -13.2, null, 8); exp.genLed = box(0.08, 0.08, 0.02, emitMat(0xff3030, 0.4), -0.3, 0.8, -12.79, { cast: false }); hit(1.5, 1.5, 1.0, 0.2, 0.75, -13.1, { kind: 'generator' });
    fixtureFromBuild('keyHook', 'key hook', -Math.PI / 2, function () {
      var brass = colorMat(0xc9a24a, 0.35, 0.8), board = colorMat(0x6b4a2a, 0.8), hx = -4.13;
      box(0.03, 0.2, 0.26, board, hx, 1.5, -0.4, { cast: false });
      [-0.07, 0.07].forEach(function (dz) { var pin = cyl(0.008, 0.008, 0.05, brass, hx - 0.025, 1.48, -0.4 + dz, null, 8); pin.rotation.z = Math.PI / 2; cyl(0.012, 0.012, 0.012, brass, hx - 0.05, 1.465, -0.4 + dz, null, 8).rotation.z = Math.PI / 2; });
      signPlane(['KEYS'], 0.2, 0.05, hx - 0.016, 1.575, -0.4, -Math.PI / 2, { size: 24, bg: '#6b4a2a', titleColor: '#e8c27a', line: 'rgba(0,0,0,0)' });
      var ring = new THREE.Group(); ring.position.set(hx - 0.05, 0, -0.47); world.group.add(ring); world.keyRing = ring;
      var loop = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.004, 8, 16), brass); loop.position.y = 1.45; loop.rotation.y = Math.PI / 2; ring.add(loop);
      for (var k = 0; k < 3; k++) { var b = new THREE.Mesh(bevelGeo(0.003, 0.045, 0.01), k === 1 ? colorMat(0x9aa0a6, 0.4, 0.7) : brass); b.position.set(0, 1.405, -0.015 + k * 0.015); ring.add(b); }
      var hit = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42, 0.42), MAT.none); hit.position.set(hx - 0.1, 1.48, -0.42); world.group.add(hit); interactable(hit, { kind: 'keyHook' });
    });
    fixtureFromBuild('roster', 'staff roster', -Math.PI / 2, function () { box(0.04, 1.0, 1.2, colorMat(0x8a6a3a, 0.9), -4.13, 1.7, 2.35, { cast: false }); signPlane(['STAFF ROSTER', 'driver · operator · night guard · technician'], 1.1, 0.36, -4.16, 1.95, 2.35, -Math.PI / 2, { size: 24 }); hit(0.4, 1.2, 1.3, -4.25, 1.7, 2.35, { kind: 'roster' }); });   /* on the office side of the hall wall, clear of the dashboard */
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
  function outdoors() { if ((menuDrive && menuDrive.on) || drive.on || player.floor === 2) return true; if (player.floor !== 0) return false; var x = player.pos.x, z = player.pos.z; return Math.abs(x) > ROOM.x + 0.3 || z > ROOM.z + 0.2 || z < -12.6 || (z < -ROOM.z - 0.2 && (x < -0.2 || x > SEC.x2 + 0.2)); }
  function updateExpansion(dt) {
    var X = xs(), W = X.weather;
    // weather and seasonLabel
    if (WSFEST.snow && W.kind !== 'snow') { W.kind = 'snow'; W.until = now() + 3600000; exp.wxKind = 'snow'; }   /* a seasonal pack keeps the snow falling */
    if (now() > W.until) { var se = seasonLabel(), r = Math.random(); W.kind = se === 'Winter' ? (r < 0.45 ? 'snow' : r < 0.6 ? 'clear' : 'clear') : r < (se === 'Autumn' ? 0.4 : 0.22) ? 'rain' : r < (se === 'Summer' ? 0.3 : 0.45) && se !== 'Spring' ? 'storm' : 'clear'; W.until = now() + randi(150, 320) * 1000; if (exp.wxKind && exp.wxKind !== W.kind) toast({ clear: '🌤️ It\'s clearing up', rain: '🌧️ It\'s started to rain, so fewer people are out', storm: '⛈️ A storm is rolling in and the street is emptying', snow: '❄️ It\'s snowing' }[W.kind], ''); exp.wxKind = W.kind; }
    var wet = W.kind !== 'clear', show = wet && outdoors(); exp.wx.visible = show; exp.wxMix = lerp(exp.wxMix || 0, show && W.kind === 'snow' ? 1 : 0, 0.04);   /* how much of the snow look applies: eased, and only out of doors */
    var fogN = show ? (W.kind === 'storm' ? 14 : W.kind === 'rain' ? 20 : 30) : 30;   /* indoors keeps the clear-weather fog: shutting the door should not fog the room */
    var fogF = show ? (W.kind === 'storm' ? 55 : W.kind === 'rain' ? 80 : 120) : 110;   /* the flakes carry the snow; the fog must not white out every texture in town */
    scene.fog.near = lerp(scene.fog.near, fogN, 0.02); scene.fog.far = lerp(scene.fog.far, fogF, 0.02);
    if (show) { var fall = W.kind === 'snow' ? 1.6 : 15, arr = exp.wx.geometry.attributes.position; for (var i = 0; i < arr.count; i++) { var y = arr.getY(i) - fall * dt; if (y < 0) y += 16; arr.setY(i, y); if (W.kind === 'snow') arr.setX(i, arr.getX(i) + Math.sin(y * 2 + i) * dt * 0.4); } arr.needsUpdate = true; exp.wx.position.set(camera.position.x, camera.position.y - 6, camera.position.z); exp.wx.material.size = W.kind === 'snow' ? 0.14 : 0.07; exp.wx.material.opacity = W.kind === 'snow' ? 0.9 : 0.55; }
    // fireworks over the town after dark, from a seasonal pack
    if (WSFEST.fireworks) { exp.fwT = (exp.fwT || 0) - dt; if (exp.fwT <= 0) { exp.fwT = randf(2.4, 6.5); if (nightNow() && outdoors()) { var fx2 = camera.position.x + randf(-55, 55), fz2 = camera.position.z + randf(-55, 55); spark(fx2, randf(16, 30), fz2, [0xff6b6b, 0xffc857, 0x6fdc8c, 0x7fd4ff, 0xff9ad2][randi(0, 4)], 46, 'up'); sfx('gunshot'); } } }
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
    if (nightNow() && !X.staff.night && Math.random() < dt / 700) { var T2 = tob(), tot = CIG_KEYS.reduce(function (a, k) { return a + T2.packs[k]; }, 0), beds = X.roof.filter(function (b) { return b.stage === 'ready'; }); if (tot > 20) { CIG_KEYS.forEach(function (k) { T2.packs[k] = Math.floor(T2.packs[k] * 0.7); }); syncTobRack(); sfx('bad'); toast('🌙 Break-in. Someone got into the basement and took cartons off the finished goods rack', 'bad'); logEvent('🌙 Night break-in: about ' + Math.round(tot * 0.3) + ' packs gone from the basement. A night guard would have stopped it.', 'bad'); S.stats.breakins = (S.stats.breakins || 0) + 1; } else if (beds.length) { beds[0].stage = 'empty'; beds[0].t = 0; toast('🌙 Someone climbed up and stripped a roof bed', 'bad'); logEvent('🌙 A ready roof bed was stripped overnight', 'bad'); S.stats.breakins = (S.stats.breakins || 0) + 1; } }
    updateJobs(dt);
    // the getaway car: catch it with yours and the loot comes back
    var G = exp.getaway; if (G) { G.t += dt; G.g.position.x += G.dir * 13 * dt; if (drive.on && Math.hypot(drive.g.position.x - G.g.position.x, drive.g.position.z - G.g.position.z) < (X.garage.bar ? 4.6 : 3.4)) { returnLoot(G.loot); S.rep += 4; sfx('hit'); toast('💥 You ran the getaway car off the road. Everything they took is back (rep +4)', 'good'); logEvent('🚗 You caught the getaway car', 'good'); world.group.remove(G.g); dropTree(G.g); exp.getaway = null; } else if (Math.abs(G.g.position.x) > CITY.x - 3 || G.t > 40) { logEvent('💨 The getaway car made it out of town with ' + (G.loot.grabbed > 0 ? money(G.loot.grabbed) : 'your goods'), 'bad'); world.group.remove(G.g); dropTree(G.g); exp.getaway = null; } }
  }
  // Called once the world is built, and by the tests after they switch a DLC: its props rebuild (hidden or back), the
  // roof greenhouse and its ladder come and go. The Workshop reloads the page when you apply, so in play it runs at boot.
  function applyDlcWorld(rebuild) {
    var gh = dlcOn('greenhouse'); (exp.ghParts || []).forEach(function (o) { if (exp.roofBeds.indexOf(o) < 0) o.visible = gh; });
    if (!gh) exp.roofBeds.forEach(function (g) { g.visible = false; }); else roofTick(0, true);
    if (rebuild) Object.keys(PROP_DLC).forEach(function (id) { if (propInst[id]) growBuildProp(id); });
  }
  function labTick(dt) {   // a lab batch runs down its timer; the caller decides whether there is power
    if (!dlcOn('lab')) return;   /* switched off: a running batch waits */
    var X = xs(), J = X.lab.job; if (J) { J.t += dt; if (J.t >= J.dur) { labShelve(J); X.lab.job = null; sfx('ok'); toast('🧪 Lab batch done: ' + J.n + ' × ' + CIG_SKUS[J.sku].name + ' waiting on the lab shelf', 'good'); save(); } }
  }
  function roofTick(dt, catchUp) {   // catchUp: time already scaled for the daylight share, so the hour it happens to be now does not matter
    var X = xs(), W = X.weather, gh = dlcOn('greenhouse');   /* switched off: the beds wait as they are */
    X.roof.forEach(function (b, i) { if (gh && b.stage === 'grow' && (catchUp || !nightNow())) { b.t += dt * (W.kind === 'rain' || roofWatered() ? 1.5 : 1) * (seasonLabel() === 'Winter' ? 0.5 : 1); if (b.t >= 260) { b.stage = 'ready'; toast('🌿 Roof bed ' + (i + 1) + ' is ready', 'good'); } } var g = exp.roofBeds[i]; if (g) { g.visible = gh && b.stage !== 'empty'; var sc = b.stage === 'ready' ? 1 : 0.1 + clamp(b.t / 260, 0, 1) * 0.9; g.scale.set(1, sc, 1); } });
  }
