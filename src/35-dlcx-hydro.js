//@ DLC: the Hydroponics Bay. Eight sites on a rack fed from one tank: no soil, no pots, much faster, as long as the tank is kept right
  // ── DLC: the Hydroponics Bay ──
  var HYDRO = { sites: 8, price: 1800, spd: 1.8, slow: 0.45, phLo: 5.5, phHi: 6.5, feedCost: 14, phCost: 5, phDrift: 0.00022, feedUse: 0.018 };
  function hydroState() { var H = dlcState('hydrobay', { owned: false, sites: [], ph: 6.0, feed: 100 }); while (H.sites.length < HYDRO.sites) H.sites.push(null); return H; }
  function hydroOk(H) { return H.ph >= HYDRO.phLo && H.ph <= HYDRO.phHi && H.feed > 8; }
  function hydroWhy(H) { return H.feed <= 8 ? 'the tank is out of feed' : H.ph > HYDRO.phHi ? 'the pH has crept up to ' + H.ph.toFixed(1) : H.ph < HYDRO.phLo ? 'the pH is down at ' + H.ph.toFixed(1) : ''; }
  function hydroSitePos(i) { return { x: -0.9 + (i % 4) * 0.6, y: i < 4 ? 0.8 : 1.42, z: 0.02 }; }
  function hydroPlant(i) {
    var H = hydroState(), h = held(); if (!h || h.kind !== 'seed') { toast('Bring a seed from the supply rack', 'bad'); return; } if (H.sites[i]) { toast('That site is taken', 'bad'); return; }
    var st = strainById(h.strain); H.sites[i] = { strain: st.id, progress: 0, quality: 62 }; S.held = null; sfx('plant'); gainXp(2);
    toast('🌱 ' + st.name + ' is in the channel. Keep the tank between pH ' + HYDRO.phLo + ' and ' + HYDRO.phHi + '.', 'good'); logEvent('🌱 Planted ' + st.name + ' in the hydroponics bay', ''); hydroSync();
  }
  function hydroHarvest(i) {
    var H = hydroState(), p = H.sites[i]; if (!p || p.progress < 1) return; if (hotbarFull()) { toast('Your hands are full (G puts things down)', 'bad'); return; }
    var st = strainById(p.strain), q = clamp(p.quality, 20, 100), wet = Math.round(st.yield * 1.1 * (0.7 + q / 140) * (S.upgrades.trimmer2 ? 1.3 : S.upgrades.trimmer ? 1.15 : 1) * 10) / 10;
    H.sites[i] = null; S.stats.harvested += wet; gainXp(Math.round(wet)); var proc = wet * COST.processPerGram; spendOp(proc);
    take({ kind: 'harvest', grams: wet, quality: q, thc: st.thc, strain: st.id }); sfx('harvest');
    logEvent('✂️ Harvested ' + gram(wet) + ' of ' + st.name + ' from the hydroponics bay (quality ' + Math.round(q) + ')', 'good'); toast('✂️ Harvested ' + gram(wet) + '. Hang it on the drying line.', 'good'); hydroSync();
  }
  function hydroTankMenu() {
    var H = hydroState(), h = held(), n = H.sites.filter(Boolean).length, lines = [];
    lines.push({ label: 'pH <b>' + H.ph.toFixed(1) + '</b> <small>' + (H.ph > HYDRO.phHi ? 'too high: roots lock out' : H.ph < HYDRO.phLo ? 'too low' : 'in range (' + HYDRO.phLo + ' to ' + HYDRO.phHi + ')') + '</small>', cls: H.ph > HYDRO.phHi || H.ph < HYDRO.phLo ? 'bad' : 'on' });
    lines.push({ label: 'Feed <b>' + Math.round(H.feed) + '%</b> <small>' + n + ' plant' + (n === 1 ? '' : 's') + ' drinking from it</small>', cls: H.feed <= 8 ? 'bad' : H.feed > 30 ? 'on' : '' });
    lines.push({ label: '⚗️ Bring the pH back to 6.0 <small>' + money(HYDRO.phCost) + ' of pH down</small>', act: function () { if (Math.abs(H.ph - 6) < 0.05) { toast('The pH is where it should be', ''); return; } if (payBank(HYDRO.phCost, 'pH down')) { H.ph = 6.0; toast('⚗️ pH back at 6.0', 'good'); } } });
    if (h && h.kind === 'nutrients') lines.push({ label: '🧪 Pour in the nutrients you are holding <small>fills the tank</small>', act: function () { S.held = null; H.feed = 100; sfx('pour'); toast('🧪 Tank topped up', 'good'); } });
    lines.push({ label: '🧪 Top up the feed <small>' + money(HYDRO.feedCost) + ' of concentrate</small>', act: function () { if (H.feed > 95) { toast('The tank is full', ''); return; } if (payBank(HYDRO.feedCost, 'The concentrate')) { H.feed = 100; toast('🧪 Tank topped up', 'good'); } } });
    ctxOpen('💧 Nutrient tank', 'One tank feeds the whole rack. The pH creeps up as the plants drink, and they eat the feed.', lines);
  }
  function hydroSync() {   // what stands in the channels, rebuilt from the save
    var W = world.hydro; if (!W || !W.dyn || !W.dyn.parent) return; dropKids(W.dyn); W.figs = [];
    hydroState().sites.forEach(function (p, i) { if (!p) return; var f = plantFigure(strainById(p.strain)), s = hydroSitePos(i); f.position.set(s.x, s.y + 0.04, s.z); f.userData.set(p.progress, 0.62); f.userData.site = i; W.dyn.add(f); W.figs.push(f); });
  }
  PROP_DLC.hydroBay = ['hydrobay'];
  growDefProp('hydroBay', { label: 'hydroponics bay', x: ROOM.x - 0.55, z: -5.9, rot: 3, build: function (c) {
    var H = hydroState(); world.hydro = null; if (!H.owned) { notFitted(c, 2.5, 0.7, ['HYDROPONICS BAY', 'E to fit it · ' + money(HYDRO.price)], 'hydroTank'); return; }
    // a rack on castors: two tiers of white channels with net pots, a light bar over each tier, the tank and pump underneath, a controller on the end
    var white = colorMat(0xf2f4f5, 0.35, 0.02), pipe = colorMat(0x2f6fb0, 0.4, 0.1);
    [[-1.2, -0.3], [1.2, -0.3], [-1.2, 0.3], [1.2, 0.3]].forEach(function (p) { c.box(0.045, 2.0, 0.045, MAT.alu, p[0], 1.04, p[1], { sharp: true }); c.cyl(0.035, 0.035, 0.04, MAT.soft, p[0], 0.02, p[1], 12); });
    [0.06, 0.62, 1.24, 2.02].forEach(function (y) { [-0.3, 0.3].forEach(function (z) { c.box(2.44, 0.035, 0.035, MAT.alu, 0, y, z, { sharp: true }); }); [-1.2, 1.2].forEach(function (x) { c.box(0.035, 0.035, 0.6, MAT.alu, x, y, 0, { sharp: true }); }); });
    [0.76, 1.38].forEach(function (y, t) {
      c.box(2.36, 0.09, 0.2, white, 0, y, 0.02, { r: 0.02 }); c.box(0.03, 0.11, 0.22, white, -1.19, y, 0.02); c.box(0.03, 0.11, 0.22, white, 1.19, y, 0.02);
      for (var i = 0; i < 4; i++) { var x = -0.9 + i * 0.6; c.cyl(0.06, 0.045, 0.05, MAT.black, x, y + 0.035, 0.02, 16); c.cyl(0.052, 0.052, 0.012, colorMat(0x8a5a3a, 1), x, y + 0.062, 0.02, 14); c.hit(0.5, 0.56, 0.5, x, y + 0.3, 0.04, { kind: 'hydroSite', i: t * 4 + i }); }
      c.box(2.3, 0.03, 0.12, MAT.gunmetal, 0, y + 0.56, 0.02, { r: 0.008 }); c.lit(0xfdf3ff, 2.2, 0.07, 0, y + 0.5435, 0.02, 0, Math.PI / 2); c.light(new THREE.PointLight(0xf6e8ff, 0.4, 2.0), 0, y + 0.4, 0.3);
      c.cyl(0.014, 0.014, 0.3, pipe, 1.12 - t * 0.06, y - 0.19, -0.12, 8);
    });
    c.box(1.5, 0.42, 0.5, colorMat(0x1f2a33, 0.45, 0.05), -0.3, 0.3, 0, { solid: true, r: 0.03 }); c.box(1.42, 0.02, 0.44, colorMat(0x3d7ab3, 0.15, 0.1, { transparent: true, opacity: 0.75 }), -0.3, 0.5, 0, { cast: false }); c.box(0.3, 0.02, 0.2, MAT.gunmetal, -0.8, 0.525, 0.05, { cast: false });
    c.box(0.22, 0.26, 0.24, MAT.gunmetal, 0.72, 0.22, 0, { r: 0.02 }); c.cyl(0.05, 0.05, 0.1, MAT.steel, 0.72, 0.4, 0, 14); c.cyl(0.016, 0.016, 1.2, pipe, 0.95, 0.9, -0.2, 8); c.cyl(0.016, 0.016, 0.5, pipe, 0.72, 0.5, -0.2, 8).rotation.z = 0.9; c.solid(-1.25, 1.25, -0.35, 0.35);
    var scr = readout(0.3, 0.2, '#7cc4ff'), sg = new THREE.Group(); sg.position.set(1.0, 1.05, 0.34); c.add(sg); c.box(0.36, 0.34, 0.06, MAT.gloss, 1.0, 1.0, 0.305, { r: 0.01 }); screenShell(sg, 0.3, 0.2, { bezel: 0.01, depth: 0.012, led: 0x7cc4ff }); scr.position.z = 0.0005; sg.add(scr); [[-0.07, 0x6fdc8c], [0, 0xf0b94d], [0.07, 0xff6b5e]].forEach(function (b) { c.cyl(0.014, 0.014, 0.012, colorMat(b[1], 0.35), 1.0 + b[0], 0.885, 0.34, 12).rotation.x = Math.PI / 2; });
    c.hit(1.6, 0.6, 0.6, -0.3, 0.3, 0.05, { kind: 'hydroTank' }); c.hit(0.4, 0.4, 0.2, 1.0, 1.0, 0.36, { kind: 'hydroTank' });
    c.sign(['HYDROPONICS', 'keep the tank at pH ' + HYDRO.phLo + ' to ' + HYDRO.phHi], 1.2, 0.3, 0, 2.25, 0.0, 0, { titleColor: '#7cc4ff' });
    world.hydro = { dyn: c.dynGroup(), figs: [], scr: scr };
  }, after: function () { hydroSync(); } });
  dlcDefine({ id: 'hydrobay', name: 'The Hydroponics Bay', kinds: ['hydroSite', 'hydroTank'],
    prompt: function (d, h) {
      var H = hydroState(); if (!H.owned) return 'Hydroponics bay <small>E fits it for ' + money(HYDRO.price) + '</small>';
      if (d.kind === 'hydroTank') return 'Nutrient tank <small>pH ' + H.ph.toFixed(1) + ' · feed ' + Math.round(H.feed) + '%' + (hydroOk(H) ? '' : ' · ⚠ ' + hydroWhy(H)) + '</small>';
      var p = H.sites[d.i]; if (!p) return h && h.kind === 'seed' ? 'Plant ' + strainById(h.strain).name + ' <small>no soil, no pot</small>' : 'Empty site <small>bring a seed from the supply rack</small>';
      var st = strainById(p.strain); return p.progress >= 1 ? (h ? 'Free your hands to harvest ' + st.name : 'Harvest ' + st.name + ' <small>ready · quality ' + Math.round(p.quality) + '</small>') : st.name + ' <small>' + Math.round(p.progress * 100) + '% · quality ' + Math.round(p.quality) + (hydroOk(H) ? '' : ' · ⚠ ' + hydroWhy(H)) + '</small>';
    },
    interact: function (d, h) {
      var H = hydroState(); if (!H.owned) { ctxOpen('💧 Hydroponics bay', 'Eight sites on a rack, fed from one tank. Plants grow nearly twice as fast with no soil and no pots, as long as you keep the tank right.', [{ label: 'Fit it · ' + money(HYDRO.price) + ' <small>from the bank</small>', act: function () { if (payBank(HYDRO.price, 'The hydroponics bay')) { H.owned = true; growBuildProp('hydroBay'); toast('💧 The hydroponics bay is in. Bring seeds to its sites.', 'good'); logEvent('💧 Fitted a hydroponics bay in the dry room', 'good'); } } }]); return; }
      if (d.kind === 'hydroTank') { hydroTankMenu(); return; }
      var p = H.sites[d.i]; if (!p) { if (h && h.kind === 'seed') hydroPlant(d.i); else toast('Bring a seed from the supply rack', ''); return; }
      if (p.progress >= 1) { hydroHarvest(d.i); return; }
      var st = strainById(p.strain); ctxOpen(st.emoji + ' ' + esc(st.name), 'site ' + (d.i + 1) + ' of ' + HYDRO.sites, [{ label: 'Grown <b>' + Math.round(p.progress * 100) + '%</b> <small>' + (hydroOk(H) ? 'growing at ' + HYDRO.spd + '× the speed of soil' : 'slowed: ' + hydroWhy(H)) + '</small>', cls: hydroOk(H) ? 'on' : 'bad' }, { label: 'Quality <b>' + Math.round(p.quality) + '</b> <small>rises while the tank is in range, falls while it is not</small>' }, { label: '🗑️ Pull it out <small>the site is freed, the plant is lost</small>', act: function () { H.sites[d.i] = null; hydroSync(); toast('Pulled the plant', ''); } }]);
    },
    tick: function (dt) {
      var H = hydroState(); if (!H.owned) return; var live = H.sites.filter(function (p) { return p && p.progress < 1; }), lit = powerOn(), ok = hydroOk(H);
      if (!live.length) return; var was = ok;
      H.ph = clamp(H.ph + HYDRO.phDrift * live.length * dt, 4.5, 8); H.feed = clamp(H.feed - HYDRO.feedUse * live.length * dt, 0, 100);
      live.forEach(function (p) { if (!lit) return; var st = strainById(p.strain); p.progress = Math.min(1, p.progress + (1000 / st.growMs) * (ok ? HYDRO.spd : HYDRO.slow) * dt); p.quality = clamp(p.quality + (ok ? 0.03 : -0.05) * dt, 25, dlcHas('hydrobay', 'chiller') ? 100 : 90); });
      if (was && !hydroOk(H)) { toast('💧 The hydroponics bay has slowed: ' + hydroWhy(H), 'bad'); logEvent('💧 Hydroponics bay: ' + hydroWhy(H), 'bad'); }
    },
    update: function () {
      var W = world.hydro; if (!W || !W.dyn.parent) return; var H = hydroState(), ok = hydroOk(H);
      W.figs.forEach(function (f) { var p = H.sites[f.userData.site]; if (p) f.userData.set(p.progress, 0.62); });
      var n = H.sites.filter(Boolean).length, ready = H.sites.filter(function (p) { return p && p.progress >= 1; }).length;
      W.scr.userData.draw([ok ? 'In range' : 'Check tank', 'pH ' + H.ph.toFixed(1) + '   feed ' + Math.round(H.feed) + '%', n + ' of ' + HYDRO.sites + ' sites planted', ready ? ready + ' ready to cut' : (powerOn() ? 'lamps on' : 'no power')], ok ? '#7cc4ff' : DESK_BAD);
    }
  });
