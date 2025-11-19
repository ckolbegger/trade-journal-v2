# Research: Position Closing via Trade Execution

**Feature**: 001-close-position
**Date**: 2025-11-09
**Status**: Complete

## Overview

This document consolidates research findings for implementing position closing via exit trade execution with FIFO cost basis tracking, optional journaling, and plan vs execution analysis.

## Key Research Areas

### 1. FIFO Cost Basis Calculation Algorithm

**Decision**: Implement FIFO (First-In-First-Out) matching for exit trades

**Rationale**:
- Industry standard for brokerage P&L calculations and tax reporting
- IRS default method for US traders (no election required)
- Provides accurate reconciliation with brokerage statements
- Simpler implementation than specific lot identification

**Algorithm Design**:
```
For each exit (sell) trade:
1. Sort all open entry (buy) trades by timestamp (oldest first)
2. Match exit quantity against oldest open entry trades sequentially
3. For each matched entry trade:
   - Calculate P&L: (exit_price - entry_price) * matched_quantity
   - Track matched quantity to update remaining open quantity
   - If entry trade fully matched, mark as closed
   - If partially matched, reduce open quantity
4. Sum all P&L from matched trades = realized P&L for this exit
5. Update position.trades array with matched quantities tracked
```

**Data Structure for Tracking**:
- No separate "lot" entity needed
- Track matched quantities implicitly through sequential processing
- Store trade execution order via timestamp
- Maintain audit trail through immutable trade records

**Alternatives Considered**:
- **Specific Lot Identification**: More complex user selection UI, doesn't match most brokerage defaults, rejected
- **Average Cost**: Simpler but doesn't match brokerage statements or tax reporting, rejected
- **LIFO (Last-In-First-Out)**: Less common, not IRS default, rejected

### 2. Position Status State Machine

**Decision**: Automatically transition position status based on net trade quantity

**Rationale**:
- Status is derived state, not user input (Plan vs Execution Separation principle)
- Prevents manual status management errors
- Aligns with "Position status automatically transitions" (SC-006)

**State Transitions**:
```
'planned' → 'open':  When first buy trade added (net quantity > 0)
'open' → 'closed':   When net quantity reaches exactly 0
'closed' → No transitions (terminal state, immutable)
```

**Net Quantity Calculation**:
```typescript
function calculateNetQuantity(trades: Trade[]): number {
  return trades.reduce((net, trade) => {
    return trade.trade_type === 'buy'
      ? net + trade.quantity
      : net - trade.quantity
  }, 0)
}
```

**Validation**:
- Prevent overselling: net quantity must never go negative
- Inline validation before trade save (FR-011)

**Alternatives Considered**:
- **Manual Status Updates**: Error-prone, violates derived state principle, rejected
- **Partial Close Status**: Adds complexity without clear user value, deferred to future phase

### 3. Journal Workflow Integration

**Decision**: Reuse existing JournalService pattern from position creation

**Rationale**:
- Consistency with established UX pattern (Constitutional Principle I)
- Existing infrastructure already supports trade-linked journal entries
- Non-transaction save + optional immediate journaling already implemented

**Implementation Pattern** (from existing codebase):
```typescript
// 1. Save trade (non-transaction)
const trade = await TradeService.createTrade({...})

// 2. Auto-open journal form with trade context
<JournalForm
  linkedTradeId={trade.id}
  entryType="TRADE_EXECUTION"  // Existing type
  onSave={linkJournalToTrade}
  onSkip={markTradeAsUnjournaled}
/>

// 3. Daily review shows unjournaled trades
const unjournaled = await JournalService.getUnjournaledTrades()
```

**Data Model** (from src/types/journal.ts):
- `trade_id` field already exists for linking journals to trades
- `entry_type` supports "TRADE_EXECUTION" type
- No schema changes needed

**Alternatives Considered**:
- **Create New Journal Type for Exits**: Unnecessary complexity, existing TRADE_EXECUTION type sufficient, rejected
- **Mandatory Immediate Journaling**: Breaks consistency with position creation pattern, violates user feedback, rejected

### 4. Plan vs Execution Comparison Display

**Decision**: Calculate and display comparison when position transitions to 'closed' status

**Rationale**:
- Educational moment for learning (Constitutional Principle I)
- Immediate feedback reinforces behavioral training
- Simple calculation from Position plan targets vs actual trade averages

**Metrics to Display**:
```typescript
interface PlanVsExecution {
  // Entry comparison
  targetEntryPrice: number      // From Position.target_entry_price
  actualAvgEntryCost: number    // FIFO weighted average from buy trades
  entryPriceDelta: number        // actual - target
  entryPriceDeltaPct: number     // (delta / target) * 100

  // Exit comparison
  targetExitPrice: number        // From Position.profit_target
  actualAvgExitPrice: number     // Weighted average from sell trades
  exitPriceDelta: number
  exitPriceDeltaPct: number

  // Overall performance
  targetProfit: number           // (profit_target - target_entry) * target_qty
  actualProfit: number           // Sum of realized P&L from all trades
  profitDelta: number
  profitDeltaPct: number
}
```

**Display Timing**:
- Trigger: Position status transitions to 'closed'
- Location: Position detail view, persistent after closure
- Format: Side-by-side comparison table (mobile-responsive)

**Alternatives Considered**:
- **Delayed Analysis**: Breaks immediate feedback principle, rejected
- **Separate Report View**: Adds navigation friction, rejected

### 5. Validation Rules for Exit Trades

**Decision**: Implement multi-layered validation with inline feedback

**Rationale**:
- Prevent data integrity issues before they occur
- Clear user guidance for error correction
- Align with edge case clarifications from spec

**Validation Rules**:
```typescript
// Price validation (FR-015)
if (price < 0) throw ValidationError("Price cannot be negative")
// Allow price === 0 for expired options, worthless stocks

// Quantity validation (FR-011)
const currentOpenQty = calculateNetQuantity(position.trades)
if (exitQuantity > currentOpenQty) {
  throw ValidationError(
    `Cannot sell ${exitQuantity} shares. ` +
    `Current open quantity: ${currentOpenQty}. ` +
    `To reverse position, close this position first, ` +
    `then create new position in opposite direction.`
  )
}

// Type validation
if (trade_type !== 'sell') throw ValidationError("Exit trades must be type 'sell'")

// Position state validation
if (position.status === 'planned') {
  throw ValidationError("Cannot add exit trade to planned position. Add entry trade first.")
}
```

**UI Implementation**:
- Inline validation on quantity input field
- Show current open quantity as helper text
- Prevent form submission if validation fails
- Clear error messages with remediation steps

**Alternatives Considered**:
- **Allow Overselling with Warning**: Violates data integrity, rejected
- **Automatic Position Reversal**: Too complex for Phase 1A, deferred

### 6. Partial Exit Support

**Decision**: Support partial exits with running P&L tracking

**Rationale**:
- Professional trading technique ("take half off at target")
- Enables risk management education
- Natural extension of FIFO cost basis tracking

**Implementation**:
```typescript
interface PositionPnL {
  realizedPnL: number      // Sum of P&L from all exit trades
  unrealizedPnL: number    // P&L from remaining open quantity
  totalPnL: number         // realized + unrealized
  openQuantity: number     // Remaining after all exits
}

function calculatePositionPnL(position: Position, currentPrice: number): PositionPnL {
  // Process all trades through FIFO
  const fifoResult = processFIFO(position.trades)

  return {
    realizedPnL: fifoResult.realizedPnL,
    unrealizedPnL: fifoResult.openQuantity * (currentPrice - fifoResult.avgOpenCost),
    totalPnL: fifoResult.realizedPnL + unrealizedPnL,
    openQuantity: fifoResult.openQuantity
  }
}
```

**UI Display**:
- Position card shows both realized and unrealized P&L
- Trade history shows cumulative realized P&L after each exit
- Clear visual distinction (e.g., realized in green, unrealized in gray)

**Alternatives Considered**:
- **Full Exit Only**: Too restrictive for experienced traders, rejected
- **Separate "Partial Close" Feature**: Unnecessary abstraction, partial exits are just trades, rejected

### 7. Multi-Leg Position Support (Options Future-Proofing)

**Decision**: Use existing `underlying` field in Trade interface for instrument identification

**Rationale**:
- Trade.underlying already exists in codebase (Phase 1A: auto-populated from position.symbol)
- Enables Phase 3+ multi-leg options positions without breaking changes
- FR-013 requires "separate cost basis tracking per instrument type"

**Current Implementation** (Phase 1A):
```typescript
// Stock position: All trades have same underlying
{ underlying: "AAPL" }  // Same as position.symbol

// Future Phase 3+: Option position with multiple legs
{ underlying: "AAPL  250117C00150000" }  // Call leg
{ underlying: "AAPL  250117P00145000" }  // Put leg (different contract)
```

**FIFO Grouping by Underlying**:
```typescript
function processFIFOByUnderlying(trades: Trade[]): Map<string, FIFOResult> {
  // Group trades by underlying
  const grouped = trades.reduce((acc, trade) => {
    if (!acc.has(trade.underlying)) acc.set(trade.underlying, [])
    acc.get(trade.underlying)!.push(trade)
    return acc
  }, new Map<string, Trade[]>())

  // Process FIFO separately for each underlying
  const results = new Map<string, FIFOResult>()
  grouped.forEach((trades, underlying) => {
    results.set(underlying, processFIFO(trades))
  })

  return results
}
```

**Alternatives Considered**:
- **Single Instrument Per Position**: Breaks at Phase 3, would require data migration, rejected
- **Separate Position Per Leg**: Loses strategy relationship (e.g., covered call is one strategy, not two positions), rejected

## Technology Stack Decisions

### IndexedDB Schema Updates

**Decision**: Extend existing `positions` store, no new stores needed

**Current Schema** (TradingJournalDB v3):
```typescript
// positions store
{
  id: string
  symbol: string
  strategy_type: 'Long Stock'
  target_entry_price: number
  target_quantity: number
  profit_target: number
  stop_loss: number
  position_thesis: string
  created_date: Date
  status: 'planned' | 'open'  // EXTEND: Add 'closed'
  journal_entry_ids: string[]
  trades: Trade[]  // Already supports buy/sell
}

// trade interface (embedded in position)
{
  id: string
  position_id: string
  trade_type: 'buy' | 'sell'  // Already supports sell
  quantity: number
  price: number
  timestamp: Date
  notes?: string
  underlying: string
}

// journal_entries store (no changes needed)
{
  id: string
  position_id?: string
  trade_id?: string  // Links journal to trade
  entry_type: 'POSITION_PLAN' | 'TRADE_EXECUTION' | 'DAILY_REVIEW'
  content: string
  created_at: Date
}
```

**Migration Required**: None - all fields already exist, just extending usage

**Alternatives Considered**:
- **Separate "closed_positions" Store**: Unnecessary data duplication, rejected
- **New "exit_trades" Store**: Violates single Trade interface, rejected

### React Component Architecture

**Decision**: Extend existing position detail components with exit trade form

**Component Hierarchy**:
```
<PositionDetailPage>
  <PositionHeader />
  <PositionPlanSummary />
  <TradeHistory />         // Shows all buy/sell trades
  <AddTradeButton />       // Opens modal for entry OR exit trade
  <AddTradeModal>          // EXTEND: Support both buy/sell
    <ExitTradeForm />      // NEW: Form for sell trades
    <EntryTradeForm />     // Existing: Form for buy trades
  </AddTradeModal>
  <JournalForm />          // Existing: Reuse for trade journaling
  <PlanVsExecutionCard />  // NEW: Shows comparison when closed
</PositionDetailPage>
```

**Reuse Strategy**:
- JournalForm: 100% reuse, already supports trade linking
- TradeHistory: Extend to show buy/sell with visual distinction
- PositionService/TradeService: Extend existing methods

**Alternatives Considered**:
- **Separate "Close Position" Page**: Breaks inline workflow, rejected
- **Duplicate Journal Form for Exits**: Violates DRY principle, rejected

## Best Practices

### FIFO Implementation Best Practices

**Performance Considerations**:
- Sort trades once on load, cache sorted array
- Process FIFO calculations reactively (only when trades change)
- For large trade histories (>100 trades per position), use memoization

**Testing Strategy**:
```typescript
describe('FIFO Cost Basis', () => {
  it('matches oldest entry first', () => {/*...*/})
  it('handles partial lot matching', () => {/*...*/})
  it('tracks multiple partial exits', () => {/*...*/})
  it('matches brokerage statement example', () => {/*...*/})
  it('prevents negative quantities', () => {/*...*/})
  it('handles $0 exit price (expired options)', () => {/*...*/})
  it('calculates realized vs unrealized correctly', () => {/*...*/})
})
```

### Mobile-First UI Patterns

**Exit Trade Form** (mobile priority):
- Single-column layout for mobile
- Large touch targets (44x44px minimum)
- Inline validation with clear error messages
- Quantity input shows current open quantity as helper text
- Price input allows $0, prevents negative

**Plan vs Execution Display** (mobile responsive):
- Stack metrics vertically on mobile
- Side-by-side table on desktop
- Color coding: green = better than plan, red = worse than plan
- Percentage deltas prominent for quick scanning

### Error Handling Patterns

**Validation Errors** (user-correctable):
- Inline display next to input field
- Prevent form submission
- Clear remediation instructions

**Data Integrity Errors** (should never occur):
- Log to console for debugging
- Show generic error message to user
- Preserve data state (don't lose user input)

**IndexedDB Errors** (storage failures):
- Retry once automatically
- If retry fails, show error with option to download position data
- Preserve data in memory for manual recovery

## Summary

All research areas complete. No NEEDS CLARIFICATION items remaining. Implementation can proceed with:
- FIFO cost basis tracking using timestamp-sorted trade matching
- Automatic position status transitions based on net quantity
- Existing JournalService pattern for exit trade journaling
- Inline validation preventing overselling with clear error messages
- Partial exit support with realized/unrealized P&L tracking
- Plan vs execution comparison on position closure
- Mobile-first responsive UI extending existing component patterns

Ready for Phase 1: Data Model & Contracts design.
