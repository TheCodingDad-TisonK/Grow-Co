//@ boot on Co Engine: the boot steps, the frame's present and render, the sim tick, the console handle
  // ── Boot ──────────────────────────────────────────────────────────
  // A failure anywhere from reading the save to the last build call reloads the page once in recovery: load() then
  // opens a fresh shop in memory and leaves the save slot alone. A second failure only reports itself.
  function bootFailed(e) {
    console.error('Grow Co.: the shop could not open', e);
    wiped = true;   /* whatever state got this far is never written over the slot */
    var raw = null, tag, again = false; try { raw = localStorage.getItem(SAVE); } catch (e2) {} tag = recoverTag(raw);
    try { again = sessionStorage.getItem(RECOVER_KEY) === tag; } catch (e3) {}
    if (!again) { keepBrokenSave(raw); try { sessionStorage.setItem(RECOVER_KEY, tag); if (sessionStorage.getItem(RECOVER_KEY) === tag) { location.reload(); return; } } catch (e4) {} }   /* never reload unless the flag stuck, or it would loop */
    bootIssue = 'The shop could not open properly. Your save is untouched and nothing will be written over it. Please send a bug report with F7.';
  }
  // ── The boot steps for the engine (Co Engine 90-boot) ─────────────
  // The engine loads the slot through fresh and migrateGrow, then runs these in order. A failure anywhere from the first repair to the
  // last build call reloads the page once in recovery (bootFailed): the shop then opens fresh in memory and leaves the slot alone.
  GAME.freshState = fresh; GAME.migrate = migrateGrow;
  GAME.afterLoad = function (loaded) {
    if (!loaded) loadNormalise();   /* a fresh shop is normalised like a loaded one: the hotbar binding, the totals, the intro flags */
    if (!loaded) { var rawHad = null; try { rawHad = localStorage.getItem(SAVE); } catch (e) {} if (rawHad) { keepBrokenSave(rawHad); wiped = true; bootIssue = BOOT_FRESH_MSG; } }   /* a save that would not parse: this fresh shop is never written over it */
    try { dlcLoaded(); var elapsed = clamp((now() - (S.lastTick || now())) / 1000, 0, 6 * 3600); if (elapsed > 2) step(elapsed, true); S.lastTick = now(); GAME.elapsed = elapsed; } catch (e) { bootFailed(e); }
  };
  GAME.buildWorld = function () {
    try {
    shop(); dustList(); var offlineDust = Math.min(4, Math.floor((now() - (S.lastDust || now())) / 300000)); if (offlineDust > 0) { spawnDust(offlineDust); S.lastDust = now(); }
    buildStatic(); growBuildProps(); buildDecor(); fixtureFromBuild('deskBoard', 'desk screen', 0, buildDeskBoard); buildShopControls(); buildBroom(); buildUpstairs(); buildVipWing(); buildBasement(); registerUnits(); buildAllProps(); buildSwitches(); buildStreet(); buildCity(); buildExpansion(); buildNpc(); buildGuard(); buildWorker(); syncKeyHook(); applyFixtures(); applyDlcWorld(false); introDraw(); applyShopState(); syncDust(); growApplySettings(); resize(); updateDayNight();
    } catch (bootErr) { bootFailed(bootErr); }
  };
  GAME.afterBuild = function () {
    runHookList(hooks.boot);
    defightScene(); defightScene();   /* twice: a first nudge can land a face on another */
    // Blender models come out of IndexedDB after boot, so whatever is in hand is rebuilt once they land
    if (WS) { WS.onModelsReady(function () { if (WS.hasModels()) { heldKey = '\u0000'; world.dirty = true; } }); WS.loadModels(); }
    camera.position.copy(player.pos); camera.rotation.set(0, player.yaw, 0);
  };
  hook('boot', growApplySettings);   /* after the engine's own settings pass: the shop's light budget, pixel ratio and shadow type */
  // what the engine leaves to the shop: its own player, focus and input, build mode, photo mode, the light by the hour, the HUD, the prompt
  GAME.playerOverride = function () { return true; }; GAME.focusOff = function () { return true; }; GAME.menuCamera = function () {};
  GAME.weather = false; GAME.lighting = false; GAME.photo = false; GAME.editMode = false; GAME.bake = false; GAME.autoplay = false; GAME.hudFields = false; GAME.prompt = false;
  GAME.hud = hud; GAME.timeLabel = function () { return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); };
  GAME.handle = 'CO_GROW'; GAME.versionGlobal = 'RF_VERSION';
  GAME.buildProp = growBuildProp;   // the Co Engine editor rebuilds a moved prop through the shop's own builder
  GAME.editorEnter = function () {   // the Co Engine editor starts the shop from its viewport: past the splash and the main menu, straight through the start button
    var sp = $('rf-splash'); if (sp) sp.hidden = true; var mm = $('rf-mainmenu'); if (mm) mm.hidden = true; var b = $('g3-start-btn'); if (b) b.click();
  };
  GAME.saveLooksRight = function (s) { return typeof s.bank === 'number' || typeof s.cash === 'number'; };
  GAME.commands = {}; DEV.forEach(function (d) { GAME.commands[d[0]] = function () { devAction(d[0]); return d[1]; }; });
  GAME.devState = function () { return { level: S.level, xp: S.xp, rep: Math.round(S.rep), day: S.day, plants: S.plants.length, customer: !!S.customer, floor: player.floor, pos: [Math.round(player.pos.x * 10) / 10, Math.round(player.pos.z * 10) / 10] }; };

  CO.boot(GAME);

  // start screen
  (function startScreen() {
    $('g3-start-stats').innerHTML = chip('cash', money(S.bank)) + chip('level', S.level) + chip('plants', S.plants.length + '/' + slots()) + chip('stash', gram(S.cured.g)) + chip('rep', Math.floor(S.rep));
    $('g3-start-note').textContent = GAME.elapsed > 60 ? 'While you were away (' + Math.round(GAME.elapsed / 60) + ' min) the plants kept growing.' : 'Your shop is waiting.';
    $('g3-start-btn').addEventListener('click', function () {
      $('g3-start').classList.remove('show'); $('g3-start').hidden = true; $('g3-hud').hidden = false; ui.started = true; grabPointer(); hud(); sfx('rare');
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
    updateDust(); tillWatch(); hud(); if (new Date().getSeconds() === 0) drawCtlScreen(); if (ui.panelOpen && (ui.panelKind === 'register' || ui.panelKind === 'bench')) ui.render();
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
  var shadowT = 0;
  function updateShadowTimer() { var t = now(); if (renderer.shadowMap.enabled && t - shadowT > (drive.on && Math.abs(drive.v) > 0.5 ? 0 : 250)) { renderer.shadowMap.needsUpdate = true; shadowT = t; } }   /* at the wheel the map is redrawn every frame, or the car drives out from under its own shadow */

  // render loop
  // ── The frame ─────────────────────────────────────────────────────
  // the engine runs the loop (Co Engine 90-boot); the shop's per-frame work is its present, and it draws the frame itself so the
  // security camera view works as before. The tests step a frame at a time (stepFrame on the handle).
  GAME.present = function (dt) {
    if (now() - deskBoard.lastFetch > 30000) fetchDesk(); updateDeskBoard();
    updateCurtains(dt); updateStaffDoor(dt); radio.update(); syncBroom(); updateTv(dt); editUpdate(); runHookList(hooks.frame, dt);
    if (!ui.menuOpen) { growUpdatePlayer(dt); syncHands(dt); updateSmoke(dt); updateScope(dt); updateTrigger(); updatePlantVisuals(dt); updateNpc(dt); updateLineup(dt); updateRopeGates(dt); updateLoungers(dt); updateRobbers(dt); updatePolice(dt); updateTobacco(powerOn() ? dt : 0); updateExpansion(dt); updateDoors(dt); updateShutters(dt); updateIntro(dt); updateCity(dt); updateMachines(dt); updateVip(dt); updateFight(dt); updateTruck(dt); updateCourier(dt); updatePeds(dt); updateVanShop(dt); updateProps(dt); updateDehums(dt); updateSparks(dt); growUpdateFocus(); deskTouchUpdate(); touchUpdate(); }
    updateDayNight(); bakeTick(); updateShadowTimer(); updateSecurity(dt); updatePcZoom(dt); updateMenuDrive(dt); updatePhoto(dt);
    if (_df.t && now() - _df.t > 250) { _df.t = 0; defightScene(); }
  };
  GAME.render = function () { if (sec.view.on) { var vc = sec.cams[sec.view.idx]; vc.aspect = camera.aspect; vc.updateProjectionMatrix(); $('g3-cam-time').textContent = clockText(); var vcTown = (vc.layers.mask & (1 << TOWN_LAYER)) !== 0; vc.layers.enable(TOWN_LAYER); renderer.render(scene, vc); if (!vcTown) vc.layers.disable(TOWN_LAYER); } else renderer.render(scene, camera); return true; };
  // debug / automation handle (read-only use; not part of the game loop)
  window.RFGROW = { engine: CO.version, lineup: function () { return lineup; }, customerArrives: customerArrives, hooks: hooks, deskBoard: deskBoard, deskTap: deskTap, TOUCH: TOUCH, touchTap: touchTap, secScreen: secScreen, pc: pc, pcOpen: pcOpen, pcClose: pcClose, pcApp: pcApp, dev: dev, deviceOpen: deviceOpen, deviceClose: deviceClose, wheelOpen: wheelOpen, wheelPick: wheelPick, wheelClose: wheelClose, officeSeat: officeSeat, cityPeds: function () { return cityPeds; }, internal: { BAKE: BAKE, bakeTick: bakeTick, MAT: MAT, TEX: TEX, colorMat: colorMat, fabricMat: fabricMat, glowMat: emitMat, textTex: signTex, makeTex: makeTex, world: world, scene: scene, ROOM: ROOM, UP: UP, WALL_T: WALL_T, groundY: groundY, save: save, toast: toast, sfx: sfx, lockPointer: grabPointer, interactable: interactable, propCtx: growPropCtx, rotAABB: growRotAABB, setFocus: setFocus, ray: ray, center: center, edit: edit, editToggle: growEditToggle, editHelper: growEditHelper, editRotate: growEditRotate, sit: sit, builders: { chair: chair, sofaBuild: sofaBuild, coffeeTableBuild: coffeeTableBuild, bookshelfBuild: bookshelfBuild, crateBuild: crateBuild, lobbyBench: lobbyBench, officeChairBuild: officeChairBuild, makePot: makePot, legs4: legs4, drawer: drawer }, esc: esc, clamp: clamp, lerp: lerp, randf: randf, randi: randi, pick: pick, $: $, hud: hud, afterAction: afterAction, openMenu: pauseOpen, closeMenu: pauseClose, STRAINS: STRAINS, take: take, held: held, selectSlot: selectSlot, hotbarFull: hotbarFull, devAction: devAction, toggleRoomLight: toggleRoomLight, roomOf: roomOf, syncDisplay: syncDisplay, shop: shop, npc: typeof npc !== 'undefined' ? npc : null, sec: sec, camEnter: camEnter, camExit: camExit, camShow: camShow, updateSecurity: updateSecurity, tentSize: tentSize, slotPos: slotPos, sit: sit, renderer: renderer, camera: camera, updateNpc: updateNpc, spawnCustomer: spawnCustomer, updateCourier: updateCourier, courierHandOver: courierHandOver, courierState: function () { return courier; }, worker: worker, updateWorker: updateWorker, workerTask: workerTask, guardTask: guardTask, guard: guard, updateGuard: updateGuard, routeTo: routeTo, hireWorker: hireWorker, stockStore: stockStore, stockCount: stockCount, moveWithCollision: moveWithCollision, setDoor: setDoor, doorAt: doorAt, navBuild: gridBuild }, get S() { return S; }, player: player, ui: ui, actions: actions, world: world, camera: camera, hud: hud, after: afterAction, openPanel: function (k, t) { ui.openPanel(k, t); }, ctxPlant: ctxPlant, ctxShelf: ctxShelf, openMenu: pauseOpen, edit: edit, editToggle: growEditToggle, editHelper: growEditHelper, editRotate: growEditRotate, editGrab: growEditGrab, editDrop: growEditDrop, editRotate: growEditRotate, editReset: growEditReset, props: propInst, PROPS: PROPS, npcState: function () { return npc.state; }, loungers: loungers, devAction: devAction, selectSlot: selectSlot, roomOf: roomOf, toggleRoomLight: toggleRoomLight, robber: robber, startRobbery: startRobbery, heistState: function () { return { heist: heist, robbers: robbers }; }, fireWeapon: fireWeapon, lockerMenu: lockerMenu, complyHeist: complyHeist, confrontRobber: confrontRobber, panicButton: panicButton, heistHint: heistHint, xs: xs, exp: exp, enterZone: enterZone, leaveZone: leaveZone, expInteract: expInteract, expPrompt: expPrompt, carMenu: carMenu, labMenu: labMenu, rosterMenu: rosterMenu, expPoiMenu: expPoiMenu, startGetaway: startGetaway, expansionNewDay: expansionNewDay, FIXTURES: FIXTURES, DOORS: DOORS, toggleDoor: toggleDoor, startVip: startVip, vipObj: vip, serveVip: serveVip, enterCar: enterCar, exitCar: exitCar, drive: drive, ignition: ignition, parkBrake: parkBrake, carLightStep: carLightStep, carPartToggle: carPartToggle, carInBay: carInBay, carAnyOpen: carAnyOpen, drawDash: drawDash, jobSpawn: jobSpawn, jobsPanel: jobsPanel, jobHandOver: jobHandOver, jobAtCar: jobAtCar, tabletTake: tabletTake, tabletHere: tabletHere, driverRuns: driverRuns, addrFor: addrFor, CITY: CITY, toggleCityMap: toggleCityMap, cityPoiMenu: cityPoiMenu, parkDeal: parkDeal, cityInteract: cityInteract, goBasement: goBasement, leaveBasement: leaveBasement, tobInteract: tobInteract, tobPrompt: tobPrompt, handOverFn: handOver, stepFrame: function () { frame(lastFrame + 50); }, swingBat: swingBat, hitNpc: hitNpc, startFight: startFight, endFight: endFight, fightState: function () { return fight; }, task: task, taskStart: taskStart, taskPress: taskPress, taskFinish: taskFinish, buildProp: growBuildProp, propPlacement: growPropPlacement, hiddenProps: hiddenProps, PROP_ORDER: PROP_ORDER, unitIds: unitIds, unitCount: unitCount, machCost: machCost, buyUnit: buyUnit, machState: machState, syncMachines: syncMachines, truck: truck, courier: courier, callCourier: callCourier, updateLogistics: updateLogistics, payActions: payActions, dehums: dehums, dehumSet: dehumSet, smoke: smoke, sparkUp: sparkUp, shop: shop, spawnDust: spawnDust, curtains: curtains, radio: radio, dust: dustList, tv: tv, sit: sit, groundY: groundY, standUp: standUp, take: take, putBack: putBack, handOver: handOver, sellHeld: sellHeld, held: held, reset: function () { S = fresh(); try { localStorage.setItem(SAVE, JSON.stringify(S)); } catch (e) {} world.dirty = true; buildAllProps(); rebuildDynamic(); syncDust(); hud(); } };
  // the automated tests (tests/) and the balance report (tools/balance.js) reach in here; the game never reads it
  window.RFGROW.test = {
    simTick: simTick, settings: SET, simStep: step, spawnCustomer: spawnCustomer, newCustomer: newCustomer, finalizeSale: finalizeSale, handOver: handOver,
    resetShop: resetShop, setPageReload: function (fn) { pageReload = fn; }, devStrains: devStrains, dlcOn: dlcOn, propGone: propGone, inGoneProp: inGoneProp, fixtures: function () { return fxById; }, applyFixtures: applyFixtures,
    sun: sun, traffic: function () { return traffic; }, truck: function () { return truck; }, shutterOpen: shutterOpen, anyCigStock: anyCigStock, syncGoods: syncGoods, applyDlcWorld: applyDlcWorld, staffDoorLocked: staffDoorLocked, keyStaffDoor: keyStaffDoor, toggleStaffDoor: toggleStaffDoor, navKey: navKey, ghParts: function () { return exp.ghParts; }, openMenu: pauseOpen, closeMenu: pauseClose, npcState: function () { return npc.state; },
    lineCount: lineCount, lineShown: lineShown, exitPath: exitPath, ropeGates: function () { return ropeGates; }, ropeSegs: function () { return ropeSegList; },
    robbers: function () { return robbers; }, heist: function () { return heist; }, maskUp: maskUp, guardOdds: guardOdds, dlcUpg: { list: DLC_UPG, has: dlcHas, owns: dlcOwns, buy: dlcUpgBuy, give: dlcUpgGive, pane: paneDlcUpg }, cigar: { state: cigarState, start: cigarStart, take: cigarTake, aged: cigarAged, count: cigarCount, CIGAR: CIGAR }, lab: { state: labState, start: labStart, menu: labMenu, tick: labTick, shelve: labShelve, techPick: labTechPick, price: cigPrice, grade: labGrade, stockAdd: cigStockAdd, cigQ: cigQ, JOBS: LAB_JOBS, TECH: LAB_TECH }, roofx: { state: roofxState, watered: roofWatered, grams: roofGrams, sync: roofExtrasSync, parts: roofx }, menuDrive: menuDrive, photo: { on: photoOn, off: photoOff, state: photo, update: updatePhoto }, updateMenuDrive: updateMenuDrive, TOB: TOB, tob: tob, tobSpare: tobSpare, devOpen: devOpen, devClose: devClose,
    dlc: { state: dlcState, step: dlcStep, newDay: dlcNewDay, footfall: dlcFootfall, breed: breedState, breedStart: breedStart, breedFinish: breedFinish, BREED: BREED, hydro: hydroState, hydroOk: hydroOk, HYDRO: HYDRO, cup: cupState, cupEnter: cupEnter, cupJudge: cupJudge, cupNext: cupNext, merch: merchState, merchSell: merchSell, merchOrder: merchOrder, merchLevel: merchLevel, farm: farmState, farmSow: farmSow, farmHarvest: farmHarvest, FARM: FARM, fin: finState, finBorrow: finBorrow, finMove: finMove, FIN: FIN, interact: dlcInteract, prompt: dlcPrompt }, npc: npc, guard: guard, useHeld: useHeld, trigger: trigger, scope: scope,
    price: { bag: bagPrice, joint: jointPrice, cookie: cookiePrice, unit: unitPrice, repMult: repMult, footfall: footfall, bagGrams: bagGrams },
    bills: billLines, dailyFixed: dailyFixed, headcount: headcount, taxDue: taxDue, bizTax: bizTax, tillWatch: tillWatch, tillHeavy: tillHeavy, toggleShopOpen: toggleShopOpen, breakWait: breakWait, lineup: function () { return lineup; },
    press: function (data, shift) { player.keys.ShiftLeft = !!shift; setFocus({ mesh: null, data: data, dist: 1 }); interact(); player.keys.ShiftLeft = false; setFocus(null); },   /* E (or Shift+E) on a thing, as if the crosshair were on it */
    prompt: promptFor, coinBox: coinBox, coinTotal: coinTotal, machStock: machStock, stockTotal: stockTotal, planFor: planFor, crew: function () { return crew; }, crewList: crewList, crewShift: crewShift, hireWorker: hireWorker, workerTask: workerTask, rackBays: rackBays, rackBayCode: rackBayCode, loungers: function () { return loungers; }, cashOnSite: cashOnSite,
    data: { STRAINS: STRAINS, SUPPLIES: SUPPLIES, ACC: ACC, LIGHTS: LIGHTS, TENTS: TENTS, UPGRADES: UPGRADES, LICENCES: LICENCES, ECON: ECON, COST: COST, WEAPONS: WEAPONS, ROB_KINDS: ROB_KINDS, CIG_SKUS: CIG_SKUS, TOB: TOB, TILL_HEAVY: TILL_HEAVY, XP_PER_LEVEL: XP_PER_LEVEL, CUSTOMERS: CUSTOMERS, CURE_CAP_BASE: CURE_CAP_BASE, DRY_MS_BASE: DRY_MS_BASE, WORKER_WAGE: WORKER_WAGE, WALKUP_RATE: WALKUP_RATE, WALKUP_CAP: WALKUP_CAP }
  };
