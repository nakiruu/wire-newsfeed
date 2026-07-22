import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Header } from './Header'
import { createCoordinator } from '../../services/coordinator'
import type { ProviderCoordinator } from '../../services/coordinator'
import { useKeyboard } from '../../hooks/useKeyboard'
import { useFeedStore } from '../../stores/feedStore'
import { useFilterStore } from '../../stores/filterStore'

interface ShellProps {
  children: React.ReactNode
  onSearchOpen(): void
  onSettingsOpen(): void
  onCommandPaletteOpen?(): void
}

export function Shell({ children, onSearchOpen, onSettingsOpen, onCommandPaletteOpen }: ShellProps) {
  const coordinatorRef = useRef<ProviderCoordinator | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)
  const { focusedIndex, setFocusedIndex, markRead, toggleBookmark } = useFeedStore()

  // Subscribe to primitives and derive filtered articles in render to avoid
  // returning a new array reference from the selector on every call (React 19 warning).
  const activeCategory = useFilterStore(s => s.activeCategory)
  const activeSources = useFilterStore(s => s.activeSources)
  const searchQuery = useFilterStore(s => s.searchQuery)
  const allArticles = useFeedStore(s => s.articles)

  const filteredArticles = useMemo(() => {
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
  }, [allArticles, activeCategory, activeSources, searchQuery])

  useEffect(() => {
    const coordinator = createCoordinator()
    coordinatorRef.current = coordinator
    coordinator.start()
    setLastUpdatedAt(new Date())
    const id = setInterval(() => setLastUpdatedAt(new Date()), 30_000)
    return () => { coordinator.stop(); clearInterval(id) }
  }, [])

  useKeyboard({
    onNavigateDown: useCallback(() => setFocusedIndex(Math.min(focusedIndex + 1, filteredArticles.length - 1)), [focusedIndex, filteredArticles.length, setFocusedIndex]),
    onNavigateUp: useCallback(() => setFocusedIndex(Math.max(focusedIndex - 1, 0)), [focusedIndex, setFocusedIndex]),
    onOpen: useCallback(() => {
      const a = filteredArticles[focusedIndex]
      if (a) { markRead(a.id); window.open(a.url, '_blank', 'noopener,noreferrer') }
    }, [filteredArticles, focusedIndex, markRead]),
    onBookmark: useCallback(() => {
      const a = filteredArticles[focusedIndex]
      if (a) toggleBookmark(a.id)
    }, [filteredArticles, focusedIndex, toggleBookmark]),
    onMarkRead: useCallback(() => {
      const a = filteredArticles[focusedIndex]
      if (a) markRead(a.id)
    }, [filteredArticles, focusedIndex, markRead]),
    onSearch: onSearchOpen,
    onCommandPalette: onCommandPaletteOpen,
  })

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Header onSearchOpen={onSearchOpen} onSettingsOpen={onSettingsOpen} lastUpdatedAt={lastUpdatedAt} />
      <div className="flex max-w-[1080px] mx-auto">{children}</div>
    </div>
  )
}
