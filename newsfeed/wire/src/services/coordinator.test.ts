import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ProviderCoordinator } from './coordinator'
import { useFeedStore } from '../stores/feedStore'
import type { NewsProvider, Article } from '../providers/types'

const makeArticle = (id: string): Article => ({
  id, title: 'Test', summary: '', url: `https://example.com/${id}`,
  source: 'FINNHUB', provider_label: 'FINNHUB', symbols: [],
  published_at: new Date().toISOString(), ingested_at: new Date().toISOString(),
})

const makeProvider = (articles: Article[]): NewsProvider => ({
  name: 'FINNHUB', poll_interval_ms: 100,
  rate_limit: { requests: 10, window_ms: 1000 },
  fetch: vi.fn().mockResolvedValue(articles),
})

beforeEach(() => {
  useFeedStore.setState({ articles: [], pendingArticles: [], readIds: new Set(), bookmarkIds: new Set(), focusedIndex: 0 })
  vi.useFakeTimers()
})

afterEach(() => { vi.useRealTimers() })

describe('ProviderCoordinator', () => {
  it('polls provider on interval and writes to feedStore', async () => {
    const provider = makeProvider([makeArticle('a')])
    const coord = new ProviderCoordinator([provider])
    coord.start()
    // Advance past one poll cycle (immediate poll + interval)
    await vi.advanceTimersByTimeAsync(150)
    expect(useFeedStore.getState().articles.length + useFeedStore.getState().pendingArticles.length).toBe(1)
    coord.stop()
  })

  it('does not duplicate articles across polls', async () => {
    const provider = makeProvider([makeArticle('a')])
    const coord = new ProviderCoordinator([provider])
    coord.start()
    // Advance past two poll cycles to trigger dedup
    await vi.advanceTimersByTimeAsync(250)
    const total = useFeedStore.getState().articles.length + useFeedStore.getState().pendingArticles.length
    expect(total).toBe(1)
    coord.stop()
  })

  it('stop clears all timers', () => {
    const provider = makeProvider([])
    const coord = new ProviderCoordinator([provider])
    coord.start()
    coord.stop()
    expect(coord.isRunning).toBe(false)
  })
})
