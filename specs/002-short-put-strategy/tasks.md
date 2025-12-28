# Tasks: Short Put Strategy Support

**Input**: Design documents from `/specs/002-short-put-strategy/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Included per Constitution Principle IV (Test-First Discipline)

**Organization**: Tasks grouped by user story for independent implementation and testing.

**P&L Strategy**: Realized P&L (from trade prices) implemented in MVP. Unrealized P&L (from current market prices) deferred to pricing story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story this task belongs to (US1-US9)
- File paths relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Extend existing project with option strategy foundation

- [ ] T001 Extend Position interface with option fields in src/lib/position.ts (strategy_type, trade_kind, option_type, strike_price, expiration_date, premium_per_contract, profit_target_basis, stop_loss_basis)
- [ ] T002 Extend Trade interface with option fields in src/lib/position.ts (action, occ_symbol, option_type, strike_price, expiration_date, contract_quantity, underlying_price_at_trade, created_stock_position_id, cost_basis_adjustment)
- [ ] T003 [P] Create OCC symbol utility functions in src/lib/utils/occSymbol.ts (generateOccSymbol, parseOccSymbol)
- [ ] T004 [P] Add StrategyType, TradeKind, OptionAction, PriceBasis type definitions to src/lib/position.ts
- [ ] T005 [P] Extend JournalEntryType with 'option_assignment' in src/types/journal.ts
- [ ] T006 Increment IndexedDB schema to v4 in src/services/db.ts (add assignments store, strategy_type index)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core calculators and validators that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 [P] Create OptionContractValidator in src/domain/validators/OptionContractValidator.ts (validateOccSymbol, validateExpiration, validateStrikeMatch)
- [ ] T008 Extend PositionValidator with option plan validation in src/domain/validators/PositionValidator.ts (strike_price > 0, expiration future date, premium > 0 when provided)
- [ ] T009 Extend TradeValidator with option trade validation in src/domain/validators/TradeValidator.ts (STO before expiration, BTC quantity <= open, action matches position type)
- [ ] T010 Extend CostBasisCalculator with per-OCC-symbol FIFO in src/domain/calculators/CostBasisCalculator.ts (calculateOpenQuantityByInstrument)
- [ ] T011 Extend PositionStatusCalculator for option net quantity in src/domain/calculators/PositionStatusCalculator.ts (handle STO/BTC actions)
- [ ] T012 Add lazy migration logic for existing positions in src/services/PositionService.ts (default strategy_type to 'Long Stock', trade_kind to 'stock')

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Create Short Put Position Plan (Priority: P1) 🎯 MVP

**Goal**: Trader can create an immutable Short Put position plan with strike, expiration, targets based on stock or option price, and mandatory thesis

**Independent Test**: Create a Short Put position plan, verify it appears in position list with "planned" status and zero trades

### Tests for User Story 1

> **Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T013 [P] [US1] Unit test for Short Put position creation in tests/unit/position-creation.test.ts
- [ ] T014 [P] [US1] Unit test for option plan validation in tests/unit/option-validators.test.ts
- [ ] T015 [P] [US1] Integration test for Short Put plan flow in tests/integration/short-put-plan.test.ts

### Implementation for User Story 1

- [ ] T016 [P] [US1] Create StrategySelector component in src/components/position/StrategySelector.tsx
- [ ] T017 [P] [US1] Create StrikePriceInput component in src/components/option/StrikePriceInput.tsx
- [ ] T018 [P] [US1] Create ExpirationDatePicker component in src/components/option/ExpirationDatePicker.tsx
- [ ] T019 [P] [US1] Create PriceBasisSelector component in src/components/option/PriceBasisSelector.tsx (for profit_target_basis, stop_loss_basis)
- [ ] T020 [US1] Extend PositionForm with conditional option fields in src/components/position/PositionForm.tsx (show strike, expiration, premium when strategy_type === 'Short Put')
- [ ] T021 [US1] Extend PositionService.create() to handle option plans in src/services/PositionService.ts
- [ ] T022 [US1] Add inline validation error display to PositionForm in src/components/position/PositionForm.tsx (FR-049, FR-050)
- [ ] T023 [US1] Wire CreatePosition page to support Short Put strategy in src/pages/CreatePosition.tsx

**Checkpoint**: User Story 1 complete - Short Put position plans can be created with immutable option details

---

## Phase 4: User Story 2 - Execute Sell-to-Open Trade (Priority: P1)

**Goal**: Trader can add STO trade to planned Short Put, position becomes "open", OCC symbol auto-generated

**Independent Test**: Add STO trade to planned Short Put, verify status changes to "open" and OCC symbol is generated

**Note**: No P&L display in this story - position shows as "open" with trade details only. Unrealized P&L requires current prices (Story 6).

### Tests for User Story 2

- [ ] T024 [P] [US2] Unit test for OCC symbol generation in tests/unit/occSymbol.test.ts
- [ ] T025 [P] [US2] Unit test for STO trade validation in tests/unit/trade-validators.test.ts
- [ ] T026 [P] [US2] Integration test for STO trade flow in tests/integration/sto-trade.test.ts

### Implementation for User Story 2

- [ ] T027 [P] [US2] Create ActionSelector component in src/components/trade/ActionSelector.tsx (STO, BTC options)
- [ ] T028 [US2] Extend TradeForm with option trade fields in src/components/trade/TradeForm.tsx (auto-populate strike/expiration from position, action selector, "Premium per contract" label)
- [ ] T029 [US2] Extend TradeService.addOptionTrade() in src/services/TradeService.ts (generate OCC symbol, validate STO before expiration)
- [ ] T030 [US2] Extend TradeList to show option trade details in src/components/trade/TradeList.tsx (action, strike, expiration, premium)
- [ ] T031 [US2] Show position status and trade summary in PositionDetail (no P&L yet) in src/components/position/PositionDetail.tsx

**Checkpoint**: User Story 2 complete - STO trades can be executed against Short Put plans

---

## Phase 5: User Story 3 - Close Position via Buy-to-Close (Priority: P1)

**Goal**: Trader can close Short Put via BTC trade, position status becomes "closed", **realized P&L** calculated from trade prices

**Independent Test**: Add BTC trade to open Short Put, verify position closes and shows realized P&L

**Note**: Realized P&L uses trade prices only: `(STO premium - BTC premium) × contracts × 100`. No current market prices needed.

### Tests for User Story 3

- [ ] T032 [P] [US3] Unit test for BTC validation in tests/unit/btc-validation.test.ts
- [ ] T033 [P] [US3] Unit test for realized P&L calculation in tests/unit/realized-pnl.test.ts
- [ ] T034 [P] [US3] Integration test for BTC close flow in tests/integration/btc-close.test.ts

### Implementation for User Story 3

- [ ] T035 [US3] Create RealizedPnLCalculator in src/domain/calculators/RealizedPnLCalculator.ts (calculateShortPutRealizedPnL using FIFO-matched trade prices)
- [ ] T036 [US3] Add BTC action handling to TradeService in src/services/TradeService.ts (validate quantity <= open, match contract details)
- [ ] T037 [US3] Add realized P&L display for closed positions in src/components/position/PositionDetail.tsx
- [ ] T038 [US3] Add partial close support (BTC < total contracts) in src/services/TradeService.ts
- [ ] T039 [US3] Update position status calculation for partial closes in src/domain/calculators/PositionStatusCalculator.ts

**Checkpoint**: User Stories 1-3 complete - Full short put lifecycle (plan → STO → BTC) with realized P&L

---

## Phase 6: User Story 4 - Record Expiration Worthless (Priority: P1)

**Goal**: Trader can record "expired" on/after expiration date, creates BTC at $0.00, captures full premium as realized profit

**Independent Test**: Record expiration on Short Put after expiration date, verify BTC at $0.00 and full premium as realized P&L

**Note**: Expiration produces realized P&L (premium received - $0 = full premium). No current prices needed.

### Tests for User Story 4

- [ ] T040 [P] [US4] Unit test for expiration validation in tests/unit/expiration-validation.test.ts
- [ ] T041 [P] [US4] Integration test for expiration flow in tests/integration/expiration-flow.test.ts

### Implementation for User Story 4

- [ ] T042 [US4] Add "Record Expired" action to position actions in src/components/position/PositionActions.tsx
- [ ] T043 [US4] Implement TradeService.recordExpiration() in src/services/TradeService.ts (create BTC at $0.00, validate on/after expiration)
- [ ] T044 [US4] Add expiration confirmation modal in src/components/option/ExpirationModal.tsx

**Checkpoint**: User Story 4 complete - MVP with all closing methods (BTC, expiration) and realized P&L

---

## Phase 7: User Story 5 - Handle Short Put Assignment (Priority: P2)

**Goal**: Trader can record assignment, system creates linked stock position with cost basis = strike - premium

**Independent Test**: Record assignment on Short Put, verify stock position created with correct quantity and cost basis

**Note**: Assignment creates stock position showing realized P&L for the option. Stock position's unrealized P&L displays after prices entered (Story 6).

### Tests for User Story 5

- [ ] T045 [P] [US5] Unit test for assignment cost basis calculation in tests/unit/assignment-cost-basis.test.ts
- [ ] T046 [P] [US5] Integration test for assignment flow in tests/integration/assignment-flow.test.ts

### Implementation for User Story 5

- [ ] T047 [P] [US5] Create AssignmentEvent interface in src/lib/position.ts
- [ ] T048 [US5] Create AssignmentService in src/services/AssignmentService.ts (initiateAssignment, completeAssignment, atomic transaction)
- [ ] T049 [US5] Create AssignmentModal component in src/components/option/AssignmentModal.tsx (multi-step: preview → thesis → journal)
- [ ] T050 [US5] Create AssignmentPreviewStep component in src/components/option/AssignmentPreviewStep.tsx (display premium, cost basis, contracts)
- [ ] T051 [US5] Create StockThesisStep component in src/components/option/StockThesisStep.tsx (auto-populate symbol, quantity)
- [ ] T052 [US5] Create AssignmentJournalStep component in src/components/option/AssignmentJournalStep.tsx (FR-035 prompts)
- [ ] T053 [US5] Add "Record Assignment" action to position actions in src/components/position/PositionActions.tsx
- [ ] T054 [US5] Support partial assignment (n of m contracts) in src/services/AssignmentService.ts

**Checkpoint**: User Story 5 complete - Assignment workflow creates linked stock position

---

## Phase 8a: User Story 6 - Price Entry + Unrealized P&L (Priority: P2)

**Goal**: Trader can enter current prices for stock and options. System calculates unrealized P&L for open positions.

**Independent Test**: Enter stock and option prices for open Short Put, verify unrealized P&L displays correctly

**Note**: This story provides the price entry infrastructure that US7 and US8 depend on.

### Tests for User Story 6

- [ ] T055 [P] [US6] Unit test for unrealized P&L calculation in tests/unit/unrealized-pnl.test.ts
- [ ] T056 [P] [US6] Unit test for price staleness detection in tests/unit/price-staleness.test.ts
- [ ] T057 [P] [US6] Integration test for price update flow in tests/integration/option-pricing.test.ts

### Implementation for User Story 6

#### Price Entry Infrastructure
- [ ] T058 [US6] Extend PriceService to support OCC symbols in src/services/PriceService.ts (getRequiredInstruments, checkStaleness)
- [ ] T059 [US6] Extend price update form for multiple instruments in src/components/price/PriceUpdateForm.tsx (stock + each OCC symbol)
- [ ] T060 [US6] Add 20% price change confirmation in src/components/price/PriceUpdateForm.tsx (FR-032)
- [ ] T061 [US6] Pre-fill existing prices in update form in src/components/price/PriceUpdateForm.tsx (FR-030)
- [ ] T062 [US6] Add staleness warning display in src/components/position/PositionDetail.tsx (FR-031)

#### Unrealized P&L
- [ ] T063 [US6] Create UnrealizedPnLCalculator in src/domain/calculators/UnrealizedPnLCalculator.ts (calculateShortPutUnrealizedPnL)
- [ ] T064 [US6] Add unrealized P&L display for open positions in src/components/position/PositionDetail.tsx
- [ ] T065 [US6] Show "Enter prices to see P&L" message when prices missing in src/components/position/PositionDetail.tsx

**Checkpoint**: User Story 6 complete - Price entry and unrealized P&L working

---

## Phase 8b: User Story 7 - Intrinsic/Extrinsic Display (Priority: P2)

**Goal**: System displays educational intrinsic/extrinsic value breakdown for open positions

**Independent Test**: With stock and option prices entered, verify intrinsic/extrinsic values display correctly

**Depends On**: US6 (requires price entry infrastructure)

### Tests for User Story 7

- [ ] T066 [P] [US7] Unit test for intrinsic/extrinsic calculation in tests/unit/intrinsic-extrinsic.test.ts

### Implementation for User Story 7

- [ ] T067 [US7] Create IntrinsicExtrinsicCalculator in src/domain/calculators/IntrinsicExtrinsicCalculator.ts (calculatePutIntrinsicExtrinsic, isInTheMoney, getMoneyness)
- [ ] T068 [US7] Create IntrinsicExtrinsicDisplay component in src/components/option/IntrinsicExtrinsicDisplay.tsx (per-contract and total values)
- [ ] T069 [US7] Add intrinsic/extrinsic section to PositionDetail in src/components/position/PositionDetail.tsx (FR-036, FR-037, FR-038)

**Checkpoint**: User Story 7 complete - Educational value breakdown displayed

---

## Phase 8c: User Story 8 - Risk-Reward Calculations (Priority: P2)

**Goal**: System calculates and displays distance to profit target and stop loss based on current prices

**Independent Test**: With prices entered and targets set, verify risk-reward indicators display correctly

**Depends On**: US6 (requires price entry infrastructure)

### Tests for User Story 8

- [ ] T070 [P] [US8] Unit test for risk-reward calculation in tests/unit/risk-reward.test.ts

### Implementation for User Story 8

- [ ] T071 [US8] Create RiskRewardCalculator in src/domain/calculators/RiskRewardCalculator.ts (compare current price to profit_target and stop_loss based on their respective basis)
- [ ] T072 [US8] Create RiskRewardDisplay component in src/components/option/RiskRewardDisplay.tsx (distance to target/stop, visual indicator)
- [ ] T073 [US8] Add risk-reward section to PositionDetail in src/components/position/PositionDetail.tsx

**Checkpoint**: User Story 8 complete - Risk-reward indicators working

---

## Phase 9: User Story 9 - View Positions on Dashboard (Priority: P3)

**Goal**: Dashboard displays Short Put positions with strategy badge and option summary

**Independent Test**: Create Short Put position, verify dashboard shows strategy badge and option details

**Depends On**: US1 (plan creation), US6-US8 (for full display with P&L and intrinsic/extrinsic)

### Tests for User Story 9

- [ ] T074 [P] [US9] Integration test for dashboard display in tests/integration/dashboard-display.test.ts

### Implementation for User Story 9

- [ ] T075 [P] [US9] Create StrategyBadge component in src/components/option/StrategyBadge.tsx
- [ ] T076 [P] [US9] Create OptionSummary component in src/components/option/OptionSummary.tsx (strike, expiration, premium received)
- [ ] T077 [US9] Extend PositionCard with strategy badge in src/components/position/PositionCard.tsx (FR-041)
- [ ] T078 [US9] Extend PositionCard with option fields for Short Put in src/components/position/PositionCard.tsx (FR-042)
- [ ] T079 [US9] Add P&L summary to PositionCard (realized or unrealized based on status/prices) in src/components/position/PositionCard.tsx
- [ ] T080 [US9] Add intrinsic/extrinsic summary to PositionCard when prices available in src/components/position/PositionCard.tsx (FR-043)

**Checkpoint**: User Story 9 complete - Dashboard displays Short Put positions correctly

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup, validation, and documentation

- [ ] T081 Run full test suite and fix any failures
- [ ] T082 [P] Verify backward compatibility with existing Long Stock positions
- [ ] T083 [P] Mobile responsiveness review for all new components (44x44px touch targets)
- [ ] T084 [P] Type-only import audit (ensure all interfaces use `import type`)
- [ ] T085 Run quickstart.md validation scenarios
- [ ] T086 [P] Code cleanup: remove any `console.log` statements, unused imports
- [ ] T087 Verify all success criteria from spec.md (SC-001 through SC-017)

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup
    ↓
Phase 2: Foundational (BLOCKS all user stories)
    ↓
┌───────────────────────────────────────────────────────────────┐
│  P1 Stories (MVP) - Sequential, realized P&L only             │
│                                                               │
│  Phase 3: US1 (Plan) ──→ Phase 4: US2 (STO) ──→               │
│  Phase 5: US3 (BTC) ──→ Phase 6: US4 (Expiration)             │
│                                                               │
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

| Story | Depends On | P&L Type |
|-------|------------|----------|
| US1 (Plan) | Foundational | None (no trades yet) |
| US2 (STO) | US1 | None (open position, no current prices) |
| US3 (BTC) | US2 | **Realized** (from trade prices) |
| US4 (Expiration) | US2 | **Realized** (premium - $0) |
| US5 (Assignment) | US2 | **Realized** for option; stock awaits prices |
| US6 (Pricing) | US2 | **Unrealized** P&L |
| US7 (Intrinsic/Extrinsic) | US6 | Educational value breakdown |
| US8 (Risk-Reward) | US6 | Distance to targets/stops |
| US9 (Dashboard) | US1, US6-US8 (for full display) | Shows whatever is available |

### P&L Implementation Summary

| Calculator | Location | Inputs | Story |
|------------|----------|--------|-------|
| RealizedPnLCalculator | src/domain/calculators/ | Trade prices (STO, BTC) | US3 |
| UnrealizedPnLCalculator | src/domain/calculators/ | Current option price | US6 |
| IntrinsicExtrinsicCalculator | src/domain/calculators/ | Current stock + option prices | US7 |
| RiskRewardCalculator | src/domain/calculators/ | Current price vs targets/stops | US8 |

### Parallel Opportunities

**Phase 2 (Foundational):**
```
T007 can run in parallel with others (different file)
```

**Phase 3 (US1):**
```
T013, T014, T015 in parallel (tests)
T016, T017, T018, T019 in parallel (components)
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

---

## Implementation Strategy

### MVP First (User Stories 1-4) - Realized P&L Only

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (**CRITICAL**)
3. Complete Phase 3: US1 (Plan Creation)
4. Complete Phase 4: US2 (STO Trade)
5. Complete Phase 5: US3 (BTC Close) - **Realized P&L works**
6. Complete Phase 6: US4 (Expiration) - **Realized P&L works**
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

**US1 + US2 + US3 + US4** (Phases 1-6, ~44 tasks)
- Complete short put lifecycle: plan → STO → BTC or expire
- Realized P&L calculated from trade prices
- No dependency on price entry system

---

## Summary

| Metric | Count |
|--------|-------|
| **Total Tasks** | 87 |
| Setup Tasks | 6 |
| Foundational Tasks | 6 |
| US1 Tasks (P1) | 11 |
| US2 Tasks (P1) | 8 |
| US3 Tasks (P1) | 8 |
| US4 Tasks (P1) | 5 |
| US5 Tasks (P2) | 10 |
| US6 Tasks (P2) | 11 |
| US7 Tasks (P2) | 4 |
| US8 Tasks (P2) | 4 |
| US9 Tasks (P3) | 7 |
| Polish Tasks | 7 |
| **Parallelizable [P]** | 35 (40%) |

### P&L Strategy Summary

| Phase | P&L Type | Price Source | Story |
|-------|----------|--------------|-------|
| MVP (P1) | Realized | Trade prices (STO premium, BTC premium) | US3 |
| Post-MVP (P2) | Unrealized | Current market prices | US6 |
| Post-MVP (P2) | Intrinsic/Extrinsic | Current stock + option prices | US7 |
| Post-MVP (P2) | Risk-Reward | Current price vs plan targets | US8 |

---

## Notes

- **Realized P&L** works without any price entry - uses trade execution prices
- **Unrealized P&L** requires current prices - delivered in US6
- **Intrinsic/Extrinsic** builds on US6 price infrastructure - delivered in US7
- **Risk-Reward** builds on US6 price infrastructure - delivered in US8
- US7 and US8 can be implemented in parallel after US6 completes
- All tasks include TDD tests per Constitution Principle IV
- Each user story checkpoint enables independent validation and feedback
- MVP delivers complete trading lifecycle before adding price-dependent features
