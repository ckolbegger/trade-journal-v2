import 'fake-indexeddb/auto'
import { PositionService } from '@/lib/position'

/**
 * Test database utilities for integration tests
 * Provides isolated test database setup and cleanup
 */

let testDB: IDBDatabase | null = null

/**
 * Setup test database with fresh state
 */
export async function setupTestDB(): Promise<void> {
  // Close any existing connection
  if (testDB) {
    testDB.close()
    testDB = null
  }

  // Create fresh test database
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TradingJournalDB_Test', 3)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      testDB = request.result
      resolve()
    }

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

/**
 * Clear all data from test database
 */
export async function clearTestDB(): Promise<void> {
  if (!testDB) {
    return
  }

  return new Promise((resolve, reject) => {
    const transaction = testDB!.transaction(['positions', 'journal_entries'], 'readwrite')

    const positionStore = transaction.objectStore('positions')
    const journalStore = transaction.objectStore('journal_entries')

    const clearPositions = positionStore.clear()
    const clearJournals = journalStore.clear()

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)

    // Handle individual clear errors
    clearPositions.onerror = () => reject(clearPositions.error)
    clearJournals.onerror = () => reject(clearJournals.error)
  })
}

/**
 * Close test database connection
 */
export function closeTestDB(): void {
  if (testDB) {
    testDB.close()
    testDB = null
  }
}

/**
 * Create a test PositionService with isolated database
 */
export function createTestPositionService(): PositionService {
  // Override the database name for testing
  const service = new PositionService()

  // Monkey patch the database name for testing
  (service as any).dbName = 'TradingJournalDB_Test'

  return service
}