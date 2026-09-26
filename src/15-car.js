//@ the car: controls, dashboard and the map
  // ── the car's own controls: ignition, handbrake, lights, and the parts that open ──
  var CAR_PART = { doorL: "driver's door", doorR: 'passenger door', boot: 'boot', bonnet: 'bonnet' };
  function carAnyOpen() { var o = carState().open; return !!(o.doorL || o.doorR || o.boot || o.bonnet || o.hatch || o.counter); }
  function carInBay() { var p = drive.g.position, dh = Math.abs(((drive.g.rotation.y - Math.PI / 2) % Math.PI + Math.PI * 1.5) % Math.PI - Math.PI / 2); return Math.abs(p.x - 7.7) < 1.7 && Math.abs(p.z + 15.3) < 1.7 && dh < 0.5; }
  function carPartSet(id, open, quiet, vid) { var V = vid && drive.vehicles ? drive.vehicles[vid] : null, parts = vid ? (V && V.parts) : drive.parts, o = (vid ? vehState(vid) : carState()).open; if (!parts || !parts[id] || o[id] === open) return; o[id] = open; if (!quiet) { sfx('door'); save(); } }   /* vid names a vehicle other than the one in hand, for a door that swings shut after you have walked to the other */
  function carPartToggle(id) { var o = carState().open, want = !o[id]; if (drive.shut && drive.shut.id === id && drive.shut.veh === drive.veh) drive.shut = null; carPartSet(id, want); toast((want ? '🔓 Opened the ' : '🔒 Closed the ') + CAR_PART[id] + (want && id === 'boot' ? ' (' + trunkCount() + ' of ' + trunkCap() + ' inside)' : ''), ''); }
  function carPopBoot() { carPartSet('boot', true); drive.shut = { id: 'boot', t: 3.5, veh: drive.veh }; }
  function ignition(on) {
    if (!drive.on) return;
    if (on === undefined) on = !drive.engineOn;
    if (!on && Math.abs(drive.v) > 1.2) { toast('Roll to a stop before you switch it off', 'bad'); return; }
    drive.engineOn = on;
    if (on) { drive.rpm = 0.3; sfx('engine'); toast('🔑 Engine running' + (carState().brake ? '. P releases the handbrake.' : ''), 'good'); }
    else { drive.rpm = 0; engineSound(0); sfx('click'); toast('🔑 Engine off', ''); }
  }
  function parkBrake(on) { var cs = carState(); if (on === undefined) on = !cs.brake; if (cs.brake === on) return; cs.brake = on; sfx('click'); toast(on ? '🅿️ Handbrake on' : '🅿️ Handbrake off', on ? '' : 'good'); save(); }
  function carLightStep() { var cs = carState(); cs.lights = (cs.lights + 1) % 3; sfx('click'); toast(['💡 Lights off', '💡 Dipped headlights', '🔦 Main beam'][cs.lights], cs.lights ? 'good' : ''); carLamps(); save(); }
  function carLamps() {
    if (!drive.vehicles) return;
    Object.keys(drive.vehicles).forEach(function (vid) {   /* every vehicle shows its own lights; only the one being driven shows brake and reversing lamps */
      var lamps = drive.vehicles[vid].lamps; if (!lamps) return;
      var L = vehState(vid).lights, mine = drive.on && drive.veh === vid, braking = mine && drive.braking, rev = mine && drive.v < -0.3;
      lamps.headM.emissiveIntensity = L === 2 ? 3.2 : L === 1 ? 1.5 : 0.08;
      lamps.tailM.emissiveIntensity = braking ? 3.0 : L ? 1.1 : 0.08;
      lamps.revM.emissiveIntensity = rev ? 2.4 : 0.05;
      lamps.beams.forEach(function (b) { b.intensity = L === 2 ? 2.6 : L === 1 ? 1.3 : 0; b.angle = L === 2 ? 0.42 : 0.62; b.distance = L === 2 ? 55 : 26; });
    });
  }
  function updateCarParts(dt) {
    if (!drive.vehicles) return;
    if (!drive.on) drive.braking = false;
    if (drive.shut) { drive.shut.t -= dt; if (drive.shut.t <= 0) { var sh = drive.shut; drive.shut = null; carPartSet(sh.id, false, false, sh.veh || drive.veh); } }   /* it closes on the vehicle it was opened on, even if you have since turned to the other */
    Object.keys(drive.vehicles).forEach(function (vid) {   /* each vehicle's doors, lids and cargo follow its own saved state, not the one in hand */
      var parts = drive.vehicles[vid].parts; if (!parts) return; var vs = vehState(vid), o = vs.open;
      ['doorL', 'doorR', 'boot', 'bonnet', 'hatch', 'counter', 'rail'].forEach(function (id) { var P = parts[id]; if (!P) return; var want = o[id] ? 1 : 0; if (Math.abs(P.t - want) < 0.002) return; P.t = lerp(P.t, want, 1 - Math.pow(0.004, dt)); if (Math.abs(P.t - want) < 0.005) P.t = want; P.g.rotation[P.axis] = P.max * P.t; });
      if (!parts.cargo) return;
      var cg = vs.cigs, load = trunkCount(vid) + Object.keys(cg).reduce(function (a, k) { return a + cg[k]; }, 0), step = Math.max(1, Math.round(trunkCap(vid) / (parts.cargo.children.length + 1)));
      parts.cargo.children.forEach(function (c, i) { var v = load > i * step; if (c.visible !== v) c.visible = v; });
    });
    carLamps();
  }
  function enterCar() {
    if (drive.on) return; if (sit.on) standUp();
    drive.on = true; drive.v = 0; drive.rpm = 0; drive.engineOn = false; drive.braking = false; drive.warnT = 0; drive.dashT = 0;
    drive.look.yaw = 0; drive.look.pitch = 0.12; drive.look.t = 0; drive.cam.copy(camera.position);
    carPartSet('doorL', true, true); drive.shut = { id: 'doorL', t: 1.2, veh: drive.veh };
    tabletStow();   /* carrying the tablet in puts it in the dash cradle for the round */
    setFocus(null); dashShow(true); sfx('door'); carLamps();
    toast('🚗 I starts the engine · P handbrake · L lights · W and S drive · A and D steer · Space brake · mouse looks · E gets out', '');
  }
  function exitCar() {
    if (!drive.on) return; player.inVan = false; if (Math.abs(drive.v) > 2.5) { toast('Stop the car first', 'bad'); return; }
    var p = drive.g.position, h = drive.g.rotation.y, rx = Math.cos(h), rz = -Math.sin(h); var side = carBlocked(p.x - rx * 1.7, p.z - rz * 1.7, 0.35) ? 1 : -1;
    var cs = carState(); cs.x = p.x; cs.z = p.z; cs.h = h; cs.brake = true;
    carPartSet(side > 0 ? 'doorR' : 'doorL', true, true); drive.shut = { id: side > 0 ? 'doorR' : 'doorL', t: 1.4, veh: drive.veh };
    var bay = carInBay();
    drive.on = false; drive.v = 0; drive.engineOn = false; drive.braking = false; engineSound(0); dashShow(false);
    player.pos.set(p.x + rx * 1.7 * side, 1.65, p.z + rz * 1.7 * side); player.vel.set(0, 0, 0); player.yaw = h + drive.look.yaw; player.pitch = 0; player.floor = 0;
    carLamps(); sfx('door'); toast('🅿️ Handbrake on, engine off' + (bay ? '. Parked at home.' : ''), bay ? 'good' : ''); save();
  }
  function engineSound(level) { if (!SET.sound) { if (drive.eng) drive.eng.g.gain.value = 0; return; } if (level <= 0 && !drive.eng) return; try { audio(); if (!drive.eng) { var o = AC.createOscillator(), gn = AC.createGain(), f = AC.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = 55; f.type = 'lowpass'; f.frequency.value = 420; gn.gain.value = 0; o.connect(f); f.connect(gn); gn.connect(sfxBus); o.start(); drive.eng = { o: o, g: gn }; } drive.eng.g.gain.setTargetAtTime(level > 0 ? 0.035 + level * 0.03 : 0, AC.currentTime, 0.15); drive.eng.o.frequency.setTargetAtTime(48 + level * 120, AC.currentTime, 0.1); } catch (e) {} }
  function updateDrive(dt) {
    var k = player.keys, live = player.locked && !ui.blocked(), g = drive.g, cs = carState(), thr = 0, st = 0;
    if (live) { if (k.KeyW || k.ArrowUp) thr += 1; if (k.KeyS || k.ArrowDown) thr -= 1; if (k.KeyA || k.ArrowLeft) st += 1; if (k.KeyD || k.ArrowRight) st -= 1; }
    drive.warnT -= dt;
    if (thr !== 0 && (!drive.engineOn || cs.brake) && drive.warnT <= 0) { drive.warnT = 2.4; toast(!drive.engineOn ? '🔑 The engine\'s off. Press I to start it.' : '🅿️ The handbrake\'s on. Press P to release it.', 'bad'); }
    if (!drive.engineOn || cs.brake) thr = 0;
    var foot = live && !!k.Space;
    drive.braking = foot || (thr < 0 && drive.v > 0.5) || (cs.brake && Math.abs(drive.v) > 0.2);
    if (thr > 0) drive.v += (drive.v < 0 ? 16 : 8) * dt; else if (thr < 0) drive.v -= (drive.v > 0 ? 18 : 5) * dt; else drive.v -= Math.sign(drive.v) * Math.min(Math.abs(drive.v), (drive.engineOn ? 2.2 : 3.4) * dt);
    if (foot || cs.brake) drive.v -= Math.sign(drive.v) * Math.min(Math.abs(drive.v), (foot ? 26 : 14) * dt);
    var vmax = carAnyOpen() ? Math.min(8, carVmax()) : carVmax();
    drive.v = clamp(drive.v, -6, vmax); var h = g.rotation.y + st * clamp(drive.v / 3.5, -1, 1) * (Math.abs(drive.v) < 9 ? 2.3 : 1.5) * dt; /* tight lock at parking speed so the yard and its gate are workable */ var fx = -Math.sin(h), fz = -Math.cos(h); var nx = g.position.x + fx * drive.v * dt, nz = g.position.z + fz * drive.v * dt;
    function fits(x, z, ax, az) { return !carBlocked(x + ax * 1.2, z + az * 1.2, 0.78) && !carBlocked(x - ax * 1.2, z - az * 1.2, 0.78); }
    if (!fits(nx, nz, fx, fz)) { if (Math.abs(drive.v) > 5 && drive.bumpT <= 0) { sfx('hit'); drive.bumpT = 0.5; } drive.v = -drive.v * 0.25; if (fits(g.position.x, g.position.z, fx, fz)) g.rotation.y = h; } /* nose against something: you can still swing the wheel */ else { g.position.x = nx; g.position.z = nz; g.rotation.y = h; }
    drive.bumpT -= dt; cs.odo += Math.abs(drive.v) * dt; drive.wheels.forEach(function (w, i) { w.rotation.x -= drive.v * dt / 0.32; if (i < 2) w.rotation.y = st * 0.45; });
    drive.rpm = lerp(drive.rpm, drive.engineOn ? clamp(0.16 + Math.abs(drive.v) / Math.max(1, carVmax()) * 0.72 + (thr > 0 ? 0.12 : 0), 0, 1) : 0, 1 - Math.pow(0.02, dt));
    // the yard gate opens for the owner's car and shuts again behind it
    var gd = Math.hypot(g.position.x - 4.5, g.position.z + 18); if (gd < 8 && !world.gateOpen) { gateSet(true); drive.gateAuto = true; } else if (gd > 13 && drive.gateAuto && world.gateOpen) { gateSet(false); drive.gateAuto = false; }
    player.pos.set(g.position.x, 1.65, g.position.z); player.floor = 0; player.vel.set(0, 0, 0); player.yaw = g.rotation.y;
    // the chase camera orbits on the mouse and drifts back behind the car once you stop steering it
    var lk = drive.look;
    if (lk.t > 0) lk.t -= dt; else if (Math.abs(drive.v) > 1.2) { var rec = 1 - Math.pow(0.22, dt); lk.yaw = lerp(lk.yaw, 0, rec); lk.pitch = lerp(lk.pitch, 0.12, rec); }
    var ch = h + lk.yaw, flat = Math.cos(lk.pitch), dist = drive.dist;
    var wx = g.position.x + Math.sin(ch) * dist * flat, wz = g.position.z + Math.cos(ch) * dist * flat;
    if (carBlocked(wx, wz, 0.3)) { wx = g.position.x + Math.sin(ch) * dist * flat * 0.45; wz = g.position.z + Math.cos(ch) * dist * flat * 0.45; }   /* a wall behind the car pulls the camera in rather than through it */
    var want = new THREE.Vector3(wx, Math.max(0.65, 1.0 + dist * 0.15 + dist * Math.sin(lk.pitch)), wz);
    drive.cam.lerp(want, 1 - Math.pow(lk.t > 0 ? 0.0004 : 0.002, dt)); camera.position.copy(drive.cam); camera.lookAt(g.position.x + fx * 0.8, 1.0, g.position.z + fz * 0.8);
    engineSound(drive.engineOn ? clamp(drive.rpm, 0.05, 1) : 0);
    drive.dashT -= dt; if (drive.dashT <= 0) { drive.dashT = 0.05; drawDash(); }
  }
  // ── the dashboard: speedometer, rev counter, gear and the warning lamps ──
  function dashShow(on) { var cv = $('h-dash'), hd = $('g3-hud'); if (hd) hd.classList.toggle('driving', !!on); if (cv) { cv.hidden = !on; if (on) drawDash(); } }
  function dashRound(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function drawDash() {
    var cv = $('h-dash'); if (!cv || !drive.g || cv.hidden) return;
    var ctx = cv.getContext('2d'), W = cv.width, H = cv.height, cs = carState(), cs2 = xs(), on = drive.engineOn;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(10,15,12,.93)'; dashRound(ctx, 2, 2, W - 4, H - 4, 22); ctx.fill(); ctx.strokeStyle = 'rgba(120,200,140,.28)'; ctx.lineWidth = 3; ctx.stroke();
    var cx = 128, cy = 132, R = 92, a0 = Math.PI * 0.78, a1 = Math.PI * 2.22, kmh = Math.abs(drive.v) * 3.6, top = Math.max(1, carVmax() * 3.6), frac = clamp(kmh / top, 0, 1);
    ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(255,255,255,.10)'; ctx.beginPath(); ctx.arc(cx, cy, R, a0, a1); ctx.stroke();
    ctx.strokeStyle = on ? '#6fdc8c' : 'rgba(143,165,150,.45)'; ctx.beginPath(); ctx.arc(cx, cy, R, a0, a0 + (a1 - a0) * Math.max(frac, 0.001)); ctx.stroke();
    ctx.lineCap = 'butt'; ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 2;
    for (var i = 0; i <= 8; i++) { var ta = a0 + (a1 - a0) * i / 8; ctx.beginPath(); ctx.moveTo(cx + Math.cos(ta) * (R - 11), cy + Math.sin(ta) * (R - 11)); ctx.lineTo(cx + Math.cos(ta) * (R - 21), cy + Math.sin(ta) * (R - 21)); ctx.stroke(); }
    var na = a0 + (a1 - a0) * frac; ctx.strokeStyle = '#ffc857'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx - Math.cos(na) * 12, cy - Math.sin(na) * 12); ctx.lineTo(cx + Math.cos(na) * (R - 18), cy + Math.sin(na) * (R - 18)); ctx.stroke();
    ctx.textAlign = 'center'; ctx.fillStyle = '#e8f1ea'; ctx.font = 'bold 44px ui-monospace, Consolas, monospace'; ctx.fillText(String(Math.round(kmh)), cx, cy + 10);
    ctx.fillStyle = '#8fa596'; ctx.font = '15px system-ui, sans-serif'; ctx.fillText('km/h', cx, cy + 32);
    var gear = !on ? 'N' : (cs.brake && Math.abs(drive.v) < 0.5) ? 'P' : drive.v < -0.3 ? 'R' : 'D';
    ['P', 'R', 'N', 'D'].forEach(function (gn, gi) {
      var gx = 258 + gi * 58, act = gn === gear;
      ctx.fillStyle = act ? 'rgba(111,220,140,.16)' : 'rgba(255,255,255,.04)'; dashRound(ctx, gx, 24, 50, 46, 10); ctx.fill();
      ctx.strokeStyle = act ? 'rgba(111,220,140,.8)' : 'rgba(255,255,255,.10)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = act ? '#6fdc8c' : 'rgba(143,165,150,.6)'; ctx.font = 'bold 25px ui-monospace, Consolas, monospace'; ctx.fillText(gn, gx + 25, 56);
    });
    ctx.textAlign = 'right'; ctx.fillStyle = '#8fa596'; ctx.font = '15px system-ui, sans-serif';
    ctx.fillText('odo ' + (cs.odo / 1000).toFixed(2) + ' km', 726, 42); ctx.fillText('boot ' + trunkCount() + ' / ' + trunkCap(), 726, 64);
    ctx.textAlign = 'left'; ctx.fillStyle = '#8fa596'; ctx.font = '12px system-ui, sans-serif'; ctx.fillText('RPM', 258, 82);
    ctx.fillStyle = 'rgba(255,255,255,.07)'; dashRound(ctx, 258, 88, 468, 18, 9); ctx.fill();
    var rw = 468 * clamp(drive.rpm, 0, 1);
    if (rw > 6) { var grd = ctx.createLinearGradient(258, 0, 726, 0); grd.addColorStop(0, '#6fdc8c'); grd.addColorStop(0.7, '#ffc857'); grd.addColorStop(1, '#ff6b6b'); ctx.fillStyle = grd; dashRound(ctx, 258, 88, rw, 18, 9); ctx.fill(); }
    [{ on: cs.brake, txt: 'P BRAKE', col: '#ff6b6b' }, { on: cs.lights > 0, txt: cs.lights === 2 ? 'MAIN BEAM' : 'LIGHTS', col: cs.lights === 2 ? '#7fd4ff' : '#6fdc8c' }, { on: carAnyOpen(), txt: 'OPEN', col: '#ffc857' }, { on: !on, txt: 'IGNITION', col: '#ffc857' }].forEach(function (L, li) {
      var lx = 258 + li * 118;
      ctx.fillStyle = L.on ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.02)'; dashRound(ctx, lx, 120, 108, 34, 8); ctx.fill();
      ctx.strokeStyle = L.on ? L.col : 'rgba(255,255,255,.08)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = L.on ? L.col : 'rgba(143,165,150,.3)'; ctx.font = 'bold 14px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(L.txt, lx + 54, 142);
    });
    var ja = jobAtCar();
    ctx.textAlign = 'left'; ctx.fillStyle = ja >= 0 ? '#6fdc8c' : 'rgba(143,165,150,.9)'; ctx.font = (ja >= 0 ? 'bold ' : '') + '14px system-ui, sans-serif';
    ctx.fillText(ja >= 0 ? 'E hands over drop #' + (ja + 1) + ' · ' + cs2.jobs[ja].qty + ' × ' + jobGoods(cs2.jobs[ja]) : !on ? 'I starts the engine' : cs.brake ? 'P releases the handbrake' : carAnyOpen() ? 'Something is open: T boot · B bonnet' : carInBay() ? 'In your bay: E gets out, Shift+E loads' : 'L lights · T boot · M map · E gets out', 258, 186);
  }
  function laneCount(z) { var n = 0; for (var i = 0; i < traffic.length; i++) if (traffic[i].z === z) n++; return n; }
  function updateCity(dt) {
    traffic.forEach(function (c) {
      var p = c.g.position, ahead = (drive.g.position.x - p.x) * c.dir, side = Math.abs(drive.g.position.z - c.z), pa = (player.pos.x - p.x) * c.dir, ps = Math.abs(player.pos.z - c.z); var stop = (drive.on && ahead > 0 && ahead < 9 && side < 2.4) || (!drive.on && player.floor === 0 && pa > 0 && pa < 7 && ps < 2.2);
      var loop = 2 * (CITY.x - 2), gap = loop, keep = Math.min(45, loop / Math.max(1, laneCount(c.z)) * 0.75);   /* the lane is a loop: a car that has just wrapped round is still the one ahead */
      traffic.forEach(function (o) { if (o === c || o.z !== c.z) return; var d = (o.g.position.x - p.x) * c.dir; if (d < 0) d += loop; if (d < gap) gap = d; });
      var want = stop || gap < 8 ? 0 : gap < keep ? c.v * clamp((gap - 8) / (keep - 8), 0.35, 1) : c.v;   /* closer than its distance, a car eases off until the gap opens again */
      c.cur = lerp(c.cur, want, 1 - Math.pow(0.05, dt)); p.x += c.cur * c.dir * dt; if (p.x * c.dir > CITY.x - 2) p.x = -c.dir * (CITY.x - 2);
    });
    parkFolk.forEach(function (f) { if (f.coolT > 0) f.coolT -= dt; });
    updateCarParts(dt);
    if (cityMap.on) { cityMap.t -= dt; if (cityMap.t <= 0) { cityMap.t = 0.12; drawCityMap(); } }
  }
  // ── the map on M ──
  function toggleCityMap() {
    if (!cityMap.el) { var d = document.createElement('div'); d.style.cssText = 'position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:rgba(6,10,8,.72);pointer-events:none'; var cv = document.createElement('canvas'); cv.width = 1100; cv.height = 720; cv.style.cssText = 'max-width:94vw;max-height:90vh;border:1px solid rgba(111,220,140,.5);border-radius:10px;background:#0d1511'; d.appendChild(cv); document.body.appendChild(d); cityMap.el = d; cityMap.cv = cv; }
    cityMap.on = !cityMap.on; cityMap.el.hidden = !cityMap.on; cityMap.el.style.display = cityMap.on ? 'flex' : 'none'; cityMap.t = 0; sfx('click');
  }
  function drawCityMap() {
    var cv = cityMap.cv, ctx = cv.getContext('2d'), W = 800, H = cv.height, C = CITY, sc = Math.min(W / (C.x * 2 + 8), H / (C.z2 - C.z1 + 8)); function mx(x) { return W / 2 + x * sc; } function mz(z) { return H / 2 + (z - (C.z1 + C.z2) / 2) * sc; }
    ctx.fillStyle = '#16241a'; ctx.fillRect(0, 0, cv.width, H); ctx.fillStyle = '#0f1713'; ctx.fillRect(W, 0, cv.width - W, H);
    C.parks.forEach(function (p) { ctx.fillStyle = '#2f6b35'; ctx.fillRect(mx(p.x1), mz(p.z1), (p.x2 - p.x1) * sc, (p.z2 - p.z1) * sc); });
    ctx.fillStyle = '#3c4148'; C.roads.forEach(function (r) { ctx.fillRect(mx(r.x1), mz(r.z1), (r.x2 - r.x1) * sc, (r.z2 - r.z1) * sc); });
    C.blds.forEach(function (b) { ctx.fillStyle = b.poi ? '#6a7f96' : '#2a3038'; ctx.fillRect(mx(b.x - b.w / 2), mz(b.z - b.d / 2), b.w * sc, b.d * sc); });
    ctx.fillStyle = '#2e7d4f'; ctx.fillRect(mx(-ROOM.x), mz(-ROOM.z), ROOM.x * 2 * sc, ROOM.z * 2 * sc); ctx.fillStyle = '#25603d'; ctx.fillRect(mx(-1), mz(-18), 11 * sc, 9 * sc);
    ctx.strokeStyle = 'rgba(111,220,140,.9)'; ctx.lineWidth = 2; ctx.strokeRect(mx(-ROOM.x), mz(-ROOM.z), ROOM.x * 2 * sc, ROOM.z * 2 * sc);
    ctx.save(); ctx.font = 'bold 10px system-ui, sans-serif'; ctx.fillStyle = 'rgba(200,220,208,.5)'; ctx.textAlign = 'center';
    [['MAIN ST', C.mainZ], ['BACK ST', C.backZ], ['NORTH ST', C.northZ]].forEach(function (r) { ctx.fillText(r[0], mx(-C.x * 0.62), mz(r[1]) + 3); ctx.fillText(r[0], mx(C.x * 0.62), mz(r[1]) + 3); });
    ctx.translate(mx(C.westX), mz((C.z1 + C.z2) / 2)); ctx.rotate(-Math.PI / 2); ctx.fillText('WEST AVE', 0, 3); ctx.restore();
    ctx.save(); ctx.translate(mx(C.eastX), mz((C.z1 + C.z2) / 2)); ctx.rotate(-Math.PI / 2); ctx.font = 'bold 10px system-ui, sans-serif'; ctx.fillStyle = 'rgba(200,220,208,.5)'; ctx.textAlign = 'center'; ctx.fillText('EAST AVE', 0, 3); ctx.restore();
    ctx.font = 'bold 13px system-ui, sans-serif'; ctx.textAlign = 'center';
    C.pois.forEach(function (p, i) { ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(mx(p.x), mz(p.z), 7, 0, 6.29); ctx.fill(); ctx.fillStyle = '#0d1511'; ctx.fillText(String(i + 1), mx(p.x), mz(p.z) + 4.5); });
    var cp = drive.g.position; ctx.save(); ctx.translate(mx(cp.x), mz(cp.z)); ctx.rotate(-drive.g.rotation.y); ctx.fillStyle = '#5aa0d8'; ctx.strokeStyle = '#0d1511'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(5.5, 7); ctx.lineTo(0, 4); ctx.lineTo(-5.5, 7); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.fillStyle = '#9ec9ea'; ctx.font = 'bold 9px system-ui'; ctx.textAlign = 'center'; ctx.fillText('CAR', mx(cp.x), mz(cp.z) - 12);
    drawMapExtras(ctx, mx, mz, W, H);
    ctx.save(); ctx.translate(mx(player.pos.x), mz(player.pos.z)); ctx.rotate(-player.yaw); ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(7, 8); ctx.lineTo(0, 4); ctx.lineTo(-7, 8); ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.textAlign = 'left'; ctx.fillStyle = '#6fdc8c'; ctx.font = 'bold 20px system-ui'; ctx.fillText('TOWN MAP', W + 22, 40); ctx.fillStyle = '#8fa89a'; ctx.font = '12px system-ui'; ctx.fillText('M closes · gold arrow: you · blue arrow: your car', W + 22, 60);
    C.pois.forEach(function (p, i) { var d = Math.round(Math.hypot(p.x - player.pos.x, p.z - player.pos.z)); var y = 100 + i * 46; ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(W + 32, y - 5, 9, 0, 6.29); ctx.fill(); ctx.fillStyle = '#0d1511'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center'; ctx.fillText(String(i + 1), W + 32, y - 1); ctx.textAlign = 'left'; ctx.fillStyle = '#e8f1ea'; ctx.font = 'bold 15px system-ui'; ctx.fillText(p.name, W + 50, y - 2); ctx.fillStyle = '#8fa89a'; ctx.font = '12px system-ui'; ctx.fillText(d + ' m away', W + 50, y + 15); });
    var barM = CITY.x > 150 ? 100 : 50, barPx = barM * sc;   /* a scale bar, because a Workshop city pack changes how much ground the map covers */
    ctx.strokeStyle = 'rgba(200,220,208,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(22, H - 26); ctx.lineTo(22 + barPx, H - 26); ctx.moveTo(22, H - 30); ctx.lineTo(22, H - 22); ctx.moveTo(22 + barPx, H - 30); ctx.lineTo(22 + barPx, H - 22); ctx.stroke();
    ctx.fillStyle = 'rgba(200,220,208,.8)'; ctx.font = '11px system-ui'; ctx.textAlign = 'left'; ctx.fillText(barM + ' m', 26 + barPx, H - 22);
    ctx.save(); ctx.translate(W - 34, 34); ctx.fillStyle = '#8fa89a'; ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(6, 8); ctx.lineTo(0, 4); ctx.lineTo(-6, 8); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#e8f1ea'; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center'; ctx.fillText('N', 0, -16); ctx.restore();
    var tr = carState().trunk, tk = Object.keys(tr).filter(function (k2) { return tr[k2] > 0; }); ctx.fillStyle = '#8fa89a'; ctx.font = '12px system-ui'; ctx.fillText('Boot: ' + (tk.length ? tk.map(function (k2) { return tr[k2] + ' ' + itemName(k2); }).join(', ').slice(0, 44) : 'empty'), W + 22, H - 46); ctx.fillText('Pocket ' + money(S.pocket) + ' · bank ' + money(S.bank), W + 22, H - 24);
  }
