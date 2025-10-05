import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { PositionService } from '@/lib/position'
import { TradeService } from '@/services/TradeService'
import { Home } from '@/pages/Home'
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

describe('End-to-End: Add Trade Functionality', () => {
  let positionService: PositionService
  let tradeService: TradeService
  let testDbName: string

  beforeEach(async () => {
    testDbName = `TradingJournalDB_EndToEnd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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

  it('[End-to-End] should allow complete trade execution flow from Position Detail', async () => {
    // Arrange - Create a planned position
    const testPosition = createTestPosition({
      id: 'e2e-pos-123',
      symbol: 'TSLA',
      target_entry_price: 200,
      target_quantity: 50
    })
    await positionService.create(testPosition)

    // Act - Render app with routes
    render(
      React.createElement(MemoryRouter, { initialEntries: ['/'] },
        React.createElement(Routes, {},
          React.createElement(Route, { path: '/', element: React.createElement(Home, { positionService }) }),
          React.createElement(Route, { path: '/position/:id', element: React.createElement(PositionDetail, { positionService, tradeService }) })
        )
      )
    )

    // Wait for Dashboard to load
    await waitFor(() => {
      expect(screen.getByTestId('position-symbol-e2e-pos-123')).toBeVisible()
    })

    // Click position card to navigate to detail page
    const positionCard = screen.getByTestId('position-card')
    expect(positionCard).toBeVisible()
    expect(positionCard).toHaveClass('cursor-pointer')
    fireEvent.click(positionCard)

    // Wait for Position Detail page to load
    await waitFor(() => {
      expect(screen.getByText('Trade Plan')).toBeVisible()
    })

    // Click "Add Trade" button on detail page
    const addTradeButton = screen.getByRole('button', { name: /Add Trade/i })
    expect(addTradeButton).toBeVisible()
    fireEvent.click(addTradeButton)

    // Should show trade execution modal
    await waitFor(() => {
      expect(screen.getByTestId('trade-execution-modal')).toBeVisible()
      expect(screen.getByText(/Execute Trade for TSLA/)).toBeVisible()
    })

    // Fill in trade form
    fireEvent.change(screen.getByLabelText(/Trade Type/), { target: { value: 'buy' } })
    fireEvent.change(screen.getByLabelText(/Quantity/), { target: { value: '25' } })
    fireEvent.change(screen.getByLabelText(/Price/), { target: { value: '195.50' } })
    fireEvent.change(screen.getByLabelText(/Trade Date/), { target: { value: '2024-01-15T10:30' } })
    fireEvent.change(screen.getByLabelText(/Notes/), { target: { value: 'Test trade execution' } })

    // Execute trade
    const executeButton = screen.getByRole('button', { name: /Execute Trade/i })
    fireEvent.click(executeButton)

    // Assert - Modal should close and position should update
    await waitFor(() => {
      expect(screen.queryByTestId('trade-execution-modal')).not.toBeInTheDocument()
    })

    // Verify trade was actually saved
    const updatedPosition = await positionService.getById('e2e-pos-123')
    expect(updatedPosition).toBeTruthy()
    expect(updatedPosition!.trades).toHaveLength(1)
    expect(updatedPosition!.trades[0].quantity).toBe(25)
    expect(updatedPosition!.trades[0].price).toBe(195.50)
    expect(updatedPosition!.status).toBe('open')
  })

  it('[End-to-End] should show position with trades on Dashboard', async () => {
    // Arrange - Create position with existing trade
    const positionWithTrade = createTestPosition({
      id: 'e2e-constraint-pos-123',
      symbol: 'MSFT',
      trades: [{
        id: 'existing-trade-123',
        position_id: 'e2e-constraint-pos-123',
        trade_type: 'buy',
        quantity: 100,
        price: 300.25,
        timestamp: new Date('2024-01-15T10:30:00.000Z')
      }]
    })
    await positionService.create(positionWithTrade)

    // Act - Render app with routes
    render(
      React.createElement(MemoryRouter, { initialEntries: ['/'] },
        React.createElement(Routes, {},
          React.createElement(Route, { path: '/', element: React.createElement(Home, { positionService }) })
        )
      )
    )

    // Wait for Dashboard to load
    await waitFor(() => {
      expect(screen.getByTestId('position-symbol-e2e-constraint-pos-123')).toBeVisible()
    })

    // Should show "Position Open" for position with trades
    expect(screen.getByText('Position Open')).toBeVisible()

    // Should show trade count
    expect(screen.getByText('1 trade')).toBeVisible()
  })
})