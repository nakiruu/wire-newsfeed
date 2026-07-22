import { useEffect } from 'react'

export interface KeyHandlers {
  onNavigateDown?(): void
  onNavigateUp?(): void
  onOpen?(): void
  onBookmark?(): void
  onMarkRead?(): void
  onSearch?(): void
  onCommandPalette?(): void
  onEscape?(): void
}

export function useKeyboard(handlers: KeyHandlers) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      const isInput =
        target != null &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.contentEditable === 'true')

      if (e.key === 'Escape') { handlers.onEscape?.(); return }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); handlers.onCommandPalette?.(); return }
      if (isInput) return
      switch (e.key) {
        case 'j': handlers.onNavigateDown?.(); break
        case 'k': handlers.onNavigateUp?.(); break
        case 'o': handlers.onOpen?.(); break
        case 'b': handlers.onBookmark?.(); break
        case 'r': handlers.onMarkRead?.(); break
        case '/': e.preventDefault(); handlers.onSearch?.(); break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handlers])
}
