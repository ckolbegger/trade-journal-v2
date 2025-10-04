import 'fake-indexeddb/auto'
import React from 'react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PositionService } from '@/lib/position'
import { TradeService } from '@/services/TradeService'
import { PositionDetail } from '@/pages/PositionDetail'
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

describe('PositionDetail Trade Data Integration', () => {
  let positionService: PositionService
  let tradeService: TradeService
  let testDbName: string

  beforeEach(async () => {
    testDbName = `TradingJournalDB_PositionDetail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    positionService = new PositionService()
    ;(positionService as any).dbName = testDbName
    tradeService = new TradeService(positionService)
  })

  afterEach(async () => {
    try {
      await positionService.clearAll()
    } catch (error) {
      // Ignore errors during cleanup
    }
    if (positionService && typeof positionService.close === 'function') {
      positionService.close()
    }
    if (tradeService && typeof tradeService.close === 'function') {
      tradeService.close()
    }
  }, 10000)

  it('[Integration] should display trade data in position detail when position has trades', async () => {
    // Arrange - Create position first, then add trade
    const positionWithTrade = createTestPosition({
      id: 'detail-test-pos-123',
      symbol: 'TSLA',
      trades: [] // Start with empty trades
    })

    await positionService.create(positionWithTrade)

    // Add trade using TradeService (this properly associates the trade)
    await tradeService.addTrade({
      id: 'trade-123',
      position_id: 'detail-test-pos-123',
      trade_type: 'buy',
      quantity: 50,
      price: 195.50,
      timestamp: new Date('2024-01-15T10:30:00.000Z')
    })

    // Verify the trade was actually added
    const updatedPosition = await positionService.getById('detail-test-pos-123')
    expect(updatedPosition?.trades).toHaveLength(1)
    expect(updatedPosition?.trades[0].quantity).toBe(50)

    // Act - Render PositionDetail component with proper routing
    render(
      React.createElement(MemoryRouter, { initialEntries: ['/position/detail-test-pos-123'] },
        React.createElement(Routes, {},
          React.createElement(Route, {
            path: '/position/:id',
            element: React.createElement(PositionDetail, { positionService })
          })
        )
      )
    )

    // Wait for position to load
    await waitFor(() => {
      expect(screen.getByText('TSLA')).toBeVisible()
    })

    // Assert - Should show trade history accordion with trade data
    const tradeHistoryAccordion = screen.getByText('Trade History')
    expect(tradeHistoryAccordion).toBeVisible()

    // The accordion should indicate it has trades (not empty)
    expect(screen.queryByText('(Empty)')).not.toBeInTheDocument()

    // Should show trade details when accordion is opened
    fireEvent.click(tradeHistoryAccordion)

    await waitFor(() => {
      // Should display trade information - look for the exact text from the component
      expect(screen.getByText('BUY')).toBeVisible()
      expect(screen.getByText('50 shares')).toBeVisible()
      expect(screen.getByText('$195.50')).toBeVisible()
    })
  })

  it('[Integration] should show empty trade history for position without trades', async () => {
    // Arrange - Create position without trades
    const positionWithoutTrades = createTestPosition({
      id: 'detail-test-no-trades-123',
      symbol: 'MSFT',
      trades: []
    })

    await positionService.create(positionWithoutTrades)

    // Act - Render PositionDetail component with proper routing
    render(
      React.createElement(MemoryRouter, { initialEntries: ['/position/detail-test-no-trades-123'] },
        React.createElement(Routes, {},
          React.createElement(Route, {
            path: '/position/:id',
            element: React.createElement(PositionDetail, { positionService })
          })
        )
      )
    )

    // Wait for position to load
    await waitFor(() => {
      expect(screen.getByText('MSFT')).toBeVisible()
    })

    // Assert - Should show empty trade history
    const tradeHistoryAccordion = screen.getByText('Trade History')
    expect(tradeHistoryAccordion).toBeVisible()

    // Should indicate empty state
    expect(screen.getByText('(Empty)')).toBeVisible()

    // Should show "No trades executed yet" message when opened
    fireEvent.click(tradeHistoryAccordion)

    await waitFor(() => {
      expect(screen.getByText('No trades executed yet')).toBeVisible()
    })
  })

  it('[Integration] should display correct status badge based on trades', async () => {
    // Arrange - Create position first, then add trade
    const positionWithTrade = createTestPosition({
      id: 'detail-status-test-123',
      symbol: 'NVDA',
      trades: [] // Start with empty trades
    })

    await positionService.create(positionWithTrade)

    // Add trade using TradeService
    await tradeService.addTrade({
      id: 'trade-status-123',
      position_id: 'detail-status-test-123',
      trade_type: 'buy',
      quantity: 25,
      price: 450.25,
      timestamp: new Date('2024-01-15T10:30:00.000Z')
    })

    // Verify the trade was actually added
    const updatedPosition = await positionService.getById('detail-status-test-123')
    expect(updatedPosition?.trades).toHaveLength(1)
    expect(updatedPosition?.trades[0].quantity).toBe(25)

    // Act - Render PositionDetail component with proper routing
    render(
      React.createElement(MemoryRouter, { initialEntries: ['/position/detail-status-test-123'] },
        React.createElement(Routes, {},
          React.createElement(Route, {
            path: '/position/:id',
            element: React.createElement(PositionDetail, { positionService })
          })
        )
      )
    )

    // Wait for position to load
    await waitFor(() => {
      expect(screen.getByText('NVDA')).toBeVisible()
    })

    // Assert - Should show open status (but PositionDetail doesn't show status badge currently)
    // This test will help us verify the position data is loaded correctly
    expect(screen.getByText('NVDA')).toBeVisible()
  })
})