import { Bloom, DepthOfField, EffectComposer, SSAO, Vignette } from '@react-three/postprocessing'
import type { QualityLevel, SceneSettings } from '../config'

export function PostEffects({ settings, level }: { settings: SceneSettings; level: QualityLevel }) {
  if (level === 'low') return null
  return <EffectComposer multisampling={level === 'high' ? 4 : 2} enableNormalPass resolutionScale={level === 'high' ? 1 : .7}>
    <SSAO samples={level === 'high' ? 16 : 8} radius={.11} intensity={settings.ao} luminanceInfluence={.75} bias={.024} />
    <DepthOfField target={[0, .2, .4]} worldFocusRange={9} worldFocusDistance={19} focalLength={.015} bokehScale={settings.dof * 1.5} resolutionScale={.5} />
    <Bloom intensity={settings.bloom} luminanceThreshold={1.25} luminanceSmoothing={.3} mipmapBlur />
    <Vignette eskil={false} offset={.16} darkness={.12} />
  </EffectComposer>
}
