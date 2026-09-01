import type { CountrySignatureItem } from '../src/data/countrySchema'
import { landmarks } from '../src/data/landmarks'

const reviewedExtras: Record<string, CountrySignatureItem[]> = {
  AU: [
    {
      kind: 'nature',
      title: '袋鼠',
      description: '袋鼠是澳大利亚最具代表性的有袋类动物之一。',
      sourceIds: ['britannica-australia'],
    },
    {
      kind: 'nature',
      title: '考拉',
      description: '考拉主要栖息在澳大利亚东部和东南部的桉树林。',
      sourceIds: ['britannica-australia'],
    },
    {
      kind: 'nature',
      title: '鸭嘴兽',
      description: '鸭嘴兽是澳大利亚特有的卵生哺乳动物。',
      sourceIds: ['britannica-australia'],
    },
    {
      kind: 'nature',
      title: '大堡礁',
      description: '大堡礁由数千个珊瑚礁和岛屿组成。',
      sourceIds: ['unesco-great-barrier-reef'],
    },
  ],
  BR: [
    {
      kind: 'nature',
      title: '亚马孙雨林',
      description: '巴西境内分布着亚马孙雨林的大部分区域。',
      sourceIds: ['britannica-brazil'],
    },
    {
      kind: 'geography',
      title: '亚马孙河',
      description: '亚马孙河流域拥有世界上水量最大的河流系统。',
      sourceIds: ['britannica-brazil'],
    },
  ],
  CN: [
    {
      kind: 'nature',
      title: '大熊猫',
      description: '大熊猫主要生活在四川、陕西和甘肃的山地森林中。',
      sourceIds: ['wwf-giant-panda'],
    },
    {
      kind: 'geography',
      title: '珠穆朗玛峰',
      description: '珠穆朗玛峰位于中国与尼泊尔边界，是世界海拔最高峰。',
      sourceIds: ['britannica-china'],
    },
  ],
  EG: [
    {
      kind: 'geography',
      title: '尼罗河',
      description: '尼罗河为埃及河谷的城市和农田提供重要水源。',
      sourceIds: ['britannica-egypt'],
    },
    {
      kind: 'engineering',
      title: '苏伊士运河',
      description: '苏伊士运河连接地中海与红海，是重要的国际航道。',
      sourceIds: ['britannica-egypt'],
    },
  ],
  ID: [
    {
      kind: 'nature',
      title: '科莫多巨蜥',
      description: '科莫多巨蜥自然分布在印度尼西亚的小巽他群岛。',
      sourceIds: ['britannica-indonesia'],
    },
  ],
  IN: [
    {
      kind: 'geography',
      title: '恒河',
      description: '恒河流域孕育了印度北部众多城市和农业区。',
      sourceIds: ['britannica-india'],
    },
  ],
  JP: [
    {
      kind: 'nature',
      title: '富士山',
      description: '富士山是一座活火山，也是日本最高峰。',
      sourceIds: ['britannica-japan'],
    },
    {
      kind: 'nature',
      title: '樱花',
      description: '樱花是日本广为人知的季节性文化象征。',
      sourceIds: ['britannica-japan'],
    },
  ],
  MX: [
    {
      kind: 'product',
      title: '玉米',
      description: '墨西哥是玉米早期驯化和传播的重要地区。',
      sourceIds: ['britannica-mexico'],
    },
  ],
  RU: [
    {
      kind: 'nature',
      title: '贝加尔湖',
      description: '贝加尔湖是世界最深的淡水湖。',
      sourceIds: ['britannica-russia'],
    },
    {
      kind: 'nature',
      title: '西伯利亚森林',
      description: '西伯利亚拥有广阔的北方针叶林。',
      sourceIds: ['britannica-russia'],
    },
  ],
  US: [
    {
      kind: 'nature',
      title: '黄石国家公园',
      description: '黄石国家公园建立于1872年，以地热景观和野生动物闻名。',
      sourceIds: ['nps-yellowstone'],
    },
  ],
  ZA: [
    {
      kind: 'geography',
      title: '桌山',
      description: '桌山俯瞰开普敦，平坦山顶构成醒目的城市背景。',
      sourceIds: ['britannica-south-africa'],
    },
  ],
}

const landmarkSignatures = Map.groupBy(
  landmarks,
  (landmark) => landmark.countryCode,
)

export const reviewedCountrySignatures = Object.fromEntries(
  new Set([...Object.keys(reviewedExtras), ...landmarkSignatures.keys()])
    .values()
    .map((countryCode) => {
      const items = [
        ...(reviewedExtras[countryCode] ?? []),
        ...(landmarkSignatures.get(countryCode) ?? []).map(
          (landmark): CountrySignatureItem => ({
            kind: 'landmark',
            title: landmark.name.zh,
            description: landmark.summary,
            sourceIds: landmark.sourceIds,
          }),
        ),
      ]
      return [
        countryCode,
        items.filter(
          (item, index) =>
            items.findIndex((candidate) => candidate.title === item.title) ===
            index,
        ),
      ]
    }),
) satisfies Record<string, CountrySignatureItem[]>
