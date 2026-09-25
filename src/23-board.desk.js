//@ the office wall screen, desk build: the Implementation Desk board fed by the desk API and its live seat feed
  // ── Live desk board (office wall screen fed by the desk's own API) ──
  // ── Live desk board: a rotating five-page screen fed by the Implementation Desk API (refreshes every 30 s) ──
  var deskBoard = { seatLog: (function () { try { var o = JSON.parse(localStorage.getItem('rf-grow-seatlog') || '{}'), cut = Date.now() - 6 * 3600000; Object.keys(o).forEach(function (k) { o[k] = (o[k] || []).filter(function (e) { return e && e.t > cut; }); }); return o; } catch (e) { return {}; } })(), seatKeepAt: 0, seatToastAt: {}, seatDrawAt: 0, es: null, canvas: null, tex: null, mesh: null, lastFetch: 0, busy: false, page: 0, pageAt: 0, hold: 0, zones: [], cur: null, hot: null, hotZone: null, card: null, scroll: {}, view: (function () { try { return localStorage.getItem('rf-grow-desk-view') === 'shop' ? 'shop' : 'desk'; } catch (e) { return 'desk'; } })(), pinned: (function () { try { return localStorage.getItem('rf-grow-desk-manual') === '1'; } catch (e) { return false; } })(), drawAt: 0, tapAt: 0, tapX: 0, tapY: 0,
    data: { prs: [], seats: [], checks: [], feed: [], activity: [], fleet: null, notif: null, inbox: null, health: null, at: 0, err: '' } };
  var DESK_PAGES = ['overview', 'prs', 'seats', 'fleet', 'watch'];
  var DESK_PAGE_LABEL = { overview: 'Overview', prs: 'Pull requests', seats: 'Seats & ledger', fleet: 'Fleet: branches and sync', watch: 'Watchdogs & health' };
  function buildDeskBoard() {
    var c = document.createElement('canvas'); c.width = 1600; c.height = 900; deskBoard.canvas = c;
    deskBoard.tex = new THREE.CanvasTexture(c); deskBoard.tex.encoding = THREE.sRGBEncoding; deskBoard.tex.anisotropy = 4;
    box(2.7, 1.55, 0.06, MAT.black, -9.0, 1.95, -1.9, { cast: false });
    var scr = new THREE.Mesh(new THREE.PlaneGeometry(2.56, 1.44), new THREE.MeshBasicMaterial({ map: deskBoard.tex })); scr.position.set(-9.0, 1.95, -1.86); world.group.add(scr); deskBoard.mesh = scr;
    var hit = box(2.7, 1.55, 0.2, MAT.none, -9.0, 1.95, -1.85, { cast: false, receive: false }); interactable(hit, { kind: 'deskboard' });
    var glow = new THREE.PointLight(0x6fdc8c, 0.25, 4); glow.position.set(-9.0, 1.9, -1.4); scene.add(glow); deskBoard.glow = glow;
    signPlane(['LIVE DESK', 'touch screen · look at it and press E'], 1.8, 0.4, -9.0, 2.95, -1.88, 0, { titleColor: '#6fdc8c' });
    deskBoard.pageAt = now(); drawDeskBoard();
  }
  // ── the desk's live event stream: every seat report lands here the moment its hook fires ──
  var SEAT_KIND_ICO = { say: '💬', tool: '⚙', ask: '▶', done: '✓', input: '❗', start: '●', end: '■' };
  function seatKindCol(k) { return k === 'say' ? DESK_INK : k === 'done' ? DESK_OK : k === 'input' ? DESK_BAD : k === 'ask' ? DESK_WARN : DESK_DIM; }
  function shortAgo(t) { var s = Math.max(0, Math.round((now() - t) / 1000)); return s < 60 ? s + 's' : s < 3600 ? Math.floor(s / 60) + 'm' : Math.floor(s / 3600) + 'h'; }
  function deskStream() {
    if (deskBoard.es || typeof EventSource === 'undefined') return;
    try { var es = new EventSource('/api/events'); deskBoard.es = es; es.addEventListener('seat', function (e) { try { seatEvent(JSON.parse(e.data)); } catch (err) {} }); } catch (err) {}   /* EventSource reconnects on its own if the desk restarts */
  }
  function seatEvent(p) {
    if (!p || !p.key) return;
    var L = deskBoard.seatLog[p.key] = deskBoard.seatLog[p.key] || [], ev = p.event || '';
    var kind = ev === 'Say' ? 'say' : ev === 'UserPromptSubmit' ? 'ask' : ev === 'PreToolUse' || ev === 'PostToolUse' ? (p.state === 'input' ? 'input' : 'tool') : ev === 'Stop' ? 'done' : p.state === 'input' ? 'input' : ev === 'SessionStart' || p.state === 'starting' ? 'start' : p.state === 'off' ? 'end' : '';
    if (kind === 'ask' && /</.test(p.detail || '')) p.detail = (/cross-session-message/.test(p.detail) ? '✉ ' : '') + String(p.detail).replace(/<[^>]*>?/g, ' ').replace(/s+/g, ' ').trim();
    var text = String(p.detail || '') || (kind === 'done' ? 'finished its turn' : kind === 'start' ? 'started' : kind === 'end' ? 'session ended' : '');
    if (kind && text) {
      var same = L.slice(-3).filter(function (e) { return e.text === text; }).pop();
      if (kind === 'done' && same) { same.kind = 'done'; same.t = now(); }   /* the closing message was already shown as it was written: mark it, don't repeat it */
      else if (L.length && L[L.length - 1].text === text && L[L.length - 1].kind === kind) L[L.length - 1].t = now();   // the tool's "after" report repeats its "before"
      else { L.push({ t: now(), kind: kind, text: text }); if (L.length > 12) L.shift(); }
    }
    var s = (deskBoard.data.seats || []).filter(function (x) { return x.key === p.key; })[0], prev = s ? s.state : '';
    if (s) { s.running = p.state !== 'off'; s.state = p.state === 'off' ? 'off' : p.state; s.detail = p.detail || ''; if (p.since) s.since = p.since; }
    if (ui.started && s) {   // you are playing, not watching the desk: say when a seat wants you or has finished
      var lab = s.label || p.key;
      if (p.state === 'input' && prev !== 'input') toast('🪑 ' + lab + ' needs you: ' + (p.detail || 'waiting on you'), 'bad');
      else if (kind === 'done' && prev === 'working' && now() - (deskBoard.seatToastAt[p.key] || 0) > 15000) { deskBoard.seatToastAt[p.key] = now(); toast('🪑 ' + lab + ' is done: ' + text.slice(0, 90) + (text.length > 90 ? '…' : ''), ''); }
    }
    if (now() - deskBoard.seatKeepAt > 2000) { deskBoard.seatKeepAt = now(); try { localStorage.setItem('rf-grow-seatlog', JSON.stringify(deskBoard.seatLog)); } catch (e) {} }   /* a reload of the game keeps the last few hours of reports */
    if (DESK_PAGES[deskBoard.page] === 'seats' && now() - deskBoard.seatDrawAt > 700) { deskBoard.seatDrawAt = now(); drawDeskBoard(); }
  }
  function parseLedger(tail) {   // "### [2026-09-25] Hazel - Title" entries, newest first, each with its opening lines for the detail card
    var out = [], cur = null;
    String(tail || '').split(/\r?\n/).forEach(function (l) {
      var m = /^### \[(\d{4}-\d{2}-\d{2})\]\s+(.+?)\s+-\s+(.+)$/.exec(l);
      if (m) { cur = { date: m[1], who: m[2].trim(), title: m[3].trim(), body: [], more: 0 }; out.push(cur); return; }
      if (!cur) return; var t = l.replace(/^[\s>*#|-]+/, '').replace(/[`*_]/g, '').replace(/\|/g, ' ').replace(/\s+/g, ' ').trim();
      if (!t) return; if (cur.body.length < 8) cur.body.push(t.slice(0, 400)); else cur.more++;
    });
    return out.reverse();
  }
  function fetchDesk() {
    deskStream();
    if (deskBoard.busy) return; deskBoard.busy = true; deskBoard.lastFetch = now();
    var get = function (u) { return Promise.race([fetch(u, { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }), new Promise(function (ok) { setTimeout(function () { ok(null); }, 6000); })]); };   /* each endpoint gets six seconds: one slow or hung API (readiness has done this) must not stop the whole board from updating */
    if (now() - (deskBoard.ledgerAt || 0) > 120000) { deskBoard.ledgerAt = now(); get('/api/ecosystem/ledger?lines=4000').then(function (r) { if (r && typeof r.tail === 'string') { deskBoard.data.ledger = parseLedger(r.tail); drawDeskBoard(); } else deskBoard.ledgerAt = 0; }); }   /* the whole ledger's tail, every two minutes: entries are long, so it takes a few thousand lines to reach a dozen */
    Promise.all([get('/api/prs'), get('/api/seats/status'), get('/api/watchdogs'), get('/api/notifications/feed'), get('/api/fleet'), get('/api/github/notifications'), get('/api/ledger/inbox'), get('/api/admin/health'), get('/api/activity')]).then(function (res) {
      var d = deskBoard.data; d.err = '';
      if (res[0] && res[0].prs) d.prs = res[0].prs.map(function (p) { return { repo: p.repo, n: p.number, title: p.title, draft: p.isDraft, review: p.reviewDecision, ci: p.ci, updated: p.updatedAt, mergeable: p.mergeable, author: p.author && (p.author.login || p.author) || '', add: p.additions || 0, del: p.deletions || 0, head: p.headRefName || '', url: p.url || '' }; });
      if (res[1] && res[1].seats) d.seats = Object.keys(res[1].seats).map(function (k) { var s = res[1].seats[k]; var act = s.activity || {}; return { key: k, label: s.label || k, role: s.role || '', running: !!s.running, state: s.running ? (act.state || 'idle') : 'off', detail: act.detail || '', since: act.since || 0, model: s.model || '', ledger: (s.ledger || []).slice(0, 2), ledgerTotal: s.ledgerTotal || 0 }; });
      (d.seats || []).forEach(function (s) { var L = deskBoard.seatLog[s.key]; if ((!L || !L.length) && s.detail) deskBoard.seatLog[s.key] = [{ t: s.since || now(), kind: s.state === 'input' ? 'input' : s.state === 'idle' ? 'done' : 'tool', text: s.detail }]; });   /* until the stream has news, start from what the status call knows */
      if (res[2] && res[2].checks) { d.checks = Object.keys(res[2].checks).map(function (k) { var ch = res[2].checks[k]; return { name: ch.name || k, state: ch.state || '?', detail: ch.detail || '' }; }); d.runnerAlive = res[2].runnerAlive; }
      if (res[3] && res[3].events) d.feed = res[3].events.slice(-6).reverse().map(function (e) { return { t: e.timestamp, m: (e.source ? e.source + ' · ' : '') + (e.message || e.type || '') }; });
      if (res[4] && res[4].mods) { var fm = res[4].mods.map(function (m) { var dc = m.clean === false ? Math.max(1, String(m.status || '').split('\n').filter(Boolean).length) : 0, ah = +m.ahead || 0, bh = +m.behind || 0, age = /\(([^()]*ago)\)\s*$/.exec(m.lastCommit || ''); return { mod: m.name, status: dc ? 'dirty' : ah ? 'ahead' : bh ? 'behind' : 'clean', branch: m.branch || '', ahead: ah, behind: bh, openPrs: m.openPrs || 0, dirtyCount: dc, lastCommit: m.lastCommit || '', age: age ? age[1] : '' }; });   /* /api/fleet: the readiness call it replaces never answers */
        d.fleet = { stale: !!res[4].stale, mods: fm, summary: { total: fm.length, clean: fm.filter(function (m) { return m.status === 'clean'; }).length, dirty: fm.filter(function (m) { return m.status === 'dirty'; }).length, behind: fm.filter(function (m) { return m.behind; }).length, prs: fm.reduce(function (a, m) { return a + m.openPrs; }, 0) } }; }
      if (res[5]) d.notif = { unread: res[5].unread || 0, items: (res[5].notifications || []).slice(0, 5) };
      if (res[6]) d.inbox = { pending: res[6].pending || [], unacked: res[6].unacked || [] };
      if (res[7] && res[7].checks) d.health = { pass: res[7].pass || 0, warn: res[7].warn || 0, fail: res[7].fail || 0, checks: res[7].checks };
      if (res[8] && res[8].events) d.activity = res[8].events.slice(0, 8).map(function (e) { return { t: e.ts, kind: e.kind, title: e.title, detail: e.detail, ok: e.ok }; });
      if (!res[0] && !res[1] && !res[2]) d.err = 'desk API unreachable';
      d.at = now(); deskBoard.busy = false; drawDeskBoard();
    }).catch(function () { deskBoard.data.err = 'desk API error'; deskBoard.busy = false; drawDeskBoard(); });
  }
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
  function seatColor(s) { return s.state === 'working' || s.state === 'busy' ? DESK_WARN : s.state === 'needs-input' || s.state === 'input' ? DESK_BAD : s.running ? DESK_OK : DESK_MUTE; }
  function prColor(p) { return p.draft ? DESK_DIM : p.review === 'APPROVED' ? DESK_OK : p.review === 'CHANGES_REQUESTED' ? DESK_BAD : DESK_WARN; }
  function checkColor(st) { return st === 'healthy' || st === 'ok' ? DESK_OK : st === 'degraded' || st === 'warn' ? DESK_WARN : st === 'unknown' ? DESK_MUTE : DESK_BAD; }

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
  function deskTabs(ctx) { DESK_PAGES.forEach(function (p, i) { deskBtn(ctx, DESK_TAB_X + i * (DESK_TAB_W + 6), DESK_TAB_Y, DESK_TAB_W, DESK_TAB_H, deskBoard.view === 'shop' ? SHOP_PAGE_LABEL[p] : DESK_TAB_LABEL_DESK[p], 'page', i, deskLabel(p), i === deskBoard.page); }); }
  function deskBar(ctx, W, H, overflow) {   /* the control strip along the bottom, right to left; returns where the feed text has to stop */
    var y = H - 42, bh = 36, x = W - 40;
    function b(text, act, id, label, on, w) { x -= w; deskBtn(ctx, x, y, w, bh, text, act, id, label, on); x -= 8; }
    b(deskBoard.pinned ? '✋ manual' : '🔁 auto', 'pin', 0, deskBoard.pinned ? 'Manual: the page you pick stays · tap for auto rotation' : 'Auto rotation · tap for manual', deskBoard.pinned, 124);
    b('↻', 'refresh', 0, 'Refresh', false, 44);
    if (overflow) { b('▼', 'scroll', 1, 'Scroll down', false, 44); b('▲', 'scroll', -1, 'Scroll up', false, 44); }
    b(deskBoard.view === 'shop' ? '🖥 desk view' : '🏪 shop view', 'view', 0, deskBoard.view === 'shop' ? 'Switch to the live desk board' : 'Switch to the shop dashboard', false, 150);
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
  function deskOverflow(page) { return deskBoard.view !== 'shop' && DESK_ROWS[page] ? deskTotal(page) > DESK_ROWS[page] : false; }
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
    else if (z.act === 'view') { deskBoard.view = deskBoard.view === 'shop' ? 'desk' : 'shop'; deskBoard.card = null; deskBoard.scroll = {}; try { localStorage.setItem('rf-grow-desk-view', deskBoard.view); } catch (e) {} toast(deskBoard.view === 'shop' ? '🏪 Shop dashboard on the screen' : '🖥 Live desk board on the screen', ''); }
    else if (z.act === 'open') { if (deskBoard.card && deskBoard.card.url) { window.open(deskBoard.card.url, '_blank'); toast('🔗 Opened in a new browser tab', 'good'); } }
    else deskTapItem(z, deskBoard.data);
    drawDeskBoard();
  }

  var DESK_TAB_LABEL_DESK = { overview: 'Overview', prs: 'PRs', seats: 'Seats', fleet: 'Fleet', watch: 'Watch' };
  var SHOP_PAGE_LABEL = { overview: 'Overview', prs: 'Stock', seats: 'Staff', fleet: 'Production', watch: 'Security' };
  function deskLabel(p) { return (deskBoard.view === 'shop' ? SHOP_PAGE_LABEL : DESK_PAGE_LABEL)[p]; }
  function deskTotal(page) { var d = deskBoard.data; return page === 'prs' ? d.prs.length : page === 'fleet' ? (d.fleet ? d.fleet.mods.length : 0) : page === 'watch' ? d.checks.length : 0; }
  function deskCiText(p) { var ci = p.ci || {}; return ci.failure ? 'failing' : ci.pending ? 'pending' : ci.success ? 'passing' : 'none'; }
  function dashRows() {
    var X = xs(), T = typeof tob === 'function' ? tob() : null, packs = T && T.packs ? CIG_KEYS.reduce(function (a, k) { return a + (T.packs[k] || 0); }, 0) : 0;
    var staffN = crewList().length + 1 + (X.staff.driver ? 1 : 0) + (X.staff.operator ? 1 : 0) + (X.staff.night ? 1 : 0);
    return {
      overview: [['Bank', money(S.bank), 'cash on site ' + money(cashOnSite())], ['Rep', String(Math.round(S.rep)), 'level ' + S.level], ['Market', (S.market || 1).toFixed(2) + '×', shop().open ? 'shop is open' : 'shop is closed'], ['Day', String(S.day || 1), (typeof season === 'function' ? season() : '') + ' · ' + X.weather.kind]],
      prs: [['Cured stash', Math.round(S.cured.g) + ' g', 'ready to pack'], ['Eighth bags', String(S.pkg.bags.n), 'on the goods shelf'], ['Joints', String(S.pkg.joints.n), 'on the goods shelf'], ['Cookies', String(S.pkg.cookies.n), 'on the goods shelf']],
      seats: [['People on the payroll', String(staffN), 'guard included'], ['Driver', X.staff.driver ? 'hired' : 'none', 'wholesale and deliveries'], ['Basement operator', X.staff.operator ? 'hired' : 'none', 'keeps the line running'], ['Night guard', X.staff.night ? 'hired' : 'none', 'stops break-ins']],
      fleet: [['Cigarette packs', String(packs), 'on the basement rack'], ['Plants growing', String(S.plants.length), 'in the tent'], ['Roof beds', String((X.roof || []).filter(function (b) { return b.stage !== 'empty'; }).length), 'sown'], ['Lab', X.lab && X.lab.job ? 'running' : 'idle', 'extraction and edibles']],
      watch: [['Heat', Math.round(X.heat) + ' / 100', X.heat >= 60 ? 'inspections likely' : X.heat >= 30 ? 'noticed' : 'quiet'], ['Robberies', String(S.stats.heists || 0), (S.stats.foiled || 0) + ' foiled'], ['Lost to robbers', money(S.stats.robbed || 0), 'all time'], ['Power', typeof powerOn === 'function' && !powerOn() ? 'CUT' : 'on', S.upgrades.generator ? 'generator standing by' : 'no generator']]
    };
  }
  function drawShopBoard() {
    var c = deskBoard.canvas, ctx = c.getContext('2d'), W = c.width, H = c.height, page = DESK_PAGES[deskBoard.page], rows = dashRows()[page] || [];
    deskBoard.zones = []; deskBoard.drawAt = now();
    ctx.fillStyle = '#07110b'; ctx.fillRect(0, 0, W, H); ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    ctx.fillStyle = DESK_OK; ctx.font = '800 40px ' + DESK_FONT; ctx.fillText('GROW CO.', 40, 26);
    ctx.fillStyle = DESK_INK; ctx.font = '600 26px ' + DESK_FONT; ctx.fillText(SHOP_PAGE_LABEL[page], 40, 78);
    ctx.textAlign = 'right'; ctx.fillStyle = DESK_INK; ctx.font = '700 40px "Cascadia Mono",Consolas,monospace'; ctx.fillText(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), W - 40, 26); ctx.textAlign = 'left';
    deskTabs(ctx);
    ctx.fillStyle = 'rgba(111,220,140,.25)'; ctx.fillRect(40, 118, W - 80, 2);
    rows.forEach(function (r, i) { deskZone(40 + (i % 2) * 770, 130 + Math.floor(i / 2) * 330, 740, 300, 'tile', i, r[0]); deskTile(ctx, 40 + (i % 2) * 770, 130 + Math.floor(i / 2) * 330, 740, 300, r[0], r[1], r[2], DESK_OK); });
    ctx.fillStyle = 'rgba(111,220,140,.08)'; ctx.fillRect(0, H - 46, W, 46); deskBar(ctx, W, H, false);
    ctx.fillStyle = DESK_MUTE; ctx.font = '20px ' + DESK_FONT; ctx.fillText('shop dashboard · touch screen: look at a tile and press E', 40, H - 34);
    deskDrawCard(ctx, W, H); deskDrawCursor(ctx);
    deskBoard.tex.needsUpdate = true;
    if (deskBoard.glow) deskBoard.glow.color.setHex(0x6fdc8c);
  }
  function deskTapItem(z, d) {
    if (deskBoard.view === 'shop') { if (z.act === 'tile') { var r = (dashRows()[DESK_PAGES[deskBoard.page]] || [])[z.id]; if (r) deskBoard.card = { title: r[0], sub: SHOP_PAGE_LABEL[DESK_PAGES[deskBoard.page]], lines: [['value', r[1], DESK_OK], ['note', r[2]]] }; } return; }
    var when = function (t) { return t ? new Date(t).toLocaleString('en-GB') + ' · ' + deskAge(t) + ' ago' : ''; };
    if (z.act === 'tile') { var go = ['prs', 'fleet', 'notif', 'seats', 'watch', 'watch'][z.id]; if (go === 'notif') deskBoard.card = { title: 'GitHub inbox · ' + (d.notif ? d.notif.unread : 0) + ' unread', lines: d.notif && d.notif.items.length ? d.notif.items.map(function (n) { return [n.repo.split('/').pop(), n.title + ' · ' + n.type + ' · ' + n.reason + ' · ' + deskAge(n.updatedAt) + ' ago', n.unread ? DESK_INK : DESK_DIM]; }) : ['no notifications'], url: 'https://github.com/notifications' }; else deskSetPage(DESK_PAGES.indexOf(go)); }
    else if (z.act === 'pr') { var p = d.prs[z.id]; if (!p) return; deskBoard.card = { title: p.repo + ' #' + p.n, sub: p.title, col: prColor(p), url: p.url, lines: [['author', p.author || '?'], ['branch', p.head || '?'], ['review', p.draft ? 'draft' : (p.review || 'review pending').toLowerCase().replace('_', ' '), prColor(p)], ['CI', deskCiText(p), (p.ci || {}).failure ? DESK_BAD : DESK_INK], ['mergeable', String(p.mergeable || 'unknown').toLowerCase()], ['changes', '+' + p.add + ' / -' + p.del], ['updated', when(p.updated)]] }; }
    else if (z.act === 'seat') { var s = null; d.seats.forEach(function (x) { if (x.key === z.id) s = x; }); if (!s) return; var ls = [['state', s.running ? (s.state || 'idle') : 'off', seatColor(s)], ['model', s.model || '?'], ['since', s.running && s.since ? when(s.since) : '']]; if (s.detail) ls.push(['doing', s.detail]); (s.ledger || []).forEach(function (le) { ls.push(['ledger', (le.date ? le.date + ' · ' : '') + (le.title || '')]); }); deskBoard.card = { title: s.label, sub: (s.role || '') + ' · ' + s.ledgerTotal + ' ledger entries', col: seatColor(s), lines: ls.filter(function (l) { return l[1]; }) }; }
    else if (z.act === 'mod') { var m = d.fleet && d.fleet.mods[z.id]; if (!m) return; var col = m.status === 'dirty' || m.status === 'ahead' ? DESK_WARN : m.status === 'ready' || m.status === 'clean' ? DESK_OK : DESK_MUTE; deskBoard.card = { title: m.mod, sub: (m.status || '').toUpperCase() + (m.branch ? ' · ' + m.branch : ''), col: col, url: m.url || '', lines: [['branch', m.branch], ['last commit', m.lastCommit], ['ahead / behind', (m.ahead || 0) + ' / ' + (m.behind || 0)], ['open PRs', String(m.openPrs || 0)], ['uncommitted', String(m.dirtyCount || 0), m.dirtyCount ? DESK_WARN : DESK_INK]].filter(function (l) { return l[1]; }) }; }
    else if (z.act === 'check') { var ch = d.checks[z.id]; if (!ch) return; deskBoard.card = { title: ch.name, sub: (ch.state || '').toUpperCase() + (d.runnerAlive === false ? ' · runner down' : ''), col: checkColor(ch.state), lines: [['detail', ch.detail || 'no detail']] }; }
    else if (z.act === 'health') { var hc = d.health && d.health.checks[z.id]; if (!hc) return; deskBoard.card = { title: hc.name, sub: hc.ok === true ? 'OK' : hc.ok === false ? 'FAIL' : 'WARN', col: hc.ok === true ? DESK_OK : hc.ok === false ? DESK_BAD : DESK_WARN, lines: [['detail', hc.detail || 'no detail']] }; }
    else if (z.act === 'act') { var acts = d.activity.length ? d.activity : d.feed.map(function (e) { return { t: e.t, title: e.m, detail: '', ok: true }; }); var a = acts[z.id]; if (!a) return; deskBoard.card = { title: a.title || 'event', sub: (a.kind ? a.kind + ' · ' : '') + when(a.t), col: a.ok === false ? DESK_BAD : DESK_OK, lines: [['detail', a.detail || 'no detail']] }; }
    else if (z.act === 'ledger') { var le = d.ledger && d.ledger[z.id]; if (!le) return; deskBoard.card = { title: le.title || le.who, sub: le.date + ' · ' + le.who + (le.more ? ' · ' + le.more + ' more lines in CLAUDE-LOG.md' : ''), col: DESK_OK, lines: le.body.slice(0, 6).map(function (p) { return ['', p]; }) }; }
    else if (z.act === 'inbox') { var it = d.inbox && d.inbox.pending[z.id]; if (!it) return; deskBoard.card = { title: 'Ledger inbox item', sub: 'waiting for the Desk', col: DESK_WARN, lines: [['entry', (it.title || it.summary || it.line || JSON.stringify(it)).replace(/\s+/g, ' ')]] }; }
    else if (z.act === 'feed') deskBoard.card = { title: 'Recent events', lines: d.feed.length ? d.feed.map(function (e) { return [e.t ? new Date(e.t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '', e.m]; }) : ['no recent events'] };
  }
  function drawDeskBoard() {
    if (deskBoard.view === 'shop') return drawShopBoard();
    var c = deskBoard.canvas, ctx = c.getContext('2d'), d = deskBoard.data, W = c.width, H = c.height, page = DESK_PAGES[deskBoard.page];
    deskBoard.zones = []; deskBoard.drawAt = now();
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#0a110d'; ctx.fillRect(0, 0, W, H);
    var grd = ctx.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, 'rgba(111,220,140,.12)'); grd.addColorStop(0.5, 'rgba(0,0,0,0)'); ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
    // header: title, page name, clock, freshness, page dots
    ctx.fillStyle = DESK_OK; ctx.font = '800 40px "Segoe UI",system-ui,sans-serif'; ctx.fillText('IMPLEMENTATION DESK', 40, 26);
    ctx.fillStyle = DESK_INK; ctx.font = '600 26px "Segoe UI",system-ui,sans-serif'; ctx.fillText(deskLabel(page), 40, 78);
    ctx.textAlign = 'right'; ctx.fillStyle = DESK_INK; ctx.font = '700 40px "Cascadia Mono",Consolas,monospace'; ctx.fillText(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), W - 40, 26);
    ctx.fillStyle = d.err ? DESK_BAD : DESK_DIM; ctx.font = '20px "Segoe UI",system-ui,sans-serif'; ctx.fillText(d.err ? '⚠ ' + d.err : (d.at ? 'updated ' + new Date(d.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'loading…'), W - 40, 80); ctx.textAlign = 'left';
    deskTabs(ctx);
    ctx.fillStyle = 'rgba(111,220,140,.25)'; ctx.fillRect(40, 118, W - 80, 2);
    var y = 140;
    if (page === 'overview') {
      var fs = d.fleet ? d.fleet.summary : null, hc = d.checks.filter(function (x) { return x.state === 'healthy' || x.state === 'ok'; }).length;
      var tiles = [
        ['Open PRs', d.prs.length, d.prs.length ? d.prs.filter(function (p) { return p.review === 'APPROVED'; }).length + ' approved · ' + d.prs.filter(function (p) { return p.ci && p.ci.failure; }).length + ' CI failing' : 'nothing waiting', d.prs.some(function (p) { return p.ci && p.ci.failure; }) ? DESK_BAD : DESK_OK],
        ['Fleet clean', fs ? fs.clean + '/' + fs.total : 'none', fs ? fs.dirty + ' dirty · ' + fs.behind + ' behind · ' + fs.prs + ' PRs' : 'no data', fs && fs.dirty ? DESK_WARN : DESK_OK],
        ['GitHub inbox', d.notif ? d.notif.unread : 'none', d.notif && d.notif.items[0] ? d.notif.items[0].repo.split('/').pop() + ': ' + d.notif.items[0].title : 'no notifications', d.notif && d.notif.unread ? DESK_WARN : DESK_OK],
        ['Ledger inbox', d.inbox ? d.inbox.pending.length : 'none', d.inbox ? (d.inbox.pending.length ? 'waiting for the Desk' : 'clear') : 'no data', d.inbox && d.inbox.pending.length ? DESK_WARN : DESK_OK],
        ['Watchdogs', d.checks.length ? hc + '/' + d.checks.length : 'none', d.runnerAlive === false ? 'RUNNER DOWN' : 'healthy', d.checks.length && hc < d.checks.length ? DESK_BAD : DESK_OK],
        ['Health', d.health ? d.health.pass + ' ok' : 'none', d.health ? d.health.warn + ' warn · ' + d.health.fail + ' fail' : 'no data', d.health && d.health.fail ? DESK_BAD : d.health && d.health.warn ? DESK_WARN : DESK_OK]
      ];
      var tw = (W - 80 - 5 * 16) / 6; tiles.forEach(function (t, i) { deskZone(40 + i * (tw + 16), y, tw, 126, 'tile', i, ['Pull requests', 'Fleet readiness', 'GitHub inbox', 'Seats & ledger', 'Watchdogs', 'Desk health'][i]); deskTile(ctx, 40 + i * (tw + 16), y, tw, 126, t[0], t[1], t[2], t[3]); });
      y += 150;
      // seats strip
      ctx.fillStyle = DESK_INK; ctx.font = '600 22px "Segoe UI",system-ui,sans-serif'; ctx.fillText('SEATS', 40, y); y += 34;
      var sw = (W - 80 - (Math.max(1, d.seats.length) - 1) * 12) / Math.max(1, d.seats.length);
      d.seats.forEach(function (s, i) {
        var x = 40 + i * (sw + 12); deskZone(x, y, sw, 78, 'seat', s.key, s.label); ctx.fillStyle = 'rgba(255,255,255,.045)'; roundRect(ctx, x, y, sw, 78, 12); ctx.fill();
        deskDot(ctx, x + 22, y + 24, seatColor(s), 8);
        ctx.fillStyle = DESK_INK; ctx.font = '700 22px "Segoe UI",system-ui,sans-serif'; ctx.fillText(s.label, x + 40, y + 12);
        ctx.fillStyle = DESK_DIM; ctx.font = '17px "Segoe UI",system-ui,sans-serif'; ctx.fillText(deskTrim(ctx, (s.state || 'off') + (s.model ? ' · ' + s.model : '') + (s.since && s.running ? ' · ' + deskAge(s.since) : ''), sw - 52), x + 40, y + 42);
      });
      if (!d.seats.length) { ctx.fillStyle = DESK_MUTE; ctx.font = '20px "Segoe UI",system-ui,sans-serif'; ctx.fillText('no seat data', 40, y + 26); }
      y += 100;
      // activity feed
      ctx.fillStyle = DESK_INK; ctx.font = '600 22px "Segoe UI",system-ui,sans-serif'; ctx.fillText('LATEST ACTIVITY', 40, y); y += 34;
      var acts = d.activity.length ? d.activity : d.feed.map(function (e) { return { t: e.t, title: e.m, detail: '', ok: true }; });
      acts.slice(0, 7).forEach(function (e, i) {
        deskZone(40, y - 4, W - 80, 30, 'act', i, e.title || 'event'); deskDot(ctx, 50, y + 12, e.ok === false ? DESK_BAD : DESK_OK, 5);
        ctx.fillStyle = DESK_DIM; ctx.font = '17px "Cascadia Mono",Consolas,monospace'; ctx.fillText(deskAge(e.t).padStart(8, ' '), 66, y + 2);
        ctx.fillStyle = DESK_INK; ctx.font = '600 19px "Segoe UI",system-ui,sans-serif'; var tt = e.title || ''; ctx.fillText(deskTrim(ctx, tt, 220), 170, y);
        ctx.fillStyle = DESK_DIM; ctx.font = '19px "Segoe UI",system-ui,sans-serif'; ctx.fillText(deskTrim(ctx, e.detail || '', W - 440), 400, y);
        y += 32;
      });
      if (!acts.length) { ctx.fillStyle = DESK_MUTE; ctx.font = '20px "Segoe UI",system-ui,sans-serif'; ctx.fillText('no recent events', 40, y); }
    }
    else if (page === 'prs') {
      if (!d.prs.length) { ctx.fillStyle = DESK_MUTE; ctx.font = '26px "Segoe UI",system-ui,sans-serif'; ctx.fillText('No open pull requests. Nice.', 40, y + 20); }
      var po = deskOff('prs'); d.prs.slice(po, po + 11).forEach(function (p, i) {
        deskZone(40, y - 6, W - 80, 62, 'pr', po + i, p.repo + ' #' + p.n); ctx.fillStyle = i % 2 ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.0)'; ctx.fillRect(40, y - 6, W - 80, 62);
        deskDot(ctx, 58, y + 24, prColor(p), 8);
        ctx.fillStyle = DESK_INK; ctx.font = '700 24px "Segoe UI",system-ui,sans-serif'; ctx.fillText(p.repo + ' #' + p.n, 80, y);
        ctx.fillStyle = DESK_DIM; ctx.font = '19px "Segoe UI",system-ui,sans-serif'; ctx.fillText(deskTrim(ctx, (p.author ? p.author + ' · ' : '') + (p.head || '') + ' · ' + deskAge(p.updated) + ' ago', 560), 80, y + 30);
        ctx.fillStyle = DESK_INK; ctx.font = '22px "Segoe UI",system-ui,sans-serif'; ctx.fillText(deskTrim(ctx, p.title, 720), 660, y + 2);
        var ci = p.ci || {}; var cit = ci.failure ? 'CI ✗' : ci.pending ? 'CI …' : ci.success ? 'CI ✓' : 'no CI';
        ctx.textAlign = 'right'; ctx.font = '18px "Cascadia Mono",Consolas,monospace'; ctx.fillStyle = ci.failure ? DESK_BAD : ci.pending ? DESK_WARN : DESK_DIM; ctx.fillText(cit, W - 44, y + 2);
        ctx.fillStyle = prColor(p); ctx.fillText(p.draft ? 'draft' : (p.review || 'review pending').toLowerCase().replace('_', ' '), W - 44, y + 28); ctx.textAlign = 'left';
        y += 64;
      });
    }
    else if (page === 'seats') {
      var cw = (W - 80 - (Math.max(1, d.seats.length) - 1) * 16) / Math.max(1, d.seats.length);
      d.seats.forEach(function (s, i) {
        var x = 40 + i * (cw + 16); deskZone(x, y, cw, 440, 'seat', s.key, s.label); ctx.fillStyle = 'rgba(255,255,255,.045)'; roundRect(ctx, x, y, cw, 440, 14); ctx.fill();
        ctx.fillStyle = seatColor(s); ctx.fillRect(x, y + 16, 4, 408);
        deskDot(ctx, x + 30, y + 30, seatColor(s), 9);
        ctx.fillStyle = DESK_INK; ctx.font = '800 28px "Segoe UI",system-ui,sans-serif'; ctx.fillText(s.label, x + 50, y + 14);
        ctx.fillStyle = DESK_DIM; ctx.font = '18px "Segoe UI",system-ui,sans-serif'; ctx.fillText(deskTrim(ctx, (s.role || '') + (s.model ? ' · ' + s.model : ''), cw - 40), x + 20, y + 54);
        ctx.fillStyle = seatColor(s); ctx.font = '700 22px "Segoe UI",system-ui,sans-serif'; ctx.fillText(s.running ? (s.state || 'idle').toUpperCase() + (s.since ? '  ·  ' + deskAge(s.since) : '') : 'OFF', x + 20, y + 86);
        var log = (deskBoard.seatLog[s.key] || []).slice(-5).reverse(), ly = y + 142;   /* the last five things it said or did, newest first */
        ctx.fillStyle = DESK_DIM; ctx.font = '600 15px "Segoe UI",system-ui,sans-serif'; ctx.fillText('LATEST', x + 20, y + 116);
        log.forEach(function (e) {   /* newest first; a message gets up to three lines, a tool call two, and the list stops where the card does */
          var room = Math.floor((y + 368 - ly) / 19); if (room < 1) return;
          ctx.font = '15px "Segoe UI",system-ui,sans-serif'; var lines = deskWrap(ctx, (SEAT_KIND_ICO[e.kind] || '·') + ' ' + e.text, cw - 72, Math.min(room, e.kind === 'say' || e.kind === 'done' ? 3 : 2)).map(function (tl) { return deskTrim(ctx, tl, cw - 72); });
          ctx.fillStyle = DESK_MUTE; ctx.font = '13px "Cascadia Mono",Consolas,monospace'; ctx.fillText(shortAgo(e.t), x + 16, ly + 1);
          ctx.fillStyle = seatKindCol(e.kind); ctx.font = '15px "Segoe UI",system-ui,sans-serif'; lines.forEach(function (tl) { ctx.fillText(tl, x + 54, ly); ly += 19; }); ly += 6;
        });
        if (!log.length) { ctx.fillStyle = DESK_MUTE; ctx.font = '16px "Segoe UI",system-ui,sans-serif'; ctx.fillText(s.running ? 'nothing reported yet' : 'not running', x + 20, ly); }
        ctx.fillStyle = DESK_DIM; ctx.font = '600 16px "Segoe UI",system-ui,sans-serif'; ctx.fillText('LEDGER · ' + s.ledgerTotal + ' entries', x + 20, y + 382);
        var ley = y + 404; (s.ledger || []).slice(0, 1).forEach(function (le) { ctx.fillStyle = DESK_MUTE; ctx.font = '15px "Cascadia Mono",Consolas,monospace'; ctx.fillText(le.date || '', x + 20, ley); ctx.fillStyle = DESK_INK; ctx.font = '17px "Segoe UI",system-ui,sans-serif'; var t1 = deskTrim(ctx, le.title || '', cw - 40); ctx.fillText(t1, x + 20, ley + 20); ley += 74; });   /* one line of the newest entry: the reports above are what changes */
      });
      if (!d.seats.length) { ctx.fillStyle = DESK_MUTE; ctx.font = '26px "Segoe UI",system-ui,sans-serif'; ctx.fillText('no seat data', 40, y + 20); }
      // the ledger: the newest entries from every seat and office, with anything waiting for the Desk first
      var iy = y + 460, pend = d.inbox ? d.inbox.pending : [], led = d.ledger || [], rows = 0;
      ctx.fillStyle = DESK_INK; ctx.font = '600 22px "Segoe UI",system-ui,sans-serif'; ctx.fillText('LEDGER', 40, iy);
      ctx.textAlign = 'right'; ctx.fillStyle = pend.length ? DESK_WARN : DESK_MUTE; ctx.font = '18px "Segoe UI",system-ui,sans-serif'; ctx.fillText(pend.length ? pend.length + ' waiting for the Desk' : 'nothing waiting for the Desk', W - 40, iy + 2); ctx.textAlign = 'left'; iy += 34;
      if (!led.length && !pend.length) { ctx.fillStyle = DESK_MUTE; ctx.font = '20px "Segoe UI",system-ui,sans-serif'; ctx.fillText(d.ledger ? 'no entries in the recent ledger' : 'reading the ledger…', 40, iy); }
      led.slice(0, Math.max(0, 7 - Math.min(2, pend.length))).forEach(function (e, i) { deskZone(40, iy - 4, W - 80, 28, 'ledger', i, 'Ledger entry'); ctx.fillStyle = DESK_MUTE; ctx.font = '16px "Cascadia Mono",Consolas,monospace'; ctx.fillText(e.date, 40, iy + 2); ctx.fillStyle = DESK_OK; ctx.font = '700 18px "Segoe UI",system-ui,sans-serif'; ctx.fillText(deskTrim(ctx, e.who, 130), 150, iy); ctx.fillStyle = DESK_INK; ctx.font = '19px "Segoe UI",system-ui,sans-serif'; ctx.fillText(deskTrim(ctx, e.title, W - 340), 290, iy); iy += 30; });
      pend.slice(0, 2).forEach(function (it, i) { deskZone(40, iy - 4, W - 80, 28, 'inbox', i, 'Ledger inbox item'); deskDot(ctx, 50, iy + 11, DESK_WARN, 5); ctx.fillStyle = DESK_INK; ctx.font = '19px "Segoe UI",system-ui,sans-serif'; ctx.fillText(deskTrim(ctx, (it.title || it.summary || it.line || JSON.stringify(it)).replace(/\s+/g, ' '), W - 120), 66, iy); iy += 30; });
    }
    else if (page === 'fleet') {
      var mods = d.fleet ? d.fleet.mods : [];
      if (!mods.length) { ctx.fillStyle = DESK_MUTE; ctx.font = '26px "Segoe UI",system-ui,sans-serif'; ctx.fillText('no fleet data', 40, y + 20); }
      var cols = 4, gw = (W - 80 - (cols - 1) * 12) / cols, gh = 80;
      var mo = deskOff('fleet'); mods.slice(mo, mo + 28).forEach(function (m, i) {
        var x = 40 + (i % cols) * (gw + 12), yy = y + Math.floor(i / cols) * (gh + 10); deskZone(x, yy, gw, gh, 'mod', mo + i, m.mod);
        var col = m.status === 'dirty' || m.status === 'ahead' ? DESK_WARN : m.status === 'ready' || m.status === 'clean' ? DESK_OK : DESK_MUTE;
        ctx.fillStyle = 'rgba(255,255,255,.045)'; roundRect(ctx, x, yy, gw, gh, 10); ctx.fill(); ctx.fillStyle = col; ctx.fillRect(x, yy + 12, 4, gh - 24);
        ctx.fillStyle = DESK_INK; ctx.font = '700 21px "Segoe UI",system-ui,sans-serif'; ctx.fillText(deskTrim(ctx, m.mod, gw - 130), x + 18, yy + 10);
        ctx.textAlign = 'right'; ctx.fillStyle = col; ctx.font = '600 16px "Segoe UI",system-ui,sans-serif'; ctx.fillText((m.status || '').toUpperCase(), x + gw - 14, yy + 12); ctx.textAlign = 'left';
        ctx.fillStyle = DESK_DIM; ctx.font = '16px "Cascadia Mono",Consolas,monospace';
        var bits = []; if (m.branch) bits.push(m.branch); if (m.version) bits.push('v' + m.version); if (m.ahead) bits.push('+' + m.ahead + ' ahead'); if (m.behind) bits.push('-' + m.behind + ' behind'); if (m.openPrs) bits.push(m.openPrs + ' PR' + (m.openPrs > 1 ? 's' : '')); if (m.dirtyCount) bits.push(m.dirtyCount + ' dirty'); if (m.lastTag) bits.push(m.lastTag + (m.lastTagAge ? ' · ' + m.lastTagAge : '')); if (m.age) bits.push(m.age);
        ctx.fillText(deskTrim(ctx, bits.join('  ') || 'clean', gw - 32), x + 18, yy + 44);
      });
      if (d.fleet && d.fleet.summary) { var fs2 = d.fleet.summary; ctx.fillStyle = DESK_DIM; ctx.font = '18px "Segoe UI",system-ui,sans-serif'; ctx.textAlign = 'right'; ctx.fillText(fs2.clean + ' clean · ' + fs2.dirty + ' dirty · ' + fs2.behind + ' behind · ' + fs2.prs + ' open PRs · ' + fs2.total + ' mods' + (d.fleet.stale ? ' · cached' : ''), W - 40, y + Math.ceil(Math.min(28, mods.length - deskOff('fleet')) / 4) * 90 + 8); ctx.textAlign = 'left'; }
    }
    else if (page === 'watch') {
      ctx.fillStyle = DESK_INK; ctx.font = '600 22px "Segoe UI",system-ui,sans-serif'; ctx.fillText('WATCHDOGS' + (d.runnerAlive === false ? '  ·  RUNNER DOWN' : ''), 40, y); y += 36;
      if (!d.checks.length) { ctx.fillStyle = DESK_MUTE; ctx.font = '20px "Segoe UI",system-ui,sans-serif'; ctx.fillText('no watchdog data', 40, y); }
      var wo = deskOff('watch'); d.checks.slice(wo, wo + 6).forEach(function (ch, i) {
        deskZone(40, y - 4, W - 80, 54, 'check', wo + i, ch.name); deskDot(ctx, 54, y + 16, checkColor(ch.state), 8);
        ctx.fillStyle = DESK_INK; ctx.font = '700 22px "Segoe UI",system-ui,sans-serif'; ctx.fillText(deskTrim(ctx, ch.name, 520), 76, y + 2);
        ctx.fillStyle = checkColor(ch.state); ctx.font = '600 17px "Segoe UI",system-ui,sans-serif'; ctx.fillText((ch.state || '').toUpperCase(), 76, y + 30);
        ctx.fillStyle = DESK_DIM; ctx.font = '19px "Segoe UI",system-ui,sans-serif'; ctx.fillText(deskTrim(ctx, ch.detail, W - 700), 620, y + 8);
        y += 58;
      });
      y += 14; ctx.fillStyle = DESK_INK; ctx.font = '600 22px "Segoe UI",system-ui,sans-serif'; ctx.fillText('DESK HEALTH', 40, y); y += 36;
      var hcs = d.health ? d.health.checks : []; var hw = (W - 80 - 3 * 12) / 4;
      hcs.slice(0, 8).forEach(function (h, i) { var x = 40 + (i % 4) * (hw + 12), yy = y + Math.floor(i / 4) * 66; deskZone(x, yy, hw, 56, 'health', i, h.name); ctx.fillStyle = 'rgba(255,255,255,.045)'; roundRect(ctx, x, yy, hw, 56, 10); ctx.fill(); deskDot(ctx, x + 22, yy + 28, h.ok === true ? DESK_OK : h.ok === false ? DESK_BAD : DESK_WARN, 7); ctx.fillStyle = DESK_INK; ctx.font = '600 19px "Segoe UI",system-ui,sans-serif'; ctx.fillText(deskTrim(ctx, h.name, hw - 60), x + 40, yy + 8); ctx.fillStyle = DESK_DIM; ctx.font = '15px "Segoe UI",system-ui,sans-serif'; ctx.fillText(deskTrim(ctx, h.detail || '', hw - 60), x + 40, yy + 32); });
      if (!hcs.length) { ctx.fillStyle = DESK_MUTE; ctx.font = '20px "Segoe UI",system-ui,sans-serif'; ctx.fillText('no health data', 40, y); }
    }
    // feed strip along the bottom
    var fy = H - 36; ctx.fillStyle = 'rgba(111,220,140,.08)'; ctx.fillRect(0, fy - 10, W, 46);
    var barLeft = deskBar(ctx, W, H, deskOverflow(page)); deskZone(40, fy - 8, barLeft - 60, 40, 'feed', 0, 'Recent events');
    ctx.fillStyle = DESK_DIM; ctx.font = '18px "Cascadia Mono",Consolas,monospace'; var line = d.feed.map(function (e) { return (e.t ? new Date(e.t).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' ' : '') + e.m; }).join('   ·   ') || 'no recent events'; ctx.fillText(deskTrim(ctx, line, barLeft - 80), 40, fy);
    deskDrawCard(ctx, W, H); deskDrawCursor(ctx);
    deskBoard.tex.needsUpdate = true;
    if (deskBoard.glow) deskBoard.glow.color.setHex(d.err ? 0xff6b6b : d.checks.some(function (x) { return x.state !== 'healthy' && x.state !== 'ok' && x.state !== 'unknown'; }) ? 0xffc857 : 0x6fdc8c);
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

