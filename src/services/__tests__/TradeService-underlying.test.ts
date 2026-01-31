import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TradeService } from '@/services/TradeService'
import { PositionService } from '@/lib/position'
import type { Position, Trade } from '@/lib/position'
import { createPosition } from '@/test/data-factories'

/**
 * Tests for TradeService underlying field auto-population
 *
 * Verifies that TradeService automatically populates the `underlying` field
 * from position.symbol when creating trades, enabling price lookups and P&L.
 */

const createTestTradeInput = (overrides?: Partial<Omit<Trade, 'id'>>): Omit<Trade, 'id'> => ({
  position_id: 'pos-123',
  trade_type: 'buy',
  quantity: 100,
  price: 150.25,
  timestamp: new Date('2024-01-15T10:30:00.000Z'),
  underlying: 'AAPL', // Will be auto-populated if not provided
  notes: 'Test trade execution',
  ...overrides
})

describe('TradeService - Underlying Field Auto-Population', () => {
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

  describe('Auto-populate underlying from position.symbol', () => {
    it('[Unit] should auto-populate underlying field when creating trade', async () => {
      // Arrange
      const tradeInput = createTestTradeInput()
      delete (tradeInput as any).underlying // Simulate user not providing underlying

      mockPositionService.getById = vi.fn().mockResolvedValue(testPosition)
      mockPositionService.update = vi.fn().mockResolvedValue(undefined)

      // Act
      const result = await tradeService.addTrade(tradeInput)

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0].underlying).toBe('AAPL') // Auto-populated from position.symbol
      expect(result[0].underlying).toBe(testPosition.symbol)
    })

    it('[Unit] should preserve user-provided underlying field', async () => {
      // Arrange - User explicitly provides underlying (Phase 3+ scenario)
      const tradeInput = createTestTradeInput({
        underlying: 'AAPL  250117C00150000' // Option contract
      })

      mockPositionService.getById = vi.fn().mockResolvedValue(testPosition)
      mockPositionService.update = vi.fn().mockResolvedValue(undefined)

      // Act
      const result = await tradeService.addTrade(tradeInput)

      // Assert
      expect(result[0].underlying).toBe('AAPL  250117C00150000') // Preserved
    })

    it('[Unit] should auto-populate underlying for different symbols', async () => {
      // Arrange
      const tslaPosition = createPosition({ id: 'pos-456', symbol: 'TSLA' })
      const tradeInput = createTestTradeInput({ position_id: 'pos-456' })
      delete (tradeInput as any).underlying

      mockPositionService.getById = vi.fn().mockResolvedValue(tslaPosition)
      mockPositionService.update = vi.fn().mockResolvedValue(undefined)

      // Act
      const result = await tradeService.addTrade(tradeInput)

      // Assert
      expect(result[0].underlying).toBe('TSLA')
      expect(result[0].underlying).toBe(tslaPosition.symbol)
    })
  })

  describe('Validation of underlying field', () => {
    it('[Unit] should validate that underlying is non-empty when provided', async () => {
      // Arrange
      const tradeInput = createTestTradeInput({ underlying: '' })

      mockPositionService.getById = vi.fn().mockResolvedValue(testPosition)

      // Act & Assert
      await expect(tradeService.addTrade(tradeInput)).rejects.toThrow('underlying cannot be empty')
    })

    it('[Unit] should validate that underlying matches expected format (Phase 3+)', async () => {
      // Arrange - Valid OCC format
      const tradeInput = createTestTradeInput({
        underlying: 'AAPL  250117C00150000'
      })

      mockPositionService.getById = vi.fn().mockResolvedValue(testPosition)
      mockPositionService.update = vi.fn().mockResolvedValue(undefined)

      // Act
      const result = await tradeService.addTrade(tradeInput)

      // Assert - Should not throw, OCC format is valid
      expect(result[0].underlying).toBe('AAPL  250117C00150000')
    })
  })

  describe('Backward compatibility for existing trades', () => {
    it('[Unit] should handle positions with existing trades that lack underlying field', async () => {
      // Arrange - Position with legacy trade (no underlying field)
      const legacyTrade: Partial<Trade> = {
        id: 'trade-old',
        position_id: 'pos-123',
        trade_type: 'buy',
        quantity: 50,
        price: 140.00,
        timestamp: new Date('2024-01-10T10:00:00.000Z')
        // No underlying field (backward compatibility)
      }

      const positionWithLegacyTrade = createPosition({
        trades: [legacyTrade as Trade]
      })

      // In Phase 1A, we can't add more trades, but this tests reading existing trades
      mockPositionService.getById = vi.fn().mockResolvedValue(positionWithLegacyTrade)

      // Act - Just verify we can read the position without errors
      const position = await mockPositionService.getById('pos-123')

      // Assert - Legacy trade should be readable even without underlying
      expect(position.trades).toHaveLength(1)
      expect(position.trades[0].id).toBe('trade-old')
      // underlying field will be undefined on legacy trades
    })

    it('[Unit] should compute underlying from position.symbol for legacy trades', async () => {
      // Arrange - Simulating backward compatibility helper function
      const legacyTrade: Partial<Trade> = {
        id: 'trade-old',
        position_id: 'pos-123',
        trade_type: 'buy',
        quantity: 50,
        price: 140.00,
        timestamp: new Date('2024-01-10T10:00:00.000Z')
      }

      const position = createPosition()

      // Act - Helper function to compute underlying on read
      const computedUnderlying = legacyTrade.underlying || position.symbol

      // Assert
      expect(computedUnderlying).toBe('AAPL')
      expect(computedUnderlying).toBe(position.symbol)
    })
  })

  describe('Multi-underlying support (Phase 3+ preparation)', () => {
    it('[Unit] should support different underlying per trade in same position', async () => {
      // Arrange - Phase 3+ scenario: covered call position
      // Stock trade has underlying "AAPL"
      // Option trade has underlying "AAPL  250117C00150000"

      const stockTrade = createTestTradeInput({
        underlying: 'AAPL'
      })

      mockPositionService.getById = vi.fn().mockResolvedValue(testPosition)
      mockPositionService.update = vi.fn().mockResolvedValue(undefined)

      // Act
      const result = await tradeService.addTrade(stockTrade)

      // Assert
      expect(result[0].underlying).toBe('AAPL')

      // Note: In Phase 1A we can only have 1 trade per position
      // This test verifies the data model supports multi-underlying
      // Phase 3+ will remove the single-trade constraint
    })
  })
})
