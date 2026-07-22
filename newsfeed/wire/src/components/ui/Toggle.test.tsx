import { render, screen, fireEvent } from '@testing-library/react'
import { Toggle } from './Toggle'

describe('Toggle', () => {
  it('renders with correct aria-checked when unchecked', () => {
    render(<Toggle checked={false} onChange={() => {}} />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
  })

  it('renders with correct aria-checked when checked', () => {
    render(<Toggle checked={true} onChange={() => {}} />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })

  it('calls onChange with toggled value when clicked', () => {
    const handler = vi.fn()
    render(<Toggle checked={false} onChange={handler} />)
    fireEvent.click(screen.getByRole('switch'))
    expect(handler).toHaveBeenCalledWith(true)
  })

  it('calls onChange with false when checked=true and clicked', () => {
    const handler = vi.fn()
    render(<Toggle checked={true} onChange={handler} />)
    fireEvent.click(screen.getByRole('switch'))
    expect(handler).toHaveBeenCalledWith(false)
  })

  it('renders label text when label prop is provided', () => {
    render(<Toggle checked={false} onChange={() => {}} label="Dark mode" />)
    expect(screen.getByText('Dark mode')).toBeInTheDocument()
  })

  it('is disabled when disabled prop is set', () => {
    render(<Toggle checked={false} onChange={() => {}} disabled />)
    expect(screen.getByRole('switch')).toBeDisabled()
  })

  it('does not call onChange when disabled', () => {
    const handler = vi.fn()
    render(<Toggle checked={false} onChange={handler} disabled />)
    fireEvent.click(screen.getByRole('switch'))
    expect(handler).not.toHaveBeenCalled()
  })
})
