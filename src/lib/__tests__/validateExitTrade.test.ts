/**
 * Unit Tests: Exit Trade Validation
 *
 * Tests the validateExitTrade function that ensures exit trades
 * are valid before they are added to a position.
 *
 * Constitutional Principle IV: Test-First Discipline
 * These tests verify validation logic prevents invalid exit operations.
 */

import { describe, it, expect } from 'vitest'
import type { Position, Trade } from '@/lib/position'
import { validateExitTrade, ValidationError } from '@/lib/position'
import { createPosition } from '@/test/data-factories'

const createTestTrade = (overrides?: Partial<Trade>): Trade => ({
  id: 'trade-123',
  position_id: 'pos-123',
  trade_type: 'buy',
  quantity: 100,
  price: 150,
  timestamp: new Date('2024-01-16T00:00:00.000Z'),
  underlying: 'AAPL',
  ...overrides
})

describe('validateExitTrade', () => {
  describe('Planned Position Validation', () => {
    it('should reject exit from planned position (no trades yet)', () => {
      const position = createPosition({
        status: 'planned',
        trades: []
      })

      expect(() => validateExitTrade(position, 100, 155))
        .toThrow(ValidationError)

      expect(() => validateExitTrade(position, 100, 155))
        .toThrow('Cannot exit a planned position. Add an entry trade first.')
    })
  })

  describe('Overselling Prevention', () => {
    it('should reject exit quantity exceeding open quantity', () => {
      const position = createPosition({
        status: 'open',
        trades: [
          createTestTrade({
            id: 'trade-1',
            trade_type: 'buy',
            quantity: 100,
            price: 150
          })
        ]
      })

      // Attempting to sell 150 shares when only 100 are open
      expect(() => validateExitTrade(position, 150, 155))
        .toThrow(ValidationError)

      expect(() => validateExitTrade(position, 150, 155))
        .toThrow('Exit quantity (150) exceeds open quantity (100).')
    })

    it('should reject exit from closed position (net quantity is 0)', () => {
      const position = createPosition({
        status: 'closed',
        trades: [
          createTestTrade({
            id: 'trade-1',
            trade_type: 'buy',
            quantity: 100,
            price: 150
          }),
          createTestTrade({
            id: 'trade-2',
            trade_type: 'sell',
            quantity: 100,
            price: 155
          })
        ]
      })

      expect(() => validateExitTrade(position, 50, 160))
        .toThrow(ValidationError)

      expect(() => validateExitTrade(position, 50, 160))
        .toThrow('Cannot exit a closed position (net quantity is already 0).')
    })
  })

  describe('Price Validation', () => {
    it('should allow zero price (worthless exit)', () => {
      const position = createPosition({
        status: 'open',
        trades: [
          createTestTrade({
            id: 'trade-1',
            trade_type: 'buy',
            quantity: 100,
            price: 150
          })
        ]
      })

      // Zero price should be allowed (e.g., expired worthless option)
      expect(() => validateExitTrade(position, 100, 0))
        .not.toThrow()
    })

    it('should reject negative price', () => {
      const position = createPosition({
        status: 'open',
        trades: [
          createTestTrade({
            id: 'trade-1',
            trade_type: 'buy',
            quantity: 100,
            price: 150
          })
        ]
      })

      expect(() => validateExitTrade(position, 100, -10))
        .toThrow(ValidationError)

      expect(() => validateExitTrade(position, 100, -10))
        .toThrow('Exit price must be >= 0.')
    })
  })

  describe('Valid Exit Scenarios', () => {
    it('should allow valid full exit', () => {
      const position = createPosition({
        status: 'open',
        trades: [
          createTestTrade({
            id: 'trade-1',
            trade_type: 'buy',
            quantity: 100,
            price: 150
          })
        ]
      })

      expect(() => validateExitTrade(position, 100, 155))
        .not.toThrow()
    })

    it('should allow valid partial exit', () => {
      const position = createPosition({
        status: 'open',
        trades: [
          createTestTrade({
            id: 'trade-1',
            trade_type: 'buy',
            quantity: 100,
            price: 150
          })
        ]
      })

      expect(() => validateExitTrade(position, 50, 155))
        .not.toThrow()
    })

    it('should allow exit from position with multiple entries', () => {
      const position = createPosition({
        status: 'open',
        trades: [
          createTestTrade({
            id: 'trade-1',
            trade_type: 'buy',
            quantity: 50,
            price: 150
          }),
          createTestTrade({
            id: 'trade-2',
            trade_type: 'buy',
            quantity: 50,
            price: 152
          })
        ]
      })

      // Can exit up to 100 shares (50 + 50)
      expect(() => validateExitTrade(position, 100, 155))
        .not.toThrow()

      expect(() => validateExitTrade(position, 75, 155))
        .not.toThrow()
    })

    it('should correctly calculate open quantity after partial exits', () => {
      const position = createPosition({
        status: 'open',
        trades: [
          createTestTrade({
            id: 'trade-1',
            trade_type: 'buy',
            quantity: 100,
            price: 150
          }),
          createTestTrade({
            id: 'trade-2',
            trade_type: 'sell',
            quantity: 30,
            price: 155
          })
        ]
      })

      // Only 70 shares remain open (100 - 30)
      expect(() => validateExitTrade(position, 70, 156))
        .not.toThrow()

      expect(() => validateExitTrade(position, 71, 156))
        .toThrow('Exit quantity (71) exceeds open quantity (70).')
    })
  })
})
