# Data Model: Short Put Strategy Support

**Feature**: 002-short-put-strategy
**Date**: 2025-12-27
**Status**: Complete

## Overview

This document defines schema additions and validation rules to support short put positions, option trades, shared price storage, and assignment handling while preserving existing long stock functionality.

## Entity Definitions

### Position (EXTENDED)

Represents the immutable plan. Option strategy fields are captured at creation and never mutated; status derives from trade activity.

```typescript
interface Position {
  id: string
  symbol: string
  strategy_type: 'Long Stock' | 'Short Put'
  trade_kind: 'stock' | 'option'

  // Plan fields (immutable)
  target_entry_price: number
  target_quantity: number
  profit_target: number
  stop_loss: number
  profit_target_basis: 'stock_price' | 'option_price'
  stop_loss_basis: 'stock_price' | 'option_price'
  position_thesis: string
  created_date: Date

  // Option plan fields (trade_kind === 'option')
  option_type?: 'call' | 'put'
  strike_price?: number
  expiration_date?: Date
  premium_per_contract?: number

  // Derived state
  status: 'planned' | 'open' | 'closed'
  trades: Trade[]
  journal_entry_ids: string[]
}
```

**Validation Rules**:
- `target_entry_price`, `target_quantity`, `profit_target`, `stop_loss` > 0
- `profit_target_basis` and `stop_loss_basis` required
- For `trade_kind === 'option'`, require `option_type`, `strike_price`, `expiration_date`
- Position plan is immutable once saved (FR-003)

**State Transitions** (derived):
- `planned` → `open` when first trade is added
- `open` → `closed` when net quantity reaches 0 (FR-013)

**Relationships**:
- One-to-many with Trade (embedded array)
- One-to-many with JournalEntry via `journal_entry_ids`

### Trade (EXTENDED)

Represents execution records for both stock and option instruments. Option trades include action codes and OCC symbol.

```typescript
interface Trade {
  id: string
  position_id: string
  trade_kind: 'stock' | 'option'
  trade_type: 'buy' | 'sell'
  action?: 'STO' | 'BTC' | 'BTO' | 'STC'
  quantity: number
  price: number
  timestamp: Date
  notes?: string
  underlying: string

  // Option-specific fields
  occ_symbol?: string
  option_type?: 'call' | 'put'
  strike_price?: number
  expiration_date?: Date
  contract_quantity?: number
  underlying_price_at_trade?: number

  // Assignment linkage
  created_stock_position_id?: string
  cost_basis_adjustment?: number
}
```

**Validation Rules**:
- `price >= 0` for option trades (FR-055)
- `price > 0` for stock trades (FR-056)
- Closing trades must match strike/expiration of open position (FR-008, FR-052, FR-053)
- `quantity > 0` and `quantity <= remaining_open_contracts` (FR-021)
- STO allowed only before expiration; BTC/assignment allowed on/after expiration (FR-024, FR-025)
- `underlying_price_at_trade` required for option trades (FR-027)

**FIFO Matching**:
- FIFO applied per instrument: stock symbol or OCC symbol (FR-020)

### PriceEntry (EXTENDED)

Stores shared pricing by instrument and date. Used for valuation and intrinsic/extrinsic calculations.

```typescript
interface PriceEntry {
  id: string
  instrument_id: string // Stock symbol or OCC symbol
  date: Date
  close_price: number
  updated_at?: Date
}
```

**Validation Rules**:
- `close_price > 0` for stock instruments
- `close_price >= 0` for option instruments
- One entry per instrument per date (FR-029, FR-030)

### JournalEntry (EXTENDED)

Adds a new entry type for assignments while retaining existing plan/trade workflows.

```typescript
interface JournalEntry {
  id: string
  position_id?: string
  trade_id?: string
  entry_type: 'POSITION_PLAN' | 'TRADE_EXECUTION' | 'DAILY_REVIEW' | 'OPTION_ASSIGNMENT'
  content: string
  created_at: Date
  updated_at?: Date
}
```

### AssignmentEvent (NEW)

Tracks assignment outcomes and links the option position to the resulting stock position.

```typescript
interface AssignmentEvent {
  id: string
  option_position_id: string
  stock_position_id: string
  assignment_date: Date
  contracts_assigned: number
  strike_price: number
  premium_received_per_share: number
  resulting_cost_basis: number
}
```

## Migration Notes

- IndexedDB version increments from 3 → 4 to introduce `strategy_type`, `trade_kind`, option fields, and instrument-based price storage (FR-057).
- Existing positions default `strategy_type` to `Long Stock` and `trade_kind` to `stock` (FR-058).
- New fields are optional on legacy data to prevent data loss (FR-059).
