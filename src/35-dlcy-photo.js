//@ Dev Tools, more of it: photo mode. The camera leaves your head and flies, with everything on the screen put away
  // ── Dev Tools: photo mode ──
  // Started from the dev console. You stay where you stand and the game goes on around you; only the view moves. W A S D fly,
  // Space and Ctrl go up and down, Shift is faster, the wheel changes the lens. F8 or Esc puts the camera back in your head.
  var photo = { on: false, pos: new THREE.Vector3(), yaw: 0, pitch: 0, fov: 0, dir: new THREE.Vector3(), side: new THREE.Vector3() };
  (function () { var st = document.createElement('style'); st.textContent = 'body.g3-photo > div, body.g3-photo > canvas.g3-dash { visibility: hidden !important; }'; document.head.appendChild(st); })();
  function photoOn() {
    if (photo.on) return true; if (drive.on || sec.view.on) { toast('Get out of the car or the camera view first', 'bad'); return false; }
    photo.on = true; ui.photoOn = true; photo.pos.copy(camera.position); photo.yaw = player.yaw; photo.pitch = player.pitch; photo.fov = camera.fov;
    setTimeout(function () { if (photo.on) document.body.classList.add('g3-photo'); }, 3500); try { canvas.requestPointerLock(); } catch (e) {}
    return true;
  }
  function photoOff() {
    if (!photo.on) return; photo.on = false; ui.photoOn = false; document.body.classList.remove('g3-photo'); camera.fov = photo.fov; camera.updateProjectionMatrix();
    camera.position.set(player.pos.x, player.pos.y, player.pos.z); camera.rotation.set(player.pitch, player.yaw, 0); if (!ui.blocked()) lockPointer(); toast('📷 Back in your own head', '');
  }
  function updatePhoto(dt) {
    if (!photo.on) return; var k = player.keys, sp = (k.ShiftLeft || k.ShiftRight ? 9 : 3) * dt, f = (k.KeyW ? 1 : 0) - (k.KeyS ? 1 : 0), s = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0), u = (k.Space ? 1 : 0) - (k.ControlLeft || k.ControlRight ? 1 : 0);
    camera.rotation.set(photo.pitch, photo.yaw, 0); camera.getWorldDirection(photo.dir); photo.side.crossVectors(photo.dir, camera.up).normalize();
    photo.pos.addScaledVector(photo.dir, f * sp).addScaledVector(photo.side, s * sp); photo.pos.y += u * sp;
    camera.position.copy(photo.pos); hands.visible = false;
  }
  document.addEventListener('mousemove', function (e) { if (!photo.on || document.pointerLockElement !== canvas) return; var sx = 0.0022 * SET.sens; photo.yaw -= e.movementX * sx; photo.pitch = clamp(photo.pitch - e.movementY * sx * (SET.invertY ? -1 : 1), -1.5, 1.5); });
  document.addEventListener('wheel', function (e) { if (!photo.on) return; camera.fov = clamp(camera.fov + (e.deltaY > 0 ? 3 : -3), 20, 95); camera.updateProjectionMatrix(); }, { passive: true });
