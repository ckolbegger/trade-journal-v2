import { render, screen, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { Home } from './Home'
import { mockPositionServiceModule, resetMockService } from '@/test/mocks/position-service-mock'
import { TEST_POSITIONS, createPosition } from '@/test/data-factories'
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

describe('Home', () => {
  let mockPositionService: any
  let mockPositions: Position[]

  beforeEach(() => {
    mockPositions = [TEST_POSITIONS.single]
    mockPositionService = mockPositionServiceModule
    resetMockService(mockPositionService)
  })

  it('shows loading state initially', () => {
    mockPositionService.getAll.mockResolvedValue(mockPositions)
    render
    renderWithRouter(<Home />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows EmptyState when no positions exist', async () => {
    mockPositionService.getAll.mockResolvedValue([])

    render
    renderWithRouter(<Home />)

    await waitFor(() => {
      expect(screen.getByText('Start Your Trading Journey')).toBeInTheDocument()
      expect(screen.getByTestId('empty-state-container')).toBeInTheDocument()
      expect(screen.getByTestId('empty-state-icon')).toBeInTheDocument()
    })
  })

  it('shows Dashboard when positions exist', async () => {
    mockPositionService.getAll.mockResolvedValue(mockPositions)

    render
    renderWithRouter(<Home />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Positions' })).toBeInTheDocument()
      expect(screen.getByText('AAPL')).toBeInTheDocument()
      expect(screen.getByText('Long Stock')).toBeInTheDocument() // At least one has this strategy
    })
  })

  it('shows EmptyState features when no positions', async () => {
    mockPositionService.getAll.mockResolvedValue([])

    render
    renderWithRouter(<Home />)

    await waitFor(() => {
      expect(screen.getByText('Immutable trade plans with forced journaling')).toBeInTheDocument()
      expect(screen.getByText('Real-time P&L tracking with FIFO cost basis')).toBeInTheDocument()
      expect(screen.getByText('Plan vs execution analysis for learning')).toBeInTheDocument()
      expect(screen.getByText('Privacy-first with local data storage')).toBeInTheDocument()

      const checkmarks = screen.getAllByTestId('feature-checkmark')
      expect(checkmarks).toHaveLength(4)
    })
  })

  it('handles error when checking for positions', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockPositionService.getAll.mockRejectedValue(new Error('Database error'))

    render
    renderWithRouter(<Home />)

    await waitFor(() => {
      expect(screen.getByText('Start Your Trading Journey')).toBeInTheDocument()
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    consoleSpy.mockRestore()
  })

  it('shows Create Position button in EmptyState', async () => {
    mockPositionService.getAll.mockResolvedValue([])

    render
    renderWithRouter(<Home />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Create Your First Position' })).toBeInTheDocument()
    })
  })

  it('shows floating action button in Dashboard when positions exist', async () => {
    mockPositionService.getAll.mockResolvedValue(mockPositions)

    render
    renderWithRouter(<Home />)

    await waitFor(() => {
      const fabButtons = screen.getAllByRole('link', { name: '' })
      const fabButton = fabButtons.find(button => button.classList.contains('fixed'))
      expect(fabButton).toBeInTheDocument()
      expect(fabButton).toHaveClass('fixed', 'bottom-24', 'right-4')
    })
  })
})