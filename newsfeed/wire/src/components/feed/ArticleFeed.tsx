import { useRef, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useFilterStore } from '../../stores/filterStore'
import { useFeedStore } from '../../stores/feedStore'
import { useConfigStore } from '../../stores/configStore'
import { ArticleCard } from './ArticleCard'
import { FilterBar } from './FilterBar'
import { NewArticlesBanner } from './NewArticlesBanner'
import { EmptyState } from './EmptyState'

interface ArticleFeedProps {
  focusedIndex: number
  onConfigureClick(): void
}

export function ArticleFeed({ focusedIndex, onConfigureClick }: ArticleFeedProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  // Subscribe to individual filter/feed fields so selectors return stable primitives,
  // then derive filtered articles in the render body to avoid new-array-each-call loops.
  const activeCategory = useFilterStore(s => s.activeCategory)
  const activeSources = useFilterStore(s => s.activeSources)
  const searchQuery = useFilterStore(s => s.searchQuery)
  const allArticles = useFeedStore(s => s.articles)

  // Derive filtered articles locally — stable because upstream primitives drove re-render
  const articles = (() => {
    let result = allArticles
    if (activeCategory) result = result.filter(a => a.category === activeCategory)
    result = result.filter(a => activeSources.has(a.source))
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.symbols.some(s => s.toLowerCase().includes(q))
      )
    }
    return result
  })()

  const { flushPending } = useFeedStore()
  const providers = useConfigStore(s => s.providers)

  const rowVirtualizer = useVirtualizer({
    count: articles.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 96,
    overscan: 5,
  })

  const handleFlush = useCallback(() => {
    flushPending()
    parentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [flushPending])

  const hasEnabledProviders = Object.values(providers).some(p => p.enabled)

  const showNoProviders = !hasEnabledProviders || (allArticles.length === 0 && articles.length === 0)
  const showNoResults = hasEnabledProviders && allArticles.length > 0 && articles.length === 0

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 3rem)' }}>
      <FilterBar />
      <NewArticlesBanner onFlush={handleFlush} />
      <div ref={parentRef} className="flex-1 overflow-auto">
        {showNoProviders ? (
          <EmptyState variant="no-providers" onConfigureClick={onConfigureClick} />
        ) : showNoResults ? (
          <EmptyState variant="no-results" />
        ) : (
          <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
            {rowVirtualizer.getVirtualItems().map(item => (
              <div
                key={item.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${item.start}px)`,
                }}
              >
                <ArticleCard
                  article={articles[item.index]}
                  focused={item.index === focusedIndex}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
