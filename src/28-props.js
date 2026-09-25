//@ movable props and their placements
  // ── Props: movable furniture with saved placements, and the edit mode ──
  // Every prop builds itself in LOCAL coordinates (origin on the floor, +z = front). Its placement
  // {x, z, rot (quarter turns), floor} comes from S.layout[id] or the default; edit mode rewrites it.
  var PROPS = {}; var PROP_ORDER = []; var propInst = {};
  function defProp(id, def) { PROPS[id] = def; PROP_ORDER.push(id); }
  // A prop marked `multi` can be owned more than once. Extra units are ordinary props under a
  // derived id (vending#2), so placement, edit mode, obstacles and the save file all work already.
  // Stock and the cash float stay shop-wide: one storeroom and one float behind however many machines.
  function unitBase(id) { var i = id.indexOf('#'); return i < 0 ? id : id.slice(0, i); }
  function unitCount(base) { var d = PROPS[base]; if (!d || !d.multi) return 1; var n = (S.units && S.units[base]) || 1; return clamp(Math.round(n), 1, d.multi.max); }
  function unitIds(base) { var out = [base]; for (var n = 2; n <= unitCount(base); n++) out.push(base + '#' + n); return out; }
  function machCost(base, n) { return Math.round(PROPS[base].multi.price * Math.pow(1.35, n - 2)); }
  function upgById(id) { for (var i = 0; i < UPGRADES.length; i++) if (UPGRADES[i].id === id) return UPGRADES[i]; return { name: id }; }
  function unitLock(base) { var m = PROPS[base].multi; if (m.lic && !hasLic(m.lic)) return licById(m.lic).name; if (m.upg && !S.upgrades[m.upg]) return upgById(m.upg).name; return null; }
  function unitSpot(base, n) {   // extra units walk out along whichever wall the first one stands against, taking the first clear place either side
    var d = PROPS[base], alongZ = (d.rot === 1 || d.rot === 3), half = d.multi.gap * 0.42, lvl = d.floor || 0;
    var taken = (world.obstacles || []).filter(function (o) { return o.tag === 'prop' && unitBase(o.prop || '') !== base && (o.floorLevel || 0) === lvl; });   /* the walls are obstacles as well, and sliding along one must not count as hitting it */
    var sibs = PROP_ORDER.filter(function (id) { return unitBase(id) === base && PROPS[id]; }).map(propPlacement);
    for (var k = 1; k <= 12; k++) {
      for (var side = 0; side < 2; side++) {
        var step = d.multi.gap * k * (side ? -1 : 1);
        var x = d.x + (alongZ ? 0 : step), z = d.z + (alongZ ? step : 0);
        var lim = alongZ ? ROOM.z : ROOM.x, along = alongZ ? z : x;
        if (along < -lim + 0.7 || along > lim - 0.7) continue;   /* only the axis it slides along needs bounding: the other one is already where the first machine stands, hard against the wall */
        if (taken.some(function (o) { return x + half > o.x1 && x - half < o.x2 && z + half > o.z1 && z - half < o.z2; })) continue;
        if (sibs.some(function (P) { return Math.abs(P.x - x) < d.multi.gap * 0.8 && Math.abs(P.z - z) < d.multi.gap * 0.8; })) continue;
        return { x: x, z: z };
      }
    }
    // The wall is full. Stand it out in front of the first one rather than inside it, so you can
    // see it and drag it where you want with F2.
    var fr = [[0, 1], [1, 0], [0, -1], [-1, 0]][((d.rot % 4) + 4) % 4], out = d.multi.gap * 1.2 * (n - 1);
    return { x: clamp(d.x + fr[0] * out, -ROOM.x + 0.7, ROOM.x - 0.7), z: clamp(d.z + fr[1] * out, -ROOM.z + 0.7, ROOM.z - 0.7) };
  }
  function registerUnits() {   // run once before the world is built, and again every time you buy one
    Object.keys(PROPS).forEach(function (base) {
      var d = PROPS[base]; if (!d.multi || unitBase(base) !== base) return;
      for (var n = 2; n <= unitCount(base); n++) {
        var id = base + '#' + n; if (PROPS[id]) continue;
        var sp = unitSpot(base, n);
        PROPS[id] = Object.assign({}, d, { x: sp.x, z: sp.z, label: d.label + ' ' + n, unit: n });
        PROP_ORDER.push(id);
      }
    });
  }
  function buyUnit(base) {
    var d = PROPS[base]; if (!d || !d.multi) return;
    var have = unitCount(base);
    if (have >= d.multi.max) { toast('There\'s no room for another ' + d.label, 'bad'); return; }
    if (d.multi.lic && !hasLic(d.multi.lic)) { toast('Needs the ' + licById(d.multi.lic).name, 'bad'); return; }
    if (d.multi.upg && !S.upgrades[d.multi.upg]) { toast('Needs the ' + upgById(d.multi.upg).name + ' first', 'bad'); return; }
    if (!spend(machCost(base, have + 1))) return;
    if (!S.units) S.units = {}; S.units[base] = have + 1;
    registerUnits();
    var nid = base + '#' + (have + 1);
    if (!S.layout) S.layout = {};
    S.layout[nid] = Object.assign({}, S.layout[nid] || {}, { x: PROPS[nid].x, z: PROPS[nid].z });   /* pin where it landed: the spot is picked against the room as it stands now, and at load time nothing is built yet */
    buildProp(nid);
    sfx('vault'); toast(d.multi.ico + ' ' + d.label + ' ' + (have + 1) + ' installed. Press F2 to move it.', 'rare');
    logEvent(d.multi.ico + ' Installed ' + d.label + ' ' + (have + 1), 'rare');
    world.dirty = true; save();
  }
  function propPlacement(id) {
    var d = PROPS[id]; var o = (S.layout && S.layout[id]) || {}; var base = unitBase(id);
    var owned = base === id || unitIds(base).indexOf(id) >= 0;   /* a unit you sold or reset away keeps its prop record but builds nothing */
    return { x: typeof o.x === 'number' ? o.x : d.x, z: typeof o.z === 'number' ? o.z : d.z, rot: typeof o.rot === 'number' ? o.rot : (d.rot || 0), floor: d.floor || 0, unit: d.unit || 1, hidden: !!o.hidden || !owned };
  }
  function hiddenProps() { return PROP_ORDER.filter(function (id) { return S.layout && S.layout[id] && S.layout[id].hidden; }); }
  function propCtx(g, id, floorLevel) {
    var obs = [];
    var ctx = {
      box: function (w, h, d, mat, x, y, z, opts) { opts = opts || {}; var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = opts.cast !== false; m.receiveShadow = opts.receive !== false; g.add(m); if (opts.solid) obs.push({ x1: x - w / 2, x2: x + w / 2, z1: z - d / 2, z2: z + d / 2 }); return m; },
      cyl: function (rt, rb, h, mat, x, y, z, seg) { var m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 18), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; },
      add: function (m) { g.add(m); return m; },
      hit: function (w, h, d, x, y, z, data) { var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), MAT.none); m.position.set(x, y, z); g.add(m); if (data) data.propId = id;   /* the prompt has to know WHICH machine it is looking at, not just what kind */ interactable(m, data); m.userData.propId = id; return m; },
      sign: function (lines, w, h, x, y, z, rotY, opts) { opts = opts || {}; var tex = textTex(lines, Math.round(w * 320), Math.round(h * 320), Object.assign({ size: Math.round(h * 48) }, opts)); var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true })); m.position.set(x, y, z); m.rotation.y = rotY || 0; g.add(m); return m; },
      placard: function (lines, w, h, x, y, z, opts) { var stand = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.25, 6), MAT.metal); stand.position.set(x, y - h / 2 - 0.12, z); g.add(stand); return ctx.sign(lines, w, h, x, y, z, 0, opts); },
      solid: function (x1, x2, z1, z2) { obs.push({ x1: x1, x2: x2, z1: z1, z2: z2 }); },
      fern: function (x, z, s) { ctx.cyl(0.22 * s, 0.18 * s, 0.4 * s, MAT.pot, x, 0.2 * s, z); for (var i = 0; i < 7; i++) { var lf = new THREE.Mesh(new THREE.PlaneGeometry(0.22 * s, 0.6 * s), MAT.leaf); lf.position.set(x + Math.cos(i * 0.9) * 0.1, 0.55 * s, z + Math.sin(i * 0.9) * 0.1); lf.rotation.set(-0.5 - (i % 3) * 0.2, i * 0.9, 0); g.add(lf); } obs.push({ x1: x - 0.25, x2: x + 0.25, z1: z - 0.25, z2: z + 0.25 }); },
      group: g, obstacles: obs, floor: floorLevel, dyn: null
    };
    ctx.dynGroup = function () { if (!ctx.dyn) { ctx.dyn = new THREE.Group(); g.add(ctx.dyn); } return ctx.dyn; };
    return ctx;
  }
  function rotAABB(o, rot) { var r = ((rot % 4) + 4) % 4; if (r === 0) return o; if (r === 1) return { x1: o.z1, x2: o.z2, z1: -o.x2, z2: -o.x1 }; if (r === 2) return { x1: -o.x2, x2: -o.x1, z1: -o.z2, z2: -o.z1 }; return { x1: -o.z2, x2: -o.z1, z1: o.x1, z2: o.x2 }; }
  function buildProp(id) {
    var def = PROPS[id]; var old = propInst[id];
    if (old) { world.group.remove(old.g); disposeTree(old.g); world.interact = world.interact.filter(function (m) { return m.userData.propId !== id; }); world.obstacles = world.obstacles.filter(function (o) { return o.prop !== id; }); if (old.lights) old.lights.forEach(function (l) { scene.remove(l); }); }
    var P = propPlacement(id); var g = new THREE.Group(); g.position.set(P.x, P.floor === 1 ? UP.y : 0, P.z); g.rotation.y = P.rot * Math.PI / 2; g.userData.propId = id; world.group.add(g);
    var ctx = propCtx(g, id, P.floor); var inst = { g: g, def: def, P: P, ctx: ctx, lights: [] }; propInst[id] = inst;
    ctx.light = function (l, x, y, z) { l.position.set(x, y, z); g.add(l); inst.lights.push(l); return l; };
    if (!P.hidden) def.build(ctx, P);   // removed in creative mode: the prop exists but builds nothing until restored
    g.traverse(function (o) { if (o.isMesh) o.userData.propId = id; });
    ctx.obstacles.forEach(function (o) { var r = rotAABB(o, P.rot); world.obstacles.push({ x1: P.x + Math.min(r.x1, r.x2), x2: P.x + Math.max(r.x1, r.x2), z1: P.z + Math.min(r.z1, r.z2), z2: P.z + Math.max(r.z1, r.z2), tag: 'prop', prop: id, floorLevel: P.floor }); });
    if (def.after) def.after(ctx, P, inst, id);
  }
  function buildAllProps() { PROP_ORDER.forEach(buildProp); defightSoon(); }
  function propWorld(id, lx, lz) { var inst = propInst[id]; inst.g.updateMatrixWorld(true); var v = new THREE.Vector3(lx, 0, lz); inst.g.localToWorld(v); return v; }   // fresh matrix: props are queried right after they are built, before any render

