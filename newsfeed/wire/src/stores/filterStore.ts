import { create } from 'zustand'
import type { ProviderSource } from '../lib/hash'
import { useFeedStore } from './feedStore'

interface FilterState {
  activeCategory: string | null
  activeSources: Set<ProviderSource>
  searchQuery: string
  setCategory(category: string | null): void
  toggleSource(source: ProviderSource): void
  setSearchQuery(query: string): void
  getFilteredArticles(): ReturnType<typeof useFeedStore.getState>['articles']
}

export const useFilterStore = create<FilterState>((set, get) => ({
  activeCategory: null,
  activeSources: new Set<ProviderSource>(['FINNHUB', 'ALPACA', 'RSS', 'SEC']),
  searchQuery: '',

  setCategory(category) { set({ activeCategory: category }) },

  toggleSource(source) {
    set(s => {
      const next = new Set(s.activeSources)
      if (next.has(source)) next.delete(source)
      else next.add(source)
      return { activeSources: next }
    })
  },

  setSearchQuery(query) { set({ searchQuery: query }) },

  getFilteredArticles() {
    const { activeCategory, activeSources, searchQuery } = get()
    let articles = useFeedStore.getState().articles
    if (activeCategory) articles = articles.filter(a => a.category === activeCategory)
    articles = articles.filter(a => activeSources.has(a.source))
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      articles = articles.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.symbols.some(s => s.toLowerCase().includes(q))
      )
    }
    return articles
  },
}))
