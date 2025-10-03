import { describe, it, expect, vi } from 'vitest'
import type { Trade, Position } from '@/lib/position'
import { TradeService } from '@/services/TradeService'

// Test data factories
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

describe('Batch 4: Position Status Computation', () => {

  describe('computePositionStatus() Function Logic', () => {

    it('[Unit] should return "planned" for position with no trades', () => {
      // Arrange
      const position = createTestPosition({ trades: [] })

      // Act
      const status = computePositionStatus(position)

      // Assert
      expect(status).toBe('planned')
    })

    it('[Unit] should return "open" for position with at least one trade', () => {
      // Arrange
      const position = createTestPosition({
        trades: [createTestTrade({ trade_type: 'buy' })]
      })

      // Act
      const status = computePositionStatus(position)

      // Assert
      expect(status).toBe('open')
    })

    it('[Unit] should return "open" for position with multiple trades', () => {
      // Arrange
      const position = createTestPosition({
        trades: [
          createTestTrade({ trade_type: 'buy' }),
          createTestTrade({ trade_type: 'buy', id: 'trade-2' })
        ]
      })

      // Act
      const status = computePositionStatus(position)

      // Assert
      expect(status).toBe('open')
    })

    it('[Unit] should return "open" regardless of trade type (buy or sell)', () => {
      // Arrange
      const positionWithBuy = createTestPosition({
        trades: [createTestTrade({ trade_type: 'buy' })]
      })
      const positionWithSell = createTestPosition({
        trades: [createTestTrade({ trade_type: 'sell' })]
      })

      // Act & Assert
      expect(computePositionStatus(positionWithBuy)).toBe('open')
      expect(computePositionStatus(positionWithSell)).toBe('open')
    })

    it('[Unit] should be deterministic - same position always returns same status', () => {
      // Arrange
      const position = createTestPosition({
        trades: [createTestTrade()]
      })

      // Act & Assert
      expect(computePositionStatus(position)).toBe('open')
      expect(computePositionStatus(position)).toBe('open')
      expect(computePositionStatus(position)).toBe('open')
    })

    it('[Unit] should handle edge case: trades array with undefined/null values', () => {
      // Arrange
      const position = createTestPosition({
        trades: [createTestTrade(), null as any, undefined as any]
      })

      // Act & Assert
      expect(() => computePositionStatus(position))
        .toThrow('Invalid trade data')
    })

    it('[Unit] should validate position structure before computation', () => {
      // Arrange
      const invalidPosition = {
        ...createTestPosition(),
        trades: 'not an array' as any
      }

      // Act & Assert
      expect(() => computePositionStatus(invalidPosition))
        .toThrow('Invalid position data')
    })

    it('[Service] should compute status dynamically in services', async () => {
      // Arrange
      const position = createTestPosition({ trades: [] })

      const mockPositionService = {
        getById: vi.fn().mockResolvedValue(position),
        update: vi.fn().mockResolvedValue(),
        create: vi.fn().mockResolvedValue(),
        getAll: vi.fn().mockResolvedValue([]),
        delete: vi.fn().mockResolvedValue(),
        clearAll: vi.fn().mockResolvedValue(),
        close: vi.fn(),
      } as any

      const tradeService = new TradeService(mockPositionService)

      // Act
      const status = await tradeService.computePositionStatus('pos-123')

      // Assert
      expect(status).toBe('planned')
      expect(mockPositionService.getById).toHaveBeenCalledWith('pos-123')
    })

  })

})

/**
 * Compute position status based on trade data
 * Phase 1A: 'planned' (no trades) | 'open' (has trades)
 */
function computePositionStatus(position: Position): 'planned' | 'open' {
  // Validate position structure
  if (!position || !Array.isArray(position.trades)) {
    throw new Error('Invalid position data')
  }

  // Validate trade data
  position.trades.forEach(trade => {
    if (!trade || typeof trade !== 'object') {
      throw new Error('Invalid trade data')
    }
  })

  // Phase 1A logic: planned (no trades) → open (has trades)
  return position.trades.length > 0 ? 'open' : 'planned'
}