import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { Position, Trade } from './position'
import { PositionService } from './position'
import { SchemaManager } from '@/services/SchemaManager'
import 'fake-indexeddb/auto'

const basePositionFields = {
  trade_kind: 'stock' as const,
  profit_target_basis: 'stock_price' as const,
  stop_loss_basis: 'stock_price' as const,
  trades: [] as Trade[]
}

const baseOptionFields = {
  trade_kind: 'option' as const,
  profit_target_basis: 'option_price' as const,
  stop_loss_basis: 'stock_price' as const,
  option_type: 'put' as const,
  strike_price: 100,
  expiration_date: new Date('2025-01-17'),
  premium_per_contract: 2.5,
  trades: [] as Trade[]
}

describe('Position - Phase 1A: Basic Position Planning', () => {
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
      const request = indexedDB.open('TestDB', 1)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result
        SchemaManager.initializeSchema(database, 1)
      }
    })

    // Create service with injected database
    positionService = new PositionService(db)
  })

  afterEach(() => {
    db?.close()
    indexedDB.deleteDatabase('TestDB')
  })

  describe('Position Interface', () => {
    it('should define Position interface with required Phase 1A fields', () => {
      const mockPosition: Position = {
        ...basePositionFields,
        id: 'pos-123',
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        target_entry_price: 150.00,
        target_quantity: 100,
        profit_target: 165.00,
        stop_loss: 135.00,
        position_thesis: 'Bullish on Q4 earnings and iPhone cycle',
        created_date: new Date('2024-01-15'),
        status: 'planned',
        journal_entry_ids: []
      }

      // Test that all required fields are present
      expect(mockPosition.id).toBeDefined()
      expect(mockPosition.symbol).toBeDefined()
      expect(mockPosition.strategy_type).toBeDefined()
      expect(mockPosition.target_entry_price).toBeDefined()
      expect(mockPosition.target_quantity).toBeDefined()
      expect(mockPosition.profit_target).toBeDefined()
      expect(mockPosition.stop_loss).toBeDefined()
      expect(mockPosition.position_thesis).toBeDefined()
      expect(mockPosition.trade_kind).toBeDefined()
      expect(mockPosition.profit_target_basis).toBeDefined()
      expect(mockPosition.stop_loss_basis).toBeDefined()
      expect(mockPosition.created_date).toBeDefined()
      expect(mockPosition.status).toBeDefined()
      expect(mockPosition.journal_entry_ids).toBeDefined()
      expect(Array.isArray(mockPosition.journal_entry_ids)).toBe(true)
      expect(Array.isArray(mockPosition.trades)).toBe(true)
    })

    it('should support both Long Stock and Short Put strategy_type values', () => {
      const longStock: Position = {
        ...basePositionFields,
        id: 'pos-123',
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        target_entry_price: 150.00,
        target_quantity: 100,
        profit_target: 165.00,
        stop_loss: 135.00,
        position_thesis: 'Test thesis',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: []
      }

      const shortPut: Position = {
        ...baseOptionFields,
        id: 'pos-456',
        symbol: 'AAPL',
        strategy_type: 'Short Put',
        target_entry_price: 2.5,
        target_quantity: 1,
        profit_target: 1.0,
        stop_loss: 5.0,
        position_thesis: 'Sell premium at support',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: []
      }

      expect(longStock.strategy_type).toBe('Long Stock')
      expect(shortPut.strategy_type).toBe('Short Put')
    })

    it('should only accept "planned" status for new positions in Phase 1A', () => {
      const plannedPosition: Position = {
        ...basePositionFields,
        id: 'pos-123',
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        target_entry_price: 150.00,
        target_quantity: 100,
        profit_target: 165.00,
        stop_loss: 135.00,
        position_thesis: 'Test thesis',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: []
      }

      expect(plannedPosition.status).toBe('planned')
    })

    it('should include option-specific fields for Short Put plans', () => {
      const shortPutPlan: Position = {
        ...baseOptionFields,
        id: 'pos-789',
        symbol: 'AAPL',
        strategy_type: 'Short Put',
        target_entry_price: 2.5,
        target_quantity: 1,
        profit_target: 1.0,
        stop_loss: 5.0,
        position_thesis: 'Sell premium at support',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: []
      }

      expect(shortPutPlan.trade_kind).toBe('option')
      expect(shortPutPlan.option_type).toBe('put')
      expect(shortPutPlan.strike_price).toBe(100)
      expect(shortPutPlan.expiration_date).toBeInstanceOf(Date)
      expect(shortPutPlan.premium_per_contract).toBe(2.5)
    })
  })

  describe('Trade Interface', () => {
    it('should support option trade fields', () => {
      const optionTrade: Trade = {
        id: 'trade-123',
        position_id: 'pos-123',
        trade_kind: 'option',
        trade_type: 'sell',
        action: 'STO',
        quantity: 1,
        price: 2.5,
        timestamp: new Date('2025-01-02T10:00:00.000Z'),
        notes: 'Sell to open',
        underlying: 'AAPL',
        occ_symbol: 'AAPL  250117P00100000',
        option_type: 'put',
        strike_price: 100,
        expiration_date: new Date('2025-01-17'),
        contract_quantity: 1,
        underlying_price_at_trade: 98.5
      }

      expect(optionTrade.trade_kind).toBe('option')
      expect(optionTrade.action).toBe('STO')
      expect(optionTrade.occ_symbol).toBeDefined()
      expect(optionTrade.expiration_date).toBeInstanceOf(Date)
      expect(optionTrade.underlying_price_at_trade).toBe(98.5)
    })
  })

  describe('IndexedDB CRUD Operations', () => {
    it('should save a position to IndexedDB', async () => {
      const position: Position = {
        ...basePositionFields,
        id: 'pos-123',
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        target_entry_price: 150.00,
        target_quantity: 100,
        profit_target: 165.00,
        stop_loss: 135.00,
        position_thesis: 'Bullish on Q4 earnings',
        created_date: new Date('2024-01-15'),
        status: 'planned',
        journal_entry_ids: []
      }

      await positionService.create(position)
      const savedPosition = await positionService.getById('pos-123')

      expect(savedPosition).toBeDefined()
      expect(savedPosition?.id).toBe('pos-123')
      expect(savedPosition?.symbol).toBe('AAPL')
      expect(savedPosition?.strategy_type).toBe('Long Stock')
      expect(savedPosition?.status).toBe('planned')
    })

    it('should retrieve all positions from IndexedDB', async () => {
      const position1: Position = {
        ...basePositionFields,
        id: 'pos-1',
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        target_entry_price: 150.00,
        target_quantity: 100,
        profit_target: 165.00,
        stop_loss: 135.00,
        position_thesis: 'Bullish on earnings',
        created_date: new Date('2024-01-15'),
        status: 'planned',
        journal_entry_ids: []
      }

      const position2: Position = {
        ...basePositionFields,
        id: 'pos-2',
        symbol: 'MSFT',
        strategy_type: 'Long Stock',
        target_entry_price: 300.00,
        target_quantity: 50,
        profit_target: 330.00,
        stop_loss: 270.00,
        position_thesis: 'Cloud growth momentum',
        created_date: new Date('2024-01-16'),
        status: 'planned',
        journal_entry_ids: []
      }

      await positionService.create(position1)
      await positionService.create(position2)

      const positions = await positionService.getAll()
      expect(positions).toHaveLength(2)
      expect(positions.map(p => p.symbol)).toContain('AAPL')
      expect(positions.map(p => p.symbol)).toContain('MSFT')
    })

    it('should update a position in IndexedDB', async () => {
      const originalPosition: Position = {
        ...basePositionFields,
        id: 'pos-123',
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        target_entry_price: 150.00,
        target_quantity: 100,
        profit_target: 165.00,
        stop_loss: 135.00,
        position_thesis: 'Original thesis',
        created_date: new Date('2024-01-15'),
        status: 'planned',
        journal_entry_ids: []
      }

      await positionService.create(originalPosition)

      const updatedPosition: Position = {
        ...originalPosition,
        position_thesis: 'Updated thesis with more research'
      }

      await positionService.update(updatedPosition)
      const retrievedPosition = await positionService.getById('pos-123')

      expect(retrievedPosition?.position_thesis).toBe('Updated thesis with more research')
    })

    it('should delete a position from IndexedDB', async () => {
      const position: Position = {
        ...basePositionFields,
        id: 'pos-123',
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        target_entry_price: 150.00,
        target_quantity: 100,
        profit_target: 165.00,
        stop_loss: 135.00,
        position_thesis: 'Test position',
        created_date: new Date('2024-01-15'),
        status: 'planned',
        journal_entry_ids: []
      }

      await positionService.create(position)
      expect(await positionService.getById('pos-123')).toBeDefined()

      await positionService.delete('pos-123')
      expect(await positionService.getById('pos-123')).toBeNull()
    })
  })

  describe('Position Validation', () => {
    it('should validate required fields before saving', async () => {
      const incompletePosition = {
        id: 'pos-123',
        symbol: 'AAPL',
        // Missing required fields
      } as Position

      await expect(positionService.create(incompletePosition))
        .rejects.toThrow('Invalid position data')
    })

    it('should validate target_entry_price is positive', async () => {
      const invalidPosition: Position = {
        ...basePositionFields,
        id: 'pos-123',
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        target_entry_price: -10.00, // Invalid negative price
        target_quantity: 100,
        profit_target: 165.00,
        stop_loss: 135.00,
        position_thesis: 'Test thesis',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: []
      }

      await expect(positionService.create(invalidPosition))
        .rejects.toThrow('target_entry_price must be positive')
    })

    it('should validate target_quantity is positive', async () => {
      const invalidPosition: Position = {
        ...basePositionFields,
        id: 'pos-123',
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        target_entry_price: 150.00,
        target_quantity: 0, // Invalid zero quantity
        profit_target: 165.00,
        stop_loss: 135.00,
        position_thesis: 'Test thesis',
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: []
      }

      await expect(positionService.create(invalidPosition))
        .rejects.toThrow('target_quantity must be positive')
    })

    it('should validate position_thesis is not empty', async () => {
      const invalidPosition: Position = {
        ...basePositionFields,
        id: 'pos-123',
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        target_entry_price: 150.00,
        target_quantity: 100,
        profit_target: 165.00,
        stop_loss: 135.00,
        position_thesis: '', // Invalid empty thesis
        created_date: new Date(),
        status: 'planned',
        journal_entry_ids: []
      }

      await expect(positionService.create(invalidPosition))
        .rejects.toThrow('position_thesis cannot be empty')
    })
  })
})
