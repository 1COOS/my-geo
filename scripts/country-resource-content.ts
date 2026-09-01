import type { CountryProfile } from '../src/data/countrySchema'

type ResourceCategory =
  '能源' | '矿产' | '森林' | '淡水' | '土地' | '渔业' | '港口'

type ResourceRule = {
  id: string
  pattern: RegExp
  name: string
  category: ResourceCategory
  priority: number
}

type ResourceMatch = {
  name: string
  category: ResourceCategory
  priority: number
  sourceOrder: number
  emphasized: boolean
}

export type CountryResourceSource = {
  raw: string
  sourcePath: string
}

const resourceRules: ResourceRule[] = [
  rule('oil-shale', /\b(?:oil shale|shale oil)\b/, '油页岩', '能源', 45),
  rule(
    'petroleum',
    /\bpetroleum\b|\bcrude oil\b|(?<!shale )\boil\b(?! shale)/,
    '石油',
    '能源',
    10,
  ),
  rule(
    'natural-gas',
    /\bnatural gas\b|\bgas reserves?\b|\boil and gas\b|\bgas and oil\b/,
    '天然气',
    '能源',
    12,
  ),
  rule('gas', /^gas$/, '天然气', '能源', 13),
  rule('coal', /(?<!brown )\bcoal\b/, '煤', '能源', 20),
  rule('lignite', /\blignite\b|\bbrown coal\b/, '褐煤', '能源', 25),
  rule('uranium', /\buranium\b/, '铀', '能源', 30),
  rule(
    'hydropower',
    /\bhydropower\b|\bhydroelectric(?:ity)?\b/,
    '水电',
    '能源',
    35,
  ),
  rule('geothermal', /\bgeothermal power\b/, '地热', '能源', 40),
  rule('peat', /\bpeat(?: deposits?)?\b/, '泥炭', '能源', 50),
  rule('tar-sands', /\btar sands?\b/, '油砂', '能源', 52),
  rule('methane', /\bmethane\b/, '甲烷', '能源', 54),

  rule('iron-ore', /\biron ore\b|\blow-grade iron ore\b/, '铁矿石', '矿产', 10),
  rule('iron', /\biron\b(?! ore)/, '铁', '矿产', 11),
  rule('copper', /\bcopper(?: ore)?\b/, '铜', '矿产', 12),
  rule('bauxite', /\bbauxite\b/, '铝土矿', '矿产', 14),
  rule('alumina', /\balumina\b/, '氧化铝', '矿产', 15),
  rule('gold', /\bgold(?: deposits?)?\b/, '黄金', '矿产', 16),
  rule(
    'rare-earth',
    /\brare earth (?:elements|metals|oxides)\b/,
    '稀土',
    '矿产',
    18,
  ),
  rule('precious-metals', /\bprecious metals?\b/, '贵金属', '矿产', 19),
  rule('lithium', /\blithium\b/, '锂', '矿产', 20),
  rule('diamonds', /\bdiamonds?\b|\bgem diamonds?\b/, '钻石', '矿产', 22),
  rule('silver', /\bsilver\b/, '白银', '矿产', 24),
  rule('nickel', /\bnickel\b/, '镍', '矿产', 26),
  rule('manganese', /\bmanganese\b|\bmanganese ore\b/, '锰', '矿产', 28),
  rule('zinc', /\bzinc\b/, '锌', '矿产', 30),
  rule('lead', /\blead\b/, '铅', '矿产', 32),
  rule('tin', /\btin\b|\bcassiterite\b/, '锡', '矿产', 34),
  rule('chromium', /\bchrom(?:e|ite|ium)(?: ore)?\b/, '铬', '矿产', 36),
  rule('cobalt', /\bcobalt\b/, '钴', '矿产', 38),
  rule('tungsten', /\btungsten\b/, '钨', '矿产', 40),
  rule('molybdenum', /\bmolybdenum\b/, '钼', '矿产', 42),
  rule(
    'phosphate',
    /\bphosphates?\b|\bphosphate rock\b|\bphosphorites?\b/,
    '磷酸盐',
    '矿产',
    44,
  ),
  rule('potash', /\bpotash\b/, '钾盐', '矿产', 46),
  rule('salt', /\b(?:rock )?salt\b/, '盐', '矿产', 48),
  rule(
    'limestone',
    /\blimestone\b|\bdolomitic limestone\b/,
    '石灰岩',
    '矿产',
    50,
  ),
  rule('graphite', /\bgraphite\b/, '石墨', '矿产', 52),
  rule('magnetite', /\bmagnetite\b/, '磁铁矿', '矿产', 53),
  rule('titanium', /\btitanium(?: ore)?\b|\brutile\b/, '钛矿', '矿产', 54),
  rule('platinum', /\bplatinum(?: group metals)?\b/, '铂', '矿产', 56),
  rule('tantalum', /\btantalum\b|\bcoltan\b/, '钽', '矿产', 58),
  rule('niobium', /\bniobium\b/, '铌', '矿产', 60),
  rule('mercury', /\bmercury\b/, '汞', '矿产', 62),
  rule('antimony', /\bantimony\b/, '锑', '矿产', 64),
  rule('magnesite', /\bmagnesite\b/, '菱镁矿', '矿产', 66),
  rule('magnesium-bromide', /\bmagnesium bromide\b/, '溴化镁', '矿产', 67),
  rule('magnesium', /\bmagnesium\b(?! bromide)/, '镁', '矿产', 68),
  rule('sulfur', /\bsulfur\b|\bpyrites?\b/, '硫', '矿产', 70),
  rule('gypsum', /\bgypsum\b/, '石膏', '矿产', 72),
  rule('marble', /\bmarble\b/, '大理石', '矿产', 74),
  rule('clay', /\bclays?\b|\bkaolin\b/, '黏土', '矿产', 76),
  rule('marl', /\bmarl\b/, '泥灰岩', '矿产', 77),
  rule('chalk', /\bchalk\b/, '白垩', '矿产', 77),
  rule('feldspar', /\bfeldspar\b/, '长石', '矿产', 78),
  rule('fluorspar', /\bfluorspar\b|\bfluorite\b/, '萤石', '矿产', 80),
  rule('barite', /\bbarites?\b|\bbarite\b/, '重晶石', '矿产', 82),
  rule('asbestos', /\basbestos\b/, '石棉', '矿产', 84),
  rule('quartz', /\bquartz\b/, '石英', '矿产', 86),
  rule('silica', /\bsilica(?: sand)?\b/, '硅砂', '矿产', 88),
  rule(
    'sand',
    /\bsand(?: and gravel)?\b|\bgravel(?: and sand)?\b/,
    '砂石',
    '矿产',
    90,
  ),
  rule('granite', /\bgranite\b/, '花岗岩', '矿产', 92),
  rule('pumice', /\bpumice\b/, '浮石', '矿产', 94),
  rule('mica', /\bmica\b/, '云母', '矿产', 96),
  rule('talc', /\btalc\b/, '滑石', '矿产', 98),
  rule('soda-ash', /\bsoda ash\b/, '纯碱', '矿产', 100),
  rule('mineral-sands', /\bmineral sands?\b/, '矿砂', '矿产', 102),
  rule(
    'gemstones',
    /\bgems?\b(?!\s+diamonds?)|\bgemstones?\b|\bprecious and semiprecious stones\b/,
    '宝石',
    '矿产',
    104,
  ),
  rule(
    'precious-stones',
    /\bprecious stones\b|\bsemiprecious stones\b/,
    '宝石',
    '矿产',
    104,
  ),
  rule('emeralds', /\bemeralds?\b/, '祖母绿', '矿产', 106),
  rule('opals', /\bopals?\b/, '蛋白石', '矿产', 108),
  rule('tanzanite', /\btanzanite\b/, '坦桑石', '矿产', 109),
  rule('vanadium', /\bvanadium\b/, '钒', '矿产', 110),
  rule('beryllium', /\bberyllium\b/, '铍', '矿产', 112),
  rule('bismuth', /\bbismuth\b/, '铋', '矿产', 114),
  rule('arsenic', /\barsenic\b/, '砷', '矿产', 116),
  rule('cadmium', /\bcadmium\b/, '镉', '矿产', 118),
  rule('aluminum', /\baluminum\b/, '铝', '矿产', 120),
  rule('helium', /\bhelium\b/, '氦', '矿产', 122),
  rule('strontium', /\bstrontium\b|\bcelestite\b/, '锶', '矿产', 124),
  rule('tellurium', /\btellurium\b/, '碲', '矿产', 126),
  rule('selenium', /\bselenium\b/, '硒', '矿产', 128),
  rule('indium', /\bindium\b/, '铟', '矿产', 130),
  rule('gallium', /\bgallium\b/, '镓', '矿产', 132),
  rule('germanium', /\bgermanium\b/, '锗', '矿产', 134),
  rule('hafnium', /\bhafnium\b/, '铪', '矿产', 136),
  rule('ferrosilicon', /\bferrosilicon\b/, '硅铁', '矿产', 138),
  rule(
    'calcium-carbonate',
    /\bcalcium carbonate\b|\bcarbonates?\b/,
    '碳酸盐',
    '矿产',
    140,
  ),
  rule('calcium', /\bcalcium\b(?! carbonate)/, '钙', '矿产', 141),
  rule('diatomite', /\bdiatomite\b/, '硅藻土', '矿产', 142),
  rule('dolomite', /\bdolomite\b/, '白云石', '矿产', 144),
  rule('aragonite', /\baragonite\b/, '霰石', '矿产', 145),
  rule('basalt', /\bbasalt rock\b/, '玄武岩', '矿产', 145),
  rule('sepiolite', /\bsepiolite\b/, '海泡石', '矿产', 145),
  rule('zircon', /\bzircon\b/, '锆石', '矿产', 145),
  rule('nepheline', /\bnepheline\b/, '霞石', '矿产', 145),
  rule('wolframite', /\bwolframite\b/, '钨', '矿产', 145),
  rule('asphalt', /\b(?:natural )?asphalt\b/, '沥青', '矿产', 145),
  rule('natron', /\bnatron\b/, '天然碱', '矿产', 145),
  rule('emery', /\bemery\b/, '金刚砂', '矿产', 145),
  rule('perlite', /\bperlite\b/, '珍珠岩', '矿产', 145),
  rule('chromate', /\bchromate\b/, '铬', '矿产', 145),
  rule('slate', /\bslate\b/, '板岩', '矿产', 146),
  rule('amber', /\bamber\b/, '琥珀', '矿产', 148),
  rule('borate', /\bborate\b/, '硼酸盐', '矿产', 150),
  rule('nitrates', /\bnitrates?\b/, '硝酸盐', '矿产', 152),
  rule('pearls', /\bpearls?\b/, '珍珠', '矿产', 153),
  rule(
    'building-stone',
    /\bbuilding stone\b|\bstone\b/,
    '建筑石材',
    '矿产',
    154,
  ),
  rule('nonferrous-metals', /\bnonferrous metals?\b/, '有色金属', '矿产', 156),
  rule(
    'deep-seabed-minerals',
    /\bdeep[ -]seabed minerals?\b/,
    '深海矿产',
    '矿产',
    158,
  ),

  rule(
    'timber',
    /\btimber\b|\bhardwood timber\b|\bhardwood forests?\b/,
    '木材',
    '森林',
    10,
  ),
  rule('hardwoods', /\bhardwoods\b|\brare woods\b/, '木材', '森林', 10),
  rule('mahogany', /\bmahogany forests?\b/, '桃花心木', '森林', 15),
  rule('cork', /\bcork forests?\b/, '软木', '森林', 16),
  rule('chicle', /\bchicle\b/, '树胶', '森林', 30),
  rule('forests', /^forests?$/, '森林', '森林', 20),
  rule(
    'fresh-water',
    /\bfresh ?water\b|\bwater-surplus\b|^water$/,
    '水资源',
    '淡水',
    10,
  ),
  rule('mineral-water', /\bmineral water\b/, '矿泉水', '淡水', 20),
  rule('mineral-springs', /\bmineral springs?\b/, '矿泉水', '淡水', 20),
  rule('arable-land', /\barable land\b|\bcropland\b/, '耕地', '土地', 10),
  rule(
    'agricultural-land',
    /\bagricultural and grazing land\b/,
    '耕地',
    '土地',
    10,
  ),
  rule(
    'fertile-soil',
    /\bfertile (?:soil|soils|plains|agricultural land)\b/,
    '肥沃土壤',
    '土地',
    20,
  ),
  rule('pasture', /\bpasture\b/, '牧场', '土地', 30),
  rule('grazing-land', /\bagricultural and grazing land\b/, '牧场', '土地', 30),
  rule(
    'fishery',
    /\bfish(?:eries)?\b|\bshrimp\b|\blobster\b|\bcrayfish\b|\bsquid\b|\bkrill\b|\bmarine products\b|\bwhales\b|\btoothfish\b|\bicefish\b|\bcrab\b/,
    '渔业资源',
    '渔业',
    10,
  ),
  rule('deepwater-port', /\bdeepwater ports?\b/, '深水港', '港口', 10),
]

const uncertainPattern =
  /\b(?:potential|possible|possibly|unexploited|negligible|minor|limited|poor quality|no longer exploited|production discontinued)\b|\bsmall (?:deposits|reserves|amounts|quantities)?\b|\bsome\b/
const emphasizedPattern =
  /\b(?:major deposits?|abundant|large deposits?|large reserves?|world's largest|extensive reserves?)\b/
const explicitIgnorePattern =
  /^(?:none|negl|note|other minerals?|minerals?|many strategic minerals|pleasant climate.*tourism|scenic beauty|sandy beaches|beaches.*tourism|wildlife|coconuts?(?: copra)?|coconut(?: products?| copra)|cocoa beans|coffee|tropical fruit|cinnamon trees|rubber|sugarcane|guano|sphagnum moss|sea mud|fertile plains of the pampas|coastal climate.*growth|construction materials?|calcified seaweed|building materials?|industrial and gem diamonds?)$/

export function buildCountryResourceProfile(
  source: CountryResourceSource,
  sourceId: string,
) {
  const fragments = splitResourceFragments(source.raw)
  const matches: ResourceMatch[] = []
  const unexplained: string[] = []

  fragments.forEach((fragment, sourceOrder) => {
    if (isUncertain(fragment)) return
    const matchedRules = resourceRules.filter((definition) =>
      definition.pattern.test(fragment),
    )
    if (matchedRules.length === 0) {
      if (!explicitIgnorePattern.test(cleanFragment(fragment))) {
        unexplained.push(fragment)
      }
      return
    }
    for (const definition of matchedRules) {
      matches.push({
        name: definition.name,
        category: definition.category,
        priority: definition.priority,
        sourceOrder,
        emphasized: emphasizedPattern.test(fragment),
      })
    }
  })

  if (unexplained.length > 0) {
    throw new Error(
      `Unmapped resource fragments in ${source.sourcePath}: ${unexplained.join(' | ')}`,
    )
  }

  const groups = (
    ['能源', '矿产', '森林', '淡水', '土地', '渔业', '港口'] as const
  ).flatMap((category) => {
    const items = deduplicateMatches(
      matches.filter((item) => item.category === category),
    )
      .sort(compareMatches)
      .map((item) => item.name)
    return items.length > 0 ? [{ label: category, items }] : []
  })

  return {
    keywords: groups.flatMap((group) => group.items).slice(0, 3),
    groups,
    sourceIds: [sourceId],
  } satisfies CountryProfile['resources']
}

export function getCriticalResourceCoverage(raw: string) {
  const certainRaw = splitResourceFragments(raw)
    .filter((fragment) => !isUncertain(fragment))
    .join(' ')
  return [
    ['石油', /\bpetroleum\b|\bcrude oil\b|(?<!shale )\boil\b(?! shale)/],
    ['天然气', /\bnatural gas\b|\boil and gas\b|\bgas and oil\b/],
    ['煤', /(?<!brown )\bcoal\b/],
    ['褐煤', /\blignite\b|\bbrown coal\b/],
    ['水电', /\bhydropower\b|\bhydroelectric(?:ity)?\b/],
    ['铀', /\buranium\b/],
    ['铁矿石', /\biron ore\b/],
    ['铝土矿', /\bbauxite\b/],
    ['木材', /\btimber\b/],
    ['渔业资源', /\bfish\b|\bshrimp\b|\blobster\b/],
    ['耕地', /\barable land\b|\bcropland\b/],
  ]
    .filter(([, pattern]) => (pattern as RegExp).test(certainRaw))
    .map(([name]) => name as string)
}

function rule(
  id: string,
  pattern: RegExp,
  name: string,
  category: ResourceCategory,
  priority: number,
): ResourceRule {
  return { id, pattern, name, category, priority }
}

function splitResourceFragments(raw: string) {
  const cleaned = raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/minerals?\s*\(especially gold\)/gi, 'gold')
    .replace(/minerals?\s*\(pumice\)/gi, 'pumice')
    .replace(/forests?\s*\(cork\)/gi, 'cork forests')
    .replace(
      /gemstones?\s*\(including tanzanite, found only in tanzania\)/gi,
      'gemstones, tanzanite',
    )
    .replace(/\(production discontinued[^)]*\)/gi, ' production discontinued ')
    .replace(/\(no longer exploited\)/gi, ' no longer exploited ')
    .replace(/\(world's largest\)/g, " world's largest ")
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim()
  return cleaned.split(/[,;]/).map(cleanFragment).filter(Boolean)
}

function cleanFragment(fragment: string) {
  return fragment
    .replace(/^\s*(?:and\s+)?/, '')
    .replace(
      /^(?:wide|extensive|abundant) natural-resource base(?: including)?\s*/,
      '',
    )
    .replace(
      /^(?:major deposits?|large deposits?|large reserves?|reserves?|deposits?) of\s+/,
      '',
    )
    .replace(/^locally exploitable\s+/, '')
    .replace(/^fertile soil in west$/, 'fertile soil')
    .replace(/\s+/g, ' ')
    .trim()
}

function isUncertain(fragment: string) {
  if (/hydropower potential.*world's largest/.test(fragment)) return false
  return uncertainPattern.test(fragment)
}

function deduplicateMatches(matches: ResourceMatch[]) {
  const best = new Map<string, ResourceMatch>()
  for (const item of matches) {
    const current = best.get(item.name)
    if (!current || compareMatches(item, current) < 0) best.set(item.name, item)
  }
  return [...best.values()]
}

function compareMatches(left: ResourceMatch, right: ResourceMatch) {
  if (left.emphasized !== right.emphasized) return left.emphasized ? -1 : 1
  if (left.priority !== right.priority) return left.priority - right.priority
  return left.sourceOrder - right.sourceOrder
}
