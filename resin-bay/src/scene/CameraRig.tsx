import { useLayoutEffect, useRef, type ComponentRef, type RefObject } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { CameraInteraction } from '../hooks/useDioramaMotion'

export function CameraRig({ zoom, reset, interaction }: { zoom: number; reset: number; interaction: RefObject<CameraInteraction> }) {
  const { camera, size } = useThree()
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)
  const previous = useRef({ initialized: false, azimuth: 0, polar: 0, target: new THREE.Vector3(), right: new THREE.Vector3(), up: new THREE.Vector3() })
  const baseZoom = Math.min(size.width / 12.4, size.height / 11.8) * zoom
  useLayoutEffect(() => {
    const cam = camera as THREE.OrthographicCamera
    previous.current.initialized = false; interaction.current.waterDrag.set(0, 0)
    cam.zoom = baseZoom
    cam.updateProjectionMatrix()
  }, [camera, baseZoom])
  useLayoutEffect(() => {
    const cam = camera as THREE.OrthographicCamera
    previous.current.initialized = false; interaction.current.waterDrag.set(0, 0)
    cam.position.set(11, 11.25, 11); cam.zoom = baseZoom; cam.lookAt(0, .25, 0)
    controls.current?.target.set(0, .25, 0); controls.current?.update()
    cam.updateProjectionMatrix(); interaction.current.cameraDragging = false
    recordView()
  }, [camera, reset])
  function recordView() {
    const main = document.querySelector('main')
    if (main) { main.dataset.camera = camera.position.toArray().map(v => v.toFixed(3)).join(','); main.dataset.cameraZoom = (camera as THREE.OrthographicCamera).zoom.toFixed(2) }
  }
  function driveWater() {
    const ctrl = controls.current
    if (!ctrl) return
    const p = previous.current, azimuth = ctrl.getAzimuthalAngle(), polar = ctrl.getPolarAngle()
    if (p.initialized) {
      const da = Math.atan2(Math.sin(azimuth - p.azimuth), Math.cos(azimuth - p.azimuth)), dp = polar - p.polar
      camera.updateMatrixWorld(); p.right.setFromMatrixColumn(camera.matrixWorld, 0); p.up.setFromMatrixColumn(camera.matrixWorld, 1)
      interaction.current.waterDrag.x += -da * p.right.x + dp * p.up.x + (ctrl.target.x - p.target.x) * .12
      interaction.current.waterDrag.y += da * p.right.z - dp * p.up.z - (ctrl.target.z - p.target.z) * .12
    }
    p.initialized = true; p.azimuth = azimuth; p.polar = polar; p.target.copy(ctrl.target)
    recordView()
  }
  return <OrbitControls key={reset} ref={controls} makeDefault enableDamping dampingFactor={.085} rotateSpeed={.75} zoomSpeed={.8} panSpeed={.65} screenSpacePanning minPolarAngle={.42} maxPolarAngle={1.38} minZoom={baseZoom * .65} maxZoom={baseZoom * 1.75} target={[0, .25, 0]} onChange={driveWater} onStart={() => { interaction.current.cameraDragging = true; document.querySelector('main')?.setAttribute('data-dragging', 'true') }} onEnd={() => { interaction.current.cameraDragging = false; document.querySelector('main')?.setAttribute('data-dragging', 'false'); recordView() }} />
}
