# Data Model: Short Put Strategy Support

**Feature**: 002-short-put-strategy
**Date**: 2025-12-27
**Database Version**: 4 (incremented from 3)

## Overview

This document describes the data model changes required to support Short Put option strategies. The design maintains backward compatibility with existing Long Stock positions while enabling future option strategy expansion.

---

## Entity Changes

### Position Entity

**Purpose**: Represents an immutable trading plan containing strategic intent (targets, stops, thesis) and executed trades.

**Changes**: Extended with optional option-specific fields and expanded `strategy_type` union.

```typescript
export interface Position {
  // === Core Identity ===
  id: string                          // UUID
  symbol: string                      // Underlying stock ticker (e.g., "AAPL")
  strategy_type: 'Long Stock' | 'Short Put'  // Extended for option strategies

  // === Immutable Plan Fields ===
  target_entry_price: number          // Target price (basis determined by *_basis fields)
  target_quantity: number             // Planned quantity (shares for stock, contracts for options)
  profit_target: number               // Profit target price level
  stop_loss: number                   // Stop loss price level
  position_thesis: string             // Required journal entry documenting rationale
  created_date: Date                  // Position creation timestamp

  // === Price Target Basis (NEW) ===
  profit_target_basis?: 'stock_price' | 'option_price'  // What determines profit target
  stop_loss_basis?: 'stock_price' | 'option_price'      // What determines stop loss

  // === Option-Specific Plan Fields (NEW) ===
  option_type?: 'put' | 'call'       // Contract type (only present when strategy_type !== 'Long Stock')
  strike_price?: number               // Strike price (e.g., 100 for $100 strike)
  expiration_date?: Date              // Expiration date
  premium_per_contract?: number       // Expected/target premium per contract

  // === Derived State ===
  status: 'planned' | 'open' | 'closed'  // Computed from net trade quantity
  journal_entry_ids: string[]         // Linked journal entry IDs
  trades: Trade[]                     // Embedded trade array
}
```

**Validation Rules**:
- `option_type`, `strike_price`, `expiration_date`, `premium_per_contract` are **required** when `strategy_type === 'Short Put'`
- `profit_target_basis` and `stop_loss_basis` are **required** when `strategy_type === 'Short Put'`
- `expiration_date` must be in the future when creating a Short Put position
- `strike_price` must be > 0
- `premium_per_contract` must be >= 0 (can be 0 for planning purposes)

**Migration** (v3 → v4):
- Existing positions without `strategy_type` default to `'Long Stock'`
- New optional fields are added via migration handler in `SchemaManager`

---

### Trade Entity

**Purpose**: Individual execution record within a position. Can represent stock transactions or option contract transactions.

**Changes**: Added option-specific fields for contract identification and assignment tracking.

```typescript
export interface Trade {
  // === Core Identity ===
  id: string                          // UUID
  position_id: string                 // Parent position ID
  trade_type: 'buy' | 'sell'          // Direction (applies to both stock and options)
  quantity: number                    // Quantity (shares for stock, contracts for options)
  price: number                       // Per-share (stock) or per-contract (options) price
  timestamp: Date                     // Execution timestamp
  notes?: string                      // Optional trade notes
  underlying: string                  // Instrument ID (ticker for stock, OCC for options)

  // === Option-Specific Fields (NEW) ===
  action?: 'STO' | 'BTC' | 'BTO' | 'STC'  // Option action code (maps to buy/sell)
  occ_symbol?: string                 // OCC format: "AAPL  250117P00105000"
  option_type?: 'call' | 'put'        // Contract type
  strike_price?: number               // Strike price
  expiration_date?: Date              // Expiration date
  underlying_price_at_trade?: number  // Stock price at option execution (FR-027)

  // === Assignment Linkage (NEW) ===
  created_stock_position_id?: string  // Links to stock position created by assignment
  cost_basis_adjustment?: number      // Premium received (audit trail)
}
```

**Field Semantics**:

| Field | Description | Example |
|-------|-------------|---------|
| `action` | Option-specific action code | `'STO'` for Sell-to-Open (short put), `'BTC'` for Buy-to-Close |
| `occ_symbol` | OCC format derived from symbol+date+type+strike | `"AAPL  250117P00105000"` |
| `underlying_price_at_trade` | Stock price at option execution (for historical reference) | `148.50` when selling $145 put |
| `created_stock_position_id` | ID of stock position created via assignment | Links option assignment to resulting stock |
| `cost_basis_adjustment` | Premium received (stored for audit trail) | `-3.00` per share when sold put for $3 |

**Validation Rules**:
- `occ_symbol` is **required** when `option_type` is present
- `action` is **required** when `option_type` is present
- `option_type`, `strike_price`, `expiration_date` must match the parent position's option fields (FR-052, FR-053)
- `underlying_price_at_trade` should be captured for all option trades (FR-027)
- Option prices can be >= 0 (worthless exits allowed per FR-055)

---

### PriceHistory Entity

**Purpose**: Market pricing data stored by instrument and date, shared across all positions using that instrument.

**Changes**: No interface changes. The existing `underlying` field now accepts both stock tickers and OCC symbols.

```typescript
export interface PriceHistory {
  id: string
  underlying: string                  // Stock ticker OR OCC symbol
  date: string                        // YYYY-MM-DD format
  open: number                        // Opening price
  high: number                        // High price
  low: number                         // Low price
  close: number                       // Closing price (used for P&L calculations)
  updated_at: Date                    // Last update timestamp
}
```

**Storage Pattern**:
```
Stock price:    { underlying: "AAPL", date: "2025-01-15", close: 150.00 }
Option price:   { underlying: "AAPL  250117P00105000", date: "2025-01-15", close: 2.50 }
```

**Index**: `underlying_date` compound unique index ensures one price per instrument per date.

---

### JournalEntry Entity

**Purpose**: Structured journal entries for behavioral training and reflection at key decision points.

**Changes**: Extended `entry_type` union to include option assignment.

```typescript
export interface JournalEntry {
  id: string
  position_id?: string                // Link to position (optional for general entries)
  trade_id?: string                   // Link to specific trade (optional)
  entry_type: 'position_plan' | 'trade_execution' | 'option_assignment'  // Extended
  fields: JournalField[]              // Structured prompt/response pairs
  created_at: string                  // ISO timestamp
  executed_at?: string                // Optional execution timestamp
}

export interface JournalField {
  name: string                        // Field identifier
  prompt: string                      // Question displayed to user
  response: string                    // User's response
  required?: boolean                  // Whether field is mandatory
}
```

**New Journal Prompts** (option_assignment):
```typescript
export const OPTION_ASSIGNMENT_PROMPTS = [
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
```

---

## State Transitions

### Position Status State Machine

```
                    ┌──────────────────────────────────────┐
                    │                                      │
                    ▼                                      │
┌──────────┐   Add trade   ┌──────┐   Sell all   ┌──────────┐
│ Planned  │ ─────────────► │ Open  │ ───────────► │  Closed  │
└──────────┘  (net_qty > 0) └──────┘  (net_qty = 0) └──────────┘
```

**Status Rules**:
- `planned`: No trades yet OR net quantity = 0 with no history
- `open`: net quantity > 0 (has open position)
- `closed`: net quantity = 0 with at least one trade

**Computed by**: `PositionStatusCalculator.computeStatus(trades: Trade[])`

### Option Trade Action Flow (Short Put)

```
┌────────────┐
│   Plan     │  (position created, no trades)
└─────┬──────┘
      │
      │  Sell-to-Open (STO)
      ▼
┌────────────┐
│   Open     │  (short put obligation established)
└─────┬──────┘
      │
      ├─────────────────┐
      │                 │
      ▼                 ▼
┌────────────┐   ┌────────────┐
│ Buy-to-    │   │ Expired/   │
│ Close (BTC)│   │ Assigned   │
└────────────┘   └─────┬──────┘
                      │
                      ▼
                ┌────────────┐
                │  Closed    │
                └────────────┘
```

**Exit Outcomes**:
1. **Buy-to-Close**: Trader buys back the option before expiration (realized P&L = premium received - premium paid)
2. **Expired Worthless**: Option expires OTM, full premium kept as profit (recorded as BTC at $0.00)
3. **Assigned**: Option expires ITM, stock position created (BTC at $0.00 + new stock position)

---

## Relationships

### Position → Trade (One-to-Many)

```
Position (1) ──────► Trade (N)
     │                     │
     │ contains            │ belongs to
     │                     │
     ▼                     ▼
   trades[]          position_id
```

**FIFO Grouping**: Trades within a position are grouped by instrument identifier for cost basis:
- Stock trades: group by `underlying` (ticker symbol)
- Option trades: group by `occ_symbol` (OCC symbol)

### Position → JournalEntry (One-to-Many)

```
Position (1) ──────► JournalEntry (N)
     │                     │
     │ has                 │ references
     │                     │
     ▼                     ▼
journal_entry_ids[]   position_id
```

### Trade → JournalEntry (One-to-One, Optional)

```
Trade (1) ──────► JournalEntry (0..1)
     │                     │
     │ documented by       │ references
     │                     │
     ▼                     ▼
   (implicit)          trade_id
```

### Trade → Position (Assignment Linkage)

```
Trade (assignment) ──────► Position (stock)
        │                         │
        │ created                 │ generated from
        │                         │
        ▼                         ▼
created_stock_position_id   (new position)
```

### PriceHistory → Position (Many-to-Many, Shared)

```
PriceHistory (1) ──────────────────► Position (N)
        │                                 │
        │ used by                         │ requires
        │                                 │
        ▼                                 ▼
   underlying == symbol      OR   underlying == occ_symbol
```

**Sharing Behavior**: One price entry serves all positions with the same underlying:
- Stock price entry for "AAPL" serves all AAPL positions
- Option price entry for "AAPL  250117P00105000" serves all positions with that contract

---

## IndexedDB Schema Changes

### Version 4 Schema

**Object Stores**:

| Store Name | Key Path | Indexes |
|------------|----------|---------|
| `positions` | `id` | `symbol`, `status`, `created_date` |
| `journal_entries` | `id` | `position_id`, `trade_id`, `entry_type`, `created_at` |
| `price_history` | `id` | `underlying`, `date`, `underlying_date` (compound unique), `updated_at` |

**Migration Handler** (v3 → v4):
```typescript
// src/services/SchemaManager.ts

static initializeSchema(db: IDBDatabase, version: number): void {
  // ... existing store creation ...

  // Migration: Add strategy_type to existing positions
  if (version === 4) {
    const transaction = db.transaction(['positions'], 'readwrite')
    const store = transaction.objectStore('positions')
    const request = store.openCursor()

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result
      if (cursor) {
        const position = cursor.value
        if (!position.strategy_type) {
          position.strategy_type = 'Long Stock'
          cursor.update(position)
        }
        cursor.continue()
      }
    }
  }
}
```

---

## Calculations

### FIFO Cost Basis Per Instrument

**Algorithm**:
1. Group trades by instrument identifier (`occ_symbol` for options, `underlying` for stock)
2. Sort each group by timestamp (oldest first)
3. For each sell trade, match against oldest buy trades (FIFO)
4. Track realized P&L per instrument

**Pseudo-code**:
```
function calculateInstrumentFIFO(trades: Trade[]): { realizedPnL, openQuantity } {
  buyQueue = []
  openQuantity = 0
  realizedPnL = 0

  for trade in trades.sort_by_timestamp:
    if trade.type == BUY:
      buyQueue.push({ quantity: trade.quantity, price: trade.price })
      openQuantity += trade.quantity
    else:  // SELL
      remaining = trade.quantity
      while remaining > 0 and buyQueue.length > 0:
        oldestBuy = buyQueue[0]
        matchQty = min(remaining, oldestBuy.quantity)
        realizedPnL += (trade.price - oldestBuy.price) * matchQty
        openQuantity -= matchQty
        oldestBuy.quantity -= matchQty
        if oldestBuy.quantity == 0:
          buyQueue.shift()
        remaining -= matchQty

  return { realizedPnL, openQuantity }
}
```

### Position P&L Calculation

**For Short Put Position**:
```
unrealizedPnL = (premium_received - current_option_price) × contracts × 100
realizedPnL = sum of all closed contract P&L (from FIFO)
```

**Example**:
- Sell 3 contracts at $3.00 premium = $900 credit
- Current option price = $1.50
- Unrealized P&L = ($3.00 - $1.50) × 3 × 100 = $450 profit

### Intrinsic/Extrinsic Value Calculation

```
intrinsic_value = max(0, strike_price - stock_price)  // for puts
extrinsic_value = option_price - intrinsic_value
```

**Example** (Short Put):
- Strike = $100, Stock price = $95, Option price = $6.00
- Intrinsic = $100 - $95 = $5.00
- Extrinsic = $6.00 - $5.00 = $1.00 (time value)

### Assignment Cost Basis

```
stock_cost_basis_per_share = strike_price - premium_received_per_share
total_cost_basis = stock_cost_basis_per_share × contracts × 100
```

**Example**:
- Strike = $100, Premium received = $3.00
- Cost basis = $100 - $3.00 = $97.00 per share
- For 5 contracts: 500 shares × $97.00 = $48,500 total cost basis

---

## Validation Rules Summary

### Position Validation

| Rule | Description | Priority |
|------|-------------|----------|
| STRATEGY_TYPE_REQUIRED | `strategy_type` must be `'Long Stock'` or `'Short Put'` | P1 |
| OPTION_FIELDS_REQUIRED_FOR_SHORT_PUT | When `strategy_type === 'Short Put'`, option fields must be present | P1 |
| EXPIRATION_FUTURE | `expiration_date` must be > current date when creating position | P1 |
| STRIKE_POSITIVE | `strike_price` must be > 0 | P1 |
| PREMIUM_NON_NEGATIVE | `premium_per_contract` must be >= 0 | P2 |
| TARGET_BASIS_REQUIRED | `profit_target_basis` and `stop_loss_basis` required for Short Put | P1 |

### Trade Validation

| Rule | Description | Priority |
|------|-------------|----------|
| CONTRACT_DETAILS_MATCH | Trade `strike_price`, `expiration_date`, `option_type` must match position | P1 |
| CLOSING_QUANTITY_VALID | Exit quantity must not exceed open quantity for that instrument | P1 |
| OPTION_PRICE_NON_NEGATIVE | Option `price` must be >= 0 (worthless allowed) | P1 |
| STOCK_PRICE_POSITIVE | Stock `price` must be > 0 | P1 |
| STO_BEFORE_EXPIRATION | Sell-to-open trades only allowed before expiration_date | P2 |
| OUTCOME_AFTER_EXPIRATION | "expired" and "assigned" outcomes only allowed on/after expiration_date | P2 |

---

## Future Extensibility

The data model is designed to support future option strategies without breaking changes:

### Covered Calls (Next Phase)

**No schema changes required**:
- `strategy_type: 'Covered Call'` added to union
- Same Position interface with `option_type: 'call'`
- Position contains both stock trades (long shares) and option trades (short call)

### Multi-Leg Spreads (Future)

**No schema changes required**:
- Single position with multiple option trades having different `occ_symbol` values
- FIFO tracking per `occ_symbol` handles each leg independently
- Examples: iron condor (4 legs), butterfly (3 strikes), calendar spread (different expirations)

### Strategy Deviation Tracking (Future)

**Extension point**: `StrategyDeviation` entity already defined in spec.md
```typescript
interface StrategyDeviation {
  id: string
  trade_id: string
  position_id: string
  deviation_type: 'symbol_mismatch' | 'strategy_change' | 'unplanned_trade'
  description: string
  confirmed_at: Date
  trader_notes?: string
}
```

---

## Data Integrity Constraints

### IndexedDB Constraints

1. **Unique price per instrument per date**: `underlying_date` compound index prevents duplicate price entries
2. **Foreign key integrity**: Application-level validation ensures `position_id` and `trade_id` references exist

### Application-Level Constraints

1. **Position immutability**: Once created, position plan fields cannot be modified (only trades can be added)
2. **Trade immutability**: Once recorded, trades cannot be deleted or modified
3. **FIFO validation**: Exit trades validated against remaining open quantity per instrument
4. **Expiration validation**: Trade outcomes validated against expiration date constraints
