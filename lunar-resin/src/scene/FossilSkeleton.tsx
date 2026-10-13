import { useMemo } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { Instanced } from './Instanced'
import { FOSSIL_SECTION } from './lunarGeometry'
import { random, rockGeo, sphereGeo, type Instance, type V3 } from './procedural'
import type { Materials } from './materials'

export function FossilSkeleton({ materials }: { materials: Materials }) {
  const fossil = useMemo(() => {
    const pieces: THREE.BufferGeometry[] = [], joints: Instance[] = [], sockets: Instance[] = [], chips: Instance[] = [], rng = random(241)
    const tube = (points: V3[], radius: number) => pieces.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), 18, radius, 8, false))
    const ellipsoid = (position: V3, scale: V3, rotation: V3 = [0, 0, 0]) => {
      const g = new THREE.SphereGeometry(1, 28, 18), matrix = new THREE.Matrix4().compose(new THREE.Vector3(...position), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)), new THREE.Vector3(...scale))
      g.applyMatrix4(matrix); pieces.push(g)
    }
    // Elongated cranium, hollow orbital sockets and a separate weathered jaw.
    ellipsoid([.068, .14, 1.035], [.09, .17, .235], [.2, 0, 0])
    ellipsoid([.09, .05, .885], [.06, .085, .11])
    sockets.push({ position: [.148, .145, .965], scale: [.011, .063, .05], rotation: [.36, 0, 0] }, { position: [.143, .077, 1.102], scale: [.013, .057, .049], rotation: [.36, 0, 0] }, { position: [.153, .006, .952], scale: [.009, .017, .019] })
    tube([[.09, .024, 1.16], [.137, -.023, 1.075], [.145, -.032, .98], [.1, -.004, .87]], .019)
    tube([[.07, .035, .82], [.08, .017, .58], [.065, -.052, .16], [.075, -.104, -.4]], .018)
    for (let i = 0; i < 13; i++) {
      const z = .72 - i * .087, y = .025 - i * .01
      joints.push({ position: [.077, y, z], scale: [.033, .029, .031], rotation: [rng() * .14, 0, 0], color: i % 3 ? '#d9cbb1' : '#c2b395' })
      if (i < 8) for (const side of [-1, 1]) {
        const spread = .105 + Math.sin((i + 1) / 9 * Math.PI) * .115
        tube([[.073, y, z], [.118, y + side * spread * .55, z - .045], [.13, y + side * spread, z - .095], [.083, y + side * spread * .86, z - .16]], .013 - i * .00025)
      }
    }
    for (const side of [-1, 1]) {
      tube([[.073, -.065, -.31], [.1, side * .085 - .08, -.4], [.072, side * .11 - .07, -.5]], .027)
      tube([[.087, side * .17, .5], [.115, side * .345, .105], [.105, side * .31, -.28]], .017)
      tube([[.096, side * .115 - .07, -.48], [.095, side * .2 - .075, -.9], [.084, side * .31 - .06, -1.22]], .024)
      tube([[.108, side * .19 - .07, -.9], [.108, side * .27 - .055, -1.2]], .013)
      for (let finger = 0; finger < 3; finger++) {
        tube([[.098, side * .31, -.28], [.096, side * (.29 + finger * .025), -.4 - finger * .018]], .007)
        tube([[.085, side * .31 - .06, -1.22], [.085, side * (.29 + finger * .025) - .06, -1.35]], .009)
      }
      joints.push({ position: [.09, side * .2 - .075, -.9], scale: [.032, .035, .038], color: '#c7b99d' })
    }
    for (let i = 0; i < 34; i++) {
      const angle = rng() * Math.PI * 2, q = .84 + rng() * .23, s = .025 + rng() * .025
      chips.push({ position: [.04 + rng() * .07, Math.sin(angle) * FOSSIL_SECTION.height * q, Math.cos(angle) * FOSSIL_SECTION.width * q], scale: [s * .7, s, s * 1.4], rotation: [rng(), rng() * 6, rng()], color: ['#aa9e8b', '#96938c', '#b5ab99'][i % 3] })
    }
    const geometry = mergeGeometries(pieces)!; pieces.forEach(g => g.dispose())
    return { geometry, joints, sockets, chips }
  }, [])
  return <group position={[3.59, FOSSIL_SECTION.y, FOSSIL_SECTION.z]}>
    <mesh geometry={fossil.geometry} material={materials.fossil} castShadow receiveShadow />
    <Instanced geometry={sphereGeo} material={materials.fossil} items={fossil.joints} />
    <Instanced geometry={sphereGeo} material={materials.fossilSocket} items={fossil.sockets} castShadow={false} />
    <Instanced geometry={rockGeo} material={materials.lunar} items={fossil.chips} />
  </group>
}
