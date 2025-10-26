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
  completePositionCreationFlow,
  verifyDashboardPosition
} from '@/test/integration-helpers'
import { createIntegrationTestData } from '@/test/data-factories'
import {
  assertEmptyState,
  assertStepVisible,
  assertFabButtonVisible
} from '@/test/assertion-helpers'

describe('Integration: Position Dashboard Display Flow', () => {
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

  it('should complete full user journey: Empty State → Position Creation → Dashboard Display', async () => {
    // 1. VERIFY: Start at empty state with Dashboard routing
    window.history.pushState({}, 'Test', '/')
    render(<App />)

    // Should show EmptyState with "Create Your First Position" button
    await waitFor(() => {
      assertEmptyState()
    }, { timeout: 2000 })

    // 2. ACTION: Click "Create Your First Position" button
    const createButton = screen.getByRole('button', { name: /Create Your First Position/i })
    expect(createButton).toBeVisible()
    fireEvent.click(createButton)

    // 3. VERIFY: Navigate to position creation (Step 1)
    await waitFor(() => {
      assertStepVisible('Position Plan')
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
      expect(screen.getByText('Add Trade')).toBeInTheDocument()
    }, { timeout: 3000 })

    // 14. VERIFY: Position Detail displays correct position information
    // Expand Trade History accordion to see the content
    const tradeHistoryButton = screen.getByText('Trade History').closest('button')
    fireEvent.click(tradeHistoryButton!)

    expect(screen.getByText('No trades executed yet')).toBeInTheDocument()
    expect(screen.getAllByText('$135.00')).toHaveLength(2) // Stop Loss appears in performance section and trade plan
    expect(screen.getByText('Integration test: Bullish on Q4 earnings and iPhone cycle')).toBeInTheDocument() // Position thesis appears in Trade Plan

    // Expand Journal Entries accordion to see the content
    const journalEntriesButton = screen.getByText('Journal Entries').closest('button')
    fireEvent.click(journalEntriesButton!)

    expect(screen.getByText('Strong technical support at current levels with bullish momentum')).toBeInTheDocument() // Journal entry content appears in Journal Entries

    // 15. VERIFY: Add Trade button is present
    expect(screen.getByText('Add Trade')).toBeInTheDocument()
    // Close Position button has been removed - positions are closed via Add Trade flow
    expect(screen.queryByText('Close Position')).not.toBeInTheDocument()

    // 16. INTEGRATION VERIFY: Position was actually saved to IndexedDB
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

    // 17. INTEGRATION VERIFY: Journal entry was created and linked properly
    const journalEntries = await journalService.findByPositionId(savedPosition.id)
    expect(journalEntries).toHaveLength(1)

    const journalEntry = journalEntries[0]
    expect(journalEntry.position_id).toBe(savedPosition.id)
    expect(journalEntry.entry_type).toBe('position_plan')

    // Verify journal content matches what was entered in the journal form
    const rationaleField = journalEntry.fields.find(field => field.name === 'rationale')
    expect(rationaleField?.response).toBe('Strong technical support at current levels with bullish momentum')

    // 18. INTEGRATION VERIFY: Database schema consistency
    expect(savedPosition.journal_entry_ids).toBeDefined()
    expect(savedPosition.journal_entry_ids).toContain(journalEntry.id)

    // 19. BONUS: Test position retrieval by ID
    const retrievedPosition = await positionService.getById(savedPosition.id)
    expect(retrievedPosition).toEqual(savedPosition)
  })

  it('should show Dashboard with multiple positions', async () => {
    // Create two positions using data factory
    const testData = createIntegrationTestData()
    await positionService.create(testData.multiple[0])
    await positionService.create(testData.multiple[1])

    // Navigate to home
    window.history.pushState({}, 'Test', '/')
    render(<App />)

    // Should show Dashboard with both positions
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Positions' })).toBeInTheDocument()
      expect(screen.getByText('AAPL')).toBeInTheDocument()
      expect(screen.getByText('MSFT')).toBeInTheDocument()
    }, { timeout: 2000 })

    // Verify both positions are displayed with correct data
    expect(screen.getAllByText('Long Stock')).toHaveLength(2)
    expect(screen.getAllByText('planned')).toHaveLength(2) // Status text for planned positions
    expect(screen.getByText('$135.00')).toBeInTheDocument() // AAPL stop loss
    expect(screen.getByText('$270.00')).toBeInTheDocument() // MSFT stop loss
    // The new component shows actual calculated values instead of TODO placeholders
    expect(screen.getAllByText('No trades')).toHaveLength(2) // 2 positions × "No trades" status each
  })

  it('should handle Dashboard navigation and maintain position data', async () => {
    // Create a position using data factory
    const testData = createIntegrationTestData()
    await positionService.create(testData.navigation)

    // Navigate to home
    window.history.pushState({}, 'Test', '/')
    render(<App />)

    // Verify Dashboard shows the position
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Positions' })).toBeInTheDocument()
      expect(screen.getByText('TSLA')).toBeInTheDocument()
    })

    // Navigate to position creation using floating action button
    const fabButtons = screen.getAllByRole('link', { name: '' })
    const fabButton = fabButtons.find(button => button.classList.contains('fixed'))
    expect(fabButton).toBeVisible()
    fireEvent.click(fabButton)

    // Verify position creation page loads
    await waitFor(() => {
      expect(screen.getByText('Position Plan')).toBeInTheDocument()
    })

    // Navigate back using browser back button (simulates user behavior)
    window.history.back()

    // Should still show the Dashboard with the same position
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Positions' })).toBeInTheDocument()
      expect(screen.getByText('TSLA')).toBeInTheDocument()
    })
  })

  describe('Database Schema Integration', () => {
    it('should verify JournalService database schema is properly set up', async () => {
      // Verify database connection and object stores exist
      const db = await positionService['getDB']() // Access private method for testing

      expect(db.objectStoreNames.contains('positions')).toBe(true)
      expect(db.objectStoreNames.contains('journal_entries')).toBe(true)

      // Test transaction creation for both stores
      const transaction = db.transaction(['positions', 'journal_entries'], 'readonly')
      const positionStore = transaction.objectStore('positions')
      const journalStore = transaction.objectStore('journal_entries')

      expect(positionStore).toBeDefined()
      expect(journalStore).toBeDefined()

      // Verify journal store indexes
      expect(journalStore.indexNames.contains('position_id')).toBe(true)
      expect(journalStore.indexNames.contains('trade_id')).toBe(true)
      expect(journalStore.indexNames.contains('entry_type')).toBe(true)
      expect(journalStore.indexNames.contains('created_at')).toBe(true)
    })

    it('should verify data consistency between PositionService and JournalService', async () => {
      // Create test data using services directly
      const testPosition = {
        id: 'test-pos-123',
        symbol: 'TEST',
        strategy_type: 'Long Stock' as const,
        target_entry_price: 100,
        target_quantity: 50,
        profit_target: 110,
        stop_loss: 90,
        position_thesis: 'Test integration thesis',
        created_date: new Date(),
        status: 'planned' as const,
        journal_entry_ids: [] as string[]
      }

      // Create position first
      await positionService.create(testPosition)

      // Create journal entry linked to position
      const journalEntry = await journalService.create({
        position_id: testPosition.id,
        entry_type: 'position_plan',
        fields: [
          { name: 'thesis', prompt: 'Why?', response: 'Test integration thesis' },
          { name: 'emotional_state', prompt: 'How do you feel?', response: 'confident' }
        ]
      })

      // Verify bidirectional consistency
      const retrievedPosition = await positionService.getById(testPosition.id)
      const retrievedJournalEntries = await journalService.findByPositionId(testPosition.id)

      expect(retrievedPosition).toBeDefined()
      expect(retrievedJournalEntries).toHaveLength(1)
      expect(retrievedJournalEntries[0].id).toBe(journalEntry.id)
      expect(retrievedJournalEntries[0].position_id).toBe(testPosition.id)

      // Verify cross-service data integrity
      const allPositions = await positionService.getAll()
      const allJournalEntries = await journalService.getAll()

      expect(allPositions).toHaveLength(1)
      expect(allJournalEntries).toHaveLength(1)
      expect(allJournalEntries[0].position_id).toBe(allPositions[0].id)
    })

    it('should handle concurrent operations between services', async () => {
      // Test concurrent creation and deletion operations
      const position1 = {
        id: 'concurrent-pos-1',
        symbol: 'CONC1',
        strategy_type: 'Long Stock' as const,
        target_entry_price: 100,
        target_quantity: 50,
        profit_target: 110,
        stop_loss: 90,
        position_thesis: 'Concurrent test 1',
        created_date: new Date(),
        status: 'planned' as const,
        journal_entry_ids: [] as string[]
      }

      const position2 = {
        id: 'concurrent-pos-2',
        symbol: 'CONC2',
        strategy_type: 'Long Stock' as const,
        target_entry_price: 200,
        target_quantity: 25,
        profit_target: 220,
        stop_loss: 180,
        position_thesis: 'Concurrent test 2',
        created_date: new Date(),
        status: 'planned' as const,
        journal_entry_ids: [] as string[]
      }

      // Create positions and journal entries concurrently
      await Promise.all([
        positionService.create(position1),
        positionService.create(position2),
        journalService.create({
          position_id: position1.id,
          entry_type: 'position_plan',
          fields: [{ name: 'thesis', prompt: 'Why?', response: 'Concurrent thesis 1' }]
        }),
        journalService.create({
          position_id: position2.id,
          entry_type: 'position_plan',
          fields: [{ name: 'thesis', prompt: 'Why?', response: 'Concurrent thesis 2' }]
        })
      ])

      // Verify all data was created correctly
      const allPositions = await positionService.getAll()
      const allJournalEntries = await journalService.getAll()

      expect(allPositions).toHaveLength(2)
      expect(allJournalEntries).toHaveLength(2)

      // Verify each position has its corresponding journal entry
      for (const position of allPositions) {
        const positionJournalEntries = await journalService.findByPositionId(position.id)
        expect(positionJournalEntries).toHaveLength(1)
        expect(positionJournalEntries[0].position_id).toBe(position.id)
      }
    })
  })
})