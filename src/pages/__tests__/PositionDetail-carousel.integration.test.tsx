import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PositionDetail } from '@/pages/PositionDetail'
import { PositionService } from '@/lib/position'
import type { Position } from '@/lib/position'
import { JournalService } from '@/services/JournalService'
import type { JournalEntry } from '@/types/journal'
import { TradeService } from '@/services/TradeService'

describe('PositionDetail - Full Carousel Workflow', () => {
  let db: IDBDatabase
  let positionService: PositionService
  let journalService: JournalService
  let tradeService: TradeService

  const mockPosition: Position = {
    id: 'pos-carousel-test',
    symbol: 'TSLA',
    strategy_type: 'Long Stock',
    target_entry_price: 250.0,
    target_quantity: 60,
    profit_target: 285.0,
    stop_loss: 210.0,
    position_thesis: 'Strong technical setup with institutional support',
    created_date: new Date('2024-09-04'),
    status: 'open',
    journal_entry_ids: [],
    trades: [
      {
        id: 'trade-1',
        position_id: 'pos-carousel-test',
        trade_type: 'buy',
        quantity: 60,
        price: 248.5,
        timestamp: new Date('2024-09-05T10:00:00Z'),
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

  it('loads position with multiple journal entries and navigates carousel', async () => {
    // Create position in IndexedDB
    await positionService.create(mockPosition)

    // Create multiple journal entries for position
    const journalEntries: JournalEntry[] = [
      {
        id: 'journal-1',
        position_id: 'pos-carousel-test',
        entry_type: 'position_plan',
        fields: [
          {
            name: 'core_thesis',
            prompt: 'What is the core thesis for this position?',
            response: 'Entry 1: TSLA showing strong support at $250 with bullish momentum.'
          }
        ],
        created_at: new Date('2024-09-04T10:00:00Z').toISOString()
      },
      {
        id: 'journal-2',
        position_id: 'pos-carousel-test',
        entry_type: 'trade_execution',
        trade_id: 'trade-1',
        fields: [
          {
            name: 'execution_timing',
            prompt: 'Why did I execute this trade now?',
            response: 'Entry 2: Price reached target entry with confirming volume.'
          }
        ],
        created_at: new Date('2024-09-05T14:30:00Z').toISOString(),
        executed_at: new Date('2024-09-05T14:30:00Z').toISOString()
      },
      {
        id: 'journal-3',
        position_id: 'pos-carousel-test',
        entry_type: 'position_plan',
        fields: [
          {
            name: 'position_update',
            prompt: 'What changed since last review?',
            response: 'Entry 3: Market showing weakness, position down 8%.'
          }
        ],
        created_at: new Date('2024-09-07T09:00:00Z').toISOString()
      },
      {
        id: 'journal-4',
        position_id: 'pos-carousel-test',
        entry_type: 'position_plan',
        fields: [
          {
            name: 'daily_review',
            prompt: 'What am I observing today?',
            response: 'Entry 4: Position near stop level, considering exit strategy.'
          }
        ],
        created_at: new Date('2024-09-10T16:00:00Z').toISOString()
      }
    ]

    for (const entry of journalEntries) {
      await journalService.create(entry)
    }

    // Render PositionDetail page
    renderPositionDetail()

    // Wait for position to load
    await waitFor(() => {
      expect(screen.getByText('TSLA')).toBeInTheDocument()
    })

    // Expand Journal Entries accordion
    const journalButton = screen.getByText(/Journal Entries/).closest('button')
    expect(journalButton).toBeInTheDocument()
    fireEvent.click(journalButton!)

    // Verify carousel appears with correct entry count
    await waitFor(() => {
      expect(screen.getByTestId('carousel-container')).toBeInTheDocument()
      expect(screen.getByTestId('carousel-nav')).toBeInTheDocument()
    })

    // Verify we have 4 dots (one for each entry)
    const dots = screen.getAllByTestId(/^carousel-dot-/)
    expect(dots.length).toBe(4)

    // Verify first entry is visible
    expect(screen.getByText(/Entry 1:/)).toBeInTheDocument()
    expect(screen.getAllByText('POSITION PLAN').length).toBeGreaterThan(0)

    // Navigate through all entries using arrows
    const nextArrow = screen.getByTestId('next-arrow')
    const prevArrow = screen.getByTestId('prev-arrow')

    // Left arrow should be disabled on first slide
    expect(prevArrow).toBeDisabled()

    // Click next to go to entry 2
    fireEvent.click(nextArrow)
    await waitFor(() => {
      expect(screen.getByText(/Entry 2:/)).toBeInTheDocument()
      expect(screen.getAllByText('TRADE EXECUTION').length).toBeGreaterThan(0)
    })

    // Both arrows should be enabled on middle slides
    expect(prevArrow).not.toBeDisabled()
    expect(nextArrow).not.toBeDisabled()

    // Click next to go to entry 3
    fireEvent.click(nextArrow)
    await waitFor(() => {
      expect(screen.getByText(/Entry 3:/)).toBeInTheDocument()
    })

    // Click next to go to entry 4
    fireEvent.click(nextArrow)
    await waitFor(() => {
      expect(screen.getByText(/Entry 4:/)).toBeInTheDocument()
    })

    // Right arrow should be disabled on last slide
    expect(nextArrow).toBeDisabled()

    // Click prev arrow to go back to entry 3
    fireEvent.click(prevArrow)
    await waitFor(() => {
      expect(screen.getByText(/Entry 3:/)).toBeInTheDocument()
    })

    // Jump to specific entry using dots - click first dot
    fireEvent.click(dots[0])
    await waitFor(() => {
      expect(screen.getByText(/Entry 1:/)).toBeInTheDocument()
    })

    // Verify each entry's data matches what was stored
    expect(screen.getByText('What is the core thesis for this position?')).toBeInTheDocument()
    expect(screen.getByText(/TSLA showing strong support at \$250/)).toBeInTheDocument()

    // Jump to third entry using dot
    fireEvent.click(dots[2])
    await waitFor(() => {
      expect(screen.getByText(/Entry 3:/)).toBeInTheDocument()
      expect(screen.getByText('What changed since last review?')).toBeInTheDocument()
    })

    // Collapse accordion (accordion just hides content, doesn't remove it)
    fireEvent.click(journalButton!)

    // Wait a moment for accordion animation
    await new Promise(resolve => setTimeout(resolve, 100))

    // Re-expand accordion and verify carousel state is preserved
    fireEvent.click(journalButton!)
    await waitFor(() => {
      // Should still be showing entry 3
      expect(screen.getByText(/Entry 3:/)).toBeInTheDocument()
    })

    // Verify all navigation still works after re-expand
    fireEvent.click(dots[1])
    await waitFor(() => {
      expect(screen.getByText(/Entry 2:/)).toBeInTheDocument()
    })
  })
})
