import { render, screen, waitFor, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Home } from './Home'
import { mockPositionServiceModule, resetMockService } from '@/test/mocks/position-service-mock'
import { TEST_POSITIONS, createPosition } from '@/test/data-factories'
import { renderWithRouter } from '@/test/test-utils'
import {
  assertEmptyState,
  assertPositionInDashboard,
  assertFabButtonVisible,
  assertTextExists,
  assertElementsVisible,
  assertTextDoesNotExist,
  assertButtonState
} from '@/test/assertion-helpers'
import type { Position } from '@/lib/position'
import { ServiceContainer } from '@/services/ServiceContainer'

// Mock the PositionService using centralized factory
vi.mock('@/lib/position', async () => {
  const actual = await vi.importActual('@/lib/position')
  return {
    ...actual,
    PositionService: vi.fn().mockImplementation(() => mockPositionServiceModule)
  }
})


describe('Home', () => {
  let mockPositionService: any
  let mockPositions: Position[]

  beforeEach(() => {
    // Reset ServiceContainer
    ServiceContainer.resetInstance()

    mockPositions = [TEST_POSITIONS.single]
    mockPositionService = mockPositionServiceModule
    resetMockService(mockPositionService)

    // Inject mock service into ServiceContainer
    const services = ServiceContainer.getInstance()
    services.setPositionService(mockPositionService)
  })

  afterEach(() => {
    ServiceContainer.resetInstance()
  })


  it('shows EmptyState when no positions exist', async () => {
    mockPositionService.getAll.mockResolvedValue([])

    await act(async () => {
      renderWithRouter(<Home />)
    })

    await waitFor(() => {
      assertEmptyState()
      const iconElement = screen.getByTestId('empty-state-icon')
      assertElementsVisible([iconElement])
    })
  })

  it('shows Dashboard when positions exist', async () => {
    mockPositionService.getAll.mockResolvedValue(mockPositions)

    await act(async () => {
      renderWithRouter(<Home />)
    })

    await waitFor(() => {
      assertTextExists('Positions')
      assertPositionInDashboard('AAPL')
      assertTextExists('Long Stock')
    })
  })

  it('shows EmptyState features when no positions', async () => {
    mockPositionService.getAll.mockResolvedValue([])

    await act(async () => {
      renderWithRouter(<Home />)
    })

    await waitFor(() => {
      assertTextExists(/Immutable trade plans with forced journaling/)
      assertTextExists(/Real-time P&L tracking with FIFO cost basis/)
      assertTextExists(/Plan vs execution analysis for learning/)
      assertTextExists(/Privacy-first with local data storage/)

      const checkmarks = screen.getAllByTestId('feature-checkmark')
      expect(checkmarks).toHaveLength(4)
    })
  })

  it('handles error when checking for positions', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockPositionService.getAll.mockRejectedValue(new Error('Database error'))

    await act(async () => {
      renderWithRouter(<Home />)
    })

    await waitFor(() => {
      expect(screen.getByText('Error Loading App')).toBeInTheDocument()
      expect(screen.getByText('Database error')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
      assertTextDoesNotExist('Loading...')
    })

    consoleSpy.mockRestore()
  })

  it('shows Create Position button in EmptyState', async () => {
    mockPositionService.getAll.mockResolvedValue([])

    await act(async () => {
      renderWithRouter(<Home />)
    })

    await waitFor(() => {
      assertButtonState('Create Your First Position', true)
    })
  })

  it('shows floating action button in Dashboard when positions exist', async () => {
    mockPositionService.getAll.mockResolvedValue(mockPositions)

    await act(async () => {
      renderWithRouter(<Home />)
    })

    await waitFor(() => {
      assertFabButtonVisible()
    })
  })
})