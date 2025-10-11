import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { PositionService } from '@/lib/position'
import { TradeService } from '@/services/TradeService'
import { JournalService } from '@/services/JournalService'
import { Home } from '@/pages/Home'
import { PositionDetail } from '@/pages/PositionDetail'
import type { Position, Trade } from '@/lib/position'
import 'fake-indexeddb/auto'

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
  let journalService: JournalService
  let testDbName: string
  let db: IDBDatabase

  beforeEach(async () => {
    // Clear and initialize IndexedDB
    indexedDB.deleteDatabase('TradingJournalDB')

    db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('TradingJournalDB', 2)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        if (!db.objectStoreNames.contains('positions')) {
          const store = db.createObjectStore('positions', { keyPath: 'id' })
          store.createIndex('symbol', 'symbol', { unique: false })
          store.createIndex('status', 'status', { unique: false })
          store.createIndex('created_date', 'created_date', { unique: false })
        }

        if (!db.objectStoreNames.contains('journal_entries')) {
          const journalStore = db.createObjectStore('journal_entries', { keyPath: 'id' })
          journalStore.createIndex('position_id', 'position_id', { unique: false })
          journalStore.createIndex('trade_id', 'trade_id', { unique: false })
          journalStore.createIndex('entry_type', 'entry_type', { unique: false })
          journalStore.createIndex('created_at', 'created_at', { unique: false })
        }
      }
    })

    testDbName = `TradingJournalDB_EndToEnd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    positionService = new PositionService()
    ;(positionService as any).dbName = testDbName
    tradeService = new TradeService(positionService)
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
          React.createElement(Route, { path: '/position/:id', element: React.createElement(PositionDetail, { positionService, tradeService, journalService }) })
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

    // Assert - Trade modal should close
    await waitFor(() => {
      expect(screen.queryByTestId('trade-execution-modal')).not.toBeInTheDocument()
    })

    // Journal modal should open automatically (new behavior)
    await waitFor(() => {
      expect(screen.getByTestId('add-journal-modal')).toBeInTheDocument()
    })

    // Close the journal modal (skip journaling for this test)
    const cancelButton = screen.getByRole('button', { name: /Cancel/i })
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(screen.queryByTestId('add-journal-modal')).not.toBeInTheDocument()
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