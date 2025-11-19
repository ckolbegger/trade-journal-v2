# ADR-008: Derived Position Status Computation

## Status
Proposed

## Context

With the implementation of position closing functionality (Feature 001-close-position), we need to decide how to manage position lifecycle status transitions between 'planned', 'open', and 'closed' states.

### Current State
- Position interface has `status: 'planned' | 'open'` field
- Status is manually managed when trades are added
- No support for 'closed' status yet
- Position status transitions are not clearly defined

### Decision Required
Should position status be:
1. **User-managed**: User explicitly marks position as open/closed
2. **Event-driven**: Status updated by service layer when trades change
3. **Derived**: Status computed on-the-fly from trade activity

## Decision

We will use **derived status computation** where position status is calculated from trade activity rather than stored or manually updated:

```typescript
// Position interface (extended for Phase 1A Slice 3)
interface Position {
  id: string
  symbol: string
  // ... immutable plan fields
  status: 'planned' | 'open' | 'closed'  // EXTENDED: Added 'closed'
  trades: Trade[]
}

// Status computation function (deterministic, no side effects)
export function computePositionStatus(position: Position): Position['status'] {
  if (position.trades.length === 0) {
    return 'planned'
  }

  const netQuantity = position.trades.reduce((net, trade) => {
    return trade.trade_type === 'buy'
      ? net + trade.quantity
      : net - trade.quantity
  }, 0)

  return netQuantity === 0 ? 'closed' : 'open'
}
```

**Key characteristics:**
- Status is **derived state**, not stored state
- Computation is **deterministic** (same trades → same status)
- Status transitions happen **automatically** as trades are added
- **No manual status updates** allowed (immutable once computed)

## Rationale

### Alignment with Constitutional Principles

**I. Behavioral Training Over Features**
- Derived status prevents manual manipulation (can't mark losing position as "closed" without actually exiting)
- Enforces honest tracking of position lifecycle
- Eliminates "gaming" the system by falsifying position status

**II. Immutability Mirrors Real Trading**
- In real trading, you can't pretend a position is closed—it either is or isn't
- Status reflects objective reality (net quantity = 0)
- No "undo" or manual override possible

**III. Plan vs Execution Separation**
- Position plan is immutable (target prices, quantities, thesis)
- Position execution (trades) drives status transitions
- Clear separation: plan doesn't change, execution determines status

### Single Source of Truth

Trades are the authoritative record of position activity:
```typescript
// Status is derived from trades (single source of truth)
const status = computePositionStatus(position)

// NOT stored separately (would create sync issues)
// ❌ position.status = 'closed'  // BAD: manual update
// ✅ computePositionStatus(position)  // GOOD: computed from trades
```

**Benefits:**
- **Consistency**: Status always matches trade reality
- **No sync bugs**: Can't get out of sync with trade data
- **Audit trail**: Status transitions are provable from trade history
- **Simplicity**: No status management logic needed

### Testability and Correctness

Derived status is easily testable:
```typescript
describe('Position Status Computation', () => {
  it('is "planned" with no trades', () => {
    const position = { trades: [], /* ... */ }
    expect(computePositionStatus(position)).toBe('planned')
  })

  it('is "open" with net quantity > 0', () => {
    const position = {
      trades: [
        { trade_type: 'buy', quantity: 100, /* ... */ }
      ],
      /* ... */
    }
    expect(computePositionStatus(position)).toBe('open')
  })

  it('is "closed" when net quantity === 0', () => {
    const position = {
      trades: [
        { trade_type: 'buy', quantity: 100, /* ... */ },
        { trade_type: 'sell', quantity: 100, /* ... */ }
      ],
      /* ... */
    }
    expect(computePositionStatus(position)).toBe('closed')
  })
})
```

**Advantages:**
- **Pure function**: No side effects, deterministic output
- **Verifiable**: Can prove correctness from trade sequence
- **Reproducible**: Same trades always produce same status

### Prevention of Invalid States

Derived status eliminates impossible states:

```typescript
// ❌ IMPOSSIBLE with manual status management:
position.status = 'closed'
position.trades = [{ type: 'buy', quantity: 100 }]  // Still has open quantity!

// ✅ IMPOSSIBLE with derived status:
// Status is computed from trades, can't be inconsistent
const status = computePositionStatus(position)  // Returns 'open' (correct)
```

**Prevented bugs:**
- Status says "closed" but trades show open quantity
- Status says "open" but trades show zero quantity
- Status manually updated without corresponding trade

### Performance Considerations

Computation is O(n) where n = number of trades:
```typescript
// Worst case: 100 trades (extreme for Phase 1A-2)
// Average case: 2-5 trades per position
// Computation time: < 1ms on mobile devices

const netQuantity = trades.reduce((net, trade) =>
  trade.trade_type === 'buy' ? net + trade.quantity : net - trade.quantity,
  0
)
```

**Acceptable because:**
- Trade counts are small (Phase 1A: 1 trade, Phase 2: 2-10 trades)
- Computation is simple arithmetic (no I/O, no async)
- Can be memoized if needed (future optimization)
- Mobile devices handle this trivially

## Alternatives Considered

### Manual Status Management

User explicitly sets status via UI action:
```typescript
// User clicks "Close Position" button
await PositionService.updateStatus(positionId, 'closed')
```

**Advantages:**
- Simple implementation
- Direct user control
- No computation overhead

**Disadvantages:**
- **Violates immutability principle**: User can falsify status
- **Sync risk**: Status can diverge from trade reality
- **Error-prone**: Requires validation to prevent invalid states
- **Manual burden**: User must remember to update status

**Rejected because:** Violates constitutional principles I (Behavioral Training), II (Immutability), and VIII (FIFO Cost Basis - which requires trade-driven state)

### Event-Driven Status Updates

Status updated by service layer when trades change:
```typescript
class TradeService {
  async addTrade(trade: Trade) {
    await this.saveTrade(trade)
    // Update status after trade added
    await this.updatePositionStatus(trade.position_id)
  }
}
```

**Advantages:**
- Status kept up-to-date automatically
- No computation on read
- Clear lifecycle hooks

**Disadvantages:**
- **Complexity**: Requires event handlers and lifecycle management
- **Sync risk**: Status update could fail while trade succeeds
- **Testability**: Harder to test state transitions (async, side effects)
- **Bug surface**: More places where status could get out of sync

**Rejected because:** Adds complexity without benefit; derived computation is simpler and safer

### Stored + Recomputed Status

Store status in database, recompute periodically to verify:
```typescript
interface Position {
  status: 'planned' | 'open' | 'closed'  // Stored
  // ...
}

// Recompute on load to verify consistency
function loadPosition(id: string): Position {
  const position = await db.get(id)
  const computedStatus = computePositionStatus(position)

  if (position.status !== computedStatus) {
    console.warn('Status mismatch detected, repairing...')
    position.status = computedStatus
    await db.save(position)
  }

  return position
}
```

**Advantages:**
- Fast reads (no computation)
- Self-healing (repairs on load)
- Audit capability (can detect corruption)

**Disadvantages:**
- **Redundant storage**: Status is duplicate information
- **Complexity**: Requires sync logic and repair mechanism
- **False security**: Repair logic suggests system can get into bad state
- **Over-engineering**: Premature optimization for non-existent problem

**Rejected because:** Adds complexity without measurable benefit; Phase 1A positions have 1-10 trades (computation is trivial)

## Consequences

### Positive

✅ **Eliminates sync bugs**: Status always matches trade reality
✅ **Enforces integrity**: Impossible to have inconsistent state
✅ **Simplifies codebase**: No status management logic needed
✅ **Testable**: Pure function with deterministic output
✅ **Auditable**: Status provably derived from trade history
✅ **Constitutional alignment**: Supports Behavioral Training and Immutability principles
✅ **Performance**: O(n) computation is negligible for Phase 1A-2 trade counts

### Negative

⚠️ **Computation overhead**: Status computed on every access (mitigated: < 1ms)
⚠️ **No explicit transition events**: Can't hook into status changes directly (mitigated: observe trade additions instead)
⚠️ **Debugging visibility**: Status changes are implicit (mitigated: add logging to computePositionStatus)

### Neutral

🔄 **Future memoization**: Can add caching layer if performance becomes issue
🔄 **Multi-leg positions**: Computation extends naturally (per-underlying net quantity)
🔄 **Options strategies**: Same logic applies (net quantity → status)

## Implementation Notes

### Phase 1A Slice 3 Implementation

Position status computation integrated into service layer:

```typescript
// src/services/PositionService.ts
import { computePositionStatus } from '@/lib/position'

class PositionService {
  async getById(id: string): Position {
    const position = await db.positions.get(id)

    // Always compute status on load (derived state)
    position.status = computePositionStatus(position)

    return position
  }

  async listOpen(): Position[] {
    const positions = await db.positions.getAll()

    // Filter using computed status
    return positions.filter(p => computePositionStatus(p) === 'open')
  }
}
```

### Display Layer Usage

React components use computed status:

```typescript
// src/components/PositionCard.tsx
import { computePositionStatus } from '@/lib/position'

function PositionCard({ position }: { position: Position }) {
  const status = computePositionStatus(position)

  return (
    <div className={`position-card status-${status}`}>
      <StatusBadge status={status} />
      {/* ... */}
    </div>
  )
}
```

### Exit Trade Validation

Position status used to prevent invalid exit trades:

```typescript
// src/services/TradeService.ts
import { computePositionStatus, calculateOpenQuantity } from '@/lib/position'

class TradeService {
  async createExitTrade(trade: Trade) {
    const position = await PositionService.getById(trade.position_id)
    const status = computePositionStatus(position)

    // Validate: cannot exit from planned position
    if (status === 'planned') {
      throw new ValidationError({
        message: 'Cannot add exit trade to planned position',
        suggestedAction: 'Add entry trade first to open the position'
      })
    }

    // Validate: cannot oversell
    const openQuantity = calculateOpenQuantity(position.trades)
    if (trade.quantity > openQuantity) {
      throw new ValidationError({
        message: `Cannot sell ${trade.quantity} shares`,
        expectedConstraint: `<= ${openQuantity} (current open quantity)`
      })
    }

    // Save trade (status will be recomputed on next read)
    await this.saveTrade(trade)
  }
}
```

### Testing Strategy

Comprehensive test coverage for status computation:

```typescript
// src/lib/__tests__/position.test.ts
describe('computePositionStatus', () => {
  describe('planned status', () => {
    it('returns "planned" for position with no trades', () => {
      const position = createTestPosition({ trades: [] })
      expect(computePositionStatus(position)).toBe('planned')
    })
  })

  describe('open status', () => {
    it('returns "open" for position with single buy trade', () => {
      const position = createTestPosition({
        trades: [createBuyTrade({ quantity: 100 })]
      })
      expect(computePositionStatus(position)).toBe('open')
    })

    it('returns "open" for position with partial exit', () => {
      const position = createTestPosition({
        trades: [
          createBuyTrade({ quantity: 100 }),
          createSellTrade({ quantity: 30 })
        ]
      })
      expect(computePositionStatus(position)).toBe('open')
      expect(calculateOpenQuantity(position.trades)).toBe(70)
    })

    it('returns "open" for scale-in position', () => {
      const position = createTestPosition({
        trades: [
          createBuyTrade({ quantity: 50, price: 100 }),
          createBuyTrade({ quantity: 50, price: 98 })
        ]
      })
      expect(computePositionStatus(position)).toBe('open')
      expect(calculateOpenQuantity(position.trades)).toBe(100)
    })
  })

  describe('closed status', () => {
    it('returns "closed" for position with full exit', () => {
      const position = createTestPosition({
        trades: [
          createBuyTrade({ quantity: 100 }),
          createSellTrade({ quantity: 100 })
        ]
      })
      expect(computePositionStatus(position)).toBe('closed')
      expect(calculateOpenQuantity(position.trades)).toBe(0)
    })

    it('returns "closed" for position with multiple entries and exits', () => {
      const position = createTestPosition({
        trades: [
          createBuyTrade({ quantity: 50, price: 100 }),
          createBuyTrade({ quantity: 50, price: 98 }),
          createSellTrade({ quantity: 60 }),
          createSellTrade({ quantity: 40 })
        ]
      })
      expect(computePositionStatus(position)).toBe('closed')
      expect(calculateOpenQuantity(position.trades)).toBe(0)
    })
  })
})
```

## Migration Strategy

### Backward Compatibility

Existing positions (Phase 1A without exit trades) work seamlessly:

```typescript
// Existing position with single buy trade
const existingPosition = {
  id: '123',
  symbol: 'AAPL',
  trades: [{ type: 'buy', quantity: 100, price: 150 }],
  // status field may or may not exist (computed on load)
}

// Computation works regardless of stored status
const status = computePositionStatus(existingPosition)  // Returns 'open'
```

**No database migration required:**
- Existing positions have no stored status or status = 'planned'/'open'
- Computation works with any stored value (always recomputed)
- Adding 'closed' status is backward compatible extension

### Forward Compatibility

Future phases extend naturally:

**Phase 2: Scale-in/Scale-out**
- Same logic: net quantity determines status
- Multiple entry trades → still 'open' until net qty = 0

**Phase 3-5: Options Strategies**
- Per-underlying net quantity calculation
- Position 'closed' when all underlyings have net qty = 0
- Computation extends to multi-leg positions

## Future Enhancements

### Memoization (if needed)

Add caching layer for positions with many trades:

```typescript
const statusCache = new WeakMap<Position, string>()

export function computePositionStatus(position: Position): Position['status'] {
  // Check cache first
  if (statusCache.has(position)) {
    return statusCache.get(position)!
  }

  // Compute status
  const status = /* ... computation logic ... */

  // Cache result
  statusCache.set(position, status)
  return status
}
```

**Trigger:** Position with > 100 trades showing performance issues
**Likelihood:** Very low (Phase 1A-2 have 1-10 trades per position)

### Status Transition Hooks

Add observer pattern if explicit transition events needed:

```typescript
class PositionService {
  private observers: Map<string, StatusObserver[]> = new Map()

  async addTrade(trade: Trade) {
    const position = await this.getById(trade.position_id)
    const oldStatus = computePositionStatus(position)

    // Add trade
    position.trades.push(trade)
    await this.save(position)

    const newStatus = computePositionStatus(position)

    // Notify observers if status changed
    if (oldStatus !== newStatus) {
      this.notifyStatusChange(position.id, oldStatus, newStatus)
    }
  }
}
```

**Trigger:** Need for status-dependent side effects (notifications, analytics)
**Likelihood:** Medium (Phase 1B daily review or Phase 3 tax features)

## Review Date

This decision should be reviewed if:
- Position trade counts exceed 100 (performance concerns)
- Status computation becomes performance bottleneck (< 1% likelihood)
- Status-dependent side effects require explicit transition events
- Multi-leg positions introduce complexity that challenges net quantity model
- User feedback indicates confusion about automatic status transitions

## Related ADRs

- **ADR-004: Embedded Trades Architecture** - Positions contain trades array (foundation for status computation)
- **ADR-006: FIFO Cost Basis Methodology** - Trade-level tracking enables status computation from net quantity

## References

- Feature Specification: `specs/001-close-position/spec.md`
- Position Interface Contract: `specs/001-close-position/contracts/Position.interface.ts`
- Constitution Principle II: Immutability Mirrors Real Trading
- Constitution Principle VIII: FIFO Cost Basis Methodology
