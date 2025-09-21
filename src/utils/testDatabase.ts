// Test Database Utilities for Journal Service Testing

const DB_NAME = 'TradingJournalTestDB';
const DB_VERSION = 2; // Incremented to add journal_entries table

export async function openTestDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create positions object store (if not exists)
      if (!db.objectStoreNames.contains('positions')) {
        const positionStore = db.createObjectStore('positions', { keyPath: 'id' });
        positionStore.createIndex('symbol', 'symbol', { unique: false });
        positionStore.createIndex('status', 'status', { unique: false });
        positionStore.createIndex('created_date', 'created_date', { unique: false });
      }

      // Create journal_entries object store
      if (!db.objectStoreNames.contains('journal_entries')) {
        const journalStore = db.createObjectStore('journal_entries', { keyPath: 'id' });
        journalStore.createIndex('position_id', 'position_id', { unique: false });
        journalStore.createIndex('trade_id', 'trade_id', { unique: false });
        journalStore.createIndex('entry_type', 'entry_type', { unique: false });
        journalStore.createIndex('created_at', 'created_at', { unique: false });
      }
    };
  });
}

export async function resetTestDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase(DB_NAME);

    deleteRequest.onerror = () => reject(deleteRequest.error);
    deleteRequest.onsuccess = () => resolve();
    deleteRequest.onblocked = () => {
      // Wait a bit and try again if blocked
      setTimeout(() => resolve(), 100);
    };
  });
}