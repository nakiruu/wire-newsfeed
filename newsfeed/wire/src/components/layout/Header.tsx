import { useState, useEffect } from 'react'
import { Settings, Search } from 'lucide-react'
import { useFeedStore } from '../../stores/feedStore'
import { Button } from '../ui/Button'

function getRelativeTime(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000)
  if (secs < 60) return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  return `${Math.floor(secs / 3600)}h ago`
}

function LivePulse({ lastUpdatedAt }: { lastUpdatedAt: Date | null }) {
  const [, tick] = useState(0)
  const pendingCount = useFeedStore(s => s.pendingArticles.length)
  useEffect(() => {
    const id = setInterval(() => tick(n => n + 1), 10_000)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="flex items-center gap-2">
      {pendingCount > 0 && (
        <span className="text-[0.75rem] font-mono text-[#0070F3]">↑ {pendingCount} new</span>
      )}
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C853] opacity-50" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00C853]" />
        </span>
        <span className="text-[0.75rem] font-mono text-[#555555]">
          {lastUpdatedAt ? getRelativeTime(lastUpdatedAt) : 'waiting'}
        </span>
      </div>
    </div>
  )
}

interface HeaderProps {
  onSearchOpen(): void
  onSettingsOpen(): void
  lastUpdatedAt: Date | null
}

export function Header({ onSearchOpen, onSettingsOpen, lastUpdatedAt }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-12 px-6 bg-[#0A0A0A] border-b border-[#1F1F1F]">
      <span className="text-[0.875rem] font-semibold tracking-[-0.01em] text-[#EDEDED]">● Wire</span>
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={onSearchOpen} className="text-[#555555]">
          <Search size={14} />
          <span className="font-mono text-[0.75rem]">⌘K</span>
        </Button>
        <Button variant="ghost" onClick={onSettingsOpen} aria-label="Settings"><Settings size={14} /></Button>
        <LivePulse lastUpdatedAt={lastUpdatedAt} />
      </div>
    </header>
  )
}
