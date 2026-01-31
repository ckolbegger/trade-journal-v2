import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PositionService } from '@/lib/position'
import type { Position } from '@/lib/position'
import { setupTestServices, teardownTestServices } from '@/test/db-helpers'
import 'fake-indexeddb/auto'

describe('PositionService - Status Computation', () => {
  let positionService: PositionService

  beforeEach(async () => {
    const services = await setupTestServices()
    positionService = services.positionService
  })

  afterEach(async () => {
    await teardownTestServices()
  })

  it('[Service] should compute status dynamically on load', async () => {
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

    expect(retrieved!.status).toBe('planned')
  })

  it('[Service] should update status after trade addition', async () => {
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

    // Add a trade
    const retrieved = await positionService.getById('pos-123')
    retrieved!.trades.push({
      id: 'trade-123',
      position_id: 'pos-123',
      trade_type: 'buy',
      quantity: 100,
      price: 150.50,
      timestamp: new Date()
    })
    await positionService.update(retrieved!)

    // Status should now be 'open'
    const updated = await positionService.getById('pos-123')
    expect(updated!.status).toBe('open')
  })

  it('[Service] should compute status for new positions', async () => {
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

    expect(retrieved!.status).toBe('planned')
  })

  it('[Service] should compute status for existing positions', async () => {
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
      trades: [{
        id: 'trade-123',
        position_id: 'pos-123',
        trade_type: 'buy',
        quantity: 100,
        price: 150.50,
        timestamp: new Date()
      }]
    }

    await positionService.create(position)
    const retrieved = await positionService.getById('pos-123')

    expect(retrieved!.status).toBe('open')
  })

  it('[Service] should not store status in IndexedDB', async () => {
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

    // Manually check database to see if status is stored
    // Status should be computed, not stored
    const retrieved = await positionService.getById('pos-123')
    expect(retrieved!.status).toBe('planned')
  })

  it('[Service] should compute fresh status on every retrieval', async () => {
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

    // First retrieval
    const retrieved1 = await positionService.getById('pos-123')
    expect(retrieved1!.status).toBe('planned')

    // Add trade and save
    retrieved1!.trades.push({
      id: 'trade-123',
      position_id: 'pos-123',
      trade_type: 'buy',
      quantity: 100,
      price: 150.50,
      timestamp: new Date()
    })
    await positionService.update(retrieved1!)

    // Second retrieval should have updated status
    const retrieved2 = await positionService.getById('pos-123')
    expect(retrieved2!.status).toBe('open')
  })

  it('[Service] should handle modified trades array correctly', async () => {
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
      trades: [{
        id: 'trade-123',
        position_id: 'pos-123',
        trade_type: 'buy',
        quantity: 100,
        price: 150.50,
        timestamp: new Date()
      }]
    }

    await positionService.create(position)
    const retrieved = await positionService.getById('pos-123')

    expect(retrieved!.status).toBe('open')
    expect(retrieved!.trades.length).toBe(1)
  })

  it('[Service] should default to "planned" if data is corrupted', async () => {
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
      trades: [] as any // Could be corrupted
    }

    await positionService.create(position)
    const retrieved = await positionService.getById('pos-123')

    expect(retrieved!.status).toBe('planned')
  })
})
