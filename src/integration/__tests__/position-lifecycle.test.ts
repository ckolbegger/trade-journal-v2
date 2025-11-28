/**
 * Position Lifecycle Integration Test
 *
 * Tests the complete lifecycle of a position from creation through closing:
 * planned → open → closed
 *
 * This test verifies that:
 * 1. Position status transitions correctly based on trades
 * 2. Closed positions can be persisted and retrieved
 * 3. The type system correctly handles all status values
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PositionService } from '@/lib/position'
import { TradeService } from '@/services/TradeService'
import type { Position } from '@/lib/position'
import 'fake-indexeddb/auto'

const createTestPosition = (overrides?: Partial<Position>): Position => ({
  id: `pos-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

describe('Position Lifecycle Integration', () => {
  let positionService: PositionService
  let tradeService: TradeService

  beforeEach(async () => {
    // Clear IndexedDB before each test
    indexedDB.deleteDatabase('TradingJournalDB')

    positionService = new PositionService()
    tradeService = new TradeService(positionService)
  })

  afterEach(() => {
    positionService.close()
    tradeService.close()
  })

  describe('Full Lifecycle: planned → open → closed', () => {
    it('should transition position through all status states', async () => {
      // 1. Create position - status should be "planned"
      const position = createTestPosition({ id: 'lifecycle-test-1' })
      await positionService.create(position)

      const plannedPosition = await positionService.getById('lifecycle-test-1')
      expect(plannedPosition).toBeTruthy()
      expect(plannedPosition!.status).toBe('planned')
      expect(plannedPosition!.trades).toHaveLength(0)

      // 2. Add buy trade - status should become "open"
      await tradeService.addTrade({
        position_id: 'lifecycle-test-1',
        trade_type: 'buy',
        quantity: 100,
        price: 150.00,
        timestamp: new Date('2024-01-16T10:00:00.000Z'),
        underlying: 'AAPL'
      })

      const openPosition = await positionService.getById('lifecycle-test-1')
      expect(openPosition).toBeTruthy()
      expect(openPosition!.status).toBe('open')
      expect(openPosition!.trades).toHaveLength(1)
    })

    it('should persist and retrieve a closed position', async () => {
      // Create position with buy and sell trades that result in closed status
      const closedPosition = createTestPosition({
        id: 'closed-position-test',
        status: 'planned', // Will be computed to 'closed' when retrieved
        trades: [
          {
            id: 'buy-trade-1',
            position_id: 'closed-position-test',
            trade_type: 'buy',
            quantity: 100,
            price: 150.00,
            timestamp: new Date('2024-01-16T10:00:00.000Z'),
            underlying: 'AAPL'
          },
          {
            id: 'sell-trade-1',
            position_id: 'closed-position-test',
            trade_type: 'sell',
            quantity: 100, // Sell all shares = closed
            price: 160.00,
            timestamp: new Date('2024-01-17T10:00:00.000Z'),
            underlying: 'AAPL'
          }
        ]
      })

      // Persist the position
      await positionService.create(closedPosition)

      // Retrieve and verify status is computed as 'closed'
      const retrieved = await positionService.getById('closed-position-test')
      expect(retrieved).toBeTruthy()
      expect(retrieved!.status).toBe('closed')
      expect(retrieved!.trades).toHaveLength(2)

      // Verify we can update a closed position
      const updatedPosition = { ...retrieved!, position_thesis: 'Updated thesis' }
      await positionService.update(updatedPosition)

      const afterUpdate = await positionService.getById('closed-position-test')
      expect(afterUpdate!.status).toBe('closed')
      expect(afterUpdate!.position_thesis).toBe('Updated thesis')
    })

    it('should list closed positions in getAll', async () => {
      // Create multiple positions with different statuses
      const plannedPos = createTestPosition({ id: 'planned-pos', trades: [] })
      const openPos = createTestPosition({
        id: 'open-pos',
        trades: [{
          id: 'buy-1',
          position_id: 'open-pos',
          trade_type: 'buy',
          quantity: 50,
          price: 150.00,
          timestamp: new Date(),
          underlying: 'AAPL'
        }]
      })
      const closedPos = createTestPosition({
        id: 'closed-pos',
        trades: [
          {
            id: 'buy-2',
            position_id: 'closed-pos',
            trade_type: 'buy',
            quantity: 100,
            price: 150.00,
            timestamp: new Date(),
            underlying: 'AAPL'
          },
          {
            id: 'sell-2',
            position_id: 'closed-pos',
            trade_type: 'sell',
            quantity: 100,
            price: 160.00,
            timestamp: new Date(),
            underlying: 'AAPL'
          }
        ]
      })

      await positionService.create(plannedPos)
      await positionService.create(openPos)
      await positionService.create(closedPos)

      // Get all and verify statuses
      const allPositions = await positionService.getAll()
      expect(allPositions).toHaveLength(3)

      const statuses = allPositions.map(p => ({ id: p.id, status: p.status }))
      expect(statuses).toContainEqual({ id: 'planned-pos', status: 'planned' })
      expect(statuses).toContainEqual({ id: 'open-pos', status: 'open' })
      expect(statuses).toContainEqual({ id: 'closed-pos', status: 'closed' })
    })
  })

  describe('Position type safety', () => {
    it('should accept all valid status values in Position interface', () => {
      // This test verifies at compile time that Position accepts all status values
      const plannedPosition: Position = createTestPosition({ status: 'planned' })
      const openPosition: Position = createTestPosition({ status: 'open' })
      const closedPosition: Position = createTestPosition({ status: 'closed' })

      expect(plannedPosition.status).toBe('planned')
      expect(openPosition.status).toBe('open')
      expect(closedPosition.status).toBe('closed')
    })
  })
})
