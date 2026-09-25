// The balance model: the game's economy as plain functions, fed the game's own tables (tools/balance/tables.js).
// Every formula names the game code it mirrors, and tests/balance-model.test.js checks the prices, bills and
// harvests against the running game, so this file cannot quietly drift from what players actually get.
// Loads in node (require) and in the page (window.GrowBalance).
(function (root, factory) { if (typeof module === 'object' && module.exports) module.exports = factory(); else root.GrowBalance = factory(); })(this, function () {
  'use strict';

  function create(D) {
    const E = D.ECON, C = D.COST;
    const byId = (list, id) => list.filter((x) => x.id === id)[0];
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    // ── prices: src/03-log-sound.js gradeMult, premiumMult, gramValue, bagPrice, jointPrice, cookiePrice ──
    // o: { rep, brand, late, chill, market, markup, scale, cones } stands in for the save state those read
    function gradeMult(q, thc) { return Math.pow((0.6 + (q / 100) * 0.8) * thc, E.gradeExp); }
    function premium(o) { o = o || {}; return 1 + Math.min(E.repCap, (o.rep || 0) / 1000) + (o.brand ? E.brandBonus : 0) + (o.late ? E.lateBonus : 0) + (o.chill ? E.chillBonus : 0); }
    function gramValue(q, thc, o) { o = o || {}; return E.baseGram * gradeMult(q, thc) * (o.market || 1) * premium(o) * (o.markup || 1); }
    function bagGrams(o) { return o && o.scale ? 3.2 : 3.5; }
    function jointGrams(o) { return o && o.cones ? 0.8 : 1; }
    function unit(kind, q, thc, o) {
      if (kind === 'bags') return gramValue(q, thc, o) * bagGrams(o) * E.bagMarkup;
      if (kind === 'cookies') return gramValue(q, thc, o) * E.cookieShare;
      return gramValue(q, thc, o) * jointGrams(o) * E.jointMarkup;
    }
    // grams of stash one unit takes: a bag its weight, a joint its paper's worth, a cookie a sixth of a gram (one box + 1 g bakes six)
    function unitGrams(kind, o) { return kind === 'bags' ? bagGrams(o) : kind === 'cookies' ? 1 / 6 : jointGrams(o); }
    // what the unit's packaging costs: a baggie (8 per 10), a paper and a tip (6 and 4 per 20), a sixth of a cookie box ($8)
    function unitPack(kind, D2) { const s = (id) => byId(D.SUPPLIES, id); return kind === 'bags' ? s('bag').price / s('bag').qty : kind === 'cookies' ? s('mix').price / 6 : s('paper').price / s('paper').qty + s('tip').price / s('tip').qty; }

    // ── a plant: src/04-sim.js step (growth rate), src/05-actions.js plant + harvest, the curing cap in step ──
    // g: { strain, light, fed, trimScore, up: {hydro, skylight, trimmer, trimmer2, genetics, rack, rack2}, lic: {cult2}, dayLen }
    function plant(g) {
      const st = typeof g.strain === 'string' ? byId(D.STRAINS, g.strain) : g.strain, L = typeof g.light === 'string' ? byId(D.LIGHTS, g.light) : g.light, up = g.up || {}, lic = g.lic || {};
      const speed = L.spd * (up.hydro ? 1.12 : 1) * (lic.cult2 ? 1.05 : 1) * (up.skylight ? 1.06 : 1);
      const minutes = st.growMs / 60000 / speed;
      let q = 55 + (L.qual || 0) + (up.genetics ? 10 : 0); if (g.fed !== false) q += 12; q = clamp(q, 20, 100);
      const trim = up.trimmer2 ? 1.3 : up.trimmer ? 1.15 : 1;
      const wet = Math.round(st.yield * (L.yld || 1) * (g.fed !== false ? 1.15 : 1) * (0.7 + q / 140) * trim * 10) / 10;
      const keep = up.trimmer || up.trimmer2 ? 1 : 0.82 + 0.18 * (g.trimScore == null ? 0.9 : g.trimScore);   // hand-trimming at the drying line, src/05-actions.js hang
      const grams = Math.round(wet * keep * 10) / 10;
      const cap = D.CURE_CAP_BASE + (up.rack2 ? 20 : up.rack ? 10 : 0);
      const qFinal = Math.min(100, q + cap);
      const cureSec = (qFinal - q) / (0.5 * (up.rack2 ? 2.4 : up.rack ? 1.6 : 1));
      return { strain: st, light: L, minutes, days: minutes / (g.dayLen || 20), qHarvest: q, qFinal, wet, grams, cureSec, drySec: D.DRY_MS_BASE / 1000, seed: st.seed };
    }

    // ── customers: src/04-sim.js maybeCustomer (arrival gap) and newCustomer (the order) ──
    // d: { up: {sign, billboard, lobby, lounge2}, lic: {latehours}, rep, markup, footfall, night, dayLen }
    function customersPerDay(d) {
      d = d || {}; const up = d.up || {};
      let gap = up.billboard ? 0.4 : up.sign ? 0.65 : 1; gap /= (d.footfall || 1);
      if (d.lic && d.lic.latehours && d.night) gap *= 0.75;
      const mk = d.markup || 1; gap *= mk > 1 ? 1 + (mk - 1) * 2.5 : mk < 1 ? 1 - (1 - mk) * 0.8 : 1;
      gap *= clamp(1 / (1 + (d.rep || 0) / 200), 0.6, 1);
      const meanGapSec = 45 * gap / 0.75;   // randi(30000, 60000) * gap between rolls, and three rolls in four send someone
      return (d.dayLen || 20) * 60 / meanGapSec;
    }
    // the expected order of one ordinary customer, in units of each kind (cookies only when there are some to sell)
    function orderMix(cookies) {
      const p = cookies ? { joints: 0.45, bags: 0.35, cookies: 0.20 } : { joints: 0.45, bags: 0.55, cookies: 0 };
      const mainQ = { joints: 3.5, bags: 2, cookies: 4 }, secondQ = { joints: 2, bags: 1, cookies: 2 };
      const units = { joints: 0, bags: 0, cookies: 0 };
      Object.keys(p).forEach((k) => {
        if (!p[k]) return; units[k] += p[k] * mainQ[k];
        const others = Object.keys(p).filter((o) => o !== k && (o !== 'cookies' || cookies));
        others.forEach((o) => { units[o] += p[k] * 0.35 * secondQ[o] / others.length; });   // one in three orders adds a line of another kind
      });
      return units;
    }
    // what one ordinary customer spends and takes, at the window premium and the usual strain match
    function perCustomer(c) {
      c = c || {}; const o = c.o || {}, units = orderMix(c.cookies !== false);
      const matchMult = 0.8 * 1.1 + 0.2 * 0.85;   // four in five name a strain you have and pay 10% for it; the rest take a substitute at 15% off
      const mult = 1.15 * matchMult;               // src/31-models-machines.js handOver: an ordinary customer pays 1.15x board price
      let revenue = 0, grams = 0, pack = 0;
      Object.keys(units).forEach((k) => { revenue += units[k] * unit(k, c.q, c.thc, o) * mult; grams += units[k] * unitGrams(k, o); pack += units[k] * unitPack(k); });
      const acc = D.ACC, accItems = Object.keys(acc), accPrice = accItems.reduce((a, k) => a + acc[k].price, 0) / accItems.length;
      const accCost = { lighter: 10 / 20, rpaper: 12 / 10, rgrinder: 30 / 5 }, accCostMean = accItems.reduce((a, k) => a + (accCost[k] || 0), 0) / accItems.length;
      const accN = 0.45 * (1 + 0.35);   // src/10 newCustomer: 45% want something off the counter, a third of those two things
      return { units, revenue, grams, pack, accRevenue: accN * accPrice, accMargin: accN * (accPrice - accCostMean), rep: 2, mult };
    }

    // ── the morning bill: src/03-log-sound.js billLines, headcount; wages in src/10-staff-paths.js payWages ──
    // b: { day, slots, light, plants, lic: {tobacco}, up: {solar, hvac, security2, bagline}, guard, crew, branch, roster }
    function bills(b) {
      const L = typeof b.light === 'string' ? byId(D.LIGHTS, b.light) : b.light, lic = b.lic || {}, up = b.up || {};
      const free = (b.day || 1) <= C.rentFreeDays;
      const rent = free ? 0 : C.rentBase + b.slots * C.rentPerSlot + (lic.tobacco ? C.rentBasement : 0) + (b.branch ? C.rentBranch : 0);
      const power = (C.powerBase + b.slots * (L.draw || 0) + (up.hvac ? 8 : 0) + (up.security2 ? 3 : 0) + (up.bagline ? 4 : 0)) * (up.solar ? 0.65 : 1);
      const water = (b.plants == null ? b.slots : b.plants) * C.waterPerPlant;
      const need = Math.max(0, Math.ceil((b.slots - C.freeSlots) / C.slotsPerGrower)) + (lic.tobacco ? 2 : 0);
      const hired = (b.crew || 0) + (b.roster || 0);
      const payroll = Math.max(0, need - hired) * C.payRate;
      const guard = b.guard !== false && !free ? C.guardWage : 0;
      const manager = b.branch ? C.branchManager : 0;
      const wages = (b.crew || 0) * D.WORKER_WAGE;
      return { rent, power, water, payroll, guard, manager, wages, need, total: rent + power + water + payroll + guard + manager + wages };
    }
    const taxShare = E.excise + E.taxRate;   // src/03-log-sound.js monthlyTax: excise and business tax, both on gross takings

    // ── the basement line: src/13-basement.js TOB and updateTobacco; wholesale in src/18-deliveries.js (60% of shop price) ──
    function tobacco(t) {
      t = t || {}; const T = D.TOB, dayLen = t.dayLen || 20, daySec = dayLen * 60;
      const kgCured = 4 * T.bayKg * T.cureYield;                                  // four bays, cured at the kiln
      const cycleSec = Math.max(T.growT, T.kilnT, (4 * T.bayKg * T.cureYield) / T.shredKgS);
      const sticksNeeded = kgCured / T.stickKg.normal, makerSec = sticksNeeded / T.sticksS;
      const limitSec = Math.max(cycleSec, makerSec);                               // the slowest stage sets the pace
      const packsPerCycle = sticksNeeded / 20, packsPerDay = packsPerCycle * daySec / limitSec;
      const sku = D.CIG_SKUS.cigNB, wholesale = sku.price * (t.wholesaleShare || 0.6);
      const sow = 4 * T.sowCost * daySec / limitSec, materials = packsPerDay * T.matCost / T.matUnits;
      return { packsPerDay, bottleneck: makerSec > cycleSec ? 'the cigarette maker' : 'the grow bays', revenueWholesale: packsPerDay * wholesale, revenueShop: packsPerDay * sku.price, sow, materials, staffIfUnfilled: 2 * C.payRate, rent: C.rentBasement, licence: byId(D.LICENCES, 'tobacco').price };
    }

    return { D, gradeMult, premium, gramValue, unit, unitGrams, unitPack, plant, customersPerDay, orderMix, perCustomer, bills, taxShare, tobacco, byId };
  }
  return { create };
});
