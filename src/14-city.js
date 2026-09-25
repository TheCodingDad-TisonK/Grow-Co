//@ the city: streets, greenery, facades and street furniture
  // ── The city: a street grid round the shop, places worth visiting, a car to get there and a map on M ──
  var CITY = { x: 122, z1: -64, z2: 96, mainZ: 17.9, backZ: -40, northZ: 78, westX: -64, eastX: 64, laneX: 4.5, blds: [], pois: [], roads: [], parks: [] };
  if (WSCITY.grow > 0) { CITY.x += WSCITY.grow; CITY.z1 -= Math.round(WSCITY.grow * 0.5); CITY.z2 += Math.round(WSCITY.grow * 0.5); }   /* a city pack widens the world: the player clamp, the traffic wrap, the drop finder and the map all read these */
  var drive = { on: false, v: 0, g: null, wheels: [], cam: new THREE.Vector3(), gateAuto: false, eng: null, bumpT: 0, engineOn: false, braking: false, rpm: 0, dist: 6.2, look: { yaw: 0, pitch: 0.12, t: 0 }, parts: null, lamps: null, shut: null, dashT: 0, warnT: 0 };
  var traffic = [], parkFolk = [], cityMap = { el: null, cv: null, on: false, t: 0 };
  function vehState(id) {   /* S.car and S.van: where it stands, what is in the back, lights, handbrake, odometer, which parts are open */
    var d = id === 'van' ? { x: 7.0, z: -15.3 } : { x: 12.8, z: -18.25 };   /* the van is 5 m long: at 7.0 its tail clears the garage wall */
    if (!S[id] || typeof S[id].x !== 'number') S[id] = { x: d.x, z: d.z, h: Math.PI / 2, trunk: {} }; if (!S[id].trunk) S[id].trunk = {};
    if (typeof S[id].lights !== 'number') S[id].lights = 0; if (typeof S[id].brake !== 'boolean') S[id].brake = true; if (typeof S[id].odo !== 'number') S[id].odo = 0;
    if (!S[id].open) S[id].open = { doorL: false, doorR: false, boot: false, bonnet: false, hatch: false, counter: false };
    if (!S[id].cigs || typeof S[id].cigs !== 'object') S[id].cigs = {};   /* cartons ride in whichever vehicle they were loaded into */
    return S[id];
  }
  function carState() { return vehState(drive.veh || 'car'); }   /* the vehicle in hand: the one being driven, else the one last touched */
  function selectVehicle(id) { var V = drive.vehicles && drive.vehicles[id]; if (!V) return; drive.veh = id; drive.g = V.g; drive.wheels = V.wheels; drive.parts = V.parts; drive.lamps = V.lamps; drive.dist = V.dist || 6.2; }
  function vehName() { return drive.veh === 'van' ? 'van' : 'car'; }
  var WIN_TEX = null;
  // ── Greenery: trees, bushes, grass tufts and flowers ──
  // Every tree, bush, tuft and flower in the town is an instance of one of a handful of merged geometries, so
  // the whole lot costs about a dozen draw calls however many there are. Crowns are lumpy spheres under a
  // dappled leaf texture; tufts and flowers are crossed alpha-cut cards that never cast a shadow.
  var FLORA = { seed: 91, sets: {}, _m: new THREE.Matrix4(), _p: new THREE.Vector3(), _q: new THREE.Quaternion(), _s: new THREE.Vector3(), _c: new THREE.Color(), _e: new THREE.Euler(), UP: new THREE.Vector3(0, 1, 0) };
  function frnd() { FLORA.seed = (FLORA.seed * 1103515245 + 12345) & 0x7fffffff; return FLORA.seed / 0x7fffffff; }
  function fr(a, b) { return a + (b - a) * frnd(); }
  function mergeGeo(parts) {   // [{ g, m }] -> one non-indexed geometry (position, normal, uv)
    var pos = [], nor = [], uv = [], i;
    parts.forEach(function (p) { var g = p.g.toNonIndexed(); if (p.m) g.applyMatrix4(p.m); var P = g.attributes.position.array, N = g.attributes.normal.array, U = g.attributes.uv.array; for (i = 0; i < P.length; i++) pos.push(P[i]); for (i = 0; i < N.length; i++) nor.push(N[i]); for (i = 0; i < U.length; i++) uv.push(U[i]); g.dispose(); p.g.dispose(); });
    var out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); out.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); return out;
  }
  function lumpy(g, jitter, ph, sx, sy, sz) {   // a smooth bulge field over the vertices, so seams stay closed
    var p = g.attributes.position; for (var i = 0; i < p.count; i++) { var x = p.getX(i), y = p.getY(i), z = p.getZ(i); var k = 1 + jitter * Math.sin(x * 3.1 + y * 2.3 + ph) * Math.cos(z * 2.7 - x * 1.9 + ph * 0.7); p.setXYZ(i, x * k * (sx || 1), y * k * (sy || 1), z * k * (sz || 1)); } g.computeVertexNormals(); return g;
  }
  function placeM(x, y, z, ry, s, rx, rz) { FLORA._p.set(x, y, z); FLORA._e.set(rx || 0, ry || 0, rz || 0); FLORA._q.setFromEuler(FLORA._e); FLORA._s.set(s, s, s); return FLORA._m.compose(FLORA._p, FLORA._q, FLORA._s); }
  function alongM(bx, by, bz, dir, len) { var m = new THREE.Matrix4(); FLORA._q.setFromUnitVectors(FLORA.UP, dir); FLORA._p.set(bx + dir.x * len / 2, by + dir.y * len / 2, bz + dir.z * len / 2); FLORA._s.set(1, 1, 1); return m.compose(FLORA._p, FLORA._q, FLORA._s); }
  function broadleafGeo() {   // trunk with three branches, six lumpy clumps and a cap: about 5.5 m at scale 1
    var trunk = [], crown = [], th = fr(2.3, 2.9), i;
    trunk.push({ g: new THREE.CylinderGeometry(0.11, 0.2, th, 8), m: new THREE.Matrix4().makeTranslation(0, th / 2, 0) });
    for (i = 0; i < 3; i++) { var a = i * 2.1 + fr(0, 0.6), tilt = fr(0.55, 0.85), bl = fr(1.1, 1.6); var dir = new THREE.Vector3(Math.cos(a) * Math.sin(tilt), Math.cos(tilt), Math.sin(a) * Math.sin(tilt)); trunk.push({ g: new THREE.CylinderGeometry(0.035, 0.085, bl, 6), m: alongM(0, th * 0.82, 0, dir, bl) }); }
    var cy = th + 0.85;
    for (i = 0; i < 6; i++) { var ca = i * 1.05 + fr(0, 0.5), cr = fr(0.35, 0.95), r = fr(0.95, 1.4); crown.push({ g: lumpy(new THREE.SphereGeometry(r, 10, 8), 0.16, fr(0, 6), 1, fr(0.75, 0.9), 1), m: new THREE.Matrix4().makeTranslation(Math.cos(ca) * cr, cy + fr(-0.45, 0.45), Math.sin(ca) * cr) }); }
    crown.push({ g: lumpy(new THREE.SphereGeometry(fr(0.9, 1.15), 10, 8), 0.16, fr(0, 6), 1, 0.85, 1), m: new THREE.Matrix4().makeTranslation(0, cy + 0.95, 0) });
    return [{ g: mergeGeo(trunk), mat: MAT.bark, tint: false }, { g: mergeGeo(crown), mat: MAT.foliage, tint: true }];
  }
  function pineGeo() {   // a bare trunk and five overlapping ragged tiers: about 4.3 m at scale 1
    var trunk = [{ g: new THREE.CylinderGeometry(0.07, 0.16, 1.6, 7), m: new THREE.Matrix4().makeTranslation(0, 0.8, 0) }], tiers = [];
    for (var i = 0; i < 5; i++) { var r = 1.35 - i * 0.22, hh = 1.35 - i * 0.12; var g = new THREE.ConeGeometry(r, hh, 9); var p = g.attributes.position; for (var v = 0; v < p.count; v++) { var x = p.getX(v), z = p.getZ(v); var k = 1 + 0.14 * Math.sin(x * 4.1 + z * 3.3 + i); p.setXYZ(v, x * k, p.getY(v), z * k); } g.computeVertexNormals(); tiers.push({ g: g, m: new THREE.Matrix4().makeTranslation(fr(-0.06, 0.06), 1.1 + i * 0.66 + hh / 2, fr(-0.06, 0.06)) }); }
    return [{ g: mergeGeo(trunk), mat: MAT.bark, tint: false }, { g: mergeGeo(tiers), mat: MAT.pine, tint: true }];
  }
  function bushGeo() { var c = []; for (var i = 0; i < 5; i++) { var a = i * 1.26 + fr(0, 0.4), d = fr(0.12, 0.34); c.push({ g: lumpy(new THREE.SphereGeometry(fr(0.34, 0.5), 8, 6), 0.18, fr(0, 6), 1, fr(0.65, 0.8), 1), m: new THREE.Matrix4().makeTranslation(Math.cos(a) * d, fr(0.28, 0.42), Math.sin(a) * d) }); } return [{ g: mergeGeo(c), mat: MAT.foliage, tint: true }]; }
  function cardGeo(w, h) { var a = new THREE.PlaneGeometry(w, h), b = new THREE.PlaneGeometry(w, h); return [{ g: mergeGeo([{ g: a, m: new THREE.Matrix4().makeTranslation(0, h / 2, 0) }, { g: b, m: new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(0, h / 2, 0) }]), mat: null, tint: true }]; }
  function floraSet(kind, variants, cap, shadow, mat) {
    var set = { variants: [] };
    variants.forEach(function (parts) { var v = { n: 0, cap: cap, parts: [] }; parts.forEach(function (p) { var im = new THREE.InstancedMesh(p.g, p.mat || mat, cap); im.layers.set(TOWN_LAYER); im.count = 0; im.frustumCulled = false; im.castShadow = shadow; im.receiveShadow = true; im.name = 'flora-' + kind; if (p.tint) im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3).fill(1), 3); scene.add(im); v.parts.push(im); }); set.variants.push(v); });
    FLORA.sets[kind] = set; return set;
  }
  function buildFlora() {
    if (FLORA.sets.broad) return;
    floraSet('broad', [broadleafGeo(), broadleafGeo(), broadleafGeo()], 260, true);
    floraSet('pine', [pineGeo(), pineGeo()], 160, true);
    floraSet('bush', [bushGeo(), bushGeo()], 700, true);
    floraSet('tuft', [cardGeo(0.62, 0.5)], 9000, false, MAT.tuft);
    floraSet('flower', [cardGeo(0.34, 0.34)], 2000, false, MAT.flower);
  }
  function plant(kind, x, y, z, s, ry, tint) {   // one instance; the variant is picked at random, the tint (a Color) goes on the leafy part
    var set = FLORA.sets[kind]; if (!set) return; var v = set.variants[Math.floor(frnd() * set.variants.length)]; if (v.n >= v.cap) return;
    var m = placeM(x, y, z, ry === undefined ? frnd() * 6.283 : ry, s);
    v.parts.forEach(function (im) { im.setMatrixAt(v.n, m); im.instanceMatrix.needsUpdate = true; if (tint && im.instanceColor) { im.instanceColor.setXYZ(v.n, tint.r, tint.g, tint.b); im.instanceColor.needsUpdate = true; } im.count = v.n + 1; });
    v.n++;
  }
  function leafTint() { return FLORA._c.setHSL(0.26 + fr(-0.03, 0.05), fr(0.4, 0.6), fr(0.5, 0.72)); }
  function plantTree(kind, x, z, s, ry) { buildFlora(); plant(kind, x, 0, z, s, ry, kind === 'pine' ? FLORA._c.setHSL(0.32 + fr(-0.03, 0.03), fr(0.35, 0.5), fr(0.5, 0.7)) : leafTint()); }
  function plantBush(x, y, z, s, ry) { buildFlora(); plant('bush', x, y, z, s, ry, leafTint()); }
  var FLOWER_HUES = [[0.95, 0.75, 0.75], [0.14, 0.9, 0.62], [0.78, 0.6, 0.7], [0.0, 0.8, 0.6], [0.1, 0.0, 0.95], [0.6, 0.7, 0.75]];
  function plantFlower(x, y, z) { buildFlora(); var h = FLOWER_HUES[Math.floor(frnd() * FLOWER_HUES.length)]; plant('flower', x, y, z, fr(0.8, 1.25), undefined, FLORA._c.setHSL(h[0], h[1], h[2])); }
  function plantTuft(x, y, z) { buildFlora(); plant('tuft', x, y, z, fr(0.7, 1.35), undefined, FLORA._c.setHSL(0.24 + fr(-0.03, 0.05), fr(0.3, 0.5), fr(0.68, 0.9))); }
  // grass, flower beds and hedges over every bit of open ground, once the town is standing
  function scatterGreenery() {
    var C = CITY, PK = C.parks[0], i, x, z;
    function onRoad(x, z, r) { for (var k = 0; k < C.roads.length; k++) { var o = C.roads[k]; if (x + r > o.x1 - 3.4 && x - r < o.x2 + 3.4 && z + r > o.z1 - 3.4 && z - r < o.z2 + 3.4) return true; } return false; }   /* tarmac plus both pavements */
    function onBld(x, z, r) { for (var k = 0; k < C.blds.length; k++) { var o = C.blds[k]; if (x + r > o.x - o.w / 2 - 0.35 && x - r < o.x + o.w / 2 + 0.35 && z + r > o.z - o.d / 2 - 0.35 && z - r < o.z + o.d / 2 + 0.35) return true; } return false; }
    function ownPlot(x, z) { return x > -16 && x < 18.5 && z > -24 && z < 13; }
    function inPark(x, z) { return !!PK && x > PK.x1 && x < PK.x2 && z > PK.z1 && z < PK.z2; }
    function onPath(x, z) { return Math.abs(x - 29) < 1.5 || Math.abs(z - 44.5) < 1.5 || Math.hypot(x - 29, z - 44.5) < 2.9; }
    function open(x, z, r) { return !ownPlot(x, z) && !onRoad(x, z, r) && !onBld(x, z, r) && !(inPark(x, z) && onPath(x, z)); }
    var n = 0, tries = 0;
    while (n < 7000 && tries < 60000) { tries++; x = fr(-C.x, C.x); z = fr(C.z1, C.z2); if (!open(x, z, 0.2)) continue; var far = Math.hypot(x, z - 20); if (far > 70 && frnd() < 0.75) continue; plantTuft(x, inPark(x, z) ? 0.035 : 0, z); n++; }
    if (PK) {
      for (i = 0; i < 900; i++) { x = fr(PK.x1 + 1, PK.x2 - 1); z = fr(PK.z1 + 1, PK.z2 - 1); if (onPath(x, z)) continue; plantTuft(x, 0.035, z); }
      for (i = 0; i < 520; i++) {   /* beds either side of both paths, and a ring round the fountain */
        var t = fr(0, 1), side = frnd() < 0.5 ? -1 : 1, off = side * fr(1.7, 2.6);
        if (i % 3 === 0) { x = PK.x1 + 1.5 + t * (PK.x2 - PK.x1 - 3); z = 44.5 + off; } else if (i % 3 === 1) { x = 29 + off; z = PK.z1 + 1.5 + t * (PK.z2 - PK.z1 - 3); } else { var fa = t * 6.283, frr = fr(3.1, 3.7); x = 29 + Math.cos(fa) * frr; z = 44.5 + Math.sin(fa) * frr; }
        if (onPath(x, z) || Math.hypot(x - 29, z - 44.5) < 2.9) continue; plantFlower(x, 0.04, z);
      }
      var hedge = FLORA._c;   /* a clipped hedge round the park, broken where the paths come out */
      for (x = PK.x1 + 0.6; x <= PK.x2 - 0.6; x += 1.15) { if (Math.abs(x - 29) > 2.2) { plantBush(x, 0, PK.z1 + 0.6, 0.95, 0); plantBush(x, 0, PK.z2 - 0.6, 0.95, 0); } }
      for (z = PK.z1 + 1.7; z <= PK.z2 - 1.7; z += 1.15) { if (Math.abs(z - 44.5) > 2.2) { plantBush(PK.x1 + 0.6, 0, z, 0.95, 0); plantBush(PK.x2 - 0.6, 0, z, 0.95, 0); } }
    }
    for (i = 0; i < C.blds.length; i++) {   /* a bush or two at the foot of most buildings, on whichever side is open ground */
      var b = C.blds[i]; if (frnd() < 0.35) continue; for (var k = 0; k < 2; k++) { var sd = Math.floor(frnd() * 4); x = b.x + (sd === 0 ? b.w / 2 + 1.0 : sd === 1 ? -b.w / 2 - 1.0 : fr(-b.w / 2 + 1, b.w / 2 - 1)); z = b.z + (sd === 2 ? b.d / 2 + 1.0 : sd === 3 ? -b.d / 2 - 1.0 : fr(-b.d / 2 + 1, b.d / 2 - 1)); if (!open(x, z, 0.25)) continue; plantBush(x, 0, z, fr(0.8, 1.3)); for (var f = 0; f < 4; f++) { var fx = x + fr(-0.9, 0.9), fz = z + fr(-0.9, 0.9); if (open(fx, fz, 0.2)) plantFlower(fx, 0, fz); } }
    }
    for (i = 0; i < 140; i++) {   /* loose trees on the open ground between the blocks, never on a plot or a road */
      x = fr(-C.x + 4, C.x - 4); z = fr(C.z1 + 4, C.z2 - 4); if (!open(x, z, 1.6) || inPark(x, z)) continue; if (Math.hypot(x, z - 20) > 95 && frnd() < 0.6) continue;
      var ok = true; for (var o = 0; o < world.obstacles.length; o++) { var ob = world.obstacles[o]; if (ob.tag === 'city' && x > ob.x1 - 1.2 && x < ob.x2 + 1.2 && z > ob.z1 - 1.2 && z < ob.z2 + 1.2) { ok = false; break; } } if (!ok) continue;
      if (frnd() < 0.3) plantTree('pine', x, z, fr(0.8, 1.15)); else plantTree('broad', x, z, fr(0.75, 1.2)); world.obstacles.push({ x1: x - 0.3, x2: x + 0.3, z1: z - 0.3, z2: z + 0.3, tag: 'city', floorLevel: 0 });
    }
  }
  // ── Facades: five building styles, one storey by two bays per texture tile, windows that light up at night ──
  var FACADE = { tex: {}, mats: {}, shop: null };
  function facadeTex(style) {
    if (FACADE.tex[style]) return FACADE.tex[style];
    var W = 256, H = 128, lit = document.createElement('canvas'); lit.width = W; lit.height = H; var lc = lit.getContext('2d'); lc.fillStyle = '#000'; lc.fillRect(0, 0, W, H);
    var map = makeTex(W, H, function (ctx, w, h) {
      var rs = 1000 + style * 77; function rn() { rs = (rs * 1103515245 + 12345) & 0x7fffffff; return rs / 0x7fffffff; }
      var frame, glass, sill, wins = [];
      if (style === 0) { noiseFill(ctx, w, h, '#d8d4cb', 10, 1200); ctx.fillStyle = '#b9b4a8'; ctx.fillRect(0, h - 10, w, 10); frame = '#f4f2ec'; glass = '#5a6f86'; sill = '#c9c4b8'; for (var i = 0; i < 4; i++) wins.push([8 + i * 62, 22, 50, 72]); }
      else if (style === 1) { brickDraw(ctx, w, h, 16, 8, function () { return ['#9a5a45', '#a6654c', '#8f5040', '#b06e54'][Math.floor(rn() * 4)]; }, '#d5cbb8', 3); grain(ctx, w, h, 1500, 0.2); frame = '#efe9dc'; glass = '#4b5d70'; sill = '#e2dccf'; wins.push([26, 26, 40, 66], [96, 26, 40, 66], [166, 26, 40, 66]); ctx.fillStyle = '#7a4536'; ctx.fillRect(0, 0, w, 6); }
      else if (style === 2) { tileDraw(ctx, w, h, 4, 2, function () { return ['#c8c0ae', '#bfb7a5', '#d0c8b6'][Math.floor(rn() * 3)]; }, '#9e9686', 3); grain(ctx, w, h, 1200, 0.18); frame = '#5a4a3a'; glass = '#3f4c5a'; sill = '#8f8778'; wins.push([22, 18, 44, 84], [106, 18, 44, 84], [190, 18, 44, 84]); ctx.fillStyle = '#a49c8c'; ctx.fillRect(0, h - 8, w, 8); }
      else if (style === 3) { noiseFill(ctx, w, h, '#6f747c', 12, 1200); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2; for (var px = 0; px < w; px += 64) { ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, h); ctx.stroke(); } frame = '#2c2f34'; glass = '#7f8f9e'; sill = '#565b63'; wins.push([6, 34, 116, 46], [134, 34, 116, 46]); }
      else { ctx.fillStyle = '#243040'; ctx.fillRect(0, 0, w, h); frame = '#8a939c'; glass = '#5f7f9d'; sill = '#8a939c'; for (var j = 0; j < 4; j++) wins.push([2 + j * 64, 4, 60, 120]); }
      wins.forEach(function (r) {
        ctx.fillStyle = frame; ctx.fillRect(r[0] - 3, r[1] - 3, r[2] + 6, r[3] + 6);
        var g = ctx.createLinearGradient(0, r[1], 0, r[1] + r[3]); g.addColorStop(0, glass); g.addColorStop(1, '#2c3642'); ctx.fillStyle = g; ctx.fillRect(r[0], r[1], r[2], r[3]);
        ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(r[0] + 2, r[1] + 2, r[2] * 0.35, r[3] - 4);
        if (style !== 4) { ctx.fillStyle = frame; ctx.fillRect(r[0] + r[2] / 2 - 1, r[1], 2, r[3]); ctx.fillRect(r[0], r[1] + r[3] * 0.45, r[2], 2); ctx.fillStyle = sill; ctx.fillRect(r[0] - 5, r[1] + r[3] + 3, r[2] + 10, 4); }
        var on = rn() < 0.38, blind = rn() < 0.3;
        if (blind) { ctx.fillStyle = 'rgba(230,224,205,.8)'; ctx.fillRect(r[0] + 1, r[1] + 1, r[2] - 2, r[3] * (0.3 + rn() * 0.5)); }
        if (on) { ctx.fillStyle = 'rgba(255,214,150,.45)'; ctx.fillRect(r[0], r[1], r[2], r[3]); lc.fillStyle = blind ? '#7a5a30' : '#ffcd8a'; lc.fillRect(r[0], r[1], r[2], r[3]); if (!blind && rn() < 0.5) { lc.fillStyle = '#3a2a14'; lc.fillRect(r[0] + r[2] * 0.2, r[1] + r[3] * 0.3, r[2] * 0.25, r[3] * 0.7); } }
      });
    });
    var em = new THREE.CanvasTexture(lit); em.wrapS = em.wrapT = THREE.RepeatWrapping; em.encoding = THREE.sRGBEncoding;
    FACADE.tex[style] = { map: map, em: em }; return FACADE.tex[style];
  }
  function shopfrontTex() {   /* the ground floor: big panes, a door, a fascia band */
    if (FACADE.shop) return FACADE.shop;
    var W = 256, H = 128, lit = document.createElement('canvas'); lit.width = W; lit.height = H; var lc = lit.getContext('2d'); lc.fillStyle = '#000'; lc.fillRect(0, 0, W, H);
    var map = makeTex(W, H, function (ctx, w, h) {
      noiseFill(ctx, w, h, '#cfc9bc', 10, 900); ctx.fillStyle = '#5a5248'; ctx.fillRect(0, 0, w, 22);   /* fascia */
      [[10, 30, 60, 84], [78, 30, 60, 84], [186, 30, 60, 84]].forEach(function (r) { ctx.fillStyle = '#e8e4da'; ctx.fillRect(r[0] - 3, r[1] - 3, r[2] + 6, r[3] + 6); var g = ctx.createLinearGradient(0, r[1], 0, r[1] + r[3]); g.addColorStop(0, '#6b7f92'); g.addColorStop(1, '#2a323c'); ctx.fillStyle = g; ctx.fillRect(r[0], r[1], r[2], r[3]); ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.fillRect(r[0] + 2, r[1] + 2, r[2] * 0.3, r[3] - 4); lc.fillStyle = '#8a6e48'; lc.fillRect(r[0], r[1], r[2], r[3]); });   /* shopfronts glow softer than the flats above */
      ctx.fillStyle = '#3a3f46'; ctx.fillRect(146, 30, 34, 90); ctx.fillStyle = '#7f95aa'; ctx.fillRect(150, 36, 26, 54); ctx.fillStyle = '#d8d2c4'; ctx.fillRect(172, 92, 4, 8);   /* the door */
      ctx.fillStyle = '#8f877a'; ctx.fillRect(0, h - 8, w, 8);
    });
    var em = new THREE.CanvasTexture(lit); em.wrapS = em.wrapT = THREE.RepeatWrapping; em.encoding = THREE.sRGBEncoding;
    FACADE.shop = { map: map, em: em }; return FACADE.shop;
  }
  function facadeMat(style, hex, shop) {
    var key = (shop ? 's' : style) + ':' + hex; if (FACADE.mats[key]) return FACADE.mats[key];
    var t = shop ? shopfrontTex() : facadeTex(style);
    var m = new THREE.MeshStandardMaterial({ map: t.map, emissiveMap: t.em, emissive: 0xffffff, emissiveIntensity: 0, color: hex, roughness: shop ? 0.6 : style === 4 ? 0.35 : 0.85, metalness: style === 4 ? 0.2 : 0 });
    FACADE.mats[key] = m; (world.facadeMats = world.facadeMats || []).push(m); return m;
  }
  function styleOf(x, z) { return Math.abs(Math.round(x * 7.3 + z * 13.1)) % 5; }
  function facadeBox(w, h, d, mat, x, y, z, storey, bay) {   /* a box whose side faces repeat the tile once per storey and once per bay, so buildings share one texture */
    var g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, ry = h / (storey || 3.2);
    for (var i = 0; i < uv.count; i++) { var face = Math.floor(i / 4), rx = (face < 2 ? d : w) / (bay || 6); uv.setXY(i, uv.getX(i) * rx, uv.getY(i) * ry); }
    var m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; m.layers.set(TOWN_LAYER); world.group.add(m); return m;
  }
  function cityWinMat(hex, rx, ry) {
    if (!WIN_TEX) WIN_TEX = makeTex(128, 128, function (ctx, w, h) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h); for (var y = 0; y < 4; y++) for (var x = 0; x < 4; x++) { ctx.fillStyle = Math.random() < 0.3 ? '#ffe9a8' : Math.random() < 0.5 ? '#3a4652' : '#56687a'; ctx.fillRect(x * 32 + 7, y * 32 + 8, 18, 17); } }, [1, 1]);
    var t = WIN_TEX.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return new THREE.MeshStandardMaterial({ map: t, color: hex, roughness: 0.85 });
  }
  function cityDetail(x, z, w, d, h, hex) {
    var seed = Math.abs(Math.round(x * 7.3 + z * 13.1));
    var baseH = Math.min(2.8, h * 0.45);
    facadeBox(w + 0.18, baseH, d + 0.18, facadeMat(0, mixHex(hex, 0xffffff, 0.15), true), x, baseH / 2, z, baseH, 6);                    /* the stone base at street level */
    box(w + 0.34, 0.24, d + 0.34, colorMat(mixHex(hex, 0xffffff, 0.3), 0.8), x, baseH + 0.12, z, { cast: false });                   /* string course where the shopfront stops */
    box(w + 0.28, 0.3, d + 0.28, colorMat(mixHex(hex, 0xffffff, 0.22), 0.8), x, h - 0.32, z, { cast: false });                       /* cornice under the parapet */
    if (h > 6.5) {
      var sw = Math.min(3.2, w * 0.34), sd = Math.min(3.2, d * 0.34);
      box(sw, 1.3, sd, colorMat(mixHex(hex, 0x000000, 0.3), 0.9), x + w * 0.18, h + 0.95, z - d * 0.18);                             /* stair head */
      if (seed % 3 === 0) cyl(0.62, 0.62, 1.5, colorMat(0x767b82, 0.6, 0.4), x - w * 0.24, h + 1.05, z + d * 0.2, null, 8);          /* water tank */
      else if (seed % 3 === 1) box(1.5, 0.75, 1.1, colorMat(0x8a9099, 0.7), x - w * 0.24, h + 0.68, z + d * 0.2);                    /* plant on the roof */
      else cyl(0.045, 0.045, 2.6, colorMat(0x3a3d42, 0.5), x - w * 0.24, h + 1.6, z + d * 0.2, null, 5);                             /* aerial */
    }
    if (h > 12) facadeBox(w * 0.66, 2.4, d * 0.66, facadeMat(styleOf(x, z), mixHex(hex, 0xffffff, 0.12)), x, h + 1.2, z, 2.4, 6);                          /* a setback storey on the tall ones */
  }
  function cityBldg(x, z, w, d, h, hex, label, poi) {
    var m = facadeBox(w, h, d, facadeMat(styleOf(x, z), hex), x, h / 2, z); world.obstacles.push({ x1: x - w / 2, x2: x + w / 2, z1: z - d / 2, z2: z + d / 2, tag: 'city', floorLevel: 0 }); box(w + 0.4, 0.3, d + 0.4, colorMat(0x3a3d42, 0.9), x, h + 0.15, z, { cast: false });
    cityDetail(x, z, w, d, h, hex);
    CITY.blds.push({ x: x, z: z, w: w, d: d, label: label || '', poi: poi || '' }); return m;
  }
  // Is this plot actually empty? The town is built as terraces, so sharing a wall is fine and
  // sinking a metre into next door's living room is not. Roads, parks and your own yard are hard no.
  function cityClear(x, z, w, d) {
    var x1 = x - w / 2, x2 = x + w / 2, z1 = z - d / 2, z2 = z + d / 2, i, o, ox, oz;
    if (x1 < -CITY.x - 2 || x2 > CITY.x + 2 || z1 < CITY.z1 - 2 || z2 > CITY.z2 + 2) return false;
    if (x2 > -16 && x1 < 18.5 && z2 > -24 && z1 < 13) return false;   /* your own plot: the shop, the security annex out at x 17, the forecourt and the yard behind */
    for (i = 0; i < CITY.roads.length; i++) { o = CITY.roads[i]; if (x2 > o.x1 && x1 < o.x2 && z2 > o.z1 && z1 < o.z2) return false; }   /* never on the tarmac */
    for (i = 0; i < CITY.parks.length; i++) {
      o = CITY.parks[i];
      ox = Math.min(x2, o.x2) - Math.max(x1, o.x1); oz = Math.min(z2, o.z2) - Math.max(z1, o.z1);
      if (ox > 1.2 && oz > 1.2) return false;
    }
    for (i = 0; i < CITY.blds.length; i++) {
      o = CITY.blds[i];
      ox = Math.min(x2, o.x + o.w / 2) - Math.max(x1, o.x - o.w / 2);
      oz = Math.min(z2, o.z + o.d / 2) - Math.max(z1, o.z - o.d / 2);
      if (ox > 1.2 && oz > 1.2) return false;   /* a shared wall is a terrace; a shared room is a mistake */
    }
    return true;
  }
  function cityFill(x, z, w, d, h, hex, label, poi) { return cityClear(x, z, w, d) ? cityBldg(x, z, w, d, h, hex, label, poi) : null; }   /* the procedural blocks give way to anything already standing */
  function citySpot(x, z, w, d) {   // the plot asked for if it is empty, otherwise the nearest one that is
    if (cityClear(x, z, w, d)) return { x: x, z: z, moved: false };
    for (var r = 4; r <= 72; r += 4) for (var a = 0; a < 12; a++) {
      var ang = a * Math.PI / 6, nx = Math.round(x + Math.cos(ang) * r), nz = Math.round(z + Math.sin(ang) * r);
      if (cityClear(nx, nz, w, d)) return { x: nx, z: nz, moved: true };
    }
    return { x: x, z: z, moved: false, stuck: true };
  }
  function cityRoad(x1, z1, x2, z2) {   // centre line from a to b, 9 m of tarmac, 3.2 m of pavement each side
    var alongX = Math.abs(x2 - x1) > Math.abs(z2 - z1), len = alongX ? x2 - x1 : z2 - z1, cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
    var rd = new THREE.Mesh(new THREE.PlaneGeometry(alongX ? len : 9, alongX ? 9 : len), MAT.asphalt); rd.rotation.x = -Math.PI / 2; rd.position.set(cx, 0.006, cz); rd.receiveShadow = true; world.group.add(rd);
    [-6.1, 6.1].forEach(function (o) { var pv = new THREE.Mesh(new THREE.PlaneGeometry(alongX ? len : 3.2, alongX ? 3.2 : len), MAT.pavement); pv.rotation.x = -Math.PI / 2; pv.position.set(alongX ? cx : cx + o, 0.05, alongX ? cz + o : cz); pv.receiveShadow = true; world.group.add(pv); });
    var dashM = colorMat(0xe8e0a0, 0.9); for (var t = 3; t < len - 3; t += 6) box(alongX ? 1.8 : 0.12, 0.01, alongX ? 0.12 : 1.8, dashM, alongX ? x1 + t : cx, 0.013, alongX ? cz : z1 + t, { cast: false });
    CITY.roads.push({ x1: alongX ? x1 : cx - 4.5, x2: alongX ? x2 : cx + 4.5, z1: alongX ? cz - 4.5 : z1, z2: alongX ? cz + 4.5 : z2 });
  }
  function cityDoor(x, z, faceZ, w, poi, title, sub, col) {   // a shopfront on the street face of a building: awning, glass door, sign, and the thing you press E on
    var fz = z + faceZ * 0.06; box(w, 0.5, 1.2, colorMat(col, 0.7), x, 3.0, z + faceZ * 0.6, { cast: true }); box(1.5, 2.3, 0.08, new THREE.MeshPhysicalMaterial({ color: 0x8fb8d8, transparent: true, opacity: 0.5, roughness: 0.05 }), x, 1.15, fz, { cast: false }); box(1.7, 0.1, 0.12, MAT.black, x, 2.35, fz, { cast: false }); [-0.85, 0.85].forEach(function (o) { box(0.1, 2.4, 0.12, MAT.black, x + o, 1.2, fz, { cast: false }); });
    signPlane([title, sub], Math.min(w, 5), 0.9, x, 3.95, z + faceZ * 0.08, faceZ > 0 ? 0 : Math.PI, { size: 44, bg: '#101410', titleColor: '#' + ('000000' + col.toString(16)).slice(-6), color: '#d8e2d8' });
    var hitM = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.6, 1.2), MAT.none); hitM.position.set(x, 1.3, z + faceZ * 0.5); world.group.add(hitM); interactable(hitM, { kind: 'cityDoor', poi: poi });
  }
  function ownVanBody(g, hex, full) {   /* your own van: a cab, a tall cargo box with the livery, a tailgate that lifts, a stubby bonnet, and twice the trunk */
    var paint = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.35, metalness: 0.5 }), glassM = new THREE.MeshPhysicalMaterial({ color: 0x20303c, transparent: true, opacity: 0.75, roughness: 0.05, metalness: 0.4 }), dk = colorMat(0x15171a, 0.8), trimM = colorMat(0x2a2d33, 0.5, 0.4), wheels = [];
    function add(w, h, d, m, x, y, z, parent) { var b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; (parent || g).add(b); return b; }
    add(1.9, 0.5, 5.0, paint, 0, 0.55, 0); add(1.8, 0.16, 4.8, dk, 0, 0.28, 0);
    add(0.05, 1.35, 3.3, paint, -0.925, 1.475, 0.85); add(0.05, 0.55, 3.3, paint, 0.925, 1.075, 0.85);   /* the cargo box: left wall, and the sill under the serving window on the right */
    add(0.05, 0.8, 0.5, paint, 0.925, 1.75, -0.55); add(0.05, 0.8, 0.5, paint, 0.925, 1.75, 2.25);        /* window pillars */
    add(1.9, 1.35, 0.05, paint, 0, 1.475, -0.775); add(0.06, 1.35, 0.06, paint, -0.92, 1.475, 2.47); add(0.06, 1.35, 0.06, paint, 0.92, 1.475, 2.47); add(1.9, 0.1, 0.06, paint, 0, 2.1, 2.47);   /* bulkhead and the rear frame */
    add(0.55, 0.04, 2.2, MAT.planks, 0.6, 1.33, 0.85); add(0.34, 0.04, 0.34, colorMat(0x2a2d33, 0.5), 0.15, 1.05, 0.85); add(0.04, 1.0, 0.04, MAT.metal, 0.15, 0.55, 0.85); add(1.0, 0.03, 0.2, glowMat(0xfff3e0, 0.8), 0.2, 2.08, 0.85);   /* the counter inside, a tall stool and a strip light */
    add(0.32, 0.03, 1.7, MAT.planks, -0.72, 1.4, 0.85); add(0.32, 0.03, 1.7, MAT.planks, -0.72, 1.75, 0.85); add(0.02, 0.5, 1.7, colorMat(0x2a2d33, 0.6), -0.885, 1.58, 0.85);   /* the rack: two shelves on the left wall */
    var rackG = new THREE.Group(); rackG.position.set(-0.8, 1.415, 0.85); g.add(rackG); g.userData.rackG = rackG;
    var rlab = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.16), new THREE.MeshBasicMaterial({ map: textTex(['COOKIES · BAGS · JOINTS   three of each'], 640, 64, { size: 30, bold: true, bg: 'rgba(0,0,0,0)', color: '#f0ead8', titleColor: '#ffc857', line: 'rgba(0,0,0,0)' }), transparent: true })); rlab.position.set(-0.87, 1.95, 0.85); rlab.rotation.y = Math.PI / 2; g.add(rlab);
    add(0.34, 0.22, 0.3, colorMat(0x3b4650, 0.4, 0.3), 0.6, 1.46, 1.75); add(0.26, 0.14, 0.02, glowMat(0x2dd67a, 0.7), 0.6, 1.62, 1.62); add(0.3, 0.02, 0.22, colorMat(0x1a1c1e, 0.6), 0.6, 1.58, 1.8);   /* a small register on the counter */
    add(1.9, 0.3, 1.5, paint, 0, 0.95, -1.7); add(1.78, 0.9, 1.35, glassM, 0, 1.55, -1.72);      /* the cab */
    add(1.9, 0.12, 5.0, paint, 0, 2.2, 0.0); add(1.7, 0.06, 0.5, trimM, 0, 0.72, -2.3);
    add(1.9, 0.14, 0.08, trimM, 0, 0.45, -2.54); add(1.9, 0.14, 0.08, trimM, 0, 0.45, 2.54);
    [-0.75, 0.75].forEach(function (x) { add(0.05, 0.05, 2.6, trimM, x, 2.3, 0.6); }); [-0.4, 0.4, 1.4].forEach(function (z) { add(1.55, 0.05, 0.05, trimM, 0, 2.3, z); });   /* roof rack */
    var stripeM = colorMat(0x2f6b45, 0.6); add(0.02, 0.18, 3.2, stripeM, -0.965, 1.05, 0.85); add(0.02, 0.18, 3.2, stripeM, 0.965, 1.05, 0.85);
    var liv = textTex(['GROW CO.', 'deliveries'], 520, 220, { size: 70, bold: true, bg: 'rgba(0,0,0,0)', titleColor: '#2f6b45', color: '#3a3f46', line: 'rgba(0,0,0,0)' });
    var lv = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.9), new THREE.MeshBasicMaterial({ map: liv, transparent: true })); lv.position.set(-0.968, 1.55, 0.85); lv.rotation.y = -Math.PI / 2; g.add(lv);   /* livery on the left; the right side carries it on the hatch */
    var headM = glowMat(0xfff3c8, 1.4), tailM = glowMat(0xd0201a, 0.9), revM = glowMat(0xf4f7ff, 0.06), lamps = { headM: headM, tailM: tailM, revM: revM, beams: [] };
    [-0.65, 0.65].forEach(function (x) { add(0.36, 0.16, 0.05, headM, x, 0.9, -2.53); add(0.22, 0.5, 0.05, tailM, x * 1.3, 1.3, 2.53); });
    [-0.3, 0.3].forEach(function (x) { add(0.16, 0.1, 0.035, revM, x * 2.6, 0.75, 2.535); }); add(0.5, 0.12, 0.03, MAT.white, 0, 0.5, 2.54);
    [[-0.92, -1.7], [0.92, -1.7], [-0.92, 1.5], [0.92, 1.5]].forEach(function (p) { var wg = new THREE.Group(); wg.position.set(p[0], 0.36, p[1]); var tire = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.24, 16), dk); tire.rotation.z = Math.PI / 2; tire.castShadow = true; wg.add(tire); var rim = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.25, 8), colorMat(0xc9ccd1, 0.4, 0.6)); rim.rotation.z = Math.PI / 2; wg.add(rim); g.add(wg); wheels.push(wg); });
    g.userData.lamps = lamps;
    if (!full) return wheels;
    var parts = {};
    function hinge(x, y, z) { var p = new THREE.Group(); p.position.set(x, y, z); g.add(p); return p; }
    var bon = hinge(0, 0.98, -2.45); add(1.7, 0.1, 0.5, paint, 0, 0, 0.25, bon); parts.bonnet = { g: bon, axis: 'x', max: 0.9, t: 0 };
    var bt = hinge(0, 2.1, 2.5); add(1.86, 1.3, 0.06, paint, 0, -0.65, 0, bt); add(0.6, 0.5, 0.02, glassM, 0, -0.45, 0.035, bt); add(0.3, 0.04, 0.05, MAT.chrome, 0, -1.1, 0.04, bt); parts.boot = { g: bt, axis: 'x', max: -1.35, t: 0 };   /* the rear door hangs below its hinge, so a negative turn lifts it outward and up */
    parts.cargo = new THREE.Group(); parts.cargo.position.set(0, 0.7, 1.7); g.add(parts.cargo);
    [[-0.5, 0], [0, 0], [0.5, 0], [-0.5, -0.6], [0, -0.6], [0.5, -0.6]].forEach(function (c, i) { var cb = add(0.42, 0.34, 0.5, colorMat([0x8a6a3a, 0x6a7a4a, 0x7a5a4a][i % 3], 0.9), c[0], 0.17, c[1], parts.cargo); cb.visible = false; });
    [-1, 1].forEach(function (sx) {
      add(0.006, 0.8, 1.2, colorMat(0x14171a, 0.95), sx * 0.9535, 1.2, -1.72);
      var d = hinge(sx * 0.96, 0, -2.3); add(0.05, 0.62, 1.15, paint, 0, 0.95, 0.6, d); add(0.05, 0.6, 1.05, glassM, 0, 1.58, 0.6, d); add(0.06, 0.05, 1.15, dk, 0, 1.28, 0.6, d); add(0.1, 0.04, 0.18, MAT.chrome, sx * 0.04, 1.1, 1.0, d);
      parts[sx < 0 ? 'doorL' : 'doorR'] = { g: d, axis: 'y', max: sx * 0.95, t: 0 };
    });
    var ht = hinge(0.95, 2.14, 0.85); add(0.05, 0.8, 2.2, paint, 0, -0.4, 0, ht); var hs = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.7), new THREE.MeshBasicMaterial({ map: liv, transparent: true })); hs.position.set(0.03, -0.4, 0); hs.rotation.y = Math.PI / 2; ht.add(hs); var os = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.22), new THREE.MeshBasicMaterial({ map: textTex(['OPEN'], 280, 90, { size: 60, bold: true, bg: '#1d1f1c', titleColor: '#6fdc8c', line: 'rgba(111,220,140,.8)' }) })); os.position.set(0.04, -0.82, 0); os.rotation.y = Math.PI / 2; os.visible = false; ht.add(os); g.userData.openSign = os; parts.hatch = { g: ht, axis: 'z', max: 1.3, t: 0 };   /* the side panel lifts into a canopy over the serving window */
    var ct = hinge(0.99, 1.35, 0.85); add(0.04, 0.5, 2.2, MAT.planks, 0, 0.25, 0, ct); parts.counter = { g: ct, axis: 'z', max: -Math.PI / 2, t: 0 };   /* folds out flat under the window */
    var rl = hinge(0.9, 1.25, 2.42); add(1.76, 0.04, 0.04, MAT.chrome, -0.88, 0, 0, rl); add(1.76, 0.04, 0.04, MAT.chrome, -0.88, -0.3, 0, rl); add(0.04, 0.34, 0.04, MAT.chrome, -1.74, -0.15, 0, rl); add(0.04, 0.34, 0.04, MAT.chrome, -0.88, -0.15, 0, rl); add(0.06, 0.1, 0.06, MAT.black, -1.76, 0.02, 0, rl); parts.rail = { g: rl, axis: 'y', max: 1.4, t: 0 };   /* a latch rail across the back, so the tailgate can stay up */
    g.userData.parts = parts;
    return wheels;
  }
  function carBody(g, hex, full) {
    var paint = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.3, metalness: 0.6 }), glassM = new THREE.MeshPhysicalMaterial({ color: 0x20303c, transparent: true, opacity: 0.75, roughness: 0.05, metalness: 0.4 }), dk = colorMat(0x15171a, 0.8), wheels = [];
    function add(w, h, d, m, x, y, z, parent) { var b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; (parent || g).add(b); return b; }
    /* traffic keeps the cheap one-box shell; the player's car is built in sections so the bonnet and the boot open onto real wells */
    if (full) { add(1.7, 0.5, 2.0, paint, 0, 0.55, 0.15); [-1.41, 1.55].forEach(function (nz, i) { var len = i ? 0.8 : 1.12; add(1.7, 0.14, len, paint, 0, 0.37, nz); [-1, 1].forEach(function (sx) { add(0.05, 0.3, len, paint, sx * 0.825, 0.59, nz); }); }); add(1.7, 0.3, 0.06, paint, 0, 0.59, -1.94); add(1.7, 0.3, 0.06, paint, 0, 0.59, 1.94); }
    else { add(1.7, 0.5, 3.9, paint, 0, 0.55, 0); add(1.62, 0.18, 0.9, paint, 0, 0.84, -1.35); }
    add(1.6, 0.16, 3.7, dk, 0, 0.26, 0); add(1.5, 0.5, 1.9, glassM, 0, 1.03, 0.2); add(1.52, 0.06, 1.7, paint, 0, 1.3, 0.2);
    var headM = glowMat(0xfff3c8, 1.4), tailM = glowMat(0xd0201a, 0.9), revM = glowMat(0xf4f7ff, 0.06), lamps = { headM: headM, tailM: tailM, revM: revM, beams: [] };
    [-0.6, 0.6].forEach(function (x) { add(0.32, 0.12, 0.05, headM, x, 0.62, -1.96); add(0.32, 0.1, 0.05, tailM, x, 0.64, 1.96); });
    [-0.3, 0.3].forEach(function (x) { add(0.2, 0.08, 0.035, revM, x, 0.6, 1.962); });
    add(0.5, 0.12, 0.03, MAT.white, 0, 0.45, 1.965); add(1.5, 0.1, 0.06, dk, 0, 0.36, -1.97);
    [[-0.85, -1.25], [0.85, -1.25], [-0.85, 1.25], [0.85, 1.25]].forEach(function (p) { var wg = new THREE.Group(); wg.position.set(p[0], 0.32, p[1]); var tire = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 16), dk); tire.rotation.z = Math.PI / 2; tire.castShadow = true; wg.add(tire); var rim = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.23, 8), MAT.chrome); rim.rotation.z = Math.PI / 2; wg.add(rim); g.add(wg); wheels.push(wg); });
    g.userData.lamps = lamps;
    if (!full) return wheels;
    var parts = {};
    function hinge(x, y, z) { var p = new THREE.Group(); p.position.set(x, y, z); g.add(p); return p; }
    /* the bonnet lifts from its rear edge, over an engine you can actually look at */
    var bon = hinge(0, 0.78, -0.85); add(1.6, 0.13, 1.06, paint, 0, 0, -0.53, bon); add(1.48, 0.03, 0.96, dk, 0, -0.08, -0.53, bon); parts.bonnet = { g: bon, axis: 'x', max: 0.95, t: 0 };
    add(1.15, 0.22, 0.8, colorMat(0x22262b, 0.65, 0.3), 0, 0.56, -1.4); add(0.62, 0.04, 0.46, colorMat(0x6a7078, 0.35, 0.8), 0, 0.69, -1.36); add(0.28, 0.16, 0.22, colorMat(0x2f5f8a, 0.7), -0.52, 0.58, -1.02); cyl(0.05, 0.05, 0.5, colorMat(0x8a8f96, 0.4, 0.7), 0.5, 0.6, -1.5, g, 10).rotation.z = Math.PI / 2;
    /* the boot lifts from its front edge, over a well that shows what you are carrying */
    var bt = hinge(0, 0.78, 1.16); add(1.6, 0.13, 0.78, paint, 0, 0, 0.39, bt); add(1.48, 0.03, 0.68, dk, 0, -0.08, 0.39, bt); parts.boot = { g: bt, axis: 'x', max: -0.95, t: 0 };
    parts.cargo = new THREE.Group(); parts.cargo.position.set(0, 0.44, 1.55); g.add(parts.cargo);
    [-0.44, 0, 0.44].forEach(function (cx, i) { var cb = add(0.4, 0.16, 0.5, colorMat([0x8a6a3a, 0x6a7a4a, 0x7a5a4a][i], 0.9), cx, 0.08, 0, parts.cargo); cb.visible = false; });
    /* two doors on front hinges, each with its glass, and a dark sill so an open door shows an interior */
    [-1, 1].forEach(function (sx) {
      add(0.006, 0.44, 1.08, colorMat(0x14171a, 0.95), sx * 0.8535, 0.56, -0.06);
      var d = hinge(sx * 0.88, 0, -0.62); add(0.05, 0.5, 1.12, paint, 0, 0.56, 0.56, d); add(0.05, 0.42, 1.0, glassM, 0, 1.04, 0.56, d); add(0.06, 0.05, 1.12, dk, 0, 0.82, 0.56, d); add(0.1, 0.04, 0.18, MAT.chrome, sx * 0.04, 0.68, 0.94, d);
      parts[sx < 0 ? 'doorL' : 'doorR'] = { g: d, axis: 'y', max: sx * 0.95, t: 0 };
    });
    g.userData.parts = parts;
    return wheels;
  }
  // ── Street furniture: everything that makes a road look like a street ───────────────────
  function sceneFree(x, z, r) {   // on the pavement, not in the road and not inside somebody's front room
    var i, o;
    for (i = 0; i < CITY.roads.length; i++) { o = CITY.roads[i]; if (x + r > o.x1 && x - r < o.x2 && z + r > o.z1 && z - r < o.z2) return false; }
    for (i = 0; i < CITY.blds.length; i++) { o = CITY.blds[i]; if (x + r > o.x - o.w / 2 && x - r < o.x + o.w / 2 && z + r > o.z - o.d / 2 && z - r < o.z + o.d / 2) return false; }
    if (Math.abs(x) < 17 && z > -24 && z < 13) return false;   /* your own forecourt, yard and garage are dressed already */
    return true;
  }
  function buildScenery() {
    var C = CITY, n = 0;
    var postM = colorMat(0x3a4046, 0.45, 0.7), headM = glowMat(0xffeec2, 0.9), darkM = colorMat(0x24282d, 0.7);
    var benchM = colorMat(0x7a5a38, 0.85), binM = colorMat(0x2f3a33, 0.7), hydM = colorMat(0xb5342b, 0.55);
    var glassM = new THREE.MeshPhysicalMaterial({ color: 0xdff0ff, transparent: true, opacity: 0.22, roughness: 0.05, side: THREE.DoubleSide });
    var leafM = MAT.tree, barkM = MAT.trunk, kerbM = colorMat(0xa8a49c, 0.9);
    function lamp(x, z, dir) {
      cyl(0.07, 0.09, 4.6, postM, x, 2.3, z, null, 7);
      var arm = new THREE.Mesh(new THREE.BoxGeometry(Math.abs(dir[0]) > 0.5 ? 1.0 : 0.09, 0.09, Math.abs(dir[1]) > 0.5 ? 1.0 : 0.09), postM);
      arm.position.set(x + dir[0] * 0.5, 4.55, z + dir[1] * 0.5); arm.castShadow = false; world.group.add(arm);
      var hd = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.13, 0.26), headM);
      hd.position.set(x + dir[0] * 1.0, 4.44, z + dir[1] * 1.0); hd.castShadow = false; world.group.add(hd); n += 3;
    }
    function tree(x, z, sc) {
      plantTree('broad', x, z, sc * 0.85);
      box(1.4, 0.1, 1.4, kerbM, x, 0.05, z, { cast: false }); n += 3;
    }
    function bench(x, z, ry) {
      var g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; world.group.add(g);
      function bx(w, h, d, m, px, py, pz, rx) { var b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(px, py, pz); if (rx) b.rotation.x = rx; b.castShadow = true; g.add(b); }
      bx(1.7, 0.07, 0.46, benchM, 0, 0.45, 0); bx(1.7, 0.42, 0.06, benchM, 0, 0.68, -0.21, -0.18);
      [-0.72, 0.72].forEach(function (o) { bx(0.08, 0.45, 0.42, darkM, o, 0.22, 0); }); n += 4;
    }
    function bin(x, z) { cyl(0.24, 0.2, 0.8, binM, x, 0.4, z, null, 8); cyl(0.26, 0.26, 0.05, darkM, x, 0.82, z, null, 8); n += 2; }
    function hydrant(x, z) { cyl(0.11, 0.13, 0.62, hydM, x, 0.31, z, null, 7); cyl(0.16, 0.16, 0.07, hydM, x, 0.66, z, null, 7); n += 2; }
    function bollard(x, z) { cyl(0.08, 0.09, 0.95, darkM, x, 0.47, z, null, 6); n += 1; }
    function planter(x, z) {
      box(1.1, 0.5, 1.1, kerbM, x, 0.25, z); plantBush(x, 0.45, z, 1.0); n += 2;
    }
    function shelter(x, z, ry) {
      var g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; world.group.add(g);
      var rf = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.1, 1.5), darkM); rf.position.y = 2.5; g.add(rf);
      [-1.6, 1.6].forEach(function (o) { var p = new THREE.Mesh(new THREE.BoxGeometry(0.09, 2.5, 0.09), postM); p.position.set(o, 1.25, -0.65); g.add(p); });
      var bk = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 2.1), glassM); bk.position.set(0, 1.3, -0.72); g.add(bk);
      var sb = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.07, 0.4), benchM); sb.position.set(0, 0.46, -0.45); g.add(sb);
      var sg = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.34), new THREE.MeshBasicMaterial({ map: textTex(['BUS'], 220, 80, { size: 52, bg: '#16324f', titleColor: '#ffd166', line: 'rgba(0,0,0,0)' }), transparent: true }));
      sg.position.set(0, 2.15, 0.76); sg.rotation.y = Math.PI; g.add(sg); n += 7;
    }
    var PARK_COLS = [0x9a2b26, 0xe6e2d6, 0x2b3138, 0x2e7d4f, 0xd9a520, 0x87909a, 0x4a3a7a, 0xb56a2a];
    function parked(x, z, ry, i) { var g = new THREE.Group(); carBody(g, PARK_COLS[i % PARK_COLS.length]); g.position.set(x, 0, z); g.rotation.y = ry; world.group.add(g); n += 1; }

    // every road gets both kerbs dressed: lamps and trees alternating, with furniture mixed in
    var seed = 7;
    function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
    CITY.roads.forEach(function (rd, ri) {
      var alongX = (rd.x2 - rd.x1) > (rd.z2 - rd.z1);
      var a0 = alongX ? rd.x1 : rd.z1, a1 = alongX ? rd.x2 : rd.z2, mid = alongX ? (rd.z1 + rd.z2) / 2 : (rd.x1 + rd.x2) / 2;
      if (a1 - a0 < 20) return;   /* the little lane behind the yard is not a boulevard */
      for (var side = -1; side <= 1; side += 2) {
        var off = mid + side * 5.7, k = 0;
        for (var a = a0 + 14; a < a1 - 14; a += 22) {
          var x = alongX ? a : off, z = alongX ? off : a;
          if (!sceneFree(x, z, 1.2)) { k++; continue; }
          var dir = alongX ? [0, -side] : [-side, 0];
          if (k % 2 === 0) lamp(x, z, dir); else tree(x + (alongX ? 0 : side * 0.9), z + (alongX ? side * 0.9 : 0), 0.85 + rnd() * 0.35);
          // something extra between the posts
          var bx2 = alongX ? a + 7 : off + side * 0.6, bz2 = alongX ? off + side * 0.6 : a + 7;
          if (sceneFree(bx2, bz2, 1.0)) {
            var pick2 = (k + ri) % 6, ry = alongX ? (side > 0 ? Math.PI : 0) : (side > 0 ? -Math.PI / 2 : Math.PI / 2);
            if (pick2 === 0) bench(bx2, bz2, ry);
            else if (pick2 === 1) bin(bx2, bz2);
            else if (pick2 === 2) hydrant(bx2, bz2);
            else if (pick2 === 3) planter(bx2, bz2);
            else if (pick2 === 4) { bollard(bx2, bz2); bollard(bx2 + (alongX ? 1.4 : 0), bz2 + (alongX ? 0 : 1.4)); }
            else if (k % 4 === 1) shelter(bx2, bz2, ry);
          }
          k++;
        }
        // cars at the kerb, nose to tail, skipping the stretch outside your own door
        for (var c = a0 + 26; c < a1 - 26; c += 52) {
          var cx = alongX ? c + rnd() * 6 : mid + side * 3.1, cz = alongX ? mid + side * 3.1 : c + rnd() * 6;
          if (!sceneFree(cx, cz, 2.4)) continue;
          if (Math.abs(cx) < 16 && Math.abs(cz - C.mainZ) < 12) continue;
          parked(cx, cz, alongX ? (side > 0 ? Math.PI / 2 : -Math.PI / 2) : (side > 0 ? Math.PI : 0), Math.floor(rnd() * 8));
        }
      }
    });
    if (typeof console !== 'undefined' && console.debug) console.debug('[city] scenery meshes: ' + n);
  }
  function buildCity() {
    var C = CITY, SW = world.sidewalkZ || ROOM.z + 2.6, treeM = MAT.tree, trunkM = MAT.trunk;
    // roads: Main Street gets its two far ends and its far pavement (the middle stretch already exists), then the back street, the north street, two avenues and the lane from the yard gate
    [[-C.x, -45], [45, C.x]].forEach(function (r) { var len = r[1] - r[0], cx = (r[0] + r[1]) / 2; var rd = new THREE.Mesh(new THREE.PlaneGeometry(len, 9), MAT.asphalt); rd.rotation.x = -Math.PI / 2; rd.position.set(cx, 0.006, C.mainZ); rd.receiveShadow = true; world.group.add(rd); var pv = new THREE.Mesh(new THREE.PlaneGeometry(len, 3.2), MAT.pavement); pv.rotation.x = -Math.PI / 2; pv.position.set(cx, 0.05, SW); world.group.add(pv); for (var t = r[0] + 2; t < r[1] - 2; t += 6) box(1.8, 0.01, 0.12, colorMat(0xe8e0a0, 0.9), t, 0.013, C.mainZ, { cast: false }); });
    var farPv = new THREE.Mesh(new THREE.PlaneGeometry(C.x * 2, 3.2), MAT.pavement); farPv.rotation.x = -Math.PI / 2; farPv.position.set(0, 0.05, C.mainZ + 6.1); farPv.receiveShadow = true; world.group.add(farPv); C.roads.push({ x1: -C.x, x2: C.x, z1: C.mainZ - 4.5, z2: C.mainZ + 4.5 });
    cityRoad(-C.x, C.backZ, C.x, C.backZ); cityRoad(-C.x, C.northZ, C.x, C.northZ); cityRoad(C.westX, C.z1, C.westX, C.z2); cityRoad(C.eastX, C.z1, C.eastX, C.z2);
    var ln = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 3.5), MAT.asphalt); ln.rotation.x = -Math.PI / 2; ln.position.set(C.laneX, 0.0055, -35.2); world.group.add(ln); C.roads.push({ x1: C.laneX - 2.25, x2: C.laneX + 2.25, z1: -36, z2: -18 });
    // the owner's bay in the yard, behind the gate
    var lineM = colorMat(0xf2f2f2, 0.9); [[7.7, -14.15, 4.4, 0.1], [7.7, -16.45, 4.4, 0.1], [9.85, -15.3, 0.1, 2.4]].forEach(function (l) { box(l[2], 0.01, l[3], lineM, l[0], 0.012, l[1], { cast: false }); }); signPlane(['P', 'OWNER ONLY'], 0.7, 0.5, 9.93, 1.5, -15.3, -Math.PI / 2, { size: 60, bg: '#1b3a8a', titleColor: '#ffffff', color: '#ffffff' });
    // places you can do business with
    cityBldg(-30, 35, 18, 15, 10, 0xcfc8b8, 'First Harvest Bank', 'bank'); cityDoor(-30, 27.5, -1, 8, 'bank', 'FIRST HARVEST BANK', 'deposits · withdrawals', 0x2f6b9a); [-36, -24].forEach(function (cx) { cyl(0.35, 0.4, 5, colorMat(0xe9e4d8, 0.8), cx, 2.5, 27.0, null, 14); });
    cityBldg(-8, 33, 11, 11, 5.5, 0x6b5a48, 'Iron & Oak Arms', 'gun'); cityDoor(-8, 27.5, -1, 6, 'gun', 'IRON & OAK', 'arms · ammunition · armour', 0xb5121b);
    cityBldg(-38, 0, 14, 14, 6.5, 0x7b8f6a, 'Green Leaf (rival)', 'rival'); cityDoor(-38, 7, 1, 7, 'rival', 'GREEN LEAF', 'dispensary · est. last year', 0x39d353);
    cityBldg(-22, -57, 26, 15, 7.5, 0x8d949c, 'RF Supply Co.', 'supply');
    // The precinct used to be two doors down, which made every police response absurd. It is at the
    // far end of Main Street now, and it goes in with the landmarks so the blocks fill in around it.
    cityBldg(40, 2, 12, 12, 8, 0x8a6a4a, 'Corner Tobacconist', 'tobac');
    cityDoor(40, 8, 1, 6, 'tobac', 'CORNER TOBACCONIST', 'buys cartons wholesale', 0xe8c27a);
    CITY.police = { x: 96, z: 1, w: 16, d: 14 };
    cityBldg(CITY.police.x, CITY.police.z, CITY.police.w, CITY.police.d, 9, 0x5a6a8a, 'Police', 'police');
    cityDoor(CITY.police.x, CITY.police.z + CITY.police.d / 2, 1, 7, 'police', 'POLICE PRECINCT', 'heat · bribes · statements', 0x5aa0d8);
    cityDoor(-22, -49.5, 1, 9, 'supply', 'RF SUPPLY CO.', 'trade counter · load your own car', 0xf2c21a); box(6, 3.2, 0.1, colorMat(0x5f666e, 0.5, 0.6), -12, 1.6, -49.45, { cast: false });
    C.pois = [{ id: 'shop', name: 'Grow Co. (you)', x: 0, z: 0, col: '#6fdc8c' }, { id: 'bank', name: 'First Harvest Bank', x: -30, z: 27.5, col: '#5aa0d8' }, { id: 'gun', name: 'Iron & Oak Arms', x: -8, z: 27.5, col: '#e0564a' }, { id: 'rival', name: 'Green Leaf (rival)', x: -38, z: 7, col: '#39d353' }, { id: 'supply', name: 'RF Supply Co.', x: -22, z: -49.5, col: '#f2c21a' }, { id: 'park', name: 'Harvest Park', x: 28, z: 44, col: '#8fd17a' }];
    // Harvest Park: lawn, a crossing of paths, trees, benches, and people who might buy off you
    var PK = { x1: 10, x2: 48, z1: 27, z2: 62 }; C.parks.push(PK); var lawn = new THREE.Mesh(new THREE.PlaneGeometry(PK.x2 - PK.x1, PK.z2 - PK.z1), new THREE.MeshStandardMaterial({ map: TEX.grass, color: 0xd8e6c0, roughness: 1 })); lawn.rotation.x = -Math.PI / 2; lawn.position.set(29, 0.03, 44.5); lawn.receiveShadow = true; world.group.add(lawn);
    [[38, 2.2, 29, 44.5], [2.2, 35, 29, 44.5]].forEach(function (p) { var path = new THREE.Mesh(new THREE.PlaneGeometry(p[0], p[1]), colorMat(0xc9b78f, 1)); path.rotation.x = -Math.PI / 2; path.position.set(p[2], 0.04, p[3]); world.group.add(path); }); cyl(2.2, 2.4, 0.5, colorMat(0x9aa0a6, 0.8), 29, 0.25, 44.5, null, 20); cyl(1.9, 1.9, 0.06, colorMat(0x4a90c8, 0.2, 0.3), 29, 0.5, 44.5, null, 20); world.obstacles.push({ x1: 26.7, x2: 31.3, z1: 42.2, z2: 46.8, tag: 'city', floorLevel: 0 });
    [[14, 31], [20, 56], [36, 33], [43, 40], [16, 47], [40, 57], [24, 36], [35, 51]].forEach(function (p) { plantTree('broad', p[0], p[1], 1.2 + Math.random() * 0.25); world.obstacles.push({ x1: p[0] - 0.3, x2: p[0] + 0.3, z1: p[1] - 0.3, z2: p[1] + 0.3, tag: 'city', floorLevel: 0 }); });
    [[24, 42.6, 0], [34, 46.4, Math.PI], [27.1, 50, Math.PI / 2], [30.9, 38, -Math.PI / 2]].forEach(function (b) { var bg = new THREE.Group(); bg.position.set(b[0], 0, b[1]); bg.rotation.y = b[2]; world.group.add(bg); box(1.6, 0.06, 0.45, MAT.wood, 0, 0.5, 0, { parent: bg }); box(1.6, 0.4, 0.05, MAT.wood, 0, 0.8, -0.22, { parent: bg }); [-0.7, 0.7].forEach(function (lx) { box(0.06, 0.5, 0.4, MAT.black, lx, 0.25, 0, { parent: bg }); }); });
    [[22, 41], [36, 48], [18, 52], [41, 35], [31, 58]].forEach(function (p, i) { var h = makeHuman({ skin: pick(SKINS), hair: pick(HAIRS), shirt: pick(SHIRTS), pants: pick(PANTS), hat: pick([null, 'cap', 'beanie']), prop: pick([null, 'phone', 'coffee']), longSleeve: Math.random() < 0.5 }); h.position.set(p[0], 0, p[1]); h.rotation.y = Math.random() * 6.28; world.group.add(h); var hb = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.9, 0.7), MAT.none); hb.position.y = 0.95; h.add(hb); interactable(hb, { kind: 'parkDeal', idx: i }); parkFolk.push({ h: h, coolT: 0, want: randi(1, 3) }); });
    // everything else is the rest of town: shops and flats on the near blocks, towers further out
    var cols = [0xb9b2a2, 0x9a8f80, 0xa7b0b8, 0x8c7b6a, 0xc2b8a3, 0x7f8a94, 0xb0a08c];
    [[-52, 2, 9, 14, 8], [-22, -2, 12, 16, 9],  [52, -2, 8, 16, 7], [26, -24, 18, 14, 10], [47, -25, 14, 14, 14], [-16, -25, 14, 12, 8], [-34, -24, 16, 14, 11], [-52, -24, 10, 14, 7], [-52, 36, 9, 18, 12], [4, 66, 14, 10, 9], [-14, 52, 18, 14, 13], [-40, 60, 22, 14, 16], [-52, 58, 0, 0, 0], [53, 38, 7, 22, 9], [52, 64, 10, 12, 8]].forEach(function (b, i) { if (b[2] > 0) cityFill(b[0], b[1], b[2], b[3], b[4], cols[i % cols.length]); });
    for (var ox = -110; ox <= 110; ox += 22) { if (Math.abs(ox) < 66) { if (ox !== -22) cityFill(ox, -58, 18, 9, 10 + ((ox * 7) % 13 + 13) % 13, cols[Math.abs(ox) % cols.length]); cityFill(ox + 3, 90, 17, 9, 12 + ((ox * 5) % 17 + 17) % 17, cols[Math.abs(ox + 3) % cols.length]); } }
    [-98, -80, 80, 98].forEach(function (ox, i) { for (var oz = -56; oz <= 90; oz += 24) { if (Math.abs(oz - C.mainZ) < 9 || Math.abs(oz - C.backZ) < 9 || Math.abs(oz - C.northZ) < 9) continue; cityFill(ox, oz, 14, 18, 14 + ((oz + ox) % 19 + 19) % 19, cols[(i + Math.abs(oz)) % cols.length]); } });
    // A Workshop place goes in last, once every block is standing, so it can be given a plot that is
    // genuinely empty. A pack names where it would like to be; if that is a road, a park, your own
    // yard or somebody else's building, it takes the nearest free plot instead and says so.
    WSPLACES.forEach(function (q) {
      var sp = citySpot(q.x, q.z, q.w, q.d);
      if (sp.stuck) { console.warn('[workshop] nowhere to put ' + q.name + ': the town is full'); return; }
      if (sp.moved) console.warn('[workshop] ' + q.name + ' asked for ' + q.x + ',' + q.z + ' but that plot is taken; built at ' + sp.x + ',' + sp.z);
      q.bx = sp.x; q.bz = sp.z;   /* where it actually stands: the door, the pin and the counter all read this */
      cityBldg(sp.x, sp.z, q.w, q.d, q.h, q.colour, q.name, q.id);
      var fc = q.face === -1 ? -1 : 1, dz = sp.z + fc * (q.d / 2 + 1.6);   /* a built-in pack skips the import validator, so every optional field needs a default here too */
      cityDoor(sp.x, dz, fc, Math.min(q.w - 2, 9), q.id, q.name.toUpperCase(), q.sub, q.doorColour);
      C.pois.push({ id: q.id, name: q.name, x: sp.x, z: dz, col: q.pin || '#6fdc8c' });
    });
    // a city pack fills the ground it just added: more outer avenues of blocks, and the streets run out to meet them
    if (WSCITY.grow > 0) {
      /* the three main roads already run the full width of the town; a second copy here used to sit 1 mm under the first and flicker */
      for (var ring = 0; ring < Math.max(1, WSCITY.rows); ring++) {
        var ax = 120 + ring * 20;
        [-ax, ax].forEach(function (bx, bi) { for (var bz = C.z1 + 14; bz <= C.z2 - 14; bz += 26) { if (Math.abs(bz - C.mainZ) < 10 || Math.abs(bz - C.backZ) < 10 || Math.abs(bz - C.northZ) < 10) continue; cityFill(bx, bz, 15, 19, 12 + ((bz + bx) % 21 + 21) % 21, cols[(bi + ring + Math.abs(Math.round(bz))) % cols.length]); } });
        [C.z1 + 9 - ring * 22, C.z2 - 9 + ring * 22].forEach(function (bz2, bj) { for (var bx2 = -108; bx2 <= 108; bx2 += 24) cityFill(bx2, bz2, 18, 12, 11 + ((bx2 * 3 + ring) % 15 + 15) % 15, cols[(bj + Math.abs(bx2)) % cols.length]); });
      }
    }
    buildScenery(); scatterGreenery();
    // the player's car, where it was left
    // two vehicles: the car in the garage, the van in the yard bay. Whichever you last touched is the one the wheel, the trunk and the parts refer to.
    var vehicles = drive.vehicles = {};
    function spawnVehicle(id, builder, colour, spec) {
      var cs = vehState(id), home = id === 'van' ? { x: 7.0, z: -15.3 } : { x: 12.8, z: -18.25 };
      if (!isFinite(cs.x) || !isFinite(cs.z) || Math.abs(cs.x) > CITY.x - 1 || cs.z < CITY.z1 + 1 || cs.z > CITY.z2 - 1) { cs.x = home.x; cs.z = home.z; cs.h = Math.PI / 2; }   /* saved outside the town */
      if (id === 'car' && cs.x > 5 && cs.x < 10.5 && cs.z > -17 && cs.z < -13.5) { cs.x = home.x; cs.z = home.z; cs.h = Math.PI / 2; }
      if (id === 'van' && cs.x > 7.4 && cs.x < 8.0 && Math.abs(cs.z + 15.3) < 0.3) { cs.x = home.x; }   /* the first van spot had its tail in the garage wall */   /* a save from before the garage: the car stood in the yard bay, which is the van's now */
      var g = new THREE.Group(), wheels = builder(g, colour, true); g.position.set(cs.x, 0, cs.z); g.rotation.y = cs.h; world.group.add(g);
      var lamps = g.userData.lamps; [-0.6, 0.6].forEach(function (bx) { var sl = new THREE.SpotLight(0xfff3c8, 0, 26, 0.62, 0.5, 1.4); sl.position.set(bx, 0.62, spec.nose); sl.castShadow = false; g.add(sl); var tgt = new THREE.Object3D(); tgt.position.set(bx * 2.4, -0.3, -15); g.add(tgt); sl.target = tgt; lamps.beams.push(sl); });
      var chit = new THREE.Mesh(new THREE.BoxGeometry(spec.w, spec.h, spec.l), MAT.none); chit.position.y = spec.h / 2; g.add(chit); interactable(chit, { kind: 'car', veh: id });
      spec.parts.forEach(function (p) { var m = new THREE.Mesh(new THREE.BoxGeometry(p[4], p[5], p[6]), MAT.none); m.position.set(p[1], p[2], p[3]); g.add(m); interactable(m, { kind: 'carPart', part: p[0], veh: id }); });
      (spec.hits || []).forEach(function (p) { var m = new THREE.Mesh(new THREE.BoxGeometry(p[4], p[5], p[6]), MAT.none); m.position.set(p[1], p[2], p[3]); g.add(m); interactable(m, { kind: p[0], veh: id }); });   /* the openable parts get their own hit boxes, each poking out past the body so the crosshair finds them first */
      vehicles[id] = { g: g, wheels: wheels, parts: g.userData.parts, lamps: lamps, dist: spec.dist };
    }
    spawnVehicle('car', carBody, WSCAR && WSCAR.colour !== undefined ? WSCAR.colour : 0x1f4f8a, { w: 2.1, h: 1.6, l: 4.2, nose: -2.0, dist: 6.2, parts: [['doorL', -1.06, 0.7, -0.05, 0.36, 1.0, 1.3], ['doorR', 1.06, 0.7, -0.05, 0.36, 1.0, 1.3], ['boot', 0, 0.92, 1.74, 1.5, 0.8, 0.66], ['bonnet', 0, 0.86, -1.45, 1.5, 0.62, 0.9]] });
    spawnVehicle('van', ownVanBody, 0xe8e6df, { w: 2.2, h: 2.3, l: 5.2, nose: -2.5, dist: 7.6, parts: [['doorL', -1.12, 1.0, -1.55, 0.36, 1.3, 1.2], ['doorR', 1.12, 1.0, -1.55, 0.36, 1.3, 1.2], ['boot', 0, 1.2, 2.62, 1.9, 1.9, 0.5], ['bonnet', 0, 0.75, -2.62, 1.7, 0.5, 0.5], ['hatch', 1.15, 1.95, 0.85, 0.36, 0.5, 2.2], ['counter', 1.1, 1.45, 0.85, 0.3, 0.3, 2.0], ['rail', 0, 1.1, 2.78, 1.9, 0.5, 0.2]], hits: [['vanRack', -0.74, 1.6, 0.85, 0.36, 0.7, 1.7], ['vanRegister', 0.6, 1.55, 1.75, 0.4, 0.4, 0.4]] });
    syncVanRack();
    selectVehicle('car'); if (vehicles.van.g.userData.openSign) vehicles.van.g.userData.openSign.visible = !!vehState('van').shopOpen;
    carLamps();
    // traffic: a handful of cars that keep to their lane and stop for you
    [[C.mainZ + 2.7, 1], [C.mainZ - 0.3, -1], [C.mainZ + 2.7, 1], [C.backZ + 2.2, 1], [C.backZ - 2.2, -1], [C.northZ + 2.2, 1], [C.northZ - 2.2, -1], [C.mainZ - 0.3, -1], [C.backZ + 2.2, 1], [C.northZ - 2.2, -1], [C.mainZ + 2.7, 1], [C.backZ - 2.2, -1]].forEach(function (l, i) { var g = new THREE.Group(); carBody(g, [0xb5121b, 0xe9e4d8, 0x2b2f35, 0x2e7d4f, 0xf2c21a, 0x8d949c, 0x5a3a8a, 0x3a6ea5, 0xd9d9d9, 0x7a2a2a, 0x2a2a2a, 0xc98a2a][i]); g.position.set(-100 + (i < 7 ? i * 31 : (i - 7) * 41 + 15), 0, l[0]); g.rotation.y = l[1] > 0 ? -Math.PI / 2 : Math.PI / 2; world.group.add(g); traffic.push({ g: g, z: l[0], dir: l[1], v: 9 + (i % 3) * 2, cur: 0 }); });
  }
  function carBlocked(x, z, r) {
    for (var i = 0; i < world.obstacles.length; i++) { var o = world.obstacles[i]; if ((o.floorLevel || 0) !== 0 && o.floorLevel !== 'any') continue; if (o.tag === 'guard') continue; var px = clamp(x, o.x1, o.x2), pz = clamp(z, o.z1, o.z2); if ((x - px) * (x - px) + (z - pz) * (z - pz) < r * r) return true; }
    for (var t = 0; t < traffic.length; t++) { var p = traffic[t].g.position; if ((x - p.x) * (x - p.x) + (z - p.z) * (z - p.z) < (r + 1.5) * (r + 1.5)) return true; }
    return Math.abs(x) > CITY.x || z < CITY.z1 || z > CITY.z2;
  }
