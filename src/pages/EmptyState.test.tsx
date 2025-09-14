import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EmptyState } from './EmptyState'
import { renderWithRouter } from '@/test/test-utils'

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})


describe('EmptyState - Phase 1A: Empty App State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it('should display welcome message and description', () => {
    renderWithRouter(<EmptyState />)

    expect(screen.getByText('Start Your Trading Journey')).toBeInTheDocument()
    expect(screen.getByText(/Track your trades, learn from your decisions/)).toBeInTheDocument()
  })

  it('should display Create Position button', () => {
    renderWithRouter(<EmptyState />)

    const createButton = screen.getByRole('button', { name: /Create Your First Position/i })
    expect(createButton).toBeInTheDocument()
  })

  it('should display key features list', () => {
    renderWithRouter(<EmptyState />)

    expect(screen.getByText(/Immutable trade plans with forced journaling/)).toBeInTheDocument()
    expect(screen.getByText(/Real-time P&L tracking/)).toBeInTheDocument()
    expect(screen.getByText(/Plan vs execution analysis for learning/)).toBeInTheDocument()
    expect(screen.getByText(/Privacy-first with local data storage/)).toBeInTheDocument()
  })

  it('should display trading journal chart icon', () => {
    renderWithRouter(<EmptyState />)

    // Look for icon container
    const iconElement = screen.getByTestId('empty-state-icon')
    expect(iconElement).toBeInTheDocument()
  })

  it('should navigate to position creation when Create Position button is clicked', () => {
    renderWithRouter(<EmptyState />)

    const createButton = screen.getByRole('button', { name: /Create Your First Position/i })
    fireEvent.click(createButton)

    expect(mockNavigate).toHaveBeenCalledWith('/position/create')
  })

  it('should have mobile-first responsive design', () => {
    renderWithRouter(<EmptyState />)

    const container = screen.getByTestId('empty-state-container')
    expect(container).toBeInTheDocument()

    // Check that container follows mobile-first design
    expect(container).toHaveClass('max-w-sm', 'mx-auto')
  })

  it('should display feature checkmarks with proper styling', () => {
    renderWithRouter(<EmptyState />)

    // Look for checkmark icons in feature list
    const checkmarks = screen.getAllByTestId('feature-checkmark')
    expect(checkmarks).toHaveLength(4)
  })
})