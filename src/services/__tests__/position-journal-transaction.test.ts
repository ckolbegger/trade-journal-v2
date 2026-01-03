import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PositionService } from '@/lib/position'
import { JournalService } from '@/services/JournalService'
import { PositionJournalTransaction } from '@/services/PositionJournalTransaction'
import { generatePositionId, generateJournalId } from '@/lib/uuid'
import type { Position } from '@/lib/position'
import type { JournalField } from '@/types/journal'
import { SchemaManager } from '@/services/SchemaManager'
import 'fake-indexeddb/auto'

describe('Position-Journal Transaction Flow', () => {
  let positionService: PositionService
  let journalService: JournalService
  let transactionService: PositionJournalTransaction
  let db: IDBDatabase

  beforeEach(async () => {
    // Delete database to ensure clean state
    const deleteRequest = indexedDB.deleteDatabase('TestDB')
    await new Promise<void>((resolve) => {
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => resolve()
      deleteRequest.onblocked = () => resolve()
    })

    // Create test database with schema
    db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('TestDB', 1)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result
        SchemaManager.initializeSchema(database, 1)
      }
    })

    // Create service with injected database
    positionService = new PositionService(db)
    journalService = new JournalService(db)
    transactionService = new PositionJournalTransaction(positionService, journalService)
  })

  afterEach(() => {
    db?.close()
    indexedDB.deleteDatabase('TestDB')
  })

  describe('UUID Generation', () => {
    it('should generate position IDs with UUID format', () => {
      // This will fail until we implement UUID generation
      const positionId = generatePositionId()
      expect(positionId).toMatch(/^pos-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/)
    })

    it('should generate journal IDs with UUID format', () => {
      // This will fail until we implement UUID generation
      const journalId = generateJournalId()
      expect(journalId).toMatch(/^journal-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/)
    })

    it('should generate unique IDs on multiple calls', () => {
      // This will fail until we implement UUID generation
      const id1 = generatePositionId()
      const id2 = generatePositionId()
      expect(id1).not.toBe(id2)
    })
  })

  describe('Transactional Position Creation', () => {
    it('should create journal entry first, then position with reference', async () => {
      // This will fail until we implement the transaction flow
      const result = await transactionService.createPositionWithJournal({
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        target_entry_price: 150,
        target_quantity: 100,
        profit_target: 165,
        stop_loss: 135,
        position_thesis: 'Test position thesis',
        journalFields: [
          {
            name: 'thesis',
            prompt: 'Why are you planning this position?',
            response: 'AAPL showing strong technical support'
          },
          {
            name: 'market_conditions',
            prompt: 'Describe current market environment',
            response: 'Bullish trend with Fed pause expected'
          }
        ]
      })

      // Verify journal was created with correct position reference
      expect(result.journal.id).toMatch(/^journal-[a-f0-9-]{36}$/)
      expect(result.journal.position_id).toBe(result.position.id)
      expect(result.journal.entry_type).toBe('position_plan')

      // Verify position was created with journal reference
      expect(result.position.id).toMatch(/^pos-[a-f0-9-]{36}$/)
      expect(result.position.journal_entry_ids).toContain(result.journal.id)
      expect(result.position.symbol).toBe('AAPL')
    })

    it('should rollback journal entry if position creation fails', async () => {
      // This will fail until we implement rollback logic
      const invalidPositionData = {
        symbol: 'AAPL',
        target_entry_price: -150, // Invalid negative price
        target_quantity: 100,
        profit_target: 165,
        stop_loss: 135,
        position_thesis: 'Test position thesis',
        journalFields: [
          {
            name: 'thesis',
            prompt: 'Why?',
            response: 'Test response'
          }
        ]
      }

      await expect(transactionService.createPositionWithJournal(invalidPositionData)).rejects.toThrow()

      // Verify no journal entries were left behind
      const allJournals = await journalService.getAll()
      expect(allJournals).toHaveLength(0)
    })

    it('should maintain referential integrity between position and journal', async () => {
      // This will fail until we implement the full transaction flow
      const result = await transactionService.createPositionWithJournal({
        symbol: 'MSFT',
        strategy_type: 'Long Stock',
        target_entry_price: 300,
        target_quantity: 50,
        profit_target: 330,
        stop_loss: 270,
        position_thesis: 'Cloud growth strategy',
        journalFields: [
          {
            name: 'thesis',
            prompt: 'Why?',
            response: 'Strong cloud growth potential'
          }
        ]
      })

      // Verify we can retrieve journal by position ID
      const journalEntries = await journalService.findByPositionId(result.position.id)
      expect(journalEntries).toHaveLength(1)
      expect(journalEntries[0].id).toBe(result.journal.id)

      // Verify we can retrieve position and it has correct journal reference
      const retrievedPosition = await positionService.getById(result.position.id)
      expect(retrievedPosition).not.toBeNull()
      expect(retrievedPosition!.journal_entry_ids).toContain(result.journal.id)
    })

    it('should create Short Put position with all option fields', async () => {
      const result = await transactionService.createPositionWithJournal({
        symbol: 'AAPL',
        strategy_type: 'Short Put',
        target_entry_price: 175,
        target_quantity: 5,
        profit_target: 180,
        stop_loss: 170,
        position_thesis: 'AAPL support level thesis',
        option_type: 'put',
        strike_price: 180,
        expiration_date: new Date('2025-03-21'),
        premium_per_contract: 3.50,
        profit_target_basis: 'stock_price',
        stop_loss_basis: 'stock_price',
        journalFields: [
          {
            name: 'thesis',
            prompt: 'Why this strike and expiration?',
            response: 'Strong support at $180, 45 DTE for optimal time decay'
          }
        ]
      })

      expect(result.position.strategy_type).toBe('Short Put')
      expect(result.position.trade_kind).toBe('option')
      expect(result.position.option_type).toBe('put')
      expect(result.position.strike_price).toBe(180)
      expect(result.position.expiration_date).toEqual(new Date('2025-03-21'))
      expect(result.position.premium_per_contract).toBe(3.50)
      expect(result.position.profit_target_basis).toBe('stock_price')
      expect(result.position.stop_loss_basis).toBe('stock_price')

      const retrievedPosition = await positionService.getById(result.position.id)
      expect(retrievedPosition).not.toBeNull()
      expect(retrievedPosition!.strategy_type).toBe('Short Put')
    })
  })
})

// Test functions now use actual implementations from services