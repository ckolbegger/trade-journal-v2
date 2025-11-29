import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Dashboard } from '@/components/Dashboard'
import { ServiceProvider } from '@/contexts/ServiceContext'
import { ServiceContainer } from '@/services/ServiceContainer'
import { PositionService } from '@/lib/position'
import type { Position } from '@/lib/position'
import 'fake-indexeddb/auto'

const createTestPosition = (overrides?: Partial<Position>): Position => ({
  id: 'pos-123',
  symbol: 'AAPL',
  strategy_type: 'long_stock',
  target_entry_price: 150,
  target_quantity: 100,
  target_entry_date: '2024-01-15',
  profit_target: 165,
  stop_loss: 135,
  position_thesis: 'Test position thesis',
  created_date: '2024-01-15',
  status: 'planned',
  journal_entry_ids: [],
  trades: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
})

describe('Dashboard Option A: PositionService Integration', () => {
  let container: ServiceContainer
  let positionService: PositionService

  beforeEach(async () => {
    // Delete database for clean state
    const deleteRequest = indexedDB.deleteDatabase('TradingJournalDB')
    await new Promise<void>((resolve) => {
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => resolve()
      deleteRequest.onblocked = () => resolve()
    })

    // Reset ServiceContainer
    ServiceContainer.resetInstance()

    // Initialize ServiceContainer with database
    container = ServiceContainer.getInstance()
    await container.initialize()

    // Get and clear PositionService
    positionService = container.getPositionService()
    await positionService.clearAll()
  })

  afterEach(async () => {
    ServiceContainer.resetInstance()

    // Clean up database
    const deleteRequest = indexedDB.deleteDatabase('TradingJournalDB')
    await new Promise<void>((resolve) => {
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => resolve()
      deleteRequest.onblocked = () => resolve()
    })
  })

  describe('[Integration] Dashboard data management with PositionService', () => {
    it('[Integration] should fetch positions on mount when given PositionService', async () => {
      // Arrange - Create test positions
      const testPosition1 = createTestPosition({ id: 'pos-1', symbol: 'AAPL', underlying: 'AAPL' })
      const testPosition2 = createTestPosition({ id: 'pos-2', symbol: 'MSFT', underlying: 'MSFT' })

      await positionService.create(testPosition1)
      await positionService.create(testPosition2)

      // Act - Render Dashboard with ServiceProvider
      render(
        <ServiceProvider>
          <Dashboard />
        </ServiceProvider>
      )

      // Assert - Should show positions
      await waitFor(() => {
        expect(screen.getByTestId('position-symbol-pos-1')).toHaveTextContent('AAPL')
        expect(screen.getByTestId('position-symbol-pos-2')).toHaveTextContent('MSFT')
      })
    })

    it('[Integration] should show loading state while fetching positions', () => {
      // Act
      render(
        <ServiceProvider>
          <Dashboard />
        </ServiceProvider>
      )

      // Assert - Should show loading state initially
      expect(screen.getByText(/Loading positions/i)).toBeVisible()
    })

    it('[Integration] should show error state when PositionService fails', async () => {
      // Arrange - Create a spy to mock a failure
      const getAllSpy = vi.spyOn(positionService, 'getAll').mockRejectedValue(new Error('Database error'))

      // Act
      render(
        <ServiceProvider>
          <Dashboard />
        </ServiceProvider>
      )

      // Assert - Should show error state
      await waitFor(() => {
        expect(screen.getByText(/Failed to load positions/i)).toBeVisible()
        expect(screen.getByText(/Database error/i)).toBeVisible()
      })

      getAllSpy.mockRestore()
    })

    it('[Integration] should handle empty positions state', async () => {
      // Arrange - No positions created (already cleared in beforeEach)

      // Act
      render(
        <ServiceProvider>
          <Dashboard />
        </ServiceProvider>
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
      const testPosition = createTestPosition({ id: 'trade-pos-123', symbol: 'TSLA', underlying: 'TSLA' })
      await positionService.create(testPosition)

      render(
        <ServiceProvider>
          <Dashboard />
        </ServiceProvider>
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
      // Arrange - Position with a trade
      const positionWithTrade = createTestPosition({
        id: 'already-traded-pos-123',
        symbol: 'CSCO',
        underlying: 'CSCO',
        status: 'open',
        trades: [{
          id: 'existing-trade-123',
          position_id: 'already-traded-pos-123',
          underlying: 'CSCO',
          trade_type: 'buy',
          quantity: 80,
          price: 60.25,
          timestamp: new Date('2024-01-15T10:30:00.000Z').toISOString()
        }]
      })
      await positionService.create(positionWithTrade)

      render(
        <ServiceProvider>
          <Dashboard />
        </ServiceProvider>
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
      // Arrange - Create mixed positions
      const plannedPosition = createTestPosition({
        id: 'planned-1',
        symbol: 'AAPL',
        underlying: 'AAPL',
        status: 'planned'
      })

      const openPosition = createTestPosition({
        id: 'open-1',
        symbol: 'MSFT',
        underlying: 'MSFT',
        status: 'open',
        trades: [{
          id: 'trade-1',
          position_id: 'open-1',
          underlying: 'MSFT',
          trade_type: 'buy',
          quantity: 100,
          price: 300.25,
          timestamp: new Date('2024-01-15T10:30:00.000Z').toISOString()
        }]
      })

      await positionService.create(plannedPosition)
      await positionService.create(openPosition)

      render(
        <ServiceProvider>
          <Dashboard />
        </ServiceProvider>
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
