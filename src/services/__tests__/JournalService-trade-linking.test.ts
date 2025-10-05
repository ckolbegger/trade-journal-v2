import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { JournalService } from '@/services/JournalService'
import type { JournalEntry } from '@/types/journal'

describe('JournalService - Trade Linking', () => {
  let db: IDBDatabase
  let journalService: JournalService

  beforeEach(async () => {
    // Open database for each test
    db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('TradingJournalDB', 2)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create positions object store if needed
        if (!db.objectStoreNames.contains('positions')) {
          const positionStore = db.createObjectStore('positions', { keyPath: 'id' })
          positionStore.createIndex('symbol', 'symbol', { unique: false })
          positionStore.createIndex('status', 'status', { unique: false })
          positionStore.createIndex('created_date', 'created_date', { unique: false })
        }

        // Create journal_entries object store if needed
        if (!db.objectStoreNames.contains('journal_entries')) {
          const journalStore = db.createObjectStore('journal_entries', { keyPath: 'id' })
          journalStore.createIndex('position_id', 'position_id', { unique: false })
          journalStore.createIndex('trade_id', 'trade_id', { unique: false })
          journalStore.createIndex('entry_type', 'entry_type', { unique: false })
          journalStore.createIndex('created_at', 'created_at', { unique: false })
        }
      }
    })

    journalService = new JournalService(db)

    // Clear all journal entries before each test
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['journal_entries'], 'readwrite')
      const store = transaction.objectStore('journal_entries')
      const request = store.clear()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  })

  afterEach(() => {
    if (db) {
      db.close()
    }
  })

  describe('Create with Trade ID', () => {
    it('should create journal entry with both position_id and trade_id', async () => {
      const journalEntry: JournalEntry = {
        id: 'journal-1',
        position_id: 'pos-123',
        trade_id: 'trade-456',
        entry_type: 'trade_execution',
        fields: [
          {
            name: 'execution_notes',
            prompt: 'Describe the execution',
            response: 'Executed at market open with good fill',
            required: false
          }
        ],
        created_at: new Date().toISOString()
      }

      const created = await journalService.create(journalEntry)

      expect(created.id).toBe('journal-1')
      expect(created.position_id).toBe('pos-123')
      expect(created.trade_id).toBe('trade-456')
      expect(created.entry_type).toBe('trade_execution')

      // Verify it persisted to IndexedDB
      const retrieved = await journalService.getById('journal-1')
      expect(retrieved).not.toBeNull()
      expect(retrieved?.position_id).toBe('pos-123')
      expect(retrieved?.trade_id).toBe('trade-456')
    })

    it('should create journal entry with only position_id (no trade)', async () => {
      const journalEntry: JournalEntry = {
        id: 'journal-2',
        position_id: 'pos-123',
        trade_id: undefined,
        entry_type: 'position_plan',
        fields: [
          {
            name: 'rationale',
            prompt: 'Why this trade? Why now?',
            response: 'Strong technical setup with bullish divergence',
            required: true
          }
        ],
        created_at: new Date().toISOString()
      }

      const created = await journalService.create(journalEntry)

      expect(created.id).toBe('journal-2')
      expect(created.position_id).toBe('pos-123')
      expect(created.trade_id).toBeUndefined()

      // Verify it persisted to IndexedDB
      const retrieved = await journalService.getById('journal-2')
      expect(retrieved).not.toBeNull()
      expect(retrieved?.position_id).toBe('pos-123')
      expect(retrieved?.trade_id).toBeUndefined()
    })

    it('should validate trade_id format', async () => {
      // Valid: undefined (no trade)
      const validEntry1: JournalEntry = {
        id: 'journal-3',
        position_id: 'pos-123',
        trade_id: undefined,
        entry_type: 'position_plan',
        fields: [{ name: 'rationale', prompt: 'Why?', response: 'Test', required: true }],
        created_at: new Date().toISOString()
      }
      await expect(journalService.create(validEntry1)).resolves.toBeDefined()

      // Valid: string trade ID
      const validEntry2: JournalEntry = {
        id: 'journal-4',
        position_id: 'pos-123',
        trade_id: 'trade-valid-id',
        entry_type: 'trade_execution',
        fields: [{ name: 'execution_notes', prompt: 'Notes', response: 'Test', required: false }],
        created_at: new Date().toISOString()
      }
      await expect(journalService.create(validEntry2)).resolves.toBeDefined()

      // Invalid: empty string
      const invalidEntry: JournalEntry = {
        id: 'journal-5',
        position_id: 'pos-123',
        trade_id: '',
        entry_type: 'trade_execution',
        fields: [{ name: 'execution_notes', prompt: 'Notes', response: 'Test', required: false }],
        created_at: new Date().toISOString()
      }
      await expect(journalService.create(invalidEntry)).rejects.toThrow('trade_id cannot be empty string')
    })
  })

  describe('Query by Trade ID', () => {
    beforeEach(async () => {
      // Create test data: 3 journals, 2 for trade-1, 1 for trade-2
      await journalService.create({
        id: 'journal-a',
        position_id: 'pos-1',
        trade_id: 'trade-1',
        entry_type: 'trade_execution',
        fields: [{ name: 'execution_notes', prompt: 'Notes', response: 'First entry for trade-1', required: false }],
        created_at: '2025-10-01T10:00:00Z'
      })

      await journalService.create({
        id: 'journal-b',
        position_id: 'pos-1',
        trade_id: 'trade-1',
        entry_type: 'trade_execution',
        fields: [{ name: 'execution_notes', prompt: 'Notes', response: 'Second entry for trade-1', required: false }],
        created_at: '2025-10-02T10:00:00Z'
      })

      await journalService.create({
        id: 'journal-c',
        position_id: 'pos-1',
        trade_id: 'trade-2',
        entry_type: 'trade_execution',
        fields: [{ name: 'execution_notes', prompt: 'Notes', response: 'Entry for trade-2', required: false }],
        created_at: '2025-10-03T10:00:00Z'
      })
    })

    it('should retrieve journal entries by trade_id using getByTradeId()', async () => {
      const trade1Journals = await journalService.getByTradeId('trade-1')

      expect(trade1Journals).toHaveLength(2)
      expect(trade1Journals[0].id).toBe('journal-a')
      expect(trade1Journals[1].id).toBe('journal-b')
      expect(trade1Journals.every(j => j.trade_id === 'trade-1')).toBe(true)
    })

    it('should return correct journal for different trade_id', async () => {
      const trade2Journals = await journalService.getByTradeId('trade-2')

      expect(trade2Journals).toHaveLength(1)
      expect(trade2Journals[0].id).toBe('journal-c')
      expect(trade2Journals[0].trade_id).toBe('trade-2')
    })

    it('should return empty array when no journals for trade', async () => {
      const noJournals = await journalService.getByTradeId('trade-999')

      expect(noJournals).toHaveLength(0)
      expect(Array.isArray(noJournals)).toBe(true)
    })
  })

  describe('Query by Position ID', () => {
    it('should return all journals for position (trade-linked and position-only)', async () => {
      // Create mixed journals for same position
      await journalService.create({
        id: 'journal-pos',
        position_id: 'pos-123',
        trade_id: undefined,
        entry_type: 'position_plan',
        fields: [{ name: 'rationale', prompt: 'Why?', response: 'Position journal', required: true }],
        created_at: '2025-10-01T10:00:00Z'
      })

      await journalService.create({
        id: 'journal-trade1',
        position_id: 'pos-123',
        trade_id: 'trade-1',
        entry_type: 'trade_execution',
        fields: [{ name: 'execution_notes', prompt: 'Notes', response: 'Trade 1 journal', required: false }],
        created_at: '2025-10-02T10:00:00Z'
      })

      await journalService.create({
        id: 'journal-trade2',
        position_id: 'pos-123',
        trade_id: 'trade-2',
        entry_type: 'trade_execution',
        fields: [{ name: 'execution_notes', prompt: 'Notes', response: 'Trade 2 journal', required: false }],
        created_at: '2025-10-03T10:00:00Z'
      })

      const allJournals = await journalService.getByPositionId('pos-123')

      expect(allJournals).toHaveLength(3)
      expect(allJournals.some(j => j.trade_id === undefined)).toBe(true)
      expect(allJournals.some(j => j.trade_id === 'trade-1')).toBe(true)
      expect(allJournals.some(j => j.trade_id === 'trade-2')).toBe(true)
    })
  })

  describe('Validation', () => {
    it('should require at least one ID (position_id or trade_id)', async () => {
      const invalidEntry: JournalEntry = {
        id: 'journal-invalid',
        position_id: undefined,
        trade_id: undefined,
        entry_type: 'position_plan',
        fields: [{ name: 'rationale', prompt: 'Why?', response: 'Test', required: true }],
        created_at: new Date().toISOString()
      }

      await expect(journalService.create(invalidEntry)).rejects.toThrow(
        'Journal entry must have either position_id or trade_id'
      )
    })

    it('should allow both position_id and trade_id together', async () => {
      const validEntry: JournalEntry = {
        id: 'journal-both',
        position_id: 'pos-123',
        trade_id: 'trade-456',
        entry_type: 'trade_execution',
        fields: [{ name: 'execution_notes', prompt: 'Notes', response: 'Test', required: false }],
        created_at: new Date().toISOString()
      }

      const created = await journalService.create(validEntry)

      expect(created.position_id).toBe('pos-123')
      expect(created.trade_id).toBe('trade-456')
    })

    it('should warn when trade_execution entry has no trade_id', async () => {
      // Spy on console.warn
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const entry: JournalEntry = {
        id: 'journal-warn',
        position_id: 'pos-123',
        trade_id: undefined,
        entry_type: 'trade_execution',
        fields: [{ name: 'execution_notes', prompt: 'Notes', response: 'Test', required: false }],
        created_at: new Date().toISOString()
      }

      await journalService.create(entry)

      expect(warnSpy).toHaveBeenCalledWith(
        'trade_execution entry created without trade_id for journal journal-warn'
      )

      warnSpy.mockRestore()
    })
  })

  describe('IndexedDB Schema', () => {
    it('should have trade_id index on journal_entries object store', async () => {
      const transaction = db.transaction(['journal_entries'], 'readonly')
      const store = transaction.objectStore('journal_entries')

      const indexNames = Array.from(store.indexNames)

      expect(indexNames).toContain('trade_id')

      const tradeIdIndex = store.index('trade_id')
      expect(tradeIdIndex.unique).toBe(false) // Multiple journals per trade allowed
    })
  })
})
