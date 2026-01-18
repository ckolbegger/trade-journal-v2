import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TradeService } from '@/services/TradeService'
import { PositionService } from '@/lib/position'
import type { Position, Trade } from '@/lib/position'
import { TradeValidator } from '@/domain/validators/TradeValidator'
import { createPosition, createTrade } from '@/test/data-factories'
import { createMockPositionService } from '@/test/mocks/service-mocks'

describe('Batch 2: TradeService Core Functionality', () => {
  let tradeService: TradeService
  let mockPositionService: PositionService
  let testPosition: Position

  beforeEach(() => {
    mockPositionService = createMockPositionService()
    tradeService = new TradeService(mockPositionService)
    testPosition = createPosition()
  })

  describe('TradeService addTrade() Method', () => {

    it('[Unit] should add buy trade to empty position', async () => {
      // Arrange
      const buyTrade = createTrade({ trade_type: 'buy' })
      mockPositionService.getById.mockResolvedValue(testPosition)
      mockPositionService.update.mockResolvedValue()

      // Act
      const result = await tradeService.addTrade(buyTrade)

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        trade_type: buyTrade.trade_type,
        position_id: buyTrade.position_id,
        quantity: buyTrade.quantity,
        price: buyTrade.price,
        notes: buyTrade.notes
      })
      expect(result[0].id).toBeDefined()
      expect(result[0].timestamp).toBeInstanceOf(Date)
      expect(mockPositionService.getById).toHaveBeenCalledWith('pos-123')
    })

    it('[Unit] should add sell trade to open position', async () => {
      // Arrange - Position must be 'open' with existing buy trade
      const openPosition = createPosition({
        status: 'open',
        trades: [createTrade({ id: 'buy-trade-1', trade_type: 'buy', quantity: 100, price: 150 })]
      })
      const sellTrade = createTrade({ trade_type: 'sell', quantity: 100, price: 155 })
      mockPositionService.getById.mockResolvedValue(openPosition)
      mockPositionService.update.mockResolvedValue()

      // Act
      const result = await tradeService.addTrade(sellTrade)

      // Assert
      expect(result).toHaveLength(2) // Now has buy + sell
      expect(result[1].trade_type).toBe('sell')
      expect(result[1].position_id).toBe('pos-123')
      expect(mockPositionService.getById).toHaveBeenCalledWith('pos-123')
      expect(mockPositionService.update).toHaveBeenCalled()
    })

    it('[Unit] should generate unique ID for each trade', async () => {
      // Arrange
      const tradeWithoutId = { ...createTrade(), id: '' }
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
      const tradeWithTimestamp = createTrade({ timestamp: testTimestamp })
      mockPositionService.getById.mockResolvedValue(testPosition)
      mockPositionService.update.mockResolvedValue()

      // Act
      const result = await tradeService.addTrade(tradeWithTimestamp)

      // Assert
      expect(result[0].timestamp).toEqual(testTimestamp)
    })

    it('[Unit] should return updated Position after trade addition', async () => {
      // Arrange
      const buyTrade = createTrade()
      mockPositionService.getById.mockResolvedValue(testPosition)
      mockPositionService.update.mockResolvedValue()

      // Act
      const result = await tradeService.addTrade(buyTrade)

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        trade_type: buyTrade.trade_type,
        position_id: buyTrade.position_id,
        quantity: buyTrade.quantity,
        price: buyTrade.price,
        notes: buyTrade.notes
      })
      expect(result[0].id).toBeDefined()
      expect(result[0].timestamp).toBeInstanceOf(Date)
    })

    it('[Unit] should allow multiple trades per position', async () => {
      // Arrange - Position with one buy trade
      const positionWithTrade = createPosition({
        status: 'open',
        trades: [createTrade({ id: 'existing-trade', trade_type: 'buy', quantity: 100, price: 150 })]
      })
      const secondBuyTrade = createTrade({ id: 'new-trade', trade_type: 'buy', quantity: 50, price: 152 })
      mockPositionService.getById.mockResolvedValue(positionWithTrade)
      mockPositionService.update.mockResolvedValue()

      // Act
      const result = await tradeService.addTrade(secondBuyTrade)

      // Assert - Should now have 2 trades
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('existing-trade')
      expect(result[1].trade_type).toBe('buy')
      expect(mockPositionService.update).toHaveBeenCalled()
    })

    it('[Unit] should allow first trade on empty position', async () => {
      // Arrange
      const emptyPosition = createPosition({ trades: [] })
      const firstTrade = createTrade()
      mockPositionService.getById.mockResolvedValue(emptyPosition)
      mockPositionService.update.mockResolvedValue()

      // Act
      const result = await tradeService.addTrade(firstTrade)

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        trade_type: firstTrade.trade_type,
        position_id: firstTrade.position_id,
        quantity: firstTrade.quantity,
        price: firstTrade.price,
        notes: firstTrade.notes
      })
      expect(result[0].id).toBeDefined()
      expect(result[0].timestamp).toBeInstanceOf(Date)
      expect(mockPositionService.update).toHaveBeenCalled()
    })

    it('[Service] should validate trade data before adding', async () => {
      // Arrange
      const invalidTrade = createTrade({ quantity: -10 })
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
      const validTrade = createTrade()
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
      const invalidTrade = createTrade({ quantity: -10 })
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