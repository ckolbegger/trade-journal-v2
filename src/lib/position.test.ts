import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { Position } from './position'
import { PositionService } from './position'
import { SchemaManager } from '@/services/SchemaManager'
import 'fake-indexeddb/auto'

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
        SchemaManager.initializeSchema(event, database)
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
      expect(mockPosition.created_date).toBeDefined()
      expect(mockPosition.status).toBeDefined()
      expect(mockPosition.journal_entry_ids).toBeDefined()
      expect(Array.isArray(mockPosition.journal_entry_ids)).toBe(true)
    })

    it('should only accept "Long Stock" strategy_type in Phase 1A', () => {
      const validPosition: Position = {
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

      expect(validPosition.strategy_type).toBe('Long Stock')
    })

    it('should only accept "planned" status for new positions in Phase 1A', () => {
      const plannedPosition: Position = {
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
  })

  describe('IndexedDB CRUD Operations', () => {
    it('should save a position to IndexedDB', async () => {
      const position: Position = {
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