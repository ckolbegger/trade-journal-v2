import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SchemaManager } from '../SchemaManager'
import 'fake-indexeddb/auto'

/**
 * Comprehensive test suite for database v3→v4 migration
 *
 * This test suite verifies the migration from database version 3 to version 4
 * which adds support for option strategies including:
 * - strategy_type field (defaults existing positions to 'Long Stock')
 * - Optional option fields (option_type, strike_price, expiration_date, premium_per_contract)
 */
describe('SchemaManager - Database v3→v4 Migration', () => {
  const dbName = 'TestMigrationDB'
  let db: IDBDatabase

  /**
   * Helper to create a v3 database with existing positions
   * (simulates production state before migration)
   */
  async function createV3Database(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 3)

      request.onerror = () => reject(request.error)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        SchemaManager.initializeSchema(event, db)
      }

      request.onsuccess = () => {
        const database = request.result
        // Add some test positions in v3 format (without strategy_type)
        const transaction = database.transaction(['positions'], 'readwrite')
        const store = transaction.objectStore('positions')

        const v3Position = {
          id: 'v3-position-1',
          symbol: 'AAPL',
          target_entry_price: 150,
          target_quantity: 100,
          profit_target: 170,
          stop_loss: 140,
          position_thesis: 'Test position for migration',
          created_date: new Date('2024-01-01'),
          journal_entry_ids: [],
          trades: []
        }

        store.add(v3Position)

        transaction.oncomplete = () => resolve(database)
        transaction.onerror = () => reject(transaction.error)
      }
    })
  }

  /**
   * Helper to upgrade database to specific version
   */
  async function upgradeDatabase(toVersion: number): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, toVersion)

      request.onerror = () => reject(request.error)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        SchemaManager.initializeSchema(event, db)
      }

      request.onsuccess = () => resolve(request.result)
    })
  }

  beforeEach(async () => {
    // Clean up any existing database
    const deleteRequest = indexedDB.deleteDatabase(dbName)
    await new Promise<void>((resolve) => {
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => resolve()
    })
  })

  afterEach(() => {
    if (db) {
      db.close()
    }
  })

  describe('Migration Triggering', () => {
    it('should increment database version from 3 to 4', async () => {
      // Arrange: Create v3 database
      const v3Db = await createV3Database()
      expect(v3Db.version).toBe(3)
      v3Db.close()

      // Act: Open with version 4 to trigger migration
      db = await upgradeDatabase(4)

      // Assert: Version is now 4
      expect(db.version).toBe(4)
    })

    it('should run migration handler automatically on upgrade from v3 to v4', async () => {
      // Arrange: Create v3 database with position
      const v3Db = await createV3Database()
      v3Db.close()

      // Act: Trigger upgrade to v4
      db = await upgradeDatabase(4)

      // Assert: Migration completed (position still accessible)
      const transaction = db.transaction(['positions'], 'readonly')
      const store = transaction.objectStore('positions')
      const request = store.get('v3-position-1')

      const position = await new Promise<any>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      expect(position).toBeDefined()
      expect(position.id).toBe('v3-position-1')
    })
  })

  describe('strategy_type Defaulting', () => {
    it('should default existing positions without strategy_type to "Long Stock"', async () => {
      // Arrange: Create v3 database (positions have no strategy_type field)
      const v3Db = await createV3Database()
      v3Db.close()

      // Act: Migrate to v4
      db = await upgradeDatabase(4)

      // Assert: Position now has strategy_type = 'Long Stock'
      const transaction = db.transaction(['positions'], 'readonly')
      const store = transaction.objectStore('positions')
      const request = store.get('v3-position-1')

      const position = await new Promise<any>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      expect(position.strategy_type).toBe('Long Stock')
    })

    it('should preserve existing strategy_type if already set', async () => {
      // Arrange: Create v3 database with position that has strategy_type
      const v3Db = await createV3Database()
      v3Db.close()

      // Add a position with strategy_type already set (edge case)
      db = await upgradeDatabase(4)

      const tx = db.transaction(['positions'], 'readwrite')
      const store = tx.objectStore('positions')

      const positionWithStrategy = {
        id: 'v3-position-with-strategy',
        symbol: 'TSLA',
        strategy_type: 'Short Put',
        option_type: 'put',
        strike_price: 200,
        expiration_date: '2025-01-17',
        premium_per_contract: 5.50,
        target_entry_price: 200,
        target_quantity: 5,
        profit_target: 190,
        stop_loss: 180,
        position_thesis: 'Test Short Put',
        created_date: new Date(),
        journal_entry_ids: [],
        trades: []
      }

      await new Promise<void>((resolve, reject) => {
        const request = store.add(positionWithStrategy)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      // Close and reopen to trigger potential migration again
      db.close()
      db = await upgradeDatabase(4)

      // Assert: strategy_type preserved
      const readTx = db.transaction(['positions'], 'readonly')
      const readStore = readTx.objectStore('positions')
      const request = readStore.get('v3-position-with-strategy')

      const position = await new Promise<any>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      expect(position.strategy_type).toBe('Short Put')
    })
  })

  describe('Option Fields Handling', () => {
    it('should allow positions without option_fields (they remain valid)', async () => {
      // Arrange: Create v3 database with Long Stock position
      const v3Db = await createV3Database()
      v3Db.close()

      // Act: Migrate to v4
      db = await upgradeDatabase(4)

      // Assert: Position is still valid and accessible
      const transaction = db.transaction(['positions'], 'readonly')
      const store = transaction.objectStore('positions')
      const request = store.get('v3-position-1')

      const position = await new Promise<any>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      expect(position).toBeDefined()
      expect(position.id).toBe('v3-position-1')
      expect(position.strategy_type).toBe('Long Stock')
      // Option fields should be undefined (not required)
      expect(position.option_type).toBeUndefined()
      expect(position.strike_price).toBeUndefined()
      expect(position.expiration_date).toBeUndefined()
      expect(position.premium_per_contract).toBeUndefined()
    })

    it('should allow new positions with option_fields in v4', async () => {
      // Arrange: Create v4 database fresh
      db = await upgradeDatabase(4)

      // Act: Create a Short Put position with option fields
      const transaction = db.transaction(['positions'], 'readwrite')
      const store = transaction.objectStore('positions')

      const shortPutPosition = {
        id: 'short-put-1',
        symbol: 'AAPL',
        strategy_type: 'Short Put',
        option_type: 'put',
        strike_price: 150,
        expiration_date: '2025-01-17',
        premium_per_contract: 3.50,
        target_entry_price: 150,
        target_quantity: 5,
        profit_target_basis: 'stock_price',
        profit_target: 145,
        stop_loss_basis: 'stock_price',
        stop_loss: 155,
        position_thesis: 'Bullish on AAPL',
        created_date: new Date(),
        journal_entry_ids: [],
        trades: []
      }

      await new Promise<void>((resolve, reject) => {
        const request = store.add(shortPutPosition)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      // Assert: Position saved with all option fields
      const readTransaction = db.transaction(['positions'], 'readonly')
      const readStore = readTransaction.objectStore('positions')
      const getRequest = readStore.get('short-put-1')

      const savedPosition = await new Promise<any>((resolve, reject) => {
        getRequest.onsuccess = () => resolve(getRequest.result)
        getRequest.onerror = () => reject(getRequest.error)
      })

      expect(savedPosition.strategy_type).toBe('Short Put')
      expect(savedPosition.option_type).toBe('put')
      expect(savedPosition.strike_price).toBe(150)
      expect(savedPosition.expiration_date).toBe('2025-01-17')
      expect(savedPosition.premium_per_contract).toBe(3.50)
    })
  })

  describe('Data Preservation', () => {
    it('should preserve all existing position data during migration', async () => {
      // Arrange: Create v3 database with position
      const v3Db = await createV3Database()
      v3Db.close()

      // Act: Migrate to v4
      db = await upgradeDatabase(4)

      // Assert: All original data preserved
      const transaction = db.transaction(['positions'], 'readonly')
      const store = transaction.objectStore('positions')
      const request = store.get('v3-position-1')

      const position = await new Promise<any>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      // Verify all original fields
      expect(position.id).toBe('v3-position-1')
      expect(position.symbol).toBe('AAPL')
      expect(position.target_entry_price).toBe(150)
      expect(position.target_quantity).toBe(100)
      expect(position.profit_target).toBe(170)
      expect(position.stop_loss).toBe(140)
      expect(position.position_thesis).toBe('Test position for migration')
      expect(position.journal_entry_ids).toEqual([])
      expect(position.trades).toEqual([])
      // created_date should be preserved (may be Date object or string)
      expect(new Date(position.created_date).toISOString()).toBe(new Date('2024-01-01').toISOString())
    })

    it('should preserve journal entries during migration', async () => {
      // Arrange: Create v3 database with positions and journal entries
      const v3Db = await createV3Database()

      // Add a journal entry in v3
      const tx = v3Db.transaction(['journal_entries'], 'readwrite')
      const journalStore = tx.objectStore('journal_entries')

      const journalEntry = {
        id: 'journal-1',
        position_id: 'v3-position-1',
        entry_type: 'position_plan',
        fields: [{ prompt: 'What is your thesis?', response: 'Test thesis' }],
        created_at: new Date()
      }

      await new Promise<void>((resolve, reject) => {
        const request = journalStore.add(journalEntry)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      v3Db.close()

      // Act: Migrate to v4
      db = await upgradeDatabase(4)

      // Assert: Journal entry still exists
      const readTx = db.transaction(['journal_entries'], 'readonly')
      const readStore = readTx.objectStore('journal_entries')
      const request = readStore.get('journal-1')

      const entry = await new Promise<any>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      expect(entry).toBeDefined()
      expect(entry.id).toBe('journal-1')
      expect(entry.position_id).toBe('v3-position-1')
    })

    it('should preserve price history during migration', async () => {
      // Arrange: Create v3 database with price history
      const v3Db = await createV3Database()

      // Add price history in v3
      const tx = v3Db.transaction(['price_history'], 'readwrite')
      const priceStore = tx.objectStore('price_history')

      const priceHistory = {
        id: 'price-1',
        underlying: 'AAPL',
        date: '2024-01-01',
        close_price: 150,
        updated_at: new Date()
      }

      await new Promise<void>((resolve, reject) => {
        const request = priceStore.add(priceHistory)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      v3Db.close()

      // Act: Migrate to v4
      db = await upgradeDatabase(4)

      // Assert: Price history still exists
      const readTx = db.transaction(['price_history'], 'readonly')
      const readStore = readTx.objectStore('price_history')
      const request = readStore.get('price-1')

      const price = await new Promise<any>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      expect(price).toBeDefined()
      expect(price.id).toBe('price-1')
      expect(price.underlying).toBe('AAPL')
      expect(price.close_price).toBe(150)
    })
  })

  describe('Idempotency', () => {
    it('should be idempotent - running migration twice does not corrupt data', async () => {
      // Arrange: Create v3 database
      const v3Db = await createV3Database()
      v3Db.close()

      // Act: Run migration first time
      db = await upgradeDatabase(4)

      // Get position after first migration
      const tx1 = db.transaction(['positions'], 'readonly')
      const store1 = tx1.objectStore('positions')
      const request1 = store1.get('v3-position-1')

      const position1 = await new Promise<any>((resolve, reject) => {
        request1.onsuccess = () => resolve(request1.result)
        request1.onerror = () => reject(request1.error)
      })

      db.close()

      // Run migration second time (same version, should not re-migrate)
      db = await upgradeDatabase(4)

      // Get position after second migration
      const tx2 = db.transaction(['positions'], 'readonly')
      const store2 = tx2.objectStore('positions')
      const request2 = store2.get('v3-position-1')

      const position2 = await new Promise<any>((resolve, reject) => {
        request2.onsuccess = () => resolve(request2.result)
        request2.onerror = () => reject(request2.error)
      })

      // Assert: Both migrations produce same result
      expect(position2.strategy_type).toBe(position1.strategy_type)
      expect(position2.strategy_type).toBe('Long Stock')
      expect(position2.symbol).toBe(position1.symbol)
      expect(position2.target_entry_price).toBe(position1.target_entry_price)
    })

    it('should not duplicate strategy_type if already set', async () => {
      // Arrange: Create v3 database
      const v3Db = await createV3Database()
      v3Db.close()

      // Act: Migrate to v4
      db = await upgradeDatabase(4)

      // Close and reopen at same version (no migration should run)
      db.close()
      db = await upgradeDatabase(4)

      // Assert: strategy_type is still 'Long Stock' (not duplicated or changed)
      const transaction = db.transaction(['positions'], 'readonly')
      const store = transaction.objectStore('positions')
      const request = store.get('v3-position-1')

      const position = await new Promise<any>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      expect(position.strategy_type).toBe('Long Stock')
      expect(typeof position.strategy_type).toBe('string')
    })
  })

  describe('Schema Compatibility', () => {
    it('should maintain all existing object stores after migration', async () => {
      // Arrange: Create v3 database
      const v3Db = await createV3Database()
      const v3StoreNames = Array.from(v3Db.objectStoreNames)
      v3Db.close()

      // Act: Migrate to v4
      db = await upgradeDatabase(4)

      // Assert: All stores still exist
      const v4StoreNames = Array.from(db.objectStoreNames)

      expect(v4StoreNames).toContain('positions')
      expect(v4StoreNames).toContain('journal_entries')
      expect(v4StoreNames).toContain('price_history')
      expect(v4StoreNames.length).toBe(v3StoreNames.length)
    })

    it('should maintain all existing indexes after migration', async () => {
      // Arrange: Create v3 database
      const v3Db = await createV3Database()
      v3Db.close()

      // Act: Migrate to v4
      db = await upgradeDatabase(4)

      // Assert: All indexes still exist
      const transaction = db.transaction(['positions'], 'readonly')
      const store = transaction.objectStore('positions')

      expect(store.indexNames.contains('symbol')).toBe(true)
      expect(store.indexNames.contains('status')).toBe(true)
      expect(store.indexNames.contains('created_date')).toBe(true)
    })
  })

  describe('Fresh v4 Installation', () => {
    it('should create new v4 database without migration', async () => {
      // Act: Create fresh v4 database (no v3 to migrate from)
      db = await upgradeDatabase(4)

      // Assert: Database is at v4 with correct schema
      expect(db.version).toBe(4)
      expect(db.objectStoreNames.contains('positions')).toBe(true)
      expect(db.objectStoreNames.contains('journal_entries')).toBe(true)
      expect(db.objectStoreNames.contains('price_history')).toBe(true)
    })

    it('should allow creating Short Put positions in fresh v4 database', async () => {
      // Arrange: Create fresh v4 database
      db = await upgradeDatabase(4)

      // Act: Create Short Put position
      const transaction = db.transaction(['positions'], 'readwrite')
      const store = transaction.objectStore('positions')

      const shortPutPosition = {
        id: 'short-put-new',
        symbol: 'SPY',
        strategy_type: 'Short Put',
        option_type: 'put',
        strike_price: 400,
        expiration_date: '2025-02-21',
        premium_per_contract: 2.75,
        target_entry_price: 400,
        target_quantity: 10,
        profit_target_basis: 'option_price',
        profit_target: 20,
        stop_loss_basis: 'option_price',
        stop_loss: 10,
        position_thesis: 'Neutral to bullish view',
        created_date: new Date(),
        journal_entry_ids: [],
        trades: []
      }

      await new Promise<void>((resolve, reject) => {
        const request = store.add(shortPutPosition)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      // Assert: Position created successfully
      const readTx = db.transaction(['positions'], 'readonly')
      const readStore = readTx.objectStore('positions')
      const getRequest = readStore.get('short-put-new')

      const saved = await new Promise<any>((resolve, reject) => {
        getRequest.onsuccess = () => resolve(getRequest.result)
        getRequest.onerror = () => reject(getRequest.error)
      })

      expect(saved.strategy_type).toBe('Short Put')
      expect(saved.option_type).toBe('put')
      expect(saved.strike_price).toBe(400)
    })
  })
})
