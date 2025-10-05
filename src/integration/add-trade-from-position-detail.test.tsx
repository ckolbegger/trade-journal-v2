import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { PositionDetail } from '@/pages/PositionDetail'
import { PositionService } from '@/lib/position'
import type { Position } from '@/lib/position'
import { JournalService } from '@/services/JournalService'
import { createIntegrationTestData } from '@/test/data-factories'
import 'fake-indexeddb/auto'

describe('Integration: Add Trade from Position Detail', () => {
  let positionService: PositionService
  let testPosition: Position

  beforeEach(async () => {
    // Clear IndexedDB
    indexedDB.deleteDatabase('TradingJournalDB')

    // Create fresh service instances
    positionService = new PositionService()

    // Create a test position using data factory
    const testData = createIntegrationTestData()
    testPosition = await positionService.create(testData.multiple[0])
  })

  it('should complete Add Trade flow: Click button → Fill form → Save trade', async () => {
    // Render PositionDetail with the test position
    render(
      <MemoryRouter initialEntries={[`/position/${testPosition.id}`]}>
        <Routes>
          <Route
            path="/position/:id"
            element={
              <PositionDetail
                positionService={positionService}
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

    // Click Add Trade button
    const addTradeButton = screen.getByRole('button', { name: /add trade/i })
    fireEvent.click(addTradeButton)

    // Modal should appear with trade form
    await waitFor(() => {
      expect(screen.getByTestId('trade-execution-modal')).toBeInTheDocument()
      expect(screen.getByText(/execute trade for aapl/i)).toBeInTheDocument()
    })

    // Fill out the trade form
    const quantityInput = screen.getByLabelText(/quantity/i)
    const priceInput = screen.getByLabelText(/price/i)
    const dateInput = screen.getByLabelText(/trade date/i)

    fireEvent.change(quantityInput, { target: { value: '50' } })
    fireEvent.change(priceInput, { target: { value: '149.50' } })
    fireEvent.change(dateInput, { target: { value: '2024-01-15T10:30' } })

    // Submit the form
    const executeButton = screen.getByRole('button', { name: /execute trade/i })
    fireEvent.click(executeButton)

    // Trade modal should close and journal modal should appear
    await waitFor(() => {
      expect(screen.queryByTestId('trade-execution-modal')).not.toBeInTheDocument()
      expect(screen.getByTestId('trade-execution-journal-modal')).toBeInTheDocument()
    })

    // Journal modal should present Save and Skip options
    expect(screen.getByRole('button', { name: /save journal/i })).toBeVisible()
    expect(screen.getByRole('button', { name: /skip for now/i })).toBeVisible()

    // Skip journaling for this test scenario
    fireEvent.click(screen.getByRole('button', { name: /skip for now/i }))

    await waitFor(() => {
      expect(screen.queryByTestId('trade-execution-journal-modal')).not.toBeInTheDocument()
    })

    // Verify trade was saved to IndexedDB
    const updatedPosition = await positionService.getById(testPosition.id)
    const tradeCount = updatedPosition?.trades.length || 0
    expect(tradeCount).toBeGreaterThan(0)

    // Find the trade we just added
    const newTrade = updatedPosition?.trades.find(t => t.quantity === 50 && t.price === 149.50)
    expect(newTrade).toBeDefined()
    expect(newTrade?.trade_type).toBe('buy')

    // Verify no journal entry was created when skipping
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('TradingJournalDB', 2)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })

    const journalService = new JournalService(db)
    const journalEntries = await journalService.getByPositionId(testPosition.id)
    expect(journalEntries).toHaveLength(0)
    db.close()
  })

  it('should allow canceling the Add Trade modal', async () => {
    const initialTradeCount = testPosition.trades.length

    render(
      <MemoryRouter initialEntries={[`/position/${testPosition.id}`]}>
        <Routes>
          <Route
            path="/position/:id"
            element={
              <PositionDetail
                positionService={positionService}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument()
    })

    // Click Add Trade button
    const addTradeButton = screen.getByRole('button', { name: /add trade/i })
    fireEvent.click(addTradeButton)

    // Modal should appear
    await waitFor(() => {
      expect(screen.getByTestId('trade-execution-modal')).toBeInTheDocument()
    })

    // Click Cancel button
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByTestId('trade-execution-modal')).not.toBeInTheDocument()
    })

    // No new trade should be added
    const updatedPosition = await positionService.getById(testPosition.id)
    expect(updatedPosition?.trades.length).toBe(initialTradeCount)
  })

  it('should allow saving trade execution journal immediately after trade', async () => {
    render(
      <MemoryRouter initialEntries={[`/position/${testPosition.id}`]}>
        <Routes>
          <Route
            path="/position/:id"
            element={
              <PositionDetail
                positionService={positionService}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /add trade/i }))

    await waitFor(() => {
      expect(screen.getByTestId('trade-execution-modal')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/quantity/i), { target: { value: '12' } })
    fireEvent.change(screen.getByLabelText(/price/i), { target: { value: '151.25' } })
    fireEvent.change(screen.getByLabelText(/trade date/i), { target: { value: '2024-01-15T10:30' } })

    fireEvent.click(screen.getByRole('button', { name: /execute trade/i }))

    await waitFor(() => {
      expect(screen.queryByTestId('trade-execution-modal')).not.toBeInTheDocument()
      expect(screen.getByTestId('trade-execution-journal-modal')).toBeInTheDocument()
    })

    // Fill journal prompt responses (use textarea inputs rendered by modal)
    const textareas = screen.getAllByRole('textbox')
    expect(textareas.length).toBeGreaterThan(0)
    fireEvent.change(textareas[0], { target: { value: 'Executed quickly at open.' } })

    fireEvent.click(screen.getByRole('button', { name: /save journal/i }))

    await waitFor(() => {
      expect(screen.queryByTestId('trade-execution-journal-modal')).not.toBeInTheDocument()
    })

    // Position detail should now show journal entry linked to trade
    await waitFor(() => {
      expect(screen.getByText(/Trade Execution/i)).toBeInTheDocument()
      expect(screen.getByText(/Executed quickly at open./i)).toBeInTheDocument()
    })
  })
})
