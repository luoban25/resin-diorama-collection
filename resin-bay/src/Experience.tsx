import { useEffect, useMemo, useRef } from 'react'
import { Vector2 } from 'three'
import type { SceneSettings, QualityLevel } from './config'
import { QUALITY } from './config'
import { useWaterSimulation } from './hooks/useWaterSimulation'
import { useWaterRefraction } from './hooks/useWaterRefraction'
import { useDioramaMotion } from './hooks/useDioramaMotion'
import { QualityMonitor } from './hooks/useAdaptiveQuality'
import { CameraRig } from './scene/CameraRig'
import { ResinWaterBlock } from './scene/ResinWaterBlock'
import { CoastalTerrain } from './scene/CoastalTerrain'
import { FishingVillage } from './scene/FishingVillage'
import { WoodenPier } from './scene/WoodenPier'
import { FishingBoat } from './scene/FishingBoat'
import { Vegetation } from './scene/Vegetation'
import { LightingRig } from './scene/LightingRig'
import { PostEffects } from './scene/PostEffects'
import { createMaterials } from './scene/materials'
import { Caustics } from './scene/Caustics'

export function Experience({ settings, level, lower, paused, reset, onReady, active }: { settings: SceneSettings; level: QualityLevel; lower: () => void; paused: boolean; reset: number; onReady: () => void; active: boolean }) {
  const materials = useMemo(createMaterials, [])
  const interaction = useRef({ cameraDragging: false, waterDrag: new Vector2() })
  const simulation = useWaterSimulation(QUALITY[level].fbo, settings, paused, reset, interaction)
  const { group, motion } = useDioramaMotion(settings, paused, reset, interaction)
  const capture = useWaterRefraction(QUALITY[level].transmission)
  useEffect(() => { onReady() }, [onReady])
  useEffect(() => () => { const textures = new Set(); Object.values(materials).forEach(m => { if (m.map) textures.add(m.map); m.dispose() }); textures.forEach(t => (t as { dispose: () => void }).dispose()) }, [materials])
  return <>
    <CameraRig zoom={settings.cameraZoom} reset={reset} interaction={interaction} /><QualityMonitor level={level} lower={lower} paused={paused} active={active} />
    <Caustics materials={materials} simulation={simulation} settings={settings} detail={QUALITY[level].causticDetail} diorama={group} />
    <group ref={group}>
      <ResinWaterBlock settings={settings} level={level} simulation={simulation} motion={motion} materials={materials} paused={paused} capture={capture} />
      <CoastalTerrain materials={materials} /><FishingVillage materials={materials} />
      <WoodenPier materials={materials} simulation={simulation} paused={paused} />
      <FishingBoat materials={materials} simulation={simulation} motion={motion} settings={settings} paused={paused} reset={reset} />
      <Vegetation materials={materials} level={level} settings={settings} simulation={simulation} paused={paused} />
    </group>
    <LightingRig settings={settings} level={level} /><PostEffects settings={settings} level={level} />
  </>
}
