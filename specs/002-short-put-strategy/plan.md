# Implementation Plan: Short Put Strategy Support

**Branch**: `002-short-put-strategy` | **Date**: 2025-12-27 | **Spec**: /home/ckolbegger/src/trade-journal-v2/worktree/codex/specs/002-short-put-strategy/spec.md
**Input**: Feature specification from `/home/ckolbegger/src/trade-journal-v2/worktree/codex/specs/002-short-put-strategy/spec.md`

## Summary

Add option strategy support starting with Short Put: extend position plans with option-specific fields, allow option trades (STO/BTC), compute intrinsic/extrinsic value, handle assignment, and store shared price entries by instrument (stock/OCC). Implementation extends existing IndexedDB-backed services (Position, Trade, Price, Journal) and UI flows, with FIFO tracking per instrument and a database version bump for migration.

## Technical Context

**Language/Version**: TypeScript 5.8.3  
**Primary Dependencies**: React 19.1.1, Vite 7.1.2, React Router 7.8.2, Tailwind CSS 4.1.13  
**Storage**: IndexedDB (TradingJournalDB v3 → v4 migration)  
**Testing**: Vitest 3.2.4, React Testing Library 16.3.0, fake-indexeddb 6.2.2  
**Target Platform**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)  
**Project Type**: Single-page web application (React SPA)  
**Performance Goals**: <3 min end-to-end short put setup, <2 min close/assignment flows, <1s status updates  
**Constraints**: Offline-capable, manual price entry only, mobile-first responsive UI  
**Scale/Scope**: Single-user local app, ~100 positions, ~1000 trades annually

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Behavioral Training Over Features
✅ **PASS** - Journal entry required for position plan creation and trade execution (FR-002, FR-033); daily review behavior preserved.

### Principle II: Immutability Reflects Reality
✅ **PASS** - Position plan remains immutable; trades and assignments are append-only records (FR-003).

### Principle III: Plan vs Execution Separation
✅ **PASS** - Position retains plan fields only; Trade records executions; FIFO basis based on trades (FR-020).

### Principle IV: Test-First Discipline
✅ **PASS** - Feature requires integration-first tests for option flows with fake-indexeddb and @testing-library/react.

### Principle V: Privacy-First Architecture
✅ **PASS** - No external APIs; manual price entry only (FR-009).

### Principle VI: Mobile-First Responsive Design
✅ **PASS** - UI updates follow existing mobile-first patterns and validation rules (FR-041–FR-051).

### Principle VII: Type Safety & Import Discipline
✅ **PASS** - TypeScript strict mode; existing alias imports preserved.

### Principle VIII: FIFO Cost Basis Methodology
✅ **PASS** - FIFO tracking per instrument is mandatory (FR-020).

**Gate Result**: ✅ ALL CHECKS PASS - Proceed to Phase 0 research

**Post-Phase 1 Re-check**: ✅ PASS - Data model, contracts, and quickstart align with all principles.

## Project Structure

### Documentation (this feature)

```text
/home/ckolbegger/src/trade-journal-v2/worktree/codex/specs/002-short-put-strategy/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/
├── components/
│   ├── positions/          # EXTEND: strategy badge, option fields, assignment modal
│   ├── trades/             # EXTEND: option trade form (STO/BTC)
│   └── prices/             # EXTEND: instrument-aware price entry UI
├── pages/
│   ├── PositionDetail/     # EXTEND: option legs, intrinsic/extrinsic display
│   └── Dashboard/          # EXTEND: strategy badges, option summaries
├── services/
│   ├── TradeService.ts     # EXTEND: option trades, FIFO per instrument
│   ├── PositionService.ts  # EXTEND: option plan fields, status derivation
│   ├── PriceService.ts     # EXTEND: instrument_id-based price storage
│   └── SchemaManager.ts    # EXTEND: migration to v4
├── lib/
│   ├── position.ts         # EXTEND: strategy_type, option plan fields
│   └── utils/              # EXTEND: OCC symbol + intrinsic/extrinsic helpers
└── types/
    └── journal.ts          # EXTEND: option_assignment entry type
```

**Structure Decision**: Single React SPA with IndexedDB persistence. Feature changes are additive to existing `src/` layout, extending services and UI modules rather than introducing new packages.

## Complexity Tracking

> No constitutional violations requiring justification.
