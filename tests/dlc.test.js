// DLC: the Tobacco Works, the Extraction Lab, the Roof Greenhouse and Dev Tools switch on and off in the Workshop.
// tools/test/preload.js switches them all on, so every other test sees the whole game.

const W = () => window.RF_WORKSHOP;
const off = (...ids) => ids.forEach((id) => W().setOn('rf.dlc.' + id, false));
const on = (...ids) => ids.forEach((id) => W().setOn('rf.dlc.' + id, true));

test('a new shop starts with every DLC off, and a shop that already uses one keeps it', async (h) => {
  const pick = (saves) => JSON.stringify(W().dlcFromSaves(saves).sort());
  h.eq(pick([{ bank: 220, day: 1, lic: {}, x: { roof: [{ stage: 'empty' }], lab: { job: null, out: { cart: 0 } } } }]), '[]', 'a fresh shop switches nothing on');
  h.eq(pick([{ lic: { tobacco: true } }]), '["rf.dlc.tobacco"]', 'the tobacco licence');
  h.eq(pick([{ x: { lab: { job: null, out: { cart: 0, hash: 2 } } } }]), '["rf.dlc.lab"]', 'hash waiting on the lab shelf');
  h.eq(pick([{ cigStock: { gummy: 3 } }]), '["rf.dlc.lab"]', 'gummies in the cabinet');
  h.eq(pick([{ x: { roof: [{ stage: 'empty' }, { stage: 'grow' }] } }]), '["rf.dlc.greenhouse"]', 'a sown roof bed');
  h.ok(W().dlcFromSaves([{ lic: { tobacco: true }, x: { roof: [{ stage: 'ready' }], lab: { job: {} } } }]).indexOf('rf.dlc.dev') < 0, 'Dev Tools are never switched on for you');
  h.eq(W().packs().filter((p) => p.dlc).length, 4, 'four DLC in the Workshop');
});

test('Dev Tools switched off: no button, and the cheats do nothing', async (h) => {
  off('dev'); const S = h.S, bank = S.bank, btn = () => document.querySelector('#g3-menu [data-menu="dev"]');
  h.R.devAction('money'); h.eq(S.bank, bank, 'no money appeared');
  h.T.openMenu(); h.ok(btn().hidden, 'the Dev tools button is gone from the pause menu'); h.T.closeMenu();
  on('dev');
  h.T.openMenu(); h.ok(!btn().hidden, 'and back once it is on'); h.T.closeMenu();
  h.R.devAction('money'); h.eq(S.bank, bank + 1000, 'the cheats work again');
});

test('the Tobacco Works switched off: the licence sleeps, is not for sale, and nobody asks for cigarettes', async (h) => {
  const S = h.S; S.level = 10; S.bank = 50000; S.lic = S.lic || {};
  off('tobacco');
  h.R.actions.buyLic('tobacco'); h.ok(!S.lic.tobacco, 'not sold'); h.eq(S.bank, 50000, 'and not charged');
  S.lic.tobacco = true;   // bought before it was switched off
  h.ok(/DLC/.test(h.T.prompt({ kind: 'tabletDock' })), 'the tablet dock says it is a DLC');
  S.cigStock = { cigNS: 5, gummy: 5 };
  h.eq(JSON.stringify(h.T.anyCigStock()), '["gummy"]', 'customers ask for gummies, not cigarettes');
  const X = S.x, rep = S.rep = 40; X.jobs.push({ id: 'jt1', via: 'tablet', addr: '1 Test St', sku: 'cigNS', qty: 2, pay: 20, born: h.now(), until: h.now() + 1000, x: 0, z: 30 });
  h.step(3); h.ok(!X.jobs.some((j) => j.id === 'jt1'), 'a round left open is called off'); h.eq(S.rep, rep, 'and costs no rep');
  on('tobacco');
  h.eq(JSON.stringify(h.T.anyCigStock().sort()), '["cigNS","gummy"]', 'switched back on, the cigarettes sell again');
});

test('the basement, the lab and the roof stay shut while their DLC are off', async (h) => {
  const P = h.R.player;
  off('tobacco', 'lab'); P.floor = 0;
  h.T.press({ kind: 'cellarDown' }); h.step(1); h.eq(P.floor, 0, 'the cellar hatch goes nowhere');
  on('lab');
  h.T.press({ kind: 'cellarDown' }); h.step(1); h.eq(P.floor, -1, 'with the lab on, the basement opens for the lab door');
  off('lab');
  P.pos.set(0, -4.35, 0); h.T.press({ kind: 'zoneDoor', zone: 'lab' }); h.step(1); h.ok(P.pos.x < 14, 'not in the lab');
  off('greenhouse'); P.floor = 1; P.pos.set(-10.6, 4.65, -3.0);
  h.T.press({ kind: 'roofUp' }); h.step(1); h.eq(P.floor, 1, 'the roof ladder goes nowhere');
  h.ok(/DLC/.test(h.T.prompt({ kind: 'roofUp' })), 'and says why');
  on('greenhouse');
  h.T.press({ kind: 'roofUp' }); h.step(1); h.eq(P.floor, 2, 'up on the roof once it is on');
});

test('a DLC switched off takes its things out of the shop: the hatch, the cabinet, the tablet dock, the roof ladder', async (h) => {
  const gone = (id) => h.T.propGone(id), roofUp = () => h.I.world.interact.filter((m) => m.userData.interact && m.userData.interact.kind === 'roofUp')[0];
  off('tobacco'); h.T.applyDlcWorld(true);
  h.ok(gone('tabletDock'), 'no tablet dock');
  h.ok(!gone('cellarHatch') && !gone('cigCabinet'), 'the lab still uses the hatch and the cabinet');
  off('lab'); h.T.applyDlcWorld(true);
  h.ok(gone('cellarHatch') && gone('cigCabinet'), 'with the lab off too, the hatch and the cabinet go');
  h.ok(!h.R.props.cellarHatch.g.visible && !h.R.props.cigCabinet.g.visible, 'and are not drawn');
  h.ok(h.I.world.obstacles.every((o) => o.prop !== 'cigCabinet' && o.prop !== 'cellarHatch'), 'nor in the way');
  off('greenhouse'); h.T.applyDlcWorld(true);
  h.ok(h.T.ghParts().length > 10 && h.T.ghParts().every((o) => !o.visible), 'the roof ladder, the hatch up there and the greenhouse are gone');
  h.eq(roofUp().userData.interact.dlc, 'greenhouse', 'the ladder takes no E while it is gone');
  on('tobacco', 'lab', 'greenhouse'); h.T.applyDlcWorld(true);
  h.ok(!gone('cellarHatch') && !gone('cigCabinet') && !gone('tabletDock'), 'all back once they are on');
  h.ok(h.R.props.cigCabinet.g.visible && roofUp().parent && h.T.ghParts().some((o) => o.visible), 'drawn again, ladder included');
});

test('a roof bed and a lab batch wait while their DLC are off', async (h) => {
  const S = h.S; S.clock = 12; h.step(0.1);
  const X = S.x; X.roof[0] = { stage: 'grow', t: 10 }; X.lab.job = { sku: 'gummy', n: 2, t: 0, dur: 5 }; X.lab.out.gummy = 0;
  off('greenhouse', 'lab'); h.step(8);
  h.eq(X.roof[0].t, 10, 'the bed did not grow'); h.eq(X.lab.out.gummy, 0, 'the batch did not finish');
  on('greenhouse', 'lab'); h.step(8);
  h.ok(X.roof[0].t > 10, 'the bed grows again'); h.eq(X.lab.out.gummy, 2, 'the batch finished');
});
