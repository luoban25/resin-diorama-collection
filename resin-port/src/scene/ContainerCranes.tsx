import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { boxGeo, cylinderGeo, type Instance } from './procedural'
import { Instanced } from './Instanced'
import { Railings, Container, beamBetween } from './PortPrimitives'
import type { Materials } from './materials'
import type { WaterSimulation } from '../hooks/useWaterSimulation'

export function ContainerCranes({ materials, simulation, paused }: { materials: Materials; simulation: WaterSimulation; paused: boolean }) {
  return <group><Crane x={-.48} height={2.4} materials={materials} simulation={simulation} paused={paused} /><Crane x={1.77} height={2.78} loaded materials={materials} simulation={simulation} paused={paused} /></group>
}
function Crane({ x, height: h, loaded = false, materials, simulation, paused }: { x: number; height: number; loaded?: boolean; materials: Materials; simulation: WaterSimulation; paused: boolean }) {
  const sling = useRef<THREE.Group>(null!)
  const cable = useRef<THREE.InstancedMesh>(null!)
  const { red, white, wheels, wheelHubs, stays, details, spreads } = useMemo(() => {
    const red: Instance[] = [], white: Instance[] = [], wheels: Instance[] = [], wheelHubs: Instance[] = [], stays: Instance[] = [], details: Instance[] = [], spreads: Instance[] = []
    for (const z of [-2.67, -.26]) for (const side of [-1, 1]) {
      const lx = side * .49
      white.push({ position: [lx, .5 + h / 2, z], scale: [.175, h, .19], color: '#f2efe7' })
      red.push({ position: [lx, .75, z], scale: [.22, .44, .24] }, { position: [lx, .52, z], scale: [.26, .12, .61] })
      for (const dz of [-.2, -.07, .07, .2]) {
        wheels.push({ position: [lx, .498, z + dz], scale: [.07, .105, .07], rotation: [0, 0, Math.PI / 2], color: '#3c4245' })
        wheelHubs.push({ position: [lx + side * .057, .498, z + dz], scale: [.037, .012, .037], rotation: [0, 0, Math.PI / 2], color: '#d24b3b' })
      }
      white.push(beamBetween([lx, .99, z], [lx, 2.24, z === -.26 ? -2.67 : -.26], .092, '#e4e6e0'))
      red.push({ position: [lx, h + .53, -1.47], scale: [.23, .27, 3.12] })
      details.push(beamBetween([lx, h + .5, -2.91], [lx, h + 1.66, -1.16], .062, '#e24937'), beamBetween([lx, h + .52, 2.05], [lx, h + 1.66, -1.16], .027, '#464f54'))
      stays.push(beamBetween([lx, h + .46, 1.98], [lx, h + 1.59, -1.18], .008, '#4a5152'))
    }
    white.push({ position: [0, h + .16, -.26], scale: [1.1, .14, .18] }, { position: [0, h + .16, -2.67], scale: [1.1, .14, .18] })
    red.push({ position: [0, h + .52, -.44], scale: [1.12, .24, 5.22] }, { position: [0, h + 1.05, -1.16], scale: [.16, 1.19, .17] }, { position: [0, h + 1.63, -1.16], scale: [.45, .19, .44] })
    for (const z of [-2.98, 2.12]) red.push({ position: [0, h + .47, z], scale: [1.14, .33, .14] })
    for (let z = -2.95; z < 2.15; z += .31) for (const side of [-1, 1]) details.push({ position: [side * .562, h + .48, z], scale: [.008, .12, .052], color: '#942d27' })
    for (let z = -2.85; z < 2.05; z += .38) details.push({ position: [0, h + .667, z], scale: [1.02, .018, .027], color: '#efbd40' })
    // Fixed access ladder with visible rungs.
    for (const side of [-1, 1]) details.push({ position: [.615, 1.77, -2.67 + side * .056], scale: [.018, 2.4, .018], color: '#ae3830' })
    for (let y = .67; y < 2.95; y += .125) details.push({ position: [.623, y, -2.67], scale: [.022, .014, .14], color: '#b23b30' })
    spreads.push({ position: [0, 0, 0], scale: [.84, .075, .58], color: '#f9c037' })
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) spreads.push(beamBetween([sx * .32, .005, sz * .21], [sx * .24, .2, 0], .024, '#ffc337'))
    return { red, white, wheels, wheelHubs, stays, details, spreads }
  }, [h])
  const scratch = useMemo(() => ({ object: new THREE.Object3D(), direction: new THREE.Vector3() }), [])
  useFrame(() => {
    if (!sling.current || !cable.current) return
    const t = simulation.time.current.time
    const z = loaded ? 1.12 + Math.sin(t * .17) * .16 : -.88 + Math.sin(t * .15) * .24
    const bottom = loaded ? 2.03 + Math.sin(t * .23) * .035 : 2.04 + Math.sin(t * .2) * .13
    if (!paused) { sling.current.position.set(0, bottom, z); sling.current.rotation.z = Math.sin(t * .5) * .009; sling.current.rotation.x = Math.sin(t * .44) * .006 }
    const actual = sling.current.position
    for (let i = 0; i < 2; i++) {
      const cx = i ? .27 : -.27, cy = (h + .41 + actual.y + .18) / 2
      scratch.object.position.set(cx, cy, actual.z); scratch.object.rotation.set(0, 0, 0); scratch.object.scale.set(.008, h + .41 - actual.y - .18, .008); scratch.object.updateMatrix(); cable.current.setMatrixAt(i, scratch.object.matrix)
    }
    cable.current.instanceMatrix.needsUpdate = true
  })
  return <group position={[x, 0, 0]}>
    <Instanced geometry={boxGeo} material={materials.redSteel} items={red} />
    <Instanced geometry={boxGeo} material={materials.white} items={white} />
    <Instanced geometry={cylinderGeo} material={materials.rubber} items={wheels} />
    <Instanced geometry={cylinderGeo} material={materials.redSteel} items={wheelHubs} />
    <Instanced geometry={cylinderGeo} material={materials.metal} items={stays} />
    <Instanced geometry={boxGeo} material={materials.paintedSteel} items={details} />
    <Railings points={[[-.52, h + .66, -2.96], [-.52, h + .66, 2.04], [.52, h + .66, 2.04], [.52, h + .66, -2.96]]} height={.19} materials={materials} />
    <Railings points={[[-.21, h + 1.73, -1.36], [-.21, h + 1.73, -.96], [.21, h + 1.73, -.96], [.21, h + 1.73, -1.36], [-.21, h + 1.73, -1.36]]} height={.14} color="#e8614b" materials={materials} />
    <mesh geometry={boxGeo} position={[-.2, h + .91, -2.29]} scale={[.63, .49, .66]} material={materials.white} castShadow receiveShadow />
    <mesh geometry={boxGeo} position={[-.527, h + .93, -2.29]} scale={[.009, .26, .49]} material={materials.glass} />
    <mesh geometry={boxGeo} position={[-.2, h + .93, -1.952]} scale={[.43, .26, .009]} material={materials.glass} />
    <mesh geometry={boxGeo} position={[-.2, h + 1.171, -2.29]} scale={[.71, .042, .73]} material={materials.white} />
    <mesh geometry={cylinderGeo} position={[0, h + 1.84, -1.16]} scale={[.032, .13, .032]} material={materials.beacon} />
    <instancedMesh ref={cable} args={[cylinderGeo, materials.metal, 2]} frustumCulled={false} />
    <group ref={sling} position={[0, 2.03, loaded ? 1.12 : -.88]}>
      <Instanced geometry={boxGeo} material={materials.yellow} items={spreads} />
      {[-.27, .27].map(cx => <mesh key={cx} position={[cx, .19, 0]} material={materials.metal}><torusGeometry args={[.036, .009, 8, 14]} /></mesh>)}
      {loaded && <Container position={[0, -.61, 0]} size={[.81, .6, .55]} color="#2988b3" rotation={Math.PI / 2} materials={materials} />}
    </group>
  </group>
}
