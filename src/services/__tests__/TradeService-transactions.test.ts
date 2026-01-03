import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { TradeService } from '@/services/TradeService'
import { PositionService } from '@/lib/position'
import type { Position } from '@/lib/position'
import { SchemaManager } from '@/services/SchemaManager'
import 'fake-indexeddb/auto'

describe('TradeService - Atomic Updates & Transactions', () => {
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

    // Second trade fails (attempting to sell more than owned)
    try {
      await tradeService.addTrade({
        position_id: 'pos-123',
        trade_type: 'sell',
        quantity: 150, // Trying to sell 150 but only have 100
        price: 155.00,
        timestamp: new Date()
      })
    } catch (error) {
      // Expected to fail due to overselling
    }

    // Verify position still has only the first trade (second was rejected)
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
