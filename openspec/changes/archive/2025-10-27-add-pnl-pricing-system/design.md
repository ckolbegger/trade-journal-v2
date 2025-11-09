# P&L and Pricing System - Design Document

## Context

Phase 1A currently has position planning and trade execution (Slices 0-2) but no way to track current market prices or calculate position P&L. Users cannot see whether their positions are profitable without this functionality. Additionally, the Trade entity needs future-proofing for multi-leg option strategies where a single position contains trades on different underlying instruments.

### Stakeholders
- **End Users**: Traders needing real-time P&L visibility
- **Future Development**: Phase 3+ options trading requires underlying-based pricing

### Constraints
- Privacy-first: Local storage only (IndexedDB), no external APIs
- Manual pricing: Users enter prices manually (no automatic feeds)
- Phase 1A scope: Single stock trades only, simple UI
- Future-proof: Must support multi-leg options without migration

## Goals / Non-Goals

### Goals
1. Enable users to manually update current market prices
2. Calculate and display real-time unrealized P&L for all positions
3. Future-proof data model for multi-leg option strategies
4. Provide visual feedback (progress indicators, color-coded P&L)
5. Validate price changes (require confirmation for >20% moves)
6. Support backdating prices for historical corrections

### Non-Goals (Deferred to Future Phases)
- Automatic price feeds or API integration
- Portfolio-wide price manager interface (Phase 1B)
- Advanced OHLC data entry (full open/high/low input)
- Price history visualizations or candlestick charts
- Staleness warnings or notifications

## Decisions

### Decision 1: Underlying-Based Pricing Architecture

**Choice**: Store one price per underlying instrument, not per position or trade.

**Rationale**:
- Real-world alignment: AAPL has one market price at any moment
- Efficiency: Update AAPL once, affects all AAPL positions automatically
- Multi-position support: User with 3 TSLA positions updates price once
- Future-proof: Works for covered calls (stock + option have separate underlyings)
- Eliminates redundancy: Don't store same AAPL price multiple times

**Alternatives Considered**:
1. **Store price on Position entity** - Rejected because:
   - Redundant for multiple positions in same underlying
   - Difficult to keep prices synchronized
   - Doesn't scale to multi-leg strategies
2. **Store price on Trade entity** - Rejected because:
   - Even more redundant (multiple trades per position)
   - Doesn't reflect that price is property of instrument, not trade

**Implementation**:
```typescript
// Price is property of the underlying, not position/trade
interface PriceHistory {
  underlying: string  // "AAPL" or "AAPL  250117C00150000"
  date: string        // "2024-10-25"
  close: number       // Used for all P&L calculations
  // ... OHLC fields
}

// Trades reference the underlying
interface Trade {
  underlying: string  // Links to PriceHistory
  // ...
}
```

---

### Decision 2: OHLC Structure (Not price_type Enum)

**Choice**: Use Open/High/Low/Close fields instead of `price_type: 'intraday' | 'closing'` enum.

**Rationale**:
- Industry standard financial data format
- Future visualization support (candlestick charts need OHLC)
- Simpler logic: Always use `close` field for P&L calculations
- Natural intraday updates: Just update same record with latest close
- No enum to manage or validate

**Alternatives Considered**:
1. **Single price field with type enum** - Rejected because:
   - Complicates intraday vs closing price tracking
   - Requires type checking in every calculation
   - Doesn't support future chart visualizations
2. **Separate intraday/closing tables** - Rejected because:
   - Data duplication
   - Complex synchronization logic
   - Unclear which price to use for P&L

**Phase 1A Simplification**:
- User enters only "current price" (closing price)
- System auto-fills: `open = high = low = close = user_input`
- OHLC fields are redundant in Phase 1A but data structure is ready

---

### Decision 3: Individual Records (Not Arrays)

**Choice**: Store each date as a separate `PriceHistory` record with unique `[underlying, date]` constraint.

**Rationale**:
- IndexedDB native indexing: Can query by date efficiently
- Efficient latest price queries: Don't need to read entire array
- Can query "all underlyings updated today" for future features
- Standard database pattern
- Supports pagination for large price histories

**Alternatives Considered**:
1. **Array of prices in single record** - Rejected because:
   ```typescript
   interface PriceHistory {
     underlying: string
     prices: Array<{date: string, price: number}>  // Array approach
   }
   ```
   - Can't query by date using IndexedDB indexes
   - Must read entire array to get latest price
   - No partial updates (must read/modify/write entire array)
   - Can't query "what was updated today"

**Implementation**:
```typescript
// Individual record approach
interface PriceHistory {
  id: string
  underlying: string  // Indexed
  date: string        // Indexed
  close: number
  // ... OHLC
}

// IndexedDB compound unique index
[underlying, date] → unique constraint
```

---

### Decision 4: Trade.underlying Field Auto-Population

**Choice**: Add `underlying` field to Trade interface now, auto-populate from `position.symbol` in Phase 1A.

**Rationale**:
- Prevents future data migration when options are added
- Field is invisible to Phase 1A users (auto-populated)
- Enables future multi-leg positions without breaking changes
- Minimal complexity (one line of code in TradeService)

**Phase 1A Behavior**:
```typescript
// In TradeService.addTrade()
const trade: Trade = {
  underlying: position.symbol,  // Auto-populate
  // ... other fields
}
```

**Future Behavior (Phase 3+)**:
```typescript
// Options use OCC symbol format
const trade: Trade = {
  underlying: "AAPL  250117C00150000",  // OCC symbol
  // ...
}
```

**Backward Compatibility**:
- Existing trades without `underlying` field: Compute from position.symbol
- No database migration needed
- New trades require `underlying` field

---

### Decision 5: Close Price for All Calculations

**Choice**: Always use `PriceHistory.close` for P&L calculations, never open/high/low.

**Rationale**:
- Consistent methodology across all calculations
- Matches brokerage statements (use closing price for valuations)
- Clear semantic: "close" is the official price of the day
- Eliminates confusion about which price to use

**Implementation**:
```typescript
function calculateTradePnL(trade: Trade, priceHistory: PriceHistory): number {
  // ALWAYS use close price
  return (priceHistory.close - trade.price) * trade.quantity
}
```

---

### Decision 6: On-Demand P&L Calculation (Not Stored)

**Choice**: Calculate P&L on-demand when rendering components, don't store in database.

**Rationale**:
- Always accurate (no stale data risk)
- Simple architecture (no synchronization logic)
- Sufficient performance for Phase 1A (<100 positions)
- Easy to test and debug

**Alternatives Considered**:
1. **Store P&L in Position entity** - Rejected because:
   - Must keep synchronized with price updates
   - Risk of stale data
   - More complex update logic
   - Can lead to inconsistencies

**Performance Considerations**:
- Phase 1A: ~10-20 positions → negligible calculation overhead
- Future optimization: Memoize calculations if performance degrades
- Batch price fetches for dashboard (already planned)

---

### Decision 7: Position-Centric Price Updates (Phase 1A)

**Choice**: Update prices from Position Detail page, not global price manager.

**Rationale**:
- Simple workflow for Phase 1A users
- Clear context (updating TSLA while viewing TSLA position)
- Most users have one position per underlying
- Aligns with mockup design (04-position-detail-view.html)
- Can add global manager in Phase 1B without breaking changes

**Phase 1B Enhancement**:
- Add portfolio-wide price manager
- "Update all holdings" workflow
- Batch price updates during daily review

---

### Decision 8: Validation with Confirmation (>20% Change)

**Choice**: Require user confirmation when price changes >20% from last known price.

**Rationale**:
- Prevents accidental fat-finger errors
- Catches unrealistic price movements
- User can still confirm intentional large moves
- 20% threshold is reasonable for daily price volatility

**Implementation**:
```typescript
async validatePriceUpdate(underlying: string, newPrice: number) {
  const lastPrice = await this.getLatestPrice(underlying)
  if (!lastPrice) return { valid: true, requiresConfirmation: false }

  const percentChange = Math.abs((newPrice - lastPrice.close) / lastPrice.close)

  if (percentChange > 0.20) {
    return {
      valid: true,
      requiresConfirmation: true,
      message: `Price changed ${(percentChange * 100).toFixed(1)}% from last update.`
    }
  }

  return { valid: true, requiresConfirmation: false }
}
```

---

### Decision 9: Backdating Support with Default to Today

**Choice**: Support backdating prices but default date picker to today.

**Rationale**:
- Most common use case: Update today's price
- Allows corrections: "I forgot to update Friday's price"
- Allows historical data entry for new positions
- No additional complexity (date picker standard HTML input)

**Use Cases**:
- Daily update: User enters today's closing price (default)
- Correction: User backdates to fix yesterday's typo
- Historical: User enters week of prices when creating new position

---

### Decision 10: Show "—" for Missing Price Data

**Choice**: Display "—" for P&L when no PriceHistory exists, don't estimate from target_entry_price.

**Rationale**:
- Honest data display (don't fake P&L with estimates)
- Encourages user to update prices (clear call-to-action)
- Avoids misleading information
- Clear visual distinction between planned and open-with-data positions

**Alternative Rejected**:
- Use `target_entry_price` as estimate for missing price
- Rejected because it's not real market data

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     UI Layer                                 │
├─────────────────────────────────────────────────────────────┤
│  PositionDetail          Dashboard           PositionCard    │
│  ┌─────────────┐         ┌────────┐         ┌────────────┐  │
│  │PriceUpdate  │         │P&L     │         │P&L Display │  │
│  │Card         │         │Summary │         │            │  │
│  └─────────────┘         └────────┘         └────────────┘  │
│  ┌─────────────┐                                             │
│  │Progress     │                                             │
│  │Indicator    │                                             │
│  └─────────────┘                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Calculation Layer                           │
├─────────────────────────────────────────────────────────────┤
│  utils/performance.ts                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ calculateTradePnL(trade, priceHistory)               │  │
│  │ calculatePositionPnL(trades, priceHistoryMap)        │  │
│  │ getPriceMapForPosition(position, priceService)       │  │
│  │ calculatePnLPercentage(pnl, costBasis)               │  │
│  │ calculateProgressToTarget(position, currentPrice)    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Service Layer                               │
├─────────────────────────────────────────────────────────────┤
│  PriceService                                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ updatePrice(underlying, date, close, options)        │  │
│  │ getLatestPrice(underlying)                           │  │
│  │ getPriceHistory(underlying, options)                 │  │
│  │ validatePriceUpdate(underlying, newPrice)            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer (IndexedDB)                     │
├─────────────────────────────────────────────────────────────┤
│  price_history object store                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ PriceHistory {                                       │  │
│  │   id: string                                         │  │
│  │   underlying: string     [indexed]                   │  │
│  │   date: string           [indexed]                   │  │
│  │   open, high, low, close: number                     │  │
│  │   updated_at: Date                                   │  │
│  │ }                                                    │  │
│  │                                                       │  │
│  │ Unique constraint: [underlying, date]                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  positions object store (existing)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Position {                                           │  │
│  │   trades: Trade[]                                    │  │
│  │ }                                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Trade interface (embedded in Position)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Trade {                                              │  │
│  │   underlying: string  [NEW FIELD]                   │  │
│  │   price: number       [execution price/cost basis]  │  │
│  │   quantity: number                                   │  │
│  │   trade_type: 'buy' | 'sell'                         │  │
│  │ }                                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Example

**User updates TSLA price:**

1. User enters $265.00 in PriceUpdateCard for date 2024-10-25
2. PriceService.validatePriceUpdate() checks if >20% change
3. If validation passes, PriceService.updatePrice() creates/updates record:
   ```typescript
   {
     id: uuid(),
     underlying: "TSLA",
     date: "2024-10-25",
     open: 265.00,   // Auto-filled
     high: 265.00,   // Auto-filled
     low: 265.00,    // Auto-filled
     close: 265.00,  // User input
     updated_at: new Date()
   }
   ```
4. Dashboard re-renders, calls calculatePositionPnL() for each position
5. For TSLA position:
   - Get priceHistory for "TSLA" from PriceService
   - For each trade, call calculateTradePnL(trade, priceHistory)
   - Sum to get position P&L
6. PnLDisplay component shows color-coded result

## Risks / Trade-offs

### Risk 1: Performance Degradation with Many Positions

**Risk**: On-demand P&L calculation may be slow with 100+ positions.

**Mitigation**:
- Phase 1A target: <20 positions (acceptable performance)
- Batch price fetches for dashboard: `getAllLatestPrices()` returns Map
- Memoize expensive calculations in React components
- Monitor performance, optimize if needed in Phase 1B

**Trade-off**: Simplicity now vs future optimization work

---

### Risk 2: OHLC Data Redundancy in Phase 1A

**Risk**: All OHLC fields contain same value (open=high=low=close), wasting storage.

**Mitigation**:
- Storage cost is negligible (4 numbers vs 1 number)
- Future payoff: No migration when adding full OHLC entry
- Enables candlestick charts in Phase 1B without schema changes

**Trade-off**: Minor storage inefficiency vs future-proofing

---

### Risk 3: User Forgetting to Update Prices

**Risk**: P&L shows "—" until user updates price, may confuse users.

**Mitigation**:
- Clear UI messaging: "Update price to see P&L"
- Timestamp display: "Last updated: 2 hours ago"
- Phase 1B: Daily review workflow prompts for price updates
- Educational onboarding: Explain manual pricing model

**Trade-off**: Manual effort vs privacy-first design

---

### Risk 4: Complex Validation Logic

**Risk**: Price validation (>20% confirmation) adds UI complexity.

**Mitigation**:
- Comprehensive test coverage for validation
- Clear user-facing error messages
- Validation in service layer (testable in isolation)
- Simple confirmation dialog (not blocking workflow)

**Trade-off**: Extra confirmation step vs error prevention

---

## Migration Plan

### Phase 1A (This Change)
1. Add `price_history` object store to IndexedDB (no version bump)
2. Add `underlying` field to Trade interface (backward compatible)
3. Existing trades: Compute `underlying` from `position.symbol` on read
4. New trades: Require `underlying` field in validation

### Phase 1B Enhancements
1. Add portfolio-wide price manager UI
2. Enable full OHLC data entry in daily review
3. Add price history visualizations

### Phase 3 Options Support
1. Use OCC symbol format for `underlying` field
2. Multi-leg positions: Each trade has different underlying
3. No data migration needed (architecture already supports it)

### Rollback Plan
If P&L system has critical issues:
1. Disable price update UI (hide PriceUpdateCard)
2. Show "—" for all P&L (graceful degradation)
3. price_history data remains in IndexedDB (no data loss)
4. Can re-enable after fix

## Open Questions

None - all design decisions have been made and validated through brainstorming session.

## Performance Targets

- **Price update**: <500ms (includes validation + IndexedDB write)
- **P&L calculation**: <100ms per position (single underlying)
- **Dashboard load**: <1s with 20 positions
- **Progress indicator render**: <50ms

## Security Considerations

- No external data: All prices manually entered (privacy-first)
- No API keys or authentication needed
- IndexedDB is origin-scoped (browser security model)
- No XSS risk (React escapes by default)

## Accessibility

- Keyboard navigation for price update form
- ARIA labels for P&L values ("Profit: $500" / "Loss: $200")
- Color-blind friendly: Use icons + color for profit/loss
- Screen reader support for progress indicators
