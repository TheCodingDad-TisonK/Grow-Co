//@ three.js setup: renderer, materials, textures, helpers
  // ── Three.js world ────────────────────────────────────────────────
  var canvas = $('g3-canvas');
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.78;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;   // the map is redrawn on a timer in frame(), not every frame: it is a second full pass over every caster
  var _df = { p: new THREE.Vector3(), q: new THREE.Quaternion(), s: new THREE.Vector3(), a: new THREE.Vector3(), t: 0 };   /* de-fight pass state; declared here because buildAllProps() calls defightSoon() during boot */
  var lightBudget = { point: 12,   /* set per quality in applySettings; used by updateLightBudget() next to frame() */ lights: null, scanT: 0, tickT: 0, tmp: new THREE.Vector3(), cam: new THREE.Vector3() };
  var scene = new THREE.Scene();
  // Reflections: a small studio (dark shell, a few bright panels, one warm and one cool wall) is drawn once and baked into the
  // scene's environment map. It is kept dim on purpose: it is there so chrome, glass, screens and lacquer have something to
  // reflect, not to light the rooms. The lamps and the sun still do that, so night stays night.
  function buildEnvStudio() {
    var es = new THREE.Scene();
    function pane(w, h, col, k, x, y, z, rx, ry) { var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide })); m.material.color.multiplyScalar(k); m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, 0); es.add(m); return m; }
    es.add(new THREE.Mesh(new THREE.BoxGeometry(24, 12, 24), new THREE.MeshBasicMaterial({ color: 0x0b0d0f, side: THREE.BackSide })));
    pane(24, 24, 0x14100c, 1, 0, -5.9, 0, Math.PI / 2);                       /* a warm dark floor */
    pane(24, 24, 0x141517, 1, 0, 5.9, 0, Math.PI / 2);                        /* a pale ceiling */
    [[-5, -4], [5, -4], [-5, 4], [5, 4], [0, 0]].forEach(function (p) { pane(3.0, 1.1, 0xfff4e2, 3.4, p[0], 5.8, p[1], Math.PI / 2); });   /* ceiling troffers */
    pane(6, 4, 0xcfe4ff, 1.2, 0, 1, -11.8, 0, 0);                             /* a cool window */
    pane(5, 3.5, 0xffd9a8, 0.9, 11.8, 0.5, 2, 0, Math.PI / 2);                  /* a warm one */
    pane(6, 3, 0x6fdc8c, 0.25, -11.8, 0, -3, 0, Math.PI / 2);                  /* a touch of the house green */
    try { var pm = new THREE.PMREMGenerator(renderer), rt = pm.fromScene(es, 0.035); pm.dispose(); scene.environment = rt.texture; } catch (e) { console.warn('no environment map: ' + e.message); }
    es.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  }
  buildEnvStudio();
  var camera = new THREE.PerspectiveCamera(75, 1, 0.2, 200);   // near 0.2: the hands sit at -0.5, and a nearer plane makes distant decals z-fight
  camera.rotation.order = 'YXZ';
  var TOWN_LAYER = 1; camera.layers.enable(TOWN_LAYER);   /* town facades and greenery live on layer 1 only: the player's camera sees them, the indoor security feeds and the TV grow cam skip them */
  var clock = new THREE.Clock();

  var ROOM = { x: 12, z: 9, h: 3.4 }; // half extents
  var world = { dirty: true, interact: [], obstacles: [], plants: {}, group: new THREE.Group(), tentGroup: null, shelfGroup: null, benchGroup: null, lampGroup: null, time: 0 };
  scene.add(world.group);

  // procedural textures
  function makeTex(w, h, draw, repeat) {
    var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (repeat) t.repeat.set(repeat[0], repeat[1]); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
  }
  function makeAlphaTex(w, h, draw) {   /* a cut-out sheet: transparent canvas, no repeat */
    var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
  }
  function noiseFill(ctx, w, h, base, amp, n) {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    for (var i = 0; i < n; i++) { var v = Math.floor((Math.random() - 0.5) * amp); ctx.fillStyle = 'rgba(' + (v > 0 ? 255 : 0) + ',' + (v > 0 ? 255 : 0) + ',' + (v > 0 ? 255 : 0) + ',' + Math.abs(v) / 255 + ')'; ctx.fillRect(Math.random() * w, Math.random() * h, randi(1, 4), randi(1, 4)); }
  }
  // bump maps are drawn on a mid-grey canvas: darker = recessed (grout, gaps), lighter = raised
  function makeBump(w, h, draw, repeat) {
    var c = document.createElement('canvas'); c.width = w; c.height = h; var ctx = c.getContext('2d'); ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, w, h); draw(ctx, w, h);
    var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (repeat) t.repeat.set(repeat[0], repeat[1]); t.anisotropy = 4; return t;
  }
  function grain(ctx, w, h, n, alpha) { for (var i = 0; i < n; i++) { var v = Math.random(); ctx.fillStyle = 'rgba(' + (v > 0.5 ? '255,255,255' : '0,0,0') + ',' + (Math.abs(v - 0.5) * alpha) + ')'; ctx.fillRect(Math.random() * w, Math.random() * h, randi(1, 3), randi(1, 3)); } }
  function tileDraw(ctx, w, h, cols, rows, fill, grout, groutW, jitter) {
    ctx.fillStyle = grout; ctx.fillRect(0, 0, w, h); var tw = w / cols, th = h / rows;
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) { var f = typeof fill === 'function' ? fill(c, r) : fill; ctx.fillStyle = f; ctx.fillRect(c * tw + groutW / 2, r * th + groutW / 2, tw - groutW, th - groutW); if (jitter) { ctx.fillStyle = 'rgba(0,0,0,' + randf(0, jitter) + ')'; ctx.fillRect(c * tw + groutW / 2, r * th + groutW / 2, tw - groutW, th - groutW); } }
  }
  function brickDraw(ctx, w, h, cols, rows, fill, grout, groutW, bump) {
    ctx.fillStyle = grout; ctx.fillRect(0, 0, w, h); var bw = w / cols, bh = h / rows;
    for (var r = 0; r < rows; r++) { var off = (r % 2) * bw / 2; for (var c = -1; c <= cols; c++) { var x = c * bw + off; ctx.fillStyle = bump ? ('rgb(' + [140, 150, 160][(c + r) % 3] + ',' + [140, 150, 160][(c + r) % 3] + ',' + [140, 150, 160][(c + r) % 3] + ')') : (typeof fill === 'function' ? fill(c, r) : fill); ctx.fillRect(x + groutW / 2, r * bh + groutW / 2, bw - groutW, bh - groutW); } }
  }
  function plankDraw(ctx, w, h, bump) {
    var rows = 10, rh = h / rows, tones = ['#a9773f', '#9a6a3e', '#b0804a', '#946638', '#a57242', '#8d5f34', '#b68a54'], seed = [0.13, 0.62, 0.37, 0.81, 0.25, 0.7, 0.05, 0.5, 0.92, 0.44];
    if (bump) { ctx.fillStyle = '#8c8c8c'; ctx.fillRect(0, 0, w, h); }
    for (var r = 0; r < rows; r++) {
      var x = -seed[r] * w * 0.6, n = 0;
      while (x < w) {
        var len = w * (0.34 + ((r * 7 + n * 5) % 5) * 0.07), y = r * rh; n++;
        ctx.save(); ctx.beginPath(); ctx.rect(x, y, len, rh); ctx.clip();
        if (!bump) { ctx.fillStyle = tones[(r * 3 + n * 2) % tones.length]; ctx.fillRect(x, y, len, rh); }
        for (var i = 0; i < 26; i++) { var gy = y + Math.random() * rh, dk = Math.random() < 0.7; ctx.strokeStyle = (bump ? (dk ? 'rgba(0,0,0,' : 'rgba(255,255,255,') : (dk ? 'rgba(50,28,10,' : 'rgba(255,225,180,')) + randf(0.05, bump ? 0.16 : 0.22) + ')'; ctx.lineWidth = randf(0.6, 2.2); ctx.beginPath(); ctx.moveTo(x - 4, gy); ctx.bezierCurveTo(x + len * 0.3, gy + randf(-5, 5), x + len * 0.7, gy + randf(-5, 5), x + len + 4, gy + randf(-4, 4)); ctx.stroke(); }
        if (!bump && Math.random() < 0.3) { var kx = x + randf(0.2, 0.8) * len, ky = y + randf(0.3, 0.7) * rh; for (var k = 0; k < 5; k++) { ctx.strokeStyle = 'rgba(40,22,8,' + (0.3 - k * 0.05) + ')'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(kx, ky, 5 + k * 5, 3 + k * 2.4, 0, 0, 6.29); ctx.stroke(); } }
        ctx.restore();
        ctx.fillStyle = bump ? '#1c1c1c' : 'rgba(30,18,8,.85)'; ctx.fillRect(x, y, bump ? 4 : 3, rh); ctx.fillRect(x, y, len, bump ? 4 : 3);
        if (!bump) { ctx.fillStyle = 'rgba(255,235,200,.10)'; ctx.fillRect(x + 3, y + 3, len - 3, 2); }
        x += len;
      }
    }
  }
  // wood: long grain lines that wander together, a few cathedral arches, pores, and a slow change of tone across the board
  function woodDraw(ctx, w, h, base, inks, n, bump) {
    if (base) { ctx.fillStyle = base; ctx.fillRect(0, 0, w, h); var tone = ctx.createLinearGradient(0, 0, 0, h); tone.addColorStop(0, 'rgba(255,230,190,.10)'); tone.addColorStop(0.5, 'rgba(0,0,0,.08)'); tone.addColorStop(1, 'rgba(255,230,190,.06)'); ctx.fillStyle = tone; ctx.fillRect(0, 0, w, h); }
    var drift = []; for (var k = 0; k < 4; k++) drift.push(randf(-10, 10));
    for (var i = 0; i < n; i++) { var y = Math.random() * h, dark = Math.random() < 0.72; ctx.strokeStyle = inks[dark ? 0 : 1] + (dark ? randf(0.05, bump ? 0.3 : 0.24) : randf(0.03, 0.1)) + ')'; ctx.lineWidth = randf(0.5, dark ? 2.2 : 1.2); ctx.beginPath(); ctx.moveTo(-4, y); ctx.bezierCurveTo(w * 0.3, y + drift[0] + randf(-3, 3), w * 0.65, y + drift[1] + randf(-3, 3), w + 4, y + drift[2] + randf(-3, 3)); ctx.stroke(); }
    for (var a = 0; a < 3; a++) { var cx = Math.random() * w, cy = Math.random() * h; for (var rr = 0; rr < 7; rr++) { ctx.strokeStyle = inks[0] + randf(0.06, 0.16) + ')'; ctx.lineWidth = randf(0.8, 1.8); ctx.beginPath(); ctx.ellipse(cx, cy, 40 + rr * 22, 5 + rr * 4.5, 0, 0, Math.PI * 2); ctx.stroke(); } }
    for (var p = 0; p < 900; p++) { ctx.fillStyle = inks[0] + randf(0.08, 0.22) + ')'; ctx.fillRect(Math.random() * w, Math.random() * h, randf(3, 12), 1); }
  }
  var TEX = {
    concrete: makeTex(512, 512, function (ctx, w, h) { noiseFill(ctx, w, h, '#6d6f6a', 30, 14000); for (var i = 0; i < 40; i++) { var bl = ctx.createRadialGradient(0, 0, 0, 0, 0, 1); bl.addColorStop(0, 'rgba(' + (i % 2 ? '255,255,255,' : '0,0,0,') + randf(0.03, 0.08) + ')'); bl.addColorStop(1, 'rgba(0,0,0,0)'); ctx.save(); ctx.translate(Math.random() * w, Math.random() * h); ctx.scale(randf(30, 110), randf(20, 70)); ctx.fillStyle = bl; ctx.beginPath(); ctx.arc(0, 0, 1, 0, 6.29); ctx.fill(); ctx.restore(); } ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 3; ctx.strokeRect(1.5, 1.5, w - 3, h - 3);   /* a poured slab: cloudy, with a saw-cut joint round each bay */ }, [6, 4.5]),
    concreteBump: makeBump(512, 512, function (ctx, w, h) { grain(ctx, w, h, 9000, 0.35); ctx.strokeStyle = '#303030'; ctx.lineWidth = 6; ctx.strokeRect(3, 3, w - 6, h - 6); }, [6, 4.5]),
    wall: makeTex(256, 256, function (ctx, w, h) { noiseFill(ctx, w, h, '#d9d5c9', 8, 2500); }, [4, 2]),
    wallBump: makeBump(256, 256, function (ctx, w, h) { grain(ctx, w, h, 5000, 0.18); }, [4, 2]),
    accent: makeTex(256, 256, function (ctx, w, h) { noiseFill(ctx, w, h, '#2f5a45', 10, 2500); }, [4, 2]),
    brick: makeTex(512, 256, function (ctx, w, h) { brickDraw(ctx, w, h, 8, 8, function () { return pick(['#8a4a3a', '#95553f', '#7c4335', '#9a5c48', '#83483a']); }, '#c9c2b4', 6); grain(ctx, w, h, 6000, 0.25); }, [1, 1]),   /* repeat 1: box() sizes brick UVs in metres so every panel shows the same brick */
    brickBump: makeBump(512, 256, function (ctx, w, h) { brickDraw(ctx, w, h, 8, 8, null, '#303030', 6, true); grain(ctx, w, h, 4000, 0.2); }, [3, 1.5]),
    brickDark: makeTex(512, 256, function (ctx, w, h) { brickDraw(ctx, w, h, 8, 8, function () { return pick(['#2d3034', '#33363b', '#2a2c30', '#383b40']); }, '#4a4d52', 6); grain(ctx, w, h, 5000, 0.25); }, [1, 1]),
    tile: makeTex(512, 512, function (ctx, w, h) { tileDraw(ctx, w, h, 4, 4, function (c, r) { return (c + r) % 2 ? '#d7d2c4' : '#c8c2b2'; }, '#8d877b', 6, 0.06); grain(ctx, w, h, 8000, 0.2); }, [6, 2.5]),
    tileBump: makeBump(512, 512, function (ctx, w, h) { tileDraw(ctx, w, h, 4, 4, '#8a8a8a', '#2a2a2a', 6, 0); grain(ctx, w, h, 5000, 0.15); }, [6, 2.5]),
    planks: makeTex(1024, 1024, function (ctx, w, h) { plankDraw(ctx, w, h, false); }, [4, 4]),
    planksBump: makeBump(1024, 1024, function (ctx, w, h) { plankDraw(ctx, w, h, true); }, [4, 4]),
    rubber: makeTex(256, 256, function (ctx, w, h) { noiseFill(ctx, w, h, '#2e3236', 14, 4000); ctx.fillStyle = 'rgba(255,255,255,.05)'; for (var y = 0; y < h; y += 16) for (var x = 0; x < w; x += 16) { ctx.beginPath(); ctx.arc(x + 8 + ((y / 16) % 2) * 0, y + 8, 3, 0, Math.PI * 2); ctx.fill(); } }, [10, 6]),
    rubberBump: makeBump(256, 256, function (ctx, w, h) { ctx.fillStyle = '#a8a8a8'; for (var y = 0; y < h; y += 16) for (var x = 0; x < w; x += 16) { ctx.beginPath(); ctx.arc(x + 8, y + 8, 3, 0, Math.PI * 2); ctx.fill(); } grain(ctx, w, h, 3000, 0.12); }, [10, 6]),
    ceiling: makeTex(512, 512, function (ctx, w, h) { tileDraw(ctx, w, h, 2, 2, '#e7e4dc', '#b9b5aa', 8, 0); for (var i = 0; i < 2600; i++) { ctx.fillStyle = 'rgba(0,0,0,' + randf(0.04, 0.16) + ')'; ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2); } }, [10, 7.5]),
    ceilingBump: makeBump(512, 512, function (ctx, w, h) { tileDraw(ctx, w, h, 2, 2, '#8a8a8a', '#3a3a3a', 8, 0); grain(ctx, w, h, 5000, 0.2); }, [10, 7.5]),
    wood: makeTex(512, 512, function (ctx, w, h) { woodDraw(ctx, w, h, '#946a3f', ['rgba(60,34,12,', 'rgba(255,220,170,'], 150, false); }, [2, 1]),
    woodBump: makeBump(512, 512, function (ctx, w, h) { woodDraw(ctx, w, h, null, ['rgba(0,0,0,', 'rgba(255,255,255,'], 110, true); }, [2, 1]),
    darkwood: makeTex(512, 512, function (ctx, w, h) { woodDraw(ctx, w, h, '#432d1c', ['rgba(0,0,0,', 'rgba(255,200,150,'], 170, false); }, [2, 1]),
    stone: makeTex(512, 512, function (ctx, w, h) { noiseFill(ctx, w, h, '#e9e6de', 16, 9000); for (var i = 0; i < 26; i++) { ctx.strokeStyle = 'rgba(90,96,100,' + randf(0.05, 0.2) + ')'; ctx.lineWidth = randf(0.6, 2.4); ctx.beginPath(); var x = Math.random() * w, y = Math.random() * h; ctx.moveTo(x, y); for (var s = 0; s < 5; s++) { x += randf(-90, 90); y += randf(30, 110); ctx.lineTo(x, y); } ctx.stroke(); } for (var f = 0; f < 500; f++) { ctx.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '60,60,64' : '255,255,255') + ',' + randf(0.1, 0.35) + ')'; ctx.beginPath(); ctx.arc(Math.random() * w, Math.random() * h, randf(0.5, 1.8), 0, 6.29); ctx.fill(); } }, [1, 1]),
    brushed: makeTex(256, 256, function (ctx, w, h) { ctx.fillStyle = '#9ea4ac'; ctx.fillRect(0, 0, w, h); for (var y = 0; y < h; y++) { ctx.fillStyle = 'rgba(' + (Math.random() > 0.5 ? '255,255,255' : '0,0,0') + ',' + randf(0.02, 0.12) + ')'; ctx.fillRect(0, y, w, 1); } }, [1, 1]),
    fabric: makeTex(128, 128, function (ctx, w, h) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h); for (var y = 0; y < h; y += 2) for (var x = 0; x < w; x += 2) { ctx.fillStyle = 'rgba(0,0,0,' + (((x + y) / 2) % 2 ? 0.14 : 0.04) + ')'; ctx.fillRect(x, y, 2, 2); } }, [6, 6]),
    tent: makeTex(128, 128, function (ctx, w, h) { noiseFill(ctx, w, h, '#1c1f24', 10, 800); ctx.strokeStyle = 'rgba(255,255,255,.06)'; for (var i = 0; i < w; i += 8) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke(); } }, [3, 3]),
    mylar: makeTex(128, 128, function (ctx, w, h) { var g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#c9ccd2'); g.addColorStop(.5, '#f2f3f5'); g.addColorStop(1, '#b9bcc4'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); for (var i = 0; i < 40; i++) { ctx.strokeStyle = 'rgba(255,255,255,' + randf(0.1, 0.4) + ')'; ctx.lineWidth = randf(1, 3); ctx.beginPath(); var x = Math.random() * w; ctx.moveTo(x, 0); ctx.lineTo(x + randf(-30, 30), h); ctx.stroke(); } }, [2, 2]),
    soil: makeTex(128, 128, function (ctx, w, h) { noiseFill(ctx, w, h, '#3a2a1c', 50, 3000); ctx.fillStyle = 'rgba(230,220,200,.5)'; for (var i = 0; i < 40; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2); }),
    terracotta: makeTex(128, 128, function (ctx, w, h) { noiseFill(ctx, w, h, '#b35a2a', 26, 3000); }, [2, 1]),
    grass: makeTex(512, 512, function (ctx, w, h) { noiseFill(ctx, w, h, '#4f7f3b', 26, 16000); var cols = ['#3f6f2e', '#5c8f44', '#6f9a4a', '#45752f', '#7ea25a']; for (var i = 0; i < 2600; i++) { var x = Math.random() * w, y = Math.random() * h; ctx.strokeStyle = cols[i % cols.length]; ctx.lineWidth = randf(0.8, 1.6); ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + randf(-4, 4), y - randf(4, 9), x + randf(-6, 6), y - randf(8, 16)); ctx.stroke(); } ctx.fillStyle = 'rgba(70,50,30,.16)'; for (var d = 0; d < 14; d++) { ctx.beginPath(); ctx.ellipse(Math.random() * w, Math.random() * h, randf(14, 40), randf(8, 22), Math.random() * 3, 0, 6.29); ctx.fill(); } }, [52, 52]),
    foliage: makeTex(256, 256, function (ctx, w, h) { ctx.fillStyle = '#4c7f36'; ctx.fillRect(0, 0, w, h); var cols = ['#3f6f2c', '#5a9040', '#6fa64b', '#4a7d33', '#87b85a', '#356a27']; for (var i = 0; i < 900; i++) { ctx.fillStyle = cols[i % cols.length]; ctx.beginPath(); ctx.ellipse(Math.random() * w, Math.random() * h, randf(5, 11), randf(3, 6), Math.random() * 3.2, 0, 6.29); ctx.fill(); } ctx.fillStyle = 'rgba(255,255,220,.10)'; for (var j = 0; j < 300; j++) { ctx.beginPath(); ctx.ellipse(Math.random() * w, Math.random() * h, randf(2, 5), randf(1.5, 3), Math.random() * 3.2, 0, 6.29); ctx.fill(); } }, [2, 2]),
    pine: makeTex(256, 256, function (ctx, w, h) { ctx.fillStyle = '#2d5a2a'; ctx.fillRect(0, 0, w, h); var cols = ['#254d22', '#38703a', '#2f6330', '#457f45', '#1f4520']; for (var i = 0; i < 2400; i++) { ctx.strokeStyle = cols[i % cols.length]; ctx.lineWidth = 1; var x = Math.random() * w, y = Math.random() * h; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + randf(-3, 3), y + randf(4, 10)); ctx.stroke(); } }, [2, 2]),
    bark: makeTex(128, 256, function (ctx, w, h) { noiseFill(ctx, w, h, '#5a4330', 24, 3000); ctx.strokeStyle = 'rgba(0,0,0,.35)'; for (var i = 0; i < 90; i++) { ctx.lineWidth = randf(1, 3); var x = Math.random() * w; ctx.beginPath(); ctx.moveTo(x, 0); ctx.bezierCurveTo(x + randf(-6, 6), h * .3, x + randf(-6, 6), h * .7, x + randf(-4, 4), h); ctx.stroke(); } ctx.strokeStyle = 'rgba(255,230,200,.12)'; for (var j = 0; j < 40; j++) { var x2 = Math.random() * w; ctx.beginPath(); ctx.moveTo(x2, 0); ctx.lineTo(x2 + randf(-3, 3), h); ctx.stroke(); } }, [1, 2]),
    tuft: makeAlphaTex(128, 128, function (ctx, w, h) { var cols = ['#4a8a34', '#5f9e42', '#3d7a2c', '#78b04e', '#8cc25a']; for (var i = 0; i < 46; i++) { ctx.strokeStyle = cols[i % cols.length]; ctx.lineWidth = randf(1.5, 3.5); var x0 = w / 2 + randf(-22, 22), x1 = x0 + randf(-30, 30), y1 = randf(4, 50); ctx.beginPath(); ctx.moveTo(x0, h); ctx.quadraticCurveTo(x0 + (x1 - x0) * 0.3, h * 0.55, x1, y1); ctx.stroke(); } }),
    flower: makeAlphaTex(64, 64, function (ctx, w, h) { ctx.strokeStyle = '#4b6b3a'; ctx.lineWidth = 2; [[20, 30], [32, 22], [44, 30]].forEach(function (p) { ctx.beginPath(); ctx.moveTo(p[0] + (32 - p[0]) * 0.5, h); ctx.lineTo(p[0], p[1]); ctx.stroke(); ctx.fillStyle = '#ffffff'; for (var k = 0; k < 5; k++) { ctx.beginPath(); ctx.ellipse(p[0] + Math.cos(k * 1.256) * 5, p[1] + Math.sin(k * 1.256) * 5, 4, 3, k * 1.256, 0, 6.29); ctx.fill(); } ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.arc(p[0], p[1], 2.5, 0, 6.29); ctx.fill(); }); }),
    frond: makeAlphaTex(128, 512, function (ctx, w, h) { ctx.strokeStyle = '#2f5f2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(w / 2, h); ctx.lineTo(w / 2, 6); ctx.stroke(); for (var i = 0; i < 26; i++) { var t = i / 26, y = h - 18 - t * (h - 40), len = (8 + Math.sin(Math.min(1, t * 1.25) * Math.PI) * 50) * (1 - t * 0.25); [-1, 1].forEach(function (sd) { var gr = ctx.createLinearGradient(w / 2, y, w / 2 + sd * len, y - 12); gr.addColorStop(0, '#2f6e30'); gr.addColorStop(1, i % 2 ? '#6fb45a' : '#58a048'); ctx.fillStyle = gr; ctx.save(); ctx.translate(w / 2, y); ctx.rotate(sd * -0.5); ctx.beginPath(); ctx.ellipse(sd * len / 2, 0, len / 2, 6.5 - t * 3, 0, 0, 6.29); ctx.fill(); ctx.restore(); }); } }),
    bigleaf: makeAlphaTex(256, 512, function (ctx, w, h) { var gr = ctx.createLinearGradient(0, h, w, 0); gr.addColorStop(0, '#1f5a2c'); gr.addColorStop(0.6, '#2f7a3a'); gr.addColorStop(1, '#4f9a4c'); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(w / 2, h - 4); ctx.bezierCurveTo(w * 1.05, h * 0.82, w * 1.0, h * 0.25, w / 2, 6); ctx.bezierCurveTo(0, h * 0.25, -w * 0.05, h * 0.82, w / 2, h - 4); ctx.fill(); ctx.strokeStyle = 'rgba(190,230,170,.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(w / 2, h - 4); ctx.lineTo(w / 2, 14); ctx.stroke(); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(190,230,170,.3)'; for (var i = 1; i < 11; i++) { var y = h - i * (h / 11.5); [-1, 1].forEach(function (sd) { ctx.beginPath(); ctx.moveTo(w / 2, y); ctx.quadraticCurveTo(w / 2 + sd * w * 0.25, y - 26, w / 2 + sd * w * 0.42, y - 62); ctx.stroke(); }); } }),
    asphalt: makeTex(256, 256, function (ctx, w, h) { noiseFill(ctx, w, h, '#34363b', 26, 9000); }, [30, 4]),
    pavement: makeTex(256, 256, function (ctx, w, h) { tileDraw(ctx, w, h, 2, 2, function (c, r) { return pick(['#a3a39d', '#9c9c96', '#a9a9a2']); }, '#7a7a74', 4, 0.05); grain(ctx, w, h, 4000, 0.2); }, [45, 1.6]),
    pavementBump: makeBump(256, 256, function (ctx, w, h) { tileDraw(ctx, w, h, 2, 2, '#8a8a8a', '#303030', 4, 0); grain(ctx, w, h, 3000, 0.15); }, [45, 1.6]),
    leaf: makeTex(256, 512, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      // seven serrated leaflets fanning from the base
      var cx = w / 2, cy = h * 0.92;
      var lens = [0.32, 0.55, 0.8, 0.9, 0.8, 0.55, 0.32];
      var angs = [-1.25, -0.85, -0.42, 0, 0.42, 0.85, 1.25];
      for (var i = 0; i < 7; i++) {
        var L = lens[i] * h, a = angs[i];
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
        var grd = ctx.createLinearGradient(0, 0, 0, -L); grd.addColorStop(0, '#2a6e30'); grd.addColorStop(0.55, '#4f9f48'); grd.addColorStop(1, '#8ad474');
        ctx.fillStyle = grd; ctx.beginPath(); ctx.moveTo(0, 0);
        var steps = 18;
        for (var s = 1; s <= steps; s++) { var t = s / steps; var wdt = Math.sin(t * Math.PI) * L * 0.11 + (s % 2 ? L * 0.025 : 0); ctx.lineTo(wdt, -t * L); }
        for (var s2 = steps; s2 >= 1; s2--) { var t2 = s2 / steps; var wdt2 = Math.sin(t2 * Math.PI) * L * 0.11 + (s2 % 2 ? L * 0.025 : 0); ctx.lineTo(-wdt2, -t2 * L); }
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(200,240,180,.55)'; ctx.lineWidth = Math.max(1, w / 128); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -L); ctx.stroke(); ctx.strokeStyle = 'rgba(20,60,20,.4)'; ctx.lineWidth = Math.max(1, w / 180);
        for (var v = 1; v < 6; v++) { var vy = -L * v / 6; ctx.beginPath(); ctx.moveTo(0, vy); ctx.lineTo(L * 0.09, vy - L * 0.06); ctx.moveTo(0, vy); ctx.lineTo(-L * 0.09, vy - L * 0.06); ctx.stroke(); }
        ctx.restore();
      }
    }),
    bud: makeTex(256, 256, function (ctx, w, h) { noiseFill(ctx, w, h, '#8ccf78', 50, 7000); for (var c = 0; c < 70; c++) { var cx = Math.random() * w, cy = Math.random() * h, cr = randf(8, 20), cg = ctx.createRadialGradient(cx - cr * 0.3, cy - cr * 0.3, 1, cx, cy, cr); cg.addColorStop(0, 'rgba(225,255,200,.5)'); cg.addColorStop(0.6, 'rgba(90,150,70,.25)'); cg.addColorStop(1, 'rgba(30,70,30,.4)'); ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx, cy, cr, 0, 6.29); ctx.fill(); } ctx.fillStyle = 'rgba(255,255,255,.75)'; for (var i = 0; i < 700; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 1.4, 1.4); ctx.fillStyle = 'rgba(255,150,60,.55)'; for (var j = 0; j < 30; j++) { ctx.beginPath(); var x = Math.random() * w, y = Math.random() * h; ctx.moveTo(x, y); ctx.lineTo(x + randf(-6, 6), y + randf(-6, 6)); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,150,60,.6)'; ctx.stroke(); } }, [2, 2]),
    poster1: makeTex(256, 384, function (ctx, w, h) { ctx.fillStyle = '#12261a'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#6fdc8c'; ctx.font = '600 44px "Segoe UI",sans-serif'; ctx.textAlign = 'center'; ctx.fillText('GROW', w / 2, 90); ctx.fillText('LOCAL', w / 2, 140); ctx.font = '22px "Segoe UI",sans-serif'; ctx.fillStyle = '#c9e8d0'; ctx.fillText('small batch · hand cured', w / 2, 200); ctx.fillStyle = '#6fdc8c'; for (var i = 0; i < 7; i++) { ctx.save(); ctx.translate(w / 2, 300); ctx.rotate((i - 3) * 0.4); ctx.fillRect(-4, -70, 8, 70); ctx.restore(); } }),
    poster2: makeTex(256, 384, function (ctx, w, h) { ctx.fillStyle = '#3a2a1e'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#ffc857'; ctx.font = '600 40px "Segoe UI",sans-serif'; ctx.textAlign = 'center'; ctx.fillText('GROW CO.', w / 2, 80); ctx.font = '600 92px "Segoe UI",sans-serif'; ctx.fillText('420', w / 2, 210); ctx.font = '20px "Segoe UI",sans-serif'; ctx.fillStyle = '#f0e0c0'; ctx.fillText('prices up every rush', w / 2, 260); ctx.fillText('ask at the window', w / 2, 290); ctx.strokeStyle = '#ffc857'; ctx.lineWidth = 4; ctx.strokeRect(14, 14, w - 28, h - 28); }),
    poster3: makeTex(256, 384, function (ctx, w, h) { ctx.fillStyle = '#1a1c2e'; ctx.fillRect(0, 0, w, h); var g = ctx.createRadialGradient(w / 2, h * 0.4, 10, w / 2, h * 0.4, 150); g.addColorStop(0, '#ff69b4'); g.addColorStop(0.5, '#7a4aa8'); g.addColorStop(1, '#1a1c2e'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#ffffff'; ctx.font = '600 34px "Segoe UI",sans-serif'; ctx.textAlign = 'center'; ctx.fillText('RAINBOW', w / 2, 300); ctx.fillText('RUNTZ', w / 2, 340); ctx.font = '18px "Segoe UI",sans-serif'; ctx.fillText('level 9 unlock', w / 2, 370); })
  };
  TEX.leaf.wrapS = TEX.leaf.wrapT = THREE.ClampToEdgeWrapping;
  [TEX.poster1, TEX.poster2, TEX.poster3].forEach(function (t) { t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; });
  function emojiTex(emoji, size, bg) {
    var c = document.createElement('canvas'); c.width = c.height = size || 128; var ctx = c.getContext('2d');
    if (bg) { ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(c.width / 2, c.height / 2, c.width / 2 - 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.font = Math.floor(c.width * 0.62) + 'px "Segoe UI Emoji","Apple Color Emoji",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(emoji, c.width / 2, c.height / 2 + c.width * 0.04);
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  }
  var SIGN_FONT = 'Bahnschrift,"DIN Alternate","Segoe UI Variable Display","Segoe UI",system-ui,sans-serif';
  function textTex(lines, w, h, opts) {
    opts = opts || {}; var K = 2, c = document.createElement('canvas'); c.width = w * K; c.height = h * K; var ctx = c.getContext('2d'); ctx.scale(K, K);
    var own = opts.bg !== undefined, r = Math.min(16, h * 0.2), accent = opts.titleColor || '#6fdc8c';
    if (own) { ctx.fillStyle = opts.bg; roundRect(ctx, 2, 2, w - 4, h - 4, r); ctx.fill(); ctx.strokeStyle = opts.line || 'rgba(111,220,140,.6)'; ctx.lineWidth = 3; roundRect(ctx, 2, 2, w - 4, h - 4, r); ctx.stroke(); }
    else {   /* the shop's own sign plate: near-black enamel, a hairline of the sign's colour set in from the edge */
      var g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1b211f'); g.addColorStop(1, '#0a0d0c'); ctx.fillStyle = g; roundRect(ctx, 1, 1, w - 2, h - 2, r); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 2; roundRect(ctx, 1, 1, w - 2, h - 2, r); ctx.stroke();
      ctx.strokeStyle = opts.line || accent; ctx.globalAlpha = opts.line ? 1 : 0.55; ctx.lineWidth = 1.5; roundRect(ctx, 6, 6, w - 12, h - 12, Math.max(2, r - 4)); ctx.stroke(); ctx.globalAlpha = 1;
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var fs = opts.size || 30, rows = lines.map(function (l, i) {
      var title = i === 0 && lines.length > 1, size = title ? fs * 1.1 : (lines.length > 1 && !own ? fs * 0.86 : fs), wt = opts.bold || title || (lines.length === 1 && !own) ? '600 ' : '';
      ctx.font = wt + size + 'px ' + SIGN_FONT; var tw = ctx.measureText(l).width, max = w - (own ? 10 : 22); if (tw > max) size = Math.max(6, size * max / tw);
      return { t: l, size: size, wt: wt, col: i === 0 && opts.titleColor ? opts.titleColor : (opts.color || (i === 0 ? '#f3eee0' : '#b9c2b6')) };
    });
    var total = rows.reduce(function (a, rw) { return a + rw.size * 1.22; }, 0), y = h / 2 - total / 2;
    rows.forEach(function (rw) { ctx.font = rw.wt + rw.size + 'px ' + SIGN_FONT; ctx.fillStyle = rw.col; ctx.fillText(rw.t, w / 2, y + rw.size * 0.64); y += rw.size * 1.22; });
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t;
  }
  // what a sign is fixed to: a plate of dark metal a little bigger than the print, stood off the wall on four studs. Hung on the
  // sign's own mesh, so whatever moves the sign (build mode, a prop) moves its plate with it.
  function signBack(m, w, h) {
    var pl = new THREE.Mesh(bevelGeo(w + 0.024, h + 0.024, 0.014, 0.005), MAT.gunmetal); pl.position.z = -0.0085; pl.castShadow = true; pl.userData.noDefight = true; m.add(pl);
    if (w > 0.5 && h > 0.2) [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) { var st = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.006, 12), MAT.chrome); st.rotation.x = Math.PI / 2; st.position.set(s[0] * (w / 2 - 0.028), s[1] * (h / 2 - 0.028), 0.003); m.add(st); });
    return m;
  }
  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  var MAT = {
    floor: new THREE.MeshStandardMaterial({ map: TEX.concrete, bumpMap: TEX.concreteBump, bumpScale: 0.02, roughness: 0.85, metalness: 0.05 }),
    tile: new THREE.MeshStandardMaterial({ map: TEX.tile, bumpMap: TEX.tileBump, bumpScale: 0.03, roughness: 0.35, metalness: 0.05 }),
    planks: new THREE.MeshStandardMaterial({ map: TEX.planks, bumpMap: TEX.planksBump, bumpScale: 0.025, roughness: 0.55 }),
    rubber: new THREE.MeshStandardMaterial({ map: TEX.rubber, bumpMap: TEX.rubberBump, bumpScale: 0.03, roughness: 0.9 }),
    wall: new THREE.MeshStandardMaterial({ map: TEX.wall, bumpMap: TEX.wallBump, bumpScale: 0.01, roughness: 0.92 }),
    accent: new THREE.MeshStandardMaterial({ map: TEX.accent, bumpMap: TEX.wallBump, bumpScale: 0.01, roughness: 0.9 }),
    brick: new THREE.MeshStandardMaterial({ map: TEX.brick, bumpMap: TEX.brickBump, bumpScale: 0.06, roughness: 0.95 }),
    brickDark: new THREE.MeshStandardMaterial({ map: TEX.brickDark, bumpMap: TEX.brickBump, bumpScale: 0.06, roughness: 0.9 }),
    ceiling: new THREE.MeshStandardMaterial({ map: TEX.ceiling, bumpMap: TEX.ceilingBump, bumpScale: 0.02, roughness: 1 }),
    trim: new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.5 }),
    wood: new THREE.MeshStandardMaterial({ map: TEX.wood, bumpMap: TEX.woodBump, bumpScale: 0.006, roughness: 0.52 }),
    darkwood: new THREE.MeshStandardMaterial({ map: TEX.darkwood, bumpMap: TEX.woodBump, bumpScale: 0.006, roughness: 0.48 }),
    metal: new THREE.MeshStandardMaterial({ map: TEX.brushed, color: 0xd0d4da, roughness: 0.4, metalness: 0.85 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xe8ecf2, roughness: 0.15, metalness: 1.0 }),
    black: new THREE.MeshStandardMaterial({ color: 0x15171b, roughness: 0.6 }),
    plastic: new THREE.MeshStandardMaterial({ color: 0x2a2d33, roughness: 0.45, metalness: 0.05 }),
    tent: new THREE.MeshStandardMaterial({ map: TEX.tent, roughness: 0.9, side: THREE.DoubleSide }),
    mylar: new THREE.MeshStandardMaterial({ map: TEX.mylar, roughness: 0.25, metalness: 0.35, side: THREE.BackSide }),
    pot: new THREE.MeshStandardMaterial({ map: TEX.terracotta, roughness: 0.85 }),
    soil: new THREE.MeshStandardMaterial({ map: TEX.soil, roughness: 1 }),
    stem: new THREE.MeshStandardMaterial({ color: 0x4f8a3a, roughness: 0.8 }),
    leaf: new THREE.MeshStandardMaterial({ map: TEX.leaf, transparent: true, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.8 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xbfe0ff, transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.1, side: THREE.DoubleSide }),
    screenGlass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.07, roughness: 0.04, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.03, depthWrite: false }),   /* the sheet of glass over a lit screen: nearly invisible head on, a highlight at an angle */
    steel: new THREE.MeshStandardMaterial({ map: TEX.brushed, color: 0x8b929b, roughness: 0.34, metalness: 0.9 }),
    gunmetal: new THREE.MeshStandardMaterial({ map: TEX.brushed, color: 0x4a5058, roughness: 0.38, metalness: 0.85 }),
    alu: new THREE.MeshStandardMaterial({ color: 0xc9ced4, roughness: 0.28, metalness: 0.92 }),
    gloss: new THREE.MeshPhysicalMaterial({ color: 0x14171b, roughness: 0.22, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.08 }),   /* piano-black plastic: bezels, device shells */
    soft: new THREE.MeshStandardMaterial({ color: 0x1f2226, roughness: 0.82, metalness: 0.0 }),   /* soft-touch rubberised plastic: keys, grips, feet */
    brass: new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.3, metalness: 1.0 }),
    jar: new THREE.MeshPhysicalMaterial({ color: 0xd8f0ff, transparent: true, opacity: 0.35, roughness: 0.05 }),
    jarLid: new THREE.MeshStandardMaterial({ color: 0x2b2f33, roughness: 0.5, metalness: 0.4 }),
    bud: new THREE.MeshStandardMaterial({ map: TEX.bud, color: 0x7fc96b, roughness: 0.9 }),
    grass: new THREE.MeshStandardMaterial({ map: TEX.grass, roughness: 1 }),
    foliage: new THREE.MeshStandardMaterial({ map: TEX.foliage, roughness: 0.95 }),
    pine: new THREE.MeshStandardMaterial({ map: TEX.pine, roughness: 0.95 }),
    bark: new THREE.MeshStandardMaterial({ map: TEX.bark, roughness: 0.95 }),
    frond: new THREE.MeshStandardMaterial({ map: TEX.frond, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.7 }),
    bigleaf: new THREE.MeshPhysicalMaterial({ map: TEX.bigleaf, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.3 }),
    ceramic: new THREE.MeshPhysicalMaterial({ color: 0xeee9dc, roughness: 0.28, clearcoat: 0.8, clearcoatRoughness: 0.12 }),
    tuft: new THREE.MeshStandardMaterial({ map: TEX.tuft, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 }),
    flower: new THREE.MeshStandardMaterial({ map: TEX.flower, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 }),
    asphalt: new THREE.MeshStandardMaterial({ map: TEX.asphalt, roughness: 1 }),
    pavement: new THREE.MeshStandardMaterial({ map: TEX.pavement, bumpMap: TEX.pavementBump, bumpScale: 0.03, roughness: 0.95 }),
    tree: new THREE.MeshStandardMaterial({ color: 0x2f6b33, roughness: 1 }),
    trunk: new THREE.MeshStandardMaterial({ color: 0x5a3d22, roughness: 1 }),
    screen: new THREE.MeshStandardMaterial({ color: 0x0b1a12, emissive: 0x2dd67a, emissiveIntensity: 0.6, roughness: 0.3 }),
    counter: new THREE.MeshStandardMaterial({ map: TEX.darkwood, bumpMap: TEX.woodBump, bumpScale: 0.006, color: 0x8a9a8a, roughness: 0.55 }),
    counterTop: new THREE.MeshPhysicalMaterial({ map: TEX.stone, color: 0xd6d1c6, roughness: 0.22, metalness: 0.02, clearcoat: 0.6, clearcoatRoughness: 0.15 }),
    register: new THREE.MeshStandardMaterial({ color: 0x3b4650, roughness: 0.4, metalness: 0.3 }),
    rope: new THREE.MeshStandardMaterial({ color: 0x8a7a5a, roughness: 1 }),
    fabric: new THREE.MeshStandardMaterial({ map: TEX.fabric, color: 0x4a3b5c, roughness: 0.95 }),
    white: new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.6 }),
    highlight: new THREE.MeshBasicMaterial({ color: 0x6fdc8c, transparent: true, opacity: 0.25, side: THREE.DoubleSide }),
    none: new THREE.MeshBasicMaterial({ visible: false })
  };
  // a discarded part of the scene gives its GPU buffers back. Shared tables (MAT, TEX, product materials, face textures) are left alone.
  // What disposeTree must never free: the shared materials, textures and product materials, the cached faces, and the
  // geometries every human and plant is built from. Gathered into a Set once, and again only when a table grows or shrinks.
  var disposeKeep = { set: null, sig: '' };
  function disposeShared() {
    var tabs = [MAT, TEX, typeof PROD_M === 'object' ? PROD_M : null, typeof faceCache === 'object' ? faceCache : null, typeof HUMAN_GEO === 'object' ? HUMAN_GEO : null];
    var geos = [typeof FROND_GEO === 'object' ? FROND_GEO : null, typeof BIGLEAF_GEO === 'object' ? BIGLEAF_GEO : null, typeof LEAF_GEO === 'object' ? LEAF_GEO : null, typeof LEAF_GEO_SM === 'object' ? LEAF_GEO_SM : null, typeof BUD_GEO === 'object' ? BUD_GEO : null];
    var sig = tabs.map(function (tb) { return tb ? Object.keys(tb).length : '-'; }).join(',') + '/' + geos.map(function (g) { return g ? 1 : 0; }).join('');
    if (disposeKeep.set && disposeKeep.sig === sig) return disposeKeep.set;
    var set = new Set();
    tabs.forEach(function (tb) { if (tb) for (var k in tb) { var v = tb[k]; if (v && typeof v === 'object') { set.add(v); if (v.map) set.add(v.map); } } });
    geos.forEach(function (g) { if (g) set.add(g); });
    disposeKeep.set = set; disposeKeep.sig = sig; return set;
  }
  function disposeTree(root) {
    if (!root || !root.traverse) return; var keep = disposeShared();
    root.traverse(function (o) {
      if (o.geometry && o.geometry.dispose && !o.isSprite && !keep.has(o.geometry)) o.geometry.dispose();   /* every sprite shares three.js's one quad */
      var ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      ms.forEach(function (m) { if (!m || keep.has(m)) return; if (m.map && m.map.isCanvasTexture && !keep.has(m.map)) m.map.dispose(); if (m.dispose) m.dispose(); });
    });
  }
  function clearKids(g) { while (g.children.length) { var ch = g.children[0]; g.remove(ch); disposeTree(ch); } }
  MAT.brick.userData.tile = [2.0, 0.6]; MAT.brickDark.userData.tile = [2.0, 0.6]; TEX.brickBump.repeat.set(1, 1);
  function colorMat(hex, rough, metal, extra) { var m = new THREE.MeshStandardMaterial({ color: hex, roughness: rough === undefined ? 0.7 : rough, metalness: metal || 0 }); if (extra) for (var k in extra) m[k] = extra[k]; return m; }
  function fabricMat(hex) { var m = MAT.fabric.clone(); m.color.setHex(hex); return m; }
  function glowMat(hex, intensity) { return new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: intensity || 1.5, roughness: 0.4 }); }

  // Every box in the game has its edges eased: a dead sharp edge catches no light and reads as cardboard. The eased box still
  // says type 'BoxGeometry' with the same parameters, so the de-fight pass and the sight line treat it as the box it is.
  // Left sharp: hit boxes, anything thinner than 24 mm or longer than 3.2 m, and the building's own surfaces (walls, floors and
  // skirting are laid in runs of boxes, and an eased edge would draw a groove at every join).
  var BEVEL = { on: true, max: 0.012, faces: [['z', 'y', -1, -1], ['z', 'y', 1, -1], ['x', 'z', 1, 1], ['x', 'z', 1, -1], ['x', 'y', 1, -1], ['x', 'y', -1, -1]] };
  function bevelGeo(w, h, d, r, k) {
    var mn = Math.min(w, h, d), mx = Math.max(w, h, d);
    if (r === undefined) r = (!BEVEL.on || mn < 0.024 || mx > 3.2) ? 0 : Math.min(BEVEL.max, mn * 0.22);
    if (!(r > 0) || !(mn > 0)) return new THREE.BoxGeometry(w, h, d);
    r = Math.min(r, mn * 0.499); k = Math.max(1, Math.round(k || (r > 0.03 ? 3 : r > 0.015 ? 2 : 1)));   /* a big radius needs more than one step to read as round */
    var n = 2 * k + 1, per = (n + 1) * (n + 1), g = new THREE.BoxGeometry(w, h, d, n, n, n), pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv, half = { x: w / 2, y: h / 2, z: d / 2 }, v = new THREE.Vector3(), c = new THREE.Vector3();
    function ax(p, hf) { var i = Math.round((p + hf) / (2 * hf) * n); return i <= k ? -hf + r - r * Math.tan((k - i) / k * Math.PI / 4) : hf - r + r * Math.tan((i - (n - k)) / k * Math.PI / 4); }   /* rows spaced so the corner turns in equal angles */
    for (var i = 0; i < pos.count; i++) {
      v.set(ax(pos.getX(i), half.x), ax(pos.getY(i), half.y), ax(pos.getZ(i), half.z));
      var fc = BEVEL.faces[Math.floor(i / per)]; uv.setXY(i, (v[fc[0]] * fc[2] + half[fc[0]]) / (2 * half[fc[0]]), 1 - (v[fc[1]] * fc[3] + half[fc[1]]) / (2 * half[fc[1]]));   /* the texture keeps its scale: the rows of vertices moved, the picture did not */
      c.set(clamp(v.x, -half.x + r, half.x - r), clamp(v.y, -half.y + r, half.y - r), clamp(v.z, -half.z + r, half.z - r));
      v.sub(c); if (v.lengthSq() > 1e-12) { v.normalize(); nor.setXYZ(i, v.x, v.y, v.z); pos.setXYZ(i, c.x + v.x * r, c.y + v.y * r, c.z + v.z * r); }
    }
    return g;
  }
  // a body part cut from an eased box: narrower at one end than the other, the way a chest runs down to a waist
  function taperGeo(g, h, sx0, sz0) { var p = g.attributes.position; for (var i = 0; i < p.count; i++) { var t = clamp((p.getY(i) + h / 2) / h, 0, 1); p.setX(i, p.getX(i) * lerp(sx0, 1, t)); p.setZ(i, p.getZ(i) * lerp(sz0, 1, t)); } g.computeVertexNormals(); return g; }
  // The same for anything turned: a cylinder's rims are eased and it gets enough sides to read as round. It still says
  // 'CylinderGeometry' with its own radii and height, which is what the sight line reads. Wires and rods are left alone.
  function roundCylGeo(rt, rb, h, seg) {
    var rmax = Math.max(rt, rb), rmin = Math.min(rt, rb), r = (!BEVEL.on || rmax < 0.025 || h < 0.02) ? 0 : Math.min(BEVEL.max, h * 0.22, rmin * 0.3);
    seg = seg || 18; if (rmax >= 0.025) seg = Math.max(seg, rmax > 0.12 ? 32 : rmax > 0.05 ? 24 : 16);
    if (!(r > 0.0012)) return new THREE.CylinderGeometry(rt, rb, h, seg);
    var g = new THREE.CylinderGeometry(rt, rb, h, seg, 3), pos = g.attributes.position, nor = g.attributes.normal, row = seg + 1, torso = 4 * row, slope = (rb - rt) / h;
    for (var i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i), top = pos.getY(i) > 0, len = Math.hypot(x, z) || 1, ux = x / len, uz = z / len, rad, y;
      if (i < torso) {
        var rw = Math.floor(i / row);
        if (rw === 0) { rad = rt - r; y = h / 2; } else if (rw === 1) { rad = rt + slope * r; y = h / 2 - r; } else if (rw === 2) { rad = rb - slope * r; y = -h / 2 + r; } else { rad = rb - r; y = -h / 2; }
        if (rw === 0 || rw === 3) { var ny = rw === 0 ? 0.7071 : -0.7071; nor.setXYZ(i, nor.getX(i) * 0.7071, ny, nor.getZ(i) * 0.7071); var nl = Math.hypot(nor.getX(i), nor.getY(i), nor.getZ(i)) || 1; nor.setXYZ(i, nor.getX(i) / nl, nor.getY(i) / nl, nor.getZ(i) / nl); }
        pos.setXYZ(i, ux * rad, y, uz * rad);
      } else if (len > 1e-6) { rad = (top ? rt : rb) - r; pos.setXYZ(i, ux * rad, pos.getY(i), uz * rad); }
    }
    return g;
  }
  // What stands on a floor darkens it: a soft patch the size of the thing's footprint, laid just above the floor. The rooms
  // are lit by lamps that cast no shadows of their own, and without this the furniture floats.
  var BLOB_TEX = makeAlphaTex(128, 128, function (ctx, w, h) { ctx.shadowColor = 'rgba(0,0,0,1)'; ctx.shadowBlur = 26; ctx.fillStyle = 'rgba(0,0,0,.92)'; roundRect(ctx, 34, 34, w - 68, h - 68, 10); ctx.fill(); ctx.fill(); });
  var BLOB_MAT = new THREE.MeshBasicMaterial({ map: BLOB_TEX, color: 0x000000, transparent: true, opacity: 0.62, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  var blobBox = new THREE.Box3(), blobOne = new THREE.Box3();
  function floorBlob(w, d, x, y, z, parent, k) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.55 + 0.16, d * 1.55 + 0.16), BLOB_MAT); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.renderOrder = 1; m.userData.noDefight = true; m.userData.soft = true; m.userData.blob = true; m.raycast = function () {};
    if (k) { m.material = BLOB_MAT.clone(); m.material.opacity = k; } (parent || world.group).add(m); return m;
  }
  function groundBlob(g) {   // g is a group standing at its own origin: the patch covers whatever of it comes within half a metre of the floor
    var px = g.position.x, py = g.position.y, pz = g.position.z, ry = g.rotation.y; g.position.set(0, 0, 0); g.rotation.y = 0; g.updateMatrixWorld(true); blobBox.makeEmpty();
    g.traverse(function (o) { if (!o.isMesh || !o.geometry || o.userData.blob) return; var mt = Array.isArray(o.material) ? o.material[0] : o.material; if (!mt || mt.visible === false || o.visible === false) return; if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); blobOne.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); if (blobOne.min.y < 0.5 && blobOne.max.y > -0.05) blobBox.union(blobOne); });
    g.position.set(px, py, pz); g.rotation.y = ry; g.updateMatrixWorld(true);
    if (blobBox.isEmpty() || blobBox.min.y > 0.22) return null; var w = blobBox.max.x - blobBox.min.x, d = blobBox.max.z - blobBox.min.z; if (w < 0.08 || d < 0.08 || w > 5 || d > 5) return null;
    return floorBlob(w, d, (blobBox.min.x + blobBox.max.x) / 2, 0.007, (blobBox.min.z + blobBox.max.z) / 2, g);
  }
  // a leaf that arches: a strip standing on its base at the origin, bowed forward along its length and folded a little along its spine
  function archLeafGeo(w, len, bow, fold) { var g = new THREE.PlaneGeometry(w, len, 2, 8); g.translate(0, len / 2, 0); var p = g.attributes.position; for (var i = 0; i < p.count; i++) { var t = p.getY(i) / len, x = p.getX(i); p.setXYZ(i, x, p.getY(i) * (1 - 0.16 * t * t), t * t * bow - Math.abs(x) * fold); } g.computeVertexNormals(); return g; }
  var FROND_GEO = archLeafGeo(0.2, 0.78, 0.34, 0.35), BIGLEAF_GEO = archLeafGeo(0.3, 0.52, 0.16, 0.25);
  function leafAt(geo, mat, x, y, z, yaw, tilt, sc, parent) { var m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.order = 'YXZ'; m.rotation.set(tilt, yaw, 0); m.scale.setScalar(sc); m.castShadow = true; parent.add(m); return m; }
  function bevelSkip(mat) { return !mat || mat === MAT.none || mat === MAT.wall || mat === MAT.accent || mat === MAT.trim || mat === MAT.ceiling || mat === MAT.floor || mat === MAT.tile || mat === MAT.planks || mat === MAT.rubber || mat === MAT.asphalt || mat === MAT.pavement || mat === MAT.grass || mat === MAT.glass || mat.visible === false || !!(mat.userData && mat.userData.tile); }
  function box(w, h, d, mat, x, y, z, opts) {
    var g = (opts && opts.sharp) || bevelSkip(mat) ? new THREE.BoxGeometry(w, h, d) : bevelGeo(w, h, d, opts && opts.r);
    if (mat && mat.userData && mat.userData.tile) { var tl = mat.userData.tile, uv = g.attributes.uv; for (var ui = 0; ui < uv.count; ui++) { var fc = Math.floor(ui / 4), fw = fc < 2 ? d : w, fh = fc >= 2 && fc < 4 ? d : h; uv.setXY(ui, uv.getX(ui) * fw / tl[0], uv.getY(ui) * fh / tl[1]); } }   /* a material tiled in metres: the same brick on every panel whatever its size */
    var m = new THREE.Mesh(g, mat); m.position.set(x, y, z);
    opts = opts || {}; m.castShadow = opts.cast !== false; m.receiveShadow = opts.receive !== false;
    if (opts.parent) opts.parent.add(m); else world.group.add(m);
    if (opts.solid) world.obstacles.push({ x1: x - w / 2, x2: x + w / 2, z1: z - d / 2, z2: z + d / 2, tag: opts.tag, floorLevel: opts.floorLevel || 0 });
    return m;
  }
  function cyl(rt, rb, h, mat, x, y, z, parent, seg) {
    var m = new THREE.Mesh(roundCylGeo(rt, rb, h, seg || 18), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; (parent || world.group).add(m); return m;
  }
  function sprite(tex, w, h, x, y, z, parent) {
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })); sp.scale.set(w, h, 1); sp.position.set(x, y, z); (parent || world.group).add(sp); return sp;
  }
  function interactable(mesh, data) { mesh.userData.interact = data; world.interact.push(mesh); return mesh; }

  // Lighting: sky/sun (day-night), ambient, and the tent lamp (tiered)
  var fogCol = new THREE.Color(), SNOW_FOG = new THREE.Color(0x9fb2c0), RAIN_FOG = new THREE.Color(0x55606b);
  var hemi = new THREE.HemisphereLight(0xbcd8ff, 0x3a2f22, 0.32); scene.add(hemi);
  var sun = new THREE.DirectionalLight(0xfff1d6, 1.1); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -34; sun.shadow.camera.right = 34; sun.shadow.camera.top = 34; sun.shadow.camera.bottom = -34; sun.shadow.camera.near = 1; sun.shadow.camera.far = 60; sun.shadow.bias = -0.0008;
  scene.add(sun); scene.add(sun.target);
  var roomLight = new THREE.PointLight(0xfff3e0, 0.3, 24, 1.6); roomLight.position.set(0, ROOM.h - 0.3, 0); scene.add(roomLight);
  var roomLight2 = new THREE.PointLight(0xfff3e0, 0.2, 18, 1.6); roomLight2.position.set(5, ROOM.h - 0.3, -3); scene.add(roomLight2);
  var roomLight3 = new THREE.PointLight(0xfff3e0, 0.2, 18, 1.6); roomLight3.position.set(-5, ROOM.h - 0.3, 3); scene.add(roomLight3);
  var tentLight = new THREE.SpotLight(0xffffff, 0, 9, Math.PI / 3.2, 0.5, 1.2); tentLight.castShadow = true; tentLight.shadow.mapSize.set(1024, 1024); scene.add(tentLight); scene.add(tentLight.target);
  var tentFill = new THREE.PointLight(0xffffff, 0, 8, 1.5); scene.add(tentFill);
  scene.fog = new THREE.Fog(0x9fb7d0, 30, 110);

