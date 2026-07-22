import { useFilterStore } from '../../stores/filterStore'
import { Button } from '../ui/Button'

const FILTERS = [
  { label: 'All', value: null },
  { label: 'Earnings', value: 'earnings' },
  { label: 'M&A', value: 'm&a' },
  { label: 'Macro', value: 'macro' },
  { label: 'SEC Filings', value: 'sec-filing' },
  { label: 'Press Releases', value: 'press-release' },
] as const

export function FilterBar() {
  const { activeCategory, setCategory } = useFilterStore()
  return (
    <div className="sticky top-12 z-30 flex items-center gap-1 px-4 py-2 bg-[#0A0A0A] border-b border-[#1F1F1F] overflow-x-auto">
      {FILTERS.map(({ label, value }) => (
        <Button key={label} variant="pill" active={activeCategory === value} onClick={() => setCategory(value)}>
          {label}
        </Button>
      ))}
    </div>
  )
}
