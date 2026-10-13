import { Component, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { Leva } from 'leva'
import * as THREE from 'three'
import { useSceneControls } from './config'
import { useAdaptiveQuality } from './hooks/useAdaptiveQuality'
import { Experience } from './Experience'

function Icon({ name }: { name: 'waves' | 'sliders' | 'pause' | 'play' | 'reset' | 'expand' | 'arrow' | 'close' }) {
  const paths = {
    waves: <><path d="M3 7c2-3 4 3 6 0s4 3 6 0 4 3 6 0M3 12c2-3 4 3 6 0s4 3 6 0 4 3 6 0M3 17c2-3 4 3 6 0s4 3 6 0 4 3 6 0" /></>,
    sliders: <><path d="M4 6h6m4 0h6M4 12h10m4 0h2M4 18h2m4 0h10" /><circle cx="12" cy="6" r="2" /><circle cx="16" cy="12" r="2" /><circle cx="8" cy="18" r="2" /></>,
    pause: <><path d="M9 5v14M15 5v14" /></>, play: <path d="m9 5 10 7-10 7Z" />,
    reset: <><path d="M5 8a8 8 0 1 1-1 7M5 3v5H1" /></>,
    expand: <><path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5" /></>,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />, close: <path d="m6 6 12 12M6 18 18 6" />,
  }
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
class SceneBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false }
  static getDerivedStateFromError() { return { error: true } }
  render() { return this.state.error ? <div className="scene-error"><p>港口暂时未能打开</p><span>请使用支持 WebGL 2 的浏览器。</span><button onClick={() => location.reload()}>重新加载</button></div> : this.props.children }
}
export default function App() {
  const settings = useSceneControls(), { level, quality, lower } = useAdaptiveQuality()
  const [paused, setPaused] = useState(false), [panel, setPanel] = useState(false), [reset, setReset] = useState(0), [ready, setReady] = useState(false), [immersive, setImmersive] = useState(false), [hidden, setHidden] = useState(document.hidden || !document.hasFocus())
  const onReady = useCallback(() => setReady(true), [])
  useEffect(() => {
    const handler = () => setHidden(document.hidden || !document.hasFocus())
    document.addEventListener('visibilitychange', handler); window.addEventListener('focus', handler); window.addEventListener('blur', handler)
    return () => { document.removeEventListener('visibilitychange', handler); window.removeEventListener('focus', handler); window.removeEventListener('blur', handler) }
  }, [])
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setPanel(false); setImmersive(false); document.querySelector<HTMLButtonElement>('button[aria-controls="leva__root"]')?.focus(); return }
      const target = e.target as HTMLElement
      if (target.closest('input,textarea,select') || target.isContentEditable) return
      if (e.code === 'Space' && !target.closest('button')) { e.preventDefault(); setPaused(p => !p) }
      if (e.key.toLowerCase() === 'r') setReset(r => r + 1)
    }
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler)
  }, [])
  return <main className={immersive ? 'app immersive' : 'app'} aria-busy={!ready} data-active={!hidden}>
    <div className="scene" role="img" onPointerEnter={() => { if (!document.hidden) setHidden(false) }} onPointerLeave={() => setHidden(document.hidden || !document.hasFocus())} aria-label="可拖拽旋转的透明树脂港口微缩模型：红白岸桥、集装箱、码头与红色货轮。移动鼠标起浪，拖拽旋转，滚轮缩放。">
      <SceneBoundary><Canvas orthographic shadows dpr={Math.min(devicePixelRatio, quality.dpr)} camera={{ near: .1, far: 100, position: [-11, 12.1, 11] }} gl={{ antialias: level !== 'low', alpha: false, powerPreference: 'high-performance' }} onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.02; gl.setClearColor('#acd5e9') }} frameloop={hidden ? 'demand' : 'always'}>
        <color attach="background" args={['#acd5e9']} />
        <Suspense fallback={null}><Experience settings={settings} level={level} lower={lower} paused={paused} reset={reset} onReady={onReady} active={!hidden} /></Suspense>
      </Canvas></SceneBoundary>
    </div>
    <header className="topbar ui" inert={immersive}>
      <a className="wordmark" href="#" aria-label="泊岸，回到港口" onClick={e => { e.preventDefault(); setReset(r => r + 1) }}><span className="brand-icon"><Icon name="waves" /></span><span>STILL<span className="brand-divider">/</span>微缩实验室</span></a>
      <div className="edition"><span className="status-dot" /><span>程序化港口</span><span className="edition-number">N° 002</span></div>
    </header>
    <section className="intro ui" aria-labelledby="title"><div className="eyebrow"><span>THE QUIET COLLECTION</span><span className="eyebrow-line" /></div><h1 id="title">泊岸<span>港口，正在呼吸。</span></h1><p className="location"><span>港口 · 树脂微缩</span><span className="location-line" />CONTAINER TERMINAL / 02</p></section>
    <aside className="specimen ui"><span className="specimen-line" /><span className="tiny-label">A WORLD HELD IN WATER</span><p>岸桥的尺度，<br />海水的呼吸。</p><span className="specimen-caption">程序化生成 · 树脂收藏系列</span></aside>
    <div className="bottom-left ui"><span className="serif-name">Port Azure</span><p>轻触水面，让时间泛起涟漪。</p><span className="interaction-hint"><span className="hint-circle" />移动起浪 · 拖拽旋转</span></div>
    <div className="tools" aria-label="场景控制">
      <span className="tools-caption">左键旋转 · 右键平移 · 滚轮缩放</span>
      <div className="toolbar">
        <button aria-label={paused ? '继续场景动画' : '暂停场景动画'} title={paused ? '继续 · 空格' : '暂停 · 空格'} onClick={() => setPaused(p => !p)} aria-pressed={paused}><Icon name={paused ? 'play' : 'pause'} /></button>
        <button aria-label="重置水面、惯性与等距视角" title="等距复位 · R" onClick={() => setReset(r => r + 1)}><Icon name="reset" /></button>
        <span className="toolbar-divider" />
        <button className={panel ? 'active' : ''} aria-label={panel ? '关闭参数面板' : '打开参数面板'} aria-expanded={panel} aria-controls="leva__root" title="调校港口" onClick={() => setPanel(p => !p)}><Icon name="sliders" /><span>调校</span></button>
        <button aria-label={immersive ? '退出沉浸模式' : '进入沉浸模式'} aria-pressed={immersive} title="沉浸模式" onClick={() => { setImmersive(v => !v); setPanel(false) }}><Icon name={immersive ? 'close' : 'expand'} /></button>
      </div>
    </div>
    <footer className="footer ui"><span>CRAFTED IN CODE. KEPT IN STILLNESS.</span><span>{level === 'high' ? '精细画质' : level === 'medium' ? '均衡画质' : '轻量画质'}<span className="footer-dot">·</span>ISOMETRIC STUDY 002</span></footer>
    {!ready && <div className="loading" role="status"><span className="loading-symbol"><Icon name="waves" /></span><p>正在安放一座港口</p><span>正在搭建码头与岸桥</span></div>}
    <Leva hidden={!panel} collapsed={false} titleBar={{ title: '调校港口', filter: false }} theme={{ colors: { elevation1: '#f1eee6', elevation2: '#faf7f0', elevation3: '#e5e4d9', accent1: '#4b7872', accent2: '#397168', accent3: '#315e57', highlight1: '#92948a', highlight2: '#535c51', highlight3: '#293c34' }, sizes: { rootWidth: '300px', controlWidth: '125px' }, radii: { lg: '14px', xs: '4px', sm: '5px' }, fonts: { mono: 'ui-monospace, SFMono-Regular, monospace', sans: 'system-ui, sans-serif' } }} />
  </main>
}
