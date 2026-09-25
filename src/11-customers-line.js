//@ the window customer, the line and the rope gate
  // ── Customer: street → door → ID check → service window → leaves ──
  var npc = { g: null, state: 'away', who: null, path: [], bubble: null, human: null, waitT: 0, checkT: 0 };
  var CUSTOMER_IN = [[6.5, 11.6], [0.6, 11.4], [0, 9.7], [0.5, 7.9]];
  var CUSTOMER_WINDOW = [[0, 6.4], [0, 5.25]];
  function buildNpc() {
    var g = new THREE.Group(); npc.g = g; world.group.add(g); g.visible = false; g.userData.gated = true;
    npc.bubble = sprite(textTex(['…'], 512, 200, { size: 40 }), 1.5, 0.58, 0, 2.25, 0, g);
  }
  npc.setCustomer = function (c) {
    if (npc.human) { npc.g.remove(npc.human); disposeTree(npc.human); world.interact = world.interact.filter(function (m) { return !m.userData.npc; }); }
    var spec = CAST[c.who] || c.look || {}; npc.human = makeHuman(spec); npc.g.add(npc.human); npc.who = c.who; npc.cust = c;
    var hitBox = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.1, 0.5), MAT.none); hitBox.position.y = 1.25; hitBox.userData.npc = true; npc.human.add(hitBox); interactable(hitBox, { kind: 'customer', label: c.who, prompt: 'Serve' });
    npc.setBubble(c);
    var side = Math.random() < 0.5 ? 1 : -1;
    npc.state = 'enter'; npc.path = CUSTOMER_IN.map(function (p, i) { return { x: i < 2 ? p[0] * side : p[0], z: p[1] }; });
    npc.g.position.set(npc.path[0].x, 0, npc.path[0].z + 0.01); npc.g.visible = true; npc.bubble.visible = false; npc.human.userData.impatient = false;
  };
  function npcLeave(mood, text, color) {
    if (npc.state === 'away' || !npc.human) return;
    npc.state = 'leave'; npc.human.userData.setMood(mood);
    var ob = npc.bubble.material.map; npc.bubble.material.map = textTex([text], 512, 160, { size: 44, titleColor: color }); npc.bubble.material.needsUpdate = true; if (ob) ob.dispose(); npc.bubble.visible = true;
    npc.path = exitPath(npc.g.position);   /* round the rope, not through the gate or the line */
  }
  npc.leaveHappy = function () { npcLeave('happy', custLine(npc.who, 'thanks'), '#6fdc8c'); };
  npc.leaveSad = function () { npcLeave('sad', custLine(npc.who, 'bye'), '#ff6b6b'); };
  // What security makes of the card. They are good, not perfect, and you can always look yourself.
  function guardVerdict(c, m) {
    var id = c.id; if (!id || id.seen) return true;
    id.seen = true; id.by = 'guard';
    var sharp = clamp(0.62 + (S.upgrades.security2 ? 0.22 : S.upgrades.security ? 0.12 : 0) + (S.staff && S.staff.guardTask === 'door' ? 0.1 : -0.1), 0.3, 0.96);
    if (!id.ok && Math.random() < sharp) {
      guard.say('Not with that card. Out.', '#ff6b6b', 2600);
      logEvent('🪪 The guard turned ' + c.who + ' away: ' + ID_FLAWS[id.flaw].why, '');
      toast('🪪 The guard turned someone away: ' + ID_FLAWS[id.flaw].why, '');
      if (m) lineLeave(m, 'sad'); else { npc.leaveSad(); S.customer = null; } hud();
      return false;
    }
    if (!id.ok) { c.idDodgy = true; guard.say('Go on through.', '#6fdc8c', 1600); }   /* waved through with a bad card: yours to catch */
    return true;
  }
  npc.sayT = null;
  npc.say = function (text, color) { if ((npc.state !== 'wait' && npc.state !== 'rack') || !npc.human) return; var ob = npc.bubble.material.map; npc.bubble.material.map = textTex([text], 512, 160, { size: 44, titleColor: color || '#e8f1ea' }); npc.bubble.material.needsUpdate = true; if (ob) ob.dispose(); npc.human.userData.setMood('talk'); clearTimeout(npc.sayT); npc.sayT = setTimeout(function () { if ((npc.state === 'wait' || npc.state === 'rack') && S.customer && npc.human) { npc.setBubble(S.customer); npc.human.userData.setMood(CAST[npc.who] && CAST[npc.who].mood || 'neutral'); } }, 2600); };
  npc.setBubble = function (c) { if (!c || !npc.bubble) return; var gv = c.given ? c.given.n : 0; var lines = c.stage ? [c.who + (c.premium ? ' 🎩' : ''), c.pay === 'card' ? '💳 card · ' + money(c.due) : '💵 holds out ' + money(c.tendered)] : c.arrived ? [c.who + (c.premium ? ' 🎩' : '')].concat(orderRows(c).map(function (r) { return (r.done ? '✓ ' : '· ') + r.text; })).concat(c.premium ? ['Quality ' + c.minQ + '+, please'] : []) : [c.who + (c.premium ? ' 🎩' : ''), custLine(c.who, 'hi')]; var ob = npc.bubble.material.map; var bh = Math.max(200, 60 + lines.length * 46); npc.bubble.scale.y = 1.5 * bh / 512; npc.bubble.position.y = 2.25 + (bh - 200) / 512 * 0.75; npc.bubble.material.map = textTex(lines, 512, bh, { size: lines.length > 3 ? 32 : 36, titleColor: c.premium ? '#ffc857' : '#6fdc8c', line: c.premium ? 'rgba(255,200,87,.7)' : 'rgba(111,220,140,.6)' }); npc.bubble.material.needsUpdate = true; if (ob) ob.dispose(); };
  function walkAlong(g, path, speed, dt) {
    if (!path.length) return true;
    var tgt = path[0]; var dx = tgt.x - g.position.x, dz = tgt.z - g.position.z; var d = Math.hypot(dx, dz);
    if (d < 0.08) { path.shift(); return path.length === 0; }
    if (g.userData.gated && ropeHeld(g, dx / d, dz / d, d)) return false;   /* a hooked rope just ahead: wait for it to be opened */
    var step = Math.min(d, speed * dt); g.position.x += dx / d * step; g.position.z += dz / d * step; g.userData.moveT = now();
    var want = Math.atan2(dx, dz); var cur = g.rotation.y; var diff = want - cur; while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2; g.rotation.y = cur + diff * Math.min(1, dt * 10);
    return false;
  }
  function updateNpc(dt) {
    var c = S.customer;
    if (c && npc.state === 'away') npc.setCustomer(c);
    if (!c && (npc.state === 'wait' || npc.state === 'enter' || npc.state === 'check' || npc.state === 'towindow')) npc.leaveSad();
    if (c && (npc.state === 'down' || npc.state === 'out')) { S.customer = null; c = null; }
    if (c && npc.cust !== c && npc.human && (npc.state === 'enter' || npc.state === 'check' || npc.state === 'towindow' || npc.state === 'wait')) { npc.leaveSad(); c = null; }   // the record was swapped under this body: it walks out, the new customer comes in after
    var g = npc.g; if (!g.visible || !npc.human) return;
    var walkSpeed = (npc.human.userData.spec.hunch ? 0.9 : 1.5);
    if (npc.state === 'enter') { if (walkAlong(g, npc.path, walkSpeed, dt)) { if (guardOnDuty()) { npc.state = 'check'; npc.checkT = 0; g.rotation.y = Math.PI / 2; guard.startCheck(); npc.human.userData.parts.lArm.rotation.x = -1.1; } else { npc.state = 'towindow'; npc.path = CUSTOMER_WINDOW.map(function (p) { return { x: p[0], z: p[1] }; }); if (c) { c.idPending = true; } } }   /* nobody on the door: they bring the card to you */ animateHuman(npc.human, dt, 'walk', walkSpeed, null); }
    else if (npc.state === 'check') { npc.checkT += dt; animateHuman(npc.human, dt, 'idle', 0, guard.h ? guard.h.position : player.pos); npc.human.userData.parts.lArm.rotation.x = -1.1; npc.human.userData.parts.lArm.rotation.z = 0.2; if (npc.checkT > 2.6) { if (c && c.id && !guardVerdict(c)) return; npc.state = 'towindow'; npc.path = CUSTOMER_WINDOW.map(function (p) { return { x: p[0], z: p[1] }; }); } }
    else if (npc.state === 'towindow') { if (walkAlong(g, npc.path, walkSpeed, dt)) { npc.state = 'wait'; npc.bubble.visible = true; if (c && c === npc.cust && !c.arrived) { c.arrived = true; c.until = now() + (c.premium ? 75000 : 60000) * (S.upgrades.lounge2 ? 2 : S.upgrades.lobby ? 1.5 : 1); sfx('bell'); npc.setBubble(c); logEvent('🗣️ ' + c.who + ' is at the window and wants ' + wantText(c) + (c.premium ? ' (quality ' + c.minQ + '+)' : ''), c.premium ? 'rare' : ''); toast('🗣️ ' + c.who + ': ' + wantText(c), ''); hud(); if (c.acc && c.acc.some(function (a2) { return a2.ok === undefined; })) { npc.state = 'rack'; npc.rackStep = 0; npc.rackT = 0; npc.path = [{ x: 0.95, z: 5.0 }]; } } npc.human.userData.setMood('talk'); setTimeout(function () { if (npc.state === 'wait') npc.human.userData.setMood(CAST[npc.who] && CAST[npc.who].mood || 'neutral'); }, 1800); } animateHuman(npc.human, dt, 'walk', walkSpeed, null); }
    else if (npc.state === 'wait') {
      g.rotation.y = lerp(g.rotation.y, Math.PI, 0.05);
      if (c) { var left = (c.until - now()) / 1000; if (left < 15 && !npc.human.userData.impatient) { npc.human.userData.impatient = true; npc.human.userData.setMood('angry'); } }
      animateHuman(npc.human, dt, 'wait', 0, player.pos);
    }
    else if (npc.state === 'rack') {   // self-serve: walk to the rack, reach over, take each extra (or find the rack empty), walk back to the window
      var pr = npc.human.userData.parts;
      if (npc.rackStep === 0) { if (walkAlong(g, npc.path, walkSpeed * 0.8, dt)) { npc.rackStep = 1; npc.rackT = 0; } animateHuman(npc.human, dt, 'walk', walkSpeed * 0.8, null); }
      else if (npc.rackStep === 1) {
        g.rotation.y = lerp(g.rotation.y, Math.PI, 0.1); animateHuman(npc.human, dt, 'idle', 0, null); pr.rArm.rotation.x = lerp(pr.rArm.rotation.x, -1.5, 0.15); npc.rackT += dt;
        if (npc.rackT > 0.9) {
          npc.rackT = 0; var a2 = c && c.acc ? c.acc.filter(function (a) { return a.ok === undefined; })[0] : null;
          if (!a2) { npc.rackStep = 2; npc.path = [{ x: 0, z: 5.3 }]; pr.rArm.rotation.x = 0; }
          else if ((S.display[a2.item] || 0) >= a2.qty) { S.display[a2.item] -= a2.qty; a2.ok = true; S.stats.acc = (S.stats.acc || 0) + a2.qty; syncDisplay(); sfx('click'); toast('🛒 ' + c.who + ' took a ' + ACC[a2.item].name + ' from the counter display', ''); npc.say(custLine(c.who, 'grab', ACC[a2.item].name), '#6fdc8c'); hud(); }
          else { a2.ok = false; sfx('bad'); toast('🛒 ' + c.who + ' wanted a ' + ACC[a2.item].name + ', but the counter display is empty', 'bad'); logEvent('🛒 ' + c.who + ' found no ' + ACC[a2.item].pl + ' on the counter display. Restock it from the back room.', ''); npc.say(custLine(c.who, 'noAcc', ACC[a2.item].pl), '#ffc857'); c.saidNo = true; hud(); }
        }
      }
      else { if (walkAlong(g, npc.path, walkSpeed * 0.8, dt)) { npc.state = 'wait'; } animateHuman(npc.human, dt, 'walk', walkSpeed * 0.8, null); }
    }
    else if (npc.state === 'down') { npc.downT += dt; if (npc.downT > 4) { standBack(npc.human); npcLeave('angry', custLine(npc.who, 'angry'), '#ff6b6b'); } }
    else if (npc.state === 'out') { npc.downT += dt; if (npc.downT > 5) { npc.state = 'away'; g.visible = false; standBack(npc.human); npc.bubble.visible = false; } }
    else if (npc.state === 'leave') { if (walkAlong(g, npc.path, walkSpeed * 1.1, dt)) { npc.state = 'away'; g.visible = false; } animateHuman(npc.human, dt, 'walk', walkSpeed, null); }
  }

  // ── The line: while someone is at the window, the next customers queue along the rope instead of waiting outside ──
  var LINE_Z = 7.0, LINE_X = [0, -0.7, -1.4, -2.1, -2.8, -3.5], LINE_MAX = 4;   /* two spare places past the four customers, for anyone only pretending to queue */   /* along the rope toward the left wall: the front door's leaf swings in along x -0.7 behind it, and the guard stands to the right */
  var LINE_HOLD = { x: 0.25, z: 9.8 }, LINE_CHECK = { x: 0.5, z: 7.9 }, LINE_WAIT = 90;   /* outside the door while the guard is busy, his ID spot, seconds of patience (counted in played frames, so a pause costs nothing) */
  var lineup = [], lineSeq = 0;   // bodies in the queue, plus any walking back out (state 'leave'); places go in the order people get past the door (seq)
  function lineWaiting(m) { return !!m.c && m.state !== 'leave' && m.state !== 'down' && m.state !== 'out' && m.state !== 'up'; }
  function lineShown() { return lineCount() + robbers.filter(function (r) { return r.state === 'case' && (r.pre === 'queue' || r.pre === 'stepup'); }).length; }   /* what you can see standing there, not only the real customers */
  function lineCount() { return lineup.filter(lineWaiting).length; }
  function lineAtDoor() { return lineup.some(function (m) { return m.state === 'enter' || m.state === 'hold' || m.state === 'tocheck' || m.state === 'check'; }) || robbers.some(function (r) { return r.state === 'case' && !(r.delay > 0) && (r.pre === 'walk' || r.pre === 'hold' || r.pre === 'tocheck' || r.pre === 'check'); }); }
  function windowFree() { return !S.customer && (npc.state === 'away' || npc.state === 'leave'); }
  function robberAtWindow() { return robbers.some(function (r) { return r.state === 'case' && r.pre === 'stepup'; }); }
  function doorCheckBusy() { return guard.state === 'check' || npc.state === 'enter' || npc.state === 'check' || lineup.some(function (m) { return m.state === 'tocheck' || m.state === 'check'; }) || robbers.some(function (r) { return r.state === 'case' && (r.pre === 'tocheck' || r.pre === 'check'); }); }
  function lineMult() { return S.upgrades.lounge2 ? 2 : S.upgrades.lobby ? 1.5 : 1; }
  function strangerLook(bag, man) {   /* an ordinary passer-by; robbers dress exactly like this, so a stranger is not automatically trouble */
    return { skin: pick(SKINS), hair: pick(HAIRS), shirt: pick(SHIRTS), pants: pick(PANTS), hairStyle: pick(man ? ['short', 'short', 'afro', 'long'] : ['short', 'short', 'long', 'bun', 'ponytail', 'afro']), hat: pick([null, null, null, 'cap', 'beanie']), capColor: pick([0x222222, 0x2a3a5a, 0x7a2a2a, 0x3a5a3a, 0xc9a45a]), glasses: Math.random() < 0.2, beard: !!man && Math.random() < 0.3, coat: Math.random() < 0.3 ? pick([0x3a3a3a, 0x5a4a3a, 0x2a3a4a, 0x6a2a2a, 0x3a4a3a]) : 0, longSleeve: Math.random() < 0.6, backpack: !!bag || Math.random() < 0.2, backpackColor: pick([0x15171a, 0x2a4a6a, 0x6a3a2a]), mood: 'neutral' };
  }
  var NEW_FACES = ['Dana', 'Marco', 'Priya', 'Kev', 'Lou', 'Tomasz', 'Ines', 'Jamal', 'Rosa', 'Theo', 'Mei', 'Callum', 'Nia', 'Ollie', 'Sven', 'Amara'];
  function newFace() {   /* a walk-in nobody knows yet */
    var here = [S.customer ? S.customer.who : ''].concat(lineup.map(function (m) { return m.who; })), free = NEW_FACES.filter(function (n) { return here.indexOf(n) < 0; });
    return { who: pick(free.length ? free : NEW_FACES), a: pick(['🙂', '🧑', '👩', '👨', '🧔', '👱']), c: 0x9aa4ad, look: strangerLook(false, false) };
  }
  function pickRegular() {   /* a regular who is not in the shop already, while there is one */
    var here = [S.customer ? S.customer.who : ''].concat(lineup.map(function (m) { return m.who; }), loungers.map(function (l) { return l.who; }));
    var free = CUSTOMERS.filter(function (c) { return here.indexOf(c.who) < 0; }); return pick(free.length ? free : CUSTOMERS);
  }
  // someone turns up: straight to the window when it is free and nobody is queueing, otherwise to the back of the line
  function customerArrives(premium) {
    if (!S.customer && !lineCount() && !robberAtWindow()) { if (npc.human && npc.state === 'leave') npcHandOff(); spawnCustomer(premium); return true; }   /* the last one still walking out no longer holds the door */
    if (lineCount() >= LINE_MAX || (heist.on && heist.masked)) return false;
    lineJoin(premium); return true;
  }
  function lineJoin(premium) {
    var c = newCustomer(premium), side = Math.random() < 0.5 ? 1 : -1, outside = lineup.filter(function (m) { return m.state === 'enter' || m.state === 'hold'; }).length;
    var g = new THREE.Group(), h = makeHuman(CAST[c.who] || c.look || {}); g.add(h); world.group.add(g); g.userData.gated = true;
    var bubble = sprite(textTex(['…'], 512, 160, { size: 44 }), 1.5, 0.47, 0, 2.25, 0, g); bubble.visible = false;
    var m = { id: 'Q' + now() + randi(0, 999), c: c, who: c.who, g: g, h: h, bubble: bubble, side: side, state: 'enter', slot: -1, t: 0, waited: 0, grumbled: false, fast: false, sayT: null,
      path: [{ x: 6.5 * side, z: 11.6 }, { x: 0.6 * side, z: 11.4 }, { x: LINE_HOLD.x, z: LINE_HOLD.z + outside * 0.65 }] };   /* a second arrival while the guard is busy waits a step further out */
    g.position.set(m.path[0].x, 0, m.path[0].z + 0.01); lineup.push(m);
    var qhb = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.1, 0.5), MAT.none); qhb.position.y = 1.25; qhb.userData.queuer = m.id; h.add(qhb); interactable(qhb, { kind: 'queuer', qid: m.id });
    if (premium) { logEvent('🎩 A connoisseur (' + c.who + ') walked in and joined the line (' + lineShown() + ' waiting)', 'rare'); toast('🎩 Connoisseur joined the line', 'rare'); }
    else logEvent('🚪 ' + c.who + ' walked in and joined the line (' + lineShown() + ' waiting)', '');
    hud();
  }
  function lineDropHit(m) { if (!m.id) return; m.h.children.filter(function (ch) { return ch.userData.queuer; }).forEach(function (ch) { m.h.remove(ch); }); world.interact = world.interact.filter(function (x) { return x.userData.queuer !== m.id; }); }
  function lineChat(m) { if (!lineWaiting(m)) return; lineSay(m, pick([custLine(m.who, 'hi'), 'Just waiting my turn.', 'Busy in here today.', 'Is it always this slow?']), '#e8f1ea', 2200); }
  function lineSay(m, text, color, ms) {
    var ob = m.bubble.material.map; m.bubble.material.map = textTex([text], 512, 160, { size: 44, titleColor: color || '#e8f1ea' }); m.bubble.material.needsUpdate = true; if (ob) ob.dispose(); m.bubble.visible = true;
    clearTimeout(m.sayT); m.sayT = setTimeout(function () { m.bubble.visible = false; }, ms || 2400);
  }
  // the way to a place in the row: shuffle up along it, or come round the front on the walkway and step back into place (clear of the door leaf)
  function lineRoute(p, i) {
    var x = LINE_X[i];
    if (i === 0 || (Math.abs(p.z - LINE_Z) < 0.25 && p.x < 0.3)) return [{ x: x, z: LINE_Z }];
    return (p.z > 6.8 ? [{ x: 0.45, z: 6.55 }] : []).concat([{ x: x, z: 6.55 }, { x: x, z: LINE_Z }]);
  }
  function lineLeave(m, mood, text, color, fast) {
    if (m.state === 'leave') return;
    lineDropHit(m); m.state = 'leave'; m.slot = -1; m.fast = !!fast; m.h.userData.setMood(mood || 'sad'); lineSay(m, text || custLine(m.who, 'bye'), color || '#ff6b6b', 4000);
    m.path = exitPath(m.g.position, m.side); hud();   /* round the rope, not through the gate or the line */
  }
  function lineHit(m) {   // the bat on someone in the queue: the same as at the window
    if (m.state === 'out') return;
    if (m.state === 'down') { m.state = 'out'; m.t = 0; S.rep = Math.max(0, S.rep - 25); logEvent('🚑 ' + m.who + ' is out cold. An ambulance took them away.', 'bad'); policeFine('You put ' + m.who + ' in hospital'); return; }
    m.state = 'down'; m.t = 0; m.slot = -1; lieDown(m.h); m.h.userData.setMood('sad'); lineSay(m, custLine(m.who, 'hurt'), '#ff6b6b'); S.rep = Math.max(0, S.rep - 8);
    logEvent('👊 You put ' + m.who + ' on the floor' + (m.c ? ' while they waited in line' : '') + ' (rep -8)', 'bad'); toast('👊 ' + m.who + ' goes down (rep -8)', 'bad'); hud();
  }
  function lineFlee() {   // a robbery kicks off: the queue empties
    var n = 0; lineup.forEach(function (m) { if (lineWaiting(m)) { n++; lineLeave(m, 'sad', pick(['I\'m out of here.', 'Nope. Not today.', 'Run!']), '#ff6b6b', true); } });
    if (n) logEvent('🏃 ' + n + (n === 1 ? ' customer' : ' customers') + ' in the line ran for the door', 'bad');
  }
  function lineClear() { lineup.forEach(function (m) { lineDropHit(m); world.group.remove(m.g); disposeTree(m.g); clearTimeout(m.sayT); }); lineup.length = 0; hud(); }
  // the served customer is still walking out: their body finishes the walk on its own so the window can take the next one now
  function npcHandOff() {
    var h = npc.human; h.children.filter(function (ch) { return ch.userData.npc; }).forEach(function (ch) { h.remove(ch); });
    world.interact = world.interact.filter(function (x) { return !x.userData.npc; });
    var g = new THREE.Group(); g.position.copy(npc.g.position); g.rotation.y = npc.g.rotation.y; npc.g.remove(h); g.add(h); world.group.add(g); g.userData.gated = true;
    var bubble = sprite(npc.bubble.material.map, 1, 1, 0, 0, 0, g); bubble.scale.copy(npc.bubble.scale); bubble.position.copy(npc.bubble.position); bubble.visible = npc.bubble.visible;   /* the goodbye line walks out with them */
    npc.bubble.material.map = textTex(['…'], 512, 200, { size: 40 }); npc.bubble.material.needsUpdate = true; npc.bubble.visible = false;
    lineup.push({ c: null, who: npc.who, g: g, h: h, bubble: bubble, side: 1, state: 'leave', slot: -1, t: 0, waited: 0, fast: false, sayT: null, path: npc.path });
    npc.human = null; npc.state = 'away'; npc.g.visible = false;
  }
  // the head of the line steps up: the body moves over to the window customer and the order becomes S.customer
  function linePromote(m) {
    if (npc.human && npc.state === 'leave') npcHandOff();
    else if (npc.human) { npc.g.remove(npc.human); disposeTree(npc.human); npc.human = null; }
    world.interact = world.interact.filter(function (x) { return !x.userData.npc; });
    lineDropHit(m); lineup.splice(lineup.indexOf(m), 1); clearTimeout(m.sayT);
    var c = m.c, h = m.h; m.g.remove(h); npc.g.position.set(m.g.position.x, 0, m.g.position.z); npc.g.rotation.y = m.g.rotation.y; world.group.remove(m.g); disposeTree(m.g);
    npc.human = h; npc.g.add(h); npc.g.visible = true; npc.who = c.who; npc.cust = c;
    var hitBox = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.1, 0.5), MAT.none); hitBox.position.y = 1.25; hitBox.userData.npc = true; h.add(hitBox); interactable(hitBox, { kind: 'customer', label: c.who, prompt: 'Serve' });
    h.userData.impatient = false; h.userData.setMood(CAST[c.who] && CAST[c.who].mood || 'neutral');
    c.fromLine = true; c.spawnedAt = now(); c.until = now() + (c.premium ? 60000 : 45000) * lineMult(); if (c.id && !c.id.seen) c.idPending = true;   /* nobody checked the card at the door: they hand it over at the window */
    S.customer = c; npc.setBubble(c); npc.bubble.visible = false; npc.state = 'towindow'; npc.path = [{ x: 0, z: 5.25 }]; hud();
  }
  function updateLineup(dt) {
    var checking = doorCheckBusy(), gone = [];
    lineup.forEach(function (m) {
      var P = m.h.userData.parts, sp = m.h.userData.spec.hunch ? 0.9 : 1.5;
      if (lineWaiting(m) && m.state !== 'check' && !breakWait()) { m.waited += dt; if (m.waited > LINE_WAIT * lineMult()) { S.rep = Math.max(0, S.rep - 1); logEvent('🚶 ' + m.who + ' got tired of the line and left (rep -1)', 'bad'); toast('🚶 ' + m.who + ' gave up on the line (rep -1)', 'bad'); lineLeave(m, 'angry'); } }
      if (m.state === 'enter') { if (walkAlong(m.g, m.path, sp, dt)) m.state = 'hold'; animateHuman(m.h, dt, 'walk', sp, null); }
      else if (m.state === 'hold') {
        if (!guardOnDuty()) { m.state = 'toslot'; m.slot = -1; m.seq = ++lineSeq; }   /* nobody on the door: the card comes to the window with them */
        else if (!checking) { checking = true; m.state = 'tocheck'; m.path = [{ x: LINE_CHECK.x, z: LINE_CHECK.z }]; }
        animateHuman(m.h, dt, 'idle', 0, guard.h ? guard.h.position : null);
      }
      else if (m.state === 'tocheck') { if (walkAlong(m.g, m.path, sp, dt)) { if (guardOnDuty()) { m.state = 'check'; m.t = 0; m.g.rotation.y = Math.PI / 2; guard.startCheck(m.g); } else { m.state = 'toslot'; m.slot = -1; m.seq = ++lineSeq; } } animateHuman(m.h, dt, 'walk', sp, null); }
      else if (m.state === 'check') { m.t += dt; animateHuman(m.h, dt, 'idle', 0, guard.h ? guard.h.position : player.pos); P.lArm.rotation.x = -1.1; P.lArm.rotation.z = 0.2; if (m.t > 2.6) { P.lArm.rotation.z = 0; if (!m.c.id || guardVerdict(m.c, m)) { m.state = 'toslot'; m.slot = -1; m.seq = ++lineSeq; } } }
      else if (m.state === 'toslot') { if (m.slot >= 0 && walkAlong(m.g, m.path, sp, dt)) m.state = 'line'; animateHuman(m.h, dt, m.slot >= 0 ? 'walk' : 'idle', sp, null); }
      else if (m.state === 'line') {
        turnTo(m, m.slot === 0 ? Math.PI : Math.PI / 2, dt);   // the head of the line faces the window, the rest face the back of the one in front
        if (!m.grumbled && m.waited > LINE_WAIT * lineMult() - 20) { m.grumbled = true; m.h.userData.setMood('angry'); lineSay(m, custLine(m.who, 'queue'), '#ffc857', 2600); }
        animateHuman(m.h, dt, m.grumbled ? 'wait' : 'idle', 0, m.slot === 0 ? player.pos : null);
      }
      else if (m.state === 'leave') { if (walkAlong(m.g, m.path, sp * (m.fast ? 1.8 : 1.1), dt)) gone.push(m); else animateHuman(m.h, dt, 'walk', sp * (m.fast ? 1.6 : 1), null); }
      else if (m.state === 'down') { m.t += dt; if (m.t > 4) { standBack(m.h); m.state = 'up'; lineLeave(m, 'angry', custLine(m.who, 'angry'), '#ff6b6b'); } }
      else if (m.state === 'out') { m.t += dt; if (m.t > 5) gone.push(m); }
    });
    gone.forEach(function (m) { lineDropHit(m); world.group.remove(m.g); disposeTree(m.g); clearTimeout(m.sayT); lineup.splice(lineup.indexOf(m), 1); });
    // everyone past the door takes the next place along the rope, in join order, and shuffles up when someone ahead goes
    lineup.filter(function (m) { return m.c && (m.state === 'toslot' || m.state === 'line'); }).concat(robbers.filter(function (r) { return r.state === 'case' && r.pre === 'queue'; })).sort(function (a, b) { return a.seq - b.seq; }).forEach(function (m, k) { if (m.slot !== k) { m.slot = k; if (m.c) m.state = 'toslot'; m.path = lineRoute(m.g.position, k); } });   /* a robber posing as a customer holds a place like anyone else */
    // the window is free: the head of the line steps up
    if (windowFree() && !(heist.on && heist.masked) && !robberAtWindow()) { var head = lineup.filter(function (m) { return m.c && m.state === 'line' && m.slot === 0; })[0]; if (head) linePromote(head); }
  }

