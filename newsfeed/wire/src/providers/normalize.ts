import type { Article } from './types'

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Matches $TICK and (TICK) patterns common in financial writing:
// "$AAPL rose 5%", "Apple (AAPL) reported earnings..."
export function extractSymbols(text: string): string[] {
  const found = new Set<string>()
  const re = /\$([A-Z]{1,5})\b|\(([A-Z]{2,5})\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const sym = m[1] ?? m[2]
    if (sym) found.add(sym)
    if (found.size >= 5) break
  }
  return [...found]
}

export function toSentiment(raw: string | undefined): Article['sentiment'] {
  if (raw === undefined) return undefined
  const s = raw.toLowerCase()
  if (s === 'bullish' || s === 'positive') return 'bullish'
  if (s === 'bearish' || s === 'negative') return 'bearish'
  if (!s) return undefined
  return 'neutral'
}
