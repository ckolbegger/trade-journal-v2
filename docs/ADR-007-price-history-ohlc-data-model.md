# ADR-007: Price History OHLC Data Model

## Status
Accepted

## Context

With the implementation of price tracking and P&L calculation in Slice 3, we need to establish the data structure for storing historical price information.

### Current State
- P&L calculation requires current/recent prices for positions
- Manual price entry system (no API integration)
- Evening workflow focuses on end-of-day price updates
- Future phases may include price charting and technical analysis

### Decision Required
What data structure should we use for storing price history? Should we store only closing prices (minimal), or full OHLC (Open, High, Low, Close) data?

## Decision

We will use a **full OHLC data model** with compound unique indexing:

```typescript
interface PriceHistory {
  id: string                    // UUID for record
  underlying: string            // Symbol (e.g., "AAPL")
  date: string                  // ISO date "YYYY-MM-DD"
  open: number                  // Opening price
  high: number                  // Highest price
  low: number                   // Lowest price
  close: number                 // Closing price (used for P&L)
  updated_at: Date              // Timestamp of manual entry
}

// IndexedDB schema
createObjectStore('price_history', { keyPath: 'id' })
  .createIndex('underlying_date', ['underlying', 'date'], { unique: true })
  .createIndex('underlying', 'underlying', { unique: false })
  .createIndex('date', 'date', { unique: false })
  .createIndex('updated_at', 'updated_at', { unique: false })
```

**Key characteristics:**
- Store all four OHLC price points for each day
- Compound unique index on `[underlying, date]` prevents duplicates
- Use `close` price for P&L calculations
- Future-ready for charting and analysis features

## Rationale

### Future-Proofing for Charting
Full OHLC data enables Phase 2+ features without schema migration:
- **Candlestick charts**: Require OHLC for visual representation
- **Volatility analysis**: High-low range shows intraday movement
- **Gap detection**: Open vs previous close identifies overnight gaps
- **Support/resistance**: High/low levels mark important price boundaries

### Industry Standard Format
OHLC is the universal format for price data:
- **Data sources**: Yahoo Finance, Alpha Vantage, IEX all provide OHLC
- **Charting libraries**: TradingView, Chart.js expect OHLC format
- **Trader expectations**: Familiar format for anyone with trading experience
- **API compatibility**: Easy integration if we add price APIs later

### Minimal Storage Overhead
Storage cost is negligible:
```
Per price record: 4 floats × 8 bytes = 32 bytes
100 positions × 252 trading days/year = 25,200 records
Total: 25,200 × 32 bytes = ~800KB/year

10 years of data: ~8MB (trivial for IndexedDB)
```

### Compound Index Benefits
`[underlying, date]` compound unique index provides:
- **Query optimization**: Fast lookups by symbol
- **Duplicate prevention**: One price record per symbol per day
- **Efficient updates**: Upsert pattern using index
- **Date-range queries**: Efficient time series retrieval

### Evening Workflow Alignment
Manual entry captures end-of-day snapshot:
- User typically enters closing price (main P&L driver)
- Can optionally record day's high/low for context
- Open price helps track gaps and morning reversals
- All data entered once during evening review routine

## Alternatives Considered

### Close-Only Model
Store only closing prices:
```typescript
interface PriceHistory {
  id: string
  underlying: string
  date: string
  price: number  // Just the close
}
```

**Advantages:**
- Simpler mental model
- Minimal storage (1/4 the size)
- All P&L needs met

**Disadvantages:**
- Schema migration required for charting features
- Data backfill needed for historical analysis
- Can't visualize volatility or intraday movement
- Loses valuable context for journaling

**Rejected because:** Storage savings trivial; future migration cost high; loses trading context

### Separate Daily/Intraday Storage
Different tables for end-of-day vs real-time prices.

**Advantages:**
- Optimized for different access patterns
- Clear separation of concerns

**Disadvantages:**
- Significant complexity overhead
- No real-time data in Phase 1A (manual entry only)
- Over-engineering for current requirements
- Complicates queries

**Rejected because:** No real-time data source justifies complexity

### Extended Data Model
Include volume, bid/ask, additional metrics:
```typescript
interface PriceHistory {
  // ... OHLC fields
  volume: number
  bid: number
  ask: number
  vwap: number
}
```

**Advantages:**
- More complete market data
- Supports advanced analysis

**Disadvantages:**
- Manual entry burden increases significantly
- Most fields irrelevant for journaling focus
- Over-complicates evening workflow
- Storage overhead with minimal benefit

**Rejected because:** Adds friction to core evening workflow without clear user value

## Consequences

### Positive
- **Future-ready**: No schema migration for charting/analysis features
- **Industry standard**: Familiar format, easy data import/export
- **Rich context**: Full day's price action available for journaling
- **Negligible storage**: <10MB for decade of data
- **Efficient queries**: Compound index optimizes lookups
- **Flexible UI**: Can show close-only or full OHLC based on context

### Negative
- **Manual entry complexity**: Users must enter 4 values instead of 1
- **Partially unused**: Phase 1A only uses `close` for P&L
- **UI complexity**: Form fields for all OHLC values
- **Cognitive overhead**: Users may not understand O/H/L significance

### Mitigation Strategies
- **Smart defaults**: Pre-fill O/H/L with close price for quick entry
- **Progressive disclosure**: Show close field prominently, O/H/L as "Advanced"
- **Validation**: Ensure high ≥ open,close ≥ low (prevent invalid data)
- **Single-price mode**: Allow entry of just close, auto-fill others
- **Education**: Brief tooltip explaining OHLC for interested users

## Implementation Notes

### Current Usage (Phase 1A)
```typescript
// P&L calculation uses only close price
export function calculateTradePnL(
  trade: Trade,
  priceHistory: PriceHistory
): number {
  if (trade.trade_type === 'sell') return 0
  return (priceHistory.close - trade.price) * trade.quantity
  //       ^^^^^^^^^^^^^ Only close used
}
```

### Database Schema (Version 3)
```typescript
// src/lib/position.ts
if (!db.objectStoreNames.contains('price_history')) {
  const priceStore = db.createObjectStore('price_history', { keyPath: 'id' })

  // Compound unique index: one record per symbol per day
  priceStore.createIndex('underlying_date', ['underlying', 'date'], {
    unique: true
  })

  priceStore.createIndex('underlying', 'underlying', { unique: false })
  priceStore.createIndex('date', 'date', { unique: false })
  priceStore.createIndex('updated_at', 'updated_at', { unique: false })
}
```

### Price Entry UI (Current)
```typescript
// PriceUpdateCard component
// Currently requires all OHLC fields
<input label="Open" />
<input label="High" />
<input label="Low" />
<input label="Close" />  // Primary field for P&L
```

### Recommended UI Enhancement
Future improvement for easier entry:
```typescript
// Quick mode: Just enter close
<input label="Current Price" value={close} />
<ToggleButton>Show Advanced (OHLC)</ToggleButton>

// Advanced mode: Full OHLC
{showAdvanced && (
  <>
    <input label="Open" />
    <input label="High" />
    <input label="Low" />
  </>
)}
```

### Future Features Enabled

**Phase 2: Position Charts**
```typescript
// Candlestick chart from OHLC data
const chartData = priceHistory.map(p => ({
  x: p.date,
  o: p.open,
  h: p.high,
  l: p.low,
  c: p.close
}))
```

**Phase 3: Volatility Analysis**
```typescript
// Calculate daily price range (volatility indicator)
const dailyRange = (high - low) / open * 100  // Percentage range
const avgVolatility = calculateAverageTrueRange(priceHistory)
```

**Phase 4: Pattern Detection**
```typescript
// Detect gaps, breakouts, support/resistance
const gapUp = open > previousClose * 1.02
const breaksResistance = high > resistanceLevel
```

### Data Validation
PriceService enforces logical constraints:
```typescript
// src/services/PriceService.ts
function validateOHLC(price: PriceHistory): boolean {
  return (
    price.high >= price.open &&
    price.high >= price.close &&
    price.low <= price.open &&
    price.low <= price.close &&
    price.high >= price.low
  )
}
```

### Query Patterns
```typescript
// Get latest price for P&L (most common)
await priceService.getLatestPrice(underlying)

// Get price for specific date
await priceService.getPriceForDate(underlying, date)

// Get date range for charting (future)
await priceService.getPriceRange(underlying, startDate, endDate)
```

## Review Date
This decision should be reviewed if:
- Manual entry friction causes poor adoption of price tracking
- Storage constraints emerge (unlikely given 10-year capacity)
- API integration eliminates need for manual OHLC entry
- User feedback indicates OHLC fields are confusing/burdensome
- Charting features don't materialize by Phase 3 (suggests over-engineering)
