import { useState } from 'react'
import { Shell } from './components/layout/Shell'
import { ArticleFeed } from './components/feed/ArticleFeed'
import { Sidebar } from './components/layout/Sidebar'
import { SettingsPanel } from './components/settings/SettingsPanel'
import { CommandPalette } from './components/search/CommandPalette'
import { useFeedStore } from './stores/feedStore'

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const focusedIndex = useFeedStore(s => s.focusedIndex)

  return (
    <>
      <Shell
        onSearchOpen={() => setPaletteOpen(true)}
        onSettingsOpen={() => setSettingsOpen(true)}
        onCommandPaletteOpen={() => setPaletteOpen(true)}
      >
        <main className="flex-1 min-w-0 border-r border-[#1F1F1F]">
          <ArticleFeed focusedIndex={focusedIndex} onConfigureClick={() => setSettingsOpen(true)} />
        </main>
        <aside className="w-[280px] shrink-0 hidden lg:block">
          <Sidebar onSettingsOpen={() => setSettingsOpen(true)} />
        </aside>
      </Shell>
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  )
}
