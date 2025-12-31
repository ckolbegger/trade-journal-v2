# Test Case Examples

Real examples of well-written compact test case descriptions.

---

## UI Component Examples

### Selector Component
```markdown
- [ ] T009 [P] [US1] Create StrategySelector component with comprehensive unit tests in src/components/position/StrategySelector.tsx
  - Tests: renders options, selection changes value, default to Long Stock, keyboard accessible
```

### Input Component
```markdown
- [ ] T010 [P] [US1] Create StrikePriceInput component with comprehensive unit tests in src/components/option/StrikePriceInput.tsx
  - Tests: happy path, rejects negative, rejects non-numeric, accepts decimals, min value 0.01
```

### Date Picker
```markdown
- [ ] T011 [P] [US1] Create ExpirationDatePicker component with comprehensive unit tests in src/components/option/ExpirationDatePicker.tsx
  - Tests: happy path, rejects past dates, valid date format, handles timezone
```

### Action Selector
```markdown
- [ ] T024 [P] [US2] Create ActionSelector component with comprehensive unit tests in src/components/trade/ActionSelector.tsx
  - Tests: renders STO/BTC options, selection changes value, disabled states, shows current action
```

---

## Validator Examples

### Contract Validator
```markdown
- [ ] T018 [P] [US2] Create OptionContractValidator with comprehensive unit tests in src/domain/validators/OptionContractValidator.ts
  - Tests: valid OCC format, invalid OCC rejected, expiration in future, strike matches position
```

### Trade Validator
```markdown
- [ ] T019 [P] [US2] Extend TradeValidator with STO validation with comprehensive unit tests
  - Tests: STO before expiration valid, STO after expiration rejected, action matches position type
```

---

## Calculator Examples

### Cost Basis Calculator
```markdown
- [ ] T029 [US3] Extend CostBasisCalculator with per-OCC-symbol FIFO with comprehensive unit tests
  - Tests: single contract FIFO, multiple contracts FIFO order, partial close matching, mixed symbols separate
```

### Realized P&L Calculator
```markdown
- [ ] T034 [US3] Create RealizedPnLCalculator with comprehensive unit tests in src/domain/calculators/RealizedPnLCalculator.ts
  - Tests: full close P&L correct, partial close P&L correct, FIFO matching order, handles multiple STO trades
```

---

## Service Examples

### Trade Service
```markdown
- [ ] T026 [US2] Extend TradeService.addOptionTrade() with comprehensive unit tests
  - Tests: generates OCC symbol, validates STO timing, persists trade, updates position status
```

---

## Task-Level Integration Test Examples

### Service Coordination (add after the service task)
```markdown
- [ ] T039 [US5] Create AssignmentService with comprehensive unit tests in src/services/AssignmentService.ts
  - Tests: calculates cost basis (strike - premium), creates linked stock position, atomic transaction rollback on error

- [ ] T040 [US5] Integration test for AssignmentService coordination in tests/integration/assignment-service.test.ts
  - Tests: calls TradeService to close option, calls PositionService to create stock, links positions, rollback on failure
```

### Page Wiring (add after the wiring task)
```markdown
- [ ] T013 [US1] Wire CreatePosition page to support Short Put strategy in src/pages/CreatePosition.tsx

- [ ] T014 [US1] Integration test for CreatePosition Short Put wiring in tests/integration/create-position-wiring.test.ts
  - Tests: form renders option fields, submits to PositionService, navigates to detail on success, shows error on failure
```

### Workflow Orchestration
```markdown
- [ ] T048 [US5] Create AssignmentModal component with comprehensive unit tests
  - Tests: multi-step navigation, back button, state persists between steps, close resets state

- [ ] T049 [US5] Integration test for assignment modal workflow in tests/integration/assignment-modal-flow.test.ts
  - Tests: preview → thesis → journal → submit, back navigation preserves data, final submit creates both positions
```

---

## Story-Level Integration Test Examples

### Complete User Flow
```markdown
### Integration Tests for User Story 1

> **Write after implementation is complete** to verify the full user flow

- [ ] T015 [US1] Integration test for Short Put plan creation flow in tests/integration/short-put-plan.test.ts
  - Tests: complete UI flow from dashboard to plan saved, validation errors displayed inline, plan appears in position list
```

### With Multiple Coverage Areas
```markdown
### Integration Tests for User Story 3

> **Write after implementation is complete** to verify the full user flow

- [ ] T031 [US3] Integration test for BTC close flow in tests/integration/btc-close.test.ts
  - Tests: BTC from position detail, position status changes to closed, realized P&L displayed correctly

- [ ] T032 [US3] Integration test for partial BTC flow in tests/integration/btc-partial.test.ts
  - Tests: partial close leaves position open, remaining quantity correct, multiple BTC until fully closed
```

### Display Feature (still needs integration test)
```markdown
### Integration Tests for User Story 7

> **Write after implementation is complete** to verify display works when wired

- [ ] T059 [US7] Integration test for intrinsic/extrinsic display in tests/integration/intrinsic-extrinsic-display.test.ts
  - Tests: values display after price entry, ITM/OTM indicator correct, updates when price changes
```

---

## Writing Style Guide

### DO: Use compact verb phrases
- "renders options"
- "rejects negative"
- "handles timezone"
- "validates before save"

### DON'T: Write full sentences
- ~~"it should render all the options correctly"~~
- ~~"the component rejects negative numbers"~~

### DO: Be specific about the condition
- "rejects past dates"
- "min value 0.01"
- "STO before expiration valid"

### DON'T: Be vague
- ~~"handles invalid input"~~
- ~~"works correctly"~~
- ~~"validates properly"~~

### DO: Cover multiple categories in one line
- "renders options, selection changes value, default to Long Stock, keyboard accessible"
  - (render + interaction + defaults + a11y)

### DON'T: List every micro-test
- Keep to 4-6 key test cases per task
- Group related tests conceptually
