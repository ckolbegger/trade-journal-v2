import { describe, it, expect, beforeEach } from 'vitest'
import { PriceService } from '@/services/PriceService'
import { PositionService } from '@/lib/position'
import { TradeService } from '@/services/TradeService'
import type { Position } from '@/lib/position'
import { calculatePositionPnL, calculatePnLPercentage } from '@/utils/pnl'
import 'fake-indexeddb/auto'

/**
 * E2E Integration Tests for Complete P&L Flow
 *
 * Tests the complete workflow:
 * - Create position
 * - Add trade
 * - Update price
 * - Calculate P&L
 * - Verify accuracy
 */

describe('Integration: Complete P&L Workflow', () => {
  let priceService: PriceService
  let positionService: PositionService
  let tradeService: TradeService

  beforeEach(async () => {
    // Initialize services (this triggers database creation)
    priceService = new PriceService()
    positionService = new PositionService()
    tradeService = new TradeService()

    // Wait for database initialization by making a simple query
    try {
      await positionService.getAll()
    } catch {
      // Database might not exist yet, which is fine
    }

    // Clear all data
    try {
      await priceService.clearAll()
    } catch {
      // Price store might not exist yet
    }
  })

  it('[E2E] should complete full workflow: create position → add trade → update price → see P&L', async () => {
    // Step 1: Create position
    const position: Position = {
      id: 'test-pos-1',
      symbol: 'AAPL',
      strategy_type: 'Long Stock',
      target_entry_price: 150.00,
      target_quantity: 100,
      profit_target: 160.00,
      stop_loss: 145.00,
      position_thesis: 'Bullish on Apple',
      created_date: new Date('2024-01-15'),
      status: 'planned',
      journal_entry_ids: [],
      trades: []
    }

    const createdPosition = await positionService.create(position)
    expect(createdPosition.id).toBe('test-pos-1')

    // Step 2: Add trade at $150
    const trade = {
      id: 'trade-1',
      position_id: 'test-pos-1',
      trade_type: 'buy' as const,
      quantity: 100,
      price: 150.00,
      timestamp: new Date('2024-01-15T10:00:00'),
      underlying: 'AAPL'
    }

    const trades = await tradeService.addTrade(trade)
    expect(trades).toHaveLength(1)
    expect(trades[0].price).toBe(150.00)

    // Step 3: Update price to $155 (profit of $5/share = $500 total)
    const priceHistory = await priceService.createOrUpdateSimple({
      underlying: 'AAPL',
      date: '2024-01-20',
      close: 155.00
    })

    expect(priceHistory.close).toBe(155.00)

    // Step 4: Calculate P&L
    const updatedPosition = await positionService.getById('test-pos-1')
    expect(updatedPosition).not.toBeNull()

    const priceMap = new Map([[priceHistory.underlying, priceHistory]])
    const pnl = calculatePositionPnL(updatedPosition!, priceMap)

    // Assert: P&L should be $500 (100 shares * $5 gain)
    expect(pnl).toBe(500.00)

    // Calculate percentage
    const costBasis = 100 * 150.00 // $15,000
    const percentage = calculatePnLPercentage(pnl!, costBasis)
    expect(percentage).toBeCloseTo(3.33, 1) // 3.33%
  })

  // NOTE: Scale-in testing deferred to Phase 2
  // Phase 1A allows only one trade per position

  it('[E2E] should handle backdated price updates', async () => {
    // Create position with trade
    const position: Position = {
      id: 'test-pos-3',
      symbol: 'TSLA',
      strategy_type: 'Long Stock',
      target_entry_price: 200.00,
      target_quantity: 50,
      profit_target: 220.00,
      stop_loss: 190.00,
      position_thesis: 'Backdated test',
      created_date: new Date('2024-01-01'),
      status: 'open',
      journal_entry_ids: [],
      trades: [
        {
          id: 'trade-1',
          position_id: 'test-pos-3',
          trade_type: 'buy',
          quantity: 50,
          price: 200.00,
          timestamp: new Date('2024-01-01T10:00:00'),
          underlying: 'TSLA'
        }
      ]
    }

    await positionService.create(position)

    // Add backdated price for Jan 10
    await priceService.createOrUpdateSimple({
      underlying: 'TSLA',
      date: '2024-01-10',
      close: 210.00
    })

    // Add current price for Jan 20
    const latestPrice = await priceService.createOrUpdateSimple({
      underlying: 'TSLA',
      date: '2024-01-20',
      close: 215.00
    })

    // Get latest price and calculate P&L
    const currentPrice = await priceService.getLatestPrice('TSLA')
    expect(currentPrice?.close).toBe(215.00)

    const updatedPosition = await positionService.getById('test-pos-3')
    const priceMap = new Map([[currentPrice!.underlying, currentPrice!]])
    const pnl = calculatePositionPnL(updatedPosition!, priceMap)

    // P&L = (215-200)*50 = $750
    expect(pnl).toBe(750.00)
  })

  it('[E2E] should handle large price change validation', async () => {
    // Create position with trade
    const position: Position = {
      id: 'test-pos-4',
      symbol: 'NVDA',
      strategy_type: 'Long Stock',
      target_entry_price: 100.00,
      target_quantity: 100,
      profit_target: 120.00,
      stop_loss: 95.00,
      position_thesis: 'Price validation test',
      created_date: new Date('2024-01-15'),
      status: 'open',
      journal_entry_ids: [],
      trades: [
        {
          id: 'trade-1',
          position_id: 'test-pos-4',
          trade_type: 'buy',
          quantity: 100,
          price: 100.00,
          timestamp: new Date('2024-01-15T10:00:00'),
          underlying: 'NVDA'
        }
      ]
    }

    await positionService.create(position)

    // Set initial price
    await priceService.createOrUpdateSimple({
      underlying: 'NVDA',
      date: '2024-01-15',
      close: 100.00
    })

    // Attempt to set price with >20% change
    const validation = await priceService.validatePriceChange('NVDA', 130.00)

    expect(validation.requiresConfirmation).toBe(true)
    expect(validation.percentChange).toBe(30.0)
    expect(validation.oldPrice).toBe(100.00)
  })

  it('[E2E] should calculate P&L correctly for multiple positions with shared underlying', async () => {
    // Create two positions for same underlying
    const position1: Position = {
      id: 'test-pos-5a',
      symbol: 'GOOGL',
      strategy_type: 'Long Stock',
      target_entry_price: 140.00,
      target_quantity: 50,
      profit_target: 150.00,
      stop_loss: 135.00,
      position_thesis: 'Position 1',
      created_date: new Date('2024-01-01'),
      status: 'open',
      journal_entry_ids: [],
      trades: [
        {
          id: 'trade-1',
          position_id: 'test-pos-5a',
          trade_type: 'buy',
          quantity: 50,
          price: 140.00,
          timestamp: new Date('2024-01-01T10:00:00'),
          underlying: 'GOOGL'
        }
      ]
    }

    const position2: Position = {
      id: 'test-pos-5b',
      symbol: 'GOOGL',
      strategy_type: 'Long Stock',
      target_entry_price: 145.00,
      target_quantity: 30,
      profit_target: 155.00,
      stop_loss: 140.00,
      position_thesis: 'Position 2',
      created_date: new Date('2024-01-10'),
      status: 'open',
      journal_entry_ids: [],
      trades: [
        {
          id: 'trade-2',
          position_id: 'test-pos-5b',
          trade_type: 'buy',
          quantity: 30,
          price: 145.00,
          timestamp: new Date('2024-01-10T10:00:00'),
          underlying: 'GOOGL'
        }
      ]
    }

    await positionService.create(position1)
    await positionService.create(position2)

    // Set shared price
    const priceHistory = await priceService.createOrUpdateSimple({
      underlying: 'GOOGL',
      date: '2024-01-20',
      close: 150.00
    })

    const priceMap = new Map([[priceHistory.underlying, priceHistory]])

    // Calculate P&L for both positions
    const pos1 = await positionService.getById('test-pos-5a')
    const pnl1 = calculatePositionPnL(pos1!, priceMap)
    // (150-140)*50 = $500
    expect(pnl1).toBe(500.00)

    const pos2 = await positionService.getById('test-pos-5b')
    const pnl2 = calculatePositionPnL(pos2!, priceMap)
    // (150-145)*30 = $150
    expect(pnl2).toBe(150.00)

    // Total portfolio P&L = $650
    const totalPnL = pnl1! + pnl2!
    expect(totalPnL).toBe(650.00)
  })
})
