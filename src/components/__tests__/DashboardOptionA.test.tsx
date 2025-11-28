import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Dashboard } from '@/components/Dashboard'
import { PositionService } from '@/lib/position'
import { TradeService } from '@/services/TradeService'
import type { Position, Trade } from '@/lib/position'

const createTestPosition = (overrides?: Partial<Position>): Position => ({
  id: 'pos-123',
  symbol: 'AAPL',
  strategy_type: 'Long Stock',
  target_entry_price: 150,
  target_quantity: 100,
  profit_target: 165,
  stop_loss: 135,
  position_thesis: 'Test position thesis',
  created_date: new Date('2024-01-15T00:00:00.000Z'),
  status: 'planned',
  journal_entry_ids: [],
  trades: [],
  ...overrides
})

describe('Dashboard Option A: PositionService Integration', () => {
  let mockPositionService: PositionService
  let mockTradeService: TradeService

  beforeEach(() => {
    // Mock PositionService
    mockPositionService = {
      getAll: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      clearAll: vi.fn(),
      close: vi.fn()
    } as PositionService

    // Mock TradeService
    mockTradeService = {
      addTrade: vi.fn(),
      getTradesByPosition: vi.fn(),
      deleteTrade: vi.fn(),
      close: vi.fn()
    } as TradeService
  })

  describe('[Integration] Dashboard data management with PositionService', () => {
    it('[Integration] should fetch positions on mount when given PositionService', async () => {
      // Arrange - Mock positions data
      const testPositions = [
        createTestPosition({ id: 'pos-1', symbol: 'AAPL', trades: [] }),
        createTestPosition({ id: 'pos-2', symbol: 'MSFT', trades: [] })
      ]
      mockPositionService.getAll.mockResolvedValue(testPositions)

      // Act - Render Dashboard with PositionService
      render(
        <Dashboard
          positionService={mockPositionService}
          tradeService={mockTradeService}
        />
      )

      // Assert - Should call getAll and show positions
      expect(mockPositionService.getAll).toHaveBeenCalled()

      await waitFor(() => {
        expect(screen.getByTestId('position-symbol-pos-1')).toHaveTextContent('AAPL')
        expect(screen.getByTestId('position-symbol-pos-2')).toHaveTextContent('MSFT')
      })
    })

    it('[Integration] should show loading state while fetching positions', () => {
      // Arrange - Mock slow loading
      mockPositionService.getAll.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      )

      // Act
      render(
        <Dashboard
          positionService={mockPositionService}
          tradeService={mockTradeService}
        />
      )

      // Assert - Should show loading state
      expect(screen.getByText(/Loading positions/i)).toBeVisible()
    })

    it('[Integration] should show error state when PositionService fails', async () => {
      // Arrange - Mock error
      mockPositionService.getAll.mockRejectedValue(new Error('Database error'))

      // Act
      render(
        <Dashboard
          positionService={mockPositionService}
          tradeService={mockTradeService}
        />
      )

      // Assert - Should show error state
      await waitFor(() => {
        expect(screen.getByText(/Failed to load positions/i)).toBeVisible()
        expect(screen.getByText(/Database error/i)).toBeVisible()
      })
    })

    it('[Integration] should handle empty positions state', async () => {
      // Arrange - Mock empty positions
      mockPositionService.getAll.mockResolvedValue([])

      // Act
      render(
        <Dashboard
          positionService={mockPositionService}
          tradeService={mockTradeService}
        />
      )

      // Assert - Should show empty state
      await waitFor(() => {
        expect(screen.getByText(/No positions found/i)).toBeVisible()
      })
    })
  })

  describe('[Integration] Position card navigation', () => {
    it('[Integration] should make entire position card clickable', async () => {
      // Arrange
      const testPosition = createTestPosition({ id: 'trade-pos-123', symbol: 'TSLA', trades: [] })
      mockPositionService.getAll.mockResolvedValue([testPosition])

      render(
        <Dashboard
          positionService={mockPositionService}
          tradeService={mockTradeService}
        />
      )

      // Wait for positions to load
      await waitFor(() => {
        expect(screen.getByTestId('position-symbol-trade-pos-123')).toBeVisible()
      })

      // Assert - Card should be clickable
      const card = screen.getByTestId('position-card')
      expect(card).toHaveClass('cursor-pointer')
    })

    it('[Integration] should show open status for positions with trades', async () => {
      // Arrange - Position already has a trade
      const positionWithTrade = createTestPosition({
        id: 'already-traded-pos-123',
        symbol: 'CSCO',
        trades: [{
          id: 'existing-trade-123',
          position_id: 'already-traded-pos-123',
          trade_type: 'buy',
          quantity: 80,
          price: 60.25,
          timestamp: new Date('2024-01-15T10:30:00.000Z')
        }]
      })
      mockPositionService.getAll.mockResolvedValue([positionWithTrade])

      render(
        <Dashboard
          positionService={mockPositionService}
          tradeService={mockTradeService}
        />
      )

      // Assert - Should show "open" for positions with trades
      await waitFor(() => {
        expect(screen.getByText('open')).toBeVisible()
        expect(screen.getByText('1 trade')).toBeVisible()
      })
    })
  })

  describe('[Integration] Filtering functionality with live data', () => {
    it('[Integration] should update filter counts when positions change', async () => {
      // Arrange - Start with mixed positions
      const initialPositions = [
        createTestPosition({ id: 'planned-1', symbol: 'AAPL', trades: [] }),
        createTestPosition({
          id: 'open-1',
          symbol: 'MSFT',
          status: 'open', // Position with trades should have 'open' status
          trades: [{
            id: 'trade-1',
            position_id: 'open-1',
            trade_type: 'buy',
            quantity: 100,
            price: 300.25,
            timestamp: new Date('2024-01-15T10:30:00.000Z')
          }]
        })
      ]
      mockPositionService.getAll.mockResolvedValue(initialPositions)

      render(
        <Dashboard
          positionService={mockPositionService}
          tradeService={mockTradeService}
        />
      )

      // Assert initial filter counts
      await waitFor(() => {
        expect(screen.getByTestId('filter-all')).toHaveTextContent('All (2)')
        expect(screen.getByTestId('filter-planned')).toHaveTextContent('Planned (1)')
        expect(screen.getByTestId('filter-open')).toHaveTextContent('Open (1)')
      })
    })
  })

})