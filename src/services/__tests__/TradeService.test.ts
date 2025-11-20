import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TradeService } from '@/services/TradeService'
import { PositionService } from '@/lib/position'
import type { Position, Trade } from '@/lib/position'
import { TradeValidator } from '@/domain/validators/TradeValidator'

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

describe('Batch 2: TradeService Core Functionality', () => {
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

  describe('TradeService addTrade() Method', () => {

    it('[Unit] should add buy trade to empty position', async () => {
      // Arrange
      const buyTrade = createTestTrade({ trade_type: 'buy' })
      mockPositionService.getById.mockResolvedValue(testPosition)
      mockPositionService.update.mockResolvedValue()

      // Act
      const result = await tradeService.addTrade(buyTrade)

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0].trade_type).toBe('buy')
      expect(result[0].position_id).toBe('pos-123')
      expect(result[0].quantity).toBe(100)
      expect(result[0].price).toBe(150.25)
      expect(result[0].notes).toBe('Test trade execution')
      expect(result[0].id).toBeDefined() // ID should be generated
      expect(mockPositionService.getById).toHaveBeenCalledWith('pos-123')
    })

    it('[Unit] should add sell trade to position', async () => {
      // Arrange
      const sellTrade = createTestTrade({ trade_type: 'sell' })
      mockPositionService.getById.mockResolvedValue(testPosition)
      mockPositionService.update.mockResolvedValue()

      // Act
      const result = await tradeService.addTrade(sellTrade)

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0].trade_type).toBe('sell')
      expect(result[0].position_id).toBe('pos-123')
      expect(mockPositionService.getById).toHaveBeenCalledWith('pos-123')
      expect(mockPositionService.update).toHaveBeenCalled()
    })

    it('[Unit] should generate unique ID for each trade', async () => {
      // Arrange
      const tradeWithoutId = { ...createTestTrade(), id: '' }
      mockPositionService.getById.mockResolvedValue(testPosition)
      mockPositionService.update.mockResolvedValue()

      // Act
      const result = await tradeService.addTrade(tradeWithoutId)

      // Assert
      expect(result[0].id).toBeDefined()
      expect(result[0].id).not.toBe('')
      expect(typeof result[0].id).toBe('string')
    })

    it('[Unit] should set/preserve timestamps correctly', async () => {
      // Arrange
      const testTimestamp = new Date('2024-01-15T10:30:00.000Z')
      const tradeWithTimestamp = createTestTrade({ timestamp: testTimestamp })
      mockPositionService.getById.mockResolvedValue(testPosition)
      mockPositionService.update.mockResolvedValue()

      // Act
      const result = await tradeService.addTrade(tradeWithTimestamp)

      // Assert
      expect(result[0].timestamp).toEqual(testTimestamp)
    })

    it('[Unit] should return updated Position after trade addition', async () => {
      // Arrange
      const buyTrade = createTestTrade()
      mockPositionService.getById.mockResolvedValue(testPosition)
      mockPositionService.update.mockResolvedValue()

      // Act
      const result = await tradeService.addTrade(buyTrade)

      // Assert
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(1)
      expect(result[0].trade_type).toBe(buyTrade.trade_type)
      expect(result[0].position_id).toBe(buyTrade.position_id)
      expect(result[0].quantity).toBe(buyTrade.quantity)
      expect(result[0].price).toBe(buyTrade.price)
      expect(result[0].notes).toBe(buyTrade.notes)
      expect(result[0].id).toBeDefined() // Generated ID
    })

    it('[Unit] should enforce Phase 1A single trade constraint', async () => {
      // Arrange
      const positionWithTrade = createTestPosition({
        trades: [createTestTrade({ id: 'existing-trade' })]
      })
      const newTrade = createTestTrade({ id: 'new-trade' })
      mockPositionService.getById.mockResolvedValue(positionWithTrade)

      // Act & Assert
      await expect(tradeService.addTrade(newTrade))
        .rejects.toThrow('Phase 1A allows only one trade per position')
    })

    it('[Unit] should allow first trade on empty position', async () => {
      // Arrange
      const emptyPosition = createTestPosition({ trades: [] })
      const firstTrade = createTestTrade()
      mockPositionService.getById.mockResolvedValue(emptyPosition)
      mockPositionService.update.mockResolvedValue()

      // Act
      const result = await tradeService.addTrade(firstTrade)

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0].trade_type).toBe(firstTrade.trade_type)
      expect(result[0].position_id).toBe(firstTrade.position_id)
      expect(result[0].quantity).toBe(firstTrade.quantity)
      expect(result[0].price).toBe(firstTrade.price)
      expect(result[0].notes).toBe(firstTrade.notes)
      expect(result[0].id).toBeDefined() // Generated ID
      expect(mockPositionService.update).toHaveBeenCalled()
    })

    it('[Service] should validate trade data before adding', async () => {
      // Arrange
      const invalidTrade = createTestTrade({ quantity: -10 })
      mockPositionService.getById.mockResolvedValue(testPosition)

      // Act & Assert
      await expect(tradeService.addTrade(invalidTrade))
        .rejects.toThrow('Trade validation failed')

      expect(mockPositionService.update).not.toHaveBeenCalled()
    })

  })

  describe('Delegation to TradeValidator', () => {
    it('[Unit] should delegate validation to TradeValidator', async () => {
      // Arrange
      const validTrade = createTestTrade()
      mockPositionService.getById.mockResolvedValue(testPosition)
      mockPositionService.update.mockResolvedValue()

      // Spy on TradeValidator
      const validateSpy = vi.spyOn(TradeValidator, 'validateTrade')

      // Act
      await tradeService.addTrade(validTrade)

      // Assert
      expect(validateSpy).toHaveBeenCalledWith(expect.objectContaining({
        position_id: validTrade.position_id,
        trade_type: validTrade.trade_type,
        quantity: validTrade.quantity,
        price: validTrade.price
      }))

      validateSpy.mockRestore()
    })

    it('[Unit] should throw when TradeValidator rejects invalid trade', async () => {
      // Arrange
      const invalidTrade = createTestTrade({ quantity: -10 })
      mockPositionService.getById.mockResolvedValue(testPosition)

      // Spy on TradeValidator to let it execute normally
      const validateSpy = vi.spyOn(TradeValidator, 'validateTrade')

      // Act & Assert
      await expect(tradeService.addTrade(invalidTrade))
        .rejects.toThrow('Trade validation failed')

      expect(validateSpy).toHaveBeenCalled()
      expect(mockPositionService.update).not.toHaveBeenCalled()

      validateSpy.mockRestore()
    })
  })

})