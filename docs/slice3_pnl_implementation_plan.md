# Slice 3: P&L Calculation & Display System - Implementation Plan

**Date Created:** October 25, 2024
**Phase:** Phase 1A
**Estimated Duration:** 6-8 days
**Current Test Count:** 426 tests passing

---

## Table of Contents
1. [Overview](#overview)
2. [Core Architecture Changes](#core-architecture-changes)
3. [Key Design Decisions](#key-design-decisions)
4. [Implementation Approach](#implementation-approach)
5. [Success Criteria](#success-criteria)
6. [Timeline & Milestones](#timeline--milestones)
7. [Future Enhancements](#future-enhancements)

---

## Overview

Implement underlying-based price tracking with OHLC (Open/High/Low/Close) structure and real-time P&L calculations for all positions. This establishes the foundation for multi-leg option strategies while keeping Phase 1A UI simple and focused on single stock trades.

### Goals
- Enable manual price updates with OHLC data structure
- Calculate real-time unrealized P&L for open positions
- Display P&L across dashboard and position detail views
- Support backdating price entries
- Validate large price changes (>20% requires confirmation)
- Future-proof architecture for multi-leg options strategies

### Non-Goals (Deferred to Phase 1B+)
- Portfolio-wide price manager
- Automatic price feeds
- Advanced OHLC data entry (full open/high/low entry)
- Price history visualizations
- Staleness warnings

---

## Core Architecture Changes

### 1. Data Model Updates

#### Trade Interface Enhancement

**Add `underlying` field to Trade interface:**

```typescript
interface Trade {
  id: string
  position_id: string
  underlying: string        // NEW: Stock symbol or OCC option symbol
  trade_type: 'buy' | 'sell'
  quantity: number
  price: number             // Execution price (cost basis)
  timestamp: Date
  notes?: string
}
```

**Phase 1A Behavior:**
- Auto-populate `underlying = position.symbol` for all stock trades
- User never sees this field in Phase 1A UI
- Trade creation form automatically sets it from position context

**Future Behavior (Phase 3+):**
- Options use OCC symbol format: `"AAPL  250117C00150000"`
- Format: `Symbol(6 chars) + YYMMDD + C/P + Strike(8 digits)`
- Example: AAPL Jan 17, 2025 $150 Call = `"AAPL  250117C00150000"`

**Migration Strategy:**
- Existing trades don't have `underlying` field
- Service layer computes it on-the-fly: `trade.underlying ?? position.symbol`
- New trades require `underlying` field (validated)
- No database migration needed (backward compatible)

---

#### New PriceHistory Entity

**OHLC-based price tracking:**

```typescript
interface PriceHistory {
  id: string                    // UUID
  underlying: string            // "AAPL" or "AAPL  250117C00150000"
  date: string                  // "2024-10-25" (YYYY-MM-DD format)
  open: number                  // Opening price for the day
  high: number                  // Highest price during the day
  low: number                   // Lowest price during the day
  close: number                 // Closing price (ALWAYS used for P&L)
  updated_at: Date              // Timestamp when user entered/updated
}
```

**IndexedDB Schema:**
- Object Store: `price_history`
- Primary Key: `id`
- Index 1: `underlying` (for "get all AAPL prices")
- Index 2: `date` (for "get all prices on 2024-10-25")
- Index 3: `[underlying, date]` compound index (UNIQUE constraint)

**Unique Constraint Behavior:**
- One PriceHistory record per `[underlying, date]` combination
- Updating price on same date = **overwrite existing record**
- Latest update wins (no versioning in Phase 1A)

**Phase 1A OHLC Simplification:**
- User enters only "Current Price" (closing price)
- System auto-fills: `open = high = low = close = user_input`
- Rationale: Simple UX, data structure ready for future enhancement

**No Database Version Bump:**
- Don't increment IndexedDB version
- Add `price_history` object store on first access
- Graceful schema evolution pattern

---

### 2. Service Layer

#### New PriceService Class

**Location:** `src/services/PriceService.ts`

**Core Methods:**

```typescript
class PriceService {
  // Create or update price for an underlying on a specific date
  async updatePrice(
    underlying: string,
    date: string,           // YYYY-MM-DD format
    close: number,          // Closing price
    options?: {
      open?: number,        // Optional (defaults to close)
      high?: number,        // Optional (defaults to close)
      low?: number          // Optional (defaults to close)
    }
  ): Promise<PriceHistory>

  // Get most recent price for an underlying
  async getLatestPrice(underlying: string): Promise<PriceHistory | null>

  // Get historical prices for visualization
  async getPriceHistory(
    underlying: string,
    options?: {
      limit?: number,           // Max records to return
      orderBy?: 'date',         // Sort field
      direction?: 'asc' | 'desc'
    }
  ): Promise<PriceHistory[]>

  // Get price for specific date
  async getPriceByDate(
    underlying: string,
    date: string
  ): Promise<PriceHistory | null>

  // Get all underlyings updated on a specific date
  async getPriceUpdatesByDate(date: string): Promise<PriceHistory[]>

  // Batch fetch latest prices for dashboard (performance optimization)
  async getAllLatestPrices(): Promise<Map<string, PriceHistory>>

  // Validate price change (returns confirmation required flag)
  async validatePriceUpdate(
    underlying: string,
    newPrice: number
  ): Promise<{
    valid: boolean
    requiresConfirmation: boolean
    percentChange?: number
    lastPrice?: number
    message?: string
  }>
}
```

**Price Validation Logic:**

```typescript
async validatePriceUpdate(underlying: string, newPrice: number) {
  // Get last known price
  const lastPrice = await this.getLatestPrice(underlying)

  if (!lastPrice) {
    return { valid: true, requiresConfirmation: false }
  }

  // Calculate percent change
  const percentChange = Math.abs(
    (newPrice - lastPrice.close) / lastPrice.close
  )

  // Require confirmation if >20% change
  if (percentChange > 0.20) {
    return {
      valid: true,
      requiresConfirmation: true,
      percentChange: percentChange * 100,
      lastPrice: lastPrice.close,
      message: `Price changed ${(percentChange * 100).toFixed(1)}% from last update. Confirm?`
    }
  }

  return { valid: true, requiresConfirmation: false }
}
```

**Additional Validation:**
- Prevent zero or negative prices
- Date format validation (YYYY-MM-DD)
- Future date warnings (optional)

---

### 3. Calculation Utilities

#### New File: `src/utils/performance.ts`

**P&L Calculation Functions:**

```typescript
/**
 * Calculate unrealized P&L for a single trade
 * Sell trades return 0 (already realized)
 * Buy trades: (current_price - execution_price) × quantity
 */
export function calculateTradePnL(
  trade: Trade,
  priceHistory: PriceHistory
): number {
  // Sell trades have already realized their P&L
  if (trade.trade_type === 'sell') {
    return 0
  }

  // Buy trade: unrealized P&L = (current - cost) × quantity
  // ALWAYS use close price for calculations
  return (priceHistory.close - trade.price) * trade.quantity
}

/**
 * Calculate total unrealized P&L for a position
 * Sums P&L across all trades in the position
 */
export function calculatePositionPnL(
  trades: Trade[],
  priceHistoryMap: Map<string, PriceHistory>
): number {
  return trades.reduce((total, trade) => {
    const priceHistory = priceHistoryMap.get(trade.underlying)

    // Skip trades without price data
    if (!priceHistory) {
      return total
    }

    return total + calculateTradePnL(trade, priceHistory)
  }, 0)
}

/**
 * Helper: Get price map for all underlyings in a position
 * Batch fetches prices for efficiency
 */
export async function getPriceMapForPosition(
  position: Position,
  priceService: PriceService
): Promise<Map<string, PriceHistory>> {
  // Get unique underlyings from all trades
  const underlyings = new Set(
    position.trades.map(t => t.underlying || position.symbol)
  )

  const priceMap = new Map<string, PriceHistory>()

  for (const underlying of underlyings) {
    const priceHistory = await priceService.getLatestPrice(underlying)
    if (priceHistory) {
      priceMap.set(underlying, priceHistory)
    }
  }

  return priceMap
}

/**
 * Calculate P&L percentage gain/loss
 */
export function calculatePnLPercentage(
  pnl: number,
  costBasis: number
): number {
  if (costBasis === 0) return 0
  return (pnl / costBasis) * 100
}

/**
 * Calculate net quantity from trades
 * Buy trades add, sell trades subtract
 */
export function calculateNetQuantity(trades: Trade[]): number {
  return trades.reduce((net, trade) => {
    return trade.trade_type === 'buy'
      ? net + trade.quantity
      : net - trade.quantity
  }, 0)
}

/**
 * Calculate progress toward profit target and stop loss
 * Returns percentage and positioning for progress bar
 */
export function calculateProgressToTarget(
  position: Position,
  currentPrice: number
): {
  percentage: number          // 0-100, position between stop and target
  distanceToStop: number      // Dollars from stop loss
  distanceToTarget: number    // Dollars to profit target
  capturedProfit: number      // Percentage of potential profit captured
} {
  const range = position.profit_target - position.stop_loss
  const currentFromStop = currentPrice - position.stop_loss

  return {
    percentage: (currentFromStop / range) * 100,
    distanceToStop: currentPrice - position.stop_loss,
    distanceToTarget: position.profit_target - currentPrice,
    capturedProfit: (currentFromStop / range) * 100
  }
}
```

**Phase 1A Simplification:**
- Each position has only 1 underlying (stock symbol)
- `priceHistoryMap` will have exactly 1 entry
- Architecture supports multi-leg positions (future)

---

### 4. UI Components

#### New Component: PriceUpdateCard

**Location:** `src/components/PriceUpdateCard.tsx`

**Features:**
- Date picker (defaults to today, supports backdating)
- Price input (validates non-zero, non-negative)
- Last price display with timestamp
- Multi-position warning (if underlying used in >1 position)
- Confirmation dialog for >20% changes
- Success/error feedback

**Component Structure:**

```tsx
interface PriceUpdateCardProps {
  position: Position
  priceService: PriceService
  onPriceUpdated?: () => void
}

export function PriceUpdateCard({
  position,
  priceService,
  onPriceUpdated
}: PriceUpdateCardProps) {
  const [selectedDate, setSelectedDate] = useState(today())
  const [priceInput, setPriceInput] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [validationResult, setValidationResult] = useState(null)

  // Get last known price for display
  const { data: lastPrice } = useQuery(
    ['latestPrice', position.symbol],
    () => priceService.getLatestPrice(position.symbol)
  )

  const handleUpdatePrice = async () => {
    const price = parseFloat(priceInput)

    // Validate price change
    const validation = await priceService.validatePriceUpdate(
      position.symbol,
      price
    )

    if (validation.requiresConfirmation) {
      setValidationResult(validation)
      setShowConfirmation(true)
      return
    }

    await submitPriceUpdate()
  }

  const submitPriceUpdate = async () => {
    const price = parseFloat(priceInput)

    await priceService.updatePrice(
      position.symbol,
      selectedDate,
      price
    )

    onPriceUpdated?.()
  }

  return (
    <div className="price-update-card">
      <h3>Update {position.symbol} Price</h3>

      {/* Date picker */}
      <input
        type="date"
        value={selectedDate}
        onChange={e => setSelectedDate(e.target.value)}
      />

      {/* Price input */}
      <input
        type="number"
        step="0.01"
        placeholder="Closing Price"
        value={priceInput}
        onChange={e => setPriceInput(e.target.value)}
      />

      {/* Last known price */}
      {lastPrice && (
        <p className="text-xs text-gray-500">
          Last: ${lastPrice.close.toFixed(2)} on {lastPrice.date}
          <span className="ml-2">
            ({formatTimeAgo(lastPrice.updated_at)})
          </span>
        </p>
      )}

      <button onClick={handleUpdatePrice}>
        Update Price
      </button>

      {/* Confirmation dialog */}
      {showConfirmation && (
        <ConfirmationDialog
          validation={validationResult}
          onConfirm={submitPriceUpdate}
          onCancel={() => setShowConfirmation(false)}
        />
      )}
    </div>
  )
}
```

---

#### New Component: PnLDisplay

**Location:** `src/components/PnLDisplay.tsx`

**Features:**
- Color-coded P&L (green=profit, red=loss, gray=no data)
- Dollar amount and percentage display
- Handles missing price data ("—" display)
- Responsive sizing

```tsx
interface PnLDisplayProps {
  pnl: number | null
  percentage?: number
  size?: 'sm' | 'md' | 'lg'
}

export function PnLDisplay({ pnl, percentage, size = 'md' }: PnLDisplayProps) {
  if (pnl === null) {
    return <span className="text-gray-400">—</span>
  }

  const isProfit = pnl > 0
  const colorClass = isProfit
    ? 'text-green-600'
    : pnl < 0
      ? 'text-red-600'
      : 'text-gray-600'

  return (
    <div className={`pnl-display ${colorClass}`}>
      <span className="pnl-amount">
        {isProfit ? '+' : ''}${Math.abs(pnl).toFixed(2)}
      </span>
      {percentage !== undefined && (
        <span className="pnl-percentage">
          ({isProfit ? '+' : ''}{percentage.toFixed(1)}%)
        </span>
      )}
    </div>
  )
}
```

---

#### New Component: ProgressIndicator

**Location:** `src/components/ProgressIndicator.tsx`

**Features:**
- Visual progress bar from stop loss to profit target
- Current price indicator
- Color gradient (red → yellow → green)
- Responsive design

```tsx
interface ProgressIndicatorProps {
  position: Position
  currentPrice: number
}

export function ProgressIndicator({ position, currentPrice }: ProgressIndicatorProps) {
  const progress = calculateProgressToTarget(position, currentPrice)

  return (
    <div className="progress-indicator">
      {/* Labels */}
      <div className="progress-labels">
        <span className="text-xs text-red-600">
          Stop: ${position.stop_loss.toFixed(2)}
        </span>
        <span className="text-xs text-green-600">
          Target: ${position.profit_target.toFixed(2)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{
            width: `${Math.min(100, Math.max(0, progress.percentage))}%`,
            background: 'linear-gradient(90deg, #dc2626, #f59e0b, #16a34a)'
          }}
        />

        {/* Current price marker */}
        <div
          className="progress-marker"
          style={{ left: `${progress.percentage}%` }}
        />
      </div>

      {/* Stats */}
      <div className="progress-stats">
        <p className="text-xs">
          Captured {progress.capturedProfit.toFixed(0)}% of potential profit
        </p>
      </div>
    </div>
  )
}
```

---

#### Updated Component: PositionCard

**Changes to `src/components/PositionCard.tsx`:**

Replace placeholder P&L display with real calculations:

```tsx
// Current (lines 52-57):
<div className="text-right">
  <div className="text-sm font-medium text-gray-500">
    {position.trades.length > 0 ? 'Position Open' : 'Planned'}
  </div>
</div>

// NEW:
<div className="text-right">
  <PnLDisplay
    pnl={positionPnL}
    percentage={pnlPercentage}
    size="sm"
  />
</div>

// Calculate P&L before render:
const positionPnL = useMemo(() => {
  if (position.trades.length === 0) return null

  const priceHistory = latestPrices.get(position.symbol)
  if (!priceHistory) return null

  return calculatePositionPnL(position.trades, new Map([[position.symbol, priceHistory]]))
}, [position, latestPrices])
```

---

#### Updated Component: PositionDetail

**Changes to `src/pages/PositionDetail.tsx`:**

Add three new sections:

```tsx
{/* After header, before accordion */}
<div className="performance-section">
  <PnLDisplay
    pnl={currentPnL}
    percentage={pnlPercentage}
    size="lg"
  />
</div>

<PriceUpdateCard
  position={position}
  priceService={priceService}
  onPriceUpdated={handlePriceUpdated}
/>

<ProgressIndicator
  position={position}
  currentPrice={currentPrice}
/>
```

---

#### Updated Component: Dashboard

**Changes to `src/pages/Dashboard.tsx`:**

Add portfolio summary at top:

```tsx
<div className="portfolio-summary">
  <div className="summary-card">
    <h3>Total P&L</h3>
    <PnLDisplay pnl={totalPnL} size="lg" />
  </div>

  <div className="summary-stats">
    <div>Open Positions: {openPositions.length}</div>
    <div>Planned: {plannedPositions.length}</div>
  </div>
</div>
```

---

## Key Design Decisions

### 1. Underlying-Based Pricing Architecture

**Decision:** Store one price per underlying (not per position or trade)

**Rationale:**
- Real-world alignment: AAPL has one market price, not multiple
- Multi-position efficiency: Update AAPL once, affects all AAPL positions
- Future-proof: Works for covered calls (stock + option have separate underlyings)
- Eliminates redundancy: Don't store same price multiple times

**Trade-off:**
- ✅ Simpler data model
- ✅ Efficient updates
- ❌ Requires joining trades with price history (minimal overhead)

---

### 2. OHLC Structure (Not price_type Enum)

**Decision:** Use Open/High/Low/Close fields instead of `price_type: 'intraday' | 'closing'`

**Rationale:**
- Standard financial data format (matches industry)
- Future visualization support (candlestick charts)
- Simpler logic: Always use `close` for P&L calculations
- Intraday updates natural: Just update same record with latest close

**Trade-off:**
- ✅ Clean semantics
- ✅ Future-proof for charts
- ✅ No type enum to manage
- ❌ OHLC fields mostly redundant in Phase 1A (all set to same value)

---

### 3. Individual Records (Not Arrays)

**Decision:** Store each date as a separate PriceHistory record (not array of prices)

**Rationale:**
- IndexedDB native indexing (can query by date efficiently)
- Efficient latest price queries (don't need to read entire array)
- Can query "all underlyings updated today"
- Standard database pattern
- Pagination support for large histories

**Trade-off:**
- ✅ Better querying
- ✅ Efficient partial reads
- ❌ More database records (negligible with IndexedDB)

---

### 4. Overwrite on Duplicate [underlying, date]

**Decision:** Updating price on same date overwrites existing record

**Rationale:**
- One canonical price per day
- Latest update wins
- Simpler than versioning
- Matches user mental model (correcting today's price)

**Trade-off:**
- ✅ Simple behavior
- ✅ No history clutter
- ❌ Loses intraday update history (acceptable for Phase 1A)

---

### 5. Phase 1A: Simple UI, Full Data Model

**Decision:** Build complete OHLC data model, but only expose "current price" input in UI

**Rationale:**
- Fastest user experience (one input field)
- Data structure ready for Phase 1B enhancement
- No over-engineering of UI
- Can add "Show Daily Range" later without migration

**Trade-off:**
- ✅ Simple UX
- ✅ Future-proof data
- ❌ OHLC data incomplete (all same value in Phase 1A)

---

### 6. Close Price for All P&L Calculations

**Decision:** Always use `PriceHistory.close` for P&L calculations, never open/high/low

**Rationale:**
- Consistent calculation methodology
- Matches brokerage statements (use closing price)
- Clear semantic: "close" is the official price of the day
- Eliminates confusion

**Trade-off:**
- ✅ Consistency
- ✅ Industry standard
- ✅ Simple logic
- ❌ None (clear winner)

---

### 7. "—" for Missing Price Data (No Estimation)

**Decision:** Show "—" for P&L when no PriceHistory exists, don't estimate from target_entry_price

**Rationale:**
- Honest data display (don't fake P&L)
- Encourages user to update prices
- Avoids misleading information
- Clear visual distinction (planned vs open with price data)

**Trade-off:**
- ✅ Honest UX
- ✅ Encourages good habits
- ❌ Empty state until first price update (acceptable)

---

### 8. Position-Centric Updates (Phase 1A)

**Decision:** Update prices from PositionDetail page, not global price manager

**Rationale:**
- Simple workflow for Phase 1A
- Most users have one position per underlying
- Clear context (updating TSLA while looking at TSLA position)
- Can add global manager in Phase 1B

**Trade-off:**
- ✅ Simple for Phase 1A
- ✅ Clear context
- ❌ Less efficient for many positions (deferred to Phase 1B)

---

### 9. No Staleness Warnings (Just Show Timestamp)

**Decision:** Show "Last updated: 2 hours ago" but don't nag user

**Rationale:**
- User controls their own workflow
- Manual pricing is inherently async
- Avoid notification fatigue
- Trust user to update when needed

**Trade-off:**
- ✅ Respectful UX
- ✅ No nagging
- ❌ User might forget to update (acceptable trade-off)

---

### 10. Trade.underlying Auto-Population (Phase 1A)

**Decision:** Add `underlying` field now, auto-populate from position.symbol

**Rationale:**
- Prevents future migration
- Field is invisible to Phase 1A users
- Ready for Phase 3+ options
- Minimal complexity

**Trade-off:**
- ✅ Future-proof
- ✅ Zero user impact
- ❌ Slight redundancy in Phase 1A (worth it for future-proofing)

---

## Implementation Approach

### Test-Driven Development (TDD)

Every slice follows this pattern:
1. **Write failing tests first** - Define expected behavior
2. **Implement minimum code to pass** - No over-engineering
3. **Refactor** - Clean up while tests stay green
4. **Integration test** - Verify end-to-end flow

---

### Slice 3.1: Price History Foundation (TDD)

**Duration:** 1 day

**Tests to Write First:**

```typescript
// src/services/__tests__/PriceService.test.ts

describe('PriceService', () => {
  describe('updatePrice', () => {
    it('creates new PriceHistory record')
    it('defaults OHLC to close price when not provided')
    it('overwrites existing record for same underlying+date')
    it('validates non-zero, non-negative prices')
    it('stores timestamp in updated_at field')
  })

  describe('getLatestPrice', () => {
    it('returns most recent price for underlying')
    it('returns null when no prices exist')
    it('orders by date descending')
  })

  describe('getPriceHistory', () => {
    it('returns all prices for underlying')
    it('supports limit parameter')
    it('supports orderBy and direction parameters')
    it('returns empty array when no prices exist')
  })

  describe('getPriceByDate', () => {
    it('returns price for specific date')
    it('returns null when date not found')
  })

  describe('validatePriceUpdate', () => {
    it('requires confirmation when price changes >20%')
    it('allows updates <20% without confirmation')
    it('calculates percent change correctly')
    it('handles first price update (no validation)')
  })
})
```

**Implementation Tasks:**
1. Create `PriceHistory` interface in new file
2. Create `PriceService` class
3. Add IndexedDB `price_history` object store
4. Implement CRUD operations
5. Add compound unique index `[underlying, date]`
6. Implement validation logic

**Files Created:**
- `src/types/priceHistory.ts` - PriceHistory interface
- `src/services/PriceService.ts` - Service implementation
- `src/services/__tests__/PriceService.test.ts` - Test suite

---

### Slice 3.2: Trade Enhancement & Migration (TDD)

**Duration:** 1 day

**Tests to Write First:**

```typescript
// src/lib/__tests__/trade-underlying.test.ts

describe('Trade underlying field', () => {
  it('includes underlying field in interface')
  it('validates underlying is required for new trades')
  it('auto-populates underlying from position.symbol')
})

// src/services/__tests__/TradeService-underlying.test.ts

describe('TradeService with underlying', () => {
  it('populates underlying when creating trade')
  it('validates underlying matches expected format')
  it('handles existing trades without underlying (backward compat)')
})
```

**Implementation Tasks:**
1. Add `underlying: string` to Trade interface
2. Update TradeService to auto-populate field
3. Add validation for new trades
4. Add backward compatibility (compute from position if missing)
5. Update existing tests to handle new field

**Files Modified:**
- `src/lib/position.ts` - Trade interface
- `src/services/TradeService.ts` - Add underlying population
- Multiple test files - Update trade creation

---

### Slice 3.3: P&L Calculation Engine (TDD)

**Duration:** 1-2 days

**Tests to Write First:**

```typescript
// src/utils/__tests__/performance.test.ts

describe('P&L Calculations', () => {
  describe('calculateTradePnL', () => {
    it('calculates unrealized P&L for buy trade')
    it('returns 0 for sell trade')
    it('uses close price from PriceHistory')
    it('handles positive P&L (profit)')
    it('handles negative P&L (loss)')
  })

  describe('calculatePositionPnL', () => {
    it('sums P&L across all trades')
    it('handles mixed buy/sell trades')
    it('skips trades without price data')
    it('handles empty trades array')
    it('handles position with multiple underlyings (future)')
  })

  describe('getPriceMapForPosition', () => {
    it('fetches prices for all underlyings in position')
    it('returns empty map when no trades')
    it('handles missing price data gracefully')
  })

  describe('calculatePnLPercentage', () => {
    it('calculates percentage gain/loss')
    it('handles zero cost basis')
  })

  describe('calculateProgressToTarget', () => {
    it('calculates position between stop and target')
    it('returns percentage progress')
    it('calculates distance to stop and target')
    it('calculates captured profit percentage')
  })
})
```

**Implementation Tasks:**
1. Create `utils/performance.ts`
2. Implement calculation functions
3. Add JSDoc documentation
4. Optimize for performance (memoization if needed)

**Files Created:**
- `src/utils/performance.ts` - Calculation utilities
- `src/utils/__tests__/performance.test.ts` - Test suite

---

### Slice 3.4: Price Update UI (TDD)

**Duration:** 1-2 days

**Tests to Write First:**

```typescript
// src/components/__tests__/PriceUpdateCard.test.tsx

describe('PriceUpdateCard', () => {
  it('renders price input and date picker')
  it('defaults date to today')
  it('displays last known price')
  it('validates non-zero price')
  it('validates non-negative price')
  it('shows confirmation dialog for >20% change')
  it('updates price on submit')
  it('calls onPriceUpdated callback')
  it('handles errors gracefully')
  it('supports backdating prices')
})

// src/components/__tests__/PriceConfirmationDialog.test.tsx

describe('PriceConfirmationDialog', () => {
  it('displays old and new prices')
  it('displays percent change')
  it('confirms update on "Yes"')
  it('cancels update on "No"')
})
```

**Implementation Tasks:**
1. Create PriceUpdateCard component
2. Create PriceConfirmationDialog component
3. Add form validation
4. Add date picker (default today)
5. Integrate with PriceService
6. Add success/error states

**Files Created:**
- `src/components/PriceUpdateCard.tsx`
- `src/components/PriceConfirmationDialog.tsx`
- `src/components/__tests__/PriceUpdateCard.test.tsx`
- `src/components/__tests__/PriceConfirmationDialog.test.tsx`

---

### Slice 3.5: P&L Display Integration (TDD)

**Duration:** 1-2 days

**Tests to Write First:**

```typescript
// src/components/__tests__/PnLDisplay.test.tsx

describe('PnLDisplay', () => {
  it('displays positive P&L in green')
  it('displays negative P&L in red')
  it('displays zero P&L in gray')
  it('displays "—" when P&L is null')
  it('includes percentage when provided')
  it('formats dollar amounts correctly')
})

// src/components/__tests__/ProgressIndicator.test.tsx

describe('ProgressIndicator', () => {
  it('renders progress bar')
  it('positions marker based on current price')
  it('displays stop loss and profit target')
  it('shows captured profit percentage')
  it('handles price below stop loss')
  it('handles price above profit target')
})

// src/components/__tests__/PositionCard-pnl.test.tsx

describe('PositionCard with P&L', () => {
  it('displays P&L when price data exists')
  it('displays "—" when no price data')
  it('displays "—" for planned positions')
  it('updates when price changes')
})

// Integration tests
describe('PositionDetail P&L Integration', () => {
  it('displays current P&L')
  it('updates P&L after price update')
  it('shows progress indicator')
})
```

**Implementation Tasks:**
1. Create PnLDisplay component
2. Create ProgressIndicator component
3. Update PositionCard to show P&L
4. Update PositionDetail with P&L sections
5. Update Dashboard with portfolio summary
6. Add loading states
7. Add error handling

**Files Created:**
- `src/components/PnLDisplay.tsx`
- `src/components/ProgressIndicator.tsx`
- Multiple test files

**Files Modified:**
- `src/components/PositionCard.tsx`
- `src/pages/PositionDetail.tsx`
- `src/pages/Dashboard.tsx`

---

### Slice 3.6: Integration & Polish

**Duration:** 1 day

**Integration Tests:**

```typescript
// src/integration/__tests__/price-update-pnl-flow.test.tsx

describe('Price Update to P&L Flow', () => {
  it('completes full workflow: create position → add trade → update price → see P&L')
  it('updates multiple positions when price changes')
  it('handles backdated price updates')
  it('validates large price changes with confirmation')
  it('displays correct P&L calculations across dashboard and detail')
})
```

**Polish Tasks:**
1. Performance optimization
   - Memoize expensive calculations
   - Batch price fetches for dashboard
   - Lazy load price history
2. Loading states
   - Skeleton loaders
   - Optimistic UI updates
3. Error handling
   - Network failures
   - Invalid data
   - Missing prices
4. Mobile responsiveness
   - Touch-friendly inputs
   - Responsive layouts
5. Accessibility
   - ARIA labels
   - Keyboard navigation
   - Color contrast

---

## Success Criteria

### Functional Requirements
- ✅ Users can manually update prices with date selection
- ✅ Price updates >20% require confirmation
- ✅ All positions with trades show real-time P&L
- ✅ Planned positions show "—" for P&L
- ✅ Dashboard shows portfolio-level P&L summary
- ✅ Progress indicators show position relative to targets/stops
- ✅ One price per underlying (affects all related positions)
- ✅ Backdating works correctly
- ✅ Price staleness shown with timestamp

### Technical Requirements
- ✅ All existing 426 tests still passing
- ✅ New test coverage for all P&L features
- ✅ Performance: P&L calculations <100ms
- ✅ Mobile-responsive design maintained
- ✅ No regressions in existing functionality
- ✅ IndexedDB schema gracefully evolved

### User Experience
- ✅ Simple, intuitive price update workflow
- ✅ Clear visual feedback (color-coded P&L)
- ✅ Helpful validation (large changes require confirmation)
- ✅ No clutter (clean, focused UI)

---

## Timeline & Milestones

### Overall Estimate: 6-8 days

**Day 1:** Slice 3.1 - Price History Foundation
- PriceHistory interface
- PriceService implementation
- IndexedDB setup
- Validation logic
- **Deliverable:** Can create/read/update price records

**Day 2:** Slice 3.2 - Trade Enhancement
- Add Trade.underlying field
- Migration strategy
- TradeService updates
- **Deliverable:** Trades have underlying field

**Days 3-4:** Slice 3.3 - P&L Calculation Engine
- Performance utilities
- Calculation functions
- Edge case handling
- **Deliverable:** Can calculate P&L from trades + prices

**Days 4-5:** Slice 3.4 - Price Update UI
- PriceUpdateCard component
- Confirmation dialog
- Form validation
- **Deliverable:** Users can update prices with UI

**Days 6-7:** Slice 3.5 - P&L Display
- PnLDisplay component
- ProgressIndicator component
- Dashboard integration
- PositionDetail integration
- **Deliverable:** P&L visible throughout app

**Day 8:** Slice 3.6 - Integration & Polish
- End-to-end testing
- Performance optimization
- Bug fixes
- **Deliverable:** Production-ready Slice 3

### Milestones

**Milestone 1 (Day 2):** Data layer complete
- Can store and retrieve prices
- Can track trade underlyings

**Milestone 2 (Day 4):** Calculations working
- P&L can be computed
- Progress indicators functional

**Milestone 3 (Day 7):** UI complete
- All components implemented
- Full user workflow functional

**Milestone 4 (Day 8):** Ship-ready
- All tests passing
- Performance optimized
- No known bugs

---

## Future Enhancements (Phase 1B+)

### Phase 1B: Daily Review Enhancements
- Portfolio-wide price manager
- Full OHLC data entry
- "Update all holdings" workflow
- Review habit tracking
- Batch price updates

### Phase 2+: Visualization
- Price history charts
- Candlestick displays
- P&L progression over time
- Daily range visualization

### Phase 3+: Options Support
- OCC symbol handling
- Multi-leg P&L calculations
- Options-specific pricing
- Greeks integration

---

## Risks & Mitigations

### Risk: Performance degradation with many positions
**Mitigation:**
- Batch price fetches for dashboard
- Memoize expensive calculations
- Lazy load price history
- Monitor and optimize

### Risk: Complex validation logic
**Mitigation:**
- Comprehensive test coverage
- Clear validation rules
- User-friendly error messages
- Validation in service layer (testable)

### Risk: UI complexity creep
**Mitigation:**
- Keep Phase 1A simple (defer advanced features)
- Progressive disclosure pattern
- Focus on core workflow
- Measure user feedback

### Risk: IndexedDB schema evolution
**Mitigation:**
- No version bump (graceful evolution)
- Backward compatibility for trades
- Test with existing data
- Migration plan ready

---

## Notes

- This plan assumes Phase 1A scope: single stock trades only
- Multi-leg options support is deferred to Phase 3+
- Daily review workflow is deferred to Phase 1B
- Architecture is future-proof but UI stays simple
- TDD approach ensures quality and prevents regressions
- Focus on delivering working P&L system, not over-engineering

---

**Document Status:** Draft for review
**Next Steps:** Review with team, get approval, begin implementation
