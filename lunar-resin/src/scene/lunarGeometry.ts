import * as THREE from 'three'
import { noise, random, roundedShape, rockGeo, type Instance } from './procedural'

export const CRATERS = [
  [-2.9, -2.7, .42, .27], [-1.45, -2.8, .7, .36], [.1, -3.1, .43, .25],
  [2.97, -.3, .56, .38], [2.75, -3.15, .29, .17], [-3.26, -.25, .36, .22],
  [-3.42, 2.47, .26, .18], [1.37, -3.3, .48, .27], [-2.55, 3.43, .22, .14],
  [2.5, 1.65, .46, .27],
]
// Water and rock share one exterior footprint, so the cut faces meet directly.
export const LAKE_EXTENT = 3.8, LAKE_RADIUS = .45
const SHORE_SLOPE = .82
// A gently irregular diagonal separates the larger land mass from the lake.
export const lakeShore = (x: number) => .54 + SHORE_SLOPE * x + .58 * Math.exp(-(((x + 2.15) / .86) ** 2)) + .13 * Math.sin(x * 1.6) + .09 * Math.cos(x * 2.8)
export function lakeCutDistance(x: number, z: number) {
  const qx = Math.abs(x) - (LAKE_EXTENT - LAKE_RADIUS), qz = Math.abs(z) - (LAKE_EXTENT - LAKE_RADIUS)
  return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - LAKE_RADIUS
}
export function lakeDistance(x: number, z: number) { return Math.max(lakeCutDistance(x, z), (lakeShore(x) - z) / Math.hypot(1, SHORE_SLOPE)) }
const craterRandom = random(913)
for (let i = 0; i < 18; i++) {
  const x = (craterRandom() - .5) * 6.8, z = -3.43 + craterRandom() * 6.8
  if (Math.hypot(x - 1.35, z + 2.18) < 1.02 || Math.hypot(x + 1.35, z + 1.76) < .72 || lakeDistance(x, z) < .2) continue
  CRATERS.push([x, z, .1 + craterRandom() * .13, .04 + craterRandom() * .055])
}
export function lunarLandHeight(x: number, z: number) {
  const left = 1 - THREE.MathUtils.smoothstep(x, -.65, .2), shoreDistance = lakeShore(x) - z
  const lowShelf = left * (1 - THREE.MathUtils.smoothstep(shoreDistance, .05, .9))
  let h = .42 - lowShelf * .15 + noise(x * .43, z * .48) * .1 + noise(x * 2.7, z * 2.6) * .019 + noise(x * 10.5, z * 10.2) * .005
  for (const [cx, cz, r, depth] of CRATERS) {
    const angle = Math.atan2(z - cz, x - cx), q = Math.hypot(x - cx, z - cz) / (r * (1 + Math.sin(angle * 5 + cx) * .07 + Math.cos(angle * 9 - cz) * .035))
    if (q < 1.65) h += -depth * Math.exp(-Math.pow(q, 4) * 2.8) + (.084 + noise(x * 6, z * 6) * .018) * Math.exp(-Math.pow(q - 1.02, 2) / .045)
  }
  return h
}
export function lunarFloorHeight(x: number, z: number) { return -1.66 + THREE.MathUtils.smoothstep(z, 1.1, 3.6) * .22 + noise(x * .62, z * .65) * .14 + noise(x * 2.2, z * 2.2) * .035 }
export function lunarHeight(x: number, z: number) {
  const distance = lakeDistance(x, z), t = THREE.MathUtils.smoothstep(-distance, -.015, .56)
  let h = THREE.MathUtils.lerp(lunarLandHeight(x, z), lunarFloorHeight(x, z), t)
  // Excavate only the wet side of the diagonal. Dry foreground keeps its full rock section.
  const cutEdge = THREE.MathUtils.smoothstep(Math.max(Math.abs(x), Math.abs(z)), 3.04, 3.47)
  const wetSide = THREE.MathUtils.smoothstep(z - lakeShore(x), .08, .65)
  h = THREE.MathUtils.lerp(h, Math.min(h, lunarFloorHeight(x, z) + .1 + noise(x * 2, z * 2) * .055), cutEdge * wetSide)
  return h
}
export function lunarWaterGeometry() {
  const contour = roundedShape(LAKE_EXTENT * 2, LAKE_EXTENT * 2, LAKE_RADIUS).getSpacedPoints(640), points: THREE.Vector2[] = []
  const shore = (p: THREE.Vector2) => -p.y - lakeShore(p.x) - .19
  let exit = -1, entry: THREE.Vector2 | null = null
  for (let i = 0; i < contour.length - 1; i++) {
    const a = contour[i], b = contour[i + 1], fa = shore(a), fb = shore(b)
    if (fa >= 0) points.push(a)
    if ((fa >= 0) !== (fb >= 0)) {
      let lo = 0, hi = 1
      for (let k = 0; k < 24; k++) { const mid = (lo + hi) / 2, p = a.clone().lerp(b, mid); if ((shore(p) >= 0) === (fa >= 0)) lo = mid; else hi = mid }
      const crossing = a.clone().lerp(b, (lo + hi) / 2); points.push(crossing)
      if (fa >= 0) exit = points.length - 1; else entry = crossing
    }
  }
  const shape = new THREE.Shape()
  for (let i = 0; i < points.length; i++) {
    const p = points[i]; if (i === 0) shape.moveTo(p.x, p.y); else shape.lineTo(p.x, p.y)
    if (i === exit && entry) for (let k = 1; k < 160; k++) { const x = THREE.MathUtils.lerp(p.x, entry.x, k / 160); shape.lineTo(x, -lakeShore(x) - .19) }
  }
  shape.closePath()
  const source = new THREE.ExtrudeGeometry(shape, { depth: 1.78, bevelEnabled: true, bevelSize: .008, bevelThickness: .008, bevelSegments: 2, curveSegments: 20 })
  source.rotateX(-Math.PI / 2); source.translate(0, -1.78, 0)
  const p = source.attributes.position, n = source.attributes.normal, uv = source.attributes.uv
  const positions: number[] = [], normals: number[] = [], uvs: number[] = []
  for (let i = 0; i < p.count; i += 3) {
    const top = n.getY(i) > .995 && n.getY(i + 1) > .995 && n.getY(i + 2) > .995
    const mx = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3, mz = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3
    const shoreWall = Math.abs(n.getY(i)) < .995 && lakeCutDistance(mx, mz) < -.035
    if (top || shoreWall) continue
    for (let k = 0; k < 3; k++) { positions.push(p.getX(i + k), p.getY(i + k), p.getZ(i + k)); normals.push(n.getX(i + k), n.getY(i + k), n.getZ(i + k)); uvs.push(uv.getX(i + k), uv.getY(i + k)) }
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3)); geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geometry.computeBoundingSphere(); source.dispose(); return geometry
}
export const lunarReefs: Instance[] = (() => {
  const rng = random(627), items: Instance[] = []
  for (const [x, z, s] of [[-2.8, -.05, .25], [-2.2, .8, .21], [-1.3, 2.1, .34], [.1, 2.6, .25], [.8, 2.1, .18], [-.1, 1.35, .19]]) {
    for (let i = 0; i < 3; i++) { const px = x + (rng() - .5) * .31, pz = z + (rng() - .5) * .31, size = i ? s * .48 : s; items.push({ position: [px, lunarFloorHeight(px, pz) + size * .47, pz], scale: [size, size * (1.3 + rng() * .5), size * .75], rotation: [rng() * .4, rng() * 6, rng() * .3], color: '#b7bfc6' }) }
  }
  return items
})()
export function makeLunarDepth() {
  const resolution = 256, data = new Uint8Array(resolution * resolution * 4)
  for (let row = 0; row < resolution; row++) for (let col = 0; col < resolution; col++) {
    const x = ((col + .5) / resolution - .5) * 7.6, z = (.5 - (row + .5) / resolution) * 7.6, h = lunarHeight(x, z)
    let depth = Math.max(0, -h)
    for (const reef of lunarReefs) { const scale = reef.scale!, dx = (x - reef.position[0]) / scale[0], dz = (z - reef.position[2]) / scale[2], d = dx * dx + dz * dz; if (d < 1) depth = Math.min(depth, Math.max(.03, -(reef.position[1] + scale[1] * Math.sqrt(1 - d)))) }
    const i = (row * resolution + col) * 4
    data[i] = Math.round(THREE.MathUtils.clamp(depth / 2.4, 0, 1) * 255)
    data[i + 1] = lakeDistance(x, z) < 0 && h < .015 ? 255 : 0
    data[i + 3] = 255
  }
  const texture = new THREE.DataTexture(data, resolution, resolution, THREE.RGBAFormat); texture.minFilter = texture.magFilter = THREE.LinearFilter; texture.needsUpdate = true; return texture
}
export function lunarTopGeometry() {
  const geometry = new THREE.PlaneGeometry(LAKE_EXTENT * 2, LAKE_EXTENT * 2, 224, 224); geometry.rotateX(-Math.PI / 2)
  const p = geometry.attributes.position, indices: number[] = [], source = geometry.index!
  for (let i = 0; i < p.count; i++) p.setY(i, lunarHeight(p.getX(i), p.getZ(i)))
  for (let i = 0; i < source.count; i += 3) {
    const vertices = [source.getX(i), source.getX(i + 1), source.getX(i + 2)]
    if (vertices.every(v => lakeCutDistance(p.getX(v), p.getZ(v)) < .001)) indices.push(...vertices)
  }
  geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry
}
export const FOSSIL_SECTION = { z: .1, y: -1.08, width: 1.5, height: .58, depth: .24 }
export function fossilCavity(x: number, y: number, z: number) {
  if (x < 3.65) return 0
  const q = Math.hypot((z - FOSSIL_SECTION.z) / FOSSIL_SECTION.width, (y - FOSSIL_SECTION.y) / FOSSIL_SECTION.height)
  return (1 - THREE.MathUtils.smoothstep(q, .55, 1.15)) * FOSSIL_SECTION.depth
}
const strata = [
  { y: -2.1, color: new THREE.Color('#656c78') }, { y: -1.69, color: new THREE.Color('#818896') },
  { y: -1.27, color: new THREE.Color('#b2a99a') }, { y: -.9, color: new THREE.Color('#8c8277') },
  { y: -.56, color: new THREE.Color('#b9b3a8') }, { y: -.22, color: new THREE.Color('#9da4ad') },
  { y: .04, color: new THREE.Color('#c7c9c7') },
]
function strataColor(x: number, y: number, z: number) {
  const height = y + noise(x * .65, z * .7) * .075 + noise(x * 2.1, z * 2.3) * .012
  let c = strata[0].color.clone(), edgeDark = 0
  for (let i = 1; i < strata.length; i++) {
    const boundary = strata[i].y
    c.lerp(strata[i].color, THREE.MathUtils.smoothstep(height, boundary - .032, boundary + .035))
    edgeDark = Math.max(edgeDark, Math.exp(-(((height - boundary) / .009) ** 2)) * .11)
  }
  return c.multiplyScalar(1 - edgeDark)
}
export function lunarSidesGeometry() {
  const contour = roundedShape(LAKE_EXTENT * 2, LAKE_EXTENT * 2, LAKE_RADIUS).getSpacedPoints(320), count = contour.length - 1, rings = 88
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [], colors: number[] = [], rng = random(772)
  const pits = Array.from({ length: 150 }, () => ({ u: rng() * count, y: -1.87 + rng() * 2.15, r: .06 + rng() * .14 }))
  for (let ring = 0; ring <= rings; ring++) for (let i = 0; i < count; i++) {
    const point = contour[i], x = point.x, z = -point.y, top = lunarHeight(x, z), y = THREE.MathUtils.lerp(-2.05, top, ring / rings)
    const before = contour[(i - 1 + count) % count], after = contour[(i + 1) % count], normal = new THREE.Vector2(after.y - before.y, after.x - before.x).normalize()
    let displacement = noise(i * .043, y * 2.6) * .025, dark = 0
    for (const pit of pits) { const du = Math.min(Math.abs(i - pit.u), count - Math.abs(i - pit.u)) * .12, d = Math.hypot(du, y - pit.y) / pit.r; if (d < 1) { displacement -= Math.sqrt(1 - d * d) * pit.r * .75; dark = Math.max(dark, (1 - d) * .32) } }
    displacement *= Math.sin(ring / rings * Math.PI)
    const cavity = fossilCavity(x, y, z); displacement -= cavity
    positions.push(x + normal.x * displacement, y, z + normal.y * displacement); uvs.push(i / count * 6, (y + 2.05) * .7)
    const c = strataColor(x, y, z).multiplyScalar((1 - dark) * (1 - cavity * .55)); colors.push(c.r, c.g, c.b)
  }
  for (let ring = 0; ring < rings; ring++) for (let i = 0; i < count; i++) { const a = ring * count + i, b = ring * count + (i + 1) % count, c = a + count, d = b + count; indices.push(a, b, c, b, d, c) }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); g.setIndex(indices); g.computeVertexNormals(); return g
}
export { rockGeo }
