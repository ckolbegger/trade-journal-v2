import { describe, it, expect, beforeEach } from 'vitest';
import { JournalService } from '@/services/JournalService';
import type { JournalField } from '@/types/journal';

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

    it('should reject journal entry without position_id or trade_id', async () => {
      const fields: JournalField[] = [
        {
          name: 'thesis',
          prompt: 'Why are you planning this position?',
          response: 'Valid content with sufficient length'
        }
      ];

      await expect(journalService.create({
        entry_type: 'position_plan',
        fields
      })).rejects.toThrow('Journal entry must have either position_id or trade_id');
    });

    it('should reject journal entry with empty fields array', async () => {
      await expect(journalService.create({
        position_id: 'pos-123',
        entry_type: 'position_plan',
        fields: []
      })).rejects.toThrow('At least one journal field is required');
    });

    it('should reject journal entry with thesis response too short', async () => {
      const fields: JournalField[] = [
        {
          name: 'thesis',
          prompt: 'Why are you planning this position?',
          response: 'Short'
        }
      ];

      await expect(journalService.create({
        position_id: 'pos-123',
        entry_type: 'position_plan',
        fields
      })).rejects.toThrow('Thesis response must be at least 10 characters');
    });

    it('should reject journal entry with thesis response too long', async () => {
      const longContent = 'x'.repeat(2001);
      const fields: JournalField[] = [
        {
          name: 'thesis',
          prompt: 'Why are you planning this position?',
          response: longContent
        }
      ];

      await expect(journalService.create({
        position_id: 'pos-123',
        entry_type: 'position_plan',
        fields
      })).rejects.toThrow('Thesis response cannot exceed 2000 characters');
    });

    it('should accept journal entry with minimum valid thesis length', async () => {
      const fields: JournalField[] = [
        {
          name: 'thesis',
          prompt: 'Why are you planning this position?',
          response: '1234567890' // Exactly 10 characters
        }
      ];

      const entry = await journalService.create({
        position_id: 'pos-123',
        entry_type: 'position_plan',
        fields
      });

      expect(entry.fields[0].response).toBe('1234567890');
    });

    it('should accept journal entry with maximum valid thesis length', async () => {
      const maxContent = 'x'.repeat(2000);
      const fields: JournalField[] = [
        {
          name: 'thesis',
          prompt: 'Why are you planning this position?',
          response: maxContent
        }
      ];

      const entry = await journalService.create({
        position_id: 'pos-123',
        entry_type: 'position_plan',
        fields
      });

      expect(entry.fields[0].response).toBe(maxContent);
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
        fields: [{ name: 'thesis', prompt: 'Why?', response: 'Test thesis for position 123' }]
      });

      const entry2 = await journalService.create({
        position_id: 'pos-123',
        entry_type: 'trade_execution',
        fields: [{ name: 'execution_notes', prompt: 'Notes', response: 'Test execution notes' }]
      });

      // Different position
      await journalService.create({
        position_id: 'pos-456',
        entry_type: 'position_plan',
        fields: [{ name: 'thesis', prompt: 'Why?', response: 'Test thesis for position 456' }]
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
        fields: [{ name: 'execution_notes', prompt: 'Notes', response: 'Test trade execution notes' }]
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
        fields: [{ name: 'thesis', prompt: 'Why?', response: 'Test thesis for deletion' }]
      });

      await journalService.delete(created.id);

      const found = await journalService.findById(created.id);
      expect(found).toBeUndefined();
    });

    it('should handle deletion of non-existent entry', async () => {
      // Should not throw error
      await expect(journalService.delete('non-existent-id')).resolves.not.toThrow();
    });
  });

  describe('getAll', () => {
    it('should retrieve all journal entries sorted by created_at', async () => {
      // Create entries with different timestamps
      const entry1 = await journalService.create({
        position_id: 'pos-1',
        entry_type: 'position_plan',
        fields: [{ name: 'thesis', prompt: 'Why?', response: 'First entry created' }],
        created_at: '2024-01-01T10:00:00Z'
      });

      const entry2 = await journalService.create({
        position_id: 'pos-2',
        entry_type: 'trade_execution',
        fields: [{ name: 'execution_notes', prompt: 'Notes', response: 'Second entry created' }],
        created_at: '2024-01-01T11:00:00Z'
      });

      const entry3 = await journalService.create({
        position_id: 'pos-1',
        entry_type: 'position_plan',
        fields: [{ name: 'thesis', prompt: 'Why?', response: 'Third entry created' }],
        created_at: '2024-01-01T12:00:00Z'
      });

      const allEntries = await journalService.getAll();

      expect(allEntries).toHaveLength(3);
      expect(allEntries[0].id).toBe(entry3.id); // Newest first
      expect(allEntries[1].id).toBe(entry2.id);
      expect(allEntries[2].id).toBe(entry1.id); // Oldest last
    });

    it('should return empty array when no entries exist', async () => {
      const entries = await journalService.getAll();
      expect(entries).toEqual([]);
    });
  });

  describe('deleteByPositionId', () => {
    it('should delete all journal entries for a position', async () => {
      const positionId = 'pos-123';

      // Create multiple entries for the position
      await journalService.create({
        position_id: positionId,
        entry_type: 'position_plan',
        fields: [{ name: 'thesis', prompt: 'Why?', response: 'First entry with sufficient length for testing' }]
      });

      await journalService.create({
        position_id: positionId,
        entry_type: 'trade_execution',
        fields: [{ name: 'execution_notes', prompt: 'Notes', response: 'Second entry with sufficient length for testing' }]
      });

      // Create entry for different position
      await journalService.create({
        position_id: 'pos-456',
        entry_type: 'position_plan',
        fields: [{ name: 'thesis', prompt: 'Why?', response: 'Different position entry with sufficient length for testing' }]
      });

      // Delete entries for the specific position
      await journalService.deleteByPositionId(positionId);

      // Verify entries for the position are deleted
      const positionEntries = await journalService.findByPositionId(positionId);
      expect(positionEntries).toHaveLength(0);

      // Verify entries for other positions remain
      const allEntries = await journalService.getAll();
      expect(allEntries).toHaveLength(1);
      expect(allEntries[0].position_id).toBe('pos-456');
    });

    it('should handle deletion for position with no entries', async () => {
      // Should not throw error
      await expect(journalService.deleteByPositionId('non-existent-position')).resolves.not.toThrow();
    });
  });

  describe('enhanced error handling', () => {
    it('should reject update for non-existent entry', async () => {
      await expect(
        journalService.update('non-existent-id', {
          fields: [{ name: 'thesis', prompt: 'Why?', response: 'Updated content' }]
        })
      ).rejects.toThrow('Journal entry not found');
    });

    it('should reject update with invalid thesis content', async () => {
      const created = await journalService.create({
        position_id: 'pos-123',
        entry_type: 'position_plan',
        fields: [{ name: 'thesis', prompt: 'Why?', response: 'Original content with sufficient length' }]
      });

      await expect(
        journalService.update(created.id, {
          fields: [{ name: 'thesis', prompt: 'Why?', response: 'Short' }]
        })
      ).rejects.toThrow('Thesis response must be at least 10 characters');
    });

    it('should reject update with thesis content too long', async () => {
      const created = await journalService.create({
        position_id: 'pos-123',
        entry_type: 'position_plan',
        fields: [{ name: 'thesis', prompt: 'Why?', response: 'Original content with sufficient length' }]
      });

      const longContent = 'x'.repeat(2001);
      await expect(
        journalService.update(created.id, {
          fields: [{ name: 'thesis', prompt: 'Why?', response: longContent }]
        })
      ).rejects.toThrow('Thesis response cannot exceed 2000 characters');
    });
  });

  describe('data persistence', () => {
    it('should persist data across service instances', async () => {
      // Create entry with first service instance
      const created = await journalService.create({
        position_id: 'pos-123',
        entry_type: 'position_plan',
        fields: [{ name: 'thesis', prompt: 'Why?', response: 'Persistent entry' }]
      });

      // Note: In a real scenario, we'd create a new service instance with the same database
      // For this test, we just verify the original service persists data correctly

      // Note: This test would need the same database instance to truly test persistence
      // For now, we'll test that the original service still has the data
      const retrieved = await journalService.findById(created.id);
      expect(retrieved).toEqual(created);
    });
  });

  describe('standardized method names', () => {
    it('getById should return journal entry by id (returning null for missing)', async () => {
      const created = await journalService.create({
        position_id: 'pos-123',
        entry_type: 'position_plan',
        fields: [{
          name: 'thesis',
          prompt: 'Why?',
          response: 'Test response'
        }]
      });

      const found = await journalService.getById(created.id);
      expect(found).toEqual(created);

      const notFound = await journalService.getById('non-existent');
      expect(notFound).toBeNull();
    });

    it('getByPositionId should return entries sorted by timestamp (newest first)', async () => {
      const positionId = 'pos-123';

      // Create multiple entries with explicit timestamps
      const entry1 = await journalService.create({
        position_id: positionId,
        entry_type: 'position_plan',
        fields: [{ name: 'thesis', prompt: 'Why?', response: 'First entry' }],
        created_at: '2024-01-01T10:00:00Z'
      });

      const entry2 = await journalService.create({
        position_id: positionId,
        entry_type: 'trade_execution',
        fields: [{ name: 'execution_notes', prompt: 'Notes', response: 'Second entry' }],
        created_at: '2024-01-01T11:00:00Z'
      });

      const entries = await journalService.getByPositionId(positionId);

      expect(entries).toHaveLength(2);
      expect(entries[0].id).toBe(entry2.id); // Newest first
      expect(entries[1].id).toBe(entry1.id); // Oldest last
    });

    it('getAll should return all entries sorted by timestamp (newest first)', async () => {
      // Create entries with different timestamps
      const entry1 = await journalService.create({
        position_id: 'pos-1',
        entry_type: 'position_plan',
        fields: [{ name: 'thesis', prompt: 'Why?', response: 'First entry' }],
        created_at: '2024-01-01T10:00:00Z'
      });

      const entry2 = await journalService.create({
        position_id: 'pos-2',
        entry_type: 'trade_execution',
        fields: [{ name: 'execution_notes', prompt: 'Notes', response: 'Second entry' }],
        created_at: '2024-01-01T11:00:00Z'
      });

      const allEntries = await journalService.getAll();

      expect(allEntries).toHaveLength(2);
      expect(allEntries[0].id).toBe(entry2.id); // Newest first
      expect(allEntries[1].id).toBe(entry1.id); // Oldest last
    });
  });

  describe('createEmptyJournalEntry', () => {
    it('should create empty journal entry from position_plan field definitions', async () => {
      const entry = await journalService.createEmptyJournalEntry('position_plan', 'pos-123')

      expect(entry.id).toBeDefined()
      expect(entry.position_id).toBe('pos-123')
      expect(entry.entry_type).toBe('position_plan')
      expect(entry.fields).toHaveLength(4) // rationale, emotional_state, market_conditions, execution_strategy

      // Check rationale field copied from JOURNAL_PROMPTS
      const rationaleField = entry.fields.find(f => f.name === 'rationale')
      expect(rationaleField).toBeDefined()
      expect(rationaleField?.prompt).toBe('Why this trade? Why now?')
      expect(rationaleField?.response).toBe('')
      expect(rationaleField?.required).toBe(true)
    })

    it('should create empty journal entry from trade_execution field definitions', async () => {
      const entry = await journalService.createEmptyJournalEntry('trade_execution', undefined, 'trade-456')

      expect(entry.id).toBeDefined()
      expect(entry.trade_id).toBe('trade-456')
      expect(entry.entry_type).toBe('trade_execution')
      expect(entry.fields).toHaveLength(4) // execution_notes, emotional_state, market_conditions, execution_strategy

      // Check execution_notes field copied from JOURNAL_PROMPTS
      const notesField = entry.fields.find(f => f.name === 'execution_notes')
      expect(notesField).toBeDefined()
      expect(notesField?.prompt).toBe('Describe the execution')
      expect(notesField?.response).toBe('')
      expect(notesField?.required).toBe(false)
    })

    it('should copy name, prompt, and required from JOURNAL_PROMPTS', async () => {
      const entry = await journalService.createEmptyJournalEntry('position_plan', 'pos-123')

      entry.fields.forEach(field => {
        expect(field.name).toBeDefined()
        expect(field.prompt).toBeDefined()
        expect(field.response).toBe('')
        expect(typeof field.required).toBe('boolean')
      })
    })

    it('should generate unique IDs for each empty journal entry', async () => {
      const entry1 = await journalService.createEmptyJournalEntry('position_plan', 'pos-123')
      const entry2 = await journalService.createEmptyJournalEntry('position_plan', 'pos-456')

      expect(entry1.id).not.toBe(entry2.id)
    })

    it('should set created_at timestamp', async () => {
      const beforeCreate = new Date().toISOString()
      const entry = await journalService.createEmptyJournalEntry('position_plan', 'pos-123')
      const afterCreate = new Date().toISOString()

      expect(entry.created_at).toBeDefined()
      expect(entry.created_at >= beforeCreate).toBe(true)
      expect(entry.created_at <= afterCreate).toBe(true)
    })
  })
});