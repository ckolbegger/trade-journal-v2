# Implementation Tasks: Short Put Strategy Support

**Feature**: 002-short-put-strategy
**Branch**: `002-short-put-strategy`
**Generated**: 2025-12-27
**Revised**: 2025-12-31 (Value Delivery Audit Reorganization + Critical Fixes)
**Methodology**: Test-Driven Development (TDD) - Test Suite First Approach

## Overview

This document provides a dependency-ordered task list for implementing Short Put Strategy Support using **Test-Driven Development with Comprehensive Test Suites** and **Just-in-Time Delivery**.

**TDD Workflow for Each Feature**:
1. **Red**: Write a comprehensive test suite covering all scenarios for the feature
2. **Green**: Implement code to make the entire test suite pass
3. **Refactor**: Improve code while keeping all tests green

**Just-in-Time Delivery Strategy**:
- Foundational work is deferred to the user story where it's actually needed
- MVP (US1-US3) can be delivered with minimal foundational investment
- Each user story brings its own supporting logic

**Technology Stack**:
- TypeScript 5.8.3, React 19.1.1, Vite 7.1.2
- IndexedDB v4 (TradingJournalDB)
- Vitest + React Testing Library + fake-indexeddb

---

## Task Legend

- `- [ ]` - Pending task (checkbox for tracking)
- `T###` - Sequential task ID
- `[P]` - Parallelizable (different files, no dependencies)
- `[US#]` - User story label (maps to spec.md user stories)
- **(TEST)** - Write comprehensive test suite covering all scenarios
- **(IMPL)** - Implement code to make the entire test suite pass

---

## User Story 1 - Create Short Put Position Plan (P1) - 30 tasks

**Goal**: Trader can create a planned Short Put position with option-specific fields

**Independent Test**: Create a Short Put position plan and verify it appears in position list with "planned" status

### Phase 1A: Setup & Infrastructure (8 tasks)

**Goal**: Establish minimal foundation for option strategy support

#### Database Migration

- [x] T001 (TEST) Write comprehensive test suite for database v3→v4 migration covering:
    • Database version increments from 3 to 4
    • Migration handler runs automatically on upgrade
    • Existing positions without strategy_type default to 'Long Stock'
    • Existing positions without option_fields remain valid
    • Migration is idempotent (running twice doesn't corrupt data)
    • All existing data is preserved during migration
    File: `src/services/__tests__/SchemaManager-option-migration.test.ts`
- [x] T002 (IMPL) Increment database version to 4 and add v3→v4 migration handler in `src/services/SchemaManager.ts`
    Run tests to verify all migration scenarios pass
    **CRITICAL DEPENDENCY**: Must complete before T004 type extensions - IndexedDB won't store new option fields until migration runs

#### Type Extensions - With Tests

- [x] T003 (TEST) Write comprehensive type verification tests for Position interface covering:
    • Position interface extends with option fields (option_type, strike_price, expiration_date, premium_per_contract)
    • strategy_type union accepts 'Long Stock' and 'Short Put'
    • New fields are optional (undefined is valid for Long Stock)
    • profit_target_basis and stop_loss_basis accept correct union values
    • Type imports use type-only syntax: `import type { Position }`
    • Type compiles without errors in browser context
    File: `src/types/__tests__/position-types.test.ts`
- [x] T004 (IMPL) Extend Position interface with option fields in `src/lib/position.ts`

- [x] T005 (TEST) Write comprehensive type verification tests for Trade interface covering:
    • Trade interface extends with option fields (action, occ_symbol, option_type, strike_price, expiration_date, underlying_price_at_trade)
    • New fields are optional (undefined is valid for stock trades)
    • action union accepts 'STO' | 'BTC' | 'BTO' | 'STC'
    • Assignment linkage fields (created_stock_position_id, cost_basis_adjustment) are optional
    • Type compiles without errors in browser context
    File: `src/types/__tests__/trade-types.test.ts`
- [x] T006 (IMPL) Extend Trade interface with option fields in `src/lib/position.ts`

- [x] T007 (TEST) Write comprehensive type verification tests for JournalEntry extensions covering:
    • entry_type union accepts 'option_assignment'
    • OPTION_ASSIGNMENT_PROMPTS array exists with correct structure
    • Assignment prompts include required fields (assignment_cause)
    • Assignment prompts include optional fields (feelings_about_stock, stock_plan)
    • Type compiles without errors
    File: `src/types/__tests__/journal-types.test.ts`
- [x] T008 (IMPL) Add option_assignment journal entry type and prompts in `src/types/journal.ts`

---

### Phase 1B: Core User Story 1 Tasks (22 tasks)

**Foundational for this story**: PositionService extension for option strategy creation

#### Service Extension

- [x] T009 [US1] (TEST) Write comprehensive test suite for createWithOptionStrategy() covering:
    • Creates Short Put position with all option fields saved correctly
    • Returns created position with generated ID
    • Calls validateOptionPosition() before saving
    • Rejects invalid positions with ValidationError
    • Long Stock positions still create correctly
    • Position saves to IndexedDB positions store
    File: `src/services/__tests__/PositionService-options.test.ts`
- [x] T010 [US1] (IMPL) Implement createWithOptionStrategy() in `src/services/PositionService.ts`

#### Position Validator

- [x] T011 [US1] (TEST) Write comprehensive test suite for validateOptionPosition() covering:
    • Valid Short Put position: All required option fields present → passes
    • Missing option_type when strategy_type='Short Put' → throws ValidationError
    • Missing strike_price when strategy_type='Short Put' → throws ValidationError
    • Missing expiration_date when strategy_type='Short Put' → throws ValidationError
    • Missing profit_target_basis when strategy_type='Short Put' → throws ValidationError
    • Missing stop_loss_basis when strategy_type='Short Put' → throws ValidationError
    • Past expiration_date → throws ValidationError (must be future)
    • Strike price <= 0 → throws ValidationError
    • Long Stock position passes validation (no option fields required)
    File: `src/domain/validators/__tests__/OptionValidators.test.ts`
- [x] T012 [US1] (IMPL) Implement validateOptionPosition() in `src/domain/validators/PositionValidator.ts`

#### Strategy Selector Component

- [x] T013 [US1] (TEST) Write comprehensive test suite for strategy selector dropdown covering:
    • Dropdown renders with all strategy options ('Long Stock', 'Short Put')
    • Default selection is 'Long Stock'
    • User can select 'Short Put' option
    • onChange callback fires with selected strategy
    • Selected value is controlled component
    • Displays strategy labels correctly formatted
    File: `src/components/forms/__tests__/PositionPlanForm-strategy.test.tsx`
- [x] T014 [US1] (IMPL) Add strategy selector dropdown to `src/pages/PositionCreate.tsx`

#### Strike Price Input Component

- [x] T015 [US1] (TEST) Write comprehensive test suite for StrikePriceInput component covering:
    • Component renders with label "Strike Price"
    • Input type is "number" with step="0.01"
    • Displays $ prefix before input field
    • Accepts positive strike prices (e.g., 100, 105.50, 250)
    • Shows validation error for strike <= 0 if error prop provided
    • Shows validation error for missing value if required and empty
    • Value changes trigger onChange callback
    • Displays current value correctly formatted
    File: `src/components/forms/strategy/__tests__/StrikePriceInput.test.tsx`
- [x] T016 [US1] (IMPL) Create StrikePriceInput component in `src/components/forms/strategy/StrikePriceInput.tsx`

#### Expiration Date Picker Component

- [x] T017 [US1] (TEST) Write comprehensive test suite for ExpirationDatePicker component covering:
    • Component renders with label "Expiration Date"
    • Input type is "date"
    • min attribute set to current date (prevents past dates)
    • Accepts valid future dates
    • Shows validation error for past dates if error prop provided
    • Shows validation error for empty value if required
    • Value changes trigger onChange callback
    • Date value formatted correctly (YYYY-MM-DD)
    File: `src/components/forms/strategy/__tests__/ExpirationDatePicker.test.tsx`
- [ ] T018 [US1] (IMPL) Create ExpirationDatePicker component in `src/components/forms/strategy/ExpirationDatePicker.tsx`

#### Price Basis Selector Component

- [ ] T019 [US1] (TEST) Write comprehensive test suite for PriceBasisSelector component covering:
    • Component renders with label "Price Target Basis" / "Stop Loss Basis"
    • Dropdown/radio shows options: 'stock_price', 'option_price'
    • Default selection exists
    • User can select either option
    • onChange callback fires with selected basis
    • Displays labels: "Stock Price" and "Option Premium"
    • Selected value is controlled component
    File: `src/components/forms/strategy/__tests__/PriceBasisSelector.test.tsx`
- [ ] T020 [US1] (IMPL) Create PriceBasisSelector component in `src/components/forms/strategy/PriceBasisSelector.tsx`

#### Option Fields Section

- [ ] T021 [US1] (TEST) Write comprehensive test suite for option fields conditional rendering covering:
    • Option fields hidden when strategy_type='Long Stock'
    • Option fields visible when strategy_type='Short Put'
    • StrikePriceInput renders when Short Put selected
    • ExpirationDatePicker renders when Short Put selected
    • PriceBasisSelector (profit and stop) renders when Short Put selected
    • Premium per contract field renders when Short Put selected
    • All option fields have correct labels and placeholders
    • Fields are properly associated with form state
    File: `src/components/forms/__tests__/PositionPlanForm-option-fields.test.tsx`
- [ ] T022 [US1] (IMPL) Add option fields section to PositionPlanForm with conditional rendering

#### Option Price Basis Conversion (NEW - Value Delivery Audit Fix)

- [ ] T022b [US1] (TEST) Write comprehensive test suite for option price basis conversion covering:
    • profit_target_basis='option_price' converts to dollar value using strike_price - premium
    • stop_loss_basis='option_price' converts to dollar value using strike_price - premium
    • stock_price basis uses raw dollar values (no conversion needed)
    • Example: Strike $100, Premium $3, Basis='option_price', Target=20% → profit_target = ($100 - $3) × 0.20 = $19.40
    • Example: Strike $95, Premium $2.50, Basis='stock_price', Target=$105 → profit_target = $105 (no conversion)
    • Conversion helper function calculates effective dollar value for display
    File: `src/domain/calculators/__tests__/OptionPriceBasisCalculator.test.ts`
- [ ] T022c [US1] (IMPL) Implement option price basis conversion helper
    • Create calculateOptionBasisDollarValue() in domain calculator
    • Used by PositionCard to display profit_target and stop_loss for option positions
    File: `src/domain/calculators/OptionPriceBasisCalculator.ts`

#### Option Position Display (MOVED FROM US7 - Value Delivery Audit Fix)

- [ ] T023 [US1] (TEST) Write comprehensive test suite for OptionPositionCard covering:
    • Card displays underlying symbol
    • Card displays strategy type badge "Short Put"
    • Card displays strike price with $ formatting
    • Card displays expiration date in readable format (e.g., "Jan 17, 2025")
    • Card displays premium received per contract
    • Card displays number of contracts
    • Card shows current status (planned/open/closed)
    File: `src/components/positions/__tests__/OptionPositionCard.test.tsx`
- [ ] T024 [US1] (IMPL) Create or extend PositionCard component with Short Put option display
    • Shows strike price, expiration, premium when strategy_type='Short Put'
    • Can be conditional rendering in existing PositionCard or separate OptionPositionCard

#### Field Validation

- [ ] T025 [US1] (TEST) Write comprehensive test suite for inline validation covering:
    • Strike price validation error displays inline when value <= 0
    • Strike price validation error clears when value corrected to > 0
    • Expiration date validation error displays inline when date is in past
    • Expiration date validation error clears when corrected to future date
    • Optional fields (premium, targets) show error when <= 0 if provided
    • Errors appear within 200ms of input (real-time validation)
    • First invalid field is focused on form submit
    • Form submit blocked while validation errors exist
    • All validation errors display simultaneously for multiple invalid fields
    File: `src/components/forms/__tests__/PositionPlanForm-validation.test.tsx`
- [ ] T026 [US1] (IMPL) Add option field validation and inline error display to PositionPlanForm

#### Integration Tests (Complete User Journeys)

- [ ] T027 [US1] (TEST) Write comprehensive integration test suite for creating Short Put position covering:
    • Navigate to position creation, select Short Put strategy
    • Fill in all required option fields (strike, expiration, premium, targets)
    • Select price basis options (stock_price or option_price)
    • Submit form and verify position created with correct strategy_type
    • Verify position has status='planned'
    • Verify position has zero trades
    • Verify position shows in position list with option details (T024 verified)
    • Verify option fields saved correctly (strike, expiration, etc.)
    File: `src/integration/__tests__/us1-create-short-put-plan.test.tsx`
- [ ] T028 [US1] (IMPL) Implement position creation flow to make all integration tests pass

- [ ] T029 [US1] (TEST) Write comprehensive integration test suite for journal requirement covering:
    • Attempt to submit position plan without journal entry
    • Verify submission is blocked
    • Verify prompt for journal entry appears
    • Complete journal entry with required prompts
    • Submit position plan after journal entry
    • Verify position created with journal_entry_ids populated
    • Verify journal entry linked via position_id
    File: `src/integration/__tests__/us1-journal-required.test.tsx`
- [ ] T030 [US1] (IMPL) Enforce journal entry requirement in position creation flow

---

## User Story 2 - Execute Sell-to-Open Trade (P1) - 27 tasks

**Goal**: Trader can execute a sell-to-open trade against a Short Put position plan

**Independent Test**: Add STO trade to planned Short Put position and verify status changes to "open"

**Foundational for this story**: Option utilities, FIFO cost basis, trade validation, trade service extension

### Option Utilities Module (needed for OCC symbol derivation)

- [ ] T031 [P][US2] (TEST) Write comprehensive test suite for deriveOCCSymbol() covering:
    • Correct OCC format for standard case: AAPL $105 Put expiring 2025-01-17 → "AAPL  250117P00105000"
    • Symbol padding: <6 chars padded with spaces (T → "T     ")
    • Symbol padding: =6 chars unchanged (AAPL → "AAPL  ")
    • Date formatting: Year to 2 digits, month to 2 digits, day to 2 digits
    • Strike price multiplication: price × 1000 (105 → "00105000")
    • Strike padding: 8 digits with leading zeros (1 → "00001000")
    • Call type code: 'call' → 'C'
    • Put type code: 'put' → 'P'
    • Edge case: 1-character symbol
    • Edge case: Large strike prices (e.g., 5000 → "5000000000" truncated/handled)
    • Edge case: Far future dates (year 2100+)
    File: `src/domain/lib/__tests__/optionUtils.test.ts`
- [ ] T032 [P][US2] (IMPL) Implement deriveOCCSymbol() in `src/domain/lib/optionUtils.ts`

- [ ] T033 [P][US2] (TEST) Write comprehensive test suite for parseOCCSymbol() covering:
    • Correct parsing of standard OCC symbol back to components
    • Handles padded symbols correctly (strips trailing spaces)
    • Parses YYMMDD to valid Date object
    • Parses 8-digit strike back to decimal price (divide by 1000)
    • Maps 'C' → 'call', 'P' → 'put'
    • Round-trip: parseOCCSymbol(deriveOCCSymbol(x)) === x for valid inputs
    • Error handling: Invalid OCC format throws descriptive error
    • Error handling: Invalid date throws error
    • Error handling: Invalid type code throws error
    File: `src/domain/lib/__tests__/optionUtils.test.ts`
- [ ] T034 [P][US2] (IMPL) Implement parseOCCSymbol() in `src/domain/lib/optionUtils.ts`

### FIFO Cost Basis Extensions (needed for realized P&L)

- [ ] T035 [US2] (TEST) Write comprehensive test suite for groupTradesByInstrument() covering:
    • Stock trades group by underlying symbol (AAPL)
    • Option trades group by occ_symbol (AAPL  250117P00105000)
    • Mixed position correctly separates stock and option trades
    • Multiple option contracts with different strikes group separately
    • Multiple option contracts with same OCC symbol group together
    • Empty trades array returns empty Map
    • Trade order is preserved within groups
    File: `src/domain/calculators/__tests__/CostBasisCalculator-option.test.ts`
- [ ] T036 [US2] (IMPL) Implement groupTradesByInstrument() in `src/domain/calculators/CostBasisCalculator.ts`

- [ ] T037 [US2] (TEST) Write comprehensive test suite for calculateInstrumentFIFO() covering:
    • Simple case: Buy 100 @50, Sell 100 @60 → realized P&L = 1000
    • Multiple buys: Buy 50 @50, Buy 50 @55, Sell 75 @60 → matches oldest first
    • Partial sell: Buy 100 @50, Sell 30 @60 → remaining 70, P&L = 300
    • Multiple sells: Buy 100 @50, Sell 30 @60, Sell 40 @55 → FIFO ordering
    • Oversell prevention: Sell quantity > buy quantity throws error
    • Zero quantity trades handled correctly
    • Timestamp ordering: trades sorted oldest first
    File: `src/domain/calculators/__tests__/CostBasisCalculator-option.test.ts`
- [ ] T038 [US2] (IMPL) Implement calculateInstrumentFIFO() in `src/domain/calculators/CostBasisCalculator.ts`

### Trade Validator

- [ ] T039 [US2] (TEST) Write comprehensive test suite for validateOptionTrade() covering:
    • Valid STO trade: All option fields match position → passes
    • Strike mismatch: Trade strike 105 ≠ Position strike 100 → throws ValidationError
    • Expiration mismatch: Trade date ≠ Position date → throws ValidationError
    • Type mismatch: Trade 'call' ≠ Position 'put' → throws ValidationError
    • Stock trade (no option fields) → passes validation
    File: `src/domain/validators/__tests__/OptionValidators.test.ts`
- [ ] T040 [US2] (IMPL) Implement validateOptionTrade() in `src/domain/validators/TradeValidator.ts`

### Trade Service Extension

- [ ] T041 [US2] (TEST) Write comprehensive test suite for addOptionTrade() covering:
    • Creates trade with action='STO', occ_symbol, other option fields
    • Stores underlying_price_at_trade if provided
    • Returns updated position with new trade
    • Calls validateOptionTrade() before adding
    • Trade saves to IndexedDB within position
    File: `src/services/__tests__/TradeService-options.test.ts`
- [ ] T042 [US2] (IMPL) Implement addOptionTrade() in `src/services/TradeService.ts`

### Option Action Selector

- [ ] T043 [US2] (TEST) Write comprehensive test suite for action selector covering:
    • Action selector renders for option positions
    • Options include: 'STO', 'BTC', 'BTO', 'STC'
    • Default selection exists or is empty
    • User can select each option
    • onChange callback fires with selected action
    • Displays readable labels for each action code
    • Action selector hidden or disabled for stock-only positions
    File: `src/components/forms/__tests__/AddTradeForm-actions.test.tsx`
- [ ] T044 [US2] (IMPL) Add action selector to AddTradeForm

### Premium Label

- [ ] T045 [US2] (TEST) Write comprehensive test suite for premium label covering:
    • Price field labeled "Price per share" for stock trades
    • Price field labeled "Premium per contract" for option trades
    • Label updates dynamically when action changes
    • Label shows $ formatting prefix
    File: `src/components/forms/__tests__/AddTradeForm-premium-label.test.tsx`
- [ ] T046 [US2] (IMPL) Add conditional label to AddTradeForm

### Field Auto-Population

- [ ] T047 [US2] (TEST) Write comprehensive test suite for field auto-population covering:
    • Strike price field auto-fills from position plan
    • Expiration date field auto-fills from position plan
    • Option type field auto-fills from position plan
    • Fields are read-only or pre-populated (user can verify but not modify)
    • Auto-population happens when position is selected
    • Stock positions don't show option fields
    File: `src/components/forms/__tests__/AddTradeForm-autopopulate.test.tsx`
- [ ] T048 [US2] (IMPL) Add auto-population logic to AddTradeForm

### OCC Symbol Derivation

- [ ] T049 [US2] (TEST) Write comprehensive test suite for OCC symbol derivation covering:
    • OCC symbol auto-generated from position strike, expiration, type
    • OCC symbol displayed for user verification (read-only)
    • OCC symbol format is correct (21 characters)
    • OCC symbol includes correct padding and formatting
    • OCC symbol stored with trade when submitted
    File: `src/components/forms/__tests__/AddTradeForm-occ-symbol.test.tsx`
- [ ] T050 [US2] (IMPL) Add OCC symbol derivation to AddTradeForm

### Trade Validation

- [ ] T051 [US2] (TEST) Write comprehensive test suite for trade validation covering:
    • Strike price validation: User-modified strike rejected if differs from position
    • Expiration date validation: User-modified date rejected if differs from position
    • Validation error displays inline when contract details don't match
    • Form submission blocked while validation errors exist
    • User can reset to position values if they made mistake
    File: `src/components/forms/__tests__/AddTradeForm-validation.test.tsx`
- [ ] T052 [US2] (IMPL) Add option trade validation to AddTradeForm

### Integration Tests

- [ ] T053 [US2] (TEST) Write comprehensive integration test suite for STO execution covering:
    • Start with planned Short Put position
    • Open add trade flow, select STO action
    • Enter quantity and premium
    • Submit trade
    • Verify position status changes from 'planned' to 'open'
    • Verify trade added to position.trades array
    • Verify trade has action='STO'
    • Verify trade has correct occ_symbol
    • Verify position appears in open positions list
    File: `src/integration/__tests__/us2-position-opens.test.tsx`
- [ ] T054 [US2] (IMPL) Implement STO flow to make all integration tests pass

- [ ] T055 [US2] (TEST) Write comprehensive integration test suite for realized P&L after STO covering:
    • Create Short Put position with STO trade (sold at 3.00)
    • Verify realized P&L = 0 (no closing trade yet)
    • Verify position status is 'open'
    • Verify trade recorded correctly
    File: `src/integration/__tests__/us2-realized-pnl-after-sto.test.tsx`
- [ ] T056 [US2] (IMPL) Ensure realized P&L calculation displays correctly for open positions

### PositionDetail Trade Display (NEW - Value Delivery Audit Fix)

- [ ] T057 [US2] (IMPL) Update PositionDetail trade history to display option fields
    • Show action code badge (STO/BTC/BTO/STC) for option trades
    • Display OCC symbol for option trades
    • Display strike price and expiration for option trades
    • Format contracts quantity with ×100 multiplier note
    • Stock trades continue to display with buy/sell badges
    File: `src/pages/PositionDetail.tsx`

**NOTE**: Unrealized P&L with pricing is deferred to US6. MVP (US1-US3) works with realized P&L only.

---

## User Story 3 - Close Position via Buy-to-Close (P1) - 16 tasks

**Goal**: Trader can close Short Put position by buying to close

**Independent Test**: Add BTC trade and verify position closes with correct realized P&L

**Foundational for this story**: Realized P&L calculator, closing trade validation

### Realized P&L Calculator (FIFO-based, no pricing needed)

- [ ] T058 [P][US3] (TEST) Write comprehensive test suite for calculateShortPutRealizedPnL() covering:
    • Full close profit: Sold 3@3.00, closed 3@1.00 → (3-1)×3×100 = 600
    • Full close loss: Sold 2@2.00, closed 2@5.00 → (2-5)×2×100 = -600
    • Partial close: Sold 5@3.00, closed 2@1.00, 3 still open → (3-1)×2×100 = 400
    • Multiple closing trades: FIFO matches correctly
    • Partial positions: Realized P&L only for closed contracts
    • Assignment closed at 0: Sold at 2.00, assigned → 2×100×contracts profit
    File: `src/domain/calculators/__tests__/ShortPutPnLCalculator.test.ts`
- [ ] T059 [P][US3] (IMPL) Implement calculateShortPutRealizedPnL() in `src/domain/calculators/ShortPutPnLCalculator.ts`

### Closing Trade Validator

- [ ] T060 [US3] (TEST) Write comprehensive test suite for validateClosingTrade() covering:
    • Valid close: Closing quantity 5 ≤ open quantity 10 → passes
    • Oversell: Closing quantity 15 > open quantity 10 → throws ValidationError
    • Exact close: Closing quantity 10 = open quantity 10 → passes
    • Zero close: Closing quantity 0 → passes (no-op allowed)
    • Per-instrument validation: Checks OCC-specific quantity
    File: `src/domain/validators/__tests__/OptionValidators.test.ts`
- [ ] T061 [US3] (IMPL) Implement validateClosingTrade() in `src/domain/validators/TradeValidator.ts`

### Closing Trade Validation (UI)

- [ ] T062 [US3] (TEST) Write comprehensive test suite for closing quantity validation covering:
    • Closing quantity validated against open quantity per instrument
    • Shows error if closing quantity exceeds open quantity
    • Shows current open quantity in error message
    • Error clears when quantity corrected
    • Allows closing exact open quantity (full close)
    • Allows closing partial quantity (partial close)
    File: `src/components/forms/__tests__/AddTradeForm-closing-validation.test.tsx`
- [ ] T063 [US3] (IMPL) Add closing trade validation to AddTradeForm

### Integration Tests

- [ ] T064 [US3] (TEST) Write comprehensive integration test suite for full BTC close covering:
    • Start with open Short Put position (5 contracts sold at 3.00)
    • Add BTC trade for all 5 contracts at 1.50
    • Verify position status changes to 'closed'
    • Verify realized P&L = (3.00 - 1.50) × 5 × 100 = 750
    • Verify P&L displays as "Realized" not "Unrealized"
    • Verify position appears in closed positions list
    • Verify no open contracts remain
    File: `src/integration/__tests__/us3-close-via-btc.test.tsx`
- [ ] T065 [US3] (IMPL) Implement full close flow to make all integration tests pass

- [ ] T066 [US3] (TEST) Write comprehensive integration test suite for partial BTC close covering:
    • Start with open Short Put position (5 contracts sold at 3.00)
    • Add BTC trade for 2 contracts at 1.50
    • Verify position status remains 'open'
    • Verify realized P&L calculated for closed 2 contracts only
    • Verify 3 contracts remain open
    • Verify open quantity displays correctly
    • Add another BTC for remaining 3 contracts
    • Verify position now fully closed
    • Verify total realized P&L includes both BTC trades
    File: `src/integration/__tests__/us3-partial-close.test.tsx`
- [ ] T067 [US3] (IMPL) Implement partial close logic to make all integration tests pass

- [ ] T068 [US3] (TEST) Write comprehensive integration test suite for realized P&L covering:
    • Profit scenario: Sold at 3.00, closed at 1.00 → verify profit calculated correctly
    • Loss scenario: Sold at 2.00, closed at 5.00 → verify loss calculated correctly
    • Break-even: Sold at 2.50, closed at 2.50 → verify zero P&L
    • Multiple closes: FIFO matching verified across multiple BTC trades
    • P&L matches manual calculation: (sell_price - buy_price) × quantity × 100
    • P&L persists after close (doesn't change with price updates)
    File: `src/integration/__tests__/us3-realized-pnl.test.tsx`
- [ ] T069 [US3] (IMPL) Implement realized P&L calculation to make all integration tests pass

---

## User Story 4 - Record Expiration Worthless (P2) - 6 tasks

**Goal**: Trader can record that option expired worthless

**Independent Test**: Record "expired" outcome and verify full premium captured as profit

**Foundational for this story**: TradeService extension for expiration

### Trade Service Extension

- [ ] T070 [US4] (TEST) Write comprehensive test suite for recordExpirationWorthless() covering:
    • Creates BTC trade at price=0 for all open contracts
    • Position status changes to 'closed'
    • Full premium captured as realized profit
    • Validates date is on/after expiration
    • Rejects if before expiration date
    File: `src/services/__tests__/TradeService-options.test.ts`
- [ ] T071 [US4] (IMPL) Implement recordExpirationWorthless() in `src/services/TradeService.ts`

### Expiration Outcome

- [ ] T072 [US4] (TEST) Write comprehensive test suite for expiration outcome covering:
    • "Expired" outcome available in position close flow
    • Option appears only for option positions (not stock)
    • Option appears only on/after expiration date
    • Selecting "Expired" shows confirmation explaining outcome
    File: `src/components/forms/__tests__/PositionCloseFlow-expiration.test.tsx`
- [ ] T073 [US4] (IMPL) Add "Expired" option to close flow

### Expiration Validation

- [ ] T074 [US4] (TEST) Write comprehensive test suite for date validation covering:
    • Expiration blocked if today < position expiration_date
    • Error message explains must wait until expiration
    • User directed to use BTC for early closes
    • Expiration allowed if today >= position expiration_date
    • Expiration allowed on exact expiration date
    • Expiration allowed after expiration date
    File: `src/integration/__tests__/us4-expiration-validation.test.tsx`
- [ ] T075 [US4] (IMPL) Add date validation to make all tests pass

### Integration Test

- [ ] T076 [US4] (TEST) Write comprehensive integration test suite for expiration covering:
    • Start with open Short Put position (5 contracts sold at 2.00)
    • Wait until on/after expiration date
    • Select "Expired" outcome
    • Confirm expiration
    • Verify BTC trade created at price = 0.00
    • Verify BTC quantity = all open contracts
    • Verify position status = 'closed'
    • Verify realized P&L = premium_received × contracts × 100 (full profit)
    • Verify P&L displays as "Realized"
    File: `src/integration/__tests__/us4-expire-worthless.test.tsx`
- [ ] T077 [US4] (IMPL) Implement expiration flow to make all tests pass

---

## User Story 5 - Handle Short Put Assignment (P2) - 20 tasks

**Goal**: Trader can record option assignment and system creates stock position

**Independent Test**: Record assignment, complete stock position plan modal, verify linked stock position created

**Foundational for this story**: Assignment handlers, journal service extension, trade service extension

### Assignment Handlers Module

- [ ] T078 [P][US5] (TEST) Write comprehensive test suite for createAssignmentStockPosition() covering:
    • Creates Long Stock position with correct symbol
    • Quantity = contracts_assigned × 100 (5 contracts → 500 shares)
    • target_entry_price = strike_price from option
    • First trade is buy with quantity = shares_assigned
    • First trade price = strike_price
    • cost_basis_adjustment = -premium_received_per_share
    • journal_entry_ids is empty array (prompted separately)
    • status = 'open' (has buy trade)
    • Position thesis includes assignment reference
    File: `src/domain/lib/__tests__/assignmentHandler.test.ts`
- [ ] T079 [P][US5] (IMPL) Implement createAssignmentStockPosition() in `src/domain/lib/assignmentHandler.ts`

- [ ] T080 [P][US5] (TEST) Write comprehensive test suite for calculateAssignmentCostBasis() covering:
    • Standard case: strike 100, premium 3.00 → cost basis 97.00
    • High premium: strike 100, premium 10.00 → cost basis 90.00
    • Low premium: strike 100, premium 0.50 → cost basis 99.50
    • Zero premium (rare): strike 100, premium 0 → cost basis 100.00
    • ATM assignment: strike 95, premium 2.00 → cost basis 93.00
    • Decimal precision: strike 105.50, premium 3.25 → 102.25
    File: `src/domain/lib/__tests__/assignmentHandler.test.ts`
- [ ] T081 [P][US5] (IMPL) Implement calculateAssignmentCostBasis() in `src/domain/lib/assignmentHandler.ts`

### Journal Service Extension

- [ ] T082 [US5] (TEST) Write comprehensive test suite for createAssignmentJournalEntry() covering:
    • Creates journal entry with entry_type='option_assignment'
    • Includes all assignment prompts in fields array
    • Links to position via position_id
    • Required prompt (assignment_cause) is present
    • Optional prompts (feelings_about_stock, stock_plan) are present
    File: `src/services/__tests__/JournalService-options.test.ts`
- [ ] T083 [US5] (IMPL) Implement createAssignmentJournalEntry() in `src/services/JournalService.ts`

### Trade Service Extension

- [ ] T084 [US5] (TEST) Write comprehensive test suite for recordAssignment() covering:
    • Creates BTC trade at price=0 for assigned contracts
    • Creates new Long Stock position with correct cost basis
    • Links trades via created_stock_position_id
    • Stores cost_basis_adjustment on stock trade
    • Updates option position status (closed if full, open if partial)
    • Returns both updated option position and new stock position
    • Uses IndexedDB transaction for atomicity
    File: `src/services/__tests__/TradeService-options.test.ts`
- [ ] T085 [US5] (IMPL) Implement recordAssignment() in `src/services/TradeService.ts`

### Assignment Outcome

- [ ] T086 [US5] (TEST) Write comprehensive test suite for assignment outcome covering:
    • "Assigned" outcome available in position close flow
    • Option appears only for option positions
    • Option appears only on/after expiration date
    • Selecting "Assigned" opens assignment modal
    File: `src/components/forms/__tests__/PositionCloseFlow-assignment.test.tsx`
- [ ] T087 [US5] (IMPL) Add "Assigned" option to close flow

### Assignment Modal

- [ ] T088 [US5] (TEST) Write comprehensive test suite for assignment modal covering:
    • Modal displays premium received per contract (for reference, not editable)
    • Modal displays effective cost basis per share (strike - premium)
    • Modal explains 100 shares per contract multiplier
    • Modal shows resulting total shares and total cost basis
    • Modal confirms assignment before proceeding
    • User can cancel assignment from modal
    File: `src/components/modals/__tests__/AssignmentModal.test.tsx`
- [ ] T089 [US5] (IMPL) Create assignment modal with display

### Integration Tests

- [ ] T090 [US5] (TEST) Write comprehensive integration test suite for stock position creation covering:
    • Start with Short Put position (strike 100, sold at 3.00)
    • Record assignment of 5 contracts
    • Verify new Long Stock position created
    • Verify stock position symbol = option symbol
    • Verify stock position quantity = 500 (5 × 100)
    • Verify stock position target_entry_price = 100 (strike)
    • Verify first trade has cost_basis_adjustment = -3.00
    • Verify effective cost basis = 97.00 (100 - 3)
    • Verify stock position status = 'open'
    • Verify stock position linked via created_stock_position_id
    File: `src/integration/__tests__/us5-cost-basis.test.tsx`
- [ ] T091 [US5] (IMPL) Implement stock position creation to make all tests pass

- [ ] T092 [US5] (TEST) Write comprehensive integration test suite for partial assignment covering:
    • Start with Short Put position (10 contracts sold at 2.00)
    • Record assignment of 3 contracts only
    • Verify new Long Stock position created for 300 shares
    • Verify option position still open with 7 contracts
    • Verify option position status unchanged (still 'open')
    • Verify stock position cost basis calculated correctly
    • Record assignment of remaining 7 contracts
    • Verify second stock position created for remaining shares
    • Verify option position now closed (0 contracts)
    File: `src/integration/__tests__/us5-partial-assignment.test.tsx`
- [ ] T093 [US5] (IMPL) Implement partial assignment logic to make all tests pass

- [ ] T094 [US5] (TEST) Write comprehensive integration test suite for assignment journal covering:
    • After assignment, user prompted for journal entry
    • Journal entry type is 'option_assignment'
    • Assignment-specific prompts displayed:
      - "What happened that led to assignment?" (required)
      - "How do you feel about now owning this stock?" (optional)
      - "What's your plan for the stock position?" (optional)
    • Journal entry linked to both option position and new stock position
    • Position creation completes after journal entry
    File: `src/integration/__tests__/us5-assignment-journal.test.tsx`
- [ ] T095 [US5] (IMPL) Add assignment journal prompts to make all tests pass

---

## User Story 6 - Update Prices for Stock and Option (P2) - 20 tasks

**Goal**: Trader can update prices for both stock and option instruments

**Independent Test**: Enter stock and option prices, verify intrinsic/extrinsic values calculated

**Foundational for this story**: Option value calculators, price service extensions, unrealized P&L calculator

### Option Value Calculators Module (needed for intrinsic/extrinsic display)

- [ ] T096 [P][US6] (TEST) Write comprehensive test suite for calculatePutIntrinsicValue() covering:
    • ITM put returns positive value: strike 100, stock 95 → 5
    • OTM put returns 0: strike 100, stock 105 → 0
    • ATM put returns 0: strike 100, stock 100 → 0
    • Deep ITM: strike 200, stock 50 → 150
    • Returns exactly 0 (not negative) for extreme OTM
    • Handles decimal strikes and prices: strike 100.50, stock 95.25 → 5.25
    File: `src/domain/calculators/__tests__/OptionValueCalculator.test.ts`
- [ ] T097 [P][US6] (IMPL) Implement calculatePutIntrinsicValue() in `src/domain/calculators/OptionValueCalculator.ts`

- [ ] T098 [P][US6] (TEST) Write comprehensive test suite for calculateExtrinsicValue() covering:
    • Normal case: option 6.00, intrinsic 5.00 → extrinsic 1.00
    • All extrinsic: option 3.00, intrinsic 0 → extrinsic 3.00
    • All intrinsic: option 10.00, intrinsic 10.00 → extrinsic 0.00
    • Negative extrinsic allowed (deep ITM early expiry): option 8.00, intrinsic 10.00 → -2.00
    • Zero option price: option 0, intrinsic 5 → -5 (worthless but ITM)
    File: `src/domain/calculators/__tests__/OptionValueCalculator.test.ts`
- [ ] T099 [P][US6] (IMPL) Implement calculateExtrinsicValue() in `src/domain/calculators/OptionValueCalculator.ts`

### Unrealized P&L Calculator (requires current pricing)

- [ ] T100 [P][US6] (TEST) Write comprehensive test suite for calculateShortPutUnrealizedPnL() covering:
    • Profit case: Sold at 3.00, current 1.50, 5 contracts → (3-1.5)×5×100 = 750 profit
    • Loss case: Sold at 2.00, current 4.00, 3 contracts → (2-4)×3×100 = -600 loss
    • Break-even: Sold at 2.00, current 2.00 → 0 P&L
    • Single contract: Multiplier of 100 applies correctly
    • Large contract quantities: 10 contracts calculated correctly
    • Decimal premiums: 2.50, 1.75 calculated correctly
    File: `src/domain/calculators/__tests__/ShortPutPnLCalculator.test.ts`
- [ ] T101 [P][US6] (IMPL) Implement calculateShortPutUnrealizedPnL() in `src/domain/calculators/ShortPutPnLCalculator.ts`

### Price Service Extensions

- [ ] T102 [US6] (TEST) Write comprehensive test suite for upsertMultiplePrices() covering:
    • Creates multiple price entries in single transaction
    • Reuses existing price if same instrument and date and price
    • Updates existing price if same instrument and date but different price
    • Returns array of created/updated PriceHistory objects
    • Handles both stock symbols and OCC symbols
    File: `src/services/__tests__/PriceService-options.test.ts`
- [ ] T103 [US6] (IMPL) Implement upsertMultiplePrices() in `src/services/PriceService.ts`

- [ ] T104 [US6] (TEST) Write comprehensive test suite for getPricesForPosition() covering:
    • Short Put position returns both stockPrice and optionPrice when available
    • Returns isStale=true when either price is missing
    • Returns missingPrices array indicating which prices are unavailable
    • Long Stock position returns only stockPrice (optionPrice undefined)
    • Handles planned positions (no prices yet) gracefully
    File: `src/services/__tests__/PriceService-options.test.ts`
- [ ] T105 [US6] (IMPL) Implement getPricesForPosition() in `src/services/PriceService.ts`

- [ ] T106 [US6] (TEST) Write comprehensive test suite for getPositionsRequiringPrices() covering:
    • Open Short Put position returns needsStockPrice=true, needsOptionPrice=true
    • Open Long Stock position returns needsStockPrice=true, needsOptionPrice=false
    • Closed positions not included in results
    • Includes occSymbol for option positions
    • Returns array of position requirement objects
    File: `src/services/__tests__/PositionService-options.test.ts`
- [ ] T107 [US6] (IMPL) Implement getPositionsRequiringPrices() in `src/services/PositionService.ts`

### Multi-Instrument Price Entry

- [ ] T108 [US6] (TEST) Write comprehensive test suite for multi-instrument price entry covering:
    • Price update flow detects option positions need dual prices
    • Prompts for both stock price and option price
    • Shows which prices are for stock vs option
    • Shows current/existing prices if already entered
    • Allows updating just one price (stock or option) if other exists
    • Long Stock positions only prompt for stock price
    File: `src/components/forms/__tests__/PriceUpdateFlow-multiple.test.tsx`
- [ ] T109 [US6] (IMPL) Extend price update flow for multiple instruments

### Value Display

- [ ] T110 [US6] (TEST) Write comprehensive test suite for intrinsic/extrinsic display covering:
    • Position detail shows intrinsic value when both prices available
    • Intrinsic value calculated as max(0, strike - stock) for puts
    • Position detail shows extrinsic value when both prices available
    • Extrinsic value calculated as option_price - intrinsic_value
    • Values display per contract AND total (× contracts × 100)
    • Values update when prices change
    • Negative extrinsic displays correctly (deep ITM)
    File: `src/pages/__tests__/PositionDetail-values.test.tsx`
- [ ] T111 [US6] (IMPL) Add intrinsic/extrinsic display to position detail

### Staleness Warning

- [ ] T112 [US6] (TEST) Write comprehensive test suite for staleness warning covering:
    • Position shows staleness warning when option price missing
    • Position shows staleness warning when stock price missing
    • No staleness warning when both prices present
    • Warning message indicates which prices are needed
    • Long Stock positions don't show option staleness
    File: `src/components/__tests__/PositionCard-staleness.test.tsx`
- [ ] T113 [US6] (IMPL) Add staleness indicator to make all tests pass

### Integration Tests

- [ ] T114 [US6] (TEST) Write comprehensive integration test suite for price update covering:
    • Create open Short Put position
    • Enter stock price 150, option price 2.50
    • Verify prices saved to PriceHistory with correct instrument IDs
    • Verify another position with same underlying auto-uses stock price
    • Verify position's P&L updates with new prices
    • Verify intrinsic value calculated correctly
    • Verify extrinsic value calculated correctly
    File: `src/integration/__tests__/us6-price-update.test.tsx`
- [ ] T115 [US6] (IMPL) Implement price update flow to make all tests pass

- [ ] T116 [US6] (TEST) Write comprehensive integration test suite for unrealized P&L covering:
    • Create Short Put position with STO trade (sold at 3.00)
    • Update option price to 1.50
    • Verify unrealized P&L calculated as (3.00 - 1.50) × contracts × 100
    • Verify P&L displays as profit (positive)
    • Update option price to 5.00
    • Verify unrealized P&L calculated as (3.00 - 5.00) × contracts × 100
    • Verify P&L displays as loss (negative)
    • Verify P&L updates in real-time as prices change
    File: `src/integration/__tests__/us6-unrealized-pnl.test.tsx`
- [ ] T117 [US6] (IMPL) Implement P&L calculation to make all integration tests pass

- [ ] T118 [US6] (TEST) Write comprehensive integration test suite for price change confirmation covering:
    • Enter price 20% higher than previous close
    • Verify confirmation dialog appears
    • Confirmation shows old vs new price
    • User can accept or reject price change
    • Accept saves new price
    • Reject keeps old price
    • No confirmation if price change < 20%
    File: `src/integration/__tests__/us6-price-change-confirmation.test.tsx`
- [ ] T119 [US6] (IMPL) Add price change confirmation to make all tests pass

---

## User Story 7 - View Positions on Dashboard (P3) - 6 tasks

**Goal**: Dashboard displays Short Put positions with option details

**Independent Test**: Create Short Put position and verify it displays correctly on dashboard

**NOTE**: T117-T118 remain in US6 for unrealized P&L calculation. OptionPositionCard covered by T023-T024 in US1.

### Strategy Badge

- [ ] T119 [US7] (TEST) Write comprehensive test suite for strategy badge covering:
    • Long Stock positions show "Long Stock" badge (or no badge)
    • Short Put positions show "Short Put" badge
    • Badge has distinct styling/color for visibility
    • Badge appears consistently across position cards
    File: `src/components/positions/__tests__/PositionCard-badge.test.tsx`
- [ ] T120 [US7] (IMPL) Add strategy type badge to position cards

### Intrinsic/Extrinsic Summary

- [ ] T121 [US7] (TEST) Write comprehensive test suite for value summary covering:
    • When both stock and option prices available: shows intrinsic value
    • When both prices available: shows extrinsic value
    • Values shown as total (not per contract)
    • Intrinsic value calculated correctly
    • Extrinsic value calculated correctly
    • When prices missing: shows "Price data required" message
    • Negative extrinsic displays with appropriate styling
    File: `src/components/positions/__tests__/OptionPositionCard-values.test.tsx`
- [ ] T122 [US7] (IMPL) Add value summary to OptionPositionCard

### Dashboard Integration

- [ ] T123 [US7] (TEST) Write comprehensive integration test suite for dashboard covering:
    • Create Short Put position
    • Verify position appears on dashboard
    • Verify OptionPositionCard used (not default PositionCard)
    • Verify all option details visible on dashboard card (strike, expiration, premium)
    • Verify PositionCard receives strike_price, expiration_date, premium_per_contract props
    • Verify profit_target and stop_loss display correctly for option_price basis
    • Verify Long Stock positions still use regular PositionCard
    • Verify multiple Short Put positions all display correctly
    • Verify positions sort correctly (status, attention, etc.)
    File: `src/pages/__tests__/Dashboard-options.test.tsx`
- [ ] T124 [US7] (IMPL) Update Dashboard to conditionally use OptionPositionCard
    • Route to OptionPositionCard (from T024) when strategy_type='Short Put'
    • Route to PositionCard for Long Stock positions
    • Pass option-specific props (strike, expiration, premium) to OptionPositionCard

---

## Polish & Cross-Cutting Concerns - 14 tasks

**Goal**: Complete feature with edge cases, performance, and documentation

### Edge Cases (TDD)

- [ ] T125 (TEST) Write comprehensive test suite for negative extrinsic covering:
    • Deep ITM option with low time value: strike 150, stock 50, option 100
    • Intrinsic = 100, extrinsic = 0 (not negative for this case)
    • Extreme case: option price < intrinsic value (rare but possible)
    • Negative extrinsic displays with warning styling (red/orange)
    • Display shows "Time Value: -$X.XX" for negative
    • User understands negative extrinsic is unusual
    File: `src/components/positions/__tests__/OptionPositionCard-negative-extrinsic.test.tsx`
- [ ] T126 (IMPL) Handle negative extrinsic values to make all tests pass

- [ ] T127 (TEST) Write comprehensive test suite for worthless options covering:
    • Option price = 0 displays correctly
    • P&L calculations handle zero price correctly
    • Unrealized P&L = premium_received - 0 = full profit
    • Realized P&L for BTC at 0 works correctly
    File: `src/components/positions/__tests__/OptionPositionCard-worthless.test.tsx`
- [ ] T128 (IMPL) Handle worthless options to make all tests pass

- [ ] T129 (TEST) Write comprehensive test suite for contract validation covering:
    • User tries to close with wrong strike → validation error
    • User tries to close with wrong expiration → validation error
    • User tries to close with wrong type (call vs put) → validation error
    • Error message explains which field doesn't match
    File: `src/components/forms/__tests__/AddTradeForm-contract-validation.test.tsx`
- [ ] T130 (IMPL) Add contract validation to make all tests pass

### Performance Tests

- [ ] T131 (TEST) Write performance test suite for position calculations covering:
    • Position with 100 trades calculates status in <100ms
    • Position with 100 trades calculates P&L in <100ms
    • Position with 100 trades calculates metrics in <100ms
    • Multiple positions calculated in sequence without blocking UI
    File: `src/domain/calculators/__tests__/Performance.test.ts`
- [ ] T132 (IMPL) Optimize calculation if needed to meet <100ms target

- [ ] T133 (TEST) Write performance test suite for price updates covering:
    • Upsert 10 prices completes in <200ms
    • Get prices for position completes in <50ms
    • Price update doesn't block UI thread
    File: `src/services/__tests__/PriceService-performance.test.ts`
- [ ] T134 (IMPL) Optimize price service if needed to meet <200ms target

### Regression Testing

- [ ] T135 (TEST) Run full existing Long Stock test suite and verify:
    • All existing tests pass without modification
    • No regressions in position creation for Long Stock
    • No regressions in trade execution for Long Stock
    • No regressions in P&L calculation for Long Stock
    • No regressions in position closing for Long Stock
    • No regressions in journal functionality

- [ ] T136 (TEST) Write backward compatibility test suite covering:
    • Existing Long Stock positions load correctly after code changes
    • Existing positions without strategy_type default to 'Long Stock'
    • Existing positions without new optional fields work correctly
    • Database migration preserves all existing position data
    • Existing trades load correctly without option fields
    File: `src/integration/__tests__/backward-compatibility.test.tsx`

- [ ] T137 (TEST) Write comprehensive migration test suite covering:
    • Database upgrades from v3 to v4 successfully
    • All existing positions get strategy_type='Long Stock'
    • All existing journal entries still accessible
    • All existing price history still accessible
    • Migration is idempotent (can run twice safely)
    • Migration doesn't lose any data
    File: `src/services/__tests__/SchemaManager-migration-v3v4.test.ts`

### Documentation

- [ ] T138 Update CLAUDE.md with option strategy terminology and new patterns
- [ ] T139 Update design decisions document with option rationale
- [ ] T140 Create migration guide for existing Long Stock positions

---

## Dependencies

### User Story Completion Order

```
┌─────────────┬─────────────┬─────────────┐
│   US1 (P1)  │   US2 (P1)  │   US3 (P1)  │  ← Core lifecycle
│  Setup +    │  Execute    │   Close     │
│  Create     │  STO        │   (BTC)     │
│  T001-T030  │  T031-T057  │  T060-T071  │
└─────────────┴─────────────┴─────────────┘
    ↓              ↓              ↓
┌─────────────┬─────────────┬─────────────┐
│   US4 (P2)  │   US5 (P2)  │   US6 (P2)  │  ← Exit handling + Pricing
│  Expire     │  Assign     │  Pricing    │
│  T072-T079  │  T080-T097  │  T098-T121  │
└─────────────┴─────────────┴─────────────┘
    ↓
┌─────────────────────────────────────────┐
│          US7 (P3) - Dashboard          │  ← UI polish
│          T122-T124                      │
└─────────────────────────────────────────┘
```

**Critical Path** (for MVP - US1/US2/US3 only):
US1 (T001-T030) → US2 (T031-T057) → US3 (T060-T071) → Polish (T125-T142)

**Note**: US1 Phase 1A (Setup, T001-T008) must complete before US1 Phase 1B (T009-T030) can begin

**Value Delivery Audit Changes**:
- T022b-T022c (Option price basis conversion) added to US1 - fixes profit_target/stop_loss display for options
- T023-T024 (OptionPositionCard) moved from US7 to US1 for immediate position verification
- T059 (PositionDetail trade display) added to US2 for option trade visibility
- T117-T118 remain in US6 (unrealized P&L) - removed duplicate from US7
- T002 must complete before T004 (database migration before type extensions)

**Parallel Opportunities** (by TEST/IMPL pairs):
- US2: T031-T034 (Option utils): 2 parallel pairs
- US2: T035-T038 (FIFO): 2 parallel pairs
- US3: T058-T059 (Realized P&L): 1 parallel pair
- US5: T078-T081 (Assignment handlers): 2 parallel pairs
- US6: T096-T101 (Value calculators): 3 parallel pairs

---

## MVP Scope

**Recommended MVP** (Minimum Viable Product): User Stories 1-3 (P1 only)

**MVP Tasks**: T001-T073 (73 tasks total)
- US1: Setup + Create Short Put Plan (30 tasks) - includes database migration, type extensions, and all US1 tasks
- US2: Execute STO Trade (27 tasks)
- US3: Close via BTC (12 tasks)

This provides complete core trading workflow:
1. **Create** Short Put position plan with option fields (including position card display and price basis conversion)
2. **Execute** sell-to-open trade (OCC symbol derivation, trade validation, PositionDetail trade display)
3. **Close** via buy-to-close with realized P&L calculation (FIFO-based)

**MVP excludes** (deferred to US4-US6):
- Expiration worthless handling
- Assignment handling
- Market pricing and unrealized P&L
- Intrinsic/extrinsic value display

**MVP Test Count**: 37 comprehensive test suites + 36 implementations = 73 TDD cycles

**Value Delivery Audit Improvements** (Dec 2025):
- Option price basis conversion (T022b-T022c) added to US1 for correct profit_target/stop_loss display
- OptionPositionCard (T023-T024) in US1 allows immediate position verification after creation
- PositionDetail option trade display (T059) in US2 shows option trade details after STO
- Database migration (T002) must complete before type extensions (T004)

---

## Test Coverage Summary

### Test Count by Phase

| Phase | Test Suites | Impl Tasks | Total |
|-------|-------------|------------|-------|
| US1: Setup + Create Plan | 15 | 15 | 30 |
| US2: Execute STO | 14 | 13 | 27 |
| US3: Close BTC | 6 | 6 | 12 |
| US4: Expire | 4 | 4 | 8 |
| US5: Assign | 10 | 10 | 20 |
| US6: Pricing | 12 | 12 | 24 |
| US7: Dashboard | 3 | 3 | 6 |
| Polish | 7 | 7 | 14 |
| **TOTAL** | **71** | **70** | **141** |

### Coverage by Category

| Category | Test Suites | Coverage |
|----------|-------------|----------|
| Type Definitions | 3 | Position, Trade, Journal types compile and work correctly |
| Domain Logic | 13 | OCC utils, values, FIFO, assignment, P&L calculations, price basis conversion (split by when needed) |
| Validation | 3 | Position, trade, closing trade validation |
| Services | 10 | Position, Trade, Price, Journal service operations |
| UI Components | 31 | Form inputs, validation, display components (including option-specific) |
| Integration/E2E | 9 | Complete user journeys, edge cases, performance |

---

## TDD Best Practices

### Test Suite First Guidelines

1. **Write comprehensive tests** - Cover happy path, edge cases, errors, boundaries
2. **Test names are documentation** - Test suite should read like requirements
3. **All tests fail initially** - Verify entire suite fails before implementation
4. **Implement until all pass** - Don't move on until 100% of tests pass
5. **Then refactor** - Clean up code with green test safety net

### Per-Test-Task Guidelines

When implementing a (TEST) task:
- Write 5-15 individual test cases covering all scenarios
- Use descriptive test names: "returns X when Y"
- Group related tests in describe blocks
- Include edge cases you can think of
- Include error conditions if applicable
- Document boundary values

When implementing a (IMPL) task:
- Run the test suite to see all failures
- Implement code for first failing test
- Re-run until that test passes
- Move to next failing test
- Continue until ALL tests in suite pass
- Only then is the task complete

---

## Validation Summary

### TDD Compliance

✅ Every feature follows TEST → IMPL order
✅ Each (TEST) task writes comprehensive test suite (5-15 test cases)
✅ Each (IMPL) task must pass ALL tests in its suite
✅ Test tasks specify all scenarios to be covered
✅ Type extensions have tests (T003, T005, T007)
✅ Implementation tasks reference the test suite they satisfy
✅ **Realized P&L (FIFO-based) implemented in US3 - before pricing**
✅ **Unrealized P&L (market-based) deferred to US6 - with pricing**
✅ **Option price basis conversion (T022b-T022c) added to US1** (value delivery audit fix)
✅ **Task ID collision resolved: T117-T118 remain in US6, removed from US7** (value delivery audit fix)

### Just-in-Time Delivery Compliance

✅ Foundational work deferred to user story where actually needed
✅ MVP (US1-US3) delivers value with 73 tasks (vs 88 in original plan)
✅ Option utilities (T033-T036) moved to US2 (needed for STO execution)
✅ FIFO extensions (T037-T040) moved to US2 (needed for realized P&L)
✅ Realized P&L calculator (T062-T063) in US3 (needed for closing)
✅ Unrealized P&L calculator (T108-T109) deferred to US6 (needs pricing)
✅ Assignment handlers (T082-T085) moved to US5 (needed for assignment)
✅ Option value calculators (T100-T105) deferred to US6 (needed for pricing display)
✅ Option price basis conversion (T022b-T022c) in US1 (needed for profit_target/stop_loss display)
✅ OptionPositionCard (T025-T026) in US1 for immediate visibility (value delivery audit)
✅ PositionDetail trade display (T059) added to US2 for verification (value delivery audit)
✅ Database migration (T002) must complete before type extensions (T004) (value delivery audit)
✅ Validators moved to user story where first needed
✅ Service extensions moved to user story where first needed

### Format Validation

✅ All tasks follow checklist format: `- [ ] T### [P?] [US#] (TEST/IMPL) Description`
✅ All tasks include file paths
✅ Setup/Foundation tasks have no story label
✅ User Story tasks have story labels
✅ Parallelizable tasks marked with [P]

### Coverage Quality

✅ Each (TEST) task explicitly lists all test cases to be written (5-15 test cases per suite)
✅ Test cases include: happy path, edge cases, errors, boundaries
✅ Type definitions tested for browser compatibility
✅ Integration tests cover complete user journeys
✅ Performance tests verify non-functional requirements
✅ Regression tests protect existing functionality

---

## Key Reorganization Changes

### Moved from Foundational to User Stories

| Original Task | Moved To | Rationale |
|---------------|----------|-----------|
| T009-T012 (OCC utils) | US2 (T031-T034) | Needed when recording STO trades |
| T013-T016 (Option value calc) | US6 (T096-T099) | Needed for intrinsic/extrinsic display |
| T017-T020 (FIFO extensions) | US2 (T035-T038) | Needed for realized P&L in US3 |
| T021-T024 (Assignment handlers) | US5 (T078-T081) | Needed for assignment flow |
| T025-T026 (Unrealized P&L) | US6 (T103-T104) | Requires market pricing |
| T027-T028 (Realized P&L) | US3 (T058-T059) | Needed for closing positions |
| T029-T034 (Validators) | US1-US3 | Moved to where first needed |
| T035-T050 (Service extensions) | US1-US6 | Moved to where first needed |

### Value Delivery Audit Adjustments (Dec 2025)

| Original Task | Moved To | Rationale |
|---------------|----------|-----------|
| N/A | US1 (T022b-T022c - NEW) | Option positions need price basis conversion for profit_target/stop_loss display |
| T117-T118 (OptionPositionCard) | US1 (T025-T026) | Users must see option details immediately after creating position |
| N/A | US2 (T059 - NEW) | PositionDetail must display option trade fields for verification |
| T117-T118 (duplicate) | US6 (T117-T118 remain) | Task ID collision resolved - unrealized P&L stays in US6 |
| N/A | Dependency note added | T002 must complete before T004 (DB migration before type extensions) |

### Task Count Reduction

| Phase | Original | Reorganized | Reduction |
|-------|----------|-------------|-----------|
| Setup/Foundation | 50 tasks | 8 tasks | -42 tasks (84% reduction) |
| US1-US3 (MVP) | 38 tasks | 73 tasks | +35 tasks (includes new price basis conversion) |
| **MVP Total** | **88 tasks** | **73 tasks** | **-15 tasks (17% faster to value)** |

### Value Delivery Audit Improvements (Dec 2025)

| Issue | Resolution |
|-------|------------|
| Missing risk-reward calculation for options | Added T022b-T022c (option price basis conversion) to US1 |
| Task ID collision (T117-T118 used twice) | Resolved - T117-T118 remain in US6 for unrealized P&L |
| Users can't verify position creation | OptionPositionCard (T025-T026) moved to US1 |
| Users can't see option trade details | PositionDetail display (T059) added to US2 |
| Database migration timing | Added dependency note: T002 must complete before T004 |

---

## Next Steps

1. **Start with US1 Phase 1A (Setup)** - Database migration (T002) must complete before type extensions (T004)
2. **Continue to US1 Phase 1B** - Create Short Put position plan with price basis conversion (T009-T030)
3. **Continue to US2** - Execute STO trade with option trade display (T031-T059)
4. **Continue to US3** - Close via BTC with FIFO-based realized P&L (T060-T073)
5. **Run full test suite** after each phase
6. **Verify backward compatibility** with existing Long Stock positions

**Remember**: Each (TEST) task writes a comprehensive test suite covering ALL scenarios. The corresponding (IMPL) task is not complete until EVERY test in that suite passes. This ensures thorough coverage and high-quality code.
