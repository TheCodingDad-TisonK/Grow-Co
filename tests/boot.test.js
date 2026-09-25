// The game comes up, runs, and saves.

test('boots into the shop without errors', async (h) => {
  h.ok(h.R.ui.started, 'the game started');
  h.eq(typeof h.S.bank, 'number', 'the bank is a number');
  h.ok(h.I.world.interact.length > 100, 'the world is built with things to use');
  h.ok(h.T && typeof h.T.simTick === 'function', 'the test handle is there');
});

test('a minute of play runs clean', async (h) => {
  const t0 = h.S.steps3d || 0;
  h.step(60);
  h.ok((h.S.steps3d || 0) - t0 >= 59, 'the sim ticked once a second (' + ((h.S.steps3d || 0) - t0) + ' ticks)');
});

test('a change reaches the save', async (h) => {
  h.S.bank = 12345;
  h.step(2);   // save() is a short debounce
  const saved = JSON.parse(localStorage.getItem('rfgrowco-test') || 'null');
  h.ok(saved, 'there is a save under rfgrowco-test');
  h.eq(saved.bank, 12345, 'the bank in the save');
});
