//@ prop definitions
  // ── prop definitions ───────────────────────────────────────────────
  // Every prop is built with its FRONT toward local +z. rot (quarter turns) then points that front into the room:
  // rot 0 → +z (things against the back walls), rot 1 → +x (left wall), rot 2 → -z (front wall), rot 3 → -x (right wall).
  var lampM = new THREE.MeshStandardMaterial({ color: 0x3aa36a, side: THREE.DoubleSide, roughness: 0.6 });
  function legs4(c, w, d, h, mat, inset, thick) { inset = inset || 0.06; thick = thick || 0.05; [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (l) { c.box(thick, h - 0.012, thick, mat, l[0] * (w / 2 - inset), h / 2 + 0.006, l[1] * (d / 2 - inset)); c.box(thick + 0.012, 0.012, thick + 0.012, MAT.soft, l[0] * (w / 2 - inset), 0.006, l[1] * (d / 2 - inset), { cast: false }); }); }
  // a drawer front: a shadow gap round it, a raised panel, and a bar handle on two posts
  function drawer(c, w, h, d, x, y, z, mat) {
    c.box(w, h, d, mat || MAT.darkwood, x, y, z); var f = z + d / 2;
    c.box(w - 0.012, h - 0.012, 0.004, MAT.black, x, y, f + 0.001, { cast: false }); c.box(w - 0.026, h - 0.026, 0.016, MAT.wood, x, y, f + 0.008, { cast: false });
    var hw = Math.min(0.2, w * 0.45); [-1, 1].forEach(function (sd) { c.cyl(0.005, 0.005, 0.022, MAT.chrome, x + sd * hw * 0.42, y, f + 0.026, 8).rotation.x = Math.PI / 2; });
    c.cyl(0.006, 0.006, hw, MAT.chrome, x, y, f + 0.038, 10).rotation.z = Math.PI / 2;
  }
  function chair(c, x, z, rotY, seatM, frameM) {
    var g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY || 0; c.add(g);
    function m(geo, mat, px, py, pz) { var mm = new THREE.Mesh(geo, mat); mm.position.set(px, py, pz); mm.castShadow = true; g.add(mm); return mm; }
    m(bevelGeo(0.44, 0.05, 0.44), seatM, 0, 0.45, 0); m(bevelGeo(0.44, 0.06, 0.4), seatM, 0, 0.5, 0.01);
    var back = m(bevelGeo(0.42, 0.42, 0.04), seatM, 0, 0.74, -0.2); back.rotation.x = -0.08;
    [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]].forEach(function (l) { m(roundCylGeo(0.018, 0.018, 0.45, 8), frameM || MAT.chrome, l[0], 0.225, l[1]); });
    c.solid(x - 0.25, x + 0.25, z - 0.25, z + 0.25);
    return g;
  }
  function officeChairBuild(c) {
    var seatM = fabricMat(0x24272c), meshM = fabricMat(0x15171a), shellM = MAT.soft;
    c.cyl(0.05, 0.06, 0.05, MAT.chrome, 0, 0.115, 0, 14); c.cyl(0.024, 0.024, 0.2, MAT.chrome, 0, 0.24, 0, 12); c.cyl(0.034, 0.034, 0.14, MAT.soft, 0, 0.37, 0, 12);
    for (var i = 0; i < 5; i++) { var a = i / 5 * Math.PI * 2; var arm = c.box(0.3, 0.026, 0.046, MAT.alu, Math.cos(a) * 0.16, 0.085, Math.sin(a) * 0.16); arm.rotation.y = -a; c.cyl(0.014, 0.014, 0.05, MAT.soft, Math.cos(a) * 0.3, 0.06, Math.sin(a) * 0.3, 8); var wh = c.cyl(0.03, 0.03, 0.04, MAT.black, Math.cos(a) * 0.3, 0.03, Math.sin(a) * 0.3, 12); wh.rotation.z = Math.PI / 2; wh.rotation.y = -a; }
    c.box(0.3, 0.04, 0.3, shellM, 0, 0.445, 0);                                                      /* the mechanism under the seat */
    c.box(0.5, 0.07, 0.5, seatM, 0, 0.5, -0.01, { r: 0.03 }); c.box(0.44, 0.03, 0.12, seatM, 0, 0.525, -0.2, { r: 0.012 });   /* the pad, with a waterfall front edge */
    c.box(0.05, 0.36, 0.03, shellM, 0, 0.64, 0.27).rotation.x = 0.16;                                /* the spine the back hangs on */
    var back = c.box(0.46, 0.56, 0.035, meshM, 0, 0.86, 0.275, { r: 0.016 }); back.rotation.x = 0.12;
    [-0.235, 0.235].forEach(function (x) { c.box(0.022, 0.58, 0.05, shellM, x, 0.86, 0.275).rotation.x = 0.12; });   /* the frame round the mesh */
    c.box(0.5, 0.024, 0.05, shellM, 0, 1.147, 0.31).rotation.x = 0.12; c.box(0.36, 0.07, 0.05, seatM, 0, 0.72, 0.245, { r: 0.02 }).rotation.x = 0.12;   /* top rail, lumbar pad */
    c.box(0.03, 0.12, 0.024, shellM, 0, 1.2, 0.325).rotation.x = 0.12; c.box(0.3, 0.13, 0.06, seatM, 0, 1.29, 0.33, { r: 0.025 }).rotation.x = 0.05;   /* headrest */
    [-0.29, 0.29].forEach(function (x) { c.box(0.03, 0.2, 0.04, shellM, x, 0.6, 0.02); c.box(0.03, 0.03, 0.14, shellM, x, 0.5, 0.05); c.box(0.07, 0.03, 0.27, seatM, x, 0.712, -0.02, { r: 0.012 }); });
    c.solid(-0.3, 0.3, -0.3, 0.3);
  }
  growDefProp('officeDesk', { label: 'office desk', x: -ROOM.x + 0.55, z: 1.0, rot: 1, build: function (c) {
    // desk along local x, laptop faces the chair at +z; drawers on the right, cable tidy, lamp, mug, notepad
    c.box(1.6, 0.05, 0.72, MAT.wood, 0, 0.78, 0, { solid: true }); c.box(1.62, 0.02, 0.74, MAT.darkwood, 0, 0.745, 0, { cast: false });
    c.box(0.06, 0.78, 0.06, MAT.metal, -0.74, 0.39, -0.3); c.box(0.06, 0.78, 0.06, MAT.metal, -0.74, 0.39, 0.3); c.box(0.06, 0.02, 0.6, MAT.metal, -0.74, 0.01, 0);
    c.box(0.45, 0.7, 0.66, MAT.darkwood, 0.55, 0.36, 0, { cast: false }); drawer(c, 0.41, 0.18, 0.62, 0.55, 0.6, 0); drawer(c, 0.41, 0.18, 0.62, 0.55, 0.38, 0); drawer(c, 0.41, 0.18, 0.62, 0.55, 0.16, 0);
    // the PC: a widescreen monitor on an aluminium stand with its desktop on it, a keyboard and mouse on a desk mat, and a
    // tower under the desk. The picture is live: the clock runs and the figures are the shop's own. E on it sits you down.
    c.box(0.24, 0.012, 0.18, MAT.alu, -0.15, 0.811, -0.19, { cast: false, r: 0.005 }); c.box(0.055, 0.26, 0.018, MAT.alu, -0.15, 0.94, -0.225);
    var mg = new THREE.Group(); mg.position.set(-0.15, 1.115, -0.19); mg.rotation.x = -0.06; c.add(mg);
    screenShell(mg, 0.6, 0.3375, { bezel: 0.008, depth: 0.022, rim: 0.003, rimMat: MAT.gunmetal });
    var chin = new THREE.Mesh(bevelGeo(0.616, 0.022, 0.012, 0.004), MAT.gloss); chin.position.set(0, -0.188, -0.004); mg.add(chin);
    var pled = new THREE.Mesh(new THREE.CircleGeometry(0.003, 8), new THREE.MeshBasicMaterial({ color: 0x6fdc8c, toneMapped: false })); pled.position.set(0.28, -0.188, 0.0025); mg.add(pled);
    var hub = new THREE.Mesh(bevelGeo(0.12, 0.12, 0.03), MAT.gunmetal); hub.position.set(0, -0.03, -0.038); mg.add(hub);
    var pcv = document.createElement('canvas'); pcv.width = 960; pcv.height = 540; var pcScr = litPlane(pcv, 0.6, 0.3375); pcScr.position.z = 0.0005; mg.add(pcScr);
    var pgl = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.3375), MAT.screenGlass); pgl.position.z = 0.0016; mg.add(pgl);
    world.pcScr = { canvas: pcv, mesh: pcScr, at: 0 }; drawPcScreen();
    c.light(new THREE.PointLight(0x9fd8ff, 0.16, 1.4), -0.15, 1.1, 0.2);
    c.box(0.78, 0.006, 0.32, MAT.soft, -0.05, 0.809, 0.12, { cast: false });                                                   /* desk mat */
    var kbM = colorMat(0x2a2f36, 0.5, 0.2), keyM = colorMat(0x16181c, 0.6), keyL = colorMat(0x3a4048, 0.55);
    c.box(0.4, 0.016, 0.135, kbM, -0.15, 0.817, 0.12, { cast: false, r: 0.006 });
    for (var kr = 0; kr < 4; kr++) for (var kc = 0; kc < 13; kc++) c.box(0.025, 0.006, 0.024, (kr + kc) % 7 === 0 ? keyL : keyM, -0.327 + kc * 0.0295, 0.828, 0.072 + kr * 0.0285, { cast: false });
    c.box(0.15, 0.006, 0.022, keyM, -0.15, 0.828, 0.186, { cast: false }); c.box(0.05, 0.006, 0.022, keyL, -0.3, 0.828, 0.186, { cast: false }); c.box(0.05, 0.006, 0.022, keyL, 0.0, 0.828, 0.186, { cast: false });
    var mouse = c.box(0.058, 0.03, 0.105, MAT.gloss, 0.17, 0.824, 0.12, { r: 0.014 }); mouse.rotation.y = 0.12; c.box(0.006, 0.006, 0.02, colorMat(0x6fdc8c, 0.4, 0, { emissive: new THREE.Color(0x6fdc8c), emissiveIntensity: 0.8 }), 0.167, 0.838, 0.095, { cast: false });
    c.box(0.19, 0.44, 0.44, MAT.gloss, -0.35, 0.23, -0.05, { r: 0.012 }); c.box(0.004, 0.36, 0.36, MAT.glass, -0.253, 0.23, -0.05, { cast: false });   /* the tower, with a window in its side */
    c.box(0.004, 0.3, 0.012, emitMat(0x6fdc8c, 1.4), -0.256, 0.23, 0.1, { cast: false }); c.cyl(0.05, 0.05, 0.02, colorMat(0x22262b, 0.4, 0.6), -0.3, 0.3, -0.05, 18).rotation.z = Math.PI / 2;
    c.box(0.012, 0.012, 0.004, emitMat(0x6fdc8c, 1.2), -0.35, 0.42, 0.172, { cast: false }); c.light(new THREE.PointLight(0x6fdc8c, 0.12, 1.0), -0.2, 0.25, 0.1);
    c.hit(0.66, 0.46, 0.3, -0.15, 1.08, -0.12, { kind: 'laptop', label: 'PC', prompt: 'Use the PC' });
    c.cyl(0.075, 0.08, 0.018, MAT.gunmetal, -0.65, 0.814, -0.22, 24); var la1 = c.box(0.016, 0.36, 0.016, MAT.alu, -0.65, 0.99, -0.26, { sharp: true }); la1.rotation.x = -0.22; var la2 = c.box(0.016, 0.34, 0.016, MAT.alu, -0.65, 1.2, -0.17, { sharp: true }); la2.rotation.x = 1.05;
    c.cyl(0.013, 0.013, 0.03, MAT.soft, -0.65, 1.16, -0.3, 10).rotation.z = Math.PI / 2; var lh = c.box(0.05, 0.014, 0.26, MAT.gunmetal, -0.65, 1.27, 0.02, { r: 0.005 }); lh.rotation.x = 0.12; c.lit(0xfff0cc, 0.036, 0.22, -0.65, 1.2615, 0.02, 0, Math.PI / 2 + 0.12);
    c.light(new THREE.PointLight(0xffe0a8, 0.35, 2.5), -0.6, 1.15, -0.1);
    c.cyl(0.04, 0.035, 0.09, colorMat(0xf5f5f0, 0.5), 0.2, 0.85, -0.2, 14); var hdl = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.007, 6, 12, Math.PI), colorMat(0xf5f5f0, 0.5)); hdl.position.set(0.24, 0.85, -0.2); hdl.rotation.y = Math.PI / 2; c.add(hdl);
    c.box(0.16, 0.01, 0.22, MAT.white, 0.5, 0.81, 0.15, { cast: false }); c.box(0.14, 0.002, 0.2, new THREE.MeshBasicMaterial({ map: signTex(['to do', 'water · feed', 'order soil', 'call supplier'], 140, 200, { size: 24, bg: '#fffbe6', color: '#333', titleColor: '#1a6a2a', line: 'rgba(0,0,0,0)' }) }), 0.5, 0.816, 0.15, { cast: false }); var pen = c.cyl(0.005, 0.005, 0.14, colorMat(0x2a4a8a, 0.4), 0.62, 0.815, 0.15, 6); pen.rotation.set(Math.PI / 2, 0, 0.3);
    c.box(0.24, 0.12, 0.16, MAT.plastic, -0.55, 0.86, 0.22); c.box(0.2, 0.01, 0.12, MAT.white, -0.55, 0.925, 0.22, { cast: false }); c.box(0.02, 0.01, 0.06, emitMat(0x6fdc8c, 1), -0.45, 0.925, 0.28, { cast: false });   // small printer
    c.box(0.1, 0.06, 0.04, MAT.black, -0.1, 0.5, -0.33, { cast: false }); c.cyl(0.008, 0.008, 0.5, MAT.black, -0.1, 0.25, -0.35, 5);   // cable tidy + power lead
    c.box(1.62, 0.05, 0.05, MAT.darkwood, 0, 0.755, -0.37, { cast: false });
    officeChairBuild({ box: function (w, h, d, mat, x, y, z, o) { return c.box(w, h, d, mat, x, y + 0, z + 0.75, o); }, cyl: function (rt, rb, h, mat, x, y, z, s) { return c.cyl(rt, rb, h, mat, x, y, z + 0.75, s); }, solid: function (a, b, d, e) { c.solid(a, b, d + 0.75, e + 0.75); } });
    // a name plate where the sign on a stick used to stand: a wedge of dark wood with a brass plate
    var npl = c.box(0.24, 0.06, 0.05, MAT.darkwood, 0.55, 0.835, -0.24, { r: 0.01 }); npl.rotation.x = -0.35;
    var npf = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.04), new THREE.MeshStandardMaterial({ map: signTex(['GROW CO. · OFFICE'], 420, 80, { size: 40, bold: true, bg: '#c9a24a', color: '#2a2210', titleColor: '#2a2210', line: 'rgba(60,45,10,.6)' }), roughness: 0.35, metalness: 0.7 })); npf.position.set(0.55, 0.838, -0.213); npf.rotation.x = -0.35; c.add(npf);
  } });
  growDefProp('tabletDock', { label: 'tablet dock', x: -10.4, z: 3.55, rot: 2, build: function (c) {
    // a charging plinth against the office wall: the tablet stands in the cradle, screen out, until you take it
    var body = colorMat(0x2b2f35, 0.55, 0.3);
    c.box(0.52, 0.05, 0.36, MAT.darkwood, 0, 0.93, 0, { cast: false }); c.box(0.54, 0.02, 0.38, MAT.darkwood, 0, 0.955, 0, { cast: false });
    c.box(0.44, 0.9, 0.3, body, 0, 0.47, 0.02, { cast: true }); c.box(0.56, 0.04, 0.4, MAT.metal, 0, 0.03, 0.02, { cast: false });
    c.box(0.46, 0.5, 0.02, colorMat(0x1b1f24, 0.7), 0, 0.5, -0.16, { cast: false });   /* recessed back so the plinth is not one flat slab */
    c.box(0.36, 0.035, 0.11, MAT.metal, 0, 0.965, -0.05, { cast: false });   /* the cradle lip the tablet leans in */
    var lit = hasLic('tobacco'), inDock = xs().tablet === 'dock';
    var tg = new THREE.Group(); tg.position.set(0, 0.975, -0.05); tg.rotation.x = -0.3; tg.userData.tabletBody = true; tg.userData.builtLit = lit; c.add(tg);
    var shell = new THREE.Mesh(bevelGeo(0.38, 0.28, 0.016), colorMat(0x1b1f24, 0.4, 0.5)); shell.position.y = 0.13; shell.castShadow = true; tg.add(shell);
    var scr = new THREE.Mesh(new THREE.PlaneGeometry(0.345, 0.245), lit ? new THREE.MeshBasicMaterial({ map: signTex(['RF SMOKING', 'delivery round'], 300, 210, { size: 34, bg: '#0d1511', color: '#8fa596', titleColor: '#ffc857' }) }) : MAT.screen);
    scr.position.set(0, 0.13, 0.01); tg.add(scr);
    c.cyl(0.016, 0.016, 0.02, emitMat(lit ? 0x6fdc8c : 0xd0201a, 1.4), 0.21, 0.962, 0.1, 10);   /* charge light: green once the licence is in */
    c.sign(['DELIVERY ROUND'], 0.40, 0.072, 0, 0.74, 0.178, 0, { size: 13, titleColor: '#ffc857', bg: '#141a16' });   /* the plinth front face is at z 0.17, and the plate is only 128 px wide: one short line at 13 px is what fits */
    c.solid(-0.27, 0.27, -0.2, 0.2);
    c.hit(0.56, 0.9, 0.44, 0, 0.72, 0.02, { kind: 'tabletDock' });
  } });
  growDefProp('rack', { label: 'supply rack', x: -ROOM.x + 0.45, z: -1.0, rot: 1, build: function (c) {
    // boltless steel shelving: decks with a rolled lip, punched uprights, a cross brace at the back, levelling feet
    var shelfM = MAT.steel, postM = MAT.gunmetal; for (var s = 0; s < 4; s++) { var sy = 0.25 + s * 0.55; c.box(0.9, 0.03, 0.5, shelfM, 0, sy, 0); c.box(0.9, 0.05, 0.016, postM, 0, sy - 0.006, 0.25, { cast: false }); c.box(0.9, 0.05, 0.016, postM, 0, sy - 0.006, -0.25, { cast: false }); [-0.445, 0.445].forEach(function (x) { c.box(0.016, 0.05, 0.5, postM, x, sy - 0.006, 0, { cast: false }); }); c.sign([['SOIL', 'FEED · SPRAY', 'PAPERS · BAGS', 'POTS · JARS'][s]], 0.16, 0.03, -0.32, sy - 0.006, 0.2595, 0, { size: 13, bg: '#f3e9cf', color: '#222', titleColor: '#222', line: 'rgba(0,0,0,.3)' }); }
    [[-0.44, -0.24], [0.44, -0.24], [-0.44, 0.24], [0.44, 0.24]].forEach(function (p) { c.box(0.04, 2.0, 0.04, postM, p[0], 1.0, p[1]); for (var h = 0; h < 12; h++) c.box(0.012, 0.03, 0.042, MAT.black, p[0], 0.1 + h * 0.16, p[1], { cast: false, sharp: true }); c.cyl(0.03, 0.036, 0.024, MAT.soft, p[0], 0.012, p[1], 12); });
    [1, -1].forEach(function (sd) { var br = c.box(0.014, 1.36, 0.006, postM, 0, 1.05, -0.262, { cast: false, sharp: true }); br.rotation.z = sd * 0.68; }); c.cyl(0.012, 0.012, 0.012, MAT.chrome, 0, 1.05, -0.268, 10).rotation.x = Math.PI / 2;
    c.box(0.9, 0.03, 0.03, postM, 0, 2.0, -0.24); c.box(0.9, 0.03, 0.03, postM, 0, 2.0, 0.24);
    c.solid(-0.5, 0.5, -0.3, 0.3); c.hit(0.9, 2.0, 0.5, 0, 1.0, 0, { kind: 'inventory', label: 'Supply rack', prompt: 'Check stock' });
    c.sign(['SUPPLIES', 'soil · nutrients · spray · seeds'], 0.9, 0.3, 0, 2.2, 0.02, 0, { titleColor: '#6fdc8c' }); c.dynGroup();
  }, after: function () { syncRack(); } });
  growDefProp('cabinet', { label: 'filing cabinet', x: -4.6, z: 3.3, rot: 3, build: function (c) {
    // three drawers, each with a pull, a card in a holder and its own shadow gap; a lock at the top corner
    var cabM = colorMat(0x70777f, 0.4, 0.55), frontM = colorMat(0x7d848c, 0.36, 0.55); c.box(0.5, 1.16, 0.6, cabM, 0, 0.62, 0, { solid: true }); c.box(0.46, 0.04, 0.56, MAT.soft, 0, 0.02, 0, { cast: false });
    [0.24, 0.62, 1.0].forEach(function (y) { c.box(0.46, 0.35, 0.006, MAT.black, 0, y, 0.302, { cast: false, sharp: true }); c.box(0.445, 0.335, 0.024, frontM, 0, y, 0.312, { r: 0.006 }); c.box(0.2, 0.022, 0.014, MAT.black, 0, y + 0.1, 0.325, { cast: false, sharp: true }); c.box(0.2, 0.008, 0.022, MAT.chrome, 0, y + 0.113, 0.33, { cast: false, sharp: true }); c.box(0.11, 0.055, 0.004, MAT.chrome, 0, y - 0.04, 0.326, { cast: false, sharp: true }); c.box(0.098, 0.043, 0.004, MAT.white, 0, y - 0.04, 0.3275, { cast: false, sharp: true }); });
    c.cyl(0.012, 0.012, 0.008, MAT.chrome, 0.18, 1.14, 0.327, 12).rotation.x = Math.PI / 2;
    c.box(0.36, 0.006, 0.26, MAT.white, 0, 1.204, 0.05, { cast: false }); c.box(0.3, 0.02, 0.2, colorMat(0xf5f5f0), 0, 1.21, 0.05, { cast: false });   // paper tray
    c.fern(0, 0, 0.4, 1.21);
  } });
  function bookshelfBuild(c, w, h, rows) {
    // open carcass (sides, base, back) so the books on the shelves are actually visible; the old solid block hid them
    [-1, 1].forEach(function (sd) { c.box(0.06, h, 0.3, MAT.darkwood, sd * (w / 2 - 0.03), h / 2, 0); }); c.box(w, 0.08, 0.3, MAT.darkwood, 0, 0.04, 0); c.box(w, h, 0.05, MAT.darkwood, 0, h / 2, -0.125); c.box(w - 0.12, h - 0.12, 0.01, colorMat(0x2a1c10, 0.8), 0, h / 2, -0.097, { cast: false }); c.solid(-w / 2, w / 2, -0.15, 0.15);
    for (var r = 0; r < rows; r++) { var sy = 0.3 + r * ((h - 0.4) / rows); c.box(w - 0.06, 0.025, 0.28, MAT.wood, 0, sy, 0.01, { cast: false }); var bx = -w / 2 + 0.06; var lean = 0; while (bx < w / 2 - 0.12) { var bw = randf(0.035, 0.08), bh = randf(0.2, 0.32); var bk = c.box(bw, bh, randf(0.16, 0.22), colorMat(pick([0xc94a3a, 0x2f6b9a, 0x3aa36a, 0xe0c25a, 0x7a5aa8, 0xf2f2f2, 0x8a4a2a, 0x1c1c22]), 0.9), bx + bw / 2, sy + bh / 2 + 0.012, 0.03, { cast: false }); if (Math.random() < 0.15 && bx > -w / 2 + 0.2) { bk.rotation.z = 0.18; bk.position.x += 0.02; bx += 0.03; } bx += bw + 0.008; if (Math.random() < 0.12) bx += randf(0.05, 0.12); } if (r === rows - 1) { c.cyl(0.05, 0.04, 0.12, MAT.jar, w / 2 - 0.15, sy + 0.07, 0.05, 12); } }
    c.box(w, 0.06, 0.32, MAT.darkwood, 0, h - 0.03, 0.005);
  }
  growDefProp('bookshelf', { label: 'bookshelf', x: -4.3, z: -0.9, rot: 3, build: function (c) { bookshelfBuild(c, 1.0, 1.8, 4); } });
  growDefProp('fernOffice', { label: 'fern', x: -11.5, z: 3.4, build: function (c) { c.fern(0, 0, 1.0); } });
  growDefProp('fernHall', { label: 'fern', x: 3.6, z: 3.5, build: function (c) { c.fern(0, 0, 0.9); } });
  growDefProp('fernLobby', { label: 'fern', x: 10.8, z: 5.0, build: function (c) { c.fern(0, 0, 1.1); } });
  function sofaBuild(c, w, seatM, pipeM) {
    // upholstery is soft, so every cushion is a box with a generous radius: a plinth, seat pads, back pads that lean, rolled arms, turned feet
    var d = 0.85; c.box(w, 0.22, d, pipeM, 0, 0.2, 0, { solid: true, r: 0.03 }); c.box(w - 0.04, 0.04, d - 0.04, MAT.black, 0, 0.07, 0, { cast: false });
    var n = Math.max(1, Math.round(w / 0.62)); for (var i = 0; i < n; i++) { var cx = -w / 2 + 0.15 + (w - 0.3) * (i + 0.5) / n; var cw = (w - 0.3) / n - 0.012; c.box(cw, 0.17, d - 0.26, seatM, cx, 0.39, 0.09, { r: 0.05 }); c.box(cw, 0.44, 0.17, seatM, cx, 0.63, -0.3, { r: 0.06 }).rotation.x = -0.14; }
    c.box(w, 0.52, 0.13, pipeM, 0, 0.55, -0.39, { r: 0.04 }); [-1, 1].forEach(function (sd) { c.box(0.15, 0.36, d, seatM, sd * (w / 2 - 0.075), 0.5, 0, { r: 0.06 }); var roll = c.cyl(0.085, 0.085, d - 0.02, seatM, sd * (w / 2 - 0.075), 0.69, 0, 20); roll.rotation.x = Math.PI / 2; });
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (l) { c.cyl(0.028, 0.018, 0.09, MAT.darkwood, l[0] * (w / 2 - 0.1), 0.045, l[1] * (d / 2 - 0.1), 12); });
  }
  function coffeeTableBuild(c, x, z, w, d) { c.box(w, 0.035, d, MAT.wood, x, 0.42, z, { solid: true }); c.box(w - 0.1, 0.02, d - 0.1, MAT.darkwood, x, 0.2, z, { cast: false }); legs4({ box: function (a, b, e, m, px, py, pz) { return c.box(a, b, e, m, px + x, py, pz + z); } }, w, d, 0.4, MAT.chrome, 0.06, 0.03); }
  growDefProp('sofa', { label: 'sofa + coffee table', x: -2.4, z: -1.3, rot: 0, build: function (c) {
    var seatM = fabricMat(0x4a3b5c), pipeM = fabricMat(0x352a42);
    sofaBuild(c, 1.9, seatM, pipeM);
    [-0.5, 0.5].forEach(function (x) { var cu = c.box(0.4, 0.13, 0.4, fabricMat(x < 0 ? 0xe0c25a : 0x3aa36a), x, 0.62, -0.14, { r: 0.055 }); cu.rotation.set(1.05, x < 0 ? 0.2 : -0.15, 0); });
    coffeeTableBuild(c, 0, 1.15, 1.0, 0.6);
    c.box(0.3, 0.02, 0.22, new THREE.MeshBasicMaterial({ map: signTex(['GROW', 'monthly'], 150, 110, { size: 30, bg: '#6fdc8c', color: '#062010', titleColor: '#062010', line: 'rgba(0,0,0,0)' }) }), -0.15, 0.45, 1.15, { cast: false }); c.box(0.26, 0.015, 0.2, colorMat(0xffc857), -0.05, 0.462, 1.2, { cast: false }).rotation.y = 0.2;
    c.cyl(0.05, 0.04, 0.12, MAT.jar, 0.3, 0.5, 1.25); c.cyl(0.03, 0.03, 0.06, colorMat(0x8a2a2a, 0.5), 0.3, 0.47, 1.25, 10);
    var cst = c.cyl(0.14, 0.12, 0.12, colorMat(0x2a2d33, 0.5), 0.32, 0.5, 1.05, 16); c.box(0.16, 0.16, 0.16, colorMat(0x1a1c1e, 0.5), 0.32, 0.5, 1.05).visible = false;
    c.hit(2.0, 1.2, 1.0, 0, 0.6, 0, { kind: 'couch', seat: 'sofa' });
  }, after: function (c, P) { var v = growPropWorld('sofa', 0, 0.1); world.sofaSeat = { x: v.x, z: v.z, yaw: P.rot * Math.PI / 2 - Math.PI }; } });
  growDefProp('fridge', { label: 'drinks fridge', x: 3.3, z: -1.5, rot: 0, multi: { max: 3, price: 500, gap: 1.0, ico: '🧊' }, build: function (c) {
    // a shop's display fridge: a black cabinet, a lit header, light strips up both sides of a white interior, a louvred kick plate
    // and a hinged glass door in a black frame. The shelves hold what is actually in it.
    var shellM = MAT.gloss, inner = colorMat(0xf2f5f7, 0.6), frameM = colorMat(0x15181b, 0.35, 0.4);
    c.box(0.8, 1.9, 0.06, inner, 0, 0.95, -0.32, { cast: false });
    c.box(0.06, 1.9, 0.7, shellM, -0.37, 0.95, 0);
    c.box(0.06, 1.9, 0.7, shellM, 0.37, 0.95, 0);
    [-1, 1].forEach(function (sd) { c.box(0.004, 1.44, 0.6, inner, sd * 0.338, 0.97, 0, { cast: false, sharp: true }); c.lit(0xeaf6ff, 0.02, 1.4, sd * 0.334, 0.97, 0.26, -sd * Math.PI / 2); });
    c.box(0.8, 0.06, 0.7, shellM, 0, 1.87, 0, { cast: false });
    c.box(0.8, 0.22, 0.7, frameM, 0, 0.11, 0); for (var lv = 0; lv < 6; lv++) c.box(0.6, 0.012, 0.01, MAT.black, 0, 0.05 + lv * 0.026, 0.352, { cast: false, sharp: true });
    [[-0.34, -0.3], [0.34, -0.3], [-0.34, 0.3], [0.34, 0.3]].forEach(function (f) { c.cyl(0.03, 0.03, 0.02, MAT.soft, f[0], 0.005, f[1], 12); });
    c.solid(-0.42, 0.42, -0.36, 0.36);
    c.box(0.72, 0.17, 0.03, frameM, 0, 1.78, 0.345, { cast: false }); c.lit(0x0d2b3a, 0.66, 0.13, 0, 1.78, 0.3615);
    c.sign(['ICE COLD'], 0.46, 0.11, 0, 1.78, 0.366, 0, { size: 34, bold: true, bg: 'rgba(0,0,0,0)', titleColor: '#7fe0ff', line: 'rgba(0,0,0,0)' });
    c.lit(0xeaf6ff, 0.6, 0.02, 0, 1.675, 0.28, 0, Math.PI / 2);
    var door = new THREE.Group(); door.position.set(-0.35, 0.96, 0.33); c.add(door); door.userData.fridgeDoor = true;
    function fb(w, h2, d2, m, x, y, z, noCast) { var b = new THREE.Mesh(bevelGeo(w, h2, d2), m); b.position.set(x, y, z); b.castShadow = !noCast; door.add(b); return b; }
    fb(0.04, 1.5, 0.05, frameM, 0, 0, 0); fb(0.04, 1.5, 0.05, frameM, 0.7, 0, 0);
    fb(0.74, 0.04, 0.05, frameM, 0.35, 0.735, 0, true); fb(0.74, 0.04, 0.05, frameM, 0.35, -0.735, 0, true);
    var gl = new THREE.Mesh(new THREE.PlaneGeometry(0.67, 1.44), new THREE.MeshPhysicalMaterial({ color: 0xdff0ff, transparent: true, opacity: 0.16, roughness: 0.02, clearcoat: 1, side: THREE.DoubleSide }));
    gl.position.set(0.35, 0, 0.004); gl.castShadow = false; door.add(gl);
    var hdl = new THREE.Mesh(roundCylGeo(0.012, 0.012, 0.5, 12), MAT.alu); hdl.position.set(0.665, 0, 0.06); door.add(hdl); [-0.2, 0.2].forEach(function (y) { var hp = new THREE.Mesh(bevelGeo(0.02, 0.02, 0.04), MAT.alu); hp.position.set(0.665, y, 0.04); door.add(hp); });
    var shelves = new THREE.Group(); c.add(shelves); shelves.userData.fridgeShelves = true; shelves.userData.slots = [];
    for (var r = 0; r < 4; r++) { var sh = new THREE.Mesh(bevelGeo(0.66, 0.014, 0.55), MAT.alu); sh.position.set(0, 0.38 + r * 0.36, 0); sh.castShadow = false; shelves.add(sh); var tag = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.028, 0.004), colorMat(0xf5f5f0, 0.6)); tag.position.set(0, 0.375 + r * 0.36, 0.278); shelves.add(tag); }
    c.light(new THREE.PointLight(0xbfe8ff, 0.55, 2.6), 0, 1.45, 0.15);
    c.hit(0.82, 1.9, 0.72, 0, 0.95, 0, { kind: 'fridge' });
  }, after: function (c, P, inst, id) { syncFridge(id); } });
  growDefProp('coffeeBar', { label: 'coffee bar', x: 1.2, z: -1.7, rot: 0, build: function (c) {
    c.box(1.2, 0.9, 0.5, MAT.darkwood, 0, 0.45, 0, { solid: true }); c.box(1.26, 0.04, 0.56, MAT.counterTop, 0, 0.92, 0, { cast: false }); c.box(1.2, 0.06, 0.02, MAT.chrome, 0, 0.03, 0.25, { cast: false });
    drawer(c, 0.5, 0.2, 0.02, -0.3, 0.7, 0.24); drawer(c, 0.5, 0.2, 0.02, 0.3, 0.7, 0.24);
    // the espresso machine: a polished body on four feet, a group head with its portafilter, a steam wand, a gauge, and cups warming on top
    var body = MAT.steel, dark = MAT.gloss;
    c.box(0.36, 0.3, 0.3, body, -0.28, 1.13, -0.04, { r: 0.02 }); c.box(0.36, 0.05, 0.34, dark, -0.28, 1.3, -0.03, { r: 0.012 }); c.box(0.36, 0.04, 0.32, dark, -0.28, 0.975, -0.03); [[-0.43, -0.16], [-0.13, -0.16], [-0.43, 0.1], [-0.13, 0.1]].forEach(function (f) { c.cyl(0.018, 0.022, 0.03, MAT.chrome, f[0], 0.952, f[1], 10); });
    c.box(0.3, 0.012, 0.13, MAT.chrome, -0.28, 0.958, 0.14, { cast: false }); for (var gs = 0; gs < 7; gs++) c.box(0.28, 0.006, 0.006, MAT.black, -0.28, 0.966, 0.085 + gs * 0.018, { cast: false, sharp: true });   /* drip tray */
    c.cyl(0.034, 0.038, 0.04, MAT.chrome, -0.34, 1.1, 0.13, 16); c.cyl(0.036, 0.03, 0.022, MAT.chrome, -0.34, 1.07, 0.13, 16); var pf = c.box(0.022, 0.018, 0.14, MAT.black, -0.34, 1.07, 0.22, { r: 0.006 });   /* group head, portafilter and its handle */
    var wand = c.cyl(0.006, 0.006, 0.16, MAT.chrome, -0.15, 1.06, 0.14, 8); wand.rotation.z = -0.25; c.cyl(0.014, 0.014, 0.03, MAT.soft, -0.17, 1.14, 0.14, 10);
    c.cyl(0.03, 0.03, 0.012, MAT.chrome, -0.22, 1.2, 0.113, 18).rotation.x = Math.PI / 2; c.cyl(0.025, 0.025, 0.004, MAT.white, -0.22, 1.2, 0.121, 18).rotation.x = Math.PI / 2; c.box(0.003, 0.02, 0.002, colorMat(0xc0271b, 0.5), -0.215, 1.206, 0.124, { cast: false, sharp: true }).rotation.z = -0.6;
    c.lit(0xff5040, 0.012, 0.012, -0.4, 1.2, 0.112); c.lit(0x6fdc8c, 0.012, 0.012, -0.37, 1.2, 0.112);
    [[-0.38, 0], [-0.3, 0.02], [-0.22, -0.01], [-0.34, -0.1]].forEach(function (p, i) { c.cyl(0.034, 0.026, 0.06, MAT.ceramic, p[0], 1.355, p[1] - 0.04, 16); });
    // the grinder beside it, with beans in the hopper
    c.box(0.13, 0.26, 0.17, dark, -0.0, 1.07, -0.08, { r: 0.015 }); c.cyl(0.075, 0.045, 0.13, MAT.jar, 0.0, 1.27, -0.08, 18); c.cyl(0.062, 0.04, 0.08, colorMat(0x3a2210, 1), 0.0, 1.255, -0.08, 14); c.cyl(0.078, 0.078, 0.014, dark, 0.0, 1.342, -0.08, 18); c.box(0.06, 0.012, 0.08, MAT.chrome, 0.0, 1.0, 0.03, { cast: false });
    for (var cI = 0; cI < 4; cI++) { var mc = [0xf5f5f0, 0x6fdc8c, 0xffc857, 0x9ad0ff][cI]; c.cyl(0.035, 0.03, 0.08, colorMat(mc, 0.3), 0.16 + cI * 0.095, 0.98, 0.1, 16); var hd = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.006, 8, 12, Math.PI), colorMat(mc, 0.3)); hd.position.set(0.195 + cI * 0.095, 0.98, 0.1); hd.rotation.z = -Math.PI / 2; c.add(hd); }
    c.cyl(0.06, 0.05, 0.16, MAT.jar, 0.47, 1.02, -0.12, 18); c.cyl(0.05, 0.045, 0.1, colorMat(0x4a2a12, 1), 0.47, 0.995, -0.12, 14); c.cyl(0.062, 0.062, 0.015, MAT.jarLid, 0.47, 1.108, -0.12, 18);
    c.box(0.1, 0.12, 0.07, MAT.ceramic, 0.3, 1.0, -0.15, { r: 0.012 }); c.sign(['sugar'], 0.08, 0.04, 0.3, 1.0, -0.114, 0, { size: 20, bg: 'rgba(0,0,0,0)', color: '#333', titleColor: '#333', line: 'rgba(0,0,0,0)' });
    c.placard(['COFFEE', 'help yourself'], 0.42, 0.16, 0.36, 1.22, 0.2, { titleColor: '#ffc857' });
  } });
  growDefProp('waterCooler', { label: 'water cooler', x: -3.6, z: 3.5, rot: 3, build: function (c) {
    // a white tower with a dark alcove the cups stand in, two taps over a gridded drip tray, the bottle upside down on top, a cup tube on the side
    var white = colorMat(0xeef0f2, 0.35, 0.05), grey = colorMat(0xc9cdd2, 0.4, 0.1);
    c.box(0.34, 0.92, 0.34, white, 0, 0.47, 0, { r: 0.03 }); c.box(0.36, 0.03, 0.36, MAT.soft, 0, 0.015, 0, { cast: false }); c.box(0.3, 0.26, 0.02, colorMat(0x1a1d21, 0.5), 0, 0.68, 0.168, { cast: false }); c.box(0.26, 0.012, 0.11, grey, 0, 0.555, 0.2, { cast: false }); for (var gs = 0; gs < 6; gs++) c.box(0.24, 0.005, 0.006, MAT.black, 0, 0.563, 0.158 + gs * 0.017, { cast: false, sharp: true });
    [[-0.06, 0x3a7fd6], [0.06, 0xd63a2a]].forEach(function (t) { c.box(0.028, 0.05, 0.05, grey, t[0], 0.77, 0.2, { r: 0.006 }); c.box(0.034, 0.018, 0.04, colorMat(t[1], 0.4), t[0], 0.805, 0.205, { r: 0.005 }); c.cyl(0.008, 0.008, 0.03, MAT.chrome, t[0], 0.735, 0.21, 8); });
    c.lit(0x6fdc8c, 0.01, 0.01, 0.12, 0.86, 0.1715); c.lit(0xff5040, 0.01, 0.01, 0.1, 0.86, 0.1715);
    c.cyl(0.11, 0.13, 0.05, grey, 0, 0.95, 0, 24);
    var bottle = new THREE.Mesh(roundCylGeo(0.14, 0.14, 0.4, 28), MAT.jar); bottle.position.set(0, 1.19, 0); c.add(bottle); c.cyl(0.14, 0.06, 0.07, MAT.jar, 0, 0.965, 0, 24); [1.08, 1.22].forEach(function (y) { var rib = new THREE.Mesh(new THREE.TorusGeometry(0.141, 0.006, 6, 28), MAT.jar); rib.rotation.x = Math.PI / 2; rib.position.y = y; c.add(rib); });
    var water = new THREE.Mesh(new THREE.CylinderGeometry(0.128, 0.128, 0.3, 24), new THREE.MeshPhysicalMaterial({ color: 0x8fd0ff, transparent: true, opacity: 0.55, roughness: 0.1 })); water.position.set(0, 1.15, 0); c.add(water);
    var tube = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.34, 14, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xdff0ff, transparent: true, opacity: 0.3, roughness: 0.05, side: THREE.DoubleSide })); tube.position.set(-0.205, 0.72, 0.08); c.add(tube); for (var k = 0; k < 6; k++) c.cyl(0.03, 0.025, 0.05, colorMat(0xffffff, 0.6), -0.205, 0.59 + k * 0.045, 0.08, 12); c.box(0.02, 0.3, 0.05, grey, -0.18, 0.72, 0.08, { cast: false });
    c.hit(0.5, 1.5, 0.5, 0, 0.75, 0, { kind: 'cooler' }); c.solid(-0.2, 0.2, -0.2, 0.2); } });
  growDefProp('bench', { label: 'workbench', x: ROOM.x - 0.6, z: 1.0, rot: 3, build: function (c) {
    // bench runs along local x, the working side faces +z (into the room after rot 3); tools on the back rail
    c.box(2.4, 0.06, 0.8, MAT.wood, 0, 0.9, 0, { solid: true }); c.box(2.4, 0.85, 0.7, MAT.darkwood, 0, 0.45, 0, { cast: false }); c.box(2.4, 0.03, 0.03, MAT.chrome, 0, 0.93, 0.4, { cast: false });
    drawer(c, 0.5, 0.2, 0.02, -0.9, 0.7, 0.34); drawer(c, 0.5, 0.2, 0.02, -0.3, 0.7, 0.34); c.box(0.9, 0.5, 0.02, MAT.wood, 0.6, 0.45, 0.34, { cast: false }); c.box(0.12, 0.018, 0.02, MAT.chrome, 0.6, 0.55, 0.36, { cast: false });
    c.hit(2.4, 0.02, 0.8, 0, 0.93, 0, { kind: 'bench', label: 'Workbench', prompt: 'Grind, bag & roll' });
    var mat = c.box(0.7, 0.01, 0.45, MAT.black, 0, 0.935, 0.05, { cast: false }); interactable(mat, { kind: 'bench', label: 'Workbench', prompt: 'Grind, bag & roll' }); c.box(0.68, 0.002, 0.43, colorMat(0x2a2d33, 0.9), 0, 0.941, 0.05, { cast: false });
    // stool, back rail with tools, a lamp, a scale, a tray of tips
    c.cyl(0.18, 0.18, 0.06, fabricMat(0x24272c), -1.0, 0.57, 0.65, 24); c.cyl(0.16, 0.16, 0.02, MAT.black, -1.0, 0.535, 0.65, 24); c.cyl(0.024, 0.024, 0.52, MAT.chrome, -1.0, 0.27, 0.65, 12); var fr = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.01, 8, 28), MAT.chrome); fr.rotation.x = Math.PI / 2; fr.position.set(-1.0, 0.24, 0.65); c.add(fr); [0, 1.57].forEach(function (a) { c.box(0.3, 0.012, 0.012, MAT.chrome, -1.0, 0.24, 0.65, { sharp: true, cast: false }).rotation.y = a; }); c.cyl(0.19, 0.21, 0.025, MAT.chrome, -1.0, 0.0125, 0.65, 28); c.solid(-1.2, -0.8, 0.45, 0.85);
    c.box(2.44, 0.54, 0.02, MAT.darkwood, 0, 1.35, -0.392, { cast: false }); c.box(0.16, 0.1, 0.12, MAT.gunmetal, 1.12, 0.98, 0.3, { r: 0.012 }); c.box(0.05, 0.11, 0.13, MAT.gunmetal, 1.12, 0.985, 0.42); c.cyl(0.008, 0.008, 0.22, MAT.chrome, 1.12, 0.96, 0.44, 8).rotation.x = Math.PI / 2; c.cyl(0.006, 0.006, 0.12, MAT.chrome, 1.12, 0.96, 0.545, 8).rotation.z = Math.PI / 2;   /* the pegboard's frame, and a vise on the corner */
    c.box(2.4, 0.5, 0.03, colorMat(0x8a6a4a, 0.9), 0, 1.35, -0.38); for (var px = -1.1; px <= 1.1; px += 0.08) for (var py = 1.15; py <= 1.55; py += 0.08) { var hole = c.cyl(0.005, 0.005, 0.04, MAT.black, px, py, -0.38, 5); hole.rotation.x = Math.PI / 2; }
    var sc = c.cyl(0.006, 0.006, 0.2, MAT.chrome, -0.9, 1.35, -0.35, 6); sc.rotation.z = 0.4; var sc2 = c.cyl(0.006, 0.006, 0.2, MAT.chrome, -0.9, 1.35, -0.35, 6); sc2.rotation.z = -0.4; c.cyl(0.02, 0.02, 0.01, colorMat(0xc94a3a, 0.5), -0.9, 1.25, -0.35, 8);   // scissors
    c.box(0.03, 0.22, 0.01, MAT.chrome, -0.6, 1.35, -0.35); c.box(0.04, 0.06, 0.012, MAT.black, -0.6, 1.25, -0.35);   // knife
    [0.3, 0.45, 0.6].forEach(function (x, i) { c.cyl(0.022, 0.022, 0.16, colorMat([0xd9ff5a, 0xffffff, 0x3ad0ff][i], 0.5), x, 1.24, -0.34, 10); });   // bottles on the rail
    c.box(0.3, 0.03, 0.3, MAT.metal, -0.75, 0.945, -0.1); c.box(0.12, 0.03, 0.08, MAT.black, -0.75, 0.96, 0.06); c.box(0.08, 0.002, 0.03, MAT.screen, -0.75, 0.976, 0.06, { cast: false });   // scale
    c.cyl(0.07, 0.075, 0.02, MAT.gunmetal, 1.05, 0.94, -0.3, 20); var ba1 = c.box(0.018, 0.5, 0.018, MAT.alu, 1.0, 1.18, -0.3, { sharp: true }); ba1.rotation.z = 0.2; var ba2 = c.box(0.018, 0.42, 0.018, MAT.alu, 0.83, 1.5, -0.24, { sharp: true }); ba2.rotation.z = 1.0; ba2.rotation.y = -0.3; c.cyl(0.014, 0.014, 0.034, MAT.soft, 0.95, 1.42, -0.3, 10).rotation.x = Math.PI / 2;
    var bsh = c.box(0.3, 0.02, 0.07, MAT.gunmetal, 0.62, 1.44, -0.16, { r: 0.006 }); bsh.rotation.z = 0.12; c.lit(0xfff0cc, 0.27, 0.05, 0.62, 1.4285, -0.16, 0, Math.PI / 2).rotation.z = 0; c.light(new THREE.PointLight(0xfff0d0, 0.4, 2.6), 0.62, 1.3, -0.05);
    c.box(0.2, 0.03, 0.14, MAT.plastic, 0.9, 0.945, 0.15); for (var t = 0; t < 8; t++) c.cyl(0.006, 0.006, 0.03, colorMat(0xd8c8a0, 0.8), 0.83 + (t % 4) * 0.045, 0.975, 0.12 + Math.floor(t / 4) * 0.06, 5);   // tip tray
    c.placard(['PROCESSING', 'grind · bag · roll'], 0.6, 0.2, -0.95, 1.1, 0.2, { titleColor: '#ffc857' }); c.dynGroup();
  }, after: function () { syncShelf(); } });
  growDefProp('trash', { label: 'bin', x: ROOM.x - 0.6, z: -1.4, build: function (c) {
    // a brushed steel pedal bin: a black foot ring, a band round the rim, a domed lid on a hinge at the back, a pedal at the front
    c.cyl(0.17, 0.155, 0.5, MAT.steel, 0, 0.26, 0, 28); c.cyl(0.162, 0.168, 0.03, MAT.soft, 0, 0.015, 0, 28); c.cyl(0.176, 0.176, 0.025, MAT.chrome, 0, 0.5, 0, 28); c.box(0.09, 0.012, 0.07, MAT.soft, 0, 0.02, 0.2, { cast: false }); c.box(0.02, 0.012, 0.08, MAT.chrome, 0, 0.03, 0.15, { cast: false, sharp: true });
    var lidG = new THREE.Group(); lidG.position.set(0, 0.515, -0.17); c.add(lidG);   /* hinged at the back edge so E can lift it */ var lidTop = new THREE.Mesh(new THREE.SphereGeometry(0.182, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2), MAT.steel); lidTop.scale.y = 0.28; lidTop.position.z = 0.17; lidTop.castShadow = true; lidG.add(lidTop); var knob = new THREE.Mesh(roundCylGeo(0.18, 0.18, 0.012, 28), MAT.chrome); knob.position.set(0, -0.004, 0.17); lidG.add(knob); var hinge = new THREE.Mesh(roundCylGeo(0.012, 0.012, 0.1, 10), MAT.soft); hinge.rotation.z = Math.PI / 2; lidG.add(hinge);
    var hm = c.hit(0.5, 0.75, 0.5, 0, 0.36, 0, { kind: 'trash' }); (world.trashLids = world.trashLids || {})[hm.userData.propId] = lidG; c.solid(-0.2, 0.2, -0.2, 0.2); } });
  function crateBuild(c, x, y, z, s) {   // a slatted pine crate: corner posts, three boards a side with gaps you can see through, a lid of planks, rope handles
    s = s || 0.55; var hgt = s * 0.9, pine = MAT.wood, inner = colorMat(0x2a1c10, 0.9);
    c.box(s - 0.05, hgt - 0.04, s - 0.05, inner, x, y + hgt / 2, z, { cast: false });
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (p) { c.box(0.045, hgt, 0.045, pine, x + p[0] * (s / 2 - 0.0225), y + hgt / 2, z + p[1] * (s / 2 - 0.0225)); });
    for (var b = 0; b < 3; b++) { var by = y + hgt * (0.17 + b * 0.33); [-1, 1].forEach(function (d) { c.box(s, hgt * 0.27, 0.018, pine, x, by, z + d * (s / 2 - 0.004)); c.box(0.018, hgt * 0.27, s, pine, x + d * (s / 2 - 0.004), by, z); }); }
    for (var l = 0; l < 4; l++) c.box(s / 4 - 0.008, 0.018, s, pine, x - s / 2 + s / 8 + l * s / 4, y + hgt + 0.004, z, { cast: false });
    [-1, 1].forEach(function (d) { var h = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.008, 6, 14, Math.PI), MAT.rope); h.position.set(x + d * (s / 2 + 0.004), y + hgt * 0.62, z); h.rotation.set(0, Math.PI / 2, Math.PI); c.add(h); });
  }
  growDefProp('crates', { label: 'crates', x: 5.3, z: -1.4, build: function (c) { crateBuild(c, -0.3, 0, 0); crateBuild(c, -0.3, 0.5, 0, 0.5); crateBuild(c, 0.3, 0, 0.05); c.solid(-0.6, 0.6, -0.3, 0.35); c.sign(['FRAGILE'], 0.3, 0.1, 0.3, 0.35, 0.33, 0, { size: 30, bg: '#f0e0c0', color: '#c9302c', titleColor: '#c9302c', line: 'rgba(0,0,0,0)' }); } });
  growDefProp('cureShelf', { label: 'curing shelf', x: 6.5, z: -ROOM.z + 0.35, rot: 0, build: function (c) {
    for (var i = 0; i < 4; i++) { c.box(3.0, 0.04, 0.4, MAT.wood, 0, 0.5 + i * 0.55, 0); c.box(3.0, 0.04, 0.02, MAT.darkwood, 0, 0.5 + i * 0.55, 0.2, { cast: false }); }
    c.box(0.06, 2.3, 0.4, MAT.darkwood, -1.5, 1.15, 0); c.box(0.06, 2.3, 0.4, MAT.darkwood, 1.5, 1.15, 0); c.box(0.06, 2.3, 0.4, MAT.darkwood, 0, 1.15, 0); c.box(3.0, 2.3, 0.02, colorMat(0x2a1c10, 0.8), 0, 1.15, -0.19, { cast: false }); c.solid(-1.5, 1.5, -0.2, 0.25);
    c.hit(3.0, 2.3, 0.5, 0, 1.15, 0, { kind: 'shelf', label: 'Curing shelf', prompt: 'Curing jars' });
    for (var s = 0; s < 4; s++) c.sign([['SHELF A', 'SHELF B', 'SHELF C', 'SHELF D'][s]], 0.3, 0.06, 1.3, 0.48 + s * 0.55, 0.212, 0, { size: 24, bg: '#f3e9cf', color: '#222', titleColor: '#222', line: 'rgba(0,0,0,.3)' });
    var hyg = c.box(0.14, 0.09, 0.02, MAT.white, -1.3, 2.0, 0.2); c.sign(['62% RH'], 0.1, 0.05, -1.3, 2.0, 0.212, 0, { size: 28, bg: '#101410', titleColor: '#6fdc8c', line: 'rgba(0,0,0,0)' });
    c.sign(['CURING SHELF', 'jars gain quality while they sit'], 1.4, 0.4, 0, 2.55, 0.05, 0, { titleColor: '#6fdc8c' }); c.dynGroup();
  }, after: function () { syncShelf(); } });
  growDefProp('dryRack', { label: 'drying line', x: 6.25, z: -5.2, rot: 0, build: function (c) {
    var hw = 3.25, ly = 2.1;
    [-hw, hw].forEach(function (px) { c.box(0.08, ly + 0.1, 0.08, MAT.wood, px, (ly + 0.1) / 2, 0); c.box(0.7, 0.06, 0.12, MAT.wood, px, 0.03, 0); c.box(0.12, 0.06, 0.7, MAT.wood, px, 0.03, 0); var b1 = c.box(0.06, 0.9, 0.06, MAT.wood, px, 0.55, 0.28); b1.rotation.x = 0.55; var b2 = c.box(0.06, 0.9, 0.06, MAT.wood, px, 0.55, -0.28); b2.rotation.x = -0.55; c.box(0.1, 0.1, 0.1, MAT.plastic, px, ly, 0); c.solid(px - 0.36, px + 0.36, -0.36, 0.36); });
    var bar = new THREE.Mesh(roundCylGeo(0.03, 0.03, hw * 2, 12), MAT.wood); bar.rotation.z = Math.PI / 2; bar.position.set(0, ly, 0); bar.castShadow = true; c.add(bar);
    var wire = new THREE.Mesh(roundCylGeo(0.008, 0.008, hw * 2, 6), MAT.metal); wire.rotation.z = Math.PI / 2; wire.position.set(0, ly - 0.12, 0); c.add(wire);
    for (var pg = 0; pg < 12; pg++) c.box(0.02, 0.06, 0.015, colorMat(0xd9c9a0, 0.9), -hw + 0.3 + pg * 0.55, ly - 0.14, 0, { cast: false });
    c.hit(hw * 2, 0.9, 0.3, 0, ly - 0.4, 0, { kind: 'line', label: 'Drying line', prompt: 'Hang harvests here' });
    // a clip fan on the post keeps the air moving
    var fanG = new THREE.Group(); fanG.position.set(-hw + 0.1, 1.4, 0.1); fanG.rotation.y = 0.8; c.add(fanG); var fb = new THREE.Mesh(roundCylGeo(0.1, 0.1, 0.06, 16), MAT.plastic); fb.rotation.x = Math.PI / 2; fanG.add(fb); var cage = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.008, 6, 24), MAT.chrome); cage.position.z = 0.05; fanG.add(cage); var blades = new THREE.Group(); blades.position.z = 0.04; fanG.add(blades); for (var b = 0; b < 3; b++) { var blm = new THREE.Mesh(bevelGeo(0.05, 0.14, 0.004), colorMat(0xe0e0e0, 0.5)); blm.position.y = 0.08; var hold = new THREE.Group(); hold.rotation.z = b * Math.PI * 2 / 3; hold.add(blm); blades.add(hold); } c.box(0.06, 0.1, 0.08, MAT.plastic, -hw + 0.06, 1.3, 0.02); world.clipFan = blades;
    c.sign(['DRYING LINE', 'hang fresh harvests here · ~45 s'], 1.4, 0.4, 0, ly + 0.35, 0, 0, { titleColor: '#6fdc8c' }); c.dynGroup();
  }, after: function () { syncShelf(); } });
  growDefProp('dryTable', { label: 'scale table', x: 1.2, z: -3.2, rot: 0, build: function (c) { c.box(0.9, 0.05, 0.6, MAT.wood, 0, 0.78, 0, { solid: true }); legs4(c, 0.9, 0.6, 0.76, MAT.metal); c.box(0.3, 0.03, 0.3, MAT.metal, 0, 0.82, 0); c.box(0.12, 0.025, 0.08, MAT.black, 0, 0.85, 0.15); c.box(0.08, 0.002, 0.03, MAT.screen, 0, 0.864, 0.15, { cast: false }); c.box(0.2, 0.01, 0.28, MAT.white, -0.3, 0.81, 0.05, { cast: false }); c.cyl(0.005, 0.005, 0.12, colorMat(0x2a4a8a, 0.4), -0.25, 0.815, 0.1, 6).rotation.set(Math.PI / 2, 0, 0.5); c.cyl(0.06, 0.06, 0.14, MAT.jar, 0.3, 0.88, -0.15, 12); c.cyl(0.062, 0.062, 0.015, MAT.jarLid, 0.3, 0.955, -0.15, 12); c.box(0.16, 0.1, 0.16, colorMat(0xe8e8ee, 0.6), 0.32, 0.86, 0.15); } });
  growDefProp('jarBoxes', { label: 'jar boxes', x: 10.6, z: -8.2, build: function (c) { var bxM = colorMat(0xc8a97a, 1); [[0.3, 0, 0], [0.3, 0, 0.42], [-0.3, 0, 0]].forEach(function (b) { c.box(0.5, 0.4, 0.5, bxM, b[0], 0.2 + b[2], b[1], { solid: b[2] === 0 }); c.box(0.52, 0.03, 0.52, colorMat(0xb08c5a, 1), b[0], 0.4 + b[2], b[1], { cast: false }); c.box(0.5, 0.06, 0.02, colorMat(0xb08c5a, 1), b[0], 0.2 + b[2], b[1] + 0.25, { cast: false }); c.sign(['JARS ×12'], 0.3, 0.08, b[0], 0.15 + b[2], b[1] + 0.26, 0, { size: 24, bg: '#f3e9cf', color: '#222', titleColor: '#222', line: 'rgba(0,0,0,.3)' }); }); } });
  growDefProp('hose', { label: 'hose reel + watering can', x: -ROOM.x + 0.55, z: -3.0, rot: 1, build: function (c) {
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
  growDefProp('fan', { label: 'floor fan', x: -2.0, z: -7.9, rot: 0, build: function (c) {
    var fbase = new THREE.Mesh(roundCylGeo(0.2, 0.22, 0.04, 20), MAT.black); fbase.position.y = 0.02; c.add(fbase); c.box(0.06, 0.03, 0.06, colorMat(0x8a8f96, 0.5), 0.1, 0.05, 0.1, { cast: false });
    var fpole = new THREE.Mesh(roundCylGeo(0.02, 0.02, 0.9, 10), MAT.chrome); fpole.position.y = 0.47; c.add(fpole); c.cyl(0.03, 0.03, 0.05, MAT.plastic, 0, 0.5, 0, 10);
    world.fanHead = new THREE.Group(); world.fanHead.position.y = 0.95; c.add(world.fanHead);
    var motor = new THREE.Mesh(roundCylGeo(0.06, 0.06, 0.16, 14), MAT.plastic); motor.rotation.x = Math.PI / 2; motor.position.z = -0.1; world.fanHead.add(motor);
    world.fanHead.add(new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.012, 6, 28), MAT.chrome)); var cageBack = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 28, 1, true), MAT.chrome); cageBack.rotation.x = Math.PI / 2; cageBack.position.z = -0.05; world.fanHead.add(cageBack);
    for (var w = 0; w < 12; w++) { var wire = new THREE.Mesh(bevelGeo(0.004, 0.44, 0.004), MAT.chrome); wire.rotation.z = w * Math.PI / 12; wire.position.z = 0.02; world.fanHead.add(wire); }
    var hubc = new THREE.Mesh(roundCylGeo(0.03, 0.03, 0.03, 12), MAT.plastic); hubc.rotation.x = Math.PI / 2; hubc.position.z = 0.02; world.fanHead.add(hubc);
    world.fanBlades = new THREE.Group(); world.fanHead.add(world.fanBlades);
    for (var b = 0; b < 3; b++) { var bl = new THREE.Mesh(bevelGeo(0.08, 0.19, 0.005), colorMat(0xdddddd, 0.5)); bl.position.y = 0.1; bl.rotation.y = 0.3; var holder = new THREE.Group(); holder.rotation.z = b * Math.PI * 2 / 3; holder.add(bl); world.fanBlades.add(holder); }
    c.solid(-0.22, 0.22, -0.22, 0.22);
  }, after: function (c, P) { world.fanBaseYaw = Math.atan2(TENT_ORIGIN.x - P.x, TENT_ORIGIN.z - P.z) - P.rot * Math.PI / 2; } });
  growDefProp('soilSacks', { label: 'soil sacks', x: -11.3, z: -5.2, build: function (c) { var sackM = new THREE.MeshStandardMaterial({ map: TEX.fabric, color: 0x5a3a22, roughness: 1 }); [[0, 0, 0, 0.1], [0, 0, 0.3, -0.2], [0.55, 0, 0, 0.3]].forEach(function (b) { var s = c.box(0.5, 0.28, 0.35, sackM, b[0], 0.14 + b[2], b[1], { solid: b[2] === 0, r: 0.09 }); s.rotation.y = b[3]; c.sign(['POTTING SOIL', '25 L'], 0.3, 0.12, b[0], 0.14 + b[2], b[1] + 0.176, b[3], { size: 26, bg: '#e8dcc0', color: '#3a2a1a', titleColor: '#1a6a2a', line: 'rgba(0,0,0,0)' }); }); } });
  growDefProp('bucket', { label: 'bucket', x: -11.2, z: -3.9, build: function (c) { c.cyl(0.16, 0.13, 0.3, colorMat(0x2f7a34, 0.6), 0, 0.15, 0); c.cyl(0.165, 0.165, 0.02, colorMat(0x255f2a, 0.6), 0, 0.3, 0); var hd = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.008, 6, 20, Math.PI), MAT.chrome); hd.position.y = 0.3; hd.rotation.z = 0; c.add(hd); c.cyl(0.14, 0.14, 0.01, new THREE.MeshPhysicalMaterial({ color: 0x6fb0e0, transparent: true, opacity: 0.6 }), 0, 0.25, 0, 20); c.solid(-0.2, 0.2, -0.2, 0.2); } });
  growDefProp('potShelf', { label: 'pot shelf', x: -9.5, z: -ROOM.z + 0.3, rot: 0, build: function (c) { [0.4, 1.0, 1.6].forEach(function (y) { c.box(1.2, 0.03, 0.3, MAT.wood, 0, y, 0); c.box(1.2, 0.03, 0.02, MAT.darkwood, 0, y, 0.15, { cast: false }); }); [-0.55, 0.55].forEach(function (x) { c.box(0.04, 1.7, 0.3, MAT.metal, x, 0.85, 0); }); for (var p = 0; p < 3; p++) { for (var st = 0; st < 3; st++) { c.cyl(0.12 - st * 0.01, 0.09, 0.14, MAT.pot, -0.4 + p * 0.4, 1.69 + st * 0.03, 0, 16); } c.cyl(0.12, 0.09, 0.16, MAT.pot, -0.4 + p * 0.4, 1.1, 0, 16); c.cyl(0.125, 0.125, 0.02, MAT.pot, -0.4 + p * 0.4, 1.18, 0, 16); } c.box(0.3, 0.2, 0.2, colorMat(0xe8e8ee, 0.6), -0.3, 0.52, 0); c.cyl(0.08, 0.08, 0.2, MAT.jar, 0.3, 0.52, 0, 12); c.sign(['POTS', 'spares'], 0.4, 0.12, 0, 1.85, 0.02, 0, { titleColor: '#6fdc8c' }); c.solid(-0.6, 0.6, -0.15, 0.15); } });
  growDefProp('tent', { label: 'grow tent', x: -6.6, z: -6.1, rot: 0, build: function (c, P) { TENT_ORIGIN.x = P.x; TENT_ORIGIN.z = P.z; buildTent(); if (world.tentGroup) world.tentGroup.traverse(function (o) { if (o.isMesh) o.userData.propId = 'tent'; }); }, after: function () { if (propInst.fan) { var f = propInst.fan; world.fanBaseYaw = Math.atan2(TENT_ORIGIN.x - f.P.x, TENT_ORIGIN.z - f.P.z) - f.P.rot * Math.PI / 2; } } });
  PROPS.tent.noBlob = true;   /* the tent builds into its own group and lays its own floor */
  function lobbyBench(c) { for (var s = -0.7; s <= 0.7; s += 0.14) c.box(0.12, 0.05, 0.45, MAT.wood, s, 0.55, 0); c.box(1.6, 0.05, 0.45, MAT.none, 0, 0.55, 0, { solid: true, cast: false }); for (var b = 0; b < 3; b++) c.box(1.6, 0.09, 0.03, MAT.wood, 0, 0.72 + b * 0.12, -0.2 - b * 0.02); [-0.65, 0.65].forEach(function (x) { c.box(0.05, 0.55, 0.45, colorMat(0x2a2d33, 0.4, 0.6), x, 0.275, 0); c.box(0.05, 0.5, 0.05, colorMat(0x2a2d33, 0.4, 0.6), x, 0.8, -0.2); }); }
  growDefProp('lobbyBenchL', { label: 'lobby bench', x: -8.5, z: 8.2, rot: 2, build: lobbyBench });
  growDefProp('lobbyBenchR', { label: 'lobby bench', x: 8.5, z: 8.2, rot: 2, build: lobbyBench });
  growDefProp('magTable', { label: 'magazine table', x: -6.6, z: 7.6, build: function (c) { c.cyl(0.32, 0.32, 0.03, MAT.wood, 0, 0.45, 0, 24); c.cyl(0.03, 0.03, 0.44, MAT.chrome, 0, 0.22, 0, 10); c.cyl(0.2, 0.22, 0.02, MAT.chrome, 0, 0.01, 0, 24); c.box(0.3, 0.01, 0.22, new THREE.MeshBasicMaterial({ map: signTex(['HIGH', 'times'], 150, 110, { size: 34, bg: '#6fdc8c', color: '#062010', titleColor: '#062010', line: 'rgba(0,0,0,0)' }) }), -0.05, 0.47, 0, { cast: false }); c.box(0.3, 0.01, 0.22, new THREE.MeshBasicMaterial({ map: signTex(['GROW', 'weekly'], 150, 110, { size: 34, bg: '#ffc857', color: '#332200', titleColor: '#332200', line: 'rgba(0,0,0,0)' }) }), 0.1, 0.48, -0.05, { cast: false }).rotation.y = 0.3; c.solid(-0.33, 0.33, -0.33, 0.33); } });
  var ROPE_COLORS = { red: 0xc94a3a, navy: 0x2a3a6a, black: 0x1a1a1c, gold: 0xc9a44a, green: 0x2e7d4f }, ROPE_POSTS = { chrome: [0xd8dde2, 0.25, 0.95], brass: [0xb8913a, 0.35, 0.85], black: [0x1a1a1c, 0.4, 0.6] }, ROPE_LENS = [1.2, 1.8, 2.4, 3.0];
  function ropeStyle(id) { if (!S.ropes) S.ropes = {}; var st = S.ropes[id] || {}; return { color: ROPE_COLORS[st.color] ? st.color : 'red', len: ROPE_LENS.indexOf(st.len) >= 0 ? st.len : 1.8, posts: ROPE_POSTS[st.posts] ? st.posts : 'chrome', kind: st.kind === 'belt' ? 'belt' : 'rope', open: !!st.open }; }
  function ropeBuild(c) {   // two posts and a velvet rope (or a retractable belt) clipped between them, along local x; unhooked, it hangs down the far post
    var id = c.group.userData.propId, st = ropeStyle(id), hx = st.len / 2, pf = ROPE_POSTS[st.posts], postM = colorMat(pf[0], pf[1], pf[2]), bandM = new THREE.MeshStandardMaterial({ map: TEX.fabric, color: ROPE_COLORS[st.color], roughness: 1 });
    [-hx, hx].forEach(function (x) { c.cyl(0.025, 0.025, 0.95, postM, x, 0.475, 0, 12); c.cyl(0.16, 0.18, 0.03, postM, x, 0.015, 0, 20); var ball = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), postM); ball.position.set(x, 0.98, 0); ball.castShadow = true; c.add(ball); c.solid(x - 0.15, x + 0.15, -0.15, 0.15); });
    var piv = new THREE.Group(); piv.position.set(-hx, 0.93, 0); c.add(piv);
    if (st.kind === 'belt') { var belt = new THREE.Mesh(bevelGeo(st.len - 0.05, 0.05, 0.006), bandM); belt.position.set(hx, -0.03, 0); belt.castShadow = true; piv.add(belt); }
    else { var rope = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(hx, -0.12 * st.len, 0), new THREE.Vector3(st.len, 0, 0)), 20, 0.022, 8, false), bandM); rope.castShadow = true; piv.add(rope); }
    var clip = new THREE.Mesh(bevelGeo(0.05, 0.035, 0.03), postM); clip.position.set(st.len - 0.03, st.kind === 'belt' ? -0.03 : 0, 0); piv.add(clip);
    var G = ropeGate(id); G.pivot = piv; G.len = st.len; ropePose(G);
    c.hit(st.len + 0.3, 1.05, 0.35, 0, 0.52, 0, { kind: 'rope' });
  }
  var ropeGates = {}, ropeSegList = [];   // per rope: how far unhooked it is (open 0..1, passable from 0.8) and who wants it
  function ropeGate(id) { return ropeGates[id] || (ropeGates[id] = { open: 0, clip: false, want: false, waitT: 0, idleT: 0, pivot: null, len: 1.8 }); }
  function ropeSegs() {   // every standing rope on the ground floor, as the line between its posts; x1 is the far post it hangs from, x2 the clip end
    return unitIds('queueRope').filter(function (u) { var P = growPropPlacement(u); return propInst[u] && !P.hidden && !P.floor; }).map(function (u) { var P = growPropPlacement(u), hx = ropeStyle(u).len / 2, a = P.rot * Math.PI / 2, cx = Math.cos(a) * hx, cz = -Math.sin(a) * hx; return { id: u, x1: P.x - cx, z1: P.z - cz, x2: P.x + cx, z2: P.z + cz }; });
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
    animatePerson(guard.h, dt, 'idle', 0, null); P.rArm.rotation.x = lerp(P.rArm.rotation.x, -1.15, 0.2);
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
    var st = ropeStyle(id), P = growPropPlacement(id), lines = [];
    function cyc(list, v) { return list[(list.indexOf(v) + 1) % list.length]; }
    function set(k, v) { return function () { st[k] = v; S.ropes[id] = st; growBuildProp(id); world.dirty = true; save(); ropeMenu(id); }; }
    lines.push({ label: st.open ? '🔓 <b>Unhooked</b>: people walk straight through <small>click to hook it, and the guard lets people through</small>' : '🔒 <b>Hooked</b>: the guard unhooks it for people <small>click to leave it unhooked; it stays unhooked while he is sent home</small>', act: set('open', !st.open) });
    lines.push({ label: '🎨 Colour: <b>' + st.color + '</b> <small>click for ' + cyc(Object.keys(ROPE_COLORS), st.color) + '</small>', act: set('color', cyc(Object.keys(ROPE_COLORS), st.color)) });
    lines.push({ label: '📏 Length: <b>' + st.len + ' m</b> <small>click for ' + cyc(ROPE_LENS, st.len) + ' m</small>', act: set('len', cyc(ROPE_LENS, st.len)) });
    lines.push({ label: '🪢 Style: <b>' + (st.kind === 'belt' ? 'retractable belt' : 'velvet rope') + '</b> <small>click for ' + (st.kind === 'belt' ? 'velvet rope' : 'retractable belt') + '</small>', act: set('kind', st.kind === 'belt' ? 'rope' : 'belt') });
    lines.push({ label: '✨ Posts: <b>' + st.posts + '</b> <small>click for ' + cyc(Object.keys(ROPE_POSTS), st.posts) + '</small>', act: set('posts', cyc(Object.keys(ROPE_POSTS), st.posts)) });
    lines.push({ label: '↻ Turn it a quarter <small>F2 and R do the same</small>', act: function () { if (!S.layout) S.layout = {}; S.layout[id] = Object.assign({}, S.layout[id] || {}, { x: P.x, z: P.z, rot: (P.rot + 1) % 4 }); growBuildProp(id); world.dirty = true; save(); ropeMenu(id); } });
    lines.push({ label: '✋ Move it <small>opens edit mode: look at it and press E to pick it up</small>', act: function () { if (!edit.on) growEditToggle(); } });
    lines.push({ label: '➕ Put up another beside it <small>' + (unitIds('queueRope').some(function (u) { return growPropPlacement(u).hidden; }) ? 'free: one you took down' : unitCount('queueRope') >= PROPS.queueRope.multi.max ? 'you have the most there is room for' : money(machCost('queueRope', unitCount('queueRope') + 1))) + '</small>', act: function () { ropeAdd(id); } });
    lines.push({ label: '🗑️ Take it down <small>it goes in the back; put it up again from another rope line or the office PC</small>', act: function () { if (!S.layout) S.layout = {}; S.layout[id] = Object.assign({}, S.layout[id] || {}, { x: P.x, z: P.z, rot: P.rot, hidden: true }); growBuildProp(id); world.dirty = true; save(); toast('🪢 Rope line taken down', ''); } });
    ctxOpen('🪢 Rope line', 'change how it looks, move it, add to it or take it down', lines);
  }
  function ropeAdd(id) {   // the next one lands a step in front of this one, same style and angle: line them up with F2
    var P = growPropPlacement(id), fr = [[0, 1], [1, 0], [0, -1], [-1, 0]][((P.rot % 4) + 4) % 4];
    var nid = unitIds('queueRope').filter(function (u) { return growPropPlacement(u).hidden; })[0];
    if (!nid) { var have = unitCount('queueRope'); buyUnit('queueRope'); if (unitCount('queueRope') === have) return; nid = 'queueRope#' + unitCount('queueRope'); }
    var sty = ropeStyle(id); if (!S.layout) S.layout = {}; S.layout[nid] = { x: P.x + fr[0] * 0.9, z: P.z + fr[1] * 0.9, rot: P.rot }; S.ropes[nid] = sty;
    growBuildProp(nid); world.dirty = true; save(); toast('🪢 Another rope line is up. F2 lines it up.', 'good');
  }
  function ropeUp() {   /* from the office PC: the last one taken down goes back where it stood */
    var nid = unitIds('queueRope').filter(function (u) { return growPropPlacement(u).hidden; }).pop(); if (!nid) return;
    S.layout[nid] = Object.assign({}, S.layout[nid], { hidden: false }); growBuildProp(nid); world.dirty = true; save(); toast('🪢 Rope line back up where it stood', 'good');
  }
  growDefProp('queueRope', { label: 'rope line', x: 0.35, z: 7.45, rot: 0, multi: { max: 8, price: 40, gap: 2.2, ico: '🪢', name: 'Rope line' }, build: ropeBuild });   // across the way in, between the ID check and the queue: the guard at his post unhooks it for whoever he lets through
  growDefProp('lobbyPlant', { label: 'lobby plant', x: -10.5, z: 5.0, build: function (c) {
    // a rubber plant in a tall charcoal planter: a woody stem, glossy leaves climbing it in a spiral
    c.cyl(0.26, 0.2, 0.5, colorMat(0x2a2d33, 0.35, 0.1), 0, 0.26, 0, 32); c.cyl(0.275, 0.262, 0.04, colorMat(0x1f2226, 0.35, 0.1), 0, 0.5, 0, 32); c.cyl(0.21, 0.21, 0.025, MAT.soft, 0, 0.0125, 0, 28); c.cyl(0.24, 0.24, 0.02, MAT.soil, 0, 0.51, 0, 24);
    c.cyl(0.014, 0.024, 1.1, MAT.bark, 0, 1.05, 0, 10); c.cyl(0.01, 0.014, 0.5, MAT.bark, 0.05, 1.5, 0.02, 8).rotation.z = -0.22; c.cyl(0.01, 0.014, 0.45, MAT.bark, -0.05, 1.35, -0.03, 8).rotation.z = 0.3;
    for (var i = 0; i < 18; i++) { var a = i * 2.399, y = 0.75 + i * 0.058; leafAt(BIGLEAF_GEO, MAT.bigleaf, Math.cos(a) * 0.03, y, Math.sin(a) * 0.03, Math.PI / 2 - a, 0.7 + (i % 4) * 0.12 - i * 0.02, 0.85 + (i % 3) * 0.12, c.group); }
    c.solid(-0.3, 0.3, -0.3, 0.3); } });
  growDefProp('lobbyCoffee', { label: 'lobby coffee machine', x: ROOM.x - 0.4, z: 8.1, rot: 3, multi: { max: 4, price: 600, gap: 0.95, ico: '☕', lic: 'catering', upg: 'lobby', name: 'Coffee machine' }, build: function (c) {
    if (!S.upgrades.lobby) return;   // stand + machine appear with the upgrade
    c.box(0.6, 0.9, 0.5, MAT.darkwood, 0, 0.45, 0, { solid: true }); c.box(0.66, 0.04, 0.56, MAT.counterTop, 0, 0.92, 0, { cast: false });
    // a bean-to-cup machine: the upper half overhangs a brew bay, the cup stands on a grille under two nozzles, a lit screen and
    // three buttons on the fascia. It stands against a back board that carries the sign, so nothing is propped up in front of it.
    var body = colorMat(0x16171b, 0.25, 0.4), chrome = MAT.chrome, fascia = MAT.steel;
    c.box(0.64, 1.0, 0.03, MAT.darkwood, 0, 1.44, -0.262, { cast: false }); c.box(0.68, 0.05, 0.08, MAT.darkwood, 0, 1.96, -0.24, { r: 0.012 });
    c.box(0.36, 0.18, 0.24, body, 0, 1.03, -0.11, { r: 0.012 }); c.box(0.36, 0.28, 0.38, body, 0, 1.26, -0.04, { r: 0.03 });                                  /* the foot, and the head that overhangs it */
    [-0.165, 0.165].forEach(function (x) { c.box(0.03, 0.18, 0.15, body, x, 1.03, 0.075, { r: 0.008 }); });                                                        /* cheeks either side of the bay */
    c.box(0.3, 0.17, 0.006, fascia, 0, 1.03, 0.013, { cast: false, sharp: true });                                                                                 /* the back of the bay */
    c.box(0.09, 0.035, 0.07, chrome, 0, 1.105, 0.095, { cast: false, r: 0.008 }); [-0.02, 0.02].forEach(function (x) { c.cyl(0.007, 0.005, 0.03, chrome, x, 1.075, 0.1, 8); });   /* the spout and its two nozzles */
    c.box(0.34, 0.034, 0.17, body, 0, 0.957, 0.075, { r: 0.008 }); for (var gs = 0; gs < 7; gs++) c.box(0.27, 0.004, 0.012, chrome, 0, 0.976, 0.015 + gs * 0.02, { cast: false, sharp: true });   /* the drip tray and its grille */
    c.box(0.33, 0.24, 0.008, fascia, 0, 1.265, 0.151, { cast: false, r: 0.006 }); c.box(0.36, 0.012, 0.006, chrome, 0, 1.135, 0.152, { cast: false });
    c.box(0.215, 0.13, 0.008, MAT.gloss, -0.04, 1.29, 0.157, { cast: false, r: 0.006 });
    var cscr = new THREE.Mesh(new THREE.PlaneGeometry(0.195, 0.11), new THREE.MeshBasicMaterial({ map: signTex(['COFFEE', 'espresso · latte · tea'], 312, 176, { size: 44, bg: '#0a1410', color: '#9fd8b4', titleColor: '#f0b94d', line: 'rgba(0,0,0,0)' }), toneMapped: false })); cscr.position.set(-0.04, 1.29, 0.1615); c.add(cscr);
    [[1.335, 0x6fdc8c], [1.29, 0xf0b94d], [1.245, 0xe8eef4]].forEach(function (k) { var bt = c.cyl(0.015, 0.015, 0.012, colorMat(k[1], 0.3), 0.125, k[0], 0.157, 14); bt.rotation.x = Math.PI / 2; });
    c.lit(0x6fdc8c, 0.012, 0.012, 0.125, 1.2, 0.1565); c.box(0.12, 0.014, 0.004, chrome, -0.04, 1.2, 0.156, { cast: false });
    c.cyl(0.108, 0.112, 0.02, body, 0, 1.408, -0.04, 24);                                                                                                         /* the collar the hopper sits in */
    // the bean hopper on top: a clear cone you can see the level in, with a lid that lifts
    var hop = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.096, 0.17, 24, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xdff0ff, transparent: true, opacity: 0.28, roughness: 0.05, side: THREE.DoubleSide }));
    hop.position.set(0, 1.49, -0.04); hop.castShadow = false; c.add(hop);
    var lid = new THREE.Group(); lid.position.set(0, 1.575, -0.15); c.add(lid); lid.userData.coffLid = true;
    var lm = new THREE.Mesh(roundCylGeo(0.104, 0.104, 0.018, 24), body); lm.position.set(0, 0, 0.11); lid.add(lm); var lk = new THREE.Mesh(roundCylGeo(0.018, 0.022, 0.02, 12), MAT.chrome); lk.position.set(0, 0.018, 0.11); lid.add(lk);
    var beans = new THREE.Mesh(roundCylGeo(0.093, 0.09, 0.12, 20), new THREE.MeshStandardMaterial({ map: TEX.soil || null, color: 0x3a2010, roughness: 1 }));
    beans.position.set(0, 1.46, -0.04); beans.castShadow = false; c.add(beans); beans.userData.coffBeans = true;
    // the cup stack beside it, and the cup that lands under the spout
    var cups = new THREE.Group(); cups.position.set(0.21, 0.96, -0.08); c.add(cups); cups.userData.coffCups = true; cups.userData.slots = [];
    var brewG = new THREE.Group(); brewG.position.set(0, 1.026, 0.095); c.add(brewG); brewG.userData.coffBrew = true;
    c.hit(0.72, 1.6, 0.62, 0, 0.8, 0, { kind: 'lobbyCoffee' });
    var cupHit = c.hit(0.24, 0.2, 0.22, 0, 1.02, 0.12, { kind: 'coffeeCup' }); cupHit.userData.coffCupHit = true;   /* parked out of the world while there is no cup, so it never steals the machine's own prompt */
    c.sign(['COFFEE', 'help yourself · $2 a cup'], 0.5, 0.16, 0, 1.8, -0.244, 0, { titleColor: '#ffc857' });
  }, after: function (c, P, inst, id) { syncCoffee(id); } });
  growDefProp('vending', { label: 'vending machine', x: ROOM.x - 0.5, z: 6.8, rot: 3, multi: { max: 4, price: 900, gap: 1.15, ico: '🥤', lic: 'catering' }, build: function (c, P) {
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
    function dbox(w, h2, d2, m, x, y, z, noCast) { var b = new THREE.Mesh(bevelGeo(w, h2, d2), m); b.position.set(x, y, z); b.castShadow = !noCast; door.add(b); return b; }
    dbox(0.04, 1.42, 0.05, shell, 0, 0, 0);
    dbox(0.04, 1.42, 0.05, shell, 0.6, 0, 0);
    dbox(0.64, 0.05, 0.05, shell, 0.3, 0.685, 0, true);
    dbox(0.64, 0.05, 0.05, shell, 0.3, -0.685, 0, true);
    var glass = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 1.36), new THREE.MeshPhysicalMaterial({ color: 0xdff0ff, transparent: true, opacity: 0.18, roughness: 0.02, metalness: 0.05, side: THREE.DoubleSide }));
    glass.position.set(0.3, 0, 0.004); glass.castShadow = false; door.add(glass);
    var handle = new THREE.Mesh(bevelGeo(0.025, 0.3, 0.05), steel); handle.position.set(0.56, 0, 0.05); door.add(handle);

    // the racks, which ride out with the door
    var racks = new THREE.Group(); racks.position.set(-0.13, 1.06, 0.02); c.add(racks); racks.userData.vendRacks = true;
    for (var r = 0; r < 4; r++) {
      var sy = 0.5 - r * 0.29;
      var shelf = new THREE.Mesh(bevelGeo(0.6, 0.012, 0.4), colorMat(0x3a3d42, 0.5)); shelf.position.set(0, sy, 0); shelf.castShadow = false; racks.add(shelf);
      for (var k = 0; k < 4; k++) {
        var coil = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.0032, 5, 10), steel);
        coil.position.set(-0.215 + k * 0.143, sy + 0.032, 0.13); coil.rotation.x = Math.PI / 2; coil.castShadow = false; racks.add(coil);
      }
    }
    racks.userData.slots = [];

    // the delivery tray, its flap, and the hit box you press E on to reach in
    c.box(0.62, 0.03, 0.34, dark, -0.13, 0.3, 0.08, { cast: false });
    c.box(0.66, 0.02, 0.36, dark, -0.13, 0.58, 0.08, { cast: false });
    var flap = new THREE.Mesh(bevelGeo(0.56, 0.24, 0.012), new THREE.MeshPhysicalMaterial({ color: 0x2a2f36, transparent: true, opacity: 0.5, roughness: 0.2 }));
    flap.position.set(-0.13, 0.44, 0.358); flap.castShadow = false; c.add(flap); flap.userData.vendFlap = true;
    c.hit(0.6, 0.3, 0.34, -0.13, 0.42, 0.2, { kind: 'vendTray' });
    var tray = new THREE.Group(); tray.position.set(-0.13, 0.33, 0.1); c.add(tray); tray.userData.vendTray = true;

    // the panel
    c.box(0.2, 0.14, 0.02, MAT.screen, 0.315, 1.6, 0.362, { cast: false });
    var disp = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.12), new THREE.MeshBasicMaterial({ map: signTex(['READY'], 200, 130, { size: 48, bg: '#08120c', color: '#6fdc8c', titleColor: '#6fdc8c', line: 'rgba(0,0,0,0)' }), transparent: true }));
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
  growDefProp('menuScreen', { label: 'menu screen', x: 4.0, z: 4 + WALL_T / 2 + 0.05, rot: 0, build: function (c) {
    // the menu board over the lobby: a lit panel in the same housing as every other screen in the shop
    var mg = new THREE.Group(); mg.position.set(0, 2.05, 0.03); c.add(mg); screenShell(mg, 1.3, 0.72, { bezel: 0.03, depth: 0.04 });
    var cv = document.createElement('canvas'); cv.width = 1040; cv.height = 576; var x2 = cv.getContext('2d'); scrBg(x2, 1040, 576, DESK_OK);
    x2.textAlign = 'left'; x2.textBaseline = 'top'; x2.fillStyle = DESK_OK; x2.font = '700 84px ' + SIGN_FONT; x2.fillText('Today', 60, 48); x2.fillStyle = scrRgba(DESK_OK, 0.5); x2.fillRect(60, 156, 920, 3);
    [['Eighths', 'bagged fresh at the bench'], ['Joints', 'rolled by hand, one strain each'], ['Top shelf', 'on request at the window']].forEach(function (r, i) { var y = 186 + i * 104; x2.fillStyle = DESK_INK; x2.font = '600 54px ' + SIGN_FONT; x2.fillText(r[0], 60, y); x2.fillStyle = DESK_DIM; x2.font = '32px ' + SIGN_FONT; x2.fillText(r[1], 62, y + 58); });
    x2.fillStyle = DESK_WARN; x2.font = '600 34px ' + SIGN_FONT; x2.textAlign = 'right'; x2.fillText('ID required', 980, 72);
    var scr = litPlane(cv, 1.3, 0.72); scr.position.z = 0.0005; mg.add(scr); var gl = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.72), MAT.screenGlass); gl.position.z = 0.0016; mg.add(gl); c.light(new THREE.PointLight(0x6fdc8c, 0.25, 3), 0, 2.0, 0.4);
  } });
  // display shelf for packed goods in the processing room: one cell per strain, bags left and joints right
  growDefProp('goodsShelf', { label: 'goods shelf', x: 6.5, z: 3.55, rot: 2, build: function (c) {
    var wood = MAT.darkwood, w = goodsWidth(), d = 0.42, cols = goodsCols();
    c.box(w, 0.05, d, wood, 0, 0.16, 0, { solid: true }); [0.74, 1.3, 1.86].forEach(function (y) { c.box(w, 0.035, d, wood, 0, y, 0); });
    c.box(w, 2.0, 0.03, colorMat(0x2b2119, 0.9), 0, 1.0, -d / 2 + 0.015, { cast: false });   // back panel
    [-1, 1].forEach(function (s) { c.box(0.05, 2.0, d, wood, s * (w / 2 - 0.025), 1.0, 0); });
    for (var dv = 1; dv < cols; dv++) c.box(0.05, 1.8, d, wood, (dv - cols / 2) * GOODS_CELL, 1.06, 0);   // uprights, and a divider between every pair of cells
    c.box(w, 0.06, d + 0.02, wood, 0, 2.03, 0);
    c.sign(['GROW CO.', 'house menu · bags & joints'], Math.min(w - 0.2, 2.2), 0.3, 0, 2.2, 0.0, 0, { titleColor: '#6fdc8c', bg: '#0f1a12' });
    for (var i = 0; i < cols + 1; i++) c.add(spot(0xfff1d0, 0.35, 1.2, (i - cols / 2) * GOODS_CELL, 1.98, 0.12));   // a downlight over every divider
    var gg = c.dynGroup(); var gsh = new THREE.Group(); var gst = colorMat(0xa7adb4, 0.35, 0.8), gdk = colorMat(0x5b6168, 0.4, 0.7);
    var gpanel = new THREE.Mesh(bevelGeo(w - 0.12, 1.9, 0.014), gst); gsh.add(gpanel);
    for (var gs = 0; gs < 17; gs++) { var gbar = new THREE.Mesh(bevelGeo(w - 0.12, 0.012, 0.02), gdk); gbar.position.y = -0.9 + gs * 0.113; gsh.add(gbar); }
    var ghd = new THREE.Mesh(bevelGeo(0.3, 0.035, 0.035), gdk); ghd.position.set(0, -0.86, 0.02); gsh.add(ghd);
    gsh.position.set(0, 1.02, d / 2 + 0.05);   /* in front of the price cards, which hang off the shelf lips */ gg.userData.shutter = gsh; gg.add(gsh);
    var fz = d / 2 + 0.05, fd = 0.1;   /* the gate cannot sit flush without clipping the price cards, so an outer frame closes the slot it leaves at the edges */
    [-1, 1].forEach(function (s) { c.box(0.05, 2.0, fd, wood, s * (w / 2 - 0.025), 1.0, fz); }); c.box(w, 0.2, fd, wood, 0, 1.9, fz); c.box(w, 0.08, fd, wood, 0, 0.04, fz); c.box(w + 0.03, 0.06, fd + 0.04, wood, 0, 2.03, fz);   /* jambs, a head box hiding the rolled-up gate, a sill it lands on, and the shelf top carried over the frame */
    c.hit(w, 2.0, d, 0, 1.0, 0, { kind: 'goodsShelf' });
    function spot(col, inten, dist, x, y, z) { var l = new THREE.PointLight(col, inten, dist); l.position.set(x, y, z); return l; }
  }, after: function () { syncGoods(); } });   // refill after any rebuild: boot order, layout edits, resets
  // storage racking in the back annex: deliveries stack here by item until you carry a crate to where it goes
  growDefProp('stockCabinet', { label: 'stock cabinet', x: 7.55, z: -11.9, rot: 3, build: function (c) {
    // a steel security cabinet: two doors with pressed panels and louvres, bar handles, three hinges a side, a keypad lock, a plinth
    var steel = colorMat(0x505761, 0.42, 0.65), doorM = colorMat(0x5b626c, 0.38, 0.65), dark = colorMat(0x2a2d33, 0.5, 0.5);
    c.box(1.2, 1.94, 0.55, steel, 0, 1.03, 0, { solid: true }); c.box(1.24, 0.04, 0.59, dark, 0, 2.02, 0); c.box(1.16, 0.06, 0.51, dark, 0, 0.03, 0);
    [-0.3, 0.3].forEach(function (x) { var sd = x < 0 ? -1 : 1; c.box(0.575, 1.86, 0.006, MAT.black, x, 1.03, 0.277, { cast: false, sharp: true }); c.box(0.56, 1.845, 0.024, doorM, x, 1.03, 0.287, { r: 0.006 }); c.box(0.44, 0.7, 0.008, steel, x, 0.62, 0.301, { cast: false, r: 0.003 }); c.box(0.44, 0.62, 0.008, steel, x, 1.42, 0.301, { cast: false, r: 0.003 }); for (var v = 0; v < 5; v++) c.box(0.3, 0.014, 0.006, MAT.black, x, 1.78 + v * 0.03, 0.302, { cast: false, sharp: true });
      c.cyl(0.009, 0.009, 0.3, MAT.chrome, x - sd * 0.23, 1.05, 0.325, 10); [-0.12, 0.12].forEach(function (dy) { c.box(0.016, 0.016, 0.03, MAT.chrome, x - sd * 0.23, 1.05 + dy, 0.31, { cast: false, sharp: true }); }); [0.3, 1.03, 1.76].forEach(function (y) { c.cyl(0.012, 0.012, 0.09, dark, x + sd * 0.285, y, 0.29, 10); }); });
    c.box(0.09, 0.13, 0.03, MAT.gloss, 0, 1.3, 0.305, { r: 0.006 }); for (var kk = 0; kk < 9; kk++) c.box(0.016, 0.016, 0.004, colorMat(0xb9c0c6, 0.5), -0.024 + (kk % 3) * 0.024, 1.3 - Math.floor(kk / 3) * 0.024, 0.3215, { cast: false, sharp: true }); c.lit(0x6fdc8c, 0.012, 0.012, 0.024, 1.345, 0.3205); c.lit(0x5a1a1a, 0.012, 0.012, -0.024, 1.345, 0.3205);   // keypad lock
    c.sign(['STOCK', 'packed goods · locked'], 0.4, 0.13, 0.3, 1.62, 0.306, 0, { size: 22, bg: '#f3e9cf', color: '#222', titleColor: '#1a6a2a', line: 'rgba(0,0,0,.3)' });
    c.hit(1.3, 2.0, 0.8, 0, 1.0, 0.1, { kind: 'stock' });
  } });
  // pallet racking: blue frames, orange beams, wire decks, four levels of six bays, a label plate on the beam under every bay
  growDefProp('storeRack', { label: 'storage racking', x: 0.5, z: -10.85, rot: 1, build: function (c) {
    var frameM = colorMat(0x2a5aa8, 0.45, 0.5), beamM = colorMat(0xe07a1f, 0.45, 0.4), deckM = colorMat(0x9aa0a6, 0.4, 0.8);
    [-1.5, 0, 1.5].forEach(function (x) { [-0.26, 0.26].forEach(function (z) { c.box(0.06, 2.3, 0.06, frameM, x, 1.15, z); }); for (var b = 0; b < 5; b++) c.box(0.03, 0.03, 0.5, frameM, x, 0.25 + b * 0.45, 0); });   /* uprights with their cross braces */
    RACK.y.forEach(function (y) { [-0.27, 0.27].forEach(function (z) { c.box(3.06, 0.07, 0.04, beamM, 0, y - 0.035, z); }); c.box(2.96, 0.015, 0.5, deckM, 0, y + 0.005, 0); });
    c.solid(-1.55, 1.55, -0.32, 0.32); c.hit(3.1, 2.3, 0.6, 0, 1.15, 0, { kind: 'storage' });
    c.sign(['STORAGE', 'deliveries land here · E takes a crate · E with a crate racks it'], 1.9, 0.32, 0, 2.5, 0.02, 0, { titleColor: '#ffc857' }); c.dynGroup();
  }, after: function () { syncStorage(); } });
  // office vault: cash you carry in goes in here; the bank courier collects from your pocket
  growDefProp('bagLine', { label: 'trim & bag line', x: 4.5, z: 2.9, rot: 1, build: function (c) {
    // a bench-top line: a hopper over a trimming drum, a short belt on rollers, a control box with a stop button, a chute into the bag holder
    var st = MAT.steel, dk = MAT.gunmetal, belt = colorMat(0x16181b, 0.85);
    c.box(1.2, 0.06, 0.6, st, 0, 0.87, 0, { solid: true }); c.box(1.14, 0.5, 0.54, dk, 0, 0.6, 0, { cast: false }); [[-0.55, -0.25], [0.55, -0.25], [-0.55, 0.25], [0.55, 0.25]].forEach(function (l) { c.box(0.05, 0.84, 0.05, st, l[0], 0.42, l[1]); c.cyl(0.035, 0.04, 0.02, MAT.soft, l[0], 0.01, l[1], 12); }); c.box(1.1, 0.03, 0.5, st, 0, 0.2, 0, { cast: false });
    c.box(0.5, 0.42, 0.46, dk, -0.3, 1.11, 0, { r: 0.02 }); var drum = c.cyl(0.17, 0.17, 0.4, st, -0.3, 1.13, 0.0, 24); drum.rotation.x = Math.PI / 2; c.lit(0x0c0f0d, 0.3, 0.2, -0.3, 1.13, 0.232); for (var sl = 0; sl < 5; sl++) c.box(0.26, 0.008, 0.006, st, -0.3, 1.06 + sl * 0.035, 0.234, { cast: false, sharp: true });
    c.cyl(0.26, 0.15, 0.32, st, -0.3, 1.49, 0, 28); c.cyl(0.272, 0.272, 0.02, MAT.chrome, -0.3, 1.655, 0, 28); c.cyl(0.24, 0.24, 0.01, colorMat(0x3f7a3a, 1), -0.3, 1.6, 0, 20);
    c.box(0.6, 0.02, 0.36, belt, 0.28, 0.93, 0, { cast: false }); [0.0, 0.56].forEach(function (x) { var rl = c.cyl(0.03, 0.03, 0.38, MAT.chrome, x, 0.92, 0, 14); rl.rotation.x = Math.PI / 2; }); [-0.19, 0.19].forEach(function (z) { c.box(0.62, 0.05, 0.016, st, 0.28, 0.93, z, { cast: false }); });
    c.box(0.16, 0.2, 0.1, MAT.gloss, 0.2, 1.1, -0.26, { r: 0.01 }); c.lit(0x6fdc8c, 0.02, 0.02, 0.16, 1.15, -0.2095); c.lit(0xf0b94d, 0.02, 0.02, 0.2, 1.15, -0.2095); c.cyl(0.022, 0.022, 0.024, colorMat(0xd0201a, 0.35), 0.24, 1.08, -0.2, 16).rotation.x = Math.PI / 2; c.cyl(0.03, 0.03, 0.008, colorMat(0xe3b52c, 0.5), 0.24, 1.08, -0.208, 16).rotation.x = Math.PI / 2;
    var ch = c.box(0.2, 0.012, 0.3, st, 0.66, 0.84, 0, { sharp: true }); ch.rotation.z = -0.55; c.box(0.2, 0.25, 0.04, MAT.white, 0.72, 0.62, 0.1, { cast: false });
    c.sign(['TRIM & BAG'], 0.6, 0.12, 0, 0.6, 0.272, 0, { size: 26, titleColor: '#6fdc8c', bg: '#101410' }); c.hit(1.3, 1.8, 0.8, 0, 0.9, 0.05, { kind: 'bagLine' });
  } });
  growDefProp('vipTable', { label: 'lounge table + armchairs', floor: 1, x: 7.4, z: -1.6, rot: 0, build: function (c) {
    var velvet = colorMat(0x5a1f3a, 0.95), brass = colorMat(0xc9a24a, 0.35, 0.8);
    c.cyl(0.45, 0.45, 0.05, MAT.darkwood, 0, 0.62, 0, 20); c.cyl(0.05, 0.05, 0.6, brass, 0, 0.3, 0, 10); c.cyl(0.28, 0.3, 0.04, brass, 0, 0.02, 0, 16); c.cyl(0.07, 0.05, 0.03, MAT.jar, 0.1, 0.66, 0.05, 12); c.cyl(0.015, 0.015, 0.2, colorMat(0xfff3c8, 0.4), -0.12, 0.75, -0.08, 8);
    [-0.95, 0.95].forEach(function (x) { c.box(0.7, 0.35, 0.7, velvet, x, 0.28, 0); c.box(0.14, 0.75, 0.7, velvet, x + (x > 0 ? 0.3 : -0.3), 0.6, 0); c.box(0.7, 0.3, 0.12, velvet, x, 0.58, -0.32); c.box(0.7, 0.3, 0.12, velvet, x, 0.58, 0.32); [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]].forEach(function (l) { c.box(0.05, 0.12, 0.05, brass, x + l[0], 0.06, l[1]); }); });
    c.solid(-1.3, 1.3, -0.4, 0.4);
  } });
  // the way down to the RF Smoking works, and the shuttered cabinet the packs are sold from
  growDefProp('cellarHatch', { label: 'basement hatch', x: 3.3, z: -0.4, rot: 3, build: function (c) {
    var st = colorMat(0x8d949c, 0.35, 0.8), dk = colorMat(0x2b2f35, 0.5, 0.6);
    c.box(1.3, 0.04, 1.3, dk, 0, 0.02, 0, { cast: false }); c.box(1.1, 0.012, 1.1, MAT.black, 0, 0.042, 0, { cast: false });
    var lid = c.box(1.2, 0.05, 1.2, st, 0, 0.64, -0.6); lid.rotation.x = -Math.PI / 2 + 0.06;   // the lid stands open flat against the wall, the ladder comes up in front of it
    [-0.4, 0.4].forEach(function (x) { c.cyl(0.022, 0.022, 1.1, colorMat(0xf2c21a, 0.6), x, 0.55, -0.42, 8); }); for (var r = 0; r < 3; r++) c.box(0.8, 0.03, 0.03, st, 0, 0.12 + r * 0.3, -0.42, { cast: false });
    c.sign(['RF SMOKING ↓', 'basement works'], 0.9, 0.26, 0, 1.45, -0.6, 0, { size: 26, bg: '#14100c', titleColor: '#e8c27a', color: '#b9a88a', line: 'rgba(232,194,122,.5)' }); c.box(0.04, 1.5, 0.04, dk, 0, 0.75, -0.63);
    c.solid(-0.65, 0.65, -0.8, -0.55); c.hit(1.3, 1.5, 1.3, 0, 0.75, 0, { kind: 'cellarDown' });
  } });
  growDefProp('cigCabinet', { label: 'cigarette cabinet', x: 2.5, z: 3.68, rot: 2, build: function (c) {
    var m = colorMat(0x2b2f35, 0.5, 0.5), inner = colorMat(0xe9e4d8, 0.8), st = colorMat(0xa7adb4, 0.35, 0.8), dk = colorMat(0x5b6168, 0.4, 0.7);
    c.box(1.2, 2.0, 0.05, m, 0, 1.0, -0.175); c.box(0.05, 2.0, 0.4, m, -0.6, 1.0, 0); c.box(0.05, 2.0, 0.4, m, 0.6, 1.0, 0); c.box(1.2, 0.06, 0.4, m, 0, 1.97, 0); c.box(1.2, 0.42, 0.4, m, 0, 0.21, 0); c.box(1.1, 1.5, 0.01, inner, 0, 1.17, -0.145, { cast: false });
    [0.57, 0.92, 1.27, 1.62].forEach(function (y) { c.box(1.1, 0.025, 0.3, m, 0, y - 0.013, 0, { cast: false }); }); c.box(1.2, 0.14, 0.1, m, 0, 1.9, 0.22); c.box(0.03, 1.5, 0.03, st, -0.565, 1.15, 0.2, { cast: false }); c.box(0.03, 1.5, 0.03, st, 0.565, 1.15, 0.2, { cast: false });
    c.sign(['RF SMOKING'], 0.7, 0.1, 0, 1.9, 0.272, 0, { size: 26, bg: '#14100c', titleColor: '#e8c27a', line: 'rgba(0,0,0,0)' });
    var g = c.dynGroup(); var sh = new THREE.Group(); var panel = new THREE.Mesh(bevelGeo(1.1, 1.45, 0.014), st); sh.add(panel); for (var s = 0; s < 14; s++) { var gr = new THREE.Mesh(bevelGeo(1.1, 0.012, 0.02), dk); gr.position.y = -0.69 + s * 0.105; sh.add(gr); } var hd = new THREE.Mesh(bevelGeo(0.3, 0.035, 0.035), dk); hd.position.set(0, -0.66, 0.02); sh.add(hd); sh.position.set(0, 1.145, 0.2); g.userData.shutter = sh; g.add(sh);
    c.solid(-0.6, 0.6, -0.2, 0.2); c.hit(1.25, 2.0, 0.5, 0, 1.0, 0.03, { kind: 'cigCab' });
  }, after: function () { syncCigCab(); } });
  // steel weapon locker on the staff side of the counter: buy, take and restock what you fight back with
  growDefProp('gunLocker', { label: 'weapon locker', x: -2.6, z: 3.68, rot: 2, build: function (c) {
    // a gun cabinet: heavy gauge steel, two doors with louvres and recessed pulls, a hasp and padlock, hazard tape along the plinth
    var m = colorMat(0x3b4048, 0.42, 0.75), m2 = colorMat(0x454b54, 0.38, 0.75);
    c.box(0.8, 1.44, 0.36, m, 0, 0.78, 0, { solid: true }); c.box(0.78, 0.06, 0.34, MAT.soft, 0, 0.03, 0, { cast: false }); c.box(0.84, 0.03, 0.4, m, 0, 1.515, 0);
    [-0.2, 0.2].forEach(function (x) { var sd = x < 0 ? -1 : 1; c.box(0.385, 1.36, 0.006, MAT.black, x, 0.78, 0.182, { cast: false, sharp: true }); c.box(0.372, 1.345, 0.02, m2, x, 0.78, 0.19, { r: 0.005 }); for (var v = 0; v < 4; v++) { c.box(0.2, 0.014, 0.006, MAT.black, x, 1.26 + v * 0.035, 0.2015, { cast: false, sharp: true }); c.box(0.2, 0.014, 0.006, MAT.black, x, 0.2 + v * 0.035, 0.2015, { cast: false, sharp: true }); } c.box(0.03, 0.12, 0.006, MAT.black, x - sd * 0.14, 0.8, 0.2015, { cast: false, sharp: true }); c.box(0.012, 0.12, 0.012, MAT.chrome, x - sd * 0.15, 0.8, 0.206, { cast: false, sharp: true }); [0.25, 0.78, 1.31].forEach(function (y) { c.cyl(0.01, 0.01, 0.08, MAT.soft, x + sd * 0.192, y, 0.192, 10); }); });
    c.box(0.07, 0.04, 0.008, MAT.chrome, 0, 0.62, 0.205, { cast: false, sharp: true }); c.box(0.04, 0.05, 0.022, MAT.brass, 0, 0.575, 0.212, { r: 0.006 }); var shk = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.004, 6, 12, Math.PI), MAT.chrome); shk.position.set(0, 0.6, 0.212); c.add(shk);
    for (var hz = 0; hz < 8; hz++) c.box(0.05, 0.03, 0.004, colorMat(hz % 2 ? 0x15171b : 0xe3b52c, 0.5), -0.35 + hz * 0.1, 0.09, 0.184, { cast: false, sharp: true });
    c.sign(['WEAPONS', 'staff only'], 0.5, 0.16, 0, 1.62, -0.17, 0, { size: 26, titleColor: '#ff6b6b', bg: '#101410' });
    c.hit(0.85, 1.5, 0.46, 0, 0.75, 0, { kind: 'locker' });
  } });
  growDefProp('vault', { label: 'vault', x: -ROOM.x + 0.45, z: 2.4, rot: 1, build: function (c) {
    // a safe worth the name: a body on four feet, a door proud of its frame on two barrel hinges, a five-spoke wheel, a combination dial, a brass plate
    var m = colorMat(0x2a2d33, 0.42, 0.7), m2 = colorMat(0x353940, 0.36, 0.75);
    c.box(0.7, 0.9, 0.7, m, 0, 0.5, 0, { solid: true, r: 0.02 }); [[-0.28, -0.28], [0.28, -0.28], [-0.28, 0.28], [0.28, 0.28]].forEach(function (f) { c.cyl(0.04, 0.045, 0.05, MAT.soft, f[0], 0.025, f[1], 14); });
    c.box(0.64, 0.84, 0.01, MAT.black, 0, 0.5, 0.352, { cast: false, sharp: true }); c.box(0.6, 0.8, 0.05, m2, 0, 0.5, 0.375, { r: 0.012 }); c.box(0.5, 0.7, 0.008, m, 0, 0.5, 0.402, { cast: false, r: 0.003 });
    [0.24, 0.76].forEach(function (y) { c.cyl(0.022, 0.022, 0.14, MAT.steel, -0.315, y, 0.375, 14); c.cyl(0.026, 0.026, 0.012, MAT.chrome, -0.315, y + 0.076, 0.375, 14); });
    var wheel = new THREE.Group(); wheel.position.set(0.1, 0.46, 0.43); c.add(wheel); var rim = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.011, 10, 36), MAT.chrome); rim.castShadow = true; wheel.add(rim); for (var sp = 0; sp < 5; sp++) { var spoke = new THREE.Mesh(roundCylGeo(0.007, 0.007, 0.11, 8), MAT.chrome); spoke.rotation.z = sp * Math.PI * 2 / 5; spoke.position.set(-Math.sin(spoke.rotation.z) * 0.055, Math.cos(spoke.rotation.z) * 0.055, 0); wheel.add(spoke); } var hubw = new THREE.Mesh(roundCylGeo(0.03, 0.034, 0.04, 20), MAT.steel); hubw.rotation.x = Math.PI / 2; hubw.position.z = -0.008; wheel.add(hubw);
    var dial = new THREE.Mesh(roundCylGeo(0.06, 0.066, 0.03, 32), MAT.steel); dial.rotation.x = Math.PI / 2; dial.position.set(-0.14, 0.64, 0.418); c.add(dial); var dk = new THREE.Mesh(roundCylGeo(0.026, 0.03, 0.03, 20), MAT.chrome); dk.rotation.x = Math.PI / 2; dk.position.set(-0.14, 0.64, 0.445); c.add(dk);
    for (var t = 0; t < 24; t++) { var tk = c.box(0.003, t % 6 ? 0.008 : 0.014, 0.002, MAT.white, -0.14 + Math.cos(t / 24 * Math.PI * 2) * 0.05, 0.64 + Math.sin(t / 24 * Math.PI * 2) * 0.05, 0.4345, { cast: false, sharp: true }); tk.rotation.z = t / 24 * Math.PI * 2 + Math.PI / 2; }
    c.lit(0xff5040, 0.012, 0.012, -0.14, 0.73, 0.4075);
    c.sign(['VAULT'], 0.26, 0.06, 0, 0.84, 0.4075, 0, { size: 22, bold: true, bg: '#c9a24a', color: '#2a2210', titleColor: '#2a2210', line: 'rgba(60,45,10,.6)' });
    c.hit(0.8, 1.0, 0.8, 0, 0.5, 0, { kind: 'vault' });
  } });
  // coin-op arcade cabinet in the lobby: customers drop a dollar in, you empty the coin box
  growDefProp('arcade', { label: 'arcade cabinet', x: -ROOM.x + 0.45, z: 6.4, rot: 1, multi: { max: 4, price: 750, gap: 1.0, ico: '🕹️', lic: 'amusement' }, build: function (c) {
    // an upright cabinet with the proper silhouette: two side panels cut to the classic profile, a lit marquee, a screen leaning
    // back behind its bezel, a sloped control deck with a stick and six buttons, a coin door with two slots
    var body = colorMat(0x15171b, 0.45, 0.1), trim = colorMat(0x6fdc8c, 0.4, 0, { emissive: new THREE.Color(0x2f8a4a), emissiveIntensity: 0.6 });
    var sh = new THREE.Shape(); [[-0.35, 0], [0.35, 0], [0.35, 0.92], [0.5, 1.0], [0.5, 1.12], [0.3, 1.18], [0.24, 1.6], [0.4, 1.66], [0.4, 1.86], [-0.35, 1.86]].forEach(function (p, i) { if (i) sh.lineTo(p[0], p[1]); else sh.moveTo(p[0], p[1]); }); sh.closePath();
    [-0.34, 0.34].forEach(function (x) { var side = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1 }), body); side.rotation.y = -Math.PI / 2; side.position.set(x + 0.015, 0, 0); side.castShadow = true; c.add(side); var edge = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.006, bevelEnabled: false }), trim); edge.rotation.y = -Math.PI / 2; edge.scale.set(1.012, 1.006, 1); edge.position.set(x + (x < 0 ? -0.013 : 0.019), -0.004, 0.004); c.add(edge); });
    c.box(0.65, 1.84, 0.04, body, 0, 0.93, -0.33); c.box(0.65, 0.92, 0.04, body, 0, 0.46, 0.33); c.box(0.65, 0.04, 0.72, body, 0, 1.85, 0.02); c.box(0.65, 0.06, 0.66, MAT.soft, 0, 0.03, 0, { cast: false }); c.solid(-0.37, 0.37, -0.36, 0.5);
    c.lit(0xe8fff0, 0.62, 0.18, 0, 1.76, 0.402); var marquee = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.17), new THREE.MeshBasicMaterial({ map: signTex(['GROW RUSH'], 300, 85, { size: 46, bold: true, bg: '#0d2a18', titleColor: '#6fdc8c', line: 'rgba(111,220,140,.8)' }), toneMapped: false })); marquee.position.set(0, 1.76, 0.404); c.add(marquee);
    var sg = new THREE.Group(); sg.position.set(0, 1.39, 0.255); sg.rotation.x = -0.14; c.add(sg); screenShell(sg, 0.52, 0.39, { bezel: 0.04, depth: 0.03, rimMat: body, led: 0 });
    var gv = document.createElement('canvas'); gv.width = 416; gv.height = 312; var gx = gv.getContext('2d'); gx.fillStyle = '#06130c'; gx.fillRect(0, 0, 416, 312); gx.fillStyle = '#0d2a18'; for (var gy = 0; gy < 312; gy += 26) gx.fillRect(0, gy, 416, 1); gx.fillStyle = '#6fdc8c'; gx.font = '700 40px ' + SCR_MONO; gx.textAlign = 'center'; gx.fillText('GROW RUSH', 208, 64); gx.font = '20px ' + SCR_MONO; gx.fillStyle = '#f0b94d'; gx.fillText('HI 042000', 208, 96);
    [[60, 230, '#6fdc8c'], [130, 200, '#6fdc8c'], [200, 240, '#f0b94d'], [270, 190, '#6fdc8c'], [340, 225, '#ff6b5e']].forEach(function (p) { gx.fillStyle = '#5a3a22'; gx.fillRect(p[0] - 14, p[1] + 24, 28, 22); gx.fillStyle = p[2]; for (var lf = 0; lf < 5; lf++) gx.fillRect(p[0] - 3 + (lf - 2) * 9, p[1] - Math.abs(lf - 2) * -8, 6, 26); });
    gx.fillStyle = '#e8f1ea'; gx.font = '18px ' + SCR_MONO; gx.fillText('INSERT COIN', 208, 294);
    var gs = litPlane(gv, 0.52, 0.39); gs.position.z = 0.0005; sg.add(gs); var gg = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.39), MAT.screenGlass); gg.position.z = 0.0016; sg.add(gg);
    var deck = new THREE.Group(); deck.position.set(0, 1.06, 0.4); deck.rotation.x = 0.42; c.add(deck); var dp = new THREE.Mesh(bevelGeo(0.65, 0.03, 0.26), colorMat(0x1f2226, 0.5)); dp.castShadow = true; deck.add(dp);
    var stick = new THREE.Mesh(roundCylGeo(0.008, 0.008, 0.09, 8), MAT.chrome); stick.position.set(-0.17, 0.06, 0); deck.add(stick); var ball = new THREE.Mesh(new THREE.SphereGeometry(0.028, 16, 12), colorMat(0xc94a3a, 0.25)); ball.position.set(-0.17, 0.115, 0); deck.add(ball); var boot = new THREE.Mesh(roundCylGeo(0.02, 0.034, 0.014, 16), MAT.soft); boot.position.set(-0.17, 0.022, 0); deck.add(boot);
    [[0.02, -0.03, 0xffd166], [0.1, -0.05, 0xff6b5e], [0.18, -0.03, 0x7cc4ff], [0.04, 0.045, 0x6fdc8c], [0.12, 0.025, 0xf3eee0], [0.2, 0.045, 0xc9a0ff]].forEach(function (b) { var ring = new THREE.Mesh(roundCylGeo(0.024, 0.026, 0.008, 18), MAT.black); ring.position.set(b[0], 0.019, b[1]); deck.add(ring); var bt = new THREE.Mesh(roundCylGeo(0.019, 0.019, 0.016, 18), colorMat(b[2], 0.3)); bt.position.set(b[0], 0.028, b[1]); deck.add(bt); });
    c.box(0.34, 0.3, 0.012, colorMat(0x22262b, 0.4, 0.6), 0, 0.56, 0.356, { r: 0.004 }); [-0.07, 0.07].forEach(function (x) { c.lit(0xff5040, 0.05, 0.07, x, 0.62, 0.3625); c.box(0.004, 0.036, 0.004, MAT.black, x, 0.62, 0.3635, { cast: false, sharp: true }); }); c.box(0.1, 0.04, 0.01, MAT.chrome, 0, 0.5, 0.366, { cast: false, sharp: true }); c.cyl(0.01, 0.01, 0.008, MAT.chrome, 0.13, 0.56, 0.366, 10).rotation.x = Math.PI / 2;   // coin door
    c.light(new THREE.PointLight(0x6fdc8c, 0.4, 3), 0, 1.4, 0.7);
    c.hit(0.8, 2.0, 0.9, 0, 1.0, 0.1, { kind: 'arcade' });
  } });
  growDefProp('procShelf', { label: 'storage shelf', x: 8.5, z: -1.55, rot: 0, build: function (c) {
    var shelfM = colorMat(0x8a8f96, 0.35, 0.8); for (var s = 0; s < 4; s++) c.box(1.6, 0.03, 0.45, shelfM, 0, 0.3 + s * 0.5, 0);
    [[-0.78, -0.2], [0.78, -0.2], [-0.78, 0.2], [0.78, 0.2]].forEach(function (p) { c.box(0.035, 1.9, 0.035, shelfM, p[0], 0.95, p[1]); });
    c.box(0.5, 0.3, 0.35, colorMat(0xc8a97a, 1), -0.45, 0.47, 0); c.box(0.4, 0.25, 0.3, colorMat(0xe8e8ee, 0.7), 0.35, 0.44, 0); c.sign(['BAGGIES'], 0.3, 0.08, 0.35, 0.44, 0.152, 0, { size: 26, bg: '#f3e9cf', color: '#222', titleColor: '#222', line: 'rgba(0,0,0,.3)' });
    for (var j = 0; j < 6; j++) { c.cyl(0.06, 0.06, 0.14, MAT.jar, -0.6 + j * 0.24, 0.89, 0, 12); c.cyl(0.062, 0.062, 0.015, MAT.jarLid, -0.6 + j * 0.24, 0.965, 0, 12); }
    c.box(0.6, 0.2, 0.3, colorMat(0x3a5a3a, 0.9), -0.4, 1.42, 0); c.box(0.3, 0.14, 0.2, colorMat(0xf5e6c8, 0.8), 0.3, 1.39, 0); c.box(0.5, 0.08, 0.3, MAT.white, 0.4, 1.86, 0); c.cyl(0.09, 0.09, 0.2, colorMat(0x2b6fb3, 0.4), -0.5, 1.92, 0, 14);
    c.solid(-0.8, 0.8, -0.25, 0.25);
  } });
  growDefProp('hallClockTable', { label: 'side table', x: -3.5, z: 1.6, rot: 1, build: function (c) { c.box(0.5, 0.04, 0.5, MAT.wood, 0, 0.7, 0, { solid: true }); legs4(c, 0.5, 0.5, 0.68, MAT.darkwood, 0.05, 0.04); c.box(0.44, 0.03, 0.44, MAT.wood, 0, 0.25, 0, { cast: false }); c.cyl(0.06, 0.05, 0.16, colorMat(0xf5f5f0, 0.5), -0.1, 0.8, 0, 14); for (var i = 0; i < 5; i++) { var fl = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), colorMat([0xff6b9d, 0xffd166, 0x9ad0ff, 0xff8c42, 0xf2f2f2][i], 0.8)); fl.position.set(-0.1 + Math.cos(i * 1.3) * 0.05, 0.95 + (i % 2) * 0.04, Math.sin(i * 1.3) * 0.05); c.add(fl); var st = c.cyl(0.004, 0.004, 0.14, MAT.stem, -0.1 + Math.cos(i * 1.3) * 0.03, 0.88, Math.sin(i * 1.3) * 0.03, 5); } c.box(0.14, 0.2, 0.03, MAT.darkwood, 0.14, 0.82, -0.05); c.box(0.11, 0.16, 0.005, new THREE.MeshBasicMaterial({ map: signTex(['📷', 'the crew'], 110, 160, { size: 30, bg: '#f0ead8', color: '#333', titleColor: '#333', line: 'rgba(0,0,0,0)' }) }), 0.14, 0.82, -0.032, { cast: false }); } });
  growDefProp('floorLamp', { label: 'floor lamp', x: -1.2, z: -1.6, rot: 0, build: function (c) {
    // a drum-shade floor lamp: a stone foot, a brass stem with a collar, a linen shade with a diffuser under it
    c.cyl(0.17, 0.18, 0.04, colorMat(0x2a2c2f, 0.3, 0.05), 0, 0.02, 0, 32); c.cyl(0.012, 0.012, 1.56, MAT.brass, 0, 0.82, 0, 12); c.cyl(0.024, 0.024, 0.05, MAT.brass, 0, 0.07, 0, 14); c.cyl(0.02, 0.02, 0.04, MAT.brass, 0, 1.5, 0, 14);
    var shM = new THREE.MeshStandardMaterial({ map: TEX.fabric, color: 0xf3ead2, side: THREE.DoubleSide, emissive: 0xffe0a0, emissiveIntensity: 0.55, roughness: 0.95 }); var sh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.3, 32, 1, true), shM); sh.position.y = 1.7; c.add(sh);
    [1.85, 1.55].forEach(function (y, i) { var rg = new THREE.Mesh(new THREE.TorusGeometry(i ? 0.22 : 0.2, 0.005, 6, 32), MAT.brass); rg.rotation.x = Math.PI / 2; rg.position.y = y; c.add(rg); }); c.cyl(0.19, 0.19, 0.006, new THREE.MeshBasicMaterial({ color: 0xfff1cf, toneMapped: false }), 0, 1.57, 0, 24); c.cyl(0.035, 0.035, 0.1, emitMat(0xffe9b0, 1.6), 0, 1.68, 0, 12);
    c.light(new THREE.PointLight(0xffe0a0, 0.45, 5), 0, 1.6, 0); c.solid(-0.2, 0.2, -0.2, 0.2); } });
  growDefProp('guardBoard', { label: 'notice board', x: 5.0, z: ROOM.z - 0.13, rot: 2, build: function (c) { c.box(1.0, 0.7, 0.03, colorMat(0x8a6a4a, 0.9), 0, 1.7, 0); c.box(1.04, 0.74, 0.02, MAT.darkwood, 0, 1.7, -0.01, { cast: false }); [['NO ID', 'NO ENTRY', '#fff', '#c9302c'], ['LOST', 'grey cat, answers to Kush', '#333', '#f0ead8'], ['BAND', 'friday · the dry room', '#062010', '#6fdc8c'], ['WANTED', 'trimmers · ask inside', '#332200', '#ffc857']].forEach(function (n, i) { var x = -0.32 + (i % 2) * 0.36, y = 1.86 - Math.floor(i / 2) * 0.32; var note = c.sign([n[0], n[1]], 0.3, 0.24, x, y, 0.02, 0, { size: 22, bg: n[3], color: n[2], titleColor: n[2], line: 'rgba(0,0,0,.2)' }); note.rotation.z = (i % 2 ? -0.06 : 0.05); var pin = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), colorMat([0xc94a3a, 0x3a7fd6, 0xffd166, 0x3aa36a][i], 0.4)); pin.position.set(x, y + 0.1, 0.03); c.add(pin); }); } });
  // upstairs
  growDefProp('dining', { label: 'dining set', floor: 1, x: -4, z: -5.6, rot: 0, build: function (c) {
    c.box(1.6, 0.05, 0.9, MAT.wood, 0, 0.75, 0, { solid: true }); c.box(1.5, 0.04, 0.8, MAT.darkwood, 0, 0.72, 0, { cast: false }); legs4(c, 1.6, 0.9, 0.72, MAT.darkwood, 0.1, 0.06);
    chair(c, -0.5, -0.8, 0, fabricMat(0x3a5a3a), MAT.darkwood); chair(c, 0.5, -0.8, 0, fabricMat(0x3a5a3a), MAT.darkwood); chair(c, -0.5, 0.8, Math.PI, fabricMat(0x3a5a3a), MAT.darkwood); chair(c, 0.5, 0.8, Math.PI, fabricMat(0x3a5a3a), MAT.darkwood);
    c.hit(1.8, 0.8, 1.1, 0, 0.7, 0, { kind: 'eatspot', label: 'dining table' });
    [-0.35, 0.35].forEach(function (x) { c.cyl(0.14, 0.12, 0.012, colorMat(0xf5f5f0, 0.4), x, 0.786, 0, 20); c.cyl(0.05, 0.045, 0.1, MAT.jar, x + 0.2, 0.83, -0.2, 12); c.box(0.02, 0.005, 0.14, MAT.chrome, x - 0.18, 0.783, 0, { cast: false }); c.box(0.02, 0.005, 0.14, MAT.chrome, x + 0.18, 0.783, 0, { cast: false }); });
    var vase = new THREE.Mesh(roundCylGeo(0.05, 0.035, 0.18, 12), MAT.jar); vase.position.set(0, 0.87, 0); c.add(vase); for (var f = 0; f < 4; f++) { c.cyl(0.004, 0.004, 0.2, MAT.stem, Math.cos(f * 1.6) * 0.02, 1.02, Math.sin(f * 1.6) * 0.02, 5); var fl = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), colorMat([0xff6b9d, 0xffd166, 0xf2f2f2, 0xff8c42][f], 0.8)); fl.position.set(Math.cos(f * 1.6) * 0.04, 1.12, Math.sin(f * 1.6) * 0.04); c.add(fl); }
    c.box(0.24, 0.005, 0.24, colorMat(0xe0c25a, 1), -0.35, 0.78, 0, { cast: false }); c.box(0.24, 0.005, 0.24, colorMat(0xe0c25a, 1), 0.35, 0.78, 0, { cast: false });
  } });
  growDefProp('couchUp', { label: 'couch + coffee table', floor: 1, x: DIVX - 3.7, z: 0.5, rot: 1, build: function (c) {
    // built along local x with the back at -z; rot 1 turns the back to the wall side (-x) so it faces the TV on the right wall
    var seatM = fabricMat(0x3b4a5c), pipeM = fabricMat(0x2a3542);
    sofaBuild(c, 2.4, seatM, pipeM);
    [-0.6, 0.6].forEach(function (x) { var cu = c.box(0.42, 0.13, 0.42, fabricMat(x < 0 ? 0xe0c25a : 0xc94a3a), x, 0.62, -0.14, { r: 0.055 }); cu.rotation.set(1.05, x < 0 ? -0.2 : 0.25, 0); });
    c.box(1.2, 0.14, 0.3, fabricMat(0x8a8a8a), 0.2, 0.34, 0.0).rotation.z = 0.02;   // throw blanket
    c.hit(2.5, 1.2, 1.2, 0, 0.6, 0, { kind: 'couch', seat: 'couchUp' });
    coffeeTableBuild(c, 0, 1.3, 1.2, 0.7);
    c.box(0.16, 0.16, 0.12, MAT.black, 0.3, 0.52, 1.3); c.box(0.14, 0.02, 0.1, MAT.plastic, 0.3, 0.6, 1.3, { cast: false }); var mug = new THREE.Mesh(roundCylGeo(0.04, 0.035, 0.09, 12), colorMat(0x6fdc8c, 0.5)); mug.position.set(-0.3, 0.49, 1.2); c.add(mug); c.box(0.18, 0.02, 0.12, MAT.black, -0.1, 0.45, 1.4, { cast: false }); for (var b = 0; b < 12; b++) c.box(0.012, 0.005, 0.012, colorMat(0x8a8f96), -0.16 + (b % 6) * 0.024, 0.462, 1.38 + Math.floor(b / 6) * 0.03, { cast: false });   // remote
    c.box(0.24, 0.02, 0.3, colorMat(0xe8e8ee, 0.7), 0.35, 0.45, 1.15, { cast: false }); c.box(0.2, 0.01, 0.26, new THREE.MeshBasicMaterial({ map: signTex(['grow', 'notes'], 100, 130, { size: 26, bg: '#f0ead8', color: '#333', titleColor: '#1a6a2a', line: 'rgba(0,0,0,0)' }) }), 0.35, 0.462, 1.15, { cast: false });
    c.box(4.5, 0.02, 3.6, new THREE.MeshStandardMaterial({ map: TEX.fabric, color: 0x5a3a2a, roughness: 1 }), 0, 0.01, 1.4, { cast: false }); c.box(4.2, 0.005, 3.3, new THREE.MeshStandardMaterial({ map: TEX.fabric, color: 0x7a4a34, roughness: 1 }), 0, 0.022, 1.4, { cast: false });
    c.box(0.03, 1.7, 0.03, MAT.chrome, -1.6, 0.85, -0.2); c.cyl(0.14, 0.16, 0.02, MAT.black, -1.6, 0.01, -0.2, 18); var lshade = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.32, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0xf1e7c8, side: THREE.DoubleSide, emissive: 0xffe0a0, emissiveIntensity: 0.4 })); lshade.position.set(-1.6, 1.8, -0.2); c.add(lshade); c.light(new THREE.PointLight(0xffe0a0, 0.4, 5), -1.6, 1.7, -0.2);
  }, after: function (c, P) { var v = growPropWorld('couchUp', 0, 0.1); world.couchSeat = { x: v.x, z: v.z, yaw: -Math.PI / 2 + P.rot * Math.PI / 2 - Math.PI / 2 }; } });
  growDefProp('bed', { label: 'bed', floor: 1, x: -8.5, z: 6.9, rot: 0, build: function (c) {
    c.box(1.6, 0.4, 2.1, MAT.darkwood, 0, 0.2, 0, { solid: true }); c.box(1.5, 0.22, 2.0, fabricMat(0xe8e8ee), 0, 0.51, 0); c.box(1.52, 0.02, 2.02, colorMat(0xd0d0d8, 0.9), 0, 0.51, 0, { cast: false });
    var duvet = c.box(1.54, 0.18, 1.25, fabricMat(0x3a6a4a), 0, 0.68, 0.38); c.box(1.54, 0.04, 0.2, fabricMat(0x2f5a3c), 0, 0.78, -0.2, { cast: false });
    [-0.38, 0.38].forEach(function (x) { c.box(0.62, 0.14, 0.42, fabricMat(0xffffff), x, 0.69, -0.78).rotation.y = x < 0 ? 0.05 : -0.05; });
    c.box(1.6, 0.9, 0.08, MAT.darkwood, 0, 0.6, -1.05); for (var s = -0.65; s <= 0.65; s += 0.26) c.box(0.16, 0.5, 0.02, MAT.wood, s, 0.7, -1.0, { cast: false });
    c.box(0.5, 0.55, 0.45, MAT.darkwood, 1.1, 0.275, -0.9, { solid: true }); drawer(c, 0.42, 0.18, 0.02, 1.1, 0.4, -0.67); drawer(c, 0.42, 0.18, 0.02, 1.1, 0.17, -0.67);
    c.cyl(0.08, 0.06, 0.03, MAT.black, 1.1, 0.57, -0.9, 14); c.cyl(0.012, 0.012, 0.22, MAT.chrome, 1.1, 0.68, -0.9, 8); var sh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.14, 14, 1, true), new THREE.MeshStandardMaterial({ color: 0xf1e7c8, side: THREE.DoubleSide, emissive: 0xffe0a0, emissiveIntensity: 0.3 })); sh.position.set(1.1, 0.82, -0.9); c.add(sh); c.light(new THREE.PointLight(0xffe0a0, 0.3, 3), 1.1, 0.8, -0.9);
    c.box(0.1, 0.16, 0.06, MAT.black, 0.95, 0.63, -0.8); c.box(0.08, 0.05, 0.005, MAT.screen, 0.95, 0.66, -0.768, { cast: false }); c.box(0.12, 0.18, 0.03, colorMat(0x8a2a2a, 0.8), 1.25, 0.64, -0.95).rotation.z = 0.1;
    c.hit(1.8, 1.0, 2.3, 0, 0.5, 0, { kind: 'bed' });
    c.box(1.2, 0.02, 0.6, new THREE.MeshStandardMaterial({ map: TEX.fabric, color: 0x6a5a4a, roughness: 1 }), 0, 0.01, 1.4, { cast: false });
  }, after: function (c, P) { var v = growPropWorld('bed', 0, 0.3); world.bedSpot = { x: v.x, z: v.z, yaw: Math.PI + P.rot * Math.PI / 2 }; } });
  growDefProp('upBooks', { label: 'bookshelf', floor: 1, x: 4.0, z: -8.6, rot: 0, build: function (c) { bookshelfBuild(c, 1.6, 2.0, 4); } });
  growDefProp('windowSeat', { label: 'window seat', floor: 1, x: -2.0, z: ROOM.z - 0.5, rot: 0, build: function (c) { c.box(6.0, 0.45, 0.6, MAT.wood, 0, 0.225, 0, { solid: true }); c.box(6.0, 0.08, 0.6, fabricMat(0x3a5a3a), 0, 0.49, 0); for (var k = 0; k < 4; k++) { var cu = c.box(0.5, 0.14, 0.5, fabricMat([0xe0c25a, 0x6fdc8c, 0xd64a9a, 0x3ad0ff][k]), -2.2 + k * 1.4, 0.6, 0); cu.rotation.y = (k % 2 ? 0.2 : -0.15); } c.box(0.4, 0.03, 0.28, colorMat(0x8a2a2a, 0.8), 1.2, 0.545, 0.1, { cast: false }); } });
  growDefProp('upPlant1', { label: 'plant', floor: 1, x: -8.5, z: -8.3, build: function (c) { c.fern(0, 0, 1.2); } });
  growDefProp('upPlant2', { label: 'plant', floor: 1, x: 11.2, z: -8.3, build: function (c) { c.fern(0, 0, 1.2); } });
  growDefProp('upPlant3', { label: 'plant', floor: 1, x: 11.2, z: 5.0, build: function (c) { c.fern(0, 0, 1.2); } });
  growDefProp('upRug', { label: 'rug', floor: 1, x: -4, z: 0.5, rot: 0, build: function (c) { c.box(3.6, 0.02, 2.6, new THREE.MeshStandardMaterial({ map: TEX.fabric, color: 0x4a3b5c, roughness: 1 }), 0, 0.01, 0, { cast: false }); c.box(3.2, 0.005, 2.2, new THREE.MeshStandardMaterial({ map: TEX.fabric, color: 0x6a4f7a, roughness: 1 }), 0, 0.022, 0, { cast: false }); } });
  growDefProp('upDresser', { label: 'dresser', floor: 1, x: -11.4, z: 4.5, rot: 1, build: function (c) { c.box(1.2, 0.9, 0.5, MAT.darkwood, 0, 0.45, 0, { solid: true }); c.box(1.24, 0.04, 0.54, MAT.wood, 0, 0.92, 0, { cast: false }); for (var r = 0; r < 3; r++) for (var q = 0; q < 2; q++) drawer(c, 0.52, 0.22, 0.02, -0.29 + q * 0.58, 0.2 + r * 0.27, 0.24); c.box(0.5, 0.6, 0.03, MAT.darkwood, 0.2, 1.3, -0.2); c.box(0.44, 0.54, 0.005, new THREE.MeshPhysicalMaterial({ color: 0xdfe8f0, roughness: 0.05, metalness: 0.9 }), 0.2, 1.3, -0.18, { cast: false }); c.cyl(0.05, 0.04, 0.12, MAT.jar, -0.4, 1.0, 0, 12); c.box(0.2, 0.25, 0.02, colorMat(0x8a2a2a, 0.8), -0.35, 1.06, -0.15).rotation.z = 0.1; } });
  // ---- the second pass: what each of these was still missing ----
  function propExtra(id, fn) { var d = PROPS[id], b = d.build; d.build = function (c, P) { b(c, P); fn(c, P); }; }
  function warmStrip(c, w, x, y, z) { return c.box(w, 0.012, 0.02, emitMat(0xffe2b0, 1.2), x, y, z, { cast: false, sharp: true }); }
  propExtra('tabletDock', function (c) {
    [-0.232, 0.232].forEach(function (x) { c.box(0.018, 0.9, 0.31, MAT.alu, x, 0.47, 0.02, { cast: false }); });
    c.lit(0x6fdc8c, 0.4, 0.006, 0, 0.9, 0.173); c.lit(0x6fdc8c, 0.4, 0.006, 0, 0.12, 0.173);
    c.cyl(0.006, 0.006, 0.5, MAT.black, 0.17, 0.3, -0.16, 6); c.box(0.07, 0.11, 0.03, MAT.white, 0.17, 0.58, -0.175, { cast: false });
  });
  propExtra('cureShelf', function (c) {
    c.box(3.16, 0.07, 0.48, MAT.darkwood, 0, 2.335, 0.02); c.box(3.1, 0.04, 0.44, MAT.darkwood, 0, 2.285, 0.01, { cast: false }); c.box(3.06, 0.1, 0.4, MAT.darkwood, 0, 0.05, 0);
    [1.05, 1.6, 2.15].forEach(function (y) { warmStrip(c, 1.4, -0.75, y - 0.027, 0.16); warmStrip(c, 1.4, 0.75, y - 0.027, 0.16); }); warmStrip(c, 1.4, -0.75, 2.258, 0.16); warmStrip(c, 1.4, 0.75, 2.258, 0.16);
    [-1.5, 0, 1.5].forEach(function (x) { c.box(0.075, 2.2, 0.012, MAT.darkwood, x, 1.2, 0.206, { cast: false }); });
    var ring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.008, 8, 24), MAT.brass); ring.position.set(-1.3, 2.0, 0.214); c.add(ring);
  });
  propExtra('dryRack', function (c) {
    var hw = 3.25, ly = 2.1;
    c.box(hw * 2 - 0.9, 0.012, 0.8, new THREE.MeshStandardMaterial({ map: TEX.fabric, color: 0x3d342a, roughness: 1 }), 0, 0.006, 0, { cast: false, sharp: true });
    [-hw, hw].forEach(function (px) { c.box(0.13, 0.16, 0.13, MAT.gunmetal, px, ly - 0.02, 0, { r: 0.01 }); c.box(0.13, 0.12, 0.13, MAT.gunmetal, px, 0.12, 0, { r: 0.01 }); });
    for (var h = 0; h < 12; h++) { var hk = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.004, 6, 14, Math.PI * 1.5), MAT.chrome); hk.position.set(-hw + 0.3 + h * 0.55, ly - 0.05, 0); hk.rotation.y = Math.PI / 2; c.add(hk); }
    var dial = c.cyl(0.07, 0.07, 0.025, MAT.white, hw - 0.002, 1.5, 0.06, 24); dial.rotation.x = Math.PI / 2; var rim = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.008, 8, 24), MAT.brass); rim.position.set(hw - 0.002, 1.5, 0.075); c.add(rim); var nd = c.box(0.004, 0.05, 0.002, colorMat(0xc0271b, 0.5), hw + 0.008, 1.51, 0.075, { cast: false, sharp: true }); nd.rotation.z = -0.6;
  });
  propExtra('dryTable', function (c) {
    c.box(0.84, 0.03, 0.54, MAT.wood, 0, 0.25, 0, { cast: false }); c.box(0.5, 0.1, 0.02, MAT.darkwood, 0, 0.7, 0.29); c.box(0.12, 0.015, 0.02, MAT.chrome, 0, 0.7, 0.306, { cast: false });
    c.cyl(0.13, 0.13, 0.012, MAT.chrome, 0, 0.843, 0, 28); c.cyl(0.03, 0.04, 0.012, MAT.gunmetal, 0, 0.836, 0, 12); c.lit(0x6fdc8c, 0.07, 0.022, 0, 0.8665, 0.15, 0, -Math.PI / 2);
    c.box(0.3, 0.2, 0.3, colorMat(0xc8a97a, 1), -0.22, 0.365, 0); for (var j = 0; j < 3; j++) { c.cyl(0.05, 0.05, 0.12, MAT.jar, 0.08 + j * 0.13, 0.325, 0.05, 14); c.cyl(0.052, 0.052, 0.014, MAT.jarLid, 0.08 + j * 0.13, 0.392, 0.05, 14); }
    var roll = c.cyl(0.045, 0.045, 0.2, colorMat(0xf4f4f0, 0.5, 0, { transparent: true, opacity: 0.85 }), -0.3, 0.855, -0.2, 16); roll.rotation.z = Math.PI / 2;
    var sc1 = c.box(0.012, 0.004, 0.13, MAT.chrome, 0.1, 0.808, 0.2, { cast: false }); sc1.rotation.y = 0.5; var sc2 = c.box(0.012, 0.004, 0.13, MAT.chrome, 0.11, 0.81, 0.2, { cast: false }); sc2.rotation.y = 0.2; [0.06, 0.1].forEach(function (x) { var lp = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.004, 6, 12), colorMat(0xd0201a, 0.5)); lp.rotation.x = Math.PI / 2; lp.position.set(x + 0.02, 0.81, 0.265); c.add(lp); });
  });
  propExtra('jarBoxes', function (c) {
    var tape = colorMat(0xd9c28a, 0.45), bxM = colorMat(0xc8a97a, 1);
    [[0.3, 0, 0.42], [0.3, 0, 0]].forEach(function (b) { c.box(0.06, 0.004, 0.53, tape, b[0], 0.418 + b[2], b[1], { cast: false, sharp: true }); c.box(0.06, 0.12, 0.004, tape, b[0], 0.36 + b[2], b[1] + 0.262, { cast: false, sharp: true }); });
    [-1, 1].forEach(function (sd) { var fl = c.box(0.5, 0.008, 0.24, bxM, -0.3, 0.47, sd * 0.33); fl.rotation.x = sd * 0.95; var f2 = c.box(0.24, 0.008, 0.5, bxM, -0.3 + sd * 0.33, 0.47, 0); f2.rotation.z = -sd * 0.95; });
    for (var i = 0; i < 9; i++) { c.cyl(0.06, 0.06, 0.03, MAT.jar, -0.45 + (i % 3) * 0.15, 0.4, -0.15 + Math.floor(i / 3) * 0.15, 14); c.cyl(0.062, 0.062, 0.014, MAT.jarLid, -0.45 + (i % 3) * 0.15, 0.424, -0.15 + Math.floor(i / 3) * 0.15, 14); }
  });
  propExtra('hose', function (c) {
    c.box(0.5, 1.0, 0.02, MAT.gunmetal, -0.15, 1.05, -0.52, { cast: false }); [[-0.35, 0.62], [0.05, 0.62], [-0.35, 1.48], [0.05, 1.48]].forEach(function (p) { c.cyl(0.012, 0.012, 0.012, MAT.chrome, p[0], p[1], -0.506, 8).rotation.x = Math.PI / 2; }); [0.85, 1.35].forEach(function (y) { c.box(0.03, 0.03, 0.5, MAT.gunmetal, -0.15, y, -0.27, { cast: false }); });
    c.box(0.62, 0.02, 0.44, MAT.gunmetal, 0.42, 0.01, 0.1, { cast: false }); c.box(0.62, 0.03, 0.015, MAT.gunmetal, 0.42, 0.025, 0.32, { cast: false }); c.box(0.62, 0.03, 0.015, MAT.gunmetal, 0.42, 0.025, -0.12, { cast: false });
    c.cyl(0.015, 0.015, 0.22, colorMat(0xb87333, 0.3, 1), -0.15, 0.45, -0.4, 10).rotation.x = Math.PI / 2; c.cyl(0.015, 0.015, 0.45, colorMat(0xb87333, 0.3, 1), -0.15, 0.225, -0.5, 10);
    c.box(0.22, 0.006, 0.22, MAT.black, -0.15, 0.064, 0.0, { cast: false, sharp: true });
  });
  propExtra('fan', function (c) {
    c.cyl(0.022, 0.022, 0.02, MAT.chrome, -0.1, 0.05, 0.1, 12); c.lit(0x6fdc8c, 0.012, 0.012, 0.1, 0.0665, 0.1, 0, -Math.PI / 2);
    var cord = c.cyl(0.006, 0.006, 0.5, MAT.black, 0, 0.008, -0.4, 6); cord.rotation.x = Math.PI / 2;
  });
  propExtra('soilSacks', function (c) {
    c.box(0.07, 0.008, 0.14, MAT.steel, 0.55, 0.287, 0.04, { cast: false }); var th = c.cyl(0.014, 0.012, 0.13, MAT.wood, 0.55, 0.296, -0.09, 10); th.rotation.x = Math.PI / 2;
    var heap = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), MAT.soil); heap.scale.set(1, 0.35, 0.8); heap.position.set(0, 0.575, 0); c.add(heap);
    [[0, 0.3, -0.2], [0.55, 0, 0.3]].forEach(function (b) { var seam = c.box(0.02, 0.26, 0.33, colorMat(0x7a5634, 1), b[0] + 0.235, 0.14 + b[1], 0, { cast: false, sharp: true }); seam.rotation.y = b[2]; });
  });
  propExtra('bucket', function (c) {
    c.cyl(0.014, 0.014, 0.1, MAT.white, 0, 0.46, 0, 10).rotation.z = Math.PI / 2; [0.1, 0.22].forEach(function (y) { var rb = new THREE.Mesh(new THREE.TorusGeometry(0.14 + y * 0.09, 0.005, 6, 28), colorMat(0x255f2a, 0.6)); rb.rotation.x = Math.PI / 2; rb.position.y = y; c.add(rb); });
    c.box(0.1, 0.04, 0.07, colorMat(0xf2d24a, 0.95), 0.27, 0.02, 0.08, { r: 0.012 }); var br = c.box(0.14, 0.03, 0.05, MAT.wood, 0.24, 0.04, -0.1); br.rotation.y = 0.5; var bs = c.box(0.13, 0.025, 0.045, colorMat(0xe8e0c8, 1), 0.24, 0.0125, -0.1, { cast: false, sharp: true }); bs.rotation.y = 0.5;
  });
  propExtra('potShelf', function (c) {
    [-0.7, 0.7].forEach(function (a) { var br = c.box(0.02, 1.55, 0.015, MAT.metal, 0, 0.85, -0.14, { cast: false }); br.rotation.z = a; });
    [-0.55, 0.55].forEach(function (x) { c.box(0.08, 0.015, 0.32, MAT.black, x, 0.0075, 0, { cast: false }); });
    c.box(0.3, 0.05, 0.2, MAT.black, 0.03, 0.44, 0.03); c.box(0.27, 0.01, 0.17, MAT.soil, 0.03, 0.462, 0.03, { cast: false, sharp: true });
    for (var i = 0; i < 8; i++) { var sx = -0.075 + (i % 4) * 0.07, sz = -0.01 + Math.floor(i / 4) * 0.08; c.cyl(0.003, 0.003, 0.04, MAT.stem, sx, 0.485, sz, 5); leafAt(LEAF_GEO_SM, MAT.leaf, sx, 0.5, sz, i * 1.3, 0.9, 0.22, c.group); leafAt(LEAF_GEO_SM, MAT.leaf, sx, 0.5, sz, i * 1.3 + Math.PI, 0.9, 0.22, c.group); }
    [-0.4, 0, 0.4].forEach(function (x) { c.box(0.1, 0.035, 0.002, MAT.white, x, 1.0, 0.162, { cast: false, sharp: true }); });
  });
  function lobbyBenchExtra(c) {
    var iron = colorMat(0x2a2d33, 0.4, 0.6);
    [-0.65, 0.65].forEach(function (x) { c.box(0.075, 0.032, 0.46, MAT.wood, x, 0.815, 0.0, { r: 0.012 }); c.box(0.05, 0.25, 0.05, iron, x, 0.675, 0.19); c.box(0.07, 0.02, 0.54, iron, x, 0.01, 0, { cast: false }); var sc = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 8, 18, Math.PI), iron); sc.position.set(x, 0.3, 0); sc.rotation.y = Math.PI / 2; c.add(sc); });
    c.box(1.26, 0.035, 0.035, iron, 0, 0.3, 0.0, { cast: false }); c.box(1.6, 0.05, 0.035, MAT.wood, 0, 1.06, -0.245, { r: 0.012 });
    for (var b = 0; b < 3; b++) [-0.5, 0, 0.5].forEach(function (x) { c.cyl(0.008, 0.008, 0.008, MAT.brass, x, 0.72 + b * 0.12, -0.182 - b * 0.02, 8).rotation.x = Math.PI / 2; });
  }
  propExtra('lobbyBenchL', lobbyBenchExtra); propExtra('lobbyBenchR', lobbyBenchExtra);
  propExtra('magTable', function (c) {
    c.cyl(0.24, 0.24, 0.02, MAT.wood, 0, 0.2, 0, 24); var rim = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.01, 8, 40), MAT.brass); rim.rotation.x = Math.PI / 2; rim.position.y = 0.455; c.add(rim);
    c.cyl(0.05, 0.04, 0.07, MAT.ceramic, 0.17, 0.5, 0.15, 16); c.cyl(0.044, 0.044, 0.01, MAT.soil, 0.17, 0.532, 0.15, 12); for (var i = 0; i < 7; i++) leafAt(LEAF_GEO_SM, MAT.bigleaf, 0.17, 0.535, 0.15, i * 0.9, 0.5 + (i % 3) * 0.2, 0.2, c.group);
    var mg = c.box(0.28, 0.008, 0.2, colorMat(0x7cc4ff, 0.6), 0.02, 0.215, 0.03, { cast: false }); mg.rotation.y = -0.4; var mg2 = c.box(0.28, 0.008, 0.2, colorMat(0xe05a8a, 0.6), -0.02, 0.224, 0.0, { cast: false }); mg2.rotation.y = 0.2;
  });
  propExtra('storeRack', function (c) {
    var guard = colorMat(0xf2c21a, 0.5, 0.2);
    [-1.5, 0, 1.5].forEach(function (x) { [-0.26, 0.26].forEach(function (z) { c.box(0.13, 0.012, 0.13, MAT.gunmetal, x, 0.006, z, { cast: false }); [[-0.04, -0.04], [0.04, 0.04]].forEach(function (b) { c.cyl(0.008, 0.008, 0.008, MAT.chrome, x + b[0], 0.016, z + b[1], 6); }); }); });
    [-1.5, 1.5].forEach(function (x) { c.box(0.11, 0.4, 0.05, guard, x, 0.2, 0.31, { r: 0.012 }); c.box(0.112, 0.06, 0.052, MAT.black, x, 0.3, 0.31, { cast: false, sharp: true }); c.box(0.112, 0.06, 0.052, MAT.black, x, 0.14, 0.31, { cast: false, sharp: true }); });
    for (var w = 0; w <= 24; w++) c.box(0.008, 2.2, 0.008, MAT.gunmetal, -1.5 + w * 0.125, 1.15, -0.3, { cast: false, sharp: true }); for (var hz = 0; hz < 9; hz++) c.box(3.0, 0.008, 0.008, MAT.gunmetal, 0, 0.15 + hz * 0.26, -0.3, { cast: false, sharp: true });
  });
  propExtra('cellarHatch', function (c) {
    var yel = colorMat(0xf2c21a, 0.6), blk = colorMat(0x17181a, 0.7);
    for (var i = 0; i < 8; i++) { var m = i % 2 ? blk : yel, o = -0.56 + i * 0.16; c.box(0.16, 0.006, 0.08, m, o, 0.044, 0.6, { cast: false, sharp: true }); c.box(0.08, 0.006, 0.16, m, -0.6, 0.044, o, { cast: false, sharp: true }); c.box(0.08, 0.006, 0.16, m, 0.6, 0.044, o, { cast: false, sharp: true }); }
    [-0.4, 0.4].forEach(function (x) { var lp = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.022, 8, 16, Math.PI), yel); lp.position.set(x, 1.1, -0.51); lp.rotation.y = Math.PI / 2; c.add(lp); c.cyl(0.022, 0.022, 1.1, yel, x, 0.55, -0.6, 8); c.box(0.14, 0.04, 0.07, MAT.gunmetal, x, 0.06, -0.63, { cast: false }); });
    for (var r = 0; r < 3; r++) for (var t = 0; t < 5; t++) c.box(0.1, 0.004, 0.032, blk, -0.3 + t * 0.15, 0.137 + r * 0.3, -0.42, { cast: false, sharp: true });
    var strut = c.cyl(0.012, 0.012, 0.7, MAT.chrome, 0.56, 0.4, -0.35, 8); strut.rotation.x = 0.75;
  });
  propExtra('cigCabinet', function (c) {
    var door = colorMat(0x353a41, 0.5, 0.5);
    warmStrip(c, 1.08, 0, 1.822, 0.245); c.box(1.2, 0.09, 0.012, MAT.steel, 0, 0.045, 0.206, { cast: false });
    [-0.29, 0.29].forEach(function (x) { c.box(0.55, 0.28, 0.014, door, x, 0.265, 0.206, { cast: false, r: 0.006 }); c.box(0.014, 0.12, 0.02, MAT.chrome, x - Math.sign(x) * 0.22, 0.27, 0.224, { cast: false }); });
    c.cyl(0.014, 0.014, 0.012, MAT.brass, 0, 0.36, 0.215, 12).rotation.x = Math.PI / 2;
    [-0.612, 0.612].forEach(function (x) { c.box(0.008, 1.5, 0.05, MAT.brass, x + Math.sign(x) * 0.018, 1.15, 0.18, { cast: false }); });
    c.sign(['18+', 'ID on request'], 0.26, 0.09, 0.4, 0.47, 0.214, 0, { size: 16, bg: '#f3e9cf', color: '#222', titleColor: '#c9302c', line: 'rgba(0,0,0,.25)' });
  });
  propExtra('procShelf', function (c) {
    var shelfM = colorMat(0x8a8f96, 0.35, 0.8);
    [[-0.78, -0.2], [0.78, -0.2], [-0.78, 0.2], [0.78, 0.2]].forEach(function (p) { c.cyl(0.035, 0.035, 0.03, MAT.black, p[0], 0.035, p[1], 12).rotation.z = Math.PI / 2; c.box(0.05, 0.03, 0.05, MAT.gunmetal, p[0], 0.08, p[1], { cast: false }); });
    for (var s = 0; s < 4; s++) { c.box(1.6, 0.045, 0.012, shelfM, 0, 0.31 + s * 0.5, 0.228, { cast: false }); c.box(0.2, 0.03, 0.002, MAT.white, -0.5 + s * 0.3, 0.31 + s * 0.5, 0.236, { cast: false, sharp: true }); }
    [-0.7, 0.7].forEach(function (a) { var br = c.box(0.015, 1.9, 0.01, shelfM, 0, 0.95, -0.215, { cast: false }); br.rotation.z = a * 0.95; });
    c.box(0.2, 0.28, 0.008, colorMat(0x5a4632, 0.7), 0.805, 1.3, 0.0, { cast: false }).rotation.y = Math.PI / 2; c.box(0.17, 0.22, 0.002, MAT.white, 0.811, 1.29, 0.0, { cast: false, sharp: true }).rotation.y = Math.PI / 2; c.box(0.02, 0.025, 0.07, MAT.chrome, 0.812, 1.425, 0, { cast: false });
  });
  propExtra('guardBoard', function (c) {
    [[0, 2.065, 1.06, 0.03], [0, 1.335, 1.06, 0.03]].forEach(function (f) { c.box(f[2], f[3], 0.035, MAT.alu, f[0], f[1], 0.005, { cast: false }); }); [-0.515, 0.515].forEach(function (x) { c.box(0.03, 0.76, 0.035, MAT.alu, x, 1.7, 0.005, { cast: false }); });
    c.box(0.5, 0.02, 0.09, MAT.alu, 0, 1.22, 0.045); c.box(0.5, 0.06, 0.008, MAT.alu, 0, 1.25, 0.088, { cast: false }); [[-0.15, 0x6fdc8c], [0.0, 0xffc857], [0.15, 0x7cc4ff]].forEach(function (l) { c.box(0.11, 0.16, 0.012, colorMat(l[1], 0.8), l[0], 1.31, 0.05, { cast: false }).rotation.x = -0.15; });
  });
  function bookshelfExtra(w, h) { return function (c) {
    c.box(w + 0.1, 0.05, 0.38, MAT.darkwood, 0, h + 0.025, 0.02, { r: 0.012 }); c.box(w + 0.05, 0.035, 0.35, MAT.darkwood, 0, h - 0.015, 0.012, { cast: false }); c.box(w + 0.04, 0.1, 0.02, MAT.darkwood, 0, 0.05, 0.16, { cast: false });
    [-1, 1].forEach(function (sd) { c.box(0.07, h - 0.1, 0.012, MAT.darkwood, sd * (w / 2 - 0.03), h / 2, 0.156, { cast: false }); });
    c.box(w - 0.14, 0.012, 0.02, emitMat(0xffe2b0, 1.0), 0, h - 0.075, 0.12, { cast: false, sharp: true });
    c.cyl(0.05, 0.04, 0.07, MAT.ceramic, -w / 2 + 0.2, h + 0.085, 0.02, 16); for (var i = 0; i < 7; i++) leafAt(LEAF_GEO_SM, MAT.bigleaf, -w / 2 + 0.2, h + 0.12, 0.02, i * 0.9, 0.5 + (i % 3) * 0.2, 0.26, c.group);
    c.box(0.2, 0.03, 0.14, colorMat(0x8a2a2a, 0.8), w / 2 - 0.25, h + 0.065, 0.02).rotation.y = 0.3; c.box(0.18, 0.025, 0.13, colorMat(0x2f6b9a, 0.8), w / 2 - 0.25, h + 0.093, 0.02).rotation.y = -0.1;
  }; }
  propExtra('bookshelf', bookshelfExtra(1.0, 1.8)); propExtra('upBooks', bookshelfExtra(1.6, 2.0));
  propExtra('lobbyCoffee', function (c) {
    if (!S.upgrades.lobby) return;
    var door = colorMat(0x2a1c10, 0.6);
    [-0.147, 0.147].forEach(function (x) { c.box(0.275, 0.72, 0.014, door, x, 0.5, 0.256, { cast: false, r: 0.006 }); c.box(0.012, 0.14, 0.02, MAT.chrome, x - Math.sign(x) * 0.1, 0.62, 0.272, { cast: false }); }); c.box(0.6, 0.08, 0.012, MAT.black, 0, 0.04, 0.256, { cast: false });
    var wand = c.cyl(0.006, 0.006, 0.15, MAT.chrome, -0.215, 1.08, 0.06, 8); wand.rotation.z = 0.22; c.cyl(0.012, 0.012, 0.02, MAT.black, -0.2, 1.15, 0.06, 10); c.cyl(0.009, 0.007, 0.02, MAT.chrome, -0.232, 1.0, 0.06, 8);
    [-0.182, 0.182].forEach(function (x) { for (var v = 0; v < 5; v++) c.box(0.004, 0.01, 0.2, MAT.black, x, 1.2 + v * 0.03, -0.06, { cast: false, sharp: true }); });
    c.box(0.13, 0.06, 0.1, MAT.gunmetal, -0.22, 0.97, -0.14, { r: 0.008 }); for (var s = 0; s < 5; s++) { var st = c.cyl(0.003, 0.003, 0.11, MAT.wood, -0.26 + s * 0.02, 1.03, -0.14, 5); st.rotation.z = (s - 2) * 0.08; }
  });
  propExtra('vending', function (c) {
    var dark = colorMat(0x1a1d21, 0.6);
    c.box(0.012, 1.3, 0.02, emitMat(0xeaf6ff, 1.3), -0.405, 1.12, 0.27, { cast: false, sharp: true });
    c.box(0.012, 1.78, 0.012, MAT.chrome, 0.19, 1.03, 0.362, { cast: false }); c.box(0.99, 0.02, 0.02, MAT.chrome, 0, 1.935, 0.37, { cast: false });
    c.box(0.11, 0.15, 0.03, MAT.gloss, 0.315, 0.74, 0.368, { cast: false, r: 0.008 }); c.lit(0x39a0ff, 0.07, 0.05, 0.315, 0.765, 0.3845); c.lit(0x6fdc8c, 0.07, 0.008, 0.315, 0.69, 0.3845);
    for (var v = 0; v < 8; v++) { c.box(0.004, 0.014, 0.34, dark, 0.477, 0.3 + v * 0.045, 0, { cast: false, sharp: true }); c.box(0.004, 0.014, 0.34, dark, -0.477, 0.3 + v * 0.045, 0, { cast: false, sharp: true }); }
    [[-0.4, -0.3], [0.4, -0.3], [-0.4, 0.3], [0.4, 0.3]].forEach(function (p) { c.box(0.1, 0.012, 0.1, MAT.black, p[0], 0.006, p[1] * 1.15, { cast: false, sharp: true }); });
    c.box(0.56, 0.035, 0.012, MAT.chrome, -0.13, 0.575, 0.362, { cast: false }); c.sign(['take it from the tray'], 0.4, 0.04, -0.13, 0.26, 0.362, 0, { size: 14, bg: '#1a1d21', titleColor: '#cfd6dc', line: 'rgba(0,0,0,0)' });
  });
  propExtra('goodsShelf', function (c) {
    var w = goodsWidth(); [1.3, 1.86].forEach(function (y) { warmStrip(c, w - 0.2, 0, y - 0.026, 0.14); }); warmStrip(c, w - 0.2, 0, 1.99, 0.14);
    [-1, 1].forEach(function (s) { c.box(0.012, 1.9, 0.012, MAT.brass, s * (w / 2 + 0.002), 1.0, 0.31, { cast: false }); });
  });
  propExtra('vipTable', function (c) {
    var brass = colorMat(0xc9a24a, 0.35, 0.8), plush = colorMat(0x6e2a4a, 0.95);
    var rim = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.012, 8, 44), brass); rim.rotation.x = Math.PI / 2; rim.position.y = 0.625; c.add(rim);
    c.box(3.3, 0.012, 1.9, new THREE.MeshStandardMaterial({ map: TEX.fabric, color: 0x2a1420, roughness: 1 }), 0, 0.006, 0, { cast: false, sharp: true }); c.box(3.0, 0.004, 1.6, new THREE.MeshStandardMaterial({ map: TEX.fabric, color: 0x4a2034, roughness: 1 }), 0, 0.014, 0, { cast: false, sharp: true });
    [-0.95, 0.95].forEach(function (x) { var sd = x > 0 ? 1 : -1; c.box(0.5, 0.1, 0.5, plush, x - sd * 0.06, 0.5, 0, { r: 0.04 }); var bc = c.box(0.1, 0.4, 0.48, plush, x + sd * 0.215, 0.76, 0, { r: 0.04 }); for (var b = 0; b < 4; b++) c.cyl(0.012, 0.012, 0.012, brass, x + sd * 0.16, 0.68 + Math.floor(b / 2) * 0.18, -0.12 + (b % 2) * 0.24, 8).rotation.z = Math.PI / 2; [-0.32, 0.32].forEach(function (z) { c.box(0.62, 0.02, 0.13, brass, x, 0.74, z, { cast: false, r: 0.008 }); }); });
    [[-0.28, 0.12], [0.26, -0.14]].forEach(function (g) { c.cyl(0.045, 0.045, 0.006, MAT.black, g[0], 0.648, g[1], 16); c.cyl(0.032, 0.026, 0.085, MAT.jar, g[0], 0.693, g[1], 14); c.cyl(0.028, 0.024, 0.03, colorMat(0xd9a23a, 0.3, 0, { transparent: true, opacity: 0.8 }), g[0], 0.667, g[1], 12); });
    c.cyl(0.06, 0.05, 0.02, MAT.gunmetal, 0.02, 0.655, -0.25, 16);
  });
  propExtra('hallClockTable', function (c) {
    c.box(0.4, 0.1, 0.014, MAT.darkwood, 0, 0.63, 0.247, { cast: false, r: 0.006 }); c.cyl(0.012, 0.012, 0.02, MAT.brass, 0, 0.63, 0.262, 10).rotation.x = Math.PI / 2;
    var ck = c.cyl(0.055, 0.055, 0.035, MAT.brass, 0.13, 0.785, 0.14, 24); ck.rotation.x = Math.PI / 2; var cf = c.cyl(0.046, 0.046, 0.004, MAT.white, 0.13, 0.785, 0.159, 24); cf.rotation.x = Math.PI / 2; var h1 = c.box(0.004, 0.035, 0.002, MAT.black, 0.13, 0.797, 0.162, { cast: false, sharp: true }); var h2 = c.box(0.003, 0.028, 0.002, MAT.black, 0.141, 0.785, 0.162, { cast: false, sharp: true }); h2.rotation.z = Math.PI / 2; c.box(0.09, 0.012, 0.04, MAT.brass, 0.13, 0.726, 0.14, { cast: false });
    [[0.3, 0x8a2a2a], [0.26, 0x2f6b9a], [0.22, 0xe0c25a]].forEach(function (b, i) { c.box(b[0], 0.035, 0.2, colorMat(b[1], 0.85), 0.02, 0.284 + i * 0.036, 0, { cast: false }).rotation.y = (i - 1) * 0.15; });
  });
  propExtra('dining', function (c) {
    [-0.38, 0.38].forEach(function (z) { c.box(1.38, 0.08, 0.03, MAT.darkwood, 0, 0.675, z, { cast: false }); }); [-0.72, 0.72].forEach(function (x) { c.box(0.03, 0.08, 0.74, MAT.darkwood, x, 0.675, 0, { cast: false }); });
    c.box(1.62, 0.004, 0.3, fabricMat(0xefe6d2), 0, 0.779, 0, { cast: false, sharp: true });
    [-0.35, 0.35].forEach(function (x) { var rng = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.006, 6, 28), colorMat(0x2f6b9a, 0.4)); rng.rotation.x = Math.PI / 2; rng.position.set(x, 0.794, 0); c.add(rng); c.box(0.1, 0.012, 0.1, fabricMat(0x3a5a3a), x - 0.3, 0.786, 0.22, { cast: false }).rotation.y = 0.4; });
    c.cyl(0.018, 0.016, 0.06, MAT.white, 0.13, 0.808, 0.12, 10); c.cyl(0.018, 0.016, 0.06, colorMat(0x3a3a3a, 0.5), 0.17, 0.808, 0.1, 10); c.cyl(0.019, 0.019, 0.012, MAT.chrome, 0.13, 0.842, 0.12, 10); c.cyl(0.019, 0.019, 0.012, MAT.chrome, 0.17, 0.842, 0.1, 10);
    c.box(0.34, 0.02, 0.2, MAT.wood, -0.02, 0.79, -0.26, { cast: false, r: 0.008 }).rotation.y = 0.2; var loaf = c.box(0.2, 0.08, 0.1, colorMat(0xb8793a, 0.9), -0.02, 0.84, -0.26, { r: 0.04 }); loaf.rotation.y = 0.2;
    c.box(2.6, 0.012, 2.4, new THREE.MeshStandardMaterial({ map: TEX.fabric, color: 0x3d4a3a, roughness: 1 }), 0, 0.006, 0, { cast: false, sharp: true });
  });
  propExtra('couchUp', function (c) {
    c.box(0.45, 0.04, 0.45, MAT.wood, 1.6, 0.55, -0.1, { r: 0.012 }); legs4({ box: function (a, b, e, m, px, py, pz) { return c.box(a, b, e, m, px + 1.6, py, pz - 0.1); } }, 0.45, 0.45, 0.53, MAT.darkwood, 0.05, 0.035);
    c.cyl(0.06, 0.045, 0.09, MAT.ceramic, 1.6, 0.615, -0.1, 16); for (var i = 0; i < 9; i++) leafAt(LEAF_GEO_SM, MAT.bigleaf, 1.6, 0.66, -0.1, i * 0.7, 0.4 + (i % 3) * 0.22, 0.34, c.group);
    for (var f = 0; f < 30; f++) { c.box(0.012, 0.004, 0.09, colorMat(0xd8c9a8, 1), -2.2 + f * 0.152, 0.006, 3.24, { cast: false, sharp: true }); c.box(0.012, 0.004, 0.09, colorMat(0xd8c9a8, 1), -2.2 + f * 0.152, 0.006, -0.44, { cast: false, sharp: true }); }
    c.solid(1.35, 1.85, -0.35, 0.15);
  });
  propExtra('bed', function (c) {
    c.box(1.72, 0.06, 0.13, MAT.wood, 0, 1.08, -1.05, { r: 0.02 }); c.box(1.64, 0.5, 0.06, MAT.darkwood, 0, 0.27, 1.07, { r: 0.012 }); c.box(1.7, 0.05, 0.09, MAT.wood, 0, 0.54, 1.07, { r: 0.015 });
    c.box(1.57, 0.035, 0.42, fabricMat(0xe0c25a), 0, 0.787, 0.76, { r: 0.015 }); c.box(1.58, 0.1, 0.03, fabricMat(0xe0c25a), 0, 0.73, 1.0, { cast: false });
    [-0.34, 0.34].forEach(function (x) { c.box(0.5, 0.1, 0.34, fabricMat(0x3a6a4a), x, 0.79, -0.6, { r: 0.045 }).rotation.x = 0.5; });
    c.box(0.55, 0.02, 0.5, MAT.wood, 1.1, 0.558, -0.9, { cast: false });
    [-0.34, -0.16].forEach(function (x, i) { var sl = c.box(0.1, 0.05, 0.26, fabricMat(0x8a4a2a), x, 0.045, 1.35, { r: 0.022 }); sl.rotation.y = i ? 0.08 : -0.12; c.box(0.1, 0.04, 0.12, fabricMat(0x6e3a20), x + (i ? 0.005 : -0.008), 0.075, 1.28, { r: 0.018 }).rotation.y = i ? 0.08 : -0.12; });
  });
  propExtra('windowSeat', function (c) {
    for (var i = 0; i < 6; i++) { c.box(0.9, 0.3, 0.014, MAT.darkwood, -2.5 + i * 1.0, 0.245, 0.306, { cast: false, r: 0.008 }); c.cyl(0.014, 0.014, 0.02, MAT.brass, -2.5 + i * 1.0, 0.33, 0.32, 10).rotation.x = Math.PI / 2; }
    c.box(6.02, 0.07, 0.02, MAT.darkwood, 0, 0.035, 0.31, { cast: false }); c.box(6.04, 0.025, 0.64, MAT.wood, 0, 0.455, 0.0, { cast: false });
    [-2, -1, 0, 1, 2].forEach(function (x) { c.box(0.012, 0.082, 0.6, fabricMat(0x2f4a30), x, 0.49, 0, { cast: false, sharp: true }); }); c.box(6.0, 0.02, 0.02, fabricMat(0x2f4a30), 0, 0.52, 0.295, { cast: false });
    c.box(0.5, 0.09, 0.36, fabricMat(0xc9b28a), 2.7, 0.575, 0.0, { r: 0.03 }); c.box(0.5, 0.05, 0.36, fabricMat(0xb89a6e), 2.7, 0.64, 0.0, { r: 0.022 });
    c.cyl(0.04, 0.035, 0.09, colorMat(0x6fdc8c, 0.5), 1.55, 0.575, 0.12, 14);
  });
  propExtra('upRug', function (c) {
    var cream = new THREE.MeshStandardMaterial({ map: TEX.fabric, color: 0xd8c9a8, roughness: 1 });
    [-1.0, 1.0].forEach(function (z) { c.box(3.0, 0.004, 0.035, cream, 0, 0.026, z, { cast: false, sharp: true }); }); [-1.5, 1.5].forEach(function (x) { c.box(0.035, 0.004, 2.035, cream, x, 0.026, 0, { cast: false, sharp: true }); });
    var dia = c.box(0.9, 0.004, 0.9, cream, 0, 0.0255, 0, { cast: false, sharp: true }); dia.rotation.y = Math.PI / 4; var di2 = c.box(0.72, 0.004, 0.72, new THREE.MeshStandardMaterial({ map: TEX.fabric, color: 0x6a4f7a, roughness: 1 }), 0, 0.027, 0, { cast: false, sharp: true }); di2.rotation.y = Math.PI / 4;
    for (var f = 0; f < 26; f++) [-1.85, 1.85].forEach(function (x) { c.box(0.1, 0.004, 0.014, cream, x, 0.006, -1.25 + f * 0.1, { cast: false, sharp: true }); });
  });
  propExtra('upDresser', function (c) {
    c.box(1.23, 0.07, 0.53, MAT.black, 0, 0.035, 0, { cast: false });
    [-0.055, 0.455].forEach(function (x) { c.box(0.015, 0.62, 0.035, MAT.brass, x, 1.3, -0.195, { cast: false }); }); [0.995, 1.605].forEach(function (y) { c.box(0.525, 0.015, 0.035, MAT.brass, 0.2, y, -0.195, { cast: false }); });
    c.box(0.3, 0.014, 0.2, MAT.brass, 0.3, 0.947, 0.1, { cast: false, r: 0.006 }); [[0.22, 0xe05a8a, 0.09], [0.3, 0x7cc4ff, 0.12], [0.38, 0xf0b94d, 0.07]].forEach(function (b) { c.cyl(0.022, 0.026, b[2], colorMat(b[1], 0.15, 0, { transparent: true, opacity: 0.8 }), b[0], 0.954 + b[2] / 2, 0.1, 12); c.cyl(0.01, 0.01, 0.025, MAT.brass, b[0], 0.966 + b[2], 0.1, 8); });
    c.box(0.22, 0.05, 0.16, colorMat(0x3a2418, 0.6), -0.1, 0.965, 0.12, { r: 0.012 });
  });
