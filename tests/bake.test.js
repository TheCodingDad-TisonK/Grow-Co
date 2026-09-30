// The static-geometry bake: the meshes that never move draw as one mesh per material, and anything that does
// move gets its own draw back on the next pass.

function bakeUp(h) {   // let the boot de-fight pass settle, then run passes until nothing is pending
  const B = h.I.BAKE; B.every = 1; B.budgetMs = 50;
  h.frame(10);
  h.until(() => B.passes >= 3 && !B.pending.length, 20, 'the bake passes ran');
  B.every = 60; B.budgetMs = 6;
  return B;
}

test('the shop bakes into far fewer draws, and the picture is the same set of surfaces', async (h) => {
  const B = bakeUp(h);
  h.ok(B.on, 'the bake is on by default');
  h.ok(B.baked.length > 2000, 'thousands of meshes were baked (' + B.baked.length + ')');
  h.ok(B.merged > 100 && B.merged < B.baked.length / 3, 'they became far fewer merged meshes (' + B.merged + ')');
  let merged = 0, hidden = 0, tris = 0, mergedTris = 0;
  h.I.world.group.traverse((o) => {
    if (!o.isMesh) return;
    if (o.userData.bakeMesh) { merged++; mergedTris += o.geometry.attributes.position.count / 3; h.ok(o.geometry.boundingSphere && isFinite(o.geometry.boundingSphere.radius), 'a merged mesh has a finite bounding sphere'); }
    else if (o.userData.baked) { hidden++; h.eq(o.layers.mask, 1 << B.layer, 'a baked original sits on the unseen layer'); tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; }
  });
  h.eq(merged, B.merged, 'one merged mesh per bucket');
  h.eq(hidden, B.baked.length, 'every baked original is hidden');
  h.near(mergedTris, tris, tris * 0.001, 'the merged meshes carry the same triangles as the originals they stand in for');
});

test('a baked mesh that later moves or hides gets its own draw back', async (h) => {
  const B = bakeUp(h);
  const e = B.baked.find((x) => x.o.parent.userData.propId);   // one prop part
  const o = e.o, bucket = B.buckets[e.key], before = bucket.mesh, n = bucket.members.length;
  o.position.y += 0.5;
  h.frame(61);   // the next pass
  h.ok(o.userData.noBake && !o.userData.baked, 'it is no longer baked');
  h.eq(o.layers.mask, e.mask, 'it is back on its own layer');
  h.ok(o.matrixAutoUpdate, 'its matrix updates again');
  h.ok(bucket.mesh !== before, 'its bucket was rebuilt');
  h.eq(bucket.members.length, n - 1, 'without it');
  h.ok(B.returned >= 1, 'the pass counted the return');
  const e2 = B.baked.find((x) => x.o.parent === h.I.world.group), o2 = e2.o;
  o2.visible = false;
  h.frame(61);
  h.ok(o2.userData.noBake && !o2.visible, 'a hidden original is given back and stays hidden');
});

test('?nobake=1 leaves every mesh drawing itself', async (h) => {
  h.I.BAKE.on = false;
  h.frame(130);
  h.eq(h.I.BAKE.passes, 0, 'no pass ran');
  h.eq(h.I.BAKE.baked.length, 0, 'nothing baked');
});
