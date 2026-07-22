import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from './Input'

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input placeholder="Search..." />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('accepts and displays placeholder', () => {
    render(<Input placeholder="Type here" />)
    expect(screen.getByPlaceholderText('Type here')).toBeInTheDocument()
  })

  it('calls onChange when value changes', () => {
    const handler = vi.fn()
    render(<Input onChange={handler} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'abc' } })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('renders icon slot when icon prop provided', () => {
    render(<Input icon={<span data-testid="icon" />} />)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('renders without icon slot when no icon prop', () => {
    render(<Input />)
    expect(screen.queryByTestId('icon')).not.toBeInTheDocument()
  })

  it('passes through arbitrary props', () => {
    render(<Input type="search" aria-label="search field" />)
    expect(screen.getByRole('searchbox', { name: 'search field' })).toBeInTheDocument()
  })
})
