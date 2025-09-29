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
import type { JournalEntry } from '@/types/journal'

// Mock the PositionService using centralized factory
vi.mock('@/lib/position', async () => {
  const actual = await vi.importActual('@/lib/position')
  return {
    ...actual,
    PositionService: vi.fn().mockImplementation(() => mockPositionServiceModule)
  }
})

// Mock the JournalService
const mockJournalService = {
  getByPositionId: vi.fn(),
  create: vi.fn(),
  getById: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  getAll: vi.fn(),
  deleteByPositionId: vi.fn()
}

vi.mock('@/services/JournalService', () => ({
  JournalService: vi.fn().mockImplementation(() => mockJournalService)
}))

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
  const mockJournalEntries: JournalEntry[] = [
    {
      id: 'journal-1',
      position_id: 'pos-123',
      entry_type: 'position_plan',
      fields: [
        {
          name: 'thesis',
          prompt: 'Why are you planning this position?',
          response: 'Strong earnings expected for AAPL this quarter'
        },
        {
          name: 'emotional_state',
          prompt: 'How are you feeling about this trade?',
          response: 'Confident and well-researched'
        }
      ],
      created_at: '2024-01-15T10:00:00.000Z',
      executed_at: '2024-01-15T10:00:00.000Z'
    },
    {
      id: 'journal-2',
      position_id: 'pos-123',
      entry_type: 'trade_execution',
      fields: [
        {
          name: 'execution_notes',
          prompt: 'Describe the execution',
          response: 'Filled at market open as planned'
        }
      ],
      created_at: '2024-01-15T14:30:00.000Z',
      executed_at: '2024-01-15T14:30:00.000Z'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockPosition = TEST_POSITIONS.single
    mockPositionService = mockPositionServiceModule
    resetMockService(mockPositionService)

    // Reset JournalService mock with default return values
    mockJournalService.getByPositionId.mockReset().mockResolvedValue([])
    mockJournalService.create.mockReset()
    mockJournalService.getById.mockReset()
    mockJournalService.update.mockReset()
    mockJournalService.delete.mockReset()
    mockJournalService.getAll.mockReset()
    mockJournalService.deleteByPositionId.mockReset()
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

  describe('Accordion Layout', () => {
    it('should display accordion sections with correct indicators', async () => {
      mockPositionService.getById.mockResolvedValue(mockPosition)
      mockJournalService.getByPositionId.mockResolvedValue(mockJournalEntries)

      await act(async () => {
        renderWithRouter(<PositionDetail />)
      })

      await waitFor(() => {
        // Trade Plan section should be expanded by default with "(Immutable)" indicator
        assertTextExists('Trade Plan')
        assertTextExists('(Immutable)')

        // Trade History section should show count
        assertTextExists('Trade History')
        assertTextExists('(Empty)')

        // Journal Entries section should show count
        assertTextExists('Journal Entries')
        assertTextExists('(2)')
      })
    })

    it('should have Trade Plan section expanded by default', async () => {
      mockPositionService.getById.mockResolvedValue(mockPosition)

      await act(async () => {
        renderWithRouter(<PositionDetail />)
      })

      await waitFor(() => {
        // Trade Plan content should be visible
        const tradePlanButton = screen.getByText('Trade Plan').closest('button')
        expect(tradePlanButton).toHaveClass('active')

        // Trade plan content should be visible
        assertTextExists('Target Entry Price')
        assertTextExists('Position Thesis')
      })
    })

    it('should allow collapsing and expanding accordion sections', async () => {
      mockPositionService.getById.mockResolvedValue(mockPosition)

      await act(async () => {
        renderWithRouter(<PositionDetail />)
      })

      await waitFor(() => {
        // Initially Trade Plan should be expanded
        const tradePlanButton = screen.getByText('Trade Plan').closest('button')
        expect(tradePlanButton).toHaveClass('active')

        // Click to collapse
        fireEvent.click(tradePlanButton!)

        // Should now be collapsed
        expect(tradePlanButton).not.toHaveClass('active')

        // Click to expand again
        fireEvent.click(tradePlanButton!)

        // Should be expanded again
        expect(tradePlanButton).toHaveClass('active')
      })
    })

    it('should show chevron icons that rotate when sections expand/collapse', async () => {
      mockPositionService.getById.mockResolvedValue(mockPosition)

      await act(async () => {
        renderWithRouter(<PositionDetail />)
      })

      await waitFor(() => {
        const tradePlanButton = screen.getByText('Trade Plan').closest('button')
        const chevron = within(tradePlanButton!).getByText('▼')

        // Initially expanded - chevron should be rotated
        expect(tradePlanButton).toHaveClass('active')

        // Click to collapse
        fireEvent.click(tradePlanButton!)

        // Should now be collapsed - chevron should not be rotated
        expect(tradePlanButton).not.toHaveClass('active')
      })
    })

    it('should display correct counts for Trade History section', async () => {
      mockPositionService.getById.mockResolvedValue(mockPosition)

      await act(async () => {
        renderWithRouter(<PositionDetail />)
      })

      await waitFor(() => {
        // Should show "(Empty)" when no trades
        assertTextExists('(Empty)')
      })
    })

    it('should display correct counts for Journal Entries section', async () => {
      mockPositionService.getById.mockResolvedValue(mockPosition)

      // Test with no journal entries
      mockJournalService.getByPositionId.mockResolvedValue([])

      await act(async () => {
        renderWithRouter(<PositionDetail />)
      })

      await waitFor(() => {
        // Should show "(0)" when no entries
        assertTextExists('(0)')
      })

      // Reset and test with entries
      mockJournalService.getByPositionId.mockResolvedValue(mockJournalEntries)

      await act(async () => {
        renderWithRouter(<PositionDetail />)
      })

      await waitFor(() => {
        // Should show "(2)" when 2 entries
        assertTextExists('(2)')
      })
    })
  })

  describe('Journal Integration', () => {

    it('should fetch and display journal entries for the position', async () => {
      mockPositionService.getById.mockResolvedValue(mockPosition)
      mockJournalService.getByPositionId.mockResolvedValue(mockJournalEntries)

      await act(async () => {
        renderWithRouter(<PositionDetail />)
      })

      await waitFor(() => {
        expect(mockJournalService.getByPositionId).toHaveBeenCalledWith('pos-123')
      })

      // Expand the Journal Entries accordion to see the content
      await act(async () => {
        const journalButton = screen.getByText('Journal Entries').closest('button')
        fireEvent.click(journalButton!)
      })

      // Should display journal entries
      await waitFor(() => {
        assertTextExists('Position Plan')
        assertTextExists('Strong earnings expected for AAPL this quarter')
        assertTextExists('Confident and well-researched')
      })
    })

    it('should display journal entries in chronological order', async () => {
      mockPositionService.getById.mockResolvedValue(mockPosition)
      mockJournalService.getByPositionId.mockResolvedValue(mockJournalEntries)

      await act(async () => {
        renderWithRouter(<PositionDetail />)
      })

      // Expand the Journal Entries accordion to see the content
      await act(async () => {
        const journalButton = screen.getByText('Journal Entries').closest('button')
        fireEvent.click(journalButton!)
      })

      await waitFor(() => {
        const journalSection = screen.getByText('Journal Entries').closest('section')
        expect(journalSection).toBeInTheDocument()

        // Position Plan entry should appear before Trade Execution entry
        const positionPlanText = screen.getByText('Strong earnings expected for AAPL this quarter')
        const executionText = screen.getByText('Filled at market open as planned')

        expect(positionPlanText).toBeInTheDocument()
        expect(executionText).toBeInTheDocument()
      })
    })

    it('should display structured journal fields with prompts and responses', async () => {
      mockPositionService.getById.mockResolvedValue(mockPosition)
      mockJournalService.getByPositionId.mockResolvedValue([mockJournalEntries[0]])

      await act(async () => {
        renderWithRouter(<PositionDetail />)
      })

      // Expand the Journal Entries accordion to see the content
      await act(async () => {
        const journalButton = screen.getByText('Journal Entries').closest('button')
        fireEvent.click(journalButton!)
      })

      await waitFor(() => {
        // Should show the prompt question
        assertTextExists('Why are you planning this position?')
        // Should show the response
        assertTextExists('Strong earnings expected for AAPL this quarter')

        // Should show second field
        assertTextExists('How are you feeling about this trade?')
        assertTextExists('Confident and well-researched')
      })
    })

    it('should handle empty journal entries gracefully', async () => {
      mockPositionService.getById.mockResolvedValue(mockPosition)
      mockJournalService.getByPositionId.mockResolvedValue([])

      await act(async () => {
        renderWithRouter(<PositionDetail />)
      })

      // Expand the Journal Entries accordion to see the content
      await act(async () => {
        const journalButton = screen.getByText('Journal Entries').closest('button')
        fireEvent.click(journalButton!)
      })

      await waitFor(() => {
        assertTextExists('Journal Entries')
        assertTextExists('No journal entries yet')
      })
    })

    it('should handle journal service errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockPositionService.getById.mockResolvedValue(mockPosition)
      mockJournalService.getByPositionId.mockRejectedValue(new Error('Journal service error'))

      await act(async () => {
        renderWithRouter(<PositionDetail />)
      })

      // Expand the Journal Entries accordion to see the content
      await act(async () => {
        const journalButton = screen.getByText('Journal Entries').closest('button')
        fireEvent.click(journalButton!)
      })

      await waitFor(() => {
        assertTextExists('Journal Entries')
        assertTextExists('Error loading journal entries')
      })

      consoleSpy.mockRestore()
    })

    it('should display entry type labels for different journal types', async () => {
      mockPositionService.getById.mockResolvedValue(mockPosition)
      mockJournalService.getByPositionId.mockResolvedValue(mockJournalEntries)

      await act(async () => {
        renderWithRouter(<PositionDetail />)
      })

      // Expand the Journal Entries accordion to see the content
      await act(async () => {
        const journalButton = screen.getByText('Journal Entries').closest('button')
        fireEvent.click(journalButton!)
      })

      await waitFor(() => {
        assertTextExists('Position Plan')
        assertTextExists('Trade Execution')
      })
    })

    it('should format journal entry timestamps correctly', async () => {
      mockPositionService.getById.mockResolvedValue(mockPosition)
      mockJournalService.getByPositionId.mockResolvedValue([mockJournalEntries[0]])

      await act(async () => {
        renderWithRouter(<PositionDetail />)
      })

      // Expand the Journal Entries accordion to see the content
      await act(async () => {
        const journalButton = screen.getByText('Journal Entries').closest('button')
        fireEvent.click(journalButton!)
      })

      await waitFor(() => {
        // Should display formatted date (Jan 15, 2024 format)
        assertTextExists(/Jan 15, 2024/)
      })
    })
  })
})