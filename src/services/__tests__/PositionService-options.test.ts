import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PositionService } from '@/lib/position'
import type { Position } from '@/lib/position'
import { SchemaManager } from '@/services/SchemaManager'
import 'fake-indexeddb/auto'

const createTestPosition = (overrides?: Partial<Position>): Position => ({
  id: `pos-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

describe('PositionService - Option Plan Creation', () => {
  let db: IDBDatabase
  let positionService: PositionService

  beforeEach(async () => {
    // Delete database to ensure clean state
    const deleteRequest = indexedDB.deleteDatabase('TestDB')
    await new Promise<void>((resolve) => {
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => resolve()
      deleteRequest.onblocked = () => resolve()
    })

    // Create test database with schema
    db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('TestDB', 3)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result
        SchemaManager.initializeSchema(database, 3)
      }
    })

    // Create service with injected database
    positionService = new PositionService(db)
  })

  afterEach(() => {
    db?.close()
    indexedDB.deleteDatabase('TestDB')
  })

  describe('Long Stock positions (without option fields)', () => {
    it('should create Long Stock position without option fields', async () => {
      const position = createTestPosition({
        id: 'long-stock-1',
        strategy_type: 'Long Stock',
        trade_kind: 'stock'
      })

      const created = await positionService.create(position)

      expect(created).toBeDefined()
      expect(created.id).toBe('long-stock-1')
      expect(created.strategy_type).toBe('Long Stock')
      expect(created.trade_kind).toBe('stock')
      expect(created.option_type).toBeUndefined()
      expect(created.strike_price).toBeUndefined()
      expect(created.expiration_date).toBeUndefined()
      expect(created.premium_per_contract).toBeUndefined()
      expect(created.profit_target_basis).toBeUndefined()
      expect(created.stop_loss_basis).toBeUndefined()
    })
  })

  describe('Short Put positions (with option fields)', () => {
    it('should create Short Put position with all option fields', async () => {
      // Use a date far in the future to avoid test failures
      const expirationDate = new Date('2026-06-20T00:00:00.000Z')
      const position = createTestPosition({
        id: 'short-put-1',
        strategy_type: 'Short Put',
        trade_kind: 'option',
        option_type: 'put',
        strike_price: 145,
        expiration_date: expirationDate,
        premium_per_contract: 2.50,
        profit_target_basis: 'option',
        stop_loss_basis: 'option'
      })

      const created = await positionService.create(position)

      expect(created).toBeDefined()
      expect(created.id).toBe('short-put-1')
      expect(created.strategy_type).toBe('Short Put')
      expect(created.trade_kind).toBe('option')
      expect(created.option_type).toBe('put')
      expect(created.strike_price).toBe(145)
      expect(created.expiration_date).toEqual(expirationDate)
      expect(created.premium_per_contract).toBe(2.50)
      expect(created.profit_target_basis).toBe('option')
      expect(created.stop_loss_basis).toBe('option')
    })

    it('should validate option fields before saving', async () => {
      const position = createTestPosition({
        strategy_type: 'Short Put',
        trade_kind: 'option',
        option_type: 'put',
        strike_price: 145,
        expiration_date: new Date('2026-06-20T00:00:00.000Z'),
        premium_per_contract: 2.50,
        profit_target_basis: 'option',
        stop_loss_basis: 'option'
      })

      // This should succeed because all required fields are present
      const created = await positionService.create(position)
      expect(created).toBeDefined()
    })

    it('should reject invalid Short Put plan (missing required fields)', async () => {
      const position = createTestPosition({
        strategy_type: 'Short Put',
        trade_kind: 'option'
        // Missing: option_type, strike_price, expiration_date, profit_target_basis, stop_loss_basis
      })

      await expect(positionService.create(position)).rejects.toThrow()
    })

    it('should reject Short Put with invalid strike price', async () => {
      const position = createTestPosition({
        strategy_type: 'Short Put',
        trade_kind: 'option',
        option_type: 'put',
        strike_price: -10, // Invalid: negative
        expiration_date: new Date('2025-06-20T00:00:00.000Z'),
        profit_target_basis: 'option',
        stop_loss_basis: 'option'
      })

      await expect(positionService.create(position)).rejects.toThrow('strike_price must be positive')
    })

    it('should reject Short Put with past expiration date', async () => {
      const pastDate = new Date('2020-01-01T00:00:00.000Z')
      const position = createTestPosition({
        strategy_type: 'Short Put',
        trade_kind: 'option',
        option_type: 'put',
        strike_price: 145,
        expiration_date: pastDate, // Invalid: in the past
        profit_target_basis: 'option',
        stop_loss_basis: 'option'
      })

      await expect(positionService.create(position)).rejects.toThrow('expiration_date must be in the future')
    })

    it('should reject Short Put with negative premium', async () => {
      const position = createTestPosition({
        strategy_type: 'Short Put',
        trade_kind: 'option',
        option_type: 'put',
        strike_price: 145,
        expiration_date: new Date('2026-06-20T00:00:00.000Z'),
        premium_per_contract: -1.50, // Invalid: negative
        profit_target_basis: 'option',
        stop_loss_basis: 'option'
      })

      await expect(positionService.create(position)).rejects.toThrow('premium_per_contract must be positive')
    })

    it('should persist option fields to database', async () => {
      const expirationDate = new Date('2026-06-20T00:00:00.000Z')
      const position = createTestPosition({
        id: 'short-put-persist',
        strategy_type: 'Short Put',
        trade_kind: 'option',
        option_type: 'put',
        strike_price: 145,
        expiration_date: expirationDate,
        premium_per_contract: 2.50,
        profit_target_basis: 'option',
        stop_loss_basis: 'option'
      })

      await positionService.create(position)

      // Retrieve from database
      const retrieved = await positionService.getById('short-put-persist')

      expect(retrieved).toBeDefined()
      expect(retrieved!.strategy_type).toBe('Short Put')
      expect(retrieved!.trade_kind).toBe('option')
      expect(retrieved!.option_type).toBe('put')
      expect(retrieved!.strike_price).toBe(145)
      expect(retrieved!.expiration_date).toEqual(expirationDate)
      expect(retrieved!.premium_per_contract).toBe(2.50)
      expect(retrieved!.profit_target_basis).toBe('option')
      expect(retrieved!.stop_loss_basis).toBe('option')
    })
  })
})
