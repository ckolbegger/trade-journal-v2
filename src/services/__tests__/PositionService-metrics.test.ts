import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PositionService } from '@/lib/position'
import type { Position, Trade } from '@/lib/position'
import type { PriceHistory } from '@/types/priceHistory'
import { CostBasisCalculator } from '@/domain/calculators/CostBasisCalculator'
import { PnLCalculator } from '@/domain/calculators/PnLCalculator'

// Test data factories
const createTestTrade = (overrides?: Partial<Trade>): Trade => ({
  id: 'trade-123',
  position_id: 'pos-123',
  trade_type: 'buy',
  quantity: 100,
  price: 150.00,
  timestamp: new Date('2024-01-15T10:30:00.000Z'),
  underlying: 'AAPL',
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
  status: 'open',
  journal_entry_ids: [],
  trades: [createTestTrade()],
  ...overrides
})

const createTestPriceHistory = (overrides?: Partial<PriceHistory>): PriceHistory => ({
  id: 'price-123',
  underlying: 'AAPL',
  date: '2024-01-20',
  open: 155,
  high: 158,
  low: 153,
  close: 156,
  updated_at: new Date('2024-01-20T16:00:00.000Z'),
  ...overrides
})

describe('PositionService calculatePositionMetrics', () => {
  let positionService: PositionService

  beforeEach(() => {
    positionService = new PositionService()
  })

  afterEach(() => {
    positionService.close()
  })

  describe('delegation to domain calculators', () => {
    it('should delegate to CostBasisCalculator for cost metrics', () => {
      const position = createTestPosition()
      const priceMap = new Map<string, PriceHistory>()
      priceMap.set('AAPL', createTestPriceHistory())

      const avgCostSpy = vi.spyOn(CostBasisCalculator, 'calculateAverageCost')
      const costBasisSpy = vi.spyOn(CostBasisCalculator, 'calculateTotalCostBasis')
      const openQtySpy = vi.spyOn(CostBasisCalculator, 'calculateOpenQuantity')

      positionService.calculatePositionMetrics(position, priceMap)

      expect(avgCostSpy).toHaveBeenCalledWith(position.trades, position.target_entry_price)
      expect(costBasisSpy).toHaveBeenCalledWith(position.trades)
      expect(openQtySpy).toHaveBeenCalledWith(position.trades)

      avgCostSpy.mockRestore()
      costBasisSpy.mockRestore()
      openQtySpy.mockRestore()
    })

    it('should delegate to PnLCalculator for P&L metrics', () => {
      const position = createTestPosition()
      const priceMap = new Map<string, PriceHistory>()
      priceMap.set('AAPL', createTestPriceHistory())

      const pnlSpy = vi.spyOn(PnLCalculator, 'calculatePositionPnL')

      positionService.calculatePositionMetrics(position, priceMap)

      expect(pnlSpy).toHaveBeenCalledWith(position, priceMap)

      pnlSpy.mockRestore()
    })
  })

  describe('metrics calculation', () => {
    it('should return complete metrics object', () => {
      const position = createTestPosition({
        trades: [createTestTrade({ price: 150, quantity: 100 })]
      })
      const priceMap = new Map<string, PriceHistory>()
      priceMap.set('AAPL', createTestPriceHistory({ close: 160 }))

      const metrics = positionService.calculatePositionMetrics(position, priceMap)

      expect(metrics).toHaveProperty('avgCost')
      expect(metrics).toHaveProperty('costBasis')
      expect(metrics).toHaveProperty('openQuantity')
      expect(metrics).toHaveProperty('pnl')
      expect(metrics).toHaveProperty('pnlPercentage')
    })

    it('should handle positions with no trades', () => {
      const position = createTestPosition({ trades: [], status: 'planned' })
      const priceMap = new Map<string, PriceHistory>()

      const metrics = positionService.calculatePositionMetrics(position, priceMap)

      // With no trades, avgCost falls back to target_entry_price
      expect(metrics.avgCost).toBe(position.target_entry_price)
      expect(metrics.costBasis).toBe(0)
      expect(metrics.openQuantity).toBe(0)
      expect(metrics.pnl).toBeNull()
      expect(metrics.pnlPercentage).toBeUndefined()
    })

    it('should handle positions with no price data', () => {
      const position = createTestPosition()
      const priceMap = new Map<string, PriceHistory>() // Empty - no price data

      const metrics = positionService.calculatePositionMetrics(position, priceMap)

      expect(metrics.avgCost).toBe(150) // From trade price
      expect(metrics.costBasis).toBe(15000) // 100 * 150
      expect(metrics.openQuantity).toBe(100)
      expect(metrics.pnl).toBeNull() // No price data means no P&L
      expect(metrics.pnlPercentage).toBeUndefined()
    })

    it('should calculate correct pnlPercentage', () => {
      const position = createTestPosition({
        trades: [createTestTrade({ price: 100, quantity: 100 })] // Cost basis = 10,000
      })
      const priceMap = new Map<string, PriceHistory>()
      priceMap.set('AAPL', createTestPriceHistory({ close: 120 })) // Current value = 12,000

      const metrics = positionService.calculatePositionMetrics(position, priceMap)

      // P&L = 12,000 - 10,000 = 2,000
      // P&L % = 2,000 / 10,000 = 20%
      expect(metrics.pnl).toBe(2000)
      expect(metrics.pnlPercentage).toBe(20)
    })

    it('should return undefined pnlPercentage when costBasis is 0', () => {
      const position = createTestPosition({ trades: [] })
      const priceMap = new Map<string, PriceHistory>()

      const metrics = positionService.calculatePositionMetrics(position, priceMap)

      expect(metrics.costBasis).toBe(0)
      expect(metrics.pnlPercentage).toBeUndefined()
    })
  })
})
