import { useEffect, useState } from 'react'
import { X, Check, AlertCircle } from 'lucide-react'
import { useConfigStore } from '../../stores/configStore'
import { proxyFetch } from '../../lib/api'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Toggle } from '../ui/Toggle'
import type { ProviderSource } from '../../lib/hash'

type ValidationStatus = 'idle' | 'testing' | 'ok' | 'error'

function StatusBadge({ status }: { status: ValidationStatus }) {
  if (status === 'ok') return <Check size={14} className="text-[#00C853] shrink-0" aria-label="valid" />
  if (status === 'error') return <AlertCircle size={14} className="text-[#FF4444] shrink-0" aria-label="invalid" />
  return null
}

function ApiKeyField({ source, placeholder, hint, validate }: {
  source: ProviderSource
  placeholder: string
  hint?: string
  validate(key: string): Promise<boolean>
}) {
  const { providers, setProviderConfig } = useConfigStore()
  const [value, setValue] = useState(providers[source].api_key ?? '')
  const [status, setStatus] = useState<ValidationStatus>('idle')

  async function handleSave() {
    setStatus('testing')
    try {
      const ok = await validate(value)
      setStatus(ok ? 'ok' : 'error')
      if (ok) setProviderConfig(source, { api_key: value })
    } catch { setStatus('error') }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Input
          type="password"
          value={value}
          onChange={e => { setValue(e.target.value); setStatus('idle') }}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!value || status === 'testing'}
        >
          {status === 'testing' ? '…' : 'Save'}
        </Button>
        <StatusBadge status={status} />
      </div>
      {hint && <p className="text-[0.75rem] text-[#555555]">{hint}</p>}
      {status === 'error' && (
        <p className="text-[0.75rem] text-[#FF4444]">
          Check your CORS proxy URL and API credentials.
        </p>
      )}
    </div>
  )
}

export function SettingsPanel({ open, onClose }: { open: boolean; onClose(): void }) {
  const {
    corsProxyUrl, setCorsProxyUrl,
    articleExtractorUrl, setArticleExtractorUrl,
    providers, setProviderConfig,
    watchlistSymbols, addWatchlistSymbol, removeWatchlistSymbol,
    displayDensity, setDisplayDensity,
    autoRefresh, setAutoRefresh,
  } = useConfigStore()

  const [proxyInput, setProxyInput] = useState(corsProxyUrl)
  const [proxyTestStatus, setProxyTestStatus] = useState<ValidationStatus>('idle')
  const [extractorInput, setExtractorInput] = useState(articleExtractorUrl)
  const [extractorTestStatus, setExtractorTestStatus] = useState<ValidationStatus>('idle')
  const [rssFeedInput, setRssFeedInput] = useState((providers.RSS.custom_feeds ?? []).join('\n'))
  const [newSymbol, setNewSymbol] = useState('')

  useEffect(() => { setProxyInput(corsProxyUrl) }, [corsProxyUrl])
  useEffect(() => { setExtractorInput(articleExtractorUrl) }, [articleExtractorUrl])

  // Escape key closes the panel
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  async function testProxy() {
    setProxyTestStatus('testing')
    try {
      const testUrl = corsProxyUrl.replace(/\/$/, '') + '/https://httpbin.org/get'
      const res = await fetch(testUrl)
      setProxyTestStatus(res.ok ? 'ok' : 'error')
    } catch {
      setProxyTestStatus('error')
    }
  }

  async function testExtractor() {
    setExtractorTestStatus('testing')
    try {
      const res = await fetch(articleExtractorUrl.replace(/\/$/, '') + '/health')
      setExtractorTestStatus(res.ok ? 'ok' : 'error')
    } catch {
      setExtractorTestStatus('error')
    }
  }

  async function validateFmp(key: string) {
    const res = await proxyFetch(`https://financialmodelingprep.com/api/v3/stock_news?limit=1&apikey=${key}`)
    return res.ok
  }

  async function validateAlpaca(key: string) {
    const [apiKey, secretKey] = key.split(':')
    if (!apiKey || !secretKey) return false
    const res = await proxyFetch('https://data.alpaca.markets/v1beta1/news?limit=1', {
      headers: { 'APCA-API-KEY-ID': apiKey, 'APCA-API-SECRET-KEY': secretKey },
    })
    return res.ok
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-[150ms] ease-linear ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      {...(open ? { role: 'dialog', 'aria-label': 'Settings' } : {})}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-[150ms] ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={`relative w-[400px] h-full bg-[#111111] border-l border-[#1F1F1F] overflow-y-auto flex flex-col transition-transform duration-[150ms] ease-linear ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 bg-[#111111] border-b border-[#1F1F1F] z-10">
          <h2 className="text-[0.875rem] font-semibold text-[#EDEDED]">Settings</h2>
          <Button variant="ghost" onClick={onClose} aria-label="Close settings">
            <X size={14} />
          </Button>
        </div>

        <div className="p-5 space-y-8">

          {/* CORS Proxy */}
          <section aria-labelledby="section-proxy">
            <h3 id="section-proxy" className="text-[0.75rem] font-mono text-[#555555] uppercase tracking-[0.08em] mb-3">
              CORS Proxy
            </h3>
            <div className="flex gap-2">
              <Input
                value={proxyInput}
                onChange={e => { setProxyInput(e.target.value); setProxyTestStatus('idle') }}
                placeholder="http://192.168.1.x:8080"
                aria-label="CORS proxy URL"
              />
              <Button variant="primary" onClick={() => { setCorsProxyUrl(proxyInput); setProxyTestStatus('idle') }}>
                Save
              </Button>
              <Button
                variant="ghost"
                onClick={testProxy}
                disabled={!corsProxyUrl || proxyTestStatus === 'testing'}
                aria-label="Test CORS proxy"
              >
                Test
              </Button>
              <StatusBadge status={proxyTestStatus} />
            </div>
            <p className="mt-1.5 text-[0.75rem] text-[#555555]">
              Self-hosted cors-anywhere on your Unraid instance.
            </p>
          </section>

          {/* Article Extractor */}
          <section aria-labelledby="section-extractor">
            <h3 id="section-extractor" className="text-[0.75rem] font-mono text-[#555555] uppercase tracking-[0.08em] mb-3">
              Article Extractor
            </h3>
            <div className="flex gap-2">
              <Input
                value={extractorInput}
                onChange={e => { setExtractorInput(e.target.value); setExtractorTestStatus('idle') }}
                placeholder="http://192.168.1.x:7825"
                aria-label="Article extractor URL"
              />
              <Button variant="primary" onClick={() => { setArticleExtractorUrl(extractorInput); setExtractorTestStatus('idle') }}>
                Save
              </Button>
              <Button
                variant="ghost"
                onClick={testExtractor}
                disabled={!articleExtractorUrl || extractorTestStatus === 'testing'}
                aria-label="Test article extractor"
              >
                Test
              </Button>
              <StatusBadge status={extractorTestStatus} />
            </div>
            <p className="mt-1.5 text-[0.75rem] text-[#555555]">
              Self-hosted Trafilatura service (port 7825). Enables Reader mode on articles.
            </p>
          </section>

          {/* FMP */}
          <section aria-labelledby="section-fmp">
            <div className="flex items-center justify-between mb-3">
              <h3 id="section-fmp" className="text-[0.75rem] font-mono text-[#555555] uppercase tracking-[0.08em]">
                FMP
              </h3>
              <Toggle
                checked={providers.FMP.enabled}
                onChange={v => setProviderConfig('FMP', { enabled: v })}
              />
            </div>
            <ApiKeyField
              source="FMP"
              placeholder="Your FMP API key"
              validate={validateFmp}
            />
            <div className="mt-3 space-y-1">
              <label className="text-[0.75rem] text-[#555555]">Poll interval (s)</label>
              <Input
                type="number"
                min={10}
                value={providers.FMP.poll_interval_ms / 1000}
                onChange={e => useConfigStore.getState().setPollInterval('FMP', Number(e.target.value) * 1000)}
                aria-label="FMP poll interval"
              />
            </div>
          </section>

          {/* Alpaca */}
          <section aria-labelledby="section-alpaca">
            <div className="flex items-center justify-between mb-3">
              <h3 id="section-alpaca" className="text-[0.75rem] font-mono text-[#555555] uppercase tracking-[0.08em]">
                Alpaca
              </h3>
              <Toggle
                checked={providers.ALPACA.enabled}
                onChange={v => setProviderConfig('ALPACA', { enabled: v })}
              />
            </div>
            <ApiKeyField
              source="ALPACA"
              placeholder="API_KEY_ID:SECRET_KEY"
              hint="Format: your-key-id:your-secret-key"
              validate={validateAlpaca}
            />
            <div className="mt-3 space-y-1">
              <label className="text-[0.75rem] text-[#555555]">Poll interval (s)</label>
              <Input
                type="number"
                min={10}
                value={providers.ALPACA.poll_interval_ms / 1000}
                onChange={e => useConfigStore.getState().setPollInterval('ALPACA', Number(e.target.value) * 1000)}
                aria-label="Alpaca poll interval"
              />
            </div>
          </section>

          {/* RSS Feeds */}
          <section aria-labelledby="section-rss">
            <div className="flex items-center justify-between mb-3">
              <h3 id="section-rss" className="text-[0.75rem] font-mono text-[#555555] uppercase tracking-[0.08em]">
                RSS Feeds
              </h3>
              <Toggle
                checked={providers.RSS.enabled}
                onChange={v => setProviderConfig('RSS', { enabled: v })}
              />
            </div>
            <textarea
              value={rssFeedInput}
              onChange={e => setRssFeedInput(e.target.value)}
              rows={5}
              placeholder="One feed URL per line"
              aria-label="RSS feed URLs"
              className="w-full bg-[#0A0A0A] border border-[#1F1F1F] rounded-[8px] p-3 text-[0.8125rem] font-mono text-[#EDEDED] placeholder-[#555555] focus:border-[#0070F3] focus:outline-none resize-none"
            />
            <Button
              variant="ghost"
              className="mt-1.5 text-[#0070F3]"
              onClick={() =>
                setProviderConfig('RSS', {
                  custom_feeds: rssFeedInput
                    .split('\n')
                    .map(s => s.trim())
                    .filter(Boolean),
                })
              }
            >
              Save feeds
            </Button>
          </section>

          {/* SEC EDGAR */}
          <section aria-labelledby="section-sec">
            <div className="flex items-center justify-between">
              <h3 id="section-sec" className="text-[0.75rem] font-mono text-[#555555] uppercase tracking-[0.08em]">
                SEC EDGAR
              </h3>
              <Toggle
                checked={providers.SEC.enabled}
                onChange={v => setProviderConfig('SEC', { enabled: v })}
              />
            </div>
            <p className="mt-1.5 text-[0.75rem] text-[#555555]">
              No API key required. Polls 8-K, 10-Q, 10-K filings.
            </p>
          </section>

          {/* Watchlist */}
          <section aria-labelledby="section-watchlist">
            <h3 id="section-watchlist" className="text-[0.75rem] font-mono text-[#555555] uppercase tracking-[0.08em] mb-3">
              Watchlist
            </h3>
            <div className="flex gap-2 mb-2">
              <Input
                value={newSymbol}
                onChange={e => setNewSymbol(e.target.value.toUpperCase())}
                placeholder="AAPL"
                aria-label="New watchlist symbol"
                onKeyDown={e => {
                  if (e.key === 'Enter' && newSymbol) {
                    addWatchlistSymbol(newSymbol)
                    setNewSymbol('')
                  }
                }}
              />
              <Button
                variant="primary"
                onClick={() => { addWatchlistSymbol(newSymbol); setNewSymbol('') }}
                disabled={!newSymbol}
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {watchlistSymbols.map(sym => (
                <button
                  key={sym}
                  onClick={() => removeWatchlistSymbol(sym)}
                  aria-label={`Remove ${sym}`}
                  className="flex items-center gap-1 px-2 py-0.5 font-mono text-[0.75rem] text-[#888888] bg-[#1A1A1A] border border-[#1F1F1F] rounded-[6px] hover:border-[#FF4444]/50 hover:text-[#FF4444] transition-colors duration-[150ms]"
                >
                  {sym} <X size={10} />
                </button>
              ))}
            </div>
          </section>

          {/* Display */}
          <section aria-labelledby="section-display">
            <h3 id="section-display" className="text-[0.75rem] font-mono text-[#555555] uppercase tracking-[0.08em] mb-3">
              Display
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[0.8125rem] text-[#888888]">Density</span>
                <div className="flex items-center gap-2">
                  <button
                    aria-label="Set compact density"
                    className={`px-2 py-0.5 text-[0.75rem] rounded-[6px] border transition-colors duration-[150ms] ${displayDensity === 'compact' ? 'border-[#0070F3] text-[#0070F3]' : 'border-[#1F1F1F] text-[#555555] hover:border-[#333333]'}`}
                    onClick={() => setDisplayDensity('compact')}
                  >
                    Compact
                  </button>
                  <button
                    aria-label="Set comfortable density"
                    className={`px-2 py-0.5 text-[0.75rem] rounded-[6px] border transition-colors duration-[150ms] ${displayDensity === 'comfortable' ? 'border-[#0070F3] text-[#0070F3]' : 'border-[#1F1F1F] text-[#555555] hover:border-[#333333]'}`}
                    onClick={() => setDisplayDensity('comfortable')}
                  >
                    Comfortable
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[0.8125rem] text-[#888888]">Auto Refresh</span>
                <Toggle
                  checked={autoRefresh}
                  onChange={setAutoRefresh}
                />
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
