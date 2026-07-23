import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CommandPalette } from './CommandPalette'
import { useFeedStore } from '../../stores/feedStore'
import type { Article } from '../../providers/types'

// Mock useArticleSearch so we control results without Fuse.js internals
vi.mock('../../hooks/useArticleSearch', () => ({
  useArticleSearch: (query: string) => {
    const articles: Article[] = [
      {
        id: '1', title: 'Apple earnings beat expectations', summary: 'Apple Q1 results',
        url: 'https://example.com/1', source: 'FINNHUB', provider_label: 'FINNHUB',
        symbols: ['AAPL'], published_at: new Date().toISOString(), ingested_at: new Date().toISOString(),
      },
      {
        id: '2', title: 'Tesla delivery numbers disappoint', summary: 'Tesla missed estimates',
        url: 'https://example.com/2', source: 'FINNHUB', provider_label: 'FINNHUB',
        symbols: ['TSLA'], published_at: new Date().toISOString(), ingested_at: new Date().toISOString(),
      },
      {
        id: '3', title: 'Microsoft Azure cloud growth', summary: 'Azure revenue up',
        url: 'https://example.com/3', source: 'ALPACA', provider_label: 'Alpaca',
        symbols: ['MSFT'], published_at: new Date().toISOString(), ingested_at: new Date().toISOString(),
      },
    ]
    if (!query.trim()) return articles
    return articles.filter(a =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.symbols.some(s => s.toLowerCase().includes(query.toLowerCase()))
    )
  },
}))

const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

beforeEach(() => {
  openSpy.mockClear()
  useFeedStore.setState({ articles: [], pendingArticles: [], readIds: new Set(), bookmarkIds: new Set(), focusedIndex: 0 })
})

function renderPalette(open = true, onClose = vi.fn()) {
  return { onClose, ...render(<CommandPalette open={open} onClose={onClose} />) }
}

describe('CommandPalette', () => {
  describe('rendering', () => {
    it('renders nothing when closed', () => {
      renderPalette(false)
      expect(screen.queryByTestId('command-palette-input')).toBeNull()
    })

    it('renders the search input when open', () => {
      renderPalette()
      expect(screen.getByTestId('command-palette-input')).toBeInTheDocument()
    })

    it('shows article results in the list', () => {
      renderPalette()
      expect(screen.getByText('Apple earnings beat expectations')).toBeInTheDocument()
      expect(screen.getByText('Tesla delivery numbers disappoint')).toBeInTheDocument()
    })

    it('shows "No results" message when query has text and no matches', () => {
      renderPalette()
      const input = screen.getByTestId('command-palette-input')
      fireEvent.change(input, { target: { value: 'zzznomatch' } })
      expect(screen.getByTestId('no-results')).toBeInTheDocument()
    })

    it('shows provider status section', () => {
      renderPalette()
      expect(screen.getByText('Provider Status')).toBeInTheDocument()
    })
  })

  describe('search filtering', () => {
    it('filters results as the user types', () => {
      renderPalette()
      const input = screen.getByTestId('command-palette-input')
      fireEvent.change(input, { target: { value: 'Apple' } })
      expect(screen.getByText('Apple earnings beat expectations')).toBeInTheDocument()
      expect(screen.queryByText('Tesla delivery numbers disappoint')).toBeNull()
    })

    it('shows all results when query is cleared', () => {
      renderPalette()
      const input = screen.getByTestId('command-palette-input')
      fireEvent.change(input, { target: { value: 'Apple' } })
      fireEvent.change(input, { target: { value: '' } })
      expect(screen.getByText('Apple earnings beat expectations')).toBeInTheDocument()
      expect(screen.getByText('Tesla delivery numbers disappoint')).toBeInTheDocument()
    })
  })

  describe('keyboard navigation', () => {
    it('first item is highlighted by default', () => {
      renderPalette()
      expect(screen.getByTestId('result-item-0')).toHaveAttribute('data-selected', 'true')
    })

    it('ArrowDown moves selection to next item', () => {
      renderPalette()
      const box = screen.getByTestId('command-palette-box')
      fireEvent.keyDown(box, { key: 'ArrowDown' })
      expect(screen.getByTestId('result-item-1')).toHaveAttribute('data-selected', 'true')
      expect(screen.getByTestId('result-item-0')).not.toHaveAttribute('data-selected')
    })

    it('ArrowUp moves selection back to previous item', () => {
      renderPalette()
      const box = screen.getByTestId('command-palette-box')
      fireEvent.keyDown(box, { key: 'ArrowDown' })
      fireEvent.keyDown(box, { key: 'ArrowDown' })
      fireEvent.keyDown(box, { key: 'ArrowUp' })
      expect(screen.getByTestId('result-item-1')).toHaveAttribute('data-selected', 'true')
    })

    it('ArrowUp does not go below index 0', () => {
      renderPalette()
      const box = screen.getByTestId('command-palette-box')
      fireEvent.keyDown(box, { key: 'ArrowUp' })
      expect(screen.getByTestId('result-item-0')).toHaveAttribute('data-selected', 'true')
    })

    it('Enter opens the focused article (index 0) and calls onClose', () => {
      const onClose = vi.fn()
      render(<CommandPalette open onClose={onClose} />)
      const box = screen.getByTestId('command-palette-box')
      fireEvent.keyDown(box, { key: 'Enter' })
      expect(openSpy).toHaveBeenCalledWith('https://example.com/1', '_blank', 'noopener,noreferrer')
      expect(onClose).toHaveBeenCalled()
    })

    it('Enter opens the article at the selected index after ArrowDown', () => {
      const onClose = vi.fn()
      render(<CommandPalette open onClose={onClose} />)
      const box = screen.getByTestId('command-palette-box')
      fireEvent.keyDown(box, { key: 'ArrowDown' })
      fireEvent.keyDown(box, { key: 'Enter' })
      expect(openSpy).toHaveBeenCalledWith('https://example.com/2', '_blank', 'noopener,noreferrer')
      expect(onClose).toHaveBeenCalled()
    })

    it('Escape calls onClose', () => {
      const onClose = vi.fn()
      render(<CommandPalette open onClose={onClose} />)
      const box = screen.getByTestId('command-palette-box')
      fireEvent.keyDown(box, { key: 'Escape' })
      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('click interactions', () => {
    it('clicking a result opens the article and calls onClose', () => {
      const onClose = vi.fn()
      render(<CommandPalette open onClose={onClose} />)
      const firstResult = screen.getByTestId('result-item-0')
      fireEvent.click(firstResult)
      expect(openSpy).toHaveBeenCalledWith('https://example.com/1', '_blank', 'noopener,noreferrer')
      expect(onClose).toHaveBeenCalled()
    })

    it('clicking the overlay outside the box calls onClose', () => {
      const onClose = vi.fn()
      const { container } = render(<CommandPalette open onClose={onClose} />)
      const overlay = container.querySelector('.absolute.inset-0')
      expect(overlay).toBeInTheDocument()
      fireEvent.click(overlay!)
      expect(onClose).toHaveBeenCalled()
    })
  })
})
