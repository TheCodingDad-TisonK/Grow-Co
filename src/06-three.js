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
  var TEX = {
    concrete: makeTex(512, 512, function (ctx, w, h) { noiseFill(ctx, w, h, '#6d6f6a', 30, 14000); ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 3; for (var i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(Math.random() * w, 0); ctx.bezierCurveTo(Math.random() * w, h * .3, Math.random() * w, h * .7, Math.random() * w, h); ctx.stroke(); } ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 4; ctx.strokeRect(2, 2, w - 4, h - 4); }, [6, 4.5]),
    concreteBump: makeBump(512, 512, function (ctx, w, h) { grain(ctx, w, h, 9000, 0.35); ctx.strokeStyle = '#303030'; ctx.lineWidth = 6; ctx.strokeRect(3, 3, w - 6, h - 6); }, [6, 4.5]),
    wall: makeTex(256, 256, function (ctx, w, h) { noiseFill(ctx, w, h, '#d9d5c9', 8, 2500); }, [4, 2]),
    wallBump: makeBump(256, 256, function (ctx, w, h) { grain(ctx, w, h, 5000, 0.18); }, [4, 2]),
    accent: makeTex(256, 256, function (ctx, w, h) { noiseFill(ctx, w, h, '#2f5a45', 10, 2500); }, [4, 2]),
    brick: makeTex(512, 256, function (ctx, w, h) { brickDraw(ctx, w, h, 8, 8, function () { return pick(['#8a4a3a', '#95553f', '#7c4335', '#9a5c48', '#83483a']); }, '#c9c2b4', 6); grain(ctx, w, h, 6000, 0.25); }, [1, 1]),   /* repeat 1: box() sizes brick UVs in metres so every panel shows the same brick */
    brickBump: makeBump(512, 256, function (ctx, w, h) { brickDraw(ctx, w, h, 8, 8, null, '#303030', 6, true); grain(ctx, w, h, 4000, 0.2); }, [3, 1.5]),
    brickDark: makeTex(512, 256, function (ctx, w, h) { brickDraw(ctx, w, h, 8, 8, function () { return pick(['#2d3034', '#33363b', '#2a2c30', '#383b40']); }, '#4a4d52', 6); grain(ctx, w, h, 5000, 0.25); }, [1, 1]),
    tile: makeTex(512, 512, function (ctx, w, h) { tileDraw(ctx, w, h, 4, 4, function (c, r) { return (c + r) % 2 ? '#d7d2c4' : '#c8c2b2'; }, '#8d877b', 6, 0.06); grain(ctx, w, h, 8000, 0.2); }, [6, 2.5]),
    tileBump: makeBump(512, 512, function (ctx, w, h) { tileDraw(ctx, w, h, 4, 4, '#8a8a8a', '#2a2a2a', 6, 0); grain(ctx, w, h, 5000, 0.15); }, [6, 2.5]),
    planks: makeTex(512, 512, function (ctx, w, h) { var rows = 8; ctx.fillStyle = '#3a2a1a'; ctx.fillRect(0, 0, w, h); for (var r = 0; r < rows; r++) { var off = (r % 3) * w / 3; for (var seg = -1; seg < 3; seg++) { var x = seg * w / 2 + off; ctx.fillStyle = pick(['#9a6a3e', '#a9773f', '#8d5f34', '#b0804a', '#946638']); ctx.fillRect(x + 2, r * h / rows + 2, w / 2 - 4, h / rows - 4); } } for (var i = 0; i < 90; i++) { ctx.strokeStyle = 'rgba(0,0,0,' + randf(0.05, 0.22) + ')'; ctx.lineWidth = randf(0.6, 2); ctx.beginPath(); var y = Math.random() * h; ctx.moveTo(0, y); ctx.bezierCurveTo(w * .3, y + randf(-4, 4), w * .6, y + randf(-4, 4), w, y + randf(-3, 3)); ctx.stroke(); } grain(ctx, w, h, 4000, 0.15); }, [4, 4]),
    planksBump: makeBump(512, 512, function (ctx, w, h) { var rows = 8; for (var r = 0; r < rows; r++) { var off = (r % 3) * w / 3; ctx.fillStyle = '#2a2a2a'; ctx.fillRect(0, r * h / rows, w, 3); for (var seg = -1; seg < 3; seg++) { ctx.fillRect(seg * w / 2 + off, r * h / rows, 3, h / rows); } } grain(ctx, w, h, 5000, 0.15); }, [4, 4]),
    rubber: makeTex(256, 256, function (ctx, w, h) { noiseFill(ctx, w, h, '#2e3236', 14, 4000); ctx.fillStyle = 'rgba(255,255,255,.05)'; for (var y = 0; y < h; y += 16) for (var x = 0; x < w; x += 16) { ctx.beginPath(); ctx.arc(x + 8 + ((y / 16) % 2) * 0, y + 8, 3, 0, Math.PI * 2); ctx.fill(); } }, [10, 6]),
    rubberBump: makeBump(256, 256, function (ctx, w, h) { ctx.fillStyle = '#a8a8a8'; for (var y = 0; y < h; y += 16) for (var x = 0; x < w; x += 16) { ctx.beginPath(); ctx.arc(x + 8, y + 8, 3, 0, Math.PI * 2); ctx.fill(); } grain(ctx, w, h, 3000, 0.12); }, [10, 6]),
    ceiling: makeTex(512, 512, function (ctx, w, h) { tileDraw(ctx, w, h, 2, 2, '#e7e4dc', '#b9b5aa', 8, 0); for (var i = 0; i < 2600; i++) { ctx.fillStyle = 'rgba(0,0,0,' + randf(0.04, 0.16) + ')'; ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2); } }, [10, 7.5]),
    ceilingBump: makeBump(512, 512, function (ctx, w, h) { tileDraw(ctx, w, h, 2, 2, '#8a8a8a', '#3a3a3a', 8, 0); grain(ctx, w, h, 5000, 0.2); }, [10, 7.5]),
    wood: makeTex(256, 256, function (ctx, w, h) { ctx.fillStyle = '#8b6239'; ctx.fillRect(0, 0, w, h); for (var i = 0; i < 40; i++) { ctx.strokeStyle = 'rgba(0,0,0,' + randf(0.05, 0.2) + ')'; ctx.lineWidth = randf(1, 3); ctx.beginPath(); var y = Math.random() * h; ctx.moveTo(0, y); ctx.bezierCurveTo(w * .3, y + randf(-8, 8), w * .6, y + randf(-8, 8), w, y + randf(-6, 6)); ctx.stroke(); } }, [2, 1]),
    darkwood: makeTex(256, 256, function (ctx, w, h) { ctx.fillStyle = '#3e2a1a'; ctx.fillRect(0, 0, w, h); for (var i = 0; i < 50; i++) { ctx.strokeStyle = 'rgba(0,0,0,' + randf(0.08, 0.3) + ')'; ctx.lineWidth = randf(1, 2.5); ctx.beginPath(); var y = Math.random() * h; ctx.moveTo(0, y); ctx.bezierCurveTo(w * .3, y + randf(-6, 6), w * .6, y + randf(-6, 6), w, y + randf(-4, 4)); ctx.stroke(); } grain(ctx, w, h, 1500, 0.15); }, [2, 1]),
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
    asphalt: makeTex(256, 256, function (ctx, w, h) { noiseFill(ctx, w, h, '#34363b', 26, 9000); }, [30, 4]),
    pavement: makeTex(256, 256, function (ctx, w, h) { tileDraw(ctx, w, h, 2, 2, function (c, r) { return pick(['#a3a39d', '#9c9c96', '#a9a9a2']); }, '#7a7a74', 4, 0.05); grain(ctx, w, h, 4000, 0.2); }, [45, 1.6]),
    pavementBump: makeBump(256, 256, function (ctx, w, h) { tileDraw(ctx, w, h, 2, 2, '#8a8a8a', '#303030', 4, 0); grain(ctx, w, h, 3000, 0.15); }, [45, 1.6]),
    leaf: makeTex(128, 256, function (ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      // seven serrated leaflets fanning from the base
      var cx = w / 2, cy = h * 0.92;
      var lens = [0.32, 0.55, 0.8, 0.9, 0.8, 0.55, 0.32];
      var angs = [-1.25, -0.85, -0.42, 0, 0.42, 0.85, 1.25];
      for (var i = 0; i < 7; i++) {
        var L = lens[i] * h, a = angs[i];
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
        var grd = ctx.createLinearGradient(0, 0, 0, -L); grd.addColorStop(0, '#2f7a34'); grd.addColorStop(1, '#79c86a');
        ctx.fillStyle = grd; ctx.beginPath(); ctx.moveTo(0, 0);
        var steps = 18;
        for (var s = 1; s <= steps; s++) { var t = s / steps; var wdt = Math.sin(t * Math.PI) * L * 0.11 + (s % 2 ? L * 0.025 : 0); ctx.lineTo(wdt, -t * L); }
        for (var s2 = steps; s2 >= 1; s2--) { var t2 = s2 / steps; var wdt2 = Math.sin(t2 * Math.PI) * L * 0.11 + (s2 % 2 ? L * 0.025 : 0); ctx.lineTo(-wdt2, -t2 * L); }
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(20,60,20,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -L); ctx.stroke();
        for (var v = 1; v < 6; v++) { var vy = -L * v / 6; ctx.beginPath(); ctx.moveTo(0, vy); ctx.lineTo(L * 0.09, vy - L * 0.06); ctx.moveTo(0, vy); ctx.lineTo(-L * 0.09, vy - L * 0.06); ctx.stroke(); }
        ctx.restore();
      }
    }),
    bud: makeTex(128, 128, function (ctx, w, h) { noiseFill(ctx, w, h, '#7fc96b', 40, 2500); ctx.fillStyle = 'rgba(255,255,255,.5)'; for (var i = 0; i < 160; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1); ctx.fillStyle = 'rgba(255,150,60,.55)'; for (var j = 0; j < 30; j++) { ctx.beginPath(); var x = Math.random() * w, y = Math.random() * h; ctx.moveTo(x, y); ctx.lineTo(x + randf(-6, 6), y + randf(-6, 6)); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,150,60,.6)'; ctx.stroke(); } }, [2, 2]),
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
  function textTex(lines, w, h, opts) {
    opts = opts || {}; var c = document.createElement('canvas'); c.width = w; c.height = h; var ctx = c.getContext('2d');
    ctx.fillStyle = opts.bg || 'rgba(10,14,12,.92)'; roundRect(ctx, 2, 2, w - 4, h - 4, 18); ctx.fill();
    ctx.strokeStyle = opts.line || 'rgba(111,220,140,.6)'; ctx.lineWidth = 3; roundRect(ctx, 2, 2, w - 4, h - 4, 18); ctx.stroke();
    ctx.fillStyle = opts.color || '#e8f1ea'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var fs = opts.size || 30; ctx.font = (opts.bold ? '600 ' : '') + fs + 'px "Segoe UI",system-ui,sans-serif';
    var lh = fs * 1.25; var y0 = h / 2 - (lines.length - 1) * lh / 2;
    lines.forEach(function (l, i) { if (i === 0 && opts.titleColor) ctx.fillStyle = opts.titleColor; else ctx.fillStyle = opts.color || '#e8f1ea'; ctx.fillText(l, w / 2, y0 + i * lh); });
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
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
    wood: new THREE.MeshStandardMaterial({ map: TEX.wood, roughness: 0.6 }),
    darkwood: new THREE.MeshStandardMaterial({ map: TEX.darkwood, roughness: 0.65 }),
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
    jar: new THREE.MeshPhysicalMaterial({ color: 0xd8f0ff, transparent: true, opacity: 0.35, roughness: 0.05 }),
    jarLid: new THREE.MeshStandardMaterial({ color: 0x2b2f33, roughness: 0.5, metalness: 0.4 }),
    bud: new THREE.MeshStandardMaterial({ map: TEX.bud, color: 0x7fc96b, roughness: 0.9 }),
    grass: new THREE.MeshStandardMaterial({ map: TEX.grass, roughness: 1 }),
    foliage: new THREE.MeshStandardMaterial({ map: TEX.foliage, roughness: 0.95 }),
    pine: new THREE.MeshStandardMaterial({ map: TEX.pine, roughness: 0.95 }),
    bark: new THREE.MeshStandardMaterial({ map: TEX.bark, roughness: 0.95 }),
    tuft: new THREE.MeshStandardMaterial({ map: TEX.tuft, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 1 }),
    flower: new THREE.MeshStandardMaterial({ map: TEX.flower, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 }),
    asphalt: new THREE.MeshStandardMaterial({ map: TEX.asphalt, roughness: 1 }),
    pavement: new THREE.MeshStandardMaterial({ map: TEX.pavement, bumpMap: TEX.pavementBump, bumpScale: 0.03, roughness: 0.95 }),
    tree: new THREE.MeshStandardMaterial({ color: 0x2f6b33, roughness: 1 }),
    trunk: new THREE.MeshStandardMaterial({ color: 0x5a3d22, roughness: 1 }),
    screen: new THREE.MeshStandardMaterial({ color: 0x0b1a12, emissive: 0x2dd67a, emissiveIntensity: 0.6, roughness: 0.3 }),
    counter: new THREE.MeshStandardMaterial({ map: TEX.darkwood, color: 0x8a9a8a, roughness: 0.6 }),
    counterTop: new THREE.MeshStandardMaterial({ color: 0xb8b2a6, roughness: 0.3, metalness: 0.05 }),
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
    var geos = [typeof LEAF_GEO === 'object' ? LEAF_GEO : null, typeof LEAF_GEO_SM === 'object' ? LEAF_GEO_SM : null, typeof BUD_GEO === 'object' ? BUD_GEO : null];
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

  function box(w, h, d, mat, x, y, z, opts) {
    var g = new THREE.BoxGeometry(w, h, d);
    if (mat && mat.userData && mat.userData.tile) { var tl = mat.userData.tile, uv = g.attributes.uv; for (var ui = 0; ui < uv.count; ui++) { var fc = Math.floor(ui / 4), fw = fc < 2 ? d : w, fh = fc >= 2 && fc < 4 ? d : h; uv.setXY(ui, uv.getX(ui) * fw / tl[0], uv.getY(ui) * fh / tl[1]); } }   /* a material tiled in metres: the same brick on every panel whatever its size */
    var m = new THREE.Mesh(g, mat); m.position.set(x, y, z);
    opts = opts || {}; m.castShadow = opts.cast !== false; m.receiveShadow = opts.receive !== false;
    if (opts.parent) opts.parent.add(m); else world.group.add(m);
    if (opts.solid) world.obstacles.push({ x1: x - w / 2, x2: x + w / 2, z1: z - d / 2, z2: z + d / 2, tag: opts.tag, floorLevel: opts.floorLevel || 0 });
    return m;
  }
  function cyl(rt, rb, h, mat, x, y, z, parent, seg) {
    var m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 18), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; (parent || world.group).add(m); return m;
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

