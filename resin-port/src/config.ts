import { folder, useControls } from 'leva'

export function useSceneControls() {
  return useControls({
    '海水与树脂': folder({
      shallowColor: { value: '#4fdadd', label: '浅水色' },
      deepColor: { value: '#087f9b', label: '深水色' },
      absorptionColor: { value: '#36b9ce', label: '树脂吸收色' },
      ior: { value: 1.34, min: 1.1, max: 1.6, step: .01, label: '树脂 IOR' },
      thickness: { value: 1.1, min: .2, max: 2.5, step: .05, label: '折射厚度' },
    }),
    '水面模拟': folder({
      waveHeight: { value: 2.4, min: 0, max: 4, step: .01, label: '波浪高度' },
      wind: { value: 1, min: 0, max: 2, step: .01, label: '自然风浪' },
      rippleStrength: { value: 2.6, min: 0, max: 6, step: .01, label: '鼠标涟漪' },
      waterDamping: { value: .995, min: .95, max: .999, step: .001, label: '水面阻尼' },
      propagation: { value: .24, min: .05, max: .45, step: .01, label: '传播速度' },
      caustics: { value: .48, min: 0, max: 1.5, step: .01, label: '焦散强度' },
      foam: { value: .5, min: 0, max: 1, step: .01, label: '岸边泡沫' },
    }, { collapsed: true }),
    '生命与惯性': folder({
      boatFloat: { value: .8, min: 0, max: 2.5, step: .01, label: '船体浮动' },
      boatDamping: { value: 6.1, min: 2, max: 12, step: .1, label: '船体阻尼' },
      sway: { value: .045, min: 0, max: .18, step: .001, label: '整体晃动' },
      stiffness: { value: 20, min: 10, max: 70, step: 1, label: '弹簧软硬' },
      damping: { value: 5.8, min: 3, max: 20, step: .1, label: '弹簧阻尼' },
      vegetation: { value: 1, min: .3, max: 1.5, step: .1, label: '植被密度' },
    }, { collapsed: true }),
    '摄影': folder({
      sunAngle: { value: 125, min: 0, max: 360, step: 1, label: '太阳角度' },
      sunIntensity: { value: 3, min: 0, max: 6, step: .1, label: '太阳强度' },
      cameraZoom: { value: 1, min: .75, max: 1.5, step: .01, label: '相机缩放' },
      dof: { value: .22, min: 0, max: 1, step: .01, label: 'DOF 强度' },
      bloom: { value: .12, min: 0, max: .6, step: .01, label: 'Bloom 强度' },
      ao: { value: .65, min: 0, max: 2, step: .01, label: 'AO 强度' },
    }, { collapsed: true }),
  })
}
export type SceneSettings = ReturnType<typeof useSceneControls>
export const WATER_SIZE = 7.6
export const WATER_DEPTH = 1.65
export const BOAT_POSITION: [number, number, number] = [.05, .06, 1.9]

export type QualityLevel = 'high' | 'medium' | 'low'
export const QUALITY = {
  high: { fbo: 192, segments: 160, transmission: 768, samples: 4, shadow: 2048, vegetation: 1, causticDetail: 3, dpr: 1.5, post: true },
  medium: { fbo: 128, segments: 112, transmission: 512, samples: 2, shadow: 1024, vegetation: .7, causticDetail: 2, dpr: 1.1, post: true },
  low: { fbo: 64, segments: 64, transmission: 320, samples: 1, shadow: 512, vegetation: .45, causticDetail: 1, dpr: .85, post: false },
} as const
