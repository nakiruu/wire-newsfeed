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

export function toSentiment(raw: string | undefined): Article['sentiment'] {
  if (raw === undefined) return undefined
  const s = raw.toLowerCase()
  if (s === 'bullish' || s === 'positive') return 'bullish'
  if (s === 'bearish' || s === 'negative') return 'bearish'
  if (!s) return undefined
  return 'neutral'
}
