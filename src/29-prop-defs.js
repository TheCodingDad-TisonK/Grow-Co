//@ prop definitions
  // ── prop definitions ───────────────────────────────────────────────
  // Every prop is built with its FRONT toward local +z. rot (quarter turns) then points that front into the room:
  // rot 0 → +z (things against the back walls), rot 1 → +x (left wall), rot 2 → -z (front wall), rot 3 → -x (right wall).
  var lampM = new THREE.MeshStandardMaterial({ color: 0x3aa36a, side: THREE.DoubleSide, roughness: 0.6 });
  function legs4(c, w, d, h, mat, inset, thick) { inset = inset || 0.06; thick = thick || 0.05; [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (l) { c.box(thick, h, thick, mat, l[0] * (w / 2 - inset), h / 2, l[1] * (d / 2 - inset)); }); }
  function drawer(c, w, h, d, x, y, z, mat) { c.box(w, h, d, mat || MAT.darkwood, x, y, z); c.box(w - 0.04, h - 0.04, 0.01, MAT.wood, x, y, z + d / 2 + 0.004, { cast: false }); c.box(0.12, 0.018, 0.02, MAT.chrome, x, y, z + d / 2 + 0.02, { cast: false }); }
  function chair(c, x, z, rotY, seatM, frameM) {
    var g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY || 0; c.add(g);
    function m(geo, mat, px, py, pz) { var mm = new THREE.Mesh(geo, mat); mm.position.set(px, py, pz); mm.castShadow = true; g.add(mm); return mm; }
    m(new THREE.BoxGeometry(0.44, 0.05, 0.44), seatM, 0, 0.45, 0); m(new THREE.BoxGeometry(0.44, 0.06, 0.4), seatM, 0, 0.5, 0.01);
    var back = m(new THREE.BoxGeometry(0.42, 0.42, 0.04), seatM, 0, 0.74, -0.2); back.rotation.x = -0.08;
    [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]].forEach(function (l) { m(new THREE.CylinderGeometry(0.018, 0.018, 0.45, 8), frameM || MAT.chrome, l[0], 0.225, l[1]); });
    c.solid(x - 0.25, x + 0.25, z - 0.25, z + 0.25);
    return g;
  }
  function officeChairBuild(c) {
    var seatM = fabricMat(0x24272c); c.cyl(0.03, 0.03, 0.3, MAT.chrome, 0, 0.3, 0, 10); c.cyl(0.05, 0.06, 0.06, MAT.plastic, 0, 0.13, 0, 12);
    for (var i = 0; i < 5; i++) { var a = i / 5 * Math.PI * 2; var arm = c.box(0.32, 0.03, 0.05, MAT.plastic, Math.cos(a) * 0.16, 0.08, Math.sin(a) * 0.16); arm.rotation.y = -a; var wh = c.cyl(0.03, 0.03, 0.03, MAT.black, Math.cos(a) * 0.3, 0.03, Math.sin(a) * 0.3, 10); wh.rotation.z = Math.PI / 2; wh.rotation.y = -a; }
    c.box(0.5, 0.08, 0.5, seatM, 0, 0.49, 0); c.box(0.48, 0.5, 0.08, seatM, 0, 0.8, 0.24).rotation.x = 0.12; c.box(0.4, 0.14, 0.04, seatM, 0, 1.06, 0.27);
    [-0.28, 0.28].forEach(function (x) { c.box(0.04, 0.2, 0.04, MAT.plastic, x, 0.6, -0.05); c.box(0.06, 0.03, 0.26, MAT.plastic, x, 0.7, 0); });
    c.solid(-0.3, 0.3, -0.3, 0.3);
  }
  defProp('officeDesk', { label: 'office desk', x: -ROOM.x + 0.55, z: 1.0, rot: 1, build: function (c) {
    // desk along local x, laptop faces the chair at +z; drawers on the right, cable tidy, lamp, mug, notepad
    c.box(1.6, 0.05, 0.72, MAT.wood, 0, 0.78, 0, { solid: true }); c.box(1.62, 0.02, 0.74, MAT.darkwood, 0, 0.745, 0, { cast: false });
    c.box(0.06, 0.78, 0.06, MAT.metal, -0.74, 0.39, -0.3); c.box(0.06, 0.78, 0.06, MAT.metal, -0.74, 0.39, 0.3); c.box(0.06, 0.02, 0.6, MAT.metal, -0.74, 0.01, 0);
    c.box(0.45, 0.7, 0.66, MAT.darkwood, 0.55, 0.36, 0, { cast: false }); drawer(c, 0.41, 0.18, 0.62, 0.55, 0.6, 0); drawer(c, 0.41, 0.18, 0.62, 0.55, 0.38, 0); drawer(c, 0.41, 0.18, 0.62, 0.55, 0.16, 0);
    // the PC: a monitor on a stand, a keyboard and a tower under the desk; sit at the desk and E on it brings up its desktop
    var pcM = colorMat(0x1b1f24, 0.4, 0.5); c.box(0.2, 0.015, 0.14, pcM, -0.15, 0.815, -0.12, { cast: false }); c.cyl(0.02, 0.025, 0.12, MAT.chrome, -0.15, 0.88, -0.14, 10);
    var pcMon = c.box(0.5, 0.31, 0.02, pcM, -0.15, 1.09, -0.14); pcMon.rotation.x = -0.08;
    var pcScr = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.27), new THREE.MeshBasicMaterial({ map: textTex(['GROW CO. OS', 'sit down and press E'], 460, 270, { size: 34, bg: '#0d1a26', color: '#8fb8d8', titleColor: '#6fdc8c' }) })); pcScr.position.set(-0.15, 1.09, -0.128); pcScr.rotation.x = -0.08; c.add(pcScr);
    c.box(0.38, 0.012, 0.13, colorMat(0x2a2f36, 0.5), -0.15, 0.816, 0.12, { cast: false }); for (var kr = 0; kr < 4; kr++) for (var kc = 0; kc < 12; kc++) c.box(0.024, 0.004, 0.022, colorMat(0x3a3f46, 0.5), -0.31 + kc * 0.029, 0.824, 0.075 + kr * 0.028, { cast: false });
    c.box(0.18, 0.42, 0.42, pcM, -0.35, 0.22, -0.05); c.box(0.02, 0.01, 0.06, glowMat(0x6fdc8c, 1), -0.26, 0.38, 0.15, { cast: false });
    c.hit(0.56, 0.4, 0.3, -0.15, 1.05, -0.1, { kind: 'laptop', label: 'PC', prompt: 'Use the PC' });
    var mouse = c.box(0.06, 0.025, 0.1, colorMat(0xe8e8ec, 0.4), 0.15, 0.82, 0.1); mouse.rotation.y = 0.2;
    c.cyl(0.03, 0.03, 0.4, MAT.chrome, -0.65, 1.0, -0.2, 8); c.cyl(0.07, 0.08, 0.02, MAT.plastic, -0.65, 0.81, -0.2, 16); var shade = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.16, 16, 1, true), lampM); shade.position.set(-0.65, 1.22, -0.2); shade.rotation.z = 0.25; c.add(shade); var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), glowMat(0xffe9b0, 1.2)); bulb.position.set(-0.62, 1.18, -0.2); c.add(bulb);
    c.light(new THREE.PointLight(0xffe0a8, 0.35, 2.5), -0.6, 1.15, -0.1);
    c.cyl(0.04, 0.035, 0.09, colorMat(0xf5f5f0, 0.5), 0.2, 0.85, -0.2, 14); var hdl = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.007, 6, 12, Math.PI), colorMat(0xf5f5f0, 0.5)); hdl.position.set(0.24, 0.85, -0.2); hdl.rotation.y = Math.PI / 2; c.add(hdl);
    c.box(0.16, 0.01, 0.22, MAT.white, 0.2, 0.81, 0.15, { cast: false }); c.box(0.14, 0.002, 0.2, new THREE.MeshBasicMaterial({ map: textTex(['to do', 'water · feed', 'order soil', 'call supplier'], 140, 200, { size: 24, bg: '#fffbe6', color: '#333', titleColor: '#1a6a2a', line: 'rgba(0,0,0,0)' }) }), 0.2, 0.816, 0.15, { cast: false }); var pen = c.cyl(0.005, 0.005, 0.14, colorMat(0x2a4a8a, 0.4), 0.3, 0.815, 0.15, 6); pen.rotation.set(Math.PI / 2, 0, 0.3);
    c.box(0.24, 0.12, 0.16, MAT.plastic, -0.55, 0.86, 0.22); c.box(0.2, 0.01, 0.12, MAT.white, -0.55, 0.925, 0.22, { cast: false }); c.box(0.02, 0.01, 0.06, glowMat(0x6fdc8c, 1), -0.45, 0.925, 0.28, { cast: false });   // small printer
    c.box(0.1, 0.06, 0.04, MAT.black, -0.1, 0.5, -0.33, { cast: false }); c.cyl(0.008, 0.008, 0.5, MAT.black, -0.1, 0.25, -0.35, 5);   // cable tidy + power lead
    c.box(1.62, 0.05, 0.05, MAT.darkwood, 0, 0.755, -0.37, { cast: false });
    officeChairBuild({ box: function (w, h, d, mat, x, y, z, o) { return c.box(w, h, d, mat, x, y + 0, z + 0.75, o); }, cyl: function (rt, rb, h, mat, x, y, z, s) { return c.cyl(rt, rb, h, mat, x, y, z + 0.75, s); }, solid: function (a, b, d, e) { c.solid(a, b, d + 0.75, e + 0.75); } });
    c.placard(['SUPPLY DESK', 'the PC: shop · seeds · gear'], 0.6, 0.2, 0.55, 1.05, -0.2, { titleColor: '#6fdc8c' });
  } });
  defProp('tabletDock', { label: 'tablet dock', x: -10.4, z: 3.55, rot: 2, build: function (c) {
    // a charging plinth against the office wall: the tablet stands in the cradle, screen out, until you take it
    var body = colorMat(0x2b2f35, 0.55, 0.3);
    c.box(0.52, 0.05, 0.36, MAT.darkwood, 0, 0.93, 0, { cast: false }); c.box(0.54, 0.02, 0.38, MAT.darkwood, 0, 0.955, 0, { cast: false });
    c.box(0.44, 0.9, 0.3, body, 0, 0.47, 0.02, { cast: true }); c.box(0.56, 0.04, 0.4, MAT.metal, 0, 0.03, 0.02, { cast: false });
    c.box(0.46, 0.5, 0.02, colorMat(0x1b1f24, 0.7), 0, 0.5, -0.16, { cast: false });   /* recessed back so the plinth is not one flat slab */
    c.box(0.36, 0.035, 0.11, MAT.metal, 0, 0.965, -0.05, { cast: false });   /* the cradle lip the tablet leans in */
    var lit = hasLic('tobacco'), inDock = xs().tablet === 'dock';
    var tg = new THREE.Group(); tg.position.set(0, 0.975, -0.05); tg.rotation.x = -0.3; tg.userData.tabletBody = true; tg.userData.builtLit = lit; c.add(tg);
    var shell = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.28, 0.016), colorMat(0x1b1f24, 0.4, 0.5)); shell.position.y = 0.13; shell.castShadow = true; tg.add(shell);
    var scr = new THREE.Mesh(new THREE.PlaneGeometry(0.345, 0.245), lit ? new THREE.MeshBasicMaterial({ map: textTex(['RF SMOKING', 'delivery round'], 300, 210, { size: 34, bg: '#0d1511', color: '#8fa596', titleColor: '#ffc857' }) }) : MAT.screen);
    scr.position.set(0, 0.13, 0.01); tg.add(scr);
    c.cyl(0.016, 0.016, 0.02, glowMat(lit ? 0x6fdc8c : 0xd0201a, 1.4), 0.21, 0.962, 0.1, 10);   /* charge light: green once the licence is in */
    c.sign(['DELIVERY ROUND'], 0.40, 0.072, 0, 0.74, 0.178, 0, { size: 13, titleColor: '#ffc857', bg: '#141a16' });   /* the plinth front face is at z 0.17, and the plate is only 128 px wide: one short line at 13 px is what fits */
    c.solid(-0.27, 0.27, -0.2, 0.2);
    c.hit(0.56, 0.9, 0.44, 0, 0.72, 0.02, { kind: 'tabletDock' });
  } });
  defProp('rack', { label: 'supply rack', x: -ROOM.x + 0.45, z: -1.0, rot: 1, build: function (c) {
    var shelfM = colorMat(0x8a8f96, 0.35, 0.8); for (var s = 0; s < 4; s++) { c.box(0.9, 0.03, 0.5, shelfM, 0, 0.25 + s * 0.55, 0); c.box(0.9, 0.04, 0.02, MAT.plastic, 0, 0.245 + s * 0.55, 0.25, { cast: false }); var lbl = c.sign([['SOIL', 'FEED · SPRAY', 'PAPERS · BAGS', 'POTS · JARS'][s]], 0.16, 0.03, -0.34, 0.245 + s * 0.55, 0.262, 0, { size: 13, bg: '#f3e9cf', color: '#222', titleColor: '#222', line: 'rgba(0,0,0,.3)' }); }
    [[-0.44, -0.24], [0.44, -0.24], [-0.44, 0.24], [0.44, 0.24]].forEach(function (p) { c.box(0.035, 2.0, 0.035, shelfM, p[0], 1.0, p[1]); for (var h = 0; h < 12; h++) c.box(0.012, 0.008, 0.036, MAT.black, p[0], 0.1 + h * 0.16, p[1], { cast: false }); c.cyl(0.03, 0.035, 0.02, MAT.plastic, p[0], 0.01, p[1], 10); });
    c.box(0.9, 0.03, 0.03, shelfM, 0, 2.0, -0.24); c.box(0.9, 0.03, 0.03, shelfM, 0, 2.0, 0.24);
    c.solid(-0.5, 0.5, -0.3, 0.3); c.hit(0.9, 2.0, 0.5, 0, 1.0, 0, { kind: 'inventory', label: 'Supply rack', prompt: 'Check stock' });
    c.sign(['SUPPLIES', 'soil · nutrients · spray · seeds'], 0.9, 0.3, 0, 2.2, 0.02, 0, { titleColor: '#6fdc8c' }); c.dynGroup();
  }, after: function () { syncRack(); } });
  defProp('cabinet', { label: 'filing cabinet', x: -4.6, z: 3.3, rot: 3, build: function (c) {
    var cabM = colorMat(0x6a7078, 0.45, 0.4); c.box(0.5, 1.2, 0.6, cabM, 0, 0.6, 0, { solid: true });
    [0.22, 0.6, 0.98].forEach(function (y) { c.box(0.44, 0.32, 0.02, cabM, 0, y, 0.305); c.box(0.16, 0.025, 0.02, MAT.chrome, 0, y + 0.1, 0.32, { cast: false }); c.box(0.1, 0.05, 0.005, MAT.white, 0.12, y - 0.06, 0.318, { cast: false }); });
    c.box(0.36, 0.006, 0.26, MAT.white, 0, 1.204, 0.05, { cast: false }); c.box(0.3, 0.02, 0.2, colorMat(0xf5f5f0), 0, 1.21, 0.05, { cast: false });   // paper tray
    c.fern(0, 1.21, 0.4);
  } });
  function bookshelfBuild(c, w, h, rows) {
    // open carcass (sides, base, back) so the books on the shelves are actually visible; the old solid block hid them
    [-1, 1].forEach(function (sd) { c.box(0.06, h, 0.3, MAT.darkwood, sd * (w / 2 - 0.03), h / 2, 0); }); c.box(w, 0.08, 0.3, MAT.darkwood, 0, 0.04, 0); c.box(w, h, 0.05, MAT.darkwood, 0, h / 2, -0.125); c.box(w - 0.12, h - 0.12, 0.01, colorMat(0x2a1c10, 0.8), 0, h / 2, -0.097, { cast: false }); c.solid(-w / 2, w / 2, -0.15, 0.15);
    for (var r = 0; r < rows; r++) { var sy = 0.3 + r * ((h - 0.4) / rows); c.box(w - 0.06, 0.025, 0.28, MAT.wood, 0, sy, 0.01, { cast: false }); var bx = -w / 2 + 0.06; var lean = 0; while (bx < w / 2 - 0.12) { var bw = randf(0.035, 0.08), bh = randf(0.2, 0.32); var bk = c.box(bw, bh, randf(0.16, 0.22), colorMat(pick([0xc94a3a, 0x2f6b9a, 0x3aa36a, 0xe0c25a, 0x7a5aa8, 0xf2f2f2, 0x8a4a2a, 0x1c1c22]), 0.9), bx + bw / 2, sy + bh / 2 + 0.012, 0.03, { cast: false }); if (Math.random() < 0.15 && bx > -w / 2 + 0.2) { bk.rotation.z = 0.18; bk.position.x += 0.02; bx += 0.03; } bx += bw + 0.008; if (Math.random() < 0.12) bx += randf(0.05, 0.12); } if (r === rows - 1) { c.cyl(0.05, 0.04, 0.12, MAT.jar, w / 2 - 0.15, sy + 0.07, 0.05, 12); } }
    c.box(w, 0.06, 0.32, MAT.darkwood, 0, h - 0.03, 0.005);
  }
  defProp('bookshelf', { label: 'bookshelf', x: -4.3, z: -0.9, rot: 3, build: function (c) { bookshelfBuild(c, 1.0, 1.8, 4); } });
  defProp('fernOffice', { label: 'fern', x: -11.5, z: 3.4, build: function (c) { c.fern(0, 0, 1.0); } });
  defProp('fernHall', { label: 'fern', x: 3.6, z: 3.5, build: function (c) { c.fern(0, 0, 0.9); } });
  defProp('fernLobby', { label: 'fern', x: 10.8, z: 5.0, build: function (c) { c.fern(0, 0, 1.1); } });
  function sofaBuild(c, w, seatM, pipeM) {
    var d = 0.85; c.box(w, 0.28, d, seatM, 0, 0.2, 0, { solid: true }); c.box(w, 0.06, d, pipeM, 0, 0.03, 0, { cast: false });
    var n = Math.max(1, Math.round(w / 0.62)); for (var i = 0; i < n; i++) { var cx = -w / 2 + 0.12 + (w - 0.24) * (i + 0.5) / n; var cw = (w - 0.24) / n - 0.03; c.box(cw, 0.16, d - 0.28, seatM, cx, 0.42, 0.08); c.box(cw, 0.42, 0.16, seatM, cx, 0.62, -0.32).rotation.x = -0.1; }
    c.box(w, 0.5, 0.14, seatM, 0, 0.55, -0.4); c.box(0.14, 0.32, d, seatM, -w / 2 + 0.07, 0.5, 0); c.box(0.14, 0.32, d, seatM, w / 2 - 0.07, 0.5, 0);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (l) { c.cyl(0.02, 0.025, 0.08, MAT.darkwood, l[0] * (w / 2 - 0.1), 0.04, l[1] * (d / 2 - 0.1), 8); });
  }
  function coffeeTableBuild(c, x, z, w, d) { c.box(w, 0.035, d, MAT.wood, x, 0.42, z, { solid: true }); c.box(w - 0.1, 0.02, d - 0.1, MAT.darkwood, x, 0.2, z, { cast: false }); legs4({ box: function (a, b, e, m, px, py, pz) { return c.box(a, b, e, m, px + x, py, pz + z); } }, w, d, 0.4, MAT.chrome, 0.06, 0.03); }
  defProp('sofa', { label: 'sofa + coffee table', x: -2.4, z: -1.3, rot: 0, build: function (c) {
    var seatM = fabricMat(0x4a3b5c), pipeM = fabricMat(0x352a42);
    sofaBuild(c, 1.9, seatM, pipeM);
    [-0.5, 0.5].forEach(function (x) { var cu = c.box(0.42, 0.14, 0.42, fabricMat(x < 0 ? 0xe0c25a : 0x3aa36a), x, 0.48, 0.08); cu.rotation.y = x < 0 ? 0.2 : -0.15; });
    coffeeTableBuild(c, 0, 1.15, 1.0, 0.6);
    c.box(0.3, 0.02, 0.22, new THREE.MeshBasicMaterial({ map: textTex(['GROW', 'monthly'], 150, 110, { size: 30, bg: '#6fdc8c', color: '#062010', titleColor: '#062010', line: 'rgba(0,0,0,0)' }) }), -0.15, 0.45, 1.15, { cast: false }); c.box(0.26, 0.015, 0.2, colorMat(0xffc857), -0.05, 0.462, 1.2, { cast: false }).rotation.y = 0.2;
    c.cyl(0.05, 0.04, 0.12, MAT.jar, 0.3, 0.5, 1.25); c.cyl(0.03, 0.03, 0.06, colorMat(0x8a2a2a, 0.5), 0.3, 0.47, 1.25, 10);
    var cst = c.cyl(0.14, 0.12, 0.12, colorMat(0x2a2d33, 0.5), 0.32, 0.5, 1.05, 16); c.box(0.16, 0.16, 0.16, colorMat(0x1a1c1e, 0.5), 0.32, 0.5, 1.05).visible = false;
    c.hit(2.0, 1.2, 1.0, 0, 0.6, 0, { kind: 'couch', seat: 'sofa' });
  }, after: function (c, P) { var v = propWorld('sofa', 0, 0.1); world.sofaSeat = { x: v.x, z: v.z, yaw: P.rot * Math.PI / 2 - Math.PI }; } });
  defProp('fridge', { label: 'drinks fridge', x: 3.3, z: -1.5, rot: 0, multi: { max: 3, price: 500, gap: 1.0, ico: '🧊' }, build: function (c) {
    // a shell with the front open, a hinged glass door, and shelves holding what is actually in it
    var shellM = colorMat(0xe8e8ee, 0.4, 0.2), inner = colorMat(0xdfe6ea, 0.8), chrome = MAT.chrome;
    c.box(0.8, 1.9, 0.06, inner, 0, 0.95, -0.32, { cast: false });
    c.box(0.06, 1.9, 0.7, shellM, -0.37, 0.95, 0);
    c.box(0.06, 1.9, 0.7, shellM, 0.37, 0.95, 0);
    c.box(0.8, 0.06, 0.7, shellM, 0, 1.87, 0, { cast: false });
    c.box(0.8, 0.22, 0.7, MAT.black, 0, 0.11, 0);
    c.solid(-0.42, 0.42, -0.36, 0.36);
    c.box(0.7, 0.16, 0.02, MAT.black, 0, 1.78, 0.35, { cast: false });
    c.sign(['ICE COLD'], 0.46, 0.11, 0, 1.78, 0.366, 0, { size: 34, bold: true, bg: 'rgba(0,0,0,0)', titleColor: '#3ad0ff', line: 'rgba(0,0,0,0)' });
    c.box(0.5, 0.02, 0.02, glowMat(0xdff4ff, 1.2), 0, 1.66, 0.28, { cast: false });
    var door = new THREE.Group(); door.position.set(-0.35, 0.96, 0.33); c.add(door); door.userData.fridgeDoor = true;
    function fb(w, h2, d2, m, x, y, z, noCast) { var b = new THREE.Mesh(new THREE.BoxGeometry(w, h2, d2), m); b.position.set(x, y, z); b.castShadow = !noCast; door.add(b); return b; }
    fb(0.035, 1.5, 0.05, chrome, 0, 0, 0); fb(0.035, 1.5, 0.05, chrome, 0.7, 0, 0);
    fb(0.74, 0.035, 0.05, chrome, 0.35, 0.735, 0, true); fb(0.74, 0.035, 0.05, chrome, 0.35, -0.735, 0, true);
    var gl = new THREE.Mesh(new THREE.PlaneGeometry(0.67, 1.44), new THREE.MeshPhysicalMaterial({ color: 0xdff0ff, transparent: true, opacity: 0.2, roughness: 0.02, side: THREE.DoubleSide }));
    gl.position.set(0.35, 0, 0.004); gl.castShadow = false; door.add(gl);
    var hdl = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.42, 0.05), chrome); hdl.position.set(0.66, 0, 0.05); door.add(hdl);
    var shelves = new THREE.Group(); c.add(shelves); shelves.userData.fridgeShelves = true; shelves.userData.slots = [];
    for (var r = 0; r < 4; r++) { var sh = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.018, 0.55), colorMat(0xc8ccd2, 0.5, 0.4)); sh.position.set(0, 0.38 + r * 0.36, 0); sh.castShadow = false; shelves.add(sh); }
    c.light(new THREE.PointLight(0xbfe8ff, 0.55, 2.6), 0, 1.45, 0.15);
    c.hit(0.82, 1.9, 0.72, 0, 0.95, 0, { kind: 'fridge' });
  }, after: function (c, P, inst, id) { syncFridge(id); } });
  defProp('coffeeBar', { label: 'coffee bar', x: 1.2, z: -1.7, rot: 0, build: function (c) {
    c.box(1.2, 0.9, 0.5, MAT.darkwood, 0, 0.45, 0, { solid: true }); c.box(1.26, 0.04, 0.56, MAT.counterTop, 0, 0.92, 0, { cast: false }); c.box(1.2, 0.06, 0.02, MAT.chrome, 0, 0.03, 0.25, { cast: false });
    drawer(c, 0.5, 0.2, 0.02, -0.3, 0.7, 0.24); drawer(c, 0.5, 0.2, 0.02, 0.3, 0.7, 0.24);
    var mach = colorMat(0x1c1c22, 0.4, 0.3); c.box(0.3, 0.38, 0.32, mach, -0.25, 1.13, -0.02); c.box(0.26, 0.06, 0.1, MAT.chrome, -0.25, 1.0, 0.16); c.box(0.2, 0.02, 0.14, MAT.chrome, -0.25, 0.95, 0.12, { cast: false }); c.cyl(0.02, 0.02, 0.05, MAT.chrome, -0.28, 1.05, 0.2, 8);
    c.box(0.08, 0.04, 0.02, glowMat(0xff3030, 1.2), -0.25, 1.3, 0.15, { cast: false }); c.box(0.12, 0.06, 0.02, MAT.screen, -0.12, 1.24, 0.15, { cast: false }); c.cyl(0.04, 0.04, 0.06, MAT.chrome, -0.36, 1.35, 0.0, 12);
    for (var cI = 0; cI < 4; cI++) { var mug = c.cyl(0.035, 0.03, 0.08, colorMat([0xf5f5f0, 0x6fdc8c, 0xffc857, 0x9ad0ff][cI], 0.5), 0.1 + cI * 0.1, 0.98, 0.1, 12); var hd = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.006, 6, 10, Math.PI), colorMat([0xf5f5f0, 0x6fdc8c, 0xffc857, 0x9ad0ff][cI], 0.5)); hd.position.set(0.135 + cI * 0.1, 0.98, 0.1); hd.rotation.y = Math.PI / 2; c.add(hd); }
    c.cyl(0.06, 0.05, 0.16, MAT.jar, 0.45, 1.02, -0.12, 14); c.cyl(0.05, 0.05, 0.1, colorMat(0x4a2a12, 1), 0.45, 0.99, -0.12, 12); c.cyl(0.062, 0.062, 0.015, MAT.jarLid, 0.45, 1.108, -0.12, 14);
    c.box(0.1, 0.12, 0.07, colorMat(0xf5f5f0, 0.7), 0.3, 1.0, -0.15); c.sign(['sugar'], 0.08, 0.04, 0.3, 1.0, -0.114, 0, { size: 20, bg: 'rgba(0,0,0,0)', color: '#333', titleColor: '#333', line: 'rgba(0,0,0,0)' });
    c.placard(['COFFEE', 'help yourself'], 0.5, 0.18, 0.35, 1.12, 0.2, { titleColor: '#ffc857' });
  } });
  defProp('waterCooler', { label: 'water cooler', x: -3.6, z: 3.5, rot: 3, build: function (c) { c.box(0.34, 0.9, 0.34, colorMat(0xe6e6ea, 0.5), 0, 0.45, 0); c.box(0.36, 0.06, 0.36, colorMat(0xd0d3d8, 0.5), 0, 0.03, 0); var bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.45, 16), MAT.jar); bottle.position.set(0, 1.15, 0); c.add(bottle); var water = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.32, 16), new THREE.MeshPhysicalMaterial({ color: 0x8fd0ff, transparent: true, opacity: 0.55, roughness: 0.1 })); water.position.set(0, 1.08, 0); c.add(water); c.cyl(0.06, 0.09, 0.08, MAT.jar, 0, 1.41, 0, 12); c.box(0.2, 0.08, 0.02, MAT.plastic, 0, 0.72, 0.17); [-0.05, 0.05].forEach(function (x) { c.box(0.03, 0.05, 0.04, colorMat(x < 0 ? 0x3a7fd6 : 0xd63a2a, 0.5), x, 0.72, 0.19); }); c.box(0.2, 0.02, 0.1, MAT.plastic, 0, 0.6, 0.2); for (var k = 0; k < 4; k++) c.cyl(0.03, 0.025, 0.08, colorMat(0xffffff, 0.6, 0, { transparent: true, opacity: 0.7 }), -0.1, 0.9 + k * 0.05, 0.22, 10); c.hit(0.5, 1.5, 0.5, 0, 0.75, 0, { kind: 'cooler' }); c.solid(-0.2, 0.2, -0.2, 0.2); } });
  defProp('bench', { label: 'workbench', x: ROOM.x - 0.6, z: 1.0, rot: 3, build: function (c) {
    // bench runs along local x, the working side faces +z (into the room after rot 3); tools on the back rail
    c.box(2.4, 0.06, 0.8, MAT.wood, 0, 0.9, 0, { solid: true }); c.box(2.4, 0.85, 0.7, MAT.darkwood, 0, 0.45, 0, { cast: false }); c.box(2.4, 0.03, 0.03, MAT.chrome, 0, 0.93, 0.4, { cast: false });
    drawer(c, 0.5, 0.2, 0.02, -0.9, 0.7, 0.34); drawer(c, 0.5, 0.2, 0.02, -0.3, 0.7, 0.34); c.box(0.9, 0.5, 0.02, MAT.wood, 0.6, 0.45, 0.34, { cast: false }); c.box(0.12, 0.018, 0.02, MAT.chrome, 0.6, 0.55, 0.36, { cast: false });
    c.hit(2.4, 0.02, 0.8, 0, 0.93, 0, { kind: 'bench', label: 'Workbench', prompt: 'Grind, bag & roll' });
    var mat = c.box(0.7, 0.01, 0.45, MAT.black, 0, 0.935, 0.05, { cast: false }); interactable(mat, { kind: 'bench', label: 'Workbench', prompt: 'Grind, bag & roll' }); c.box(0.68, 0.002, 0.43, colorMat(0x2a2d33, 0.9), 0, 0.941, 0.05, { cast: false });
    // stool, back rail with tools, a lamp, a scale, a tray of tips
    c.cyl(0.18, 0.18, 0.05, fabricMat(0x24272c), -1.0, 0.55, 0.65, 18); c.cyl(0.03, 0.03, 0.55, MAT.chrome, -1.0, 0.27, 0.65, 8); c.cyl(0.16, 0.18, 0.02, MAT.chrome, -1.0, 0.01, 0.65, 18); c.solid(-1.2, -0.8, 0.45, 0.85);
    c.box(2.4, 0.5, 0.03, colorMat(0x8a6a4a, 0.9), 0, 1.35, -0.38); for (var px = -1.1; px <= 1.1; px += 0.08) for (var py = 1.15; py <= 1.55; py += 0.08) { var hole = c.cyl(0.005, 0.005, 0.04, MAT.black, px, py, -0.38, 5); hole.rotation.x = Math.PI / 2; }
    var sc = c.cyl(0.006, 0.006, 0.2, MAT.chrome, -0.9, 1.35, -0.35, 6); sc.rotation.z = 0.4; var sc2 = c.cyl(0.006, 0.006, 0.2, MAT.chrome, -0.9, 1.35, -0.35, 6); sc2.rotation.z = -0.4; c.cyl(0.02, 0.02, 0.01, colorMat(0xc94a3a, 0.5), -0.9, 1.25, -0.35, 8);   // scissors
    c.box(0.03, 0.22, 0.01, MAT.chrome, -0.6, 1.35, -0.35); c.box(0.04, 0.06, 0.012, MAT.black, -0.6, 1.25, -0.35);   // knife
    [0.3, 0.45, 0.6].forEach(function (x, i) { c.cyl(0.022, 0.022, 0.16, colorMat([0xd9ff5a, 0xffffff, 0x3ad0ff][i], 0.5), x, 1.24, -0.34, 10); });   // bottles on the rail
    c.box(0.3, 0.03, 0.3, MAT.metal, -0.75, 0.945, -0.1); c.box(0.12, 0.03, 0.08, MAT.black, -0.75, 0.96, 0.06); c.box(0.08, 0.002, 0.03, MAT.screen, -0.75, 0.976, 0.06, { cast: false });   // scale
    c.cyl(0.02, 0.02, 0.5, MAT.chrome, 1.05, 1.15, -0.3, 8); var bl = c.cyl(0.015, 0.015, 0.35, MAT.chrome, 0.9, 1.5, -0.2, 8); bl.rotation.z = 0.9; var bshade = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.12, 14, 1, true), colorMat(0x2a2d33, 0.4, 0.5, { side: THREE.DoubleSide })); bshade.position.set(0.72, 1.4, -0.12); bshade.rotation.z = 0.5; c.add(bshade); c.light(new THREE.PointLight(0xfff0d0, 0.35, 2.5), 0.7, 1.3, -0.05);
    c.box(0.2, 0.03, 0.14, MAT.plastic, 0.9, 0.945, 0.15); for (var t = 0; t < 8; t++) c.cyl(0.006, 0.006, 0.03, colorMat(0xd8c8a0, 0.8), 0.83 + (t % 4) * 0.045, 0.975, 0.12 + Math.floor(t / 4) * 0.06, 5);   // tip tray
    c.placard(['PROCESSING', 'grind · bag · roll'], 0.6, 0.2, -0.95, 1.1, 0.2, { titleColor: '#ffc857' }); c.dynGroup();
  }, after: function () { syncShelf(); } });
  defProp('trash', { label: 'bin', x: ROOM.x - 0.6, z: -1.4, build: function (c) { c.cyl(0.17, 0.15, 0.5, colorMat(0x555a60, 0.5, 0.5), 0, 0.25, 0); c.cyl(0.16, 0.16, 0.02, colorMat(0x1a1c1e, 0.6), 0, 0.02, 0); c.box(0.06, 0.05, 0.02, MAT.white, 0.1, 0.5, 0.1, { cast: false });
    var lidG = new THREE.Group(); lidG.position.set(0, 0.51, -0.17); c.add(lidG);   /* hinged at the back edge so E can lift it */ var lidTop = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.17, 0.02, 18), colorMat(0x3a3d42, 0.5, 0.5)); lidTop.position.z = 0.17; lidG.add(lidTop); var knob = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.14, 0.03, 16), MAT.black); knob.position.set(0, 0.02, 0.17); lidG.add(knob);
    var hm = c.hit(0.5, 0.75, 0.5, 0, 0.36, 0, { kind: 'trash' }); (world.trashLids = world.trashLids || {})[hm.userData.propId] = lidG; c.solid(-0.2, 0.2, -0.2, 0.2); } });
  function crateBuild(c, x, y, z, s) { s = s || 0.55; c.box(s, s * 0.9, s, MAT.wood, x, y + s * 0.45, z); [-1, 1].forEach(function (d) { c.box(s + 0.02, 0.04, 0.02, MAT.darkwood, x, y + s * 0.2, z + d * s / 2, { cast: false }); c.box(s + 0.02, 0.04, 0.02, MAT.darkwood, x, y + s * 0.7, z + d * s / 2, { cast: false }); c.box(0.02, 0.04, s + 0.02, MAT.darkwood, x + d * s / 2, y + s * 0.2, z, { cast: false }); c.box(0.02, 0.04, s + 0.02, MAT.darkwood, x + d * s / 2, y + s * 0.7, z, { cast: false }); }); c.box(0.1, 0.03, 0.03, MAT.black, x, y + s * 0.45, z + s / 2 + 0.01, { cast: false }); }
  defProp('crates', { label: 'crates', x: 5.3, z: -1.4, build: function (c) { crateBuild(c, -0.3, 0, 0); crateBuild(c, -0.3, 0.5, 0, 0.5); crateBuild(c, 0.3, 0, 0.05); c.solid(-0.6, 0.6, -0.3, 0.35); c.sign(['FRAGILE'], 0.3, 0.1, 0.3, 0.35, 0.33, 0, { size: 30, bg: '#f0e0c0', color: '#c9302c', titleColor: '#c9302c', line: 'rgba(0,0,0,0)' }); } });
  defProp('cureShelf', { label: 'curing shelf', x: 6.5, z: -ROOM.z + 0.35, rot: 0, build: function (c) {
    for (var i = 0; i < 4; i++) { c.box(3.0, 0.04, 0.4, MAT.wood, 0, 0.5 + i * 0.55, 0); c.box(3.0, 0.04, 0.02, MAT.darkwood, 0, 0.5 + i * 0.55, 0.2, { cast: false }); }
    c.box(0.06, 2.3, 0.4, MAT.darkwood, -1.5, 1.15, 0); c.box(0.06, 2.3, 0.4, MAT.darkwood, 1.5, 1.15, 0); c.box(0.06, 2.3, 0.4, MAT.darkwood, 0, 1.15, 0); c.box(3.0, 2.3, 0.02, colorMat(0x2a1c10, 0.8), 0, 1.15, -0.19, { cast: false }); c.solid(-1.5, 1.5, -0.2, 0.25);
    c.hit(3.0, 2.3, 0.5, 0, 1.15, 0, { kind: 'shelf', label: 'Curing shelf', prompt: 'Curing jars' });
    for (var s = 0; s < 4; s++) c.sign([['SHELF A', 'SHELF B', 'SHELF C', 'SHELF D'][s]], 0.3, 0.06, 1.3, 0.48 + s * 0.55, 0.212, 0, { size: 24, bg: '#f3e9cf', color: '#222', titleColor: '#222', line: 'rgba(0,0,0,.3)' });
    var hyg = c.box(0.14, 0.09, 0.02, MAT.white, -1.3, 2.0, 0.2); c.sign(['62% RH'], 0.1, 0.05, -1.3, 2.0, 0.212, 0, { size: 28, bg: '#101410', titleColor: '#6fdc8c', line: 'rgba(0,0,0,0)' });
    c.sign(['CURING SHELF', 'jars gain quality while they sit'], 1.4, 0.4, 0, 2.55, 0.05, 0, { titleColor: '#6fdc8c' }); c.dynGroup();
  }, after: function () { syncShelf(); } });
  defProp('dryRack', { label: 'drying line', x: 6.25, z: -5.2, rot: 0, build: function (c) {
    var hw = 3.25, ly = 2.1;
    [-hw, hw].forEach(function (px) { c.box(0.08, ly + 0.1, 0.08, MAT.wood, px, (ly + 0.1) / 2, 0); c.box(0.7, 0.06, 0.12, MAT.wood, px, 0.03, 0); c.box(0.12, 0.06, 0.7, MAT.wood, px, 0.03, 0); var b1 = c.box(0.06, 0.9, 0.06, MAT.wood, px, 0.55, 0.28); b1.rotation.x = 0.55; var b2 = c.box(0.06, 0.9, 0.06, MAT.wood, px, 0.55, -0.28); b2.rotation.x = -0.55; c.box(0.1, 0.1, 0.1, MAT.plastic, px, ly, 0); c.solid(px - 0.36, px + 0.36, -0.36, 0.36); });
    var bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, hw * 2, 12), MAT.wood); bar.rotation.z = Math.PI / 2; bar.position.set(0, ly, 0); bar.castShadow = true; c.add(bar);
    var wire = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, hw * 2, 6), MAT.metal); wire.rotation.z = Math.PI / 2; wire.position.set(0, ly - 0.12, 0); c.add(wire);
    for (var pg = 0; pg < 12; pg++) c.box(0.02, 0.06, 0.015, colorMat(0xd9c9a0, 0.9), -hw + 0.3 + pg * 0.55, ly - 0.14, 0, { cast: false });
    c.hit(hw * 2, 0.9, 0.3, 0, ly - 0.4, 0, { kind: 'line', label: 'Drying line', prompt: 'Hang harvests here' });
    // a clip fan on the post keeps the air moving
    var fanG = new THREE.Group(); fanG.position.set(-hw + 0.1, 1.4, 0.1); fanG.rotation.y = 0.8; c.add(fanG); var fb = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 16), MAT.plastic); fb.rotation.x = Math.PI / 2; fanG.add(fb); var cage = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.008, 6, 24), MAT.chrome); cage.position.z = 0.05; fanG.add(cage); var blades = new THREE.Group(); blades.position.z = 0.04; fanG.add(blades); for (var b = 0; b < 3; b++) { var blm = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.004), colorMat(0xe0e0e0, 0.5)); blm.position.y = 0.08; var hold = new THREE.Group(); hold.rotation.z = b * Math.PI * 2 / 3; hold.add(blm); blades.add(hold); } c.box(0.06, 0.1, 0.08, MAT.plastic, -hw + 0.06, 1.3, 0.02); world.clipFan = blades;
    c.sign(['DRYING LINE', 'hang fresh harvests here · ~45 s'], 1.4, 0.4, 0, ly + 0.35, 0, 0, { titleColor: '#6fdc8c' }); c.dynGroup();
  }, after: function () { syncShelf(); } });
  defProp('dryTable', { label: 'scale table', x: 1.2, z: -3.2, rot: 0, build: function (c) { c.box(0.9, 0.05, 0.6, MAT.wood, 0, 0.78, 0, { solid: true }); legs4(c, 0.9, 0.6, 0.76, MAT.metal); c.box(0.3, 0.03, 0.3, MAT.metal, 0, 0.82, 0); c.box(0.12, 0.025, 0.08, MAT.black, 0, 0.85, 0.15); c.box(0.08, 0.002, 0.03, MAT.screen, 0, 0.864, 0.15, { cast: false }); c.box(0.2, 0.01, 0.28, MAT.white, -0.3, 0.81, 0.05, { cast: false }); c.cyl(0.005, 0.005, 0.12, colorMat(0x2a4a8a, 0.4), -0.25, 0.815, 0.1, 6).rotation.set(Math.PI / 2, 0, 0.5); c.cyl(0.06, 0.06, 0.14, MAT.jar, 0.3, 0.88, -0.15, 12); c.cyl(0.062, 0.062, 0.015, MAT.jarLid, 0.3, 0.955, -0.15, 12); c.box(0.16, 0.1, 0.16, colorMat(0xe8e8ee, 0.6), 0.32, 0.86, 0.15); } });
  defProp('jarBoxes', { label: 'jar boxes', x: 10.6, z: -8.2, build: function (c) { var bxM = colorMat(0xc8a97a, 1); [[0.3, 0, 0], [0.3, 0, 0.42], [-0.3, 0, 0]].forEach(function (b) { c.box(0.5, 0.4, 0.5, bxM, b[0], 0.2 + b[2], b[1], { solid: b[2] === 0 }); c.box(0.52, 0.03, 0.52, colorMat(0xb08c5a, 1), b[0], 0.4 + b[2], b[1], { cast: false }); c.box(0.5, 0.06, 0.02, colorMat(0xb08c5a, 1), b[0], 0.2 + b[2], b[1] + 0.25, { cast: false }); c.sign(['JARS ×12'], 0.3, 0.08, b[0], 0.15 + b[2], b[1] + 0.26, 0, { size: 24, bg: '#f3e9cf', color: '#222', titleColor: '#222', line: 'rgba(0,0,0,.3)' }); }); } });
  defProp('hose', { label: 'hose reel + watering can', x: -ROOM.x + 0.55, z: -3.0, rot: 1, build: function (c) {
    c.box(0.5, 0.06, 0.5, MAT.metal, -0.15, 0.03, 0); c.box(0.06, 1.8, 0.06, MAT.metal, -0.15, 0.9, 0); c.box(0.2, 0.06, 0.06, MAT.metal, -0.15, 1.1, -0.15);
    var reel = c.cyl(0.28, 0.28, 0.14, colorMat(0x2f7a34, 0.6), -0.15, 1.1, 0.08); reel.rotation.x = Math.PI / 2; for (var r = 0; r < 5; r++) { var loop = new THREE.Mesh(new THREE.TorusGeometry(0.2 + r * 0.015, 0.012, 6, 24), colorMat(0x3a8f40, 0.7)); loop.position.set(-0.15, 1.1, 0.08 + (r - 2) * 0.03); c.add(loop); }
    var hub = c.cyl(0.16, 0.16, 0.18, MAT.metal, -0.15, 1.1, 0.08); hub.rotation.x = Math.PI / 2; var crank = c.box(0.03, 0.14, 0.03, MAT.black, -0.06, 1.17, 0.19); var knob = c.cyl(0.015, 0.015, 0.08, MAT.plastic, -0.06, 1.24, 0.23, 8); knob.rotation.x = Math.PI / 2;
    var nozzle = c.cyl(0.02, 0.03, 0.14, colorMat(0xffc857, 0.4), -0.35, 0.6, 0.1, 8); nozzle.rotation.z = 0.5; var hoseTail = c.cyl(0.012, 0.012, 0.5, colorMat(0x3a8f40, 0.7), -0.3, 0.82, 0.1, 6); hoseTail.rotation.z = 0.3;
    var tap = c.box(0.06, 0.06, 0.06, MAT.chrome, -0.15, 0.45, -0.28); var wheel = c.cyl(0.04, 0.04, 0.02, colorMat(0xc94a3a, 0.5), -0.15, 0.5, -0.28, 12);
    var canM = colorMat(0x3a8fd6, 0.45, 0.35);
    c.cyl(0.13, 0.15, 0.3, canM, 0.35, 0.15, 0.1, 20); c.cyl(0.14, 0.14, 0.02, colorMat(0x2a6fb0, 0.45, 0.35), 0.35, 0.3, 0.1, 20); c.cyl(0.05, 0.05, 0.04, canM, 0.35, 0.32, 0.1, 12);
    var spout = c.cyl(0.018, 0.028, 0.36, canM, 0.55, 0.3, 0.1, 8); spout.rotation.z = -0.95; var rose = c.cyl(0.05, 0.035, 0.05, canM, 0.69, 0.42, 0.1, 12); rose.rotation.z = -0.95; c.cyl(0.048, 0.048, 0.01, colorMat(0x8a8f96, 0.5, 0.5), 0.71, 0.435, 0.1, 12).rotation.z = -0.95;
    var handle = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.014, 8, 20, Math.PI), canM); handle.position.set(0.35, 0.3, 0.1); c.add(handle); var handle2 = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 8, 16, Math.PI * 0.6), canM); handle2.position.set(0.26, 0.2, 0.1); handle2.rotation.z = Math.PI * 0.35; c.add(handle2);
    c.hit(0.5, 0.55, 0.5, 0.35, 0.27, 0.1, { kind: 'water', label: 'Watering can', prompt: 'Water a plant' }); c.solid(-0.4, 0.15, -0.3, 0.3);
    c.sign(['WATER', 'grab the can · E on a plant'], 0.6, 0.2, -0.15, 1.68, 0.1, 0, { titleColor: '#6fc3ff' });
  } });
  defProp('fan', { label: 'floor fan', x: -2.0, z: -7.9, rot: 0, build: function (c) {
    var fbase = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.04, 20), MAT.black); fbase.position.y = 0.02; c.add(fbase); c.box(0.06, 0.03, 0.06, colorMat(0x8a8f96, 0.5), 0.1, 0.05, 0.1, { cast: false });
    var fpole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 10), MAT.chrome); fpole.position.y = 0.47; c.add(fpole); c.cyl(0.03, 0.03, 0.05, MAT.plastic, 0, 0.5, 0, 10);
    world.fanHead = new THREE.Group(); world.fanHead.position.y = 0.95; c.add(world.fanHead);
    var motor = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.16, 14), MAT.plastic); motor.rotation.x = Math.PI / 2; motor.position.z = -0.1; world.fanHead.add(motor);
    world.fanHead.add(new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.012, 6, 28), MAT.chrome)); var cageBack = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 28, 1, true), MAT.chrome); cageBack.rotation.x = Math.PI / 2; cageBack.position.z = -0.05; world.fanHead.add(cageBack);
    for (var w = 0; w < 12; w++) { var wire = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.44, 0.004), MAT.chrome); wire.rotation.z = w * Math.PI / 12; wire.position.z = 0.02; world.fanHead.add(wire); }
    var hubc = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 12), MAT.plastic); hubc.rotation.x = Math.PI / 2; hubc.position.z = 0.02; world.fanHead.add(hubc);
    world.fanBlades = new THREE.Group(); world.fanHead.add(world.fanBlades);
    for (var b = 0; b < 3; b++) { var bl = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.19, 0.005), colorMat(0xdddddd, 0.5)); bl.position.y = 0.1; bl.rotation.y = 0.3; var holder = new THREE.Group(); holder.rotation.z = b * Math.PI * 2 / 3; holder.add(bl); world.fanBlades.add(holder); }
    c.solid(-0.22, 0.22, -0.22, 0.22);
  }, after: function (c, P) { world.fanBaseYaw = Math.atan2(TENT_ORIGIN.x - P.x, TENT_ORIGIN.z - P.z) - P.rot * Math.PI / 2; } });
  defProp('soilSacks', { label: 'soil sacks', x: -11.3, z: -5.2, build: function (c) { var sackM = new THREE.MeshStandardMaterial({ map: TEX.fabric, color: 0x5a3a22, roughness: 1 }); [[0, 0, 0, 0.1], [0, 0, 0.3, -0.2], [0.55, 0, 0, 0.3]].forEach(function (b) { var s = c.box(0.5, 0.28, 0.35, sackM, b[0], 0.14 + b[2], b[1], { solid: b[2] === 0 }); s.rotation.y = b[3]; c.sign(['POTTING SOIL', '25 L'], 0.3, 0.12, b[0], 0.14 + b[2], b[1] + 0.176, b[3], { size: 26, bg: '#e8dcc0', color: '#3a2a1a', titleColor: '#1a6a2a', line: 'rgba(0,0,0,0)' }); }); } });
  defProp('bucket', { label: 'bucket', x: -11.2, z: -3.9, build: function (c) { c.cyl(0.16, 0.13, 0.3, colorMat(0x2f7a34, 0.6), 0, 0.15, 0); c.cyl(0.165, 0.165, 0.02, colorMat(0x255f2a, 0.6), 0, 0.3, 0); var hd = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.008, 6, 20, Math.PI), MAT.chrome); hd.position.y = 0.3; hd.rotation.z = 0; c.add(hd); c.cyl(0.14, 0.14, 0.01, new THREE.MeshPhysicalMaterial({ color: 0x6fb0e0, transparent: true, opacity: 0.6 }), 0, 0.25, 0, 20); c.solid(-0.2, 0.2, -0.2, 0.2); } });
  defProp('potShelf', { label: 'pot shelf', x: -9.5, z: -ROOM.z + 0.3, rot: 0, build: function (c) { [0.4, 1.0, 1.6].forEach(function (y) { c.box(1.2, 0.03, 0.3, MAT.wood, 0, y, 0); c.box(1.2, 0.03, 0.02, MAT.darkwood, 0, y, 0.15, { cast: false }); }); [-0.55, 0.55].forEach(function (x) { c.box(0.04, 1.7, 0.3, MAT.metal, x, 0.85, 0); }); for (var p = 0; p < 3; p++) { for (var st = 0; st < 3; st++) { c.cyl(0.12 - st * 0.01, 0.09, 0.14, MAT.pot, -0.4 + p * 0.4, 1.69 + st * 0.03, 0, 16); } c.cyl(0.12, 0.09, 0.16, MAT.pot, -0.4 + p * 0.4, 1.1, 0, 16); c.cyl(0.125, 0.125, 0.02, MAT.pot, -0.4 + p * 0.4, 1.18, 0, 16); } c.box(0.3, 0.2, 0.2, colorMat(0xe8e8ee, 0.6), -0.3, 0.52, 0); c.cyl(0.08, 0.08, 0.2, MAT.jar, 0.3, 0.52, 0, 12); c.sign(['POTS', 'spares'], 0.4, 0.12, 0, 1.85, 0.02, 0, { titleColor: '#6fdc8c' }); c.solid(-0.6, 0.6, -0.15, 0.15); } });
  defProp('tent', { label: 'grow tent', x: -6.6, z: -6.1, rot: 0, build: function (c, P) { TENT_ORIGIN.x = P.x; TENT_ORIGIN.z = P.z; buildTent(); if (world.tentGroup) world.tentGroup.traverse(function (o) { if (o.isMesh) o.userData.propId = 'tent'; }); }, after: function () { if (propInst.fan) { var f = propInst.fan; world.fanBaseYaw = Math.atan2(TENT_ORIGIN.x - f.P.x, TENT_ORIGIN.z - f.P.z) - f.P.rot * Math.PI / 2; } } });
  function lobbyBench(c) { for (var s = -0.7; s <= 0.7; s += 0.14) c.box(0.12, 0.05, 0.45, MAT.wood, s, 0.55, 0); c.box(1.6, 0.05, 0.45, MAT.none, 0, 0.55, 0, { solid: true, cast: false }); for (var b = 0; b < 3; b++) c.box(1.6, 0.09, 0.03, MAT.wood, 0, 0.72 + b * 0.12, -0.2 - b * 0.02); [-0.65, 0.65].forEach(function (x) { c.box(0.05, 0.55, 0.45, colorMat(0x2a2d33, 0.4, 0.6), x, 0.275, 0); c.box(0.05, 0.5, 0.05, colorMat(0x2a2d33, 0.4, 0.6), x, 0.8, -0.2); }); }
  defProp('lobbyBenchL', { label: 'lobby bench', x: -8.5, z: 8.2, rot: 2, build: lobbyBench });
  defProp('lobbyBenchR', { label: 'lobby bench', x: 8.5, z: 8.2, rot: 2, build: lobbyBench });
  defProp('magTable', { label: 'magazine table', x: -6.6, z: 7.6, build: function (c) { c.cyl(0.32, 0.32, 0.03, MAT.wood, 0, 0.45, 0, 24); c.cyl(0.03, 0.03, 0.44, MAT.chrome, 0, 0.22, 0, 10); c.cyl(0.2, 0.22, 0.02, MAT.chrome, 0, 0.01, 0, 24); c.box(0.3, 0.01, 0.22, new THREE.MeshBasicMaterial({ map: textTex(['HIGH', 'times'], 150, 110, { size: 34, bg: '#6fdc8c', color: '#062010', titleColor: '#062010', line: 'rgba(0,0,0,0)' }) }), -0.05, 0.47, 0, { cast: false }); c.box(0.3, 0.01, 0.22, new THREE.MeshBasicMaterial({ map: textTex(['GROW', 'weekly'], 150, 110, { size: 34, bg: '#ffc857', color: '#332200', titleColor: '#332200', line: 'rgba(0,0,0,0)' }) }), 0.1, 0.48, -0.05, { cast: false }).rotation.y = 0.3; c.solid(-0.33, 0.33, -0.33, 0.33); } });
  var ROPE_COLORS = { red: 0xc94a3a, navy: 0x2a3a6a, black: 0x1a1a1c, gold: 0xc9a44a, green: 0x2e7d4f }, ROPE_POSTS = { chrome: [0xd8dde2, 0.25, 0.95], brass: [0xb8913a, 0.35, 0.85], black: [0x1a1a1c, 0.4, 0.6] }, ROPE_LENS = [1.2, 1.8, 2.4, 3.0];
  function ropeStyle(id) { if (!S.ropes) S.ropes = {}; var st = S.ropes[id] || {}; return { color: ROPE_COLORS[st.color] ? st.color : 'red', len: ROPE_LENS.indexOf(st.len) >= 0 ? st.len : 1.8, posts: ROPE_POSTS[st.posts] ? st.posts : 'chrome', kind: st.kind === 'belt' ? 'belt' : 'rope', open: !!st.open }; }
  function ropeBuild(c) {   // two posts and a velvet rope (or a retractable belt) clipped between them, along local x; unhooked, it hangs down the far post
    var id = c.group.userData.propId, st = ropeStyle(id), hx = st.len / 2, pf = ROPE_POSTS[st.posts], postM = colorMat(pf[0], pf[1], pf[2]), bandM = new THREE.MeshStandardMaterial({ map: TEX.fabric, color: ROPE_COLORS[st.color], roughness: 1 });
    [-hx, hx].forEach(function (x) { c.cyl(0.025, 0.025, 0.95, postM, x, 0.475, 0, 12); c.cyl(0.16, 0.18, 0.03, postM, x, 0.015, 0, 20); var ball = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), postM); ball.position.set(x, 0.98, 0); ball.castShadow = true; c.add(ball); c.solid(x - 0.15, x + 0.15, -0.15, 0.15); });
    var piv = new THREE.Group(); piv.position.set(-hx, 0.93, 0); c.add(piv);
    if (st.kind === 'belt') { var belt = new THREE.Mesh(new THREE.BoxGeometry(st.len - 0.05, 0.05, 0.006), bandM); belt.position.set(hx, -0.03, 0); belt.castShadow = true; piv.add(belt); }
    else { var rope = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(hx, -0.12 * st.len, 0), new THREE.Vector3(st.len, 0, 0)), 20, 0.022, 8, false), bandM); rope.castShadow = true; piv.add(rope); }
    var clip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.035, 0.03), postM); clip.position.set(st.len - 0.03, st.kind === 'belt' ? -0.03 : 0, 0); piv.add(clip);
    var G = ropeGate(id); G.pivot = piv; G.len = st.len; ropePose(G);
    c.hit(st.len + 0.3, 1.05, 0.35, 0, 0.52, 0, { kind: 'rope' });
  }
  var ropeGates = {}, ropeSegList = [];   // per rope: how far unhooked it is (open 0..1, passable from 0.8) and who wants it
  function ropeGate(id) { return ropeGates[id] || (ropeGates[id] = { open: 0, clip: false, want: false, waitT: 0, idleT: 0, pivot: null, len: 1.8 }); }
  function ropeSegs() {   // every standing rope on the ground floor, as the line between its posts; x1 is the far post it hangs from, x2 the clip end
    return unitIds('queueRope').filter(function (u) { var P = propPlacement(u); return propInst[u] && !P.hidden && !P.floor; }).map(function (u) { var P = propPlacement(u), hx = ropeStyle(u).len / 2, a = P.rot * Math.PI / 2, cx = Math.cos(a) * hx, cz = -Math.sin(a) * hx; return { id: u, x1: P.x - cx, z1: P.z - cz, x2: P.x + cx, z2: P.z + cz }; });
  }
  function segCross(ax, az, bx, bz, cx, cz, dx, dz) { function o(px, pz, qx, qz, rx, rz) { return (qx - px) * (rz - pz) - (qz - pz) * (rx - px); } return ((o(cx, cz, dx, dz, ax, az) > 0) !== (o(cx, cz, dx, dz, bx, bz) > 0)) && ((o(ax, az, bx, bz, cx, cz) > 0) !== (o(ax, az, bx, bz, dx, dz) > 0)); }
  function segDist(px, pz, s) { var vx = s.x2 - s.x1, vz = s.z2 - s.z1, L = vx * vx + vz * vz, t = L ? clamp(((px - s.x1) * vx + (pz - s.z1) * vz) / L, 0, 1) : 0; return Math.hypot(px - (s.x1 + vx * t), pz - (s.z1 + vz * t)); }
  function ropeHeld(g, ux, uz, d) {   // from walkAlong: is a hooked rope within the next step or so? then stop and ask for it
    if (heist.on && heist.masked) return false;   /* a robbery: everyone barges through */
    var la = Math.min(0.45, d), ax = g.position.x, az = g.position.z, bx = ax + ux * la, bz = az + uz * la;   /* never look past the point you are walking to, or someone heading for the ID spot would ask for the rope beyond it */
    for (var i = 0; i < ropeSegList.length; i++) { var s = ropeSegList[i]; if (!segCross(ax, az, bx, bz, s.x1, s.z1, s.x2, s.z2)) continue; var G = ropeGate(s.id); if (G.open >= 0.8) return false; G.want = true; g.userData.ropeHold = now(); return true; }
    return false;
  }
  function guardCanRope(s) { return guardOnDuty() && !(heist.on && heist.masked) && Math.hypot(guard.h.position.x - s.x2, guard.h.position.z - s.z2) < 8 && (!guard.rope || guard.rope.id === s.id); }
  function ropePose(G) { if (!G.pivot) return; G.pivot.rotation.z = -G.open * Math.PI / 2; G.pivot.scale.x = 1 + (Math.min(1, 0.86 / G.len) - 1) * G.open; }   /* unhooked, it swings down and hangs from the far post */
  function updateRopeGates(dt) {
    ropeSegList = ropeSegs();
    var movers = []; function add(g) { if (g && g.visible && g.userData.gated && now() - (g.userData.moveT || 0) < 400) movers.push(g.position); }
    if (npc.human && npc.state !== 'away') add(npc.g); lineup.forEach(function (m) { add(m.g); }); loungers.forEach(function (l) { add(l.g); }); robbers.forEach(function (r) { if (r.g && r.state === 'case') add(r.g); });
    ropeSegList.forEach(function (s) {
      var G = ropeGate(s.id);
      if (ropeStyle(s.id).open || (heist.on && heist.masked) || !guardOnDuty()) { G.clip = true; G.idleT = 0; }   /* pinned open, a robbery, or the guard sent home: it stays unhooked */
      else if (G.want && !G.clip) { G.idleT = 0; G.waitT += dt; if (guardCanRope(s) && G.waitT < 4) { if (!guard.rope) guard.ropeReq = s.id; } else if (G.waitT > 0.9) G.clip = true; }   /* nobody free on the door: after a moment they unhook it themselves */
      else if (G.clip) { var busy = G.want || movers.some(function (p) { return segDist(p.x, p.z, s) < 0.6; }); G.idleT = busy ? 0 : G.idleT + dt; if (G.idleT > 1.2) { G.clip = false; G.waitT = 0; } }   // clear for a moment: hooked back
      else G.waitT = 0;
      G.want = false;
      var o = clamp(G.open + (G.clip ? 1 : -1) * dt * 2.2, 0, 1); if (o !== G.open) { G.open = o; ropePose(G); }
    });
  }
  function updateGuardRope(dt) {   // his hand on the clip: reach over (or walk over), unhook it, hold it while they pass, hook it back
    if (guard.state === 'check') return false;   /* an ID check comes first; the rope waits */
    var id = (guard.rope && guard.rope.id) || guard.ropeReq; if (!id) return false;
    var s = ropeSegList.filter(function (x) { return x.id === id; })[0], P = guard.h.userData.parts;
    if (!s) { guard.rope = null; guard.ropeReq = null; return false; }
    var G = ropeGate(id);
    if (!guard.rope) {
      guard.ropeReq = null; guard.rope = { id: id, t: 0, phase: 'reach', rot0: guard.h.rotation.y, walked: false };
      if (Math.hypot(guard.h.position.x - s.x2, guard.h.position.z - s.z2) > 1.3) { var L = Math.hypot(s.x2 - s.x1, s.z2 - s.z1) || 1; guardGo(s.x2 + (s.x2 - s.x1) / L * 0.35, s.z2 + (s.z2 - s.z1) / L * 0.35); guard.rope.phase = 'go'; guard.rope.walked = true; }
    }
    var j = guard.rope;
    if (j.phase === 'go') { if (guard.walking) return false; j.phase = 'reach'; j.t = 0; }
    j.t += dt; var face = Math.atan2(s.x2 - guard.h.position.x, s.z2 - guard.h.position.z), diff = face - guard.h.rotation.y; while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2; guard.h.rotation.y += diff * Math.min(1, dt * 8);
    animateHuman(guard.h, dt, 'idle', 0, null); P.rArm.rotation.x = lerp(P.rArm.rotation.x, -1.15, 0.2);
    if (j.phase === 'reach' && j.t > 0.45) { j.phase = 'hold'; G.clip = true; G.idleT = 0; if (Math.random() < 0.35) guard.say(pick(['In you go.', 'Go on through.', 'Mind the rope.', 'After you.']), '#e8f1ea', 1500); }
    if (j.phase === 'hold' && !G.clip) j.phase = 'rehook';
    if (j.phase === 'rehook' && G.open <= 0.02) { guard.rope = null; P.rArm.rotation.x = 0; if (!j.walked) guard.h.rotation.y = j.rot0; return false; }
    return true;
  }
  var EXIT_X = 3.3;   // the way out runs along the walkway in front of the line, round the right-hand end of the rope behind the guard's podium, and back to the door
  function exitPath(p, side) {
    var street = [{ x: 0.6 * (side || 1), z: 11.4 }, { x: Math.random() < 0.5 ? 16 : -16, z: 11.6 }], door = [{ x: 0.55, z: 8.6 }, { x: 0.1, z: 9.7 }].concat(street);
    if (p.z > 9.2) return street;   /* already outside */
    if (p.z > 7.6 && p.x > -0.6 && p.x < EXIT_X - 0.4) return door.slice(1);   /* on the door side of the rope: the ID spot, the way in */
    if (p.z < 6.2) return [{ x: 0.6, z: 5.65 }, { x: EXIT_X, z: 5.9 }, { x: EXIT_X, z: 8.45 }].concat(door);   /* from the window: step aside and keep to the counter */
    return [{ x: p.x, z: Math.min(p.z, 6.6) }, { x: EXIT_X, z: 6.6 }, { x: EXIT_X, z: 8.45 }].concat(door);   // anywhere else in the lobby: out onto the walkway first
  }
  function ropeMenu(id) {
    var st = ropeStyle(id), P = propPlacement(id), lines = [];
    function cyc(list, v) { return list[(list.indexOf(v) + 1) % list.length]; }
    function set(k, v) { return function () { st[k] = v; S.ropes[id] = st; buildProp(id); world.dirty = true; save(); ropeMenu(id); }; }
    lines.push({ label: st.open ? '🔓 <b>Unhooked</b>: people walk straight through <small>click to hook it, and the guard lets people through</small>' : '🔒 <b>Hooked</b>: the guard unhooks it for people <small>click to leave it unhooked; it stays unhooked while he is sent home</small>', act: set('open', !st.open) });
    lines.push({ label: '🎨 Colour: <b>' + st.color + '</b> <small>click for ' + cyc(Object.keys(ROPE_COLORS), st.color) + '</small>', act: set('color', cyc(Object.keys(ROPE_COLORS), st.color)) });
    lines.push({ label: '📏 Length: <b>' + st.len + ' m</b> <small>click for ' + cyc(ROPE_LENS, st.len) + ' m</small>', act: set('len', cyc(ROPE_LENS, st.len)) });
    lines.push({ label: '🪢 Style: <b>' + (st.kind === 'belt' ? 'retractable belt' : 'velvet rope') + '</b> <small>click for ' + (st.kind === 'belt' ? 'velvet rope' : 'retractable belt') + '</small>', act: set('kind', st.kind === 'belt' ? 'rope' : 'belt') });
    lines.push({ label: '✨ Posts: <b>' + st.posts + '</b> <small>click for ' + cyc(Object.keys(ROPE_POSTS), st.posts) + '</small>', act: set('posts', cyc(Object.keys(ROPE_POSTS), st.posts)) });
    lines.push({ label: '↻ Turn it a quarter <small>F2 and R do the same</small>', act: function () { if (!S.layout) S.layout = {}; S.layout[id] = Object.assign({}, S.layout[id] || {}, { x: P.x, z: P.z, rot: (P.rot + 1) % 4 }); buildProp(id); world.dirty = true; save(); ropeMenu(id); } });
    lines.push({ label: '✋ Move it <small>opens edit mode: look at it and press E to pick it up</small>', act: function () { if (!edit.on) editToggle(); } });
    lines.push({ label: '➕ Put up another beside it <small>' + (unitIds('queueRope').some(function (u) { return propPlacement(u).hidden; }) ? 'free: one you took down' : unitCount('queueRope') >= PROPS.queueRope.multi.max ? 'you have the most there is room for' : money(machCost('queueRope', unitCount('queueRope') + 1))) + '</small>', act: function () { ropeAdd(id); } });
    lines.push({ label: '🗑️ Take it down <small>it goes in the back; put it up again from another rope line or the office PC</small>', act: function () { if (!S.layout) S.layout = {}; S.layout[id] = Object.assign({}, S.layout[id] || {}, { x: P.x, z: P.z, rot: P.rot, hidden: true }); buildProp(id); world.dirty = true; save(); toast('🪢 Rope line taken down', ''); } });
    ctxOpen('🪢 Rope line', 'change how it looks, move it, add to it or take it down', lines);
  }
  function ropeAdd(id) {   // the next one lands a step in front of this one, same style and angle: line them up with F2
    var P = propPlacement(id), fr = [[0, 1], [1, 0], [0, -1], [-1, 0]][((P.rot % 4) + 4) % 4];
    var nid = unitIds('queueRope').filter(function (u) { return propPlacement(u).hidden; })[0];
    if (!nid) { var have = unitCount('queueRope'); buyUnit('queueRope'); if (unitCount('queueRope') === have) return; nid = 'queueRope#' + unitCount('queueRope'); }
    var sty = ropeStyle(id); if (!S.layout) S.layout = {}; S.layout[nid] = { x: P.x + fr[0] * 0.9, z: P.z + fr[1] * 0.9, rot: P.rot }; S.ropes[nid] = sty;
    buildProp(nid); world.dirty = true; save(); toast('🪢 Another rope line is up. F2 lines it up.', 'good');
  }
  function ropeUp() {   /* from the office PC: the last one taken down goes back where it stood */
    var nid = unitIds('queueRope').filter(function (u) { return propPlacement(u).hidden; }).pop(); if (!nid) return;
    S.layout[nid] = Object.assign({}, S.layout[nid], { hidden: false }); buildProp(nid); world.dirty = true; save(); toast('🪢 Rope line back up where it stood', 'good');
  }
  defProp('queueRope', { label: 'rope line', x: 0.35, z: 7.45, rot: 0, multi: { max: 8, price: 40, gap: 2.2, ico: '🪢', name: 'Rope line' }, build: ropeBuild });   // across the way in, between the ID check and the queue: the guard at his post unhooks it for whoever he lets through
  defProp('lobbyPlant', { label: 'lobby plant', x: -10.5, z: 5.0, build: function (c) { c.cyl(0.26, 0.2, 0.5, colorMat(0x2a2d33, 0.5), 0, 0.25, 0, 20); c.cyl(0.24, 0.24, 0.02, MAT.soil, 0, 0.5, 0, 20); c.cyl(0.015, 0.02, 0.9, MAT.trunk, 0, 0.9, 0, 8); for (var i = 0; i < 12; i++) { var lf = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.8), MAT.leaf); var a = i * 0.55; lf.position.set(Math.cos(a) * 0.08, 1.0 + (i % 3) * 0.2, Math.sin(a) * 0.08); lf.rotation.set(-0.5 - (i % 4) * 0.15, a + Math.PI / 2, 0); lf.castShadow = true; c.add(lf); } c.solid(-0.3, 0.3, -0.3, 0.3); } });
  defProp('lobbyCoffee', { label: 'lobby coffee machine', x: ROOM.x - 0.4, z: 8.1, rot: 3, multi: { max: 4, price: 600, gap: 0.95, ico: '☕', lic: 'catering', upg: 'lobby', name: 'Coffee machine' }, build: function (c) {
    if (!S.upgrades.lobby) return;   // stand + machine appear with the upgrade
    c.box(0.6, 0.9, 0.5, MAT.darkwood, 0, 0.45, 0, { solid: true }); c.box(0.66, 0.04, 0.56, MAT.counterTop, 0, 0.92, 0, { cast: false });
    var body = colorMat(0x1c1c22, 0.4, 0.3), chrome = MAT.chrome;
    c.box(0.34, 0.46, 0.34, body, 0, 1.17, -0.04);
    c.box(0.3, 0.05, 0.12, chrome, 0, 1.0, 0.13, { cast: false });                 /* the group head */
    c.box(0.22, 0.015, 0.16, chrome, 0, 0.955, 0.1, { cast: false });              /* drip tray */
    c.box(0.2, 0.012, 0.14, colorMat(0x3a3f46, 0.5), 0, 0.963, 0.1, { cast: false });
    c.box(0.09, 0.05, 0.02, glowMat(0x6fdc8c, 1.3), -0.09, 1.34, 0.135, { cast: false });
    c.box(0.14, 0.07, 0.02, MAT.screen, 0.06, 1.3, 0.135, { cast: false });
    // the bean hopper on top: a clear cone you can see the level in, with a lid that lifts
    var hop = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.07, 0.17, 14, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xdff0ff, transparent: true, opacity: 0.28, roughness: 0.05, side: THREE.DoubleSide }));
    hop.position.set(0, 1.49, -0.04); hop.castShadow = false; c.add(hop);
    var lid = new THREE.Group(); lid.position.set(0, 1.575, -0.15); c.add(lid); lid.userData.coffLid = true;
    var lm = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.018, 14), body); lm.position.set(0, 0, 0.11); lid.add(lm);
    var beans = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.065, 0.12, 12), colorMat(0x4a2a12, 1));
    beans.position.set(0, 1.46, -0.04); beans.castShadow = false; c.add(beans); beans.userData.coffBeans = true;
    // the cup stack beside it, and the cup that lands under the spout
    var cups = new THREE.Group(); cups.position.set(0.21, 0.96, -0.08); c.add(cups); cups.userData.coffCups = true; cups.userData.slots = [];
    var brewG = new THREE.Group(); brewG.position.set(0, 0.97, 0.1); c.add(brewG); brewG.userData.coffBrew = true;
    c.hit(0.72, 1.6, 0.62, 0, 0.8, 0, { kind: 'lobbyCoffee' });
    var cupHit = c.hit(0.24, 0.2, 0.22, 0, 1.02, 0.12, { kind: 'coffeeCup' }); cupHit.userData.coffCupHit = true;   /* parked out of the world while there is no cup, so it never steals the machine's own prompt */
    c.placard(['COFFEE', 'help yourself'], 0.42, 0.15, 0, 1.62, 0.22, { titleColor: '#ffc857' });
  }, after: function (c, P, inst, id) { syncCoffee(id); } });
  defProp('vending', { label: 'vending machine', x: ROOM.x - 0.5, z: 6.8, rot: 3, multi: { max: 4, price: 900, gap: 1.15, ico: '🥤', lic: 'catering' }, build: function (c, P) {
    var SKIN = [[0x8f1f1a, '#ffc857'], [0x14507a, '#8fd0ff'], [0x1d6b45, '#b6f2c9'], [0x2b2f36, '#e8eef4']];   /* a row of identical red machines would read as a copy-paste, so every unit gets its own livery */
    var sk = SKIN[(((P && P.unit) || 1) - 1) % SKIN.length];
    var shell = colorMat(sk[0], 0.45, 0.25), dark = colorMat(0x1a1d21, 0.6), steel = colorMat(0x9aa0a6, 0.35, 0.7), inner = colorMat(0x23272c, 0.8);
    // a shell, not a block: the front-left is left open so you can see the stock behind the glass
    c.box(0.95, 1.95, 0.06, inner, 0, 0.975, -0.33, { cast: false });          /* back */
    c.box(0.06, 1.95, 0.72, shell, -0.445, 0.975, 0);                          /* left side */
    c.box(0.06, 1.95, 0.72, shell, 0.445, 0.975, 0);                           /* right side */
    c.box(0.95, 0.06, 0.72, shell, 0, 1.92, 0, { cast: false });               /* top */
    c.box(0.95, 0.16, 0.72, dark, 0, 0.08, 0);                                 /* kick plate */
    c.box(0.26, 1.78, 0.72, shell, 0.315, 1.03, 0);                            /* the keypad pillar */
    c.box(0.62, 0.04, 0.68, inner, -0.13, 0.62, 0.01, { cast: false });        /* floor of the cabinet */
    c.solid(-0.48, 0.48, -0.37, 0.37);
    c.box(0.99, 0.05, 0.76, dark, 0, 1.97, 0, { cast: false });
    c.box(0.86, 0.24, 0.03, dark, 0, 1.79, 0.355, { cast: false });
    c.sign(['SNACKS & DRINKS'], 0.78, 0.15, 0, 1.79, 0.373, 0, { size: 30, bold: true, bg: '#101812', titleColor: sk[1], line: 'rgba(255,255,255,.35)' });

    // the glazed service door, hinged on the left upright
    var door = new THREE.Group(); door.position.set(-0.43, 1.12, 0.345); c.add(door); door.userData.vendDoor = true;
    function dbox(w, h2, d2, m, x, y, z, noCast) { var b = new THREE.Mesh(new THREE.BoxGeometry(w, h2, d2), m); b.position.set(x, y, z); b.castShadow = !noCast; door.add(b); return b; }
    dbox(0.04, 1.42, 0.05, shell, 0, 0, 0);
    dbox(0.04, 1.42, 0.05, shell, 0.6, 0, 0);
    dbox(0.64, 0.05, 0.05, shell, 0.3, 0.685, 0, true);
    dbox(0.64, 0.05, 0.05, shell, 0.3, -0.685, 0, true);
    var glass = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 1.36), new THREE.MeshPhysicalMaterial({ color: 0xdff0ff, transparent: true, opacity: 0.18, roughness: 0.02, metalness: 0.05, side: THREE.DoubleSide }));
    glass.position.set(0.3, 0, 0.004); glass.castShadow = false; door.add(glass);
    var handle = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.3, 0.05), steel); handle.position.set(0.56, 0, 0.05); door.add(handle);

    // the racks, which ride out with the door
    var racks = new THREE.Group(); racks.position.set(-0.13, 1.06, 0.02); c.add(racks); racks.userData.vendRacks = true;
    for (var r = 0; r < 4; r++) {
      var sy = 0.5 - r * 0.29;
      var shelf = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.012, 0.4), colorMat(0x3a3d42, 0.5)); shelf.position.set(0, sy, 0); shelf.castShadow = false; racks.add(shelf);
      for (var k = 0; k < 4; k++) {
        var coil = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.0032, 5, 10), steel);
        coil.position.set(-0.215 + k * 0.143, sy + 0.032, 0.13); coil.rotation.x = Math.PI / 2; coil.castShadow = false; racks.add(coil);
      }
    }
    racks.userData.slots = [];

    // the delivery tray, its flap, and the hit box you press E on to reach in
    c.box(0.62, 0.03, 0.34, dark, -0.13, 0.3, 0.08, { cast: false });
    c.box(0.66, 0.02, 0.36, dark, -0.13, 0.58, 0.08, { cast: false });
    var flap = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.24, 0.012), new THREE.MeshPhysicalMaterial({ color: 0x2a2f36, transparent: true, opacity: 0.5, roughness: 0.2 }));
    flap.position.set(-0.13, 0.44, 0.358); flap.castShadow = false; c.add(flap); flap.userData.vendFlap = true;
    c.hit(0.6, 0.3, 0.34, -0.13, 0.42, 0.2, { kind: 'vendTray' });
    var tray = new THREE.Group(); tray.position.set(-0.13, 0.33, 0.1); c.add(tray); tray.userData.vendTray = true;

    // the panel
    c.box(0.2, 0.14, 0.02, MAT.screen, 0.315, 1.6, 0.362, { cast: false });
    var disp = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.12), new THREE.MeshBasicMaterial({ map: textTex(['READY'], 200, 130, { size: 48, bg: '#08120c', color: '#6fdc8c', titleColor: '#6fdc8c', line: 'rgba(0,0,0,0)' }), transparent: true }));
    disp.position.set(0.315, 1.6, 0.3735); disp.castShadow = false; c.add(disp); disp.userData.vendDisp = true;
    for (var bq = 0; bq < 6; bq++) {
      var bx2 = 0.265 + (bq % 2) * 0.1, by2 = 1.4 - Math.floor(bq / 2) * 0.12;
      c.box(0.075, 0.075, 0.018, colorMat(bq === 0 ? 0x6fdc8c : 0xd8dce0, 0.4), bx2, by2, 0.366, { cast: false });
    }
    c.box(0.1, 0.014, 0.02, MAT.chrome, 0.315, 1.05, 0.368, { cast: false });
    c.box(0.07, 0.06, 0.02, dark, 0.315, 0.92, 0.368, { cast: false });
    c.hit(0.95, 1.95, 0.75, 0, 0.97, 0, { kind: 'vending' });
    c.light(new THREE.PointLight(0xbfe8ff, 0.5, 2.6), -0.13, 1.5, 0.2);
  }, after: function (c, P, inst, id) { syncVending(id); } });
  defProp('menuScreen', { label: 'menu screen', x: 4.0, z: 4 + WALL_T / 2 + 0.05, rot: 0, build: function (c) {
    c.box(1.4, 0.8, 0.05, MAT.black, 0, 2.05, 0); var tex = textTex(['TODAY', 'eighths · joints', 'top shelf on request', 'ID required'], 560, 320, { size: 40, bg: '#0b1a12', titleColor: '#6fdc8c', color: '#c9e8d0', line: 'rgba(111,220,140,.6)' });
    var scr = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.72), new THREE.MeshBasicMaterial({ map: tex })); scr.position.set(0, 2.05, 0.03); c.add(scr); c.light(new THREE.PointLight(0x6fdc8c, 0.25, 3), 0, 2.0, 0.4);
  } });
  // display shelf for packed goods in the processing room: one cell per strain, bags left and joints right
  defProp('goodsShelf', { label: 'goods shelf', x: 6.5, z: 3.55, rot: 2, build: function (c) {
    var wood = MAT.darkwood, w = goodsWidth(), d = 0.42, cols = goodsCols();
    c.box(w, 0.05, d, wood, 0, 0.16, 0, { solid: true }); [0.74, 1.3, 1.86].forEach(function (y) { c.box(w, 0.035, d, wood, 0, y, 0); });
    c.box(w, 2.0, 0.03, colorMat(0x2b2119, 0.9), 0, 1.0, -d / 2 + 0.015, { cast: false });   // back panel
    [-1, 1].forEach(function (s) { c.box(0.05, 2.0, d, wood, s * (w / 2 - 0.025), 1.0, 0); });
    for (var dv = 1; dv < cols; dv++) c.box(0.05, 1.8, d, wood, (dv - cols / 2) * GOODS_CELL, 1.06, 0);   // uprights, and a divider between every pair of cells
    c.box(w, 0.06, d + 0.02, wood, 0, 2.03, 0);
    c.sign(['GROW CO.', 'house menu · bags & joints'], Math.min(w - 0.2, 2.2), 0.3, 0, 2.2, 0.0, 0, { titleColor: '#6fdc8c', bg: '#0f1a12' });
    for (var i = 0; i < cols + 1; i++) c.add(spot(0xfff1d0, 0.35, 1.2, (i - cols / 2) * GOODS_CELL, 1.98, 0.12));   // a downlight over every divider
    var gg = c.dynGroup(); var gsh = new THREE.Group(); var gst = colorMat(0xa7adb4, 0.35, 0.8), gdk = colorMat(0x5b6168, 0.4, 0.7);
    var gpanel = new THREE.Mesh(new THREE.BoxGeometry(w - 0.12, 1.9, 0.014), gst); gsh.add(gpanel);
    for (var gs = 0; gs < 17; gs++) { var gbar = new THREE.Mesh(new THREE.BoxGeometry(w - 0.12, 0.012, 0.02), gdk); gbar.position.y = -0.9 + gs * 0.113; gsh.add(gbar); }
    var ghd = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.035, 0.035), gdk); ghd.position.set(0, -0.86, 0.02); gsh.add(ghd);
    gsh.position.set(0, 1.02, d / 2 + 0.05);   /* in front of the price cards, which hang off the shelf lips */ gg.userData.shutter = gsh; gg.add(gsh);
    var fz = d / 2 + 0.05, fd = 0.1;   /* the gate cannot sit flush without clipping the price cards, so an outer frame closes the slot it leaves at the edges */
    [-1, 1].forEach(function (s) { c.box(0.05, 2.0, fd, wood, s * (w / 2 - 0.025), 1.0, fz); }); c.box(w, 0.2, fd, wood, 0, 1.9, fz); c.box(w, 0.08, fd, wood, 0, 0.04, fz); c.box(w + 0.03, 0.06, fd + 0.04, wood, 0, 2.03, fz);   /* jambs, a head box hiding the rolled-up gate, a sill it lands on, and the shelf top carried over the frame */
    c.hit(w, 2.0, d, 0, 1.0, 0, { kind: 'goodsShelf' });
    function spot(col, inten, dist, x, y, z) { var l = new THREE.PointLight(col, inten, dist); l.position.set(x, y, z); return l; }
  }, after: function () { syncGoods(); } });   // refill after any rebuild: boot order, layout edits, resets
  // storage racking in the back annex: deliveries stack here by item until you carry a crate to where it goes
  defProp('stockCabinet', { label: 'stock cabinet', x: 7.55, z: -11.9, rot: 3, build: function (c) {
    var steel = colorMat(0x4a5058, 0.45, 0.6), dark = colorMat(0x2a2d33, 0.5, 0.5);
    c.box(1.2, 2.0, 0.55, steel, 0, 1.0, 0, { solid: true }); c.box(1.24, 0.04, 0.59, dark, 0, 2.02, 0); c.box(1.24, 0.06, 0.59, dark, 0, 0.03, 0);
    [-0.3, 0.3].forEach(function (x) { c.box(0.56, 1.86, 0.02, colorMat(0x565c64, 0.4, 0.6), x, 1.0, 0.285); c.box(0.02, 0.18, 0.03, MAT.chrome, x + (x < 0 ? 0.22 : -0.22), 1.05, 0.3); });
    c.box(0.08, 0.08, 0.03, dark, 0, 1.3, 0.3); c.box(0.02, 0.02, 0.02, glowMat(0x6fdc8c, 1.2), 0, 1.3, 0.315);   // keypad lock
    c.sign(['STOCK', 'packed goods · locked'], 0.5, 0.16, 0, 1.7, 0.3, 0, { size: 22, bg: '#f3e9cf', color: '#222', titleColor: '#1a6a2a', line: 'rgba(0,0,0,.3)' });
    c.hit(1.3, 2.0, 0.8, 0, 1.0, 0.1, { kind: 'stock' });
  } });
  defProp('storeRack', { label: 'storage racking', x: 0.5, z: -10.75, rot: 1, build: function (c) {
    var shelfM = colorMat(0x8a8f96, 0.35, 0.8); for (var s = 0; s < 3; s++) c.box(3.2, 0.03, 0.55, shelfM, 0, 0.25 + s * 0.7, 0);
    [[-1.58, -0.25], [1.58, -0.25], [-1.58, 0.25], [1.58, 0.25], [0, -0.25], [0, 0.25]].forEach(function (p) { c.box(0.04, 2.0, 0.04, shelfM, p[0], 1.0, p[1]); });
    c.solid(-1.65, 1.65, -0.32, 0.32); c.hit(3.3, 2.0, 0.6, 0, 1.0, 0, { kind: 'storage' });
    c.sign(['STORAGE', 'deliveries land here · E to take a crate'], 1.6, 0.34, 0, 2.2, 0.02, 0, { titleColor: '#ffc857' }); c.dynGroup();
  }, after: function () { syncStorage(); } });
  // office vault: cash you carry in goes in here; the bank courier collects from your pocket
  defProp('bagLine', { label: 'trim & bag line', x: 4.5, z: 2.9, rot: 1, build: function (c) {
    var st = colorMat(0x9aa0a6, 0.35, 0.8), dk = colorMat(0x2b2f35, 0.5, 0.6);
    c.box(1.2, 0.9, 0.6, st, 0, 0.45, 0, { solid: true }); c.box(0.5, 0.5, 0.5, dk, -0.3, 1.15, 0); c.cyl(0.28, 0.18, 0.35, st, -0.3, 1.55, 0, 14); c.box(0.5, 0.06, 0.4, colorMat(0x16181b, 0.9), 0.3, 0.95, 0, { cast: false }); c.box(0.2, 0.25, 0.04, MAT.white, 0.3, 1.1, 0.1, { cast: false });
    c.sign(['TRIM & BAG'], 0.6, 0.12, 0, 0.7, 0.305, 0, { size: 26, titleColor: '#6fdc8c', bg: '#101410' }); c.hit(1.3, 1.8, 0.8, 0, 0.9, 0.05, { kind: 'bagLine' });
  } });
  defProp('vipTable', { label: 'lounge table + armchairs', floor: 1, x: 7.4, z: -1.6, rot: 0, build: function (c) {
    var velvet = colorMat(0x5a1f3a, 0.95), brass = colorMat(0xc9a24a, 0.35, 0.8);
    c.cyl(0.45, 0.45, 0.05, MAT.darkwood, 0, 0.62, 0, 20); c.cyl(0.05, 0.05, 0.6, brass, 0, 0.3, 0, 10); c.cyl(0.28, 0.3, 0.04, brass, 0, 0.02, 0, 16); c.cyl(0.07, 0.05, 0.03, MAT.jar, 0.1, 0.66, 0.05, 12); c.cyl(0.015, 0.015, 0.2, colorMat(0xfff3c8, 0.4), -0.12, 0.75, -0.08, 8);
    [-0.95, 0.95].forEach(function (x) { c.box(0.7, 0.35, 0.7, velvet, x, 0.28, 0); c.box(0.14, 0.75, 0.7, velvet, x + (x > 0 ? 0.3 : -0.3), 0.6, 0); c.box(0.7, 0.3, 0.12, velvet, x, 0.58, -0.32); c.box(0.7, 0.3, 0.12, velvet, x, 0.58, 0.32); [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]].forEach(function (l) { c.box(0.05, 0.12, 0.05, brass, x + l[0], 0.06, l[1]); }); });
    c.solid(-1.3, 1.3, -0.4, 0.4);
  } });
  // the way down to the RF Smoking works, and the shuttered cabinet the packs are sold from
  defProp('cellarHatch', { label: 'basement hatch', x: 3.3, z: -0.4, rot: 3, build: function (c) {
    var st = colorMat(0x8d949c, 0.35, 0.8), dk = colorMat(0x2b2f35, 0.5, 0.6);
    c.box(1.3, 0.04, 1.3, dk, 0, 0.02, 0, { cast: false }); c.box(1.1, 0.012, 1.1, MAT.black, 0, 0.042, 0, { cast: false });
    var lid = c.box(1.2, 0.05, 1.2, st, 0, 0.64, -0.6); lid.rotation.x = -Math.PI / 2 + 0.06;   // the lid stands open flat against the wall, the ladder comes up in front of it
    [-0.4, 0.4].forEach(function (x) { c.cyl(0.022, 0.022, 1.1, colorMat(0xf2c21a, 0.6), x, 0.55, -0.42, 8); }); for (var r = 0; r < 3; r++) c.box(0.8, 0.03, 0.03, st, 0, 0.12 + r * 0.3, -0.42, { cast: false });
    c.sign(['RF SMOKING ↓', 'basement works'], 0.9, 0.26, 0, 1.45, -0.6, 0, { size: 26, bg: '#14100c', titleColor: '#e8c27a', color: '#b9a88a', line: 'rgba(232,194,122,.5)' }); c.box(0.04, 1.5, 0.04, dk, 0, 0.75, -0.63);
    c.solid(-0.65, 0.65, -0.8, -0.55); c.hit(1.3, 1.5, 1.3, 0, 0.75, 0, { kind: 'cellarDown' });
  } });
  defProp('cigCabinet', { label: 'cigarette cabinet', x: 2.5, z: 3.68, rot: 2, build: function (c) {
    var m = colorMat(0x2b2f35, 0.5, 0.5), inner = colorMat(0xe9e4d8, 0.8), st = colorMat(0xa7adb4, 0.35, 0.8), dk = colorMat(0x5b6168, 0.4, 0.7);
    c.box(1.2, 2.0, 0.05, m, 0, 1.0, -0.175); c.box(0.05, 2.0, 0.4, m, -0.6, 1.0, 0); c.box(0.05, 2.0, 0.4, m, 0.6, 1.0, 0); c.box(1.2, 0.06, 0.4, m, 0, 1.97, 0); c.box(1.2, 0.42, 0.4, m, 0, 0.21, 0); c.box(1.1, 1.5, 0.01, inner, 0, 1.17, -0.145, { cast: false });
    [0.57, 0.92, 1.27, 1.62].forEach(function (y) { c.box(1.1, 0.025, 0.3, m, 0, y - 0.013, 0, { cast: false }); }); c.box(1.2, 0.14, 0.1, m, 0, 1.9, 0.22); c.box(0.03, 1.5, 0.03, st, -0.565, 1.15, 0.2, { cast: false }); c.box(0.03, 1.5, 0.03, st, 0.565, 1.15, 0.2, { cast: false });
    c.sign(['RF SMOKING'], 0.7, 0.1, 0, 1.9, 0.272, 0, { size: 26, bg: '#14100c', titleColor: '#e8c27a', line: 'rgba(0,0,0,0)' });
    var g = c.dynGroup(); var sh = new THREE.Group(); var panel = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.45, 0.014), st); sh.add(panel); for (var s = 0; s < 14; s++) { var gr = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.012, 0.02), dk); gr.position.y = -0.69 + s * 0.105; sh.add(gr); } var hd = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.035, 0.035), dk); hd.position.set(0, -0.66, 0.02); sh.add(hd); sh.position.set(0, 1.145, 0.2); g.userData.shutter = sh; g.add(sh);
    c.solid(-0.6, 0.6, -0.2, 0.2); c.hit(1.25, 2.0, 0.5, 0, 1.0, 0.03, { kind: 'cigCab' });
  }, after: function () { syncCigCab(); } });
  // steel weapon locker on the staff side of the counter: buy, take and restock what you fight back with
  defProp('gunLocker', { label: 'weapon locker', x: -2.6, z: 3.68, rot: 2, build: function (c) {
    var m = colorMat(0x3b4048, 0.45, 0.7), m2 = colorMat(0x2c3036, 0.45, 0.7);
    c.box(0.8, 1.5, 0.36, m, 0, 0.75, 0, { solid: true });
    [-0.2, 0.2].forEach(function (x) { c.box(0.38, 1.38, 0.02, m2, x, 0.74, 0.185); c.box(0.02, 0.14, 0.03, MAT.chrome, x * 0.25, 0.8, 0.205, { cast: false }); for (var v = 0; v < 3; v++) c.box(0.2, 0.012, 0.005, MAT.black, x, 1.25 + v * 0.04, 0.197, { cast: false }); });
    c.box(0.05, 0.07, 0.03, MAT.chrome, 0, 0.62, 0.205, { cast: false });
    c.sign(['WEAPONS', 'staff only'], 0.5, 0.16, 0, 1.62, -0.17, 0, { size: 26, titleColor: '#ff6b6b', bg: '#101410' });
    c.hit(0.85, 1.5, 0.46, 0, 0.75, 0, { kind: 'locker' });
  } });
  defProp('vault', { label: 'vault', x: -ROOM.x + 0.45, z: 2.4, rot: 1, build: function (c) {
    var m = colorMat(0x2a2d33, 0.4, 0.6), m2 = colorMat(0x3a3d42, 0.4, 0.6);
    c.box(0.7, 0.95, 0.7, m, 0, 0.475, 0, { solid: true }); c.box(0.6, 0.85, 0.03, m2, 0, 0.475, 0.36);
    var dial = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 20), MAT.chrome); dial.rotation.x = Math.PI / 2; dial.position.set(-0.12, 0.55, 0.39); c.add(dial);
    for (var t = 0; t < 12; t++) { var tick = c.box(0.006, 0.02, 0.005, MAT.black, -0.12 + Math.cos(t / 12 * Math.PI * 2) * 0.05, 0.55 + Math.sin(t / 12 * Math.PI * 2) * 0.05, 0.412, { cast: false }); }
    c.box(0.03, 0.22, 0.03, MAT.chrome, 0.16, 0.5, 0.4); c.box(0.12, 0.03, 0.03, MAT.chrome, 0.16, 0.62, 0.4); [0.2, 0.75].forEach(function (y) { c.box(0.04, 0.08, 0.02, MAT.chrome, -0.3, y, 0.37, { cast: false }); });
    c.sign(['VAULT'], 0.4, 0.1, 0, 0.88, 0.375, 0, { size: 30, titleColor: '#ffc857', bg: '#101410' });
    c.hit(0.8, 1.0, 0.8, 0, 0.5, 0, { kind: 'vault' });
  } });
  // coin-op arcade cabinet in the lobby: customers drop a dollar in, you empty the coin box
  defProp('arcade', { label: 'arcade cabinet', x: -ROOM.x + 0.45, z: 6.4, rot: 1, multi: { max: 4, price: 750, gap: 1.0, ico: '🕹️', lic: 'amusement' }, build: function (c) {
    // the same cabinet as the creative catalogue, with a coin box customers feed
    var col = 0x2a2d33; c.box(0.7, 1.8, 0.7, colorMat(col, 0.5), 0, 0.9, 0, { solid: true }); c.box(0.6, 0.45, 0.02, MAT.screen, 0, 1.3, 0.36, { cast: false }); c.box(0.7, 0.2, 0.3, colorMat(col, 0.5), 0, 1.0, 0.45);
    c.cyl(0.012, 0.012, 0.12, MAT.chrome, -0.15, 1.15, 0.5, 8); var ball = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), colorMat(0xc94a3a, 0.4)); ball.position.set(-0.15, 1.22, 0.5); c.add(ball);
    [0, 0.1].forEach(function (x) { c.cyl(0.025, 0.025, 0.02, colorMat(0xffd166, 0.4), 0.1 + x, 1.11, 0.5, 12); });
    c.box(0.6, 0.2, 0.02, glowMat(0x6fdc8c, 1.0), 0, 1.72, 0.36, { cast: false }); c.light(new THREE.PointLight(0x6fdc8c, 0.4, 3), 0, 1.4, 0.7);
    var marquee = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.16), new THREE.MeshBasicMaterial({ map: textTex(['GROW RUSH'], 280, 80, { size: 40, bg: 'rgba(0,0,0,0)', titleColor: '#0b1a12', line: 'rgba(0,0,0,0)' }), transparent: true })); marquee.position.set(0, 1.72, 0.372); c.add(marquee);
    c.box(0.3, 0.12, 0.04, MAT.black, 0, 0.55, 0.36, { cast: false }); c.box(0.1, 0.04, 0.01, MAT.chrome, 0, 0.55, 0.385, { cast: false });   // coin box
    c.hit(0.8, 2.0, 0.9, 0, 1.0, 0.1, { kind: 'arcade' });
  } });
  defProp('procShelf', { label: 'storage shelf', x: 8.5, z: -1.55, rot: 0, build: function (c) {
    var shelfM = colorMat(0x8a8f96, 0.35, 0.8); for (var s = 0; s < 4; s++) c.box(1.6, 0.03, 0.45, shelfM, 0, 0.3 + s * 0.5, 0);
    [[-0.78, -0.2], [0.78, -0.2], [-0.78, 0.2], [0.78, 0.2]].forEach(function (p) { c.box(0.035, 1.9, 0.035, shelfM, p[0], 0.95, p[1]); });
    c.box(0.5, 0.3, 0.35, colorMat(0xc8a97a, 1), -0.45, 0.47, 0); c.box(0.4, 0.25, 0.3, colorMat(0xe8e8ee, 0.7), 0.35, 0.44, 0); c.sign(['BAGGIES'], 0.3, 0.08, 0.35, 0.44, 0.152, 0, { size: 26, bg: '#f3e9cf', color: '#222', titleColor: '#222', line: 'rgba(0,0,0,.3)' });
    for (var j = 0; j < 6; j++) { c.cyl(0.06, 0.06, 0.14, MAT.jar, -0.6 + j * 0.24, 0.89, 0, 12); c.cyl(0.062, 0.062, 0.015, MAT.jarLid, -0.6 + j * 0.24, 0.965, 0, 12); }
    c.box(0.6, 0.2, 0.3, colorMat(0x3a5a3a, 0.9), -0.4, 1.42, 0); c.box(0.3, 0.14, 0.2, colorMat(0xf5e6c8, 0.8), 0.3, 1.39, 0); c.box(0.5, 0.08, 0.3, MAT.white, 0.4, 1.86, 0); c.cyl(0.09, 0.09, 0.2, colorMat(0x2b6fb3, 0.4), -0.5, 1.92, 0, 14);
    c.solid(-0.8, 0.8, -0.25, 0.25);
  } });
  defProp('hallClockTable', { label: 'side table', x: -3.5, z: 1.6, rot: 1, build: function (c) { c.box(0.5, 0.04, 0.5, MAT.wood, 0, 0.7, 0, { solid: true }); legs4(c, 0.5, 0.5, 0.68, MAT.darkwood, 0.05, 0.04); c.box(0.44, 0.03, 0.44, MAT.wood, 0, 0.25, 0, { cast: false }); c.cyl(0.06, 0.05, 0.16, colorMat(0xf5f5f0, 0.5), -0.1, 0.8, 0, 14); for (var i = 0; i < 5; i++) { var fl = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), colorMat([0xff6b9d, 0xffd166, 0x9ad0ff, 0xff8c42, 0xf2f2f2][i], 0.8)); fl.position.set(-0.1 + Math.cos(i * 1.3) * 0.05, 0.95 + (i % 2) * 0.04, Math.sin(i * 1.3) * 0.05); c.add(fl); var st = c.cyl(0.004, 0.004, 0.14, MAT.stem, -0.1 + Math.cos(i * 1.3) * 0.03, 0.88, Math.sin(i * 1.3) * 0.03, 5); } c.box(0.14, 0.2, 0.03, MAT.darkwood, 0.14, 0.82, -0.05); c.box(0.11, 0.16, 0.005, new THREE.MeshBasicMaterial({ map: textTex(['📷', 'the crew'], 110, 160, { size: 30, bg: '#f0ead8', color: '#333', titleColor: '#333', line: 'rgba(0,0,0,0)' }) }), 0.14, 0.82, -0.032, { cast: false }); } });
  defProp('floorLamp', { label: 'floor lamp', x: -1.2, z: -1.6, rot: 0, build: function (c) { c.cyl(0.16, 0.18, 0.03, MAT.black, 0, 0.015, 0, 20); c.cyl(0.015, 0.015, 1.7, MAT.chrome, 0, 0.85, 0, 10); var sh = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.3, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xf1e7c8, side: THREE.DoubleSide, emissive: 0xffe0a0, emissiveIntensity: 0.4, roughness: 0.9 })); sh.position.y = 1.7; c.add(sh); c.light(new THREE.PointLight(0xffe0a0, 0.4, 5), 0, 1.6, 0); c.solid(-0.2, 0.2, -0.2, 0.2); } });
  defProp('guardBoard', { label: 'notice board', x: 5.0, z: ROOM.z - 0.13, rot: 2, build: function (c) { c.box(1.0, 0.7, 0.03, colorMat(0x8a6a4a, 0.9), 0, 1.7, 0); c.box(1.04, 0.74, 0.02, MAT.darkwood, 0, 1.7, -0.01, { cast: false }); [['NO ID', 'NO ENTRY', '#fff', '#c9302c'], ['LOST', 'grey cat, answers to Kush', '#333', '#f0ead8'], ['BAND', 'friday · the dry room', '#062010', '#6fdc8c'], ['WANTED', 'trimmers · ask inside', '#332200', '#ffc857']].forEach(function (n, i) { var x = -0.32 + (i % 2) * 0.36, y = 1.86 - Math.floor(i / 2) * 0.32; var note = c.sign([n[0], n[1]], 0.3, 0.24, x, y, 0.02, 0, { size: 22, bg: n[3], color: n[2], titleColor: n[2], line: 'rgba(0,0,0,.2)' }); note.rotation.z = (i % 2 ? -0.06 : 0.05); var pin = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), colorMat([0xc94a3a, 0x3a7fd6, 0xffd166, 0x3aa36a][i], 0.4)); pin.position.set(x, y + 0.1, 0.03); c.add(pin); }); } });
  // upstairs
  defProp('dining', { label: 'dining set', floor: 1, x: -4, z: -5.6, rot: 0, build: function (c) {
    c.box(1.6, 0.05, 0.9, MAT.wood, 0, 0.75, 0, { solid: true }); c.box(1.5, 0.04, 0.8, MAT.darkwood, 0, 0.72, 0, { cast: false }); legs4(c, 1.6, 0.9, 0.72, MAT.darkwood, 0.1, 0.06);
    chair(c, -0.5, -0.8, 0, fabricMat(0x3a5a3a), MAT.darkwood); chair(c, 0.5, -0.8, 0, fabricMat(0x3a5a3a), MAT.darkwood); chair(c, -0.5, 0.8, Math.PI, fabricMat(0x3a5a3a), MAT.darkwood); chair(c, 0.5, 0.8, Math.PI, fabricMat(0x3a5a3a), MAT.darkwood);
    c.hit(1.8, 0.8, 1.1, 0, 0.7, 0, { kind: 'eatspot', label: 'dining table' });
    [-0.35, 0.35].forEach(function (x) { c.cyl(0.14, 0.12, 0.012, colorMat(0xf5f5f0, 0.4), x, 0.786, 0, 20); c.cyl(0.05, 0.045, 0.1, MAT.jar, x + 0.2, 0.83, -0.2, 12); c.box(0.02, 0.005, 0.14, MAT.chrome, x - 0.18, 0.783, 0, { cast: false }); c.box(0.02, 0.005, 0.14, MAT.chrome, x + 0.18, 0.783, 0, { cast: false }); });
    var vase = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.035, 0.18, 12), MAT.jar); vase.position.set(0, 0.87, 0); c.add(vase); for (var f = 0; f < 4; f++) { c.cyl(0.004, 0.004, 0.2, MAT.stem, Math.cos(f * 1.6) * 0.02, 1.02, Math.sin(f * 1.6) * 0.02, 5); var fl = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), colorMat([0xff6b9d, 0xffd166, 0xf2f2f2, 0xff8c42][f], 0.8)); fl.position.set(Math.cos(f * 1.6) * 0.04, 1.12, Math.sin(f * 1.6) * 0.04); c.add(fl); }
    c.box(0.24, 0.005, 0.24, colorMat(0xe0c25a, 1), -0.35, 0.78, 0, { cast: false }); c.box(0.24, 0.005, 0.24, colorMat(0xe0c25a, 1), 0.35, 0.78, 0, { cast: false });
  } });
  defProp('couchUp', { label: 'couch + coffee table', floor: 1, x: DIVX - 3.7, z: 0.5, rot: 1, build: function (c) {
    // built along local x with the back at -z; rot 1 turns the back to the wall side (-x) so it faces the TV on the right wall
    var seatM = fabricMat(0x3b4a5c), pipeM = fabricMat(0x2a3542);
    sofaBuild(c, 2.4, seatM, pipeM);
    [-0.6, 0.6].forEach(function (x) { var cu = c.box(0.45, 0.14, 0.45, fabricMat(x < 0 ? 0xe0c25a : 0xc94a3a), x, 0.48, 0.1); cu.rotation.y = x < 0 ? -0.2 : 0.25; });
    c.box(1.2, 0.14, 0.3, fabricMat(0x8a8a8a), 0.2, 0.34, 0.0).rotation.z = 0.02;   // throw blanket
    c.hit(2.5, 1.2, 1.2, 0, 0.6, 0, { kind: 'couch', seat: 'couchUp' });
    coffeeTableBuild(c, 0, 1.3, 1.2, 0.7);
    c.box(0.16, 0.16, 0.12, MAT.black, 0.3, 0.52, 1.3); c.box(0.14, 0.02, 0.1, MAT.plastic, 0.3, 0.6, 1.3, { cast: false }); var mug = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.09, 12), colorMat(0x6fdc8c, 0.5)); mug.position.set(-0.3, 0.49, 1.2); c.add(mug); c.box(0.18, 0.02, 0.12, MAT.black, -0.1, 0.45, 1.4, { cast: false }); for (var b = 0; b < 12; b++) c.box(0.012, 0.005, 0.012, colorMat(0x8a8f96), -0.16 + (b % 6) * 0.024, 0.462, 1.38 + Math.floor(b / 6) * 0.03, { cast: false });   // remote
    c.box(0.24, 0.02, 0.3, colorMat(0xe8e8ee, 0.7), 0.35, 0.45, 1.15, { cast: false }); c.box(0.2, 0.01, 0.26, new THREE.MeshBasicMaterial({ map: textTex(['grow', 'notes'], 100, 130, { size: 26, bg: '#f0ead8', color: '#333', titleColor: '#1a6a2a', line: 'rgba(0,0,0,0)' }) }), 0.35, 0.462, 1.15, { cast: false });
    c.box(4.5, 0.02, 3.6, new THREE.MeshStandardMaterial({ map: TEX.fabric, color: 0x5a3a2a, roughness: 1 }), 0, 0.01, 1.4, { cast: false }); c.box(4.2, 0.005, 3.3, new THREE.MeshStandardMaterial({ map: TEX.fabric, color: 0x7a4a34, roughness: 1 }), 0, 0.022, 1.4, { cast: false });
    c.box(0.03, 1.7, 0.03, MAT.chrome, -1.6, 0.85, -0.2); c.cyl(0.14, 0.16, 0.02, MAT.black, -1.6, 0.01, -0.2, 18); var lshade = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.32, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0xf1e7c8, side: THREE.DoubleSide, emissive: 0xffe0a0, emissiveIntensity: 0.4 })); lshade.position.set(-1.6, 1.8, -0.2); c.add(lshade); c.light(new THREE.PointLight(0xffe0a0, 0.4, 5), -1.6, 1.7, -0.2);
  }, after: function (c, P) { var v = propWorld('couchUp', 0, 0.1); world.couchSeat = { x: v.x, z: v.z, yaw: -Math.PI / 2 + P.rot * Math.PI / 2 - Math.PI / 2 }; } });
  defProp('bed', { label: 'bed', floor: 1, x: -8.5, z: 6.9, rot: 0, build: function (c) {
    c.box(1.6, 0.4, 2.1, MAT.darkwood, 0, 0.2, 0, { solid: true }); c.box(1.5, 0.22, 2.0, fabricMat(0xe8e8ee), 0, 0.51, 0); c.box(1.52, 0.02, 2.02, colorMat(0xd0d0d8, 0.9), 0, 0.51, 0, { cast: false });
    var duvet = c.box(1.54, 0.18, 1.25, fabricMat(0x3a6a4a), 0, 0.68, 0.38); c.box(1.54, 0.04, 0.2, fabricMat(0x2f5a3c), 0, 0.78, -0.2, { cast: false });
    [-0.38, 0.38].forEach(function (x) { c.box(0.62, 0.14, 0.42, fabricMat(0xffffff), x, 0.69, -0.78).rotation.y = x < 0 ? 0.05 : -0.05; });
    c.box(1.6, 0.9, 0.08, MAT.darkwood, 0, 0.6, -1.05); for (var s = -0.65; s <= 0.65; s += 0.26) c.box(0.16, 0.5, 0.02, MAT.wood, s, 0.7, -1.0, { cast: false });
    c.box(0.5, 0.55, 0.45, MAT.darkwood, 1.1, 0.275, -0.9, { solid: true }); drawer(c, 0.42, 0.18, 0.02, 1.1, 0.4, -0.67); drawer(c, 0.42, 0.18, 0.02, 1.1, 0.17, -0.67);
    c.cyl(0.08, 0.06, 0.03, MAT.black, 1.1, 0.57, -0.9, 14); c.cyl(0.012, 0.012, 0.22, MAT.chrome, 1.1, 0.68, -0.9, 8); var sh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.14, 14, 1, true), new THREE.MeshStandardMaterial({ color: 0xf1e7c8, side: THREE.DoubleSide, emissive: 0xffe0a0, emissiveIntensity: 0.3 })); sh.position.set(1.1, 0.82, -0.9); c.add(sh); c.light(new THREE.PointLight(0xffe0a0, 0.3, 3), 1.1, 0.8, -0.9);
    c.box(0.1, 0.16, 0.06, MAT.black, 0.95, 0.63, -0.8); c.box(0.08, 0.05, 0.005, MAT.screen, 0.95, 0.66, -0.768, { cast: false }); c.box(0.12, 0.18, 0.03, colorMat(0x8a2a2a, 0.8), 1.25, 0.64, -0.95).rotation.z = 0.1;
    c.hit(1.8, 1.0, 2.3, 0, 0.5, 0, { kind: 'bed' });
    c.box(1.2, 0.02, 0.6, new THREE.MeshStandardMaterial({ map: TEX.fabric, color: 0x6a5a4a, roughness: 1 }), 0, 0.01, 1.4, { cast: false });
  }, after: function (c, P) { var v = propWorld('bed', 0, 0.3); world.bedSpot = { x: v.x, z: v.z, yaw: Math.PI + P.rot * Math.PI / 2 }; } });
  defProp('upBooks', { label: 'bookshelf', floor: 1, x: 4.0, z: -8.6, rot: 0, build: function (c) { bookshelfBuild(c, 1.6, 2.0, 4); } });
  defProp('windowSeat', { label: 'window seat', floor: 1, x: -2.0, z: ROOM.z - 0.5, rot: 0, build: function (c) { c.box(6.0, 0.45, 0.6, MAT.wood, 0, 0.225, 0, { solid: true }); c.box(6.0, 0.08, 0.6, fabricMat(0x3a5a3a), 0, 0.49, 0); for (var k = 0; k < 4; k++) { var cu = c.box(0.5, 0.14, 0.5, fabricMat([0xe0c25a, 0x6fdc8c, 0xd64a9a, 0x3ad0ff][k]), -2.2 + k * 1.4, 0.6, 0); cu.rotation.y = (k % 2 ? 0.2 : -0.15); } c.box(0.4, 0.03, 0.28, colorMat(0x8a2a2a, 0.8), 1.2, 0.545, 0.1, { cast: false }); } });
  defProp('upPlant1', { label: 'plant', floor: 1, x: -8.5, z: -8.3, build: function (c) { c.fern(0, 0, 1.2); } });
  defProp('upPlant2', { label: 'plant', floor: 1, x: 11.2, z: -8.3, build: function (c) { c.fern(0, 0, 1.2); } });
  defProp('upPlant3', { label: 'plant', floor: 1, x: 11.2, z: 5.0, build: function (c) { c.fern(0, 0, 1.2); } });
  defProp('upRug', { label: 'rug', floor: 1, x: -4, z: 0.5, rot: 0, build: function (c) { c.box(3.6, 0.02, 2.6, new THREE.MeshStandardMaterial({ map: TEX.fabric, color: 0x4a3b5c, roughness: 1 }), 0, 0.01, 0, { cast: false }); c.box(3.2, 0.005, 2.2, new THREE.MeshStandardMaterial({ map: TEX.fabric, color: 0x6a4f7a, roughness: 1 }), 0, 0.022, 0, { cast: false }); } });
  defProp('upDresser', { label: 'dresser', floor: 1, x: -11.4, z: 4.5, rot: 1, build: function (c) { c.box(1.2, 0.9, 0.5, MAT.darkwood, 0, 0.45, 0, { solid: true }); c.box(1.24, 0.04, 0.54, MAT.wood, 0, 0.92, 0, { cast: false }); for (var r = 0; r < 3; r++) for (var q = 0; q < 2; q++) drawer(c, 0.52, 0.22, 0.02, -0.29 + q * 0.58, 0.2 + r * 0.27, 0.24); c.box(0.5, 0.6, 0.03, MAT.darkwood, 0.2, 1.3, -0.2); c.box(0.44, 0.54, 0.005, new THREE.MeshPhysicalMaterial({ color: 0xdfe8f0, roughness: 0.05, metalness: 0.9 }), 0.2, 1.3, -0.18, { cast: false }); c.cyl(0.05, 0.04, 0.12, MAT.jar, -0.4, 1.0, 0, 12); c.box(0.2, 0.25, 0.02, colorMat(0x8a2a2a, 0.8), -0.35, 1.06, -0.15).rotation.z = 0.1; } });

