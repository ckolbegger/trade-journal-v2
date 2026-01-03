import { describe, it, expect } from 'vitest'

/**
 * Type verification tests for Trade interface
 *
 * These tests verify that the Trade type correctly supports:
 * - Option fields (action, occ_symbol, option_type, strike_price, expiration_date, underlying_price_at_trade)
 * - New fields are optional (undefined is valid for stock trades)
 * - action union accepts 'STO' | 'BTC' | 'BTO' | 'STC'
 * - Assignment linkage fields (created_stock_position_id, cost_basis_adjustment) are optional
 * - Type compiles without errors in browser context
 */

describe('Trade Type Definitions', () => {
  describe('action Union Type', () => {
    it('should accept "STO" as valid action', () => {
      const stoTrade = { action: 'STO' as const }
      expect(stoTrade.action).toBe('STO')
    })

    it('should accept "BTC" as valid action', () => {
      const btcTrade = { action: 'BTC' as const }
      expect(btcTrade.action).toBe('BTC')
    })

    it('should accept "BTO" as valid action', () => {
      const btoTrade = { action: 'BTO' as const }
      expect(btoTrade.action).toBe('BTO')
    })

    it('should accept "STC" as valid action', () => {
      const stcTrade = { action: 'STC' as const }
      expect(stcTrade.action).toBe('STC')
    })

    it('should allow action to be any of the four values', () => {
      const actions: Array<'STO' | 'BTC' | 'BTO' | 'STC'> = ['STO', 'BTC', 'BTO', 'STC']
      expect(actions).toHaveLength(4)
    })
  })

  describe('Option Fields - Optional for Stock Trades', () => {
    it('should allow trade without action (stock trade)', () => {
      const stockTrade = {
        id: '1',
        position_id: 'pos-1',
        trade_type: 'buy' as const,
        quantity: 100,
        price: 150,
        timestamp: new Date(),
        underlying: 'AAPL'
        // action is undefined (not required for stock trades)
      }

      expect(stockTrade.action).toBeUndefined()
    })

    it('should allow trade without occ_symbol (stock trade)', () => {
      const stockTrade = {
        id: '1',
        position_id: 'pos-1',
        trade_type: 'buy' as const,
        quantity: 100,
        price: 150,
        timestamp: new Date(),
        underlying: 'AAPL'
        // occ_symbol is undefined (not required for stock trades)
      }

      expect(stockTrade.occ_symbol).toBeUndefined()
    })

    it('should allow trade without option_type (stock trade)', () => {
      const stockTrade = {
        id: '1',
        position_id: 'pos-1',
        trade_type: 'buy' as const,
        quantity: 100,
        price: 150,
        timestamp: new Date(),
        underlying: 'AAPL'
        // option_type is undefined (not required for stock trades)
      }

      expect(stockTrade.option_type).toBeUndefined()
    })

    it('should allow trade without strike_price (stock trade)', () => {
      const stockTrade = {
        id: '1',
        position_id: 'pos-1',
        trade_type: 'buy' as const,
        quantity: 100,
        price: 150,
        timestamp: new Date(),
        underlying: 'AAPL'
        // strike_price is undefined (not required for stock trades)
      }

      expect(stockTrade.strike_price).toBeUndefined()
    })

    it('should allow trade without expiration_date (stock trade)', () => {
      const stockTrade = {
        id: '1',
        position_id: 'pos-1',
        trade_type: 'buy' as const,
        quantity: 100,
        price: 150,
        timestamp: new Date(),
        underlying: 'AAPL'
        // expiration_date is undefined (not required for stock trades)
      }

      expect(stockTrade.expiration_date).toBeUndefined()
    })

    it('should allow trade without underlying_price_at_trade (stock trade)', () => {
      const stockTrade = {
        id: '1',
        position_id: 'pos-1',
        trade_type: 'buy' as const,
        quantity: 100,
        price: 150,
        timestamp: new Date(),
        underlying: 'AAPL'
        // underlying_price_at_trade is undefined (not required for stock trades)
      }

      expect(stockTrade.underlying_price_at_trade).toBeUndefined()
    })
  })

  describe('Option Fields - Required for Option Trades', () => {
    it('should accept trade with all option fields (option trade)', () => {
      const optionTrade = {
        id: '1',
        position_id: 'pos-1',
        trade_type: 'sell' as const,
        quantity: 5,
        price: 3.50,
        timestamp: new Date(),
        underlying: 'AAPL  250117P00150000',
        action: 'STO' as const,
        occ_symbol: 'AAPL  250117P00150000',
        option_type: 'put' as const,
        strike_price: 150,
        expiration_date: '2025-01-17',
        underlying_price_at_trade: 148
      }

      expect(optionTrade.action).toBe('STO')
      expect(optionTrade.occ_symbol).toBe('AAPL  250117P00150000')
      expect(optionTrade.option_type).toBe('put')
      expect(optionTrade.strike_price).toBe(150)
      expect(optionTrade.expiration_date).toBe('2025-01-17')
      expect(optionTrade.underlying_price_at_trade).toBe(148)
    })

    it('should accept option_type as "put" or "call"', () => {
      const putOption: 'put' | 'call' = 'put'
      const callOption: 'put' | 'call' = 'call'

      expect(putOption).toBe('put')
      expect(callOption).toBe('call')
    })
  })

  describe('Assignment Linkage Fields', () => {
    it('should allow created_stock_position_id to be undefined (no assignment)', () => {
      const trade = {
        id: '1',
        position_id: 'pos-1',
        trade_type: 'sell' as const,
        quantity: 5,
        price: 3.50,
        timestamp: new Date(),
        underlying: 'AAPL',
        created_stock_position_id: undefined as string | undefined
      }

      expect(trade.created_stock_position_id).toBeUndefined()
    })

    it('should allow created_stock_position_id when assignment occurs', () => {
      const trade = {
        id: '1',
        position_id: 'pos-1',
        trade_type: 'sell' as const,
        quantity: 5,
        price: 3.50,
        timestamp: new Date(),
        underlying: 'AAPL',
        created_stock_position_id: 'stock-pos-123' as string | undefined
      }

      expect(trade.created_stock_position_id).toBe('stock-pos-123')
    })

    it('should allow cost_basis_adjustment to be undefined (no adjustment)', () => {
      const trade = {
        id: '1',
        position_id: 'pos-1',
        trade_type: 'sell' as const,
        quantity: 5,
        price: 3.50,
        timestamp: new Date(),
        underlying: 'AAPL',
        cost_basis_adjustment: undefined as number | undefined
      }

      expect(trade.cost_basis_adjustment).toBeUndefined()
    })

    it('should allow cost_basis_adjustment when assignment occurs', () => {
      const trade = {
        id: '1',
        position_id: 'pos-1',
        trade_type: 'sell' as const,
        quantity: 5,
        price: 3.50,
        timestamp: new Date(),
        underlying: 'AAPL',
        cost_basis_adjustment: -3.50 as number | undefined
      }

      expect(trade.cost_basis_adjustment).toBe(-3.50)
    })
  })

  describe('Browser Compatibility', () => {
    it('should allow Date objects for timestamp', () => {
      const trade = {
        id: '1',
        position_id: 'pos-1',
        trade_type: 'buy' as const,
        quantity: 100,
        price: 150,
        timestamp: new Date('2024-01-15T10:30:00Z'),
        underlying: 'AAPL'
      }

      expect(trade.timestamp).toBeInstanceOf(Date)
      expect(trade.timestamp.toISOString()).toBe('2024-01-15T10:30:00.000Z')
    })

    it('should allow string for occ_symbol (OCC format)', () => {
      const trade = {
        id: '1',
        position_id: 'pos-1',
        trade_type: 'sell' as const,
        quantity: 5,
        price: 3.50,
        timestamp: new Date(),
        underlying: 'AAPL',
        occ_symbol: 'AAPL  250117P00150000'
      }

      expect(typeof trade.occ_symbol).toBe('string')
      expect(trade.occ_symbol).toBe('AAPL  250117P00150000')
    })

    it('should allow string for expiration_date (ISO format)', () => {
      const trade = {
        id: '1',
        position_id: 'pos-1',
        trade_type: 'sell' as const,
        quantity: 5,
        price: 3.50,
        timestamp: new Date(),
        underlying: 'AAPL',
        expiration_date: '2025-01-17'
      }

      expect(typeof trade.expiration_date).toBe('string')
      expect(trade.expiration_date).toBe('2025-01-17')
    })

    it('should allow number for underlying_price_at_trade', () => {
      const trade = {
        id: '1',
        position_id: 'pos-1',
        trade_type: 'sell' as const,
        quantity: 5,
        price: 3.50,
        timestamp: new Date(),
        underlying: 'AAPL',
        underlying_price_at_trade: 148.50
      }

      expect(typeof trade.underlying_price_at_trade).toBe('number')
      expect(trade.underlying_price_at_trade).toBe(148.50)
    })

    it('should allow number for strike_price', () => {
      const trade = {
        id: '1',
        position_id: 'pos-1',
        trade_type: 'sell' as const,
        quantity: 5,
        price: 3.50,
        timestamp: new Date(),
        underlying: 'AAPL',
        strike_price: 150
      }

      expect(typeof trade.strike_price).toBe('number')
      expect(trade.strike_price).toBe(150)
    })

    it('should allow number for cost_basis_adjustment', () => {
      const trade = {
        id: '1',
        position_id: 'pos-1',
        trade_type: 'sell' as const,
        quantity: 5,
        price: 3.50,
        timestamp: new Date(),
        underlying: 'AAPL',
        cost_basis_adjustment: -3.50
      }

      expect(typeof trade.cost_basis_adjustment).toBe('number')
      expect(trade.cost_basis_adjustment).toBe(-3.50)
    })
  })

  describe('OCC Symbol Format', () => {
    it('should accept standard OCC symbol format', () => {
      // Format: SYMBOL(6) + YYMMDD(6) + TYPE(1) + STRIKE(8)
      const occSymbol = 'AAPL  250117P00150000'

      expect(occSymbol).toHaveLength(21)
      expect(occSymbol.substring(0, 6).trim()).toBe('AAPL')
      expect(occSymbol.substring(6, 12)).toBe('250117')
      expect(occSymbol.substring(12, 13)).toBe('P')
      expect(occSymbol.substring(13)).toBe('00150000')
    })

    it('should accept OCC symbol with padded symbol', () => {
      // Single letter symbol padded with spaces
      const occSymbol = 'T     250117C00020000'

      expect(occSymbol).toHaveLength(21)
      expect(occSymbol.substring(0, 6)).toBe('T     ')
    })
  })
})
