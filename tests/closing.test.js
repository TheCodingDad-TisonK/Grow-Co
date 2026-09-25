// Closing time and the break note: a shut shop lets nobody new in but serves whoever is inside, and a note on the
// drawn window curtain keeps the line waiting for five minutes.

const inside = (h) => h.T.lineup().filter((m) => m.c && (m.state === 'line' || m.state === 'toslot'));
function busyShop(h) {   // one at the window, two waiting in line inside
  h.arrive(3);
  h.until(() => h.S.customer && h.S.customer.arrived && inside(h).length === 2 && inside(h).every((m) => m.state === 'line'), 120, 'a customer at the window and two in line', h.patience);
}

test('closing turns away whoever is still outside and serves whoever is inside', async (h) => {
  const S = h.S; busyShop(h);
  const atWindow = S.customer.who;
  h.arrive(1);
  const late = h.T.lineup().filter((m) => m.c && m.state === 'enter')[0];
  h.ok(late, 'someone is on the way in');
  h.T.toggleShopOpen();
  h.ok(!h.R.shop().open, 'the shop is closed');
  h.eq(S.customer && S.customer.who, atWindow, 'the one at the window is still served');
  h.eq(late.state, 'leave', 'the one outside turned round');
  h.eq(inside(h).length, 2, 'the two inside keep their places');
  S.noCustomersUntil = 0; S.lastCustomer = 0;
  for (let i = 0; i < 90; i++) { h.T.simTick(); h.patience(); }
  h.eq(h.T.lineup().filter((m) => m.c && m.state === 'enter').length, 0, 'nobody new walks in');
  h.T.npc.leaveHappy(); S.customer = null; h.frame(1);
  h.ok(S.customer && S.customer.fromLine, 'the head of the line still steps up to be served');
});

test('the front door opens for someone leaving while the shop is shut', async (h) => {
  const S = h.S, fd = h.R.world.frontDoor;
  h.arrive(1);
  h.until(() => S.customer && S.customer.arrived, 90, 'a customer at the window', h.patience);
  h.T.toggleShopOpen();
  h.step(3);
  h.ok(fd.t < 0.1, 'the door is shut');
  h.T.npc.leaveHappy(); S.customer = null;
  let opened = false;
  h.until(() => { if (fd.t > 0.6) opened = true; return opened && h.T.npc.state !== 'leave'; }, 60, 'the customer walks out through the door');
  h.ok(opened, 'the door opened for them');
  h.step(4);
  h.ok(fd.t < 0.2, 'and shut behind them');
});

test('a robber still outside gives up when the door locks', async (h) => {
  h.S.till = 200;
  h.R.startRobbery('knife');
  const rs = h.T.robbers().filter((r) => r.state !== 'away');   // the pool holds two; only the ones on the job count
  h.ok(rs.length && rs.every((r) => r.state === 'case' && r.pre === 'walk'), 'a robbery is on its way in');
  h.T.toggleShopOpen();
  h.ok(rs.every((r) => r.state === 'flee'), 'every robber outside walks off');
  h.ok(h.T.heist().aborted, 'the robbery is off');
});

test('the break note goes on the drawn curtain from the customers\' side, and the line waits', async (h) => {
  const S = h.S, sh = h.R.shop(), P = h.R.player; busyShop(h);
  const note = () => h.T.press({ kind: 'curtain', key: 'service', label: 'window curtain' }, true);
  sh.curtains.service = true;   // open
  P.pos.set(0, 1.65, 5.6); note();
  h.ok(!sh.breakNote, 'not while the curtain is open');
  sh.curtains.service = false;  // drawn
  P.pos.set(0, 1.65, 1.6); note();
  h.ok(!sh.breakNote, 'not from behind the counter');
  P.pos.set(0, 1.65, 5.6); note();
  h.ok(sh.breakNote, 'hung from the lobby side');
  h.ok(h.T.breakWait(), 'the line is waiting');
  const m = inside(h)[0], w0 = m.waited, who = S.customer.who;
  h.step(80);
  h.eq(m.waited, w0, 'nobody in line lost patience');
  h.eq(S.customer && S.customer.who, who, 'the one at the window is still there');
  sh.breakNote = h.now() - 301000;
  h.ok(!h.T.breakWait(), 'after five minutes the note stops working');
  h.step(2);
  h.ok(m.waited > w0, 'and the line counts again');
  h.T.press({ kind: 'curtain', key: 'service', label: 'window curtain' });   // E opens the curtain
  h.ok(!sh.breakNote, 'opening the curtain takes the note down');
});
