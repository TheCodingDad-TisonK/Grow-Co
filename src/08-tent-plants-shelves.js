//@ the tent, plant meshes, the drying line and shelf contents
  // ── Tent (rebuilt when tier / light changes) ──────────────────────
  var TENT_ORIGIN = { x: -6.6, z: -6.1 };
  function tentSize() { var t = TENTS[S.tent]; var big = t.rows >= 4 || t.cols >= 5; var pitch = big ? 1.15 : 1.3, m = big ? 0.5 : 0.6; return { w: t.cols * pitch + m, d: t.rows * pitch + m, cols: t.cols, rows: t.rows, pitch: pitch, m: m }; }
  function slotPos(i) {
    var ts = tentSize(); var c = i % ts.cols, r = Math.floor(i / ts.cols);
    return { x: TENT_ORIGIN.x - ts.w / 2 + ts.m / 2 + ts.pitch / 2 + c * ts.pitch, z: TENT_ORIGIN.z - ts.d / 2 + ts.m / 2 + ts.pitch / 2 + r * ts.pitch };
  }
  function slotPosOf(pid) { var p = plantById(pid); return slotPos(p ? p.slot : 0); }
  // a fabric pot: tapered body, rolled rim, saucer, soil dome, a plant tag stake
  function makePot(parent, hasSoil) {
    var pot = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.2, 0.3, 24), MAT.pot); pot.position.y = 0.15; pot.castShadow = true; pot.receiveShadow = true; parent.add(pot);
    var rim = new THREE.Mesh(new THREE.TorusGeometry(0.255, 0.02, 8, 24), MAT.pot); rim.rotation.x = Math.PI / 2; rim.position.y = 0.3; parent.add(rim);
    var band = new THREE.Mesh(new THREE.CylinderGeometry(0.262, 0.262, 0.05, 24), colorMat(0x9a4a22, 0.9)); band.position.y = 0.26; parent.add(band);
    var saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.27, 0.025, 24), colorMat(0x8a4020, 0.9)); saucer.position.y = 0.0125; saucer.receiveShadow = true; parent.add(saucer);
    var soil = new THREE.Mesh(new THREE.SphereGeometry(0.235, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), MAT.soil); soil.scale.y = 0.12; soil.position.y = 0.285; soil.visible = !!hasSoil; parent.add(soil);
    return { pot: pot, soil: soil };
  }
  function buildTent() {
    if (world.tentGroup) { world.group.remove(world.tentGroup); disposeTree(world.tentGroup); world.interact = world.interact.filter(function (m) { return !m.userData.tent; }); world.obstacles = world.obstacles.filter(function (o) { return o.tag !== 'tent' && o.tag !== 'pot'; }); }
    var g = new THREE.Group(); world.tentGroup = g; world.group.add(g);
    var ts = tentSize(); var h = 2.4; var ox = TENT_ORIGIN.x, oz = TENT_ORIGIN.z;
    // tent shell: back + two sides + roof, open front (toward +z). Mylar inside.
    var back = box(ts.w, h, 0.03, MAT.tent, ox, h / 2, oz - ts.d / 2, { parent: g, solid: true, tag: 'tent' }); back.material = MAT.tent;
    box(0.03, h, ts.d, MAT.tent, ox - ts.w / 2, h / 2, oz, { parent: g, solid: true, tag: 'tent' });
    box(0.03, h, ts.d, MAT.tent, ox + ts.w / 2, h / 2, oz, { parent: g, solid: true, tag: 'tent' });
    box(ts.w, 0.03, ts.d, MAT.tent, ox, h, oz, { parent: g });
    // front top valance so it reads as a tent with a rolled-up door, zipper tapes down both front edges
    box(ts.w, 0.4, 0.03, MAT.tent, ox, h - 0.2, oz + ts.d / 2, { parent: g });
    var roll = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, ts.w - 0.1, 12), MAT.tent); roll.rotation.z = Math.PI / 2; roll.position.set(ox, h - 0.42, oz + ts.d / 2); g.add(roll);
    var zipM = colorMat(0x8a8d93, 0.5, 0.3); [-1, 1].forEach(function (sd) { var zt = new THREE.Mesh(new THREE.BoxGeometry(0.03, h - 0.4, 0.012), zipM); zt.position.set(ox + sd * (ts.w / 2 - 0.05), (h - 0.4) / 2, oz + ts.d / 2 + 0.02); g.add(zt); var pull = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 0.02), MAT.chrome); pull.position.set(ox + sd * (ts.w / 2 - 0.05), h - 0.5, oz + ts.d / 2 + 0.03); g.add(pull); });
    // metal frame: corner poles, top rails, a wider foot on each corner
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (c) { cyl(0.022, 0.022, h, MAT.metal, ox + c[0] * ts.w / 2, h / 2, oz + c[1] * ts.d / 2, g, 10); cyl(0.05, 0.06, 0.03, MAT.plastic, ox + c[0] * ts.w / 2, 0.015, oz + c[1] * ts.d / 2, g, 12); var cn = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), MAT.plastic); cn.position.set(ox + c[0] * ts.w / 2, h, oz + c[1] * ts.d / 2); g.add(cn); });
    [-1, 1].forEach(function (sd) { var r1 = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, ts.w, 8), MAT.metal); r1.rotation.z = Math.PI / 2; r1.position.set(ox, h, oz + sd * ts.d / 2); g.add(r1); var r2 = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, ts.d, 8), MAT.metal); r2.rotation.x = Math.PI / 2; r2.position.set(ox + sd * ts.w / 2, h, oz); g.add(r2); });
    // side vents with mesh, an inline fan + carbon filter hanging under the roof at the back
    [-1, 1].forEach(function (sd) { var vt = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 8, 24), MAT.tent); vt.rotation.y = Math.PI / 2; vt.position.set(ox + sd * ts.w / 2, 0.7, oz - ts.d / 4); g.add(vt); var mesh = new THREE.Mesh(new THREE.CircleGeometry(0.15, 24), new THREE.MeshStandardMaterial({ color: 0x555a60, roughness: 0.9, transparent: true, opacity: 0.85, side: THREE.DoubleSide })); mesh.rotation.y = Math.PI / 2; mesh.position.copy(vt.position); g.add(mesh); });
    var cf = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.55, 16), colorMat(0xe6e6e6, 0.9)); cf.rotation.z = Math.PI / 2; cf.position.set(ox - ts.w / 2 + 0.5, h - 0.25, oz - ts.d / 2 + 0.3); g.add(cf);
    var inl = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.35, 14), MAT.plastic); inl.rotation.z = Math.PI / 2; inl.position.set(ox - ts.w / 2 + 1.0, h - 0.25, oz - ts.d / 2 + 0.3); g.add(inl);
    var duct2 = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, ts.w - 1.4, 10), colorMat(0xc5c8cd, 0.4, 0.6)); duct2.rotation.z = Math.PI / 2; duct2.position.set(ox + 0.5, h - 0.25, oz - ts.d / 2 + 0.3); g.add(duct2);
    [0.5, 1.0].forEach(function (dx) { [-0.12, 0.12].forEach(function (dz) { var strap = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.2, 0.02), MAT.black); strap.position.set(ox - ts.w / 2 + dx, h - 0.1, oz - ts.d / 2 + 0.3 + dz); g.add(strap); }); });
    // mylar liner: a box slightly inside with BackSide material
    var liner = new THREE.Mesh(new THREE.BoxGeometry(ts.w - 0.02, h - 0.02, ts.d - 0.02), [MAT.mylar, MAT.mylar, MAT.mylar, MAT.mylar, MAT.none, MAT.mylar]); liner.position.set(ox, h / 2, oz); g.add(liner);
    // tray floor with a lip, a power strip along the back edge
    box(ts.w - 0.06, 0.03, ts.d - 0.06, MAT.black, ox, 0.015, oz, { parent: g, cast: false });
    box(ts.w - 0.06, 0.05, 0.02, MAT.plastic, ox, 0.025, oz + ts.d / 2 - 0.04, { parent: g, cast: false });
    box(0.3, 0.04, 0.06, MAT.white, ox + ts.w / 2 - 0.4, 0.05, oz - ts.d / 2 + 0.1, { parent: g, cast: false }); for (var ps = 0; ps < 4; ps++) { var sk = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.01, 8), MAT.black); sk.position.set(ox + ts.w / 2 - 0.51 + ps * 0.07, 0.075, oz - ts.d / 2 + 0.1); g.add(sk); }
    // light rig
    world.lampGroup = new THREE.Group(); g.add(world.lampGroup);
    var L = lightObj(), li = lightIdx();
    var rail = new THREE.Mesh(new THREE.BoxGeometry(ts.w - 0.4, 0.04, 0.04), MAT.metal); rail.position.set(ox, h - 0.1, oz); world.lampGroup.add(rail);
    if (li === 0) {
      // windowsill tier: no lamp; a dangling empty hook and a note
      cyl(0.01, 0.01, 0.4, MAT.metal, ox, h - 0.32, oz, world.lampGroup, 6);
      var hook = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 6, 12, Math.PI), MAT.metal); hook.position.set(ox, h - 0.52, oz); world.lampGroup.add(hook);
      var note = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.38), new THREE.MeshBasicMaterial({ map: textTex(['no lamp yet', 'plants use the window'], 512, 160, { size: 42, color: '#ffc857' }), transparent: true, side: THREE.DoubleSide })); note.position.set(ox, h - 0.62, oz); world.lampGroup.add(note);
    } else {
      var lampMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: L.color, emissiveIntensity: 1.6 + li * 0.4 });
      var n = li === 1 ? 2 : 1; var lw = li === 1 ? 0.25 : Math.min(ts.w - 0.8, 0.6 + ts.cols * 0.35);
      for (var k = 0; k < n; k++) {
        var lx = ox + (n === 1 ? 0 : (k === 0 ? -ts.w / 4 : ts.w / 4));
        // ratchet hangers: two straps with a small buckle each
        [-0.15, 0.15].forEach(function (dz) { cyl(0.006, 0.006, 0.3, MAT.black, lx + dz * (li === 1 ? 0 : lw * 1.5), h - 0.27, oz + (li === 1 ? dz * 0.3 : 0), world.lampGroup, 6); var bk = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.02), MAT.plastic); bk.position.set(lx + dz * (li === 1 ? 0 : lw * 1.5), h - 0.2, oz + (li === 1 ? dz * 0.3 : 0)); world.lampGroup.add(bk); });
        if (li === 1) { var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), lampMat); bulb.position.set(lx, h - 0.5, oz); world.lampGroup.add(bulb); var hood = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.22, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xd8dce0, roughness: 0.3, metalness: 0.7, side: THREE.DoubleSide })); hood.position.set(lx, h - 0.38, oz); world.lampGroup.add(hood); var sock = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.06, 10), MAT.black); sock.position.set(lx, h - 0.3, oz); world.lampGroup.add(sock); }
        else {
          var dd = li === 2 ? 0.5 : 0.36; var housing = new THREE.Mesh(new THREE.BoxGeometry(lw, 0.08, dd), colorMat(li === 2 ? 0x2a2d33 : 0xd8dce0, 0.4, 0.5)); housing.position.set(lx, h - 0.46, oz); world.lampGroup.add(housing);
          for (var fin = 0; fin < 7; fin++) { var f = new THREE.Mesh(new THREE.BoxGeometry(lw - 0.06, 0.05, 0.01), colorMat(0x8a8f96, 0.4, 0.6)); f.position.set(lx, h - 0.39, oz - dd / 2 + 0.05 + fin * (dd - 0.1) / 6); world.lampGroup.add(f); }
          if (li === 2) { for (var bar = 0; bar < 4; bar++) { var strip = new THREE.Mesh(new THREE.BoxGeometry(lw - 0.08, 0.015, 0.05), lampMat); strip.position.set(lx, h - 0.505, oz - dd / 2 + 0.08 + bar * (dd - 0.16) / 3); world.lampGroup.add(strip); } for (var dio = 0; dio < 10; dio++) { for (var bar2 = 0; bar2 < 4; bar2++) { var d = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.01, 0.02), colorMat(0xffffff, 0.2, 0.2, { emissive: new THREE.Color(0xffffff), emissiveIntensity: 1.5 })); d.position.set(lx - (lw - 0.14) / 2 + dio * (lw - 0.14) / 9, h - 0.514, oz - dd / 2 + 0.08 + bar2 * (dd - 0.16) / 3); world.lampGroup.add(d); } } }
          else { var refl = new THREE.Mesh(new THREE.BoxGeometry(lw - 0.04, 0.02, dd - 0.04), lampMat); refl.position.set(lx, h - 0.51, oz); world.lampGroup.add(refl); var tube = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, lw - 0.2, 10), glowMat(0xffd080, 2.2)); tube.rotation.z = Math.PI / 2; tube.position.set(lx, h - 0.53, oz); world.lampGroup.add(tube); var ball = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.12), MAT.plastic); ball.position.set(lx + lw / 2 + 0.1, h - 0.46, oz); world.lampGroup.add(ball); }
        }
      }
      tentLight.color.setHex(L.color);
    }
    tentLight.intensity = L.intensity; tentLight.position.set(ox, h - 0.5, oz); tentLight.target.position.set(ox, 0, oz); tentLight.distance = 7; tentLight.angle = Math.PI / (li >= 2 ? 2.6 : 3.4);
    tentFill.color.setHex(li === 0 ? 0xfff1d0 : L.color); tentFill.intensity = li === 0 ? 0.45 : 0.35 + li * 0.35; tentFill.position.set(ox, h - 0.7, oz); tentFill.distance = Math.max(ts.w, ts.d) + 2;
    // thermometer / hygrometer on the back wall of the tent
    var hyg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.02), MAT.white); hyg.position.set(ox + ts.w / 2 - 0.4, 1.5, oz - ts.d / 2 + 0.04); g.add(hyg); var hs = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.04), new THREE.MeshBasicMaterial({ map: textTex(['24° 58%'], 160, 80, { size: 40, bg: '#101410', titleColor: '#6fdc8c', line: 'rgba(0,0,0,0)' }) })); hs.position.set(ox + ts.w / 2 - 0.4, 1.5, oz - ts.d / 2 + 0.051); g.add(hs);
    // pots
    for (var i = 0; i < ts.cols * ts.rows; i++) {
      var sp = slotPos(i); var hasPot = i < (S.supplies.pot || 0) || !!plantAtSlot(i);
      var slotG = new THREE.Group(); slotG.position.set(sp.x, 0, sp.z); g.add(slotG);
      if (hasPot) {
        var pm = makePot(slotG, S.potSoil[i] || plantAtSlot(i));
        interactable(pm.pot, { kind: 'slot', slot: i, label: 'Empty pot', tent: true }); pm.pot.userData.tent = true;
        world.obstacles.push({ x1: sp.x - 0.2, x2: sp.x + 0.2, z1: sp.z - 0.2, z2: sp.z + 0.2, tag: 'pot' });   // slim enough to squeeze between the rows of a packed tent
        if (S.upgrades.autowater) { var stake = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.2, 6), MAT.plastic); stake.position.set(0.15, 0.38, 0.1); slotG.add(stake); var dripper = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), MAT.plastic); dripper.position.set(0.15, 0.48, 0.1); slotG.add(dripper); }
      } else {
        var marker = new THREE.Mesh(new THREE.RingGeometry(0.18, 0.24, 24), MAT.highlight); marker.rotation.x = -Math.PI / 2; marker.position.y = 0.04; slotG.add(marker);
        var markerHit = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.5), MAT.none); markerHit.position.y = 0.15; slotG.add(markerHit);
        interactable(markerHit, { kind: 'slot', slot: i, label: 'Empty slot (no pot)', tent: true, noPot: true }); markerHit.userData.tent = true;
      }
      slotG.userData.slot = i;
    }
    // drip lines when auto-waterer owned: a manifold along the back with a feed line to every pot, and the reservoir
    if (S.upgrades.autowater) {
      var tubeM = colorMat(0x222a33, 0.6); var tube = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, ts.w - 0.3, 6), tubeM); tube.rotation.z = Math.PI / 2; tube.position.set(ox, 0.36, oz - ts.d / 2 + 0.2); g.add(tube);
      for (var q = 0; q < ts.cols * ts.rows; q++) { var qp = slotPos(q); var len = qp.z + 0.1 - (oz - ts.d / 2 + 0.2); var ft = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, len, 5), tubeM); ft.rotation.x = Math.PI / 2; ft.position.set(qp.x + 0.15, 0.36, oz - ts.d / 2 + 0.2 + len / 2); g.add(ft); }
      var res = box(0.4, 0.6, 0.4, colorMat(0x2b6fb3, 0.4), ox + ts.w / 2 + 0.35, 0.3, oz - ts.d / 2 + 0.3, { parent: g }); box(0.42, 0.04, 0.42, colorMat(0x1f4f80, 0.5), ox + ts.w / 2 + 0.35, 0.62, oz - ts.d / 2 + 0.3, { parent: g }); box(0.14, 0.1, 0.1, MAT.plastic, ox + ts.w / 2 + 0.35, 0.69, oz - ts.d / 2 + 0.3, { parent: g });
      var lvl = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.4), new THREE.MeshBasicMaterial({ color: 0x9fd8ff })); lvl.position.set(ox + ts.w / 2 + 0.35, 0.3, oz - ts.d / 2 + 0.505); g.add(lvl);
      world.obstacles.push({ x1: ox + ts.w / 2 + 0.1, x2: ox + ts.w / 2 + 0.6, z1: oz - ts.d / 2 + 0.05, z2: oz - ts.d / 2 + 0.55, tag: 'tent' });
    }
    // security camera when owned
    if (S.upgrades.security) { var cam = box(0.16, 0.1, 0.24, MAT.black, ox + ts.w / 2 - 0.15, h - 0.15, oz + ts.d / 2 - 0.15, { parent: g }); cam.rotation.y = -0.6; var lens = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.04, 12), MAT.black); lens.rotation.x = Math.PI / 2; lens.rotation.y = -0.6; lens.position.set(ox + ts.w / 2 - 0.22, h - 0.15, oz + ts.d / 2 - 0.05); g.add(lens); var led = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), glowMat(0xff0000, 2)); led.position.set(ox + ts.w / 2 - 0.05, h - 0.15, oz + ts.d / 2 - 0.05); g.add(led); }
    // tent sign
    var tentSign = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.5), new THREE.MeshBasicMaterial({ map: textTex(['GROW TENT', ts.cols * ts.rows + ' slots · ' + L.name], 512, 170, { size: 40, titleColor: '#6fdc8c' }), transparent: true })); tentSign.position.set(ox, h - 0.2, oz + ts.d / 2 + 0.03); g.add(tentSign);
    g.traverse(function (o) { if (o.isMesh) o.userData.propId = 'tent'; });
    // rebuild plants
    for (var pid in world.plants) { var pm2 = world.plants[pid]; if (pm2.parent) pm2.parent.remove(pm2); }
    world.plants = {};
    syncPlants();
  }

  // ── Plant meshes: stem with nodes, paired fan leaves, side branches, colas, hazards, label ──
  var LEAF_GEO = new THREE.PlaneGeometry(0.24, 0.46); LEAF_GEO.translate(0, 0.2, 0);
  var LEAF_GEO_SM = new THREE.PlaneGeometry(0.15, 0.3); LEAF_GEO_SM.translate(0, 0.13, 0);
  var BUD_GEO = new THREE.IcosahedronGeometry(0.05, 1);
  function makePlantMesh(p) {
    var st = strainById(p.strain); var g = new THREE.Group();
    var stemM = MAT.stem.clone(); stemM.color.setHex(st.leaf).lerp(new THREE.Color(0x6a5a3a), 0.35);
    var stem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.024, 1, 10), stemM); stem.castShadow = true; g.add(stem);
    var leafMat = MAT.leaf.clone(); leafMat.color.setHex(st.leaf); g.userData.leafMat = leafMat;
    var leaves = new THREE.Group(); g.add(leaves);
    // nodes climb the stem; each carries two opposite fan leaves and, higher up, a short side branch with its own leaf
    var NODES = 7;
    for (var i = 0; i < NODES; i++) {
      var node = new THREE.Group(); node.rotation.y = i * 2.4 + Math.random() * 0.3; node.userData.h = 0.12 + (i / (NODES - 1)) * 0.82; node.userData.order = i; leaves.add(node);
      [0, Math.PI].forEach(function (side) {
        var holder = new THREE.Group(); holder.rotation.y = side; node.add(holder);
        var lf = new THREE.Mesh(LEAF_GEO, leafMat); lf.castShadow = true; lf.position.set(0, 0, 0.02); lf.rotation.x = -1.0 - Math.random() * 0.3; holder.add(lf); holder.userData.tilt = lf;
        var petiole = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.006, 0.12, 5), stemM); petiole.position.set(0, 0.02, 0.06); petiole.rotation.x = -1.1; holder.add(petiole);
      });
      if (i >= 2) {
        var br = new THREE.Group(); br.rotation.y = Math.PI / 2 + Math.random() * 0.4; node.add(br); node.userData.branch = br;
        var bl = 0.14 + (NODES - i) * 0.03; var bs = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.009, bl, 6), stemM); bs.position.set(0, bl * 0.35, bl * 0.35); bs.rotation.x = -0.8; br.add(bs);
        var bh = new THREE.Group(); bh.position.set(0, bl * 0.7, bl * 0.7); br.add(bh); var blf = new THREE.Mesh(LEAF_GEO_SM, leafMat); blf.rotation.x = -0.9; blf.castShadow = true; bh.add(blf); bh.userData.tilt = blf;
        var sb = new THREE.Group(); sb.position.copy(bh.position); br.add(sb); node.userData.sideBuds = sb;
        for (var q2 = 0; q2 < 3; q2++) { var sbud = new THREE.Mesh(BUD_GEO, null); sbud.position.set((Math.random() - 0.5) * 0.04, q2 * 0.035, (Math.random() - 0.5) * 0.04); sbud.userData.base = sbud.position.clone(); sb.add(sbud); }
      }
    }
    g.userData.leaves = leaves;
    // main cola: a stack of calyx clusters with pistils, denser toward the top
    var buds = new THREE.Group(); g.add(buds);
    var budMat = MAT.bud.clone(); budMat.color.setHex(st.bud); g.userData.budMat = budMat;
    var hairMat = new THREE.MeshStandardMaterial({ color: st.hair, roughness: 1 }); g.userData.hairMat = hairMat;
    for (var b = 0; b < 9; b++) {
      var bud = new THREE.Mesh(BUD_GEO, budMat); bud.castShadow = true;
      bud.position.set((Math.random() - 0.5) * 0.09, 0.72 + b * 0.04, (Math.random() - 0.5) * 0.09); bud.userData.base = bud.position.clone(); bud.userData.rs = 0.75 + Math.random() * 0.5;
      for (var hh = 0; hh < 3; hh++) { var hair = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.05, 5), hairMat); var ha = Math.random() * 6.28; hair.position.set(Math.cos(ha) * 0.04, 0.01 + Math.random() * 0.03, Math.sin(ha) * 0.04); hair.rotation.set(Math.random() - 0.5, 0, Math.random() - 0.5); bud.add(hair); }
      var sugar = new THREE.Mesh(LEAF_GEO_SM, leafMat); sugar.scale.set(0.45, 0.45, 0.45); sugar.position.set(0.03, -0.02, 0); sugar.rotation.set(-0.6, Math.random() * 6.28, 0); bud.add(sugar);
      buds.add(bud);
    }
    g.userData.buds = buds;
    g.traverse(function (o) { if (o.isMesh && o.material === null) o.material = budMat; });
    // trichome sparkle when ready
    var spN = 40, spPos = new Float32Array(spN * 3); for (var s = 0; s < spN; s++) { spPos[s * 3] = (Math.random() - 0.5) * 0.24; spPos[s * 3 + 1] = Math.random() * 0.4; spPos[s * 3 + 2] = (Math.random() - 0.5) * 0.24; }
    var spGeo = new THREE.BufferGeometry(); spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3));
    var sparkle = new THREE.Points(spGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.018, transparent: true, opacity: 0.0, depthWrite: false })); sparkle.visible = false; g.add(sparkle); g.userData.sparkle = sparkle;
    // hazard visuals
    var pests = new THREE.Group(); g.add(pests);
    for (var k = 0; k < 12; k++) { var m = new THREE.Mesh(new THREE.SphereGeometry(0.011, 6, 6), colorMat(0x3a2a1a, 1)); m.scale.set(1, 0.7, 1.3); m.userData.a = Math.random() * 6.28; m.userData.r = 0.1 + Math.random() * 0.2; m.userData.h = 0.2 + Math.random() * 0.6; pests.add(m); }
    var web = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false })); web.position.set(0.1, 0.5, 0.1); web.rotation.set(-0.4, 0.5, 0.3); pests.add(web);
    pests.visible = false; g.userData.pests = pests;
    var mold = new THREE.Group(); g.add(mold);
    for (var q = 0; q < 8; q++) { var mm = new THREE.Mesh(new THREE.SphereGeometry(0.04 + Math.random() * 0.03, 8, 8), new THREE.MeshStandardMaterial({ color: 0xd8dcd0, roughness: 1, transparent: true, opacity: 0.85 })); mm.scale.y = 0.5; mm.position.set((Math.random() - 0.5) * 0.24, 0.3 + Math.random() * 0.55, (Math.random() - 0.5) * 0.24); mold.add(mm); }
    mold.visible = false; g.userData.mold = mold;
    // status label sprite
    var label = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTex([''], 8, 8), transparent: true, depthWrite: false })); label.scale.set(0.9, 0.36, 1); label.position.y = 1.55; g.add(label); g.userData.label = label; g.userData.labelKey = '';
    g.userData.plantId = p.id;
    return g;
  }
  function syncPlants() {
    // ensure every plant has a mesh in the right slot; remove stale
    var seen = {};
    for (var i = 0; i < S.plants.length; i++) {
      var p = S.plants[i]; seen[p.id] = true; var sp = slotPos(p.slot);
      var m = world.plants[p.id];
      if (!m) { m = makePlantMesh(p); world.plants[p.id] = m; world.tentGroup.add(m); interactable(m.children[0], { kind: 'plant', pid: p.id, tent: true }); m.children[0].userData.tent = true; m.userData.hit = m.children[0]; }
      m.position.set(sp.x, 0.3, sp.z);
      m.userData.slot = p.slot;
    }
    for (var pid in world.plants) if (!seen[pid]) { var mm = world.plants[pid]; world.tentGroup.remove(mm); disposeTree(mm); world.interact = world.interact.filter(function (x) { return x !== mm.userData.hit; }); delete world.plants[pid]; }
  }
  var _thirstCol = new THREE.Color(0x9a8a3a), _moldCol = new THREE.Color(0x777766);
  function updatePlantVisuals(dt) {
    world.time += dt;
    for (var i = 0; i < S.plants.length; i++) {
      var p = S.plants[i]; var m = world.plants[p.id]; if (!m) continue;
      var pr = p.progress; var st = strainById(p.strain);
      var height = 0.08 + pr * 0.95;
      var stem = m.children[0]; stem.scale.set(0.5 + pr * 0.9, height, 0.5 + pr * 0.9); stem.position.y = height / 2;
      var droop = S.upgrades.autowater ? 0 : p.thirst;
      var leaves = m.userData.leaves; var nNodes = Math.floor(1 + pr * 7.5);
      for (var k = 0; k < leaves.children.length; k++) {
        var node = leaves.children[k]; var on = k < nNodes && pr > 0.05; node.visible = on; if (!on) continue;
        var y = Math.min(height - 0.02, node.userData.h * height * 1.05); node.position.y = y;
        var age = clamp((pr * 7.5 - k) / 1.5, 0.15, 1); var sc = age * (0.45 + pr * 0.75) * (1 - k / 16); node.scale.set(sc, sc, sc);
        for (var c = 0; c < node.children.length; c++) { var h = node.children[c]; if (h.userData.tilt) h.userData.tilt.rotation.x = -1.0 - droop * 0.9 + Math.sin(world.time * 1.3 + k + c) * 0.05; }
        if (node.userData.branch) { node.userData.branch.visible = pr > 0.35; var bh = node.userData.branch.children[1]; if (bh && bh.userData.tilt) bh.userData.tilt.rotation.x = -0.9 - droop * 0.8 + Math.sin(world.time * 1.1 + k) * 0.05; }
      }
      m.userData.leafMat.color.setHex(st.leaf); if (droop > 0.6) m.userData.leafMat.color.lerp(_thirstCol, (droop - 0.6) * 1.5); if (p.hazard === 'mold') m.userData.leafMat.color.lerp(_moldCol, 0.5);
      var flowerT = clamp((pr - 0.62) / 0.38, 0, 1); var buds = m.userData.buds; buds.visible = flowerT > 0;
      var ready = pr >= 1; var pulse = ready ? 1 + Math.sin(world.time * 3) * 0.05 : 1;
      if (buds.visible) {
        for (var b = 0; b < buds.children.length; b++) { var bud = buds.children[b]; var t = clamp(flowerT * 1.5 - b * 0.06, 0, 1); bud.visible = t > 0; var s = (0.45 + t * 1.25) * pulse * (0.8 + p.quality / 250) * bud.userData.rs * (1 - b * 0.04); bud.scale.set(s, s * 1.25, s); bud.position.copy(bud.userData.base).multiplyScalar(0.5 + flowerT * 0.6).setY(height * 0.6 + b * 0.05 * height); }
        for (var k2 = 0; k2 < leaves.children.length; k2++) { var nd = leaves.children[k2]; if (!nd.userData.sideBuds) continue; var sb = nd.userData.sideBuds; sb.visible = nd.visible && k2 >= 3 && flowerT > 0.2; if (sb.visible) { var ss = clamp((flowerT - 0.2) * 1.4, 0, 1) * 0.8 * pulse; sb.scale.set(ss, ss, ss); } }
        m.userData.budMat.emissive.setHex(ready ? st.bud : 0x000000); m.userData.budMat.emissiveIntensity = ready ? 0.3 + Math.sin(world.time * 3) * 0.12 : 0;
      } else { for (var k3 = 0; k3 < leaves.children.length; k3++) if (leaves.children[k3].userData.sideBuds) leaves.children[k3].userData.sideBuds.visible = false; }
      var sp = m.userData.sparkle; sp.visible = ready; if (ready) { sp.position.y = height * 0.6; sp.material.opacity = 0.35 + Math.sin(world.time * 7) * 0.3; sp.rotation.y += dt * 0.6; }
      var pests = m.userData.pests; pests.visible = p.hazard === 'pest';
      if (pests.visible) for (var q = 0; q < pests.children.length - 1; q++) { var pm = pests.children[q]; var a = pm.userData.a + world.time * 2.2; pm.position.set(Math.cos(a) * pm.userData.r, pm.userData.h * height, Math.sin(a) * pm.userData.r); pm.rotation.y = -a; }
      m.userData.mold.visible = p.hazard === 'mold';
      // label
      var sg = stageFor(pr); var key = sg.key + '|' + Math.round(pr * 100) + '|' + Math.round(p.quality) + '|' + (p.hazard || '') + '|' + (droop > 0.6 ? 't' : '') + '|' + (p.fed ? 'f' : '');
      if (key !== m.userData.labelKey) {
        m.userData.labelKey = key;
        var lines = [st.emoji + ' ' + st.name, (pr >= 1 ? '✓ ready' : sg.label + ' ' + Math.round(pr * 100) + '%') + ' · q' + Math.round(p.quality)];
        var extra = []; if (p.hazard) extra.push(p.hazard === 'pest' ? '⚠ pests' : '⚠ mould'); if (droop > 0.6) extra.push('💧 thirsty'); if (p.fed) extra.push('🧪 fed');
        if (extra.length) lines.push(extra.join('  '));
        var old = m.userData.label.material.map; m.userData.label.material.map = textTex(lines, 512, lines.length > 2 ? 230 : 170, { size: 40, titleColor: pr >= 1 ? '#6fdc8c' : '#e8f1ea', line: p.hazard ? 'rgba(255,107,107,.7)' : pr >= 1 ? 'rgba(111,220,140,.8)' : 'rgba(111,220,140,.35)' }); m.userData.label.material.needsUpdate = true; if (old) old.dispose();
        m.userData.label.scale.set(1.0, lines.length > 2 ? 0.45 : 0.33, 1);
      }
      m.userData.label.position.y = height + 0.45;
      var dxp = m.position.x - player.pos.x, dzp = m.position.z - player.pos.z; m.userData.label.visible = (dxp * dxp + dzp * dzp) < 30;
    }
  }
  // ── Shelf / line contents (batches) ───────────────────────────────
  // ── Shelf, drying rack and bench contents (synced from the save) ──
  // the goods shelf contents: cells per strain (2 columns x 3 rows), bags stacked left, joints in a tube right, a price card above
  var GOODS_ROWS = 3, GOODS_CELL = 0.85;
  function goodsCols() { return Math.max(2, Math.ceil(STRAINS.length / GOODS_ROWS)); }   // three shelves high, as wide as it needs to be
  function goodsWidth() { return goodsCols() * GOODS_CELL; }
  function syncGoods() {
    var inst = propInst.goodsShelf; if (!inst) return;
    var gg = inst.ctx.dynGroup(); var gate = gg.userData.shutter; clearKids(gg); if (gate) gg.add(gate);   /* restocking must not throw the roll gate away with the goods */
    world.interact = world.interact.filter(function (m) { return m.userData.dynGroup !== 'goods'; });
    var cellW = 0.8, cellY = [0.185, 0.76, 1.32], cols = goodsCols();
    STRAINS.forEach(function (st, i) {
      var col = i % cols, row = Math.floor(i / cols); if (row > GOODS_ROWS - 1) return;
      var cx = (col - (cols - 1) / 2) * GOODS_CELL, cy = cellY[2 - row]; var bags = lotOf('bags', st.id), joints = lotOf('joints', st.id), stash = stashOf(st.id);
      var cookies = lotOf('cookies', st.id); var any = bags.n > 0 || joints.n > 0 || cookies.n > 0 || stash.g > 0;
      // price card on the back panel
      var bq = bags.n ? bags.qSum / bags.n : 0, jq = joints.n ? joints.qSum / joints.n : 0;
      var lines = [st.emoji + ' ' + st.name, any ? ('bags ' + bags.n + (bags.n ? ' · ' + money(bagPrice(bq, bags.thcSum / bags.n)) : '') + '   joints ' + joints.n + (joints.n ? ' · ' + money(jointPrice(jq, joints.thcSum / joints.n)) : '') + (cookies.n ? '   cookies ' + cookies.n + ' · ' + money(cookiePrice(cookies.qSum / cookies.n, cookies.thcSum / cookies.n)) : '')) : 'sold out'];
      var card = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.12), new THREE.MeshBasicMaterial({ map: textTex(lines, 448, 78, { size: 26, bg: any ? '#f3e9cf' : '#d9d2c2', color: '#222', titleColor: any ? '#1a6a2a' : '#666', line: 'rgba(0,0,0,0)' }), transparent: true, side: THREE.DoubleSide })); card.position.set(cx, cy - 0.075, 0.222); card.rotation.x = -0.35; gg.add(card);   // price tag hangs off the front lip of each shelf, tilted up so the low rows read from standing height
      // bags: stacked flat, three per layer
      for (var b = 0; b < Math.min(bags.n, 9); b++) { var bm = productBaggie(st, 1.15); bm.position.set(cx - 0.26 + (b % 3) * 0.11, cy + 0.05 + Math.floor(b / 3) * 0.05, 0.02 + (b % 2) * 0.03); bm.rotation.set(-1.35, (b % 3 - 1) * 0.12, 0); gg.add(bm); }   /* the same baggie the customer is handed */
      if (bags.n > 0) { var bh = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.28, 0.3), MAT.none); bh.position.set(cx - 0.16, cy + 0.14, 0.02); gg.add(bh); interactable(bh, { kind: 'lot', item: 'bags', strain: st.id }); bh.userData.dynGroup = 'goods'; bh.userData.propId = 'goodsShelf'; }
      // cookies: a small jar in the middle of the cell
      if (cookies.n > 0) { var cj = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.14, 14, 1, true), MAT.jar); cj.position.set(cx + 0.02, cy + 0.07, 0.06); gg.add(cj); var cjl = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.015, 14), MAT.jarLid); cjl.position.set(cx + 0.02, cy + 0.145, 0.06); gg.add(cjl); for (var ck2 = 0; ck2 < Math.min(cookies.n, 6); ck2++) { var cm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.012, 10), colorMat(0xb5763a, 0.9)); cm.position.set(cx + 0.02, cy + 0.012 + ck2 * 0.018, 0.06); cm.rotation.y = ck2 * 0.5; gg.add(cm); } var ch = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.2, 0.16), MAT.none); ch.position.set(cx + 0.02, cy + 0.1, 0.06); gg.add(ch); interactable(ch, { kind: 'lot', item: 'cookies', strain: st.id }); ch.userData.dynGroup = 'goods'; ch.userData.propId = 'goodsShelf'; }
      // joints: standing in a glass tube
      var tube = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.2, 14, 1, true), MAT.jar); tube.position.set(cx + 0.2, cy + 0.1, 0.03); gg.add(tube);
      var tbase = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.015, 14), MAT.darkwood); tbase.position.set(cx + 0.2, cy + 0.008, 0.03); gg.add(tbase);
      for (var j = 0; j < Math.min(joints.n, 12); j++) { var ja = j / 12 * Math.PI * 2, jr = j < 6 ? 0.02 : 0.04; var jm = productJoint(1.7); jm.position.set(cx + 0.2 + Math.cos(ja) * jr, cy + 0.1, 0.03 + Math.sin(ja) * jr); jm.rotation.z = (j % 2 ? 1 : -1) * 0.08; gg.add(jm); }
      if (joints.n > 0) { var jh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.3), MAT.none); jh.position.set(cx + 0.2, cy + 0.14, 0.02); gg.add(jh); interactable(jh, { kind: 'lot', item: 'joints', strain: st.id }); jh.userData.dynGroup = 'goods'; jh.userData.propId = 'goodsShelf'; }
    });
    gg.traverse(function (o) { if (o.isMesh) o.userData.propId = o.userData.propId || 'goodsShelf'; });
  }
  // ── The storage racking: four levels of six bays (A1 at the bottom left to D6 at the top right). An item keeps
  // its bay while any of it is in stock, so crates never shuffle along when one runs out, and every bay has its
  // label plate on the beam below it. Crates go back up by hand (E with a crate) and come down one at a time.
  var RACK = { cols: 6, y: [0.12, 0.66, 1.2, 1.74], w: 3.0 };   /* 3 m long: it fits the annex wall to wall */
  function rackBayX(i) { return -RACK.w / 2 + RACK.w / RACK.cols * (i % RACK.cols + 0.5); }
  function rackBayY(i) { return RACK.y[Math.floor(i / RACK.cols)]; }
  function rackBayCode(i) { return 'ABCD'.charAt(Math.floor(i / RACK.cols)) + (i % RACK.cols + 1); }
  function rackBays() {   // item -> bay, kept in the save; a bay is freed when its item runs out
    var X = xs(); if (!X.bays || typeof X.bays !== 'object') X.bays = {};
    var B = X.bays, n = RACK.cols * RACK.y.length;
    Object.keys(B).forEach(function (k) { if (!((S.storage[k] || 0) > 0) || !(B[k] >= 0 && B[k] < n)) delete B[k]; });
    Object.keys(S.storage).forEach(function (k) {
      if (!((S.storage[k] || 0) > 0) || B[k] !== undefined) return;
      var used = {}; Object.keys(B).forEach(function (q) { used[B[q]] = true; });
      for (var i = 0; i < n; i++) if (!used[i]) { B[k] = i; break; }
    });
    return B;
  }
  function rackFront(k) {   // where to stand to reach an item's bay
    var i = rackBays()[k]; if (i === undefined || !propInst.storeRack) return { x: WP.annex.x, z: WP.annex.z };
    var v = propWorld('storeRack', rackBayX(i), 0.8); return { x: v.x, z: v.z };
  }
  function rackCrate() {   // the crate in your hands goes back up, into its item's bay
    var h = held(); if (!h || h.kind !== 'crate') return false;
    S.storage[h.item] = (S.storage[h.item] || 0) + h.n; S.held = null; world.dirtyStorage = true;
    var i = rackBays()[h.item]; sfx('putdown');
    toast('📦 Racked ' + h.n + ' × ' + itemName(h.item) + (i !== undefined ? ' in bay ' + rackBayCode(i) : ' (the racking is full, so it is in the stock list)'), 'good'); save();
    return true;
  }
  function crateMesh(id, w, h, d) {   // a taped kraft carton with the item's icon on its face
    var G = new THREE.Group();
    var body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), prodMat('crateKraft', function () { return new THREE.MeshStandardMaterial({ color: 0xa8804a, roughness: 0.9 }); })); body.castShadow = true; G.add(body);
    var tape = new THREE.Mesh(new THREE.BoxGeometry(w + 0.01, 0.025, d + 0.01), prodMat('crateTape', function () { return new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.9 }); })); G.add(tape);
    var face = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w, h) * 0.7, Math.min(w, h) * 0.7), prodMat('crateIco' + id, function () { return new THREE.MeshBasicMaterial({ map: textTex([itemIcon(id)], 96, 96, { size: 64, bg: '#f3e9cf', line: 'rgba(0,0,0,0)' }), transparent: true }); }));
    face.position.z = d / 2 + 0.002; G.add(face);
    return G;
  }
  function syncStorage() {
    var inst = propInst.storeRack; if (!inst) return;
    var gg = inst.ctx.dynGroup(); clearKids(gg);
    world.interact = world.interact.filter(function (m) { return m.userData.dynGroup !== 'storage'; });
    var B = rackBays(), byBay = {}; Object.keys(B).forEach(function (k) { byBay[B[k]] = k; });
    var plateOpt = { size: 30, bg: '#f7f3e6', color: '#1c1f24', titleColor: '#1c1f24', line: 'rgba(0,0,0,0)' };
    for (var i = 0; i < RACK.cols * RACK.y.length; i++) {
      var x = rackBayX(i), y = rackBayY(i), id = byBay[i], code = rackBayCode(i);
      var plateM = id ? new THREE.MeshBasicMaterial({ map: textTex([code + '  ' + itemIcon(id) + ' ' + itemName(id) + '  ×' + S.storage[id]], 500, 90, plateOpt) })
        : prodMat('bayPlate' + code, function () { return new THREE.MeshBasicMaterial({ map: textTex([code + '  empty'], 500, 90, Object.assign({}, plateOpt, { color: '#8a8f96', titleColor: '#8a8f96' })) }); });
      var plate = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.09), plateM); plate.position.set(x, y - 0.035, 0.296); gg.add(plate);
      if (!id) continue;
      var stacks = Math.min(2, Math.ceil(S.storage[id] / itemPack(id)));
      for (var s = 0; s < stacks; s++) { var cr = crateMesh(id, 0.36, 0.2, 0.3); cr.position.set(x, y + 0.11 + s * 0.21, 0.04); gg.add(cr); }
      var hit = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.21 * stacks + 0.1, 0.42), MAT.none); hit.position.set(x, y + 0.105 * stacks + 0.05, 0.02); gg.add(hit); interactable(hit, { kind: 'storeItem', item: id, bay: i }); hit.userData.dynGroup = 'storage'; hit.userData.propId = 'storeRack';
    }
    gg.traverse(function (o) { if (o.isMesh) o.userData.propId = o.userData.propId || 'storeRack'; });
  }
  function syncDisplay() {
    var dg = world.displayGroup; if (!dg) return; clearKids(dg); var d = S.display || {};
    for (var i = 0; i < Math.min(d.lighter || 0, 8); i++) { var lt = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.07, 0.012), colorMat([0xc94a3a, 0x2f6b9a, 0x3aa36a, 0xffd166, 0xf2f2f2, 0x7a5aa8][i % 6], 0.4)); lt.position.set(0.73 + i * 0.045, 1.12, 4.32); dg.add(lt); var cap = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.015, 0.012), MAT.chrome); cap.position.set(0.73 + i * 0.045, 1.163, 4.32); dg.add(cap); }
    for (var p = 0; p < Math.min(d.rpaper || 0, 5); p++) { var pk = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.075, 0.012), colorMat(p % 2 ? 0xf5f0e0 : 0xd9b36a, 0.8)); pk.position.set(0.75 + p * 0.065, 1.195, 4.18); pk.rotation.x = 0.15; dg.add(pk); }
    for (var q = 0; q < Math.min(d.rgrinder || 0, 3); q++) { var gr = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.03, 12), colorMat([0x2a2d33, 0x8a6a2a, 0x3a3f46][q], 0.4, 0.6)); gr.position.set(1.07 + q * 0.065, 1.1, 4.3); dg.add(gr); }
    dg.traverse(function (o) { if (o.isMesh) { o.castShadow = false; o.userData.propId = 'counter'; } });
  }
  function syncShelf() {
    if (!propInst.cureShelf || !propInst.dryRack || !propInst.bench) return;
    var g = propInst.cureShelf.ctx.dynGroup(); clearKids(g);
    var lg = propInst.dryRack.ctx.dynGroup(); clearKids(lg);
    var bg = propInst.bench.ctx.dynGroup(); clearKids(bg);
    world.interact = world.interact.filter(function (m) { return m.userData.dynGroup !== 'shelf' && m.userData.dynGroup !== 'bench'; });
    syncGoods(); syncStorage(); syncDisplay();
    var jarsOwned = S.supplies.jar || 0;
    var cured = S.batches.filter(function (b) { return b.cured; }); var drying = S.batches.filter(function (b) { return !b.cured; });
    var total = Math.max(jarsOwned, cured.length);
    for (var i = 0; i < Math.min(total, 24); i++) {
      var row = Math.floor(i / 6), col = i % 6; var x = -1.25 + col * 0.5, y = 0.52 + row * 0.55, z = 0;
      var filled = i < cured.length;
      var jar = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.2, 14), MAT.jar); jar.position.set(x, y + 0.1, z); g.add(jar);
      if (filled) { var jh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.3, 0.24), MAT.none); jh.position.set(x, y + 0.12, z); g.add(jh); interactable(jh, { kind: 'jar', bid: cured[i].id }); jh.userData.dynGroup = 'shelf'; jh.userData.propId = 'cureShelf'; }
      var lid = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.025, 14), MAT.jarLid); lid.position.set(x, y + 0.21, z); g.add(lid);
      if (filled) { var b = cured[i]; var bst2 = strainById(b.strain || 'sunflower'), fl2 = clamp(b.grams / 24, 0.3, 1); var nugM2 = prodMat('jarnug' + bst2.id, function () { return new THREE.MeshStandardMaterial({ color: bst2.bud, roughness: 0.9 }); }); var nugD2 = prodMat('jarnugd' + bst2.id, function () { return new THREE.MeshStandardMaterial({ color: mixHex(bst2.bud, 0x30401f, 0.38), roughness: 0.95 }); }); for (var nz2 = 0; nz2 < Math.round(5 + fl2 * 13); nz2++) { var na2 = nz2 * 2.399, nr2 = 0.05 * Math.sqrt(((nz2 % 7) / 7) + 0.14); var nm2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.019 + (nz2 % 3) * 0.005, 0), nz2 % 4 === 0 ? nugD2 : nugM2); nm2.position.set(x + Math.cos(na2) * nr2, y + 0.025 + (nz2 % 5) * 0.026 * fl2, z + Math.sin(na2) * nr2); nm2.scale.set(1, 0.8, 1); nm2.rotation.set(na2, na2 * 1.7, 0.3); nm2.castShadow = false; g.add(nm2); } var waits = i >= cureSlots(); var lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.06), new THREE.MeshBasicMaterial({ map: textTex(waits ? [gram(b.grams) + ' q' + Math.round(b.quality), 'waiting for a jar'] : [gram(b.grams) + ' q' + Math.round(b.quality)], 160, 60, { size: waits ? 18 : 30, bg: waits ? '#f3d9b0' : '#f3e9cf', color: '#222', titleColor: '#222', line: 'rgba(0,0,0,0)' }) })); lbl.position.set(x, y + 0.1, z + 0.095); g.add(lbl); }
    }
    if (S.upgrades.rack) { var rack = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.02, 0.45), MAT.metal); rack.position.set(0, 2.75, 0); g.add(rack); }
    var hw = 3.25, ly = 2.1; var n = drying.length;
    for (var d = 0; d < n; d++) {
      var bx = -hw + 0.4 + (d % 14) * ((hw * 2 - 0.8) / 13); var b2 = drying[d];
      var peg = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.07, 0.015), new THREE.MeshStandardMaterial({ color: 0xd9c9a0 })); peg.position.set(bx, ly - 0.14, 0); lg.add(peg);
      var str = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.12, 4), MAT.rope); str.position.set(bx, ly - 0.23, 0); lg.add(str);
      var bunch = new THREE.Group(); bunch.position.set(bx, ly - 0.3, 0); lg.add(bunch);
      var col2 = strainById(b2.strain || 'sunflower');
      for (var k = 0; k < 5; k++) { var bb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.05 + Math.random() * 0.03, 1), new THREE.MeshStandardMaterial({ color: col2.bud, roughness: 1 })); bb.position.set((Math.random() - 0.5) * 0.08, -k * 0.07, (Math.random() - 0.5) * 0.08); bb.castShadow = true; bunch.add(bb); }
      var lp = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.3), MAT.leaf); lp.position.set(0.02, -0.2, 0.03); lp.rotation.x = Math.PI; bunch.add(lp);
    }
    // bench contents (local: bench runs along x, working side is +z; the stash jar sits left, packed goods pile right)
    var by = 0.93;
    if (S.supplies.grinder) { var gr = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 20), MAT.chrome); gr.position.set(-0.45, by + 0.025, 0.1); bg.add(gr); var grTop = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 20), colorMat(0x3a3f46, 0.4, 0.6)); grTop.position.set(-0.45, by + 0.06, 0.1); bg.add(grTop); for (var gt = 0; gt < 8; gt++) { var tooth = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.012), MAT.chrome); var ga = gt / 8 * Math.PI * 2; tooth.position.set(-0.45 + Math.cos(ga) * 0.035, by + 0.075, 0.1 + Math.sin(ga) * 0.035); bg.add(tooth); } var gl = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.03), new THREE.MeshBasicMaterial({ map: textTex(['GRIND'], 80, 30, { size: 20, bg: 'rgba(0,0,0,0)', color: '#e8f1ea', titleColor: '#e8f1ea', line: 'rgba(0,0,0,0)' }), transparent: true })); gl.position.set(-0.45, by + 0.025, 0.161); bg.add(gl); }
    if (S.upgrades.roller) { var rm = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.22), colorMat(0x2a2d33, 0.4, 0.3)); rm.position.set(0.55, by + 0.07, -0.05); bg.add(rm); var rmTop = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.18), MAT.chrome); rmTop.position.set(0.55, by + 0.15, -0.05); bg.add(rmTop); var slot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.03), MAT.black); slot.position.set(0.55, by + 0.1, 0.07); bg.add(slot); var rmled = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), glowMat(0x00ff66, 2)); rmled.position.set(0.68, by + 0.12, 0.065); bg.add(rmled); }
    if ((S.supplies.bag || 0) > 0) { var bagbox = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.1), colorMat(0xe8e8ee, 0.6)); bagbox.position.set(-0.15, by + 0.05, -0.22); bg.add(bagbox); var bagLbl = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.05), new THREE.MeshBasicMaterial({ map: textTex(['BAGGIES'], 120, 50, { size: 24, bg: '#f3e9cf', color: '#222', titleColor: '#222', line: 'rgba(0,0,0,0)' }) })); bagLbl.position.set(-0.15, by + 0.05, -0.169); bg.add(bagLbl); }
    if ((S.supplies.paper || 0) > 0) { var pp = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.05), colorMat(0xffffff, 0.6)); pp.position.set(0.05, by + 0.01, -0.22); bg.add(pp); var pp2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.02, 0.05), colorMat(0xd8c8a0, 0.6)); pp2.position.set(0.14, by + 0.01, -0.2); pp2.rotation.y = 0.3; bg.add(pp2); }
    var toShelf = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.07), new THREE.MeshBasicMaterial({ map: textTex(['packed goods → shelf'], 300, 70, { size: 24, bg: '#f3e9cf', color: '#222', titleColor: '#1a6a2a', line: 'rgba(0,0,0,0)' }), transparent: true })); toShelf.position.set(1.0, by + 0.001, 0.2); toShelf.rotation.x = -Math.PI / 2; bg.add(toShelf);
    var stash = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.26, 20), MAT.jar); stash.position.set(-0.85, by + 0.13, -0.12); bg.add(stash); var stashLid = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.03, 20), MAT.jarLid); stashLid.position.set(-0.85, by + 0.275, -0.12); bg.add(stashLid);
    if (S.cured.g > 0) { var fill = clamp(S.cured.g / 60, 0.08, 1); var sm = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.22 * fill, 14), MAT.bud); sm.position.set(-0.85, by + 0.02 + 0.11 * fill, -0.12); bg.add(sm); }
    var stashLbl = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.07), new THREE.MeshBasicMaterial({ map: textTex(['STASH', gram(S.cured.g)], 160, 70, { size: 26, bg: '#f3e9cf', color: '#222', titleColor: '#1a6a2a', line: 'rgba(0,0,0,0)' }), transparent: true })); stashLbl.position.set(-0.85, by + 0.12, -0.12 + 0.111); bg.add(stashLbl);
    bg.traverse(function (o) { if (o.isMesh) o.userData.propId = o.userData.propId || 'bench'; }); g.traverse(function (o) { if (o.isMesh) o.userData.propId = o.userData.propId || 'cureShelf'; }); lg.traverse(function (o) { if (o.isMesh) o.userData.propId = o.userData.propId || 'dryRack'; });
  }


