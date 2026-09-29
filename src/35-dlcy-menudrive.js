//@ what is behind the main menu: while the menu is up, the camera drives round the block at dusk and passes the shop front
  // ── The drive behind the menu ──
  // The menu sits over the running game, so the view behind it is only a matter of where the camera is. While the splash or the
  // main menu is up the camera leaves the player and rides a closed loop of streets, a little above roof-of-a-car height so it
  // never drives through the traffic. The clock is held at dusk for as long as it lasts: low sun, street lamps and lit windows.
  // Nothing about the player or the save is touched, and the moment the game starts the camera is the player's again.
  var menuDrive = { on: false, u: 0.68, hour: 17.1, speed: 6.5, curve: null, len: 1, pos: new THREE.Vector3(0, 2.4, CITY.mainZ), look: new THREE.Vector3(), tan: new THREE.Vector3(), was: false };
  function menuDriveWanted() {
    if (ui.started) return false; var mm = document.getElementById('rf-mainmenu'), sp = document.getElementById('rf-splash');
    return !!((mm && !mm.hidden) || (sp && !sp.hidden));
  }
  function menuDriveCurve() {
    var m = CITY.mainZ, b = CITY.backZ, w = CITY.westX, e = CITY.eastX, c = 9, y = 2.4;
    var pts = [[w + c, m], [-30, m], [0, m], [30, m], [e - c, m], [e, m - c], [e, (m + b) / 2], [e, b + c], [e - c, b], [20, b], [-20, b], [w + c, b], [w, b + c], [w, (m + b) / 2], [w, m - c]].reverse().map(function (p) { return new THREE.Vector3(p[0], y, p[1]); });   /* driven so that the inside of the loop, where the shop stands, is on the right: the menu card covers the left */
    var cv = new THREE.CatmullRomCurve3(pts, true, 'centripetal'); menuDrive.len = cv.getLength(); return cv;
  }
  function updateMenuDrive(dt) {
    var want = menuDriveWanted(); menuDrive.on = want;
    if (!want) { if (menuDrive.was) { menuDrive.was = false; hands.visible = true; renderer.shadowMap.needsUpdate = true; } return; }
    if (!menuDrive.curve) menuDrive.curve = menuDriveCurve();
    menuDrive.was = true; hands.visible = false;
    menuDrive.u = (menuDrive.u + dt * menuDrive.speed / menuDrive.len) % 1;
    var cv = menuDrive.curve, p = cv.getPointAt(menuDrive.u), a = cv.getPointAt((menuDrive.u + 14 / menuDrive.len) % 1), t = now() / 1000;
    menuDrive.pos.copy(p); menuDrive.pos.y = 2.4 + Math.sin(t * 0.6) * 0.04;
    menuDrive.tan.subVectors(a, p).normalize();
    /* the shop is inside the loop, so the view leans that way: to the right of the way we are going */
    menuDrive.look.set(a.x - menuDrive.tan.z * 3.2, 1.9, a.z + menuDrive.tan.x * 3.2);
    camera.position.copy(menuDrive.pos); camera.lookAt(menuDrive.look);
  }
