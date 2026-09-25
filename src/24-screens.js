//@ touch screens: the till, the security screen, the office PC, the phone and the quick wheel
  // ── the till: a tablet on a stand above the cash drawer; payments, change and walk-up sales happen on its screen ──
  function buildPos(x, z) {
    box(0.28, 0.02, 0.22, MAT.register, x, 1.115, z + 0.04, { cast: false }); cyl(0.022, 0.028, 0.26, MAT.chrome, x, 1.25, z + 0.05, null, 10);
    var sc = touchScreen({ id: 'pos', kind: 'pos', w: 500, h: 375, scale: 1.6, pw: 0.48, ph: 0.36, draw: drawPos, tap: posTap, live: 1000 });
    var g = new THREE.Group(); g.position.set(x, 1.42, z); g.rotation.set(0.42, Math.PI, 0); world.group.add(g); world.posGroup = g;
    var body = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.39, 0.014), colorMat(0x1b1f24, 0.4, 0.5)); body.position.z = -0.008; body.castShadow = true; g.add(body);
    sc.mesh.position.z = 0.0005; g.add(sc.mesh); world.registerScreen = sc.mesh;
    var cam = new THREE.Mesh(new THREE.CircleGeometry(0.004, 8), MAT.black); cam.position.set(0, 0.185, 0.0006); g.add(cam);
    var hit = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.41, 0.06), MAT.none); g.add(hit); interactable(hit, { kind: 'pos' });
    world.reg.sc = sc; drawRegister();
  }
  function drawRegister() { if (world.reg && world.reg.sc) tDraw(world.reg.sc); }
  function drawPos(sc, ctx) {
    var W = sc.w, H = sc.h, c = S.customer, h = held(), sell = h && (h.kind === 'bags' || h.kind === 'joints' || h.kind === 'cookies');
    ctx.fillStyle = '#07110b'; ctx.fillRect(0, 0, W, H); var grd = ctx.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, 'rgba(111,220,140,.10)'); grd.addColorStop(0.4, 'rgba(0,0,0,0)'); ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = DESK_OK; ctx.font = '800 26px ' + DESK_FONT; ctx.fillText('GROW CO. TILL', 24, 18);
    ctx.textAlign = 'right'; ctx.fillStyle = DESK_INK; ctx.font = '700 26px "Cascadia Mono",Consolas,monospace'; ctx.fillText(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), W - 24, 18); ctx.textAlign = 'left';
    ctx.fillStyle = DESK_DIM; ctx.font = '15px ' + DESK_FONT; ctx.fillText(deskTrim(ctx, 'till ' + money(S.till) + ' · pocket ' + money(S.pocket) + ' · market ' + S.market.toFixed(2) + '× · rep ' + Math.floor(S.rep) + ' · ' + walkupLeft() + ' walk-ups left today', W - 70), 24, 50);
    ctx.fillStyle = shop().open ? DESK_OK : DESK_BAD; ctx.beginPath(); ctx.arc(W - 34, 58, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(111,220,140,.25)'; ctx.fillRect(24, 74, W - 48, 2);
    var y = 90;
    if (c && c.stage) {
      ctx.fillStyle = DESK_WARN; ctx.font = '700 20px ' + DESK_FONT; ctx.fillText((c.pay === 'card' ? '💳 ' : '💵 ') + c.who + ' is paying', 24, y); ctx.textAlign = 'right'; ctx.fillStyle = DESK_INK; ctx.font = '800 34px "Cascadia Mono",Consolas,monospace'; ctx.fillText(money(c.due), W - 24, y - 6); ctx.textAlign = 'left'; y += 32;
      ctx.fillStyle = DESK_DIM; ctx.font = '16px ' + DESK_FONT; ctx.fillText(deskTrim(ctx, wantText(c), W - 48), 24, y); y += 30;
      if (c.pay === 'card') { tBtn(sc, ctx, 24, y, W - 48, 78, (c.declined ? 'Run the card again' : 'Run the card') + ' · ' + money(c.due), 'payCard', 0, 'Run the card', true, { size: 24 }); y += 90; if (c.declined) { ctx.fillStyle = DESK_BAD; ctx.font = '600 16px ' + DESK_FONT; ctx.fillText('Declined once. Try it again.', 24, y); } }
      else if (c.stage === 'pay') { tBtn(sc, ctx, 24, y, W - 48, 78, 'Take the ' + money(c.tendered) + ' in cash', 'payCash', 0, 'Take the cash', true, { size: 24 }); y += 90; ctx.fillStyle = DESK_DIM; ctx.font = '16px ' + DESK_FONT; ctx.fillText(c.tendered > c.due ? 'Then count ' + money(c.tendered - c.due) + ' of change out of the till.' : 'Exact money.', 24, y); }
      else {
        var due = c.tendered - c.due; ctx.fillStyle = DESK_INK; ctx.font = '16px ' + DESK_FONT; ctx.fillText('Took ' + money(c.tendered) + ' · change due ' + money(due) + ' · in hand ' + money(c.changeGiven), 24, y); y += 30;
        var ds = [50, 20, 10, 5, 1], bw = (W - 48 - 4 * 10) / 5; ds.forEach(function (d, i) { tBtn(sc, ctx, 24 + i * (bw + 10), y, bw, 64, '$' + d, 'chg', d, 'Count out $' + d, false, { size: 26, weight: '800' }); }); y += 76;
        tBtn(sc, ctx, 24, y, (W - 58) / 2, 64, 'Hand over ' + money(c.changeGiven), 'chgGive', 0, 'Hand over the change', c.changeGiven >= due, { size: 20 }); tBtn(sc, ctx, 24 + (W - 58) / 2 + 10, y, (W - 58) / 2, 64, 'Back in the till', 'chgUndo', 0, 'Put it back in the till', false, { size: 20 }); y += 76;
      }
    }
    else if (sell) {
      var wl = walkupLeft(), n = Math.min(h.n, wl), q = h.qSum / h.n, t = h.thcSum / h.n, each = unitPrice(h.kind, q, t) * WALKUP_RATE;
      ctx.fillStyle = DESK_WARN; ctx.font = '700 20px ' + DESK_FONT; ctx.fillText('WALK-UP SALE', 24, y); y += 30;
      ctx.fillStyle = DESK_INK; ctx.font = '16px ' + DESK_FONT; ctx.fillText(deskTrim(ctx, h.n + ' × ' + kindName(h.kind, h.n) + ' q' + Math.round(q) + ' · ' + money(each) + ' each at 85% of the board', W - 48), 24, y); y += 34;
      if (wl > 0) tBtn(sc, ctx, 24, y, W - 48, 78, 'Ring up ' + n + ' ' + kindName(h.kind, n) + ' · ' + money(each * n), 'sellHeld', 0, 'Ring up a walk-up sale', true, { size: 24 }); else { ctx.fillStyle = DESK_BAD; ctx.font = '600 18px ' + DESK_FONT; ctx.fillText('The till is closed to walk-ups until tomorrow.', 24, y + 20); }
      y += 90;
    }
    else {
      ctx.fillStyle = DESK_INK; ctx.font = '700 20px ' + DESK_FONT; ctx.fillText('BOARD PRICES', 24, y); y += 30;
      var aq = curedAvgQ() || 60, at = curedAvgThc(); var rows = [['bags', bagPrice(aq, at), S.pkg.bags.n], ['joints', jointPrice(aq, at), S.pkg.joints.n], ['cookies', cookiePrice(aq, at), S.pkg.cookies.n]];
      rows.forEach(function (r) { ctx.fillStyle = DESK_DIM; ctx.font = '18px ' + DESK_FONT; ctx.fillText(r[0], 24, y); ctx.fillStyle = DESK_INK; ctx.font = '700 18px "Cascadia Mono",Consolas,monospace'; ctx.textAlign = 'right'; ctx.fillText(money(r[1]) + '   ' + r[2] + ' packed', W - 24, y); ctx.textAlign = 'left'; y += 28; });
      y += 6; ctx.fillStyle = c ? DESK_WARN : DESK_DIM; ctx.font = '16px ' + DESK_FONT; ctx.fillText(deskTrim(ctx, c ? (c.arrived ? c.who + ' wants ' + wantText(c) : c.who + ' is at the ID check') : 'No customer at the window.', W - 48), 24, y); y += 26;
    }
    var by = H - 70; ctx.fillStyle = 'rgba(111,220,140,.08)'; ctx.fillRect(0, by - 10, W, 80);
    var bw2 = (W - 48 - 20) / 3;
    tBtn(sc, ctx, 24, by, bw2, 58, '🗄 Open drawer', 'drawer', 0, 'Open the cash drawer', false, { size: 17 });
    tBtn(sc, ctx, 24 + bw2 + 10, by, bw2, 58, S.till > 0 ? '👛 Empty till ' + money(S.till) : '👛 Till is empty', 'tillEmpty', 0, 'Empty the till into your pocket', false, { size: 17, off: S.till <= 0 });
    tBtn(sc, ctx, 24 + 2 * (bw2 + 10), by, bw2, 58, '🧾 ' + (S.display.lighter || 0) + ' lighters · ' + (S.display.rpaper || 0) + ' papers · ' + (S.display.rgrinder || 0) + ' grinders', 'display', 0, 'Counter display stock', false, { size: 13, off: true });
    if (world.reg.lastSale) { ctx.fillStyle = DESK_OK; ctx.font = '14px "Cascadia Mono",Consolas,monospace'; ctx.textAlign = 'right'; ctx.fillText(deskTrim(ctx, 'last: ' + world.reg.lastSale, 300), W - 24, by - 30); ctx.textAlign = 'left'; }
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
    var sc = touchScreen({ id: 'sec', kind: 'secscreen', w: 1120, h: 700, pw: 1.2, ph: 0.75, draw: drawSecScreen, tap: secTap, wheel: function (dir) { secScreen.page = ((secScreen.page + dir) % 3 + 3) % 3; }, live: 1000 });
    var g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; world.group.add(g); secScreen.g = g;
    var bez = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.85, 0.04), MAT.black); bez.position.z = -0.021; bez.castShadow = true; g.add(bez);
    var mount = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.03), MAT.metal); mount.position.z = -0.05; g.add(mount);
    sc.mesh.position.z = 0.0005; g.add(sc.mesh);
    var hit = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.87, 0.12), MAT.none); g.add(hit); interactable(hit, { kind: 'secscreen' });
    var glow = new THREE.PointLight(0xffc857, 0.25, 3); glow.position.set(0, 0, 0.5); g.add(glow);
    secScreen.sc = sc; tDraw(sc);
  }
  function drawSecScreen(sc, ctx) {
    var W = sc.w, H = sc.h, page = SEC_PAGES[secScreen.page], X = xs(), o = { col: DESK_WARN, fill: 'rgba(255,200,87,.25)', size: 18 };
    ctx.fillStyle = '#0b0e12'; ctx.fillRect(0, 0, W, H); var grd = ctx.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, 'rgba(255,200,87,.10)'); grd.addColorStop(0.4, 'rgba(0,0,0,0)'); ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = DESK_WARN; ctx.font = '800 30px ' + DESK_FONT; ctx.fillText('SECURITY', 30, 20);
    ctx.textAlign = 'right'; ctx.fillStyle = DESK_INK; ctx.font = '700 30px "Cascadia Mono",Consolas,monospace'; ctx.fillText(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), W - 30, 20); ctx.textAlign = 'left';
    SEC_PAGES.forEach(function (p, i) { tBtn(sc, ctx, 250 + i * 150, 18, 140, 40, SEC_PAGE_LABEL[p], 'page', i, SEC_PAGE_LABEL[p], i === secScreen.page, o); });
    ctx.fillStyle = 'rgba(255,200,87,.25)'; ctx.fillRect(30, 72, W - 60, 2);
    var y = 90;
    if (page === 'cams') {
      var cols = 4, bw = (W - 60 - 3 * 12) / cols, bh = 74;
      SEC_CAMS.forEach(function (c, i) { var x = 30 + (i % cols) * (bw + 12), yy = y + Math.floor(i / cols) * (bh + 10); tBtn(sc, ctx, x, yy, bw, bh, 'CAM ' + (i + 1) + '  ' + c.name, 'cam', i, 'Watch ' + secCamName(i), sec.view.on && sec.view.idx === i, { col: DESK_WARN, fill: 'rgba(255,200,87,.25)', size: 19, sub: c.name === 'STREET' || c.name === 'YARD' ? 'outdoor' : 'indoor' }); });
      y += 3 * (bh + 10) + 6; ctx.fillStyle = DESK_DIM; ctx.font = '16px ' + DESK_FONT; ctx.fillText('Tap a camera to watch it full screen from the chair. A and D step through, E leaves.', 30, y);
    }
    else if (page === 'doors') {
      var list = DOORS.slice(0, 12), dw = (W - 60 - 12) / 2, dh = 58;
      list.forEach(function (d, i) { var x = 30 + (i % 2) * (dw + 12), yy = y + Math.floor(i / 2) * (dh + 8); tZone(sc, x, yy, dw, dh, 'door', d.id, (d.locked ? 'Unlock the ' : 'Lock the ') + d.label); ctx.fillStyle = 'rgba(255,255,255,.05)'; roundRect(ctx, x, yy, dw, dh, 10); ctx.fill(); deskDot(ctx, x + 22, yy + 29, d.locked ? DESK_BAD : d.open ? DESK_OK : DESK_DIM, 8); ctx.fillStyle = DESK_INK; ctx.font = '700 19px ' + DESK_FONT; ctx.fillText(deskTrim(ctx, d.name || d.label, dw - 220), x + 42, yy + 8); ctx.fillStyle = d.locked ? DESK_BAD : DESK_DIM; ctx.font = '15px ' + DESK_FONT; ctx.fillText((d.locked ? 'LOCKED' : d.open ? 'open' : 'closed') + (staffKey(d.id) ? ' · staff have a key' : ' · staff locked out'), x + 42, yy + 33); ctx.textAlign = 'right'; ctx.fillStyle = DESK_WARN; ctx.font = '600 15px ' + DESK_FONT; ctx.fillText(d.locked ? 'tap to unlock' : 'tap to lock', x + dw - 14, yy + 20); ctx.textAlign = 'left'; });
      if (!list.length) { ctx.fillStyle = DESK_MUTE; ctx.font = '20px ' + DESK_FONT; ctx.fillText('no doors registered', 30, y); }
    }
    else {
      var heat = Math.round(X.heat), hc = heat >= 60 ? DESK_BAD : heat >= 30 ? DESK_WARN : DESK_OK;
      var tiles = [['Heat', heat + ' / 100', heat >= 60 ? 'inspections likely' : heat >= 30 ? 'noticed' : 'quiet', hc], ['Robbery', heist.masked ? 'IN PROGRESS' : caseHintOn() ? 'someone loitering' : 'none', heist.policeT > 0 ? 'police in ' + Math.ceil(heist.policeT) + ' s' : S.upgrades.panic ? 'silent alarm fitted' : 'no silent alarm', heist.masked || caseHintOn() ? DESK_BAD : DESK_OK], ['Guard', guardOnDuty() ? (guard.state || 'idle') : guardOff() ? 'off shift' : 'not on the door', guardOnDuty() ? 'on the door' : 'the roster puts one on', guardOnDuty() ? DESK_OK : DESK_WARN], ['Shop', shop().open ? 'OPEN' : 'CLOSED', S.customer ? S.customer.who + ' at the window' : 'nobody at the window', shop().open ? DESK_OK : DESK_DIM]];
      var tw = (W - 60 - 3 * 12) / 4; tiles.forEach(function (t, i) { deskTile(ctx, 30 + i * (tw + 12), y, tw, 120, t[0], t[1], t[2], t[3]); }); y += 136;
      ctx.fillStyle = DESK_INK; ctx.font = '600 18px ' + DESK_FONT; ctx.fillText('INCIDENT LOG', 30, y); y += 28;
      var ev = S.log.filter(function (l) { return /🚨|🔒|🔓|🚓|🥊|💸|⚠|🔫|🗡|🦹|🚔/.test(l.msg); }).slice(0, 7);
      if (!ev.length) { ctx.fillStyle = DESK_MUTE; ctx.font = '17px ' + DESK_FONT; ctx.fillText('nothing to report', 30, y); }
      ev.forEach(function (l) { ctx.fillStyle = DESK_DIM; ctx.font = '15px "Cascadia Mono",Consolas,monospace'; ctx.fillText(l.t, 30, y + 2); ctx.fillStyle = l.kind === 'bad' ? DESK_BAD : DESK_INK; ctx.font = '17px ' + DESK_FONT; ctx.fillText(deskTrim(ctx, l.msg, W - 140), 100, y); y += 28; });
    }
    var by = H - 62; ctx.fillStyle = 'rgba(255,200,87,.06)'; ctx.fillRect(0, by - 10, W, 72);
    var bx = 30, o2 = { col: DESK_WARN, fill: 'rgba(255,200,87,.25)', size: 17 };
    tBtn(sc, ctx, bx, by, 200, 50, sec.view.on ? '📹 Leave the cameras' : '📹 Watch cameras', 'watch', 0, sec.view.on ? 'Leave the camera view' : 'Watch the cameras', sec.view.on, o2); bx += 210;
    tBtn(sc, ctx, bx, by, 170, 50, '🔒 Lock all', 'lockAll', 0, 'Lock every door', false, o2); bx += 180;
    tBtn(sc, ctx, bx, by, 170, 50, '🔓 Unlock all', 'unlockAll', 0, 'Unlock every door', false, o2); bx += 180;
    tBtn(sc, ctx, bx, by, 200, 50, '🚨 Silent alarm', 'panic', 0, S.upgrades.panic ? 'Trip the silent alarm' : 'No silent alarm fitted: Gear on the office PC', false, { col: DESK_BAD, fill: 'rgba(255,107,107,.25)', size: 17, off: !S.upgrades.panic }); bx += 210;
    tBtn(sc, ctx, bx, by, W - 30 - bx, 50, shop().open ? '🏪 Close the shop' : '🏪 Open the shop', 'shop', 0, shop().open ? 'Close the shop' : 'Open the shop', shop().open, o2);
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
  function officeSeat() { var inst = propInst.officeDesk; if (!inst) return null; var p = propWorld('officeDesk', 0, 0.78); return { x: p.x, z: p.z, yaw: inst.g.rotation.y }; }
  var pc = { open: false, app: null, el: null };
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
    ['settings', '⚙', 'Settings', function () { return '<div class="g3-box">' + settingsHtml() + '</div>'; }],
    ['guide', '📖', 'Guide', function () { return '<div class="g3-box g3-menu-body" style="margin:0;padding:12px 14px">' + guideHtml() + '</div>'; }]
  ];
  function pcEl() {
    if (pc.el) return pc.el;
    var d = document.createElement('div'); d.id = 'g3-pc'; d.className = 'g3-overlay dim'; d.hidden = true;
    d.innerHTML = '<div class="g3-pc"><div class="g3-pc-top"><span class="g3-pc-logo">🌿 Grow Co. OS</span><span class="g3-pc-clock" id="g3-pc-clock"></span><button class="g3-x" data-pc="close" title="Close (Esc)">✕</button></div><div class="g3-pc-desk" id="g3-pc-desk"></div><div class="g3-pc-win" id="g3-pc-win" hidden><div class="g3-pc-winhead"><span id="g3-pc-wintitle"></span><button class="g3-x" data-pc="home" title="Back to the desktop">🗕</button></div><div class="g3-pc-winbody" id="g3-pc-winbody"></div></div><div class="g3-pc-bar" id="g3-pc-bar"></div></div>';
    document.body.appendChild(d); pc.el = d;
    d.addEventListener('click', function (e) { var b = e.target.closest('[data-pc]'); if (!b) return; var a = b.getAttribute('data-pc'); sfx('click'); if (a === 'close') pcClose(); else if (a === 'home') { pc.app = null; pcRender(); } else pcApp(a); });
    d.addEventListener('mousedown', function (e) { if (e.target === d) pcClose(); });
    $('g3-pc-winbody').addEventListener('click', panelClick); $('g3-pc-winbody').addEventListener('input', panelInput); $('g3-pc-winbody').addEventListener('input', settingsInput);
    return d;
  }
  function pcOpen() {
    var seat = officeSeat(); if (seat && (!sit.on || sit.spot !== world.officeSeat)) { world.officeSeat = seat; if (sit.on) standUp(); sitDown(seat); }
    pcEl(); pc.open = true; ui.pcOpen = true; pc.el.hidden = false; document.exitPointerLock(); pcRender(); sfx('type');
  }
  function pcClose() { if (!pc.open) return; pc.open = false; ui.pcOpen = false; pc.el.hidden = true; if (!ui.blocked()) lockPointer(); sfx('close'); }
  function pcApp(id) { pc.app = id; pcRender(); }
  function pcRender() {
    if (!pc.open) return;
    $('g3-pc-clock').textContent = clockText() + ' · day ' + (S.day || 1) + ' · bank ' + money(S.bank);
    $('g3-pc-desk').innerHTML = PC_APPS.map(function (a) { return '<button class="g3-pc-icon" data-pc="' + a[0] + '"><span class="ico">' + a[1] + '</span><span class="n">' + a[2] + '</span></button>'; }).join('');
    $('g3-pc-bar').innerHTML = '<button class="g3-pc-start" data-pc="home">🌿 Start</button>' + PC_APPS.map(function (a) { return '<button class="g3-pc-task' + (pc.app === a[0] ? ' on' : '') + '" data-pc="' + a[0] + '">' + a[1] + ' ' + a[2] + '</button>'; }).join('');
    var app = null; PC_APPS.forEach(function (a) { if (a[0] === pc.app) app = a; });
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
    ['settings', '⚙️', 'Settings', function () { return settingsHtml(); }]
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
  function deviceClose() { if (!dev.open) return; dev.open = false; ui.deviceOpen = false; dev.el.hidden = true; if (!ui.blocked()) lockPointer(); sfx('close'); }
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
      if (!dev.app) { body.innerHTML = '<div class="g3-ph-home"><div class="g3-ph-widget"><b>' + clockText() + '</b><span>' + season() + ' · ' + X.weather.kind + ' · ' + (shop().open ? 'shop open' : 'shop closed') + '</span><span>bank ' + money(S.bank) + ' · pocket ' + money(S.pocket) + ' · heat ' + Math.round(X.heat) + '</span></div><div class="g3-ph-apps">' + PHONE_APPS.map(function (a) { var badge = a[0] === 'burner' ? jobsOf('phone').length : 0; return '<button class="g3-ph-app" data-dev="' + a[0] + '"><span class="ico">' + a[1] + (badge ? '<i>' + badge + '</i>' : '') + '</span><span class="n">' + a[2] + '</span></button>'; }).join('') + '</div></div>'; nav.innerHTML = '<button data-dev="close">✕ put away (F)</button>'; }
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
  function wheelClose(keep) { if (!wheel.open) return; wheel.open = false; ui.wheelOpen = false; wheel.el.hidden = true; if (!keep && !ui.blocked()) lockPointer(); }
  function wheelPick(i) { var it = wheel.items[i]; if (!it) return; wheelClose(true); sfx('click'); it.act(); afterAction(); if (!ui.blocked()) lockPointer(); }
  function paneDesk() {
//#if desk
    var d = deskBoard.data;
    var h = '<div class="g3-box"><div class="g3-chips">' + DESK_PAGES.map(function (p, i) { return '<button class="g3-btn' + (i === deskBoard.page ? ' primary' : '') + '" data-act="deskPage" data-id="' + i + '">' + DESK_PAGE_LABEL[p] + '</button>'; }).join('') + '</div><div class="desc">The wall screen shows the page picked here; it goes back to rotating when you close this panel.</div></div>';
    h += '<div class="g3-grid"><div class="g3-box"><h3>🧑‍💻 Seats</h3>';
    if (!d.seats.length) h += '<div class="g3-empty">no seat data yet</div>';
    d.seats.forEach(function (s) { h += '<div class="g3-row"><span class="ico">' + (s.running ? (s.state === 'needs-input' || s.state === 'input' ? '🔴' : s.state === 'working' || s.state === 'busy' ? '🟡' : '🟢') : '⚫') + '</span><span class="meta"><span class="n">' + esc(s.label) + (s.role ? ' <small>' + esc(s.role) + '</small>' : '') + '</span><span class="own">' + esc(s.running ? s.state : 'off') + (s.model ? ' · ' + esc(s.model) : '') + (s.detail ? ' · ' + esc(s.detail).slice(0, 90) : '') + '</span>' + (deskBoard.seatLog[s.key] || []).slice(-3).reverse().map(function (e) { return '<span class="own" style="display:block;opacity:.8">' + shortAgo(e.t) + ' ' + (SEAT_KIND_ICO[e.kind] || '·') + ' ' + esc(e.text).slice(0, 110) + '</span>'; }).join('') + '</span></div>'; });
    h += '<h3 style="margin-top:12px">🐕 Watchdogs' + (d.runnerAlive === false ? ' <small style="color:var(--bad,#ff6b6b)">runner down</small>' : '') + '</h3>';
    if (!d.checks.length) h += '<div class="g3-empty">no watchdog data</div>';
    d.checks.forEach(function (c) { h += '<div class="g3-row"><span class="ico">' + (c.state === 'healthy' || c.state === 'ok' ? '🟢' : c.state === 'unknown' ? '⚫' : c.state === 'degraded' ? '🟡' : '🔴') + '</span><span class="meta"><span class="n">' + esc(c.name) + '</span><span class="own">' + esc(c.detail).slice(0, 120) + '</span></span></div>'; });
    if (d.health) h += '<h3 style="margin-top:12px">🩺 Desk health</h3><div class="g3-chips">' + chip('ok', d.health.pass) + chip('warn', d.health.warn) + chip('fail', d.health.fail) + '</div>';
    h += '</div><div class="g3-box"><h3>🔀 Open PRs (' + d.prs.length + ')</h3>';
    if (!d.prs.length) h += '<div class="g3-empty">no open PRs</div>';
    d.prs.forEach(function (p) { h += '<div class="g3-row"><span class="ico">' + (p.draft ? '📝' : p.review === 'APPROVED' ? '✅' : p.review === 'CHANGES_REQUESTED' ? '❌' : '🕐') + '</span><span class="meta"><span class="n">' + esc(p.repo) + ' #' + p.n + ' · ' + esc(p.title) + '</span><span class="own">' + esc((p.author ? p.author + ' · ' : '') + (p.review || 'review pending').toLowerCase().replace('_', ' ')) + (p.draft ? ' · draft' : '') + (p.ci && p.ci.failure ? ' · CI failing' : p.ci && p.ci.pending ? ' · CI pending' : '') + ' · ' + deskAge(p.updated) + ' ago</span></span></div>'; });
    if (d.fleet && d.fleet.summary) { var fs = d.fleet.summary; h += '<h3 style="margin-top:12px">🚜 Fleet</h3><div class="g3-chips">' + chip('clean', fs.clean + '/' + fs.total) + chip('dirty', fs.dirty) + chip('behind', fs.behind) + chip('open PRs', fs.prs) + '</div>'; var dirty = d.fleet.mods.filter(function (m) { return m.status === 'dirty'; }); dirty.forEach(function (m) { h += '<div class="g3-row"><span class="ico">🟡</span><span class="meta"><span class="n">' + esc(m.mod) + '</span><span class="own">' + m.dirtyCount + ' uncommitted' + (m.ahead ? ' · ' + m.ahead + ' ahead' : '') + '</span></span></div>'; }); }
    if (d.notif) { h += '<h3 style="margin-top:12px">🔔 GitHub inbox · ' + d.notif.unread + ' unread</h3>'; d.notif.items.forEach(function (n) { h += '<div class="g3-row"><span class="ico">' + (n.unread ? '🔵' : '⚪') + '</span><span class="meta"><span class="n">' + esc(n.repo.split('/').pop()) + ' · ' + esc(n.title) + '</span><span class="own">' + esc(n.type + ' · ' + n.reason) + ' · ' + deskAge(n.updatedAt) + ' ago</span></span></div>'; }); }
    if (d.inbox && d.inbox.pending.length) { h += '<h3 style="margin-top:12px">📒 Ledger inbox · ' + d.inbox.pending.length + ' pending</h3>'; d.inbox.pending.slice(0, 5).forEach(function (it) { h += '<div class="g3-row"><span class="ico">🟡</span><span class="meta"><span class="n">' + esc(String(it.title || it.summary || it.line || '').slice(0, 120)) + '</span></span></div>'; }); }
    h += '<div class="g3-chips" style="margin-top:10px"><span class="g3-chip">updated <b>' + (d.at ? new Date(d.at).toLocaleTimeString('en-GB') : 'not yet') + '</b></span>' + (d.err ? '<span class="g3-chip amber">' + esc(d.err) + '</span>' : '') + '</div><button class="g3-btn wide" data-act="deskRefresh">↻ Refresh now</button><button class="g3-btn wide" data-act="deskOpen">↗ Open the desk in a new tab</button></div></div>';
//#else
    var all = dashRows(); var h = '<div class="g3-box"><div class="g3-chips">' + DESK_PAGES.map(function (p, i) { return '<button class="g3-btn' + (i === deskBoard.page ? ' primary' : '') + '" data-act="deskPage" data-id="' + i + '">' + DESK_PAGE_LABEL[p] + '</button>'; }).join('') + '</div></div>';
    (all[DESK_PAGES[deskBoard.page]] || []).forEach(function (r) { h += '<div class="g3-row"><span class="ico">📊</span><span class="meta"><span class="n">' + esc(r[0]) + ' · ' + esc(r[1]) + '</span><span class="own">' + esc(r[2]) + '</span></span></div>'; });
//#endif
    return h;
  }

