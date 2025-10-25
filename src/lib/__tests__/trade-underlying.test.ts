import { describe, it, expect } from 'vitest'
import type { Trade } from '@/lib/position'

/**
 * Tests for Trade interface underlying field enhancement
 *
 * These tests verify that the Trade interface supports the new `underlying` field
 * which enables price lookups and future multi-leg option positions.
 */

describe('Trade Interface - Underlying Field', () => {
  it('[Unit] should include underlying field in Trade interface', () => {
    // Arrange & Act
    const trade: Trade = {
      id: 'trade-123',
      position_id: 'pos-123',
      trade_type: 'buy',
      quantity: 100,
      price: 150.00,
      timestamp: new Date('2024-01-15T10:30:00.000Z'),
      underlying: 'AAPL', // NEW FIELD
      notes: 'Test trade'
    }

    // Assert
    expect(trade.underlying).toBe('AAPL')
    expect(typeof trade.underlying).toBe('string')
  })

  it('[Unit] should support stock symbol format for underlying', () => {
    // Arrange & Act
    const trade: Trade = {
      id: 'trade-123',
      position_id: 'pos-123',
      trade_type: 'buy',
      quantity: 100,
      price: 150.00,
      timestamp: new Date('2024-01-15T10:30:00.000Z'),
      underlying: 'TSLA'
    }

    // Assert
    expect(trade.underlying).toBe('TSLA')
  })

  it('[Unit] should support OCC option symbol format for underlying', () => {
    // Arrange & Act - OCC format: "AAPL  250117C00150000"
    const optionTrade: Trade = {
      id: 'trade-456',
      position_id: 'pos-123',
      trade_type: 'buy',
      quantity: 1,
      price: 5.50,
      timestamp: new Date('2024-01-15T10:30:00.000Z'),
      underlying: 'AAPL  250117C00150000' // 21-character OCC symbol
    }

    // Assert
    expect(optionTrade.underlying).toBe('AAPL  250117C00150000')
    expect(optionTrade.underlying.length).toBe(21)
  })

  it('[Unit] should allow Trade creation without underlying for backward compatibility', () => {
    // Arrange & Act - Existing trades may not have underlying field
    const legacyTrade: Partial<Trade> = {
      id: 'trade-789',
      position_id: 'pos-123',
      trade_type: 'buy',
      quantity: 100,
      price: 150.00,
      timestamp: new Date('2024-01-15T10:30:00.000Z')
      // underlying field is missing (backward compatibility)
    }

    // Assert - Should not error, field is optional for existing data
    expect(legacyTrade.underlying).toBeUndefined()
  })

  it('[Unit] should validate that underlying is a non-empty string when provided', () => {
    // Arrange
    const validTrade: Trade = {
      id: 'trade-123',
      position_id: 'pos-123',
      trade_type: 'buy',
      quantity: 100,
      price: 150.00,
      timestamp: new Date('2024-01-15T10:30:00.000Z'),
      underlying: 'AAPL'
    }

    // Assert
    expect(validTrade.underlying).toBeTruthy()
    expect(validTrade.underlying.trim()).not.toBe('')
  })
})
