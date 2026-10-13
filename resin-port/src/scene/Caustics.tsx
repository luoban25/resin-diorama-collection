import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Materials } from './materials'
import type { WaterSimulation } from '../hooks/useWaterSimulation'
import type { SceneSettings } from '../config'

const causticShader = `
varying vec3 vCausticWorld;
uniform sampler2D uCausticWater;
uniform mat4 uDioramaInverse;
uniform float uCausticTime,uCausticStrength,uCausticDetail;
uniform vec2 uCausticTexel,uCausticSun;
float cHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float cCells(vec2 p){vec2 i=floor(p),f=fract(p);float d1=10.,d2=10.;for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 g=vec2(float(x),float(y));vec2 o=vec2(cHash(i+g),cHash(i+g+17.));o=.5+.32*sin(o*6.283+uCausticTime*.23);vec2 r=g+o-f;float d=dot(r,r);if(d<d1){d2=d1;d1=d;}else if(d<d2){d2=d;}}return 1.-smoothstep(.01,.105,d2-d1);}
float getCaustics(vec3 world){
 vec3 local=(uDioramaInverse*vec4(world,1.)).xyz;
 vec2 uv=vec2(local.x,-local.z)/7.6+.5;
 float h=texture2D(uCausticWater,uv).r;
 float dx=texture2D(uCausticWater,uv+vec2(uCausticTexel.x,0.)).r-texture2D(uCausticWater,uv-vec2(uCausticTexel.x,0.)).r;
 float dz=texture2D(uCausticWater,uv+vec2(0.,uCausticTexel.y)).r-texture2D(uCausticWater,uv-vec2(0.,uCausticTexel.y)).r;
 vec2 projection=world.xz+uCausticSun*world.y*.16+vec2(dx,dz)*12.;
 float ca=cCells(projection*5.8+vec2(uCausticTime*.025,-uCausticTime*.018)+h*5.);
 if(uCausticDetail>1.5)ca+=.35*cCells(projection*9.2-vec2(uCausticTime*.013,uCausticTime*.02));
 return ca*uCausticStrength*(1.-smoothstep(-.1,.13,local.y))*(.5+.5*exp(local.y*.28));
}`
export function Caustics({ materials, simulation, settings, detail, diorama }: { materials: Materials; simulation: WaterSimulation; settings: SceneSettings; detail: number; diorama: React.RefObject<THREE.Group> }) {
  const uniforms = useMemo(() => ({ uCausticWater: { value: simulation.texture.current }, uCausticTime: { value: 0 }, uCausticStrength: { value: settings.caustics }, uCausticDetail: { value: detail }, uCausticTexel: { value: new THREE.Vector2(1 / simulation.resolution, 1 / simulation.resolution) }, uCausticSun: { value: new THREE.Vector2() }, uDioramaInverse: { value: new THREE.Matrix4() } }), [])
  useEffect(() => {
    const targets = [materials.sand, materials.rock, materials.stone, materials.darkWood, materials.concrete]
    targets.forEach(m => {
      m.onBeforeCompile = shader => {
        Object.assign(shader.uniforms, uniforms)
        shader.vertexShader = 'varying vec3 vCausticWorld;\n' + shader.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
          vec4 cWorld=vec4(transformed,1.);
          #ifdef USE_INSTANCING
          cWorld=instanceMatrix*cWorld;
          #endif
          vCausticWorld=(modelMatrix*cWorld).xyz;`)
        shader.fragmentShader = causticShader + '\n' + shader.fragmentShader.replace('#include <opaque_fragment>', `
          float caustic=getCaustics(vCausticWorld);
          float localDepth=(uDioramaInverse*vec4(vCausticWorld,1.)).y;
          float below=1.-smoothstep(-1.4,.05,localDepth);
          outgoingLight=mix(outgoingLight,outgoingLight*vec3(.35,.88,1.02),below*.5);
          outgoingLight+=vec3(.44,.65,.48)*caustic;
          #include <opaque_fragment>`)
      }
      m.customProgramCacheKey = () => 'bay-caustics-v2'; m.needsUpdate = true
    })
    return () => { targets.forEach(m => { m.onBeforeCompile = () => {}; m.needsUpdate = true }) }
  }, [materials, uniforms])
  useFrame(() => {
    if (diorama.current) { diorama.current.updateWorldMatrix(true, false); uniforms.uDioramaInverse.value.copy(diorama.current.matrixWorld).invert() }
    uniforms.uCausticWater.value = simulation.texture.current; uniforms.uCausticTime.value = simulation.time.current.time
    uniforms.uCausticStrength.value = settings.caustics; uniforms.uCausticDetail.value = detail
    uniforms.uCausticTexel.value.set(1 / simulation.resolution, 1 / simulation.resolution)
    const angle = settings.sunAngle * Math.PI / 180; uniforms.uCausticSun.value.set(Math.cos(angle), Math.sin(angle))
  }, -20)
  return null
}
