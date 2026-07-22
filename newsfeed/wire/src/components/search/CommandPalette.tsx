import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { useArticleSearch } from '../../hooks/useArticleSearch'
import { useFeedStore } from '../../stores/feedStore'
import { useConfigStore } from '../../stores/configStore'
import { Badge } from '../ui/Badge'
import { PROVIDER_LABELS } from '../../lib/constants'
import type { ProviderSource } from '../../lib/hash'

export function CommandPalette({ open, onClose }: { open: boolean; onClose(): void }) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const { markRead } = useFeedStore()
  const providers = useConfigStore(s => s.providers)
  const results = useArticleSearch(query)

  useEffect(() => {
    if (open) { setQuery(''); setSelectedIndex(0); setTimeout(() => inputRef.current?.focus(), 50) }
  }, [open])
  useEffect(() => { setSelectedIndex(0) }, [query])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && results[selectedIndex]) {
      markRead(results[selectedIndex].id)
      window.open(results[selectedIndex].url, '_blank', 'noopener,noreferrer')
      onClose()
    }
  }

  if (!open) return null

  const providerStatuses = Object.entries(providers)
    .filter(([k]) => k !== 'WEBHOOK')
    .map(([k, v]) => ({ source: k as ProviderSource, label: PROVIDER_LABELS[k as ProviderSource], hasError: v.consecutiveFailures >= 2, enabled: v.enabled }))

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative w-full max-w-[600px] mx-4 bg-[#111111] border border-[#1F1F1F] rounded-[12px] shadow-2xl overflow-hidden"
        onKeyDown={handleKeyDown}
        data-testid="command-palette-box"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1F1F1F]">
          <Search size={14} className="text-[#555555] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search articles, symbols…"
            className="flex-1 bg-transparent text-[0.875rem] text-[#EDEDED] placeholder-[#555555] focus:outline-none"
            data-testid="command-palette-input"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-[#555555] hover:text-[#888888]">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {results.length > 0 ? (
            <>
              <p className="px-4 py-2 text-[0.75rem] font-mono text-[#555555] uppercase tracking-[0.08em]">Articles</p>
              {results.map((article, i) => (
                <button
                  key={article.id}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors duration-[150ms] ${i === selectedIndex ? 'bg-[#1A1A1A]' : 'hover:bg-[#1A1A1A]'}`}
                  data-testid={`result-item-${i}`}
                  data-selected={i === selectedIndex ? 'true' : undefined}
                  onClick={() => { markRead(article.id); window.open(article.url, '_blank', 'noopener,noreferrer'); onClose() }}
                >
                  <div className="flex gap-1 pt-0.5 shrink-0">
                    {article.symbols.slice(0, 2).map(s => <Badge key={s} variant="ticker">{s}</Badge>)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.875rem] text-[#EDEDED] truncate">{article.title}</p>
                    <p className="text-[0.75rem] text-[#555555] mt-0.5">{article.provider_label}</p>
                  </div>
                </button>
              ))}
            </>
          ) : query ? (
            <p className="px-4 py-6 text-[0.875rem] text-[#555555] text-center" data-testid="no-results">
              No results for &ldquo;{query}&rdquo;
            </p>
          ) : null}
          <div className="px-4 py-3 border-t border-[#1F1F1F]">
            <p className="text-[0.75rem] font-mono text-[#555555] uppercase tracking-[0.08em] mb-2">Provider Status</p>
            <div className="flex flex-wrap gap-3">
              {providerStatuses.map(({ source, label, hasError, enabled }) => (
                <span
                  key={source}
                  className={`flex items-center gap-1.5 text-[0.75rem] font-mono ${!enabled ? 'text-[#333333]' : hasError ? 'text-[#FF4444]' : 'text-[#555555]'}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${!enabled ? 'bg-[#333333]' : hasError ? 'bg-[#FF4444]' : 'bg-[#00C853]'}`} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
