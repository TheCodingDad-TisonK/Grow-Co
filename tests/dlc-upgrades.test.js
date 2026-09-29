// What 1.28 added to the DLC: three upgrades for each, cigars in the Tobacco Works, grades and a technician in the lab,
// rain barrels and beehives on the roof, and photo mode in Dev Tools. tools/test/preload.js switches every DLC on.

const W = () => window.RF_WORKSHOP;
const off = (...ids) => ids.forEach((id) => W().setOn('rf.dlc.' + id, false));
const on = (...ids) => ids.forEach((id) => W().setOn('rf.dlc.' + id, true));

test('a DLC upgrade is paid for once, changes its number, and counts only while its DLC is on', async (h) => {
  const S = h.S, U = h.T.dlcUpg, D = h.T.dlc; S.bank = 5000; S.level = 1;
  Object.keys(U.list).forEach((d) => h.eq(U.list[d].list.length, 3, d + ' has three upgrades'));
  h.eq(Object.keys(U.list).length, 9, 'every DLC but Dev Tools, which has nothing to sell');
  h.eq(D.BREED.ms, 480000, 'a cross takes 8 minutes');
  h.eq(U.buy('breeding', 'culture'), false, 'tissue culture wants level 4'); h.eq(S.bank, 5000, 'and nothing was paid');
  S.level = 6; h.eq(U.buy('breeding', 'culture'), true, 'bought'); h.eq(S.bank, 5000 - 1200, 'from the bank');
  h.eq(D.BREED.ms, 300000, 'a cross takes 5 minutes now'); h.eq(U.buy('breeding', 'culture'), false, 'it cannot be bought twice'); h.eq(S.bank, 3800, 'or paid for twice');
  off('breeding'); h.eq(D.BREED.ms, 480000, 'with the DLC off the number is the old one'); h.eq(U.has('breeding', 'culture'), false, 'and the upgrade does not count');
  h.eq(U.owns('breeding', 'culture'), true, 'but it is still yours');
  on('breeding'); h.eq(D.BREED.ms, 300000, 'and it is back with the DLC');
  S.bank = 100; h.eq(U.buy('hydrobay', 'tank'), false, 'no money, no upgrade'); h.eq(S.bank, 100, 'the bank is untouched');
  h.ok(/Tissue culture/.test(U.pane()) && /Fitted/.test(U.pane()), 'the Upgrades app lists it as fitted');
});

test('every upgrade does what it says', async (h) => {
  const S = h.S, U = h.T.dlcUpg, D = h.T.dlc, give = (d, id) => U.give(d, id);
  h.eq(D.HYDRO.phDrift > 0, true, 'the pH drifts'); give('hydrobay', 'doser'); h.eq(D.HYDRO.phDrift, 0, 'the doser holds it');
  const use = D.HYDRO.feedUse; give('hydrobay', 'tank'); h.eq(D.HYDRO.feedUse, use / 2, 'the bigger tank lasts twice as long');
  h.eq(D.BREED.seeds, 6, 'six seeds'); give('breeding', 'tumbler'); h.eq(D.BREED.seeds, 10, 'ten with the tumbler'); give('breeding', 'library'); h.eq(D.BREED.max, 20, 'and room for twenty');
  h.eq(D.FARM.dryS, 300, 'the barn takes 5 minutes'); give('farm', 'fans'); h.eq(D.FARM.dryS, 150, 'half that with the fans');
  h.eq(D.FIN.interest, 0.12, 'a loan costs 12%'); give('finance', 'standing'); h.eq(D.FIN.interest, 0.08, '8% in good standing');
  give('finance', 'premium'); h.eq(D.FIN.rate, 0.008, 'premium savings pay 0.8%'); h.eq(D.FIN.cap, 1000, 'up to $1,000 a day');
  h.eq(h.T.TOB.kilnT, 60, 'the kiln takes a minute'); give('tobacco', 'kiln'); h.eq(h.T.TOB.kilnT, 40, '40 s with forced air');
  give('tobacco', 'maker'); h.eq(h.T.TOB.sticksS, 10, 'the maker rolls 10 a second'); h.eq(h.T.TOB.packS, 0.8, 'and the packer keeps up');
  h.eq(h.T.cigar.CIGAR.cap, 40, 'the humidor holds 40'); give('tobacco', 'humidor'); h.eq(h.T.cigar.CIGAR.cap, 80, '80 in cedar'); h.eq(h.T.cigar.CIGAR.ageS, 240, 'and cigars age in half the time');
  const M = D.merch(); M.owned = true; S.bank = 5000; h.eq(D.merchOrder('hoodie'), undefined, 'no hoodies on the stand yet'); h.eq(M.orders.length, 0, 'so none can be ordered');
  give('merch', 'hoodie'); D.merchOrder('hoodie'); h.eq(M.orders.length, 1, 'with the upgrade a box of hoodies is on its way'); h.eq(S.bank, 5000 - 160, 'ten at $16');
  const F = D.farm(); F.leased = true; F.rows[0] = { strain: 'sunflower', progress: 0.5, quality: 50, water: 0.05 }; S.x.weather = { kind: 'clear', until: 0 };
  give('farm', 'drip'); D.step(5, false); h.eq(F.rows[0].water, 1, 'drip irrigation waters a dry row');
  S.day = 22; give('farm', 'tunnels'); D.newDay(false); h.ok(F.rows[0], 'and under polytunnels the frost takes nothing');
});

test('cigars: rolled from whole leaf, aged in the humidor, carried up to the cabinet', async (h) => {
  const S = h.S, C = h.T.cigar, D = h.T.dlc, T = h.T.tob(), st = C.state(); S.lic.tobacco = true;
  T.cured = 0.05; h.eq(C.start(true), false, 'five cigars want 0.1 kg of cured leaf');
  T.cured = 1; h.eq(C.start(true), true, 'with a kilo of leaf a lot is on the table'); h.ok(Math.abs(T.cured - 0.9) < 1e-6, 'and 0.1 kg of it is gone');
  h.eq(C.start(true), false, 'one lot at a time');
  D.step(C.CIGAR.rollS + 1, false); h.eq(st.job, null, 'rolled'); h.eq(C.count(st), 5, 'five in the humidor'); h.eq(C.aged(st), 0, 'none of them aged');
  h.hold(null); h.eq(C.take(), false, 'a young cigar stays where it is');
  D.step(C.CIGAR.ageS + 1, false); h.eq(C.aged(st), 5, 'aged');
  h.eq(C.take(), true, 'now they come out'); const held = h.R.held(); h.ok(held && held.kind === 'cigs' && held.sku === 'cigar' && held.n === 5, 'five cigars in your hands'); h.eq(C.count(st), 0, 'and the humidor is empty');
  st.keep = 0.5; T.cured = 0.6; h.ok(Math.abs(h.T.tobSpare(T) - 0.1) < 1e-6, 'the shredder may take what is over the leaf you keep back'); T.cured = 0.3; h.eq(h.T.tobSpare(T), 0, 'and nothing of what is under it');
  st.humidor = [{ n: C.CIGAR.cap, t: 0 }]; T.cured = 1; h.eq(C.start(true), false, 'a full humidor takes no more');
  S.x.staff.operator = true; st.humidor = []; st.job = null; T.cured = 1; D.step(1, false); h.ok(st.job, 'a basement operator rolls for you');
});

test('the lab: a batch carries the grade of its bud and the price follows it', async (h) => {
  const S = h.S, L = h.T.lab, st = L.state(); st.job = null; st.out = { cart: 0, hash: 0, gummy: 0, choc: 0 }; st.q = {}; st.honey = 0; S.cigStock = {}; S.cigQ = {}; S.supplies.mix = 0;
  S.stash = { sunflower: { g: 20, qSum: 20 * 85, thcSum: 20 }, amber: { g: 20, qSum: 20 * 35, thcSum: 20 } };
  h.eq(L.grade(85), 'A', 'quality 85 is grade A'); h.eq(L.grade(65), 'B', '65 is B'); h.eq(L.grade(45), 'C', '45 is C'); h.eq(L.grade(20), 'D', '20 is D');
  h.eq(L.price('cart', 85), 46, 'a grade A cart sells for 30% over the list price'); h.eq(L.price('cart', 20), 30, 'a grade D one for 15% under'); h.eq(L.price('cart', undefined), 35, 'stock from before has no grade and sells at list');
  h.eq(L.price('cigNB', 95), 13, 'cigarettes have no grade');
  h.eq(L.start('sunflower', 'gummy', true), false, 'gummies need a baking mix or honey');
  h.eq(L.start('sunflower', 'cart', true), true, 'a cart batch starts'); h.eq(st.job.q, 85, 'it remembers the quality of its bud'); h.eq(S.stash.sunflower.g, 10, '10 g went in');
  L.tick(st.job.dur + 1); h.eq(st.job, null, 'done'); h.eq(st.out.cart, 3, 'three carts on the shelf'); h.eq(st.q.cart, 85, 'at quality 85');
  st.honey = 1; h.eq(L.start('amber', 'gummy', true), true, 'with honey in the store gummies run without a mix'); h.eq(st.honey, 0, 'and use a jar'); h.eq(st.job.q, 43, 'honey lifts the batch 8 points');
  st.job = null; L.stockAdd('cart', 3, 90); L.stockAdd('cart', 3, 50); h.eq(L.cigQ('cart'), 70, 'the cabinet keeps the average of what is put in it'); h.eq(S.cigStock.cart, 6, 'six in it');
  h.T.dlcUpg.give('lab', 'bench'); S.stash.sunflower = { g: 20, qSum: 20 * 60, thcSum: 20 }; L.start('sunflower', 'hash', true); h.eq(st.job.q, 70, 'the test bench adds 10 points');
  h.T.dlcUpg.give('lab', 'still'); h.T.dlcUpg.give('lab', 'column'); st.job = null; L.start('sunflower', 'hash', true); h.eq(st.job.n, 5, 'the still makes a quarter more'); h.eq(st.job.dur, 23, 'the second column takes a third off the time');
});

test('the lab technician runs the rough bud, never the good', async (h) => {
  const S = h.S, L = h.T.lab, D = h.T.dlc, st = L.state(); st.job = null; st.out = { cart: 2, hash: 0, gummy: 0, choc: 0 }; S.cigStock = {}; S.supplies.mix = 0; st.honey = 0;
  S.stash = { sunflower: { g: 50, qSum: 50 * 90, thcSum: 50 }, amber: { g: 20, qSum: 20 * 40, thcSum: 20 } };
  const p = L.techPick(); h.ok(p && p.strain === 'amber', 'he takes the amber at quality 40 and leaves the sunflower at 90'); h.eq(p.sku, 'hash', 'and makes hash: there is none, and gummies have nothing to set them');
  S.x.staff.labtech = false; D.step(6, false); h.eq(st.job, null, 'nobody hired, nothing started');
  S.x.staff.labtech = true; D.step(6, false); h.ok(st.job && st.job.sku === 'hash', 'hired, he starts a batch by himself'); h.eq(S.stash.sunflower.g, 50, 'the good bud is untouched');
  st.job = null; S.stash = { sunflower: { g: 50, qSum: 50 * 90, thcSum: 50 } }; h.eq(L.techPick(), null, 'with only good bud in the stash he waits');
});

test('the roof: barrels water the beds, hives make honey, and neither outlives the DLC', async (h) => {
  const S = h.S, R = h.T.roofx, U = h.T.dlcUpg, D = h.T.dlc, st = R.state(); S.x.weather = { kind: 'clear', until: 0 };
  h.eq(R.watered(), false, 'no barrels, no watering'); h.eq(R.grams(), 25, 'a bed gives 25 g');
  U.give('greenhouse', 'barrels'); st.water = 50; h.eq(R.watered(), true, 'barrels with water in them water the beds');
  S.x.roof[0] = { stage: 'grow', t: 0 }; S.x.roof[1] = { stage: 'grow', t: 0 }; D.step(100, false); h.ok(Math.abs(st.water - (50 - 0.012 * 2 * 100)) < 0.01, 'two growing beds drain them (' + st.water + ')');
  S.x.weather = { kind: 'rain', until: 0 }; D.step(10, false); h.ok(st.water > 50, 'and rain fills them (' + st.water + ')');
  st.water = 0; h.eq(R.watered(), false, 'empty barrels water nothing');
  U.give('greenhouse', 'hives'); h.eq(R.grams(), 30, 'with the hives a bed gives 30 g');
  st.honey = 0; S.day = 2; D.newDay(false); h.eq(st.honey, 1, 'a jar of honey a day in spring'); S.day = 23; D.newDay(false); h.eq(st.honey, 1, 'none in winter');
  st.water = 80; off('greenhouse'); h.eq(R.watered(), false, 'switched off, the barrels do nothing'); h.eq(R.grams(), 25, 'and the beds give what they gave'); on('greenhouse');
});

test('photo mode takes the camera and gives it back, and the menu drive stops when the game starts', async (h) => {
  const T = h.T, P = T.photo; T.updateMenuDrive(0.05); h.eq(T.menuDrive.on, false, 'the drive behind the menu is off in a running game');
  h.eq(P.on(), true, 'photo mode starts'); h.eq(h.R.ui.blocked(), true, 'and you cannot walk or use anything while it is on');
  h.R.player.keys.KeyW = true; const z0 = P.state.pos.clone(); P.update(0.5); h.ok(P.state.pos.distanceTo(z0) > 1, 'W flies the camera'); h.R.player.keys.KeyW = false;
  const home = h.R.player.pos.clone(); h.ok(h.R.player.pos.distanceTo(home) < 1e-6, 'you stay where you stood');
  P.off(); h.eq(P.state.on, false, 'it ends'); h.eq(h.R.ui.photoOn, false, 'and the game is yours again');
});
