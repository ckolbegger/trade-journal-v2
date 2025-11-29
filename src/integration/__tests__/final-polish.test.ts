import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PositionService } from '@/lib/position'
import { TradeService } from '@/services/TradeService'
import { ServiceContainer } from '@/services/ServiceContainer'
import type { Position, Trade } from '@/lib/position'

const createTestPosition = (overrides?: Partial<Position>): Position => ({
  id: 'pos-123',
  symbol: 'AAPL',
  strategy_type: 'Long Stock',
  target_entry_price: 150,
  target_quantity: 100,
  profit_target: 165,
  stop_loss: 135,
  position_thesis: 'Test position thesis',
  created_date: new Date('2024-01-15T00:00:00.000Z'),
  status: 'planned',
  journal_entry_ids: [],
  trades: [],
  ...overrides
})

const createTestTrade = (overrides?: Partial<Trade>): Trade => ({
  id: 'trade-123',
  position_id: 'pos-123',
  trade_type: 'buy',
  quantity: 100,
  price: 150.25,
  timestamp: new Date('2024-01-15T10:30:00.000Z'),
  notes: 'Test trade execution',
  ...overrides
})

describe('Batch 8: Final Integration & Polish', () => {
  let positionService: PositionService
  let tradeService: TradeService

  beforeEach(async () => {
    // Delete database for clean state
    const deleteRequest = indexedDB.deleteDatabase('TradingJournalDB')
    await new Promise<void>((resolve) => {
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => resolve()
      deleteRequest.onblocked = () => resolve()
    })

    // Reset ServiceContainer
    ServiceContainer.resetInstance()

    // Initialize ServiceContainer with database
    const services = ServiceContainer.getInstance()
    await services.initialize()

    positionService = services.getPositionService()
    tradeService = services.getTradeService()
  })

  afterEach(async () => {
    ServiceContainer.resetInstance()

    // Clean up database
    const deleteRequest = indexedDB.deleteDatabase('TradingJournalDB')
    await new Promise<void>((resolve) => {
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => resolve()
      deleteRequest.onblocked = () => resolve()
    })
  })

  it('[Integration] should handle complete trading workflow from planning to execution', async () => {
    // Phase 1: Position Planning
    const positionPlan = createTestPosition({
      id: 'workflow-pos-123',
      symbol: 'MSFT',
      target_entry_price: 300,
      target_quantity: 50,
      profit_target: 330,
      stop_loss: 270,
      position_thesis: 'Bullish on cloud computing growth',
      journal_entry_ids: ['plan-journal-1'],
    })

    await positionService.create(positionPlan)

    // Verify position is planned
    let position = await positionService.getById('workflow-pos-123')
    expect(position!.status).toBe('planned')
    expect(position!.trades).toHaveLength(0)
    expect(position!.journal_entry_ids).toEqual(['plan-journal-1'])

    // Phase 2: Trade Execution
    const tradeExecution = createTestTrade({
      position_id: 'workflow-pos-123',
      quantity: 50,
      price: 299.50,
      notes: 'Market order filled slightly below target',
    })

    await tradeService.addTrade(tradeExecution)

    // Verify position status updated to open
    position = await positionService.getById('workflow-pos-123')
    expect(position!.status).toBe('open')
    expect(position!.trades).toHaveLength(1)
    expect(position!.trades[0].quantity).toBe(50)
    expect(position!.trades[0].price).toBe(299.50)
    expect(position!.journal_entry_ids).toEqual(['plan-journal-1']) // Journal preserved

    // Phase 3: Analysis & Reporting
    const costBasis = await tradeService.calculateCostBasis('workflow-pos-123')
    expect(costBasis).toBe(299.50)

    const status = await tradeService.computePositionStatus('workflow-pos-123')
    expect(status).toBe('open')

    const trades = await tradeService.getTradesByPositionId('workflow-pos-123')
    expect(trades).toHaveLength(1)
    expect(trades[0].notes).toBe('Market order filled slightly below target')
  })

  it('[Integration] should handle mixed legacy and modern data in complex scenarios', async () => {
    // Create mix of legacy and modern positions
    const legacyPosition = {
      id: 'mixed-legacy-123',
      symbol: 'TSLA',
      strategy_type: 'Long Stock' as const,
      target_entry_price: 200,
      target_quantity: 75,
      profit_target: 220,
      stop_loss: 180,
      position_thesis: 'Legacy position without arrays',
      created_date: new Date('2024-01-15T00:00:00.000Z'),
      status: 'planned' as const,
    }

    const modernPosition = createTestPosition({
      id: 'mixed-modern-123',
      symbol: 'NVDA',
      journal_entry_ids: ['modern-journal-1'],
    })

    await positionService.create(legacyPosition as any)
    await positionService.create(modernPosition)

    // Add trade only to modern position
    const trade = createTestTrade({
      position_id: 'mixed-modern-123',
      quantity: 25,
      price: 450.25,
    })
    await tradeService.addTrade(trade)

    // Verify both positions coexist correctly
    const allPositions = await positionService.getAll()
    expect(allPositions.length).toBeGreaterThanOrEqual(2)

    const legacy = allPositions.find(p => p.id === 'mixed-legacy-123')
    const modern = allPositions.find(p => p.id === 'mixed-modern-123')

    // Legacy position should be migrated but remain planned
    expect(legacy).toBeTruthy()
    expect(legacy!.trades).toEqual([])
    expect(legacy!.journal_entry_ids).toEqual([])
    expect(legacy!.status).toBe('planned')

    // Modern position should have trades and be open
    expect(modern).toBeTruthy()
    expect(modern!.trades).toHaveLength(1)
    expect(modern!.journal_entry_ids).toEqual(['modern-journal-1'])
    expect(modern!.status).toBe('open')

    // Verify service operations work on both
    const legacyCostBasis = await tradeService.calculateCostBasis('mixed-legacy-123')
    const modernCostBasis = await tradeService.calculateCostBasis('mixed-modern-123')

    expect(legacyCostBasis).toBe(0)
    expect(modernCostBasis).toBe(450.25)
  })

  it('[Integration] should maintain data consistency under error conditions', async () => {
    // Create position
    const position = createTestPosition({
      id: 'consistency-pos-123',
      symbol: 'AMZN',
    })
    await positionService.create(position)

    // Add valid trade
    const validTrade = createTestTrade({
      position_id: 'consistency-pos-123',
      quantity: 30,
      price: 3200.25,
    })
    await tradeService.addTrade(validTrade)

    // Verify state before error
    let positionState = await positionService.getById('consistency-pos-123')
    expect(positionState!.trades).toHaveLength(1)
    expect(positionState!.status).toBe('open')

    // Attempt to add invalid trade (should fail)
    const invalidTrade = createTestTrade({
      position_id: 'consistency-pos-123',
      quantity: -10,
    })

    await expect(tradeService.addTrade(invalidTrade))
      .rejects.toThrow('Trade validation failed: Quantity must be positive')

    // Verify state remains unchanged after error
    positionState = await positionService.getById('consistency-pos-123')
    expect(positionState!.trades).toHaveLength(1)
    expect(positionState!.status).toBe('open')
    expect(positionState!.trades[0].quantity).toBe(30)

    // Verify all operations still work correctly
    const costBasis = await tradeService.calculateCostBasis('consistency-pos-123')
    expect(costBasis).toBe(3200.25)

    const status = await tradeService.computePositionStatus('consistency-pos-123')
    expect(status).toBe('open')
  })

  it('[Integration] should handle comprehensive edge cases and boundary conditions', async () => {
    // Edge case 1: Position with maximum quantity
    const maxQuantityPosition = createTestPosition({
      id: 'max-qty-pos-123',
      symbol: 'GOOGL',
      target_quantity: Number.MAX_SAFE_INTEGER,
    })
    await positionService.create(maxQuantityPosition)

    const maxTrade = createTestTrade({
      position_id: 'max-qty-pos-123',
      quantity: Number.MAX_SAFE_INTEGER,
      price: 2500.25,
    })
    await tradeService.addTrade(maxTrade)

    let retrievedPosition = await positionService.getById('max-qty-pos-123')
    expect(retrievedPosition!.trades[0].quantity).toBe(Number.MAX_SAFE_INTEGER)

    // Edge case 2: Position with minimum price
    const minPricePosition = createTestPosition({
      id: 'min-price-pos-123',
      symbol: 'META',
      target_entry_price: 0.01,
    })
    await positionService.create(minPricePosition)

    const minTrade = createTestTrade({
      position_id: 'min-price-pos-123',
      quantity: 1,
      price: 0.01,
    })
    await tradeService.addTrade(minTrade)

    retrievedPosition = await positionService.getById('min-price-pos-123')
    expect(retrievedPosition!.trades[0].price).toBe(0.01)

    // Edge case 3: Very long notes
    const longNotesPosition = createTestPosition({
      id: 'long-notes-pos-123',
      symbol: 'NFLX',
    })
    await positionService.create(longNotesPosition)

    const longTrade = createTestTrade({
      position_id: 'long-notes-pos-123',
      quantity: 100,
      price: 400.25,
      notes: 'A'.repeat(1000), // Very long notes
    })
    await tradeService.addTrade(longTrade)

    retrievedPosition = await positionService.getById('long-notes-pos-123')
    expect(retrievedPosition!.trades[0].notes?.length).toBe(1000)
  })

  it('[Integration] should verify all service methods work correctly with migrated data', async () => {
    // Create legacy position
    const legacyPosition = {
      id: 'migration-test-123',
      symbol: 'PYPL',
      strategy_type: 'Long Stock' as const,
      target_entry_price: 70,
      target_quantity: 50,
      profit_target: 77,
      stop_loss: 63,
      position_thesis: 'Migration test position',
      created_date: new Date('2024-01-15T00:00:00.000Z'),
      status: 'planned' as const,
    }

    await positionService.create(legacyPosition as any)

    // Test all service methods work correctly with migrated data
    const costBasis = await tradeService.calculateCostBasis('migration-test-123')
    expect(costBasis).toBe(0)

    const status = await tradeService.computePositionStatus('migration-test-123')
    expect(status).toBe('planned')

    const trades = await tradeService.getTradesByPositionId('migration-test-123')
    expect(trades).toEqual([])

    // Add trade to migrated position
    const trade = createTestTrade({
      position_id: 'migration-test-123',
      quantity: 25,
      price: 69.50,
    })
    await tradeService.addTrade(trade)

    // Verify all methods still work after adding trade
    const updatedCostBasis = await tradeService.calculateCostBasis('migration-test-123')
    expect(updatedCostBasis).toBe(69.50)

    const updatedStatus = await tradeService.computePositionStatus('migration-test-123')
    expect(updatedStatus).toBe('open')

    const updatedTrades = await tradeService.getTradesByPositionId('migration-test-123')
    expect(updatedTrades).toHaveLength(1)
  })

  it('[Integration] should handle concurrent access and race conditions', async () => {
    // Create position
    const position = createTestPosition({
      id: 'concurrent-test-123',
      symbol: 'INTC',
    })
    await positionService.create(position)

    // Simulate concurrent access
    const promises = []

    // Concurrent reads
    for (let i = 0; i < 5; i++) {
      promises.push(positionService.getById('concurrent-test-123'))
    }

    // Concurrent status checks
    for (let i = 0; i < 3; i++) {
      promises.push(tradeService.computePositionStatus('concurrent-test-123'))
    }

    const results = await Promise.all(promises)

    // All reads should return consistent data
    const positions = results.slice(0, 5).filter(r => r !== null)
    expect(positions.length).toBe(5)

    positions.forEach(pos => {
      expect(pos!.id).toBe('concurrent-test-123')
      expect(pos!.symbol).toBe('INTC')
      expect(pos!.trades).toHaveLength(0)
    })

    // All status checks should be consistent
    const statuses = results.slice(5, 8)
    statuses.forEach(status => {
      expect(status).toBe('planned')
    })

    // Now test with concurrent write
    const trade = createTestTrade({
      position_id: 'concurrent-test-123',
      quantity: 100,
      price: 35.25,
    })

    await tradeService.addTrade(trade)

    // Verify final state is consistent
    const finalPosition = await positionService.getById('concurrent-test-123')
    expect(finalPosition!.trades).toHaveLength(1)
    expect(finalPosition!.status).toBe('open')
  })

  it('[Integration] should validate comprehensive data integrity across all operations', async () => {
    // Create multiple positions with different configurations
    const positions = [
      createTestPosition({ id: 'integrity-1', symbol: 'AAPL' }),
      createTestPosition({ id: 'integrity-2', symbol: 'MSFT' }),
      createTestPosition({ id: 'integrity-3', symbol: 'GOOGL' }),
    ]

    for (const pos of positions) {
      await positionService.create(pos)
    }

    // Add trades to some positions
    const trades = [
      createTestTrade({ position_id: 'integrity-1', quantity: 100, price: 150.25 }),
      createTestTrade({ position_id: 'integrity-3', quantity: 10, price: 2500.75 }),
    ]

    for (const trade of trades) {
      await tradeService.addTrade(trade)
    }

    // Comprehensive integrity check
    const allPositions = await positionService.getAll()
    expect(allPositions.length).toBeGreaterThanOrEqual(3)

    // Verify each position's integrity
    for (const position of allPositions) {
      expect(position.id).toBeTruthy()
      expect(position.symbol).toBeTruthy()
      expect(position.trades).toBeDefined()
      expect(Array.isArray(position.trades)).toBe(true)
      expect(position.journal_entry_ids).toBeDefined()
      expect(Array.isArray(position.journal_entry_ids)).toBe(true)
      expect(position.status).toMatch(/^(planned|open)$/)

      // Verify trades are consistent
      if (position.trades.length > 0) {
        expect(position.status).toBe('open')
        position.trades.forEach(trade => {
          expect(trade.id).toBeTruthy()
          expect(trade.position_id).toBe(position.id)
          expect(trade.quantity).toBeGreaterThan(0)
          expect(trade.price).toBeGreaterThan(0)
        })
      }
    }

    // Verify service operations work on all positions
    for (const position of allPositions) {
      const costBasis = await tradeService.calculateCostBasis(position.id)
      expect(typeof costBasis).toBe('number')
      expect(costBasis).toBeGreaterThanOrEqual(0)

      const status = await tradeService.computePositionStatus(position.id)
      expect(status).toMatch(/^(planned|open)$/)

      const trades = await tradeService.getTradesByPositionId(position.id)
      expect(Array.isArray(trades)).toBe(true)
    }
  })

  it('[Integration] should test multiple trades and position lifecycle comprehensively', async () => {
    // Create position
    const position = createTestPosition({
      id: 'multi-trade-test-123',
      symbol: 'CSCO',
    })
    await positionService.create(position)

    // Test 1: First buy trade
    const trade1 = createTestTrade({
      position_id: 'multi-trade-test-123',
      trade_type: 'buy',
      quantity: 80,
      price: 55.25,
    })
    await tradeService.addTrade(trade1)

    // Test 2: Second buy trade should succeed
    const trade2 = createTestTrade({
      position_id: 'multi-trade-test-123',
      trade_type: 'buy',
      quantity: 20,
      price: 56.00,
      id: 'trade-456',
    })
    await tradeService.addTrade(trade2)

    // Test 3: Position should have both trades
    let retrievedPosition = await positionService.getById('multi-trade-test-123')
    expect(retrievedPosition!.trades).toHaveLength(2)
    expect(retrievedPosition!.status).toBe('open')

    // Test 4: Add exit trade to close position
    const exitTrade = createTestTrade({
      position_id: 'multi-trade-test-123',
      trade_type: 'sell',
      quantity: 100, // Closing entire position (80 + 20)
      price: 57.00,
      id: 'exit-trade-789',
    })
    await tradeService.addTrade(exitTrade)

    // Test 5: Position should be closed
    retrievedPosition = await positionService.getById('multi-trade-test-123')
    expect(retrievedPosition!.trades).toHaveLength(3)
    expect(retrievedPosition!.status).toBe('closed')

    // Test 6: Status computation should work
    const status = await tradeService.computePositionStatus('multi-trade-test-123')
    expect(status).toBe('closed')
  })

  it('[Integration] should verify backward compatibility with various legacy formats', async () => {
    // Test various legacy position formats
    const legacyPositions = [
      {
        id: 'legacy-1',
        symbol: 'ADBE',
        strategy_type: 'Long Stock' as const,
        target_entry_price: 500,
        target_quantity: 20,
        profit_target: 550,
        stop_loss: 450,
        position_thesis: 'Legacy format 1',
        created_date: new Date('2024-01-15T00:00:00.000Z'),
        status: 'planned' as const,
      },
      {
        id: 'legacy-2',
        symbol: 'CRM',
        strategy_type: 'Long Stock' as const,
        target_entry_price: 200,
        target_quantity: 30,
        profit_target: 220,
        stop_loss: 180,
        position_thesis: 'Legacy format 2',
        created_date: new Date('2024-01-15T00:00:00.000Z'),
        status: 'planned' as const,
        journal_entry_ids: ['legacy-journal'], // Partial legacy
      },
    ]

    for (const legacyPos of legacyPositions) {
      await positionService.create(legacyPos as any)
    }

    // Create modern position for comparison
    const modernPosition = createTestPosition({
      id: 'modern-1',
      symbol: 'ZOOM',
      journal_entry_ids: ['modern-journal'],
    })
    await positionService.create(modernPosition)

    // Add trade to modern position
    const trade = createTestTrade({
      position_id: 'modern-1',
      quantity: 40,
      price: 75.25,
    })
    await tradeService.addTrade(trade)

    // Verify all positions work correctly regardless of origin
    const allPositions = await positionService.getAll()
    expect(allPositions.length).toBeGreaterThanOrEqual(3)

    for (const position of allPositions) {
      // All positions should have required fields
      expect(position.trades).toBeDefined()
      expect(Array.isArray(position.trades)).toBe(true)
      expect(position.journal_entry_ids).toBeDefined()
      expect(Array.isArray(position.journal_entry_ids)).toBe(true)

      // All service operations should work
      const costBasis = await tradeService.calculateCostBasis(position.id)
      expect(typeof costBasis).toBe('number')

      const status = await tradeService.computePositionStatus(position.id)
      expect(status).toMatch(/^(planned|open)$/)

      const trades = await tradeService.getTradesByPositionId(position.id)
      expect(Array.isArray(trades)).toBe(true)
    }
  })

  it('[Integration] should perform comprehensive error handling and recovery', async () => {
    // Test 1: Invalid trade data
    const position = createTestPosition({
      id: 'error-test-123',
      symbol: 'UBER',
    })
    await positionService.create(position)

    // Various invalid trade scenarios
    const invalidTrades = [
      createTestTrade({ position_id: 'error-test-123', quantity: 0 }),
      createTestTrade({ position_id: 'error-test-123', quantity: -100 }),
      // price: 0 is now valid (worthless exits), so removed from invalid list
      createTestTrade({ position_id: 'error-test-123', price: -50 }),
      createTestTrade({ position_id: 'error-test-123', trade_type: 'invalid' as any }),
      createTestTrade({ position_id: 'non-existent', quantity: 100 }),
    ]

    for (const invalidTrade of invalidTrades) {
      await expect(tradeService.addTrade(invalidTrade))
        .rejects.toThrow()
    }

    // Verify position remains unchanged after all failed operations
    const retrievedPosition = await positionService.getById('error-test-123')
    expect(retrievedPosition!.trades).toHaveLength(0)
    expect(retrievedPosition!.status).toBe('planned')

    // Test 2: Operations on non-existent positions
    await expect(tradeService.getTradesByPositionId('non-existent'))
      .rejects.toThrow('Position not found: non-existent')

    await expect(tradeService.calculateCostBasis('non-existent'))
      .rejects.toThrow('Position not found: non-existent')

    await expect(tradeService.computePositionStatus('non-existent'))
      .rejects.toThrow('Position not found: non-existent')

    // Test 3: Recovery - verify normal operations still work
    const validTrade = createTestTrade({
      position_id: 'error-test-123',
      quantity: 50,
      price: 80.25,
    })
    await tradeService.addTrade(validTrade)

    const finalPosition = await positionService.getById('error-test-123')
    expect(finalPosition!.trades).toHaveLength(1)
    expect(finalPosition!.status).toBe('open')
  })

})