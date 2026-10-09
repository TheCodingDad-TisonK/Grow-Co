//@ rigged people and the security guard
  // ── Humans: rigged low-poly people with faces, outfits, walk cycles ──
  var SKINS = [0xf1c9a5, 0xe0ac7e, 0xc68642, 0x8d5524, 0xffdbb4, 0x5c3a1e];
  var HAIRS = [0x2b1b12, 0x5a3a1a, 0xc08a2a, 0x9a2f1a, 0x222222, 0xb9b9b9, 0x7a4a9a, 0x3a1a0a];
  var SHIRTS = [0x4a7fbf, 0xd64a9a, 0x3aa36a, 0xe0c25a, 0xc94a3a, 0x7a5aa8, 0xf2f2f2, 0x2a2a2a, 0xff8c42];
  var PANTS = [0x2a3a5a, 0x333333, 0x6a5a4a, 0x8a8a8a, 0x3a5a3a];
  var faceCache = {};
  function personFace(mood, glasses, spec, blink) {
    spec = spec || {}; var key = mood + (glasses ? 'g' : '') + (spec.lipstick ? 'l' : '') + (spec.freckles ? 'f' : '') + (spec.eyeColor || '') + (blink ? 'b' : ''); if (faceCache[key]) return faceCache[key];
    var c = document.createElement('canvas'); c.width = c.height = 256; var ctx = c.getContext('2d'); ctx.clearRect(0, 0, 256, 256);
    var eyeY = 112, iris = spec.eyeColor || '#3a5a8a', closed = blink || mood === 'sleepy', squint = mood === 'happy' ? 12 : mood === 'angry' ? 12.5 : 15;
    [84, 172].forEach(function (x, i) {
      var sd = i ? 1 : -1, px = x + (mood === 'shifty' ? 8 : 0);
      if (closed) { ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 21, eyeY + 1); ctx.quadraticCurveTo(x, eyeY + 9, x + 21, eyeY + 1); ctx.stroke(); return; }
      ctx.save(); ctx.beginPath(); ctx.ellipse(x, eyeY, 22, squint, 0, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = '#fbf8f2'; ctx.fillRect(x - 24, eyeY - 18, 48, 36);
      var ig = ctx.createRadialGradient(px, eyeY + 1, 2, px, eyeY + 1, 11); ig.addColorStop(0, iris); ig.addColorStop(0.75, iris); ig.addColorStop(1, 'rgba(10,15,25,.9)'); ctx.fillStyle = ig; ctx.beginPath(); ctx.arc(px, eyeY + 1, 10.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0b0b0d'; ctx.beginPath(); ctx.arc(px, eyeY + 1, 4.8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.arc(px + 4, eyeY - 4, 3.2, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(px - 4, eyeY + 5, 1.6, 0, Math.PI * 2); ctx.fill();
      var lid = ctx.createLinearGradient(0, eyeY - squint, 0, eyeY - squint + 12); lid.addColorStop(0, 'rgba(40,20,10,.5)'); lid.addColorStop(1, 'rgba(40,20,10,0)'); ctx.fillStyle = lid; ctx.fillRect(x - 24, eyeY - squint, 48, 12);   /* the lid's shadow on the eye */
      ctx.restore();
      ctx.strokeStyle = '#2f2019'; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.ellipse(x, eyeY, 22, squint, 0, Math.PI * 1.02, Math.PI * 1.98); ctx.stroke();
      ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(60,35,25,.45)'; ctx.beginPath(); ctx.ellipse(x, eyeY, 22, squint, 0, Math.PI * 0.12, Math.PI * 0.88); ctx.stroke();
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#2f2019'; ctx.beginPath(); ctx.moveTo(x + sd * 21, eyeY - 3); ctx.lineTo(x + sd * 27, eyeY - 8); ctx.stroke();   /* one lash at the outer corner */
    });
    // brows: thick at the nose, fine at the temple
    ctx.fillStyle = spec.browColor || '#2a1a10'; var tilt = mood === 'angry' ? 12 : mood === 'sad' ? -10 : mood === 'happy' ? -3 : 0;
    [[58, 110, 1], [198, 146, -1]].forEach(function (b) { var y0 = 84 - tilt * b[2] * (b[2] > 0 ? 1 : 1), y1 = 84 + tilt; ctx.beginPath(); ctx.moveTo(b[0], 84 - tilt + 2); ctx.quadraticCurveTo((b[0] + b[1]) / 2, 72, b[1], 84 + tilt - 4); ctx.lineTo(b[1], 84 + tilt + 5); ctx.quadraticCurveTo((b[0] + b[1]) / 2, 80, b[0], 84 - tilt + 4); ctx.closePath(); ctx.fill(); });
    // the nose is modelled: only the shadow under its tip is drawn
    ctx.fillStyle = 'rgba(70,35,20,.22)'; ctx.beginPath(); ctx.ellipse(128, 166, 17, 5, 0, 0, Math.PI * 2); ctx.fill();
    // mouth
    var lip = spec.lipstick ? '#c02040' : '#8a4536'; ctx.strokeStyle = lip; ctx.lineCap = 'round'; ctx.lineWidth = spec.lipstick ? 8 : 4.5; ctx.beginPath();
    if (mood === 'happy') { ctx.fillStyle = '#4a1a1a'; ctx.beginPath(); ctx.moveTo(96, 186); ctx.quadraticCurveTo(128, 216, 160, 186); ctx.quadraticCurveTo(128, 194, 96, 186); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(102, 188.5); ctx.quadraticCurveTo(128, 196, 154, 188.5); ctx.quadraticCurveTo(128, 203, 102, 188.5); ctx.fill(); ctx.beginPath(); ctx.moveTo(96, 186); ctx.quadraticCurveTo(128, 216, 160, 186); ctx.stroke(); }
    else if (mood === 'sad') { ctx.moveTo(100, 200); ctx.quadraticCurveTo(128, 182, 156, 200); ctx.stroke(); }
    else if (mood === 'angry') { ctx.moveTo(100, 196); ctx.quadraticCurveTo(128, 186, 156, 192); ctx.stroke(); }
    else if (mood === 'talk') { ctx.fillStyle = '#3a1a1a'; ctx.beginPath(); ctx.ellipse(128, 194, 16, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#c0605a'; ctx.beginPath(); ctx.ellipse(128, 200, 9, 5, 0, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.moveTo(104, 192); ctx.quadraticCurveTo(128, 199, 152, 192); ctx.stroke(); }
    if (mood !== 'talk' && mood !== 'happy') { ctx.strokeStyle = 'rgba(90,40,30,.25)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(114, 205); ctx.quadraticCurveTo(128, 210, 142, 205); ctx.stroke(); }   /* the shade under the lower lip */
    ctx.fillStyle = 'rgba(255,110,110,' + (mood === 'happy' ? 0.26 : 0.12) + ')'; [62, 194].forEach(function (x) { var bl = ctx.createRadialGradient(x, 152, 2, x, 152, 22); bl.addColorStop(0, ctx.fillStyle); bl.addColorStop(1, 'rgba(255,110,110,0)'); ctx.save(); ctx.fillStyle = bl; ctx.beginPath(); ctx.arc(x, 152, 22, 0, Math.PI * 2); ctx.fill(); ctx.restore(); });
    if (spec.freckles) { ctx.fillStyle = 'rgba(120,70,40,.5)'; for (var f = 0; f < 22; f++) { ctx.beginPath(); ctx.arc(60 + Math.random() * 136, 136 + Math.random() * 30, 1.6, 0, Math.PI * 2); ctx.fill(); } }
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; faceCache[key] = t; return t;
  }
  var HUMAN_GEO = {
    thigh: roundCylGeo(0.088, 0.068, 0.42, 18), shin: roundCylGeo(0.064, 0.046, 0.4, 18), knee: new THREE.SphereGeometry(0.068, 14, 10),
    shoe: bevelGeo(0.12, 0.085, 0.27, 0.036, 3), sole: bevelGeo(0.128, 0.03, 0.285, 0.012, 1), toe: new THREE.SphereGeometry(0.056, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    hips: bevelGeo(0.36, 0.18, 0.22, 0.08, 3), torso: taperGeo(bevelGeo(0.4, 0.5, 0.24, 0.1, 3), 0.5, 0.86, 0.9), chest: bevelGeo(0.44, 0.26, 0.26, 0.11, 3),
    upperArm: roundCylGeo(0.054, 0.044, 0.3, 14), foreArm: roundCylGeo(0.044, 0.034, 0.3, 14), elbow: new THREE.SphereGeometry(0.047, 12, 10), shoulder: new THREE.SphereGeometry(0.072, 14, 10),
    hand: bevelGeo(0.075, 0.1, 0.036, 0.016, 2), thumb: roundCylGeo(0.012, 0.012, 0.05, 8), cuff: roundCylGeo(0.043, 0.04, 0.035, 14), hem: roundCylGeo(0.058, 0.056, 0.04, 16), collar: bevelGeo(0.085, 0.036, 0.012, 0.004, 1),
    neck: roundCylGeo(0.05, 0.062, 0.1, 14), head: new THREE.SphereGeometry(0.17, 28, 20), ear: new THREE.SphereGeometry(0.03, 10, 8), nose: new THREE.SphereGeometry(0.021, 12, 10),
    hairCap: new THREE.SphereGeometry(0.17, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.5), hairLong: new THREE.SphereGeometry(0.17, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.62), afro: new THREE.SphereGeometry(0.17, 20, 14), scalp: new THREE.SphereGeometry(0.17, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
    skirt: roundCylGeo(0.2, 0.32, 0.4, 20), coat: bevelGeo(0.46, 0.66, 0.28, 0.08, 3)
  };
  // a beard follows the jaw and the chin and leaves the mouth alone; long hair falls behind the shoulders as one sheet
  HUMAN_GEO.beard = new THREE.SphereGeometry(0.17, 20, 8, -Math.PI * 0.1, Math.PI * 1.2, Math.PI * 0.7, Math.PI * 0.3); HUMAN_GEO.beard.scale(1.035, 1.15, 0.985);
  HUMAN_GEO.hairFall = new THREE.CylinderGeometry(0.178, 0.205, 0.4, 22, 3, true, Math.PI * 0.42, Math.PI * 1.16);
  HUMAN_GEO.ear.scale(0.5, 1.15, 0.85); HUMAN_GEO.nose.scale(0.82, 1.3, 1.05); HUMAN_GEO.toe.scale(1.05, 0.62, 1.5);
  HUMAN_GEO.head.scale(1, 1.12, 0.95);
  // hair shells are the head shape plus a few mm, so nothing pokes through
  HUMAN_GEO.hairCap.scale(1.07, 1.2, 1.02); HUMAN_GEO.hairLong.scale(1.08, 1.21, 1.04); HUMAN_GEO.afro.scale(1.5, 1.55, 1.45); HUMAN_GEO.scalp.scale(1.02, 1.145, 0.97);
  HUMAN_GEO.strand = bevelGeo(0.06, 0.34, 0.05);
  // curved patches that follow the skull: fringe over the forehead, sideburns, nape
  HUMAN_GEO.fringe = new THREE.SphereGeometry(0.17, 20, 8, Math.PI * 0.15, Math.PI * 0.7, Math.PI * 0.3, Math.PI * 0.2); HUMAN_GEO.fringe.scale(1.075, 1.205, 1.03);
  HUMAN_GEO.sideL = new THREE.SphereGeometry(0.17, 12, 8, Math.PI * 1.88, Math.PI * 0.24, Math.PI * 0.4, Math.PI * 0.22); HUMAN_GEO.sideL.scale(1.075, 1.205, 1.03);
  HUMAN_GEO.sideR = new THREE.SphereGeometry(0.17, 12, 8, Math.PI * 0.88, Math.PI * 0.24, Math.PI * 0.4, Math.PI * 0.22); HUMAN_GEO.sideR.scale(1.075, 1.205, 1.03);
  HUMAN_GEO.nape = new THREE.SphereGeometry(0.17, 16, 8, Math.PI * 1.2, Math.PI * 0.6, Math.PI * 0.4, Math.PI * 0.3); HUMAN_GEO.nape.scale(1.075, 1.205, 1.03);
  function makePerson(spec) {
    spec = spec || {};
    var skin = new THREE.MeshStandardMaterial({ color: spec.skin || pick(SKINS), roughness: 0.75 });
    var shirt = new THREE.MeshStandardMaterial({ map: TEX.fabric, color: spec.shirt || pick(SHIRTS), roughness: 0.9 });
    var pants = new THREE.MeshStandardMaterial({ map: TEX.fabric, color: spec.pants || pick(PANTS), roughness: 0.9 });
    var hairM = new THREE.MeshStandardMaterial({ color: spec.hair || pick(HAIRS), roughness: 0.62 }), hairSide = hairM.clone(); hairSide.side = THREE.DoubleSide;
    var shoeM = new THREE.MeshStandardMaterial({ color: spec.shoes || pick([0x1e1a18, 0x3a2a1a, 0xf2f2f2, 0xc94a3a, 0x2f6b9a]), roughness: 0.6 });
    var soleM = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.9 });
    var g = new THREE.Group(); var P = { mood: 'neutral' }; g.userData.parts = P; g.userData.spec = spec;
    floorBlob(0.36, 0.3, 0, 0.012, 0.02, g, 0.5);   /* a shadow at the feet: the lamps indoors cast none */
    function mesh(geo, mat, x, y, z, parent) { var m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; (parent || g).add(m); return m; }
    // legs: hip pivot → thigh → knee pivot → shin → shoe
    function leg(side) {
      var hip = new THREE.Group(); hip.position.set(side * 0.1, 0.86, 0); g.add(hip);
      mesh(HUMAN_GEO.thigh, pants, 0, -0.21, 0, hip);
      var knee = new THREE.Group(); knee.position.set(0, -0.42, 0); hip.add(knee); hip.userData.knee = knee;
      mesh(HUMAN_GEO.knee, pants, 0, 0, 0, knee); mesh(HUMAN_GEO.shin, pants, 0, -0.2, 0, knee);
      var shoe = mesh(HUMAN_GEO.shoe, shoeM, 0, -0.4, 0.05, knee); mesh(HUMAN_GEO.sole, soleM, 0, -0.445, 0.05, knee); mesh(HUMAN_GEO.hem, pants, 0, -0.35, 0, knee);
      mesh(bevelGeo(0.1, 0.02, 0.06), new THREE.MeshStandardMaterial({ color: 0xffffff }), 0, -0.36, 0.12, knee);   // laces patch
      if (spec.socks) mesh(roundCylGeo(0.052, 0.052, 0.08, 10), new THREE.MeshStandardMaterial({ color: 0xf2f2f2 }), 0, -0.34, 0, knee);
      return hip;
    }
    P.lLeg = leg(-1); P.rLeg = leg(1);
    // torso: hips block, shirt torso, chest, shoulders; collar, buttons, belt, pockets
    P.torso = new THREE.Group(); P.torso.position.y = 0.86; g.add(P.torso);
    mesh(HUMAN_GEO.hips, pants, 0, 0.02, 0, P.torso);
    mesh(bevelGeo(0.38, 0.05, 0.24), new THREE.MeshStandardMaterial({ color: spec.belt || 0x3a2a1a, roughness: 0.5 }), 0, 0.1, 0, P.torso); mesh(bevelGeo(0.05, 0.04, 0.02), MAT.chrome, 0, 0.1, 0.125, P.torso);
    mesh(HUMAN_GEO.torso, shirt, 0, 0.36, 0, P.torso); P.chest = mesh(HUMAN_GEO.chest, shirt, 0, 0.52, 0, P.torso);
    if (!spec.coat) [-1, 1].forEach(function (sd) { var cl = mesh(HUMAN_GEO.collar, shirt, sd * 0.05, 0.648, 0.118, P.torso); cl.rotation.set(-0.35, sd * -0.25, sd * -0.62); });
    if (!spec.coat) { mesh(bevelGeo(0.12, 0.05, 0.03), shirt, 0, 0.62, 0.13, P.torso); for (var b = 0; b < 4; b++) mesh(roundCylGeo(0.008, 0.008, 0.006, 8), new THREE.MeshStandardMaterial({ color: 0xf2f2f2 }), 0, 0.2 + b * 0.11, 0.125, P.torso).rotation.x = Math.PI / 2; mesh(bevelGeo(0.1, 0.1, 0.005), new THREE.MeshStandardMaterial({ map: TEX.fabric, color: shirt.color.clone().multiplyScalar(0.85), roughness: 0.9 }), -0.11, 0.48, 0.125, P.torso); }
    if (spec.coat) { var coatM = new THREE.MeshStandardMaterial({ map: TEX.fabric, color: spec.coat, roughness: 0.9 }); var coat = mesh(HUMAN_GEO.coat, coatM, 0, 0.33, -0.02, P.torso); [-1, 1].forEach(function (s) { var lapel = mesh(bevelGeo(0.09, 0.28, 0.015), coatM, s * 0.09, 0.5, 0.135, P.torso); lapel.rotation.z = s * 0.35; }); mesh(bevelGeo(0.06, 0.34, 0.02), shirt, 0, 0.42, 0.13, P.torso); }
    if (spec.skirt) { mesh(HUMAN_GEO.skirt, new THREE.MeshStandardMaterial({ map: TEX.fabric, color: spec.skirt, roughness: 0.9 }), 0, -0.14, 0, P.torso); }
    if (spec.logo) { var lg = mesh(new THREE.PlaneGeometry(0.16, 0.16), new THREE.MeshBasicMaterial({ map: signTex([spec.logo], 128, 128, { size: 70, bg: 'rgba(0,0,0,0)', line: 'rgba(0,0,0,0)', color: '#fff' }), transparent: true }), 0, 0.42, 0.126, P.torso); lg.castShadow = false; }
    // arms: shoulder pivot → upper arm → elbow pivot → forearm → hand with thumb; sleeve depends on longSleeve
    function arm(side) {
      var sh = new THREE.Group(); sh.position.set(side * 0.27, 0.6, 0); P.torso.add(sh);
      mesh(HUMAN_GEO.shoulder, shirt, 0, 0, 0, sh);
      var sleeveM = spec.longSleeve === false ? skin : shirt; mesh(HUMAN_GEO.upperArm, sleeveM, 0, -0.16, 0, sh);
      if (spec.longSleeve === false) mesh(roundCylGeo(0.056, 0.05, 0.1, 10), shirt, 0, -0.06, 0, sh);
      var el = new THREE.Group(); el.position.set(0, -0.31, 0); sh.add(el); sh.userData.elbow = el;
      mesh(HUMAN_GEO.elbow, sleeveM, 0, 0, 0, el); mesh(HUMAN_GEO.foreArm, spec.longSleeve === false || spec.rolled ? skin : shirt, 0, -0.15, 0, el);
      if (spec.watch && side > 0) mesh(roundCylGeo(0.045, 0.045, 0.02, 10), new THREE.MeshStandardMaterial({ color: 0x1c1c22 }), 0, -0.27, 0, el);
      if (!(spec.longSleeve === false || spec.rolled)) mesh(HUMAN_GEO.cuff, shirt, 0, -0.285, 0, el);
      var hand = mesh(HUMAN_GEO.hand, skin, 0, -0.35, 0, el); var th = mesh(HUMAN_GEO.thumb, skin, side * 0.04, -0.33, 0.01, el); th.rotation.z = side * 0.6;
      sh.userData.hand = hand; return sh;
    }
    P.lArm = arm(-1); P.rArm = arm(1);
    // head: neck, skull, ears, face decal, hair style, facial hair, glasses frames
    P.head = new THREE.Group(); P.head.position.set(0, 0.66, 0); P.torso.add(P.head);
    mesh(HUMAN_GEO.neck, skin, 0, 0.04, 0, P.head); var headM = mesh(HUMAN_GEO.head, skin, 0, 0.24, 0, P.head); mesh(HUMAN_GEO.nose, skin, 0, 0.222, 0.164, P.head);
    [-1, 1].forEach(function (s) { mesh(HUMAN_GEO.ear, skin, s * 0.165, 0.24, -0.01, P.head); if (spec.earrings) mesh(new THREE.SphereGeometry(0.012, 6, 6), MAT.chrome, s * 0.17, 0.2, -0.01, P.head); });
    var style = spec.hairStyle || (spec.ponytail ? 'ponytail' : pick(['short', 'short', 'long', 'bun', 'afro', 'ponytail', 'mohawk']));
    if (!spec.bald) {
      var hy = 0.24;
      function strands(n, y0, len, r, back) { for (var i = 0; i < n; i++) { var a = back ? Math.PI * 0.55 + (i / (n - 1)) * Math.PI * 0.9 : (i % 2 ? 1 : -1) * (0.9 + Math.floor(i / 2) * 0.35); var st = mesh(bevelGeo(0.07, len, 0.06), hairM, Math.sin(a) * r, y0 - len / 2, Math.cos(a) * r, P.head); st.rotation.y = a; st.rotation.x = 0.05; } }
      if (style === 'afro') { mesh(HUMAN_GEO.afro, hairM, 0, hy + 0.05, -0.02, P.head); for (var q = 0; q < 10; q++) { var pf = mesh(new THREE.SphereGeometry(0.07, 8, 6), hairM, (Math.random() - 0.5) * 0.4, hy + 0.1 + (Math.random() - 0.5) * 0.3, -0.02 + (Math.random() - 0.5) * 0.36, P.head); } }
      else if (style === 'long') { mesh(HUMAN_GEO.hairLong, hairM, 0, hy, 0, P.head); mesh(HUMAN_GEO.fringe, hairM, 0, hy, 0, P.head); mesh(HUMAN_GEO.hairFall, hairSide, 0, hy - 0.16, -0.012, P.head); mesh(HUMAN_GEO.sideL, hairM, 0, hy, 0, P.head); mesh(HUMAN_GEO.sideR, hairM, 0, hy, 0, P.head); }
      else if (style === 'bun') { mesh(HUMAN_GEO.hairCap, hairM, 0, hy, 0, P.head); mesh(new THREE.SphereGeometry(0.075, 12, 10), hairM, 0, hy + 0.14, -0.14, P.head); mesh(new THREE.TorusGeometry(0.075, 0.008, 6, 14), new THREE.MeshStandardMaterial({ color: 0xc94a3a }), 0, hy + 0.14, -0.14, P.head).rotation.x = Math.PI / 2; mesh(HUMAN_GEO.fringe, hairM, 0, hy, 0, P.head); mesh(HUMAN_GEO.sideL, hairM, 0, hy, 0, P.head); mesh(HUMAN_GEO.sideR, hairM, 0, hy, 0, P.head); }
      else if (style === 'mohawk') { mesh(HUMAN_GEO.scalp, new THREE.MeshStandardMaterial({ color: skin.color.clone().multiplyScalar(0.82), roughness: 0.8 }), 0, hy, 0, P.head); for (var mk = 0; mk < 6; mk++) { var sp = mesh(bevelGeo(0.05, 0.13 + (mk === 2 || mk === 3 ? 0.04 : 0), 0.05), hairM, 0, hy + 0.24, 0.14 - mk * 0.056, P.head); sp.rotation.x = -0.15 + mk * 0.06; } }
      else if (style === 'ponytail') { mesh(HUMAN_GEO.hairCap, hairM, 0, hy, 0, P.head); var tail = mesh(roundCylGeo(0.05, 0.028, 0.36, 10), hairM, 0, hy - 0.08, -0.2, P.head); tail.rotation.x = 0.35; mesh(new THREE.SphereGeometry(0.055, 10, 8), hairM, 0, hy + 0.08, -0.16, P.head); mesh(new THREE.TorusGeometry(0.045, 0.01, 6, 12), new THREE.MeshStandardMaterial({ color: 0xc94a3a }), 0, hy + 0.08, -0.17, P.head).rotation.x = 0.4; mesh(HUMAN_GEO.fringe, hairM, 0, hy, 0, P.head); mesh(HUMAN_GEO.sideL, hairM, 0, hy, 0, P.head); mesh(HUMAN_GEO.sideR, hairM, 0, hy, 0, P.head); }
      else { mesh(HUMAN_GEO.hairCap, hairM, 0, hy, 0, P.head); mesh(HUMAN_GEO.fringe, hairM, 0, hy, 0, P.head); mesh(HUMAN_GEO.sideL, hairM, 0, hy, 0, P.head); mesh(HUMAN_GEO.sideR, hairM, 0, hy, 0, P.head); mesh(HUMAN_GEO.nape, hairM, 0, hy, 0, P.head); }   // short: cap, fringe, sideburns, nape
    }
    if (spec.beard) { mesh(HUMAN_GEO.beard, hairSide, 0, 0.24, 0, P.head); }
    if (spec.moustache) { mesh(bevelGeo(0.12, 0.025, 0.03), hairM, 0, 0.175, 0.168, P.head); }
    P.face = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.28), new THREE.MeshBasicMaterial({ map: personFace(spec.mood || 'neutral', false, spec), transparent: true, depthWrite: false })); P.face.position.set(0, 0.245, 0.17); P.head.add(P.face);
    if (spec.glasses) { var fr = new THREE.MeshStandardMaterial({ color: spec.glassColor || 0x222222, roughness: 0.4, metalness: 0.5 }); [-0.06, 0.06].forEach(function (x) { var ring = mesh(new THREE.TorusGeometry(0.038, 0.006, 6, 16), fr, x, 0.255, 0.178, P.head); var lens = mesh(new THREE.CircleGeometry(0.036, 16), new THREE.MeshPhysicalMaterial({ color: 0xbfe0ff, transparent: true, opacity: 0.25, roughness: 0.05 }), x, 0.255, 0.176, P.head); lens.castShadow = false; }); mesh(bevelGeo(0.03, 0.006, 0.006), fr, 0, 0.26, 0.178, P.head); [-1, 1].forEach(function (s) { var tmp = mesh(bevelGeo(0.006, 0.006, 0.16), fr, s * 0.1, 0.255, 0.085, P.head); }); }
    // hats / accessories
    var capM = new THREE.MeshStandardMaterial({ map: TEX.fabric, color: spec.capColor || 0xc94a3a, roughness: 0.9 });
    if (spec.hat === 'straw') { var sm = new THREE.MeshStandardMaterial({ color: 0xd9b46a, roughness: 1 }); mesh(roundCylGeo(0.31, 0.31, 0.02, 18), sm, 0, 0.36, 0, P.head); mesh(roundCylGeo(0.15, 0.18, 0.12, 16), sm, 0, 0.42, 0, P.head); mesh(new THREE.TorusGeometry(0.165, 0.012, 6, 16), new THREE.MeshStandardMaterial({ color: 0x3a2a1a }), 0, 0.38, 0, P.head).rotation.x = Math.PI / 2; }
    if (spec.hat === 'cap') { mesh(new THREE.SphereGeometry(0.182, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), capM, 0, 0.26, 0, P.head); var peak = mesh(bevelGeo(0.2, 0.015, 0.14), capM, 0, 0.28, 0.2, P.head); peak.rotation.x = 0.15; mesh(new THREE.SphereGeometry(0.02, 8, 6), capM, 0, 0.44, 0, P.head); }
    if (spec.hat === 'nurse') { mesh(bevelGeo(0.22, 0.09, 0.16), new THREE.MeshStandardMaterial({ color: 0xffffff }), 0, 0.4, -0.02, P.head); mesh(bevelGeo(0.1, 0.03, 0.01), new THREE.MeshStandardMaterial({ color: 0xe03030 }), 0, 0.41, 0.065, P.head); mesh(bevelGeo(0.03, 0.1, 0.01), new THREE.MeshStandardMaterial({ color: 0xe03030 }), 0, 0.41, 0.065, P.head); }
    if (spec.hat === 'flowers') { for (var f = 0; f < 8; f++) { var a = f / 8 * Math.PI * 2; mesh(new THREE.SphereGeometry(0.035, 8, 8), new THREE.MeshStandardMaterial({ color: [0xff6b9d, 0xffd166, 0x9ad0ff, 0xf2f2f2][f % 4] }), Math.cos(a) * 0.17, 0.36, Math.sin(a) * 0.17, P.head); mesh(new THREE.SphereGeometry(0.012, 6, 6), new THREE.MeshStandardMaterial({ color: 0xffd166 }), Math.cos(a) * 0.17, 0.36, Math.sin(a) * 0.17 + 0.03, P.head); } mesh(new THREE.TorusGeometry(0.17, 0.01, 6, 20), new THREE.MeshStandardMaterial({ color: 0x3a8f40 }), 0, 0.36, 0, P.head).rotation.x = Math.PI / 2; }
    if (spec.hat === 'beanie') { mesh(new THREE.SphereGeometry(0.19, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), capM, 0, 0.25, 0, P.head); mesh(new THREE.TorusGeometry(0.175, 0.03, 8, 20), capM, 0, 0.26, 0, P.head).rotation.x = Math.PI / 2; mesh(new THREE.SphereGeometry(0.04, 8, 8), capM, 0, 0.45, 0, P.head); }
    if (spec.bowtie) { mesh(bevelGeo(0.05, 0.05, 0.03), new THREE.MeshStandardMaterial({ color: 0xc94a3a }), -0.04, 0.63, 0.13, P.torso).rotation.z = 0.3; mesh(bevelGeo(0.05, 0.05, 0.03), new THREE.MeshStandardMaterial({ color: 0xc94a3a }), 0.04, 0.63, 0.13, P.torso).rotation.z = -0.3; mesh(new THREE.SphereGeometry(0.014, 6, 6), new THREE.MeshStandardMaterial({ color: 0x8a2a2a }), 0, 0.63, 0.14, P.torso); }
    if (spec.necklace) { mesh(new THREE.TorusGeometry(0.08, 0.006, 6, 16, Math.PI), MAT.chrome, 0, 0.62, 0.11, P.torso).rotation.z = Math.PI; }
    if (spec.backpack) { var bpM = new THREE.MeshStandardMaterial({ map: TEX.fabric, color: spec.backpackColor || 0x2f6b9a, roughness: 0.9 }); mesh(bevelGeo(0.3, 0.4, 0.14), bpM, 0, 0.4, -0.19, P.torso); mesh(bevelGeo(0.2, 0.14, 0.05), bpM, 0, 0.3, -0.28, P.torso); [-0.12, 0.12].forEach(function (x) { mesh(bevelGeo(0.05, 0.4, 0.02), bpM, x, 0.42, 0.13, P.torso); }); }
    var rh = P.rArm.userData.elbow, lh = P.lArm.userData.elbow;
    if (spec.prop === 'cane') { var cane = mesh(roundCylGeo(0.012, 0.012, 0.85, 8), new THREE.MeshStandardMaterial({ color: 0x5a3d22 }), 0, -0.6, 0.05, rh); cane.rotation.x = 0.1; mesh(new THREE.TorusGeometry(0.04, 0.012, 6, 12, Math.PI), new THREE.MeshStandardMaterial({ color: 0x5a3d22 }), 0, -0.2, 0.05, rh).rotation.z = Math.PI; mesh(roundCylGeo(0.02, 0.02, 0.03, 8), MAT.black, 0, -1.02, 0.09, rh); }
    if (spec.prop === 'board') { var bd2 = mesh(bevelGeo(0.2, 0.025, 0.75), new THREE.MeshStandardMaterial({ color: 0x4a2a6a }), 0.06, -0.3, 0, lh); bd2.rotation.z = 0.15; mesh(new THREE.PlaneGeometry(0.16, 0.5), new THREE.MeshBasicMaterial({ map: signTex(['SK8'], 100, 300, { size: 60, bg: 'rgba(0,0,0,0)', line: 'rgba(0,0,0,0)', color: '#ffd166' }), transparent: true }), 0.075, -0.3, 0, lh).rotation.set(0, Math.PI / 2, -0.15 + Math.PI / 2); [0.25, -0.25].forEach(function (z) { [0.05, -0.05].forEach(function (dx) { mesh(roundCylGeo(0.03, 0.03, 0.03, 10), new THREE.MeshStandardMaterial({ color: 0xffd166 }), 0.09 + dx * 0.3, -0.3 - 0.02, z, lh).rotation.z = Math.PI / 2; }); mesh(bevelGeo(0.04, 0.03, 0.12), MAT.chrome, 0.1, -0.31, z, lh); }); }
    if (spec.prop === 'book') { mesh(bevelGeo(0.16, 0.22, 0.05), new THREE.MeshStandardMaterial({ color: 0x8a2a2a }), 0.02, -0.34, 0.08, lh); mesh(bevelGeo(0.15, 0.2, 0.04), new THREE.MeshStandardMaterial({ color: 0xf0e8d8 }), 0.03, -0.34, 0.085, lh); }
    if (spec.prop === 'bag') { var bagM = new THREE.MeshStandardMaterial({ map: TEX.fabric, color: 0x6a4a2a, roughness: 0.9 }); mesh(bevelGeo(0.2, 0.24, 0.1), bagM, 0, -0.5, 0.02, rh); mesh(new THREE.TorusGeometry(0.06, 0.008, 6, 12, Math.PI), bagM, 0, -0.38, 0.02, rh); mesh(bevelGeo(0.18, 0.06, 0.11), new THREE.MeshStandardMaterial({ color: 0x4a3a2a }), 0, -0.41, 0.02, rh); }
    if (spec.prop === 'phone') { mesh(bevelGeo(0.07, 0.13, 0.01), new THREE.MeshStandardMaterial({ color: 0x111111 }), 0, -0.36, 0.05, rh); mesh(new THREE.PlaneGeometry(0.06, 0.11), new THREE.MeshStandardMaterial({ color: 0x223355, emissive: 0x3355aa, emissiveIntensity: 0.9 }), 0, -0.36, 0.056, rh).castShadow = false; }
    if (spec.prop === 'coffee') { mesh(roundCylGeo(0.035, 0.03, 0.12, 12), new THREE.MeshStandardMaterial({ color: 0xf2f2f2 }), 0, -0.36, 0.05, rh); mesh(roundCylGeo(0.037, 0.037, 0.015, 12), new THREE.MeshStandardMaterial({ color: 0x3a2a1a }), 0, -0.3, 0.05, rh); mesh(roundCylGeo(0.037, 0.037, 0.03, 12), new THREE.MeshStandardMaterial({ color: 0xc8a97a }), 0, -0.37, 0.05, rh); }
    if (spec.hunch) P.torso.rotation.x = 0.18;
    g.userData.skinMat = skin; g.userData.glasses = !!spec.glasses;
    g.userData.setMood = function (mood) { if (P.mood === mood) return; P.mood = mood; P.face.material.map = personFace(mood, false, spec); P.face.material.needsUpdate = true; P.blinking = false; };
    g.userData.blinkT = 1 + Math.random() * 4;
    g.userData.phase = Math.random() * 6.28; g.userData.phase0 = g.userData.phase;
    return g;
  }
  // animate: state 'walk' | 'idle' | 'wait' ; speed in m/s ; lookAt optional Vector3 (world). Knees and elbows follow the stride.
  var _tmpV = new THREE.Vector3();
  function humanBlink(g, P, dt) {   // the eyes close for a tenth of a second every few seconds; the mouth keeps the mood it had
    g.userData.blinkT -= dt;
    if (!P.blinking && g.userData.blinkT <= 0 && P.mood !== 'sleepy') { P.blinking = true; g.userData.blinkT = 0.11; P.face.material.map = personFace(P.mood, false, g.userData.spec, true); }
    else if (P.blinking && g.userData.blinkT <= 0) { P.blinking = false; g.userData.blinkT = 2.2 + Math.random() * 4.5; P.face.material.map = personFace(P.mood, false, g.userData.spec); }
  }
  function animatePerson(g, dt, state, speed, lookAt) {
    if (state === 'walk' && g.parent && g.parent.userData.ropeHold && now() - g.parent.userData.ropeHold < 200) { state = 'idle'; speed = 0; }   /* held at the rope: stand, don't walk on the spot */
    var P = g.userData.parts; g.userData.phase += dt * (state === 'walk' ? 6.5 * clamp(speed / 1.4, 0.5, 1.6) : 1.2);
    var t = g.userData.phase; var lk = P.lLeg.userData.knee, rk = P.rLeg.userData.knee, le = P.lArm.userData.elbow, re = P.rArm.userData.elbow;
    humanBlink(g, P, dt); if (P.chest) { var br = 1 + Math.sin(now() / 620 + g.userData.phase0) * 0.018; P.chest.scale.set(1, 1, br); }
    if (state === 'walk') {
      var s = Math.sin(t), a = 0.55;
      P.lLeg.rotation.x = s * a; P.rLeg.rotation.x = -s * a; P.lArm.rotation.x = -s * a * 0.8; P.rArm.rotation.x = s * a * 0.8;
      lk.rotation.x = -Math.max(0, -Math.sin(t - 0.6)) * 1.1; rk.rotation.x = -Math.max(0, Math.sin(t - 0.6)) * 1.1;
      le.rotation.x = -0.35 - Math.max(0, -s) * 0.5; re.rotation.x = -0.35 - Math.max(0, s) * 0.5;
      P.torso.position.y = 0.86 + Math.abs(Math.cos(t)) * 0.03; P.torso.position.x = 0; P.torso.rotation.z = Math.sin(t) * 0.03; P.torso.rotation.y = Math.sin(t) * 0.06; P.head.rotation.z = -Math.sin(t) * 0.025;   /* the head stays level while the shoulders roll */
      P.lArm.rotation.z = 0.08; P.rArm.rotation.z = -0.08;
      if (g.userData.spec.prop === 'board') { P.lArm.rotation.x = -0.3; le.rotation.x = -0.3; }
      if (g.userData.spec.prop === 'cane') { P.rArm.rotation.x = s * 0.3 - 0.4; re.rotation.x = -0.2; }
      if (g.userData.spec.prop === 'coffee') { P.rArm.rotation.x = -0.5; re.rotation.x = -1.0; }
    } else {
      P.lLeg.rotation.x = lerp(P.lLeg.rotation.x, 0, 0.1); P.rLeg.rotation.x = lerp(P.rLeg.rotation.x, 0, 0.1); lk.rotation.x = lerp(lk.rotation.x, 0, 0.1); rk.rotation.x = lerp(rk.rotation.x, 0, 0.1);
      P.lArm.rotation.x = lerp(P.lArm.rotation.x, Math.sin(t) * 0.05, 0.1); P.rArm.rotation.x = lerp(P.rArm.rotation.x, -Math.sin(t) * 0.05, 0.1);
      le.rotation.x = lerp(le.rotation.x, -0.25, 0.1); re.rotation.x = lerp(re.rotation.x, -0.25, 0.1);
      P.lArm.rotation.z = Math.sin(t * 0.7) * 0.03 + 0.08; P.rArm.rotation.z = -Math.sin(t * 0.7) * 0.03 - 0.08;
      P.torso.position.y = 0.86 + Math.sin(t) * 0.006; P.torso.rotation.z = Math.sin(t * 0.31) * 0.014; P.torso.position.x = Math.sin(t * 0.31) * 0.007;   /* the weight goes from one foot to the other */
      if (state === 'wait') { P.torso.rotation.y = Math.sin(t * 0.35) * 0.12; var tap = Math.max(0, Math.sin(t * 2.4)); P.rLeg.position.y = 0.86 + tap * 0.02 * (g.userData.impatient ? 1 : 0); if (g.userData.impatient) { P.lArm.rotation.x = -0.9; P.rArm.rotation.x = -0.9; le.rotation.x = -1.6; re.rotation.x = -1.6; P.lArm.rotation.z = 0.5; P.rArm.rotation.z = -0.5; } }
      if (g.userData.spec.prop === 'phone' && state !== 'walk') { P.rArm.rotation.x = -0.9; re.rotation.x = -1.4; P.head.rotation.x = 0.35; }
      if (g.userData.spec.prop === 'coffee' && state !== 'walk') { P.rArm.rotation.x = -0.5; re.rotation.x = -1.0; }
    }
    if (g.userData.spec.hunch) P.torso.rotation.x = 0.18;
    // head tracks a target (the player) within a comfortable yaw range
    if (lookAt) {
      _tmpV.copy(lookAt).sub(g.position); var want = Math.atan2(_tmpV.x, _tmpV.z) - g.rotation.y;
      while (want > Math.PI) want -= Math.PI * 2; while (want < -Math.PI) want += Math.PI * 2;
      var dist = Math.hypot(_tmpV.x, _tmpV.z); if (Math.abs(want) < 1.4 && dist < 9) { P.head.rotation.y = lerp(P.head.rotation.y, want, 0.08); P.head.rotation.x = lerp(P.head.rotation.x, clamp((1.65 - 1.62) / Math.max(dist, 1), -0.3, 0.3) + (g.userData.spec.prop === 'phone' && state !== 'walk' ? 0.35 : 0), 0.08); }
      else P.head.rotation.y = lerp(P.head.rotation.y, 0, 0.05);
    } else P.head.rotation.y = lerp(P.head.rotation.y, Math.sin(t * 0.4) * 0.15, 0.05);
  }
  var CAST = {
    'Chill Chad':     { skin: 0xe0ac7e, hair: 0xd9b46a, shirt: 0x3aa36a, pants: 0x6a5a4a, hat: 'straw', beard: true, mood: 'happy', longSleeve: false, necklace: true, logo: '🌿', shoes: 0xc8a97a, hairStyle: 'long' },
    'Nurse Nadia':    { skin: 0xf1c9a5, hair: 0x2b1b12, shirt: 0x7ab8d6, pants: 0x7ab8d6, coat: 0xf5f5f5, hat: 'nurse', ponytail: true, lipstick: true, watch: true, shoes: 0xf2f2f2, eyeColor: '#2a6a3a' },
    'Old Man Ferns':  { skin: 0xffdbb4, hair: 0xcfcfcf, shirt: 0x8a6b4a, pants: 0x8a8a8a, glasses: true, prop: 'cane', hunch: true, beard: true, moustache: true, mood: 'sleepy', hairStyle: 'short', coat: 0x5a4a3a, shoes: 0x3a2a1a },
    'Festival Fi':    { skin: 0xc68642, hair: 0x9a2f1a, shirt: 0xd64a9a, pants: 0xe0c25a, skirt: 0xe0c25a, hat: 'flowers', longSleeve: false, mood: 'happy', hairStyle: 'long', earrings: true, necklace: true, freckles: true, lipstick: true, eyeColor: '#6a4a2a' },
    'The Professor':  { skin: 0x8d5524, hair: 0x222222, shirt: 0xf2f2f2, pants: 0x333333, coat: 0x6b5a3a, glasses: true, bowtie: true, prop: 'book', hairStyle: 'short', watch: true, glassColor: 0x8a6a3a },
    'Skater Sam':     { skin: 0xf1c9a5, hair: 0x5a3a1a, shirt: 0xc94a3a, pants: 0x2a2a2a, hat: 'cap', capColor: 0x222222, prop: 'board', longSleeve: false, logo: 'SK8', socks: true, shoes: 0xf2f2f2, hairStyle: 'mohawk' }
  };

  // ── Security guard at the door ─────────────────────────────────────
  var guard = { h: null, bubble: null, sayT: 0, state: 'idle', armT: 0 };
  function buildGuard() {
    guard.h = makePerson({ skin: 0x8d5524, hair: 0x222222, shirt: 0x1c1c22, pants: 0x1c1c22, hat: 'cap', capColor: 0x1c1c22, beard: true, mood: 'neutral', longSleeve: true, hairStyle: 'short', watch: true, shoes: 0x111111, belt: 0x111111 });
    (function () { var T = guard.h.userData.parts.torso; var radio = new THREE.Mesh(bevelGeo(0.05, 0.1, 0.03), MAT.black); radio.position.set(-0.16, 0.5, 0.14); T.add(radio); var ant = new THREE.Mesh(roundCylGeo(0.004, 0.004, 0.08, 6), MAT.black); ant.position.set(-0.17, 0.59, 0.14); T.add(ant); var ep = new THREE.Mesh(roundCylGeo(0.008, 0.008, 0.2, 5), MAT.black); ep.position.set(0.12, 0.66, 0.02); ep.rotation.z = 0.5; T.add(ep); })();
    guard.h.position.set(1.7, 0, 7.3); guard.h.rotation.y = -0.9; world.group.add(guard.h);
    var badge = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.06), new THREE.MeshBasicMaterial({ map: signTex(['SECURITY'], 160, 60, { size: 30, bg: '#ffc857', color: '#111', line: 'rgba(0,0,0,0)' }) })); badge.position.set(0, 0.5, 0.15); guard.h.userData.parts.torso.add(badge);
    var vest = new THREE.Mesh(bevelGeo(0.46, 0.52, 0.28), new THREE.MeshStandardMaterial({ map: TEX.fabric, color: 0xffd23f, roughness: 0.9 })); vest.position.set(0, 0.36, 0); [0.26, 0.42].forEach(function (y) { var strip = new THREE.Mesh(bevelGeo(0.47, 0.04, 0.29), new THREE.MeshStandardMaterial({ color: 0xc8c8c8, emissive: 0x888888, emissiveIntensity: 0.3 })); strip.position.set(0, y, 0); guard.h.userData.parts.torso.add(strip); }); guard.h.userData.parts.torso.add(vest); badge.position.z = 0.148;
    guard.bubble = sprite(signTex(['…'], 512, 160, { size: 44 }), 1.4, 0.44, 0, 2.25, 0, guard.h); guard.bubble.visible = false;
    guard.h.traverse(function (o) { if (o.isMesh && o !== badge) interactable(o, { kind: 'guard' }); });
    world.obstacles.push({ x1: 1.4, x2: 2.0, z1: 7.0, z2: 7.6, tag: 'guard' });
  }
  guard.say = function (text, color, ms) { if (!guard.bubble) return; var ob = guard.bubble.material.map; guard.bubble.material.map = signTex([text], 512, 160, { size: 44, titleColor: color || '#e8f1ea' }); guard.bubble.material.needsUpdate = true; if (ob) ob.dispose(); guard.bubble.visible = true; clearTimeout(guard.sayT); guard.sayT = setTimeout(function () { if (guard.bubble) guard.bubble.visible = false; }, ms || 2200); };   /* sending security home clears the bubble before this fires */
  function updateGuard(dt) {
    if (guardOff() || !guard.h) return;
    if (!guard.h) return;
    var P = guard.h.userData.parts;
    if (robber.state === 'demand' || robber.state === 'in') { animatePerson(guard.h, dt, 'idle', 0, robber.g.position); P.rArm.rotation.x = -1.4; P.rArm.rotation.z = -0.2; guard.h.userData.setMood('angry'); return; }
    if (updateGuardRope(dt)) return;
    if (updateGuardTasks(dt)) return;
    if (guard.state === 'check') { guard.armT += dt; P.rArm.rotation.x = lerp(P.rArm.rotation.x, -1.3, 0.15); P.rArm.rotation.z = lerp(P.rArm.rotation.z, -0.3, 0.15); animatePerson(guard.h, dt, 'idle', 0, guard.checkG ? guard.checkG.position : npc.g.visible ? npc.g.position : player.pos); P.rArm.rotation.x = -1.3; P.rArm.rotation.z = -0.3; if (guard.armT > 2.2) { guard.state = 'idle'; guard.h.userData.setMood('happy'); guard.say('You\'re good. Go on through.', '#6fdc8c'); setTimeout(function () { if (guard.h) guard.h.userData.setMood('neutral'); }, 2000); } return; }
    // idle: watch whoever is closer, the customer or the player
    var look = player.pos; if (npc.g.visible) { var dn = Math.hypot(npc.g.position.x - guard.h.position.x, npc.g.position.z - guard.h.position.z); var dp = Math.hypot(player.pos.x - guard.h.position.x, player.pos.z - guard.h.position.z); if (dn < dp) look = npc.g.position; }
    animatePerson(guard.h, dt, 'idle', 0, look);
    // greet the boss when they walk into the lobby
    var near = Math.hypot(player.pos.x - guard.h.position.x, player.pos.z - guard.h.position.z, player.pos.y - 1.65);
    if (near < 2.2 && !guard.greeted) { guard.greeted = true; var gh = gameHour(); guard.say(pick([gh >= 5 && gh < 12 ? 'Morning, boss.' : gh >= 12 && gh < 18 ? 'Afternoon, boss.' : 'Evening, boss.', 'All quiet out here.', guardIdLine()]), '#e8f1ea', 2600); }
    if (near > 4) guard.greeted = false;
  }
  guard.startCheck = function (g) { guard.checkG = g || null; guard.state = 'check'; guard.armT = 0; guard.h.userData.setMood('neutral'); if (S.idDay !== S.day) { S.idDay = S.day; S.idsToday = 0; } S.idsToday = (S.idsToday || 0) + 1; guard.say('ID, please.', '#ffc857', 2000); };
  function guardIdLine() { var n = S.idDay === S.day ? S.idsToday || 0 : 0; return n ? 'Checked ' + n + (n === 1 ? ' ID' : ' IDs') + ' today.' : 'No IDs to check yet today.'; }   /* a real count, reset each day */

