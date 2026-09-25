//@ boot, the frame loop and the console handle
  // ── Boot ──────────────────────────────────────────────────────────
  // A failure anywhere from reading the save to the last build call reloads the page once in recovery: load() then
  // opens a fresh shop in memory and leaves the save slot alone. A second failure only reports itself.
  function bootFailed(e) {
    console.error('Grow Co.: the shop could not open', e);
    saveBlocked = true;   /* whatever state got this far is never written over the slot */
    var raw = null, tag, again = false; try { raw = localStorage.getItem(SAVE); } catch (e2) {} tag = recoverTag(raw);
    try { again = sessionStorage.getItem(RECOVER_KEY) === tag; } catch (e3) {}
    if (!again) { keepBrokenSave(raw); try { sessionStorage.setItem(RECOVER_KEY, tag); if (sessionStorage.getItem(RECOVER_KEY) === tag) { location.reload(); return; } } catch (e4) {} }   /* never reload unless the flag stuck, or it would loop */
    bootIssue = 'The shop could not open properly. Your save is untouched and nothing will be written over it. Please send a bug report with F7.';
  }
  try {
  loadSettings(); load();
  var elapsed = clamp((now() - (S.lastTick || now())) / 1000, 0, 6 * 3600);
  if (elapsed > 2) step(elapsed, true);
  S.lastTick = now();
  shop(); dustList(); var offlineDust = Math.min(4, Math.floor((now() - (S.lastDust || now())) / 300000)); if (offlineDust > 0) { spawnDust(offlineDust); S.lastDust = now(); }
  buildStatic(); buildProps(); buildDecor(); fixtureFromBuild('deskBoard', 'desk screen', 0, buildDeskBoard); buildShopControls(); buildBroom(); buildUpstairs(); buildVipWing(); buildBasement(); registerUnits(); buildAllProps(); buildSwitches(); buildStreet(); buildCity(); buildExpansion(); buildNpc(); buildGuard(); buildWorker(); syncKeyHook(); applyFixtures(); introDraw(); applyShopState(); syncDust(); applySettings(); resize(); updateDayNight();
  } catch (bootErr) { bootFailed(bootErr); }
  runHooks(hooks.boot);
  defightScene(); defightScene();   /* twice: a first nudge can land a face on another */
  // Blender models come out of IndexedDB after boot, so whatever is in hand is rebuilt once they land
  if (WS) { WS.onModelsReady(function () { if (WS.hasModels()) { heldKey = '\u0000'; world.dirty = true; } }); WS.loadModels(); }
  camera.position.copy(player.pos); camera.rotation.set(0, player.yaw, 0);

  // start screen
  (function startScreen() {
    $('g3-start-stats').innerHTML = chip('cash', money(S.bank)) + chip('level', S.level) + chip('plants', S.plants.length + '/' + slots()) + chip('stash', gram(S.cured.g)) + chip('rep', Math.floor(S.rep));
//#if desk
    $('g3-start-note').textContent = elapsed > 60 ? 'While you were away (' + Math.round(elapsed / 60) + ' min) the plants kept growing.' : 'Progress is shared with the desk tab.';
//#else
    $('g3-start-note').textContent = elapsed > 60 ? 'While you were away (' + Math.round(elapsed / 60) + ' min) the plants kept growing.' : 'Your shop is waiting.';
//#endif
    $('g3-start-btn').addEventListener('click', function () {
      $('g3-start').classList.remove('show'); $('g3-start').hidden = true; $('g3-hud').hidden = false; ui.started = true; lockPointer(); hud(); sfx('rare');
      logEvent('🏠 Walked into the shop', '');
      if (held() && held().kind === 'harvest') toast('You\'re still holding a harvest. Hang it up.', '');
    });
  })();
  if (bootIssue) { var bootNote = $('g3-start-note'); if (bootNote) bootNote.textContent = bootIssue; var bootBtn = $('g3-start-btn'); if (bootBtn) bootBtn.addEventListener('click', function () { toast('⚠ ' + bootIssue, 'bad'); try { logEvent('⚠ ' + bootIssue, 'bad'); } catch (e) {} }); }   /* the recovery says so on the start screen and again once you walk in */

  // sim tick (1s), independent of frame rate; named so the tests can run it on their own clock
  function simTick() {
    if (!ui.started || ui.menuOpen) { S.lastTick = now(); return; }   /* paused means paused */
    var before = JSON.stringify([S.plants.map(function (p) { return p.hazard; }), S.batches.map(function (b) { return b.cured; }), !!S.customer]);
    step(1, false); maybeEvent(); maybeCustomer(); S.lastTick = now(); S.steps3d++; save();
    var after = JSON.stringify([S.plants.map(function (p) { return p.hazard; }), S.batches.map(function (b) { return b.cured; }), !!S.customer]);
    if (before !== after) { syncShelf(); syncRack(); }
    updateDust(); hud(); if (new Date().getSeconds() === 0) drawCtlScreen(); if (ui.panelOpen && (ui.panelKind === 'register' || ui.panelKind === 'bench')) ui.render();
    if (focus) setFocus(focus);
  }
  setInterval(simTick, 1000);

  // ── De-fight ──
  // Two faces that share a plane, overlap and face the same way flicker (z-fighting): a ceiling under a slab, a
  // frame set into a wall, a panel on a machine. Rather than chase each one, this pass runs over every axis-aligned
  // box and plane after the world is built, finds those pairs and pushes the smaller face 5 mm out along its normal.
  function defightScene() {
    scene.updateMatrixWorld(true);
    var faces = [];
    function axisOf(v) { var a = [Math.abs(v.x), Math.abs(v.y), Math.abs(v.z)], m = Math.max(a[0], a[1], a[2]); return m < 0.999 ? -1 : a.indexOf(m); }
    scene.traverse(function (o) {
      if (!o.isMesh || o.isInstancedMesh || !o.geometry || !o.material) return;
      var g = o.geometry, t = g.type; if (t !== 'BoxGeometry' && t !== 'PlaneGeometry') return;
      var mat = Array.isArray(o.material) ? o.material[0] : o.material; if (mat.visible === false || o.userData.noDefight) return;
      for (var an = o; an; an = an.parent) if (an.visible === false) return;
      o.matrixWorld.decompose(_df.p, _df.q, _df.s);
      var bx = _df.a.set(1, 0, 0).applyQuaternion(_df.q).clone(), by = _df.a.set(0, 1, 0).applyQuaternion(_df.q).clone(), bz = _df.a.set(0, 0, 1).applyQuaternion(_df.q).clone();
      var axes = [axisOf(bx), axisOf(by), axisOf(bz)]; if (axes[0] < 0 || axes[1] < 0 || axes[2] < 0) return;
      var pr = g.parameters, half = t === 'BoxGeometry' ? [pr.width / 2 * _df.s.x, pr.height / 2 * _df.s.y, pr.depth / 2 * _df.s.z] : [pr.width / 2 * _df.s.x, pr.height / 2 * _df.s.y, 0];
      var ext = [[_df.p.x, _df.p.x], [_df.p.y, _df.p.y], [_df.p.z, _df.p.z]]; for (var i = 0; i < 3; i++) { var w = axes[i]; ext[w][0] -= half[i]; ext[w][1] += half[i]; }
      var rec = { o: o, plane: t === 'PlaneGeometry', thick: [ext[0][1] - ext[0][0], ext[1][1] - ext[1][0], ext[2][1] - ext[2][0]], movedAxis: [false, false, false], grounded: ext[1][0] <= 0.001 };
      function face(w, coord, sign) { if (w === 1 && sign < 0 && coord <= 0.0005) return; /* undersides at ground level are never seen */ var lo = [], hi = []; for (var k = 0; k < 3; k++) if (k !== w) { lo.push(ext[k][0]); hi.push(ext[k][1]); } faces.push({ m: rec, axis: w, coord: coord, sign: sign, lo: lo, hi: hi, area: (hi[0] - lo[0]) * (hi[1] - lo[1]) }); }
      if (t === 'BoxGeometry') { for (var j = 0; j < 3; j++) { var wa = axes[j]; face(wa, ext[wa][1], 1); face(wa, ext[wa][0], -1); } }
      else { var wz = axes[2], sg = bz.getComponent(wz) > 0 ? 1 : -1; face(wz, _df.p.getComponent(wz), sg); if (mat.side === THREE.DoubleSide) face(wz, _df.p.getComponent(wz), -sg); }
    });
    var buckets = {}; faces.forEach(function (f) { var k = f.axis + ':' + Math.floor(f.coord * 250); (buckets[k] = buckets[k] || []).push(f); });   /* 4 mm cells; each cell is also checked against the next one up */
    var moved = 0;
    function nudge(o, axis, d) { _df.a.set(0, 0, 0).setComponent(axis, d); if (o.parent) { _df.a.applyQuaternion(o.parent.getWorldQuaternion(_df.q).invert()); o.parent.getWorldScale(_df.s); _df.a.x /= _df.s.x || 1; _df.a.y /= _df.s.y || 1; _df.a.z /= _df.s.z || 1; } o.position.add(_df.a); }
    Object.keys(buckets).forEach(function (k) {
      var parts = k.split(':'), arr = buckets[k].concat(buckets[parts[0] + ':' + (+parts[1] + 1)] || []), own = buckets[k].length;
      for (var i = 0; i < own; i++) for (var j = i + 1; j < arr.length; j++) {
        var a = arr[i], b = arr[j]; if (a.m === b.m || a.sign !== b.sign || Math.abs(a.coord - b.coord) > 0.002) continue;
        var ox = Math.min(a.hi[0], b.hi[0]) - Math.max(a.lo[0], b.lo[0]), oy = Math.min(a.hi[1], b.hi[1]) - Math.max(a.lo[1], b.lo[1]); if (ox < 0.01 || oy < 0.01) continue;
        var ta = a.m.thick[a.axis], tb = b.m.thick[b.axis];   /* move the thinner one along the normal: a trim, a frame, a panel or a plane, never the wall it sits on */
        var v = Math.abs(ta - tb) > 0.001 ? (ta < tb ? a : b) : (a.area <= b.area ? a : b), u = v === a ? b : a;
        function bad(f) { return f.m.movedAxis[f.axis] || f.m.thick[f.axis] > 1.0 || (f.axis === 1 && f.sign > 0 && f.m.grounded && f.m.thick[1] > 0.2); }   /* never move anything big, and never lift a wall or a machine off the floor */
        if (bad(v)) { if (bad(u)) continue; v = u; }
        nudge(v.m.o, v.axis, 0.005 * v.sign); v.m.movedAxis[v.axis] = true; v.coord += 0.005 * v.sign; moved++;
      }
    });
    return moved;
  }
  function defightSoon() { _df.t = now(); }   /* debounced: props are rebuilt one after another, the pass runs once after the last */
  // ── Light budget ──
  // Three.js lights every pixel with every point light in the scene, whether or not the light can reach it, so
  // forty-odd lamps mean forty-odd light evaluations per pixel. Only the nearest few stay visible; the rest are
  // hidden. The visible count is held constant so the shaders are not recompiled (see the roomLamps note).
  function updateLightBudget() {
    var t = now();
    if (!lightBudget.lights || t - lightBudget.scanT > 2000) { var list = []; scene.traverse(function (o) { if (o.isPointLight) list.push(o); }); lightBudget.lights = list; lightBudget.scanT = t; }
    if (t - lightBudget.tickT < 100) return; lightBudget.tickT = t;
    camera.getWorldPosition(lightBudget.cam);
    var cand = [];
    lightBudget.lights.forEach(function (l) {
      for (var p = l.parent; p; p = p.parent) if (p.visible === false) return;   /* inside a hidden group: not counted by the renderer either way, leave it alone */
      l.getWorldPosition(lightBudget.tmp); var d = lightBudget.tmp.distanceTo(lightBudget.cam);
      l.userData.budgetScore = (l.intensity > 0 ? 0 : 1e6) + Math.max(0, d - (l.distance || 40) * 0.25); cand.push(l);
    });
    cand.sort(function (a, b) { return a.userData.budgetScore - b.userData.budgetScore; });
    for (var i = 0; i < cand.length; i++) cand[i].visible = i < lightBudget.point;
  }
  var shadowT = 0;
  function updateShadowTimer() { var t = now(); if (renderer.shadowMap.enabled && t - shadowT > 250) { renderer.shadowMap.needsUpdate = true; shadowT = t; } }

  // render loop
  var fpsAcc = 0, fpsN = 0, fpsT = 0;
  function frame() {
    requestAnimationFrame(frame);
    var dt = Math.min(clock.getDelta(), 0.1);
    if (now() - deskBoard.lastFetch > 30000) fetchDesk(); updateDeskBoard();
    updateCurtains(dt); updateStaffDoor(dt); radio.update(); syncBroom(); updateTv(dt); editUpdate(); runHooks(hooks.frame, dt);
    if (!ui.menuOpen) { updatePlayer(dt); syncHands(dt); updateSmoke(dt); updateScope(dt); updateTrigger(); updatePlantVisuals(dt); updateNpc(dt); updateLineup(dt); updateRopeGates(dt); updateLoungers(dt); updateRobbers(dt); updatePolice(dt); updateTobacco(powerOn() ? dt : 0); updateExpansion(dt); updateDoors(dt); updateShutters(dt); updateIntro(dt); updateCity(dt); updateMachines(dt); updateVip(dt); updateFight(dt); updateTruck(dt); updateCourier(dt); updatePeds(dt); updateVanShop(dt); updateProps(dt); updateDehums(dt); updateBursts(dt); updateFocus(); deskTouchUpdate(); touchUpdate(); }
    updateDayNight(); updateLightBudget(); updateShadowTimer(); updateSecurity(dt);
    if (_df.t && now() - _df.t > 250) { _df.t = 0; defightScene(); }
    if (sec.view.on) { var vc = sec.cams[sec.view.idx]; vc.aspect = camera.aspect; vc.updateProjectionMatrix(); $('g3-cam-time').textContent = clockText(); var vcTown = (vc.layers.mask & (1 << TOWN_LAYER)) !== 0; vc.layers.enable(TOWN_LAYER); renderer.render(scene, vc); if (!vcTown) vc.layers.disable(TOWN_LAYER); } else renderer.render(scene, camera);
    if (SET.fps) { fpsAcc += dt; fpsN++; fpsT += dt; if (fpsT > 0.5) { $('h-fps').textContent = Math.round(fpsN / fpsAcc) + ' fps'; fpsAcc = 0; fpsN = 0; fpsT = 0; } }
  }
  frame();
  // debug / automation handle (read-only use; not part of the game loop)
//#if desk
  window.RFGROW = { seatEvent: seatEvent, seatLog: function () { return deskBoard.seatLog; }, lineup: function () { return lineup; }, customerArrives: customerArrives, hooks: hooks, deskBoard: deskBoard, deskTap: deskTap, TOUCH: TOUCH, touchTap: touchTap, secScreen: secScreen, pc: pc, pcOpen: pcOpen, pcClose: pcClose, pcApp: pcApp, dev: dev, deviceOpen: deviceOpen, deviceClose: deviceClose, wheelOpen: wheelOpen, wheelPick: wheelPick, wheelClose: wheelClose, officeSeat: officeSeat, cityPeds: function () { return cityPeds; }, internal: { MAT: MAT, TEX: TEX, colorMat: colorMat, fabricMat: fabricMat, glowMat: glowMat, textTex: textTex, makeTex: makeTex, world: world, scene: scene, ROOM: ROOM, UP: UP, WALL_T: WALL_T, groundY: groundY, save: save, toast: toast, sfx: sfx, lockPointer: lockPointer, interactable: interactable, propCtx: propCtx, rotAABB: rotAABB, setFocus: setFocus, ray: ray, center: center, edit: edit, editToggle: editToggle, sit: sit, builders: { chair: chair, sofaBuild: sofaBuild, coffeeTableBuild: coffeeTableBuild, bookshelfBuild: bookshelfBuild, crateBuild: crateBuild, lobbyBench: lobbyBench, officeChairBuild: officeChairBuild, makePot: makePot, legs4: legs4, drawer: drawer }, esc: esc, clamp: clamp, lerp: lerp, randf: randf, randi: randi, pick: pick, $: $, hud: hud, afterAction: afterAction, openMenu: openMenu, closeMenu: closeMenu, STRAINS: STRAINS, take: take, held: held, selectSlot: selectSlot, hotbarFull: hotbarFull, devAction: devAction, toggleRoomLight: toggleRoomLight, roomOf: roomOf, syncDisplay: syncDisplay, shop: shop, npc: typeof npc !== 'undefined' ? npc : null, sec: sec, camEnter: camEnter, camExit: camExit, camShow: camShow, updateSecurity: updateSecurity, tentSize: tentSize, slotPos: slotPos, sit: sit, renderer: renderer, camera: camera, updateNpc: updateNpc, spawnCustomer: spawnCustomer, updateCourier: updateCourier, courierHandOver: courierHandOver, courierState: function () { return courier; }, worker: worker, updateWorker: updateWorker, workerTask: workerTask, guardTask: guardTask, guard: guard, updateGuard: updateGuard, routeTo: routeTo, hireWorker: hireWorker, stockStore: stockStore, stockCount: stockCount, moveWithCollision: moveWithCollision, setDoor: setDoor, doorAt: doorAt, navBuild: navBuild }, get S() { return S; }, player: player, ui: ui, actions: actions, world: world, camera: camera, hud: hud, after: afterAction, openPanel: function (k, t) { ui.openPanel(k, t); }, ctxPlant: ctxPlant, ctxShelf: ctxShelf, openMenu: openMenu, edit: edit, editToggle: editToggle, editGrab: editGrab, editDrop: editDrop, editRotate: editRotate, editReset: editReset, props: propInst, PROPS: PROPS, npcState: function () { return npc.state; }, loungers: loungers, devAction: devAction, selectSlot: selectSlot, roomOf: roomOf, toggleRoomLight: toggleRoomLight, robber: robber, startRobbery: startRobbery, heistState: function () { return { heist: heist, robbers: robbers }; }, fireWeapon: fireWeapon, lockerMenu: lockerMenu, complyHeist: complyHeist, confrontRobber: confrontRobber, panicButton: panicButton, heistHint: heistHint, xs: xs, exp: exp, enterZone: enterZone, leaveZone: leaveZone, expInteract: expInteract, expPrompt: expPrompt, carMenu: carMenu, labMenu: labMenu, rosterMenu: rosterMenu, expPoiMenu: expPoiMenu, startGetaway: startGetaway, expansionNewDay: expansionNewDay, FIXTURES: FIXTURES, DOORS: DOORS, toggleDoor: toggleDoor, startVip: startVip, vipObj: vip, serveVip: serveVip, enterCar: enterCar, exitCar: exitCar, drive: drive, ignition: ignition, parkBrake: parkBrake, carLightStep: carLightStep, carPartToggle: carPartToggle, carInBay: carInBay, carAnyOpen: carAnyOpen, drawDash: drawDash, jobSpawn: jobSpawn, jobsPanel: jobsPanel, jobHandOver: jobHandOver, jobAtCar: jobAtCar, tabletTake: tabletTake, tabletHere: tabletHere, driverRuns: driverRuns, addrFor: addrFor, CITY: CITY, toggleCityMap: toggleCityMap, cityPoiMenu: cityPoiMenu, parkDeal: parkDeal, cityInteract: cityInteract, goBasement: goBasement, leaveBasement: leaveBasement, tobInteract: tobInteract, tobPrompt: tobPrompt, handOverFn: handOver, stepFrame: function () { frame(); }, swingBat: swingBat, hitNpc: hitNpc, startFight: startFight, endFight: endFight, fightState: function () { return fight; }, task: task, taskStart: taskStart, taskPress: taskPress, taskFinish: taskFinish, buildProp: buildProp, propPlacement: propPlacement, hiddenProps: hiddenProps, PROP_ORDER: PROP_ORDER, unitIds: unitIds, unitCount: unitCount, machCost: machCost, buyUnit: buyUnit, machState: machState, syncMachines: syncMachines, truck: truck, courier: courier, callCourier: callCourier, updateLogistics: updateLogistics, payActions: payActions, dehums: dehums, dehumSet: dehumSet, smoke: smoke, sparkUp: sparkUp, shop: shop, spawnDust: spawnDust, curtains: curtains, radio: radio, dust: dustList, tv: tv, sit: sit, groundY: groundY, standUp: standUp, take: take, putBack: putBack, handOver: handOver, sellHeld: sellHeld, held: held, reset: function () { S = fresh(); try { localStorage.setItem(SAVE, JSON.stringify(S)); } catch (e) {} world.dirty = true; buildAllProps(); rebuildDynamic(); syncDust(); hud(); } };
//#else
  window.RFGROW = { lineup: function () { return lineup; }, customerArrives: customerArrives, hooks: hooks, deskBoard: deskBoard, deskTap: deskTap, TOUCH: TOUCH, touchTap: touchTap, secScreen: secScreen, pc: pc, pcOpen: pcOpen, pcClose: pcClose, pcApp: pcApp, dev: dev, deviceOpen: deviceOpen, deviceClose: deviceClose, wheelOpen: wheelOpen, wheelPick: wheelPick, wheelClose: wheelClose, officeSeat: officeSeat, cityPeds: function () { return cityPeds; }, internal: { MAT: MAT, TEX: TEX, colorMat: colorMat, fabricMat: fabricMat, glowMat: glowMat, textTex: textTex, makeTex: makeTex, world: world, scene: scene, ROOM: ROOM, UP: UP, WALL_T: WALL_T, groundY: groundY, save: save, toast: toast, sfx: sfx, lockPointer: lockPointer, interactable: interactable, propCtx: propCtx, rotAABB: rotAABB, setFocus: setFocus, ray: ray, center: center, edit: edit, editToggle: editToggle, sit: sit, builders: { chair: chair, sofaBuild: sofaBuild, coffeeTableBuild: coffeeTableBuild, bookshelfBuild: bookshelfBuild, crateBuild: crateBuild, lobbyBench: lobbyBench, officeChairBuild: officeChairBuild, makePot: makePot, legs4: legs4, drawer: drawer }, esc: esc, clamp: clamp, lerp: lerp, randf: randf, randi: randi, pick: pick, $: $, hud: hud, afterAction: afterAction, openMenu: openMenu, closeMenu: closeMenu, STRAINS: STRAINS, take: take, held: held, selectSlot: selectSlot, hotbarFull: hotbarFull, devAction: devAction, toggleRoomLight: toggleRoomLight, roomOf: roomOf, syncDisplay: syncDisplay, shop: shop, npc: typeof npc !== 'undefined' ? npc : null, sec: sec, camEnter: camEnter, camExit: camExit, camShow: camShow, updateSecurity: updateSecurity, tentSize: tentSize, slotPos: slotPos, sit: sit, renderer: renderer, camera: camera, updateNpc: updateNpc, spawnCustomer: spawnCustomer, updateCourier: updateCourier, courierHandOver: courierHandOver, courierState: function () { return courier; }, worker: worker, updateWorker: updateWorker, workerTask: workerTask, guardTask: guardTask, guard: guard, updateGuard: updateGuard, routeTo: routeTo, hireWorker: hireWorker, stockStore: stockStore, stockCount: stockCount, moveWithCollision: moveWithCollision, setDoor: setDoor, doorAt: doorAt, navBuild: navBuild }, get S() { return S; }, player: player, ui: ui, actions: actions, world: world, camera: camera, hud: hud, after: afterAction, openPanel: function (k, t) { ui.openPanel(k, t); }, ctxPlant: ctxPlant, ctxShelf: ctxShelf, openMenu: openMenu, edit: edit, editToggle: editToggle, editGrab: editGrab, editDrop: editDrop, editRotate: editRotate, editReset: editReset, props: propInst, PROPS: PROPS, npcState: function () { return npc.state; }, loungers: loungers, devAction: devAction, selectSlot: selectSlot, roomOf: roomOf, toggleRoomLight: toggleRoomLight, robber: robber, startRobbery: startRobbery, heistState: function () { return { heist: heist, robbers: robbers }; }, fireWeapon: fireWeapon, lockerMenu: lockerMenu, complyHeist: complyHeist, confrontRobber: confrontRobber, panicButton: panicButton, heistHint: heistHint, xs: xs, exp: exp, enterZone: enterZone, leaveZone: leaveZone, expInteract: expInteract, expPrompt: expPrompt, carMenu: carMenu, labMenu: labMenu, rosterMenu: rosterMenu, expPoiMenu: expPoiMenu, startGetaway: startGetaway, expansionNewDay: expansionNewDay, FIXTURES: FIXTURES, DOORS: DOORS, toggleDoor: toggleDoor, startVip: startVip, vipObj: vip, serveVip: serveVip, enterCar: enterCar, exitCar: exitCar, drive: drive, ignition: ignition, parkBrake: parkBrake, carLightStep: carLightStep, carPartToggle: carPartToggle, carInBay: carInBay, carAnyOpen: carAnyOpen, drawDash: drawDash, jobSpawn: jobSpawn, jobsPanel: jobsPanel, jobHandOver: jobHandOver, jobAtCar: jobAtCar, tabletTake: tabletTake, tabletHere: tabletHere, driverRuns: driverRuns, addrFor: addrFor, CITY: CITY, toggleCityMap: toggleCityMap, cityPoiMenu: cityPoiMenu, parkDeal: parkDeal, cityInteract: cityInteract, goBasement: goBasement, leaveBasement: leaveBasement, tobInteract: tobInteract, tobPrompt: tobPrompt, handOverFn: handOver, stepFrame: function () { frame(); }, swingBat: swingBat, hitNpc: hitNpc, startFight: startFight, endFight: endFight, fightState: function () { return fight; }, task: task, taskStart: taskStart, taskPress: taskPress, taskFinish: taskFinish, buildProp: buildProp, propPlacement: propPlacement, hiddenProps: hiddenProps, PROP_ORDER: PROP_ORDER, unitIds: unitIds, unitCount: unitCount, machCost: machCost, buyUnit: buyUnit, machState: machState, syncMachines: syncMachines, truck: truck, courier: courier, callCourier: callCourier, updateLogistics: updateLogistics, payActions: payActions, dehums: dehums, dehumSet: dehumSet, smoke: smoke, sparkUp: sparkUp, shop: shop, spawnDust: spawnDust, curtains: curtains, radio: radio, dust: dustList, tv: tv, sit: sit, groundY: groundY, standUp: standUp, take: take, putBack: putBack, handOver: handOver, sellHeld: sellHeld, held: held, reset: function () { S = fresh(); try { localStorage.setItem(SAVE, JSON.stringify(S)); } catch (e) {} world.dirty = true; buildAllProps(); rebuildDynamic(); syncDust(); hud(); } };
//#endif
  // the automated tests (tests/) and the balance report (tools/balance.js) reach in here; the game never reads it
  window.RFGROW.test = {
    simTick: simTick, simStep: step, spawnCustomer: spawnCustomer, newCustomer: newCustomer, finalizeSale: finalizeSale, handOver: handOver,
    lineCount: lineCount, lineShown: lineShown, exitPath: exitPath, ropeGates: function () { return ropeGates; }, ropeSegs: function () { return ropeSegList; },
    robbers: function () { return robbers; }, heist: function () { return heist; }, maskUp: maskUp, npc: npc, guard: guard, useHeld: useHeld, trigger: trigger, scope: scope,
    price: { bag: bagPrice, joint: jointPrice, cookie: cookiePrice, unit: unitPrice, repMult: repMult, footfall: footfall, bagGrams: bagGrams },
    bills: billLines, dailyFixed: dailyFixed, headcount: headcount,
    data: { STRAINS: STRAINS, SUPPLIES: SUPPLIES, ACC: ACC, LIGHTS: LIGHTS, TENTS: TENTS, UPGRADES: UPGRADES, LICENCES: LICENCES, ECON: ECON, COST: COST, WEAPONS: WEAPONS, ROB_KINDS: ROB_KINDS, CIG_SKUS: CIG_SKUS, TOB: TOB, XP_PER_LEVEL: XP_PER_LEVEL, CUSTOMERS: CUSTOMERS, CURE_CAP_BASE: CURE_CAP_BASE, DRY_MS_BASE: DRY_MS_BASE, WORKER_WAGE: WORKER_WAGE, WALKUP_RATE: WALKUP_RATE, WALKUP_CAP: WALKUP_CAP }
  };
})();
