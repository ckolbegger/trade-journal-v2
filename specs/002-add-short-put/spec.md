# Feature Specification: Short Put Strategy

**Feature Branch**: `002-add-short-put`  
**Created**: 2025-02-14  
**Status**: Draft  
**Input**: User description: "now we are going to make the largest change we have made to date. We need to update the application to support adding option strategies to our positions. The first strategy we implement will be the short put. We will need to support opening a position with targets and stops based on stock price and then adding a trade to sell a put to that position. We will record the price paid for the put. Once a position contains an option leg, we will report intrinsic vs extrinsic value for the position based on the latest close of the stock and the option. Obviously, our pricing system will need to support entering a price for the option as well as the stock. We will be able to close the short put position by buying to close the contract. The system will move the position to closed status and report realized rather than unrealized profit. Please ask me any questions you have until you are ready to wrtie the specification. As"

## Clarifications

### Session 2025-12-27

- Q: How should option prices be entered? → A: Per share, with all monetary amounts scaled to actual dollar values based on contract quantity.
- Q: When are option prices required? → A: A position can exist without option prices until a trade is added; each trade must record its execution price, and option closing prices are updated daily after the trade is on.
- Q: How should short puts be closed at expiration? → A: Record a zero-price buy-to-close event for both expiration and assignment; if assigned, open a new stock position for assigned shares with cost basis equal to strike minus premium collected.
- Q: Should valuation require daily prices or allow missing data? → A: Valuation requires a recorded price for the date; if a price for the same instrument and date already exists, it is reused without re-entry.
- Q: Should assigned stock positions be created automatically? → A: Prompt the user for confirmation before creating the assigned stock position.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open a stock position with a short put (Priority: P1)

As a trader, I open a stock position with targets and stops based on the stock price, then add a short put leg by recording the contract details and premium received.

**Why this priority**: This is the core workflow for creating a short put strategy and enables all downstream valuation and closing flows.

**Independent Test**: Can be fully tested by creating a position with targets/stops, adding a short put trade, and verifying the option leg appears on the position.

**Acceptance Scenarios**:

1. **Given** a new stock position draft, **When** I enter stock quantity, targets, and stops, **Then** the position is saved with stock targets and stops tied to the stock price.
2. **Given** an open position without option legs, **When** I add a short put trade with contract details and premium received, **Then** the position shows a short put option leg with the recorded premium.

---

### User Story 2 - Value a position with an option leg (Priority: P2)

As a trader, I enter the latest close for the stock and the option so the position shows intrinsic and extrinsic value for the option leg and the position overall.

**Why this priority**: Accurate valuation is essential for monitoring risk and performance once options are part of the position.

**Independent Test**: Can be tested by entering stock and option prices and confirming intrinsic/extrinsic values update accordingly.

**Acceptance Scenarios**:

1. **Given** an open position with a short put leg, **When** I record latest close prices for both the stock and the option, **Then** the system shows intrinsic and extrinsic value for the option leg.
2. **Given** an open position with a short put leg, **When** the option has no intrinsic value at the latest close, **Then** intrinsic value is shown as zero and extrinsic equals the option price.

---

### User Story 3 - Close a short put position (Priority: P3)

As a trader, I buy to close the short put contract so the position moves to closed status and profit is reported as realized.

**Why this priority**: Closing the strategy completes the lifecycle and determines realized profit.

**Independent Test**: Can be tested by recording a buy-to-close trade and verifying the position status and realized profit update.

**Acceptance Scenarios**:

1. **Given** an open position with a short put leg, **When** I add a buy-to-close trade for the contract, **Then** the position status becomes closed and realized profit is calculated.
2. **Given** a closed short put position, **When** I view performance, **Then** unrealized profit is not shown and realized profit is displayed.

---

### Edge Cases

- What happens when the latest close for the option or stock is missing?
- How does the system handle assignment at expiration and the creation of the resulting stock position?
- What happens when a user attempts to add a short put leg to a closed position?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create stock positions with targets and stops tied to stock price levels.
- **FR-002**: System MUST allow users to add a short put option leg to an open stock position by recording contract details and premium received.
- **FR-003**: System MUST store and display option leg details including underlying symbol, strike price, expiration date, quantity, and premium received.
- **FR-004**: System MUST require an execution price for each option trade added to a position, with option prices entered per share.
- **FR-005**: System MUST allow users to record the latest close price for the stock and the option contract after the option trade is recorded.
- **FR-006**: System MUST calculate and display intrinsic value for the short put as the greater of zero or (strike price minus latest stock close).
- **FR-007**: System MUST calculate and display extrinsic value as the option price minus intrinsic value.
- **FR-008**: System MUST mark the position as closed when a buy-to-close trade is recorded for the short put leg.
- **FR-009**: System MUST report realized profit for closed short put positions and unrealized profit for open positions.
- **FR-010**: System MUST prevent adding new option legs or stock trades to positions that are closed.
- **FR-011**: System MUST indicate when valuation data is incomplete due to missing stock or option prices.
- **FR-012**: System MUST record a zero-price buy-to-close event when a short put expires or is assigned at expiration.
- **FR-013**: System MUST prompt for confirmation before opening a new stock position for assigned shares when a short put is assigned.
- **FR-014**: System MUST open a new stock position for assigned shares when a short put is assigned, with cost basis equal to strike price minus premium collected.
- **FR-015**: System MUST display risk/reward and profit/loss amounts scaled to actual dollar values based on contract quantity and the standard contract multiplier.
- **FR-016**: System MUST reuse an existing price for the same instrument and date instead of requesting duplicate price entry.

### Key Entities *(include if feature involves data)*

- **Position**: A trading position with stock quantity, targets, stops, status (open/closed), and linked trades and option legs.
- **Option Leg**: A short put contract linked to a position, including underlying symbol, strike, expiration, quantity, and premium received.
- **Trade**: A transaction tied to a position (sell-to-open short put, buy-to-close short put) with date, quantity, and price.
- **Price Quote**: Latest close price for a stock or option contract used for valuation.

### Assumptions

- Equity options use the standard contract multiplier and are treated as a single leg per position for this initial strategy.
- Positions can have multiple trades for the same short put leg (sell-to-open and buy-to-close).
- Profit calculations use recorded trade prices and latest close prices provided by the user.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 90% of users can create a stock position with a short put leg and saved targets/stops in under 3 minutes.
- **SC-002**: 95% of positions with both stock and option closes entered display intrinsic and extrinsic values without manual recalculation.
- **SC-003**: 90% of users can close a short put position and view realized profit on the first attempt.
- **SC-004**: Missing price data is surfaced in 100% of cases where valuation would otherwise be incomplete.
