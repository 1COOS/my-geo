import type { CountryProfile } from '../src/data/countrySchema'

const bannedTextPattern =
  /其他|未知|未说明|估计|几乎|所有|无宗教|无附属|无隶属|小规模|低于|不足|至少|包含|包括/
const malformedRangePattern = /\d+(?:\.\d+)?\s*[-–—]\s*$/
const sourceNotePattern = /注\s*\d|note\s*\d/i
const latinTextPattern = /[A-Za-z]{2,}/
const genericSignatureTitlePattern =
  /^(?:地理名片|大陆国家|独特动物|多样.*|文化影响|语言文化|海岸与山地|高原与海岸|联邦组成|海外州|农业|工业|电子|旅游业|食品加工)$/
const genericSignatureDescriptionPattern =
  /代表性国家象征|重要产业之一|战略位置|地理位置优越/
const demographicFillerPattern =
  /^(?:无|没有|没有宗教|非信徒|拒绝回答|无回应|不适用|宗派)$|动画家|动画主义|无神论|不可知论|不信教|不到|未具体说明|未表示|未指明|未归属|宗教构成数据有限|信仰者但不属于|^以.*为主$/

type DisplayValue = {
  path: string
  text: string
  kind: 'name' | 'summary' | 'signature-title' | 'signature-description'
}

export function assertCountryProfileContentQuality(
  profiles: Record<string, CountryProfile>,
  context: string,
) {
  for (const [countryCode, profile] of Object.entries(profiles)) {
    const values = collectDisplayValues(countryCode, profile)
    for (const value of values) {
      const error = getDisplayTextError(value)
      if (error) {
        throw new Error(`${context} ${value.path}: ${error}: ${value.text}`)
      }
    }

    const signatureTitles = profile.signature?.map((item) => item.title) ?? []
    if (new Set(signatureTitles).size !== signatureTitles.length) {
      throw new Error(`${context} ${countryCode}: duplicate signature title`)
    }
  }
}

function collectDisplayValues(
  countryCode: string,
  profile: CountryProfile,
): DisplayValue[] {
  const values: DisplayValue[] = []
  const add = (
    path: string,
    text: string | undefined,
    kind: DisplayValue['kind'],
  ) => {
    if (text) values.push({ path: `${countryCode}.${path}`, text, kind })
  }

  add('resources.summary', profile.resources.summary, 'summary')
  profile.resources.keywords.forEach((item, index) =>
    add(`resources.keywords.${index}`, item, 'name'),
  )
  profile.resources.groups.forEach((group, groupIndex) => {
    add(`resources.groups.${groupIndex}.label`, group.label, 'name')
    group.items.forEach((item, index) =>
      add(`resources.groups.${groupIndex}.items.${index}`, item, 'name'),
    )
  })

  add('people.summary', profile.people.summary, 'summary')
  profile.people.keywords.forEach((item, index) =>
    add(`people.keywords.${index}`, item, 'name'),
  )
  profile.people.ethnicGroups.forEach((item, index) =>
    add(`people.ethnicGroups.${index}`, item.name, 'name'),
  )
  profile.people.religions.forEach((item, index) =>
    add(`people.religions.${index}`, item.name, 'name'),
  )

  add('economy.summary', profile.economy.summary, 'summary')
  profile.economy.keywords.forEach((item, index) =>
    add(`economy.keywords.${index}`, item, 'name'),
  )
  for (const section of ['agriculture', 'industry', 'tourism'] as const) {
    profile.economy[section].forEach((item, index) =>
      add(`economy.${section}.${index}`, item, 'name'),
    )
  }

  profile.signature?.forEach((item, index) => {
    add(`signature.${index}.title`, item.title, 'signature-title')
    add(
      `signature.${index}.description`,
      item.description,
      'signature-description',
    )
  })
  return values
}

function getDisplayTextError(value: DisplayValue) {
  if (bannedTextPattern.test(value.text)) return 'banned filler text'
  if (
    value.path.includes('.people.') &&
    value.kind === 'name' &&
    demographicFillerPattern.test(value.text)
  )
    return 'invalid demographic category'
  if (malformedRangePattern.test(value.text)) return 'truncated numeric range'
  if (sourceNotePattern.test(value.text)) return 'source note leaked into text'
  if (!hasBalancedParentheses(value.text)) return 'unbalanced parentheses'
  if (latinTextPattern.test(value.text)) return 'unreviewed Latin text'
  if (
    value.kind === 'name' || value.kind === 'signature-title'
      ? /[()（）]/.test(value.text)
      : false
  ) {
    return 'parenthetical note in compact name'
  }
  if (
    value.kind === 'signature-title' &&
    genericSignatureTitlePattern.test(value.text)
  ) {
    return 'generic signature title'
  }
  if (
    value.kind === 'signature-description' &&
    genericSignatureDescriptionPattern.test(value.text)
  ) {
    return 'generic signature description'
  }
  return undefined
}

function hasBalancedParentheses(text: string) {
  return (
    text.split('(').length === text.split(')').length &&
    text.split('（').length === text.split('）').length
  )
}
