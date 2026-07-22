import { create } from 'zustand'
import type { ProviderSource } from '../lib/hash'
import type { ProviderConfig } from '../providers/types'
import { DEFAULT_POLL_INTERVALS } from '../lib/constants'

interface ConfigState {
  corsProxyUrl: string
  providers: Record<ProviderSource, ProviderConfig>
  watchlistSymbols: string[]
  displayDensity: 'compact' | 'comfortable'
  autoRefresh: boolean
  setCorsProxyUrl(url: string): void
  setProviderConfig(source: ProviderSource, config: Partial<ProviderConfig>): void
  setProviderError(source: ProviderSource, error: string): void
  clearProviderError(source: ProviderSource): void
  addWatchlistSymbol(symbol: string): void
  removeWatchlistSymbol(symbol: string): void
}

function defaultProviders(): Record<ProviderSource, ProviderConfig> {
  const sources: ProviderSource[] = ['FMP', 'ALPACA', 'RSS', 'SEC', 'WEBHOOK']
  return Object.fromEntries(
    sources.map(s => [s, { enabled: s !== 'WEBHOOK', poll_interval_ms: DEFAULT_POLL_INTERVALS[s], consecutiveFailures: 0 }])
  ) as Record<ProviderSource, ProviderConfig>
}

const STORAGE_KEY = 'wire:config'

function persist(state: ConfigState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    corsProxyUrl: state.corsProxyUrl,
    providers: Object.fromEntries(
      Object.entries(state.providers).map(([k, v]) => [k, {
        enabled: v.enabled, api_key: v.api_key,
        poll_interval_ms: v.poll_interval_ms, custom_feeds: v.custom_feeds,
        consecutiveFailures: 0,
      }])
    ),
    watchlistSymbols: state.watchlistSymbols,
    displayDensity: state.displayDensity,
    autoRefresh: state.autoRefresh,
  }))
}

function loadFromStorage(): Partial<ConfigState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return { ...parsed, providers: { ...defaultProviders(), ...parsed.providers } }
  } catch { return {} }
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  corsProxyUrl: '', providers: defaultProviders(), watchlistSymbols: [],
  displayDensity: 'comfortable', autoRefresh: true,
  ...loadFromStorage(),

  setCorsProxyUrl(url) { set({ corsProxyUrl: url }); persist(get()) },

  setProviderConfig(source, config) {
    set(s => ({ providers: { ...s.providers, [source]: { ...s.providers[source], ...config } } }))
    persist(get())
  },

  setProviderError(source, error) {
    set(s => ({
      providers: {
        ...s.providers,
        [source]: { ...s.providers[source], lastError: error, lastErrorAt: new Date().toISOString(), consecutiveFailures: s.providers[source].consecutiveFailures + 1 },
      },
    }))
  },

  clearProviderError(source) {
    set(s => ({
      providers: { ...s.providers, [source]: { ...s.providers[source], lastError: undefined, lastErrorAt: undefined, consecutiveFailures: 0 } },
    }))
  },

  addWatchlistSymbol(symbol) {
    set(s => ({ watchlistSymbols: [...new Set([...s.watchlistSymbols, symbol.toUpperCase()])] }))
    persist(get())
  },

  removeWatchlistSymbol(symbol) {
    set(s => ({ watchlistSymbols: s.watchlistSymbols.filter(sym => sym !== symbol.toUpperCase()) }))
    persist(get())
  },
}))
