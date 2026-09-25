//@ delivery rounds: the burner and the tablet
  // ── Delivery rounds: a burner phone for the street goods, a tablet for the RF Smoking round ──
  // Both write into one X.jobs list; `via` says which device raised it, and that decides where the
  // goods come from (your hands vs the car) and where the money lands (pocket + heat vs the bank).
  var JOB_MAX = 7, JOB_CAP = { phone: 2, tablet: 4, branch: 1 };   /* the branch drop is a standing stop while you own Green Leaf: one beacon more than the two devices can fill */
  var BRANCH_PAY = 9, BRANCH_CAP = 60;   // what Green Leaf pays next morning for each unit you drop off, and how many it can sell in a day
  var ROADS = [['Main Street', 'z', CITY.mainZ], ['Back Street', 'z', CITY.backZ], ['North Street', 'z', CITY.northZ], ['West Avenue', 'x', CITY.westX], ['East Avenue', 'x', CITY.eastX]];
  function addrFor(b) {   // the nearest road names the address; the door number is derived from the building so it never changes
    var best = ROADS[0], bd = 1e9;
    ROADS.forEach(function (r) { var d = Math.abs((r[1] === 'z' ? b.z : b.x) - r[2]); if (d < bd) { bd = d; best = r; } });
    var n = Math.abs(Math.round(best[1] === 'z' ? b.x : b.z)); return (n < 2 ? 2 : n) + ' ' + best[0];
  }
  // a doorway on whichever face of the building can actually be stood on: the north row's front doors fall
  // outside the world clamp, and a drop you cannot walk to just expires and costs a point of reputation
  function dropSpot(b) {
    var M = 2.4, cands = [[b.x, b.z + b.d / 2 + 1.6], [b.x, b.z - b.d / 2 - 1.6], [b.x + b.w / 2 + 1.6, b.z], [b.x - b.w / 2 - 1.6, b.z]];
    for (var i = 0; i < cands.length; i++) {
      var x = cands[i][0], z = cands[i][1];
      if (Math.abs(x) > CITY.x - M || z < CITY.z1 + M || z > CITY.z2 - M) continue;
      var hit = false;
      for (var k = 0; k < world.obstacles.length; k++) { var o = world.obstacles[k]; if ((o.floorLevel || 0) !== 0 && o.floorLevel !== 'any') continue; var px = clamp(x, o.x1, o.x2), pz = clamp(z, o.z1, o.z2); if ((x - px) * (x - px) + (z - pz) * (z - pz) < 1.6) { hit = true; break; } }
      if (!hit) return { x: x, z: z };
    }
    return null;
  }
  function jobsOf(via) { return xs().jobs.filter(function (j) { return j.via === via; }); }
  function jobGoods(j) { return j.via === 'branch' ? 'goods for the branch' : j.via === 'tablet' ? CIG_SKUS[j.sku].name : kindName(j.kind, j.qty); }
  function branchRoom() { return Math.max(0, BRANCH_CAP - (xs().branchUnits || 0)); }
  function branchJob() {   // the standing drop outside Green Leaf, clear of its front door so the counter stays reachable
    var X = xs(); if (!X.branch) return; var j = jobsOf('branch')[0];
    if (!j) { if (X.jobs.length >= JOB_MAX) return; var b = CITY.blds.filter(function (o) { return o.poi === 'rival'; })[0]; if (!b) return; var sp = { x: b.x + b.w / 2 - 2.5, z: b.z + b.d / 2 + 1.8 };
      if (world.obstacles.some(function (o) { return ((o.floorLevel || 0) === 0 || o.floorLevel === 'any') && sp.x > o.x1 - 1.2 && sp.x < o.x2 + 1.2 && sp.z > o.z1 - 1.2 && sp.z < o.z2 + 1.2; })) sp = dropSpot(b) || sp;
      j = { id: 'jbranch', via: 'branch', addr: 'Green Leaf (your branch)', x: sp.x, z: sp.z, born: now(), until: 0 }; X.jobs.push(j); }
    j.qty = branchRoom();
  }
  function jobSpawn(via) {
    var X = xs(), bl = CITY.blds.filter(function (b) { return !b.poi; }); if (!bl.length) return;
    if (X.jobs.length >= JOB_MAX || jobsOf(via).length >= JOB_CAP[via]) return;   /* the caps are the invariant, not the spawn timer: a job past the beacon pool would have no marker and no drop to press E on */
    var used = X.jobs.map(function (j) { return j.addr; }), b = null, spot = null, addr = '';
    for (var t = 0; t < 30 && !spot; t++) { var cand = pick(bl), ca = addrFor(cand); if (used.indexOf(ca) >= 0) continue; var s = dropSpot(cand); if (s) { b = cand; spot = s; addr = ca; } }
    if (!spot) return;
    var j = { id: 'j' + Math.random().toString(36).slice(2, 8), via: via, addr: addr, x: spot.x, z: spot.z, born: now() };
    if (via === 'tablet') {
      j.sku = pick(CIG_KEYS); j.qty = randi(4, 12);
      var far = Math.hypot(b.x, b.z) / 40;   /* the far side of town pays a little more for the drive */
      j.pay = Math.round(j.qty * CIG_SKUS[j.sku].price * (1.15 + far * 0.12)); j.until = now() + randi(420, 760) * 1000;
      sfx('chime'); toast('📋 New round job: ' + j.qty + ' × ' + CIG_SKUS[j.sku].name + ' to ' + addr + ' for ' + money(j.pay) + '. J opens the tablet.', 'rare');
      logEvent('📋 RF Smoking order: ' + j.qty + ' × ' + CIG_SKUS[j.sku].name + ' to ' + addr, '');
    } else {
      var kinds = ['joints', 'bags', 'cookies'].filter(function (k) { return S.pkg[k] && S.pkg[k].n >= 2; }); if (!kinds.length) return;
      j.kind = pick(kinds); j.qty = randi(2, 4); j.until = now() + 300000;
      sfx('bell'); toast('📱 Burner: ' + j.qty + ' ' + kindName(j.kind, j.qty) + ' to ' + addr + '. 5 min, cash in hand. J opens it.', 'rare');
      logEvent('📱 Phone order: ' + j.qty + ' ' + kindName(j.kind, j.qty) + ' to ' + addr, '');
    }
    X.jobs.push(j); if (ui.panelOpen && ui.panelKind === 'jobs') ui.render();
  }
  function jobDone(j, pay, how) {
    var X = xs(); X.jobs = X.jobs.filter(function (o) { return o !== j; });
    S.stats.deliveries = (S.stats.deliveries || 0) + 1;
    if (j.via === 'tablet') { S.bank += pay; bookSale(pay); S.rep += 1; S.stats.roundPay = (S.stats.roundPay || 0) + pay; toast('📋 Dropped at ' + j.addr + ': ' + money(pay) + ' invoiced to the bank (rep +1)' + how, 'good'); logEvent('📋 Round drop at ' + j.addr + ': ' + money(pay), 'good'); }
    else { S.pocket += pay; S.rep += 2; addHeat(6); toast('📱 Dropped at ' + j.addr + ': ' + money(pay) + ' cash in your pocket (rep +2, heat +6)' + how, 'good'); logEvent('📱 Phone delivery at ' + j.addr + ': ' + money(pay), 'good'); }
    sfx('cash'); hud(); save(); if (ui.panelOpen && ui.panelKind === 'jobs') ui.render();
  }
  function updateJobs(dt) {
    var X = xs(); if (!exp.beacons) return;
    syncTabletDock();
    if (!Array.isArray(X.jobs)) X.jobs = [];
    if (X.delivery) { var od = X.delivery; X.delivery = null; if (X.jobs.length < JOB_MAX) X.jobs.push({ id: 'jold', via: 'phone', kind: od.kind, qty: od.qty, x: od.x, z: od.z, addr: 'across town', born: od.born, until: od.until }); }   /* a save from before the two devices keeps its open order */
    if (shop().open) {
      X.jobT.ph -= dt; if (X.jobT.ph <= 0) { X.jobT.ph = randi(200, 330); jobSpawn('phone'); }
      if (hasLic('tobacco')) { X.jobT.tab -= dt; if (X.jobT.tab <= 0) { X.jobT.tab = randi(120, 220); jobSpawn('tablet'); } }
    }
    branchJob();
    for (var i = X.jobs.length - 1; i >= 0; i--) {
      var j = X.jobs[i];
      if (j.via === 'branch') continue;   /* the branch drop never expires and the driver leaves it to you */
      if (X.staff.driver && now() - j.born > 45000) { if (driverRuns(j)) continue; }
      if (now() > j.until) { X.jobs.splice(i, 1); S.rep = Math.max(0, S.rep - 1); toast((j.via === 'tablet' ? '📋 ' : '📱 ') + j.addr + ' gave up waiting (rep -1)', 'bad'); if (ui.panelOpen && ui.panelKind === 'jobs') ui.render(); }
    }
    for (var b = 0; b < exp.beacons.length; b++) {
      var jb = X.jobs[b];
      if (jb) { var col = jb.via === 'branch' ? 0x7fd4ff : jb.via === 'tablet' ? 0xffc857 : 0x6fdc8c; exp.beacons[b].visible = true; exp.beacons[b].material.color.setHex(col); exp.beacons[b].position.set(jb.x, 7, jb.z); exp.rings[b].visible = true; exp.rings[b].material.color.setHex(col); exp.rings[b].position.set(jb.x, 0.07, jb.z); exp.dropHits[b].position.set(jb.x, 1.2, jb.z); }
      else { exp.beacons[b].visible = false; exp.rings[b].visible = false; exp.dropHits[b].position.y = -50; }
    }
  }
  function driverRuns(j) {   // the hired driver clears jobs himself, for a thinner cut
    var X = xs();
    if (j.via === 'tablet') { var T = tob(), cc = carState().cigs, have = T.packs[j.sku] + (cc[j.sku] || 0); if (have < j.qty) return false; var fromCar = Math.min(cc[j.sku] || 0, j.qty); if (fromCar > 0) cc[j.sku] -= fromCar; T.packs[j.sku] -= (j.qty - fromCar); syncTobRack();   /* never touch a key that is not there: undefined -= 0 is NaN, and a NaN pack count poisons the trunk and the wholesale counter */ X.jobs = X.jobs.filter(function (o) { return o !== j; }); var p = Math.round(j.pay * 0.65); S.bank += p; bookSale(p); S.stats.deliveries = (S.stats.deliveries || 0) + 1; toast('🚚 Your driver ran the drop at ' + j.addr + ': ' + money(p) + ' banked after his cut', 'good'); hud(); save(); if (ui.panelOpen && ui.panelKind === 'jobs') ui.render(); return true; }
    var got = 0, val = 0; Object.keys(S.lots[j.kind]).forEach(function (sid) { if (got >= j.qty) return; var l = S.lots[j.kind][sid]; if (l.n <= 0) return; var dd = lotDraw(j.kind, sid, j.qty - got); got += dd.n; val += unitPrice(j.kind, dd.q, dd.thc) * dd.n; });
    if (got <= 0) return false;
    X.jobs = X.jobs.filter(function (o) { return o !== j; }); var pay = Math.round(val * 1.25); S.bank += pay; bookSale(pay); S.rep += 1; S.stats.deliveries = (S.stats.deliveries || 0) + 1; syncGoods();
    toast('🚚 Your driver ran the drop at ' + j.addr + ': ' + money(pay) + ' banked', 'good'); hud(); save(); if (ui.panelOpen && ui.panelKind === 'jobs') ui.render(); return true;
  }
  // the round is a driving loop, so a drop you have pulled up at is reachable without getting out
  function jobAtCar() {
    if (!drive.on || Math.abs(drive.v) > 1.5) return -1;
    var X = xs(), best = -1, bd = 7;
    X.jobs.forEach(function (j, i) { var d = Math.hypot(j.x - drive.g.position.x, j.z - drive.g.position.z); if (d < bd) { bd = d; best = i; } });
    return best;
  }
  function jobHandOver(idx) {
    var X = xs(), j = X.jobs[idx], h = held(); if (!j) return true;
    if (j.via === 'branch') {   // stock for Green Leaf: whatever goods are in your hands, up to what it can sell today
      var room = branchRoom(); if (room <= 0) { toast('🏪 Green Leaf has all it can sell today (' + BRANCH_CAP + ' units). Bring more tomorrow.', ''); return true; }
      if (!isGoods(h)) { toast('🏪 Bring bags, joints or cookies in your hands for the branch shelves', 'bad'); return true; }
      var bn = Math.min(h.n, room), bq = h.qSum / h.n, bt = h.thcSum / h.n, bk = h.kind;
      h.n -= bn; h.qSum -= bq * bn; h.thcSum -= bt * bn; if (h.n <= 0) S.held = null;
      X.branchUnits = (X.branchUnits || 0) + bn; j.qty = branchRoom(); S.stats.branchUnits = (S.stats.branchUnits || 0) + bn;
      sfx('crate'); toast('🏪 ' + bn + ' ' + kindName(bk, bn) + ' on the Green Leaf shelves, ' + money(bn * BRANCH_PAY) + ' in the morning (' + X.branchUnits + ' of ' + BRANCH_CAP + ' today)', 'good');
      logEvent('🏪 Stocked Green Leaf with ' + bn + ' ' + kindName(bk, bn), ''); world.dirty = true; hud(); save(); if (ui.panelOpen && ui.panelKind === 'jobs') ui.render();
      return true;
    }
    if (j.via === 'tablet') {
      var near = drive.on || carNear(player.pos.x, player.pos.z, 11), cc = carState().cigs, inCar = near ? (cc[j.sku] || 0) : 0, inHand = (h && h.kind === 'cigs' && h.sku === j.sku) ? h.n : 0;
      if (inCar + inHand < j.qty) { toast('They ordered ' + j.qty + ' × ' + CIG_SKUS[j.sku].name + (near ? ', and you\'ve only ' + (inCar + inHand) + ' between the boot and your hands' : '. Bring the car round, or carry them in.') , 'bad'); return true; }
      var fromCar = Math.min(inCar, j.qty); if (fromCar > 0) cc[j.sku] -= fromCar;
      var rest = j.qty - fromCar; if (rest > 0) { h.n -= rest; if (h.n <= 0) S.held = null; }
      jobDone(j, j.pay, fromCar > 0 ? (rest > 0 ? '. Out of the boot and your hands.' : '. Straight out of the boot.') : '');
      return true;
    }
    if (!h || h.kind !== j.kind || h.n < j.qty) { toast('They ordered ' + j.qty + ' ' + kindName(j.kind, j.qty) + '. Bring them in your hands.', 'bad'); return true; }
    var q = h.qSum / h.n, t = h.thcSum / h.n, pay = Math.round(unitPrice(j.kind, q, t) * j.qty * 1.6);
    h.n -= j.qty; h.qSum -= q * j.qty; h.thcSum -= t * j.qty; if (h.n <= 0) S.held = null;
    jobDone(j, pay, ''); return true;
  }
  // the tablet itself: it lives on its dock in the office, rides in the car once you take it out there
  function tabletHas() { for (var i = 0; i < 6; i++) if (S.hotbar[i] && S.hotbar[i].kind === 'tablet') return true; return false; }
  function tabletHere() { var X = xs(); if (!hasLic('tobacco')) return false; if (X.tablet === 'car') return drive.on || carNear(player.pos.x, player.pos.z, 11); return X.tablet === 'hand' && tabletHas(); }
  function tabletBody() { if (exp.tabBody && exp.tabBody.parent) return exp.tabBody; var inst = propInst['tabletDock']; if (!inst) return null; inst.g.traverse(function (o) { if (o.userData && o.userData.tabletBody) exp.tabBody = o; }); return exp.tabBody || null; }
  function syncTabletDock() {
    var X = xs(); if (X.tablet === 'hand' && !tabletHas()) X.tablet = 'dock';   /* put down or lost: the dock gets it back */
    var b = tabletBody(); if (!b) return;
    if (b.userData.builtLit !== hasLic('tobacco')) { exp.tabBody = null; buildProp('tabletDock'); return; }   /* the screen wakes up when the licence lands */
    b.visible = X.tablet === 'dock';
  }
  function tabletTake() {
    var X = xs(); if (X.tablet === 'hand') { X.tablet = 'dock'; toast('📋 Tablet back on its dock', ''); sfx('putdown'); save(); return; }
    if (X.tablet === 'car') { X.tablet = 'dock'; toast('📋 Took the tablet out of the car and docked it', ''); sfx('putdown'); save(); return; }
    if (!take({ kind: 'tablet' })) return; X.tablet = 'hand'; X.seenTablet = true; toast('📋 Delivery tablet in hand. J opens the round, and it slots into the dash cradle once you\'re at the wheel.', 'good'); save();
  }
  function tabletStow() {   // carrying it into the car drops it in the dash cradle, so it rides the round without eating a slot
    var X = xs(); if (X.tablet !== 'hand') return;
    for (var i = 0; i < 6; i++) if (S.hotbar[i] && S.hotbar[i].kind === 'tablet') S.hotbar[i] = null;
    X.tablet = 'car'; toast('📋 Tablet in the cradle. J brings up the round.', ''); sfx('click'); hud();
  }
  function jobsPanel() { if (ui.blocked() && !(dev.open)) return; if (dev.open) { deviceClose(); return; } if (hasLic('tobacco') && tabletHere()) deviceOpen('tablet'); else deviceOpen('phone', 'burner'); }
  function paneJobs(tab) {
    var X = xs(), list = jobsOf(tab), rows = [], pos = drive.on ? drive.g.position : player.pos, bj = jobsOf('branch')[0];
    var br = bj ? '<p class="g3-sub2">🏪 <b>Green Leaf, your branch</b> (#' + (X.jobs.indexOf(bj) + 1) + ' on the map, ' + Math.round(Math.hypot(bj.x - pos.x, bj.z - pos.z)) + ' m away): carry bags, joints or cookies to the blue beacon out front and press <b>E</b>. It pays ' + money(BRANCH_PAY) + ' a unit each morning for up to ' + BRANCH_CAP + ' a day (' + (X.branchUnits || 0) + ' dropped off today).</p>' : '';
    if (tab === 'tablet' && !hasLic('tobacco')) return br + '<p class="g3-empty">The RF Smoking round needs the tobacco licence. Buy it at the office PC, and the tablet on the office dock wakes up.</p>';
    if (tab === 'tablet' && !tabletHere()) return br + '<p class="g3-empty">The tablet is ' + (X.tablet === 'car' ? 'in the car, and the car isn\'t here' : 'on its dock in the office') + '. Fetch it, and it rides in the car once you drive off with it.</p>';
    if (!list.length) return br + '<p class="g3-empty">' + (tab === 'tablet' ? 'No round jobs right now. They come in while the shop is open, once the basement is making packs.' : 'Nobody is ringing. Pack some joints or bags and the phone starts going.') + '</p>';
    list.forEach(function (j) {
      var n = X.jobs.indexOf(j) + 1, left = Math.max(0, Math.round((j.until - now()) / 1000)), km = Math.round(Math.hypot(j.x - pos.x, j.z - pos.z)) + ' m';
      var have = j.via === 'tablet' ? ((carState().cigs[j.sku] || 0) + ' in the car · ' + tob().packs[j.sku] + ' on the rack') : (S.pkg[j.kind].n + ' packed');
      rows.push('<tr><td><b>#' + n + '</b></td><td><b>' + j.addr + '</b><br><small>' + km + ' away · ' + have + '</small></td>' +
        '<td>' + j.qty + ' × ' + jobGoods(j) + '</td>' +
        '<td class="' + (left < 60 ? 'bad' : '') + '">' + Math.floor(left / 60) + ' min ' + (left % 60) + ' s</td>' +
        '<td><b>' + (j.via === 'tablet' ? money(j.pay) : '~' + money(Math.round(unitPrice(j.kind, 60, 1.2) * j.qty * 1.6))) + '</b><br><small>' + (j.via === 'tablet' ? 'to the bank' : 'cash, +heat') + '</small></td></tr>');
    });
    return br + '<p class="g3-sub2">' + (tab === 'tablet' ? 'Load packs into the car or the van at home (Shift+E on it), drive the round, and press <b>E</b> at each beacon. Numbers match the map on <b>M</b>.' : 'Carry the goods in your hands and press <b>E</b> at the beacon. Cash goes in your pocket and it raises your heat.') + '</p>' +
      '<table class="g3-jobs"><tr><th></th><th>Address</th><th>Order</th><th>Left</th><th>Pays</th></tr>' + rows.join('') + '</table>';
  }
  function startGetaway(r) {
    if (exp.getaway) { world.group.remove(exp.getaway.g); disposeTree(exp.getaway.g); } var g = new THREE.Group(); carBody(g, 0x111111); var dir = r.g.position.x > 0 ? 1 : -1; g.position.set(r.g.position.x, 0, CITY.mainZ + (dir > 0 ? 2.7 : -0.3)); g.rotation.y = dir > 0 ? -Math.PI / 2 : Math.PI / 2; world.group.add(g);
    exp.getaway = { g: g, dir: dir, t: 0, loot: { grabbed: r.grabbed, goods: r.goods, disp: r.disp, cigs: r.cigs || {} } }; r.grabbed = 0; r.goods = []; r.disp = {}; r.cigs = {}; toast('🚗 They jumped into a black car heading ' + (dir > 0 ? 'east' : 'west') + ' on Main Street. Catch it with yours and you get it all back.', 'bad');
  }
  function expansionNewDay(offline) {
    var X = xs(), wages = (X.staff.driver ? 90 : 0) + (X.staff.operator ? 80 : 0) + (X.staff.night ? 70 : 0); if (wages) { var wPaid = drawFunds(wages); if (wages - wPaid > 0.5) books().arrears += wages - wPaid; if (!offline) logEvent('💼 Extra staff wages: ' + money(wages), ''); }
    if (X.staff.driver) { var T = tob(), val = 0, n = 0; CIG_KEYS.forEach(function (k) { var sell = Math.max(0, T.packs[k] - COST.driverKeep); n += sell; val += sell * CIG_SKUS[k].price * 0.55; T.packs[k] -= sell; });   /* he leaves a few of each kind on the rack so the round jobs can still be filled */ if (n) { S.bank += Math.round(val); bookSale(Math.round(val)); syncTobRack(); if (!offline) { logEvent('🚚 Your driver sold ' + n + ' packs wholesale for ' + money(Math.round(val)), 'good'); toast('🚚 Driver: ' + n + ' packs wholesaled · ' + money(Math.round(val)), 'good'); } } }
    if (X.branch) { var bu = Math.min(BRANCH_CAP, X.branchUnits || 0), inc = Math.round(bu * BRANCH_PAY + Math.max(0, S.rep) * 2); X.branchUnits = 0; S.bank += inc; bookSale(inc); logEvent('🏪 Green Leaf (your branch) sent over ' + money(inc) + ': ' + bu + ' units you dropped off at ' + money(BRANCH_PAY) + ' each, plus ' + money(Math.max(0, S.rep) * 2) + ' on your name', inc > 0 ? 'good' : ''); if (!offline) toast('🏪 Branch takings: ' + money(inc) + (bu ? '' : ' (nothing dropped off yesterday, stock it at the blue beacon)'), bu ? 'good' : ''); }
    if (!offline && weekend()) toast('📅 It\'s the weekend. Expect more people through the door.', ''); if (!offline && (S.day % 28) === 25) toast('🎉 Holiday week starts. Footfall is up by half.', 'rare');
  }
  function carMenu() {
    var X = xs(), T = tob(), inBay = carNear(7.7, -15.3, 6), lines = [], packs = CIG_KEYS.reduce(function (a, k) { return a + T.packs[k]; }, 0), cc = carState().cigs, loaded = Object.keys(cc).reduce(function (a, k) { return a + cc[k]; }, 0);
    lines.push({ label: '📦 Unload supplies into the back room <small>' + trunkCount() + ' of ' + trunkCap() + ' items in the boot</small>', cls: inBay && trunkCount() ? '' : 'muted', act: inBay && trunkCount() ? unloadTrunk : null });
    lines.push({ label: '🚬 Load every finished carton from the basement rack <small>' + packs + ' packs on the rack · ' + loaded + ' already in the ' + vehName() + '</small>', cls: inBay && packs ? '' : 'muted', act: inBay && packs ? function () { CIG_KEYS.forEach(function (k) { cc[k] = (cc[k] || 0) + T.packs[k]; T.packs[k] = 0; }); syncTobRack(); carPopBoot(); sfx('crate'); toast('🚬 ' + packs + ' packs in the ' + vehName() + '. The Corner Tobacconist buys wholesale.', 'good'); save(); } : null });
    lines.push({ label: (carState().open.boot ? '🔒 Close the boot' : '🔓 Open the boot') + ' <small>or E on the boot itself</small>', act: function () { carPartToggle('boot'); } });
    lines.push({ label: (carState().brake ? '🅿️ Release the handbrake' : '🅿️ Put the handbrake on') + ' <small>' + (carInBay() ? 'parked square at home' : 'parked away from home') + '</small>', act: function () { parkBrake(); } });
    [['trunk', '🧰 Bigger boot', 800, 'holds 120 items, up from 40'], ['engine', '🏎️ Tuned engine', 1200, 'a third more top speed'], ['bar', '🛡️ Bull bar', 700, 'stops a getaway car from further off']].forEach(function (u) { var own = X.garage[u[0]]; lines.push({ label: u[1] + ' · ' + money(u[2]) + ' <small>' + (own ? 'fitted' : u[3]) + '</small>', cls: own || !inBay || S.bank < u[2] ? 'muted' : '', act: own || !inBay || S.bank < u[2] ? null : function () { S.bank -= u[2]; X.garage[u[0]] = true; sfx('cash'); toast(u[1] + ' fitted', 'good'); hud(); save(); } }); });
    ctxOpen((drive.veh === 'van' ? '🚐 Your van' : '🚗 Your car') + (inBay ? ' · at home' : ''), inBay ? 'upgrades and loading happen here, at home' : 'park at home, behind the yard gate, to load, unload or fit upgrades', lines);
  }
  function labMenu() {
    var X = xs(), lines = [], out = X.lab.out; if (X.lab.job) lines.push({ label: '⏳ Running: ' + X.lab.job.n + ' × ' + CIG_SKUS[X.lab.job.sku].name + ' · ' + Math.ceil(X.lab.job.dur - X.lab.job.t) + ' s left' + (powerOn() ? '' : ' · PAUSED, no power'), cls: 'muted' });
    var strains = Object.keys(S.stash).filter(function (k) { return S.stash[k].g >= 5; }); if (!strains.length) lines.push({ label: 'Nothing to run. Bring at least 5 g of cured bud in the stash. Quality doesn\'t matter here: this is what low-grade harvests are for.', cls: 'muted' });
    strains.slice(0, 2).forEach(function (sid) { var nm = strainById(sid).name, g = S.stash[sid].g; function job(sku, grams, n, dur, needMix) { var ok = !X.lab.job && g >= grams && (!needMix || (S.supplies.mix || 0) > 0); lines.push({ label: '🧪 ' + grams + ' g of ' + nm + ' → ' + n + ' × ' + CIG_SKUS[sku].name + ' <small>' + dur + ' s' + (needMix ? ' · uses 1 baking mix (' + (S.supplies.mix || 0) + ')' : '') + ' · sells at ' + money(CIG_SKUS[sku].price) + '</small>', cls: ok ? '' : 'muted', act: ok ? function () { stashDraw(sid, grams); if (needMix) S.supplies.mix--; X.lab.job = { sku: sku, n: n, t: 0, dur: dur }; sfx('click'); toast('🧪 Batch started', ''); save(); } : null }); } job('cart', 10, 3, 45, false); job('hash', 10, 4, 35, false); job('gummy', 5, 12, 40, true); job('choc', 5, 8, 40, true); });
    Object.keys(out).forEach(function (k) { if (out[k] > 0) lines.push({ label: '📦 Take ' + Math.min(12, out[k]) + ' × ' + CIG_SKUS[k].name + ' <small>' + out[k] + ' on the shelf · they sell from the cigarette cabinet</small>', act: function () { if (hotbarFull()) { toast('Your hands are full (G puts things down)', 'bad'); return; } var n = Math.min(12, out[k]); out[k] -= n; take({ kind: 'cigs', sku: k, n: n }); save(); } }); });
    ctxOpen('🧪 Extraction lab', 'carts, gummies and chocolate from bud of any quality', lines);
  }
  function rosterMenu() {
    var X = xs(), lines = []; [['driver', '🚚 Driver', 90, 'wholesales every pack above ' + COST.driverKeep + ' of each kind each morning (55%), and runs phone deliveries for you · counts as staff on the payroll'], ['operator', '🏭 Basement operator', 80, 'sows and cuts the bays, keeps the machines on, reorders materials · covers the two staff the basement needs'], ['night', '🌙 Night guard', 70, 'nobody breaks into the basement or strips the roof beds · counts as staff on the payroll']].forEach(function (s) { var on = X.staff[s[0]]; lines.push({ label: s[1] + ' · ' + money(s[2]) + ' a day <small>' + s[3] + '</small>', cls: on ? 'on' : '', act: function () { X.staff[s[0]] = !on; sfx('click'); toast(s[1] + (on ? ' let go' : ' hired'), on ? '' : 'good'); save(); } }); });
    ctxOpen('💼 Staff roster', 'wages come out at the start of each day', lines);
  }
  function wsPlaceMenu(poi) {   // the generic counter behind a pack place: a discount shop list, a paid service, or both
    var q = null; WSPLACES.forEach(function (p) { if (p.id === poi) q = p; }); if (!q) return false;
    var X = xs(), lines = [];
    (q.sells || []).forEach(function (r) {
      var it = supplyById(r.item); if (!it) return;
      var price = Math.max(1, Math.round(it.price * (1 - r.off)));
      lines.push({ label: it.ico + ' ' + it.name + ' · ' + money(price) + ' <small>' + Math.round(r.off * 100) + '% under the office PC price' + (it.qty ? ' · ' + it.qty + ' per box' : '') + '</small>', cls: S.bank >= price ? '' : 'muted',
        act: S.bank >= price ? function () { S.bank -= price; if (it.stock) { var crate = {}; crate[it.id] = it.qty || 1; storageAdd(crate); syncStorage(); toast('🛒 ' + it.name + ' · ' + money(price) + ' (a crate in the back room, carry it to the ' + (it.stock === 'vend' ? 'vending machine' : it.stock === 'coffee' ? 'coffee machine' : 'counter display') + ')', 'good'); } else { S.supplies[it.id] = (S.supplies[it.id] || 0) + (it.qty || 1); toast('🛒 ' + it.name + ' · ' + money(price), 'good'); syncRack(); } sfx('cash'); hud(); save(); } : null });   /* machine and counter stock arrives as crates like a laptop order; rack supplies go straight on the rack */
    });
    if (q.service) {
      var sv = q.service, day = S.day || 1, usedToday = sv.daily && X.svcDay && X.svcDay[q.id] === day;
      var can = !usedToday && S.bank >= sv.cost;
      lines.push({ label: sv.label + ' · ' + money(sv.cost) + ' <small>' + (usedToday ? 'you have already been today' : sv.note) + '</small>', cls: can ? '' : 'muted',
        act: can ? function () { S.bank -= sv.cost; if (sv.heat) addHeat(sv.heat); if (sv.rep) S.rep = Math.max(0, S.rep + sv.rep); if (!X.svcDay) X.svcDay = {}; X.svcDay[q.id] = day; sfx('cash');
          toast('🎟️ ' + q.name + (sv.heat < 0 ? ' · heat down to ' + Math.round(X.heat) : '') + (sv.rep ? ' · rep +' + sv.rep : ''), 'good'); logEvent('🎟️ A few hours at ' + q.name, ''); hud(); save(); } : null });
    }
    if (!lines.length) lines.push({ label: 'Nothing doing today.', cls: 'muted' });
    ctxOpen(q.name, q.sub || '', lines); return true;
  }
  function expPoiMenu(poi) {
    var X = xs(), lines = [];
    if (wsPlaceMenu(poi)) return true;
    if (poi === 'tobac') { var near = carNear(40, 14, 30), n = 0, val = 0, vs = carState(); Object.keys(vs.cigs).forEach(function (k) { n += vs.cigs[k]; val += vs.cigs[k] * CIG_SKUS[k].price * 0.6; }); val = Math.round(val);
      lines.push({ label: '🚬 Sell the ' + n + ' packs in your car · ' + money(val) + ' <small>60% of shop price, paid straight to the bank' + (near ? '' : ' · bring the car round') + '</small>', cls: n && near ? '' : 'muted', act: n && near ? function () { S.bank += val; bookSale(val); vs.cigs = {}; S.stats.wholesale = (S.stats.wholesale || 0) + val; sfx('cash'); toast('🚬 Wholesaled ' + n + ' packs for ' + money(val), 'good'); logEvent('🚬 Wholesaled ' + n + ' packs to the Corner Tobacconist for ' + money(val), 'good'); hud(); save(); } : null });
      lines.push({ label: 'Load cartons at home: Shift+E on the car or the van.', cls: 'muted' }); ctxOpen('🚬 Corner Tobacconist', 'he takes as many RF Smoking cartons as you can bring', lines); return true; }
    if (poi === 'police') { var h = Math.round(X.heat), cost = 100 + h * 8; lines.push({ label: '🌡️ Your heat: ' + h + ' / 100 <small>' + (h >= 60 ? 'inspections are coming' : h >= 30 ? 'they have noticed you' : 'nobody is looking at you') + ' · park deals, fines and shootings raise it, time lowers it</small>', cls: 'muted' });
      lines.push({ label: '🤝 Donate ' + money(cost) + ' to the benevolent fund <small>heat -30</small>', cls: h > 0 && S.bank >= cost ? '' : 'muted', act: h > 0 && S.bank >= cost ? function () { S.bank -= cost; X.heat = Math.max(0, X.heat - 30); exp.heatBand = 0; sfx('cash'); toast('🤝 A generous citizen. Heat down to ' + Math.round(X.heat), 'good'); hud(); save(); } : null }); ctxOpen('🚔 Police precinct', 'front desk', lines); return true; }
    return false;
  }
  function expPrompt(d, h) {
    var X = xs();
    if (d.kind === 'zoneExit') return 'Leave <small>' + ZONES[d.zone].name + '</small>';
    if (d.kind === 'zoneDoor') return ZONES[d.zone].name + ' <small>E to go in</small>';
    if (d.kind === 'zoneClerk') return (d.poi === 'bank' ? 'Teller' : 'Clerk') + ' <small>E to do business</small>';
    if (d.kind === 'labRig') return 'Lab equipment <small>' + (X.lab.job ? 'batch running' : 'idle') + ' · E for the batch sheet</small>';
    if (d.kind === 'roofUp') return 'Ladder to the roof <small>greenhouse</small>'; if (d.kind === 'roofDown') return 'Back down into the flat';
    if (d.kind === 'roofBed') { var b = X.roof[d.idx]; return 'Roof bed ' + (d.idx + 1) + ' <small>' + (b.stage === 'empty' ? (hasLic('cult2') ? 'sow outdoor mix · ' + money(10) : 'needs the Cultivation permit II from the office PC') : b.stage === 'ready' ? 'harvest about 25 g' : 'growing ' + Math.round(b.t / 260 * 100) + '%' + (nightNow() ? ' · asleep until daylight' : '')) + '</small>'; }
    if (d.kind === 'generator') return S.upgrades.generator ? 'Generator <small>fuelled and on standby</small>' : 'Generator <small>buy it for ' + money(1400) + ' · power cuts stop touching you</small>';
    if (d.kind === 'roster') return 'Staff roster <small>hire a driver, a basement operator, a night guard</small>';
    if (d.kind === 'bagLine') return S.upgrades.bagline ? 'Trim & bag line <small>' + (X.bagline.on ? 'running' : 'off') + ' · ' + (S.supplies.bag || 0) + ' baggies</small>' : 'Trim & bag line <small>install for ' + money(900) + '</small>';
    if (d.kind === 'dropoff' && X.jobs[d.idx] && X.jobs[d.idx].via === 'branch') { var bh = held(), brm = branchRoom(); return '🏪 Green Leaf, your branch <small>' + (brm <= 0 ? 'stocked for today · back tomorrow' : isGoods(bh) ? 'E puts ' + Math.min(bh.n, brm) + ' ' + kindName(bh.kind, Math.min(bh.n, brm)) + ' on its shelves · ' + money(BRANCH_PAY) + ' each tomorrow' : 'bring bags, joints or cookies · ' + brm + ' more today') + '</small>'; }
    if (d.kind === 'dropoff') { var J = X.jobs[d.idx]; if (!J) return ''; var lt = Math.max(0, Math.ceil((J.until - now()) / 1000)); return (J.via === 'tablet' ? '📋 Round drop · ' : '📱 Phone customer · ') + J.addr + ' <small>wants ' + J.qty + ' × ' + jobGoods(J) + ' · ' + Math.floor(lt / 60) + ' min ' + (lt % 60) + ' s left' + (J.via === 'tablet' ? ' · takes them out of the car' : '') + '</small>'; }
    if (d.kind === 'tabletDock') return hasLic('tobacco') ? (X.tablet === 'dock' ? 'Delivery tablet <small>E takes it · J reads the round anywhere</small>' : 'Tablet dock <small>the tablet is ' + (X.tablet === 'car' ? 'in the car' : 'in your hands') + ' · E puts it back</small>') : 'Tablet dock <small>dead until you hold the tobacco licence</small>';
    return '';
  }
  function expInteract(d, h) {
    var X = xs();
    if (d.kind === 'zoneExit') { leaveZone(d.zone); return true; } if (d.kind === 'zoneDoor') { enterZone(d.zone); return true; }
    if (d.kind === 'zoneClerk') { cityPoiMenu(d.poi); return true; } if (d.kind === 'labRig') { labMenu(); return true; } if (d.kind === 'roster') { rosterMenu(); return true; }
    if (d.kind === 'roofUp') { tobFade(function () { player.floor = 2; player.pos.set(-9.4, ROOF_Y + 1.65, -3.0); player.vel.set(0, 0, 0); player.yaw = -Math.PI / 2; }); return true; }
    if (d.kind === 'roofDown') { tobFade(function () { player.floor = 1; player.pos.set(-10.6, UP.y + 1.65, -3.0); player.vel.set(0, 0, 0); }); return true; }
    if (d.kind === 'roofBed') { var b = X.roof[d.idx]; if (b.stage === 'empty') { if (!hasLic('cult2')) { sfx('bad'); toast('🌱 Growing on the roof needs the Cultivation permit II (under Licences on the office PC)', 'bad'); return true; } if (S.bank < 10) { toast('Seedlings cost ' + money(10), 'bad'); return true; } S.bank -= 10; b.stage = 'grow'; b.t = 0; sfx('plant'); toast('🌱 Sown. Sunlight does the rest, for free.', 'good'); } else if (b.stage === 'ready') { b.stage = 'empty'; b.t = 0; var q = randi(42, 60) + (X.weather.kind === 'rain' ? -4 : 0); stashAdd('sunflower', 25, q, 1.0); var rproc = 25 * COST.processPerGram; spendOp(rproc); logEvent('Trim, testing and compliance on the roof harvest: ' + money(rproc), ''); sfx('harvest'); toast('🌿 25 g of outdoor bud (quality ' + q + ') into the stash. Rough stuff, perfect for the lab.', 'good'); } else toast('Still growing', ''); hud(); save(); return true; }
    if (d.kind === 'generator') { if (S.upgrades.generator) toast('It will start itself on the next power cut', ''); else if (S.bank < 1400) toast('The generator costs ' + money(1400), 'bad'); else { S.bank -= 1400; S.upgrades.generator = true; sfx('cash'); toast('⚡ Generator installed. Power cuts won\'t stop you again.', 'good'); applyShopState(); hud(); save(); } return true; }
    if (d.kind === 'bagLine') { if (!S.upgrades.bagline) { if (S.bank < 900) toast('The trim & bag line costs ' + money(900), 'bad'); else { S.bank -= 900; S.upgrades.bagline = true; sfx('cash'); toast('Trim & bag line installed', 'good'); hud(); save(); } } else { X.bagline.on = !X.bagline.on; sfx('click'); toast(X.bagline.on ? '▶ Bag line running: an eighth every 4 s from your biggest stash, trimmed a little cleaner (+3 quality), one baggie each' : '⏹ Bag line stopped', ''); save(); } return true; }
    if (d.kind === 'dropoff') return jobHandOver(d.idx);
    if (d.kind === 'tabletDock') { if (!hasLic('tobacco')) { toast('The tablet is dead. The round needs the tobacco licence from the office PC.', 'bad'); return true; } tabletTake(); return true; }
    return false;
  }
  function drawMapExtras(ctx, mx, mz, W, H) {
    var X = xs();
    X.jobs.forEach(function (j, i) { var col = j.via === 'branch' ? '#7fd4ff' : j.via === 'tablet' ? '#ffc857' : '#6fdc8c'; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(mx(j.x), mz(j.z), 9 + (now() / 200 % 6), 0, 6.29); ctx.stroke(); ctx.fillStyle = col; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center'; ctx.fillText('#' + (i + 1), mx(j.x), mz(j.z) + 4); });
    if (exp.getaway) { ctx.fillStyle = '#ff5a4a'; ctx.fillRect(mx(exp.getaway.g.position.x) - 5, mz(exp.getaway.g.position.z) - 5, 10, 10); }
    ctx.textAlign = 'left'; ctx.fillStyle = '#8fa89a'; ctx.font = '12px system-ui'; ctx.fillText(season() + ' · day ' + S.day + (weekend() ? ' (weekend)' : '') + ' · ' + X.weather.kind, W + 22, H - 90); ctx.fillStyle = X.heat >= 60 ? '#ff6b6b' : X.heat >= 30 ? '#ffc857' : '#8fa89a'; ctx.fillText('Heat ' + Math.round(X.heat) + ' / 100', W + 22, H - 68);
  }
