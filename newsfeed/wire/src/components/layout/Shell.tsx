import { useEffect, useRef, useState } from 'react'
import { Header } from './Header'
import { createCoordinator } from '../../services/coordinator'
import type { ProviderCoordinator } from '../../services/coordinator'

interface ShellProps {
  children: React.ReactNode
  onSearchOpen(): void
  onSettingsOpen(): void
}

export function Shell({ children, onSearchOpen, onSettingsOpen }: ShellProps) {
  const coordinatorRef = useRef<ProviderCoordinator | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)

  useEffect(() => {
    const coordinator = createCoordinator()
    coordinatorRef.current = coordinator
    coordinator.start()
    setLastUpdatedAt(new Date())
    const id = setInterval(() => setLastUpdatedAt(new Date()), 30_000)
    return () => { coordinator.stop(); clearInterval(id) }
  }, [])

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Header onSearchOpen={onSearchOpen} onSettingsOpen={onSettingsOpen} lastUpdatedAt={lastUpdatedAt} />
      <div className="flex max-w-[1080px] mx-auto">
        {children}
      </div>
    </div>
  )
}
