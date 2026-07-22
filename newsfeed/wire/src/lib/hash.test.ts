import { describe, it, expect } from 'vitest'
import { articleId } from './hash'

describe('articleId', () => {
  it('strips query params and trailing slash before hashing', () => {
    const a = articleId('https://example.com/article?ref=twitter', 'FMP')
    const b = articleId('https://example.com/article/', 'FMP')
    const c = articleId('https://example.com/article', 'FMP')
    expect(a).toBe(b)
    expect(b).toBe(c)
  })

  it('includes source in id to prevent cross-provider collision', () => {
    const fmp = articleId('https://example.com/article', 'FMP')
    const alpaca = articleId('https://example.com/article', 'ALPACA')
    expect(fmp).not.toBe(alpaca)
  })

  it('is deterministic — same inputs always produce same id', () => {
    const id1 = articleId('https://reuters.com/story/abc', 'RSS')
    const id2 = articleId('https://reuters.com/story/abc', 'RSS')
    expect(id1).toBe(id2)
  })
})
