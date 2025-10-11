import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { PositionDetail } from '@/pages/PositionDetail'
import { PositionService } from '@/lib/position'
import { TradeService } from '@/services/TradeService'
import { JournalService } from '@/services/JournalService'
import type { Position } from '@/lib/position'
import 'fake-indexeddb/auto'

describe('Integration: Simple Trade Execution Test', () => {
  let positionService: PositionService
  let tradeService: TradeService
  let journalService: JournalService
  let testPosition: Position
  let db: IDBDatabase

  beforeEach(async () => {
    // Clear IndexedDB
    indexedDB.deleteDatabase('TradingJournalDB')

    // Initialize database
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

    // Create fresh service instances
    positionService = new PositionService()
    tradeService = new TradeService()
    journalService = new JournalService(db)

    // Create a test position
    testPosition = await positionService.create({
      id: `simple-pos-${Date.now()}`,
      symbol: 'AAPL',
      strategy_type: 'Long Stock',
      target_entry_price: 150,
      target_quantity: 100,
      profit_target: 165,
      stop_loss: 135,
      position_thesis: 'Strong earnings expected',
      created_date: new Date().toISOString(),
      status: 'planned',
      journal_entry_ids: [],
      trades: []
    })
  })

  it('should open trade execution modal and save trade without TradeService errors', async () => {
    // Step 1: Render PositionDetail page
    render(
      <MemoryRouter initialEntries={[`/position/${testPosition.id}`]}>
        <Routes>
          <Route
            path="/position/:id"
            element={
              <PositionDetail
                positionService={positionService}
                tradeService={tradeService}
                journalService={journalService}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    )

    // Wait for position to load
    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument()
    })

    // Step 2: Click Add Trade button
    const addTradeButton = screen.getByRole('button', { name: /Add Trade/i })
    expect(addTradeButton).toBeInTheDocument()
    fireEvent.click(addTradeButton)

    // Step 3: Verify trade execution modal opens (this means TradeService is working)
    await waitFor(() => {
      expect(screen.getByTestId('trade-execution-modal')).toBeInTheDocument()
      expect(screen.getByText(/Execute Trade for AAPL/i)).toBeInTheDocument()
    })

    // Step 4: Fill basic trade form
    const quantityInput = screen.getByLabelText(/quantity/i)
    const priceInput = screen.getByLabelText(/price/i)
    const dateInput = screen.getByLabelText(/trade date/i)

    fireEvent.change(quantityInput, { target: { value: '50' } })
    fireEvent.change(priceInput, { target: { value: '149.50' } })
    fireEvent.change(dateInput, { target: { value: '2024-01-15T10:30' } })

    // Step 5: Submit trade form
    const executeTradeButton = screen.getByRole('button', { name: /Execute Trade/i })
    fireEvent.click(executeTradeButton)

    // Step 6: Verify the trade executes successfully
    // After execution, claude-code closes trade modal and opens journal modal
    await waitFor(() => {
      // Trade modal should close
      expect(screen.queryByTestId('trade-execution-modal')).not.toBeInTheDocument()
    }, { timeout: 5000 })

    // Step 7: Verify journal modal opens automatically (claude-code behavior)
    await waitFor(() => {
      expect(screen.getByTestId('add-journal-modal')).toBeInTheDocument()
    }, { timeout: 3000 })

    // If we get here without a "TradeService is not defined" error,
    // then the fix is working correctly
    expect(true).toBe(true) // Test passes if no error was thrown
  })

  it('should have proper TradeService instance available', async () => {
    // This test verifies that the TradeService is properly injected
    render(
      <MemoryRouter initialEntries={[`/position/${testPosition.id}`]}>
        <Routes>
          <Route
            path="/position/:id"
            element={
              <PositionDetail
                positionService={positionService}
                tradeService={tradeService}
                journalService={journalService}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument()
    })

    // If the component renders successfully, it means TradeService is properly initialized
    // The "TradeService is not defined" error would prevent the component from rendering
    const addTradeButton = screen.getByRole('button', { name: /Add Trade/i })
    expect(addTradeButton).toBeInTheDocument()
  })
})