import { create } from 'zustand'
import type { Article } from '../providers/types'
import { exactDedup } from '../providers/dedup'
import { saveReadIds, loadReadIds, saveBookmarkIds, loadBookmarkIds, cacheArticles } from '../lib/storage'

type SentimentPatch = Pick<Article, 'sentiment' | 'sentiment_score' | 'sentiment_summary' | 'sentiment_confidence' | 'sentiment_key_factors'>

interface FeedState {
  articles: Article[]
  pendingArticles: Article[]
  readIds: Set<string>
  bookmarkIds: Set<string>
  focusedIndex: number
  addArticles(incoming: Article[], isAtTop: boolean): void
  flushPending(): void
  markRead(id: string): void
  toggleBookmark(id: string): void
  setFocusedIndex(index: number): void
  updateArticleSentiment(id: string, data: SentimentPatch): void
}

function sortDesc(articles: Article[]): Article[] {
  return [...articles].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  )
}

export const useFeedStore = create<FeedState>((set, get) => ({
  articles: [],
  pendingArticles: [],
  readIds: loadReadIds(),
  bookmarkIds: loadBookmarkIds(),
  focusedIndex: 0,

  addArticles(incoming, isAtTop) {
    const { articles, pendingArticles } = get()
    const knownIds = new Set([...articles.map(a => a.id), ...pendingArticles.map(a => a.id)])
    const netNew = exactDedup(incoming, knownIds)
    if (netNew.length === 0) return
    void cacheArticles(netNew)
    if (isAtTop) {
      set(s => ({ articles: sortDesc([...netNew, ...s.articles]) }))
    } else {
      set(s => ({ pendingArticles: [...netNew, ...s.pendingArticles] }))
    }
  },

  flushPending() {
    set(s => ({
      articles: sortDesc([...s.pendingArticles, ...s.articles]),
      pendingArticles: [],
    }))
  },

  markRead(id) {
    set(s => {
      const next = new Set([...s.readIds, id])
      saveReadIds(next)
      return { readIds: next }
    })
  },

  toggleBookmark(id) {
    set(s => {
      const next = new Set(s.bookmarkIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      saveBookmarkIds(next)
      return { bookmarkIds: next }
    })
  },

  setFocusedIndex(index) {
    set({ focusedIndex: index })
  },

  updateArticleSentiment(id, data) {
    set(s => ({
      articles: s.articles.map(a => a.id === id ? { ...a, ...data } : a),
      pendingArticles: s.pendingArticles.map(a => a.id === id ? { ...a, ...data } : a),
    }))
  },
}))
