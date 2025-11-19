# Quickstart Guide: Position Closing via Trade Execution

**Feature**: 001-close-position
**Date**: 2025-11-09
**For**: Developers implementing this feature

## Overview

This guide helps developers quickly set up their environment and understand the implementation approach for adding position closing via exit trade execution.

## Prerequisites

- Node.js 18+ installed
- Git repository cloned
- Familiarity with TypeScript, React, and IndexedDB

## Environment Setup

### 1. Install Dependencies

```bash
# From repository root
npm install
```

### 2. Run Development Server

```bash
# Start Vite dev server with HMR
npm run dev

# Server runs at http://localhost:5173
# HMR enabled for instant feedback
```

### 3. Run Tests

```bash
# Run all tests in watch mode
npm test

# Run tests once (CI mode)
npm run test:run

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui
```

## Project Structure (for this feature)

```
src/
├── services/
│   ├── TradeService.ts          # EXTEND: Add FIFO logic, exit trade validation
│   ├── PositionService.ts       # EXTEND: Add closed status detection
│   └── JournalService.ts        # REUSE: Existing trade journal linking
├── lib/
│   ├── position.ts              # EXTEND: Add 'closed' to status union type
│   └── utils/
│       └── fifo.ts              # NEW: FIFO cost basis calculations
├── components/
│   ├── trades/
│   │   └── ExitTradeForm.tsx    # NEW: Form for recording exit trades
│   ├── journal/
│   │   └── JournalForm.tsx      # REUSE: Existing trade journal form
│   └── positions/
│       ├── PlanVsExecutionCard.tsx  # NEW: Displays comparison metrics
│       └── PositionDetail.tsx       # EXTEND: Add close trade flow
└── __tests__/
    └── integration/
        └── close-position.test.ts   # NEW: End-to-end journey tests

specs/001-close-position/
├── spec.md              # Feature specification (user stories, requirements)
├── plan.md              # This implementation plan
├── research.md          # FIFO algorithm research, decision rationale
├── data-model.md        # Entity definitions, validation rules
├── contracts/           # TypeScript interface contracts
│   ├── Position.interface.ts
│   ├── Trade.interface.ts
│   ├── FIFO.interface.ts
│   └── PlanVsExecution.interface.ts
└── quickstart.md        # This file
```

## Key Concepts

### FIFO Cost Basis Tracking

Exit trades are matched against entry trades using First-In-First-Out:

```typescript
// Pseudocode
function processFIFO(trades, currentPrice) {
  1. Sort trades by timestamp (oldest first)
  2. For each buy: add to open entries stack
  3. For each sell:
     - Match against oldest open entry
     - Calculate P&L: (sell_price - entry_price) * qty
     - Remove matched entry or reduce its quantity
  4. Return: realizedPnL, unrealizedPnL, openQuantity
}
```

See `contracts/FIFO.interface.ts` for complete implementation.

### Position Status Transitions

Position status is **derived** from trade activity, never set manually:

```
planned → open:  First buy trade added (net qty > 0)
open → closed:   Exit trades reduce net qty to 0
closed → (none): Terminal state (immutable)
```

See `contracts/Position.interface.ts` for status computation logic.

### Journal Workflow Pattern

Exit trades use the same journal pattern as entry trades:

```typescript
// 1. Save trade (non-transaction)
const trade = await TradeService.createTrade({type: 'sell', ...})

// 2. Open journal form immediately
<JournalForm
  linkedTradeId={trade.id}
  entryType="TRADE_EXECUTION"  // Existing type, no changes needed
  onSave={() => linkJournal()}
  onSkip={() => markUnjournaled()}  // Deferred to daily review
/>
```

See existing `src/services/JournalService.ts` for implementation.

## Development Workflow

### TDD Cycle (Required per Constitution)

**1. Write Integration Test First**

```typescript
// src/__tests__/integration/close-position.test.ts
describe('Position Closing', () => {
  it('closes position when all shares are sold', async () => {
    // Create position with entry trade
    const position = await createTestPosition({
      symbol: 'AAPL',
      entry_price: 150,
      quantity: 100
    })

    // Add exit trade for full quantity
    const exitTrade = await TradeService.createTrade({
      position_id: position.id,
      trade_type: 'sell',
      quantity: 100,
      price: 160
    })

    // Verify position closed
    const updatedPosition = await PositionService.getById(position.id)
    expect(updatedPosition.status).toBe('closed')

    // Verify FIFO P&L calculation
    const fifo = calculateFIFO(updatedPosition.trades, 160)
    expect(fifo.realizedPnL).toBe(1000) // ($160 - $150) * 100
    expect(fifo.openQuantity).toBe(0)
  })
})
```

**2. Run Test (should fail - Red phase)**

```bash
npm test -- close-position
# ❌ Test fails: status still 'open', FIFO not implemented
```

**3. Implement Feature (Green phase)**

```typescript
// src/services/TradeService.ts
async createTrade(trade: Trade) {
  // Add trade to position
  await this.saveTrade(trade)

  // Recompute position status after trade added
  await PositionService.updateStatus(trade.position_id)

  return trade
}

// src/services/PositionService.ts
async updateStatus(positionId: string) {
  const position = await this.getById(positionId)
  const newStatus = computePositionStatus(position)

  if (newStatus !== position.status) {
    await this.update(positionId, { status: newStatus })
  }
}
```

**4. Run Test Again (should pass - Green phase)**

```bash
npm test -- close-position
# ✅ Test passes
```

**5. Refactor (keep tests green)**

- Extract FIFO logic to `src/lib/utils/fifo.ts`
- Add inline validation
- Improve error messages

### Iterative Implementation Order

**Phase 1: Core FIFO Logic** (User Story 1 - P1)
1. Write test: Full position exit
2. Implement: FIFO calculation in `lib/utils/fifo.ts`
3. Extend: Position status transitions
4. Test: Verify position closes

**Phase 2: Partial Exit Support** (User Story 2 - P2)
1. Write test: Partial position exit
2. Implement: Realized vs unrealized P&L tracking
3. Extend: Position remains open after partial exit
4. Test: Verify correct quantities and P&L

**Phase 3: Journal Workflow** (User Story 3 - P1)
1. Write test: Exit trade journal flow
2. Implement: Reuse existing JournalForm component
3. Add: Skip for daily review option
4. Test: Verify unjournaled trades appear in review

**Phase 4: Plan vs Execution** (User Story 1 - P1)
1. Write test: Comparison displayed on close
2. Implement: Calculation logic from `contracts/PlanVsExecution.interface.ts`
3. Add: PlanVsExecutionCard component
4. Test: Verify metrics accuracy

## Common Pitfalls & Solutions

### ❌ **Pitfall**: Modifying existing trade records

**Problem**: Attempting to edit executed trades violates immutability principle.

**Solution**: Trades are immutable once saved. To correct mistakes, add compensating trade (e.g., reverse trade then new trade).

### ❌ **Pitfall**: Manually setting position status

**Problem**: `position.status = 'closed'` breaks derived state principle.

**Solution**: Status is computed from trades. Call `computePositionStatus(position)` instead.

### ❌ **Pitfall**: Using relative imports for types

**Problem**: `import { Trade } from '../lib/position'` breaks browser module resolution.

**Solution**: Always use `@/` path alias: `import type { Trade } from '@/lib/position'`

### ❌ **Pitfall**: Allowing negative net quantity

**Problem**: Exit trade quantity exceeds open quantity.

**Solution**: Validate before save:
```typescript
if (exitQuantity > calculateOpenQuantity(position.trades)) {
  throw new ValidationError({message: 'Cannot oversell position'})
}
```

### ❌ **Pitfall**: Creating new journal entry type

**Problem**: Adding 'EXIT_TRADE' entry type duplicates existing 'TRADE_EXECUTION'.

**Solution**: Reuse 'TRADE_EXECUTION' type - it already supports all trades.

## Testing Strategy

### Integration Tests (Primary)

Focus on complete user journeys:

```typescript
// Full position lifecycle
it('completes plan-execute-review cycle', async () => {
  // 1. Create position plan
  // 2. Add entry trade
  // 3. Add exit trade (full quantity)
  // 4. Verify status = 'closed'
  // 5. Verify plan vs execution displayed
  // 6. Check journal requirements
})

// Partial exits
it('handles multiple partial exits', async () => {
  // 1. Add entry: buy 100 @ $50
  // 2. Add exit: sell 30 @ $55
  // 3. Verify: position open, realized P&L = $150
  // 4. Add exit: sell 70 @ $58
  // 5. Verify: position closed, total realized = $150 + $560
})
```

### Unit Tests (Supporting)

Test FIFO algorithm edge cases:

```typescript
describe('FIFO Calculation', () => {
  it('matches oldest entry first')
  it('handles multiple entry prices')
  it('calculates weighted average correctly')
  it('prevents negative quantities')
  it('handles $0 exit price')
})
```

### Visual Regression Testing (Manual)

- Mobile viewport (375px width)
- Exit trade form validation messages
- Plan vs execution comparison table
- Journal form skip option

## Debugging Tips

### IndexedDB Inspector

Chrome DevTools → Application → IndexedDB → TradingJournalDB:

```
positions store:
- Find position by id
- Check trades array
- Verify status value

journal_entries store:
- Check trade_id links
- Verify entry_type
```

### Console Logging FIFO Results

```typescript
const fifo = processFIFO(position.trades, currentPrice)
console.table(fifo.tradePnL)  // See per-trade breakdown
console.log({
  realized: fifo.realizedPnL,
  unrealized: fifo.unrealizedPnL,
  open: fifo.openQuantity
})
```

### React DevTools

Inspect component props:
- `<ExitTradeForm>` validation state
- `<PlanVsExecutionCard>` comparison metrics
- `<JournalForm>` linked trade ID

## Next Steps

1. ✅ Read `spec.md` for complete user stories and acceptance scenarios
2. ✅ Review `data-model.md` for entity definitions and validation rules
3. ✅ Study `contracts/*.ts` for TypeScript interfaces
4. ⏭️ Run `/speckit.tasks` to generate task breakdown
5. ⏭️ Start with first task (usually: Write integration test)

## Resources

- **Constitution**: `.specify/memory/constitution.md` - Architectural principles
- **CLAUDE.md**: Project-level coding guidelines and patterns
- **Existing Tests**: `src/services/__tests__/TradeService.test.ts` - Test patterns reference
- **Existing Components**: `src/components/journal/JournalForm.tsx` - Reusable patterns

## Questions?

If you encounter ambiguities during implementation:
1. Check `spec.md` Clarifications section (Session 2025-11-09)
2. Refer to `research.md` for design decisions and rationale
3. Review Constitution principles for architectural guidance
4. Ask team lead before deviating from plan

---

**Ready to start?** Run `/speckit.tasks` to generate the detailed task breakdown, then begin with Task 1 (write first integration test).
