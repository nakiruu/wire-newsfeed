import { describe, it, expect } from 'vitest'
import { stripHtml, toSentiment } from './normalize'

describe('stripHtml', () => {
  it('removes HTML tags', () => {
    expect(stripHtml('<p>Hello <b>world</b></p>')).toBe('Hello world')
  })

  it('decodes common HTML entities', () => {
    expect(stripHtml('AT&amp;T reports &quot;record&quot; earnings')).toBe(
      'AT&T reports "record" earnings'
    )
  })

  it('returns plain strings unchanged', () => {
    expect(stripHtml('plain text')).toBe('plain text')
  })
})

describe('toSentiment', () => {
  it('maps bullish variants', () => {
    expect(toSentiment('Bullish')).toBe('bullish')
    expect(toSentiment('POSITIVE')).toBe('bullish')
    expect(toSentiment('positive')).toBe('bullish')
  })

  it('maps bearish variants', () => {
    expect(toSentiment('Bearish')).toBe('bearish')
    expect(toSentiment('NEGATIVE')).toBe('bearish')
  })

  it('returns neutral for unknown strings', () => {
    expect(toSentiment('unknown')).toBe('neutral')
  })

  it('returns undefined when input is undefined', () => {
    expect(toSentiment(undefined)).toBeUndefined()
  })
})
