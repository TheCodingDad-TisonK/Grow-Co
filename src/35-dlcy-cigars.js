//@ the Tobacco Works, more of it: a rolling table and a humidor. Whole cured leaf becomes cigars, and a cigar has to age before it sells
  // ── Tobacco Works: cigars ──
  // The table takes cured leaf before the shredder gets it, so you say how much leaf the shredder has to leave alone.
  // A lot of five is rolled at the table and laid in the humidor beside it. It ages there, and only an aged cigar leaves it.
  var CIGAR = { leaf: 0.02, lot: 5, rollS: 40, ageS: 480, cap: 40, keep: [0, 0.5, 1, 2], take: 10 };
  CIG_SKUS.cigar = { name: 'RF Reserve cigar', type: 'cigar', shape: 'cigar', size: 1, price: 24, col: 0x5a3a1e, top: 0xe8c27a };
  upgProp(CIGAR, 'ageS', function (b) { return dlcHas('tobacco', 'humidor') ? b / 2 : b; });
  upgProp(CIGAR, 'cap', function (b) { return dlcHas('tobacco', 'humidor') ? 80 : b; });
  var cigarUI = { table: null, hum: null, dyn: null, tScr: null, hScr: null, syncT: 0, shown: -1 };
  function cigarState() { var C = dlcState('cigars', { job: null, humidor: [], keep: 0.5, rolled: 0 }); if (CIGAR.keep.indexOf(C.keep) < 0) C.keep = 0.5; return C; }
  function cigarCount(C) { return C.humidor.reduce(function (a, b) { return a + b.n; }, 0); }
  function cigarAged(C) { return C.humidor.reduce(function (a, b) { return a + (b.t >= CIGAR.ageS ? b.n : 0); }, 0); }
  function tobSpare(T) { return Math.max(0, T.cured - (dlcOn('tobacco') ? cigarState().keep : 0)); }   /* what the shredder may take: the rest is kept whole for the rolling table */
  function cigarCan(C, T) { return !C.job && T.cured >= CIGAR.leaf * CIGAR.lot - 1e-6 && cigarCount(C) + CIGAR.lot <= CIGAR.cap; }
  function cigarStart(quiet) {
    var C = cigarState(), T = tob(); if (C.job) return false; if (!quiet && !tobLicensed()) return false;
    if (cigarCount(C) + CIGAR.lot > CIGAR.cap) { if (!quiet) toast('The humidor is full: ' + CIGAR.cap + ' cigars', 'bad'); return false; }
    if (T.cured < CIGAR.leaf * CIGAR.lot - 1e-6) { if (!quiet) toast('Rolling ' + CIGAR.lot + ' cigars takes ' + kg(CIGAR.leaf * CIGAR.lot) + ' of cured leaf, and there is ' + kg(T.cured), 'bad'); return false; }
    T.cured = Math.max(0, T.cured - CIGAR.leaf * CIGAR.lot); C.job = { t: 0 }; if (!quiet) { sfx('rustle'); toast('🍂 Rolling ' + CIGAR.lot + ' cigars. They go in the humidor when they are done.', 'good'); save(); } return true;
  }
  function cigarTake() {
    var C = cigarState(), n = Math.min(CIGAR.take, cigarAged(C)); if (n <= 0) { toast('Nothing in the humidor has aged yet', ''); return false; } if (hotbarFull()) { toast('Your hands are full (G puts things down)', 'bad'); return false; }
    var left = n; C.humidor.forEach(function (b) { if (b.t < CIGAR.ageS || left <= 0) return; var k = Math.min(b.n, left); b.n -= k; left -= k; }); C.humidor = C.humidor.filter(function (b) { return b.n > 0; });
    take({ kind: 'cigs', sku: 'cigar', n: n }); toast('🚬 ' + n + ' aged cigars. They sell from the cigarette cabinet.', 'good'); cigarSync(true); save(); return true;
  }
  function cigarTableMenu() {
    var C = cigarState(), T = tob(), lines = [];
    if (C.job) lines.push({ label: '⏳ Rolling ' + CIGAR.lot + ' cigars <small>' + minsLeft(CIGAR.rollS - C.job.t) + ' to go</small>', cls: 'muted' });
    else lines.push({ label: '🍂 Roll ' + CIGAR.lot + ' cigars <small>' + kg(CIGAR.leaf * CIGAR.lot) + ' of cured leaf · ' + CIGAR.rollS + ' s · no paper, no filters</small>', cls: cigarCan(C, T) ? '' : 'muted', act: function () { cigarStart(false); } });
    lines.push({ label: 'Cured leaf <b>' + kg(T.cured) + '</b> <small>whole leaf from the kiln, before the shredder cuts it</small>' });
    CIGAR.keep.forEach(function (k) { lines.push({ label: (k ? '🍃 Keep ' + kg(k) + ' back from the shredder' : '🍃 Let the shredder take all of it') + ' <small>' + (k ? Math.floor(k / CIGAR.leaf) + ' cigars worth' : 'cigarettes only') + '</small>', cls: C.keep === k ? 'on' : '', act: function () { C.keep = k; toast(k ? 'The shredder leaves ' + kg(k) + ' of whole leaf for the table' : 'The shredder takes all the cured leaf', ''); save(); } }); });
    lines.push({ label: 'A cigar sells for ' + money(CIG_SKUS.cigar.price) + ' once it has aged ' + Math.round(CIGAR.ageS / 60) + ' min in the humidor. A basement operator rolls for you while there is leaf.', cls: 'muted' });
    ctxOpen('🍂 Rolling table', cigarCount(C) + ' of ' + CIGAR.cap + ' in the humidor · ' + C.rolled + ' rolled so far', lines);
  }
  function cigarHumidorMenu() {
    var C = cigarState(), aged = cigarAged(C), lines = [];
    lines.push({ label: '🚬 Take ' + Math.min(CIGAR.take, aged) + ' aged cigars <small>' + aged + ' ready · up to the cigarette cabinet with them</small>', cls: aged ? '' : 'muted', act: aged ? cigarTake : null });
    if (!C.humidor.length) lines.push({ label: 'Empty. Roll a lot at the table beside it.', cls: 'muted' });
    C.humidor.forEach(function (b) { var done = b.t >= CIGAR.ageS; lines.push({ label: b.n + ' cigars <small>' + (done ? 'aged' : 'aged in ' + minsLeft(CIGAR.ageS - b.t)) + '</small>', cls: done ? 'on' : 'muted' }); });
    ctxOpen('🗄️ Humidor', '70% humidity · holds ' + CIGAR.cap, lines);
  }
  function cigarModel(s) {   // one cigar: a tapered body, a rounded head and a band
    var G = new THREE.Group(), wrap = colorMat(0x5a3a1e, 0.75), b = new THREE.Mesh(roundCylGeo(0.0085 * s, 0.0095 * s, 0.125 * s, 12), wrap); b.rotation.z = Math.PI / 2; b.castShadow = true; G.add(b);
    var hd = new THREE.Mesh(new THREE.SphereGeometry(0.0085 * s, 10, 8), wrap); hd.position.x = -0.0625 * s; hd.scale.x = 1.4; G.add(hd);
    var bd = new THREE.Mesh(new THREE.CylinderGeometry(0.0092 * s, 0.0094 * s, 0.018 * s, 12), colorMat(0xb5121b, 0.5)); bd.rotation.z = Math.PI / 2; bd.position.x = -0.03 * s; G.add(bd);
    var gd = new THREE.Mesh(new THREE.CylinderGeometry(0.0094 * s, 0.0096 * s, 0.004 * s, 12), MAT.brass); gd.rotation.z = Math.PI / 2; gd.position.x = -0.03 * s; G.add(gd);
    return G;
  }
  function productCigar(K, s) {   // what you hold and what stands in the cabinet: three cigars in an open cedar tray
    var G = new THREE.Group(), cedar = colorMat(0x9a6a3a, 0.7); var tray = new THREE.Mesh(bevelGeo(0.075 * s, 0.012 * s, 0.14 * s), cedar); tray.position.y = -0.03 * s; G.add(tray);
    for (var i = 0; i < 3; i++) { var c = cigarModel(s); c.rotation.y = Math.PI / 2; c.position.set((i - 1) * 0.022 * s, -0.014 * s, 0); G.add(c); }
    return G;
  }
  function cigarSync(force) {   // the cigars you can see: on the table while a lot is being rolled, on the shelves of the humidor
    var U = cigarUI; if (!U.dyn) return; var C = cigarState(), n = cigarCount(C), key = n * 10 + (C.job ? 1 : 0); if (!force && key === U.shown) return; U.shown = key; clearKids(U.dyn);
    var show = Math.min(36, n); for (var i = 0; i < show; i++) { var c = cigarModel(1.15), row = Math.floor(i / 12), col = i % 12; c.rotation.y = Math.PI / 2; c.position.set(2.2 - 0.33 + col * 0.06, [0.142, 0.582, 1.002][row], 0.02); U.dyn.add(c); }
    if (C.job) for (var j = 0; j < 3; j++) { var t = cigarModel(1.15); t.position.set(-0.18 + j * 0.03, 0.967, 0.02 + j * 0.035); t.rotation.y = 0.3; U.dyn.add(t); }
  }
  function buildCigars() {
    var Y = BASE.y, g = new THREE.Group(); g.position.set(1.5, Y, 2.62); g.rotation.y = Math.PI; world.group.add(g); cigarUI.table = g;   /* front is local +z, which is north here: the table backs on to the south wall */
    function b(w, h, d, m, x, y, z, o) { o = o || {}; o.parent = g; return box(w, h, d, m, x, y, z, o); }
    function c(rt, rb, h, m, x, y, z, seg) { return cyl(rt, rb, h, m, x, y, z, g, seg); }
    var oak = MAT.darkwood, leafM = colorMat(0x7a5a2c, 0.9), leafD = colorMat(0x5a3f1c, 0.9);
    // the table: a thick top, a drawer, a shelf of moulds underneath
    b(1.8, 0.06, 0.7, MAT.wood, 0, 0.9, 0, { r: 0.015 }); [[-0.84, -0.3], [0.84, -0.3], [-0.84, 0.3], [0.84, 0.3]].forEach(function (p) { b(0.07, 0.87, 0.07, oak, p[0], 0.435, p[1]); }); b(1.64, 0.1, 0.03, oak, 0, 0.82, 0.31, { cast: false }); b(1.64, 0.03, 0.56, oak, 0, 0.3, 0, { cast: false });
    b(0.5, 0.09, 0.02, oak, 0.45, 0.82, 0.33, { cast: false, r: 0.006 }); c(0.012, 0.012, 0.02, MAT.brass, 0.45, 0.82, 0.345, 10).rotation.x = Math.PI / 2;
    // on it: a stack of whole leaf, a cutting board with the curved knife, a mould, a pot of gum, a lamp
    for (var i = 0; i < 6; i++) { var lf = b(0.42 - i * 0.02, 0.008, 0.26, i % 2 ? leafM : leafD, -0.6, 0.936 + i * 0.008, -0.08, { cast: false, r: 0.003 }); lf.rotation.y = (i - 3) * 0.09; }
    b(0.5, 0.025, 0.34, colorMat(0xc9a36a, 0.8), -0.05, 0.943, 0.08, { r: 0.008 }); var kn = b(0.16, 0.004, 0.06, MAT.steel, 0.1, 0.958, 0.16, { cast: false, r: 0.002 }); kn.rotation.y = 0.5; b(0.04, 0.02, 0.07, oak, 0.17, 0.966, 0.19, { cast: false }).rotation.y = 0.5;
    b(0.36, 0.05, 0.2, colorMat(0x8a5a3a, 0.8), 0.5, 0.955, -0.12, { r: 0.006 }); for (var m = 0; m < 5; m++) b(0.02, 0.012, 0.17, colorMat(0x2a1a0e, 0.9), 0.38 + m * 0.06, 0.981, -0.12, { cast: false, sharp: true });
    c(0.035, 0.03, 0.05, MAT.ceramic, 0.3, 0.955, 0.22, 14); c(0.004, 0.004, 0.1, MAT.wood, 0.31, 1.0, 0.22, 6).rotation.z = 0.4;
    c(0.07, 0.08, 0.02, MAT.black, 0.78, 0.94, -0.22, 16); var arm = c(0.008, 0.008, 0.5, MAT.brass, 0.72, 1.18, -0.22, 8); arm.rotation.z = 0.25; var shd = c(0.05, 0.11, 0.1, colorMat(0x1f4a35, 0.35, 0.2), 0.62, 1.42, -0.22, 20); shd.rotation.z = 0.5; var bl = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), glowMat(0xffe9c0, 1.4)); bl.position.set(0.6, 1.39, -0.22); g.add(bl);
    // a stool in front, a sack of leaf beside it
    c(0.17, 0.17, 0.04, oak, 0.0, 0.6, 0.75, 20); [[-0.11, 0.64], [0.11, 0.64], [0, 0.87]].forEach(function (p) { c(0.014, 0.018, 0.6, MAT.gunmetal, p[0], 0.3, p[1], 8); });
    // the humidor: a cedar-lined cabinet behind a glass door, three lit levels, a hygrometer in the pediment
    var cedar = colorMat(0xb98a55, 0.7), litM = glowMat(0xffe2b0, 1.2);
    b(0.95, 1.7, 0.03, oak, 2.2, 0.85, -0.255); [-0.46, 0.46].forEach(function (x) { b(0.03, 1.7, 0.5, oak, 2.2 + x, 0.85, -0.02); }); b(0.95, 0.12, 0.5, oak, 2.2, 0.06, -0.02); b(0.95, 0.2, 0.5, oak, 2.2, 1.6, -0.02); b(1.0, 0.06, 0.55, oak, 2.2, 1.73, -0.02, { r: 0.015 });
    b(0.89, 1.4, 0.01, cedar, 2.2, 0.82, -0.235, { cast: false, sharp: true }); b(0.89, 0.01, 0.44, cedar, 2.2, 0.125, -0.02, { cast: false, sharp: true }); [0.56, 0.98].forEach(function (y) { b(0.89, 0.02, 0.4, cedar, 2.2, y, -0.03, { cast: false }); });
    [0.535, 0.955, 1.485].forEach(function (y) { b(0.8, 0.012, 0.02, litM, 2.2, y, 0.17, { cast: false, sharp: true }); });
    b(0.87, 1.38, 0.012, new THREE.MeshPhysicalMaterial({ color: 0xdff0ff, transparent: true, opacity: 0.14, roughness: 0.03 }), 2.2, 0.81, 0.235, { cast: false, sharp: true }); [-0.43, 0.43].forEach(function (x) { b(0.035, 1.4, 0.03, oak, 2.2 + x, 0.81, 0.24, { cast: false }); }); [0.135, 1.49].forEach(function (y) { b(0.9, 0.035, 0.03, oak, 2.2, y, 0.24, { cast: false }); }); b(0.014, 0.2, 0.03, MAT.brass, 2.56, 0.85, 0.262, { cast: false });
    var hy = c(0.045, 0.045, 0.02, MAT.white, 2.2, 1.6, 0.235, 20); hy.rotation.x = Math.PI / 2; var hr = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.006, 8, 22), MAT.brass); hr.position.set(2.2, 1.6, 0.247); g.add(hr);
    cigarUI.tScr = readout(0.34, 0.2, '#e8c27a'); cigarUI.tScr.position.set(-0.6, 1.5, -0.3); g.add(cigarUI.tScr); b(0.4, 0.26, 0.03, MAT.gloss, -0.6, 1.5, -0.32, { r: 0.008, cast: false });
    cigarUI.hScr = readout(0.3, 0.16, '#e8c27a'); cigarUI.hScr.position.set(2.2, 1.95, 0.0); g.add(cigarUI.hScr); b(0.36, 0.22, 0.03, MAT.gloss, 2.2, 1.95, -0.02, { r: 0.008, cast: false }); b(0.02, 0.2, 0.02, MAT.gunmetal, 2.2, 1.8, -0.02, { cast: false });
    cigarUI.dyn = new THREE.Group(); g.add(cigarUI.dyn);
    var sg = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.4), new THREE.MeshBasicMaterial({ map: textTex(['ROLLING TABLE', 'whole leaf in · cigars out'], 480, 128, { titleColor: '#e8c27a' }), transparent: true })); sg.position.set(0.1, 2.35, -0.33); g.add(sg); signBack(sg, 1.5, 0.4);
    [[1.5, 0.95, 0.4, 'cigarTable', 1.9, 1.4, 0.9], [-0.7, 0.9, 0.35, 'cigarHumidor', 1.0, 1.8, 0.7]].forEach(function (h) { var m = new THREE.Mesh(new THREE.BoxGeometry(h[4], h[5], h[6]), MAT.none); m.position.set(h[0], Y + h[1], 2.62 - h[2] + 0.35); world.group.add(m); interactable(m, { kind: h[3] }); });
    world.obstacles.push({ x1: 0.6, x2: 2.4, z1: 2.27, z2: 2.97, tag: 'cigartable', floorLevel: -1 }); world.obstacles.push({ x1: -1.2, x2: -0.2, z1: 2.35, z2: 2.9, tag: 'humidor', floorLevel: -1 });
    g.traverse(function (o) { if (o.isMesh) o.receiveShadow = true; }); cigarSync(true);
  }
  hooks.boot.push(buildCigars);
  dlcDefine({ id: 'tobacco', name: DLC_NAME.tobacco, kinds: ['cigarTable', 'cigarHumidor'],
    prompt: function (d) {
      var C = cigarState(); if (d.kind === 'cigarHumidor') return 'Humidor <small>' + cigarAged(C) + ' aged · ' + (cigarCount(C) - cigarAged(C)) + ' ageing</small>';
      return 'Rolling table <small>' + (C.job ? 'rolling · ' + minsLeft(CIGAR.rollS - C.job.t) : kg(tob().cured) + ' of whole leaf') + '</small>';
    },
    interact: function (d) { if (d.kind === 'cigarHumidor') cigarHumidorMenu(); else cigarTableMenu(); },
    tick: function (dt) {
      var C = cigarState(); C.humidor.forEach(function (b) { b.t += dt; });
      if (C.job) { C.job.t += dt; if (C.job.t >= CIGAR.rollS) { C.job = null; C.rolled += CIGAR.lot; var last = C.humidor[C.humidor.length - 1]; if (last && last.t < 20) last.n += CIGAR.lot; else C.humidor.push({ n: CIGAR.lot, t: 0 }); if (player.floor === -1) toast('🍂 ' + CIGAR.lot + ' cigars rolled and laid in the humidor', 'good'); } }
      else if (xs().staff.operator && hasLic('tobacco')) cigarStart(true);
    },
    update: function (dt) {
      var U = cigarUI; if (!U.table) return; var here = player.floor === -1; if (!here) return; U.syncT -= dt; if (U.syncT > 0) return; U.syncT = 0.5;
      var C = cigarState(), T = tob(); cigarSync(false);
      U.tScr.userData.draw([C.job ? 'Rolling' : 'Rolling table', C.job ? minsLeft(CIGAR.rollS - C.job.t) + ' to go' : 'leaf ' + kg(T.cured), 'kept back ' + kg(C.keep), C.rolled + ' rolled']);
      U.hScr.userData.draw(['Humidor 70%', cigarAged(C) + ' aged', (cigarCount(C) - cigarAged(C)) + ' ageing · holds ' + CIGAR.cap]);
    }
  });
