// The lobby machines: every one keeps its own coin box and its own stock, so buying from one, emptying one
// or loading one never touches another.

function catering(h) { const S = h.S; S.lic = S.lic || {}; S.lic.catering = true; S.bank = 50000; S.pocket = 100; }
const E = (h, kind, propId) => h.T.press({ kind, propId });
const shiftE = (h, kind, propId) => h.T.press({ kind, propId }, true);
function stock(h, id, items) { const st = h.T.machStock(id); Object.keys(st).forEach((k) => { delete st[k]; }); Object.assign(st, items); return st; }

// a customer at the window, handed to the lobby with a plan of what to use on the way out
function lounger(h, plan) {
  h.arrive(1);
  h.until(() => h.S.customer && h.T.npc.human && h.S.customer.arrived, 90, 'a customer at the window', h.patience);
  h.ok(h.T.npc.goLobby(plan), 'the customer heads into the lobby');
  h.S.customer = null;
  const l = h.T.loungers()[h.T.loungers().length - 1];
  h.ok(l && l.plan === plan, 'a lounger with that plan');
  return l;
}

test('two vending machines keep their own coin boxes', async (h) => {
  const S = h.S; catering(h);
  h.R.buyUnit('vending');
  h.ok(h.R.unitIds('vending').indexOf('vending#2') >= 0, 'a second vending machine');
  stock(h, 'vending', { drink: 10, snack: 10 }); stock(h, 'vending#2', { drink: 10, snack: 10 });
  E(h, 'vending', 'vending'); E(h, 'vending', 'vending'); E(h, 'vending', 'vending#2');
  h.eq(h.T.coinBox('vending'), 4, 'two sales in the first machine');
  h.eq(h.T.coinBox('vending#2'), 2, 'one sale in the second');
  shiftE(h, 'vending', 'vending');
  const p0 = S.pocket; E(h, 'vending', 'vending');
  h.eq(S.pocket - p0, 4, 'emptying the first machine takes its own $4');
  h.eq(h.T.coinBox('vending'), 0, 'the first machine is empty');
  h.eq(h.T.coinBox('vending#2'), 2, 'the second machine still holds its $2');
  h.eq(h.T.coinTotal(), 2, 'the machines hold $2 between them');
});

test('two vending machines keep their own stock', async (h) => {
  catering(h);
  h.R.buyUnit('vending');
  const a = stock(h, 'vending', { drink: 3, snack: 0 }), b = stock(h, 'vending#2', {});
  h.eq(h.T.stockTotal('vending', 'drink'), 3, 'three drinks between them');
  h.ok(/0 drinks/.test(h.T.prompt({ kind: 'vending', propId: 'vending#2' })), 'the new machine says it is empty');
  E(h, 'vending', 'vending#2');
  h.eq(a.drink, 3, 'buying at the empty machine takes nothing from the other');
  h.eq(h.T.coinBox('vending#2'), 0, 'and costs nothing');
  E(h, 'vending', 'vending');
  h.eq(a.drink, 2, 'the stocked machine sells from its own racks');
  shiftE(h, 'vending', 'vending#2');
  h.hold({ kind: 'crate', item: 'snack', n: 12 }); E(h, 'vending', 'vending#2');
  h.eq(b.snack, 12, 'a case loads into the machine it was put in');
  h.eq(a.snack || 0, 0, 'and not into the other');
});

test('two coffee machines and two arcades keep their own coin boxes', async (h) => {
  const S = h.S; catering(h); S.lic.amusement = true; S.upgrades.lobby = true;
  h.R.buyUnit('lobbyCoffee'); h.R.buyUnit('arcade');
  stock(h, 'lobbyCoffee', { cup: 10, beans: 10 }); stock(h, 'lobbyCoffee#2', { cup: 10, beans: 10 });
  E(h, 'lobbyCoffee', 'lobbyCoffee#2');
  h.eq(h.T.coinBox('lobbyCoffee#2'), 2, 'the cup was paid into the machine that poured it');
  h.eq(h.T.coinBox('lobbyCoffee'), 0, 'not into the other one');
  h.eq(h.T.machStock('lobbyCoffee#2').cup, 9, 'the cup came out of that machine');
  h.eq(h.T.machStock('lobbyCoffee').cup, 10, 'the other machine still has all its cups');
  E(h, 'lobbyCoffee', 'lobbyCoffee');
  h.eq(h.T.coinBox('lobbyCoffee'), 2, 'a cup from the first machine too');
  shiftE(h, 'lobbyCoffee', 'lobbyCoffee');
  const c0 = S.pocket; E(h, 'lobbyCoffee', 'lobbyCoffee');
  h.eq(S.pocket - c0, 2, 'emptying the first machine takes its own $2');
  h.eq(h.T.coinBox('lobbyCoffee#2'), 2, 'and leaves the second one alone');
  h.R.machState('arcade').box = 5; h.R.machState('arcade#2').box = 7;
  const p0 = S.pocket; E(h, 'arcade', 'arcade#2');
  h.eq(S.pocket - p0, 7, 'the second cabinet paid out its own coins');
  h.eq(h.T.coinBox('arcade'), 5, 'the first cabinet kept its own');
});

test('a lounger pays into, and buys from, the machine they used', async (h) => {
  const S = h.S; catering(h);
  h.R.buyUnit('vending');
  const a = stock(h, 'vending', { drink: 10, snack: 10 }), b = stock(h, 'vending#2', { drink: 10, snack: 10 });
  const l = lounger(h, [{ kind: 'vend', unit: 'vending#2' }]);   // the second machine, so a sale that fell back to the first would show
  const v0 = S.stats.vend || 0;
  h.until(() => (S.stats.vend || 0) > v0, 120, 'the lounger buys from the machine');
  h.eq(l.useUnit, 'vending#2', 'they walked to the second machine');
  h.eq(h.T.coinBox('vending#2'), 2, 'their $2 is in the machine they used');
  h.eq(h.T.coinBox('vending'), 0, 'and not in the first one');
  h.eq(b.drink + b.snack, 19, 'one item came off the second machine\'s racks');
  h.eq(a.drink + a.snack, 20, 'the first machine is untouched');
});

test('customers only head for a machine with something in it', async (h) => {
  catering(h);
  h.R.buyUnit('vending');
  stock(h, 'vending', {}); stock(h, 'vending#2', { drink: 5 });
  const restore = h.random(0);   // every roll says yes, so the plan shows which machines count
  try {
    for (let i = 0; i < 20; i++) { const p = h.T.planFor({}); const v = p.filter((s) => s.kind === 'vend')[0]; h.ok(v && v.unit === 'vending#2', 'the plan names the stocked machine'); }
  } finally { restore(); }
});

test('the drinks fridge keeps what loungers pay, and you can empty it', async (h) => {
  const S = h.S; catering(h);
  S.layout = S.layout || {}; S.layout.fridge = { x: -6, z: 6.3, rot: 0 }; h.R.buildProp('fridge');   // out in the lobby, where customers can reach it
  h.R.machState('fridge').fridge = 6;
  lounger(h, [{ kind: 'fridge', unit: 'fridge' }]);
  const f0 = S.stats.fridge || 0;
  h.until(() => (S.stats.fridge || 0) > f0, 120, 'the lounger takes a can');
  h.eq(h.T.coinBox('fridge'), 2, 'the $2 went into the fridge');
  h.eq(h.T.coinBox('vending'), 0, 'not into the vending machine');
  h.ok(/the box holds/.test(h.T.prompt({ kind: 'fridge', propId: 'fridge' })), 'shut, the fridge says what its box holds');
  shiftE(h, 'fridge', 'fridge');
  h.ok(/Empty the coin box/.test(h.T.prompt({ kind: 'fridge', propId: 'fridge' })), 'open, E empties the coin box');
  const p0 = S.pocket; E(h, 'fridge', 'fridge');
  h.eq(S.pocket - p0, 2, 'emptied into your pocket');
  h.eq(h.T.coinBox('fridge'), 0, 'the box is empty');
  const cans = h.R.machState('fridge').fridge; E(h, 'fridge', 'fridge');
  h.eq(h.R.machState('fridge').fridge, cans - 1, 'with the box empty, E takes a can again');
});

test('an old save\'s shared boxes and stock move into the first machine of each kind', async (h) => {
  const S = h.S, X = h.R.xs();
  delete X.mach.own; S.box = { vend: 11, coffee: 5, arcade: 3 }; S.vendStock = { drink: 7, snack: 4 }; S.coffeeStock = { cup: 22, beans: 9 };
  h.eq(h.T.coinBox('vending'), 11, 'the vending money');
  h.eq(h.T.coinBox('lobbyCoffee'), 5, 'the coffee money');
  h.eq(h.T.coinBox('arcade'), 3, 'the arcade money');
  h.eq(JSON.stringify(h.T.machStock('vending')), JSON.stringify({ drink: 7, snack: 4 }), 'the racks went to the first vending machine');
  h.eq(JSON.stringify(h.T.machStock('lobbyCoffee')), JSON.stringify({ cup: 22, beans: 9 }), 'the cups and beans to the first coffee machine');
  h.eq(S.box, undefined, 'the shared boxes are gone');
  h.eq(S.vendStock, undefined, 'the shared stock is gone');
  h.eq(h.T.cashOnSite() - S.till - S.tips - S.vault - S.pocket, 19, 'none of the money lost from the cash on site');
});

test('a new shop\'s first machines come stocked', async (h) => {
  h.eq(JSON.stringify(h.T.machStock('vending')), JSON.stringify({ drink: 12, snack: 12 }), 'twelve drinks and twelve snacks');
  h.eq(JSON.stringify(h.T.machStock('lobbyCoffee')), JSON.stringify({ cup: 40, beans: 40 }), 'forty cups and forty servings of beans');
});
