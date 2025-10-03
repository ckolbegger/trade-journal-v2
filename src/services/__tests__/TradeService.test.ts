import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { TradeService } from '@/services/TradeService'
import { PositionService } from '@/lib/position'
import type { Position } from '@/lib/position'
import 'fake-indexeddb/auto'

describe('TradeService', () => {
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

  describe('addTrade() - Core Operations', () => {
    it('[Unit] should add a buy trade to a position', async () => {
      // Create a position first
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

      // Add a buy trade
      const updatedPosition = await tradeService.addTrade('pos-123', {
        trade_type: 'buy',
        quantity: 100,
        price: 150.50,
        timestamp: new Date('2024-10-03T10:00:00Z'),
        notes: 'Opening trade'
      })

      expect(updatedPosition.trades.length).toBe(1)
      expect(updatedPosition.trades[0].trade_type).toBe('buy')
      expect(updatedPosition.trades[0].quantity).toBe(100)
      expect(updatedPosition.trades[0].price).toBe(150.50)
      expect(updatedPosition.trades[0].notes).toBe('Opening trade')
    })

    it('[Unit] should add a sell trade to a position', async () => {
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

      const updatedPosition = await tradeService.addTrade('pos-123', {
        trade_type: 'sell',
        quantity: 50,
        price: 155.00,
        timestamp: new Date('2024-10-03T14:00:00Z')
      })

      expect(updatedPosition.trades.length).toBe(1)
      expect(updatedPosition.trades[0].trade_type).toBe('sell')
      expect(updatedPosition.trades[0].quantity).toBe(50)
      expect(updatedPosition.trades[0].price).toBe(155.00)
    })

    it('[Unit] should generate unique ID for each trade', async () => {
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

      const updatedPosition = await tradeService.addTrade('pos-123', {
        trade_type: 'buy',
        quantity: 100,
        price: 150.50,
        timestamp: new Date()
      })

      expect(updatedPosition.trades[0].id).toBeDefined()
      expect(typeof updatedPosition.trades[0].id).toBe('string')
      expect(updatedPosition.trades[0].id.length).toBeGreaterThan(0)
    })

    it('[Unit] should set timestamp correctly', async () => {
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

      const tradeTimestamp = new Date('2024-10-03T10:00:00Z')
      const updatedPosition = await tradeService.addTrade('pos-123', {
        trade_type: 'buy',
        quantity: 100,
        price: 150.50,
        timestamp: tradeTimestamp
      })

      expect(updatedPosition.trades[0].timestamp).toEqual(tradeTimestamp)
    })

    it('[Unit] should return updated Position after trade addition', async () => {
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

      const updatedPosition = await tradeService.addTrade('pos-123', {
        trade_type: 'buy',
        quantity: 100,
        price: 150.50,
        timestamp: new Date()
      })

      expect(updatedPosition.id).toBe('pos-123')
      expect(updatedPosition.symbol).toBe('AAPL')
      expect(updatedPosition.trades.length).toBe(1)
    })
  })

  describe('Trade Validation', () => {
    it('[Unit] should reject trade with negative quantity', async () => {
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

      await expect(tradeService.addTrade('pos-123', {
        trade_type: 'buy',
        quantity: -10,
        price: 150.50,
        timestamp: new Date()
      })).rejects.toThrow('quantity must be positive')
    })

    it('[Unit] should reject trade with zero quantity', async () => {
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

      await expect(tradeService.addTrade('pos-123', {
        trade_type: 'buy',
        quantity: 0,
        price: 150.50,
        timestamp: new Date()
      })).rejects.toThrow('quantity must be positive')
    })

    it('[Unit] should reject trade with negative price', async () => {
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

      await expect(tradeService.addTrade('pos-123', {
        trade_type: 'buy',
        quantity: 100,
        price: -150.50,
        timestamp: new Date()
      })).rejects.toThrow('price must be positive')
    })

    it('[Unit] should reject trade with zero price', async () => {
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

      await expect(tradeService.addTrade('pos-123', {
        trade_type: 'buy',
        quantity: 100,
        price: 0,
        timestamp: new Date()
      })).rejects.toThrow('price must be positive')
    })

    it('[Unit] should reject trade with future timestamp', async () => {
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

      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 1)

      await expect(tradeService.addTrade('pos-123', {
        trade_type: 'buy',
        quantity: 100,
        price: 150.50,
        timestamp: futureDate
      })).rejects.toThrow('timestamp cannot be in the future')
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

      const currentDate = new Date()

      const result = await tradeService.addTrade('pos-123', {
        trade_type: 'buy',
        quantity: 100,
        price: 150.50,
        timestamp: currentDate
      })

      expect(result.trades.length).toBe(1)
    })

    it('[Unit] should validate trade_type is buy or sell', async () => {
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

      await expect(tradeService.addTrade('pos-123', {
        trade_type: 'invalid' as any,
        quantity: 100,
        price: 150.50,
        timestamp: new Date()
      })).rejects.toThrow('trade_type must be buy or sell')
    })
  })

  describe('Phase 1A Constraints', () => {
    it('[Unit] should enforce single trade per position limit', async () => {
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

      // First trade should succeed
      await tradeService.addTrade('pos-123', {
        trade_type: 'buy',
        quantity: 100,
        price: 150.50,
        timestamp: new Date()
      })

      // Second trade should fail with clear error message
      await expect(tradeService.addTrade('pos-123', {
        trade_type: 'sell',
        quantity: 50,
        price: 155.00,
        timestamp: new Date()
      })).rejects.toThrow('Phase 1A limitation: only one trade per position allowed')
    })

    it('[Unit] should allow first trade on empty position', async () => {
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
        timestamp: new Date()
      })

      expect(result.trades.length).toBe(1)
    })
  })
})
