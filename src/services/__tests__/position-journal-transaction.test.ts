import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PositionService } from '@/lib/position'
import { JournalService } from '@/services/JournalService'
import { PositionJournalTransaction } from '@/services/PositionJournalTransaction'
import { generatePositionId, generateJournalId } from '@/lib/uuid'
import type { Position } from '@/lib/position'
import type { JournalField } from '@/types/journal'
import { setupTestServices, teardownTestServices } from '@/test/db-helpers'
import { ServiceContainer } from '@/services/ServiceContainer'
import 'fake-indexeddb/auto'

describe('Position-Journal Transaction Flow', () => {
  let positionService: PositionService
  let journalService: JournalService
  let transactionService: PositionJournalTransaction

  beforeEach(async () => {
    const services = await setupTestServices()
    positionService = services.positionService
    journalService = services.journalService
    transactionService = new PositionJournalTransaction(positionService, journalService)
  })

  afterEach(async () => {
    await teardownTestServices()
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
        strategy_type: 'Long Stock' as const,
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
  })
})

// Test functions now use actual implementations from services