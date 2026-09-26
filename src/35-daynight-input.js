//@ day and night, and input
  // ── Day / night ───────────────────────────────────────────────────
  var skyCol = new THREE.Color(), snowFog = new THREE.Color(), sunFocus = { x: 0, z: 0 };
  function updateDayNight() {
    var h = gameHour();
    var sunAlt = Math.sin((h - 6) / 12 * Math.PI); // 1 at noon, -1 at midnight
    var day = clamp(sunAlt * 1.4 + 0.1, 0, 1);
    var dusk = clamp(1 - Math.abs(sunAlt) * 3, 0, 1);
    skyCol.setRGB(lerp(0.02, 0.55, day) + dusk * 0.35, lerp(0.03, 0.72, day) + dusk * 0.12, lerp(0.08, 0.95, day));
    scene.background = skyCol;
    var wk = (S.x && S.x.weather) ? S.x.weather.kind : 'clear';
    fogCol.copy(skyCol);
    var wxm = (exp && exp.wxMix) || 0;
    if (wk === 'snow') { snowFog.copy(SNOW_FOG).multiplyScalar(0.14 + 0.86 * day); fogCol.lerp(snowFog, 0.4 * wxm); }        /* as bright as the hour allows: grey-white by day, dim at night, and none of it indoors */
    else if (wk === 'rain' || wk === 'storm') fogCol.lerp(RAIN_FOG, 0.3);
    scene.fog.color.copy(fogCol);
    sun.intensity = 0.1 + day * 0.9; sun.color.setRGB(1, lerp(0.7, 0.95, day) + dusk * 0.0, lerp(0.5, 0.85, day) - dusk * 0.2);
    /* the shadow box is 68 m across: centred on the shop, the car lost its shadow a block down Main St. It follows whoever you are (you, or the car you drive) in 4 m steps, so it is not redrawn for every stride */
    var fx = drive.on && drive.g ? drive.g.position.x : player.pos.x, fz = drive.on && drive.g ? drive.g.position.z : player.pos.z; if (player.floor === -1) { fx = 0; fz = 0; }   /* the basement rooms sit far out on x, under ground: nothing there takes the sun */
    fx = Math.round(fx / 4) * 4; fz = Math.round(fz / 4) * 4; if (fx !== sunFocus.x || fz !== sunFocus.z) { sunFocus.x = fx; sunFocus.z = fz; renderer.shadowMap.needsUpdate = true; }
    var ang = (h - 6) / 12 * Math.PI; sun.position.set(fx + Math.cos(ang) * 30, Math.max(2, Math.sin(ang) * 30), fz + 12); sun.target.position.set(fx, 0, fz);
    hemi.intensity = (0.12 + day * 0.28) * (wk === 'snow' ? 1 + 0.2 * wxm : wk === 'storm' ? 0.85 : 1); hemi.color.setRGB(lerp(0.3, 0.75, day), lerp(0.35, 0.85, day), lerp(0.6, 1.0, day));
    var indoor = 1 - day * 0.5; roomLight.intensity = 0.2 + indoor * 0.3; roomLight2.intensity = roomLight3.intensity = 0.15 + indoor * 0.25;
    if (world.streetLights) world.streetLights.forEach(function (l) { l.intensity = 0.1 + (1 - day) * 1.2; });
    if (world.facadeMats) { var glow = clamp((1 - day) * 1.3 - 0.1, 0, 1); for (var fi = 0; fi < world.facadeMats.length; fi++) world.facadeMats[fi].emissiveIntensity = glow; }
    if (world.roomLamps) world.roomLamps.forEach(function (l) { l.intensity = l.userData.off ? 0 : (l.userData.base || 0.7) * (0.75 + indoor * 0.5); });
  }

  // ── Input ─────────────────────────────────────────────────────────
  document.addEventListener('keydown', function (e) {
    if (!ui.started) return;
    if (ui.taskOpen) { if (e.code === 'Escape') { taskCancel(); } else if (e.code === 'Space' && !e.repeat) taskPress(true); e.preventDefault(); return; }   // Space is the only task key: E, clicks and every other key are swallowed while a task runs
    if (sec.view.on && !ui.blocked()) { if (e.code === 'Escape' || e.code === 'KeyE') camExit(); else if (/^Digit[1-6]$/.test(e.code)) camShow(+e.code.charAt(5) - 1); else if (e.code === 'ArrowRight' || e.code === 'KeyD') camShow(sec.view.idx + 1); else if (e.code === 'ArrowLeft' || e.code === 'KeyA') camShow(sec.view.idx - 1); e.preventDefault(); return; }
    if (e.code === 'Escape' && postPick >= 0) { postPick = -1; toast('📍 Cancelled', ''); e.preventDefault(); return; }
    if (e.code === 'Escape') { if (!ui.blocked() && runHooks(hooks.keydown, e)) { e.preventDefault(); return; } if (ui.pcOpen) { pcClose(); } else if (ui.deviceOpen) { deviceClose(); } else if (ui.wheelOpen) { wheelClose(); } else if (ui.ctxOpen) { ctxClose(); } else if (ui.panelOpen) { ui.closePanel(); } else if (ui.menuOpen) { closeMenu(); } else { openMenu(); } e.preventDefault(); return; }
    if (ui.ctxOpen) { if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') { ctxClose(); e.preventDefault(); } return; }
    if (ui.pcOpen || ui.deviceOpen || ui.wheelOpen) {   /* the PC desktop, a device or the wheel is up: only its own keys work */
      if (ui.deviceOpen && ((e.code === 'KeyF' && dev.kind === 'phone') || e.code === 'KeyJ')) { deviceClose(); e.preventDefault(); }
      else if (ui.wheelOpen && e.code === 'Tab') { wheelClose(); e.preventDefault(); }
      else if (ui.wheelOpen && /^Digit[1-8]$/.test(e.code)) { wheelPick(+e.code.charAt(5) - 1); e.preventDefault(); }
      else if (e.code === 'Tab') e.preventDefault();
      return;
    }
    if (ui.panelOpen || ui.menuOpen) { if (e.code === 'KeyI' && ui.panelKind === 'inventory') { ui.closePanel(); e.preventDefault(); } return; }
    player.keys[e.code] = true;
    if (runHooks(hooks.keydown, e)) { e.preventDefault(); return; }
    if (e.code === 'Space' && !e.repeat && !drive.on && !sit.on && !player.air && !(player.downT > 0) && player.locked && !ui.blocked()) { player.air = true; player.jumpV = player.crouch ? 2.6 : 4.0; e.preventDefault(); return; }   // jump; a crouched hop is smaller
    if (drive.on && !e.repeat) {   /* at the wheel the letter keys belong to the car */
      if (e.code === 'KeyE') { var ja = jobAtCar(), jn = xs().jobs.length; if (ja >= 0) jobHandOver(ja); if (ja < 0 || xs().jobs.length === jn) exitCar(); e.preventDefault(); return; }   /* pulled up at a drop: E hands it over, and only gets you out once the drop is done */
      if (e.code === 'KeyI') { ignition(); e.preventDefault(); return; }
      if (e.code === 'KeyP') { parkBrake(); e.preventDefault(); return; }
      if (e.code === 'KeyL') { carLightStep(); e.preventDefault(); return; }
      if (e.code === 'KeyT') { carPartToggle('boot'); e.preventDefault(); return; }
      if (e.code === 'KeyB') { carPartToggle('bonnet'); e.preventDefault(); return; }
      if (e.code === 'KeyC') { drive.look.yaw = 0; drive.look.pitch = 0.12; drive.look.t = 0; drive.dist = drive.vehicles && drive.vehicles[drive.veh] ? drive.vehicles[drive.veh].dist : 6.2; e.preventDefault(); return; }
      if (e.code === 'KeyJ') { jobsPanel(); e.preventDefault(); return; }
      if (e.code === 'KeyM') { toggleCityMap(); e.preventDefault(); return; }
    }
    if (e.code === 'F2') { editToggle(); e.preventDefault(); return; }
    if (e.code === 'F12' || e.code === 'F9') { screenshot(); e.preventDefault(); return; }
    if (edit.on) { if (e.code === 'KeyE') { if (edit.grabbed || edit.grabbedFx) editDrop(); else editGrab(); } else if (e.code === 'KeyR') editRotate(); else if (e.code === 'Backspace') editReset(); if (e.code === 'KeyE' || e.code === 'KeyR' || e.code === 'Backspace') { e.preventDefault(); return; } }
    if (/^Digit[1-6]$/.test(e.code)) { selectSlot(+e.code.charAt(5) - 1); sfx('click'); e.preventDefault(); return; }
    if (e.code === 'KeyM') { toggleCityMap(); e.preventDefault(); return; }
    if (e.code === 'KeyJ') { jobsPanel(); e.preventDefault(); return; }
    if (e.code === 'KeyE' && postPick >= 0) { postSet(); e.preventDefault(); return; }
    if (e.code === 'KeyE') { if (!e.repeat) interact(); e.preventDefault(); }
    if (e.code === 'KeyP') { panicButton(); e.preventDefault(); }
    if (e.code === 'Tab') { wheelOpen(); e.preventDefault(); }
    if (e.code === 'KeyI') { ui.openPanel('inventory'); e.preventDefault(); }
    if (e.code === 'KeyF' && !e.repeat) { phoneOpen(); e.preventDefault(); }
    if ((e.code === 'KeyG' || e.code === 'KeyQ') && !e.repeat) { putBack(); afterAction(); }
    if (e.code === 'KeyV' && !e.repeat) { useHeld(); afterAction(); }
  });
  document.addEventListener('wheel', function (e) { if (!player.locked || ui.blocked() || edit.on || sec.view.on) return; if (window.RFGROW && window.RFGROW.creative && window.RFGROW.creative.state.on) return; if (drive.on) { drive.dist = clamp(drive.dist + (e.deltaY > 0 ? 0.7 : -0.7), 3.2, 12); drive.look.t = 1.4; return; } if (focus && focus.data.kind === 'deskboard') { deskWheel(e.deltaY > 0 ? 1 : -1); return; } var tsc = focus && touchFor(focus.data.kind); if (tsc) { if (tsc.wheel) { tsc.wheel(e.deltaY > 0 ? 1 : -1); tDraw(tsc); sfx('click'); } return; }   /* the wheel pulls the chase camera in and out at the wheel */ selectSlot(S.slot + (e.deltaY > 0 ? 1 : -1)); }, { passive: true });
  document.addEventListener('keyup', function (e) { player.keys[e.code] = false; if (ui.taskOpen && e.code === 'Space') taskPress(false); });
  window.addEventListener('blur', function () { player.keys = {}; });
  document.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', function (e) {
    if (!ui.started || ui.taskOpen) return;   // a task ignores canvas clicks so a stray click can't re-lock the pointer mid-grind
    if (ui.blocked()) { if (e.button === 2) closeTopUi(); return; }   /* something is open: a click on the scene must never re-lock the pointer underneath it, and right-click closes it */
    if (e.button === 2 && cityMap.on) { toggleCityMap(); return; }
    if (!player.locked) { lockPointer(); if (e.button !== 0 || drive.on) return; }   /* the click that takes the pointer back also does its job on whatever the crosshair is on: the first click after a menu or panel used to be swallowed */
    if (runHooks(hooks.mousedown, e)) return;
    if (e.button === 2) { var hs = held(); if (hs && hs.kind === 'rifle' && !drive.on && !edit.on) scope.on = true; return; }
    if (e.button === 0) { if (drive.on) return; var hb3 = held(); if (hb3 && hb3.kind === 'bat' && !edit.on) { swingBat(); return; } if (hb3 && WEAPONS[hb3.kind] && !edit.on) { trigger.down = true; fireWeapon(); return; } if (edit.on) { if (edit.grabbed || edit.grabbedFx) editDrop(); else editGrab(); } else interact(); }
  });
  var lastUiClose = 0;
  function closeTopUi() { if (now() - lastUiClose < 300) return; if (ui.ctxOpen) { lastUiClose = now(); ctxClose(); } else if (ui.panelOpen) { lastUiClose = now(); ui.closePanel(); } else if (ui.wheelOpen) { lastUiClose = now(); wheelClose(); } else if (ui.deviceOpen) { lastUiClose = now(); deviceClose(); } else if (ui.pcOpen) { lastUiClose = now(); pcClose(); } }   /* one right-click closes one layer: the mousedown and the contextmenu event of the same click must not each close something */
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); closeTopUi(); });
  document.addEventListener('mouseup', function (e) { if (e.button === 2) scope.on = false; if (e.button === 0) trigger.down = false; });
  document.addEventListener('pointerlockchange', function () { player.locked = document.pointerLockElement === canvas; if (!player.locked) player.keys = {}; if (!player.locked && ui.started && !ui.blocked()) { /* user pressed Esc in lock: browser exits lock; a hook may claim it (creative cancels a carried piece), else open the menu */ if (!runHooks(hooks.unlock)) openMenu(); } });
  document.addEventListener('pointerlockerror', function () { lockRetry(); });
  window.addEventListener('resize', resize);
  function resize() { var w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }

