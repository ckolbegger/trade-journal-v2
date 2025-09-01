# ADR-001: Position vs Trade Architecture with FIFO Cost Basis

## Status
Accepted

## Context
The trading position tracker needs to handle a wide range of scenarios from simple stock trades to complex multi-leg option strategies. Key requirements include:

- Track immutable trade plans while allowing flexible execution
- Handle partial fills, scale-ins, and position adjustments  
- Support simple stock trades through complex option strategies
- Calculate accurate P&L that matches brokerage statements
- Enable behavioral training through plan vs execution tracking
- Future-proof for options strategies without over-engineering Phase 1

## Decision
We will implement a **Position vs Trade separation architecture** with **trade-level FIFO cost basis tracking**.

### Architecture Components

**Position Model:**
- Contains immutable trade plan (strategy intent, targets, stops, thesis)
- Stores per-share/per-contract price levels (target_price, stop_price) 
- Planned quantity and strategy parameters
- Status derived from trade activity (open when net quantity > 0, closed when net quantity = 0)
- Dollar amounts (profit_target_$, max_loss_$) computed from actual trades

**Trade Model:**
- Individual execution records (buy/sell transactions)
- Each trade maintains its own cost basis and timestamp
- Future-proofed structure supporting both stock and options:
  - Stock: symbol, quantity, price
  - Options: symbol, quantity, price, option_type, strike_price, expiration_date
- Trade types: BUY, SELL, ASSIGNMENT, EXERCISE, EXPIRATION

**P&L Calculation:**
- Trade-level cost basis tracking with FIFO matching for exits
- Position P&L = sum of all trade-level P&L within the position
- Separate cost basis tracking per instrument type (stock vs each unique option contract)
- Unrealized P&L calculated on remaining net quantity after FIFO matching

## Alternatives Considered

### Alternative 1: Position-Level Average Cost Basis
**Rejected because:**
- Doesn't match brokerage statement calculations
- Cannot handle mixed stock/options positions (can't average $150/share with $5/contract)
- Less precise P&L tracking for complex strategies

### Alternative 2: Single Trade Entity (No Position Separation)  
**Rejected because:**
- Cannot track immutable trade plans separately from execution
- Difficult to model multi-leg strategies as cohesive units
- Poor support for behavioral training (plan vs execution analysis)

### Alternative 3: LIFO or Average Cost for Exit Matching
**Rejected because:**
- FIFO is default for most brokerages
- FIFO provides most accurate tax reporting foundation
- User familiarity with FIFO from brokerage statements

## Consequences

### Positive
- **Accurate P&L tracking** that matches brokerage statements exactly
- **Behavioral training support** through immutable plan vs flexible execution tracking
- **Scalability** from simple stock trades to complex multi-leg option strategies
- **Future-proof** design accommodating options without architectural changes
- **Plan deviation tracking** by comparing position intent with actual trade execution
- **Partial fill handling** through natural trade aggregation within positions

### Negative
- **Increased complexity** in P&L calculations requiring FIFO matching logic
- **More complex data model** with position-trade relationships to maintain
- **Performance considerations** for positions with many trades (mitigated by typical trading patterns)

### Neutral
- **Learning curve** for developers unfamiliar with trading concepts
- **Additional testing complexity** for multi-trade scenarios

## Implementation Notes

### Data Integrity
- UI workflows prevent orphaned trades (position-first creation)
- Positions become immutable after confirmation
- Trades remain editable for execution corrections
- Position closure automated when net quantity reaches zero

### Cost Basis Matching
```
Example FIFO Calculation:
Position: 100 AAPL shares
- Trade 1: Buy 100 @ $150
- Trade 2: Buy 100 @ $148  
- Trade 3: Sell 50 @ $155

FIFO Matching: Sell uses Trade 1's $150 basis
Remaining: 50 shares @ $150 (Trade 1) + 100 shares @ $148 (Trade 2)
```

### Future Options Support
Options trades use same Trade model with additional fields:
- `option_type`: 'CALL' | 'PUT' 
- `strike_price`: number
- `expiration_date`: date

Each option leg becomes separate trade within position, enabling complex strategy modeling.

## Related Decisions
- MVP excludes dividends/splits (ADR-002 to be created when addressing)
- Trade types extensible for future corporate actions
- Local storage architecture supports this data model

## Review Date
To be reviewed after Phase 1A implementation and user feedback.