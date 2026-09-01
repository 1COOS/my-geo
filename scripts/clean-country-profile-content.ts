import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import prettier from 'prettier'

import type {
  CountryDemographicItem,
  CountryProfile,
} from '../src/data/countrySchema'
import resourceSourceJson from './country-resource-source.json'

import {
  buildCountryResourceProfile,
  type CountryResourceSource,
} from './country-resource-content'
import { assertCountryProfileContentQuality } from './country-profile-quality'
import { reviewedCountrySignatures } from './reviewed-country-signatures'

type LegacyProfileContent = Record<string, CountryProfile>
type ReviewedPeopleProfile = Partial<
  Pick<CountryProfile['people'], 'ethnicGroups' | 'religions'>
>

const projectRoot = path.resolve(import.meta.dirname, '..')
const profilePath = path.join(
  projectRoot,
  'scripts/country-profile-content.json',
)

const exactTextReplacements: Record<string, string> = {
  '什叶派10-': '什叶派',
  '俄罗斯东正教15-': '俄罗斯东正教',
  '穆斯林10-': '伊斯兰教',
  穆斯林: '伊斯兰教',
  '穆斯林(官方)': '伊斯兰教',
  '穆斯林(官方)95-': '伊斯兰教',
  '希腊东正教81-': '希腊东正教',
  '阿拉伯75-': '阿拉伯人',
  '库尔德15-': '库尔德人',
  '逊尼派29-': '逊尼派',
  小规模生产砖: '制砖',
  '旅游业(特别是滑雪)': '滑雪旅游',
  强奸种子: '油菜籽',
  '黄瓜/草皮': '黄瓜',
  '羊肉/羊肉': '羊肉',
  平原: '大蕉',
  巴铁: '重晶石',
  陶瓦什: '钾盐',
  旅游服务与相关产业: '旅游业',
  阿联酋: '阿联酋人',
  南亚: '南亚裔',
  亚洲: '亚裔',
  欧洲: '欧洲裔',
  非洲: '非洲裔',
  服装和服装: '服装',
  织布和织布: '纺织',
  有色和有色金属: '有色金属',
  露特矿和铝土开采: '金红石与铝土矿开采',
  生产煤炭: '煤炭开采',
  铬生产国: '铬矿开采',
  '芒果/瓜': '芒果',
  '辣椒/菠萝': '辣椒',
  '南瓜/扁豆': '南瓜',
  工业和宝石钻石: '钻石',
  陶瓷: '钾盐',
  相关和非相关天然气: '天然气',
  煤炭和许多战略矿物: '煤炭',
  '羊肉/马铃薯': '羊肉',
  耶和华见证会: '耶和华见证人',
  耶和华见证会教: '耶和华见证人',
  耶和华见证会和耶稣基督会: '耶和华见证人',
  什叶派穆斯林少数: '什叶派',
  少数基督教: '基督教',
  '乌克兰东正教-莫斯科总教区': '乌克兰东正教',
  撒哈拉以南非洲毛里塔尼亚人: '非洲裔毛里塔尼亚人',
  亚美尼亚使徒: '亚美尼亚使徒教会',
  基督徒: '基督教',
  犹太人: '犹太教',
  犹太族: '犹太教',
  福音派基督徒: '福音派',
  新使徒: '新使徒教会',
  德鲁兹人: '德鲁兹教',
  什叶语: '什叶派',
  动画家: '泛灵信仰',
}

const rejectedTextPattern =
  /其他|未知|未说明|估计|几乎|所有|无宗教|无附属|无隶属|小规模|低于|不足|至少|包含|包括/
const rejectedGenericItemPattern =
  /^(?:轻消费品|服务业|本地农业|本地产业|自然与文化旅游|海滨与文化旅游|海岛与文化旅游|山地与文化旅游)$/
const latinTextPattern = /[A-Za-z]{2,}/
const rejectedDemographicPattern =
  /^(?:无|没有|没有宗教|非信徒|民族宗教主义者|拒绝回答|无回应|不适用|宗派)$|动画家|动画主义|无神论|不可知论|不信教|不到|未具体说明|未表示|未指明|未归属|无关|宗教构成数据有限|信仰者但不属于|主要为|主要是|^以.*为主$|其中多数|少数民族|少数|比例|群体非常小|有一个|以及|来自世界各地|等国国籍|出生的|祖先|合同劳工|人口$|^南部的/

const reviewedPeopleProfiles: Partial<Record<string, ReviewedPeopleProfile>> = {
  DZ: {
    ethnicGroups: [{ name: '阿拉伯人' }, { name: '阿马齐格人' }],
    religions: [{ name: '伊斯兰教' }],
  },
  GN: {
    religions: [{ name: '伊斯兰教' }, { name: '基督教' }],
  },
  ML: {
    religions: [{ name: '伊斯兰教' }, { name: '基督教' }],
  },
}

const profiles = JSON.parse(
  await readFile(profilePath, 'utf8'),
) as LegacyProfileContent
const resourceSources = resourceSourceJson.countries as Record<
  string,
  CountryResourceSource
>

const cleanedProfiles = Object.fromEntries(
  Object.entries(profiles).map(([countryCode, profile]) => [
    countryCode,
    cleanProfile(countryCode, profile),
  ]),
)

assertCountryProfileContentQuality(cleanedProfiles, 'cleaned profile')

await writeFile(
  profilePath,
  await prettier.format(JSON.stringify(cleanedProfiles), { parser: 'json' }),
)

console.log(
  `Cleaned ${Object.keys(cleanedProfiles).length} country profiles with ${Object.keys(reviewedCountrySignatures).length} reviewed signature countries.`,
)

function cleanProfile(countryCode: string, profile: CountryProfile) {
  const reviewedPeople = reviewedPeopleProfiles[countryCode]
  const ethnicGroups =
    reviewedPeople?.ethnicGroups ??
    cleanDemographicItems(profile.people.ethnicGroups, false)
  const religions =
    reviewedPeople?.religions ??
    cleanDemographicItems(profile.people.religions, true)
  const resourceSource = resourceSources[countryCode]
  if (!resourceSource)
    throw new Error(`Missing resource source for ${countryCode}`)
  const resources = buildCountryResourceProfile(
    resourceSource,
    resourceSourceJson.sourceId,
  )
  const agriculture = cleanItemList(profile.economy.agriculture)
  const industry = cleanItemList(profile.economy.industry)
  const tourism = cleanItemList(profile.economy.tourism)
  const signature = reviewedCountrySignatures[countryCode]

  return {
    resources,
    people: {
      ...(ethnicGroups.length > 0 || religions.length > 0
        ? { summary: summarizePeople(ethnicGroups, religions) }
        : {}),
      keywords: [
        ...ethnicGroups.slice(0, 2).map((item) => item.name),
        ...religions.slice(0, 1).map((item) => item.name),
      ],
      ethnicGroups,
      religions,
      sourceIds: profile.people.sourceIds,
    },
    economy: {
      ...(agriculture.length > 0 || industry.length > 0 || tourism.length > 0
        ? { summary: summarizeEconomy(agriculture, industry, tourism) }
        : {}),
      keywords: [agriculture[0], industry[0], tourism[0]].filter(
        (item): item is string => Boolean(item),
      ),
      agriculture,
      industry,
      tourism,
      sourceIds: profile.economy.sourceIds,
    },
    ...(signature && signature.length > 0 ? { signature } : {}),
  } satisfies CountryProfile
}

function cleanDemographicItems(
  items: CountryDemographicItem[],
  religion: boolean,
) {
  const cleaned: CountryDemographicItem[] = []
  for (const item of items) {
    const name = cleanCompactName(item.name, religion)
    if (!name || cleaned.some((candidate) => candidate.name === name)) continue
    cleaned.push({
      name,
      ...(item.sharePercent !== undefined && item.estimateYear !== undefined
        ? {
            sharePercent: item.sharePercent,
            estimateYear: item.estimateYear,
          }
        : {}),
    })
    if (cleaned.length === 5) break
  }
  return cleaned
}

function cleanCompactName(value: string, religion: boolean) {
  let text = exactTextReplacements[value] ?? value
  const listedIndex = text.lastIndexOf('列举了')
  if (listedIndex >= 0) text = text.slice(listedIndex + 3)
  text = text
    .replace(/\d+(?:\.\d+)?\s*[-–—/]\s*.*$/, '')
    .replace(/[（(][^）)]*[）)]/g, '')
    .replace(/[（(].*$/, '')
    .replace(/[）)]/g, '')
    .replace(/^(?:约|近|超过|多于)/, '')
    .trim()
  text = exactTextReplacements[text] ?? text
  if (religion) {
    text = text
      .replace(/^穆斯林$/, '伊斯兰教')
      .replace(/^克里斯蒂安$/, '基督教')
      .replace(/教徒$/, '教')
  }
  if (
    !text ||
    rejectedTextPattern.test(text) ||
    rejectedDemographicPattern.test(text) ||
    latinTextPattern.test(text) ||
    /\d/.test(text) ||
    text.length > 14 ||
    (text.includes('和') && !text.startsWith('耶和华')) ||
    /[/:]/.test(text)
  ) {
    return undefined
  }
  return text
}

function cleanItemList(items: string[]) {
  return items
    .map(cleanItem)
    .filter((item): item is string => Boolean(item))
    .filter((item, index, values) => values.indexOf(item) === index)
    .slice(0, 3)
}

function cleanItem(value: string) {
  let text = exactTextReplacements[value] ?? value
  text = text
    .replace(/^[*•-]\s*/, '')
    .replace(/^(?:少量|小型|小)/, '')
    .replace(/^基本上未开采的/, '')
    .replace(/[（(][^）)]*[）)]/g, '')
    .replace(/[（(].*$/, '')
    .replace(/[）)]/g, '')
    .replace(/[.。]+$/, '')
    .replace(/^.*[:：]/, '')
    .trim()
  text = exactTextReplacements[text] ?? text
  if (
    !text ||
    rejectedTextPattern.test(text) ||
    rejectedGenericItemPattern.test(text) ||
    /^(?:无|没有)$/.test(text) ||
    latinTextPattern.test(text) ||
    text.length > 18 ||
    /得以生长|沿海气候|潜力/.test(text)
  ) {
    return undefined
  }
  return text
}

function summarizePeople(
  ethnicGroups: CountryDemographicItem[],
  religions: CountryDemographicItem[],
) {
  return [
    ethnicGroups.length > 0
      ? `民族：${ethnicGroups.map((item) => item.name).join('、')}`
      : undefined,
    religions.length > 0
      ? `宗教：${religions.map((item) => item.name).join('、')}`
      : undefined,
  ]
    .filter(Boolean)
    .join('；')
    .concat('。')
}

function summarizeEconomy(
  agriculture: string[],
  industry: string[],
  tourism: string[],
) {
  return [
    agriculture.length > 0 ? `农业：${agriculture.join('、')}` : undefined,
    industry.length > 0 ? `工业：${industry.join('、')}` : undefined,
    tourism.length > 0 ? `旅游：${tourism.join('、')}` : undefined,
  ]
    .filter(Boolean)
    .join('；')
    .concat('。')
}
