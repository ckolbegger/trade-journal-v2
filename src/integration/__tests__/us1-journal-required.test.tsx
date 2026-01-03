import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from '@/App'
import { PositionService } from '@/lib/position'
import { JournalService } from '@/services/JournalService'
import { ServiceContainer } from '@/services/ServiceContainer'
import 'fake-indexeddb/auto'
import type { Position } from '@/lib/position'

/**
 * Integration test suite for journal entry requirement enforcement
 *
 * This test suite verifies that:
 * - Position creation is blocked without journal entry
 * - User is prompted to complete journal entry
 * - Position is created successfully after journal entry is completed
 * - Position and journal entry are properly linked
 *
 * Tests follow TDD Red-Green-Refactor cycle:
 * 1. Tests written first (this file) - expected to fail initially
 * 2. Feature implemented in T030 - tests pass
 */

describe('Integration: US1 - Journal Entry Requirement', () => {
  let positionService: PositionService
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

  /**
   * Helper: Fill position plan form with minimal valid data
   */
  const fillPositionPlanForm = async () => {
    // Select Short Put strategy
    const strategySelect = screen.getByRole('combobox', { name: /Strategy Type/i })
    fireEvent.change(strategySelect, { target: { value: 'Short Put' } })

    // Wait for option fields to appear
    await waitFor(() => {
      expect(screen.getByLabelText(/Strike Price/i)).toBeInTheDocument()
    })

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'AAPL' } })
    fireEvent.change(screen.getByLabelText(/Target Entry Price/i), { target: { value: '100' } })
    fireEvent.change(screen.getByLabelText(/Target Quantity/i), { target: { value: '5' } })
    fireEvent.change(screen.getByLabelText(/Strike Price/i), { target: { value: '100' } })

    // Set future expiration date
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)
    const dateStr = futureDate.toISOString().split('T')[0]
    fireEvent.change(screen.getByLabelText(/Expiration Date/i), { target: { value: dateStr } })

    fireEvent.change(screen.getByLabelText(/Premium per Contract/i), { target: { value: '3.00' } })
    fireEvent.change(screen.getByLabelText(/Profit Target/i), { target: { value: '95' } })

    const profitBasisSelect = screen.getByRole('combobox', { name: /Profit Basis/i })
    fireEvent.change(profitBasisSelect, { target: { value: 'stock_price' } })

    const stopLossInput = document.getElementById('stop_loss') as HTMLInputElement
    expect(stopLossInput).toBeInTheDocument()
    fireEvent.change(stopLossInput, { target: { value: '110' } })

    const stopLossBasisSelect = screen.getByRole('combobox', { name: /Stop Loss Basis/i })
    fireEvent.change(stopLossBasisSelect, { target: { value: 'stock_price' } })

    fireEvent.change(screen.getByLabelText(/Position Thesis/i), { target: { value: 'Bullish on AAPL' } })

    // Wait for React state to settle
    await waitFor(() => {
      expect(screen.getByLabelText(/Position Thesis/i)).toHaveValue('Bullish on AAPL')
    })
  }

  /**
   * Helper: Fill journal entry with required field
   */
  const fillJournalEntry = async () => {
    // Fill required Rationale field (minimum 10 characters)
    fireEvent.change(screen.getByLabelText(/Rationale/i), {
      target: { value: 'Selling cash-secured puts for income generation' }
    })

    // Wait for journal state to settle
    await waitFor(() => {
      expect(screen.getByLabelText(/Rationale/i)).toHaveValue('Selling cash-secured puts for income generation')
    })
  }

  describe('Journal Requirement Enforcement', () => {
    it('should block position creation when journal entry is not completed', async () => {
      // Start at root
      window.history.pushState({}, 'Test', '/')
      render(<App />)

      // Navigate to position creation
      await waitFor(() => {
        expect(screen.getByText('Start Your Trading Journey')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /Create Your First Position/i }))

      await waitFor(() => {
        expect(screen.getByText('Position Plan')).toBeInTheDocument()
      })

      // Fill position plan form
      await fillPositionPlanForm()

      // Skip journal entry - proceed directly to confirmation
      fireEvent.click(screen.getByText('Next: Trading Journal'))

      await waitFor(() => {
        expect(screen.getByText('📝 Position Plan')).toBeInTheDocument()
      })

      // Do NOT fill journal entry - click Next immediately
      fireEvent.click(screen.getByText('Next: Risk Assessment'))

      await waitFor(() => {
        expect(screen.getByText('Risk Assessment')).toBeInTheDocument()
      }, { timeout: 5000 })

      fireEvent.click(screen.getByText('Next: Confirmation'))

      await waitFor(() => {
        expect(screen.getByText('Confirmation')).toBeInTheDocument()
      })

      // Confirm immutability
      const immutableCheckbox = screen.getByRole('checkbox', {
        name: /I understand this position plan will be immutable after creation/i
      })
      fireEvent.click(immutableCheckbox)

      // Attempt to create position WITHOUT journal entry
      const createButton = screen.getByRole('button', { name: /Create Position Plan/i })
      expect(createButton).toBeVisible()

      // Click create button - should be blocked or show error
      fireEvent.click(createButton)

      // Verify that position creation was blocked
      // Either:
      // 1. Still on confirmation page (navigation blocked)
      // 2. Error message shown about missing journal entry
      // 3. Redirected back to journal step

      // Check for error message or blocked navigation
      await waitFor(() => {
        // Either we're still on confirmation page, or we see an error
        const stillOnConfirmation = screen.queryByText('Confirmation') !== null
        const errorMessage = screen.queryByText(/journal/i) !== null

        expect(stillOnConfirmation || errorMessage).toBe(true)
      })

      // Verify no position was created
      const positions = await positionService.getAll()
      expect(positions).toHaveLength(0)
    })

    it('should prompt user to complete journal entry when trying to skip it', async () => {
      // Start at root
      window.history.pushState({}, 'Test', '/')
      render(<App />)

      // Navigate to position creation
      await waitFor(() => {
        expect(screen.getByText('Start Your Trading Journey')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /Create Your First Position/i }))

      await waitFor(() => {
        expect(screen.getByText('Position Plan')).toBeInTheDocument()
      })

      // Fill position plan form
      await fillPositionPlanForm()

      // Proceed to journal step
      fireEvent.click(screen.getByText('Next: Trading Journal'))

      await waitFor(() => {
        expect(screen.getByText('📝 Position Plan')).toBeInTheDocument()
      })

      // Try to skip journal by clicking Next without filling required fields
      const nextToRiskButton = screen.getByText('Next: Risk Assessment')
      fireEvent.click(nextToRiskButton)

      // Should either:
      // 1. Show validation error about required journal fields
      // 2. Block navigation and stay on journal step
      // 3. Show inline error on required journal field

      await waitFor(() => {
        // Check if we're still on journal step or see an error
        const stillOnJournal = screen.queryByText('📝 Position Plan') !== null
        const validationError = screen.queryByText(/required/i) !== null

        expect(stillOnJournal || validationError).toBe(true)
      })
    })

    it('should create position successfully after completing journal entry', async () => {
      // Start at root
      window.history.pushState({}, 'Test', '/')
      render(<App />)

      // Navigate to position creation
      await waitFor(() => {
        expect(screen.getByText('Start Your Trading Journey')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /Create Your First Position/i }))

      await waitFor(() => {
        expect(screen.getByText('Position Plan')).toBeInTheDocument()
      })

      // Fill position plan form
      await fillPositionPlanForm()

      // Proceed through all steps WITH journal entry
      fireEvent.click(screen.getByText('Next: Trading Journal'))

      await waitFor(() => {
        expect(screen.getByText('📝 Position Plan')).toBeInTheDocument()
      })

      // COMPLETE journal entry (this is the key difference from the failing test)
      await fillJournalEntry()

      fireEvent.click(screen.getByText('Next: Risk Assessment'))

      await waitFor(() => {
        expect(screen.getByText('Risk Assessment')).toBeInTheDocument()
      }, { timeout: 5000 })

      fireEvent.click(screen.getByText('Next: Confirmation'))

      await waitFor(() => {
        expect(screen.getByText('Confirmation')).toBeInTheDocument()
      })

      // Confirm immutability
      const immutableCheckbox = screen.getByRole('checkbox', {
        name: /I understand this position plan will be immutable after creation/i
      })
      fireEvent.click(immutableCheckbox)

      // Create position WITH journal entry
      const createButton = screen.getByRole('button', { name: /Create Position Plan/i })
      fireEvent.click(createButton)

      // Wait for successful navigation to position detail
      await waitFor(() => {
        expect(screen.getByText('Add Trade')).toBeInTheDocument()
      })

      // Verify position was created
      const positions = await positionService.getAll()
      expect(positions).toHaveLength(1)

      const position = positions[0] as Position
      expect(position.strategy_type).toBe('Short Put')
      expect(position.symbol).toBe('AAPL')
      expect(position.status).toBe('planned')
      expect(position.trades).toHaveLength(0)

      // Verify journal_entry_ids is populated
      expect(position.journal_entry_ids).toHaveLength(1)
      const journalId = position.journal_entry_ids[0]

      // Verify journal entry exists and is linked via position_id
      const journals = await journalService.getByPositionId(position.id)
      expect(journals).toHaveLength(1)
      expect(journals[0].id).toBe(journalId)
      expect(journals[0].position_id).toBe(position.id)
      expect(journals[0].entry_type).toBe('position_plan')
    })

    it('should show clear error message when attempting to create position without journal', async () => {
      // Start at root
      window.history.pushState({}, 'Test', '/')
      render(<App />)

      // Navigate to position creation
      await waitFor(() => {
        expect(screen.getByText('Start Your Trading Journey')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /Create Your First Position/i }))

      await waitFor(() => {
        expect(screen.getByText('Position Plan')).toBeInTheDocument()
      })

      // Fill position plan form
      await fillPositionPlanForm()

      // Proceed through steps WITHOUT journal entry
      fireEvent.click(screen.getByText('Next: Trading Journal'))

      await waitFor(() => {
        expect(screen.getByText('📝 Position Plan')).toBeInTheDocument()
      })

      // Skip journal - go straight to confirmation
      fireEvent.click(screen.getByText('Next: Risk Assessment'))

      await waitFor(() => {
        expect(screen.getByText('Risk Assessment')).toBeInTheDocument()
      }, { timeout: 5000 })

      fireEvent.click(screen.getByText('Next: Confirmation'))

      await waitFor(() => {
        expect(screen.getByText('Confirmation')).toBeInTheDocument()
      })

      // Confirm immutability
      const immutableCheckbox = screen.getByRole('checkbox', {
        name: /I understand this position plan will be immutable after creation/i
      })
      fireEvent.click(immutableCheckbox)

      // Attempt to create position
      const createButton = screen.getByRole('button', { name: /Create Position Plan/i })
      fireEvent.click(createButton)

      // Verify clear error message is shown
      await waitFor(() => {
        // Look for error message mentioning journal requirement
        const errorMessage = screen.queryByText(/journal.*required/i) ||
                            screen.queryByText(/complete.*journal/i) ||
                            screen.queryByText(/journal.*entry/i)

        expect(errorMessage).toBeInTheDocument()
      })
    })
  })
})
