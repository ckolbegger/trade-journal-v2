# ADR-004: Embedded Trades Architecture

## Status
Proposed

## Context

With the implementation of trade execution functionality in Phase 1A, we need to decide how to model the relationship between Position and Trade entities in our data architecture.

### Current State
- Position objects contain immutable trade plans (target prices, quantities, thesis)
- No trade execution has been implemented yet
- Position status is currently hardcoded as 'planned'

### Decision Required
How should we store and relate Trade entities to Position entities for optimal performance across both position-centric workflows and future analytics requirements?

## Decision

We will use an **embedded trades architecture** where trades are stored as arrays within Position objects:

```typescript
interface Position {
  id: string;
  symbol: string;
  strategy_type: 'Long Stock';
  target_entry_price: number;
  target_quantity: number;
  profit_target: number;
  stop_loss: number;
  position_thesis: string;
  created_date: Date;
  status: 'planned' | 'open' | 'closed';  // computed from trades
  journal_entry_ids: string[];
  trades: Trade[];  // Embedded trade array
}

interface Trade {
  id: string;
  timestamp: Date;
  trade_type: 'buy' | 'sell';
  quantity: number;
  price: number;
  // Future: option-specific fields
}
```

## Rationale

### Primary Optimization: Position-Centric Workflows
This architecture optimizes for the application's core use case - position-centric workflows where users:
- View individual position details with complete trade history
- Track plan vs execution for a specific position
- Perform position-level P&L calculations
- Conduct position-by-position reviews

### Analytics Concerns Addressed
While embedded trades could complicate cross-position analytics, we mitigate this through **extraction-based analytics**:

```typescript
// One-time extraction for analytics when needed
const allTrades = positions.flatMap(pos =>
  pos.trades.map(trade => ({
    ...trade,
    positionId: pos.id,
    symbol: pos.symbol,
    targetEntryPrice: pos.target_entry_price
  }))
);

// Analytics focus on plan execution fidelity
analyzeExecutionFidelity(allTrades, positions);
```

### Alignment with App Philosophy
- **Plan Execution Focus**: Analytics emphasize faithful execution of immutable trade plans rather than individual trade performance
- **Position Mental Model**: Matches trader's conceptual model where "positions contain their execution history"
- **Behavioral Training**: Position-centric design reinforces systematic decision-making habits

### Technical Benefits
- **Data Locality**: Complete position context available in single IndexedDB query
- **Memory Efficiency**: No cross-entity joins required for position workflows
- **Simplicity**: Fewer entity relationships to manage
- **Performance**: Optimal for mobile-first responsive design requirements

## Alternatives Considered

### Separate Trades Table
```typescript
interface Trade {
  id: string;
  positionId: string;  // Foreign key reference
  // ... other fields
}
```

**Advantages:**
- Easier cross-position trade queries
- Better performance for trade-centric analytics
- Cleaner separation of concerns

**Disadvantages:**
- Requires joins for position detail views (primary use case)
- Adds complexity to position-level operations
- Less intuitive mental model for position-centric app
- Over-optimization for analytics that may not be core to app mission

### Hybrid Approach (Dual Storage)
Maintain both embedded trades and separate trade records.

**Rejected due to:**
- Significant complexity overhead
- Data synchronization concerns
- Over-engineering for current requirements

## Consequences

### Positive
- Optimal performance for position-centric workflows (Phase 1A focus)
- Simple implementation and maintenance
- Clear mental model alignment
- Analytics capabilities preserved through extraction pattern

### Negative
- Cross-position analytics require extraction step
- Large trading histories could increase position object size
- Real-time pattern detection less efficient (acceptable for evening review workflow)

### Mitigation Strategies
- Implement trade extraction utilities for analytics
- Monitor position object sizes and implement archiving if needed
- Focus analytics on plan execution fidelity rather than individual trade performance

## Implementation Notes

- Position status ('planned' | 'open' | 'closed') computed from trades array
- FIFO cost basis calculations operate on position's trade array
- Journal entries reference position-level activities
- Future option trades extend Trade interface without architectural changes

## Review Date
This decision should be reviewed if:
- Analytics requirements significantly expand beyond plan execution fidelity
- Position object sizes create performance issues
- Real-time pattern detection becomes a core requirement