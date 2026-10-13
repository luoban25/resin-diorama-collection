import * as THREE from 'three'
import { lunarTextureSet, missionMarkingTexture, paintedMetalTexture } from './lunarMaterials'
export function createMaterials() {
  const texture = lunarTextureSet(), paint = paintedMetalTexture()
  return {
    lunar: new THREE.MeshStandardMaterial({ color: '#cbd0d2', map: texture.albedo, normalMap: texture.normal, normalScale: new THREE.Vector2(.55, .55), roughnessMap: texture.roughness, roughness: 1 }),
    section: new THREE.MeshStandardMaterial({ color: '#fffaf1', map: texture.albedo, normalMap: texture.normal, normalScale: new THREE.Vector2(.8, .8), roughnessMap: texture.roughness, roughness: 1, vertexColors: true }),
    fossil: new THREE.MeshStandardMaterial({ color: '#d7c7a8', map: texture.albedo, normalMap: texture.normal, normalScale: new THREE.Vector2(.2, .2), roughness: .88 }),
    fossilSocket: new THREE.MeshStandardMaterial({ color: '#61584b', roughness: 1 }),
    tracks: new THREE.MeshStandardMaterial({ color: '#858b91', transparent: true, opacity: .24, roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
    marking: new THREE.MeshStandardMaterial({ map: missionMarkingTexture(), transparent: true, roughness: .8, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
    white: new THREE.MeshStandardMaterial({ color: '#edf0ed', map: paint, bumpMap: paint, bumpScale: .0014, roughness: .64, metalness: .12 }),
    metal: new THREE.MeshStandardMaterial({ color: '#747f88', roughness: .53, metalness: .58 }),
    rubber: new THREE.MeshStandardMaterial({ color: '#303740', roughness: .96 }),
    deck: new THREE.MeshStandardMaterial({ color: '#b7bec5', roughness: .83 }),
    orange: new THREE.MeshStandardMaterial({ color: '#d98b4a', roughness: .54 }),
    lamp: new THREE.MeshStandardMaterial({ color: '#fff6db', emissive: '#ffce85', emissiveIntensity: 3.1, toneMapped: false }),
    habitatGlass: new THREE.MeshPhysicalMaterial({ color: '#dae3de', roughness: .12, metalness: .08, transparent: true, opacity: .24, emissive: '#ffb36a', emissiveIntensity: .12, side: THREE.DoubleSide }),
    roverGlass: new THREE.MeshStandardMaterial({ color: '#507287', roughness: .21, metalness: .35 }),
    interior: new THREE.MeshStandardMaterial({ color: '#c19a66', roughness: .66, emissive: '#ba742e', emissiveIntensity: .2 }),
    habitatShell: new THREE.MeshStandardMaterial({ color: '#ecebe4', map: paint, bumpMap: paint, bumpScale: .0012, roughness: .6, metalness: .18, flatShading: true }),
  }
}
export type Materials = ReturnType<typeof createMaterials>
