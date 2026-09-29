//@ DLC: the Out-of-town Farm. A fenced field past the west avenue: five rows under the open sky, a barn to dry in, and the drive home with the crop
  // ── DLC: the Out-of-town Farm ──
  var FARM = { x1: -116, x2: -72, z1: -62.5, z2: -46.5, lease: 2500, rent: 40, rows: 5, per: 8, seeds: 6, sun: 0.6, dryS: 300, gateX: -78, rowZ: [-49.6, -52.3, -55.0, -57.7, -60.4], rowX1: -112, rowX2: -84, barn: { x: -76.4, z: -56.2, w: 6.4, d: 8.6 }, home: { x: 9, z: -16 } };
  var farm = { g: null, rows: [], gate: null, gateObs: null, barnDyn: null, syncT: 0 };
  function farmState() { var F = dlcState('farm', { leased: false, rows: [], barn: [], boot: [] }); while (F.rows.length < FARM.rows) F.rows.push(null); return F; }
  function farmSeason() { return season() !== 'Winter'; }
  function farmReserve() { CITY.parks.push({ x1: FARM.x1 - 1, x2: FARM.x2 + 1, z1: FARM.z1 - 1, z2: FARM.z2 + 1, farm: true }); }   /* before the town fills its blocks, so nobody builds a terrace on the field */
  function farmAt(x, z) { for (var i = 0; i < CITY.parks.length; i++) { var p = CITY.parks[i]; if (p.farm && x > p.x1 - 1.5 && x < p.x2 + 1.5 && z > p.z1 - 1.5 && z < p.z2 + 4.5) return true; } return false; }   /* the field, its fence and the verge in front of its gate */
  function farmYield(st, q) { return Math.round(st.yield * 0.55 * (0.6 + q / 160) * FARM.per * 10) / 10; }
  function farmSow(i, id) {
    var F = farmState(), st = strainById(id); if (F.rows[i]) return; if (!farmSeason()) { toast('Nothing goes in the ground in winter', 'bad'); return; }
    if ((S.supplies['seed_' + id] || 0) < FARM.seeds) { toast('A row takes ' + FARM.seeds + ' seeds of one strain', 'bad'); return; }
    S.supplies['seed_' + id] -= FARM.seeds; dirtySupply('seed'); F.rows[i] = { strain: id, progress: 0, quality: 50, water: 1 }; sfx('harvest'); gainXp(6);
    toast('🚜 Row ' + (i + 1) + ' is sown with ' + st.name + '. Rain waters it; in a dry spell, you do.', 'good'); logEvent('🚜 Sowed row ' + (i + 1) + ' of the field with ' + st.name, ''); farmSync();
  }
  function farmHarvest(i) {
    var F = farmState(), r = F.rows[i]; if (!r || r.progress < 1) return; var st = strainById(r.strain), q = clamp(r.quality, 25, 70), g = farmYield(st, q);
    F.rows[i] = null; F.barn.push({ strain: st.id, grams: g, q: Math.round(q), thc: st.thc, t: 0 }); S.stats.harvested += g; gainXp(Math.round(g / 4)); sfx('harvest');
    toast('🚜 Cut row ' + (i + 1) + ': ' + gram(g) + ' of ' + st.name + ' is hanging in the barn.', 'good'); logEvent('🚜 Harvested row ' + (i + 1) + ' of the field: ' + gram(g) + ' of ' + st.name + ' (quality ' + Math.round(q) + ')', 'good'); farmSync();
  }
  function farmVehicleNear(x, z, r) { return !!(drive.g && Math.hypot(drive.g.position.x - x, drive.g.position.z - z) < r); }
  function farmLoad() {
    var F = farmState(), dry = F.barn.filter(function (l) { return l.t >= FARM.dryS; }); if (!dry.length) { toast('Nothing in the barn is dry yet', ''); return; }
    if (!farmVehicleNear(FARM.barn.x - 5, FARM.barn.z, 16)) { toast('Bring the car or the van up to the barn first', 'bad'); return; }
    var g = 0; dry.forEach(function (l) { g += l.grams; F.boot.push({ strain: l.strain, grams: l.grams, q: l.q, thc: l.thc }); }); F.barn = F.barn.filter(function (l) { return l.t < FARM.dryS; }); sfx('putdown');
    toast('🚜 Loaded ' + gram(g) + ' of dried crop. Drive it home: it goes into the stash when you park in the yard.', 'good'); farmSync();
  }
  function farmRowMenu(i) {
    var F = farmState(), r = F.rows[i], lines = [];
    if (!r) {
      if (!farmSeason()) { ctxOpen('🚜 Row ' + (i + 1), 'empty', [{ label: 'It is winter. The ground is too cold to sow until spring.', cls: 'muted' }]); return; }
      var have = strainsWithSeed(FARM.seeds); if (!have.length) lines.push({ label: 'You need ' + FARM.seeds + ' seeds of one strain on the supply rack to sow a row.', cls: 'muted' });
      have.forEach(function (st) { lines.push({ label: st.emoji + ' Sow ' + esc(st.name) + ' <small>' + FARM.seeds + ' of your ' + S.supplies['seed_' + st.id] + ' seeds · about ' + gram(farmYield(st, 52)) + ' a row</small>', act: function () { farmSow(i, st.id); } }); });
      ctxOpen('🚜 Row ' + (i + 1), 'empty · ' + FARM.per + ' plants to a row', lines); return;
    }
    var st = strainById(r.strain);
    lines.push({ label: 'Grown <b>' + Math.round(r.progress * 100) + '%</b> <small>' + (farmSeason() ? 'it grows in daylight' : 'nothing grows in winter') + '</small>', cls: r.progress >= 1 ? 'on' : '' });
    lines.push({ label: 'Soil <b>' + (r.water > 0.6 ? 'damp' : r.water > 0.15 ? 'drying' : 'bone dry') + '</b> <small>quality ' + Math.round(r.quality) + '</small>', cls: r.water <= 0.15 ? 'bad' : '' });
    if (r.progress >= 1) lines.push({ label: '✂️ Harvest the row <small>about ' + gram(farmYield(st, r.quality)) + ', into the barn to dry</small>', act: function () { farmHarvest(i); } });
    else if (r.water < 0.7) lines.push({ label: '💧 Water the row <small>from the tank by the gate</small>', act: function () { r.water = 1; sfx('pour'); toast('💧 Row ' + (i + 1) + ' watered', 'good'); } });
    lines.push({ label: '🗑️ Plough it in <small>the row is freed, the crop is lost</small>', act: function () { F.rows[i] = null; farmSync(); toast('Row ' + (i + 1) + ' ploughed in', ''); } });
    ctxOpen(st.emoji + ' Row ' + (i + 1) + ': ' + esc(st.name), FARM.per + ' plants', lines);
  }
  function farmBarnMenu() {
    var F = farmState(), lines = [], dryG = 0;
    if (!F.barn.length) lines.push({ label: 'Nothing is hanging. A harvested row dries in here for about ' + Math.round(FARM.dryS / 60) + ' min.', cls: 'muted' });
    F.barn.forEach(function (l) { var st = strainById(l.strain), done = l.t >= FARM.dryS; if (done) dryG += l.grams; lines.push({ label: st.emoji + ' ' + esc(st.name) + ' <b>' + gram(l.grams) + '</b> <small>quality ' + l.q + ' · ' + (done ? 'dry' : 'dry in ' + minsLeft(FARM.dryS - l.t)) + '</small>', cls: done ? 'on' : '' }); });
    if (dryG) lines.push({ label: '📦 Load ' + gram(dryG) + ' into the boot <small>the car or the van has to be at the barn</small>', act: farmLoad });
    if (F.boot.length) lines.push({ label: gram(F.boot.reduce(function (a, l) { return a + l.grams; }, 0)) + ' is in the boot. It goes into the stash when you park in the yard.', cls: 'muted' });
    ctxOpen('🛖 The drying barn', 'field bud dries on the rafters', lines);
  }
  function farmSync() {   // the rows and the barn, drawn from the save
    if (!farm.g) return; var F = farmState();
    farm.rows.forEach(function (R, i) { clearKids(R.dyn); R.figs = []; var r = F.rows[i]; if (!r) return; var st = strainById(r.strain); for (var k = 0; k < FARM.per; k++) { var f = plantFigure(st); f.position.set(FARM.rowX1 + 1.5 + k * (FARM.rowX2 - FARM.rowX1 - 3) / (FARM.per - 1), 0.12, FARM.rowZ[i] + ((k * 7) % 3 - 1) * 0.08); f.rotation.y = k * 1.7; f.userData.set(r.progress, 1.5); R.dyn.add(f); R.figs.push(f); } });
    if (farm.barnDyn) { clearKids(farm.barnDyn); F.barn.slice(0, 6).forEach(function (l, i) { var st = strainById(l.strain), bm = MAT.bud.clone(); bm.color.setHex(st.bud).multiplyScalar(l.t >= FARM.dryS ? 0.7 : 1); for (var k = 0; k < 5; k++) { var b = new THREE.Mesh(BUD_GEO, bm); b.scale.set(2.2, 4.5, 2.2); b.position.set(FARM.barn.x - 2.2 + k * 1.1, 2.35 - (k % 2) * 0.1, FARM.barn.z - 3 + i * 1.2); b.castShadow = true; farm.barnDyn.add(b); } }); }
    if (farm.gate) { var open = F.leased; farm.gate.rotation.y = open ? 1.45 : 0;   /* it swings into the field, never out over the road */ if (farm.sign && farm.signFor !== open) { farm.signFor = open; var old = farm.sign.material.map; farm.sign.material.map = textTex(['GROW CO. FARM', open ? 'five rows · open sky' : 'field to let · ask at the gate'], 660, 270, { size: 58, titleColor: '#f0b94d' }); farm.sign.material.needsUpdate = true; if (old) old.dispose(); } world.obstacles = world.obstacles.filter(function (o) { return o.tag !== 'farmgate'; }); if (!open) world.obstacles.push({ x1: FARM.gateX - 2, x2: FARM.gateX + 2, z1: FARM.z2 - 0.2, z2: FARM.z2 + 0.2, tag: 'farmgate', floorLevel: 0 }); }
  }
  function buildFarm() {
    var F = farmState(), g = new THREE.Group(); world.group.add(g); farm.g = g; farm.rows = [];
    function P(o) { return Object.assign({ parent: g }, o || {}); }
    var w = FARM.x2 - FARM.x1, d = FARM.z2 - FARM.z1, cx = (FARM.x1 + FARM.x2) / 2, cz = (FARM.z1 + FARM.z2) / 2;
    var turfM = MAT.grass.clone(); turfM.map = TEX.grass.clone(); turfM.map.needsUpdate = true; turfM.map.repeat.set(w / 5, d / 5); turfM.color.setHex(0xc9d8a6);
    var turf = new THREE.Mesh(new THREE.PlaneGeometry(w, d), turfM); turf.rotation.x = -Math.PI / 2; turf.position.set(cx, 0.035, cz); turf.receiveShadow = true; g.add(turf);
    var soilM = MAT.soil.clone(); soilM.map = TEX.soil.clone(); soilM.map.needsUpdate = true; soilM.map.wrapS = soilM.map.wrapT = THREE.RepeatWrapping; soilM.map.repeat.set(24, 1.4);
    FARM.rowZ.forEach(function (z, i) {
      box(FARM.rowX2 - FARM.rowX1, 0.14, 1.3, soilM, (FARM.rowX1 + FARM.rowX2) / 2, 0.08, z, P({ sharp: true })); box(FARM.rowX2 - FARM.rowX1 - 0.4, 0.06, 0.7, soilM, (FARM.rowX1 + FARM.rowX2) / 2, 0.17, z, P({ sharp: true, cast: false }));
      var px = FARM.rowX2 + 1.4; box(0.08, 1.1, 0.08, MAT.wood, px, 0.55, z, P()); var pl = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.3), new THREE.MeshBasicMaterial({ map: textTex(['ROW ' + (i + 1)], 210, 150, { size: 60, bold: true, bg: '#f3e9cf', color: '#2a2210', titleColor: '#2a2210', line: 'rgba(0,0,0,.4)' }) })); pl.position.set(px + 0.045, 0.95, z); pl.rotation.y = Math.PI / 2; g.add(pl);
      var hit = box(1.4, 1.6, 1.8, MAT.none, px, 0.8, z, P({ cast: false, receive: false })); interactable(hit, { kind: 'farmRow', i: i });
      var dyn = new THREE.Group(); g.add(dyn); farm.rows.push({ dyn: dyn, figs: [] });
    });
    // the way in: a gravel track from the gate down the east side to the barn
    var gravel = colorMat(0xb9b09a, 1); box(3.2, 0.02, d - 1, gravel, FARM.gateX - 2.6, 0.05, cz, P({ cast: false, sharp: true })); box(6, 0.02, 3.2, gravel, FARM.gateX, 0.05, FARM.z2 - 1.8, P({ cast: false, sharp: true }));
    // post and rail all the way round, with a gap for the gate in the north side
    var rail = MAT.wood; function run(xa, za, xb, zb) { var len = Math.hypot(xb - xa, zb - za), n = Math.max(1, Math.round(len / 3)), along = xa !== xb; for (var k = 0; k <= n; k++) box(0.12, 1.25, 0.12, rail, xa + (xb - xa) * k / n, 0.62, za + (zb - za) * k / n, P()); [0.45, 0.95].forEach(function (y) { box(along ? len : 0.05, 0.1, along ? 0.05 : len, rail, (xa + xb) / 2, y, (za + zb) / 2, P({ sharp: true })); }); world.obstacles.push({ x1: Math.min(xa, xb) - 0.1, x2: Math.max(xa, xb) + 0.1, z1: Math.min(za, zb) - 0.1, z2: Math.max(za, zb) + 0.1, tag: 'city', floorLevel: 0 }); }
    run(FARM.x1, FARM.z1, FARM.x2, FARM.z1); run(FARM.x1, FARM.z1, FARM.x1, FARM.z2); run(FARM.x2, FARM.z1, FARM.x2, FARM.z2); run(FARM.x1, FARM.z2, FARM.gateX - 2, FARM.z2); run(FARM.gateX + 2, FARM.z2, FARM.x2, FARM.z2);
    var gate = new THREE.Group(); gate.position.set(FARM.gateX - 2, 0, FARM.z2); g.add(gate); farm.gate = gate; [0.3, 0.7, 1.1].forEach(function (y) { box(4, 0.08, 0.05, MAT.steel, 2, y, 0, { parent: gate, sharp: true }); }); [0.05, 2, 3.95].forEach(function (x) { box(0.07, 1.2, 0.07, MAT.steel, x, 0.65, 0, { parent: gate, sharp: true }); }); var brace = box(4.1, 0.06, 0.04, MAT.steel, 2, 0.7, 0, { parent: gate, sharp: true }); brace.rotation.z = 0.2;
    // the sign at the gate is where you take the lease
    box(0.14, 2.6, 0.14, MAT.darkwood, FARM.gateX + 3.2, 1.3, FARM.z2 + 0.6, P()); var sg = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.9), new THREE.MeshBasicMaterial({ map: textTex(['GROW CO. FARM', F.leased ? 'five rows · open sky' : 'field to let · ask at the gate'], 660, 270, { size: 58, titleColor: '#f0b94d' }), transparent: true })); sg.position.set(FARM.gateX + 3.2, 2.2, FARM.z2 + 0.69); g.add(sg); signBack(sg, 2.2, 0.9); farm.sign = sg; farm.signFor = F.leased;
    var gh = box(3, 2.6, 1.4, MAT.none, FARM.gateX + 3.2, 1.3, FARM.z2 + 0.7, P({ cast: false, receive: false })); interactable(gh, { kind: 'farmGate' });
    // the barn: boarded walls, a tin roof, a wide door in the end that faces the track
    var B = FARM.barn, board = colorMat(0x8a3a2a, 0.85), tin = colorMat(0x8d949c, 0.4, 0.7), trimM = colorMat(0xf2efe6, 0.6);
    box(B.w, 0.15, B.d, colorMat(0x6d6f6a, 0.9), B.x, 0.075, B.z, P({ sharp: true })); [[-1, 0], [1, 0]].forEach(function (s) { box(0.16, 3.2, B.d, board, B.x + s[0] * (B.w / 2 - 0.08), 1.6, B.z, P({ sharp: true })); }); box(B.w, 3.2, 0.16, board, B.x, 1.6, B.z - B.d / 2 + 0.08, P({ sharp: true }));
    [[-1, 1.2], [1, 1.2]].forEach(function (s) { box(1.3, 3.2, 0.16, board, B.x + s[0] * (B.w / 2 - 0.65), 1.6, B.z + B.d / 2 - 0.08, P({ sharp: true })); }); box(B.w - 2.6, 0.7, 0.16, board, B.x, 2.85, B.z + B.d / 2 - 0.08, P({ sharp: true }));
    for (var bb = 0; bb < 14; bb++) { box(0.03, 3.2, 0.02, colorMat(0x6a2a1e, 0.9), B.x - B.w / 2 - 0.01, 1.6, B.z - B.d / 2 + 0.3 + bb * 0.62, P({ sharp: true, cast: false })); }
    [-1, 1].forEach(function (s) { var rf = box(B.w / 2 + 0.55, 0.08, B.d + 0.8, tin, B.x + s * (B.w / 4 + 0.05), 3.95, B.z, P({ sharp: true })); rf.rotation.z = s * -0.5; }); box(0.3, 0.12, B.d + 0.8, tin, B.x, 4.82, B.z, P({ sharp: true }));
    [-1, 1].forEach(function (s) { var gg = new THREE.ConeGeometry((B.w / 2 + 0.05) / 0.7071, 1.6, 4, 1); gg.rotateY(Math.PI / 4); var gab = new THREE.Mesh(gg, board); gab.scale.set(1, 1, 0.04); gab.position.set(B.x, 4.0, B.z + s * (B.d / 2 - 0.1)); g.add(gab); });
    box(B.w - 2.7, 2.45, 0.08, trimM, B.x, 1.3, B.z + B.d / 2 + 0.02, P({ sharp: true })); [-0.6, 0.6].forEach(function (dx) { var x1 = box(1.7, 0.1, 0.03, board, B.x + dx, 1.3, B.z + B.d / 2 + 0.07, P({ sharp: true })); x1.rotation.z = dx > 0 ? 0.95 : -0.95; });
    for (var rr = 0; rr < 4; rr++) box(B.w - 0.4, 0.08, 0.08, MAT.wood, B.x, 2.75, B.z - 3 + rr * 2, P({ sharp: true }));
    world.obstacles.push({ x1: B.x - B.w / 2, x2: B.x + B.w / 2, z1: B.z - B.d / 2, z2: B.z + B.d / 2, tag: 'city', floorLevel: 0 });
    var bh = box(B.w - 2, 2.6, 1.6, MAT.none, B.x, 1.3, B.z + B.d / 2 + 0.8, P({ cast: false, receive: false })); interactable(bh, { kind: 'farmBarn' }); farm.barnDyn = new THREE.Group(); g.add(farm.barnDyn);
    // a water tank on a stand, a standpipe, a wheelbarrow and somebody to keep the crows off
    var tx = FARM.gateX - 5.6, tz = FARM.z2 - 2.2; [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]].forEach(function (l) { box(0.1, 1.5, 0.1, MAT.steel, tx + l[0], 0.75, tz + l[1], P({ sharp: true })); }); cyl(1.0, 1.0, 1.4, colorMat(0x2f5a3a, 0.5, 0.2), tx, 2.25, tz, g, 24); cyl(1.04, 1.04, 0.08, MAT.gunmetal, tx, 2.98, tz, g, 24); cyl(0.03, 0.03, 1.5, MAT.steel, tx + 1.2, 0.75, tz, g, 8); box(0.2, 0.06, 0.06, MAT.brass, tx + 1.3, 1.1, tz, P());
    world.obstacles.push({ x1: tx - 1, x2: tx + 1, z1: tz - 1, z2: tz + 1, tag: 'city', floorLevel: 0 });
    var sx = (FARM.rowX1 + FARM.rowX2) / 2, sz = (FARM.rowZ[1] + FARM.rowZ[2]) / 2; box(0.08, 2.0, 0.08, MAT.wood, sx, 1.0, sz, P()); box(1.4, 0.07, 0.07, MAT.wood, sx, 1.5, sz, P()); box(0.5, 0.6, 0.2, fabricMat(0x7a2f3a), sx, 1.3, sz, P({ r: 0.05 })); var hd = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 12), fabricMat(0xd9b46a)); hd.position.set(sx, 1.85, sz); g.add(hd); cyl(0.3, 0.3, 0.02, colorMat(0xb98a4a, 1), sx, 2.0, sz, g, 18); cyl(0.14, 0.17, 0.16, colorMat(0xb98a4a, 1), sx, 2.08, sz, g, 14);
    CITY.pois.push({ id: 'farm', name: 'Grow Co. Farm', x: FARM.gateX, z: FARM.z2, col: '#c9a24a' });
    farmSync();
  }
  dlcDefine({ id: 'farm', name: 'The Out-of-town Farm', kinds: ['farmGate', 'farmRow', 'farmBarn'],
    prompt: function (d) {
      var F = farmState(); if (d.kind === 'farmGate') return F.leased ? 'Grow Co. Farm <small>' + season() + ' · rent ' + money(FARM.rent) + ' a day</small>' : 'Field to let <small>E takes the lease for ' + money(FARM.lease) + '</small>';
      if (!F.leased) return 'The field <small>take the lease at the gate first</small>';
      if (d.kind === 'farmBarn') { var dry = F.barn.filter(function (l) { return l.t >= FARM.dryS; }).length; return 'The drying barn <small>' + (F.barn.length ? F.barn.length + ' hanging' + (dry ? ' · ' + dry + ' dry' : '') : 'empty') + '</small>'; }
      var r = F.rows[d.i]; return 'Row ' + (d.i + 1) + ' <small>' + (!r ? 'empty · E sows it' : r.progress >= 1 ? strainById(r.strain).name + ' · ready to cut' : strainById(r.strain).name + ' · ' + Math.round(r.progress * 100) + '%' + (r.water <= 0.15 ? ' · bone dry' : '')) + '</small>';
    },
    interact: function (d) {
      var F = farmState();
      if (d.kind === 'farmGate') { if (F.leased) ctxOpen('🚜 Grow Co. Farm', season() + ' · ' + xs().weather.kind, [{ label: 'Rent <b>' + money(FARM.rent) + ' a day</b> <small>with the morning bills</small>' }, { label: farmSeason() ? 'Crops grow in daylight from spring to autumn. Rain waters them.' : 'It is winter. Anything still in the ground when the frost comes is lost.', cls: 'muted' }, { label: '📄 Give up the lease <small>the rows are cleared; what is in the barn stays yours</small>', act: function () { F.leased = false; F.rows = F.rows.map(function () { return null; }); farmSync(); toast('Gave up the lease on the field', ''); } }]); else ctxOpen('🚜 Field to let', 'Five rows of open ground past the west avenue, a barn to dry in and water on site. Big harvests of plainer bud.', [{ label: 'Take the lease · ' + money(FARM.lease) + ' <small>then ' + money(FARM.rent) + ' a day</small>', act: function () { if (payBank(FARM.lease, 'The lease')) { F.leased = true; farmSync(); toast('🚜 The field is yours. Bring seed: a row takes ' + FARM.seeds + '.', 'good'); logEvent('🚜 Took the lease on the field out of town', 'good'); } } }]); return; }
      if (!F.leased) { toast('Take the lease at the gate first', ''); return; }
      if (d.kind === 'farmBarn') farmBarnMenu(); else farmRowMenu(d.i);
    },
    tick: function (dt, offline) {
      var F = farmState(); if (!F.leased && !F.boot.length && !F.barn.length) return; var wet = /rain|storm/.test(xs().weather.kind), h = gameHour(), sun = farmSeason() && h >= 6 && h <= 20;
      F.rows.forEach(function (r) { if (!r) return; if (wet) r.water = 1; else r.water = Math.max(0, r.water - dt / 900); if (r.progress >= 1 || !sun) return; var ok = r.water > 0.15; r.progress = Math.min(1, r.progress + (1000 / strainById(r.strain).growMs) * FARM.sun * (ok ? 1 : 0.25) * dt); r.quality = clamp(r.quality + (ok ? 0.008 : -0.03) * dt, 25, 62); });
      F.barn.forEach(function (l) { l.t += dt; });
      if (F.boot.length && !offline && !drive.on && farmVehicleNear(FARM.home.x, FARM.home.z, 10)) { var g = 0; F.boot.forEach(function (l) { stashAdd(l.strain, l.grams, l.q, l.thc); g += l.grams; }); F.boot = []; world.dirtyShelf = true; sfx('cash'); toast('🚜 Unloaded ' + gram(g) + ' of field bud into the stash', 'good'); logEvent('🚜 Brought ' + gram(g) + ' home from the field', 'good'); }
    },
    update: function (dt) {
      if (!farm.g) return; var p = drive.on && drive.g ? drive.g.position : player.pos, near = p.x < FARM.x2 + 60 && p.z < FARM.z2 + 60; farm.g.visible = near && (player.floor || 0) === 0; if (!farm.g.visible) return;
      farm.syncT -= dt; if (farm.syncT > 0) return; farm.syncT = 1.5; var F = farmState(); farm.rows.forEach(function (R, i) { var r = F.rows[i]; if (r) R.figs.forEach(function (f) { f.userData.set(r.progress, 1.5); }); });
    },
    newDay: function () {
      var F = farmState(); if (!F.leased) return; spendOp(FARM.rent);
      if (!farmSeason()) { var lost = 0; F.rows.forEach(function (r, i) { if (r && r.progress < 1) { F.rows[i] = null; lost++; } }); if (lost) { logEvent('❄️ Frost took ' + lost + ' row' + (lost === 1 ? '' : 's') + ' that were still growing in the field', 'bad'); toast('❄️ Frost took ' + lost + ' row' + (lost === 1 ? '' : 's') + ' in the field', 'bad'); farmSync(); } }
    }
  });
