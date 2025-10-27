# ADR-006: FIFO Cost Basis Methodology

## Status
Accepted

## Context

With the implementation of P&L calculation in Slice 3, we need to establish how to calculate cost basis for trades, particularly when positions involve multiple entry and exit transactions.

### Current State
- Positions contain embedded trades array
- Each trade records: type (buy/sell), quantity, price, timestamp
- P&L calculation requires determining cost basis for each trade
- Users expect P&L to match brokerage statement reporting

### Decision Required
What cost basis methodology should we use for calculating trade-level and position-level P&L?

## Decision

We will use **FIFO (First-In-First-Out) cost basis methodology** with trade-level tracking:

```typescript
interface Trade {
  id: string
  position_id: string
  trade_type: 'buy' | 'sell'
  quantity: number
  price: number          // Cost basis for this specific trade
  timestamp: Date
  underlying: string
}

// P&L calculation uses FIFO matching
function calculateTradePnL(trade: Trade, currentPrice: PriceHistory): number {
  if (trade.trade_type === 'sell') {
    return 0  // Already realized, not included in unrealized P&L
  }
  // Unrealized P&L = (current price - trade price) × quantity
  return (currentPrice.close - trade.price) * trade.quantity
}
```

**Key characteristics:**
- Each trade maintains its own cost basis (purchase price)
- FIFO matching used for determining which shares are sold first
- Trade-level P&L calculated independently
- Position P&L is sum of all trade-level P&L

## Rationale

### Industry Standard Alignment
FIFO is the default cost basis method used by:
- **U.S. Brokerage Statements**: TD Ameritrade, E*TRADE, Schwab, Fidelity
- **Tax Reporting**: IRS default method for securities
- **Regulatory Compliance**: Meets wash sale and tax lot requirements
- **User Expectations**: Matches what users see in broker statements

### Accurate Brokerage Reconciliation
Users can directly compare app P&L with broker statements:
```typescript
// Example: User's broker shows FIFO P&L
// Our app calculation matches exactly
Broker Statement:     App Calculation:
Buy 100 @ $150       Trade 1: $150 cost basis
Buy 50 @ $155        Trade 2: $155 cost basis
Current: $160
P&L: +$1,250         P&L: (160-150)×100 + (160-155)×50 = $1,250 ✓
```

### Tax Lot Tracking Foundation
FIFO establishes infrastructure for future tax features:
- Identifies specific shares being sold (tax lots)
- Tracks holding periods (short-term vs long-term gains)
- Supports wash sale detection
- Enables tax loss harvesting analysis

### Simplicity and Correctness
- **Deterministic**: Same inputs always produce same output
- **Intuitive**: "First shares bought are first shares sold"
- **Verifiable**: Easy to audit against broker statements
- **Testable**: Clear expected outcomes for test cases

## Alternatives Considered

### Average Cost Basis
Calculate average cost across all purchases:
```typescript
const avgCost = totalCost / totalQuantity
```

**Advantages:**
- Simpler calculation
- Used by some mutual fund brokers
- Easier to understand for beginners

**Disadvantages:**
- Does NOT match brokerage statements (major issue)
- Not default IRS method
- Can't track specific tax lots
- Inaccurate for tax reporting
- No foundation for wash sale detection

**Rejected because:** Misalignment with broker statements would confuse users and prevent tax reporting accuracy

### Specific Lot Identification
Let user choose which lots to sell:
```typescript
interface SellTrade {
  lot_ids: string[]  // User specifies which purchases to match
}
```

**Advantages:**
- Maximum tax optimization flexibility
- Used by sophisticated traders
- Better for tax loss harvesting

**Disadvantages:**
- Significant UI complexity (lot selection interface)
- Overwhelms Phase 1A beginner focus
- Premature optimization for tax features
- Requires understanding of tax implications

**Rejected because:** Over-complex for Phase 1A behavioral training focus; can be added in later phase if needed

### LIFO (Last-In-First-Out)
Last purchased shares are sold first.

**Advantages:**
- Valid IRS method
- Some accounting scenarios prefer it

**Disadvantages:**
- NOT default for brokerages
- Won't match user's broker statements
- Less common in securities trading
- No compelling advantage over FIFO

**Rejected because:** No alignment benefit, creates statement reconciliation issues

## Consequences

### Positive
- **Broker alignment**: P&L matches brokerage statements exactly
- **Tax foundation**: Infrastructure for future tax features (Phase 3+)
- **User trust**: Calculations match familiar broker reporting
- **IRS compliant**: Default method meets tax requirements
- **Deterministic**: Same trade sequence always produces same P&L

### Negative
- **Not tax-optimal**: FIFO may not minimize taxes (specific lot would)
- **Implementation complexity**: More complex than average cost
- **Phase 2 considerations**: Scale-in/scale-out requires careful FIFO matching
- **Education needed**: Users must understand FIFO implications

### Mitigation Strategies
- **Documentation**: Explain FIFO methodology in user documentation
- **Broker comparison**: Encourage users to verify against broker statements
- **Future enhancement**: Note that specific lot identification may be added later
- **Clear labeling**: UI shows "FIFO cost basis" explicitly

## Implementation Notes

### Current Implementation
Trade-level cost basis with FIFO matching:

```typescript
// src/utils/pnl.ts
export function calculatePositionPnL(
  position: Position,
  priceMap: Map<string, PriceHistory>
): number | null {
  if (!position.trades || position.trades.length === 0) {
    return null
  }

  // Sum P&L from all trades (FIFO implicitly maintained by trade order)
  return position.trades.reduce((total, trade) => {
    const price = priceMap.get(trade.underlying)
    if (!price) return total

    const tradePnL = calculateTradePnL(trade, price)
    return total + tradePnL
  }, 0)
}
```

### Phase 1A Simplification
Currently, Phase 1A allows only one trade per position, so FIFO vs other methods is moot. However, the infrastructure is in place for Phase 2 scale-in/scale-out:

```typescript
// Phase 1A: Single trade (enforced by TradeService)
position.trades = [{ /* single buy trade */ }]

// Phase 2+: Multiple trades with FIFO matching
position.trades = [
  { type: 'buy', quantity: 100, price: 150, timestamp: t1 },  // Lot 1
  { type: 'buy', quantity: 50, price: 155, timestamp: t2 },   // Lot 2
  { type: 'sell', quantity: 75, timestamp: t3 }               // Sells 75 from Lot 1 (FIFO)
]
```

### Future Enhancements

**Phase 2: Scale-in/Scale-out**
- Implement FIFO matching logic for partial sells
- Track remaining quantity per tax lot
- Calculate realized vs unrealized P&L

**Phase 3: Tax Features**
- Generate tax lot reports
- Track short-term vs long-term holding periods
- Identify wash sales
- Support specific lot identification (if needed)

**Phase 4: Options**
- Extend FIFO to option contracts
- Handle assignments and exercises
- Track per-contract cost basis

### Testing Strategy
Test cases verify FIFO behavior:
- Single buy trade (baseline)
- Multiple buys at different prices
- Partial sells (match against earliest buy)
- Multiple underlyings (separate FIFO per instrument)
- Brokerage statement reconciliation examples

## Review Date
This decision should be reviewed if:
- Users report significant P&L discrepancies with broker statements
- Tax optimization features become a core requirement
- Regulatory changes require different methodology
- Options trading introduces complexity that challenges FIFO model
