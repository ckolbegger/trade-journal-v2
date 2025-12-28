# Implementation Plan: Short Put Strategy Support

**Branch**: `002-short-put-strategy` | **Date**: 2025-12-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-short-put-strategy/spec.md`

## Summary

Add support for short put option strategies to the trading journal application. This involves extending the existing Position and Trade entities to support option-specific fields, implementing intrinsic/extrinsic value calculations, creating option-aware UI components, and handling option lifecycle events (sell-to-open, buy-to-close, expiration, assignment). The design must maintain backward compatibility with existing Long Stock positions while enabling future multi-leg strategy support through the OCC symbol as instrument identifier.

## Technical Context

**Language/Version**: TypeScript 5.8.3
**Primary Dependencies**: React 19.1.1, Vite 7.1.2, React Router DOM 7.8.2, Tailwind CSS 4.1.13, Radix UI
**Storage**: IndexedDB (TradingJournalDB) - browser-only, no server
**Testing**: Vitest 3.2.4, React Testing Library 16.3.0, fake-indexeddb 6.2.2
**Target Platform**: Web browser (Chrome, Firefox, Safari, Edge) - mobile-first responsive
**Project Type**: Single frontend application (no backend)
**Performance Goals**: Sub-200ms UI response, 60fps animations
**Constraints**: Offline-capable, zero external API calls, privacy-first (all data local)
**Scale/Scope**: Single user, hundreds of positions, thousands of trades

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Behavioral Training Over Features | PASS | All position plans and trades require journal entries (FR-033). Assignment flow includes behavioral prompts (FR-035). Educational intrinsic/extrinsic breakdown provided. |
| II. Immutability Reflects Reality | PASS | Position plans remain immutable (FR-003). Option contract details locked after save. Assignment creates new position rather than modifying existing. |
| III. Plan vs Execution Separation | PASS | Position entity contains plan (strategy_type, strike, expiration, targets). Trade entity contains executions (STO, BTC, etc.). Status derived from trade activity. |
| IV. Test-First Discipline | REQUIRED | Integration tests must be written before implementation. Tests must use `@/` import aliases. Element visibility validation required. |
| V. Privacy-First Architecture | PASS | No external API calls. All data stored in IndexedDB. Manual price entry only. No server dependency. |
| VI. Mobile-First Responsive Design | REQUIRED | Option-specific UI components must be designed mobile-first. Touch targets must be 44x44px minimum. |
| VII. Type Safety & Import Discipline | REQUIRED | New interfaces must use `import type`. OCC symbol generation must be type-safe. No `any` types. |
| VIII. FIFO Cost Basis Methodology | PASS | FR-020 specifies FIFO per OCC symbol. Existing CostBasisCalculator will be extended for option-specific calculations. |

**Gate Status**: PASS with 3 implementation requirements noted

## Project Structure

### Documentation (this feature)

```text
specs/002-short-put-strategy/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── ui/                          # Existing shadcn/ui components
│   ├── position/                    # Position-related components
│   │   ├── PositionCard.tsx         # EXTEND: Add strategy badge, option fields
│   │   ├── PositionForm.tsx         # EXTEND: Add option plan fields
│   │   └── PositionDetail.tsx       # EXTEND: Add intrinsic/extrinsic display
│   ├── trade/                       # Trade-related components
│   │   ├── TradeForm.tsx            # EXTEND: Add option trade fields (STO/BTC)
│   │   └── TradeList.tsx            # EXTEND: Show option trade details
│   └── option/                      # NEW: Option-specific components
│       ├── IntrinsicExtrinsicDisplay.tsx  # NEW: Value breakdown component
│       ├── AssignmentModal.tsx            # NEW: Assignment workflow modal
│       └── OccSymbolDisplay.tsx           # NEW: OCC symbol formatter
├── domain/
│   ├── calculators/
│   │   ├── CostBasisCalculator.ts   # EXTEND: Per-OCC symbol FIFO
│   │   ├── PnLCalculator.ts         # EXTEND: Option P&L formulas
│   │   ├── PositionStatusCalculator.ts  # EXTEND: Net quantity by trade_kind
│   │   └── IntrinsicExtrinsicCalculator.ts  # NEW: Intrinsic/extrinsic logic
│   └── validators/
│       ├── PositionValidator.ts     # EXTEND: Option plan validation
│       ├── TradeValidator.ts        # EXTEND: Option trade validation
│       └── OptionContractValidator.ts  # NEW: OCC symbol, expiration rules
├── lib/
│   ├── position.ts                  # EXTEND: Add option fields to Position + Trade interfaces
│   └── utils/
│       ├── fifo.ts                  # EXTEND: Per-instrument FIFO
│       └── occSymbol.ts             # NEW: OCC symbol generation/parsing
├── services/
│   ├── PositionService.ts           # Minor updates for new fields
│   ├── TradeService.ts              # EXTEND: Option trade operations
│   ├── PriceService.ts              # EXTEND: Option price storage by OCC
│   ├── JournalService.ts            # EXTEND: Assignment journal type
│   └── AssignmentService.ts         # NEW: Assignment workflow orchestration
├── types/
│   ├── journal.ts                   # EXTEND: Add 'option_assignment' entry type
│   └── priceHistory.ts              # EXTEND: Option price entries (OCC symbols)
├── pages/
│   ├── Dashboard.tsx                # EXTEND: Strategy badges, option cards
│   ├── PositionDetail.tsx           # EXTEND: Intrinsic/extrinsic display
│   └── CreatePosition.tsx           # EXTEND: Short Put plan creation
└── contexts/
    └── PositionContext.tsx          # Minor updates if needed

tests/
├── integration/
│   ├── short-put-lifecycle.test.ts  # NEW: Full short put journey
│   ├── assignment-flow.test.ts      # NEW: Assignment workflow
│   └── option-pricing.test.ts       # NEW: Intrinsic/extrinsic calculation
└── unit/
    ├── occSymbol.test.ts            # NEW: OCC symbol utilities
    └── option-validators.test.ts    # NEW: Option validation rules
```

**Structure Decision**: Single frontend project with domain-driven organization. New option functionality organized into existing patterns (components, domain, services, types). New `option/` component directory for option-specific UI. New `AssignmentService` to orchestrate the multi-step assignment workflow.

## Complexity Tracking

> No constitution violations requiring justification. Design follows existing patterns.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

---

## Post-Design Constitution Check

*Re-evaluated after Phase 1 design completion.*

| Principle | Status | Post-Design Evidence |
|-----------|--------|---------------------|
| I. Behavioral Training Over Features | ✅ PASS | research.md: Assignment workflow includes guided modal with behavioral prompts. data-model.md: JournalEntry extended with 'option_assignment' type and ASSIGNMENT_PROMPTS constant. quickstart.md: ThesisTextarea marked as required in all forms. |
| II. Immutability Reflects Reality | ✅ PASS | data-model.md: Position plan fields marked "immutable after creation". Assignment creates NEW stock position (not modifying existing). contracts/assignment-service.ts: AssignmentResult returns new entities, never mutates existing. |
| III. Plan vs Execution Separation | ✅ PASS | data-model.md: Position contains plan fields (strategy_type, targets). Trade contains execution (action codes, timestamps). Status computed from trades via PositionStatusCalculator. contracts/types.ts: Clear separation of Position (plan) and Trade (execution) interfaces. |
| IV. Test-First Discipline | ✅ ADDRESSED | quickstart.md: Includes TDD patterns with failing tests first. Test file checklist provided. Integration test example shows full lifecycle testing. All examples use `@/` import aliases. |
| V. Privacy-First Architecture | ✅ PASS | research.md: Price sharing via local IndexedDB only. No external API for pricing. data-model.md: All entities stored locally. contracts/price-service.ts: No external fetch methods. |
| VI. Mobile-First Responsive Design | ✅ ADDRESSED | research.md Section 8: "Touch-friendly date picker", "Number pad input type", "Bottom sheet for assignment modal on mobile". quickstart.md: Pattern examples follow component composition for responsive layouts. |
| VII. Type Safety & Import Discipline | ✅ ADDRESSED | contracts/types.ts: All interfaces defined with strict types. Type guards provided (isOptionPosition, isOptionTrade). quickstart.md: "Common Gotchas" section explicitly warns about type-only imports. All examples use `import type`. |
| VIII. FIFO Cost Basis Methodology | ✅ PASS | research.md: "FIFO Matching by OCC Symbol" section confirms per-instrument tracking. data-model.md: Trade.underlying and Trade.occ_symbol enable per-instrument grouping. contracts/calculators.ts: ICostBasisCalculator.applyFifoMatching and calculateOpenQuantityByInstrument methods defined. |

**Post-Design Gate Status**: ✅ ALL PASS

All constitution principles have been addressed in the design artifacts. Implementation can proceed with `/speckit.tasks`.

---

## Generated Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Implementation Plan | `specs/002-short-put-strategy/plan.md` | ✅ Complete |
| Research Decisions | `specs/002-short-put-strategy/research.md` | ✅ Complete |
| Data Model | `specs/002-short-put-strategy/data-model.md` | ✅ Complete |
| Service Contracts | `specs/002-short-put-strategy/contracts/` | ✅ Complete |
| Quickstart Guide | `specs/002-short-put-strategy/quickstart.md` | ✅ Complete |
| Implementation Tasks | `specs/002-short-put-strategy/tasks.md` | ⏳ Pending (`/speckit.tasks`) |

## Next Steps

1. Run `/speckit.tasks` to generate implementation tasks from this plan
2. Implement in priority order (P1 user stories first)
3. Write failing tests before implementation (TDD)
4. Run `/soc-review` before each commit
