import { useEffect, useRef, useState, useCallback } from 'react'
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
  const filteredArticles = useFilterStore(s => s.getFilteredArticles())

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
