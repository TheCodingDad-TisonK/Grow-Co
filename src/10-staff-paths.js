//@ staff waypoints, the crew and ground-floor pathfinding
  // ── Staff: waypoints through the doorways, a hired assistant, and orders for the guard ──
  var WP = { hall: { x: 0, z: 1.2 }, counter: { x: -0.3, z: 3.0 }, growDoor: { x: -6.5, z: -2 }, dryDoor: { x: 6.5, z: -2 }, annexDoor: { x: 3, z: -9 }, annex: { x: 4, z: -10.6 }, officeDoor: { x: -4, z: 1.0 }, procDoor: { x: 4, z: 1.0 }, staffIn: { x: 10, z: 3.0 }, staffDoor: { x: 10, z: 4.6 }, lobby: { x: 7.5, z: 6.2 }, post: { x: 1.7, z: 7.3 } };
  var ROOM_DOORS = { grow: ['growDoor'], dry: ['dryDoor'], annex: ['dryDoor', 'annexDoor'], security: ['dryDoor', 'annexDoor'], office: ['officeDoor'], proc: ['procDoor'], lobby: ['procDoor', 'staffIn', 'staffDoor'], hall: [] };
  // ── Ground-floor pathfinding: A* over a 25 cm grid built from the obstacle boxes, then string-pulled so staff cut clean corners but never walls ──
  var NAV = { cell: 0.2, x0: -13, z0: -19, w: 0, h: 0, grid: null, raw: null, key: '', pad: 0.2 };   /* grid: locked doors are walls. raw: every door is open, which is how a man with a crowbar sees the place */
  function navKey() { var k = world.obstacles.length, s = 0; for (var i = 0; i < world.obstacles.length; i++) { var o = world.obstacles[i]; if (o.tag === 'guard') continue; s += o.x1 * 3.1 + o.z2 * 1.7; if (o.doorId) { var dk = doorById[o.doorId]; if (dk && dk.locked) s += 91.7 + (staffKey(dk.id) ? 0 : 13.3); } if (o.tag === 'staffdoor' && staffDoorLocked()) s += 57.3 + (staffKey('staff') ? 0 : 11.1); }   /* doors count now, and locking one changes the key, so the grid is rebuilt the moment it matters */
    return k + ':' + s.toFixed(2); }
  function navBuild() {
    var cs = NAV.cell; NAV.w = Math.ceil(26 / cs) + 1; NAV.h = Math.ceil(33 / cs) + 1;
    var grid = new Uint8Array(NAV.w * NAV.h), raw = new Uint8Array(NAV.w * NAV.h), staff = new Uint8Array(NAV.w * NAV.h), pad = NAV.pad;
    world.obstacles.forEach(function (o) {
      if (((o.floorLevel || 0) !== 0 && o.floorLevel !== 'any') || o.tag === 'guard') return;   /* ground floor only: the roof beds (level 2) once walled off the hall */
      var isDoor = !!o.doorId || o.tag === 'staffdoor' || o.tag === 'frontdoor';
      var dd = o.doorId ? doorById[o.doorId] : null;
      var sdl = o.tag === 'staffdoor' && staffDoorLocked();
      var blocks = !isDoor || !!(dd && dd.locked) || sdl;   /* a shut door you can open is not a wall; a locked one is */
      var staffBlocks = !isDoor || !!(dd && dd.locked && !staffKey(dd.id)) || (sdl && !staffKey('staff'));   /* unless your crew hold a key to it */
      var x1 = Math.max(0, Math.round((o.x1 - pad - NAV.x0) / cs)), x2 = Math.min(NAV.w - 1, Math.round((o.x2 + pad - NAV.x0) / cs));
      var z1 = Math.max(0, Math.round((o.z1 - pad - NAV.z0) / cs)), z2 = Math.min(NAV.h - 1, Math.round((o.z2 + pad - NAV.z0) / cs));
      for (var cz = z1; cz <= z2; cz++) for (var cx = x1; cx <= x2; cx++) { var ix = cz * NAV.w + cx; if (blocks) grid[ix] = 1; if (staffBlocks) staff[ix] = 1; if (!isDoor) raw[ix] = 1; }
    });
    NAV.grid = grid; NAV.raw = raw; NAV.staff = staff; NAV.key = navKey();
  }
  var navG = null;   /* which of the two grids the walk being planned right now is using */
  function navFree(cx, cz) { return cx >= 0 && cz >= 0 && cx < NAV.w && cz < NAV.h && !(navG || NAV.grid)[cz * NAV.w + cx]; }
  function navFreeAt(x, z) { return navFree(Math.round((x - NAV.x0) / NAV.cell), Math.round((z - NAV.z0) / NAV.cell)); }
  function navNearest(cx, cz) { if (navFree(cx, cz)) return [cx, cz]; for (var r = 1; r < 10; r++) for (var dz = -r; dz <= r; dz++) for (var dx = -r; dx <= r; dx++) if (Math.max(Math.abs(dx), Math.abs(dz)) === r && navFree(cx + dx, cz + dz)) return [cx + dx, cz + dz]; return null; }
  function navLos(a, b) { var d = Math.hypot(b.x - a.x, b.z - a.z), n = Math.ceil(d / 0.1); for (var i = 0; i <= n; i++) { var t = n ? i / n : 0; if (!navFreeAt(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false; } return true; }
  function navPath(from, to, thruDoors) {
    if (!NAV.grid || navKey() !== NAV.key) navBuild();
    navG = thruDoors === 'staff' ? NAV.staff : thruDoors ? NAV.raw : NAV.grid;   /* 'staff': locked doors they hold a key for are open to them */
    var W = NAV.w, H = NAV.h, cs = NAV.cell;
    var s = navNearest(Math.round((from.x - NAV.x0) / cs), Math.round((from.z - NAV.z0) / cs)), t = navNearest(Math.round((to.x - NAV.x0) / cs), Math.round((to.z - NAV.z0) / cs));
    if (!s || !t) return [{ x: to.x, z: to.z }];
    var si = s[1] * W + s[0], ti = t[1] * W + t[0]; if (si === ti) return [{ x: to.x, z: to.z }];
    var gs = new Float32Array(W * H); gs.fill(1e9); var came = new Int32Array(W * H); came.fill(-1); var closed = new Uint8Array(W * H);
    var heap = [], hf = [];   // binary heap of cell indices keyed by f
    function push(i, f) { heap.push(i); hf.push(f); var k = heap.length - 1; while (k > 0) { var p = (k - 1) >> 1; if (hf[p] <= hf[k]) break; var ti2 = heap[p]; heap[p] = heap[k]; heap[k] = ti2; var tf = hf[p]; hf[p] = hf[k]; hf[k] = tf; k = p; } }
    function pop() { var top = heap[0]; var li = heap.pop(), lf = hf.pop(); if (heap.length) { heap[0] = li; hf[0] = lf; var k = 0; for (;;) { var a = k * 2 + 1, b = a + 1, m = k; if (a < heap.length && hf[a] < hf[m]) m = a; if (b < heap.length && hf[b] < hf[m]) m = b; if (m === k) break; var ti3 = heap[m]; heap[m] = heap[k]; heap[k] = ti3; var tf2 = hf[m]; hf[m] = hf[k]; hf[k] = tf2; k = m; } } return top; }
    var tx = t[0], tz = t[1]; gs[si] = 0; push(si, Math.hypot(s[0] - tx, s[1] - tz)); var found = false, iter = 0, best = -1, bestH = 1e9;
    while (heap.length && iter++ < 60000) {
      var cur = pop(); if (closed[cur]) continue; closed[cur] = 1; if (cur === ti) { found = true; break; }
      var cx = cur % W, cz = (cur / W) | 0;
      var ch = Math.hypot(cx - tx, cz - tz); if (ch < bestH) { bestH = ch; best = cur; }
      for (var dz = -1; dz <= 1; dz++) for (var dx = -1; dx <= 1; dx++) { if (!dx && !dz) continue; var nx = cx + dx, nz = cz + dz; if (!navFree(nx, nz)) continue; if (dx && dz && (!navFree(cx + dx, cz) || !navFree(cx, cz + dz))) continue; var ni = nz * W + nx; if (closed[ni]) continue; var ng = gs[cur] + (dx && dz ? 1.4142 : 1); if (ng < gs[ni]) { gs[ni] = ng; came[ni] = cur; push(ni, ng + Math.hypot(nx - tx, nz - tz)); } }
    }
    var cutShort = !found; if (!found) { if (best < 0) return [{ x: from.x, z: from.z }]; ti = best; }   /* no way through: go as far as there is a way, rather than straight through the wall */
    var cells = []; for (var c = ti; c !== -1; c = came[c]) cells.push({ x: NAV.x0 + (c % W) * cs, z: NAV.z0 + ((c / W) | 0) * cs }); cells.reverse();
    // string pulling: keep only the corners that need to be there
    var out = [], anchor = { x: from.x, z: from.z }, k2 = 0;
    while (k2 < cells.length) { var far = k2; for (var j = cells.length - 1; j > k2; j--) { if (navLos(anchor, cells[j])) { far = j; break; } } if (far === k2 && k2 < cells.length - 1 && !navLos(anchor, cells[k2])) far = k2; out.push(cells[far]); anchor = cells[far]; k2 = far + 1; }
    var last = out[out.length - 1]; if (last && Math.hypot(last.x - to.x, last.z - to.z) < 0.6 && navLos(last, to)) out[out.length - 1] = { x: to.x, z: to.z }; else if (!cutShort) out.push({ x: to.x, z: to.z });
    return out;
  }
  function routeTo(from, x, z, thruDoors) { return navPath(from, { x: x, z: z }, thruDoors); }
  // The door somebody has walked up to, if there is one. People open the ones they can; a robber
  // gets a locked one back so he can do something about it.
  function doorAt(pos, floorLevel, reach) {
    var best = null, bd = reach || 1.35;
    for (var i = 0; i < DOORS.length; i++) {
      var d = DOORS[i]; if (d.open || (d.floor || 0) !== (floorLevel || 0)) continue;
      var dist = Math.hypot(d.x - pos.x, d.z - pos.z); if (dist < bd) { bd = dist; best = d; }
    }
    return best;
  }
  function npcDoors(g, floorLevel, keyholder) {   // walk up to a door you can open and you open it; staff with a key to a locked one let themselves through
    var d = doorAt(g.position, floorLevel); if (!d) return null;
    if (d.locked) { if (keyholder && staffKey(d.id)) { staffPass(d); return null; } return d; }
    setDoor(d.id, true); d.auto = 1; d.autoT = 0; return null;
  }
  var WORKER_HIRE = 400, WORKER_WAGE = COST.payRate, CREW_MAX = 3;
  // who turns up when you hire. Each hire costs more than the last and draws the same wage.
  var CREW_LOOK = [
    { name: 'Jo',   skin: 0xf1c27d, hair: 0x5a3a1a, hairStyle: 'ponytail', shirt: 0x2f6b4a, at: [-1.5, 1.2] },
    { name: 'Mika', skin: 0xc68642, hair: 0x1c1c22, shirt: 0x2f5b8a, at: [-2.5, 1.5] },
    { name: 'Sam',  skin: 0xe0ac7e, hair: 0x8a6a3a, shirt: 0x8a5a2f, at: [-0.5, 1.6] }
  ];
  function crewHireCost() { return Math.round(WORKER_HIRE * Math.pow(1.6, crewList().length)); }
  function crewList() {   // the saved crew, migrating the single assistant that used to live on a boolean
    if (!S.staff) S.staff = {};
    if (!Array.isArray(S.staff.crew)) {
      S.staff.crew = S.staff.worker ? [{ look: 0, task: S.staff.task || 'idle' }] : [];
    }
    if (S.staff.crew.length > CREW_MAX) S.staff.crew.length = CREW_MAX;   /* keep the same array: callers hold on to it */
    S.staff.crew.forEach(function (c, i) { if (typeof c.look !== 'number') c.look = i; if (!c.task) c.task = 'idle'; });
    S.staff.worker = S.staff.crew.length > 0;   /* a few places still ask the old question */
    return S.staff.crew;
  }
  function crewName(i) { var c = crewList()[i]; return c ? CREW_LOOK[c.look % CREW_LOOK.length].name : 'nobody'; }
  function crewOnFloor() { return crewList().filter(function (c) { return !c.off; }).length; }
  function crewShift(i, off) {   // home for the day, or back in. Off the floor is off the payroll.
    var list = crewList(), c = list[i]; if (!c) return;
    if (off === undefined) off = !c.off;
    c.off = !!off; crewSync();
    sfx(off ? 'door' : 'ok');
    toast((off ? '🏠 ' : '🧑‍🔧 ') + crewName(i) + (off ? ' has gone home for the day' : ' is back on the floor'), off ? '' : 'good');
    logEvent((off ? '🏠 Sent ' : '🧑‍🔧 Called ') + crewName(i) + (off ? ' home' : ' back in'), '');
    save(); ui.refreshOpen();
  }
  var WORKER_TASKS = [['serve', '🛎️ Serve the window'], ['restock', '📦 Restock the supply rack and machines'], ['clean', '🧹 Sweep the floors'], ['water', '💧 Tend the plants'], ['idle', '☕ Take a break']];
  var GUARD_TASKS = [['door', '🪪 Watch the door'], ['patrol', '🚶 Patrol the lobby'], ['sweep', '🧹 Sweep the lobby'], ['restock', '📦 Restock the counter display']];
  function taskWords(label) { return String(label).replace(/^[^A-Za-z]+/, ''); }   /* the words of a task label without its leading icon, however many code units the icon takes */
  function workerTaskLabel(i) { var c = crewList()[i === undefined ? (worker ? worker.idx : 0) : i]; var t = WORKER_TASKS.filter(function (x) { return x[0] === ((c && c.task) || 'idle'); })[0]; return t ? taskWords(t[1]) : 'Take a break'; }
  function guardTaskLabel() { var t = GUARD_TASKS.filter(function (x) { return x[0] === (S.staff.guardTask || 'door'); })[0]; return t ? taskWords(t[1]) : 'Watch the door'; }
  // how each of the crew talks: Jo is cheerful and calls you boss, Mika keeps it short, Sam chats and calls you mate
  var CREW_VOICE = [
    { onit: 'On it, boss: {x}.', brk: 'Ooh, a break. Cheers, boss.', out: 'We\'re out of {x}, boss.', part: 'Here\'s part of it. We\'re out of {x}, boss.', served: 'There you go.', locked: 'That one\'s locked, boss.', clean: 'Floor\'s clean, boss.', empty: 'Back room\'s empty, boss.', plants: 'Plants are all happy.', checkId: 'Check their ID first, boss.', nobody: 'Nobody at the window.', nothing: 'Nothing for me right now, boss.', shut: 'Window\'s shut, boss. I\'ll wait.', onBreak: 'On a break with you, boss.', chat: ['On it, boss.', 'All good here.', 'Need me somewhere?'] },
    { onit: 'Right: {x}.', brk: 'Break. Good.', out: 'Out of {x}.', part: 'Part of it. Out of {x}.', served: 'Here.', locked: 'Locked.', clean: 'Floor\'s clean.', empty: 'Back room\'s empty.', plants: 'Plants are fine.', checkId: 'Their ID. Your call.', nobody: 'Nobody there.', nothing: 'Nothing to do.', shut: 'Window\'s shut.', onBreak: 'Break. Good.', chat: ['Yep.', 'Fine.', 'What do you need?'] },
    { onit: 'No bother, mate: {x}.', brk: 'A break? Don\'t mind if I do, mate.', out: 'We\'re clean out of {x}, mate.', part: 'Got you some of it, mate, but we\'re out of {x}.', served: 'There you go, enjoy that.', locked: 'That one\'s locked, mate, and I\'ve no key for it.', clean: 'Floor\'s spotless, mate.', empty: 'Back room\'s bare, mate.', plants: 'Plants are happy as anything.', checkId: 'Their ID\'s your call, mate.', nobody: 'Nobody at the window, mate.', nothing: 'Nothing on, mate. What d\'you need?', shut: 'Window\'s shut, mate. Kettle on?', onBreak: 'Break time, is it? Lovely.', chat: ['All sweet here, mate.', 'Busy one, eh?', 'Need me anywhere, mate?'] }
  ];
  function crewLine(key, x) { var v = CREW_VOICE[((worker && worker.look) || 0) % CREW_VOICE.length]; var s = v[key]; if (Array.isArray(s)) s = pick(s); return String(s).replace('{x}', x === undefined ? '' : x); }
  var WORKER_NONE = { g: null, h: null, state: 'idle', path: [], t: 0, job: null, bubble: null, sayT: 0, idleT: 0, coolT: 0, hasBroom: false, idx: 0 };
  var crew = [];              // one runtime record per hired assistant
  var worker = WORKER_NONE;   // the one being updated right now: every worker helper reads this
  function buildWorker(rec) {
    if (!rec || rec.g) return;
    var L = CREW_LOOK[rec.look % CREW_LOOK.length];
    var g = new THREE.Group(); g.position.set(L.at[0], 0, L.at[1]); world.group.add(g); rec.g = g;
    rec.h = makeHuman({ skin: L.skin, hair: L.hair, hairStyle: L.hairStyle, shirt: L.shirt, pants: 0x2a2d33, shoes: 0x333333, watch: true, logo: '🌿', mood: 'happy' }); g.add(rec.h);
    var badge = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.06), new THREE.MeshBasicMaterial({ map: textTex(['STAFF'], 160, 60, { size: 30, bg: '#6fdc8c', color: '#062010', line: 'rgba(0,0,0,0)' }) })); badge.position.set(0.1, 0.5, 0.148); rec.h.userData.parts.torso.add(badge);
    rec.bubble = sprite(textTex(['…'], 512, 160, { size: 44 }), 1.4, 0.44, 0, 2.25, 0, g); rec.bubble.visible = false;
    var hb = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.1, 0.5), MAT.none); hb.position.y = 1.25; rec.h.add(hb); interactable(hb, { kind: 'worker', idx: rec.idx });
  }
  function removeWorker(rec) {
    rec = rec || worker; carryBack(rec, true); if (!rec.g) return;   /* a crate in their arms goes back into storage; the caller settles the saved record */
    rec.hasBroom = false; rec.broomMesh = null; syncBroom();
    world.group.remove(rec.g); disposeTree(rec.g);
    world.interact = world.interact.filter(function (m) { var d = m.userData.interact; return !(d && d.kind === 'worker' && (d.idx || 0) === (rec.idx || 0)); });   /* this one's hit box, not everybody's */
    rec.g = null; rec.h = null; rec.bubble = null; rec.state = 'idle'; rec.job = null; rec.path = [];
  }
  function workerSay(text, color, ms) { if (!worker || !worker.bubble) return; var ob = worker.bubble.material.map; worker.bubble.material.map = textTex([text], 512, 160, { size: 44, titleColor: color || '#e8f1ea' }); worker.bubble.material.needsUpdate = true; if (ob) ob.dispose(); worker.bubble.visible = true; clearTimeout(worker.sayT); worker.sayT = setTimeout(function () { if (worker.bubble) worker.bubble.visible = false; }, ms || 2400); }
  function crewSync() {   // runtime records follow the saved crew: build the new ones, clear out the gone ones
    var list = crewList();
    crew.filter(function (r) { return r.idx >= list.length; }).forEach(function (r) { removeWorker(r); });
    crew = crew.filter(function (r) { return r.idx < list.length; });
    list.forEach(function (c, i) {
      var r = crew.filter(function (x) { return x.idx === i; })[0];
      if (!r) { r = { idx: i, look: c.look, g: null, h: null, state: 'idle', path: [], t: 0, job: null, bubble: null, sayT: 0, idleT: 0, coolT: 0, hasBroom: false }; crew.push(r); if (c.carry) { S.storage[c.carry.item] = (S.storage[c.carry.item] || 0) + c.carry.n; syncStorage(); } c.carry = null; }   /* a crate that was in their arms when the game was saved is back on the racking */
      r.look = c.look;
      if (c.off) { removeWorker(r); c.carry = null; r.job = null; r.path = []; r.state = 'idle'; } else buildWorker(r);
    });
    crew.sort(function (a, b) { return a.idx - b.idx; });
    worker = crew[0] || WORKER_NONE;
  }
  function hireWorker() {
    var list = crewList();
    if (list.length >= CREW_MAX) { toast('That\'s a full crew already', 'bad'); return; }
    var cost = crewHireCost(); if (!spend(cost)) return;
    var used = list.map(function (c) { return c.look; });
    var look = 0; for (var i = 0; i < CREW_LOOK.length; i++) if (used.indexOf(i) < 0) { look = i; break; }
    list.push({ look: look, task: 'idle' }); S.staff.worker = true;
    crewSync(); sfx('rare');
    var nm = CREW_LOOK[look].name;
    toast('🤝 ' + nm + ' starts today. Shift+E on them to give orders.', 'good');
    logEvent('🤝 Hired ' + nm + ' for ' + money(cost), 'good'); save(); ui.refreshOpen();
  }
  function fireWorker(i) {
    var list = crewList(); i = (i === undefined || i < 0) ? list.length - 1 : i;
    if (!list[i]) return; var nm = crewName(i);
    list.splice(i, 1); S.staff.worker = list.length > 0;
    crewSync();
    toast('👋 ' + nm + ' has gone home for good', ''); logEvent('👋 Let ' + nm + ' go', ''); save(); ui.refreshOpen();
  }
  function payWages(offline) {
    var list = crewList(); if (!list.length) return;
    for (var i = list.length - 1; i >= 0; i--) {
      if (list[i].off) { logEvent('🏠 ' + crewName(i) + ' was off, no wage', ''); continue; }   /* sent home means sent home: no work, no pay, no quitting over it */
      if (S.bank + S.vault + S.till >= WORKER_WAGE) { drawFunds(WORKER_WAGE); logEvent('💸 Paid ' + crewName(i) + ' ' + money(WORKER_WAGE), ''); }
      else {
        var nm = crewName(i); list.splice(i, 1);
        if (!offline) { toast('👋 ' + nm + ' quit. There wasn\'t enough for the wage.', 'bad'); }
        logEvent('👋 ' + nm + ' walked out: there wasn\'t enough for the wage', 'bad');
      }
    }
    S.staff.worker = list.length > 0; crewSync();
  }

  function workerTask(t, i) { var list = crewList(); i = i || 0; if (!list[i]) return; list[i].task = t; var r = crew.filter(function (x) { return x.idx === i; })[0] || worker; var prev = worker; worker = r; r.job = null; r.state = 'idle'; r.path = []; r.coolT = 0; var lbl = workerTaskLabel(i); workerSay(t === 'idle' ? crewLine('brk') : crewLine('onit', lbl.toLowerCase()), '#6fdc8c'); toast('🧑‍🔧 ' + crewName(i) + ': ' + lbl, ''); save(); ui.refreshOpen(); }
  function guardOff() { if (!S.staff) S.staff = {}; return !!S.staff.guardOff; }
  function guardShift(off) {
    if (!S.staff) S.staff = {};
    if (off === undefined) off = !S.staff.guardOff;
    S.staff.guardOff = !!off;
    if (off) { if (guard.h) { world.group.remove(guard.h); disposeTree(guard.h); world.interact = world.interact.filter(function (m) { return !(m.userData.interact && m.userData.interact.kind === 'guard'); }); guard.h = null; guard.bubble = null; } world.obstacles = world.obstacles.filter(function (o) { return o.tag !== 'guard'; }); }
    else if (!guard.h) buildGuard();
    sfx(off ? 'door' : 'ok');
    toast(off ? '🏠 The guard has gone home' : '🛡️ The guard is back on the door', off ? '' : 'good');
    logEvent(off ? '🏠 Sent the guard home' : '🛡️ Called the guard back in', '');
    save(); ui.refreshOpen();
  }
  function guardTask(t) { if (guardOff()) { toast('The guard isn\'t in. Call him back first.', 'bad'); return; } S.staff.guardTask = t; guard.pauseT = 0; guard.say(t === 'door' ? 'Back on the door.' : t === 'patrol' ? 'Doing the rounds.' : t === 'sweep' ? 'I\'ll tidy the lobby.' : 'I\'ll fill the counter display.', '#6fdc8c', 2400); toast('🛡️ The guard: ' + guardTaskLabel(), ''); save(); ui.refreshOpen(); }
  var postPick = -1;   // which assistant is waiting to be told where to stand
  function postStart(i) {
    postPick = i; ctxClose();
    toast('📍 Walk to the spot and press E to post ' + crewName(i) + ' there · Esc to cancel', '');
    lockPointer();
  }
  function postSet() {
    var i = postPick; postPick = -1; var c = crewList()[i]; if (!c) return;
    c.post = { x: +player.pos.x.toFixed(2), z: +player.pos.z.toFixed(2) };
    var r = crew.filter(function (x) { return x.idx === i; })[0];
    if (r) { r.job = null; r.path = []; r.state = 'idle'; }
    sfx('ok'); toast('📍 ' + crewName(i) + ' will stand here', 'good');
    logEvent('📍 Posted ' + crewName(i) + ' at ' + c.post.x.toFixed(1) + ', ' + c.post.z.toFixed(1), '');
    save(); ui.refreshOpen();
  }
  function postClear(i) { var c = crewList()[i]; if (!c) return; c.post = null; toast('📍 ' + crewName(i) + ' is back on the floor', ''); save(); ui.refreshOpen(); }
  function workerMenu(i) {
    i = i || 0; var c = crewList()[i]; if (!c) return;
    var lines = WORKER_TASKS.map(function (t) { return { label: t[1], cls: c.task === t[0] ? 'on' : '', act: function () { workerTask(t[0], i); } }; });
    lines.push({ label: '📍 Send them somewhere', act: function () { postStart(i); } });
    if (c.post) lines.push({ label: '📍 Clear their spot', act: function () { postClear(i); } });
    lines.push({ label: '🏠 Send home for the day', act: function () { crewShift(i, true); } });
    ctxOpen('🧑‍🔧 ' + crewName(i), 'now: ' + workerTaskLabel(i) + (c.post ? ' · posted' : '') + ' · pick a job', lines);
  }
  function guardMenu() { ctxOpen('🛡️ The guard', 'now: ' + guardTaskLabel() + ' · pick a job', GUARD_TASKS.map(function (t) { return { label: t[1], cls: S.staff.guardTask === t[0] ? 'on' : '', act: function () { guardTask(t[0]); } }; })); }
  // one order line from the shelf: the asked strain first, any strain of that kind second
  function workerFillLine(c, l) {
    var want = l.qty - l.given.n; var id = l.strain && lotCount(l.kind, l.strain) > 0 ? l.strain : Object.keys(S.lots[l.kind]).filter(function (sid) { return S.lots[l.kind][sid].n > 0; })[0]; if (!id) return false;
    var lot = lotOf(l.kind, id); if (c.premium && lot.qSum / lot.n < c.minQ) return false;
    var d = lotDraw(l.kind, id, want); l.given.n += d.n; l.given.qSum += d.q * d.n; l.given.thcSum += d.thc * d.n; if (l === orderLines(c)[0] && l.strain && id !== l.strain) c.subbed = true; else if (l === orderLines(c)[0] && id === l.strain) c.matched = true; syncGoods(); return true;
  }
  function workerPick() {   // at the goods shelf: take what the order needs, then carry it to the window
    var c = S.customer; if (!c || !c.arrived || c.stage || c.idPending) return;
    var lines = orderLines(c); var open = lines.filter(function (l) { return l.given.n < l.qty; }); var got = 0;
    open.forEach(function (l) { var before = l.given.n; if (workerFillLine(c, l)) got += l.given.n - before; });
    var still = lines.filter(function (l) { return l.given.n < l.qty; });
    if (!got && still.length) { workerSay(crewLine('out', still.map(lineText).join(', ')), '#ffc857', 3000); worker.coolT = now() + 20000; hud(); return; }
    sfx('rustle'); worker.next = { x: WP.counter.x, z: WP.counter.z, dur: 1.0, done: workerServe };
  }
  function workerServe() {
    if (!curtainOpen('service')) return;   /* the window curtain came across while they fetched it: the order waits until it opens */
    var c = S.customer; if (!c || !c.arrived || c.stage || c.idPending) return;
    var lines = orderLines(c); var still = lines.filter(function (l) { return l.given.n < l.qty; });
    if (still.length) { workerSay(crewLine('part', still.map(lineText).join(', ')), '#ffc857', 3000); worker.coolT = now() + 20000; hud(); return; }
    var mult = (c.premium ? 2.2 : 1.15) * (c.subbed ? 0.85 : c.strain && c.matched ? 1.1 : 1); var total = 0;
    lines.forEach(function (l) { total += unitPrice(l.kind, l.given.qSum / l.given.n, l.given.thcSum / l.given.n) * l.qty * mult; });
    (c.acc || []).forEach(function (a2) { if (a2.ok === true) total += ACC[a2.item].price * a2.qty; }); if (c.cig && c.cig.given < c.cig.qty && cigStock(c.cig.sku) > 0) { var cg = Math.min(c.cig.qty - c.cig.given, cigStock(c.cig.sku)); S.cigStock[c.cig.sku] -= cg; c.cig.given += cg; syncCigCab(); } total += cigTotal(c);   // Jo fetches the smokes from the cabinet too
    c.qty = lines.reduce(function (s2, l) { return s2 + l.qty; }, 0); c.due = Math.max(1, Math.round(total)); c.rep = c.premium ? randi(6, 12) : randi(1, 3); c.stage = 'pay'; if (!c.pay) c.pay = 'cash'; c.tendered = c.due; c.changeGiven = 0;
    workerSay(crewLine('served'), '#6fdc8c'); sfx('rustle'); hud(); var servedBy = crewName(worker.idx);
    setTimeout(function () { if (S.customer === c && c.stage) finalizeSale(0, 'served by ' + servedBy); }, 1500);
  }
  function workerTakeBroom() { if (worker.hasBroom || !worker.h) return; var el = worker.h.userData.parts.rArm.userData.elbow; var bg = new THREE.Group(); bg.position.set(0.04, -0.32, 0.08); bg.rotation.x = 0.35; bg.rotation.z = -0.15; var hd = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 1.25, 8), MAT.wood); hd.position.y = 0.15; bg.add(hd); var head = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.32), MAT.darkwood); head.position.y = -0.5; bg.add(head); for (var k = 0; k < 8; k++) { var br = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.2, 0.03), colorMat(k % 2 ? 0xb8925a : 0xa8843f, 1)); br.position.set(0, -0.62, -0.14 + k * 0.04); bg.add(br); } el.add(bg); worker.broomMesh = bg; worker.hasBroom = true; syncBroom(); sfx('pickup'); workerSay('got the broom', '#6fdc8c'); }
  function workerDropBroom() { if (!worker.hasBroom) return; if (worker.broomMesh && worker.broomMesh.parent) worker.broomMesh.parent.remove(worker.broomMesh); worker.broomMesh = null; worker.hasBroom = false; syncBroom(); sfx('putdown'); }
  // ── Restocking, one crate at a time ──
  // A crew member fetches one crate from its bay on the storage racking, carries it in both arms to where it goes,
  // opens the machine, loads it, shuts it again and goes back for the next. They never touch a machine's coins.
  function restockDest(k) {   // where a crate of k goes: the emptiest machine of its kind, the counter display or the supply rack; null if nowhere
    var st = supplyById(k), kind = k.indexOf('seed_') === 0 ? 'rack' : st && st.stock === 'vend' ? 'vend' : st && st.stock === 'coffee' ? 'coffee' : st && st.stock === 'display' ? 'display' : 'rack';
    if (kind === 'vend' || kind === 'coffee') {
      var us = builtUnits(kind === 'vend' ? 'vending' : 'lobbyCoffee'); if (!us.length) return null;
      var u = us.reduce(function (b, x) { return (machStock(x)[k] || 0) < (machStock(b)[k] || 0) ? x : b; });
      var f = propFront(u, 0.8); return { kind: kind, unit: u, x: f.x, z: f.z, yaw: f.yaw };
    }
    if (kind === 'display') return { kind: 'display', x: WP.counter.x + 1.2, z: WP.counter.z, yaw: 0 };   /* behind the counter, reaching over to the display */
    if (!propInst.rack) return null;
    var fr = propFront('rack', 0.75); return { kind: 'rack', x: fr.x, z: fr.z, yaw: fr.yaw };
  }
  function restockNext() { return Object.keys(S.storage).filter(function (k) { return (S.storage[k] || 0) > 0 && restockDest(k); })[0] || null; }
  function carrySet(rec, c, unsaved) {   // what a crew member has in their arms; kept on their saved record so a reload never loses it
    var saved = !unsaved && crewList()[rec.idx]; if (saved) saved.carry = c ? { item: c.item, n: c.n } : null;
    if (rec.carryMesh && rec.carryMesh.parent) { rec.carryMesh.parent.remove(rec.carryMesh); disposeTree(rec.carryMesh); }
    rec.carryMesh = null; rec.carry = c || null;
    if (c && rec.h) { var m = crateMesh(c.item, 0.4, 0.26, 0.32); m.position.set(0, 0.3, 0.3); rec.h.userData.parts.torso.add(m); rec.carryMesh = m; }
  }
  function carryBack(rec, unsaved) {   // a crate still in their arms goes back into storage
    if (!rec || !rec.carry) return; var c = rec.carry; S.storage[c.item] = (S.storage[c.item] || 0) + c.n; carrySet(rec, null, unsaved); syncStorage();
  }
  function carryPose() {   // both arms forward, hands under the crate
    if (!worker.carry || !worker.h) return; var P = worker.h.userData.parts;
    P.lArm.rotation.x = P.rArm.rotation.x = -0.5; P.lArm.rotation.z = P.rArm.rotation.z = 0;
    P.lArm.userData.elbow.rotation.x = P.rArm.userData.elbow.rotation.x = -0.6;
  }
  function restockTake(k) {   // at the bay: one crate down off the racking
    var have = S.storage[k] || 0; if (have <= 0) return;
    var n = Math.min(have, itemPack(k)); S.storage[k] = have - n; carrySet(worker, { item: k, n: n }); syncStorage(); sfx('crate');
  }
  function restockArrive(d) {   // at the machine: open it, load the crate, shut it; at the rack or the display: put it in
    var rec = worker, c = rec.carry; if (!c) return; if (rec.g) rec.g.rotation.y = d.yaw;
    var what = c.n + ' × ' + itemName(c.item);
    if (d.kind === 'vend' || d.kind === 'coffee') {
      var M = machState(d.unit), key = d.kind === 'vend' ? 'vendDoor' : 'coffDoor', wasOpen = !!M[key];
      if (!wasOpen) { M[key] = true; sfx('drawer'); if (d.kind === 'vend') vendDisplay(d.unit, 'SERVICE'); }
      rec.next = { x: d.x, z: d.z, dur: 1.6, done: function () {
        var st = machStock(d.unit); st[c.item] = (st[c.item] || 0) + c.n; carrySet(rec, null); sfx('putdown');
        if (d.kind === 'vend') syncVending(d.unit); else syncCoffee(d.unit);
        logEvent('📦 ' + crewName(rec.idx) + ' loaded ' + what + ' into the ' + (d.kind === 'vend' ? 'vending' : 'coffee') + ' machine', '');
        rec.next = { x: d.x, z: d.z, dur: 0.8, done: function () { if (!wasOpen) { M[key] = false; sfx('close'); if (d.kind === 'vend') vendDisplay(d.unit, 'READY'); } save(); } };   /* shut it again, unless you had it open */
      } };
      return;
    }
    rec.next = { x: d.x, z: d.z, dur: 1.2, done: function () {
      if (d.kind === 'display') { S.display[c.item] = (S.display[c.item] || 0) + c.n; syncDisplay(); }
      else { S.supplies[c.item] = (S.supplies[c.item] || 0) + c.n; syncRack(); }
      carrySet(rec, null); sfx('putdown'); logEvent('📦 ' + crewName(rec.idx) + ' put ' + what + (d.kind === 'display' ? ' in the counter display' : ' on the supply rack'), ''); save();
    } };
  }
  function restockJob() {
    if (worker.carry) {   /* a crate in their arms: take it where it goes, or back up if there is nowhere for it now */
      var d = restockDest(worker.carry.item);
      if (!d) { var rf = rackFront(worker.carry.item); return { x: rf.x, z: rf.z, dur: 1.0, done: function () { carryBack(worker); sfx('putdown'); } }; }
      return { x: d.x, z: d.z, dur: 0.4, done: function () { restockArrive(d); } };
    }
    var k = restockNext(); if (!k) return null;
    var f = rackFront(k); return { x: f.x, z: f.z, dur: 1.2, done: function () { restockTake(k); } };
  }
  function workerNextJob(task) {
    var g = worker.g; function near(x, z) { return Math.hypot(g.position.x - x, g.position.z - z) < 0.35; }
    if (worker.carry && task !== 'restock') { var bf = rackFront(worker.carry.item); return { x: bf.x, z: bf.z, dur: 1.0, done: function () { carryBack(worker); sfx('putdown'); } }; }   /* given another job mid-errand: the crate goes back up first */
    if (task === 'serve') { var c = S.customer; if (curtainOpen('service') && c && c.arrived && !c.stage && !c.idPending && npc.state === 'wait' && now() > worker.coolT) {   /* a card still held out is yours to check: the crew waits */ var gp = propInst.goodsShelf ? propWorld('goodsShelf', 0, 0.85) : { x: propPlacement('goodsShelf').x, z: propPlacement('goodsShelf').z - 0.85 }; return { x: gp.x, z: gp.z, dur: 1.2, done: workerPick }; } /* stands at the shelf's front (local +z) wherever it was moved or rotated */ if (!near(WP.counter.x, WP.counter.z)) return { x: WP.counter.x, z: WP.counter.z, dur: 0, done: function () {} }; return null; }
    if (task === 'restock') { var rj = restockJob(); if (rj) return rj; if (!near(WP.hall.x, WP.hall.z)) return { x: WP.hall.x, z: WP.hall.z, dur: 0, done: function () {} }; return null; }
    if (task !== 'clean' && worker.hasBroom) return { x: ROOM.x - 0.65, z: -0.85, dur: 0.6, done: workerDropBroom };
    if (task === 'clean' && !worker.hasBroom) { if (!dustList().length) return null; return { x: ROOM.x - 0.65, z: -0.85, dur: 0.8, done: workerTakeBroom }; }
    if (task === 'clean' && worker.hasBroom && !dustList().length) return { x: ROOM.x - 0.65, z: -0.85, dur: 0.6, done: workerDropBroom };
    if (task === 'clean') { var d = dustList().slice().sort(function (a, b) { return Math.hypot(a.x - g.position.x, a.z - g.position.z) - Math.hypot(b.x - g.position.x, b.z - g.position.z); })[0]; if (d) return { x: d.x, z: d.z, dur: 2.2, done: function () { S.dust = dustList().filter(function (p) { return p.id !== d.id; }); world.dustDirty = true; sfx('dust'); } }; if (!near(WP.hall.x, WP.hall.z)) return { x: WP.hall.x, z: WP.hall.z, dur: 0, done: function () {} }; return null; }
    if (task === 'water') { var p = S.plants.filter(function (pl) { return pl.progress < 1 && ((pl.thirst > 0.35 && !S.upgrades.autowater) || (!pl.fed && (S.supplies.nutrients || 0) > 0) || (pl.hazard && (S.supplies.remedy || 0) > 0)); })[0]; if (p) { var sp = slotPosOf(p.id); return { x: sp.x, z: sp.z + 0.55, dur: 1.6, done: function () { if (p.thirst > 0.35 && !S.upgrades.autowater) { p.thirst = 0; sfx('water'); } else if (!p.fed && (S.supplies.nutrients || 0) > 0) { p.fed = true; S.supplies.nutrients--; p.quality = Math.min(100, (p.quality || 50) + 12); sfx('feed'); } else if (p.hazard && (S.supplies.remedy || 0) > 0) { p.hazard = null; S.supplies.remedy--; sfx('spray'); } world.dirty = true; } }; } if (!near(-4.5, -3.2)) return { x: -4.5, z: -3.2, dur: 0, done: function () {} }; return null; }
    var post = (crewList()[worker.idx] || {}).post;
    if (post) { if (!near(post.x, post.z)) return { x: post.x, z: post.z, dur: 0, done: function () {} }; return null; }   /* posted: their spot is where they wait */
    if (!near(WP.hall.x, WP.hall.z)) return { x: WP.hall.x, z: WP.hall.z, dur: 0, done: function () {} }; return null;
  }
  function updateWorker(dt) {
    var list = crewList();
    if (crew.length !== list.length) crewSync();
    if (!list.length) { worker = WORKER_NONE; return; }
    var prev = worker;
    for (var ci = 0; ci < crew.length; ci++) { if ((list[crew[ci].idx] || {}).off) continue; worker = crew[ci]; updateOneWorker(dt); }
    worker = crew[0] || WORKER_NONE;
  }
  function updateOneWorker(dt) {
    if (worker.g && worker.path && worker.path.length) { var wlk = npcDoors(worker.g, 0, true); if (wlk && worker.job) { worker.path = []; worker.job = null; worker.state = 'idle'; worker.coolT = now() + 6000; workerSay(crewLine('locked'), '#ffc857', 2600); } }   /* a locked door is the end of that errand, not something to walk through */
    if (!worker.g) buildWorker(); var g = worker.g, spd = 1.5;
    if (worker.state === 'walk') { if (walkAlong(g, worker.path, spd, dt)) { worker.state = 'work'; worker.t = 0; } animateHuman(worker.h, dt, 'walk', spd, null); carryPose(); return; }
    if (worker.state === 'work') { worker.t += dt; animateHuman(worker.h, dt, 'idle', 0, null); var P = worker.h.userData.parts; if (worker.carry) carryPose(); else if (worker.job && worker.job.dur > 0) { P.rArm.rotation.x = worker.hasBroom ? -0.5 + Math.sin(worker.t * 5) * 0.35 : -0.9 + Math.sin(worker.t * 6) * 0.4; if (worker.hasBroom) P.torso.rotation.x = 0.15; } if (!worker.job || worker.t >= worker.job.dur) { var j = worker.job; worker.job = null; worker.state = 'idle'; worker.idleT = 0; worker.next = null; P.torso.rotation.x = 0; if (j) j.done(); if (worker.next) { worker.job = worker.next; worker.next = null; worker.path = routeTo(g.position, worker.job.x, worker.job.z, 'staff'); worker.state = 'walk'; } } return; }
    animateHuman(worker.h, dt, 'idle', 0, player.pos); carryPose(); worker.idleT += dt; if (worker.idleT < 0.7) return; worker.idleT = 0;
    var task = (crewList()[worker.idx] || {}).task || 'idle';
    var job = workerNextJob(task);
    if (!job && task !== 'idle') {   /* nothing to do is not the same as broken: say so */
      worker.nagT = (worker.nagT || 0) + 0.7;
      if (worker.nagT > 14) {
        worker.nagT = 0;
        var why = task === 'clean' ? crewLine('clean')
          : task === 'restock' ? crewLine('empty')
          : task === 'water' ? crewLine('plants')
          : task === 'serve' ? (!curtainOpen('service') ? crewLine(shop().breakNote ? 'onBreak' : 'shut') : S.customer && S.customer.idPending ? crewLine('checkId') : crewLine('nobody')) : crewLine('nothing');
        workerSay(why, '#ffc857', 2600);
      }
    } else worker.nagT = 0;
    if (job) { worker.job = job; worker.path = routeTo(g.position, job.x, job.z, 'staff'); worker.state = 'walk'; }
  }
  // the guard walks with the same router; the door post keeps its obstacle only while he stands there
  function guardGo(x, z, fn) { world.obstacles = world.obstacles.filter(function (o) { return o.tag !== 'guard'; }); guard.path = routeTo(guard.h.position, x, z, 'staff'); guard.walking = true; guard.onArrive = fn || null; guard.toPost = Math.abs(x - WP.post.x) < 0.01 && Math.abs(z - WP.post.z) < 0.01; }
  function updateGuardTasks(dt) {   // returns true when it handled this frame
    var gt = S.staff && S.staff.guardTask || 'door';
    var wantPost = gt === 'door' || npc.state === 'enter' || npc.state === 'check' || guard.state === 'check' || lineAtDoor();
    if (guard.walking) { if (walkAlong(guard.h, guard.path, 1.3, dt)) { guard.walking = false; guard.pauseT = 1.6; if (guard.toPost) { guard.h.rotation.y = -0.9; world.obstacles.push({ x1: 1.4, x2: 2.0, z1: 7.0, z2: 7.6, tag: 'guard' }); } var fn = guard.onArrive; guard.onArrive = null; if (fn) fn(); } animateHuman(guard.h, dt, 'walk', 1.3, null); return true; }
    guard.pauseT = Math.max(0, (guard.pauseT || 0) - dt); var atPost = Math.hypot(guard.h.position.x - WP.post.x, guard.h.position.z - WP.post.z) < 0.15;
    if (wantPost) { if (!atPost && guard.pauseT <= 0) { guardGo(WP.post.x, WP.post.z); return true; } return false; }
    if (guard.pauseT > 0) { animateHuman(guard.h, dt, 'idle', 0, player.pos); return true; }
    if (gt === 'patrol') { var pts = [[6, 6.5], [9, 8.2], [3, 8.4], [-3, 7.2], [WP.post.x, WP.post.z]]; guard.pi = ((guard.pi || 0) + 1) % pts.length; guardGo(pts[guard.pi][0], pts[guard.pi][1]); return true; }
    if (gt === 'sweep') { var spot = dustList().filter(function (p) { return p.z > 4; }).sort(function (a, b) { return Math.hypot(a.x - guard.h.position.x, a.z - guard.h.position.z) - Math.hypot(b.x - guard.h.position.x, b.z - guard.h.position.z); })[0]; if (spot) { guardGo(spot.x, spot.z, function () { S.dust = dustList().filter(function (p) { return p.id !== spot.id; }); world.dustDirty = true; sfx('dust'); }); return true; } if (!atPost) { guardGo(WP.post.x, WP.post.z); return true; } return false; }
    if (gt === 'restock') { var need = ['lighter', 'rpaper', 'rgrinder'].filter(function (k) { return (S.storage[k] || 0) > 0; }); if (guard.carrying) { guardGo(0.95, 5.0, function () { Object.keys(guard.carrying).forEach(function (k) { S.display[k] = (S.display[k] || 0) + guard.carrying[k]; }); guard.carrying = null; syncDisplay(); sfx('putdown'); toast('🛡️ The guard restocked the counter display', ''); logEvent('🛡️ The guard restocked the counter display', ''); }); return true; } if (need.length) { guardGo(WP.annex.x, WP.annex.z, function () { guard.carrying = {}; need.forEach(function (k) { guard.carrying[k] = S.storage[k]; S.storage[k] = 0; }); syncStorage(); guard.say('Got the counter stock.', '#6fdc8c'); }); return true; } if (!atPost) { guardGo(WP.post.x, WP.post.z); return true; } return false; }
    return false;
  }

