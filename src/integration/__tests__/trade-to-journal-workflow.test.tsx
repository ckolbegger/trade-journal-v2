import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PositionDetail } from '@/pages/PositionDetail'
import { PositionService } from '@/lib/position'
import type { Position } from '@/lib/position'
import { JournalService } from '@/services/JournalService'
import { TradeService } from '@/services/TradeService'

/**
 * Integration Test: Trade Execution → Journal Entry Workflow
 *
 * Tests the complete user journey from executing a trade to being prompted
 * to add a journal entry for that trade. This is a critical UX flow that
 * ensures traders can document their execution decisions immediately.
 */
describe('Integration: Trade Execution → Journal Entry Workflow', () => {
  let db: IDBDatabase
  let positionService: PositionService
  let journalService: JournalService
  let tradeService: TradeService

  const mockPosition: Position = {
    id: 'pos-workflow-test',
    symbol: 'TSLA',
    strategy_type: 'Long Stock',
    target_entry_price: 200.0,
    target_quantity: 50,
    profit_target: 220.0,
    stop_loss: 180.0,
    position_thesis: 'Test workflow thesis',
    created_date: new Date('2025-10-01'),
    status: 'planned',
    journal_entry_ids: [],
    trades: []
  }

  beforeEach(async () => {
    // Open database
    db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('TradingJournalDB', 2)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        if (!db.objectStoreNames.contains('positions')) {
          const positionStore = db.createObjectStore('positions', { keyPath: 'id' })
          positionStore.createIndex('symbol', 'symbol', { unique: false })
          positionStore.createIndex('status', 'status', { unique: false })
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

    positionService = new PositionService()
    journalService = new JournalService(db)
    tradeService = new TradeService()

    // Clear all data
    await positionService.clearAll()
    await journalService.clearAll()
  })

  afterEach(() => {
    if (positionService) positionService.close()
    if (journalService) journalService.close()
    if (db) db.close()
  })

  const renderPositionDetail = () => {
    return render(
      <MemoryRouter initialEntries={[`/position/${mockPosition.id}`]}>
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
  }

  it('should open journal entry modal after successful trade execution', async () => {
    // Setup: Create position without trades
    await positionService.create(mockPosition)

    renderPositionDetail()

    // Wait for position to load
    await waitFor(() => {
      expect(screen.getByText('TSLA')).toBeInTheDocument()
    })

    // Step 1: Click "Add Trade" button
    const addTradeButton = screen.getByRole('button', { name: /add trade/i })
    expect(addTradeButton).toBeVisible()
    fireEvent.click(addTradeButton)

    // Step 2: Verify trade modal opened
    await waitFor(() => {
      expect(screen.getByTestId('trade-execution-modal')).toBeVisible()
    })

    // Step 3: Fill in trade details
    const quantityInput = screen.getByLabelText(/quantity/i)
    const priceInput = screen.getByLabelText(/price/i)
    const dateInput = screen.getByLabelText(/trade date/i)

    fireEvent.change(quantityInput, { target: { value: '50' } })
    fireEvent.change(priceInput, { target: { value: '200.00' } })
    fireEvent.change(dateInput, { target: { value: '2025-10-05T10:00' } })

    // Step 4: Submit trade
    const executeButton = screen.getByRole('button', { name: /execute trade/i })
    fireEvent.click(executeButton)

    // Step 5: Wait for trade modal to close
    await waitFor(() => {
      expect(screen.queryByTestId('trade-execution-modal')).not.toBeInTheDocument()
    }, { timeout: 3000 })

    // Step 6: Verify journal entry modal opened automatically
    await waitFor(() => {
      expect(screen.getByTestId('add-journal-modal')).toBeVisible()
    }, { timeout: 3000 })

    // Step 7: Verify the newly executed trade is pre-selected in the dropdown
    await waitFor(() => {
      const tradeSelect = screen.getByLabelText(/select trade/i) as HTMLSelectElement
      expect(tradeSelect.value).not.toBe('') // Should not be "Position Journal (no trade)"
    })

    // Step 8: Verify it shows trade_execution entry type prompts
    await waitFor(() => {
      expect(screen.getByText(/⚡.*trade execution/i)).toBeInTheDocument()
    })
  })

  it('should allow skipping journal entry and closing modal', async () => {
    // Setup
    await positionService.create(mockPosition)
    renderPositionDetail()

    await waitFor(() => {
      expect(screen.getByText('TSLA')).toBeInTheDocument()
    })

    // Execute trade
    fireEvent.click(screen.getByRole('button', { name: /add trade/i }))

    await waitFor(() => {
      expect(screen.getByTestId('trade-execution-modal')).toBeVisible()
    })

    fireEvent.change(screen.getByLabelText(/quantity/i), { target: { value: '50' } })
    fireEvent.change(screen.getByLabelText(/price/i), { target: { value: '200.00' } })
    fireEvent.change(screen.getByLabelText(/trade date/i), { target: { value: '2025-10-05T10:00' } })

    fireEvent.click(screen.getByRole('button', { name: /execute trade/i }))

    // Wait for journal modal to open
    await waitFor(() => {
      expect(screen.getByTestId('add-journal-modal')).toBeVisible()
    }, { timeout: 3000 })

    // User clicks Cancel to skip journal entry
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    // Verify modal closed and user is back on position detail
    await waitFor(() => {
      expect(screen.queryByTestId('add-journal-modal')).not.toBeInTheDocument()
    })

    expect(screen.getByText('TSLA')).toBeInTheDocument()
  })

  it('should save journal entry linked to the executed trade', async () => {
    // Setup
    await positionService.create(mockPosition)
    renderPositionDetail()

    await waitFor(() => {
      expect(screen.getByText('TSLA')).toBeInTheDocument()
    })

    // Execute trade
    fireEvent.click(screen.getByRole('button', { name: /add trade/i }))

    await waitFor(() => {
      expect(screen.getByTestId('trade-execution-modal')).toBeVisible()
    })

    fireEvent.change(screen.getByLabelText(/quantity/i), { target: { value: '50' } })
    fireEvent.change(screen.getByLabelText(/price/i), { target: { value: '200.00' } })
    fireEvent.change(screen.getByLabelText(/trade date/i), { target: { value: '2025-10-05T10:00' } })

    fireEvent.click(screen.getByRole('button', { name: /execute trade/i }))

    // Wait for journal modal
    await waitFor(() => {
      expect(screen.getByTestId('add-journal-modal')).toBeVisible()
    }, { timeout: 3000 })

    // Fill journal entry
    const executionNotesField = screen.getByLabelText(/execution notes/i)
    fireEvent.change(executionNotesField, { target: { value: 'Filled at market open with good liquidity' } })

    // Save journal
    const saveButton = screen.getByRole('button', { name: /save journal entry/i })
    fireEvent.click(saveButton)

    // Wait for save to complete
    await waitFor(() => {
      expect(screen.queryByTestId('add-journal-modal')).not.toBeInTheDocument()
    })

    // Verify journal was saved with correct trade_id
    const position = await positionService.getById(mockPosition.id)
    expect(position?.trades.length).toBe(1)

    const tradeId = position?.trades[0].id
    const journals = await journalService.getByTradeId(tradeId!)

    expect(journals.length).toBe(1)
    expect(journals[0].trade_id).toBe(tradeId)
    expect(journals[0].entry_type).toBe('trade_execution')
    expect(journals[0].position_id).toBe(mockPosition.id)
  })

  it.skip('should allow changing trade selection in journal modal (Phase 2 - multiple trades)', async () => {
    // Setup: Create position with one existing trade
    const positionWithTrade: Position = {
      ...mockPosition,
      trades: [{
        id: 'trade-existing',
        position_id: mockPosition.id,
        trade_type: 'buy',
        quantity: 25,
        price: 195.0,
        timestamp: new Date('2025-10-04T14:00:00Z'),
        notes: 'First partial fill'
      }]
    }
    await positionService.create(positionWithTrade)

    renderPositionDetail()

    await waitFor(() => {
      expect(screen.getByText('TSLA')).toBeInTheDocument()
    })

    // Execute second trade
    fireEvent.click(screen.getByRole('button', { name: /add trade/i }))

    await waitFor(() => {
      expect(screen.getByTestId('trade-execution-modal')).toBeVisible()
    })

    fireEvent.change(screen.getByLabelText(/quantity/i), { target: { value: '25' } })
    fireEvent.change(screen.getByLabelText(/price/i), { target: { value: '200.00' } })
    fireEvent.change(screen.getByLabelText(/trade date/i), { target: { value: '2025-10-05T10:00' } })

    fireEvent.click(screen.getByRole('button', { name: /execute trade/i }))

    // Wait for journal modal with new trade pre-selected
    await waitFor(() => {
      expect(screen.getByTestId('add-journal-modal')).toBeVisible()
    }, { timeout: 3000 })

    // Verify dropdown shows both trades
    const tradeSelect = screen.getByLabelText(/select trade/i) as HTMLSelectElement
    const options = Array.from(tradeSelect.options)

    expect(options.length).toBe(3) // Position Journal + 2 trades
    expect(options[0].textContent).toMatch(/position journal/i)

    // Change selection to first trade
    fireEvent.change(tradeSelect, { target: { value: 'trade-existing' } })

    // Verify entry type stays as trade_execution
    await waitFor(() => {
      expect(screen.getByText(/⚡.*trade execution/i)).toBeInTheDocument()
    })
  })
})
