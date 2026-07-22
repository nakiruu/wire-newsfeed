import { describe, it, expect, beforeEach } from 'vitest'
import { useFeedStore } from './feedStore'
import type { Article } from '../providers/types'

const makeArticle = (id: string, published_at?: string): Article => ({
  id, title: `Article ${id}`, summary: '', url: `https://example.com/${id}`,
  source: 'FMP', provider_label: 'FMP', symbols: [],
  published_at: published_at ?? new Date().toISOString(),
  ingested_at: new Date().toISOString(),
})

beforeEach(() => {
  useFeedStore.setState({ articles: [], pendingArticles: [], readIds: new Set(), bookmarkIds: new Set(), focusedIndex: 0 })
})

describe('addArticles', () => {
  it('adds to visible articles when isAtTop is true', () => {
    useFeedStore.getState().addArticles([makeArticle('a'), makeArticle('b')], true)
    expect(useFeedStore.getState().articles).toHaveLength(2)
    expect(useFeedStore.getState().pendingArticles).toHaveLength(0)
  })

  it('adds to pendingArticles when isAtTop is false', () => {
    useFeedStore.getState().addArticles([makeArticle('a')], false)
    expect(useFeedStore.getState().articles).toHaveLength(0)
    expect(useFeedStore.getState().pendingArticles).toHaveLength(1)
  })

  it('deduplicates against existing articles', () => {
    useFeedStore.getState().addArticles([makeArticle('a')], true)
    useFeedStore.getState().addArticles([makeArticle('a'), makeArticle('b')], true)
    expect(useFeedStore.getState().articles).toHaveLength(2)
  })
})

describe('flushPending', () => {
  it('moves pendingArticles to articles', () => {
    useFeedStore.setState({ pendingArticles: [makeArticle('a')] })
    useFeedStore.getState().flushPending()
    expect(useFeedStore.getState().articles).toHaveLength(1)
    expect(useFeedStore.getState().pendingArticles).toHaveLength(0)
  })
})

describe('markRead', () => {
  it('adds id to readIds', () => {
    useFeedStore.getState().markRead('article-1')
    expect(useFeedStore.getState().readIds.has('article-1')).toBe(true)
  })
})

describe('toggleBookmark', () => {
  it('adds bookmark when not bookmarked', () => {
    useFeedStore.getState().toggleBookmark('article-1')
    expect(useFeedStore.getState().bookmarkIds.has('article-1')).toBe(true)
  })

  it('removes bookmark when already bookmarked', () => {
    useFeedStore.setState({ bookmarkIds: new Set(['article-1']) })
    useFeedStore.getState().toggleBookmark('article-1')
    expect(useFeedStore.getState().bookmarkIds.has('article-1')).toBe(false)
  })
})
