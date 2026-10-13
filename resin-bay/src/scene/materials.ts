import * as THREE from 'three'
import { makeTexture } from './procedural'

export function createMaterials() {
  const stone = makeTexture('stone'), plaster = makeTexture('plaster'), wood = makeTexture('wood'), sand = makeTexture('sand'), roof = makeTexture('roof'), rock = makeTexture('rock')
  return {
    stone: new THREE.MeshStandardMaterial({ color: '#ede0c7', map: stone, bumpMap: stone, bumpScale: .032, roughnessMap: stone, roughness: 1 }),
    rock: new THREE.MeshStandardMaterial({ color: '#e5dfd1', map: rock, bumpMap: rock, bumpScale: .065, roughnessMap: rock, roughness: 1 }),
    plaster: new THREE.MeshStandardMaterial({ color: '#fff3db', map: plaster, bumpMap: plaster, bumpScale: .022, roughnessMap: plaster, roughness: .97 }),
    wood: new THREE.MeshStandardMaterial({ color: '#fff4df', map: wood, bumpMap: wood, bumpScale: .024, roughnessMap: wood, roughness: 1 }),
    darkWood: new THREE.MeshStandardMaterial({ color: '#7c7762', map: wood, bumpMap: wood, bumpScale: .025, roughness: .9 }),
    roof: new THREE.MeshStandardMaterial({ color: '#ffefe0', map: roof, bumpMap: roof, bumpScale: .018, roughnessMap: roof, roughness: 1, side: THREE.DoubleSide }),
    sand: new THREE.MeshStandardMaterial({ color: '#fff4d5', map: sand, bumpMap: sand, bumpScale: .02, roughness: .93 }),
    teal: new THREE.MeshStandardMaterial({ color: '#366b68', roughness: .8 }),
    blue: new THREE.MeshStandardMaterial({ color: '#376e83', roughness: .58 }),
    white: new THREE.MeshStandardMaterial({ color: '#f6f1e4', roughness: .52 }),
    hull: new THREE.MeshStandardMaterial({ color: '#f6f2e5', roughness: .35, metalness: .03 }),
    glass: new THREE.MeshStandardMaterial({ color: '#668486', roughness: .22, metalness: .35 }),
    metal: new THREE.MeshStandardMaterial({ color: '#555954', roughness: .48, metalness: .65 }),
    rubber: new THREE.MeshStandardMaterial({ color: '#2c3331', roughness: .95 }),
    rope: new THREE.MeshStandardMaterial({ color: '#b59f72', roughness: 1 }),
    terra: new THREE.MeshStandardMaterial({ color: '#ae6346', roughness: .85 }),
    leaf: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .93 }),
  }
}
export type Materials = ReturnType<typeof createMaterials>
