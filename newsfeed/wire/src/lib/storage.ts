const READ_IDS_KEY = 'wire:readIds'
const BOOKMARK_IDS_KEY = 'wire:bookmarkIds'

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
