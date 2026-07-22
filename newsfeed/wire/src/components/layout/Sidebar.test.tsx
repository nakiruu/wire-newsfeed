import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Sidebar, buildSparklineData } from './Sidebar'
import { useConfigStore } from '../../stores/configStore'
import { useFilterStore } from '../../stores/filterStore'
import { useFeedStore } from '../../stores/feedStore'
import type { ProviderConfig } from '../../providers/types'
import type { ProviderSource } from '../../lib/hash'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProviders(overrides: Partial<Record<ProviderSource, Partial<ProviderConfig>>> = {}): Record<ProviderSource, ProviderConfig> {
  const base: ProviderConfig = { enabled: true, poll_interval_ms: 60_000, consecutiveFailures: 0 }
  const sources: ProviderSource[] = ['FMP', 'ALPACA', 'RSS', 'SEC', 'WEBHOOK']
  return Object.fromEntries(
    sources.map(s => [s, { ...base, enabled: s !== 'WEBHOOK', ...overrides[s] }])
  ) as Record<ProviderSource, ProviderConfig>
}

beforeEach(() => {
  useConfigStore.setState({
    providers: makeProviders(),
    watchlistSymbols: [],
    corsProxyUrl: '',
    displayDensity: 'comfortable',
    autoRefresh: true,
  })
  useFilterStore.setState({
    activeCategory: null,
    activeSources: new Set<ProviderSource>(['FMP', 'ALPACA', 'RSS', 'SEC']),
    searchQuery: '',
  })
  useFeedStore.setState({
    articles: [],
    pendingArticles: [],
    readIds: new Set(),
    bookmarkIds: new Set(),
    focusedIndex: 0,
  })
})

// ---------------------------------------------------------------------------
// buildSparklineData unit tests
// ---------------------------------------------------------------------------

describe('buildSparklineData', () => {
  it('returns 24 bins', () => {
    const { data } = buildSparklineData([])
    expect(data).toHaveLength(24)
  })

  it('currentHourIndex is always 23', () => {
    const { currentHourIndex } = buildSparklineData([])
    expect(currentHourIndex).toBe(23)
  })

  it('counts an article ingested now into bin 23', () => {
    const { data } = buildSparklineData([{ ingested_at: new Date().toISOString() }])
    expect(data[23]).toBe(1)
  })

  it('counts an article ingested 1 hour ago into bin 22', () => {
    const oneHourAgo = new Date(Date.now() - 3_600_000).toISOString()
    const { data } = buildSparklineData([{ ingested_at: oneHourAgo }])
    expect(data[22]).toBe(1)
  })

  it('ignores articles older than 24 hours', () => {
    const old = new Date(Date.now() - 25 * 3_600_000).toISOString()
    const { data } = buildSparklineData([{ ingested_at: old }])
    expect(data.every(v => v === 0)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Sidebar rendering
// ---------------------------------------------------------------------------

describe('Sidebar', () => {
  it('renders Sources section heading', () => {
    render(<Sidebar onSettingsOpen={() => {}} />)
    expect(screen.getByText('Sources')).toBeInTheDocument()
  })

  it('renders all four non-WEBHOOK source labels', () => {
    render(<Sidebar onSettingsOpen={() => {}} />)
    expect(screen.getByText('FMP')).toBeInTheDocument()
    expect(screen.getByText('Alpaca')).toBeInTheDocument()
    expect(screen.getByText('RSS')).toBeInTheDocument()
    expect(screen.getByText('SEC EDGAR')).toBeInTheDocument()
  })

  it('does not render Webhook in Sources list', () => {
    render(<Sidebar onSettingsOpen={() => {}} />)
    expect(screen.queryByText('Webhook')).not.toBeInTheDocument()
  })

  it('renders Configure button', () => {
    render(<Sidebar onSettingsOpen={() => {}} />)
    expect(screen.getByText('Configure →')).toBeInTheDocument()
  })

  it('clicking Configure → calls onSettingsOpen', () => {
    const handler = vi.fn()
    render(<Sidebar onSettingsOpen={handler} />)
    fireEvent.click(screen.getByText('Configure →'))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does not show Watchlist section when watchlistSymbols is empty', () => {
    render(<Sidebar onSettingsOpen={() => {}} />)
    expect(screen.queryByText('Watchlist')).not.toBeInTheDocument()
  })

  it('shows Watchlist section when symbols are present', () => {
    useConfigStore.setState({
      providers: makeProviders(),
      watchlistSymbols: ['AAPL', 'TSLA'],
      corsProxyUrl: '',
      displayDensity: 'comfortable',
      autoRefresh: true,
    })
    render(<Sidebar onSettingsOpen={() => {}} />)
    expect(screen.getByText('Watchlist')).toBeInTheDocument()
    expect(screen.getByText('AAPL')).toBeInTheDocument()
    expect(screen.getByText('TSLA')).toBeInTheDocument()
  })

  it('does not show Activity section when there are no articles', () => {
    render(<Sidebar onSettingsOpen={() => {}} />)
    expect(screen.queryByText('Activity (24h)')).not.toBeInTheDocument()
  })

  it('shows Activity section when articles exist', () => {
    useFeedStore.setState({
      articles: [
        {
          id: 'FMP:abc',
          title: 'Test',
          summary: '',
          url: 'https://example.com',
          source: 'FMP',
          provider_label: 'FMP',
          symbols: [],
          published_at: new Date().toISOString(),
          ingested_at: new Date().toISOString(),
        },
      ],
      pendingArticles: [],
      readIds: new Set(),
      bookmarkIds: new Set(),
      focusedIndex: 0,
    })
    render(<Sidebar onSettingsOpen={() => {}} />)
    expect(screen.getByText('Activity (24h)')).toBeInTheDocument()
    expect(screen.getByText('1 articles')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Toggle behaviour
// ---------------------------------------------------------------------------

describe('Sidebar source toggles', () => {
  it('toggle for FMP calls toggleSource("FMP")', () => {
    const toggleSource = vi.fn()
    useFilterStore.setState({
      activeCategory: null,
      activeSources: new Set<ProviderSource>(['FMP', 'ALPACA', 'RSS', 'SEC']),
      searchQuery: '',
      toggleSource,
      setCategory: () => {},
      setSearchQuery: () => {},
      getFilteredArticles: () => [],
    })
    render(<Sidebar onSettingsOpen={() => {}} />)
    // FMP toggle is the first role="switch"
    const switches = screen.getAllByRole('switch')
    fireEvent.click(switches[0])
    expect(toggleSource).toHaveBeenCalledWith('FMP')
  })

  it('toggle for ALPACA calls toggleSource("ALPACA")', () => {
    const toggleSource = vi.fn()
    useFilterStore.setState({
      activeCategory: null,
      activeSources: new Set<ProviderSource>(['FMP', 'ALPACA', 'RSS', 'SEC']),
      searchQuery: '',
      toggleSource,
      setCategory: () => {},
      setSearchQuery: () => {},
      getFilteredArticles: () => [],
    })
    render(<Sidebar onSettingsOpen={() => {}} />)
    const switches = screen.getAllByRole('switch')
    fireEvent.click(switches[1])
    expect(toggleSource).toHaveBeenCalledWith('ALPACA')
  })
})

// ---------------------------------------------------------------------------
// Error badge
// ---------------------------------------------------------------------------

describe('Sidebar error badges', () => {
  it('shows error badge when consecutiveFailures >= 2', () => {
    useConfigStore.setState({
      providers: makeProviders({ FMP: { consecutiveFailures: 2, lastError: 'timeout' } }),
      watchlistSymbols: [],
      corsProxyUrl: '',
      displayDensity: 'comfortable',
      autoRefresh: true,
    })
    render(<Sidebar onSettingsOpen={() => {}} />)
    expect(screen.getByLabelText('FMP error')).toBeInTheDocument()
  })

  it('does not show error badge when consecutiveFailures is 1', () => {
    useConfigStore.setState({
      providers: makeProviders({ FMP: { consecutiveFailures: 1 } }),
      watchlistSymbols: [],
      corsProxyUrl: '',
      displayDensity: 'comfortable',
      autoRefresh: true,
    })
    render(<Sidebar onSettingsOpen={() => {}} />)
    expect(screen.queryByLabelText('FMP error')).not.toBeInTheDocument()
  })

  it('does not show error badge when consecutiveFailures is 0', () => {
    render(<Sidebar onSettingsOpen={() => {}} />)
    expect(screen.queryByLabelText('FMP error')).not.toBeInTheDocument()
  })

  it('shows error badges for multiple failing sources independently', () => {
    useConfigStore.setState({
      providers: makeProviders({
        FMP: { consecutiveFailures: 3 },
        RSS: { consecutiveFailures: 2 },
      }),
      watchlistSymbols: [],
      corsProxyUrl: '',
      displayDensity: 'comfortable',
      autoRefresh: true,
    })
    render(<Sidebar onSettingsOpen={() => {}} />)
    expect(screen.getByLabelText('FMP error')).toBeInTheDocument()
    expect(screen.getByLabelText('RSS error')).toBeInTheDocument()
    expect(screen.queryByLabelText('Alpaca error')).not.toBeInTheDocument()
  })
})
