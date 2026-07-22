import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveReadIds,
  loadReadIds,
  saveBookmarkIds,
  loadBookmarkIds,
  saveConfigStore,
  loadConfigStore,
} from './storage'

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('saveReadIds / loadReadIds', () => {
    it('saves a Set and loads it back', () => {
      const ids = new Set(['1', '2', '3'])
      saveReadIds(ids)
      const loaded = loadReadIds()
      expect(loaded).toEqual(ids)
    })

    it('returns empty Set when no key exists', () => {
      const loaded = loadReadIds()
      expect(loaded).toEqual(new Set())
    })

    it('returns empty Set on corrupt JSON', () => {
      localStorage.setItem('wire:readIds', 'invalid json {')
      const loaded = loadReadIds()
      expect(loaded).toEqual(new Set())
    })
  })

  describe('saveBookmarkIds / loadBookmarkIds', () => {
    it('saves a Set and loads it back', () => {
      const ids = new Set(['a', 'b', 'c'])
      saveBookmarkIds(ids)
      const loaded = loadBookmarkIds()
      expect(loaded).toEqual(ids)
    })

    it('returns empty Set when no key exists', () => {
      const loaded = loadBookmarkIds()
      expect(loaded).toEqual(new Set())
    })

    it('returns empty Set on corrupt JSON', () => {
      localStorage.setItem('wire:bookmarkIds', 'invalid json {')
      const loaded = loadBookmarkIds()
      expect(loaded).toEqual(new Set())
    })
  })

  describe('saveConfigStore / loadConfigStore', () => {
    it('saves an object and loads it back', () => {
      const config = { corsProxyUrl: 'http://proxy.test', theme: 'dark' }
      saveConfigStore(config)
      const loaded = loadConfigStore()
      expect(loaded).toEqual(config)
    })

    it('returns null when no key exists', () => {
      const loaded = loadConfigStore()
      expect(loaded).toBeNull()
    })

    it('returns null on corrupt JSON', () => {
      localStorage.setItem('wire:config', 'invalid json {')
      const loaded = loadConfigStore()
      expect(loaded).toBeNull()
    })
  })
})
