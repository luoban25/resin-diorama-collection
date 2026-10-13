import { useMemo } from 'react'
import * as THREE from 'three'
import { Instanced } from './Instanced'
import { boxGeo, tileGeo, ridgeTileGeo, potGeo, sphereGeo, terrainHeight, random, type Instance, type V3 } from './procedural'
import type { Materials } from './materials'

type HouseSpec = { position: V3; w: number; d: number; h: number; angle: number; color: string }
export const HOUSES: HouseSpec[] = [
  { position: [-1.85, .66, -1.8], w: 1.05, d: 1.12, h: 1.13, angle: -.07, color: '#f1e8d3' },
  { position: [-.18, 1.05, -2.85], w: 1.42, d: 1.13, h: 1.46, angle: .035, color: '#e8deca' },
  { position: [1.22, .58, -1.6], w: 1.25, d: 1.12, h: 1.12, angle: -.09, color: '#efe4ce' },
  { position: [2.35, .42, -1.17], w: .72, d: .86, h: .83, angle: -.09, color: '#e4d9c3' },
  { position: [-2.66, .99, -2.95], w: .73, d: .73, h: .82, angle: .14, color: '#e7dbc1' },
]

function gableGeometry(w: number, d: number) {
  const shape = new THREE.Shape(); shape.moveTo(-w / 2, 0); shape.lineTo(w / 2, 0); shape.lineTo(0, w * .36); shape.closePath()
  const g = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2); g.computeVertexNormals(); return g
}
export function RoofTiles({ w, d, h, materials }: { w: number; d: number; h: number; materials: Materials }) {
  const tiles = useMemo(() => {
    const rng = random(Math.round(w * 100)), out: Instance[] = [], pitch = Math.atan(.72), ridge = h + w * .36
    const rows = Math.ceil((w / 2 + .12) / .105), columns = Math.ceil((d + .2) / .112)
    for (const side of [-1, 1]) for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
      const x = side * (.04 + row * .102)
      out.push({ position: [x, ridge - Math.abs(x) * .72 + .024, -(d + .12) / 2 + col * .112], scale: [.92, .92, .98], rotation: [0, 0, -side * pitch], color: ['#e9bf9b', '#dba984', '#f1c79e', '#efcea9', '#d9ad8d'][Math.floor(rng() * 5)] })
    }
    return out
  }, [w, d, h])
  const ridgeTiles = useMemo(() => { const out: Instance[] = []; for (let z = -d / 2 - .08; z <= d / 2 + .1; z += .17) out.push({ position: [0, h + w * .36 + .037, z], scale: [1.05, 1.05, 1.05], rotation: [0, 0, 0], color: '#d79972' }); return out }, [w, d, h])
  const fascia = useMemo(() => {
    const out: Instance[] = [], pitch = Math.atan(.72), length = (w / 2 + .13) * Math.sqrt(1 + .72 ** 2)
    for (const side of [-1, 1]) {
      out.push({ position: [side * (w / 2 + .06), h - .055, 0], scale: [.06, .075, d + .24] })
      for (const end of [-1, 1]) out.push({ position: [side * (w / 4 + .04), h + w * .18 - .03, end * (d / 2 + .095)], scale: [length, .056, .056], rotation: [0, 0, -side * pitch] })
    }
    return out
  }, [w, d, h])
  return <><Instanced geometry={boxGeo} material={materials.darkWood} items={fascia} /><Instanced geometry={tileGeo} material={materials.roof} items={tiles} /><Instanced geometry={ridgeTileGeo} material={materials.roof} items={ridgeTiles} /></>
}
function StoneHouse({ spec, materials }: { spec: HouseSpec; materials: Materials }) {
  const { w, d, h } = spec
  const gable = useMemo(() => gableGeometry(w, d), [w, d])
  const details = useMemo(() => {
    const frames: Instance[] = [], trim: Instance[] = [], dark: Instance[] = [], corners: Instance[] = [], rng = random(Math.round(w * 1729))
    // Readable doors and shuttered windows on the front and the sunlit side.
    const front = d / 2 + .026
    trim.push({ position: [w * .16, .4, front], scale: [.31, .77, .05], color: '#d2c3a5' })
    frames.push({ position: [w * .16, .36, front + .032], scale: [.225, .66, .055], color: '#3b7270' })
    for (let i = 0; i < 4; i++) frames.push({ position: [w * .16 - .081 + i * .055, .36, front + .065], scale: [.006, .62, .006], color: '#264c4b' })
    const wx = -w * .27, wy = h * .68
    trim.push({ position: [wx, wy, front], scale: [.32, .43, .07], color: '#d3c5a9' })
    dark.push({ position: [wx, wy, front + .04], scale: [.2, .33, .01], color: '#243b3c' })
    for (const s of [-1, 1]) {
      frames.push({ position: [wx + s * .126, wy, front + .075], scale: [.075, .36, .038], color: '#3f7274' })
      for (let i = 0; i < 5; i++) frames.push({ position: [wx + s * .126, wy - .13 + i * .065, front + .099], scale: [.063, .016, .015], color: '#305a58' })
    }
    frames.push({ position: [wx, wy, front + .06], scale: [.017, .33, .02], color: '#7d715c' }, { position: [wx, wy, front + .06], scale: [.21, .014, .02], color: '#7d715c' })
    trim.push({ position: [w / 2 + .015, h * .67, 0], scale: [.06, .41, .3], color: '#d6c8af' })
    dark.push({ position: [w / 2 + .05, h * .67, 0], scale: [.016, .32, .22], color: '#213c3b' })
    for (const side of [-1, 1]) frames.push({ position: [w / 2 + .07, h * .67, side * .14], scale: [.05, .35, .08], color: '#387174' })
    for (let row = 0; row < Math.floor(h / .17); row++) for (const sx of [-1, 1]) for (const sz of [-1, 1]) corners.push({ position: [sx * (w / 2 - .045), .1 + row * .17, sz * (d / 2 - .035)], scale: [.145, .14, .09], color: row % 2 ? '#d9ceb6' : '#e5dbc4' })
    // Sparse exposed masonry breaks the plaster surface without obscuring openings.
    for (let row = 0; row < Math.floor(h / .13); row++) for (let col = 0; col < Math.ceil(w / .18); col++) {
      const x = -w / 2 + .09 + col * .18 + (row % 2) * .07, y = .065 + row * .13
      if (x > w / 2 - .07 || rng() > .46) continue
      if (!(Math.abs(x - w * .16) < .2 && y < .83) && !(Math.abs(x - wx) < .22 && Math.abs(y - wy) < .27)) corners.push({ position: [x, y, d / 2 + .009], scale: [.13 + rng() * .035, .095 + rng() * .015, .018], color: ['#f3ecdf', '#e9dfcc', '#f6edda'][Math.floor(rng() * 3)] })
      if (Math.abs(x) > .21 || Math.abs(y - h * .66) > .27) corners.push({ position: [x, y, -d / 2 - .009], scale: [.15, .105, .018], color: '#eee5d2' })
    }
    for (const side of [-1, 1]) for (let row = 0; row < Math.floor(h / .14); row++) for (let col = 0; col < Math.floor(d / .19); col++) {
      const z = -d / 2 + .12 + col * .19, y = .075 + row * .14
      if (rng() > .38 || (side > 0 && Math.abs(z) < .22 && Math.abs(y - h * .67) < .28)) continue
      corners.push({ position: [side * (w / 2 + .009), y, z], scale: [.018, .1, .145 + rng() * .022], color: row % 3 ? '#f3e9d5' : '#e4dac5' })
    }
    trim.push({ position: [0, h * .66, -d / 2 - .027], scale: [.33, .43, .052], color: '#d5c8ad' })
    dark.push({ position: [0, h * .66, -d / 2 - .06], scale: [.22, .33, .025], color: '#253f3e' })
    for (const side of [-1, 1]) frames.push({ position: [side * .136, h * .66, -d / 2 - .075], scale: [.065, .36, .035], color: '#3b7370' })
    frames.push({ position: [0, h * .66, -d / 2 - .079], scale: [.018, .33, .018], color: '#9c8d70' })
    for (let col = 0; col < Math.ceil(w / .22); col++) corners.push({ position: [-w / 2 + .11 + col * .22, -.018, d / 2 + .16], scale: [.2, .045, .31], color: col % 2 ? '#ded3bb' : '#cfc5ad' })
    return { frames, trim, dark, corners }
  }, [w, d, h])
  return <group position={spec.position} rotation={[0, spec.angle, 0]}>
    <mesh geometry={boxGeo} position={[0, -(w > 1.4 ? .44 : .3) / 2, .08]} scale={[w + .12, w > 1.4 ? .44 : .3, d + .34]} material={materials.stone} castShadow receiveShadow />
    <mesh geometry={boxGeo} position={[0, h / 2, 0]} scale={[w, h, d]} material={materials.plaster} castShadow receiveShadow />
    <mesh geometry={gable} position={[0, h - .01, 0]} material={materials.plaster} castShadow receiveShadow />
    <RoofTiles w={w} d={d} h={h} materials={materials} />
    <Instanced geometry={boxGeo} material={materials.teal} items={details.frames} />
    <Instanced geometry={boxGeo} material={materials.stone} items={details.trim} />
    <Instanced geometry={boxGeo} material={materials.glass} items={details.dark} castShadow={false} />
    <Instanced geometry={boxGeo} material={materials.stone} items={details.corners} />
    <mesh geometry={sphereGeo} position={[w * .16 + .065, .36, d / 2 + .098]} scale={[.012, .012, .012]} material={materials.metal} />
    <mesh geometry={boxGeo} position={[-w * .26, h + w * .24 + .15, -d * .23]} scale={[.16, .42, .18]} material={materials.stone} castShadow />
    <mesh geometry={boxGeo} position={[-w * .26, h + w * .24 + .375, -d * .23]} scale={[.21, .07, .22]} material={materials.terra} />
    <mesh geometry={boxGeo} position={[-w * .26, h + w * .24 + .415, -d * .23]} scale={[.095, .01, .11]} material={materials.rubber} />
    <mesh geometry={boxGeo} position={[-w * .29, .16, d / 2 + .16]} scale={[.38, .045, .15]} material={materials.wood} castShadow />
    <mesh geometry={boxGeo} position={[-w * .43, .07, d / 2 + .16]} scale={[.034, .15, .1]} material={materials.darkWood} />
    <mesh geometry={boxGeo} position={[-w * .15, .07, d / 2 + .16]} scale={[.034, .15, .1]} material={materials.darkWood} />
  </group>
}
export function StoneSteps({ materials }: { materials: Materials }) {
  const steps = useMemo(() => {
    const out: Instance[] = []
    for (let i = 0; i < 7; i++) out.push({ position: [.16, .4 + i * .088, -1.02 - i * .18], scale: [.65, .14 + i * .008, .26], color: ['#e8dec7', '#d3c9b2', '#e1d5bc'][i % 3] })
    for (let i = 0; i < 5; i++) out.push({ position: [2.76, -.04 + i * .092, .01 - i * .16], scale: [.62, .14, .24], color: '#ded1b4' })
    for (let i = 0; i < 8; i++) out.push({ position: [.52, .86 + i * .024, -1.68 - i * .17], scale: [.15, .3, .21], color: '#d9cdb3' })
    return out
  }, [])
  return <Instanced geometry={boxGeo} material={materials.stone} items={steps} />
}
export function VillageProps({ materials }: { materials: Materials }) {
  const pots = useMemo(() => {
    const out: Instance[] = [], points = [[-2.43, -1.06], [-1.17, -1.05], [.9, -.91], [1.85, -.8], [2.8, -.77], [.66, -2.28], [-.75, -2.24], [-2.57, -2.47]]
    points.forEach(([x, z], i) => out.push({ position: [x, terrainHeight(x, z) + .115, z], scale: [.09 + (i % 2) * .017, .18, .09 + (i % 2) * .017], color: ['#ac704e', '#cc9870', '#ad7550'][i % 3] }))
    return out
  }, [])
  const soil = useMemo(() => pots.map(pot => ({ position: [pot.position[0], pot.position[1] + .065, pot.position[2]] as V3, scale: [pot.scale![0] * .81, .013, pot.scale![2] * .81] as V3, color: '#69533c' })), [pots])
  return <><Instanced geometry={potGeo} material={materials.terra} items={pots} /><Instanced geometry={sphereGeo} material={materials.darkWood} items={soil} castShadow={false} /><mesh geometry={boxGeo} position={[-.83, .69, -.9]} scale={[.24, .27, .22]} material={materials.wood} castShadow /></>
}
export function FishingVillage({ materials }: { materials: Materials }) {
  return <group>{HOUSES.map((spec, i) => <StoneHouse key={i} spec={spec} materials={materials} />)}<StoneSteps materials={materials} /><VillageProps materials={materials} /></group>
}
