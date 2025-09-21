import type { JournalEntry, JournalField } from '@/types/journal';

export interface CreateJournalEntryRequest {
  id?: string;
  position_id?: string;
  trade_id?: string;
  entry_type: 'position_plan' | 'trade_execution';
  fields: JournalField[];
  created_at?: string;
  executed_at?: string;
}

export interface UpdateJournalEntryRequest {
  fields?: JournalField[];
  executed_at?: string;
}

export class JournalService {
  private db: IDBDatabase;

  constructor(db: IDBDatabase) {
    this.db = db;
  }

  async create(request: CreateJournalEntryRequest): Promise<JournalEntry> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['journal_entries'], 'readwrite');
      const store = transaction.objectStore('journal_entries');

      const entry: JournalEntry = {
        id: request.id || `journal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        position_id: request.position_id,
        trade_id: request.trade_id,
        entry_type: request.entry_type,
        fields: request.fields,
        created_at: request.created_at || new Date().toISOString(),
        executed_at: request.executed_at
      };

      const addRequest = store.add(entry);

      addRequest.onsuccess = () => {
        resolve(entry);
      };

      addRequest.onerror = () => {
        reject(new Error('Failed to create journal entry'));
      };
    });
  }

  async findById(id: string): Promise<JournalEntry | undefined> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['journal_entries'], 'readonly');
      const store = transaction.objectStore('journal_entries');
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error('Failed to find journal entry'));
      };
    });
  }

  async findByPositionId(positionId: string): Promise<JournalEntry[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['journal_entries'], 'readonly');
      const store = transaction.objectStore('journal_entries');
      const index = store.index('position_id');
      const request = index.getAll(positionId);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error('Failed to find journal entries by position'));
      };
    });
  }

  async findByTradeId(tradeId: string): Promise<JournalEntry[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['journal_entries'], 'readonly');
      const store = transaction.objectStore('journal_entries');
      const index = store.index('trade_id');
      const request = index.getAll(tradeId);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error('Failed to find journal entries by trade'));
      };
    });
  }

  async update(id: string, updates: UpdateJournalEntryRequest): Promise<JournalEntry> {
    return new Promise(async (resolve, reject) => {
      const existing = await this.findById(id);
      if (!existing) {
        reject(new Error('Journal entry not found'));
        return;
      }

      const transaction = this.db.transaction(['journal_entries'], 'readwrite');
      const store = transaction.objectStore('journal_entries');

      const updated: JournalEntry = {
        ...existing,
        ...updates
      };

      const putRequest = store.put(updated);

      putRequest.onsuccess = () => {
        resolve(updated);
      };

      putRequest.onerror = () => {
        reject(new Error('Failed to update journal entry'));
      };
    });
  }

  async delete(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['journal_entries'], 'readwrite');
      const store = transaction.objectStore('journal_entries');
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to delete journal entry'));
      };
    });
  }

  async clearAll(): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['journal_entries'], 'readwrite');
      const store = transaction.objectStore('journal_entries');
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to clear journal entries'));
      };
    });
  }

  close(): void {
    // JournalService receives database from constructor, so we don't close it here
    // The caller is responsible for closing the database connection
  }
}