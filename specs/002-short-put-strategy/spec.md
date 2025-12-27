# Feature Specification: Short Put Strategy Support

**Feature Branch**: `002-short-put-strategy`
**Created**: 2025-12-27
**Status**: Draft
**Input**: Add Short Put option strategy support as the first option type in the trading journal

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Short Put Position Plan (Priority: P1)

As a trader, I want to create a position plan for selling a put option so that I can document my strategy intent before execution, including my premium targets and risk parameters.

**Why this priority**: This is the entry point for all short put trading. Without position planning, no other short put functionality is accessible. Establishes the foundation for behavioral training around options.

**Independent Test**: Can be fully tested by creating a Short Put position plan with all required fields and verifying it appears in the position list with "planned" status.

**Acceptance Scenarios**:

1. **Given** I am on the position creation screen, **When** I select "Short Put" strategy type, **Then** I see option-specific fields (symbol, strike price, expiration date, contract quantity, target premium, profit target, stock stop loss, max loss, thesis)

2. **Given** I am creating a Short Put plan, **When** I need to enter strike price, **Then** I can use a picker or manual entry

3. **Given** I am creating a Short Put plan, **When** I need to enter expiration date, **Then** I can use a date picker

4. **Given** I am entering premium and loss values, **When** I type in the fields, **Then** values are displayed with $ formatting

5. **Given** I have entered all required Short Put plan fields, **When** I submit the plan, **Then** a new position is created with "planned" status and I am prompted to write a journal entry

6. **Given** I am creating a Short Put plan, **When** I enter an expiration date in the past, **Then** I see an inline validation error and cannot submit

7. **Given** I enter an optional field (premium_profit_target, stock_stop_loss, or max_loss), **When** I enter a value <= 0, **Then** I see an inline validation error

---

### User Story 2 - Execute Sell-to-Open Trade (Priority: P1)

As a trader, I want to record when I sell a put option so that I can track my actual execution against my plan.

**Why this priority**: Opening a position is essential to track any trading activity. Combined with P1 position creation, this enables the core open position workflow.

**Independent Test**: Can be tested by adding a sell-to-open trade to a planned Short Put position and verifying position status changes to "open".

**Acceptance Scenarios**:

1. **Given** I have a planned Short Put position, **When** I open the trade execution form, **Then** option fields (strike, expiration, option type) are auto-populated from the position plan

2. **Given** I am adding a sell-to-open trade, **When** I view the price field, **Then** it is labeled "Premium per contract"

3. **Given** I have a planned Short Put position, **When** I add a sell-to-open trade with quantity and premium, **Then** the position status becomes "open" and I am prompted to write a journal entry

4. **Given** I am adding a sell-to-open trade, **When** I submit the trade, **Then** the system generates the standard option symbol automatically from the position's strike, expiration, and underlying

5. **Given** I sold 3 contracts at $1.50 premium, **When** I view the position, **Then** I see unrealized P&L calculated as (premium received - current option price) x contracts x 100

6. **Given** I have an open Short Put position, **When** I try to add another sell-to-open trade after expiration date, **Then** I see a validation error (sell-to-open only allowed before expiration)

---

### User Story 3 - Close Position via Buy-to-Close (Priority: P2)

As a trader, I want to close my short put by buying back the contracts so that I can lock in profits or cut losses.

**Why this priority**: Most common exit method. Enables realized P&L tracking and position closure.

**Independent Test**: Can be tested by adding a buy-to-close trade to an open Short Put and verifying realized P&L calculation and position closure.

**Acceptance Scenarios**:

1. **Given** I have an open Short Put position, **When** I add a buy-to-close trade for all contracts, **Then** the position status becomes "closed" and realized P&L is calculated

2. **Given** I sold at $1.50 and buy to close at $0.50, **When** the position closes, **Then** realized P&L shows $100 profit per contract ($1.00 x 100 shares)

3. **Given** I have 5 open contracts, **When** I buy to close only 2 contracts, **Then** the position remains "open" with 3 contracts and shows partial realized P&L

4. **Given** I am adding a buy-to-close trade, **When** the trade's strike or expiration doesn't match the position, **Then** I see a validation error

---

### User Story 4 - Record Expiration Worthless (Priority: P2)

As a trader, I want to record when my short put expires worthless so that I can capture the full premium as profit.

**Why this priority**: Second most common exit for successful short puts. Simpler than buy-to-close since price is always $0.

**Independent Test**: Can be tested by recording expiration on an open Short Put after expiration date and verifying full premium captured as realized P&L.

**Acceptance Scenarios**:

1. **Given** I have an open Short Put and today is on/after expiration date, **When** I record "expired", **Then** a closing trade is created at $0.00 and position becomes "closed"

2. **Given** my position has not reached expiration date, **When** I try to record "expired", **Then** I see a validation error (must use buy-to-close for early exits)

3. **Given** I sold at $1.50 and the option expires worthless, **When** I view realized P&L, **Then** it shows full $150 profit per contract

---

### User Story 5 - Handle Assignment (Priority: P2)

As a trader, I want to record when my short put is assigned so that I can properly track the stock acquisition and maintain accurate cost basis.

**Why this priority**: Critical for accurate record-keeping when puts go in-the-money. Creates linked stock position for continued tracking.

**Independent Test**: Can be tested by recording assignment, completing stock position plan in modal, and verifying linked stock position is created with correct cost basis.

**Acceptance Scenarios**:

1. **Given** I have an open Short Put and today is on/after expiration date, **When** I record "assigned" for 2 of 5 contracts, **Then** I am guided to create a stock position plan for 200 shares

2. **Given** I am in the assignment modal, **When** viewing the form, **Then** I see displayed for reference (not editable): premium received from put and effective cost basis per share

3. **Given** assignment is recorded, **When** I complete the stock position plan, **Then** a new Long Stock position is created with cost basis = strike price, and the premium received is stored as a cost basis adjustment

4. **Given** I sold a $10 put for $1.00 premium and was assigned, **When** I view the new stock position, **Then** I see effective cost basis displayed as $9.00 per share (strike minus premium)

5. **Given** partial assignment (2 of 5 contracts), **When** assignment completes, **Then** the Short Put position remains "open" with 3 contracts, and stock position is created for 200 shares only

6. **Given** I complete the assignment flow, **When** I am prompted for a journal entry, **Then** I see assignment-specific prompts: "What happened that led to assignment?", "How do you feel about now owning this stock?", "What's your plan for the stock position?"

---

### User Story 6 - Enter Option and Stock Prices (Priority: P3)

As a trader, I want to enter both stock and option closing prices so that I can see mark-to-market P&L and intrinsic/extrinsic value breakdown.

**Why this priority**: Essential for daily position review but not blocking for core trading workflows. Enhances understanding of option value composition.

**Independent Test**: Can be tested by entering both stock and option prices for an open Short Put and verifying intrinsic/extrinsic values are calculated and displayed.

**Acceptance Scenarios**:

1. **Given** I have an open Short Put, **When** I enter evening prices, **Then** I am prompted for both the underlying stock price and the option price

2. **Given** I enter a price that differs by more than 20% from the previous close, **When** I submit, **Then** I am asked to confirm the large price change (existing behavior preserved)

3. **Given** stock at $9.50, strike at $10, option at $0.80, **When** prices are saved, **Then** intrinsic value shows $0.50 and extrinsic value shows $0.30

4. **Given** I have not entered option price, **When** I view the position, **Then** I see "Price data required" instead of intrinsic/extrinsic breakdown

5. **Given** I have entered both stock and option prices, **When** I view the Trade Detail, **Then** I see intrinsic and extrinsic values per contract AND total values (x contracts x 100)

6. **Given** I have entered both stock and option prices, **When** I view the Position Detail, **Then** I see rolled up total extrinsic value across all option legs

---

### User Story 7 - View Positions on Dashboard (Priority: P3)

As a trader, I want to see my Short Put positions on the dashboard with relevant option information so that I can quickly assess my portfolio.

**Why this priority**: Dashboard visibility is important for daily workflow but not blocking for core trading functionality.

**Independent Test**: Can be tested by creating Short Put positions and verifying they display correctly on the dashboard with strategy badge and option details.

**Acceptance Scenarios**:

1. **Given** I have Short Put positions, **When** I view the dashboard, **Then** each position card shows a strategy type badge indicating "Short Put"

2. **Given** I have an open Short Put position, **When** I view its dashboard card, **Then** I see Strike price, Expiration date, and Premium received

3. **Given** I have entered both stock and option prices for a Short Put, **When** I view its dashboard card, **Then** I see an Intrinsic/Extrinsic summary

4. **Given** I have not entered prices for a Short Put, **When** I view its dashboard card, **Then** the Intrinsic/Extrinsic area shows "Price data required"

---

### Edge Cases

- What happens when user tries to close more contracts than are open? System validates quantity <= remaining open contracts
- What happens when option price goes negative in extrinsic calculation (deep ITM)? Extrinsic can be negative; display as-is
- What happens on partial assignment followed by expiration of remaining contracts? Each is recorded as separate trade; position closes when net quantity reaches zero
- What happens if user enters stock price but not option price? Unrealized P&L and intrinsic/extrinsic cannot be calculated; show appropriate message
- What happens when trade strike/expiration doesn't match position? Validation error prevents submission

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create Short Put position plans with: symbol, strike price, expiration date, contract quantity, target premium, premium profit target, stock stop loss, max loss, and position thesis
- **FR-002**: System MUST generate standard option symbols automatically from strike, expiration, and underlying
- **FR-003**: System MUST support trade types: sell-to-open, buy-to-close, expired, and assigned for Short Put positions
- **FR-004**: System MUST calculate unrealized P&L as (premium received - current option price) x contracts x 100
- **FR-005**: System MUST calculate realized P&L as (sell price - buy price) x contracts x 100
- **FR-006**: System MUST enforce expiration date constraint: "expired" and "assigned" trades only allowed on/after expiration date
- **FR-007**: System MUST enforce sell-to-open constraint: only allowed before expiration date
- **FR-008**: System MUST support partial closes and partial assignments
- **FR-009**: System MUST create a linked Long Stock position when assignment occurs, with cost basis adjustment for premium received
- **FR-010**: System MUST prompt for journal entry on position plan creation and trade execution
- **FR-011**: System MUST display inline validation errors for invalid fields, blocking form submission until resolved
- **FR-012**: System MUST calculate intrinsic value as max(0, strike - stock price) for puts
- **FR-013**: System MUST calculate extrinsic value as option price - intrinsic value
- **FR-014**: System MUST prompt for both stock and option prices during price entry for option positions
- **FR-015**: System MUST preserve existing Long Stock functionality unchanged
- **FR-016**: System MUST validate that trade strike_price matches position strike_price
- **FR-017**: System MUST validate that trade expiration_date matches position expiration_date
- **FR-018**: System MUST validate optional fields (premium_profit_target, stock_stop_loss, max_loss) are > 0 when provided

### Journal Entry Requirements

- **FR-019**: System MUST support a new journal entry type 'option_assignment' for documenting assignment events
- **FR-020**: System MUST display assignment-specific journal prompts:
  - "What happened that led to assignment?"
  - "How do you feel about now owning this stock?"
  - "What's your plan for the stock position?"

### Price Entry Requirements

- **FR-021**: System MUST require confirmation when a price entry differs by more than 20% from the previous close (existing behavior preserved for options)
- **FR-022**: System MUST allow option prices >= 0 (can be worthless)
- **FR-023**: System MUST require stock prices > 0

### Display Requirements

- **FR-024**: Trade Detail View MUST display intrinsic value per contract and total (x contracts x 100)
- **FR-025**: Trade Detail View MUST display extrinsic value per contract and total (x contracts x 100)
- **FR-026**: Position Detail View MUST display rolled up total extrinsic value across all option legs
- **FR-027**: Assignment modal MUST display premium received from put (for reference, not editable)
- **FR-028**: Assignment modal MUST display effective cost basis per share (for reference, not editable)

### UI Requirements

- **FR-029**: Position cards on dashboard MUST display a strategy type badge (e.g., "Short Put")
- **FR-030**: Option position cards MUST display Strike price, Expiration date, and Premium received
- **FR-031**: Option position cards MUST display Intrinsic/Extrinsic summary when prices are available
- **FR-032**: Trade execution form price field MUST be labeled "Premium per contract" for option trades
- **FR-033**: Trade execution form MUST auto-populate option fields (strike, expiration, option type) from position plan
- **FR-034**: Position creation form MUST provide a picker or manual entry for strike price
- **FR-035**: Position creation form MUST provide a date picker for expiration date
- **FR-036**: Position creation form MUST display premium and loss values with $ formatting

### Validation Requirements

- **FR-037**: Validation errors MUST appear/clear in real-time as user corrects input
- **FR-038**: On form submit with validation errors, focus MUST move to the first invalid field

### Data Migration Requirements

- **FR-039**: System MUST increment storage version to trigger upgrade on existing installations
- **FR-040**: Existing positions without strategy_type MUST default to 'Long Stock' during migration
- **FR-041**: New optional fields MUST not cause data loss for existing positions

### Key Entities

- **Position**: Represents trader's strategic plan. Extended with strategy type (Long Stock, Short Put) and option-specific fields (strike, expiration, premium targets). Status derived from trades.
- **Trade**: Individual execution record. Extended with option trade types (sell_to_open, buy_to_close, expired, assigned), option fields, and assignment linkage to created stock position.
- **Price History**: Existing entity. Stores closing prices for both stocks (by symbol) and options (by generated option symbol).
- **Journal Entry**: Extended with new entry type 'option_assignment' for documenting assignment events with specific prompts.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a Short Put position plan and execute a sell-to-open trade in under 3 minutes
- **SC-002**: Users can complete any position closing flow (buy-to-close, expired, assigned) in under 2 minutes
- **SC-003**: Assignment flow guides user through stock position creation with 100% of required fields auto-populated (symbol, quantity, entry price)
- **SC-004**: Assignment modal displays premium received and effective cost basis for user reference
- **SC-005**: P&L calculations match expected values within $0.01 for all test scenarios
- **SC-006**: Intrinsic/extrinsic values display correctly at both trade level (per-contract and total) and position level (rolled up)
- **SC-007**: 100% of Short Put positions show correct status (planned/open/closed) based on trade activity
- **SC-008**: Existing Long Stock functionality passes all current tests (zero regression)
- **SC-009**: All validation errors appear inline below the relevant field within 200ms of user input
- **SC-010**: Validation errors clear immediately when user corrects the input
- **SC-011**: Dashboard displays strategy type badge for all positions
- **SC-012**: 20% price change confirmation appears for both stock and option price entries
- **SC-013**: Existing positions migrate successfully with strategy_type defaulting to 'Long Stock'

## Assumptions

- Contract multiplier is 100 shares per contract (standard equity options)
- Option symbols follow OCC format (SYMBOL + space padding + YYMMDD + C/P + strike x 1000)
- Users manually enter prices (no real-time data feeds)
- Single user per instance (no concurrent editing concerns)
- Browser-based with local storage only

## Out of Scope

- Covered calls (next phase)
- Wheel strategy (future phase)
- Multi-leg positions (future phase)
- Real-time option quotes
- Greeks calculation (delta, theta, etc.)
- Option chain display
- Automatic expiration/assignment detection

## Clarifications (from Session 2025-12-26)

- Cost basis adjustment stored on stock trade created at assignment (provides audit trail)
- Partial assignment supported: assigned contracts create stock position, remaining contracts stay open
- Validation errors displayed inline below each invalid field
- "Expired" trade type strictly enforced: only allowed on/after expiration date
