import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { PositionDetail } from '@/pages/PositionDetail'
import { PositionService } from '@/lib/position'
import { TradeService } from '@/services/TradeService'
import { JournalService } from '@/services/JournalService'
import type { Position } from '@/lib/position'
import { ServiceProvider } from '@/contexts/ServiceContext'
import { ServiceContainer } from '@/services/ServiceContainer'
import 'fake-indexeddb/auto'

describe('Integration: Trade Execution Workflow', () => {
  let positionService: PositionService
  let tradeService: TradeService
  let journalService: JournalService
  let testPosition: Position
  let db: IDBDatabase

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
    const services = ServiceContainer.getInstance()
    await services.initialize()

    // Get database reference
    db = (services as any).db

    // Create fresh service instances with database injection
    positionService = services.getPositionService()
    tradeService = services.getTradeService()
    journalService = services.getJournalService()

    // Create a test position
    testPosition = await positionService.create({
      id: `workflow-pos-${Date.now()}`,
      symbol: 'TSLA',
      strategy_type: 'Long Stock',
      target_entry_price: 200,
      target_quantity: 50,
      profit_target: 220,
      stop_loss: 180,
      position_thesis: 'Tesla earnings beat expectations',
      created_date: new Date().toISOString(),
      status: 'planned',
      journal_entry_ids: [],
      trades: []
    })
  })

  afterEach(async () => {
    // Clear all positions before closing
    if (positionService) {
      await positionService.clearAll()
    }

    ServiceContainer.resetInstance()

    // Clean up database
    const deleteRequest = indexedDB.deleteDatabase('TradingJournalDB')
    await new Promise<void>((resolve) => {
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => resolve()
      deleteRequest.onblocked = () => resolve()
    })
  })

  it('should complete full trade execution workflow with TradeService', async () => {
    // Step 1: Render PositionDetail page
    render(
      <ServiceProvider>
        <MemoryRouter initialEntries={[`/position/${testPosition.id}`]}>
          <Routes>
            <Route
              path="/position/:id"
              element={<PositionDetail />}
            />
          </Routes>
        </MemoryRouter>
      </ServiceProvider>
    )

    // Wait for position to load
    await waitFor(() => {
      expect(screen.getByText('TSLA')).toBeInTheDocument()
    })

    // Step 2: Click Add Trade button
    const addTradeButton = screen.getByRole('button', { name: /Add Trade/i })
    expect(addTradeButton).toBeInTheDocument()
    fireEvent.click(addTradeButton)

    // Step 3: Verify trade execution modal opens
    await waitFor(() => {
      expect(screen.getByTestId('trade-execution-modal')).toBeInTheDocument()
      expect(screen.getByText(/Execute Trade for TSLA/i)).toBeInTheDocument()
    })

    // Step 4: Fill trade form
    const quantityInput = screen.getByLabelText(/quantity/i)
    const priceInput = screen.getByLabelText(/price/i)
    const dateInput = screen.getByLabelText(/trade date/i)

    fireEvent.change(quantityInput, { target: { value: '25' } })
    fireEvent.change(priceInput, { target: { value: '195.50' } })
    fireEvent.change(dateInput, { target: { value: '2024-01-15T10:30' } })

    // Step 5: Submit trade form
    const executeTradeButton = screen.getByRole('button', { name: /Execute Trade/i })
    fireEvent.click(executeTradeButton)

    // Step 6: Trade modal closes after successful execution
    await waitFor(() => {
      expect(screen.queryByTestId('trade-execution-modal')).not.toBeInTheDocument()
    }, { timeout: 3000 })

    // Step 7: Journal modal opens automatically with new trade pre-selected
    await waitFor(() => {
      expect(screen.getByTestId('add-journal-modal')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Step 8: Skip journal by clicking Cancel
    const cancelButton = screen.getByRole('button', { name: /Cancel/i })
    fireEvent.click(cancelButton)

    // Step 9: Verify journal modal closes
    await waitFor(() => {
      expect(screen.queryByTestId('add-journal-modal')).not.toBeInTheDocument()
    }, { timeout: 3000 })

    // Step 10: Verify trade appears in position detail
    await waitFor(() => {
      expect(screen.getByText(/Trade History/)).toBeInTheDocument()
      // Should show the updated trade count
      expect(screen.getByText(/\(1\)/)).toBeInTheDocument()
    })

    // Step 11: Verify Add Journal Entry button is available
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Add Journal Entry/i })).toBeInTheDocument()
    })
  })

  it('should handle trade execution with journal saving', async () => {
    // Step 1: Render PositionDetail page
    render(
      <ServiceProvider>
        <MemoryRouter initialEntries={[`/position/${testPosition.id}`]}>
          <Routes>
            <Route
              path="/position/:id"
              element={<PositionDetail />}
            />
          </Routes>
        </MemoryRouter>
      </ServiceProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('TSLA')).toBeInTheDocument()
    })

    // Step 2: Click Add Trade button
    const addTradeButton = screen.getByRole('button', { name: /Add Trade/i })
    fireEvent.click(addTradeButton)

    // Step 3: Fill and submit trade form
    await waitFor(() => {
      expect(screen.getByTestId('trade-execution-modal')).toBeInTheDocument()
    })

    const quantityInput = screen.getByLabelText(/quantity/i)
    const priceInput = screen.getByLabelText(/price/i)
    const dateInput = screen.getByLabelText(/trade date/i)

    fireEvent.change(quantityInput, { target: { value: '25' } })
    fireEvent.change(priceInput, { target: { value: '195.50' } })
    fireEvent.change(dateInput, { target: { value: '2024-01-15T10:30' } })

    const executeTradeButton = screen.getByRole('button', { name: /Execute Trade/i })
    fireEvent.click(executeTradeButton)

    // Step 4: Trade modal closes and journal modal opens
    await waitFor(() => {
      expect(screen.queryByTestId('trade-execution-modal')).not.toBeInTheDocument()
    }, { timeout: 3000 })

    await waitFor(() => {
      expect(screen.getByTestId('add-journal-modal')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Step 5: Fill journal form
    const executionNotesTextarea = screen.getByLabelText(/Execution Notes/i)
    fireEvent.change(executionNotesTextarea, { target: { value: 'Good execution, got the price I wanted' } })

    const saveJournalButton = screen.getByRole('button', { name: /Save Journal Entry/i })
    fireEvent.click(saveJournalButton)

    // Step 6: Verify journal modal closes
    await waitFor(() => {
      expect(screen.queryByTestId('add-journal-modal')).not.toBeInTheDocument()
    }, { timeout: 5000 })

    // Step 7: Verify journal entry was saved and appears in the UI
    await waitFor(() => {
      // Expand Journal Entries accordion to see the entry
      const journalAccordion = screen.getByText(/Journal Entries/i)
      expect(journalAccordion).toBeInTheDocument()
    })
  })
})