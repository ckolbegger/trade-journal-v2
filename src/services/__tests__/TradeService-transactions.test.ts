import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { TradeService } from '@/services/TradeService'
import { PositionService } from '@/lib/position'
import type { Position } from '@/lib/position'
import 'fake-indexeddb/auto'

describe('TradeService - Atomic Updates & Transactions', () => {
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

  it('[Service] should perform atomic updates to Position.trades', async () => {
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

    // Add trade
    await tradeService.addTrade({
      position_id: 'pos-123',
      trade_type: 'buy',
      quantity: 100,
      price: 150.50,
      timestamp: new Date()
    })

    // Verify atomic update - trade should be persisted
    const retrieved = await positionService.getById('pos-123')
    expect(retrieved!.trades.length).toBe(1)
    expect(retrieved!.trades[0].price).toBe(150.50)
  })

  it('[Service] should rollback on validation failure', async () => {
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

    // Try to add invalid trade
    try {
      await tradeService.addTrade({
      position_id: 'pos-123',
        trade_type: 'buy',
        quantity: -100, // Invalid
        price: 150.50,
        timestamp: new Date()
      })
    } catch (error) {
      // Expected to fail
    }

    // Verify position was not modified
    const retrieved = await positionService.getById('pos-123')
    expect(retrieved!.trades.length).toBe(0)
    expect(retrieved!.status).toBe('planned')
  })

  it('[Service] should not leave database in inconsistent state on error', async () => {
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

    // First trade succeeds
    await tradeService.addTrade({
      position_id: 'pos-123',
      trade_type: 'buy',
      quantity: 100,
      price: 150.50,
      timestamp: new Date()
    })

    // Second trade fails (Phase 1A limit)
    try {
      await tradeService.addTrade({
      position_id: 'pos-123',
        trade_type: 'sell',
        quantity: 50,
        price: 155.00,
        timestamp: new Date()
      })
    } catch (error) {
      // Expected to fail
    }

    // Verify position still has only the first trade
    const retrieved = await positionService.getById('pos-123')
    expect(retrieved!.trades.length).toBe(1)
    expect(retrieved!.trades[0].trade_type).toBe('buy')
    expect(retrieved!.status).toBe('open')
  })

  it('[Service] should ensure data consistency across multiple operations', async () => {
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

    // Add trade
    const updatedTrades = await tradeService.addTrade({
      position_id: 'pos-123',
      trade_type: 'buy',
      quantity: 100,
      price: 150.50,
      timestamp: new Date()
    })

    // Verify updated trades are returned
    expect(updatedTrades.length).toBe(1)
    expect(updatedTrades[0].price).toBe(150.50)

    // Verify persisted position is consistent
    const retrieved = await positionService.getById('pos-123')
    expect(retrieved!.trades.length).toBe(1)
    expect(retrieved!.status).toBe('open')
    expect(retrieved!.trades[0].id).toBe(updatedTrades[0].id)
  })

  it('[Service] should handle concurrent reads correctly', async () => {
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

    await tradeService.addTrade({
      position_id: 'pos-123',
      trade_type: 'buy',
      quantity: 100,
      price: 150.50,
      timestamp: new Date()
    })

    // Multiple concurrent reads should all see consistent state
    const [read1, read2, read3] = await Promise.all([
      positionService.getById('pos-123'),
      positionService.getById('pos-123'),
      positionService.getById('pos-123')
    ])

    expect(read1!.trades.length).toBe(1)
    expect(read2!.trades.length).toBe(1)
    expect(read3!.trades.length).toBe(1)
    expect(read1!.status).toBe('open')
    expect(read2!.status).toBe('open')
    expect(read3!.status).toBe('open')
  })
})
