import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PositionService } from '@/lib/position'
import type { Position } from '@/lib/position'
import { SchemaManager } from '@/services/SchemaManager'
import 'fake-indexeddb/auto'

/**
 * Integration Test: PositionService Option Plan Creation
 *
 * Tests the complete workflow of creating a Short Put position plan through PositionService,
 * verifying validation via PositionValidator, persistence to IndexedDB, and retrieval
 * with all option fields intact.
 *
 * This differs from unit tests by testing the complete integration with:
 * - PositionValidator validation
 * - IndexedDB persistence layer
 * - Real database schema
 */
describe('Integration: PositionService Option Plan Creation', () => {
  const DB_NAME = 'TradingJournalDB-Options-Test'
  const DB_VERSION = 1
  let db: IDBDatabase
  let positionService: PositionService

  beforeEach(async () => {
    // Clean up any existing database
    const deleteRequest = indexedDB.deleteDatabase(DB_NAME)
    await new Promise<void>((resolve) => {
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => resolve()
      deleteRequest.onblocked = () => resolve()
    })

    // Create fresh database with schema
    db = await new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result
        SchemaManager.initializeSchema(database, DB_VERSION)
      }
    })

    // Create service instance
    positionService = new PositionService(db)
  })

  afterEach(() => {
    db?.close()
    indexedDB.deleteDatabase(DB_NAME)
  })

  describe('service validates via PositionValidator', () => {
    it('should reject Short Put plan with missing option_type', async () => {
      // Arrange: Create Short Put plan without option_type
      const invalidPosition = {
        id: 'short-put-invalid-1',
        symbol: 'AAPL',
        strategy_type: 'Short Put',
        trade_kind: 'option',
        target_entry_price: 150.00,
        target_quantity: 10,
        profit_target: 165.00,
        stop_loss: 145.00,
        position_thesis: 'Missing option_type',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: [],
        // option_type: missing
        strike_price: 150.00,
        expiration_date: new Date('2026-12-31'),
        profit_target_basis: 'option',
        stop_loss_basis: 'option'
      } as any

      // Act & Assert: Should throw validation error
      await expect(positionService.create(invalidPosition))
        .rejects.toThrow('option_type is required for Short Put strategy')
    })

    it('should reject Short Put plan with missing strike_price', async () => {
      // Arrange: Create Short Put plan without strike_price
      const invalidPosition = {
        id: 'short-put-invalid-2',
        symbol: 'AAPL',
        strategy_type: 'Short Put',
        trade_kind: 'option',
        target_entry_price: 150.00,
        target_quantity: 10,
        profit_target: 165.00,
        stop_loss: 145.00,
        position_thesis: 'Missing strike_price',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: [],
        option_type: 'put',
        // strike_price: missing
        expiration_date: new Date('2026-12-31'),
        profit_target_basis: 'option',
        stop_loss_basis: 'option'
      } as any

      // Act & Assert: Should throw validation error
      await expect(positionService.create(invalidPosition))
        .rejects.toThrow('strike_price is required for Short Put strategy')
    })

    it('should reject Short Put plan with missing expiration_date', async () => {
      // Arrange: Create Short Put plan without expiration_date
      const invalidPosition = {
        id: 'short-put-invalid-3',
        symbol: 'AAPL',
        strategy_type: 'Short Put',
        trade_kind: 'option',
        target_entry_price: 150.00,
        target_quantity: 10,
        profit_target: 165.00,
        stop_loss: 145.00,
        position_thesis: 'Missing expiration_date',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: [],
        option_type: 'put',
        strike_price: 150.00,
        // expiration_date: missing
        profit_target_basis: 'option',
        stop_loss_basis: 'option'
      } as any

      // Act & Assert: Should throw validation error
      await expect(positionService.create(invalidPosition))
        .rejects.toThrow('expiration_date is required for Short Put strategy')
    })

    it('should reject Short Put plan with strike_price <= 0', async () => {
      // Arrange: Create Short Put plan with negative strike_price
      const invalidPosition: Position = {
        id: 'short-put-invalid-4',
        symbol: 'AAPL',
        strategy_type: 'Short Put',
        trade_kind: 'option',
        target_entry_price: 150.00,
        target_quantity: 10,
        profit_target: 165.00,
        stop_loss: 145.00,
        position_thesis: 'Negative strike_price',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: [],
        option_type: 'put',
        strike_price: -150.00, // Invalid
        expiration_date: new Date('2026-12-31'),
        profit_target_basis: 'option',
        stop_loss_basis: 'option'
      }

      // Act & Assert: Should throw validation error
      await expect(positionService.create(invalidPosition))
        .rejects.toThrow('strike_price must be positive')
    })

    it('should reject Short Put plan with past expiration_date', async () => {
      // Arrange: Create Short Put plan with past expiration
      const invalidPosition: Position = {
        id: 'short-put-invalid-5',
        symbol: 'AAPL',
        strategy_type: 'Short Put',
        trade_kind: 'option',
        target_entry_price: 150.00,
        target_quantity: 10,
        profit_target: 165.00,
        stop_loss: 145.00,
        position_thesis: 'Past expiration date',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: [],
        option_type: 'put',
        strike_price: 150.00,
        expiration_date: new Date('2020-01-01'), // Past date
        profit_target_basis: 'option',
        stop_loss_basis: 'option'
      }

      // Act & Assert: Should throw validation error
      await expect(positionService.create(invalidPosition))
        .rejects.toThrow('expiration_date must be in the future')
    })

    it('should reject Short Put plan with negative premium', async () => {
      // Arrange: Create Short Put plan with negative premium
      const invalidPosition: Position = {
        id: 'short-put-invalid-6',
        symbol: 'AAPL',
        strategy_type: 'Short Put',
        trade_kind: 'option',
        target_entry_price: 150.00,
        target_quantity: 10,
        profit_target: 165.00,
        stop_loss: 145.00,
        position_thesis: 'Negative premium',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: [],
        option_type: 'put',
        strike_price: 150.00,
        expiration_date: new Date('2026-12-31'),
        premium_per_contract: -5.00, // Invalid
        profit_target_basis: 'option',
        stop_loss_basis: 'option'
      }

      // Act & Assert: Should throw validation error
      await expect(positionService.create(invalidPosition))
        .rejects.toThrow('premium_per_contract must be positive when provided')
    })

    it('should accept Short Put plan with all valid fields', async () => {
      // Arrange: Create valid Short Put plan
      const validPosition: Position = {
        id: 'short-put-valid-1',
        symbol: 'AAPL',
        strategy_type: 'Short Put',
        trade_kind: 'option',
        target_entry_price: 150.00,
        target_quantity: 10,
        profit_target: 165.00,
        stop_loss: 145.00,
        position_thesis: 'Valid Short Put position plan',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: [],
        trades: [],
        option_type: 'put',
        strike_price: 150.00,
        expiration_date: new Date('2026-12-31'),
        premium_per_contract: 5.00,
        profit_target_basis: 'option',
        stop_loss_basis: 'option'
      }

      // Act: Create position - should not throw
      await expect(positionService.create(validPosition)).resolves.toBeTruthy()
    })
  })

  describe('persists to IndexedDB', () => {
    it('should save Short Put plan to database', async () => {
      // Arrange: Create valid Short Put plan
      const position: Position = {
        id: 'short-put-persist-1',
        symbol: 'TSLA',
        strategy_type: 'Short Put',
        trade_kind: 'option',
        target_entry_price: 200.00,
        target_quantity: 5,
        profit_target: 220.00,
        stop_loss: 190.00,
        position_thesis: 'Test database persistence',
        created_date: new Date('2025-01-01'),
        status: 'planned',
        journal_entry_ids: [],
        trades: [],
        option_type: 'put',
        strike_price: 200.00,
        expiration_date: new Date('2026-06-30'),
        premium_per_contract: 8.50,
        profit_target_basis: 'option',
        stop_loss_basis: 'option'
      }

      // Act: Create position
      await positionService.create(position)

      // Assert: Verify it exists in database (raw query)
      const rawPosition = await new Promise<any>((resolve, reject) => {
        const transaction = db.transaction(['positions'], 'readonly')
        const store = transaction.objectStore('positions')
        const request = store.get('short-put-persist-1')
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result)
      })

      expect(rawPosition).toBeDefined()
      expect(rawPosition.id).toBe('short-put-persist-1')
      expect(rawPosition.symbol).toBe('TSLA')
      expect(rawPosition.strategy_type).toBe('Short Put')
    })

    it('should persist all option fields to database', async () => {
      // Arrange: Create Short Put plan with all option fields
      const position: Position = {
        id: 'short-put-persist-2',
        symbol: 'NVDA',
        strategy_type: 'Short Put',
        trade_kind: 'option',
        target_entry_price: 450.00,
        target_quantity: 2,
        profit_target: 500.00,
        stop_loss: 430.00,
        position_thesis: 'Test all option fields persist',
        created_date: new Date('2025-01-02'),
        status: 'planned',
        journal_entry_ids: [],
        trades: [],
        option_type: 'put',
        strike_price: 450.00,
        expiration_date: new Date('2026-09-18'),
        premium_per_contract: 12.75,
        profit_target_basis: 'option',
        stop_loss_basis: 'stock'
      }

      // Act: Create position
      await positionService.create(position)

      // Assert: Verify all option fields persisted
      const rawPosition = await new Promise<any>((resolve, reject) => {
        const transaction = db.transaction(['positions'], 'readonly')
        const store = transaction.objectStore('positions')
        const request = store.get('short-put-persist-2')
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result)
      })

      expect(rawPosition).toBeDefined()
      expect(rawPosition.option_type).toBe('put')
      expect(rawPosition.strike_price).toBe(450.00)
      expect(rawPosition.expiration_date).toBeDefined()
      expect(rawPosition.premium_per_contract).toBe(12.75)
      expect(rawPosition.profit_target_basis).toBe('option')
      expect(rawPosition.stop_loss_basis).toBe('stock')
    })

    it('should persist Short Put plan without premium_per_contract (optional field)', async () => {
      // Arrange: Create Short Put plan without premium (not yet known)
      const position: Position = {
        id: 'short-put-persist-3',
        symbol: 'AMD',
        strategy_type: 'Short Put',
        trade_kind: 'option',
        target_entry_price: 120.00,
        target_quantity: 10,
        profit_target: 130.00,
        stop_loss: 115.00,
        position_thesis: 'Test without premium',
        created_date: new Date('2025-01-03'),
        status: 'planned',
        journal_entry_ids: [],
        trades: [],
        option_type: 'put',
        strike_price: 120.00,
        expiration_date: new Date('2026-03-20'),
        // premium_per_contract: undefined (not specified)
        profit_target_basis: 'option',
        stop_loss_basis: 'option'
      }

      // Act: Create position - should succeed
      await positionService.create(position)

      // Assert: Verify persisted without premium
      const rawPosition = await new Promise<any>((resolve, reject) => {
        const transaction = db.transaction(['positions'], 'readonly')
        const store = transaction.objectStore('positions')
        const request = store.get('short-put-persist-3')
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result)
      })

      expect(rawPosition).toBeDefined()
      expect(rawPosition.premium_per_contract).toBeUndefined()
    })
  })

  describe('returns complete position object', () => {
    it('should return position with all fields after create', async () => {
      // Arrange: Create Short Put plan
      const position: Position = {
        id: 'short-put-return-1',
        symbol: 'MSFT',
        strategy_type: 'Short Put',
        trade_kind: 'option',
        target_entry_price: 380.00,
        target_quantity: 3,
        profit_target: 400.00,
        stop_loss: 370.00,
        position_thesis: 'Test return value',
        created_date: new Date('2025-01-04'),
        status: 'planned',
        journal_entry_ids: [],
        trades: [],
        option_type: 'put',
        strike_price: 380.00,
        expiration_date: new Date('2026-12-18'),
        premium_per_contract: 15.25,
        profit_target_basis: 'stock',
        stop_loss_basis: 'option'
      }

      // Act: Create position
      const returned = await positionService.create(position)

      // Assert: Returned object contains all fields
      expect(returned).toBeDefined()
      expect(returned.id).toBe('short-put-return-1')
      expect(returned.symbol).toBe('MSFT')
      expect(returned.strategy_type).toBe('Short Put')
      expect(returned.trade_kind).toBe('option')
      expect(returned.option_type).toBe('put')
      expect(returned.strike_price).toBe(380.00)
      expect(returned.expiration_date).toEqual(position.expiration_date)
      expect(returned.premium_per_contract).toBe(15.25)
      expect(returned.profit_target_basis).toBe('stock')
      expect(returned.stop_loss_basis).toBe('option')
    })
  })

  describe('retrievable after save', () => {
    it('should retrieve Short Put plan with all option fields intact', async () => {
      // Arrange: Create and save Short Put plan
      const position: Position = {
        id: 'short-put-retrieve-1',
        symbol: 'GOOG',
        strategy_type: 'Short Put',
        trade_kind: 'option',
        target_entry_price: 140.00,
        target_quantity: 5,
        profit_target: 150.00,
        stop_loss: 135.00,
        position_thesis: 'Test retrieval with all fields',
        created_date: new Date('2025-01-05'),
        status: 'planned',
        journal_entry_ids: [],
        trades: [],
        option_type: 'put',
        strike_price: 140.00,
        expiration_date: new Date('2026-07-17'),
        premium_per_contract: 6.00,
        profit_target_basis: 'option',
        stop_loss_basis: 'option'
      }

      await positionService.create(position)

      // Act: Retrieve position
      const retrieved = await positionService.getById('short-put-retrieve-1')

      // Assert: All option fields intact
      expect(retrieved).not.toBeNull()
      expect(retrieved!.id).toBe('short-put-retrieve-1')
      expect(retrieved!.symbol).toBe('GOOG')
      expect(retrieved!.strategy_type).toBe('Short Put')
      expect(retrieved!.trade_kind).toBe('option')
      expect(retrieved!.option_type).toBe('put')
      expect(retrieved!.strike_price).toBe(140.00)
      expect(retrieved!.expiration_date).toEqual(position.expiration_date)
      expect(retrieved!.premium_per_contract).toBe(6.00)
      expect(retrieved!.profit_target_basis).toBe('option')
      expect(retrieved!.stop_loss_basis).toBe('option')
    })

    it('should retrieve Short Put plan without premium (optional field)', async () => {
      // Arrange: Create Short Put plan without premium
      const position: Position = {
        id: 'short-put-retrieve-2',
        symbol: 'META',
        strategy_type: 'Short Put',
        trade_kind: 'option',
        target_entry_price: 450.00,
        target_quantity: 4,
        profit_target: 470.00,
        stop_loss: 440.00,
        position_thesis: 'Test retrieval without premium',
        created_date: new Date('2025-01-06'),
        status: 'planned',
        journal_entry_ids: [],
        trades: [],
        option_type: 'put',
        strike_price: 450.00,
        expiration_date: new Date('2026-10-16'),
        profit_target_basis: 'option',
        stop_loss_basis: 'stock'
      }

      await positionService.create(position)

      // Act: Retrieve position
      const retrieved = await positionService.getById('short-put-retrieve-2')

      // Assert: Premium is undefined (not set)
      expect(retrieved).not.toBeNull()
      expect(retrieved!.premium_per_contract).toBeUndefined()
      expect(retrieved!.strike_price).toBe(450.00)
      expect(retrieved!.option_type).toBe('put')
    })

    it('should retrieve multiple Short Put plans via getAll', async () => {
      // Arrange: Create multiple Short Put plans
      const position1: Position = {
        id: 'short-put-retrieve-3',
        symbol: 'INTC',
        strategy_type: 'Short Put',
        trade_kind: 'option',
        target_entry_price: 45.00,
        target_quantity: 20,
        profit_target: 50.00,
        stop_loss: 43.00,
        position_thesis: 'First position',
        created_date: new Date('2025-01-07'),
        status: 'planned',
        journal_entry_ids: [],
        trades: [],
        option_type: 'put',
        strike_price: 45.00,
        expiration_date: new Date('2026-04-17'),
        premium_per_contract: 2.50,
        profit_target_basis: 'option',
        stop_loss_basis: 'option'
      }

      const position2: Position = {
        id: 'short-put-retrieve-4',
        symbol: 'IBM',
        strategy_type: 'Short Put',
        trade_kind: 'option',
        target_entry_price: 170.00,
        target_quantity: 8,
        profit_target: 180.00,
        stop_loss: 165.00,
        position_thesis: 'Second position',
        created_date: new Date('2025-01-08'),
        status: 'planned',
        journal_entry_ids: [],
        trades: [],
        option_type: 'put',
        strike_price: 170.00,
        expiration_date: new Date('2026-08-21'),
        premium_per_contract: 7.00,
        profit_target_basis: 'stock',
        stop_loss_basis: 'stock'
      }

      await positionService.create(position1)
      await positionService.create(position2)

      // Act: Retrieve all positions
      const allPositions = await positionService.getAll()

      // Assert: Both positions retrieved with option fields
      const retrieved1 = allPositions.find(p => p.id === 'short-put-retrieve-3')
      const retrieved2 = allPositions.find(p => p.id === 'short-put-retrieve-4')

      expect(retrieved1).toBeDefined()
      expect(retrieved1!.strategy_type).toBe('Short Put')
      expect(retrieved1!.strike_price).toBe(45.00)
      expect(retrieved1!.premium_per_contract).toBe(2.50)

      expect(retrieved2).toBeDefined()
      expect(retrieved2!.strategy_type).toBe('Short Put')
      expect(retrieved2!.strike_price).toBe(170.00)
      expect(retrieved2!.premium_per_contract).toBe(7.00)
    })

    it('should handle mixed Long Stock and Short Put positions', async () => {
      // Arrange: Create one Long Stock and one Short Put
      const stockPosition: Position = {
        id: 'mixed-stock-1',
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        trade_kind: 'stock',
        target_entry_price: 150.00,
        target_quantity: 100,
        profit_target: 165.00,
        stop_loss: 145.00,
        position_thesis: 'Long stock position',
        created_date: new Date('2025-01-09'),
        status: 'planned',
        journal_entry_ids: [],
        trades: []
      }

      const optionPosition: Position = {
        id: 'mixed-option-1',
        symbol: 'TSLA',
        strategy_type: 'Short Put',
        trade_kind: 'option',
        target_entry_price: 200.00,
        target_quantity: 10,
        profit_target: 220.00,
        stop_loss: 190.00,
        position_thesis: 'Short put position',
        created_date: new Date('2025-01-10'),
        status: 'planned',
        journal_entry_ids: [],
        trades: [],
        option_type: 'put',
        strike_price: 200.00,
        expiration_date: new Date('2026-11-20'),
        premium_per_contract: 9.50,
        profit_target_basis: 'option',
        stop_loss_basis: 'option'
      }

      await positionService.create(stockPosition)
      await positionService.create(optionPosition)

      // Act: Retrieve both positions
      const allPositions = await positionService.getAll()

      // Assert: Both types coexist correctly
      const stock = allPositions.find(p => p.id === 'mixed-stock-1')
      const option = allPositions.find(p => p.id === 'mixed-option-1')

      expect(stock).toBeDefined()
      expect(stock!.strategy_type).toBe('Long Stock')
      expect(stock!.trade_kind).toBe('stock')
      expect(stock!.option_type).toBeUndefined()
      expect(stock!.strike_price).toBeUndefined()

      expect(option).toBeDefined()
      expect(option!.strategy_type).toBe('Short Put')
      expect(option!.trade_kind).toBe('option')
      expect(option!.option_type).toBe('put')
      expect(option!.strike_price).toBe(200.00)
    })
  })
})
