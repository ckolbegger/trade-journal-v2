# Tasks: Short Put Strategy Support

**Input**: Design documents from `/home/ckolbegger/src/trade-journal-v2/worktree/codex/specs/002-short-put-strategy/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Required (constitution + quickstart mandate TDD and integration coverage).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: User Story 1 - Create Short Put Position Plan (Priority: P1) 🎯 MVP

**Goal**: Create an immutable short put plan with option-specific fields and required journal entry.

**Independent Test**: Can be fully tested by creating a position plan with all required fields and verifying it appears in the position list with "planned" status.

- [x] T001 [US1]
  - Step 1 - Write unit tests for existing schema/service expectations in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/services/__tests__/SchemaManager.test.ts`
  - Step 2 - Implement any test scaffolding updates in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/services/SchemaManager.ts`
  - Step 3 - Add a smoke integration test for schema init in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/integration/schema-init.test.ts`
- [x] T002 [US1]
  - Step 1 - Write unit tests for schema version upgrade behavior in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/services/__tests__/SchemaManager.test.ts`
  - Step 2 - Implement v4 migration in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/services/SchemaManager.ts` and `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/services/ServiceContainer.ts`
  - Step 3 - Add integration coverage for upgrade path in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/integration/backward-compatibility-v4.test.ts`
- [x] T003 [US1]
  - Step 1 - Write unit tests for extended Position/Trade types in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/lib/position.test.ts`
  - Step 2 - Implement type changes in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/lib/position.ts`
  - Step 3 - Add integration coverage for type-backed flows in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/integration/position-types.integration.test.tsx`
- [x] T004 [US1]
  - Step 1 - Write unit tests for short put plan validation in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/domain/__tests__/PositionValidator.test.ts`
  - Step 2 - Implement validation updates in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/domain/validators/PositionValidator.ts`
  - Step 3 - Add integration validation coverage in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/integration/validation.integration.test.tsx`
- [ ] T005 [US1]
  - Step 1 - Write unit tests for plan form behavior in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/pages/PositionCreate.test.tsx`, plus component tests in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/components/__tests__/StrikePriceInput.test.tsx` and `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/components/__tests__/ExpirationDatePicker.test.tsx`, and risk calculation tests in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/domain/__tests__/PositionRiskCalculator.test.ts`
  - Step 2 - Implement UI + data wiring in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/pages/PositionCreate.tsx`, new components in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/components/StrikePriceInput.tsx` and `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/components/ExpirationDatePicker.tsx`, the risk calculator in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/domain/calculators/PositionRiskCalculator.ts`, and any type adjustments in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/lib/position.ts`
  - Step 3 - Add integration test for plan creation in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/integration/short-put-position-plan.test.tsx`

---

## Phase 2: User Story 2 - Execute Sell-to-Open Trade (Priority: P1)

**Goal**: Add STO trades with OCC symbol derivation and journaling prompt.

**Independent Test**: Can be tested by adding a sell-to-open trade to a planned Short Put position and verifying position status changes to "open".

- [ ] T006 [US2]
  - Step 1 - Write unit tests for OCC symbol formatting in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/lib/__tests__/occSymbol.test.ts`
  - Step 2 - Implement helper in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/lib/utils/occSymbol.ts`
  - Step 3 - Add integration verification via trade creation in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/integration/occ-symbol.integration.test.tsx`
- [ ] T007 [US2]
  - Step 1 - Write unit tests for STO trade validation in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/domain/__tests__/TradeValidator.test.ts`
  - Step 2 - Implement validation updates in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/domain/validators/TradeValidator.ts`
  - Step 3 - Add integration validation coverage in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/integration/validation.integration.test.tsx`
- [ ] T008 [US2]
  - Step 1 - Write unit tests for STO trade validation + OCC derivation in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/domain/__tests__/TradeValidator.test.ts` and `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/services/__tests__/TradeService.test.ts`
  - Step 2 - Implement trade form + service updates in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/components/TradeExecutionForm.tsx` and `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/services/TradeService.ts`
  - Step 3 - Add integration test for STO flow in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/integration/short-put-sto-trade.test.tsx`

---

## Phase 3: User Story 3 - Close Position via Buy-to-Close (Priority: P1)

**Goal**: Close short puts via BTC and switch P&L to realized.

**Independent Test**: Can be tested by adding a BTC trade for a short put, verifying it closes the position, calculating realized P&L correctly.

- [ ] T009 [US3]
  - Step 1 - Write unit tests for FIFO/PnL per-instrument behavior in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/domain/__tests__/CostBasisCalculator.test.ts` and `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/domain/__tests__/PnLCalculator.test.ts`
  - Step 2 - Implement calculator updates in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/domain/calculators/CostBasisCalculator.ts`, `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/domain/calculators/PnLCalculator.ts`, `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/domain/calculators/PositionStatusCalculator.ts`
  - Step 3 - Add integration coverage for status + PnL in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/integration/pnl-status.integration.test.tsx`
- [ ] T010 [US3]
  - Step 1 - Write unit tests for BTC closing rules in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/domain/__tests__/TradeValidator.test.ts` and `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/services/__tests__/TradeService.test.ts`
  - Step 2 - Implement BTC logic + PnL display updates in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/services/TradeService.ts`, `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/pages/PositionDetail.tsx`, `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/components/PnLDisplay.tsx`
  - Step 3 - Add integration test for BTC close flow in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/integration/short-put-btc-close.test.tsx`

---

## Phase 4: User Story 4 - Record Expiration Worthless (Priority: P2)

**Goal**: Record expired short puts at $0.00 and close positions.

**Independent Test**: Can be tested by recording expiration on an open Short Put after expiration date and verifying full premium captured as realized P&L.

- [ ] T011 [US4]
  - Step 1 - Write unit tests for expiration date constraints in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/domain/__tests__/TradeValidator.test.ts`
  - Step 2 - Implement expiration action UI + service handling in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/pages/PositionDetail.tsx` and `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/services/TradeService.ts`
  - Step 3 - Add integration test for expiration flow in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/integration/short-put-expiration.test.tsx`

---

## Phase 5: User Story 5 - Handle Short Put Assignment (Priority: P2)

**Goal**: Record assignment, close option leg, and create linked stock position with adjusted cost basis.

**Independent Test**: Can be tested by recording assignment, completing stock position plan in modal, and verifying linked stock position is created with correct cost basis.

- [ ] T012 [US5]
  - Step 1 - Write unit tests for new journal types in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/types/__tests__/journal.test.ts`
  - Step 2 - Implement type updates in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/types/journal.ts`
  - Step 3 - Add integration coverage for type usage in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/integration/types.integration.test.tsx`
- [ ] T013 [US5]
  - Step 1 - Write unit tests for assignment creation and journal type in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/services/__tests__/TradeService.test.ts` and `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/types/__tests__/journal.test.ts`
  - Step 2 - Implement assignment modal + service flow in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/components/AssignmentModal.tsx`, `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/services/TradeService.ts`, `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/types/journal.ts`
  - Step 3 - Add integration test for assignment flow in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/integration/short-put-assignment.test.tsx`
- [ ] T021 [US5]
  - Step 1 - Write unit tests for assignment CTA rendering and modal open/close in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/pages/PositionDetail.test.tsx`
  - Step 2 - Add assignment CTA and modal wiring in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/pages/PositionDetail.tsx` and `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/components/AssignmentModal.tsx`
  - Step 3 - Update integration flow to cover CTA navigation in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/integration/short-put-assignment.test.tsx`

---

## Phase 6: User Story 6 - Update Prices for Stock and Option (Priority: P2)

**Goal**: Enter and reuse instrument prices, compute intrinsic/extrinsic values, and show staleness warnings.

**Independent Test**: Can be tested by entering both stock and option prices for an open Short Put and verifying intrinsic/extrinsic values are calculated and displayed.

- [ ] T022 [US6]
  - Step 1 - Write unit tests for current price entry behavior in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/services/__tests__/PriceService.test.ts`
  - Step 2 - Implement fixtures/helpers in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/lib/test-utils.ts`
  - Step 3 - Add a minimal integration test for price entry flow in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/integration/price-entry-smoke.test.tsx`
- [ ] T023 [US6]
  - Step 1 - Write unit tests for intrinsic/extrinsic helpers in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/lib/__tests__/optionPricing.test.ts`
  - Step 2 - Implement helpers in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/lib/utils/optionPricing.ts`
  - Step 3 - Add integration check in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/integration/option-pricing.integration.test.tsx`
- [ ] T024 [US6]
  - Step 1 - Write unit tests for new price types in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/types/__tests__/priceHistory.test.ts`
  - Step 2 - Implement type updates in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/types/priceHistory.ts`
  - Step 3 - Add integration coverage for type usage in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/integration/types.integration.test.tsx`
- [ ] T025 [US6]
  - Step 1 - Write unit tests for price validation rules in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/domain/__tests__/PriceValidator.test.ts`
  - Step 2 - Implement validation updates in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/domain/validators/PriceValidator.ts`
  - Step 3 - Add integration validation coverage in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/integration/validation.integration.test.tsx`
- [ ] T026 [US6]
  - Step 1 - Write unit tests for instrument_id price reuse and staleness in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/services/__tests__/PriceService.test.ts`
  - Step 2 - Implement PriceService + UI updates in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/services/PriceService.ts`, `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/components/PriceUpdateCard.tsx`, `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/components/PriceConfirmationDialog.tsx`, `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/pages/PositionDetail.tsx`
  - Step 3 - Add integration test for price update flow in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/integration/short-put-price-update.test.tsx`

---

## Phase 7: User Story 7 - View Positions on Dashboard (Priority: P3)

**Goal**: Show strategy badge and option summary data on dashboard cards.

**Independent Test**: Can be tested by creating Short Put positions and verifying they display correctly on the dashboard with strategy badge and option details.

- [ ] T027 [US7]
  - Step 1 - Write unit tests for dashboard card rendering in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/components/__tests__/PositionCard.test.tsx`
  - Step 2 - Implement card + dashboard updates in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/components/PositionCard.tsx` and `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/components/Dashboard.tsx`
  - Step 3 - Add integration test for dashboard display in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/integration/short-put-dashboard-display.test.tsx`

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T028
  - Step 1 - Write unit tests for any new documentation helpers (if added) in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/__tests__/docs.test.ts`
  - Step 2 - Update docs in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/README-frontend.md` and `/home/ckolbegger/src/trade-journal-v2/worktree/codex/specs/002-short-put-strategy/quickstart.md`
  - Step 3 - Add integration checklist verification in `/home/ckolbegger/src/trade-journal-v2/worktree/codex/src/integration/docs-quickstart.integration.test.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **User Story 1 (Phase 1)**: No dependencies - can start immediately
- **User Stories 2-7 (Phases 2-7)**: Depend on prior story prerequisites only
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start immediately - No dependencies on other stories
- **User Story 2 (P1)**: Requires US1 plan fields to create STO trades
- **User Story 3 (P1)**: Requires US2 to have an open short put
- **User Story 4 (P2)**: Requires US2 to have an open short put
- **User Story 5 (P2)**: Requires US2 to have an open short put
- **User Story 6 (P2)**: Requires US2 trades for pricing
- **User Story 7 (P3)**: Depends on US1/US2 data for display

### Parallel Opportunities

- Story tasks can be parallelized across different teams once prerequisites are complete

---

## Parallel Example: User Story 2

```bash
Task: "| Step 1 - Write unit tests for STO trade validation + OCC derivation in /home/ckolbegger/src/trade-journal-v2/worktree/codex/src/domain/__tests__/TradeValidator.test.ts and /home/ckolbegger/src/trade-journal-v2/worktree/codex/src/services/__tests__/TradeService.test.ts"
Task: "Step 2 - Implement trade form + service updates in /home/ckolbegger/src/trade-journal-v2/worktree/codex/src/components/TradeExecutionForm.tsx and /home/ckolbegger/src/trade-journal-v2/worktree/codex/src/services/TradeService.ts"
Task: "Step 3 - Add integration test for STO flow in /home/ckolbegger/src/trade-journal-v2/worktree/codex/src/integration/short-put-sto-trade.test.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: User Story 1 (unit tests → implementation → integration tests)
2. **STOP and VALIDATE**: Test User Story 1 independently

### Incremental Delivery

1. Add User Story 1 → Test independently → Demo
2. Add User Story 2 → Test independently → Demo
3. Add User Story 3 → Test independently → Demo
4. Add User Story 4 → Test independently → Demo
5. Add User Story 5 → Test independently → Demo
6. Add User Story 6 → Test independently → Demo
7. Add User Story 7 → Test independently → Demo
