import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Whole-word match for wheel parts; avoids "rim" inside "trim", etc.
const DEFAULT_INCLUDE = /(?:^|[^a-zA-Z])(wheel|tire|tyre|rim)(?:[^a-zA-Z]|$)/i;
// Non-rotating parts that share wheel-ish names (incl. brake calipers/discs).
const DEFAULT_EXCLUDE = /door|arch|well|fender|panel|liner|housing|trim|sill|skirt|rocker|call?iper|brake|disc/i;

// These GLBs use KHR_mesh_quantization (+ meshopt), so attributes are packed as
// integers and often interleaved, with the dequantizing scale living in the node
// transform. Baking a transform straight onto such a buffer would write float
// world-coords back into an int array → mangled geometry. So rebuild every
// attribute as a plain, de-interleaved, non-normalized Float32 buffer first.
// getComponent() honors the normalized flag, yielding correct real values.
function toFloatGeometry(geo) {
  const out = new THREE.BufferGeometry();
  for (const name of Object.keys(geo.attributes)) {
    const a = geo.attributes[name];
    const arr = new Float32Array(a.count * a.itemSize);
    for (let i = 0; i < a.count; i++) {
      for (let c = 0; c < a.itemSize; c++) arr[i * a.itemSize + c] = a.getComponent(i, c);
    }
    out.setAttribute(name, new THREE.BufferAttribute(arr, a.itemSize, false));
  }
  if (geo.index) out.setIndex(geo.index.clone());
  for (const g of geo.groups) out.addGroup(g.start, g.count, g.materialIndex);
  return out;
}

function isWheelMesh(obj, include, exclude) {
  const n = obj.name || '';
  if (!include.test(n)) return false;
  if (exclude.test(n)) return false;
  for (let p = obj.parent; p; p = p.parent) {
    if (/door/i.test(p.name)) return false;
  }
  return true;
}

// Attribute names a single shared material actually samples. Anything outside
// this set (stray uv2/uv3, colors on only some fragments, …) is dropped so the
// whole group shares one layout and mergeGeometries won't bail.
function attributeNames(geo) {
  return Object.keys(geo.attributes).sort();
}

// Normalize a group of geometries to a common layout so they can be merged:
// reduce every geometry to the INTERSECTION of attribute names, and make
// index-presence uniform (de-index everything if any is non-indexed).
function normalizeForMerge(geos) {
  let common = attributeNames(geos[0]);
  for (let i = 1; i < geos.length; i++) {
    const names = new Set(attributeNames(geos[i]));
    common = common.filter(n => names.has(n));
  }
  const commonSet = new Set(common);
  const anyNonIndexed = geos.some(g => g.index === null);

  return geos.map(g => {
    let out = g;
    for (const name of Object.keys(out.attributes)) {
      if (!commonSet.has(name)) out.deleteAttribute(name);
    }
    // Morph targets break a plain merge; these car models have none, but drop
    // defensively so a stray one can't poison the whole group.
    out.morphAttributes = {};
    if (anyNonIndexed && out.index !== null) out = out.toNonIndexed();
    return out;
  });
}

// Merge a group of geometries into as few as possible. Returns an array because
// the last-resort fallback may yield more than one (bucketed by layout).
function mergeCompatible(geos) {
  if (geos.length === 1) return [geos[0]];

  const normalized = normalizeForMerge(geos);
  const merged = mergeGeometries(normalized, false);
  if (merged) {
    merged.normalizeNormals();
    return [merged];
  }

  // Fallback: bucket by exact layout signature, merge each bucket on its own.
  const buckets = new Map();
  for (const g of normalized) {
    const sig = attributeNames(g).join(',') + '|' + (g.index ? 'i' : 'n');
    if (!buckets.has(sig)) buckets.set(sig, []);
    buckets.get(sig).push(g);
  }
  const out = [];
  for (const bucket of buckets.values()) {
    const m = bucket.length === 1 ? bucket[0] : mergeGeometries(bucket, false);
    if (m) { m.normalizeNormals(); out.push(m); }
  }
  return out;
}

/**
 * Collapse a shattered car GLB into a handful of merged meshes (one per
 * material) to slash per-frame draw calls, while optionally keeping the four
 * wheels as independently rotatable pivots.
 *
 * @param {THREE.Object3D} clonedScene  a scene already produced via scene.clone(true)
 * @param {object} [opts]
 * @param {boolean} [opts.keepWheels=true]            keep 4 spinnable wheel pivots
 * @param {boolean} [opts.neutralizeTransmission=false] swap costly transmission glass for plain transparent
 * @param {RegExp}  [opts.wheelInclude]
 * @param {RegExp}  [opts.wheelExclude]
 * @returns {{ group: THREE.Group, wheelPivots: THREE.Group[], wheelRadius: number }}
 */
export function optimizeCarModel(clonedScene, opts = {}) {
  const {
    keepWheels = true,
    neutralizeTransmission = false,
    wheelInclude = DEFAULT_INCLUDE,
    wheelExclude = DEFAULT_EXCLUDE,
  } = opts;

  clonedScene.updateWorldMatrix(true, true);
  const sceneInv = new THREE.Matrix4().copy(clonedScene.matrixWorld).invert();

  // Bake a mesh's geometry into the scene's local frame (so Box3 framing math
  // downstream is unchanged) and optionally offset it.
  const toModel = new THREE.Matrix4();
  const bake = (mesh, geometry, offset) => {
    toModel.multiplyMatrices(sceneInv, mesh.matrixWorld);
    const g = toFloatGeometry(geometry);   // dequantize/de-interleave → safe to transform
    g.applyMatrix4(toModel);
    if (offset) g.translate(-offset.x, -offset.y, -offset.z);
    return g;
  };

  // Optionally clone-and-neutralize a material once, caching the result so all
  // meshes sharing it get the same clone (and the cached original is untouched).
  // Clones are flagged so disposeOptimized can free only the ones we created —
  // the shared cached materials must never be disposed.
  const matCache = new Map();
  const resolveMaterial = (material) => {
    if (!neutralizeTransmission) return material;
    if (matCache.has(material)) return matCache.get(material);
    let out = material;
    if (material.transmission > 0) {
      out = material.clone();
      out.transmission = 0;
      out.transparent = true;
      out.opacity = Math.min(out.opacity ?? 1, 0.6);
      out.needsUpdate = true;
      out.userData.optimizedClone = true;
    }
    matCache.set(material, out);
    return out;
  };

  const wheelMeshes = [];
  const bodyMeshes = [];
  clonedScene.traverse(obj => {
    if (!obj.isMesh || !obj.geometry) return;
    if (keepWheels && isWheelMesh(obj, wheelInclude, wheelExclude)) wheelMeshes.push(obj);
    else bodyMeshes.push(obj);
  });

  const group = new THREE.Group();
  group.name = 'optimized-car';

  // ── body: merge single-material meshes by material ──────────────────────────
  const byMaterial = new Map();   // material -> { material, geos: [] }
  for (const mesh of bodyMeshes) {
    // Multi-material meshes (rare in these GLBs) merge incorrectly under a single
    // material, so keep them standalone with their original material array.
    if (Array.isArray(mesh.material)) {
      const m = new THREE.Mesh(bake(mesh, mesh.geometry), mesh.material.map(resolveMaterial));
      m.frustumCulled = false;
      group.add(m);
      continue;
    }
    const key = mesh.material;
    if (!byMaterial.has(key)) byMaterial.set(key, { material: mesh.material, geos: [] });
    byMaterial.get(key).geos.push(bake(mesh, mesh.geometry));
  }

  for (const { material, geos } of byMaterial.values()) {
    const mat = resolveMaterial(material);
    for (const merged of mergeCompatible(geos)) {
      const m = new THREE.Mesh(merged, mat);
      m.frustumCulled = false;
      group.add(m);
    }
  }

  // ── wheels: cluster into 4, re-center on hub, spin about local X ────────────
  const wheelPivots = [];
  let wheelRadius = 1;
  if (keepWheels && wheelMeshes.length > 0) {
    const clusters = new Map();   // "FR"|"FL"|"BR"|"BL" -> { meshes, sum, n, box }
    for (const m of wheelMeshes) {
      const box = new THREE.Box3().setFromObject(m);
      const cModel = box.getCenter(new THREE.Vector3()).applyMatrix4(sceneInv);
      const key = `${cModel.z >= 0 ? 'F' : 'B'}${cModel.x >= 0 ? 'R' : 'L'}`;
      let c = clusters.get(key);
      if (!c) { c = { meshes: [], sum: new THREE.Vector3(), n: 0, box: new THREE.Box3() }; clusters.set(key, c); }
      c.meshes.push(m);
      c.sum.add(cModel);
      c.n++;
      c.box.union(box);
    }

    for (const c of clusters.values()) {
      const center = c.sum.multiplyScalar(1 / c.n);   // model-space hub
      // Group this wheel's fragments by material, re-centered so local X is the axle.
      const wheelByMat = new Map();
      for (const m of c.meshes) {
        const mat = Array.isArray(m.material) ? m.material[0] : m.material;
        if (!wheelByMat.has(mat)) wheelByMat.set(mat, []);
        wheelByMat.get(mat).push(bake(m, m.geometry, center));
      }
      const pivot = new THREE.Group();
      pivot.position.copy(center);
      for (const [mat, geos] of wheelByMat) {
        const rmat = resolveMaterial(mat);
        for (const merged of mergeCompatible(geos)) {
          const wm = new THREE.Mesh(merged, rmat);
          wm.frustumCulled = false;
          pivot.add(wm);
        }
      }
      group.add(pivot);
      wheelPivots.push(pivot);
    }

    // Rolling radius = in-plane extent (perpendicular to the X axle) / 2.
    const firstBox = clusters.values().next().value.box;
    const size = firstBox.getSize(new THREE.Vector3());
    wheelRadius = Math.max(size.y, size.z) / 2 || 1;
  }

  // NOTE: do NOT dispose the source meshes' geometries — scene.clone(true)
  // shares geometry/material refs with the cached useGLTF asset, so disposing
  // them would corrupt the other scene that reuses the same GLB. The merged
  // geometries we created are fresh clones owned by `group` (freed on unmount).
  return { group, wheelPivots, wheelRadius };
}

// Dispose the merged geometries (and any neutralized-material clones) an
// optimized group owns. Safe to call on unmount — never touches shared cache.
export function disposeOptimized(group) {
  if (!group) return;
  group.traverse(o => {
    if (!o.isMesh) return;
    if (o.geometry) o.geometry.dispose();
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      if (m && m.userData && m.userData.optimizedClone) m.dispose();
    }
  });
}
