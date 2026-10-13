import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { BOAT_POSITION, type SceneSettings } from '../config'
import type { WaterSimulation } from '../hooks/useWaterSimulation'
import type { MotionState } from '../hooks/useDioramaMotion'
import { useBoatFloat } from '../hooks/useBoatFloat'
import { boxGeo, cylinderGeo, type V3 } from './procedural'
import type { Materials } from './materials'
import { FishingCrate, Rope, RopeCoil } from './WoodenPier'

function boatGeometry() {
  const p: number[] = [], colors: number[] = [], uv: number[] = [], indices: number[] = []
  const sections = 44, cross = 20, color = new THREE.Color()
  for (let i = 0; i <= sections; i++) {
    const t = i / sections, z = (t - .5) * 2.12
    const width = .375 * Math.pow(Math.sin(Math.PI * Math.max(.018, Math.min(.982, t))), .47) * (1 + .15 * t)
    const lift = .075 * Math.pow(Math.abs(t - .5) * 2, 4)
    for (let j = 0; j <= cross; j++) {
      const a = (j / cross - .5) * Math.PI, x = Math.sin(a) * width, y = -.195 + (1 - Math.cos(a)) * .39 + lift
      p.push(x, y, z); uv.push(t, j / cross)
      color.set(y > .025 && y < .073 ? '#377d96' : y < -.11 ? '#b46850' : '#f2f0e4'); colors.push(color.r, color.g, color.b)
      if (i < sections && j < cross) { const n = i * (cross + 1) + j; indices.push(n, n + 1, n + cross + 1, n + 1, n + cross + 2, n + cross + 1) }
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(indices); g.computeVertexNormals(); return g
}
function MooringRope({ boat, start, end, materials }: { boat: React.RefObject<THREE.Group>; start: V3; end: V3; materials: Materials }) {
  const ref = useRef<THREE.Mesh>(null!)
  const data = useMemo(() => {
    const a = new THREE.Vector3(...start), b = new THREE.Vector3(), world = new THREE.Vector3(), mid = new THREE.Vector3()
    const curve = new THREE.QuadraticBezierCurve3(a, a.clone(), a.clone()), geo = new THREE.TubeGeometry(curve, 24, .009, 5, false)
    return { a, b, world, mid, curve, geo, lastY: 10, lastR: 10 }
  }, [start, end])
  useFrame(() => {
    if (!boat.current || !ref.current.parent) return
    boat.current.updateWorldMatrix(true, false); ref.current.parent.updateWorldMatrix(true, false)
    data.world.set(...end); boat.current.localToWorld(data.world); ref.current.parent.worldToLocal(data.world)
    if (Math.abs(data.world.y - data.lastY) < .0003 && Math.abs(data.world.x - data.lastR) < .0003) return
    data.lastY = data.world.y; data.lastR = data.world.x
    data.b.copy(data.world); data.mid.copy(data.a).lerp(data.b, .5); data.mid.y -= .13
    const p = data.geo.attributes.position
    // Small rope mesh, updated only after the damped boat actually changes position.
    for (let i = 0; i <= 24; i++) {
      const t = i / 24, x = (1 - t) ** 2 * data.a.x + 2 * (1 - t) * t * data.mid.x + t * t * data.b.x
      const y = (1 - t) ** 2 * data.a.y + 2 * (1 - t) * t * data.mid.y + t * t * data.b.y
      const z = (1 - t) ** 2 * data.a.z + 2 * (1 - t) * t * data.mid.z + t * t * data.b.z
      for (let j = 0; j <= 5; j++) { const a = j / 5 * Math.PI * 2; p.setXYZ(i * 6 + j, x, y + Math.cos(a) * .009, z + Math.sin(a) * .009) }
    }
    p.needsUpdate = true; data.geo.computeVertexNormals(); data.geo.computeBoundingSphere()
  })
  return <mesh ref={ref} geometry={data.geo} material={materials.rope} />
}
export function FishingBoat({ materials, simulation, motion, settings, paused, reset }: { materials: Materials; simulation: WaterSimulation; motion: React.RefObject<MotionState>; settings: SceneSettings; paused: boolean; reset: number }) {
  const boat = useBoatFloat(simulation, motion, settings, paused, reset)
  const hull = useMemo(boatGeometry, [])
  const hullMat = useMemo(() => { const m = materials.hull.clone(); m.vertexColors = true; m.side = THREE.DoubleSide; return m }, [materials])
  const gunwale = useMemo(() => {
    const points: THREE.Vector3[] = []
    for (const side of [-1, 1]) for (let i = 0; i <= 36; i++) {
      const t = side === -1 ? i / 36 : 1 - i / 36
      const width = .375 * Math.pow(Math.sin(Math.PI * Math.max(.018, Math.min(.982, t))), .47) * (1 + .15 * t)
      points.push(new THREE.Vector3(side * width, .196 + .075 * Math.pow(Math.abs(t - .5) * 2, 4), (t - .5) * 2.12))
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, true), 90, .022, 7, true)
  }, [])
  const deck = useMemo(() => { const s = new THREE.Shape(); s.moveTo(0, -1.04); s.bezierCurveTo(.38, -.73, .42, .52, .14, 1.04); s.lineTo(-.14, 1.04); s.bezierCurveTo(-.42, .52, -.38, -.73, 0, -1.04); const g = new THREE.ShapeGeometry(s, 24); g.rotateX(-Math.PI / 2); return g }, [])
  return <group>
    <group ref={boat} position={BOAT_POSITION} rotation={[0, -.12, 0]}>
      <mesh geometry={hull} material={hullMat} castShadow receiveShadow />
      <mesh geometry={deck} position={[0, .157, 0]} material={materials.wood} receiveShadow />
      <mesh geometry={gunwale} material={materials.white} castShadow />
      <mesh geometry={boxGeo} position={[0, .365, .14]} scale={[.49, .4, .58]} material={materials.white} castShadow receiveShadow />
      <mesh geometry={boxGeo} position={[0, .585, .14]} scale={[.59, .052, .68]} material={materials.terra} castShadow />
      <mesh geometry={boxGeo} position={[0, .615, .14]} scale={[.55, .025, .64]} material={materials.white} />
      <mesh geometry={boxGeo} position={[0, .45, -.157]} scale={[.36, .19, .021]} material={materials.glass} />
      <mesh geometry={boxGeo} position={[0, .45, -.172]} scale={[.027, .21, .025]} material={materials.white} />
      <mesh geometry={boxGeo} position={[.256, .448, .11]} scale={[.023, .19, .42]} material={materials.glass} />
      <mesh geometry={boxGeo} position={[.27, .448, .11]} scale={[.025, .21, .018]} material={materials.white} />
      <mesh geometry={boxGeo} position={[-.256, .448, .11]} scale={[.023, .19, .42]} material={materials.glass} />
      <mesh geometry={boxGeo} position={[0, .318, .44]} scale={[.15, .28, .024]} material={materials.wood} />
      <mesh geometry={cylinderGeo} position={[0, .78, -.48]} scale={[.017, 1.13, .017]} material={materials.darkWood} castShadow />
      <mesh geometry={boxGeo} position={[0, 1.12, -.48]} scale={[.6, .019, .018]} material={materials.darkWood} />
      <mesh geometry={cylinderGeo} position={[.13, .7, .34]} scale={[.027, .17, .027]} material={materials.terra} />
      <mesh geometry={boxGeo} position={[0, .216, -.72]} scale={[.5, .046, .15]} material={materials.wood} />
      <mesh geometry={boxGeo} position={[0, .23, .8]} scale={[.42, .09, .25]} material={materials.wood} />
      <FishingCrate position={[-.05, .181, .69]} materials={materials} cage />
      <FishingCrate position={[.02, .19, -.7]} materials={materials} />
      <RopeCoil position={[.13, .182, -.36]} material={materials.rope} scale={.42} />
      <mesh geometry={cylinderGeo} position={[-.15, .705, .15]} rotation={[Math.PI / 2, 0, 0]} scale={[.065, .016, .065]} material={materials.white} /><mesh geometry={cylinderGeo} position={[-.15, .705, .139]} rotation={[Math.PI / 2, 0, 0]} scale={[.038, .02, .038]} material={materials.metal} />
      <Rope points={[[-.32, .23, -.64], [-.18, .6, -.49], [0, 1.29, -.48]]} radius={.005} material={materials.rope} />
      <Rope points={[[.32, .23, -.64], [.18, .6, -.49], [0, 1.29, -.48]]} radius={.005} material={materials.rope} />
      <Rope points={[[0, 1.27, -.48], [0, .72, .34], [0, .24, .86]]} radius={.005} material={materials.rope} />
      <mesh position={[.395, .17, .58]} rotation={[0, Math.PI / 2, 0]} material={materials.rubber}><torusGeometry args={[.064, .023, 7, 16]} /></mesh>
    </group>
    <MooringRope boat={boat} start={[.03, .5, 1.16]} end={[.35, .23, .62]} materials={materials} />
    <MooringRope boat={boat} start={[-1.25, .55, .44]} end={[-.26, .24, -.72]} materials={materials} />
  </group>
}
