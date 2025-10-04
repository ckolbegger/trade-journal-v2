import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PositionService } from '@/lib/position'
import { TradeService } from '@/services/TradeService'
import type { Position, Trade } from '@/lib/position'
import { computePositionStatus } from '@/utils/statusComputation'

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

describe('Batch 7: Integration & End-to-End Tests', () => {
  let positionService: PositionService
  let tradeService: TradeService
  let testDbName: string

  beforeEach(async () => {
    // Generate unique test database name
    testDbName = `TradingJournalDB_Integration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create services with test database
    positionService = new PositionService()
    ;(positionService as any).dbName = testDbName
    tradeService = new TradeService(positionService)
  })

  afterEach(async () => {
    // Clean up test database
    try {
      await positionService.clearAll()
    } catch (error) {
      // Ignore errors during cleanup
    }
    if (positionService && typeof positionService.close === 'function') {
      positionService.close()
    }
    if (tradeService && typeof tradeService.close === 'function') {
      tradeService.close()
    }

    // Delete the test database
    return new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase(testDbName)
      request.onsuccess = () => resolve()
      request.onerror = () => resolve() // Ignore errors
    })
  })

  it('[Integration] should complete full position lifecycle: create → trade → retrieve → status update', async () => {
    // Arrange - Create position
    const position = createTestPosition({
      id: 'lifecycle-pos-123',
      symbol: 'MSFT',
    })
    await positionService.create(position)

    // Act 1 - Retrieve position (should be planned)
    const retrievedPosition = await positionService.getById('lifecycle-pos-123')
    expect(retrievedPosition).toBeTruthy()
    expect(retrievedPosition!.status).toBe('planned')
    expect(retrievedPosition!.trades).toHaveLength(0)

    // Act 2 - Add trade to position
    const trade = createTestTrade({
      position_id: 'lifecycle-pos-123',
      quantity: 50,
      price: 300.50,
    })
    await tradeService.addTrade(trade)

    // Act 3 - Verify position status updated to open
    const updatedPosition = await positionService.getById('lifecycle-pos-123')
    expect(updatedPosition).toBeTruthy()
    expect(updatedPosition!.status).toBe('open')
    expect(updatedPosition!.trades).toHaveLength(1)
    expect(updatedPosition!.trades[0].quantity).toBe(50)
    expect(updatedPosition!.trades[0].price).toBe(300.50)

    // Act 4 - Compute cost basis
    const costBasis = await tradeService.calculateCostBasis('lifecycle-pos-123')
    expect(costBasis).toBe(300.50)

    // Act 5 - Get trades by position
    const positionTrades = await tradeService.getTradesByPositionId('lifecycle-pos-123')
    expect(positionTrades).toHaveLength(1)
    expect(positionTrades[0].notes).toBe('Test trade execution')
  })

  it('[Integration] should handle multiple positions with trades independently', async () => {
    // Arrange - Create multiple positions
    const position1 = createTestPosition({
      id: 'multi-pos-1',
      symbol: 'AAPL',
    })
    const position2 = createTestPosition({
      id: 'multi-pos-2',
      symbol: 'GOOGL',
    })

    await positionService.create(position1)
    await positionService.create(position2)

    // Act - Add trades to different positions
    const trade1 = createTestTrade({
      position_id: 'multi-pos-1',
      quantity: 100,
      price: 150.25,
    })
    const trade2 = createTestTrade({
      position_id: 'multi-pos-2',
      quantity: 10,
      price: 2500.75,
    })

    await tradeService.addTrade(trade1)
    await tradeService.addTrade(trade2)

    // Assert - Verify each position has its own trades
    const retrievedPosition1 = await positionService.getById('multi-pos-1')
    const retrievedPosition2 = await positionService.getById('multi-pos-2')

    expect(retrievedPosition1!.trades).toHaveLength(1)
    expect(retrievedPosition1!.trades[0].price).toBe(150.25)
    expect(retrievedPosition1!.trades[0].quantity).toBe(100)

    expect(retrievedPosition2!.trades).toHaveLength(1)
    expect(retrievedPosition2!.trades[0].price).toBe(2500.75)
    expect(retrievedPosition2!.trades[0].quantity).toBe(10)

    // Assert - Verify cost basis calculations are independent
    const costBasis1 = await tradeService.calculateCostBasis('multi-pos-1')
    const costBasis2 = await tradeService.calculateCostBasis('multi-pos-2')

    expect(costBasis1).toBe(150.25)
    expect(costBasis2).toBe(2500.75)
  })

  it('[Integration] should enforce Phase 1A constraint: maximum 1 trade per position', async () => {
    // Arrange - Create position and add first trade
    const position = createTestPosition({
      id: 'constraint-pos-123',
      symbol: 'TSLA',
    })
    await positionService.create(position)

    const firstTrade = createTestTrade({
      position_id: 'constraint-pos-123',
      quantity: 75,
      price: 200.50,
    })
    await tradeService.addTrade(firstTrade)

    // Act & Assert - Try to add second trade (should fail)
    const secondTrade = createTestTrade({
      position_id: 'constraint-pos-123',
      quantity: 25,
      price: 205.00,
      id: 'trade-456',
    })

    await expect(tradeService.addTrade(secondTrade))
      .rejects.toThrow('Phase 1A allows only one trade per position')

    // Assert - Verify only first trade exists
    const retrievedPosition = await positionService.getById('constraint-pos-123')
    expect(retrievedPosition!.trades).toHaveLength(1)
    expect(retrievedPosition!.trades[0].quantity).toBe(75)
    expect(retrievedPosition!.trades[0].price).toBe(200.50)
  })

  it('[Integration] should handle error scenarios gracefully across services', async () => {
    // Act & Assert - Try to add trade to non-existent position
    const invalidTrade = createTestTrade({
      position_id: 'non-existent-position',
    })

    await expect(tradeService.addTrade(invalidTrade))
      .rejects.toThrow('Position not found: non-existent-position')

    // Act & Assert - Try to get trades from non-existent position
    await expect(tradeService.getTradesByPositionId('non-existent-position'))
      .rejects.toThrow('Position not found: non-existent-position')

    // Act & Assert - Try to calculate cost basis for non-existent position
    await expect(tradeService.calculateCostBasis('non-existent-position'))
      .rejects.toThrow('Position not found: non-existent-position')

    // Act & Assert - Try to compute status for non-existent position
    await expect(tradeService.computePositionStatus('non-existent-position'))
      .rejects.toThrow('Position not found: non-existent-position')
  })

  it('[Integration] should maintain data consistency during concurrent operations', async () => {
    // Arrange - Create position
    const position = createTestPosition({
      id: 'concurrent-pos-123',
      symbol: 'AMZN',
    })
    await positionService.create(position)

    // Act - Perform concurrent operations
    const trade = createTestTrade({
      position_id: 'concurrent-pos-123',
      quantity: 30,
      price: 3200.25,
    })

    // Add trade and simultaneously retrieve position
    const [addTradeResult, retrievedPosition] = await Promise.all([
      tradeService.addTrade(trade),
      positionService.getById('concurrent-pos-123')
    ])

    // Assert - Verify data consistency
    expect(addTradeResult).toHaveLength(1)
    expect(addTradeResult[0].quantity).toBe(30)

    // The retrieved position might be from before or after the trade
    expect(retrievedPosition).toBeTruthy()
    expect(retrievedPosition!.id).toBe('concurrent-pos-123')

    // Final verification should show consistent state
    const finalPosition = await positionService.getById('concurrent-pos-123')
    expect(finalPosition!.trades).toHaveLength(1)
    expect(finalPosition!.trades[0].quantity).toBe(30)
  })

  it('[Integration] should handle position updates with existing trades', async () => {
    // Arrange - Create position and add trade
    const position = createTestPosition({
      id: 'update-pos-123',
      symbol: 'NVDA',
      profit_target: 500,
    })
    await positionService.create(position)

    const trade = createTestTrade({
      position_id: 'update-pos-123',
      quantity: 20,
      price: 450.25,
    })
    await tradeService.addTrade(trade)

    // Act - Update position (should preserve trades)
    const currentPosition = await positionService.getById('update-pos-123')
    const updatedPosition = {
      ...currentPosition!,
      profit_target: 550, // Updated profit target
      position_thesis: 'Updated thesis with better outlook',
    }
    await positionService.update(updatedPosition)

    // Assert - Verify trades are preserved
    const retrievedPosition = await positionService.getById('update-pos-123')
    expect(retrievedPosition!.profit_target).toBe(550)
    expect(retrievedPosition!.position_thesis).toBe('Updated thesis with better outlook')
    expect(retrievedPosition!.trades).toHaveLength(1)
    expect(retrievedPosition!.trades[0].quantity).toBe(20)
    expect(retrievedPosition!.trades[0].price).toBe(450.25)

    // Assert - Verify trade operations still work
    const costBasis = await tradeService.calculateCostBasis('update-pos-123')
    expect(costBasis).toBe(450.25)
  })

  it('[Integration] should validate trade data before adding to position', async () => {
    // Arrange - Create position
    const position = createTestPosition({
      id: 'validation-pos-123',
      symbol: 'META',
    })
    await positionService.create(position)

    // Act & Assert - Try to add invalid trade (negative quantity)
    const invalidTrade = createTestTrade({
      position_id: 'validation-pos-123',
      quantity: -100,
    })

    await expect(tradeService.addTrade(invalidTrade))
      .rejects.toThrow('Trade validation failed: Quantity must be positive')

    // Assert - Verify no trade was added
    const retrievedPosition = await positionService.getById('validation-pos-123')
    expect(retrievedPosition!.trades).toHaveLength(0)

    // Act & Assert - Try to add invalid trade (invalid trade type)
    const invalidTypeTrade = createTestTrade({
      position_id: 'validation-pos-123',
      trade_type: 'invalid' as any,
    })

    await expect(tradeService.addTrade(invalidTypeTrade))
      .rejects.toThrow('Trade validation failed: Invalid trade type')

    // Assert - Verify still no trade was added
    const finalPosition = await positionService.getById('validation-pos-123')
    expect(finalPosition!.trades).toHaveLength(0)
  })

  it('[Integration] should compute position status correctly through trade operations', async () => {
    // Arrange - Create position
    const position = createTestPosition({
      id: 'status-pos-123',
      symbol: 'NFLX',
    })
    await positionService.create(position)

    // Act & Assert 1 - Status should be planned initially
    let status = await tradeService.computePositionStatus('status-pos-123')
    expect(status).toBe('planned')

    // Act & Assert 2 - Status should be open after adding trade
    const trade = createTestTrade({
      position_id: 'status-pos-123',
      quantity: 15,
      price: 400.25,
    })
    await tradeService.addTrade(trade)

    status = await tradeService.computePositionStatus('status-pos-123')
    expect(status).toBe('open')

    // Act & Assert 3 - Status should remain open after position update
    const currentPosition = await positionService.getById('status-pos-123')
    const updatedPosition = {
      ...currentPosition!,
      position_thesis: 'Updated thesis',
    }
    await positionService.update(updatedPosition)

    status = await tradeService.computePositionStatus('status-pos-123')
    expect(status).toBe('open')
  })

  it('[Integration] should handle database operations with proper error handling', async () => {
    // Act & Assert - Try to get trades from non-existent position
    await expect(tradeService.getTradesByPositionId('non-existent-position'))
      .rejects.toThrow('Position not found: non-existent-position')

    // Act & Assert - Try to calculate cost basis for non-existent position
    await expect(tradeService.calculateCostBasis('non-existent-position'))
      .rejects.toThrow('Position not found: non-existent-position')

    // Act & Assert - Try to compute status for non-existent position
    await expect(tradeService.computePositionStatus('non-existent-position'))
      .rejects.toThrow('Position not found: non-existent-position')

    // Verify original services still work
    const workingPosition = createTestPosition({
      id: 'working-pos-123',
      symbol: 'CSCO',
    })
    await positionService.create(workingPosition)

    const retrievedPosition = await positionService.getById('working-pos-123')
    expect(retrievedPosition).toBeTruthy()
    expect(retrievedPosition!.symbol).toBe('CSCO')
  })

  it('[Integration] should handle trade ID generation and uniqueness', async () => {
    // Arrange - Create position
    const position = createTestPosition({
      id: 'id-test-pos-123',
      symbol: 'PYPL',
    })
    await positionService.create(position)

    // Act - Add multiple trades to different positions
    const trade1 = createTestTrade({
      position_id: 'id-test-pos-123',
      quantity: 25,
      price: 70.25,
    })

    // Create second position and trade
    const position2 = createTestPosition({
      id: 'id-test-pos-456',
      symbol: 'ADBE',
    })
    await positionService.create(position2)

    const trade2 = createTestTrade({
      position_id: 'id-test-pos-456',
      quantity: 15,
      price: 550.75,
    })

    const result1 = await tradeService.addTrade(trade1)
    const result2 = await tradeService.addTrade(trade2)

    // Assert - Verify IDs are generated and unique
    expect(result1).toHaveLength(1)
    expect(result2).toHaveLength(1)

    const tradeId1 = result1[0].id
    const tradeId2 = result2[0].id

    expect(tradeId1).toBeTruthy()
    expect(tradeId2).toBeTruthy()
    expect(tradeId1).not.toBe(tradeId2)

    // Verify IDs follow expected format
    expect(tradeId1).toMatch(/^trade-\d+-[a-z0-9]+$/)
    expect(tradeId2).toMatch(/^trade-\d+-[a-z0-9]+$/)
  })

  it('[Integration] should handle position lifecycle with journal integration', async () => {
    // Arrange - Create position with journal entries
    const position = createTestPosition({
      id: 'journal-pos-123',
      symbol: 'UBER',
      journal_entry_ids: ['journal-1', 'journal-2'],
    })
    await positionService.create(position)

    // Act - Add trade
    const trade = createTestTrade({
      position_id: 'journal-pos-123',
      quantity: 40,
      price: 80.25,
    })
    await tradeService.addTrade(trade)

    // Assert - Verify journal entries are preserved
    const retrievedPosition = await positionService.getById('journal-pos-123')
    expect(retrievedPosition!.journal_entry_ids).toEqual(['journal-1', 'journal-2'])
    expect(retrievedPosition!.trades).toHaveLength(1)

    // Act - Update position with additional journal entry
    const updatedPosition = {
      ...retrievedPosition!,
      journal_entry_ids: ['journal-1', 'journal-2', 'journal-3'],
    }
    await positionService.update(updatedPosition)

    // Assert - Verify both journal entries and trades are preserved
    const finalPosition = await positionService.getById('journal-pos-123')
    expect(finalPosition!.journal_entry_ids).toEqual(['journal-1', 'journal-2', 'journal-3'])
    expect(finalPosition!.trades).toHaveLength(1)
  })

  it('[Integration] should handle edge case: empty trade arrays in status computation', async () => {
    // Arrange - Create position with empty trades array
    const position = createTestPosition({
      id: 'empty-trades-pos-123',
      symbol: 'ZOOM',
      trades: [],
    })
    await positionService.create(position)

    // Act & Assert - Status should be planned
    const status = await tradeService.computePositionStatus('empty-trades-pos-123')
    expect(status).toBe('planned')

    // Act & Assert - Direct computation should also work
    const retrievedPosition = await positionService.getById('empty-trades-pos-123')
    const directStatus = computePositionStatus(retrievedPosition!.trades)
    expect(directStatus).toBe('planned')
  })

  it('[Integration] should handle data migration during position retrieval', async () => {
    // Arrange - Create legacy position directly in database
    const legacyPosition = {
      id: 'migration-pos-123',
      symbol: 'CRWD',
      strategy_type: 'Long Stock' as const,
      target_entry_price: 120,
      target_quantity: 50,
      profit_target: 150,
      stop_loss: 100,
      position_thesis: 'Legacy position for migration test',
      created_date: new Date('2024-01-15T00:00:00.000Z'),
      status: 'planned' as const,
      // Missing trades and journal_entry_ids fields
    }

    await positionService.create(legacyPosition as any)

    // Act - Retrieve through trade service (should trigger migration)
    const trades = await tradeService.getTradesByPositionId('migration-pos-123')
    const status = await tradeService.computePositionStatus('migration-pos-123')
    const costBasis = await tradeService.calculateCostBasis('migration-pos-123')

    // Assert - Verify migration worked correctly
    expect(trades).toEqual([]) // Empty array after migration
    expect(status).toBe('planned') // No trades = planned
    expect(costBasis).toBe(0) // No trades = 0 cost basis

    // Verify position is properly migrated
    const migratedPosition = await positionService.getById('migration-pos-123')
    expect(migratedPosition!.trades).toEqual([])
    expect(migratedPosition!.journal_entry_ids).toEqual([])
  })

})