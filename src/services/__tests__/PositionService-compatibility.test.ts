import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PositionService } from '@/lib/position'
import type { Position } from '@/lib/position'
import 'fake-indexeddb/auto'

describe('PositionService - Additional Backward Compatibility', () => {
  let positionService: PositionService

  beforeEach(async () => {
    positionService = new PositionService()
    await positionService.clearAll()
  })

  afterEach(() => {
    positionService.close()
  })

  it('[Service] should handle positions created before trades feature', async () => {
    // Simulate legacy position from database
    const db = await openDatabase('TradingJournalDB')
    const transaction = db.transaction(['positions'], 'readwrite')
    const store = transaction.objectStore('positions')

    const legacyPosition = {
      id: 'pos-legacy',
      symbol: 'AAPL',
      strategy_type: 'Long Stock',
      target_entry_price: 150.00,
      target_quantity: 100,
      profit_target: 165.00,
      stop_loss: 145.00,
      position_thesis: 'Legacy position',
      created_date: new Date().toISOString(),
      status: 'planned',
      journal_entry_ids: []
      // No trades field
    }

    await new Promise((resolve, reject) => {
      const request = store.add(legacyPosition)
      request.onsuccess = () => resolve(undefined)
      request.onerror = () => reject(request.error)
    })

    db.close()

    // Retrieve and verify migration
    const retrieved = await positionService.getById('pos-legacy')
    expect(retrieved).not.toBeNull()
    expect(retrieved!.trades).toBeDefined()
    expect(Array.isArray(retrieved!.trades)).toBe(true)
    expect(retrieved!.trades.length).toBe(0)
    expect(retrieved!.status).toBe('planned')
  })

  it('[Integration] should handle mixed database with various position states', async () => {
    // Create a mix of positions
    const plannedPosition: Position = {
      id: 'pos-planned',
      symbol: 'AAPL',
      strategy_type: 'Long Stock',
      target_entry_price: 150.00,
      target_quantity: 100,
      profit_target: 165.00,
      stop_loss: 145.00,
      position_thesis: 'Planned position',
      created_date: new Date(),
      status: 'planned',
      journal_entry_ids: [],
      trades: []
    }

    const openPosition: Position = {
      id: 'pos-open',
      symbol: 'MSFT',
      strategy_type: 'Long Stock',
      target_entry_price: 300.00,
      target_quantity: 50,
      profit_target: 320.00,
      stop_loss: 290.00,
      position_thesis: 'Open position',
      created_date: new Date(),
      status: 'planned',
      journal_entry_ids: [],
      trades: [{
        id: 'trade-1',
        position_id: 'pos-open',
        trade_type: 'buy',
        quantity: 50,
        price: 299.50,
        timestamp: new Date()
      }]
    }

    await positionService.create(plannedPosition)
    await positionService.create(openPosition)

    const allPositions = await positionService.getAll()
    expect(allPositions.length).toBe(2)

    const planned = allPositions.find(p => p.id === 'pos-planned')
    const open = allPositions.find(p => p.id === 'pos-open')

    expect(planned!.status).toBe('planned')
    expect(planned!.trades.length).toBe(0)

    expect(open!.status).toBe('open')
    expect(open!.trades.length).toBe(1)
  })

  it('[Service] should preserve all legacy fields during update', async () => {
    const position: Position = {
      id: 'pos-123',
      symbol: 'AAPL',
      strategy_type: 'Long Stock',
      target_entry_price: 150.00,
      target_quantity: 100,
      profit_target: 165.00,
      stop_loss: 145.00,
      position_thesis: 'Original thesis',
      created_date: new Date('2024-01-01'),
      status: 'planned',
      journal_entry_ids: ['journal-1', 'journal-2'],
      trades: []
    }

    await positionService.create(position)

    // Add trade
    const retrieved = await positionService.getById('pos-123')
    retrieved!.trades.push({
      id: 'trade-1',
      position_id: 'pos-123',
      trade_type: 'buy',
      quantity: 100,
      price: 150.50,
      timestamp: new Date()
    })

    await positionService.update(retrieved!)

    // Verify all fields preserved
    const updated = await positionService.getById('pos-123')
    expect(updated!.symbol).toBe('AAPL')
    expect(updated!.target_entry_price).toBe(150.00)
    expect(updated!.target_quantity).toBe(100)
    expect(updated!.profit_target).toBe(165.00)
    expect(updated!.stop_loss).toBe(145.00)
    expect(updated!.position_thesis).toBe('Original thesis')
    expect(updated!.journal_entry_ids).toEqual(['journal-1', 'journal-2'])
    expect(updated!.trades.length).toBe(1)
  })

  it('[Integration] should recover from corrupted trades array', async () => {
    const db = await openDatabase('TradingJournalDB')
    const transaction = db.transaction(['positions'], 'readwrite')
    const store = transaction.objectStore('positions')

    const corruptedPosition = {
      id: 'pos-corrupted',
      symbol: 'AAPL',
      strategy_type: 'Long Stock',
      target_entry_price: 150.00,
      target_quantity: 100,
      profit_target: 165.00,
      stop_loss: 145.00,
      position_thesis: 'Corrupted position',
      created_date: new Date().toISOString(),
      status: 'planned',
      journal_entry_ids: [],
      trades: null // Corrupted
    }

    await new Promise((resolve, reject) => {
      const request = store.add(corruptedPosition)
      request.onsuccess = () => resolve(undefined)
      request.onerror = () => reject(request.error)
    })

    db.close()

    // Should recover gracefully
    const retrieved = await positionService.getById('pos-corrupted')
    expect(retrieved).not.toBeNull()
    expect(retrieved!.trades).toBeDefined()
    expect(Array.isArray(retrieved!.trades)).toBe(true)
    expect(retrieved!.trades.length).toBe(0)
    expect(retrieved!.status).toBe('planned')
  })

  it('[Integration] should handle positions with Date objects in trades', async () => {
    const position: Position = {
      id: 'pos-123',
      symbol: 'AAPL',
      strategy_type: 'Long Stock',
      target_entry_price: 150.00,
      target_quantity: 100,
      profit_target: 165.00,
      stop_loss: 145.00,
      position_thesis: 'Strong technical setup',
      created_date: new Date(),
      status: 'planned',
      journal_entry_ids: [],
      trades: [{
        id: 'trade-1',
        position_id: 'pos-123',
        trade_type: 'buy',
        quantity: 100,
        price: 150.50,
        timestamp: new Date('2024-10-03T10:00:00Z')
      }]
    }

    await positionService.create(position)

    const retrieved = await positionService.getById('pos-123')
    expect(retrieved!.trades[0].timestamp).toBeInstanceOf(Date)
  })
})

async function openDatabase(dbName: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 2)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains('positions')) {
        const store = db.createObjectStore('positions', { keyPath: 'id' })
        store.createIndex('symbol', 'symbol', { unique: false })
        store.createIndex('status', 'status', { unique: false })
        store.createIndex('created_date', 'created_date', { unique: false })
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
}
