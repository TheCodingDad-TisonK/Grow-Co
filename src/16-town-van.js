//@ doing business in town and the shop van
  // ── doing business in town ──
  function carNear(x, z, r) { return Math.hypot(drive.g.position.x - x, drive.g.position.z - z) < r; }
  function trunkCount(vid) { var tr = (vid ? vehState(vid) : carState()).trunk; return Object.keys(tr).reduce(function (a, k) { return a + tr[k]; }, 0); }
  function unloadTrunk() { var cs = carState(), tr = cs.trunk, n = trunkCount(); if (!n) { toast('The boot is empty', ''); return; } carPopBoot(); storageAdd(tr); cs.trunk = {};   /* empty the trunk that was unloaded: clearing S.car while the van was in hand let the van's load be unloaded again and again */ if (typeof syncStorage === 'function') syncStorage(); sfx('crate'); toast('📦 Unloaded the boot into the back room (' + n + ' items). You or the crew can shelve it from there.', 'good'); logEvent('📦 Unloaded a car run from RF Supply Co.', ''); save(); }
  function cityPoiMenu(poi) {
    var h = held(), lines = [];
    if (poi === 'bank') {
      if (h && h.kind === 'cashbag') lines.push({ label: '💰 Pay in the cash bag · ' + money(h.amount), act: function () { S.bank += h.amount; S.held = null; sfx('cash'); toast('🏦 ' + money(h.amount) + ' paid in', 'good'); hud(); save(); } });
      lines.push({ label: '👛 Pay in your pocket cash · ' + money(S.pocket), cls: S.pocket > 0 ? '' : 'muted', act: S.pocket > 0 ? function () { var a = S.pocket; S.bank += a; S.pocket = 0; sfx('cash'); toast('🏦 ' + money(a) + ' paid in. No courier fee, and no robber can touch it now.', 'good'); hud(); save(); } : null });
      [100, 500].forEach(function (a) { lines.push({ label: '💵 Withdraw ' + money(a) + ' to your pocket', cls: S.bank >= a ? '' : 'muted', act: S.bank >= a ? function () { S.bank -= a; S.pocket += a; sfx('coins'); hud(); save(); } : null }); });
      ctxOpen('🏦 First Harvest Bank', 'balance ' + money(S.bank) + ' · pocket ' + money(S.pocket), lines); return;
    }
    if (poi === 'gun') {
      var A = S.armory; function buy(label, price, ok, fn) { lines.push({ label: label + ' · ' + money(price), cls: ok && S.bank >= price ? '' : 'muted', act: ok && S.bank >= price ? function () { S.bank -= price; fn(); sfx('cash'); hud(); save(); } : null }); }
      buy('🦺 Kevlar vest <small>' + (A.vest ? 'you already wear one' : 'four hits in ten bounce off, hospital bills halved') + '</small>', 600, !A.vest, function () { A.vest = true; toast('🦺 Vest on', 'good'); });
      buy('🔫 32 rounds <small>' + (A.pistol ? (A.rounds || 0) + ' left · cheaper than the locker' : 'you own no pistol') + '</small>', 60, !!A.pistol, function () { A.rounds = (A.rounds || 0) + 32; toast('🔫 32 rounds', 'good'); });
      buy('💥 16 shells <small>' + (A.shotgun ? (A.shells || 0) + ' left' : 'you own no shotgun') + '</small>', 60, !!A.shotgun, function () { A.shells = (A.shells || 0) + 16; toast('💥 16 shells', 'good'); });
      buy('🪖 180 bullets <small>' + (A.ak ? (A.bullets || 0) + ' left' : 'you own no AK') + '</small>', 110, !!A.ak, function () { A.bullets = (A.bullets || 0) + 180; toast('🪖 180 bullets', 'good'); });
      buy('🎯 20 cartridges <small>' + (A.rifle ? (A.cartridges || 0) + ' left' : 'you own no rifle') + '</small>', 90, !!A.rifle, function () { A.cartridges = (A.cartridges || 0) + 20; toast('🎯 20 cartridges', 'good'); });
      buy('🌶️ Pepper spray refill <small>' + (A.pepper ? (A.spray || 0) + ' bursts left' : 'you own no can') + '</small>', 18, !!A.pepper, function () { A.spray = 6; toast('🌶️ Fresh can', 'good'); });
      ctxOpen('🔫 Iron & Oak Arms', 'bank ' + money(S.bank) + (hasLic('firearm') ? ' · licence checked' : ' · no firearms licence on file: guns are sold at your own locker once you hold one'), lines); return;
    }
    if (poi === 'rival') {
      var theirs = Math.round(unitPrice('bags', 60, 1.2) * (0.9 + ((S.day * 7) % 5) / 20)); lines.push({ label: '👀 Their price board: an eighth at ' + money(theirs) + ' <small>yours at quality 60: ' + money(Math.round(unitPrice('bags', 60, 1.2))) + ' · market ' + S.market.toFixed(2) + '×</small>', cls: 'muted' });
      lines.push({ label: '📣 Pay a kid ' + money(60) + ' to hand out your flyers outside their door <small>' + (S.flyerDay === S.day ? 'done for today' : 'rep +3, once a day') + '</small>', cls: S.flyerDay === S.day || S.bank < 60 ? 'muted' : '', act: S.flyerDay === S.day || S.bank < 60 ? null : function () { S.bank -= 60; S.flyerDay = S.day; S.rep += 3; sfx('ok'); toast('📣 Flyers going round (rep +3)', 'good'); logEvent('📣 Flyered the rival shop (rep +3)', 'good'); hud(); save(); } });
      if (xs().branch) lines.push({ label: '🏪 This is your branch now <small>it sells what you drop at the blue beacon out front: ' + money(BRANCH_PAY) + ' a unit, up to ' + BRANCH_CAP + ' a day, plus a little for your name, paid each morning · ' + (xs().branchUnits || 0) + ' dropped off today</small>', cls: 'on' }); else lines.push({ label: '🏪 Buy them out · ' + money(180000) + ' <small>' + (S.rep >= 150 ? 'they\'ll sell: keep the branch stocked and it pays you every morning' : 'they won\'t talk to you below 150 rep (you\'ve ' + Math.round(S.rep) + ')') + '</small>', cls: S.rep >= 150 && S.bank >= 180000 ? '' : 'muted', act: S.rep >= 150 && S.bank >= 180000 ? function () { S.bank -= 180000; xs().branch = true; sfx('levelup'); toast('🏪 Green Leaf is yours. That\'s a second shop.', 'rare'); logEvent('🏪 Bought out Green Leaf: you now run two shops', 'rare'); hud(); save(); } : null });
      ctxOpen('🌿 Green Leaf', xs().branch ? 'your second shop' : 'the competition, three doors down', lines); return;
    }
    if (poi === 'supply') {
      var near = carNear(-22, -44, 34) && trunkCount() < trunkCap(), tr = carState().trunk; if (trunkCount() >= trunkCap()) lines.push({ label: '🧰 The boot is full (' + trunkCap() + ' items). Unload it at home, or fit the bigger boot.', cls: 'muted' });
      if (!near) lines.push({ label: '🚗 Bring your car round to load up: they don\'t deliver from the trade counter', cls: 'muted' });
      SUPPLIES.filter(function (it) { return !it.tool; }).slice(0, 9).forEach(function (it) { var price = Math.max(1, Math.round(it.price * 0.8)); lines.push({ label: it.ico + ' ' + it.name + ' · ' + money(price) + ' <small>20% under the office PC price · ' + (tr[it.id] || 0) + ' in the boot</small>', cls: near && S.bank >= price ? '' : 'muted', act: near && S.bank >= price ? function () { S.bank -= price; tr[it.id] = (tr[it.id] || 0) + (it.qty || 1); sfx('crate'); toast(it.ico + ' ' + it.name + ' into the boot. Unload it at home.', 'good'); hud(); save(); } : null }); });
      ctxOpen('📦 RF Supply Co. trade counter', 'bank ' + money(S.bank) + ' · the boot holds ' + trunkCount() + ' items · no waiting for the van', lines); return;
    }
  }
  function parkDeal(idx) {
    var f = parkFolk[idx], h = held(); if (!f) return; if (!h || (h.kind !== 'joints' && h.kind !== 'bags' && h.kind !== 'cookies')) { toast('Nothing to offer. Bring joints, bags or cookies in your hands.', ''); return; }
    if (f.coolT > 0) { toast('"I\'m good for now. Maybe later."', ''); return; }
    if (Math.random() < 0.12 + xs().heat / 300) { addHeat(25); var fine = Math.min(S.bank, 250); S.bank -= fine; S.rep = Math.max(0, S.rep - 3); S.held = null; f.coolT = 120; sfx('siren'); toast('🚓 "Police. That\'s dealing, and you\'re nicked." A plain-clothes officer: ' + money(fine) + ' fine and the goods are gone (heat +25, rep -3)', 'bad'); logEvent('🚓 Busted dealing in Harvest Park: ' + money(fine) + ' fine (heat +25, rep -3)', 'bad'); hud(); save(); return; }
    var n = Math.min(h.n, f.want), q = h.qSum / h.n, thc = h.thcSum / h.n, got = Math.round(unitPrice(h.kind, q, thc) * n * 1.35); h.n -= n; h.qSum -= q * n; h.thcSum -= thc * n; if (h.n <= 0) S.held = null; S.pocket += got; addHeat(8); S.stats.street = (S.stats.street || 0) + got; f.coolT = 90; f.want = randi(1, 3); sfx('cash'); toast('🤝 Sold ' + n + ' ' + kindName(h.kind, n) + ' for ' + money(got) + ' cash. It\'s in your pocket: no rep, no receipt (heat +8)', 'good'); hud(); save();
  }
  var VAN_KINDS = ['joints', 'bags', 'cookies'], VAN_RACK_CAP = 3;
  function vanRack() { var v = vehState('van'); if (!v.rack) v.rack = {}; VAN_KINDS.forEach(function (k) { if (!v.rack[k]) v.rack[k] = { n: 0, qSum: 0, thcSum: 0 }; }); if (typeof v.sales !== 'number') v.sales = 0; return v.rack; }
  function syncVanRack() {   /* what is on the rack, drawn: joints lying in a row, bags standing, cookies stacked */
    var V = drive.vehicles && drive.vehicles.van, rg = V && V.g.userData.rackG; if (!rg) return; while (rg.children.length) { var ch = rg.children.pop(); disposeTree(ch); }
    var rk = vanRack();
    VAN_KINDS.forEach(function (k, ki) { var z = (ki - 1) * 0.55; for (var i = 0; i < rk[k].n; i++) { var m; if (k === 'joints') { m = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.007, 0.11, 8), colorMat(0xf5f0e0, 0.9)); m.rotation.z = Math.PI / 2; m.position.set(0.08, 0.03, z - 0.12 + i * 0.12); } else if (k === 'bags') { m = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.12, 0.03), colorMat(0xd8dfc8, 0.7, 0, { transparent: true, opacity: 0.85 })); m.position.set(0.08, 0.06, z - 0.12 + i * 0.12); } else { m = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.012, 14), colorMat(0xb98a4a, 0.9)); m.position.set(0.08, 0.02 + i * 0.014, z); } rg.add(m); } });
  }
  function vanRackStock() {   /* E on the rack: goods in hand go up, three of each at most; empty hands take a kind back down */
    var rk = vanRack(), h = held();
    if (h && VAN_KINDS.indexOf(h.kind) >= 0) {
      var r = rk[h.kind], room = VAN_RACK_CAP - r.n; if (room <= 0) { toast('The van rack takes three ' + kindName(h.kind, 3) + ', and it has them', 'bad'); return; }
      var n = Math.min(room, h.n), q = h.qSum / h.n, thc = h.thcSum / h.n; r.n += n; r.qSum += q * n; r.thcSum += thc * n; if (h.strain) r.strain = h.strain; h.n -= n; h.qSum -= q * n; h.thcSum -= thc * n; if (h.n <= 0) S.held = null;
      syncVanRack(); sfx('pickup'); toast('🧺 ' + n + ' ' + kindName(h.kind, n) + ' on the van rack (' + r.n + ' of 3)', ''); hud(); save(); return;
    }
    if (h) { toast('Only joints, bags and cookies go on the van rack', 'bad'); return; }
    var k0 = VAN_KINDS.filter(function (k) { return rk[k].n > 0; })[0]; if (!k0) { toast('The van rack is empty. Bring joints, bags or cookies.', ''); return; }
    if (hotbarFull()) { toast('Your hands are full (G puts things down)', 'bad'); return; }
    var r0 = rk[k0]; take({ kind: k0, n: r0.n, qSum: r0.qSum, thcSum: r0.thcSum, strain: r0.strain }); r0.n = 0; r0.qSum = 0; r0.thcSum = 0; syncVanRack(); toast('Took the ' + kindName(k0, 2) + ' off the van rack', ''); hud(); save();
  }
  function vanRackText() { var rk = vanRack(); return VAN_KINDS.map(function (k) { return rk[k].n + ' ' + kindName(k, rk[k].n); }).join(' · '); }
  // ── the van as a shop: hatch up, counter out, sit at the window and passers-by come to buy ──
  var vanShop = { seat: { x: 0, z: 0, yaw: 0, eye: 1.0 }, buyers: [], nextT: 0, nextId: 1 };   /* on the van floor at 0.8, eyes at 1.8: above the counter and the sill, under the roof */
  function vanShopSet(open) {   /* Shift+E on the hatch: the whole shop up or packed away */
    if (drive.veh !== 'van') selectVehicle('van'); var v = vehState('van'); v.shopOpen = open;
    carPartSet('hatch', open, true); carPartSet('counter', open, true); if (open) { carPartSet('boot', true, true); carPartSet('rail', false, true); } else { if (player.inVan) { vanClimb(); } carPartSet('boot', false, true); carPartSet('rail', false, true); }
    var V = drive.vehicles && drive.vehicles.van; if (V && V.g.userData.openSign) V.g.userData.openSign.visible = open;
    sfx(open ? 'roller' : 'door'); toast(open ? '🪟 Shop van open: hatch up, counter out, tailgate up, rail latched. Stock the van rack and take the window.' : '🚐 Shop van closed and packed away', open ? 'good' : ''); save();
  }
  function vanClimb() {   /* E at the open tailgate: into the back, or out of it */
    if (drive.on) return; var s;
    if (player.inVan) { if (sit.on) standUp(); player.inVan = false; s = vanSide(0, 3.6); if (s) { player.pos.x = s.x; player.pos.z = s.z; } player.pos.y = 1.65; sfx('step', 'concrete'); toast('Climbed out of the van', ''); return; }
    if (sit.on) standUp(); player.inVan = true; s = vanSide(0.15, 1.7); if (s) { player.pos.x = s.x; player.pos.z = s.z; player.yaw = s.h - Math.PI / 2; } player.pos.y = 1.8; sfx('step', 'wood');
    toast('🚐 In the back. The van rack is on your left, the window on your right, the van till on the counter. E on the counter to serve, E at the tailgate to get out.', '');
  }
  function vanSide(lx, lz) { var g = drive.vehicles && drive.vehicles.van ? drive.vehicles.van.g : null; if (!g) return null; var h = g.rotation.y; return { x: g.position.x + lx * Math.cos(h) + lz * Math.sin(h), z: g.position.z - lx * Math.sin(h) + lz * Math.cos(h), h: h }; }
  function vanShopOpen() { return sit.on && sit.spot === vanShop.seat && drive.veh === 'van' && !!carState().open.hatch; }
  function vanServe() {
    if (drive.on) return; if (sit.on && sit.spot === vanShop.seat) { standUp(); return; }
    var s = vanSide(0.15, 0.85); if (!s) return; if (sit.on) standUp();
    vanShop.seat.x = s.x; vanShop.seat.z = s.z; vanShop.seat.yaw = s.h - Math.PI / 2; vanShop.nextT = now() + 4000; player.inVan = true;
    sitDown(vanShop.seat); toast('🪟 Open for business. They buy off the van rack (' + vanRackText() + '). E on whoever comes to the window, and move to get up.', '');
  }
  function vanBuyerLeave(b) { b.leaving = true; }
  function updateVanShop(dt) {
    var open = vanShopOpen(), t = now();
    if (open && vanShop.buyers.length < 2 && t > vanShop.nextT) {
      vanShop.nextT = t + randi(14000, 32000);
      var w = vanSide(2.2, 0.85), a = Math.random() * 6.283, tries = 0, sx, sz;
      do { sx = w.x + Math.cos(a) * randf(9, 14); sz = w.z + Math.sin(a) * randf(9, 14); a += 0.9; tries++; } while (carBlocked(sx, sz, 0.5) && tries < 8);
      if (tries < 8) {
        var hm = makeHuman({ skin: pick(SKINS), hair: pick(HAIRS), shirt: pick(SHIRTS), pants: pick(PANTS), hat: pick([null, 'cap', 'beanie']), longSleeve: Math.random() < 0.5 }); hm.position.set(sx, 0, sz); world.group.add(hm);
        var hb = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.9, 0.7), MAT.none); hb.position.y = 0.95; hm.add(hb); var id = vanShop.nextId++; interactable(hb, { kind: 'vanBuyer', buyer: id });
        var rk0 = vanRack(), stocked = VAN_KINDS.filter(function (k) { return rk0[k].n > 0; });
        vanShop.buyers.push({ id: id, h: hm, hb: hb, kind: stocked.length ? pick(stocked) : pick(VAN_KINDS), want: randi(1, 3), waitT: 45, leaving: false, arrived: false, dir: null });
      }
    }
    for (var i = vanShop.buyers.length - 1; i >= 0; i--) {
      var b = vanShop.buyers[i], g = b.h, w2 = vanSide(2.2, 0.85 + (i - 0.5) * 1.1) || { x: g.position.x, z: g.position.z };
      if (!open && !b.leaving) vanBuyerLeave(b);
      if (b.leaving) {
        if (!b.dir) { var dx = g.position.x - w2.x, dz = g.position.z - w2.z, L = Math.hypot(dx, dz) || 1; b.dir = { x: dx / L, z: dz / L }; b.goneT = 9; }
        g.position.x += b.dir.x * 1.3 * dt; g.position.z += b.dir.z * 1.3 * dt; g.rotation.y = Math.atan2(b.dir.x, b.dir.z); animateHuman(g, dt, 'walk', 1.3, null); b.goneT -= dt;
        if (b.goneT <= 0) { world.group.remove(g); disposeTree(g); var ii = world.interact.indexOf(b.hb); if (ii >= 0) world.interact.splice(ii, 1); vanShop.buyers.splice(i, 1); }
        continue;
      }
      var ddx = w2.x - g.position.x, ddz = w2.z - g.position.z, d = Math.hypot(ddx, ddz);
      if (d > 0.4) { g.position.x += ddx / d * 1.3 * dt; g.position.z += ddz / d * 1.3 * dt; g.rotation.y = Math.atan2(ddx, ddz); animateHuman(g, dt, 'walk', 1.3, null); }
      else { if (!b.arrived) { var fh = w2.h !== undefined ? w2.h : 0; g.rotation.y = Math.atan2(-Math.cos(fh), Math.sin(fh)); } b.arrived = true; animateHuman(g, dt, 'idle', 0, player.pos); b.waitT -= dt; if (b.waitT <= 0) { vanBuyerLeave(b); toast('🚶 "Too slow, mate." A buyer walked off.', ''); } }
    }
  }
  function vanSell(b) {
    if (!b.arrived) { toast('"Hang on, coming"', ''); return; }
    var rk = vanRack(), r = rk[b.kind]; if (!r || r.n <= 0) { toast('"No ' + kindName(b.kind, 2) + '? Forget it." You\'re sold out, so they walk.', 'bad'); vanBuyerLeave(b); return; }
    if (Math.random() < 0.05 + xs().heat / 400) { addHeat(20); var fine = Math.min(S.bank, 200); S.bank -= fine; S.rep = Math.max(0, S.rep - 2); r.n = 0; r.qSum = 0; r.thcSum = 0; syncVanRack(); vanBuyerLeave(b); sfx('siren'); toast('🚓 "Police. Hands where I can see them." That one was plain-clothes: ' + money(fine) + ' fine and the goods are gone (heat +20, rep -2)', 'bad'); logEvent('🚓 Busted selling from the van: ' + money(fine) + ' fine (heat +20, rep -2)', 'bad'); hud(); save(); return; }
    var n = Math.min(r.n, b.want), q = r.qSum / r.n, thc = r.thcSum / r.n, got = Math.round(unitPrice(b.kind, q, thc) * n * 1.5); r.n -= n; r.qSum -= q * n; r.thcSum -= thc * n; if (r.n <= 0) { r.qSum = 0; r.thcSum = 0; }
    S.pocket += got; vehState('van').sales += got; addHeat(5); S.stats.street = (S.stats.street || 0) + got; syncVanRack(); sfx('cash'); toast('🪟 Sold ' + n + ' ' + kindName(b.kind, n) + ' from the van rack for ' + money(got) + ' cash, half again the shop price (heat +5)', 'good'); vanBuyerLeave(b); hud(); save();
  }
  function cityPrompt(d, h) {
    /* a prompt only reads: the vehicle looked at is described from its own state, and it becomes the one in hand only when E is pressed on it */
    var vid = d.veh || drive.veh || 'car';
    if (d.kind === 'car') return drive.on ? '' : 'Your ' + (vid === 'van' ? 'van' : 'car') + ' <small>E to drive · Shift+E for the boot and upgrades</small>';
    if (d.kind === 'carPart') {
      if (drive.on) return ''; var vs = vehState(vid), o = vs.open, shut = !o[d.part];
      if (d.part === 'doorL') return 'Get in behind the wheel <small>' + (vs.brake ? 'handbrake on' : 'handbrake off') + ' · Shift+E for the boot and upgrades</small>';
      if (d.part === 'boot' && vid === 'van' && !shut) return player.inVan ? 'Climb out of the back <small>Shift+E closes the tailgate</small>' : 'Climb into the back <small>' + trunkCount(vid) + ' of ' + trunkCap(vid) + ' in the back · Shift+E closes the tailgate</small>';
      if (d.part === 'boot') return (shut ? 'Open the boot' : 'Close the boot') + ' <small>' + trunkCount(vid) + ' of ' + trunkCap(vid) + ' inside · Shift+E to load or unload</small>';
      if (d.part === 'bonnet') return (shut ? 'Open the bonnet' : 'Close the bonnet') + ' <small>a look at the engine</small>';
      if (d.part === 'hatch') return (shut ? 'Lift the serving hatch' : 'Close the serving hatch') + ' <small>Shift+E ' + (vehState('van').shopOpen ? 'closes' : 'opens') + ' the whole shop van</small>';
      if (d.part === 'rail') return !o.boot ? 'Open the tailgate <small>the rail is behind it</small>' : (shut ? 'Unlatch the rail <small>to climb in or out</small>' : 'Latch the rail <small>leave the tailgate up, nothing falls out</small>');
      if (d.part === 'counter') return shut ? 'Fold out the counter <small>under the serving hatch</small>' : o.hatch ? (sit.on && sit.spot === vanShop.seat ? 'Get up from the window' : 'Take the window <small>sell to passers-by from the van</small>') : 'Fold the counter away <small>lift the hatch to sell</small>';
      return (shut ? 'Open' : 'Close') + ' the passenger door <small>Shift+E for the boot and upgrades</small>';
    }
    if (d.kind === 'cityDoor') { var p = CITY.pois.filter(function (x) { return x.id === d.poi; })[0]; return (p ? p.name : 'Shop') + ' <small>E to go to the counter</small>'; }
    if (d.kind === 'vanBuyer') { var vb0 = vanShop.buyers.filter(function (x) { return x.id === d.buyer; })[0]; var rk1 = vanRack(); return vb0 ? 'Serve them <small>wants ' + vb0.want + ' ' + kindName(vb0.kind, vb0.want) + ' · van rack has ' + rk1[vb0.kind].n + ' · half again the shop price, cash</small>' : 'A customer at the window'; }
    if (d.kind === 'vanRack') return h && VAN_KINDS.indexOf(h.kind) >= 0 ? 'Stock the van rack <small>' + vanRackText() + ' · three of each</small>' : 'Van rack <small>' + vanRackText() + (h ? '' : ' · E takes a kind back') + '</small>';
    if (d.kind === 'vanRegister') return 'Van till <small>takings ' + money(vehState('van').sales || 0) + ' · ' + vanRackText() + '</small>';
    if (d.kind === 'parkDeal') return h && (h.kind === 'joints' || h.kind === 'bags' || h.kind === 'cookies') ? 'Offer a street deal <small>35% over shop price, cash in pocket · there\'s a risk</small>' : 'Someone enjoying the park <small>bring goods in your hands to deal</small>';
    return '';
  }
  function cityInteract(d, h) {
    if ((d.kind === 'car' || d.kind === 'carPart') && !drive.on && d.veh && d.veh !== drive.veh) selectVehicle(d.veh);
    if (d.kind === 'car') { if (player.keys.ShiftLeft || player.keys.ShiftRight) carMenu(); else enterCar(); return true; }
    if (d.kind === 'carPart') { if ((player.keys.ShiftLeft || player.keys.ShiftRight) && d.part === 'hatch' && drive.veh === 'van') vanShopSet(!vehState('van').shopOpen); else if ((player.keys.ShiftLeft || player.keys.ShiftRight) && d.part === 'boot' && drive.veh === 'van' && carState().open.boot) carPartToggle('boot'); else if (player.keys.ShiftLeft || player.keys.ShiftRight) carMenu(); else if (d.part === 'rail') carPartToggle(carState().open.boot ? 'rail' : 'boot'); else if (d.part === 'boot' && drive.veh === 'van' && carState().open.boot) vanClimb(); else if (d.part === 'doorL') enterCar(); else if (d.part === 'counter' && carState().open.counter && carState().open.hatch) vanServe(); else carPartToggle(d.part); return true; }
    if (d.kind === 'cityDoor') { if (ZONES[d.poi]) enterZone(d.poi); else if (!expPoiMenu(d.poi)) cityPoiMenu(d.poi); return true; }
    if (d.kind === 'vanBuyer') { var vb = vanShop.buyers.filter(function (x) { return x.id === d.buyer; })[0]; if (vb) vanSell(vb); return true; }
    if (d.kind === 'vanRack') { vanRackStock(); return true; }
    if (d.kind === 'vanRegister') { toast('🧾 Van takings ' + money(vehState('van').sales || 0) + ' · on the rack: ' + vanRackText(), ''); return true; }
    if (d.kind === 'parkDeal') { parkDeal(d.idx); return true; }
    return false;
  }
