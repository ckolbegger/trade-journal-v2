import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { TradeService } from '@/services/TradeService'
import { PositionService } from '@/lib/position'
import { calculateCostBasis } from '@/utils/costBasis'
import type { Position } from '@/lib/position'
import 'fake-indexeddb/auto'

describe('TradeService - Cost Basis Integration', () => {
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

  it('[Service] should calculate cost basis from position trades', async () => {
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

    const retrieved = await positionService.getById('pos-123')
    const costBasis = calculateCostBasis(retrieved!.trades)

    expect(costBasis).toBe(150.50)
  })

  it('[Service] should return zero cost basis for position with no trades', async () => {
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

    const retrieved = await positionService.getById('pos-123')
    const costBasis = calculateCostBasis(retrieved!.trades)

    expect(costBasis).toBe(0)
  })

  it('[Service] should calculate cost basis after trade is persisted', async () => {
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

    const updatedTrades = await tradeService.addTrade({
      position_id: 'pos-123',
      trade_type: 'buy',
      quantity: 100,
      price: 150.50,
      timestamp: new Date()
    })

    // Cost basis should be calculated from updated trades
    const costBasis = calculateCostBasis(updatedTrades)
    expect(costBasis).toBe(150.50)

    // Also verify it's persisted
    const retrieved = await positionService.getById('pos-123')
    const persistedCostBasis = calculateCostBasis(retrieved!.trades)
    expect(persistedCostBasis).toBe(150.50)
  })
})
