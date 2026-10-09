//@ touch screens: the till, the security screen, the office PC, the phone and the quick wheel
  // ── the till: a tablet on a stand above the cash drawer; payments, change and walk-up sales happen on its screen ──
  function buildPos(x, z) {
    // the stand: a weighted foot on the drawer cabinet, an arm, and a hinge block behind the screen
    box(0.2, 0.016, 0.16, MAT.alu, x, 1.196, z + 0.04, { cast: false, r: 0.006 });
    var arm = box(0.052, 0.27, 0.024, MAT.alu, x, 1.325, z + 0.062, { r: 0.009 }); arm.rotation.x = -0.12;
    var sc = touchPanel({ id: 'pos', kind: 'pos', w: 500, h: 375, scale: 1.8, pw: 0.48, ph: 0.36, draw: drawPos, tap: posTap, live: 1000 });
    var g = new THREE.Group(); g.position.set(x, 1.45, z); g.rotation.set(0.42, Math.PI, 0); world.group.add(g); world.posGroup = g;
    screenShell(g, 0.48, 0.36, { bezel: 0.022, depth: 0.022 });
    var hinge = new THREE.Mesh(bevelGeo(0.13, 0.09, 0.034), MAT.gunmetal); hinge.position.set(0, -0.02, -0.04); hinge.castShadow = true; g.add(hinge);
    sc.mesh.position.z = 0.0005; g.add(sc.mesh); world.registerScreen = sc.mesh;
    var hit = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.41, 0.06), MAT.none); g.add(hit); interactable(hit, { kind: 'pos' });
    // the customer's side: a slim read-out on a pole at the back of the cabinet, facing the window
    cyl(0.009, 0.009, 0.36, MAT.alu, x + 0.19, 1.365, z + 0.13, null, 10); cyl(0.024, 0.028, 0.012, MAT.soft, x + 0.19, 1.192, z + 0.13, null, 14);
    var cc = document.createElement('canvas'); cc.width = 384; cc.height = 128; var cm = litPlane(cc, 0.21, 0.07);
    var cg = new THREE.Group(); cg.position.set(x + 0.19, 1.565, z + 0.135); cg.rotation.x = -0.22; world.group.add(cg); screenShell(cg, 0.21, 0.07, { bezel: 0.008, depth: 0.018, rim: 0.003, led: 0 }); cm.position.z = 0.0005; cg.add(cm);
    world.reg.cust = { canvas: cc, mesh: cm };
    world.reg.sc = sc; drawRegister();
  }
  function drawRegister() { if (world.reg && world.reg.sc) tDraw(world.reg.sc); }
  function drawPosCust() {   // what the customer reads through the window: the total while they pay, a thank you after, the shop's name otherwise
    var cu = world.reg && world.reg.cust; if (!cu) return; var ctx = cu.canvas.getContext('2d'), W = 384, H = 128, c = S.customer, pay = c && c.stage;
    scrLcd(ctx, W, H, DESK_OK); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (pay) { ctx.fillStyle = DESK_DIM; ctx.font = '600 24px ' + DESK_FONT; ctx.fillText('Total', W / 2, 30); ctx.fillStyle = DESK_INK; ctx.font = '700 60px ' + SCR_MONO; ctx.fillText(money(c.due), W / 2, 84); }
    else { ctx.fillStyle = DESK_OK; ctx.font = '700 44px ' + DESK_FONT; ctx.fillText(shop().open ? 'Grow Co.' : 'Closed', W / 2, 50); ctx.fillStyle = DESK_DIM; ctx.font = '22px ' + DESK_FONT; ctx.fillText(shop().open ? (world.reg.lastSale ? 'Thank you. See you soon.' : 'Have your ID ready.') : 'Back tomorrow.', W / 2, 98); }
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'; cu.mesh.userData.tex.needsUpdate = true;
  }
  function drawPos(sc, ctx) {
    var W = sc.w, H = sc.h, c = S.customer, h = held(), sell = h && (h.kind === 'bags' || h.kind === 'joints' || h.kind === 'cookies'), A = DESK_OK, P = 18;
    scrBg(ctx, W, H, A); scrHead(ctx, W, 54, 'Grow Co. till', (shop().open ? 'Open' : 'Closed') + ' · market ' + S.market.toFixed(2) + '×', '🌿', shop().open ? A : DESK_BAD);
    var st = [['Till', money(S.till), S.till >= TILL_HEAVY ? DESK_WARN : DESK_INK], ['Pocket', money(S.pocket)], ['Rep', String(Math.floor(S.rep))], ['Walk-ups left', String(walkupLeft())]], sw = (W - 2 * P - 3 * 8) / 4;
    st.forEach(function (s, i) { scrStat(ctx, P + i * (sw + 8), 62, sw, 44, s[0], s[1], s[2]); });
    var y = 116;
    if (c && c.stage) {
      scrCard(ctx, P, y, W - 2 * P, 56, { tint: DESK_WARN, r: 12 });
      ctx.fillStyle = DESK_WARN; ctx.font = '700 18px ' + DESK_FONT; ctx.fillText(deskTrim(ctx, (c.pay === 'card' ? '💳 ' : '💵 ') + c.who + ' is paying', W - 2 * P - 150), P + 14, y + 9);
      ctx.fillStyle = DESK_DIM; ctx.font = '13px ' + DESK_FONT; ctx.fillText(deskTrim(ctx, wantText(c), W - 2 * P - 150), P + 14, y + 33);
      ctx.textAlign = 'right'; ctx.fillStyle = DESK_INK; ctx.font = '800 32px ' + SCR_MONO; ctx.fillText(money(c.due), W - P - 14, y + 11); ctx.textAlign = 'left'; y += 66;
      if (c.pay === 'card') { tBtn(sc, ctx, P, y, W - 2 * P, 68, (c.declined ? 'Run the card again' : 'Run the card') + ' · ' + money(c.due), 'payCard', 0, 'Run the card', true, { size: 24 }); y += 78; if (c.declined) { ctx.fillStyle = DESK_BAD; ctx.font = '600 15px ' + DESK_FONT; ctx.fillText('Declined once. Try it again.', P, y); } }
      else if (c.stage === 'pay') { tBtn(sc, ctx, P, y, W - 2 * P, 68, 'Take the ' + money(c.tendered) + ' in cash', 'payCash', 0, 'Take the cash', true, { size: 24 }); y += 78; ctx.fillStyle = DESK_DIM; ctx.font = '15px ' + DESK_FONT; ctx.fillText(c.tendered > c.due ? 'Then count ' + money(c.tendered - c.due) + ' of change out of the till.' : 'Exact money.', P, y); }
      else {
        var due = c.tendered - c.due; ctx.fillStyle = DESK_INK; ctx.font = '14px ' + DESK_FONT; ctx.fillText('Took ' + money(c.tendered) + ' · change due ' + money(due) + ' · in hand ' + money(c.changeGiven), P, y - 2); y += 20;
        var ds = [50, 20, 10, 5, 1], bw = (W - 2 * P - 4 * 8) / 5; ds.forEach(function (d, i) { tBtn(sc, ctx, P + i * (bw + 8), y, bw, 46, '$' + d, 'chg', d, 'Count out $' + d, false, { size: 22, weight: '800' }); }); y += 54;
        tBtn(sc, ctx, P, y, (W - 2 * P - 8) / 2, 44, 'Hand over ' + money(c.changeGiven), 'chgGive', 0, 'Hand over the change', c.changeGiven >= due, { size: 18 }); tBtn(sc, ctx, P + (W - 2 * P - 8) / 2 + 8, y, (W - 2 * P - 8) / 2, 44, 'Back in the till', 'chgUndo', 0, 'Put it back in the till', false, { size: 18 });
      }
    }
    else if (sell) {
      var wl = walkupLeft(), n = Math.min(h.n, wl), q = h.qSum / h.n, t = h.thcSum / h.n, each = unitPrice(h.kind, q, t) * WALKUP_RATE;
      scrCard(ctx, P, y, W - 2 * P, 62, { tint: DESK_WARN, r: 12 });
      ctx.fillStyle = DESK_WARN; ctx.font = '700 18px ' + DESK_FONT; ctx.fillText('Walk-up sale', P + 14, y + 9);
      ctx.fillStyle = DESK_INK; ctx.font = '14px ' + DESK_FONT; ctx.fillText(deskTrim(ctx, h.n + ' × ' + kindName(h.kind, h.n) + ' · quality ' + Math.round(q) + ' · ' + money(each) + ' each at 85% of the board', W - 2 * P - 28), P + 14, y + 35); y += 74;
      if (wl > 0) tBtn(sc, ctx, P, y, W - 2 * P, 70, 'Ring up ' + n + ' ' + kindName(h.kind, n) + ' · ' + money(each * n), 'sellHeld', 0, 'Ring up a walk-up sale', true, { size: 23 }); else { ctx.fillStyle = DESK_BAD; ctx.font = '600 17px ' + DESK_FONT; ctx.fillText('The till is closed to walk-ups until tomorrow.', P, y + 20); }
    }
    else {
      var aq = curedAvgQ() || 60, at = curedAvgThc(); var rows = [['🛍', 'Bags', bagPrice(aq, at), S.pkg.bags.n], ['🚬', 'Joints', jointPrice(aq, at), S.pkg.joints.n], ['🍪', 'Cookies', cookiePrice(aq, at), S.pkg.cookies.n]];
      scrCard(ctx, P, y, W - 2 * P, 122, { r: 12 }); ctx.fillStyle = DESK_DIM; ctx.font = '600 12px ' + DESK_FONT; ctx.fillText('Board prices', P + 14, y + 8); ctx.textAlign = 'right'; ctx.fillText('packed', W - P - 100, y + 8); ctx.fillText('each', W - P - 14, y + 8); ctx.textAlign = 'left';
      rows.forEach(function (r, i) { var ry = y + 28 + i * 31; if (i) { ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(P + 14, ry - 3, W - 2 * P - 28, 1); } ctx.font = '19px ' + SCR_EMOJI; ctx.fillStyle = DESK_INK; ctx.fillText(r[0], P + 14, ry + 1); ctx.font = '600 18px ' + DESK_FONT; ctx.fillText(r[1], P + 48, ry + 2); ctx.textAlign = 'right'; ctx.fillStyle = r[3] > 0 ? DESK_INK : DESK_MUTE; ctx.font = '700 18px ' + SCR_MONO; ctx.fillText(String(r[3]), W - P - 100, ry + 2); ctx.fillStyle = DESK_OK; ctx.fillText(money(r[2]), W - P - 14, ry + 2); ctx.textAlign = 'left'; });
      y += 130; scrCard(ctx, P, y, W - 2 * P, 44, { r: 12, tint: c ? DESK_WARN : null }); deskDot(ctx, P + 20, y + 22, c ? DESK_WARN : DESK_MUTE, 6);
      ctx.fillStyle = c ? DESK_INK : DESK_DIM; ctx.font = '15px ' + DESK_FONT; ctx.textBaseline = 'middle'; ctx.fillText(deskTrim(ctx, c ? (c.arrived ? c.who + ' wants ' + wantText(c) : c.who + ' is at the ID check') : world.reg.lastSale ? 'Last sale: ' + world.reg.lastSale : 'No customer at the window.', W - 2 * P - 50), P + 36, y + 23); ctx.textBaseline = 'top';
    }
    var by = H - 62; scrFoot(ctx, W, H, 72, A);
    var bw2 = (W - 2 * P - 16) / 3;
    tBtn(sc, ctx, P, by, bw2, 50, '🗄 Open drawer', 'drawer', 0, 'Open the cash drawer', false, { size: 16 });
    tBtn(sc, ctx, P + bw2 + 8, by, bw2, 50, S.till > 0 ? '👛 Empty till ' + money(S.till) : '👛 Till is empty', 'tillEmpty', 0, 'Empty the till into your pocket', false, { size: 16, off: S.till <= 0 });
    tBtn(sc, ctx, P + 2 * (bw2 + 8), by, bw2, 50, '🧾 Counter display', 'display', 0, 'Counter display stock', false, { size: 15, off: true, sub: (S.display.lighter || 0) + ' lighters · ' + (S.display.rpaper || 0) + ' papers · ' + (S.display.rgrinder || 0) + ' grinders' });
    drawPosCust();
  }
  function posTap(z) {
    if (!z) return; sfx('click');
    if (z.act === 'drawer') { world.reg.drawerT = 1; sfx('drawer'); }
    else if (z.act === 'tillEmpty') { var tl = S.till; if (tl > 0 && takeCash(tl, 'till')) S.till = 0; }
    else if (z.act === 'sellHeld') sellHeld();
    else if (payActions[z.act]) payActions[z.act](z.act === 'chg' ? +z.id : undefined);
    else return;
    afterAction();
  }

  // ── the security desk screen: cameras, doors and alerts on a monitor beside the wall of feeds ──
  var SEC_PAGES = ['cams', 'doors', 'alerts'], SEC_PAGE_LABEL = { cams: 'Cameras', doors: 'Doors', alerts: 'Alerts' };
  var secScreen = { page: 0, sc: null };
  function buildSecScreen(x, y, z, ry) {   /* a big tablet screen on the wall to the right of the chair: nothing on the desk, nothing in front of the wall of feeds */
    var sc = touchPanel({ id: 'sec', kind: 'secscreen', w: 1120, h: 700, pw: 1.2, ph: 0.75, draw: drawSecScreen, tap: secTap, wheel: function (dir) { secScreen.page = ((secScreen.page + dir) % 3 + 3) % 3; }, live: 1000 });
    var g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; world.group.add(g); secScreen.g = g;
    screenShell(g, 1.2, 0.75, { bezel: 0.026, depth: 0.034, led: 0xffc857 });
    var mount = new THREE.Mesh(bevelGeo(0.4, 0.3, 0.03), MAT.gunmetal); mount.position.z = -0.052; g.add(mount);
    sc.mesh.position.z = 0.0005; g.add(sc.mesh);
    var hit = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.87, 0.12), MAT.none); g.add(hit); interactable(hit, { kind: 'secscreen' });
    var glow = new THREE.PointLight(0xffc857, 0.25, 3); glow.position.set(0, 0, 0.5); g.add(glow);
    secScreen.sc = sc; tDraw(sc);
  }
  function secCamLabel(n) { n = String(n || ''); return n.charAt(0) + n.slice(1).toLowerCase(); }
  function drawSecScreen(sc, ctx) {
    var W = sc.w, H = sc.h, page = SEC_PAGES[secScreen.page], X = xs(), A = DESK_WARN, o = { col: A, size: 18 }, P = 30;
    scrBg(ctx, W, H, A); scrHead(ctx, W, 76, 'Security', guardOnDuty() ? 'The guard is on the door' : 'Nobody is on the door', '🛡', A);
    SEC_PAGES.forEach(function (p, i) { tBtn(sc, ctx, 340 + i * 156, 17, 146, 42, SEC_PAGE_LABEL[p], 'page', i, SEC_PAGE_LABEL[p], i === secScreen.page, o); });
    var y = 96;
    if (page === 'cams') {
      var cols = 4, bw = (W - 2 * P - 3 * 12) / cols, bh = 80;
      SEC_CAMS.forEach(function (c, i) { var x = P + (i % cols) * (bw + 12), yy = y + Math.floor(i / cols) * (bh + 10); tBtn(sc, ctx, x, yy, bw, bh, '📹 ' + (i + 1) + ' · ' + secCamLabel(c.name), 'cam', i, 'Watch ' + secCamName(i), sec.view.on && sec.view.idx === i, { col: A, size: 20, sub: c.name === 'STREET' || c.name === 'YARD' ? 'outdoor' : 'indoor' }); });
      y += 3 * (bh + 10) + 8; scrCard(ctx, P, y, W - 2 * P, 50, { r: 12 }); ctx.fillStyle = DESK_DIM; ctx.font = '17px ' + DESK_FONT; ctx.textBaseline = 'middle'; ctx.fillText('Tap a camera to watch it full screen from the chair. A and D step through, E leaves.', P + 18, y + 26); ctx.textBaseline = 'top';
    }
    else if (page === 'doors') {
      var list = DOORS.slice(0, 12), dw = (W - 2 * P - 12) / 2, dh = 62;
      list.forEach(function (d, i) { var x = P + (i % 2) * (dw + 12), yy = y + Math.floor(i / 2) * (dh + 8); scrCard(ctx, x, yy, dw, dh, { r: 12, tint: d.locked ? DESK_BAD : null }); tZone(sc, x, yy, dw, dh, 'door', d.id, (d.locked ? 'Unlock the ' : 'Lock the ') + d.label); deskDot(ctx, x + 24, yy + 31, d.locked ? DESK_BAD : d.open ? DESK_OK : DESK_DIM, 8); ctx.fillStyle = DESK_INK; ctx.font = '700 19px ' + DESK_FONT; ctx.fillText(deskTrim(ctx, d.name || d.label, dw - 220), x + 46, yy + 9); ctx.fillStyle = d.locked ? DESK_BAD : DESK_DIM; ctx.font = '15px ' + DESK_FONT; ctx.fillText((d.locked ? 'Locked' : d.open ? 'Open' : 'Closed') + (staffKey(d.id) ? ' · staff have a key' : ' · staff locked out'), x + 46, yy + 35); ctx.textAlign = 'right'; ctx.fillStyle = A; ctx.font = '600 15px ' + DESK_FONT; ctx.fillText(d.locked ? 'tap to unlock' : 'tap to lock', x + dw - 16, yy + 22); ctx.textAlign = 'left'; });
      if (!list.length) { ctx.fillStyle = DESK_MUTE; ctx.font = '20px ' + DESK_FONT; ctx.fillText('No doors registered.', P, y); }
    }
    else {
      var heat = Math.round(X.heat), hc = heat >= 60 ? DESK_BAD : heat >= 30 ? DESK_WARN : DESK_OK;
      var tiles = [['Heat', heat + ' / 100', heat >= 60 ? 'inspections likely' : heat >= 30 ? 'noticed' : 'quiet', hc], ['Robbery', heist.masked ? 'In progress' : caseHintOn() ? 'Loitering' : 'None', heist.policeT > 0 ? 'police in ' + Math.ceil(heist.policeT) + ' s' : S.upgrades.panic ? 'silent alarm fitted' : 'no silent alarm', heist.masked || caseHintOn() ? DESK_BAD : DESK_OK], ['Guard', guardOnDuty() ? (guard.state || 'idle') : guardOff() ? 'Off shift' : 'Away', guardOnDuty() ? 'on the door' : 'the roster puts one on', guardOnDuty() ? DESK_OK : DESK_WARN], ['Shop', shop().open ? 'Open' : 'Closed', S.customer ? S.customer.who + ' at the window' : 'nobody at the window', shop().open ? DESK_OK : DESK_DIM]];
      var tw = (W - 2 * P - 3 * 12) / 4; tiles.forEach(function (t, i) { deskTile(ctx, P + i * (tw + 12), y, tw, 124, t[0], t[1], t[2], t[3]); scrMeter(ctx, P + i * (tw + 12) + 26, y + 124 - 6, tw - 52, 3, i === 0 ? heat / 100 : 1, t[3]); }); y += 140;
      scrCard(ctx, P, y, W - 2 * P, H - 78 - y - 8, { r: 14 }); scrTitle(ctx, P + 20, y + 12, 'Incident log', 18, DESK_DIM); y += 44;
      var ev = S.log.filter(function (l) { return /🚨|🔒|🔓|🚓|🥊|💸|⚠|🔫|🗡|🦹|🚔/.test(l.msg); }).slice(0, 7);
      if (!ev.length) { ctx.fillStyle = DESK_MUTE; ctx.font = '17px ' + DESK_FONT; ctx.fillText('Nothing to report.', P + 20, y); }
      ev.forEach(function (l) { ctx.fillStyle = DESK_DIM; ctx.font = '15px ' + SCR_MONO; ctx.fillText(l.t, P + 20, y + 2); ctx.fillStyle = l.kind === 'bad' ? DESK_BAD : DESK_INK; ctx.font = '17px ' + DESK_FONT; ctx.fillText(deskTrim(ctx, l.msg, W - 170), P + 90, y); y += 28; });
    }
    var by = H - 64; scrFoot(ctx, W, H, 78, A);
    var bx = P, o2 = { col: A, size: 17 };
    tBtn(sc, ctx, bx, by, 200, 50, sec.view.on ? '📹 Leave the cameras' : '📹 Watch cameras', 'watch', 0, sec.view.on ? 'Leave the camera view' : 'Watch the cameras', sec.view.on, o2); bx += 210;
    tBtn(sc, ctx, bx, by, 170, 50, '🔒 Lock all', 'lockAll', 0, 'Lock every door', false, o2); bx += 180;
    tBtn(sc, ctx, bx, by, 170, 50, '🔓 Unlock all', 'unlockAll', 0, 'Unlock every door', false, o2); bx += 180;
    tBtn(sc, ctx, bx, by, 200, 50, '🚨 Silent alarm', 'panic', 0, S.upgrades.panic ? 'Trip the silent alarm' : 'No silent alarm fitted: Gear on the office PC', false, { col: DESK_BAD, size: 17, off: !S.upgrades.panic }); bx += 210;
    tBtn(sc, ctx, bx, by, W - P - bx, 50, shop().open ? '🏪 Close the shop' : '🏪 Open the shop', 'shop', 0, shop().open ? 'Close the shop' : 'Open the shop', shop().open, o2);
  }
  function secTap(z) {
    if (!z) return; sfx('click');
    if (z.act === 'page') secScreen.page = z.id;
    else if (z.act === 'cam') { if (!sec.view.on) camEnter(); camShow(z.id); }
    else if (z.act === 'watch') { if (sec.view.on) camExit(); else camEnter(); }
    else if (z.act === 'door') { var d = doorById[z.id]; if (d) { if (d.locked) { setDoor(z.id, d.open, false); toast('🔓 Unlocked the ' + d.label, 'good'); } else { setDoor(z.id, false, true); toast('🔒 Locked the ' + d.label, ''); } save(); } }
    else if (z.act === 'lockAll') { doorsAll('lock'); toast('🔒 Every door locked', ''); }
    else if (z.act === 'unlockAll') { doorsAll('unlock'); toast('🔓 Every door unlocked', 'good'); }
    else if (z.act === 'panic') panicButton();
    else if (z.act === 'shop') toggleShopOpen();
  }

  // ── the office PC: sit at the desk, E on the PC, and its desktop comes up with the shop, the seed bank, gear, staff, the bank and the rest as apps ──
  function officeSeat() { var inst = propInst.officeDesk; if (!inst) return null; var p = growPropWorld('officeDesk', 0, 0.78); return { x: p.x, z: p.z, yaw: inst.g.rotation.y }; }
  var pc = { open: false, app: null, el: null };
  // what the monitor on the desk shows when nobody is sitting at it: the PC's own desktop, alive. The wallpaper, the icons and
  // the dock are the ones the real desktop has, and the window that is open on it is the shop's figures as they stand.
  function drawPcScreen() {
    var P = world.pcScr; if (!P) return; P.at = now(); var ctx = P.canvas.getContext('2d'), W = 960, H = 540; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    if (typeof powerOn === 'function' && !powerOn()) { ctx.fillStyle = '#020303'; ctx.fillRect(0, 0, W, H); P.mesh.userData.tex.needsUpdate = true; return; }
    var g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#12271f'); g.addColorStop(0.55, '#0a1712'); g.addColorStop(1, '#050b08'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    var r1 = ctx.createRadialGradient(W * 0.8, H * 1.1, 10, W * 0.8, H * 1.1, 560); r1.addColorStop(0, 'rgba(111,220,140,.34)'); r1.addColorStop(1, 'rgba(111,220,140,0)'); ctx.fillStyle = r1; ctx.fillRect(0, 0, W, H);
    var r2 = ctx.createRadialGradient(W * 0.1, -40, 10, W * 0.1, -40, 520); r2.addColorStop(0, 'rgba(124,196,255,.26)'); r2.addColorStop(1, 'rgba(124,196,255,0)'); ctx.fillStyle = r2; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(4,9,7,.62)'; ctx.fillRect(0, 0, W, 30); ctx.fillStyle = DESK_INK; ctx.font = '600 15px ' + DESK_FONT; ctx.textBaseline = 'middle'; ctx.fillText('🌿 Grow Co. OS', 14, 16);
    ctx.textAlign = 'right'; ctx.fillStyle = DESK_DIM; ctx.font = '600 15px ' + SCR_MONO; ctx.fillText(clockText() + ' · day ' + (S.day || 1), W - 14, 16); ctx.textAlign = 'left';
    var cols = ['#2f6d4a', '#7a6a2a', '#4a5560', '#2f5f8a', '#8a4a3a', '#5d4a8a'];
    pcApps().slice(0, 8).forEach(function (a, i) { var x = 26 + Math.floor(i / 4) * 96, y = 52 + (i % 4) * 104; var ig = ctx.createLinearGradient(x, y, x + 58, y + 58); ig.addColorStop(0, cols[i % 6]); ig.addColorStop(1, 'rgba(0,0,0,.55)'); ctx.fillStyle = cols[i % 6]; roundRect(ctx, x, y, 58, 58, 16); ctx.fill(); ctx.fillStyle = ig; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.textAlign = 'center'; ctx.font = '30px ' + SCR_EMOJI; ctx.fillStyle = '#fff'; ctx.fillText(a[1], x + 29, y + 31); ctx.font = '500 13px ' + DESK_FONT; ctx.fillStyle = DESK_INK; ctx.fillText(a[2], x + 29, y + 74); ctx.textAlign = 'left'; });
    // the open window: today's figures
    var wx = 250, wy = 56, ww = 680, wh = 400; ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16; ctx.fillStyle = '#0f1c16'; roundRect(ctx, wx, wy, ww, wh, 14); ctx.fill(); ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 1.5; roundRect(ctx, wx, wy, ww, wh, 14); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,.3)'; roundRect(ctx, wx, wy, ww, 38, 14); ctx.fill(); ctx.fillStyle = DESK_INK; ctx.font = '600 16px ' + DESK_FONT; ctx.fillText('📊 Dashboard', wx + 16, wy + 20);
    [DESK_BAD, DESK_WARN, DESK_OK].forEach(function (c2, i) { ctx.fillStyle = c2; ctx.beginPath(); ctx.arc(wx + ww - 22 - i * 20, wy + 19, 6, 0, Math.PI * 2); ctx.fill(); });
    ctx.textBaseline = 'top'; var X = xs(), st = [['Bank', money(S.bank), DESK_OK], ['Cash on site', money(cashOnSite()), DESK_INK], ['Rep', String(Math.floor(S.rep)), DESK_WARN], ['Market', (S.market || 1).toFixed(2) + '×', DESK_INK]], sw = (ww - 40 - 3 * 10) / 4;
    st.forEach(function (s, i) { scrStat(ctx, wx + 20 + i * (sw + 10), wy + 54, sw, 70, s[0], s[1], s[2]); });
    scrCard(ctx, wx + 20, wy + 138, 400, 244, { r: 12 }); ctx.fillStyle = DESK_DIM; ctx.font = '600 14px ' + DESK_FONT; ctx.fillText('On the shelf', wx + 36, wy + 150);
    var bars = [['Bags', S.pkg.bags.n, '#6fdc8c'], ['Joints', S.pkg.joints.n, '#f0b94d'], ['Cookies', S.pkg.cookies.n, '#7cc4ff'], ['Cured, g', Math.round(S.cured.g), '#c9a0ff']], mx = Math.max(10, bars[0][1], bars[1][1], bars[2][1], bars[3][1]);
    bars.forEach(function (b, i) { var by = wy + 186 + i * 47; ctx.fillStyle = DESK_INK; ctx.font = '15px ' + DESK_FONT; ctx.fillText(b[0], wx + 36, by); ctx.textAlign = 'right'; ctx.font = '700 15px ' + SCR_MONO; ctx.fillText(String(b[1]), wx + 404, by); ctx.textAlign = 'left'; scrMeter(ctx, wx + 36, by + 24, 368, 8, b[1] / mx, b[2]); });
    scrCard(ctx, wx + 434, wy + 138, 226, 244, { r: 12, tint: shop().open ? DESK_OK : DESK_BAD }); ctx.fillStyle = DESK_DIM; ctx.font = '600 14px ' + DESK_FONT; ctx.fillText('The shop', wx + 450, wy + 150);
    ctx.fillStyle = shop().open ? DESK_OK : DESK_BAD; ctx.font = '800 44px ' + DESK_FONT; ctx.fillText(shop().open ? 'Open' : 'Closed', wx + 450, wy + 174);
    ctx.fillStyle = DESK_INK; ctx.font = '15px ' + DESK_FONT; [['Level', String(S.level || 1)], ['Plants', String(S.plants.length)], ['Heat', Math.round(X.heat) + ' / 100'], ['Crew', String(crewList().length)]].forEach(function (l, i) { var ly = wy + 240 + i * 32; ctx.fillStyle = DESK_DIM; ctx.fillText(l[0], wx + 450, ly); ctx.textAlign = 'right'; ctx.fillStyle = DESK_INK; ctx.font = '700 15px ' + SCR_MONO; ctx.fillText(l[1], wx + 644, ly); ctx.textAlign = 'left'; ctx.font = '15px ' + DESK_FONT; });
    // the dock
    var dn = Math.min(pcApps().length, 10), dw = dn * 46 + 96, dx = (W - dw) / 2, dy = H - 62; ctx.fillStyle = 'rgba(4,9,7,.7)'; roundRect(ctx, dx, dy, dw, 50, 16); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 1.5; ctx.stroke();
    var sg = ctx.createLinearGradient(0, dy + 8, 0, dy + 42); sg.addColorStop(0, '#7fe79a'); sg.addColorStop(1, '#3fb865'); ctx.fillStyle = sg; roundRect(ctx, dx + 8, dy + 8, 80, 34, 10); ctx.fill(); ctx.fillStyle = '#04210f'; ctx.font = '700 15px ' + DESK_FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Start', dx + 48, dy + 26);
    ctx.font = '24px ' + SCR_EMOJI; ctx.fillStyle = '#fff'; pcApps().slice(0, dn).forEach(function (a, i) { ctx.fillText(a[1], dx + 96 + i * 46 + 21, dy + 27); }); ctx.fillStyle = DESK_OK; ctx.fillRect(dx + 96 + 7 * 46 + 12, dy + 44, 18, 3);
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'; P.mesh.userData.tex.needsUpdate = true;
  }
  var PC_APPS = [
    ['shop', '🛒', 'Supplies', function () { return paneShop(); }],
    ['seeds', '🌱', 'Seed bank', function () { return paneSeeds(); }],
    ['gear', '⚙️', 'Gear', function () { return paneUpgrades(); }],
    ['lic', '🪪', 'Licences', function () { return paneLicences(); }],
    ['staff', '🧑‍🔧', 'Staff', function () { return paneStaff(); }],
    ['bank', '🏦', 'Bank', function () { return paneBank(); }],
    ['jobs', '🚚', 'Deliveries', function () { return '<div class="g3-box">' + paneJobs(hasLic('tobacco') && tabletHere() ? 'tablet' : 'phone') + '</div>'; }],
    ['desk', '🖥️', typeof drawShopBoard === 'function' ? 'Live desk' : 'Dashboard', function () { return paneDesk(); }],
    ['diary', '📒', 'Diary', function () { return paneLog(); }],
    ['stats', '📊', 'Stats', function () { return paneStats(); }],
    ['settings', '⚙', 'Settings', function () { return '<div class="g3-box">' + growSettingsHtml() + '</div>'; }],
    ['guide', '📖', 'Guide', function () { return '<div class="g3-box g3-menu-body" style="margin:0;padding:12px 14px">' + guideHtml() + '</div>'; }],
    ['finance', '💰', 'Finance', function () { return paneFinance(); }, 'finance'],
    ['merch', '👕', 'Merch', function () { return paneMerch(); }, 'merch'],
    ['cup', '🏆', 'The Cup', function () { return paneCup(); }, 'cup'],
    ['breed', '🧬', 'Cultivars', function () { return paneBreed(); }, 'breeding'],
    ['upgrades', '⬆️', 'DLC upgrades', function () { return paneDlcUpg(); }]
  ];
  function pcApps() { return PC_APPS.filter(function (a) { return !a[4] || dlcOn(a[4]); }); }   /* an app that belongs to a DLC is on the desktop only while the DLC is on */
  function pcEl() {
    if (pc.el) return pc.el;
    var d = document.createElement('div'); d.id = 'g3-pc'; d.className = 'g3-overlay g3-pc-full'; d.hidden = true;
    d.innerHTML = '<div class="g3-pc"><div class="g3-pc-top"><span class="g3-pc-logo">🌿 Grow Co. OS</span><span class="g3-pc-clock" id="g3-pc-clock"></span><button class="g3-pc-off" data-pc="close" title="Get up from the PC (Esc)">⏻ Get up</button></div><div class="g3-pc-desk" id="g3-pc-desk"></div><div class="g3-pc-win" id="g3-pc-win" hidden><div class="g3-pc-winhead"><span id="g3-pc-wintitle"></span><button class="g3-x" data-pc="home" title="Back to the desktop">🗕</button></div><div class="g3-pc-winbody" id="g3-pc-winbody"></div></div><div class="g3-pc-bar" id="g3-pc-bar"></div></div>';
    document.body.appendChild(d); pc.el = d;
    d.addEventListener('click', function (e) { var b = e.target.closest('[data-pc]'); if (!b) return; var a = b.getAttribute('data-pc'); sfx('click'); if (a === 'close') pcClose(); else if (a === 'home') { pc.app = null; pcRender(); } else pcApp(a); });
    d.addEventListener('mousedown', function (e) { if (e.target === d) pcClose(); });
    $('g3-pc-winbody').addEventListener('click', panelClick); $('g3-pc-winbody').addEventListener('input', panelInput); $('g3-pc-winbody').addEventListener('input', settingsInput);
    return d;
  }
  function pcOpen() {
    var seat = officeSeat(); if (seat && (!sit.on || sit.spot !== world.officeSeat)) { world.officeSeat = seat; if (sit.on) standUp(); sitDown(seat); }
    pcEl(); pc.open = true; ui.pcOpen = true; pc.el.hidden = false; pc.el.classList.remove('leaving'); pc.el.style.opacity = String(clamp(((pc.z || 0) - 0.5) / 0.5, 0, 1)); document.exitPointerLock(); pcRender(); sfx('type');
  }
  function pcClose() { if (!pc.open) return; pc.open = false; ui.pcOpen = false; pc.el.classList.add('leaving'); if (!ui.blocked()) grabPointer(); sfx('close'); }
  // Sitting down at the PC takes you into its screen: the camera travels from the chair to the glass while the desktop fades
  // up over it, full screen, and the same in reverse when you get up. pc.z is how far in you are, 0 to 1.
  var pcCam = { to: new THREE.Vector3(), q: new THREE.Quaternion(), n: new THREE.Vector3() };
  function updatePcZoom(dt) {
    var want = pc.open ? 1 : 0, z0 = pc.z || 0; if (z0 === want) { if (!want && pc.el && !pc.el.hidden) pc.el.hidden = true; return; }
    pc.z = clamp(z0 + (want ? dt * 1.9 : -dt * 2.6), 0, 1);
    var e = pc.z * pc.z * (3 - 2 * pc.z), P = world.pcScr;
    if (P && P.mesh.parent && sit.on && e > 0) {
      P.mesh.updateWorldMatrix(true, false); P.mesh.getWorldPosition(pcCam.to); P.mesh.getWorldQuaternion(pcCam.q); pcCam.n.set(0, 0, 1).applyQuaternion(pcCam.q);
      pcCam.to.addScaledVector(pcCam.n, Math.max(0.215, 0.3375 / 2 / Math.tan(camera.fov * Math.PI / 360)));   /* where the picture exactly fills the view */
      camera.position.lerp(pcCam.to, e); camera.quaternion.slerp(pcCam.q, e);
    }
    if (pc.el) { pc.el.style.opacity = clamp((pc.z - 0.5) / 0.5, 0, 1).toFixed(3); if (!pc.open && pc.z <= 0.5) pc.el.hidden = true; }
  }
  function pcApp(id) { pc.app = id; pcRender(); }
  function pcRender() {
    if (!pc.open) return;
    $('g3-pc-clock').textContent = clockText() + ' · day ' + (S.day || 1) + ' · bank ' + money(S.bank);
    $('g3-pc-desk').innerHTML = pcApps().map(function (a) { return '<button class="g3-pc-icon" data-pc="' + a[0] + '"><span class="ico">' + a[1] + '</span><span class="n">' + a[2] + '</span></button>'; }).join('');
    $('g3-pc-bar').innerHTML = '<button class="g3-pc-start" data-pc="home">🌿 Start</button>' + pcApps().map(function (a) { return '<button class="g3-pc-task' + (pc.app === a[0] ? ' on' : '') + '" data-pc="' + a[0] + '">' + a[1] + ' ' + a[2] + '</button>'; }).join('');
    var app = null; pcApps().forEach(function (a) { if (a[0] === pc.app) app = a; });
    var win = $('g3-pc-win'); if (!app) { win.hidden = true; return; }
    win.hidden = false; $('g3-pc-wintitle').textContent = app[1] + ' ' + app[2]; $('g3-pc-winbody').innerHTML = app[3]();
  }

  // ── the phone (F, always on you) and the delivery tablet (J): two devices drawn as devices ──
  var dev = { open: false, kind: null, app: null, el: null };
  var PHONE_APPS = [
    ['burner', '📱', 'Burner', function () { return '<h3>📱 Burner · street orders</h3>' + paneJobs('phone'); }],
    ['wallet', '👛', 'Wallet', function () { return paneWallet(); }],
    ['people', '👥', 'People', function () { return panePeople(); }],
    ['map', '🗺️', 'Map', null],
    ['msgs', '💬', 'Messages', function () { return '<h3>💬 Messages</h3>' + paneLogInner(40); }],
    ['settings', '⚙️', 'Settings', function () { return growSettingsHtml(); }]
  ];
  function deviceEl() {
    if (dev.el) return dev.el;
    var d = document.createElement('div'); d.id = 'g3-device'; d.className = 'g3-overlay'; d.hidden = true;
    d.innerHTML = '<div class="g3-dev" id="g3-dev"><div class="g3-dev-status"><span id="g3-dev-time"></span><span>▂▄▆ 4G · 🔋 82%</span></div><div class="g3-dev-body" id="g3-dev-body"></div><div class="g3-dev-nav" id="g3-dev-nav"></div></div>';
    document.body.appendChild(d); dev.el = d;
    d.addEventListener('click', function (e) { var b = e.target.closest('[data-dev]'); if (!b) return; var a = b.getAttribute('data-dev'); sfx('click'); if (a === 'close') deviceClose(); else if (a === 'home') { dev.app = null; deviceRender(); } else if (a === 'map') { deviceClose(); if (!cityMap.on) toggleCityMap(); } else { dev.app = a; deviceRender(); } });
    d.addEventListener('mousedown', function (e) { if (e.target === d) deviceClose(); });
    $('g3-dev-body').addEventListener('click', panelClick); $('g3-dev-body').addEventListener('input', panelInput); $('g3-dev-body').addEventListener('input', settingsInput);
    return d;
  }
  function deviceOpen(kind, app) { deviceEl(); dev.open = true; dev.kind = kind; dev.app = app || null; ui.deviceOpen = true; dev.el.hidden = false; document.exitPointerLock(); deviceRender(); sfx('panel'); }
  function deviceClose() { if (!dev.open) return; dev.open = false; ui.deviceOpen = false; dev.el.hidden = true; if (!ui.blocked()) grabPointer(); sfx('close'); }
  function phoneOpen() { if (dev.open && dev.kind === 'phone') { deviceClose(); return; } if (ui.blocked()) return; deviceOpen('phone'); }
  function paneWallet() { var X = xs(); return '<h3>👛 Wallet</h3>' + moneyRows() + '<div class="g3-row"><span class="ico">🔥</span><span class="meta"><span class="n">Heat ' + Math.round(X.heat) + ' / 100</span><span class="own">' + (X.heat >= 60 ? 'inspections likely' : X.heat >= 30 ? 'you have been noticed' : 'quiet') + '</span></span></div>' + (S.vault + S.pocket > 0 ? '<button class="g3-btn wide" data-act="courierCall" data-id="all">🏦 Book the bank courier for ' + money(Math.floor(S.vault + S.pocket)) + '</button>' : '<div class="g3-empty">Nothing in the vault or your pocket to send to the bank.</div>') + '<p class="g3-sub2" style="margin-top:10px">The courier collects the cash at the back door and banks it. The ATM in town and the vault in the office do the rest.</p>'; }
  function panePeople() {
    var list = crewList(), X = xs(), h = '<h3>👥 People</h3>';
    h += '<div class="g3-row"><span class="ico">' + (guardOnDuty() ? '🟢' : '⚫') + '</span><span class="meta"><span class="n">The guard</span><span class="own">' + (guardOnDuty() ? 'on the door · ' + (guard.state || 'idle') : guardOff() ? 'sent home for the day' : 'not on the door') + '</span></span>' + (guard.h ? '<button class="g3-btn" data-act="guardShift">' + (guardOff() ? 'Call back in' : 'Send home') + '</button>' : '') + '</div>';
    if (!list.length) h += '<div class="g3-empty">No crew hired yet. Staff on the office PC.</div>';
    list.forEach(function (c, i) { h += '<div class="g3-row"><span class="ico">' + (c.off ? '⚫' : '🟢') + '</span><span class="meta"><span class="n">' + esc(crewName(i)) + '</span><span class="own">' + (c.off ? 'home for the day' : (c.task || 'idle')) + '</span></span><button class="g3-btn" data-act="crewShift" data-id="' + i + '">' + (c.off ? 'Call back in' : 'Send home') + '</button></div>'; });
    h += '<h3 style="margin-top:12px">Extra staff</h3><div class="g3-chips">' + chip('driver', X.staff.driver ? 'hired' : 'none') + chip('operator', X.staff.operator ? 'hired' : 'none') + chip('night guard', X.staff.night ? 'hired' : 'none') + '</div>';
    return h;
  }
  function ensureCityMap() { if (cityMap.el) return; var d = document.createElement('div'); d.style.cssText = 'position:fixed;inset:0;z-index:45;display:none;align-items:center;justify-content:center;background:rgba(6,10,8,.72);pointer-events:none'; d.hidden = true; var cv = document.createElement('canvas'); cv.width = 1100; cv.height = 720; cv.style.cssText = 'max-width:94vw;max-height:90vh;border:1px solid rgba(111,220,140,.5);border-radius:10px;background:#0d1511'; d.appendChild(cv); document.body.appendChild(d); cityMap.el = d; cityMap.cv = cv; }
  function paneTablet() {
    var X = xs(), list = jobsOf('tablet'), pos = drive.on ? drive.g.position : player.pos, cc = carState().cigs, T = tob();
    var h = '<div class="g3-tab-head"><b>RF SMOKING</b> delivery round · ' + list.length + ' job' + (list.length === 1 ? '' : 's') + ' · tablet ' + (X.tablet === 'car' ? 'in the car' : X.tablet === 'hand' ? 'in hand' : 'on the dock') + '</div><div class="g3-tab-cols"><div class="g3-tab-list">';
    if (!list.length) h += '<div class="g3-empty">No round jobs right now. They come in while the shop is open, once the basement is making packs.</div>';
    list.forEach(function (j) { var n = X.jobs.indexOf(j) + 1, left = Math.max(0, Math.round((j.until - now()) / 1000)), km = Math.round(Math.hypot(j.x - pos.x, j.z - pos.z)), inCar = cc[j.sku] || 0, ok = inCar >= j.qty; h += '<div class="g3-tab-job' + (left < 60 ? ' late' : '') + '"><span class="num">#' + n + '</span><span class="meta"><b>' + esc(j.addr) + '</b><span>' + j.qty + ' × ' + esc(jobGoods(j)) + ' · ' + km + ' m away</span><span class="' + (ok ? 'ok' : 'bad') + '">' + inCar + ' in the car · ' + T.packs[j.sku] + ' on the rack' + (ok ? ' · loaded' : ' · load more at home') + '</span></span><span class="pay">' + money(j.pay) + '<small>' + Math.floor(left / 60) + ' min ' + (left % 60) + ' s</small></span></div>'; });
    h += '<p class="g3-sub2" style="margin-top:10px">Load packs into the car or the van at home (Shift+E on it), drive the round, and press <b>E</b> at each amber beacon. You don\'t have to get out.</p></div><div class="g3-tab-map"><canvas id="g3-tab-map" width="550" height="360"></canvas></div></div>';
    return h;
  }
  function deviceRender() {
    if (!dev.open) return; var body = $('g3-dev-body'), nav = $('g3-dev-nav'); $('g3-dev').className = 'g3-dev ' + dev.kind;
    $('g3-dev-time').textContent = clockText() + ' · day ' + (S.day || 1);
    if (dev.kind === 'phone') {
      var X = xs();
      if (!dev.app) { body.innerHTML = '<div class="g3-ph-home"><div class="g3-ph-widget"><b>' + clockText() + '</b><span>' + seasonLabel() + ' · ' + X.weather.kind + ' · ' + (shop().open ? 'shop open' : 'shop closed') + '</span><span>bank ' + money(S.bank) + ' · pocket ' + money(S.pocket) + ' · heat ' + Math.round(X.heat) + '</span></div><div class="g3-ph-apps">' + PHONE_APPS.map(function (a) { var badge = a[0] === 'burner' ? jobsOf('phone').length : 0; return '<button class="g3-ph-app" data-dev="' + a[0] + '"><span class="ico">' + a[1] + (badge ? '<i>' + badge + '</i>' : '') + '</span><span class="n">' + a[2] + '</span></button>'; }).join('') + '</div></div>'; nav.innerHTML = '<button data-dev="close">✕ put away (F)</button>'; }
      else { var app = null; PHONE_APPS.forEach(function (a) { if (a[0] === dev.app) app = a; }); body.innerHTML = '<div class="g3-ph-screen">' + (app && app[3] ? app[3]() : '') + '</div>'; nav.innerHTML = '<button data-dev="home">◀ home</button><button data-dev="close">✕ put away (F)</button>'; }
    } else {
      body.innerHTML = paneTablet(); nav.innerHTML = '<button data-dev="close">✕ put down (J)</button>';
      ensureCityMap(); drawCityMap(); var tc = $('g3-tab-map'); if (tc) tc.getContext('2d').drawImage(cityMap.cv, 0, 0, tc.width, tc.height);
    }
  }

  // ── the quick wheel on Tab: eight things you reach for often, without a walk ──
  var wheel = { open: false, el: null, items: [] };
  function wheelItems() {
    var h = held(), items = [];
    items.push({ ico: '🎒', n: 'Inventory', act: function () { ui.openPanel('inventory'); } });
    items.push({ ico: '📱', n: 'Phone', act: function () { deviceOpen('phone'); } });
    items.push({ ico: '🗺️', n: cityMap.on ? 'Hide the map' : 'Map', act: function () { toggleCityMap(); } });
    items.push({ ico: '🚚', n: 'Deliveries', act: function () { jobsPanel(); } });
    var broomHeld = h && h.kind === 'broom', broomOut = crew.some(function (r) { return r.hasBroom; });
    items.push({ ico: '🧹', n: broomHeld ? 'Hang up the broom' : 'Grab the broom', dim: !broomHeld && (broomOut || hotbarFull()), act: function () { if (broomHeld) { S.held = null; syncBroom(); toast('Broom back on the hook', ''); } else if (broomOut) toast('The crew has the broom', 'bad'); else if (take({ kind: 'broom' })) { syncBroom(); toast('🧹 Got the broom. E on dirt sweeps it.', 'good'); } } });
    items.push({ ico: '🔑', n: hasKeys() ? 'Hang up the keys' : 'Grab the keyring', dim: !hasKeys() && hotbarFull(), act: function () { if (hasKeys()) { for (var i = 0; i < 6; i++) if (S.hotbar[i] && S.hotbar[i].kind === 'keys') S.hotbar[i] = null; syncKeyHook(); toast('🔑 Keyring back on the hook', ''); } else if (take({ kind: 'keys' })) { syncKeyHook(); toast('🔑 Got the keyring. Shift+E at a door locks or unlocks it.', 'good'); } } });
    items.push(drive.on ? { ico: '🚪', n: 'Get out', act: function () { exitCar(); } } : sit.on ? { ico: '🧍', n: 'Stand up', act: function () { standUp(); } } : { ico: '⬇️', n: h ? 'Put down' : 'Nothing in hand', dim: !h, act: function () { putBack(); } });
    items.push({ ico: '🏪', n: shop().open ? 'Close the shop' : 'Open the shop', act: function () { toggleShopOpen(); } });
    return items;
  }
  function wheelOpen() {
    if (ui.blocked()) return;
    if (!wheel.el) { var d = document.createElement('div'); d.id = 'g3-wheel'; d.hidden = true; document.body.appendChild(d); wheel.el = d; d.addEventListener('click', function (e) { var b = e.target.closest('[data-wheel]'); if (b) wheelPick(+b.getAttribute('data-wheel')); else if (e.target === d) wheelClose(); }); d.addEventListener('mouseover', function (e) { var b = e.target.closest('[data-wheel]'); var c = $('g3-wheel-center'); if (c) c.innerHTML = b ? '<b>' + wheel.items[+b.getAttribute('data-wheel')].n + '</b><span>click, or press ' + (+b.getAttribute('data-wheel') + 1) + '</span>' : '<b>Quick wheel</b><span>Tab or Esc closes</span>'; }); }
    wheel.items = wheelItems(); var R = 170, html = '<div class="g3-wheel-ring"></div>';
    wheel.items.forEach(function (it, i) { var a = (-90 + i * 45) * Math.PI / 180; html += '<button class="g3-wheel-item' + (it.dim ? ' dim' : '') + '" data-wheel="' + i + '" style="left:calc(50% + ' + Math.round(R * Math.cos(a)) + 'px);top:calc(50% + ' + Math.round(R * Math.sin(a)) + 'px)"><span class="k">' + (i + 1) + '</span><span class="ico">' + it.ico + '</span><span class="n">' + it.n + '</span></button>'; });
    html += '<div class="g3-wheel-center" id="g3-wheel-center"><b>Quick wheel</b><span>Tab or Esc closes</span></div>';
    wheel.el.innerHTML = html; wheel.el.hidden = false; wheel.open = true; ui.wheelOpen = true; document.exitPointerLock(); sfx('panel');
  }
  function wheelClose(keep) { if (!wheel.open) return; wheel.open = false; ui.wheelOpen = false; wheel.el.hidden = true; if (!keep && !ui.blocked()) grabPointer(); }
  function wheelPick(i) { var it = wheel.items[i]; if (!it) return; wheelClose(true); sfx('click'); it.act(); afterAction(); if (!ui.blocked()) grabPointer(); }
  function paneDesk() {
    var all = dashRows(); var h = '<div class="g3-box"><div class="g3-chips">' + DESK_PAGES.map(function (p, i) { return '<button class="g3-btn' + (i === deskBoard.page ? ' primary' : '') + '" data-act="deskPage" data-id="' + i + '">' + DESK_PAGE_LABEL[p] + '</button>'; }).join('') + '</div></div>';
    (all[DESK_PAGES[deskBoard.page]] || []).forEach(function (r) { h += '<div class="g3-row"><span class="ico">📊</span><span class="meta"><span class="n">' + esc(r[0]) + ' · ' + esc(r[1]) + '</span><span class="own">' + esc(r[2]) + '</span></span></div>'; });
    return h;
  }

