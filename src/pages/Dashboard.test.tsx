import { render, screen, waitFor } from '@testing-library/react'
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

  it('shows loading state initially', () => {
    mockPositionService.getAll.mockResolvedValue(mockPositions)
    render
    renderWithRouter(<Dashboard />)

    expect(screen.getByText('Loading positions...')).toBeInTheDocument()
  })

  it('shows empty state when no positions exist', async () => {
    mockPositionService.getAll.mockResolvedValue([])

    render
    renderWithRouter(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('No positions yet')).toBeInTheDocument()
      expect(screen.getByText('Create your first position plan to get started')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Create Position' })).toBeInTheDocument()
    })
  })

  it('displays positions when they exist', async () => {
    mockPositionService.getAll.mockResolvedValue(mockPositions)

    render
    renderWithRouter(<Dashboard />)

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

    render
    renderWithRouter(<Dashboard />)

    await waitFor(() => {
      assertPositionDetails('AAPL', { stopLoss: '140.00' })
      assertPositionDetails('TSLA', { stopLoss: '180.00' })
    })
  })

  it('displays TODO placeholders for unimplemented features', async () => {
    mockPositionService.getAll.mockResolvedValue(mockPositions)

    render
    renderWithRouter(<Dashboard />)

    await waitFor(() => {
      assertTextExists('TODO', { count: 4 })
      assertTextExists('TODO: Current P&L', { count: 2 })
    })
  })

  it('shows formatted dates', async () => {
    mockPositionService.getAll.mockResolvedValue(mockPositions)

    render
    renderWithRouter(<Dashboard />)

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

    render
    renderWithRouter(<Dashboard />)

    await waitFor(() => {
      assertTextExists('Planned', { count: 2 })
    })
  })

  it('shows floating action button', async () => {
    mockPositionService.getAll.mockResolvedValue(mockPositions)

    render
    renderWithRouter(<Dashboard />)

    await waitFor(() => {
      assertFabButtonVisible()
    })
  })

  it('handles error when loading positions', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockPositionService.getAll.mockRejectedValue(new Error('Database error'))

    render
    renderWithRouter(<Dashboard />)

    await waitFor(() => {
      expect(screen.queryByText('Loading positions...')).not.toBeInTheDocument()
      expect(screen.getByText('No positions yet')).toBeInTheDocument()
    })

    consoleSpy.mockRestore()
  })
})