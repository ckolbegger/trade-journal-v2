# Implementation Plan: Position Closing via Trade Execution

**Branch**: `001-close-position` | **Date**: 2025-11-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-close-position/spec.md`

## Summary

Enable traders to close positions by recording exit trades (sells) with FIFO cost basis tracking, optional immediate journaling, and plan vs execution analysis. The feature extends the existing Trade entity to support sell-type transactions while maintaining the established non-transaction save + optional journal pattern from position creation.

**Technical Approach**: Extend existing TradeService and PositionService to handle sell trades, implement FIFO cost basis matching algorithm, auto-detect position closure when net quantity reaches zero, and integrate with existing JournalService for exit trade journaling workflow.

## Technical Context

**Language/Version**: TypeScript 5.8.3
**Primary Dependencies**: React 19.1.1, Vite 7.1.2, IndexedDB (via native browser API)
**Storage**: IndexedDB (TradingJournalDB v3) - local browser storage only
**Testing**: Vitest 3.2.4, React Testing Library 16.3.0, fake-indexeddb 6.2.2
**Target Platform**: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
**Project Type**: Single-page web application (React SPA)
**Performance Goals**: <30s exit trade save, <1s position status transition, <1s journal form display
**Constraints**: Offline-capable (no server calls), mobile-first responsive design, <100MB IndexedDB storage
**Scale/Scope**: Single-user local app, ~100 positions per user, ~1000 trades per user annually

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Behavioral Training Over Features
✅ **PASS** - Feature implements optional immediate journaling with daily review enforcement, matching established position creation pattern. Every exit trade requires eventual journal entry, supporting habit formation.

### Principle II: Immutability Reflects Reality
✅ **PASS** - Exit trades are immutable once saved (FR-009). Trade history is permanent and cannot be edited or deleted.

### Principle III: Plan vs Execution Separation
✅ **PASS** - Exit trades are Trade entities (execution records), separate from Position entity (immutable plan). Plan vs execution comparison displayed on position closure (FR-012).

### Principle IV: Test-First Discipline
✅ **PASS** - Implementation will follow TDD with integration tests covering complete user journeys, using fake-indexeddb and @testing-library/react.

### Principle V: Privacy-First Architecture
✅ **PASS** - No external API calls. All data remains in IndexedDB. No server communication.

### Principle VI: Mobile-First Responsive Design
✅ **PASS** - UI components will be designed mobile-first using existing Tailwind CSS patterns from the codebase.

### Principle VII: Type Safety & Import Discipline
✅ **PASS** - TypeScript strict mode enabled. Type-only imports for interfaces, runtime imports for implementations.

### Principle VIII: FIFO Cost Basis Methodology
✅ **PASS** - Core requirement (FR-007, FR-013). FIFO matching algorithm will be implemented in TradeService to match brokerage statement calculations.

**Gate Result**: ✅ ALL CHECKS PASS - Proceed to Phase 0 research

## Project Structure

### Documentation (this feature)

```text
specs/001-close-position/
├── plan.md              # This file
├── research.md          # Phase 0 output (FIFO algorithm research)
├── data-model.md        # Phase 1 output (Trade/Position schema updates)
├── quickstart.md        # Phase 1 output (developer setup guide)
├── contracts/           # Phase 1 output (IndexedDB schemas)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/          # React UI components
│   ├── trades/         # Exit trade form components (NEW)
│   ├── journal/        # Reuse existing journal form
│   └── positions/      # Position detail/close views
├── services/           # Business logic & IndexedDB access
│   ├── TradeService.ts         # EXTEND: Add sell support, FIFO logic
│   ├── PositionService.ts      # EXTEND: Add close status detection
│   └── JournalService.ts       # REUSE: Trade journal linking
├── lib/                # Domain models & utilities
│   ├── position.ts     # EXTEND: Add 'closed' status to Position interface
│   └── utils/          # FIFO calculation utilities (NEW)
├── pages/              # Route components
│   └── PositionDetail/ # EXTEND: Add close trade flow
└── types/              # TypeScript type definitions
    └── journal.ts      # REUSE: Existing trade journal types

tests/
├── integration/        # End-to-end user journey tests (NEW)
│   └── close-position.test.ts
└── __tests__/          # Existing unit tests
```

**Structure Decision**: Single project structure (Option 1). Frontend-only React SPA with IndexedDB for local storage. No backend/API needed per Privacy-First principle. Extends existing src/ structure with new exit trade components and FIFO logic in services.

## Complexity Tracking

> No constitutional violations requiring justification. All principles satisfied.

