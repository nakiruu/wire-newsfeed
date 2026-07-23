import { render, screen, fireEvent } from '@testing-library/react'
import { NewArticlesBanner } from './NewArticlesBanner'
import { useFeedStore } from '../../stores/feedStore'
import type { Article } from '../../providers/types'

function makeArticle(id: string): Article {
  return {
    id,
    title: `Article ${id}`,
    summary: 'Summary',
    url: `https://example.com/${id}`,
    source: 'FINNHUB',
    provider_label: 'FINNHUB',
    symbols: [],
    published_at: new Date().toISOString(),
    ingested_at: new Date().toISOString(),
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
})

describe('NewArticlesBanner', () => {
  it('renders nothing when there are no pending articles', () => {
    const onFlush = vi.fn()
    const { container } = render(<NewArticlesBanner onFlush={onFlush} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders banner with correct count for singular pending article', () => {
    useFeedStore.setState({ pendingArticles: [makeArticle('p1')] })
    render(<NewArticlesBanner onFlush={vi.fn()} />)
    expect(screen.getByText(/â†‘ 1 new article$/)).toBeInTheDocument()
  })

  it('renders banner with correct count for plural pending articles', () => {
    useFeedStore.setState({ pendingArticles: [makeArticle('p1'), makeArticle('p2'), makeArticle('p3')] })
    render(<NewArticlesBanner onFlush={vi.fn()} />)
    expect(screen.getByText(/â†‘ 3 new articles/)).toBeInTheDocument()
  })

  it('calls onFlush when banner button is clicked', () => {
    const onFlush = vi.fn()
    useFeedStore.setState({ pendingArticles: [makeArticle('p1')] })
    render(<NewArticlesBanner onFlush={onFlush} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onFlush).toHaveBeenCalledTimes(1)
  })

  it('disappears after pending articles are flushed', () => {
    useFeedStore.setState({ pendingArticles: [makeArticle('p1')] })
    const { rerender } = render(<NewArticlesBanner onFlush={vi.fn()} />)
    expect(screen.getByRole('button')).toBeInTheDocument()

    useFeedStore.setState({ pendingArticles: [] })
    rerender(<NewArticlesBanner onFlush={vi.fn()} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
