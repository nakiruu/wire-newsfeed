import { describe, it, expect } from 'vitest'
import { exactDedup, buildBigrams, jaccardSimilarity, fuzzyDedup } from './dedup'
import type { Article } from './types'

const makeArticle = (overrides: Partial<Article>): Article => ({
  id: 'FMP:abc',
  title: 'Apple Reports Record Earnings',
  summary: 'Apple Inc reported record quarterly earnings.',
  url: 'https://example.com/apple',
  source: 'FMP',
  provider_label: 'FMP',
  symbols: ['AAPL'],
  published_at: new Date().toISOString(),
  ingested_at: new Date().toISOString(),
  ...overrides,
})

describe('exactDedup', () => {
  it('filters articles whose ids are in knownIds', () => {
    const known = new Set(['FMP:abc'])
    const incoming = [makeArticle({ id: 'FMP:abc' }), makeArticle({ id: 'FMP:xyz' })]
    expect(exactDedup(incoming, known)).toHaveLength(1)
    expect(exactDedup(incoming, known)[0].id).toBe('FMP:xyz')
  })

  it('returns all articles when knownIds is empty', () => {
    const incoming = [makeArticle({}), makeArticle({ id: 'FMP:xyz' })]
    expect(exactDedup(incoming, new Set())).toHaveLength(2)
  })
})

describe('buildBigrams', () => {
  it('returns bigrams from title words', () => {
    const bigrams = buildBigrams('apple reports record')
    expect(bigrams.has('apple reports')).toBe(true)
    expect(bigrams.has('reports record')).toBe(true)
  })
})

describe('jaccardSimilarity', () => {
  it('returns 1.0 for identical sets', () => {
    const s = new Set(['a b', 'b c'])
    expect(jaccardSimilarity(s, s)).toBe(1)
  })

  it('returns 0 for disjoint sets', () => {
    const a = new Set(['a b'])
    const b = new Set(['c d'])
    expect(jaccardSimilarity(a, b)).toBe(0)
  })
})

describe('fuzzyDedup', () => {
  it('merges near-duplicate articles within 30 minutes', () => {
    const base = new Date()
    const a1 = makeArticle({
      id: 'FMP:1', title: 'Apple Reports Record Quarterly Earnings Beat',
      source: 'FMP', provider_label: 'FMP',
      published_at: base.toISOString(),
    })
    const a2 = makeArticle({
      id: 'ALPACA:2', title: 'Apple Reports Record Quarterly Earnings Beat',
      source: 'ALPACA', provider_label: 'Alpaca',
      published_at: new Date(base.getTime() + 5 * 60 * 1000).toISOString(),
    })
    const result = fuzzyDedup([a1, a2])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('FMP:1')
    expect(result[0].also_reported_by).toContain('Alpaca')
  })

  it('does not merge articles more than 30 minutes apart', () => {
    const base = new Date()
    const a1 = makeArticle({ id: 'FMP:1', title: 'Apple Reports Record Quarterly Earnings Beat', published_at: base.toISOString() })
    const a2 = makeArticle({ id: 'ALPACA:2', title: 'Apple Reports Record Quarterly Earnings Beat', published_at: new Date(base.getTime() + 31 * 60 * 1000).toISOString() })
    expect(fuzzyDedup([a1, a2])).toHaveLength(2)
  })
})
