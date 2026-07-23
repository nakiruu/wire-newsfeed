import { describe, it, expect, beforeEach } from 'vitest'
import { useFilterStore } from './filterStore'
import { useFeedStore } from './feedStore'
import type { Article } from '../providers/types'

const makeArticle = (overrides: Partial<Article>): Article => ({
  id: 'FMP:1', title: 'Test', summary: '', url: 'https://example.com',
  source: 'FINNHUB', provider_label: 'FINNHUB', symbols: [],
  published_at: new Date().toISOString(), ingested_at: new Date().toISOString(),
  ...overrides,
})

beforeEach(() => {
  useFilterStore.setState({ activeCategory: null, activeSources: new Set(['FINNHUB', 'ALPACA', 'RSS', 'SEC']), searchQuery: '' })
  useFeedStore.setState({ articles: [], pendingArticles: [], readIds: new Set(), bookmarkIds: new Set(), focusedIndex: 0 })
})

describe('getFilteredArticles', () => {
  it('returns all articles when no filters active', () => {
    useFeedStore.setState({ articles: [makeArticle({ id: 'a' }), makeArticle({ id: 'b' })] })
    expect(useFilterStore.getState().getFilteredArticles()).toHaveLength(2)
  })

  it('filters by category', () => {
    useFeedStore.setState({ articles: [makeArticle({ id: 'a', category: 'earnings' }), makeArticle({ id: 'b', category: 'macro' })] })
    useFilterStore.setState({ activeCategory: 'earnings' })
    const result = useFilterStore.getState().getFilteredArticles()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('a')
  })

  it('filters by active sources', () => {
    useFeedStore.setState({ articles: [makeArticle({ id: 'a', source: 'FINNHUB' }), makeArticle({ id: 'b', source: 'ALPACA' })] })
    useFilterStore.setState({ activeSources: new Set(['FINNHUB']) })
    expect(useFilterStore.getState().getFilteredArticles()).toHaveLength(1)
  })
})
