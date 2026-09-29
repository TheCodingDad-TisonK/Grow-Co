//@ DLC: Merch & Brand. A stand of T-shirts, caps, mugs and tote bags in the lobby: people buy while they wait, and the shop's name gets about
  // ── DLC: Merch & Brand ──
  var MERCH = { price: 600, lot: 10, wait: 90, items: [
    { id: 'tee', ico: '👕', name: 'T-shirt', one: 'a T-shirt', cost: 9, sell: 24 }, { id: 'cap', ico: '🧢', name: 'Cap', one: 'a cap', cost: 7, sell: 18 },
    { id: 'mug', ico: '☕', name: 'Mug', one: 'a mug', cost: 5, sell: 14 }, { id: 'tote', ico: '👜', name: 'Tote bag', one: 'a tote bag', cost: 4, sell: 12 }],
    levels: [0, 10, 30, 60, 100, 150, 210, 280, 360, 450, 550], tiers: [[0.8, 'keen', 1.35], [1, 'fair', 1], [1.25, 'dear', 0.6]] };
  function merchState() { var M = dlcState('merch', { owned: false, stock: {}, tier: 1, brand: 0, sold: 0, takings: 0, orders: [], t: 0 }); MERCH.items.forEach(function (it) { if (typeof M.stock[it.id] !== 'number') M.stock[it.id] = 0; }); return M; }
  function merchItem(id) { return MERCH.items.filter(function (it) { return it.id === id; })[0]; }
  function merchLevel() { var b = merchState().brand, l = 0; MERCH.levels.forEach(function (n, i) { if (b >= n) l = i; }); return l; }
  function merchPrice(it) { return Math.round(it.sell * MERCH.tiers[merchState().tier][0]); }
  function merchFootfall() { return 1 + merchLevel() * 0.02; }
  function merchOrder(id) {
    var M = merchState(), it = merchItem(id); if (!it || !M.owned) return; if (M.stock[id] + M.orders.filter(function (o) { return o.id === id; }).length * MERCH.lot > 40) { toast('The stand holds 40 of each and no more', 'bad'); return; }
    if (!payBank(it.cost * MERCH.lot, 'A box of ' + MERCH.lot)) return; M.orders.push({ id: id, t: MERCH.wait });
    toast(it.ico + ' ' + MERCH.lot + ' × ' + it.name.toLowerCase() + ' ordered. The printer sends them round in a minute or two.', 'good'); logEvent(it.ico + ' Ordered ' + MERCH.lot + ' × ' + it.name.toLowerCase() + ' for the merch stand: ' + money(it.cost * MERCH.lot), '');
  }
  function merchSell() {   // somebody in the lobby takes something off the stand and pays at the window
    var M = merchState(), have = MERCH.items.filter(function (it) { return M.stock[it.id] > 0; }); if (!have.length) return false;
    var it = pick(have), p = merchPrice(it); M.stock[it.id]--; M.sold++; M.takings += p; M.brand += 1; S.till += p; S.stats.earned = (S.stats.earned || 0) + p;
    var lv0 = M.lv || 0, lv = merchLevel(); M.lv = lv; logEvent(it.ico + ' Sold ' + it.one + ' off the merch stand: ' + money(p) + ' in the till', 'good');
    if (lv > lv0) { toast('📣 The brand is at level ' + lv + ': ' + (lv * 2) + '% more people through the door.', 'rare'); logEvent('📣 Brand level ' + lv, 'rare'); sfx('levelup'); }
    merchSync(); return true;
  }
  function paneMerch() {
    var M = merchState(), lv = merchLevel(), nextAt = MERCH.levels[lv + 1], h = '<div class="g3-grid"><div class="g3-box"><h3>👕 The stand</h3>';
    if (!M.owned) return h + '<div class="g3-empty">The merch stand is not in the lobby yet. E on its outline fits it for ' + money(MERCH.price) + '.</div></div></div>';
    h += '<div class="desc">People in the lobby buy while they wait, and the money goes in the till. A box is ' + MERCH.lot + ' of one thing, printed with the shop\'s mark.</div>';
    MERCH.items.forEach(function (it) { var due = M.orders.filter(function (o) { return o.id === it.id; }).length * MERCH.lot; h += '<div class="g3-row"><span class="ico">' + it.ico + '</span><span class="meta"><span class="n">' + it.name + ' · ' + M.stock[it.id] + ' on the stand' + (due ? ' <small>' + due + ' on the way</small>' : '') + '</span><span class="own">costs ' + money(it.cost) + ' · sells for ' + money(merchPrice(it)) + '</span></span><button class="g3-btn" data-act="merchOrder" data-id="' + it.id + '">Order ' + MERCH.lot + ' · ' + money(it.cost * MERCH.lot) + '</button></div>'; });
    h += '<div class="desc" style="margin-top:12px">Prices</div><div class="g3-chips">' + MERCH.tiers.map(function (t, i) { return '<button class="g3-btn' + (M.tier === i ? ' primary' : '') + '" data-act="merchTier" data-id="' + i + '">' + Math.round(t[0] * 100) + '% · ' + t[1] + '</button>'; }).join('') + '</div><div class="desc">Keen prices sell faster and spread the name sooner. Dear ones earn more on each and sell slowly.</div>';
    h += '</div><div class="g3-box"><h3>📣 The brand · level ' + lv + '</h3><div class="desc">Every sale puts the shop\'s name on somebody\'s back. Each level brings 2% more people through the door, up to 20%.</div>' + (nextAt ? barHtml((M.brand - MERCH.levels[lv]) / (nextAt - MERCH.levels[lv]), 'q') + '<div class="desc" style="margin-top:6px">' + (nextAt - M.brand) + ' more sales to level ' + (lv + 1) + '</div>' : '<div class="desc">As well known as a shop this size gets.</div>');
    h += '<div class="g3-chips" style="margin-top:12px">' + chip('sold', M.sold) + chip('takings', money(M.takings)) + chip('footfall', '+' + (lv * 2) + '%') + '</div></div></div>';
    return h;
  }
  hooks.panel.merch = function () { return { title: '👕 Merch and brand', body: paneMerch() }; };
  hooks.panelClick.push(function (act, b) { if (act === 'merchOrder') { merchOrder(b.getAttribute('data-id')); return true; } if (act === 'merchTier') { merchState().tier = clamp(+b.getAttribute('data-id') || 0, 0, 2); return true; } return false; });
  function teeGeo() {   // a T-shirt cut flat: body, sleeves, a scooped neck
    var s = new THREE.Shape(), P = [[-0.17, -0.26], [0.17, -0.26], [0.17, 0.1], [0.28, 0.03], [0.34, 0.12], [0.2, 0.26], [0.08, 0.26]]; s.moveTo(P[0][0], P[0][1]); for (var i = 1; i < P.length; i++) s.lineTo(P[i][0], P[i][1]);
    s.quadraticCurveTo(0, 0.18, -0.08, 0.26); [[-0.2, 0.26], [-0.34, 0.12], [-0.28, 0.03], [-0.17, 0.1]].forEach(function (p) { s.lineTo(p[0], p[1]); }); s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1 });
  }
  var TEE_GEO = teeGeo(), MERCH_COLS = [0x15171b, 0xf3eee0, 0x2f6b4a, 0x6fdc8c, 0x7a2f3a];
  function merchMark(w) { var m = new THREE.Mesh(new THREE.PlaneGeometry(w, w), new THREE.MeshBasicMaterial({ map: emojiTex('🌿', 96, '#0f1a15'), transparent: true })); return m; }
  function merchSync() {
    var W = world.merch; if (!W || !W.dyn || !W.dyn.parent) return; clearKids(W.dyn); var M = merchState(), g = W.dyn;
    function add(geo, mat, x, y, z, ry) { var m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.y = ry || 0; m.castShadow = true; g.add(m); return m; }
    [1, -1].forEach(function (face) {
      var ry = face > 0 ? 0 : Math.PI, z0 = face * 0.06;
      for (var i = 0; i < Math.min(5, Math.ceil(M.stock.tee / 4)); i++) { var t = add(TEE_GEO, fabricMat(MERCH_COLS[(i + (face > 0 ? 0 : 2)) % 5]), face * (-0.56 + i * 0.28), 1.42, z0 + face * (0.05 + (i % 2) * 0.03), ry); t.rotation.y += face * 0.18; t.scale.setScalar(0.78); var mk = merchMark(0.12); mk.position.set(0, 0.02, 0.018); t.add(mk); add(roundCylGeo(0.004, 0.004, 0.16, 6), MAT.chrome, t.position.x, 1.66, t.position.z - face * 0.0, 0).rotation.x = Math.PI / 2; }
      for (var c2 = 0; c2 < Math.min(4, Math.ceil(M.stock.cap / 5)); c2++) { var cm = fabricMat(MERCH_COLS[(c2 + 1) % 5]), cx = face * (-0.5 + c2 * 0.33), cap = add(new THREE.SphereGeometry(0.085, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), cm, cx, 1.875, z0 + face * 0.1, ry); var pk = add(bevelGeo(0.13, 0.012, 0.09, 0.005), cm, cx, 1.88, z0 + face * 0.19, ry); pk.rotation.x = face * 0.12; }
      for (var m2 = 0; m2 < Math.min(5, Math.ceil(M.stock.mug / 4)); m2++) { var mm = colorMat(MERCH_COLS[(m2 + 3) % 5], 0.25), mx = face * (-0.56 + m2 * 0.28); add(roundCylGeo(0.04, 0.036, 0.09, 18), mm, mx, 0.795, z0 + face * 0.14, ry); var hd = add(new THREE.TorusGeometry(0.024, 0.007, 8, 14, Math.PI), mm, mx + 0.042, 0.795, z0 + face * 0.14, 0); hd.rotation.z = -Math.PI / 2; }
      for (var b = 0; b < Math.min(3, Math.ceil(M.stock.tote / 6)); b++) { var bm = fabricMat(b % 2 ? 0xe9dfc6 : 0x2f6b4a), bx = face * (-0.4 + b * 0.4), bag = add(bevelGeo(0.26, 0.3, 0.03, 0.01), bm, bx, 0.36, z0 + face * 0.16, ry); var mk2 = merchMark(0.13); mk2.position.set(0, -0.02, 0.0165); bag.add(mk2); var hl = add(new THREE.TorusGeometry(0.06, 0.006, 6, 14, Math.PI), bm, bx, 0.51, z0 + face * 0.16, ry); }
    });
  }
  PROP_DLC.merchStand = ['merch'];
  defProp('merchStand', { label: 'merch stand', x: -8.6, z: 6.2, rot: 0, build: function (c) {
    var M = merchState(); world.merch = null; if (!M.owned) { notFitted(c, 1.8, 0.7, ['MERCH STAND', 'E to fit it · ' + money(MERCH.price)], 'merchStand'); return; }
    // a two-sided gondola: a slatted panel on a weighted base, a rail of shirts on each face, a shelf of caps above, mugs and totes below
    c.box(1.7, 0.1, 0.62, MAT.gunmetal, 0, 0.05, 0, { solid: true, r: 0.012 }); c.box(1.6, 1.9, 0.05, MAT.darkwood, 0, 1.05, 0); for (var s = 0; s < 15; s++) [1, -1].forEach(function (f) { c.box(1.58, 0.012, 0.004, MAT.black, 0, 0.2 + s * 0.12, f * 0.027, { cast: false, sharp: true }); });
    [-0.82, 0.82].forEach(function (x) { c.box(0.04, 1.96, 0.1, MAT.alu, x, 1.05, 0); }); c.box(1.7, 0.04, 0.12, MAT.alu, 0, 2.02, 0);
    [1, -1].forEach(function (f) { c.box(1.5, 0.02, 0.22, MAT.steel, 0, 1.78, f * 0.14, { cast: false }); c.box(1.5, 0.02, 0.24, MAT.steel, 0, 0.74, f * 0.15, { cast: false }); c.cyl(0.008, 0.008, 1.5, MAT.chrome, 0, 1.66, f * 0.1, 8).rotation.z = Math.PI / 2; [-0.7, 0.7].forEach(function (x) { c.box(0.012, 0.012, 0.1, MAT.chrome, x, 1.66, f * 0.06, { sharp: true, cast: false }); }); [-0.4, 0, 0.4].forEach(function (x) { c.cyl(0.005, 0.005, 0.12, MAT.chrome, x, 0.56, f * 0.09, 6).rotation.x = Math.PI / 2; }); });
    c.sign(['GROW CO. MERCH', 'pay at the window'], 1.2, 0.26, 0, 2.2, 0.062, 0, { titleColor: '#6fdc8c' }); c.sign(['GROW CO. MERCH', 'pay at the window'], 1.2, 0.26, 0, 2.2, -0.062, Math.PI, { titleColor: '#6fdc8c' });
    c.light(new THREE.PointLight(0xfff1cf, 0.35, 2.4), 0, 2.1, 0.6); c.hit(1.8, 2.0, 0.8, 0, 1.0, 0, { kind: 'merchStand' });
    world.merch = { dyn: c.dynGroup() };
  }, after: function () { merchSync(); } });
  dlcDefine({ id: 'merch', name: 'Merch & Brand', kinds: ['merchStand'],
    prompt: function () { var M = merchState(); if (!M.owned) return 'Merch stand <small>E fits it for ' + money(MERCH.price) + '</small>'; var n = MERCH.items.reduce(function (a, it) { return a + M.stock[it.id]; }, 0); return 'Merch stand <small>' + (n ? n + ' things on it' : 'empty: order stock') + ' · brand level ' + merchLevel() + '</small>'; },
    interact: function () { var M = merchState(); if (!M.owned) { ctxOpen('👕 Merch stand', 'A stand of T-shirts, caps, mugs and tote bags with the shop\'s mark on them. People buy while they wait, and the name gets about.', [{ label: 'Fit it · ' + money(MERCH.price) + ' <small>from the bank</small>', act: function () { if (payBank(MERCH.price, 'The merch stand')) { M.owned = true; buildProp('merchStand'); toast('👕 The merch stand is in the lobby. Order stock at it, or on the office PC.', 'good'); logEvent('👕 Put a merch stand in the lobby', 'good'); } } }]); return; } ui.openPanel('merch'); },
    tick: function (dt, offline) {
      var M = merchState(); if (!M.owned) return;
      for (var i = M.orders.length - 1; i >= 0; i--) { var o = M.orders[i]; o.t -= dt; if (o.t <= 0) { M.orders.splice(i, 1); M.stock[o.id] = Math.min(40, M.stock[o.id] + MERCH.lot); if (!offline) { toast(merchItem(o.id).ico + ' The ' + merchItem(o.id).name.toLowerCase() + 's are on the merch stand', 'good'); merchSync(); } } }
      if (offline || !shop().open) return; M.t += dt; if (M.t < 20) return; M.t = 0;
      var people = lineup.length + (S.customer ? 1 : 0) + loungers.length, tier = MERCH.tiers[M.tier];
      if (Math.random() < (people ? 0.16 : 0.04) * tier[2] * (1 + merchLevel() * 0.05) * footfall()) merchSell();
    },
    footfall: merchFootfall
  });
