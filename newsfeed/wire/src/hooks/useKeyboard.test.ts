import { renderHook } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { useKeyboard } from './useKeyboard'
import { describe, it, expect, vi } from 'vitest'

describe('useKeyboard', () => {
  it('calls onNavigateDown when j is pressed', () => {
    const onNavigateDown = vi.fn()
    renderHook(() => useKeyboard({ onNavigateDown }))
    fireEvent.keyDown(document, { key: 'j' })
    expect(onNavigateDown).toHaveBeenCalled()
  })

  it('calls onNavigateUp when k is pressed', () => {
    const onNavigateUp = vi.fn()
    renderHook(() => useKeyboard({ onNavigateUp }))
    fireEvent.keyDown(document, { key: 'k' })
    expect(onNavigateUp).toHaveBeenCalled()
  })

  it('calls onOpen when o is pressed', () => {
    const onOpen = vi.fn()
    renderHook(() => useKeyboard({ onOpen }))
    fireEvent.keyDown(document, { key: 'o' })
    expect(onOpen).toHaveBeenCalled()
  })

  it('calls onBookmark when b is pressed', () => {
    const onBookmark = vi.fn()
    renderHook(() => useKeyboard({ onBookmark }))
    fireEvent.keyDown(document, { key: 'b' })
    expect(onBookmark).toHaveBeenCalled()
  })

  it('calls onMarkRead when r is pressed', () => {
    const onMarkRead = vi.fn()
    renderHook(() => useKeyboard({ onMarkRead }))
    fireEvent.keyDown(document, { key: 'r' })
    expect(onMarkRead).toHaveBeenCalled()
  })

  it('calls onSearch when / is pressed', () => {
    const onSearch = vi.fn()
    renderHook(() => useKeyboard({ onSearch }))
    fireEvent.keyDown(document, { key: '/' })
    expect(onSearch).toHaveBeenCalled()
  })

  it('calls onEscape when Escape is pressed', () => {
    const onEscape = vi.fn()
    renderHook(() => useKeyboard({ onEscape }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onEscape).toHaveBeenCalled()
  })

  it('calls onCommandPalette when Ctrl+K is pressed', () => {
    const onCommandPalette = vi.fn()
    renderHook(() => useKeyboard({ onCommandPalette }))
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    expect(onCommandPalette).toHaveBeenCalled()
  })

  it('calls onCommandPalette when Cmd+K is pressed (macOS)', () => {
    const onCommandPalette = vi.fn()
    renderHook(() => useKeyboard({ onCommandPalette }))
    fireEvent.keyDown(document, { key: 'k', metaKey: true })
    expect(onCommandPalette).toHaveBeenCalled()
  })

  it('ignores keyboard shortcuts when inside INPUT element', () => {
    const onNavigateDown = vi.fn()
    const input = document.createElement('input')
    document.body.appendChild(input)

    renderHook(() => useKeyboard({ onNavigateDown }))
    fireEvent.keyDown(input, { key: 'j' })
    expect(onNavigateDown).not.toHaveBeenCalled()

    document.body.removeChild(input)
  })

  it('ignores keyboard shortcuts when inside TEXTAREA element', () => {
    const onSearch = vi.fn()
    const textarea = document.createElement('textarea')
    document.body.appendChild(textarea)

    renderHook(() => useKeyboard({ onSearch }))
    fireEvent.keyDown(textarea, { key: '/' })
    expect(onSearch).not.toHaveBeenCalled()

    document.body.removeChild(textarea)
  })

  it('ignores keyboard shortcuts when inside contenteditable element', () => {
    const onNavigateUp = vi.fn()
    const editable = document.createElement('div')
    editable.contentEditable = 'true'
    document.body.appendChild(editable)

    renderHook(() => useKeyboard({ onNavigateUp }))
    fireEvent.keyDown(editable, { key: 'k' })
    expect(onNavigateUp).not.toHaveBeenCalled()

    document.body.removeChild(editable)
  })

  it('Escape key works even when inside an input', () => {
    const onEscape = vi.fn()
    const input = document.createElement('input')
    document.body.appendChild(input)

    renderHook(() => useKeyboard({ onEscape }))
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onEscape).toHaveBeenCalled()

    document.body.removeChild(input)
  })

  it('Ctrl+K works even when inside an input', () => {
    const onCommandPalette = vi.fn()
    const input = document.createElement('input')
    document.body.appendChild(input)

    renderHook(() => useKeyboard({ onCommandPalette }))
    fireEvent.keyDown(input, { key: 'k', ctrlKey: true })
    expect(onCommandPalette).toHaveBeenCalled()

    document.body.removeChild(input)
  })

  it('does not call handlers for unregistered keys', () => {
    const onNavigateDown = vi.fn()
    renderHook(() => useKeyboard({ onNavigateDown }))
    fireEvent.keyDown(document, { key: 'x' })
    expect(onNavigateDown).not.toHaveBeenCalled()
  })

  it('handles undefined handlers gracefully', () => {
    expect(() => {
      renderHook(() => useKeyboard({}))
      fireEvent.keyDown(document, { key: 'j' })
    }).not.toThrow()
  })

  it('cleans up event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useKeyboard({ onNavigateDown: vi.fn() }))
    unmount()
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    removeEventListenerSpy.mockRestore()
  })
})
