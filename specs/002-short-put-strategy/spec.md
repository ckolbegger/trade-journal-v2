# Feature Specification: Add Short Put Strategy

**Feature Branch**: `002-short-put-strategy`
**Created**: 2025-12-27
**Status**: Draft
**Input**: User description: "We need to update the application to support adding option strategies to our positions. The first strategy we implement will be the short put. We will need to support opening a position with targets and stops based on stock price and then adding a trade to sell a put to that position. We will record the price paid for the put. Once a position contains an option leg, we will report intrinsic vs extrinsic value for the position based on the latest close of the stock and the option. Obviously, our pricing system will need to support entering a price for the option as well as the stock. We will be able to close the short put position by buying to close the contract. The system will move the position to closed status and report realized rather than unrealized profit. Please ask me any questions you have until you are ready to wrtie the specification. As you're thinking through the problem, recognize that we will next be supporting covered calls, and ultimately support scaling in and out of multileg option positions."

## Clarifications

### Session 2025-12-27

- Q: Data structure for option details? → A: Generic Multi-leg (Position holds list of Legs).
- Q: Capture underlying price on trade? → A: Yes, capture underlying price on trade. Also support Stops based on *either* Stock Price OR Option Price.
- Q: Option display format? → A: Display Verbose fields (Exp, Strike, Type) to user, but internally use OCC string for instrument matching/FIFO.
- Q: Contract multiplier? → A: Standard Multiplier (100 shares/contract).
- Q: Price update handling? → A: Separate Price Entries per instrument (Stock, Option). Stored by Instrument + Date (initially Closing Price, future-proof for OHLC). Shared history across positions.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Short Put Position (Priority: P1)

The user wants to initiate a short put strategy on a specific stock. They need to define their plan based on the stock's price behavior (where they would exit or take profit) but execute the trade using an option contract.

**Why this priority**: This is the entry point for the new functionality. Without opening a position, no other features matter.

**Independent Test**: Can be tested by verifying that a new position is created with the correct "Open" status, linked to the correct underlying stock, and contains the details of the short put option trade.

**Acceptance Scenarios**:

1. **Given** a user is on the position creation screen, **When** they select "Short Put" strategy and enter a stock ticker, **Then** they can define a trading plan with Target and Stop prices based on the **Underlying Stock Price** OR the **Option Premium**.
2. **Given** a planned position, **When** the user adds a "Sell to Open" trade, **Then** they enter discrete Option details (Strike, Expiration, Type) which the system converts to an **OCC Symbol** for tracking.
3. **Given** valid inputs, **Then** the position is created with an "Open" status and the trade details are recorded.

---

### User Story 2 - Track Intrinsic/Extrinsic Value (Priority: P2)

Once the position is open, the user needs to monitor its performance. Uniquely for options, this involves breaking down the option's value into intrinsic (in-the-money value) and extrinsic (time value) components to make informed decisions.

**Why this priority**: Essential for managing the active position and understanding the source of profit/loss.

**Independent Test**: Can be tested by creating a position with known parameters, manually inputting current market prices, and verifying the calculated intrinsic/extrinsic values against standard formulas.

**Acceptance Scenarios**:

1. **Given** an open short put position, **When** the user views the dashboard or detail page, **Then** the system displays the current Intrinsic and Extrinsic value of the position.
2. **Given** the pricing system, **When** the user manually updates the current price for both the Stock and the Option, **Then** the Intrinsic and Extrinsic values are recalculated and updated on the display.
3. **Given** a shared instrument (e.g., same stock in multiple positions), **When** a price is added for a specific date, **Then** it is stored once and reused across all relevant positions.

---

### User Story 3 - Close Position & Realize P&L (Priority: P3)

The user decides to exit the position. For a short put, this typically means "Buying to Close" the contract. The system must correctly calculate the final profit or loss based on the difference between the opening credit and closing debit.

**Why this priority**: Completes the trade lifecycle and provides the historical data needed for the journal.

**Independent Test**: Can be tested by performing a "Buy to Close" action on an existing open position and verifying the final P&L calculation and status change.

**Acceptance Scenarios**:

1. **Given** an open short put position, **When** the user adds a "Buy to Close" trade for the full quantity, **Then** the position status changes to "Closed".
2. **Given** a closed position, **When** viewed in history, **Then** the system displays the Realized Profit/Loss (Premium Received - Premium Paid).

### Edge Cases

- What happens when the user tries to close more contracts than they have open? (System should prevent or flag this error).
- How does the system handle an option expiring worthless? (Should allow closing at 0 price or specific "Expire" action).
- What happens if the stock price is updated but the option price is not (or vice versa)? (System should use the latest available data but potentially warn of staleness).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow defining a Position with a strategy type of "Short Put".
- **FR-002**: System MUST allow capturing a Trading Plan (Stop Loss, Take Profit) based on:
    - **Underlying Stock Price** (e.g., support broken).
    - **Option Price** (e.g., buyback cost limit).
- **FR-003**: System MUST support recording "Sell to Open" trades that are linked to a specific **Option Leg**.
- **FR-003a**: Each Option Leg MUST define Strike Price, Expiration Date, and Option Type (Put).
- **FR-003b**: System MUST generate an **OCC Symbol** from leg details to uniquely identify the instrument for FIFO matching.
- **FR-003c**: Each Trade MUST record the **Underlying Stock Price** at the time of execution.
- **FR-004**: System MUST support recording the Premium (price) received for opening the short put.
- **FR-005**: System MUST allow manual entry of current market prices for both the Underlying Stock and the Option Contract.
- **FR-005a**: Price entries MUST be stored by **Instrument ID + Date** to be shared across positions.
- **FR-005b**: The schema MUST support future OHLC data (currently using Closing Price).
- **FR-006**: System MUST calculate Intrinsic Value based on the difference between Stock Price and Strike Price (for Puts: Max(0, Strike - Stock)).
- **FR-007**: System MUST calculate Extrinsic Value as (Current Option Price - Intrinsic Value).
- **FR-008**: System MUST support "Buy to Close" trades to reduce or close the position leg.
- **FR-009**: System MUST calculate Realized P&L when a position is closed, distinct from Unrealized P&L.
- **FR-010**: System MUST transition the Position status to "Closed" when the open quantity of all legs reaches zero.
- **FR-011**: System MUST apply a standard multiplier of 100 to all option contract calculations (P&L = Price * Quantity * 100).

### Key Entities *(include if feature involves data)*

- **Position**: The container for the strategy. Tracks the underlying stock, overall status (Open/Closed), and aggregates data from its Legs.
- **Leg**: A component of the position (e.g., the specific Option Contract). Holds the quantity and contract definition (Type, Strike, Expiration).
- **Trade**: A specific transaction (Sell to Open, Buy to Close) applied to a specific Leg. Records both **Option Price** and **Underlying Price**. Uses **OCC Symbol** to link to Leg.
- **Price Entry**: A record of the market value of an Instrument (Stock or Option) for a specific Date. Shared across positions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can successfully record a complete Short Put lifecycle (Open -> Update Price -> Close) without errors.
- **SC-002**: Intrinsic and Extrinsic value calculations match standard mathematical definitions (within rounding error) for 100% of test cases.
- **SC-003**: System correctly distinguishes between Realized and Unrealized P&L in the UI for closed vs. open positions.
- **SC-004**: Users can define targets/stops based on Stock Price while trading the Option instrument.

## Assumptions

- Pricing updates are manual (user enters the current price).
- This feature focuses on single-leg Short Puts, but the data model must use a generic multi-leg structure (Position -> Legs) to support future strategies.
- "Price paid" in the user description for a short put refers to the *Premium Received* (since it's a credit strategy), but the system handles it as a transaction price.
