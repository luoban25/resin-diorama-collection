import { Component, Suspense, type ReactNode } from 'react'
import { ContactShadows, Environment } from '@react-three/drei'
import { QUALITY, type QualityLevel, type SceneSettings } from '../config'

class EnvironmentFallback extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? null : this.props.children }
}
export function LightingRig({ settings, level }: { settings: SceneSettings; level: QualityLevel }) {
  const angle = settings.sunAngle * Math.PI / 180
  return <>
    <ambientLight intensity={.28} color="#e1f3fc" />
    <hemisphereLight intensity={.5} color="#fff7eb" groundColor="#acd6e6" />
    <directionalLight position={[Math.cos(angle) * 7, 10, Math.sin(angle) * 7]} color="#fff0d5" intensity={settings.sunIntensity} castShadow shadow-mapSize={[QUALITY[level].shadow, QUALITY[level].shadow]} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} shadow-camera-near={.1} shadow-camera-far={30} shadow-bias={-.0005} shadow-normalBias={.024} shadow-radius={4} />
    <directionalLight position={[5, 3, 7]} intensity={.65} color="#def2ff" />
    <directionalLight position={[-4, 5, -6]} intensity={.6} color="#e7f7ff" />
    <EnvironmentFallback><Suspense fallback={null}><Environment preset="city" environmentIntensity={.55} /></Suspense></EnvironmentFallback>
    <ContactShadows position={[0, -1.79, 0]} opacity={.46} scale={16} blur={2.1} far={6} resolution={level === 'high' ? 512 : 256} frames={1} color="#6c6254" />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.81, 0]}>
      <planeGeometry args={[200, 200]} /><meshBasicMaterial color="#acd5e9" />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.805, 0]} receiveShadow>
      <planeGeometry args={[30, 30]} /><shadowMaterial color="#716655" opacity={.11} />
    </mesh>
  </>
}
