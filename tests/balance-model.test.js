// The balance model (tools/balance/model.js) must say what the running game does. If one of these fails,
// the game's economy changed and the model (and so docs/Balance.md) is out of date.
// @include tools/balance/model.js

function model(h) { return window.GrowBalance.create(h.T.data); }

test('the model prices goods exactly as the game does', async (h) => {
  const M = model(h), P = h.T.price, S = h.S;
  S.market = 1; S.rep = 0; S.chill = null;
  h.T.data.STRAINS.forEach((st) => [40, 70, 100].forEach((q) => {
    h.near(M.unit('bags', q, st.thc), P.bag(q, st.thc), 1e-9, 'bag ' + st.id + ' q' + q);
    h.near(M.unit('joints', q, st.thc), P.joint(q, st.thc), 1e-9, 'joint ' + st.id + ' q' + q);
    h.near(M.unit('cookies', q, st.thc), P.cookie(q, st.thc), 1e-9, 'cookie ' + st.id + ' q' + q);
  }));
  S.rep = 60; h.near(M.unit('bags', 80, 1.3, { rep: 60 }), P.bag(80, 1.3), 1e-9, 'with rep');
});

test('the model bills a day exactly as the game does', async (h) => {
  const M = model(h), S = h.S;
  [{ day: 5, tent: 0, light: 'none' }, { day: 12, tent: 1, light: 'led' }, { day: 40, tent: 3, light: 'hps' }].forEach((c) => {
    S.day = c.day; S.tent = c.tent; S.light = c.light; S.plants = []; S.staff.guardOff = false;
    const slots = h.T.data.TENTS[c.tent].slots;
    const m = M.bills({ day: c.day, slots, light: c.light, plants: 0, lic: { tobacco: !!(S.lic && S.lic.tobacco) } });
    h.near(m.total - m.wages, h.T.dailyFixed(), 1e-9, 'the bill on day ' + c.day + ' with ' + slots + ' slots');
  });
});

test('the model harvests the grams the game does', async (h) => {
  const M = model(h), S = h.S;
  [['sunflower', 'none', {}], ['widow', 'led', { trimmer: 1 }], ['runtz', 'array', { trimmer2: 1 }]].forEach(([strain, light, up]) => {
    S.light = light; Object.keys(up).forEach((k) => { S.upgrades[k] = true; });
    const m = M.plant({ strain, light, up });
    S.hotbar = [null, null, null, null, null, null]; S.slot = 0;
    S.plants = [{ id: 'p-' + strain, strain, progress: 1, quality: m.qHarvest, thirst: 0, fed: true, hazard: null, slot: 0 }];
    h.R.actions.harvest('p-' + strain);
    const got = h.R.held();
    h.ok(got && got.kind === 'harvest', 'a harvest in hand for ' + strain);
    h.near(got.grams, m.wet, 1e-9, strain + ' under ' + light + ' (wet grams)');
    Object.keys(up).forEach((k) => { S.upgrades[k] = false; });
  });
});

test('the model orders what customers really order', async (h) => {
  const M = model(h), S = h.S;
  S.pkg.cookies.n = 50;   // cookies on the shelf, so they can be asked for
  const n = 3000, got = { joints: 0, bags: 0, cookies: 0 }; let acc = 0;
  for (let i = 0; i < n; i++) { const c = h.T.newCustomer(false); c.lines.forEach((l) => { got[l.kind] += l.qty; }); acc += c.acc.length; }
  const want = M.orderMix(true);
  Object.keys(got).forEach((k) => h.near(got[k] / n, want[k], want[k] * 0.08 + 0.02, 'units of ' + k + ' per customer'));
  h.near(acc / n, 0.45 * 1.35, 0.06, 'counter extras per customer');
});
