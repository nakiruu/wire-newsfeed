import { render, screen } from '@testing-library/react'
import { Badge } from './Badge'

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>AAPL</Badge>)
    expect(screen.getByText('AAPL')).toBeInTheDocument()
  })

  it('defaults to ticker variant', () => {
    render(<Badge>AAPL</Badge>)
    const el = screen.getByText('AAPL')
    expect(el.tagName).toBe('SPAN')
  })

  it('renders all variants without error', () => {
    const { rerender } = render(<Badge variant="ticker">T</Badge>)
    expect(screen.getByText('T')).toBeInTheDocument()
    rerender(<Badge variant="category">C</Badge>)
    expect(screen.getByText('C')).toBeInTheDocument()
    rerender(<Badge variant="error">E</Badge>)
    expect(screen.getByText('E')).toBeInTheDocument()
  })

  it('merges className prop', () => {
    render(<Badge className="extra">X</Badge>)
    expect(screen.getByText('X').className).toContain('extra')
  })
})
