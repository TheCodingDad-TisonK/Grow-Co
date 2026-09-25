// Robbers pass for customers until the mask comes down.

test('a robber can pass for a customer: he queues, steps up and masks at the window', async (h) => {
  h.arrive(1);   // someone at the window, so he has to wait his turn
  h.until(() => h.S.customer && h.S.customer.arrived, 60, 'the first customer at the window', h.patience);
  h.R.startRobbery('gun');
  const r = h.T.robbers()[0];
  r.plan = 'queue';
  const back = h.random(0.99);   // the guard does not catch his card
  try {
    h.until(() => r.pre === 'queue' && r.slot >= 0, 60, 'the robber to join the line');
    h.eq(r.masked, false, 'still no mask while he waits');
    h.eq(h.T.lineShown(), 1, 'the line count on screen includes him (line ' + JSON.stringify(h.R.lineup().map((m) => [m.who, m.state, !!m.c])) + ', at the window ' + (h.S.customer && h.S.customer.who) + ', log ' + JSON.stringify((h.S.log || []).slice(0, 6).map((l) => l.msg)) + ')');
    h.T.npc.leaveHappy(); h.S.customer = null;   // the window frees
    h.until(() => r.masked, 30, 'the mask');
  } finally { back(); }
  h.ok(Math.abs(r.g.position.z - 5.25) < 0.6, 'he masked at the window (z ' + r.g.position.z.toFixed(2) + ')');
  h.ok(h.T.heist().masked, 'a robbery is on');
});

test('the guard can catch a fake ID at the door', async (h) => {
  h.S.rep = 20;
  const back = h.random(0);   // the check always catches it
  try {
    h.R.startRobbery('knife');
    const r = h.T.robbers()[0];
    h.until(() => h.T.heist().aborted, 60, 'the guard to turn him away');
    h.ok(r.state === 'flee' || r.state === 'away', 'he leaves (' + r.state + ')');
  } finally { back(); }
  h.eq(h.S.rep, 21, 'rep for the catch');
  h.eq(h.T.heist().masked, false, 'no mask ever came down');
});

test('the line runs for the door when the mask comes down', async (h) => {
  h.arrive(3);
  h.until(() => h.R.lineup().filter((m) => m.state === 'line').length === 2, 90, 'two in line', h.patience);
  h.R.startRobbery('knife');
  const r = h.T.robbers()[0];
  h.T.maskUp(r);
  h.eq(h.S.customer, null, 'the customer at the window ran');
  h.eq(h.T.lineCount(), 0, 'nobody is still waiting');
  h.ok(h.R.lineup().every((m) => m.state === 'leave'), 'everyone in the line is leaving');
});
