// The rope across the way in: the guard opens it for people he lets in; people leaving go round it.

const gate = (h) => h.T.ropeGates().queueRope;

test('the guard unhooks the rope for a customer he has let in', async (h) => {
  h.ok(gate(h), 'the rope is up');
  h.eq(gate(h).open, 0, 'it starts hooked');
  h.arrive(1);
  let maxOpen = 0, guardHeld = false;
  h.until(() => {
    maxOpen = Math.max(maxOpen, gate(h).open);
    if (h.T.guard.rope && h.T.guard.rope.phase === 'hold') guardHeld = true;
    return h.S.customer && h.S.customer.arrived;
  }, 60, 'the customer to reach the window');
  h.ok(guardHeld, 'the guard held the rope open');
  h.ok(maxOpen >= 0.8, 'the rope opened far enough to pass (' + maxOpen + ')');
  h.until(() => gate(h).open === 0, 10, 'the rope to be hooked back');
});

test('people leaving walk round the rope, never through it', async (h) => {
  h.arrive(1);
  h.until(() => h.S.customer && h.S.customer.arrived, 60, 'the customer to reach the window');
  h.until(() => gate(h).open === 0, 10, 'the rope hooked again');
  h.T.npc.leaveHappy(); h.S.customer = null;
  let maxOpen = 0, maxX = -99, seen = '';
  for (let i = 0; i < 20 * 14; i++) {
    h.frame(1); maxOpen = Math.max(maxOpen, gate(h).open); if (h.T.npc.state === 'leave') maxX = Math.max(maxX, h.T.npc.g.position.x);
    if (gate(h).open > 0 && !seen) seen = 'opened at frame ' + i + ': npc ' + h.T.npc.state + ' at ' + h.T.npc.g.position.x.toFixed(2) + ',' + h.T.npc.g.position.z.toFixed(2) + ' · line ' + JSON.stringify(h.R.lineup().map((m) => [m.who, m.state])) + ' · robbers ' + JSON.stringify(h.T.robbers().map((r) => [r.state, r.pre])) + ' · guard ' + (h.T.guard.rope && h.T.guard.rope.phase) + ' · log ' + JSON.stringify((h.S.log || []).slice(0, 4).map((l) => l.msg));
  }
  h.eq(maxOpen, 0, 'the rope never opened (' + seen + ')');
  h.ok(maxX >= 3, 'they went round the far end, past the guard (reached x ' + maxX.toFixed(2) + ')');
});

test('with the guard sent home the rope stays unhooked', async (h) => {
  h.S.staff.guardOff = true;
  h.step(2);
  h.eq(gate(h).open, 1, 'unhooked while he is off');
  h.S.staff.guardOff = false;
  h.step(3);
  h.eq(gate(h).open, 0, 'hooked again when he is back');
});
