import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from '../App'
import { PositionService } from '@/lib/position'
import { JournalService } from '@/services/JournalService'
import {
  fillPositionForm,
  proceedToRiskAssessment,
  proceedToTradingJournal,
  fillTradingJournal,
  proceedToConfirmation,
  completePositionCreationFlow
} from '@/test/integration-helpers'

describe('Integration: Position Creation Flow', () => {
  let positionService: PositionService
  let journalService: JournalService

  beforeEach(async () => {
    positionService = new PositionService()
    // Clear IndexedDB before each test
    await positionService.clearAll()

    // Initialize JournalService with the same database
    const db = await positionService['getDB']() // Access private method for testing
    journalService = new JournalService(db)
    await journalService.clearAll()
  })

  afterEach(() => {
    // Close database connection to prevent memory leaks
    if (positionService) {
      positionService.close()
    }
  })

  it('should complete full user journey: Empty State → Position Creation → Save to IndexedDB', async () => {
    // Ensure we start at the root route and render the full app
    window.history.pushState({}, 'Test', '/')
    render(<App />)

    // 1. VERIFY: Start at empty state
    await waitFor(() => {
      expect(screen.getByText('Start Your Trading Journey')).toBeInTheDocument()
      expect(screen.getByText(/Track your trades, learn from your decisions/)).toBeInTheDocument()
    }, { timeout: 2000 })

    // 2. ACTION: Click "Create Your First Position" button
    const createButton = screen.getByRole('button', { name: /Create Your First Position/i })
    expect(createButton).toBeVisible()
    fireEvent.click(createButton)

    // 3. VERIFY: Navigate to position creation (Step 1)
    await waitFor(() => {
      expect(screen.getByText('Position Plan')).toBeInTheDocument()
      expect(screen.getByText('Create Position')).toBeInTheDocument() // Header title
    })

    // 4. ACTION: Fill out Step 1 - Position Plan
    await fillPositionForm()

    // 5. ACTION: Proceed to Step 2 - Trading Journal
    await proceedToTradingJournal()

    // 6. ACTION: Fill Trading Journal
    await fillTradingJournal()

    // 7. ACTION: Proceed to Step 3 - Risk Assessment
    await proceedToRiskAssessment()

    // 8. ACTION: Proceed to Step 4 - Confirmation
    await proceedToConfirmation()

    // 9. VERIFY: Immutable confirmation checkbox is required
    const createPositionButton = screen.getByText('Create Position Plan')
    expect(createPositionButton).toBeDisabled()

    // 10. ACTION: Check immutable confirmation checkbox
    const immutableCheckbox = screen.getByRole('checkbox', {
      name: /I understand this position plan will be immutable/i
    })
    expect(immutableCheckbox).toBeVisible()
    fireEvent.click(immutableCheckbox)

    // 11. VERIFY: Create button is now enabled
    expect(createPositionButton).toBeEnabled()

    // 12. ACTION: Create the position
    expect(createPositionButton).toBeVisible()
    fireEvent.click(createPositionButton)

    // 13. VERIFY: Navigate to Position Detail with created position
    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument()
      expect(screen.getByText(/Long Stock/)).toBeInTheDocument()
      expect(screen.getByText('Trade Plan')).toBeInTheDocument()
      expect(screen.getByText('Add Trade')).toBeInTheDocument() // Only one in bottom actions
    }, { timeout: 3000 })

    // 14. INTEGRATION VERIFY: Position was actually saved to IndexedDB
    const savedPositions = await positionService.getAll()
    expect(savedPositions).toHaveLength(1)

    const savedPosition = savedPositions[0]
    expect(savedPosition.symbol).toBe('AAPL')
    expect(savedPosition.strategy_type).toBe('Long Stock')
    expect(savedPosition.target_entry_price).toBe(150)
    expect(savedPosition.target_quantity).toBe(100)
    expect(savedPosition.profit_target).toBe(165)
    expect(savedPosition.stop_loss).toBe(135)
    expect(savedPosition.position_thesis).toBe('Integration test: Bullish on Q4 earnings and iPhone cycle')
    expect(savedPosition.status).toBe('planned')
    expect(savedPosition.created_date).toBeInstanceOf(Date)
    expect(savedPosition.id).toMatch(/^pos-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/) // UUID format

    // 15. INTEGRATION VERIFY: Journal entry was created during position creation
    const journalEntries = await journalService.findByPositionId(savedPosition.id)
    expect(journalEntries).toHaveLength(1)

    const journalEntry = journalEntries[0]
    expect(journalEntry.position_id).toBe(savedPosition.id)
    expect(journalEntry.entry_type).toBe('position_plan')
    expect(journalEntry.fields).toBeDefined()
    expect(journalEntry.fields.length).toBeGreaterThan(0)

    // Verify rationale field exists and contains the expected content from journal form
    const rationaleField = journalEntry.fields.find(field => field.name === 'rationale')
    expect(rationaleField).toBeDefined()
    expect(rationaleField?.response).toBe('Strong technical support at current levels with bullish momentum')

    // Verify journal entry has proper timestamps
    expect(journalEntry.created_at).toBeDefined()
    expect(new Date(journalEntry.created_at)).toBeInstanceOf(Date)

    // 16. INTEGRATION VERIFY: PositionService and JournalService data consistency
    expect(savedPosition.journal_entry_ids).toBeDefined()
    expect(savedPosition.journal_entry_ids).toContain(journalEntry.id)

    // 17. BONUS: Test position retrieval by ID
    const retrievedPosition = await positionService.getById(savedPosition.id)
    expect(retrievedPosition).toEqual(savedPosition)
  })

  it('should handle form validation during complete flow', async () => {
    // Ensure we start at the root route
    window.history.pushState({}, 'Test', '/')
    render(<App />)

    // Navigate to position creation
    await waitFor(() => {
      const createButton = screen.getByRole('button', { name: /Create Your First Position/i })
      expect(createButton).toBeVisible()
      fireEvent.click(createButton)
    })

    await waitFor(() => {
      expect(screen.getByText('Position Plan')).toBeInTheDocument()
    })

    // Try to proceed without filling required fields
    const nextButton = screen.getByText('Next: Trading Journal')
    expect(nextButton).toBeVisible()
    fireEvent.click(nextButton)

    // Verify validation errors appear and we stay on Step 1
    await waitFor(() => {
      expect(screen.getByText(/Symbol is required/i)).toBeInTheDocument()
      expect(screen.getByText(/Target entry price is required/i)).toBeInTheDocument()
      expect(screen.getByText(/Target quantity is required/i)).toBeInTheDocument()
    })

    expect(screen.getByText('Position Plan')).toBeInTheDocument() // Still on step 1

    // Fill in invalid data
    fireEvent.change(screen.getByLabelText(/Target Entry Price/i), { target: { value: '-10' } })
    fireEvent.change(screen.getByLabelText(/Target Quantity/i), { target: { value: '0' } })

    const nextButton2 = screen.getByText('Next: Trading Journal')
    expect(nextButton2).toBeVisible()
    fireEvent.click(nextButton2)

    // Verify specific validation messages
    await waitFor(() => {
      expect(screen.getByText(/Target entry price must be positive/i)).toBeInTheDocument()
      expect(screen.getByText(/Target quantity must be positive/i)).toBeInTheDocument()
    })

    // No positions should be saved due to validation failure
    const savedPositions = await positionService.getAll()
    expect(savedPositions).toHaveLength(0)
  })

  it('should allow navigation back through steps', async () => {
    // Ensure we start at the root route
    window.history.pushState({}, 'Test', '/')
    render(<App />)

    // Navigate to position creation and fill Step 1
    await waitFor(() => {
      const createButton = screen.getByRole('button', { name: /Create Your First Position/i })
      expect(createButton).toBeVisible()
      fireEvent.click(createButton)
    })

    await waitFor(() => {
      expect(screen.getByText('Position Plan')).toBeInTheDocument()
    })

    // Fill valid data
    fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'MSFT' } })
    fireEvent.change(screen.getByLabelText(/Target Entry Price/i), { target: { value: '300' } })
    fireEvent.change(screen.getByLabelText(/Target Quantity/i), { target: { value: '50' } })
    fireEvent.change(screen.getByLabelText(/Profit Target/i), { target: { value: '330' } })
    fireEvent.change(screen.getByLabelText(/Stop Loss/i), { target: { value: '270' } })
    fireEvent.change(screen.getByLabelText(/Position Thesis/i), { target: { value: 'Cloud growth' } })

    // Go to Step 2 (Trading Journal)
    const nextToStep2Button = screen.getByText('Next: Trading Journal')
    expect(nextToStep2Button).toBeVisible()
    fireEvent.click(nextToStep2Button)

    await waitFor(() => {
      expect(screen.getByText('📝 Position Plan')).toBeInTheDocument()
    })

    // Fill journal form quickly
    fireEvent.change(screen.getByLabelText(/Rationale/i), {
      target: { value: 'Cloud growth analysis' }
    })

    // Go to Step 3 (Risk Assessment)
    const nextToStep3Button = screen.getByRole('button', { name: /Next: Risk Assessment/i })
    expect(nextToStep3Button).toBeVisible()
    fireEvent.click(nextToStep3Button)

    await waitFor(() => {
      expect(screen.getByText('Risk Assessment')).toBeInTheDocument()
    })

    // Go to Step 4 (Confirmation)
    const nextToStep4Button = screen.getByText('Next: Confirmation')
    expect(nextToStep4Button).toBeVisible()
    fireEvent.click(nextToStep4Button)

    await waitFor(() => {
      expect(screen.getByText('Confirmation')).toBeInTheDocument()
    })

    // Go back to Step 3 (Risk Assessment)
    const backToStep3Button = screen.getByText('Back to Risk Assessment')
    expect(backToStep3Button).toBeVisible()
    fireEvent.click(backToStep3Button)

    await waitFor(() => {
      expect(screen.getByText('Risk Assessment')).toBeInTheDocument()
    })

    // Go back to Step 2 (Trading Journal)
    const backToStep2Button = screen.getByText('Back to Trading Journal')
    expect(backToStep2Button).toBeVisible()
    fireEvent.click(backToStep2Button)

    await waitFor(() => {
      expect(screen.getByText('📝 Position Plan')).toBeInTheDocument()
    })

    // Go back to Step 1 (using Cancel button in journal form)
    const backToStep1Button = screen.getByText('Cancel')
    expect(backToStep1Button).toBeVisible()
    fireEvent.click(backToStep1Button)

    await waitFor(() => {
      expect(screen.getByText('Position Plan')).toBeInTheDocument()
    })

    // Verify data is preserved
    expect(screen.getByDisplayValue('MSFT')).toBeInTheDocument()
    expect(screen.getByDisplayValue('300')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Cloud growth')).toBeInTheDocument()
  })
})