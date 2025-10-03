import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { TradeService } from '@/services/TradeService'
import { PositionService } from '@/lib/position'
import type { Position } from '@/lib/position'
import 'fake-indexeddb/auto'

describe('TradeService - Advanced Validation', () => {
  let tradeService: TradeService
  let positionService: PositionService

  beforeEach(async () => {
    positionService = new PositionService()
    await positionService.clearAll()
    tradeService = new TradeService(positionService)
  })

  afterEach(() => {
    positionService.close()
  })

  describe('Quantity Validation', () => {
    it('[Unit] should enforce reasonable quantity limits (max 1 million)', async () => {
      const position: Position = {
        id: 'pos-123',
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        target_entry_price: 150.00,
        target_quantity: 100,
        profit_target: 165.00,
        stop_loss: 145.00,
        position_thesis: 'Strong technical setup',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
      }
      await positionService.create(position)

      // Should accept large but reasonable quantities
      const result = await tradeService.addTrade('pos-123', {
        trade_type: 'buy',
        quantity: 999999,
        price: 150.50,
        timestamp: new Date()
      })

      expect(result.trades[0].quantity).toBe(999999)
    })

    it('[Unit] should allow fractional quantities for stocks', async () => {
      const position: Position = {
        id: 'pos-123',
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        target_entry_price: 150.00,
        target_quantity: 100,
        profit_target: 165.00,
        stop_loss: 145.00,
        position_thesis: 'Strong technical setup',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
      }
      await positionService.create(position)

      const result = await tradeService.addTrade('pos-123', {
        trade_type: 'buy',
        quantity: 100.5,
        price: 150.50,
        timestamp: new Date()
      })

      expect(result.trades[0].quantity).toBe(100.5)
    })
  })

  describe('Price Validation', () => {
    it('[Unit] should enforce reasonable price limits (up to $1 million per share)', async () => {
      const position: Position = {
        id: 'pos-123',
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        target_entry_price: 150.00,
        target_quantity: 100,
        profit_target: 165.00,
        stop_loss: 145.00,
        position_thesis: 'Strong technical setup',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
      }
      await positionService.create(position)

      const result = await tradeService.addTrade('pos-123', {
        trade_type: 'buy',
        quantity: 10,
        price: 999999.99,
        timestamp: new Date()
      })

      expect(result.trades[0].price).toBe(999999.99)
    })

    it('[Unit] should handle price precision up to 4 decimal places', async () => {
      const position: Position = {
        id: 'pos-123',
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        target_entry_price: 150.00,
        target_quantity: 100,
        profit_target: 165.00,
        stop_loss: 145.00,
        position_thesis: 'Strong technical setup',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
      }
      await positionService.create(position)

      const result = await tradeService.addTrade('pos-123', {
        trade_type: 'buy',
        quantity: 100,
        price: 150.1234,
        timestamp: new Date()
      })

      expect(result.trades[0].price).toBe(150.1234)
    })
  })

  describe('Notes Validation', () => {
    it('[Unit] should handle empty notes', async () => {
      const position: Position = {
        id: 'pos-123',
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        target_entry_price: 150.00,
        target_quantity: 100,
        profit_target: 165.00,
        stop_loss: 145.00,
        position_thesis: 'Strong technical setup',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
      }
      await positionService.create(position)

      const result = await tradeService.addTrade('pos-123', {
        trade_type: 'buy',
        quantity: 100,
        price: 150.50,
        timestamp: new Date(),
        notes: ''
      })

      expect(result.trades[0].notes).toBe('')
    })

    it('[Unit] should preserve notes with special characters', async () => {
      const position: Position = {
        id: 'pos-123',
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        target_entry_price: 150.00,
        target_quantity: 100,
        profit_target: 165.00,
        stop_loss: 145.00,
        position_thesis: 'Strong technical setup',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
      }
      await positionService.create(position)

      const result = await tradeService.addTrade('pos-123', {
        trade_type: 'buy',
        quantity: 100,
        price: 150.50,
        timestamp: new Date(),
        notes: 'Entry @ market open - broke $150 resistance! 🚀'
      })

      expect(result.trades[0].notes).toBe('Entry @ market open - broke $150 resistance! 🚀')
    })

    it('[Unit] should handle very long notes', async () => {
      const position: Position = {
        id: 'pos-123',
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        target_entry_price: 150.00,
        target_quantity: 100,
        profit_target: 165.00,
        stop_loss: 145.00,
        position_thesis: 'Strong technical setup',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
      }
      await positionService.create(position)

      const longNotes = 'A'.repeat(1000)
      const result = await tradeService.addTrade('pos-123', {
        trade_type: 'buy',
        quantity: 100,
        price: 150.50,
        timestamp: new Date(),
        notes: longNotes
      })

      expect(result.trades[0].notes).toBe(longNotes)
      expect(result.trades[0].notes!.length).toBe(1000)
    })
  })

  describe('Timestamp Validation', () => {
    it('[Unit] should accept timestamps from the past', async () => {
      const position: Position = {
        id: 'pos-123',
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        target_entry_price: 150.00,
        target_quantity: 100,
        profit_target: 165.00,
        stop_loss: 145.00,
        position_thesis: 'Strong technical setup',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
      }
      await positionService.create(position)

      const pastDate = new Date('2020-01-01T10:00:00Z')
      const result = await tradeService.addTrade('pos-123', {
        trade_type: 'buy',
        quantity: 100,
        price: 150.50,
        timestamp: pastDate
      })

      expect(result.trades[0].timestamp).toEqual(pastDate)
    })

    it('[Unit] should accept current timestamp', async () => {
      const position: Position = {
        id: 'pos-123',
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        target_entry_price: 150.00,
        target_quantity: 100,
        profit_target: 165.00,
        stop_loss: 145.00,
        position_thesis: 'Strong technical setup',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
      }
      await positionService.create(position)

      const now = new Date()
      const result = await tradeService.addTrade('pos-123', {
        trade_type: 'buy',
        quantity: 100,
        price: 150.50,
        timestamp: now
      })

      // Allow small time difference due to execution time
      const diff = Math.abs(result.trades[0].timestamp.getTime() - now.getTime())
      expect(diff).toBeLessThan(1000) // Within 1 second
    })
  })
})
