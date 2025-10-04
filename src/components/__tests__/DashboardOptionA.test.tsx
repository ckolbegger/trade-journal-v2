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

  describe('[Integration] Trade execution integration', () => {
    it('[Integration] should show trade execution modal when Add Trade is clicked', async () => {
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

      // Act - Click Add Trade button
      const tradeButton = screen.getByTestId('trade-execution-button')
      fireEvent.click(tradeButton)

      // Assert - Should show trade execution modal
      expect(screen.getByTestId('trade-execution-modal')).toBeVisible()
      expect(screen.getByText(/Execute Trade for TSLA/i)).toBeVisible()
    })

    it('[Integration] should close modal and refresh positions after trade execution', async () => {
      // Arrange
      const testPosition = createTestPosition({ id: 'refresh-pos-123', symbol: 'NVDA', trades: [] })
      const updatedPosition = createTestPosition({
        id: 'refresh-pos-123',
        symbol: 'NVDA',
        trades: [{
          id: 'trade-123',
          position_id: 'refresh-pos-123',
          trade_type: 'buy',
          quantity: 50,
          price: 450.25,
          timestamp: new Date('2024-01-15T10:30:00.000Z')
        }]
      })

      // Mock initial positions, then updated positions after trade
      mockPositionService.getAll
        .mockResolvedValueOnce([testPosition])
        .mockResolvedValueOnce([updatedPosition])

      mockTradeService.addTrade.mockResolvedValue({
        id: 'trade-123',
        position_id: 'refresh-pos-123',
        trade_type: 'buy',
        quantity: 50,
        price: 450.25,
        timestamp: new Date('2024-01-15T10:30:00.000Z')
      })

      render(
        <Dashboard
          positionService={mockPositionService}
          tradeService={mockTradeService}
        />
      )

      // Wait for initial load and open modal
      await waitFor(() => {
        expect(screen.getByTestId('position-symbol-refresh-pos-123')).toBeVisible()
      })

      fireEvent.click(screen.getByTestId('trade-execution-button'))

      // Act - Fill form and execute trade
      fireEvent.change(screen.getByLabelText(/Trade Type/), { target: { value: 'buy' } })
      fireEvent.change(screen.getByLabelText(/Quantity/), { target: { value: '50' } })
      fireEvent.change(screen.getByLabelText(/Price/), { target: { value: '450.25' } })
      fireEvent.change(screen.getByLabelText(/Trade Date/), { target: { value: '2024-01-15T10:30' } })

      const executeButton = screen.getByRole('button', { name: /Execute Trade/i })
      fireEvent.click(executeButton)

      // Assert - Modal should close and positions should refresh
      await waitFor(() => {
        expect(screen.queryByTestId('trade-execution-modal')).not.toBeInTheDocument()
      })

      // Should have called getAll again to refresh
      expect(mockPositionService.getAll).toHaveBeenCalledTimes(2)

      // Should show updated position with trade
      expect(screen.getByTestId('position-status-badge')).toHaveTextContent('open')
    })

    it('[Integration] should not show trade button for positions with existing trades', async () => {
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

      // Assert - Should show "Position Executed" instead of "Add Trade"
      await waitFor(() => {
        expect(screen.getByTestId('position-executed-indicator')).toBeVisible()
        expect(screen.queryByTestId('trade-execution-button')).not.toBeInTheDocument()
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

  describe('[Integration] Error handling for trade operations', () => {
    it('[Integration] should handle trade execution errors gracefully', async () => {
      // Arrange
      const testPosition = createTestPosition({ id: 'error-pos-123', symbol: 'INTC', trades: [] })
      mockPositionService.getAll.mockResolvedValue([testPosition])
      mockTradeService.addTrade.mockRejectedValue(new Error('Trade execution failed'))

      render(
        <Dashboard
          positionService={mockPositionService}
          tradeService={mockTradeService}
        />
      )

      // Open modal
      await waitFor(() => {
        expect(screen.getByTestId('position-symbol-error-pos-123')).toBeVisible()
      })
      fireEvent.click(screen.getByTestId('trade-execution-button'))

      // Act - Fill form and try to execute trade
      fireEvent.change(screen.getByLabelText(/Trade Type/), { target: { value: 'buy' } })
      fireEvent.change(screen.getByLabelText(/Quantity/), { target: { value: '100' } })
      fireEvent.change(screen.getByLabelText(/Price/), { target: { value: '50.25' } })
      fireEvent.change(screen.getByLabelText(/Trade Date/), { target: { value: '2024-01-15T10:30' } })

      const executeButton = screen.getByRole('button', { name: /Execute Trade/i })
      fireEvent.click(executeButton)

      // Assert - Should show error message
      await waitFor(() => {
        expect(screen.getByText(/Trade execution failed/i)).toBeVisible()
        expect(screen.getByTestId('trade-execution-modal')).toBeVisible() // Modal stays open
      })
    })
  })
})