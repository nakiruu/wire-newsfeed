import { useFeedStore } from '../../stores/feedStore'

export function NewArticlesBanner({ onFlush }: { onFlush(): void }) {
  const count = useFeedStore(s => s.pendingArticles.length)
  if (count === 0) return null
  return (
    <div className="sticky top-[88px] z-20 flex justify-center py-2 pointer-events-none">
      <button
        onClick={onFlush}
        className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 bg-[#0070F3] text-white text-[0.8125rem] font-medium rounded-[8px] shadow-lg hover:bg-[#0070F3]/90 transition-colors duration-[150ms]"
        aria-live="polite"
        aria-label={`${count} new ${count === 1 ? 'article' : 'articles'} — click to load`}
      >
        ↑ {count} new {count === 1 ? 'article' : 'articles'}
      </button>
    </div>
  )
}
