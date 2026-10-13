import { useMemo } from 'react'
import * as THREE from 'three'
import { boxGeo, cylinderGeo, sphereGeo, type Instance, type V3 } from './procedural'
import { Instanced } from './Instanced'
import type { Materials } from './materials'
import { lunarLandHeight } from './lunarGeometry'

function beam(a: V3, b: V3, width: number, color = '#ffffff'): Instance {
  const start = new THREE.Vector3(...a), direction = new THREE.Vector3(...b).sub(start)
  const e = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize()))
  return { position: start.addScaledVector(direction, .5).toArray() as V3, rotation: [e.x, e.y, e.z], scale: [width, direction.length(), width], color }
}
export function LunarOutpost({ materials }: { materials: Materials }) {
  return <group>
    <Habitat materials={materials} />
    <Rover materials={materials} />
    <CommsTower materials={materials} />
    <Floodlight position={[-2.12, lunarLandHeight(-2.12, -1.83), -1.83]} materials={materials} />
    <Equipment position={[.03, lunarLandHeight(.03, -2.27), -2.27]} materials={materials} />
    <Equipment position={[2.63, lunarLandHeight(2.63, -2.78), -2.78]} materials={materials} />
    <Cable points={[[1.95, .46, -2.42], [2.24, .43, -2.58], [2.46, .44, -2.7], [2.67, .45, -2.7]]} material={materials.metal} />
  </group>
}
function Habitat({ materials }: { materials: Materials }) {
  const x = 1.35, z = -2.18, height = lunarLandHeight(x, z)
  const parts = useMemo(() => {
    const panels: Instance[] = [], frames: Instance[] = [], bolts: Instance[] = [], supports: Instance[] = [], glass: Instance[] = [], vents: Instance[] = []
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2, r = .762, px = Math.sin(a) * r, pz = Math.cos(a) * r, opening = i === 0 || i === 1 || i === 2 || i === 10 || i === 11
      if (!opening) panels.push({ position: [px, .65, pz], scale: [.406, .65, .038], rotation: [0, a, 0], color: i % 2 ? '#f0f0e7' : '#dce1e3' })
      else {
        glass.push({ position: [px, .675, pz], scale: [.33, .42, .016], rotation: [0, a, 0] })
        for (const y of [.405, .945]) panels.push({ position: [px, y, pz], scale: [.406, .12, .036], rotation: [0, a, 0], color: '#edf0ed' })
        for (const side of [-1, 1]) frames.push({ position: [px + Math.cos(a) * side * .184, .677, pz - Math.sin(a) * side * .184], scale: [.038, .49, .045], rotation: [0, a, 0], color: '#c3c9cb' })
        for (const y of [.438, .91]) frames.push({ position: [px + Math.sin(a) * .022, y, pz + Math.cos(a) * .022], scale: [.355, .026, .025], rotation: [0, a, 0], color: '#9fa9ad' })
      }
      const edge = a + Math.PI / 12
      frames.push({ position: [Math.sin(edge) * .791, .65, Math.cos(edge) * .791], scale: [.024, .64, .028], rotation: [0, edge, 0], color: '#b6bfc2' })
      for (const y of [.365, .976]) bolts.push({ position: [Math.sin(a) * .792, y, Math.cos(a) * .792], scale: [.009, .009, .009], color: '#6d7a81' })
      if (i % 3 === 0) supports.push(beam([Math.sin(a) * .63, .3, Math.cos(a) * .63], [Math.sin(a) * .75, .035, Math.cos(a) * .75], .047, '#68747c'))
      supports.push(beam([Math.sin(a) * .75, .998, Math.cos(a) * .75], [Math.sin(a) * .46, 1.312, Math.cos(a) * .46], .007, '#c5cbd0'), beam([Math.sin(a) * .46, 1.312, Math.cos(a) * .46], [Math.sin(a) * .245, 1.348, Math.cos(a) * .245], .006, '#c5cbd0'))
      bolts.push({ position: [Math.sin(a + Math.PI / 12) * .674, 1.106, Math.cos(a + Math.PI / 12) * .674], scale: [.008, .006, .008], color: '#88959b' })
    }
    const serviceAngle = Math.PI * 2 / 3
    vents.push({ position: [Math.sin(serviceAngle) * .787, .69, Math.cos(serviceAngle) * .787], scale: [.29, .37, .035], rotation: [0, serviceAngle, 0], color: '#bbc5c8' })
    for (let i = 0; i < 6; i++) vents.push({ position: [Math.sin(serviceAngle) * .81, .605 + i * .03, Math.cos(serviceAngle) * .81], scale: [.23, .013, .013], rotation: [0, serviceAngle, 0], color: '#74878f' })
    for (const side of [-1, 1]) for (const y of [.525, .852]) bolts.push({ position: [Math.sin(serviceAngle) * .811 + Math.cos(serviceAngle) * side * .12, y, Math.cos(serviceAngle) * .811 - Math.sin(serviceAngle) * side * .12], scale: [.006, .006, .006] })
    return { panels, frames, bolts, supports, glass, vents }
  }, [])
  const roof = useMemo(() => {
    const points = [new THREE.Vector2(.75, .98), new THREE.Vector2(.7, 1.07), new THREE.Vector2(.46, 1.31), new THREE.Vector2(.15, 1.355), new THREE.Vector2(0, 1.355)]
    const g = new THREE.LatheGeometry(points, 12); g.computeVertexNormals(); return g
  }, [])
  return <group position={[x, height, z]} rotation={[0, -.06, 0]}>
    <mesh geometry={cylinderGeo} position={[0, .29, 0]} scale={[.76, .105, .76]} material={materials.white} castShadow />
    <mesh geometry={cylinderGeo} position={[0, .17, 0]} scale={[.55, .26, .55]} material={materials.metal} />
    <Instanced geometry={boxGeo} material={materials.white} items={parts.panels} />
    <Instanced geometry={boxGeo} material={materials.habitatShell} items={parts.frames} />
    <Instanced geometry={sphereGeo} material={materials.metal} items={parts.bolts} castShadow={false} />
    <Instanced geometry={cylinderGeo} material={materials.metal} items={parts.supports} />
    <Instanced geometry={boxGeo} material={materials.habitatGlass} items={parts.glass} castShadow={false} />
    <Instanced geometry={boxGeo} material={materials.metal} items={parts.vents} />
    <mesh geometry={roof} material={materials.habitatShell} castShadow receiveShadow />
    <mesh geometry={cylinderGeo} position={[0, 1.359, 0]} scale={[.245, .019, .245]} material={materials.metal} />
    <mesh position={[0, 1.371, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.white}><torusGeometry args={[.215, .007, 8, 32]} /></mesh>
    <mesh geometry={boxGeo} position={[.06, 1.385, .03]} scale={[.12, .015, .024]} material={materials.white} />
    <mesh geometry={cylinderGeo} position={[0, .36, 0]} scale={[.65, .05, .65]} material={materials.deck} />
    <mesh geometry={cylinderGeo} position={[.06, .67, .13]} scale={[.25, .035, .25]} material={materials.interior} />
    <mesh geometry={cylinderGeo} position={[.06, .52, .13]} scale={[.032, .3, .032]} material={materials.metal} />
    {[-1, 1].map(side => <group key={side} position={[side * .36, .41, .12]}><mesh geometry={boxGeo} position={[0, .08, 0]} scale={[.19, .08, .2]} material={materials.interior} /><mesh geometry={boxGeo} position={[side * .09, .22, 0]} scale={[.03, .26, .19]} material={materials.interior} /></group>)}
    <pointLight position={[0, .91, .05]} color="#ffbc68" intensity={1.5} distance={2.1} decay={2} />
    <mesh geometry={sphereGeo} position={[0, 1.025, .02]} scale={[.034, .018, .034]} material={materials.lamp} />
    <mesh geometry={boxGeo} position={[0, .115, 1.01]} scale={[.34, .055, .49]} rotation={[-.29, 0, 0]} material={materials.metal} receiveShadow />
    {[0, 1, 2, 3].map(i => <mesh key={i} geometry={boxGeo} position={[0, .183 - i * .026, .84 + i * .09]} scale={[.34, .028, .082]} material={materials.white} />)}
    <mesh geometry={boxGeo} position={[.69, .68, -.25]} scale={[.09, .12, .24]} material={materials.orange} />
    <mesh position={[0, .389, .788]} material={materials.marking}><planeGeometry args={[.26, .065]} /></mesh>
  </group>
}
function Rover({ materials }: { materials: Materials }) {
  const x = -1.35, z = -1.76, ground = lunarLandHeight(x, z)
  const details = useMemo(() => {
    const treads: Instance[] = [], chassis: Instance[] = [], axles: Instance[] = [], bolts: Instance[] = [], trim: Instance[] = []
    for (const wx of [-.33, .36]) for (const side of [-1, 1]) {
      for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; treads.push({ position: [wx + Math.cos(a) * .142, .171 + Math.sin(a) * .142, side * .293], scale: [.043, .018, .126], rotation: [0, 0, a + Math.PI / 2], color: '#373e46' }) }
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; bolts.push({ position: [wx + Math.cos(a) * .039, .171 + Math.sin(a) * .039, side * .356], scale: [.007, .007, .005], color: '#d4d8d7' }) }
      trim.push({ position: [wx, .35, side * .31], scale: [.365, .035, .115], color: '#d2d7d6' })
    }
    for (const z of [-.21, .21]) chassis.push({ position: [0, .26, z], scale: [1.01, .073, .047], color: '#67757d' })
    axles.push(beam([-.34, .17, -.29], [-.34, .17, .29], .022, '#63717a'), beam([.36, .17, -.29], [.36, .17, .29], .022, '#63717a'))
    for (let i = 0; i < 7; i++) trim.push({ position: [.544, .33, (i - 3) * .034], scale: [.009, .108, .012], color: '#b7c2c5' })
    for (const side of [-1, 1]) {
      trim.push({ position: [-.27, .403, side * .25], scale: [.014, .13, .012], color: '#89979d' }, { position: [-.07, .453, side * .25], scale: [.32, .01, .013], color: '#8b989d' }, { position: [.07, .69, side * .297], scale: [.086, .09, .017], color: '#a6b5bc' })
    }
    return { treads, chassis, axles, bolts, trim }
  }, [])
  return <group position={[x, ground + .01, z]} rotation={[0, -.2, 0]}>
    <Instanced geometry={boxGeo} material={materials.rubber} items={details.treads} />
    <Instanced geometry={boxGeo} material={materials.metal} items={details.chassis} />
    <Instanced geometry={cylinderGeo} material={materials.metal} items={details.axles} />
    <Instanced geometry={sphereGeo} material={materials.metal} items={details.bolts} castShadow={false} />
    <Instanced geometry={boxGeo} material={materials.white} items={details.trim} />
    {[-.33, .36].flatMap(wx => [-1, 1].map(side => <group key={`${wx}${side}`} position={[wx, .171, side * .293]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.rubber}><torusGeometry args={[.1, .044, 12, 24]} /></mesh>
      <mesh geometry={cylinderGeo} rotation={[Math.PI / 2, 0, 0]} scale={[.067, .115, .067]} material={materials.metal} />
      <mesh geometry={cylinderGeo} position={[0, 0, side * .061]} rotation={[Math.PI / 2, 0, 0]} scale={[.029, .013, .029]} material={materials.white} />
    </group>))}
    <mesh geometry={boxGeo} position={[0, .32, 0]} scale={[1.02, .17, .48]} material={materials.white} castShadow />
    <mesh geometry={boxGeo} position={[-.1, .575, 0]} scale={[.5, .43, .45]} material={materials.white} castShadow />
    <mesh geometry={boxGeo} position={[.157, .613, 0]} scale={[.018, .25, .365]} material={materials.roverGlass} />
    <mesh geometry={boxGeo} position={[-.1, .613, .235]} scale={[.375, .25, .018]} material={materials.roverGlass} />
    <mesh geometry={boxGeo} position={[-.1, .613, -.235]} scale={[.375, .25, .018]} material={materials.roverGlass} />
    <mesh geometry={boxGeo} position={[-.1, .8, 0]} scale={[.58, .044, .5]} material={materials.white} />
    <mesh geometry={boxGeo} position={[.34, .423, 0]} scale={[.28, .035, .46]} material={materials.white} />
    <mesh geometry={boxGeo} position={[.522, .33, 0]} scale={[.026, .15, .3]} material={materials.metal} />
    <mesh geometry={boxGeo} position={[.554, .255, 0]} scale={[.063, .035, .5]} material={materials.metal} />
    {[-.173, .173].map(dz => <mesh key={dz} geometry={cylinderGeo} position={[.54, .365, dz]} rotation={[0, 0, Math.PI / 2]} scale={[.039, .024, .039]} material={materials.lamp} />)}
    <mesh geometry={cylinderGeo} position={[-.3, 1.035, -.15]} scale={[.005, .46, .005]} material={materials.metal} />
    <mesh geometry={boxGeo} position={[-.385, .43, 0]} scale={[.18, .2, .28]} material={materials.deck} />
    <mesh geometry={boxGeo} position={[-.1, .375, .252]} scale={[.09, .05, .006]} material={materials.orange} />
    <mesh geometry={boxGeo} position={[-.055, .485, .256]} scale={[.09, .012, .007]} material={materials.metal} />
    <mesh position={[-.13, .365, .252]} material={materials.marking}><planeGeometry args={[.22, .055]} /></mesh>
  </group>
}
function CommsTower({ materials }: { materials: Materials }) {
  const x = 2.62, z = -2.67, ground = lunarLandHeight(x, z)
  const steel = useMemo(() => {
    const items: Instance[] = []
    const points = Array.from({ length: 3 }, (_, i) => ({ x: Math.sin(i / 3 * Math.PI * 2) * .16, z: Math.cos(i / 3 * Math.PI * 2) * .16 }))
    for (let i = 0; i < 3; i++) {
      const a = points[i], b = points[(i + 1) % 3]
      items.push(beam([a.x, .08, a.z], [a.x * .36, 1.95, a.z * .36], .023, '#64717a'))
      for (let y = .22; y < 1.8; y += .23) {
        const f1 = 1 - y / 2 * .64, f2 = 1 - (y + .23) / 2 * .64
        items.push(beam([a.x * f1, y, a.z * f1], [b.x * f1, y, b.z * f1], .013, '#6c777b'), beam([a.x * f1, y, a.z * f1], [b.x * f2, y + .23, b.z * f2], .011, '#747d80'))
      }
    }
    items.push(beam([0, 1.88, 0], [0, 2.45, 0], .012, '#75828b'), beam([-.22, 2.02, 0], [.22, 2.02, 0], .026, '#63717b'))
    return items
  }, [])
  return <group position={[x, ground, z]}>
    <Instanced geometry={cylinderGeo} material={materials.metal} items={steel} />
    <mesh geometry={boxGeo} position={[0, .07, 0]} scale={[.42, .14, .42]} material={materials.deck} castShadow />
    <mesh geometry={boxGeo} position={[0, 1.94, 0]} scale={[.39, .055, .28]} material={materials.metal} />
    <mesh geometry={boxGeo} position={[-.18, 2.065, .065]} scale={[.22, .21, .08]} material={materials.metal} />
    <mesh geometry={boxGeo} position={[-.18, 2.065, .109]} scale={[.175, .15, .015]} material={materials.lamp} />
    <mesh geometry={cylinderGeo} position={[.19, 2.045, -.03]} rotation={[Math.PI / 2, 0, 0]} scale={[.065, .04, .065]} material={materials.metal} />
    <mesh geometry={sphereGeo} position={[0, 2.461, 0]} scale={[.015, .015, .015]} material={materials.orange} />
  </group>
}
function Equipment({ position, materials }: { position: V3; materials: Materials }) {
  return <group position={position}>
    <mesh geometry={boxGeo} position={[0, .145, 0]} scale={[.32, .29, .26]} material={materials.white} castShadow />
    <mesh geometry={boxGeo} position={[0, .305, 0]} scale={[.29, .025, .22]} material={materials.metal} />
    <mesh geometry={boxGeo} position={[0, .165, .134]} scale={[.12, .074, .009]} material={materials.roverGlass} />
    <mesh geometry={boxGeo} position={[.101, .195, .135]} scale={[.02, .02, .01]} material={materials.orange} />
    {[-.08, -.04, 0, .04, .08].map(dx => <mesh key={dx} geometry={boxGeo} position={[dx, .066, .133]} scale={[.018, .025, .008]} material={materials.metal} />)}
  </group>
}
function Floodlight({ position, materials }: { position: V3; materials: Materials }) {
  return <group position={position}>
    <mesh geometry={cylinderGeo} position={[0, .49, 0]} scale={[.013, .97, .013]} material={materials.metal} />
    <mesh geometry={boxGeo} position={[0, .025, 0]} scale={[.15, .05, .15]} material={materials.metal} />
    <mesh geometry={boxGeo} position={[0, 1, 0]} scale={[.23, .25, .035]} material={materials.metal} />
    {[-.055, .055].flatMap(x => [-.059, .059].map(y => <mesh key={`${x}${y}`} geometry={boxGeo} position={[x, 1 + y, .022]} scale={[.091, .098, .013]} material={materials.lamp} />))}
  </group>
}
function Cable({ points, material }: { points: V3[]; material: THREE.Material }) {
  const geometry = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), 32, .009, 6, false), [points])
  return <mesh geometry={geometry} material={material} />
}
