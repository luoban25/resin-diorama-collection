import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MeshTransmissionMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { QUALITY, WATER_SIZE, WATER_DEPTH, type QualityLevel, type SceneSettings } from '../config'
import type { WaterSimulation } from '../hooks/useWaterSimulation'
import type { MotionState } from '../hooks/useDioramaMotion'
import { usePointerWaterInteraction } from '../hooks/usePointerWaterInteraction'
import { Instanced } from './Instanced'
import { volumeGeometry, roundedShape, sandHeight, random, rockGeo, sphereGeo, underwaterRockInstances, makeWaterDepthTexture, type Instance } from './procedural'
import type { Materials } from './materials'

const waterVertex = `
uniform sampler2D uHeight;uniform float uWave;uniform vec2 uTexel,uLag;
varying vec2 vUv;varying vec3 vWorld,vNormal;varying float vHeight,vSlope;
float boundary(vec2 uv){vec2 p=(uv-.5)*7.6;float shore=-p.y-(.2);vec2 q=abs(p)-vec2(3.8-.46);float edge=.46-length(max(q,0.));return smoothstep(0.,.18,edge)*smoothstep(-.02,.2,shore);}
float heightAt(vec2 uv){vec2 p=(uv-.5)*7.6;return (texture2D(uHeight,uv).r*uWave+uLag.x*p.y-uLag.y*p.x)*boundary(uv);}
void main(){
 vUv=uv;float h=heightAt(uv);
 float hx=heightAt(uv+vec2(uTexel.x,0.))-heightAt(uv-vec2(uTexel.x,0.));
 float hy=heightAt(uv+vec2(0.,uTexel.y))-heightAt(uv-vec2(0.,uTexel.y));
 vec3 p=position;p.z+=h;
 vec3 n=normalize(vec3(-hx/(15.2*uTexel.x),-hy/(15.2*uTexel.y),1.));
 vNormal=normalize(mat3(modelMatrix)*n);vHeight=h;vSlope=length(vec2(hx,hy));
 vec4 world=modelMatrix*vec4(p,1.);vWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;
}`
const waterFragment = `
uniform vec3 uShallow,uDeep,uSun;uniform sampler2D uScene,uDepth;uniform vec2 uResolution;
uniform float uTime,uFoam,uDetail;uniform bool uHasScene,uHasEnv;
uniform sampler2D envMap;
#include <cube_uv_reflection_fragment>
varying vec2 vUv;varying vec3 vWorld,vNormal;varying float vHeight,vSlope;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
void main(){
 vec2 p=(vUv-.5)*7.6;
 // Clip the independent water plane to the same rounded footprint as the volume.
 vec2 q=abs(p)-vec2(3.8-.46);if(length(max(q,0.))>.46)discard;
 float coast=.2;
 float shoreline=(-p.y)-coast;
 if(shoreline<-.08)discard;
 float depth=clamp(texture2D(uDepth,vUv).r*2.+vHeight,.03,1.8);
 vec3 normal=normalize(vNormal);
 float micro=noise(p*48.+uTime*.11);
 normal.x+=(micro-noise((p+vec2(.015,0.))*48.+uTime*.11))*.035;
 normal.z+=(micro-noise((p+vec2(0.,.015))*48.+uTime*.11))*.035;
 normal=normalize(normal);
 vec3 viewDir=isOrthographic?normalize(vec3(viewMatrix[0][2],viewMatrix[1][2],viewMatrix[2][2])):normalize(cameraPosition-vWorld);
 float fresnel=.022+.978*pow(1.-max(dot(normal,viewDir),0.),5.);
 vec3 water=mix(uShallow,uDeep,1.-exp(-depth*.78));
 vec2 screenUv=gl_FragCoord.xy/uResolution;
 vec3 screenNormal=normalize(mat3(viewMatrix)*normal);
 vec3 refracted=texture2D(uScene,clamp(screenUv+screenNormal.xy*.012,vec2(.002),vec2(.998))).rgb;
 // The captured scene supplies real refraction of seabed, rocks and dock piles.
 if(uHasScene)water=mix(refracted*exp(-vec3(.62,.14,.015)*depth),water,.28);
 vec3 reflected=reflect(-viewDir,normal);
 vec3 sky=mix(vec3(.49,.72,.7),vec3(.98,.94,.83),smoothstep(-.1,.6,reflected.y));
 if(uHasEnv)sky=mix(sky,min(textureCubeUV(envMap,reflected,.08).rgb,vec3(3.)),.65);
 vec3 col=mix(water,sky,min(.58,fresnel));
 float sparkle=pow(max(dot(reflect(-normalize(uSun),normal),viewDir),0.),260.);
 col+=vec3(1.,.95,.77)*sparkle*1.3;
 float edge=max(1.-smoothstep(0.,.14,abs(shoreline)),1.-smoothstep(.035,.24,depth));
 float rippleNoise=noise(p*24.+uTime*.09);
 float foam=edge*smoothstep(.38,.78,rippleNoise+vSlope*12.)*uFoam;
 // Foam is confined to the hull's waterline, with broken crests driven by the height field.
 vec2 boat=vec2(p.x,-p.y)-vec2(.05,1.9);float bt=clamp((boat.x+3.075)/6.15,0.,1.);
 float bw=.71*(bt<.19?.03+.97*sin(bt/.19*1.5708):bt>.9?1.-(bt-.9)*1.6:1.);
 float hullDistance=max(abs(boat.y)-bw,abs(boat.x)-3.075);
 float hullFoam=1.-smoothstep(.015,.1,abs(hullDistance));
 foam+=hullFoam*smoothstep(.34,.73,noise(p*36.-uTime*.15)+vSlope*18.)*uFoam;
 if(uDetail>1.5)foam+=edge*.1*smoothstep(.5,.8,noise(p*73.-uTime*.18))*uFoam;
 col=mix(col,vec3(.94,.98,.87),foam);
 gl_FragColor=vec4(col,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`

export function WaterVolume({ settings, level, capture }: { settings: SceneSettings; level: QualityLevel; capture: THREE.Texture }) {
  const geometry = useMemo(() => {
    const g = volumeGeometry(WATER_SIZE, WATER_SIZE, WATER_DEPTH)
    const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv
    const positions: number[] = [], normals: number[] = [], uvs: number[] = []
    for (let i = 0; i < p.count; i += 3) {
      // The animated surface is the only top cap; troughs must remain visible.
      if (n.getY(i) > .995 && n.getY(i + 1) > .995 && n.getY(i + 2) > .995) continue
      for (let k = 0; k < 3; k++) { positions.push(p.getX(i + k), p.getY(i + k), p.getZ(i + k)); normals.push(n.getX(i + k), n.getY(i + k), n.getZ(i + k)); uvs.push(uv.getX(i + k), uv.getY(i + k)) }
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.clearGroups(); g.computeBoundingSphere()
    return g
  }, [])
  const q = QUALITY[level]
  return <mesh geometry={geometry} renderOrder={1} userData={{ waterCapture: true }}>
    <MeshTransmissionMaterial buffer={capture} transmission={1} thickness={settings.thickness} ior={settings.ior} attenuationColor={settings.absorptionColor} attenuationDistance={4.1} roughness={.022} backside={level !== 'low'} side={THREE.DoubleSide} backsideThickness={.18} samples={q.samples} resolution={q.transmission} backsideResolution={q.transmission / 2} chromaticAberration={0} anisotropicBlur={0} distortion={0} temporalDistortion={0} color="#e7fcf8" envMapIntensity={.35} clearcoat={.14} clearcoatRoughness={.12} />
  </mesh>
}
export function WaterSurface({ settings, level, simulation, motion, paused, capture }: { settings: SceneSettings; level: QualityLevel; simulation: WaterSimulation; motion: React.RefObject<MotionState>; paused: boolean; capture: THREE.Texture }) {
  const { gl, size, scene } = useThree()
  const ref = useRef<THREE.Mesh>(null!)
  const depthTexture = useMemo(makeWaterDepthTexture, [])
  useEffect(() => () => depthTexture.dispose(), [depthTexture])
  const envCapture = useRef<{ source: THREE.Texture | null; target: THREE.WebGLRenderTarget | null }>({ source: null, target: null })
  const pmrem = useMemo(() => new THREE.PMREMGenerator(gl), [gl])
  useEffect(() => () => { envCapture.current.target?.dispose(); pmrem.dispose() }, [pmrem])
  const interactions = usePointerWaterInteraction(settings, simulation.addImpulse, paused)
  const material = useMemo(() => new THREE.ShaderMaterial({ vertexShader: waterVertex, fragmentShader: waterFragment, transparent: false, depthWrite: true, defines: { ENVMAP_TYPE_CUBE_UV: '', CUBEUV_TEXEL_WIDTH: '0.00130208333', CUBEUV_TEXEL_HEIGHT: '0.0009765625', CUBEUV_MAX_MIP: '8.0' }, uniforms: {
    uHeight: { value: simulation.texture.current }, uDepth: { value: depthTexture }, uTexel: { value: new THREE.Vector2() }, uLag: { value: new THREE.Vector2() }, uWave: { value: .5 },
    uShallow: { value: new THREE.Color() }, uDeep: { value: new THREE.Color() }, uSun: { value: new THREE.Vector3() }, uTime: { value: 0 }, uFoam: { value: .5 }, uDetail: { value: 3 }, uScene: { value: null }, uHasScene: { value: false }, uResolution: { value: new THREE.Vector2() }, envMap: { value: null }, uHasEnv: { value: false },
  } }), [])
  useFrame(() => {
    const u = material.uniforms
    u.uHeight.value = simulation.texture.current; u.uTexel.value.set(1 / simulation.resolution, 1 / simulation.resolution)
    u.uLag.value.copy(motion.current.waterTilt).sub(motion.current.tilt).multiplyScalar(.35)
    u.uWave.value = settings.waveHeight; u.uTime.value = simulation.time.current.time
    u.uShallow.value.set(settings.shallowColor); u.uDeep.value.set(settings.deepColor); u.uFoam.value = settings.foam; u.uDetail.value = QUALITY[level].causticDetail
    const angle = settings.sunAngle * Math.PI / 180; u.uSun.value.set(Math.cos(angle) * 5, 8, Math.sin(angle) * 5)
    u.uResolution.value.set(size.width * gl.getPixelRatio(), size.height * gl.getPixelRatio())
    u.uScene.value = capture; u.uHasScene.value = true
    if (scene.environment && scene.environment !== envCapture.current.source) {
      envCapture.current.target?.dispose()
      const target = scene.environment.mapping === THREE.EquirectangularReflectionMapping ? pmrem.fromEquirectangular(scene.environment) : null
      envCapture.current = { source: scene.environment, target }
      const texture = target?.texture ?? scene.environment
      u.envMap.value = texture; u.uHasEnv.value = true
      const image = texture.image as { width: number; height: number }
      const mip = Math.log2(image.height) - 2
      material.defines.CUBEUV_TEXEL_WIDTH = String(1 / image.width)
      material.defines.CUBEUV_TEXEL_HEIGHT = String(1 / image.height)
      material.defines.CUBEUV_MAX_MIP = mip.toFixed(1); material.needsUpdate = true
    }
  }, -10)
  return <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, .026, 0]} material={material} renderOrder={2} userData={{ waterCapture: true }} {...interactions}>
    <planeGeometry args={[WATER_SIZE, WATER_SIZE, QUALITY[level].segments, QUALITY[level].segments]} />
  </mesh>
}
export function SeaFloor({ materials }: { materials: Materials }) {
  const geometry = useMemo(() => {
    const g = new THREE.ShapeGeometry(roundedShape(7.57, 7.57, .44), 30)
    // A subdivided plane is clipped by the rounded footprint for organic sand relief.
    const p = new THREE.PlaneGeometry(7.54, 7.54, 90, 90); p.rotateX(-Math.PI / 2)
    const pos = p.attributes.position, indices: number[] = []
    for (let i = 0; i < pos.count; i++) pos.setY(i, sandHeight(pos.getX(i), pos.getZ(i)))
    const ix = p.index!
    for (let i = 0; i < ix.count; i += 3) {
      let valid = true
      for (let k = 0; k < 3; k++) { const v = ix.getX(i + k), x = Math.max(0, Math.abs(pos.getX(v)) - 3.32), z = Math.max(0, Math.abs(pos.getZ(v)) - 3.32); if (Math.hypot(x, z) > .445) valid = false }
      if (valid) indices.push(ix.getX(i), ix.getX(i + 1), ix.getX(i + 2))
    }
    p.setIndex(indices); p.computeVertexNormals(); g.dispose(); return p
  }, [])
  const pebbles = useMemo(() => { const rng = random(530), out: Instance[] = []; for (let i = 0; i < 360; i++) { const x = (rng() - .5) * 7, z = (rng() - .5) * 7, s = .014 + rng() * .025; out.push({ position: [x, sandHeight(x, z) + .018, z], scale: [s, s * .55, s * .75], color: rng() > .5 ? '#d1c4a6' : '#a99f83' }) } return out }, [])
  return <><mesh geometry={geometry} material={materials.sand} receiveShadow /><Instanced geometry={sphereGeo} material={materials.sand} items={pebbles} castShadow={false} /></>
}
export function UnderwaterRocks({ materials }: { materials: Materials }) {
  return <Instanced geometry={rockGeo} material={materials.rock} items={underwaterRockInstances} />
}
export function ResinWaterBlock(props: { settings: SceneSettings; level: QualityLevel; simulation: WaterSimulation; motion: React.RefObject<MotionState>; materials: Materials; paused: boolean; capture: THREE.Texture }) {
  const base = useMemo(() => volumeGeometry(7.6, 7.6, .1, .46), [])
  return <group>
    <mesh geometry={base} position={[0, -1.63, 0]} material={props.materials.sand} receiveShadow />
    <SeaFloor materials={props.materials} /><UnderwaterRocks materials={props.materials} />
    <WaterVolume settings={props.settings} level={props.level} capture={props.capture} />
    <WaterSurface {...props} />
  </group>
}
