import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TradeService } from '@/services/TradeService'
import { PositionService } from '@/lib/position'
import type { Trade, Position } from '@/lib/position'
import { createPosition } from '@/test/data-factories'

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
    testPosition = createPosition()
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

    it('[Unit] should allow trade with zero price (worthless exit)', async () => {
      // Arrange - Zero price allowed for worthless exits (sell trades only)
      const zeroPriceTrade = createTestTrade({ price: 0, trade_type: 'sell' })
      // Need an open position to sell from
      const openPosition = createPosition({ status: 'open', trades: [createTestTrade()] })
      mockPositionService.getById.mockResolvedValue(openPosition)
      mockPositionService.update.mockResolvedValue()

      // Act
      const result = await tradeService.addTrade(zeroPriceTrade)

      // Assert - Should succeed with price 0
      expect(result[1].price).toBe(0) // Second trade (index 1) is the zero-price sell
    })

    it('[Unit] should reject trade with negative price', async () => {
      // Arrange
      const invalidTrade = createTestTrade({ price: -150.25 })
      mockPositionService.getById.mockResolvedValue(testPosition)

      // Act & Assert
      await expect(tradeService.addTrade(invalidTrade))
        .rejects.toThrow('Trade validation failed: Price must be >= 0')
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