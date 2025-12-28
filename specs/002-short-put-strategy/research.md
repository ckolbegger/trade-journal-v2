# Research: Short Put Strategy Support

**Feature**: 002-short-put-strategy | **Date**: 2025-12-27

This document captures research findings and technical decisions for implementing short put option strategies.

---

## 1. OCC Symbol Format

**Question**: What is the correct OCC symbol format and how should it be generated?

**Decision**: Use standard OCC (Options Clearing Corporation) format: `SYMBOL YYMMDDTSSSSSSSS`

**Format Breakdown**:
- **SYMBOL** (6 characters): Underlying symbol, left-aligned, space-padded
- **YYMMDD** (6 characters): Expiration date
- **T** (1 character): Option type - `P` for put, `C` for call
- **SSSSSSSS** (8 characters): Strike price × 1000, zero-padded

**Examples**:
- AAPL $105 Put expiring Jan 17, 2025: `AAPL  250117P00105000`
- TSLA $250 Call expiring Mar 21, 2025: `TSLA  250321C00250000`
- SPY $450.50 Put expiring Feb 14, 2025: `SPY   250214P00450500`

**Implementation Notes**:
```typescript
function generateOccSymbol(
  symbol: string,
  expiration: Date,
  type: 'put' | 'call',
  strike: number
): string {
  const paddedSymbol = symbol.padEnd(6, ' ')
  const dateStr = format(expiration, 'yyMMdd')
  const typeChar = type === 'put' ? 'P' : 'C'
  const strikeInt = Math.round(strike * 1000)
  const strikeStr = strikeInt.toString().padStart(8, '0')
  return `${paddedSymbol}${dateStr}${typeChar}${strikeStr}`
}
```

**Rationale**: OCC format is the industry standard used by all major brokerages. Using this format ensures consistency with brokerage statements and enables future import/export features.

**Alternatives Considered**:
- Custom format (e.g., `AAPL-P-105-2025-01-17`): Rejected because it differs from brokerage statements
- Separate fields without combined symbol: Rejected because OCC symbol provides natural grouping key for FIFO

---

## 2. Intrinsic and Extrinsic Value Calculation

**Question**: How should intrinsic and extrinsic values be calculated for options?

**Decision**: Use standard Black-Scholes decomposition formulas

**Put Option Formulas**:
```
Intrinsic Value = max(0, Strike Price - Stock Price)
Extrinsic Value = Option Price - Intrinsic Value
```

**Key Behaviors**:
- **ITM (In-the-Money)**: Stock < Strike → Intrinsic > 0
- **ATM (At-the-Money)**: Stock ≈ Strike → Intrinsic ≈ 0
- **OTM (Out-of-Money)**: Stock > Strike → Intrinsic = 0

**Edge Cases**:
| Scenario | Stock | Strike | Option | Intrinsic | Extrinsic |
|----------|-------|--------|--------|-----------|-----------|
| Deep ITM | $90 | $100 | $11.00 | $10.00 | $1.00 |
| ATM | $100 | $100 | $3.00 | $0.00 | $3.00 |
| OTM | $110 | $100 | $1.00 | $0.00 | $1.00 |
| Deep ITM, cheap | $85 | $100 | $14.00 | $15.00 | -$1.00 |

**Important**: Extrinsic can be negative for deep ITM options trading below parity. This is valid and should be displayed as-is (not floored to 0).

**Implementation**:
```typescript
interface IntrinsicExtrinsicResult {
  intrinsicPerContract: number
  extrinsicPerContract: number
  intrinsicTotal: number
  extrinsicTotal: number
}

function calculatePutIntrinsicExtrinsic(
  stockPrice: number,
  strikePrice: number,
  optionPrice: number,
  contracts: number
): IntrinsicExtrinsicResult {
  const intrinsicPerContract = Math.max(0, strikePrice - stockPrice)
  const extrinsicPerContract = optionPrice - intrinsicPerContract
  const multiplier = contracts * 100

  return {
    intrinsicPerContract,
    extrinsicPerContract,
    intrinsicTotal: intrinsicPerContract * multiplier,
    extrinsicTotal: extrinsicPerContract * multiplier
  }
}
```

**Rationale**: Industry-standard calculation. Negative extrinsic is theoretically possible and provides educational value showing when options trade below theoretical value.

---

## 3. Option P&L Calculation Methodology

**Question**: How should unrealized and realized P&L be calculated for short puts?

**Decision**: Use credit/debit methodology consistent with short positions

**Short Put P&L Formulas**:
```
Unrealized P&L = (Premium Received - Current Option Price) × Contracts × 100
Realized P&L = (Sell Price - Buy Price) × Contracts × 100
```

**Sign Convention**:
- **Positive P&L**: Option price decreased (profitable for short seller)
- **Negative P&L**: Option price increased (loss for short seller)

**Examples**:
| Scenario | Sold At | Current/Closed At | Contracts | P&L |
|----------|---------|-------------------|-----------|-----|
| Profitable close | $3.00 | $1.00 | 2 | +$400 |
| Loss close | $3.00 | $5.00 | 2 | -$400 |
| Expire worthless | $3.00 | $0.00 | 2 | +$600 |
| Unrealized gain | $3.00 | $2.00 | 2 | +$200 |

**FIFO Matching**: When multiple STO trades exist for the same OCC symbol, BTC trades match against oldest STO first.

**Implementation Note**: Extend existing `PnLCalculator` to handle `trade_kind: 'option'` with the inverted sign convention (short positions profit when price decreases).

---

## 4. IndexedDB Schema Migration Strategy

**Question**: How should new option fields be added without breaking existing data?

**Decision**: Use runtime migration with default values, increment schema version

**Migration Approach**:
1. Increment `TradingJournalDB` version to trigger upgrade
2. Add new fields as optional in TypeScript interfaces
3. Apply default values during read operations (lazy migration)
4. New required fields only enforced on new records

**Existing Position Migration**:
```typescript
// In PositionService.getById / getAll
if (!position.strategy_type) {
  position.strategy_type = 'Long Stock'  // Default for existing
}
if (!position.trade_kind) {
  position.trade_kind = 'stock'  // Infer from strategy_type
}
```

**New Optional Fields** (null for existing positions):
- `option_type`: null (stock positions)
- `strike_price`: null (stock positions)
- `expiration_date`: null (stock positions)
- `profit_target_basis`: default to `'stock_price'`
- `stop_loss_basis`: default to `'stock_price'`

**Rationale**: Lazy migration avoids expensive batch updates. Existing data remains functional while new features are opt-in.

**Version Increment**:
- Current: v3
- New: v4 (triggers `onupgradeneeded` event on first load)

---

## 5. Assignment Workflow State Machine

**Question**: How should the assignment process be orchestrated?

**Decision**: Multi-step modal workflow with atomic transaction

**State Flow**:
```
INITIATED → CONTRACTS_CONFIRMED → STOCK_PLAN_ENTERED → JOURNAL_WRITTEN → COMPLETED
```

**Workflow Steps**:
1. **Initiate**: User clicks "Record Assignment" on open short put
2. **Confirm Contracts**: Display contracts to assign (default: all open), allow partial
3. **Create Stock Plan**: Auto-populate symbol, quantity (contracts × 100), cost basis (strike - premium). User enters thesis.
4. **Journal Entry**: Assignment-specific prompts (FR-035)
5. **Complete**: Atomic transaction creates:
   - BTC trade at $0.00 on option position
   - New stock position in "open" status
   - Buy trade for stock at strike price
   - Journal entry linked to both positions

**Rollback**: If any step fails, entire transaction is rolled back. No partial state.

**Implementation**:
```typescript
class AssignmentService {
  async recordAssignment(
    optionPositionId: string,
    contractsAssigned: number,
    stockThesis: string,
    assignmentNotes: string
  ): Promise<{
    closedOptionPosition: Position
    newStockPosition: Position
    assignmentEvent: AssignmentEvent
  }>
}
```

**Rationale**: Modal workflow provides guided experience for complex multi-entity operation. Atomic transaction ensures data consistency.

---

## 6. Price Entry Sharing Architecture

**Question**: How should prices be shared across positions using the same instrument?

**Decision**: Use instrument-based lookup with date key, following existing `PriceHistory` pattern

**Current Architecture**:
- `PriceHistory` indexed by `underlying` (stock symbol or OCC symbol) + `date`
- Compound unique index ensures one price per instrument per day

**Extension for Options**:
- Option prices stored with `underlying` = OCC symbol
- Stock prices stored with `underlying` = ticker symbol
- Positions with same underlying automatically share prices

**Price Update Flow**:
1. User initiates price update on position
2. System identifies all unique instruments in position (stock + each OCC symbol)
3. For each instrument, check if price exists for today
4. Pre-fill existing prices, prompt only for missing
5. Save all prices in single transaction
6. All positions using these instruments update automatically

**Staleness Detection**:
```typescript
function getRequiredInstruments(position: Position): string[] {
  const instruments = new Set<string>()
  instruments.add(position.symbol)  // Underlying stock
  for (const trade of position.trades) {
    if (trade.occ_symbol) {
      instruments.add(trade.occ_symbol)  // Each option contract
    }
  }
  return Array.from(instruments)
}

function checkPriceStaleness(
  position: Position,
  priceMap: Map<string, PriceHistory>,
  today: string
): string[] {
  const required = getRequiredInstruments(position)
  return required.filter(inst => {
    const price = priceMap.get(inst)
    return !price || price.date !== today
  })
}
```

**Rationale**: Extends existing pattern without architectural changes. Shared prices reduce data entry burden and ensure consistency.

---

## 7. Form Validation Strategy

**Question**: How should inline validation be implemented for option forms?

**Decision**: Real-time validation with field-level error display

**Validation Timing**:
- **On Blur**: Validate field when focus leaves
- **On Change**: Clear error when user starts correcting
- **On Submit**: Validate all fields, focus first error

**Option-Specific Validations**:
| Field | Rule | Error Message |
|-------|------|---------------|
| expiration_date | Future date | "Expiration must be a future date" |
| strike_price | > 0 | "Strike price must be greater than 0" |
| premium (optional) | > 0 when provided | "Premium must be greater than 0" |
| stop_loss (optional) | > 0 when provided | "Stop loss must be greater than 0" |
| quantity | Integer > 0 | "Quantity must be a positive whole number" |

**Trade-Specific Validations**:
| Action | Rule | Error Message |
|--------|------|---------------|
| STO | Before expiration | "Sell-to-open only allowed before expiration" |
| BTC | quantity ≤ open | "Cannot close more contracts than open" |
| Expired | On/after expiration | "Expiration recording only allowed on/after expiration date" |
| Assigned | On/after expiration | "Assignment recording only allowed on/after expiration date" |

**Implementation Pattern**:
```typescript
interface FieldError {
  field: string
  message: string
}

function validateOptionTrade(
  trade: Partial<OptionTrade>,
  position: Position
): FieldError[] {
  const errors: FieldError[] = []

  if (trade.action === 'STO' && isAfter(new Date(), position.expiration_date)) {
    errors.push({
      field: 'action',
      message: 'Sell-to-open only allowed before expiration'
    })
  }

  // ... more validations
  return errors
}
```

**Rationale**: Real-time feedback improves UX. Field-level errors match FR-049/FR-050 requirements.

---

## 8. Component Architecture for Options

**Question**: How should option-specific UI components be organized?

**Decision**: Extend existing components with conditional rendering, new components for option-only features

**Existing Component Extensions**:
- `PositionCard`: Add `strategy_type` badge, option fields (strike, expiration, premium)
- `PositionForm`: Add option plan fields conditionally when `strategy_type === 'Short Put'`
- `TradeForm`: Add option trade fields (action selector, price label change)
- `PositionDetail`: Add intrinsic/extrinsic section

**New Components**:
- `IntrinsicExtrinsicDisplay`: Breakdown component with per-contract and total values
- `AssignmentModal`: Multi-step workflow for assignment recording
- `StrategyBadge`: Reusable badge component for strategy type display
- `OccSymbolDisplay`: Formatted OCC symbol with human-readable breakdown

**Composition Pattern**:
```tsx
// PositionCard conditionally renders option fields
<PositionCard position={position}>
  {position.trade_kind === 'option' && (
    <OptionSummary
      strike={position.strike_price}
      expiration={position.expiration_date}
      premium={calculatePremiumReceived(position.trades)}
    />
  )}
</PositionCard>
```

**Mobile-First Considerations**:
- Touch-friendly date picker for expiration
- Number pad input type for strike/premium
- Collapsible sections for detailed option data
- Bottom sheet for assignment modal on mobile

---

## 9. Strategy Type Extensibility

**Question**: How should the design support future strategies (covered calls, spreads)?

**Decision**: Use `strategy_type` discriminator with type-safe unions

**Type Design**:
```typescript
type StrategyType = 'Long Stock' | 'Short Put' | 'Covered Call' | 'Cash Secured Put'

interface BasePosition {
  id: string
  symbol: string
  strategy_type: StrategyType
  // common fields...
}

interface StockPosition extends BasePosition {
  trade_kind: 'stock'
  strategy_type: 'Long Stock'
}

interface OptionPosition extends BasePosition {
  trade_kind: 'option'
  strategy_type: 'Short Put' | 'Covered Call' | 'Cash Secured Put'
  option_type: 'put' | 'call'
  strike_price: number
  expiration_date: Date
}

type Position = StockPosition | OptionPosition
```

**Trade Action Mapping**:
| Strategy | Valid Actions |
|----------|---------------|
| Long Stock | buy, sell |
| Short Put | STO, BTC, expired, assigned |
| Covered Call (future) | STO, BTC, expired, exercised |
| Long Call (future) | BTO, STC, expired, exercise |

**Rationale**: Discriminated unions enable type-safe conditional logic. Adding new strategies requires only extending the union types.

---

## Summary

| Topic | Decision |
|-------|----------|
| OCC Symbol | Standard OCC format, 21 characters |
| Intrinsic/Extrinsic | Standard formulas, allow negative extrinsic |
| Option P&L | Credit/debit methodology, FIFO per OCC |
| Schema Migration | Lazy migration with defaults, v4 |
| Assignment | Multi-step modal with atomic transaction |
| Price Sharing | Instrument-based lookup, existing pattern |
| Validation | Real-time inline, field-level errors |
| Component Architecture | Extend existing + new option-specific |
| Extensibility | Discriminated union types |

All NEEDS CLARIFICATION items from Technical Context have been resolved.
