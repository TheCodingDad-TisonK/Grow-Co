//@ dehumidifiers, street life, town walkers and room dressing
  // ── Dehumidifiers: one per room, controllable (E cycles the target, or the shop controls panel) ──
  var dehums = {}; var DEHUM_STEPS = [0, 45, 55, 65];
  function dehumSteps() { return S.upgrades.dehumid ? [0, 40, 45, 55, 65] : DEHUM_STEPS; }
  function dehumLabel(z) { var t = S.dehum[z]; return t > 0 ? 'target ' + t + '%' : 'off'; }
  function dehumSet(z, t) { S.dehum[z] = t; sfx('click'); toast('🌬️ ' + (z === 'grow' ? 'Grow room' : 'Dry room') + ' dehumidifier ' + (t > 0 ? 'set to ' + t + '%' : 'off'), ''); save(); ui.refreshOpen(); }
  function dehumCycle(z) { var st = dehumSteps(); var i = st.indexOf(S.dehum[z]); dehumSet(z, st[(i + 1) % st.length]); }
  function dehumUnit(zone, x, z, yaw) {
    var g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = yaw; world.group.add(g);
    box(0.5, 0.9, 0.4, colorMat(0xe6e6ea, 0.5), 0, 0.45, 0, { parent: g });
    for (var v = 0; v < 8; v++) box(0.44, 0.012, 0.02, MAT.plastic, 0, 0.2 + v * 0.06, 0.21, { parent: g, cast: false });   // louvres on the front face
    var lamp = box(0.3, 0.06, 0.06, glowMat(0x00ff66, 1.5), 0, 0.8, 0.21, { parent: g, cast: false });
    cyl(0.03, 0.03, 0.06, MAT.plastic, 0, 0.93, 0.12, g, 12);
    // top exhaust: ring and a four-blade fan that spins while the unit runs
    var ring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.008, 6, 20), MAT.plastic); ring.rotation.x = Math.PI / 2; ring.position.set(0, 0.905, -0.08); g.add(ring);
    var fan = new THREE.Group(); fan.position.set(0, 0.905, -0.08); g.add(fan);
    for (var b = 0; b < 4; b++) { var bl = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.005, 0.1), colorMat(0x8a8d92, 0.5)); bl.position.set(Math.sin(b * Math.PI / 2) * 0.06, 0, Math.cos(b * Math.PI / 2) * 0.06); bl.rotation.y = b * Math.PI / 2; fan.add(bl); }
    // readout on the front, redrawn whenever the numbers change
    var panel = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.13), new THREE.MeshBasicMaterial({ map: textTex(['RH --%'], 256, 84, { size: 30, titleColor: '#6fdc8c', bg: '#101410' }), transparent: true })); panel.position.set(0, 0.68, 0.212); g.add(panel);
    var hit = box(0.52, 0.95, 0.44, MAT.none, 0, 0.48, 0, { parent: g, cast: false }); interactable(hit, { kind: 'dehum', zone: zone });
    var r = rotAABB({ x1: -0.25, x2: 0.25, z1: -0.2, z2: 0.2 }, Math.round(yaw / (Math.PI / 2)));
    world.obstacles.push({ x1: x + Math.min(r.x1, r.x2), x2: x + Math.max(r.x1, r.x2), z1: z + Math.min(r.z1, r.z2), z2: z + Math.max(r.z1, r.z2), tag: 'dehum' });
    dehums[zone] = { g: g, lamp: lamp, fan: fan, panel: panel, key: '' };
  }
  function updateDehums(dt) {
    var near = 0;
    for (var z in dehums) {
      var u = dehums[z]; var running = S.dehum[z] > 0; var on = running && S.rh[z] > S.dehum[z] + 0.5;
      if (running) u.fan.rotation.y += dt * (on ? 14 : 4);
      if (running) { var dd = Math.hypot(u.g.position.x - player.pos.x, u.g.position.z - player.pos.z); near = Math.max(near, clamp(1 - dd / 9, 0, 1) * (on ? 1 : 0.5)); }
      u.lamp.material.emissiveIntensity = running ? (on ? 1.5 : 0.6) : 0.05; u.lamp.material.color.setHex(running ? 0x00ff66 : 0x333333); u.lamp.material.emissive.setHex(running ? 0x00ff66 : 0x000000);
      var key = Math.round(S.rh[z]) + ':' + S.dehum[z] + ':' + (on ? 1 : 0);
      if (key !== u.key) { u.key = key; if (u.key0 !== undefined) sfx('click'); u.key0 = 1; var ob = u.panel.material.map; u.panel.material.map = textTex(['RH ' + Math.round(S.rh[z]) + '%', running ? (on ? '▶ drying to ' + S.dehum[z] + '%' : '● holding ' + S.dehum[z] + '%') : 'standby'], 256, 84, { size: 30, titleColor: running ? '#6fdc8c' : '#8a8a8a', bg: '#101410' }); u.panel.material.needsUpdate = true; if (ob) ob.dispose(); }
    }
    humUpdate(near);
  }

  // ── Street life: sidewalk, road, lamps, parked van, passers-by ────
  var peds = [];
  // a boxy delivery van built into any group (long axis along x, cab at +x)
  function vanBody(van, logoLines) {
    var paint = colorMat(0xf2f2f2, 0.35, 0.3), dark = colorMat(0x1a1c20, 0.5, 0.3), glassM = new THREE.MeshPhysicalMaterial({ color: 0x8fb8d8, transparent: true, opacity: 0.55, roughness: 0.05, metalness: 0.3 });
    function vm(geo, mat, x, y, z) { var m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; van.add(m); return m; }
    vm(new THREE.BoxGeometry(3.6, 1.75, 2.05), paint, -0.6, 1.25, 0);                                  // cargo box
    vm(new THREE.BoxGeometry(1.5, 1.2, 2.0), paint, 1.9, 1.0, 0);                                        // cab lower
    var hood = vm(new THREE.BoxGeometry(0.9, 0.5, 1.9), paint, 2.55, 0.85, 0);                            // bonnet
    var wsh = vm(new THREE.BoxGeometry(0.7, 0.85, 1.9), glassM, 1.95, 1.65, 0); wsh.rotation.z = 0.35;      // windscreen
    vm(new THREE.BoxGeometry(0.9, 0.8, 1.98), paint, 1.5, 1.68, 0);                                       // cab roof block
    vm(new THREE.BoxGeometry(0.9, 0.55, 2.02), glassM, 1.5, 1.6, 0);                                      // side windows
    vm(new THREE.BoxGeometry(3.7, 1.8, 2.1), MAT.none, -0.6, 1.25, 0).visible = false;
    vm(new THREE.BoxGeometry(4.6, 0.1, 2.0), dark, 0.2, 0.42, 0);                                          // sill / chassis
    vm(new THREE.BoxGeometry(0.15, 0.3, 2.0), dark, 3.02, 0.55, 0); vm(new THREE.BoxGeometry(0.15, 0.3, 2.0), dark, -2.45, 0.55, 0);   // bumpers
    vm(new THREE.BoxGeometry(0.1, 0.3, 0.8), colorMat(0x1a1c20, 0.4, 0.6), 3.0, 0.85, 0);                 // grille
    [-0.75, 0.75].forEach(function (z) { vm(new THREE.BoxGeometry(0.06, 0.16, 0.3), glowMat(0xfff4d0, 1.2), 3.02, 0.95, z); vm(new THREE.BoxGeometry(0.06, 0.16, 0.24), glowMat(0xff3030, 0.9), -2.42, 1.0, z); });
    [-1.05, 1.05].forEach(function (z) { var mir = vm(new THREE.BoxGeometry(0.1, 0.16, 0.08), dark, 2.0, 1.55, z); vm(new THREE.BoxGeometry(0.04, 0.04, 0.12), dark, 2.0, 1.55, z * 0.95); });
    [[1.6, 1.02], [1.6, -1.02], [-1.5, 1.02], [-1.5, -1.02]].forEach(function (w) { var wh = vm(new THREE.CylinderGeometry(0.38, 0.38, 0.28, 18), colorMat(0x1a1a1a, 0.9), w[0], 0.38, w[1]); wh.rotation.x = Math.PI / 2; var rim = vm(new THREE.CylinderGeometry(0.22, 0.22, 0.29, 12), colorMat(0xc8ccd2, 0.3, 0.8), w[0], 0.38, w[1]); rim.rotation.x = Math.PI / 2; var hub = vm(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 10), dark, w[0], 0.38, w[1]); hub.rotation.x = Math.PI / 2; var arch = vm(new THREE.TorusGeometry(0.44, 0.05, 6, 16, Math.PI), dark, w[0], 0.4, w[1] * 0.97); arch.rotation.y = w[1] > 0 ? 0 : Math.PI; });
    /* the long axis is x here, so a door panel is long in x and thin in z: built the other way round they stood out from the side like fins */
    [-1.05, -0.15].forEach(function (x) { vm(new THREE.BoxGeometry(0.015, 1.3, 0.008), dark, x, 1.2, 1.029); }); vm(new THREE.BoxGeometry(0.915, 0.015, 0.008), dark, -0.6, 1.85, 1.029); vm(new THREE.BoxGeometry(0.16, 0.03, 0.04), MAT.chrome, -0.25, 1.1, 1.045);   // the sliding door: its seams (the livery runs across them) and the handle
    [-1, 1].forEach(function (sz) { vm(new THREE.BoxGeometry(0.95, 0.75, 0.02), colorMat(0xd8d8d8, 0.4), 1.5, 0.95, sz * 1.015); vm(new THREE.BoxGeometry(0.16, 0.03, 0.04), MAT.chrome, 1.12, 1.15, sz * 1.035); });      // a cab door each side, under the side window
    var logoTex = textTex(logoLines, 512, 200, { size: 46, titleColor: '#6fdc8c', bg: 'rgba(255,255,255,0)', line: 'rgba(0,0,0,0)', color: '#1a2a44' });
    var logo = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.9), new THREE.MeshBasicMaterial({ map: logoTex, transparent: true })); logo.position.set(-0.9, 1.35, 1.03); van.add(logo);
    var logo2 = logo.clone(); logo2.position.z = -1.03; logo2.rotation.y = Math.PI; van.add(logo2);
    var leafM = colorMat(0x3aa36a, 0.6); for (var lf = 0; lf < 5; lf++) { var lm = vm(new THREE.BoxGeometry(0.06, 0.5, 0.02), leafM, 0.7, 1.4, 1.04); lm.rotation.z = (lf - 2) * 0.5; }
    for (var rr = 0; rr < 3; rr++) vm(new THREE.BoxGeometry(0.05, 0.08, 2.0), colorMat(0x2a2d33, 0.5, 0.6), -1.6 + rr * 1.0, 2.17, 0); vm(new THREE.BoxGeometry(3.2, 0.05, 0.05), colorMat(0x2a2d33, 0.5, 0.6), -0.6, 2.2, 0.9); vm(new THREE.BoxGeometry(3.2, 0.05, 0.05), colorMat(0x2a2d33, 0.5, 0.6), -0.6, 2.2, -0.9);
    vm(new THREE.BoxGeometry(0.4, 0.14, 0.1), colorMat(0xffd166, 0.4), -2.45, 0.7, 0.6); vm(new THREE.BoxGeometry(0.4, 0.14, 0.1), colorMat(0xffd166, 0.4), 3.02, 0.7, -0.6);   // plates
  }
  function buildStreet() {
    var SW = ROOM.z + 2.6; // sidewalk centre line
    // pavement with a kerb, tarmac with a centre line and a parking bay, a drain grate
    var pav = new THREE.Mesh(new THREE.PlaneGeometry(90, 3.2), MAT.pavement); pav.rotation.x = -Math.PI / 2; pav.position.set(0, 0.09, SW); pav.receiveShadow = true; world.group.add(pav);
    box(90, 0.1, 3.2, colorMat(0x8e8e88, 1), 0, 0.04, SW, { cast: false });
    box(90, 0.12, 0.2, colorMat(0xc9c9c0, 0.9), 0, 0.06, SW + 1.7, { cast: false });
    var road = new THREE.Mesh(new THREE.PlaneGeometry(90, 9), MAT.asphalt); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.005, SW + 6.3); road.receiveShadow = true; world.group.add(road);
    for (var i = -44; i < 44; i += 3) box(1.6, 0.01, 0.12, colorMat(0xe8e0a0, 0.9), i, 0.012, SW + 6.3, { cast: false });
    for (var pb = -16; pb <= 16; pb += 5.5) box(0.1, 0.01, 2.4, colorMat(0xe8e8e8, 0.9), pb, 0.012, SW + 3.1, { cast: false });
    box(0.5, 0.02, 0.3, MAT.black, 3, 0.1, SW + 1.55, { cast: false }); for (var gr = 0; gr < 5; gr++) box(0.04, 0.01, 0.26, colorMat(0x8a8f96, 0.5, 0.6), 2.82 + gr * 0.09, 0.115, SW + 1.55, { cast: false });
    box(1.6, 0.06, 1.4, colorMat(0xa8a49a, 0.9), 0, 0.02, ROOM.z + 0.75, { cast: false });
    // street lamps: tapered post, arm, glowing head
    world.streetLights = world.streetLights || [];
    [-7, 7].forEach(function (x) { cyl(0.05, 0.08, 3.8, colorMat(0x2a2d33, 0.5, 0.6), x, 1.9, SW + 1.5, null, 10); cyl(0.14, 0.16, 0.08, colorMat(0x2a2d33, 0.5, 0.6), x, 0.04, SW + 1.5, null, 12); var arm = box(0.06, 0.06, 0.8, colorMat(0x2a2d33, 0.5, 0.6), x, 3.75, SW + 1.15); var head = box(0.5, 0.14, 0.32, colorMat(0x2a2d33, 0.5, 0.6), x, 3.72, SW + 0.75); var lens = box(0.44, 0.02, 0.26, glowMat(0xfff2c0, 1.4), x, 3.64, SW + 0.75, { cast: false }); (world.lampFixtures = world.lampFixtures || []).push(lens); var l = new THREE.PointLight(0xfff2c0, 0.6, 10, 1.5); l.position.set(x, 3.4, SW + 0.9); scene.add(l); world.streetLights.push(l); });
    // delivery van parked along the kerb (long axis along x): body, cab, glass, lights, mirrors, wheels with rims, roof rack, side logo
    var van = new THREE.Group(); van.position.set(-9.5, 0, SW + 3.1); world.group.add(van); world.van = van;
    vanBody(van, ['GROW CO.', 'supply run · 24h']);
    var glassM = new THREE.MeshPhysicalMaterial({ color: 0x8fb8d8, transparent: true, opacity: 0.55, roughness: 0.05, metalness: 0.3 });   // street furniture glass (the van keeps its own)
    // street furniture: bench, bin, hydrant, bike rack with a bike, a newspaper box, a young tree in a grate
    box(1.6, 0.06, 0.45, MAT.wood, 4.5, 0.55, SW - 1.1, { cast: true }); for (var sl = 0; sl < 3; sl++) box(1.6, 0.08, 0.05, MAT.wood, 4.5, 0.72 + sl * 0.1, SW - 1.32 - sl * 0.01); [3.9, 5.1].forEach(function (x) { box(0.06, 0.5, 0.45, colorMat(0x2a2d33, 0.4, 0.6), x, 0.3, SW - 1.1); box(0.06, 0.45, 0.06, colorMat(0x2a2d33, 0.4, 0.6), x, 0.75, SW - 1.3); });
    cyl(0.25, 0.22, 0.8, colorMat(0x2f5a2f, 0.6), -3.5, 0.45, SW - 1.2); cyl(0.26, 0.26, 0.04, colorMat(0x1f3f1f, 0.6), -3.5, 0.87, SW - 1.2); cyl(0.12, 0.2, 0.03, MAT.black, -3.5, 0.87, SW - 1.2, null, 16); box(0.18, 0.05, 0.02, MAT.white, -3.5, 0.5, SW - 0.98, { cast: false });
    var hyd = new THREE.Group(); hyd.position.set(-1.8, 0, SW + 1.3); world.group.add(hyd); var hM = colorMat(0xc9302c, 0.4, 0.2); [[0.13, 0.15, 0.5, 0.35], [0.16, 0.16, 0.06, 0.62], [0.11, 0.11, 0.25, 0.77]].forEach(function (p) { var m = new THREE.Mesh(new THREE.CylinderGeometry(p[0], p[1], p[2], 14), hM); m.position.y = p[3]; m.castShadow = true; hyd.add(m); }); var cap = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), hM); cap.position.y = 0.9; hyd.add(cap); [0.16, -0.16].forEach(function (x) { var n = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.14, 10), hM); n.rotation.z = Math.PI / 2; n.position.set(x, 0.62, 0); hyd.add(n); var nc = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 8), colorMat(0x8a2a26, 0.5)); nc.rotation.z = Math.PI / 2; nc.position.set(x * 1.4, 0.62, 0); hyd.add(nc); }); var nose = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.12, 10), hM); nose.rotation.x = Math.PI / 2; nose.position.set(0, 0.62, 0.15); hyd.add(nose);
    var rack = new THREE.Group(); rack.position.set(8.5, 0, SW + 1.0); world.group.add(rack); for (var b = 0; b < 3; b++) { var hoop = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.025, 8, 20, Math.PI), colorMat(0x8a8f96, 0.4, 0.8)); hoop.position.set(b * 0.8, 0.35, 0); rack.add(hoop); }
    var bike = new THREE.Group(); bike.position.set(8.9, 0, SW + 0.6); bike.rotation.y = 0.15; world.group.add(bike); var bM = colorMat(0x2f6b9a, 0.4, 0.4); [[-0.5, 0], [0.5, 0]].forEach(function (w) { var wh = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.02, 8, 24), colorMat(0x1a1a1a, 0.9)); wh.position.set(w[0], 0.34, 0); bike.add(wh); for (var sp = 0; sp < 8; sp++) { var s = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.6, 0.004), MAT.chrome); s.position.set(w[0], 0.34, 0); s.rotation.z = sp * Math.PI / 8; bike.add(s); } }); [[-0.25, 0.5, 0.25, 0.9, 0.5], [-0.25, 0.5, -0.5, 0.34, 0.3], [0.25, 0.9, 0.5, 0.34, 0.6], [0.25, 0.9, -0.25, 0.5, 0.65], [0.25, 0.9, 0.35, 1.0, 0.15]].forEach(function (t) { var len = Math.hypot(t[2] - t[0], t[3] - t[1]); var tube = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, len, 8), bM); tube.position.set((t[0] + t[2]) / 2, (t[1] + t[3]) / 2, 0); tube.rotation.z = Math.atan2(t[2] - t[0], t[3] - t[1]) * -1; bike.add(tube); }); var seat = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.1), MAT.black); seat.position.set(-0.25, 0.95, 0); bike.add(seat); var bars = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 8), MAT.chrome); bars.rotation.x = Math.PI / 2; bars.position.set(0.35, 1.02, 0); bike.add(bars);
    var nbox = box(0.5, 1.0, 0.45, colorMat(0x2f6b9a, 0.4, 0.3), -5.5, 0.5, SW + 1.2, { cast: true }); box(0.4, 0.5, 0.02, glassM, -5.5, 0.65, SW + 0.97, { cast: false }); signPlane(['GROW', 'weekly'], 0.4, 0.2, -5.5, 0.35, SW + 0.97, Math.PI, { size: 30, bg: '#ffc857', color: '#332200', titleColor: '#332200', line: 'rgba(0,0,0,0)' });
    var treeG = new THREE.Group(); treeG.position.set(12, 0, SW + 1.0); world.group.add(treeG); var grate = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.02, 20), MAT.black); grate.position.y = 0.1; treeG.add(grate); plantTree('broad', 12, SW + 1.0, 0.72);
    world.sidewalkZ = SW;
    [[3.7, 5.3, SW - 1.4, SW - 0.8], [-3.85, -3.15, SW - 1.55, SW - 0.85], [-2.05, -1.55, SW + 1.05, SW + 1.55], [-5.8, -5.2, SW + 0.95, SW + 1.45], [8.3, 10.4, SW + 0.55, SW + 1.3], [11.35, 12.65, SW + 0.35, SW + 1.65], [-7.25, -6.75, SW + 1.25, SW + 1.75], [6.75, 7.25, SW + 1.25, SW + 1.75]].forEach(function (o) { world.obstacles.push({ x1: o[0], x2: o[1], z1: o[2], z2: o[3], tag: 'street', floorLevel: 0 }); });   // bench, bin, hydrant, paper box, bike rack, tree, lamp posts
    for (var p = 0; p < 9; p++) spawnPed();
    for (var cp = 0; cp < 16; cp++) spawnCityPed(true);
  }
  function spawnPed() {
    var spec = { skin: pick(SKINS), hair: pick(HAIRS), shirt: pick(SHIRTS), pants: pick(PANTS), hat: pick([null, null, null, 'cap', 'beanie']), capColor: pick(SHIRTS), prop: pick([null, null, 'bag', 'phone', 'coffee']), glasses: Math.random() < 0.25, longSleeve: Math.random() < 0.6, hairStyle: pick(['short', 'short', 'long', 'bun', 'afro', 'ponytail']), backpack: Math.random() < 0.25, backpackColor: pick(SHIRTS), watch: Math.random() < 0.3, socks: Math.random() < 0.3, freckles: Math.random() < 0.2, lipstick: Math.random() < 0.25, earrings: Math.random() < 0.25, coat: Math.random() < 0.2 ? pick([0x2a2d33, 0x6b5a3a, 0x8a2a2a]) : undefined, skirt: Math.random() < 0.2 ? pick(SHIRTS) : undefined, beard: Math.random() < 0.2, logo: Math.random() < 0.2 ? pick(['🌿', '420', 'RF', '★']) : undefined, eyeColor: pick(['#3a5a8a', '#2a6a3a', '#6a4a2a', '#4a4a4a']) };
    var h = makeHuman(spec); var dir = Math.random() < 0.5 ? 1 : -1; var z = world.sidewalkZ - 0.8 + Math.random() * 1.6;
    h.position.set(-dir * (18 + Math.random() * 16), 0, z); h.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2; world.group.add(h);
    peds.push({ h: h, dir: dir, speed: 0.9 + Math.random() * 0.7, pauseT: 0, z: z });
  }

  // ── town walkers: people on every pavement in town, so the streets are not empty when you drive out ──
  var cityPeds = [], CITY_PED_MAX = 18;
  function cityLanes() { var C = CITY, L = [{ axis: 'x', c: C.mainZ + 6.1 }]; [C.backZ, C.northZ].forEach(function (z) { L.push({ axis: 'x', c: z - 6.1 }); L.push({ axis: 'x', c: z + 6.1 }); }); [C.westX, C.eastX].forEach(function (x) { L.push({ axis: 'z', c: x - 6.1 }); L.push({ axis: 'z', c: x + 6.1 }); }); return L; }
  function spawnCityPed(scatter) {
    var C = CITY, ln = pick(cityLanes()), lo = ln.axis === 'x' ? -C.x + 6 : C.z1 + 6, hi = ln.axis === 'x' ? C.x - 6 : C.z2 - 6, dir = Math.random() < 0.5 ? 1 : -1;
    var spec = { skin: pick(SKINS), hair: pick(HAIRS), shirt: pick(SHIRTS), pants: pick(PANTS), hat: pick([null, null, null, 'cap', 'beanie']), capColor: pick(SHIRTS), prop: pick([null, null, 'bag', 'phone', 'coffee']), glasses: Math.random() < 0.25, longSleeve: Math.random() < 0.6, hairStyle: pick(['short', 'short', 'long', 'bun', 'afro', 'ponytail']), backpack: Math.random() < 0.25, backpackColor: pick(SHIRTS), watch: Math.random() < 0.3, socks: Math.random() < 0.3, freckles: Math.random() < 0.2, lipstick: Math.random() < 0.25, earrings: Math.random() < 0.25, coat: Math.random() < 0.2 ? pick([0x2a2d33, 0x6b5a3a, 0x8a2a2a]) : undefined, skirt: Math.random() < 0.2 ? pick(SHIRTS) : undefined, beard: Math.random() < 0.2, logo: Math.random() < 0.2 ? pick(['🌿', '420', 'RF', '★']) : undefined, eyeColor: pick(['#3a5a8a', '#2a6a3a', '#6a4a2a', '#4a4a4a']) };
    var h = makeHuman(spec), off = randf(-0.9, 0.9), t = scatter ? randf(lo, hi) : (dir > 0 ? lo : hi);
    if (ln.axis === 'x') { h.position.set(t, 0, ln.c + off); h.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2; } else { h.position.set(ln.c + off, 0, t); h.rotation.y = dir > 0 ? 0 : Math.PI; }
    h.traverse(function (o) { o.layers.set(TOWN_LAYER); }); world.group.add(h);
    cityPeds.push({ h: h, ln: ln, dir: dir, speed: 0.9 + Math.random() * 0.7, pauseT: 0, lo: lo, hi: hi });
  }
  function updateCityPeds(dt) {
    var pp = drive.on ? drive.g.position : player.pos;
    for (var i = 0; i < cityPeds.length; i++) {
      var p = cityPeds[i], h = p.h, dx = h.position.x - pp.x, dz = h.position.z - pp.z, near = dx * dx + dz * dz < 80 * 80;   /* far walkers still move, they just skip the animation */
      if (p.pauseT > 0) { p.pauseT -= dt; if (near) animateHuman(h, dt, 'idle', 0, null); continue; }
      if (p.ln.axis === 'x') h.position.x += p.dir * p.speed * dt; else h.position.z += p.dir * p.speed * dt;
      if (near) animateHuman(h, dt, 'walk', p.speed, null);
      if (Math.random() < 0.0015) p.pauseT = 2 + Math.random() * 3;
      var t = p.ln.axis === 'x' ? h.position.x : h.position.z; if (t < p.lo - 2 || t > p.hi + 2) { world.group.remove(h); disposeTree(h); cityPeds.splice(i, 1); i--; spawnCityPed(false); }
    }
    if (cityPeds.length < CITY_PED_MAX && Math.random() < 0.01) spawnCityPed(false);
  }
  function updatePeds(dt) {
    for (var i = 0; i < peds.length; i++) {
      var p = peds[i]; var h = p.h;
      if (p.pauseT > 0) { p.pauseT -= dt; animateHuman(h, dt, 'idle', 0, player.pos); if (p.pauseT <= 0) h.rotation.y = p.dir > 0 ? Math.PI / 2 : -Math.PI / 2; continue; }
      h.position.x += p.dir * p.speed * dt; animateHuman(h, dt, 'walk', p.speed, null);
      if (Math.abs(h.position.x) < 5 && Math.random() < 0.004) { p.pauseT = 2 + Math.random() * 4; h.rotation.y = Math.PI; }
      if (Math.abs(h.position.x) > 40) { world.group.remove(h); disposeTree(h); peds.splice(i, 1); i--; spawnPed(); }
    }
    if (peds.length < 11 && Math.random() < 0.006) spawnPed();
    updateCityPeds(dt);
  }
  // ── Room dressing (hall lounge, fridge, clock, posters) ────────────
  function buildProps() {
    var clockG = new THREE.Group(); clockG.position.set(-3.0, 2.7, 3.88); world.group.add(clockG);
    var face = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 24), new THREE.MeshStandardMaterial({ color: 0xf5f5f0 })); face.rotation.x = Math.PI / 2; clockG.add(face);
    var rim = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.02, 8, 24), MAT.black); clockG.add(rim);
    world.clockHands = { h: new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.01), MAT.black), m: new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.18, 0.01), MAT.black) };
    world.clockHands.h.position.set(0, 0, -0.03); world.clockHands.m.position.set(0, 0, -0.035); world.clockHands.h.geometry.translate(0, 0.06, 0); world.clockHands.m.geometry.translate(0, 0.09, 0); clockG.add(world.clockHands.h); clockG.add(world.clockHands.m);
    var shN = STRAINS.length, shGap = Math.min(0.62, 4.6 / Math.max(1, shN - 1)), shW = Math.min(0.5, shGap * 0.82);
    STRAINS.forEach(function (s, i) { var px = -(shN - 1) / 2 * shGap + i * shGap; var sheet = new THREE.Mesh(new THREE.PlaneGeometry(shW, shW * 1.4), new THREE.MeshStandardMaterial({ map: textTex(['STRAIN ' + (i + 1), s.emoji, s.name, s.thc.toFixed(1) + '× · ' + s.yield + 'g'], 384, 540, { size: 44, titleColor: '#8a8a8a', bg: '#f0ead8', color: '#2a2a2a', line: 'rgba(0,0,0,0)' }), roughness: 0.9 })); sheet.position.set(px, 2.25, -1.88); sheet.rotation.z = (i % 2 ? 0.02 : -0.02); world.group.add(sheet); var pin = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), new THREE.MeshStandardMaterial({ color: 0xc94a3a })); pin.position.set(px, 2.58, -1.87); world.group.add(pin); });
  }
  function syncRack() {
    if (!propInst.rack) return; var g = propInst.rack.ctx.dynGroup(); clearKids(g);
    world.interact = world.interact.filter(function (m) { return m.userData.dynGroup !== 'rack'; });
    var rx = 0, rz = 0;
    var soil = Math.min(S.supplies.soil || 0, 6);
    for (var i = 0; i < soil; i++) { var sack = productSoilSack(1.5); sack.position.set(rx - 0.32 + (i % 3) * 0.3, 0.41, rz - 0.1 + Math.floor(i / 3) * 0.2); sack.rotation.y = ((i % 3) - 1) * 0.08; sack.rotation.y = (i % 2) * 0.2; sack.castShadow = true; g.add(sack); }
    var nut = Math.min(S.supplies.nutrients || 0, 5), spr = Math.min(S.supplies.remedy || 0, 4);
    for (var n = 0; n < nut; n++) { var bt = productNutrientBottle(1.35); bt.position.set(rx - 0.36 + n * 0.1, 0.88, rz - 0.1); bt.rotation.y = n * 0.5; g.add(bt); }
    for (var sI = 0; sI < spr; sI++) { var sb = productSprayBottle(1.3); sb.position.set(rx + 0.1 + sI * 0.1, 0.9, rz + 0.1); sb.rotation.y = Math.PI + sI * 0.3; g.add(sb); }
    if ((S.supplies.bag || 0) > 0) { var bx = cartonBox(0.22, 0.14, 0.16, ['BAGGIES', 'x100'], 0xe8e8ee, '#3a4a42'); bx.position.set(rx - 0.3, 1.44, rz + 0.1); g.add(bx); }
    if ((S.supplies.paper || 0) > 0) { var px = cartonBox(0.16, 0.08, 0.12, ['PAPERS', 'king size'], 0xf5e6c8, '#5a4a2a'); px.position.set(rx, 1.41, rz + 0.12); g.add(px); }
    if ((S.supplies.tip || 0) > 0) { var tx = cartonBox(0.12, 0.08, 0.12, ['TIPS', 'filter'], 0xc8b48a, '#4a3a22'); tx.position.set(rx + 0.25, 1.41, rz + 0.12); g.add(tx); }
    var spare = Math.min(Math.max(0, (S.supplies.pot || 0) - S.plants.length), 4);
    for (var pI = 0; pI < spare; pI++) { var pt = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.14, 14), MAT.pot); pt.position.set(rx - 0.3 + pI * 0.2, 1.93, rz); g.add(pt); }
    var jars = Math.min(S.supplies.jar || 0, 3); for (var jI = 0; jI < jars; jI++) { var jr = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.14, 12), MAT.jar); jr.position.set(rx + 0.2 + jI * 0.14, 1.93, rz + 0.12); g.add(jr); }
    var sx2 = 0; STRAINS.forEach(function (st) { var n = S.supplies['seed_' + st.id] || 0; if (!n) return; var pk = productSeedPacket(st, 1.35); pk.position.set(rx - 0.36 + (sx2 % 6) * 0.16, 1.48 - Math.floor(sx2 / 6) * 0.19, rz - 0.15);   /* six to a row, then the next shelf down */ pk.rotation.x = -0.35; g.add(pk); var ph = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.16, 0.12), MAT.none); ph.position.copy(pk.position); g.add(ph); interactable(ph, { kind: 'rackItem', item: 'seed_' + st.id, label: st.name + ' seed' }); ph.userData.dynGroup = 'rack'; ph.userData.propId = 'rack'; sx2++; });
    if (soil > 0) { var sh = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.3, 0.44), MAT.none); sh.position.set(rx, 0.42, rz); g.add(sh); interactable(sh, { kind: 'rackItem', item: 'soil', label: 'bag of soil' }); sh.userData.dynGroup = 'rack'; sh.userData.propId = 'rack'; }
    if (nut > 0) { var nh = new THREE.Mesh(new THREE.BoxGeometry(0.1 * nut + 0.04, 0.18, 0.1), MAT.none); nh.position.set(rx - 0.36 + (nut - 1) * 0.05, 0.9, rz - 0.1); g.add(nh); interactable(nh, { kind: 'rackItem', item: 'nutrients', label: 'nutrients' }); nh.userData.dynGroup = 'rack'; nh.userData.propId = 'rack'; }
    if (spr > 0) { var rh = new THREE.Mesh(new THREE.BoxGeometry(0.1 * spr + 0.04, 0.22, 0.1), MAT.none); rh.position.set(rx + 0.1 + (spr - 1) * 0.05, 0.94, rz + 0.1); g.add(rh); interactable(rh, { kind: 'rackItem', item: 'remedy', label: 'pest spray' }); rh.userData.dynGroup = 'rack'; rh.userData.propId = 'rack'; }
      g.traverse(function (o) { if (o.isMesh) o.userData.propId = 'rack'; });
  }
  function registerSale(text) { if (!world.reg) return; world.reg.lastSale = text; world.reg.drawerT = 1; drawRegister(); sfx('drawer'); }
  function updateProps(dt) {
    if (world.reg && world.reg.drawer) { var open = world.reg.drawerT > 0 ? 1 : 0; world.reg.drawerT = Math.max(0, world.reg.drawerT - dt * 0.35); world.reg.drawer.position.z = (world.reg.drawerZ !== undefined ? world.reg.drawerZ : 3.55) - lerp(0, 0.22, clamp(world.reg.drawerT * 4, 0, 1)); }
    if (world.clipFan) world.clipFan.rotation.z += dt * 22;
    cabinetTick(dt);
    if (world.fanBlades) { world.fanBlades.rotation.z += dt * 18; world.fanHead.rotation.y = world.fanBaseYaw + Math.sin(world.time * 0.6) * 0.6; }
    if (world.clockHands) { var d = new Date(); world.clockHands.m.rotation.z = -d.getMinutes() / 60 * Math.PI * 2; world.clockHands.h.rotation.z = -((d.getHours() % 12) + d.getMinutes() / 60) / 12 * Math.PI * 2; }
    updateGuard(dt); updateWorker(dt);
  }


