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
   * @param db - IDBDatabase instance during onupgradeneeded event
   * @param version - Database version number
   */
  static initializeSchema(db: IDBDatabase, version: number): void {
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
}
