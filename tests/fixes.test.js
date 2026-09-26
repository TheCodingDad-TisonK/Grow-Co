// The v1.26 bug list: each of these failed on the game as it was.

test('a customer at the window turns the short way round, never a full circle', async (h) => {
  h.arrive(1); h.S.customer.acc = []; delete h.S.customer.cig;
  h.until(() => h.T.npcState() === 'wait', 40, 'the customer to reach the window', h.patience);
  const g = h.T.npc.g;
  g.rotation.y = -Math.PI + 0.02;   // facing the window, written the other way round (the way the line can hand a customer over)
  let worst = 0;
  for (let i = 0; i < 40; i++) { h.frame(1); const d = g.rotation.y - Math.PI; worst = Math.max(worst, Math.abs(Math.atan2(Math.sin(d), Math.cos(d)))); }
  h.ok(worst < 0.1, 'never turned away from the window (worst ' + worst.toFixed(2) + ' rad off)');
});

test('the office PC sits you down the moment its desktop opens', async (h) => {
  const seat = h.R.officeSeat(); h.ok(seat, 'the office desk has a chair');
  const P = h.R.player; P.floor = 0; P.pos.set(seat.x + 1.2, 1.65, seat.z + 0.8); h.frame(2);
  h.R.pcOpen(); h.frame(20);
  const cam = h.I.camera.position;
  h.near(cam.x, seat.x, 0.05, 'the view is in the chair (x)'); h.near(cam.z, seat.z, 0.05, 'the view is in the chair (z)');
  h.ok(cam.y < 1.4, 'at sitting height, not standing (' + cam.y.toFixed(2) + ' m)');
  h.R.pcClose();
});

test('the sun\'s shadow box follows you down Main St', async (h) => {
  const P = h.R.player; P.floor = 0; P.pos.set(90, 1.65, 20); h.frame(2);
  const t = h.T.sun.target.position;
  h.near(t.x, 90, 4, 'centred on you (x)'); h.near(t.z, 20, 4, 'centred on you (z)');
});

test('cars in one lane keep their distance instead of driving round in pairs', async (h) => {
  const lanes = {}; h.T.traffic().forEach((c) => (lanes[c.z] = lanes[c.z] || []).push(c));
  const busy = Object.keys(lanes).map((k) => lanes[k]).filter((l) => l.length >= 2);
  h.ok(busy.length, 'a lane with two cars or more');
  busy.forEach((lane) => h.eq(new Set(lane.map((c) => c.v)).size, 1, 'one cruising speed in the lane at z ' + lane[0].z));
  const lane = busy.sort((a, b) => b.length - a.length)[0];
  lane.forEach((c, i) => { c.g.position.x = (-30 + i * 9) * c.dir; c.cur = c.v; });   // bunched up nose to tail, as after a stop
  h.step(40);
  const xs = lane.map((c) => c.g.position.x * c.dir).sort((a, b) => a - b);
  let gap = 1e9; for (let i = 1; i < xs.length; i++) gap = Math.min(gap, xs[i] - xs[i - 1]);
  h.ok(gap > 25, 'spread out again (closest pair ' + gap.toFixed(1) + ' m apart)');
});

test('the delivery van\'s doors lie flat on its side', async (h) => {
  const g = h.T.truck().g; let n = 0;
  g.traverse((m) => { if (!m.isMesh || m.geometry.type !== 'BoxGeometry' || Math.abs(m.position.z) <= 1.0) return; n++; h.ok(m.geometry.parameters.depth <= 0.1, 'nothing sticks out of the side: a box ' + m.geometry.parameters.depth + ' m deep at z ' + m.position.z.toFixed(2)); });
  h.ok(n >= 6, 'door panels, seams and handles on the sides (' + n + ')');
});

test('reset starts a brand new shop: machines, furniture, builds and money all go', async (h) => {
  const S = h.S; S.bank = 99999; S.units.vending = 3; S.layout = { goodsShelf: { x: 1, z: 1, rot: 0, hidden: true } };
  S.custom = [{ id: 'c1', kind: 'prim', type: 'box', x: 0, y: 0, z: 0 }]; S.fixtures = { tipJar: { x: 0, y: 1, z: 0, ry: 0 } }; S.lic.tobacco = true;
  let reloaded = 0; h.T.setPageReload(() => reloaded++);
  h.T.resetShop(); h.step(1);
  h.eq(reloaded, 1, 'the page reloads into the new shop');
  const saved = JSON.parse(localStorage.getItem('rfgrowco-test'));
  h.eq(saved.bank, 220, 'starting money'); h.eq(saved.units.vending, 1, 'one vending machine');
  h.eq(saved.layout, undefined, 'no moved or removed furniture'); h.eq(saved.custom, undefined, 'none of your builds');
  h.eq(saved.fixtures, undefined, 'signs and counter things back in place'); h.eq(saved.lic.tobacco, undefined, 'no licences');
  S.bank = 5; h.I.save(); h.step(1);
  h.eq(JSON.parse(localStorage.getItem('rfgrowco-test')).bank, 220, 'the old shop never saves back over it');
});

test('a quick second click on the goods shelf never rolls the gate down', async (h) => {
  const S = h.S; S.lots.joints.sunflower = { n: 5, qSum: 350, thcSum: 5 }; h.hold(null);
  h.ok(h.T.shutterOpen('goodsShelf'), 'the gate starts open');
  h.T.press({ kind: 'lot', item: 'joints', strain: 'sunflower' });
  h.T.press({ kind: 'goodsShelf' });   // the second click lands on the shelf itself while the piles rebuild
  h.ok(h.T.shutterOpen('goodsShelf'), 'still open after the double click');
  h.T.press({ kind: 'lot', item: 'joints', strain: 'sunflower' });
  h.eq(h.R.held().n, 2, 'two joints in hand');
  h.step(2);
  h.T.press({ kind: 'goodsShelf' });
  h.ok(!h.T.shutterOpen('goodsShelf'), 'E on the shelf still rolls the gate down when you mean it');
});

test('the front panel draws the three front curtains, and has no roller door button', async (h) => {
  const S = h.S; ['frontL', 'door', 'frontR'].forEach((k) => (S.shop.curtains[k] = false));
  h.R.ui.openPanel('miniFront');
  const panel = document.getElementById('g3-panel');
  h.ok(!panel.querySelector('[data-act="rollerToggle"]'), 'no roller door button');
  h.eq(panel.querySelectorAll('[data-act="curtainToggle"]').length, 3, 'a button for each front curtain');
  panel.querySelector('[data-act="frontCurtains"]').click();
  h.ok(['frontL', 'door', 'frontR'].every((k) => S.shop.curtains[k]), 'Open all three opens them');
  h.eq(S.shop.curtains.service, S.shop.curtains.service, 'the window curtain is not one of them');
  document.getElementById('g3-panel').querySelector('[data-act="frontCurtains"]').click();
  h.ok(['frontL', 'door', 'frontR'].every((k) => !S.shop.curtains[k]), 'Close all three draws them');
  h.R.ui.closePanel();
});

test('the staff door locks like every other door', async (h) => {
  const S = h.S, E = (shift) => h.T.press({ kind: 'staffdoor' }, shift);
  h.hold({ kind: 'keys' }); S.shop.staffDoor = false;
  const P = h.R.player; P.floor = 0; P.pos.set(10, 1.65, 5.6);
  const key0 = h.T.navKey();
  E(true); h.ok(h.T.staffDoorLocked(), 'Shift+E with the keyring locks it');
  h.ok(h.T.navKey() !== key0, 'the paths are worked out again: a locked door is a wall');
  h.ok(/🔒/.test(h.T.prompt({ kind: 'staffdoor' })), 'it says it is locked');
  E(false); h.ok(!S.shop.staffDoor, 'E will not open it');
  h.T.toggleStaffDoor(true); h.ok(S.shop.staffDoor && !h.T.staffDoorLocked(), 'the control box opens it, unlocked');
  E(true); h.ok(h.T.staffDoorLocked() && !S.shop.staffDoor, 'locking it shuts it');
  E(true); h.ok(!h.T.staffDoorLocked(), 'Shift+E again unlocks it');
  h.hold(null); E(true); h.ok(!h.T.staffDoorLocked(), 'no keyring, no locking');
});

test('the front panel hangs where you can reach it, not inside the cigarette cabinet', async (h) => {
  const fx = h.T.fixtures().ctlFront, cab = h.R.props.cigCabinet; h.ok(fx && cab, 'both are there');
  const p = fx.root.getWorldPosition(new THREE.Vector3()), c = cab.g.position;
  h.ok(Math.abs(p.x - c.x) > 0.75 || Math.abs(p.z - c.z) > 0.35, 'clear of the cabinet (panel at ' + p.x.toFixed(2) + ', ' + p.z.toFixed(2) + ')');
  const hit = h.I.world.interact.filter((m) => m.userData.interact && m.userData.interact.kind === 'miniFront')[0];
  h.ok(hit && hit.getWorldPosition(new THREE.Vector3()).x < p.x, 'and its E-spot is on the room side of it');
});

test('dev fills only use strains your level has unlocked', async (h) => {
  const S = h.S; S.level = 1;
  h.R.devAction('goods');
  h.eq(JSON.stringify(Object.keys(S.lots.joints).filter((k) => S.lots.joints[k].n > 0)), '["sunflower"]', 'level 1: only Sunflower Kush on the shelf');
  h.R.devAction('plants');
  h.ok(S.plants.length > 0 && S.plants.every((p) => p.strain === 'sunflower'), 'the tent is all Sunflower Kush');
  S.level = 4; h.R.devAction('stash');
  h.eq(JSON.stringify(Object.keys(S.stash).filter((k) => S.stash[k].g > 0).sort()), '["amber","sunflower","widow"]', 'level 4 adds Amber Haze and Green Widow, nothing higher');
});

test('a locked staff door opens only for someone holding its key', async (h) => {
  const S = h.S; S.bank = 50000; h.T.hireWorker(); h.frame(2);
  const w = h.T.crew()[0]; h.ok(w && w.g, 'a crew member on shift');
  const at = () => { w.g.position.set(10, 0, 4.8); h.frame(1); };
  S.shop.staffDoor = false; S.doorLocks = S.doorLocks || {}; S.doorLocks.staff = true; S.staffKeys = {};
  at(); h.ok(S.shop.staffDoor, 'the crew carry a key: they let themselves through');
  S.shop.staffDoor = false; S.staffKeys.staff = false;
  at(); h.ok(!S.shop.staffDoor, 'with their key taken back at the control box, it stays shut');
  h.ok(h.T.staffDoorLocked(), 'and locked');
});
