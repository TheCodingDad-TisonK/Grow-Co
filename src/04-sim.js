//@ the sim engine: growth, drying, curing, events, customers arriving, ID cards
  // ── Sim engine (same rules as the 2D game) ────────────────────────
  function step(dt, offline) {
    var L = lightObj(); var auto = !!S.upgrades.autowater;
    { var dKey = SET.dayNight === 'cycle' ? 'clock' : 'dayAcc'; S[dKey] = (+S[dKey] || 0) + dt / 60 / (+SET.dayLength || 20) * 24;   /* with the sky pinned to one hour the days still pass, so rent, wages and tax still fall */ var rolled = 0; while (S[dKey] >= 24) { if (offline && rolled >= 1) { S[dKey] %= 24; break; }   /* time away turns the calendar one day at most: the bills fall once, not once for every day the window was shut */ rolled++; S[dKey] -= 24; S.day = (S.day || 1) + 1; S.regDay = S.day; S.regSold = 0; payBills(offline); expansionNewDay(offline); if (binsFull()) { S.rep = Math.max(0, S.rep - 1); logEvent('🗑️ A full bin stood all night and the place smells of it (rep -1)', 'bad'); } if (!offline) { logEvent('🌅 Day ' + S.day + ' begins', ''); toast('🌅 Day ' + S.day, ''); sfx('chime'); } var loose = S.till + coinTotal() + S.tips; if (loose > 0) logEvent('🧾 Overnight: ' + money(S.till) + ' in the till, ' + money(coinTotal()) + ' in the machines, ' + money(S.tips) + ' in the tip jar. Empty them into the vault.', ''); } }
    creditPending(offline); updateLogistics(dt, offline);
    // humidity: each room drifts toward its moisture load; a running dehumidifier pulls it down to its target
    var pull = S.upgrades.hvac ? 4.0 : S.upgrades.dehumid ? 1.6 : 0.8; var wetBatches = S.batches.filter(function (b) { return !b.cured; }).length;
    var loads = { grow: 60 + S.plants.length * 1.2, dry: 58 + wetBatches * 2.5 }; if (S.upgrades.hvac) { loads.grow -= 6; loads.dry -= 6; }
    ['grow', 'dry'].forEach(function (z) { var rh = S.rh[z]; rh += (loads[z] - rh) * Math.min(1, 0.03 * dt); var tgt = S.dehum[z]; if (tgt > 0 && rh > tgt) rh = Math.max(tgt, rh - pull * dt); S.rh[z] = clamp(rh, 30, 95); });
    for (var i = 0; i < S.plants.length; i++) {
      var p = S.plants[i];
      if (p.progress < 1) {
        var thirstPen = auto ? 1 : (p.thirst > 0.8 ? 0.35 : p.thirst > 0.5 ? 0.7 : 1);
        var rate = (1000 / strainById(p.strain).growMs) * L.spd * thirstPen * (S.upgrades.hydro ? 1.12 : 1) * (hasLic('cult2') ? 1.05 : 1) * (S.upgrades.skylight ? 1.06 : 1);
        var was = p.progress;
        p.progress = clamp(p.progress + rate * dt, 0, 1);
        if (!offline && was < 1 && p.progress >= 1) { logEvent('🌸 A ' + strainById(p.strain).name + ' is ready to harvest', 'good'); }
      }
      if (S.upgrades.doser && !p.fed && p.progress > 0.35) { p.fed = true; p.quality = clamp(p.quality + 12, 20, 100); if (!offline) logEvent('🧪 The doser fed a ' + strainById(p.strain).name, ''); }
      var thWas = p.thirst, thRate = THIRST_RATE * (S.rh.grow < 42 ? 1.3 : 1);
      if (!auto) p.thirst = clamp(p.thirst + thRate * dt, 0, 1);
      if (!auto && p.thirst > 0.7) { var dryDt = thWas > 0.7 ? dt : Math.max(0, dt - (0.7 - thWas) / thRate); p.quality = clamp(p.quality - 0.5 * dryDt, 20, 100); }   /* only the part of the step actually spent thirsty costs quality */
      if (p.hazard) p.quality = clamp(p.quality - 0.8 * dt, 20, 100);
      else if (!offline && p.progress > 0.4 && p.progress < 1) {
        var hc = HAZARD_CHANCE * (S.upgrades.security2 ? 0.25 : S.upgrades.security ? 0.5 : 1) * moldMult();
        if (Math.random() < hc * dt) { p.hazard = !S.upgrades.ozone && Math.random() < (S.rh.grow > 60 ? 0.7 : 0.4) ? 'mold' : 'pest'; logEvent('⚠ ' + (p.hazard === 'pest' ? 'Spider mites' : 'Mould') + ' hit a ' + strainById(p.strain).name + '. Spray it before it spreads.', 'bad'); toast('⚠ ' + (p.hazard === 'pest' ? 'Pest' : 'Mould') + ' outbreak', 'bad'); }
      }
    }
    var rackFast = S.upgrades.rack2 ? 2.4 : S.upgrades.rack ? 1.6 : 1, cureCap = CURE_CAP_BASE + (S.upgrades.rack2 ? 20 : S.upgrades.rack ? 10 : 0), jarsFree = cureSlots();
    for (var b = 0; b < S.batches.length; b++) {
      var batch = S.batches[b];
      if (batch.cured && jarsFree-- <= 0) continue;   /* no jar for this one yet: it waits, oldest batches cure first */
      if (!batch.cured) { if (batch.dry === undefined) batch.dry = clamp((now() - batch.startedAt) / dryMs(), 0, 1); batch.dry = clamp(batch.dry + (dt * 1000 / dryMs()) * dryFactor(), 0, 1); if (batch.dry >= 1) { batch.cured = true; if (!offline) logEvent('🏺 A batch has finished drying and gone to the curing shelf', ''); } }
      else { var gained = 0.5 * rackFast * dt; if (batch.quality < batch.baseQ + cureCap) batch.quality = clamp(batch.quality + gained, 0, Math.min(100, batch.baseQ + cureCap)); }
    }
    if (!offline) {
      var target = (S.event && S.event.mult) ? S.event.mult : 1.0;
      S.market += ((target - S.market) * 0.02 + (Math.random() - 0.5) * 0.03) * Math.min(dt, 3);
      S.market = clamp(S.market, 0.85, 1.20);
      if (S.event && now() > S.event.until) { logEvent(S.event.type === '420' ? '🔥 The 420 rush is over. Prices are back to normal.' : S.event.type === 'cup' ? '🏆 The Cannabis Cup has left town' : 'Over: ' + S.event.label, ''); S.event = null; }
      if (S.customer && now() > S.customer.until && (S.customer.arrived || S.customer.stage || now() - (S.customer.spawnedAt || 0) > 180000)) { if (S.customer.stage) { logEvent('🚶 ' + S.customer.who + ' got tired of waiting to pay and walked (rep -2)', 'bad'); S.rep = Math.max(0, S.rep - 2); if (!offline) toast('🚶 ' + S.customer.who + ' walked out without paying', 'bad'); } else if (!offline) logEvent('🚶 ' + S.customer.who + ' gave up waiting at the window and left', ''); S.customer = null; }
    }
    if (offline && !ui.started && dt > 2) offlineWorks(dt);   // the boot catch-up: the step at start-up is the only offline one before the start screen is passed
  }
  // While the game was closed the basement line, the roof beds and a lab batch keep going for the real time that
  // passed (the boot caps it at 6 h), each through its own tick. Nothing is sown or restarted for you.
  function offlineWorks(secs) {
    secs = clamp(secs, 0, 6 * 3600); if (secs <= 0) return;
    var T = tob(), busy = T.bays.some(function (b) { return b.stage === 'grow'; }) || T.kiln.on || T.shred.on || T.maker.on || T.packer.on;
    if (busy) { var fl = player.floor; player.floor = 0; for (var t = 0; t < secs; t += 0.25) updateTobacco(Math.min(0.25, secs - t)); player.floor = fl; }   /* a quarter second at a time, the packer's cycle is 1.2 s; off the basement floor the tick skips its animation */
    labTick(secs); roofTick(secs * 0.75, true);   /* the beds only grow in daylight, and night runs 20:00 to 02:00 */
    if (busy) logEvent('🏭 The basement line kept running while you were away', '');
  }
  function cupRep(rep, q) { return S.event && S.event.type === 'cup' && q >= 70 ? rep * 2 : rep; }   // the Cup is in town: top-shelf sales count twice for your name
  function maybeEvent() {
    if (S.event || now() - S.lastEvent < randi(70000, 140000)) return;
    S.lastEvent = now();
    var roll = Math.random();
    if (roll < (S.staff && S.staff.guardTask === 'patrol' ? 0.03 : 0.07) && shop().open && !heist.on && S.till + S.tips >= 30) { startRobbery(); return; }
    if (roll < 0.3) { S.event = { type: '420', label: '420 rush: prices up 20%', mult: 1.20, until: now() + 35000 }; logEvent('🔥 420 rush. Prices are up 20% for a little while.', 'good'); toast('🔥 420 rush (prices +20%)', 'rare'); }
    else if (roll < 0.5) { S.event = { type: 'cup', label: 'Cannabis Cup in town: sales at quality 70+ earn double rep', mult: 1.08, until: now() + 60000 }; logEvent('🏆 Cannabis Cup in town. For the next minute, sales at quality 70+ earn double rep', 'rare'); }
    else if (roll < 0.7) { var gift = randi(30, 90) * (S.upgrades.tipjar ? 2 : 1); S.tips += gift; logEvent('💰 A grateful regular left ' + money(gift) + ' in the tip jar.', 'good'); sfx('cash'); }
    else if (roll < 0.85 && S.plants.length) { var v = pick(S.plants); if (!v.hazard) { v.hazard = pick(['pest', 'mold']); logEvent((v.hazard === 'pest' ? '🐛 Spider mites on a ' : '🍄 Mould on a ') + strainById(v.strain).name + '. Spray it before it spreads.', 'bad'); } }
    else if (shop().open && now() >= (S.noCustomersUntil || 0)) customerArrives(hasLic('premium'));   // connoisseurs only come once you hold the permit and never through a locked front door; with someone at the window they join the line
  }
  // ── ID: a card with a face, a date and sometimes something wrong with it ───────────────
  var ID_FLAWS = [
    { why: 'under 18', hint: 'the date of birth puts them at ' },
    { why: 'the photo isn\'t them', hint: 'the photograph doesn\'t match the face in front of you' },
    { why: 'the card is a fake', hint: 'the lamination is lifting at the corner and the print is soft' },
    { why: 'it expired', hint: 'the expiry date has been and gone' }
  ];
  function makeId(who) {
    var bad = Math.random() < 0.14;
    var flaw = bad ? randi(0, ID_FLAWS.length - 1) : -1;
    var age = (flaw === 0) ? randi(15, 17) : randi(19, 68);
    return { who: who, age: age, no: 'RF' + randi(100000, 999999), flaw: flaw, ok: !bad, seen: false, by: '' };
  }
  function idFlawText(id) {
    if (id.ok) return '';
    var F = ID_FLAWS[id.flaw];
    return F.hint + (id.flaw === 0 ? id.age : '');
  }
  function guardOnDuty() { return !guardOff() && !!guard.h; }
  function newCustomer(premium) {   /* the record only: spawnCustomer puts it at the window, lineJoin at the back of the line */
    var c = Math.random() < 0.3 ? newFace() : pickRegular(); var wr = Math.random(); var wantKind = wr < 0.45 ? 'joints' : wr < 0.8 || S.pkg.cookies.n <= 0 ? 'bags' : 'cookies'; var wantJoints = wantKind === 'joints';
    var cu = { who: c.who, avatar: c.a, color: c.c, want: wantKind, qty: wantJoints ? randi(2, 5) : wantKind === 'cookies' ? randi(2, 6) : randi(1, 3), premium: !!premium, minQ: premium ? 70 : 0, until: now() + (premium ? 60000 : 45000) * (S.upgrades.lounge2 ? 2 : S.upgrades.lobby ? 1.5 : 1) };
    cu.look = c.look; cu.arrived = false; cu.spawnedAt = now(); cu.pay = hasLic('retail') && Math.random() < 0.45 ? 'card' : 'cash';
    cu.id = makeId(c.who);   /* a real document, and about one in eight will not stand up */
    // every customer names a strain: usually one you actually have packed or in the stash, sometimes something you will have to grow
    var known = strainsWithGoods(); cu.strain = known.length && Math.random() < 0.8 ? pick(known) : pick(STRAINS.filter(function (s) { return s.lvl <= S.level + 2; })).id;
    // the order: a main line, sometimes a second product, sometimes bits from the counter display
    cu.lines = [{ kind: cu.want, strain: cu.strain, qty: cu.qty, given: { n: 0, qSum: 0, thcSum: 0 } }]; cu.given = cu.lines[0].given;
    if (Math.random() < 0.35) { var kinds2 = ['bags', 'joints', 'cookies'].filter(function (k) { return k !== cu.want && (k !== 'cookies' || S.pkg.cookies.n > 0); }); var k2 = pick(kinds2); cu.lines.push({ kind: k2, strain: known.length ? pick(known) : cu.strain, qty: k2 === 'bags' ? 1 : randi(1, 3), given: { n: 0, qSum: 0, thcSum: 0 } }); }
    cu.acc = []; if (Math.random() < 0.45) {   /* one or two extras off the counter, likelier the more of it is on show; the three staples can still be asked for when the rack has run dry */
      var accW = Object.keys(ACC).map(function (k) { return [k, (S.display[k] || 0) + (k === 'lighter' || k === 'rpaper' || k === 'rgrinder' ? 1 : 0)]; }).filter(function (w) { return w[1] > 0; });
      for (var an = Math.random() < 0.35 ? 2 : 1; an > 0 && accW.length; an--) { var ar = Math.random() * accW.reduce(function (a, w) { return a + w[1]; }, 0), ai = accW.length - 1; for (var aj = 0; aj < accW.length; aj++) { ar -= accW[aj][1]; if (ar < 0) { ai = aj; break; } } cu.acc.push({ item: accW[ai][0], qty: 1 }); accW.splice(ai, 1); }
    } var cks = anyCigStock(); if (cks.length && Math.random() < 0.4) cu.cig = { sku: pick(cks), qty: Math.random() < 0.25 ? 2 : 1, given: 0 };
    return cu;
  }
  function spawnCustomer(premium) {
    if (S.customer) return;   // one customer at a time: replacing the record mid-visit rebuilt the body at the door, so the one at the window seemed to vanish
    var c = S.customer = newCustomer(premium);
    if (premium) { logEvent('🎩 A connoisseur (' + c.who + ') just walked in, and they\'re after the top shelf', 'rare'); toast('🎩 Connoisseur walking in', 'rare'); }
    else logEvent('🚪 ' + c.who + ' walked in' + (guardOff() ? '. With the guard off, they\'ll show you their ID at the window.' : '. The guard is checking their ID.'), '');
  }
  function maybeCustomer() {
    if (!shop().open || now() < (S.noCustomersUntil || 0)) { S.lastCustomer = now(); return; }
    var gap = S.upgrades.billboard ? 0.4 : S.upgrades.sign ? 0.65 : 1; gap /= footfall(); if (hasLic('latehours') && nightNow()) gap *= 0.75; var mk = shop().markup || 1; gap *= mk > 1 ? 1 + (mk - 1) * 2.5 : mk < 1 ? 1 - (1 - mk) * 0.8 : 1;
    gap *= clamp(1 / (1 + (S.rep || 0) / 200), 0.6, 1);   /* word of mouth: a good name shortens the wait between customers, never below 60% of it */
    if ((S.customer && lineCount() >= LINE_MAX) || now() - S.lastCustomer < randi(30000, 60000) * gap) return;   /* someone at the window no longer holds the next one back: they queue, up to LINE_MAX */
    S.lastCustomer = now();
    if (Math.random() < 0.75) customerArrives(false);
  }

