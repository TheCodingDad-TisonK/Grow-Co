//@ the log, toasts and the generated sound effects
  // ── Log / toast / sound ───────────────────────────────────────────
  function logEvent(msg, kind) {
    S.log.unshift({ t: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), msg: msg, kind: kind || '' });
    if (S.log.length > 60) S.log.pop();
    feedPush(msg, kind);
  }
  function feedPush(msg, kind) {
    var feed = $('h-feed'); if (!feed) return;
    var d = document.createElement('div'); d.className = kind || '';
    d.innerHTML = '<span class="t">' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + '</span>' + msg;
    feed.appendChild(d);
    while (feed.children.length > 6) feed.removeChild(feed.firstChild);
    setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 14000);
  }
  function toast(msg, kind) {
    var box = $('h-toasts'); if (!box) return;
    var d = document.createElement('div'); d.className = kind || ''; d.innerHTML = msg; box.appendChild(d);
    while (box.children.length > 3) box.removeChild(box.firstChild);
    setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 2400);
    if (kind === 'bad') sfx('bad'); else if (kind === 'rare') sfx('rare'); else sfx('ok');
  }
  var AC = null, sfxBus = null, hum = null;
  function audio() { if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); sfxBus = AC.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(AC.destination); } if (AC.state === 'suspended') AC.resume(); return AC; }
  // small synth helpers: everything is generated, no audio files
  function sTone(type, f0, t, dur, gain, opts) { opts = opts || {}; var o = AC.createOscillator(), gn = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); if (opts.f1) o.frequency.exponentialRampToValueAtTime(opts.f1, t + dur); gn.gain.setValueAtTime(0.0001, t); gn.gain.linearRampToValueAtTime(gain, t + (opts.attack || 0.008)); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur); var dest = sfxBus; if (opts.lp) { var f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = opts.lp; gn.connect(f); f.connect(dest); } else gn.connect(dest); o.connect(gn); o.start(t); o.stop(t + dur + 0.05); }
  function sNoise(t, dur, gain, opts) { opts = opts || {}; var len = Math.floor(AC.sampleRate * dur); var buf = AC.createBuffer(1, len, AC.sampleRate); var d = buf.getChannelData(0); for (var i = 0; i < len; i++) { var env = opts.shape === 'swell' ? Math.sin(i / len * Math.PI) : opts.shape === 'flat' ? 1 : (1 - i / len); d[i] = (Math.random() * 2 - 1) * env; } var src = AC.createBufferSource(); src.buffer = buf; var f = AC.createBiquadFilter(); f.type = opts.type || 'highpass'; f.frequency.value = opts.freq || 4000; if (opts.q) f.Q.value = opts.q; var gn = AC.createGain(); gn.gain.setValueAtTime(gain, t); if (opts.fade) gn.gain.exponentialRampToValueAtTime(0.0001, t + dur); src.connect(f); f.connect(gn); gn.connect(sfxBus); src.start(t); }
  function sThud(t, f, gain, dur) { sTone('sine', f, t, dur || 0.12, gain, { f1: f * 0.5 }); sNoise(t, 0.05, gain * 0.5, { type: 'lowpass', freq: 600 }); }
  function sBeep(t, f, dur, gain) { sTone('square', f, t, dur || 0.08, gain || 0.05, { lp: 3000 }); }
  var SFX = {
    gunshot: function (t) { sNoise(t, 0.2, 0.5, { type: 'lowpass', freq: 2400, fade: true }); sTone('square', 150, t, 0.12, 0.22, { f1: 50 }); },
    ak: function (t) { sNoise(t, 0.11, 0.45, { type: 'lowpass', freq: 2900, fade: true }); sTone('square', 175, t, 0.06, 0.18, { f1: 60 }); },
    rifle: function (t) { sNoise(t, 0.5, 0.75, { type: 'lowpass', freq: 3000, fade: true }); sTone('square', 110, t, 0.2, 0.3, { f1: 32 }); sNoise(t + 0.75, 0.04, 0.12, { freq: 2200 }); sNoise(t + 0.95, 0.05, 0.12, { freq: 1800 }); },
    shotgun: function (t) { sNoise(t, 0.34, 0.6, { type: 'lowpass', freq: 1500, fade: true }); sTone('sawtooth', 95, t, 0.22, 0.28, { f1: 40 }); sNoise(t + 0.5, 0.05, 0.1, { freq: 2600 }); sNoise(t + 0.62, 0.05, 0.1, { freq: 2200 }); },
    zap:     function (t) { for (var i = 0; i < 9; i++) sTone('square', 900 + Math.random() * 1500, t + i * 0.04, 0.035, 0.05); },
    siren:   function (t) { for (var i = 0; i < 6; i++) sTone('sine', i % 2 ? 640 : 860, t + i * 0.32, 0.31, 0.07); },
    ok:      function (t) { sTone('sine', 520, t, 0.07, 0.07); sTone('sine', 780, t + 0.07, 0.1, 0.07); },
    bad:     function (t) { sTone('sawtooth', 220, t, 0.14, 0.05, { lp: 1200 }); sTone('sawtooth', 160, t + 0.12, 0.16, 0.05, { lp: 1000 }); },
    rare:    function (t) { [660, 880, 1320, 1760].forEach(function (f, i) { sTone('sine', f, t + i * 0.07, 0.16, 0.07); }); },
    click:   function (t) { sTone('sine', 900, t, 0.03, 0.06); sNoise(t, 0.02, 0.05, { freq: 5000 }); },
    cash:    function (t) { [1175, 1568, 2093, 2637].forEach(function (f, i) { sTone('sine', f, t + i * 0.045, 0.14, 0.06); }); sNoise(t, 0.12, 0.08, { freq: 7000, fade: true }); },
    coins:   function (t) { for (var i = 0; i < 7; i++) { sTone('sine', 2400 + Math.random() * 1800, t + i * 0.035 + Math.random() * 0.02, 0.06, 0.035); } sNoise(t, 0.25, 0.06, { freq: 6000, fade: true }); },
    water:   function (t) { sNoise(t, 0.6, 0.16, { type: 'bandpass', freq: 900, q: 0.6, shape: 'swell' }); for (var i = 0; i < 5; i++) sTone('sine', 1400 + Math.random() * 900, t + 0.1 + i * 0.09, 0.05, 0.03, { f1: 500 }); },
    spray:   function (t) { sNoise(t, 0.35, 0.14, { freq: 3500, shape: 'flat', fade: true }); sNoise(t + 0.4, 0.3, 0.12, { freq: 3500, shape: 'flat', fade: true }); },
    feed:    function (t) { sNoise(t, 0.4, 0.1, { type: 'bandpass', freq: 1500, q: 1, shape: 'swell' }); sTone('sine', 700, t + 0.3, 0.12, 0.04, { f1: 400 }); },
    plant:   function (t) { sNoise(t, 0.25, 0.14, { type: 'lowpass', freq: 900, fade: true }); sNoise(t + 0.2, 0.2, 0.1, { type: 'lowpass', freq: 700, fade: true }); },
    harvest: function (t) { sNoise(t, 0.05, 0.14, { freq: 6000 }); sTone('triangle', 2200, t, 0.05, 0.04, { f1: 900 }); sNoise(t + 0.12, 0.05, 0.14, { freq: 6000 }); sTone('triangle', 2400, t + 0.12, 0.05, 0.04, { f1: 900 }); sNoise(t + 0.25, 0.3, 0.06, { type: 'bandpass', freq: 2500, fade: true }); },
    hang:    function (t) { sNoise(t, 0.35, 0.08, { type: 'bandpass', freq: 2800, q: 0.7, fade: true }); sTone('triangle', 600, t + 0.2, 0.08, 0.03, { f1: 300 }); },
    jar:     function (t) { sTone('sine', 1900, t, 0.25, 0.06, { f1: 1850 }); sTone('sine', 2850, t + 0.02, 0.18, 0.03); sNoise(t, 0.02, 0.06, { freq: 5000 }); },
    pour:    function (t) { sNoise(t, 0.7, 0.1, { type: 'bandpass', freq: 1800, q: 1.2, shape: 'swell' }); },
    bag:     function (t) { sNoise(t, 0.3, 0.12, { freq: 3000, fade: true }); sNoise(t + 0.18, 0.2, 0.1, { freq: 3500, fade: true }); sNoise(t + 0.42, 0.06, 0.12, { freq: 2500 }); },
    roll:    function (t) { for (var i = 0; i < 4; i++) sNoise(t + i * 0.11, 0.09, 0.08, { freq: 2200 + i * 500, fade: true }); sNoise(t + 0.5, 0.15, 0.06, { freq: 4500, fade: true }); },
    pickup:  function (t) { sNoise(t, 0.05, 0.08, { type: 'lowpass', freq: 1800 }); sTone('sine', 300, t, 0.08, 0.05, { f1: 200 }); },
    putdown: function (t) { sThud(t, 180, 0.09, 0.12); sNoise(t, 0.04, 0.05, { type: 'lowpass', freq: 1500 }); },
    crate:   function (t) { sThud(t, 120, 0.14, 0.18); sNoise(t + 0.02, 0.1, 0.08, { type: 'lowpass', freq: 900, fade: true }); },
    step:    function (t, o) { var f = o === 'tile' ? 260 : o === 'planks' ? 150 : o === 'rubber' ? 80 : o === 'outside' ? 110 : 120; sThud(t, f, o === 'rubber' ? 0.025 : 0.04, 0.07); if (o === 'tile') sNoise(t, 0.03, 0.03, { freq: 3500 }); if (o === 'outside') sNoise(t, 0.06, 0.04, { type: 'bandpass', freq: 1200, q: 0.5 }); },
    door:    function (t) { sTone('sawtooth', 180, t, 0.35, 0.02, { f1: 260, lp: 700 }); sThud(t + 0.38, 220, 0.07, 0.08); sNoise(t + 0.38, 0.03, 0.06, { freq: 3000 }); },
    curtain: function (t) { sNoise(t, 0.5, 0.07, { type: 'bandpass', freq: 1800, q: 0.5, shape: 'swell' }); for (var i = 0; i < 6; i++) sTone('sine', 3200 + Math.random() * 800, t + i * 0.07, 0.03, 0.015); },
    roller:  function (t) { for (var i = 0; i < 14; i++) { sNoise(t + i * 0.085, 0.07, 0.07, { type: 'lowpass', freq: 500 + (i % 2) * 300 }); sTone('square', 60 + (i % 3) * 8, t + i * 0.085, 0.08, 0.02, { lp: 300 }); } sThud(t + 1.25, 90, 0.1, 0.15); },
    gate:    function (t) { sTone('sawtooth', 320, t, 0.6, 0.02, { f1: 240, lp: 1200 }); sTone('sawtooth', 480, t + 0.05, 0.5, 0.012, { f1: 380, lp: 1500 }); sThud(t + 0.7, 400, 0.05, 0.06); },
    drawer:  function (t) { sNoise(t, 0.18, 0.08, { type: 'bandpass', freq: 1200, q: 0.8, fade: true }); sTone('sine', 2600, t + 0.15, 0.3, 0.05); sThud(t + 0.16, 300, 0.05, 0.05); },
    card:    function (t) { sBeep(t, 1800, 0.06, 0.04); sBeep(t + 0.1, 1800, 0.06, 0.04); sNoise(t + 0.3, 0.45, 0.05, { type: 'bandpass', freq: 3000, q: 2, shape: 'flat', fade: true }); sBeep(t + 0.8, 2400, 0.12, 0.04); },
    vend:    function (t) { sBeep(t, 1200, 0.05, 0.03); sTone('square', 80, t + 0.15, 0.25, 0.03, { lp: 400 }); sThud(t + 0.5, 140, 0.12, 0.15); sNoise(t + 0.5, 0.15, 0.08, { type: 'lowpass', freq: 1200, fade: true }); sThud(t + 0.62, 200, 0.06, 0.06); },
    coffee:  function (t) { sNoise(t, 0.9, 0.06, { type: 'bandpass', freq: 400, q: 0.8, shape: 'flat', fade: true }); sTone('sawtooth', 90, t, 0.9, 0.02, { lp: 500 }); sNoise(t + 1.0, 1.2, 0.07, { type: 'bandpass', freq: 3500, q: 0.4, shape: 'swell' }); sTone('sine', 1500, t + 2.2, 0.15, 0.04); },
    arcade:  function (t) { [880, 1175, 1568, 1319, 1760].forEach(function (f, i) { sBeep(t + i * 0.09, f, 0.07, 0.035); }); sBeep(t + 0.6, 440, 0.2, 0.03); },
    engine:  function (t) { for (var i = 0; i < 24; i++) sTone('sawtooth', 55 + Math.sin(i * 0.7) * 6, t + i * 0.1, 0.12, 0.03, { lp: 220 }); sNoise(t, 2.4, 0.03, { type: 'lowpass', freq: 300, shape: 'flat' }); },
    beep:    function (t) { for (var i = 0; i < 5; i++) sBeep(t + i * 0.5, 1000, 0.18, 0.035); },
    bell:    function (t) { sTone('sine', 2093, t, 0.6, 0.06); sTone('sine', 2637, t + 0.005, 0.5, 0.04); sTone('sine', 3136, t + 0.01, 0.4, 0.02); },
    chime:   function (t) { [523, 659, 784, 1047].forEach(function (f, i) { sTone('sine', f, t + i * 0.16, 0.6, 0.05); }); },
    lighter: function (t) { sNoise(t, 0.05, 0.14, { freq: 5000 }); sNoise(t + 0.08, 0.05, 0.12, { freq: 5000 }); sNoise(t + 0.2, 0.9, 0.04, { type: 'bandpass', freq: 2500, q: 0.4, shape: 'swell' }); },
    inhale:  function (t) { sNoise(t, 0.9, 0.05, { type: 'bandpass', freq: 1800, q: 0.6, shape: 'swell' }); },
    exhale:  function (t) { sNoise(t, 1.2, 0.045, { type: 'bandpass', freq: 900, q: 0.5, shape: 'swell' }); },
    sit:     function (t) { sTone('sawtooth', 140, t, 0.25, 0.02, { f1: 100, lp: 500 }); sNoise(t, 0.2, 0.06, { type: 'bandpass', freq: 800, q: 0.7, fade: true }); },
    bed:     function (t) { sNoise(t, 0.6, 0.06, { type: 'bandpass', freq: 600, q: 0.5, shape: 'swell' }); sTone('sine', 330, t + 0.2, 0.5, 0.03, { f1: 220 }); },
    vault:   function (t) { for (var i = 0; i < 6; i++) sTone('square', 1200, t + i * 0.06, 0.02, 0.02, { lp: 2000 }); sThud(t + 0.45, 70, 0.16, 0.3); sTone('sawtooth', 120, t + 0.5, 0.5, 0.02, { f1: 80, lp: 400 }); },
    atm:     function (t) { sBeep(t, 1500, 0.06, 0.035); sBeep(t + 0.12, 1500, 0.06, 0.035); sBeep(t + 0.3, 2000, 0.1, 0.035); sNoise(t + 0.5, 0.5, 0.05, { type: 'bandpass', freq: 2500, q: 2, shape: 'flat', fade: true }); },
    type:    function (t) { for (var i = 0; i < 6; i++) { sNoise(t + i * 0.07 + Math.random() * 0.02, 0.025, 0.06, { freq: 3000 + Math.random() * 2000 }); } },
    panel:   function (t) { sNoise(t, 0.12, 0.05, { type: 'bandpass', freq: 1500, q: 0.6, shape: 'swell' }); sTone('sine', 700, t, 0.08, 0.04, { f1: 1000 }); },
    close:   function (t) { sTone('sine', 900, t, 0.08, 0.04, { f1: 600 }); sNoise(t, 0.06, 0.04, { type: 'bandpass', freq: 1500, q: 0.6, fade: true }); },
    rustle:  function (t) { sNoise(t, 0.25, 0.08, { type: 'bandpass', freq: 2500, q: 0.6, fade: true }); },
    snip:    function (t) { sNoise(t, 0.04, 0.12, { freq: 6000 }); sTone('triangle', 2500, t, 0.04, 0.04, { f1: 1000 }); },
    dust:    function (t) { sNoise(t, 0.3, 0.07, { type: 'bandpass', freq: 1200, q: 0.5, shape: 'swell' }); sNoise(t + 0.32, 0.3, 0.07, { type: 'bandpass', freq: 1200, q: 0.5, shape: 'swell' }); },
    swing:   function (t) { sNoise(t, 0.22, 0.09, { type: 'bandpass', freq: 1200, q: 0.5, shape: 'swell' }); sTone('sine', 300, t, 0.2, 0.02, { f1: 900 }); },
    hit:     function (t) { sThud(t, 110, 0.18, 0.2); sNoise(t, 0.08, 0.14, { type: 'lowpass', freq: 2500 }); sNoise(t + 0.02, 0.04, 0.1, { freq: 4000 }); },
    alarm:   function (t) { for (var i = 0; i < 4; i++) { sTone('square', 880, t + i * 0.3, 0.14, 0.03, { lp: 2500 }); sTone('square', 660, t + i * 0.3 + 0.15, 0.14, 0.03, { lp: 2500 }); } },
    levelup: function (t) { [523, 659, 784, 1047, 1319].forEach(function (f, i) { sTone('sine', f, t + i * 0.08, 0.35, 0.06); }); sNoise(t + 0.4, 0.4, 0.04, { freq: 6000, fade: true }); }
  };
  function sfx(kind, opt) {
    if (!SET.sound) return;
    try { audio(); var fn = SFX[kind] || SFX.click; fn(AC.currentTime, opt); } catch (e) {}
  }
  // one continuous hum for the dehumidifiers, fading with distance to the nearest running unit
  function humUpdate(level) { if (!SET.sound) { if (hum) hum.g.gain.value = 0; return; } if (level <= 0.001 && !hum) return; try { audio(); if (!hum) { var o1 = AC.createOscillator(), o2 = AC.createOscillator(), gn = AC.createGain(), f = AC.createBiquadFilter(); o1.type = 'sawtooth'; o1.frequency.value = 58; o2.type = 'sine'; o2.frequency.value = 116; f.type = 'lowpass'; f.frequency.value = 260; gn.gain.value = 0; o1.connect(f); o2.connect(f); f.connect(gn); gn.connect(sfxBus); o1.start(); o2.start(); hum = { g: gn }; } hum.g.gain.setTargetAtTime(level * 0.06, AC.currentTime, 0.2); } catch (e) {}
  }

  function gainXp(n) {
    S.xp += n;
    while (S.xp >= XP_PER_LEVEL(S.level)) {
      S.xp -= XP_PER_LEVEL(S.level); S.level++;
      logEvent('Level up. You\'re now level ' + S.level, 'rare');
      toast('🎉 Level ' + S.level, 'rare');
      STRAINS.filter(function (s) { return s.lvl === S.level; }).forEach(function (s) { logEvent('Unlocked strain: ' + s.name, 'rare'); });
      burst(player.pos.x, 1.2, player.pos.z, 0xffd766, 40, 'up');
    }
  }
  // -- Prices ---------------------------------------------------------
  // A gram sits in a real retail band: about $5.70 for plain flower, about $15 for top shelf.
  // Everything that lifts the price is ADDED into one premium, never multiplied together: the old
  // chain of seven multipliers could compound a $6 gram into a $100 one.
  var ECON = {
    baseGram: 5.5,        // $/g, plain low-grade flower at an average market
    gradeExp: 0.8,        // quality x potency, with diminishing returns
    repCap: 0.10,         // reputation is worth at most +10% on price; mostly it buys footfall
    brandBonus: 0.04, lateBonus: 0.05, chillBonus: 0.02,
    bagMarkup: 1.08,      // an eighth carries a packaging premium
    jointMarkup: 1.35,    // a pre-roll carries a convenience premium
    cookieShare: 0.40,    // one cookie is worth 0.40 x the gram it came from (six to a gram)
    excise: 0.15,         // sales tax inside the shelf price, held back and paid with the monthly bill
    taxRate: 0.10,        // business tax on the month's gross...
    taxHighRate: 0.20,    // ...and on the part of a big month over taxHighFrom, so a finished shop still has a bill that grows with it
    taxHighFrom: 60000
  };
  function gradeMult(q, thc) { return Math.pow((0.6 + (q / 100) * 0.8) * thc, ECON.gradeExp); }
  function premiumMult() { return 1 + Math.min(ECON.repCap, S.rep / 1000) + (hasLic('brand') ? ECON.brandBonus : 0) + (hasLic('latehours') && nightNow() ? ECON.lateBonus : 0) + (S.chill && S.chill.until > now() ? ECON.chillBonus : 0); }
  function repMult() { return premiumMult(); }
  function gramValue(q, thc) { return ECON.baseGram * gradeMult(q, thc) * S.market * premiumMult() * (shop().markup || 1); }
  // Packed goods are priced off the weight that actually left the stash, so the digital scale and the
  // pre-rolled cones now trade price for volume instead of handing out free margin forever.
  function bagPrice(q, thc) { return gramValue(q, thc) * bagGrams() * ECON.bagMarkup; }
  function jointPrice(q, thc) { return gramValue(q, thc) * jointGrams() * ECON.jointMarkup; }
  function cookiePrice(q, thc) { return gramValue(q, thc) * ECON.cookieShare; }

  // -- Fixed costs ----------------------------------------------------
  // A grow-op's month is rent, power and payroll. None of that existed before, which is why margins
  // never compressed as the business grew. Bills fall every morning whether or not anything is ready
  // to sell, so a long grow has to be financed rather than simply waited out.
  var COST = {
    rentBase: 20,          // the unit itself, per day
    rentPerSlot: 7,        // floor space for every tent slot
    rentBasement: 35,      // the tobacco works downstairs
    rentBranch: 90,        // the second shop
    branchManager: 120,    // the one person who runs it, a flat day rate
    guardWage: 60,         // the security guard on the door, for any day he is on shift
    driverKeep: 6,         // packs of each kind the driver leaves on the rack for round jobs
    rentFreeDays: 10,      // a fit-out period before the first rent falls, as a real lease gives you
    powerBase: 6,          // shop lights, fridge, till, security
    waterPerPlant: 0.4,
    payRate: 220,          // a day of one employee, fully loaded: wage, payroll tax and cover
    freeSlots: 8,          // up to eight slots is still a job one person can do
    slotsPerGrower: 3,     // past that, one more grower for every three further slots
    processPerGram: 0.55,  // trimming, lab testing and compliance on every gram harvested
    arrearsRep: 2          // reputation lost for every day the bills go unpaid
  };
  function headcount() {   // nobody runs a commercial grow room and a basement works on their own; the branch has its own manager on the bill
    return Math.max(0, Math.ceil((slots() - COST.freeSlots) / COST.slotsPerGrower)) + (hasLic('tobacco') ? 2 : 0);
  }
  function spendOp(n) {   // an operating cost that falls outside the morning bill
    if (n <= 0) return 0;
    var B = books(), paid = drawFunds(n);
    B.dayOther += paid; B.monthOther += paid;
    if (paid < n - 0.5) B.arrears += n - paid;
    return paid;
  }
  function books() {
    if (!S.books) S.books = { monthGross: 0, dayGross: 0, exciseDue: 0, lastDayCosts: 0, arrears: 0, month: 1, lastBill: null, dayOther: 0, monthOther: 0 };
    if (S.books.dayOther === undefined) { S.books.dayOther = 0; S.books.monthOther = 0; }   // saves written before production costs existed
    return S.books;
  }
  function bookSale(total) {   // every dollar of trade passes through here; the taxman takes his cut of it later
    var B = books();
    S.stats.earned = (S.stats.earned || 0) + total;
    B.monthGross += total; B.dayGross += total; B.exciseDue += total * ECON.excise;
  }
  function billLines() {   // what the morning bill is made of, itemised so the P&L panel can show it
    var X = xs(), L = lightObj(), sl = slots(), solar = S.upgrades.solar ? 0.65 : 1;
    var free = (S.day || 1) <= COST.rentFreeDays;
    var rent = free ? 0 : COST.rentBase + sl * COST.rentPerSlot + (hasLic('tobacco') ? COST.rentBasement : 0) + (X.branch ? COST.rentBranch : 0);
    var power = (COST.powerBase + sl * (L.draw || 0) + (S.upgrades.hvac ? 8 : 0) + (S.upgrades.security2 ? 3 : 0) + (S.upgrades.bagline ? 4 : 0)) * solar;
    var roster = (X.staff.driver ? 1 : 0) + (X.staff.night ? 1 : 0) + (X.staff.operator ? (hasLic('tobacco') ? 2 : 1) : 0);   /* roster hires are staff too; the operator runs the basement, which covers the two it needs */
    var hired = crewList().filter(function (w) { return !w.off; }).length + roster, need = headcount();
    var rows = [
      { k: 'Rent', v: rent, d: free ? 'fit-out period, rent free until day ' + (COST.rentFreeDays + 1) : sl + ' slots' + (X.branch ? ' + branch' : '') + (hasLic('tobacco') ? ' + basement' : '') },
      { k: 'Power', v: power, d: L.name + ' over ' + sl + ' slots' + (S.upgrades.solar ? ', solar roof taking 35% off' : '') },
      { k: 'Water', v: S.plants.length * COST.waterPerPlant, d: S.plants.length + ' plants in the tent' },
      { k: 'Payroll', v: Math.max(0, need - hired) * COST.payRate, d: need ? need + ' staff the place needs, ' + Math.min(need, hired) + ' of them covered by people you hired' : 'just you, for now' }
    ];
    if (!guardOff() && !free) rows.push({ k: 'Guard', v: COST.guardWage, d: 'the guard on the door. Send him home and there\'s no wage that day' });   /* his wage starts with the rent: a new shop has no takings yet */
    if (X.branch) rows.push({ k: 'Branch manager', v: COST.branchManager, d: 'runs Green Leaf for you, a flat day rate' });
    return rows;
  }
  function dailyFixed() { return billLines().reduce(function (a, r) { return a + r.v; }, 0); }
  function drawFunds(n) {   // a bill comes out of the bank first, then the vault, then the till
    var need = n, take;
    take = Math.min(S.bank, need); S.bank -= take; need -= take;
    if (need > 0) { take = Math.min(S.vault, need); S.vault -= take; need -= take; }
    if (need > 0) { take = Math.min(S.till, need); S.till -= take; need -= take; }
    return n - need;   // what was actually paid
  }
  function payBills(offline) {
    var B = books(), rows = billLines();
    var fixed = rows.reduce(function (a, r) { return a + r.v; }, 0);   // the staff the place needs; payWages then settles the named crew on top
    var paid = drawFunds(fixed), short = fixed - paid;
    B.lastBill = { day: S.day, rows: rows, paid: paid, short: short };
    B.lastDayCosts = fixed + B.dayOther; B.dayGross = 0; B.dayOther = 0;
    if (short > 0.5) {
      B.arrears += short; S.rep = Math.max(0, S.rep - COST.arrearsRep);
      logEvent('Bills came to ' + money(fixed) + ' and only ' + money(paid) + ' was there: ' + money(short) + ' into arrears, rep -' + COST.arrearsRep, 'bad');
      if (!offline) toast('Bills unpaid: ' + money(short) + ' into arrears', 'bad');
    } else {
      logEvent('Morning bills paid: ' + money(fixed) + ' (' + rows.slice(0, 3).map(function (r) { return r.k.toLowerCase() + ' ' + money(r.v); }).join(', ') + ')', '');
      if (B.arrears > 0.5) { var cl = drawFunds(Math.min(B.arrears, S.bank)); if (cl > 0.5) { B.arrears -= cl; logEvent('Paid ' + money(cl) + ' off the arrears' + (B.arrears > 0.5 ? ', ' + money(B.arrears) + ' still owing' : ', all square'), B.arrears > 0.5 ? '' : 'good'); } }
    }
    payWages(offline);
    monthlyTax(offline);
  }
  function bizTax(gross) { return Math.min(gross, ECON.taxHighFrom) * ECON.taxRate + Math.max(0, gross - ECON.taxHighFrom) * ECON.taxHighRate; }
  function taxDue() { var B = books(); return Math.round(B.exciseDue + bizTax(B.monthGross)); }
  function taxDay() { return (Math.floor(((S.day || 1) - 1) / 28) + 1) * 28 + 1; }
  function monthlyTax(offline) {
    var B = books(), m = Math.floor(((S.day || 1) - 1) / 28) + 1;
    if (m === B.month) return;
    B.month = m;
    var bill = taxDue(), gross = B.monthGross;
    B.exciseDue = 0; B.monthGross = 0; B.monthOther = 0;
    if (bill <= 0) return;
    var paid = drawFunds(bill), short = bill - paid;
    if (short > 0.5) {
      B.arrears += short; S.rep = Math.max(0, S.rep - 5);
      logEvent('Tax on ' + money(gross) + ' of trade came to ' + money(bill) + ' and only ' + money(paid) + ' was there, rep -5', 'bad');
      if (!offline) toast('Tax bill short by ' + money(short), 'bad');
    } else {
      logEvent('Tax paid: ' + money(bill) + ' on ' + money(gross) + ' of trade last month', '');
      if (!offline) toast('Tax bill paid: ' + money(bill), '');
    }
  }
  function daysText(ms) {   // grow times span days now, so minutes stopped being the useful unit
    var d = ms / 60000 / (+SET.dayLength || 20);
    return d >= 1 ? (Math.round(d * 10) / 10) + ' days' : Math.ceil(ms / 60000) + ' min';
  }
  function unitPrice(kind, q, thc) { return kind === 'bags' ? bagPrice(q, thc) : kind === 'cookies' ? cookiePrice(q, thc) : jointPrice(q, thc); }
  function kindName(kind, n) { return kind === 'bags' ? (n === 1 ? 'bag' : 'bags') : kind === 'cookies' ? (n === 1 ? 'cookie' : 'cookies') : (n === 1 ? 'joint' : 'joints'); }

