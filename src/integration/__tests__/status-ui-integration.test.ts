import 'fake-indexeddb/auto'
import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { ServiceProvider } from '@/contexts/ServiceContext'
import { ServiceContainer } from '@/services/ServiceContainer'
import { PositionService } from '@/lib/position'
import { TradeService } from '@/services/TradeService'
import { PositionCard } from '@/components/PositionCard'
import { Dashboard } from '@/components/Dashboard'
import type { Position, Trade } from '@/lib/position'
import { CostBasisCalculator } from '@/domain/calculators/CostBasisCalculator'

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

const createTestTrade = (overrides?: Partial<Trade>): Trade => ({
  id: 'trade-123',
  position_id: 'pos-123',
  trade_type: 'buy',
  quantity: 100,
  price: 150.25,
  timestamp: new Date('2024-01-15T10:30:00.000Z'),
  notes: 'Test trade execution',
  ...overrides
})

// Helper to calculate metrics for PositionCard
const calculateMetrics = (position: Position) => {
  const avgCost = CostBasisCalculator.calculateAverageCost(position.trades, position.target_entry_price)
  // Integration tests don't have price data, so pnl is always null
  const pnl = null
  const pnlPercentage = undefined
  return { avgCost, pnl, pnlPercentage }
}

describe('Batch 1: Status UI Integration - Full Stack Tests', () => {
  let positionService: PositionService
  let tradeService: TradeService

  // Helper function to render Dashboard and wait for it to load
  const renderDashboardAndWait = async (filter?: 'all' | 'planned' | 'open' | 'closed') => {
    await act(async () => {
      render(
        React.createElement(ServiceProvider, {},
          React.createElement(Dashboard, { filter })
        )
      )
    })
    await waitFor(() => {
      expect(screen.queryByText('Loading positions...')).not.toBeInTheDocument()
    })
  }

  beforeEach(async () => {
    const container = ServiceContainer.getInstance()
    positionService = container.getPositionService()
    tradeService = container.getTradeService()
    await positionService.clearAll()
  })

  afterEach(async () => {
    try {
      // Clear all data from services
      await positionService.clearAll()
      if (tradeService && typeof tradeService.clearAll === 'function') {
        await tradeService.clearAll()
      }
    } catch (error) {
      // Ignore errors during cleanup
    }

    // Close connections
    if (positionService && typeof positionService.close === 'function') {
      positionService.close()
    }
    if (tradeService && typeof tradeService.close === 'function') {
      tradeService.close()
    }
  }, 10000)

  describe('[Integration] Status badge display across components', () => {
    it('[Integration] should show correct status in PositionCard header', async () => {
      const plannedPosition = createTestPosition({
        id: 'card-header-pos-123',
        symbol: 'MSFT',
        status: 'planned',
        trades: []
      })
      await positionService.create(plannedPosition)
      const retrievedPosition = await positionService.getById('card-header-pos-123')

      const mockOnViewDetails = vi.fn()
      const metrics = calculateMetrics(retrievedPosition!)
      render(
        React.createElement(PositionCard, {
          position: retrievedPosition!,
          onViewDetails: mockOnViewDetails,
          ...metrics
        })
      )

      const statusBadge = screen.getByTestId('position-status-badge')
      expect(statusBadge).toBeVisible()
      expect(statusBadge).toHaveTextContent('planned')
      expect(statusBadge).toHaveClass('bg-gray-100', 'text-gray-800')
    })

    it('[Integration] should make entire card clickable to view details', async () => {
      const plannedPosition = createTestPosition({
        id: 'button-pos-123',
        symbol: 'TSLA',
        status: 'planned',
        trades: []
      })
      await positionService.create(plannedPosition)
      const retrievedPosition = await positionService.getById('button-pos-123')

      const mockOnViewDetails = vi.fn()
      const metrics = calculateMetrics(retrievedPosition!)
      render(
        React.createElement(PositionCard, {
          position: retrievedPosition!,
          onViewDetails: mockOnViewDetails,
          ...metrics
        })
      )

      const card = screen.getByTestId('position-card')
      expect(card).toBeVisible()
      expect(card).toHaveClass('cursor-pointer')

      fireEvent.click(card)
      expect(mockOnViewDetails).toHaveBeenCalledWith('button-pos-123')
    })

    it('[Integration] should show open status for positions with trades', async () => {
      const openPosition = createTestPosition({
        id: 'open-button-pos-123',
        symbol: 'NVDA',
        status: 'open',
        trades: [{
          id: 'trade-123',
          position_id: 'open-button-pos-123',
          trade_type: 'buy',
          quantity: 50,
          price: 450.25,
          timestamp: new Date('2024-01-15T10:30:00.000Z')
        }]
      })
      await positionService.create(openPosition)
      const retrievedPosition = await positionService.getById('open-button-pos-123')

      const metrics = calculateMetrics(retrievedPosition!)
      render(
        React.createElement(PositionCard, {
          position: retrievedPosition!,
          onViewDetails: vi.fn(),
          ...metrics
        })
      )

      // Should show "open" text instead of "planned"
      expect(screen.getByText('open')).toBeVisible()

      // Should show trade count
      expect(screen.getByText('1 trade')).toBeVisible()
    })

    it('[Integration] should update status across all views after trade execution', async () => {
      const position = createTestPosition({
        id: 'multi-view-pos-123',
        symbol: 'AMZN',
        status: 'planned',
        trades: []
      })
      await positionService.create(position)

      const trade = createTestTrade({
        position_id: 'multi-view-pos-123',
        quantity: 30,
        price: 3200.25
      })
      await tradeService.addTrade(trade)

      const updatedPosition = await positionService.getById('multi-view-pos-123')

      expect(updatedPosition).toBeTruthy()
      expect(updatedPosition!.status).toBe('open')

      const metrics = calculateMetrics(updatedPosition!)
      const { unmount } = render(
        React.createElement(PositionCard, {
          position: updatedPosition!,
          onViewDetails: vi.fn(),
          ...metrics
        })
      )

      const cardStatusBadge = screen.getByTestId('position-status-badge')
      expect(cardStatusBadge).toHaveTextContent('open')
      expect(cardStatusBadge).toHaveClass('bg-green-100', 'text-green-800')

      unmount()
      const allPositions = await positionService.getAll()
      await renderDashboardAndWait()

      const dashboardStatusBadges = screen.getAllByTestId('position-status-badge')
      const ourBadge = dashboardStatusBadges.find(badge =>
        badge.closest('[data-position-id="multi-view-pos-123"]')
      )
      expect(ourBadge).toHaveTextContent('open')
    })

    it('[Integration] should persist status across refresh', async () => {
      const position = createTestPosition({
        id: 'persist-pos-123',
        symbol: 'META',
        status: 'planned',
        trades: []
      })
      await positionService.create(position)

      const trade = createTestTrade({
        position_id: 'persist-pos-123',
        quantity: 40,
        price: 300.50
      })
      await tradeService.addTrade(trade)

      // Re-fetch from the same service to verify persistence
      const refreshedPosition = await positionService.getById('persist-pos-123')

      expect(refreshedPosition).toBeTruthy()
      expect(refreshedPosition!.status).toBe('open')
      expect(refreshedPosition!.trades).toHaveLength(1)

      const metrics = calculateMetrics(refreshedPosition!)
      render(
        React.createElement(PositionCard, {
          position: refreshedPosition!,
          onViewDetails: vi.fn(),
          ...metrics
        })
      )

      const statusBadge = screen.getByTestId('position-status-badge')
      expect(statusBadge).toHaveTextContent('open')
      expect(statusBadge).toHaveClass('bg-green-100', 'text-green-800')
    })

    it('[Integration] should handle status computation for edge cases', async () => {
      const edgeCasePosition = createTestPosition({
        id: 'edge-case-pos-123',
        symbol: 'GOOGL',
        status: 'planned',
        trades: []
      })
      await positionService.create(edgeCasePosition)

      const retrievedPosition = await positionService.getById('edge-case-pos-123')

      expect(retrievedPosition!.status).toBe('planned')

      const metrics = calculateMetrics(retrievedPosition!)
      render(
        React.createElement(PositionCard, {
          position: retrievedPosition!,
          onViewDetails: vi.fn(),
          ...metrics
        })
      )

      // Find the status badge within the specific position card
      const positionCard = screen.getByTestId('position-card')
      const statusBadge = positionCard.querySelector('[data-testid="position-status-badge"]')
      expect(statusBadge).toHaveTextContent('planned')
    })
  })

  describe('[Integration] Status-based filtering functionality', () => {
    it('[Integration] should filter by planned status', async () => {
      const plannedPositions = [
        createTestPosition({ id: 'planned-1', symbol: 'AAPL', status: 'planned', trades: [] }),
        createTestPosition({ id: 'planned-2', symbol: 'MSFT', status: 'planned', trades: [] })
      ]

      const openPositions = [
        createTestPosition({
          id: 'open-1',
          symbol: 'TSLA',
          status: 'open',
          trades: [{
            id: 'trade-1',
            position_id: 'open-1',
            trade_type: 'buy',
            quantity: 50,
            price: 200.50,
            timestamp: new Date('2024-01-15T10:30:00.000Z')
          }]
        })
      ]

      for (const position of [...plannedPositions, ...openPositions]) {
        await positionService.create(position)
      }

      const allPositions = await positionService.getAll()

      await renderDashboardAndWait("planned")

      const positionCards = screen.getAllByTestId(/position-card/)
      expect(positionCards).toHaveLength(2)

      const visibleSymbols = positionCards.map(card =>
        screen.getByTestId(`position-symbol-${card.getAttribute('data-position-id')}`).textContent
      )
      expect(visibleSymbols).toContain('AAPL')
      expect(visibleSymbols).toContain('MSFT')
      expect(visibleSymbols).not.toContain('TSLA')
    })

    it('[Integration] should filter by open status', async () => {
      const positions = [
        createTestPosition({ id: 'planned-filter', symbol: 'AAPL', status: 'planned', trades: [] }),
        createTestPosition({
          id: 'open-filter',
          symbol: 'NVDA',
          status: 'open',
          trades: [{
            id: 'trade-filter',
            position_id: 'open-filter',
            trade_type: 'buy',
            quantity: 20,
            price: 450.25,
            timestamp: new Date('2024-01-15T10:30:00.000Z')
          }]
        })
      ]

      for (const position of positions) {
        await positionService.create(position)
      }

      const allPositions = await positionService.getAll()

      await renderDashboardAndWait("open")

      const positionCards = screen.getAllByTestId(/position-card/)
      expect(positionCards).toHaveLength(1)

      const visibleSymbol = screen.getByTestId(`position-symbol-open-filter`).textContent
      expect(visibleSymbol).toBe('NVDA')
    })

    it('[Integration] should show all positions in All filter', async () => {
      const positions = [
        createTestPosition({ id: 'all-1', symbol: 'AAPL', status: 'planned', trades: [] }),
        createTestPosition({ id: 'all-2', symbol: 'MSFT', status: 'planned', trades: [] }),
        createTestPosition({
          id: 'all-3',
          symbol: 'TSLA',
          status: 'open',
          trades: [{
            id: 'trade-all',
            position_id: 'all-3',
            trade_type: 'buy',
            quantity: 75,
            price: 200.50,
            timestamp: new Date('2024-01-15T10:30:00.000Z')
          }]
        })
      ]

      for (const position of positions) {
        await positionService.create(position)
      }

      const allPositions = await positionService.getAll()

      await renderDashboardAndWait("all")

      const positionCards = screen.getAllByTestId(/position-card/)
      expect(positionCards).toHaveLength(3)

      const visibleSymbols = screen.getAllByTestId(/position-symbol-/).map(el => el.textContent)
      expect(visibleSymbols).toContain('AAPL')
      expect(visibleSymbols).toContain('MSFT')
      expect(visibleSymbols).toContain('TSLA')
    })

    it('[Integration] should update filter when status changes', async () => {
      const position = createTestPosition({
        id: 'filter-update-pos-123',
        symbol: 'AMZN',
        status: 'planned',
        trades: []
      })
      await positionService.create(position)

      let allPositions = await positionService.getAll()
      let rerender: any
      await act(async () => {
        const result = render(
          React.createElement(ServiceProvider, {},
            React.createElement(Dashboard, { filter: "planned" })
          )
        )
        rerender = result.rerender
      })

      // Wait for Dashboard to finish loading
      await waitFor(() => {
        expect(screen.queryByText('Loading positions...')).not.toBeInTheDocument()
      })

      // Find the position card with the specific position ID
      const positionCard = screen.getByTestId('position-card')
      expect(positionCard).toBeVisible()
      expect(positionCard).toHaveAttribute('data-position-id', 'filter-update-pos-123')

      const trade = createTestTrade({
        position_id: 'filter-update-pos-123',
        quantity: 25,
        price: 3200.25
      })
      await tradeService.addTrade(trade)

      allPositions = await positionService.getAll()
      await act(async () => {
        rerender(
          React.createElement(ServiceProvider, {},
            React.createElement(Dashboard, { filter: "planned" })
          )
        )
      })

      expect(screen.queryByTestId('position-card-filter-update-pos-123')).not.toBeInTheDocument()

      await act(async () => {
        rerender(
          React.createElement(ServiceProvider, {},
            React.createElement(Dashboard, { filter: "open" })
          )
        )
      })

      // Wait for Dashboard to finish loading after rerender
      await waitFor(() => {
        expect(screen.queryByText('Loading positions...')).not.toBeInTheDocument()
      })

      // Find the position card with the specific position ID
      const updatedPositionCard = screen.getByTestId('position-card')
      expect(updatedPositionCard).toBeVisible()
      expect(updatedPositionCard).toHaveAttribute('data-position-id', 'filter-update-pos-123')
    })
  })

  describe('[Integration] Status UI performance and error handling', () => {
    it('[Integration] should handle status display errors gracefully', async () => {
      const corruptedPosition = createTestPosition({
        id: 'corrupted-pos-123',
        symbol: 'NFLX',
        status: 'invalid-status' as any,
        trades: []
      })
      await positionService.create(corruptedPosition as any)

      const retrievedPosition = await positionService.getById('corrupted-pos-123')

      const metrics = calculateMetrics(retrievedPosition!)
      expect(() => {
        render(
        React.createElement(PositionCard, {
          position: retrievedPosition!,
          onViewDetails: vi.fn(),
          ...metrics
        })
      )
      }).not.toThrow()

      const statusBadge = screen.getByTestId('position-status-badge')
      expect(statusBadge).toBeVisible()
    })

    it('[Integration] should maintain performance with status computation', async () => {
      const positions = Array.from({ length: 50 }, (_, i) =>
        createTestPosition({
          id: `perf-pos-${i}`,
          symbol: `STK${i}`,
          status: i % 2 === 0 ? 'planned' : 'open',
          trades: i % 2 === 0 ? [] : [{
            id: `trade-${i}`,
            position_id: `perf-pos-${i}`,
            trade_type: 'buy',
            quantity: 100,
            price: 100 + i,
            timestamp: new Date('2024-01-15T10:30:00.000Z')
          }]
        })
      )

      for (const position of positions) {
        await positionService.create(position)
      }

      const allPositions = await positionService.getAll()

      const startTime = performance.now()
      await renderDashboardAndWait("all")
      const endTime = performance.now()

      const renderTime = endTime - startTime
      expect(renderTime).toBeLessThan(1000)

      const positionCards = screen.getAllByTestId(/position-card/)
      expect(positionCards).toHaveLength(50)
    })
  })
})