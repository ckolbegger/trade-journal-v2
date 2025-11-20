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
      const request = indexedDB.open(dbName, 3)

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

  describe('Simplified Position Creation Flow', () => {
    it('should complete position creation without journal (new user flow)', async () => {
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

      // 2. Position Form is now single-page, no step navigation needed
      await waitFor(() => {
        expect(screen.getByText('Position Plan')).toBeInTheDocument()
      })

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

      // 3. Risk Assessment is now visible on same page (no navigation needed)
      await waitFor(() => {
        expect(screen.getByText('Risk Assessment')).toBeInTheDocument()
      })

      // Verify risk calculations are displayed
      expect(screen.getByText('$15,000.00')).toBeInTheDocument() // Total investment
      expect(screen.getAllByText('$1,500.00')).toHaveLength(2)   // Max profit and loss

      // 4. Confirmation section is also visible on same page
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

      // 6. Create position only (no journal in new flow)
      await runInAct(() => {
        fireEvent.click(createPositionButton)
      })

      // 7. Verify navigation to position detail
      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument()
        expect(screen.getByText(/Long Stock.*100 shares/)).toBeInTheDocument()
      }, { timeout: 3000 })

      // 8. INTEGRATION VERIFICATION: Position creation was successful
      const savedPositions = await positionService.getAll()
      expect(savedPositions).toHaveLength(1)

      const savedPosition = savedPositions[0]
      // Verify position created but NO journal entry in new flow
      expect(savedPosition.id).toMatch(/^position-[0-9]+-[a-z0-9]+$/) // New ID format
      expect(savedPosition.journal_entry_ids).toHaveLength(0) // Empty initially

      // Verify no journal entry was created during position creation
      const journalEntries = await journalService.findByPositionId(savedPosition.id)
      expect(journalEntries).toHaveLength(0) // No journal entries created with position

      // Position data verification (core focus now)
      expect(savedPosition.symbol).toBe('AAPL')
      expect(savedPosition.target_entry_price).toBe(150)
      expect(savedPosition.target_quantity).toBe(100)
      expect(savedPosition.profit_target).toBe(180)
      expect(savedPosition.stop_loss).toBe(135)
      expect(savedPosition.position_thesis).toBe('Strong technical support with bullish momentum indicators')
    })

    it('should handle position validation (removed journal step)', async () => {
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

      // No step navigation needed - everything is on one page in new flow
      await waitFor(() => {
        expect(screen.getByText('Risk Assessment')).toBeInTheDocument() // Risk assessment visible
      })

      // Position validation: Try to create position without confirmation checkbox
      const positionCreateButton = screen.getByText('Create Position Plan')
      expect(positionCreateButton).toBeDisabled() // Should be disabled without checkbox confirmation

      // Should show validation error for missing confirmation
      const confirmationCheckbox = screen.getByRole('checkbox', {
        name: /I understand this position plan will be immutable/i
      })
      expect(confirmationCheckbox).toBeInTheDocument()

      // Test position form validation by clearing required field
      await runInAct(() => {
        fireEvent.change(screen.getByLabelText(/Position Thesis/i), { target: { value: '' } })
      })

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/Position thesis is required/i)).toBeInTheDocument()
      })

      // Fill missing field and complete validation test
      await runInAct(() => {
        fireEvent.change(screen.getByLabelText(/Position Thesis/i), { target: { value: 'Valid thesis for testing' } })
        fireEvent.click(confirmationCheckbox) // Now button should be enabled
      })

      expect(positionCreateButton).toBeEnabled()
    })
  })
})