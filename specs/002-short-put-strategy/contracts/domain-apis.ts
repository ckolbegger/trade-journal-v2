# Domain Layer API Contracts

**Feature**: 002-short-put-strategy
**Date**: 2025-12-27

## Overview

This document defines the internal API contracts for domain layer functions. These are pure functions that encapsulate business logic for option strategy support.

---

## Option Value Calculator

**Module**: `src/domain/calculators/OptionValueCalculator.ts`

### `calculatePutIntrinsicValue`

Calculate the intrinsic value of a put option.

```typescript
/**
 * Calculate intrinsic value of a put option
 *
 * Intrinsic value = max(0, strike_price - stock_price)
 * Represents the "in-the-money" amount if exercised immediately.
 *
 * @param strikePrice - Option strike price
 * @param stockPrice - Current stock price
 * @returns Intrinsic value per share (always >= 0)
 *
 * @example
 * calculatePutIntrinsicValue(100, 95)  // Returns: 5.00
 * calculatePutIntrinsicValue(100, 105) // Returns: 0.00 (OTM)
 */
export function calculatePutIntrinsicValue(
  strikePrice: number,
  stockPrice: number
): number
```

**Preconditions**:
- `strikePrice > 0`
- `stockPrice > 0`

**Postconditions**:
- Returns value >= 0

---

### `calculateExtrinsicValue`

Calculate the extrinsic (time) value of an option.

```typescript
/**
 * Calculate extrinsic value of an option
 *
 * Extrinsic value = option_price - intrinsic_value
 * Represents time value + implied volatility.
 * Can be negative for deep ITM options in early expiration cycles.
 *
 * @param optionPrice - Current option price
 * @param intrinsicValue - Pre-calculated intrinsic value
 * @returns Extrinsic value (can be negative)
 *
 * @example
 * calculateExtrinsicValue(6.00, 5.00)  // Returns: 1.00
 * calculateExtrinsicValue(8.00, 5.00)  // Returns: 3.00
 */
export function calculateExtrinsicValue(
  optionPrice: number,
  intrinsicValue: number
): number
```

**Preconditions**:
- `optionPrice >= 0`
- `intrinsicValue >= 0`

**Postconditions**:
- Returns any number (can be negative)

---

## Option Utilities

**Module**: `src/domain/lib/optionUtils.ts`

### `deriveOCCSymbol`

Derive OCC symbol from option contract details.

```typescript
/**
 * Derive OCC symbol from option contract details
 *
 * Format: SYMBOL (padded to 6) + YYMMDD + type (P/C) + strike x 1000 (8 digits)
 * Example: "AAPL  250117P00105000" = AAPL $105 Put expiring Jan 17, 2025
 *
 * @param symbol - Underlying stock ticker
 * @param expirationDate - Option expiration date
 * @param optionType - 'call' or 'put'
 * @param strikePrice - Strike price
 * @returns OCC symbol string
 *
 * @example
 * deriveOCCSymbol('AAPL', new Date('2025-01-17'), 'put', 105)
 * // Returns: "AAPL  250117P00105000"
 *
 * @throws Error if symbol is empty or strike is invalid
 */
export function deriveOCCSymbol(
  symbol: string,
  expirationDate: Date,
  optionType: 'call' | 'put',
  strikePrice: number
): string
```

**Preconditions**:
- `symbol.length > 0` and `symbol.length <= 6`
- `strikePrice > 0`
- `expirationDate` is a valid Date

**Postconditions**:
- Returns 21-character string in OCC format

---

### `parseOCCSymbol`

Parse OCC symbol back into option components.

```typescript
/**
 * Parse OCC symbol into option components
 *
 * Inverse operation of deriveOCCSymbol.
 *
 * @param occSymbol - OCC format symbol
 * @returns Parsed option components
 *
 * @example
 * parseOCCSymbol("AAPL  250117P00105000")
 * // Returns: {
 * //   symbol: "AAPL",
 * //   expirationDate: new Date("2025-01-17"),
 * //   optionType: "put",
 * //   strikePrice: 105
 * // }
 *
 * @throws Error if OCC symbol format is invalid
 */
export function parseOCCSymbol(
  occSymbol: string
): {
  symbol: string
  expirationDate: Date
  optionType: 'call' | 'put'
  strikePrice: number
}
```

**Preconditions**:
- `occSymbol` is valid 21-character OCC format

**Postconditions**:
- Returns object with all components populated

---

## Cost Basis Calculator (Extended)

**Module**: `src/domain/calculators/CostBasisCalculator.ts`

### `groupTradesByInstrument`

Group trades by instrument identifier for FIFO calculation.

```typescript
/**
 * Group trades by instrument identifier
 *
 * Stock trades group by underlying (ticker symbol)
 * Option trades group by occ_symbol (OCC format symbol)
 *
 * @param trades - All trades in a position
 * @returns Map of instrument identifier to array of trades
 *
 * @example
 * const trades = [
 *   { trade_type: 'buy', underlying: 'AAPL', quantity: 100, ... },
 *   { trade_type: 'sell', underlying: 'AAPL', quantity: 50, ... },
 *   { trade_type: 'sell', occ_symbol: 'AAPL  250117P00105000', quantity: 1, ... }
 * ]
 * groupTradesByInstrument(trades)
 * // Returns: Map {
 * //   "AAPL" => [stock buy, stock sell],
 * //   "AAPL  250117P00105000" => [option sell]
 * // }
 */
export function groupTradesByInstrument(
  trades: Trade[]
): Map<string, Trade[]>
```

**Preconditions**:
- `trades` is a valid array (can be empty)

**Postconditions**:
- Returns Map where each key is an instrument identifier
- Each trade appears exactly once in the groups

---

### `calculateInstrumentFIFO`

Calculate FIFO P&L for a specific instrument.

```typescript
/**
 * Calculate FIFO P&L for a specific instrument
 *
 * Matches exit trades against oldest open trades (first-in-first-out).
 * Separately tracks cost basis for each instrument (stock vs each option contract).
 *
 * @param instrumentTrades - All trades for a single instrument
 * @returns FIFO calculation results
 *
 * @example
 * const trades = [
 *   { trade_type: 'buy', quantity: 100, price: 50, timestamp: t1 },
 *   { trade_type: 'buy', quantity: 50, price: 55, timestamp: t2 },
 *   { trade_type: 'sell', quantity: 75, price: 60, timestamp: t3 }
 * ]
 * calculateInstrumentFIFO(trades)
 * // Returns: {
 * //   realizedPnL: 625,  // (60-50)*50 + (60-55)*25
 * //   openQuantity: 75   // 100+50-75
 * // }
 */
export function calculateInstrumentFIFO(
  instrumentTrades: Trade[]
): {
  realizedPnL: number
  openQuantity: number
}
```

**Preconditions**:
- All trades in array have the same instrument identifier (same `underlying` or `occ_symbol`)
- Trades are sorted by timestamp (function will sort internally)

**Postconditions**:
- `realizedPnL` is sum of all closed trade P&L
- `openQuantity` is net remaining position (>= 0)

---

## Position Validator (Extended)

**Module**: `src/domain/validators/PositionValidator.ts`

### `validateOptionPosition`

Validate option-specific position fields.

```typescript
/**
 * Validate option position fields
 *
 * Ensures all option-specific fields are present and valid
 * when strategy_type requires options.
 *
 * @param position - Position to validate
 * @throws ValidationError with descriptive message
 *
 * @example
 * validateOptionPosition({
 *   strategy_type: 'Short Put',
 *   option_type: 'put',
 *   strike_price: 100,
 *   expiration_date: new Date('2025-12-31'),
 *   ...
 * }) // Passes
 *
 * @example
 * validateOptionPosition({
 *   strategy_type: 'Short Put',
 *   // missing option_type
 *   ...
 * }) // Throws ValidationError
 */
export function validateOptionPosition(position: Position): void
```

**Validation Rules**:
1. When `strategy_type === 'Short Put'`:
   - `option_type` must be `'put'`
   - `strike_price` must be present and > 0
   - `expiration_date` must be present and in the future (for new positions)
   - `profit_target_basis` must be present
   - `stop_loss_basis` must be present

---

## Trade Validator (Extended)

**Module**: `src/domain/validators/TradeValidator.ts`

### `validateOptionTrade`

Validate option-specific trade fields.

```typescript
/**
 * Validate option trade fields
 *
 * Ensures option trades match position contract details
 * and follow option trading rules.
 *
 * @param trade - Trade to validate
 * @param position - Parent position (for contract matching)
 * @throws ValidationError with descriptive message
 *
 * @example
 * validateOptionTrade(
 *   { action: 'STO', strike_price: 100, ... },
 *   { strike_price: 100, ... }
 * ) // Passes
 *
 * @example
 * validateOptionTrade(
 *   { action: 'STO', strike_price: 105, ... },  // Mismatch!
 *   { strike_price: 100, ... }
 * ) // Throws ValidationError
 */
export function validateOptionTrade(trade: Trade, position: Position): void
```

**Validation Rules**:
1. `strike_price` must match `position.strike_price`
2. `expiration_date` must match `position.expiration_date`
3. `option_type` must match `position.option_type`
4. `action` must be valid option action (STO, BTC, BTO, STC)
5. STO trades only allowed before `expiration_date`
6. "expired" and "assigned" outcomes only allowed on/after `expiration_date`

---

### `validateClosingTrade`

Validate that a closing trade doesn't exceed open quantity.

```typescript
/**
 * Validate closing trade quantity
 *
 * Ensures exit quantity doesn't exceed remaining open quantity
 * for the specific instrument.
 *
 * @param position - Position being closed
 * @param trade - Trade being added (should be closing trade)
 * @throws ValidationError with descriptive message
 *
 * @example
 * // Position has 3 open contracts
 * validateClosingTrade(position, { action: 'BTC', quantity: 2, ... })
 * // Passes
 *
 * validateClosingTrade(position, { action: 'BTC', quantity: 5, ... })
 * // Throws: "Exit quantity (5) exceeds open quantity (3)"
 */
export function validateClosingTrade(position: Position, trade: Trade): void
```

**Validation Rules**:
1. Trade quantity must not exceed open quantity for the instrument
2. Open quantity calculated per instrument (stock vs each OCC symbol)

---

## Assignment Handler

**Module**: `src/domain/lib/assignmentHandler.ts`

### `createAssignmentStockPosition`

Create a stock position from option assignment.

```typescript
/**
 * Create a stock position from option assignment
 *
 * Generates a new Long Stock position with cost basis derived from
 * strike price minus premium received.
 *
 * @param optionPosition - Original short put position
 * @param assignmentTrade - BTC trade at $0 representing assignment
 * @param contractsAssigned - Number of contracts assigned
 * @returns New stock position object (not yet saved to DB)
 *
 * @example
 * createAssignmentStockPosition(
 *   { symbol: 'AAPL', strike_price: 100, ... },
 *   { price: 0, quantity: 5, ... },
 *   5
 * )
 * // Returns: {
 * //   symbol: 'AAPL',
 * //   strategy_type: 'Long Stock',
 * //   target_quantity: 500,  // 5 contracts x 100 shares
 * //   target_entry_price: 100,
 * //   trades: [{
 * //     trade_type: 'buy',
 * //     quantity: 500,
 * //     price: 100,
 * //     cost_basis_adjustment: -3.00,  // Premium received per share
 * //     ...
 * //   }],
 * //   ...
 * // }
 */
export function createAssignmentStockPosition(
  optionPosition: Position,
  assignmentTrade: Trade,
  contractsAssigned: number
): Position
```

**Preconditions**:
- `optionPosition.strategy_type === 'Short Put'`
- `contractsAssigned > 0`
- `contractsAssigned <= open quantity of option position`

**Postconditions**:
- Returns a Position object with `strategy_type: 'Long Stock'`
- `target_quantity = contractsAssigned × 100`
- First trade has `cost_basis_adjustment = -premium_received_per_share`

---

### `calculateAssignmentCostBasis`

Calculate effective cost basis for assigned stock.

```typescript
/**
 * Calculate cost basis for stock acquired via assignment
 *
 * cost_basis_per_share = strike_price - premium_received_per_share
 *
 * @param strikePrice - Option strike price
 * @param premiumReceivedPerContract - Premium received per contract
 * @returns Cost basis per share
 *
 * @example
 * calculateAssignmentCostBasis(100, 300)
 * // Returns: 97  // ($100 strike - $3 premium)
 */
export function calculateAssignmentCostBasis(
  strikePrice: number,
  premiumReceivedPerContract: number
): number
```

**Preconditions**:
- `strikePrice > 0`
- `premiumReceivedPerContract >= 0`

**Postconditions**:
- Returns cost basis per share (can be less than strike, zero, or negative)

---

## Short Put P&L Calculator

**Module**: `src/domain/calculators/ShortPutPnLCalculator.ts`

### `calculateShortPutUnrealizedPnL`

Calculate unrealized P&L for an open short put position.

```typescript
/**
 * Calculate unrealized P&L for short put position
 *
 * unrealized_pnl = (premium_received - current_option_price) × contracts × 100
 *
 * @param position - Short put position with trades
 * @param currentOptionPrice - Current option market price
 * @returns Unrealized P&L in dollars
 *
 * @example
 * // Sold 3 contracts at $3.00, current price $1.50
 * calculateShortPutUnrealizedPnL(position, 1.50)
 * // Returns: 450  // ($3.00 - $1.50) × 3 × 100
 */
export function calculateShortPutUnrealizedPnL(
  position: Position,
  currentOptionPrice: number
): number
```

**Preconditions**:
- `position.strategy_type === 'Short Put'`
- `position.status === 'open'`
- `currentOptionPrice >= 0`

**Postconditions**:
- Returns P&L in dollars (positive = profit, negative = loss)

---

### `calculateShortPutRealizedPnL`

Calculate realized P&L for closed short put contracts.

```typescript
/**
 * Calculate realized P&L for closed short put contracts
 *
 * Uses FIFO per-instrument cost basis tracking.
 * Realized P&L = sum of (sell_price - buy_price) × quantity for all closed contracts.
 *
 * @param position - Short put position with trades
 * @returns Realized P&L in dollars
 *
 * @example
 * // Sold 3 contracts at $3.00, bought back 2 at $1.00
 * calculateShortPutRealizedPnL(position)
 * // Returns: 400  // ($3.00 - $1.00) × 2 × 100
 */
export function calculateShortPutRealizedPnL(
  position: Position
): number
```

**Preconditions**:
- `position.strategy_type === 'Short Put'`

**Postconditions**:
- Returns total realized P&L from all closed contracts

---

## Error Types

### `ValidationError`

Domain-specific validation error.

```typescript
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}
```

**Usage**:
```typescript
if (strikePrice <= 0) {
  throw new ValidationError('Strike price must be greater than 0')
}
```

---

## Type Exports

All domain modules export their types for use by services and components:

```typescript
// src/domain/calculators/OptionValueCalculator.ts
export type { IntrinsicValueResult, ExtrinsicValueResult }

// src/domain/lib/optionUtils.ts
export type { OCCComponents }

// src/domain/calculators/CostBasisCalculator.ts
export type { FIFOResult, InstrumentGroup }

// src/domain/lib/assignmentHandler.ts
export type { AssignmentPositionResult }
```
