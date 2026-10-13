import { useMemo } from 'react'
import * as THREE from 'three'
import { boxGeo, cylinderGeo, sphereGeo, type Instance } from './procedural'
import { Instanced } from './Instanced'
import type { Materials } from './materials'
import { Railings, Container, beamBetween } from './PortPrimitives'

export function PortQuay({ materials }: { materials: Materials }) {
  const parts = useMemo(() => {
    const blocks: Instance[] = [], piles: Instance[] = [], marks: Instance[] = [], cleats: Instance[] = [], bolts: Instance[] = []
    for (let i = 0; i < 24; i++) {
      const x = -3.44 + i * .3
      blocks.push({ position: [x, .035, .16], scale: [.29, .48, .28], color: i % 3 ? '#ccd1cb' : '#dfe2d9' })
      for (let j = 0; j < 11; j++) marks.push({ position: [x, .468, -3.43 + j * .32], scale: [.006, .001, .316], color: '#8c9694' })
    }
    for (const x of [-3.05, -1.5, .05, 1.6, 3.08]) {
      for (const z of [-3.18, -.08]) piles.push({ position: [x, -.6, z], scale: [.16, 2.14, .16], color: '#b9c3b7' })
      cleats.push({ position: [x, .57, -.04], scale: [.11, .24, .11], color: '#454d4f' })
      for (const dx of [-.07, .07]) bolts.push({ position: [x + dx, .47, .04], scale: [.018, .007, .018] })
    }
    for (const x of [-1.05, .08, 1.12, 2.25]) marks.push({ position: [x, .473, -1.72], scale: [.025, .003, 3.42], color: '#efbd40' })
    for (const z of [-3.16, -.29]) marks.push({ position: [.48, .474, z], scale: [4.55, .003, .026], color: '#efbd40' })
    return { blocks, piles, marks, cleats, bolts }
  }, [])
  return <group>
    <mesh geometry={boxGeo} position={[0, .325, -1.71]} scale={[7.25, .29, 3.72]} material={materials.concrete} castShadow receiveShadow />
    <Instanced geometry={boxGeo} material={materials.concrete} items={parts.blocks} />
    <Instanced geometry={cylinderGeo} material={materials.concrete} items={parts.piles} />
    <Instanced geometry={boxGeo} material={materials.paintedSteel} items={parts.marks} castShadow={false} />
    <Instanced geometry={cylinderGeo} material={materials.metal} items={parts.cleats} />
    <Instanced geometry={sphereGeo} material={materials.metal} items={parts.bolts} castShadow={false} />
    <Railings points={[[-3.57, .473, -.04], [-3.57, .473, -3.51], [3.56, .473, -3.51], [3.56, .473, -.02]]} materials={materials} />
    <Railings points={[[-3.5, .473, -.02], [-1.8, .473, -.02]]} materials={materials} />
    <Railings points={[[.6, .473, -.02], [3.5, .473, -.02]]} materials={materials} />
    {[-3.05, -1.5, .05, 1.6, 3.08].map(x => <group key={x} position={[x, .1, .34]}><mesh material={materials.rubber} castShadow><torusGeometry args={[.145, .042, 10, 24]} /></mesh><mesh geometry={boxGeo} position={[0, -.36, -.03]} scale={[.23, .62, .08]} material={materials.rubber} /></group>)}
    <Warehouse materials={materials} />
    <Container position={[-.49, .478, -1.37]} color="#cf4434" materials={materials} />
    <Container position={[-.49, .919, -1.37]} color="#e85b44" materials={materials} />
    <Container position={[.49, .478, -1.28]} color="#2f7eab" materials={materials} />
    <Container position={[.41, .478, -2.68]} color="#d8dfdc" materials={materials} />
    <Floodlight position={[-2.8, .47, -3.1]} materials={materials} />
    <Floodlight position={[3.13, .47, -1.45]} materials={materials} />
  </group>
}
function Warehouse({ materials }: { materials: Materials }) {
  const frames = useMemo(() => {
    const items: Instance[] = []
    for (let i = 0; i < 5; i++) items.push({ position: [-.54 + i * .27, .44, .616], scale: [.028, .67, .036], color: '#838d8c' })
    for (const y of [.16, .75]) items.push({ position: [0, y, .616], scale: [1.18, .03, .036], color: '#8c9694' })
    for (let i = 0; i < 5; i++) items.push({ position: [.671, .6, -.4 + i * .19], scale: [.016, .22, .028], color: '#87928e' })
    return items
  }, [])
  return <group position={[-2.66, .47, -2.22]}>
    <mesh geometry={boxGeo} position={[0, .46, 0]} scale={[1.33, .91, 1.24]} material={materials.concrete} castShadow receiveShadow />
    <mesh geometry={boxGeo} position={[0, .947, 0]} scale={[1.45, .1, 1.34]} material={materials.white} castShadow />
    <mesh geometry={boxGeo} position={[0, .44, .622]} scale={[1.16, .57, .013]} material={materials.litWindow} />
    <mesh geometry={boxGeo} position={[-.48, .29, .638]} scale={[.2, .52, .022]} material={materials.metal} />
    <mesh geometry={boxGeo} position={[.675, .6, -.05]} scale={[.013, .22, .9]} material={materials.litWindow} />
    <Instanced geometry={boxGeo} material={materials.metal} items={frames} />
    <mesh geometry={boxGeo} position={[.12, 1.09, -.17]} scale={[.39, .23, .3]} material={materials.metal} castShadow />
    {Array.from({ length: 8 }, (_, i) => <mesh key={i} geometry={boxGeo} position={[.12, 1.09, -.009 + i * .003]} scale={[.3, .013, .004]} material={materials.rubber} />)}
    <Railings points={[[-.69, .995, .62], [-.69, .995, -.62], [.69, .995, -.62], [.69, .995, .62], [-.69, .995, .62]]} height={.22} materials={materials} />
    <mesh geometry={boxGeo} position={[-.56, .045, .83]} scale={[.29, .08, .35]} material={materials.concrete} receiveShadow />
  </group>
}
function Floodlight({ position, materials }: { position: [number, number, number]; materials: Materials }) {
  const supports = useMemo(() => [beamBetween([0, 0, 0], [0, 1.73, 0], .041, '#727c7e'), beamBetween([-.18, 1.74, 0], [.18, 1.74, 0], .026)], [])
  return <group position={position}>
    <Instanced geometry={cylinderGeo} material={materials.metal} items={supports} />
    <mesh geometry={boxGeo} position={[0, .035, 0]} scale={[.19, .07, .19]} material={materials.metal} />
    <mesh geometry={boxGeo} position={[0, 1.74, 0]} scale={[.36, .35, .045]} material={materials.metal} />
    {[-.09, .09].flatMap(x => [-.09, .09].map(y => <mesh key={`${x}${y}`} geometry={boxGeo} position={[x, 1.74 + y, .032]} scale={[.14, .14, .022]} material={materials.lamp} />))}
  </group>
}
