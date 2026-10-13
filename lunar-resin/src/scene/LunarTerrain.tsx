import { useMemo } from 'react'
import { Instanced } from './Instanced'
import * as THREE from 'three'
import { random, type Instance } from './procedural'
import { lunarTopGeometry, lunarSidesGeometry, lunarHeight, lunarReefs, lakeDistance, lakeShore, rockGeo } from './lunarGeometry'
import type { Materials } from './materials'

export function LunarTerrain({ materials }: { materials: Materials }) {
  const top = useMemo(lunarTopGeometry, []), sides = useMemo(lunarSidesGeometry, []), grainGeometry = useMemo(() => new THREE.OctahedronGeometry(1, 1), [])
  const tracks = useMemo(() => {
    const positions: number[] = [], indices: number[] = [], count = 80
    for (const side of [-1, 1]) for (let i = 0; i <= count; i++) {
      const s = -.56 - i / count * 1.05, a = -.2 + Math.sin(i / count * 1.8) * .025
      for (const edge of [-1, 1]) {
        const localZ = side * .293 + edge * .021, x = -1.35 + Math.cos(a) * s + Math.sin(a) * localZ, z = -1.76 - Math.sin(a) * s + Math.cos(a) * localZ
        positions.push(x, lunarHeight(x, z) + .006, z)
      }
      if (i < count) { const offset = side === -1 ? 0 : (count + 1) * 2, p = offset + i * 2; indices.push(p, p + 2, p + 1, p + 1, p + 2, p + 3) }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); g.setIndex(indices); g.computeVertexNormals(); return g
  }, [])
  const scatter = useMemo(() => {
    const rng = random(287), rocks: Instance[] = [], gravel: Instance[] = []
    for (let i = 0; i < 2400; i++) {
      const x = (rng() - .5) * 7.35, z = (rng() - .5) * 7.35, h = lunarHeight(x, z), s = .003 + Math.pow(rng(), 4) * .027
      gravel.push({ position: [x, h + s * .3, z], scale: [s, s * .65, s], rotation: [rng(), rng() * 6, rng()], color: ['#b2b8be', '#aeb4ba', '#c4c7c9'][i % 3] })
      if (i % 54 === 0 && !(Math.abs(x - 1.4) < 1 && Math.abs(z + 2) < 1) && lakeDistance(x, z) > -.1) rocks.push({ position: [x, h + .065, z], scale: [.07 + rng() * .06, .09 + rng() * .09, .09], rotation: [rng() * .4, rng() * 6, rng() * .4], color: '#b9c0c5' })
    }
    for (let i = 0; i < 140; i++) { const x = (rng() - .5) * 6.7, z = lakeShore(x) - .08 - rng() * .3, h = lunarHeight(x, z), s = .012 + rng() * .036; if (Math.abs(z) < 3.6 && h > .025) gravel.push({ position: [x, h + s * .4, z], scale: [s, s * .7, s], rotation: [rng(), rng() * 6, rng()], color: '#c7c9c5' }) }
    return { rocks, gravel }
  }, [])
  return <group>
    <mesh geometry={top} material={materials.lunar} castShadow receiveShadow />
    <mesh geometry={sides} material={materials.section} castShadow receiveShadow />
    <mesh geometry={tracks} material={materials.tracks} receiveShadow />
    <Instanced geometry={rockGeo} material={materials.lunar} items={scatter.rocks} />
    <Instanced geometry={grainGeometry} material={materials.lunar} items={scatter.gravel} castShadow={false} />
    <Instanced geometry={rockGeo} material={materials.lunar} items={lunarReefs} />
  </group>
}
