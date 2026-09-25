// The pacing rules from the balance pass: the tobacco licence waits for level 8, a big month pays more tax, and a
// heavy till says so.

test('the tobacco licence needs level 8', async (h) => {
  const S = h.S; S.bank = 50000; S.lic = S.lic || {};
  S.level = 7; h.R.actions.buyLic('tobacco');
  h.ok(!S.lic.tobacco, 'refused at level 7');
  h.eq(S.bank, 50000, 'and nothing was charged');
  S.level = 8; h.R.actions.buyLic('tobacco');
  h.ok(S.lic.tobacco, 'granted at level 8');
});

test('the tobacconist pays the table\'s share of shop price', async (h) => {
  h.eq(h.T.data.TOB.wholesale, 0.5, 'half of shop price');
  h.ok(/TOB\.wholesale/.test(String(h.I.expPoiMenu || h.R.expPoiMenu)), 'the tobacconist\'s menu prices from TOB.wholesale');
});

test('a big month pays the higher rate on what it takes over the threshold', async (h) => {
  const E = h.T.data.ECON, B = h.S.books;
  B.exciseDue = 0;
  B.monthGross = 40000; h.eq(h.T.taxDue(), Math.round(40000 * E.taxRate), 'a small month: the flat rate');
  B.monthGross = 100000; h.eq(h.T.taxDue(), Math.round(E.taxHighFrom * E.taxRate + (100000 - E.taxHighFrom) * E.taxHighRate), 'a big month: the higher rate on the part over ' + E.taxHighFrom);
});

test('a heavy till warns once a day and turns the vault readout amber', async (h) => {
  const S = h.S, heavy = h.T.data.TILL_HEAVY;
  S.till = heavy - 10; S.tips = 0; h.T.tillWatch(); h.R.hud();
  h.ok(!S.tillWarnDay, 'no warning under ' + heavy);
  h.ok(!document.getElementById('h-vault').parentNode.classList.contains('heavy'), 'the readout is plain');
  S.tips = 20; h.T.tillWatch(); h.R.hud();
  h.eq(S.tillWarnDay, S.day, 'warned today');
  h.ok(document.getElementById('h-vault').parentNode.classList.contains('heavy'), 'the readout is amber');
  h.ok(/🧾/.test(document.getElementById('h-vault').textContent), 'and shows the till');
  const logs = (S.log || []).filter((l) => /till and the tip jar/.test(l.msg)).length;
  h.T.tillWatch();
  h.eq((S.log || []).filter((l) => /till and the tip jar/.test(l.msg)).length, logs, 'only once a day');
  S.day++; h.T.tillWatch();
  h.eq(S.tillWarnDay, S.day, 'and again the next day');
});

test('levels ask for more each time', async (h) => {
  const X = h.T.data.XP_PER_LEVEL;
  h.eq(X(1), 60, 'level 2 takes 60 XP');
  for (let l = 2; l <= 12; l++) h.ok(X(l) > X(l - 1), 'level ' + (l + 1) + ' takes more than level ' + l);
  h.eq(X(9), 60 + 8 * 55 + 35 * 64, 'level 10 takes 2,740 XP');
});
