// The storage racking and the crew's restock: crates keep their labelled bay, go back up by hand, and come down
// one at a time when the crew fill the machines.

const E = (h, kind, extra, shift) => h.T.press(Object.assign({ kind }, extra || {}), shift);

test('every item keeps its bay, so crates never shuffle along', async (h) => {
  const S = h.S; S.storage = { soil: 20, drink: 24, snack: 12 };
  const B = h.T.rackBays();
  const drinkBay = B.drink, snackBay = B.snack;
  h.ok(B.soil !== undefined && drinkBay !== undefined && snackBay !== undefined, 'each item has a bay');
  h.eq(new Set([B.soil, drinkBay, snackBay]).size, 3, 'three different bays');
  E(h, 'storeItem', { item: 'soil', bay: B.soil }, true);   // Shift+E: every bag of soil
  h.eq(S.storage.soil, 0, 'the soil is all taken');
  h.eq(h.T.rackBays().soil, undefined, 'its bay is free again');
  h.eq(h.T.rackBays().drink, drinkBay, 'the drinks stayed where they were');
  h.eq(h.T.rackBays().snack, snackBay, 'and so did the snacks');
  h.ok(/^[A-D][1-6]$/.test(h.T.rackBayCode(drinkBay)), 'bays have a code like A1');
});

test('a crate in your hands goes back up into its own bay', async (h) => {
  const S = h.S; S.storage = { drink: 12 };
  h.hold({ kind: 'crate', item: 'soil', n: 10 });
  h.ok(/Rack your crate/.test(h.T.prompt({ kind: 'storage' })), 'the racking offers to take it');
  E(h, 'storage');
  h.eq(S.storage.soil, 10, 'ten bags of soil are back in storage');
  h.eq(h.R.held(), null, 'your hands are empty');
  h.ok(h.T.rackBays().soil !== undefined && h.T.rackBays().soil !== h.T.rackBays().drink, 'the soil has a bay of its own');
  h.hold({ kind: 'crate', item: 'drink', n: 12 });
  E(h, 'storeItem', { item: 'drink', bay: h.T.rackBays().drink });
  h.eq(S.storage.drink, 24, 'E on the drinks bay with a crate of drinks racks it');
});

test('the crew restock one crate at a time, open and shut the machine, and never touch the coins', async (h) => {
  const S = h.S; S.lic = S.lic || {}; S.lic.catering = true; S.bank = 50000;
  h.R.buyUnit('vending');
  ['vending', 'vending#2'].forEach((u) => { const st = h.T.machStock(u); Object.keys(st).forEach((k) => { delete st[k]; }); });
  h.R.machState('vending').box = 5; h.R.machState('vending#2').box = 7;
  S.storage = { drink: 24 };
  h.T.hireWorker(); h.T.workerTask('restock', 0);
  let most = 0, opened = { vending: false, 'vending#2': false }, trips = 0, was = null, far = 0;
  h.until(() => {
    const r = h.T.crew()[0], c = r && r.carry;
    if (c) { most = Math.max(most, c.n); if (c !== was) trips++; }
    was = c;
    ['vending', 'vending#2'].forEach((u) => { if (h.R.machState(u).vendDoor && !opened[u]) { opened[u] = true; const P = h.R.propPlacement(u), g = h.T.crew()[0].g.position; far = Math.max(far, Math.hypot(g.x - P.x, g.z - P.z)); } });
    return (S.storage.drink || 0) === 0 && !c && !h.R.machState('vending').vendDoor && !h.R.machState('vending#2').vendDoor && h.T.stockTotal('vending', 'drink') === 24;
  }, 600, 'the crew put both cases away and shut the machines');
  h.eq(most, 12, 'never more than one case in their arms');
  h.eq(trips, 2, 'two trips for two cases');
  h.ok(opened.vending && opened['vending#2'], 'each machine was opened to load it');
  h.ok(far < 1.2, 'by someone standing at it (' + far.toFixed(2) + ' m away at most)');
  h.eq(h.T.machStock('vending').drink, 12, 'one case in the first machine');
  h.eq(h.T.machStock('vending#2').drink, 12, 'and one in the second, the emptiest first');
  h.eq(h.T.coinBox('vending'), 5, 'the first machine still has its coins');
  h.eq(h.T.coinBox('vending#2'), 7, 'and so does the second');
});

test('a crate in someone\'s arms is never lost: sent home, or saved mid-errand', async (h) => {
  const S = h.S; S.bank = 50000; S.storage = { soil: 30 };
  h.T.hireWorker(); h.T.workerTask('restock', 0);
  h.until(() => h.T.crew()[0] && h.T.crew()[0].carry, 120, 'a crate in their arms');
  const carried = h.T.crew()[0].carry.n;
  h.eq(S.storage.soil, 30 - carried, 'it came off the racking');
  h.T.crewShift(0, true);
  h.eq(S.storage.soil, 30, 'sent home, the crate went back');
  h.eq(h.T.crewList()[0].carry, null, 'and their saved record holds nothing');
  h.T.crewShift(0, false); h.T.workerTask('restock', 0);
  h.until(() => h.T.crew()[0] && h.T.crew()[0].carry, 120, 'a crate in their arms again');
  h.ok(h.T.crewList()[0].carry, 'the crate is on their saved record');
  const held2 = h.T.crewList()[0].carry.n, before = S.storage.soil;
  h.T.crew().length = 0; h.frame(1);   // what a reload does: the runtime crew is rebuilt from the save
  h.eq(S.storage.soil, before + held2, 'the crate is back on the racking');
  h.eq(h.T.crewList()[0].carry, null, 'and off their saved record');
});
