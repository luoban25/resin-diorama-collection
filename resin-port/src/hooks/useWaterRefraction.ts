import { useFrame, useThree } from '@react-three/fiber'
import { useFBO } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'

export function useWaterRefraction(resolution: number) {
  const { size } = useThree()
  const target = useFBO(resolution, Math.max(128, Math.round(resolution * size.height / size.width)), { type: THREE.HalfFloatType, depthBuffer: true, samples: 0 })
  const excluded = useMemo(() => [] as { object: THREE.Object3D; visible: boolean }[], [])
  useFrame(({ gl, scene, camera }) => {
    const previous = gl.getRenderTarget(), autoClear = gl.autoClear, xr = gl.xr.enabled, tone = gl.toneMapping, shadowUpdate = gl.shadowMap.autoUpdate
    excluded.length = 0
    scene.traverse(object => { if (object.userData.waterCapture) { excluded.push({ object, visible: object.visible }); object.visible = false } })
    gl.xr.enabled = false; gl.autoClear = true; gl.toneMapping = THREE.NoToneMapping; gl.shadowMap.autoUpdate = false
    gl.setRenderTarget(target); gl.render(scene, camera)
    excluded.forEach(({ object, visible }) => { object.visible = visible })
    gl.setRenderTarget(previous); gl.autoClear = autoClear; gl.xr.enabled = xr; gl.toneMapping = tone; gl.shadowMap.autoUpdate = shadowUpdate
  }, -.5)
  return target.texture
}
