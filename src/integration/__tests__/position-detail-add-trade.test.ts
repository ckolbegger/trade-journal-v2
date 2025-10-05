import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { BrowserRouter, Router } from 'react-router-dom'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { PositionService } from '@/lib/position'
import { TradeService } from '@/services/TradeService'
import { JournalService } from '@/services/JournalService'
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

describe('Integration: PositionDetail Add Trade Flow', () => {
  let positionService: PositionService
  let tradeService: TradeService
  let journalService: JournalService
  let testDbName: string

  beforeEach(async () => {
    testDbName = `TradingJournalDB_PositionDetail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    positionService = new PositionService()
    ;(positionService as any).dbName = testDbName
    tradeService = new TradeService(positionService)

    // Initialize the database by accessing it through PositionService first
    await positionService.getAll() // This will trigger database initialization

    // Create JournalService with same database
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(testDbName, 2)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
    journalService = new JournalService(db)
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

  it('[Integration] should allow complete trade execution flow from PositionDetail page', async () => {
    // Arrange - Create a planned position
    const testPosition = createTestPosition({
      id: 'position-detail-test-123',
      symbol: 'TSLA',
      target_entry_price: 200,
      target_quantity: 50
    })
    await positionService.create(testPosition)

    // Arrange - Create router with PositionDetail route
    const router = createMemoryRouter([
      {
        path: '/position/:id',
        element: React.createElement(PositionDetail, {
          positionService: positionService,
          tradeService: tradeService,
          journalService: journalService
        })
      }
    ], {
      initialEntries: [`/position/position-detail-test-123`],
      initialIndex: 0
    })

    // Act - Render PositionDetail page
    render(
      React.createElement(RouterProvider, { router })
    )

    // Wait for PositionDetail to load
    await waitFor(() => {
      expect(screen.getByText('TSLA')).toBeVisible()
      expect(screen.getByText(/Long Stock/)).toBeVisible()
    })

    // Should show "Add Trade" button in bottom actions
    const addTradeButton = screen.getByRole('button', { name: 'Add Trade' })
    expect(addTradeButton).toBeVisible()
    expect(addTradeButton).not.toBeDisabled()

    // Click "Add Trade" to open modal
    fireEvent.click(addTradeButton)

    // Should show trade execution modal
    await waitFor(() => {
      expect(screen.getByTestId('trade-execution-modal')).toBeVisible()
      expect(screen.getByText(/Execute Trade for TSLA/)).toBeVisible()
      expect(screen.getByText(/Target Entry: \$200\.00/)).toBeVisible()
      expect(screen.getByText(/Target Quantity: 50/)).toBeVisible()
    })

    // Fill in trade form
    fireEvent.change(screen.getByLabelText(/Trade Type/), { target: { value: 'buy' } })
    fireEvent.change(screen.getByLabelText(/Quantity/), { target: { value: '25' } })
    fireEvent.change(screen.getByLabelText(/Price/), { target: { value: '195.50' } })
    fireEvent.change(screen.getByLabelText(/Trade Date/), { target: { value: '2024-01-15T10:30' } })
    fireEvent.change(screen.getByLabelText(/Notes/), { target: { value: 'Test trade execution from PositionDetail' } })

    // Execute trade
    const executeButton = screen.getByRole('button', { name: /Execute Trade/i })
    expect(executeButton).toBeVisible()
    expect(executeButton).not.toBeDisabled()

    fireEvent.click(executeButton)

    // Assert - Modal should close
    await waitFor(() => {
      expect(screen.queryByTestId('trade-execution-modal')).not.toBeInTheDocument()
    }, { timeout: 10000 })

    // Should show updated position with trade information
    await waitFor(() => {
      // Should show trade in Trade History section
      expect(screen.getByText('Trade History')).toBeVisible()
    }, { timeout: 10000 })

    // Expand Trade History accordion to see the content
    await act(async () => {
      const tradeHistoryButton = screen.getByText('Trade History').closest('button')
      fireEvent.click(tradeHistoryButton!)
    })

    // Should show trade details in the expanded accordion
    await waitFor(() => {
      expect(screen.getByText('BUY')).toBeVisible()
      expect(screen.getByText('25 shares')).toBeVisible()
      expect(screen.getByText('25 shares @ $195.50')).toBeVisible()
    }, { timeout: 10000 })

    // Verify trade was actually saved to database
    const updatedPosition = await positionService.getById('position-detail-test-123')
    expect(updatedPosition).toBeTruthy()
    expect(updatedPosition!.trades).toHaveLength(1)
    expect(updatedPosition!.trades[0].quantity).toBe(25)
    expect(updatedPosition!.trades[0].price).toBe(195.50)
    expect(updatedPosition!.trades[0].trade_type).toBe('buy')
    expect(updatedPosition!.status).toBe('open')

    // Should show performance metrics with actual trade data
    await waitFor(() => {
      expect(screen.getByText('Avg Cost')).toBeVisible()
      // Average cost should be calculated from the actual trade
      // Look for the avg cost in the performance section specifically
      const avgCostElements = screen.getAllByText('$195.50')
      expect(avgCostElements.length).toBeGreaterThan(0)
    })
  }, 15000)

  it('[Integration] should cancel trade execution when cancel button is clicked', async () => {
    // Arrange - Create a planned position
    const testPosition = createTestPosition({
      id: 'position-detail-cancel-test-123',
      symbol: 'AAPL',
      target_entry_price: 150,
      target_quantity: 100
    })
    await positionService.create(testPosition)

    // Arrange - Create router with PositionDetail route
    const router = createMemoryRouter([
      {
        path: '/position/:id',
        element: React.createElement(PositionDetail, {
          positionService: positionService,
          tradeService: tradeService,
          journalService: journalService
        })
      }
    ], {
      initialEntries: [`/position/position-detail-cancel-test-123`],
      initialIndex: 0
    })

    // Act - Render PositionDetail page
    render(
      React.createElement(RouterProvider, { router })
    )

    // Wait for PositionDetail to load
    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeVisible()
    })

    // Click "Add Trade" to open modal
    const addTradeButton = screen.getByRole('button', { name: 'Add Trade' })
    fireEvent.click(addTradeButton)

    // Should show trade execution modal
    await waitFor(() => {
      expect(screen.getByTestId('trade-execution-modal')).toBeVisible()
    })

    // Click cancel button
    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    expect(cancelButton).toBeVisible()
    fireEvent.click(cancelButton)

    // Assert - Modal should close
    await waitFor(() => {
      expect(screen.queryByTestId('trade-execution-modal')).not.toBeInTheDocument()
    })

    // Position should remain unchanged (no trades added)
    const unchangedPosition = await positionService.getById('position-detail-cancel-test-123')
    expect(unchangedPosition).toBeTruthy()
    expect(unchangedPosition!.trades).toHaveLength(0)
    expect(unchangedPosition!.status).toBe('planned')

    // Expand Trade History accordion to see the content
    await act(async () => {
      const tradeHistoryButton = screen.getByText('Trade History').closest('button')
      fireEvent.click(tradeHistoryButton!)
    })

    // Should still show "No trades executed yet" in Trade History
    await waitFor(() => {
      expect(screen.getByText(/No trades executed yet/)).toBeVisible()
    })
  })

  it('[Integration] should show Phase 1A constraint error for position with existing trade', async () => {
    // Arrange - Create position with existing trade
    const positionWithTrade = createTestPosition({
      id: 'position-detail-constraint-test-123',
      symbol: 'MSFT',
      trades: [{
        id: 'existing-trade-123',
        position_id: 'position-detail-constraint-test-123',
        trade_type: 'buy',
        quantity: 100,
        price: 300.25,
        timestamp: new Date('2024-01-15T10:30:00.000Z')
      }]
    })
    await positionService.create(positionWithTrade)

    // Arrange - Create router with PositionDetail route
    const router = createMemoryRouter([
      {
        path: '/position/:id',
        element: React.createElement(PositionDetail, {
          positionService: positionService,
          tradeService: tradeService,
          journalService: journalService
        })
      }
    ], {
      initialEntries: [`/position/position-detail-constraint-test-123`],
      initialIndex: 0
    })

    // Act - Render PositionDetail page
    render(
      React.createElement(RouterProvider, { router })
    )

    // Wait for PositionDetail to load
    await waitFor(() => {
      expect(screen.getByText('MSFT')).toBeVisible()
    })

    // Click "Add Trade" to open modal
    const addTradeButton = screen.getByRole('button', { name: 'Add Trade' })
    fireEvent.click(addTradeButton)

    // Should show Phase 1A constraint error in modal
    await waitFor(() => {
      expect(screen.getByTestId('phase-1a-constraint-error')).toBeVisible()
      expect(screen.getByText(/Trade Not Allowed/)).toBeVisible()
      expect(screen.getByText(/Phase 1A allows only one trade per position/)).toBeVisible()
    })

    // Should show close button instead of form
    const closeButton = screen.getByRole('button', { name: 'Close' })
    expect(closeButton).toBeVisible()
    fireEvent.click(closeButton)

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByTestId('trade-execution-modal')).not.toBeInTheDocument()
    })

    // Position should remain unchanged
    const unchangedPosition = await positionService.getById('position-detail-constraint-test-123')
    expect(unchangedPosition).toBeTruthy()
    expect(unchangedPosition!.trades).toHaveLength(1) // Still has original trade
  })
})