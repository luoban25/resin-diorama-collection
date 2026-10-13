import { useMemo } from 'react'
import * as THREE from 'three'
import { BOAT_POSITION, type SceneSettings } from '../config'
import type { WaterSimulation } from '../hooks/useWaterSimulation'
import type { MotionState } from '../hooks/useDioramaMotion'
import { useBoatFloat } from '../hooks/useBoatFloat'
import { boxGeo, cylinderGeo, type Instance } from './procedural'
import { Instanced } from './Instanced'
import type { Materials } from './materials'
import { Container, Railings, beamBetween } from './PortPrimitives'
import { Rope } from './WoodenPier'

function shipHull() {
  const vertices: number[] = [], uv: number[] = [], colors: number[] = [], indices: number[] = [], sections = 84, cross = 28, color = new THREE.Color()
  for (let i = 0; i <= sections; i++) {
    const t = i / sections, x = (t - .5) * 6.15
    const width = .76 * (t < .19 ? .03 + .97 * Math.sin(t / .19 * Math.PI / 2) : t > .9 ? 1 - (t - .9) * 1.6 : 1)
    for (let j = 0; j <= cross; j++) {
      const a = (j / cross - .5) * Math.PI, z = Math.sin(a) * width, y = -1.13 + (1 - Math.cos(a)) * 1.68 + Math.pow(1 - t, 9) * .15
      vertices.push(x, y, z); uv.push(t, j / cross)
      color.set(y < -.72 ? '#8c3432' : '#d64036'); colors.push(color.r, color.g, color.b)
      if (i < sections && j < cross) { const n = i * (cross + 1) + j; indices.push(n, n + cross + 1, n + 1, n + 1, n + cross + 1, n + cross + 2) }
    }
  }
  for (const end of [0, sections]) {
    const center = vertices.length / 3; vertices.push((end / sections - .5) * 6.15, .5, 0); uv.push(.5, .5); color.set('#b83832'); colors.push(color.r, color.g, color.b)
    for (let j = 0; j < cross; j++) { const n = end * (cross + 1) + j; if (end === 0) indices.push(center, n + 1, n); else indices.push(center, n, n + 1) }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); g.setIndex(indices); g.computeVertexNormals(); return g
}
export function CargoShip({ materials, simulation, motion, settings, paused, reset }: { materials: Materials; simulation: WaterSimulation; motion: React.RefObject<MotionState>; settings: SceneSettings; paused: boolean; reset: number }) {
  const ship = useBoatFloat(simulation, motion, settings, paused, reset)
  const hull = useMemo(shipHull, []), material = useMemo(() => { const m = materials.hull.clone(); m.vertexColors = true; m.side = THREE.DoubleSide; return m }, [materials])
  const deck = useMemo(() => { const shape = new THREE.Shape(); shape.moveTo(-3.05, 0); shape.bezierCurveTo(-2.7, -.69, -2.24, -.72, -1.94, -.72); shape.lineTo(2.7, -.72); shape.quadraticCurveTo(3.05, -.7, 3.05, -.55); shape.lineTo(3.05, .55); shape.quadraticCurveTo(3.05, .7, 2.7, .72); shape.lineTo(-1.94, .72); shape.bezierCurveTo(-2.24, .72, -2.7, .69, -3.05, 0); const g = new THREE.ShapeGeometry(shape, 32); g.rotateX(-Math.PI / 2); return g }, [])
  const details = useMemo(() => {
    const windows: Instance[] = [], rims: Instance[] = [], portholes: Instance[] = [], equipment: Instance[] = []
    for (let x = -2.65; x < 2.8; x += .38) for (const side of [-1, 1]) portholes.push({ position: [x, .37, side * .763], scale: [.047, .015, .026], rotation: [Math.PI / 2, 0, 0], color: '#243e44' })
    for (const y of [.93, 1.24, 1.51]) for (let x = 1.92; x <= 2.47; x += .18) for (const side of [-1, 1]) windows.push({ position: [x, y, side * .535], scale: [.071, .087, .012], color: '#697b7b' })
    for (let x = 1.79; x < 2.7; x += .17) for (const side of [-1, 1]) windows.push({ position: [x, 1.88, side * .648], scale: [.134, .155, .015], color: '#425f6d' })
    for (const y of [1.09, 1.39, 1.72, 2.015]) rims.push({ position: [2.22, y, 0], scale: [.91, .04, 1.18], color: '#f4f2e7' })
    for (const z of [-.31, .31]) equipment.push({ position: [-2.57, .65, z], scale: [.12, .15, .12], color: '#586264' })
    equipment.push(beamBetween([-2.57, .65, -.31], [-2.57, .65, .31], .054, '#596364'))
    return { windows, rims, portholes, equipment }
  }, [])
  const cargo = useMemo(() => {
    const colors = ['#d84435', '#2d80b0', '#e3e7e0', '#e15942', '#236f9e', '#f1ede2']
    return Array.from({ length: 14 }, (_, i) => {
      const layer = i >= 8 ? 1 : 0, j = layer ? i - 8 : i
      return { position: [-1.63 + Math.floor(j / 2) * .96, .573 + layer * .453, (j % 2 ? 1 : -1) * .31] as [number, number, number], color: colors[i % colors.length] }
    })
  }, [])
  return <group>
    <group ref={ship} position={BOAT_POSITION}>
      <mesh geometry={hull} material={material} castShadow receiveShadow />
      <mesh geometry={deck} position={[0, .55, 0]} material={materials.deck} receiveShadow />
      <Instanced geometry={boxGeo} material={materials.glass} items={details.windows} />
      <Instanced geometry={boxGeo} material={materials.white} items={details.rims} />
      <Instanced geometry={cylinderGeo} material={materials.metal} items={details.portholes} castShadow={false} />
      <Instanced geometry={cylinderGeo} material={materials.metal} items={details.equipment} />
      {cargo.map((item, i) => <Container key={i} {...item} materials={materials} />)}
      <mesh geometry={boxGeo} position={[2.22, 1.115, 0]} scale={[.82, 1.09, 1.045]} material={materials.white} castShadow receiveShadow />
      <mesh geometry={boxGeo} position={[2.21, 1.853, 0]} scale={[1.02, .32, 1.27]} material={materials.white} castShadow />
      <mesh geometry={boxGeo} position={[1.693, 1.86, 0]} scale={[.011, .18, 1.04]} material={materials.glass} />
      <mesh geometry={boxGeo} position={[2.21, 2.031, 0]} scale={[1.13, .052, 1.35]} material={materials.white} />
      <mesh geometry={boxGeo} position={[2.68, 1.87, -.4]} scale={[.3, .53, .36]} material={materials.redSteel} castShadow />
      <mesh geometry={boxGeo} position={[2.68, 2.08, -.4]} scale={[.3, .17, .36]} material={materials.rubber} />
      <mesh geometry={cylinderGeo} position={[2.68, 2.22, -.4]} scale={[.052, .21, .052]} material={materials.metal} />
      <mesh geometry={cylinderGeo} position={[2.12, 2.31, .07]} scale={[.016, .56, .016]} material={materials.white} />
      <mesh geometry={boxGeo} position={[2.12, 2.44, .07]} scale={[.021, .023, .58]} material={materials.white} />
      <mesh geometry={boxGeo} position={[2.12, 2.3, .07]} scale={[.027, .023, .39]} material={materials.white} />
      <mesh geometry={cylinderGeo} position={[-2.52, 1.03, 0]} scale={[.018, .81, .018]} material={materials.white} />
      <mesh geometry={boxGeo} position={[-2.52, 1.31, 0]} scale={[.018, .027, .36]} material={materials.white} />
      <Railings points={[[-2.72, .57, .32], [-2.36, .57, .74], [2.76, .57, .74], [3.01, .57, .52], [3.01, .57, -.52], [2.76, .57, -.74], [-2.36, .57, -.74], [-2.72, .57, -.32]]} color="#e8ece7" height={.26} materials={materials} />
      <Railings points={[[1.76, 1.72, -.58], [1.76, 1.72, .58], [2.72, 1.72, .58]]} color="#f6f2e8" height={.22} materials={materials} />
      <mesh position={[1.83, 1.2, .553]} rotation={[Math.PI / 2, 0, 0]} material={materials.terra}><torusGeometry args={[.06, .018, 10, 18]} /></mesh>
    </group>
    <Rope points={[[-3.05, .67, -.04], [-2.89, .18, .59], [-2.54, .63, 1.71]]} radius={.024} material={materials.rope} />
    <Rope points={[[3.08, .69, -.04], [3.09, .29, .54], [2.85, .65, 1.76]]} radius={.02} material={materials.rope} />
  </group>
}
