# Implementation Tasks: Short Put Strategy Support

**Feature**: 002-short-put-strategy | **Generated**: 2025-12-27
**Based On**: plan.md, spec.md, data-model.md, contracts/api.yaml
**Methodology**: Test-Driven Development (TDD) with Just-In-Time Implementation

## Philosophy

**Defer Everything Until Needed**: Only implement what is required for the current user story. No speculative code, no anticipatory utilities. Types evolve with implementation knowledge.

## Task Summary

| Metric | Count |
|--------|-------|
| Total Tasks | 44 |
| Unit Test Tasks (Step 1) | 18 (41%) |
| Implementation Tasks (Step 2) | 18 (41%) |
| Integration Test Tasks (Step 3) | 8 (18%) |

---

## Phase 1: User Story 1 - Create Short Put Position Plan

**Goal**: Enable traders to create Short Put position plans and see them on the dashboard
**Priority**: P1 (Foundation - first visible deliverable)
**Outcome**: User can create a Short Put position and see it on the dashboard

### Step 1: Unit Tests (RED)

- [ ] T001 Create unit tests for PositionCreate form validation in src/__tests__/components/position-create.test.tsx
  - Mock: useNavigate, usePositionStore
  - Test: Select "Short Put" strategy → option fields visible
  - Test: Enter strike price → validates as positive number
  - Test: Enter past expiration → shows error
  - Test: Enter future expiration → no error
  - Test: Enter thesis < 10 chars → shows error
  - Test: Clear invalid field → error clears
  - Test: Form submit with valid fields → calls createPosition
  - Test: Form submit with invalid fields → focuses first error
- [ ] T002 Create unit tests for StrikePricePicker component in src/__tests__/components/strike-picker.test.tsx
  - Mock: none (UI component tests)
  - Test: Renders input field
  - Test: Accepts valid numeric input
  - Test: Rejects non-numeric input
  - Test: Displays formatted value ($105.00)
  - Test: Shows error on invalid value
- [ ] T003 Create unit tests for ExpirationDatePicker in src/__tests__/components/expiration-picker.test.tsx
  - Mock: date-fns for date comparison
  - Test: Renders date input
  - Test: Past date selected → shows error
  - Test: Future date selected → no error
  - Test: Today's date selected → no error
  - Test: Date formatted correctly (MM/DD/YYYY)
- [ ] T004 Create unit tests for PositionCard component in src/__tests__/components/position-card.test.tsx
  - Mock: usePositionStore
  - Test: Renders position with basic info (symbol, status, P&L)
  - Test: Displays "Short Put" strategy badge
  - Test: Displays strike price
  - Test: Displays expiration date
  - Test: Displays premium received
  - Test: Displays status badge (planned/open/closed)
  - Test: Click navigates to position detail

### Step 2: Implementation (GREEN)

- [ ] T005 Extend Position type with option fields in src/types/journal.ts
  - Add strategy_type: 'Long Stock' | 'Short Put'
  - Add trade_kind: 'stock' | 'option'
  - Add option_type?: 'call' | 'put'
  - Add strike_price?: number
  - Add expiration_date?: Date
  - Add premium_per_contract?: number
  - Add profit_target_basis?: 'stock_price' | 'option_price'
  - Add stop_loss_basis?: 'stock_price' | 'option_price'
- [ ] T006 Create inline validators for position creation in src/lib/validators.ts
  - validateSymbol(input: string): ValidationResult
  - validateExpirationDate(date: Date): ValidationResult
  - validateStrikePrice(price: number): ValidationResult
  - validateQuantity(qty: number): ValidationResult
- [ ] T007 Create StrikePricePicker component in src/components/ui/StrikePricePicker.tsx
  - Props: value, onChange, error, disabled
  - Input with $ formatting
  - Inline validation
- [ ] T008 Create ExpirationDatePicker component in src/components/ui/ExpirationDatePicker.tsx
  - Props: value, onChange, error, disabled, minDate
  - Date input with picker
  - Past date validation
- [ ] T009 Extend PositionCreate page for Short Put in src/pages/PositionCreate.tsx
  - Add strategy selector with "Short Put" option
  - Show option fields when Short Put selected
  - Strike price input with StrikePricePicker
  - Expiration date with ExpirationDatePicker
  - Premium per contract input
  - Profit target with basis selector (stock_price/option_price)
  - Stop loss with basis selector
  - Inline validation on all fields
  - Journal entry prompt before save
- [ ] T010 Extend PositionCard for Short Put display in src/components/PositionCard.tsx
  - Strategy type badge ("Short Put")
  - Strike price display with label
  - Expiration date display with label
  - Premium received display with label
  - Status badge (planned/open/closed)
  - Click to navigate to position detail
- [ ] T011 Implement PositionService.createPosition() in src/services/PositionService.ts
  - Validate position data using inline validators
  - Create position with status "planned"
  - Create journal entry for thesis
  - Persist to IndexedDB

### Step 3: Integration Tests (GREEN)

- [ ] T012 Create integration test: Full Short Put position creation flow in src/__tests__/integration/short-put-creation.test.tsx
  - Use fake-indexeddb
  - Navigate to position creation
  - Select Short Put strategy
  - Fill all required fields
  - Submit and verify position created with "planned" status
  - Navigate to dashboard, verify position appears in list
  - Verify strategy badge, strike, expiration, premium display

---

## Phase 2: User Story 2 - Execute Sell-to-Open Trade

**Goal**: Allow traders to add STO trades to planned Short Put positions
**Priority**: P1 (Core action of short put strategy)
**Outcome**: User can add a trade to their planned position, status changes to "open"

### Step 1: Unit Tests (RED)

- [ ] T013 Create unit tests for TradeForm option fields in src/__tests__/components/trade-form-option.test.tsx
  - Mock: usePositionStore, useTradeStore
  - Test: Option trade selected → option fields visible
  - Test: Auto-populated fields from position (strike, expiration, type)
  - Test: OCC symbol generated and displayed
  - Test: Price field labeled "Premium per contract"
  - Test: Contract quantity × 100 shown
  - Test: Validation error if strike mismatch
  - Test: Validation error if expiration mismatch
- [ ] T014 Create unit tests for TradeService STO handling in src/__tests__/services/trade-service-sto.test.ts
  - Mock: IndexedDB with jest mocks
  - Test: Add STO trade to planned position
  - Test: Position status changes to "open"
  - Test: OCC symbol generated from position data
  - Test: Contract quantity × 100 multiplier applied
  - Test: Error if STO after expiration date
  - Test: Error if strike doesn't match position
- [ ] T015 Create unit tests for OCC symbol generation in src/__tests__/lib/occ-utils.test.ts
  - Mock: date-fns for consistent date formatting
  - Test: AAPL $105 Put expiring 2025-01-17 → "AAPL  250117P00105000"
  - Test: Strike padding: $105.00 → "00105000"
  - Test: Date formatting: 2025-01-17 → "250117"
  - Test: Option type: put → "P", call → "C"
  - Test: Symbol padding: "AAPL" → "AAPL  "
  - Test: Error case: invalid symbol (lowercase)

### Step 2: Implementation (GREEN)

- [ ] T016 Extend Trade type with option fields in src/types/journal.ts
  - Add trade_kind: 'stock' | 'option'
  - Add action?: 'STO' | 'BTC' | 'BTO' | 'STC'
  - Add occ_symbol?: string
  - Add option_type?: 'call' | 'put'
  - Add strike_price?: number
  - Add expiration_date?: Date
  - Add contract_quantity?: number
  - Add underlying_price_at_trade?: number
- [ ] T017 Create OCC symbol generation utility in src/lib/occ-utils.ts
  - generateOCCSymbol(symbol, expirationDate, optionType, strikePrice): string
  - Returns formatted OCC symbol per spec: "AAPL  250117P00105000"
- [ ] T018 Create TradeForm for option trades in src/components/TradeForm.tsx
  - Detect option position, show option-specific fields
  - Auto-populate from position plan
  - Generate and display OCC symbol
  - "Premium per contract" label
  - Contract quantity input
  - Underlying price at trade (optional)
  - Inline validation
- [ ] T019 Implement TradeService.createSTO() in src/services/TradeService.ts
  - validateOptionTrade(trade, position): ValidationResult
  - generateTradeOCCSymbol(position, trade): string
  - createOptionTrade(positionId, tradeData): Trade
  - checkSTOAllowed(position): ValidationResult
  - Update position status to "open"

### Step 3: Integration Tests (GREEN)

- [ ] T020 Create integration test: Full STO trade execution flow in src/__tests__/integration/sto-execution.test.tsx
  - Use fake-indexeddb
  - Navigate to dashboard, find planned Short Put position
  - Click position, navigate to detail
  - Click "Add Trade"
  - Fill STO trade details (quantity, premium)
  - Submit and verify trade created
  - Verify position status changed to "open"
  - Verify OCC symbol generated
  - Navigate to dashboard, verify position now shows "open" status

---

## Phase 3: User Story 3 - Close Position via Buy-to-Close

**Goal**: Allow traders to close Short Put positions with BTC trades
**Priority**: P1 (Completes the trade lifecycle)
**Outcome**: User can close a position, realized P&L displays correctly

### Step 1: Unit Tests (RED)

- [ ] T021 Create unit tests for TradeService BTC handling in src/__tests__/services/trade-service-btc.test.ts
  - Mock: IndexedDB with jest mocks
  - Test: Add BTC trade, position closes
  - Test: Realized P&L calculated correctly ($200 profit per contract)
  - Test: Cannot close more contracts than open
  - Test: Partial close (5→3) works
  - Test: Full close (5→0) closes position
  - Test: Error if contract details mismatch (strike, expiration)
  - Test: Error if quantity exceeds open contracts
- [ ] T022 Create unit tests for PnLDisplay component in src/__tests__/components/pnl-display.test.tsx
  - Mock: usePositionStore
  - Test: Displays "Unrealized" label for open position
  - Test: Displays "Realized" label for closed position
  - Test: Shows dollar amount with formatting
  - Test: Shows positive P&L in green, negative in red

### Step 2: Implementation (GREEN)

- [ ] T023 Implement realized P&L calculator in src/lib/pnl-calculator.ts
  - calculateRealizedPnL(openTrade, closeTrade): number
  - FIFO matching for multiple lots
  - Formula: (sell price - buy price) × contracts × 100
- [ ] T024 Extend TradeService.createBTC() in src/services/TradeService.ts
  - validateBTCTrade(trade, position): ValidationResult
  - calculateRealizedPnLOnClose(openTrade, closeTrade): number
  - createClosingTrade(positionId, tradeData): Trade
  - Update position status (partial → "open", full → "closed")
- [ ] T025 Extend PnLDisplay component in src/components/PnLDisplay.tsx
  - Props: position, trades
  - Calculate realized P&L using PnLCalculator
  - Display "Realized" label for closed positions
  - Color coding (green positive, red negative)
  - Dollar formatting

### Step 3: Integration Tests (GREEN)

- [ ] T026 Create integration test: Full BTC close workflow in src/__tests__/integration/btc-close.test.tsx
  - Use fake-indexeddb
  - Navigate to open Short Put position from dashboard
  - Click "Add Trade", select BTC action
  - Enter close price (e.g., $1.00 for $2.00 profit)
  - Submit and verify trade created
  - Verify position status changes to "closed"
  - Verify realized P&L displays correctly (green $200)
  - Test partial close (5→3, position remains open)
  - Test full close (5→0, position closes)

---

## Phase 4: User Story 4 - Record Expiration Worthless

**Goal**: Allow traders to record options that expire out-of-the-money
**Priority**: P2 (Second most common exit)
**Outcome**: User can record expiration, full premium captured as profit

### Step 1: Unit Tests (RED)

- [ ] T027 Create unit tests for expiration recording in src/__tests__/services/expiration-service.test.ts
  - Mock: IndexedDB with jest mocks
  - Test: Create $0.00 BTC trade for expiration
  - Test: Validate expiration date (must be on/after expiration)
  - Test: Error if before expiration date
  - Test: Calculate full premium as realized profit
  - Test: Position status changes to "closed"

### Step 2: Implementation (GREEN)

- [ ] T028 Implement ExpirationService in src/services/ExpirationService.ts
  - validateExpirationDate(position): ValidationResult
  - createExpirationTrade(positionId): Trade ($0.00 price)
  - calculateFullPremiumRealized(position): number
  - closePositionOnExpiration(positionId): void

### Step 3: Integration Tests (GREEN)

- [ ] T029 Create integration test: Expiration worthless workflow in src/__tests__/integration/expiration-worthless.test.tsx
  - Use fake-indexeddb
  - Open Short Put position past expiration
  - Click "Record Expiration"
  - Verify position closed at $0.00
  - Verify full premium captured as realized P&L ($300 for 3 contracts × $1.00)

---

## Phase 5: User Story 5 - Handle Short Put Assignment

**Goal**: Record option assignment and create resulting stock position
**Priority**: P2 (Real-world outcome handling)
**Outcome**: User can record assignment, stock position created with correct cost basis

### Step 1: Unit Tests (RED)

- [ ] T030 Create unit tests for AssignmentService in src/__tests__/services/assignment-service.test.ts
  - Mock: IndexedDB with jest mocks
  - Test: Create BTC trade at $0.00 for assigned contracts
  - Test: Calculate cost basis = strike - premium_received
  - Test: Create stock position with ×100 quantity
  - Test: Partial assignment (2 of 5 contracts)
  - Test: Reference values displayed (premium, cost basis)
  - Test: Error if before expiration date

### Step 2: Implementation (GREEN)

- [ ] T031 Implement AssignmentService in src/services/AssignmentService.ts
  - validateAssignment(position): ValidationResult
  - createAssignmentTrade(positionId, contractsAssigned): Trade
  - calculateAssignedCostBasis(position): number
  - createStockPositionFromAssignment(assignmentTrade): Position
- [ ] T032 Create AssignmentModal component in src/components/AssignmentModal.tsx
  - Display premium received (read-only)
  - Display effective cost basis (read-only)
  - Contract quantity input
  - Journal entry form with custom prompts
  - Confirm/cancel buttons

### Step 3: Integration Tests (GREEN)

- [ ] T033 Create integration test: Full assignment workflow in src/__tests__/integration/assignment-workflow.test.tsx
  - Use fake-indexeddb
  - Open Short Put position at expiration
  - Click "Record Assignment"
  - Enter quantity (e.g., 3 contracts)
  - Complete assignment modal
  - Verify option position closed
  - Verify stock position created (300 shares)
  - Verify cost basis calculated correctly ($102 = $105 - $3)

---

## Phase 6: User Story 6 - Update Prices and Display Intrinsic/Extrinsic

**Goal**: Update prices and display intrinsic/extrinsic breakdown
**Priority**: P2 (Performance tracking and educational value)
**Outcome**: User can enter prices, see intrinsic/extrinsic values

### Step 1: Unit Tests (RED)

- [ ] T034 Create unit tests for PriceEntryForm in src/__tests__/components/price-entry-form.test.tsx
  - Mock: usePriceStore
  - Test: Enter stock price and option price
  - Test: 20% change confirmation dialog
  - Test: Pre-fill existing price
  - Test: Show staleness warning if missing
- [ ] T035 Create unit tests for PriceService in src/__tests__/services/price-service.test.ts
  - Mock: IndexedDB with jest mocks
  - Test: Save price entry for instrument
  - Test: Get price for instrument/date
  - Test: Return existing price if available
  - Test: Detect 20%+ price change
- [ ] T036 Create unit tests for unrealized P&L and intrinsic/extrinsic in src/__tests__/lib/option-pnl.test.ts
  - Test: Intrinsic value - $105 strike, stock $100 = $5.00
  - Test: Intrinsic value - $105 strike, stock $110 = $0.00 (OTM)
  - Test: Extrinsic value - option $2.50, intrinsic $5.00 = -$2.50
  - Test: Extrinsic value - option $2.00, intrinsic $0.00 = $2.00
  - Test: Unrealized P&L - STO $3.00, current $2.50 = $50 profit
  - Test: Break-even - $105 strike, $3.00 premium = $102.00
  - Test: Max profit - $3.00 premium × 100 = $300 per contract
  - Test: Max loss - ($105 - $3) × 100 = $10,200 per contract

### Step 2: Implementation (GREEN)

- [ ] T037 Create PriceEntry type in src/types/priceHistory.ts
  - instrument_id: string (stock symbol or OCC symbol)
  - date: Date
  - close_price: number
- [ ] T038 Implement PriceService in src/services/PriceService.ts
  - savePriceEntry(entry): PriceEntry
  - getPriceForInstrument(instrumentId, date): PriceEntry | null
  - detectLargePriceChange(instrumentId, newPrice): boolean
- [ ] T039 Create PriceEntryForm component in src/components/PriceEntryForm.tsx
  - Stock price input
  - Option price input
  - 20% change confirmation dialog
  - Staleness warning
- [ ] T040 Implement unrealized P&L and intrinsic/extrinsic in src/lib/option-pnl.ts
  - calculateIntrinsicValue(stockPrice, strikePrice): number
  - calculateExtrinsicValue(optionPrice, intrinsicValue): number
  - calculateUnrealizedPnL(premiumReceived, currentOptionPrice, contracts): number
  - calculateBreakEven(strikePrice, premiumReceived): number
  - calculateMaxProfit(premiumReceived): number
  - calculateMaxLoss(strikePrice, premiumReceived): number
- [ ] T041 Extend PnLDisplay to show intrinsic/extrinsic in src/components/PnLDisplay.tsx
  - Display intrinsic value
  - Display extrinsic value
  - Show breakdown when prices available

### Step 3: Integration Tests (GREEN)

- [ ] T042 Create integration test: Price update and intrinsic/extrinsic display in src/__tests__/integration/price-update.test.tsx
  - Use fake-indexeddb
  - Navigate to open Short Put position
  - Click "Update Prices"
  - Enter stock price ($95) and option price ($2.50)
  - Verify intrinsic displays ($5.00)
  - Verify extrinsic displays (-$2.50)
  - Verify 20% confirmation appears for large change

---

## Phase 7: Final - Regression Tests

### Step 1: Unit Tests (RED)

- [ ] T043 Create unit tests for Long Stock regression in src/__tests__/components/long-stock.test.tsx
  - Mock: all store dependencies
  - Test: Long Stock position creation still works
  - Test: Stock trade execution still works
  - Test: Stock P&L calculation still works
  - Test: No option fields in stock workflow

### Step 2: Implementation (No implementation needed - verification only)

### Step 3: Integration Tests (GREEN)

- [ ] T044 Create full regression test suite in src/__tests__/integration/long-stock-regression.test.tsx
  - Use fake-indexeddb
  - Test all existing Long Stock workflows
  - Verify no regression in position creation
  - Verify no regression in trade execution
  - Verify no regression in P&L calculation

---

## Implementation Strategy

### MVP (Recommended First Deliverable)

**Complete Phases 1-3** (US1-US3):
- Create Short Put position plans
- Execute sell-to-open trades
- Close positions via buy-to-close with realized P&L

This delivers a complete trading workflow in 1-2 weeks.

### Full Feature (All Phases)

1. **Sprint 1**: Phase 1 (US1) - Create and view positions
2. **Sprint 2**: Phase 2 (US2) - Execute trades
3. **Sprint 3**: Phase 3 (US3) - Close positions
4. **Sprint 4**: Phase 4 (US4) - Expiration
5. **Sprint 5**: Phase 5 (US5) - Assignment
6. **Sprint 6**: Phase 6 (US6) - Price updates and intrinsic/extrinsic
7. **Sprint 7**: Phase 7 - Regression tests

---

## File Paths Reference

| Path | When Created | Purpose |
|------|--------------|---------|
| `src/types/journal.ts` | Phase 1 | Position and Trade type extensions |
| `src/types/priceHistory.ts` | Phase 6 | PriceEntry type |
| `src/lib/validators.ts` | Phase 1 | Form validation |
| `src/lib/occ-utils.ts` | Phase 2 | OCC symbol generation |
| `src/lib/pnl-calculator.ts` | Phase 3 | Realized P&L |
| `src/lib/option-pnl.ts` | Phase 6 | Intrinsic/extrinsic, unrealized P&L |
| `src/services/PositionService.ts` | Phase 1 | Position CRUD |
| `src/services/TradeService.ts` | Phase 2+ | Trade CRUD |
| `src/services/ExpirationService.ts` | Phase 4 | Expiration recording |
| `src/services/AssignmentService.ts` | Phase 5 | Assignment handling |
| `src/services/PriceService.ts` | Phase 6 | Price storage |
| `src/components/ui/StrikePricePicker.tsx` | Phase 1 | Strike input |
| `src/components/ui/ExpirationDatePicker.tsx` | Phase 1 | Date picker |
| `src/components/PositionCard.tsx` | Phase 1 | Dashboard card |
| `src/components/TradeForm.tsx` | Phase 2 | Trade entry |
| `src/components/PnLDisplay.tsx` | Phase 3+ | P&L display |
| `src/components/AssignmentModal.tsx` | Phase 5 | Assignment modal |
| `src/components/PriceEntryForm.tsx` | Phase 6 | Price entry |
| `src/pages/PositionCreate.tsx` | Phase 1 | Position creation |
| `src/__tests__/components/*.test.tsx` | Each Phase | Component unit tests |
| `src/__tests__/services/*.test.ts` | Each Phase | Service unit tests |
| `src/__tests__/integration/*.test.tsx` | Each Phase | End-to-end tests |
