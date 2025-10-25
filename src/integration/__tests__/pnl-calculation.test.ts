import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PositionService } from '@/lib/position'
import { PriceService } from '@/services/PriceService'
import { calculatePositionPnL, getPriceMapForPosition } from '@/utils/pnl'
import { calculateCostBasis } from '@/utils/costBasis'
import type { Position } from '@/lib/position'
import 'fake-indexeddb/auto'

/**
 * Integration Tests for P&L Calculation
 *
 * Tests complete workflow: Position with trades + Price data = P&L
 */

describe('Integration: P&L Calculation', () => {
  let positionService: PositionService
  let priceService: PriceService

  beforeEach(async () => {
    positionService = new PositionService()
    priceService = new PriceService()

    // Ensure databases are initialized
    await positionService['getDB']()
    await priceService['getDB']()
  })

  afterEach(async () => {
    await positionService.clearAll()
    await priceService.clearAll()
  })

  it('[Integration] should calculate correct P&L for position with single trade', async () => {
    // Arrange - Create position with one trade
    const position: Position = {
      id: 'pos-integration-1',
      symbol: 'AAPL',
      strategy_type: 'Long Stock',
      target_entry_price: 150,
      target_quantity: 100,
      profit_target: 165,
      stop_loss: 135,
      position_thesis: 'Test integration',
      created_date: new Date('2024-01-15T00:00:00.000Z'),
      status: 'open',
      journal_entry_ids: [],
      trades: [{
        id: 'trade-1',
        position_id: 'pos-integration-1',
        trade_type: 'buy',
        quantity: 100,
        price: 150.00,
        timestamp: new Date('2024-01-15T10:00:00.000Z'),
        underlying: 'AAPL'
      }]
    }

    await positionService.create(position)

    // Create price data
    await priceService.createOrUpdateSimple({
      underlying: 'AAPL',
      date: '2024-01-20',
      close: 165.00
    })

    // Act - Fetch price and calculate P&L
    const priceMap = await getPriceMapForPosition(position, (underlyings) =>
      priceService.getLatestPrices(underlyings)
    )
    const pnl = calculatePositionPnL(position, priceMap)

    // Assert
    expect(pnl).toBe(1500.00) // (165 - 150) * 100
  })

  it('[Integration] should calculate P&L for position with multiple trades', async () => {
    // Arrange - Position with scale-in trades
    const position: Position = {
      id: 'pos-integration-2',
      symbol: 'TSLA',
      strategy_type: 'Long Stock',
      target_entry_price: 200,
      target_quantity: 150,
      profit_target: 220,
      stop_loss: 180,
      position_thesis: 'Scale-in test',
      created_date: new Date('2024-01-10T00:00:00.000Z'),
      status: 'open',
      journal_entry_ids: [],
      trades: [
        {
          id: 'trade-1',
          position_id: 'pos-integration-2',
          trade_type: 'buy',
          quantity: 75,
          price: 200.00,
          timestamp: new Date('2024-01-10T10:00:00.000Z'),
          underlying: 'TSLA'
        },
        {
          id: 'trade-2',
          position_id: 'pos-integration-2',
          trade_type: 'buy',
          quantity: 75,
          price: 210.00,
          timestamp: new Date('2024-01-12T10:00:00.000Z'),
          underlying: 'TSLA'
        }
      ]
    }

    await positionService.create(position)

    // Create price data
    await priceService.createOrUpdateSimple({
      underlying: 'TSLA',
      date: '2024-01-20',
      close: 215.00
    })

    // Act
    const priceMap = await getPriceMapForPosition(position, (underlyings) =>
      priceService.getLatestPrices(underlyings)
    )
    const pnl = calculatePositionPnL(position, priceMap)

    // Assert
    // Trade 1: (215 - 200) * 75 = 1125
    // Trade 2: (215 - 210) * 75 = 375
    // Total: 1500
    expect(pnl).toBe(1500.00)
  })

  it('[Integration] should share prices for multiple positions with same underlying', async () => {
    // Arrange - Two positions in AAPL
    const position1: Position = {
      id: 'pos-aapl-1',
      symbol: 'AAPL',
      strategy_type: 'Long Stock',
      target_entry_price: 150,
      target_quantity: 100,
      profit_target: 165,
      stop_loss: 135,
      position_thesis: 'First AAPL position',
      created_date: new Date('2024-01-10T00:00:00.000Z'),
      status: 'open',
      journal_entry_ids: [],
      trades: [{
        id: 'trade-1',
        position_id: 'pos-aapl-1',
        trade_type: 'buy',
        quantity: 100,
        price: 150.00,
        timestamp: new Date('2024-01-10T10:00:00.000Z'),
        underlying: 'AAPL'
      }]
    }

    const position2: Position = {
      id: 'pos-aapl-2',
      symbol: 'AAPL',
      strategy_type: 'Long Stock',
      target_entry_price: 160,
      target_quantity: 50,
      profit_target: 175,
      stop_loss: 145,
      position_thesis: 'Second AAPL position',
      created_date: new Date('2024-01-12T00:00:00.000Z'),
      status: 'open',
      journal_entry_ids: [],
      trades: [{
        id: 'trade-2',
        position_id: 'pos-aapl-2',
        trade_type: 'buy',
        quantity: 50,
        price: 160.00,
        timestamp: new Date('2024-01-12T10:00:00.000Z'),
        underlying: 'AAPL'
      }]
    }

    await positionService.create(position1)
    await positionService.create(position2)

    // Create single AAPL price
    await priceService.createOrUpdateSimple({
      underlying: 'AAPL',
      date: '2024-01-20',
      close: 170.00
    })

    // Act - Both positions use same price
    const priceMap1 = await getPriceMapForPosition(position1, (underlyings) =>
      priceService.getLatestPrices(underlyings)
    )
    const priceMap2 = await getPriceMapForPosition(position2, (underlyings) =>
      priceService.getLatestPrices(underlyings)
    )

    const pnl1 = calculatePositionPnL(position1, priceMap1)
    const pnl2 = calculatePositionPnL(position2, priceMap2)

    // Assert
    expect(pnl1).toBe(2000.00) // (170 - 150) * 100
    expect(pnl2).toBe(500.00)  // (170 - 160) * 50

    // Verify same price data used
    expect(priceMap1.get('AAPL')?.close).toBe(170.00)
    expect(priceMap2.get('AAPL')?.close).toBe(170.00)
  })

  it('[Integration] should handle backdated price updates affecting P&L', async () => {
    // Arrange - Position created
    const position: Position = {
      id: 'pos-backdate',
      symbol: 'MSFT',
      strategy_type: 'Long Stock',
      target_entry_price: 300,
      target_quantity: 100,
      profit_target: 330,
      stop_loss: 270,
      position_thesis: 'Backdate test',
      created_date: new Date('2024-01-10T00:00:00.000Z'),
      status: 'open',
      journal_entry_ids: [],
      trades: [{
        id: 'trade-1',
        position_id: 'pos-backdate',
        trade_type: 'buy',
        quantity: 100,
        price: 300.00,
        timestamp: new Date('2024-01-10T10:00:00.000Z'),
        underlying: 'MSFT'
      }]
    }

    await positionService.create(position)

    // Create initial price
    await priceService.createOrUpdateSimple({
      underlying: 'MSFT',
      date: '2024-01-20',
      close: 320.00
    })

    // Act 1 - Initial P&L
    let priceMap = await getPriceMapForPosition(position, (underlyings) =>
      priceService.getLatestPrices(underlyings)
    )
    let pnl = calculatePositionPnL(position, priceMap)

    // Assert 1
    expect(pnl).toBe(2000.00) // (320 - 300) * 100

    // Act 2 - Backdate a price update for earlier date
    await priceService.createOrUpdateSimple({
      underlying: 'MSFT',
      date: '2024-01-15',
      close: 310.00
    })

    // Latest price is still Jan 20
    priceMap = await getPriceMapForPosition(position, (underlyings) =>
      priceService.getLatestPrices(underlyings)
    )
    pnl = calculatePositionPnL(position, priceMap)

    // Assert 2 - P&L unchanged (still uses latest date)
    expect(pnl).toBe(2000.00)
  })
})
