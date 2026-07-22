import { openDB } from 'idb'
import type { Article } from '../providers/types'

const READ_IDS_KEY = 'wire:readIds'
const BOOKMARK_IDS_KEY = 'wire:bookmarkIds'

// ---------------------------------------------------------------------------
// IndexedDB article cache
// ---------------------------------------------------------------------------

const IDB_NAME = 'wire'
const IDB_STORE = 'wire-articles'
const IDB_VERSION = 1
const IDB_MAX_ARTICLES = 1000

function getDb() {
  return openDB(IDB_NAME, IDB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'id' })
      }
    },
  })
}

export async function cacheArticles(articles: Article[]): Promise<void> {
  if (articles.length === 0) return
  try {
    const db = await getDb()
    const tx = db.transaction(IDB_STORE, 'readwrite')
    const store = tx.objectStore(IDB_STORE)
    for (const article of articles) {
      await store.put(article)
    }
    await tx.done
    // Trim to last 1000 by published_at descending
    const all = await db.getAll(IDB_STORE) as Article[]
    if (all.length > IDB_MAX_ARTICLES) {
      all.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
      const toDelete = all.slice(IDB_MAX_ARTICLES)
      const trimTx = db.transaction(IDB_STORE, 'readwrite')
      const trimStore = trimTx.objectStore(IDB_STORE)
      for (const article of toDelete) {
        await trimStore.delete(article.id)
      }
      await trimTx.done
    }
  } catch {
    // IDB unavailable (e.g. private browsing) — degrade gracefully
  }
}

export async function loadCachedArticles(): Promise<Article[]> {
  try {
    const db = await getDb()
    const all = await db.getAll(IDB_STORE) as Article[]
    all.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    return all.slice(0, IDB_MAX_ARTICLES)
  } catch {
    return []
  }
}

export function saveReadIds(ids: Set<string>): void {
  localStorage.setItem(READ_IDS_KEY, JSON.stringify([...ids]))
}

export function loadReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_IDS_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch { return new Set() }
}

export function saveBookmarkIds(ids: Set<string>): void {
  localStorage.setItem(BOOKMARK_IDS_KEY, JSON.stringify([...ids]))
}

export function loadBookmarkIds(): Set<string> {
  try {
    const raw = localStorage.getItem(BOOKMARK_IDS_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch { return new Set() }
}

export function saveConfigStore(config: unknown): void {
  localStorage.setItem('wire:config', JSON.stringify(config))
}

export function loadConfigStore(): unknown {
  try {
    const raw = localStorage.getItem('wire:config')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
