// What you hold: V uses it anywhere; the rifle's scope and the AK's full auto.

test('V drinks, eats and lights a joint wherever you are', async (h) => {
  h.hold({ kind: 'cupWater' }); h.key('KeyV');
  h.eq(h.R.held() && h.R.held().kind, 'cupEmpty', 'the cup is empty after a drink');
  h.eq(h.S.buff && h.S.buff.label, 'refreshed', 'the drink buff');
  h.hold({ kind: 'joints', n: 3, qSum: 180, thcSum: 3.6, strain: 'sunflower' }); h.key('KeyV');
  h.eq(h.R.held().n, 2, 'one joint lit');
  h.ok(h.S.chill, 'mellow');
  h.step(5);
  h.hold({ kind: 'snack' }); h.key('KeyV');
  h.eq(h.R.held(), null, 'the snack is gone');
  h.eq(h.S.buff.label, 'well fed', 'the food buff');
});

test('an empty goes straight into a bin close by', async (h) => {
  const bin = h.I.world.interact.filter((m) => m.userData.interact && m.userData.interact.kind === 'trash')[0];
  h.ok(bin, 'there is a bin');
  const p = new THREE.Vector3(); bin.getWorldPosition(p);
  h.R.player.floor = p.y > 2 ? 1 : 0; h.R.player.pos.set(p.x + 1.2, h.R.player.pos.y, p.z + 1.2);
  h.hold({ kind: 'canEmpty' }); h.key('KeyV');
  h.eq(h.R.held(), null, 'binned');
});

test('the AK fires while the button is held and stops on release', async (h) => {
  h.R.devAction('arm');
  h.hold({ kind: 'ak' });
  const b0 = h.S.armory.bullets;
  h.mouseDown(0); h.step(1);
  const fired = b0 - h.S.armory.bullets;
  h.ok(fired >= 5 && fired <= 10, 'full auto for a second fires 5 to 10 rounds (fired ' + fired + ')');
  h.mouseUp(0); const b1 = h.S.armory.bullets; h.step(1);
  h.eq(h.S.armory.bullets, b1, 'nothing after the button comes up');
});

test('holding right-click with the rifle looks through the scope', async (h) => {
  h.R.devAction('arm');
  h.hold({ kind: 'rifle' });
  const fov0 = h.I.camera.fov;
  h.mouseDown(2); h.step(0.5);
  h.ok(h.I.camera.fov < 30, 'zoomed in (fov ' + h.I.camera.fov.toFixed(1) + ')');
  h.mouseUp(2); h.step(0.5);
  h.near(h.I.camera.fov, fov0, 0.5, 'back to normal');
});
