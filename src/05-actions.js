//@ player actions (buy, plant, water, harvest, pack) and the extension hooks
  // ── Actions ───────────────────────────────────────────────────────
  function spend(n) { if (S.bank < n) { toast('Not enough in the bank (' + money(S.bank) + ' there)', 'bad'); return false; } S.bank -= n; return true; }
  // cash that is not in the bank yet: till, machine boxes, tip jar, vault and your pocket
  function cashOnSite() { return S.till + coinTotal() + S.tips + S.vault + S.pocket; }
  function takeCash(amount, what) { if (amount <= 0) { toast('Nothing in the ' + what, 'bad'); return false; } S.pocket += amount; sfx(what === 'till' ? 'drawer' : 'coins'); toast('👛 Took ' + money(amount) + ' from the ' + what + ' (pocket ' + money(S.pocket) + ')', 'good'); logEvent('👛 Emptied the ' + what + ': ' + money(amount), ''); return true; }
  function pendingDue(p) { return SET.dayNight === 'cycle' ? (S.day || 1) >= p.dueDay : now() >= p.dueAt; }
  function creditPending(offline) { if (!S.pending.length) return; var keep = []; S.pending.forEach(function (p) { if (pendingDue(p)) { S.bank += p.amount; logEvent('🏦 Bank deposit cleared: ' + money(p.amount), 'good'); if (!offline) toast('🏦 ' + money(p.amount) + ' landed in the bank', 'good'); } else keep.push(p); }); S.pending = keep; }
  function firstStashStrain() { var ks = Object.keys(S.stash).filter(function (k) { return S.stash[k].g > 0; }); return ks[0] || 'sunflower'; }
  function drawCured(n) { var q = curedAvgQ(), thc = curedAvgThc(); S.cured.g -= n; S.cured.qSum -= q * n; S.cured.thcSum -= thc * n; if (S.cured.g < 0.05) { S.cured.g = 0; S.cured.qSum = 0; S.cured.thcSum = 0; } }
  function sellUnit(kind, quiet) {
    var stack = S.pkg[kind]; if (stack.n < 1) { if (!quiet) toast('None to sell', 'bad'); return; }
    var q = stack.qSum / stack.n, thc = stack.thcSum / stack.n;
    var price = kind === 'bags' ? bagPrice(q, thc) : jointPrice(q, thc);
    stack.qSum -= q; stack.thcSum -= thc; stack.n--;
    S.bank += price; S.stats.sold++; bookSale(price);
    S.rep += cupRep(q > 80 ? 2 : q > 60 ? 1 : 0, q); gainXp(Math.round(price / 8));
    if (!quiet) { toast('💵 ' + money(price), 'good'); sfx('cash'); }
  }
  var actions = {
    buy: function (id) {
      var it = supplyById(id); if (!it) return;
      if (it.tool && S.supplies[id]) { toast('Already owned', 'bad'); return; }
      if (!spend(Math.round(it.price * supplyDisc()))) return;
      if (it.tool) { S.supplies[id] = 1; toast('Bought the ' + it.name.toLowerCase() + '. It\'s on the workbench.', 'good'); world.dirty = true; return; }   // tools come with the courier, no crate needed
      orderAdd(id, it.qty || 1); toast('🛒 ' + it.name + ' added to the order. The supplier\'s van brings it to the back door.', 'good');
    },
    buySeed: function (id) {
      var st = strainById(id);
      if (S.level < st.lvl) { toast('Unlocks at level ' + st.lvl, 'bad'); return; }
      if (!spend(Math.round(st.seed * supplyDisc()))) return;
      orderAdd('seed_' + id, 1); toast('🛒 ' + st.name + ' seed added to the order', 'good');
    },
    fillSoil: function (slotIdx) {
      var h = held(); if (!h || h.kind !== 'soil') { toast('Bring a bag of soil from the supply rack', 'bad'); return; }
      if (slotIdx >= slots()) { toast('That slot is outside the tent', 'bad'); return; }
      if (S.potSoil[slotIdx]) { toast('That pot already has soil', 'bad'); return; }
      S.potSoil[slotIdx] = true; S.held = null; world.dirty = true;
      var sp = slotPos(slotIdx); burst(sp.x, 0.5, sp.z, 0x5a3a22, 18, 'out'); sfx('plant'); toast('🪴 Filled the pot', 'good');
    },
    plant: function (id, slotIdx) {
      var h = held();
      if (!h || h.kind !== 'seed' || h.strain !== id) { toast('Bring a seed from the supply rack', 'bad'); return; }
      if (typeof slotIdx !== 'number' || slotIdx >= slots()) { toast('Look at a pot inside the tent', 'bad'); return; }
      if (plantAtSlot(slotIdx)) { toast('That pot is taken', 'bad'); return; }
      if (slotIdx >= (S.supplies.pot || 0)) { toast('No pot in that slot. Buy one at the office PC.', 'bad'); return; }
      if (!S.potSoil[slotIdx]) { toast('Fill the pot with soil first', 'bad'); return; }
      if (S.plants.length >= slots()) { toast('The tent is full. A bigger one is under Gear on the office PC.', 'bad'); return; }
      S.held = null;
      var L = lightObj();
      var p = { id: 'p' + now() + randi(0, 999), strain: id, progress: 0, quality: 55 + L.qual, thirst: 0, fed: false, hazard: null, slot: slotIdx };
      if (S.upgrades.genetics) p.quality = clamp(p.quality + 10, 20, 100);   // genetics lab: better starting stock
      S.plants.push(p); S.stats.plants++;
      sfx('plant'); toast('🌱 Planted ' + strainById(id).name, 'good'); world.dirty = true;
      var sp = slotPos(slotIdx); burst(sp.x, 0.6, sp.z, 0x8bd97a, 20, 'up');
    },
    water: function (pid) { var p = plantById(pid); if (!p) return; var h = held(); if (!h || h.kind !== 'can') { toast('Grab the watering can first', 'bad'); return; } if (S.upgrades.autowater) { toast('The auto-waterer has it covered', ''); return; } if (p.thirst < 0.05) { toast('Not thirsty yet', ''); return; } p.thirst = 0; toast('💧 Watered', 'good'); sfx('water'); var sp = slotPosOf(pid); burst(sp.x, 1.3, sp.z, 0x6fc3ff, 30, 'down'); },
    feed: function (pid) { var p = plantById(pid); if (!p) return; if (p.fed) { toast('Already fed', 'bad'); return; } var h = held(); if (!h || h.kind !== 'nutrients') { toast('Bring nutrients from the supply rack', 'bad'); return; } S.held = null; world.dirty = true; p.fed = true; p.quality = clamp(p.quality + 12, 20, 100); toast('🧪 Fed (quality +12)', 'good'); sfx('feed'); var sp = slotPosOf(pid); burst(sp.x, 0.7, sp.z, 0xd9ff5a, 20, 'up'); },
    treat: function (pid) { var p = plantById(pid); if (!p || !p.hazard) { toast('Nothing to treat', ''); return; } var h = held(); if (!h || h.kind !== 'remedy') { toast('Bring pest spray from the supply rack', 'bad'); return; } S.held = null; p.hazard = null; toast('🧴 Treated', 'good'); sfx('spray'); var sp = slotPosOf(pid); burst(sp.x, 1.0, sp.z, 0xffffff, 26, 'out'); world.dirty = true; },
    harvest: function (pid) {
      var idx = -1; for (var i = 0; i < S.plants.length; i++) if (S.plants[i].id === pid) idx = i;
      if (idx < 0) return; var p = S.plants[idx];
      if (p.progress < 1) { toast('Not ready yet', 'bad'); return; }
      if (hotbarFull()) { toast('Your hands are full (G puts things down)', 'bad'); return; }
      var st = strainById(p.strain); var L = lightObj(); var q = clamp(p.quality, 20, 100);
      var wet = st.yield * (L.yld || 1) * (p.fed ? 1.15 : 1) * (0.7 + q / 140) * (p.hazard ? 0.6 : 1) * (S.upgrades.trimmer2 ? 1.3 : S.upgrades.trimmer ? 1.15 : 1);
      wet = Math.round(wet * 10) / 10;
      var sp = slotPos(p.slot);
      S.plants.splice(idx, 1); delete S.potSoil[p.slot];
      S.stats.harvested += wet; gainXp(Math.round(wet));
      var proc = wet * COST.processPerGram; spendOp(proc);   // trimming, lab testing and compliance, charged on the weight that came off the plant
      logEvent('Trim, testing and compliance on that batch: ' + money(proc), '');
      take({ kind: 'harvest', grams: wet, quality: q, thc: st.thc, strain: p.strain }); sfx('harvest');
      logEvent('✂️ Harvested ' + gram(wet) + ' of ' + st.name + ' (quality ' + Math.round(q) + ')', 'good');
      toast('✂️ Harvested ' + gram(wet) + '. Hang it on the drying line.', 'good'); world.dirty = true;
      burst(sp.x, 1.0, sp.z, st.bud, 40, 'out');
    },
    hang: function () {
      var h = held(); if (!h || h.kind !== 'harvest') { toast('Nothing to hang', 'bad'); return; }
      if (!S.upgrades.trimmer && !h.trimmed) { taskStart('trim', gram(h.grams) + ' of ' + strainById(h.strain).name, function (r) { var hh = held(); if (!hh || hh.kind !== 'harvest') return; hh.trimmed = true; var keep = 0.82 + 0.18 * r.score; hh.grams = Math.round(hh.grams * keep * 10) / 10; toast('✂️ ' + r.note + (r.score < 1 ? ' (' + gram(hh.grams) + ' left)' : ''), r.score >= 1 ? 'good' : ''); actions.hang(); }); return; }
      S.batches.push({ id: 'b' + now() + randi(0, 999), grams: h.grams, quality: h.quality, baseQ: h.quality, thc: h.thc, startedAt: now(), cured: false, strain: h.strain });
      S.held = null; world.dirtyShelf = true; sfx('hang');
      logEvent('🌬️ Hung ' + gram(h.grams) + ' of ' + strainById(h.strain).name + ' to dry', '');
      toast('🌬️ Hung to dry. It goes to the curing shelf when it\'s done.', 'good');
    },
    collectHeld: function () {
      var h = held(); if (!h || h.kind !== 'jar') { toast('Carry a cured jar here', 'bad'); return; }
      stashAdd(h.strain || 'sunflower', h.grams, h.quality, h.thc);
      S.held = null; world.dirtyShelf = true; sfx('pour');
      toast('🏺 Emptied ' + gram(h.grams) + ' of ' + strainById(h.strain || 'sunflower').name + ' into the stash', 'good');
    },
    collect: function (bid) {
      var idx = -1; for (var i = 0; i < S.batches.length; i++) if (S.batches[i].id === bid) idx = i;
      if (idx < 0) return; var b = S.batches[idx];
      if (!b.cured) { toast('Still drying', 'bad'); return; }
      stashAdd(b.strain || 'sunflower', b.grams, b.quality, b.thc);
      S.batches.splice(idx, 1);
      toast('🏺 Added ' + gram(b.grams) + ' to the cured stash', 'good'); world.dirtyShelf = true;
    },
    collectAll: function () { var any = false; for (var i = S.batches.length - 1; i >= 0; i--) if (S.batches[i].cured) { var b = S.batches[i]; stashAdd(b.strain || 'sunflower', b.grams, b.quality, b.thc); S.batches.splice(i, 1); any = true; } if (any) { toast('🏺 Collected all cured batches', 'good'); world.dirtyShelf = true; } else toast('Nothing cured yet', 'bad'); },
    bagUp: function (sid) {
      sid = sid || firstStashStrain(); var st = strainById(sid);
      if (!S.supplies.grinder) { toast('Buy a grinder first', 'bad'); return; }
      if (stashOf(sid).g < bagGrams()) { toast('You need ' + bagGrams() + ' g of cured ' + st.name, 'bad'); return; }
      if ((S.supplies.bag || 0) < 1) { toast('No baggies left. Order some at the office PC.', 'bad'); return; }
      function finish(dq, note) { var d = stashDraw(sid, bagGrams()); S.supplies.bag--; lotAdd('bags', sid, 1, clamp(d.q + dq, 20, 100), d.thc); world.dirtyShelf = world.dirtyRack = true; sfx('bag'); toast('🛍️ Bagged an eighth of ' + st.name + (note ? ' (' + note + ')' : '') + '. It\'s on the goods shelf.', 'good'); }
      if (S.upgrades.bagger) { finish(0, 'auto-bagger'); return; }
      var chain = []; if (!S.upgrades.grinder2) chain.push({ kind: 'grind', sub: st.name + ' · ' + gram(stashOf(sid).g) + ' in the stash' }); if (!S.upgrades.scale) chain.push({ kind: 'weigh', sub: st.name + ' · aim for 3.5 g' });
      if (!chain.length) { finish(0, 'digital scale'); return; }
      ui.closePanel(); taskChain(chain, function (rs) { var w = rs.filter(function (r) { return r.value !== undefined && r.note.indexOf('g') >= 0; })[0]; var sc = rs.length ? rs[rs.length - 1].score : 1; finish(sc >= 1 ? 3 : sc >= 0.6 ? 0 : -6, rs[rs.length - 1].note); });
    },
    bagAll: function (sid) { sid = sid || firstStashStrain(); if (!S.upgrades.bagger) { toast('Bagging a whole stash at once needs the auto-bagging line', 'bad'); return; } var n = 0; while (S.supplies.grinder && stashOf(sid).g >= bagGrams() && (S.supplies.bag || 0) >= 1) { var d = stashDraw(sid, bagGrams()); S.supplies.bag--; lotAdd('bags', sid, 1, d.q, d.thc); n++; } if (n) { toast('🛍️ Bagged ' + n + ' eighths of ' + strainById(sid).name, 'good'); sfx('bag'); } else actions.bagUp(sid); },
    roll: function (sid) {
      sid = sid || firstStashStrain(); var st = strainById(sid);
      if (!S.supplies.grinder) { toast('Buy a grinder first', 'bad'); return; }
      var machine = !!S.upgrades.roller; var count = machine ? (S.upgrades.roller2 ? 10 : 5) : 1;
      if (stashOf(sid).g < count * jointGrams()) { toast('You need ' + (count * jointGrams()) + ' g of cured ' + st.name, 'bad'); return; }
      if (!machine && ((S.supplies.paper || 0) < 1 || (S.supplies.tip || 0) < 1)) { toast('You need a paper and a filter tip', 'bad'); return; }
      function finish(dq, note) { var d = stashDraw(sid, count * jointGrams()); if (!machine) { S.supplies.paper--; S.supplies.tip--; } lotAdd('joints', sid, count, clamp(d.q + dq, 20, 100), d.thc); world.dirtyShelf = world.dirtyRack = true; sfx('roll'); toast('🚬 Rolled ' + count + ' ' + st.name + ' ' + kindName('joints', count) + (note ? ' (' + note + ')' : '') + '. On the goods shelf.', 'good'); }
      var chain = []; if (!S.upgrades.grinder2) chain.push({ kind: 'grind', sub: st.name }); if (!machine) chain.push({ kind: 'roll', sub: st.name + ' · paper and tip ready' });
      if (!chain.length) { finish(0, 'machine rolled'); return; }
      ui.closePanel(); taskChain(chain, function (rs) { var last = rs[rs.length - 1]; finish(last.kind === undefined && last.score >= 1 ? 2 : last.score >= 1 ? 2 : last.score >= 0.6 ? 0 : -5, last.note); });
    },
    rollAll: function (sid) { sid = sid || firstStashStrain(); if (!S.upgrades.roller) { toast('Rolling a whole stash at once needs the rolling machine', 'bad'); return; } var n = 0; var machine = true; var count = S.upgrades.roller2 ? 10 : 5; while (S.supplies.grinder && stashOf(sid).g >= count * jointGrams() && n < 60) { var d = stashDraw(sid, count * jointGrams()); lotAdd('joints', sid, count, d.q, d.thc); n += count; } if (n) { toast('🚬 Rolled ' + n + ' ' + strainById(sid).name + ' joints', 'good'); sfx('roll'); } else actions.roll(sid); },
    bake: function (sid) {
      sid = sid || firstStashStrain(); var st = strainById(sid);
      if ((S.supplies.mix || 0) < 1) { toast('You need a box of cookie mix from the supply rack', 'bad'); return; }
      if (stashOf(sid).g < 1) { toast('You need 1 g of cured ' + st.name, 'bad'); return; }
      function finish(dq, note) { var d = stashDraw(sid, 1); S.supplies.mix--; lotAdd('cookies', sid, 6, clamp(d.q + dq, 20, 100), d.thc); world.dirtyShelf = world.dirtyRack = true; sfx('ok'); toast('🍪 Baked 6 ' + st.name + ' cookies' + (note ? ' (' + note + ')' : '') + '. On the goods shelf.', 'good'); logEvent('🍪 Baked 6 ' + st.name + ' cookies', ''); }
      if (S.upgrades.oven) { finish(0, 'convection oven'); return; }
      ui.closePanel(); taskStart('bake', st.name + ' · one box of mix, 1 g of stash', function (r) { finish(r.score >= 1 ? 4 : r.score >= 0.5 ? -2 : -8, r.note); });
    },
    bakeAll: function (sid) { sid = sid || firstStashStrain(); if (!S.upgrades.oven) { toast('Baking a whole batch needs the convection oven', 'bad'); return; } var n = 0; while ((S.supplies.mix || 0) >= 1 && stashOf(sid).g >= 1 && n < 60) { var d = stashDraw(sid, 1); S.supplies.mix--; lotAdd('cookies', sid, 6, d.q, d.thc); n += 6; } if (n) { toast('🍪 Baked ' + n + ' ' + strainById(sid).name + ' cookies', 'good'); sfx('ok'); } else actions.bake(sid); },
    sellBag: function () { sellUnit('bags'); },
    sellJoint: function () { sellUnit('joints'); },
    sellAllBags: function () { var n = S.pkg.bags.n; while (S.pkg.bags.n > 0) sellUnit('bags', true); if (n) { toast('💵 Sold ' + n + ' ' + kindName('bags', n), 'good'); sfx('cash'); } },
    sellAllJoints: function () { var n = S.pkg.joints.n; while (S.pkg.joints.n > 0) sellUnit('joints', true); if (n) { toast('💵 Sold ' + n + ' ' + kindName('joints', n), 'good'); sfx('cash'); } },
    serve: function () {
      var c = S.customer; if (!c) { toast('Nobody at the window', 'bad'); return; }
      var stack = S.pkg[c.want];
      if (stack.n < c.qty) { toast('Not enough ' + c.want + ' (' + stack.n + '/' + c.qty + ')', 'bad'); return; }
      var q = stack.qSum / stack.n, thc = stack.thcSum / stack.n;
      if (c.premium && q < c.minQ) { toast('They want quality ' + c.minQ + ' or better', 'bad'); return; }
      var each = c.want === 'bags' ? bagPrice(q, thc) : jointPrice(q, thc);
      var mult = c.premium ? 2.2 : 1.15; var total = each * c.qty * mult;
      for (var i = 0; i < c.qty; i++) { stack.qSum -= q; stack.thcSum -= thc; stack.n--; }
      S.bank += total; S.stats.sold += c.qty; bookSale(total);
      var rep = c.premium ? randi(8, 16) : randi(1, 4) + Math.round(q / 25);
      S.rep += rep; gainXp(Math.round(total / 8));
      logEvent('💵 Sold ' + c.qty + ' ' + kindName(c.want, c.qty) + ' to ' + c.who + ' for ' + money(total) + ' (rep +' + rep + ')', c.premium ? 'rare' : 'good');
      toast('💵 ' + money(total) + ' (rep +' + rep + ')', 'good'); sfx('cash'); registerSale(c.who + ' ' + money(total));
      burst(0, 1.4, 5.6, 0xffd766, 40, 'up');
      npc.leaveHappy(); S.customer = null;
    },
    buyLic: function (id) {
      var L = licById(id); if (!L || hasLic(id)) return; if (!S.lic) S.lic = {};
      if (L.req && !hasLic(L.req)) { toast('Needs the ' + licById(L.req).name + ' first', 'bad'); return; } if (L.lvl && S.level < L.lvl) { toast('Unlocks at level ' + L.lvl, 'bad'); return; } if (L.rep && S.rep < L.rep) { toast('Needs ' + L.rep + ' rep', 'bad'); return; }
      if (!spend(L.price)) return; S.lic[id] = true; sfx('rare'); logEvent('🪪 Licence granted: ' + L.name, 'rare'); toast('🪪 ' + L.name, 'rare'); save();
    },
    exportSell: function (arg) {
      if (!hasLic('export')) return; var parts = String(arg).split(':'); var sid = parts[0], grams = Math.min(+parts[1] || 50, 100, stashOf(sid).g);
      if (grams < 20) { toast('Bulk buyers take 20 g or more', 'bad'); return; }
      var d = stashDraw(sid, grams); var amount = Math.round(gramValue(d.q, d.thc) * 0.7 * grams);
      S.pending.push({ amount: amount, dueDay: (S.day || 1) + 1, dueAt: now() + (+SET.dayLength || 20) * 60000 }); S.stats.exported = (S.stats.exported || 0) + grams; bookSale(amount);
      sfx('cash'); toast('🚢 Contract signed: ' + gram(grams) + ' ' + strainById(sid).name + ' for ' + money(amount) + ', paid tomorrow', 'good'); logEvent('🚢 Export contract: ' + gram(grams) + ' ' + strainById(sid).name + ' for ' + money(amount) + ', clears tomorrow', 'good'); world.dirty = true;
    },
    buyLight: function () {
      var cur = lightIdx(); if (cur + 1 >= LIGHTS.length) { toast('Best light already', 'bad'); return; }
      var nx = LIGHTS[cur + 1]; if (!spend(nx.price)) return; S.light = nx.id;
      logEvent('💡 Upgraded lighting to ' + nx.name, 'good'); toast('💡 ' + nx.name, 'good'); world.dirty = true;
    },
    buyTent: function () {
      if (S.tent + 1 >= TENTS.length) { toast('Biggest tent already', 'bad'); return; }
      var nx = TENTS[S.tent + 1]; if (nx.lic && !hasLic(nx.lic)) { toast('Needs the ' + licById(nx.lic).name + '. It\'s under Licences on the office PC.', 'bad'); return; } if (!spend(nx.price)) return; S.tent++;
      logEvent('⛺ Bigger tent: ' + nx.slots + ' slots', 'good'); toast('⛺ Bigger tent: ' + nx.slots + ' slots', 'good'); world.dirty = true;
    },
    buyUpg: function (id) {
      var u = null; for (var i = 0; i < UPGRADES.length; i++) if (UPGRADES[i].id === id) u = UPGRADES[i];
      if (!u || S.upgrades[id]) return;
      if (u.req && !S.upgrades[u.req]) { var ur = UPGRADES.filter(function (x) { return x.id === u.req; })[0]; toast('Needs the ' + (ur ? ur.name : u.req) + ' first', 'bad'); return; } if (u.lvl && S.level < u.lvl) { toast('Unlocks at level ' + u.lvl, 'bad'); return; }
      if (!spend(u.price)) return; S.upgrades[id] = true;
      logEvent('⭐ Installed ' + u.name, 'rare'); toast('⭐ ' + u.name, 'rare'); world.dirty = true; if (id === 'lobby') buildProp('lobbyCoffee');
    }
  };

  // ── Extension hooks (creative mode lives in grow3d-creative.js) ──
  var hooks = { frame: [], keydown: [], mousedown: [], panel: {}, panelClick: [], panelInput: [], boot: [], blockFocus: [], unlock: [] };
  function runHooks(list, a, b) { for (var i = 0; i < list.length; i++) { if (list[i](a, b)) return true; } return false; }

