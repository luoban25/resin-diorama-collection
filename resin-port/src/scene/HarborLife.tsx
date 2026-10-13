import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { sphereGeo, cylinderGeo, rockGeo, random, sandHeight, type Instance } from './procedural'
import { Instanced } from './Instanced'
import type { Materials } from './materials'
import type { WaterSimulation } from '../hooks/useWaterSimulation'
import { Rope } from './WoodenPier'

export function HarborLife({ materials, simulation, paused }: { materials: Materials; simulation: WaterSimulation; paused: boolean }) {
  const buoy = useRef<THREE.Group>(null!), fish = useRef<THREE.InstancedMesh>(null!)
  const geometry = useMemo(() => {
    const body = new THREE.SphereGeometry(1, 12, 8); body.scale(1.3, .38, .48)
    const tail = new THREE.ConeGeometry(.65, 1.15, 3); tail.rotateZ(-Math.PI / 2); tail.translate(-1.48, 0, 0)
    const merged = mergeGeometries([body, tail])!; body.dispose(); tail.dispose(); return merged
  }, [])
  const { grass, shells } = useMemo(() => {
    const grass: Instance[] = [], shells: Instance[] = [], rng = random(970)
    for (const [x, z] of [[-3.2, 2.66], [-2.73, 3.04], [.32, 3.43], [2.8, 2.92], [2.62, .87]]) {
      for (let i = 0; i < 13; i++) { const px = x + (rng() - .5) * .24, pz = z + (rng() - .5) * .24, h = .09 + rng() * .11; grass.push({ position: [px, sandHeight(px, pz) + h / 2, pz], scale: [.01, h, .012], rotation: [(rng() - .5) * .7, rng() * 6, (rng() - .5) * .7], color: i % 2 ? '#649e85' : '#467e6e' }) }
    }
    for (let i = 0; i < 28; i++) { const x = (rng() - .5) * 6.7, z = .35 + rng() * 3.07; shells.push({ position: [x, sandHeight(x, z) + .014, z], scale: [.02, .013, .03], color: '#e2d5b5' }) }
    return { grass, shells }
  }, [])
  const state = useMemo(() => ({ transform: new THREE.Object3D(), seeds: Array.from({ length: 10 }, (_, i) => ({ x: -2.7 + i * .6, z: 2.5 + (i % 3) * .3, phase: i * 1.31 })) }), [])
  useFrame(() => {
    const t = simulation.time.current.time
    if (!paused) { buoy.current.position.y = .015 + Math.sin(t * 1.45) * .03; buoy.current.rotation.z = Math.sin(t * 1.01) * .023 }
    state.seeds.forEach((seed, i) => {
      const x = seed.x + Math.sin(t * .14 + seed.phase) * .2, z = seed.z + Math.cos(t * .14 + seed.phase) * .11
      state.transform.position.set(x, -.8 - (i % 3) * .12, z); state.transform.rotation.set(0, -.3 + Math.cos(t * .14 + seed.phase) * .25, 0); state.transform.scale.setScalar(.064 + (i % 2) * .023); state.transform.updateMatrix(); fish.current.setMatrixAt(i, state.transform.matrix)
    }); fish.current.instanceMatrix.needsUpdate = true
  })
  return <group>
    <Instanced geometry={cylinderGeo} material={materials.leaf} items={grass} castShadow={false} />
    <Instanced geometry={sphereGeo} material={materials.sand} items={shells} castShadow={false} />
    <instancedMesh ref={fish} args={[geometry, materials.fish, 10]} frustumCulled={false} />
    <group ref={buoy} position={[2.75, .015, 3.07]}>
      <mesh material={materials.orange} position={[0, .033, 0]}><cylinderGeometry args={[.15, .21, .1, 32]} /></mesh>
      <mesh material={materials.orange} position={[0, .2, 0]}><coneGeometry args={[.125, .28, 24]} /></mesh>
      <mesh material={materials.white} position={[0, .253, 0]}><cylinderGeometry args={[.058, .082, .072, 24]} /></mesh>
      <mesh material={materials.beacon} position={[0, .37, 0]}><sphereGeometry args={[.026, 12, 8]} /></mesh>
      <mesh material={materials.white} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.181, .011, 8, 32]} /></mesh>
    </group>
    <Rope points={[[2.75, -.03, 3.07], [2.68, -.65, 3.04], [2.51, -1.35, 2.99]]} radius={.008} material={materials.rope} />
    <mesh geometry={rockGeo} position={[2.51, -1.38, 2.99]} scale={[.08, .065, .09]} material={materials.rock} />
  </group>
}
