import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react'
import { PositionDetail } from './PositionDetail'
import { mockPositionServiceModule, resetMockService } from '@/test/mocks/position-service-mock'
import { TEST_POSITIONS } from '@/test/data-factories'
import { renderWithRouter } from '@/test/test-utils'
import {
  assertTextExists,
  assertElementVisible
} from '@/test/assertion-helpers'
import type { Position } from '@/lib/position'

// Mock the PositionService using centralized factory
vi.mock('@/lib/position', async () => {
  const actual = await vi.importActual('@/lib/position')
  return {
    ...actual,
    PositionService: vi.fn().mockImplementation(() => mockPositionServiceModule)
  }
})

// Mock react-router-dom
const mockNavigate = vi.fn()
const mockParams = { id: 'pos-123' }
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  }
})

describe('PositionDetail', () => {
  let mockPositionService: any
  let mockPosition: Position

  beforeEach(() => {
    vi.clearAllMocks()
    mockPosition = TEST_POSITIONS.single
    mockPositionService = mockPositionServiceModule
    resetMockService(mockPositionService)
  })

  it('should display position not found when position does not exist', async () => {
    mockPositionService.getById.mockResolvedValue(null)

    await act(async () => {
      renderWithRouter(<PositionDetail />)
    })

    await waitFor(() => {
      expect(screen.getByText('Position not found')).toBeInTheDocument()
    })
  })


  it('should display position header with symbol and strategy', async () => {
    mockPositionService.getById.mockResolvedValue(mockPosition)

    await act(async () => {
      renderWithRouter(<PositionDetail />)
    })

    await waitFor(() => {
      assertTextExists('AAPL')
      assertTextExists(/Long Stock/)
    })
  })

  it('should display performance section with current price and P&L stats', async () => {
    mockPositionService.getById.mockResolvedValue(mockPosition)

    await act(async () => {
      renderWithRouter(<PositionDetail />)
    })

    await waitFor(() => {
      assertTextExists('Avg Cost')
      assertTextExists('Current')
      assertTextExists('Stop')
    })
  })

  it('should display trade plan with immutability notice', async () => {
    mockPositionService.getById.mockResolvedValue(mockPosition)

    await act(async () => {
      renderWithRouter(<PositionDetail />)
    })

    await waitFor(() => {
      assertTextExists('Trade Plan')
      assertTextExists(/This trade plan is immutable/)
      assertTextExists('Target Entry Price')
      assertTextExists('Target Quantity')
      assertTextExists('Profit Target')
      assertTextExists('Stop Loss')
      assertTextExists('Position Thesis')
    })
  })

  it('should display trade history section without Add Trade button', async () => {
    mockPositionService.getById.mockResolvedValue(mockPosition)

    await act(async () => {
      renderWithRouter(<PositionDetail />)
    })

    await waitFor(() => {
      assertTextExists('Trade History')
      // Should not have Add Trade button in Trade History section (only in bottom actions)
      const tradeHistorySection = screen.getByText('Trade History').closest('section')
      if (tradeHistorySection) {
        const addTradeButtons = within(tradeHistorySection).queryAllByRole('button', { name: /Add Trade/i })
        expect(addTradeButtons).toHaveLength(0)
      }
    })
  })

  it('should display journal entries section', async () => {
    mockPositionService.getById.mockResolvedValue(mockPosition)

    await act(async () => {
      renderWithRouter(<PositionDetail />)
    })

    await waitFor(() => {
      assertTextExists('Journal Entries')
    })
  })

  it('should display bottom action buttons', async () => {
    mockPositionService.getById.mockResolvedValue(mockPosition)

    await act(async () => {
      renderWithRouter(<PositionDetail />)
    })

    await waitFor(() => {
      // Look for the bottom action bar specifically
      const bottomActions = screen.getByText('Close Position').closest('.fixed')
      if (bottomActions) {
        const addTradeButton = within(bottomActions).getByRole('button', { name: 'Add Trade' })
        const closeButton = within(bottomActions).getByRole('button', { name: 'Close Position' })

        expect(addTradeButton).toBeInTheDocument()
        expect(closeButton).toBeInTheDocument()
      }
    })
  })

  it('should navigate back when back button is clicked', async () => {
    mockPositionService.getById.mockResolvedValue(mockPosition)

    await act(async () => {
      renderWithRouter(<PositionDetail />)
    })

    await waitFor(() => {
      // Find the first button which should be the back button
      const allButtons = screen.getAllByRole('button')
      const backButton = allButtons[0] // First button is the back button
      fireEvent.click(backButton)
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  it('should handle error when loading position fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockPositionService.getById.mockRejectedValue(new Error('Database error'))

    await act(async () => {
      renderWithRouter(<PositionDetail />)
    })

    await waitFor(() => {
      expect(screen.getByText('Position not found')).toBeInTheDocument()
    })

    consoleSpy.mockRestore()
  })
})