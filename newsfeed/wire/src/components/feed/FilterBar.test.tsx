import { render, screen, fireEvent } from '@testing-library/react'
import { FilterBar } from './FilterBar'
import { useFilterStore } from '../../stores/filterStore'

// Reset store state between tests
beforeEach(() => {
  useFilterStore.setState({ activeCategory: null })
})

describe('FilterBar', () => {
  it('renders all filter pill labels', () => {
    render(<FilterBar />)
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Earnings' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'M&A' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Macro' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'SEC Filings' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Press Releases' })).toBeInTheDocument()
  })

  it('"All" pill is active when activeCategory is null', () => {
    useFilterStore.setState({ activeCategory: null })
    render(<FilterBar />)
    const allBtn = screen.getByRole('button', { name: 'All' })
    // pill active class contains text-[#0070F3]
    expect(allBtn.className).toContain('text-[#0070F3]')
  })

  it('clicking "Earnings" calls setCategory with "earnings"', () => {
    render(<FilterBar />)
    fireEvent.click(screen.getByRole('button', { name: 'Earnings' }))
    expect(useFilterStore.getState().activeCategory).toBe('earnings')
  })

  it('clicking "M&A" calls setCategory with "m&a"', () => {
    render(<FilterBar />)
    fireEvent.click(screen.getByRole('button', { name: 'M&A' }))
    expect(useFilterStore.getState().activeCategory).toBe('m&a')
  })

  it('clicking "All" resets activeCategory to null', () => {
    useFilterStore.setState({ activeCategory: 'earnings' })
    render(<FilterBar />)
    fireEvent.click(screen.getByRole('button', { name: 'All' }))
    expect(useFilterStore.getState().activeCategory).toBeNull()
  })

  it('active pill has different class than inactive pill', () => {
    useFilterStore.setState({ activeCategory: 'macro' })
    render(<FilterBar />)
    const macroBtn = screen.getByRole('button', { name: 'Macro' })
    const earningsBtn = screen.getByRole('button', { name: 'Earnings' })
    expect(macroBtn.className).toContain('text-[#0070F3]')
    expect(earningsBtn.className).not.toContain('text-[#0070F3]')
  })
})
