export type FlagSectionName = 'description' | 'meaning' | 'history'

function decodeFactbookText(value: string) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function parseFlagSections(raw: string) {
  const sections: Record<FlagSectionName, string | null> = {
    description: null,
    meaning: null,
    history: null,
  }
  const sectionPattern =
    /<strong>\s*(description|meaning|history):[\s\u00a0]*<\/strong>\s*([\s\S]*?)(?=<br\s*\/?><br\s*\/?>\s*<strong>|$)/gi

  for (const match of raw.matchAll(sectionPattern)) {
    const sectionName = match[1]?.toLowerCase() as FlagSectionName
    const content = decodeFactbookText(match[2] ?? '')
    sections[sectionName] = content || null
  }

  return sections
}
