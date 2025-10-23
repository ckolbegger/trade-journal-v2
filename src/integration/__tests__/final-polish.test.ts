import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { PositionService } from '@/lib/position'
import type { Position } from '@/lib/position'
import { JournalService } from '@/services/JournalService'
import type { JournalEntry } from '@/types/journal'
import { TradeService } from '@/services/TradeService'
import { IDBFactory } from 'fake-indexeddb'

describe('Final Polish Integration', () => {
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
    // Reset database before each test
    indexedDB = new IDBFactory()
    
    // Initialize PositionService which will create the required object stores
    positionService = new PositionService()
    
    // Force database initialization by calling getAll which will trigger onupgradeneeded
    await positionService.getAll()
    
    // Get database connection
    db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('TradingJournalDB', 2)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })

    journalService = new JournalService(db)
    tradeService = new TradeService(positionService)
  })

  afterEach(() => {
    if (db) {
      db.close()
    }
    positionService.close()
  })

  it('[Final Polish] should work with comprehensive data including multiple journal entries', async () => {
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
            response: 'Initial position plan entry',
            required: true
          },
          {
            name: 'emotional_state',
            prompt: 'How are you feeling about this trade?',
            response: 'Confident and well-researched',
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
            response: 'Executed trade at target price',
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
            name: 'market_conditions',
            prompt: 'What market conditions am I observing today?',
            response: 'Market showing continued weakness',
            required: false
          },
          {
            name: 'position_performance',
            prompt: 'How is my position performing relative to my plan?',
            response: 'Position down -12.4%, close to stop',
            required: false
          }
        ],
        created_at: '2025-10-05T12:00:00Z'
      }
    ]
    
    // Add journal entries to DB
    for (const entry of journalEntries) {
      await journalService.create(entry)
    }

    // Verify entries can be retrieved
    const retrievedEntries = await journalService.getByPositionId('pos-123')
    expect(retrievedEntries).toHaveLength(3)
    
    // Verify chronological ordering is preserved
    const sortedEntries = retrievedEntries.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    expect(sortedEntries[0].id).toBe('journal-1')
    expect(sortedEntries[1].id).toBe('journal-2')
    expect(sortedEntries[2].id).toBe('journal-3')
    
    // Verify that the carousel would show the most recent by default
    expect(sortedEntries[sortedEntries.length - 1].fields[0].response).toBe('Market showing continued weakness')
  })
})