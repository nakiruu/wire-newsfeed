import { useMemo } from 'react'
import Fuse from 'fuse.js'
import { useFeedStore } from '../stores/feedStore'
import type { Article } from '../providers/types'

const FUSE_OPTIONS = {
  keys: [
    { name: 'title', weight: 0.6 },
    { name: 'symbols', weight: 0.3 },
    { name: 'summary', weight: 0.1 },
  ],
  threshold: 0.3,
  minMatchCharLength: 2,
}

export function useArticleSearch(query: string): Article[] {
  const articles = useFeedStore(s => s.articles)
  const fuse = useMemo(() => new Fuse(articles, FUSE_OPTIONS), [articles])
  return useMemo(() => {
    if (!query.trim()) return articles.slice(0, 20)
    return fuse.search(query).map(r => r.item).slice(0, 20)
  }, [fuse, query, articles])
}
