//@ the Extraction Lab, more of it: every batch carries a grade from the bud that went in, and a technician can run the lab for you
  // ── Extraction Lab: grades and a technician ──
  // Quality used to stop at the lab door. Now a batch remembers the quality of its bud, the shelf and the cabinet keep a running
  // average for each product, and the price follows the grade. Stock made before this has no grade and sells at the list price.
  var LAB_JOBS = { cart: { g: 10, n: 3, dur: 45 }, hash: { g: 10, n: 4, dur: 35 }, gummy: { g: 5, n: 12, dur: 40, mix: true }, choc: { g: 5, n: 8, dur: 40, mix: true } };
  var LAB_TECH = { wage: 85, maxQ: 60, grams: 10, stock: 24 };
  var LAB_GRADES = [[80, 'A', 1.3], [60, 'B', 1.1], [40, 'C', 1], [0, 'D', 0.85]];
  var labUI = { tech: null, t: 0 };
  function labState() { var L = xs().lab; if (!L.q || typeof L.q !== 'object') L.q = {}; if (typeof L.honey !== 'number') L.honey = 0; return L; }
  function mixQ(qa, na, qb, nb) { if (qa === undefined || na <= 0) return qb; if (qb === undefined || nb <= 0) return qa; return (qa * na + qb * nb) / (na + nb); }
  function labGradeOf(q) { if (typeof q !== 'number') return null; for (var i = 0; i < LAB_GRADES.length; i++) if (q >= LAB_GRADES[i][0]) return LAB_GRADES[i]; return LAB_GRADES[LAB_GRADES.length - 1]; }
  function labGrade(q) { var g = labGradeOf(q); return g ? g[1] : ''; }
  function cigQ(sku) { return S.cigQ && typeof S.cigQ[sku] === 'number' ? S.cigQ[sku] : undefined; }
  function skuDlc(K) { return K.dlc || (K.type === 'side' ? 'lab' : 'tobacco'); }
  function cigPrice(sku, q) { var K = CIG_SKUS[sku], g = K.type === 'side' && dlcOn('lab') ? labGradeOf(q) : null; return g ? Math.max(1, Math.round(K.price * g[2])) : K.price; }
  function cigLabel(sku, q) { var K = CIG_SKUS[sku], g = K.type === 'side' ? labGrade(q) : ''; return K.name + (g ? ' · grade ' + g : ''); }
  function cigStockAdd(sku, n, q) {
    if (!S.cigStock) S.cigStock = {}; if (!S.cigQ || typeof S.cigQ !== 'object') S.cigQ = {}; var have = cigStock(sku);
    if (typeof q === 'number') S.cigQ[sku] = have > 0 ? mixQ(typeof S.cigQ[sku] === 'number' ? S.cigQ[sku] : 50, have, q, n) : q;
    S.cigStock[sku] = have + n;
  }
  function labJobDur(sku) { return Math.round(LAB_JOBS[sku].dur * (dlcHas('lab', 'column') ? 2 / 3 : 1)); }
  function labJobN(sku) { return Math.round(LAB_JOBS[sku].n * (dlcHas('lab', 'still') ? 1.25 : 1)); }
  function labNeeds(sku) { var L = labState(); return !LAB_JOBS[sku].mix ? '' : L.honey > 0 ? 'honey' : (S.supplies.mix || 0) > 0 ? 'mix' : 'none'; }
  function labStart(sid, sku, quiet) {
    var L = labState(), J = LAB_JOBS[sku], s = S.stash[sid]; if (!J || L.job || !s || s.g < J.g) return false; var need = labNeeds(sku); if (need === 'none') return false;
    var d = stashDraw(sid, J.g); if (need === 'honey') L.honey--; else if (need === 'mix') S.supplies.mix--;
    var q = clamp(d.q + (need === 'honey' ? 8 : 0) + (dlcHas('lab', 'bench') ? 10 : 0), 0, 100);
    L.job = { sku: sku, n: labJobN(sku), t: 0, dur: labJobDur(sku), q: Math.round(q) }; world.dirtyShelf = true;
    if (!quiet) { sfx('click'); toast('🧪 Batch started: grade ' + labGrade(q), ''); save(); } return true;
  }
  function labShelve(J) { var L = labState(); if (typeof J.q === 'number') L.q[J.sku] = mixQ(L.q[J.sku], L.out[J.sku] || 0, J.q, J.n); L.out[J.sku] = (L.out[J.sku] || 0) + J.n; }
  function labTechPick() {   // the technician takes the roughest bud there is enough of, and makes what the shop has least of
    var L = labState(), bud = Object.keys(S.stash).filter(function (k) { var s = S.stash[k]; return s.g >= LAB_TECH.grams && s.qSum / s.g < LAB_TECH.maxQ; }).sort(function (a, b) { return S.stash[a].qSum / S.stash[a].g - S.stash[b].qSum / S.stash[b].g; })[0];
    if (!bud) return null;
    var sku = Object.keys(LAB_JOBS).filter(function (k) { return labNeeds(k) !== 'none' && (L.out[k] || 0) + cigStock(k) < LAB_TECH.stock; }).sort(function (a, b) { return (L.out[a] || 0) + cigStock(a) - (L.out[b] || 0) - cigStock(b); })[0];
    return sku ? { strain: bud, sku: sku } : null;
  }
  function labMenu() {
    var X = xs(), L = labState(), lines = [], out = L.out, h = held();
    if (L.job) lines.push({ label: '⏳ Running: ' + L.job.n + ' × ' + cigLabel(L.job.sku, L.job.q) + ' · ' + Math.ceil(L.job.dur - L.job.t) + ' s left' + (powerOn() ? '' : ' · paused, no power'), cls: 'muted' });
    if (h && h.kind === 'cigs' && h.sku === 'honey') lines.push({ label: '🍯 Put ' + h.n + ' × honey in the lab store <small>a jar does the work of a baking mix, and the batch comes out 8 points better</small>', act: function () { L.honey += h.n; S.hotbar[S.slot] = null; sfx('putdown'); toast('🍯 Honey in the lab store: ' + L.honey + ' jars', 'good'); save(); } });
    var strains = Object.keys(S.stash).filter(function (k) { return S.stash[k].g >= 5; }).sort(function (a, b) { return S.stash[b].g - S.stash[a].g; });
    if (!strains.length) lines.push({ label: 'Nothing to run. Bring at least 5 g of cured bud in the stash. Any bud will do, and better bud makes a better grade.', cls: 'muted' });
    strains.slice(0, 2).forEach(function (sid) {
      var nm = strainById(sid).name, s = S.stash[sid], q = s.qSum / s.g;
      Object.keys(LAB_JOBS).forEach(function (sku) {
        var J = LAB_JOBS[sku], need = labNeeds(sku), jq = clamp(q + (need === 'honey' ? 8 : 0) + (dlcHas('lab', 'bench') ? 10 : 0), 0, 100), ok = !L.job && s.g >= J.g && need !== 'none';
        lines.push({ label: '🧪 ' + J.g + ' g of ' + nm + ' → ' + labJobN(sku) + ' × ' + CIG_SKUS[sku].name + ' · grade ' + labGrade(jq) + ' <small>' + labJobDur(sku) + ' s' + (J.mix ? (need === 'honey' ? ' · uses 1 honey (' + L.honey + ')' : ' · uses 1 baking mix (' + (S.supplies.mix || 0) + ')') : '') + ' · sells at ' + money(cigPrice(sku, jq)) + '</small>', cls: ok ? '' : 'muted', act: ok ? function () { labStart(sid, sku, false); } : null });
      });
    });
    lines.push({ label: (X.staff.labtech ? '🥼 The technician is on the payroll' : '🥼 No technician') + ' <small>' + (X.staff.labtech ? 'runs bud under quality ' + LAB_TECH.maxQ + ' into whatever the shop has least of' : 'hire one at the staff roster board in the office: ' + money(LAB_TECH.wage) + ' a day') + '</small>', cls: X.staff.labtech ? 'on' : 'muted' });
    Object.keys(out).forEach(function (k) { if (out[k] > 0) lines.push({ label: '📦 Take ' + Math.min(12, out[k]) + ' × ' + cigLabel(k, L.q[k]) + ' <small>' + out[k] + ' on the shelf · ' + money(cigPrice(k, L.q[k])) + ' each from the cigarette cabinet</small>', act: function () { if (hotbarFull()) { toast('Your hands are full (G puts things down)', 'bad'); return; } var n = Math.min(12, out[k]); out[k] -= n; take({ kind: 'cigs', sku: k, n: n, q: L.q[k] }); save(); } }); });
    ctxOpen('🧪 Extraction lab', 'the grade follows the bud: A from quality 80, B from 60, C from 40', lines);
  }
  hooks.boot.push(function () {   // the technician stands at the rig while one is hired
    var h = makePerson({ shirt: 0xf2f4f5, pants: 0x2b3340, coat: 0xf2f4f5, glasses: true, longSleeve: true, hair: 0x3a2a1c, mood: 'happy' }); h.position.set(19.2, -200, -3.4); h.rotation.y = Math.PI * 0.85; world.group.add(h);
    var hb = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.9, 0.9), MAT.none); hb.position.y = 0.95; h.add(hb); interactable(hb, { kind: 'labTech' }); labUI.tech = h;
  });
  dlcDefine({ id: 'lab', name: DLC_NAME.lab, kinds: ['labTech'],
    prompt: function () { var L = labState(); return 'Lab technician <small>' + (L.job ? 'running ' + cigLabel(L.job.sku, L.job.q) : 'waiting for bud under quality ' + LAB_TECH.maxQ) + ' · E for the batch sheet</small>'; },
    interact: function () { labMenu(); },
    tick: function (dt) {
      labUI.t += dt; if (labUI.t < 5) return; labUI.t = 0; var X = xs(); if (!X.staff.labtech || labState().job || !powerOn()) return;
      var p = labTechPick(); if (p && labStart(p.strain, p.sku, true)) logEvent('🥼 The technician started ' + labState().job.n + ' × ' + cigLabel(p.sku, labState().job.q) + ' from ' + strainById(p.strain).name, '');
    },
    update: function (dt) { var h = labUI.tech; if (!h) return; var on = !!xs().staff.labtech; h.position.y = on ? BASE.y : -200; if (on && player.floor === -1 && player.pos.x > 12 && player.pos.x < 26) animatePerson(h, dt, 'idle', 0, player.pos); }
  });
