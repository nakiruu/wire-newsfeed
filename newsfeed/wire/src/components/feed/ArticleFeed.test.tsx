import { render, screen, fireEvent } from '@testing-library/react'
import { ArticleFeed } from './ArticleFeed'
import { useFeedStore } from '../../stores/feedStore'
import { useFilterStore } from '../../stores/filterStore'
import { useConfigStore } from '../../stores/configStore'
import type { Article } from '../../providers/types'

// Mock @tanstack/react-virtual so jsdom can render without layout
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number; getScrollElement?: () => Element | null }) => ({
    getTotalSize: () => count * 96,
    getVirtualItems: () =>
      Array.from({ length: count }, (_, i) => ({
        key: i,
        index: i,
        start: i * 96,
        size: 96,
      })),
    scrollToIndex: vi.fn(),
    measureElement: vi.fn(),
  }),
}))

function makeArticle(id: string, overrides: Partial<Article> = {}): Article {
  return {
    id,
    title: `Article ${id}`,
    summary: `Summary for ${id}`,
    url: `https://example.com/${id}`,
    source: 'FINNHUB',
    provider_label: 'FINNHUB',
    symbols: ['AAPL'],
    published_at: new Date(Date.now() - 1000).toISOString(),
    ingested_at: new Date().toISOString(),
    ...overrides,
  }
}

beforeEach(() => {
  useFeedStore.setState({
    articles: [],
    pendingArticles: [],
    readIds: new Set(),
    bookmarkIds: new Set(),
    focusedIndex: 0,
  })
  useFilterStore.setState({
    activeCategory: null,
    activeSources: new Set(['FINNHUB', 'ALPACA', 'RSS', 'SEC']),
    searchQuery: '',
  })
})

describe('ArticleFeed', () => {
  it('shows EmptyState (no-providers) when no providers are enabled', () => {
    // Disable all providers
    const providers = useConfigStore.getState().providers
    const allDisabled = Object.fromEntries(
      Object.entries(providers).map(([k, v]) => [k, { ...v, enabled: false }])
    ) as typeof providers
    useConfigStore.setState({ providers: allDisabled })

    render(<ArticleFeed focusedIndex={0} onConfigureClick={vi.fn()} />)
    expect(screen.getByText(/Add a news source/)).toBeInTheDocument()

    // Restore
    useConfigStore.setState({ providers })
  })

  it('shows EmptyState (no-providers) when articles list is empty and has enabled providers', () => {
    // Default config has enabled providers, but no articles
    render(<ArticleFeed focusedIndex={0} onConfigureClick={vi.fn()} />)
    expect(screen.getByText(/Add a news source/)).toBeInTheDocument()
  })

  it('shows EmptyState (no-results) when filter removes all articles', () => {
    const articles = [makeArticle('x1', { category: 'earnings' })]
    useFeedStore.setState({ articles })
    useFilterStore.setState({ activeCategory: 'macro' })

    render(<ArticleFeed focusedIndex={0} onConfigureClick={vi.fn()} />)
    expect(screen.getByText(/No articles match/)).toBeInTheDocument()
  })

  it('renders article cards when articles are present', () => {
    const articles = [makeArticle('a1'), makeArticle('a2')]
    useFeedStore.setState({ articles })

    render(<ArticleFeed focusedIndex={0} onConfigureClick={vi.fn()} />)
    expect(screen.getByText('Article a1')).toBeInTheDocument()
    expect(screen.getByText('Article a2')).toBeInTheDocument()
  })

  it('passes focusedIndex to the correct ArticleCard', () => {
    const articles = [makeArticle('a1'), makeArticle('a2')]
    useFeedStore.setState({ articles })

    render(<ArticleFeed focusedIndex={1} onConfigureClick={vi.fn()} />)
    const cards = screen.getAllByTestId('article-card')
    // Second card (index 1) should have focused ring
    expect(cards[1].className).toContain('ring-1')
    expect(cards[0].className).not.toContain('ring-1')
  })

  it('calls onConfigureClick when EmptyState configure button is clicked', () => {
    const onConfigureClick = vi.fn()
    render(<ArticleFeed focusedIndex={0} onConfigureClick={onConfigureClick} />)
    fireEvent.click(screen.getByText('Configure sources â†’'))
    expect(onConfigureClick).toHaveBeenCalledTimes(1)
  })

  it('renders FilterBar', () => {
    render(<ArticleFeed focusedIndex={0} onConfigureClick={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
  })

  it('renders NewArticlesBanner when there are pending articles', () => {
    useFeedStore.setState({
      articles: [makeArticle('a1')],
      pendingArticles: [makeArticle('p1')],
    })
    render(<ArticleFeed focusedIndex={0} onConfigureClick={vi.fn()} />)
    expect(screen.getByText(/â†‘ 1 new article/)).toBeInTheDocument()
  })

  it('does not show NewArticlesBanner when pendingArticles is empty', () => {
    useFeedStore.setState({ articles: [makeArticle('a1')], pendingArticles: [] })
    render(<ArticleFeed focusedIndex={0} onConfigureClick={vi.fn()} />)
    expect(screen.queryByText(/new article/)).not.toBeInTheDocument()
  })
})
