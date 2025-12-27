# Research: Short Put Strategy Support

**Feature**: 002-short-put-strategy
**Date**: 2025-12-27
**Status**: Complete

## Overview

This document consolidates research findings for implementing Short Put strategy support in the trading journal application. All technical decisions have been resolved to enable Phase 1 design.

---

## Decision 1: Position Interface Extension Strategy

**Decision**: Extend the existing `Position` interface with optional option-specific fields and expand `strategy_type` union type.

**Rationale**:
- Maintains backward compatibility - existing Long Stock positions without option fields continue to work
- Optional fields (`option_type`, `strike_price`, `expiration_date`, `premium_per_contract`) are only present when `strategy_type === 'Short Put'`
- TypeScript's discriminated union pattern enables type-safe conditional rendering
- Aligns with existing migration pattern in `PositionService.getById()` that adds missing fields

**Implementation**:
```typescript
export interface Position {
  id: string
  symbol: string
  strategy_type: 'Long Stock' | 'Short Put'  // Extended union type

  // Existing fields (immutable plan)
  target_entry_price: number
  target_quantity: number
  profit_target: number
  stop_loss: number
  position_thesis: string
  created_date: Date
  status: 'planned' | 'open' | 'closed'
  journal_entry_ids: string[]
  trades: Trade[]

  // New fields for price target basis (applies to all strategies)
  profit_target_basis?: 'stock_price' | 'option_price'
  stop_loss_basis?: 'stock_price' | 'option_price'

  // Option-specific fields (only present when strategy_type === 'Short Put')
  option_type?: 'put' | 'call'
  strike_price?: number
  expiration_date?: Date
  premium_per_contract?: number
}
```

**Alternatives Considered**:
- **Separate OptionPosition entity**: Rejected because it would duplicate Position logic and require complex UI polymorphism
- **Base Position class with subclasses**: Rejected because TypeScript doesn't support runtime type checking efficiently, and IndexedDB stores plain objects

---

## Decision 2: Trade Interface Extension for Options

**Decision**: Add optional option-specific fields to the `Trade` interface and introduce a new `action` field for option-specific trade types.

**Rationale**:
- `trade_type: 'buy' | 'sell'` remains sufficient for stock trades
- Option trades require additional context (STO, BTC, BTO, STC) which maps to buy/sell but carries semantic meaning
- `occ_symbol` serves as the unique instrument identifier for FIFO tracking
- Optional fields keep the interface backward compatible

**Implementation**:
```typescript
export interface Trade {
  id: string
  position_id: string
  trade_type: 'buy' | 'sell'
  quantity: number
  price: number
  timestamp: Date
  notes?: string
  underlying: string

  // Option-specific fields (present when trade_kind === 'option')
  action?: 'STO' | 'BTC' | 'BTO' | 'STC'  // Option action codes
  occ_symbol?: string                      // OCC format: "AAPL  250117P00105000"
  option_type?: 'call' | 'put'
  strike_price?: number
  expiration_date?: Date
  underlying_price_at_trade?: number       // Stock price at option execution time

  // Assignment linkage (when trade represents assignment)
  created_stock_position_id?: string       // Links to stock position from assignment
  cost_basis_adjustment?: number           // Premium received (audit trail)
}
```

**Alternatives Considered**:
- **Separate OptionTrade entity**: Rejected because it would break the unified FIFO calculation logic that depends on grouping trades by underlying/OCC symbol
- **trade_kind discriminator field**: Rejected because presence of `occ_symbol` is sufficient to distinguish option from stock trades

---

## Decision 3: OCC Symbol Derivation Algorithm

**Decision**: Implement a pure utility function that derives OCC symbols from option details following industry-standard format.

**Rationale**:
- OCC (Options Clearing Corporation) format is the industry standard for option contract identification
- Enables unique identification for FIFO tracking per contract
- Format is deterministic and can be computed from strike, expiration, type, and symbol

**Implementation**:
```typescript
/**
 * Derive OCC symbol from option contract details
 *
 * Format: SYMBOL + spaces to 6 chars + YYMMDD + type (P/C) + strike x 1000 with leading zeros
 * Example: "AAPL  250117P00105000" = AAPL $105 Put expiring Jan 17, 2025
 */
export function deriveOCCSymbol(
  symbol: string,
  expirationDate: Date,
  optionType: 'call' | 'put',
  strikePrice: number
): string {
  // 1. Pad symbol to 6 characters with trailing spaces
  const paddedSymbol = symbol.padEnd(6, ' ')

  // 2. Format expiration as YYMMDD
  const yy = expirationDate.getFullYear().toString().slice(-2)
  const mm = expirationDate.getMonth().toString().padStart(2, '0')
  const dd = expirationDate.getDate().toString().padStart(2, '0')
  const yymmdd = `${yy}${mm}${dd}`

  // 3. Option type code
  const typeCode = optionType === 'call' ? 'C' : 'P'

  // 4. Strike price x 1000 with leading zeros to 8 digits
  const strikeCents = Math.round(strikePrice * 1000)
  const strikeCode = strikeCents.toString().padStart(8, '0')

  return `${paddedSymbol}${yymmdd}${typeCode}${strikeCode}`
}
```

**Alternatives Considered**:
- **User-entered OCC symbols**: Rejected because it's error-prone and the format is computable from entered data
- **Custom symbol format**: Rejected because OCC is the industry standard and aligns with brokerage statements

---

## Decision 4: Price Storage Model for Multiple Instruments

**Decision**: Extend the existing `PriceHistory` model to support both stock symbols and OCC symbols as `underlying` values.

**Rationale**:
- Current `PriceHistory` interface already supports the concept of "underlying" as an instrument identifier
- The `underlying_date` compound unique index ensures one price per instrument per date
- No schema changes required - OCC symbols are just longer "underlying" values
- Maintains the shared pricing model: positions with the same underlying automatically share price data

**Implementation**:
- No interface changes to `PriceHistory`
- Price entry UI must detect when a position contains option trades and prompt for both stock and option prices
- PriceService already supports arbitrary underlying strings

**Storage Example**:
```
Stock price entry:   { underlying: "AAPL", date: "2025-01-15", close: 150.00, ... }
Option price entry:  { underlying: "AAPL  250117P00105000", date: "2025-01-15", close: 2.50, ... }
```

**Alternatives Considered**:
- **Separate OptionPriceHistory entity**: Rejected because it would duplicate schema and prevent unified pricing queries
- **Nested price structure in position**: Rejected because it would break the shared pricing model and duplicate data across positions

---

## Decision 5: Intrinsic/Extrinsic Value Calculation

**Decision**: Implement pure calculator functions in the domain layer for option valuation.

**Rationale**:
- Aligns with existing architecture pattern (calculators in `src/domain/calculators/`)
- Pure functions enable easy testing without database dependencies
- Calculations are deterministic and don't require UI state

**Implementation**:
```typescript
// src/domain/calculators/OptionValueCalculator.ts

/**
 * Calculate intrinsic value of a put option
 *
 * Intrinsic value = max(0, strike_price - stock_price)
 * Represents the "in-the-money" amount if exercised immediately.
 */
export function calculatePutIntrinsicValue(
  strikePrice: number,
  stockPrice: number
): number {
  return Math.max(0, strikePrice - stockPrice)
}

/**
 * Calculate extrinsic value of an option
 *
 * Extrinsic value = option_price - intrinsic_value
 * Represents time value + implied volatility (can be negative for deep ITM options).
 */
export function calculateExtrinsicValue(
  optionPrice: number,
  intrinsicValue: number
): number {
  return optionPrice - intrinsicValue
}
```

**Alternatives Considered**:
- **Component-level calculation**: Rejected because it breaks separation of concerns and makes testing harder
- **Service layer calculation**: Rejected because calculations are pure functions and don't need database access

---

## Decision 6: Database Schema Migration Strategy

**Decision**: Increment database version to 4 and implement a migration handler in `SchemaManager` that defaults existing positions to `strategy_type: 'Long Stock'`.

**Rationale**:
- Current database is at version 3
- IndexedDB requires version increment to trigger schema changes
- Existing positions lack `strategy_type` field and must be migrated
- Migration happens transparently during database open via `onupgradeneeded` event

**Implementation**:
```typescript
// src/services/SchemaManager.ts

export class SchemaManager {
  static readonly CURRENT_VERSION = 4  // Incremented from 3

  static initializeSchema(db: IDBDatabase, version: number): void {
    // ... existing store creation ...

    // Migration: Add strategy_type to existing positions (version 3 → 4)
    if (version === 4) {
      const transaction = db.transaction(['positions'], 'readwrite')
      const store = transaction.objectStore('positions')
      const request = store.openCursor()

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          const position = cursor.value
          // Default existing positions to Long Stock strategy
          if (!position.strategy_type) {
            position.strategy_type = 'Long Stock'
            cursor.update(position)
          }
          cursor.continue()
        }
      }
    }
  }
}
```

**Alternatives Considered**:
- **Lazy migration on read**: Rejected because it's inconsistent (some positions migrated, others not) and slower
- **Manual migration command**: Rejected because it requires user action and could be missed

---

## Decision 7: Assignment Stock Position Creation

**Decision**: When option assignment is recorded, create a new stock position programmatically with a derived cost basis, then prompt user for journal entry about the assignment.

**Rationale**:
- Assignment creates a new stock position that is distinct from the original option position
- Cost basis must be accurately tracked: strike_price - premium_received_per_share
- The new position should be fully populated with symbol, quantity, and entry price
- Journal entry captures the trader's reflection on assignment

**Implementation Flow**:
1. User records "assigned" outcome on short put position
2. System creates BTC trade at $0.00 for the option (closes option leg)
3. System creates new stock position:
   - `symbol`: same as option's underlying
   - `quantity`: contracts_assigned × 100 (contract multiplier)
   - `target_entry_price`: strike_price (for reference)
   - `trades`: [{ trade_type: 'buy', quantity: contracts × 100, price: strike_price, cost_basis_adjustment: -premium_received }]
4. User is prompted for journal entry with assignment-specific prompts
5. Original option position status updates to "closed" (or "open" if partial assignment)

**Cost Basis Tracking**:
- The `cost_basis_adjustment` field on the stock trade records the premium received
- Effective cost basis = strike_price - premium_received_per_share
- Example: Strike $100, received $3 premium → cost basis = $97/share

**Alternatives Considered**:
- **Modify existing position to become stock**: Rejected because it loses the option position history and breaks audit trail
- **Manual stock position creation by user**: Rejected because it's error-prone and the system can auto-populate correctly

---

## Decision 8: FIFO Tracking Per Instrument

**Decision**: Implement FIFO cost basis tracking separately for each unique instrument within a position (stock trades grouped by `underlying`, option trades grouped by `occ_symbol`).

**Rationale**:
- Current implementation tracks FIFO at the position level (all trades together)
- Short put positions may contain both stock trades (from assignment) and option trades
- Each instrument type must track FIFO independently to match brokerage statements
- OCC symbol uniquely identifies an option contract for grouping

**Implementation**:
```typescript
// src/domain/calculators/CostBasisCalculator.ts

/**
 * Group trades by instrument identifier
 *
 * Stock trades group by `underlying` (ticker symbol)
 * Option trades group by `occ_symbol` (OCC format symbol)
 */
export function groupTradesByInstrument(trades: Trade[]): Map<string, Trade[]> {
  const groups = new Map<string, Trade[]>()

  for (const trade of trades) {
    // Use occ_symbol for options, underlying for stock
    const key = trade.occ_symbol || trade.underlying
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(trade)
  }

  return groups
}

/**
 * Calculate FIFO P&L for a specific instrument
 *
 * Matches exit trades against oldest open trades of the same instrument.
 */
export function calculateInstrumentFIFO(
  instrumentTrades: Trade[]
): { realizedPnL: number; openQuantity: number } {
  // Sort by timestamp (oldest first)
  const sorted = [...instrumentTrades].sort((a, b) =>
    a.timestamp.getTime() - b.timestamp.getTime()
  )

  let openQuantity = 0
  let totalCost = 0
  let realizedPnL = 0
  const buyQueue: Array<{ quantity: number; price: number }> = []

  for (const trade of sorted) {
    if (trade.trade_type === 'buy') {
      // Add to buy queue
      buyQueue.push({ quantity: trade.quantity, price: trade.price })
      openQuantity += trade.quantity
      totalCost += trade.quantity * trade.price
    } else {
      // Match against oldest buys (FIFO)
      let remainingToSell = trade.quantity
      while (remainingToSell > 0 && buyQueue.length > 0) {
        const oldestBuy = buyQueue[0]
        const matchQuantity = Math.min(remainingToSell, oldestBuy.quantity)

        realizedPnL += (trade.price - oldestBuy.price) * matchQuantity
        openQuantity -= matchQuantity
        totalCost -= oldestBuy.price * matchQuantity

        oldestBuy.quantity -= matchQuantity
        if (oldestBuy.quantity <= 0) {
          buyQueue.shift()
        }

        remainingToSell -= matchQuantity
      }
    }
  }

  return { realizedPnL, openQuantity }
}
```

**Alternatives Considered**:
- **Position-level FIFO (current)**: Rejected because it mixes stock and option trades together, producing incorrect cost basis
-**Separate position for assignment stock**: Rejected because it creates unnecessary UI complexity

---

## Decision 9: Journal Entry Type Extension

**Decision**: Add `'option_assignment'` to the `entry_type` union in `JournalEntry` interface and define assignment-specific prompts.

**Rationale**:
- Current journal system supports `'position_plan'` and `'trade_execution'` types
- Assignment is a distinct event that warrants its own journal prompts
- The prompts guide traders to reflect on the assignment outcome and their plan for the new stock position

**Implementation**:
```typescript
// src/types/journal.ts

export interface JournalEntry {
  id: string
  position_id?: string
  trade_id?: string
  entry_type: 'position_plan' | 'trade_execution' | 'option_assignment'  // Extended
  fields: JournalField[]
  created_at: string
  executed_at?: string
}

export const JOURNAL_PROMPTS = {
  // ... existing prompts ...

  option_assignment: [
    {
      name: 'assignment_cause',
      prompt: 'What happened that led to assignment?',
      required: true
    },
    {
      name: 'feelings_about_stock',
      prompt: 'How do you feel about now owning this stock?',
      required: false
    },
    {
      name: 'stock_plan',
      prompt: "What's your plan for the stock position?",
      required: false
    }
  ]
} as const
```

**Alternatives Considered**:
- **Reuse `trade_execution` type**: Rejected because assignment is semantically different and warrants unique prompts
- **No journal for assignment**: Rejected because it violates the behavioral training principle of mandatory reflection

---

## Decision 10: UI Component Strategy for Option Fields

**Decision**: Extend existing form components with conditional rendering based on `strategy_type` and create new option-specific input components.

**Rationale**:
- Existing `PositionPlanForm` and `AddTradeForm` components can be extended rather than replaced
- Conditional rendering keeps the forms clean for Long Stock users while showing option fields when needed
- New reusable components (strike picker, expiration date picker) can be used across different forms

**Component Structure**:
```
src/components/forms/
├── PositionPlanForm.tsx          # Extended with strategy selector
├── AddTradeForm.tsx              # Extended with option action selector
├── strategy/                     # New subdirectory for strategy-specific inputs
│   ├── StrikePriceInput.tsx      # Strike picker with common strikes
│   ├── ExpirationDatePicker.tsx  # Date picker with validation
│   └── OptionTypeSelector.tsx    # PUT/CALL selector (future: covered calls)
```

**Alternatives Considered**:
- **Separate OptionPositionPlanForm**: Rejected because it duplicates logic and creates maintenance burden
- **Dynamic form generation**: Rejected because it's over-engineering for just two strategy types

---

## Summary of Technical Decisions

| Area | Decision | Key Files Changed |
|------|----------|-------------------|
| **Position Interface** | Extend with optional option fields, expand strategy_type union | `src/lib/position.ts` |
| **Trade Interface** | Add option-specific fields (action, occ_symbol, etc.) | `src/lib/position.ts` |
| **OCC Symbol Derivation** | Pure utility function in domain layer | `src/domain/lib/optionUtils.ts` (new) |
| **Price Storage** | Reuse existing PriceHistory with OCC symbols | No changes needed |
| **Intrinsic/Extrinsic** | Pure calculator functions | `src/domain/calculators/OptionValueCalculator.ts` (new) |
| **Database Migration** | Version 4 with strategy_type defaulting | `src/services/SchemaManager.ts` |
| **Assignment Handling** | Programmatic stock position creation | `src/services/TradeService.ts` |
| **FIFO Per Instrument** | Group by occ_symbol/underlying | `src/domain/calculators/CostBasisCalculator.ts` |
| **Journal Prompts** | Add option_assignment type | `src/types/journal.ts` |
| **UI Components** | Conditional rendering, new input components | `src/components/forms/` |

All technical decisions have been resolved. Proceeding to Phase 1: Design & Contracts.
