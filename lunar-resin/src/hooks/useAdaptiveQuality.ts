import { useCallback, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { QUALITY, type QualityLevel } from '../config'

export function initialQuality(): QualityLevel {
  return (navigator.hardwareConcurrency ?? 8) <= 4 ? 'medium' : 'high'
}
export function useAdaptiveQuality() {
  const [level, setLevel] = useState<QualityLevel>(initialQuality)
  const lower = useCallback(() => setLevel(l => l === 'high' ? 'medium' : 'low'), [])
  return { level, quality: QUALITY[level], lower }
}
export function QualityMonitor({ level, lower, paused, active }: { level: QualityLevel; lower: () => void; paused: boolean; active: boolean }) {
  const { gl, setDpr } = useThree()
  const stats = useRef({ time: 0, frames: 0, start: performance.now(), windows: 0 })
  useFrame((_, delta) => {
    const main = document.querySelector('main'), focused = document.hasFocus()
    if (main) main.dataset.focused = String(focused)
    if (!active || document.hidden || !focused || delta > .25) { stats.current.time = 0; stats.current.frames = 0; stats.current.windows = 0; stats.current.start = performance.now(); return }
    if (paused || document.hidden || performance.now() - stats.current.start < 4500) return
    const s = stats.current; s.time += delta; s.frames++
    if (s.time >= 3) {
      const fps = s.frames / s.time
      if (fps < 48) s.windows++; else s.windows = 0
      if (s.windows >= 2 && level !== 'low') { lower(); s.windows = 0; s.start = performance.now() }
      if (main) { main.dataset.fps = String(Math.round(fps)); main.dataset.quality = level; main.dataset.calls = String(gl.info.render.calls); main.dataset.triangles = String(gl.info.render.triangles); const context = gl.getContext(), debug = context.getExtension('WEBGL_debug_renderer_info'); if (debug) main.dataset.renderer = context.getParameter(debug.UNMASKED_RENDERER_WEBGL) }
      s.time = 0; s.frames = 0
    }
  })
  useFrame(() => { const desired = Math.min(window.devicePixelRatio, QUALITY[level].dpr); if (gl.getPixelRatio() !== desired) setDpr(desired) }, -100)
  return null
}
