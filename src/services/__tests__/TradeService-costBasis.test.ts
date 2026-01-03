import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { TradeService } from '@/services/TradeService'
import { PositionService } from '@/lib/position'
import { CostBasisCalculator } from '@/domain/calculators/CostBasisCalculator'
import type { Position } from '@/lib/position'
import { SchemaManager } from '@/services/SchemaManager'
import 'fake-indexeddb/auto'

describe('TradeService - Cost Basis Integration', () => {
  let db: IDBDatabase
  let tradeService: TradeService
  let positionService: PositionService

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
        SchemaManager.initializeSchema(event, database)
      }
    })

    // Create service with injected database
    positionService = new PositionService(db)
    tradeService = new TradeService(positionService)
  })

  afterEach(() => {
    db?.close()
    indexedDB.deleteDatabase('TestDB')
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
    const costBasis = CostBasisCalculator.calculateFirstBuyPrice(retrieved!.trades)

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
    const costBasis = CostBasisCalculator.calculateFirstBuyPrice(retrieved!.trades)

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
    const costBasis = CostBasisCalculator.calculateFirstBuyPrice(updatedTrades)
    expect(costBasis).toBe(150.50)

    // Also verify it's persisted
    const retrieved = await positionService.getById('pos-123')
    const persistedCostBasis = CostBasisCalculator.calculateFirstBuyPrice(retrieved!.trades)
    expect(persistedCostBasis).toBe(150.50)
  })
})
