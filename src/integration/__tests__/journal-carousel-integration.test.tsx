import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PositionDetail } from '@/pages/PositionDetail'
import { PositionService } from '@/lib/position'
import type { Position } from '@/lib/position'
import { JournalService } from '@/services/JournalService'
import type { JournalEntry } from '@/types/journal'
import { TradeService } from '@/services/TradeService'

describe('Journal Carousel Integration', () => {
  let db: IDBDatabase
  let positionService: PositionService
  let journalService: JournalService
  let tradeService: TradeService

  const mockPosition: Position = {
    id: 'pos-123',
    symbol: 'AAPL',
    strategy_type: 'Long Stock',
    target_entry_price: 150.0,
    target_quantity: 100,
    profit_target: 165.0,
    stop_loss: 145.0,
    position_thesis: 'Strong technical setup',
    created_date: new Date('2025-10-01'),
    status: 'open',
    journal_entry_ids: ['journal-1'],
    trades: [
      {
        id: 'trade-1',
        position_id: 'pos-123',
        trade_type: 'buy',
        quantity: 100,
        price: 150.0,
        timestamp: new Date('2025-10-05T10:00:00Z'),
        notes: 'Opening trade'
      }
    ]
  }

  beforeEach(async () => {
    // Open database
    db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('TradingJournalDB', 2)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        if (!db.objectStoreNames.contains('positions')) {
          const positionStore = db.createObjectStore('positions', { keyPath: 'id' })
          positionStore.createIndex('symbol', 'symbol', { unique: false })
          positionStore.createIndex('status', 'status', { unique: false })
          positionStore.createIndex('created_date', 'created_date', { unique: false })
        }

        if (!db.objectStoreNames.contains('journal_entries')) {
          const journalStore = db.createObjectStore('journal_entries', { keyPath: 'id' })
          journalStore.createIndex('position_id', 'position_id', { unique: false })
          journalStore.createIndex('trade_id', 'trade_id', { unique: false })
          journalStore.createIndex('entry_type', 'entry_type', { unique: false })
          journalStore.createIndex('created_at', 'created_at', { unique: false })
        }
      }
    })

    positionService = new PositionService()
    journalService = new JournalService(db)
    tradeService = new TradeService(positionService)

    // Clear data
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['positions', 'journal_entries'], 'readwrite')
      transaction.objectStore('positions').clear()
      transaction.objectStore('journal_entries').clear()
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  })

  afterEach(() => {
    if (db) {
      db.close()
    }
  })

  // Helper function to render PositionDetail with proper routing
  const renderPositionDetail = () => {
    return render(
      <MemoryRouter initialEntries={[`/position/${mockPosition.id}`]}>
        <Routes>
          <Route
            path="/position/:id"
            element={
              <PositionDetail
                positionService={positionService}
                tradeService={tradeService}
                journalService={journalService}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    )
  }

  describe('Journal Carousel Display', () => {
    it('[Integration] should display journal entries in a carousel when accordion is opened', async () => {
      // Create test position
      await positionService.create(mockPosition)
      
      // Create test journal entries
      const journalEntries: JournalEntry[] = [
        {
          id: 'journal-1',
          position_id: 'pos-123',
          entry_type: 'position_plan',
          fields: [
            {
              name: 'rationale',
              prompt: 'Why this trade? Why now?',
              response: 'Test rationale for first entry',
              required: true
            }
          ],
          created_at: '2025-10-02T10:00:00Z'
        },
        {
          id: 'journal-2',
          position_id: 'pos-123',
          entry_type: 'trade_execution',
          fields: [
            {
              name: 'execution_notes',
              prompt: 'Describe the execution',
              response: 'Test execution notes',
              required: false
            }
          ],
          created_at: '2025-10-05T11:00:00Z'
        }
      ]
      
      // Add journal entries to DB
      for (const entry of journalEntries) {
        await journalService.create(entry)
      }

      renderPositionDetail()

      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument()
      })

      // Open the journal entries accordion
      const journalAccordionButton = screen.getByText(/journal entries/i).closest('button')
      expect(journalAccordionButton).toBeInTheDocument()
      fireEvent.click(journalAccordionButton!)

      // Should display the carousel with navigation controls
      await waitFor(() => {
        expect(screen.getByText('←')).toBeVisible()
        expect(screen.getByText('→')).toBeVisible()
        expect(screen.getAllByLabelText(/go to slide/i)).toHaveLength(2)
      })

      // Should display the most recent entry by default (journal-2)
      expect(screen.getByText('Test execution notes')).toBeVisible()
      expect(screen.getByText('Describe the execution')).toBeVisible()
      
      // Should also display the older entry when navigating (journal-1)
      expect(screen.getByText('Test rationale for first entry')).toBeInTheDocument()
      expect(screen.getByText('Why this trade? Why now?')).toBeInTheDocument()
    })

    it('[Integration] should maintain chronological order but show most recent entry initially', async () => {
      // Create test position
      await positionService.create(mockPosition)
      
      // Create test journal entries in chronological order
      const journalEntries: JournalEntry[] = [
        {
          id: 'journal-1',
          position_id: 'pos-123',
          entry_type: 'position_plan',
          fields: [
            {
              name: 'rationale',
              prompt: 'Why this trade? Why now?',
              response: 'First journal entry',
              required: true
            }
          ],
          created_at: '2025-10-01T10:00:00Z'
        },
        {
          id: 'journal-2',
          position_id: 'pos-123',
          entry_type: 'trade_execution',
          fields: [
            {
              name: 'execution_notes',
              prompt: 'Describe the execution',
              response: 'Second journal entry',
              required: false
            }
          ],
          created_at: '2025-10-03T11:00:00Z'
        },
        {
          id: 'journal-3',
          position_id: 'pos-123',
          entry_type: 'trade_execution',
          fields: [
            {
              name: 'execution_notes',
              prompt: 'Describe the execution',
              response: 'Third journal entry',
              required: false
            }
          ],
          created_at: '2025-10-02T12:00:00Z'  // Middle date
        }
      ]
      
      // Add journal entries to DB
      for (const entry of journalEntries) {
        await journalService.create(entry)
      }

      renderPositionDetail()

      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument()
      })

      // Open the journal entries accordion
      const journalAccordionButton = screen.getByText(/journal entries/i).closest('button')
      expect(journalAccordionButton).toBeInTheDocument()
      fireEvent.click(journalAccordionButton!)

      // Check that all entries are displayed with correct chronological ordering
      await waitFor(() => {
        const dots = screen.getAllByLabelText(/go to slide/i)
        expect(dots).toHaveLength(3)
      })
      
      // Most recent entry should be shown (journal-2)
      expect(screen.getByText('Second journal entry')).toBeVisible()
    })

    it('[Integration] should handle navigation between journal entries', async () => {
      // Create test position
      await positionService.create(mockPosition)
      
      // Create test journal entries
      const journalEntries: JournalEntry[] = [
        {
          id: 'journal-1',
          position_id: 'pos-123',
          entry_type: 'position_plan',
          fields: [
            {
              name: 'rationale',
              prompt: 'Why this trade? Why now?',
              response: 'First entry rationale',
              required: true
            }
          ],
          created_at: '2025-10-01T10:00:00Z'
        },
        {
          id: 'journal-2',
          position_id: 'pos-123',
          entry_type: 'trade_execution',
          fields: [
            {
              name: 'execution_notes',
              prompt: 'Describe the execution',
              response: 'Second entry execution notes',
              required: false
            }
          ],
          created_at: '2025-10-03T11:00:00Z'
        }
      ]
      
      // Add journal entries to DB
      for (const entry of journalEntries) {
        await journalService.create(entry)
      }

      renderPositionDetail()

      await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument()
      })

      // Open the journal entries accordion
      const journalAccordionButton = screen.getByText(/journal entries/i).closest('button')
      expect(journalAccordionButton).toBeInTheDocument()
      fireEvent.click(journalAccordionButton!)

      await waitFor(() => {
        expect(screen.getByText('Second entry execution notes')).toBeVisible()
      })

      // Navigate to previous entry
      const leftArrow = screen.getByText('←')
      fireEvent.click(leftArrow)

      await waitFor(() => {
        expect(screen.getByText('First entry rationale')).toBeVisible()
      })

      // Navigate back to most recent entry
      const rightArrow = screen.getByText('→')
      fireEvent.click(rightArrow)

      await waitFor(() => {
        expect(screen.getByText('Second entry execution notes')).toBeVisible()
      })
    })
  })
})