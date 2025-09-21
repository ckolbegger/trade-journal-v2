import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from '../../App'
import { PositionService } from '@/lib/position'
import { JournalService } from '@/services/JournalService'

describe('Integration: 4-Step Position Creation Flow', () => {
  let positionService: PositionService
  let journalService: JournalService
  let db: IDBDatabase

  beforeEach(async () => {
    // Use the same database name that PositionService uses by default
    const dbName = 'TradingJournalDB'
    db = await openDatabase(dbName)

    positionService = new PositionService()
    journalService = new JournalService(db)

    // Clear all data but keep the schema
    await positionService.clearAll()
    await journalService.clearAll()
  })

  afterEach(() => {
    // Close all database connections to prevent memory leaks
    if (positionService) {
      positionService.close()
    }
    if (journalService) {
      journalService.close()
    }
    if (db) {
      db.close()
    }
  })

  async function openDatabase(dbName: string): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 2)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create positions object store
        if (!db.objectStoreNames.contains('positions')) {
          const store = db.createObjectStore('positions', { keyPath: 'id' })
          store.createIndex('symbol', 'symbol', { unique: false })
          store.createIndex('status', 'status', { unique: false })
          store.createIndex('created_date', 'created_date', { unique: false })
        }

        // Create journal_entries object store
        if (!db.objectStoreNames.contains('journal_entries')) {
          const journalStore = db.createObjectStore('journal_entries', { keyPath: 'id' })
          journalStore.createIndex('position_id', 'position_id', { unique: false })
          journalStore.createIndex('trade_id', 'trade_id', { unique: false })
          journalStore.createIndex('entry_type', 'entry_type', { unique: false })
          journalStore.createIndex('created_at', 'created_at', { unique: false })
        }
      }
    })
  }

  const runInAct = async (callback: () => void) => {
    await new Promise(resolve => {
      callback()
      setTimeout(resolve, 0)
    })
  }

  describe('4-Step Workflow', () => {
    it('should complete 4-step position creation with journal integration', async () => {
      // This will fail until 4-step workflow is implemented
      window.history.pushState({}, 'Test', '/')

      render(<App />)

      // 1. Start at empty state and navigate to position creation
      await waitFor(() => {
        expect(screen.getByText('Start Your Trading Journey')).toBeInTheDocument()
      })

      const createButton = screen.getByRole('button', { name: /Create Your First Position/i })
      expect(createButton).toBeVisible()
      await runInAct(() => {
        fireEvent.click(createButton)
      })

      // 2. STEP 1: Position Plan
      await waitFor(() => {
        expect(screen.getByText('Position Plan')).toBeInTheDocument()
      })

      // Verify step indicators show 4 steps
      const stepDots = screen.getAllByTestId('step-dot')
      expect(stepDots).toHaveLength(4) // Should be 4 instead of 3

      // Fill out position form
      await runInAct(() => {
        fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'AAPL' } })
        fireEvent.change(screen.getByLabelText(/Target Entry Price/i), { target: { value: '150.00' } })
        fireEvent.change(screen.getByLabelText(/Target Quantity/i), { target: { value: '100' } })
        fireEvent.change(screen.getByLabelText(/Profit Target/i), { target: { value: '165.00' } })
        fireEvent.change(screen.getByLabelText(/Stop Loss/i), { target: { value: '135.00' } })
        fireEvent.change(screen.getByLabelText(/Position Thesis/i), {
          target: { value: 'AAPL showing strong technical support levels' }
        })
      })

      // Navigate to Step 2
      const nextToStep2 = screen.getByText('Next: Risk Assessment')
      expect(nextToStep2).toBeVisible()
      await runInAct(() => {
        fireEvent.click(nextToStep2)
      })

      // 3. STEP 2: Risk Assessment
      await waitFor(() => {
        expect(screen.getByText('Risk Assessment')).toBeInTheDocument()
      })

      // Verify risk calculations are displayed
      expect(screen.getByText('$15,000.00')).toBeInTheDocument() // Total investment
      expect(screen.getAllByText('$1,500.00')).toHaveLength(2)   // Max profit and loss

      // Navigate to Step 3
      const nextToStep3 = screen.getByText('Next: Trading Journal')
      expect(nextToStep3).toBeVisible()
      await runInAct(() => {
        fireEvent.click(nextToStep3)
      })

      // 4. STEP 3: Trading Journal (NEW STEP)
      await waitFor(() => {
        expect(screen.getByText('📝 Position Plan')).toBeInTheDocument()
      })

      // Verify enhanced journal form is displayed
      expect(screen.getByLabelText(/Position Thesis/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/How are you feeling about this trade/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Market Conditions/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Execution Strategy/i)).toBeInTheDocument()

      // Fill out journal form
      await runInAct(() => {
        fireEvent.change(screen.getByLabelText(/Position Thesis/i), {
          target: { value: 'Strong technical support at current levels with bullish momentum' }
        })
        fireEvent.change(screen.getByLabelText(/How are you feeling about this trade/i), {
          target: { value: 'Confident' }
        })
        fireEvent.change(screen.getByLabelText(/Market Conditions/i), {
          target: { value: 'Bullish trend with Fed pause expected' }
        })
        fireEvent.change(screen.getByLabelText(/Execution Strategy/i), {
          target: { value: 'Limit order at support level' }
        })
      })

      // Submit journal form
      const submitJournal = screen.getByRole('button', { name: /Next: Confirmation/i })
      expect(submitJournal).toBeVisible()
      await runInAct(() => {
        fireEvent.click(submitJournal)
      })

      // 5. STEP 4: Confirmation
      await waitFor(() => {
        expect(screen.getByText('Confirmation')).toBeInTheDocument()
      })

      // Verify position summary displays
      expect(screen.getByText('AAPL')).toBeInTheDocument()
      expect(screen.getByText('Long Stock')).toBeInTheDocument()
      expect(screen.getByText('$150.00')).toBeInTheDocument()

      // Confirm immutable checkbox is required
      const createPositionButton = screen.getByText('Create Position Plan')
      expect(createPositionButton).toBeDisabled()

      const immutableCheckbox = screen.getByRole('checkbox', {
        name: /I understand this position plan will be immutable/i
      })
      expect(immutableCheckbox).toBeVisible()
      await runInAct(() => {
        fireEvent.click(immutableCheckbox)
      })

      expect(createPositionButton).toBeEnabled()

      // 6. Create position with journal transaction
      await runInAct(() => {
        fireEvent.click(createPositionButton)
      })

      // 7. Verify navigation to position detail
      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument()
        expect(screen.getByText(/Long Stock.*100 shares/)).toBeInTheDocument()
      }, { timeout: 3000 })

      // 8. INTEGRATION VERIFICATION: UUID-based transaction was successful
      const savedPositions = await positionService.getAll()
      expect(savedPositions).toHaveLength(1)

      const savedPosition = savedPositions[0]
      // Verify UUID format
      expect(savedPosition.id).toMatch(/^pos-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/)
      expect(savedPosition.journal_entry_ids).toHaveLength(1)

      // Verify journal entry was created with UUID and proper relationship
      const journalEntries = await journalService.findByPositionId(savedPosition.id)
      expect(journalEntries).toHaveLength(1)

      const journalEntry = journalEntries[0]
      expect(journalEntry.id).toMatch(/^journal-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/)
      expect(journalEntry.position_id).toBe(savedPosition.id)
      expect(journalEntry.entry_type).toBe('position_plan')

      // Verify journal fields contain the data from the enhanced form
      const thesisField = journalEntry.fields.find(f => f.name === 'thesis')
      expect(thesisField?.response).toBe('Strong technical support at current levels with bullish momentum')

      const emotionalField = journalEntry.fields.find(f => f.name === 'emotional_state')
      expect(emotionalField?.response).toBe('Confident')

      const marketField = journalEntry.fields.find(f => f.name === 'market_conditions')
      expect(marketField?.response).toBe('Bullish trend with Fed pause expected')

      const executionField = journalEntry.fields.find(f => f.name === 'execution_strategy')
      expect(executionField?.response).toBe('Limit order at support level')
    })

    it('should handle journal form validation in Step 3', async () => {
      // This will fail until validation is implemented
      window.history.pushState({}, 'Test', '/')
      render(<App />)

      // Navigate through Steps 1 and 2 quickly
      await waitFor(() => {
        expect(screen.getByText('Start Your Trading Journey')).toBeInTheDocument()
      })

      const createButton = screen.getByRole('button', { name: /Create Your First Position/i })
      await runInAct(() => {
        fireEvent.click(createButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Position Plan')).toBeInTheDocument()
      })

      // Fill minimum required fields quickly
      await runInAct(() => {
        fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'TSLA' } })
        fireEvent.change(screen.getByLabelText(/Target Entry Price/i), { target: { value: '200' } })
        fireEvent.change(screen.getByLabelText(/Target Quantity/i), { target: { value: '50' } })
        fireEvent.change(screen.getByLabelText(/Profit Target/i), { target: { value: '220' } })
        fireEvent.change(screen.getByLabelText(/Stop Loss/i), { target: { value: '180' } })
        fireEvent.change(screen.getByLabelText(/Position Thesis/i), { target: { value: 'Test thesis' } })
      })

      await runInAct(() => {
        fireEvent.click(screen.getByText('Next: Risk Assessment'))
      })

      await waitFor(() => {
        expect(screen.getByText('Risk Assessment')).toBeInTheDocument()
      })

      await runInAct(() => {
        fireEvent.click(screen.getByText('Next: Trading Journal'))
      })

      // Now at Step 3: Journal form
      await waitFor(() => {
        expect(screen.getByText('📝 Position Plan')).toBeInTheDocument()
      })

      // Form should be pre-populated with position thesis, so clear it to test validation
      const contentField = screen.getByLabelText(/Position Thesis/i)
      await runInAct(() => {
        fireEvent.change(contentField, { target: { value: '' } })
      })

      // Try to submit without required content
      const submitButton = screen.getByRole('button', { name: /Next: Confirmation/i })
      await runInAct(() => {
        fireEvent.click(submitButton)
      })

      // Should show validation error and stay on Step 3
      await waitFor(() => {
        expect(screen.getByText(/Journal content is required/i)).toBeInTheDocument()
      })

      expect(screen.getByText('📝 Position Plan')).toBeInTheDocument() // Still on Step 3
    })

  })
})