import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PositionService } from '@/lib/position'
import type { Position } from '@/lib/position'
import { SchemaManager } from '@/services/SchemaManager'
import 'fake-indexeddb/auto'

describe('PositionService - Lazy Migration', () => {
  let db: IDBDatabase
  let positionService: PositionService

  beforeEach(async () => {
    // Delete database to ensure clean state
    const deleteRequest = indexedDB.deleteDatabase('TestDB')
    await new Promise<void>((resolve) => {
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => resolve()
      deleteRequest.onblocked = () => resolve()
    })

    // Create test database with schema
    db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('TestDB', 1)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result
        SchemaManager.initializeSchema(database, 1)
      }
    })

    // Create service with injected database
    positionService = new PositionService(db)
  })

  afterEach(() => {
    db?.close()
    indexedDB.deleteDatabase('TestDB')
  })

  describe('strategy_type migration', () => {
    it('should default strategy_type to "Long Stock" for legacy position without strategy_type', async () => {
      // Simulate legacy position stored without strategy_type field
      const legacyPosition = {
        id: 'pos-legacy-1',
        symbol: 'AAPL',
        target_entry_price: 150.00,
        target_quantity: 100,
        profit_target: 165.00,
        stop_loss: 145.00,
        position_thesis: 'Legacy position',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
        // Note: strategy_type is MISSING (legacy data)
      }

      // Manually insert legacy position into database
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(['positions'], 'readwrite')
        const store = transaction.objectStore('positions')
        const request = store.add(legacyPosition)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })

      // Retrieve position - should have migrated strategy_type
      const retrieved = await positionService.getById('pos-legacy-1')

      expect(retrieved).not.toBeNull()
      expect(retrieved!.strategy_type).toBe('Long Stock')
    })

    it('should preserve existing strategy_type when present', async () => {
      // Position with explicit strategy_type
      const position: Position = {
        id: 'pos-with-strategy',
        symbol: 'AAPL',
        strategy_type: 'Short Put',
        trade_kind: 'option',
        target_entry_price: 150.00,
        target_quantity: 100,
        profit_target: 165.00,
        stop_loss: 145.00,
        position_thesis: 'Short Put strategy',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: [],
        option_type: 'put',
        strike_price: 150.00,
        expiration_date: new Date('2026-12-31'),
        profit_target_basis: 'option',
        stop_loss_basis: 'option'
      }

      await positionService.create(position)
      const retrieved = await positionService.getById('pos-with-strategy')

      expect(retrieved!.strategy_type).toBe('Short Put')
    })
  })

  describe('trade_kind migration', () => {
    it('should default trade_kind to "stock" for legacy position without trade_kind', async () => {
      // Simulate legacy position stored without trade_kind field
      const legacyPosition = {
        id: 'pos-legacy-2',
        symbol: 'TSLA',
        strategy_type: 'Long Stock',
        target_entry_price: 200.00,
        target_quantity: 50,
        profit_target: 220.00,
        stop_loss: 190.00,
        position_thesis: 'Legacy position without trade_kind',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
        // Note: trade_kind is MISSING (legacy data)
      }

      // Manually insert legacy position into database
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(['positions'], 'readwrite')
        const store = transaction.objectStore('positions')
        const request = store.add(legacyPosition)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })

      // Retrieve position - should have migrated trade_kind
      const retrieved = await positionService.getById('pos-legacy-2')

      expect(retrieved).not.toBeNull()
      expect(retrieved!.trade_kind).toBe('stock')
    })

    it('should preserve existing trade_kind when present', async () => {
      // Position with explicit trade_kind
      const position: Position = {
        id: 'pos-with-kind',
        symbol: 'NVDA',
        strategy_type: 'Short Put',
        trade_kind: 'option',
        target_entry_price: 450.00,
        target_quantity: 10,
        profit_target: 500.00,
        stop_loss: 430.00,
        position_thesis: 'Option position',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: [],
        option_type: 'put',
        strike_price: 450.00,
        expiration_date: new Date('2026-12-31'),
        profit_target_basis: 'option',
        stop_loss_basis: 'option'
      }

      await positionService.create(position)
      const retrieved = await positionService.getById('pos-with-kind')

      expect(retrieved!.trade_kind).toBe('option')
    })
  })

  describe('new position validation', () => {
    it('should require explicit strategy_type for new positions', async () => {
      // Attempt to create position without strategy_type
      const invalidPosition = {
        id: 'pos-invalid',
        symbol: 'GOOG',
        target_entry_price: 140.00,
        target_quantity: 20,
        profit_target: 150.00,
        stop_loss: 135.00,
        position_thesis: 'New position without strategy',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
        // Missing strategy_type
      } as any

      // Should throw validation error
      await expect(positionService.create(invalidPosition)).rejects.toThrow()
    })

    it('should accept new position with explicit strategy_type', async () => {
      // Valid new position
      const validPosition: Position = {
        id: 'pos-valid',
        symbol: 'MSFT',
        strategy_type: 'Long Stock',
        trade_kind: 'stock',
        target_entry_price: 380.00,
        target_quantity: 25,
        profit_target: 400.00,
        stop_loss: 370.00,
        position_thesis: 'New position with strategy',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
      }

      await expect(positionService.create(validPosition)).resolves.toBeDefined()
    })
  })

  describe('migration idempotency', () => {
    it('should apply migration consistently across multiple retrievals', async () => {
      // Insert legacy position
      const legacyPosition = {
        id: 'pos-idempotent',
        symbol: 'AMD',
        target_entry_price: 120.00,
        target_quantity: 30,
        profit_target: 130.00,
        stop_loss: 115.00,
        position_thesis: 'Test idempotency',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
        // Missing both strategy_type and trade_kind
      }

      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(['positions'], 'readwrite')
        const store = transaction.objectStore('positions')
        const request = store.add(legacyPosition)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })

      // First retrieval
      const retrieved1 = await positionService.getById('pos-idempotent')
      expect(retrieved1!.strategy_type).toBe('Long Stock')
      expect(retrieved1!.trade_kind).toBe('stock')

      // Second retrieval should produce same results
      const retrieved2 = await positionService.getById('pos-idempotent')
      expect(retrieved2!.strategy_type).toBe('Long Stock')
      expect(retrieved2!.trade_kind).toBe('stock')
    })

    it('should persist migrated values on re-save', async () => {
      // Insert legacy position
      const legacyPosition = {
        id: 'pos-persist',
        symbol: 'INTC',
        target_entry_price: 45.00,
        target_quantity: 100,
        profit_target: 50.00,
        stop_loss: 43.00,
        position_thesis: 'Test persistence',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
      }

      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(['positions'], 'readwrite')
        const store = transaction.objectStore('positions')
        const request = store.add(legacyPosition)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })

      // Load, migrate, and re-save
      const retrieved = await positionService.getById('pos-persist')
      expect(retrieved!.strategy_type).toBe('Long Stock')
      expect(retrieved!.trade_kind).toBe('stock')

      await positionService.update(retrieved!)

      // Load again to verify persisted migration
      const reloaded = await positionService.getById('pos-persist')
      expect(reloaded!.strategy_type).toBe('Long Stock')
      expect(reloaded!.trade_kind).toBe('stock')
    })
  })

  describe('getAll migration', () => {
    it('should migrate all legacy positions when loading with getAll()', async () => {
      // Insert multiple legacy positions
      const legacyPositions = [
        {
          id: 'pos-bulk-1',
          symbol: 'IBM',
          target_entry_price: 170.00,
          target_quantity: 50,
          profit_target: 180.00,
          stop_loss: 165.00,
          position_thesis: 'Bulk migration test 1',
          created_date: new Date(),
          status: 'planned',
          journal_entry_ids: [],
          trades: []
        },
        {
          id: 'pos-bulk-2',
          symbol: 'ORCL',
          target_entry_price: 110.00,
          target_quantity: 40,
          profit_target: 120.00,
          stop_loss: 105.00,
          position_thesis: 'Bulk migration test 2',
          created_date: new Date(),
          status: 'planned',
          journal_entry_ids: [],
          trades: []
        }
      ]

      // Manually insert both legacy positions
      for (const position of legacyPositions) {
        await new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(['positions'], 'readwrite')
          const store = transaction.objectStore('positions')
          const request = store.add(position)
          request.onerror = () => reject(request.error)
          request.onsuccess = () => resolve()
        })
      }

      // Retrieve all positions
      const allPositions = await positionService.getAll()

      expect(allPositions.length).toBe(2)

      // All should have migrated fields
      allPositions.forEach(position => {
        expect(position.strategy_type).toBe('Long Stock')
        expect(position.trade_kind).toBe('stock')
      })
    })
  })
})
