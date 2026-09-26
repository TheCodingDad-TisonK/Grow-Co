//@ radio, dust and the broom, the upstairs floor and the TV
  // ── Radio: generated stations (no audio files), volume falls off with distance to a speaker ──
  var radio = { station: 'off', master: null, timer: null, nextT: 0, step: 0, lp: null, comp: null };
  var STATIONS = {
    off:   { name: 'Off' },
    lofi:  { name: 'Lo-fi Greenhouse', bpm: 74, chords: [[53, 57, 60, 64], [57, 60, 64, 67], [50, 53, 57, 60], [55, 59, 62, 65]], wave: 'sine', bass: 'triangle', hat: 0.5, swing: 0.12 },
    dub:   { name: 'Dub Terrace', bpm: 68, chords: [[45, 48, 52], [50, 53, 57], [43, 47, 50], [48, 52, 55]], wave: 'square', bass: 'sine', hat: 0.25, skank: true },
    synth: { name: 'Neon Drive', bpm: 112, chords: [[45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59], [48, 55, 60, 64]], wave: 'sawtooth', bass: 'sawtooth', hat: 0.7, arp: true, kick: true },
    jazz:  { name: 'Late Jazz', bpm: 92, chords: [[50, 53, 57, 60], [43, 47, 50, 53], [48, 52, 55, 59], [45, 48, 52, 55]], wave: 'triangle', bass: 'sine', hat: 0.35, walk: true, swing: 0.2 }
  };
  var STATION_ORDER = ['off', 'lofi', 'dub', 'synth', 'jazz'];
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  radio.ensure = function () { audio(); if (!radio.master) { radio.master = AC.createGain(); radio.master.gain.value = 0; radio.lp = AC.createBiquadFilter(); radio.lp.type = 'lowpass'; radio.lp.frequency.value = 2600; radio.comp = AC.createDynamicsCompressor(); radio.master.connect(radio.lp); radio.lp.connect(radio.comp); radio.comp.connect(AC.destination); } };
  radio.set = function (station) {
    if (!STATIONS[station]) station = 'off';
    radio.station = station; shop().radio = station;
    if (station === 'off') { if (radio.timer) { clearInterval(radio.timer); radio.timer = null; } if (radio.master) radio.master.gain.setTargetAtTime(0, AC.currentTime, 0.2); return; }
    try { radio.ensure(); } catch (e) { return; }
    if (!radio.timer) { radio.nextT = AC.currentTime + 0.1; radio.step = 0; radio.timer = setInterval(radio.schedule, 120); }
  };
  radio.schedule = function () {
    if (!AC || radio.station === 'off') return; var st = STATIONS[radio.station]; var beat = 60 / st.bpm / 2; // 8th notes
    while (radio.nextT < AC.currentTime + 0.35) { radio.playStep(st, radio.step, radio.nextT + ((radio.step % 2) ? (st.swing || 0) * beat : 0)); radio.step++; radio.nextT += beat; }
  };
  function tone(type, freq, t, dur, gain, dest, attack) { var o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(freq, t); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(gain, t + (attack || 0.01)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05); }
  function noiseHit(t, dur, gain, dest, hp) { var len = Math.floor(AC.sampleRate * dur); var buf = AC.createBuffer(1, len, AC.sampleRate); var d = buf.getChannelData(0); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len); var src = AC.createBufferSource(); src.buffer = buf; var f = AC.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp || 6000; var g = AC.createGain(); g.gain.value = gain; src.connect(f); f.connect(g); g.connect(dest); src.start(t); }
  radio.playStep = function (st, step, t) {
    var dest = radio.master; var bar = Math.floor(step / 8) % st.chords.length; var chord = st.chords[bar]; var inBar = step % 8; var beatLen = 60 / st.bpm;
    // pad / comping
    if (st.arp) { var n = chord[step % chord.length] + 12; tone(st.wave, mtof(n), t, beatLen * 0.45, 0.05, dest); }
    else if (st.skank) { if (inBar % 2 === 1) chord.forEach(function (n) { tone(st.wave, mtof(n + 12), t, beatLen * 0.18, 0.025, dest); }); }
    else if (inBar === 0 || (st.walk && inBar === 5) || (!st.walk && inBar === 4 && Math.random() < 0.5)) { chord.forEach(function (n, i) { tone(st.wave, mtof(n + 12), t + i * 0.012, beatLen * (st.walk ? 1.2 : 3.2), 0.035, dest, 0.08); }); }
    // bass
    if (st.walk) { var scale = [0, 2, 4, 5, 7, 9, 11]; var root = chord[0]; if (inBar % 2 === 0) tone(st.bass, mtof(root - 12 + scale[Math.floor(Math.random() * 4)]), t, beatLen * 0.9, 0.12, dest); }
    else if (inBar === 0 || inBar === 3 || (st.kick && inBar === 4) || (st.skank && inBar === 6)) tone(st.bass, mtof(chord[0] - 12), t, beatLen * (st.skank ? 1.4 : 0.8), 0.14, dest);
    // drums
    if (st.kick && (inBar === 0 || inBar === 4)) { var k = AC.createOscillator(), kg = AC.createGain(); k.frequency.setValueAtTime(140, t); k.frequency.exponentialRampToValueAtTime(40, t + 0.12); kg.gain.setValueAtTime(0.5, t); kg.gain.exponentialRampToValueAtTime(0.001, t + 0.25); k.connect(kg); kg.connect(dest); k.start(t); k.stop(t + 0.3); }
    if (st.hat && (inBar % 2 === 1 || st.kick)) noiseHit(t, 0.05, st.hat * 0.05 * (inBar % 2 ? 1 : 0.5), dest, 7000);
    if (!st.kick && (inBar === 2 || inBar === 6)) noiseHit(t, 0.12, 0.05, dest, 1800);
  };
  radio.update = function () {
    if (!radio.master || radio.station === 'off') return;
    var best = 99; (world.speakers || []).forEach(function (sp) { var d = Math.hypot(sp[0] - player.pos.x, sp[2] - player.pos.z, (sp[1] - player.pos.y) * 1.5); if (d < best) best = d; });
    var att = clamp(1.2 - best / 12, 0.08, 1); var vol = (SET.sound ? 1 : 0) * shop().volume * att * 0.9;
    radio.master.gain.setTargetAtTime(vol, AC.currentTime, 0.15);
  };
  function radioNext() { var i = STATION_ORDER.indexOf(shop().radio); var next = STATION_ORDER[(i + 1) % STATION_ORDER.length]; radio.set(next); applyShopState(); toast('♪ ' + STATIONS[next].name, ''); save(); }

  // The satellite panels: the same switches, only the ones that belong in that room.
  var FRONT_CURTAINS = ['frontL', 'door', 'frontR'];   /* the shop front: left pane, the door, right pane */
  var MINI_CTL = {
    front:  { title: '🏪 Front panel', shop: true, roller: false, curtains: FRONT_CURTAINS, lights: ['hall', 'lobby'], doors: [] },   /* the roller door is out back: it stays on the control box */
    office: { title: '🗄️ Office panel', shop: false, roller: false, lights: ['office', 'grow', 'dry'], doors: ['office'] }
  };
  function paneMiniCtl(scope) {
    var M = MINI_CTL[scope] || MINI_CTL.front, sh = shop();
    var h = '<div class="g3-grid"><div class="g3-box"><h3>' + M.title + '</h3>';
    if (M.shop) {
      h += '<div class="desc">Open or close the shop, draw the three front curtains and switch the lights over the hall and lounge. The full board is in the security room.</div>';
      h += '<button class="g3-btn wide ' + (sh.open ? 'danger' : 'primary') + '" data-act="shopToggle">' + (sh.open ? '🔴 Close the shop' : '🟢 Open the shop') + '</button>';
    } else {
      h += '<div class="desc">The lights back here and the office door. The full board is in the security room.</div>';
    }
    if (M.roller) h += '<button class="g3-btn wide' + (world.rollerOpen ? ' primary' : '') + '" data-act="rollerToggle">' + (world.rollerOpen ? '🚪 Close the shutter' : '🚪 Open the shutter') + '</button>';
    if (M.curtains) {
      var mc = M.curtains.filter(function (k) { return curtains[k]; }), allOpen = mc.length && mc.every(curtainOpen);
      h += '<h3 style="margin-top:12px">🪟 Front curtains</h3><div class="g3-chips">' + mc.map(function (k) { return '<button class="g3-btn' + (curtainOpen(k) ? ' primary' : '') + '" data-act="curtainToggle" data-id="' + k + '">' + esc(curtains[k].label) + ' <b>' + (curtainOpen(k) ? 'open' : 'closed') + '</b></button>'; }).join('') + '</div>';
      h += '<button class="g3-btn wide' + (allOpen ? '' : ' primary') + '" data-act="frontCurtains" data-id="' + (allOpen ? 'close' : 'open') + '">' + (allOpen ? 'Close all three' : 'Open all three') + '</button>';
    }
    h += '<h3 style="margin-top:12px">💡 Lights</h3><div class="g3-chips">' + M.lights.map(function (r) {
      return '<button class="g3-btn' + (sh.rooms && sh.rooms[r] === false ? '' : ' primary') + '" data-act="roomLight" data-id="' + r + '">' + ROOM_NAMES[r] + '</button>';
    }).join('') + '</div>';
    if (M.doors.length) {
      h += '<h3 style="margin-top:12px">🚪 Doors</h3><div class="g3-chips">' + DOORS.filter(function (d) { return M.doors.some(function (k) { return d.id.indexOf(k) >= 0 || (d.name || '').toLowerCase().indexOf(k) >= 0; }); }).map(function (d) {
        return '<button class="g3-btn' + (d.open ? ' primary' : '') + '" data-act="doorToggle" data-id="' + d.id + '">' + d.name + (d.locked ? ' 🔒' : '') + '</button>';
      }).join('') + '</div>';
    }
    return h + '</div></div>';
  }
  function paneControls() {
    var sh = shop();
    var h = '<div class="g3-grid"><div class="g3-box"><h3>🏪 Shop</h3><div class="desc">Closed means no new customers walk in; the one at the window leaves.</div>' +
      '<button class="g3-btn wide ' + (sh.open ? 'danger' : 'primary') + '" data-act="shopToggle">' + (sh.open ? '🔴 Close the shop' : '🟢 Open the shop') + '</button>' +
      '<button class="g3-btn wide" data-act="lightsToggle">' + (sh.lights ? '🌑 Lights off' : '💡 Lights on') + '</button>' +
      '<button class="g3-btn wide" data-act="staffDoorToggle">' + (sh.staffDoor ? '🚪 Close the staff door' : '🚪 Open the staff door') + '</button>' +
      '<button class="g3-btn wide' + (staffDoorLocked() ? ' danger' : '') + '" data-act="staffDoorLock">' + (staffDoorLocked() ? '🔓 Unlock the staff door' : '🔒 Lock the staff door') + '</button>' +
      '<button class="g3-btn wide' + (staffKey('staff') ? ' primary' : '') + '" data-act="staffDoorKey">' + (staffKey('staff') ? '🔑 The crew have a staff door key' : '🔑 The crew have no staff door key') + '</button>' +
      '<h3 style="margin-top:12px">💡 Lights by room</h3><div class="g3-chips">' + Object.keys(ROOM_NAMES).map(function (r) { return '<button class="g3-btn' + (sh.lights && powerOn() && roomLit(r) ? ' primary' : '') + '" data-act="roomLight" data-id="' + r + '">' + ROOM_NAMES[r] + '</button>'; }).join('') + '</div>' +
      '<h3 style="margin-top:12px">🚪 Doors</h3><div class="g3-chips"><button class="g3-btn' + (world.rollerOpen ? ' primary' : '') + '" data-act="rollerToggle">Roller door ' + (world.rollerOpen ? 'open' : 'closed') + '</button><button class="g3-btn' + (world.gateOpen ? ' primary' : '') + '" data-act="gateToggle">Yard gate ' + (world.gateOpen ? 'open' : 'closed') + '</button><button class="g3-btn" data-act="tvNext">📺 TV: next channel</button></div>' +
      '<div class="desc" style="margin-top:8px">Sliding doors: shut, open or lock each one from here. Your crew and the guard hold a key to every door marked staff key: they unlock it, walk through and it locks again behind them. Take a key back and they stop at that door. Anyone else has to force a locked door, and a door someone walks through slides shut 4 s after they are clear.</div>' + DOORS.map(function (d) { return '<div class="inv-row" style="display:flex;gap:6px;align-items:center;margin-top:4px"><span style="flex:1">' + (d.locked ? '🔒 ' : '🚪 ') + esc(d.name) + '</span><button class="g3-btn' + (d.open ? ' primary' : '') + '" data-act="doorToggle" data-id="' + d.id + '">' + (d.open ? 'open' : 'shut') + '</button><button class="g3-btn' + (d.locked ? ' primary' : '') + '" data-act="doorLock" data-id="' + d.id + '">' + (d.locked ? 'locked' : 'lock') + '</button><button class="g3-btn' + (staffKey(d.id) ? ' primary' : '') + '" data-act="doorKey" data-id="' + d.id + '">' + (staffKey(d.id) ? '🔑 staff key' : 'no staff key') + '</button></div>'; }).join('') +
      '<div class="inv-row" style="display:flex;gap:6px;margin-top:6px"><button class="g3-btn" data-act="doorsAll" data-id="open">Open all</button><button class="g3-btn" data-act="doorsAll" data-id="close">Shut all</button><button class="g3-btn" data-act="doorsAll" data-id="lock">🔒 Lock all</button><button class="g3-btn" data-act="doorsAll" data-id="unlock">Unlock all</button></div>' +
      '<h3 style="margin-top:12px">💲 Pricing</h3><div class="g3-slider"><label>Markup</label><input type="range" data-ctl="markup" min="0.8" max="1.3" step="0.05" value="' + (sh.markup || 1) + '"><small>' + Math.round((sh.markup || 1) * 100) + '%</small></div><div class="desc">Above 100% every price rises but customers come less often; below it the reverse.</div>' +
      '<h3 style="margin-top:12px">≡ Curtains</h3><div class="g3-chips">' + Object.keys(curtains).map(function (k) { return '<button class="g3-btn' + (curtainOpen(k) ? ' primary' : '') + '" data-act="curtainToggle" data-id="' + k + '">' + esc(curtains[k].label) + ' <b>' + (curtainOpen(k) ? 'open' : 'closed') + '</b></button>'; }).join('') + '</div>' +
      '<div class="inv-row" style="display:flex;gap:6px"><button class="g3-btn" data-act="curtainsOpen">Open all</button><button class="g3-btn" data-act="curtainsClose">Close all</button></div>' +
      '<h3 style="margin-top:12px">🌬️ Climate</h3><div class="desc">Drying speeds up below 55% RH and mould spreads above 60%. Air under 42% makes plants thirstier.</div>' +
      ['grow', 'dry'].map(function (z) { return '<div class="g3-row"><span class="ico">🌫️</span><span class="meta"><span class="n">' + (z === 'grow' ? 'Grow room' : 'Dry & cure room') + ' · RH ' + Math.round(S.rh[z]) + '%</span><span class="own">dehumidifier ' + dehumLabel(z) + '</span></span></div><div class="g3-chips">' + dehumSteps().map(function (t) { return '<button class="g3-btn' + (S.dehum[z] === t ? ' primary' : '') + '" data-act="dehumSet" data-id="' + z + ':' + t + '">' + (t ? t + '%' : 'Off') + '</button>'; }).join('') + '</div>'; }).join('') +
      '</div><div class="g3-box"><h3>♪ Radio</h3><div class="desc">Plays through the wall speakers in the hall, lobby and grow room. Generated live, no files.</div>';
    STATION_ORDER.forEach(function (k) { h += '<button class="g3-btn wide' + (sh.radio === k ? ' primary' : '') + '" data-act="radioSet" data-id="' + k + '">' + (k === 'off' ? '⏻ ' : '♪ ') + STATIONS[k].name + '</button>'; });
    h += '<div class="g3-slider" style="margin-top:10px"><label>Volume</label><input type="range" data-ctl="volume" min="0" max="1" step="0.05" value="' + sh.volume + '"><small>' + Math.round(sh.volume * 100) + '%</small></div></div></div>';
    return h;
  }

  // ── Dust + broom: the floor gets dirty over time, sweep it with the broom ──
  var dustGroup = new THREE.Group(); world.group.add(dustGroup);
  var DUST_TEX = makeTex(256, 256, function (ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    var halo = ctx.createRadialGradient(128, 128, 20, 128, 128, 120); halo.addColorStop(0, 'rgba(70,52,34,0.55)'); halo.addColorStop(0.6, 'rgba(70,52,34,0.28)'); halo.addColorStop(1, 'rgba(70,52,34,0)'); ctx.fillStyle = halo; ctx.fillRect(0, 0, w, h);
    for (var s = 0; s < 9; s++) { var sa = Math.random() * Math.PI * 2, sr = Math.random() * 55; ctx.fillStyle = 'rgba(' + (48 + Math.random() * 30) + ',' + (34 + Math.random() * 20) + ',' + (20 + Math.random() * 14) + ',' + (0.55 + Math.random() * 0.35) + ')'; ctx.beginPath(); ctx.ellipse(128 + Math.cos(sa) * sr, 128 + Math.sin(sa) * sr, 18 + Math.random() * 30, 12 + Math.random() * 22, Math.random() * Math.PI, 0, Math.PI * 2); ctx.fill(); }
    for (var i = 0; i < 420; i++) { var a = Math.random() * Math.PI * 2, r = Math.pow(Math.random(), 0.7) * 118; var k = Math.random(); ctx.fillStyle = k < 0.6 ? 'rgba(58,42,26,' + (0.5 + Math.random() * 0.5) + ')' : k < 0.85 ? 'rgba(120,96,62,' + (0.5 + Math.random() * 0.4) + ')' : 'rgba(150,140,120,' + (0.4 + Math.random() * 0.4) + ')'; var sz = 1.5 + Math.random() * 4; ctx.fillRect(128 + Math.cos(a) * r, 128 + Math.sin(a) * r, sz, sz * (0.6 + Math.random())); }
    for (var l = 0; l < 4; l++) { var la = Math.random() * Math.PI * 2, lr = Math.random() * 80; ctx.save(); ctx.translate(128 + Math.cos(la) * lr, 128 + Math.sin(la) * lr); ctx.rotate(Math.random() * Math.PI); ctx.fillStyle = 'rgba(' + (60 + Math.random() * 40) + ',' + (90 + Math.random() * 40) + ',40,0.85)'; ctx.beginPath(); ctx.ellipse(0, 0, 11, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgba(40,60,25,0.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(11, 0); ctx.stroke(); ctx.restore(); }
  });
  DUST_TEX.wrapS = DUST_TEX.wrapT = THREE.ClampToEdgeWrapping;
  var DUST_MAT = new THREE.MeshBasicMaterial({ map: DUST_TEX, transparent: true, depthWrite: false, opacity: 1.0 });
  var DUST_RING = new THREE.MeshBasicMaterial({ color: 0xffc857, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide });
  var DUST_ZONES = [[-11, -1.5, -8.5, -2.5], [0, 11, -8.5, -2.5], [-11, -4.5, -1.5, 3.5], [-3.5, 3.5, -1.5, 3.5], [4.5, 11, -1.5, 3.5], [-11, 11, 4.5, 8.5]]; // x1,x2,z1,z2 per room
  function binsFull() { var M = xs().mach || {}; return Object.keys(M).some(function (k) { return M[k] && typeof M[k] === 'object' && (M[k].trash || 0) >= 12; }); }   // any trash can at 12 of 12
  function dustList() { if (!S.dust) S.dust = []; if (typeof S.lastDust !== 'number') S.lastDust = now(); return S.dust; }
  function spawnDust(n) {
    var d = dustList(); var tries = 120; for (var i = 0; i < n && d.length < 14; i++) { var z = pick(DUST_ZONES); var x = randf(z[0], z[1]), zz = randf(z[2], z[3]); if (!dustSpotFree(x, zz)) { i--; if (--tries < 0) break; continue; } d.push({ id: 'd' + now() + randi(0, 999), x: Math.round(x * 100) / 100, z: Math.round(zz * 100) / 100, s: randf(0.8, 1.25), r: Math.random() * 6.28 }); }
    world.dustDirty = true;
  }
  // open floor only: outside every ground-floor obstacle by a margin, not under the grow tent, not on the stairs, not on top of another patch
  function dustSpotFree(x, z) {
    var m = 0.45; var ts = tentSize(); var tc = world.tentGroup ? world.tentGroup.position : { x: 0, z: 0 }; var tx = TENT_ORIGIN.x + tc.x, tz = TENT_ORIGIN.z + tc.z;
    if (x > tx - ts.w / 2 - m && x < tx + ts.w / 2 + m && z > tz - ts.d / 2 - m && z < tz + ts.d / 2 + m) return false;
    if (x > STAIR.x1 - m && x < STAIR.x2 + m && z > STAIR.z1 - m && z < STAIR.z2 + m) return false;
    if (world.obstacles.some(function (o) { return (o.floorLevel || 0) === 0 && x > o.x1 - m && x < o.x2 + m && z > o.z1 - m && z < o.z2 + m; })) return false;
    if (dustList().some(function (p) { return Math.hypot(p.x - x, p.z - z) < 1.1; })) return false;
    return true;
  }
  function updateDust() {
    var d = dustList(); var interval = (S.upgrades.robovac ? 150000 : 75000) / (binsFull() ? 1.5 : 1);   /* a full bin spills: half as much dust again until it is emptied */ // a new patch every ~75 s of play (offline time counts at a quarter rate)
    if (now() - S.lastDust > interval) { var k = Math.floor((now() - S.lastDust) / interval); S.lastDust = now(); spawnDust(Math.min(k, 3)); if (d.length >= 8 && !S.dustNagged) { S.dustNagged = true; logEvent('🧹 The floors are getting dusty. Grab the broom.', 'bad'); } }
    if (world.dustDirty) syncDust();
    // ring markers pulse while the broom is in hand so the patches are easy to spot from across the room
    var hb = held(); var show = !!(hb && hb.kind === 'broom'); if (world.dustRings) { var pulse = 0.35 + Math.abs(Math.sin(now() / 260)) * 0.45; world.dustRings.forEach(function (r) { r.visible = show; }); DUST_RING.opacity = pulse; }
  }
  function syncDust() {
    world.dustDirty = false; clearKids(dustGroup);
    world.interact = world.interact.filter(function (m) { return m.userData.dynGroup !== 'dust'; });
    dustList().forEach(function (p) { var m = new THREE.Mesh(new THREE.PlaneGeometry(p.s, p.s), DUST_MAT); m.rotation.set(-Math.PI / 2, 0, p.r); m.position.set(p.x, 0.012, p.z); dustGroup.add(m); var ring = new THREE.Mesh(new THREE.RingGeometry(p.s * 0.5, p.s * 0.5 + 0.03, 32), DUST_RING); ring.rotation.x = -Math.PI / 2; ring.position.set(p.x, 0.016, p.z); ring.userData.dustRing = true; ring.visible = false; dustGroup.add(ring); var hit = new THREE.Mesh(new THREE.BoxGeometry(p.s + 0.2, 0.4, p.s + 0.2), MAT.none); hit.position.set(p.x, 0.2, p.z); dustGroup.add(hit); interactable(hit, { kind: 'dust', id: p.id }); hit.userData.dynGroup = 'dust'; });
    world.dustRings = []; dustGroup.children.forEach(function (o) { if (o.userData.dustRing) world.dustRings.push(o); });
    if (dustList().length < 8) S.dustNagged = false;
  }
  function sweep(id) {
    var h = held(); if (!h || h.kind !== 'broom') { toast('Grab the broom first (processing room wall)', 'bad'); return; }
    var d = dustList(); var idx = -1; for (var i = 0; i < d.length; i++) if (d[i].id === id) idx = i; if (idx < 0) return;
    var p = d[idx]; d.splice(idx, 1); world.dustDirty = true; burst(p.x, 0.15, p.z, 0x8a7a66, 22, 'out'); sfx('water');
    S.stats.swept = (S.stats.swept || 0) + 1; if (S.stats.swept % 10 === 0) { S.rep += 1; toast('🧹 Spotless (rep +1)', 'good'); } else toast('🧹 Swept', 'good');
    if (!d.length) logEvent('🧹 Floors are clean', 'good');
  }
  function buildBroom() {
    // broom on a wall hook in the processing room (left of the tools board): grip, ash handle, steel collar, flagged bristles
    var bx = ROOM.x - 0.16, bz = -1.6; world.broomMeshes = [];
    box(0.06, 0.06, 0.1, MAT.chrome, ROOM.x - 0.05, 1.78, bz); var hook = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 6, 12, Math.PI), MAT.chrome); hook.position.set(ROOM.x - 0.1, 1.78, bz); hook.rotation.z = -Math.PI / 2; world.group.add(hook);
    var g = new THREE.Group(); g.position.set(bx, 0, bz); g.rotation.z = 0.06; world.group.add(g); world.broomMeshes.push(g);
    function add(geo, mat, x, y, z) { var m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; }
    add(new THREE.CylinderGeometry(0.014, 0.016, 1.25, 10), MAT.wood, 0, 1.05, 0);
    add(new THREE.CylinderGeometry(0.018, 0.018, 0.16, 10), colorMat(0xc94a3a, 0.8), 0, 1.6, 0); add(new THREE.SphereGeometry(0.02, 10, 8), colorMat(0xc94a3a, 0.8), 0, 1.68, 0); add(new THREE.TorusGeometry(0.016, 0.004, 6, 12), MAT.chrome, 0, 1.7, 0).rotation.x = Math.PI / 2;
    add(new THREE.CylinderGeometry(0.022, 0.018, 0.05, 10), MAT.chrome, 0, 0.44, 0);
    var head = add(new THREE.BoxGeometry(0.07, 0.05, 0.32), MAT.darkwood, 0, 0.4, 0); add(new THREE.BoxGeometry(0.075, 0.015, 0.33), colorMat(0x1c1c22, 0.6), 0, 0.375, 0);
    for (var r = 0; r < 3; r++) for (var k = 0; k < 14; k++) { var br = add(new THREE.BoxGeometry(0.012, 0.22, 0.012), colorMat(k % 2 ? 0xb8925a : 0xa8843f, 1), -0.02 + r * 0.02, 0.26, -0.145 + k * 0.0225); br.rotation.x = (k - 7) * 0.012; br.rotation.z = (r - 1) * 0.08; }
    add(new THREE.CylinderGeometry(0.01, 0.01, 0.06, 6), MAT.black, 0, 0.47, 0);
    var hit = box(0.3, 1.6, 0.4, MAT.none, bx, 0.9, bz, { cast: false, receive: false }); interactable(hit, { kind: 'broom' });
    var dustpan = new THREE.Group(); dustpan.position.set(ROOM.x - 0.12, 0.02, bz + 0.4); world.group.add(dustpan); var pan = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.2), colorMat(0xc94a3a, 0.7)); pan.position.y = 0.015; dustpan.add(pan); var lip = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.02), colorMat(0xc94a3a, 0.7)); lip.position.set(0, 0.03, -0.09); dustpan.add(lip); var ph = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.28, 8), colorMat(0xc94a3a, 0.7)); ph.position.set(0, 0.12, 0.05); ph.rotation.x = -0.5; dustpan.add(ph);
    signPlane(['BROOM', 'sweep the dust · E on a patch'], 1.0, 0.36, ROOM.x - 0.02, 2.05, bz, -Math.PI / 2, { titleColor: '#ffc857' });
    syncBroom();
  }
  function syncBroom() { var onWall = !(held() && held().kind === 'broom') && !crew.some(function (r) { return r.hasBroom; }); (world.broomMeshes || []).forEach(function (m) { m.visible = onWall; }); }

  // ── Upstairs: private living floor reached by the office stairs ────
  var UP = { y: 3.75, h: 3.0 };                          // floor level + ceiling height of the upper floor
  var STAIR = { x1: -9.5, x2: -5.5, z1: 2.6, z2: 3.6 }; // footprint of the staircase (bottom at x2, rises toward x1 / the window)
  var STAIR2 = { x1: 4.9, x2: 8.9, z1: 4.15, z2: 5.15 };   // the lounge stair in the lobby: bottom at x1, rises toward x2 along the back wall
  function stairT(x, z) { if (player.floor !== -1 && player.floor !== 2 && x > STAIR2.x1 - 0.15 && x < STAIR2.x2 + 0.15 && z > STAIR2.z1 - 0.05 && z < STAIR2.z2 + 0.3) return clamp((x - STAIR2.x1) / (STAIR2.x2 - STAIR2.x1), 0, 1); if (player.floor === -1 || player.floor === 2) return -1; if (x > STAIR.x1 - 0.15 && x < STAIR.x2 + 0.15 && z > STAIR.z1 - 0.05 && z < STAIR.z2 + 0.3) return clamp((STAIR.x2 - x) / (STAIR.x2 - STAIR.x1), 0, 1); return -1; }
  function groundY(x, z) { if (player.inVan) return 0.8; var t = stairT(x, z);   /* standing in the back of the van: its floor */ if (t >= 0) return UP.y * t; return player.floor === 2 ? ROOF_Y : player.floor === 1 ? UP.y : player.floor === -1 ? BASE.y : 0; }
  function upBox(w, h, d, mat, x, y, z, opts) { opts = opts || {}; opts.floorLevel = 1; return box(w, h, d, mat, x, UP.y + y, z, opts); }
  function buildUpstairs() {
    // floor slab with the stairwell hole (four pieces), ceiling, roof, outer walls
    var slabM = new THREE.MeshStandardMaterial({ color: 0x8a8378, roughness: 0.9 }); var floorM = MAT.planks.clone(); floorM.map = TEX.planks.clone(); floorM.map.needsUpdate = true; floorM.map.repeat.set(8, 6); floorM.bumpMap = TEX.planksBump.clone(); floorM.bumpMap.needsUpdate = true; floorM.bumpMap.repeat.set(8, 6);
    var sy = UP.y - 0.175, HX1 = STAIR.x1 - 0.1, HX2 = STAIR.x2 + 0.1, HZ1 = STAIR.z1 - 0.1, HZ2 = STAIR.z2 + 0.35;
    // the slab is cut round both stairwells: split the floor into cells along every hole edge and skip the cells that are holes
    var holes = [[HX1, HX2, HZ1, HZ2], [STAIR2.x1 - 0.1, STAIR2.x2 + 0.1, STAIR2.z1 - 0.12, STAIR2.z2 + 0.35]], xs = [-ROOM.x, ROOM.x], zs = [-ROOM.z, ROOM.z]; holes.forEach(function (h) { xs.push(h[0], h[1]); zs.push(h[2], h[3]); }); xs.sort(function (p, q) { return p - q; }); zs.sort(function (p, q) { return p - q; });
    for (var xi = 0; xi < xs.length - 1; xi++) for (var zi = 0; zi < zs.length - 1; zi++) { var cw = xs[xi + 1] - xs[xi], cd = zs[zi + 1] - zs[zi]; if (cw < 0.01 || cd < 0.01) continue; var ccx = (xs[xi] + xs[xi + 1]) / 2, ccz = (zs[zi] + zs[zi + 1]) / 2; if (holes.some(function (h) { return ccx > h[0] && ccx < h[1] && ccz > h[2] && ccz < h[3]; })) continue; box(cw, 0.35, cd, slabM, ccx, sy, ccz, { cast: true }); var fl = new THREE.Mesh(new THREE.PlaneGeometry(cw, cd), floorM); fl.rotation.x = -Math.PI / 2; fl.position.set(ccx, UP.y + 0.001, ccz); fl.receiveShadow = true; world.group.add(fl); }
    var ceil = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.x * 2, ROOM.z * 2), MAT.ceiling); ceil.rotation.x = Math.PI / 2; ceil.position.y = UP.y + UP.h - 0.012; world.group.add(ceil);   /* same: the roof slab's underside is at UP.y + UP.h */
    box(ROOM.x * 2 + 0.6, 0.3, ROOM.z * 2 + 0.6, new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 1 }), 0, UP.y + UP.h + 0.2, 0, { cast: true });
    var wallU = MAT.wall;
    box(ROOM.x * 2 + 0.4, UP.h, WALL_T, wallU, 0, UP.y + UP.h / 2, -ROOM.z - WALL_T / 2);                                            // back
    box(WALL_T, UP.h, ROOM.z * 2, wallU, ROOM.x + WALL_T / 2, UP.y + UP.h / 2, 0);                                                 // right
    box(WALL_T, UP.h, ROOM.z * 2, wallU, -ROOM.x - WALL_T / 2, UP.y + UP.h / 2, 0);                                                // left
    box(ROOM.x * 2 + 0.4, 0.9, WALL_T, wallU, 0, UP.y + 0.45, ROOM.z + WALL_T / 2); box(ROOM.x * 2 + 0.4, 0.4, WALL_T, wallU, 0, UP.y + UP.h - 0.2, ROOM.z + WALL_T / 2); // front low + top
    var glassU = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.x * 2, UP.h - 1.3), MAT.glass); glassU.position.set(0, UP.y + 0.9 + (UP.h - 1.3) / 2, ROOM.z); world.group.add(glassU);
    for (var m = -ROOM.x + 3; m < ROOM.x; m += 3) box(0.08, UP.h - 1.3, WALL_T + 0.02, MAT.metal, m, UP.y + 0.9 + (UP.h - 1.3) / 2, ROOM.z + WALL_T / 2);
    box(ROOM.x * 2 + 0.5, 0.95, 0.12, MAT.brick, 0, UP.y + 0.47, ROOM.z + WALL_T + 0.02, { cast: true }); box(ROOM.x * 2 + 0.6, 0.06, 0.2, MAT.trim, 0, UP.y + 0.97, ROOM.z + WALL_T + 0.02, { cast: false });   /* brick spandrel under the upstairs glass, with a stone sill */
    box(ROOM.x * 2 + 0.5, 0.45, 0.12, MAT.brick, 0, UP.y + UP.h - 0.22, ROOM.z + WALL_T + 0.02, { cast: true });
    [-9, -3, 3, 9].forEach(function (x) { box(0.34, UP.h, 0.16, MAT.brick, x, UP.y + UP.h / 2, ROOM.z + WALL_T + 0.02, { cast: true }); });   /* brick piers split the glass into bays */
    // the stairs: steps along x, stringer wall on the open side, handrail; railings round the stairwell upstairs
    var n = 16, rise = UP.y / n, run = (STAIR.x2 - STAIR.x1) / n, sw = STAIR.z2 - STAIR.z1, sz = (STAIR.z1 + STAIR.z2) / 2;
    for (var i = 0; i < n; i++) { box(run, rise, sw, MAT.wood, STAIR.x2 - run * (i + 0.5), rise * (i + 0.5), sz, { cast: true }); box(run, rise * (i + 1), 0.04, MAT.darkwood, STAIR.x2 - run * (i + 0.5), rise * (i + 1) / 2, STAIR.z1 + 0.02, { cast: true }); }
    var railLen = Math.hypot(UP.y, STAIR.x2 - STAIR.x1) + 0.3; var railA = Math.atan2(UP.y, STAIR.x2 - STAIR.x1);
    var rail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, railLen, 10), MAT.metal); rail.rotation.z = Math.PI / 2 + railA; rail.position.set((STAIR.x1 + STAIR.x2) / 2, UP.y / 2 + 0.95, STAIR.z1 + 0.02); world.group.add(rail);
    for (var p = 0; p <= 8; p++) { var px = STAIR.x2 - (STAIR.x2 - STAIR.x1) * p / 8; var py = UP.y * p / 8; box(0.03, 0.9, 0.03, MAT.metal, px, py + 0.45, STAIR.z1 + 0.02); }
    world.obstacles.push({ x1: STAIR.x1 - 0.2, x2: STAIR.x2 + 0.15, z1: STAIR.z1 - 0.06, z2: STAIR.z1 + 0.06, tag: 'stairrail', floorLevel: 'any' });   // open side of the stairs (both floors)
    world.obstacles.push({ x1: STAIR.x2 + 0.05, x2: STAIR.x2 + 0.15, z1: STAIR.z1 - 0.2, z2: STAIR.z2 + 0.4, tag: 'wellrail', floorLevel: 1 });        // upstairs: bottom end of the well
    world.obstacles.push({ x1: STAIR.x1 - 0.2, x2: STAIR.x2 + 0.15, z1: STAIR.z2 + 0.3, z2: STAIR.z2 + 0.4, tag: 'wellrail2', floorLevel: 1 });        // upstairs: wall side of the well
    upBox(STAIR.x2 - STAIR.x1 + 0.4, 0.05, 0.05, MAT.metal, (STAIR.x1 + STAIR.x2) / 2, 1.0, STAIR.z1 - 0.06); for (var q = 0; q <= 6; q++) upBox(0.03, 1.0, 0.03, MAT.metal, STAIR.x1 - 0.2 + (STAIR.x2 - STAIR.x1 + 0.4) * q / 6, 0.5, STAIR.z1 - 0.06);
    upBox(0.05, 0.05, STAIR.z2 - STAIR.z1 + 0.5, MAT.metal, STAIR.x2 + 0.1, 1.0, sz + 0.15); for (var q2 = 0; q2 <= 2; q2++) upBox(0.03, 1.0, 0.03, MAT.metal, STAIR.x2 + 0.1, 0.5, STAIR.z1 - 0.1 + (STAIR.z2 - STAIR.z1 + 0.5) * q2 / 2);
    upBox(STAIR.x2 - STAIR.x1 + 0.4, 0.05, 0.05, MAT.metal, (STAIR.x1 + STAIR.x2) / 2, 1.0, STAIR.z2 + 0.35); for (var q3 = 0; q3 <= 6; q3++) upBox(0.03, 1.0, 0.03, MAT.metal, STAIR.x1 - 0.2 + (STAIR.x2 - STAIR.x1 + 0.4) * q3 / 6, 0.5, STAIR.z2 + 0.35);
    signPlane(['PRIVATE', 'upstairs · staff living'], 1.0, 0.36, -5.0, 2.6, 3.88, Math.PI, { titleColor: '#ff6b6b' });
    // lights upstairs
    [[-6, -5.5], [0, -5.5], [6, -5.5], [-6, 2], [0, 2], [6, 2], [-6, 7], [4, 7]].forEach(function (p) { var fx = box(0.9, 0.06, 0.3, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff3e0, emissiveIntensity: 0.9 }), p[0], UP.y + UP.h - 0.04, p[1], { cast: false }); world.lampFixtures.push(fx); var l = new THREE.PointLight(0xfff3e0, 0.5, 14, 1.6); l.userData.base = 0.5; l.position.set(p[0], UP.y + UP.h - 0.35, p[1]); scene.add(l); world.roomLamps.push(l); });
    // KITCHEN along the back wall: counters, sink, stove, cabinets, fridge
    var kM = new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.6 }); var topM = new THREE.MeshStandardMaterial({ color: 0x3a3f44, roughness: 0.35 });
    upBox(8, 0.9, 0.6, kM, -4, 0.45, -8.6, { solid: true, tag: 'kcounter' }); upBox(8.1, 0.05, 0.65, topM, -4, 0.925, -8.6, { cast: false });
    for (var c = 0; c < 8; c++) { upBox(0.02, 0.02, 0.4, MAT.metal, -7.5 + c, 0.55, -8.32); upBox(0.98, 0.7, 0.3, kM, -7.5 + c, 1.95, -8.75); upBox(0.02, 0.02, 0.3, MAT.metal, -7.5 + c, 1.75, -8.58); }
    upBox(0.7, 0.18, 0.45, new THREE.MeshStandardMaterial({ color: 0xcfd3d6, metalness: 0.7, roughness: 0.3 }), -6, 0.87, -8.6); upBox(0.02, 0.25, 0.02, MAT.metal, -6, 1.07, -8.8); upBox(0.14, 0.02, 0.02, MAT.metal, -5.94, 1.19, -8.8);
    upBox(0.8, 0.02, 0.55, MAT.black, -2.5, 0.96, -8.6); [[-2.7, -8.75], [-2.3, -8.75], [-2.7, -8.45], [-2.3, -8.45]].forEach(function (b) { var ring = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 6, 16), MAT.metal); ring.rotation.x = Math.PI / 2; ring.position.set(b[0], UP.y + 0.975, b[1]); world.group.add(ring); });
    upBox(0.8, 1.9, 0.7, new THREE.MeshStandardMaterial({ color: 0xd8dde2, roughness: 0.4, metalness: 0.2 }), 1.2, 0.95, -8.6, { solid: true, tag: 'kfridge' }); upBox(0.03, 0.5, 0.03, MAT.metal, 0.85, 1.2, -8.22); upBox(0.03, 0.3, 0.03, MAT.metal, 0.85, 0.4, -8.22);
    var fh = upBox(1.0, 2.0, 1.0, MAT.none, 1.2, 1.0, -8.5, { cast: false, receive: false }); interactable(fh, { kind: 'kfridge' });
    signPlane(['KITCHEN', 'fridge: grab a snack · eat at the table or couch'], 1.6, 0.42, -1, 2.55, -ROOM.z + 0.02, 0, { titleColor: '#ffc857' }).position.y += UP.y;
    // small things on the counter: kettle, fruit bowl, plant
    upBox(0.16, 0.18, 0.16, MAT.metal, -7.4, 1.04, -8.6); var bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.1, 0.08, 16), new THREE.MeshStandardMaterial({ color: 0x8a5a2a })); bowl.position.set(-4.5, UP.y + 0.99, -8.6); world.group.add(bowl); [[-4.55, -8.62, 0xd63a2a], [-4.45, -8.55, 0xf0c030], [-4.5, -8.68, 0x6fdc3a]].forEach(function (f) { var fr = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), new THREE.MeshStandardMaterial({ color: f[2] })); fr.position.set(f[0], UP.y + 1.07, f[1]); world.group.add(fr); });
    // LIVING: big TV on the dividing wall (your side of it), couch, coffee table, rug, floor lamp, shelves
    var TVWX = DIVX - 0.1;
    var tvW = 3.2, tvH = 1.8; upBox(0.08, tvH + 0.12, tvW + 0.12, MAT.black, TVWX - 0.08, 1.55, 0.5);
    tv.canvas = document.createElement('canvas'); tv.canvas.width = 1024; tv.canvas.height = 576; tv.tex = new THREE.CanvasTexture(tv.canvas); tv.tex.encoding = THREE.sRGBEncoding;
    tv.mat = new THREE.MeshBasicMaterial({ map: tv.tex }); var scr = new THREE.Mesh(new THREE.PlaneGeometry(tvW, tvH), tv.mat); scr.position.set(TVWX - 0.115, UP.y + 1.55, 0.5); scr.rotation.y = -Math.PI / 2; world.group.add(scr); tv.mesh = scr;
    var tvHit = upBox(0.4, tvH, tvW, MAT.none, TVWX - 0.2, 1.55, 0.5, { cast: false, receive: false }); interactable(tvHit, { kind: 'tv' });
    tv.glow = new THREE.PointLight(0x6fa8ff, 0, 6); tv.glow.position.set(TVWX - 1.0, UP.y + 1.5, 0.5); scene.add(tv.glow);
    upBox(0.4, 0.06, 1.6, MAT.darkwood, TVWX - 0.4, 0.45, 0.5, { solid: true, tag: 'tvstand' }); [[TVWX - 0.3, 0.42], [TVWX - 0.3, 0.98], [TVWX - 0.5, 0.42], [TVWX - 0.5, 0.98]].forEach(function (l) { upBox(0.05, 0.42, 0.05, MAT.metal, l[0], 0.21, l[1] - 0.2); }); upBox(0.3, 0.3, 0.3, MAT.black, TVWX - 0.4, 0.63, 1.2); upBox(0.3, 0.3, 0.3, MAT.black, TVWX - 0.4, 0.63, -0.2);
    signPlane(['🌿', 'grow · rest · repeat'], 0.9, 1.1, -ROOM.x + 0.02, 5.6, 7.0, Math.PI / 2, { bg: '#1a2418', titleColor: '#6fdc8c', line: 'rgba(111,220,140,.4)' });
    world.speakers.push([8.0, UP.y + 2.7, 3.5]); upBox(0.3, 0.42, 0.24, MAT.black, 8.0, 2.7, 3.5);
    buildGrowCam();
    drawTv();
  }

  // ── TV: channels are live textures (desk board, grow-room camera, house news) ──
  var tv = { channel: 0, canvas: null, tex: null, mat: null, mesh: null, glow: null, rt: null, cam: null, lastCam: 0, lastNews: 0 };
  var TV_CHANNELS = ['off', 'desk', 'growcam', 'news'];
  function buildGrowCam() {
    tv.rt = new THREE.WebGLRenderTarget(640, 360); tv.rt.texture.encoding = THREE.sRGBEncoding;
    tv.cam = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 40); tv.cam.position.set(TENT_ORIGIN.x + 3.2, 2.3, TENT_ORIGIN.z + 4.2); tv.cam.lookAt(TENT_ORIGIN.x, 0.8, TENT_ORIGIN.z); scene.add(tv.cam); tv.cam.layers.disable(TOWN_LAYER);
    if (typeof S.tv === 'number') tv.channel = S.tv;
  }
//#if desk
  function tvCycle() { tv.channel = (tv.channel + 1) % TV_CHANNELS.length; S.tv = tv.channel; sfx('click'); toast('📺 ' + { off: 'TV off', desk: 'Live desk', growcam: 'Grow cam', news: 'RF House News' }[TV_CHANNELS[tv.channel]], ''); drawTv(); save(); }
//#else
  function tvCycle() { tv.channel = (tv.channel + 1) % TV_CHANNELS.length; S.tv = tv.channel; sfx('click'); toast('📺 ' + { off: 'TV off', desk: 'Shop dashboard', growcam: 'Grow cam', news: 'RF House News' }[TV_CHANNELS[tv.channel]], ''); drawTv(); save(); }
//#endif
  function drawTv() {
    if (!tv.mat) return; var ch = TV_CHANNELS[tv.channel];
    if (ch === 'off') { tv.mat.map = null; tv.mat.color.setHex(0x05070a); tv.glow.intensity = 0; }
    else if (ch === 'desk') { tv.mat.map = deskBoard.tex; tv.mat.color.setHex(0xffffff); tv.glow.intensity = 0.35; tv.glow.color.setHex(0x6fdc8c); }
    else if (ch === 'growcam') { tv.mat.map = tv.rt.texture; tv.mat.color.setHex(0xffffff); tv.glow.intensity = 0.35; tv.glow.color.setHex(0xffb060); }
    else { tv.mat.map = tv.tex; tv.mat.color.setHex(0xffffff); tv.glow.intensity = 0.35; tv.glow.color.setHex(0x6fa8ff); drawNews(); }
    tv.mat.needsUpdate = true;
  }
  function drawNews() {
    var c = tv.canvas, ctx = c.getContext('2d'), W = c.width, H = c.height;
    ctx.fillStyle = '#0a1420'; ctx.fillRect(0, 0, W, H); var g = ctx.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#12305a'); g.addColorStop(1, '#0a1420'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 90);
    ctx.fillStyle = '#ffffff'; ctx.font = '600 40px "Segoe UI",sans-serif'; ctx.textBaseline = 'top'; ctx.fillText('RF HOUSE NEWS', 30, 22); ctx.font = '22px "Cascadia Mono",Consolas,monospace'; ctx.fillStyle = '#9ad0ff'; ctx.textAlign = 'right'; ctx.fillText(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), W - 30, 34); ctx.textAlign = 'left';
    var y = 120; ctx.font = '600 26px "Segoe UI",sans-serif'; ctx.fillStyle = '#ffc857'; ctx.fillText('TODAY AT THE SHOP', 30, y); y += 40;
    var lines = [ 'cash ' + money(S.bank) + '  ·  level ' + S.level + '  ·  rep ' + Math.floor(S.rep), S.plants.length + ' plants growing  ·  ' + S.batches.length + ' batches curing  ·  stash ' + gram(S.cured.g), 'market ' + S.market.toFixed(2) + '×' + (S.event ? '  ·  ' + S.event.label : ''), 'shop ' + (shop().open ? 'OPEN' : 'CLOSED') + '  ·  ' + dustList().length + ' dusty spots  ·  radio ' + STATIONS[shop().radio].name ];
    ctx.font = '24px "Segoe UI",sans-serif'; ctx.fillStyle = '#e8f1ea'; lines.forEach(function (l) { ctx.fillText(l, 30, y); y += 36; });
    y += 14; ctx.font = '600 26px "Segoe UI",sans-serif'; ctx.fillStyle = '#ffc857'; ctx.fillText('LATEST', 30, y); y += 40; ctx.font = '22px "Segoe UI",sans-serif'; ctx.fillStyle = '#b9c9bd';
    S.log.slice(0, 5).forEach(function (e) { var t = e.t + '  ' + e.msg; while (ctx.measureText(t).width > W - 60 && t.length > 8) t = t.slice(0, -4) + '…'; ctx.fillText(t, 30, y); y += 32; });
    ctx.fillStyle = '#c94a3a'; ctx.fillRect(0, H - 50, W, 50); ctx.fillStyle = '#fff'; ctx.font = '600 22px "Segoe UI",sans-serif'; var ticker = 'BREAKING: ' + (S.customer ? S.customer.who + ' is waiting at the window' : 'quiet at the window') + '   ·   ' + (S.plants.some(function (p) { return p.progress >= 1; }) ? 'plants ready to harvest' : 'plants growing nicely') + '   ·   next delivery van: whenever you order'; var off = (now() / 25) % (ctx.measureText(ticker).width + W); ctx.fillText(ticker, W - off, H - 38);
    tv.tex.needsUpdate = true;
  }
  var _tvFrustum = new THREE.Frustum(), _tvPM = new THREE.Matrix4();
  function tvInView() {   /* is the screen inside the player's view? one frustum per call, from the last frame's camera */
    if (!tv.mesh || player.floor !== 1 || sec.view.on) return false;
    _tvPM.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); _tvFrustum.setFromProjectionMatrix(_tvPM);
    return _tvFrustum.intersectsObject(tv.mesh);
  }
  function updateTv(dt) {
    if (!tv.mat) return; var ch = TV_CHANNELS[tv.channel]; var t = now();
    if (ch === 'growcam' && t - tv.lastCam > 500) { tv.lastCam = t; if (tvInView()) { tv.mesh.visible = false; pipRender(tv.rt, tv.cam); tv.mesh.visible = true; } }
    if (ch === 'news' && t - tv.lastNews > 120) { tv.lastNews = t; if (tvInView()) drawNews(); }
  }

