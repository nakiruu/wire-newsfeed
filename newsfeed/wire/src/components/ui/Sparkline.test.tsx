import { render, screen } from '@testing-library/react'
import { Sparkline } from './Sparkline'

describe('Sparkline', () => {
  it('renders nothing when data is empty', () => {
    const { container } = render(<Sparkline data={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders one bar per data point', () => {
    const { container } = render(<Sparkline data={[1, 2, 3, 4, 5]} />)
    const wrapper = container.firstChild as HTMLElement
    const bars = wrapper.querySelectorAll('[style*="height"]')
    expect(bars.length).toBe(5)
  })

  it('renders with single data point', () => {
    const { container } = render(<Sparkline data={[42]} />)
    expect(container.firstChild).not.toBeNull()
    const wrapper = container.firstChild as HTMLElement
    const bars = wrapper.querySelectorAll('[style*="height"]')
    expect(bars.length).toBe(1)
  })

  it('handles all-zero data without crashing', () => {
    const { container } = render(<Sparkline data={[0, 0, 0]} />)
    expect(container.firstChild).not.toBeNull()
  })

  it('applies custom height via style', () => {
    const { container } = render(<Sparkline data={[1, 2]} height={48} />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.height).toBe('48px')
  })

  it('renders without crashing when currentHourIndex is provided', () => {
    const { container } = render(<Sparkline data={[3, 7, 2]} currentHourIndex={1} />)
    expect(container.firstChild).not.toBeNull()
  })
})
