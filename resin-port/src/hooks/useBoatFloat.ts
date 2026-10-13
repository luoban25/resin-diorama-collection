import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { BOAT_POSITION, type SceneSettings } from '../config'
import type { WaterSimulation } from './useWaterSimulation'
import type { MotionState } from './useDioramaMotion'

export function useBoatFloat(simulation: WaterSimulation, motion: React.RefObject<MotionState>, settings: SceneSettings, paused: boolean, reset: number) {
  const group = useRef<THREE.Group>(null!)
  const state = useRef({ y: 0, vy: 0, rx: 0, vx: 0, rz: 0, vz: 0 })
  const lastReset = useRef(reset)
  useFrame((_, delta) => {
    if (lastReset.current !== reset) { Object.assign(state.current, { y: 0, vy: 0, rx: 0, vx: 0, rz: 0, vz: 0 }); group.current.position.set(...BOAT_POSITION); group.current.rotation.set(0, 0, 0); lastReset.current = reset }
    if (paused) return
    const s = state.current, sample = simulation.boatSample.current, m = motion.current, dt = Math.min(delta, .033), t = simulation.time.current.time
    const lagHeight = ((m.waterTilt.x - m.tilt.x) * -BOAT_POSITION[2] - (m.waterTilt.y - m.tilt.y) * BOAT_POSITION[0]) * .35
    const ty = THREE.MathUtils.clamp((sample.height * settings.waveHeight + lagHeight) * settings.boatFloat, -.28, .28)
    const tx = THREE.MathUtils.clamp(sample.slopeZ * 3.8 + (m.waterTilt.x - m.tilt.x) * .75, -.075, .075) * settings.boatFloat
    const tz = THREE.MathUtils.clamp(-sample.slopeX * 3.8 + (m.waterTilt.y - m.tilt.y) * .75, -.085, .085) * settings.boatFloat
    s.vy += ((ty - s.y) * 18 - s.vy * settings.boatDamping) * dt; s.y += s.vy * dt
    s.vx += ((tx - s.rx) * 9 - s.vx * settings.boatDamping) * dt; s.rx += s.vx * dt
    s.vz += ((tz - s.rz) * 9 - s.vz * settings.boatDamping) * dt; s.rz += s.vz * dt
    group.current.position.y = BOAT_POSITION[1] + s.y
    group.current.rotation.x = s.rx; group.current.rotation.z = s.rz
    group.current.rotation.y = Math.sin(t * .4) * .002 * settings.boatFloat
  }, -5)
  return group
}
