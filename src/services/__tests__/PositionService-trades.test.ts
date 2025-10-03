import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PositionService } from '@/lib/position'
import type { Position } from '@/lib/position'
import type { Trade } from '@/lib/trade'
import 'fake-indexeddb/auto'

describe('PositionService - Trades Array Integration', () => {
  let positionService: PositionService
  const dbName = 'TradingJournalDB'

  beforeEach(async () => {
    positionService = new PositionService()
    await positionService.clearAll()
  })

  afterEach(() => {
    positionService.close()
  })

  describe('Persistence with trades array', () => {
    it('[Service] should save Position with empty trades array', async () => {
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
        trades: []
      }

      await positionService.create(position)
      const retrieved = await positionService.getById('pos-123')

      expect(retrieved).not.toBeNull()
      expect(retrieved!.trades).toBeDefined()
      expect(Array.isArray(retrieved!.trades)).toBe(true)
      expect(retrieved!.trades.length).toBe(0)
    })

    it('[Service] should save and retrieve Position with trades array', async () => {
      const trade: Trade = {
        id: 'trade-123',
        trade_type: 'buy',
        quantity: 100,
        price: 150.50,
        timestamp: new Date('2024-10-03T10:00:00Z')
      }

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
        trades: [trade]
      }

      await positionService.create(position)
      const retrieved = await positionService.getById('pos-123')

      expect(retrieved).not.toBeNull()
      expect(retrieved!.trades.length).toBe(1)
      expect(retrieved!.trades[0].id).toBe('trade-123')
      expect(retrieved!.trades[0].trade_type).toBe('buy')
      expect(retrieved!.trades[0].quantity).toBe(100)
      expect(retrieved!.trades[0].price).toBe(150.50)
    })

    it('[Service] should reject Position with non-array trades field', async () => {
      const invalidPosition: any = {
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
        trades: 'not-an-array'
      }

      await expect(positionService.create(invalidPosition)).rejects.toThrow('trades must be an array')
    })
  })

  describe('Backward compatibility with legacy data', () => {
    it('[Service] should load legacy Position without trades field and initialize empty array', async () => {
      // Manually insert legacy position into database without trades field
      const db = await openDatabase(dbName)
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
        // Note: no trades field
      }

      await new Promise((resolve, reject) => {
        const request = store.add(legacyPosition)
        request.onsuccess = () => resolve(undefined)
        request.onerror = () => reject(request.error)
      })

      db.close()

      // Retrieve using PositionService
      const retrieved = await positionService.getById('pos-legacy')

      expect(retrieved).not.toBeNull()
      expect(retrieved!.trades).toBeDefined()
      expect(Array.isArray(retrieved!.trades)).toBe(true)
      expect(retrieved!.trades.length).toBe(0)
    })

    it('[Service] should save legacy Position with trades array added', async () => {
      // Create legacy position structure
      const db = await openDatabase(dbName)
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
      }

      await new Promise((resolve, reject) => {
        const request = store.add(legacyPosition)
        request.onsuccess = () => resolve(undefined)
        request.onerror = () => reject(request.error)
      })

      db.close()

      // Load and update with trades
      const loaded = await positionService.getById('pos-legacy')
      expect(loaded).not.toBeNull()

      loaded!.trades.push({
        id: 'trade-123',
        trade_type: 'buy',
        quantity: 100,
        price: 150.50,
        timestamp: new Date()
      })

      await positionService.update(loaded!)

      // Verify trades persisted
      const retrieved = await positionService.getById('pos-legacy')
      expect(retrieved!.trades.length).toBe(1)
      expect(retrieved!.trades[0].id).toBe('trade-123')
    })

    it('[Service] should handle mixed database with legacy and new positions', async () => {
      // Insert legacy position without trades
      const db = await openDatabase(dbName)
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
      }

      await new Promise((resolve, reject) => {
        const request = store.add(legacyPosition)
        request.onsuccess = () => resolve(undefined)
        request.onerror = () => reject(request.error)
      })

      db.close()

      // Create new position with trades
      const newPosition: Position = {
        id: 'pos-new',
        symbol: 'MSFT',
        strategy_type: 'Long Stock',
        target_entry_price: 300.00,
        target_quantity: 50,
        profit_target: 320.00,
        stop_loss: 290.00,
        position_thesis: 'New position',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
      }

      await positionService.create(newPosition)

      // Get all positions
      const allPositions = await positionService.getAll()

      expect(allPositions.length).toBe(2)

      const legacy = allPositions.find(p => p.id === 'pos-legacy')
      const newer = allPositions.find(p => p.id === 'pos-new')

      expect(legacy!.trades).toBeDefined()
      expect(legacy!.trades.length).toBe(0)
      expect(newer!.trades).toBeDefined()
      expect(newer!.trades.length).toBe(0)
    })
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
