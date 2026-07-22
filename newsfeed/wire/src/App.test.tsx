import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the Wire initializing message', () => {
    render(<App />)
    expect(screen.getByText(/Wire — initializing/)).toBeInTheDocument()
  })
})
