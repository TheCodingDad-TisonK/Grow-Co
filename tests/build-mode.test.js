// Build mode (F2): furniture, signs, the counter pieces and the build catalogue, as one mode with one set of keys.

const C = (h) => h.R.creative;
function mine(h, id, x, z) {   // one of your own builds, standing on the floor
  const o = { id, kind: 'prim', type: 'box', p: { w: 0.6, h: 0.6, d: 0.6 }, color: 0xc94a3a, finish: 'matte', x, y: 0, z, rot: 0, scale: 1, floor: 0 };
  h.S.custom = h.S.custom || []; h.S.custom.push(o); C(h).place(o); return o;
}
function lookAt(h, x, y, z) { const P = h.R.player, dx = x - P.pos.x, dy = y - P.pos.y, dz = z - P.pos.z; P.yaw = Math.atan2(-dx, -dz); P.pitch = Math.atan2(dy, Math.hypot(dx, dz)); }
function aimFrames(h, n) { for (let i = 0; i < n; i++) { h.I.scene.updateMatrixWorld(true); h.frame(1); } }   // the tests stub the render, which is what keeps world matrices fresh for the aim ray

test('F2 switches the catalogue on with build mode, and F3 is the same key', async (h) => {
  h.key('F2'); h.ok(h.I.edit.on && C(h).state.on, 'both on');
  h.key('F3'); h.ok(!h.I.edit.on && !C(h).state.on, 'both off');
  h.key('F3'); h.ok(h.I.edit.on && C(h).state.on, 'F3 opens build mode too');
  h.key('F2'); h.ok(!h.I.edit.on && !C(h).state.on, 'and F2 closes it');
});

test('your own build takes E and R under the crosshair, and furniture stays with build mode', async (h) => {
  const P = h.R.player; P.floor = 0; P.pos.set(0, 1.65, 1.6);
  const o = mine(h, 'mine1', 0, 2.5);
  h.key('F2'); lookAt(h, 0, 0.3, 2.5); aimFrames(h, 3);
  h.eq(C(h).state.hover, 'mine1', 'the catalogue has your build under the crosshair');
  h.eq(h.I.edit.hover, null, 'and the furniture side stood down');
  h.key('KeyR'); h.near(o.rot, Math.PI / 8, 1e-6, 'R turned your build');
  h.key('KeyE'); h.ok(C(h).state.placing, 'E picked it up');
  h.key('F2');   // leave build mode with it still in your hands
  h.ok(C(h).inst.mine1, 'it went back where it was');
  h.ok(h.S.custom.some((x) => x.id === 'mine1'), 'and it is still in the save');
  h.key('F2'); P.pitch = 1.3; h.frame(2);   // look at the ceiling: nothing of yours there
  h.I.edit.hover = 'lobbyPlant'; h.key('KeyE');
  h.eq(h.I.edit.grabbed, 'lobbyPlant', 'E on furniture grabs the furniture');
  h.key('KeyE'); h.ok(h.S.layout && h.S.layout.lobbyPlant, 'and puts it down again');
  h.key('F2');
});

test('with your build in front of furniture, only your build is picked out', async (h) => {
  const sh = h.R.props.goodsShelf.g, at = (lz, y) => { const v = sh.localToWorld(new THREE.Vector3(0, 0, lz)); v.y = y; return v; };
  const b = at(1.0, 0), eye = at(2.8, 1.65), P = h.R.player; P.floor = 0; P.pos.set(eye.x, 1.65, eye.z);
  const o = { id: 'front1', kind: 'prim', type: 'box', p: { w: 0.5, h: 1.6, d: 0.3 }, color: 0x2f6b9a, finish: 'matte', x: b.x, y: 0, z: b.z, rot: sh.rotation.y, scale: 1, floor: 0 };
  h.S.custom = h.S.custom || []; h.S.custom.push(o); C(h).place(o);
  h.key('F2'); lookAt(h, b.x, 1.0, b.z); aimFrames(h, 3);
  h.eq(C(h).state.hover, 'front1', 'your build has the crosshair');
  h.ok(!(h.I.edit.helper && h.I.edit.helper.visible), 'the shelf behind it is not outlined as well');
  h.eq(h.I.edit.hover, null, 'and E, R and Del cannot reach the shelf through it');
  h.key('F2');
});

test('Del removes a built-in piece for good: nothing left to see, take or walk into', async (h) => {
  const S = h.S; S.lots.joints.sunflower = { n: 6, qSum: 420, thcSum: 6 };
  h.R.after(); h.frame(1);
  const lots = () => h.I.world.interact.filter((m) => m.userData.interact && m.userData.interact.kind === 'lot');
  h.ok(lots().length > 0, 'the shelf has piles to take');
  h.key('F2'); h.R.player.pitch = 1.3; h.frame(2);
  h.I.edit.hover = 'goodsShelf'; h.key('Delete');
  h.ok(S.layout.goodsShelf && S.layout.goodsShelf.hidden, 'removed in the save');
  h.key('F2');
  h.R.after(); h.T.syncGoods(); h.frame(2);   // the shelf refills itself after a restock or a layout change: into a removed shelf, too
  h.ok(lots().length > 0, 'the refill did put piles in its group');
  const g = h.R.props.goodsShelf.g;
  h.ok(!g.visible, 'the shelf is not drawn');
  h.ok(lots().every((m) => h.T.inGoneProp(m)), 'no pile on it can be taken');
  h.ok(h.I.world.obstacles.every((o) => o.prop !== 'goodsShelf'), 'nothing to walk into');
  h.R.buildProp('goodsShelf');   // as on the next load
  h.ok(!h.R.props.goodsShelf.g.visible && h.I.world.obstacles.every((o) => o.prop !== 'goodsShelf'), 'still gone when the shop is built again');
  delete S.layout.goodsShelf.hidden; h.R.buildProp('goodsShelf');
  h.ok(h.R.props.goodsShelf.g.visible && lots().some((m) => !h.T.inGoneProp(m)), 'restored from the catalogue, it is all back');
});

test('your own build, deleted, is gone from the world and the save', async (h) => {
  const P = h.R.player; P.floor = 0; P.pos.set(0, 1.65, 1.6);
  const atm = { id: 'mine2', kind: 'item', type: 'atm', x: 0, y: 0, z: 2.5, rot: 0, scale: 1, floor: 0 }; h.S.custom = h.S.custom || []; h.S.custom.push(atm); C(h).place(atm);   // a catalogue ATM: solid, and it takes E
  h.ok(h.I.world.obstacles.some((o) => o.prop === 'c:mine2'), 'it stands in the way while it is there');
  h.ok(h.I.world.interact.some((m) => m.userData.customId === 'mine2'), 'and takes E');
  h.key('F2'); lookAt(h, 0, 0.9, 2.5); aimFrames(h, 3);
  h.eq(C(h).state.hover, 'mine2', 'aimed at it');
  h.key('Delete'); h.key('F2');
  h.ok(!C(h).inst.mine2, 'gone from the world');
  h.ok(!h.S.custom.some((x) => x.id === 'mine2'), 'gone from the save');
  h.eq(h.I.world.obstacles.filter((o) => o.prop === 'c:mine2').length, 0, 'nothing left to walk into');
  h.ok(!h.I.world.interact.some((m) => m.userData.customId === 'mine2'), 'nothing left that takes E');
});

test('the till, the tip jar, the bell and the cards move along the counter', async (h) => {
  const F = h.T.fixtures();
  ['counterTill', 'tipJar', 'deskBell', 'bizCards'].forEach((id) => h.ok(F[id] && F[id].table, id + ' stands on a flat top in build mode'));
  const till = F.counterTill.root; h.near(till.position.y, 1.06, 0.001, 'its base is the counter top');
  h.S.fixtures.counterTill = { x: 1.0, y: 1.06, z: 3.55, ry: Math.PI / 2 }; h.T.applyFixtures();
  h.near(till.position.x, 1.0, 0.001, 'moved along the counter');
  h.I.world.reg.drawerT = 1; h.frame(4);
  const p = new THREE.Vector3(); h.I.world.reg.drawer.getWorldPosition(p);
  h.ok(p.distanceTo(till.position) < 0.5, 'the cash drawer opens out of the till where it stands (' + p.distanceTo(till.position).toFixed(2) + ' m away)');
  h.S.tips = 12; h.T.press({ kind: 'tips' }); h.eq(h.S.tips, 0, 'the tip jar still empties with E');
});

test('a build you delete while carrying it stays deleted after the next load', async (h) => {
  const P = h.R.player; P.floor = 0; P.pos.set(0, 1.65, 1.6);
  mine(h, 'mine3', 0, 2.5);
  h.key('F2'); lookAt(h, 0, 0.3, 2.5); aimFrames(h, 3);
  h.key('KeyE'); h.ok(C(h).state.placing, 'picked up');
  h.key('Delete'); h.key('F2');
  h.ok(!C(h).inst.mine3, 'gone from the world');
  h.ok(!h.S.custom.some((x) => x.id === 'mine3'), 'gone from the save, so the next load does not bring it back');
});
