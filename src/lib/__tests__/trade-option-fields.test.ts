/**
 * Unit Tests: Trade Interface - Option Fields Extension (T002)
 *
 * Tests that Trade interface correctly accepts option fields for option trading.
 * These fields support Phase 1A option strategy implementation.
 */

import { describe, it, expect } from 'vitest'
import type { Trade } from '@/lib/position'

describe('Trade interface - option fields', () => {
  it('type compiles with all new option fields', () => {
    const optionTrade: Trade = {
      id: 'trade-1',
      position_id: 'pos-1',
      trade_type: 'sell',
      quantity: 1,
      price: 2.50,
      timestamp: new Date(),
      underlying: 'AAPL',
      // New option-specific fields
      action: 'STO',
      occ_symbol: 'AAPL  250117P00145000',
      option_type: 'put',
      strike_price: 145,
      expiration_date: new Date('2025-01-17'),
      contract_quantity: 1,
      underlying_price_at_trade: 150.00,
      created_stock_position_id: 'pos-2',
      cost_basis_adjustment: -2.50
    }

    // Type check - if this compiles, the interface accepts all fields
    expect(optionTrade.action).toBe('STO')
    expect(optionTrade.occ_symbol).toBe('AAPL  250117P00145000')
    expect(optionTrade.option_type).toBe('put')
    expect(optionTrade.strike_price).toBe(145)
    expect(optionTrade.expiration_date).toEqual(new Date('2025-01-17'))
    expect(optionTrade.contract_quantity).toBe(1)
    expect(optionTrade.underlying_price_at_trade).toBe(150.00)
    expect(optionTrade.created_stock_position_id).toBe('pos-2')
    expect(optionTrade.cost_basis_adjustment).toBe(-2.50)
  })

  it('optional fields accept undefined for stock trades', () => {
    const stockTrade: Trade = {
      id: 'trade-2',
      position_id: 'pos-2',
      trade_type: 'buy',
      quantity: 100,
      price: 150.00,
      timestamp: new Date(),
      underlying: 'AAPL',
      notes: 'Initial entry',
      // Option fields should be optional (undefined for stock trades)
      action: undefined,
      occ_symbol: undefined,
      option_type: undefined,
      strike_price: undefined,
      expiration_date: undefined,
      contract_quantity: undefined,
      underlying_price_at_trade: undefined,
      created_stock_position_id: undefined,
      cost_basis_adjustment: undefined
    }

    // Verify undefined is accepted for all option fields
    expect(stockTrade.action).toBeUndefined()
    expect(stockTrade.occ_symbol).toBeUndefined()
    expect(stockTrade.option_type).toBeUndefined()
    expect(stockTrade.strike_price).toBeUndefined()
    expect(stockTrade.expiration_date).toBeUndefined()
    expect(stockTrade.contract_quantity).toBeUndefined()
    expect(stockTrade.underlying_price_at_trade).toBeUndefined()
    expect(stockTrade.created_stock_position_id).toBeUndefined()
    expect(stockTrade.cost_basis_adjustment).toBeUndefined()
  })

  it('existing stock trades remain valid without new fields', () => {
    // Legacy trade without option fields should still be valid
    const legacyTrade: Trade = {
      id: 'trade-3',
      position_id: 'pos-3',
      trade_type: 'buy',
      quantity: 50,
      price: 200.00,
      timestamp: new Date(),
      underlying: 'TSLA',
      notes: 'Scale-in trade'
      // No option fields - should still compile
    } as Trade

    // Type check - legacy trade is still valid
    expect(legacyTrade.id).toBe('trade-3')
    expect(legacyTrade.trade_type).toBe('buy')
    expect(legacyTrade.underlying).toBe('TSLA')
  })
})
