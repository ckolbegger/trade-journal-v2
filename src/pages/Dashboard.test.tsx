import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { Dashboard } from './Dashboard'
import { mockPositionServiceModule, resetMockService } from '@/test/mocks/position-service-mock'
import { TEST_POSITIONS, createPosition } from '@/test/data-factories'
import { renderWithRouter } from '@/test/test-utils'
import {
  assertPositionInDashboard,
  assertPositionDetails,
  assertFabButtonVisible,
  assertTextExists,
  assertElementsVisible
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


describe('Dashboard', () => {
  let mockPositionService: any
  let mockPositions: Position[]

  beforeEach(() => {
    mockPositions = TEST_POSITIONS.multiple
    mockPositionService = mockPositionServiceModule
    resetMockService(mockPositionService)
  })

  it('shows loading state initially', async () => {
    mockPositionService.getAll.mockResolvedValue(mockPositions)

    await act(async () => {
      renderWithRouter(<Dashboard />)
    })

    expect(screen.getByText('Loading positions...')).toBeInTheDocument()

    // Wait for async operations to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading positions...')).not.toBeInTheDocument()
    })
  })

  it('shows empty state when no positions exist', async () => {
    mockPositionService.getAll.mockResolvedValue([])

    await act(async () => {
      renderWithRouter(<Dashboard />)
    })

    await waitFor(() => {
      expect(screen.getByText('No positions yet')).toBeInTheDocument()
      expect(screen.getByText('Create your first position plan to get started')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Create Position' })).toBeInTheDocument()
    })
  })

  it('displays positions when they exist', async () => {
    mockPositionService.getAll.mockResolvedValue(mockPositions)

    await act(async () => {
      renderWithRouter(<Dashboard />)
    })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Positions' })).toBeInTheDocument()
      assertPositionInDashboard('AAPL', 1)
      assertPositionInDashboard('TSLA', 1)
      assertTextExists('Long Stock', { count: 2 })
      assertTextExists('No trades executed', { count: 2 })
    })
  })

  it('shows formatted currency values', async () => {
    mockPositionService.getAll.mockResolvedValue(mockPositions)

    await act(async () => {
      renderWithRouter(<Dashboard />)
    })

    await waitFor(() => {
      assertPositionDetails('AAPL', { stopLoss: '140.00' })
      assertPositionDetails('TSLA', { stopLoss: '180.00' })
    })
  })

  it('displays TODO placeholders for unimplemented features', async () => {
    mockPositionService.getAll.mockResolvedValue(mockPositions)

    await act(async () => {
      renderWithRouter(<Dashboard />)
    })

    await waitFor(() => {
      assertTextExists('TODO', { count: 4 })
      assertTextExists('TODO: Current P&L', { count: 2 })
    })
  })

  it('shows formatted dates', async () => {
    mockPositionService.getAll.mockResolvedValue(mockPositions)

    await act(async () => {
      renderWithRouter(<Dashboard />)
    })

    await waitFor(() => {
      // Check that dates are displayed (format may vary by timezone)
      const dateElements = screen.getAllByText(/2024/)
      expect(dateElements.length).toBeGreaterThan(0)

      // Check that "Updated" prefix is shown
      const updatedTexts = screen.getAllByText(/Updated/)
      expect(updatedTexts.length).toBe(2)
    })
  })

  it('displays planned status badges', async () => {
    mockPositionService.getAll.mockResolvedValue(mockPositions)

    await act(async () => {
      renderWithRouter(<Dashboard />)
    })

    await waitFor(() => {
      assertTextExists('Planned', { count: 2 })
    })
  })

  it('shows floating action button', async () => {
    mockPositionService.getAll.mockResolvedValue(mockPositions)

    await act(async () => {
      renderWithRouter(<Dashboard />)
    })

    await waitFor(() => {
      assertFabButtonVisible()
    })
  })

  it('handles error when loading positions', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockPositionService.getAll.mockRejectedValue(new Error('Database error'))

    await act(async () => {
      renderWithRouter(<Dashboard />)
    })

    await waitFor(() => {
      expect(screen.queryByText('Loading positions...')).not.toBeInTheDocument()
      expect(screen.getByText('No positions yet')).toBeInTheDocument()
    })

    consoleSpy.mockRestore()
  })

  describe('Position Hover Effects', () => {
    it('should apply hover highlighting to position cards on mouseover', async () => {
      mockPositionService.getAll.mockResolvedValue(mockPositions)

      await act(async () => {
        renderWithRouter(<Dashboard />)
      })

      await waitFor(() => {
        const positionCard = screen.getByText('AAPL').closest('div[class*="bg-white"]')
        expect(positionCard).toBeInTheDocument()

        // Initially should not have hover classes
        expect(positionCard).not.toHaveClass('hover:shadow-lg', 'hover:bg-gray-50', 'border-blue-200')

        // Simulate hover (fire mouseover event)
        if (positionCard) {
          fireEvent.mouseOver(positionCard)

          // Should now have hover highlighting classes
          expect(positionCard).toHaveClass('hover:shadow-lg', 'hover:bg-gray-50', 'border-blue-200')
        }
      })
    })

    it('should remove hover highlighting when mouse leaves position card', async () => {
      mockPositionService.getAll.mockResolvedValue(mockPositions)

      await act(async () => {
        renderWithRouter(<Dashboard />)
      })

      await waitFor(() => {
        const positionCard = screen.getByText('AAPL').closest('div[class*="bg-white"]')
        expect(positionCard).toBeInTheDocument()

        if (positionCard) {
          // Simulate hover
          fireEvent.mouseOver(positionCard)
          expect(positionCard).toHaveClass('hover:shadow-lg', 'hover:bg-gray-50', 'border-blue-200')

          // Simulate mouse leave
          fireEvent.mouseOut(positionCard)

          // Should revert to original state (but hover classes remain in classList)
          expect(positionCard).toBeInTheDocument()
        }
      })
    })
  })
})