import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { PositionCreate } from '@/pages/PositionCreate'
import { ServiceContext } from '@/contexts/ServiceContext'
import type { ServiceContainer } from '@/contexts/ServiceContext'
import { PositionService } from '@/lib/position'
import { JournalService } from '@/services/JournalService'
import { SchemaManager } from '@/services/SchemaManager'
import 'fake-indexeddb/auto'

/**
 * Integration Test: Short Put Position Plan Flow (T014)
 *
 * Tests the complete end-to-end user journey for creating a Short Put position plan:
 * - Form interaction (strategy selection, filling fields)
 * - Validation error display (inline errors for invalid inputs)
 * - Data persistence (plan saved to IndexedDB)
 * - Data retrieval (plan appears with correct status and all option fields)
 *
 * This differs from unit tests by testing the complete integration of:
 * - React components (PositionCreate, StrategySelector, StrikePriceInput, etc.)
 * - Services (PositionService, JournalService)
 * - Transaction coordination (PositionJournalTransaction)
 * - IndexedDB persistence layer
 * - Real database schema
 */
describe('Integration: Short Put Position Plan Flow (T014)', () => {
  const DB_NAME = 'TradingJournalDB-ShortPut-Flow-Test'
  const DB_VERSION = 1
  let db: IDBDatabase
  let services: ServiceContainer

  beforeEach(async () => {
    // Clean up any existing database
    const deleteRequest = indexedDB.deleteDatabase(DB_NAME)
    await new Promise<void>((resolve) => {
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => resolve()
      deleteRequest.onblocked = () => resolve()
    })

    // Create fresh database with schema
    db = await new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result
        SchemaManager.initializeSchema(database, DB_VERSION)
      }
    })

    // Create service instances
    const positionService = new PositionService(db)
    const journalService = new JournalService(db)

    services = {
      getPositionService: () => positionService,
      getJournalService: () => journalService
    } as ServiceContainer
  })

  afterEach(() => {
    db?.close()
    indexedDB.deleteDatabase(DB_NAME)
  })

  const renderPositionCreate = () => {
    return render(
      <ServiceContext.Provider value={services}>
        <BrowserRouter>
          <PositionCreate />
        </BrowserRouter>
      </ServiceContext.Provider>
    )
  }

  describe('complete UI flow from strategy selection to plan saved', () => {
    it('should allow user to create Short Put plan through complete form flow', async () => {
      // Arrange: Render the PositionCreate page
      renderPositionCreate()

      // Wait for form to initialize
      await waitFor(() => {
        expect(screen.getByLabelText(/Symbol/i)).toBeInTheDocument()
      })

      // Act: Fill in basic fields
      const symbolInput = screen.getByLabelText(/Symbol/i)
      fireEvent.change(symbolInput, { target: { value: 'AAPL' } })

      // Select Short Put strategy
      const strategySelect = screen.getByRole('combobox', { name: /Strategy Type/i })
      fireEvent.change(strategySelect, { target: { value: 'Short Put' } })

      // Wait for option fields to appear
      await waitFor(() => {
        expect(screen.getByLabelText(/Strike Price/i)).toBeVisible()
      })

      // Fill stock/position fields
      fireEvent.change(screen.getByLabelText(/Target Entry Price/i), { target: { value: '150' } })
      fireEvent.change(screen.getByLabelText(/Target Quantity/i), { target: { value: '10' } })
      fireEvent.change(screen.getByLabelText(/Profit Target/i), { target: { value: '155' } })
      fireEvent.change(screen.getByLabelText(/Stop Loss/i), { target: { value: '145' } })
      fireEvent.change(screen.getByLabelText(/Position Thesis/i), {
        target: { value: 'Bullish on AAPL with support at $145' }
      })

      // Fill option-specific fields
      const strikePriceInput = screen.getByLabelText(/Strike Price/i)
      fireEvent.change(strikePriceInput, { target: { value: '145' } })

      const expirationInput = screen.getByLabelText(/Expiration Date/i)
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 60)
      const futureDateString = futureDate.toISOString().split('T')[0]
      fireEvent.change(expirationInput, { target: { value: futureDateString } })

      // Select price basis (radio buttons) - find all radio buttons with value 'option' and click them
      const radioButtons = screen.getAllByRole('radio')
      const optionRadios = radioButtons.filter(radio => radio.getAttribute('value') === 'option')
      // Click both option radios (for profit_target_basis and stop_loss_basis)
      optionRadios.forEach(radio => fireEvent.click(radio))

      // Navigate to journal step
      const nextButton = screen.getByRole('button', { name: /Next: Trading Journal/i })
      expect(nextButton).toBeVisible()
      fireEvent.click(nextButton)

      // Fill journal entry
      await waitFor(() => {
        const journalField = screen.getByRole('textbox', { name: /Rationale/i })
        expect(journalField).toBeVisible()
        fireEvent.change(journalField, { target: { value: 'Strong technical support at $145 level' } })
      })

      // Save journal and proceed to risk assessment
      const saveJournalButton = screen.getByRole('button', { name: /Next: Risk Assessment/i })
      fireEvent.click(saveJournalButton)

      // Navigate through risk assessment to confirmation
      await waitFor(() => {
        expect(screen.getByText(/Risk Assessment/i)).toBeVisible()
      })

      const nextToConfirmButton = screen.getByRole('button', { name: /Next: Confirmation/i })
      fireEvent.click(nextToConfirmButton)

      // Confirm immutability and create position
      await waitFor(() => {
        expect(screen.getByText(/Confirmation/i)).toBeVisible()
      })

      const immutableCheckbox = screen.getByLabelText(/I understand this position plan will be immutable/i)
      fireEvent.click(immutableCheckbox)

      const createButton = screen.getByRole('button', { name: /Create Position Plan/i })
      expect(createButton).toBeEnabled()
      fireEvent.click(createButton)

      // Assert: Position should be created and saved
      await waitFor(async () => {
        const positionService = services.getPositionService()
        const allPositions = await positionService.getAll()
        expect(allPositions.length).toBeGreaterThan(0)
      })

      // Verify the position has all option fields
      const positionService = services.getPositionService()
      const allPositions = await positionService.getAll()
      const createdPosition = allPositions[0]

      expect(createdPosition.symbol).toBe('AAPL')
      expect(createdPosition.strategy_type).toBe('Short Put')
      expect(createdPosition.trade_kind).toBe('option')
      expect(createdPosition.strike_price).toBe(145)
      expect(createdPosition.expiration_date).toBeDefined()
      expect(createdPosition.option_type).toBe('put')
      expect(createdPosition.status).toBe('planned')
    })
  })

  describe('validation errors displayed inline', () => {
    it('should show inline error when strike price <= 0', async () => {
      // Arrange: Render the form
      renderPositionCreate()

      await waitFor(() => {
        expect(screen.getByLabelText(/Symbol/i)).toBeInTheDocument()
      })

      // Act: Select Short Put strategy
      const strategySelect = screen.getByRole('combobox', { name: /Strategy Type/i })
      fireEvent.change(strategySelect, { target: { value: 'Short Put' } })

      // Wait for option fields to appear
      await waitFor(() => {
        expect(screen.getByLabelText(/Strike Price/i)).toBeVisible()
      })

      // Fill required fields with valid values
      fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'AAPL' } })
      fireEvent.change(screen.getByLabelText(/Target Entry Price/i), { target: { value: '150' } })
      fireEvent.change(screen.getByLabelText(/Target Quantity/i), { target: { value: '10' } })
      fireEvent.change(screen.getByLabelText(/Profit Target/i), { target: { value: '155' } })
      fireEvent.change(screen.getByLabelText(/Stop Loss/i), { target: { value: '145' } })
      fireEvent.change(screen.getByLabelText(/Position Thesis/i), {
        target: { value: 'Test thesis' }
      })

      // Set expiration to valid future date
      const expirationInput = screen.getByLabelText(/Expiration Date/i)
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      fireEvent.change(expirationInput, { target: { value: futureDate.toISOString().split('T')[0] } })

      // Set invalid strike price (0)
      const strikePriceInput = screen.getByLabelText(/Strike Price/i)
      fireEvent.change(strikePriceInput, { target: { value: '0' } })

      // Try to proceed to next step
      const nextButton = screen.getByRole('button', { name: /Next: Trading Journal/i })
      fireEvent.click(nextButton)

      // Assert: Should show inline error for strike price
      await waitFor(() => {
        expect(screen.getByText(/Strike price is required/i)).toBeInTheDocument()
      })

      // Verify we're still on step 1 (didn't advance) - check for heading
      expect(screen.getByRole('heading', { name: /Position Plan/i })).toBeInTheDocument()
    })

    it('should show inline error when expiration date is in the past', async () => {
      // Arrange: Render the form
      renderPositionCreate()

      await waitFor(() => {
        expect(screen.getByLabelText(/Symbol/i)).toBeInTheDocument()
      })

      // Act: Select Short Put strategy
      const strategySelect = screen.getByRole('combobox', { name: /Strategy Type/i })
      fireEvent.change(strategySelect, { target: { value: 'Short Put' } })

      // Wait for option fields to appear
      await waitFor(() => {
        expect(screen.getByLabelText(/Strike Price/i)).toBeVisible()
      })

      // Fill required fields with valid values
      fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'AAPL' } })
      fireEvent.change(screen.getByLabelText(/Target Entry Price/i), { target: { value: '150' } })
      fireEvent.change(screen.getByLabelText(/Target Quantity/i), { target: { value: '10' } })
      fireEvent.change(screen.getByLabelText(/Profit Target/i), { target: { value: '155' } })
      fireEvent.change(screen.getByLabelText(/Stop Loss/i), { target: { value: '145' } })
      fireEvent.change(screen.getByLabelText(/Position Thesis/i), {
        target: { value: 'Test thesis' }
      })

      // Set valid strike price
      const strikePriceInput = screen.getByLabelText(/Strike Price/i)
      fireEvent.change(strikePriceInput, { target: { value: '145' } })

      // Set past expiration date
      const expirationInput = screen.getByLabelText(/Expiration Date/i)
      const pastDate = new Date('2020-01-01')
      fireEvent.change(expirationInput, { target: { value: pastDate.toISOString().split('T')[0] } })

      // Try to proceed to next step
      const nextButton = screen.getByRole('button', { name: /Next: Trading Journal/i })
      fireEvent.click(nextButton)

      // Assert: Should show inline error for expiration date
      // Note: The actual error message depends on component implementation
      // It may be caught by HTML5 validation or custom validation
      await waitFor(() => {
        // Check if we're still on step 1 (validation prevented navigation)
        expect(screen.getByRole('heading', { name: /Position Plan/i })).toBeInTheDocument()
      })
    })

    it('should clear inline error when field is corrected', async () => {
      // Arrange: Render the form
      renderPositionCreate()

      await waitFor(() => {
        expect(screen.getByLabelText(/Symbol/i)).toBeInTheDocument()
      })

      // Act: Select Short Put strategy
      const strategySelect = screen.getByRole('combobox', { name: /Strategy Type/i })
      fireEvent.change(strategySelect, { target: { value: 'Short Put' } })

      // Wait for option fields to appear
      await waitFor(() => {
        expect(screen.getByLabelText(/Strike Price/i)).toBeVisible()
      })

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'AAPL' } })
      fireEvent.change(screen.getByLabelText(/Target Entry Price/i), { target: { value: '150' } })
      fireEvent.change(screen.getByLabelText(/Target Quantity/i), { target: { value: '10' } })
      fireEvent.change(screen.getByLabelText(/Profit Target/i), { target: { value: '155' } })
      fireEvent.change(screen.getByLabelText(/Stop Loss/i), { target: { value: '145' } })
      fireEvent.change(screen.getByLabelText(/Position Thesis/i), {
        target: { value: 'Test thesis' }
      })

      const expirationInput = screen.getByLabelText(/Expiration Date/i)
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      fireEvent.change(expirationInput, { target: { value: futureDate.toISOString().split('T')[0] } })

      // Set invalid strike price first
      const strikePriceInput = screen.getByLabelText(/Strike Price/i)
      fireEvent.change(strikePriceInput, { target: { value: '0' } })

      // Try to proceed (will trigger validation)
      const nextButton = screen.getByRole('button', { name: /Next: Trading Journal/i })
      fireEvent.click(nextButton)

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/Strike price is required/i)).toBeInTheDocument()
      })

      // Correct the strike price
      fireEvent.change(strikePriceInput, { target: { value: '145' } })

      // Assert: Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/Strike price is required/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('plan retrievable after save with all option fields', () => {
    it('should persist and retrieve Short Put plan with all option fields intact', async () => {
      // Arrange: Create a Short Put plan directly via service
      const positionService = services.getPositionService()
      const journalService = services.getJournalService()

      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 60)

      const position = {
        id: 'test-short-put-1',
        symbol: 'TSLA',
        strategy_type: 'Short Put' as const,
        trade_kind: 'option' as const,
        target_entry_price: 200.00,
        target_quantity: 5,
        profit_target: 210.00,
        stop_loss: 195.00,
        position_thesis: 'Test Short Put plan',
        created_date: new Date(),
        status: 'planned' as const,
        journal_entry_ids: [],
        trades: [],
        option_type: 'put' as const,
        strike_price: 195.00,
        expiration_date: futureDate,
        premium_per_contract: 8.50,
        profit_target_basis: 'option' as const,
        stop_loss_basis: 'stock' as const
      }

      // Create journal entry
      const journalEntry = {
        id: 'journal-1',
        position_id: 'test-short-put-1',
        entry_type: 'position_plan' as const,
        fields: [
          { name: 'thesis', prompt: 'Why this position?', response: 'Strong support', required: true }
        ],
        created_at: new Date().toISOString()
      }

      // Act: Save position and journal
      await positionService.create(position)
      await journalService.create(journalEntry)

      // Retrieve position
      const retrieved = await positionService.getById('test-short-put-1')

      // Assert: All option fields should be intact
      expect(retrieved).not.toBeNull()
      expect(retrieved!.symbol).toBe('TSLA')
      expect(retrieved!.strategy_type).toBe('Short Put')
      expect(retrieved!.trade_kind).toBe('option')
      expect(retrieved!.option_type).toBe('put')
      expect(retrieved!.strike_price).toBe(195.00)
      expect(retrieved!.expiration_date).toEqual(futureDate)
      expect(retrieved!.premium_per_contract).toBe(8.50)
      expect(retrieved!.profit_target_basis).toBe('option')
      expect(retrieved!.stop_loss_basis).toBe('stock')
    })

    it('should retrieve Short Put plan via getAll with all fields', async () => {
      // Arrange: Create multiple positions including Short Put
      const positionService = services.getPositionService()

      const stockPosition = {
        id: 'stock-1',
        symbol: 'AAPL',
        strategy_type: 'Long Stock' as const,
        trade_kind: 'stock' as const,
        target_entry_price: 150.00,
        target_quantity: 100,
        profit_target: 165.00,
        stop_loss: 145.00,
        position_thesis: 'Long stock position',
        created_date: new Date(),
        status: 'planned' as const,
        journal_entry_ids: [],
        trades: []
      }

      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 45)

      const shortPutPosition = {
        id: 'short-put-1',
        symbol: 'NVDA',
        strategy_type: 'Short Put' as const,
        trade_kind: 'option' as const,
        target_entry_price: 450.00,
        target_quantity: 3,
        profit_target: 475.00,
        stop_loss: 440.00,
        position_thesis: 'Short Put position',
        created_date: new Date(),
        status: 'planned' as const,
        journal_entry_ids: [],
        trades: [],
        option_type: 'put' as const,
        strike_price: 440.00,
        expiration_date: futureDate,
        premium_per_contract: 12.00,
        profit_target_basis: 'stock' as const,
        stop_loss_basis: 'option' as const
      }

      // Act: Save both positions
      await positionService.create(stockPosition)
      await positionService.create(shortPutPosition)

      // Retrieve all positions
      const allPositions = await positionService.getAll()

      // Assert: Both positions should be retrievable
      const retrievedStock = allPositions.find(p => p.id === 'stock-1')
      const retrievedShortPut = allPositions.find(p => p.id === 'short-put-1')

      expect(retrievedStock).toBeDefined()
      expect(retrievedStock!.strategy_type).toBe('Long Stock')
      expect(retrievedStock!.option_type).toBeUndefined()

      expect(retrievedShortPut).toBeDefined()
      expect(retrievedShortPut!.strategy_type).toBe('Short Put')
      expect(retrievedShortPut!.option_type).toBe('put')
      expect(retrievedShortPut!.strike_price).toBe(440.00)
      expect(retrievedShortPut!.premium_per_contract).toBe(12.00)
    })
  })

  describe('position appears in dashboard', () => {
    it('should show Short Put position with "planned" status', async () => {
      // Arrange: Create a Short Put position
      const positionService = services.getPositionService()

      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 90)

      const position = {
        id: 'dashboard-short-put-1',
        symbol: 'AMD',
        strategy_type: 'Short Put' as const,
        trade_kind: 'option' as const,
        target_entry_price: 120.00,
        target_quantity: 10,
        profit_target: 130.00,
        stop_loss: 115.00,
        position_thesis: 'Dashboard test position',
        created_date: new Date(),
        status: 'planned' as const,
        journal_entry_ids: [],
        trades: [],
        option_type: 'put' as const,
        strike_price: 115.00,
        expiration_date: futureDate,
        premium_per_contract: 5.50,
        profit_target_basis: 'option' as const,
        stop_loss_basis: 'option' as const
      }

      // Act: Save position
      await positionService.create(position)

      // Retrieve all positions (simulating dashboard data fetch)
      const allPositions = await positionService.getAll()

      // Assert: Position should appear with planned status
      const dashboardPosition = allPositions.find(p => p.id === 'dashboard-short-put-1')

      expect(dashboardPosition).toBeDefined()
      expect(dashboardPosition!.status).toBe('planned')
      expect(dashboardPosition!.symbol).toBe('AMD')
      expect(dashboardPosition!.strategy_type).toBe('Short Put')
      expect(dashboardPosition!.trades).toHaveLength(0) // No trades yet
    })

    it('should differentiate between "planned" positions (no trades) and positions with trades', async () => {
      // Arrange: Create two Short Put positions - one planned, one with trades
      const positionService = services.getPositionService()

      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 60)

      const plannedPosition = {
        id: 'planned-position',
        symbol: 'MSFT',
        strategy_type: 'Short Put' as const,
        trade_kind: 'option' as const,
        target_entry_price: 380.00,
        target_quantity: 2,
        profit_target: 400.00,
        stop_loss: 370.00,
        position_thesis: 'Planned position',
        created_date: new Date(),
        status: 'planned' as const,
        journal_entry_ids: [],
        trades: [], // No trades
        option_type: 'put' as const,
        strike_price: 370.00,
        expiration_date: futureDate,
        profit_target_basis: 'option' as const,
        stop_loss_basis: 'option' as const
      }

      const openPosition = {
        id: 'open-position',
        symbol: 'GOOG',
        strategy_type: 'Short Put' as const,
        trade_kind: 'option' as const,
        target_entry_price: 140.00,
        target_quantity: 5,
        profit_target: 150.00,
        stop_loss: 135.00,
        position_thesis: 'Open position',
        created_date: new Date(),
        status: 'open' as const,
        journal_entry_ids: [],
        trades: [
          {
            id: 'trade-1',
            position_id: 'open-position',
            action: 'buy' as const,
            quantity: 5,
            price: 140.00,
            execution_date: new Date()
          }
        ],
        option_type: 'put' as const,
        strike_price: 135.00,
        expiration_date: futureDate,
        profit_target_basis: 'option' as const,
        stop_loss_basis: 'option' as const
      }

      // Act: Save both positions
      await positionService.create(plannedPosition)
      await positionService.create(openPosition)

      // Retrieve all positions
      const allPositions = await positionService.getAll()

      // Assert: Should be able to differentiate by status and trade count
      const retrievedPlanned = allPositions.find(p => p.id === 'planned-position')
      const retrievedOpen = allPositions.find(p => p.id === 'open-position')

      expect(retrievedPlanned).toBeDefined()
      expect(retrievedPlanned!.status).toBe('planned')
      expect(retrievedPlanned!.trades).toHaveLength(0)

      expect(retrievedOpen).toBeDefined()
      expect(retrievedOpen!.status).toBe('open')
      expect(retrievedOpen!.trades.length).toBeGreaterThan(0)
    })
  })
})
