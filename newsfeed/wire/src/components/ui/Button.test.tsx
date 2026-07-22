import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('fires onClick handler', () => {
    const handler = vi.fn()
    render(<Button onClick={handler}>Go</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is set', () => {
    render(<Button disabled>Nope</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('does not fire onClick when disabled', () => {
    const handler = vi.fn()
    render(<Button disabled onClick={handler}>Nope</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(handler).not.toHaveBeenCalled()
  })

  it('renders all variants without error', () => {
    const { rerender } = render(<Button variant="primary">P</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
    rerender(<Button variant="ghost">G</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
    rerender(<Button variant="pill">L</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('pill variant reflects active state', () => {
    const { rerender } = render(<Button variant="pill" active={false}>Tab</Button>)
    const btn = screen.getByRole('button')
    const inactiveClass = btn.className
    rerender(<Button variant="pill" active={true}>Tab</Button>)
    const activeClass = btn.className
    expect(activeClass).not.toBe(inactiveClass)
  })
})
