import { useMemo } from 'react'
import * as THREE from 'three'
import { Instanced } from './Instanced'
import { COAST_EDGE, terrainHeight, rockGeo, boxGeo, noise, random, type Instance } from './procedural'
import type { Materials } from './materials'

export function CoastalTerrain({ materials }: { materials: Materials }) {
  const core = useMemo(() => {
    const contour: [number, number][] = [[-3.45, -3.45], [3.45, -3.45]]
    for (let i = 0; i <= 64; i++) { const x = 3.45 - i * 6.9 / 64; contour.push([x, COAST_EDGE(x) - .055]) }
    const positions: number[] = [], uv: number[] = [], indices: number[] = [], count = contour.length
    for (let ring = 0; ring < 3; ring++) contour.forEach(([x, z], i) => {
      const offset = ring === 1 ? .025 * noise(x, z) : 0
      positions.push(x + offset, ring === 0 ? terrainHeight(x, z) - .025 : ring === 1 ? -.64 : -1.5, z + offset)
      uv.push(i / count * 5, ring * .6)
    })
    for (let ring = 0; ring < 2; ring++) for (let i = 0; i < count; i++) {
      const a = ring * count + i, b = ring * count + (i + 1) % count, c = a + count, d = b + count
      indices.push(a, b, c, b, d, c)
    }
    const center = positions.length / 3; positions.push(0, -1.5, -2); uv.push(.5, .5)
    for (let i = 0; i < count; i++) indices.push(center, count * 2 + i, count * 2 + (i + 1) % count)
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geometry.setIndex(indices); geometry.computeVertexNormals()
    return geometry
  }, [])
  const ground = useMemo(() => {
    const g = new THREE.PlaneGeometry(6.9, 3.05, 60, 30); g.rotateX(-Math.PI / 2)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), t = (p.getZ(i) + 1.525) / 3.05, edge = COAST_EDGE(x)
      const z = -3.45 + t * (edge + 3.45); p.setZ(i, z); p.setY(i, terrainHeight(x, z))
    }
    g.computeVertexNormals(); return g
  }, [])
  const { rocks, stones, paving } = useMemo(() => {
    const rng = random(751), rocks: Instance[] = [], stones: Instance[] = [], paving: Instance[] = []
    for (let i = 0; i < 32; i++) {
      const x = -3.2 + i * .207, z = COAST_EDGE(x)
      const s = .28 + rng() * .22
      rocks.push({ position: [x, -.12 + rng() * .17, z + .045], scale: [s, .55 + rng() * .36, s * .72], rotation: [rng() * .4, rng() * 6, rng() * .2], color: ['#c2b9a4', '#bdb8ae', '#a4a494', '#e1d3b4'][i % 4] })
      if (i % 3 === 0) rocks.push({ position: [x + .18, -.93, z + .3], scale: [.25, .55, .28], rotation: [rng() * .4, rng() * 6, rng() * .5], color: '#a3ad91' })
      if (x > -.6 && x < 2.45) for (let row = 0; row < 3; row++) stones.push({ position: [x, .02 + row * .17, z - .13], scale: [.22, .155, .23], rotation: [0, (rng() - .5) * .05, 0], color: ['#e6ddc8', '#cfc8b9', '#ddd1b7'][Math.floor(rng() * 3)] })
    }
    for (let i = 0; i < 28; i++) {
      const side = i % 2 ? 1 : -1, z = -3.2 + Math.floor(i / 2) * .18, x = side * (3.22 + rng() * .12)
      const s = .25 + rng() * .22
      rocks.push({ position: [x, terrainHeight(x, z) - .43, z], scale: [s * .8, .55 + rng() * .35, s], rotation: [rng(), rng() * 6, rng() * .3], color: '#c6bda7' })
      if (i % 2 === 0) rocks.push({ position: [x, -.9, z], scale: [s * .65, .63, s * .85], rotation: [rng() * .4, rng() * 6, rng() * .3], color: '#b2b29a' })
    }
    for (let i = 0; i < 25; i++) {
      const x = -3.2 + i * .268, z = -3.36 + (rng() - .5) * .08, s = .25 + rng() * .11
      rocks.push({ position: [x, terrainHeight(x, z) - .28, z], scale: [s, .56 + rng() * .22, s * .84], rotation: [rng() * .5, rng() * 6, rng() * .25], color: i % 2 ? '#d0c7b3' : '#bbb6a4' })
      if (i % 2 === 0) rocks.push({ position: [x, -.78, z], scale: [s, .76, s * .72], rotation: [rng() * .3, rng() * 6, 0], color: '#adb09b' })
    }
    for (let x = -2.4; x < 3.05; x += .22) for (let z = -1.28; z < -.63; z += .21) {
      if (z > COAST_EDGE(x) - .04) continue
      paving.push({ position: [x + rng() * .025, terrainHeight(x, z) + .012, z], scale: [.202 + rng() * .02, .047, .185 + rng() * .02], rotation: [0, (rng() - .5) * .08, 0], color: ['#e5d9bd', '#dbd0b8', '#c9c5ae', '#ede2c9'][Math.floor(rng() * 4)] })
    }
    return { rocks, stones, paving }
  }, [])
  return <group>
    <mesh geometry={core} material={materials.rock} castShadow receiveShadow />
    <mesh geometry={ground} material={materials.stone} receiveShadow />
    <Instanced geometry={rockGeo} material={materials.rock} items={rocks} />
    <Instanced geometry={boxGeo} material={materials.stone} items={stones} />
    <Instanced geometry={boxGeo} material={materials.stone} items={paving} />
  </group>
}
