//@ DLC: the Breeding Lab. Cross two strains at the bench, name what comes out, and it is yours: in the seed bank, on the shelf, on the menu
  // ── DLC: the Breeding Lab ──
  var BREED = { fee: 150, ms: 480000, seeds: 6, max: 12, price: 900 };
  function breedState() { return dlcState('breeding', { owned: false, strains: [], job: null, pickA: '', pickB: '', name: '' }); }
  function breedMix(a, b, t) { var ca = new THREE.Color(a), cb = new THREE.Color(b); return ca.lerp(cb, t).getHex(); }
  function breedName(a, b) { var wa = a.name.split(' '), wb = b.name.split(' '); return (wa[0] + ' ' + wb[wb.length - 1]).slice(0, 24); }
  // the child is settled the moment the cross starts, so closing the game and coming back cannot roll it again
  function breedChild(a, b) {
    var r = Math.random, avg = function (k) { return (a[k] + b[k]) / 2; };
    var c = { growMs: avg('growMs') * randf(0.9, 1.1), yield: avg('yield') * randf(0.92, 1.18), thc: avg('thc') * randf(0.95, 1.15) };
    var star = r() < 0.14 ? pick(['yield', 'thc', 'growMs']) : '';   /* now and then one plant in the tray stands out */
    if (star === 'yield') c.yield *= 1.18; else if (star === 'thc') c.thc *= 1.14; else if (star === 'growMs') c.growMs *= 0.82;
    return { id: 'bred' + now().toString(36), name: breedName(a, b), emoji: '🧬', seed: Math.max(8, Math.round(avg('seed') * 1.3)), growMs: Math.round(clamp(c.growMs, 120000, 3600000 * 2)), yield: Math.round(clamp(c.yield, 4, 60) * 10) / 10, thc: Math.round(clamp(c.thc, 0.5, 4) * 100) / 100, lvl: Math.max(a.lvl || 1, b.lvl || 1), bud: breedMix(a.bud, b.bud, r()), hair: breedMix(a.hair, b.hair, r()), leaf: breedMix(a.leaf, b.leaf, r()), bred: true, parents: [a.id, b.id], star: star };
  }
  function breedStats(st) { return 'strength ' + st.thc.toFixed(2) + '× · ' + st.yield + ' g a plant · ' + Math.round(st.growMs / 60000) + ' min · seed ' + money(st.seed); }
  function breedStart() {
    var B = breedState(), a = strainById(B.pickA), b = strainById(B.pickB);
    if (B.job) return; if (!a || !b || a.id === b.id || a.id !== B.pickA || b.id !== B.pickB) { toast('Pick two different parents', 'bad'); return; }
    if (B.strains.length >= BREED.max) { toast('The seed library is full: ' + BREED.max + ' cultivars of your own', 'bad'); return; }
    if ((S.supplies['seed_' + a.id] || 0) < 1 || (S.supplies['seed_' + b.id] || 0) < 1) { toast('You need a seed of each parent on the supply rack', 'bad'); return; }
    if (!payBank(BREED.fee, 'The cross')) return;
    S.supplies['seed_' + a.id]--; S.supplies['seed_' + b.id]--; dirtySupply('seed');
    B.job = { a: a.id, b: b.id, t: 0, child: breedChild(a, b) }; B.name = B.job.child.name;
    logEvent('🧬 Started a cross: ' + a.name + ' × ' + b.name, ''); toast('🧬 The cross is on the bench. It takes about ' + Math.round(BREED.ms / 60000) + ' min.', 'good'); if (propInst.breedBench) buildProp('breedBench');
  }
  function breedFinish() {
    var B = breedState(), J = B.job; if (!J || J.t < BREED.ms / 1000) return;
    var st = J.child, nm = String(B.name || st.name).replace(/[<>&"]/g, '').trim().slice(0, 24); if (nm.length < 2) { toast('Give it a name of two letters or more', 'bad'); return; }
    st.name = nm; B.strains.push(st); STRAINS.push(st); B.job = null; B.pickA = ''; B.pickB = ''; B.name = '';
    S.supplies['seed_' + st.id] = (S.supplies['seed_' + st.id] || 0) + BREED.seeds; dirtySupply('seed'); gainXp(40); S.rep += 2; sfx('rare');
    logEvent('🧬 Bred a new cultivar: ' + st.name + ' (' + breedStats(st) + ')', 'rare'); toast('🧬 ' + st.name + ' is yours. ' + BREED.seeds + ' seeds are on the supply rack, and the seed bank stocks it from now on (rep +2).', 'rare');
    if (propInst.goodsShelf) buildProp('goodsShelf'); if (propInst.breedBench) buildProp('breedBench'); world.dirty = true;
  }
  function paneBreed() {
    var B = breedState(), h = '<div class="g3-grid"><div class="g3-box"><h3>🧬 The cross</h3>';
    if (B.job) {
      var J = B.job, a = strainById(J.a), b = strainById(J.b), k = clamp(J.t / (BREED.ms / 1000), 0, 1);
      h += '<div class="g3-customer"><span class="avatar">' + a.emoji + '</span><div><span class="who">' + esc(a.name) + ' × ' + esc(b.name) + '</span><span class="req">' + (k >= 1 ? 'The pods have split: the seed is ready.' : 'Pollinated. ' + minsLeft((1 - k) * BREED.ms / 1000) + ' until the seed is ripe.') + '</span></div><span class="avatar">' + b.emoji + '</span></div>' + barHtml(k, 'q');
      if (k >= 1) h += '<div class="desc" style="margin-top:12px">What came out: <b>' + breedStats(J.child) + '</b>' + (J.child.star ? '. One plant in the tray stood out, and you kept that one.' : '.') + ' Give it a name.</div><div class="g3-slider"><label>Name</label><input type="text" data-breed="name" maxlength="24" value="' + esc(B.name) + '" style="flex:2;background:#0c1712;color:var(--ink);border:1px solid var(--panel-line);border-radius:8px;padding:7px 10px"></div><button class="g3-btn primary wide" data-act="breedFinish">🧬 Name it and take the ' + BREED.seeds + ' seeds</button>';
    } else {
      var have = strainsWithSeed(1);
      h += '<div class="desc">Pick a mother and a father. The seed takes after both: strength, yield and how long it takes to grow land somewhere between them, give or take. It costs a seed of each and ' + money(BREED.fee) + ' for the lab work.</div>';
      if (have.length < 2) h += '<div class="g3-empty">You need seeds of two different strains on the supply rack. The Seed bank on the office PC sells them.</div>';
      else {
        [['pickA', 'Mother'], ['pickB', 'Father']].forEach(function (p) { h += '<div class="desc" style="margin:10px 0 2px">' + p[1] + '</div><div class="g3-chips">' + have.map(function (st) { return '<button class="g3-btn' + (B[p[0]] === st.id ? ' primary' : '') + '" data-act="breedPick" data-id="' + p[0] + ':' + st.id + '">' + st.emoji + ' ' + esc(st.name) + '</button>'; }).join('') + '</div>'; });
        var ok = B.pickA && B.pickB && B.pickA !== B.pickB;
        h += '<button class="g3-btn primary wide" data-act="breedStart"' + (ok && B.strains.length < BREED.max ? '' : ' disabled') + '>🧬 Start the cross · ' + money(BREED.fee) + ' · about ' + Math.round(BREED.ms / 60000) + ' min</button>';
      }
    }
    h += '</div><div class="g3-box"><h3>📚 Your cultivars · ' + B.strains.length + ' of ' + BREED.max + '</h3><div class="desc">Everything you have bred. The Seed bank sells more seed of each, and customers ask for them by name.</div>';
    if (!B.strains.length) h += '<div class="g3-empty">Nothing yet. Your first cross goes here.</div>';
    B.strains.forEach(function (st) { var pa = strainById(st.parents[0]), pb = strainById(st.parents[1]); h += '<div class="g3-row"><span class="ico"><i class="sw" style="display:block;width:18px;height:18px;border-radius:50%;background:#' + ('000000' + st.bud.toString(16)).slice(-6) + '"></i></span><span class="meta"><span class="n">' + esc(st.name) + (st.star ? ' ★' : '') + '</span><span class="own">' + breedStats(st) + '</span><span class="own">' + esc(pa.name) + ' × ' + esc(pb.name) + ' · ' + (S.supplies['seed_' + st.id] || 0) + ' seeds on the rack</span></span></div>'; });
    return h + '</div></div>';
  }
  hooks.panel.breed = function () { return { title: '🧬 Breeding bench', body: paneBreed() }; };
  hooks.panelClick.push(function (act, b) {
    if (act === 'breedPick') { var p = (b.getAttribute('data-id') || '').split(':'), B = breedState(); if (p[0] === 'pickA' || p[0] === 'pickB') B[p[0]] = p[1]; return true; }
    if (act === 'breedStart') { breedStart(); return true; }
    if (act === 'breedFinish') { breedFinish(); return true; }
    if (act === 'breedBuy') { var B2 = breedState(); if (!B2.owned && payBank(BREED.price, 'The breeding bench')) { B2.owned = true; buildProp('breedBench'); toast('🧬 The breeding bench is in. E on it starts a cross.', 'good'); logEvent('🧬 Fitted a breeding bench in the grow room', 'good'); } return true; }
    return false;
  });
  hooks.panelInput.push(function (el) { if (el.getAttribute('data-breed') === 'name') { breedState().name = el.value; return true; } return false; });
  PROP_DLC.breedBench = ['breeding'];
  defProp('breedBench', { label: 'breeding bench', x: -3.8, z: -ROOM.z + 0.45, rot: 0, build: function (c) {
    var B = breedState(); if (!B.owned) { notFitted(c, 1.7, 0.7, ['BREEDING BENCH', 'E to fit it · ' + money(BREED.price)], 'breedBench'); return; }
    // a steel bench with a lit hood over two mother-plant bays, a seed tray, a magnifier lamp and a read-out
    c.box(1.7, 0.05, 0.7, MAT.steel, 0, 0.9, 0, { solid: true }); c.box(1.6, 0.03, 0.6, MAT.gunmetal, 0, 0.3, 0, { cast: false }); [[-0.8, -0.3], [0.8, -0.3], [-0.8, 0.3], [0.8, 0.3]].forEach(function (l) { c.box(0.045, 0.88, 0.045, MAT.steel, l[0], 0.44, l[1]); c.cyl(0.03, 0.035, 0.02, MAT.soft, l[0], 0.01, l[1], 12); });
    drawer(c, 0.5, 0.16, 0.02, -0.5, 0.78, 0.33, MAT.gunmetal); drawer(c, 0.5, 0.16, 0.02, 0.05, 0.78, 0.33, MAT.gunmetal);
    [[-0.84, -0.32], [0.18, -0.32], [-0.84, 0.2], [0.18, 0.2]].forEach(function (p) { c.box(0.025, 0.95, 0.025, MAT.alu, p[0], 1.4, p[1], { sharp: true }); }); c.box(1.06, 0.04, 0.56, MAT.gunmetal, -0.33, 1.88, -0.06); c.lit(0xf6e8ff, 0.9, 0.06, -0.33, 1.855, -0.06, 0, Math.PI / 2); c.lit(0xffd9f2, 0.9, 0.06, -0.33, 1.855, 0.08, 0, Math.PI / 2);
    c.box(1.04, 0.95, 0.006, MAT.glass, -0.33, 1.4, -0.325, { cast: false, sharp: true }); c.light(new THREE.PointLight(0xf2d8ff, 0.5, 2.2), -0.33, 1.6, 0.1);
    var J = B.job, k = J ? clamp(J.t / (BREED.ms / 1000), 0, 1) : 0; world.breed = { figs: [], pods: null, scr: null };
    [[-0.62, J ? J.a : ''], [-0.04, J ? J.b : '']].forEach(function (p) { var pg = new THREE.Group(); pg.position.set(p[0], 0.925, -0.06); pg.scale.setScalar(0.62); c.add(pg); makePot(pg, !!J); if (J) { var f = plantFigure(strainById(p[1])); f.position.y = 0.3; pg.add(f); f.userData.set(0.75 + k * 0.25, 1.15); world.breed.figs.push(f); } });
    c.box(0.34, 0.03, 0.24, MAT.soft, 0.52, 0.94, 0.12, { r: 0.008 }); for (var s = 0; s < 12; s++) { var sd = c.cyl(0.016, 0.014, 0.02, colorMat(0x3a2a1c, 1), 0.4 + (s % 4) * 0.08, 0.965, 0.04 + Math.floor(s / 4) * 0.08, 10); if (J && k >= 1) c.cyl(0.006, 0.006, 0.012, colorMat(0xc9a66a, 0.6), 0.4 + (s % 4) * 0.08, 0.982, 0.04 + Math.floor(s / 4) * 0.08, 8); }
    c.cyl(0.04, 0.035, 0.1, MAT.jar, 0.74, 0.975, -0.2, 14); [-0.012, 0.012, 0].forEach(function (dx, i) { c.cyl(0.003, 0.003, 0.16, MAT.wood, 0.74 + dx, 1.02, -0.2 + (i - 1) * 0.01, 6).rotation.z = dx * 8; });
    c.cyl(0.06, 0.065, 0.016, MAT.gunmetal, 0.62, 0.933, -0.24, 18); var arm = c.box(0.014, 0.34, 0.014, MAT.alu, 0.58, 1.08, -0.24, { sharp: true }); arm.rotation.z = 0.3; var ring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.009, 8, 24), MAT.gunmetal); ring.position.set(0.5, 1.25, -0.2); ring.rotation.x = Math.PI / 2 - 0.5; c.add(ring); var lens = new THREE.Mesh(new THREE.CircleGeometry(0.058, 20), MAT.jar); lens.position.copy(ring.position); lens.rotation.x = -0.5 - Math.PI / 2; c.add(lens);
    var scr = readout(0.36, 0.2, '#c9a0ff'), sg = new THREE.Group(); sg.position.set(0.55, 1.5, -0.3); c.add(sg); screenShell(sg, 0.36, 0.2, { bezel: 0.012, depth: 0.02, led: 0xc9a0ff }); scr.position.z = 0.0005; sg.add(scr); c.box(0.03, 0.5, 0.03, MAT.gunmetal, 0.55, 1.2, -0.325); world.breed.scr = scr;
    c.sign(['BREEDING BENCH', 'two parents, one new strain'], 0.9, 0.3, -0.33, 2.15, -0.3, 0, { titleColor: '#c9a0ff' });
    c.hit(1.7, 1.2, 0.7, 0, 1.4, 0, { kind: 'breedBench' });
  } });
  dlcDefine({ id: 'breeding', name: 'The Breeding Lab', kinds: ['breedBench'],
    loaded: function () { breedState().strains.forEach(function (st) { if (!STRAINS.some(function (x) { return x.id === st.id; })) STRAINS.push(st); }); },
    prompt: function () { var B = breedState(); if (!B.owned) return 'Breeding bench <small>E fits it for ' + money(BREED.price) + '</small>'; if (!B.job) return 'Breeding bench <small>E picks the parents for a cross</small>'; return B.job.t >= BREED.ms / 1000 ? 'The seed is ready <small>E names your new strain</small>' : 'Breeding bench <small>the cross ripens in ' + minsLeft(BREED.ms / 1000 - B.job.t) + '</small>'; },
    interact: function () { var B = breedState(); if (!B.owned) { ctxOpen('🧬 Breeding bench', 'A bench to cross two strains into one of your own. It goes against the back wall of the grow room.', [{ label: 'Fit it · ' + money(BREED.price) + ' <small>from the bank</small>', act: function () { if (payBank(BREED.price, 'The breeding bench')) { B.owned = true; buildProp('breedBench'); toast('🧬 The breeding bench is in. E on it starts a cross.', 'good'); logEvent('🧬 Fitted a breeding bench in the grow room', 'good'); } } }]); return; } ui.openPanel('breed'); },
    tick: function (dt) { var B = breedState(); if (!B.job || !powerOn()) return; var was = B.job.t >= BREED.ms / 1000; B.job.t += dt; if (!was && B.job.t >= BREED.ms / 1000) { toast('🧬 The cross is ripe. Name your new strain at the breeding bench.', 'rare'); logEvent('🧬 The cross is ripe at the breeding bench', 'good'); sfx('rare'); if (propInst.breedBench) buildProp('breedBench'); } },
    update: function () { var W = world.breed, B = breedState(); if (!W || !W.scr || !W.scr.parent) return; var J = B.job; if (!J) { W.scr.userData.draw(['Ready', 'No cross on the bench', B.strains.length + ' of ' + BREED.max + ' cultivars bred']); return; } var k = clamp(J.t / (BREED.ms / 1000), 0, 1); W.figs.forEach(function (f) { f.userData.set(0.75 + k * 0.25, 1.15); }); W.scr.userData.draw([k >= 1 ? 'Seed ready' : 'Pollinated ' + Math.round(k * 100) + '%', strainById(J.a).name, '× ' + strainById(J.b).name, k >= 1 ? 'press E to name it' : minsLeft((1 - k) * BREED.ms / 1000) + ' to go']); }
  });
