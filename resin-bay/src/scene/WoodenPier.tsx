import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Instanced } from './Instanced'
import { boxGeo, cylinderGeo, plankGeo, random, type Instance, type V3 } from './procedural'
import type { Materials } from './materials'
import type { WaterSimulation } from '../hooks/useWaterSimulation'

export function Rope({ points, radius = .013, material }: { points: V3[]; radius?: number; material: THREE.Material }) {
  const geometry = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), 24, radius, 5, false), [points, radius])
  return <mesh geometry={geometry} material={material} />
}
export function RopeCoil({ position, material, scale = 1 }: { position: V3; material: THREE.Material; scale?: number }) {
  const geometry = useMemo(() => {
    const points = Array.from({ length: 145 }, (_, i) => { const t = i / 144, angle = t * Math.PI * 6.6, radius = .035 + t * .095; return new THREE.Vector3(Math.cos(angle) * radius, .009 + Math.sin(angle * 2) * .002, Math.sin(angle) * radius) })
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 144, .009, 6, false)
  }, [])
  return <mesh geometry={geometry} position={position} scale={scale} material={material} castShadow />
}
export function FishingCrate({ position, materials, cage = false }: { position: V3; materials: Materials; cage?: boolean }) {
  const bars = useMemo(() => {
    const out: Instance[] = [], s = cage ? .32 : .27, h = cage ? .24 : .25
    for (let i = 0; i < 5; i++) for (const side of [-1, 1]) {
      out.push({ position: [side * s / 2, h / 2, -s / 2 + i * s / 4], scale: [.017, h, .017] })
      out.push({ position: [-s / 2 + i * s / 4, h / 2, side * s / 2], scale: [.017, h, .017] })
      out.push({ position: [-s / 2 + i * s / 4, h, 0], scale: [.016, .017, s] })
    }
    for (const y of [0, h * .35, h * .7, h]) for (const side of [-1, 1]) {
      out.push({ position: [side * s / 2, y, 0], scale: [.018, .018, s] }, { position: [0, y, side * s / 2], scale: [s, .018, .018] })
    }
    return out
  }, [cage])
  return <group position={position}>
    {!cage && <mesh geometry={boxGeo} position={[0, .12, 0]} scale={[.24, .23, .24]} material={materials.wood} castShadow />}
    <Instanced geometry={boxGeo} material={cage ? materials.darkWood : materials.wood} items={bars} />
  </group>
}
export function WoodenPier({ materials, simulation, paused }: { materials: Materials; simulation: WaterSimulation; paused: boolean }) {
  const floats = useRef<THREE.Group>(null!)
  const { planks, piles, beams, nails } = useMemo(() => {
    const rng = random(712), planks: Instance[] = [], piles: Instance[] = [], beams: Instance[] = [], nails: Instance[] = []
    // A shore-connected landing with a perpendicular finger dock.
    for (let i = 0; i < 25; i++) {
      const z = -.8 + i * .13
      planks.push({ position: [.45, .225 + (rng() - .5) * .006, z], scale: [.75, .07, .12], rotation: [0, (rng() - .5) * .012, 0], color: ['#d5bd95', '#c9ad84', '#dfc9a3'][i % 3] })
      for (const x of [.15, .72]) nails.push({ position: [x, .266, z], scale: [.013, .004, .013], color: '#615a49' })
    }
    for (let i = 0; i < 23; i++) {
      const x = -2.1 + i * .13
      planks.push({ position: [x, .226 + (rng() - .5) * .004, .05], scale: [.12, .07, .68], color: i % 3 ? '#d6bd95' : '#baa37f' })
    }
    for (const z of [-.72, .15, 1.16, 2.22]) for (const x of [.03, .86]) piles.push({ position: [x, -.37, z], scale: [.073, 2.12, .073], color: '#b09a75' })
    for (const x of [-2.17, -1.25]) for (const z of [-.32, .44]) piles.push({ position: [x, -.37, z], scale: [.067, 2.07, .067], color: '#998b6e' })
    for (const x of [.12, .77]) beams.push({ position: [x, .08, .69], scale: [.09, .14, 3.38], color: '#998366' })
    for (const z of [-.18, .28]) beams.push({ position: [-.71, .08, z], scale: [3.15, .14, .075], color: '#948367' })
    for (const z of [-.65, .5, 1.5, 2.13]) beams.push({ position: [.445, -.03, z], scale: [.98, .12, .1], color: '#8e816b' })
    for (const z of [.15, 1.16, 2.22]) for (const side of [-1, 1]) {
      const dx = -side * .38, dy = .52
      beams.push({ position: [.445 + side * .19, -.31, z], scale: [.065, Math.hypot(dx, dy), .068], rotation: [0, 0, -Math.atan2(dx, dy)], color: '#a79472' })
    }
    for (const x of [.03, .86]) for (const [z, span] of [[.655, 1.01], [1.69, 1.06]]) beams.push({ position: [x, -.3, z], scale: [.061, Math.hypot(span, .56), .061], rotation: [Math.atan2(span, .56), 0, 0], color: '#9a876a' })
    for (const x of [-2.17, -1.25]) beams.push({ position: [x, -.3, .06], scale: [.061, Math.hypot(.76, .56), .061], rotation: [Math.atan2(.76, .56), 0, 0], color: '#9c896a' })
    return { planks, piles, beams, nails }
  }, [])
  useFrame(() => { if (!paused && floats.current) { const t = simulation.time.current.time; floats.current.position.y = Math.sin(t * 1.5) * .012; floats.current.rotation.z = Math.sin(t * .8) * .012 } })
  return <group>
    <Instanced geometry={plankGeo} material={materials.wood} items={planks} />
    <Instanced geometry={cylinderGeo} material={materials.darkWood} items={piles} />
    <Instanced geometry={boxGeo} material={materials.darkWood} items={beams} />
    <Instanced geometry={cylinderGeo} material={materials.metal} items={nails} castShadow={false} />
    {[.45, 1.57].map(z => <group key={z} position={[.025, .1, z]}><mesh rotation={[0, Math.PI / 2, 0]} material={materials.rubber} castShadow><torusGeometry args={[.105, .035, 9, 20]} /></mesh><Rope points={[[0, .48, 0], [0, .29, .03], [0, .09, 0]]} radius={.008} material={materials.rope} /></group>)}
    {[-2.1, -1.25].map(x => <mesh key={x} position={[x, .06, .43]} material={materials.rubber} castShadow><torusGeometry args={[.092, .03, 9, 20]} /></mesh>)}
    <Rope points={[[.86, .55, 1.16], [.96, .3, 1.65], [.86, .52, 2.22]]} material={materials.rope} radius={.011} />
    <Rope points={[[.03, .55, 1.16], [-.1, .31, 1.69], [.03, .53, 2.22]]} material={materials.rope} radius={.01} />
    <Rope points={[[.86, .48, .15], [.97, .26, .63], [.86, .52, 1.16]]} material={materials.rope} radius={.012} />
    <group ref={floats}>
      <Rope points={[[.86, .2, 1.64], [1.01, .02, 1.62], [1.05, -.02, 1.61]]} material={materials.rope} radius={.007} />
      <mesh position={[1.05, -.035, 1.61]} castShadow><sphereGeometry args={[.083, 16, 12]} /><meshStandardMaterial color="#d89635" roughness={.42} /></mesh>
      <mesh position={[-2.16, -.01, .77]} castShadow><sphereGeometry args={[.08, 16, 12]} /><meshStandardMaterial color="#c66145" roughness={.45} /></mesh>
    </group>
    <FishingCrate position={[.45, .268, 1.85]} materials={materials} />
    <FishingCrate position={[.47, .268, .65]} materials={materials} cage />
    <FishingCrate position={[-1.91, .268, .03]} materials={materials} cage />
    <FishingCrate position={[-.63, .268, .08]} materials={materials} />
    <RopeCoil position={[.49, .27, 1.31]} material={materials.rope} />
    <RopeCoil position={[-1.23, .27, .06]} material={materials.rope} scale={.72} />
  </group>
}
