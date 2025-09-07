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

**Position Model (Immutable Trade Plan):**
- Contains immutable trade plan (strategy intent, targets, stops, thesis, time horizon)
- Stores planned price levels (target_entry_price, profit_target, stop_loss)
- Planned quantity (target_quantity) and strategy parameters
- Entry date and market thesis for plan context
- Status derived from trade activity (open when net quantity > 0, closed when net quantity = 0)
- **Critical distinction**: Position represents the trader's original strategic intent and risk parameters
- **Behavioral training**: Once confirmed, plan details become uneditable to mirror real-world trading discipline
- Dollar-based risk/reward amounts computed dynamically from actual trade executions

**Trade Model (Mutable Execution Records):**
- Individual execution records (buy/sell transactions) within a position
- Each trade maintains its own actual cost basis, quantity, and execution timestamp
- Records actual market executions against the position's planned targets
- Future-proofed structure supporting both stock and options:
  - Stock: symbol, actual_quantity, actual_price, execution_date
  - Options: symbol, actual_quantity, actual_price, option_type, strike_price, expiration_date, execution_date
- Trade types: BUY, SELL, ASSIGNMENT, EXERCISE, EXPIRATION
- **Plan vs Execution tracking**: Compare actual fills against position's planned targets
- **Partial fill support**: Multiple trades can execute against a single position plan

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

## Mockup Validation (September 2025)
Phase 1A mockups validated this architecture through complete user journey simulation:
- **Position Creation Flow**: Clear separation between planning (02-position-creation-flow.html) and execution (02b-add-trade-flow.html)
- **Dashboard Integration**: Position-centric view with execution status tracking (03-position-dashboard.html)
- **Plan vs Execution Analysis**: Educational feedback during position closing (05-position-closing-flow.html)
- **Behavioral Training**: Mandatory journaling integration reinforces architectural separation

Key insight: Mockup development confirmed the critical importance of maintaining clear conceptual boundaries between strategic planning (Position) and tactical execution (Trades) for effective behavioral training.

## Review Date
To be reviewed after Phase 1A implementation and user feedback.