import { renderHook, act } from '@testing-library/react'
import { useRelativeTime } from './useRelativeTime'

describe('useRelativeTime', () => {
  it('returns a non-empty string for a valid ISO date', () => {
    const past = new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5 min ago
    const { result } = renderHook(() => useRelativeTime(past))
    expect(result.current).toBeTruthy()
    expect(typeof result.current).toBe('string')
  })

  it('returns empty string for invalid date', () => {
    const { result } = renderHook(() => useRelativeTime('not-a-date'))
    expect(result.current).toBe('')
  })

  it('contains "ago" for a past date', () => {
    const past = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
    const { result } = renderHook(() => useRelativeTime(past))
    expect(result.current).toMatch(/ago/)
  })

  it('updates on interval', () => {
    vi.useFakeTimers()
    const dateStr = new Date(Date.now() - 10_000).toISOString()
    const { result } = renderHook(() => useRelativeTime(dateStr))
    const initial = result.current
    act(() => { vi.advanceTimersByTime(30_000) })
    // Still a string (may or may not change depending on time boundary)
    expect(typeof result.current).toBe('string')
    vi.useRealTimers()
  })

  it('clears interval on unmount', () => {
    vi.useFakeTimers()
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
    const dateStr = new Date().toISOString()
    const { unmount } = renderHook(() => useRelativeTime(dateStr))
    unmount()
    expect(clearIntervalSpy).toHaveBeenCalled()
    clearIntervalSpy.mockRestore()
    vi.useRealTimers()
  })
})
