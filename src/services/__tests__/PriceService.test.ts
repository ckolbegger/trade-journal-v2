import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PriceService } from '@/services/PriceService'
import type { PriceHistory, SimplePriceInput, PriceHistoryInput } from '@/types/priceHistory'
import 'fake-indexeddb/auto'

// Test data factories
const createTestPriceInput = (overrides?: Partial<PriceHistoryInput>): PriceHistoryInput => {
  const defaults = {
    underlying: 'AAPL',
    date: '2024-01-15',
    open: 150.00,
    high: 155.00,
    low: 148.00,
    close: 153.00,
    ...overrides
  }

  // If only close is overridden, auto-fill OHLC to match
  if (overrides?.close !== undefined &&
      overrides?.open === undefined &&
      overrides?.high === undefined &&
      overrides?.low === undefined) {
    defaults.open = overrides.close
    defaults.high = overrides.close
    defaults.low = overrides.close
  }

  return defaults
}

const createSimplePriceInput = (overrides?: Partial<SimplePriceInput>): SimplePriceInput => ({
  underlying: 'AAPL',
  date: '2024-01-15',
  close: 153.00,
  ...overrides
})

describe('PriceService Core Functionality', () => {
  let priceService: PriceService

  beforeEach(async () => {
    priceService = new PriceService()
    // Ensure database is initialized
    await priceService['getDB']()
  })

  afterEach(async () => {
    // Clean up database after each test
    await priceService.clearAll()
  })

  describe('PriceService createOrUpdate() Method', () => {
    it('[Unit] should create new PriceHistory record with full OHLC data', async () => {
      // Arrange
      const priceInput = createTestPriceInput()

      // Act
      const result = await priceService.createOrUpdate(priceInput)

      // Assert
      expect(result.id).toBeDefined()
      expect(result.underlying).toBe('AAPL')
      expect(result.date).toBe('2024-01-15')
      expect(result.open).toBe(150.00)
      expect(result.high).toBe(155.00)
      expect(result.low).toBe(148.00)
      expect(result.close).toBe(153.00)
      expect(result.updated_at).toBeInstanceOf(Date)
    })

    it('[Unit] should auto-fill OHLC from close price when using SimplePriceInput', async () => {
      // Arrange
      const simplePriceInput = createSimplePriceInput({ close: 165.50 })

      // Act
      const result = await priceService.createOrUpdateSimple(simplePriceInput)

      // Assert
      expect(result.open).toBe(165.50)
      expect(result.high).toBe(165.50)
      expect(result.low).toBe(165.50)
      expect(result.close).toBe(165.50)
    })

    it('[Unit] should overwrite existing record for same underlying+date', async () => {
      // Arrange
      const firstPrice = createTestPriceInput({ close: 150.00 })
      const secondPrice = createTestPriceInput({ close: 165.00 })

      // Act
      const firstResult = await priceService.createOrUpdate(firstPrice)
      const secondResult = await priceService.createOrUpdate(secondPrice)

      // Assert - same ID means it's an update, not a new record
      expect(secondResult.id).toBe(firstResult.id)
      expect(secondResult.close).toBe(165.00)
      expect(secondResult.updated_at.getTime()).toBeGreaterThanOrEqual(firstResult.updated_at.getTime())
    })

    it('[Unit] should validate non-zero price', async () => {
      // Arrange
      const priceInput = createTestPriceInput({ close: 0 })

      // Act & Assert
      await expect(priceService.createOrUpdate(priceInput)).rejects.toThrow('must be greater than zero')
    })

    it('[Unit] should validate non-negative price', async () => {
      // Arrange
      const priceInput = createTestPriceInput({ close: -50.00 })

      // Act & Assert
      await expect(priceService.createOrUpdate(priceInput)).rejects.toThrow('cannot be negative')
    })

    it('[Unit] should store timestamp in updated_at field', async () => {
      // Arrange
      const priceInput = createTestPriceInput()
      const beforeCreate = new Date()

      // Act
      const result = await priceService.createOrUpdate(priceInput)

      // Assert
      const afterCreate = new Date()
      expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime())
      expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime())
    })
  })

  describe('PriceService getLatestPrice() Method', () => {
    it('[Unit] should get latest price for underlying', async () => {
      // Arrange
      await priceService.createOrUpdate(createTestPriceInput({ date: '2024-01-10', close: 140.00 }))
      await priceService.createOrUpdate(createTestPriceInput({ date: '2024-01-15', close: 150.00 }))
      await priceService.createOrUpdate(createTestPriceInput({ date: '2024-01-12', close: 145.00 }))

      // Act
      const result = await priceService.getLatestPrice('AAPL')

      // Assert
      expect(result).not.toBeNull()
      expect(result?.date).toBe('2024-01-15') // Latest date
      expect(result?.close).toBe(150.00)
    })

    it('[Unit] should return null when no prices exist', async () => {
      // Act
      const result = await priceService.getLatestPrice('TSLA')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('PriceService getPriceByDate() Method', () => {
    it('[Unit] should get price by specific date', async () => {
      // Arrange
      await priceService.createOrUpdate(createTestPriceInput({ date: '2024-01-10', close: 140.00 }))
      await priceService.createOrUpdate(createTestPriceInput({ date: '2024-01-15', close: 150.00 }))

      // Act
      const result = await priceService.getPriceByDate('AAPL', '2024-01-10')

      // Assert
      expect(result).not.toBeNull()
      expect(result?.date).toBe('2024-01-10')
      expect(result?.close).toBe(140.00)
    })

    it('[Unit] should return null when price does not exist for date', async () => {
      // Arrange
      await priceService.createOrUpdate(createTestPriceInput({ date: '2024-01-15', close: 150.00 }))

      // Act
      const result = await priceService.getPriceByDate('AAPL', '2024-01-20')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('PriceService getPriceHistory() Method', () => {
    it('[Unit] should get price history with pagination', async () => {
      // Arrange
      await priceService.createOrUpdate(createTestPriceInput({ date: '2024-01-10', close: 140.00 }))
      await priceService.createOrUpdate(createTestPriceInput({ date: '2024-01-11', close: 142.00 }))
      await priceService.createOrUpdate(createTestPriceInput({ date: '2024-01-12', close: 144.00 }))
      await priceService.createOrUpdate(createTestPriceInput({ date: '2024-01-13', close: 146.00 }))
      await priceService.createOrUpdate(createTestPriceInput({ date: '2024-01-14', close: 148.00 }))

      // Act - Get first 3 records
      const result = await priceService.getPriceHistory('AAPL', { limit: 3, offset: 0 })

      // Assert
      expect(result).toHaveLength(3)
      // Should be ordered by date descending (newest first)
      expect(result[0].date).toBe('2024-01-14')
      expect(result[1].date).toBe('2024-01-13')
      expect(result[2].date).toBe('2024-01-12')
    })

    it('[Unit] should return empty array when no price history exists', async () => {
      // Act
      const result = await priceService.getPriceHistory('TSLA')

      // Assert
      expect(result).toEqual([])
    })
  })

  describe('PriceService validatePriceChange() Method', () => {
    it('[Unit] should detect price change greater than 20%', async () => {
      // Arrange
      await priceService.createOrUpdate(createTestPriceInput({ date: '2024-01-10', close: 100.00 }))

      // Act
      const result = await priceService.validatePriceChange('AAPL', 125.00)

      // Assert
      expect(result.requiresConfirmation).toBe(true)
      expect(result.percentChange).toBe(25.0)
      expect(result.oldPrice).toBe(100.00)
      expect(result.newPrice).toBe(125.00)
    })

    it('[Unit] should not require confirmation for price change less than 20%', async () => {
      // Arrange
      await priceService.createOrUpdate(createTestPriceInput({ date: '2024-01-10', close: 100.00 }))

      // Act
      const result = await priceService.validatePriceChange('AAPL', 115.00)

      // Assert
      expect(result.requiresConfirmation).toBe(false)
      expect(result.percentChange).toBe(15.0)
    })

    it('[Unit] should detect negative price change greater than 20%', async () => {
      // Arrange
      await priceService.createOrUpdate(createTestPriceInput({ date: '2024-01-10', close: 100.00 }))

      // Act
      const result = await priceService.validatePriceChange('AAPL', 75.00)

      // Assert
      expect(result.requiresConfirmation).toBe(true)
      expect(result.percentChange).toBe(-25.0)
    })

    it('[Unit] should allow price update when no previous price exists', async () => {
      // Act
      const result = await priceService.validatePriceChange('TSLA', 250.00)

      // Assert
      expect(result.requiresConfirmation).toBe(false)
      expect(result.oldPrice).toBeNull()
      expect(result.newPrice).toBe(250.00)
    })
  })

  describe('PriceService Multi-Underlying Support', () => {
    it('[Unit] should store prices for multiple underlyings independently', async () => {
      // Arrange
      await priceService.createOrUpdate(createTestPriceInput({ underlying: 'AAPL', date: '2024-01-15', close: 150.00 }))
      await priceService.createOrUpdate(createTestPriceInput({ underlying: 'TSLA', date: '2024-01-15', close: 250.00 }))

      // Act
      const aaplPrice = await priceService.getLatestPrice('AAPL')
      const tslaPrice = await priceService.getLatestPrice('TSLA')

      // Assert
      expect(aaplPrice?.close).toBe(150.00)
      expect(tslaPrice?.close).toBe(250.00)
    })

    it('[Unit] should support OCC option symbol format', async () => {
      // Arrange - OCC format: "AAPL  250117C00150000"
      const optionSymbol = 'AAPL  250117C00150000'
      await priceService.createOrUpdate(createTestPriceInput({ underlying: optionSymbol, close: 15.50 }))

      // Act
      const result = await priceService.getLatestPrice(optionSymbol)

      // Assert
      expect(result).not.toBeNull()
      expect(result?.underlying).toBe(optionSymbol)
      expect(result?.close).toBe(15.50)
    })
  })

  describe('PriceService Batch Operations', () => {
    it('[Unit] should batch fetch latest prices for multiple underlyings', async () => {
      // Arrange
      await priceService.createOrUpdate(createTestPriceInput({ underlying: 'AAPL', close: 150.00 }))
      await priceService.createOrUpdate(createTestPriceInput({ underlying: 'TSLA', close: 250.00 }))
      await priceService.createOrUpdate(createTestPriceInput({ underlying: 'MSFT', close: 380.00 }))

      // Act
      const results = await priceService.getLatestPrices(['AAPL', 'TSLA', 'MSFT', 'GOOG'])

      // Assert
      expect(results.size).toBe(3) // GOOG doesn't exist
      expect(results.get('AAPL')?.close).toBe(150.00)
      expect(results.get('TSLA')?.close).toBe(250.00)
      expect(results.get('MSFT')?.close).toBe(380.00)
      expect(results.get('GOOG')).toBeUndefined()
    })
  })
})
