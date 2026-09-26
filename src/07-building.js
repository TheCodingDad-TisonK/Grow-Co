//@ the building: rooms, walls, doorways, the lobby and the service window
  // ── Building: rooms, walls, doorways, lobby with a service window ──
  // Floor plan (x left→right, z back→front). Half extents ROOM.x=12, ROOM.z=9.
  //   z -9..-2 : GROW ROOM (x -12..-1)  |  DRY & CURE (x -1..12)
  //   z -2..4  : OFFICE (x -12..-4) | HALL / lounge (x -4..4) | PROCESSING (x 4..12)
  //   z  4     : staff wall with the SERVICE WINDOW (x -1.2..1.2) + staff door (x 9.4..10.6)
  //   z  4..9  : LOBBY (customers, guard), entrance door at x 0, z 9
  var WALL_T = 0.2;
  function wallZ(z, x1, x2, gaps, mat) {
    // wall running along x at a fixed z; gaps = [[gx1, gx2, yBottom, yTop]] (full-height doorway when y omitted)
    gaps = (gaps || []).slice().sort(function (a, b) { return a[0] - b[0]; });
    var cur = x1;
    function seg(a, b, yb, yt, solid) { var m = box(b - a, yt - yb, WALL_T, mat || MAT.wall, (a + b) / 2, (yb + yt) / 2, z, solid ? { solid: true, tag: 'wall' } : { cast: true }); if (yb === 0) trimZ(a, b, z); return m; }
    gaps.forEach(function (gp) {
      if (gp[0] > cur) seg(cur, gp[0], 0, ROOM.h, true);
      var yb = gp[2] || 0, yt = gp[3] || (gp[2] ? ROOM.h : 2.3);
      if (yb > 0) seg(gp[0], gp[1], 0, yb, true);
      if (yt < ROOM.h) seg(gp[0], gp[1], yt, ROOM.h, false);
      cur = gp[1];
    });
    if (cur < x2) seg(cur, x2, 0, ROOM.h, true);
  }
  function wallX(x, z1, z2, gaps, mat) {
    gaps = (gaps || []).slice().sort(function (a, b) { return a[0] - b[0]; });
    var cur = z1;
    function seg(a, b, yb, yt, solid) { var m = box(WALL_T, yt - yb, b - a, mat || MAT.wall, x, (yb + yt) / 2, (a + b) / 2, solid ? { solid: true, tag: 'wall' } : { cast: true }); if (yb === 0) trimX(a, b, x); return m; }
    gaps.forEach(function (gp) {
      if (gp[0] > cur) seg(cur, gp[0], 0, ROOM.h, true);
      var yb = gp[2] || 0, yt = gp[3] || (gp[2] ? ROOM.h : 2.3);
      if (yb > 0) seg(gp[0], gp[1], 0, yb, true);
      if (yt < ROOM.h) seg(gp[0], gp[1], yt, ROOM.h, false);
      cur = gp[1];
    });
    if (cur < z2) seg(cur, z2, 0, ROOM.h, true);
  }
  // skirting board along the floor and a cove strip at the ceiling, on both faces of the wall
  function trimZ(a, b, z) { box(b - a, 0.12, WALL_T + 0.05, MAT.trim, (a + b) / 2, 0.06, z, { cast: false }); box(b - a, 0.07, WALL_T + 0.04, MAT.trim, (a + b) / 2, ROOM.h - 0.035, z, { cast: false }); }
  function trimX(a, b, x) { box(WALL_T + 0.05, 0.12, b - a, MAT.trim, x, 0.06, (a + b) / 2, { cast: false }); box(WALL_T + 0.04, 0.07, b - a, MAT.trim, x, ROOM.h - 0.035, (a + b) / 2, { cast: false }); }
  function doorFrame(x, z, alongX) { if (!(x === 10.0 && z === 4)) slideDoor('d' + x.toFixed(1) + '_' + z.toFixed(1), x, 0, z, alongX, 0, 'door', true); // painted architrave around a 1.2 x 2.3 doorway, with a brushed threshold strip
    var t = MAT.trim;
    if (alongX) { box(0.1, 2.34, WALL_T + 0.06, t, x - 0.65, 1.17, z); box(0.1, 2.34, WALL_T + 0.06, t, x + 0.65, 1.17, z); box(1.4, 0.1, WALL_T + 0.06, t, x, 2.35, z); box(1.2, 0.012, WALL_T + 0.02, MAT.metal, x, 0.006, z, { cast: false }); }
    else { box(WALL_T + 0.06, 2.34, 0.1, t, x, 1.17, z - 0.65); box(WALL_T + 0.06, 2.34, 0.1, t, x, 1.17, z + 0.65); box(WALL_T + 0.06, 0.1, 1.4, t, x, 2.35, z); box(WALL_T + 0.02, 0.012, 1.2, MAT.metal, x, 0.006, z, { cast: false }); }
  }
  // flat wall sign (a plane fixed to a surface, never billboarded, so it cannot clip through walls)
  function signPlane(lines, w, h, x, y, z, rotY, opts) {
    opts = opts || {}; var tex = textTex(lines, Math.round(w * 320), Math.round(h * 320), Object.assign({ size: Math.round(h * 48) }, opts));
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true })); m.position.set(x, y, z); m.rotation.y = rotY || 0; world.group.add(m); fixtureSign(m, lines); return m;
  }
  // framed picture hung on a wall: frame, mat and a textured print. rotY faces the print into the room
  function framedPoster(tex, w, h, x, y, z, rotY, frameMat) {
    var g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rotY || 0; world.group.add(g);
    var fr = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, h + 0.08, 0.035), frameMat || MAT.darkwood); fr.position.z = -0.0175; fr.castShadow = true; g.add(fr);
    var pr = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75 })); pr.position.z = 0.002; g.add(pr);
    var gl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, roughness: 0.05, metalness: 0.2 })); gl.position.z = 0.006; g.add(gl);
    return g;
  }
  function wallOutlet(x, y, z, rotY) { var g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rotY || 0; world.group.add(g); var pl = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.008), MAT.white); g.add(pl); [0.03, -0.03].forEach(function (dy) { var s = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.006, 10), MAT.trim); s.rotation.x = Math.PI / 2; s.position.set(0, dy, 0.006); g.add(s); var h1 = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.008, 0.004), MAT.black); h1.position.set(-0.005, dy, 0.009); g.add(h1); var h2 = h1.clone(); h2.position.x = 0.005; g.add(h2); }); }
  function ceilingVent(x, z) { var g = new THREE.Group(); g.position.set(x, ROOM.h - 0.012, z); world.group.add(g); g.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.5), MAT.white)); for (var i = 0; i < 6; i++) { var l = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.012, 0.03), MAT.plastic); l.position.set(0, -0.012, -0.18 + i * 0.072); l.rotation.x = 0.5; g.add(l); } }
  function roomLamp(x, z, intensity) {
    // recessed 1.2 x 0.6 troffer: white frame, prismatic lens that dims when the shop lights are off
    var fr = box(1.2, 0.05, 0.6, MAT.trim, x, ROOM.h - 0.025, z, { cast: false });
    var lens = box(1.1, 0.02, 0.5, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff3e0, emissiveIntensity: 0.9, roughness: 0.3 }), x, ROOM.h - 0.045, z, { cast: false });
    (world.lampFixtures = world.lampFixtures || []).push(lens);
    var l = new THREE.PointLight(0xfff3e0, intensity || 0.7, 14, 1.6); l.userData.base = intensity || 0.7; l.position.set(x, ROOM.h - 0.35, z); scene.add(l); world.roomLamps.push(l); return l;
  }
  // a pendant lamp on a cord (lobby / hall): warm bulb in a metal shade
  function pendant(x, z, drop, color, intensity) {
    var g = new THREE.Group(); g.position.set(x, ROOM.h, z); world.group.add(g);
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16), MAT.black));
    var cord = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, drop, 6), MAT.black); cord.position.y = -drop / 2; g.add(cord);
    var shade = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.22, 0.24, 20, 1, true), new THREE.MeshStandardMaterial({ color: color || 0x2a2d33, roughness: 0.35, metalness: 0.6, side: THREE.DoubleSide })); shade.position.y = -drop - 0.1; g.add(shade);
    var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), glowMat(0xffe9b0, 1.6)); bulb.position.y = -drop - 0.2; g.add(bulb);
    (world.lampFixtures = world.lampFixtures || []).push(bulb);
    var l = new THREE.PointLight(0xffe0a8, intensity || 0.5, 8, 1.7); l.userData.base = intensity || 0.5; l.position.set(x, ROOM.h - drop - 0.28, z); scene.add(l); world.roomLamps.push(l); return g;
  }
  // per-room floor: a plane whose texture repeat matches the room size so tiles stay the same physical size everywhere
  function floorPlane(mat, x1, x2, z1, z2, per, y) {
    var m = mat.clone(); m.map = mat.map.clone(); m.map.needsUpdate = true; m.map.repeat.set((x2 - x1) / per, (z2 - z1) / per);
    if (mat.bumpMap) { m.bumpMap = mat.bumpMap.clone(); m.bumpMap.needsUpdate = true; m.bumpMap.repeat.set((x2 - x1) / per, (z2 - z1) / per); }
    var fl = new THREE.Mesh(new THREE.PlaneGeometry(x2 - x1, z2 - z1), m); fl.rotation.x = -Math.PI / 2; fl.position.set((x1 + x2) / 2, y || 0, (z1 + z2) / 2); fl.receiveShadow = true; world.group.add(fl); return fl;
  }
  // exterior brick skin on one side wall (x fixed), leaving holes for windows: holes = [[z1, z2, y1, y2]]
  function skinX(x, z1, z2, y1, y2, holes) {
    holes = (holes || []).slice().sort(function (a, b) { return a[0] - b[0]; }); var cur = z1;
    holes.forEach(function (h) { if (h[0] > cur) box(0.08, y2 - y1, h[0] - cur, MAT.brick, x, (y1 + y2) / 2, (cur + h[0]) / 2, { cast: true }); if (h[2] > y1) box(0.08, h[2] - y1, h[1] - h[0], MAT.brick, x, (y1 + h[2]) / 2, (h[0] + h[1]) / 2); if (h[3] < y2) box(0.08, y2 - h[3], h[1] - h[0], MAT.brick, x, (h[3] + y2) / 2, (h[0] + h[1]) / 2); box(0.12, 0.06, h[1] - h[0] + 0.1, MAT.trim, x, h[2] - 0.03, (h[0] + h[1]) / 2); cur = h[1]; });
    if (cur < z2) box(0.08, y2 - y1, z2 - cur, MAT.brick, x, (y1 + y2) / 2, (cur + z2) / 2, { cast: true });
  }

  function buildStatic() {
    world.roomLamps = [];
    // outside ground + trees
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), MAT.grass); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; ground.receiveShadow = true; world.group.add(ground);
    for (var i = 0; i < 30; i++) {
      var ang = Math.random() * Math.PI * 2, r = randf(19, 48); var tx = Math.cos(ang) * r, tz = Math.sin(ang) * r;
      if (tz > 9 && tz < 21 && Math.abs(tx) < 30) tz += 14; // keep the street clear
      if (tz < -9 && tz > -26 && tx > -8 && tx < 18) tx -= 22; // and the back yard and the garage
      if ((tz > -48 && tz < -32) || (tx > 1.5 && tx < 7.5 && tz > -37 && tz < -17) || (tz > 9 && tz < 26)) continue;   /* the back street, the yard lane and Main Street: no trees on tarmac */
      var th = randf(2.5, 4.5); if (Math.random() < 0.7) plantTree('pine', tx, tz, th / 4.3); else plantTree('broad', tx, tz, th / 5);
    }
    // floors per room (same plan as the walls below), ceiling tiles
    floorPlane(MAT.rubber, -ROOM.x, -1, -ROOM.z, -2, 1.0);      // grow room: rubber matting
    floorPlane(MAT.floor, -1, ROOM.x, -ROOM.z, -2, 2.2);        // dry & cure: sealed concrete
    floorPlane(MAT.planks, -ROOM.x, 4, -2, 4, 1.6);             // office + hall: wood planks
    floorPlane(MAT.floor, 4, ROOM.x, -2, 4, 2.2);               // processing: concrete
    floorPlane(MAT.tile, -ROOM.x, ROOM.x, 4, ROOM.z, 1.2);      // lobby: tile
    // the ceiling is cut round both stairwells, the same holes as the upstairs slab, so the stairs come up through it instead of through it
    (function () { var holes = [[STAIR.x1 - 0.1, STAIR.x2 + 0.1, STAIR.z1 - 0.1, STAIR.z2 + 0.35], [STAIR2.x1 - 0.1, STAIR2.x2 + 0.1, STAIR2.z1 - 0.12, STAIR2.z2 + 0.35]], xs = [-ROOM.x, ROOM.x], zs = [-ROOM.z, ROOM.z]; holes.forEach(function (h) { xs.push(h[0], h[1]); zs.push(h[2], h[3]); }); xs.sort(function (p, q) { return p - q; }); zs.sort(function (p, q) { return p - q; });
      for (var xi = 0; xi < xs.length - 1; xi++) for (var zi = 0; zi < zs.length - 1; zi++) { var cw = xs[xi + 1] - xs[xi], cd = zs[zi + 1] - zs[zi]; if (cw < 0.01 || cd < 0.01) continue; var ccx = (xs[xi] + xs[xi + 1]) / 2, ccz = (zs[zi] + zs[zi + 1]) / 2; if (holes.some(function (h) { return ccx > h[0] && ccx < h[1] && ccz > h[2] && ccz < h[3]; })) continue; var ceil = new THREE.Mesh(new THREE.PlaneGeometry(cw, cd), MAT.ceiling); ceil.rotation.x = Math.PI / 2; ceil.position.set(ccx, ROOM.h - 0.012, ccz); world.group.add(ceil); } })();   /* 12 mm under the slab's underside at ROOM.h: coplanar faces flicker */
    // outer walls: back solid, left with a grow-room window, right solid, front glass + door
    wallZ(-ROOM.z - WALL_T / 2, -ROOM.x - WALL_T, ROOM.x + WALL_T, [[2.4, 3.6]]); doorFrame(3.0, -ROOM.z - WALL_T / 2, true);   // back wall with the door into the storage annex
    wallX(ROOM.x + WALL_T / 2, -ROOM.z, ROOM.z);
    buildAnnex();
    // left wall: a window into the grow room (z -8..-5) and one for the office (z 1.9..3.4)
    wallX(-ROOM.x - WALL_T / 2, -ROOM.z, ROOM.z, [[-8.0, -5.0, 0.9, 2.4], [1.9, 3.4, 0.9, 2.4]]);
    world.windows = { growWin: { z1: -8.0, z2: -5.0, y1: 0.9, y2: 2.4 }, officeWin: { z1: 1.9, z2: 3.4, y1: 0.9, y2: 2.4 } };
    [[-6.5, 3.0], [2.65, 1.5]].forEach(function (w) {
      var win = new THREE.Mesh(new THREE.PlaneGeometry(w[1], 1.5), MAT.glass); win.rotation.y = Math.PI / 2; win.position.set(-ROOM.x, 1.65, w[0]); world.group.add(win);
      box(0.32, 0.05, w[1] + 0.24, MAT.trim, -ROOM.x + 0.08, 0.9, w[0]);                        // inside sill
      box(0.1, 1.6, 0.08, MAT.trim, -ROOM.x - 0.02, 1.65, w[0] - w[1] / 2 - 0.04); box(0.1, 1.6, 0.08, MAT.trim, -ROOM.x - 0.02, 1.65, w[0] + w[1] / 2 + 0.04); box(0.1, 0.08, w[1] + 0.16, MAT.trim, -ROOM.x - 0.02, 2.44, w[0]);
      box(0.04, 1.5, 0.03, MAT.white, -ROOM.x, 1.65, w[0]); box(0.04, 0.03, w[1], MAT.white, -ROOM.x, 1.65, w[0]);   // mullions
      var out = new THREE.Mesh(new THREE.PlaneGeometry(w[1], 1.5), MAT.glass); out.rotation.y = -Math.PI / 2; out.position.set(-ROOM.x - WALL_T, 1.65, w[0]); world.group.add(out);
    });
    // front: low wall + glass panes + door gap
    var fz = ROOM.z + WALL_T / 2;
    wallZ(fz, -ROOM.x - WALL_T, ROOM.x + WALL_T, [[-ROOM.x, -0.75, 0.9, 2.9], [-0.75, 0.75, 0, 2.3], [0.75, ROOM.x, 0.9, 2.9]]);
    var gl = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.x - 0.75, 2.0), MAT.glass); gl.position.set(-(ROOM.x + 0.75) / 2, 1.9, ROOM.z); world.group.add(gl);
    var gr = gl.clone(); gr.position.x = (ROOM.x + 0.75) / 2; world.group.add(gr);
    box(ROOM.x - 0.75, 0.06, WALL_T + 0.12, MAT.trim, -(ROOM.x + 0.75) / 2, 0.9, fz, { cast: false }); box(ROOM.x - 0.75, 0.06, WALL_T + 0.12, MAT.trim, (ROOM.x + 0.75) / 2, 0.9, fz, { cast: false });
    for (var m = -ROOM.x + 3; m < ROOM.x; m += 3) if (Math.abs(m) > 1.2) box(0.1, 2.0, WALL_T + 0.04, MAT.plastic, m, 1.9, fz);
    box(ROOM.x * 2, 0.1, WALL_T + 0.04, MAT.plastic, 0, 2.92, fz);
    box(0.12, ROOM.h, WALL_T + 0.06, MAT.plastic, -0.8, ROOM.h / 2, fz); box(0.12, ROOM.h, WALL_T + 0.06, MAT.plastic, 0.8, ROOM.h / 2, fz); box(1.72, 0.12, WALL_T + 0.06, MAT.plastic, 0, 2.34, fz);
    var doorG = new THREE.Group(); doorG.position.set(-0.7, 0, ROOM.z); world.group.add(doorG); world.frontDoor = { g: doorG, t: 0 };
    var doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(1.36, 2.22, 0.04), MAT.glass); doorLeaf.position.set(0.68, 1.12, 0); doorG.add(doorLeaf);
    var dRail = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.07), MAT.plastic); dRail.position.set(0.68, 2.2, 0); doorG.add(dRail); var dRail2 = dRail.clone(); dRail2.position.y = 0.32; dRail2.scale.y = 3; doorG.add(dRail2);
    var dRailL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 2.22, 0.07), MAT.plastic); dRailL.position.set(0.035, 1.12, 0); doorG.add(dRailL); var dRailR = dRailL.clone(); dRailR.position.x = 1.325; doorG.add(dRailR);
    [0.05, -0.05].forEach(function (dz) { var doorBar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.7, 10), MAT.chrome); doorBar.position.set(1.15, 1.05, dz * 1.4); doorG.add(doorBar); [0.3, -0.3].forEach(function (dy) { var st = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.07, 8), MAT.chrome); st.rotation.x = Math.PI / 2; st.position.set(1.15, 1.05 + dy, dz * 0.7); doorG.add(st); }); });
    var pushSign = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.12), new THREE.MeshBasicMaterial({ map: textTex(['PULL'], 170, 60, { size: 40, bold: true, bg: 'rgba(0,0,0,0)', color: '#e8f1ea', line: 'rgba(0,0,0,0)' }), transparent: true })); pushSign.position.set(0.68, 1.6, 0.022); doorG.add(pushSign);
    var hours = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), new THREE.MeshBasicMaterial({ map: textTex(['HOURS', 'open late', 'ID required'], 250, 150, { size: 30, bg: 'rgba(0,0,0,.35)', color: '#e8f1ea', titleColor: '#6fdc8c', line: 'rgba(255,255,255,.4)' }), transparent: true })); hours.position.set(0.68, 0.75, 0.022); doorG.add(hours);
    var doorHit = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.3, 0.3), MAT.none); doorHit.position.set(0.68, 1.15, 0); doorG.add(doorHit); interactable(doorHit, { kind: 'frontdoor' });
    signPlane(['HAVE YOUR ID READY', 'security check at the door'], 1.6, 0.5, 2.6, 2.4, ROOM.z - 0.02, Math.PI, { titleColor: '#ffc857' });
    // interior walls
    wallZ(-2, -ROOM.x, ROOM.x, [[-7.1, -5.9], [5.9, 7.1]]);                       // back rooms | middle band
    doorFrame(-6.5, -2, true); doorFrame(6.5, -2, true);
    wallX(-1, -ROOM.z, -2, [[-6.1, -4.9]]); doorFrame(-1, -5.5, false);             // grow | dry
    wallX(-4, -2, 4, [[0.4, 1.6]]); doorFrame(-4, 1.0, false);                       // office | hall
    wallX(4, -2, 4, [[0.4, 1.6]]); doorFrame(4, 1.0, false);                         // hall | processing
    // staff wall with the service window and a staff door; the lobby face is painted the accent green
    wallZ(4, -ROOM.x, ROOM.x, [[-1.3, 1.3, 1.05, 2.3], [9.4, 10.6]]); doorFrame(10.0, 4, true);
    // accent paint on the lobby face, cut around the service window and the staff door
    var az = 4 + WALL_T / 2 + 0.006, ay1 = 0.13, ay2 = ROOM.h - 0.08;
    [[-ROOM.x, -1.3, ay1, ay2], [-1.3, 1.3, ay1, 1.05], [-1.3, 1.3, 2.3, ay2], [1.3, 9.4, ay1, ay2], [9.4, 10.6, 2.36, ay2], [10.6, ROOM.x, ay1, ay2]].forEach(function (a) { box(a[1] - a[0], a[3] - a[2], 0.01, MAT.accent, (a[0] + a[1]) / 2, (a[2] + a[3]) / 2, az, { cast: false }); });
    var swGlass = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.0), MAT.glass); swGlass.position.set(0, 1.8, 4); world.group.add(swGlass); // glass above the hand-off slot
    box(2.8, 0.08, WALL_T + 0.06, MAT.chrome, 0, 2.34, 4); box(0.08, 1.35, WALL_T + 0.06, MAT.chrome, -1.34, 1.675, 4); box(0.08, 1.35, WALL_T + 0.06, MAT.chrome, 1.34, 1.675, 4);
    box(2.6, 0.05, 0.9, MAT.counterTop, 0, 1.04, 4, { cast: false });                 // pass-through tray
    box(2.6, 0.03, 0.04, MAT.chrome, 0, 1.075, 4.44, { cast: false }); box(2.6, 0.03, 0.04, MAT.chrome, 0, 1.075, 3.56, { cast: false });
    // speaker grille + slot label
    // talk-through disc set into the glass, bottom centre just above the tray, holes on both faces
    var grille = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.024, 24), colorMat(0xc8ccd0, 0.35, 0.5)); grille.rotation.x = Math.PI / 2; grille.position.set(0, 1.5, 4); world.group.add(grille);
    [-1, 1].forEach(function (side) { for (var gh = 0; gh < 12; gh++) { var hole = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.01, 6), MAT.black); hole.rotation.x = Math.PI / 2; var ga = gh / 12 * Math.PI * 2; hole.position.set(Math.cos(ga) * 0.06, 1.5 + Math.sin(ga) * 0.06, 4 + side * 0.014); world.group.add(hole); } var dot = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.01, 8), MAT.black); dot.rotation.x = Math.PI / 2; dot.position.set(0, 1.5, 4 + side * 0.014); world.group.add(dot); });
    signPlane(['SERVICE WINDOW', 'orders handed through the slot'], 1.6, 0.5, 0, 2.7, 3.88, Math.PI, { titleColor: '#6fdc8c' });
    signPlane(['ORDER HERE', 'pick-up through the slot'], 1.6, 0.5, 0, 2.7, 4.12, 0, { titleColor: '#6fdc8c' });
    // room name plates above doorways
    signPlane(['GROW ROOM'], 1.2, 0.34, -6.5, 2.75, -1.88, 0, { titleColor: '#6fdc8c', bold: true });
    signPlane(['DRY & CURE'], 1.2, 0.34, 6.5, 2.75, -1.88, 0, { titleColor: '#6fdc8c', bold: true });
    signPlane(['OFFICE · SUPPLIES'], 1.4, 0.34, -3.88, 2.75, 1.0, Math.PI / 2, { titleColor: '#ffc857', bold: true });
    signPlane(['PROCESSING'], 1.2, 0.34, 3.88, 2.75, 1.0, -Math.PI / 2, { titleColor: '#ffc857', bold: true });
    signPlane(['STAFF ONLY'], 1.0, 0.3, 10.0, 2.75, 4.12, 0, { titleColor: '#ff6b6b', bold: true });
    // lights per room: troffers in the work rooms, pendants in the hall and lobby
    roomLamp(-6.5, -3.2, 0.4); roomLamp(-9.5, -7.5, 0.3); roomLamp(3.5, -5.5, 0.5); roomLamp(8.5, -5.5, 0.5); roomLamp(-8, 1, 0.5); roomLamp(8, 1, 0.5);
    pendant(-1.5, 1.0, 0.9, 0x2a2d33, 0.45); pendant(1.5, 1.0, 0.9, 0x2a2d33, 0.45);
    pendant(-6, 6.5, 0.8, 0x3aa36a, 0.45); pendant(0, 6.5, 0.8, 0x3aa36a, 0.55); pendant(6, 6.5, 0.8, 0x3aa36a, 0.45); roomLamp(-9.5, 5.5, 0.45); roomLamp(9.5, 5.5, 0.45); roomLamp(-3, 8.2, 0.35); roomLamp(3, 8.2, 0.35);
    ceilingVent(-3, -7.5); ceilingVent(9.5, 2.5); ceilingVent(-9, 7); ceilingVent(9, 7); ceilingVent(0, -0.5);
    // rugs
    var rugM = new THREE.MeshStandardMaterial({ map: TEX.fabric, color: 0x5b3b2a, roughness: 1 }); box(2.4, 0.02, 1.4, rugM, 0, 0.01, 8.0, { cast: false }); box(2.2, 0.005, 1.2, new THREE.MeshStandardMaterial({ map: TEX.fabric, color: 0x8a5a3a, roughness: 1 }), 0, 0.022, 8.0, { cast: false });
    box(3.2, 0.02, 2.0, new THREE.MeshStandardMaterial({ map: TEX.fabric, color: 0x3a5a3a, roughness: 1 }), 0, 0.01, -0.4, { cast: false }); box(3.0, 0.005, 1.8, new THREE.MeshStandardMaterial({ map: TEX.fabric, color: 0x4f7a4a, roughness: 1 }), 0, 0.022, -0.4, { cast: false });
    buildExterior(); buildLobby(); buildStaticFixtures();
  }
  function buildExterior() {
    // brick skin round the ground floor and the upper floor sides, a dark fascia between floors, parapet on the roof
    var top = UP.y + UP.h + 0.35, sx = ROOM.x + WALL_T + 0.04, sz = ROOM.z + WALL_T + 0.04;
    // ground floor and upper floor are skinned separately so window holes never overlap in z
    skinX(-sx, -sz, sz, 0, UP.y - 0.2, [[-8.0, -5.0, 0.9, 2.4], [1.9, 3.4, 0.9, 2.4]]);
    skinX(-sx, -sz, sz, UP.y - 0.2, top, [[-7.5, -4.5, UP.y + 1.0, UP.y + 2.4], [2.0, 5.0, UP.y + 1.0, UP.y + 2.4]]);
    skinX(sx, -sz, sz, 0, UP.y - 0.2, []);
    skinX(sx, -sz, sz, UP.y - 0.2, top, [[-6.5, -3.5, UP.y + 1.0, UP.y + 2.4]]);
    box(2.35 + sx, top, 0.08, MAT.brick, (2.35 - sx) / 2, top / 2, -sz, { cast: true }); box(sx - 3.65, top, 0.08, MAT.brick, (3.65 + sx) / 2, top / 2, -sz, { cast: true }); box(1.3, top - 2.3, 0.08, MAT.brick, 3.0, (top + 2.3) / 2, -sz, { cast: true });   // back skin, cut round the annex door
    // upstairs side windows (outside glass + inside trim) so the brick holes read as windows
    [[-sx, -6.0, 3.0], [-sx, 3.5, 3.0], [sx, -5.0, 3.0]].forEach(function (w) { var g = new THREE.Mesh(new THREE.PlaneGeometry(w[2], 1.4), MAT.glass); g.rotation.y = Math.PI / 2; g.position.set(w[0] + (w[0] < 0 ? 0.03 : -0.03), UP.y + 1.7, w[1]); world.group.add(g); });
    // front: brick pilasters, a fascia band with the shop sign, awning over the door
    [-sx, sx].forEach(function (x) { box(0.5, ROOM.h + 0.2, 0.5, MAT.brick, x + (x < 0 ? 0.2 : -0.2), (ROOM.h + 0.2) / 2, sz + 0.1, { cast: true }); });   /* one brick everywhere on this building */
    box(sx * 2 + 0.6, 0.7, 0.3, MAT.brick, 0, ROOM.h + 0.2, sz + 0.05, { cast: true });
    var fascia = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 0.6), new THREE.MeshBasicMaterial({ map: textTex(['GROW CO.'], 1400, 190, { size: 120, bold: true, bg: '#101812', titleColor: '#6fdc8c', line: 'rgba(111,220,140,.8)' }) })); fascia.position.set(0, ROOM.h + 0.2, sz + 0.21); world.group.add(fascia);
    var fl = new THREE.PointLight(0x6fdc8c, 0.6, 6); fl.position.set(0, ROOM.h + 0.3, sz + 1.0); scene.add(fl); world.streetLights = world.streetLights || []; world.streetLights.push(fl);
    var awnTex = makeTex(128, 128, function (ctx, w, h) { for (var i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#2f6b45' : '#e8ecd8'; ctx.fillRect(i * 16, 0, 16, h); } }, [4, 1]);
    var canvasM = new THREE.MeshStandardMaterial({ map: awnTex, roughness: 0.95, side: THREE.DoubleSide });
    function awning(ax, aw) {   /* a striped awning over one bay: cloth, valance, two rods and two braces */
      var awn = new THREE.Group(); awn.position.set(ax, 2.55, sz); world.group.add(awn);
      var cloth = new THREE.Mesh(new THREE.PlaneGeometry(aw, 1.4), canvasM); cloth.rotation.x = -Math.PI / 2 + 0.35; cloth.position.set(0, 0, 0.66); cloth.castShadow = true; awn.add(cloth);
      var valance = new THREE.Mesh(new THREE.PlaneGeometry(aw, 0.22), canvasM); valance.position.set(0, -0.53, 1.31); awn.add(valance);
      [-aw / 2 + 0.1, aw / 2 - 0.1].forEach(function (x) { var rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.45, 8), MAT.plastic); rod.rotation.x = -Math.PI / 2 + 0.35; rod.position.set(x, 0, 0.66); awn.add(rod); var brace = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.1, 8), MAT.plastic); brace.rotation.x = 0.55; brace.position.set(x, -0.4, 0.55); awn.add(brace); });
    }
    awning(0, 3.4); awning(-7.6, 3.2); awning(7.6, 3.2);   /* the door and both window bays */
    // planters flanking the door, a bike rack, a chalkboard sign
    [-2.6, 2.6].forEach(function (x) { var pl = box(0.7, 0.55, 0.5, MAT.brickDark, x, 0.275, sz + 0.45, { solid: true, tag: 'planter' }); box(0.62, 0.04, 0.42, MAT.soil, x, 0.53, sz + 0.45, { cast: false }); for (var k = 0; k < 5; k++) { var lf = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.6), MAT.leaf); lf.position.set(x + randf(-0.2, 0.2), 0.8, sz + 0.45 + randf(-0.12, 0.12)); lf.rotation.set(-0.4 - Math.random() * 0.4, Math.random() * 6.28, 0); world.group.add(lf); } });
    var cb = new THREE.Group(); cb.position.set(4.2, 0, sz + 0.8); cb.rotation.y = -0.4; world.group.add(cb);
    var board = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.8), new THREE.MeshBasicMaterial({ map: textTex(['TODAY', 'fresh cure in', 'ask about', 'the top shelf'], 240, 320, { size: 34, bg: '#1d1f1c', color: '#f0ead8', titleColor: '#ffc857', line: 'rgba(0,0,0,0)' }) })); board.position.set(0, 0.55, 0.02); board.rotation.x = -0.2; cb.add(board);
    var bf = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.86, 0.03), MAT.wood); bf.position.set(0, 0.55, 0); bf.rotation.x = -0.2; cb.add(bf); var bb = bf.clone(); bb.rotation.x = 0.2; bb.position.z = -0.14; cb.add(bb);
    world.obstacles.push({ x1: 3.8, x2: 4.6, z1: sz + 0.4, z2: sz + 1.2, tag: 'chalk' });
    // ── the front, dressed: brick pilasters between the bays, a brick fascia with four downlights, window boxes, a doormat ──
    [-9.4, -5.8, -2.2, 2.2, 5.8, 9.4].forEach(function (x) { box(0.36, ROOM.h + 0.2, 0.3, MAT.brick, x, (ROOM.h + 0.2) / 2, sz + 0.1, { cast: true }); box(0.44, 0.06, 0.38, MAT.trim, x, ROOM.h + 0.23, sz + 0.1, { cast: false }); });
    box(sx * 2 + 0.7, 0.08, 0.42, MAT.trim, 0, ROOM.h + 0.59, sz + 0.05, { cast: true });   /* a stone string course on top of the fascia band */
    [-6.2, -2.4, 2.4, 6.2].forEach(function (x) { var arm = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.5, 8), MAT.black); arm.rotation.x = -1.1; arm.position.set(x, ROOM.h + 0.7, sz + 0.38); world.group.add(arm); var hood = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.16, 12, 1, true), new THREE.MeshStandardMaterial({ color: 0x1b1e22, roughness: 0.5, metalness: 0.5, side: THREE.DoubleSide })); hood.rotation.x = 0.5; hood.position.set(x, ROOM.h + 0.6, sz + 0.62); world.group.add(hood); var lens = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), glowMat(0xfff0d0, 1.4)); lens.position.set(x, ROOM.h + 0.55, sz + 0.62); world.group.add(lens); (world.lampFixtures = world.lampFixtures || []).push(lens); });
    [-3.2, 3.2].forEach(function (x) { var dl = new THREE.PointLight(0xfff0d0, 0.5, 5, 1.6); dl.position.set(x, ROOM.h + 0.4, sz + 0.8); scene.add(dl); (world.streetLights = world.streetLights || []).push(dl); });
    [-10.3, -7.6, -4.9].forEach(function (x) { box(2.2, 0.24, 0.3, MAT.darkwood, x, 0.98, sz + 0.2, { cast: true }); box(2.1, 0.04, 0.24, MAT.soil, x, 1.11, sz + 0.2, { cast: false }); for (var f = 0; f < 7; f++) plantFlower(x + randf(-0.95, 0.95), 1.1, sz + 0.2 + randf(-0.08, 0.08)); });   /* window boxes under the shop window */
    box(1.5, 0.02, 0.7, new THREE.MeshStandardMaterial({ map: TEX.fabric, color: 0x3a3028, roughness: 1 }), 0, 0.011, sz + 0.55, { cast: false });   /* doormat */
    box(1.6, 0.9, 1.2, colorMat(0x9aa0a6, 0.5, 0.4), 6.5, ROOF_Y + 0.45, -5.0, { cast: true }); cyl(0.5, 0.5, 0.04, MAT.black, 6.5, ROOF_Y + 0.92, -5.0, null, 20); box(0.08, 0.6, 0.08, MAT.plastic, 5.6, ROOF_Y + 0.3, -5.0);   /* an air-conditioning unit on the roof, with its pipe */
  }
  // security room beside the annex (x 8..12, z -12.5..-9): a desk, a chair and six monitors fed by the wall cameras
  var SEC = { x1: 8.12, x2: 17, z1: -12.5, z2: -ROOM.z };
  function buildSecurityRoom(x1, z1, z2, h) {
    var x2 = SEC.x2, wallM = MAT.wall; SEC.x1 = x1;
    if (x2 > ROOM.x + 0.3) { box(x2 - ROOM.x, h, WALL_T, wallM, (ROOM.x + x2) / 2 + WALL_T / 2, h / 2, z2 - WALL_T / 2, { solid: true, tag: 'wall' }); box(x2 - ROOM.x + 0.3, h + 0.3, 0.08, MAT.brick, (ROOM.x + x2) / 2 + 0.15, (h + 0.3) / 2, z2 + 0.04, { cast: true }); }   /* the stretch past the main building needs its own north wall */
    floorPlane(new THREE.MeshStandardMaterial({ map: TEX.concrete, color: 0x9a9da3, roughness: 0.9 }), x1, x2, z1, z2, 2.2);
    box(WALL_T, h, z2 - z1, wallM, x2 + WALL_T / 2, h / 2, (z1 + z2) / 2, { solid: true, tag: 'wall' });
    box(x2 - x1 + WALL_T, h, WALL_T, wallM, (x1 + x2) / 2, h / 2, z1 - WALL_T / 2, { solid: true, tag: 'wall' });
    box(x2 - x1 + WALL_T * 2, 0.3, z2 - z1 + WALL_T * 2, new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 1 }), (x1 + x2) / 2, h + 0.15, (z1 + z2) / 2, { cast: true });
    var ceil = new THREE.Mesh(new THREE.PlaneGeometry(x2 - x1, z2 - z1), MAT.ceiling); ceil.rotation.x = Math.PI / 2; ceil.position.set((x1 + x2) / 2, h - 0.01, (z1 + z2) / 2); world.group.add(ceil);
    box(0.08, h + 0.3, z2 - z1 + 0.2, MAT.brick, x2 + WALL_T + 0.04, (h + 0.3) / 2, (z1 + z2) / 2 - 0.05, { cast: true }); box(x2 - x1 + 0.3, h + 0.3, 0.08, MAT.brick, (x1 + x2) / 2, (h + 0.3) / 2, z1 - WALL_T - 0.04, { cast: true });
    trimX(z1, z2, x2 + WALL_T / 2); trimZ(x1, x2, z1 - WALL_T / 2);
    box(x2 - x1, h, 0.05, wallM, (x1 + x2) / 2, h / 2, z2 - 0.315, { cast: false }); trimZ(x1, x2, z2 - 0.315);   // plaster face over the main building's rear brick skin on this room's north side
    var lamp = new THREE.PointLight(0xdfe8ff, 0.45, 9, 1.6); lamp.position.set((x1 + x2) / 2, h - 0.3, (z1 + z2) / 2); scene.add(lamp); world.roomLamps.push(lamp); lamp.userData.base = 0.45;
    box(1.0, 0.05, 0.5, MAT.trim, (x1 + x2) / 2, h - 0.025, (z1 + z2) / 2, { cast: false }); var fx = box(0.9, 0.02, 0.4, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xdfe8ff, emissiveIntensity: 0.9, roughness: 0.3 }), (x1 + x2) / 2, h - 0.045, (z1 + z2) / 2, { cast: false }); (world.lampFixtures = world.lampFixtures || []).push(fx);
    // desk along the back wall, chair in front of it facing the monitors
    var cx = (x1 + x2) / 2, dz = z1 + 0.5;
    box(3.8, 0.05, 0.8, MAT.darkwood, cx, 0.75, dz, { solid: true, tag: 'secdesk' }); [[cx - 1.8, dz - 0.3], [cx + 1.8, dz - 0.3], [cx - 1.8, dz + 0.3], [cx + 1.8, dz + 0.3]].forEach(function (l) { box(0.05, 0.73, 0.05, MAT.metal, l[0], 0.365, l[1]); });
    // the recorder hangs on the wall above the desk's right end, blinking; the desk itself is a guard's desk: notes, papers, a walkie-talkie on its charger, a key rack and a mug
    box(0.5, 0.35, 0.16, MAT.black, cx + 2.3, 1.45, wallZ0 + 0.08); box(0.02, 0.01, 0.04, glowMat(0x6fdc8c, 1.2), cx + 2.08, 1.53, wallZ0 + 0.165, { cast: false }); box(0.18, 0.012, 0.04, colorMat(0xd0d3d8, 0.5), cx + 2.35, 1.53, wallZ0 + 0.165, { cast: false }); for (var rl = 0; rl < 5; rl++) box(0.006, 0.006, 0.01, glowMat(rl < 4 ? 0x6fdc8c : 0xff3030, 1.5), cx + 2.17 + rl * 0.04, 1.38, wallZ0 + 0.165, { cast: false });
    var paperM = new THREE.MeshStandardMaterial({ color: 0xf3efe4, roughness: 0.9 }); [[cx - 0.35, dz + 0.1, 0.12], [cx - 0.3, dz + 0.16, -0.2], [cx - 0.42, dz + 0.05, 0.35]].forEach(function (p, i) { var sheet = box(0.21, 0.004, 0.29, paperM, p[0], 0.78 + i * 0.004, p[1], { cast: false }); sheet.rotation.y = p[2]; });
    var noteTex = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.28), new THREE.MeshBasicMaterial({ map: textTex(['INCIDENT LOG', 'night 3: nothing', 'night 4: van at 02:10', 'night 5: nothing', 'check yard gate!'], 200, 280, { size: 20, bg: '#f3efe4', color: '#333', titleColor: '#1a1a1a', line: 'rgba(0,0,0,0)' }) })); noteTex.rotation.x = -Math.PI / 2; noteTex.rotation.z = -0.12; noteTex.position.set(cx - 0.35, 0.796, dz + 0.1); world.group.add(noteTex);
    var pad = box(0.16, 0.012, 0.2, colorMat(0xffe88a, 0.9), cx + 0.35, 0.782, dz + 0.24, { cast: false }); pad.rotation.y = -0.2; var pen = cyl(0.005, 0.005, 0.14, colorMat(0x2b2f35, 0.4, 0.4), cx + 0.5, 0.79, dz + 0.2, null, 6); pen.rotation.z = Math.PI / 2; pen.rotation.y = 0.5;
    var wtBase = box(0.09, 0.03, 0.07, MAT.black, cx - 0.85, 0.79, dz - 0.05, { cast: false }); var wt = box(0.06, 0.16, 0.035, colorMat(0x1b1f24, 0.5, 0.3), cx - 0.85, 0.885, dz - 0.05); cyl(0.004, 0.004, 0.12, MAT.black, cx - 0.87, 1.02, dz - 0.05, null, 6); box(0.04, 0.02, 0.01, glowMat(0x6fdc8c, 1), cx - 0.85, 0.95, dz - 0.03, { cast: false }); box(0.01, 0.006, 0.006, glowMat(0xff3030, 2), cx - 0.81, 0.785, dz - 0.015, { cast: false });   // walkie-talkie on its charger
    var rack = box(0.3, 0.12, 0.02, MAT.darkwood, cx + 3.0, 1.45, wallZ0 + 0.06); [0, 1, 2, 3].forEach(function (k) { var hook = cyl(0.004, 0.004, 0.03, MAT.chrome, cx + 2.89 + k * 0.075, 1.42, wallZ0 + 0.085, null, 6); hook.rotation.x = Math.PI / 2; if (k !== 2) { var ring = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.003, 6, 12), MAT.chrome); ring.position.set(cx + 2.89 + k * 0.075, 1.395, wallZ0 + 0.095); world.group.add(ring); box(0.012, 0.03, 0.003, colorMat([0xc94a3a, 0x2f6b9a, 0xffc857][k % 3], 0.5), cx + 2.89 + k * 0.075, 1.365, wallZ0 + 0.096, { cast: false }); } });   // key rack: a hook per set, one set out
    signPlane(['KEYS', 'sign them out'], 0.28, 0.08, cx + 3.0, 1.55, wallZ0 + 0.07, 0, { size: 16, titleColor: '#ffc857', bg: '#141a16' });
    var mug = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.09, 14), colorMat(0x2f6b9a, 0.5)); mug.position.set(cx + 1.55, 0.82, dz + 0.18); world.group.add(mug);
    var clip = box(0.23, 0.01, 0.32, colorMat(0x5a4632, 0.7), cx - 1.3, 0.78, dz + 0.05, { cast: false }); clip.rotation.y = 0.08; box(0.06, 0.02, 0.03, MAT.chrome, cx - 1.3, 0.795, dz - 0.09, { cast: false }); var clipTex = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.27), new THREE.MeshBasicMaterial({ map: textTex(['SHIFT SHEET', 'door  · 08-20', 'yard  · 20-02', 'cams  · 02-08', 'sign here ____'], 200, 270, { size: 20, bg: '#f3efe4', color: '#333', titleColor: '#1a1a1a', line: 'rgba(0,0,0,0)' }) })); clipTex.rotation.x = -Math.PI / 2; clipTex.rotation.z = 0.08; clipTex.position.set(cx - 1.3, 0.787, dz + 0.06); world.group.add(clipTex);   // clipboard
    var chair = new THREE.Group(); chair.position.set(cx, 0, dz + 0.85); world.group.add(chair); var cc = propCtx(chair, 'secchair', 0); officeChairBuild(cc);   // backrest sits at +z, so the chair faces the monitors on the back wall
    world.obstacles.push({ x1: cx - 0.3, x2: cx + 0.3, z1: dz + 0.55, z2: dz + 1.15, tag: 'secchair' });
    world.secSeat = { x: cx, z: dz + 0.9, yaw: 0 };
    // six monitors in a 3 x 2 grid on the back wall; each shows one camera feed
    var mw = 0.72, mh = 0.42, gapx = 0.08, gapy = 0.08, y0 = 1.16, wallZ0 = z1 + 0.05, mcols = 4;
    world.secMonitors = [];
    for (var i = 0; i < SEC_CAMS.length; i++) {
      var col = i % mcols, row = Math.floor(i / mcols); var mx = cx + (col - (mcols - 1) / 2) * (mw + gapx), my = y0 + (2 - row) * (mh + gapy);
      box(mw + 0.06, mh + 0.06, 0.05, MAT.black, mx, my, wallZ0 + 0.025); var mat = new THREE.MeshBasicMaterial({ color: 0x0a0c10 }); var scr = new THREE.Mesh(new THREE.PlaneGeometry(mw, mh), mat); scr.position.set(mx, my, wallZ0 + 0.052); world.group.add(scr);
      var tag = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.05), new THREE.MeshBasicMaterial({ map: textTex(['CAM ' + (i + 1) + '  ' + SEC_CAMS[i].name], 200, 34, { size: 20, bg: '#101214', color: '#dfe8ff', titleColor: '#dfe8ff', line: 'rgba(0,0,0,0)' }), transparent: true })); tag.position.set(mx - mw / 2 + 0.17, my - mh / 2 - 0.045, wallZ0 + 0.052); world.group.add(tag);
      world.secMonitors.push({ mat: mat, mesh: scr });
    }
    var mon = box(3.4, 1.6, 0.28, MAT.none, cx, y0 + 0.5, wallZ0 + 0.14, { cast: false, receive: false }); interactable(mon, { kind: 'secdesk' });   /* the wall of feeds: shallow, so the desk screen in front of it can be aimed at */
    buildSecScreen(x1 + 1.5, 1.75, wallZ0 + 0.035, 0);   /* on the camera wall, left of the feeds; the right wall is the control cabinet's */
    signPlane(['SECURITY', 'E at the monitors: watch the cameras'], 1.5, 0.4, cx, 2.85, wallZ0 + 0.01, 0, { titleColor: '#ffc857', bg: '#101410' });
    signPlane(['CCTV IN OPERATION', 'you are being recorded'], 0.9, 0.36, x1 - WALL_T - 0.012, 2.05, -10.7 + 1.0, -Math.PI / 2, { titleColor: '#c94a3a', bg: '#f3e9cf', color: '#222' });
    buildSecCams();
  }
  // wall cameras: each one is a small housing on the wall and a render camera the monitors and the cam view draw from
  var SEC_CAMS = [
    { name: 'LOBBY',    pos: [-ROOM.x + 0.3, 3.0, 8.4],          look: [2, 1.0, 5.5] },
    { name: 'COUNTER',  pos: [3.6, 3.0, 3.6],                   look: [-1.4, 1.0, 5.5] },
    { name: 'GROW',     pos: [-ROOM.x + 0.3, 3.0, -ROOM.z + 0.4], look: [-4, 0.8, -4.5] },
    { name: 'PROCESS',  pos: [ROOM.x - 0.3, 3.0, -1.6],          look: [7, 0.9, 1.5] },
    { name: 'BACK ROOM', pos: [7.7, 2.7, -9.3],                  look: [2.5, 0.7, -11.8] },
    { name: 'YARD',     pos: [9.7, 3.1, -12.85],                 look: [3.5, 0.5, -16.5] },
    { name: 'OFFICE',   pos: [-4.3, 3.0, 3.7],                   look: [-10.5, 0.6, 1.5] },
    { name: 'HALL',     pos: [3.7, 3.0, -1.7],                   look: [-2, 0.8, 2.5] },
    { name: 'DRY ROOM', pos: [ROOM.x - 0.3, 3.0, -ROOM.z + 0.4], look: [5, 0.8, -5] },
    { name: 'STREET',   pos: [0, 3.3, ROOM.z + 0.5],             look: [0, 0.4, 17] },
    { name: 'BASEMENT', pos: [8.6, -3.1, -6.6],                  look: [0, -5.2, -1] },
    { name: 'LOUNGE',   pos: [ROOM.x - 0.4, 6.5, -8.5],          look: [7, 4.5, -2] }
  ];
  var sec = { cams: [], rts: [], next: 0, lastT: 0, view: { on: false, idx: 0 }, hud: null };
  function buildSecCams() {
    SEC_CAMS.forEach(function (c, i) {
      var cam = new THREE.PerspectiveCamera(70, 16 / 9, 0.1, 40); cam.position.set(c.pos[0], c.pos[1], c.pos[2]); cam.lookAt(c.look[0], c.look[1], c.look[2]); scene.add(cam); sec.cams.push(cam);
      if (c.name === 'STREET' || c.name === 'YARD') cam.layers.enable(TOWN_LAYER); else cam.layers.disable(TOWN_LAYER);   /* the two outdoor cameras still show the town; the indoor ones skip it */
      var rt = new THREE.WebGLRenderTarget(320, 180); rt.texture.encoding = THREE.sRGBEncoding; sec.rts.push(rt);
      // housing: a dome bracket with a lens and a blinking red LED, mounted where the camera looks from
      var hg = new THREE.Group(); hg.position.copy(cam.position); hg.quaternion.copy(cam.quaternion); world.group.add(hg);
      var body = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.22), colorMat(0xe8e8e4, 0.5)); body.position.z = 0.02; hg.add(body);
      var lens = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.06, 12), MAT.black); lens.rotation.x = Math.PI / 2; lens.position.z = -0.11; hg.add(lens);
      var led = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), glowMat(0xff3a3a, 2)); led.position.set(0.035, 0.035, -0.08); hg.add(led); (world.secLeds = world.secLeds || []).push(led);
      var arm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.04), colorMat(0xe8e8e4, 0.5)); arm.position.set(0, 0.12, 0.08); hg.add(arm);
      var hit = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), MAT.none); hg.add(hit); interactable(hit, { kind: 'seccam', idx: i });
    });
  }
  function secCamName(i) { return 'CAM ' + (i + 1) + ' · ' + SEC_CAMS[i].name; }
  // the monitors only draw while somebody can see them (player in the security room) or in cam view; one feed per pass to keep it cheap
  function pipRender(rt, cam) {   /* a picture-in-picture pass never redraws the sun's shadow map: the main pass owns it, and only the main camera sees the town layer */
    var sm = renderer.shadowMap, nu = sm.needsUpdate; sm.needsUpdate = false;
    renderer.setRenderTarget(rt); renderer.render(scene, cam); renderer.setRenderTarget(null);
    sm.needsUpdate = nu;
  }
  function updateSecurity(dt) {
    if (!sec.cams.length) return; var t = now();
    if (world.secLeds) { var blink = Math.floor(t / 600) % 2 === 0; world.secLeds.forEach(function (l) { l.material.emissiveIntensity = blink ? 2 : 0.2; }); }
    var inRoom = player.floor === 0 && roomOf(player.pos.x, player.pos.z) === 'security';
    if (!inRoom || sec.view.on) return;   /* the monitors are only seen from the room, and the full-screen camera view is drawn by the main pass */
    if (t - sec.lastT < 120) return; sec.lastT = t;
    var i = sec.next; sec.next = (sec.next + 1) % sec.cams.length;
    pipRender(sec.rts[i], sec.cams[i]);
    var m = world.secMonitors && world.secMonitors[i]; if (m && m.mat.map !== sec.rts[i].texture) { m.mat.map = sec.rts[i].texture; m.mat.color.setHex(0xffffff); m.mat.needsUpdate = true; }
  }
  function secHud() { if (sec.hud) return sec.hud; var d = document.createElement('div'); d.id = 'g3-camview'; d.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:30;font-family:var(--mono);color:#dfe8ff;text-shadow:0 1px 2px #000'; d.innerHTML = '<div style="position:absolute;left:24px;top:22px;font-size:20px;font-weight:700"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#ff3a3a;margin-right:8px;animation:g3blink 1s steps(2) infinite"></span><span id="g3-cam-name"></span></div><div style="position:absolute;right:24px;top:22px;font-size:16px" id="g3-cam-time"></div><div style="position:absolute;left:24px;bottom:22px;font-size:14px;opacity:.85">1 to 6 or ← → switch camera · E or Esc back to the desk</div><div style="position:absolute;inset:0;border:2px solid rgba(223,232,255,.35);margin:12px;pointer-events:none"></div>'; var st = document.createElement('style'); st.textContent = '@keyframes g3blink{50%{opacity:.15}}'; d.appendChild(st); document.body.appendChild(d); sec.hud = d; return d; }
  function camEnter() { if (!sit.on || sit.spot !== world.secSeat) sitDown(world.secSeat); sec.view.on = true; sec.lastT = 0; secHud().hidden = false; camShow(sec.view.idx); sfx('panel'); toast('📹 Watching the cameras. A and D or the arrows step through all ' + sec.cams.length + ', 1 to 6 jumps to one, E leaves.', ''); }
  function camShow(i) { sec.view.idx = ((i % sec.cams.length) + sec.cams.length) % sec.cams.length; var h = secHud(); $('g3-cam-name').textContent = secCamName(sec.view.idx); sfx('click'); }
  function camExit() { if (!sec.view.on) return; sec.view.on = false; if (sec.hud) sec.hud.hidden = true; sfx('close'); }
  hooks.unlock.push(function () { if (sec.view.on) { camExit(); lockPointer(); return true; } return false; });

  // storage annex behind the dry room (x 0..8, z -12.5..-9) with a roller door onto a fenced yard where the van and courier come in
  function buildAnnex() {
    var AX1 = 0, AX2 = 8, AZ1 = -12.5, AZ2 = -ROOM.z, AH = 3.0, wallM = MAT.wall;
    floorPlane(MAT.floor, AX1, AX2, AZ1, AZ2, 2.2);
    box(WALL_T, AH, AZ2 - AZ1, wallM, AX1 - WALL_T / 2, AH / 2, (AZ1 + AZ2) / 2, { solid: true, tag: 'wall' });
    box(WALL_T, AH, 1.2, wallM, AX2 + WALL_T / 2, AH / 2, AZ1 + 0.6, { solid: true, tag: 'wall' }); box(WALL_T, AH, 1.1, wallM, AX2 + WALL_T / 2, AH / 2, AZ2 - 0.55, { solid: true, tag: 'wall' }); box(WALL_T, AH - 2.3, 1.2, wallM, AX2 + WALL_T / 2, 2.3 + (AH - 2.3) / 2, -10.7, { cast: true }); doorFrame(AX2 + WALL_T / 2, -10.7, false);   // doorway at z -10.7 into the security room
    buildSecurityRoom(AX2 + WALL_T, AZ1, AZ2, AH);
    box(3.0, AH, WALL_T, wallM, 1.5, AH / 2, AZ1 - WALL_T / 2, { solid: true, tag: 'wall' }); box(2.0, AH, WALL_T, wallM, 7.0, AH / 2, AZ1 - WALL_T / 2, { solid: true, tag: 'wall' }); box(3.0, AH - 2.4, WALL_T, wallM, 4.5, 2.4 + (AH - 2.4) / 2, AZ1 - WALL_T / 2);   // back wall with the roller opening
    box(AX2 - AX1 + WALL_T * 2, 0.3, AZ2 - AZ1 + WALL_T * 2, new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 1 }), (AX1 + AX2) / 2, AH + 0.15, (AZ1 + AZ2) / 2, { cast: true });
    var ceil = new THREE.Mesh(new THREE.PlaneGeometry(AX2 - AX1, AZ2 - AZ1), MAT.ceiling); ceil.rotation.x = Math.PI / 2; ceil.position.set((AX1 + AX2) / 2, AH - 0.01, (AZ1 + AZ2) / 2); world.group.add(ceil);
    // brick skin outside the annex
    [[AX1 - WALL_T - 0.04, 1]].forEach(function (s) { box(0.08, AH + 0.3, AZ2 - AZ1 + 0.2, MAT.brick, s[0], (AH + 0.3) / 2, (AZ1 + AZ2) / 2 - 0.05, { cast: true }); });
    box(AX2 - AX1 + 0.5, AH + 0.3, 0.08, MAT.brick, 1.5 - 0.1, (AH + 0.3) / 2, AZ1 - WALL_T - 0.04, { cast: true }).scale.x = 3.2 / (AX2 - AX1 + 0.5); box(2.2, AH + 0.3, 0.08, MAT.brick, 7.0, (AH + 0.3) / 2, AZ1 - WALL_T - 0.04, { cast: true }); box(3.0, AH - 2.4 + 0.3, 0.08, MAT.brick, 4.5, 2.4 + (AH - 2.4 + 0.3) / 2, AZ1 - WALL_T - 0.04, { cast: true });
    var lamp = new THREE.PointLight(0xfff3e0, 0.6, 12, 1.6); lamp.position.set(4, AH - 0.3, -10.7); scene.add(lamp); world.roomLamps.push(lamp); lamp.userData.base = 0.6;
    box(1.2, 0.05, 0.6, MAT.trim, 4, AH - 0.025, -10.7, { cast: false }); box(1.1, 0.02, 0.5, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff3e0, emissiveIntensity: 0.9, roughness: 0.3 }), 4, AH - 0.045, -10.7, { cast: false });
    // roller door: slatted panel that slides up; obstacle while closed
    var rd = new THREE.Group(); rd.position.set(4.5, 1.2, AZ1); world.group.add(rd); world.rollerDoor = rd;
    var rdM = colorMat(0x8a8f96, 0.4, 0.7); for (var s = 0; s < 12; s++) { var slat = new THREE.Mesh(new THREE.BoxGeometry(2.96, 0.19, 0.06), rdM); slat.position.y = -1.1 + s * 0.2; slat.castShadow = true; rd.add(slat); }
    var rdHit = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.4, 0.3), MAT.none); rdHit.position.y = 0; rd.add(rdHit); interactable(rdHit, { kind: 'roller' });
    [3.0, 6.0].forEach(function (x) { box(0.08, 2.5, 0.12, colorMat(0x2a2d33, 0.5, 0.6), x, 1.25, AZ1); }); box(3.2, 0.12, 0.2, colorMat(0x2a2d33, 0.5, 0.6), 4.5, 2.46, AZ1);
    rollerSet(false);
    signPlane(['DELIVERIES', 'ring · the back door'], 1.4, 0.4, 4.5, 2.75, AZ1 - 0.16, Math.PI, { titleColor: '#ffc857', bg: '#101410' });
    // yard: concrete pad, chain-link fence with a swing gate on the far side
    var YX1 = -5.0, YX2 = 10.0, YZ1 = -22.5, YZ2 = AZ1; world.yardGateZ = YZ1;   /* 15 by 10 m; the garage takes the east side, the lane leaves at x 3 to 6 on the south side */
    floorPlane(MAT.asphalt, YX1, YX2, YZ1, YZ2, 3.0, 0.005);
    var fenceM = colorMat(0x6a6f76, 0.5, 0.7);
    function fenceRun(x1, z1, x2, z2) { var len = Math.hypot(x2 - x1, z2 - z1), cx = (x1 + x2) / 2, cz = (z1 + z2) / 2, ang = Math.atan2(x2 - x1, z2 - z1); var gr = new THREE.Group(); gr.position.set(cx, 0, cz); gr.rotation.y = ang; world.group.add(gr); [0.5, 1.75].forEach(function (y) { var r = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, len), fenceM); r.position.y = y; gr.add(r); }); var mesh = new THREE.Mesh(new THREE.PlaneGeometry(len, 1.8), new THREE.MeshStandardMaterial({ map: TEX.fabric, color: 0x9aa0a8, transparent: true, opacity: 0.35, side: THREE.DoubleSide, roughness: 1 })); mesh.rotation.y = Math.PI / 2; mesh.position.y = 1.0; gr.add(mesh); for (var p = 0; p <= len; p += 2.5) { var post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.0, 8), fenceM); post.position.set(0, 1.0, -len / 2 + Math.min(p, len)); gr.add(post); } world.obstacles.push({ x1: Math.min(x1, x2) - 0.1, x2: Math.max(x1, x2) + 0.1, z1: Math.min(z1, z2) - 0.1, z2: Math.max(z1, z2) + 0.1, tag: 'fence', floorLevel: 0 }); }
    fenceRun(YX1, YZ2, YX1, YZ1); fenceRun(YX2, YZ2, YX2, -14.0); fenceRun(YX1, YZ1, 3.0, YZ1); fenceRun(6.0, YZ1, YX2, YZ1);   /* the east run stops where the garage wall takes over */
    // ── the garage: its own brick building on the east side of the yard, roller door onto the yard, the car lives here ──
    (function () {
      var GX1 = YX2, GX2 = 15.5, GZ1 = YZ1, GZ2 = -14.0, GH = 3.2, T = 0.25, DZ = -18.25;
      floorPlane(MAT.floor, GX1 + 0.1, GX2 - 0.1, GZ1 + 0.1, GZ2 - 0.1, 2.0, 0.007);
      box(T, GH, DZ - 1.5 - GZ1, MAT.brick, GX1, GH / 2, (GZ1 + DZ - 1.5) / 2, { solid: true, tag: 'garage' });          /* west wall, south of the door */
      box(T, GH, GZ2 - (DZ + 1.5), MAT.brick, GX1, GH / 2, (DZ + 1.5 + GZ2) / 2, { solid: true, tag: 'garage' });         /* west wall, north of the door */
      box(T + 0.02, GH - 2.45, 3.0, MAT.brick, GX1, 2.45 + (GH - 2.45) / 2, DZ, { cast: true });                             /* lintel over the door */
      box(GX2 - GX1 + T, GH, T, MAT.brick, (GX1 + GX2) / 2, GH / 2, GZ1, { solid: true, tag: 'garage' });                  /* south */
      box(GX2 - GX1 + T, GH, T, MAT.brick, (GX1 + GX2) / 2, GH / 2, GZ2, { solid: true, tag: 'garage' });                  /* north */
      box(T, GH, GZ2 - GZ1 + T, MAT.brick, GX2, GH / 2, (GZ1 + GZ2) / 2, { solid: true, tag: 'garage' });                  /* east */
      box(GX2 - GX1 + T + 0.3, 0.25, GZ2 - GZ1 + T + 0.3, colorMat(0x3a3d42, 1), (GX1 + GX2) / 2, GH + 0.125, (GZ1 + GZ2) / 2, { cast: true });   /* roof slab */
      box(GX2 - GX1 + T + 0.3, 0.08, GZ2 - GZ1 + T + 0.3, MAT.trim, (GX1 + GX2) / 2, GH + 0.29, (GZ1 + GZ2) / 2, { cast: false });
      var gceil = new THREE.Mesh(new THREE.PlaneGeometry(GX2 - GX1, GZ2 - GZ1), MAT.ceiling); gceil.rotation.x = Math.PI / 2; gceil.position.set((GX1 + GX2) / 2, GH - 0.012, (GZ1 + GZ2) / 2); world.group.add(gceil);
      var gd = new THREE.Group(); gd.position.set(GX1, 1.2, DZ); gd.rotation.y = Math.PI / 2; world.group.add(gd); world.garageDoor = gd;   /* roller door hung in the west wall */
      var gdM = colorMat(0x8a8f96, 0.4, 0.7); for (var s = 0; s < 12; s++) { var slat = new THREE.Mesh(new THREE.BoxGeometry(2.96, 0.19, 0.06), gdM); slat.position.y = -1.1 + s * 0.2; slat.castShadow = true; gd.add(slat); }
      var gdHit = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.4, 0.5), MAT.none); gd.add(gdHit); interactable(gdHit, { kind: 'garage' });
      [DZ - 1.5, DZ + 1.5].forEach(function (z) { box(0.12, 2.5, 0.08, colorMat(0x2a2d33, 0.5, 0.6), GX1, 1.25, z); }); box(0.2, 0.12, 3.2, colorMat(0x2a2d33, 0.5, 0.6), GX1, 2.46, DZ);
      garageSet(false);
      signPlane(['GARAGE', 'owner only'], 1.2, 0.36, GX1 - 0.16, 2.8, DZ, -Math.PI / 2, { titleColor: '#ffc857', bg: '#101410' });
      var gl = new THREE.PointLight(0xfff0d0, 0.55, 9, 1.6); gl.position.set((GX1 + GX2) / 2, GH - 0.4, DZ); scene.add(gl); box(0.9, 0.05, 0.3, MAT.trim, (GX1 + GX2) / 2, GH - 0.03, DZ, { cast: false }); box(0.8, 0.02, 0.22, glowMat(0xfff3e0, 0.9), (GX1 + GX2) / 2, GH - 0.06, DZ, { cast: false });
      box(2.0, 1.2, 0.04, MAT.planks, (GX1 + GX2) / 2, 1.7, GZ2 - T / 2 - 0.03, { cast: false }); signPlane(['TOOLS', 'hang them back up'], 0.9, 0.3, (GX1 + GX2) / 2, 2.45, GZ2 - T / 2 - 0.06, Math.PI, { titleColor: '#ffc857', bg: 'rgba(0,0,0,0)' });
      [[-0.7, 0.35, 0.05, 0.55], [-0.3, 0.3, 0.05, 0.35], [0.2, 0.3, 0.04, 0.6], [0.6, 0.3, 0.05, 0.4]].forEach(function (t) { box(t[2], t[3], 0.04, MAT.metal, (GX1 + GX2) / 2 + t[0], 1.3 + t[1], GZ2 - T / 2 - 0.07, { cast: false }); });   /* tools on the board */
      box(1.6, 0.04, 0.4, MAT.planks, GX2 - 1.0, 1.1, GZ1 + 0.45, { cast: true }); box(1.6, 0.04, 0.4, MAT.planks, GX2 - 1.0, 0.5, GZ1 + 0.45, { cast: true }); box(0.4, 0.4, 0.34, MAT.wood, GX2 - 1.4, 1.32, GZ1 + 0.45); box(0.3, 0.3, 0.3, MAT.wood, GX2 - 0.7, 1.27, GZ1 + 0.45); box(0.44, 0.4, 0.34, MAT.wood, GX2 - 0.9, 0.72, GZ1 + 0.45);
      world.obstacles.push({ x1: GX2 - 1.9, x2: GX2 - 0.1, z1: GZ1 + 0.2, z2: GZ1 + 0.7, tag: 'garage', floorLevel: 0 });
      for (var ty = 0; ty < 3; ty++) cyl(0.34, 0.34, 0.2, MAT.black, GX2 - 0.6, 0.1 + ty * 0.21, GZ2 - 0.7, null, 16); world.obstacles.push({ x1: GX2 - 1.0, x2: GX2 - 0.2, z1: GZ2 - 1.1, z2: GZ2 - 0.3, tag: 'garage', floorLevel: 0 });   /* a tyre stack */
      var stain = new THREE.Mesh(new THREE.CircleGeometry(0.7, 16), new THREE.MeshStandardMaterial({ color: 0x1a1a1c, transparent: true, opacity: 0.55, roughness: 0.3 })); stain.rotation.x = -Math.PI / 2; stain.position.set((GX1 + GX2) / 2 + 0.3, 0.012, DZ + 0.4); stain.scale.set(1.4, 1, 1); world.group.add(stain);
      var gw = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), MAT.glass); gw.rotation.y = Math.PI / 2; gw.position.set(GX2 + T / 2 + 0.01, 2.2, DZ); world.group.add(gw); [-0.4, -0.13, 0.13, 0.4].forEach(function (o) { box(0.03, 0.9, 0.03, MAT.black, GX2 + T / 2 + 0.04, 2.2, DZ + o); }); box(1.36, 0.06, 0.1, MAT.trim, GX2 + T / 2 + 0.02, 1.77, DZ, { cast: false });   /* a barred window on the far side */
      // outside: a gutter and downpipe, a lamp over the door, a number, drums and jerry cans by the wall, a vent, a side door with a step and a window onto the yard
      box(GX2 - GX1 + T + 0.34, 0.1, 0.12, MAT.plastic, (GX1 + GX2) / 2, GH + 0.2, GZ2 + 0.14, { cast: false }); cyl(0.05, 0.05, GH, MAT.plastic, GX2 + 0.2, GH / 2, GZ2 + 0.1, null, 8);
      box(0.16, 0.22, 0.14, MAT.black, GX1 - 0.2, 2.85, DZ, { cast: false }); box(0.1, 0.08, 0.1, glowMat(0xfff0d0, 1.2), GX1 - 0.24, 2.76, DZ, { cast: false }); var gwl = new THREE.PointLight(0xfff0d0, 0.5, 6, 1.5); gwl.position.set(GX1 - 0.8, 2.5, DZ); scene.add(gwl); (world.streetLights = world.streetLights || []).push(gwl);
      signPlane(['12A'], 0.3, 0.3, GX1 - 0.15, 2.3, DZ - 1.9, -Math.PI / 2, { size: 60, bold: true, bg: '#1b3a8a', titleColor: '#ffffff' });
      cyl(0.3, 0.3, 0.9, colorMat(0x2f5aa8, 0.5, 0.3), GX1 + 4.9, 0.45, GZ2 + 0.6, null, 14); cyl(0.3, 0.3, 0.9, colorMat(0x8a2a2a, 0.5, 0.3), GX1 + 4.2, 0.45, GZ2 + 0.6, null, 14); world.obstacles.push({ x1: GX1 + 3.85, x2: GX1 + 5.25, z1: GZ2 + 0.25, z2: GZ2 + 0.95, tag: 'garage', floorLevel: 0 });   /* on the strip north of the garage, out of the van's way */
      [0, 0.32].forEach(function (o) { box(0.28, 0.4, 0.16, colorMat(0x2f6b3a, 0.6), GX1 + 3.2 + o, 0.2, GZ2 + 0.45); box(0.1, 0.06, 0.08, MAT.black, GX1 + 3.2 + o, 0.43, GZ2 + 0.45, { cast: false }); });
      box(0.5, 0.36, 0.06, MAT.metal, GX1 + 3.0, 2.6, GZ2 + T / 2 + 0.03, { cast: false }); for (var vs = 0; vs < 5; vs++) box(0.44, 0.02, 0.05, MAT.black, GX1 + 3.0, 2.46 + vs * 0.07, GZ2 + T / 2 + 0.05, { cast: false });
      box(0.9, 2.1, 0.06, colorMat(0x3a4046, 0.5, 0.4), GX1 + 1.4, 1.05, GZ2 + T / 2 + 0.03, { cast: true }); box(0.16, 0.04, 0.06, MAT.chrome, GX1 + 1.7, 1.0, GZ2 + T / 2 + 0.07, { cast: false }); box(1.1, 0.08, 0.5, MAT.trim, GX1 + 1.4, 0.04, GZ2 + 0.35, { cast: false });
      var gwin = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.7), MAT.glass); gwin.position.set(GX1 + 4.0, 2.0, GZ2 + T / 2 + 0.01); world.group.add(gwin); box(1.2, 0.05, 0.1, MAT.trim, GX1 + 4.0, 1.62, GZ2 + T / 2 + 0.03, { cast: false }); box(1.2, 0.05, 0.1, MAT.trim, GX1 + 4.0, 2.38, GZ2 + T / 2 + 0.03, { cast: false });
      // inside: a workbench with a vice, a red toolbox, a trolley jack, a fire extinguisher, an oil drum, a service poster, a socket, bay lines and wheel chocks
      box(2.0, 0.08, 0.7, MAT.planks, GX1 + 1.4, 0.9, GZ2 - 0.6, { cast: true }); [[GX1 + 0.5, GZ2 - 0.35], [GX1 + 2.3, GZ2 - 0.35], [GX1 + 0.5, GZ2 - 0.85], [GX1 + 2.3, GZ2 - 0.85]].forEach(function (l) { box(0.08, 0.86, 0.08, MAT.metal, l[0], 0.43, l[1]); }); world.obstacles.push({ x1: GX1 + 0.4, x2: GX1 + 2.4, z1: GZ2 - 0.95, z2: GZ2 - 0.25, tag: 'garage', floorLevel: 0 });
      box(0.22, 0.18, 0.16, MAT.metal, GX1 + 2.1, 1.03, GZ2 - 0.55); box(0.06, 0.06, 0.3, MAT.chrome, GX1 + 2.1, 1.1, GZ2 - 0.55);
      box(0.5, 0.24, 0.26, colorMat(0xc9302c, 0.5, 0.3), GX1 + 0.9, 1.06, GZ2 - 0.6); box(0.3, 0.03, 0.04, MAT.black, GX1 + 0.9, 1.2, GZ2 - 0.6, { cast: false });
      box(0.5, 0.12, 0.22, colorMat(0xc9302c, 0.5, 0.3), GX1 + 2.4, 0.06, DZ + 1.6, { cast: true }); box(0.06, 0.06, 0.7, MAT.black, GX1 + 2.4, 0.2, DZ + 1.95);
      cyl(0.09, 0.09, 0.5, colorMat(0xc9302c, 0.4, 0.3), GX2 - T / 2 - 0.16, 1.1, GZ2 - 1.8, null, 12); box(0.06, 0.12, 0.06, MAT.black, GX2 - T / 2 - 0.16, 1.42, GZ2 - 1.8, { cast: false });
      cyl(0.3, 0.3, 0.9, colorMat(0x2b2f35, 0.5, 0.3), GX1 + 0.7, 0.45, GZ1 + 0.7, null, 14); world.obstacles.push({ x1: GX1 + 0.35, x2: GX1 + 1.05, z1: GZ1 + 0.35, z2: GZ1 + 1.05, tag: 'garage', floorLevel: 0 });
      signPlane(['SERVICE', 'every 5,000 km · check the oil'], 0.9, 0.5, GX2 - T / 2 - 0.02, 2.0, DZ - 2.0, -Math.PI / 2, { titleColor: '#ffc857', bg: '#1d1f1c' });
      box(0.08, 0.12, 0.008, MAT.white, GX1 + 3.6, 0.35, GZ2 - T / 2 - 0.02, { cast: false });
      var bayM = colorMat(0xf2f2f2, 0.9), cx = (GX1 + GX2) / 2; box(4.6, 0.01, 0.08, bayM, cx, 0.014, DZ - 1.3); box(4.6, 0.01, 0.08, bayM, cx, 0.014, DZ + 1.3); box(0.08, 0.01, 2.68, bayM, GX2 - 0.5, 0.014, DZ);
      [-0.85, 0.85].forEach(function (o) { box(0.2, 0.12, 0.16, colorMat(0xe0b53a, 0.8), GX2 - 0.9, 0.06, DZ + o); });
    })();
    // ── the lane: fenced both sides from the back street to the yard gate, kerbs, lamps, a speed bump, a camera, and a barrier at the street end ──
    (function () {
      var LZ0 = -32.2, LX1 = 1.6, LX2 = 7.4, BZ = LZ0 + 0.6;
      fenceRun(LX1, YZ1, LX1, LZ0); fenceRun(LX2, YZ1, LX2, LZ0);
      var kerbM = colorMat(0xa8a49c, 0.9); box(0.25, 0.12, YZ1 - LZ0, kerbM, 2.15, 0.06, (YZ1 + LZ0) / 2, { cast: false }); box(0.25, 0.12, YZ1 - LZ0, kerbM, 6.85, 0.06, (YZ1 + LZ0) / 2, { cast: false });
      var dashM = colorMat(0xe8e0a0, 0.9); for (var dz = LZ0 + 2.5; dz < YZ1 - 1.5; dz += 3) box(0.12, 0.01, 1.4, dashM, 4.5, 0.013, dz, { cast: false });
      box(4.4, 0.07, 0.5, colorMat(0xe0b53a, 0.8), 4.5, 0.035, -27.5, { cast: false }); box(4.4, 0.07, 0.5, colorMat(0x2a2d33, 0.8), 4.5, 0.03, -27.0, { cast: false });   /* a speed bump */
      [[1.3, -29.5], [7.7, -24.5]].forEach(function (p) { var dx = p[0] < 4.5 ? 0.35 : -0.35; cyl(0.05, 0.07, 3.8, colorMat(0x3a4046, 0.45, 0.7), p[0], 1.9, p[1], null, 8); box(0.34, 0.12, 0.26, colorMat(0x24282d, 0.7), p[0] + dx, 3.75, p[1]); var lens = box(0.26, 0.02, 0.18, glowMat(0xffeec2, 1.2), p[0] + dx, 3.68, p[1], { cast: false }); (world.lampFixtures = world.lampFixtures || []).push(lens); var ll = new THREE.PointLight(0xffeec2, 0.5, 10, 1.5); ll.position.set(p[0] + dx * 1.7, 3.4, p[1]); scene.add(ll); (world.streetLights = world.streetLights || []).push(ll); });
      [[2.0, LZ0 - 0.4], [7.0, LZ0 - 0.4]].forEach(function (p) { cyl(0.08, 0.09, 0.95, colorMat(0x24282d, 0.7), p[0], 0.47, p[1], null, 8); });   /* bollards at the mouth */
      signPlane(['PRIVATE ROAD', 'Grow Co. deliveries only · barrier ahead'], 1.4, 0.5, 1.0, 2.0, LZ0 - 0.2, 0, { titleColor: '#ff6b6b', bg: '#101410' }); box(0.06, 2.2, 0.06, colorMat(0x3a4046, 0.5), 1.0, 1.1, LZ0 - 0.25);
      signPlane(['STOP', 'wait for the barrier'], 0.8, 0.5, 7.75, 1.6, BZ - 0.6, 0, { titleColor: '#ffffff', bg: '#b3121b' }); box(0.05, 1.6, 0.05, colorMat(0x3a4046, 0.5), 7.75, 0.8, BZ - 0.65);
      var cam = new THREE.Group(); cam.position.set(7.2, 3.3, YZ1 - 0.5); cam.rotation.y = 0.6; world.group.add(cam); var cb = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.22), colorMat(0xe8e8e4, 0.5)); cam.add(cb); var cl = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.06, 12), MAT.black); cl.rotation.x = Math.PI / 2; cl.position.z = -0.13; cam.add(cl); cyl(0.05, 0.06, 3.3, colorMat(0x3a4046, 0.5), 7.2, 1.65, YZ1 - 0.5, null, 8);   /* a camera on a post watches the gate */
      for (var tf = 0; tf < 50; tf++) { var side = tf % 2 ? 1 : -1; plantTuft(4.5 + side * randf(2.5, 2.85), 0, randf(LZ0 + 0.3, YZ1 - 0.3)); }
      var bar = new THREE.Group(); bar.position.set(7.15, 0.95, BZ); world.group.add(bar); world.barrier = bar;   /* the barrier: cabinet on the right, striped boom across the lane, swings up */
      box(0.4, 1.0, 0.36, colorMat(0xd8d8d2, 0.5), 7.15, 0.5, BZ, { cast: true, solid: true, tag: 'barrier-post' }); box(0.42, 0.06, 0.38, colorMat(0xc9302c, 0.5), 7.15, 1.03, BZ, { cast: false });
      var boomTex = makeTex(128, 32, function (ctx, w, h) { for (var i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#d62828' : '#f4f4f0'; ctx.fillRect(i * 16, 0, 16, h); } }, [6, 1]);
      var boom = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 4.9, 10), new THREE.MeshStandardMaterial({ map: boomTex, roughness: 0.5 })); boom.rotation.z = Math.PI / 2; boom.position.x = -2.45; boom.castShadow = true; bar.add(boom);
      var tip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), glowMat(0xff3a3a, 1.5)); tip.position.x = -4.9; bar.add(tip);
      var bHit = new THREE.Mesh(new THREE.BoxGeometry(5.0, 1.2, 0.8), MAT.none); bHit.position.x = -2.45; bar.add(bHit); interactable(bHit, { kind: 'barrier' });
      barrierSet(false);
    })();
    // ── the backyard, dressed: a dumpster you can use, pallets, crates, a wall lamp, the condenser, downpipes and a drain ──
    (function () {
      var dg = new THREE.Group(); dg.position.set(YX1 + 1.3, 0, YZ2 - 1.1); world.group.add(dg); var dM = colorMat(0x2f6b3a, 0.6, 0.2), dD = colorMat(0x24522c, 0.6, 0.2);
      var body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.15, 1.0), dM); body.position.y = 0.72; body.castShadow = true; body.receiveShadow = true; dg.add(body);
      var lid = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.08, 1.06), dD); lid.position.set(0, 1.34, 0); lid.rotation.x = -0.08; lid.castShadow = true; dg.add(lid);
      [[-0.7, -0.4], [0.7, -0.4], [-0.7, 0.4], [0.7, 0.4]].forEach(function (w) { var wh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 10), MAT.black); wh.rotation.z = Math.PI / 2; wh.position.set(w[0], 0.08, w[1]); dg.add(wh); });
      var dsign = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.28), new THREE.MeshBasicMaterial({ map: textTex(['GROW CO.', 'waste only'], 280, 110, { size: 34, bold: true, bg: 'rgba(0,0,0,0)', color: '#dfe8dc', titleColor: '#dfe8dc', line: 'rgba(0,0,0,0)' }), transparent: true })); dsign.position.set(0, 0.8, 0.505); dg.add(dsign);
      var dh = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.5, 1.3), MAT.none); dh.position.y = 0.75; dg.add(dh); interactable(dh, { kind: 'dumpster' });
      world.obstacles.push({ x1: YX1 + 0.4, x2: YX1 + 2.2, z1: YZ2 - 1.65, z2: YZ2 - 0.55, tag: 'yard', floorLevel: 0 });
      for (var pl = 0; pl < 3; pl++) box(1.2, 0.14, 1.0, MAT.planks, YX1 + 6.0, 0.07 + pl * 0.16, YZ2 - 1.0, { cast: true }); world.obstacles.push({ x1: YX1 + 5.4, x2: YX1 + 6.6, z1: YZ2 - 1.5, z2: YZ2 - 0.5, tag: 'yard', floorLevel: 0 });   /* beside the roller door, clear of the van's bay */
      box(0.5, 0.5, 0.5, MAT.wood, YX1 + 5.9, 0.73, YZ2 - 1.0, { cast: true }); box(0.5, 0.5, 0.5, MAT.wood, YX1 + 2.9, 0.25, YZ2 - 0.9, { cast: true, solid: true, tag: 'yard' }); box(0.44, 0.44, 0.44, MAT.wood, YX1 + 2.9, 0.72, YZ2 - 0.9, { cast: true });   /* beside the dumpster, clear of the bay where the car parks */
      box(0.5, 0.02, 0.5, MAT.black, 4.5, 0.012, YZ2 - 2.8, { cast: false }); for (var gr = 0; gr < 5; gr++) box(0.44, 0.006, 0.03, colorMat(0x55595e, 0.5, 0.5), 4.5, 0.024, YZ2 - 2.98 + gr * 0.09, { cast: false });   /* a drain grate in the yard */
      var wl = box(0.16, 0.22, 0.14, MAT.black, 4.5, 2.75, AZ1 - 0.2, { cast: false }); box(0.1, 0.08, 0.1, glowMat(0xfff0d0, 1.2), 4.5, 2.66, AZ1 - 0.24, { cast: false }); var wlL = new THREE.PointLight(0xfff0d0, 0.55, 7, 1.5); wlL.position.set(4.5, 2.5, AZ1 - 0.8); scene.add(wlL); (world.streetLights = world.streetLights || []).push(wlL);   /* a lamp over the roller door */
      box(0.95, 0.7, 0.36, colorMat(0xb9bec4, 0.5, 0.4), 6.6, 1.7, AZ1 - 0.3, { cast: true }); cyl(0.26, 0.26, 0.03, MAT.black, 6.6, 1.7, AZ1 - 0.5, null, 20).rotation.x = Math.PI / 2; box(0.04, 1.35, 0.04, MAT.plastic, 7.15, 0.68, AZ1 - 0.2);   /* the condenser and its pipe */
      [AX1 - 0.16, AX2 + 0.16].forEach(function (x) { cyl(0.05, 0.05, AH + 0.25, MAT.plastic, x, (AH + 0.25) / 2, AZ1 - 0.2, null, 8); cyl(0.09, 0.09, 0.14, MAT.plastic, x, 0.1, AZ1 - 0.35, null, 8); });   /* downpipes at both rear corners */
      for (var tf = 0; tf < 36; tf++) { var tx = randf(YX1 + 0.2, YX2 - 0.2), tz = randf(YZ1 + 0.15, YZ2 - 0.15); if (Math.abs(tx - 4.5) < 2.4 || (tx > YX1 + 0.3 && tx < YX1 + 2.3 && tz > YZ2 - 1.8)) continue; plantTuft(tx, 0, tz); }   /* weeds along the fence, not in the bay or the doorway */
    })();
    var gate = new THREE.Group(); gate.position.set(3.0, 0, YZ1); world.group.add(gate); world.yardGate = gate;
    var gf = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.8, 0.05), new THREE.MeshStandardMaterial({ map: TEX.fabric, color: 0x9aa0a8, transparent: true, opacity: 0.45, roughness: 1 })); gf.position.set(1.5, 1.0, 0); gate.add(gf);
    [[1.5, 0.15], [1.5, 1.85]].forEach(function (r) { var rr = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.05, 0.05), fenceM); rr.position.set(r[0], r[1], 0); gate.add(rr); }); [0.05, 2.95].forEach(function (x) { var pp = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.9, 0.06), fenceM); pp.position.set(x, 1.0, 0); gate.add(pp); });
    var gHit = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.0, 0.4), MAT.none); gHit.position.set(1.5, 1.0, 0); gate.add(gHit); interactable(gHit, { kind: 'gate' });
    gateSet(false);
    signPlane(['GROW CO.', 'deliveries & collections · back gate'], 1.6, 0.4, 4.5, 2.2, YZ1 - 0.1, Math.PI, { titleColor: '#6fdc8c', bg: '#101410' });
    // access lane out to the world
    var lane = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 11.2), MAT.asphalt); lane.rotation.x = -Math.PI / 2; lane.position.set(4.5, 0.004, YZ1 - 5.6); lane.receiveShadow = true; world.group.add(lane);
    // the supply van, parked out of sight until a delivery is due
    truck.g = new THREE.Group(); vanBody(truck.g, ['RF SUPPLY CO.', 'wholesale · trade only']); truck.g.rotation.y = -Math.PI / 2; truck.g.visible = false; truck.g.position.set(4.5, 0, -32); world.group.add(truck.g);
  }
  function buildLobby() {
    // counter on the staff side of the window: slatted front, rounded top, kickplate; register faces the cashier
    var slatM = MAT.darkwood;
    box(3.2, 1.0, 0.7, MAT.counter, 0, 0.5, 3.55, { solid: true, tag: 'counter' });
    for (var s = -1.5; s <= 1.5; s += 0.1) box(0.06, 0.86, 0.02, slatM, s, 0.5, 3.19, { cast: false });
    box(3.2, 0.1, 0.02, MAT.chrome, 0, 0.05, 3.19, { cast: false });
    box(3.44, 0.06, 0.84, MAT.counterTop, 0, 1.03, 3.55, { cast: false }); box(3.5, 0.03, 0.9, MAT.counterTop, 0, 1.005, 3.55, { cast: false });
    // register: body, drawer, keypad, arm-mounted screen, receipt printer, card reader. The whole till is one table
    // fixture (build mode carries it along the counter or anywhere flat), and so are the tip jar, the bell and the cards.
    fixtureFromBuild('counterTill', 'till', 0, function () {
    var reg = box(0.52, 0.1, 0.44, MAT.register, -1.0, 1.11, 3.55);
    box(0.5, 0.03, 0.42, MAT.plastic, -1.0, 1.05, 3.55, { cast: false }); box(0.36, 0.02, 0.01, MAT.chrome, -1.0, 1.08, 3.335, { cast: false });
    // the till is a tablet on a stand: its screen is a touch screen (look at it, press E), and the cash drawer sits under it
    world.reg = { drawerT: 0, lastSale: null };
    buildPos(-1.0, 3.62);
    var scrGlow = new THREE.PointLight(0x6fdc8c, 0.12, 1.0); scrGlow.position.set(-1.0, 1.3, 3.5); world.group.add(scrGlow);   /* in the group, so the glow goes where the till goes */
    var drawer = new THREE.Group(); drawer.position.set(-1.0, 1.07, 3.55); world.group.add(drawer); world.reg.drawer = drawer; var dbody = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 0.38), colorMat(0x2a3138, 0.5, 0.3)); drawer.add(dbody); var dface = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.075, 0.02), MAT.register); dface.position.z = -0.2; drawer.add(dface); var dhandle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.015, 0.015), MAT.chrome); dhandle.position.set(0, 0, -0.215); drawer.add(dhandle); [[-0.16, 0x9ff0b5], [-0.06, 0xe8e8ee], [0.04, 0xffd766], [0.14, 0x9ad0ff]].forEach(function (sl) { var s2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.28), colorMat(0x3a4148, 0.5)); s2.position.set(sl[0], 0.03, 0.02); drawer.add(s2); var notes = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.012, 0.15), colorMat(sl[1], 0.7)); notes.position.set(sl[0], 0.045, -0.02); drawer.add(notes); }); for (var cn = 0; cn < 4; cn++) { var cs = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.03, 12), MAT.chrome); cs.position.set(-0.16 + cn * 0.1, 0.05, 0.13); drawer.add(cs); }
    drawRegister();
    box(0.2, 0.08, 0.14, MAT.plastic, -0.68, 1.12, 3.68); box(0.12, 0.002, 0.06, MAT.white, -0.68, 1.161, 3.66, { cast: false });
    var reader = box(0.09, 0.14, 0.05, MAT.black, -0.5, 1.13, 3.75); reader.rotation.x = 0.4; var rscr = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.05), MAT.screen); rscr.position.set(-0.5, 1.16, 3.777); rscr.rotation.x = 0.4; world.group.add(rscr);
    interactable(reg, { kind: 'register', label: 'Till', prompt: 'Sell & serve' });
    }, { table: true, baseY: 1.06 });
    world.reg.drawerZ = world.reg.drawer.position.z;   /* the drawer now slides in the till's own frame, wherever the till stands */
    // counter display for lighters, papers and grinders: a small tiered stand beside the register, contents synced from the save
    box(0.5, 0.02, 0.26, MAT.darkwood, 0.95, 1.075, 4.25, { cast: false }); box(0.5, 0.02, 0.12, MAT.darkwood, 0.95, 1.145, 4.18, { cast: false }); box(0.5, 0.06, 0.02, MAT.darkwood, 0.95, 1.115, 4.125, { cast: false });
    var dispLbl = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.05), new THREE.MeshBasicMaterial({ map: textTex(['LIGHTERS · PAPERS · GRINDERS'], 300, 50, { size: 18, bg: '#f3e9cf', color: '#222', titleColor: '#222', line: 'rgba(0,0,0,0)' }) })); dispLbl.position.set(0.95, 1.09, 4.375); dispLbl.rotation.x = -0.5; world.group.add(dispLbl);
    world.displayGroup = new THREE.Group(); world.group.add(world.displayGroup);
    // a baseball bat leans against the counter end, staff side
    var batM = cyl(0.022, 0.034, 0.85, MAT.wood, -1.72, 0.44, 3.25, null, 10); batM.rotation.z = 0.16; batM.rotation.x = -0.05; world.batMesh = batM; cyl(0.024, 0.024, 0.14, MAT.black, -1.78, 0.08, 3.26, null, 8).rotation.z = 0.16;
    interactable(box(0.2, 0.9, 0.2, MAT.none, -1.72, 0.45, 3.25, { cast: false }), { kind: 'bat' });
    interactable(box(3.2, 1.0, 0.7, MAT.counter, 0, 0.5, 3.55, { cast: false, receive: false }), { kind: 'register', label: 'Counter', prompt: 'Sell & serve' }).visible = false;
    // tip jar with coins, business cards, a desk bell
    fixtureFromBuild('tipJar', 'tip jar', 0, function () { cyl(0.08, 0.08, 0.18, MAT.jar, 1.2, 1.15, 3.55); cyl(0.09, 0.09, 0.02, MAT.jarLid, 1.2, 1.25, 3.55); interactable(box(0.22, 0.26, 0.22, MAT.none, 1.2, 1.15, 3.55, { cast: false }), { kind: 'tips' }); for (var c = 0; c < 6; c++) { var coin = cyl(0.02, 0.02, 0.004, MAT.chrome, 1.2 + randf(-0.04, 0.04), 1.07 + c * 0.006, 3.55 + randf(-0.04, 0.04), null, 10); coin.rotation.set(randf(-0.3, 0.3), 0, randf(-0.3, 0.3)); } }, { table: true, baseY: 1.06 });
    fixtureFromBuild('bizCards', 'business cards', 0, function () { box(0.1, 0.03, 0.07, MAT.white, 0.8, 1.075, 3.5, { cast: false }); box(0.1, 0.005, 0.07, colorMat(0x6fdc8c), 0.8, 1.093, 3.5, { cast: false }); box(0.16, 0.08, 0.13, MAT.none, 0.8, 1.1, 3.5, { cast: false }); }, { table: true, baseY: 1.06 });   /* the invisible box is only something to aim at in build mode */
    fixtureFromBuild('deskBell', 'desk bell', 0, function () { cyl(0.05, 0.06, 0.03, MAT.chrome, 0.4, 1.075, 3.5, null, 16); var bell = new THREE.Mesh(new THREE.SphereGeometry(0.045, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), MAT.chrome); bell.position.set(0.4, 1.09, 3.5); world.group.add(bell); cyl(0.008, 0.008, 0.02, MAT.black, 0.4, 1.14, 3.5, null, 8); box(0.16, 0.12, 0.16, MAT.none, 0.4, 1.12, 3.5, { cast: false }); }, { table: true, baseY: 1.06 });
    // lobby: menu board, framed posters, queue posts with a sagging rope, a guard podium
    signPlane(['MENU', 'eighths · joints', 'ask for the good stuff'], 1.4, 0.8, -3.4, 2.1, 4.12, 0, { titleColor: '#ffc857' });
    framedPoster(TEX.poster1, 0.6, 0.9, -8.0, 1.9, 4.12, 0); framedPoster(TEX.poster2, 0.6, 0.9, -6.8, 1.9, 4.12, 0); framedPoster(TEX.poster3, 0.6, 0.9, 7.2, 1.9, 4.12, 0);
    /* the queue rope is the queueRope prop: E on it restyles it, F2 moves it */
    box(0.6, 1.1, 0.5, MAT.darkwood, 2.2, 0.55, 7.6, { solid: true, tag: 'podium' }); box(0.7, 0.04, 0.6, MAT.counterTop, 2.2, 1.12, 7.6, { cast: false }); box(0.64, 0.04, 0.54, MAT.darkwood, 2.2, 0.02, 7.6, { cast: false });
    var tablet = box(0.22, 0.01, 0.16, MAT.black, 2.2, 1.15, 7.6); tablet.rotation.y = 0.4; var tscr = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.14), MAT.screen); tscr.position.set(2.2, 1.157, 7.6); tscr.rotation.set(-Math.PI / 2, 0, 0.4); world.group.add(tscr);
    var stool = cyl(0.16, 0.16, 0.04, colorMat(0x1c1c22, 0.9), 2.9, 0.62, 7.6, null, 18); cyl(0.02, 0.02, 0.6, MAT.chrome, 2.9, 0.3, 7.6, null, 8); cyl(0.14, 0.16, 0.02, MAT.chrome, 2.9, 0.01, 7.6, null, 18);
    // exit sign over the door, a doormat, wall clock is in the hall; outlets and switches
    var exitSign = box(0.5, 0.18, 0.06, MAT.plastic, 0, 2.62, ROOM.z - 0.06, { cast: false }); var exitFace = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.14), new THREE.MeshBasicMaterial({ map: textTex(['EXIT'], 230, 70, { size: 54, bold: true, bg: '#0a2a14', titleColor: '#4dff88', line: 'rgba(77,255,136,.7)' }) })); exitFace.position.set(0, 2.62, ROOM.z - 0.09); exitFace.rotation.y = Math.PI; world.group.add(exitFace);
    var exitL = new THREE.PointLight(0x4dff88, 0.25, 2.5); exitL.position.set(0, 2.5, ROOM.z - 0.4); scene.add(exitL);
    lightSwitch(8.9, 1.3, 4 + WALL_T / 2 + 0.012, 0, 'lobby'); wallOutlet(-5, 0.35, 4 + WALL_T / 2 + 0.006, 0); wallOutlet(6, 0.35, 4 + WALL_T / 2 + 0.006, 0); wallOutlet(ROOM.x - 0.105, 0.35, 6, -Math.PI / 2);
  }
  function buildStaticFixtures() {
    // whiteboard with a marker tray, photo, dehumidifier, ducting, wall shelf, pegboard with tools, thermometer, calendar, extinguisher
    var wb = signPlane(['THIS WEEK', 'water · feed · treat', 'harvest → hang → jar → bench'], 1.3, 0.8, -5.0, 1.9, -1.88, 0, { bg: '#f4f4f0', color: '#222', titleColor: '#1a6a2a', line: 'rgba(0,0,0,0)' });
    box(1.4, 0.9, 0.03, MAT.chrome, -5.0, 1.9, -1.9, { cast: false }); box(1.3, 0.03, 0.06, MAT.chrome, -5.0, 1.47, -1.86, { cast: false }); [0x1a6a2a, 0xc94a3a, 0x222222].forEach(function (col, i) { var mk = cyl(0.01, 0.01, 0.12, colorMat(col, 0.5), -5.3 + i * 0.12, 1.49, -1.85, null, 8); mk.rotation.z = Math.PI / 2; });
    framedPoster(textTex(['📷', 'RF crew · 2026'], 200, 240, { size: 40, bg: '#f0ead8', color: '#333', titleColor: '#333', line: 'rgba(0,0,0,0)' }), 0.45, 0.55, -11.2, 2.0, -1.88, 0, MAT.wood);
    dehumUnit('dry', ROOM.x - 0.32, -3.0, -Math.PI / 2);     // dry & cure room, right wall, facing into the room
    dehumUnit('grow', -ROOM.x + 0.32, -7.2, Math.PI / 2);    // grow room, left wall, facing into the room
    var ductM = new THREE.MeshStandardMaterial({ map: TEX.brushed, color: 0xc5c8cd, roughness: 0.4, metalness: 0.6 });
    var duct = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 8, 14), ductM); duct.rotation.z = Math.PI / 2; duct.position.set(4, ROOM.h - 0.28, -ROOM.z + 1.1); duct.castShadow = true; world.group.add(duct);
    for (var dc = 0; dc < 5; dc++) { var ring = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.02, 8, 18), ductM); ring.rotation.y = Math.PI / 2; ring.position.set(1 + dc * 1.6, ROOM.h - 0.28, -ROOM.z + 1.1); world.group.add(ring); var hang = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.14, 0.03), MAT.plastic), _h = hang; _h.position.set(1 + dc * 1.6, ROOM.h - 0.07, -ROOM.z + 1.1); world.group.add(_h); }
    var filter = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.7, 16), colorMat(0xe0e0e0, 0.9)); filter.rotation.z = Math.PI / 2; filter.position.set(-0.1, ROOM.h - 0.28, -ROOM.z + 1.1); filter.castShadow = true; world.group.add(filter);
    var flange = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 16), MAT.black); flange.rotation.z = Math.PI / 2; flange.position.set(0.27, ROOM.h - 0.28, -ROOM.z + 1.1); world.group.add(flange);
    var fanBox = box(0.36, 0.36, 0.36, MAT.plastic, 8.2, ROOM.h - 0.28, -ROOM.z + 1.1); box(0.1, 0.06, 0.2, MAT.black, 8.2, ROOM.h - 0.28, -ROOM.z + 1.3, { cast: false });
    // wall shelf in the processing room with a few jars and a scale
    box(0.25, 0.03, 1.0, MAT.wood, ROOM.x - 0.15, 1.7, 1.0); [0.55, 1.45].forEach(function (z) { var br = box(0.2, 0.03, 0.03, MAT.chrome, ROOM.x - 0.12, 1.68, z); var br2 = box(0.03, 0.2, 0.03, MAT.chrome, ROOM.x - 0.03, 1.6, z); }); for (var j = 0; j < 3; j++) { cyl(0.05, 0.05, 0.12, MAT.jar, ROOM.x - 0.15, 1.78, 0.7 + j * 0.3, null, 12); cyl(0.052, 0.052, 0.015, MAT.jarLid, ROOM.x - 0.15, 1.845, 0.7 + j * 0.3, null, 12); }
    signPlane(['PROCESSING ROOM', 'grind · bag · roll'], 1.5, 0.5, ROOM.x - 0.02, 2.3, 1.0, -Math.PI / 2, { titleColor: '#ffc857' });
    signPlane(['24°C · lights 18/6'], 0.9, 0.26, -ROOM.x + 0.02, 2.3, -4.3, Math.PI / 2, { titleColor: '#ffc857', bg: '#101410' });
    var thermo = box(0.12, 0.12, 0.03, MAT.white, -ROOM.x + 0.03, 1.5, -4.3); var tscr = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.04), MAT.screen); tscr.position.set(-ROOM.x + 0.047, 1.51, -4.3); tscr.rotation.y = Math.PI / 2; world.group.add(tscr);
    framedPoster(textTex(['SEPTEMBER', '', 'water · feed', 'treat · harvest'], 200, 240, { size: 30, bg: '#f0ead8', color: '#333', titleColor: '#1a6a2a', line: 'rgba(0,0,0,0)' }), 0.5, 0.6, -ROOM.x + 0.02, 1.9, -8.3, Math.PI / 2, MAT.white);
    // pegboard with tools instead of an emoji sign
    var pb = new THREE.Group(); pb.position.set(ROOM.x - 0.03, 1.9, -0.95); pb.rotation.y = -Math.PI / 2; world.group.add(pb);
    var board = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.8, 0.02), colorMat(0x8a6a4a, 0.9)); pb.add(board);
    for (var py = -0.32; py <= 0.32; py += 0.08) for (var px = -0.48; px <= 0.48; px += 0.08) { var hole = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.03, 6), MAT.black); hole.rotation.x = Math.PI / 2; hole.position.set(px, py, 0); pb.add(hole); }
    function tool(fn) { var g = new THREE.Group(); pb.add(g); fn(g); return g; }
    tool(function (g) { g.position.set(-0.4, 0.05, 0.03); var h = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.32, 8), MAT.wood); g.add(h); var head = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.04), MAT.metal); head.position.y = 0.17; g.add(head); });          // hammer
    tool(function (g) { g.position.set(-0.2, 0.0, 0.03); g.rotation.z = 0.3; var s = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.34, 0.01), MAT.metal); g.add(s); var j = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.012, 6, 12, Math.PI * 1.4), MAT.metal); j.position.y = 0.19; j.rotation.z = -0.9; g.add(j); });  // wrench
    tool(function (g) { g.position.set(0.05, 0.02, 0.03); [-0.4, 0.4].forEach(function (a) { var bl = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.22, 0.006), MAT.chrome); bl.rotation.z = a; bl.position.y = 0.08; g.add(bl); var r = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 6, 12), colorMat(0xc94a3a, 0.5)); r.rotation.z = a; r.position.set(Math.sin(a) * 0.13, -0.1, 0); g.add(r); }); }); // scissors
    tool(function (g) { g.position.set(0.28, 0.0, 0.03); var h = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.14, 8), colorMat(0xe0c25a, 0.6)); h.position.y = 0.12; g.add(h); var sh = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.2, 6), MAT.chrome); sh.position.y = -0.05; g.add(sh); });   // screwdriver
    tool(function (g) { g.position.set(0.45, 0.02, 0.03); var t = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.05), colorMat(0xe0c25a, 0.6)); g.add(t); var lbl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.052), MAT.black); g.add(lbl); });   // tape measure
    signPlane(['TOOLS', 'keep it clean'], 0.6, 0.2, ROOM.x - 0.02, 2.42, -0.95, -Math.PI / 2, { titleColor: '#ffc857' });
    // fire extinguisher by the hall door, thermostat, more outlets
    var ext = new THREE.Group(); ext.position.set(3.85, 1.0, 2.6); world.group.add(ext);
    var eb = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.42, 14), colorMat(0xc9302c, 0.35, 0.3)); ext.add(eb); var et = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), colorMat(0xc9302c, 0.35, 0.3)); et.position.y = 0.21; ext.add(et);
    var ev = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.08, 8), MAT.chrome); ev.position.y = 0.3; ext.add(ev); var eh = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.12), MAT.black); eh.position.set(0, 0.34, 0.03); ext.add(eh); var hose = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.01, 6, 14, Math.PI), MAT.black); hose.position.set(0, 0.1, 0.06); hose.rotation.y = Math.PI / 2; ext.add(hose);
    var elab = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.14), new THREE.MeshBasicMaterial({ map: textTex(['FIRE'], 100, 140, { size: 34, bold: true, bg: '#fff', color: '#c9302c', titleColor: '#c9302c', line: 'rgba(0,0,0,0)' }) })); elab.position.set(0.072, 0.02, 0); elab.rotation.y = Math.PI / 2; ext.add(elab);
    box(0.06, 0.1, 0.16, MAT.black, 3.93, 1.05, 2.6, { cast: false });
    signPlane(['🧯'], 0.24, 0.24, 3.895, 1.55, 2.6, -Math.PI / 2, { bg: '#c9302c', color: '#fff', line: 'rgba(0,0,0,0)', size: 60 });
    lightSwitch(-3.9, 1.3, 1.9, -Math.PI / 2, 'office'); lightSwitch(3.9, 1.3, 1.9, -Math.PI / 2, 'proc'); lightSwitch(-5.8, 1.3, -1.89, 0, 'grow'); lightSwitch(5.8, 1.3, -1.89, 0, 'dry');
    wallOutlet(-10, 0.35, -1.89, 0); wallOutlet(-3, 0.35, -8.89, 0); wallOutlet(9, 0.35, -8.89, 0); wallOutlet(ROOM.x - 0.105, 0.35, 2.5, -Math.PI / 2); wallOutlet(-ROOM.x + 0.105, 0.35, 0, Math.PI / 2);
  }

