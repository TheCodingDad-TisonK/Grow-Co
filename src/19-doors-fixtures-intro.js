//@ sliding doors, wall fixtures and the guided intro
  // ── Sliding doors: one in every door frame. E slides it shut or open; the leaf runs sideways into the wall. Staff slide a shut door open for themselves and it closes behind them ──
  var DOORS = [], doorById = {};
  var DOOR_NAMES = { 'd3.0_-9.1': 'Back room door', 'd8.1_-10.7': 'Security room door', 'd-6.5_-2.0': 'Grow room door', 'd6.5_-2.0': 'Dry & cure door', 'd-1.0_-5.5': 'Grow ↔ dry door', 'd-4.0_1.0': 'Office door', 'd4.0_1.0': 'Processing door', flat: 'Door to your flat' };
  function slideDoor(id, x, y0, z, alongX, floorLevel, label, defOpen) {
    var g = new THREE.Group(); g.position.set(x, y0, z); world.group.add(g); var leaf = new THREE.Mesh(new THREE.BoxGeometry(alongX ? 1.22 : 0.06, 2.28, alongX ? 0.06 : 1.22), MAT.darkwood); leaf.position.y = 1.14; leaf.castShadow = true; g.add(leaf);
    [-1, 1].forEach(function (s) { var hd = new THREE.Mesh(new THREE.BoxGeometry(alongX ? 0.04 : 0.03, 0.3, alongX ? 0.03 : 0.04), MAT.chrome); hd.position.set(alongX ? -0.48 : s * 0.045, 1.05, alongX ? s * 0.045 : -0.48); g.add(hd); var pane = new THREE.Mesh(new THREE.BoxGeometry(alongX ? 0.7 : 0.012, 0.9, alongX ? 0.012 : 0.7), MAT.glass); pane.position.set(alongX ? 0 : s * 0.032, 1.6, alongX ? s * 0.032 : 0); g.add(pane); });
    var hitM = new THREE.Mesh(new THREE.BoxGeometry(alongX ? 1.3 : 0.7, 2.3, alongX ? 0.7 : 1.3), MAT.none); hitM.position.set(x, y0 + 1.15, z); world.group.add(hitM); interactable(hitM, { kind: 'door', id: id });
    var led = new THREE.Mesh(new THREE.BoxGeometry(alongX ? 0.05 : 0.075, 0.05, alongX ? 0.075 : 0.05), glowMat(0x39d353, 1.2)); led.position.set(alongX ? -0.48 : 0, 1.3, alongX ? 0 : -0.48); g.add(led);
    var saved = S && S.doors && typeof S.doors[id] === 'boolean' ? S.doors[id] : defOpen; var lk = !!(S && S.doorLocks && S.doorLocks[id]); if (lk) saved = false; var d = { id: id, g: g, x: x, z: z, alongX: alongX, floor: floorLevel, label: (DOOR_NAMES[id] || label).toLowerCase(), name: DOOR_NAMES[id] || label, open: saved, locked: lk, led: led, t: saved ? 1 : 0, auto: 0 }; doorLed(d); DOORS.push(d); doorById[id] = d; doorObstacle(d); doorPose(d); return d;
  }
  function doorPose(d) { var off = d.t * 1.2; d.g.position.x = d.x + (d.alongX ? off : 0); d.g.position.z = d.z + (d.alongX ? 0 : off); }
  function doorObstacle(d) { world.obstacles = world.obstacles.filter(function (o) { return o.doorId !== d.id; }); if (!d.open) world.obstacles.push({ x1: d.x - (d.alongX ? 0.62 : 0.12), x2: d.x + (d.alongX ? 0.62 : 0.12), z1: d.z - (d.alongX ? 0.12 : 0.62), z2: d.z + (d.alongX ? 0.12 : 0.62), tag: 'door', doorId: d.id, floorLevel: d.floor }); }
  function doorLed(d) { var c = d.locked ? 0xff3030 : 0x39d353; d.led.material.color.setHex(c); d.led.material.emissive.setHex(c); }
  function setDoor(id, open, locked) { var d = doorById[id]; if (!d) return; if (locked !== undefined) { d.locked = locked; d.relock = false; } else if (!open && d.relock) { d.locked = true; d.relock = false; } if (d.locked) open = false; d.open = open; d.auto = 0; d.autoT = 0; if (!S.doors) S.doors = {}; if (!S.doorLocks) S.doorLocks = {}; S.doors[id] = d.open; S.doorLocks[id] = d.locked; doorObstacle(d); doorLed(d); }
  function doorsAll(what) { DOORS.forEach(function (d) { if (what === 'open') setDoor(d.id, true, false); else if (what === 'close') setDoor(d.id, false); else if (what === 'lock') setDoor(d.id, false, true); else setDoor(d.id, d.open, false); });
    if (staffDoor.g) { if (what === 'lock') setStaffDoorLock(true); else if (what === 'open' || what === 'unlock') setStaffDoorLock(false); if (what === 'open' || what === 'close') { shop().staffDoor = what === 'open'; staffDoorAuto = false; syncStaffDoorObstacle(); applyShopState(); } }   /* the staff door is one of the doors */
    sfx('curtain'); save(); }
  function toggleDoor(id) { var d = doorById[id]; if (!d) return; if (d.locked) { sfx('bad'); toast('🔒 Locked. Unlock it at the control box, or Shift+E with the keyring.', 'bad'); return; } if (d.open && player.floor === d.floor && Math.hypot(player.pos.x - d.x, player.pos.z - d.z) < 0.55) { toast('Step out of the doorway first', ''); return; } d.open = !d.open; d.auto = 0; if (!S.doors) S.doors = {}; S.doors[id] = d.open; if (!d.open && d.relock) { d.locked = true; d.relock = false; if (!S.doorLocks) S.doorLocks = {}; S.doorLocks[id] = true; doorLed(d); } doorObstacle(d); sfx('curtain'); save(); }
  function staffKey(id) { return !(S.staffKeys && S.staffKeys[id] === false); }   // the crew and the guard carry a key to every door unless you take it back at the control box
  function staffPass(d) { setDoor(d.id, true, false); d.relock = true; d.auto = 1; d.autoT = 0; if (!S.doorLocks) S.doorLocks = {}; S.doorLocks[d.id] = true; sfx('curtain'); }   /* a keyholder unlocks it, walks through and it locks again when it shuts; the save keeps it locked */
  function folkNear(folk, x, z, r) { if (player.floor === 0 && Math.hypot(player.pos.x - x, player.pos.z - z) < r) return true; for (var i = 0; i < folk.length; i++) if (Math.hypot(folk[i].x - x, folk[i].z - z) < r) return true; return false; }
  var staffDoorAuto = false, staffDoorClearT = 0;   // the staff door was opened by someone walking through, so it shuts itself again
  function updateDoors(dt) {
    var folk = []; crew.forEach(function (r) { if (r.g) folk.push(r.g.position); }); if (guard.h) folk.push(guard.h.position);
    var keyed = folk.slice();   /* the crew and the guard: the only ones with keys */
    if (npc.g && npc.state !== 'away') folk.push(npc.g.position);
    loungers.forEach(function (l) { if (l.g) folk.push(l.g.position); });
    lineup.forEach(function (m) { folk.push(m.g.position); });
    robbers.forEach(function (r) { if (r.g && r.state !== 'away' && r.state !== 'force') folk.push(r.g.position); });   /* a robber mid-break is handled by his own state, not by standing close */
    var sdFolk = staffDoorLocked() ? (staffKey('staff') ? keyed : []) : folk;   /* locked: only a keyholder lets themselves through */
    if (!shop().staffDoor && sdFolk.length) {
      for (var sdi = 0; sdi < sdFolk.length; sdi++) {
        if (Math.abs(sdFolk[sdi].x - 10) < 1.3 && Math.abs(sdFolk[sdi].z - 4) < 1.1) { shop().staffDoor = true; staffDoorAuto = true; staffDoorClearT = 0; syncStaffDoorObstacle(); sfx('curtain'); save(); break; }
      }
    } else if (shop().staffDoor && staffDoorAuto) {   /* shuts 4 s after the last person is clear of it */
      if (folkNear(folk, 10, 4, 1.4)) staffDoorClearT = 0; else if ((staffDoorClearT += dt) >= 4) { staffDoorAuto = false; staffDoorClearT = 0; shop().staffDoor = false; syncStaffDoorObstacle(); sfx('curtain'); save(); }
    }
    DOORS.forEach(function (d) {
      if (!d.open && !d.locked && d.floor === 0) {
        for (var i = 0; i < folk.length; i++) {   /* staff and visitors let themselves through anything that is not locked */
          if (Math.hypot(folk[i].x - d.x, folk[i].z - d.z) < 1.1) { setDoor(d.id, true); d.auto = 1; d.autoT = 0; sfx('curtain'); break; }
        }
      } else if (!d.open && d.locked && d.floor === 0 && staffKey(d.id)) {
        for (var ki = 0; ki < keyed.length; ki++) if (Math.hypot(keyed[ki].x - d.x, keyed[ki].z - d.z) < 1.1) { staffPass(d); break; }
      } else if (d.open && d.auto) {   /* opened by someone walking through: it slides shut 4 s after the last person is clear */
        if (folkNear(folk, d.x, d.z, 1.4)) d.autoT = 0; else if ((d.autoT = (d.autoT || 0) + dt) >= 4) { setDoor(d.id, false); sfx('curtain'); }
      }
      var want = d.open ? 1 : 0;
      if (Math.abs(d.t - want) < 0.002) return;
      d.t = lerp(d.t, want, 1 - Math.pow(0.006, dt)); if (Math.abs(d.t - want) < 0.004) d.t = want; doorPose(d);
    });  }
  // three places can be shut and locked: the goods shelf, the cigarette cabinet and the weapon locker.
  var LOCKABLE = { goodsShelf: { name: 'goods shelf', shutter: 'goods' }, cigCabinet: { name: 'cigarette cabinet', shutter: 'cigs' }, gunLocker: { name: 'weapon locker', shutter: null } };
  function locks() { if (!S.locks) S.locks = {}; return S.locks; }
  function isLocked(id) { return !!locks()[id]; }
  function shutterOpen(id) { if (id === 'cigCabinet') return !!S.cigShutter; if (!S.shutters) S.shutters = {}; var k = LOCKABLE[id].shutter, v = S.shutters[k]; return v === undefined ? true : !!v; }   /* the goods shelf starts open: it is used constantly, and an existing save must not suddenly find it shut */
  function setShutter(id, open) { if (isLocked(id) && open) return false; if (id === 'cigCabinet') S.cigShutter = open; else { if (!S.shutters) S.shutters = {}; S.shutters[LOCKABLE[id].shutter] = open; } sfx('curtain'); save(); return true; }
  function toggleLock(id) {
    var L = LOCKABLE[id]; if (!L) return;
    if (!hasKeys()) { sfx('bad'); toast('🔑 You need the keyring: it hangs on the hook in the office', 'bad'); return; }
    var now2 = !isLocked(id); locks()[id] = now2;
    if (now2 && L.shutter) { if (id === 'cigCabinet') S.cigShutter = false; else { if (!S.shutters) S.shutters = {}; S.shutters[L.shutter] = false; } }   /* locking rolls the gate down */
    sfx(now2 ? 'click' : 'curtain'); toast((now2 ? '🔒 Locked the ' : '🔓 Unlocked the ') + L.name, now2 ? '' : 'good'); save();
  }
  function lockedStop(id) { if (!isLocked(id)) return false; sfx('bad'); toast('🔒 The ' + LOCKABLE[id].name + ' is locked. Shift+E with the keyring unlocks it.', 'bad'); return true; }
  function lockNote(id) { return isLocked(id) ? '🔒 locked' : hasKeys() ? 'Shift+E locks it' : ''; }
  function hasKeys() { return (S.hotbar || []).some(function (x) { return x && x.kind === 'keys'; }); }
  function syncKeyHook() { if (world.keyRing) world.keyRing.visible = !hasKeys(); }   /* the ring is either on the hook or in your hands, never both */
  function keyHookPrompt(h) { return hasKeys() ? 'Key hook <small>your keyring is in your hands</small>' : 'Take the keyring <small>Shift+E at a door then locks or unlocks it</small>'; }
  function keyHookInteract() { if (hasKeys()) { toast('You already have the keyring', ''); return; } if (hotbarFull()) { toast('Your hands are full (G puts something down)', 'bad'); return; } take({ kind: 'keys' }); syncKeyHook(); toast('🔑 Got the keyring. Shift+E at any door locks or unlocks it.', 'good'); }
  function keyDoor(id) {
    var d = doorById[id]; if (!d) return;
    if (!hasKeys()) { sfx('bad'); toast('🔑 You need the keyring: it hangs on the hook in the office', 'bad'); return; }
    if (!d.locked && player.floor === d.floor && Math.abs(player.pos.x - d.x) < 1.1 && Math.abs(player.pos.z - d.z) < 1.1) { toast('Step out of the doorway first', ''); return; }
    setDoor(id, d.open, !d.locked); sfx(d.locked ? 'click' : 'curtain'); toast(d.locked ? '🔒 Locked the ' + d.label : '🔓 Unlocked the ' + d.label, d.locked ? '' : 'good'); save();
  }
  function doorPrompt(d) { if (d.kind !== 'door') return ''; var o = doorById[d.id]; if (!o) return ''; var k = hasKeys(); if (o.locked) return '🔒 ' + o.name + ' <small>' + (k ? 'Shift+E unlocks it' : 'locked · the keyring hangs in the office') + '</small>'; return (o.open ? 'Slide the ' + o.label + ' shut' : 'Slide the ' + o.label + ' open') + (k ? ' <small>Shift+E locks it</small>' : ''); }
  // ── Fixtures: wall-hung things (every sign, the desk screen, the staff roster) that F2 edit mode can carry. Unlike furniture they move in 3D and snap flat onto whatever surface you look at ──
  var FIXTURES = [], fxById = {}, fxSignCount = {}, fxRay = new THREE.Raycaster(), fxTick = 0; fxRay.layers.enable(TOWN_LAYER);
  // opts.table: it stands on a flat top instead of hanging on a wall. Its origin is its base (opts.baseY, or the lowest
  // visible point), it only settles on a surface that faces up, and turning it is left to R.
  function fixtureAdd(id, label, objs, baseYaw, opts) {
    objs.forEach(function (o) { var old = o.userData.fxId; if (old && fxById[old]) { FIXTURES.splice(FIXTURES.indexOf(fxById[old]), 1); delete fxById[old]; } });   // a sign that belongs to a bigger fixture stops being its own
    var table = !!(opts && opts.table), root = objs[0], grouped = objs.length > 1 || table;
    if (grouped) {
      root = new THREE.Group(); root.position.copy(objs[0].getWorldPosition(new THREE.Vector3()));
      if (table) { var bb = new THREE.Box3(); objs.forEach(function (o) { o.updateMatrixWorld(true); o.traverse(function (m) { if (m.isMesh && m.material !== MAT.none) bb.expandByObject(m); }); }); var bc = bb.getCenter(new THREE.Vector3()); root.position.set(bc.x, opts.baseY !== undefined ? opts.baseY : bb.min.y, bc.z); }
      world.group.add(root); objs.forEach(function (o) { root.attach(o); });
    }
    var fx = { id: id, label: label, root: root, grouped: grouped, baseYaw: baseYaw || 0, base: null, table: table }; root.traverse(function (o) { o.userData.fxId = id; }); FIXTURES.push(fx); fxById[id] = fx; return fx;
  }
  function fixtureFromBuild(id, label, baseYaw, fn, opts) { var n0 = world.group.children.length; fn(); var objs = world.group.children.slice(n0); if (objs.length) fixtureAdd(id, label, objs, baseYaw, opts); }
  function fixtureSign(m, lines) { var key = 'sign:' + String(lines && lines[0] || 'sign').slice(0, 32); fxSignCount[key] = (fxSignCount[key] || 0) + 1; fixtureAdd(key + '#' + fxSignCount[key], 'sign “' + String(lines && lines[0] || '').slice(0, 24) + '”', [m], 0); }
  function applyFixtures() {
    if (!S.fixtures || typeof S.fixtures !== 'object') S.fixtures = {};
    FIXTURES.forEach(function (fx) { if (!fx.base) fx.base = { x: fx.root.position.x, y: fx.root.position.y, z: fx.root.position.z, ry: fx.root.rotation.y }; var s = S.fixtures[fx.id]; if (s) { fx.root.position.set(s.x, s.y, s.z); fx.root.rotation.y = s.ry; } });
  }
  function fxFace(fx, yaw) { fx.root.rotation.y = fx.grouped ? yaw - fx.baseYaw : yaw; }
  function fxCarry(fx) {   // follow the crosshair: stick flat to the surface under it, or float in front of you when there is none in reach
    fxRay.setFromCamera(center, camera); fxRay.far = 5; fxRay.camera = camera; var o = fxRay.ray.origin, d = fxRay.ray.direction; var hits = fxRay.intersectObjects(world.group.children, true), pick = null;
    for (var i = 0; i < hits.length; i++) { var ob = hits[i].object; if (!ob.isMesh || !hits[i].face || ob.userData.fxId === fx.id) continue; var m = ob.material; if (!m || m === MAT.none || m.visible === false || (m.transparent && m.opacity < 0.5)) continue; var vis = true; for (var p = ob; p; p = p.parent) if (!p.visible) vis = false; if (!vis) continue; if (hits[i].distance < 0.5) continue; pick = hits[i]; break; }
    var pn = pick ? pick.face.normal.clone().transformDirection(pick.object.matrixWorld) : null;
    if (fx.table) { if (pn && pn.y > 0.7) fx.root.position.copy(pick.point); else fx.root.position.set(o.x + d.x * 1.6, o.y + d.y * 1.6, o.z + d.z * 1.6); return; }   /* a counter, a desk, a shelf: never a wall */
    if (pick) { fx.root.position.copy(pick.point).add(pn.clone().multiplyScalar(0.045)); if (Math.abs(pn.y) < 0.5) fxFace(fx, Math.atan2(pn.x, pn.z)); }
    else fx.root.position.set(o.x + d.x * 2.2, o.y + d.y * 2.2, o.z + d.z * 2.2);
  }
  function fxHover(meshes) { FIXTURES.forEach(function (fx) { fx.root.traverse(function (o) { if (o.isMesh && o.visible) meshes.push(o); }); }); }   /* invisible hit boxes count here: a small sign or hook is easier to grab by the generous box the game already uses for E */
  function fxDrop() { var fx = edit.grabbedFx; if (!fx) return; edit.grabbedFx = null; var r = fx.root; S.fixtures[fx.id] = { x: Math.round(r.position.x * 100) / 100, y: Math.round(r.position.y * 100) / 100, z: Math.round(r.position.z * 100) / 100, ry: r.rotation.y }; save(); sfx('ok'); toast((fx.table ? 'Put down the ' : 'Hung the ') + fx.label, 'good'); }
  function fxReset(fx) { edit.grabbedFx = null; delete S.fixtures[fx.id]; fx.root.position.set(fx.base.x, fx.base.y, fx.base.z); fx.root.rotation.y = fx.base.ry; save(); toast('Put the ' + fx.label + ' back where it was', ''); }
  // ── Guided intro ─────────────────────────────────────────────────
  // Nine steps that walk a new shop from its first order to its first sale. Each step watches the save
  // for the thing it asked for, so the player can wander off, do it their own way, and still tick it off.
  var INTRO_BONUS = 1200;
  function anySeed() { return Object.keys(S.supplies || {}).some(function (k) { return k.indexOf('seed_') === 0 && S.supplies[k] > 0; }); }
  function anyPotSoil() { return Object.keys(S.potSoil || {}).some(function (k) { return S.potSoil[k]; }); }
  var INTRO_STEPS = [
    { t: 'Order your first supplies', d: 'Go to the <b>office</b> (left of the hall) and use the <b>office PC</b>. Order a <b>bag of soil</b> under Supplies and one <b>seed</b> in the Seed bank. The supplier\'s van brings them round the back. What arrives lands on the <b>supply rack</b> beside the office PC, or as crates in the back room.', ok: function () { return S.supplies.soil > 0 && anySeed(); } },
    { t: 'Fill a pot with soil', d: 'Pick up the <b>bag of soil</b> from the supply rack with <b>E</b>, carry it into the <b>grow tent</b>, and press <b>E</b> on an empty pot.', ok: anyPotSoil },
    { t: 'Plant the seed', d: 'Fetch the <b>seed</b> from the supply rack and press <b>E</b> on the pot you just filled.', ok: function () { return S.plants.length > 0; } },
    { t: 'Water it, and feed it once', d: 'The <b>watering can</b> stands beside the tent. Water the plant whenever it says it\'s thirsty, and give it <b>nutrients</b> once: fed plants are worth far more. Spray any pest or mould the moment you see one.', ok: function () { return S.plants.some(function (p) { return p.fed || p.progress > 0.35; }) || S.batches.length > 0 || S.cured.g > 0; } },
    { t: 'Harvest, then hang it up to dry', d: 'When the plant glows and says ready, harvest it with <b>empty hands</b>, carry the bunch to the <b>drying line</b> in the dry room and press <b>E</b> to hang it. It goes to the curing shelf when it\'s dry.', ok: function () { return S.batches.length > 0 || S.cured.g > 0; } },
    { t: 'Empty a cured jar into your stash', d: 'Once a jar appears on the <b>curing shelf</b>, carry it to the <b>workbench</b> in the processing room and press <b>E</b> to empty it. Jars keep gaining quality while they sit, so there\'s no rush.', ok: function () { return S.cured.g > 0; } },
    { t: 'Pack something to sell', d: 'At the <b>workbench</b>, bag an eighth or roll a few joints. You need <b>baggies</b> for bags, and <b>papers</b> and <b>tips</b> for joints, all from the office PC. What you pack appears on the <b>goods shelf</b>.', ok: function () { return S.pkg.bags.n > 0 || S.pkg.joints.n > 0 || S.pkg.cookies.n > 0; } },
    { t: 'Open the shop', d: 'Find the <b>control box</b> (it starts in the security room, and F2 lets you hang it anywhere) or the <b>front panel</b> behind the till, and open the shop. Customers only come in while you\'re open.', ok: function () { return shop().open; } },
    { t: 'Serve your first customer', d: 'Someone will walk in and wait at <b>the window</b>. Take what they asked for off the <b>goods shelf</b>, press <b>E</b> on them to hand it over, then take the money at the <b>till</b>.', ok: function () { return (S.stats.sold || 0) > 0 || (S.stats.earned || 0) > 0; } }
  ];
  function intro() { if (!S.intro) S.intro = { i: 0, done: false, skipped: false }; return S.intro; }
  function introRunning() { var I = intro(); return !I.done && !I.skipped && ui.started; }
  function introSkip(quiet) { var I = intro(); if (I.done || I.skipped) return; I.skipped = true; introDraw(); save(); if (!quiet) { sfx('click'); toast('Intro skipped. The guide in the pause menu has everything if you want it later.', ''); } }
  function introRestart() { var paid = intro().paid; S.intro = { i: 0, done: false, skipped: false, paid: paid }; introDraw(); save(); sfx('ok'); toast('Intro restarted', 'good'); }
  function introFinish() {
    var I = intro(); I.done = true; I.i = INTRO_STEPS.length;
    var pay = !I.paid; if (pay) { I.paid = true; S.bank += INTRO_BONUS; }   /* the bonus is paid once per shop, however many times the intro is run again */
    sfx('levelup'); toast(pay ? '🎓 Intro complete. ' + money(INTRO_BONUS) + ' bonus paid into the bank. The shop is yours now.' : '🎓 Intro complete. The bonus was already paid for this shop.', 'rare');
    logEvent('🎓 Finished the guided intro' + (pay ? ': ' + money(INTRO_BONUS) + ' bonus' : ' again'), 'rare'); introDraw(); hud(); save();
  }
  var introT = 0;
  function updateIntro(dt) {
    if (!introRunning()) return;
    var I = intro(), step = INTRO_STEPS[I.i]; if (!step) { introFinish(); return; }
    introT -= dt; if (introT > 0) return; introT = 0.4;   /* the checks read the save, so twice a second is plenty */
    var ok = false; try { ok = !!step.ok(); } catch (e) { ok = false; }
    if (!ok) { introDraw(); return; }
    I.i++; save();
    if (I.i >= INTRO_STEPS.length) { introFinish(); return; }
    sfx('ok'); toast('✅ ' + step.t, 'good'); introDraw();
  }
  var introEl = null;
  function introDraw() {
    var I = intro(), on = introRunning();
    if (!introEl) { if (!on) return; introEl = document.createElement('div'); introEl.id = 'rf-intro'; document.body.appendChild(introEl); }
    if (!on) { introEl.hidden = true; return; }
    var step = INTRO_STEPS[I.i]; if (!step) { introEl.hidden = true; return; }
    introEl.hidden = false;
    var dots = INTRO_STEPS.map(function (_, k) { return '<i class="' + (k < I.i ? 'on' : k === I.i ? 'now' : '') + '"></i>'; }).join('');
    introEl.innerHTML = '<div class="rf-intro-head">Getting started <span>' + (I.i + 1) + ' of ' + INTRO_STEPS.length + '</span></div>' +
      '<div class="rf-intro-dots">' + dots + '</div>' +
      '<h3>' + step.t + '</h3><p>' + step.d + '</p>' +
      '<div class="rf-intro-foot">Finish every step for a ' + money(INTRO_BONUS) + ' bonus · skip it in the pause menu</div>';
  }
  function introMenuHtml() {
    var I = intro();
    if (I.done) return '<p>You finished the guided intro and collected the ' + money(INTRO_BONUS) + ' bonus.</p><div class="g3-chips"><button class="g3-btn" data-act="introRestart">Run it again (no second bonus)</button></div>';
    if (I.skipped) return '<p>The intro is switched off. The <b>How to play</b> guide has everything it would have shown you.</p><div class="g3-chips"><button class="g3-btn" data-act="introRestart">Turn it back on</button></div>';
    return '<p>Step <b>' + (I.i + 1) + ' of ' + INTRO_STEPS.length + '</b>: ' + INTRO_STEPS[I.i].t + '</p><p class="desc">Finish every step and ' + money(INTRO_BONUS) + ' goes into the bank. Skipping costs you the bonus; the guide stays available either way.</p><div class="g3-chips"><button class="g3-btn danger" data-act="introSkip">Skip the intro</button></div>';
  }
