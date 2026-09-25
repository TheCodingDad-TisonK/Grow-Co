//@ robberies and weapons
  // ── Robberies: four kinds of trouble, each running in stages: casing the lobby, masking up, the demand, an escalation, a second target in the back, the getaway ──
  // a robber takes everything in the till and the tip jar, so a heavy till says so: the vault readout turns amber and, once a day, a word of warning
  var TILL_HEAVY = 250;
  function tillHeavy() { return (S.till || 0) + (S.tips || 0) >= TILL_HEAVY; }
  function tillWatch() {
    if (!tillHeavy() || S.tillWarnDay === S.day) return;
    S.tillWarnDay = S.day; var amt = money((S.till || 0) + (S.tips || 0));
    toast('🧾 The till and the tip jar hold ' + amt + '. A robber takes all of it: empty them into the vault, or book the courier.', 'bad');
    logEvent('🧾 ' + amt + ' sitting in the till and the tip jar', 'bad');
    if (guard.h && !guardOff() && guard.say) guard.say('That till\'s getting heavy, boss.', '#ffc857', 3000);
  }
  var ROB_KINDS = {
    snatch: { label: 'snatch thief', armed: false, weapon: null,      speed: 2.7, demandT: 0,  bat: 1,    pepper: 1,    taser: 1,    guard: 0.25 },
    knife:  { label: 'knife robber', armed: true,  weapon: 'knife',   speed: 2.4, demandT: 13, bat: 0.65, pepper: 0.85, taser: 0.95, guard: 0 },
    gun:    { label: 'gunman', armed: true,  weapon: 'pistol',  speed: 2.4, demandT: 12, bat: 0.3,  pepper: 0.55, taser: 0.9,  guard: -0.2 },
    crew:   { label: 'gang', armed: true,  weapon: 'shotgun', speed: 2.4, demandT: 11, bat: 0.2,  pepper: 0.45, taser: 0.85, guard: -0.3 }
  };
  // what you can fight back with: the bat is free, the rest comes out of the weapon locker by the counter
  var WEAPONS = {
    pepper:  { ico: '🌶️', name: 'pepper spray', price: 60,   range: 3.2, dot: 0.8,   cd: 900,  sfx: 'spray',   lethal: false, d: 'short range, six bursts a can' },
    taser:   { ico: '⚡', name: 'taser',         price: 350,  range: 5.5, dot: 0.9,   cd: 3500, sfx: 'zap',     lethal: false, lvl: 3, d: 'drops almost anyone, slow to recharge' },
    pistol:  { ico: '🔫', name: '9mm pistol',    price: 900,  range: 16,  dot: 0.965, cd: 380,  sfx: 'gunshot', lethal: true, lic: true, ammo: 'rounds', d: 'comes with 16 rounds' },
    shotgun: { ico: '💥', name: 'pump shotgun',  price: 1600, range: 8,   dot: 0.88,  cd: 1100, sfx: 'shotgun', lethal: true, lic: true, ammo: 'shells', d: 'comes with 8 shells' },
    rifle:   { ico: '🎯', name: 'hunting rifle', price: 2400, range: 30,  dot: 0.985, cd: 1500, sfx: 'rifle',   lethal: true, lic: true, ammo: 'cartridges', d: 'the longest reach, one careful shot at a time; hold right-click for the scope; comes with 10 cartridges' },
    ak:      { ico: '🪖', name: 'AK-47',         price: 3200, range: 20,  dot: 0.93,  cd: 110,  sfx: 'ak',      lethal: true, lic: true, auto: true, ammo: 'bullets', d: 'full auto: hold the button down; kicks upward, so pull it back on target; comes with 90 bullets' }
  };
  function mkRobber(id) { return { id: id, g: null, h: null, state: 'away', path: [], t: 0, bubble: null, grabbed: 0, goods: [], disp: {}, guardRolled: false, kind: 'knife', weapon: null, role: 'lead', alertT: 0, losT: 0, losOk: false, mask: null, gun: null, masked: false, escal: false, delay: 0, arrived: false, caseT: 8, downFor: 4, raid: '' }; }
  var robber = mkRobber(0), mate = mkRobber(1), robbers = [robber, mate];
  var heist = { on: false, kind: 'knife', policeT: 0, masked: false, aborted: false, t: 0 };
  var REG_POS = new THREE.Vector3(0, 1.4, 3.5);
  function robberSay(r, t, col) { var ob = r.bubble.material.map; r.bubble.material.map = textTex([t], 512, 160, { size: 44, titleColor: col || '#ff6b6b' }); r.bubble.material.needsUpdate = true; if (ob) ob.dispose(); r.bubble.visible = true; r.sayT = 3.5; }
  function robTier() { return clamp(Math.floor((S.level - 1) / 2) + ((S.stats.heists || 0) >= 4 ? 1 : 0), 0, 3); }   // trouble grows with the shop: snatchers first, crews once word gets round there is money here
  function pickRobKind() { var w = [[70, 30, 0, 0], [35, 45, 20, 0], [15, 35, 35, 15], [5, 20, 45, 30]][robTier()]; var roll = Math.random() * 100, acc = 0, ks = ['snatch', 'knife', 'gun', 'crew']; for (var i = 0; i < 4; i++) { acc += w[i]; if (roll < acc) return ks[i]; } return 'knife'; }
  function robWeaponMesh(kind) {   // built along the forearm (local -y) so a raised arm points it at you
    var g = new THREE.Group(); var steel = colorMat(0xb8bcc2, 0.3, 0.9), blk = colorMat(0x16171a, 0.5, 0.4), wood = colorMat(0x5a3a1e, 0.7);
    function add(w, h, d, m, x, y, z) { var b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; g.add(b); return b; }
    if (kind === 'knife') { add(0.03, 0.1, 0.035, blk, 0, 0, 0); add(0.008, 0.2, 0.03, steel, 0, -0.15, 0); }
    else if (kind === 'pistol') { add(0.035, 0.11, 0.05, blk, 0, 0.02, 0.03); add(0.035, 0.2, 0.045, blk, 0, -0.09, -0.02); }
    else if (kind === 'shotgun') { add(0.04, 0.62, 0.05, blk, 0, -0.2, -0.02); add(0.05, 0.16, 0.06, wood, 0, -0.22, 0.02); add(0.045, 0.24, 0.09, wood, 0, 0.2, 0.02); }
    g.position.set(0.02, -0.3, 0.05); return g;
  }
  function buildRobber(r, kind, weapon, role) {
    if (!r.g) { r.g = new THREE.Group(); world.group.add(r.g); r.bubble = sprite(textTex(['…'], 512, 160, { size: 44 }), 1.5, 0.58, 0, 2.25, 0, r.g); }
    if (r.h) { r.g.remove(r.h); disposeTree(r.h); } world.interact = world.interact.filter(function (m) { return m.userData.robberId !== r.id; });
    r.h = makeHuman(strangerLook(role === 'bagman', true)); r.g.add(r.h); r.g.userData.gated = true;   /* dressed like anyone off the street: the balaclava stays in a pocket until he makes his move */
    var P = r.h.userData.parts; r.mask = new THREE.Group(); var hood = new THREE.Mesh(new THREE.SphereGeometry(0.195, 14, 12), colorMat(0x0c0c0e, 0.95)); hood.position.set(0, 0.24, 0); r.mask.add(hood); var slit = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.03), colorMat(0xd9a57e, 0.8)); slit.position.set(0, 0.27, 0.185); r.mask.add(slit); r.mask.visible = false; P.head.add(r.mask);
    r.gun = weapon ? robWeaponMesh(weapon) : null; if (r.gun) { r.gun.visible = false; P.rArm.userData.elbow.add(r.gun); }
    var hb = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.1, 0.5), MAT.none); hb.position.y = 1.25; hb.userData.robberId = r.id; r.h.add(hb); interactable(hb, { kind: 'robber', rid: r.id });
    r.kind = kind; r.weapon = weapon; r.role = role; r.t = 0; r.grabbed = 0; r.goods = []; r.disp = {}; r.guardRolled = false; r.alertT = 0; r.losT = 0; r.losOk = false; r.escal = false; r.masked = false; r.arrived = false; r.raid = ''; r.bubble.visible = false; standBack(r.h); r.g.visible = true; r.g.rotation.y = 0;
  }
  function startRobbery(kind) {
    if (heist.on || !shop().open) return;
    kind = ROB_KINDS[kind] ? kind : pickRobKind(); var K = ROB_KINDS[kind];
    heist = { on: true, kind: kind, policeT: 0, masked: false, aborted: false, t: 0 }; S.stats.heists = (S.stats.heists || 0) + 1;
    (kind === 'crew' ? [robber, mate] : [robber]).forEach(function (r, i) {
      buildRobber(r, kind, i ? 'pistol' : K.weapon, i ? 'bagman' : 'lead');
      var side = Math.random() < 0.5 ? 1 : -1;
      r.plan = i ? 'browse' : (Math.random() < 0.6 ? 'queue' : 'browse');   /* the lead usually queues like a customer and shows his hand at the window; otherwise he browses the lobby */
      r.pre = 'walk'; r.slot = -1; r.seq = 0; r.spot = null; r.state = 'case';
      r.path = [{ x: 6.5 * side, z: 11.6 }, { x: 0.6 * side, z: 11.4 }, { x: 0.65, z: 10.15 }]; r.g.position.set(r.path[0].x, 0, r.path[0].z);
      r.caseT = i ? 999 : r.plan === 'queue' ? randf(18, 32) : randf(8, 16); r.delay = i ? randf(6, 16) : 0;   // a partner comes in on his own a little later and waits for the lead's signal
    });
    /* no announcement: they walk in like anyone else, and the first sign may be the mask */
  }
  function maskUp(r) {
    if (r.masked || r.state !== 'case') return; r.delay = 0; r.g.visible = true; r.slot = -1; r.masked = true; r.g.userData.gated = false; r.mask.visible = true; if (r.gun) r.gun.visible = true; r.h.userData.setMood('angry'); r.t = 0;
    if (!heist.masked) { heist.masked = true; sfx('alarm'); var K = ROB_KINDS[r.kind]; toast('🚨 ' + (r.kind === 'crew' ? 'They pulled masks down, and one has a shotgun' : r.kind === 'gun' ? 'He pulled a mask down, and he has a gun' : r.kind === 'knife' ? 'He pulled a mask down, and he has a knife' : 'He pulled his hood up and he\'s heading for the tip jar'), 'bad'); logEvent('🚨 ' + (r.kind === 'crew' ? 'A gang' : 'A ' + K.label) + ' just made a move in the lobby', 'bad'); guard.say('Hey. Stop right there.', '#ff6b6b', 3000); lineFlee(); if (S.customer && !S.customer.stage && npc.state !== 'down' && npc.state !== 'out') { logEvent('🏃 ' + S.customer.who + ' ran for the door, and the order went with them', 'bad'); S.customer = null; npcLeave('sad', 'I\'m out of here.', '#ff6b6b'); } }   // whoever was being served clears the line of fire
    if (r.role === 'bagman') { var tgt = propInst.goodsShelf ? propWorld('goodsShelf', 0, 0.85) : { x: 6.5, z: 2.7 }; r.path = routeTo(r.g.position, tgt.x, tgt.z); r.state = 'raid'; r.raid = 'goods'; }
    else { r.path = routeTo(r.g.position, 0, 5.25); r.state = 'in'; if (mate.state === 'case') maskUp(mate); }
  }
  function heistAbort(how) {
    heist.aborted = true; robbers.forEach(function (r) { if (r.state === 'case') robberFlee(r); });
    if (how === 'id') { guard.say('This card\'s a fake. Out.', '#ffc857', 3000); S.rep += 1; logEvent('🪪 The guard spotted a fake ID at the door and turned the man away. He wasn\'t there to buy anything (rep +1)', 'good'); toast('🪪 The guard caught a fake ID at the door', 'good'); }
    else if (how === 'guard') { guard.say('You. Out. Now.', '#ffc857', 3000); S.rep += 1; logEvent('🛡️ The guard didn\'t like the look of them and walked them out (rep +1)', 'good'); toast('🛡️ The guard walked a suspicious visitor out', 'good'); }
    else { S.rep += 1; logEvent('🗣️ You confronted the man casing the shop and he left (rep +1)', 'good'); toast('🗣️ He mumbled something and left', 'good'); }
  }
  function confrontRobber(r) { if (r.state !== 'case') return; if (!r.arrived) { robberSay(r, 'Hm? Just coming in.', '#e8f1ea'); return; } if (Math.random() < 0.55) { robberSay(r, r.pre === 'browse' ? 'Just looking. I\'m going.' : 'Forget it. I\'ll come back later.', '#ffc857'); heistAbort('you'); } else { robberSay(r, 'Wrong move.', '#ff6b6b'); maskUp(robber); } }
  function heistDemander() { for (var i = 0; i < robbers.length; i++) if (robbers[i].state === 'demand') return robbers[i]; return null; }
  function complyHeist() { var r = heistDemander(); if (!r) return; robberSay(r, 'Smart. Nobody moves.', '#ffc857'); takeTill(r, true); }
  function takeTill(r, complied) {
    var got = Math.floor(S.till + S.tips); S.till = 0; S.tips = 0; r.grabbed += got; S.stats.robbed = (S.stats.robbed || 0) + got; S.rep = Math.max(0, S.rep - (complied ? 2 : 5)); sfx('bad');
    logEvent('💸 ' + (complied ? 'You handed over ' : 'The robber cleaned out ') + money(got) + ' from the till and tip jar (rep -' + (complied ? 2 : 5) + ')', 'bad'); toast('💸 ' + money(got) + ' gone from the till', 'bad');
    if (r.kind === 'gun' && S.vault >= 50 && propInst.vault) { var v = propWorld('vault', 0, 1.0); robberSay(r, 'Now the vault.', '#ff6b6b'); r.path = routeTo(r.g.position, v.x, v.z, true); r.state = 'raid'; r.raid = 'vault'; r.t = 0; toast('🚨 He\'s coming round through the staff door, and he wants the vault', 'bad'); logEvent('🚨 The robber is heading into the back for the vault', 'bad'); }
    else { robberFlee(r); if (r === robber && (mate.state === 'raid' || mate.state === 'loot')) { finishLoot(mate, true); robberFlee(mate); } }
    hud();
  }
  function finishLoot(r, early) {
    if (r.raid === 'vault') { var cut = Math.floor(S.vault * (early ? 0.2 : 0.5)); S.vault -= cut; r.grabbed += cut; S.stats.robbed = (S.stats.robbed || 0) + cut; if (cut > 0) { logEvent('💸 ' + money(cut) + ' taken out of the vault', 'bad'); toast('💸 ' + money(cut) + ' gone from the vault', 'bad'); } }
    else if (r.raid === 'goods') { var n = 0; if (isLocked('goodsShelf') || !shutterOpen('goodsShelf')) { logEvent('🔒 The goods shelf was shut: the bagman got nothing off it', 'good'); toast('🔒 They couldn\'t get into the goods shelf', 'good'); r.raid = ''; return; } ['bags', 'joints', 'cookies'].forEach(function (k) { Object.keys(S.lots[k]).forEach(function (sid) { var have = S.lots[k][sid].n; var take2 = Math.floor(have * (early ? 0.3 : 0.6)); if (take2 <= 0) return; var d = lotDraw(k, sid, take2); if (d.n > 0) { r.goods.push({ kind: k, id: sid, n: d.n, q: d.q, thc: d.thc }); n += d.n; } }); }); if (S.cigShutter && !isLocked('cigCabinet')) { r.cigs = r.cigs || {}; Object.keys(S.cigStock || {}).forEach(function (ck) { var ct = Math.floor(S.cigStock[ck] * (early ? 0.3 : 0.6)); if (ct > 0) { S.cigStock[ck] -= ct; r.cigs[ck] = (r.cigs[ck] || 0) + ct; n += ct; } }); syncCigCab(); } /* an open shutter is an invitation */ syncGoods(); world.dirty = true; if (n > 0) { logEvent('💸 The bagman swept ' + n + ' packed goods off the shelf', 'bad'); toast('💸 ' + n + ' packed goods swept into a bag', 'bad'); } }
    r.raid = '';
  }
  function returnLoot(r) {
    var bits = []; if (r.grabbed > 0) { S.till += r.grabbed; bits.push(money(r.grabbed)); r.grabbed = 0; }
    if (r.goods.length) { var n = 0; r.goods.forEach(function (g3) { lotAdd(g3.kind, g3.id, g3.n, g3.q, g3.thc); n += g3.n; }); r.goods = []; syncGoods(); world.dirty = true; bits.push(n + ' packed goods'); }
    var cn = 0; Object.keys(r.cigs || {}).forEach(function (ck) { S.cigStock[ck] = cigStock(ck) + r.cigs[ck]; cn += r.cigs[ck]; }); r.cigs = {}; if (cn) { syncCigCab(); bits.push(cn + ' packs from the cigarette cabinet'); }
    var dn = 0; Object.keys(r.disp).forEach(function (k) { S.display[k] = (S.display[k] || 0) + r.disp[k]; dn += r.disp[k]; }); r.disp = {}; if (dn) { syncDisplay(); bits.push(dn + ' counter items'); }
    if (bits.length) toast('💵 Got back ' + bits.join(' and '), 'good');
  }
  function robberFlee(r) { r.delay = 0; if (r.g) { r.g.visible = true; r.g.userData.gated = false; } r.state = 'flee'; r.t = 0; r.path = (r.g.position.z > 9.3 ? [] : routeTo(r.g.position, 0.4, 7.9).concat([{ x: 0, z: 9.7 }])).concat([{ x: 0.6, z: 11.4 }, { x: Math.random() < 0.5 ? 16 : -16, z: 11.6 }]); }   /* still outside: just walk off */
  // can the player see this figure? walls, doors and furniture block; glass, signs' hit boxes and the figure itself do not
  var losRay = new THREE.Raycaster(); losRay.layers.enable(TOWN_LAYER);   /* rays still hit the town layer */
  function sightLine(tg) {
    losRay.camera = camera; var o = new THREE.Vector3(player.pos.x, player.pos.y - 0.1, player.pos.z), t = new THREE.Vector3(tg.position.x, 1.3, tg.position.z); var dir = t.clone().sub(o); var d = dir.length(); if (d < 0.5) return true; losRay.set(o, dir.normalize()); losRay.far = d - 0.35;
    var hits = losRay.intersectObjects(world.group.children, true);
    for (var i = 0; i < hits.length; i++) { var ob = hits[i].object; if (!ob.isMesh || ob.userData.soft) continue; var gp = ob.geometry && ob.geometry.parameters; if (gp && ((ob.geometry.type === 'CylinderGeometry' && (Math.max(gp.radiusTop, gp.radiusBottom) < 0.03 || gp.height < 0.05)) || ob.geometry.type === 'TorusGeometry')) continue; var m = ob.material;   // cloth, window bars, the speak-through grille and curtain rings never stop a shot
      if (!m || m === MAT.none || m.visible === false || (m.transparent && m.opacity < 0.75)) continue; var own = false, vis = true; for (var p = ob; p; p = p.parent) { if (p === tg) own = true; if (!p.visible) vis = false; } if (own || !vis) continue; return false; }
    return true;
  }
  function robberShoot(r, bonus) {
    sfx(r.weapon === 'shotgun' ? 'shotgun' : 'gunshot'); burst(r.g.position.x, 1.4, r.g.position.z, 0xffc36b, 8, 'out');
    var d = Math.hypot(player.pos.x - r.g.position.x, player.pos.z - r.g.position.z); var p = (r.weapon === 'shotgun' ? (d < 6 ? 0.75 : 0.3) : 0.5) + (bonus || 0);
    if (Math.random() < p) hurtPlayer(r.weapon, r); else toast('💥 A shot goes past your head', 'bad');
  }
  function robberAttack(r) {   // what a robber does when your move on him fails
    var d = Math.hypot(player.pos.x - r.g.position.x, player.pos.z - r.g.position.z);
    if (!r.weapon) return; if (r.weapon === 'knife') { if (d < 2.6) { sfx('swing'); hurtPlayer('knife', r); } return; }
    robberShoot(r, 0.3);
  }
  // an armed robber who sees a firearm in your hands shouts once, then starts shooting: draw it and you had better be quick
  function armedReact(r, dt) {
    var h = held(); if (!r.weapon || r.weapon === 'knife' || player.downT > 0 || !h || !WEAPONS[h.kind] || !WEAPONS[h.kind].lethal) { r.alertT = 0; return; }
    r.losT -= dt; if (r.losT <= 0) { r.losT = 0.25; r.losOk = Math.hypot(player.pos.x - r.g.position.x, player.pos.z - r.g.position.z) < 11 && sightLine(r.g); }
    if (!r.losOk) { r.alertT = Math.max(0, r.alertT - dt); return; }
    if (r.alertT === 0) robberSay(r, 'Drop it.', '#ff6b6b'); r.alertT += dt; r.g.rotation.y = Math.atan2(player.pos.x - r.g.position.x, player.pos.z - r.g.position.z);
    if (r.alertT > 1.5) { r.alertT = 0.6; robberShoot(r, 0); }
  }
  var hurtEl = null;
  function hurtFlash(a) { if (!hurtEl) { hurtEl = document.createElement('div'); hurtEl.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:40;opacity:0;background:radial-gradient(ellipse at center,rgba(160,0,0,.2) 0%,rgba(110,0,0,.9) 100%)'; document.body.appendChild(hurtEl); } hurtEl.style.opacity = String(a); }
  function hurtPlayer(by, r) {
    if (player.downT > 0 || drive.on) return; if (S.armory.vest && Math.random() < 0.4) { sfx('hit'); toast('🦺 The vest took it. You\'re still standing.', 'good'); return; } player.downT = 6; var bill = Math.min(S.bank, (by === 'knife' ? 150 : 300) * (S.armory.vest ? 0.5 : 1)); S.bank -= bill; var pk = Math.floor(S.pocket || 0); if (pk > 0 && r) { S.pocket -= pk; r.grabbed += pk; } S.stats.hurt = (S.stats.hurt || 0) + 1; sfx('hit');
    logEvent('🩸 You were ' + (by === 'knife' ? 'stabbed' : 'shot') + '. The paramedics patched you up. Hospital bill: ' + money(bill) + (pk ? ', and he emptied your pockets (' + money(pk) + ')' : ''), 'bad'); toast('🩸 You\'re down, ' + (by === 'knife' ? 'stabbed' : 'shot') + '. Hospital bill: ' + money(bill), 'bad');
    robbers.forEach(function (x) { if (x.state === 'demand') takeTill(x, false); }); hud();
  }
  // bat, pepper spray or taser on a robber: works or does not, by how dangerous he is; caught from behind while he loots it nearly always works
  function strikeRobber(r, how) {
    if (r.state === 'out' || r.state === 'away') return; var K = ROB_KINDS[r.kind];
    if (r.state === 'down') { if (how !== 'bat') return; r.state = 'out'; r.t = 0; S.rep += 2; logEvent('🚓 The robber is out cold and the police carted him off. Word gets round (rep +2)', 'good'); toast('🚓 Robber out cold. The police took him.', 'good'); return; }
    if (r.state === 'case') { r.state = 'down'; r.t = 0; r.downFor = 4; lieDown(r.h); robberSay(r, 'What the hell?', '#ff6b6b'); S.rep = Math.max(0, S.rep - 4); heist.aborted = true; robbers.forEach(function (x) { if (x !== r && x.state === 'case') robberFlee(x); }); logEvent('👊 You floored a man who hadn\'t done anything yet (rep -4)', 'bad'); toast('👊 He hadn\'t done anything yet (rep -4)', 'bad'); return; }
    var p = r.state === 'flee' ? 1 : (r.state === 'loot' || r.state === 'raid') ? Math.min(1, K[how] + 0.35) : K[how];
    if (Math.random() >= p) { robberSay(r, how === 'bat' ? 'Nice try.' : 'That all you\'ve got?', '#ff6b6b'); toast((how === 'bat' ? '🏏 He saw the swing coming' : how === 'pepper' ? '🌶️ He turned his face away' : '⚡ The darts caught his jacket') + ', and it didn\'t stop him', 'bad'); robberAttack(r); return; }
    returnLoot(r); r.state = 'down'; r.t = 0; r.downFor = how === 'bat' ? 4 : 8; lieDown(r.h); robberSay(r, how === 'pepper' ? 'Argh. My eyes.' : 'Argh.', '#ff6b6b'); S.rep += 4; S.stats.foiled = (S.stats.foiled || 0) + 1;
    logEvent((how === 'bat' ? '🏏 You floored ' : how === 'pepper' ? '🌶️ You pepper-sprayed ' : '⚡ You tasered ') + (r.kind === 'crew' ? 'one of the gang' : 'the ' + K.label) + ' (rep +4)', 'good'); toast((how === 'bat' ? '🏏' : how === 'pepper' ? '🌶️' : '⚡') + ' Robber down (rep +4)', 'good');
  }
  function shootRobber(r) {
    if (r.state === 'out' || r.state === 'away') return; var K = ROB_KINDS[r.kind]; var fleeing = r.state === 'flee' || r.state === 'down', justified = K.armed && r.masked && !fleeing;
    returnLoot(r); r.state = 'out'; r.t = 0; lieDown(r.h); robberSay(r, '…', '#ff6b6b');
    if (justified) { S.rep += 5; S.stats.foiled = (S.stats.foiled || 0) + 1; logEvent('🔫 You shot ' + (r.kind === 'crew' ? 'one of the gang' : 'the ' + K.label) + '. Ruled self-defence, and an ambulance and the police took it from there (rep +5)', 'good'); toast('🔫 Robber shot in self-defence (rep +5)', 'good'); }
    else { S.rep = Math.max(0, S.rep - 10); policeFine('Excessive force: you shot ' + (fleeing ? 'a man who was already running or down' : 'an unarmed man')); }
  }
  function shotBystander(t) {
    hitNpc(t.what, t.ref); addHeat(40); var fine = Math.min(S.bank, 2000); S.bank -= fine; S.rep = Math.max(0, S.rep - 30); S.noCustomersUntil = now() + 240000; if (S.lic) S.lic.firearm = false; S.armory.pistol = false; S.armory.shotgun = false; S.armory.rifle = false; S.armory.ak = false;
    for (var i = 0; i < 6; i++) if (S.hotbar[i] && WEAPONS[S.hotbar[i].kind] && WEAPONS[S.hotbar[i].kind].lethal) S.hotbar[i] = null;
    logEvent('🚓 You shot a bystander: ' + money(fine) + ' fine, firearms licence revoked, guns confiscated (rep -30)', 'bad'); toast('🚓 You shot a bystander. Licence revoked, guns confiscated.', 'bad'); hud();
  }
  function warningShot() {   // a shot into the ceiling: a knife man may bolt, a gunman takes it personally
    robbers.forEach(function (r) { if (r.state !== 'demand' && r.state !== 'in') return; if (r.weapon === 'knife' && Math.random() < 0.5) { robberSay(r, 'Okay, okay. I\'m gone.', '#ffc857'); returnLoot(r); S.rep += 2; logEvent('🔫 A warning shot sent the knife robber running (rep +2)', 'good'); robberFlee(r); } else if (r.weapon && r.weapon !== 'knife') r.alertT = Math.max(r.alertT, 1.0); });
  }
  function fireWeapon() {
    var h = held(), W = h && WEAPONS[h.kind]; if (!W || player.downT > 0 || swing.cd > now()) return; var A = S.armory;
    if (h.kind === 'pepper' && (A.spray || 0) <= 0) { sfx('click'); swing.cd = now() + 400; toast('The can is empty. Refill it at the weapon locker.', 'bad'); return; }
    if (W.ammo && (A[W.ammo] || 0) <= 0) { sfx('click'); swing.cd = now() + 400; toast('Click. Out of ' + W.ammo + '. Buy more at the weapon locker.', 'bad'); return; }
    if (h.kind === 'pepper') A.spray--; if (W.ammo) A[W.ammo]--;
    swing.cd = now() + W.cd; swing.t = 0.35; sfx(W.sfx); if (W.lethal) world.muzzleT = 0.09; if (W.auto) { player.pitch = Math.min(player.pitch + 0.012, 1.3); player.yaw += (Math.random() - 0.5) * 0.01; }   /* full auto climbs: pull it back down */
    var fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw); if (!W.lethal) burst(player.pos.x + fx * 1.2, player.pos.y - 0.25, player.pos.z + fz * 1.2, h.kind === 'pepper' ? 0xff8a3c : 0x7fd4ff, 14, 'out');
    var t = facingTargets(W.range, W.dot).filter(function (c) { return sightLine(c.ref.g); })[0]; hud(); save();
    if (!t) { if (W.lethal) warningShot(); return; }
    burst(t.ref.g.position.x, 1.3, t.ref.g.position.z, W.lethal ? 0xb01010 : 0xffffff, 12, 'out');
    if (t.what === 'robber') { if (W.lethal) shootRobber(t.ref); else strikeRobber(t.ref, h.kind); } else if (W.lethal) shotBystander(t); else hitNpc(t.what, t.ref);
  }
  var trigger = { down: false };   // the left button held, for full-auto weapons
  function updateTrigger() {
    if (!trigger.down) return; var h = held(), W = h && WEAPONS[h.kind];
    if (!W || !W.auto || !player.locked || ui.blocked() || drive.on) { trigger.down = false; return; }
    if ((S.armory[W.ammo] || 0) <= 0) { trigger.down = false; return; }   /* the click on an empty mag came with the first press */
    fireWeapon();
  }
  var scope = { on: false, k: 0, el: null };   // the rifle's scope, held on right-click
  function updateScope(dt) {
    var h = held(), want = scope.on && !!h && h.kind === 'rifle' && !drive.on && !ui.blocked() && player.locked && !(player.downT > 0);
    scope.k = clamp(scope.k + (want ? dt * 6 : -dt * 8), 0, 1);
    var f = SET.fov + (20 - SET.fov) * scope.k * scope.k; if (Math.abs(camera.fov - f) > 0.01) { camera.fov = f; camera.updateProjectionMatrix(); }
    if (!scope.el) { var d = document.createElement('div'); d.style.cssText = 'position:fixed;inset:0;pointer-events:none;opacity:0;transition:opacity .12s;z-index:4;background:radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 0, rgba(0,0,0,0) 34vmin, rgba(0,0,0,.94) 35vmin)'; d.innerHTML = '<div style="position:absolute;left:50%;top:15vmin;bottom:15vmin;width:1px;background:rgba(0,0,0,.85)"></div><div style="position:absolute;top:50%;left:calc(50% - 35vmin);right:calc(50% - 35vmin);height:1px;background:rgba(0,0,0,.85)"></div>'; document.body.appendChild(d); scope.el = d; }
    var vis = scope.k > 0.7 ? '1' : '0'; if (scope.el.style.opacity !== vis) scope.el.style.opacity = vis;
  }
  function weaponLabel(kind) { var W = WEAPONS[kind], A = S.armory; return W.ico + ' ' + W.name.charAt(0).toUpperCase() + W.name.slice(1) + ' · ' + (kind === 'pepper' ? (A.spray || 0) + ' bursts' : W.ammo ? (A[W.ammo] || 0) + ' ' + W.ammo : 'charged') + ' · click to ' + (W.lethal ? 'fire' : 'use') + (kind === 'rifle' ? ' · hold right-click to aim' : kind === 'ak' ? ' · hold to keep firing' : ''); }
  function lockerMenu() {
    var A = S.armory, lines = [];
    Object.keys(WEAPONS).forEach(function (k) {
      var W = WEAPONS[k]; var inHand = S.hotbar.some(function (x) { return x && x.kind === k; });
      if (!A[k]) { var why = W.lic && !hasLic('firearm') ? 'needs the firearms licence' : W.lvl && S.level < W.lvl ? 'needs level ' + W.lvl : S.bank < W.price ? 'not enough in the bank' : ''; lines.push({ label: W.ico + ' Buy the ' + W.name + ' · ' + money(W.price) + ' <small>' + (why || W.d) + '</small>', cls: why ? 'muted' : '', act: why ? null : function () { S.bank -= W.price; A[k] = true; if (k === 'pepper') A.spray = 6; if (k === 'pistol') A.rounds = (A.rounds || 0) + 16; if (k === 'shotgun') A.shells = (A.shells || 0) + 8; if (k === 'rifle') A.cartridges = (A.cartridges || 0) + 10; if (k === 'ak') A.bullets = (A.bullets || 0) + 90; sfx('cash'); toast(W.ico + ' Bought the ' + W.name + '. It\'s in the weapon locker.', 'good'); logEvent(W.ico + ' Bought a ' + W.name, ''); save(); } }); }
      else if (inHand) lines.push({ label: W.ico + ' The ' + W.name + ' is in your hands <small>G puts it back</small>', cls: 'muted' });
      else lines.push({ label: W.ico + ' Take the ' + W.name, act: function () { if (k !== 'pepper' && k !== 'taser' && !hasLic('firearm')) { toast('Your firearms licence is gone, so the guns stay locked', 'bad'); return; } take({ kind: k }); } });
    });
    function ammoLine(ico, what, key, n, price) { lines.push({ label: ico + ' Buy ' + n + ' ' + what + ' · ' + money(price) + ' <small>' + (A[key] || 0) + ' left</small>', cls: S.bank < price ? 'muted' : '', act: S.bank < price ? null : function () { S.bank -= price; A[key] = (key === 'spray' ? 0 : (A[key] || 0)) + n; sfx('cash'); toast(ico + ' ' + n + ' ' + what, 'good'); save(); } }); }
    if (A.pepper) ammoLine('🌶️', 'bursts (new can)', 'spray', 6, 25); if (A.pistol) ammoLine('🔫', 'rounds', 'rounds', 16, 40); if (A.shotgun) ammoLine('💥', 'shells', 'shells', 8, 40); if (A.rifle) ammoLine('🎯', 'cartridges', 'cartridges', 10, 55); if (A.ak) ammoLine('🪖', 'bullets', 'bullets', 90, 70);
    ctxOpen('🧰 Weapon locker', 'bank ' + money(S.bank) + (hasLic('firearm') ? ' · firearms licence on file' : ' · guns need the firearms licence'), lines);
  }
  function robberOf(d) { return robbers[d.rid] || robber; }
  function robberPrompt(d, h) {
    var r = robberOf(d); if (h && h.kind === 'bat') return 'Swing <small>floor him</small>'; if (h && WEAPONS[h.kind]) return (WEAPONS[h.kind].lethal ? 'FIRE' : 'Use the ' + WEAPONS[h.kind].name) + ' <small>click</small>';
    if (r.state === 'case') return 'Customer <small>' + (r.pre === 'browse' ? '' : 'in line · ') + 'E to have a word</small>'; return 'Robber <small>bat by the till · weapon locker next to it</small>';
  }
  function robberInteract(d, h) { var r = robberOf(d); if (h && h.kind === 'bat') swingBat(); else if (h && WEAPONS[h.kind]) fireWeapon(); else if (r.state === 'case') confrontRobber(r); else toast('Get the bat or something from the weapon locker, hand over the till, or let the guard handle it', 'bad'); }
  function panicButton() {
    if (!heist.on || !heist.masked) { toast('Nothing to call in', ''); return; } if (!S.upgrades.panic) { toast('No silent alarm installed. It\'s under Gear on the office PC.', 'bad'); return; }
    if (heist.policeT > 0) { toast('🚓 Police already on the way · ' + Math.ceil(heist.policeT) + ' s', ''); return; } heist.policeT = 12; sfx('click'); toast('🚨 Silent alarm tripped. A car is on its way.', 'good'); logEvent('🚨 You hit the silent alarm', '');
  }
  function policeArrive() {
    var inside = copTargets();
    if (!inside.length) { sfx('siren'); toast('🚓 The police arrived too late and took a statement', ''); logEvent('🚓 Police arrived after it was over', ''); return; }
    policeStart();   /* the car has to get here from the far end of Main Street before anyone is arrested */
  }
  function clearHeist() { if (police.on) return; robbers.forEach(function (r) { r.state = 'away'; if (r.g) r.g.visible = false; }); heist.on = false; heist.policeT = 0; }   /* not while the officers are still walking him out */
  function heistHint() {
    if (!heist.on) return ''; var lead = robber, pol = heist.policeT > 0 ? ' 🚓 police in ' + Math.ceil(heist.policeT) + ' s.' : S.upgrades.panic && heist.masked ? ' Press P for the silent alarm.' : '';
    if (player.downT > 0) return '🩸 You\'re down. Stay still.';
    if (!heist.masked) return caseHintOn() ? '👀 Someone in the lobby hasn\'t ordered anything and keeps glancing at the till. Walk up and press E to have a word, or keep a weapon close.' : '';
    if (lead.state === 'demand') return '🚨 Robbery: ' + (lead.weapon === 'knife' ? 'he has a knife' : 'he\'s armed') + '. Press E on the till to hand it over, or stop him with the bat, pepper spray, the taser or a gun.' + (mate.state === 'raid' || mate.state === 'loot' ? ' His partner is in the back at the goods shelf.' : '') + pol;
    if (lead.state === 'raid' || lead.state === 'loot') return '🚨 He\'s in the back going for the vault. Catch him from behind while he works on it.' + pol;
    if (mate.state === 'raid' || mate.state === 'loot') return '🚨 The bagman is still at the goods shelf.' + pol;
    if (robbers.some(function (r) { return r.state === 'flee' && (r.grabbed > 0 || r.goods.length); })) return '🏃 He\'s running with your money. Drop him before the door and you get it back, but don\'t shoot a fleeing man.' + pol;
    return pol ? '🚨' + pol : '';
  }
  function updateRobbers(dt) {
    if (!heist.on) return; heist.t += dt;
    if (heist.policeT > 0) { heist.policeT -= dt; if (heist.policeT <= 0) { heist.policeT = 0; policeArrive(); } }
    robbers.forEach(function (r) { if (r.state !== 'away' && r.h) updateRobber(r, dt); });
    if (!police.on && robbers.every(function (r) { return r.state === 'away'; })) { heist.on = false; heist.policeT = 0; save(); hud(); }
  }
  function robberForce(r, g2) {   // a shut door on his way is something to break, not to walk through
    var d = doorAt(g2.position, 0, 1.5); if (!d) return false;
    if (!d.locked) { setDoor(d.id, true); sfx('door'); return false; }   /* unlocked: he just opens it and keeps going */
    r.forceDoor = d; r.forceBack = r.state; r.forceTo = r.path && r.path.length ? r.path[r.path.length - 1] : null;
    r.forceFor = ROB_KINDS[r.kind] && r.kind === 'gun' ? 2.6 : 3.8; r.forceHit = 0;
    r.state = 'force'; r.t = 0;
    robberSay(r, 'Locked? Not for long.', '#ff6b6b');
    logEvent('🚪 He is working on ' + (d.name || 'a locked door'), 'bad');
    return true;
  }
