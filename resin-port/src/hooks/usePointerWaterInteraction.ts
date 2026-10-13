import { useMemo, useRef } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { WATER_SIZE, type SceneSettings } from '../config'

export type WaterImpulse = { x: number; y: number; strength: number; radius: number }
export function usePointerWaterInteraction(settings: SceneSettings, addImpulse: (i: WaterImpulse) => void, paused: boolean) {
  const last = useRef({ x: 0, y: 0, time: 0 })
  const down = useRef<{ x: number; y: number } | null>(null)
  const local = useMemo(() => new THREE.Vector3(), [])
  function interact(e: ThreeEvent<PointerEvent>, click = false) {
    e.stopPropagation()
    if (paused) return
    local.copy(e.point); e.object.worldToLocal(local)
    const x = local.x / WATER_SIZE + .5, y = local.y / WATER_SIZE + .5, now = performance.now()
    const dt = Math.max(16, now - last.current.time), dist = Math.hypot(x - last.current.x, y - last.current.y)
    if (!click && now - last.current.time < 18) return
    const speed = last.current.time && dt < 150 ? Math.min(dist / dt * 180, 1.5) : .15
    addImpulse({ x, y, strength: settings.rippleStrength * (click ? .12 : .012 + speed * .032), radius: click ? .035 : .023 })
    last.current = { x, y, time: now }
  }
  return {
    onPointerMove: (e: ThreeEvent<PointerEvent>) => interact(e),
    onPointerDown: (e: ThreeEvent<PointerEvent>) => { if (e.button === 0) down.current = { x: e.clientX, y: e.clientY } },
    onPointerUp: (e: ThreeEvent<PointerEvent>) => {
      const start = down.current; down.current = null
      if (e.button === 0 && start && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 5) interact(e, true)
    },
    onPointerOut: () => { last.current.time = 0; down.current = null },
  }
}
