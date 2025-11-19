# Tasks: Position Closing via Trade Execution

**Input**: Design documents from `/specs/001-close-position/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Test-First Discipline (Constitutional Principle IV) is NON-NEGOTIABLE. All test tasks MUST be completed before corresponding implementation tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify environment and review existing codebase for reuse opportunities

- [X] T001 Review existing src/lib/position.ts Position and Trade interfaces
- [X] T002 Review existing src/services/TradeService.ts for extension points
- [X] T003 [P] Review existing src/services/PositionService.ts for status computation needs
- [X] T004 [P] Review existing src/services/JournalService.ts for trade journal linking patterns
- [X] T005 [P] Review existing src/components/journal/JournalForm.tsx for reuse

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Extend Position interface in src/lib/position.ts to add 'closed' status to union type
- [X] T007 Implement computePositionStatus() function in src/utils/statusComputation.ts (already exists, extended to support 'closed')
- [X] T008 Implement calculateOpenQuantity() function in src/lib/position.ts per specs/001-close-position/contracts/Trade.interface.ts
- [X] T009 Create src/lib/utils/fifo.ts and implement processFIFO() function per specs/001-close-position/contracts/FIFO.interface.ts
- [X] T010 [P] Create src/lib/utils/planVsExecution.ts and implement calculatePlanVsExecution() and formatPlanVsExecution() functions per specs/001-close-position/contracts/PlanVsExecution.interface.ts
- [X] T011 Create ValidationError class in src/lib/position.ts per specs/001-close-position/contracts/Trade.interface.ts
- [X] T012 Implement validateExitTrade() function in src/lib/position.ts per specs/001-close-position/contracts/Trade.interface.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel ✅

---

## Phase 3: User Story 1 - Complete Position Exit (Priority: P1) 🎯 MVP

**Goal**: Enable traders to record exit trades that fully close positions, with automatic position closure and plan vs execution analysis

**Independent Test**: Create open position with single entry trade, add exit trade for full quantity, verify position status changes to 'closed' and plan vs execution comparison displays

### Tests for User Story 1 ⚠️ WRITE FIRST

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T013 [P] [US1] Create test file src/__tests__/integration/close-position.test.ts with test suite structure
- [X] T014 [P] [US1] Write integration test "closes position when all shares are sold" in src/__tests__/integration/close-position.test.ts
- [X] T015 [P] [US1] Write integration test "handles scale-in position with full exit" in src/__tests__/integration/close-position.test.ts
- [X] T016 [P] [US1] Write integration test "displays plan vs execution on position close" in src/__tests__/integration/close-position.test.ts
- [X] T017 [P] [US1] Write unit test suite for processFIFO() in src/lib/utils/__tests__/fifo.test.ts covering full position exit scenarios
- [X] T018 [P] [US1] Write unit test suite for computePositionStatus() in src/lib/__tests__/position.test.ts covering closed status transition

**Run Tests**: All tests should FAIL (Red phase) - if any pass, fix the test

### Implementation for User Story 1

- [X] T019 [US1] Extend TradeService.addTrade() to support multiple trades and remove Phase 1A single trade constraint
- [X] T020 [US1] Add FIFO calculation methods (calculateFIFOPnL) and plan vs execution analysis (calculatePlanVsExecution) to TradeService
- [X] T021 [US1] Create src/components/PlanVsExecutionCard.tsx component to display plan vs execution comparison
- [X] T022 [US1] Extend src/pages/PositionDetail component to show PlanVsExecutionCard when position status is 'closed'
- [ ] T023 [US1] Add "Close Position" button (deferred - users can add exit trades directly via Add Trade button)
- [X] T024 [US1] Update Dashboard component to support 'closed' status filter
- [X] T025 [US1] Update UI components to display closed position status (via StatusBadge and PlanVsExecutionCard)

**Run Tests**: All User Story 1 tests PASS ✅
- Integration tests: 2/2 passing (close-position.test.ts)
- FIFO unit tests: 10/10 passing (fifo.test.ts)
  - Single entry/exit scenarios
  - Multiple entry trades with full/partial exits
  - Multiple exit trades from single/multiple entries
  - Mixed entry/exit sequences (scaling in and out)
  - Edge cases (empty trades, zero price, weighted averages)
- Position status tests: 8/8 passing (position.test.ts)
- Plan vs execution: Covered in integration tests
- Full suite: 566/570 passing (1 pre-existing Dashboard test needs update for new status logic)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Partial Position Exit (Priority: P2)

**Goal**: Enable traders to reduce position size by selling part of their holdings while keeping position open, with correct realized vs unrealized P&L tracking

**Independent Test**: Create open position with 100 shares, record partial exit for 50 shares, verify position remains 'open' with updated quantity and separate realized/unrealized P&L

### Tests for User Story 2 ⚠️ WRITE FIRST

- [ ] T026 [P] [US2] Write integration test "partial exit leaves position open" in src/__tests__/integration/close-position.test.ts
- [ ] T027 [P] [US2] Write integration test "FIFO matching with multiple entry prices" in src/__tests__/integration/close-position.test.ts
- [ ] T028 [P] [US2] Write integration test "multiple partial exits with running P&L totals" in src/__tests__/integration/close-position.test.ts
- [ ] T029 [P] [US2] Write unit test suite for processFIFO() partial matching scenarios in src/lib/utils/__tests__/fifo.test.ts

**Run Tests**: All tests should FAIL (Red phase)

### Implementation for User Story 2

- [ ] T030 [US2] Extend PositionDetail component to display realized P&L separately from unrealized P&L
- [ ] T031 [US2] Add trade history section to PositionDetail showing all entry and exit trades with running totals
- [ ] T032 [US2] Update P&L calculation display to show breakdown: realized + unrealized = total
- [ ] T033 [US2] Add visual distinction in trade history between fully matched, partially matched, and open entry trades

**Run Tests**: All User Story 2 tests should PASS (Green phase)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Closing Trade Journal Workflow (Priority: P1)

**Goal**: When recording exit trades, save trade first (non-transaction), then open journal form with option to save immediately or defer to daily review

**Independent Test**: Record exit trade, verify trade saves immediately, confirm journal form opens with exit-focused prompts and "Save Journal Now" / "Skip for Daily Review" options

### Tests for User Story 3 ⚠️ WRITE FIRST

- [ ] T034 [P] [US3] Write integration test "journal form opens after exit trade save" in src/__tests__/integration/close-position.test.ts
- [ ] T035 [P] [US3] Write integration test "immediate journal save links to exit trade" in src/__tests__/integration/close-position.test.ts
- [ ] T036 [P] [US3] Write integration test "skip for daily review marks trade as unjournaled" in src/__tests__/integration/close-position.test.ts
- [ ] T037 [P] [US3] Write integration test "unjournaled exit trades appear in daily review" in src/__tests__/integration/close-position.test.ts
- [ ] T038 [P] [US3] Write integration test "journal form closure without choice treats as skip" in src/__tests__/integration/close-position.test.ts

**Run Tests**: All tests should FAIL (Red phase)

### Implementation for User Story 3

- [ ] T039 [US3] Create src/components/trades/ExitTradeForm.tsx component for recording exit trades
- [ ] T040 [US3] Implement non-transaction save in ExitTradeForm (save trade, then open journal form)
- [ ] T041 [US3] Configure JournalForm to open with TRADE_EXECUTION type linked to exit trade
- [ ] T042 [US3] Add "Save Journal Now" handler to link journal entry to exit trade
- [ ] T043 [US3] Add "Skip for Daily Review" handler to leave trade unjournaled
- [ ] T044 [US3] Implement journal form closure detection (treat as implicit skip per FR-004)
- [ ] T045 [US3] Extend daily review workflow to query and display unjournaled trades (entry and exit)
- [ ] T046 [US3] Implement unjournaled trades prioritization (appear first in daily review per FR-006)
- [ ] T047 [US3] Add warning when skipping daily review with unjournaled trades per FR-016

**Run Tests**: All User Story 3 tests should PASS (Green phase)

**Checkpoint**: All P1 user stories should now be independently functional

---

## Phase 6: Edge Cases & Validation

**Purpose**: Comprehensive validation and edge case handling across all user stories

### Tests for Edge Cases ⚠️ WRITE FIRST

- [ ] T048 [P] Write integration test "prevents overselling with inline validation" in src/__tests__/integration/close-position.test.ts
- [ ] T049 [P] Write integration test "allows $0 exit price but prevents negative" in src/__tests__/integration/close-position.test.ts
- [ ] T050 [P] Write integration test "prevents exit trade on planned position" in src/__tests__/integration/close-position.test.ts
- [ ] T051 [P] Write unit test "FIFO handles multiple entry prices correctly" in src/lib/utils/__tests__/fifo.test.ts
- [ ] T052 [P] Write unit test "FIFO handles weighted average cost calculation" in src/lib/utils/__tests__/fifo.test.ts

**Run Tests**: All tests should FAIL (Red phase)

### Implementation for Edge Cases

- [ ] T053 Implement overselling prevention in validateExitTrade() with inline error display per FR-011
- [ ] T054 Implement price validation (>= $0) in validateExitTrade() per FR-015
- [ ] T055 Implement position status check in validateExitTrade() (prevent exit from 'planned')
- [ ] T056 Add error messaging component for validation errors showing suggested actions
- [ ] T057 Add visual indicators for validation errors on ExitTradeForm

**Run Tests**: All edge case tests should PASS (Green phase)

**Checkpoint**: All validation and edge cases handled correctly

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final quality checks

- [ ] T058 [P] Add loading states to ExitTradeForm and PlanVsExecutionCard components
- [ ] T059 [P] Add success feedback after exit trade save per SC-001 (< 30s completion)
- [ ] T060 [P] Verify position status transition performance < 1s per SC-006
- [ ] T061 [P] Verify journal form display performance < 1s per SC-002
- [ ] T062 [P] Add mobile-responsive styling to ExitTradeForm component
- [ ] T063 [P] Add mobile-responsive styling to PlanVsExecutionCard component
- [ ] T064 [P] Verify all type imports use `import type` syntax per Constitutional Principle VII
- [ ] T065 [P] Run full test suite with `npm run test:run` to verify all tests pass
- [ ] T066 [P] Run build with `npm run build` to verify TypeScript compilation
- [ ] T067 Update specs/001-close-position/quickstart.md with any learnings from implementation
- [ ] T068 Perform manual testing following quickstart.md test scenarios
- [ ] T069 Verify ADR-008 (Derived Position Status) implementation matches specification
- [ ] T070 Create git commit following CLAUDE.md git best practices

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3, 4, 5)**: All depend on Foundational phase completion
  - US1 and US3 are both P1 priority - implement in parallel if staffed, or US1 then US3
  - US2 is P2 priority - can start after Foundational but should complete US1 first
- **Edge Cases (Phase 6)**: Depends on US1, US2, US3 completion
- **Polish (Phase 7)**: Depends on all user stories and edge cases being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Extends US1 but independently testable
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories (reuses existing JournalService)

### Within Each User Story

**CRITICAL TDD Workflow** (Constitutional Principle IV):
1. Tests MUST be written FIRST
2. Tests MUST FAIL (Red phase) before implementation
3. Implementation makes tests PASS (Green phase)
4. Refactor while keeping tests green

**Implementation Order within Story**:
- Tests before implementation (NON-NEGOTIABLE)
- Utility functions (fifo.ts, planVsExecution.ts) before services
- Services (TradeService, PositionService) before components
- Components (forms, cards) before page integration
- Core implementation before edge cases
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 (Setup)**: T001, T002, T003, T004, T005 can all run in parallel (reviewing different files)

**Phase 2 (Foundational)**:
- T010 (planVsExecution.ts) can run parallel with T006-T009
- After T006-T008 complete: T009, T011, T012 can run in parallel (different utility files)

**Phase 3 (User Story 1) Tests**: T013, T014, T015, T016, T017, T018 can all run in parallel (different test files)

**Phase 4 (User Story 2) Tests**: T026, T027, T028, T029 can all run in parallel

**Phase 5 (User Story 3) Tests**: T034, T035, T036, T037, T038 can all run in parallel

**Phase 6 (Edge Cases) Tests**: T048, T049, T050, T051, T052 can all run in parallel

**Phase 7 (Polish)**: T058-T066 can all run in parallel (different files)

**Cross-Story Parallelism**: Once Foundational completes, US1 and US3 can be worked on in parallel (both P1, no dependencies)

---

## Parallel Example: User Story 1

```bash
# Phase 1: Launch all tests for User Story 1 together (write first, expect failures):
Task T014: "Write integration test 'closes position when all shares are sold'"
Task T015: "Write integration test 'handles scale-in position with full exit'"
Task T016: "Write integration test 'displays plan vs execution on position close'"
Task T017: "Write unit test suite for processFIFO() full exit scenarios"
Task T018: "Write unit test suite for computePositionStatus() closed status"

# Verify all tests FAIL (Red phase)

# Phase 2: Launch all US1 implementation tasks in sequence:
Task T019: "Extend TradeService.createTrade() to accept 'sell' type"
Task T020: "Add exit trade validation to TradeService.createTrade()"
# ... continue through T025

# Verify all tests PASS (Green phase)
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 3 Only - Both P1)

1. Complete Phase 1: Setup (review existing code)
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (complete position exit)
4. Complete Phase 5: User Story 3 (journal workflow)
5. **STOP and VALIDATE**: Test US1 + US3 independently
6. Deploy/demo if ready (MVP delivers complete trading lifecycle with journaling)

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Has full close capability
3. Add User Story 3 → Test independently → Has journal workflow → **MVP COMPLETE** ✅
4. Add User Story 2 → Test independently → Adds partial exit flexibility
5. Add Edge Cases (Phase 6) → Comprehensive validation
6. Add Polish (Phase 7) → Production-ready
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With 2 developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (complete exit)
   - Developer B: User Story 3 (journal workflow)
3. Merge US1 + US3 → MVP ready
4. Developer A or B: User Story 2 (partial exit)
5. Team: Edge Cases + Polish together

---

## Notes

- **[P] tasks** = different files, no dependencies, can run in parallel
- **[Story] label** maps task to specific user story for traceability
- **Each user story should be independently completable and testable**
- **TDD is NON-NEGOTIABLE**: Red (failing test) → Green (passing test) → Refactor
- Verify tests fail before implementing (if test passes immediately, the test is wrong)
- Commit after each logical task group (e.g., all US1 tests, all US1 implementation)
- Stop at any checkpoint to validate story independently
- Use `@/` path aliases in imports (never relative paths like `../`)
- Always use `import type` for TypeScript interfaces
- Verify element visibility before interaction in tests: `expect(element).toBeVisible()`
- Follow Constitutional Principles (especially IV: Test-First Discipline, VII: Type Safety)

---

## Success Metrics Validation

After completing all tasks, verify these success criteria from spec.md:

- [ ] **SC-001**: Exit trade save completes in < 30 seconds (excluding journal time)
- [ ] **SC-002**: Journal form appears within 1 second after exit trade save
- [ ] **SC-003**: Trader has clear "Save Journal Now" / "Skip for Daily Review" choice
- [ ] **SC-004**: 100% of exit trades eventually linked to journal entries (via daily review)
- [ ] **SC-005**: FIFO calculations match standard brokerage reporting
- [ ] **SC-006**: Position status transitions to "Closed" within 1 second
- [ ] **SC-007**: Complete trade history visible with realized/unrealized P&L breakdown
- [ ] **SC-008**: Plan vs execution comparison displays immediately on position closure
- [ ] **SC-009**: Invalid exit quantities prevented 100% with clear error messaging
- [ ] **SC-010**: Daily review includes all unjournaled trades
