//@ RF Smoking: the basement cigarette works
  // ── RF Smoking: the basement cigarette works. A pre-installed line: hydroponic tobacco bays → flue-curing kiln → shredder → cigarette maker → packer → finished-goods rack ──
  var BASE = { y: -6, h: 3.2, x1: -9, x2: 9, z1: -7, z2: 3 };
  var CIG_SKUS = {
    cigNS: { name: 'RF Smoking 10s',       type: 'normal', size: 10, price: 7,  col: 0xb5121b, top: 0xf4f1ea },
    cigNB: { name: 'RF Smoking 20s',       type: 'normal', size: 20, price: 13, col: 0xb5121b, top: 0xf4f1ea },
    cigLS: { name: 'RF Smoking Light 10s', type: 'light',  size: 10, price: 8,  col: 0xdfe6ee, top: 0x2f6b9a },
    cigLB: { name: 'RF Smoking Light 20s', type: 'light',  size: 20, price: 14, col: 0xdfe6ee, top: 0x2f6b9a }
  };
  var TOB = { growT: 200, sowCost: 20, bayKg: 2, kilnMax: 8, kilnT: 60, cureYield: 0.2, shredKgS: 0.02, stickKg: { normal: 0.0008, light: 0.0006 }, sticksS: 6, packS: 1.2, matCost: 50, matUnits: 100, carton: 10 };
  var tobUI = { signs: {}, bays: [], beacons: {}, spin: [], beltItems: [], rackG: null, kilnGlow: null, t: 0, fade: null };
  function tobFresh() { return { bays: [{ stage: 'empty', t: 0 }, { stage: 'empty', t: 0 }, { stage: 'empty', t: 0 }, { stage: 'empty', t: 0 }], leaf: 0, kiln: { on: false, kg: 0, t: 0 }, cured: 0, shred: { on: false }, cut: 0, maker: { on: false, mode: 'normal' }, sticks: { normal: 0, light: 0 }, packer: { on: false, size: 10, type: 'normal', t: 0 }, mat: 0, packs: { cigNS: 0, cigNB: 0, cigLS: 0, cigLB: 0 }, made: 0 }; }
  function tob() { if (!S.tob || !S.tob.bays) S.tob = tobFresh(); return S.tob; }
  function skuOf(type, size) { return 'cig' + (type === 'light' ? 'L' : 'N') + (size === 20 ? 'B' : 'S'); }
  function kg(n) { return (Math.round(n * 100) / 100) + ' kg'; }
  function tobLicensed() { if (hasLic('tobacco')) return true; toast('🪪 You need the tobacco manufacturing licence to run the line. It\'s under Licences on the office PC.', 'bad'); return false; }
  function tobFade(fn) { if (!tobUI.fade) { var d = document.createElement('div'); d.style.cssText = 'position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;transition:opacity .22s ease;z-index:50'; document.body.appendChild(d); tobUI.fade = d; } tobUI.fade.style.opacity = '1'; setTimeout(function () { fn(); setTimeout(function () { tobUI.fade.style.opacity = '0'; }, 120); }, 230); }
  function goBasement() { if (sit.on) standUp(); tobFade(function () { player.floor = -1; player.pos.set(6.4, BASE.y + 1.65, -1.4); player.vel.set(0, 0, 0); player.yaw = Math.PI / 2; player.pitch = 0; sfx('step', 'concrete'); toast('🏭 RF Smoking: the basement works', ''); }); }
  function leaveBasement() { tobFade(function () { var v = propInst.cellarHatch ? propWorld('cellarHatch', 0, 1.0) : { x: 2.9, z: 1.6 }; player.floor = 0; player.pos.set(v.x, 1.65, v.z); player.vel.set(0, 0, 0); sfx('step', 'planks'); }); }
  function buildBasement() {
    var B = BASE, Y = B.y, H = B.h, steel = colorMat(0x8d949c, 0.35, 0.8), dark = colorMat(0x2b2f35, 0.5, 0.6), yel = colorMat(0xf2c21a, 0.6), belt = colorMat(0x16181b, 0.9), grn = colorMat(0x2e6b4a, 0.5, 0.3), blu = colorMat(0x2f5f8a, 0.5, 0.3), conc = colorMat(0x70757b, 0.95), wood = MAT.wood;
    function bb(w, h, d, m, x, y, z, o) { o = o || {}; o.floorLevel = -1; return box(w, h, d, m, x, Y + y, z, o); }
    function bc(rt, rb, h, m, x, y, z, seg) { return cyl(rt, rb, h, m, x, Y + y, z, null, seg); }
    function hit(w, h, d, x, y, z, data) { var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), MAT.none); m.position.set(x, Y + y, z); world.group.add(m); interactable(m, data); return m; }
    function sign(key, w, h, x, y, z, rotY, lines, opts) { opts = Object.assign({ size: w < 1 ? 40 : 24, bg: '#0b1a12', titleColor: '#6fdc8c', color: '#c9e8d0', line: 'rgba(111,220,140,.5)' }, opts || {}); var res = opts.res || (w < 1 ? 620 : 300); var pw = Math.round(w * res), ph = Math.round(h * res); var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: textTex(lines, pw, ph, opts) })); m.position.set(x, Y + y, z); m.rotation.y = rotY || 0; world.group.add(m); fixtureSign(m, lines); if (key) tobUI.signs[key] = { mesh: m, w: pw, h: ph, opts: opts, txt: lines.join('|') }; return m; }
    function beacon(key, x, y, z) { bc(0.05, 0.05, 0.05, dark, x, y, z, 12); var m = bc(0.045, 0.045, 0.1, glowMat(0xff8a1c, 0.1), x, y + 0.075, z, 12); tobUI.beacons[key] = m; return m; }
    function spinner(g, axis, speed, key) { tobUI.spin.push({ g: g, axis: axis, speed: speed, key: key }); }
    // shell: slab, walls, ceiling that also shades the room from the sun, hazard lines, drain
    floorPlane(MAT.floor, B.x1, B.x2, B.z1, B.z2, 2.4, Y + 0.001);
    bb(18.6, H, 0.3, conc, 0, H / 2, B.z1 - 0.15, { solid: true, tag: 'wall' }); bb(18.6, H, 0.3, conc, 0, H / 2, B.z2 + 0.15, { solid: true, tag: 'wall' });
    bb(0.3, H, 10, conc, B.x1 - 0.15, H / 2, -2, { solid: true, tag: 'wall' }); bb(0.3, H, 10, conc, B.x2 + 0.15, H / 2, -2, { solid: true, tag: 'wall' });
    bb(18.6, 0.3, 10.6, dark, 0, H + 0.15, -2, { cast: true });
    [[-8.6, 8.6, -1.9], [-8.6, 8.6, -3.9]].forEach(function (l) { bb(l[1] - l[0], 0.004, 0.09, yel, (l[0] + l[1]) / 2, 0.004, l[2], { cast: false }); });   // the walkway between the bays and the line
    for (var hz = 0; hz < 12; hz++) bb(0.28, 0.005, 0.09, hz % 2 ? dark : yel, 4.9 + hz * 0.28, 0.005, -4.2, { cast: false });   // chevrons in front of the kiln door
    bb(0.5, 0.01, 0.5, dark, 0, 0.006, -2.9, { cast: false });
    // ceiling services: cable tray, two pipe runs, a supply duct with drops
    bb(17, 0.06, 0.4, steel, 0, H - 0.25, -2.9, { cast: false }); [-0.5, 0.2].forEach(function (pz, i) { var p = bc(0.05 + i * 0.02, 0.05 + i * 0.02, 17, i ? blu : colorMat(0xb04a2a, 0.5, 0.4), 0, H - 0.5 - i * 0.05, pz - 3.6, 10); p.rotation.z = Math.PI / 2; });
    bb(0.6, 0.4, 9.4, steel, -8.3, H - 0.35, -2, { cast: false }); [-5.5, -2, 1.5].forEach(function (dz) { bb(0.5, 0.06, 0.5, dark, -8.3, H - 0.58, dz, { cast: false }); });
    // industrial lamps: two lights carry the whole floor, the housings are just housings
    [[-4.2, -2.6], [4.2, -2.6]].forEach(function (p) { bb(0.12, 0.3, 0.12, dark, p[0], H - 0.15, p[1], { cast: false }); var sh = bc(0.12, 0.34, 0.22, dark, p[0], H - 0.42, p[1], 16); sh.castShadow = false; var lens = bc(0.3, 0.3, 0.02, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff0d8, emissiveIntensity: 0.9 }), p[0], H - 0.54, p[1], 16); lens.castShadow = false; (world.lampFixtures = world.lampFixtures || []).push(lens); var l = new THREE.PointLight(0xfff0d8, 0.95, 17, 1.4); l.userData.base = 0.95; l.position.set(p[0], Y + H - 0.7, p[1]); scene.add(l); world.roomLamps.push(l); });
    // the stair up to the shop floor (right wall), with the way out at its foot
    for (var s = 0; s < 10; s++) { bb(1.2, 0.05, 0.3, steel, 8.2, 0.3 + s * 0.3, -0.35 + s * 0.3, { cast: true }); bb(0.04, 0.3 + s * 0.3, 0.04, dark, 7.64, (0.3 + s * 0.3) / 2, -0.35 + s * 0.3); }
    var sr = bc(0.025, 0.025, 4.3, yel, 7.62, 2.45, 1.0, 8); sr.rotation.x = Math.PI / 4; world.obstacles.push({ x1: 7.55, x2: 8.85, z1: -0.5, z2: 2.85, tag: 'bstair', floorLevel: -1 });
    hit(1.4, 2.2, 0.7, 8.2, 1.1, -0.85, { kind: 'cellarUp' }); sign(null, 1.1, 0.3, 8.2, 2.75, -0.52, Math.PI, ['EXIT ↑', 'shop floor'], { size: 30, titleColor: '#6fdc8c' });
    lightSwitch(7.2, Y + 1.35, B.z2 - 0.01, Math.PI, 'basement');
    // brand wall and the line explained
    sign(null, 5.0, 1.1, 0, 2.35, B.z1 + 0.02, 0, ['RF SMOKING', 'grown, cured and rolled under this floor'], { size: 60, bg: '#14100c', titleColor: '#e8c27a', color: '#b9a88a', line: 'rgba(232,194,122,.5)' });
    sign(null, 2.6, 1.5, B.x1 + 0.02, 1.7, -0.6, Math.PI / 2, ['HOW THE LINE RUNS', '1  sow the bays, harvest when ready', '2  kiln cures leaf: 8 kg a load', '3  shredder cuts the cured leaf', '4  maker rolls Normal or Light', '5  packer boxes 10s or 20s', '6  carry cartons up to the cabinet'], { size: 22 });
    // 1 ─ four hydroponic bays along the back wall, LED bars over each, a leaf conveyor overhead running to the kiln
    for (var b = 0; b < 4; b++) {
      var bx = -7.4 + b * 2.6, bz = -6.2;
      bb(2.3, 0.08, 1.0, steel, bx, 0.55, bz); bb(2.2, 0.22, 0.9, dark, bx, 0.7, bz); bb(2.1, 0.02, 0.8, colorMat(0x3a2a1c, 1), bx, 0.815, bz, { cast: false });
      [[-1.1, -0.45], [1.1, -0.45], [-1.1, 0.45], [1.1, 0.45]].forEach(function (p) { bb(0.05, 2.3, 0.05, steel, bx + p[0], 1.15, bz + p[1]); });
      bb(2.2, 0.06, 0.16, dark, bx, 2.3, bz, { cast: false }); bb(2.1, 0.02, 0.12, glowMat(0xd64bff, 1.6), bx, 2.26, bz, { cast: false });
      bb(0.3, 0.4, 0.25, blu, bx - 0.9, 0.25, bz + 0.2); var hp = bc(0.02, 0.02, 0.5, blu, bx - 0.9, 0.62, bz + 0.2, 8);   // nutrient tank and feed line
      world.obstacles.push({ x1: bx - 1.15, x2: bx + 1.15, z1: bz - 0.5, z2: bz + 0.5, tag: 'bay', floorLevel: -1 });
      var pg = new THREE.Group(); pg.position.set(bx, Y + 0.82, bz); world.group.add(pg);
      for (var pl = 0; pl < 6; pl++) { var plant = new THREE.Group(); plant.position.set(-0.85 + (pl % 3) * 0.85, 0, pl < 3 ? -0.2 : 0.2); var stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, 1.0, 6), MAT.stem); stem.position.y = 0.5; plant.add(stem); for (var lf = 0; lf < 7; lf++) { var leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.5), MAT.leaf); leaf.position.set(Math.cos(lf * 2.2) * 0.17, 0.2 + lf * 0.12, Math.sin(lf * 2.2) * 0.17); leaf.rotation.set(-0.9, lf * 2.2 + Math.PI / 2, 0); plant.add(leaf); } pg.add(plant); }
      pg.visible = false; tobUI.bays.push(pg);
      sign('bay' + b, 0.7, 0.3, bx + 0.7, 0.35, bz + 0.51, 0, ['BAY ' + (b + 1), 'empty']); hit(2.3, 2.3, 1.1, bx, 1.2, bz, { kind: 'tobBay', idx: b });
    }
    bb(12.6, 0.06, 0.5, belt, -1.9, 2.62, -5.35, { cast: false }); bb(12.6, 0.14, 0.04, steel, -1.9, 2.66, -5.11, { cast: false }); bb(12.6, 0.14, 0.04, steel, -1.9, 2.66, -5.59, { cast: false }); [-7.5, -3.5, 0.5].forEach(function (hx) { bb(0.04, 0.55, 0.04, steel, hx, 2.92, -5.35, { cast: false }); });
    // 2 ─ the flue-curing kiln: insulated box, door with a sight glass that glows while it fires, flue into the ceiling, extraction fan
    bb(2.6, 2.3, 2.0, colorMat(0x9aa0a6, 0.6, 0.5), 5.8, 1.15, -5.4, { solid: true, tag: 'kiln' }); bb(1.3, 1.9, 0.08, dark, 5.5, 1.0, -4.37); bb(0.06, 0.5, 0.06, steel, 6.05, 1.0, -4.3); [0.35, 1.65].forEach(function (hy) { bb(0.1, 0.16, 0.06, steel, 4.9, hy, -4.33); });
    tobUI.kilnGlow = bb(0.5, 0.3, 0.02, glowMat(0xff6a1a, 0.05), 5.5, 1.45, -4.32, { cast: false }); bc(0.22, 0.22, 1.0, steel, 6.5, 2.75, -5.6, 14); bb(0.9, 0.5, 0.5, steel, 4.7, 2.5, -5.35, { cast: false });   // chute off the leaf conveyor
    bb(0.55, 0.75, 0.1, dark, 6.75, 1.4, -4.36); sign('kiln', 0.48, 0.5, 6.75, 1.5, -4.3, 0, ['KILN', 'off']); beacon('kiln', 6.75, 1.82, -4.38); hit(2.7, 2.3, 0.5, 5.8, 1.15, -4.2, { kind: 'tobKiln' });
    var fanG = new THREE.Group(); fanG.position.set(7.9, Y + 2.4, B.z1 + 0.06); world.group.add(fanG); for (var fb = 0; fb < 4; fb++) { var blade = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 0.01), steel); blade.position.set(Math.cos(fb * Math.PI / 2) * 0.17, Math.sin(fb * Math.PI / 2) * 0.17, 0); blade.rotation.z = fb * Math.PI / 2; fanG.add(blade); } spinner(fanG, 'z', 9, 'kiln'); var ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.03, 8, 24), dark); ring.position.copy(fanG.position); world.group.add(ring);
    bb(0.4, 0.4, 5.0, steel, 4.6, 2.75, -1.9, { cast: false });   // cured leaf duct, kiln to shredder
    // 3 ─ shredder: hopper on top, toothed drum turning behind a guard
    bb(1.6, 1.3, 1.2, grn, 4.4, 0.65, 0.9, { solid: true, tag: 'shred' }); bb(1.2, 0.5, 0.9, grn, 4.4, 1.55, 0.9); bb(1.5, 0.06, 1.1, steel, 4.4, 1.83, 0.9, { cast: false });
    var drumG = new THREE.Group(); drumG.position.set(4.4, Y + 0.95, 0.24); world.group.add(drumG); var drum = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.1, 14), steel); drum.rotation.z = Math.PI / 2; drumG.add(drum); for (var th = 0; th < 10; th++) { var tooth = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 0.05), dark); var ta = th * 0.63; tooth.position.set(-0.45 + th * 0.1, Math.cos(ta) * 0.21, Math.sin(ta) * 0.21); tooth.rotation.x = -ta; drumG.add(tooth); } spinner(drumG, 'x', 7, 'shred');
    [-0.6, 0.6].forEach(function (gx) { bb(0.04, 0.5, 0.06, yel, 4.4 + gx, 0.95, 0.24, { cast: false }); }); bb(0.5, 0.6, 0.08, dark, 3.95, 1.5, 0.27); sign('shred', 0.44, 0.44, 3.95, 1.52, 0.22, Math.PI, ['SHREDDER', 'off']); beacon('shred', 4.9, 1.86, 0.5); hit(1.7, 2.0, 0.5, 4.4, 1.0, 0.15, { kind: 'tobShred' });
    // belts between the machines, with product riding them while the line runs
    [[1.9, 3.6], [-1.75, -0.35]].forEach(function (r) { bb(r[1] - r[0], 0.08, 0.5, belt, (r[0] + r[1]) / 2, 0.92, 0.9, { cast: false }); bb(r[1] - r[0], 0.06, 0.04, steel, (r[0] + r[1]) / 2, 0.97, 0.63, { cast: false }); bb(r[1] - r[0], 0.06, 0.04, steel, (r[0] + r[1]) / 2, 0.97, 1.17, { cast: false }); [r[0] + 0.1, r[1] - 0.1].forEach(function (lx) { bb(0.06, 0.88, 0.4, steel, lx, 0.44, 0.9); }); world.obstacles.push({ x1: r[0], x2: r[1], z1: 0.6, z2: 1.2, tag: 'belt', floorLevel: -1 }); });
    for (var bi = 0; bi < 8; bi++) { var it = bb(0.09, 0.05, 0.13, bi < 4 ? colorMat(0x8a6a3a, 0.9) : colorMat(0xf4f1ea, 0.6), 0, 0.99, 0.9, { cast: false }); it.visible = false; tobUI.beltItems.push({ m: it, lane: bi < 4 ? 0 : 1, off: (bi % 4) / 4 }); }
    // 4 ─ cigarette maker: long steel bed under a glass hood, paper bobbin turning on the side, filter hopper
    bb(2.2, 1.0, 1.1, steel, 0.75, 0.5, 0.9, { solid: true, tag: 'maker' }); bb(2.0, 0.5, 0.9, MAT.glass, 0.75, 1.27, 0.9, { cast: false }); bb(2.1, 0.04, 1.0, dark, 0.75, 1.54, 0.9, { cast: false }); bb(1.8, 0.1, 0.12, dark, 0.75, 1.1, 0.9, { cast: false });
    var bobG = new THREE.Group(); bobG.position.set(1.55, Y + 1.25, 0.28); world.group.add(bobG); var bob = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.06, 20), colorMat(0xf4f1ea, 0.7)); bob.rotation.x = Math.PI / 2; bobG.add(bob); var hub = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.07), dark); bobG.add(hub); spinner(bobG, 'z', 5, 'maker');
    bb(0.5, 0.45, 0.5, colorMat(0xd9d2c2, 0.8), 0.0, 1.8, 0.9); bb(0.5, 0.6, 0.08, dark, 0.35, 1.0, 0.31); sign('maker', 0.44, 0.5, 0.35, 1.02, 0.26, Math.PI, ['MAKER', 'off']); beacon('maker', 1.75, 1.6, 0.5); hit(2.3, 2.0, 0.5, 0.75, 1.0, 0.15, { kind: 'tobMaker' });
    // 5 ─ packer: carousel on top, blank magazine, outfeed onto the rack side
    bb(1.9, 1.2, 1.1, blu, -2.8, 0.6, 0.9, { solid: true, tag: 'packer' }); var carG = new THREE.Group(); carG.position.set(-2.8, Y + 1.32, 0.9); world.group.add(carG); var disc = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 20), steel); carG.add(disc); for (var cp = 0; cp < 8; cp++) { var pocket = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.12, 0.06), cp % 2 ? colorMat(0xb5121b, 0.5) : colorMat(0xdfe6ee, 0.5)); pocket.position.set(Math.cos(cp * Math.PI / 4) * 0.33, 0.09, Math.sin(cp * Math.PI / 4) * 0.33); carG.add(pocket); } spinner(carG, 'y', 2.2, 'packer');
    bb(0.3, 0.7, 0.3, colorMat(0xd9d2c2, 0.8), -3.5, 1.55, 1.2); bb(0.5, 0.6, 0.08, dark, -3.3, 1.0, 0.31); sign('packer', 0.44, 0.5, -3.3, 1.02, 0.26, Math.PI, ['PACKER', 'off']); beacon('packer', -2.0, 1.3, 0.5); hit(2.0, 2.0, 0.5, -2.8, 1.0, 0.15, { kind: 'tobPacker' });
    bb(1.2, 0.14, 1.0, wood, -4.6, 0.07, 1.9); bb(1.0, 0.5, 0.8, colorMat(0xc9a36a, 0.9), -4.6, 0.39, 1.9); bb(0.9, 0.4, 0.7, colorMat(0xc9a36a, 0.9), -4.6, 0.84, 1.9);   // pallet of paper, filters and blanks
    // 6 ─ finished goods rack
    [0.3, 0.85, 1.4, 1.95].forEach(function (sy) { bb(2.2, 0.04, 0.6, steel, -6.6, sy, 2.55); }); [[-7.68, 2.27], [-5.52, 2.27], [-7.68, 2.83], [-5.52, 2.83]].forEach(function (p) { bb(0.05, 2.1, 0.05, steel, p[0], 1.05, p[1]); });
    world.obstacles.push({ x1: -7.75, x2: -5.45, z1: 2.2, z2: 2.9, tag: 'frack', floorLevel: -1 }); tobUI.rackG = new THREE.Group(); tobUI.rackG.position.set(-6.6, Y, 2.55); world.group.add(tobUI.rackG);
    sign('rack', 1.2, 0.34, -6.6, 2.3, 2.25, Math.PI, ['FINISHED GOODS', 'nothing packed yet'], { size: 22 }); hit(2.3, 2.1, 0.8, -6.6, 1.05, 2.45, { kind: 'tobRack' });
    // the electrical cabinet, drums and a hand truck so the room reads as a working floor
    bb(0.9, 1.9, 0.4, colorMat(0x5f666e, 0.5, 0.6), -8.75, 0.95, -4.6, { solid: true }); bb(0.02, 0.3, 0.2, yel, -8.29, 1.5, -4.6, { cast: false }); [-0.3, 0.3].forEach(function (dz) { bb(0.02, 0.06, 0.06, glowMat(0x39d353, 1.4), -8.29, 1.1, -4.6 + dz, { cast: false }); });
    [[7.9, -2.6], [8.3, -3.4]].forEach(function (p) { var dr = bc(0.3, 0.3, 0.9, blu, p[0], 0.45, p[1], 16); world.obstacles.push({ x1: p[0] - 0.3, x2: p[0] + 0.3, z1: p[1] - 0.3, z2: p[1] + 0.3, tag: 'drum', floorLevel: -1 }); });
    syncTobRack();
  }
  function syncTobRack() {
    var g = tobUI.rackG; if (!g) return; clearKids(g); var T = tob();
    CIG_KEYS.forEach(function (k, i) { var K = CIG_SKUS[k]; var cartons = Math.min(8, Math.ceil(T.packs[k] / TOB.carton)); for (var c = 0; c < cartons; c++) { var w = K.size === 20 ? 0.3 : 0.24; var m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, 0.4), colorMat(K.col, 0.6)); m.position.set(-0.75 + (c % 4) * 0.5, [0.37, 0.92, 1.47, 2.02][i] + Math.floor(c / 4) * 0.105, 0); g.add(m); var band = new THREE.Mesh(new THREE.BoxGeometry(w + 0.004, 0.03, 0.404), colorMat(K.top, 0.6)); band.position.copy(m.position); band.position.y += 0.03; g.add(band); } });
  }
  function setTobSign(key, lines) { var s = tobUI.signs[key]; if (!s) return; var txt = lines.join('|'); if (s.txt === txt) return; s.txt = txt; var ob = s.mesh.material.map; s.mesh.material.map = textTex(lines, s.w, s.h, s.opts); s.mesh.material.needsUpdate = true; if (ob) ob.dispose(); }
  function packerReady(T) { var P = T.packer; return T.sticks[P.type] >= P.size && T.mat >= (P.size === 20 ? 2 : 1); }
  function updateTobacco(dt) {
    var T = tob();
    T.bays.forEach(function (b, i) { if (b.stage !== 'grow') return; b.t += dt; if (b.t >= TOB.growT) { b.stage = 'ready'; toast('🌿 Tobacco bay ' + (i + 1) + ' is ready to harvest', 'good'); save(); } });
    var K = T.kiln; if (K.on) { if (K.kg <= 0 && T.leaf >= 1) { K.kg = Math.min(TOB.kilnMax, T.leaf); T.leaf -= K.kg; K.t = 0; } if (K.kg > 0) { K.t += dt; if (K.t >= TOB.kilnT) { T.cured += K.kg * TOB.cureYield; logEvent('🔥 Kiln finished a load: ' + kg(K.kg * TOB.cureYield) + ' of cured leaf', ''); K.kg = 0; K.t = 0; save(); } } }
    if (T.shred.on && T.cured > 0) { var c = Math.min(T.cured, TOB.shredKgS * dt); T.cured -= c; T.cut += c; }
    if (T.maker.on && T.cut > 0) { var per = TOB.stickKg[T.maker.mode]; var n = Math.min(TOB.sticksS * dt, T.cut / per); T.cut = Math.max(0, T.cut - n * per); T.sticks[T.maker.mode] += n; }
    var P = T.packer; if (P.on && packerReady(T)) { P.t += dt; if (P.t >= TOB.packS) { P.t = 0; T.sticks[P.type] -= P.size; T.mat -= P.size === 20 ? 2 : 1; var sku = skuOf(P.type, P.size); T.packs[sku]++; T.made++; if (T.packs[sku] % TOB.carton === 1 || T.packs[sku] % TOB.carton === 0) syncTobRack(); } }
    if (player.floor !== -1) return;
    // everything below is only what you can see from the floor
    var run = { kiln: K.on && K.kg > 0, shred: T.shred.on && T.cured > 0, maker: T.maker.on && T.cut > 0, packer: P.on && packerReady(T) }; var armed = { kiln: K.on, shred: T.shred.on, maker: T.maker.on, packer: P.on };
    tobUI.spin.forEach(function (s) { if (run[s.key]) s.g.rotation[s.axis] += s.speed * dt; });
    tobUI.t += dt; var blink = Math.sin(tobUI.t * 6) > 0;
    Object.keys(tobUI.beacons).forEach(function (k) { var m = tobUI.beacons[k].material; m.emissiveIntensity = run[k] ? (blink ? 2.2 : 0.6) : armed[k] ? 0.7 : 0.08; m.color.setHex(run[k] ? 0x39d353 : 0xff8a1c); m.emissive.setHex(run[k] ? 0x39d353 : 0xff8a1c); });
    if (tobUI.kilnGlow) tobUI.kilnGlow.material.emissiveIntensity = run.kiln ? 1.6 + Math.sin(tobUI.t * 3) * 0.4 : 0.05;
    tobUI.beltItems.forEach(function (o) { var on = o.lane === 0 ? run.shred : run.maker; o.m.visible = on; if (!on) return; var r = o.lane === 0 ? [3.6, 1.9] : [-0.35, -1.75]; var f = (tobUI.t * 0.35 + o.off) % 1; o.m.position.x = r[0] + (r[1] - r[0]) * f; });
    T.bays.forEach(function (b, i) { var g = tobUI.bays[i]; if (!g) return; g.visible = b.stage !== 'empty'; var gr = b.stage === 'ready' ? 1 : clamp(b.t / TOB.growT, 0, 1); var sc = 0.12 + gr * 0.88; g.scale.set(sc, sc, sc); });
    tobUI.signT = (tobUI.signT || 0) - dt; if (tobUI.signT > 0) return; tobUI.signT = 0.5;
    T.bays.forEach(function (b, i) { setTobSign('bay' + i, ['BAY ' + (i + 1), b.stage === 'empty' ? 'empty · E to sow' : b.stage === 'ready' ? 'ready · E to cut' : 'growing ' + Math.round(b.t / TOB.growT * 100) + '%']); });
    setTobSign('kiln', ['KILN', !K.on ? 'off' : K.kg > 0 ? 'curing ' + kg(K.kg) : 'waiting for leaf', K.kg > 0 ? Math.ceil(TOB.kilnT - K.t) + ' s left' : 'leaf in: ' + kg(T.leaf)]);
    setTobSign('shred', ['SHREDDER', !T.shred.on ? 'off' : run.shred ? 'cutting' : 'idle', 'cured: ' + kg(T.cured)]);
    setTobSign('maker', ['MAKER', (T.maker.mode === 'light' ? 'LIGHT' : 'NORMAL') + (T.maker.on ? run.maker ? ' · rolling' : ' · idle' : ' · off'), 'cut: ' + kg(T.cut), 'N ' + Math.floor(T.sticks.normal) + ' · L ' + Math.floor(T.sticks.light)]);
    setTobSign('packer', ['PACKER', (P.type === 'light' ? 'LIGHT ' : 'NORMAL ') + P.size + 's' + (P.on ? run.packer ? ' · packing' : ' · starved' : ' · off'), 'materials: ' + T.mat, 'packed: ' + T.made]);
    setTobSign('rack', ['FINISHED GOODS', CIG_KEYS.map(function (k) { return (CIG_SKUS[k].type === 'light' ? 'L' : 'N') + CIG_SKUS[k].size + ': ' + T.packs[k]; }).join('   ')]);
  }
  function tobPrompt(d, h) {
    var T = tob();
    if (d.kind === 'cellarDown') return 'Go down to the basement <small>RF Smoking · the cigarette works</small>';
    if (d.kind === 'cellarUp') return 'Back up to the shop floor';
    if (d.kind === 'tobBay') { var b = T.bays[d.idx]; return 'Tobacco bay ' + (d.idx + 1) + ' <small>' + (b.stage === 'empty' ? 'sow seedlings · ' + money(TOB.sowCost) : b.stage === 'ready' ? 'cut the leaf · about ' + kg(TOB.bayKg) : 'growing · ' + Math.round(b.t / TOB.growT * 100) + '%') + '</small>'; }
    if (d.kind === 'tobKiln') return 'Curing kiln <small>' + (T.kiln.on ? 'on' : 'off') + ' · ' + kg(T.leaf) + ' leaf waiting</small>';
    if (d.kind === 'tobShred') return 'Shredder <small>' + (T.shred.on ? 'on' : 'off') + ' · ' + kg(T.cured) + ' cured leaf</small>';
    if (d.kind === 'tobMaker') return 'Cigarette maker <small>' + T.maker.mode + ' · ' + (T.maker.on ? 'on' : 'off') + ' · ' + kg(T.cut) + ' cut tobacco</small>';
    if (d.kind === 'tobPacker') return 'Packer <small>' + T.packer.type + ' ' + T.packer.size + 's · ' + (T.packer.on ? 'on' : 'off') + ' · ' + T.mat + ' materials</small>';
    if (d.kind === 'tobRack') return h && h.kind === 'cigs' ? 'Put the carton back' : 'Finished goods <small>take a carton up to the cigarette cabinet</small>';
    if (d.kind === 'cigCab') { if (isLocked('cigCabinet')) return 'Cigarette cabinet <small>🔒 locked · Shift+E with the keyring</small>'; if (!S.cigShutter) return 'Cigarette cabinet <small>shutter down · E rolls it up' + (hasKeys() ? ' · Shift+E locks it' : '') + '</small>'; if (h && h.kind === 'cigs') return 'Stock ' + h.n + ' × ' + CIG_SKUS[h.sku].name + ' <small>' + cigStock(h.sku) + ' in the cabinet</small>'; return 'Cigarette cabinet <small>' + Object.keys(CIG_SKUS).reduce(function (a, k) { return a + cigStock(k); }, 0) + ' packs · take what the customer asked for</small>'; }
    return '';
  }
  function tobInteract(d, h) {
    var T = tob();
    if (d.kind === 'cellarDown') { goBasement(); return true; }
    if (d.kind === 'cellarUp') { leaveBasement(); return true; }
    if (d.kind === 'cigCab') { cigCabInteract(h); return true; }
    if (d.kind === 'tobBay') { var b = T.bays[d.idx]; if (b.stage === 'empty') { if (!tobLicensed()) return true; if (S.bank < TOB.sowCost) { toast('Seedlings cost ' + money(TOB.sowCost) + ', and the bank\'s short', 'bad'); return true; } S.bank -= TOB.sowCost; b.stage = 'grow'; b.t = 0; sfx('plant'); toast('🌱 Bay ' + (d.idx + 1) + ' sown. It\'s ready in a few minutes.', 'good'); } else if (b.stage === 'ready') { b.stage = 'empty'; b.t = 0; T.leaf += TOB.bayKg; sfx('harvest'); toast('🌿 Cut ' + kg(TOB.bayKg) + ' of green leaf. It rides the conveyor to the kiln.', 'good'); } else toast('Still growing · ' + Math.round(b.t / TOB.growT * 100) + '%', ''); hud(); save(); return true; }
    function sw(obj, label) { return { label: (obj.on ? '⏹ Switch the ' + label + ' OFF' : '▶ Switch the ' + label + ' ON'), cls: obj.on ? 'on' : '', act: function () { if (!obj.on && !tobLicensed()) return; obj.on = !obj.on; sfx('click'); toast((obj.on ? '▶ ' : '⏹ ') + label + (obj.on ? ' running' : ' stopped'), ''); save(); } }; }
    if (d.kind === 'tobKiln') { ctxOpen('🔥 Curing kiln', kg(T.leaf) + ' green leaf waiting · ' + kg(T.cured) + ' cured', [sw(T.kiln, 'kiln'), { label: 'Takes up to ' + TOB.kilnMax + ' kg a load, ' + TOB.kilnT + ' s, and leaf dries down to a fifth of its weight. Left on, it reloads itself.', cls: 'muted' }]); return true; }
    if (d.kind === 'tobShred') { ctxOpen('⚙️ Shredder', kg(T.cured) + ' cured leaf in · ' + kg(T.cut) + ' cut tobacco out', [sw(T.shred, 'shredder')]); return true; }
    if (d.kind === 'tobMaker') { ctxOpen('🚬 Cigarette maker', kg(T.cut) + ' cut tobacco · ' + Math.floor(T.sticks.normal) + ' normal · ' + Math.floor(T.sticks.light) + ' light sticks', [sw(T.maker, 'maker'), { label: '🔴 Roll Normal <small>full flavour, 0.8 g a stick</small>', cls: T.maker.mode === 'normal' ? 'on' : '', act: function () { T.maker.mode = 'normal'; toast('Maker set to Normal', ''); save(); } }, { label: '🔵 Roll Light <small>vented filter, 0.6 g a stick: a quarter more sticks from the same leaf</small>', cls: T.maker.mode === 'light' ? 'on' : '', act: function () { T.maker.mode = 'light'; toast('Maker set to Light', ''); save(); } }]); return true; }
    if (d.kind === 'tobPacker') { var P = T.packer; var lines = [sw(P, 'packer')]; [['normal', 10], ['normal', 20], ['light', 10], ['light', 20]].forEach(function (o) { var K = CIG_SKUS[skuOf(o[0], o[1])]; lines.push({ label: (o[0] === 'light' ? '🔵 ' : '🔴 ') + 'Pack ' + K.name + ' <small>' + (o[1] === 20 ? 'big' : 'small') + ' pack · sells at ' + money(K.price) + ' · ' + Math.floor(T.sticks[o[0]]) + ' sticks ready</small>', cls: P.type === o[0] && P.size === o[1] ? 'on' : '', act: function () { P.type = o[0]; P.size = o[1]; toast('Packer set to ' + K.name, ''); save(); } }); }); lines.push({ label: '📦 Order paper, filters and pack blanks · ' + money(TOB.matCost) + ' <small>' + TOB.matUnits + ' units · a small pack uses 1, a big pack 2 · ' + T.mat + ' left</small>', cls: S.bank < TOB.matCost ? 'muted' : '', act: S.bank < TOB.matCost ? null : function () { S.bank -= TOB.matCost; T.mat += TOB.matUnits; sfx('cash'); toast('📦 Materials delivered to the pallet', 'good'); hud(); save(); } }); ctxOpen('📦 Packer', P.type + ' ' + P.size + 's · ' + T.mat + ' materials · ' + T.made + ' packs made so far', lines); return true; }
    if (d.kind === 'tobRack') { if (h && h.kind === 'cigs') { T.packs[h.sku] += h.n; S.held = null; syncTobRack(); sfx('putdown'); toast('Carton back on the rack', ''); save(); return true; } var rl = CIG_KEYS.map(function (k) { var have = T.packs[k]; var n = Math.min(TOB.carton, have); return { label: '🚬 ' + CIG_SKUS[k].name + ' <small>' + have + ' packs on the rack' + (have ? ' · take ' + n : '') + '</small>', cls: have ? '' : 'muted', act: have ? function () { if (hotbarFull()) { toast('Your hands are full (G puts things down)', 'bad'); return; } T.packs[k] -= n; take({ kind: 'cigs', sku: k, n: n }); syncTobRack(); toast('🚬 Carry the carton up to the cigarette cabinet behind the counter', ''); save(); } : null }; }); ctxOpen('🗄️ Finished goods', 'a carton is ' + TOB.carton + ' packs', rl); return true; }
    return false;
  }
  // the cigarette cabinet behind the counter: stock sits behind a roller shutter, you take packs out and hand them over yourself
  function cigStock(k) { if (!S.cigStock) S.cigStock = {}; return S.cigStock[k] || 0; }
  function anyCigStock() { return Object.keys(CIG_SKUS).filter(function (k) { return cigStock(k) > 0; }); }
  function toggleCigShutter() { S.cigShutter = !S.cigShutter; sfx('curtain'); toast(S.cigShutter ? '🚬 Shutter up. The cigarette cabinet is open.' : '🚬 Shutter down. The cigarette cabinet is closed.', ''); save(); }
  function cigCabInteract(h) {
    if (player.keys.ShiftLeft || player.keys.ShiftRight) { toggleLock('cigCabinet'); return; }
    if (lockedStop('cigCabinet')) return;
    if (!S.cigShutter) { toggleCigShutter(); return; }
    if (h && h.kind === 'cigs') { S.cigStock[h.sku] = cigStock(h.sku) + h.n; S.held = null; syncCigCab(); sfx('putdown'); toast('🚬 ' + h.n + ' × ' + CIG_SKUS[h.sku].name + ' into the cabinet', 'good'); save(); return; }
    var c = S.customer, lines = []; var want = c && c.cig && c.cig.given < c.cig.qty ? c.cig : null;
    function takeLine(k, n, label) { return { label: label, cls: cigStock(k) >= 1 ? '' : 'muted', act: cigStock(k) >= 1 ? function () { if (hotbarFull()) { toast('Your hands are full (G puts things down)', 'bad'); return; } var m = Math.min(n, cigStock(k)); S.cigStock[k] -= m; take({ kind: 'cigs', sku: k, n: m }); syncCigCab(); save(); } : null }; }
    if (want) lines.push(takeLine(want.sku, want.qty - want.given, '🛎️ ' + c.who + ' asked for ' + (want.qty - want.given) + ' × ' + CIG_SKUS[want.sku].name + ' <small>' + cigStock(want.sku) + ' in the cabinet</small>'));
    Object.keys(CIG_SKUS).forEach(function (k) { lines.push(takeLine(k, 1, '🚬 Take a pack of ' + CIG_SKUS[k].name + ' <small>' + cigStock(k) + ' left · ' + money(CIG_SKUS[k].price) + '</small>')); });
    lines.push({ label: '⬇ Roll the shutter down', act: toggleCigShutter });
    ctxOpen('🚬 Cigarette cabinet', 'packs stay behind the shutter; you hand them to the customer', lines);
  }
  function syncCigCab() {
    var inst = propInst.cigCabinet; if (!inst) return; var g = inst.ctx.dynGroup(); var keep = g.userData.shutter; clearKids(g); if (keep) g.add(keep);
    Object.keys(CIG_SKUS).forEach(function (k, i) { var K = CIG_SKUS[k], n = Math.min(i < 4 ? 8 : 3, cigStock(k)), big = K.size === 20; for (var p = 0; p < n; p++) { var w = big ? 0.075 : 0.06, hh = big ? 0.11 : 0.09; var m = productCigPack(K, big ? 1.3 : 1.25); m.position.set((i < 4 ? -0.45 : 0.27) + p * 0.082, [1.62, 1.27, 0.92, 0.57, 1.62, 1.27, 0.92, 0.57][i] + hh / 2, 0.06); m.traverse(function (o) { if (o.isMesh) o.castShadow = false; }); g.add(m); } });   /* the cabinet shows the same pack you hand over */
    g.traverse(function (o) { if (o.isMesh) o.userData.propId = 'cigCabinet'; });
  }
  function updateShutters(dt) { updateOneShutter('goodsShelf', dt, 1.97, 1.9); updateOneShutter('cigCabinet', dt, 1.87, 1.45); }
  function updateOneShutter(id, dt, top, height) { var inst = propInst[id]; if (!inst) return; var sh = inst.ctx.dynGroup().userData.shutter; if (!sh) return; var tgt = shutterOpen(id) ? 0.06 : 1; sh.userData.t = lerp(sh.userData.t === undefined ? tgt : sh.userData.t, tgt, 1 - Math.pow(0.004, dt)); var t = sh.userData.t; sh.scale.y = t; sh.position.y = top - height * t / 2; }
  function updateCigShutterUnused(dt) { var inst = propInst.cigCabinet; if (!inst) return; var sh = inst.ctx.dynGroup().userData.shutter; if (!sh) return; var tgt = S.cigShutter ? 0.06 : 1; sh.userData.t = lerp(sh.userData.t === undefined ? tgt : sh.userData.t, tgt, 1 - Math.pow(0.004, dt)); var t = sh.userData.t; sh.scale.y = t; sh.position.y = 1.87 - 1.45 * t / 2; }
  // hand a pack to the customer at the window: their side order, priced at the till with the rest
  function handCigs(c, h) {
    var q = c.cig; if (!q || q.given >= q.qty) { toast(c.who + ' didn\'t ask for cigarettes', 'bad'); npc.say(custLine(c.who, 'noSmokes'), '#ffc857'); return; }
    if (q.sku !== h.sku) { toast(c.who + ' asked for ' + CIG_SKUS[q.sku].name + ', not that', 'bad'); npc.say(custLine(c.who, 'wrongSmokes', CIG_SKUS[q.sku].name), '#ff6b6b'); return; }
    var give = Math.min(q.qty - q.given, h.n); q.given += give; h.n -= give; if (h.n <= 0) S.held = null; S.stats.cigs = (S.stats.cigs || 0) + give; sfx('rustle');
    if (c.stage === 'pay') { c.due += CIG_SKUS[q.sku].price * give; if (c.pay === 'cash' && !c.changeGiven) c.tendered = tenderFor(c.due); }   // handed over after the rest was already rung up
    npc.say(custLine(c.who, q.given >= q.qty ? 'smokes' : 'more'), '#6fdc8c'); toast('🚬 Handed over ' + give + ' × ' + CIG_SKUS[q.sku].name, 'good'); hud();
  }
  function cigTotal(c) { return c && c.cig && c.cig.given > 0 ? CIG_SKUS[c.cig.sku].price * c.cig.given : 0; }
