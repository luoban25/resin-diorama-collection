import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WATER_SIZE, type SceneSettings } from '../config'

export type MotionState = { tilt: THREE.Vector2; waterTilt: THREE.Vector2; velocity: THREE.Vector2 }
export type CameraInteraction = { cameraDragging: boolean; waterDrag: THREE.Vector2 }
export function useDioramaMotion(settings: SceneSettings, paused: boolean, reset: number, interaction: React.RefObject<CameraInteraction>) {
  const group = useRef<THREE.Group>(null!)
  const motion = useRef<MotionState>({ tilt: new THREE.Vector2(), waterTilt: new THREE.Vector2(), velocity: new THREE.Vector2() })
  const lastReset = useRef(reset)
  const corner = useRef(new THREE.Vector3())
  useFrame(({ pointer }, delta) => {
    const m = motion.current, dt = Math.min(delta, .033)
    if (lastReset.current !== reset) { m.tilt.set(0, 0); m.waterTilt.set(0, 0); m.velocity.set(0, 0); group.current.rotation.set(0, 0, 0); group.current.position.set(0, 0, 0); lastReset.current = reset }
    if (paused) return
    const strength = matchMedia('(prefers-reduced-motion: reduce)').matches ? settings.sway * .2 : settings.sway
    const tx = interaction.current.cameraDragging ? 0 : pointer.y * strength * .55, tz = interaction.current.cameraDragging ? 0 : -pointer.x * strength
    m.velocity.x += ((tx - m.tilt.x) * settings.stiffness - m.velocity.x * settings.damping) * dt
    m.velocity.y += ((tz - m.tilt.y) * settings.stiffness - m.velocity.y * settings.damping) * dt
    m.tilt.addScaledVector(m.velocity, dt)
    m.waterTilt.lerp(m.tilt, 1 - Math.exp(-dt * 3.5))
    group.current.rotation.x = m.tilt.x; group.current.rotation.z = m.tilt.y
    group.current.position.x = -m.tilt.y * .35
    // Keep one bottom corner in contact with the photography table while tilting.
    let lowest = Infinity
    for (const x of [-1, 1]) for (const z of [-1, 1]) { corner.current.set(x * WATER_SIZE / 2, -1.73, z * WATER_SIZE / 2).applyEuler(group.current.rotation); lowest = Math.min(lowest, corner.current.y) }
    group.current.position.y = Math.max(0, -1.78 - lowest)
  }, -30)
  return { group, motion }
}
