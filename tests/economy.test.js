// Money in and money out: prices, buying, and a sale at the window from start to finish.

// a customer at the window with a simple order: no counter extras, no cigarettes, a good ID
async function customerAtWindow(h, pay) {
  h.R.customerArrives(false);
  const c = h.S.customer;
  c.acc = []; delete c.cig; c.pay = pay; if (c.id) { c.id.ok = true; c.id.flaw = -1; }
  h.until(() => c.arrived && (h.T.npc.state === 'wait' || h.T.npc.state === 'rack'), 60, 'the customer to reach the window');
  return c;
}
function handEverything(h, c) {
  c.lines.forEach((l) => { h.hold({ kind: l.kind, n: l.qty, qSum: 70 * l.qty, thcSum: 1.2 * l.qty, strain: l.strain }); h.T.handOver(); });
}

test('prices rise with quality', async (h) => {
  const P = h.T.price;
  h.ok(P.bag(80, 1.2) > P.bag(40, 1.2), 'a quality 80 bag costs more than a quality 40 bag');
  h.ok(P.joint(80, 1.2) > P.joint(40, 1.2), 'a quality 80 joint costs more than a quality 40 joint');
  h.eq(P.unit('bags', 60, 1.2), P.bag(60, 1.2), 'unitPrice for bags is bagPrice');
  h.ok(P.bag(60, 1.2) > P.joint(60, 1.2), 'a bag costs more than a joint of the same bud');
});

test('buying a supply takes its price from the bank', async (h) => {
  const soil = h.T.data.SUPPLIES.filter((s) => s.id === 'soil')[0];
  h.ok(soil, 'soil is on the supply list');
  h.S.bank = 1000;
  h.R.actions.buy('soil');
  h.eq(h.S.bank, 1000 - soil.price, 'the bank after buying soil');
});

test('a customer served by card pays straight into the bank', async (h) => {
  const c = await customerAtWindow(h, 'card');
  const bank0 = h.S.bank, sold0 = h.S.stats.sold;
  handEverything(h, c);
  h.eq(c.stage, 'pay', 'once everything is handed over they pay');
  h.ok(c.due > 0, 'there is something to pay (' + c.due + ')');
  const back = h.random(0.99); h.R.payActions.payCard(); back();   // 0.99: the card is not declined
  h.eq(h.S.customer, null, 'the customer is done');
  h.ok(h.S.bank >= bank0 + c.due, 'the bank went up by the bill (' + (h.S.bank - bank0) + ' for ' + c.due + ')');
  h.ok(h.S.stats.sold > sold0, 'the sale was counted');
});

test('a cash customer pays into the till once the change is right', async (h) => {
  const c = await customerAtWindow(h, 'cash');
  const till0 = h.S.till;
  handEverything(h, c);
  h.eq(c.stage, 'pay');
  c.tendered = c.due + 5;   // they hand over a note: $5 change owed
  h.R.payActions.payCash();
  h.eq(c.stage, 'change', 'counting out change');
  h.R.payActions.chg(5);
  h.R.payActions.chgGive();
  h.eq(h.S.customer, null, 'the customer is done');
  h.eq(h.S.till, till0 + c.due, 'the till keeps exactly the bill');
});
