import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

void i18n.use(initReactI18next).init({
  lng: 'zh-CN',
  fallbackLng: 'zh-CN',
  initImmediate: false,
  interpolation: {
    escapeValue: false,
  },
  resources: {
    'zh-CN': {
      translation: {
        brand: 'My Geo',
        eyebrow: '你的世界探索基地',
        title: '转动地球，发现每一片土地',
        titleLineOne: '转动地球，',
        titleLineTwo: '发现每一片土地',
        description:
          '从国家、首都与国旗开始，在一颗可以触摸的星球上认识我们的世界。',
        status: '195 个国家可探索',
        dragHint: '拖动旋转 · 滚轮缩放 · 方向键探索',
        rotateOn: '自动旋转：开',
        rotateOff: '自动旋转：关',
        qualityBalanced: '画质：平衡',
        qualityLow: '画质：节能',
        reset: '重置视角',
        reducedMotion: '已遵循系统的减少动态效果设置',
      },
    },
  },
})

export default i18n
