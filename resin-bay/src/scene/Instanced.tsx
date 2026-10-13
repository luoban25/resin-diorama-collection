import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import type { Instance } from './procedural'

export function Instanced({ geometry, material, items, castShadow = true, receiveShadow = true }: { geometry: THREE.BufferGeometry; material: THREE.Material; items: Instance[]; castShadow?: boolean; receiveShadow?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null!)
  useLayoutEffect(() => {
    const o = new THREE.Object3D(), c = new THREE.Color()
    items.forEach((item, i) => {
      o.position.set(...item.position); o.rotation.set(...(item.rotation ?? [0, 0, 0])); o.scale.set(...(item.scale ?? [1, 1, 1])); o.updateMatrix()
      ref.current.setMatrixAt(i, o.matrix); ref.current.setColorAt(i, c.set(item.color ?? '#ffffff'))
    })
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [items, geometry, material])
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} castShadow={castShadow} receiveShadow={receiveShadow} />
}
