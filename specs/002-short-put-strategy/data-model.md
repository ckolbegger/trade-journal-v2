# Data Model: Short Put Strategy Support

**Feature**: 002-short-put-strategy | **Date**: 2025-12-27
**Based On**: Feature specification and research findings

## Entity Overview

```mermaid
erDiagram
    Position ||--o{ Trade : contains
    Trade ||--o{ JournalEntry : requires
    PriceEntry ||--o{ Position : references
    PriceEntry ||--o{ Trade : references

    Position {
        string id
        string symbol
        string strategy_type
        string trade_kind
        number target_entry_price
        number target_quantity
        number profit_target
        number stop_loss
        string profit_target_basis
        string stop_loss_basis
        string position_thesis
        date created_date
        string option_type
        number strike_price
        date expiration_date
        number premium_per_contract
        string status
    }

    Trade {
        string id
        string position_id
        string trade_kind
        string trade_type
        string action
        number quantity
        number price
        date timestamp
        string notes
        string underlying
        string occ_symbol
        string option_type
        number strike_price
        date expiration_date
        number contract_quantity
        number underlying_price_at_trade
        string created_stock_position_id
        number cost_basis_adjustment
    }

    PriceEntry {
        string id
        string instrument_id
        date date
        number close_price
    }

    JournalEntry {
        string id
        string position_id
        string trade_id
        string entry_type
        string content
        date created_at
    }
}
```

## Entity Definitions

### Position

An immutable trading plan representing strategic intent. Contains planned price levels, required journal entry documenting thesis, and a list of executed trades. Status is derived from net trade quantity.

```typescript
interface Position {
  // Primary key and identification
  id: string                           // UUID primary key
  symbol: string                       // Underlying stock symbol (e.g., "AAPL")

  // Strategy classification
  strategy_type: 'Long Stock' | 'Short Put' | 'Covered Call' | 'Custom'
  trade_kind: 'stock' | 'option' | 'hybrid'

  // Plan fields (immutable after creation)
  target_entry_price: number           // Target entry price
  target_quantity: number              // Planned quantity
  profit_target: number                // Profit target price
  stop_loss: number                    // Stop loss price
  profit_target_basis: 'stock_price' | 'option_price'
  stop_loss_basis: 'stock_price' | 'option_price'
  position_thesis: string              // Required journal entry content
  created_date: Date                   // Position creation timestamp

  // Option plan fields (when trade_kind !== 'stock')
  option_type?: 'call' | 'put'
  strike_price?: number                // Strike price (e.g., 105.00)
  expiration_date?: Date               // Option expiration date
  premium_per_contract?: number        // Expected premium per contract

  // Derived state
  status: 'planned' | 'open' | 'closed'
  trades: Trade[]                      // Embedded trades (loaded separately)
  journal_entry_ids: string[]          // Reference to journal entries
}
```

**Validation Rules**:
- `symbol`: Required, 1-5 uppercase letters
- `strategy_type`: Required, valid strategy enum
- `trade_kind`: Required, valid trade kind enum
- `target_entry_price`: Required, > 0
- `target_quantity`: Required, > 0
- `profit_target`: Optional, > 0 if provided
- `stop_loss`: Optional, > 0 if provided
- `position_thesis`: Required, non-empty string (minimum 10 characters)
- `option_type`: Required if trade_kind !== 'stock'
- `strike_price`: Required if trade_kind !== 'stock', > 0
- `expiration_date`: Required if trade_kind !== 'stock', must be future date

**State Transitions**:
```
planned → open    (when first trade added with non-zero quantity)
open    → closed  (when net quantity reaches zero)
planned → closed  (not possible - must go through open)
```

### Trade

An individual execution record within a position. Can represent stock or option transactions. Each trade maintains its own cost basis for FIFO P&L calculation.

```typescript
interface Trade {
  // Primary key and relationships
  id: string                    // UUID primary key
  position_id: string           // Foreign key to Position

  // Trade classification
  trade_kind: 'stock' | 'option'
  trade_type: 'buy' | 'sell'
  action?: 'STO' | 'BTC' | 'BTO' | 'STC'  // Option-specific action codes

  // Execution details
  quantity: number              // Number of shares/contracts
  price: number                 // Per share (stock) or per contract (options)
  timestamp: Date               // Trade execution time
  notes?: string                // Optional trade notes

  // Common fields
  underlying: string            // Ticker symbol (e.g., "AAPL")

  // Option-specific fields (present when trade_kind === 'option')
  occ_symbol?: string           // Auto-derived: "AAPL  250117P00105000"
  option_type?: 'call' | 'put'
  strike_price?: number
  expiration_date?: Date
  contract_quantity?: number    // Defaults to 1 (100 shares per contract)
  underlying_price_at_trade?: number  // Stock price at time of option trade

  // Assignment linkage (when trade represents assignment)
  created_stock_position_id?: string   // Links to stock position
  cost_basis_adjustment?: number       // Premium received, stored for audit
}
```

**Trade Kind Discriminator**: Presence of `occ_symbol` indicates option trade.

**Action Codes**:
- `STO` (Sell to Open): Creates new short option position
- `BTC` (Buy to Close): Closes existing short option position
- `BTO` (Buy to Open): Creates new long option position
- `STC` (Sell to Close): Closes existing long option position

**Validation Rules**:
- `position_id`: Required, must reference existing Position
- `trade_kind`: Required, valid enum
- `trade_type`: Required, valid enum
- `quantity`: Required, > 0
- `price`: Required, >= 0 (options can be worthless)
- For option trades:
  - `occ_symbol`: Auto-generated from other fields
  - `strike_price`: Must match position strike_price
  - `expiration_date`: Must match position expiration_date

### PriceEntry

Market pricing data stored by instrument and date. Shared across all positions using that instrument.

```typescript
interface PriceEntry {
  id: string                    // UUID primary key
  instrument_id: string         // Stock: "AAPL", Option: "AAPL  250117P00105000"
  date: Date                    // Price date (not timestamp - one entry per day)
  close_price: number           // Closing price for the day
}
```

**Instrument Identification**:
- **Stocks**: `instrument_id` = ticker symbol (e.g., `"AAPL"`)
- **Options**: `instrument_id` = OCC symbol (e.g., `"AAPL  250117P00105000"`)

**Sharing Behavior**:
- Enter AAPL price once → available to ALL positions with AAPL exposure
- System checks for existing prices before prompting (prevents duplicates)
- Positions display staleness warnings when required prices missing

**Validation Rules**:
- `instrument_id`: Required, valid format
- `date`: Required, valid date
- `close_price`: Required, > 0 for stocks, >= 0 for options
- Unique constraint: (instrument_id, date) - one price per instrument per day

### JournalEntry

Required documentation for position plans and trade executions. Supports behavioral training through reflection.

```typescript
interface JournalEntry {
  id: string              // UUID primary key
  position_id: string     // Foreign key to Position (required)
  trade_id?: string       // Foreign key to Trade (optional - plan entries have no trade)
  entry_type: 'position_plan' | 'trade_execution' | 'option_assignment' | 'daily_review'
  content: string         // Journal entry content
  created_at: Date        // Entry creation timestamp
}
```

**Journal Prompts by Type**:

| Entry Type | Prompts |
|------------|---------|
| `position_plan` | "What's your thesis for this trade?" |
| `trade_execution` | "What led you to execute this trade?" |
| `option_assignment` | "What happened that led to assignment?", "How do you feel about now owning this stock?", "What's your plan for the stock position?" |
| `daily_review` | "What went well today?", "What could improve?" |

## OCC Symbol Generation

**Format**: `SYMBOL YYMMDDTPPPPPPPP`
- 6-char symbol (padded with spaces)
- 6-char date (YYMMDD)
- 1-char type (P for put, C for call)
- 8-char strike (leading zeros, no decimal)

**Example**:
```
Symbol: AAPL
Date: 2025-01-17 → 250117
Type: Put → P
Strike: 105.00 → 00105000

Result: "AAPL  250117P00105000"
```

**Implementation**:
```typescript
function generateOCCSymbol(
  symbol: string,
  expirationDate: Date,
  optionType: 'call' | 'put',
  strikePrice: number
): string {
  const dateStr = formatDate(expirationDate, 'yyMMdd')
  const typeChar = optionType === 'put' ? 'P' : 'C'
  const strikeStr = strikePrice.toFixed(5).replace('.', '').padStart(8, '0')
  const paddedSymbol = symbol.padEnd(6)

  return `${paddedSymbol}${dateStr}${typeChar}${strikeStr}`
}
```

## P&L Calculations

### Stock P&L (Existing)

```typescript
function calculateStockPnL(buyPrice: number, sellPrice: number, quantity: number): number {
  return (sellPrice - buyPrice) * quantity
}
```

### Option P&L (New)

```typescript
interface OptionPnLResult {
  unrealized: number           // Current P&L if closed at current option price
  realized: number             // P&L from closed contracts
  intrinsic: number            // Intrinsic value component
  extrinsic: number            // Time value component
  total: number                // unrealized + realized
}

function calculateOptionPnL(
  trades: Trade[],
  currentOptionPrice: number,
  currentStockPrice: number,
  strikePrice: number
): OptionPnLResult {
  // FIFO matching by OCC symbol
  const openTrades = trades.filter(t => t.action === 'STO' || t.action === 'BTO')
  const closeTrades = trades.filter(t => t.action === 'BTC' || t.action === 'STC')

  // Match closes to opens using FIFO
  let realized = 0
  let remainingOpen = [...openTrades]

  for (const close of closeTrades) {
    let quantityToClose = close.contract_quantity || close.quantity

    while (quantityToClose > 0 && remainingOpen.length > 0) {
      const open = remainingOpen[0]
      const matched = Math.min(quantityToClose, open.contract_quantity || open.quantity)

      // Calculate realized P&L for matched portion
      const openValue = (open.action === 'STO' ? 1 : -1) * matched * open.price
      const closeValue = (close.action === 'BTC' ? -1 : 1) * matched * close.price
      realized += (openValue + closeValue) * 100

      // Update remaining quantities
      quantityToClose -= matched
      open.contract_quantity = (open.contract_quantity || open.quantity) - matched

      if ((open.contract_quantity || open.quantity) <= 0) {
        remainingOpen.shift()
      }
    }
  }

  // Calculate unrealized P&L on remaining open position
  const openContracts = remainingOpen.reduce((sum, t) => sum + (t.contract_quantity || t.quantity), 0)
  const isShort = openTrades[0]?.action === 'STO'
  const direction = isShort ? 1 : -1

  const unrealized = direction * openContracts * (1 - currentOptionPrice) * 100

  // Calculate intrinsic/extrinsic breakdown
  const intrinsic = Math.max(0, strikePrice - currentStockPrice) * 100
  const extrinsic = currentOptionPrice - intrinsic

  return {
    unrealized,
    realized,
    intrinsic,
    extrinsic,
    total: unrealized + realized
  }
}
```

## Storage Schema (IndexedDB)

### Stores

| Store Name | Key Path | Indexes |
|------------|----------|---------|
| `positions` | `id` | `symbol`, `status`, `strategy_type`, `created_date` |
| `trades` | `id` | `position_id`, `trade_kind`, `occ_symbol`, `timestamp` |
| `priceEntries` | `id` | `instrument_id`, `date` (compound) |
| `journalEntries` | `id` | `position_id`, `trade_id`, `created_at` |

### Migration (Version 1 → 2)

```typescript
function migrateFromV1(db: IDBDatabase): void {
  if (!db.objectStoreNames.contains('positions')) {
    return
  }

  const transaction = db.transaction(['positions'], 'readwrite')
  const store = transaction.objectStore('positions')

  store.openCursor().onsuccess = (event) => {
    const cursor = (event.target as IDBRequest).result
    if (cursor) {
      const position = cursor.value
      // Add new option fields with defaults
      if (!position.strategy_type) {
        position.strategy_type = 'Long Stock'
      }
      if (!position.trade_kind) {
        position.trade_kind = position.option_type ? 'option' : 'stock'
      }
      // Update storage version
      position._v = 2
      cursor.update(position)
      cursor.continue()
    }
  }
}
```

## Relationships

```
Position (1) ───< (N) Trade
Position (1) ───< (N) JournalEntry
PriceEntry (N) ───> (M) Position  (via instrument_id)
PriceEntry (N) ───> (M) Trade     (via instrument_id)
```

## Index Usage Patterns

| Query | Index Required |
|-------|----------------|
| Get open positions | `status = 'open'` |
| Get positions by symbol | `symbol = 'AAPL'` |
| Get trades by position | `position_id = 'uuid'` |
| Get prices for instrument | `instrument_id = 'AAPL'` |
| Get option trades by OCC | `occ_symbol = 'AAPL  250117P00105000'` |
