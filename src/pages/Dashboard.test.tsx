import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { Dashboard } from './Dashboard'
import { mockPositionServiceModule, resetMockService } from '@/test/mocks/position-service-mock'
import type { Position } from '@/lib/position'

// Mock the PositionService using centralized factory
vi.mock('@/lib/position', async () => {
  const actual = await vi.importActual('@/lib/position')
  return {
    ...actual,
    PositionService: vi.fn().mockImplementation(() => mockPositionServiceModule)
  }
})

const renderWithRouter = (component: React.ReactElement) => {
  const { BrowserRouter } = require('react-router-dom')
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('Dashboard', () => {
  let mockPositionService: any
  let mockPositions: Position[]

  beforeEach(() => {
    mockPositions = [
      {
        id: '1',
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        target_entry_price: 150,
        target_quantity: 100,
        profit_target: 170,
        stop_loss: 140,
        position_thesis: 'Strong earnings expected',
        created_date: new Date('2024-01-15'),
        status: 'planned'
      },
      {
        id: '2',
        symbol: 'TSLA',
        strategy_type: 'Long Stock',
        target_entry_price: 200,
        target_quantity: 50,
        profit_target: 250,
        stop_loss: 180,
        position_thesis: 'EV adoption accelerating',
        created_date: new Date('2024-01-09'),
        status: 'planned'
      }
    ]

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
      expect(screen.getByText('AAPL')).toBeInTheDocument()
      expect(screen.getByText('TSLA')).toBeInTheDocument()
      expect(screen.getAllByText('Long Stock')).toHaveLength(2) // Both positions have this strategy
      expect(screen.getAllByText('No trades executed')).toHaveLength(2) // Both positions show this
    })
  })

  it('shows formatted currency values', async () => {
    mockPositionService.getAll.mockResolvedValue(mockPositions)

    render
    renderWithRouter(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('$140.00')).toBeInTheDocument() // Stop Loss AAPL
      expect(screen.getByText('$180.00')).toBeInTheDocument() // Stop Loss TSLA
    })
  })

  it('displays TODO placeholders for unimplemented features', async () => {
    mockPositionService.getAll.mockResolvedValue(mockPositions)

    render
    renderWithRouter(<Dashboard />)

    await waitFor(() => {
      expect(screen.getAllByText('TODO')).toHaveLength(4) // 2 positions × 2 TODO fields each
      expect(screen.getAllByText('TODO: Current P&L')).toHaveLength(2) // Both positions show this
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
      const plannedBadges = screen.getAllByText('Planned')
      expect(plannedBadges.length).toBe(2)
    })
  })

  it('shows floating action button', async () => {
    mockPositionService.getAll.mockResolvedValue(mockPositions)

    render
    renderWithRouter(<Dashboard />)

    await waitFor(() => {
      const fabButtons = screen.getAllByRole('link', { name: '' })
      const fabButton = fabButtons.find(button => button.classList.contains('fixed'))
      expect(fabButton).toBeInTheDocument()
      expect(fabButton).toHaveClass('fixed', 'bottom-24', 'right-4')
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