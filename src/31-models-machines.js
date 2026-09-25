//@ product models and the machines
  // ── Product models, shared by the hand and the shelves so the shop sells what you carry ──
  var PROD_M = {};
  function prodMat(key, make) { return PROD_M[key] || (PROD_M[key] = make()); }
  function productJoint(s) {   // a tapered cone of paper: card roach, twisted tail, scorched tip
    var G = new THREE.Group();
    var paperM = prodMat('paper', function () { return new THREE.MeshStandardMaterial({ color: 0xf7f3e6, roughness: 0.95 }); });
    var roachM = prodMat('roach', function () { return new THREE.MeshStandardMaterial({ color: 0xc19a63, roughness: 0.9 }); });
    var ashM = prodMat('ash', function () { return new THREE.MeshStandardMaterial({ color: 0x3a3330, roughness: 1 }); });
    var b = new THREE.Mesh(new THREE.CylinderGeometry(0.0074 * s, 0.005 * s, 0.084 * s, 8), paperM); b.position.y = 0.012 * s; G.add(b);
    var r = new THREE.Mesh(new THREE.CylinderGeometry(0.0051 * s, 0.0051 * s, 0.02 * s, 8), roachM); r.position.y = -0.04 * s; G.add(r);
    var t = new THREE.Mesh(new THREE.ConeGeometry(0.0074 * s, 0.017 * s, 8), paperM); t.position.y = 0.0625 * s; G.add(t);
    var a = new THREE.Mesh(new THREE.CylinderGeometry(0.0076 * s, 0.0076 * s, 0.004 * s, 8), ashM); a.position.y = 0.0535 * s; G.add(a);
    return G;
  }
  function productBaggie(st, s) {   // a zip-lock you can see the bud through, with the strain on the label
    var G = new THREE.Group();
    var filmM = prodMat('film', function () { return new THREE.MeshStandardMaterial({ color: 0xeef7f0, roughness: 0.12, transparent: true, opacity: 0.4 }); });
    var zipM = prodMat('zip', function () { return new THREE.MeshStandardMaterial({ color: 0xf7fbf8, roughness: 0.5 }); });
    var nugM = prodMat('nug' + st.id, function () { return new THREE.MeshStandardMaterial({ color: st.bud, roughness: 0.9 }); });
    G.add(new THREE.Mesh(new THREE.BoxGeometry(0.076 * s, 0.062 * s, 0.017 * s), filmM));
    for (var q = 0; q < 5; q++) { var n = new THREE.Mesh(new THREE.IcosahedronGeometry((0.0105 + (q % 3) * 0.0022) * s, 0), nugM); n.position.set((-0.021 + (q % 3) * 0.021) * s, (-0.014 + Math.floor(q / 3) * 0.015) * s, 0); n.scale.set(1, 0.85, 0.7); n.rotation.set(q, q * 1.4, 0.4); G.add(n); }
    var zip = new THREE.Mesh(new THREE.BoxGeometry(0.078 * s, 0.006 * s, 0.019 * s), zipM); zip.position.y = 0.027 * s; G.add(zip);
    var lip = new THREE.Mesh(new THREE.BoxGeometry(0.078 * s, 0.008 * s, 0.013 * s), filmM); lip.position.y = 0.035 * s; G.add(lip);
    var lab = new THREE.Mesh(new THREE.PlaneGeometry(0.056 * s, 0.019 * s), prodMat('lab' + st.id, function () { return new THREE.MeshBasicMaterial({ map: textTex([st.name], 260, 88, { size: 34, bg: '#f4efdf', color: '#2a2a2a', titleColor: '#2a2a2a', line: 'rgba(0,0,0,0)' }), transparent: true }); }));
    lab.position.set(0, 0.0125 * s, 0.0091 * s); G.add(lab);
    return G;
  }
  function productCigPack(K, s) {   // a hinge-lid pack: foil collar, lid seam, printed face and a health band
    var G = new THREE.Group(), big = K.size === 20;
    var w = (big ? 0.056 : 0.046) * s, ht = (big ? 0.088 : 0.074) * s, d = (big ? 0.023 : 0.019) * s;
    var bodyM = prodMat('cig' + K.name, function () { return new THREE.MeshStandardMaterial({ color: K.col, roughness: 0.55 }); });
    var lidM = prodMat('cigl' + K.name, function () { return new THREE.MeshStandardMaterial({ color: mixHex(K.col, 0x000000, 0.25), roughness: 0.55 }); });
    var foilM = prodMat('foil', function () { return new THREE.MeshStandardMaterial({ color: 0xd8dde2, roughness: 0.25, metalness: 0.8 }); });
    G.add(new THREE.Mesh(new THREE.BoxGeometry(w, ht * 0.72, d), bodyM));
    var lid = new THREE.Mesh(new THREE.BoxGeometry(w * 1.008, ht * 0.28, d * 1.008), lidM); lid.position.y = ht * 0.5; G.add(lid);
    var seam = new THREE.Mesh(new THREE.BoxGeometry(w * 1.012, 0.0015 * s, d * 1.012), foilM); seam.position.y = ht * 0.36; G.add(seam);
    var face = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.9, ht * 0.5), prodMat('cigf' + K.name, function () { return new THREE.MeshBasicMaterial({ map: textTex(['RF', K.type === 'light' ? 'LIGHT' : 'SMOKING', K.size + 's'], 200, 260, { size: 44, bg: '#' + ('000000' + K.col.toString(16)).slice(-6), color: '#' + ('000000' + K.top.toString(16)).slice(-6), titleColor: '#' + ('000000' + K.top.toString(16)).slice(-6), line: 'rgba(0,0,0,0)' }), transparent: true }); }));
    face.position.set(0, -ht * 0.03, d / 2 + 0.0004 * s); G.add(face);
    var band = new THREE.Mesh(new THREE.BoxGeometry(w * 0.94, ht * 0.16, 0.0008 * s), prodMat('cigb', function () { return new THREE.MeshStandardMaterial({ color: 0x14181b, roughness: 0.9 }); }));
    band.position.set(0, -ht * 0.27, d / 2 + 0.0006 * s); G.add(band);
    return G;
  }
  function productSoilSack(s) {   /* heat-sealed compost sack with a printed front */
    var G = new THREE.Group();
    var sackM = prodMat('sack', function () { return new THREE.MeshStandardMaterial({ color: 0x4a3524, roughness: 1 }); });
    var foldM = prodMat('sackfold', function () { return new THREE.MeshStandardMaterial({ color: 0x3a291b, roughness: 1 }); });
    G.add(new THREE.Mesh(new THREE.BoxGeometry(0.15 * s, 0.17 * s, 0.095 * s), sackM));
    [1, -1].forEach(function (e) { var fo = new THREE.Mesh(new THREE.BoxGeometry(0.155 * s, 0.022 * s, 0.03 * s), foldM); fo.position.y = e * 0.093 * s; G.add(fo); });
    var fc = new THREE.Mesh(new THREE.PlaneGeometry(0.125 * s, 0.105 * s), prodMat('sacklab', function () { return new THREE.MeshBasicMaterial({ map: textTex(['GROW CO.', 'potting soil', '20 L'], 250, 210, { size: 40, bg: '#6d4f30', color: '#e9dcc2', titleColor: '#9ff0b5', line: 'rgba(0,0,0,0)' }), transparent: true }); }));
    fc.position.set(0, 0.006 * s, 0.0481 * s); G.add(fc); return G;
  }
  function productNutrientBottle(s) {   /* shoulder, neck, ribbed cap, wrapped label */
    var G = new THREE.Group();
    var botM = prodMat('nutbot', function () { return new THREE.MeshStandardMaterial({ color: 0xcdea55, roughness: 0.35, transparent: true, opacity: 0.94 }); });
    var capM = prodMat('nutcap', function () { return new THREE.MeshStandardMaterial({ color: 0x2a2f26, roughness: 0.6 }); });
    var b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.029 * s, 0.031 * s, 0.105 * s, 14), botM); b1.position.y = -0.005 * s; G.add(b1);
    var sh = new THREE.Mesh(new THREE.CylinderGeometry(0.014 * s, 0.029 * s, 0.026 * s, 14), botM); sh.position.y = 0.061 * s; G.add(sh);
    var nk = new THREE.Mesh(new THREE.CylinderGeometry(0.013 * s, 0.013 * s, 0.016 * s, 12), capM); nk.position.y = 0.082 * s; G.add(nk);
    var cp = new THREE.Mesh(new THREE.CylinderGeometry(0.0155 * s, 0.0155 * s, 0.011 * s, 16), capM); cp.position.y = 0.094 * s; G.add(cp);
    var lb = new THREE.Mesh(new THREE.CylinderGeometry(0.0305 * s, 0.0305 * s, 0.05 * s, 16, 1, true), prodMat('nutlab', function () { return new THREE.MeshBasicMaterial({ map: textTex(['BLOOM', 'nutrients'], 300, 120, { size: 44, bg: '#1f3a14', color: '#cdea55', titleColor: '#ffffff', line: 'rgba(0,0,0,0)' }), transparent: true, side: THREE.DoubleSide }); }));
    lb.position.y = -0.006 * s; G.add(lb); return G;
  }
  function productSprayBottle(s) {   /* trigger sprayer with the fluid line showing through the tank */
    var G = new THREE.Group();
    var tankM = prodMat('spraytank', function () { return new THREE.MeshStandardMaterial({ color: 0xe8f2ee, roughness: 0.18, transparent: true, opacity: 0.55 }); });
    var fluidM = prodMat('sprayfluid', function () { return new THREE.MeshStandardMaterial({ color: 0x8fd6b0, roughness: 0.3, transparent: true, opacity: 0.85 }); });
    var headM = prodMat('sprayhead', function () { return new THREE.MeshStandardMaterial({ color: 0x2f3a36, roughness: 0.7 }); });
    var t1 = new THREE.Mesh(new THREE.CylinderGeometry(0.029 * s, 0.032 * s, 0.115 * s, 14), tankM); t1.position.y = -0.012 * s; G.add(t1);
    var fl = new THREE.Mesh(new THREE.CylinderGeometry(0.026 * s, 0.029 * s, 0.055 * s, 12), fluidM); fl.position.y = -0.04 * s; G.add(fl);
    var nk2 = new THREE.Mesh(new THREE.CylinderGeometry(0.016 * s, 0.016 * s, 0.02 * s, 12), headM); nk2.position.y = 0.055 * s; G.add(nk2);
    var hd = new THREE.Mesh(new THREE.BoxGeometry(0.03 * s, 0.036 * s, 0.048 * s), headM); hd.position.set(0, 0.082 * s, -0.012 * s); G.add(hd);
    var nz = new THREE.Mesh(new THREE.BoxGeometry(0.012 * s, 0.01 * s, 0.03 * s), headM); nz.position.set(0, 0.095 * s, -0.04 * s); G.add(nz);
    var tg = new THREE.Mesh(new THREE.BoxGeometry(0.016 * s, 0.026 * s, 0.008 * s), prodMat('spraytrig', function () { return new THREE.MeshStandardMaterial({ color: 0x59d08a, roughness: 0.6 }); })); tg.position.set(0, 0.068 * s, 0.016 * s); G.add(tg);
    var lb2 = new THREE.Mesh(new THREE.CylinderGeometry(0.0325 * s, 0.0325 * s, 0.05 * s, 16, 1, true), prodMat('spraylab', function () { return new THREE.MeshBasicMaterial({ map: textTex(['PEST OFF', 'ready to use'], 300, 120, { size: 40, bg: '#123a2a', color: '#bfeed6', titleColor: '#ffffff', line: 'rgba(0,0,0,0)' }), transparent: true, side: THREE.DoubleSide }); }));
    lb2.position.y = 0.006 * s; G.add(lb2); return G;
  }
  function productSeedPacket(st, s) {   /* foil sachet, heat-sealed top, tear notch, printed front */
    var G = new THREE.Group();
    var foilM = prodMat('seedfoil', function () { return new THREE.MeshStandardMaterial({ color: 0xc9cdd2, roughness: 0.3, metalness: 0.55 }); });
    var sealM = prodMat('seedseal', function () { return new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.5, metalness: 0.4 }); });
    G.add(new THREE.Mesh(new THREE.BoxGeometry(0.072 * s, 0.098 * s, 0.009 * s), foilM));
    var sl = new THREE.Mesh(new THREE.BoxGeometry(0.074 * s, 0.014 * s, 0.004 * s), sealM); sl.position.y = 0.054 * s; G.add(sl);
    var nt = new THREE.Mesh(new THREE.BoxGeometry(0.006 * s, 0.008 * s, 0.005 * s), sealM); nt.position.set(0.033 * s, 0.05 * s, 0); G.add(nt);
    var fa = new THREE.Mesh(new THREE.PlaneGeometry(0.064 * s, 0.086 * s), prodMat('seedlab' + st.id, function () { return new THREE.MeshBasicMaterial({ map: textTex([st.emoji, st.name, 'feminised'], 210, 285, { size: 30, bg: '#f4efdf', color: '#3a4a36', titleColor: '#1a6a2a', line: 'rgba(0,0,0,.18)' }), transparent: true }); }));
    fa.position.z = 0.0047 * s; G.add(fa); return G;
  }
  function cartonBox(w, h2, d, lines, hex, ink) {   /* a plain box with its front printed, for the small consumables */
    var G = new THREE.Group();
    G.add(new THREE.Mesh(new THREE.BoxGeometry(w, h2, d), new THREE.MeshStandardMaterial({ color: hex, roughness: 0.85 })));
    var key = 'carton' + lines.join('|');
    var face = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.86, h2 * 0.74), prodMat(key, function () { return new THREE.MeshBasicMaterial({ map: textTex(lines, 260, 150, { size: 46, bg: 'rgba(0,0,0,0)', color: ink, titleColor: ink, line: 'rgba(0,0,0,0)' }), transparent: true }); }));
    face.position.z = d / 2 + 0.001; G.add(face); return G;
  }
  // ── The machines: what is on the coils, the door that opens to refill, and the tray you reach into ──
  var machA = {};
  function machAnim(id) { return machA[id] || (machA[id] = { doorT: 0, brewT: 0, drops: [] }); }   // door swing, pour timer and falling stock, per machine
  function machState(id) {
    var X = xs(); if (!X.mach || typeof X.mach !== 'object') X.mach = {};
    if (!X.mach.perUnit) {   /* saves from before there could be two machines kept every machine's state in one object; split it out by prop */
      var o = X.mach; X.mach = { perUnit: true };
      X.mach.vending = { vendDoor: !!o.vendDoor, tray: Array.isArray(o.tray) ? o.tray : [] };
      X.mach.lobbyCoffee = { coffDoor: !!o.coffDoor, cup: o.cup || 0 };
      X.mach.fridge = { fridgeDoor: !!o.fridgeDoor, fridge: typeof o.fridge === 'number' ? o.fridge : 6 };   /* the fridge you start with comes stocked; any you buy later start empty */
    }
    if (!X.mach.own) {   /* saves from before 1.25 kept one coin box and one stock for every machine of a kind: both go to the first machine of the kind */
      X.mach.own = true; var ob = S.box || {}, first = function (b) { return X.mach[b] || (X.mach[b] = {}); };
      [['vending', ob.vend], ['lobbyCoffee', ob.coffee], ['arcade', ob.arcade]].forEach(function (p) { if (p[1] > 0) { var u = first(p[0]); u.box = (u.box || 0) + p[1]; } });
      first('vending').stock = Object.assign({}, S.vendStock || { drink: 12, snack: 12 });   /* a new shop's first machine comes stocked, as it always has */
      first('lobbyCoffee').stock = Object.assign({}, S.coffeeStock || { cup: 40, beans: 40 });
      delete S.box; delete S.vendStock; delete S.coffeeStock;
    }
    var m = X.mach[id || 'vending'] || (X.mach[id || 'vending'] = {});
    if (!Array.isArray(m.tray)) m.tray = [];
    if (typeof m.cup !== 'number') m.cup = 0;
    if (typeof m.fridge !== 'number') m.fridge = 0;
    if (!m.stock || typeof m.stock !== 'object') m.stock = {};
    return m;
  }
  // every machine holds its own stock: a vending machine its racks, a coffee machine its cups and beans, loaded by
  // hand, a crate at a time, by you or by the crew (restockJob in the staff code)
  function machStock(id) { return machState(id).stock; }
  function stockTotal(base, k) { return unitIds(base).reduce(function (a, u) { return a + (machStock(u)[k] || 0); }, 0); }
  function coffReady(id) { var st = machStock(id); return (st.cup || 0) > 0 && (st.beans || 0) > 0; }
  // every machine keeps its own coin box: a sale pays into the machine it came out of, and emptying one leaves the rest alone
  function coinBox(id) { return machState(id).box || 0; }
  function coinPay(id, n) { var m = machState(id); m.box = (m.box || 0) + n; }
  function coinEmpty(id, what) { var m = machState(id); if (!takeCash(m.box || 0, what)) return false; m.box = 0; return true; }
  function coinTotal(base) { var t = 0; (base ? [base] : ['vending', 'lobbyCoffee', 'fridge', 'arcade']).forEach(function (b) { unitIds(b).forEach(function (u) { t += coinBox(u); }); }); return t; }
  function syncMachines() { ['vending', 'lobbyCoffee', 'fridge'].forEach(function (b) { unitIds(b).forEach(function (u) { if (b === 'vending') syncVending(u); else if (b === 'lobbyCoffee') syncCoffee(u); else syncFridge(u); }); }); }
  function fridgeParts(id) {
    var inst = propInst[id || 'fridge']; if (!inst) return null; var p = inst.g.userData.frParts;
    if (!p || !p.door || !p.door.parent) { p = {}; inst.g.traverse(function (o) { if (o.userData.fridgeDoor) p.door = o; if (o.userData.fridgeShelves) p.shelves = o; }); inst.g.userData.frParts = p; }
    return p.door ? p : null;
  }
  function coffParts(id) {
    var inst = propInst[id || 'lobbyCoffee']; if (!inst) return null; var p = inst.g.userData.cfParts;
    if (!p || !p.cups || !p.cups.parent) { p = {}; inst.g.traverse(function (o) { if (o.userData.coffCups) p.cups = o; if (o.userData.coffBrew) p.brew = o; if (o.userData.coffLid) p.lid = o; if (o.userData.coffBeans) p.beans = o; if (o.userData.coffCupHit) p.cupHit = o; }); inst.g.userData.cfParts = p; }
    return p.cups ? p : null;
  }
  function cupMesh(s2, full) {   // a paper cup, with a lid and a sleeve once it is poured
    var G = new THREE.Group();
    var paper = prodMat('cuppaper', function () { return new THREE.MeshStandardMaterial({ color: 0xf7f7f2, roughness: 0.85 }); });
    G.add(new THREE.Mesh(new THREE.CylinderGeometry(0.035 * s2, 0.027 * s2, 0.095 * s2, 14), paper));
    if (full) {
      var lidM = prodMat('cuplid', function () { return new THREE.MeshStandardMaterial({ color: 0x3a3f46, roughness: 0.6 }); });
      var l = new THREE.Mesh(new THREE.CylinderGeometry(0.037 * s2, 0.037 * s2, 0.012 * s2, 14), lidM); l.position.y = 0.052 * s2; G.add(l);
      var sip = new THREE.Mesh(new THREE.CylinderGeometry(0.008 * s2, 0.008 * s2, 0.012 * s2, 8), lidM); sip.position.set(0.022 * s2, 0.06 * s2, 0); G.add(sip);
      var slv = new THREE.Mesh(new THREE.CylinderGeometry(0.0365 * s2, 0.031 * s2, 0.04 * s2, 14, 1, true), prodMat('cupslv', function () { return new THREE.MeshBasicMaterial({ map: textTex(['GROW CO.'], 300, 110, { size: 44, bg: '#6d4f30', color: '#f4e8d2', titleColor: '#f4e8d2', line: 'rgba(0,0,0,0)' }), transparent: true, side: THREE.DoubleSide }); }));
      slv.position.y = -0.006 * s2; G.add(slv);
    }
    return G;
  }
  function syncFridge(id) {
    if (!id) { unitIds('fridge').forEach(function (u) { syncFridge(u); }); return; }
    var p = fridgeParts(id); if (!p || !p.shelves) return;
    (p.shelves.userData.slots || []).forEach(function (m) { p.shelves.remove(m); });
    p.shelves.userData.slots = [];
    var n = Math.min(machState(id).fridge || 0, 16);
    for (var i = 0; i < n; i++) {
      var col = i % 4, row = Math.floor(i / 4);
      var d = drinkMesh(1); d.position.set(-0.24 + col * 0.16, 0.445 + row * 0.36, -0.02 + (i % 2) * 0.12);
      p.shelves.add(d); p.shelves.userData.slots.push(d);
    }
    p.shelves.traverse(function (o) { if (o.isMesh) { o.castShadow = false; o.userData.propId = id; } });
  }
  function syncCoffee(id) {
    if (!id) { unitIds('lobbyCoffee').forEach(function (u) { syncCoffee(u); }); return; }
    var p = coffParts(id); if (!p) return;
    (p.cups.userData.slots || []).forEach(function (m) { p.cups.remove(m); });
    p.cups.userData.slots = [];
    var st = machStock(id), stack = Math.min(Math.ceil((st.cup || 0) / 6), 7);
    for (var i = 0; i < stack; i++) { var cu = cupMesh(1, false); cu.position.y = i * 0.022; p.cups.add(cu); p.cups.userData.slots.push(cu); }
    if (p.beans) { var lvl = clamp((st.beans || 0) / 40, 0.05, 1); p.beans.scale.y = lvl; p.beans.position.y = 1.40 + 0.06 * lvl; p.beans.visible = (st.beans || 0) > 0; }
    clearKids(p.brew);
    if (machState(id).cup > 0) { var c2 = cupMesh(1, true); p.brew.add(c2); }
    if (p.cupHit) p.cupHit.position.y = machState(id).cup > 0 ? 1.02 : -50;
    p.cups.traverse(function (o) { if (o.isMesh) { o.castShadow = false; o.userData.propId = id; } });
    p.brew.traverse(function (o) { if (o.isMesh) { o.castShadow = false; o.userData.propId = id; } });
  }
  function fridgeDoorToggle(id) { var M = machState(id); M.fridgeDoor = !M.fridgeDoor; sfx(M.fridgeDoor ? 'drawer' : 'close'); toast(M.fridgeDoor ? '🧊 Fridge open' : '🧊 Fridge shut', ''); save(); }
  function fridgeTake(id) {
    var M = machState(id);
    if ((M.fridge || 0) <= 0) { toast('The fridge is empty. Load a case of drinks.', 'bad'); return; }
    if (hotbarFull()) { toast('Your hands are full (G puts something down)', 'bad'); return; }
    M.fridge--; take({ kind: 'can2' }); sfx('pickup'); toast('🥤 Took a cold one (' + M.fridge + ' left)', 'good'); syncFridge(id); save();
  }
  function coffBrew(id) {
    var M = machState(id);
    if (M.cup > 0) { toast('There\'s already a cup under the spout', ''); return; }
    var st = machStock(id);
    if ((st.cup || 0) <= 0) { toast('This machine is out of cups', 'bad'); return; }
    if ((st.beans || 0) <= 0) { toast('This machine is out of beans', 'bad'); return; }
    if ((S.pocket || 0) < 2) { sfx('bad'); toast('A cup is $2 from your pocket, and your pocket is short', 'bad'); return; }
    S.pocket -= 2; st.cup--; st.beans--; coinPay(id, 2); M.cup = 1; machAnim(id).brewT = 1.5;
    sfx('coffee'); toast('☕ Pouring…', ''); syncCoffee(id); save();
  }
  function coffTake(id) {
    var M = machState(id);
    if (M.cup <= 0) { toast('Nothing under the spout. E on the machine pours one.', ''); return; }
    if (machAnim(id).brewT > 0) { toast('Still pouring', ''); return; }
    if (hotbarFull()) { toast('Your hands are full (G puts something down)', 'bad'); return; }
    M.cup = 0; take({ kind: 'cup2' }); sfx('pickup'); toast('☕ Took the coffee', 'good'); syncCoffee(id); save();
  }
  function vendParts(id) {
    var inst = propInst[id || 'vending']; if (!inst) return null;
    var p = inst.g.userData.vendParts;
    if (!p || !p.door || !p.door.parent) {
      p = {}; inst.g.traverse(function (o) {
        if (o.userData.vendDoor) p.door = o; if (o.userData.vendRacks) p.racks = o;
        if (o.userData.vendTray) p.tray = o; if (o.userData.vendFlap) p.flap = o; if (o.userData.vendDisp) p.disp = o;
      });
      inst.g.userData.vendParts = p;
    }
    return p.door ? p : null;
  }
  function drinkMesh(s2) {   // a can: tapered body, a printed wrap, a chamfered top and a ring pull
    var G = new THREE.Group();
    var canM = prodMat('canbody', function () { return new THREE.MeshStandardMaterial({ color: 0xd8dde2, roughness: 0.3, metalness: 0.75 }); });
    var b = new THREE.Mesh(new THREE.CylinderGeometry(0.031 * s2, 0.031 * s2, 0.1 * s2, 14), canM); G.add(b);
    var top = new THREE.Mesh(new THREE.CylinderGeometry(0.026 * s2, 0.031 * s2, 0.012 * s2, 14), canM); top.position.y = 0.056 * s2; G.add(top);
    var bot = new THREE.Mesh(new THREE.CylinderGeometry(0.031 * s2, 0.026 * s2, 0.012 * s2, 14), canM); bot.position.y = -0.056 * s2; G.add(bot);
    var wrap = new THREE.Mesh(new THREE.CylinderGeometry(0.0315 * s2, 0.0315 * s2, 0.072 * s2, 16, 1, true), prodMat('canwrap', function () { return new THREE.MeshBasicMaterial({ map: textTex(['GROW', 'COLA'], 300, 170, { size: 60, bg: '#1d6fd6', color: '#ffffff', titleColor: '#ffd166', line: 'rgba(0,0,0,0)' }), transparent: true, side: THREE.DoubleSide }); }));
    G.add(wrap);
    var tab = new THREE.Mesh(new THREE.TorusGeometry(0.008 * s2, 0.0018 * s2, 4, 8), canM); tab.position.y = 0.063 * s2; tab.rotation.x = Math.PI / 2; G.add(tab);
    return G;
  }
  function snackMesh(s2) {   // a flow-wrapped bar, crimped at both ends
    var G = new THREE.Group();
    var wrapM = prodMat('snackwrap', function () { return new THREE.MeshStandardMaterial({ color: 0x6b2f8a, roughness: 0.45, metalness: 0.25 }); });
    G.add(new THREE.Mesh(new THREE.BoxGeometry(0.105 * s2, 0.018 * s2, 0.05 * s2), wrapM));
    [-1, 1].forEach(function (e) { var cr = new THREE.Mesh(new THREE.BoxGeometry(0.018 * s2, 0.011 * s2, 0.052 * s2), wrapM); cr.position.x = e * 0.06 * s2; G.add(cr); });
    var fa = new THREE.Mesh(new THREE.PlaneGeometry(0.086 * s2, 0.04 * s2), prodMat('snackface', function () { return new THREE.MeshBasicMaterial({ map: textTex(['GROW BAR'], 280, 120, { size: 52, bg: '#6b2f8a', color: '#ffd166', titleColor: '#ffd166', line: 'rgba(0,0,0,0)' }), transparent: true }); }));
    fa.position.z = 0.0255 * s2; G.add(fa);
    return G;
  }
  function syncVending(id) {   // the coils hold exactly what the machine is stocked with
    if (!id) { unitIds('vending').forEach(function (u) { syncVending(u); }); return; }
    var p = vendParts(id); if (!p || !p.racks) return;
    var racks = p.racks;
    (racks.userData.slots || []).forEach(function (m) { racks.remove(m); });
    racks.userData.slots = [];
    var st = machStock(id), drinks = Math.min(st.drink || 0, 8), snacks = Math.min(st.snack || 0, 8);
    for (var i = 0; i < drinks; i++) {
      var col = i % 4, row = Math.floor(i / 4);
      var d = drinkMesh(1); d.position.set(-0.225 + col * 0.15, 0.585 - row * 0.29, 0.02); racks.add(d); racks.userData.slots.push(d);
    }
    for (var j = 0; j < snacks; j++) {
      var c2 = j % 4, r2 = Math.floor(j / 4);
      var sn = snackMesh(1); sn.position.set(-0.225 + c2 * 0.15, -0.02 - r2 * 0.29, 0.02); sn.rotation.z = Math.PI / 2; racks.add(sn); racks.userData.slots.push(sn);
    }
    racks.traverse(function (o) { if (o.isMesh) { o.castShadow = false; o.userData.propId = id; } });
    syncTray(id);
  }
  function syncTray(id) {   // whatever has dropped sits in the delivery tray until you take it
    id = id || 'vending';
    var p = vendParts(id); if (!p || !p.tray) return;
    clearKids(p.tray);
    var M = machState(id);
    M.tray.slice(0, 4).forEach(function (it, i) {
      var m = it === 'drink' ? drinkMesh(1) : snackMesh(1);
      m.position.set(-0.16 + i * 0.11, 0.035, 0);
      if (it === 'drink') m.rotation.z = Math.PI / 2; else m.rotation.y = 0.3;
      p.tray.add(m);
    });
    p.tray.traverse(function (o) { if (o.isMesh) { o.castShadow = false; o.userData.propId = id; } });
    if (!p.trayHit) { var inst2 = propInst[id]; if (inst2) inst2.g.traverse(function (o) { if (o.userData.interact && o.userData.interact.kind === 'vendTray') p.trayHit = o; }); }
    if (p.trayHit) p.trayHit.position.y = M.tray.length ? 0.42 : -50;   /* an empty tray must not swallow the machine's prompt */
  }
  function vendDisplay(id, txt) {
    var p = vendParts(id); if (!p || !p.disp) return;
    if (p.disp.material.map) p.disp.material.map.dispose();
    p.disp.material.map = textTex([txt], 200, 120, { size: txt.length > 7 ? 34 : 52, bg: '#08120c', color: '#6fdc8c', titleColor: '#6fdc8c', line: 'rgba(0,0,0,0)' });
    p.disp.material.needsUpdate = true;
  }
  function vendDoorToggle(id) {
    var M = machState(id); M.vendDoor = !M.vendDoor;
    sfx(M.vendDoor ? 'drawer' : 'close');
    toast(M.vendDoor ? '🔧 Machine open. The racks are out, so load drinks or snacks straight in.' : '🔒 Machine closed', M.vendDoor ? '' : 'good');
    vendDisplay(id, M.vendDoor ? 'SERVICE' : 'READY'); save();
  }
  function isVendItem(k) { var it = supplyById(k); return k === 'drink' || k === 'snack' || !!(it && it.stock === 'vend'); }   // anything a pack marks for the vending machine goes on its racks
  function vendKeys(id) { var st = machStock(id); return Object.keys(st).filter(function (k) { return (st[k] || 0) > 0 && isVendItem(k); }); }   // what is on this machine's racks right now
  function vendDispense(id, item) {   // a coil turns, the item falls, and it lands in the tray
    var M = machState(id), st = machStock(id);
    if ((st[item] || 0) <= 0) { toast('The machine is out of ' + (item === 'drink' ? 'drinks' : 'snacks'), 'bad'); vendDisplay(id, 'SOLD OUT'); return false; }
    if ((S.pocket || 0) < 2) { sfx('bad'); toast('It takes $2 from your pocket, and your pocket is short', 'bad'); return false; }
    S.pocket -= 2; st[item]--; coinPay(id, 2); S.stats.vend = (S.stats.vend || 0) + 1;
    var p = vendParts(id);
    if (p && p.tray) { var m = item === 'drink' ? drinkMesh(1) : snackMesh(1); var wp = new THREE.Vector3(); p.tray.getWorldPosition(wp); machAnim(id).drops.push({ m: m, t: 0, item: item }); m.position.set(wp.x, wp.y + 1.0, wp.z); world.group.add(m); }
    sfx('vend'); vendDisplay(id, 'THANK YOU');
    M.tray.push(item); syncVending(id); save();
    return true;
  }
  function vendTakeTray(id) {
    var M = machState(id);
    if (!M.tray.length) { toast('The tray is empty', ''); return; }
    if (hotbarFull()) { toast('Your hands are full (G puts something down)', 'bad'); return; }
    var it = M.tray.shift();
    take({ kind: it === 'drink' ? 'can2' : 'snack' });
    toast(it === 'drink' ? '🥤 Took the can out of the tray' : '🍫 Took the bar out of the tray', 'good');
    syncTray(id); save();
  }
  function updateMachines(dt) {
    unitIds('fridge').forEach(function (id) {
      var fp = fridgeParts(id); if (!fp) return;
      var A = machAnim(id), fw = machState(id).fridgeDoor ? 1 : 0;
      if (Math.abs(A.doorT - fw) > 0.002) { A.doorT = lerp(A.doorT, fw, 1 - Math.pow(0.004, dt)); if (Math.abs(A.doorT - fw) < 0.005) A.doorT = fw; fp.door.rotation.y = -1.3 * A.doorT; }
    });
    unitIds('lobbyCoffee').forEach(function (id) {
      var A = machAnim(id);
      if (A.brewT > 0) { A.brewT -= dt; if (A.brewT <= 0) { sfx('ok'); toast('☕ Ready', 'good'); } }
      var cp = coffParts(id); if (!cp || !cp.lid) return;
      var cw = machState(id).coffDoor ? 1 : 0;
      if (Math.abs(A.doorT - cw) > 0.002) { A.doorT = lerp(A.doorT, cw, 1 - Math.pow(0.004, dt)); if (Math.abs(A.doorT - cw) < 0.005) A.doorT = cw; cp.lid.rotation.x = -1.6 * A.doorT; }
    });
    unitIds('vending').forEach(function (id) {
      var p = vendParts(id); if (!p) return;
      var A = machAnim(id), want = machState(id).vendDoor ? 1 : 0;
      if (Math.abs(A.doorT - want) > 0.002) {
        A.doorT = lerp(A.doorT, want, 1 - Math.pow(0.004, dt));
        if (Math.abs(A.doorT - want) < 0.005) A.doorT = want;
        p.door.rotation.y = -1.35 * A.doorT;                      /* the door swings on its hinge */
        if (p.racks) p.racks.position.z = 0.02 + 0.3 * A.doorT;   /* and the racks ride out with it */
        if (p.flap) p.flap.rotation.x = -0.5 * A.doorT;
      }
      for (var i = A.drops.length - 1; i >= 0; i--) {
        var dp = A.drops[i]; dp.t += dt;
        dp.m.position.y -= (0.9 + dp.t * 3.2) * dt; dp.m.rotation.x += dt * 5;
        if (dp.t > 0.55) { world.group.remove(dp.m); A.drops.splice(i, 1); syncTray(id); }
      }
    });
  }
  function buildHeldMesh(h) {
    var g = new THREE.Group();
    if (WS) { var wm = WS.model('item:' + h.kind); if (wm) { g.add(wm); g.userData.wsModel = true; return g; } }   /* a pack's Blender model stands in for the whole hand-built item */
    function add(geo, mat, x, y, z, rx, ry, rz) { var m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); m.rotation.set(rx || 0, ry || 0, rz || 0); g.add(m); return m; }
    if (h.kind === 'bat') { var bw = new THREE.MeshStandardMaterial({ color: 0xb98a4a, roughness: 0.6 }); add(new THREE.CylinderGeometry(0.034, 0.022, 0.72, 10), bw, 0, 0.44, 0); add(new THREE.CylinderGeometry(0.024, 0.024, 0.16, 8), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 }), 0, 0.08, 0); add(new THREE.CylinderGeometry(0.032, 0.032, 0.02, 10), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }), 0, 0.0, 0); add(new THREE.SphereGeometry(0.036, 10, 8), bw, 0, 0.81, 0); }
    if (h.kind === 'cigs') {
      var CK = CIG_SKUS[h.sku];
      if (h.n > 2) {   /* a carton: a printed sleeve with the packs stacked inside the open end */
        add(new THREE.BoxGeometry(0.3, 0.1, 0.16), new THREE.MeshStandardMaterial({ color: CK.col, roughness: 0.6 }), 0, 0.05, 0);
        add(new THREE.BoxGeometry(0.302, 0.026, 0.162), new THREE.MeshStandardMaterial({ color: mixHex(CK.col, 0x000000, 0.3), roughness: 0.6 }), 0, 0.088, 0);
        add(new THREE.PlaneGeometry(0.24, 0.07), new THREE.MeshBasicMaterial({ map: textTex(['RF ' + (CK.type === 'light' ? 'LIGHT' : 'SMOKING'), '10 x ' + CK.size], 340, 100, { size: 34, bg: '#' + ('000000' + CK.col.toString(16)).slice(-6), color: '#' + ('000000' + CK.top.toString(16)).slice(-6), titleColor: '#' + ('000000' + CK.top.toString(16)).slice(-6), line: 'rgba(0,0,0,0)' }), transparent: true }), 0, 0.05, 0.0805);
      } else { var pk = productCigPack(CK, 1); pk.position.y = 0.045; g.add(pk); if (h.n > 1) { var pk2 = productCigPack(CK, 1); pk2.position.set(0.012, 0.04, -0.02); pk2.rotation.y = 0.24; g.add(pk2); } }
    }
    if (h.kind === 'keys') { var brassM = new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.35, metalness: 0.8 }); var ring = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.005, 8, 18), brassM); ring.rotation.x = Math.PI / 2; ring.position.set(0, 0.04, 0); g.add(ring); for (var ky = 0; ky < 3; ky++) { var ang = -0.5 + ky * 0.5; var blade = add(new THREE.BoxGeometry(0.012, 0.055, 0.004), ky === 1 ? new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.4, metalness: 0.7 }) : brassM, Math.sin(ang) * 0.03, -0.012, Math.cos(ang) * 0.03); blade.rotation.y = ang; add(new THREE.BoxGeometry(0.02, 0.018, 0.004), brassM, Math.sin(ang) * 0.03, -0.042, Math.cos(ang) * 0.03).rotation.y = ang; } }
    if (WEAPONS[h.kind]) {   // built with the muzzle along -z, straight out from the camera
      var gBlk = new THREE.MeshStandardMaterial({ color: 0x17181b, roughness: 0.45, metalness: 0.5 }), gWood = new THREE.MeshStandardMaterial({ color: 0x5a3a1e, roughness: 0.7 });
      if (h.kind === 'pistol') { add(new THREE.BoxGeometry(0.035, 0.045, 0.2), gBlk, 0, 0.05, -0.06); add(new THREE.BoxGeometry(0.032, 0.11, 0.045), gBlk, 0, -0.02, 0.02, 0.25); add(new THREE.BoxGeometry(0.01, 0.012, 0.01), gBlk, 0, 0.078, -0.15); }
      else if (h.kind === 'shotgun') { add(new THREE.CylinderGeometry(0.014, 0.014, 0.6, 10), gBlk, 0, 0.055, -0.32, Math.PI / 2); add(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 8), gBlk, 0, 0.025, -0.24, Math.PI / 2); add(new THREE.BoxGeometry(0.04, 0.065, 0.26), gBlk, 0, 0.04, 0.02); add(new THREE.BoxGeometry(0.046, 0.042, 0.15), gWood, 0, 0.02, -0.26); add(new THREE.BoxGeometry(0.036, 0.09, 0.26), gWood, 0, 0.01, 0.27, -0.12); }
      else if (h.kind === 'ak') { add(new THREE.BoxGeometry(0.042, 0.062, 0.26), gBlk, 0, 0.045, -0.05); add(new THREE.CylinderGeometry(0.009, 0.009, 0.32, 10), gBlk, 0, 0.055, -0.34, Math.PI / 2); add(new THREE.BoxGeometry(0.036, 0.028, 0.17), gWood, 0, 0.085, -0.25); add(new THREE.BoxGeometry(0.046, 0.046, 0.19), gWood, 0, 0.03, -0.26); add(new THREE.BoxGeometry(0.008, 0.035, 0.012), gBlk, 0, 0.09, -0.47); add(new THREE.BoxGeometry(0.03, 0.12, 0.062), gBlk, 0, -0.035, -0.1, 0.22); add(new THREE.BoxGeometry(0.03, 0.09, 0.056), gBlk, 0, -0.125, -0.135, 0.5); add(new THREE.BoxGeometry(0.032, 0.1, 0.042), gWood, 0, -0.03, 0.06, 0.3); add(new THREE.BoxGeometry(0.036, 0.08, 0.25), gWood, 0, 0.012, 0.24, -0.1); }
      else if (h.kind === 'rifle') { add(new THREE.CylinderGeometry(0.01, 0.012, 0.74, 10), gBlk, 0, 0.055, -0.42, Math.PI / 2); add(new THREE.BoxGeometry(0.038, 0.06, 0.22), gBlk, 0, 0.045, -0.02); add(new THREE.BoxGeometry(0.044, 0.05, 0.36), gWood, 0, 0.02, -0.2); add(new THREE.BoxGeometry(0.038, 0.1, 0.26), gWood, 0, 0.0, 0.25, -0.15); add(new THREE.CylinderGeometry(0.019, 0.019, 0.24, 12), gBlk, 0, 0.11, -0.05, Math.PI / 2); add(new THREE.CylinderGeometry(0.025, 0.02, 0.04, 12), gBlk, 0, 0.11, -0.18, Math.PI / 2); add(new THREE.BoxGeometry(0.012, 0.04, 0.012), gBlk, 0, 0.08, -0.1); add(new THREE.BoxGeometry(0.012, 0.04, 0.012), gBlk, 0, 0.08, 0.02); add(new THREE.BoxGeometry(0.008, 0.03, 0.03), gBlk, 0.024, 0.06, 0.04); }
      else if (h.kind === 'taser') { add(new THREE.BoxGeometry(0.042, 0.06, 0.15), new THREE.MeshStandardMaterial({ color: 0xf2c21a, roughness: 0.6 }), 0, 0.04, -0.04); add(new THREE.BoxGeometry(0.036, 0.1, 0.042), gBlk, 0, -0.03, 0.02, 0.2); add(new THREE.BoxGeometry(0.044, 0.035, 0.02), gBlk, 0, 0.04, -0.125); }
      else if (h.kind === 'pepper') { add(new THREE.CylinderGeometry(0.022, 0.022, 0.11, 12), new THREE.MeshStandardMaterial({ color: 0xc0281e, roughness: 0.5 }), 0, 0.04, 0); add(new THREE.CylinderGeometry(0.018, 0.02, 0.03, 10), gBlk, 0, 0.11, 0); add(new THREE.BoxGeometry(0.012, 0.012, 0.02), gBlk, 0, 0.115, -0.02); }
    }
    else if (h.kind === 'crate') { add(new THREE.BoxGeometry(0.34, 0.24, 0.3), new THREE.MeshStandardMaterial({ color: 0xc9a96a, roughness: 0.9 })); add(new THREE.BoxGeometry(0.35, 0.03, 0.31), new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.9 })); var cl = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.08), new THREE.MeshBasicMaterial({ map: textTex([itemIcon(h.item) + ' ' + itemName(h.item)], 200, 80, { size: 30, bg: '#f3e9cf', color: '#222', titleColor: '#222', line: 'rgba(0,0,0,0)' }) })); cl.position.set(0, 0, 0.151); g.add(cl); }
    else if (h.kind === 'can') { var cm = new THREE.MeshStandardMaterial({ color: 0x3a8fd6, roughness: 0.45, metalness: 0.35 }); add(new THREE.CylinderGeometry(0.075, 0.085, 0.17, 16), cm); add(new THREE.CylinderGeometry(0.01, 0.016, 0.2, 8), cm, 0.11, 0.08, 0, 0, 0, -0.95); add(new THREE.CylinderGeometry(0.03, 0.02, 0.03, 10), cm, 0.19, 0.145, 0, 0, 0, -0.95); add(new THREE.TorusGeometry(0.065, 0.009, 8, 16, Math.PI), cm, 0, 0.085, 0); }
    else if (h.kind === 'cup2') { var cc = cupMesh(1.4, true); cc.position.y = 0.02; g.add(cc); }
    else if (h.kind === 'cupWater') { var cw = cupMesh(1.2, false); cw.position.y = 0.02; g.add(cw); var wd = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.006, 14), new THREE.MeshPhysicalMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.7, roughness: 0.1 })); wd.position.y = 0.075; g.add(wd); }
    else if (h.kind === 'cupEmpty') { var ce = cupMesh(1.2, false); ce.position.y = 0.02; ce.rotation.z = 0.25; g.add(ce); }
    else if (h.kind === 'canEmpty') { var cn = drinkMesh(1.5); cn.position.y = 0.02; cn.rotation.z = 0.5; cn.scale.y = 0.85; g.add(cn); }
    else if (h.kind === 'trashbag') { var bag = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), colorMat(0x15171a, 0.7)); bag.scale.set(1, 0.8, 0.9); bag.position.y = 0.05; g.add(bag); var knot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), colorMat(0x15171a, 0.7)); knot.position.y = 0.2; g.add(knot); }
    else if (h.kind === 'can2') { var cm2 = drinkMesh(1.5); cm2.position.y = 0.02; g.add(cm2); }
    else if (h.kind === 'snack') {
      // a wrapped bar: flow-wrap film, crimped ends, a printed face
      var wrapM = new THREE.MeshStandardMaterial({ color: 0x6b2f8a, roughness: 0.45, metalness: 0.25 });
      add(new THREE.BoxGeometry(0.135, 0.022, 0.058), wrapM);
      [-1, 1].forEach(function (e) { var cr = add(new THREE.BoxGeometry(0.022, 0.026, 0.062), wrapM, e * 0.077, 0, 0); cr.scale.y = 0.5; for (var f = 0; f < 3; f++) add(new THREE.BoxGeometry(0.02, 0.002, 0.062), new THREE.MeshStandardMaterial({ color: 0x4e2166, roughness: 0.6 }), e * 0.077, -0.004 + f * 0.005, 0); });
      add(new THREE.PlaneGeometry(0.115, 0.05), new THREE.MeshBasicMaterial({ map: textTex(['GROW BAR', 'milk chocolate'], 280, 120, { size: 40, bg: '#6b2f8a', color: '#e8d6f2', titleColor: '#ffd166', line: 'rgba(0,0,0,0)' }), transparent: true }), 0, 0.0121, 0, -Math.PI / 2, 0, 0);
    }
    else if (h.kind === 'broom') { var bg2 = new THREE.Group(); bg2.rotation.z = 0.35; bg2.position.set(0.05, -0.05, 0); g.add(bg2); function badd(geo, mat, x, y, z) { var m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); bg2.add(m); return m; } badd(new THREE.CylinderGeometry(0.014, 0.016, 1.1, 10), MAT.wood, 0, 0.1, 0); badd(new THREE.CylinderGeometry(0.018, 0.018, 0.14, 10), colorMat(0xc94a3a, 0.8), 0, 0.6, 0); badd(new THREE.CylinderGeometry(0.022, 0.018, 0.05, 10), MAT.chrome, 0, -0.44, 0); badd(new THREE.BoxGeometry(0.07, 0.05, 0.32), MAT.darkwood, 0, -0.48, 0); for (var bk = 0; bk < 14; bk++) badd(new THREE.BoxGeometry(0.012, 0.2, 0.012), colorMat(bk % 2 ? 0xb8925a : 0xa8843f, 1), 0, -0.6, -0.145 + bk * 0.0225); }
    else if (h.kind === 'soil') { g.add(productSoilSack(1)); }
    else if (h.kind === 'nutrients') { g.add(productNutrientBottle(1)); }
    else if (h.kind === 'remedy') { g.add(productSprayBottle(1)); }
    else if (h.kind === 'seed') { var sp2 = productSeedPacket(strainById(h.strain), 1); sp2.rotation.x = -0.3; g.add(sp2); }
    else if (h.kind === 'harvest') { var st = strainById(h.strain); var cola = budCola(st, 1); cola.position.y = -0.01; g.add(cola); [[0.045, -0.055, 0.02, -0.5, 0.4], [-0.052, -0.04, -0.02, -0.4, -0.6], [0.01, -0.07, -0.04, -0.7, 1.4]].forEach(function (L) { add(new THREE.PlaneGeometry(0.11, 0.2), MAT.leaf, L[0], L[1], L[2], L[3], L[4], 0); }); }
    else if (h.kind === 'jar') {
      var jst = strainById(h.strain || 'sunflower'), fill = clamp(h.grams / 24, 0.25, 1);
      add(new THREE.CylinderGeometry(0.06, 0.06, 0.14, 16), MAT.jar);
      add(new THREE.CylinderGeometry(0.062, 0.062, 0.012, 16), MAT.jarLid, 0, 0.066, 0);   /* screw collar under the lid */
      add(new THREE.CylinderGeometry(0.065, 0.065, 0.022, 16), MAT.jarLid, 0, 0.081, 0);
      for (var jb = 0; jb < Math.round(3 + fill * 6); jb++) { var ja = jb * 2.399, jr = 0.026 * Math.sqrt((jb % 5) / 5 + 0.2); var nug = add(new THREE.IcosahedronGeometry(0.016 + (jb % 3) * 0.004, 0), new THREE.MeshStandardMaterial({ color: jb % 4 === 0 ? mixHex(jst.bud, 0x30401f, 0.35) : jst.bud, roughness: 0.9 }), Math.cos(ja) * jr, -0.062 + (jb % 4) * 0.016 * fill + 0.01, Math.sin(ja) * jr); nug.scale.set(1, 0.82, 1); nug.rotation.set(ja, ja * 1.7, 0.3); }
      add(new THREE.PlaneGeometry(0.075, 0.032), new THREE.MeshBasicMaterial({ map: textTex([jst.name], 220, 94, { size: 30, bg: '#f4efdf', color: '#2a2a2a', titleColor: '#2a2a2a', line: 'rgba(0,0,0,0)' }), transparent: true }), 0, -0.012, 0.0605);
    }
    else if (h.kind === 'cookies') {
      // a greaseproof sheet with cookies on it, chocolate chips and all
      var doughM = new THREE.MeshStandardMaterial({ color: 0xc08a4a, roughness: 0.95 }), chipM = new THREE.MeshStandardMaterial({ color: 0x4a2c1a, roughness: 0.8 });
      add(new THREE.BoxGeometry(0.21, 0.006, 0.115), new THREE.MeshStandardMaterial({ color: 0xf2ece0, roughness: 1 }), 0, -0.014, 0);
      for (var ck = 0; ck < Math.min(h.n, 6); ck++) {
        var cx2 = (ck % 3) * 0.062 - 0.062, cz2 = Math.floor(ck / 3) * 0.05 - 0.025;
        var ckm = add(new THREE.CylinderGeometry(0.027, 0.024, 0.011, 14), doughM, cx2, -0.004, cz2, 0, ck * 0.5, 0); ckm.scale.y = 1;
        for (var ch = 0; ch < 4; ch++) { var cang = ch * 1.9 + ck; add(new THREE.SphereGeometry(0.004, 6, 5), chipM, cx2 + Math.cos(cang) * 0.014, 0.002, cz2 + Math.sin(cang) * 0.014); }
      }
    }
    else if (h.kind === 'joints') {
      // a joint is a tapered cone of paper, not a stick: card roach, a body that widens, a twisted tail and a scorched tip
      var paperM = new THREE.MeshStandardMaterial({ color: 0xf7f3e6, roughness: 0.95 }), roachM = new THREE.MeshStandardMaterial({ color: 0xc19a63, roughness: 0.9 }), ashM = new THREE.MeshStandardMaterial({ color: 0x3a3330, roughness: 1 });
      var jn = Math.min(h.n, 5);
      for (var j = 0; j < jn; j++) { var jg = productJoint(1); jg.position.set((j - (jn - 1) / 2) * 0.017, (j % 2) * 0.005, (j % 3) * 0.005); jg.rotation.set(0.16, (j - 2) * 0.06, 0.09 + (j % 2) * 0.04); g.add(jg); }
      if (h.n > 5) { add(new THREE.BoxGeometry(0.098, 0.032, 0.056), new THREE.MeshStandardMaterial({ color: 0x1f2a22, roughness: 0.8 }), 0, -0.052, 0); add(new THREE.BoxGeometry(0.1, 0.009, 0.058), new THREE.MeshStandardMaterial({ color: 0x6fdc8c, roughness: 0.55 }), 0, -0.037, 0); }
    }
    else if (h.kind === 'bags') {
      // a zip-lock with bud actually inside it, a white zip strip and a printed strain label
      var bst = strainById(h.strain || 'sunflower');
      var filmM = new THREE.MeshStandardMaterial({ color: 0xeef7f0, roughness: 0.12, transparent: true, opacity: 0.4 });
      var zipM = new THREE.MeshStandardMaterial({ color: 0xf7fbf8, roughness: 0.5 });
      var nugM = new THREE.MeshStandardMaterial({ color: bst.bud, roughness: 0.9 });
      for (var b = 0; b < Math.min(h.n, 3); b++) { var bg3 = productBaggie(bst, 1); bg3.position.set(b * 0.006, b * 0.021, -b * 0.012); bg3.rotation.set(-0.12, b * 0.14 - 0.14, b * 0.05); g.add(bg3); }
    }
    return g;
  }
  function syncHands(dt) {
    var h = held(); var key = h ? h.kind + ':' + (h.n || 0) + ':' + (h.strain || '') + ':' + (h.grams || 0) : '';
    if (key !== heldKey) { heldKey = key; if (heldMesh) { hands.remove(heldMesh); if (!heldMesh.userData.wsModel) disposeTree(heldMesh); } heldMesh = null;   /* a pack's Blender model shares its meshes with the loaded copy, so only hand-built items are freed */ if (h) { heldMesh = buildHeldMesh(h); heldMesh.position.set(0.3, -0.3, -0.52); heldMesh.rotation.set(0.2, -0.5, 0); hands.add(heldMesh); } }
    hands.visible = ui.started && !!h && !drive.on && scope.k < 0.6;
    if (heldMesh && h && WEAPONS[h.kind]) { var rc = swing.t > 0 ? Math.sin((1 - clamp(swing.t / 0.35, 0, 1)) * Math.PI) : 0; if (swing.t > 0) swing.t -= dt; var kick = WEAPONS[h.kind].lethal ? 1 : 0.3; heldMesh.position.set(0.24, -0.24 + rc * 0.03 * kick, -0.5 + rc * 0.09 * kick); heldMesh.rotation.set(rc * 0.45 * kick, 0, 0); }
    if (world.muzzleT > 0) { world.muzzleT -= dt; muzzle.intensity = 3; } else muzzle.intensity = 0;
    if (heldMesh && h && h.kind === 'bat') { var sw = swing.t > 0 ? Math.sin((1 - clamp(swing.t / 0.35, 0, 1)) * Math.PI) : 0; if (swing.t > 0) swing.t -= dt; heldMesh.position.set(0.36 - sw * 0.42, -0.46 + sw * 0.1, -0.5 - sw * 0.15); heldMesh.rotation.set(-0.6 + sw * 1.5, -0.2 - sw * 0.3, -0.45 - sw * 0.9); }   // held upright over the right shoulder, swung across the view
    var sway = Math.sin(player.bobT) * 0.008, dip = Math.abs(Math.cos(player.bobT)) * 0.008;
    hands.position.set(sway, -dip, 0);
    handL.visible = !!h && (h.kind === 'harvest' || h.kind === 'jar' || h.kind === 'soil');
  }
  function take(item) { var i = freeSlot(); if (i < 0) { toast('Your hands are full. G puts something down, 1 to 6 picks a slot.', 'bad'); return false; } S.hotbar[i] = item; S.slot = i; sfx(item.kind === 'crate' ? 'crate' : 'pickup'); return true; }   /* hands only: the hand mesh follows the hotbar every frame, and a caller that takes from a shelf, the rack or storage flags that part itself */
  function putBack() {
    var h = held(); if (!h) return;
    if (h.kind === 'joints') { lotAdd('joints', h.strain || 'sunflower', h.n, h.qSum / h.n, h.thcSum / h.n); toast('Put the joints back on the shelf', ''); }
    else if (h.kind === 'bags') { lotAdd('bags', h.strain || 'sunflower', h.n, h.qSum / h.n, h.thcSum / h.n); toast('Put the bags back on the shelf', ''); }
    else if (h.kind === 'cookies') { lotAdd('cookies', h.strain || 'sunflower', h.n, h.qSum / h.n, h.thcSum / h.n); toast('Put the cookies back on the shelf', ''); }
    else if (h.kind === 'soil' || h.kind === 'nutrients' || h.kind === 'remedy') { S.supplies[h.kind] = (S.supplies[h.kind] || 0) + 1; toast('Back on the rack', ''); }
    else if (h.kind === 'seed') { S.supplies['seed_' + h.strain] = (S.supplies['seed_' + h.strain] || 0) + 1; toast('Back on the rack', ''); }
    else if (h.kind === 'jar') { S.batches.push({ id: h.bid, grams: h.grams, quality: h.quality, baseQ: h.baseQ, thc: h.thc, startedAt: h.startedAt, cured: true, strain: h.strain }); toast('Jar back on the shelf', ''); }
    else if (h.kind === 'harvest') { toast('A fresh harvest can\'t go back on a shelf. Hang it on the drying line in the dry room.', 'bad'); return; }
    else if (h.kind === 'can') { toast('Put the can down', ''); }
    else if (h.kind === 'broom') { toast('Broom back on the hook', ''); }
    else if (h.kind === 'snack') { toast('Left the snack for later', ''); }
    else if (h.kind === 'crate') { S.storage[h.item] = (S.storage[h.item] || 0) + h.n; toast('Crate back in the back room', ''); }
    else if (h.kind === 'keys') { toast('🔑 Keyring back on its hook in the office', ''); setTimeout(syncKeyHook, 0); }   /* the hotbar slot clears just after this, so re-read it on the next tick */
    else if (h.kind === 'bat') { toast('Bat back by the counter', ''); if (world.batMesh) world.batMesh.visible = true; }
    else if (WEAPONS[h.kind]) { toast('The ' + WEAPONS[h.kind].name + ' is back in the weapon locker', ''); }
    else if (h.kind === 'cigs') { S.cigStock[h.sku] = cigStock(h.sku) + h.n; syncCigCab(); toast('Packs back in the cigarette cabinet', ''); }
    S.held = null; sfx('putdown');
    if (h.kind === 'joints' || h.kind === 'bags' || h.kind === 'cookies' || h.kind === 'jar') world.dirtyShelf = true; else if (h.kind === 'soil' || h.kind === 'nutrients' || h.kind === 'remedy' || h.kind === 'seed') world.dirtyRack = true; else if (h.kind === 'crate') world.dirtyStorage = true;   /* only the place it went back to is redrawn */
  }
  // give the customer what is in your hands; pays when the order is complete
  function orderLines(c) { if (!c.lines) { c.lines = [{ kind: c.want, strain: c.strain, qty: c.qty, given: c.given || { n: 0, qSum: 0, thcSum: 0 } }]; c.given = c.lines[0].given; } return c.lines; }
  function lineText(l) { return (l.qty - (l.given ? l.given.n : 0)) + ' ' + (l.strain ? strainById(l.strain).name + ' ' : '') + kindName(l.kind, l.qty - (l.given ? l.given.n : 0)); }
  function handOver() {
    var c = S.customer, h = held(); if (!c || !h) return;
    if (h.kind === 'cigs') { handCigs(c, h); return; }
    if (c.stage) { toast(c.who + ' is paying. Take the money at the till.', ''); return; }
    var lines = orderLines(c); var open = lines.filter(function (l) { return l.kind === h.kind && l.given.n < l.qty; });
    if (!open.length) { var still = lines.filter(function (l) { return l.given.n < l.qty; }); toast(c.who + ' wants ' + still.map(lineText).join(' and ') + ', not that', 'bad'); npc.say(custLine(c.who, 'wrong', still.map(lineText).join(' and ')), '#ff6b6b'); return; }
    var line = open.filter(function (l) { return l.strain === h.strain; })[0] || open[0]; var main = line === lines[0];
    if (main && c.strain && h.strain && h.strain !== c.strain) {
      if (c.premium) { toast(c.who + ' only wants ' + strainById(c.strain).name, 'bad'); npc.say(custLine(c.who, 'said', strainById(c.strain).name), '#ff6b6b'); return; }
      if (!c.subbed) { c.subbed = true; toast(c.who + ' takes the ' + strainById(h.strain).name + ' instead, at 15% off', ''); npc.say(custLine(c.who, 'sub'), '#ffc857'); }
    } else if (main && c.strain && h.strain === c.strain && !c.matched) { c.matched = true; npc.say(custLine(c.who, 'match', strainById(c.strain).name), '#6fdc8c'); }
    var need = line.qty - line.given.n; var give = Math.min(need, h.n); var q = h.qSum / h.n, thc = h.thcSum / h.n;
    if (c.premium && q < c.minQ) { toast('They want quality ' + c.minQ + ' or better', 'bad'); npc.say(custLine(c.who, 'better'), '#ffc857'); return; }
    line.given.n += give; line.given.qSum += q * give; line.given.thcSum += thc * give;
    h.n -= give; h.qSum -= q * give; h.thcSum -= thc * give; if (h.n <= 0) S.held = null;
    sfx('rustle'); var left = lines.filter(function (l) { return l.given.n < l.qty; });
    if (left.length) { toast('Handed over ' + give + '. Still to go: ' + left.map(lineText).join(' and '), ''); npc.say(custLine(c.who, 'andMore', left.map(lineText).join(' and ')), '#6fdc8c'); return; }
    // everything handed over: price the lines, add whatever they wanted from the counter display, then they pay
    var mult = (c.premium ? 2.2 : 1.15) * (c.subbed ? 0.85 : c.strain && c.matched ? 1.1 : 1); var total = 0;
    lines.forEach(function (l) { var aq2 = l.given.qSum / l.given.n, at2 = l.given.thcSum / l.given.n; total += unitPrice(l.kind, aq2, at2) * l.qty * mult; });
    var aq = lines[0].given.qSum / lines[0].given.n; var missing = [];
    (c.acc || []).forEach(function (a2) { if (a2.ok === true) { total += ACC[a2.item].price * a2.qty; } else if (a2.ok === false) { missing.push(ACC[a2.item].name); } else if ((S.display[a2.item] || 0) >= a2.qty) { S.display[a2.item] -= a2.qty; a2.ok = true; total += ACC[a2.item].price * a2.qty; S.stats.acc = (S.stats.acc || 0) + a2.qty; syncDisplay(); } else { a2.ok = false; missing.push(ACC[a2.item].name); } });
    total += cigTotal(c);
    if (missing.length && !c.saidNo) { npc.say(custLine(c.who, 'noAcc', missing.join(' or ')), '#ffc857'); logEvent('🛒 ' + c.who + ' wanted a ' + missing.join(' and a ') + ', but the counter display was empty', ''); }
    var rep = c.premium ? randi(8, 16) : randi(1, 4) + Math.round(aq / 25); if (S.upgrades.lounge2) rep += 2; else if (S.upgrades.lobby) rep += 1; if (c.matched && !c.subbed) rep += 1;
    if (dustList().length >= 8) { rep = Math.max(0, rep - 2); toast('🧹 "Bit dusty in here…" (rep -2)', 'bad'); }
    c.qty = lines.reduce(function (s2, l) { return s2 + l.qty; }, 0);
    c.due = Math.max(1, Math.round(total)); c.rep = rep; c.stage = 'pay'; c.changeGiven = 0; c.until = now() + 60000; if (!c.pay) c.pay = 'cash';
    if (c.pay === 'cash') c.tendered = tenderFor(c.due);
    npc.say(c.pay === 'card' ? custLine(c.who, 'card', money(c.due)) : custLine(c.who, 'cash', money(c.tendered)), '#ffc857');
    toast('💵 ' + c.who + ' is paying by ' + c.pay + '. Take it at the till.', ''); hud();
  }
  // what a cash customer holds out: sometimes exact, usually the next round note above the total
  function accIcon(id) { return { lighter: '🔥', rpaper: '📄', rgrinder: '⚙️' }[id] || (supplyById(id) && supplyById(id).ico) || '🛒'; }
  function kindIcon(k) { return { bags: '🛍️', joints: '🚬', cookies: '🍪' }[k] || '📦'; }
  // the order as separate rows: main lines with given/qty, then the counter-display extras
  function orderRows(c) {
    var rows = orderLines(c).map(function (l) { var gv = l.given ? l.given.n : 0; return { icon: kindIcon(l.kind), text: l.qty + ' × ' + (l.strain ? strainById(l.strain).name + ' ' : '') + kindName(l.kind, l.qty), done: gv >= l.qty, sub: gv + ' / ' + l.qty + ' handed', kind: l.kind }; });
    (c.acc || []).forEach(function (a2) { rows.push({ icon: accIcon(a2.item), text: a2.qty + ' × ' + ACC[a2.item].name, done: a2.ok === true, missed: a2.ok === false, sub: a2.ok === true ? 'took it from the counter display' : a2.ok === false ? 'the counter display was empty' : 'helps themselves from the counter display', acc: true }); }); if (c.cig) rows.push({ icon: '🚬', text: c.cig.qty + ' × ' + CIG_SKUS[c.cig.sku].name, done: c.cig.given >= c.cig.qty, missed: false, sub: c.cig.given >= c.cig.qty ? 'handed over' : 'from the cigarette cabinet: hand it over yourself', acc: true });
    return rows;
  }
  function orderTicketHtml(c) {
    var left = Math.max(0, Math.round((c.until - now()) / 1000)), total = c.stage ? 60 : (c.premium ? 75 : 60) * (S.upgrades.lounge2 ? 2 : S.upgrades.lobby ? 1.5 : 1);
    var h = '<div class="head"><span class="av">' + c.avatar + '</span><span class="who">' + esc(c.who) + (c.premium ? ' 🎩' : '') + '</span><span class="t' + (left < 15 ? ' late' : '') + '">' + (c.arrived || c.stage ? left + ' s' : 'ID check') + '</span></div>';
    h += '<div class="bar"><i style="width:' + Math.round(Math.min(100, left / total * 100)) + '%"></i></div>';
    if (c.idPending) return h + '<div class="row"><span class="ic">🪪</span><span class="tx">holding out their ID: <b>E</b> checks it</span></div>';
    if (!c.arrived && !c.stage) return h + '<div class="row"><span class="ic">🪪</span><span class="tx">coming through the ID check…</span></div>';
    orderRows(c).forEach(function (r) { h += '<div class="row' + (r.done ? ' done' : '') + (r.missed ? ' miss' : '') + '"><span class="ic">' + r.icon + '</span><span class="tx">' + esc(r.text) + '<small>' + esc(r.sub) + '</small></span><span class="ck">' + (r.done ? '✓' : r.missed ? '✗' : '') + '</span></div>'; });
    if (c.premium && !c.stage) h += '<div class="note">🎩 quality ' + c.minQ + '+ only · pays 2.2×</div>';
    if (c.stage) h += '<div class="note pay">' + (c.pay === 'card' ? '💳 pays by card · ' + money(c.due) : '💵 holds out ' + money(c.tendered) + ' for ' + money(c.due) + (c.tendered > c.due ? ' · change ' + money(c.tendered - c.due) : '')) + '<br>take it at the till</div>';
    return h;
  }
  function idCard(c) {
    var id = c.id; if (!id) return;
    var sub = id.by === 'guard' ? 'the guard passed this one' : 'they\'re holding it out to you';
    var lines = [
      { label: '🪪 ' + id.who + ' · ' + id.age + ' years old', cls: 'flat' },
      { label: '№ ' + id.no + (id.by === 'guard' ? ' · checked at the door' : ''), cls: 'flat' }
    ];
    if (!id.ok) lines.push({ label: '⚠ ' + idFlawText(id), cls: 'flat' });
    else lines.push({ label: 'Nothing wrong with it as far as you can see', cls: 'flat' });
    lines.push({ label: '✅ Serve them', act: function () { idAccept(c); } });
    lines.push({ label: '🚫 Refuse and show them out', act: function () { idRefuse(c); } });
    ctxOpen('🪪 ' + c.who + "'s ID", sub, lines);
  }
  function idAccept(c) {
    c.idPending = false; c.idDodgy = false; c.id.by = 'you';
    if (!c.id.ok) {
      addHeat(12); S.rep = Math.max(0, S.rep - 4);
      toast('🪪 You served on a bad ID. That\'s on you now (heat +12, rep -4)', 'bad');
      logEvent('🪪 Served ' + c.who + ' on an ID that was ' + ID_FLAWS[c.id.flaw].why + ' (heat +12, rep -4)', 'bad');
      if (Math.random() < 0.3) policeFine('Serving on an invalid ID');
    } else { sfx('ok'); toast('🪪 ID checks out', 'good'); }
    hud(); save();
  }
  function idRefuse(c) {
    c.idPending = false;
    if (!c.id.ok) { S.rep += 2; S.stats.idCaught = (S.stats.idCaught || 0) + 1; sfx('ok'); toast('🪪 Good catch (rep +2)', 'good'); logEvent('🪪 Refused ' + c.who + ': ' + ID_FLAWS[c.id.flaw].why + ' (rep +2)', 'good'); }
    else { S.rep = Math.max(0, S.rep - 3); toast('🪪 Their ID was fine (rep -3)', 'bad'); logEvent('🪪 Refused ' + c.who + ' over a perfectly good ID (rep -3)', 'bad'); }
    npc.leaveSad(); S.customer = null; hud(); save();
  }
  function wantText(c) { var lines = orderLines(c); var t = lines.map(function (l) { return l.qty + ' ' + (l.strain ? strainById(l.strain).name + ' ' : '') + kindName(l.kind, l.qty); }).join(', '); if (c.acc && c.acc.length) t += ' and a ' + c.acc.map(function (a2) { return ACC[a2.item].name; }).join(', a '); if (c.cig) t += ' and ' + c.cig.qty + ' × ' + CIG_SKUS[c.cig.sku].name; return t; }
  function tenderFor(due) { var opts = []; [5, 10, 20, 50, 100].forEach(function (d) { var v = Math.ceil(due / d) * d; if (v > due && v - due < 60) opts.push(v); }); return (Math.random() < 0.3 || !opts.length) ? due : pick(opts); }
  function finalizeSale(extraRep, note) {
    var c = S.customer; if (!c || !c.stage) return;
    var total = c.due; var rep = Math.max(0, c.rep + (extraRep || 0));
    var cq = orderLines(c).reduce(function (a, l) { a.q += l.given.qSum; a.n += l.given.n; return a; }, { q: 0, n: 0 }); if (cq.n && cupRep(1, cq.q / cq.n) > 1) { rep *= 2; note = (note ? note + ' · ' : '') + 'the Cup doubles the rep'; }
    if (c.pay === 'card') S.bank += Math.round(total * (S.upgrades.fintech ? 1.03 : 1)); else S.till += c.tendered - c.changeGiven;   // card settles straight to the bank, cash sits in the drawer
    if (c.matched && !c.subbed && Math.random() < 0.35) { var tipAmt = randi(1, 3) * (S.upgrades.tipjar ? 2 : 1); S.tips += tipAmt; logEvent('🫙 ' + c.who + ' dropped ' + money(tipAmt) + ' in the tip jar', ''); }
    S.stats.sold += c.qty; bookSale(total); S.rep += rep; gainXp(Math.round(total / 8));
    if (c.id && !c.id.ok && (c.idDodgy || c.idPending)) {   /* waved through on a bad card and nobody caught it: the sale is on you, same as serving it knowingly */
      c.idDodgy = false; c.idPending = false; addHeat(12); S.rep = Math.max(0, S.rep - 4);
      logEvent('🪪 Sold to ' + c.who + ' on an ID that was ' + ID_FLAWS[c.id.flaw].why + ' (heat +12, rep -4)', 'bad');
      toast('🪪 ' + c.who + ' was served on a bad ID (heat +12, rep -4)', 'bad');
      if (Math.random() < 0.3) policeFine('Serving on an invalid ID');
    }
    var soldTxt = orderLines(c).filter(function (l) { return l.given.n > 0; }).map(function (l) { return l.given.n + ' ' + kindName(l.kind, l.given.n); }).join(' and ') + (c.cig && c.cig.given ? ' and ' + c.cig.given + ' × ' + CIG_SKUS[c.cig.sku].name : '');   /* every line of the order, counted as handed over */
    logEvent('💵 Sold ' + soldTxt + ' to ' + c.who + ' for ' + money(total) + ' by ' + c.pay + (note ? ' · ' + note : '') + ' (rep +' + rep + ')', c.premium ? 'rare' : 'good');
    toast('💵 ' + money(total) + ' (rep +' + rep + ')' + (note ? ' · ' + note : ''), 'good'); sfx('cash'); registerSale(c.who + ' ' + money(total));
    burst(npc.g.position.x, 1.4, npc.g.position.z - 0.3, 0xffd766, 40, 'up');
    if (!npc.goLobby(planFor(c))) npc.leaveHappy();   // maybe a drink, a coffee or a smoke on the bench first
    S.customer = null;
    if (ui.panelOpen && ui.panelKind === 'register') ui.closePanel();   // the sale is done: drop the register pane and hand the pointer back
  }
  var payActions = {
    payCard: function () { var c = S.customer; if (!c || c.stage !== 'pay' || c.pay !== 'card') return; sfx('card'); if (!c.declined && Math.random() < 0.1) { c.declined = true; sfx('bad'); toast('💳 Declined. Try it again.', 'bad'); npc.say(custLine(c.who, 'declined'), '#ff6b6b'); return; } toast('💳 Approved', 'good'); finalizeSale(0, ''); },
    payCash: function () { var c = S.customer; if (!c || c.stage !== 'pay' || c.pay !== 'cash') return; sfx('drawer'); if (c.tendered === c.due) { finalizeSale(1, 'exact cash'); return; } c.stage = 'change'; c.changeGiven = 0; toast('Took ' + money(c.tendered) + '. Now count out the change.', ''); },
    chg: function (d) { var c = S.customer; if (!c || c.stage !== 'change') return; c.changeGiven = Math.min(c.changeGiven + d, c.tendered); sfx(d >= 5 ? 'rustle' : 'coins'); },
    chgUndo: function () { var c = S.customer; if (!c || c.stage !== 'change') return; c.changeGiven = 0; },
    chgGive: function () {
      var c = S.customer; if (!c || c.stage !== 'change') return; var due = c.tendered - c.due;
      if (c.changeGiven < due) { sfx('bad'); toast('That\'s ' + money(due - c.changeGiven) + ' short, and ' + c.who + ' isn\'t leaving without it', 'bad'); npc.say(custLine(c.who, 'short'), '#ff6b6b'); return; }
      if (c.changeGiven > due) { finalizeSale(2, 'gave ' + money(c.changeGiven - due) + ' too much change ("cheers for the tip")'); return; }
      finalizeSale(1, 'exact change');
    }
  };
  // walk-up sale at the register: a cash sale to nobody in particular, so it pays under the board price and the till takes only so many a day
  var WALKUP_RATE = 0.85, WALKUP_CAP = 12;
  function starterCost() { var d = supplyDisc(); return Math.round(supplyById('soil').price * d) + Math.round(strainById('sunflower').seed * d) + Math.round(supplyById('nutrients').price * d); }   /* what the three buys really cost, discounts and all, so the button and the check agree */
  function walkupLeft() { return S.regDay !== (S.day || 1) ? WALKUP_CAP : Math.max(0, WALKUP_CAP - (S.regSold || 0)); }
  function sellHeld() {
    var h = held(); if (!h || (h.kind !== 'joints' && h.kind !== 'bags' && h.kind !== 'cookies')) { toast('Bring bags, joints or cookies to the till to sell', 'bad'); return; }
    if (S.regDay !== (S.day || 1)) { S.regDay = S.day || 1; S.regSold = 0; }
    var room = walkupLeft(); if (room <= 0) { sfx('bad'); toast('🧾 The till is closed to walk-ups until tomorrow. Serve the customers at the window instead', 'bad'); return; }
    var kind = h.kind, n = Math.min(h.n, room), q = h.qSum / h.n, thc = h.thcSum / h.n; var each = unitPrice(kind, q, thc) * WALKUP_RATE; var total = each * n;
    S.till += total; S.stats.sold += n; S.regSold = (S.regSold || 0) + n; bookSale(total); S.rep += cupRep((q > 80 ? 2 : q > 60 ? 1 : 0) * Math.min(n, 3), q); gainXp(Math.round(total / 8));
    h.n -= n; h.qSum -= q * n; h.thcSum -= thc * n; if (h.n <= 0) S.held = null;
    var left = walkupLeft();
    logEvent('💵 Rang up ' + n + ' ' + kindName(kind, n) + ' as a walk-up sale: ' + money(total), 'good'); toast('💵 ' + money(total) + ' for ' + n + ' ' + kindName(kind, n) + ' at the walk-up rate' + (h.n > 0 ? ' (no more walk-ups today, the rest stays in your hands)' : ' (' + left + ' walk-up sales left today)'), 'good'); sfx('cash'); registerSale(n + ' ' + kindName(kind, n) + ' ' + money(total));
    burst(-1.0, 1.4, 4.9, 0xffd766, 30, 'up');   /* hands only: nothing on the shelves changed */
  }

