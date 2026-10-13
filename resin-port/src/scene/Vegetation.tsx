import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Instanced } from './Instanced'
import { cylinderGeo, leafGeo, sphereGeo, random, terrainHeight, type Instance } from './procedural'
import type { Materials } from './materials'
import type { QualityLevel, SceneSettings } from '../config'
import { QUALITY } from '../config'
import type { WaterSimulation } from '../hooks/useWaterSimulation'

export function Vegetation({ materials, level, settings, simulation, paused }: { materials: Materials; level: QualityLevel; settings: SceneSettings; simulation: WaterSimulation; paused: boolean }) {
  const group = useRef<THREE.Group>(null!)
  const data = useMemo(() => {
    const rng = random(318), leaves: Instance[] = [], trunks: Instance[] = [], flowers: Instance[] = []
    const trees = [[-3, -2.2, .53], [-1.7, -3.15, .52], [1.2, -3.08, .49], [2.65, -2.5, .44], [3.04, -1.62, .37]]
    trees.forEach(([x, z, r]) => {
      const h = terrainHeight(x, z)
      trunks.push({ position: [x, h + .36, z], scale: [.045, .73, .045], color: '#817857' })
      for (let i = 0; i < Math.floor(610 * QUALITY[level].vegetation * settings.vegetation); i++) {
        const a = rng() * Math.PI * 2, d = Math.sqrt(rng()) * r, y = .8 + (rng() - .5) * r * 1.1, s = .017 + rng() * .025
        leaves.push({ position: [x + Math.cos(a) * d, h + y, z + Math.sin(a) * d], scale: [s * 1.5, s * .75, s], rotation: [rng() * 3, rng() * 5, rng() * 2], color: ['#57663f', '#798346', '#929553', '#435533', '#68783b'][Math.floor(rng() * 5)] })
      }
      trunks.push({ position: [x + .12, h + .57, z], scale: [.026, .34, .026], rotation: [0, 0, -.5], color: '#746b4a' })
      trunks.push({ position: [x - .1, h + .58, z + .09], scale: [.017, .35, .017], rotation: [.3, 0, .55], color: '#746b4a' }, { position: [x + .05, h + .69, z - .13], scale: [.012, .31, .012], rotation: [-.65, 0, -.15], color: '#817657' })
    })
    const shrubs = [[-2.5, -1.1], [-1.14, -1.1], [.78, -.83], [1.84, -.82], [2.85, -.78], [.66, -2.27], [-.76, -2.24], [-2.58, -2.47], [-3.08, -.81], [3.08, -1.05], [-.8, -1.67], [.7, -1.92], [2.1, -2.36], [-2.04, -2.66]]
    shrubs.forEach(([x, z], index) => {
      const h = terrainHeight(x, z), r = index < 8 ? .1 : .22
      for (let i = 0; i < Math.floor(32 * QUALITY[level].vegetation * settings.vegetation); i++) {
        const s = .033 + rng() * .04, a = rng() * Math.PI * 2, d = rng() * r
        leaves.push({ position: [x + Math.cos(a) * d, h + .18 + rng() * .18, z + Math.sin(a) * d], scale: [s, s * .7, s], rotation: [rng() * 3, rng() * 6, rng() * 2], color: ['#5f7248', '#899456', '#4c6540', '#9b9d58'][i % 4] })
        if ((index === 0 || index === 3 || index === 6) && i % 3 === 0) flowers.push({ position: [x + Math.cos(a) * d, h + .29 + rng() * .13, z + Math.sin(a) * d], scale: [.021, .017, .021], color: i % 2 ? '#b65976' : '#c78091' })
      }
    })
    return { leaves, trunks, flowers }
  }, [level, settings.vegetation])
  useFrame(() => {
    if (paused) return
    const t = simulation.time.current.time
    group.current.rotation.z = Math.sin(t * .62) * .0008
  })
  return <group ref={group}>
    <Instanced geometry={cylinderGeo} material={materials.darkWood} items={data.trunks} />
    <Instanced geometry={leafGeo} material={materials.leaf} items={data.leaves} />
    <Instanced geometry={sphereGeo} material={materials.leaf} items={data.flowers} castShadow={false} />
  </group>
}
