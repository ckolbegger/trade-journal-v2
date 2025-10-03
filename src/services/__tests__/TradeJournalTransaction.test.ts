import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import 'fake-indexeddb/auto'
import type { Position } from '@/lib/position'
import { PositionService } from '@/lib/position'
import { TradeJournalTransaction } from '@/services/TradeJournalTransaction'

describe('TradeJournalTransaction', () => {
  let positionService: PositionService
  let tradeJournalTransaction: TradeJournalTransaction

  beforeEach(async () => {
    positionService = new PositionService()
    await positionService.clearAll()
    tradeJournalTransaction = new TradeJournalTransaction(positionService)
  })

  afterEach(() => {
    positionService.close()
  })

  describe('Constructor', () => {
    it('should create TradeJournalTransaction with PositionService dependency', () => {
      expect(tradeJournalTransaction).toBeDefined()
      expect(tradeJournalTransaction).toBeInstanceOf(TradeJournalTransaction)
    })
  })

  describe('executeTradeWithJournal()', () => {
    let testPosition: Position

    beforeEach(async () => {
      // Create a test position
      testPosition = {
        id: 'pos-test-1',
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        target_entry_price: 150.00,
        target_quantity: 100,
        profit_target: 165.00,
        stop_loss: 135.00,
        position_thesis: 'Test thesis',
        status: 'planned',
        created_date: new Date('2024-01-15'),
        journal_entry_ids: [],
        trades: []
      }

      await positionService.create(testPosition)
    })

    it('should execute trade with journal atomically', async () => {
      const tradeData = {
        trade_type: 'buy' as const,
        quantity: 100,
        price: 150.00,
        timestamp: new Date(),
        notes: 'Opening trade'
      }

      const journalData = {
        entry_type: 'trade_execution' as const,
        fields: [
          { name: 'execution_notes', prompt: 'How did the execution go?', value: 'Filled at target price' }
        ]
      }

      const result = await tradeJournalTransaction.executeTradeWithJournal(
        'pos-test-1',
        tradeData,
        journalData
      )

      // Verify position was updated
      expect(result).toBeDefined()
      expect(result.id).toBe('pos-test-1')
      expect(result.trades).toHaveLength(1)
      expect(result.trades[0].trade_type).toBe('buy')
      expect(result.trades[0].quantity).toBe(100)
      expect(result.trades[0].price).toBe(150.00)

      // Verify journal entry was created
      expect(result.journal_entry_ids).toHaveLength(1)

      // Verify status was updated to 'open'
      expect(result.status).toBe('open')

      // Verify data persisted to database
      const storedPosition = await positionService.getById('pos-test-1')
      expect(storedPosition?.trades).toHaveLength(1)
      expect(storedPosition?.journal_entry_ids).toHaveLength(1)
      expect(storedPosition?.status).toBe('open')
    })

    it('should rollback trade if journal creation fails', async () => {
      const tradeData = {
        trade_type: 'buy' as const,
        quantity: 100,
        price: 150.00,
        timestamp: new Date(),
        notes: 'Opening trade'
      }

      // Invalid journal data (missing required fields)
      const invalidJournalData = {
        entry_type: 'trade_execution' as const,
        fields: []  // Empty fields should cause validation error
      }

      await expect(
        tradeJournalTransaction.executeTradeWithJournal(
          'pos-test-1',
          tradeData,
          invalidJournalData
        )
      ).rejects.toThrow()

      // Verify position was NOT updated (rollback successful)
      const storedPosition = await positionService.getById('pos-test-1')
      expect(storedPosition?.trades).toHaveLength(0)
      expect(storedPosition?.journal_entry_ids).toHaveLength(0)
      expect(storedPosition?.status).toBe('planned')
    })

    it('should rollback journal if trade addition fails', async () => {
      // Invalid trade data (negative quantity)
      const invalidTradeData = {
        trade_type: 'buy' as const,
        quantity: -100,  // Invalid
        price: 150.00,
        timestamp: new Date(),
        notes: 'Opening trade'
      }

      const journalData = {
        entry_type: 'trade_execution' as const,
        fields: [
          { name: 'execution_notes', prompt: 'How did the execution go?', value: 'Test' }
        ]
      }

      await expect(
        tradeJournalTransaction.executeTradeWithJournal(
          'pos-test-1',
          invalidTradeData,
          journalData
        )
      ).rejects.toThrow(/quantity must be positive/i)

      // Verify position was NOT updated
      const storedPosition = await positionService.getById('pos-test-1')
      expect(storedPosition?.trades).toHaveLength(0)
      expect(storedPosition?.journal_entry_ids).toHaveLength(0)

      // Verify no orphaned journal entries (they should be rolled back)
      // Note: We'll verify this through the position's journal_entry_ids being empty
    })

    it('should return updated position with trade and journal entry ID', async () => {
      const tradeData = {
        trade_type: 'buy' as const,
        quantity: 100,
        price: 150.00,
        timestamp: new Date(),
        notes: 'Opening trade'
      }

      const journalData = {
        entry_type: 'trade_execution' as const,
        fields: [
          { name: 'execution_notes', prompt: 'How did the execution go?', value: 'Filled at target price' }
        ]
      }

      const result = await tradeJournalTransaction.executeTradeWithJournal(
        'pos-test-1',
        tradeData,
        journalData
      )

      // Verify structure of returned position
      expect(result).toMatchObject({
        id: 'pos-test-1',
        symbol: 'AAPL',
        status: 'open',
        trades: expect.arrayContaining([
          expect.objectContaining({
            trade_type: 'buy',
            quantity: 100,
            price: 150.00
          })
        ]),
        journal_entry_ids: expect.arrayContaining([expect.any(String)])
      })

      // Verify trade has generated ID
      expect(result.trades[0].id).toBeDefined()
      expect(typeof result.trades[0].id).toBe('string')

      // Verify journal entry ID was added
      expect(result.journal_entry_ids[0]).toBeDefined()
      expect(typeof result.journal_entry_ids[0]).toBe('string')
    })

    it('should validate trade data before executing transaction', async () => {
      const invalidTradeData = {
        trade_type: 'buy' as const,
        quantity: 0,  // Invalid: zero quantity
        price: 150.00,
        timestamp: new Date(),
        notes: 'Opening trade'
      }

      const journalData = {
        entry_type: 'trade_execution' as const,
        fields: [
          { name: 'execution_notes', prompt: 'How did the execution go?', value: 'Test' }
        ]
      }

      await expect(
        tradeJournalTransaction.executeTradeWithJournal(
          'pos-test-1',
          invalidTradeData,
          journalData
        )
      ).rejects.toThrow(/quantity must be positive/i)

      // Verify no changes were made
      const storedPosition = await positionService.getById('pos-test-1')
      expect(storedPosition?.trades).toHaveLength(0)
      expect(storedPosition?.journal_entry_ids).toHaveLength(0)
    })

    it('should throw error if position does not exist', async () => {
      const tradeData = {
        trade_type: 'buy' as const,
        quantity: 100,
        price: 150.00,
        timestamp: new Date(),
        notes: 'Opening trade'
      }

      const journalData = {
        entry_type: 'trade_execution' as const,
        fields: [
          { name: 'execution_notes', prompt: 'How did the execution go?', value: 'Test' }
        ]
      }

      await expect(
        tradeJournalTransaction.executeTradeWithJournal(
          'non-existent-position',
          tradeData,
          journalData
        )
      ).rejects.toThrow(/position not found/i)
    })
  })
})
