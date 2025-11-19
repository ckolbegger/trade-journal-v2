/**
 * Integration Tests: Position Closing via Trade Execution
 *
 * These tests verify the complete user journey for closing positions
 * via exit trade execution with FIFO cost basis tracking.
 *
 * Constitutional Principle IV: Test-First Discipline
 * These tests are written FIRST and should FAIL before implementation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import 'fake-indexeddb/auto'
import type { Position, Trade } from '@/lib/position'
import { PositionService } from '@/lib/position'
import { TradeService } from '@/services/TradeService'
import { processFIFO } from '@/lib/utils/fifo'
import { calculatePlanVsExecution } from '@/lib/utils/planVsExecution'
import { computePositionStatus } from '@/utils/statusComputation'

describe('Position Closing Integration Tests', () => {
  let positionService: PositionService
  let tradeService: TradeService

  beforeEach(() => {
    // Reset IndexedDB before each test
    positionService = new PositionService()
    tradeService = new TradeService(positionService)
  })

  afterEach(() => {
    positionService.close()
    tradeService.close()
  })

  describe('User Story 1: Complete Position Exit', () => {
    it('closes position when all shares are sold', async () => {
      // Create a position plan
      const position: Position = {
        id: 'test-position-1',
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        target_entry_price: 150,
        target_quantity: 100,
        profit_target: 160,
        stop_loss: 145,
        position_thesis: 'Test thesis for position closing',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
      }

      await positionService.create(position)

      // Add entry trade (buy 100 shares at $150)
      const entryTrade: Omit<Trade, 'id'> = {
        position_id: 'test-position-1',
        trade_type: 'buy',
        quantity: 100,
        price: 150,
        timestamp: new Date('2024-01-01T10:00:00Z'),
        underlying: 'AAPL'
      }

      await tradeService.addTrade(entryTrade)

      // Verify position is open after entry trade
      let updatedPosition = await positionService.getById('test-position-1')
      expect(updatedPosition).not.toBeNull()
      expect(updatedPosition!.status).toBe('open')
      expect(updatedPosition!.trades).toHaveLength(1)

      // Add exit trade (sell 100 shares at $155)
      const exitTrade: Omit<Trade, 'id'> = {
        position_id: 'test-position-1',
        trade_type: 'sell',
        quantity: 100,
        price: 155,
        timestamp: new Date('2024-01-02T10:00:00Z'),
        underlying: 'AAPL'
      }

      await tradeService.addTrade(exitTrade)

      // Verify position is closed after exit trade
      updatedPosition = await positionService.getById('test-position-1')
      expect(updatedPosition).not.toBeNull()
      expect(updatedPosition!.status).toBe('closed')
      expect(updatedPosition!.trades).toHaveLength(2)

      // Verify FIFO P&L calculation
      const fifoResult = processFIFO(updatedPosition!.trades, 155)
      expect(fifoResult.realizedPnL).toBe(500) // ($155 - $150) * 100
      expect(fifoResult.openQuantity).toBe(0)
      expect(fifoResult.isFullyClosed).toBe(true)
    })


    it('displays plan vs execution on position close', async () => {
      // Create position with specific targets
      const position: Position = {
        id: 'test-position-3',
        symbol: 'NVDA',
        strategy_type: 'Long Stock',
        target_entry_price: 500,
        target_quantity: 50,
        profit_target: 550,
        stop_loss: 480,
        position_thesis: 'Test plan vs execution',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
      }

      await positionService.create(position)

      // Entry trade (actual: $495 vs target: $500)
      await tradeService.addTrade({
        position_id: 'test-position-3',
        trade_type: 'buy',
        quantity: 50,
        price: 495,
        timestamp: new Date('2024-01-01T10:00:00Z'),
        underlying: 'NVDA'
      })

      // Exit trade (actual: $560 vs target: $550)
      await tradeService.addTrade({
        position_id: 'test-position-3',
        trade_type: 'sell',
        quantity: 50,
        price: 560,
        timestamp: new Date('2024-01-02T10:00:00Z'),
        underlying: 'NVDA'
      })

      const updatedPosition = await positionService.getById('test-position-3')
      expect(updatedPosition!.status).toBe('closed')

      // Calculate plan vs execution comparison
      const fifoResult = processFIFO(updatedPosition!.trades, 560)
      const comparison = calculatePlanVsExecution(updatedPosition!, fifoResult)

      // Entry execution quality (paid $495 vs target $500 = better)
      expect(comparison.targetEntryPrice).toBe(500)
      expect(comparison.actualAvgEntryCost).toBe(495)
      expect(comparison.entryPriceDelta).toBe(-5)
      expect(comparison.entryExecutionQuality).toBe('better')

      // Exit execution quality (sold $560 vs target $550 = better)
      expect(comparison.targetExitPrice).toBe(550)
      expect(comparison.actualAvgExitPrice).toBe(560)
      expect(comparison.exitPriceDelta).toBe(10)
      expect(comparison.exitExecutionQuality).toBe('better')

      // Overall profit ($3250 actual vs $2500 target)
      expect(comparison.targetProfit).toBe(2500) // (550-500)*50
      expect(comparison.actualProfit).toBe(3250) // (560-495)*50
      expect(comparison.profitDelta).toBe(750)
      expect(comparison.overallExecutionQuality).toBe('better')
    })
  })
})
