import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PriceService } from '@/services/PriceService'
import type { PriceHistory, PriceHistoryInput } from '@/types/priceHistory'

// Test data factories
const createTestPriceHistory = (overrides?: Partial<PriceHistory>): PriceHistory => ({
  id: 'price-123',
  underlying: 'AAPL',
  date: '2024-10-25',
  open: 150.00,
  high: 155.00,
  low: 148.00,
  close: 152.50,
  updated_at: new Date('2024-10-25T10:30:00.000Z'),
  ...overrides
})

const createTestPriceInput = (overrides?: Partial<PriceHistoryInput>): PriceHistoryInput => ({
  underlying: 'AAPL',
  date: '2024-10-25',
  close: 152.50,
  ...overrides
})

describe('Slice 3.1: PriceService Core Functionality', () => {
  let priceService: PriceService

  beforeEach(async () => {
    priceService = new PriceService()
    await priceService.clearAll() // Start with clean database
  })

  describe('1.2.1 Price Creation and Storage', () => {
    it('Test: Create new PriceHistory record', async () => {
      const priceInput = createTestPriceInput()

      const result = await priceService.createOrUpdatePrice(priceInput)

      expect(result).toBeDefined()
      expect(result.underlying).toBe('AAPL')
      expect(result.date).toBe('2024-10-25')
      expect(result.close).toBe(152.50)
      expect(result.open).toBe(152.50) // Should default to close
      expect(result.high).toBe(152.50) // Should default to close
      expect(result.low).toBe(152.50) // Should default to close
      expect(result.id).toBeDefined()
      expect(result.updated_at).toBeInstanceOf(Date)
    })

    it('Test: Default OHLC to close price when not provided', async () => {
      const priceInput = createTestPriceInput({
        close: 165.75
      })

      const result = await priceService.createOrUpdatePrice(priceInput)

      expect(result.open).toBe(165.75)
      expect(result.high).toBe(165.75)
      expect(result.low).toBe(165.75)
      expect(result.close).toBe(165.75)
    })

    it('Test: Overwrite existing record for same underlying+date', async () => {
      const priceInput1 = createTestPriceInput({ close: 150.00 })
      const priceInput2 = createTestPriceInput({ close: 155.00 })

      const result1 = await priceService.createOrUpdatePrice(priceInput1)

      // Add small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 1))

      const result2 = await priceService.createOrUpdatePrice(priceInput2)

      // Should overwrite, not create duplicate
      expect(result1.id).toBeDefined()
      expect(result2.id).toBe(result1.id) // Same ID
      expect(result2.close).toBe(155.00) // Updated price
      expect(result2.updated_at.getTime()).toBeGreaterThan(result1.updated_at.getTime())
    })
  })

  describe('1.2.5 Price Validation', () => {
    it('Test: Validate non-zero, non-negative prices', async () => {
      const zeroPriceInput = createTestPriceInput({ close: 0 })

      await expect(priceService.createOrUpdatePrice(zeroPriceInput))
        .rejects.toThrow('Price must be positive')

      const negativePriceInput = createTestPriceInput({ close: -10.50 })

      await expect(priceService.createOrUpdatePrice(negativePriceInput))
        .rejects.toThrow('Price must be positive')
    })

    it('Test: Validate >20% price change requires confirmation', async () => {
      // Create initial price
      const initialPrice = createTestPriceInput({ close: 150.00 })
      await priceService.createOrUpdatePrice(initialPrice)

      // Try to update with >20% increase
      const largeIncreaseInput = createTestPriceInput({
        date: '2024-10-26', // Different date
        close: 200.00 // 33.3% increase
      })

      const validationResult = await priceService.validatePriceChange(largeIncreaseInput)
      expect(validationResult.requiresConfirmation).toBe(true)
      expect(validationResult.percentChange).toBe(33.33)
      expect(validationResult.previousPrice).toBe(150.00)

      // Try to update with >20% decrease
      const largeDecreaseInput = createTestPriceInput({
        date: '2024-10-27', // Different date
        close: 100.00 // 33.3% decrease
      })

      const decreaseValidationResult = await priceService.validatePriceChange(largeDecreaseInput)
      expect(decreaseValidationResult.requiresConfirmation).toBe(true)
      expect(decreaseValidationResult.percentChange).toBe(-33.33)
    })

    it('Test: Allow price changes within 20% without confirmation', async () => {
      // Create initial price
      const initialPrice = createTestPriceInput({ close: 150.00 })
      await priceService.createOrUpdatePrice(initialPrice)

      // Try to update with <20% increase
      const smallIncreaseInput = createTestPriceInput({
        date: '2024-10-26',
        close: 165.00 // 10% increase
      })

      const validationResult = await priceService.validatePriceChange(smallIncreaseInput)
      expect(validationResult.requiresConfirmation).toBe(false)
      expect(validationResult.isValid).toBe(true)
    })
  })

  describe('1.2.6 Price Retrieval Operations', () => {
    it('Test: Get latest price for underlying', async () => {
      // Create price records for different dates
      await priceService.createOrUpdatePrice(createTestPriceInput({
        date: '2024-10-24',
        close: 150.00
      }))
      await priceService.createOrUpdatePrice(createTestPriceInput({
        date: '2024-10-25',
        close: 152.50
      }))
      await priceService.createOrUpdatePrice(createTestPriceInput({
        date: '2024-10-23',
        close: 148.00
      }))

      const latestPrice = await priceService.getLatestPrice('AAPL')

      expect(latestPrice).toBeDefined()
      expect(latestPrice!.underlying).toBe('AAPL')
      expect(latestPrice!.date).toBe('2024-10-25') // Most recent date
      expect(latestPrice!.close).toBe(152.50)
    })

    it('Test: Return null when no prices exist', async () => {
      const noPrice = await priceService.getLatestPrice('NONEXISTENT')
      expect(noPrice).toBeNull()
    })

    it('Test: Get price history with pagination', async () => {
      // Create multiple price records
      const dates = ['2024-10-20', '2024-10-21', '2024-10-22', '2024-10-23', '2024-10-24']
      for (let i = 0; i < dates.length; i++) {
        await priceService.createOrUpdatePrice(createTestPriceInput({
          date: dates[i],
          close: 150 + i
        }))
      }

      const history = await priceService.getPriceHistory('AAPL', { limit: 3 })

      expect(history).toHaveLength(3)
      expect(history[0].date).toBe('2024-10-24') // Most recent first
      expect(history[1].date).toBe('2024-10-23')
      expect(history[2].date).toBe('2024-10-22')
    })

    it('Test: Get price by specific date', async () => {
      await priceService.createOrUpdatePrice(createTestPriceInput({
        date: '2024-10-25',
        close: 152.50
      }))

      const specificPrice = await priceService.getPriceByDate('AAPL', '2024-10-25')

      expect(specificPrice).toBeDefined()
      expect(specificPrice!.underlying).toBe('AAPL')
      expect(specificPrice!.date).toBe('2024-10-25')
      expect(specificPrice!.close).toBe(152.50)

      // Test non-existent date
      const nonExistentPrice = await priceService.getPriceByDate('AAPL', '2024-10-26')
      expect(nonExistentPrice).toBeNull()
    })
  })

  describe('1.2.6 Batch Operations', () => {
    it('Test: Get all latest prices for dashboard', async () => {
      // Create prices for multiple underlyings
      await priceService.createOrUpdatePrice(createTestPriceInput({
        underlying: 'AAPL',
        date: '2024-10-25',
        close: 152.50
      }))
      await priceService.createOrUpdatePrice(createTestPriceInput({
        underlying: 'TSLA',
        date: '2024-10-25',
        close: 265.00
      }))
      await priceService.createOrUpdatePrice(createTestPriceInput({
        underlying: 'NVDA',
        date: '2024-10-25',
        close: 445.00
      }))

      const allPrices = await priceService.getAllLatestPrices(['AAPL', 'TSLA', 'NVDA'])

      expect(allPrices.size).toBe(3)
      expect(allPrices.get('AAPL')?.close).toBe(152.50)
      expect(allPrices.get('TSLA')?.close).toBe(265.00)
      expect(allPrices.get('NVDA')?.close).toBe(445.00)
    })
  })

  describe('1.2.6 Data Integrity', () => {
    it('Test: Store timestamp in updated_at field', async () => {
      const beforeCreate = new Date()
      const priceInput = createTestPriceInput()

      const result = await priceService.createOrUpdatePrice(priceInput)
      const afterCreate = new Date()

      expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime())
      expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime())
    })

    it('Test: Handle multiple underlyings independently', async () => {
      const aaplPrice = createTestPriceInput({ underlying: 'AAPL', close: 150.00 })
      const tslaPrice = createTestPriceInput({ underlying: 'TSLA', close: 250.00 })

      const aaplResult = await priceService.createOrUpdatePrice(aaplPrice)
      const tslaResult = await priceService.createOrUpdatePrice(tslaPrice)

      expect(aaplResult.underlying).toBe('AAPL')
      expect(tslaResult.underlying).toBe('TSLA')

      const retrievedAAPL = await priceService.getLatestPrice('AAPL')
      const retrievedTSLA = await priceService.getLatestPrice('TSLA')

      expect(retrievedAAPL?.close).toBe(150.00)
      expect(retrievedTSLA?.close).toBe(250.00)
    })
  })
})