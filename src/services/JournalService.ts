import type { JournalEntry, JournalField } from '@/types/journal';
import { JOURNAL_PROMPTS } from '@/types/journal';

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

  private validateJournalRequest(request: CreateJournalEntryRequest): void {
    // Must have either position_id or trade_id
    if (!request.position_id && !request.trade_id) {
      throw new Error('Journal entry must have either position_id or trade_id');
    }

    // Validate trade_id is not empty string
    if (request.trade_id === '') {
      throw new Error('trade_id cannot be empty string');
    }

    // Warn if trade_execution entry has no trade_id
    if (request.entry_type === 'trade_execution' && !request.trade_id) {
      console.warn(`trade_execution entry created without trade_id for journal ${request.id || 'new'}`);
    }

    // Must have at least one field
    if (!request.fields || request.fields.length === 0) {
      throw new Error('At least one journal field is required');
    }

    // Validate thesis field if present
    const thesisField = request.fields.find(field => field.name === 'thesis');
    if (thesisField) {
      this.validateThesisContent(thesisField.response);
    }
  }

  private validateUpdateRequest(updates: UpdateJournalEntryRequest): void {
    if (updates.fields) {
      const thesisField = updates.fields.find(field => field.name === 'thesis');
      if (thesisField) {
        this.validateThesisContent(thesisField.response);
      }
    }
  }

  private validateThesisContent(content: string): void {
    if (content.trim().length > 0 && content.trim().length < 10) {
      throw new Error('Thesis response must be at least 10 characters');
    }
    if (content.length > 2000) {
      throw new Error('Thesis response cannot exceed 2000 characters');
    }
  }

  async create(request: CreateJournalEntryRequest): Promise<JournalEntry> {
    return new Promise((resolve, reject) => {
      try {
        this.validateJournalRequest(request);
      } catch (error) {
        reject(error);
        return;
      }

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

  async getById(id: string): Promise<JournalEntry | null> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['journal_entries'], 'readonly');
      const store = transaction.objectStore('journal_entries');
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
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

  // Standardized method name alias for consistency with glm-code branch
  async getByPositionId(positionId: string): Promise<JournalEntry[]> {
    const entries = await this.findByPositionId(positionId);
    // Sort by created_at descending (newest first) to match glm-code behavior
    return entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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

  // Standardized method name for trade ID queries
  async getByTradeId(tradeId: string): Promise<JournalEntry[]> {
    return this.findByTradeId(tradeId);
  }

  async update(id: string, updates: UpdateJournalEntryRequest): Promise<JournalEntry> {
    return new Promise(async (resolve, reject) => {
      try {
        this.validateUpdateRequest(updates);
      } catch (error) {
        reject(error);
        return;
      }

      const existing = await this.getById(id);
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

  async getAll(): Promise<JournalEntry[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['journal_entries'], 'readonly');
      const store = transaction.objectStore('journal_entries');
      const index = store.index('created_at');
      const request = index.getAll();

      request.onsuccess = () => {
        const entries = request.result || [];
        // Sort by created_at descending (newest first)
        entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        resolve(entries);
      };

      request.onerror = () => {
        reject(new Error('Failed to get all journal entries'));
      };
    });
  }

  async deleteByPositionId(positionId: string): Promise<void> {
    // First, get all entries for the position
    const entries = await this.findByPositionId(positionId);

    if (entries.length === 0) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['journal_entries'], 'readwrite');
      const store = transaction.objectStore('journal_entries');

      let deletedCount = 0;

      entries.forEach(entry => {
        const deleteRequest = store.delete(entry.id);
        deleteRequest.onsuccess = () => {
          deletedCount++;
          if (deletedCount === entries.length) {
            resolve();
          }
        };
        deleteRequest.onerror = () => {
          reject(new Error('Failed to delete journal entries by position'));
        };
      });
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

  async createEmptyJournalEntry(
    entryType: 'position_plan' | 'trade_execution',
    positionId?: string,
    tradeId?: string
  ): Promise<JournalEntry> {
    // Generate unique ID
    const id = `journal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Get field definitions from current JOURNAL_PROMPTS
    const promptDefinitions = JOURNAL_PROMPTS[entryType];

    // Create empty fields from current definitions
    const fields: JournalField[] = promptDefinitions.map(definition => ({
      name: definition.name,
      prompt: definition.prompt,
      response: '', // Empty response for new entry
      required: definition.required
    }));

    // Create the journal entry
    const entry: JournalEntry = {
      id,
      position_id: positionId,
      trade_id: tradeId,
      entry_type: entryType,
      fields,
      created_at: new Date().toISOString()
    };

    return entry;
  }

  close(): void {
    // JournalService receives database from constructor, so we don't close it here
    // The caller is responsible for closing the database connection
  }
}