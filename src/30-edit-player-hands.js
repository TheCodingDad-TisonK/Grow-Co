//@ edit mode, particles, the player and carrying
  // ── Build mode (F2): grab, carry, rotate and drop props and fixtures; placements persist in the save. The creative
  //    catalogue (grow3d-creative.js) is part of the same mode through hooks.editMode: it takes the keys only for your
  //    own builds and the piece you are placing, and everything else here stays furniture. ──
  var edit = { on: false, grabbed: null, hover: null, helper: null, tentDelta: null };
  function editTarget(id) { return id === 'tent' ? world.tentGroup : (propInst[id] && propInst[id].g); }
  function editToggle() {
    if (edit.grabbed || edit.grabbedFx) editDrop();
    edit.on = !edit.on; var eb = $('h-edit'); eb.hidden = !edit.on; eb.innerHTML = '🛠️ Build mode · E grab or place · R turn · Backspace put back · Del remove · C catalogue · F2 done';
    if (!edit.on && edit.helper) { scene.remove(edit.helper); edit.helper = null; }
    runHooks(hooks.editMode, edit.on);
    if (edit.on) { setFocus(null); toast('🛠️ Build mode: aim at furniture, a sign or a screen and E grabs it · C opens the catalogue to build your own · F2 done', ''); } else { toast('Layout saved', 'good'); save(); }
    sfx('click');
  }
  function editHelper(obj) { if (!obj) { if (edit.helper) edit.helper.visible = false; return; } if (!edit.helper) { edit.helper = new THREE.BoxHelper(obj, 0x6fdc8c); scene.add(edit.helper); } edit.helper.visible = true; edit.helper.setFromObject(obj); }
  function editUpdate() {
    if (!edit.on) return;
    var pr = $('h-prompt');
    if (edit.grabbedFx) { fxTick++; if (fxTick % 2 === 0) fxCarry(edit.grabbedFx); editHelper(edit.grabbedFx.root); pr.hidden = false; pr.innerHTML = edit.grabbedFx.table ? '<b>E</b>Put the ' + edit.grabbedFx.label + ' down here <small>it stands on the flat top you look at · R turn · Backspace reset</small>' : '<b>E</b>Hang the ' + edit.grabbedFx.label + ' here <small>it sticks to the surface you look at · R turn · Backspace reset</small>'; return; }
    if (edit.grabbed) {
      ray.setFromCamera(center, camera); var y = player.floor === 1 ? UP.y : 0; var dir = ray.ray.direction; var t = (y - ray.ray.origin.y) / dir.y; var pt;
      if (dir.y < -0.05 && t > 0 && t < 10) pt = ray.ray.origin.clone().add(dir.clone().multiplyScalar(t)); else { var flat = dir.clone(); flat.y = 0; flat.normalize(); pt = ray.ray.origin.clone().add(flat.multiplyScalar(2.6)); pt.y = y; }
      pt.x = clamp(pt.x, -ROOM.x + 0.5, ROOM.x - 0.5); pt.z = clamp(pt.z, -ROOM.z + 0.5, ROOM.z - 0.5);
      if (edit.grabbed === 'tent') { world.tentGroup.position.set(pt.x - TENT_ORIGIN.x, 0, pt.z - TENT_ORIGIN.z); edit.tentDelta = { x: pt.x - TENT_ORIGIN.x, z: pt.z - TENT_ORIGIN.z }; }
      else { var g = propInst[edit.grabbed].g; g.position.x = pt.x; g.position.z = pt.z; }
      editHelper(editTarget(edit.grabbed)); pr.hidden = false; pr.innerHTML = '<b>E</b>Drop ' + PROPS[edit.grabbed].label + ' <small>R rotate · Backspace reset</small>'; return;
    }
    ray.setFromCamera(center, camera); ray.far = 7; var meshes = [];
    PROP_ORDER.forEach(function (id) { var tgt = editTarget(id); if (!tgt || propGone(id)) return; if (PROPS[id].floor !== player.floor && !(PROPS[id].floor === undefined && player.floor === 0)) return; tgt.traverse(function (o) { if (o.isMesh && o.visible && o.material !== MAT.none) meshes.push(o); }); });
    fxHover(meshes); var hits = ray.intersectObjects(meshes, false); ray.far = 3.4;
    var id = hits.length ? hits[0].object.userData.propId : null; if (id === undefined) id = null;
    edit.hoverFx = hits.length && !id && hits[0].object.userData.fxId ? fxById[hits[0].object.userData.fxId] : null;
    edit.hover = id;
    if (edit.hoverFx) { pr.hidden = false; pr.innerHTML = '<b>E</b>' + (edit.hoverFx.table ? 'Pick up the ' : 'Take down the ') + edit.hoverFx.label + ' <small>R turn · Backspace reset · F2 done</small>'; editHelper(edit.hoverFx.root); return; }
    if (id) { pr.hidden = false; pr.innerHTML = '<b>E</b>Grab ' + PROPS[id].label + ' <small>R rotate · Backspace reset' + (id !== 'tent' ? ' · Del remove' : '') + ' · F2 done</small>'; editHelper(editTarget(id)); }
    else { pr.hidden = true; editHelper(null); }
  }
  function editGrab() {
    if (edit.hoverFx && !edit.hover) { edit.grabbedFx = edit.hoverFx; sfx('click'); return; }
    if (!edit.hover) return; var id = edit.hover; edit.grabbed = id;
    world.obstacles = world.obstacles.filter(function (o) { return o.prop !== id && !(id === 'tent' && (o.tag === 'tent' || o.tag === 'pot')); });
    sfx('click');
  }
  function editDrop() {
    if (edit.grabbedFx) { fxDrop(); return; }
    var id = edit.grabbed; if (!id) return; edit.grabbed = null;
    if (!S.layout) S.layout = {};
    if (id === 'tent') { var d = edit.tentDelta || { x: 0, z: 0 }; world.tentGroup.position.set(0, 0, 0); S.layout.tent = { x: TENT_ORIGIN.x + d.x, z: TENT_ORIGIN.z + d.z, rot: 0 }; edit.tentDelta = null; buildProp('tent'); syncShelf(); }
    else { var g = propInst[id].g; S.layout[id] = { x: Math.round(g.position.x * 100) / 100, z: Math.round(g.position.z * 100) / 100, rot: propInst[id].P.rot }; buildProp(id); }
    save(); sfx('ok'); toast('Placed the ' + PROPS[id].label, 'good');
  }
  function editRotate() {
    var rfx = edit.grabbedFx || (!edit.hover && edit.hoverFx); if (rfx) { rfx.root.rotation.y += Math.PI / 2; if (!edit.grabbedFx) { edit.grabbedFx = rfx; fxDrop(); } sfx('click'); return; }
    var id = edit.grabbed || edit.hover; if (!id || id === 'tent') { if (id === 'tent') toast('The tent only moves. It doesn\'t turn.', ''); return; }
    var inst = propInst[id]; inst.P.rot = (inst.P.rot + 1) % 4; inst.g.rotation.y = inst.P.rot * Math.PI / 2;
    if (!edit.grabbed) { if (!S.layout) S.layout = {}; S.layout[id] = { x: inst.g.position.x, z: inst.g.position.z, rot: inst.P.rot }; buildProp(id); save(); }
    sfx('click');
  }
  function editReset() {
    var zfx = edit.grabbedFx || (!edit.hover && edit.hoverFx); if (zfx) { fxReset(zfx); return; }
    var id = edit.grabbed || edit.hover; if (!id) return; edit.grabbed = null; edit.tentDelta = null;
    if (S.layout) delete S.layout[id]; if (id === 'tent') world.tentGroup.position.set(0, 0, 0);
    buildProp(id); if (id === 'tent') syncShelf(); save(); toast('Reset the ' + PROPS[id].label + ' to its default spot', '');
  }

  // ── Particles ─────────────────────────────────────────────────────
  var bursts = [];
  function burst(x, y, z, color, n, mode) {
    var geo = new THREE.BufferGeometry(); var pos = new Float32Array(n * 3); var vel = [];
    for (var i = 0; i < n; i++) {
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      var a = Math.random() * Math.PI * 2, s = randf(0.4, 1.6);
      if (mode === 'down') vel.push([Math.cos(a) * s * 0.3, -randf(0.5, 1.5), Math.sin(a) * s * 0.3]);
      else if (mode === 'up') vel.push([Math.cos(a) * s * 0.5, randf(1.0, 2.6), Math.sin(a) * s * 0.5]);
      else if (mode === 'smoke') vel.push([Math.cos(a) * s * 0.06, randf(0.12, 0.3), Math.sin(a) * s * 0.06]);
      else vel.push([Math.cos(a) * s, randf(0.2, 1.4), Math.sin(a) * s]);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: color, size: 0.05, transparent: true, opacity: 1, depthWrite: false }));
    if (mode === 'smoke') { pts.material.opacity = 0.55; pts.material.size = 0.07; } scene.add(pts); bursts.push({ pts: pts, vel: vel, life: mode === 'smoke' ? 2.6 : 1.1, mode: mode });
  }
  function updateBursts(dt) {
    for (var i = bursts.length - 1; i >= 0; i--) {
      var b = bursts[i]; b.life -= dt; var arr = b.pts.geometry.attributes.position.array;
      for (var k = 0; k < b.vel.length; k++) { var v = b.vel[k]; v[1] -= (b.mode === 'up' ? 2.2 : b.mode === 'smoke' ? -0.12 : 4.5) * dt; arr[k * 3] += v[0] * dt; arr[k * 3 + 1] += v[1] * dt; arr[k * 3 + 2] += v[2] * dt; if (arr[k * 3 + 1] < 0.02) { arr[k * 3 + 1] = 0.02; v[1] = 0; v[0] *= 0.6; v[2] *= 0.6; } }
      b.pts.geometry.attributes.position.needsUpdate = true; b.pts.material.opacity = clamp(b.life, 0, 1) * (b.mode === 'smoke' ? 0.55 : 1);
      if (b.life <= 0) { scene.remove(b.pts); b.pts.geometry.dispose(); b.pts.material.dispose(); bursts.splice(i, 1); }
    }
  }

  // ── Player ────────────────────────────────────────────────────────
  var player = { pos: new THREE.Vector3(0, 1.65, 1.6), yaw: Math.PI, pitch: 0, vel: new THREE.Vector3(), bobT: 0, locked: false, keys: {}, radius: 0.32, stepT: 0, floor: 0, air: false, jumpV: 0, crouch: false, inVan: false };
  function obstacleActive(o) { var fl = o.floorLevel || 0; return fl === 'any' || fl === player.floor; }
  function moveWithCollision(dx, dz) {
    var nx = player.pos.x + dx, nz = player.pos.z + dz, r = player.radius;
    var outside = player.pos.z > ROOM.z + 0.12, inDoor = Math.abs(player.pos.x) < 0.62;   // through the front door and onto the pavement, as far as the kerb
    var bx = outside ? 26 : ROOM.x - r - 0.05, bz = (outside || inDoor) ? (world.sidewalkZ || ROOM.z + 2.6) + 1.45 - r : ROOM.z - r - 0.05;
    if (player.floor === 0) { nx = clamp(nx, -CITY.x, CITY.x); nz = clamp(nz, CITY.z1, CITY.z2); } else if (player.floor !== -1) { nx = clamp(nx, -bx, bx); nz = clamp(nz, -(ROOM.z + 10.5), bz); }   // ground level is the whole town now; upstairs keeps the building's footprint   // the back annex and yard extend past the main building
    // obstacles: separate axis resolution. One that ALREADY overlaps the player is skipped, so there is always a way out of it
    var px0 = player.pos.x, pz0 = player.pos.z; function insideNow(ob) { return px0 + r > ob.x1 && px0 - r < ob.x2 && pz0 + r > ob.z1 && pz0 - r < ob.z2; }
    var tx = nx, tz = player.pos.z;
    for (var i = 0; i < world.obstacles.length; i++) { var o = world.obstacles[i]; if (!obstacleActive(o) || insideNow(o)) continue; if (tx + r > o.x1 && tx - r < o.x2 && tz + r > o.z1 && tz - r < o.z2) tx = player.pos.x; }
    var tz2 = nz;
    for (var j = 0; j < world.obstacles.length; j++) { var o2 = world.obstacles[j]; if (!obstacleActive(o2) || insideNow(o2)) continue; if (tx + r > o2.x1 && tx - r < o2.x2 && tz2 + r > o2.z1 && tz2 - r < o2.z2) tz2 = player.pos.z; }
    player.pos.x = tx; player.pos.z = tz2;
    var st = stairT(tx, tz2); if (st >= 0) player.floor = st >= 0.5 ? 1 : 0;
  }
  // which floor finish is underfoot, for the footstep sound
  function floorSurface() { var x = player.pos.x, z = player.pos.z; if (player.floor === -1) return 'concrete'; if (player.floor === 1) return 'planks'; if (z < -ROOM.z) return x >= 0 && x <= 8 && z >= -12.5 ? 'concrete' : 'outside'; if (z > ROOM.z) return 'outside'; if (z > 4) return 'tile'; if (z < -2) return x < -1 ? 'rubber' : 'concrete'; return x < 4 ? 'planks' : 'concrete'; }
  function updatePlayer(dt) {
    if (drive.on) { updateDrive(dt); return; }
    if (player.downT > 0) { player.downT -= dt; player.vel.set(0, 0, 0); player.pos.y = lerp(player.pos.y, groundY(player.pos.x, player.pos.z) + 0.4, 1 - Math.pow(0.001, dt)); camera.position.set(player.pos.x, player.pos.y, player.pos.z); camera.rotation.set(player.pitch, player.yaw, 0.85 * clamp(player.downT / 1.2, 0, 1)); hurtFlash(clamp(player.downT / 2.5, 0, 0.9)); if (player.downT <= 0) { hurtFlash(0); toast('You get back on your feet', ''); } return; }   // stabbed or shot: on the floor for a few seconds
    var pk = player.keys; player.crouch = player.inVan || (!sit.on && player.locked && !ui.blocked() && !!(pk.ControlLeft || pk.ControlRight));   /* the cargo box is 1.35 m tall: you stoop in there */   // Ctrl held: eyes drop to 1.0 m and the walk slows
    var gy = groundY(player.pos.x, player.pos.z) + (player.crouch ? 1.0 : 1.65);
    if (player.air) { player.jumpV -= 9.8 * dt; player.pos.y += player.jumpV * dt; if (player.jumpV < 0 && player.pos.y <= gy) { player.pos.y = gy; player.air = false; player.jumpV = 0; sfx('step', floorSurface()); } }   // a Space hop: 0.8 m at most, well under every ceiling (ground 3.4, upstairs 3.0, basement 3.2)
    else player.pos.y = lerp(player.pos.y, sit.on ? groundY(player.pos.x, player.pos.z) + (sit.spot && sit.spot.eye ? sit.spot.eye : 1.15) : gy, 1 - Math.pow(0.0005, dt));   /* a seat can set its own eye height: the van stool is up in the cargo box */
    if (!player.locked || ui.blocked()) { if (sit.on) { camera.position.set(player.pos.x, player.pos.y, player.pos.z); camera.rotation.set(player.pitch, player.yaw, 0); } return; }   /* seated behind a screen (the office PC): the view still settles into the chair */
    var k = player.keys; var f = 0, s = 0;
    if (sit.on) { if (k.KeyW || k.KeyS || k.KeyA || k.KeyD) standUp(); camera.position.set(player.pos.x, player.pos.y, player.pos.z); camera.rotation.set(player.pitch, player.yaw, 0); return; }
    if (k.KeyW || k.ArrowUp) f += 1; if (k.KeyS || k.ArrowDown) f -= 1; if (k.KeyD || k.ArrowRight) s += 1; if (k.KeyA || k.ArrowLeft) s -= 1;
    var speed = (player.crouch ? 1.3 : (k.ShiftLeft || k.ShiftRight) ? 4.6 : 2.6) * buffSpeed();
    var moving = f !== 0 || s !== 0;
    if (moving) { var len = Math.hypot(f, s); f /= len; s /= len; }
    var sinY = Math.sin(player.yaw), cosY = Math.cos(player.yaw);
    // forward vector for yaw (camera looks down -z at yaw 0)
    var fx = -sinY, fz = -cosY, rx = cosY, rz = -sinY;
    var vx = (fx * f + rx * s) * speed, vz = (fz * f + rz * s) * speed;
    player.vel.x = lerp(player.vel.x, vx, 1 - Math.pow(0.001, dt)); player.vel.z = lerp(player.vel.z, vz, 1 - Math.pow(0.001, dt));
    moveWithCollision(player.vel.x * dt, player.vel.z * dt);
    if (player.inVan) { var vg = drive.vehicles && drive.vehicles.van && drive.vehicles.van.g; if (vg) { var vh = vg.rotation.y, vdx = player.pos.x - vg.position.x, vdz = player.pos.z - vg.position.z; var lx = clamp(vdx * Math.cos(vh) - vdz * Math.sin(vh), -0.65, 0.65), lz = clamp(vdx * Math.sin(vh) + vdz * Math.cos(vh), -0.55, 2.3); player.pos.x = vg.position.x + lx * Math.cos(vh) + lz * Math.sin(vh); player.pos.z = vg.position.z - lx * Math.sin(vh) + lz * Math.cos(vh); } }   /* kept inside the cargo box */
    var spd = Math.hypot(player.vel.x, player.vel.z);
    if (SET.headBob && spd > 0.3) { player.bobT += dt * spd * 2.4; } else player.bobT = lerp(player.bobT, Math.round(player.bobT / Math.PI) * Math.PI, 0.2);
    if (spd > 0.5) { player.stepT += dt * spd; if (player.stepT > 1.9) { player.stepT = 0; sfx('step', floorSurface()); } }
    var bobY = SET.headBob ? Math.abs(Math.sin(player.bobT)) * 0.035 * clamp(spd / 2.6, 0, 1.6) : 0;
    camera.position.set(player.pos.x, player.pos.y + bobY, player.pos.z);
    camera.rotation.set(player.pitch, player.yaw, 0);
  }
  function onMouseMove(e) {
    if (!player.locked || ui.blocked()) return;
    var sx = 0.0022 * SET.sens * (1 - 0.72 * scope.k);
    if (drive.on) { var lk = drive.look; lk.yaw = clamp(lk.yaw - e.movementX * sx, -2.6, 2.6); lk.pitch = clamp(lk.pitch + e.movementY * sx * (SET.invertY ? -1 : 1), -0.5, 1.1);   /* orbit pitch lifts the camera, which tilts the view DOWN: the sign is the opposite of the on-foot look */ lk.t = 1.4; return; }   /* at the wheel the mouse swings the camera round the car instead of the head */
    player.yaw -= e.movementX * sx; player.pitch -= e.movementY * sx * (SET.invertY ? -1 : 1);
    player.pitch = clamp(player.pitch, -1.45, 1.45);
  }

  // ── Hands & carrying ──────────────────────────────────────────────
  // Everything physical goes through the hands: you pick things up, carry
  // them across the room and use them on something. `S.held` persists.
  var HELD_LABEL = { keys: 'Keyring', crate: 'Crate', cookies: 'Cookies', bat: 'Baseball bat', cigs: 'Cigarettes', tablet: 'Delivery tablet', can2: 'Cold drink', cup2: 'Coffee', cupWater: 'Cup of water', cupEmpty: 'Empty cup', canEmpty: 'Empty can', trashbag: 'Bin bag', pepper: 'Pepper spray', taser: 'Taser', pistol: 'Pistol', shotgun: 'Shotgun', rifle: 'Hunting rifle', ak: 'AK-47', can: 'Watering can', soil: 'Bag of soil', nutrients: 'Nutrients', remedy: 'Pest spray', seed: 'Seed', harvest: 'Fresh harvest', jar: 'Curing jar', joints: 'Joints', bags: 'Eighth bags' };
  // the hotbar: S.held reads and writes the active slot, so every older code path keeps working
  function bindHotbar() { if (!Array.isArray(S.hotbar) || S.hotbar.length !== 6) { var old = S.hotbar; S.hotbar = [null, null, null, null, null, null]; if (Array.isArray(old)) old.slice(0, 6).forEach(function (x, i) { S.hotbar[i] = x || null; }); } if (typeof S.slot !== 'number') S.slot = 0; var legacy = Object.prototype.hasOwnProperty.call(S, 'held') ? S.held : undefined; if (legacy && typeof legacy === 'object') { S.hotbar[S.slot] = legacy; } try { delete S.held; } catch (e) {} Object.defineProperty(S, 'held', { get: function () { return S.hotbar[S.slot] || null; }, set: function (v) { S.hotbar[S.slot] = v || null; }, enumerable: false, configurable: true }); }
  function held() { return S.hotbar && S.hotbar[S.slot] || null; }
  function hotbarFull() { return S.hotbar.every(function (x) { return !!x; }); }
  function freeSlot() { if (!S.hotbar[S.slot]) return S.slot; for (var i = 0; i < 6; i++) if (!S.hotbar[i]) return i; return -1; }
  function selectSlot(i) { S.slot = ((i % 6) + 6) % 6; hud(); if (focus) setFocus(focus); }
  function slotIcon(it) { if (!it) return ''; if (it.kind === 'seed') return strainById(it.strain).emoji; if (it.kind === 'crate') return itemIcon(it.item); return { can: '💧', soil: '🪴', nutrients: '🧪', remedy: '🧴', harvest: '🌿', jar: '🏺', joints: '🚬', bags: '🛍️', cookies: '🍪', broom: '🧹', snack: '🥪', bat: '🏏', cashbag: '💰', keys: '🔑', pepper: '🌶️', taser: '⚡', pistol: '🔫', shotgun: '💥', rifle: '🎯', ak: '🪖', cigs: '🚬', tablet: '📋', can2: '🥤', cup2: '☕', cupWater: '🥤', cupEmpty: '🥛', canEmpty: '🥫', trashbag: '🗑️' }[it.kind] || '📦'; }
  function slotLabel(it) { if (!it) return ''; if (it.kind === 'joints' || it.kind === 'bags' || it.kind === 'cookies') return it.n + ' ' + kindName(it.kind, it.n); if (it.kind === 'crate') return it.n + '× ' + itemName(it.item).split(' ')[0]; if (it.kind === 'harvest') return gram(it.grams); if (it.kind === 'jar') return gram(it.grams); if (it.kind === 'seed') return 'seed'; return (HELD_LABEL[it.kind] || it.kind).split(' ')[0].toLowerCase(); }
  // how many a Shift-pickup grabs: what the current customer still needs, else up to five
  function pileLot(item, h, sid) { var have = sid ? lotOf(item, sid).n : S.pkg[item].n; var want = S.customer && S.customer.arrived && S.customer.want === item ? Math.max(1, S.customer.qty - (S.customer.given ? S.customer.given.n : 0) - (h ? h.n : 0)) : 5; return Math.min(have, want); }
  function heldLabel() { var h = held(); if (!h) return ''; if (h.kind === 'seed') return strainById(h.strain).emoji + ' ' + strainById(h.strain).name + ' seed'; if (h.kind === 'joints') return '🚬 ' + h.n + ' ' + (h.strain ? strainById(h.strain).name + ' ' : '') + 'joint' + (h.n > 1 ? 's' : '') + ' · q' + Math.round(h.qSum / h.n); if (h.kind === 'bags') return '🛍️ ' + h.n + ' ' + (h.strain ? strainById(h.strain).name + ' ' : '') + 'bag' + (h.n > 1 ? 's' : '') + ' · q' + Math.round(h.qSum / h.n); if (h.kind === 'harvest') return '🌿 ' + gram(h.grams) + ' fresh ' + strainById(h.strain).name; if (h.kind === 'crate') return '📦 ' + h.n + ' × ' + itemName(h.item); if (h.kind === 'cookies') return '🍪 ' + h.n + ' ' + (h.strain ? strainById(h.strain).name + ' ' : '') + (h.n > 1 ? 'cookies' : 'cookie') + ' · q' + Math.round(h.qSum / h.n); if (h.kind === 'cashbag') return '💰 ' + money(h.amount); if (h.kind === 'keys') return '🔑 Keyring · Shift+E at a door to lock or unlock it'; if (h.kind === 'bat') return '🏏 Baseball bat · click to swing'; if (WEAPONS[h.kind]) return weaponLabel(h.kind); if (h.kind === 'cigs') return '🚬 ' + h.n + ' × ' + CIG_SKUS[h.sku].name; if (h.kind === 'jar') return '🏺 jar · ' + gram(h.grams) + ' q' + Math.round(h.quality); return { can: '💧 Watering can', soil: '🪴 Bag of soil', nutrients: '🧪 Nutrients', remedy: '🧴 Pest spray', broom: '🧹 Broom', snack: '🥪 Snack', can2: '🥤 Cold drink', cup2: '☕ Fresh coffee', cupWater: '💧 Cup of water · E at the couch, table or cooler to drink', cupEmpty: '🥛 Empty cup · the bin, or refill at the cooler', canEmpty: '🥫 Empty can · the bin', trashbag: '🗑️ Bin bag · the dumpster in the yard' }[h.kind] || h.kind; }
  var hands = new THREE.Group(); camera.add(hands); scene.add(camera); buildSmokeRig();
  var muzzle = new THREE.PointLight(0xffc36b, 0, 7); muzzle.position.set(0.25, -0.15, -0.9); camera.add(muzzle);
  var handSkin = new THREE.MeshStandardMaterial({ color: 0xe8b894, roughness: 0.9 });
  var handL = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), handSkin); handL.scale.set(1, 0.7, 1.3); handL.position.set(-0.28, -0.36, -0.55); hands.add(handL);
  var handR = handL.clone(); handR.position.set(0.3, -0.36, -0.55); hands.add(handR);
  var heldMesh = null, heldKey = '';
  function mixHex(a, b, t) { var ar = a >> 16 & 255, ag = a >> 8 & 255, ab = a & 255, br = b >> 16 & 255, bg = b >> 8 & 255, bb = b & 255; return (Math.round(ar + (br - ar) * t) << 16) | (Math.round(ag + (bg - ag) * t) << 8) | Math.round(ab + (bb - ab) * t); }
  // A cola, not a pile of blobs: calyxes clustered in tapering rings, darker ones mixed through,
  // pistils curling off the sides and a dusting of trichomes. Deterministic, so it does not
  // reshuffle itself every time the mesh is rebuilt.
  function budCola(st, scale) {
    var G = new THREE.Group(), s = scale || 1;
    var budM = new THREE.MeshStandardMaterial({ color: st.bud, roughness: 0.82 });
    var darkM = new THREE.MeshStandardMaterial({ color: mixHex(st.bud, 0x2c3f1e, 0.45), roughness: 0.92 });
    var hairM = new THREE.MeshStandardMaterial({ color: st.hair, roughness: 0.6 });
    var frostM = new THREE.MeshStandardMaterial({ color: 0xf2f6e8, roughness: 0.25, emissive: 0x2a3320, emissiveIntensity: 0.35 });
    var rings = 6;
    for (var r = 0; r < rings; r++) {
      var t = r / (rings - 1);                                  /* 0 at the base, 1 at the tip */
      var rad = (0.036 - t * t * 0.026) * s, y = (-0.052 + r * 0.023) * s;
      var per = r < 4 ? 5 : 3;
      for (var i = 0; i < per; i++) {
        var a = (i / per) * 6.283 + r * 0.82;
        var cal = new THREE.Mesh(new THREE.IcosahedronGeometry((0.019 - t * 0.008) * s, 0), (i + r) % 3 === 0 ? darkM : budM);
        cal.position.set(Math.cos(a) * rad, y, Math.sin(a) * rad);
        cal.scale.set(1, 1.35, 1); cal.rotation.set(a * 0.6, a, 0.2);
        cal.castShadow = true; G.add(cal);
        if ((i + r) % 2 === 0) {   /* a pistil curling out of this calyx */
          var hair = new THREE.Mesh(new THREE.CylinderGeometry(0.0009 * s, 0.0016 * s, 0.017 * s, 4), hairM);
          hair.position.set(Math.cos(a) * (rad + 0.011 * s), y + 0.006 * s, Math.sin(a) * (rad + 0.011 * s));
          hair.rotation.set(0.9, -a, 0.5); G.add(hair);
        }
        if ((i * 3 + r) % 5 === 0) { var fr = new THREE.Mesh(new THREE.SphereGeometry(0.0022 * s, 5, 4), frostM); fr.position.set(Math.cos(a) * (rad + 0.004 * s), y + 0.009 * s, Math.sin(a) * (rad + 0.004 * s)); G.add(fr); }
      }
    }
    var tip = new THREE.Mesh(new THREE.ConeGeometry(0.013 * s, 0.03 * s, 7), budM); tip.position.y = 0.09 * s; tip.castShadow = true; G.add(tip);
    var stem = new THREE.Mesh(new THREE.CylinderGeometry(0.0035 * s, 0.005 * s, 0.03 * s, 6), new THREE.MeshStandardMaterial({ color: 0x6b7a42, roughness: 1 })); stem.position.y = -0.068 * s; G.add(stem);
    return G;
  }
