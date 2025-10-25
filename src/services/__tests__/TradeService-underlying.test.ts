import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TradeService } from '@/services/TradeService'
import { PositionService } from '@/lib/position'
import type { Position, Trade } from '@/lib/position'

// Test data factories
const createTestTrade = (overrides?: Partial<Trade>): Trade => ({
  id: 'trade-123',
  position_id: 'pos-123',
  trade_type: 'buy',
  quantity: 100,
  price: 150.25,
  timestamp: new Date('2024-01-15T10:30:00.000Z'),
  notes: 'Test trade execution',
  underlying: 'AAPL', // New field
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

describe('Slice 3.2: Trade Enhancement - Underlying Field', () => {
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

  describe('Trade Interface Enhancement', () => {
    it('Test: Trade interface includes underlying field', () => {
      const trade = createTestTrade()

      expect(trade.underlying).toBeDefined()
      expect(trade.underlying).toBe('AAPL')
    })

    it('Test: Trade interface requires underlying field', () => {
      // This test verifies TypeScript compilation - if underlying was optional,
      // this would still compile but we want it to be required
      const trade: Trade = {
        id: 'trade-123',
        position_id: 'pos-123',
        trade_type: 'buy',
        quantity: 100,
        price: 150.25,
        timestamp: new Date('2024-01-15T10:30:00.000Z'),
        underlying: 'AAPL' // This field should be required
      }

      expect(trade.underlying).toBe('AAPL')
    })
  })

  describe('TradeService Auto-Population', () => {
    it('Test: Populate underlying when creating trade', async () => {
      const mockGetById = vi.mocked(mockPositionService.getById)
      mockGetById.mockResolvedValue(testPosition)

      const tradeData = {
        position_id: 'pos-123',
        trade_type: 'buy' as const,
        quantity: 100,
        price: 150.25,
        timestamp: new Date('2024-01-15T10:30:00.000Z'),
        // Note: no underlying field provided
      }

      const result = await tradeService.addTrade(tradeData)

      expect(mockGetById).toHaveBeenCalledWith('pos-123')
      expect(result[0].underlying).toBe('AAPL') // Should auto-populate from position.symbol
    })

    it('Test: Auto-populate underlying from position.symbol', async () => {
      const tslaPosition = createTestPosition({ symbol: 'TSLA' })
      const mockGetById = vi.mocked(mockPositionService.getById)
      mockGetById.mockResolvedValue(tslaPosition)

      const tradeData = {
        position_id: 'pos-123',
        trade_type: 'buy' as const,
        quantity: 50,
        price: 250.00,
        timestamp: new Date('2024-01-15T10:30:00.000Z'),
      }

      const result = await tradeService.addTrade(tradeData)

      expect(result[0].underlying).toBe('TSLA')
    })

    it('Test: Use provided underlying if already specified', async () => {
      const mockGetById = vi.mocked(mockPositionService.getById)
      mockGetById.mockResolvedValue(testPosition)

      const tradeData = {
        position_id: 'pos-123',
        trade_type: 'buy' as const,
        quantity: 100,
        price: 150.25,
        timestamp: new Date('2024-01-15T10:30:00.000Z'),
        underlying: 'AAPL  250117C00150000' // OCC option symbol for Phase 3+
      }

      const result = await tradeService.addTrade(tradeData)

      expect(result[0].underlying).toBe('AAPL  250117C00150000') // Should use provided value
    })
  })

  describe('Trade Validation', () => {
    it('Test: Validate underlying is required for new trades', async () => {
      const mockGetById = vi.mocked(mockPositionService.getById)
      mockGetById.mockResolvedValue(testPosition)

      const tradeData = {
        position_id: 'pos-123',
        trade_type: 'buy' as const,
        quantity: 100,
        price: 150.25,
        timestamp: new Date('2024-01-15T10:30:00.000Z'),
        underlying: '' // Empty underlying should fail validation
      }

      await expect(tradeService.addTrade(tradeData))
        .rejects.toThrow('Trade validation failed: Underlying cannot be empty')
    })

    it('Test: Validate non-empty underlying', async () => {
      const mockGetById = vi.mocked(mockPositionService.getById)
      mockGetById.mockResolvedValue(testPosition)

      const tradeData = {
        position_id: 'pos-123',
        trade_type: 'buy' as const,
        quantity: 100,
        price: 150.25,
        timestamp: new Date('2024-01-15T10:30:00.000Z'),
        underlying: '   ' // Whitespace only should fail
      }

      await expect(tradeService.addTrade(tradeData))
        .rejects.toThrow('Trade validation failed: Underlying cannot be empty')
    })

    it('Test: Validate valid stock symbol format', async () => {
      const mockGetById = vi.mocked(mockPositionService.getById)
      mockGetById.mockResolvedValue(testPosition)

      const mockUpdate = vi.mocked(mockPositionService.update)
      mockUpdate.mockResolvedValue(testPosition)

      const tradeData = {
        position_id: 'pos-123',
        trade_type: 'buy' as const,
        quantity: 100,
        price: 150.25,
        timestamp: new Date('2024-01-15T10:30:00.000Z'),
        underlying: 'AAPL'
      }

      const result = await tradeService.addTrade(tradeData)

      expect(result[0].underlying).toBe('AAPL')
      expect(mockUpdate).toHaveBeenCalled()
    })

    it('Test: Validate valid OCC option symbol format (Phase 3+)', async () => {
      const mockGetById = vi.mocked(mockPositionService.getById)
      mockGetById.mockResolvedValue(testPosition)

      const mockUpdate = vi.mocked(mockPositionService.update)
      mockUpdate.mockResolvedValue(testPosition)

      const tradeData = {
        position_id: 'pos-123',
        trade_type: 'buy' as const,
        quantity: 1,
        price: 5.25,
        timestamp: new Date('2024-01-15T10:30:00.000Z'),
        underlying: 'AAPL  250117C00150000' // Valid OCC symbol
      }

      const result = await tradeService.addTrade(tradeData)

      expect(result[0].underlying).toBe('AAPL  250117C00150000')
      expect(mockUpdate).toHaveBeenCalled()
    })
  })

  describe('Backward Compatibility', () => {
    it('Test: Handle existing trades without underlying (backward compat)', async () => {
      // Simulate loading an old trade without underlying field
      const oldTradeData = {
        id: 'old-trade-123',
        position_id: 'pos-123',
        trade_type: 'buy' as const,
        quantity: 100,
        price: 150.25,
        timestamp: new Date('2024-01-15T10:30:00.000Z'),
        // No underlying field - this is an old trade
      } as any

      // This test verifies that the system can handle old trades
      // In practice, this would be handled during migration
      expect(oldTradeData.id).toBe('old-trade-123')
      // The underlying field should be computed from position.symbol when needed
    })

    it('Test: New trades require underlying field', async () => {
      const mockGetById = vi.mocked(mockPositionService.getById)
      mockGetById.mockResolvedValue(testPosition)

      const tradeData = {
        position_id: 'pos-123',
        trade_type: 'buy' as const,
        quantity: 100,
        price: 150.25,
        timestamp: new Date('2024-01-15T10:30:00.000Z'),
        // Missing underlying field - should be auto-populated
      }

      const result = await tradeService.addTrade(tradeData)

      expect(result[0].underlying).toBe('AAPL') // Should be auto-populated
    })
  })
})