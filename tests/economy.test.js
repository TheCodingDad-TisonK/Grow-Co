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

// the morning bill: arrears are paid down in instalments, and a day that rolls while the shop was shut starts in the morning
test('the arrears sweep takes at most half of what the bank holds after the bills', async (h) => {
  const S = h.S, share = h.T.data.COST.arrearsShare;
  h.ok(share > 0 && share < 1, 'the arrears share is a fraction');
  S.day = 20; S.bank = 6000; S.vault = 0; S.till = 0; S.pocket = 0;
  if (!S.books) S.books = {}; S.books.arrears = 5000; S.books.dayOther = 0; S.books.monthOther = 0;
  S.clock = 23.99; h.T.simStep(1, false);   // 1 s is 0.02 h at the default day length, so the day rolls once
  h.eq(S.day, 21, 'one day rolled');
  const paid = S.books.lastBill.paid; h.ok(paid > 0 && paid < 6000, 'the bills were paid in full');
  const left = 6000 - paid, cl = Math.floor(left * share);
  h.eq(S.books.arrears, 5000 - cl, 'the arrears came down by the instalment only');
  h.ok(S.bank >= left - cl - 1, 'the bank keeps the other half: ' + S.bank + ' of ' + left);
  h.ok((S.log || []).some((l) => /off the arrears/.test(l.msg)), 'the instalment is logged');
});

test('a day that rolled while the game was shut starts in the morning', async (h) => {
  const S = h.S, day = S.day || 1;
  S.clock = 47.5;   // nearly two days of clock built up while away
  h.T.simStep(1, true);
  h.eq(S.day, day + 1, 'time away turns the calendar one day at most');
  h.ok(S.clock <= 8, 'the leftover clock is capped at the morning, not left near midnight: ' + S.clock);
  // with the sky pinned to one hour the days run on dayAcc instead, and the same cap applies
  const SET = h.T.settings, was = SET.dayNight; SET.dayNight = 'clock';
  try {
    S.dayAcc = 47.5; h.T.simStep(1, true);
    h.eq(S.day, day + 2, 'the pinned-sky calendar also turns one day at most');
    h.ok(S.dayAcc <= 8, 'the pinned-sky accumulator is capped the same way: ' + S.dayAcc);
  } finally { SET.dayNight = was; }
});
