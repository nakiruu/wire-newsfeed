export type ProviderSource = 'FMP' | 'ALPACA' | 'RSS' | 'SEC' | 'WEBHOOK'

function simpleHash(str: string): string {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0
  }
  return Math.abs(h).toString(36)
}

export function articleId(url: string, source: ProviderSource): string {
  const normalized = url
    .replace(/[?#].*$/, '')
    .replace(/\/+$/, '')
    .toLowerCase()
  return `${source}:${simpleHash(normalized)}`
}
