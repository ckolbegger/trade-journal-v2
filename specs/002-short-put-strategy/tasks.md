# Tasks: Short Put Strategy Support

**Input**: Design documents from `/specs/002-short-put-strategy/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Included per Constitution Principle IV (Test-First Discipline). Component tasks include comprehensive unit tests with test cases listed inline.

**TDD Pattern**: For each task:
1. Write failing unit tests with stubbed implementation
2. Implement until all tests pass
3. After all story tasks complete, write integration tests to verify the full flow

**Organization**: Tasks grouped by user story for independent implementation and testing. Each user story introduces only the infrastructure it needs (JIT principle).

**P&L Strategy**: Realized P&L (from trade prices) implemented in MVP. Unrealized P&L (from current market prices) deferred to pricing story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story this task belongs to (US1-US9)
- File paths relative to repository root

---

## Phase 1: Setup (Minimal Types)

**Purpose**: Extend existing project with essential type definitions needed for US1

- [x] T001 Extend Position interface with option fields in src/lib/position.ts (strategy_type, trade_kind, option_type, strike_price, expiration_date, premium_per_contract, profit_target_basis, stop_loss_basis)
  - Tests: type compiles with all new fields, optional fields accept undefined, existing positions remain valid
- [x] T002 Extend Trade interface with option fields in src/lib/position.ts (action, occ_symbol, option_type, strike_price, expiration_date, contract_quantity, underlying_price_at_trade, created_stock_position_id, cost_basis_adjustment)
  - Tests: type compiles with all new fields, optional fields accept undefined, existing trades remain valid
- [x] T003 [P] Add StrategyType, TradeKind, OptionAction, PriceBasis type definitions to src/lib/position.ts
  - Tests: StrategyType includes 'Long Stock' and 'Short Put', TradeKind includes 'stock' and 'option', OptionAction includes 'STO' and 'BTC', PriceBasis includes 'stock' and 'option'

---

## Phase 2: Foundational (US1 Prerequisites)

**Purpose**: Validators needed for position plan creation

- [x] T004 Extend PositionValidator with option plan validation in src/domain/validators/PositionValidator.ts (strike_price > 0, expiration future date, premium > 0 when provided)
  - Tests: accepts valid Short Put plan, rejects strike_price <= 0, rejects past expiration date, rejects negative premium, accepts zero premium (undefined), validates all fields present for Short Put
- [ ] T005 Add lazy migration logic for existing positions in src/services/PositionService.ts (default strategy_type to 'Long Stock', trade_kind to 'stock')
  - Tests: existing position without strategy_type gets 'Long Stock', existing position without trade_kind gets 'stock', new positions require explicit strategy_type, migration is idempotent

- [ ] T005a [US1] Integration test for lazy migration in tests/integration/position-migration.test.ts
  - Tests: loads legacy position from DB, migrated fields present after load, re-save preserves migrated values, new position saves with explicit strategy

---

## Phase 3: User Story 1 - Create Short Put Position Plan (Priority: P1)

**Goal**: Trader can create an immutable Short Put position plan with strike, expiration, targets based on stock or option price, and mandatory thesis

**Independent Test**: Create a Short Put position plan, verify it appears in position list with "planned" status and zero trades

### Implementation for User Story 1

- [ ] T006 [P] [US1] Create StrategySelector component with comprehensive unit tests in src/components/StrategySelector.tsx
  - Tests: renders options, selection changes value, default to Long Stock, keyboard accessible
- [ ] T007 [P] [US1] Create StrikePriceInput component with comprehensive unit tests in src/components/StrikePriceInput.tsx
  - Tests: happy path, rejects negative, rejects non-numeric, accepts decimals, min value 0.01
- [ ] T008 [P] [US1] Create ExpirationDatePicker component with comprehensive unit tests in src/components/ExpirationDatePicker.tsx
  - Tests: happy path, rejects past dates, valid date format, handles timezone
- [ ] T009 [P] [US1] Create PriceBasisSelector component with comprehensive unit tests in src/components/PriceBasisSelector.tsx
  - Tests: renders stock/option options, selection changes value, displays current selection
- [ ] T010 [US1] Extend PositionCreate with conditional option fields in src/pages/PositionCreate.tsx (show strike, expiration, premium when strategy_type === 'Short Put')
  - Tests: hides option fields for Long Stock, shows option fields for Short Put, form state includes option fields when visible, tab order correct with option fields
- [ ] T011 [US1] Extend PositionService.create() to handle option plans with comprehensive unit tests in src/services/PositionService.ts
  - Tests: creates Short Put position, validates option fields, rejects invalid strike/expiration, persists all option fields to DB

- [ ] T011a [US1] Integration test for PositionService option plan creation in tests/integration/position-service-options.test.ts
  - Tests: service validates via PositionValidator, persists to IndexedDB, returns complete position object, retrievable after save

- [ ] T012 [US1] Add inline validation error display to PositionCreate in src/pages/PositionCreate.tsx (FR-049, FR-050)
  - Tests: shows error under invalid field, clears error when field corrected, multiple errors display simultaneously, error styling applied to invalid field
- [ ] T013 [US1] Wire PositionCreate page to support Short Put strategy in src/pages/PositionCreate.tsx
  - Tests: strategy selector visible on page, form submission calls PositionService, success navigates to position list, error displays on page

### Integration Tests for User Story 1

> **Write after implementation is complete** to verify the full user flow

- [ ] T014 [US1] Integration test for Short Put plan flow in tests/integration/short-put-plan.test.ts
  - Tests: complete UI flow from strategy selection to plan saved, validation errors displayed inline (strike <= 0, past expiration), plan retrievable after save with all option fields, position status 'planned' in list view

**Checkpoint**: User Story 1 complete - Short Put position plans can be created with immutable option details

---

## Phase 4: User Story 2 - Execute Sell-to-Open Trade (Priority: P1)

**Goal**: Trader can add STO trade to planned Short Put, position becomes "open", OCC symbol auto-generated

**Independent Test**: Add STO trade to planned Short Put, verify status changes to "open" and OCC symbol is generated

**Note**: No P&L display in this story - position shows as "open" with trade details only. Unrealized P&L requires current prices (Story 6).

### Implementation for User Story 2

#### Infrastructure

- [ ] T015 [P] [US2] Create OCC symbol utility functions with comprehensive unit tests in src/lib/utils/occSymbol.ts (generateOccSymbol, parseOccSymbol)
  - Tests: generates valid OCC format, parses OCC correctly, handles edge cases (single-char symbols, high strikes)
- [ ] T016 [P] [US2] Create OptionContractValidator with comprehensive unit tests in src/domain/validators/OptionContractValidator.ts (validateOccSymbol, validateExpiration, validateStrikeMatch)
  - Tests: valid OCC accepted, invalid OCC rejected, expiration must be future, strike must match position
- [ ] T017 [P] [US2] Extend TradeValidator with STO validation with comprehensive unit tests in src/domain/validators/TradeValidator.ts (STO before expiration, action matches position type)
  - Tests: STO before expiration valid, STO after expiration rejected, action matches position type
- [ ] T018 [US2] Extend PositionStatusCalculator for option net quantity with comprehensive unit tests in src/domain/calculators/PositionStatusCalculator.ts (handle STO/BTC actions)
  - Tests: STO increases open contracts, BTC decreases open contracts, net zero = closed

#### Components and Services

- [ ] T019 [P] [US2] Create ActionSelector component with comprehensive unit tests in src/components/ActionSelector.tsx
  - Tests: renders STO/BTC options, selection changes value, disabled states, shows current action
- [ ] T020 [US2] Extend TradeExecutionForm with option trade fields in src/components/TradeExecutionForm.tsx (auto-populate strike/expiration from position, action selector, "Premium per contract" label)
  - Tests: auto-populates strike from position, auto-populates expiration from position, shows action selector, labels show "Premium per contract", validates required fields
- [ ] T021 [US2] Extend TradeService.addOptionTrade() with comprehensive unit tests in src/services/TradeService.ts (generate OCC symbol, validate STO before expiration)
  - Tests: generates OCC symbol, validates timing, persists trade, updates position status, rejects STO after expiration

- [ ] T021a [US2] Integration test for TradeService option trade creation in tests/integration/trade-service-options.test.ts
  - Tests: service validates via OptionContractValidator + TradeValidator, generates OCC symbol, persists to IndexedDB, position status updated to 'open'

- [ ] T022 [US2] Create TradeList component to show option trade details in src/components/TradeList.tsx (action, strike, expiration, premium)
  - Tests: displays action (STO/BTC), displays strike price, displays expiration date, displays premium, handles multiple trades
- [ ] T023 [US2] Show position status and trade summary in PositionDetail (no P&L yet) in src/pages/PositionDetail.tsx
  - Tests: shows 'planned' for no trades, shows 'open' after STO, shows trade count, displays OCC symbol

### Integration Tests for User Story 2

> **Write after implementation is complete** to verify the full user flow

- [ ] T024 [US2] Integration test for STO trade flow in tests/integration/sto-trade.test.ts
  - Tests: complete STO flow from position detail page, form auto-populates strike/expiration, OCC symbol generated correctly, position status changes to 'open', trade appears in trade list with all details

**Checkpoint**: User Story 2 complete - STO trades can be executed against Short Put plans

---

## Phase 5: User Story 3 - Close Position via Buy-to-Close (Priority: P1)

**Goal**: Trader can close Short Put via BTC trade, position status becomes "closed", **realized P&L** calculated from trade prices

**Independent Test**: Add BTC trade to open Short Put, verify position closes and shows realized P&L

**Note**: Realized P&L uses trade prices only: `(STO premium - BTC premium) × contracts × 100`. No current market prices needed.

### Implementation for User Story 3

#### Infrastructure

- [ ] T025 [US3] Extend CostBasisCalculator with per-OCC-symbol FIFO with comprehensive unit tests in src/domain/calculators/CostBasisCalculator.ts (calculateOpenQuantityByInstrument)
  - Tests: single contract FIFO, multiple contracts FIFO order, partial close matching, mixed OCC symbols separate
- [ ] T026 [US3] Extend TradeValidator with BTC validation with comprehensive unit tests in src/domain/validators/TradeValidator.ts (BTC quantity <= open)
  - Tests: BTC <= open valid, BTC > open rejected, exact close valid, partial close valid

#### Calculators and Services

- [ ] T027 [US3] Create RealizedPnLCalculator with comprehensive unit tests in src/domain/calculators/RealizedPnLCalculator.ts (calculateShortPutRealizedPnL using FIFO-matched trade prices)
  - Tests: full close P&L correct, partial close P&L correct, FIFO matching order, handles multiple STO trades
- [ ] T028 [US3] Add BTC action handling to TradeService with comprehensive unit tests in src/services/TradeService.ts (validate quantity <= open, match contract details)
  - Tests: validates quantity, matches contract details, persists trade, updates position status, rejects BTC > open quantity

- [ ] T028a [US3] Integration test for TradeService BTC handling in tests/integration/trade-service-btc.test.ts
  - Tests: service validates via TradeValidator, matches FIFO from CostBasisCalculator, persists trade, position status updated to 'closed' on full close, 'open' on partial

- [ ] T029 [US3] Add realized P&L display for closed positions in src/pages/PositionDetail.tsx
  - Tests: displays realized P&L amount, shows profit in green, shows loss in red, hides when position open, formats currency correctly
- [ ] T030 [US3] Add partial close support (BTC < total contracts) in src/services/TradeService.ts
  - Tests: accepts BTC < open quantity, position remains open after partial close, partial P&L calculated correctly, remaining quantity correct
- [ ] T030a [US3] Add P&L summary to PositionCard (realized or unrealized based on status/prices) in src/components/PositionCard.tsx
  - Tests: shows realized P&L for closed positions, shows unrealized P&L for open positions with prices, shows "Enter prices" for open without prices, formats currency

### Integration Tests for User Story 3

> **Write after implementation is complete** to verify the full user flow

- [ ] T031 [US3] Integration test for BTC close flow in tests/integration/btc-close.test.ts
  - Tests: complete BTC flow from position detail, validates BTC <= open quantity, position status changes to 'closed' on full close, realized P&L calculated and displayed (profit = STO - BTC), trade list shows both STO and BTC trades

**Checkpoint**: User Stories 1-3 complete - Full short put lifecycle (plan → STO → BTC) with realized P&L

---

## Phase 6: User Story 4 - Record Expiration Worthless (Priority: P1)

**Goal**: Trader can record "expired" on/after expiration date, creates BTC at $0.00, captures full premium as realized profit

**Independent Test**: Record expiration on Short Put after expiration date, verify BTC at $0.00 and full premium as realized P&L

**Note**: Expiration produces realized P&L (premium received - $0 = full premium). No current prices needed.

### Implementation for User Story 4

- [ ] T031b [US4] Add action buttons section to PositionDetail for option position actions in src/pages/PositionDetail.tsx
  - Tests: renders action buttons for open Short Put positions, "Record Expired" visible on/after expiration, "Record Assignment" visible for Short Put, buttons disabled during processing, hides actions for Long Stock positions
- [ ] T032 [US4] Add "Record Expired" action button logic to PositionDetail in src/pages/PositionDetail.tsx
  - Tests: shows action on/after expiration date, hides action before expiration, shows action for open positions only, click opens ExpirationModal
- [ ] T033 [US4] Implement TradeService.recordExpiration() with comprehensive unit tests in src/services/TradeService.ts (create BTC at $0.00, validate on/after expiration)
  - Tests: creates BTC at $0, validates on/after expiration date, rejects before expiration, calculates full premium as profit, position status becomes 'closed'

- [ ] T033a [US4] Integration test for TradeService.recordExpiration() in tests/integration/trade-service-expiration.test.ts
  - Tests: service validates expiration date, creates BTC trade at $0, position marked closed, realized P&L equals premium received

- [ ] T034 [US4] Create ExpirationModal component with comprehensive unit tests in src/components/ExpirationModal.tsx
  - Tests: displays position details, displays premium received, confirm creates BTC at $0, cancel closes modal without changes, shows expected profit calculation

### Integration Tests for User Story 4

> **Write after implementation is complete** to verify the full user flow

- [ ] T035 [US4] Integration test for expiration flow in tests/integration/expiration-flow.test.ts
  - Tests: complete expiration flow from "Record Expired" action, validates on/after expiration date, BTC at $0 created automatically, position status becomes 'closed', realized P&L equals full premium received

**Checkpoint**: User Story 4 complete - MVP with all closing methods (BTC, expiration) and realized P&L

---

## Phase 7: User Story 5 - Handle Short Put Assignment (Priority: P2)

**Goal**: Trader can record assignment, system creates linked stock position with cost basis = strike - premium

**Independent Test**: Record assignment on Short Put, verify stock position created with correct quantity and cost basis

**Note**: Assignment creates stock position showing realized P&L for the option. Stock position's unrealized P&L displays after prices entered (Story 6).

### Implementation for User Story 5

#### Infrastructure

- [ ] T036 [P] [US5] Extend JournalEntryType with 'option_assignment' in src/types/journal.ts
  - Tests: type includes 'option_assignment', existing journal entry types still valid
- [ ] T037 [US5] Increment IndexedDB schema to v4 in src/services/db.ts (add assignments store, strategy_type index)
  - Tests: v4 schema creates assignments store, strategy_type index exists, upgrade from v3 succeeds, existing data preserved
- [ ] T038 [P] [US5] Create AssignmentEvent interface in src/lib/position.ts
  - Tests: type compiles with required fields (position_id, contracts_assigned, created_stock_position_id), optional fields accept undefined

#### Services

- [ ] T039 [US5] Create AssignmentService with comprehensive unit tests in src/services/AssignmentService.ts (initiateAssignment, completeAssignment, atomic transaction)
  - Tests: calculates cost basis (strike - premium), creates linked stock position, atomic transaction rollback on error, links positions bidirectionally

- [ ] T039a [US5] Integration test for AssignmentService atomic transaction in tests/integration/assignment-service.test.ts
  - Tests: creates stock position via PositionService, creates BTC trade via TradeService, closes option position, all operations succeed or all rollback, positions linked in DB

#### Components

- [ ] T040 [US5] Create AssignmentModal component with comprehensive unit tests in src/components/AssignmentModal.tsx
  - Tests: multi-step navigation, back button, state persists between steps, close resets state
- [ ] T041 [US5] Create AssignmentPreviewStep component with comprehensive unit tests in src/components/AssignmentPreviewStep.tsx
  - Tests: displays premium received, calculates cost basis (strike - premium), shows contract count
- [ ] T042 [US5] Create StockThesisStep component with comprehensive unit tests in src/components/StockThesisStep.tsx
  - Tests: auto-populates symbol, auto-calculates quantity (contracts × 100), thesis required
- [ ] T043 [US5] Create AssignmentJournalStep component with comprehensive unit tests in src/components/AssignmentJournalStep.tsx
  - Tests: displays FR-035 prompts, journal entry required, submit enabled when valid
- [ ] T044 [US5] Add "Record Assignment" action button logic to PositionDetail in src/pages/PositionDetail.tsx
  - Tests: shows action for open Short Put positions, hides action for closed positions, click opens AssignmentModal, disabled during processing
- [ ] T045 [US5] Support partial assignment (n of m contracts) in src/services/AssignmentService.ts
  - Tests: accepts n < total contracts, creates stock position for n contracts only, option position remains open with (total - n) contracts, correct cost basis for partial

### Integration Tests for User Story 5

> **Write after implementation is complete** to verify the full user flow

- [ ] T046 [US5] Integration test for assignment flow in tests/integration/assignment-flow.test.ts
  - Tests: complete multi-step assignment flow (preview → thesis → journal), stock position created with cost basis = strike - premium, quantity = contracts × 100, option position closed, positions linked bidirectionally, journal entry saved with assignment type

**Checkpoint**: User Story 5 complete - Assignment workflow creates linked stock position

---

## Phase 8a: User Story 6 - Price Entry + Unrealized P&L (Priority: P2)

**Goal**: Trader can enter current prices for stock and options. System calculates unrealized P&L for open positions.

**Independent Test**: Enter stock and option prices for open Short Put, verify unrealized P&L displays correctly

**Note**: This story provides the price entry infrastructure that US7 and US8 depend on.

### Implementation for User Story 6

#### Price Entry Infrastructure

- [ ] T047 [US6] Extend PriceService to support OCC symbols with comprehensive unit tests in src/services/PriceService.ts (getRequiredInstruments, checkStaleness)
  - Tests: identifies required instruments (stock + OCC), detects stale prices (>24h), handles multiple OCC symbols, returns instrument list for position

- [ ] T047a [US6] Integration test for PriceService OCC support in tests/integration/price-service-occ.test.ts
  - Tests: service identifies instruments for Short Put position, price saved and retrievable, staleness calculated from saved timestamp, multiple instruments tracked independently

- [ ] T048 [US6] Extend PriceUpdateCard for multiple instruments in src/components/PriceUpdateCard.tsx (stock + each OCC symbol)
  - Tests: displays input for stock price, displays input for each OCC symbol, submits all prices together, shows OCC symbol as label
- [ ] T049 [US6] Add 20% price change confirmation in src/components/PriceUpdateCard.tsx (FR-032)
  - Tests: shows confirmation dialog for >20% change, no dialog for <20% change, confirm updates price, cancel keeps original
- [ ] T050 [US6] Pre-fill existing prices in update form in src/components/PriceUpdateCard.tsx (FR-030)
  - Tests: shows last saved price as default, handles missing prices (empty field), clears on new position
- [ ] T051 [US6] Add staleness warning display in src/pages/PositionDetail.tsx (FR-031)
  - Tests: shows warning for prices >24h old, no warning for fresh prices, shows timestamp of last update

#### Unrealized P&L

- [ ] T052 [US6] Create UnrealizedPnLCalculator with comprehensive unit tests in src/domain/calculators/UnrealizedPnLCalculator.ts (calculateShortPutUnrealizedPnL)
  - Tests: calculates unrealized P&L correctly (premium received - current option price), handles missing prices (returns null), handles partial positions, positive when option price decreased
- [ ] T053 [US6] Add unrealized P&L display for open positions in src/pages/PositionDetail.tsx
  - Tests: displays unrealized P&L for open positions, shows profit in green, shows loss in red, formats currency correctly, updates when prices change
- [ ] T054 [US6] Show "Enter prices to see P&L" message when prices missing in src/pages/PositionDetail.tsx
  - Tests: shows message when no prices entered, hides message when prices present, links to price update form

### Integration Tests for User Story 6

> **Write after implementation is complete** to verify the full user flow

- [ ] T055 [US6] Integration test for price update flow in tests/integration/option-pricing.test.ts
  - Tests: complete price entry for stock + OCC symbol, 20% change confirmation shown when applicable, unrealized P&L displays after prices entered, staleness warning appears after 24h, prices pre-filled on subsequent visits

**Checkpoint**: User Story 6 complete - Price entry and unrealized P&L working

---

## Phase 8b: User Story 7 - Intrinsic/Extrinsic Display (Priority: P2)

**Goal**: System displays educational intrinsic/extrinsic value breakdown for open positions

**Independent Test**: With stock and option prices entered, verify intrinsic/extrinsic values display correctly

**Depends On**: US6 (requires price entry infrastructure)

### Implementation for User Story 7

- [ ] T056 [US7] Create IntrinsicExtrinsicCalculator with comprehensive unit tests in src/domain/calculators/IntrinsicExtrinsicCalculator.ts (calculatePutIntrinsicExtrinsic, isInTheMoney, getMoneyness)
  - Tests: ITM put intrinsic correct, OTM put zero intrinsic, extrinsic = premium - intrinsic, moneyness indicator
- [ ] T057 [US7] Create IntrinsicExtrinsicDisplay component with comprehensive unit tests in src/components/IntrinsicExtrinsicDisplay.tsx
  - Tests: displays per-contract values, displays total values, handles zero intrinsic (OTM), shows ITM/OTM indicator
- [ ] T058 [US7] Add intrinsic/extrinsic section to PositionDetail in src/pages/PositionDetail.tsx (FR-036, FR-037, FR-038)
  - Tests: shows intrinsic/extrinsic display component, passes correct stock price, passes correct option price, hides section when prices missing

**Integration Test**: Not required - this is a pure display feature. Calculator and component unit tests provide sufficient coverage. Price entry flow (US6) already has integration test.

**Checkpoint**: User Story 7 complete - Educational value breakdown displayed

---

## Phase 8c: User Story 8 - Risk-Reward Calculations (Priority: P2)

**Goal**: System calculates and displays distance to profit target and stop loss based on current prices

**Independent Test**: With prices entered and targets set, verify risk-reward indicators display correctly

**Depends On**: US6 (requires price entry infrastructure)

### Implementation for User Story 8

- [ ] T059 [US8] Create RiskRewardCalculator with comprehensive unit tests in src/domain/calculators/RiskRewardCalculator.ts (compare current price to profit_target and stop_loss based on their respective basis)
  - Tests: distance to target correct, distance to stop correct, handles stock vs option basis, handles missing targets
- [ ] T060 [US8] Create RiskRewardDisplay component with comprehensive unit tests in src/components/RiskRewardDisplay.tsx
  - Tests: shows distance to target, shows distance to stop, visual indicator colors, handles missing targets
- [ ] T061 [US8] Add risk-reward section to PositionDetail in src/pages/PositionDetail.tsx
  - Tests: shows risk-reward display component, passes current price and targets, hides section when prices missing, hides when no targets defined

**Integration Test**: Not required - this is a pure display feature. Calculator and component unit tests provide sufficient coverage. Price entry flow (US6) already has integration test.

**Checkpoint**: User Story 8 complete - Risk-reward indicators working

---

## Phase 9: User Story 9 - View Positions on Dashboard (Priority: P3)

**Goal**: Dashboard displays Short Put positions with strategy badge and option summary

**Independent Test**: Create Short Put position, verify dashboard shows strategy badge and option details

**Depends On**: US1 (plan creation), US6-US8 (for full display with P&L and intrinsic/extrinsic)

### Implementation for User Story 9

- [ ] T062 [P] [US9] Create StrategyBadge component with comprehensive unit tests in src/components/StrategyBadge.tsx
  - Tests: displays strategy name, correct styling per strategy type, handles Long Stock default
- [ ] T063 [P] [US9] Create OptionSummary component with comprehensive unit tests in src/components/OptionSummary.tsx
  - Tests: displays strike price, displays expiration date, displays premium received, formats currency
- [ ] T064 [US9] Extend PositionCard with strategy badge in src/components/PositionCard.tsx (FR-041)
  - Tests: shows strategy badge, displays 'Short Put' for Short Put, displays 'Long Stock' for Long Stock, badge styling correct per strategy
- [ ] T065 [US9] Extend PositionCard with option fields for Short Put in src/components/PositionCard.tsx (FR-042)
  - Tests: shows strike price, shows expiration date, shows premium summary, hides option fields for Long Stock
- [ ] T067 [US9] Add intrinsic/extrinsic summary to PositionCard when prices available in src/components/PositionCard.tsx (FR-043)
  - Tests: shows intrinsic/extrinsic values when prices available, hides section when prices missing, shows ITM/OTM indicator, compact format for card

### Integration Tests for User Story 9

> **Write after implementation is complete** to verify the full user flow

- [ ] T068 [US9] Integration test for dashboard display in tests/integration/dashboard-display.test.ts
  - Tests: Short Put positions appear on dashboard with strategy badge, option summary shows strike/expiration/premium, realized P&L for closed positions, unrealized P&L for open with prices, intrinsic/extrinsic summary when prices available, click navigates to position detail

**Checkpoint**: User Story 9 complete - Dashboard displays Short Put positions correctly

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup, validation, and documentation

- [ ] T069 Run full test suite and fix any failures
- [ ] T070 [P] Verify backward compatibility with existing Long Stock positions
- [ ] T071 [P] Mobile responsiveness review for all new components (44x44px touch targets)
- [ ] T072 [P] Type-only import audit (ensure all interfaces use `import type`)
- [ ] T073 Run quickstart.md validation scenarios
- [ ] T074 [P] Code cleanup: remove any `console.log` statements, unused imports
- [ ] T075 Verify all success criteria from spec.md (SC-001 through SC-017)

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup (minimal types)
    ↓
Phase 2: Foundational (US1 prerequisites only)
    ↓
┌───────────────────────────────────────────────────────────────┐
│  P1 Stories (MVP) - Sequential, realized P&L only             │
│                                                               │
│  Phase 3: US1 (Plan) ──→ Phase 4: US2 (STO) ──→               │
│  Phase 5: US3 (BTC) ──→ Phase 6: US4 (Expiration)             │
│                                                               │
│  Each story introduces its own infrastructure (JIT)           │
│  ✓ Complete lifecycle with realized P&L                       │
└───────────────────────────────────────────────────────────────┘
    ↓
┌───────────────────────────────────────────────────────────────┐
│  P2 Stories - Incremental delivery                            │
│                                                               │
│  Phase 7: US5 (Assignment) ─┐                                 │
│                             ├─ Independent of each other      │
│  Phase 8a: US6 (Pricing) ───┘                                 │
│       ↓                                                       │
│  Phase 8b: US7 (Intrinsic/Extrinsic) ─┐                       │
│                                       ├─ Depend on US6        │
│  Phase 8c: US8 (Risk-Reward) ─────────┘                       │
│                                                               │
│  ✓ Unrealized P&L → intrinsic/extrinsic → risk-reward         │
└───────────────────────────────────────────────────────────────┘
    ↓
Phase 9: US9 (Dashboard) - P3
    ↓
Phase 10: Polish
```

### User Story Dependencies

| Story | Depends On | Introduces | P&L Type |
|-------|------------|------------|----------|
| US1 (Plan) | Phase 1-2 | Position validation | None (no trades yet) |
| US2 (STO) | US1 | OCC utils, OptionContractValidator, PositionStatusCalculator | None (open position) |
| US3 (BTC) | US2 | CostBasisCalculator FIFO, BTC validation, RealizedPnLCalculator, **PositionCard P&L (T030a)** | **Realized** |
| US4 (Expiration) | US2 | Expiration validation, **action buttons in PositionDetail (T031b)** | **Realized** (premium - $0) |
| US5 (Assignment) | US2, US4 (T031b) | AssignmentEvent, IndexedDB v4, AssignmentService | **Realized** for option |
| US6 (Pricing) | US2 | UnrealizedPnLCalculator, price staleness | **Unrealized** P&L |
| US7 (Intrinsic/Extrinsic) | US6 | IntrinsicExtrinsicCalculator | Educational breakdown |
| US8 (Risk-Reward) | US6 | RiskRewardCalculator | Distance to targets |
| US9 (Dashboard) | US1, US6-US8 | StrategyBadge, OptionSummary | Shows whatever available |

### P&L Implementation Summary

| Calculator | Location | Inputs | Story |
|------------|----------|--------|-------|
| RealizedPnLCalculator | src/domain/calculators/ | Trade prices (STO, BTC) | US3 |
| UnrealizedPnLCalculator | src/domain/calculators/ | Current option price | US6 |
| IntrinsicExtrinsicCalculator | src/domain/calculators/ | Current stock + option prices | US7 |
| RiskRewardCalculator | src/domain/calculators/ | Current price vs targets/stops | US8 |

### Parallel Opportunities

**Phase 3 (US1):**
```
T006, T007, T008, T009 in parallel (components)
```

**Phase 4 (US2):**
```
T015, T016, T017 in parallel (infrastructure)
T019 in parallel with above
```

**Phase 7-8a (P2 Stories):**
```
US5 (Assignment) and US6 (Pricing) can run in parallel
- Different services, different components
- No dependencies between them
```

**Phase 8b-8c:**
```
US7 (Intrinsic/Extrinsic) and US8 (Risk-Reward) can run in parallel
- Both depend on US6, but independent of each other
- Different calculators, different display components
```

**Phase 9 (US9):**
```
T062, T063 in parallel (components)
```

---

## Implementation Strategy

### MVP First (User Stories 1-4) - Realized P&L Only

1. Complete Phase 1: Setup (3 tasks)
2. Complete Phase 2: Foundational (2 tasks)
3. Complete Phase 3: US1 - Plan Creation (9 tasks)
4. Complete Phase 4: US2 - STO Trade (10 tasks, includes infrastructure)
5. Complete Phase 5: US3 - BTC Close (7 tasks, includes infrastructure) - **Realized P&L works**
6. Complete Phase 6: US4 - Expiration (4 tasks) - **Realized P&L works**
7. **STOP and VALIDATE**: Full short put lifecycle with realized P&L
8. Deploy/demo MVP

### Incremental Delivery

| Increment | Stories | Capability | P&L |
|-----------|---------|------------|-----|
| **MVP** | US1-US4 | Plan → STO → BTC/Expire | Realized only |
| v1.1 | +US5 | Assignment workflow | Realized |
| v1.2 | +US6 | Price entry + unrealized P&L | **Unrealized** |
| v1.3 | +US7 | Intrinsic/extrinsic display | Educational breakdown |
| v1.4 | +US8 | Risk-reward calculations | Distance to targets |
| v1.5 | +US9 | Dashboard enhancements | Full display |

### Suggested MVP Scope

**US1 + US2 + US3 + US4** (Phases 1-6, ~37 tasks)
- Complete short put lifecycle: plan → STO → BTC or expire
- Realized P&L calculated from trade prices and displayed in both PositionDetail and PositionCard (T030a)
- Action buttons for expiration/assignment in PositionDetail (T031b)
- No dependency on price entry system

---

## Summary

| Metric | Count |
|--------|-------|
| **Total Tasks** | 84 |
| Setup Tasks | 3 |
| Foundational Tasks | 3 (includes 1 integration test) |
| US1 Tasks (P1) | 10 (includes 2 integration tests) |
| US2 Tasks (P1) | 11 (includes 2 integration tests) |
| US3 Tasks (P1) | 9 (includes 2 integration tests) |
| US4 Tasks (P1) | 6 (includes 2 integration tests) |
| US5 Tasks (P2) | 13 (includes 3 integration tests) |
| US6 Tasks (P2) | 10 (includes 2 integration tests) |
| US7 Tasks (P2) | 3 |
| US8 Tasks (P2) | 3 |
| US9 Tasks (P3) | 6 (includes 1 integration test) |
| Polish Tasks | 7 |
| **Parallelizable [P]** | 17 (20%) |
| **Unit Test Tasks** | 53 |
| **Integration Test Tasks** | 15 |

### P&L Strategy Summary

| Phase | P&L Type | Price Source | Story |
|-------|----------|--------------|-------|
| MVP (P1) | Realized | Trade prices (STO premium, BTC premium) | US3 |
| Post-MVP (P2) | Unrealized | Current market prices | US6 |
| Post-MVP (P2) | Intrinsic/Extrinsic | Current stock + option prices | US7 |
| Post-MVP (P2) | Risk-Reward | Current price vs plan targets | US8 |

---

## Notes

- **TDD Pattern**: Write failing unit tests first → implement → integration tests after story complete
- **JIT Principle**: Each user story introduces only the infrastructure it needs
- **No blocking "foundation" phase**: Validators and calculators built when first used
- **Component Testing**: Each new component includes comprehensive unit tests (test cases listed inline)
- **Integration Tests**: Two levels of integration testing:
  - **Task-level**: Tests for tasks that coordinate multiple services (e.g., T021a tests TradeService with validators + storage)
  - **Story-level**: Tests for complete user flows (e.g., T014 tests entire Short Put plan creation flow)
- **Realized P&L** works without any price entry - uses trade execution prices
- **Unrealized P&L** requires current prices - delivered in US6
- **Intrinsic/Extrinsic** builds on US6 price infrastructure - delivered in US7
- **Risk-Reward** builds on US6 price infrastructure - delivered in US8
- US7 and US8 can be implemented in parallel after US6 completes
- US7 and US8 are pure display features - unit tests sufficient, no integration tests needed
- Each user story checkpoint enables independent validation and feedback
- MVP delivers complete trading lifecycle before adding price-dependent features
