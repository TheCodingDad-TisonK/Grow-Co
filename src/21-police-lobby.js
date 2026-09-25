//@ the police response, fights and lobby visitors
  // ── The police response: a car, two officers and an arrest you can watch ────────────────
  var police = { on: false, phase: '', t: 0, g: null, wheels: [], bar: null, cops: [], took: [], lightT: 0, horn: 0 };
  var COP_KERB = { x: 3.4, z: 0 };   // filled in from the road when the car is built
  function policeBuild() {
    var C = CITY, startX = (C.police ? C.police.x : 96) - 6, lane = C.mainZ - 0.3;
    COP_KERB.z = C.mainZ - 4.0;
    var g = new THREE.Group(); police.wheels = carBody(g, 0xf2f4f7);
    g.position.set(startX, 0, lane); g.rotation.y = -Math.PI / 2;   /* nose pointing west, down Main Street */
    world.group.add(g); police.g = g;
    // the blue stripe and the light bar, so it reads as a police car and not a white hatchback
    var stripe = colorMat(0x1b4f9c, 0.5);
    [-1.02, 1.02].forEach(function (sx) { var b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.34, 2.9), stripe); b.position.set(sx, 0.72, 0.1); b.castShadow = false; g.add(b); });
    var pword = textTex(['POLICE'], 512, 96, { size: 64, bold: true, bg: '#1b4f9c', color: '#ffffff', titleColor: '#ffffff', line: 'rgba(0,0,0,0)' });
    [-1, 1].forEach(function (s) { var pl = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.3), new THREE.MeshBasicMaterial({ map: pword })); pl.position.set(s * 1.056, 0.72, 0.1); pl.rotation.y = s * Math.PI / 2; g.add(pl); });   /* lettered down both flanks */
    var barG = new THREE.Group(); barG.position.set(0, 1.44, -0.15); g.add(barG); police.bar = barG;
    barG.add(new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.07, 0.22), colorMat(0x22262b, 0.6)));
    police.lamp = [-1, 1].map(function (sx, i) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.13, 0.24), glowMat(i ? 0x2f6bff : 0xff2f3a, 1.6));
      m.position.set(sx * 0.3, 0.06, 0); m.castShadow = false; barG.add(m);
      var l = new THREE.PointLight(i ? 0x2f6bff : 0xff2f3a, 0, 14); l.position.set(sx * 0.3, 0.3, 0); barG.add(l);
      return { m: m, l: l };
    });
    police.cops = [0, 1].map(function (i) {
      var h = makeHuman({ skin: pick(SKINS), hair: pick(HAIRS), hairStyle: 'short', shirt: 0x1f2a44, pants: 0x1a2136, shoes: 0x111111, belt: 0x111111, longSleeve: true, mood: 'neutral' }); dressCop(h);
      var cg = new THREE.Group(); cg.add(h); cg.visible = false; world.group.add(cg);
      return { g: cg, h: h, path: [], side: i ? 1 : -1 };
    });
  }
  var copCheck = null;   // the chequered cap band, drawn once
  function dressCop(h) {   // reads as police across the lobby: peaked cap with a chequered band, a black vest lettered POLICE front and back, badge, radio, holster
    var P = h.userData.parts, T = P.torso, H = P.head, blk = colorMat(0x111214, 0.55), gold = colorMat(0xd9b44a, 0.35, 0.8);
    function part(geo, mat, x, y, z, parent, rx) { var m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (rx) m.rotation.x = rx; m.castShadow = true; parent.add(m); return m; }
    part(new THREE.BoxGeometry(0.47, 0.5, 0.29), colorMat(0x17191d, 0.85), 0, 0.37, 0, T);
    var wm = new THREE.MeshBasicMaterial({ map: textTex(['POLICE'], 256, 72, { size: 50, bold: true, bg: 'rgba(0,0,0,0)', color: '#ffffff', titleColor: '#ffffff', line: 'rgba(0,0,0,0)' }), transparent: true });
    var back = part(new THREE.PlaneGeometry(0.4, 0.11), wm, 0, 0.47, -0.148, T); back.rotation.y = Math.PI; back.castShadow = false;
    part(new THREE.PlaneGeometry(0.25, 0.07), wm, 0.085, 0.53, 0.148, T).castShadow = false;
    part(new THREE.CircleGeometry(0.028, 14), gold, -0.11, 0.53, 0.149, T).castShadow = false;
    part(new THREE.BoxGeometry(0.05, 0.1, 0.035), blk, -0.13, 0.6, 0.16, T); part(new THREE.CylinderGeometry(0.004, 0.004, 0.08, 6), blk, -0.14, 0.69, 0.16, T);
    part(new THREE.BoxGeometry(0.05, 0.15, 0.08), blk, 0.235, 0.08, 0.03, T);
    if (!copCheck) { var cv = document.createElement('canvas'); cv.width = 256; cv.height = 32; var cx = cv.getContext('2d'); for (var i = 0; i < 16; i++) for (var j = 0; j < 2; j++) { cx.fillStyle = (i + j) % 2 ? '#101010' : '#f2f2f2'; cx.fillRect(i * 16, j * 16, 16, 16); } copCheck = new THREE.CanvasTexture(cv); }
    part(new THREE.CylinderGeometry(0.155, 0.155, 0.06, 24, 1, true), new THREE.MeshStandardMaterial({ map: copCheck, roughness: 0.7, side: THREE.DoubleSide }), 0, 0.375, 0, H);
    part(new THREE.CylinderGeometry(0.185, 0.155, 0.07, 24), colorMat(0x141b2e, 0.7), 0, 0.44, 0, H);
    part(new THREE.BoxGeometry(0.17, 0.012, 0.09), blk, 0, 0.35, 0.175, H, 0.3);
    part(new THREE.PlaneGeometry(0.04, 0.04), gold, 0, 0.44, 0.176, H).castShadow = false;
  }
  function policeLights(dt) {
    police.lightT += dt;
    var f2 = Math.floor(police.lightT * 4) % 2;
    police.lamp.forEach(function (p, i) { var on = (i === f2); p.m.material.emissiveIntensity = on ? 2.4 : 0.15; p.l.intensity = on ? 2.2 : 0; });
  }
  function policeStart() {
    if (police.on) return;
    if (!police.g) policeBuild();
    var C = CITY;
    police.g.visible = true; police.g.position.set((C.police ? C.police.x : 96) - 6, 0, C.mainZ - 0.3); police.g.rotation.y = -Math.PI / 2;
    police.on = true; police.phase = 'drive'; police.t = 0; police.took = [];
    police.cops.forEach(function (c) { c.g.visible = false; c.path = []; });
    sfx('siren');
    toast('🚓 A car is on its way from the precinct', '');
    logEvent('🚓 A patrol car left the precinct', '');
  }
  function copTargets() { return robbers.filter(function (r) { return r.state !== 'away' && r.state !== 'out' && r.masked; }); }
  function policeDone(msg, good) {
    police.on = false; police.phase = ''; if (police.g) police.g.visible = false;
    police.cops.forEach(function (c) { c.g.visible = false; });
    if (msg) { toast(msg, good ? 'good' : ''); logEvent(msg, good ? 'good' : ''); }
    heist.policeT = 0; hud(); save();
  }
  function updatePolice(dt) {
    if (!police.on) return;
    police.t += dt; policeLights(dt);
    var g = police.g, P = police.phase;
    if (P === 'drive') {
      var tx = COP_KERB.x, tz = police.t > 0.1 && Math.abs(g.position.x - tx) < 9 ? COP_KERB.z : CITY.mainZ - 0.3;
      var sp = Math.abs(g.position.x - tx) > 14 ? 15 : 6;
      g.position.x = lerp(g.position.x, tx, 1 - Math.pow(0.12, dt));
      g.position.z = lerp(g.position.z, tz, 1 - Math.pow(0.35, dt));
      police.wheels.forEach(function (w) { w.rotation.x -= sp * dt; });
      if (Math.abs(g.position.x - tx) < 0.6) {
        g.position.x = tx; police.phase = 'out'; police.t = 0;
        police.cops.forEach(function (c, i) {
          c.g.visible = true; c.g.position.set(tx + c.side * 1.3, 0, COP_KERB.z);
          c.path = routeTo(c.g.position, 0.6 * c.side, ROOM.z - 1.2, true);
        });
        sfx('door'); toast('🚓 Two officers are walking in. "Police. Nobody move."', '');
      }
      return;
    }
    if (P === 'out') {
      var walking = false;
      police.cops.forEach(function (c) { if (c.path.length) { walking = true; if (walkAlong(c.g, c.path, 2.6, dt)) c.path = []; animateHuman(c.h, dt, 'walk', 2.6, null); } else animateHuman(c.h, dt, 'idle', 0, null); });
      if (!walking) {
        var tg = copTargets();
        if (!tg.length) { policeDone('🚓 The officers took a statement and left', false); return; }
        police.cops.forEach(function (c, i) { var r = tg[Math.min(i, tg.length - 1)]; c.path = routeTo(c.g.position, r.g.position.x + c.side * 0.8, r.g.position.z + 0.7, true); });
        police.phase = 'close'; police.t = 0;
      }
      return;
    }
    if (P === 'close') {
      var still = false;
      police.cops.forEach(function (c) { if (c.path.length) { still = true; if (walkAlong(c.g, c.path, 2.9, dt)) c.path = []; animateHuman(c.h, dt, 'walk', 2.9, null); } else animateHuman(c.h, dt, 'idle', 0, null); });
      var tg2 = copTargets();
      if (!tg2.length) { policeDone('🚓 Whoever it was had already gone', false); return; }
      if (!still || police.t > 9) {
        tg2.forEach(function (r) { returnLoot(r); r.state = 'cuffed'; r.t = 0; r.path = []; robberSay(r, 'Alright. Alright.', '#ffc857'); });
        police.took = tg2; police.phase = 'cuff'; police.t = 0; sfx('ok');
      }
      return;
    }
    if (P === 'cuff') {
      police.cops.forEach(function (c) { animateHuman(c.h, dt, 'idle', 0, police.took[0] ? police.took[0].g.position : null); });
      if (police.t > 2.2) {
        var back = { x: COP_KERB.x, z: COP_KERB.z + 1.2 };
        police.cops.forEach(function (c) { c.path = routeTo(c.g.position, back.x + c.side * 1.4, back.z, true); });
        police.took.forEach(function (r) { r.path = routeTo(r.g.position, back.x, back.z + 0.9, true); });
        police.phase = 'walkout'; police.t = 0;
        S.rep += 3; S.stats.foiled = (S.stats.foiled || 0) + 1;
        logEvent('🚓 Arrested and walked out to the car. Word gets round (rep +3)', 'good'); toast('🚓 "Hands behind your back. You\'re coming with us." Arrested (rep +3)', 'good');
      }
      return;
    }
    if (P === 'walkout') {
      var moving = false;
      police.cops.forEach(function (c) { if (c.path.length) { moving = true; if (walkAlong(c.g, c.path, 2.2, dt)) c.path = []; animateHuman(c.h, dt, 'walk', 2.2, null); } else animateHuman(c.h, dt, 'idle', 0, null); });
      police.took.forEach(function (r) { if (r.path && r.path.length) moving = true; });
      if (!moving || police.t > 22) {
        police.took.forEach(function (r) { r.state = 'away'; if (r.g) r.g.visible = false; if (r.bubble) r.bubble.visible = false; standBack(r.h); world.interact = world.interact.filter(function (m) { return m.userData.robberId !== r.id; }); });
        police.cops.forEach(function (c) { c.g.visible = false; });
        police.phase = 'leave'; police.t = 0; sfx('door');
        heist.on = false;
      }
      return;
    }
    if (P === 'leave') {
      g.position.x = lerp(g.position.x, (CITY.police ? CITY.police.x : 96) + 10, 1 - Math.pow(0.25, dt));
      g.position.z = lerp(g.position.z, CITY.mainZ + 2.7, 1 - Math.pow(0.4, dt));
      police.wheels.forEach(function (w) { w.rotation.x -= 13 * dt; });
      if (police.t > 6) policeDone('🚓 They have taken him in', true);
      return;
    }
  }
  var BROWSE_SPOTS = [{ x: -3.4, z: 5.1, yaw: Math.PI }, { x: -7.4, z: 5.1, yaw: Math.PI }, { x: -5.2, z: 8.3, yaw: 0 }, { x: 4.6, z: 6.7, yaw: Math.PI / 2 }, { x: 4.2, z: 8.4, yaw: 0 }];   // the menu board, the posters, the front glass, near the machines
  function browseSpot(r) {
    var s = BROWSE_SPOTS.slice(); ['vend', 'arcade'].forEach(function (k) { var st = lobbyStop(k); if (st) s.push({ x: st.x, z: st.z, yaw: st.yaw }); });
    var taken = robbers.filter(function (x) { return x !== r && x.spot; }).map(function (x) { return x.spot; });
    s = s.filter(function (p) { return !taken.some(function (o) { return Math.hypot(o.x - p.x, o.z - p.z) < 1; }); });
    r.spot = pick(s.length ? s : BROWSE_SPOTS); return r.spot;
  }
  function caseHintOn() { var r = robber; return heist.on && !heist.masked && !heist.aborted && r.state === 'case' && r.pre === 'browse' && r.arrived && r.t > r.caseT * 0.5; }   /* only a browser who lingers gives himself away */
  function fakeIdCaught() { var sharp = clamp(0.62 + (S.upgrades.security2 ? 0.22 : S.upgrades.security ? 0.12 : 0) + (S.staff && S.staff.guardTask === 'door' ? 0.1 : -0.1), 0.3, 0.96); return Math.random() < sharp * 0.45; }   // the fakes are good: the guard catches fewer than half
  function robberInside(r) {   // past the door: into the line like a customer, or off to browse
    r.t = 0; r.arrived = false; r.path = [];
    if (r.plan === 'queue') { r.pre = 'queue'; r.arrived = true; r.slot = -1; r.seq = ++lineSeq; return; }
    var s = browseSpot(r); r.pre = 'browse'; r.faceYaw = s.yaw; r.path = routeTo(r.g.position, s.x, s.z);
  }
  function robberCase(r, dt) {   // before the mask: indistinguishable from anyone walking in, bar the odd look at the till
    var g2 = r.g, P = r.h.userData.parts;
    if (r.delay > 0) { r.delay -= dt; g2.visible = false; return; }
    g2.visible = true;
    if (r.pre === 'walk') { if (walkAlong(g2, r.path, 1.4, dt)) r.pre = 'hold'; animateHuman(r.h, dt, 'walk', 1.4, null); return; }
    if (r.pre === 'hold') { if (!guardOnDuty()) robberInside(r); else if (!doorCheckBusy()) { r.pre = 'tocheck'; r.path = [{ x: LINE_CHECK.x, z: LINE_CHECK.z }]; } animateHuman(r.h, dt, 'idle', 0, null); return; }
    if (r.pre === 'tocheck') { if (walkAlong(g2, r.path, 1.4, dt)) { if (guardOnDuty()) { r.pre = 'check'; r.t = 0; g2.rotation.y = Math.PI / 2; guard.startCheck(g2); } else robberInside(r); } animateHuman(r.h, dt, 'walk', 1.4, null); return; }
    if (r.pre === 'check') { r.t += dt; animateHuman(r.h, dt, 'idle', 0, guard.h ? guard.h.position : null); P.lArm.rotation.x = -1.1; P.lArm.rotation.z = 0.2; if (r.t > 2.6) { P.lArm.rotation.z = 0; if (fakeIdCaught()) heistAbort('id'); else robberInside(r); } return; }
    r.t += dt; var glance = r.t % 7 < 1.3 ? REG_POS : null;
    if (r.pre === 'browse') {
      if (!r.arrived) { if (walkAlong(g2, r.path, 1.3, dt)) { r.arrived = true; r.t = 0; if (r === robber && S.staff && S.staff.guardTask === 'patrol' && Math.random() < 0.45) { heistAbort('guard'); return; } } animateHuman(r.h, dt, 'walk', 1.3, null); return; }
      turnTo(r, r.faceYaw, dt); animateHuman(r.h, dt, 'idle', 0, glance); if (r.t > r.caseT) maskUp(r); return;
    }
    if (r.pre === 'queue') {
      if (r.slot >= 0 && r.path.length) { walkAlong(g2, r.path, 1.4, dt); animateHuman(r.h, dt, 'walk', 1.4, null); }
      else { turnTo(r, r.slot === 0 ? Math.PI : Math.PI / 2, dt); animateHuman(r.h, dt, 'idle', 0, glance || (r.slot === 0 ? player.pos : null)); }
      if (r.slot === 0 && !r.path.length && windowFree()) { r.pre = 'stepup'; r.path = [{ x: 0, z: 5.25 }]; }   /* his turn: he walks up like a customer */
      else if (r.t > r.caseT) maskUp(r);
      return;
    }
    if (r.pre === 'stepup') { if (walkAlong(g2, r.path, 1.4, dt)) maskUp(r); else animateHuman(r.h, dt, 'walk', 1.4, null); }
  }
  function updateRobber(r, dt) {
    var g2 = r.g, K = ROB_KINDS[r.kind], P = r.h.userData.parts;
    if (r.sayT > 0) { r.sayT -= dt; if (r.sayT <= 0) r.bubble.visible = false; }
    function aim() { if (!r.gun) return; P.rArm.rotation.x = -1.4; P.rArm.rotation.z = -0.05; P.rArm.userData.elbow.rotation.x = -0.08; }
    if (r.state === 'case') { robberCase(r, dt); return; }
    if (r.state === 'in') {
      if (walkAlong(g2, r.path, K.speed, dt)) { r.t = 0; if (r.kind === 'snatch') { r.state = 'grab'; robberSay(r, '…', '#ffc857'); } else { r.state = 'demand'; robberSay(r, r.weapon === 'knife' ? 'The till. Now.' : 'Empty the till or I shoot.', '#ff6b6b'); sfx('alarm'); toast('🚨 Robbery. He wants the till, at the window.', 'bad'); hud(); } }
      animateHuman(r.h, dt, 'walk', K.speed, null); aim(); return;
    }
    if (r.state === 'grab') {   // the snatch: one reach over the counter, then legs
      r.t += dt; g2.rotation.y = lerp(g2.rotation.y, Math.PI, 0.15); animateHuman(r.h, dt, 'wait', 0, null); P.rArm.rotation.x = -1.5; P.torso.rotation.x = 0.35;
      if (r.t > 1.6) { P.torso.rotation.x = 0; var tips = Math.floor(S.tips), fist = Math.floor(S.till * 0.4); S.tips -= tips; S.till -= fist; r.grabbed = tips + fist; S.stats.robbed = (S.stats.robbed || 0) + r.grabbed; var left = 3; ['rgrinder', 'lighter', 'rpaper'].forEach(function (k) { var n = Math.min(left, S.display[k] || 0); if (n > 0) { S.display[k] -= n; r.disp[k] = n; left -= n; } }); syncDisplay(); S.rep = Math.max(0, S.rep - 2); robberSay(r, 'Cheers for that.', '#ff6b6b'); sfx('bad'); toast('💸 He grabbed the tip jar and a fistful from the till (' + money(r.grabbed) + '). Stop him before the door.', 'bad'); logEvent('💸 A snatch thief grabbed ' + money(r.grabbed) + ' and whatever was on the counter display (rep -2)', 'bad'); robberFlee(r); hud(); }
      return;
    }
    if (r.state === 'demand') {
      r.t += dt; if (r.alertT <= 0) g2.rotation.y = lerp(g2.rotation.y, Math.PI, 0.1); r.h.userData.impatient = true; animateHuman(r.h, dt, 'wait', 0, player.pos); aim(); armedReact(r, dt); if (r.state !== 'demand') return;
      if (r.t > 4 && !r.guardRolled) { r.guardRolled = true; var chance = clamp((S.upgrades.security2 ? 0.9 : S.upgrades.security ? 0.7 : 0.45) + K.guard + (S.upgrades.guardgun && hasLic('firearm') ? 0.3 : 0), 0.05, 0.95); if (Math.random() < chance) { guard.say(S.upgrades.guardgun && hasLic('firearm') ? 'Drop it. On the floor.' : 'Got him. Out you go.', '#6fdc8c', 3000); robberSay(r, 'Okay, okay.', '#ffc857'); S.rep += 2; logEvent('🛡️ The guard stopped the robbery (rep +2)', 'good'); toast('🛡️ The guard threw the robber out', 'good'); robbers.forEach(function (x) { if (x.state !== 'away' && x.state !== 'out' && x.state !== 'down') { returnLoot(x); robberFlee(x); } }); return; } else guard.say(r.weapon === 'knife' ? 'He\'s got a knife.' : 'He\'s got a gun. I\'m not paid enough for this.', '#ffc857', 2500); }
      if (!r.escal && r.t > K.demandT * 0.55) { r.escal = true; S.rep = Math.max(0, S.rep - 2); if (r.weapon === 'knife') robberSay(r, 'The till, or I cut you.', '#ff6b6b'); else { sfx(r.weapon === 'shotgun' ? 'shotgun' : 'gunshot'); burst(g2.position.x, 2.6, g2.position.z, 0xdddddd, 14, 'out'); robberSay(r, 'Next one\'s for you.', '#ff6b6b'); } toast('🚨 ' + (r.weapon === 'knife' ? 'He\'s losing patience' : 'He fired into the ceiling, and the lobby is terrified') + ' (rep -2)', 'bad'); }
      if (r.t > K.demandT) { if (r.weapon && r.weapon !== 'knife' && player.downT <= 0 && Math.hypot(player.pos.x - g2.position.x, player.pos.z - g2.position.z) < 9 && sightLine(g2)) robberShoot(r, 0.15); if (r.state === 'demand') takeTill(r, false); }
      return;
    }
    if (r.state === 'force') {   // shoulder, boot, crowbar: whatever is quickest
      r.t += dt; animateHuman(r.h, dt, 'idle', 0, null);
      P.rArm.rotation.x = -1.2 + Math.sin(r.t * 11) * 0.7; P.torso.rotation.x = 0.2 + Math.sin(r.t * 11) * 0.12;
      if (r.t > 0.45 && !r.forceHit) { r.forceHit = 1; sfx('hit'); }
      if (r.t > r.forceFor) {
        P.torso.rotation.x = 0; P.rArm.rotation.x = 0;
        var fd = r.forceDoor;
        if (fd) { setDoor(fd.id, true, false); sfx('door'); logEvent('🚪 ' + (fd.name || 'A door') + ' was forced open', 'bad'); toast('🚪 He has forced ' + (fd.name || 'a door'), 'bad'); }
        r.forceDoor = null; r.forceHit = 0; r.state = r.forceBack || 'raid'; r.t = 0;
        r.path = r.forceTo ? routeTo(g2.position, r.forceTo.x, r.forceTo.z, true) : r.path;
      }
      armedReact(r, dt); return;
    }
    if (r.state === 'raid') {
      if (robberForce(r, g2)) return;
      if (walkAlong(g2, r.path, K.speed + 0.4, dt)) { r.state = 'loot'; r.t = 0; robberSay(r, r.raid === 'vault' ? 'Come on. Open.' : 'Jackpot.', '#ffc857'); }
      animateHuman(r.h, dt, 'walk', K.speed + 0.4, null); aim(); armedReact(r, dt); return;
    }
    if (r.state === 'loot') {
      r.t += dt; animateHuman(r.h, dt, 'idle', 0, null); P.torso.rotation.x = 0.45; P.rArm.rotation.x = -1.0 + Math.sin(r.t * 9) * 0.3; P.lArm.rotation.x = -1.0 + Math.cos(r.t * 9) * 0.3; armedReact(r, dt); if (r.state !== 'loot') return;
      if (r.t > (r.raid === 'vault' ? 7 : 6)) { P.torso.rotation.x = 0; finishLoot(r, false); robberFlee(r); }
      return;
    }
    if (r.state === 'flee') {
      if (robberForce(r, g2)) return;
      if (walkAlong(g2, r.path, r.masked ? 3.3 : 1.6, dt)) { if (r.masked && (r.grabbed > 0 || r.goods.length || Object.keys(r.disp).length)) startGetaway(r); else if (r.grabbed > 0 || r.goods.length || Object.keys(r.disp).length) logEvent('💨 The ' + (r.kind === 'crew' ? 'gang' : K.label) + ' got away with ' + (r.grabbed > 0 ? money(r.grabbed) : 'your goods') + (r.goods.length && r.grabbed > 0 ? ' and a bag of your goods' : ''), 'bad'); r.state = 'away'; g2.visible = false; r.bubble.visible = false; world.interact = world.interact.filter(function (m) { return m.userData.robberId !== r.id; }); }
      animateHuman(r.h, dt, 'walk', r.masked ? 3.3 : 1.6, null); return;
    }
    if (r.state === 'cuffed') {   // hands up, and he walks out to the car on his own legs
      r.t += dt;
      if (r.path && r.path.length) { walkAlong(g2, r.path, 1.5, dt); animateHuman(r.h, dt, 'walk', 1.5, null); }
      else animateHuman(r.h, dt, 'idle', 0, null);
      P.lArm.rotation.x = -2.5; P.rArm.rotation.x = -2.5;
      return;
    }
    if (r.state === 'down') { r.t += dt; if (r.t > r.downFor) { standBack(r.h); robberSay(r, 'I\'m going, I\'m going.', '#ffc857'); robberFlee(r); } return; }
    if (r.state === 'out') { r.t += dt; if (r.t > 5) { r.state = 'away'; g2.visible = false; r.bubble.visible = false; standBack(r.h); world.interact = world.interact.filter(function (m) { return m.userData.robberId !== r.id; }); } }
  }
  // ── Fights: two lobby visitors square up; the guard may split them, you can step in, or it ends badly ──
  var fight = null;
  function startFight() {
    var free = loungers.filter(function (l) { return ['walk', 'use', 'smoke', 'sit'].indexOf(l.state) >= 0; }); if (free.length < 2) return;
    var a2 = pick(free), b2 = pick(free.filter(function (l) { return l !== a2; })); if (!b2) return;
    [a2, b2].forEach(function (l) { if (l.state === 'sit' || l.state === 'smoke') { l.g.position.y = 0; poseSeated(l, 0); l.joint.visible = false; l.glow.intensity = 0; } l.prevState = l.state; l.state = 'fight'; l.t = 0; });
    fight = { a: a2, b: b2, t: 0, guardRolled: false }; loungerSay(a2, 'Watch it.', '#ff6b6b'); loungerSay(b2, 'You what?', '#ff6b6b'); a2.h.userData.setMood('angry'); b2.h.userData.setMood('angry');
    sfx('bad'); toast('👊 ' + a2.who + ' and ' + b2.who + ' are squaring up in the lobby', 'bad'); logEvent('👊 ' + a2.who + ' and ' + b2.who + ' started a fight in the lobby', 'bad');
  }
  function endFight(how) {
    if (!fight) return; var f = fight; fight = null;
    [f.a, f.b].forEach(function (l) { if (l.state !== 'fight') return; l.h.userData.setMood(how === 'player' ? 'neutral' : 'angry'); l.plan = []; l.step = -1; l.state = 'leave'; nextStep(l); });
    if (how === 'player') { S.rep += 2; loungerSay(f.a, 'Sorry, boss.', '#6fdc8c'); loungerSay(f.b, 'Yeah. Sorry.', '#6fdc8c'); logEvent('🤝 You broke up the fight (rep +2)', 'good'); toast('🤝 Broke it up (rep +2)', 'good'); }
    else if (how === 'guard') { guard.say('Break it up. Out, both of you.', '#ffc857', 3000); S.rep = Math.max(0, S.rep - 1); logEvent('🛡️ The guard split up the fight (rep -1)', ''); toast('🛡️ The guard split them up', ''); }
    else if (how === 'timeout') { S.rep = Math.max(0, S.rep - 4); var mid = { x: (f.a.g.position.x + f.b.g.position.x) / 2, z: (f.a.g.position.z + f.b.g.position.z) / 2 }; dustList().push({ id: 'd' + now() + randi(0, 999), x: Math.round(mid.x * 100) / 100, z: Math.round(mid.z * 100) / 100, s: 1.1, r: Math.random() * 6.28 }); world.dustDirty = true; logEvent('👊 The fight ran its course and left a mess on the lobby floor (rep -4)', 'bad'); toast('👊 They fought it out (rep -4)', 'bad'); }
  }
  function updateFight(dt) {
    if (!fight && loungers.length >= 2 && Math.random() < dt / 150) startFight();
    if (!fight) return; fight.t += dt;
    [fight.a, fight.b].forEach(function (l, i) { var o = i ? fight.a : fight.b; if (l.state !== 'fight') return; turnTo(l, Math.atan2(o.g.position.x - l.g.position.x, o.g.position.z - l.g.position.z), dt); animateHuman(l.h, dt, 'idle', 0, null); var P = l.h.userData.parts; P.rArm.rotation.x = -1.0 + Math.sin(fight.t * 11 + i) * 0.5; P.lArm.rotation.x = -0.9 + Math.cos(fight.t * 9 + i) * 0.5; P.rArm.userData.elbow.rotation.x = -1.2; P.lArm.userData.elbow.rotation.x = -1.2; P.torso.rotation.x = 0.15 + Math.sin(fight.t * 11 + i) * 0.08; });
    var gpat = S.staff && S.staff.guardTask === 'patrol'; if (fight.t > (gpat ? 2.5 : 5) && !fight.guardRolled) { fight.guardRolled = true; if (gpat || Math.random() < 0.55) { endFight('guard'); return; } }
    if (fight.t > 12) endFight('timeout');
  }

  // ── Lobby visitors: after paying, a customer may hit the vending machine, grab a coffee, sit for a smoke, then leave ──
  var loungers = [];   // every customer body currently doing something in the lobby
  var LOUNGE_SEATS = [{ prop: 'lobbyBenchL', lx: -0.38 }, { prop: 'lobbyBenchL', lx: 0.38 }, { prop: 'lobbyBenchR', lx: -0.38 }, { prop: 'lobbyBenchR', lx: 0.38 }];
  // Where a visitor stands is worked out from where the machine actually is, so it follows the
  // thing when you move it in edit mode and it picks one of your machines when you own several.
  var LOBBY_STOPS = {
    vend:   { prop: 'vending',     off: 0.85, dur: 4.5, act: 1.4 },
    arcade: { prop: 'arcade',      off: 0.85, dur: 9,   act: 1.2 },
    coffee: { prop: 'lobbyCoffee', off: 0.8,  dur: 5.5, act: 1.8 },
    fridge: { prop: 'fridge',      off: 0.8,  dur: 4,   act: 1.5 }
  };
  function lobbyFridges() {   // drinks fridges a customer can walk up to: stood in the lobby, with something cold in them
    return builtUnits('fridge').filter(function (u) { var P = propPlacement(u); return !P.floor && roomOf(P.x, P.z) === 'lobby' && (machState(u).fridge || 0) > 0; });
  }
  function builtUnits(base) { return unitIds(base).filter(function (u) { return propInst[u] && !propPlacement(u).hidden; }); }
  function lobbyStop(kind, unit) {
    var t = LOBBY_STOPS[kind], open = unit ? [unit] : builtUnits(t.prop); if (!open.length) return null;
    var P = propPlacement(pick(open)), r = ((P.rot % 4) + 4) % 4;
    var dx = [0, 1, 0, -1][r], dz = [1, 0, -1, 0][r];   // the prop's front, in quarter turns: 0 is +z
    return { x: P.x + dx * t.off, z: P.z + dz * t.off, yaw: Math.atan2(-dx, -dz), dur: t.dur, act: t.act };
  }
  function freeLoungeSeat() {
    var free = LOUNGE_SEATS.filter(function (s) { return propInst[s.prop] && !loungers.some(function (l) { return l.seat === s; }); });
    return free.length ? pick(free) : null;
  }
  function loungerSay(l, text, color, ms) {
    var ob = l.bubble.material.map; l.bubble.material.map = textTex([text], 512, 160, { size: 44, titleColor: color || '#e8f1ea' }); l.bubble.material.needsUpdate = true; if (ob) ob.dispose(); l.bubble.visible = true;
    clearTimeout(l.sayT); l.sayT = setTimeout(function () { l.bubble.visible = false; }, ms || 2400);
  }
  // everything in the lobby is reached along a corridor at z 6.6 (clear of the posts and the guard), then straight to the spot
  function lobbyPath(from, to) { var p = []; if (Math.abs(from.z - 6.6) > 0.1) p.push({ x: from.x, z: 6.6 }); if (Math.abs(from.x - to.x) > 0.1) p.push({ x: to.x, z: 6.6 }); p.push({ x: to.x, z: to.z }); return p; }
  // what a paid-up customer feels like doing before leaving
  function unitRoll(n, p) { for (var i = 0; i < Math.min(3, n); i++) if (Math.random() < p) return true; return false; }   // one roll per machine standing, up to three: a second machine catches people the first one missed
  function planFor(c) {
    var plan = [];
    if (hasLic('catering') && vendKeys().length && unitRoll(builtUnits('vending').length, 0.35)) plan.push({ kind: 'vend' });
    if (hasLic('catering') && S.upgrades.lobby && S.coffeeStock.cup > 0 && S.coffeeStock.beans > 0 && unitRoll(builtUnits('lobbyCoffee').length, 0.4)) plan.push({ kind: 'coffee' });
    if (hasLic('catering')) { var frs = lobbyFridges(); if (unitRoll(frs.length, 0.3)) plan.push({ kind: 'fridge', unit: pick(frs) }); }   /* a cold can from a fridge stood out in the lobby */
    if (hasLic('amusement') && unitRoll(builtUnits('arcade').length, 0.25)) plan.push({ kind: 'arcade' });
    if (hasLic('lounge') && c.want === 'joints' && Math.random() < 0.4) { var seat = freeLoungeSeat(); if (seat) plan.push({ kind: 'bench', seat: seat }); }
    return plan;
  }
  // hands the served customer's body over to a visitor record so the service window frees up for the next one
  npc.goLobby = function (plan) {
    if (!plan || !plan.length || !npc.human || npc.state === 'away' || loungers.length >= 4) return false;
    var h = npc.human, who = npc.who; var wp = new THREE.Vector3(); npc.g.getWorldPosition(wp);
    h.children.filter(function (ch) { return ch.userData.npc; }).forEach(function (ch) { h.remove(ch); });
    world.interact = world.interact.filter(function (m) { return !m.userData.npc; });
    npc.g.remove(h); npc.human = null; npc.state = 'away'; npc.g.visible = false; npc.bubble.visible = false;
    var g = new THREE.Group(); g.position.set(wp.x, 0, wp.z); g.rotation.y = npc.g.rotation.y; g.add(h); world.group.add(g); g.userData.gated = true;
    var bubble = sprite(textTex(['…'], 512, 160, { size: 44 }), 1.5, 0.58, 0, 2.25, 0, g); bubble.visible = false;
    var lid = 'L' + now() + randi(0, 999); var lhb = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.1, 0.5), MAT.none); lhb.position.y = 1.25; lhb.userData.lounger = lid; h.add(lhb); interactable(lhb, { kind: 'lounger', lid: lid });
    // a joint in the right hand, hidden until they sit down: paper, ember and a point light that flares on each drag
    var el = h.userData.parts.rArm.userData.elbow;
    var joint = new THREE.Group(); joint.position.set(0, -0.36, 0.06); joint.rotation.x = Math.PI / 2; joint.visible = false; el.add(joint);
    joint.add(new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.006, 0.13, 6), colorMat(0xf5f0e0, 0.9)));
    var ember = new THREE.Mesh(new THREE.SphereGeometry(0.009, 6, 6), glowMat(0xff6a1a, 2.0)); ember.position.y = 0.065; joint.add(ember);
    var glow = new THREE.PointLight(0xff7a2a, 0, 0.7); glow.position.y = 0.065; joint.add(glow);
    var benchStep = plan.filter(function (s) { return s.kind === 'bench'; })[0];
    var l = { id: lid, g: g, h: h, who: who, bubble: bubble, joint: joint, glow: glow, plan: plan, step: -1, state: 'walk', next: 'leave', t: 0, path: [],
      seat: benchStep ? benchStep.seat : null, sp: null, yaw: 0, smokeT: randf(26, 42), dragT: randf(1.5, 3), drag: 0, puffed: false, sayT: null };
    loungers.push(l); loungerSay(l, 'Cheers, boss.', '#6fdc8c', 2200); nextStep(l);
    return true;
  };
  npc.goLounge = function () { var seat = freeLoungeSeat(); return seat ? npc.goLobby([{ kind: 'bench', seat: seat }]) : false; };
  function nextStep(l) {
    l.step++; var st = l.plan[l.step]; var from = { x: l.g.position.x, z: l.g.position.z }; l.t = 0;
    if (!st) { l.state = 'leave'; l.joint.visible = false; l.glow.intensity = 0; l.path = exitPath(from); return; }
    if (st.kind === 'bench') {   /* a smoke in the lounge starts with buying the joint, off the goods shelf at the board price; no joints, no sit */
      var jid = Object.keys(S.lots.joints).filter(function (k) { return S.lots.joints[k].n > 0; })[0];
      if (!jid) { l.seat = null; loungerSay(l, 'No joints left? Another time, then.', '#ffc857', 2400); logEvent('🪑 ' + l.who + ' wanted a joint for the lounge, but the goods shelf had none', ''); nextStep(l); return; }
      var jd = lotDraw('joints', jid, 1), jp = Math.max(1, Math.round(jointPrice(jd.q, jd.thc))); S.till += jp; bookSale(jp); S.stats.sold++; syncGoods();
      logEvent('🪑 ' + l.who + ' bought a ' + strainById(jid).name + ' joint to smoke in the lounge (' + money(jp) + ' in the till)', '');
      l.sp = propWorld(st.seat.prop, st.seat.lx, -0.05); l.yaw = propInst[st.seat.prop].g.rotation.y; l.path = lobbyPath(from, { x: l.sp.x, z: l.sp.z - 0.45 }); l.state = 'walk'; l.next = 'sit'; }
    else { var s = lobbyStop(st.kind, st.unit); if (!s) { l.state = 'leave'; return; } l.path = lobbyPath(from, s); l.state = 'walk'; l.next = 'use'; l.useKind = st.kind; l.useUnit = st.unit; l.useYaw = s.yaw; l.useDur = s.dur; l.useAct = s.act; l.acted = false; }
  }
  // the machine does its thing: you get paid, they get something to hold
  function lobbyServe(l) {
    var le = l.h.userData.parts.lArm.userData.elbow;
    if (l.useKind === 'arcade') {
      S.box.arcade += 1; S.stats.arcade = (S.stats.arcade || 0) + 1; sfx('arcade');
      loungerSay(l, pick(['One more go.', 'High score.', 'Argh, so close.']), '#ffd166'); logEvent('🕹️ ' + l.who + ' played the arcade (+$1 in the coin box)', '');
      return;
    }
    if (l.useKind === 'fridge') {   // $2 a can out of the fridge they walked up to, into the vending box
      var FM = machState(l.useUnit || 'fridge');
      if ((FM.fridge || 0) <= 0) { loungerSay(l, 'Fridge is empty?', '#ff6b6b'); logEvent('🧊 ' + l.who + ' found the drinks fridge empty', 'bad'); return; }
      FM.fridge--; S.box.vend += 2; S.stats.fridge = (S.stats.fridge || 0) + 1; sfx('pickup'); syncFridge(l.useUnit || 'fridge');
      var cold = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.11, 10), colorMat(0x3ad0ff, 0.4, 0.3)); cold.position.set(0, -0.37, 0.03); le.add(cold);
      loungerSay(l, pick(['Ice cold.', 'Cheers.', 'Just what I needed.']), '#e8f1ea');
      toast('🧊 ' + l.who + ' took a cold drink from the fridge (+$2 in the vending box)', ''); logEvent('🧊 ' + l.who + ' bought a cold drink from the fridge (+$2)', '');
      return;
    }
    if (l.useKind === 'vend') {
      var vks = vendKeys(); if (!vks.length) { loungerSay(l, 'Sold out?', '#ff6b6b'); logEvent('🥤 ' + l.who + ' found the vending machine empty', 'bad'); return; }
      var vroll = Math.random() * vks.reduce(function (a, k) { return a + S.vendStock[k]; }, 0), vk = vks[vks.length - 1]; for (var vi = 0; vi < vks.length; vi++) { vroll -= S.vendStock[vks[vi]]; if (vroll < 0) { vk = vks[vi]; break; } }   /* whatever is on the racks, in proportion to how much of it there is */
      var pickDrink = vk === 'drink'; S.vendStock[vk]--;
      S.box.vend += 2; S.stats.vend = (S.stats.vend || 0) + 1; sfx('vend');
      var can = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.11, 10), colorMat(pick([0xffd166, 0x3ad0ff, 0x6fdc8c, 0xff8c42]), 0.4, 0.3)); can.position.set(0, -0.37, 0.03); le.add(can);
      var vwhat = pickDrink ? 'a drink' : vk === 'snack' ? 'a snack' : 'something from the ' + itemName(vk).toLowerCase();
      toast('🥤 ' + l.who + ' got ' + vwhat + ' from the machine (+$2 in the box)', ''); logEvent('🥤 ' + l.who + ' bought ' + vwhat + ' from the vending machine (+$2)', '');
      if (propInst.vending) burst(ROOM.x - 1.0, 0.5, 6.8, 0xffffff, 6, 'up');
    } else {
      if (S.coffeeStock.cup <= 0 || S.coffeeStock.beans <= 0) { loungerSay(l, 'No coffee?', '#ff6b6b'); logEvent('☕ ' + l.who + ' found the coffee machine empty', 'bad'); return; }
      S.coffeeStock.cup--; S.coffeeStock.beans--;
      S.box.coffee += 3; S.stats.coffee = (S.stats.coffee || 0) + 1; sfx('coffee');
      var cup = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.028, 0.09, 10), colorMat(0xf5f5f0, 0.5)); cup.position.set(0, -0.37, 0.03); le.add(cup);
      var lid = new THREE.Mesh(new THREE.CylinderGeometry(0.037, 0.037, 0.012, 10), colorMat(0x3a2a1a, 0.6)); lid.position.y = 0.05; cup.add(lid);
      loungerSay(l, pick(['Ahh, coffee.', 'Cheers.', 'Needed that.']), '#e8f1ea');
      toast('☕ ' + l.who + ' bought a coffee (+$3 in the box)', ''); logEvent('☕ ' + l.who + ' bought a coffee in the lobby (+$3)', '');
      if (propInst.lobbyCoffee) burst(ROOM.x - 0.9, 1.1, 8.1, 0xcfd8dc, 8, 'smoke');
    }
  }
  // seated pose, k = 0 standing .. 1 fully seated; the right hand goes to the mouth while dragging
  function poseSeated(l, k) {
    var P = l.h.userData.parts, lk = P.lLeg.userData.knee, rk = P.rLeg.userData.knee, le = P.lArm.userData.elbow, re = P.rArm.userData.elbow, s = 0.18;
    P.lLeg.rotation.x = lerp(P.lLeg.rotation.x, -1.25 * k, s); P.rLeg.rotation.x = lerp(P.rLeg.rotation.x, -1.2 * k, s);
    lk.rotation.x = lerp(lk.rotation.x, 1.0 * k, s); rk.rotation.x = lerp(rk.rotation.x, 0.95 * k, s);
    P.lLeg.rotation.z = 0.08 * k; P.rLeg.rotation.z = -0.1 * k; P.rLeg.position.y = 0.86;
    P.torso.rotation.x = -0.14 * k + (l.h.userData.spec.hunch ? 0.18 : 0); P.torso.rotation.y = 0; P.torso.rotation.z = 0; P.torso.position.y = 0.86;
    P.lArm.rotation.x = lerp(P.lArm.rotation.x, -0.55 * k, s); le.rotation.x = lerp(le.rotation.x, -0.9 * k - 0.25 * (1 - k), s); P.lArm.rotation.z = 0.12;
    var up = l.drag > 0.7;
    P.rArm.rotation.x = lerp(P.rArm.rotation.x, (up ? -0.7 : -0.5) * k, s); re.rotation.x = lerp(re.rotation.x, (up ? -2.0 : -1.05) * k - 0.25 * (1 - k), s); P.rArm.rotation.z = lerp(P.rArm.rotation.z, up ? -0.5 : -0.12, s);
    P.head.rotation.x = lerp(P.head.rotation.x, up ? -0.15 : 0.05, 0.1); P.head.rotation.y = lerp(P.head.rotation.y, Math.sin(world.time * 0.5) * 0.25, 0.05);
  }
  function turnTo(l, yaw, dt) { var diff = yaw - l.g.rotation.y; while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2; l.g.rotation.y += diff * Math.min(1, dt * 6); }
  var _mouth = new THREE.Vector3();
  function updateLoungers(dt) {
    for (var i = loungers.length - 1; i >= 0; i--) {
      var l = loungers[i], P = l.h.userData.parts, speed = l.h.userData.spec.hunch ? 0.9 : 1.4;
      if (l.state === 'walk') { if (walkAlong(l.g, l.path, speed, dt)) { l.state = l.next; l.t = 0; } animateHuman(l.h, dt, 'walk', speed, null); }
      else if (l.state === 'use') {
        l.t += dt; turnTo(l, l.useYaw, dt); animateHuman(l.h, dt, 'idle', 0, null);
        var pressing = l.t < l.useAct + 0.5;   // right arm up at the buttons, then back down once it has paid out
        P.rArm.rotation.x = lerp(P.rArm.rotation.x, pressing ? -1.15 : -0.1, 0.15); P.rArm.userData.elbow.rotation.x = lerp(P.rArm.userData.elbow.rotation.x, pressing ? -0.5 : -0.25, 0.15);
        if (!l.acted && l.t > l.useAct) { l.acted = true; lobbyServe(l); }
        if (l.t > l.useDur) nextStep(l);
      }
      else if (l.state === 'sit') {
        l.t += dt; var k = clamp(l.t / 0.8, 0, 1); turnTo(l, l.yaw, dt);
        l.g.position.x = lerp(l.g.position.x, l.sp.x, 0.1); l.g.position.z = lerp(l.g.position.z, l.sp.z, 0.1); l.g.position.y = -0.22 * k;
        poseSeated(l, k);
        if (k >= 1) { l.state = 'smoke'; l.t = 0; l.joint.visible = true; l.h.userData.setMood('happy'); loungerSay(l, pick(['Ahh.', 'This is the spot.', 'Nice.']), '#6fdc8c'); logEvent('🪑 ' + l.who + ' sat down in the lobby for a smoke', ''); }
      }
      else if (l.state === 'smoke') {
        l.t += dt; poseSeated(l, 1);
        l.dragT -= dt; if (l.dragT <= 0 && !l.drag) { l.drag = 1.6; l.dragT = randf(3, 6); }
        if (l.drag > 0) {
          l.drag -= dt;
          if (l.drag <= 0.7 && !l.puffed) { l.puffed = true; _mouth.set(0, 0.18, 0.22); P.head.localToWorld(_mouth); burst(_mouth.x, _mouth.y, _mouth.z, 0xc9d1cc, 10, 'smoke'); l.h.userData.setMood('sleepy'); }
          if (l.drag <= 0) { l.drag = 0; l.puffed = false; l.h.userData.setMood('happy'); }
        }
        l.glow.intensity = l.drag > 0.7 ? 0.5 + Math.sin(world.time * 30) * 0.15 : 0.08;
        if (Math.random() < dt / 9) loungerSay(l, pick(['Good stuff.', 'Mmm.', 'Top shelf, this.', 'Lovely.', 'Five more minutes.']), '#e8f1ea');
        if (l.t > l.smokeT) { l.state = 'stand'; l.t = 0; loungerSay(l, pick(['Right, off I go.', 'Cheers.', 'See you next week.']), '#6fdc8c'); }
      }
      else if (l.state === 'stand') {
        l.t += dt; var k2 = 1 - clamp(l.t / 0.7, 0, 1); l.g.position.y = -0.22 * k2; poseSeated(l, k2);
        if (k2 <= 0) { l.g.position.y = 0; l.glow.intensity = 0; l.joint.visible = false; l.seat = null; l.h.userData.setMood(CAST[l.who] && CAST[l.who].mood || 'neutral'); nextStep(l); }
      }
      else if (l.state === 'leave') { if (walkAlong(l.g, l.path, speed * 1.05, dt)) { world.group.remove(l.g); disposeTree(l.g); clearTimeout(l.sayT); world.interact = world.interact.filter(function (m) { return m.userData.lounger !== l.id; }); loungers.splice(i, 1); continue; } animateHuman(l.h, dt, 'walk', speed, null); }
      else if (l.state === 'fight') { /* driven by updateFight */ }
      else if (l.state === 'down') { l.t += dt; if (l.t > 4) { standBack(l.h); l.plan = []; l.step = -1; l.state = 'leave'; nextStep(l); loungerSay(l, 'You\'re mad, you are.', '#ff6b6b'); } }
      else if (l.state === 'out') { l.t += dt; if (l.t > 5) { world.group.remove(l.g); disposeTree(l.g); clearTimeout(l.sayT); world.interact = world.interact.filter(function (m) { return m.userData.lounger !== l.id; }); loungers.splice(i, 1); continue; } }
    }
  }


