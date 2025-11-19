# Data Model: Position Closing via Trade Execution

**Feature**: 001-close-position
**Date**: 2025-11-09
**Status**: Complete

## Overview

This document defines the data model extensions required for position closing via exit trade execution. The model extends existing Position and Trade interfaces while maintaining backward compatibility.

## Entity Definitions

### Position (EXTENDED)

The Position entity represents the immutable trade plan (strategy intent). Status is derived from trade activity.

```typescript
interface Position {
  // Existing fields (unchanged)
  id: string
  symbol: string
  strategy_type: 'Long Stock'
  target_entry_price: number
  target_quantity: number
  profit_target: number
  stop_loss: number
  position_thesis: string
  created_date: Date
  journal_entry_ids: string[]
  trades: Trade[]

  // EXTENDED: Add 'closed' status
  status: 'planned' | 'open' | 'closed'
}
```

**Status Transitions** (derived, not user-editable):
- `planned`: No trades yet (initial state)
- `open`: Has trades with net quantity > 0
- `closed`: Net quantity === 0 (terminal state)

**Validation Rules**:
- All existing validations remain (target_entry_price > 0, target_quantity > 0, etc.)
- Status is computed, never set directly by user
- Once 'closed', position cannot transition back to 'open'

**Relationships**:
- One-to-many with Trade (embedded array)
- One-to-many with JournalEntry (via journal_entry_ids)

### Trade (NO CHANGES NEEDED)

The Trade entity represents individual execution records. Already supports both buy and sell types.

```typescript
interface Trade {
  id: string
  position_id: string
  trade_type: 'buy' | 'sell'  // sell = exit trade
  quantity: number
  price: number
  timestamp: Date
  notes?: string
  underlying: string  // Instrument identifier (symbol or option contract)
}
```

**No schema changes required** - existing interface already supports exit trades.

**Validation Rules for Exit Trades** (NEW):
```typescript
// Price validation (FR-015)
- price >= 0 (allow $0 for expired options, prevent negative)

// Quantity validation (FR-011)
- quantity > 0
- quantity <= currentOpenQuantity(position)
  where currentOpenQuantity = sum(buy quantities) - sum(sell quantities)

// Type validation
- trade_type === 'sell' for exit trades

// Position state validation
- Cannot add exit trade to position with status 'planned'
- Must have at least one entry trade first
```

**FIFO Matching** (computed, not stored):
- Exit trades matched against oldest entry trades by timestamp
- Matching happens during P&L calculation, not persisted
- See FIFOResult interface below

### JournalEntry (NO CHANGES NEEDED)

Journal entries link to trades via trade_id. Existing schema supports exit trade journaling.

```typescript
interface JournalEntry {
  id: string
  position_id?: string
  trade_id?: string  // Links to exit trade
  entry_type: 'POSITION_PLAN' | 'TRADE_EXECUTION' | 'DAILY_REVIEW'
  content: string
  created_at: Date
  updated_at?: Date
}
```

**Usage for Exit Trades**:
- `entry_type`: 'TRADE_EXECUTION' (existing type)
- `trade_id`: References exit trade.id
- `content`: Trader's reflection on exit decision

**Querying Unjournaled Trades**:
```typescript
// Find all trades without linked journal entry
SELECT trades
WHERE NOT EXISTS (
  SELECT 1 FROM journal_entries
  WHERE journal_entries.trade_id = trades.id
)
```

## Computed Types (NEW)

These interfaces define computed values, not persisted entities.

### FIFOResult

Result of FIFO cost basis calculation for a position.

```typescript
interface FIFOResult {
  // Per-trade P&L breakdown
  tradePnL: TradePnL[]

  // Aggregate P&L
  realizedPnL: number      // Total from all exits
  unrealizedPnL: number    // From remaining open quantity
  totalPnL: number         // realized + unrealized

  // Position state
  openQuantity: number     // Remaining after all exits
  avgOpenCost: number      // Weighted average cost of open quantity
  isFullyClosed: boolean   // openQuantity === 0
}

interface TradePnL {
  tradeId: string          // Which trade this P&L is from
  pnl: number              // Realized P&L for this trade
  matchedQuantity: number  // How much of this trade was matched
}
```

**Calculation Method**:
1. Sort all trades by timestamp (ascending)
2. Process each sell trade:
   - Match against oldest unmatched buy trades
   - Calculate P&L: (sell_price - buy_price) * matched_quantity
   - Track matched quantities
3. Sum P&L from all sell trades = realizedPnL
4. Calculate unrealizedPnL from remaining open quantity

### PlanVsExecution (NEW)

Comparison metrics displayed when position closes.

```typescript
interface PlanVsExecution {
  // Entry comparison
  targetEntryPrice: number      // From Position.target_entry_price
  actualAvgEntryCost: number    // Weighted average from buy trades
  entryPriceDelta: number        // actual - target
  entryPriceDeltaPct: number     // (delta / target) * 100

  // Exit comparison
  targetExitPrice: number        // From Position.profit_target
  actualAvgExitPrice: number     // Weighted average from sell trades
  exitPriceDelta: number
  exitPriceDeltaPct: number

  // Overall performance
  targetProfit: number           // (profit_target - target_entry) * target_qty
  actualProfit: number           // realizedPnL from FIFO calculation
  profitDelta: number            // actual - target
  profitDeltaPct: number         // (delta / target) * 100

  // Execution quality
  entryExecutionQuality: 'better' | 'worse' | 'onTarget'  // Based on delta
  exitExecutionQuality: 'better' | 'worse' | 'onTarget'
}
```

**Display Trigger**: Position status transitions to 'closed'

**Calculation**:
```typescript
function calculatePlanVsExecution(position: Position, fifoResult: FIFOResult): PlanVsExecution {
  const buyTrades = position.trades.filter(t => t.trade_type === 'buy')
  const sellTrades = position.trades.filter(t => t.trade_type === 'sell')

  const actualAvgEntryCost = buyTrades.reduce((sum, t) => sum + (t.price * t.quantity), 0) /
                              buyTrades.reduce((sum, t) => sum + t.quantity, 0)

  const actualAvgExitPrice = sellTrades.reduce((sum, t) => sum + (t.price * t.quantity), 0) /
                              sellTrades.reduce((sum, t) => sum + t.quantity, 0)

  const entryDelta = actualAvgEntryCost - position.target_entry_price
  const exitDelta = actualAvgExitPrice - position.profit_target

  const targetProfit = (position.profit_target - position.target_entry_price) * position.target_quantity
  const actualProfit = fifoResult.realizedPnL

  return {
    targetEntryPrice: position.target_entry_price,
    actualAvgEntryCost,
    entryPriceDelta: entryDelta,
    entryPriceDeltaPct: (entryDelta / position.target_entry_price) * 100,

    targetExitPrice: position.profit_target,
    actualAvgExitPrice,
    exitPriceDelta: exitDelta,
    exitPriceDeltaPct: (exitDelta / position.profit_target) * 100,

    targetProfit,
    actualProfit,
    profitDelta: actualProfit - targetProfit,
    profitDeltaPct: ((actualProfit - targetProfit) / targetProfit) * 100,

    entryExecutionQuality: Math.abs(entryDelta) < 0.01 ? 'onTarget' :
                           entryDelta < 0 ? 'better' : 'worse',
    exitExecutionQuality: Math.abs(exitDelta) < 0.01 ? 'onTarget' :
                          exitDelta > 0 ? 'better' : 'worse'
  }
}
```

### ValidationError (NEW)

Structured error for trade validation failures.

```typescript
interface ValidationError {
  field: 'price' | 'quantity' | 'trade_type' | 'position_state'
  message: string
  currentValue?: any
  expectedConstraint?: string
  suggestedAction?: string
}
```

**Example Usage**:
```typescript
// Overselling validation
throw new ValidationError({
  field: 'quantity',
  message: `Cannot sell ${quantity} shares`,
  currentValue: quantity,
  expectedConstraint: `<= ${currentOpenQty} (current open quantity)`,
  suggestedAction: 'To reverse position, close this position first, then create new position in opposite direction.'
})

// Negative price validation
throw new ValidationError({
  field: 'price',
  message: 'Price cannot be negative',
  currentValue: price,
  expectedConstraint: '>= 0',
  suggestedAction: 'Enter $0 for worthless/expired positions, or positive price.'
})
```

## Index Requirements

### IndexedDB Indexes (NO CHANGES NEEDED)

Existing indexes support exit trade queries:

```typescript
// positions store
- Primary key: id
- Index: symbol (for lookups by ticker)
- Index: status (for filtering open/closed positions)
- Index: created_date (for chronological sorting)

// journal_entries store
- Primary key: id
- Index: position_id (for position journals)
- Index: trade_id (for trade journals - supports exit trades)
- Index: entry_type (for filtering by type)
- Index: created_at (for chronological sorting)
```

**Query Patterns**:
```typescript
// Get all unjournaled trades (entry or exit)
getAllTrades().filter(trade =>
  !journalEntries.some(journal => journal.trade_id === trade.id)
)

// Get all open positions (includes positions with partial exits)
positions.where('status').equals('open')

// Get all closed positions
positions.where('status').equals('closed')

// Get position trade history (includes all entry and exit trades)
position.trades.sort((a, b) => a.timestamp - b.timestamp)
```

## State Diagrams

### Position Status Lifecycle

```
┌─────────┐
│ planned │  Initial state (no trades yet)
└────┬────┘
     │
     │ addTrade(type='buy', quantity > 0)
     ▼
  ┌──────┐
  │ open │  Has trades, net quantity > 0
  └──┬───┘
     │
     │ addTrade(type='sell', netQty becomes 0)
     ▼
┌─────────┐
│ closed  │  Terminal state (net quantity === 0)
└─────────┘
```

**Transitions**:
- `planned → open`: First buy trade added
- `open → closed`: Exit trades reduce net quantity to exactly 0
- `closed → *`: No transitions (immutable terminal state)

**Edge Cases**:
- Cannot add sell trade to 'planned' position (must have entry first)
- Cannot add trades that would make net quantity negative
- Position remains 'open' if net quantity > 0 after partial exits

### Trade FIFO Matching Flow

```
Entry Trades (sorted by timestamp):
┌─────┐  ┌─────┐  ┌─────┐
│ E1  │  │ E2  │  │ E3  │  (E1 oldest, E3 newest)
│ 100 │  │ 50  │  │ 75  │
│ @$50│  │ @$52│  │ @$48│
└─────┘  └─────┘  └─────┘

Exit Trade: Sell 120 shares @ $55
     │
     ├──► Match E1 (100 shares)
     │    P&L: ($55 - $50) * 100 = +$500
     │
     └──► Match E2 (20 of 50 shares)
          P&L: ($55 - $52) * 20 = +$60
          Remaining in E2: 30 shares still open

Total Realized P&L: $500 + $60 = $560
Remaining Open: 30 shares @ $52 + 75 shares @ $48
```

## Data Validation Matrix

| Field | Entry Trade | Exit Trade | Validation |
|-------|------------|------------|------------|
| trade_type | 'buy' | 'sell' | Must be 'sell' for exits |
| quantity | > 0 | > 0, <= openQty | Prevent overselling |
| price | > 0 | >= 0 | Allow $0 for expired, prevent negative |
| timestamp | Any | Any | Used for FIFO ordering |
| position.status | open | open | Cannot exit from 'planned' |
| net quantity | >= 0 | >= 0 | Never negative |

## Migration Impact

**Database Migration**: None required
- Position.status already uses union type (can add 'closed')
- Trade interface already supports 'buy' | 'sell'
- JournalEntry.trade_id already exists

**Data Compatibility**:
- Existing positions remain valid (status stays 'planned' or 'open')
- Existing entry trades unchanged
- No data transformation needed

**Rollback Safety**:
- New 'closed' status treated as 'open' by older code (safe degradation)
- Sell trades ignored by older code (position appears unclosed but data intact)

## Summary

Data model extensions complete:
- ✅ Position.status extended with 'closed' state
- ✅ Trade interface requires no changes (already supports sell type)
- ✅ JournalEntry requires no changes (already supports trade linking)
- ✅ Computed types defined for FIFO and plan vs execution
- ✅ Validation rules specified for exit trades
- ✅ State diagrams document lifecycle
- ✅ No database migration required
- ✅ Backward compatible with existing data

Ready for Phase 1: Contracts generation.
