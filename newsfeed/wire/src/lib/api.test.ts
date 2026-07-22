import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildProxiedUrl, proxyFetch } from './api'
import { useConfigStore } from '../stores/configStore'

vi.mock('../stores/configStore', () => ({
  useConfigStore: {
    getState: vi.fn(),
  },
}))

describe('buildProxiedUrl', () => {
  it('prepends proxy base when proxy is configured', () => {
    expect(buildProxiedUrl('https://api.example.com/data', 'http://proxy:8080'))
      .toBe('http://proxy:8080/https://api.example.com/data')
  })

  it('returns original URL when proxy is empty', () => {
    expect(buildProxiedUrl('https://api.example.com/data', ''))
      .toBe('https://api.example.com/data')
  })

  it('strips trailing slash from proxy base before joining', () => {
    expect(buildProxiedUrl('https://api.example.com/data', 'http://proxy:8080/'))
      .toBe('http://proxy:8080/https://api.example.com/data')
  })
})

describe('proxyFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('reads corsProxyUrl from configStore at call time and constructs proxied URL', async () => {
    vi.mocked(useConfigStore.getState).mockReturnValue({
      corsProxyUrl: 'http://proxy.test',
    } as any)

    global.fetch = vi.fn().mockResolvedValue({ ok: true })

    await proxyFetch('http://api.example.com/data')

    expect(global.fetch).toHaveBeenCalledWith('http://proxy.test/http://api.example.com/data', undefined)
  })
})
