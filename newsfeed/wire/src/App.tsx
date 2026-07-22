import { useState } from 'react'
import { Shell } from './components/layout/Shell'

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <Shell onSearchOpen={() => {}} onSettingsOpen={() => setSettingsOpen(true)}>
      <main className="flex-1 min-w-0 border-r border-[#1F1F1F]">
        <p className="p-6 font-mono text-[0.8125rem] text-[#555555]">Feed coming in Task 12</p>
      </main>
      <aside className="w-[280px] shrink-0 hidden lg:block">
        <p className="p-6 font-mono text-[0.8125rem] text-[#555555]">Sidebar coming in Task 13</p>
      </aside>
    </Shell>
  )
}
