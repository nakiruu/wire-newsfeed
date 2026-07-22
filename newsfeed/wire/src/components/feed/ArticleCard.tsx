import { useFeedStore } from '../../stores/feedStore'
import { Badge } from '../ui/Badge'
import { Tooltip } from '../ui/Tooltip'
import { useRelativeTime } from '../../hooks/useRelativeTime'
import type { Article } from '../../providers/types'

const SENTIMENT_COLORS = {
  bullish: 'bg-[#00C853]',
  bearish: 'bg-[#FF4444]',
  neutral: 'bg-[#555555]',
} as const

export function ArticleCard({ article, focused }: { article: Article; focused?: boolean }) {
  const { readIds, bookmarkIds, markRead, toggleBookmark } = useFeedStore()
  const isRead = readIds.has(article.id)
  const isBookmarked = bookmarkIds.has(article.id)
  const relativeTime = useRelativeTime(article.published_at)

  function open() {
    markRead(article.id)
    window.open(article.url, '_blank', 'noopener,noreferrer')
  }

  function handleBookmark(e: React.MouseEvent) {
    e.stopPropagation()
    toggleBookmark(article.id)
  }

  return (
    <article
      data-testid="article-card"
      className={[
        'relative flex gap-3 px-4 py-3 border-b border-[#1F1F1F] cursor-pointer transition-colors duration-[150ms] ease-linear',
        isRead ? 'bg-[#0A0A0A]' : 'bg-[#111111]',
        focused ? 'ring-1 ring-[#0070F3] ring-inset' : '',
        'hover:bg-[#1A1A1A]',
      ].filter(Boolean).join(' ')}
      onClick={open}
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && open()}
      aria-label={article.title}
    >
      {/* Unread left border */}
      {!isRead && (
        <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#0070F3]" aria-hidden="true" />
      )}

      <div className="flex-1 min-w-0">
        {/* Row 1: ticker badges, relative time, source, category */}
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          {article.symbols.slice(0, 3).map(sym => (
            <Badge key={sym} variant="ticker">{sym}</Badge>
          ))}
          <Tooltip content={new Date(article.published_at).toISOString()}>
            <span className="text-[0.8125rem] text-[#555555]">{relativeTime}</span>
          </Tooltip>
          <span className="text-[0.8125rem] text-[#555555]">{article.provider_label}</span>
          {article.category && (
            <>
              <span className="text-[#333333]">•</span>
              <Badge variant="category">{article.category}</Badge>
            </>
          )}
        </div>

        {/* Row 2: title */}
        <h3
          className={[
            'text-[1rem] font-semibold leading-[1.5] tracking-[-0.01em] truncate',
            isRead ? 'text-[#888888]' : 'text-[#EDEDED]',
          ].join(' ')}
        >
          {article.title}
        </h3>

        {/* Row 3: summary */}
        {article.summary && (
          <p className="mt-0.5 text-[0.875rem] text-[#888888] leading-[1.5] line-clamp-2">
            {article.summary}
          </p>
        )}

        {/* Row 4: sentiment + also reported by */}
        {(article.sentiment || (article.also_reported_by && article.also_reported_by.length > 0)) && (
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {article.sentiment && (
              <span
                className={`w-1.5 h-1.5 rounded-full ${SENTIMENT_COLORS[article.sentiment]}`}
                aria-label={article.sentiment}
              />
            )}
            {article.also_reported_by && article.also_reported_by.length > 0 && (
              <span className="text-[0.75rem] text-[#555555]">
                Also: {article.also_reported_by.join(', ')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bookmark star icon */}
      <button
        className={[
          'self-start mt-0.5 p-1 rounded transition-colors duration-[150ms] shrink-0',
          isBookmarked
            ? 'text-[#0070F3]'
            : 'text-[#333333] hover:text-[#888888]',
        ].join(' ')}
        onClick={handleBookmark}
        aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark article'}
        tabIndex={0}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={isBookmarked ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </button>
    </article>
  )
}
