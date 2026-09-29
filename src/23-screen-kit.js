//@ the screen kit: the touch layer every in-world screen shares, the one look they are drawn in, and the housing they sit in
  // ══ Interactive screens (2026-09-24): one touch layer for every in-world screen, the till tablet, the security desk screen, the office PC, the phone, the delivery tablet and the quick wheel ══
  var TOUCH = { list: [] };
  var SCR_MONO = '"Cascadia Mono",Consolas,monospace', SCR_EMOJI = '"Segoe UI Emoji","Segoe UI Symbol","Apple Color Emoji",sans-serif';
  function touchScreen(o) {
    var sc = { id: o.id, kind: o.kind, w: o.w, h: o.h, zones: [], cur: null, hot: null, hotZone: null, tapAt: 0, tapX: 0, tapY: 0, drawAt: 0, live: o.live || 0, draw: o.draw, tap: o.tap, wheel: o.wheel || null, canvas: document.createElement('canvas') };
    sc.scale = o.scale || 1; sc.canvas.width = Math.round(o.w * sc.scale); sc.canvas.height = Math.round(o.h * sc.scale); sc.tex = new THREE.CanvasTexture(sc.canvas);   /* scale > 1 draws the same layout onto more pixels, so the text reads bigger on the same plane */ sc.tex.encoding = THREE.sRGBEncoding; sc.tex.anisotropy = 8;
    sc.mesh = new THREE.Mesh(new THREE.PlaneGeometry(o.pw, o.ph), new THREE.MeshBasicMaterial({ map: sc.tex, toneMapped: false }));   /* a lit panel shows the colours it was drawn in: the scene's exposure is for things the lamps light */
    var glass = new THREE.Mesh(new THREE.PlaneGeometry(o.pw, o.ph), MAT.screenGlass); glass.position.z = 0.0012; glass.renderOrder = 2; glass.userData.noDefight = true; sc.mesh.add(glass); sc.glass = glass;
    TOUCH.list.push(sc); return sc;
  }
  function tZone(sc, x, y, w, h, act, id, label, quiet) { var z = { x: x, y: y, w: w, h: h, act: act, id: id, label: label || '', key: act + ':' + (id === undefined ? '' : id) }; sc.zones.push(z); if (sc.hot === z.key && !quiet) { var ctx = sc.canvas.getContext('2d'); ctx.fillStyle = 'rgba(111,220,140,.14)'; roundRect(ctx, x, y, w, h, 12); ctx.fill(); ctx.strokeStyle = 'rgba(111,220,140,.9)'; ctx.lineWidth = 3; ctx.stroke(); } return z; }
  // a button: a soft gradient body with a rim of light along the top. on = the thing it names is on, hot = the crosshair is on it
  function scrBtnBody(ctx, x, y, w, h, r, col, on, hot, off) {
    ctx.save();
    if (off) { ctx.fillStyle = 'rgba(255,255,255,.025)'; roundRect(ctx, x, y, w, h, r); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore(); return; }
    if (hot) { ctx.shadowColor = scrRgba(col, 0.6); ctx.shadowBlur = 20; }
    var g = ctx.createLinearGradient(0, y, 0, y + h);
    if (on) { g.addColorStop(0, scrRgba(col, 0.46)); g.addColorStop(1, scrRgba(col, 0.2)); } else if (hot) { g.addColorStop(0, 'rgba(255,255,255,.22)'); g.addColorStop(1, 'rgba(255,255,255,.1)'); } else { g.addColorStop(0, 'rgba(255,255,255,.11)'); g.addColorStop(1, 'rgba(255,255,255,.04)'); }
    ctx.fillStyle = g; roundRect(ctx, x, y, w, h, r); ctx.fill(); ctx.shadowBlur = 0; ctx.shadowColor = 'rgba(0,0,0,0)';
    ctx.strokeStyle = on || hot ? col : 'rgba(255,255,255,.17)'; ctx.lineWidth = hot ? 3 : 1.5; ctx.stroke();
    ctx.strokeStyle = on ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.16)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + r, y + 1.5); ctx.lineTo(x + w - r, y + 1.5); ctx.stroke();
    ctx.restore();
  }
  function tBtn(sc, ctx, x, y, w, h, text, act, id, label, on, o) {
    o = o || {}; var z = tZone(sc, x, y, w, h, act, id, label, true), hot = sc.hot === z.key && !o.off, col = o.col || DESK_OK;
    scrBtnBody(ctx, x, y, w, h, o.r || Math.min(14, h / 3), col, on, hot, o.off);
    ctx.fillStyle = o.off ? DESK_MUTE : on ? '#ffffff' : hot ? col : DESK_INK; ctx.font = (o.weight || '600') + ' ' + (o.size || 20) + 'px ' + DESK_FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(deskTrim(ctx, text, w - 16), x + w / 2, y + h / 2 + 1 - (o.sub ? 9 : 0));
    if (o.sub) { ctx.fillStyle = on ? 'rgba(255,255,255,.75)' : DESK_DIM; ctx.font = '14px ' + DESK_FONT; ctx.fillText(deskTrim(ctx, o.sub, w - 16), x + w / 2, y + h - 14); }
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  }
  function tCursor(sc, ctx) {
    var c = sc.cur, t = now();
    if (sc.tapAt && t - sc.tapAt < 350) { var k = (t - sc.tapAt) / 350; ctx.strokeStyle = 'rgba(111,220,140,' + (1 - k).toFixed(2) + ')'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(sc.tapX, sc.tapY, 10 + k * 40, 0, Math.PI * 2); ctx.stroke(); }
    if (!c) return; var r = Math.max(8, Math.round(sc.w / 110));
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 6;
    ctx.strokeStyle = 'rgba(255,255,255,.92)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = sc.hotZone ? DESK_OK : 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.arc(c.x, c.y, r * 0.36, 0, Math.PI * 2); ctx.fill(); ctx.restore();
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

  // ── The look. Every screen is drawn from these pieces, so the till, the security screen, the control tablet and the wall
  // panels read as one family: the same wallpaper, the same header, the same cards, in the screen's own accent colour. ──
  function scrRgba(hex, a) { var n = parseInt(String(hex).slice(1), 16); return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; }
  function scrBg(ctx, W, H, accent) {   // near black, the accent bleeding in from the top left, a fine dot grid, darker corners
    var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0e1613'); g.addColorStop(1, '#060a08'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    var r = ctx.createRadialGradient(W * 0.1, -H * 0.15, 10, W * 0.1, -H * 0.15, W * 0.8); r.addColorStop(0, scrRgba(accent, 0.24)); r.addColorStop(1, scrRgba(accent, 0)); ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,.04)'; var st = Math.max(14, Math.round(W / 40)); for (var y = st; y < H; y += st) for (var x = st; x < W; x += st) ctx.fillRect(x, y, 1.5, 1.5);
    var v = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, W * 0.8); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.42)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }
  // the bar across the top: a badge in the accent colour, the screen's name and a line under it. The clock sits on the right.
  function scrHead(ctx, W, hh, title, sub, glyph, accent, noClock) {
    var pad = Math.round(hh * 0.2), bs = hh - pad * 2, bx = Math.round(pad * 1.5);
    var g = ctx.createLinearGradient(0, 0, 0, hh); g.addColorStop(0, 'rgba(255,255,255,.085)'); g.addColorStop(1, 'rgba(255,255,255,.02)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, hh);
    var ln = ctx.createLinearGradient(0, 0, W, 0); ln.addColorStop(0, scrRgba(accent, 0.9)); ln.addColorStop(0.6, scrRgba(accent, 0.25)); ln.addColorStop(1, scrRgba(accent, 0.05)); ctx.fillStyle = ln; ctx.fillRect(0, hh - 2, W, 2);
    var bg = ctx.createLinearGradient(0, pad, 0, pad + bs); bg.addColorStop(0, accent); bg.addColorStop(1, scrRgba(accent, 0.6)); ctx.fillStyle = bg; roundRect(ctx, bx, pad, bs, bs, bs * 0.28); ctx.fill();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = Math.round(bs * 0.58) + 'px ' + SCR_EMOJI; ctx.fillStyle = '#06110a'; ctx.fillText(glyph, bx + bs / 2, pad + bs / 2 + 1);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; var tx = bx + bs + pad;
    ctx.fillStyle = DESK_INK; ctx.font = '700 ' + Math.round(hh * (sub ? 0.34 : 0.4)) + 'px ' + DESK_FONT; ctx.fillText(title, tx, sub ? hh * 0.34 : hh * 0.5);
    if (sub) { ctx.fillStyle = DESK_DIM; ctx.font = Math.round(hh * 0.23) + 'px ' + DESK_FONT; ctx.fillText(deskTrim(ctx, sub, W - tx - hh * 2.2), tx, hh * 0.7); }
    if (!noClock) { ctx.textAlign = 'right'; ctx.fillStyle = DESK_INK; ctx.font = '700 ' + Math.round(hh * 0.42) + 'px ' + SCR_MONO; ctx.fillText(clockText(), W - bx, hh * 0.5); }
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  }
  function scrCard(ctx, x, y, w, h, o) {
    o = o || {}; var r = o.r || 14, g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, o.tint ? scrRgba(o.tint, 0.16) : 'rgba(255,255,255,.065)'); g.addColorStop(1, o.tint ? scrRgba(o.tint, 0.05) : 'rgba(255,255,255,.025)');
    ctx.fillStyle = g; roundRect(ctx, x, y, w, h, r); ctx.fill(); ctx.strokeStyle = o.tint ? scrRgba(o.tint, 0.45) : 'rgba(255,255,255,.1)'; ctx.lineWidth = 1.5; ctx.stroke();
    if (o.bar) { ctx.fillStyle = o.bar; roundRect(ctx, x + 7, y + 12, 4, h - 24, 2); ctx.fill(); }
  }
  // a figure with its name over it, in a card: the row of small numbers every screen opens with
  function scrStat(ctx, x, y, w, h, label, value, col) {
    scrCard(ctx, x, y, w, h, { r: Math.min(12, h / 4) }); var fs = Math.round(h * 0.4);
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = DESK_DIM; ctx.font = '600 ' + Math.round(h * 0.25) + 'px ' + DESK_FONT; ctx.fillText(deskTrim(ctx, label, w - 16), x + Math.round(h * 0.22), y + Math.round(h * 0.12));
    ctx.fillStyle = col || DESK_INK; ctx.font = '700 ' + fs + 'px ' + SCR_MONO; ctx.fillText(deskTrim(ctx, String(value), w - 16), x + Math.round(h * 0.22), y + Math.round(h * 0.46));
  }
  function scrPill(ctx, x, y, text, col, size, fromRight) {   // a lozenge with a dot in it; returns its width
    size = size || 15; ctx.font = '600 ' + size + 'px ' + DESK_FONT; var w = ctx.measureText(text).width + size * 2.3, h = Math.round(size * 1.75); if (fromRight) x -= w;
    ctx.fillStyle = scrRgba(col, 0.16); roundRect(ctx, x, y, w, h, h / 2); ctx.fill(); ctx.strokeStyle = scrRgba(col, 0.55); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x + size * 0.85, y + h / 2, size * 0.28, 0, Math.PI * 2); ctx.fill();
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(text, x + size * 1.45, y + h / 2 + 1); ctx.textBaseline = 'top'; return w;
  }
  function scrMeter(ctx, x, y, w, h, frac, col) {
    ctx.fillStyle = 'rgba(255,255,255,.08)'; roundRect(ctx, x, y, w, h, h / 2); ctx.fill(); var fw = Math.max(h, w * clamp(frac, 0, 1));
    var g = ctx.createLinearGradient(x, 0, x + fw, 0); g.addColorStop(0, scrRgba(col, 0.55)); g.addColorStop(1, col); ctx.fillStyle = g; roundRect(ctx, x, y, fw, h, h / 2); ctx.fill();
  }
  function scrTitle(ctx, x, y, text, size, col) { ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = col || DESK_INK; ctx.font = '700 ' + (size || 20) + 'px ' + DESK_FONT; ctx.fillText(text, x, y); }
  function scrFoot(ctx, W, H, fh, accent) { var g = ctx.createLinearGradient(0, H - fh, 0, H); g.addColorStop(0, scrRgba(accent, 0.02)); g.addColorStop(1, scrRgba(accent, 0.12)); ctx.fillStyle = g; ctx.fillRect(0, H - fh, W, fh); ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(0, H - fh, W, 1); }
  // a small mono read-out, the kind a machine has: dark glass, a fine frame, lines of pale text. Draws the frame and clears it.
  function scrLcd(ctx, W, H, accent) {
    var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0c1511'); g.addColorStop(1, '#050907'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = scrRgba(accent, 0.08); for (var y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
    ctx.strokeStyle = scrRgba(accent, 0.45); ctx.lineWidth = 2; roundRect(ctx, 3, 3, W - 6, H - 6, 8); ctx.stroke(); ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  }

  // ── The housing: a rim of metal, a gloss bezel, a camera dot and a power light, built round the origin of g with the
  // picture at z 0 facing +z. Every lit screen in the shop sits in one. ──
  function screenShell(g, pw, ph, o) {
    o = o || {}; var bz = o.bezel === undefined ? 0.02 : o.bezel, th = o.depth || 0.026, rim = o.rim === undefined ? 0.005 : o.rim, led = o.led === undefined ? 0x6fdc8c : o.led;
    var back = new THREE.Mesh(bevelGeo(pw + 2 * (bz + rim), ph + 2 * (bz + rim), th, Math.min(0.01, th * 0.42)), o.rimMat || MAT.alu); back.position.z = -th / 2 - 0.0035; back.castShadow = true; g.add(back);
    var bezel = new THREE.Mesh(bevelGeo(pw + 2 * bz, ph + 2 * bz, 0.008, 0.003), MAT.gloss); bezel.position.z = -0.0046; bezel.userData.noDefight = true; g.add(bezel);
    if (bz >= 0.012) {
      var cam = new THREE.Mesh(new THREE.CircleGeometry(Math.min(0.004, bz * 0.22), 10), colorMat(0x05070a, 0.15, 0.6)); cam.position.set(0, ph / 2 + bz / 2, 0.0002); g.add(cam);
      if (led) { var l = new THREE.Mesh(new THREE.CircleGeometry(Math.min(0.0035, bz * 0.18), 8), new THREE.MeshBasicMaterial({ color: led, toneMapped: false })); l.position.set(pw / 2 - 0.01, -ph / 2 - bz / 2, 0.0002); g.add(l); }
    }
    return { back: back, bezel: bezel };
  }
  // a plain lit picture (no touch): a canvas on a plane, shown in the colours it was drawn in
  function litPlane(canvas, pw, ph) { var tex = new THREE.CanvasTexture(canvas); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 8; var m = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); m.userData.tex = tex; return m; }
