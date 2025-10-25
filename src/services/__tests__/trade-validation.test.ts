import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TradeService } from '@/services/TradeService'
import { PositionService } from '@/lib/position'
import type { Trade, Position } from '@/lib/position'

// Test data factories
const createTestTrade = (overrides?: Partial<Trade>): Trade => ({
  id: 'trade-123',
  position_id: 'pos-123',
  trade_type: 'buy',
  quantity: 100,
  price: 150.25,
  timestamp: new Date('2024-01-15T10:30:00.000Z'),
  underlying: 'AAPL', // Added for Trade interface requirement
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

describe('Batch 5: Data Validation & Error Handling', () => {
  let tradeService: TradeService
  let mockPositionService: PositionService
  let testPosition: Position

  beforeEach(() => {
    // Create mock PositionService for dependency injection
    mockPositionService = {
      getById: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      getAll: vi.fn(),
      delete: vi.fn(),
      clearAll: vi.fn(),
      close: vi.fn(),
    } as any

    tradeService = new TradeService(mockPositionService)
    testPosition = createTestPosition()
  })

  describe('Comprehensive Trade Validation', () => {

    it('[Unit] should reject trade with missing required fields', async () => {
      // Arrange
      const invalidTrade = {
        position_id: 'pos-123', // Need this for position lookup
        trade_type: 'buy',
        quantity: 100,
        // Missing price, timestamp
      }
      mockPositionService.getById.mockResolvedValue(testPosition)

      // Act & Assert
      await expect(tradeService.addTrade(invalidTrade as any))
        .rejects.toThrow('Trade validation failed: Missing required fields')
    })

    it('[Unit] should reject trade with invalid trade_type', async () => {
      // Arrange
      const invalidTrade = createTestTrade({ trade_type: 'invalid' as any })
      mockPositionService.getById.mockResolvedValue(testPosition)

      // Act & Assert
      await expect(tradeService.addTrade(invalidTrade))
        .rejects.toThrow('Trade validation failed: Invalid trade type')
    })

    it('[Unit] should reject trade with zero quantity', async () => {
      // Arrange
      const invalidTrade = createTestTrade({ quantity: 0 })
      mockPositionService.getById.mockResolvedValue(testPosition)

      // Act & Assert
      await expect(tradeService.addTrade(invalidTrade))
        .rejects.toThrow('Trade validation failed: Quantity must be positive')
    })

    it('[Unit] should reject trade with negative quantity', async () => {
      // Arrange
      const invalidTrade = createTestTrade({ quantity: -100 })
      mockPositionService.getById.mockResolvedValue(testPosition)

      // Act & Assert
      await expect(tradeService.addTrade(invalidTrade))
        .rejects.toThrow('Trade validation failed: Quantity must be positive')
    })

    it('[Unit] should reject trade with zero price', async () => {
      // Arrange
      const invalidTrade = createTestTrade({ price: 0 })
      mockPositionService.getById.mockResolvedValue(testPosition)

      // Act & Assert
      await expect(tradeService.addTrade(invalidTrade))
        .rejects.toThrow('Trade validation failed: Price must be positive')
    })

    it('[Unit] should reject trade with negative price', async () => {
      // Arrange
      const invalidTrade = createTestTrade({ price: -150.25 })
      mockPositionService.getById.mockResolvedValue(testPosition)

      // Act & Assert
      await expect(tradeService.addTrade(invalidTrade))
        .rejects.toThrow('Trade validation failed: Price must be positive')
    })

    it('[Unit] should reject trade with invalid timestamp', async () => {
      // Arrange
      const invalidTrade = createTestTrade({ timestamp: new Date('invalid') as any })
      mockPositionService.getById.mockResolvedValue(testPosition)

      // Act & Assert
      await expect(tradeService.addTrade(invalidTrade))
        .rejects.toThrow('Trade validation failed: Invalid timestamp')
    })

    it('[Unit] should reject trade with empty position_id', async () => {
      // Arrange
      const invalidTrade = createTestTrade({ position_id: '' })
      // Don't mock position - empty position_id should fail before position lookup

      // Act & Assert
      await expect(tradeService.addTrade(invalidTrade))
        .rejects.toThrow('Position not found')
    })

    it('[Service] should handle non-existent position gracefully', async () => {
      // Arrange
      const trade = createTestTrade()
      mockPositionService.getById.mockResolvedValue(null)

      // Act & Assert
      await expect(tradeService.addTrade(trade))
        .rejects.toThrow('Position not found: pos-123')
    })

    it('[Service] should handle PositionService errors gracefully', async () => {
      // Arrange
      const trade = createTestTrade()
      const dbError = new Error('Database connection failed')
      mockPositionService.getById.mockRejectedValue(dbError)

      // Act & Assert
      await expect(tradeService.addTrade(trade))
        .rejects.toThrow('Database connection failed')
    })

  })

})