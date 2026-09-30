//@ static-geometry bake: the meshes that never move are merged into one mesh per material, so the renderer issues hundreds of draw calls a frame instead of thousands
  // ── Static geometry bake ──
  // Every wall, shelf and prop part is its own mesh, and three.js issues one draw call per mesh: a grown shop is
  // 3,000 to 5,000 calls a frame, and the CPU side of that is what caps the frame rate (measured 2026-09-30:
  // 32 ms of render per frame at 4,700 calls, GPU at 20 %). Once a second this pass merges the meshes that have
  // not moved into one mesh per material under each parent group. A prop keeps its group, so build mode still
  // moves it as a whole; loose shell meshes under world.group are chunked by area so frustum culling still drops
  // what is behind you. The originals stay in the graph on an unseen layer, so anything that later moves, hides,
  // re-materials or removes one is caught by the next pass: that mesh goes back to drawing itself and its bucket
  // is rebuilt without it. Nothing a later system touches can silently freeze in the merged copy.
  // ?nobake=1 turns the pass off (for measuring); ?bakelog=1 logs every mesh the pass has to give back.
  var BAKE = { on: true, every: 60, budgetMs: 6, frame: 0, buckets: {}, baked: [], pending: [], layer: 31, merged: 0, calls: 0, log: false, passes: 0, returned: 0 };
  try { var bakeQ = new URLSearchParams(location.search); if (bakeQ.get('nobake') === '1') BAKE.on = false; if (bakeQ.get('bakelog') === '1') BAKE.log = true; } catch (e) {}
  var bakeTmp = { m3: new THREE.Matrix3(), v: new THREE.Vector3() };
  function bakeCandidate(o) {   /* a mesh the pass may merge: plain, unnamed, untagged, one shared material, nothing the raycasts single out */
    if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || !o.visible || o.children.length || o.name) return false;
    var g = o.geometry, m = o.material; if (!g || !g.attributes || !g.attributes.position || !g.attributes.normal || !m || Array.isArray(m) || m.visible === false || m.vertexColors) return false;
    if (g.morphAttributes && Object.keys(g.morphAttributes).length) return false;
    if (!isFinite(o.position.x + o.position.y + o.position.z + o.rotation.x + o.rotation.y + o.rotation.z + o.scale.x + o.scale.y + o.scale.z)) return false;   /* a NaN transform would poison the whole merged buffer */
    for (var k in o.userData) if (k !== 'propId' && k !== 'fxId') return false;   /* baked, noBake, interact, soft, shutter...: anything tagged is somebody's */
    return true;
  }
  function bakeSoft(o) {   /* the thin bars and rings sightLine looks through: they merge among themselves, and the merged mesh is tagged soft so it stays see-through */
    var g = o.geometry, gp = g.parameters; return g.type === 'TorusGeometry' || (g.type === 'CylinderGeometry' && !!gp && (Math.max(gp.radiusTop, gp.radiusBottom) < 0.03 || gp.height < 0.05));
  }
  function bakeMatSig(m) {   /* two materials that look the same can share one draw; anything with a texture stays its own */
    if (m.map || m.normalMap || m.roughnessMap || m.metalnessMap || m.emissiveMap || m.alphaMap || m.envMap || m.bumpMap || m.aoMap || m.lightMap || m.displacementMap || (m.userData && m.userData.tile)) return 'u:' + m.uuid;
    return 't:' + m.type + ':' + (m.color ? m.color.getHex() : '') + ':' + (m.roughness !== undefined ? m.roughness : '') + ':' + (m.metalness !== undefined ? m.metalness : '') + ':' + (m.emissive ? m.emissive.getHex() + ':' + m.emissiveIntensity : '') + ':' + (m.transparent ? 1 : 0) + ':' + m.opacity + ':' + m.side + ':' + (m.flatShading ? 1 : 0) + ':' + (m.depthWrite ? 1 : 0) + ':' + (m.depthTest ? 1 : 0) + ':' + m.alphaTest + ':' + (m.toneMapped ? 1 : 0) + ':' + (m.wireframe ? 1 : 0) + ':' + (m.fog ? 1 : 0) + ':' + (m.polygonOffset ? m.polygonOffsetFactor + ',' + m.polygonOffsetUnits : '');
  }
  function bakeParentOk(p) {   /* the chain from the parent up to world.group: visible, nobody's dynamic group, still attached */
    for (; p; p = p.parent) { if (p === world.group) return true; if (!p.visible || p.userData.dyn || p.userData.interact || p.userData.noBake) return false; }
    return false;
  }
  function bakeKey(o) {
    var p = o.parent, m = o.material, k = p.id + '|' + bakeMatSig(m) + '|' + (o.castShadow ? 1 : 0) + (o.receiveShadow ? 1 : 0) + '|' + o.layers.mask + '|' + o.renderOrder + '|' + (o.frustumCulled ? 1 : 0) + '|' + (o.userData.fxId || '') + (bakeSoft(o) ? '|soft' : '');   /* one bucket per parent: the merged mesh lives in that parent's space */
    if (p === world.group) k += '|' + Math.floor(o.position.x / 8) + ',' + Math.floor(o.position.y / 4) + ',' + Math.floor(o.position.z / 8);   /* loose shell: chunked so culling keeps working */
    return k;
  }
  function bakeSnap(o) { return { o: o, x: o.position.x, y: o.position.y, z: o.position.z, rx: o.rotation.x, ry: o.rotation.y, rz: o.rotation.z, sx: o.scale.x, sy: o.scale.y, sz: o.scale.z, mat: o.material, sig: bakeMatSig(o.material), geo: o.geometry, parent: o.parent, mask: o.layers.mask, auto: o.matrixAutoUpdate }; }
  function bakeMoved(e) { var o = e.o; return o.parent !== e.parent || o.material !== e.mat || bakeMatSig(o.material) !== e.sig || o.geometry !== e.geo || !o.visible || o.position.x !== e.x || o.position.y !== e.y || o.position.z !== e.z || o.rotation.x !== e.rx || o.rotation.y !== e.ry || o.rotation.z !== e.rz || o.scale.x !== e.sx || o.scale.y !== e.sy || o.scale.z !== e.sz; }
  function bakeDescribe(o) { var g = o.geometry, gp = g && g.parameters, m = o.material; return (g ? g.type : '?') + (gp ? '(' + [gp.width, gp.height, gp.depth, gp.radiusTop, gp.radius].filter(function (v) { return v !== undefined; }).map(function (v) { return +v.toFixed(3); }).join('x') + ')' : '') + ' ' + (m && m.color ? '#' + m.color.getHexString() : '') + ' at ' + [o.position.x, o.position.y, o.position.z].map(function (v) { return +v.toFixed(2); }).join(',') + (o.parent && o.parent.userData.propId ? ' in prop ' + o.parent.userData.propId : o.parent === world.group ? ' loose' : ' in ' + (o.parent.name || o.parent.type)); }
  function bakeMergeGeo(members) {   /* one non-indexed geometry in the parent's space: position, normal, uv */
    var n = 0, i, o, g, geos = [];
    for (i = 0; i < members.length; i++) { o = members[i]; g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry; geos.push(g); n += g.attributes.position.count; }
    var pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), at = 0, v = bakeTmp.v, m3 = bakeTmp.m3;
    for (i = 0; i < members.length; i++) {
      o = members[i]; g = geos[i]; o.updateMatrix(); m3.getNormalMatrix(o.matrix);
      var P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv, c = P.count;
      for (var j = 0; j < c; j++) {
        v.fromBufferAttribute(P, j).applyMatrix4(o.matrix); pos[(at + j) * 3] = v.x; pos[(at + j) * 3 + 1] = v.y; pos[(at + j) * 3 + 2] = v.z;
        v.fromBufferAttribute(N, j).applyMatrix3(m3).normalize(); nor[(at + j) * 3] = v.x; nor[(at + j) * 3 + 1] = v.y; nor[(at + j) * 3 + 2] = v.z;
        if (U) { uv[(at + j) * 2] = U.getX(j); uv[(at + j) * 2 + 1] = U.getY(j); }
      }
      if (g !== o.geometry) g.dispose();   /* the non-indexed copy was only a stepping stone */
      at += c;
    }
    var out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    out.computeBoundingSphere(); out.computeBoundingBox();
    return out;
  }
  function bakeBuild(b) {   /* (re)build one bucket's merged mesh from its current members */
    if (b.mesh) { b.mesh.parent && b.mesh.parent.remove(b.mesh); b.mesh.geometry.dispose(); b.mesh = null; }
    if (b.members.length < 2) { b.members.forEach(function (o) { bakeReturn(o, 'bucket down to one'); }); b.members = []; delete BAKE.buckets[b.key]; return; }
    var first = b.members[0], mesh = new THREE.Mesh(bakeMergeGeo(b.members), first.material);
    mesh.castShadow = first.castShadow; mesh.receiveShadow = first.receiveShadow; mesh.layers.mask = b.mask; mesh.renderOrder = first.renderOrder; mesh.frustumCulled = first.frustumCulled;
    mesh.name = 'baked'; mesh.userData.bakeMesh = true; mesh.userData.noDefight = true; if (first.userData.propId) mesh.userData.propId = first.userData.propId; if (first.userData.fxId) mesh.userData.fxId = first.userData.fxId;
    if (/\|soft(\||$)/.test(b.key)) mesh.userData.soft = true;   /* merged bars and rings: sightLine still looks through them */
    b.parent.add(mesh); b.mesh = mesh;
  }
  function bakeReturn(o, why) {   /* give a mesh back its own draw: it is somebody's after all */
    var e = o.userData.baked; if (!e) return;
    o.layers.mask = e.mask; o.matrixAutoUpdate = e.auto; o.updateMatrix(); delete o.userData.baked; o.userData.noBake = true; BAKE.returned++;
    if (BAKE.log) console.log('[bake] returned (' + why + '): ' + bakeDescribe(o));
  }
  function bakeTick() {
    if (!BAKE.on || !world.group) return;
    BAKE.frame++;
    if (_df.t) return;   /* a de-fight pass is due: it nudges faces, so bake after it, not before */
    if (BAKE.pending.length) { bakeFlush(); return; }
    if (BAKE.frame % BAKE.every) return;
    BAKE.passes++;
    var dirty = {}, i, e, o, b;
    // 1. what has moved since it was baked goes back to drawing itself, and its bucket is rebuilt without it
    var keep = [];
    for (i = 0; i < BAKE.baked.length; i++) {
      e = BAKE.baked[i]; o = e.o; b = BAKE.buckets[e.key];
      if (!b) continue;   /* its bucket went with its group */
      if (!bakeAttached(b.parent)) { delete BAKE.buckets[e.key]; if (b.mesh) b.mesh.geometry.dispose(); continue; }   /* the whole group left the world (a prop rebuilt): its originals are gone with it */
      if (bakeMoved(e)) { bakeReturn(o, 'moved'); b.members.splice(b.members.indexOf(o), 1); dirty[e.key] = b; continue; }
      keep.push(e);
    }
    BAKE.baked = keep;
    // 2. new candidates join a bucket
    var fresh = {};
    world.group.traverse(function (m) {
      if (!bakeCandidate(m) || !bakeParentOk(m.parent)) return;
      var k = bakeKey(m); (fresh[k] = fresh[k] || []).push(m);
    });
    for (var k in fresh) {
      var list = fresh[k]; b = BAKE.buckets[k];
      if (!b) { if (list.length < 2) continue; b = BAKE.buckets[k] = { key: k, parent: list[0].parent, mask: list[0].layers.mask, members: [], mesh: null }; }
      for (i = 0; i < list.length; i++) { o = list[i]; o.userData.baked = bakeSnap(o); o.userData.baked.key = k; o.layers.mask = 1 << BAKE.layer; o.matrixAutoUpdate = false; b.members.push(o); BAKE.baked.push(o.userData.baked); }
      dirty[k] = b;
    }
    for (var dk in dirty) BAKE.pending.push(dirty[dk]);
    bakeFlush();
  }
  function bakeAttached(p) { for (; p; p = p.parent) if (p === scene) return true; return false; }
  function bakeFlush() {   /* rebuild the buckets that changed, a few milliseconds a frame */
    var t0 = performance.now();
    while (BAKE.pending.length && performance.now() - t0 < BAKE.budgetMs) bakeBuild(BAKE.pending.shift());
    var n = 0; for (var k in BAKE.buckets) n++; BAKE.merged = n;
  }
