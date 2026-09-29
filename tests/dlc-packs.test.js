// The six DLC of 1.27: the Breeding Lab, the Hydroponics Bay, the Cannabis Cup, Merch & Brand, the Out-of-town Farm and
// Bank & Insurance. tools/test/preload.js switches them on. Each test sets up its own shop.

const W = () => window.RF_WORKSHOP;
const off = (...ids) => ids.forEach((id) => W().setOn('rf.dlc.' + id, false));
const on = (...ids) => ids.forEach((id) => W().setOn('rf.dlc.' + id, true));

test('the Breeding Lab: two parents, a wait, a name, and a strain of your own', async (h) => {
  const S = h.S, D = h.T.dlc, B = D.breed(), n0 = h.T.data.STRAINS.length;
  S.bank = 5000; S.supplies.seed_sunflower = 2; S.supplies.seed_amber = 1;
  h.ok(/fits it/.test(D.prompt({ kind: 'breedBench' }, null)), 'until it is bought the bench is an outline on the floor');
  B.owned = true; B.pickA = 'sunflower'; B.pickB = 'sunflower'; D.breedStart();
  h.eq(B.job, null, 'a strain cannot be crossed with itself');
  B.pickB = 'amber'; D.breedStart();
  h.ok(B.job && B.job.a === 'sunflower' && B.job.b === 'amber', 'the cross is on the bench');
  h.eq(S.bank, 5000 - D.BREED.fee, 'the lab fee left the bank'); h.eq(S.supplies.seed_sunflower, 1, 'a seed of the mother'); h.eq(S.supplies.seed_amber, 0, 'and one of the father');
  D.breedFinish(); h.ok(B.job, 'it cannot be named before it is ripe');
  D.step(D.BREED.ms / 1000 + 1, false);
  h.ok(/names your new strain/.test(D.prompt({ kind: 'breedBench' }, null)), 'ripe: the bench says so');
  const a = h.T.data.STRAINS.find((s) => s.id === 'sunflower'), b = h.T.data.STRAINS.find((s) => s.id === 'amber'), kid = B.job.child;
  h.ok(kid.thc >= Math.min(a.thc, b.thc) * 0.9 && kid.thc <= Math.max(a.thc, b.thc) * 1.35, 'strength takes after the parents (' + kid.thc + ')');
  h.ok(kid.yield >= Math.min(a.yield, b.yield) * 0.9 && kid.yield <= Math.max(a.yield, b.yield) * 1.45, 'so does yield (' + kid.yield + ')');
  B.name = 'Desk Special'; D.breedFinish();
  h.eq(B.job, null, 'the bench is free again'); h.eq(h.T.data.STRAINS.length, n0 + 1, 'the game has one more strain');
  const st = h.T.data.STRAINS[n0]; h.eq(st.name, 'Desk Special', 'under the name you gave it'); h.eq(S.supplies['seed_' + st.id], D.BREED.seeds, 'and its first seeds are on the rack');
  h.eq(B.strains.length, 1, 'it is kept in the save');
});

test('the Hydroponics Bay: fast while the tank is right, slow while it is not', async (h) => {
  const S = h.S, D = h.T.dlc, H = D.hydro(); H.owned = true;
  h.hold({ kind: 'seed', strain: 'sunflower' }); D.interact({ kind: 'hydroSite', i: 0 }, h.R.held(), false);
  h.ok(H.sites[0] && H.sites[0].strain === 'sunflower', 'a seed goes straight into a site'); h.eq(h.R.held(), null, 'and leaves your hand');
  H.ph = 6.0; H.feed = 100; D.step(60, false); const fast = H.sites[0].progress;
  h.ok(fast > 0, 'it grows'); h.ok(H.ph > 6.0 && H.feed < 100, 'and the plants drink: the pH creeps up, the feed goes down');
  H.sites[1] = { strain: 'sunflower', progress: 0, quality: 62 }; H.sites[0].progress = 0; H.ph = 7.2;
  h.eq(D.hydroOk(H), false, 'pH 7.2 is out of range'); D.step(60, false);
  h.ok(H.sites[1].progress < fast * 0.5, 'out of range it grows at well under half the speed (' + H.sites[1].progress + ' against ' + fast + ')');
  h.ok(H.sites[1].quality < 62, 'and the quality falls');
  H.sites[0].progress = 1; H.sites[0].quality = 80; h.hold(null); D.interact({ kind: 'hydroSite', i: 0 }, null, false);
  h.ok(h.R.held() && h.R.held().kind === 'harvest' && h.R.held().strain === 'sunflower', 'a ready plant is cut into your hands'); h.eq(H.sites[0], null, 'and the site is free');
});

test('the Cannabis Cup: a jar goes in, the seventh day judges it, a gold cup brings people in', async (h) => {
  const S = h.S, D = h.T.dlc, C = D.cup(); S.day = 3; S.level = 1; S.bank = 0; S.rep = 10;
  h.R.internal.afterAction && 0; S.stash = S.stash || {};
  h.T.simStep(0, false);
  window.RFGROW.S.stash.sunflower = { g: 30, qSum: 30 * 96, thcSum: 30 * 1.9 }; S.cured = S.cured || {};
  h.eq(D.cupNext(), 7, 'on day 3 the next Cup is day 7');
  D.cupEnter('sunflower'); h.ok(C.entry && C.entry.q === 96, 'the jar is entered at the quality it had'); h.near(S.stash.sunflower.g, 20, 0.01, 'ten grams left the stash');
  const back = h.random(0.5);
  try { S.day = 7; D.newDay(false); } finally { back(); }
  h.eq(C.entry, null, 'the entry is spent'); h.eq(C.history.length, 1, 'the result is in the book'); h.eq(C.history[0].place, 1, 'quality 96 wins at level 1');
  h.eq(C.trophies.length, 1, 'a cup for the cabinet'); h.eq(C.trophies[0].metal, 'gold', 'a gold one');
  h.ok(S.bank >= 1200, 'prize money in the bank (' + S.bank + ')'); h.eq(S.rep, 22, 'rep for the win');
  h.near(D.footfall(), 1.03, 0.0001, 'one gold cup: 3% more people');
  S.day = 8; D.newDay(false); h.eq(C.history.length, 1, 'no judging on an ordinary day');
});

test('Merch & Brand: a box arrives, somebody buys, the till and the brand both gain', async (h) => {
  const S = h.S, D = h.T.dlc, M = D.merch(); M.owned = true; S.bank = 1000; S.till = 0;
  D.merchOrder('tee'); h.eq(S.bank, 1000 - 90, 'ten T-shirts at cost'); h.eq(M.stock.tee, 0, 'not on the stand yet');
  D.step(95, false); h.eq(M.stock.tee, 10, 'the box is on the stand');
  h.ok(D.merchSell(), 'somebody buys one'); h.eq(M.stock.tee, 9, 'one fewer on the rail'); h.eq(S.till, 24, 'its price is in the till'); h.eq(M.brand, 1, 'and the brand has a point');
  M.brand = 10; h.eq(D.merchLevel(), 1, 'ten sales is level 1'); h.near(D.footfall(), 1.02, 0.0001, 'which is 2% more people');
  M.stock = { tee: 0, cap: 0, mug: 0, tote: 0 }; h.eq(D.merchSell(), false, 'an empty stand sells nothing');
});

test('the Out-of-town Farm: lease, sow, harvest into the barn, and home in the boot', async (h) => {
  const S = h.S, D = h.T.dlc, F = D.farm(); S.day = 1; S.clock = 12; S.bank = 5000; S.supplies.seed_sunflower = 7;
  h.ok(/takes the lease/.test(D.prompt({ kind: 'farmGate' }, null)), 'the gate offers the lease');
  h.ok(/lease at the gate/.test(D.prompt({ kind: 'farmRow', i: 0 }, null)), 'and the rows wait for it');
  F.leased = true; D.farmSow(0, 'sunflower');
  h.ok(F.rows[0] && F.rows[0].strain === 'sunflower', 'a row is sown'); h.eq(S.supplies.seed_sunflower, 1, 'with six seeds');
  D.farmSow(1, 'sunflower'); h.eq(F.rows[1], null, 'one seed is not enough for a second row');
  D.step(120, false); h.ok(F.rows[0].progress > 0, 'it grows in daylight (' + F.rows[0].progress + ')');
  const noon = F.rows[0].progress; S.clock = 1; D.step(120, false); h.eq(F.rows[0].progress, noon, 'and not at night');
  F.rows[0].progress = 1; F.rows[0].quality = 55; D.farmHarvest(0);
  h.eq(F.rows[0], null, 'the row is cut'); h.eq(F.barn.length, 1, 'and hangs in the barn'); h.ok(F.barn[0].grams > 20, 'a row is a lot of bud (' + F.barn[0].grams + ' g)');
  S.day = 22; F.rows[2] = { strain: 'sunflower', progress: 0.5, quality: 50, water: 1 }; D.newDay(false);
  h.eq(F.rows[2], null, 'a row still growing when winter comes is lost to the frost');
});

test('Bank & Insurance: interest, a loan that comes back daily, and cover that pays', async (h) => {
  const S = h.S, D = h.T.dlc, F = D.fin(); S.bank = 10000; S.level = 1; S.rep = 10;
  D.finMove(4000, true); h.eq(F.savings, 4000, 'into savings'); h.eq(S.bank, 6000, 'out of the bank');
  D.newDay(false); h.eq(F.savings, 4020, 'half a percent a day');
  D.finBorrow('big'); h.eq(F.loan, null, 'the big loan wants level 8');
  D.finBorrow('small'); h.ok(F.loan && F.loan.left === 2240, 'a starter loan costs 12%'); h.eq(S.bank, 8000, 'and the money is in the bank');
  D.newDay(false); h.eq(F.loan.left, 2240 - 224, 'a tenth goes back every morning'); h.eq(S.bank, 8000 - 224, 'out of the bank');
  S.bank = 10; D.newDay(false); h.eq(F.loan.missed, 1, 'a morning you cannot pay is a missed payment'); h.eq(S.rep, 7, 'and costs rep'); h.ok(F.loan.left > 2240 - 224, 'and adds to the debt');
  S.bank = 1000; F.loan = null; F.cover.robbery = true; S.stats.robbed = (S.stats.robbed || 0) + 200; const before = S.bank;
  D.newDay(false); h.ok(S.bank > before, 'robbery cover pays the morning after (' + (S.bank - before) + ')'); h.eq(F.claims.length, 1, 'and there is a statement for it'); h.eq(F.claims[0].sum, 150, '75% of what was taken');
});

test('a new DLC switched off takes its furniture out and keeps what you made', async (h) => {
  const D = h.T.dlc, B = D.breed(); B.owned = true; B.strains.push({ id: 'bredtest', name: 'Kept', emoji: '🧬', seed: 20, growMs: 600000, yield: 14, thc: 1.2, lvl: 1, bud: 1, hair: 2, leaf: 3, bred: true, parents: ['sunflower', 'amber'] });
  h.eq(W().packs().filter((p) => p.dlc).length, 10, 'ten DLC in the Workshop');
  off('breeding', 'hydrobay', 'cup', 'merch'); h.T.applyDlcWorld(true);
  ['breedBench', 'hydroBay', 'trophyCase', 'merchStand'].forEach((id) => h.ok(h.T.propGone(id), id + ' is out of the shop'));
  h.ok(/switched off/.test(D.prompt({ kind: 'breedBench' }, null)), 'and says why if you could still reach it');
  h.eq(D.breed().strains.length, 1, 'the cultivar you bred is still in the save');
  on('breeding', 'hydrobay', 'cup', 'merch'); h.T.applyDlcWorld(true);
  h.ok(!h.T.propGone('breedBench'), 'switched back on, the bench is back');
});
