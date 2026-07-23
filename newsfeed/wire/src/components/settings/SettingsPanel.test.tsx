import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SettingsPanel } from './SettingsPanel'
import { useConfigStore } from '../../stores/configStore'

// Reset store state before each test
beforeEach(() => {
  useConfigStore.setState({
    corsProxyUrl: '',
    providers: {
      FINNHUB: { enabled: true, poll_interval_ms: 60000, consecutiveFailures: 0 },
      ALPACA: { enabled: true, poll_interval_ms: 30000, consecutiveFailures: 0 },
      RSS: { enabled: true, poll_interval_ms: 300000, consecutiveFailures: 0, custom_feeds: [] },
      SEC: { enabled: true, poll_interval_ms: 600000, consecutiveFailures: 0 },
      WEBHOOK: { enabled: false, poll_interval_ms: 0, consecutiveFailures: 0 },
    },
    watchlistSymbols: [],
    displayDensity: 'comfortable',
    autoRefresh: true,
  })
  vi.restoreAllMocks()
})

describe('SettingsPanel', () => {
  it('renders nothing when open=false', () => {
    render(<SettingsPanel open={false} onClose={() => {}} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders the panel when open=true', () => {
    render(<SettingsPanel open={true} onClose={() => {}} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('calls onClose when the Ã— button is clicked', () => {
    const onClose = vi.fn()
    render(<SettingsPanel open={true} onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Close settings'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn()
    render(<SettingsPanel open={true} onClose={onClose} />)
    // The backdrop is the first child div with aria-hidden
    const backdrop = document.querySelector('[aria-hidden="true"]')!
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn()
    render(<SettingsPanel open={true} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does not call onClose for non-Escape keys', () => {
    const onClose = vi.fn()
    render(<SettingsPanel open={true} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Enter' })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('removes keydown listener when closed', () => {
    const onClose = vi.fn()
    const { rerender } = render(<SettingsPanel open={true} onClose={onClose} />)
    rerender(<SettingsPanel open={false} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })

  describe('CORS Proxy section', () => {
    it('renders CORS proxy URL input', () => {
      render(<SettingsPanel open={true} onClose={() => {}} />)
      expect(screen.getByLabelText('CORS proxy URL')).toBeInTheDocument()
    })

    it('saves the proxy URL to the store when Save is clicked', () => {
      render(<SettingsPanel open={true} onClose={() => {}} />)
      const input = screen.getByLabelText('CORS proxy URL')
      fireEvent.change(input, { target: { value: 'http://localhost:8080' } })
      // Find the Save button in the proxy section (first Save button)
      const saveButtons = screen.getAllByText('Save')
      fireEvent.click(saveButtons[0])
      expect(useConfigStore.getState().corsProxyUrl).toBe('http://localhost:8080')
    })

    it('shows âœ“ badge after successful proxy test', async () => {
      useConfigStore.setState({ corsProxyUrl: 'http://proxy.local:8080' })
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
      render(<SettingsPanel open={true} onClose={() => {}} />)
      fireEvent.click(screen.getByLabelText('Test CORS proxy'))
      await waitFor(() => {
        expect(screen.getByLabelText('valid')).toBeInTheDocument()
      })
      expect(fetch).toHaveBeenCalledWith('http://proxy.local:8080/https://httpbin.org/get')
    })

    it('shows âœ— badge when proxy test returns non-ok response', async () => {
      useConfigStore.setState({ corsProxyUrl: 'http://proxy.local:8080' })
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
      render(<SettingsPanel open={true} onClose={() => {}} />)
      fireEvent.click(screen.getByLabelText('Test CORS proxy'))
      await waitFor(() => {
        expect(screen.getByLabelText('invalid')).toBeInTheDocument()
      })
    })

    it('shows âœ— badge when proxy test throws', async () => {
      useConfigStore.setState({ corsProxyUrl: 'http://proxy.local:8080' })
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
      render(<SettingsPanel open={true} onClose={() => {}} />)
      fireEvent.click(screen.getByLabelText('Test CORS proxy'))
      await waitFor(() => {
        expect(screen.getByLabelText('invalid')).toBeInTheDocument()
      })
    })
  })

  describe('Provider toggles', () => {
    it('toggles FINNHUB provider on/off', () => {
      render(<SettingsPanel open={true} onClose={() => {}} />)
      // FINNHUB toggle is the first switch (after finding all switches)
      const switches = screen.getAllByRole('switch')
      // switches: FINNHUB, ALPACA, RSS, SEC, autoRefresh
      const fmpSwitch = switches[0]
      expect(fmpSwitch).toHaveAttribute('aria-checked', 'true')
      fireEvent.click(fmpSwitch)
      expect(useConfigStore.getState().providers.FINNHUB.enabled).toBe(false)
    })

    it('toggles Alpaca provider on/off', () => {
      render(<SettingsPanel open={true} onClose={() => {}} />)
      const switches = screen.getAllByRole('switch')
      const alpacaSwitch = switches[1]
      fireEvent.click(alpacaSwitch)
      expect(useConfigStore.getState().providers.ALPACA.enabled).toBe(false)
    })

    it('toggles RSS provider on/off', () => {
      render(<SettingsPanel open={true} onClose={() => {}} />)
      const switches = screen.getAllByRole('switch')
      const rssSwitch = switches[2]
      fireEvent.click(rssSwitch)
      expect(useConfigStore.getState().providers.RSS.enabled).toBe(false)
    })

    it('toggles SEC EDGAR provider on/off', () => {
      render(<SettingsPanel open={true} onClose={() => {}} />)
      const switches = screen.getAllByRole('switch')
      const secSwitch = switches[3]
      fireEvent.click(secSwitch)
      expect(useConfigStore.getState().providers.SEC.enabled).toBe(false)
    })
  })

  describe('RSS Feeds section', () => {
    it('renders RSS feed textarea', () => {
      render(<SettingsPanel open={true} onClose={() => {}} />)
      expect(screen.getByLabelText('RSS feed URLs')).toBeInTheDocument()
    })

    it('saves RSS feeds to the store', () => {
      render(<SettingsPanel open={true} onClose={() => {}} />)
      const textarea = screen.getByLabelText('RSS feed URLs')
      fireEvent.change(textarea, { target: { value: 'https://feeds.example.com/rss\nhttps://other.com/feed' } })
      fireEvent.click(screen.getByText('Save feeds'))
      const feeds = useConfigStore.getState().providers.RSS.custom_feeds
      expect(feeds).toEqual(['https://feeds.example.com/rss', 'https://other.com/feed'])
    })

    it('filters blank lines when saving feeds', () => {
      render(<SettingsPanel open={true} onClose={() => {}} />)
      const textarea = screen.getByLabelText('RSS feed URLs')
      fireEvent.change(textarea, { target: { value: 'https://a.com\n\n  \nhttps://b.com' } })
      fireEvent.click(screen.getByText('Save feeds'))
      expect(useConfigStore.getState().providers.RSS.custom_feeds).toEqual(['https://a.com', 'https://b.com'])
    })
  })

  describe('Watchlist section', () => {
    it('adds a symbol on Add button click', () => {
      render(<SettingsPanel open={true} onClose={() => {}} />)
      const input = screen.getByLabelText('New watchlist symbol')
      fireEvent.change(input, { target: { value: 'TSLA' } })
      fireEvent.click(screen.getByText('Add'))
      expect(useConfigStore.getState().watchlistSymbols).toContain('TSLA')
    })

    it('adds a symbol on Enter key', () => {
      render(<SettingsPanel open={true} onClose={() => {}} />)
      const input = screen.getByLabelText('New watchlist symbol')
      fireEvent.change(input, { target: { value: 'NVDA' } })
      fireEvent.keyDown(input, { key: 'Enter' })
      expect(useConfigStore.getState().watchlistSymbols).toContain('NVDA')
    })

    it('clears the input after adding a symbol', () => {
      render(<SettingsPanel open={true} onClose={() => {}} />)
      const input = screen.getByLabelText('New watchlist symbol') as HTMLInputElement
      fireEvent.change(input, { target: { value: 'AAPL' } })
      fireEvent.click(screen.getByText('Add'))
      expect(input.value).toBe('')
    })

    it('uppercases typed symbols', () => {
      render(<SettingsPanel open={true} onClose={() => {}} />)
      const input = screen.getByLabelText('New watchlist symbol') as HTMLInputElement
      fireEvent.change(input, { target: { value: 'aapl' } })
      expect(input.value).toBe('AAPL')
    })

    it('disables the Add button when input is empty', () => {
      render(<SettingsPanel open={true} onClose={() => {}} />)
      expect(screen.getByText('Add').closest('button')).toBeDisabled()
    })

    it('removes a symbol when its chip is clicked', () => {
      useConfigStore.setState({ watchlistSymbols: ['SPY', 'QQQ'] })
      render(<SettingsPanel open={true} onClose={() => {}} />)
      fireEvent.click(screen.getByLabelText('Remove SPY'))
      expect(useConfigStore.getState().watchlistSymbols).not.toContain('SPY')
      expect(useConfigStore.getState().watchlistSymbols).toContain('QQQ')
    })

    it('displays existing watchlist symbols as chips', () => {
      useConfigStore.setState({ watchlistSymbols: ['AAPL', 'MSFT'] })
      render(<SettingsPanel open={true} onClose={() => {}} />)
      expect(screen.getByLabelText('Remove AAPL')).toBeInTheDocument()
      expect(screen.getByLabelText('Remove MSFT')).toBeInTheDocument()
    })
  })

  describe('Display section', () => {
    it('sets compact density when Compact button is clicked', () => {
      render(<SettingsPanel open={true} onClose={() => {}} />)
      fireEvent.click(screen.getByLabelText('Set compact density'))
      expect(useConfigStore.getState().displayDensity).toBe('compact')
    })

    it('sets comfortable density when Comfortable button is clicked', () => {
      useConfigStore.setState({ displayDensity: 'compact' })
      render(<SettingsPanel open={true} onClose={() => {}} />)
      fireEvent.click(screen.getByLabelText('Set comfortable density'))
      expect(useConfigStore.getState().displayDensity).toBe('comfortable')
    })

    it('toggles autoRefresh off', () => {
      render(<SettingsPanel open={true} onClose={() => {}} />)
      const switches = screen.getAllByRole('switch')
      // autoRefresh is the last switch
      const autoRefreshSwitch = switches[switches.length - 1]
      expect(autoRefreshSwitch).toHaveAttribute('aria-checked', 'true')
      fireEvent.click(autoRefreshSwitch)
      expect(useConfigStore.getState().autoRefresh).toBe(false)
    })

    it('toggles autoRefresh on', () => {
      useConfigStore.setState({ autoRefresh: false })
      render(<SettingsPanel open={true} onClose={() => {}} />)
      const switches = screen.getAllByRole('switch')
      const autoRefreshSwitch = switches[switches.length - 1]
      expect(autoRefreshSwitch).toHaveAttribute('aria-checked', 'false')
      fireEvent.click(autoRefreshSwitch)
      expect(useConfigStore.getState().autoRefresh).toBe(true)
    })
  })
})
