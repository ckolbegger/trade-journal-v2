import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { PositionDetail } from '@/pages/PositionDetail'
import { PositionService } from '@/lib/position'
import { TradeService } from '@/services/TradeService'
import type { Position } from '@/lib/position'
import { createIntegrationTestData } from '@/test/data-factories'
import { ServiceProvider } from '@/contexts/ServiceContext'
import { ServiceContainer } from '@/services/ServiceContainer'
import 'fake-indexeddb/auto'

describe('Integration: Add Trade from Position Detail', () => {
  let positionService: PositionService
  let tradeService: TradeService
  let testPosition: Position

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

    // Create fresh service instances with database injection
    positionService = services.getPositionService()
    tradeService = services.getTradeService()

    // Create a test position using data factory
    const testData = createIntegrationTestData()
    testPosition = await positionService.create(testData.multiple[0])
  })

  afterEach(async () => {
    ServiceContainer.resetInstance()

    // Clean up database
    const deleteRequest = indexedDB.deleteDatabase('TradingJournalDB')
    await new Promise<void>((resolve) => {
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => resolve()
      deleteRequest.onblocked = () => resolve()
    })
  })

  it('should complete Add Trade flow: Click button → Fill form → Save trade', async () => {
    // Render PositionDetail with the test position
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

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByTestId('trade-execution-modal')).not.toBeInTheDocument()
    })

    // Verify trade was saved to IndexedDB
    const updatedPosition = await positionService.getById(testPosition.id)
    const tradeCount = updatedPosition?.trades.length || 0
    expect(tradeCount).toBeGreaterThan(0)

    // Find the trade we just added
    const newTrade = updatedPosition?.trades.find(t => t.quantity === 50 && t.price === 149.50)
    expect(newTrade).toBeDefined()
    expect(newTrade?.trade_type).toBe('buy')
  })

  it('should allow canceling the Add Trade modal', async () => {
    const initialTradeCount = testPosition.trades.length

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
})
