import { render, screen, fireEvent } from '@testing-library/react'
import { Tooltip } from './Tooltip'

describe('Tooltip', () => {
  it('renders children', () => {
    render(<Tooltip content="tip text"><button>Hover me</button></Tooltip>)
    expect(screen.getByRole('button', { name: 'Hover me' })).toBeInTheDocument()
  })

  it('does not show tooltip content initially', () => {
    render(<Tooltip content="tip text"><span>target</span></Tooltip>)
    expect(screen.queryByText('tip text')).not.toBeInTheDocument()
  })

  it('shows tooltip content on mouse enter', () => {
    render(<Tooltip content="tip text"><span>target</span></Tooltip>)
    fireEvent.mouseEnter(screen.getByText('target').parentElement!)
    expect(screen.getByText('tip text')).toBeInTheDocument()
  })

  it('hides tooltip content on mouse leave', () => {
    render(<Tooltip content="tip text"><span>target</span></Tooltip>)
    const wrapper = screen.getByText('target').parentElement!
    fireEvent.mouseEnter(wrapper)
    expect(screen.getByText('tip text')).toBeInTheDocument()
    fireEvent.mouseLeave(wrapper)
    expect(screen.queryByText('tip text')).not.toBeInTheDocument()
  })
})
