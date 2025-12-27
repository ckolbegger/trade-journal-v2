# Feature Specification: Options Support - Short Put Strategy

**Feature Branch**: `002-options-support`
**Created**: 2025-12-27
**Status**: Draft
**Input**: User description: "Add options support starting with short put strategy"

## Clarifications

### Session 2025-12-27

- Q: Should the system support a single-user mode only, or multi-user accounts with different permission levels? → A: Single-user mode only - all features available to the one user of the device
- Q: How should option legs be uniquely identified within a position? → A: Option trades store OCC symbol derived from (symbol + strike + expiration + type + side), with generated UUID for scaling in/out. FIFO P&L matching uses OCC symbol. UI collects option type, strike, expiration and derives OCC.
- Q: How should the system handle loading, empty, and error states for options? → A: Use existing loading/empty/error patterns from stock positions for consistency
- Q: If a short put is assigned on only part of the position, how should the system handle remaining contracts? → A: Support partial assignments. Assignment BTC assigned contracts in current position and creates new stock position for assigned shares with cost basis (strike price - premium received). Remaining contracts stay open with adjusted quantity.
- Q: What are acceptable performance targets for option operations and data retention policies? → A: Use existing system performance patterns, retain all data indefinitely

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Short Put Position Plan (Priority: P1)

As a trader, I want to create a position plan for a short put strategy so that I can document my trading thesis, targets, and risk parameters before executing trades.

**Why this priority**: This is the foundational capability that enables all option-related functionality. Without the ability to plan a short put position, users cannot proceed to execute trades or track positions.

**Independent Test**: Can be fully tested by creating a new position plan with a short put option leg and verifying the position displays correctly with all plan details visible.

**Acceptance Scenarios**:

1. **Given** the user is on the position creation flow, **When** they select "Short Put" as the strategy type and enter stock symbol, strike price, expiration date, and premium per contract, **Then** the system creates a position with an option leg containing all entered details.

2. **Given** a short put position plan exists with targets and stops, **When** the user views the position detail, **Then** they see the stock targets (entry, stop loss, profit target) and option details (strike, expiration, premium) displayed separately.

3. **Given** the user is creating a short put plan, **When** they enter a stock price target of $100 with a 5% stop at $95 and sell a $105 strike put for $2.50 premium, **Then** the position stores both the stock-based targets/stops and option contract details.

---

### User Story 2 - Execute Short Put Opening Trade (Priority: P1)

As a trader, I want to record selling a put option contract against my position plan so that I can track the actual execution details and calculate risk/reward based on real trades.

**Why this priority**: Executing the opening trade is the core action that transitions a plan into an active position. Without recording the actual trade, no meaningful P&L or risk tracking can occur.

**Independent Test**: Can be fully tested by adding a "Sell to Open" option trade to a position and verifying the position status changes to "open" with correct cost basis calculated.

**Acceptance Scenarios**:

1. **Given** a short put position plan exists, **When** the user adds a trade to sell to open a put contract at $2.50 per contract (total $250 for 100-share contract), **Then** the trade is recorded with type "sell_to_open", quantity, price per contract, and total value.

2. **Given** an opening short put trade is executed, **When** the position calculates risk/reward, **Then** the max risk is calculated as (strike price - premium received) × shares, and max reward is premium received × shares.

3. **Given** a short put trade is executed, **When** the user views the position, **Then** the average cost basis for the option leg shows as negative (credit received).

---

### User Story 3 - Track Option Position Value with Intrinsic and Extrinsic Components (Priority: P1)

As a trader, I want to see how much of my option position value is intrinsic versus extrinsic so that I can understand the risk of early assignment and make informed decisions about holding versus closing.

**Why this priority**: Understanding intrinsic vs extrinsic value is essential for option traders to assess assignment risk and make exit decisions. This is a core value proposition for option support that doesn't exist in the stock-only system.

**Independent Test**: Can be fully tested by entering current stock and option prices for a short put position and verifying the position displays separate intrinsic and extrinsic values that sum correctly.

**Acceptance Scenarios**:

1. **Given** a short put position exists with strike $105 and current stock price $100, **When** the user enters current option price or the system retrieves it, **Then** intrinsic value is displayed as max(0, strike - stock price) = $5 per share, and extrinsic value is option price minus intrinsic value.

2. **Given** a short put position with stock at $110 (above strike), **When** the option is deep in the money, **Then** intrinsic value is displayed prominently and extrinsic value is minimal or zero.

3. **Given** the user has entered current prices for stock and option, **When** viewing the position detail, **Then** unrealized P&L is shown with breakdown of intrinsic and extrinsic components.

---

### User Story 4 - Close Short Put Position via Buy-to-Close Trade (Priority: P1)

As a trader, I want to close my short put position by buying back the option contract so that I can lock in realized profit or limit losses.

**Why this priority**: Closing positions is the fundamental action that realizes P&L and updates position status. Without this, users cannot complete the trading cycle.

**Independent Test**: Can be fully tested by adding a buy-to-close trade to a short put position and verifying the position status changes to "closed" with realized P&L calculated.

**Acceptance Scenarios**:

1. **Given** an open short put position, **When** the user adds a "Buy to Close" trade at $1.50 per contract, **Then** realized P&L is calculated as (opening premium - closing premium) × shares.

2. **Given** a short put position is closed via buy-to-close trade, **When** the position status changes, **Then** the position displays "closed" status and shows realized P&L instead of unrealized.

3. **Given** the user has multiple option legs in a position, **When** closing one leg, **Then** only that leg is closed and the position remains open with remaining legs.

---

### User Story 5 - Record Expiration and Assignment (Priority: P2)

As a trader, I want to record what happens when my short put expires or is assigned so that my trading journal reflects real-world outcomes and assignment creates the resulting stock position.

**Why this priority**: While not the primary happy path, expiration and assignment are critical real-world scenarios. Assignment creating a new stock position with adjusted cost basis is a key business requirement.

**Independent Test**: Can be fully tested by recording a short put expiration at $0 and verifying the position shows realized P&L, and by recording an assignment and verifying a new long stock position is created.

**Acceptance Scenarios**:

1. **Given** a short put position expires worthless, **When** the user records expiration as a buy-to-close trade at $0, **Then** realized P&L equals the full premium received, and position status changes to "closed".

2. **Given** a short put is assigned (stock put to user), **When** the user records assignment as a buy-to-close trade at $0, **Then** a new long stock position is created with quantity equal to the option contract size and cost basis of (strike price - premium received) per share.

3. **Given** an assignment creates a new stock position, **When** the user views both positions, **Then** the relationship between the option position and resulting stock position is visible in the journal.

---

### User Story 6 - View Options Alongside Stock Positions (Priority: P2)

As a trader with mixed stock and option positions, I want to see all my positions in a unified dashboard so that I can assess my overall portfolio exposure and prioritize attention.

**Why this priority**: Users will have both stock and option positions. A unified view ensures options don't create a separate silo and enables attention-based prioritization across all positions.

**Independent Test**: Can be fully tested by creating both stock and option positions and verifying they appear together in the dashboard with appropriate filtering.

**Acceptance Scenarios**:

1. **Given** the user has stock positions and short put positions, **When** viewing the dashboard, **Then** all positions appear in a unified list with appropriate visual indicators distinguishing option from stock positions.

2. **Given** option positions exist, **When** filtering dashboard by status or searching, **Then** option positions are included in results with correct filtering behavior.

3. **Given** the user has many positions, **When** sorting by volatility or attention metrics, **Then** option positions are included in the ranking with appropriate risk calculations.

---

### Edge Cases

- What happens when option price exceeds the theoretical maximum based on stock price?
- How does system handle partial assignment scenarios?
- What occurs when user tries to close a position that has already been closed?
- How are realized P&L statistics calculated when a position has multiple opening and closing trades?
- What happens if the user enters conflicting information between stock targets and option terms?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create position plans that include option legs with strike price, expiration date, option type (put/call), and premium per contract.

- **FR-002**: System MUST store option leg details separately from stock legs within a position, supporting unlimited legs per position in the data model.

- **FR-003**: System MUST calculate and display option pricing in total dollars (premium per contract × contract quantity) while maintaining per-share premium for display.

- **FR-004**: System MUST calculate and display risk/reward metrics in total dollars to ensure traders are aware of actual position risk.

- **FR-005**: System MUST calculate intrinsic value as max(0, strike price - current stock price) for puts and max(0, current stock price - strike price) for calls.

- **FR-006**: System MUST calculate extrinsic value as option total value minus intrinsic value.

- **FR-007**: System MUST display unrealized P&L for option positions with separate intrinsic and extrinsic components.

- **FR-008**: System MUST support adding option trades with types: sell_to_open, buy_to_close, buy_to_open, sell_to_close.

- **FR-009**: System MUST calculate realized P&L when positions are closed via trades, using total dollar amounts.

- **FR-010**: System MUST record expiration as a buy_to_close trade with $0 price and calculate full premium as realized profit.

- **FR-011**: System MUST create a new long stock position when assignment is recorded, with cost basis of (strike price - premium received) per share.

- **FR-012**: System MUST update position status to "closed" when all option legs are closed via trades.

- **FR-013**: System MUST display realized P&L instead of unrealized P&L for closed positions.

- **FR-014**: System MUST support entering option prices alongside stock prices in the pricing system.

- **FR-015**: System MUST validate that option legs reference valid strike prices, expiration dates, and contract sizes.

### Key Entities *(include if feature involves data)*

- **Position**: The core entity representing a trading position. Contains an array of legs (stock and/or option), status (planned/open/closed), plan details (thesis, targets, stops), and P&L calculations. Supports unlimited legs for future multi-leg strategies.

- **OptionLeg**: A leg type within a position containing option-specific details. Includes option_type (put/call), strike_price, expiration_date, premium_per_contract, contract_quantity, and leg_status (open/closed). References the underlying stock symbol.

- **OptionTrade**: A trade specific to options with trade_type (sell_to_open, buy_to_close, buy_to_open, sell_to_close), price_per_contract, total_value, and contract_quantity. Links to the parent position and option leg.

- **StockLeg**: Existing leg type for stock positions, retained for compatibility. Contains symbol, quantity, and reference to trades.

- **AssignmentRecord**: Tracks assignment events with reference to the original option position and the newly created stock position. Stores the assignment price and resulting cost basis.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Traders can create a short put position plan with option details in under 3 minutes.

- **SC-002**: All option positions display accurate intrinsic and extrinsic value breakdowns that sum to the current option market value.

- **SC-003**: Position status correctly transitions from "planned" to "open" after opening trade, and to "closed" after closing trade, with realized P&L displayed for closed positions.

- **SC-004**: Assignment workflows correctly create new stock positions with adjusted cost basis, traceable through the journal.

- **SC-005**: The dashboard displays a unified view of stock and option positions with consistent attention sorting and filtering.

- **SC-006**: Risk/reward calculations for options display in total dollars, making actual dollar risk immediately visible to traders.

## Assumptions

- Initial implementation limits to one opening trade and one closing trade per option leg, even though unlimited legs are supported in data model.

- Option contract size is standard 100 shares per contract.

- Premium is quoted per share (e.g., $2.50) with total calculated as premium × 100.

- Expiration dates are stored as dates and compared against current date for expiration detection.

- Current option prices are entered manually by users; automated price feeds are out of scope.

- Assignment always results in 100 shares per contract being put to the option seller.

## Out of Scope

- Automated price feeds for options (manual entry only).

- Complex multi-leg strategies beyond single short put (covered calls, spreads, strangles, butterflies planned for future).

- Exercise functionality separate from assignment workflow.

- Option Greeks calculations (delta, gamma, theta, vega).

- Margin requirements calculations.

- Paper trading or simulated options.

- Real-time option price updates.

## Dependencies

- Existing position and trade data models.

- Existing pricing system infrastructure.

- Existing journal entry system for forced journaling.

- IndexedDB storage layer.

## Notes

This feature implements the first phase of options support, focusing on the short put strategy as a building block. The architecture supports unlimited legs to enable future covered calls, spreads, and complex strategies. The $0 price for expiration/assignment trades ensures realized P&L is calculated correctly while capturing the real-world outcome. The assignment-created stock position with adjusted cost basis is critical for accurate portfolio tracking.
