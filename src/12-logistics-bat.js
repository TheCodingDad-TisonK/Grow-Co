//@ van deliveries, the bank courier and the bat
  // ── Logistics: laptop orders become a van delivery at the back door; the bank courier collects cash at the back gate ──
  var ORDER_WAIT = 15000, VAN_TRIP = 75000;
  function orderAdd(id, n) { if (!S.order) S.order = { items: {}, at: now() }; S.order.items[id] = (S.order.items[id] || 0) + n; S.order.at = now(); }
  function orderSummary(items) { return Object.keys(items).map(function (k) { return items[k] + '× ' + itemName(k); }).join(', '); }
  function storageAdd(items) { Object.keys(items).forEach(function (k) { S.storage[k] = (S.storage[k] || 0) + items[k]; }); world.dirtyStorage = true; }
  var truck = { g: null, state: 'away', t: 0, delivery: null, z: -32 };
  var courier = { g: null, h: null, state: 'away', path: [], t: 0, bubble: null };
  function updateLogistics(dt, offline) {
    // an open order closes a few seconds after the last click and becomes a delivery on its way
    if (S.order && now() - S.order.at > ORDER_WAIT) { S.deliveries.push({ items: S.order.items, due: now() + (S.upgrades.ownvan ? 20000 : hasLic('wholesale') ? VAN_TRIP / 2 : VAN_TRIP) }); logEvent('🚚 Order dispatched: ' + orderSummary(S.order.items), ''); if (!offline) toast('🚚 Order dispatched. The supplier\'s van is on its way to the back door.', ''); S.order = null; }
    // deliveries that came due while the window was closed just land in storage
    if (offline) { var keep = []; S.deliveries.forEach(function (d) { if (now() >= d.due) { storageAdd(d.items); logEvent('📦 Delivered while you were away: ' + orderSummary(d.items), 'good'); } else keep.push(d); }); S.deliveries = keep; }
    // courier: called from the bank app, turns up a minute or two later
    if (S.courier && S.courier.state === 'called' && now() >= S.courier.at && !offline) { S.courier.state = 'arriving'; courierArrive(); }   // a courier that came due while the game was closed simply turns up on the next live tick
    if (S.courier && S.courier.state !== 'called' && courier.state === 'away' && !offline && ui.started) { courierArrive(); }   // booked and supposedly here but no body (reload mid-visit): walk them in again instead of blocking the bank app forever
  }
  function rollerSet(open) { if (world.rollerOpen !== open && world.rollerDoor) sfx('roller'); world.rollerOpen = open; world.obstacles = world.obstacles.filter(function (o) { return o.tag !== 'roller'; }); if (!open) world.obstacles.push({ x1: 3.0, x2: 6.0, z1: -12.75, z2: -12.35, tag: 'roller', floorLevel: 0 }); }
  function garageSet(open) { if (world.garageOpen !== open && world.garageDoor) sfx('roller'); world.garageOpen = open; world.obstacles = world.obstacles.filter(function (o) { return o.tag !== 'garagedoor'; }); if (!open) world.obstacles.push({ x1: 9.85, x2: 10.15, z1: -19.75, z2: -16.75, tag: 'garagedoor', floorLevel: 0 }); }
  function barrierSet(open) { if (world.barrierOpen !== open && world.barrier) sfx('gate'); world.barrierOpen = open; world.obstacles = world.obstacles.filter(function (o) { return o.tag !== 'barrier'; }); if (!open) world.obstacles.push({ x1: 2.2, x2: 7.0, z1: -31.75, z2: -31.45, tag: 'barrier', floorLevel: 0 }); }
  function gateSet(open) { if (world.gateOpen !== open && world.yardGate) sfx('gate'); world.gateOpen = open; world.obstacles = world.obstacles.filter(function (o) { return o.tag !== 'gate'; }); if (!open) world.obstacles.push({ x1: 3.0, x2: 6.0, z1: (world.yardGateZ || -18) - 0.15, z2: (world.yardGateZ || -18) + 0.15, tag: 'gate', floorLevel: 0 }); }
  function updateTruck(dt) {
    // the roller door slides up and the yard gate swings whenever their state changes, van or no van
    if (world.rollerDoor) { var ty = world.rollerOpen ? 2.15 : 0; world.rollerDoor.position.y = lerp(world.rollerDoor.position.y, 1.2 + ty, Math.min(1, dt * 2)); }
    if (world.yardGate) { var ga = world.gateOpen ? -Math.PI / 2 : 0; world.yardGate.rotation.y = lerp(world.yardGate.rotation.y, ga, Math.min(1, dt * 2.5)); }
    if (world.garageDoor) { var gy = world.garageOpen ? 2.15 : 0; world.garageDoor.position.y = lerp(world.garageDoor.position.y, 1.2 + gy, Math.min(1, dt * 2)); }
    if (world.barrier) { if (drive.on && drive.g) { var bd = Math.hypot(drive.g.position.x - 4.5, drive.g.position.z + 31.6); if (bd < 7 && !world.barrierOpen) barrierSet(true); else if (bd > 12 && world.barrierOpen) barrierSet(false); } world.barrier.rotation.z = lerp(world.barrier.rotation.z, world.barrierOpen ? -1.45 : 0, Math.min(1, dt * 2.2)); }   /* the barrier reads the owner's car and lifts itself */
    if (truck.state === 'away') {
      var due = S.deliveries.filter(function (d) { return now() >= d.due; })[0]; if (!due || !truck.g) return;
      truck.delivery = due; S.deliveries = S.deliveries.filter(function (d) { return d !== due; });
      truck.state = 'in'; truck.z = -32; truck.g.visible = true; truck.g.position.set(4.5, 0, truck.z); gateSet(true); sfx('engine');
      toast('🚚 The supplier\'s van is pulling into the yard', '');
    }
    if (truck.state === 'in') { truck.z += dt * 4.5; if (truck.z >= -15.2) { truck.z = -15.2; truck.state = 'unload'; truck.t = 0; rollerSet(true); } truck.g.position.z = truck.z; }
    else if (truck.state === 'unload') {
      truck.t += dt; if (truck.t > 1.2 && !truck.dropped) { truck.dropped = true; storageAdd(truck.delivery.items); burst(4.5, 0.8, -12.0, 0xd9b36a, 24, 'up'); sfx('cash'); logEvent('📦 Delivered to the back room: ' + orderSummary(truck.delivery.items), 'good'); toast('📦 Delivery in the back room: ' + orderSummary(truck.delivery.items), 'good'); }
      if (truck.t > 7) { truck.state = 'out'; truck.dropped = false; rollerSet(false); sfx('beep'); sfx('engine'); }
    }
    else if (truck.state === 'out') { truck.z -= dt * 4.0; truck.g.position.z = truck.z; if (truck.z < -32) { truck.state = 'away'; truck.g.visible = false; gateSet(false); } }
  }
  function courierArrive() {
    if (!courier.g) { courier.g = new THREE.Group(); world.group.add(courier.g); courier.bubble = sprite(textTex(['…'], 512, 160, { size: 44 }), 1.5, 0.58, 0, 2.25, 0, courier.g); }
    if (courier.h) { courier.g.remove(courier.h); disposeTree(courier.h); }
    courier.h = makeHuman({ skin: 0xe0ac7e, hair: 0x2b1b12, shirt: 0x1f3a5f, pants: 0x1f3a5f, hat: 'cap', capColor: 0x1f3a5f, longSleeve: true, hairStyle: 'short', watch: true, shoes: 0x111111, logo: '🏦', mood: 'neutral' });
    courier.g.add(courier.h); var el = courier.h.userData.parts.lArm.userData.elbow; var cs = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.1), colorMat(0x1a1c20, 0.5, 0.3)); cs.position.set(0, -0.45, 0.02); el.add(cs);
    var hb = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.1, 0.5), MAT.none); hb.position.y = 1.25; hb.userData.courier = true; courier.h.add(hb); interactable(hb, { kind: 'courier' });
    courier.g.position.set(4.5, 0, -21); courier.g.visible = true; courier.state = 'in'; courier.path = [{ x: 4.5, z: -16 }, { x: 4.5, z: -11.6 }]; gateSet(true); rollerSet(true);
    courier.bubble.visible = false; toast('🏦 The bank courier is at the back gate', ''); logEvent('🏦 Bank courier arrived for a ' + money(S.courier.amount) + ' pickup', '');
  }
  function courierSay(t, col) { var ob = courier.bubble.material.map; courier.bubble.material.map = textTex([t], 512, 160, { size: 44, titleColor: col || '#e8f1ea' }); courier.bubble.material.needsUpdate = true; if (ob) ob.dispose(); courier.bubble.visible = true; }
  function courierHandOver() {
    var c = S.courier; if (!c || courier.state !== 'wait') return;
    if (S.pocket < c.amount) { toast('The courier wants ' + money(c.amount) + ' and you\'ve ' + money(S.pocket) + ' in your pocket. Get the rest from the vault.', 'bad'); courierSay('I need the full ' + money(c.amount) + ', please.', '#ffc857'); return; }
    sfx('rustle'); S.pocket -= c.amount; var due = { amount: c.amount, dueDay: (S.day || 1) + 1, dueAt: now() + (+SET.dayLength || 20) * 60000 }; S.pending.push(due);
    sfx('cash'); toast('🏦 Handed ' + money(c.amount) + ' to the courier. It clears tomorrow.', 'good'); logEvent('🏦 ' + money(c.amount) + ' handed to the bank courier, clears tomorrow', 'good');
    courierSay('Signed for. Cheers.', '#6fdc8c'); courier.state = 'leave'; courier.path = [{ x: 4.5, z: -16 }, { x: 4.5, z: -21 }]; S.courier = null; world.interact = world.interact.filter(function (m) { return !m.userData.courier; });
  }
  function updateCourier(dt) {
    if (courier.state === 'away' || !courier.h) return;
    var spd = 1.4;
    if (courier.state === 'in') { if (walkAlong(courier.g, courier.path, spd, dt)) { courier.state = 'wait'; courier.t = 0; courier.g.rotation.y = 0; courierSay('Cash pickup: ' + money(S.courier ? S.courier.amount : 0) + '.', '#ffc857'); if (S.courier) S.courier.state = 'waiting'; } animateHuman(courier.h, dt, 'walk', spd, null); }
    else if (courier.state === 'wait') { courier.t += dt; animateHuman(courier.h, dt, 'wait', 0, player.pos); if (courier.t > 180) { courierSay('Can\'t wait any longer. Book me again.', '#ff6b6b'); courier.state = 'leave'; courier.path = [{ x: 4.5, z: -16 }, { x: 4.5, z: -21 }]; if (S.courier) S.courier = null; logEvent('🏦 The courier left without a pickup', 'bad'); toast('🏦 The courier gave up waiting and left. Book another under Bank on the office PC.', 'bad'); world.interact = world.interact.filter(function (m) { return !m.userData.courier; }); } }
    else if (courier.state === 'leave') { if (walkAlong(courier.g, courier.path, spd, dt)) { courier.state = 'away'; courier.g.visible = false; courier.bubble.visible = false; rollerSet(false); gateSet(false); } animateHuman(courier.h, dt, 'walk', spd, null); }
  }
  function callCourier(amount) {
    if (S.courier) { toast('A courier is already booked', 'bad'); return; }
    if (now() < (S.courierBanUntil || 0)) { toast('The bank won\'t send a courier here for a while', 'bad'); return; }
    if (amount < 50) { toast('Minimum pickup is $50', 'bad'); return; }
    S.courier = { amount: amount, state: 'called', at: now() + randi(45000, 90000) };
    sfx('click'); toast('🏦 Courier booked for ' + money(amount) + '. Have the cash in your pocket at the back door.', 'good'); logEvent('🏦 Booked a bank courier for ' + money(amount), '');
  }

  // ── The bat: swing at whoever is in front of you. Knock-downs have consequences; a second hit while they are down is worse ──
  var swing = { t: 0, cd: 0 };
  function facingTargets(range, minDot) {
    var out = []; var fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw);
    function test(g2, what, ref) { if (!g2 || !g2.visible) return; var dx = g2.position.x - player.pos.x, dz = g2.position.z - player.pos.z; var d = Math.hypot(dx, dz); if (d > (range || 1.9) || d < 0.05) return; var dot = (dx * fx + dz * fz) / d; if (dot < (minDot || 0.75)) return; out.push({ what: what, ref: ref, d: d }); }
    if (npc.human && npc.state !== 'away') test(npc.g, 'customer', npc);
    loungers.forEach(function (l) { test(l.g, 'lounger', l); });
    lineup.forEach(function (m) { if (m.state !== 'out') test(m.g, 'queuer', m); });
    if (courier.h && courier.state !== 'away') test(courier.g, 'courier', courier);
    robbers.forEach(function (r) { if (r.h && r.state !== 'away') test(r.g, 'robber', r); });
    out.sort(function (p, q) { return p.d - q.d; }); return out;
  }
  function swingBat() {
    if (swing.cd > now() || player.downT > 0) return; swing.cd = now() + 450; swing.t = 0.35; sfx('swing');
    var t = facingTargets()[0]; if (!t) return;
    sfx('hit'); burst(t.ref.g.position.x, 1.3, t.ref.g.position.z, 0xffffff, 12, 'out'); hitNpc(t.what, t.ref);
  }
  function lieDown(h) { h.rotation.x = -Math.PI / 2; h.position.y = 0.28; }
  function standBack(h) { h.rotation.x = 0; h.position.y = 0; }
  function policeFine(reason) { addHeat(15); var fine = 500; drawFunds(fine); S.noCustomersUntil = now() + 120000; logEvent('🚓 ' + reason + '. Police fine: ' + money(fine) + ', and customers stay away for a while (heat +15)', 'bad'); toast('🚓 Police fine: ' + money(fine) + '. No customers for 2 min (heat +15)', 'bad'); }
  function hitNpc(what, ref) {
    if (what === 'customer') {
      if (npc.state === 'down') { npc.state = 'out'; npc.downT = 0; S.rep = Math.max(0, S.rep - 25); logEvent('🚑 ' + npc.who + ' is out cold. An ambulance took them away.', 'bad'); policeFine('You put ' + npc.who + ' in hospital'); return; }
      if (npc.state === 'out') return;
      npc.state = 'down'; npc.downT = 0; lieDown(npc.human); npc.human.userData.setMood('sad'); npc.say(custLine(npc.who, 'hurt'), '#ff6b6b'); S.rep = Math.max(0, S.rep - 8); if (S.customer) { logEvent('👊 You hit ' + npc.who + ' with the bat. The order\'s off (rep -8)', 'bad'); S.customer = null; } toast('👊 ' + npc.who + ' goes down (rep -8)', 'bad');
    } else if (what === 'queuer') { lineHit(ref);
    } else if (what === 'lounger') {
      var l = ref; if (fight && (fight.a === l || fight.b === l)) endFight('force');
      if (l.state === 'down') { l.state = 'out'; l.t = 0; S.rep = Math.max(0, S.rep - 25); logEvent('🚑 ' + l.who + ' is out cold. An ambulance took them away.', 'bad'); policeFine('You put ' + l.who + ' in hospital'); return; }
      if (l.state === 'out') return;
      l.state = 'down'; l.t = 0; l.g.position.y = 0; lieDown(l.h); l.h.userData.setMood('sad'); loungerSay(l, 'Ow. What was that for?', '#ff6b6b'); l.joint.visible = false; l.glow.intensity = 0; S.rep = Math.max(0, S.rep - 6); logEvent('👊 You hit ' + l.who + ' with the bat (rep -6)', 'bad'); toast('👊 ' + l.who + ' goes down (rep -6)', 'bad');
    } else if (what === 'courier') {
      if (courier.state === 'leave' || courier.state === 'away') return;
      courierSay('That\'s it. No more pickups from us.', '#ff6b6b'); courier.state = 'leave'; courier.path = [{ x: 4.5, z: -16 }, { x: 4.5, z: -21 }]; S.courier = null; S.courierBanUntil = now() + 300000; S.rep = Math.max(0, S.rep - 10); world.interact = world.interact.filter(function (m) { return !m.userData.courier; }); logEvent('👊 You hit the bank courier. No pickups for 5 min (rep -10)', 'bad'); toast('👊 The courier storms off. No bank pickups for 5 min.', 'bad');
    } else if (what === 'robber') { strikeRobber(ref, 'bat');
    }
  }
