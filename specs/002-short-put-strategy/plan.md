# Implementation Plan: Short Put Strategy Support

**Branch**: `002-short-put-strategy` | **Date**: 2025-12-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-short-put-strategy/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add support for the Short Put options strategy to the trading journal application. This feature extends the existing Long Stock position tracking system to handle option-based positions with:

- **Option-specific fields**: strike price, expiration date, option type (PUT), OCC symbol derivation
- **Multi-modal price targets**: Targets/stops can be based on either underlying stock price OR option premium
- **Intrinsic/extrinsic value display**: Educational breakdown showing time decay vs. underlying price impact
- **Option trade actions**: STO (Sell-to-Open), BTC (Buy-to-Close), BTO (Buy-to-Open), STC (Sell-to-Close)
- **Assignment handling**: Manual recording of option assignment with automatic stock position creation
- **Shared pricing**: Price entries stored by instrument (stock symbol or OCC symbol) and shared across positions
- **FIFO per instrument**: Cost basis tracking separately for stock trades and each unique option contract

The design maintains full backward compatibility with existing Long Stock positions while establishing a foundation for future option strategies (covered calls, multi-leg spreads).

## Technical Context

**Language/Version**: TypeScript 5.8.3, React 19.1.1, Vite 7.1.2
**Primary Dependencies**:
- React 19.1.1 with React Router DOM 7.8.2
- Tailwind CSS 4.1.13 for styling
- Radix UI primitives for component foundations
- Vitest 3.2.4 + React Testing Library 16.3.0 for testing
- fake-indexeddb 6.2.2 for IndexedDB test mocking

**Storage**: IndexedDB (TradingJournalDB v3) with object stores:
- `positions` - Position data with indexes on symbol, status, created_date
- `journal_entries` - Journal entries with indexes on position_id, trade_id, entry_type, created_at
- `price_history` - OHLC price data with compound unique index on underlying+date

**Testing**: Vitest with React Testing Library, jsdom environment, fake-indexeddb for persistence testing. All tests use `@/` import aliases matching browser behavior.

**Target Platform**: Web application (browser-based), mobile-first responsive design
**Project Type**: Single-page web application (standalone trading journal tool)
**Performance Goals**: <100ms for position calculations, <200ms for UI interactions, offline-capable with local-only data
**Constraints**:
- Privacy-first: No external APIs, all data local to browser
- Immutability: Position plans locked after creation
- TDD required: Tests written before implementation code
- Type-only imports for interfaces: `import type { Interface }`
**Scale/Scope**: Single-user per browser instance, ~50+ positions per user, local-only data

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Behavioral Training Over Features ✅ PASS

**Check**:
- ✅ Position plan creation requires journal entry (FR-002)
- ✅ Trade execution requires journal entry (FR-033, FR-034)
- ✅ Assignment-specific journal prompts defined (FR-035)
- ✅ Intrinsic/extrinsic breakdown provides educational value (FR-011, FR-012)
- ✅ Progressive disclosure through multi-step flows (existing pattern maintained)

**Rationale**: Feature reinforces behavioral discipline through mandatory journaling at all decision points. The intrinsic/extrinsic display teaches option pricing dynamics.

### II. Immutability Reflects Reality ✅ PASS

**Check**:
- ✅ Position plans remain immutable after creation (FR-003)
- ✅ Trade executions are permanent once recorded (existing pattern)
- ✅ Assignment creates new position rather than modifying existing (FR-016)

**Rationale**: No changes to immutability model. Assignment creates a new stock position, preserving the original option position's integrity.

### III. Plan vs Execution Separation ✅ PASS

**Check**:
- ✅ Position entity contains immutable plan with strategy_type and option-specific fields
- ✅ Trade entity contains execution records with option details
- ✅ Cost basis calculated from trades using FIFO per instrument (FR-020)
- ✅ UI terminology distinguishes plan ("Target Entry Price") from execution ("Avg Cost")
- ✅ Position status derived from net trade quantity

**Rationale**: Design extends existing Position/Trade separation model to support options without blurring the boundary.

### IV. Test-First Discipline ✅ PASS

**Check**:
- ✅ All user stories have acceptance scenarios with independent tests
- ✅ Integration tests required for complete user journeys
- ✅ Import path consistency enforced (same `@/` aliases in app and tests)
- ✅ Element visibility validation required before interaction
- ✅ Real data persistence with fake-indexeddb

**Rationale**: Feature specification includes comprehensive acceptance scenarios. TDD workflow will be followed during implementation.

### V. Privacy-First Architecture ✅ PASS

**Check**:
- ✅ All data stored in IndexedDB locally
- ✅ Manual price entry for both stock and options (FR-009)
- ✅ No external API calls for pricing data
- ✅ No authentication or cloud services

**Rationale**: Feature maintains privacy-first approach. Manual pricing continues for options.

### VI. Mobile-First Responsive Design ✅ PASS

**Check**:
- ✅ Forms use pickers for strike price and date selection (FR-046, FR-047)
- ✅ Touch targets sized appropriately (existing pattern)
- ✅ Progressive disclosure prevents cognitive overload
- ✅ Dashboard displays strategy badges and option details compactly (FR-036 to FR-043)

**Rationale**: Option-specific UI components follow existing mobile-first patterns.

### VII. Type Safety & Import Discipline ✅ PASS

**Check**:
- ✅ All interfaces use type-only imports: `import type { Position, Trade, PriceEntry }`
- ✅ Tests use same `@/` import paths as application code
- ✅ No `any` types planned

**Rationale**: TypeScript interfaces extended for option fields. Import discipline enforced in existing codebase and will be maintained.

### VIII. FIFO Cost Basis Methodology ✅ PASS

**Check**:
- ✅ FIFO tracked per instrument type (stock vs each unique OCC symbol) (FR-020)
- ✅ Position P&L calculated by summing trade-level P&L (existing pattern)
- ✅ Assignment cost basis tracked separately (FR-017)
- ✅ OCC symbol as unique instrument identifier enables per-contract FIFO

**Rationale**: Design extends FIFO model to track options separately from stock within same position. OCC symbol provides natural grouping key.

### Gate Decision

**STATUS: ✅ ALL GATES PASSED**

No constitutional violations detected. The feature design aligns with all core principles:

1. **Behavioral Training**: Mandatory journaling preserved, educational value added
2. **Immutability**: Position plans remain locked, trades are permanent
3. **Plan/Execution Separation**: Clear boundary maintained with option support
4. **Test-First**: Comprehensive acceptance scenarios provided
5. **Privacy**: Local-only data, manual pricing maintained
6. **Mobile-First**: UI follows existing responsive patterns
7. **Type Safety**: TypeScript extended for option types
8. **FIFO**: Per-instrument tracking enables accurate P&L

Proceeding to Phase 0 research.

## Project Structure

### Documentation (this feature)

```text
specs/002-short-put-strategy/
├── spec.md              # Feature specification (input)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── components/          # React UI components
│   ├── ui/              # Reusable UI primitives (button, input, label, etc.)
│   ├── positions/       # Position-related components (PositionCard, PositionDetail)
│   └── forms/           # Form components (PositionPlanForm, AddTradeForm)
├── domain/              # Business logic layer
│   ├── calculators/     # Pure functions for P&L, status, cost basis
│   ├── validators/      # Input validation rules
│   └── types/           # TypeScript interfaces (Position, Trade, JournalEntry)
├── services/            # Data access layer (IndexedDB)
│   ├── ServiceContainer.ts
│   ├── PositionService.ts
│   ├── TradeService.ts
│   ├── JournalService.ts
│   └── PriceService.ts
├── db/                  # Database schema and migrations
│   ├── schema.ts        # IndexedDB object store definitions
│   └── migrations/      # Version upgrade handlers
├── lib/                 # Utility functions
└── main.tsx             # Application entry point

tests/
├── integration/         # End-to-end user journey tests
│   ├── positions/       # Position creation, management, closing
│   └── trades/          # Trade execution workflows
├── unit/                # Isolated function tests
│   ├── domain/          # Calculator and validator tests
│   └── services/        # Service layer tests with fake-indexeddb
└── __mocks__/           # Test setup and global mocks
```

**Structure Decision**: Single-page web application (Option 1). The existing structure uses a clean three-layer architecture:
- **UI Layer** (`components/`): React components with no business logic
- **Domain Layer** (`domain/`): Pure functions for calculations and validation
- **Services Layer** (`services/`): Data access with IndexedDB operations

This separation aligns with the constitution's requirement for separation of concerns and enables comprehensive testing at each layer.

## Complexity Tracking

> No constitutional violations to justify. This section is omitted.

---

## Phase 0: Research

**Status**: ✅ Complete

Research findings consolidated in `research.md`. All technical decisions resolved:

1. **Position Interface Extension**: Optional fields with discriminated union for `strategy_type`
2. **Trade Interface Extension**: Option-specific fields with OCC symbol as instrument identifier
3. **OCC Symbol Derivation**: Pure utility function following industry standard format
4. **Price Storage Model**: Extended existing `PriceHistory` to support OCC symbols
5. **Intrinsic/Extrinsic Calculation**: Pure calculator functions in domain layer
6. **Database Migration**: Version 4 with `strategy_type` defaulting to 'Long Stock'
7. **Assignment Handling**: Programmatic stock position creation with cost basis tracking
8. **FIFO Per Instrument**: Group by `occ_symbol`/`underlying` for separate cost basis
9. **Journal Entry Extension**: New `option_assignment` type with specific prompts
10. **UI Component Strategy**: Conditional rendering with new option input components

**Output**: `research.md`

---

## Phase 1: Design & Contracts

**Status**: ✅ Complete

### Data Model

Extended existing entities with optional option fields. No breaking changes to existing Long Stock positions.

**Key Changes**:
- `Position.strategy_type`: Extended to `'Long Stock' | 'Short Put'`
- `Position`: Added `option_type`, `strike_price`, `expiration_date`, `premium_per_contract`, `profit_target_basis`, `stop_loss_basis`
- `Trade`: Added `action`, `occ_symbol`, `underlying_price_at_trade`, `created_stock_position_id`, `cost_basis_adjustment`
- `JournalEntry.entry_type`: Extended to include `'option_assignment'`
- Database version: 3 → 4 (migration defaults existing positions to 'Long Stock')

**Output**: `data-model.md`

### API Contracts

Defined internal APIs for domain and service layers:

**Domain Layer** (`contracts/domain-apis.ts`):
- `OptionValueCalculator`: `calculatePutIntrinsicValue()`, `calculateExtrinsicValue()`
- `optionUtils`: `deriveOCCSymbol()`, `parseOCCSymbol()`
- `CostBasisCalculator`: `groupTradesByInstrument()`, `calculateInstrumentFIFO()`
- `assignmentHandler`: `createAssignmentStockPosition()`, `calculateAssignmentCostBasis()`
- `ShortPutPnLCalculator`: `calculateShortPutUnrealizedPnL()`, `calculateShortPutRealizedPnL()`
- `PositionValidator`: `validateOptionPosition()`
- `TradeValidator`: `validateOptionTrade()`, `validateClosingTrade()`

**Service Layer** (`contracts/service-apis.ts`):
- `PositionService`: `createWithOptionStrategy()`, `getPositionsRequiringPrices()`
- `TradeService`: `addOptionTrade()`, `recordAssignment()`, `recordExpirationWorthless()`
- `PriceService`: `upsertMultiplePrices()`, `getPricesForPosition()`
- `JournalService`: `createAssignmentJournalEntry()`
- `SchemaManager`: Version 4 migration handler

**Output**: `contracts/domain-apis.ts`, `contracts/service-apis.ts`

### Quickstart Guide

Developer reference with code examples, testing patterns, and common gotchas.

**Output**: `quickstart.md`

### Agent Context Update

Updated `CLAUDE.md` with technology information for this feature.

**Output**: `CLAUDE.md` (modified)

---

## Constitution Check (Post-Design)

*Re-evaluated after Phase 1 design completion.*

### Status: ✅ ALL GATES PASSED

No new constitutional concerns identified during design. The implementation plan maintains all constitutional principles:

1. **Behavioral Training**: Assignment journal prompts and intrinsic/extrinsic display reinforce learning
2. **Immutability**: Position plans remain locked; assignment creates new stock position (no mutation)
3. **Plan/Execution Separation**: Clear boundary maintained; option fields in Position, execution in Trade
4. **Test-First**: Integration test patterns defined for all user stories
5. **Privacy**: Local-only storage maintained; OCC symbols stored locally
6. **Mobile-First**: Option input components follow existing responsive patterns
7. **Type Safety**: Type-only imports enforced in code examples
8. **FIFO**: Per-instrument tracking (`occ_symbol` for options, `underlying` for stock)

**Design Validation**: The three-layer architecture (UI → Domain → Services) remains intact with clear separation of concerns. Option-specific logic is properly isolated in domain calculators and validators.

---

## Phase 2: Implementation Tasks

**Status**: ⏳ Pending

The `/speckit.tasks` command will generate the implementation task list based on this plan. Use `/speckit.tasks` to create `tasks.md` with dependency-ordered implementation tasks.

**Next Steps**:
1. Run `/speckit.tasks` to generate implementation task list
2. Execute tasks following TDD workflow (Red → Green → Refactor)
3. Run integration tests after each task completion
4. Verify browser module resolution with `@/` import paths
