import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from '@/App'
import { PositionService } from '@/lib/position'
import { JournalService } from '@/services/JournalService'
import { ServiceContainer } from '@/services/ServiceContainer'
import 'fake-indexeddb/auto'
import type { Position } from '@/lib/position'

/**
 * Comprehensive integration test suite for creating Short Put position
 *
 * This test suite verifies the complete user journey:
 * - Navigate to position creation, select Short Put strategy
 * - Fill in all required option fields (strike, expiration, premium, targets)
 * - Select price basis options (stock_price or option_price)
 * - Submit form and verify position created with correct strategy_type
 * - Verify position has status='planned'
 * - Verify position has zero trades
 * - Verify position shows in position list with option details
 * - Verify option fields saved correctly (strike, expiration, etc.)
 */

describe('Integration: US1 - Create Short Put Position Plan', () => {
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
   * Helper: Fill the position creation form with Short Put data
   */
  const fillShortPutPositionForm = async (data: {
    symbol?: string
    strikePrice?: string
    expirationDate?: string
    premium?: string
    profitTarget?: string
    profitTargetBasis?: 'stock_price' | 'option_price'
    stopLoss?: string
    stopLossBasis?: 'stock_price' | 'option_price'
    positionThesis?: string
  } = {}) => {
    const {
      symbol = 'AAPL',
      strikePrice = '100',
      expirationDate,
      premium = '3.00',
      profitTarget = '95',
      profitTargetBasis = 'stock_price',
      stopLoss = '110',
      stopLossBasis = 'stock_price',
      positionThesis = 'Bullish on AAPL, selling puts for income'
    } = data

    // Calculate future date (30 days from now)
    const futureDate = expirationDate || (() => {
      const date = new Date()
      date.setDate(date.getDate() + 30)
      return date.toISOString().split('T')[0]
    })()

    // Select Short Put strategy FIRST
    const strategySelect = screen.getByRole('combobox', { name: /Strategy Type/i })
    fireEvent.change(strategySelect, { target: { value: 'Short Put' } })

    // Wait for option fields to appear
    await waitFor(() => {
      expect(screen.getByLabelText(/Strike Price/i)).toBeInTheDocument()
    })

    // Fill common fields
    fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: symbol } })
    fireEvent.change(screen.getByLabelText(/Target Entry Price/i), { target: { value: strikePrice } })
    fireEvent.change(screen.getByLabelText(/Target Quantity/i), { target: { value: '5' } })

    // Fill option-specific fields
    fireEvent.change(screen.getByLabelText(/Strike Price/i), { target: { value: strikePrice } })

    const expirationInput = screen.getByLabelText(/Expiration Date/i)
    fireEvent.change(expirationInput, { target: { value: futureDate } })

    const premiumInput = screen.getByLabelText(/Premium per Contract/i)
    fireEvent.change(premiumInput, { target: { value: premium } })

    // Fill profit and stop loss with basis
    fireEvent.change(screen.getByLabelText(/Profit Target/i), { target: { value: profitTarget } })
    const profitBasisSelect = screen.getByRole('combobox', { name: /Profit Basis/i })
    fireEvent.change(profitBasisSelect, { target: { value: profitTargetBasis } })

    // Use id selector for stop_loss to avoid ambiguity with stop_loss_basis label
    const stopLossInput = document.getElementById('stop_loss') as HTMLInputElement
    expect(stopLossInput).toBeInTheDocument()
    fireEvent.change(stopLossInput, { target: { value: stopLoss } })

    const stopLossBasisSelect = screen.getByRole('combobox', { name: /Stop Loss Basis/i })
    fireEvent.change(stopLossBasisSelect, { target: { value: stopLossBasis } })

    // Fill position thesis
    fireEvent.change(screen.getByLabelText(/Position Thesis/i), { target: { value: positionThesis } })

    // Wait a moment for React state to settle
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  /**
   * Helper: Navigate through all steps to create a position
   */
  const completePositionCreationFlow = async () => {
    // Step 1: Position Plan
    await fillShortPutPositionForm()

    // Proceed to Step 2: Trading Journal
    const nextToJournalButton = screen.getByText('Next: Trading Journal')
    fireEvent.click(nextToJournalButton)

    await waitFor(() => {
      expect(screen.getByText('📝 Position Plan')).toBeInTheDocument()
    })

    // Fill journal entry
    fireEvent.change(screen.getByLabelText(/Rationale/i), {
      target: { value: 'Selling cash-secured puts for income generation' }
    })
    fireEvent.change(screen.getByLabelText(/Emotional State/i), {
      target: { value: 'Confident' }
    })
    fireEvent.change(screen.getByLabelText(/Market Conditions/i), {
      target: { value: 'Bullish trend, strong earnings' }
    })
    fireEvent.change(screen.getByLabelText(/Execution Strategy/i), {
      target: { value: 'Limit orders at mid-point' }
    })

    // Proceed to Step 3: Risk Assessment
    const nextToRiskButton = screen.getByText('Next: Risk Assessment')
    expect(nextToRiskButton).toBeVisible()
    fireEvent.click(nextToRiskButton)

    await waitFor(() => {
      expect(screen.getByText('Risk Assessment')).toBeInTheDocument()
    }, { timeout: 5000 })

    // Proceed to Step 4: Confirmation
    const nextToConfirmButton = screen.getByRole('button', { name: /Next: Confirmation/i })
    fireEvent.click(nextToConfirmButton)

    await waitFor(() => {
      expect(screen.getByText('Confirm Position Plan')).toBeInTheDocument()
    })

    // Confirm immutability
    const immutableCheckbox = screen.getByRole('checkbox', { name: /I understand this position plan cannot be modified/i })
    fireEvent.click(immutableCheckbox)

    // Create position
    const createButton = screen.getByRole('button', { name: /Create Position Plan/i })
    fireEvent.click(createButton)

    // Wait for navigation to dashboard
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })
  }

  describe('Complete Short Put Position Creation Flow', () => {
    it('should create Short Put position with all option fields saved correctly', async () => {
      // Start at root
      window.history.pushState({}, 'Test', '/')
      render(<App />)

      // Navigate to position creation
      await waitFor(() => {
        expect(screen.getByText('Start Your Trading Journey')).toBeInTheDocument()
      })

      const createButton = screen.getByRole('button', { name: /Create Your First Position/i })
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('Position Plan')).toBeInTheDocument()
      })

      // Complete the flow
      await completePositionCreationFlow()

      // Verify position was created with correct fields
      const positions = await positionService.getAllPositions()
      expect(positions).toHaveLength(1)

      const position = positions[0] as Position
      expect(position.strategy_type).toBe('Short Put')
      expect(position.symbol).toBe('AAPL')
      expect(position.status).toBe('planned')
      expect(position.trades).toHaveLength(0)

      // Verify option fields
      expect(position.option_type).toBe('put')
      expect(position.strike_price).toBe(100)
      expect(position.expiration_date).toBeInstanceOf(Date)
      expect(position.premium_per_contract).toBe(3.00)

      // Verify price basis
      expect(position.profit_target_basis).toBe('stock_price')
      expect(position.stop_loss_basis).toBe('stock_price')

      // Verify targets
      expect(position.profit_target).toBe(95)
      expect(position.stop_loss).toBe(110)
    })

    it('should display Short Put position on dashboard with option details', async () => {
      // Start at root
      window.history.pushState({}, 'Test', '/')
      render(<App />)

      // Create position
      await waitFor(() => {
        expect(screen.getByText('Start Your Trading Journey')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /Create Your First Position/i }))

      await waitFor(() => {
        expect(screen.getByText('Position Plan')).toBeInTheDocument()
      })

      await completePositionCreationFlow()

      // Verify position displays on dashboard
      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument()
      })

      // Verify strategy type badge
      expect(screen.getByText('Short Put')).toBeInTheDocument()

      // Verify option details display
      expect(screen.getByText(/\$100/)).toBeInTheDocument() // Strike price

      // Verify status
      expect(screen.getByText('Planned')).toBeInTheDocument()
    })
  })

  describe('Price Basis Selection', () => {
    it('should create position with option_price basis selected', async () => {
      window.history.pushState({}, 'Test', '/')
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('Start Your Trading Journey')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /Create Your First Position/i }))

      await waitFor(() => {
        expect(screen.getByText('Position Plan')).toBeInTheDocument()
      })

      // Fill with option_price basis
      await fillShortPutPositionForm({
        profitTargetBasis: 'option_price',
        stopLossBasis: 'option_price'
      })

      // Proceed through remaining steps
      const nextToJournalButton = screen.getByText('Next: Trading Journal')
      fireEvent.click(nextToJournalButton)

      await waitFor(() => {
        expect(screen.getByText('📝 Position Plan')).toBeInTheDocument()
      })

      // Minimal journal entry
      fireEvent.change(screen.getByLabelText(/Rationale/i), {
        target: { value: 'Test' }
      })

      const nextToRiskButton = screen.getByRole('button', { name: /Next: Risk Assessment/i })
      fireEvent.click(nextToRiskButton)

      await waitFor(() => {
        expect(screen.getByText('Risk Assessment')).toBeInTheDocument()
      })

      const nextToConfirmButton = screen.getByRole('button', { name: /Next: Confirmation/i })
      fireEvent.click(nextToConfirmButton)

      await waitFor(() => {
        expect(screen.getByText('Confirm Position Plan')).toBeInTheDocument()
      })

      const immutableCheckbox = screen.getByRole('checkbox', {
        name: /I understand this position plan cannot be modified/i
      })
      fireEvent.click(immutableCheckbox)

      const createButton = screen.getByRole('button', { name: /Create Position Plan/i })
      fireEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
      })

      // Verify price basis saved correctly
      const positions = await positionService.getAllPositions()
      expect(positions).toHaveLength(1)

      const position = positions[0] as Position
      expect(position.profit_target_basis).toBe('option_price')
      expect(position.stop_loss_basis).toBe('option_price')
    })
  })

  describe('Position Status and Trades', () => {
    it('should create position with planned status and zero trades', async () => {
      window.history.pushState({}, 'Test', '/')
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('Start Your Trading Journey')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /Create Your First Position/i }))

      await waitFor(() => {
        expect(screen.getByText('Position Plan')).toBeInTheDocument()
      })

      await completePositionCreationFlow()

      // Verify planned status
      const positions = await positionService.getAllPositions()
      expect(positions).toHaveLength(1)

      const position = positions[0] as Position
      expect(position.status).toBe('planned')
      expect(position.trades).toHaveLength(0)
    })
  })

  describe('Multiple Price Basis Combinations', () => {
    it('should create position with mixed price basis (profit: stock_price, stop: option_price)', async () => {
      window.history.pushState({}, 'Test', '/')
      render(<App />)

      await waitFor(() => {
        expect(screen.getByText('Start Your Trading Journey')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /Create Your First Position/i }))

      await waitFor(() => {
        expect(screen.getByText('Position Plan')).toBeInTheDocument()
      })

      await fillShortPutPositionForm({
        profitTargetBasis: 'stock_price',
        stopLossBasis: 'option_price'
      })

      // Quick path through remaining steps
      fireEvent.click(screen.getByText('Next: Trading Journal'))
      await waitFor(() => {
        expect(screen.getByText('📝 Position Plan')).toBeInTheDocument()
      })

      fireEvent.change(screen.getByLabelText(/Rationale/i), { target: { value: 'Test' } })

      fireEvent.click(screen.getByRole('button', { name: /Next: Risk Assessment/i }))
      await waitFor(() => {
        expect(screen.getByText('Risk Assessment')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /Next: Confirmation/i }))
      await waitFor(() => {
        expect(screen.getByText('Confirm Position Plan')).toBeInTheDocument()
      })

      const immutableCheckbox = screen.getByRole('checkbox', {
        name: /I understand this position plan cannot be modified/i
      })
      fireEvent.click(immutableCheckbox)

      fireEvent.click(screen.getByRole('button', { name: /Create Position Plan/i }))

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
      })

      // Verify mixed price basis
      const positions = await positionService.getAllPositions()
      const position = positions[0] as Position
      expect(position.profit_target_basis).toBe('stock_price')
      expect(position.stop_loss_basis).toBe('option_price')
    })
  })
})
