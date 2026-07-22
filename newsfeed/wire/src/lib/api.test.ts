import { describe, it, expect } from 'vitest'
import { buildProxiedUrl } from './api'

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
