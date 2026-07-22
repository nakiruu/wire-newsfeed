import type { NewsProvider } from '../providers/types'
import { exactDedup, fuzzyDedup } from '../providers/dedup'
import { useFeedStore } from '../stores/feedStore'
import { useConfigStore } from '../stores/configStore'
import { FMPProvider } from '../providers/fmp.provider'
import { AlpacaProvider } from '../providers/alpaca.provider'
import { RSSProvider } from '../providers/rss.provider'
import { SECProvider } from '../providers/sec.provider'

interface ProviderEntry {
  provider: NewsProvider
  timer: ReturnType<typeof setInterval> | null
  isFirstPoll: boolean
  consecutiveFailures: number
}

export class ProviderCoordinator {
  private entries: ProviderEntry[] = []
  private knownIds = new Set<string>()
  private _isRunning = false

  constructor(private providers: NewsProvider[]) {}

  get isRunning(): boolean {
    return this._isRunning
  }

  start(): void {
    if (this._isRunning) return
    this._isRunning = true

    // Seed knownIds from articles already in the feed
    const existingArticles = useFeedStore.getState().articles
    for (const a of existingArticles) this.knownIds.add(a.id)

    for (const provider of this.providers) {
      const entry: ProviderEntry = {
        provider,
        timer: null,
        isFirstPoll: true,
        consecutiveFailures: 0,
      }
      this.entries.push(entry)

      // Immediate first poll
      void this.poll(entry)

      // Recurring interval
      entry.timer = setInterval(
        () => void this.poll(entry),
        provider.poll_interval_ms,
      )
    }
  }

  stop(): void {
    for (const entry of this.entries) {
      if (entry.timer !== null) {
        clearInterval(entry.timer)
        entry.timer = null
      }
    }
    this.entries = []
    this._isRunning = false
  }

  private async poll(entry: ProviderEntry): Promise<void> {
    const { provider } = entry
    try {
      const raw = await provider.fetch({})
      const deduped = exactDedup(raw, this.knownIds)

      if (deduped.length > 0) {
        const merged = fuzzyDedup(deduped)
        for (const a of merged) this.knownIds.add(a.id)

        // First poll per provider goes straight to visible feed; subsequent to pending
        useFeedStore.getState().addArticles(merged, entry.isFirstPoll)
      }

      entry.isFirstPoll = false
      entry.consecutiveFailures = 0
      useConfigStore.getState().clearProviderError(provider.name)
    } catch (err) {
      entry.consecutiveFailures++
      const message = err instanceof Error ? err.message : 'Unknown error'
      useConfigStore.getState().setProviderError(provider.name, message)

      // Exponential backoff: reschedule with capped interval
      const baseInterval = provider.poll_interval_ms
      const backoffInterval = Math.min(
        baseInterval * Math.pow(2, entry.consecutiveFailures),
        10 * 60 * 1000,
      )

      if (entry.timer !== null) {
        clearInterval(entry.timer)
        entry.timer = setTimeout(() => {
          void this.poll(entry)
          // Resume normal interval after one backoff attempt
          entry.timer = setInterval(
            () => void this.poll(entry),
            baseInterval,
          )
        }, backoffInterval) as unknown as ReturnType<typeof setInterval>
      }
    }
  }
}

export function createCoordinator(): ProviderCoordinator {
  const { providers } = useConfigStore.getState()
  const active: NewsProvider[] = []

  if (providers.FMP.enabled && providers.FMP.api_key) {
    active.push(new FMPProvider(providers.FMP.api_key))
  }

  if (providers.ALPACA.enabled && providers.ALPACA.api_key) {
    const [key, secret] = providers.ALPACA.api_key.split(':')
    if (key && secret) active.push(new AlpacaProvider(key, secret))
  }

  if (providers.RSS.enabled) {
    active.push(new RSSProvider(providers.RSS.custom_feeds))
  }

  if (providers.SEC.enabled) {
    active.push(new SECProvider())
  }

  return new ProviderCoordinator(active)
}

// Singleton instance — created lazily on first access
let _coordinator: ProviderCoordinator | null = null

export function getCoordinator(): ProviderCoordinator {
  if (!_coordinator) {
    _coordinator = createCoordinator()
  }
  return _coordinator
}
