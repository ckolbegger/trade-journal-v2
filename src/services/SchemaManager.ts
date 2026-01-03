/**
 * SchemaManager - Centralized database schema initialization
 *
 * Manages IndexedDB object store creation and index definitions.
 * Ensures all stores are created with correct schema regardless of which service initializes first.
 */
export class SchemaManager {
  /**
   * Initialize all database object stores and indexes
   *
   * @param event - IDBVersionChangeEvent from onupgradeneeded
   * @param db - IDBDatabase instance during onupgradeneeded event
   */
  static initializeSchema(event: IDBVersionChangeEvent, db: IDBDatabase): void {
    const oldVersion = event.oldVersion

    // Handle v3 → v4 migration: Add strategy_type and option fields support
    if (oldVersion < 4) {
      this.migrateV3ToV4(event.target as IDBOpenDBRequest)
    }

    // Create positions object store
    if (!db.objectStoreNames.contains('positions')) {
      const positionStore = db.createObjectStore('positions', { keyPath: 'id' })
      positionStore.createIndex('symbol', 'symbol', { unique: false })
      positionStore.createIndex('status', 'status', { unique: false })
      positionStore.createIndex('created_date', 'created_date', { unique: false })
    }

    // Create journal_entries object store
    if (!db.objectStoreNames.contains('journal_entries')) {
      const journalStore = db.createObjectStore('journal_entries', { keyPath: 'id' })
      journalStore.createIndex('position_id', 'position_id', { unique: false })
      journalStore.createIndex('trade_id', 'trade_id', { unique: false })
      journalStore.createIndex('entry_type', 'entry_type', { unique: false })
      journalStore.createIndex('created_at', 'created_at', { unique: false })
    }

    // Create price_history object store
    if (!db.objectStoreNames.contains('price_history')) {
      const priceStore = db.createObjectStore('price_history', { keyPath: 'id' })

      // Compound unique index: ensures one price per underlying per date
      priceStore.createIndex('underlying_date', ['underlying', 'date'], { unique: true })

      // Individual indexes for efficient lookups
      priceStore.createIndex('underlying', 'underlying', { unique: false })
      priceStore.createIndex('date', 'date', { unique: false })
      priceStore.createIndex('updated_at', 'updated_at', { unique: false })
    }
  }

  /**
   * Migrate database from version 3 to version 4
   *
   * Adds support for option strategies:
   * - strategy_type field (defaults existing positions to 'Long Stock')
   * - Optional option fields (option_type, strike_price, expiration_date, premium_per_contract)
   *
   * @param request - IDBOpenDBRequest from onupgradeneeded event
   */
  private static migrateV3ToV4(request: IDBOpenDBRequest): void {
    const db = request.result

    // Only run migration if positions store exists (it should in v3)
    if (!db.objectStoreNames.contains('positions')) {
      return
    }

    // Use the existing versionchange transaction
    const transaction = request.transaction
    if (!transaction) {
      console.error('No transaction available during upgrade')
      return
    }

    const positionStore = transaction.objectStore('positions')
    const getAllRequest = positionStore.getAll()

    getAllRequest.onsuccess = () => {
      const positions = getAllRequest.result

      // Migrate each position
      positions.forEach((position) => {
        if (position.strategy_type === undefined) {
          position.strategy_type = 'Long Stock'
          positionStore.put(position)
        }
      })
    }

    getAllRequest.onerror = () => {
      console.error('Error migrating positions from v3 to v4:', getAllRequest.error)
    }
  }
}
