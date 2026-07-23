import { create } from 'zustand'
import type { ProviderSource } from '../lib/hash'
import type { ProviderConfig } from '../providers/types'
import { DEFAULT_POLL_INTERVALS } from '../lib/constants'

// Build-time defaults from .env (VITE_ prefix makes them available in the browser bundle)
const ENV_CORS_PROXY   = (import.meta.env.VITE_CORS_PROXY_URL          as string) || ''
const ENV_FMP_KEY      = (import.meta.env.VITE_FMP_API_KEY              as string) || ''
const ENV_ALPACA_KEY   = (import.meta.env.VITE_ALPACA_API_KEY           as string) || ''
const ENV_EXTRACTOR    = (import.meta.env.VITE_ARTICLE_EXTRACTOR_URL    as string) || ''

interface ConfigState {
  corsProxyUrl: string
  articleExtractorUrl: string
  providers: Record<ProviderSource, ProviderConfig>
  watchlistSymbols: string[]
  displayDensity: 'compact' | 'comfortable'
  autoRefresh: boolean
  setCorsProxyUrl(url: string): void
  setArticleExtractorUrl(url: string): void
  setProviderConfig(source: ProviderSource, config: Partial<ProviderConfig>): void
  setProviderError(source: ProviderSource, error: string): void
  clearProviderError(source: ProviderSource): void
  setPollInterval(source: ProviderSource, ms: number): void
  addWatchlistSymbol(symbol: string): void
  removeWatchlistSymbol(symbol: string): void
  setDisplayDensity(density: 'compact' | 'comfortable'): void
  setAutoRefresh(value: boolean): void
}

function defaultProviders(): Record<ProviderSource, ProviderConfig> {
  return {
    FMP:     { enabled: !!ENV_FMP_KEY,    api_key: ENV_FMP_KEY,    poll_interval_ms: DEFAULT_POLL_INTERVALS.FMP,     consecutiveFailures: 0 },
    ALPACA:  { enabled: !!ENV_ALPACA_KEY, api_key: ENV_ALPACA_KEY, poll_interval_ms: DEFAULT_POLL_INTERVALS.ALPACA,  consecutiveFailures: 0 },
    RSS:     { enabled: true,                                       poll_interval_ms: DEFAULT_POLL_INTERVALS.RSS,     consecutiveFailures: 0 },
    SEC:     { enabled: true,                                       poll_interval_ms: DEFAULT_POLL_INTERVALS.SEC,     consecutiveFailures: 0 },
    WEBHOOK: { enabled: false,                                      poll_interval_ms: DEFAULT_POLL_INTERVALS.WEBHOOK, consecutiveFailures: 0 },
  }
}

const STORAGE_KEY = 'wire:config'

function persist(state: ConfigState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    corsProxyUrl: state.corsProxyUrl,
    articleExtractorUrl: state.articleExtractorUrl,
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
    const defaults = defaultProviders()
    // Env vars fill in any gaps: if a stored key is empty, fall back to the env default
    return {
      ...parsed,
      corsProxyUrl: parsed.corsProxyUrl || ENV_CORS_PROXY,
      articleExtractorUrl: parsed.articleExtractorUrl || ENV_EXTRACTOR,
      providers: {
        ...defaults,
        ...parsed.providers,
        FMP:    { ...defaults.FMP,    ...parsed.providers?.FMP,    api_key: parsed.providers?.FMP?.api_key    || ENV_FMP_KEY },
        ALPACA: { ...defaults.ALPACA, ...parsed.providers?.ALPACA, api_key: parsed.providers?.ALPACA?.api_key || ENV_ALPACA_KEY },
      },
    }
  } catch { return {} }
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  corsProxyUrl: ENV_CORS_PROXY, articleExtractorUrl: ENV_EXTRACTOR,
  providers: defaultProviders(), watchlistSymbols: [],
  displayDensity: 'comfortable', autoRefresh: true,
  ...loadFromStorage(),

  setCorsProxyUrl(url) { set({ corsProxyUrl: url }); persist(get()) },
  setArticleExtractorUrl(url) { set({ articleExtractorUrl: url }); persist(get()) },

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

  setPollInterval(source, ms) {
    set(s => ({ providers: { ...s.providers, [source]: { ...s.providers[source], poll_interval_ms: ms } } }))
    persist(get())
  },

  addWatchlistSymbol(symbol) {
    set(s => ({ watchlistSymbols: [...new Set([...s.watchlistSymbols, symbol.toUpperCase()])] }))
    persist(get())
  },

  removeWatchlistSymbol(symbol) {
    set(s => ({ watchlistSymbols: s.watchlistSymbols.filter(sym => sym !== symbol.toUpperCase()) }))
    persist(get())
  },

  setDisplayDensity(density) {
    set({ displayDensity: density })
    persist(get())
  },

  setAutoRefresh(value) {
    set({ autoRefresh: value })
    persist(get())
  },
}))
