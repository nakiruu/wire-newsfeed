import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from './Header'
import { useFeedStore } from '../../stores/feedStore'

beforeEach(() => {
  useFeedStore.setState({ pendingArticles: [] })
})

describe('Header', () => {
  it('renders the Wire wordmark', () => {
    render(<Header onSearchOpen={() => {}} onSettingsOpen={() => {}} lastUpdatedAt={null} />)
    expect(screen.getByText(/Wire/)).toBeInTheDocument()
  })

  it('renders ⌘K search trigger button', () => {
    render(<Header onSearchOpen={() => {}} onSettingsOpen={() => {}} lastUpdatedAt={null} />)
    expect(screen.getByText('⌘K')).toBeInTheDocument()
  })

  it('renders settings gear button', () => {
    render(<Header onSearchOpen={() => {}} onSettingsOpen={() => {}} lastUpdatedAt={null} />)
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
  })

  it('clicking settings gear triggers onSettingsOpen callback', () => {
    const handler = vi.fn()
    render(<Header onSearchOpen={() => {}} onSettingsOpen={handler} lastUpdatedAt={null} />)
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('clicking search button triggers onSearchOpen callback', () => {
    const handler = vi.fn()
    render(<Header onSearchOpen={handler} onSettingsOpen={() => {}} lastUpdatedAt={null} />)
    // The search button contains ⌘K text — click the button wrapping it
    fireEvent.click(screen.getByText('⌘K').closest('button')!)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('shows "waiting" when lastUpdatedAt is null', () => {
    render(<Header onSearchOpen={() => {}} onSettingsOpen={() => {}} lastUpdatedAt={null} />)
    expect(screen.getByText('waiting')).toBeInTheDocument()
  })

  it('shows relative time when lastUpdatedAt is provided', () => {
    const now = new Date()
    render(<Header onSearchOpen={() => {}} onSettingsOpen={() => {}} lastUpdatedAt={now} />)
    // Should show something like "0s ago"
    expect(screen.getByText(/ago/)).toBeInTheDocument()
  })

  it('shows pending count badge when pendingArticles exist', () => {
    useFeedStore.setState({
      pendingArticles: [{ id: '1' } as never, { id: '2' } as never],
    })
    render(<Header onSearchOpen={() => {}} onSettingsOpen={() => {}} lastUpdatedAt={null} />)
    expect(screen.getByText('↑ 2 new')).toBeInTheDocument()
  })

  it('does not show pending count badge when pendingArticles is empty', () => {
    useFeedStore.setState({ pendingArticles: [] })
    render(<Header onSearchOpen={() => {}} onSettingsOpen={() => {}} lastUpdatedAt={null} />)
    expect(screen.queryByText(/↑.*new/)).not.toBeInTheDocument()
  })
})
