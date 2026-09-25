// The line at the window: how many queue, who steps up, and who gives up.

function fillLine(h) {
  const took = h.arrive(6);
  try { h.until(() => h.R.lineup().filter((m) => m.state === 'line').length === 4, 90, 'four people standing in line', h.patience); }
  catch (e) { throw new Error(e.message + ' · line ' + JSON.stringify(h.R.lineup().map((m) => [m.who, m.state, m.slot])) + ' · at the window ' + (h.S.customer && h.S.customer.who) + ' · log ' + JSON.stringify((h.S.log || []).slice(0, 8).map((l) => l.msg))); }
  return took;
}

test('four queue behind the one at the window, and a sixth is turned away', async (h) => {
  const took = fillLine(h);
  h.eq(JSON.stringify(took), JSON.stringify([true, true, true, true, true, false]), 'who got in');
  h.eq(h.T.lineCount(), 4, 'people in line');
  h.ok(h.S.customer, 'someone is at the window');
  const whos = [h.S.customer.who].concat(h.R.lineup().map((m) => m.who));
  h.eq(new Set(whos).size, whos.length, 'nobody is in the shop twice');
});

test('the head of the line steps up the moment the window frees', async (h) => {
  fillLine(h);
  const head = h.R.lineup().filter((m) => m.state === 'line' && m.slot === 0)[0];
  h.ok(head, 'someone is at the front');
  h.T.npc.leaveHappy(); h.S.customer = null;
  h.frame(1);
  h.ok(h.S.customer && h.S.customer.who === head.who, 'the front of the line is now at the window');
  h.ok(h.S.customer.fromLine, 'and came from the line');
  h.until(() => h.S.customer.arrived, 10, 'the new customer to reach the window');
  h.until(() => h.R.lineup().some((m) => m.c && m.state === 'line' && m.slot === 0), 10, 'the rest to shuffle up');
});

test('someone kept waiting too long gives up and costs a point of rep', async (h) => {
  fillLine(h);
  const m = h.R.lineup().filter((x) => x.state === 'line')[1];
  h.S.rep = 50;
  m.waited = 1e6;
  h.frame(1);
  h.eq(m.state, 'leave', 'they walk out');
  h.eq(h.S.rep, 49, 'rep');
  h.eq(h.T.lineCount(), 3, 'people left in line');
});
