import { describe, it, expect } from 'vitest'
import type { Trade, Position } from '@/lib/position'
import { TradeService } from '@/services/TradeService'
import { PositionService } from '@/lib/position'

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

describe('Batch 3: Cost Basis Calculation', () => {

  describe('Simple Cost Basis Logic (Phase 1A)', () => {

    it('[Unit] should return cost basis equal to first trade price for one buy trade', () => {
      // Arrange
      const position = createTestPosition({
        trades: [createTestTrade({ price: 150.25 })]
      })
      const tradeService = new TradeService()

      // Act
      const costBasis = tradeService.calculateSimpleCostBasis(position.trades)

      // Assert
      expect(costBasis).toBe(150.25)
    })

    it('[Unit] should return zero cost basis for empty trades array', () => {
      // Arrange
      const position = createTestPosition({ trades: [] })
      const tradeService = new TradeService()

      // Act
      const costBasis = tradeService.calculateSimpleCostBasis(position.trades)

      // Assert
      expect(costBasis).toBe(0)
    })

    it('[Unit] should ignore sell trades in cost basis calculation', () => {
      // Arrange
      const position = createTestPosition({
        trades: [
          createTestTrade({ trade_type: 'buy', price: 150.25 }),
          createTestTrade({ trade_type: 'sell', price: 160.50 })
        ]
      })
      const tradeService = new TradeService()

      // Act
      const costBasis = tradeService.calculateSimpleCostBasis(position.trades)

      // Assert
      expect(costBasis).toBe(150.25) // Only the buy trade price
    })

    it('[Unit] should calculate from first buy trade only when multiple trades exist', () => {
      // Arrange
      const position = createTestPosition({
        trades: [
          createTestTrade({ trade_type: 'buy', price: 150.25 }),
          createTestTrade({ trade_type: 'buy', price: 155.50 }),
          createTestTrade({ trade_type: 'sell', price: 160.75 })
        ]
      })
      const tradeService = new TradeService()

      // Act
      const costBasis = tradeService.calculateSimpleCostBasis(position.trades)

      // Assert
      expect(costBasis).toBe(150.25) // First buy trade only
    })

    it('[Unit] should handle fractional quantities correctly', () => {
      // Arrange
      const position = createTestPosition({
        trades: [createTestTrade({ quantity: 50.5, price: 150.25 })]
      })
      const tradeService = new TradeService()

      // Act
      const costBasis = tradeService.calculateSimpleCostBasis(position.trades)

      // Assert
      expect(costBasis).toBe(150.25) // Price should be used regardless of quantity
    })

    it('[Unit] should handle very large prices', () => {
      // Arrange
      const position = createTestPosition({
        trades: [createTestTrade({ price: 999999.99 })]
      })
      const tradeService = new TradeService()

      // Act
      const costBasis = tradeService.calculateSimpleCostBasis(position.trades)

      // Assert
      expect(costBasis).toBe(999999.99)
    })

    it('[Unit] should handle very small prices', () => {
      // Arrange
      const position = createTestPosition({
        trades: [createTestTrade({ price: 0.0001 })]
      })
      const tradeService = new TradeService()

      // Act
      const costBasis = tradeService.calculateSimpleCostBasis(position.trades)

      // Assert
      expect(costBasis).toBe(0.0001)
    })

    it('[Unit] should be consistent pure function with same output for same input', () => {
      // Arrange
      const trades = [createTestTrade({ price: 150.25 })]
      const tradeService = new TradeService()

      // Act & Assert
      expect(tradeService.calculateSimpleCostBasis(trades)).toBe(150.25)
      expect(tradeService.calculateSimpleCostBasis(trades)).toBe(150.25)
      expect(tradeService.calculateSimpleCostBasis(trades)).toBe(150.25)
    })

    it('[Service] should calculate cost basis using TradeService data', async () => {
      // Arrange
      const position = createTestPosition({
        trades: [createTestTrade({ price: 150.25 })]
      })

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
      const costBasis = await tradeService.calculateCostBasis('pos-123')

      // Assert
      expect(costBasis).toBe(150.25)
      expect(mockPositionService.getById).toHaveBeenCalledWith('pos-123')
    })

  })

})