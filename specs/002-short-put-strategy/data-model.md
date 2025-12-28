# Data Model: Short Put Strategy Support

**Feature**: 002-short-put-strategy | **Date**: 2025-12-27

This document defines the data entities, relationships, and validation rules for short put option strategy support.

---

## Entity Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Position                                        │
│  (Immutable trade plan - stock or option)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  id: string (UUID)                                                          │
│  symbol: string                    # Underlying stock symbol                │
│  strategy_type: StrategyType       # 'Long Stock' | 'Short Put'             │
│  trade_kind: TradeKind             # 'stock' | 'option'                     │
│                                                                             │
│  # Plan fields (immutable after creation)                                   │
│  target_entry_price: number                                                 │
│  target_quantity: number                                                    │
│  profit_target: number                                                      │
│  stop_loss: number                                                          │
│  profit_target_basis: PriceBasis   # 'stock_price' | 'option_price'         │
│  stop_loss_basis: PriceBasis       # 'stock_price' | 'option_price'         │
│  position_thesis: string           # Required journal content               │
│  created_date: Date                                                         │
│                                                                             │
│  # Option plan fields (when trade_kind === 'option')                        │
│  option_type?: 'call' | 'put'                                               │
│  strike_price?: number                                                      │
│  expiration_date?: Date                                                     │
│  premium_per_contract?: number     # Expected premium                       │
│                                                                             │
│  # Derived state                                                            │
│  status: PositionStatus            # Computed from trades                   │
│  trades: Trade[]                   # Embedded trades array                  │
│  journal_entry_ids: string[]       # Linked journal entries                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ 1:N (embedded)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                 Trade                                        │
│  (Execution record - stock or option transaction)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  id: string (UUID)                                                          │
│  position_id: string               # Parent position reference              │
│  trade_kind: TradeKind             # 'stock' | 'option'                     │
│  trade_type: 'buy' | 'sell'        # Direction                              │
│  action?: OptionAction             # 'STO' | 'BTC' | 'BTO' | 'STC'          │
│  quantity: number                  # Shares or contracts                    │
│  price: number                     # Per share or per contract              │
│  timestamp: Date                                                            │
│  notes?: string                                                             │
│  underlying: string                # Stock symbol or OCC symbol             │
│                                                                             │
│  # Option-specific fields (when trade_kind === 'option')                    │
│  occ_symbol?: string               # Auto-derived: AAPL  250117P00105000    │
│  option_type?: 'call' | 'put'                                               │
│  strike_price?: number                                                      │
│  expiration_date?: Date                                                     │
│  contract_quantity?: number        # Defaults to 1 (100 shares)             │
│  underlying_price_at_trade?: number # Stock price at trade time             │
│                                                                             │
│  # Assignment linkage (when trade represents assignment)                    │
│  created_stock_position_id?: string # Links to new stock position           │
│  cost_basis_adjustment?: number     # Premium received, for audit trail     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              PriceEntry                                      │
│  (Market price data - shared across positions by instrument)                │
├─────────────────────────────────────────────────────────────────────────────┤
│  id: string (UUID)                                                          │
│  instrument_id: string             # Stock symbol or OCC symbol             │
│  date: string                      # YYYY-MM-DD format                      │
│  close_price: number               # Closing price (used for P&L)           │
│  open?: number                     # Future OHLC expansion                  │
│  high?: number                     # Future OHLC expansion                  │
│  low?: number                      # Future OHLC expansion                  │
│  updated_at: Date                  # Last update timestamp                  │
└─────────────────────────────────────────────────────────────────────────────┘
        │
        │ Unique index: (instrument_id, date)
        │
        └──────────────── Shared by all positions using same instrument

┌─────────────────────────────────────────────────────────────────────────────┐
│                           AssignmentEvent                                    │
│  (Records option assignment with linkage to resulting stock position)       │
├─────────────────────────────────────────────────────────────────────────────┤
│  id: string (UUID)                                                          │
│  option_position_id: string        # Original short put position            │
│  stock_position_id: string         # Newly created stock position           │
│  assignment_date: Date                                                      │
│  contracts_assigned: number                                                 │
│  strike_price: number                                                       │
│  premium_received_per_share: number # Premium ÷ 100                         │
│  resulting_cost_basis: number       # strike - premium_per_share            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                            JournalEntry                                      │
│  (Extended with option-specific entry types)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  id: string (UUID)                                                          │
│  position_id: string                                                        │
│  trade_id?: string                 # Linked trade (for trade entries)       │
│  entry_type: JournalEntryType      # 'position_plan' | 'trade_execution'    │
│                                    # | 'option_assignment' (NEW)            │
│  content: string                                                            │
│  created_date: Date                                                         │
│  prompts?: string[]                # Assignment-specific prompts            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Type Definitions

> **Location**: All Position and Trade types extend the existing interfaces in `src/lib/position.ts`.
> Supporting types (JournalEntry, PriceHistory) extend their existing files in `src/types/`.

### Enumerations

```typescript
// Strategy types - extensible for future strategies
type StrategyType = 'Long Stock' | 'Short Put'
// Future: | 'Covered Call' | 'Cash Secured Put' | 'Long Call' | 'Long Put'

// Trade kind discriminator
type TradeKind = 'stock' | 'option'

// Position status (derived from trades)
type PositionStatus = 'planned' | 'open' | 'closed'

// Option type
type OptionType = 'call' | 'put'

// Option action codes
type OptionAction = 'STO' | 'BTC' | 'BTO' | 'STC'
// STO = Sell to Open, BTC = Buy to Close
// BTO = Buy to Open, STC = Sell to Close (future strategies)

// Price basis for targets/stops
type PriceBasis = 'stock_price' | 'option_price'

// Journal entry types
type JournalEntryType = 'position_plan' | 'trade_execution' | 'option_assignment'
```

### Position Interface

```typescript
interface Position {
  // Core identity
  id: string
  symbol: string
  strategy_type: StrategyType
  trade_kind: TradeKind

  // Plan fields (immutable after creation)
  target_entry_price: number
  target_quantity: number
  profit_target: number
  stop_loss: number
  profit_target_basis: PriceBasis
  stop_loss_basis: PriceBasis
  position_thesis: string
  created_date: Date

  // Option plan fields (present when trade_kind === 'option')
  option_type?: OptionType
  strike_price?: number
  expiration_date?: Date
  premium_per_contract?: number

  // Derived state
  status: PositionStatus  // Computed from trades
  trades: Trade[]
  journal_entry_ids: string[]
}
```

### Trade Interface

```typescript
interface Trade {
  // Core identity
  id: string
  position_id: string
  trade_kind: TradeKind
  trade_type: 'buy' | 'sell'
  action?: OptionAction
  quantity: number
  price: number
  timestamp: Date
  notes?: string
  underlying: string

  // Option-specific fields (present when trade_kind === 'option')
  occ_symbol?: string
  option_type?: OptionType
  strike_price?: number
  expiration_date?: Date
  contract_quantity?: number
  underlying_price_at_trade?: number

  // Assignment linkage
  created_stock_position_id?: string
  cost_basis_adjustment?: number
}
```

### PriceEntry Interface

```typescript
interface PriceEntry {
  id: string
  instrument_id: string  // Stock symbol or OCC symbol
  date: string           // YYYY-MM-DD
  close_price: number
  open?: number
  high?: number
  low?: number
  updated_at: Date
}
```

### AssignmentEvent Interface

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

---

## Validation Rules

### Position Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| symbol | Required, non-empty | "Symbol is required" |
| strategy_type | One of enum values | "Invalid strategy type" |
| target_entry_price | > 0 | "Target entry price must be positive" |
| target_quantity | Integer > 0 | "Target quantity must be a positive integer" |
| profit_target | > 0 | "Profit target must be positive" |
| stop_loss | > 0 | "Stop loss must be positive" |
| position_thesis | Non-empty | "Position thesis is required" |
| strike_price (option) | > 0 | "Strike price must be positive" |
| expiration_date (option) | Future date | "Expiration date must be in the future" |
| premium_per_contract (option) | > 0 when provided | "Premium must be positive" |

### Trade Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| quantity | Integer > 0 | "Quantity must be a positive integer" |
| price | >= 0 | "Price must be non-negative" |
| action (STO) | Before expiration | "Sell-to-open only allowed before expiration" |
| action (BTC) | quantity <= open | "Cannot close more contracts than open" |
| action (expired) | On/after expiration | "Expiration only valid on/after expiration date" |
| action (assigned) | On/after expiration | "Assignment only valid on/after expiration date" |
| strike_price (option) | Matches position | "Strike price must match position" |
| expiration_date (option) | Matches position | "Expiration date must match position" |

### Price Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| close_price (stock) | > 0 | "Stock price must be positive" |
| close_price (option) | >= 0 | "Option price must be non-negative" |
| price change | Confirm if > 20% | "Large price change - please confirm" |

---

## State Transitions

### Position Status

```
                 ┌─────────┐
                 │ planned │
                 └────┬────┘
                      │
                      │ First trade added
                      ▼
                 ┌─────────┐
                 │  open   │◄────┐
                 └────┬────┘     │
                      │          │ Net quantity > 0
                      │ Net quantity = 0
                      ▼          │
                 ┌─────────┐     │
                 │ closed  │─────┘
                 └─────────┘
                      │
                      │ More trades added
                      │ (re-opens if net > 0)
                      ▼
                 ┌─────────┐
                 │  open   │
                 └─────────┘
```

**Status Computation**:
```typescript
function computeStatus(trades: Trade[]): PositionStatus {
  if (trades.length === 0) return 'planned'

  const netQuantity = trades.reduce((net, trade) => {
    const qty = trade.quantity
    return trade.trade_type === 'buy' ? net + qty : net - qty
  }, 0)

  return netQuantity === 0 ? 'closed' : 'open'
}
```

### Option Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    Short Put Lifecycle                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌─────────────────────────┐   │
│  │ PLANNED  │───▶│   OPEN   │───▶│ CLOSED                  │   │
│  │          │STO │ (short)  │    │ (via BTC/expired/assign) │   │
│  └──────────┘    └──────────┘    └─────────────────────────┘   │
│                       │                      │                  │
│                       │ Assignment           │                  │
│                       ▼                      │                  │
│              ┌──────────────────┐            │                  │
│              │ NEW STOCK        │            │                  │
│              │ POSITION         │◄───────────┘                  │
│              │ (Long Stock)     │ cost_basis = strike - premium │
│              └──────────────────┘                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Relationships

### Position → Trade (1:N, embedded)

Trades are embedded within the position document for atomic updates and simpler queries.

```typescript
// Adding a trade
async function addTrade(positionId: string, trade: Trade): Promise<void> {
  const position = await getPosition(positionId)
  position.trades.push(trade)
  position.status = computeStatus(position.trades)
  await updatePosition(position)
}
```

### Position → JournalEntry (1:N, referenced)

Journal entries are stored separately and referenced by ID for independent querying.

```typescript
// Position stores array of journal entry IDs
position.journal_entry_ids: string[]

// Journal entry references position
journalEntry.position_id: string
journalEntry.trade_id?: string  // Optional link to specific trade
```

### PriceEntry → Instruments (M:N, shared)

A single price entry is shared by all positions using the same instrument.

```typescript
// Price lookup by instrument
const stockPrice = await getPrice(position.symbol, today)
const optionPrice = await getPrice(trade.occ_symbol, today)
```

### AssignmentEvent → Positions (1:1:1)

Each assignment links exactly one option position to one stock position.

```typescript
// Assignment creates bidirectional linkage
assignmentEvent.option_position_id → original short put
assignmentEvent.stock_position_id → new long stock

// Trade records the linkage for audit
btcTrade.created_stock_position_id → new stock position
stockBuyTrade.cost_basis_adjustment → premium received
```

---

## IndexedDB Schema

### Object Stores

| Store | Key | Indexes |
|-------|-----|---------|
| positions | id | symbol, status, strategy_type, created_date |
| prices | id | (instrument_id, date) unique compound |
| journals | id | position_id, entry_type, created_date |
| assignments | id | option_position_id, stock_position_id |

### Schema Version

- **Current**: v3
- **New**: v4 (adds assignments store, updates positions/prices indexes)

### Migration Script

```typescript
function upgradeDB(db: IDBDatabase, oldVersion: number): void {
  if (oldVersion < 4) {
    // Create assignments store
    if (!db.objectStoreNames.contains('assignments')) {
      const store = db.createObjectStore('assignments', { keyPath: 'id' })
      store.createIndex('option_position_id', 'option_position_id')
      store.createIndex('stock_position_id', 'stock_position_id')
    }

    // Add strategy_type index to positions (if not exists)
    const positionStore = db.transaction('positions').objectStore('positions')
    if (!positionStore.indexNames.contains('strategy_type')) {
      // Note: Index creation requires store access in upgrade transaction
    }
  }
}
```

---

## Computed Values

### Average Cost Basis (FIFO)

Computed from trades, grouped by instrument:

```typescript
function calculateAverageCost(trades: Trade[], instrument: string): number {
  const instrumentTrades = trades.filter(t => t.underlying === instrument)
  // Apply FIFO matching for exits
  // Return weighted average of remaining open lots
}
```

### Intrinsic/Extrinsic Values

Computed from current prices:

```typescript
interface IntrinsicExtrinsic {
  intrinsicPerContract: number
  extrinsicPerContract: number
  intrinsicTotal: number  // × contracts × 100
  extrinsicTotal: number  // × contracts × 100
}

function calculatePutValues(
  stockPrice: number,
  strikePrice: number,
  optionPrice: number,
  contracts: number
): IntrinsicExtrinsic
```

### Unrealized P&L (Short Put)

```typescript
function calculateUnrealizedPnL(
  premiumReceived: number,
  currentOptionPrice: number,
  contracts: number
): number {
  return (premiumReceived - currentOptionPrice) * contracts * 100
}
```

### Realized P&L (FIFO)

```typescript
function calculateRealizedPnL(
  trades: Trade[],
  instrument: string
): number {
  // Match BTC trades against STO trades using FIFO
  // Sum (sell_price - buy_price) × quantity × 100
}
```

---

## Backward Compatibility

### Existing Positions

All existing positions are Long Stock. Migration applies defaults:

| Field | Default Value |
|-------|---------------|
| strategy_type | 'Long Stock' |
| trade_kind | 'stock' |
| profit_target_basis | 'stock_price' |
| stop_loss_basis | 'stock_price' |
| option_type | null |
| strike_price | null |
| expiration_date | null |

### Existing Trades

All existing trades are stock trades:

| Field | Default Value |
|-------|---------------|
| trade_kind | 'stock' |
| action | null |
| occ_symbol | null |
| underlying | position.symbol (migration required) |

### Migration Strategy

1. Lazy migration on read (apply defaults in service layer)
2. No batch data transformation required
3. New fields are optional for existing records
4. Validation only enforces new required fields on new records
