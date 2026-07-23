import { render, screen, fireEvent } from '@testing-library/react'
import { ArticleCard } from './ArticleCard'
import { useFeedStore } from '../../stores/feedStore'
import type { Article } from '../../providers/types'

const baseArticle: Article = {
  id: 'a1',
  title: 'Fed raises rates',
  summary: 'The Federal Reserve raised interest rates by 25 basis points.',
  url: 'https://example.com/fed',
  source: 'FINNHUB',
  provider_label: 'FINNHUB',
  symbols: ['SPY', 'TLT'],
  published_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
  ingested_at: new Date().toISOString(),
}

beforeEach(() => {
  useFeedStore.setState({
    articles: [],
    pendingArticles: [],
    readIds: new Set(),
    bookmarkIds: new Set(),
    focusedIndex: 0,
  })
})

describe('ArticleCard', () => {
  it('renders article title', () => {
    render(<ArticleCard article={baseArticle} />)
    expect(screen.getByText('Fed raises rates')).toBeInTheDocument()
  })

  it('renders article summary', () => {
    render(<ArticleCard article={baseArticle} />)
    expect(screen.getByText(/Federal Reserve raised/)).toBeInTheDocument()
  })

  it('renders ticker badges for symbols', () => {
    render(<ArticleCard article={baseArticle} />)
    expect(screen.getByText('SPY')).toBeInTheDocument()
    expect(screen.getByText('TLT')).toBeInTheDocument()
  })

  it('renders source label', () => {
    render(<ArticleCard article={baseArticle} />)
    expect(screen.getByText('FINNHUB')).toBeInTheDocument()
  })

  it('renders relative time', () => {
    render(<ArticleCard article={baseArticle} />)
    // date-fns formatDistanceToNow returns something like "4 minutes ago"
    const timeEl = screen.getByText(/ago/)
    expect(timeEl).toBeInTheDocument()
  })

  it('shows unread left border when article is not read', () => {
    render(<ArticleCard article={baseArticle} />)
    const card = screen.getByTestId('article-card')
    // unread left bar is present
    const bar = card.querySelector('.bg-\\[\\#0070F3\\]')
    expect(bar).toBeInTheDocument()
  })

  it('does not show unread left border when article is read', () => {
    useFeedStore.setState({ readIds: new Set(['a1']) })
    render(<ArticleCard article={baseArticle} />)
    const card = screen.getByTestId('article-card')
    const bar = card.querySelector('.bg-\\[\\#0070F3\\]')
    expect(bar).not.toBeInTheDocument()
  })

  it('title uses tertiary color when article is read', () => {
    useFeedStore.setState({ readIds: new Set(['a1']) })
    render(<ArticleCard article={baseArticle} />)
    const title = screen.getByText('Fed raises rates')
    expect(title.className).toContain('text-[#888888]')
  })

  it('title uses primary color when article is unread', () => {
    render(<ArticleCard article={baseArticle} />)
    const title = screen.getByText('Fed raises rates')
    expect(title.className).toContain('text-[#EDEDED]')
  })

  it('renders category badge when category is present', () => {
    render(<ArticleCard article={{ ...baseArticle, category: 'earnings' }} />)
    expect(screen.getByText('earnings')).toBeInTheDocument()
  })

  it('does not render category badge when category is absent', () => {
    render(<ArticleCard article={baseArticle} />)
    expect(screen.queryByText('earnings')).not.toBeInTheDocument()
  })

  it('renders sentiment dot when sentiment is present', () => {
    render(<ArticleCard article={{ ...baseArticle, sentiment: 'bullish' }} />)
    const dot = screen.getByLabelText('bullish')
    expect(dot).toBeInTheDocument()
    expect(dot.className).toContain('bg-[#00C853]')
  })

  it('renders bearish sentiment dot', () => {
    render(<ArticleCard article={{ ...baseArticle, sentiment: 'bearish' }} />)
    const dot = screen.getByLabelText('bearish')
    expect(dot.className).toContain('bg-[#FF4444]')
  })

  it('renders neutral sentiment dot', () => {
    render(<ArticleCard article={{ ...baseArticle, sentiment: 'neutral' }} />)
    const dot = screen.getByLabelText('neutral')
    expect(dot.className).toContain('bg-[#555555]')
  })

  it('renders "Also:" text when also_reported_by is present', () => {
    render(<ArticleCard article={{ ...baseArticle, also_reported_by: ['Reuters', 'CNBC'] }} />)
    expect(screen.getByText('Also: Reuters, CNBC')).toBeInTheDocument()
  })

  it('calls markRead and opens URL on click', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    render(<ArticleCard article={baseArticle} />)
    fireEvent.click(screen.getByTestId('article-card'))
    expect(useFeedStore.getState().readIds.has('a1')).toBe(true)
    expect(openSpy).toHaveBeenCalledWith('https://example.com/fed', '_blank', 'noopener,noreferrer')
    openSpy.mockRestore()
  })

  it('calls markRead and opens URL on Enter keydown', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    render(<ArticleCard article={baseArticle} />)
    fireEvent.keyDown(screen.getByTestId('article-card'), { key: 'Enter' })
    expect(useFeedStore.getState().readIds.has('a1')).toBe(true)
    expect(openSpy).toHaveBeenCalled()
    openSpy.mockRestore()
  })

  it('does not open URL on non-Enter keydown', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    render(<ArticleCard article={baseArticle} />)
    fireEvent.keyDown(screen.getByTestId('article-card'), { key: 'Space' })
    expect(openSpy).not.toHaveBeenCalled()
    openSpy.mockRestore()
  })

  it('shows focused ring when focused prop is true', () => {
    render(<ArticleCard article={baseArticle} focused />)
    const card = screen.getByTestId('article-card')
    expect(card.className).toContain('ring-1')
    expect(card.className).toContain('ring-[#0070F3]')
  })

  it('does not show focused ring when focused prop is false', () => {
    render(<ArticleCard article={baseArticle} focused={false} />)
    const card = screen.getByTestId('article-card')
    expect(card.className).not.toContain('ring-1')
  })

  it('renders bookmark button', () => {
    render(<ArticleCard article={baseArticle} />)
    expect(screen.getByLabelText('Bookmark article')).toBeInTheDocument()
  })

  it('toggles bookmark on star click', () => {
    render(<ArticleCard article={baseArticle} />)
    const btn = screen.getByLabelText('Bookmark article')
    fireEvent.click(btn)
    expect(useFeedStore.getState().bookmarkIds.has('a1')).toBe(true)
  })

  it('shows filled star when article is bookmarked', () => {
    useFeedStore.setState({ bookmarkIds: new Set(['a1']) })
    render(<ArticleCard article={baseArticle} />)
    expect(screen.getByLabelText('Remove bookmark')).toBeInTheDocument()
  })

  it('bookmark click does not also fire card open', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    render(<ArticleCard article={baseArticle} />)
    fireEvent.click(screen.getByLabelText('Bookmark article'))
    expect(openSpy).not.toHaveBeenCalled()
    openSpy.mockRestore()
  })

  it('limits ticker badges to 3', () => {
    const article = { ...baseArticle, symbols: ['A', 'B', 'C', 'D', 'E'] }
    render(<ArticleCard article={article} />)
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
    expect(screen.getByText('C')).toBeInTheDocument()
    expect(screen.queryByText('D')).not.toBeInTheDocument()
    expect(screen.queryByText('E')).not.toBeInTheDocument()
  })

  it('renders no ticker badges when symbols array is empty', () => {
    render(<ArticleCard article={{ ...baseArticle, symbols: [] }} />)
    // Ticker badges use font-mono class from the ticker variant in Badge
    const card = screen.getByTestId('article-card')
    const tickerBadges = card.querySelectorAll('.font-mono')
    expect(tickerBadges).toHaveLength(0)
  })
})
