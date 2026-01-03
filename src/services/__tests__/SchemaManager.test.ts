import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SchemaManager } from '../SchemaManager'
import 'fake-indexeddb/auto'

describe('SchemaManager', () => {
  const dbName = 'TestSchemaDB'
  let db: IDBDatabase

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

  it('should create positions store with correct indexes', async () => {
    db = await openDatabaseWithSchema(dbName, 1)

    expect(db.objectStoreNames.contains('positions')).toBe(true)

    const transaction = db.transaction(['positions'], 'readonly')
    const store = transaction.objectStore('positions')

    expect(store.keyPath).toBe('id')
    expect(store.indexNames.contains('symbol')).toBe(true)
    expect(store.indexNames.contains('status')).toBe(true)
    expect(store.indexNames.contains('created_date')).toBe(true)
  })

  it('should create journal_entries store with correct indexes', async () => {
    db = await openDatabaseWithSchema(dbName, 1)

    expect(db.objectStoreNames.contains('journal_entries')).toBe(true)

    const transaction = db.transaction(['journal_entries'], 'readonly')
    const store = transaction.objectStore('journal_entries')

    expect(store.keyPath).toBe('id')
    expect(store.indexNames.contains('position_id')).toBe(true)
    expect(store.indexNames.contains('trade_id')).toBe(true)
    expect(store.indexNames.contains('entry_type')).toBe(true)
    expect(store.indexNames.contains('created_at')).toBe(true)
  })

  it('should create price_history store with correct indexes', async () => {
    db = await openDatabaseWithSchema(dbName, 1)

    expect(db.objectStoreNames.contains('price_history')).toBe(true)

    const transaction = db.transaction(['price_history'], 'readonly')
    const store = transaction.objectStore('price_history')

    expect(store.keyPath).toBe('id')
    expect(store.indexNames.contains('underlying_date')).toBe(true)
    expect(store.indexNames.contains('underlying')).toBe(true)
    expect(store.indexNames.contains('date')).toBe(true)
    expect(store.indexNames.contains('updated_at')).toBe(true)

    // Verify compound index uniqueness
    const underlyingDateIndex = store.index('underlying_date')
    expect(underlyingDateIndex.unique).toBe(true)
  })

  it('should not recreate existing stores', async () => {
    // Open database first time
    db = await openDatabaseWithSchema(dbName, 1)

    // Add test data
    const transaction = db.transaction(['positions'], 'readwrite')
    const store = transaction.objectStore('positions')
    const testPosition = {
      id: 'test-1',
      symbol: 'TEST',
      strategy_type: 'Long Stock',
      target_entry_price: 100,
      target_quantity: 10,
      profit_target: 110,
      stop_loss: 90,
      position_thesis: 'Test thesis',
      created_date: new Date(),
      status: 'planned',
      journal_entry_ids: [],
      trades: []
    }
    store.add(testPosition)

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })

    db.close()

    // Reopen with same version - should not recreate
    db = await openDatabaseWithSchema(dbName, 1)

    // Verify data still exists
    const readTransaction = db.transaction(['positions'], 'readonly')
    const readStore = readTransaction.objectStore('positions')
    const getRequest = readStore.get('test-1')

    const result = await new Promise<any>((resolve, reject) => {
      getRequest.onsuccess = () => resolve(getRequest.result)
      getRequest.onerror = () => reject(getRequest.error)
    })

    expect(result).toBeDefined()
    expect(result.id).toBe('test-1')
  })

  it('should handle version upgrades correctly', async () => {
    // Open with version 1
    db = await openDatabaseWithSchema(dbName, 1)
    expect(db.version).toBe(1)
    expect(db.objectStoreNames.length).toBe(3)
    db.close()

    // Upgrade to version 4 (schema should remain compatible)
    db = await openDatabaseWithSchema(dbName, 4)
    expect(db.version).toBe(4)

    // All stores should still exist
    expect(db.objectStoreNames.contains('positions')).toBe(true)
    expect(db.objectStoreNames.contains('journal_entries')).toBe(true)
    expect(db.objectStoreNames.contains('price_history')).toBe(true)
  })

  it('should add v4 indexes when upgrading from v3', async () => {
    db = await openDatabaseWithSchema(dbName, 3)

    const v3Store = db.transaction(['positions'], 'readonly').objectStore('positions')
    expect(v3Store.indexNames.contains('strategy_type')).toBe(false)
    expect(v3Store.indexNames.contains('trade_kind')).toBe(false)
    db.close()

    db = await openDatabaseWithSchema(dbName, 4)
    const positionStore = db.transaction(['positions'], 'readonly').objectStore('positions')
    expect(positionStore.indexNames.contains('strategy_type')).toBe(true)
    expect(positionStore.indexNames.contains('trade_kind')).toBe(true)
  })

  it('should add missing indexes to existing stores on upgrade', async () => {
    db = await openDatabaseWithLegacySchema(dbName, 1)
    db.close()

    db = await openDatabaseWithSchema(dbName, 4)

    const positionStore = db.transaction(['positions'], 'readonly').objectStore('positions')
    expect(positionStore.indexNames.contains('symbol')).toBe(true)
    expect(positionStore.indexNames.contains('status')).toBe(true)
    expect(positionStore.indexNames.contains('created_date')).toBe(true)
    expect(positionStore.indexNames.contains('strategy_type')).toBe(true)
    expect(positionStore.indexNames.contains('trade_kind')).toBe(true)

    const journalStore = db.transaction(['journal_entries'], 'readonly').objectStore('journal_entries')
    expect(journalStore.indexNames.contains('position_id')).toBe(true)
    expect(journalStore.indexNames.contains('trade_id')).toBe(true)
    expect(journalStore.indexNames.contains('entry_type')).toBe(true)
    expect(journalStore.indexNames.contains('created_at')).toBe(true)

    const priceStore = db.transaction(['price_history'], 'readonly').objectStore('price_history')
    expect(priceStore.indexNames.contains('underlying_date')).toBe(true)
    expect(priceStore.indexNames.contains('underlying')).toBe(true)
    expect(priceStore.indexNames.contains('date')).toBe(true)
    expect(priceStore.indexNames.contains('updated_at')).toBe(true)
  })
})

/**
 * Helper function to open database with SchemaManager
 */
function openDatabaseWithSchema(dbName: string, version: number): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      SchemaManager.initializeSchema(db, version, request.transaction || undefined)
    }
  })
}

function openDatabaseWithLegacySchema(dbName: string, version: number): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      const positionStore = db.createObjectStore('positions', { keyPath: 'id' })
      positionStore.createIndex('symbol', 'symbol', { unique: false })

      const journalStore = db.createObjectStore('journal_entries', { keyPath: 'id' })
      journalStore.createIndex('position_id', 'position_id', { unique: false })

      const priceStore = db.createObjectStore('price_history', { keyPath: 'id' })
      priceStore.createIndex('underlying_date', ['underlying', 'date'], { unique: true })
      priceStore.createIndex('underlying', 'underlying', { unique: false })
      priceStore.createIndex('date', 'date', { unique: false })
    }
  })
}
