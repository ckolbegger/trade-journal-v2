import { describe, it, expect, beforeEach } from 'vitest';
import { JournalService } from '@/services/JournalService';
import type { JournalEntry, JournalField } from '@/types/journal';

describe('JournalService', () => {
  let journalService: JournalService;

  beforeEach(async () => {
    // Use a unique database name for each test to ensure isolation
    const dbName = `JournalTestDB_${Date.now()}_${Math.random()}`;
    const db = await openDatabase(dbName);
    journalService = new JournalService(db);
  });

  async function openDatabase(dbName: string): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

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

  describe('create', () => {
    it('should create a position plan journal entry', async () => {
      const fields: JournalField[] = [
        {
          name: 'thesis',
          prompt: 'Why are you planning this position?',
          response: 'AAPL showing strong support at technical levels'
        },
        {
          name: 'market_conditions',
          prompt: 'Describe current market environment',
          response: 'Bullish trend with Fed pause expected'
        }
      ];

      const entry = await journalService.create({
        position_id: 'pos-123',
        entry_type: 'position_plan',
        fields,
        executed_at: '2024-01-15T10:00:00Z'
      });

      expect(entry.id).toBeDefined();
      expect(entry.position_id).toBe('pos-123');
      expect(entry.entry_type).toBe('position_plan');
      expect(entry.fields).toEqual(fields);
      expect(entry.created_at).toBeDefined();
      expect(entry.executed_at).toBe('2024-01-15T10:00:00Z');
    });

    it('should create a trade execution journal entry', async () => {
      const fields: JournalField[] = [
        {
          name: 'execution_notes',
          prompt: 'Describe the execution',
          response: 'Filled at $149.48, slightly better than target'
        }
      ];

      const entry = await journalService.create({
        trade_id: 'trade-456',
        entry_type: 'trade_execution',
        fields
      });

      expect(entry.trade_id).toBe('trade-456');
      expect(entry.entry_type).toBe('trade_execution');
      expect(entry.executed_at).toBeUndefined();
    });

    it('should allow empty responses in fields', async () => {
      const fields: JournalField[] = [
        {
          name: 'thesis',
          prompt: 'Why are you planning this position?',
          response: ''
        }
      ];

      const entry = await journalService.create({
        position_id: 'pos-123',
        entry_type: 'position_plan',
        fields
      });

      expect(entry.fields[0].response).toBe('');
    });
  });

  describe('findById', () => {
    it('should return journal entry by id', async () => {
      const created = await journalService.create({
        position_id: 'pos-123',
        entry_type: 'position_plan',
        fields: [{
          name: 'thesis',
          prompt: 'Why?',
          response: 'Test response'
        }]
      });

      const found = await journalService.findById(created.id);

      expect(found).toEqual(created);
    });

    it('should return undefined for non-existent id', async () => {
      const found = await journalService.findById('non-existent');
      expect(found).toBeUndefined();
    });
  });

  describe('findByPositionId', () => {
    it('should return all journal entries for a position', async () => {
      const entry1 = await journalService.create({
        position_id: 'pos-123',
        entry_type: 'position_plan',
        fields: []
      });

      const entry2 = await journalService.create({
        position_id: 'pos-123',
        entry_type: 'trade_execution',
        fields: []
      });

      // Different position
      await journalService.create({
        position_id: 'pos-456',
        entry_type: 'position_plan',
        fields: []
      });

      const entries = await journalService.findByPositionId('pos-123');

      expect(entries).toHaveLength(2);
      expect(entries.map(e => e.id)).toContain(entry1.id);
      expect(entries.map(e => e.id)).toContain(entry2.id);
    });

    it('should return empty array for position with no entries', async () => {
      const entries = await journalService.findByPositionId('non-existent');
      expect(entries).toEqual([]);
    });
  });

  describe('findByTradeId', () => {
    it('should return all journal entries for a trade', async () => {
      const entry = await journalService.create({
        trade_id: 'trade-123',
        entry_type: 'trade_execution',
        fields: []
      });

      const entries = await journalService.findByTradeId('trade-123');

      expect(entries).toHaveLength(1);
      expect(entries[0]).toEqual(entry);
    });
  });

  describe('update', () => {
    it('should update journal entry fields', async () => {
      const created = await journalService.create({
        position_id: 'pos-123',
        entry_type: 'position_plan',
        fields: [{
          name: 'thesis',
          prompt: 'Why?',
          response: 'Original response'
        }]
      });

      const updated = await journalService.update(created.id, {
        fields: [{
          name: 'thesis',
          prompt: 'Why?',
          response: 'Updated response'
        }]
      });

      expect(updated.fields[0].response).toBe('Updated response');
      expect(updated.created_at).toBe(created.created_at); // Unchanged
    });
  });

  describe('delete', () => {
    it('should delete journal entry', async () => {
      const created = await journalService.create({
        position_id: 'pos-123',
        entry_type: 'position_plan',
        fields: []
      });

      await journalService.delete(created.id);

      const found = await journalService.findById(created.id);
      expect(found).toBeUndefined();
    });
  });
});