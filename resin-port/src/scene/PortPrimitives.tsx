import { useMemo } from 'react'
import * as THREE from 'three'
import { boxGeo, cylinderGeo, type Instance, type V3 } from './procedural'
import { Instanced } from './Instanced'
import type { Materials } from './materials'

export function beamBetween(a: V3, b: V3, width: number, color = '#ffffff'): Instance {
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), direction = end.clone().sub(start)
  const rotation = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize()))
  return { position: start.add(end).multiplyScalar(.5).toArray() as V3, scale: [width, direction.length(), width], rotation: rotation.toArray().slice(0, 3) as V3, color }
}
export function Railings({ points, materials, height = .27, color = '#f7be35' }: { points: V3[]; materials: Materials; height?: number; color?: string }) {
  const items = useMemo(() => {
    const out: Instance[] = []
    for (let i = 0; i < points.length - 1; i++) {
      const a = new THREE.Vector3(...points[i]), b = new THREE.Vector3(...points[i + 1]), steps = Math.ceil(a.distanceTo(b) / .38)
      for (let j = 0; j <= steps; j++) { const p = a.clone().lerp(b, j / steps); out.push(beamBetween(p.toArray() as V3, [p.x, p.y + height, p.z], .017, color)) }
      for (const h of [height * .48, height]) out.push(beamBetween([a.x, a.y + h, a.z], [b.x, b.y + h, b.z], .017, color))
    }
    return out
  }, [points, height, color])
  return <Instanced geometry={cylinderGeo} material={materials.paintedSteel} items={items} />
}
export function Container({ position, color, materials, size = [.88, .44, .56], rotation = 0 }: { position: V3; color: string; materials: Materials; size?: V3; rotation?: number }) {
  const [w, h, d] = size
  const parts = useMemo(() => {
    const ribs: Instance[] = [], edges: Instance[] = [], locks: Instance[] = []
    const lighter = new THREE.Color(color).lerp(new THREE.Color('#ffffff'), .08).getStyle()
    for (let i = 0; i < Math.ceil(w / .052); i++) for (const side of [-1, 1]) ribs.push({ position: [-w / 2 + .025 + i * .052, h / 2, side * (d / 2 + .004)], scale: [.019, h - .058, .012], color: lighter })
    for (let z = -d / 2 + .03; z < d / 2; z += .048) ribs.push({ position: [0, h + .004, z], scale: [w - .04, .012, .016], color: lighter })
    for (const x of [-1, 1]) for (const z of [-1, 1]) edges.push({ position: [x * (w / 2 - .015), h / 2, z * (d / 2 - .014)], scale: [.028, h, .028], color })
    for (const y of [.017, h - .017]) for (const z of [-1, 1]) edges.push({ position: [0, y, z * d / 2], scale: [w, .028, .028], color })
    for (const z of [-.15, .15]) locks.push({ position: [w / 2 + .009, h / 2, z * d / .56], scale: [.014, h - .06, .01], color: '#c1c8c4' })
    for (const z of [-.15, .15]) locks.push({ position: [w / 2 + .015, h * .35, z * d / .56 + .015], scale: [.024, .012, .07], color: '#a7b3af' })
    return { ribs, edges, locks }
  }, [w, h, d, color])
  return <group position={position} rotation={[0, rotation, 0]}>
    <mesh geometry={boxGeo} position={[0, h / 2, 0]} scale={[w, h, d]} castShadow receiveShadow><meshStandardMaterial color={color} roughness={.65} metalness={.16} /></mesh>
    <Instanced geometry={boxGeo} material={materials.paintedSteel} items={parts.ribs} />
    <Instanced geometry={boxGeo} material={materials.paintedSteel} items={parts.edges} />
    <Instanced geometry={cylinderGeo} material={materials.metal} items={parts.locks} castShadow={false} />
    <mesh geometry={boxGeo} position={[.12, h * .73, d / 2 + .013]} scale={[.095, .025, .006]} material={materials.white} />
    <mesh geometry={boxGeo} position={[-w * .3, h * .23, d / 2 + .013]} scale={[.057, .035, .006]} material={materials.yellow} />
  </group>
}
