import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useFBO } from '@react-three/drei'
import * as THREE from 'three'
import { BOAT_POSITION, WATER_SIZE, type SceneSettings } from '../config'
import type { WaterImpulse } from './usePointerWaterInteraction'
import type { CameraInteraction } from './useDioramaMotion'

const quadVertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`
const simulationFragment = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uState;
uniform vec2 uTexel;
uniform vec2 uDrag;
uniform float uDamping,uSpeed,uWind,uTime,uImpulseCount,uInitialize;
uniform vec4 uImpulses[8];
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
void main(){
 if(uInitialize>.5){gl_FragColor=vec4(0.);return;}
 vec2 p=(vUv-.5)*7.6;
 float shore=-p.y-(.2);
 if(shore<-.09){gl_FragColor=vec4(0.);return;}
 vec2 hv=texture2D(uState,vUv).rg;
 float l=texture2D(uState,vUv-vec2(uTexel.x,0.)).r;
 float r=texture2D(uState,vUv+vec2(uTexel.x,0.)).r;
 float b=texture2D(uState,vUv-vec2(0.,uTexel.y)).r;
 float t=texture2D(uState,vUv+vec2(0.,uTexel.y)).r;
 float lap=l+r+b+t-4.*hv.x;
 float velocity=(hv.y+lap*uSpeed)*uDamping;
 for(int i=0;i<8;i++){if(float(i)<uImpulseCount){vec4 impulse=uImpulses[i];float d=length(vUv-impulse.xy);float r2=impulse.w*impulse.w;float pulse=exp(-d*d/r2)-.25*exp(-d*d/(4.*r2));velocity+=impulse.z*pulse*.16;}}
 // Wind is a small stochastic forcing of the solver, not a replacement wave animation.
 float wind=(noise(vUv*34.+vec2(uTime*.25,uTime*.1))-.5)*.000027*uWind;
 velocity+=wind;
 // Signed lateral pressure from camera dragging. Momentum decays after release.
 velocity+=dot(uDrag,vUv-.5)*.00019;
 float edge=smoothstep(0.,.028,min(min(vUv.x,1.-vUv.x),min(vUv.y,1.-vUv.y)));
 velocity*=mix(.76,1.,edge)*mix(.92,1.,smoothstep(0.,.16,shore));
 float h=clamp(hv.x+velocity,-.16,.16);
 // Remove the tiny residual mean near absorbing boundaries; saturated cells cannot accumulate pressure.
 if(abs(h)>=.159&&h*velocity>0.)velocity*=.45;
 h*=.9998;
 gl_FragColor=vec4(h,velocity,lap,1.);
}`
const probeFragment = `varying vec2 vUv; uniform sampler2D uState;uniform vec2 uProbe,uTexel;void main(){float h=texture2D(uState,uProbe).r;float dx=texture2D(uState,uProbe+vec2(uTexel.x*3.,0.)).r-texture2D(uState,uProbe-vec2(uTexel.x*3.,0.)).r;float dy=texture2D(uState,uProbe+vec2(0.,uTexel.y*3.)).r-texture2D(uState,uProbe-vec2(0.,uTexel.y*3.)).r;gl_FragColor=vec4(h*4.+128./255.,dx*12.+128./255.,dy*12.+128./255.,1.);}`

export type WaterSimulation = ReturnType<typeof useWaterSimulation>
export function useWaterSimulation(resolution: number, settings: SceneSettings, paused: boolean, reset: number, interaction: React.RefObject<CameraInteraction>) {
  const { gl } = useThree()
  const a = useFBO(resolution, resolution, { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, stencilBuffer: false })
  const b = useFBO(resolution, resolution, { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, stencilBuffer: false })
  const probe = useFBO(1, 1, { type: THREE.UnsignedByteType, depthBuffer: false, stencilBuffer: false })
  const texture = useRef<THREE.Texture>(a.texture)
  const boatSample = useRef({ height: 0, slopeX: 0, slopeZ: 0 })
  const queue = useRef<WaterImpulse[]>([]), impulseTotal = useRef(0)
  const probeRevision = useRef(0)
  const dragMomentum = useRef(new THREE.Vector2())
  const state = useRef({ read: a, write: b, accumulator: 0, initialized: false, reset, time: 0, probeTime: 0, probePending: false })
  const addImpulse = useCallback((i: WaterImpulse) => { if (queue.current.length < 24) { queue.current.push(i); impulseTotal.current++ } }, [])
  const resources = useMemo(() => {
    const material = new THREE.ShaderMaterial({ vertexShader: quadVertex, fragmentShader: simulationFragment, uniforms: {
      uState: { value: a.texture }, uTexel: { value: new THREE.Vector2(1 / resolution, 1 / resolution) },
      uDamping: { value: .988 }, uSpeed: { value: .24 }, uWind: { value: .2 }, uTime: { value: 0 },
      uInitialize: { value: 1 }, uImpulseCount: { value: 0 }, uImpulses: { value: Array.from({ length: 8 }, () => new THREE.Vector4()) },
      uDrag: { value: new THREE.Vector2() },
    }, depthTest: false, depthWrite: false, toneMapped: false })
    const probeMaterial = new THREE.ShaderMaterial({ vertexShader: quadVertex, fragmentShader: probeFragment, uniforms: {
      uState: { value: a.texture }, uTexel: { value: new THREE.Vector2(1 / resolution, 1 / resolution) },
      uProbe: { value: new THREE.Vector2(BOAT_POSITION[0] / WATER_SIZE + .5, .5 - BOAT_POSITION[2] / WATER_SIZE) },
    }, depthTest: false, depthWrite: false, toneMapped: false })
    const scene = new THREE.Scene(), geometry = new THREE.PlaneGeometry(2, 2), quad = new THREE.Mesh(geometry, material)
    quad.frustumCulled = false; scene.add(quad)
    return { scene, geometry, quad, material, probeMaterial, camera: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), pixels: new Uint8Array(4), clearColor: new THREE.Color() }
  }, [a, resolution])
  useEffect(() => {
    state.current.read = a; state.current.write = b; state.current.initialized = false
    return () => { probeRevision.current++; resources.geometry.dispose(); resources.material.dispose(); resources.probeMaterial.dispose() }
  }, [a, b, resources])
  useFrame((_, delta) => {
    const s = state.current, u = resources.material.uniforms
    const target = gl.getRenderTarget(), autoClear = gl.autoClear, xr = gl.xr.enabled
    gl.xr.enabled = false; gl.autoClear = true
    resources.quad.material = resources.material
    if (!s.initialized || s.reset !== reset) {
      probeRevision.current++
      gl.getClearColor(resources.clearColor); const clearAlpha = gl.getClearAlpha()
      gl.setClearColor(0x000000, 0)
      gl.setRenderTarget(a); gl.clear(true, false, false)
      gl.setRenderTarget(b); gl.clear(true, false, false)
      gl.setClearColor(resources.clearColor, clearAlpha)
      resources.probeMaterial.uniforms.uState.value = a.texture
      resources.quad.material = resources.probeMaterial
      gl.setRenderTarget(probe); gl.render(resources.scene, resources.camera)
      gl.readRenderTargetPixels(probe, 0, 0, 1, 1, resources.pixels)
      const main = document.querySelector('main'); if (main) { main.dataset.waterInitial = [...resources.pixels].join(','); main.dataset.waterProbe = [...resources.pixels].join(','); main.dataset.waterHeight = '0.00000'; main.dataset.simulationTime = '0.00'; main.dataset.dragWave = '0.0000' }
      resources.quad.material = resources.material
      u.uInitialize.value = 0; s.initialized = true; s.reset = reset; queue.current.length = 0; s.accumulator = 0; s.time = 0; s.probeTime = 0
      boatSample.current = { height: 0, slopeX: 0, slopeZ: 0 }
      dragMomentum.current.set(0, 0); interaction.current.waterDrag.set(0, 0)
    }
    if (!paused) {
      s.accumulator += Math.min(delta, .05); s.time += Math.min(delta, .05)
      dragMomentum.current.multiplyScalar(Math.exp(-Math.min(delta, .05) * 5.5)).addScaledVector(interaction.current.waterDrag, 1.8)
      dragMomentum.current.clampLength(0, 1.2); interaction.current.waterDrag.set(0, 0)
      u.uDrag.value.copy(dragMomentum.current).multiplyScalar(settings.rippleStrength)
      u.uDamping.value = settings.waterDamping; u.uSpeed.value = settings.propagation * (resolution / 192) ** 2; u.uWind.value = settings.wind
      let steps = 0
      while (s.accumulator >= 1 / 120 && steps < 6) {
        u.uTime.value = s.time; u.uState.value = s.read.texture
        const count = Math.min(8, queue.current.length); u.uImpulseCount.value = count
        for (let i = 0; i < count; i++) { const impulse = queue.current.shift()!; u.uImpulses.value[i].set(impulse.x, impulse.y, impulse.strength, impulse.radius) }
        gl.setRenderTarget(s.write); gl.render(resources.scene, resources.camera)
        const temp = s.read; s.read = s.write; s.write = temp
        s.accumulator -= 1 / 120; steps++
      }
      texture.current = s.read.texture
      s.probeTime += delta
      if (s.probeTime > 1 / 15 && !s.probePending) {
        s.probeTime = 0; s.probePending = true
        const revision = probeRevision.current
        resources.probeMaterial.uniforms.uState.value = s.read.texture; resources.quad.material = resources.probeMaterial
        gl.setRenderTarget(probe); gl.render(resources.scene, resources.camera)
        // Only one GPU sample is read asynchronously, 15 times/sec. No CPU water vertices.
        gl.readRenderTargetPixelsAsync(probe, 0, 0, 1, 1, resources.pixels).then(() => {
          if (revision !== probeRevision.current) return
          boatSample.current.height = (resources.pixels[0] - 128) / 1020
          boatSample.current.slopeX = (resources.pixels[1] - 128) / 3060
          boatSample.current.slopeZ = (resources.pixels[2] - 128) / 3060
          const main = document.querySelector('main')
          if (main) { main.dataset.waterHeight = boatSample.current.height.toFixed(5); main.dataset.waterImpulses = String(impulseTotal.current); main.dataset.simulationTime = s.time.toFixed(2); main.dataset.waterProbe = [...resources.pixels].join(','); main.dataset.dragWave = dragMomentum.current.length().toFixed(4) }
        }).catch(() => {}).finally(() => { s.probePending = false })
      }
    } else { interaction.current.waterDrag.set(0, 0) }
    gl.setRenderTarget(target); gl.autoClear = autoClear; gl.xr.enabled = xr
  }, -50)
  return { texture, boatSample, addImpulse, resolution, time: state }
}
