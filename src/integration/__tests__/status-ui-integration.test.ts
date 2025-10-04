import 'fake-indexeddb/auto'
import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PositionService } from '@/lib/position'
import { TradeService } from '@/services/TradeService'
import { PositionCard } from '@/components/PositionCard'
import { Dashboard } from '@/components/Dashboard'
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

describe('Batch 1: Status UI Integration - Full Stack Tests', () => {
  let positionService: PositionService
  let tradeService: TradeService
  let testDbName: string

  beforeEach(async () => {
    testDbName = `TradingJournalDB_StatusUI_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    positionService = new PositionService()
    ;(positionService as any).dbName = testDbName
    tradeService = new TradeService(positionService)
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

      const mockOnTradeClick = vi.fn()
      render(
        React.createElement(PositionCard, {
          position: retrievedPosition!,
          onTradeClick: mockOnTradeClick
        })
      )

      const statusBadge = screen.getByTestId('position-status-badge')
      expect(statusBadge).toBeVisible()
      expect(statusBadge).toHaveTextContent('planned')
      expect(statusBadge).toHaveClass('bg-gray-100', 'text-gray-800')
    })

    it('[Integration] should show/hide trade execution button based on status', async () => {
      const plannedPosition = createTestPosition({
        id: 'button-pos-123',
        symbol: 'TSLA',
        status: 'planned',
        trades: []
      })
      await positionService.create(plannedPosition)
      const retrievedPosition = await positionService.getById('button-pos-123')

      const mockOnTradeClick = vi.fn()
      render(
        React.createElement(PositionCard, {
          position: retrievedPosition!,
          onTradeClick: mockOnTradeClick
        })
      )

      const tradeButton = screen.getByTestId('trade-execution-button')
      expect(tradeButton).toBeVisible()
      expect(tradeButton).toBeEnabled()

      fireEvent.click(tradeButton)
      expect(mockOnTradeClick).toHaveBeenCalledWith('button-pos-123')
    })

    it('[Integration] should hide trade execution button for open positions', async () => {
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

      render(
        React.createElement(PositionCard, {
          position: retrievedPosition!,
          onTradeClick: vi.fn()
        })
      )

      const tradeButton = screen.queryByTestId('trade-execution-button')
      expect(tradeButton).not.toBeInTheDocument()

      const executedIndicator = screen.getByTestId('position-executed-indicator')
      expect(executedIndicator).toBeVisible()
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

      const { unmount } = render(
        React.createElement(PositionCard, {
          position: updatedPosition!,
          onTradeClick: vi.fn()
        })
      )

      const cardStatusBadge = screen.getByTestId('position-status-badge')
      expect(cardStatusBadge).toHaveTextContent('open')
      expect(cardStatusBadge).toHaveClass('bg-green-100', 'text-green-800')

      unmount()
      const allPositions = await positionService.getAll()
      render(
        React.createElement(Dashboard, {
          positionService: positionService,
          tradeService: tradeService
        })
      )

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

      const newPositionService = new PositionService()
      ;(newPositionService as any).dbName = testDbName
      const refreshedPosition = await newPositionService.getById('persist-pos-123')

      expect(refreshedPosition).toBeTruthy()
      expect(refreshedPosition!.status).toBe('open')
      expect(refreshedPosition!.trades).toHaveLength(1)

      render(
        React.createElement(PositionCard, {
          position: refreshedPosition!,
          onTradeClick: vi.fn()
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

      render(
        React.createElement(PositionCard, {
          position: retrievedPosition!,
          onTradeClick: vi.fn()
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

      render(
        React.createElement(Dashboard, {
          positionService: positionService,
          tradeService: tradeService,
          filter: "planned"
        })
      )

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

      render(
        React.createElement(Dashboard, {
          positionService: positionService,
          tradeService: tradeService,
          filter: "open"
        })
      )

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

      render(
        React.createElement(Dashboard, {
          positionService: positionService,
          tradeService: tradeService,
          filter: "all"
        })
      )

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
      const { rerender } = render(
        React.createElement(Dashboard, {
          positionService: positionService,
          tradeService: tradeService,
          filter: "planned"
        })
      )

      expect(screen.getByTestId('position-card-filter-update-pos-123')).toBeVisible()

      const trade = createTestTrade({
        position_id: 'filter-update-pos-123',
        quantity: 25,
        price: 3200.25
      })
      await tradeService.addTrade(trade)

      allPositions = await positionService.getAll()
      rerender(
        React.createElement(Dashboard, {
          positionService: positionService,
          tradeService: tradeService,
          filter: "planned"
        })
      )

      expect(screen.queryByTestId('position-card-filter-update-pos-123')).not.toBeInTheDocument()

      rerender(
        React.createElement(Dashboard, {
          positionService: positionService,
          tradeService: tradeService,
          filter: "open"
        })
      )

      expect(screen.getByTestId('position-card-filter-update-pos-123')).toBeVisible()
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

      expect(() => {
        render(
        React.createElement(PositionCard, {
          position: retrievedPosition!,
          onTradeClick: vi.fn()
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
      render(
        React.createElement(Dashboard, {
          positionService: positionService,
          tradeService: tradeService,
          filter: "all"
        })
      )
      const endTime = performance.now()

      const renderTime = endTime - startTime
      expect(renderTime).toBeLessThan(1000)

      const positionCards = screen.getAllByTestId(/position-card/)
      expect(positionCards).toHaveLength(50)
    })
  })
})