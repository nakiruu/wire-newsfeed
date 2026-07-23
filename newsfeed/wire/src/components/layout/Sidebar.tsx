import { useState, useEffect } from 'react'
import { useConfigStore } from '../../stores/configStore'
import { useFilterStore } from '../../stores/filterStore'
import { useFeedStore } from '../../stores/feedStore'
import { Toggle } from '../ui/Toggle'
import { Sparkline } from '../ui/Sparkline'
import { proxyFetch } from '../../lib/api'
import { PROVIDER_LABELS } from '../../lib/constants'
import type { ProviderSource } from '../../lib/hash'

function WatchlistItem({ symbol, apiKey }: { symbol: string; apiKey?: string }) {
  const [pct, setPct] = useState<number | null>(null)
  useEffect(() => {
    if (!apiKey) return
    proxyFetch(`https://financialmodelingprep.com/api/v3/quote-short/${symbol}?apikey=${apiKey}`)
      .then(r => r.json())
      .then((d: { changesPercentage?: number }[]) => {
        if (d[0]?.changesPercentage !== undefined) setPct(d[0].changesPercentage)
      })
      .catch(() => {})
  }, [symbol, apiKey])
  const color = pct === null ? 'text-[#555555]' : pct >= 0 ? 'text-[#00C853]' : 'text-[#FF4444]'
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="font-mono text-[0.8125rem] text-[#EDEDED]">{symbol}</span>
      <span className={`font-mono text-[0.8125rem] ${color}`}>
        {pct === null ? 'â€”' : `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`}
      </span>
    </div>
  )
}

export function buildSparklineData(articles: { ingested_at: string }[]): { data: number[]; currentHourIndex: number } {
  const now = new Date()
  const data = Array(24).fill(0)
  for (const a of articles) {
    const hoursAgo = Math.floor((now.getTime() - new Date(a.ingested_at).getTime()) / 3_600_000)
    if (hoursAgo >= 0 && hoursAgo < 24) data[23 - hoursAgo]++
  }
  return { data, currentHourIndex: 23 }
}

const DISPLAY_SOURCES: ProviderSource[] = ['FINNHUB', 'ALPACA', 'RSS', 'SEC']

export function Sidebar({ onSettingsOpen }: { onSettingsOpen(): void }) {
  const { providers, watchlistSymbols } = useConfigStore()
  const { toggleSource, activeSources } = useFilterStore()
  const allArticles = useFeedStore(s => s.articles)
  const fmpKey = providers.FINNHUB?.api_key
  const { data, currentHourIndex } = buildSparklineData(allArticles)

  return (
    <div className="sticky top-12 h-[calc(100vh-3rem)] overflow-y-auto p-4 space-y-6">
      {watchlistSymbols.length > 0 && (
        <section aria-label="Watchlist">
          <h2 className="text-[0.75rem] font-mono text-[#555555] uppercase tracking-[0.08em] mb-2">
            Watchlist
          </h2>
          <div className="divide-y divide-[#1F1F1F]">
            {watchlistSymbols.map(sym => (
              <WatchlistItem key={sym} symbol={sym} apiKey={fmpKey} />
            ))}
          </div>
        </section>
      )}

      <section aria-label="Sources">
        <h2 className="text-[0.75rem] font-mono text-[#555555] uppercase tracking-[0.08em] mb-2">
          Sources
        </h2>
        <div className="space-y-2">
          {DISPLAY_SOURCES.map(source => {
            const config = providers[source]
            const hasError = config.consecutiveFailures >= 2
            return (
              <div key={source} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Toggle
                    checked={activeSources.has(source)}
                    onChange={() => toggleSource(source)}
                    disabled={!config.enabled}
                  />
                  <span className="text-[0.8125rem] text-[#888888]">
                    {PROVIDER_LABELS[source]}
                  </span>
                </div>
                {hasError && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-[#FF4444]"
                    title={config.lastError}
                    aria-label={`${PROVIDER_LABELS[source]} error`}
                  />
                )}
              </div>
            )
          })}
        </div>
        <button
          onClick={onSettingsOpen}
          className="mt-3 text-[0.75rem] text-[#0070F3] hover:opacity-80 transition-opacity"
        >
          Configure â†’
        </button>
      </section>

      {allArticles.length > 0 && (
        <section aria-label="Activity">
          <h2 className="text-[0.75rem] font-mono text-[#555555] uppercase tracking-[0.08em] mb-2">
            Activity (24h)
          </h2>
          <Sparkline data={data} currentHourIndex={currentHourIndex} height={32} />
          <p className="mt-1 text-[0.75rem] font-mono text-[#555555]">
            {allArticles.length} articles
          </p>
        </section>
      )}
    </div>
  )
}
