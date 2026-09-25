//@ the office wall screen, standalone build: the shop dashboard drawn from the save
  // ── Shop dashboard (office wall screen) ──
  // ── Shop dashboard: a rotating five-page screen fed by the save itself (standalone build: no network) ──
  var deskBoard = { canvas: null, tex: null, mesh: null, lastFetch: 0, busy: false, page: 0, pageAt: 0, hold: 0, zones: [], cur: null, hot: null, hotZone: null, card: null, scroll: {}, pinned: (function () { try { return localStorage.getItem('rf-grow-desk-manual') === '1'; } catch (e) { return false; } })(), drawAt: 0, tapAt: 0, tapX: 0, tapY: 0,
    data: { prs: [], seats: [], checks: [], feed: [], activity: [], fleet: null, notif: null, inbox: null, health: null, at: 0, err: '' } };
  var DESK_PAGES = ['overview', 'prs', 'seats', 'fleet', 'watch'];
  var DESK_PAGE_LABEL = { overview: 'Overview', prs: 'Stock', seats: 'Staff', fleet: 'Production', watch: 'Security' };
  function buildDeskBoard() {
    var c = document.createElement('canvas'); c.width = 1600; c.height = 900; deskBoard.canvas = c;
    deskBoard.tex = new THREE.CanvasTexture(c); deskBoard.tex.encoding = THREE.sRGBEncoding; deskBoard.tex.anisotropy = 4;
    box(2.7, 1.55, 0.06, MAT.black, -9.0, 1.95, -1.9, { cast: false });
    var scr = new THREE.Mesh(new THREE.PlaneGeometry(2.56, 1.44), new THREE.MeshBasicMaterial({ map: deskBoard.tex })); scr.position.set(-9.0, 1.95, -1.86); world.group.add(scr); deskBoard.mesh = scr;
    var hit = box(2.7, 1.55, 0.2, MAT.none, -9.0, 1.95, -1.85, { cast: false, receive: false }); interactable(hit, { kind: 'deskboard' });
    var glow = new THREE.PointLight(0x6fdc8c, 0.25, 4); glow.position.set(-9.0, 1.9, -1.4); scene.add(glow); deskBoard.glow = glow;
    signPlane(['SHOP DASHBOARD', 'touch screen · look at it and press E'], 1.8, 0.4, -9.0, 2.95, -1.88, 0, { titleColor: '#6fdc8c' });
    deskBoard.pageAt = now(); drawDeskBoard();
  }
  function fetchDesk() { deskBoard.lastFetch = now(); drawDeskBoard(); }   /* standalone: nothing is fetched, the dashboard reads the save */
  // page rotation: every 12 s, unless the panel is open (then the panel's choice sticks)
  function updateDeskBoard() {
    if (ui.panelOpen && ui.panelKind === 'desk') return;
    if (deskBoard.pinned || deskBoard.card || now() < deskBoard.hold) { deskBoard.pageAt = now(); return; }   /* touched lately, pinned, or reading a card: the page stays */
    if (now() - deskBoard.pageAt > 12000) { deskBoard.page = (deskBoard.page + 1) % DESK_PAGES.length; deskBoard.pageAt = now(); drawDeskBoard(); }
  }
  function deskSetPage(i) { deskBoard.page = ((i % DESK_PAGES.length) + DESK_PAGES.length) % DESK_PAGES.length; deskBoard.pageAt = now(); deskBoard.card = null; drawDeskBoard(); }
  var DESK_INK = '#e8f1ea', DESK_DIM = '#8fa596', DESK_MUTE = '#4d5e52', DESK_OK = '#6fdc8c', DESK_WARN = '#ffc857', DESK_BAD = '#ff6b6b';
  function deskAge(iso) { if (!iso) return ''; var ms = now() - new Date(iso).getTime(); if (ms < 0) return 'now'; var m = Math.floor(ms / 60000); if (m < 1) return 'just now'; if (m < 60) return m + 'm'; var h = Math.floor(m / 60); if (h < 48) return h + 'h'; return Math.floor(h / 24) + 'd'; }
  function deskTrim(ctx, text, maxW) { text = String(text || ''); if (ctx.measureText(text).width <= maxW) return text; while (text.length > 4 && ctx.measureText(text + '…').width > maxW) text = text.slice(0, -2); return text + '…'; }
  function deskDot(ctx, x, y, col, r) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r || 7, 0, Math.PI * 2); ctx.fill(); }
  function deskTile(ctx, x, y, w, h, label, value, sub, col) {
    ctx.fillStyle = 'rgba(255,255,255,.045)'; roundRect(ctx, x, y, w, h, 14); ctx.fill();
    ctx.fillStyle = col || DESK_OK; ctx.fillRect(x, y + 14, 4, h - 28);
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = DESK_DIM; ctx.font = '600 18px "Segoe UI",system-ui,sans-serif'; ctx.fillText(label.toUpperCase(), x + 20, y + 14);
    ctx.fillStyle = col || DESK_INK; ctx.font = '700 52px "Segoe UI",system-ui,sans-serif'; ctx.fillText(String(value), x + 20, y + 38);
    if (sub) { ctx.fillStyle = DESK_DIM; ctx.font = '17px "Segoe UI",system-ui,sans-serif'; ctx.fillText(deskTrim(ctx, sub, w - 40), x + 20, y + 98); }
  }
  function seatColor(s) { return s.state === 'working' || s.state === 'busy' ? DESK_WARN : s.state === 'needs-input' ? DESK_BAD : s.running ? DESK_OK : DESK_MUTE; }
  function prColor(p) { return p.draft ? DESK_DIM : p.review === 'APPROVED' ? DESK_OK : p.review === 'CHANGES_REQUESTED' ? DESK_BAD : DESK_WARN; }
  function checkColor(st) { return st === 'healthy' || st === 'ok' ? DESK_OK : st === 'degraded' || st === 'warn' ? DESK_WARN : st === 'unknown' ? DESK_MUTE : DESK_BAD; }
  function dashRows() {
    var X = typeof xs === 'function' ? xs() : { heat: 0, staff: {}, weather: { kind: 'clear' } }, T = typeof tob === 'function' ? tob() : null, packs = T ? CIG_KEYS.reduce(function (a, k) { return a + T.packs[k]; }, 0) : 0;
    var staffN = crewList().length + 1 + (X.staff.driver ? 1 : 0) + (X.staff.operator ? 1 : 0) + (X.staff.night ? 1 : 0);
    return {
      overview: [['Bank', money(S.bank), 'cash on site ' + money(cashOnSite())], ['Rep', String(Math.round(S.rep)), 'level ' + S.level], ['Market', (S.market || 1).toFixed(2) + '×', shop().open ? 'shop is open' : 'shop is closed'], ['Day', String(S.day || 1), (typeof season === 'function' ? season() : '') + ' · ' + X.weather.kind]],
      prs: [['Cured stash', Math.round(S.cured.g) + ' g', 'ready to pack'], ['Eighth bags', String(S.pkg.bags.n), 'on the goods shelf'], ['Joints', String(S.pkg.joints.n), 'on the goods shelf'], ['Cookies', String(S.pkg.cookies.n), 'on the goods shelf']],
      seats: [['People on the payroll', String(staffN), 'guard included'], ['Driver', X.staff.driver ? 'hired' : 'none', 'wholesale and deliveries'], ['Basement operator', X.staff.operator ? 'hired' : 'none', 'keeps the line running'], ['Night guard', X.staff.night ? 'hired' : 'none', 'stops break-ins']],
      fleet: [['Cigarette packs', String(packs), 'on the basement rack'], ['Plants growing', String(S.plants.length), 'in the tent'], ['Roof beds', String((X.roof || []).filter(function (b) { return b.stage !== 'empty'; }).length), 'sown'], ['Lab', X.lab && X.lab.job ? 'running' : 'idle', 'extraction and edibles']],
      watch: [['Heat', Math.round(X.heat) + ' / 100', X.heat >= 60 ? 'inspections likely' : X.heat >= 30 ? 'noticed' : 'quiet'], ['Robberies', String(S.stats.heists || 0), (S.stats.foiled || 0) + ' foiled'], ['Lost to robbers', money(S.stats.robbed || 0), 'all time'], ['Power', typeof powerOn === 'function' && !powerOn() ? 'CUT' : 'on', S.upgrades.generator ? 'generator standing by' : 'no generator']]
    };
  }

  // ── Touch screen: the board is worked by looking at it and pressing E (or clicking). Controls register themselves as zones while the page is drawn; the crosshair's spot on the screen is found from the ray's UV. ──
  var DESK_TAB_X = 470, DESK_TAB_W = 170, DESK_TAB_H = 44, DESK_TAB_Y = 30, DESK_FONT = '"Segoe UI",system-ui,sans-serif';
  var deskRay = new THREE.Raycaster();
  function deskZone(x, y, w, h, act, id, label, quiet) {
    var z = { x: x, y: y, w: w, h: h, act: act, id: id, label: label || '', key: act + ':' + (id === undefined ? '' : id) };
    deskBoard.zones.push(z);
    if (deskBoard.hot === z.key && !quiet) { var ctx = deskBoard.canvas.getContext('2d'); ctx.fillStyle = 'rgba(111,220,140,.16)'; roundRect(ctx, x, y, w, h, 10); ctx.fill(); ctx.strokeStyle = 'rgba(111,220,140,.85)'; ctx.lineWidth = 3; ctx.stroke(); }
    return z;
  }
  function deskBtn(ctx, x, y, w, h, text, act, id, label, on) {
    var z = deskZone(x, y, w, h, act, id, label, true), hot = deskBoard.hot === z.key;
    ctx.fillStyle = on ? 'rgba(111,220,140,.28)' : hot ? 'rgba(255,255,255,.16)' : 'rgba(255,255,255,.07)'; roundRect(ctx, x, y, w, h, 10); ctx.fill();
    ctx.strokeStyle = on || hot ? DESK_OK : 'rgba(255,255,255,.14)'; ctx.lineWidth = hot ? 3 : 2; ctx.stroke();
    ctx.fillStyle = on || hot ? DESK_OK : DESK_INK; ctx.font = '600 20px ' + DESK_FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x + w / 2, y + h / 2 + 1); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  }
  function deskTabs(ctx) { DESK_PAGES.forEach(function (p, i) { deskBtn(ctx, DESK_TAB_X + i * (DESK_TAB_W + 6), DESK_TAB_Y, DESK_TAB_W, DESK_TAB_H, DESK_TAB_LABEL[p], 'page', i, DESK_PAGE_LABEL[p], i === deskBoard.page); }); }
  function deskBar(ctx, W, H, overflow) {   /* the control strip along the bottom, right to left; returns where the feed text has to stop */
    var y = H - 42, bh = 36, x = W - 40;
    function b(text, act, id, label, on, w) { x -= w; deskBtn(ctx, x, y, w, bh, text, act, id, label, on); x -= 8; }
    b(deskBoard.pinned ? '✋ manual' : '🔁 auto', 'pin', 0, deskBoard.pinned ? 'Manual: the page you pick stays · tap for auto rotation' : 'Auto rotation · tap for manual', deskBoard.pinned, 124);
    b('↻', 'refresh', 0, 'Refresh', false, 44);
    if (overflow) { b('▼', 'scroll', 1, 'Scroll down', false, 44); b('▲', 'scroll', -1, 'Scroll up', false, 44); }
    return x;
  }
  function deskWrap(ctx, text, maxW, max) { var words = String(text || '').split(/\s+/), lines = [], cur = ''; words.forEach(function (w) { var t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }); if (cur) lines.push(cur); if (lines.length > max) { lines = lines.slice(0, max); lines[max - 1] = deskTrim(ctx, lines[max - 1] + ' …', maxW); } return lines; }
  function deskDrawCard(ctx, W, H) {   /* a detail card over the page: tapping outside it closes it */
    var cd = deskBoard.card; if (!cd) return;
    deskZone(0, 0, W, H, 'closeCard', 0, 'Close', true);
    ctx.fillStyle = 'rgba(4,10,6,.74)'; ctx.fillRect(0, 0, W, H);
    var cw = 1060, chh = 580, cx = (W - cw) / 2, cy = (H - chh) / 2 - 16;
    ctx.fillStyle = '#0f1a13'; roundRect(ctx, cx, cy, cw, chh, 18); ctx.fill(); ctx.strokeStyle = 'rgba(111,220,140,.5)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = cd.col || DESK_OK; ctx.fillRect(cx, cy + 24, 5, chh - 48);
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = DESK_INK; ctx.font = '800 32px ' + DESK_FONT; ctx.fillText(deskTrim(ctx, cd.title || '', cw - 60), cx + 30, cy + 26);
    var ly = cy + 76;
    if (cd.sub) { ctx.fillStyle = DESK_DIM; ctx.font = '20px ' + DESK_FONT; deskWrap(ctx, cd.sub, cw - 60, 2).forEach(function (l) { ctx.fillText(l, cx + 30, ly); ly += 26; }); ly += 8; }
    var budget = 12;
    (cd.lines || []).forEach(function (l) { if (budget <= 0) return; if (typeof l === 'string') l = ['', l]; ctx.font = '21px ' + DESK_FONT; var vs = deskWrap(ctx, l[1], cw - 290, Math.min(3, budget)); ctx.fillStyle = DESK_DIM; ctx.font = '600 17px ' + DESK_FONT; ctx.fillText(String(l[0] || '').toUpperCase(), cx + 30, ly + 3); vs.forEach(function (v) { ctx.fillStyle = l[2] || DESK_INK; ctx.font = '21px ' + DESK_FONT; ctx.fillText(v, cx + 240, ly); ly += 30; budget--; }); ly += 6; });
    var by = cy + chh - 60; deskBtn(ctx, cx + cw - 150, by, 120, 40, 'Close', 'closeCard', 0, 'Close');
    if (cd.url) deskBtn(ctx, cx + cw - 400, by, 236, 40, '🔗 Open on GitHub', 'open', 0, 'Open on GitHub in a new tab');
    if (cd.foot) { ctx.fillStyle = DESK_MUTE; ctx.font = '17px ' + DESK_FONT; ctx.fillText(deskTrim(ctx, cd.foot, cw - 460), cx + 30, by + 10); }
  }
  function deskDrawCursor(ctx) {
    var c = deskBoard.cur, t = now();
    if (deskBoard.tapAt && t - deskBoard.tapAt < 350) { var k = (t - deskBoard.tapAt) / 350; ctx.strokeStyle = 'rgba(111,220,140,' + (1 - k).toFixed(2) + ')'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(deskBoard.tapX, deskBoard.tapY, 14 + k * 50, 0, Math.PI * 2); ctx.stroke(); }
    if (!c) return;
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(c.x, c.y, 14, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = deskBoard.hotZone ? DESK_OK : 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(c.x, c.y, 5, 0, Math.PI * 2); ctx.fill();
  }
  function deskTouchUpdate() {   /* every frame: where on the screen is the crosshair, and which control is under it */
    var on = focus && focus.data.kind === 'deskboard' && deskBoard.mesh, cur = null, hot = null;
    if (on) {
      deskRay.setFromCamera(center, camera); deskRay.far = 4.5; var hs = deskRay.intersectObject(deskBoard.mesh, false);
      if (hs.length && hs[0].uv) { cur = { x: hs[0].uv.x * deskBoard.canvas.width, y: (1 - hs[0].uv.y) * deskBoard.canvas.height }; for (var i = deskBoard.zones.length - 1; i >= 0; i--) { var z = deskBoard.zones[i]; if (cur.x >= z.x && cur.x <= z.x + z.w && cur.y >= z.y && cur.y <= z.y + z.h) { hot = z; break; } } }
    }
    var hk = hot ? hot.key : null, moved = !!cur !== !!deskBoard.cur || (cur && (Math.abs(cur.x - deskBoard.cur.x) > 2 || Math.abs(cur.y - deskBoard.cur.y) > 2));
    deskBoard.cur = cur; deskBoard.hotZone = hot;
    if (hk !== deskBoard.hot) { deskBoard.hot = hk; drawDeskBoard(); }
    else if ((moved || (deskBoard.tapAt && now() - deskBoard.tapAt < 400)) && now() - deskBoard.drawAt > 66) drawDeskBoard();
  }
  var DESK_ROWS = { prs: 11, fleet: 28, watch: 6 };
  function deskOff(page) { return deskBoard.scroll[page] || 0; }
  function deskOverflow(page) { return DESK_ROWS[page] ? deskTotal(page) > DESK_ROWS[page] : false; }
  function deskScroll(dir) { var page = DESK_PAGES[deskBoard.page], rows = DESK_ROWS[page]; if (!rows) return false; var max = Math.max(0, deskTotal(page) - rows); var was = deskOff(page); deskBoard.scroll[page] = clamp(was + dir * rows, 0, max); return deskBoard.scroll[page] !== was; }
  function deskWheel(dir) { deskBoard.hold = now() + 45000; if (!deskOverflow(DESK_PAGES[deskBoard.page]) || !deskScroll(dir)) deskSetPage(deskBoard.page + dir); else drawDeskBoard(); sfx('click'); }
  function deskTap() {
    var z = deskBoard.hotZone, c = deskBoard.cur; deskBoard.hold = now() + 45000;
    if (c) { deskBoard.tapAt = now(); deskBoard.tapX = c.x; deskBoard.tapY = c.y; }
    if (!z) { if (deskBoard.card) deskBoard.card = null; drawDeskBoard(); return; }
    if (z.act === 'page') deskSetPage(z.id);
    else if (z.act === 'flip') deskSetPage(deskBoard.page + z.id);
    else if (z.act === 'scroll') deskScroll(z.id);
    else if (z.act === 'refresh') { fetchDesk(); toast('↻ Refreshing the board', ''); }
    else if (z.act === 'pin') { deskBoard.pinned = !deskBoard.pinned; try { localStorage.setItem('rf-grow-desk-manual', deskBoard.pinned ? '1' : ''); } catch (e) {} toast(deskBoard.pinned ? '✋ Manual: the page you pick stays on the screen' : '🔁 Auto: the board rotates its pages again', ''); }
    else if (z.act === 'closeCard') deskBoard.card = null;
    else if (z.act === 'open') { if (deskBoard.card && deskBoard.card.url) { window.open(deskBoard.card.url, '_blank'); toast('🔗 Opened in a new browser tab', 'good'); } }
    else deskTapItem(z, deskBoard.data);
    drawDeskBoard();
  }

  var DESK_TAB_LABEL = DESK_PAGE_LABEL;
  function deskTotal() { return 0; }
  function deskTapItem(z, d) {
    if (z.act === 'tile') { var r = (dashRows()[DESK_PAGES[deskBoard.page]] || [])[z.id]; if (!r) return; deskBoard.card = { title: r[0], sub: DESK_PAGE_LABEL[DESK_PAGES[deskBoard.page]], lines: [['value', r[1], DESK_OK], ['note', r[2]]] }; }
  }
  function drawDeskBoard() {
    var c = deskBoard.canvas; if (!c) return; var ctx = c.getContext('2d'), W = c.width, H = c.height, page = DESK_PAGES[deskBoard.page], rows = dashRows()[page] || [];
    deskBoard.zones = []; deskBoard.drawAt = now();
    ctx.fillStyle = '#07110b'; ctx.fillRect(0, 0, W, H); ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    ctx.fillStyle = DESK_OK; ctx.font = '800 40px "Segoe UI",system-ui,sans-serif'; ctx.fillText('GROW CO.', 40, 26);
    deskTabs(ctx);
    rows.forEach(function (r, i) { deskZone(40 + (i % 2) * 770, 120 + Math.floor(i / 2) * 330, 740, 300, 'tile', i, r[0]); deskTile(ctx, 40 + (i % 2) * 770, 120 + Math.floor(i / 2) * 330, 740, 300, r[0], r[1], r[2], DESK_OK); });
    ctx.fillStyle = 'rgba(111,220,140,.08)'; ctx.fillRect(0, H - 46, W, 46); deskBar(ctx, W, H, false);
    ctx.fillStyle = DESK_MUTE; ctx.font = '20px "Segoe UI",system-ui,sans-serif'; ctx.fillText('shop dashboard · touch screen: look at a tile and press E', 40, H - 34);
    deskDrawCard(ctx, W, H); deskDrawCursor(ctx);
    deskBoard.tex.needsUpdate = true;
  }

  // ══ Interactive screens (2026-09-24): one touch layer for every in-world screen, the till tablet, the security desk screen, the office PC, the phone, the delivery tablet and the quick wheel ══
  var TOUCH = { list: [] };
  function touchScreen(o) {
    var sc = { id: o.id, kind: o.kind, w: o.w, h: o.h, zones: [], cur: null, hot: null, hotZone: null, tapAt: 0, tapX: 0, tapY: 0, drawAt: 0, live: o.live || 0, draw: o.draw, tap: o.tap, wheel: o.wheel || null, canvas: document.createElement('canvas') };
    sc.scale = o.scale || 1; sc.canvas.width = Math.round(o.w * sc.scale); sc.canvas.height = Math.round(o.h * sc.scale); sc.tex = new THREE.CanvasTexture(sc.canvas);   /* scale > 1 draws the same layout onto more pixels, so the text reads bigger on the same plane */ sc.tex.encoding = THREE.sRGBEncoding; sc.tex.anisotropy = 4;
    sc.mesh = new THREE.Mesh(new THREE.PlaneGeometry(o.pw, o.ph), new THREE.MeshBasicMaterial({ map: sc.tex })); TOUCH.list.push(sc); return sc;
  }
  function tZone(sc, x, y, w, h, act, id, label, quiet) { var z = { x: x, y: y, w: w, h: h, act: act, id: id, label: label || '', key: act + ':' + (id === undefined ? '' : id) }; sc.zones.push(z); if (sc.hot === z.key && !quiet) { var ctx = sc.canvas.getContext('2d'); ctx.fillStyle = 'rgba(111,220,140,.16)'; roundRect(ctx, x, y, w, h, 10); ctx.fill(); ctx.strokeStyle = 'rgba(111,220,140,.85)'; ctx.lineWidth = 3; ctx.stroke(); } return z; }
  function tBtn(sc, ctx, x, y, w, h, text, act, id, label, on, o) {
    o = o || {}; var z = tZone(sc, x, y, w, h, act, id, label, true), hot = sc.hot === z.key && !o.off, col = o.col || DESK_OK;
    ctx.fillStyle = o.off ? 'rgba(255,255,255,.03)' : on ? (o.fill || 'rgba(111,220,140,.28)') : hot ? 'rgba(255,255,255,.16)' : 'rgba(255,255,255,.07)'; roundRect(ctx, x, y, w, h, o.r || 10); ctx.fill();
    ctx.strokeStyle = o.off ? 'rgba(255,255,255,.08)' : on || hot ? col : 'rgba(255,255,255,.14)'; ctx.lineWidth = hot ? 3 : 2; ctx.stroke();
    ctx.fillStyle = o.off ? DESK_MUTE : on || hot ? col : DESK_INK; ctx.font = (o.weight || '600') + ' ' + (o.size || 20) + 'px ' + DESK_FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(deskTrim(ctx, text, w - 16), x + w / 2, y + h / 2 + 1 - (o.sub ? 9 : 0));
    if (o.sub) { ctx.fillStyle = DESK_DIM; ctx.font = '14px ' + DESK_FONT; ctx.fillText(o.sub, x + w / 2, y + h - 14); }
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  }
  function tCursor(sc, ctx) {
    var c = sc.cur, t = now();
    if (sc.tapAt && t - sc.tapAt < 350) { var k = (t - sc.tapAt) / 350; ctx.strokeStyle = 'rgba(111,220,140,' + (1 - k).toFixed(2) + ')'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(sc.tapX, sc.tapY, 10 + k * 40, 0, Math.PI * 2); ctx.stroke(); }
    if (!c) return; var r = Math.max(8, Math.round(sc.w / 110));
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = sc.hotZone ? DESK_OK : 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(c.x, c.y, r * 0.36, 0, Math.PI * 2); ctx.fill();
  }
  function tDraw(sc) { var ctx = sc.canvas.getContext('2d'); ctx.setTransform(sc.scale, 0, 0, sc.scale, 0, 0); sc.zones = []; sc.drawAt = now(); ctx.textAlign = 'left'; ctx.textBaseline = 'top'; sc.draw(sc, ctx); tCursor(sc, ctx); sc.tex.needsUpdate = true; }
  function touchUpdate() {   /* every frame: for the screen under the crosshair, where on it the crosshair is and which control that is */
    var k = focus && focus.data.kind;
    for (var s = 0; s < TOUCH.list.length; s++) {
      var sc = TOUCH.list[s], on = k === sc.kind, cur = null, hot = null;
      if (on) { deskRay.setFromCamera(center, camera); deskRay.far = 4.5; var hs = deskRay.intersectObject(sc.mesh, false); if (hs.length && hs[0].uv) { cur = { x: hs[0].uv.x * sc.w, y: (1 - hs[0].uv.y) * sc.h }; for (var i = sc.zones.length - 1; i >= 0; i--) { var z = sc.zones[i]; if (cur.x >= z.x && cur.x <= z.x + z.w && cur.y >= z.y && cur.y <= z.y + z.h) { hot = z; break; } } } }
      var hk = hot ? hot.key : null, moved = !!cur !== !!sc.cur || (cur && (Math.abs(cur.x - sc.cur.x) > 2 || Math.abs(cur.y - sc.cur.y) > 2));
      sc.cur = cur; sc.hotZone = hot;
      if (on && cur && !xs().touchHint) touchHint();
      if (hk !== sc.hot) { sc.hot = hk; tDraw(sc); }
      else if ((moved || (sc.tapAt && now() - sc.tapAt < 400) || (on && sc.live && now() - sc.drawAt > sc.live)) && now() - sc.drawAt > 66) tDraw(sc);
    }
  }
  function touchHint() { xs().touchHint = 1; toast('👆 Screens are touch screens: look at a control and press E or click. The mouse wheel flips pages.', ''); save(); }
  function touchTap(sc) { var z = sc.hotZone, c = sc.cur; if (c) { sc.tapAt = now(); sc.tapX = c.x; sc.tapY = c.y; } sc.tap(z); tDraw(sc); }
  function touchFor(kind) { for (var i = 0; i < TOUCH.list.length; i++) if (TOUCH.list[i].kind === kind) return TOUCH.list[i]; return null; }
  function touchPrompt(sc, title, idle) { var hz = sc.hotZone; return title + ' <small>' + (hz ? 'tap: ' + esc(hz.label) : idle) + '</small>'; }

