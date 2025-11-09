# Add P&L and Pricing System

## Why

Users cannot currently see the profit/loss (P&L) of their positions because there is no system for tracking current market prices or calculating unrealized gains/losses. This prevents users from making informed decisions about their positions and eliminates one of the core value propositions of the application: real-time position monitoring and performance tracking.

Additionally, the current Trade entity lacks the `underlying` field needed to support future multi-leg option strategies where a single position may contain trades on different instruments (stock + option, multiple options with different strikes/expirations).

## What Changes

### Core Features
- **Manual price tracking system** with OHLC (Open/High/Low/Close) structure for each underlying instrument
- **Underlying-based pricing** where one price per instrument affects all related positions/trades
- **Real-time P&L calculation** for open positions using current prices and FIFO cost basis
- **Trade enhancement** with `underlying` field to support future multi-instrument positions
- **UI components** for price updates, P&L display, and progress indicators

### Data Model Changes
- Add `PriceHistory` entity with OHLC fields and date-based storage
- Add `underlying` field to Trade interface (auto-populated from position.symbol in Phase 1A)
- Add IndexedDB `price_history` object store with compound unique index on `[underlying, date]`

### New Services
- `PriceService` for CRUD operations on price data with validation (>20% change confirmation)
- Calculation utilities in `utils/performance.ts` for P&L computation

### UI Changes
- Add `PriceUpdateCard` component to Position Detail page
- Add `PnLDisplay` component with color-coded profit/loss
- Add `ProgressIndicator` component showing position relative to stop/target
- Update `PositionCard` to show real P&L instead of placeholder
- Update `Dashboard` to show portfolio-level P&L summary

### Phase 1A Simplifications
- Simple price input (user enters "current price", system auto-fills OHLC)
- Position-centric price updates (not portfolio-wide manager)
- Single underlying per position (stock symbol only)
- No staleness warnings (just show timestamp)

### Future-Proofing
- OHLC data structure ready for candlestick charts (Phase 1B+)
- `underlying` field supports OCC option symbols (Phase 3+)
- Architecture supports multi-leg positions without migration

## Impact

### Affected Capabilities
- **NEW**: `price-tracking` - Manual price management with OHLC structure
- **NEW**: `pnl-calculation` - P&L computation utilities
- **NEW**: `trade-enhancement` - Trade.underlying field for instrument tracking
- **NEW**: `pnl-ui-components` - UI components for price/P&L display

### Affected Code
- `src/lib/position.ts` - Add `underlying` to Trade interface
- `src/types/priceHistory.ts` - NEW: PriceHistory interface
- `src/services/PriceService.ts` - NEW: Price management service
- `src/utils/performance.ts` - NEW: P&L calculation utilities
- `src/components/PriceUpdateCard.tsx` - NEW: Price update UI
- `src/components/PnLDisplay.tsx` - NEW: P&L display component
- `src/components/ProgressIndicator.tsx` - NEW: Progress bar component
- `src/components/PositionCard.tsx` - MODIFIED: Show real P&L
- `src/pages/PositionDetail.tsx` - MODIFIED: Add price/P&L sections
- `src/pages/Dashboard.tsx` - MODIFIED: Add portfolio P&L summary
- Multiple test files - NEW/MODIFIED: Comprehensive test coverage

### Breaking Changes
None - this is purely additive functionality. Existing positions and trades continue to work. The `underlying` field on Trade is backward-compatible (computed from position.symbol if missing).

### Dependencies
- Requires Slices 0-2 to be complete (trade execution system must exist)
- No external dependencies (IndexedDB only)

### Timeline
6-8 days across 6 implementation slices with TDD approach.
