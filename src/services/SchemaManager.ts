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
   * @param transaction - Upgrade transaction used to access existing stores
   */
  static initializeSchema(
    db: IDBDatabase,
    version: number,
    transaction?: IDBTransaction
  ): void {
    const shouldAddV4Indexes = version >= 4
    const getOrCreateStore = (
      name: string,
      options: IDBObjectStoreParameters
    ): IDBObjectStore | null => {
      if (db.objectStoreNames.contains(name)) {
        return transaction ? transaction.objectStore(name) : null
      }
      return db.createObjectStore(name, options)
    }

    const ensureIndex = (
      store: IDBObjectStore,
      name: string,
      keyPath: string | string[],
      options?: IDBIndexParameters
    ): void => {
      if (!store.indexNames.contains(name)) {
        store.createIndex(name, keyPath, options)
      }
    }

    // Create positions object store
    const positionStore = getOrCreateStore('positions', { keyPath: 'id' })
    if (positionStore) {
      ensureIndex(positionStore, 'symbol', 'symbol', { unique: false })
      ensureIndex(positionStore, 'status', 'status', { unique: false })
      ensureIndex(positionStore, 'created_date', 'created_date', { unique: false })
      if (shouldAddV4Indexes) {
        ensureIndex(positionStore, 'strategy_type', 'strategy_type', { unique: false })
        ensureIndex(positionStore, 'trade_kind', 'trade_kind', { unique: false })
      }
    }

    // Create journal_entries object store
    const journalStore = getOrCreateStore('journal_entries', { keyPath: 'id' })
    if (journalStore) {
      ensureIndex(journalStore, 'position_id', 'position_id', { unique: false })
      ensureIndex(journalStore, 'trade_id', 'trade_id', { unique: false })
      ensureIndex(journalStore, 'entry_type', 'entry_type', { unique: false })
      ensureIndex(journalStore, 'created_at', 'created_at', { unique: false })
    }

    // Create price_history object store
    const priceStore = getOrCreateStore('price_history', { keyPath: 'id' })
    if (priceStore) {
      // Compound unique index: ensures one price per underlying per date
      ensureIndex(priceStore, 'underlying_date', ['underlying', 'date'], { unique: true })

      // Individual indexes for efficient lookups
      ensureIndex(priceStore, 'underlying', 'underlying', { unique: false })
      ensureIndex(priceStore, 'date', 'date', { unique: false })
      ensureIndex(priceStore, 'updated_at', 'updated_at', { unique: false })
    }
  }
}
