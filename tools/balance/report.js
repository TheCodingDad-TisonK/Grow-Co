// `npm run balance` writes docs/Balance.md: the economy as the game really has it, the numbers read from src/
// by tables.js and run through model.js (which tests/balance-model.test.js holds to the running game).
// The findings at the top are worked out from the numbers, so they stay true as the tables change.
'use strict';
const fs = require('fs');
const path = require('path');
const M = require('./model.js').create(require('./tables.js').load());
const D = M.D;

// ── what a player does that the code cannot tell us ──
const A = {
  dayLen: 20,          // minutes of real time per game day (the default setting)
  serveSec: 30,        // one customer served every 30 s of real time by the player alone: about 40 a day
  crewServe: 20,       // customers a day each crew member serves on top
  trimScore: 0.9,      // hand-trimming at the drying line, before the trimming machine
  footfall: 1.0,       // weather, weekends and the holiday week roughly cancel out over a month
};
const $ = (n) => (n < 0 ? '-$' : '$') + Math.abs(Math.round(n)).toLocaleString('en-US');
const r1 = (n) => Math.round(n * 10) / 10, pct = (n) => Math.round(n * 100) + '%';
const table = (head, rows) => '| ' + head.join(' | ') + ' |\n|' + head.map(() => '---').join('|') + '|\n' + rows.map((r) => '| ' + r.join(' | ') + ' |').join('\n') + '\n';
const strain = (id) => M.byId(D.STRAINS, id), light = (id) => M.byId(D.LIGHTS, id);

// ── a day of the shop at steady state: what it grows, sells and pays ──
function day(s) {
  const st = strain(s.strain), L = light(s.light), slots = D.TENTS[s.tent].slots, up = s.up || {}, lic = s.lic || {};
  const p = M.plant({ strain: st, light: L, up, lic, dayLen: A.dayLen, trimScore: A.trimScore });
  const o = { rep: s.rep || 0, brand: lic.brand, markup: s.markup || 1, scale: up.scale, cones: up.cones };
  const pc = M.perCustomer({ q: p.qFinal, thc: st.thc, o });
  const supplyG = slots * p.grams / p.days;
  const arrivals = M.customersPerDay({ up, lic, rep: s.rep || 0, markup: s.markup || 1, footfall: A.footfall, dayLen: A.dayLen });
  const serveCap = A.dayLen * 60 / A.serveSec + (s.crew || 0) * A.crewServe;
  const served = Math.max(0, Math.min(arrivals, serveCap, supplyG / pc.grams));
  const soldG = served * pc.grams, leftG = Math.max(0, supplyG - soldG);
  const walkUp = Math.min(D.WALKUP_CAP, leftG / 1) * M.unit('joints', p.qFinal, st.thc, o) * D.WALKUP_RATE;   // the till takes 12 a day at 85%, as joints
  const gross = served * (pc.revenue + pc.accRevenue) + walkUp;
  const plantsPerDay = slots / p.days, supplyDisc = (lic.wholesale ? 0.85 : 1) * (up.solar ? 0.9 : 1);
  const inputs = plantsPerDay * (st.seed + (4 + (up.doser ? 0 : 6)) * supplyDisc) + plantsPerDay * p.wet * D.COST.processPerGram;
  const packaging = (served * pc.pack + Math.min(D.WALKUP_CAP, leftG) * M.unitPack('joints')) * supplyDisc + served * (pc.accRevenue - pc.accMargin);
  const bill = M.bills({ day: s.day == null ? 30 : s.day, slots, light: L, plants: slots, lic, up, guard: s.guard !== false, crew: s.crew || 0 });
  const tax = M.taxOnDay(gross);
  const net = gross - inputs - packaging - bill.total - tax;
  return { p, pc, slots, supplyG, arrivals, serveCap, served, soldG, leftG, gross, inputs, packaging, bill, tax, net, limit: served >= arrivals - 1e-9 ? 'customers' : served >= serveCap - 1e-9 ? 'serving speed' : 'stock' };
}
function bestMarkup(s) { let best = null; [0.8, 0.9, 1, 1.1, 1.2, 1.3].forEach((mk) => { const d = day(Object.assign({}, s, { markup: mk })); if (!best || d.net > best.d.net) best = { mk, d }; }); return best; }

// ── the findings, worked out from the numbers ──
const findings = [];

// 1. quality saturation: which lamp already reaches 100 once cured
const lampQ = D.LIGHTS.map((L) => ({ L, p: M.plant({ strain: 'sunflower', light: L }) }));
const firstFull = lampQ.filter((x) => x.p.qFinal >= 100)[0];
if (firstFull) {
  const wasted = D.LIGHTS.filter((L) => L.price > firstFull.L.price).map((L) => L.name + ' (+' + L.qual + ')');
  findings.push('**Quality tops out early.** A plant under the ' + firstFull.L.name + ', fed once and fully cured, already reaches quality 100 (it starts at ' + firstFull.p.qHarvest + ' and curing adds up to ' + D.CURE_CAP_BASE + ' points in about ' + Math.round(firstFull.p.cureSec) + ' s). So the quality bonus of every lamp after it (' + wasted.join(', ') + '), both curing racks (+10 and +20 to the cap) and the Genetics lab (+10, $' + M.byId(D.UPGRADES, 'genetics').price.toLocaleString('en-US') + ') add nothing to a price. The lamps still earn their keep through yield and speed; the racks only save a few seconds and the genetics lab nothing at all. Connoisseurs, who want 70+, are always satisfied.');
}
// 2. strain value per slot-day under a mid lamp, against the level they unlock at
const strainRows = D.STRAINS.map((st) => { const p = M.plant({ strain: st, light: 'led' }); const v = p.grams * M.gramValue(p.qFinal, st.thc) / p.days; return { st, p, v }; });
strainRows.forEach((x) => { const better = strainRows.filter((y) => y.st.lvl < x.st.lvl && y.v >= x.v); if (better.length) findings.push('**' + x.st.name + ' is outclassed.** It unlocks at level ' + x.st.lvl + ' but grows less value per slot per day ($' + r1(x.v) + ' under an LED) than ' + better.map((y) => y.st.name + ' (level ' + y.st.lvl + ', $' + r1(y.v) + ')').join(' and ') + '. A player who works that out never plants it.'); });
// 3. rep gates
const firstCust = Math.min(M.customersPerDay({ dayLen: A.dayLen }), A.dayLen * 60 / A.serveSec), repSale = M.perCustomer({ q: 80, thc: 1 }).rep, repPerDay = firstCust * repSale;
const repGates = D.LICENCES.filter((l) => l.rep).map((l) => l.name + ' ' + l.rep);
const repFindingAt = findings.length; findings.push('');   // written once the simulation below says when each gate opens
// 4. markup when stock is short
const early = { strain: 'sunflower', light: 'led', tent: 1, day: 20 };
const bm = bestMarkup(early), flat = day(early);
if (bm.mk > 1 && flat.limit === 'stock') findings.push('**The markup slider is free money while stock is short.** With too little to sell (a 6-slot tent under an LED), the best markup is ' + Math.round(bm.mk * 100) + '%: ' + $(bm.d.net) + ' a day against ' + $(flat.net) + ' at 100%, because every gram sells anyway and the lost customers were never going to be served. The slider only starts to cost money once there is more stock than customers.');
// 5. the basement against the shop
const tob = M.tobacco({ dayLen: A.dayLen });
const tobNet = tob.revenueWholesale - M.taxOnDay(tob.revenueWholesale) - tob.sow - tob.materials - tob.staffIfUnfilled - tob.rent;   // wholesale goes through bookSale, so it is taxed like any sale
const bigShop = day({ strain: 'runtz', light: 'array', tent: D.TENTS.length - 1, up: { trimmer2: 1, hydro: 1, skylight: 1, billboard: 1 }, lic: { cult2: 1, cult3: 1, brand: 1 }, rep: 200, crew: 3 });
const tobFindingAt = findings.length; findings.push('');   // written once the simulation below says when the licence is affordable
// 6. demand against supply as the shop grows
const stages = [
  ['A new shop', { strain: 'sunflower', light: 'none', tent: 0, day: 5 }],
  ['First lamp and tent', { strain: 'amber', light: 'cfl', tent: 1, day: 12 }],
  ['LED, 9 slots', { strain: 'widow', light: 'led', tent: 2, lic: { cult2: 1 }, day: 25, rep: 100 }],
  ['HPS, 12 slots, sign', { strain: 'widow', light: 'hps', tent: 3, up: { sign: 1, trimmer: 1 }, lic: { cult2: 1 }, day: 40, rep: 150, crew: 1 }],
  ['Quantum, 16 slots, billboard', { strain: 'runtz', light: 'qb', tent: 4, up: { billboard: 1, trimmer2: 1, hydro: 1 }, lic: { cult2: 1, cult3: 1 }, day: 60, rep: 200, crew: 2 }],
  ['Array, 20 slots, everything', { strain: 'runtz', light: 'array', tent: 5, up: { billboard: 1, trimmer2: 1, hydro: 1, skylight: 1 }, lic: { cult2: 1, cult3: 1, brand: 1 }, day: 90, rep: 200, crew: 3 }],
];

// ── a player, day by day: grows the best strain unlocked, buys whatever pays back fastest ──
function simulate(opts) {
  opts = opts || {};
  const s = { strain: 'sunflower', light: 'none', tent: 0, up: {}, lic: {}, rep: 0, crew: 0, day: 1, markup: 1 };
  const firstPlanting = 4 * (strain('sunflower').seed + 4 + 6);
  let cash = 220 - 60 - 36 - firstPlanting;   // the grinder, three more pots and the first four plants, before anything sells
  let xp = 0, level = 1, firstHarvest = null, level10 = null, affordTob = null; const log = [], bought = [], netByDay = {}, gateDay = {};
  const cands = () => {
    const out = [];
    if (s.tent + 1 < D.TENTS.length) { const T = D.TENTS[s.tent + 1]; if (!T.lic || s.lic[T.lic]) out.push({ what: T.slots + '-slot tent', price: T.price + (T.slots - D.TENTS[s.tent].slots) * 12, apply: () => { s.tent++; } }); }
    const li = D.LIGHTS.findIndex((L) => L.id === s.light); if (li + 1 < D.LIGHTS.length) { const L = D.LIGHTS[li + 1]; out.push({ what: L.name, price: L.price, apply: () => { s.light = L.id; } }); }
    [['trimmer'], ['trimmer2', 'trimmer'], ['hydro', 'autowater'], ['autowater'], ['skylight'], ['sign'], ['billboard', 'sign'], ['solar'], ['doser']].forEach(([id, req]) => { const u = M.byId(D.UPGRADES, id); if (!u || s.up[id] || (req && !s.up[req]) || (u.lvl && level < u.lvl)) return; out.push({ what: u.name, price: u.price, apply: () => { s.up[id] = 1; } }); });
    ['cult2', 'cult3', 'wholesale', 'brand'].forEach((id) => { const l = M.byId(D.LICENCES, id); if (s.lic[id] || (l.lvl && level < l.lvl) || (l.rep && s.rep < l.rep) || (l.req && !s.lic[l.req])) return; out.push({ what: l.name, price: l.price, apply: () => { s.lic[id] = 1; } }); });
    if (s.crew < D.CREW_MAX) out.push({ what: 'crew member ' + (s.crew + 1), price: Math.round(D.WORKER_HIRE * Math.pow(1.6, s.crew)), apply: () => { s.crew++; } });
    const tl = M.byId(D.LICENCES, 'tobacco');
    if (opts.tobacco && !s.lic.tobacco && !(tl.lvl && level < tl.lvl) && !(tl.rep && s.rep < tl.rep)) out.push({ what: 'Tobacco licence (and the basement line)', price: tob.licence, apply: () => { s.lic.tobacco = 1; } });
    return out;
  };
  // the basement's takings on top of the shop's day: its rent and its two staff are already in the shop's bill once the licence is held
  const netOf = () => { const b = bestMarkup(s); return { d: b.d, mk: b.mk, extra: s.lic.tobacco ? tob.revenueWholesale - (M.taxOnDay(b.d.gross + tob.revenueWholesale) - M.taxOnDay(b.d.gross)) - tob.sow - tob.materials : 0 }; };   /* the basement's takings share the shop's month, so they are taxed at the month's top rate */
  for (s.day = 1; s.day <= (opts.days || 60); s.day++) {
    // unlocks: the best strain the level allows
    D.STRAINS.filter((st) => st.lvl <= level).forEach((st) => { const cur = day(Object.assign({}, s, { strain: s.strain })).net, alt = day(Object.assign({}, s, { strain: st.id })).net; if (alt > cur) s.strain = st.id; });
    const n = netOf(); s.markup = n.mk;
    const growing = firstHarvest == null ? (firstHarvest = Math.ceil(n.d.p.days + 0.2)) : firstHarvest;
    const selling = s.day > growing;
    const today = selling ? n.d.net + n.extra : -n.d.bill.total;   // before the first harvest only the bills fall (the first plants are already paid for)
    cash += today; netByDay[s.day] = selling ? n.d.net + n.extra : 0;
    const tlic = M.byId(D.LICENCES, 'tobacco');
    if (affordTob == null && cash >= tob.licence + 2 * n.d.bill.total && !(tlic.lvl && level < tlic.lvl) && !(tlic.rep && s.rep < tlic.rep)) affordTob = s.day;   // the first day the licence is both allowed and affordable
    if (selling) { xp += n.d.gross / 8 + n.d.slots / n.d.p.days * n.d.p.wet; s.rep += n.d.pc.rep * n.d.served; }
    while (xp >= D.XP_PER_LEVEL(level)) { xp -= D.XP_PER_LEVEL(level); level++; }
    if (level >= 10 && level10 == null) level10 = s.day;
    D.LICENCES.forEach((l) => { if ((l.rep || l.lvl) && gateDay[l.id] == null && !(l.lvl && level < l.lvl) && !(l.rep && s.rep < l.rep)) gateDay[l.id] = s.day; });
    // spend: the purchase that pays back fastest, while two days of bills stay in the bank
    for (let k = 0; k < 6; k++) {
      const base = netOf().d.net + netOf().extra; let best = null;
      cands().forEach((c) => { const snap = JSON.stringify(s); c.apply(); const gain = netOf().d.net + netOf().extra - base; Object.assign(s, JSON.parse(snap)); if (gain > 0.5) { const pb = c.price / gain; if (!best || pb < best.pb) best = Object.assign({ gain, pb }, c); } });
      if (!best || best.pb > 40 || cash - best.price < 2 * n.d.bill.total) break;
      cash -= best.price; best.apply(); bought.push('day ' + s.day + ': ' + best.what + ' (' + $(best.price) + ', pays back in ' + r1(best.pb) + ' days)');
    }
    if ([1, 3, 5, 10, 11, 15, 20, 30, 45, 60, 90].includes(s.day)) log.push([s.day, $(cash), level, Math.round(s.rep), D.TENTS[s.tent].slots, light(s.light).name, strain(s.strain).name, Math.round(s.markup * 100) + '%', selling ? $(n.d.net + n.extra) : 'growing', selling ? n.d.limit : '']);
  }
  return { log, bought, cash, level, level10, affordTob, netByDay, gateDay, firstPlanting, lastBuy: bought.length ? +/^day (\d+)/.exec(bought[bought.length - 1])[1] : null, s };
}

// ── the simulated player, and the findings that need it ──
const hrs = (days) => r1(days * A.dayLen / 60) + ' hours of play';
const sim = simulate({ days: 90 });
const simT = simulate({ days: 90, tobacco: true });
const shopThen = sim.affordTob ? sim.netByDay[sim.affordTob] : null;
// reputation: when each gate opens for the simulated player
const repLics = D.LICENCES.filter((l) => l.rep), repDays = repLics.map((l) => sim.gateDay[l.id]).filter((d) => d != null);
findings[repFindingAt] = (repDays.length && Math.max.apply(null, repDays) <= 10 ? '**Reputation gates open almost at once.**' : '**Reputation gates pace the first weeks.**') + ' Every sale adds 1 to 4 rep plus a point for every 25 of quality (about ' + repSale + ' at quality 80), and nothing takes it away except penalties, so a shop serving its first ' + Math.round(firstCust) + ' customers a day gains about ' + Math.round(repPerDay) + ' rep a day, and more as it grows. The simulated player passes the gates on these days: ' + repLics.map((l) => l.name + ' (' + l.rep + (l.lvl ? ' and level ' + l.lvl : '') + ') day ' + (sim.gateDay[l.id] || 'never')).join(', ') + '. Rep stops mattering to price at 100 (+' + pct(D.ECON.repCap) + ') and to footfall at 133.';
// the basement against the shop
const tlic = M.byId(D.LICENCES, 'tobacco'), tobGate = tlic.lvl || tlic.rep ? ' and needs ' + [tlic.lvl ? 'level ' + tlic.lvl : '', tlic.rep ? tlic.rep + ' rep' : ''].filter(Boolean).join(' and ') : ' with no level or rep gate';
const tobShare = shopThen ? tobNet / shopThen : 0;
findings[tobFindingAt] = (tobShare > 0.8 ? '**The basement line is the best money in the game early on.**' : '**The basement line is a solid mid-game side business.**') + ' It turns out about ' + Math.round(tob.packsPerDay) + ' packs of 20 a game day (' + tob.bottleneck + ' sets the pace), and the Corner Tobacconist takes every one at ' + pct(D.TOB.wholesale) + ' of shop price with no cap: ' + $(tob.revenueWholesale) + ' a day, ' + $(tobNet) + ' after tax, seed, materials, the basement rent and the two staff it needs. The licence costs ' + $(tob.licence) + tobGate + '. The simulated player could first get it on day ' + sim.affordTob + ' (' + hrs(sim.affordTob) + '), when the shop itself was netting ' + $(shopThen) + ' a day, so it ' + (tobShare > 1 ? 'more than doubles' : 'adds ' + pct(tobShare) + ' to') + ' the income at that point. A fully built shop nets ' + $(bigShop.net) + ' a day. Over 90 days the player with the licence ends with ' + $(simT.cash) + ' against ' + $(sim.cash) + '. The model sells every pack to the tobacconist; the counter (full price, to customers who ask) and the tablet rounds (about 125% of it, for the drive) pay more for the packs they take.';
// levels stop unlocking anything at 10
const lvlGates = [].concat(D.STRAINS.map((x) => x.lvl), D.UPGRADES.filter((u) => u.lvl).map((u) => u.lvl), D.LICENCES.filter((l) => l.lvl).map((l) => l.lvl));
const topGate = Math.max.apply(null, lvlGates);
findings.push((sim.level10 <= 16 ? '**Levels run out fast.**' : '**Levels run out in the mid-game.**') + ' The last thing a level unlocks is at level ' + topGate + ', and the simulated player gets there on day ' + sim.level10 + ' (' + hrs(sim.level10) + '). After that a level-up unlocks nothing, and the player was level ' + sim.level + ' by day 90. XP is an eighth of every sale plus a point per gram harvested, so it grows with the shop, and each level asks for more than the last: ' + D.XP_PER_LEVEL(1) + ' XP for level 2, ' + D.XP_PER_LEVEL(topGate - 1) + ' for level ' + topGate + '.');
// demand caps the grow room
const maxCust = M.customersPerDay({ dayLen: A.dayLen, up: { billboard: 1 }, rep: 200 });
const topGrow = M.plant({ strain: 'runtz', light: 'array', up: { trimmer2: 1, hydro: 1, skylight: 1 }, lic: { cult2: 1 } });
const perSlot = topGrow.grams / topGrow.days, needG = maxCust * M.perCustomer({ q: 100, thc: 2.4 }).grams, slotsNeeded = needG / perSlot;
const enoughTent = D.TENTS.filter((T) => T.slots >= slotsNeeded)[0];
findings.push('**The customers run out before the grow room does.** With the billboard and full reputation about ' + Math.round(maxCust) + ' customers come a game day, wanting about ' + Math.round(needG) + ' g. A fully upgraded slot grows ' + r1(perSlot) + ' g a day, so about ' + Math.ceil(slotsNeeded) + ' slots already cover every customer the shop can get' + (enoughTent ? ' (the ' + enoughTent.slots + '-slot tent)' : '') + '. The bigger tents past that, and Cultivation permit III ($' + M.byId(D.LICENCES, 'cult3').price.toLocaleString('en-US') + '), only pay through side channels: the till\'s walk-up sales (12 a day), deliveries, the van, street deals, export contracts and the branch. (The simulated player, which only buys what pays back on its own, stopped at ' + D.TENTS[sim.s.tent].slots + ' slots: the permit earns nothing until the tent it unlocks is bought as well, and the same goes for the Auto-waterer that the Hydroponic loop needs.)');
// the late game has little to spend on
const lateDay = day(sim.s), bigMonthTax = M.taxOnDay(lateDay.gross) - lateDay.gross * M.taxShare;
findings.push('**Money piles up late.** The simulated player had bought everything that pays back within 40 days by day ' + sim.lastBuy + ' (' + hrs(sim.lastBuy) + ') and then banked about ' + $(sim.netByDay[90]) + ' a day, ending day 90 with ' + $(sim.cash) + '.' + (bigMonthTax > 0.5 ? ' The tax on big months (' + pct(D.ECON.taxHighRate) + ' instead of ' + pct(D.ECON.taxRate) + ' on what a month takes over ' + $(D.ECON.taxHighFrom) + ') costs that shop about ' + $(bigMonthTax) + ' a day; a young shop never reaches it.' : '') + ' The only big things left to buy are the Green Leaf buy-out ($180,000, which then pays daily), the export licence and the cosmetic upgrades.');
// robberies against an unemptied till
const eventsPerDay = A.dayLen * 60 / (105 + 0.3 * 35 + 0.2 * 60), robPerDay = eventsPerDay * 0.07;
findings.push('**Robberies are a tax on a full till.** Random events come about every two minutes and 7% of them are a robbery once the till and tip jar hold $30 (3% with the guard on patrol): about ' + r1(robPerDay) + ' robberies a game day. A robber takes whatever is in the till and the tip jar, and a gunman goes for the vault next. A player who empties the till into the vault once a day loses on average about ' + pct(robPerDay * 0.5) + ' of a day\'s cash takings to robberies; one who empties it after every few sales loses almost nothing.' + (D.TILL_HEAVY ? ' The vault readout turns amber, and a warning comes once a day, when the till and the tip jar hold ' + $(D.TILL_HEAVY) + ' or more.' : ' Nothing in the game tells the player the numbers.'));

// ── write it up ──
const out = [];
out.push('# Balance report\n');
out.push('Generated by `npm run balance` from the numbers in `src/` (' + new Date().toISOString().slice(0, 10) + '). The formulas are in `tools/balance/model.js`, and `tests/balance-model.test.js` checks them against the running game: prices, the morning bill, harvest weights and what customers order.\n');
out.push('A game day is ' + A.dayLen + ' minutes of real time. Where the code cannot say what a player does, the report assumes: one customer served every ' + A.serveSec + ' s by the player alone (' + Math.round(A.dayLen * 60 / A.serveSec) + ' a day) and ' + A.crewServe + ' more a day for each crew member, hand-trimming at ' + pct(A.trimScore) + ' of a perfect trim, and footfall at 1.0 (weather, weekends and the holiday week roughly cancel out). Money is after tax: ' + pct(D.ECON.excise) + ' excise on every sale, ' + pct(D.ECON.taxRate) + ' business tax on a month\'s takings and ' + pct(D.ECON.taxHighRate) + ' on what a month takes over ' + $(D.ECON.taxHighFrom) + ', paid monthly.\n');
out.push('## Findings\n');
findings.forEach((f, i) => out.push((i + 1) + '. ' + f + '\n'));

out.push('\n## Prices\n');
out.push('What one unit sells for on the board at quality 100 (the window adds 15% on top, and a named strain another 10%).\n');
out.push(table(['Strain', 'Level', 'THC', 'Gram', 'Bag (3.5 g)', 'Joint (1 g)', 'Cookie'], D.STRAINS.map((st) => [st.name, st.lvl, st.thc, $(M.gramValue(100, st.thc)), $(M.unit('bags', 100, st.thc)), $(M.unit('joints', 100, st.thc)), '$' + M.unit('cookies', 100, st.thc).toFixed(2)])));
out.push('\nPer gram of stash, a joint returns ' + D.ECON.jointMarkup + '× the gram, a bag ' + D.ECON.bagMarkup + '× and a cookie ' + (D.ECON.cookieShare * 6).toFixed(1) + '× (six to the gram, less the $' + (M.unitPack('cookies') * 6).toFixed(0) + ' box of mix).\n');

out.push('\n## Lamps: quality, yield and speed\n');
out.push('Sunflower Kush, fed once, fully cured, hand-trimmed.\n');
out.push(table(['Lamp', 'Price', 'Starts at', 'Cured to', 'Grams a plant', 'Grow time'], lampQ.map((x) => [x.L.name, $(x.L.price), x.p.qHarvest, x.p.qFinal, x.p.grams, Math.round(x.p.minutes) + ' min (' + r1(x.p.days) + ' days)'])));

out.push('\n## Strains: value grown per slot per day\n');
out.push('Under an LED panel, at board price.\n');
out.push(table(['Strain', 'Level', 'Seed', 'Grams a plant', 'Days', 'Value a slot a day'], strainRows.map((x) => [x.st.name, x.st.lvl, $(x.st.seed), x.p.grams, r1(x.p.days), '$' + r1(x.v)])));

out.push('\n## The shop at each stage\n');
out.push('A day at steady state, at 100% markup, after tax. "Limit" is what stops the shop selling more: its stock, the customers who come, or how fast they can be served.\n');
out.push(table(['Stage', 'Grows (g/day)', 'Customers', 'Served', 'Takings', 'Bills', 'Inputs', 'Tax', 'Net a day', 'Limit'], stages.map(([name, s]) => { const d = day(s); return [name, Math.round(d.supplyG), Math.round(d.arrivals), Math.round(d.served), $(d.gross), $(d.bill.total), $(d.inputs + d.packaging), $(d.tax), $(d.net), d.limit]; })));
const rentDay = day({ strain: 'sunflower', light: 'none', tent: 0, day: 11 });
out.push('\nOn day 11 the fit-out period ends and the rent and the guard start: the untouched starting shop then nets ' + $(rentDay.net) + ' a day (bills ' + $(rentDay.bill.total) + '). Each tent slot costs $' + D.COST.rentPerSlot + ' a day in rent plus its lamp\'s power, and past ' + D.COST.freeSlots + ' slots every ' + D.COST.slotsPerGrower + ' more need a grower at $' + D.COST.payRate + ' a day, unless a hired crew member covers it.\n');

out.push('\n## A player, day by day\n');
out.push('Grows the most valuable strain their level allows, sets the markup that nets most, and each day buys whatever pays for itself fastest (within 40 days) while keeping two days of bills in the bank. It does not model robberies, events, deliveries, the van or the lobby machines.\n');
out.push('A new shop has $220 and one pot. The grinder ($60), three more pots ($36) and the first four Sunflower plants ($' + sim.firstPlanting + ' in seed, soil and nutrients) leave $' + (220 - 60 - 36 - sim.firstPlanting) + ' in the bank until the first harvest, about ' + Math.ceil(M.plant({ strain: 'sunflower', light: 'none' }).days) + ' game days later. A game day here is ' + A.dayLen + ' minutes of real time.\n');
out.push(table(['Day', 'Cash', 'Level', 'Rep', 'Slots', 'Lamp', 'Strain', 'Markup', 'Net that day', 'Limit'], sim.log));
out.push('\nWhat it bought:\n\n' + sim.bought.map((b) => '- ' + b).join('\n') + '\n');
out.push('\nThe same player, allowed the tobacco licence, ends day 90 with ' + $(simT.cash) + ' against ' + $(sim.cash) + '.\n');

out.push('\n## Customers\n');
out.push(table(['Setup', 'Customers a game day'], [['nothing', r1(M.customersPerDay({ dayLen: A.dayLen }))], ['neon sign', r1(M.customersPerDay({ dayLen: A.dayLen, up: { sign: 1 } }))], ['billboard', r1(M.customersPerDay({ dayLen: A.dayLen, up: { billboard: 1 } }))], ['billboard, rep 133+', r1(M.customersPerDay({ dayLen: A.dayLen, up: { billboard: 1 }, rep: 200 }))], ['markup 130% (no upgrades)', r1(M.customersPerDay({ dayLen: A.dayLen, markup: 1.3 }))]]));
const pcx = M.perCustomer({ q: 100, thc: 1.5 });
out.push('\nAn ordinary customer takes ' + r1(pcx.grams) + ' g (' + r1(pcx.units.joints) + ' joints, ' + r1(pcx.units.bags) + ' bags and ' + r1(pcx.units.cookies) + ' cookies on average) and spends ' + $(pcx.revenue + pcx.accRevenue) + ' on Green Widow at quality 100, counter extras included.\n');

out.push('\n## The basement line\n');
out.push(table(['', 'A game day'], [['Packs of 20', Math.round(tob.packsPerDay)], ['Pace set by', tob.bottleneck], ['At the Corner Tobacconist (' + pct(D.TOB.wholesale) + ')', $(tob.revenueWholesale)], ['At shop price, if customers took them all', $(tob.revenueShop)], ['Seed', $(tob.sow)], ['Materials', $(tob.materials)], ['Two staff, unless the crew covers them', $(tob.staffIfUnfilled)], ['Basement rent', $(tob.rent)], ['Net at the tobacconist', $(tobNet)]]));

process.stdout.write(out.join('\n'));
