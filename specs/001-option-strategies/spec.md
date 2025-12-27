# Feature Specification: Option Strategies Support - Short Put

**Feature Branch**: `001-option-strategies`
**Created**: 2025-12-27
**Status**: Draft
**Input**: User description: "We need to update the application to support adding option strategies to our positions. The first strategy we implement will be the short put. We will need to support opening a position with targets and stops based on stock price and then adding a trade to sell a put to that position. We will record the price paid for the put. Once a position contains an option leg, we will report intrinsic vs extrinsic value for the position based on the latest close of the stock and the option. Obviously, our pricing system will need to support entering a price for the option as well as the stock. We will be able to close the short put position by buying to close the contract. The system will move the position to closed status and report realized rather than unrealized profit. Please ask me any questions you have until you are ready to write the specification. As you're thinking through the problem, recognize that we will next be supporting covered calls, and ultimately support scaling in and out of multileg option positions."

## User Scenarios & Testing

### User Story 1 - Open Stock Position Plan (Priority: P1)

A trader wants to plan a potential short put position by first creating a stock-based position plan. The trader defines the underlying stock, target entry/exit prices based on stock price, stop loss levels, and documents their thesis in a mandatory journal entry. The position is created with zero quantity (planning state) and contains no actual trades yet.

**Why this priority**: This is the foundation for all option strategies. The position plan represents the trader's strategic intent and provides the context for any option trades that follow. Without the immutable plan, the educational value of plan vs. execution analysis is lost.

**Independent Test**: Can be fully tested by creating a position plan with stock-based targets and stops, verifying the plan is immutable and contains no trades, and confirming a journal entry was required.

**Acceptance Scenarios**:

1. **Given** a trader is on the position dashboard, **When** they initiate position creation, **Then** they must complete a journal entry before the position plan can be saved
2. **Given** a trader is creating a position plan, **When** they enter stock-based price targets and stops, **Then** these values are saved as the immutable plan
3. **Given** a position plan has been created, **When** the trader views the position, **Then** the plan shows zero quantity and zero trades (planning state only)

---

### User Story 2 - Add Short Put Trade to Position (Priority: P1)

A trader has a stock position plan and wants to execute a short put strategy. The trader adds a trade to sell a put, specifying the option contract details (strike price, expiration date, quantity), the premium received per contract, and the trade date. The system validates the trade matches the planned strategy, warns if it deviates from the plan, requires confirmation, and records the trade. The position now shows an open short put position with the premium received as credit.

**Why this priority**: This is the core action of the short put strategy. Selling the put is what creates the actual obligation and potential profit/loss scenario. The validation and warning system reinforces behavioral training by making traders consciously acknowledge deviations from their plan.

**Independent Test**: Can be fully tested by adding a short put trade to a stock position plan, verifying option details are captured, premium is recorded as credit, and deviation warnings work correctly.

**Acceptance Scenarios**:

1. **Given** a trader has an open stock position plan, **When** they add a short put trade matching the strategy (same underlying), **Then** the trade is recorded with option type "PUT", action "SELL_TO_OPEN", and premium received is added to position cash
2. **Given** a trader is adding a short put trade, **When** the underlying symbol differs from the position plan, **Then** the system warns this deviates from the plan and requires explicit confirmation before proceeding
3. **Given** a trader has added a short put trade, **When** they view the position, **Then** the position shows net quantity reflecting the short option contracts and updated cash balance from premium received
4. **Given** a position contains a short put trade, **When** the trader adds an unrelated trade (e.g., buy stock for different company), **Then** the system warns this is a strategy deviation and tracks it as a deviation from the original plan

---

### User Story 3 - Update Prices for Stock and Option (Priority: P2)

A trader has an open short put position and wants to update current market prices. The trader enters the latest closing price for both the underlying stock and the option contract. The system calculates and displays the current intrinsic value (how much the option is in-the-money) and extrinsic value (time value remaining) of the position. The unrealized P&L is updated to reflect the change in option value since opening.

**Why this priority**: Price updates are essential for tracking position performance and making informed decisions. The intrinsic/extrinsic breakdown provides educational value by showing how time decay and underlying price movement affect option value.

**Independent Test**: Can be fully tested by updating stock and option prices for a position with a short put, verifying intrinsic/extrinsic values are calculated correctly, and confirming P&L reflects the change in option value.

**Acceptance Scenarios**:

1. **Given** a position contains a short put, **When** the trader updates the stock price to $95 and option price to $2.50 for a $100 strike put, **Then** the system displays intrinsic value of $0 (out-of-the-money) and extrinsic value of $2.50 (time value)
2. **Given** a position contains a short put with $100 strike, **When** the trader updates the stock price to $95 and option price to $7.00, **Then** the system displays intrinsic value of $5.00 ($100 - $95) and extrinsic value of $2.00 ($7 - $5)
3. **Given** a trader has multiple trades in a position (stock and option), **When** they update prices, **Then** the price update flow updates all trades in the position with their respective instrument prices
4. **Given** a position contains only option trades, **When** the trader updates prices, **Then** only option prices are required (stock price optional)

---

### User Story 4 - Close Short Put by Buying to Close (Priority: P1)

A trader wants to close their short put position to realize profit or limit loss. The trader adds a trade to buy to close (BTC) the same option contract, specifying the buyback price per contract and trade date. The system validates the trade closes the existing short position, calculates the realized profit/loss (premium received minus premium paid), updates the position status to closed, and changes P&L reporting from unrealized to realized.

**Why this priority**: Closing the position is the culmination of the trade and completes the learning cycle. The transition from unrealized to realized P&L is critical for accurate performance tracking and tax reporting.

**Independent Test**: Can be fully tested by adding a BTC trade for a short put, verifying it closes the position, calculating realized P&L correctly, and confirming the position status changes to closed with realized P&L displayed.

**Acceptance Scenarios**:

1. **Given** a trader has an open short put position (sold for $3.00), **When** they buy to close at $1.00, **Then** the position status changes to closed and realized P&L shows $2.00 profit per contract
2. **Given** a trader has an open short put position (sold for $3.00), **When** they buy to close at $5.00, **Then** the position status changes to closed and realized P&L shows $2.00 loss per contract
3. **Given** a position contains a short put, **When** the trader adds a BTC trade, **Then** the system validates the contract details (strike, expiration, type) match the existing short position
4. **Given** a position is closed via BTC, **When** the trader views the position, **Then** P&L is displayed as "Realized" rather than "Unrealized"

---

### User Story 5 - Handle Short Put Assignment (Priority: P2)

A trader has an open short put position that goes in-the-money at expiration. The option is assigned, meaning the trader is obligated to buy the stock at the strike price. The system records a buy-to-close trade at $0.00 for the option (representing assignment), closes the option position, and automatically creates a new stock position with a cost basis of (strike price - premium received per share). The trader is notified of the assignment and can review the new long stock position.

**Why this priority**: Assignment is a real-world outcome that traders must understand. Handling it correctly ensures accurate P&L tracking and proper cost basis for the resulting stock position, which is critical for future decisions.

**Independent Test**: Can be fully tested by triggering assignment on a short put, verifying the $0 BTC trade is recorded, the option position closes, and a new stock position is created with the correct cost basis.

**Acceptance Scenarios**:

1. **Given** a trader has a short put position (strike $100, sold for $3.00), **When** the option is assigned, **Then** the system adds a BTC trade at $0.00, closes the option position, and creates a new stock position with cost basis of $97.00 ($100 - $3)
2. **Given** an option is assigned, **When** the new stock position is created, **Then** the quantity reflects the contract multiplier (100 shares per contract) and the position is marked as open
3. **Given** an assignment occurs, **When** the trader views their positions, **Then** they see the original short put position marked closed and a new stock position open with the acquired shares
4. **Given** a short put is assigned, **When** the trader views the closed position, **Then** the realized P&L reflects only the option premium received/stock cost basis relationship (not yet realized on the stock position)

---

### User Story 6 - Track Strategy Deviations (Priority: P2)

A trader's position plan specifies a short put strategy, but the trader wants to add a trade that doesn't match this strategy (e.g., buying the underlying stock, selling a different option). When the trader attempts to add the non-conforming trade, the system detects the deviation, displays a clear warning explaining how it differs from the plan, and requires explicit confirmation. Once added, the trade is flagged as a deviation, tracked separately in reporting, and visible in the position detail view.

**Why this priority**: Deviation tracking reinforces behavioral discipline by making traders consciously acknowledge when they're departing from their original plan. This creates learning opportunities and supports the app's mission of developing systematic decision-making.

**Independent Test**: Can be fully tested by creating a short put position plan, then adding non-conforming trades (buying stock, selling different strike), verifying warnings appear, confirmation is required, and deviations are tracked separately in reporting.

**Acceptance Scenarios**:

1. **Given** a position plan for a short put on SPY $100 strike, **When** the trader attempts to buy 100 shares of SPY stock, **Then** the system warns "This trade deviates from your short put strategy. Add anyway?" and requires confirmation
2. **Given** a trader adds a non-conforming trade after confirmation, **When** they view the position detail, **Then** the trade is flagged with a "Deviation from plan" indicator
3. **Given** a position contains multiple trades including deviations, **When** the trader views performance reports, **Then** deviations are listed separately from conforming trades
4. **Given** a trader has added deviation trades, **When** they review the position during daily review, **Then** the system highlights deviations for reflection on why the plan changed

---

### Edge Cases

- What happens when a trader adds a short put trade with a different underlying symbol than the position plan?
- What happens when a trader attempts to close a short put with incorrect contract details (wrong strike or expiration)?
- What happens when a short put position has partial fills (some contracts closed, others remain open)?
- What happens when assignment is recorded but the trader doesn't want the resulting stock position?
- What happens when a trader updates prices for a position containing both stock and option trades?
- What happens when a short put expires worthless (no assignment)? How is this recorded?
- What happens when a trader adds multiple short puts at different strikes or expirations to the same position?
- What happens when the cost basis calculation results in a negative value for the assigned stock position?
- What happens when a trader attempts to add a trade that would create an invalid position state (e.g., more BTC contracts than were sold)?

## Requirements

### Functional Requirements

- **FR-001**: System MUST allow creating a position plan with stock-based price targets and stops
- **FR-002**: System MUST require a journal entry before saving a position plan
- **FR-003**: System MUST make position plans immutable once saved
- **FR-004**: System MUST allow adding trades to a position that can represent either stock or option legs
- **FR-005**: System MUST support option trade types: SELL_TO_OPEN (STO), BUY_TO_CLOSE (BTC), BUY_TO_OPEN (BTO), SELL_TO_CLOSE (STC)
- **FR-006**: System MUST capture option contract details: option_type (PUT/CALL), strike_price, expiration_date, quantity
- **FR-007**: System MUST validate that closing trades match the contract details of the open position
- **FR-008**: System MUST warn when a trade deviates from the position plan strategy
- **FR-009**: System MUST require explicit confirmation before adding deviation trades
- **FR-010**: System MUST track deviations from the original plan separately in reporting
- **FR-011**: System MUST support manual price entry for both stock and option instruments
- **FR-012**: System MUST update all trades in a position when prices are updated
- **FR-013**: System MUST calculate intrinsic value as max(0, strike_price - stock_price) for put options
- **FR-014**: System MUST calculate extrinsic value as option_price - intrinsic_value for options
- **FR-015**: System MUST display intrinsic and extrinsic value breakdown for positions containing options
- **FR-016**: System MUST close a position when net quantity reaches zero after adding a closing trade
- **FR-017**: System MUST change P&L reporting from unrealized to realized when a position closes
- **FR-018**: System MUST record option assignment as a BTC trade at $0.00 price
- **FR-019**: System MUST automatically create a new stock position when an option is assigned
- **FR-020**: System MUST calculate assigned stock cost basis as (strike_price - premium_received_per_share)
- **FR-021**: System MUST multiply option contract quantities by 100 for stock position quantities upon assignment
- **FR-022**: System MUST support positions containing only stock trades, only option trades, or both stock and option trades
- **FR-023**: System MUST maintain FIFO cost basis tracking per instrument type within a position
- **FR-024**: System MUST prevent adding closing trades that exceed the open contract quantity

### Key Entities

- **Position**: An immutable trading plan representing strategic intent. Contains planned price levels (targets, stops) based on underlying stock price, required journal entry documenting thesis, and a list of executed trades. Status is derived from net trade quantity (open/closed). Can contain stock trades, option trades, or both.

- **Trade**: An individual execution record within a position. Can represent either a stock transaction (symbol, quantity, price, action) or an option contract transaction (option_type, strike_price, expiration_date, quantity, price, action). Each trade maintains its own cost basis for FIFO P&L calculation. Option actions include: SELL_TO_OPEN, BUY_TO_CLOSE, BUY_TO_OPEN, SELL_TO_CLOSE.

- **Price Quote**: Current market pricing data for instruments in a position. Contains separate prices for stock and option contracts. For options, records closing price which will be expanded to OHLC in future. Used to calculate unrealized P&L and intrinsic/extrinsic value breakdown.

- **Strategy Deviation**: A record of a trade that does not conform to the position plan. Contains the trade details, deviation type, timestamp, and trader confirmation. Used for behavioral tracking and plan vs. execution analysis.

- **Assignment Event**: The exercise of an option contract at expiration or early exercise. Creates a BTC trade at $0.00 for the option position and triggers creation of a new stock position with cost basis derived from strike price minus net premium received.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Traders can create a stock-based position plan and add a short put trade in under 2 minutes
- **SC-002**: Traders can update prices for both stock and option instruments in a single workflow
- **SC-003**: Intrinsic and extrinsic value calculations are 100% accurate for all option positions
- **SC-004**: All strategy deviations are detected and flagged before confirmation
- **SC-005**: Assignment handling creates new stock positions with correct cost basis 100% of the time
- **SC-006**: P&L transitions from unrealized to realized immediately upon position close
- **SC-007**: Traders can close short put positions (BTC) and view realized profit in under 30 seconds
- **SC-008**: Position status accurately reflects open/closed state based on net quantity
- **SC-009**: Option contract validation prevents 100% of invalid closing trades
- **SC-010**: Deviation tracking is visible in position detail and performance reports

## Assumptions

1. **Single Hybrid Position Model**: Positions will contain a mix of stock and option trades rather than separating them into different position entities. This simplifies the UI while maintaining flexibility for future strategies.

2. **Manual Price Entry**: The application will continue using manual price entry for both stock and option instruments, maintaining the privacy-first approach. No external pricing APIs will be integrated.

3. **Contract Multiplier**: Standard US options contract multiplier of 100 shares per contract is assumed. This affects quantity calculations for assigned positions.

4. **Assignment User-Initiated**: Option assignment will be manually recorded by the trader rather than automatically detected. The trader initiates assignment when notified by their broker.

5. **Immutability of Plan**: The position plan (targets, stops, thesis) remains immutable after creation. Only trades can be added, not plan modifications.

6. **Journal Entry Required**: All position plans and all trades require mandatory journal entries, reinforcing behavioral training.

7. **Future Strategies**: The design must support covered calls (stock + short call) and future multi-leg strategies (spreads, straddles, etc.) through the same position structure.

8. **FIFO Per Instrument**: Cost basis tracking uses FIFO methodology separately for each instrument type (stock vs. each unique option contract) within a position.

9. **Deviation Tracking**: Trades that deviate from the plan are allowed but require explicit confirmation and are tracked separately for learning purposes.

10. **No Auto-Close**: Positions do not auto-close at expiration. Traders must manually record expiration outcomes (assignment or worthless expiration).

## Open Questions

None - all clarifications have been resolved.

## Dependencies

- **Existing Position Entity**: The current position structure must be extended to support option trade types while maintaining backward compatibility with stock-only positions.
- **Existing Trade Entity**: The trade structure must be extended to include option-specific fields (option_type, strike_price, expiration_date) without breaking existing stock trades.
- **Existing Pricing System**: The price update flow must be extended to handle multiple instrument types per position.
- **Existing P&L Calculation**: The P&L calculation system must be extended to support intrinsic/extrinsic breakdown and per-instrument FIFO tracking.
- **Future Work**: This feature must support covered calls as the next option strategy, followed by multi-leg spreads.

## Out of Scope

- **Options Greeks (Delta, Gamma, Theta, Vega)**: Not included in initial implementation. Future consideration for advanced analytics.
- **Implied Volatility Calculation**: Not included in initial implementation. Manual price entry only.
- **Options Spread Strategies**: Vertical spreads, iron condors, butterflies, etc. are deferred to future phases.
- **Auto-Assignment Detection**: No integration with brokers for automatic assignment notification. Manual recording only.
- **Options Chain Display**: No options chain viewer or strategy builder UI. Trades are entered manually.
- **Margin Requirements**: No margin calculation or buying power validation.
- **Tax Reporting**: No tax form generation (1099-B, Schedule D). P&L tracking only.
- **OHLC Prices for Options**: Only closing price is stored initially. OHLC expansion planned for future.
