//@ decoration, shop controls and the control cabinet
  // ── Decoration ─────────────────────────────────────────────────────
  function buildDecor() {
    box(2.6, 0.02, 2.0, new THREE.MeshStandardMaterial({ color: 0x3f4a3a, roughness: 1 }), -8.5, 0.01, 1.0, { cast: false });
    var neon = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.5), new THREE.MeshBasicMaterial({ map: textTex(['OPEN'], 384, 160, { size: 96, bold: true, titleColor: '#ff4d6d', bg: 'rgba(0,0,0,0)', line: 'rgba(0,0,0,0)' }), transparent: true })); neon.position.set(-3.5, 2.5, ROOM.z - 0.03); neon.rotation.y = Math.PI; world.group.add(neon); neonSign.open = neon;
    var neonL = new THREE.PointLight(0xff4d6d, 0.5, 4); neonL.position.set(-3.5, 2.4, ROOM.z - 0.4); scene.add(neonL); neonSign.light = neonL;
    var mat = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.8), new THREE.MeshStandardMaterial({ map: textTex(['WELCOME'], 448, 256, { size: 70, bold: true, bg: '#3a2a1e', color: '#e8dcc0', titleColor: '#e8dcc0', line: 'rgba(0,0,0,0)' }), roughness: 1 })); mat.rotation.x = -Math.PI / 2; mat.position.set(0, 0.03, 8.3); world.group.add(mat);
    signPlane(['NO PHOTOS', 'be cool · respect the crew'], 1.0, 0.36, 5.5, 2.4, 4.12, 0, { titleColor: '#ff6b6b' });
  }

  // ── Shop controls: open/closed, lights, radio, curtains, staff door ──
  function shop() { if (!S.shop) S.shop = { open: true, lights: true, radio: 'off', volume: 0.5, curtains: {}, staffDoor: false }; if (!S.shop.curtains) S.shop.curtains = {}; if (!S.shop.rooms) S.shop.rooms = {}; if (typeof S.shop.markup !== 'number') S.shop.markup = 1; if (typeof S.shop.volume !== 'number') S.shop.volume = 0.5; return S.shop; }
  var curtains = {}; var staffDoor = { g: null, t: 0, obstacle: null, leds: [] }; var neonSign = { open: null, closed: null, light: null };
  var CURTAIN_TEX = makeTex(256, 256, function (ctx, w, h) {
    for (var x = 0; x < w; x++) { var t = Math.sin(x / w * Math.PI * 14); var v = 60 + t * 22; ctx.fillStyle = 'rgb(' + Math.round(v * 0.35) + ',' + Math.round(v) + ',' + Math.round(v * 0.5) + ')'; ctx.fillRect(x, 0, 1, h); }
  }, [1, 1]);
  var CURTAIN_MAT = new THREE.MeshStandardMaterial({ map: CURTAIN_TEX, roughness: 1, side: THREE.DoubleSide });
  // a curtain hangs from a rod and slides toward its pivot end when opened
  function addCurtain(key, label, x, y, z, w, h, rotY) {
    var g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rotY || 0; world.group.add(g);
    var rod = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, w + 0.24, 10), MAT.chrome); rod.rotation.z = Math.PI / 2; rod.position.set(w / 2, h / 2 + 0.06, 0.05); g.add(rod);
    [0, w].forEach(function (rx) { var cap = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), MAT.chrome); cap.position.set(rx + (rx ? 0.12 : -0.12), h / 2 + 0.06, 0.05); g.add(cap); var br = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.09), MAT.chrome); br.position.set(rx + (rx ? 0.06 : -0.06), h / 2 + 0.06, 0.005); g.add(br); var bp = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.01), MAT.chrome); bp.position.set(rx + (rx ? 0.06 : -0.06), h / 2 + 0.06, -0.035); g.add(bp); });
    for (var rg = 0; rg <= 8; rg++) { var ring = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.005, 6, 12), MAT.chrome); ring.rotation.y = Math.PI / 2; ring.position.set(w * rg / 8, h / 2 + 0.06, 0.05); ring.userData.ringT = rg / 8; g.add(ring); }
    var cloth = new THREE.Mesh(new THREE.PlaneGeometry(w, h, 24, 1), CURTAIN_MAT.clone()); cloth.material.map = CURTAIN_TEX.clone(); cloth.material.map.needsUpdate = true; cloth.material.map.repeat.set(Math.max(1, Math.round(w * 1.5)), 1); cloth.position.set(w / 2, 0, 0.05); cloth.userData.soft = true; g.add(cloth);
    var cp = cloth.geometry.attributes.position; for (var vi = 0; vi < cp.count; vi++) { cp.setZ(vi, Math.sin((cp.getX(vi) / w + 0.5) * Math.PI * 2 * Math.max(2, Math.round(w * 1.5))) * 0.02); } cloth.geometry.computeVertexNormals();
    g.userData.rings = g.children.filter(function (o) { return o.userData.ringT !== undefined; });
    var hit = new THREE.Mesh(new THREE.BoxGeometry(w, h + 0.2, 0.25), MAT.none); hit.position.set(w / 2, 0.05, 0); g.add(hit); interactable(hit, { kind: 'curtain', key: key, label: label });
    curtains[key] = { g: g, cloth: cloth, w: w, t: shop().curtains[key] ? 0 : 1 }; // t: 1 = closed (drawn), 0 = open (bunched)
  }
  function curtainOpen(key) { return !!shop().curtains[key]; }
  function toggleCurtain(key) { var c = shop().curtains; c[key] = !c[key]; sfx('curtain'); toast((c[key] ? 'Opened' : 'Closed') + ' the ' + (curtains[key] ? curtains[key].label || 'curtain' : 'curtain') + (key === 'service' && c[key] && shop().breakNote ? ', and the break note came down with it' : ''), ''); if (key === 'service' && c[key]) breakNoteDown(); drawCtlScreen(); save(); }
  function setAllCurtains(open) { Object.keys(curtains).forEach(function (k) { shop().curtains[k] = open; }); if (open) breakNoteDown(); drawCtlScreen(); save(); }
  // ── The break note: with the window curtain drawn, Shift+E from the customers' side hangs "back in 5 minutes" on it.
  // For the five minutes it promises, the line and whoever is at the window wait for you instead of losing patience.
  var BREAK_MS = 300000, breakNoteMesh = null;
  function breakWait() { var t = shop().breakNote; return !!t && !curtainOpen('service') && now() - t < BREAK_MS; }
  function lobbySide() { return (player.floor || 0) === 0 && player.pos.z > 4.15 && player.pos.z < ROOM.z; }
  function breakNoteDown() { if (!shop().breakNote) return; shop().breakNote = 0; syncBreakNote(); }
  function breakNoteToggle() {
    var sh = shop();
    if (sh.breakNote) { breakNoteDown(); sfx('rustle'); toast('📝 Took the break note down', ''); save(); return; }
    if (curtainOpen('service')) { toast('Close the window curtain first, then hang the note on it', 'bad'); return; }
    if (!lobbySide()) { toast('The note goes on the customers\' side: walk round to the front of the window', 'bad'); return; }
    sh.breakNote = now(); syncBreakNote(); sfx('rustle');
    toast('📝 "Back in 5 minutes" is up. The line waits for you for five minutes.', 'good'); logEvent('📝 Hung a "back in 5 minutes" note on the window', '');
    var m0 = lineup.filter(function (m) { return m.c && lineWaiting(m); })[0]; if (m0) lineSay(m0, pick(['Five minutes. Fine.', 'I\'ll wait.', 'A break? Lucky you.']), '#e8f1ea', 2600);
    crew.forEach(function (r) { var cr = crewList()[r.idx]; if (!r.g || !cr || cr.off || cr.task !== 'serve') return; var was = worker; worker = r; workerSay(crewLine('onBreak'), '#6fdc8c', 2600); worker = was; });   /* the crew on the window take it with you */
    save();
  }
  function syncBreakNote() {   // a sheet of paper taped to the drawn curtain, facing the lobby
    var c = curtains.service; if (!c) return;
    if (!breakNoteMesh) {
      var g = new THREE.Group();
      var paper = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.31), new THREE.MeshBasicMaterial({ map: textTex(['BACK IN 5 MINUTES', 'on a short break', 'please wait in line'], 440, 310, { size: 40, bold: true, bg: '#fbf8ef', color: '#3a3f46', titleColor: '#b5121b', line: 'rgba(0,0,0,0.25)' }) }));
      g.add(paper);
      [-0.16, 0.16].forEach(function (x) { var tape = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.03), colorMat(0xe9e2c8, 0.8)); tape.position.set(x, 0.15, 0.002); tape.rotation.z = x < 0 ? 0.35 : -0.35; g.add(tape); });
      g.position.set(c.w / 2, 0.08, 0.075); g.rotation.z = -0.03; c.g.add(g); breakNoteMesh = g;
    }
    breakNoteMesh.visible = !!shop().breakNote && !curtainOpen('service');
  }
  // the shop closes: whoever is still outside turns round, whoever is already inside is served, smokes if they like, and leaves
  function shopClosing() {
    lineup.forEach(function (m) { if (m.c && (m.state === 'enter' || m.state === 'hold')) lineLeave(m, 'sad', pick(['Closed? I\'ll come back.', 'Oh. They\'re shut.', 'Locked. Typical.']), '#ffc857'); });
    if (S.customer && npc.human && npc.state === 'enter' && npc.g.position.z > ROOM.z - 0.3) { npc.leaveSad(); S.customer = null; }
    var out = robbers.filter(function (r) { return r.state === 'case' && !r.masked && (r.delay > 0 || !r.g || r.g.position.z > ROOM.z - 0.3); });
    out.forEach(robberFlee); if (out.length && !robbers.some(function (r) { return r.state === 'case' || r.masked; })) heist.aborted = true;
  }
  function doorTraffic() {   // someone walking out while the shop is shut: the front door opens for them and shuts behind
    var near = function (g) { return !!g && Math.abs(g.position.x) < 1.6 && Math.abs(g.position.z - ROOM.z) < 1.4; };
    return lineup.some(function (m) { return m.state === 'leave' && near(m.g); }) || (!!npc.human && npc.state === 'leave' && near(npc.g)) || loungers.some(function (l) { return l.state === 'leave' && near(l.g); }) || robbers.some(function (r) { return r.state === 'flee' && near(r.g); });
  }
  function updateCurtains(dt) {
    for (var k in curtains) { var c = curtains[k]; var target = curtainOpen(k) ? 0 : 1; c.t = lerp(c.t, target, 1 - Math.pow(0.02, dt)); var sx = 0.12 + c.t * 0.88; c.cloth.scale.x = sx; c.cloth.position.x = c.w * sx / 2; c.cloth.material.map.repeat.x = Math.max(1, Math.round(c.w * 1.5 * (0.4 + c.t * 0.6))); (c.g.userData.rings || []).forEach(function (r) { r.position.x = r.userData.ringT * c.w * sx; }); }
    if (breakWait() && S.customer && S.customer.until) S.customer.until += dt * 1000;   /* the one at the window read the note too */
  }
  function buildShopControls() {
    Object.keys(curtains).forEach(function (k) { curtains[k].label = null; });
    // curtains: grow window, office window, front panes (left + right), service window, entrance door
    // side-wall windows: the group pivot sits at the window's near edge (rotY -90° maps local +x onto world +z)
    addCurtain('growWin', 'grow room curtain', -ROOM.x + 0.14, 1.65, -8.0, 3.0, 1.55, -Math.PI / 2);
    addCurtain('officeWin', 'office curtain', -ROOM.x + 0.14, 1.65, 1.9, 1.5, 1.55, -Math.PI / 2);
    addCurtain('frontL', 'front curtain (left)', -ROOM.x + 0.2, 1.9, ROOM.z - 0.12, ROOM.x - 1.0, 2.0, 0);
    addCurtain('frontR', 'front curtain (right)', 0.8, 1.9, ROOM.z - 0.12, ROOM.x - 1.0, 2.0, 0);
    addCurtain('service', 'window curtain', -1.3, 1.68, 3.82, 2.6, 1.25, 0);
    addCurtain('door', 'door curtain', -0.7, 1.15, ROOM.z - 0.12, 1.4, 2.2, 0);
    curtains.growWin.label = 'grow room curtain'; curtains.officeWin.label = 'office curtain'; curtains.frontL.label = 'left front curtain'; curtains.frontR.label = 'right front curtain'; curtains.service.label = 'window curtain'; curtains.door.label = 'door curtain';
    breakNoteMesh = null; syncBreakNote();
    // staff door: hinged at x = 9.4 in the staff wall, swings into the lobby
    var g = new THREE.Group(); g.position.set(9.4, 0, 4); world.group.add(g); staffDoor.g = g;
    var leaf = new THREE.Mesh(new THREE.BoxGeometry(1.16, 2.24, 0.06), MAT.darkwood); leaf.position.set(0.6, 1.12, 0); leaf.castShadow = true; g.add(leaf);
    var plate = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.22), new THREE.MeshBasicMaterial({ map: textTex(['STAFF ONLY'], 350, 110, { size: 52, bold: true, bg: '#c94a3a', color: '#fff', titleColor: '#fff', line: 'rgba(0,0,0,0)' }) })); plate.position.set(0.6, 1.6, 0.035); g.add(plate);
    var plate2 = plate.clone(); plate2.position.z = -0.035; plate2.rotation.y = Math.PI; g.add(plate2);
    [0.04, -0.04].forEach(function (dz) { var knob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), MAT.metal); knob.position.set(1.05, 1.0, dz * 1.5); g.add(knob); });
    var hit = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.3, 0.3), MAT.none); hit.position.set(0.6, 1.15, 0); g.add(hit); interactable(hit, { kind: 'staffdoor' });
    staffDoor.leds = []; [0.036, -0.036].forEach(function (dz) { var led = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.05, 0.01), glowMat(0x39d353, 1.2)); led.position.set(1.02, 1.3, dz); g.add(led); staffDoor.leds.push(led); }); staffDoorLeds();   /* red locked, green not, like the sliding doors */
    staffDoor.obstacle = { x1: 9.4, x2: 10.6, z1: 3.85, z2: 4.15, tag: 'staffdoor' }; staffDoor.t = shop().staffDoor ? 1 : 0; syncStaffDoorObstacle();
    // the shop control cabinet on the security room's right wall (F2 carries it): open the doors, and inside hangs a tablet with a bank of switches, levers, a radio knob and small displays under it
    var bx = SEC.x2 - 0.365, by = 1.15, bz = -10.75; var cg = new THREE.Group();   /* the group's origin is the cabinet FRONT: its depth runs back to the wall at SEC.x2 */ cg.position.set(bx, by, bz); cg.rotation.y = -Math.PI / 2; world.group.add(cg); world.ctl = { g: cg, doorT: 0, doorOpen: false, doors: [], levers: {}, leds: {}, roomLeds: {}, lastTick: 0 };
    var panelM = new THREE.MeshStandardMaterial({ color: 0xc9ccd2, roughness: 0.55, metalness: 0.2, emissive: 0x2a2d31, emissiveIntensity: 0.35 }); var darkM = new THREE.MeshStandardMaterial({ color: 0x22262b, roughness: 0.5, metalness: 0.3 }); var shellM = new THREE.MeshStandardMaterial({ color: 0x7d838c, roughness: 0.45, metalness: 0.4 });
    var inLight = new THREE.PointLight(0xfff3e0, 0.9, 2.4); inLight.position.set(0, 0.3, 0.2); cg.add(inLight);   /* a strip light inside: a recess in a wall-facing cabinet gets no room light */
    function cm(geo, mat, x, y, z, parent) { var m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; (parent || cg).add(m); return m; }
    cm(new THREE.BoxGeometry(1.44, 2.04, 0.02), shellM, 0, 0, -0.35);                                                                    // back plate against the wall
    cm(new THREE.BoxGeometry(0.03, 2.04, 0.36), shellM, -0.705, 0, -0.17); cm(new THREE.BoxGeometry(0.03, 2.04, 0.36), shellM, 0.705, 0, -0.17);   // sides
    cm(new THREE.BoxGeometry(1.44, 0.03, 0.36), shellM, 0, 1.005, -0.17); cm(new THREE.BoxGeometry(1.44, 0.03, 0.36), shellM, 0, -1.005, -0.17);   // top and bottom
    cm(new THREE.BoxGeometry(1.44, 0.15, 0.36), darkM, 0, -1.09, -0.17); cm(new THREE.BoxGeometry(1.38, 1.98, 0.01), new THREE.MeshStandardMaterial({ color: 0x4a5058, roughness: 0.8 }), 0, 0, -0.34);   // plinth and the dark liner
    cm(new THREE.BoxGeometry(0.06, 0.06, 0.4), darkM, -0.25, 1.0, -0.15); cm(new THREE.BoxGeometry(0.06, 0.06, 0.4), darkM, 0.25, 1.0, -0.15);   // top rail
    [[-0.7, 1], [0.7, -1]].forEach(function (d) {   // two doors hinged on the outer edges; the free edge swings out into the room
      var hg = new THREE.Group(); hg.position.set(d[0], 0, 0); cg.add(hg); var leaf = cm(new THREE.BoxGeometry(0.69, 2.0, 0.04), panelM, 0.35 * d[1], 0, 0.02, hg); cm(new THREE.BoxGeometry(0.55, 1.7, 0.005), darkM, 0.35 * d[1], 0, 0.043, hg);
      cm(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 8), MAT.chrome, 0.64 * d[1], 0, 0.06, hg); var lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.08), new THREE.MeshBasicMaterial({ map: textTex([d[1] > 0 ? 'SHOP' : 'CONTROLS'], 300, 60, { size: 40, bold: true, bg: 'rgba(0,0,0,0)', color: '#e8e8ec', titleColor: '#ffc857', line: 'rgba(0,0,0,0)' }), transparent: true })); lbl.position.set(0.35 * d[1], 0.75, 0.046); hg.add(lbl);
      var dh = new THREE.Mesh(new THREE.BoxGeometry(0.69, 2.0, 0.08), MAT.none); dh.position.set(0.35 * d[1], 0, 0.03); hg.add(dh); interactable(dh, { kind: 'ctlDoor' });
      world.ctl.doors.push({ g: hg, dir: d[1] });
    });
    // the tablet hangs from the top rail on two straps
    var tsc = touchScreen({ id: 'ctl', kind: 'ctlTablet', w: 1120, h: 700, pw: 0.9, ph: 0.5625, draw: drawCtlTablet, tap: ctlTap, wheel: function (dir) { world.ctl.page = ((world.ctl.page + dir) % CTL_PAGES.length + CTL_PAGES.length) % CTL_PAGES.length; }, live: 1000 });
    var tg = new THREE.Group(); tg.position.set(0, 0.6, -0.27); cg.add(tg); world.ctl.tablet = tg;
    cm(new THREE.BoxGeometry(0.98, 0.65, 0.02), MAT.black, 0, 0, -0.012, tg); tsc.mesh.position.z = 0.0005; tg.add(tsc.mesh);
    [-0.3, 0.3].forEach(function (x) { cm(new THREE.BoxGeometry(0.04, 0.12, 0.01), darkM, x, 0.36, -0.01, tg); });
    var th = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.67, 0.08), MAT.none); th.position.set(0, 0, 0.02); tg.add(th); interactable(th, { kind: 'ctlTablet' });
    world.ctl.sc = tsc; tDraw(tsc);
    // the switch panel under it
    cm(new THREE.BoxGeometry(1.3, 1.05, 0.03), panelM, 0, -0.42, -0.31);
    world.ctl.rockers = {};
    [['open', -0.5, 'OPEN'], ['lights', -0.25, 'LIGHTS'], ['staffDoor', 0, 'DOOR'], ['roller', 0.25, 'ROLLER'], ['gate', 0.5, 'GATE']].forEach(function (r) {
      var y = 0.0, z = -0.295;
      cm(new THREE.BoxGeometry(0.09, 0.15, 0.01), MAT.black, r[1], y, z); var rocker = cm(new THREE.BoxGeometry(0.07, 0.12, 0.03), new THREE.MeshStandardMaterial({ color: 0xe8e8ec, roughness: 0.4 }), r[1], y, z + 0.015); world.ctl.rockers[r[0]] = rocker;
      var lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.03), new THREE.MeshBasicMaterial({ map: textTex([r[2]], 160, 30, { size: 22, bg: 'rgba(0,0,0,0)', color: '#1a1d21', titleColor: '#1a1d21', line: 'rgba(0,0,0,0)' }), transparent: true })); lbl.position.set(r[1], y - 0.11, z + 0.001); cg.add(lbl);
      var led = cm(new THREE.SphereGeometry(0.009, 8, 8), new THREE.MeshStandardMaterial({ color: 0x00ff66, emissive: 0x00ff66, emissiveIntensity: 2 }), r[1] + 0.055, y + 0.09, z + 0.002); world.ctl.rockers[r[0] + 'Led'] = led;
      var sh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.24, 0.08), MAT.none); sh.position.set(r[1], y, z + 0.02); cg.add(sh); interactable(sh, { kind: 'ctlSwitch', id: r[0] });
    });
    // two small displays and the radio knob
    var sc2 = document.createElement('canvas'); sc2.width = 256; sc2.height = 128; world.ctl.canvas = sc2; world.ctl.tex = new THREE.CanvasTexture(sc2); world.ctl.tex.encoding = THREE.sRGBEncoding;
    var screen = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.2), new THREE.MeshBasicMaterial({ map: world.ctl.tex })); screen.position.set(-0.4, -0.3, -0.294); cg.add(screen); cm(new THREE.BoxGeometry(0.44, 0.24, 0.01), MAT.black, -0.4, -0.3, -0.3);
    var sc3 = document.createElement('canvas'); sc3.width = 256; sc3.height = 128; world.ctl.canvas2 = sc3; world.ctl.tex2 = new THREE.CanvasTexture(sc3); world.ctl.tex2.encoding = THREE.sRGBEncoding;
    var screen2 = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.2), new THREE.MeshBasicMaterial({ map: world.ctl.tex2 })); screen2.position.set(0.05, -0.3, -0.294); cg.add(screen2); cm(new THREE.BoxGeometry(0.44, 0.24, 0.01), MAT.black, 0.05, -0.3, -0.3);
    var screenGlow = new THREE.PointLight(0x6fdc8c, 0.15, 1.2); screenGlow.position.set(0, -0.2, 0.2); cg.add(screenGlow);
    var dialArc = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.05), new THREE.MeshBasicMaterial({ map: textTex(['OFF · LOFI · DUB · NEON · JAZZ'], 300, 50, { size: 22, bg: 'rgba(0,0,0,0)', color: '#1a1d21', titleColor: '#1a1d21', line: 'rgba(0,0,0,0)' }), transparent: true })); dialArc.position.set(0.5, -0.19, -0.294); cg.add(dialArc);
    var knob = cm(new THREE.CylinderGeometry(0.04, 0.045, 0.03, 20), darkM, 0.5, -0.32, -0.28); knob.rotation.x = Math.PI / 2; world.ctl.knob = knob;
    var pointer = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.035, 0.006), new THREE.MeshStandardMaterial({ color: 0xffc857, emissive: 0xffc857, emissiveIntensity: 0.6 })); pointer.position.set(0, 0.012, 0.025); knob.add(pointer); world.ctl.pointer = pointer;
    var radioLed = cm(new THREE.SphereGeometry(0.009, 8, 8), new THREE.MeshStandardMaterial({ color: 0x3ad0ff, emissive: 0x3ad0ff, emissiveIntensity: 2 }), 0.58, -0.25, -0.293); world.ctl.radioLed = radioLed;
    var kh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.08), MAT.none); kh.position.set(0.5, -0.32, -0.27); cg.add(kh); interactable(kh, { kind: 'ctlKnob' });
    // levers: dehumidifier targets, markup and volume, plus the red alarm button
    [['grow', -0.5, 'DRY GROW', 'ctlLever'], ['dry', -0.27, 'DRY ROOM', 'ctlLever'], ['markup', -0.04, 'MARKUP', 'ctlMarkup'], ['volume', 0.19, 'VOLUME', 'ctlVol']].forEach(function (l) {
      var y = -0.62, z = -0.295; cm(new THREE.BoxGeometry(0.03, 0.2, 0.01), MAT.black, l[1], y, z); var lg = new THREE.Group(); lg.position.set(l[1], y, z); cg.add(lg); cm(new THREE.CylinderGeometry(0.008, 0.008, 0.14, 8), MAT.chrome, 0, 0.07, 0.03, lg).rotation.x = 0; var knobL = cm(new THREE.SphereGeometry(0.02, 10, 8), new THREE.MeshStandardMaterial({ color: 0xc94a3a, roughness: 0.4 }), 0, 0.14, 0.03, lg); world.ctl.levers[l[0]] = lg;
      var lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.03), new THREE.MeshBasicMaterial({ map: textTex([l[2]], 200, 30, { size: 22, bg: 'rgba(0,0,0,0)', color: '#1a1d21', titleColor: '#1a1d21', line: 'rgba(0,0,0,0)' }), transparent: true })); lbl.position.set(l[1], y - 0.14, z + 0.001); cg.add(lbl);
      var lh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.3, 0.1), MAT.none); lh.position.set(l[1], y, z + 0.03); cg.add(lh); interactable(lh, { kind: l[3], id: l[0] });
    });
    cm(new THREE.CylinderGeometry(0.05, 0.055, 0.02, 20), MAT.black, 0.5, -0.62, -0.29).rotation.x = Math.PI / 2; var pb = cm(new THREE.CylinderGeometry(0.038, 0.04, 0.035, 20), new THREE.MeshStandardMaterial({ color: 0xd0201a, roughness: 0.35 }), 0.5, -0.62, -0.27); pb.rotation.x = Math.PI / 2; world.ctl.panicBtn = pb;
    var pl = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.03), new THREE.MeshBasicMaterial({ map: textTex(['SILENT ALARM'], 200, 30, { size: 22, bg: 'rgba(0,0,0,0)', color: '#1a1d21', titleColor: '#1a1d21', line: 'rgba(0,0,0,0)' }), transparent: true })); pl.position.set(0.5, -0.76, -0.294); cg.add(pl);
    var ph = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.1), MAT.none); ph.position.set(0.5, -0.62, -0.26); cg.add(ph); interactable(ph, { kind: 'ctlPanic' });
    // a row of room lights: a LED and a button each
    var rooms = Object.keys(ROOM_NAMES), rw = 1.2 / rooms.length;
    rooms.forEach(function (rm, i) { var x = -0.6 + rw * (i + 0.5), y = -0.86, z = -0.295; var led = cm(new THREE.SphereGeometry(0.009, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffe08a, emissive: 0xffe08a, emissiveIntensity: 2 }), x, y + 0.05, z + 0.002); world.ctl.roomLeds[rm] = led; cm(new THREE.CylinderGeometry(0.018, 0.02, 0.015, 12), new THREE.MeshStandardMaterial({ color: 0xe8e8ec, roughness: 0.4 }), x, y, z + 0.005).rotation.x = Math.PI / 2; var lbl = new THREE.Mesh(new THREE.PlaneGeometry(rw - 0.01, 0.026), new THREE.MeshBasicMaterial({ map: textTex([ROOM_NAMES[rm].toUpperCase().replace(' & ', '/')], 200, 30, { size: 20, bg: 'rgba(0,0,0,0)', color: '#1a1d21', titleColor: '#1a1d21', line: 'rgba(0,0,0,0)' }), transparent: true })); lbl.position.set(x, y - 0.05, z + 0.001); cg.add(lbl); var rh = new THREE.Mesh(new THREE.BoxGeometry(rw - 0.01, 0.13, 0.08), MAT.none); rh.position.set(x, y - 0.01, z + 0.02); cg.add(rh); interactable(rh, { kind: 'ctlRoom', id: rm }); });
    var conduit = cm(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 8), panelM, 0.6, 1.4, -0.3);
    world.obstacles.push({ x1: bx - 0.08, x2: SEC.x2, z1: bz - 0.74, z2: bz + 0.74, tag: 'ctlBox' });
    var ctlSign = signPlane(['SHOP CONTROLS', 'E on the doors opens the cabinet'], 0.9, 0.3, SEC.x2 - 0.02, 2.45, bz, -Math.PI / 2, { titleColor: '#ffc857' }); fixtureAdd('ctlBox', 'control cabinet', [cg, ctlSign], -Math.PI / 2);
    drawCtlScreen();
    // Two satellite panels: one behind the register, one in the office. Smaller box, fewer switches.
    [
      { id: 'miniFront',  fx: 'ctlFront',  label: 'front panel', x: 3.855, y: 1.5, z: 3.3, rot: -Math.PI / 2, sign: 'FRONT OF HOUSE', col: 0x2f6b4a },   /* on the side wall by the extinguisher: its old spot was inside the cigarette cabinet */
      { id: 'miniOffice', fx: 'ctlOffice', label: 'office panel',         x: -6.3, y: 1.5, z: 1.86, rot: 0,       sign: 'OFFICE', col: 0x2f5b8a }
    ].forEach(function (p) {
      var g = new THREE.Group(); g.position.set(p.x, p.y, p.z); g.rotation.y = p.rot; world.group.add(g);
      var caseM = colorMat(0xd8dce0, 0.6), faceM = colorMat(0xeceff2, 0.5);
      var bodyM = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.44, 0.09), caseM); bodyM.castShadow = false; g.add(bodyM);
      var face = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.012), faceM); face.position.z = 0.051; face.castShadow = false; g.add(face);
      var strip = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.014), colorMat(p.col, 0.5)); strip.position.set(0, 0.16, 0.053); strip.castShadow = false; g.add(strip);
      for (var r2 = 0; r2 < 3; r2++) {
        var rk = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.02), colorMat(0x3a3d42, 0.5));
        rk.position.set(-0.08 + (r2 % 2) * 0.16, 0.03 - Math.floor(r2 / 2) * 0.1, 0.057); rk.castShadow = false; g.add(rk);
        var ld = new THREE.Mesh(new THREE.SphereGeometry(0.007, 6, 6), new THREE.MeshStandardMaterial({ color: 0x00ff66, emissive: 0x00ff66, emissiveIntensity: 1.6 }));
        ld.position.set(-0.03 + (r2 % 2) * 0.16, 0.03 - Math.floor(r2 / 2) * 0.1, 0.058); ld.castShadow = false; g.add(ld);
      }
      var sg = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.05), new THREE.MeshBasicMaterial({ map: textTex([p.sign], 280, 50, { size: 26, bg: 'rgba(0,0,0,0)', color: '#12161a', titleColor: '#12161a', line: 'rgba(0,0,0,0)' }), transparent: true }));
      sg.position.set(0, -0.155, 0.054); g.add(sg);
      var fdx = Math.sin(p.rot), fdz = Math.cos(p.rot), side = Math.abs(fdx) > 0.5;   /* the hit box sits in front of the face, whichever wall it hangs on */
      var hit = box(side ? 0.26 : 0.42, 0.55, side ? 0.42 : 0.26, MAT.none, p.x + fdx * 0.1, p.y, p.z + fdz * 0.1, { cast: false, receive: false });
      interactable(hit, { kind: p.id });
      fixtureAdd(p.fx, p.label, [g, hit], p.rot);   /* F2 moves them like any other fitting */
    });
    world.speakers = [[0, 2.9, -1.7], [0, 2.9, 4.4], [-6.5, 2.9, -8.6]];
    world.speakers.forEach(function (sp) { box(0.3, 0.42, 0.24, MAT.black, sp[0], sp[1], sp[2]); var cone = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.06, 0.03, 16), new THREE.MeshStandardMaterial({ color: 0x555a60 })); cone.rotation.x = Math.PI / 2; cone.position.set(sp[0], sp[1] - 0.05, sp[2] + (sp[2] > 4 ? 0.13 : 0.13)); world.group.add(cone); });
    // CLOSED sign twin for the neon
    neonSign.closed = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.5), new THREE.MeshBasicMaterial({ map: textTex(['CLOSED'], 384, 160, { size: 84, bold: true, titleColor: '#ff4d6d', bg: 'rgba(0,0,0,0)', line: 'rgba(0,0,0,0)' }), transparent: true })); neonSign.closed.position.set(-3.5, 2.5, ROOM.z - 0.03); neonSign.closed.rotation.y = Math.PI; world.group.add(neonSign.closed);
    applyShopState();
  }
  function syncStaffDoorObstacle() { world.obstacles = world.obstacles.filter(function (o) { return o.tag !== 'staffdoor'; }); if (!shop().staffDoor) world.obstacles.push(staffDoor.obstacle); }
  // The staff door locks like every other door: Shift+E with the keyring, or the control box. Locked, it opens only for a
  // keyholder (the crew and the guard, unless you took their key back), and nobody else can path through it.
  function staffDoorLocked() { return !!(S.doorLocks && S.doorLocks.staff); }
  function staffDoorLeds() { var c = staffDoorLocked() ? 0xff3030 : 0x39d353; staffDoor.leds.forEach(function (l) { l.material.color.setHex(c); l.material.emissive.setHex(c); }); }
  function setStaffDoorLock(lk) { if (!S.doorLocks) S.doorLocks = {}; S.doorLocks.staff = !!lk; if (lk) { shop().staffDoor = false; staffDoorAuto = false; syncStaffDoorObstacle(); } staffDoorLeds(); drawCtlScreen(); applyShopState(); save(); }   /* locking shuts it, as it does a sliding door */
  function keyStaffDoor() {
    if (!hasKeys()) { sfx('bad'); toast('🔑 You need the keyring: it hangs on the hook in the office', 'bad'); return; }
    var lk = !staffDoorLocked();
    if (lk && shop().staffDoor && player.floor === 0 && Math.abs(player.pos.x - 10) < 0.7 && Math.abs(player.pos.z - 4) < 0.4) { toast('Step out of the doorway first', ''); return; }
    setStaffDoorLock(lk); sfx(lk ? 'click' : 'curtain'); toast(lk ? '🔒 Locked the staff door' : '🔓 Unlocked the staff door', lk ? '' : 'good');
  }
  function toggleStaffDoor(fromBoard) {
    if (!shop().staffDoor && staffDoorLocked()) { if (!fromBoard) { sfx('bad'); toast('🔒 Locked. Unlock it at the control box, or Shift+E with the keyring.', 'bad'); return; } setStaffDoorLock(false); }   /* the board opens it the way it opens a sliding door: unlocked */
    shop().staffDoor = !shop().staffDoor; staffDoorAuto = false; syncStaffDoorObstacle(); sfx('door'); toast(shop().staffDoor ? 'Staff door open' : 'Staff door closed', ''); applyShopState(); save(); }
  function updateStaffDoor(dt) { if (!staffDoor.g) return; var staffNear = (!staffDoorLocked() || staffKey('staff')) && crew.some(function (r) { return r.g && Math.hypot(r.g.position.x - 10, r.g.position.z - 4) < 1.1; }) || ((!staffDoorLocked() || staffKey('staff')) && guard.h && guard.walking && Math.hypot(guard.h.position.x - 10, guard.h.position.z - 4) < 1.1); var target = (shop().staffDoor || staffNear) ? 1 : 0; staffDoor.t = lerp(staffDoor.t, target, 1 - Math.pow(0.01, dt)); staffDoor.g.rotation.y = -staffDoor.t * 1.75;
    if (world.frontDoor) { var fd = world.frontDoor; var ft = shop().open || doorTraffic() ? 1 : 0; fd.t = lerp(fd.t, ft, 1 - Math.pow(0.01, dt)); fd.g.rotation.y = fd.t * 1.6; } }

  // ── the control cabinet: doors, the hanging tablet and the switch bank talk to the same shop state the old panel did ──
  var CTL_PAGES = ['shop', 'rooms', 'curtains', 'doors', 'climate', 'radio'], CTL_LABEL = { shop: 'Shop', rooms: 'Rooms', curtains: 'Curtains', doors: 'Doors', climate: 'Climate', radio: 'Radio & price' };
  function ctlAct(act, id) { var el = document.createElement('button'); el.setAttribute('data-act', act); if (id !== undefined && id !== null) el.setAttribute('data-id', String(id)); panelClick({ target: el }); }   /* the cabinet reuses the panel's own actions, so both stay one behaviour */
  function ctlDoorSet(open) { if (!world.ctl) return; world.ctl.doorOpen = open; sfx('door'); toast(open ? '🗄️ Opened the control cabinet' : '🗄️ Closed the control cabinet', ''); }
  function ctlMarkupStep() { var sh = shop(), v = Math.round(((sh.markup || 1) + 0.05) * 100) / 100; if (v > 1.3) v = 0.8; sh.markup = v; sfx('click'); toast('💲 Markup ' + Math.round(v * 100) + '%', ''); save(); ui.refreshOpen(); }
  function ctlVolumeStep() { var sh = shop(), v = Math.round(((sh.volume || 0) + 0.25) * 100) / 100; if (v > 1) v = 0; sh.volume = v; sfx('click'); toast('🔊 Volume ' + Math.round(v * 100) + '%', ''); save(); ui.refreshOpen(); }
  function ctlKnobStep() { var i = STATION_ORDER.indexOf(shop().radio); ctlAct('radioSet', STATION_ORDER[(i + 1) % STATION_ORDER.length]); }
  function drawCtlClimate() {
    if (!world.ctl || !world.ctl.canvas2) return; var c = world.ctl.canvas2, ctx = c.getContext('2d'), X = xs();
    ctx.fillStyle = '#07110b'; ctx.fillRect(0, 0, 256, 128); ctx.strokeStyle = 'rgba(111,220,140,.35)'; ctx.lineWidth = 2; ctx.strokeRect(3, 3, 250, 122); ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    ctx.font = '600 18px "Cascadia Mono",Consolas,monospace'; ctx.fillStyle = '#9fb8a6'; ctx.fillText('GROW RH', 14, 12); ctx.fillText('DRY RH', 134, 12);
    ctx.font = '700 30px "Cascadia Mono",Consolas,monospace'; ctx.fillStyle = S.rh.grow > 60 ? '#ff6b6b' : '#c9dccd'; ctx.fillText(Math.round(S.rh.grow) + '%', 14, 32); ctx.fillStyle = S.rh.dry > 60 ? '#ff6b6b' : S.rh.dry < 55 ? '#6fdc8c' : '#c9dccd'; ctx.fillText(Math.round(S.rh.dry) + '%', 134, 32);
    ctx.font = '16px "Cascadia Mono",Consolas,monospace'; ctx.fillStyle = '#9fb8a6'; ctx.fillText(dehumLabel('grow'), 14, 66); ctx.fillText(dehumLabel('dry'), 134, 66);
    ctx.fillStyle = '#c9dccd'; ctx.fillText('markup ' + Math.round((shop().markup || 1) * 100) + '%   vol ' + Math.round((shop().volume || 0) * 100) + '%', 14, 92); ctx.fillStyle = X.heat >= 60 ? '#ff6b6b' : '#9fb8a6'; ctx.fillText('heat ' + Math.round(X.heat), 14, 110);
    world.ctl.tex2.needsUpdate = true;
  }
  function cabinetSync() {
    var C = world.ctl; if (!C || !C.levers) return; var sh = shop();
    if (C.rockers.roller) C.rockers.roller.rotation.x = world.rollerOpen ? -0.35 : 0.35; if (C.rockers.gate) C.rockers.gate.rotation.x = world.gateOpen ? -0.35 : 0.35;
    if (C.rockers.rollerLed) C.rockers.rollerLed.material.emissiveIntensity = world.rollerOpen ? 2 : 0.1; if (C.rockers.gateLed) C.rockers.gateLed.material.emissiveIntensity = world.gateOpen ? 2 : 0.1;
    if (C.rockers.openLed) C.rockers.openLed.material.emissiveIntensity = sh.open ? 2 : 0.1; if (C.rockers.lightsLed) C.rockers.lightsLed.material.emissiveIntensity = sh.lights ? 2 : 0.1; if (C.rockers.staffDoorLed) C.rockers.staffDoorLed.material.emissiveIntensity = sh.staffDoor ? 2 : 0.1;
    var st = dehumSteps(); ['grow', 'dry'].forEach(function (z) { var i = Math.max(0, st.indexOf(S.dehum[z])); C.levers[z].rotation.x = 0.55 - (i / Math.max(1, st.length - 1)) * 1.1; });
    C.levers.markup.rotation.x = 0.55 - (((sh.markup || 1) - 0.8) / 0.5) * 1.1; C.levers.volume.rotation.x = 0.55 - (sh.volume || 0) * 1.1;
    Object.keys(C.roomLeds).forEach(function (rm) { C.roomLeds[rm].material.emissiveIntensity = sh.lights && powerOn() && roomLit(rm) ? 2 : 0.1; });
    if (C.panicBtn) C.panicBtn.material.emissive = new THREE.Color(heist.on && heist.masked ? 0xd0201a : 0x000000);
    if (C.sc && !C.sc.cur) tDraw(C.sc);   /* the tablet inside redraws once a second when nobody is pointing at it, so its clock and states keep up */
    drawCtlClimate();
  }
  function cabinetTick(dt) {
    var C = world.ctl; if (!C || !C.doors) return;
    var want = C.doorOpen ? 1 : 0; if (C.doorT !== want) { C.doorT = clamp(C.doorT + (want ? dt * 1.6 : -dt * 1.6), 0, 1); var a = (1 - Math.cos(C.doorT * Math.PI)) / 2 * 1.9; C.doors.forEach(function (d) { d.g.rotation.y = -a * d.dir; }); }
    if (now() - C.lastTick > 1000) { C.lastTick = now(); cabinetSync(); }
  }
  function drawCtlTablet(sc, ctx) {
    var W = sc.w, H = sc.h, page = CTL_PAGES[world.ctl.page || 0], sh = shop(), o = { size: 18 };
    ctx.fillStyle = '#0a110d'; ctx.fillRect(0, 0, W, H); var grd = ctx.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, 'rgba(111,220,140,.12)'); grd.addColorStop(0.4, 'rgba(0,0,0,0)'); ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = DESK_OK; ctx.font = '800 30px ' + DESK_FONT; ctx.fillText('SHOP CONTROLS', 30, 20);
    ctx.textAlign = 'right'; ctx.fillStyle = sh.open ? DESK_OK : DESK_BAD; ctx.font = '700 26px "Cascadia Mono",Consolas,monospace'; ctx.fillText(sh.open ? 'OPEN' : 'CLOSED', W - 30, 22); ctx.textAlign = 'left';
    var tw = (W - 60 - 300 - 5 * 8) / 6; CTL_PAGES.forEach(function (p, i) { tBtn(sc, ctx, 300 + i * (tw + 8), 16, tw, 42, CTL_LABEL[p], 'page', i, CTL_LABEL[p], i === (world.ctl.page || 0), { size: 17 }); });
    ctx.fillStyle = 'rgba(111,220,140,.25)'; ctx.fillRect(30, 72, W - 60, 2);
    var y = 92, bw = (W - 60 - 2 * 14) / 3;
    function grid(items, cols, h, gap) { var w = (W - 60 - (cols - 1) * gap) / cols; items.forEach(function (it, i) { tBtn(sc, ctx, 30 + (i % cols) * (w + gap), y + Math.floor(i / cols) * (h + gap), w, h, it[0], it[1], it[2], it[3] || it[0], !!it[4], { size: it[5] || 19, sub: it[6] }); }); y += Math.ceil(items.length / cols) * (h + gap); }
    if (page === 'shop') {
      grid([[sh.open ? '🔴 Close the shop' : '🟢 Open the shop', 'shopToggle', 0, sh.open ? 'Close the shop' : 'Open the shop', sh.open, 22], [sh.lights ? '🌑 Lights off' : '💡 Lights on', 'lightsToggle', 0, sh.lights ? 'All lights off' : 'All lights on', sh.lights, 22], [sh.staffDoor ? '🚪 Close staff door' : '🚪 Open staff door', 'staffDoorToggle', 0, sh.staffDoor ? 'Close the staff door' : 'Open the staff door', sh.staffDoor, 22],
        ['Roller door ' + (world.rollerOpen ? 'open' : 'closed'), 'rollerToggle', 0, world.rollerOpen ? 'Close the roller door' : 'Open the roller door', world.rollerOpen, 20], ['Yard gate ' + (world.gateOpen ? 'open' : 'closed'), 'gateToggle', 0, world.gateOpen ? 'Close the yard gate' : 'Open the yard gate', world.gateOpen, 20], ['📺 TV: next channel', 'tvNext', 0, 'Next TV channel', false, 20]], 3, 110, 14);
      ctx.fillStyle = DESK_DIM; ctx.font = '17px ' + DESK_FONT; ctx.fillText('Closed means no new customers walk in; the one at the window leaves. The switches under this screen do the same jobs.', 30, y + 10);
    }
    else if (page === 'rooms') { grid(Object.keys(ROOM_NAMES).map(function (r) { return [ROOM_NAMES[r], 'roomLight', r, 'Lights: ' + ROOM_NAMES[r], sh.lights && powerOn() && roomLit(r), 20]; }), 3, 88, 12); ctx.fillStyle = DESK_DIM; ctx.font = '17px ' + DESK_FONT; ctx.fillText(sh.lights ? 'Tap a room to switch its lights.' : 'The lights are off. Tap a room and only that one comes on.', 30, y + 10); }
    else if (page === 'curtains') { grid(Object.keys(curtains).map(function (k) { return [curtains[k].label + ': ' + (curtainOpen(k) ? 'open' : 'closed'), 'curtainToggle', k, (curtainOpen(k) ? 'Close the ' : 'Open the ') + curtains[k].label, curtainOpen(k), 19]; }), 3, 88, 12); y += 6; grid([['Open all', 'curtainsOpen', 0, 'Open every curtain', false, 20], ['Close all', 'curtainsClose', 0, 'Close every curtain', false, 20]], 2, 64, 14); }
    else if (page === 'doors') {
      var list = [{ staff: true, id: 'staff', name: 'Staff door', label: 'staff door', open: shop().staffDoor, locked: staffDoorLocked() }].concat(DOORS).slice(0, 10), dw = (W - 60 - 12) / 2, dh = 66;
      list.forEach(function (d, i) { var x = 30 + (i % 2) * (dw + 12), yy = y + Math.floor(i / 2) * (dh + 8); ctx.fillStyle = 'rgba(255,255,255,.05)'; roundRect(ctx, x, yy, dw, dh, 10); ctx.fill(); deskDot(ctx, x + 22, yy + 33, d.locked ? DESK_BAD : d.open ? DESK_OK : DESK_DIM, 8); ctx.fillStyle = DESK_INK; ctx.font = '700 19px ' + DESK_FONT; ctx.fillText(deskTrim(ctx, d.name || d.label, dw - 330), x + 42, yy + 10); ctx.fillStyle = DESK_DIM; ctx.font = '15px ' + DESK_FONT; ctx.fillText((d.locked ? 'locked' : d.open ? 'open' : 'shut') + (staffKey(d.id) ? ' · staff key' : ' · no staff key'), x + 42, yy + 37); tBtn(sc, ctx, x + dw - 300, yy + 12, 90, 42, d.open ? 'Shut' : 'Open', d.staff ? 'staffDoorToggle' : 'doorToggle', d.id, (d.open ? 'Shut the ' : 'Open the ') + d.label, false, { size: 16 }); tBtn(sc, ctx, x + dw - 202, yy + 12, 90, 42, d.locked ? 'Unlock' : 'Lock', d.staff ? 'staffDoorLock' : 'doorLock', d.id, (d.locked ? 'Unlock the ' : 'Lock the ') + d.label, d.locked, { size: 16, col: DESK_BAD, fill: 'rgba(255,107,107,.25)' }); tBtn(sc, ctx, x + dw - 104, yy + 12, 90, 42, 'Key', d.staff ? 'staffDoorKey' : 'doorKey', d.id, (staffKey(d.id) ? 'Take the staff key back for the ' : 'Give the staff a key to the ') + d.label, staffKey(d.id), { size: 16 }); });
      y += Math.ceil(list.length / 2) * (dh + 8) + 6; grid([['Open all', 'doorsAll', 'open', 'Open every door', false, 18], ['Shut all', 'doorsAll', 'close', 'Shut every door', false, 18], ['🔒 Lock all', 'doorsAll', 'lock', 'Lock every door', false, 18], ['Unlock all', 'doorsAll', 'unlock', 'Unlock every door', false, 18]], 4, 52, 12);
    }
    else if (page === 'climate') {
      ['grow', 'dry'].forEach(function (z) { ctx.fillStyle = DESK_INK; ctx.font = '700 22px ' + DESK_FONT; ctx.fillText((z === 'grow' ? 'Grow room' : 'Dry & cure room') + ' · RH ' + Math.round(S.rh[z]) + '% · dehumidifier ' + dehumLabel(z), 30, y); y += 34; grid(dehumSteps().map(function (t) { return [t ? t + '%' : 'off', 'dehumSet', z + ':' + t, (z === 'grow' ? 'Grow room' : 'Dry room') + ' dehumidifier ' + (t ? 'to ' + t + '%' : 'off'), S.dehum[z] === t, 22]; }), dehumSteps().length, 64, 10); y += 16; });
      ctx.fillStyle = DESK_DIM; ctx.font = '17px ' + DESK_FONT; ctx.fillText('Drying speeds up below 55% RH and mould spreads above 60%. Air under 42% makes plants thirstier.', 30, y);
    }
    else {
      ctx.fillStyle = DESK_INK; ctx.font = '700 22px ' + DESK_FONT; ctx.fillText('♪ Radio', 30, y); y += 34; grid(STATION_ORDER.map(function (k) { return [(k === 'off' ? '⏻ ' : '♪ ') + STATIONS[k].name, 'radioSet', k, STATIONS[k].name, sh.radio === k, 19]; }), STATION_ORDER.length, 64, 10); y += 10;
      ctx.fillStyle = DESK_INK; ctx.font = '700 22px ' + DESK_FONT; ctx.fillText('🔊 Volume ' + Math.round((sh.volume || 0) * 100) + '%', 30, y); y += 34; grid([0, 0.25, 0.5, 0.75, 1].map(function (v) { return [Math.round(v * 100) + '%', 'volume', v, 'Volume ' + Math.round(v * 100) + '%', Math.abs((sh.volume || 0) - v) < 0.01, 19]; }), 5, 56, 10); y += 10;
      ctx.fillStyle = DESK_INK; ctx.font = '700 22px ' + DESK_FONT; ctx.fillText('💲 Markup ' + Math.round((sh.markup || 1) * 100) + '%  ·  above 100% every price rises but customers come less often', 30, y); y += 34; grid([0.8, 0.9, 1, 1.1, 1.2, 1.3].map(function (v) { return [Math.round(v * 100) + '%', 'markup', v, 'Markup ' + Math.round(v * 100) + '%', Math.abs((sh.markup || 1) - v) < 0.01, 19]; }), 6, 56, 10);
    }
  }
  function ctlTap(z) {
    if (!z) return; sfx('click');
    if (z.act === 'page') world.ctl.page = z.id;
    else if (z.act === 'volume') { shop().volume = +z.id; save(); ui.refreshOpen(); }
    else if (z.act === 'markup') { shop().markup = +z.id; save(); ui.refreshOpen(); }
    else ctlAct(z.act, z.id);
    cabinetSync();
  }
  function drawCtlScreen() {
    if (!world.ctl || !world.ctl.canvas) return; var c = world.ctl.canvas, ctx = c.getContext('2d'), sh = shop();
    ctx.fillStyle = '#07110b'; ctx.fillRect(0, 0, 256, 128); ctx.strokeStyle = 'rgba(111,220,140,.35)'; ctx.lineWidth = 2; ctx.strokeRect(3, 3, 250, 122);
    ctx.font = '600 30px "Cascadia Mono",Consolas,monospace'; ctx.fillStyle = sh.open ? '#6fdc8c' : '#ff6b6b'; ctx.textBaseline = 'top'; ctx.fillText(sh.open ? 'OPEN' : 'CLOSED', 14, 12);
    ctx.font = '18px "Cascadia Mono",Consolas,monospace'; ctx.fillStyle = '#9fb8a6'; ctx.textAlign = 'right'; ctx.fillText(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), 242, 18); ctx.textAlign = 'left';
    ctx.fillStyle = '#c9dccd'; ctx.fillText('lights  ' + (sh.lights ? 'ON' : 'OFF'), 14, 52); ctx.fillText('door    ' + (sh.staffDoor ? 'OPEN' : 'SHUT'), 14, 74); ctx.fillText('radio   ' + STATIONS[sh.radio].name.toUpperCase().slice(0, 14), 14, 96);
    var closed = Object.keys(curtains).filter(function (k) { return !curtainOpen(k); }).length; ctx.textAlign = 'right'; ctx.fillStyle = '#9fb8a6'; ctx.fillText(closed + '/' + Object.keys(curtains).length + ' drawn', 242, 96); ctx.textAlign = 'left';
    world.ctl.tex.needsUpdate = true; cabinetSync();
  }
  function applyShopState() {
    world.obstacles = world.obstacles.filter(function (o) { return o.tag !== 'frontdoor'; }); if (!shop().open) world.obstacles.push({ x1: -0.8, x2: 0.8, z1: ROOM.z - 0.2, z2: ROOM.z + 0.2, tag: 'frontdoor', floorLevel: 0 });   // a locked front door is a wall
    var sh = shop();
    if (neonSign.open) { neonSign.open.visible = sh.open; } if (neonSign.closed) neonSign.closed.visible = !sh.open; if (neonSign.light) neonSign.light.color.setHex(sh.open ? 0xff4d6d : 0x882233);
    if (world.ctl && world.ctl.rockers) {
      var rk = world.ctl.rockers; rk.open.rotation.x = sh.open ? -0.35 : 0.35; rk.lights.rotation.x = sh.lights ? -0.35 : 0.35; rk.staffDoor.rotation.x = sh.staffDoor ? -0.35 : 0.35;
      rk.openLed.material.color.setHex(sh.open ? 0x00ff66 : 0xff3030); rk.openLed.material.emissive.setHex(sh.open ? 0x00ff66 : 0xff3030); rk.lightsLed.material.emissiveIntensity = sh.lights ? 2 : 0.1; rk.staffDoorLed.material.emissiveIntensity = sh.staffDoor ? 2 : 0.1;
      var idx = STATION_ORDER.indexOf(sh.radio); world.ctl.knob.rotation.y = -1.2 + idx * 0.6; world.ctl.radioLed.material.emissiveIntensity = sh.radio !== 'off' ? 2 : 0.1;
      drawCtlScreen();
    }
    if (world.roomLamps) world.roomLamps.forEach(function (l) { l.userData.off = !(sh.lights && powerOn() && roomLit(roomOf(l.position.x, l.position.z, l.position.y))); if (l.userData.off) l.intensity = 0; });   // dimmed to zero, never hidden: changing the visible light count makes three.js recompile every shader, which was the stall on each switch
    if (world.lampFixtures) world.lampFixtures.forEach(function (m) { var on = sh.lights && powerOn() && roomLit(roomOf(m.position.x, m.position.z, m.position.y)); m.material.emissiveIntensity = on ? 0.9 : 0.05; });
    if (world.switches) world.switches.forEach(function (s) { s.rocker.rotation.x = roomLit(s.room) ? -0.3 : 0.3; s.led.material.emissiveIntensity = roomLit(s.room) ? 1.5 : 0.1; });
    radio.set(sh.radio);
  }
  var ROOM_NAMES = { grow: 'Grow room', dry: 'Dry & cure', office: 'Office', hall: 'Hall & lounge', proc: 'Processing', lobby: 'Lobby', annex: 'Back room', security: 'Security room', up: 'Upstairs', basement: 'Basement works' };
  function roomOf(x, z, y) { if (y !== undefined && y < -1) return 'basement'; if (y !== undefined && y > UP.y - 0.5) return 'up'; if (z < -ROOM.z) return x >= 8 ? 'security' : 'annex'; if (z > 4) return 'lobby'; if (z < -2) return x < -1 ? 'grow' : 'dry'; return x < -4 ? 'office' : x < 4 ? 'hall' : 'proc'; }
  function roomLit(room) { return shop().rooms[room] !== false; }
  function toggleRoomLight(room) { var r = shop().rooms; r[room] = r[room] === false; applyShopState(); sfx('click'); toast('💡 ' + ROOM_NAMES[room] + ' lights ' + (r[room] === false ? 'off' : 'on'), ''); save(); ui.refreshOpen(); }
  function lightSwitch(x, y, z, rotY, room) { var g2 = new THREE.Group(); g2.position.set(x, y, z); g2.rotation.y = rotY; world.group.add(g2); var plate = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.012), colorMat(0xf2f2ee, 0.5)); g2.add(plate); var rocker = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.014), colorMat(0xe8e8e4, 0.5)); rocker.position.z = 0.012; g2.add(rocker); var led = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.01, 0.005), glowMat(0x6fdc8c, 1.5)); led.position.set(0, -0.065, 0.014); g2.add(led); var hit = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.2), MAT.none); g2.add(hit); interactable(hit, { kind: 'switch', room: room }); (world.switches = world.switches || []).push({ room: room, rocker: rocker, led: led }); }
  function buildSwitches() {
    lightSwitch(-2.2, 1.35, 3.89, Math.PI, 'hall'); lightSwitch(7.89, 1.35, -9.7, -Math.PI / 2, 'annex'); lightSwitch(-ROOM.x + 0.11, UP.y + 1.35, -2.0, Math.PI / 2, 'up');
  }
  function toggleShopOpen() { var sh = shop(); sh.open = !sh.open; applyShopState(); sfx(sh.open ? 'rare' : 'bad'); toast(sh.open ? '🟢 The shop is open' : '🔴 The shop is closed. Nobody new comes in; everyone inside is served and sees themselves out.', sh.open ? 'good' : ''); logEvent(sh.open ? 'Opened the shop' : 'Closed the shop', ''); if (!sh.open) shopClosing(); save(); }
  function toggleLights() { var sh = shop(); sh.lights = !sh.lights; if (sh.lights) sh.rooms = {}; applyShopState(); sfx('click'); toast(sh.lights ? '💡 Lights on' : '🌑 Lights off', ''); save(); }

