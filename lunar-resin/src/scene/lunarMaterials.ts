import * as THREE from 'three'
import { noise, random } from './procedural'

function dataMap(data: Uint8Array, size: number, color = false) {
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
  texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.magFilter = THREE.LinearFilter; texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.generateMipmaps = true; texture.anisotropy = 8; texture.needsUpdate = true
  return texture
}

export function lunarTextureSet() {
  const size = 1024, rng = random(671), height = new Float32Array(size * size)
  const albedo = new Uint8Array(size * size * 4), normals = new Uint8Array(size * size * 4), roughness = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x, u = x / size, v = y / size, grain = rng() - .5
    const broad = noise(u * 12, v * 12), fine = noise(u * 43, v * 41)
    height[i] = .5 + broad * .16 + fine * .047 + grain * .022
    const value = 206 + broad * 13 + fine * 6 + grain * 17, fleck = rng() > .9985 ? .73 : 1
    albedo[i * 4] = value * fleck; albedo[i * 4 + 1] = (value + 1) * fleck; albedo[i * 4 + 2] = (value + 2) * fleck; albedo[i * 4 + 3] = 255
    const rough = THREE.MathUtils.clamp(220 + fine * 17 + grain * 22, 185, 250)
    roughness.set([rough, rough, rough, 255], i * 4)
  }
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const sample = (px: number, py: number) => height[((py + size) % size) * size + (px + size) % size]
    const dx = (sample(x - 1, y) - sample(x + 1, y)) * 3.4, dy = (sample(x, y - 1) - sample(x, y + 1)) * 3.4, length = Math.hypot(dx, dy, 1)
    normals.set([(dx / length * .5 + .5) * 255, (dy / length * .5 + .5) * 255, (1 / length * .5 + .5) * 255, 255], (y * size + x) * 4)
  }
  return { albedo: dataMap(albedo, size, true), normal: dataMap(normals, size), roughness: dataMap(roughness, size) }
}

export function paintedMetalTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1024
  const ctx = canvas.getContext('2d')!, rng = random(718)
  ctx.fillStyle = '#faf9f5'; ctx.fillRect(0, 0, 1024, 1024)
  for (let i = 0; i < 19000; i++) { ctx.fillStyle = `rgba(86,78,63,${rng() * .035})`; const s = .3 + rng() * 1.4; ctx.fillRect(rng() * 1024, rng() * 1024, s, s) }
  for (let i = 0; i < 190; i++) {
    const x = rng() * 1024, y = rng() * 1024
    ctx.strokeStyle = `rgba(87,82,72,${.03 + rng() * .055})`; ctx.lineWidth = .4 + rng() * .7
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + rng() * 21, y + rng() * 3); ctx.stroke()
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.anisotropy = 8
  return texture
}

export function missionMarkingTexture() {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#52636a'; ctx.textAlign = 'center'; ctx.font = '600 58px monospace'; ctx.fillText('LUNA / 03', 256, 65)
  ctx.font = '17px monospace'; ctx.fillText('LUNAR SURVEY · FIELD MODULE', 256, 100)
  ctx.fillStyle = '#bf8549'; ctx.fillRect(55, 112, 402, 3)
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8
  return texture
}
