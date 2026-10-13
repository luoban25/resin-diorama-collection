import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

export type V3 = [number, number, number]
export type Instance = { position: V3; scale?: V3; rotation?: V3; color?: string }
export function random(seed: number) {
  return () => { seed |= 0; seed = seed + 0x6d2b79f5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 }
}
export function noise(x: number, y: number, z = 0) {
  return Math.sin(x * 2.91 + z * 1.1) * Math.cos(y * 3.76 - z * 1.91) * .5 + Math.sin(x * 7.13 + y * 5.17 + z * 4.21) * .22 + Math.cos(x * 17.2 - y * 13.8 + z * 7.7) * .08
}
function stoneNoise(x: number, y: number, z: number) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z)
  const smooth = (v: number) => v * v * (3 - 2 * v), fx = smooth(x - ix), fy = smooth(y - iy), fz = smooth(z - iz)
  const hash = (a: number, b: number, c: number) => { const n = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453; return (n - Math.floor(n)) * 2 - 1 }
  const mix = THREE.MathUtils.lerp
  return mix(mix(mix(hash(ix, iy, iz), hash(ix + 1, iy, iz), fx), mix(hash(ix, iy + 1, iz), hash(ix + 1, iy + 1, iz), fx), fy), mix(mix(hash(ix, iy, iz + 1), hash(ix + 1, iy, iz + 1), fx), mix(hash(ix, iy + 1, iz + 1), hash(ix + 1, iy + 1, iz + 1), fx), fy), fz)
}
export function roundedShape(width: number, depth: number, r: number) {
  const x = -width / 2, y = -depth / 2, s = new THREE.Shape()
  s.moveTo(x + r, y); s.lineTo(x + width - r, y); s.quadraticCurveTo(x + width, y, x + width, y + r)
  s.lineTo(x + width, y + depth - r); s.quadraticCurveTo(x + width, y + depth, x + width - r, y + depth)
  s.lineTo(x + r, y + depth); s.quadraticCurveTo(x, y + depth, x, y + depth - r)
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y)
  return s
}
export function volumeGeometry(width: number, depth: number, height: number, radius = .46) {
  const geo = new THREE.ExtrudeGeometry(roundedShape(width, depth, radius), { depth: height, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: .022, bevelThickness: .022, curveSegments: 20 })
  geo.rotateX(-Math.PI / 2); geo.translate(0, -height, 0); geo.computeVertexNormals()
  return geo
}
export const boxGeo = new RoundedBoxGeometry(1, 1, 1, 2, .045)
export const plankGeo = new RoundedBoxGeometry(1, 1, 1, 1, .025)
export const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 12)
export const sphereGeo = new THREE.SphereGeometry(1, 12, 8)
export const leafGeo = (() => {
  const geometry = new THREE.SphereGeometry(1, 8, 6), p = geometry.attributes.position
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); p.setXYZ(i, x * 1.3, y * .28 + (1 - x * x) * .12, z * .7) }
  geometry.computeVertexNormals(); return geometry
})()
export const potGeo = new THREE.LatheGeometry([
  new THREE.Vector2(0, -.5), new THREE.Vector2(.66, -.5), new THREE.Vector2(.75, -.44),
  new THREE.Vector2(.94, .39), new THREE.Vector2(1, .41), new THREE.Vector2(1, .5),
  new THREE.Vector2(.86, .5), new THREE.Vector2(.83, .35), new THREE.Vector2(.62, -.36),
  new THREE.Vector2(0, -.36),
], 24)
export const tileGeo = new THREE.CylinderGeometry(.065, .07, .205, 10, 1, true, Math.PI / 2, Math.PI)
tileGeo.rotateX(Math.PI / 2)
export const ridgeTileGeo = tileGeo.clone()
tileGeo.rotateY(Math.PI / 2)
export const rockGeo = (() => {
  const g = new THREE.SphereGeometry(1, 36, 26), p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = 1 + stoneNoise(x * 2.8, y * 2.5, z * 2.7) * .25 + stoneNoise(x * 7, y * 7, z * 7) * .055
    p.setXYZ(i, x * n, y * n, z * n)
  }
  g.computeVertexNormals(); return g
})()

export function makeTexture(kind: 'stone' | 'plaster' | 'wood' | 'sand' | 'roof' | 'rock') {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512
  const ctx = canvas.getContext('2d')!, rng = random(484 + kind.length)
  const base = { stone: '#c2b8a4', plaster: '#e9e0ca', wood: '#bda17c', sand: '#e3d2af', roof: '#cf8e61', rock: '#d1c9b8' }[kind]
  ctx.fillStyle = base; ctx.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 15000; i++) {
    const shade = rng() > .45 ? '255,255,238' : '53,38,22'
    ctx.fillStyle = `rgba(${shade},${rng() * (kind === 'sand' ? .15 : .085)})`
    const s = rng() * 3 + .4; ctx.fillRect(rng() * 512, rng() * 512, s, s)
  }
  if (kind === 'stone' || kind === 'plaster') {
    for (let row = 0; row < 8; row++) for (let c = -1; c < 7; c++) {
      const x = c * 88 + (row % 2) * 44, y = row * 64
      ctx.strokeStyle = kind === 'stone' ? 'rgba(83,72,54,.24)' : 'rgba(127,111,84,.08)'; ctx.lineWidth = 2
      ctx.strokeRect(x + 3, y + 3, 83 + rng() * 3, 59)
      ctx.fillStyle = `rgba(255,248,226,${rng() * .1})`; ctx.fillRect(x + 5, y + 5, 80, 55)
    }
  }
  if (kind === 'wood') {
    for (let i = 0; i < 170; i++) { ctx.strokeStyle = `rgba(52,35,15,${rng() * .18})`; ctx.lineWidth = rng() * 2; ctx.beginPath(); const y = rng() * 512; ctx.moveTo(0, y); ctx.bezierCurveTo(160, y + rng() * 9, 340, y - rng() * 9, 512, y); ctx.stroke() }
    for (let i = 0; i < 9; i++) {
      const x = 40 + rng() * 430, y = 25 + rng() * 455
      for (let ring = 1; ring < 5; ring++) { ctx.strokeStyle = `rgba(63,45,27,${.14 - ring * .02})`; ctx.lineWidth = .8; ctx.beginPath(); ctx.ellipse(x, y, ring * 8, ring * 2, 0, 0, Math.PI * 2); ctx.stroke() }
    }
  }
  if (kind === 'sand') for (let row = 0; row < 80; row++) {
    const y = row * 6.4
    ctx.strokeStyle = `rgba(115,98,67,${.025 + rng() * .025})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(150, y + 3, 320, y - 5, 512, y + 1); ctx.stroke()
  }
  if (kind === 'plaster' || kind === 'roof') for (let i = 0; i < 100; i++) {
    ctx.fillStyle = `rgba(${kind === 'roof' ? '104,49,28' : '139,121,90'},${.018 + rng() * .05})`
    ctx.beginPath(); ctx.ellipse(rng() * 512, rng() * 512, 3 + rng() * 28, 2 + rng() * 16, rng() * 3, 0, Math.PI * 2); ctx.fill()
  }
  if (kind === 'rock') {
    for (let i = 0; i < 90; i++) { const x = rng() * 512, y = rng() * 512, r = 8 + rng() * 40; ctx.fillStyle = `rgba(94,82,57,${rng() * .075})`; ctx.beginPath(); ctx.ellipse(x, y, r, r * .47, rng() * 3, 0, Math.PI * 2); ctx.fill() }
    for (let i = 0; i < 32; i++) { const x = rng() * 512, y = rng() * 512; ctx.strokeStyle = 'rgba(69,64,49,.12)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + rng() * 35 - 17, y + rng() * 28); ctx.lineTo(x + rng() * 45 - 22, y + rng() * 50); ctx.stroke() }
  }
  const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4
  return t
}

export const COAST_EDGE = (x: number) => -.72 + .25 * Math.sin(x * 1.6) + .12 * Math.cos(x * 3.2)
export const terrainHeight = (x: number, z: number) => .35 + Math.max(0, (-z - .85) * .26) + .06 * noise(x, z)
export function sandHeight(x: number, z: number) {
  const shelf = Math.min(3.8 - Math.abs(x), 3.8 - z)
  return -1.49 + .1 * noise(x * .9, z * .8) + .035 * noise(x * 4, z * 4) + .18 * Math.exp(-((z + 1.2) ** 2) / 2) + .3 * Math.exp(-shelf * shelf / .7)
}

// Shared placement keeps the optical depth field aligned with the visible reef.
export const underwaterRockInstances: Instance[] = (() => {
  const rng = random(315), rocks: Instance[] = []
  const positions = [[-3, 2.7], [-2.65, 2.9], [-2.3, 3.05], [-.7, 3.1], [1.9, 2.7], [2.75, 1.9], [3.12, 2.5], [2.8, .55], [-2.5, .25], [.85, 3.15]]
  positions.forEach(([x, z], j) => {
    for (let i = 0; i < 3; i++) {
      const s = i === 0 ? .26 + rng() * .29 : .09 + rng() * .12, px = x + (rng() - .5) * .4, pz = z + (rng() - .5) * .3
      rocks.push({ position: [px, sandHeight(px, pz) + s * .72, pz], scale: [s, s * (1.1 + rng() * .8), s * .8], rotation: [rng(), rng() * 6, rng() * .4], color: ['#a3ab86', '#c1b99b', '#909d81', '#b2aa8b'][j % 4] })
    }
  })
  return rocks
})()

export function makeWaterDepthTexture(resolution = 256) {
  const data = new Uint8Array(resolution * resolution * 4), transform = new THREE.Object3D()
  const reefs = underwaterRockInstances.map(rock => {
    transform.position.set(...rock.position); transform.rotation.set(...rock.rotation!); transform.scale.set(...rock.scale!); transform.updateMatrix()
    return transform.matrix.clone().invert()
  })
  const origin = new THREE.Vector3(), direction = new THREE.Vector3()
  for (let row = 0; row < resolution; row++) for (let col = 0; col < resolution; col++) {
    const x = ((col + .5) / resolution - .5) * 7.6, z = (.5 - (row + .5) / resolution) * 7.6
    let depth = -sandHeight(x, z)
    for (const inverse of reefs) {
      origin.set(x, 0, z).applyMatrix4(inverse)
      // Transform the downward ray without normalization, preserving distance in world units.
      const e = inverse.elements; direction.set(-e[4], -e[5], -e[6])
      const a = direction.lengthSq(), b = 2 * origin.dot(direction), c = origin.lengthSq() - 1, discriminant = b * b - 4 * a * c
      if (discriminant >= 0) { const hit = (-b - Math.sqrt(discriminant)) / (2 * a); if (hit > 0) depth = Math.min(depth, hit) }
    }
    const shore = z - COAST_EDGE(x)
    if (shore > 0 && shore < .26) depth = Math.min(depth, .08 + shore * 5)
    const index = (row * resolution + col) * 4
    data[index] = Math.round(THREE.MathUtils.clamp(depth / 2, 0, 1) * 255); data[index + 3] = 255
  }
  const texture = new THREE.DataTexture(data, resolution, resolution, THREE.RGBAFormat)
  texture.minFilter = texture.magFilter = THREE.LinearFilter; texture.needsUpdate = true
  return texture
}
