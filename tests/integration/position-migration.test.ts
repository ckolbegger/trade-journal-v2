import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PositionService } from '@/lib/position'
import type { Position } from '@/lib/position'
import { SchemaManager } from '@/services/SchemaManager'
import 'fake-indexeddb/auto'

/**
 * Integration Test: Position Migration
 *
 * Tests the complete lazy migration workflow through the full database layer,
 * verifying that legacy positions are migrated seamlessly when loaded and that
 * new positions require explicit strategy_type.
 *
 * This differs from the unit test (PositionService-migration.test.ts) by testing
 * the complete integration with IndexedDB persistence layer.
 */
describe('Integration: Position Migration', () => {
  const DB_NAME = 'TradingJournalDB-Migration-Test'
  const DB_VERSION = 1
  let db: IDBDatabase
  let positionService: PositionService

  beforeEach(async () => {
    // Clean up any existing database
    const deleteRequest = indexedDB.deleteDatabase(DB_NAME)
    await new Promise<void>((resolve) => {
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => resolve()
      deleteRequest.onblocked = () => resolve()
    })

    // Create fresh database with schema
    db = await new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result
        SchemaManager.initializeSchema(database, DB_VERSION)
      }
    })

    // Create service instance
    positionService = new PositionService(db)
  })

  afterEach(() => {
    db?.close()
    indexedDB.deleteDatabase(DB_NAME)
  })

  describe('loads legacy position from DB', () => {
    it('should load legacy position without strategy_type from IndexedDB', async () => {
      // Arrange: Create legacy position directly in IndexedDB (bypassing service validation)
      const legacyPosition = {
        id: 'legacy-pos-1',
        symbol: 'AAPL',
        target_entry_price: 150.00,
        target_quantity: 100,
        profit_target: 165.00,
        stop_loss: 145.00,
        position_thesis: 'Legacy position without strategy_type',
        created_date: new Date('2025-01-01'),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
        // Note: strategy_type intentionally missing (legacy data)
      }

      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(['positions'], 'readwrite')
        const store = transaction.objectStore('positions')
        const request = store.add(legacyPosition)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })

      // Act: Load position through service
      const loaded = await positionService.getById('legacy-pos-1')

      // Assert: Position loads successfully
      expect(loaded).not.toBeNull()
      expect(loaded!.id).toBe('legacy-pos-1')
      expect(loaded!.symbol).toBe('AAPL')
    })

    it('should load legacy position without trade_kind from IndexedDB', async () => {
      // Arrange: Create legacy position directly in IndexedDB
      const legacyPosition = {
        id: 'legacy-pos-2',
        symbol: 'TSLA',
        strategy_type: 'Long Stock',
        target_entry_price: 200.00,
        target_quantity: 50,
        profit_target: 220.00,
        stop_loss: 190.00,
        position_thesis: 'Legacy position without trade_kind',
        created_date: new Date('2025-01-01'),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
        // Note: trade_kind intentionally missing (legacy data)
      }

      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(['positions'], 'readwrite')
        const store = transaction.objectStore('positions')
        const request = store.add(legacyPosition)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })

      // Act: Load position through service
      const loaded = await positionService.getById('legacy-pos-2')

      // Assert: Position loads successfully
      expect(loaded).not.toBeNull()
      expect(loaded!.id).toBe('legacy-pos-2')
      expect(loaded!.symbol).toBe('TSLA')
    })
  })

  describe('migrated fields present after load', () => {
    it('should apply default strategy_type "Long Stock" when loading legacy position', async () => {
      // Arrange: Insert legacy position without strategy_type
      const legacyPosition = {
        id: 'legacy-pos-3',
        symbol: 'NVDA',
        target_entry_price: 450.00,
        target_quantity: 10,
        profit_target: 500.00,
        stop_loss: 430.00,
        position_thesis: 'Legacy position',
        created_date: new Date('2025-01-01'),
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

      // Act: Load position
      const loaded = await positionService.getById('legacy-pos-3')

      // Assert: strategy_type is migrated
      expect(loaded).not.toBeNull()
      expect(loaded!.strategy_type).toBe('Long Stock')
    })

    it('should apply default trade_kind "stock" when loading legacy position', async () => {
      // Arrange: Insert legacy position without trade_kind
      const legacyPosition = {
        id: 'legacy-pos-4',
        symbol: 'AMD',
        strategy_type: 'Long Stock',
        target_entry_price: 120.00,
        target_quantity: 30,
        profit_target: 130.00,
        stop_loss: 115.00,
        position_thesis: 'Legacy position',
        created_date: new Date('2025-01-01'),
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

      // Act: Load position
      const loaded = await positionService.getById('legacy-pos-4')

      // Assert: trade_kind is migrated
      expect(loaded).not.toBeNull()
      expect(loaded!.trade_kind).toBe('stock')
    })

    it('should apply both migrations when both fields are missing', async () => {
      // Arrange: Insert legacy position without strategy_type OR trade_kind
      const legacyPosition = {
        id: 'legacy-pos-5',
        symbol: 'INTC',
        target_entry_price: 45.00,
        target_quantity: 100,
        profit_target: 50.00,
        stop_loss: 43.00,
        position_thesis: 'Fully legacy position',
        created_date: new Date('2025-01-01'),
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

      // Act: Load position
      const loaded = await positionService.getById('legacy-pos-5')

      // Assert: Both fields are migrated
      expect(loaded).not.toBeNull()
      expect(loaded!.strategy_type).toBe('Long Stock')
      expect(loaded!.trade_kind).toBe('stock')
    })

    it('should preserve existing strategy_type and trade_kind when present', async () => {
      // Arrange: Insert position with explicit fields
      const position = {
        id: 'modern-pos-1',
        symbol: 'MSFT',
        strategy_type: 'Short Put',
        trade_kind: 'option',
        target_entry_price: 380.00,
        target_quantity: 10,
        profit_target: 400.00,
        stop_loss: 370.00,
        position_thesis: 'Modern position with explicit fields',
        created_date: new Date('2025-01-01'),
        status: 'planned',
        journal_entry_ids: [],
        trades: [],
        option_type: 'put',
        strike_price: 380.00,
        expiration_date: new Date('2026-12-31'),
        profit_target_basis: 'option',
        stop_loss_basis: 'option'
      }

      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(['positions'], 'readwrite')
        const store = transaction.objectStore('positions')
        const request = store.add(position)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })

      // Act: Load position
      const loaded = await positionService.getById('modern-pos-1')

      // Assert: Original values preserved
      expect(loaded).not.toBeNull()
      expect(loaded!.strategy_type).toBe('Short Put')
      expect(loaded!.trade_kind).toBe('option')
    })
  })

  describe('re-save preserves migrated values', () => {
    it('should persist migrated strategy_type on update', async () => {
      // Arrange: Insert legacy position
      const legacyPosition = {
        id: 'persist-pos-1',
        symbol: 'IBM',
        target_entry_price: 170.00,
        target_quantity: 50,
        profit_target: 180.00,
        stop_loss: 165.00,
        position_thesis: 'Test persistence',
        created_date: new Date('2025-01-01'),
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

      // Act: Load, verify migration, update, and reload
      const loaded = await positionService.getById('persist-pos-1')
      expect(loaded!.strategy_type).toBe('Long Stock')

      await positionService.update(loaded!)

      const reloaded = await positionService.getById('persist-pos-1')

      // Assert: Migrated value persisted
      expect(reloaded).not.toBeNull()
      expect(reloaded!.strategy_type).toBe('Long Stock')
    })

    it('should persist migrated trade_kind on update', async () => {
      // Arrange: Insert legacy position
      const legacyPosition = {
        id: 'persist-pos-2',
        symbol: 'ORCL',
        strategy_type: 'Long Stock',
        target_entry_price: 110.00,
        target_quantity: 40,
        profit_target: 120.00,
        stop_loss: 105.00,
        position_thesis: 'Test persistence',
        created_date: new Date('2025-01-01'),
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

      // Act: Load, verify migration, update, and reload
      const loaded = await positionService.getById('persist-pos-2')
      expect(loaded!.trade_kind).toBe('stock')

      await positionService.update(loaded!)

      const reloaded = await positionService.getById('persist-pos-2')

      // Assert: Migrated value persisted
      expect(reloaded).not.toBeNull()
      expect(reloaded!.trade_kind).toBe('stock')
    })

    it('should persist both migrated fields on update', async () => {
      // Arrange: Insert fully legacy position
      const legacyPosition = {
        id: 'persist-pos-3',
        symbol: 'SAP',
        target_entry_price: 150.00,
        target_quantity: 25,
        profit_target: 160.00,
        stop_loss: 145.00,
        position_thesis: 'Test full persistence',
        created_date: new Date('2025-01-01'),
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

      // Act: Load, verify migrations, update, and reload
      const loaded = await positionService.getById('persist-pos-3')
      expect(loaded!.strategy_type).toBe('Long Stock')
      expect(loaded!.trade_kind).toBe('stock')

      await positionService.update(loaded!)

      const reloaded = await positionService.getById('persist-pos-3')

      // Assert: Both migrated values persisted
      expect(reloaded).not.toBeNull()
      expect(reloaded!.strategy_type).toBe('Long Stock')
      expect(reloaded!.trade_kind).toBe('stock')
    })

    it('should verify migrated values exist in raw database after update', async () => {
      // Arrange: Insert legacy position
      const legacyPosition = {
        id: 'persist-pos-4',
        symbol: 'CRM',
        target_entry_price: 280.00,
        target_quantity: 15,
        profit_target: 300.00,
        stop_loss: 270.00,
        position_thesis: 'Verify raw DB storage',
        created_date: new Date('2025-01-01'),
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

      // Act: Load through service, update to persist migrations
      const loaded = await positionService.getById('persist-pos-4')
      await positionService.update(loaded!)

      // Read directly from database (bypassing service)
      const rawPosition = await new Promise<any>((resolve, reject) => {
        const transaction = db.transaction(['positions'], 'readonly')
        const store = transaction.objectStore('positions')
        const request = store.get('persist-pos-4')
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result)
      })

      // Assert: Raw database record has migrated fields
      expect(rawPosition).toBeDefined()
      expect(rawPosition.strategy_type).toBe('Long Stock')
      expect(rawPosition.trade_kind).toBe('stock')
    })
  })

  describe('new position saves with explicit strategy', () => {
    it('should reject new position without strategy_type', async () => {
      // Arrange: Create position without strategy_type
      const invalidPosition = {
        id: 'new-invalid-1',
        symbol: 'GOOG',
        target_entry_price: 140.00,
        target_quantity: 20,
        profit_target: 150.00,
        stop_loss: 135.00,
        position_thesis: 'Missing strategy_type',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
      } as any

      // Act & Assert: Should throw validation error
      await expect(positionService.create(invalidPosition)).rejects.toThrow()
    })

    it('should accept new position with explicit strategy_type "Long Stock"', async () => {
      // Arrange: Create valid Long Stock position
      const validPosition: Position = {
        id: 'new-valid-1',
        symbol: 'MSFT',
        strategy_type: 'Long Stock',
        trade_kind: 'stock',
        target_entry_price: 380.00,
        target_quantity: 25,
        profit_target: 400.00,
        stop_loss: 370.00,
        position_thesis: 'Valid Long Stock position',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
      }

      // Act: Create position
      await positionService.create(validPosition)
      const loaded = await positionService.getById('new-valid-1')

      // Assert: Position created successfully with correct values
      expect(loaded).not.toBeNull()
      expect(loaded!.strategy_type).toBe('Long Stock')
      expect(loaded!.trade_kind).toBe('stock')
    })

    it('should accept new position with explicit strategy_type "Short Put"', async () => {
      // Arrange: Create valid Short Put position
      const validPosition: Position = {
        id: 'new-valid-2',
        symbol: 'AAPL',
        strategy_type: 'Short Put',
        trade_kind: 'option',
        target_entry_price: 150.00,
        target_quantity: 10,
        profit_target: 165.00,
        stop_loss: 145.00,
        position_thesis: 'Valid Short Put position',
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

      // Act: Create position
      await positionService.create(validPosition)
      const loaded = await positionService.getById('new-valid-2')

      // Assert: Position created successfully with correct values
      expect(loaded).not.toBeNull()
      expect(loaded!.strategy_type).toBe('Short Put')
      expect(loaded!.trade_kind).toBe('option')
      expect(loaded!.option_type).toBe('put')
      expect(loaded!.strike_price).toBe(150.00)
    })

    it('should verify new position has explicit fields in raw database', async () => {
      // Arrange: Create new position through service
      const validPosition: Position = {
        id: 'new-valid-3',
        symbol: 'NVDA',
        strategy_type: 'Long Stock',
        trade_kind: 'stock',
        target_entry_price: 450.00,
        target_quantity: 10,
        profit_target: 500.00,
        stop_loss: 430.00,
        position_thesis: 'Verify raw storage',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
      }

      // Act: Create position
      await positionService.create(validPosition)

      // Read directly from database (bypassing service)
      const rawPosition = await new Promise<any>((resolve, reject) => {
        const transaction = db.transaction(['positions'], 'readonly')
        const store = transaction.objectStore('positions')
        const request = store.get('new-valid-3')
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result)
      })

      // Assert: Raw database has explicit fields
      expect(rawPosition).toBeDefined()
      expect(rawPosition.strategy_type).toBe('Long Stock')
      expect(rawPosition.trade_kind).toBe('stock')
    })
  })

  describe('migration works with getAll()', () => {
    it('should migrate all legacy positions when loading with getAll()', async () => {
      // Arrange: Insert multiple legacy positions
      const legacyPositions = [
        {
          id: 'bulk-legacy-1',
          symbol: 'IBM',
          target_entry_price: 170.00,
          target_quantity: 50,
          profit_target: 180.00,
          stop_loss: 165.00,
          position_thesis: 'Bulk test 1',
          created_date: new Date('2025-01-01'),
          status: 'planned',
          journal_entry_ids: [],
          trades: []
        },
        {
          id: 'bulk-legacy-2',
          symbol: 'ORCL',
          target_entry_price: 110.00,
          target_quantity: 40,
          profit_target: 120.00,
          stop_loss: 105.00,
          position_thesis: 'Bulk test 2',
          created_date: new Date('2025-01-01'),
          status: 'planned',
          journal_entry_ids: [],
          trades: []
        }
      ]

      for (const position of legacyPositions) {
        await new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(['positions'], 'readwrite')
          const store = transaction.objectStore('positions')
          const request = store.add(position)
          request.onerror = () => reject(request.error)
          request.onsuccess = () => resolve()
        })
      }

      // Act: Load all positions
      const allPositions = await positionService.getAll()

      // Assert: All positions migrated
      expect(allPositions.length).toBe(2)
      allPositions.forEach(position => {
        expect(position.strategy_type).toBe('Long Stock')
        expect(position.trade_kind).toBe('stock')
      })
    })

    it('should handle mixed legacy and modern positions with getAll()', async () => {
      // Arrange: Insert mix of legacy and modern positions
      const legacyPosition = {
        id: 'mixed-legacy-1',
        symbol: 'AMD',
        target_entry_price: 120.00,
        target_quantity: 30,
        profit_target: 130.00,
        stop_loss: 115.00,
        position_thesis: 'Legacy in mixed set',
        created_date: new Date('2025-01-01'),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
      }

      const modernPosition = {
        id: 'mixed-modern-1',
        symbol: 'NVDA',
        strategy_type: 'Short Put',
        trade_kind: 'option',
        target_entry_price: 450.00,
        target_quantity: 10,
        profit_target: 500.00,
        stop_loss: 430.00,
        position_thesis: 'Modern in mixed set',
        created_date: new Date('2025-01-01'),
        status: 'planned',
        journal_entry_ids: [],
        trades: [],
        option_type: 'put',
        strike_price: 450.00,
        expiration_date: new Date('2026-12-31'),
        profit_target_basis: 'option',
        stop_loss_basis: 'option'
      }

      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(['positions'], 'readwrite')
        const store = transaction.objectStore('positions')
        const request1 = store.add(legacyPosition)
        request1.onsuccess = () => {
          const request2 = store.add(modernPosition)
          request2.onsuccess = () => resolve()
          request2.onerror = () => reject(request2.error)
        }
        request1.onerror = () => reject(request1.error)
      })

      // Act: Load all positions
      const allPositions = await positionService.getAll()

      // Assert: Legacy migrated, modern preserved
      expect(allPositions.length).toBe(2)

      const legacy = allPositions.find(p => p.id === 'mixed-legacy-1')
      expect(legacy).toBeDefined()
      expect(legacy!.strategy_type).toBe('Long Stock')
      expect(legacy!.trade_kind).toBe('stock')

      const modern = allPositions.find(p => p.id === 'mixed-modern-1')
      expect(modern).toBeDefined()
      expect(modern!.strategy_type).toBe('Short Put')
      expect(modern!.trade_kind).toBe('option')
    })
  })
})
