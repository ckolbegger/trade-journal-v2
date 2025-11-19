# Architecture Decisions: Position Closing Feature

**Feature:** 001-close-position
**Date:** 2025-11-09
**Status:** Planning Complete

This document maps architectural decisions made during the design of the position closing feature to formal Architecture Decision Records (ADRs) in `/docs`.

## Summary

The position closing feature introduces the ability to record exit trades and automatically transition positions to 'closed' status when net quantity reaches zero. This feature relies on two critical architectural decisions:

1. **FIFO Cost Basis Methodology** - How we calculate realized P&L when exit trades are executed
2. **Derived Position Status** - How we determine whether a position is planned/open/closed

Both decisions are grounded in the project's Constitutional Principles, particularly:
- **Principle II: Immutability Mirrors Real Trading**
- **Principle VIII: FIFO Cost Basis Methodology**
- **Principle I: Behavioral Training Over Features**

## Architectural Decisions

### ADR-006: FIFO Cost Basis Methodology

**Status:** Accepted
**Location:** `/docs/ADR-006-fifo-cost-basis-methodology.md`

**Relevance to Position Closing:**
- Exit trades must match against entry trades to calculate realized P&L
- FIFO algorithm matches oldest entry trades first (timestamp-sorted)
- Matches brokerage statement reporting for user trust and tax accuracy

**Key Design Elements:**
```typescript
interface FIFOResult {
  realizedPnL: number        // P&L from exit trades
  unrealizedPnL: number      // P&L from remaining open quantity
  totalPnL: number           // Sum of realized + unrealized
  openQuantity: number       // Remaining shares/contracts
  avgOpenCost: number        // Weighted average cost basis
  isFullyClosed: boolean     // True when openQuantity === 0
}

function processFIFO(trades: Trade[], currentPrice: number): FIFOResult
```

**Why Not Lots:**
- **Complexity:** Lot selection adds 350% UX complexity (10s → 60s to close position)
- **Constitutional violation:** Violates "Behavioral Training Over Features" and "Progressive Disclosure"
- **Tax focus misalignment:** Lot optimization is accounting, not trading skill
- **Implementation cost:** +200% code complexity (50 LOC → 150 LOC)
- **Risk/Reward impact:** FIFO prevents regret-driven lot selection bias
- **Broker alignment:** FIFO matches brokerage statements exactly

**Decision Rationale:**
FIFO-only approach strengthens behavioral training by:
- Eliminating decision paralysis on exits (no lot selection needed)
- Preventing mental accounting bias (can't cherry-pick "profitable lots")
- Reinforcing position-level risk management (focus on plan adherence, not lot optimization)
- Matching real-world brokerage P&L (builds trust, no tax surprises)

See detailed lot entity tradeoff analysis in plan.md session notes (2025-11-09).

---

### ADR-008: Derived Position Status Computation

**Status:** Proposed
**Location:** `/docs/ADR-008-derived-position-status.md`

**Relevance to Position Closing:**
- Position status ('planned' | 'open' | 'closed') must transition automatically when trades are added
- Status determines whether position appears in "Open Positions" dashboard
- Status transition triggers Plan vs Execution comparison display

**Key Design Elements:**
```typescript
function computePositionStatus(position: Position): Position['status'] {
  if (position.trades.length === 0) {
    return 'planned'
  }

  const netQuantity = position.trades.reduce((net, trade) =>
    trade.trade_type === 'buy' ? net + trade.quantity : net - trade.quantity,
    0
  )

  return netQuantity === 0 ? 'closed' : 'open'
}
```

**Why Derived Instead of Manual:**
- **Prevents falsification:** Trader can't mark losing position as "closed" without actually exiting
- **Eliminates sync bugs:** Status always matches trade reality (single source of truth)
- **Enforces immutability:** Status reflects objective reality (net quantity), not user preference
- **Simplifies implementation:** No status management logic needed (pure function)
- **Testable:** Deterministic computation (same trades → same status)

**Constitutional Alignment:**
- **Behavioral Training Over Features:** Prevents gaming the system by falsifying status
- **Immutability Mirrors Real Trading:** You can't pretend a position is closed—it either is or isn't
- **Plan vs Execution Separation:** Execution (trades) drives status, plan remains immutable

**Performance:**
- O(n) computation where n = number of trades
- Phase 1A: 1 trade per position (< 1ms)
- Phase 2: 2-10 trades per position (< 1ms)
- Acceptable overhead for constitutional benefits

---

### ADR-004: Embedded Trades Architecture

**Status:** Proposed
**Location:** `/docs/ADR-004-embedded-trades-architecture.md`

**Relevance to Position Closing:**
- Trades are stored as arrays within Position objects (`position.trades`)
- Enables single-query position detail view with complete trade history
- Foundation for FIFO cost basis calculation and status computation

**Why Embedded Instead of Separate Table:**
- **Data locality:** Complete position context in single IndexedDB query
- **Mental model alignment:** Position "contains" its execution history
- **Performance:** Optimal for position-centric workflows (primary use case)
- **Simplicity:** No cross-entity joins required

**Trade-offs:**
- Cross-position analytics require extraction step (acceptable for evening review workflow)
- Large trade histories increase position object size (mitigated: Phase 1A-2 have 2-10 trades)

---

## Feature-Specific Decisions (Not ADR-Worthy)

### Exit Trade Validation Rules

**Decision:** Inline validation prevents invalid exit trades
**Location:** `specs/001-close-position/contracts/Trade.interface.ts`

**Validation rules:**
1. Cannot exit from 'planned' position (must add entry trade first)
2. Cannot oversell (exit quantity ≤ open quantity)
3. Price must be ≥ $0 (allow $0 for expired options, prevent negative)

**Rationale:** These are feature-specific business rules, not architectural decisions affecting system-wide design.

---

### Plan vs Execution Comparison

**Decision:** Display comparison when position transitions to 'closed' status
**Location:** `specs/001-close-position/contracts/PlanVsExecution.interface.ts`

**Comparison metrics:**
- Entry execution quality (actual avg cost vs target entry price)
- Exit execution quality (actual avg exit vs profit target)
- Overall execution quality (actual P&L vs planned profit)

**Rationale:** This is a feature-specific UX decision that supports behavioral training goals but doesn't affect core architecture.

---

### Non-Transaction Journal Workflow

**Decision:** Reuse existing TRADE_EXECUTION journal type for exit trades
**Location:** Feature spec User Story 3, existing `src/services/JournalService.ts`

**Workflow:**
1. Save exit trade (non-transaction)
2. Open journal form immediately (configured for TRADE_EXECUTION type)
3. Trader can save journal or skip to daily review

**Rationale:** This is an established pattern from position opening flow, not a new architectural decision. Using existing journal type avoids creating unnecessary entity types.

---

## Decision Timeline

1. **Sep 2025:** ADR-004 proposed (Embedded Trades Architecture)
2. **Oct 2025:** ADR-006 accepted (FIFO Cost Basis Methodology)
3. **Nov 2025:** ADR-008 proposed (Derived Position Status) for position closing feature

## Impact Assessment

| Decision | Affects | Impact |
|----------|---------|--------|
| **FIFO Cost Basis** | P&L calculation, tax reporting, user trust | ✅ High: Matches broker statements, enables tax features |
| **Derived Status** | Position lifecycle, dashboard filtering, UX flow | ✅ High: Prevents sync bugs, enforces integrity |
| **Embedded Trades** | Data model, query patterns, analytics | ✅ Medium: Optimizes primary workflows |
| Exit Validation | Trade creation flow, error handling | ✅ Low: Feature-specific rules |
| Plan vs Execution | Closing flow UX, learning feedback | ✅ Low: Feature-specific display |
| Journal Workflow | User experience, habit formation | ✅ Low: Reuses existing pattern |

## Next Steps

1. ✅ ADR-006 accepted (already implemented in Slice 3)
2. ⏭️ ADR-008 requires approval before implementation begins
3. ⏭️ Run `/speckit.tasks` to generate implementation task breakdown
4. ⏭️ Begin implementation following TDD workflow in `quickstart.md`

## Questions for Review

**For ADR-008 (Derived Status):**
- Does derived status computation align with product vision?
- Are performance implications acceptable (O(n) computation on every position access)?
- Should we add status transition hooks for future observability needs?

**For Implementation:**
- Should we update ADR-004 status from "Proposed" to "Accepted" (already implemented)?
- Should we create ADR for daily review queue integration (or defer until Phase 1B)?

## References

- Project Constitution: `.specify/memory/constitution.md`
- Feature Specification: `specs/001-close-position/spec.md`
- Implementation Plan: `specs/001-close-position/plan.md`
- Data Model: `specs/001-close-position/data-model.md`
- TypeScript Contracts: `specs/001-close-position/contracts/*.ts`
- Developer Guide: `specs/001-close-position/quickstart.md`
