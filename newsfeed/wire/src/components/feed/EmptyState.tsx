import { useFilterStore } from '../../stores/filterStore'
import { Button } from '../ui/Button'

interface EmptyStateProps {
  variant: 'no-results' | 'no-providers'
  onConfigureClick?(): void
}

export function EmptyState({ variant, onConfigureClick }: EmptyStateProps) {
  const setCategory = useFilterStore(s => s.setCategory)
  if (variant === 'no-providers') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-[0.875rem] text-[#888888] mb-3">Add a news source to get started.</p>
        <Button variant="ghost" onClick={onConfigureClick} className="text-[#0070F3]">Configure sources →</Button>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-[0.875rem] text-[#888888] mb-3">No articles match your filters.</p>
      <Button variant="ghost" onClick={() => setCategory(null)} className="text-[#0070F3]">Clear filters</Button>
    </div>
  )
}
