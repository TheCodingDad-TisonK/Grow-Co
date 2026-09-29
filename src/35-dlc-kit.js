//@ DLC kit: what a DLC needs from the game, kept in one place; the six DLC of 1.27 are built on it
  // ── DLC kit ──
  // A DLC defined here is a record: an id the Workshop switches, the kinds of thing in the world that belong to it, and the
  // functions the game calls. Its state lives in S.dlc[id], made on first use with defaults, so an old save loads and a DLC
  // switched off keeps everything it had. Its furniture is ordinary props, listed in PROP_DLC, so build mode moves them and
  // switching the DLC off takes them out of the shop.
  //   dlcDefine({ id, name, kinds: [...], prompt(d, h), interact(d, h, shift), tick(dt, offline), update(dt), newDay(offline), footfall() })
  var DLCX = { list: [], kinds: {} };
  function dlcDefine(o) { DLCX.list.push(o); (o.kinds || []).forEach(function (k) { DLCX.kinds[k] = o; }); DLC_NAME[o.id] = o.name; return o; }
  function dlcState(id, defaults) {
    if (!S.dlc || typeof S.dlc !== 'object' || Array.isArray(S.dlc)) S.dlc = {}; var st = S.dlc[id]; if (!st || typeof st !== 'object') st = S.dlc[id] = {};
    for (var k in defaults) if (st[k] === undefined || st[k] === null && defaults[k] !== null && typeof defaults[k] === 'object') st[k] = JSON.parse(JSON.stringify(defaults[k]));
    return st;
  }
  function dlcPrompt(d, h) { var o = DLCX.kinds[d.kind]; if (!o) return null; return dlcOn(o.id) ? o.prompt(d, h) : o.name + ' <small>a DLC that is switched off</small>'; }
  function dlcInteract(d, h, shift) { var o = DLCX.kinds[d.kind]; if (!o) return false; if (!dlcOn(o.id)) dlcOff(o.id); else o.interact(d, h, shift); return true; }
  function dlcEach(fn, a, b) { DLCX.list.forEach(function (o) { if (o[fn] && dlcOn(o.id)) { try { o[fn](a, b); } catch (e) { console.error('[dlc ' + o.id + '] ' + fn, e); } } }); }
  function dlcStep(dt, offline) { dlcEach('tick', dt, offline); }
  function dlcNewDay(offline) { dlcEach('newDay', offline); }
  function dlcLoaded() { DLCX.list.forEach(function (o) { if (o.loaded) { try { o.loaded(); } catch (e) { console.error('[dlc ' + o.id + '] loaded', e); } } }); }   /* runs whether the DLC is on or not: a save may hold things a switched-off DLC made */
  function dlcFootfall() { var f = 1; DLCX.list.forEach(function (o) { if (o.footfall && dlcOn(o.id)) f *= o.footfall(); }); return f; }
  hooks.frame.push(function (dt) { if (ui.started && !ui.menuOpen) dlcEach('update', dt); });
  function shiftDown() { return !!(player.keys.ShiftLeft || player.keys.ShiftRight); }
  function payBank(n, what) { if (S.bank < n) { sfx('bad'); toast(what + ' costs ' + money(n) + ', and the bank holds ' + money(S.bank), 'bad'); return false; } S.bank -= n; sfx('cash'); return true; }
  function strainsWithSeed(n) { return STRAINS.filter(function (st) { return (S.supplies['seed_' + st.id] || 0) >= (n || 1); }); }
  function minsLeft(sec) { sec = Math.max(0, Math.ceil(sec)); return sec >= 90 ? Math.round(sec / 60) + ' min' : sec + ' s'; }
  function barHtml(frac, cls) { return '<div class="g3-bar' + (cls ? ' ' + cls : '') + '"><span style="width:' + Math.round(clamp(frac, 0, 1) * 100) + '%"></span></div>'; }
  // something you have to buy before it is fitted: a taped outline on the floor and a sign that says what it costs
  function notFitted(c, w, d, lines, kind) {
    var tape = colorMat(0xe3b52c, 0.7); c.box(w, 0.006, 0.05, tape, 0, 0.006, d / 2, { cast: false, sharp: true }); c.box(w, 0.006, 0.05, tape, 0, 0.006, -d / 2, { cast: false, sharp: true }); c.box(0.05, 0.006, d, tape, -w / 2, 0.006, 0, { cast: false, sharp: true }); c.box(0.05, 0.006, d, tape, w / 2, 0.006, 0, { cast: false, sharp: true });
    c.cyl(0.12, 0.14, 0.03, MAT.gunmetal, 0, 0.015, 0, 20); c.cyl(0.012, 0.012, 1.25, MAT.alu, 0, 0.64, 0, 10); c.sign(lines, 0.7, 0.3, 0, 1.4, 0.012, 0, { titleColor: '#f0b94d' });
    c.hit(w, 1.7, d, 0, 0.85, 0, { kind: kind });
  }
  // a plant for anywhere that is not the tent (the hydro bay, the breeding bench, the field): no label and no pests, it just grows
  function plantFigure(st) {
    var g = new THREE.Group(), stemM = MAT.stem.clone(), leafM = MAT.leaf.clone(), budM = MAT.bud.clone(); stemM.color.setHex(st.leaf).lerp(new THREE.Color(0x6a5a3a), 0.35); leafM.color.setHex(st.leaf); budM.color.setHex(st.bud);
    var stem = new THREE.Mesh(roundCylGeo(0.008, 0.018, 1, 8), stemM); stem.castShadow = true; g.add(stem);
    var nodes = [], buds = [];
    for (var i = 0; i < 6; i++) { var n = new THREE.Group(); n.rotation.y = i * 2.4; [0, Math.PI].forEach(function (sd) { var hld = new THREE.Group(); hld.rotation.y = sd; var lf = new THREE.Mesh(LEAF_GEO, leafM); lf.rotation.x = -1.05; lf.castShadow = true; hld.add(lf); n.add(hld); }); g.add(n); nodes.push(n); }
    for (var b = 0; b < 7; b++) { var bd = new THREE.Mesh(BUD_GEO, budM); bd.rotation.set(b, b * 2.1, b * 0.7); bd.castShadow = true; g.add(bd); buds.push(bd); }
    g.userData.set = function (pr, size) {
      size = size || 1; pr = clamp(pr, 0, 1); var hgt = (0.06 + pr * 0.8) * size; stem.scale.set(0.5 + pr * 0.8, hgt, 0.5 + pr * 0.8); stem.position.y = hgt / 2;
      nodes.forEach(function (n, k) { var on = k < Math.floor(1 + pr * 6.5) && pr > 0.04; n.visible = on; if (!on) return; n.position.y = Math.min(hgt - 0.02, (0.14 + k / 5 * 0.8) * hgt); n.scale.setScalar(clamp((pr * 6.5 - k) / 1.5, 0.15, 1) * (0.4 + pr * 0.6) * (1 - k / 14) * size); });
      var ft = clamp((pr - 0.62) / 0.38, 0, 1);
      buds.forEach(function (bd, b) { var t = clamp(ft * 1.5 - b * 0.08, 0, 1); bd.visible = t > 0; var s = (0.4 + t * 1.1) * (1 - b * 0.06) * size; bd.scale.set(s, s * 1.2, s); var a = b * 2.4, r = 0.045 * (1 - b / 9) * size; bd.position.set(Math.cos(a) * r, hgt * (0.62 + b * 0.065), Math.sin(a) * r); });
    };
    g.userData.set(0); return g;
  }
  // a small lit read-out for a machine: returns the mesh, and .userData.draw(lines, accent) redraws it
  function readout(pw, ph, accent) {
    var cv = document.createElement('canvas'); cv.width = 384; cv.height = Math.round(384 * ph / pw); var m = litPlane(cv, pw, ph), last = '';
    m.userData.draw = function (lines, col) { var key = lines.join('|') + (col || ''); if (key === last) return; last = key; var ctx = cv.getContext('2d'), W = cv.width, H = cv.height; scrLcd(ctx, W, H, col || accent || DESK_OK); ctx.fillStyle = col || accent || DESK_OK; ctx.font = '700 30px ' + DESK_FONT; ctx.fillText(deskTrim(ctx, lines[0] || '', W - 36), 18, 16); ctx.fillStyle = DESK_INK; ctx.font = '24px ' + DESK_FONT; for (var i = 1; i < lines.length; i++) ctx.fillText(deskTrim(ctx, lines[i], W - 36), 18, 22 + i * 34); m.userData.tex.needsUpdate = true; };
    return m;
  }
