import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EmptyState } from './EmptyState'
import { renderWithRouter } from '@/test/test-utils'
import {
  assertEmptyState,
  assertTextExists,
  assertElementVisible,
  assertMobileResponsive,
  assertButtonState
} from '@/test/assertion-helpers'

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
  it('should display welcome message and description', async () => {
    await renderWithRouter(<EmptyState />)
    assertEmptyState()
  })

  it('should display Create Position button', async () => {
    await renderWithRouter(<EmptyState />)
    assertButtonState('Create Your First Position', true)
  })

  it('should display key features list', async () => {
    await renderWithRouter(<EmptyState />)

    assertTextExists(/Immutable trade plans with forced journaling/)
    assertTextExists(/Real-time P&L tracking/)
    assertTextExists(/Plan vs execution analysis for learning/)
    assertTextExists(/Privacy-first with local data storage/)
  })

  it('should display trading journal chart icon', async () => {
    await renderWithRouter(<EmptyState />)
    const iconElement = screen.getByTestId('empty-state-icon')
    assertElementVisible(iconElement)
  })

  it('should navigate to position creation when Create Position button is clicked', async () => {
    await renderWithRouter(<EmptyState />)

    const createButton = screen.getByRole('button', { name: /Create Your First Position/i })
    fireEvent.click(createButton)

    expect(mockNavigate).toHaveBeenCalledWith('/position/create')
  })

  it('should have mobile-first responsive design', async () => {
    await renderWithRouter(<EmptyState />)
    assertMobileResponsive('empty-state-container', ['max-w-sm', 'mx-auto'])
  })

  it('should display feature checkmarks with proper styling', async () => {
    await renderWithRouter(<EmptyState />)

    // Look for checkmark icons in feature list
    const checkmarks = screen.getAllByTestId('feature-checkmark')
    expect(checkmarks).toHaveLength(4)
  })
})