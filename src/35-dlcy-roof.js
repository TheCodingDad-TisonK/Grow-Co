//@ the Roof Greenhouse, more of it: rain barrels with drip lines, two beehives and the honey they make
  // ── Roof Greenhouse: barrels and hives ──
  // Both are upgrades of the DLC, so they stand on the roof only once they are bought. The barrels fill in the rain and drain
  // into the beds: a watered bed grows as fast as it does in the rain. The hives lift what a bed gives and make honey, which
  // sells from the cabinet or goes into the lab's gummies and chocolate in place of a baking mix.
  var ROOFX = { drain: 0.012, fill: 0.5, jars: 12, take: 6, bx: -3.3, bz: -1.8, hx: -7.9, hz: -3.2 };
  CIG_SKUS.honey = { name: 'Roof honey', type: 'honey', shape: 'jar', dlc: 'greenhouse', size: 1, price: 9, col: 0xd99a1e, top: 0xfff3c8 };
  var roofx = { barrels: null, hives: null, hits: [], obs: [], scr: null, level: null, bees: [], t: 0, syncT: 0 };
  function roofxState() { return dlcState('roofkit', { water: 60, honey: 0 }); }
  function roofWatered() { return dlcHas('greenhouse', 'barrels') && roofxState().water > 1; }
  function roofGrams() { return dlcHas('greenhouse', 'hives') ? 30 : 25; }
  function roofQBonus() { return dlcHas('greenhouse', 'vents') ? 12 : 0; }
  function productHoneyJar(K, s) {
    var G = new THREE.Group(), glass = new THREE.MeshPhysicalMaterial({ color: 0xe0a028, transparent: true, opacity: 0.9, roughness: 0.12 });
    var body = new THREE.Mesh(roundCylGeo(0.024 * s, 0.022 * s, 0.06 * s, 16), glass); body.castShadow = true; G.add(body);
    var lid = new THREE.Mesh(roundCylGeo(0.025 * s, 0.025 * s, 0.012 * s, 16), MAT.brass); lid.position.y = 0.036 * s; G.add(lid);
    var lab = new THREE.Mesh(new THREE.CylinderGeometry(0.0245 * s, 0.0245 * s, 0.028 * s, 16, 1, true, -0.9, 1.8), new THREE.MeshBasicMaterial({ map: signTex(['HONEY', 'from the roof'], 180, 90, { size: 30, bg: '#fff3c8', color: '#5a3a0a', titleColor: '#5a3a0a', line: 'rgba(0,0,0,0)' }) })); G.add(lab);
    return G;
  }
  function roofExtrasSync() {   // what is bought stands on the roof; what is not is out of the way, hit boxes and all
    var gh = dlcOn('greenhouse'), hasB = gh && dlcOwns('greenhouse', 'barrels'), hasH = gh && dlcOwns('greenhouse', 'hives');
    if (roofx.barrels) roofx.barrels.visible = hasB; if (roofx.hives) roofx.hives.visible = hasH;
    roofx.hits.forEach(function (h) { var on = h.userData.interact.kind === 'roofBarrel' ? hasB : hasH; h.position.y = on ? h.userData.homeY : -300; });
    roofx.obs.forEach(function (o) { var on = o.kind === 'b' ? hasB : hasH; o.ob.x1 = on ? o.x1 : 1e6; o.ob.x2 = on ? o.x2 : 1e6; });
  }
  function buildRoofExtras() {
    var RY = ROOF_Y, B = new THREE.Group(), H = new THREE.Group(); B.position.set(ROOFX.bx, RY, ROOFX.bz); H.position.set(ROOFX.hx, RY, ROOFX.hz); world.group.add(B); world.group.add(H); roofx.barrels = B; roofx.hives = H;
    function b(g, w, h, d, m, x, y, z, o) { o = o || {}; o.parent = g; o.floorLevel = 2; return box(w, h, d, m, x, y, z, o); }
    var blue = colorMat(0x2f6fb0, 0.45, 0.1), timber = MAT.wood, pipe = MAT.black;
    // two barrels on a timber stand, a downpipe from the gutter, a tap, the manifold the drip lines leave from
    b(B, 0.9, 0.06, 1.7, timber, 0, 0.42, 0); [[-0.38, -0.75], [0.38, -0.75], [-0.38, 0.75], [0.38, 0.75], [-0.38, 0], [0.38, 0]].forEach(function (p) { b(B, 0.08, 0.4, 0.08, timber, p[0], 0.2, p[1]); });
    [-0.42, 0.42].forEach(function (z) { cyl(0.32, 0.3, 0.95, blue, 0, 0.925, z, B, 28); cyl(0.33, 0.33, 0.04, colorMat(0x255a90, 0.45, 0.1), 0, 1.41, z, B, 28); [0.65, 1.15].forEach(function (y) { var r = new THREE.Mesh(new THREE.TorusGeometry(0.318, 0.014, 8, 32), colorMat(0x255a90, 0.45, 0.1)); r.rotation.x = Math.PI / 2; r.position.set(0, y, z); B.add(r); }); cyl(0.05, 0.05, 0.05, MAT.black, 0.12, 1.45, z, B, 12); });
    var dp = cyl(0.04, 0.04, 1.6, MAT.alu, -0.34, 2.25, 0.42, B, 12); var el = cyl(0.04, 0.04, 0.34, MAT.alu, -0.17, 1.47, 0.42, B, 12); el.rotation.z = Math.PI / 2; var lk = cyl(0.022, 0.022, 0.5, pipe, 0, 0.62, 0, B, 8); lk.rotation.x = Math.PI / 2;
    cyl(0.02, 0.02, 0.1, MAT.brass, 0.34, 0.6, -0.42, B, 10).rotation.z = Math.PI / 2; b(B, 0.03, 0.06, 0.012, colorMat(0xd0201a, 0.4), 0.4, 0.66, -0.42, { cast: false });
    b(B, 0.12, 0.1, 0.5, MAT.gunmetal, 0.5, 0.2, 0, { r: 0.01 }); for (var i = 0; i < 6; i++) { var ln = cyl(0.008, 0.008, 0.5, pipe, 0.75, 0.04, -0.2 + i * 0.08, B, 6); ln.rotation.z = Math.PI / 2; }
    b(B, 0.05, 0.9, 0.02, MAT.gloss, 0.335, 0.95, 0.42, { cast: false }); roofx.level = b(B, 0.03, 0.8, 0.012, emitMat(0x7cc4ff, 1.1), 0.35, 0.95, 0.42, { cast: false, sharp: true });
    roofx.scr = readout(0.3, 0.18, '#7cc4ff'); roofx.scr.position.set(0.47, 1.35, 0); roofx.scr.rotation.y = Math.PI / 2; B.add(roofx.scr); b(B, 0.03, 0.24, 0.36, MAT.gloss, 0.45, 1.35, 0, { r: 0.008, cast: false }); b(B, 0.03, 0.9, 0.03, MAT.gunmetal, 0.45, 0.8, 0.1, { cast: false });
    // two hives: a stand, a brood box, two supers and a pitched lid; an entrance board on the front
    [-0.7, 0.7].forEach(function (x, n) {
      b(H, 0.6, 0.05, 0.6, timber, x, 0.32, 0); [[-0.24, -0.24], [0.24, -0.24], [-0.24, 0.24], [0.24, 0.24]].forEach(function (p) { b(H, 0.06, 0.3, 0.06, timber, x + p[0], 0.15, p[1]); });
      [[0.47, 0.26, 0xf4f1ea], [0.7, 0.18, n ? 0xe8d27a : 0xa9d3a0], [0.89, 0.18, 0xf4f1ea]].forEach(function (L) { b(H, 0.5, L[1], 0.5, colorMat(L[2], 0.8), x, L[0], 0, { r: 0.012 }); b(H, 0.1, 0.02, 0.03, MAT.gunmetal, x, L[0] + 0.02, 0.26, { cast: false }); });
      var lid = b(H, 0.62, 0.05, 0.62, MAT.alu, x, 1.01, 0, { r: 0.01 }); b(H, 0.5, 0.012, 0.12, timber, x, 0.35, 0.32, { cast: false }).rotation.x = 0.2; b(H, 0.18, 0.02, 0.01, MAT.black, x, 0.375, 0.252, { cast: false, sharp: true });
    });
    for (var k = 0; k < 14; k++) { var bee = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 5), colorMat(k % 2 ? 0x1a1a1a : 0xe0a028, 0.6)); H.add(bee); roofx.bees.push({ m: bee, hive: k % 2 ? 0.7 : -0.7, r: 0.35 + (k % 5) * 0.12, sp: 1.6 + (k % 4) * 0.5, ph: k * 1.7, h: 0.5 + (k % 3) * 0.25 }); }
    var sg = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.26), new THREE.MeshBasicMaterial({ map: signTex(['BEES AT WORK', 'move slowly'], 288, 84, { titleColor: '#f0b94d' }), transparent: true })); sg.position.set(0, 1.45, -0.45); H.add(sg); signBack(sg, 0.9, 0.26); b(H, 0.04, 1.3, 0.04, timber, 0, 0.65, -0.47);
    [[ROOFX.bx, 0.8, ROOFX.bz, 1.3, 1.7, 2.0, 'roofBarrel'], [ROOFX.hx, 0.6, ROOFX.hz, 2.2, 1.3, 0.9, 'roofHive']].forEach(function (h) { var m = new THREE.Mesh(new THREE.BoxGeometry(h[3], h[4], h[5]), MAT.none); m.position.set(h[0], RY + h[1], h[2]); m.userData.homeY = RY + h[1]; world.group.add(m); interactable(m, { kind: h[6] }); roofx.hits.push(m); });
    [['b', ROOFX.bx - 0.5, ROOFX.bx + 0.6, ROOFX.bz - 0.9, ROOFX.bz + 0.9], ['h', ROOFX.hx - 1.05, ROOFX.hx + 1.05, ROOFX.hz - 0.4, ROOFX.hz + 0.4]].forEach(function (o) { var ob = { x1: o[1], x2: o[2], z1: o[3], z2: o[4], tag: 'roofkit', floorLevel: 2 }; world.obstacles.push(ob); roofx.obs.push({ kind: o[0], ob: ob, x1: o[1], x2: o[2] }); });
    roofExtrasSync();
  }
  hooks.boot.push(buildRoofExtras);
  hooks.frame.push(function (dt) {   // runs whether the DLC is on or not, so switching it off clears the roof
    roofx.syncT -= dt; if (roofx.syncT > 0) return; roofx.syncT = 1; if (roofx.barrels) roofExtrasSync();
  });
  dlcDefine({ id: 'greenhouse', name: DLC_NAME.greenhouse, kinds: ['roofBarrel', 'roofHive'],
    prompt: function (d) {
      var R = roofxState(); if (d.kind === 'roofBarrel') return 'Rain barrels <small>' + Math.round(R.water) + '% full · ' + (R.water > 1 ? 'the beds are watered' : 'empty: the beds wait for rain') + '</small>';
      return 'Beehives <small>' + R.honey + ' jar' + (R.honey === 1 ? '' : 's') + ' of honey to take' + (seasonLabel() === 'Winter' ? ' · the bees sit the winter out' : '') + '</small>';
    },
    interact: function (d) {
      var R = roofxState();
      if (d.kind === 'roofBarrel') { ctxOpen('🛢️ Rain barrels', 'rain fills them, the drip lines empty them', [{ label: 'Water <b>' + Math.round(R.water) + '%</b> <small>' + (R.water > 1 ? 'watered beds grow half as fast again' : 'the beds grow at their own pace until it rains') + '</small>', cls: R.water > 1 ? 'on' : 'bad' }, { label: '🚰 Fill them from the tap <small>for a dry spell</small>', cls: R.water > 95 ? 'muted' : '', act: R.water > 95 ? null : function () { R.water = 100; sfx('pour'); toast('🚰 The barrels are full', 'good'); save(); } }]); return; }
      var n = Math.min(ROOFX.take, R.honey);
      ctxOpen('🐝 Beehives', 'a jar a day from spring to autumn · they hold ' + ROOFX.jars, [{ label: '🍯 Take ' + n + ' jar' + (n === 1 ? '' : 's') + ' of honey <small>' + R.honey + ' in the hives · ' + money(CIG_SKUS.honey.price) + ' a jar from the cigarette cabinet, or into the lab store</small>', cls: n ? '' : 'muted', act: n ? function () { if (hotbarFull()) { toast('Your hands are full (G puts things down)', 'bad'); return; } R.honey -= n; take({ kind: 'cigs', sku: 'honey', n: n }); toast('🍯 ' + n + ' jar' + (n === 1 ? '' : 's') + ' of honey', 'good'); save(); } : null }, { label: 'With the hives on the roof a bed gives ' + roofGrams() + ' g.', cls: 'muted' }]);
    },
    tick: function (dt) {
      if (!dlcOwns('greenhouse', 'barrels')) return; var R = roofxState(), wet = /rain|storm/.test(xs().weather.kind);
      if (wet) R.water = Math.min(100, R.water + ROOFX.fill * dt); else { var n = xs().roof.filter(function (b) { return b.stage === 'grow'; }).length; R.water = Math.max(0, R.water - ROOFX.drain * n * dt); }
    },
    newDay: function (offline) { if (!dlcOwns('greenhouse', 'hives') || seasonLabel() === 'Winter') return; var R = roofxState(); if (R.honey < ROOFX.jars) { R.honey++; if (!offline && R.honey === ROOFX.jars) toast('🐝 The hives are full of honey', ''); } },
    update: function (dt) {
      if (player.floor !== 2 || !roofx.barrels) return; roofx.t += dt; var R = roofxState();
      if (roofx.hives.visible) roofx.bees.forEach(function (b) { var a = roofx.t * b.sp + b.ph; b.m.position.set(b.hive + Math.cos(a) * b.r, b.h + Math.sin(a * 1.7) * 0.18 + 0.2, 0.3 + Math.sin(a) * b.r * 0.8); });
      if (roofx.barrels.visible) { var f = clamp(R.water / 100, 0.02, 1); roofx.level.scale.y = f; roofx.level.position.y = 0.55 + 0.4 * f; roofx.scr.userData.draw(['Rain barrels', Math.round(R.water) + '% full', R.water > 1 ? 'beds watered' : 'empty']); }
    }
  });
