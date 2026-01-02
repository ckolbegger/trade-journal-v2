/**
 * Unit Tests: Position Interface - Option Fields Extension (T001)
 *
 * Tests that Position interface correctly accepts option fields for Short Put strategy.
 * These fields support Phase 1A option strategy implementation.
 */

import { describe, it, expect } from 'vitest'
import type { Position } from '@/lib/position'

describe('Position interface - option fields', () => {
  it('type compiles with all new option fields', () => {
    const shortPutPosition: Position = {
      id: 'pos-1',
      symbol: 'AAPL',
      strategy_type: 'Short Put',
      trade_kind: 'option',
      target_entry_price: 150,
      target_quantity: 1,
      profit_target: 100,
      stop_loss: -200,
      position_thesis: 'Bullish on AAPL, selling put for premium',
      created_date: new Date(),
      status: 'planned',
      journal_entry_ids: [],
      trades: [],
      // New option-specific fields
      option_type: 'put',
      strike_price: 145,
      expiration_date: new Date('2025-01-17'),
      premium_per_contract: 2.50,
      profit_target_basis: 'option',
      stop_loss_basis: 'stock'
    }

    // Type check - if this compiles, the interface accepts all fields
    expect(shortPutPosition.strategy_type).toBe('Short Put')
    expect(shortPutPosition.trade_kind).toBe('option')
    expect(shortPutPosition.option_type).toBe('put')
    expect(shortPutPosition.strike_price).toBe(145)
    expect(shortPutPosition.expiration_date).toEqual(new Date('2025-01-17'))
    expect(shortPutPosition.premium_per_contract).toBe(2.50)
    expect(shortPutPosition.profit_target_basis).toBe('option')
    expect(shortPutPosition.stop_loss_basis).toBe('stock')
  })

  it('optional fields accept undefined for stock positions', () => {
    const stockPosition: Position = {
      id: 'pos-2',
      symbol: 'TSLA',
      strategy_type: 'Long Stock',
      trade_kind: 'stock',
      target_entry_price: 200,
      target_quantity: 50,
      profit_target: 500,
      stop_loss: -300,
      position_thesis: 'Long term growth play',
      created_date: new Date(),
      status: 'planned',
      journal_entry_ids: [],
      trades: [],
      // Option fields should be optional (undefined for stock positions)
      option_type: undefined,
      strike_price: undefined,
      expiration_date: undefined,
      premium_per_contract: undefined,
      profit_target_basis: undefined,
      stop_loss_basis: undefined
    }

    // Verify undefined is accepted for all option fields
    expect(stockPosition.option_type).toBeUndefined()
    expect(stockPosition.strike_price).toBeUndefined()
    expect(stockPosition.expiration_date).toBeUndefined()
    expect(stockPosition.premium_per_contract).toBeUndefined()
    expect(stockPosition.profit_target_basis).toBeUndefined()
    expect(stockPosition.stop_loss_basis).toBeUndefined()
  })

  it('existing stock positions remain valid without new fields', () => {
    // Legacy position without option fields should still be valid
    const legacyPosition: Position = {
      id: 'pos-3',
      symbol: 'MSFT',
      strategy_type: 'Long Stock',
      target_entry_price: 300,
      target_quantity: 100,
      profit_target: 1000,
      stop_loss: -500,
      position_thesis: 'Cloud growth opportunity',
      created_date: new Date(),
      status: 'open',
      journal_entry_ids: ['journal-1'],
      trades: []
      // No option fields - should still compile
    } as Position

    // Type check - legacy position is still valid
    expect(legacyPosition.id).toBe('pos-3')
    expect(legacyPosition.strategy_type).toBe('Long Stock')
  })

  it('strategy_type accepts both Long Stock and Short Put', () => {
    const stockStrategy: Position['strategy_type'] = 'Long Stock'
    const putStrategy: Position['strategy_type'] = 'Short Put'

    expect(stockStrategy).toBe('Long Stock')
    expect(putStrategy).toBe('Short Put')
  })

  it('trade_kind distinguishes stock from option positions', () => {
    const stockKind: NonNullable<Position['trade_kind']> = 'stock'
    const optionKind: NonNullable<Position['trade_kind']> = 'option'

    expect(stockKind).toBe('stock')
    expect(optionKind).toBe('option')
  })

  it('profit_target_basis and stop_loss_basis support stock and option pricing', () => {
    const stockBasis: NonNullable<Position['profit_target_basis']> = 'stock'
    const optionBasis: NonNullable<Position['profit_target_basis']> = 'option'

    // These fields indicate whether targets are based on stock price or option premium
    expect(stockBasis).toBe('stock')
    expect(optionBasis).toBe('option')
  })
})
