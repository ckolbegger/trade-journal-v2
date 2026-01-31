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
import { ServiceProvider } from '@/contexts/ServiceContext'
import { ServiceContainer } from '@/services/ServiceContainer'
import { createPosition } from '@/test/data-factories'
import 'fake-indexeddb/auto'

describe('End-to-End: Add Trade Functionality', () => {
  let positionService: PositionService
  let tradeService: TradeService
  let journalService: JournalService

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

    positionService = services.getPositionService()
    tradeService = services.getTradeService()
    journalService = services.getJournalService()
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

  it('[End-to-End] should allow complete trade execution flow from Position Detail', async () => {
    // Arrange - Create a planned position
    const testPosition = createPosition({
      id: 'e2e-pos-123',
      symbol: 'TSLA',
      target_entry_price: 200,
      target_quantity: 50
    })
    await positionService.create(testPosition)

    // Act - Render app with routes
    render(
      React.createElement(ServiceProvider, {},
        React.createElement(MemoryRouter, { initialEntries: ['/'] },
          React.createElement(Routes, {},
            React.createElement(Route, { path: '/', element: React.createElement(Home, { positionService }) }),
            React.createElement(Route, { path: '/position/:id', element: React.createElement(PositionDetail, {}) })
          )
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
    const positionWithTrade = createPosition({
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
      React.createElement(ServiceProvider, {},
        React.createElement(MemoryRouter, { initialEntries: ['/'] },
          React.createElement(Routes, {},
            React.createElement(Route, { path: '/', element: React.createElement(Home, {}) })
          )
        )
      )
    )

    // Wait for Dashboard to load
    await waitFor(() => {
      expect(screen.getByTestId('position-symbol-e2e-constraint-pos-123')).toBeVisible()
    })

    // Should show "open" status for position with trades
    expect(screen.getByText('open')).toBeVisible()

    // Should show trade count
    expect(screen.getByText('1 trade')).toBeVisible()
  })
})