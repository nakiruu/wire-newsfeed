import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useFeedStore } from '../stores/feedStore'
import { useArticleSearch } from './useArticleSearch'
import type { Article } from '../providers/types'

function makeArticle(overrides: Partial<Article> & { id: string }): Article {
  return {
    id: overrides.id,
    title: overrides.title ?? `Article ${overrides.id}`,
    summary: overrides.summary ?? '',
    url: `https://example.com/${overrides.id}`,
    source: 'FMP',
    provider_label: 'FMP',
    symbols: overrides.symbols ?? [],
    published_at: new Date().toISOString(),
    ingested_at: new Date().toISOString(),
    ...overrides,
  }
}

const ARTICLES: Article[] = [
  makeArticle({ id: '1', title: 'Apple earnings beat expectations', symbols: ['AAPL'], summary: 'Apple reported strong Q1 results' }),
  makeArticle({ id: '2', title: 'Tesla delivery numbers disappoint', symbols: ['TSLA'], summary: 'Tesla missed analyst estimates' }),
  makeArticle({ id: '3', title: 'Federal Reserve rate decision', symbols: [], summary: 'Fed holds rates steady' }),
  makeArticle({ id: '4', title: 'Microsoft Azure cloud growth', symbols: ['MSFT'], summary: 'Azure revenue up 30%' }),
  makeArticle({ id: '5', title: 'Oil price surge on OPEC news', symbols: ['XOM', 'CVX'], summary: 'Crude oil hits 90 dollar level' }),
]

beforeEach(() => {
  useFeedStore.setState({ articles: ARTICLES, pendingArticles: [], readIds: new Set(), bookmarkIds: new Set(), focusedIndex: 0 })
})

describe('useArticleSearch', () => {
  it('returns up to 20 articles when query is empty', () => {
    const { result } = renderHook(() => useArticleSearch(''))
    expect(result.current).toHaveLength(Math.min(ARTICLES.length, 20))
  })

  it('returns all articles when query is whitespace only', () => {
    const { result } = renderHook(() => useArticleSearch('   '))
    expect(result.current).toHaveLength(Math.min(ARTICLES.length, 20))
  })

  it('filters by title keyword', () => {
    const { result } = renderHook(() => useArticleSearch('Apple'))
    expect(result.current.length).toBeGreaterThan(0)
    expect(result.current.some(a => a.id === '1')).toBe(true)
  })

  it('filters by ticker symbol', () => {
    const { result } = renderHook(() => useArticleSearch('TSLA'))
    expect(result.current.length).toBeGreaterThan(0)
    expect(result.current.some(a => a.id === '2')).toBe(true)
  })

  it('returns empty array when no articles match', () => {
    const { result } = renderHook(() => useArticleSearch('zzzyyyxxx'))
    expect(result.current).toHaveLength(0)
  })

  it('returns Article objects (not Fuse result wrappers)', () => {
    const { result } = renderHook(() => useArticleSearch('Apple'))
    if (result.current.length > 0) {
      const article = result.current[0]
      expect(article).toHaveProperty('id')
      expect(article).toHaveProperty('title')
      expect(article).toHaveProperty('url')
      expect(article).not.toHaveProperty('item')
      expect(article).not.toHaveProperty('score')
    }
  })

  it('caps results at 20', () => {
    const manyArticles = Array.from({ length: 30 }, (_, i) =>
      makeArticle({ id: String(i), title: `Apple stock news ${i}`, symbols: ['AAPL'] })
    )
    useFeedStore.setState({ articles: manyArticles })
    const { result } = renderHook(() => useArticleSearch('Apple'))
    expect(result.current.length).toBeLessThanOrEqual(20)
  })
})
