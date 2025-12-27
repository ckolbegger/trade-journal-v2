# Implementation Plan: Short Put Strategy Support

**Branch**: `002-short-put-strategy` | **Date**: 2025-12-27 | **Spec**: [link](../002-short-put-strategy/spec.md)
**Input**: Feature specification from `/specs/002-short-put-strategy/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement Short Put option strategy support in the trading journal application. The feature enables traders to:
1. Create position plans with option-specific fields (strike, expiration, option type)
2. Execute sell-to-open (STO) and buy-to-close (BTC) option trades
3. Track intrinsic and extrinsic value breakdown for option positions
4. Handle option assignment and expiration workflows
5. Maintain backward compatibility with existing Long Stock functionality

Technical approach extends the existing Position/Trade entities with option-specific fields while preserving the FIFO cost basis methodology and immutability principles.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18.x, Vite 5.x
**Primary Dependencies**: React, TypeScript, Vite, idb (IndexedDB wrapper), Vitest, React Testing Library, date-fns
**Storage**: IndexedDB (browser local storage, privacy-first architecture)
**Testing**: Vitest, React Testing Library, fake-indexeddb for IndexedDB mocking
**Target Platform**: Browser (web application, mobile-first responsive design)
**Project Type**: Single-page application (frontend only)
**Performance Goals**: Mobile-responsive UI, typical trading app use cases (<200ms interactions)
**Constraints**: Privacy-first (no external APIs), offline-capable, single-user local storage
**Scale/Scope**: Single user, all data local, supports multiple positions with stock and option trades

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Behavioral Training Over Features | ✅ PASS | Journal entries required for all position plans and trades (FR-033) |
| II. Immutability Reflects Reality | ✅ PASS | Position plans immutable after creation (FR-003), trades permanent |
| III. Plan vs Execution Separation | ✅ PASS | Clear Position (strategy) vs Trade (execution) entity separation |
| IV. Test-First Discipline | ✅ PASS | Integration tests required, uses real IndexedDB via fake-indexeddb |
| V. Privacy-First Architecture | ✅ PASS | Local storage only, manual price entry, no external APIs |
| VI. Mobile-First Responsive Design | ✅ PASS | UI components designed mobile-first, touch targets 44x44px minimum |
| VII. Type Safety & Import Discipline | ✅ PASS | TypeScript with strict mode, type-only imports for interfaces |
| VIII. FIFO Cost Basis Methodology | ✅ PASS | Per-instrument FIFO tracking for stock and options (FR-020) |

**Gate Status**: ✅ PASS - No violations detected

## Project Structure

### Documentation (this feature)

```text
specs/002-short-put-strategy/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── api.yaml         # OpenAPI specification for data operations
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── types/
│   └── journal.ts       # Extended with option-specific types (OptionTrade, PriceEntry)
├── lib/
│   ├── position.ts      # Extended P&L calculations with intrinsic/extrinsic
│   └── utils.ts         # OCC symbol generation utilities
├── services/
│   ├── TradeService.ts  # Extended for option trade handling
│   └── PriceService.ts  # Extended for multi-instrument price storage
├── components/
│   ├── ui/              # Reusable UI components
│   ├── PositionCard.tsx # Extended with strategy badge and option fields
│   └── TradeForm.tsx    # Extended with option trade fields
├── pages/
│   ├── PositionCreate.tsx  # Extended with Short Put strategy option
│   └── PositionDetail.tsx  # Extended with intrinsic/extrinsic display
└── App.tsx              # Routes and providers

src/__tests__/
└── integration/         # Integration tests for option workflows

src/integration/         # User journey integration tests
```

**Structure Decision**: Single project structure (React SPA) following existing codebase conventions. Feature adds option-specific fields to existing entities without creating new modules. Component and service files extended in place to maintain code cohesion.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations requiring justification at this time. The feature extends existing patterns rather than introducing new complexity.
