import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PositionService } from '@/lib/position'
import { SchemaManager } from '@/services/SchemaManager'
import type { Position } from '@/lib/position'
import 'fake-indexeddb/auto'

/**
 * Comprehensive test suite for PositionService.createWithOptionStrategy()
 *
 * This test suite verifies that PositionService can create option strategy positions:
 * - Creates Short Put position with all option fields saved correctly
 * - Returns created position with generated ID
 * - Calls validateOptionPosition() before saving
 * - Rejects invalid positions with ValidationError
 * - Long Stock positions still create correctly
 * - Position saves to IndexedDB positions store
 */
describe('PositionService - createWithOptionStrategy()', () => {
  let positionService: PositionService
  let db: IDBDatabase

  beforeEach(async () => {
    // Clean database
    const deleteRequest = indexedDB.deleteDatabase('TestPositionServiceDB')
    await new Promise<void>((resolve) => {
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => resolve()
    })

    // Create test database with schema
    db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('TestPositionServiceDB', 4)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result
        SchemaManager.initializeSchema(event, database)
      }
    })

    positionService = new PositionService(db)
  })

  afterEach(() => {
    db?.close()
  })

  describe('Short Put Position Creation', () => {
    it('should create Short Put position with all option fields', async () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      const shortPutPosition: Position = {
        id: '',  // Will be generated
        symbol: 'AAPL',
        strategy_type: 'Short Put',
        option_type: 'put',
        strike_price: 150,
        expiration_date: futureDate.toISOString().split('T')[0],
        premium_per_contract: 3.50,
        profit_target_basis: 'stock_price',
        profit_target: 140,
        stop_loss_basis: 'stock_price',
        stop_loss: 160,
        target_entry_price: 150,
        target_quantity: 5,
        position_thesis: 'Neutral to bullish view on AAPL',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
      }

      const result = await positionService.create(shortPutPosition)

      expect(result).toBeDefined()
      expect(result.id).toBeTruthy()
      expect(result.strategy_type).toBe('Short Put')
      expect(result.option_type).toBe('put')
      expect(result.strike_price).toBe(150)
      expect(result.expiration_date).toBe(futureDate.toISOString().split('T')[0])
      expect(result.premium_per_contract).toBe(3.50)
    })

    it('should save position to IndexedDB positions store', async () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      const shortPutPosition: Position = {
        id: 'test-short-put-1',
        symbol: 'SPY',
        strategy_type: 'Short Put',
        option_type: 'put',
        strike_price: 400,
        expiration_date: futureDate.toISOString().split('T')[0],
        premium_per_contract: 2.75,
        profit_target_basis: 'option_price',
        profit_target: 20,
        stop_loss_basis: 'option_price',
        stop_loss: 10,
        target_entry_price: 400,
        target_quantity: 10,
        position_thesis: 'Market neutral to slightly bullish',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
      }

      await positionService.create(shortPutPosition)

      // Verify position was saved
      const retrieved = await positionService.getById('test-short-put-1')
      expect(retrieved).toBeDefined()
      expect(retrieved?.strategy_type).toBe('Short Put')
      expect(retrieved?.strike_price).toBe(400)
      expect(retrieved?.expiration_date).toBe(futureDate.toISOString().split('T')[0])
    })
  })

  describe('ID Generation', () => {
    it('should generate ID when position has empty string ID', async () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      const positionWithoutId: Position = {
        id: '',
        symbol: 'TSLA',
        strategy_type: 'Short Put',
        option_type: 'put',
        strike_price: 200,
        expiration_date: futureDate.toISOString().split('T')[0],
        premium_per_contract: 5.50,
        profit_target_basis: 'stock_price',
        stop_loss_basis: 'stock_price',
        target_entry_price: 200,
        target_quantity: 3,
        profit_target: 190,
        stop_loss: 210,
        position_thesis: 'Test',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
      }

      const result = await positionService.create(positionWithoutId)

      expect(result.id).toBeTruthy()
      expect(result.id).not.toBe('')
    })

    it('should use provided ID when position has ID', async () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      const positionWithId: Position = {
        id: 'my-custom-id',
        symbol: 'TSLA',
        strategy_type: 'Short Put',
        option_type: 'put',
        strike_price: 200,
        expiration_date: futureDate.toISOString().split('T')[0],
        premium_per_contract: 5.50,
        profit_target_basis: 'stock_price',
        stop_loss_basis: 'stock_price',
        target_entry_price: 200,
        target_quantity: 3,
        profit_target: 190,
        stop_loss: 210,
        position_thesis: 'Test',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
      }

      const result = await positionService.create(positionWithId)

      expect(result.id).toBe('my-custom-id')
    })
  })

  describe('Long Stock Position Creation', () => {
    it('should still create Long Stock positions correctly', async () => {
      const longStockPosition: Position = {
        id: '',
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        target_entry_price: 150,
        target_quantity: 100,
        profit_target: 170,
        stop_loss: 140,
        position_thesis: 'Bullish on AAPL',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
      }

      const result = await positionService.create(longStockPosition)

      expect(result).toBeDefined()
      expect(result.strategy_type).toBe('Long Stock')
      expect(result.option_type).toBeUndefined()
      expect(result.strike_price).toBeUndefined()
    })
  })

  describe('Validation', () => {
    it('should reject Short Put position missing option_type', async () => {
      const invalidPosition: Position = {
        id: '',
        symbol: 'AAPL',
        strategy_type: 'Short Put',
        // option_type is missing
        strike_price: 150,
        expiration_date: '2025-01-17',
        premium_per_contract: 3.50,
        target_entry_price: 150,
        target_quantity: 5,
        profit_target: 140,
        stop_loss: 160,
        position_thesis: 'Test',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
      }

      await expect(positionService.create(invalidPosition)).rejects.toThrow()
    })

    it('should reject Short Put position missing strike_price', async () => {
      const invalidPosition: Position = {
        id: '',
        symbol: 'AAPL',
        strategy_type: 'Short Put',
        option_type: 'put',
        // strike_price is missing
        expiration_date: '2025-01-17',
        premium_per_contract: 3.50,
        target_entry_price: 150,
        target_quantity: 5,
        profit_target: 140,
        stop_loss: 160,
        position_thesis: 'Test',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
      }

      await expect(positionService.create(invalidPosition)).rejects.toThrow()
    })

    it('should reject Short Put position missing expiration_date', async () => {
      const invalidPosition: Position = {
        id: '',
        symbol: 'AAPL',
        strategy_type: 'Short Put',
        option_type: 'put',
        strike_price: 150,
        // expiration_date is missing
        premium_per_contract: 3.50,
        target_entry_price: 150,
        target_quantity: 5,
        profit_target: 140,
        stop_loss: 160,
        position_thesis: 'Test',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
      }

      await expect(positionService.create(invalidPosition)).rejects.toThrow()
    })

    it('should reject Short Put position with past expiration_date', async () => {
      const invalidPosition: Position = {
        id: '',
        symbol: 'AAPL',
        strategy_type: 'Short Put',
        option_type: 'put',
        strike_price: 150,
        expiration_date: '2020-01-17',  // Past date
        premium_per_contract: 3.50,
        target_entry_price: 150,
        target_quantity: 5,
        profit_target: 140,
        stop_loss: 160,
        position_thesis: 'Test',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
      }

      await expect(positionService.create(invalidPosition)).rejects.toThrow()
    })

    it('should reject Short Put position with invalid strike_price (<= 0)', async () => {
      const invalidPosition: Position = {
        id: '',
        symbol: 'AAPL',
        strategy_type: 'Short Put',
        option_type: 'put',
        strike_price: 0,  // Invalid
        expiration_date: '2025-01-17',
        premium_per_contract: 3.50,
        target_entry_price: 150,
        target_quantity: 5,
        profit_target: 140,
        stop_loss: 160,
        position_thesis: 'Test',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
      }

      await expect(positionService.create(invalidPosition)).rejects.toThrow()
    })
  })

  describe('Return Value', () => {
    it('should return the created position with all fields', async () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)

      const position: Position = {
        id: 'test-return-1',
        symbol: 'AAPL',
        strategy_type: 'Short Put',
        option_type: 'put',
        strike_price: 150,
        expiration_date: futureDate.toISOString().split('T')[0],
        premium_per_contract: 3.50,
        profit_target_basis: 'stock_price',
        profit_target: 140,
        stop_loss_basis: 'stock_price',
        stop_loss: 160,
        target_entry_price: 150,
        target_quantity: 5,
        position_thesis: 'Test return value',
        created_date: new Date('2024-01-15T10:30:00Z'),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
      }

      const result = await positionService.create(position)

      expect(result.id).toBe('test-return-1')
      expect(result.symbol).toBe('AAPL')
      expect(result.strategy_type).toBe('Short Put')
      expect(result.option_type).toBe('put')
      expect(result.strike_price).toBe(150)
      expect(result.expiration_date).toBe(futureDate.toISOString().split('T')[0])
      expect(result.premium_per_contract).toBe(3.50)
      expect(result.profit_target_basis).toBe('stock_price')
      expect(result.profit_target).toBe(140)
      expect(result.stop_loss_basis).toBe('stock_price')
      expect(result.stop_loss).toBe(160)
    })
  })

  describe('Error Handling', () => {
    it('should propagate IndexedDB errors', async () => {
      // Close database to simulate error
      db.close()

      const position: Position = {
        id: 'test-error',
        symbol: 'AAPL',
        strategy_type: 'Short Put',
        option_type: 'put',
        strike_price: 150,
        expiration_date: '2025-01-17',
        premium_per_contract: 3.50,
        target_entry_price: 150,
        target_quantity: 5,
        profit_target: 140,
        stop_loss: 160,
        position_thesis: 'Test',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
      }

      await expect(positionService.create(position)).rejects.toThrow()
    })
  })
})
