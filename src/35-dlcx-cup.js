//@ DLC: the Cannabis Cup. Every seventh day the town judges one jar from every grower. Enter yours at the trophy cabinet in the lobby
  // ── DLC: the Cannabis Cup ──
  var CUP = { every: 7, grams: 10, rivals: ['Green Leaf', 'Uptown Buds', 'Old Mill Farms', 'Harbour Hydro', 'The Potting Shed'], metal: { gold: 0xd9b23a, silver: 0xc4c9cf, bronze: 0xb0703a }, shelf: 9 };
  function cupState() { return dlcState('cup', { entry: null, trophies: [], history: [] }); }
  function cupNext() { var d = S.day || 1; return Math.ceil((d + 0.001) / CUP.every) * CUP.every; }   /* the next judging day, never today */
  function cupScore(q, thc) { return q * 0.62 + (thc - 1) * 22; }
  function cupEnter(id) {
    var C = cupState(), s = stashOf(id); if (s.g < CUP.grams) { toast('A Cup entry is ' + CUP.grams + ' g of one strain', 'bad'); return; }
    if (C.entry) cupWithdraw(true);
    var d = stashDraw(id, CUP.grams); C.entry = { strain: id, q: Math.round(d.q), thc: Math.round(d.thc * 100) / 100, day: cupNext() }; world.dirtyShelf = true; sfx('rare');
    toast('🏆 ' + strainById(id).name + ' is entered for the Cup on day ' + C.entry.day + '.', 'good'); logEvent('🏆 Entered ' + CUP.grams + ' g of ' + strainById(id).name + ' (quality ' + C.entry.q + ') for the Cannabis Cup', ''); if (propInst.trophyCase) buildProp('trophyCase');
  }
  function cupWithdraw(quiet) { var C = cupState(), e = C.entry; if (!e) return; stashAdd(e.strain, CUP.grams, e.q, e.thc); C.entry = null; world.dirtyShelf = true; if (!quiet) { toast('Took your entry back into the stash', ''); if (propInst.trophyCase) buildProp('trophyCase'); } }
  function cupJudge() {
    var C = cupState(), e = C.entry, lvl = S.level || 1, day = S.day || 1; C.entry = null;
    var field = CUP.rivals.map(function (n) { return { who: n, score: 46 + Math.min(40, lvl * 2.5) + randf(-8, 8) }; });
    if (!e) { field.sort(function (a, b) { return b.score - a.score; }); C.history.unshift({ day: day, place: 0, note: field[0].who + ' took the Cup. You had no jar in.' }); C.history.length = Math.min(C.history.length, 8); logEvent('🏆 Cup day: ' + field[0].who + ' took it. You had no jar in.', ''); return; }
    var st = strainById(e.strain), mine = { who: 'you', score: cupScore(e.q, e.thc) + randf(-5, 5) }; field.push(mine); field.sort(function (a, b) { return b.score - a.score; });
    var place = field.indexOf(mine) + 1, metal = ['', 'gold', 'silver', 'bronze'][place] || '', prize = place === 1 ? 1200 + lvl * 100 : place === 2 ? 500 : place === 3 ? 200 : 0, rep = [0, 12, 6, 3][place] || 1;
    S.rep += rep; if (prize) S.bank += prize; gainXp(place <= 3 ? 60 - place * 12 : 8);
    if (metal) { C.trophies.push({ metal: metal, strain: st.name, day: day }); if (C.trophies.length > 40) C.trophies.shift(); }
    var said = place === 1 ? '🏆 You won the Cannabis Cup with ' + st.name + '. ' + money(prize) + ' prize money and a gold cup for the cabinet (rep +' + rep + ').' : place <= 3 ? '🏆 ' + st.name + ' came ' + (place === 2 ? 'second' : 'third') + ' at the Cup: ' + money(prize) + ' and a ' + metal + ' cup (rep +' + rep + ').' : '🏆 ' + st.name + ' came ' + place + 'th of ' + field.length + ' at the Cup. ' + field[0].who + ' took it (rep +1).';
    C.history.unshift({ day: day, place: place, note: st.name + ', quality ' + e.q + ': ' + (place === 1 ? 'first' : place === 2 ? 'second' : place === 3 ? 'third' : place + 'th') + ' of ' + field.length + (prize ? ', ' + money(prize) : '') }); C.history.length = Math.min(C.history.length, 8);
    logEvent(said, place <= 3 ? 'rare' : ''); toast(said, place <= 3 ? 'rare' : ''); sfx(place <= 3 ? 'levelup' : 'click'); if (propInst.trophyCase) buildProp('trophyCase');
  }
  function cupGolds() { return cupState().trophies.filter(function (t) { return t.metal === 'gold'; }).length; }
  function paneCup() {
    var C = cupState(), next = cupNext(), left = next - (S.day || 1), h = '<div class="g3-grid"><div class="g3-box"><h3>🏆 The next Cup · day ' + next + '</h3><div class="desc">' + (left === 1 ? 'Judging is tomorrow morning.' : 'Judging is in ' + left + ' days.') + ' Three judges score one jar from every grower in town on how well it was grown, how strong it is and how it was cured. You enter ' + CUP.grams + ' g of one strain.</div>';
    if (C.entry) { var st = strainById(C.entry.strain); h += '<div class="g3-customer premium"><span class="avatar">' + st.emoji + '</span><div><span class="who">' + esc(st.name) + '</span><span class="req">quality ' + C.entry.q + ' · strength ' + C.entry.thc.toFixed(2) + '× · in the entry jar</span></div></div><button class="g3-btn wide" data-act="cupWithdraw">Take it back into the stash</button>'; }
    else h += '<div class="g3-empty">No jar entered yet.</div>';
    var can = STRAINS.filter(function (st) { return stashOf(st.id).g >= CUP.grams; });
    h += '<div class="desc" style="margin-top:12px">' + (C.entry ? 'Enter a different jar instead' : 'Enter a jar') + '</div>';
    if (!can.length) h += '<div class="g3-empty">You need ' + CUP.grams + ' g of one cured strain in the stash.</div>';
    can.sort(function (a, b) { var sa = stashOf(a.id), sb = stashOf(b.id); return cupScore(sb.qSum / sb.g, sb.thcSum / sb.g) - cupScore(sa.qSum / sa.g, sa.thcSum / sa.g); }).forEach(function (st) { var s = stashOf(st.id), q = s.qSum / s.g, t = s.thcSum / s.g; h += '<div class="g3-row"><span class="ico">' + st.emoji + '</span><span class="meta"><span class="n">' + esc(st.name) + '</span><span class="own">quality ' + Math.round(q) + ' · strength ' + t.toFixed(2) + '× · ' + gram(s.g) + ' in the stash</span></span><button class="g3-btn" data-act="cupEnter" data-id="' + st.id + '">Enter ' + CUP.grams + ' g</button></div>'; });
    h += '</div><div class="g3-box"><h3>🥇 The cabinet</h3><div class="g3-chips">' + ['gold', 'silver', 'bronze'].map(function (m) { return chip(m, C.trophies.filter(function (t) { return t.metal === m; }).length); }).join('') + '</div><div class="desc">Every gold cup in the cabinet brings more people through the door: ' + Math.round((cupFootfall() - 1) * 100) + '% more at the moment, up to 15%.</div>';
    if (!C.history.length) h += '<div class="g3-empty">No Cup has been judged yet.</div>';
    C.history.forEach(function (r) { h += '<div class="g3-row"><span class="ico">' + (['·', '🥇', '🥈', '🥉'][r.place] || '·') + '</span><span class="meta"><span class="n">Day ' + r.day + '</span><span class="own">' + esc(r.note) + '</span></span></div>'; });
    return h + '</div></div>';
  }
  function cupFootfall() { return 1 + Math.min(0.15, cupGolds() * 0.03); }
  hooks.panel.cup = function () { return { title: '🏆 The Cannabis Cup', body: paneCup() }; };
  hooks.panelClick.push(function (act, b) { if (act === 'cupEnter') { cupEnter(b.getAttribute('data-id')); return true; } if (act === 'cupWithdraw') { cupWithdraw(false); return true; } return false; });
  function trophyMesh(metal, s) {   // a two-handled cup on a stepped base
    var g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: CUP.metal[metal], roughness: 0.22, metalness: 1 }), wood = MAT.darkwood;
    function add(geo, mat, y) { var x = new THREE.Mesh(geo, mat); x.position.y = y; x.castShadow = true; g.add(x); return x; }
    add(roundCylGeo(0.05, 0.055, 0.03, 20), wood, 0.015); add(roundCylGeo(0.036, 0.042, 0.016, 20), m, 0.038); add(roundCylGeo(0.01, 0.014, 0.06, 12), m, 0.076); add(new THREE.SphereGeometry(0.016, 12, 10), m, 0.082);
    var bowl = add(new THREE.CylinderGeometry(0.052, 0.022, 0.085, 24, 1, true), m, 0.148); bowl.material = m.clone(); bowl.material.side = THREE.DoubleSide; add(new THREE.TorusGeometry(0.052, 0.004, 8, 24), m, 0.19).rotation.x = Math.PI / 2; add(roundCylGeo(0.024, 0.02, 0.01, 16), m, 0.108);
    [-1, 1].forEach(function (sd) { var h = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.0045, 8, 16, Math.PI), m); h.position.set(sd * 0.05, 0.15, 0); h.rotation.z = sd * -Math.PI / 2; g.add(h); });
    g.scale.setScalar(s || 1); return g;
  }
  PROP_DLC.trophyCase = ['cup'];
  defProp('trophyCase', { label: 'trophy cabinet', x: -5.25, z: 4 + WALL_T / 2 + 0.24, rot: 0, build: function (c) {
    // a glazed cabinet in dark wood: three lit glass shelves, the entry jar on a stand in the middle of the top one
    var C = cupState(), w = 1.3, d = 0.42;
    c.box(w, 0.5, d, MAT.darkwood, 0, 0.25, 0, { solid: true }); drawer(c, 0.56, 0.3, 0.02, -0.31, 0.27, d / 2 - 0.01); drawer(c, 0.56, 0.3, 0.02, 0.31, 0.27, d / 2 - 0.01); c.box(w + 0.04, 0.04, d + 0.04, MAT.darkwood, 0, 0.52, 0); c.box(w + 0.04, 0.06, d + 0.04, MAT.darkwood, 0, 2.0, 0);
    c.box(w, 1.46, 0.02, colorMat(0x16241c, 0.9), 0, 1.26, -d / 2 + 0.01, { cast: false }); [-1, 1].forEach(function (sd) { c.box(0.04, 1.46, d, MAT.darkwood, sd * (w / 2 - 0.02), 1.26, 0); c.box(0.006, 1.4, d - 0.06, MAT.glass, sd * (w / 2 - 0.05), 1.26, 0, { cast: false, sharp: true }); });
    var gl = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.1, 1.42), new THREE.MeshPhysicalMaterial({ color: 0xdff0ff, transparent: true, opacity: 0.12, roughness: 0.02, clearcoat: 1, side: THREE.DoubleSide })); gl.position.set(0, 1.26, d / 2 - 0.01); c.add(gl); c.box(0.03, 1.46, 0.03, MAT.darkwood, 0, 1.26, d / 2 - 0.01); c.cyl(0.008, 0.008, 0.12, MAT.brass, 0.05, 1.2, d / 2 + 0.012, 8);
    var ys = [0.56, 1.04, 1.52]; ys.forEach(function (y) { if (y > 0.6) c.box(w - 0.1, 0.012, d - 0.06, MAT.glass, 0, y, 0, { cast: false, sharp: true }); c.lit(0xfff1cf, w - 0.14, 0.014, 0, y + 0.455, d / 2 - 0.05, 0, Math.PI / 2); });
    c.light(new THREE.PointLight(0xffe9b0, 0.5, 2.4), 0, 1.5, 0.5);
    var show = C.trophies.slice(-CUP.shelf).reverse(), order = { gold: 0, silver: 1, bronze: 2 }; show.sort(function (a, b) { return order[a.metal] - order[b.metal]; });
    show.forEach(function (t, i) { var row = Math.floor(i / 3), col = i % 3, tm = trophyMesh(t.metal, t.metal === 'gold' ? 1.35 : 1.15); tm.position.set(-0.4 + col * 0.4, [1.532, 1.052, 0.572][row], -0.04); c.add(tm); c.sign([t.strain, 'day ' + t.day], 0.26, 0.07, -0.4 + col * 0.4, [1.532, 1.052, 0.572][row] + 0.036, 0.13, 0, { size: 17, bg: '#c9a24a', color: '#2a2210', titleColor: '#2a2210', line: 'rgba(60,45,10,.6)' }); });
    if (!show.length) c.sign(['No cups yet', 'enter a jar and win one'], 0.6, 0.18, 0, 1.2, 0.0, 0, { size: 26, bg: 'rgba(0,0,0,0)', color: '#a2ad9c', titleColor: '#f3eee0', line: 'rgba(0,0,0,0)' });
    if (C.entry) { var st = strainById(C.entry.strain); c.cyl(0.07, 0.08, 0.03, MAT.darkwood, 0.45, 0.595, 0.1, 18); c.cyl(0.05, 0.05, 0.11, MAT.jar, 0.45, 0.665, 0.1, 18); c.cyl(0.042, 0.042, 0.07, colorMat(st.bud, 0.9), 0.45, 0.65, 0.1, 12); c.cyl(0.052, 0.052, 0.014, MAT.jarLid, 0.45, 0.727, 0.1, 18); }
    c.sign(['THE CANNABIS CUP', 'next judging: day ' + cupNext()], 1.1, 0.3, 0, 2.22, -0.1, 0, { titleColor: '#f0b94d' });
    c.hit(w, 2.0, d + 0.1, 0, 1.0, 0.03, { kind: 'trophyCase' });
  } });
  dlcDefine({ id: 'cup', name: 'The Cannabis Cup', kinds: ['trophyCase'],
    prompt: function () { var C = cupState(), left = cupNext() - (S.day || 1); return 'Trophy cabinet <small>' + (C.entry ? strainById(C.entry.strain).name + ' is entered' : 'no jar entered') + ' · the Cup is ' + (left === 1 ? 'tomorrow' : 'in ' + left + ' days') + '</small>'; },
    interact: function () { ui.openPanel('cup'); },
    newDay: function () { if ((S.day || 1) % CUP.every === 0) cupJudge(); else if (propInst.trophyCase) buildProp('trophyCase'); },
    footfall: cupFootfall
  });
