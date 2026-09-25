//@ sitting, eating, smoking and the bed
  // ── Sitting, eating, sleeping ──────────────────────────────────────
  var sit = { on: false, spot: null, prevPos: null };
  function sitDown(spot) { if (sit.on) { standUp(); return; } sfx('sit'); sit.on = true; sit.spot = spot; sit.prevPos = player.pos.clone(); player.pos.x = spot.x; player.pos.z = spot.z; player.yaw = spot.yaw; player.pitch = 0; player.vel.set(0, 0, 0); toast('Sat down. E or move to get up.', ''); }
  function standUp() { if (!sit.on) return; camExit(); sfx('sit'); sit.on = false; if (sit.prevPos) { player.pos.x = sit.prevPos.x; player.pos.z = sit.prevPos.z; } sit.spot = null; }
  function eatSnack() { var h = held(); if (!h || h.kind !== 'snack') { toast('Grab something from the kitchen fridge first', 'bad'); return; } S.held = null; S.buff = { until: now() + 10 * 60000, speed: 1.15, label: 'well fed' }; S.stats.meals = (S.stats.meals || 0) + 1; burst(player.pos.x, player.pos.y - 0.3, player.pos.z, 0xffd766, 16, 'up'); sfx('rare'); toast('😋 ' + pick(['Nice.', 'Chef\'s kiss.', 'That hit the spot.']) + ' Well fed: +15% walk speed for 10 min', 'good'); logEvent('🍽️ Had something to eat', ''); }
  function buffSpeed() { return S.buff && S.buff.until > now() ? S.buff.speed : 1; }
  function useHint(h) { if (!h) return ''; if (isDrink(h)) return 'V drinks it'; if (h.kind === 'snack') return 'V eats it'; if (h.kind === 'joints') return smoke.on ? 'one already lit' : 'V lights one'; if (h.kind === 'cookies') return 'V eats one'; if (h.kind === 'cupEmpty' || h.kind === 'canEmpty') return 'V bins it near a bin'; return ''; }
  function useHeld() {   /* V: drink, eat or light up where you stand; no couch or cooler needed */
    var h = held(); if (!h) { toast('Nothing in your hand', ''); return; }
    if (drive.on) { toast('Not while you\'re driving', 'bad'); return; }
    if (isDrink(h)) { drinkHeld(); autoBin(); return; }
    if (h.kind === 'snack') { eatSnack(); return; }
    if (h.kind === 'joints') { sparkUp(); return; }
    if (h.kind === 'cookies') { eatCookie(); return; }
    if (h.kind === 'cupEmpty' || h.kind === 'canEmpty') { if (!autoBin()) toast('No bin with room within reach. Walk over to one, or G puts it down', ''); return; }
    toast('Nothing to use there. V drinks, eats or lights a joint', '');
  }
  function eatCookie() {   /* one of your own, off the stack in your hand */
    var h = held(); if (!h || h.kind !== 'cookies' || !(h.n >= 1)) return;
    var q = (h.qSum || 0) / h.n, thc = (h.thcSum || 0) / h.n; h.n -= 1; h.qSum = (h.qSum || 0) - q; h.thcSum = (h.thcSum || 0) - thc; if (h.n <= 0) S.held = null;
    S.chill = { until: now() + 10 * 60000, label: 'mellow' }; S.stats.cookiesEaten = (S.stats.cookiesEaten || 0) + 1;
    sfx('pickup'); toast('🍪 ' + pick(['Quality control.', 'For science.', 'Just the one.']) + ' Mellow: customers pay 2% more for 10 min', 'good'); logEvent('🍪 Ate one of your own cookies (quality ' + Math.round(q) + ')', ''); save();
  }
  function autoBin() {   /* an empty in your hand goes straight into a bin with room within a few steps, on your floor */
    var h = held(); if (!h || (h.kind !== 'cupEmpty' && h.kind !== 'canEmpty')) return false;
    var best = null, bd = 3.5; builtUnits('trash').forEach(function (u) { var P = propPlacement(u); if ((P.floor || 0) !== (player.floor || 0)) return; var d = Math.hypot(P.x - player.pos.x, P.z - player.pos.z); if (d < bd && (machState(u).trash || 0) < 12) { bd = d; best = u; } });
    if (!best) return false; var TB = machState(best); S.held = null; TB.trash = (TB.trash || 0) + 1; sfx('dust'); toast('🗑️ Tossed the empty in the bin (' + TB.trash + ' of 12)', ''); save(); return true;
  }
  function isDrink(h) { return !!h && (h.kind === 'cupWater' || h.kind === 'cup2' || h.kind === 'can2'); }
  function isTrash(h) { return !!h && (h.kind === 'cupEmpty' || h.kind === 'canEmpty' || h.kind === 'cupWater' || h.kind === 'cup2' || h.kind === 'can2'); }
  function drinkHeld() {   /* water, coffee or a cold one: a short lift, and you are left holding the empty */
    var h = held(); if (!isDrink(h)) return; var kind = h.kind; S.held = null;
    var mins = kind === 'cupWater' ? 4 : 8, label = kind === 'cupWater' ? 'refreshed' : kind === 'cup2' ? 'caffeinated' : 'refreshed';
    if (!S.buff || S.buff.until < now() || S.buff.speed <= 1.08) S.buff = { until: now() + mins * 60000, speed: 1.08, label: label };   /* never overwrite a better buff, like well fed */
    take({ kind: kind === 'can2' ? 'canEmpty' : 'cupEmpty' }); sfx('pickup'); toast((kind === 'cupWater' ? '💧 Drank the water' : kind === 'cup2' ? '☕ Drank the coffee' : '🥤 Drank it') + ': ' + label + ' for ' + mins + ' min. The empty goes in the bin.', 'good'); save();
  }
  // ── Smoking a joint on the sofa: cosmetic drags and puffs while seated, plus a 10 min 'mellow' price bonus ──
  var smoke = { on: false, until: 0, nextDrag: 0, drag: 0, puffed: false, group: null, light: null };
  function buildSmokeRig() {
    var gr = new THREE.Group(); gr.visible = false; camera.add(gr); smoke.group = gr;
    var hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), new THREE.MeshStandardMaterial({ color: 0xe8b894, roughness: 0.9 })); hand.scale.set(1, 0.7, 1.2); gr.add(hand);
    var j = new THREE.Group(); j.position.set(0.0, 0.045, -0.03); j.rotation.x = -Math.PI / 2 + 0.5; gr.add(j);   // held between the fingers on top of the hand, pointing forward and up so it stays visible
    j.add(new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.007, 0.13, 8), colorMat(0xf5f0e0, 0.9)));
    var ember = new THREE.Mesh(new THREE.SphereGeometry(0.01, 6, 6), glowMat(0xff6a1a, 2.0)); ember.position.y = 0.065; j.add(ember);
    smoke.light = new THREE.PointLight(0xff7a2a, 0, 0.6); smoke.light.position.y = 0.065; j.add(smoke.light);
    gr.position.set(0.26, -0.28, -0.55);
  }
  function smokeSide() { return sit.on ? 1 : -1; }
  function sparkUp() {
    var h = held(); if (!h || h.kind !== 'joints') { toast('Bring a joint from the goods shelf first', 'bad'); return; }
    if (smoke.on) { toast('One at a time', ''); return; }
    var q = h.qSum / h.n, thc = h.thcSum / h.n; h.n -= 1; h.qSum -= q; h.thcSum -= thc; if (h.n <= 0) S.held = null;
    smoke.on = true; smoke.until = now() + 24000; smoke.nextDrag = now() + 1500; smoke.drag = 0; smoke.puffed = false; if (smoke.group) { smoke.group.visible = true; smoke.group.position.set(0.26 * smokeSide(), -0.28, -0.55); }
    S.chill = { until: now() + 10 * 60000, label: 'mellow' }; S.stats.smoked = (S.stats.smoked || 0) + 1;
    sfx('lighter'); toast('🚬 ' + pick(['Sparked one up.', 'Ahh.', 'Quality control.']) + ' Mellow: customers pay 2% more for 10 min', 'good');
    logEvent('🚬 ' + (sit.on ? 'Sat down and smoked a joint' : 'Lit a joint on the go') + ' (quality ' + Math.round(q) + ')', '');
  }
  function endSmoke() { smoke.on = false; smoke.drag = 0; if (smoke.group) smoke.group.visible = false; if (smoke.light) smoke.light.intensity = 0; }
  var _puff = new THREE.Vector3(), _tp = new THREE.Vector3();
  function updateSmoke(dt) {
    if (!smoke.on) return;
    if (drive.on) { endSmoke(); toast('Stubbed it out before driving', ''); return; }
    if (now() > smoke.until) { endSmoke(); toast('Down to the roach', ''); return; }
    var t = now();
    if (smoke.drag <= 0 && t > smoke.nextDrag) { smoke.drag = 1.8; smoke.nextDrag = t + randi(3500, 6000); sfx('inhale'); }
    var up = smoke.drag > 0.7;
    if (smoke.drag > 0) {
      smoke.drag -= dt;
      if (smoke.drag <= 0.7 && !smoke.puffed) { smoke.puffed = true; sfx('exhale'); camera.getWorldDirection(_puff); burst(camera.position.x + _puff.x * 0.4, camera.position.y - 0.04 + _puff.y * 0.4, camera.position.z + _puff.z * 0.4, 0xc9d1cc, 12, 'smoke'); }
      if (smoke.drag <= 0) { smoke.drag = 0; smoke.puffed = false; }
    }
    _tp.set((up ? 0.08 : 0.26) * smokeSide(), up ? -0.13 : -0.28, up ? -0.36 : -0.55); smoke.group.position.lerp(_tp, 0.15);
    smoke.light.intensity = up ? 0.6 + Math.sin(world.time * 30) * 0.2 : 0.15;
  }
  // ── Bed: lie down, the screen fades out, the sim jumps to 06:00 the next morning, fade back in standing by the bed ──
  var sleep = { on: false, fade: null };
  function fadeEl() { if (sleep.fade) return sleep.fade; var d = document.createElement('div'); d.style.cssText = 'position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;transition:opacity 1.4s ease;z-index:50'; document.body.appendChild(d); sleep.fade = d; return d; }
  function napBed() {
    if (sleep.on) return;
    if (sit.on) { standUp(); return; }
    var thirsty = S.plants.filter(function (p) { return p.thirst > 0.6; }).length;
    sitDown(world.bedSpot || { x: -8.5, z: 7.2, yaw: Math.PI }); player.pitch = 0.9; sleep.on = true; sfx('bed');
    toast('🛏️ Lying down…' + (thirsty ? ' ' + thirsty + (thirsty === 1 ? ' plant is' : ' plants are') + ' thirsty, though' : ''), '');
    var f = fadeEl(); f.style.pointerEvents = 'auto'; setTimeout(function () { f.style.opacity = '1'; }, 20);
    setTimeout(function () {
      // advance the world to 06:00: in cycle mode by the clock, otherwise a flat eight hours of the default day length
      var dayLen = (+SET.dayLength || 20) * 60; var hours = SET.dayNight === 'cycle' ? ((6 - S.clock + 24) % 24 || 24) : 8;
      var secs = hours / 24 * dayLen; var dayBefore = S.day || 1;
      if (S.customer) { logEvent('🚪 ' + S.customer.who + ' gave up waiting while you slept', ''); S.customer = null; } if (lineCount()) logEvent('🚪 The line gave up and went home while you slept', ''); lineClear();
      step(secs, true); if (SET.dayNight === 'cycle') S.clock = 6; S.lastTick = now(); S.stats.naps = (S.stats.naps || 0) + 1;
      S.buff = { until: now() + 15 * 60000, speed: 1.15, label: 'well rested' };
      world.dirty = true; rebuildDynamic(); syncShelf(); syncRack(); updateDayNight(); hud(); save();
      standUp(); player.pitch = 0; sleep.on = false; sfx('chime');
      var ready = S.plants.filter(function (p) { return p.progress >= 1; }).length;
      logEvent('🌅 Slept until 06:00' + (SET.dayNight === 'cycle' && S.day !== dayBefore ? ' on day ' + S.day : '') + (ready ? ' · ' + ready + (ready === 1 ? ' plant ready' : ' plants ready') : ''), 'good');
      toast('🌅 Good morning' + (SET.dayNight === 'cycle' ? ', day ' + S.day : '') + '.' + (ready ? ' ' + ready + (ready === 1 ? ' plant is' : ' plants are') + ' ready to harvest.' : '') + ' Well rested (+15% walk speed).', 'good');
      f.style.opacity = '0'; setTimeout(function () { f.style.pointerEvents = 'none'; }, 1500);
    }, 1700);
  }

