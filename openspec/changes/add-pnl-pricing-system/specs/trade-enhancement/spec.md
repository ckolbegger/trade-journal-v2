# Trade Enhancement Specification

## ADDED Requirements

### Requirement: Trade Underlying Field

The system SHALL add `underlying` field to Trade interface to identify the specific instrument being traded, supporting future multi-leg option strategies.

#### Scenario: Trade interface includes underlying

- **WHEN** Trade entity is defined
- **THEN** it includes `underlying: string` field
- **AND** field identifies stock symbol or OCC option symbol

#### Scenario: Stock trade underlying (Phase 1A)

- **WHEN** creating trade for stock position
- **THEN** underlying equals position.symbol
- **AND** example: underlying = "AAPL" for Apple stock

#### Scenario: Option trade underlying (Phase 3+)

- **WHEN** creating trade for option position
- **THEN** underlying is OCC symbol format
- **AND** example: underlying = "AAPL  250117C00150000" for AAPL Jan 17, 2025 $150 Call

---

### Requirement: Auto-Population in Phase 1A

The system SHALL automatically populate the `underlying` field from position.symbol when creating stock trades in Phase 1A.

#### Scenario: TradeService auto-populates underlying

- **WHEN** TradeService creates new trade
- **AND** position symbol is "TSLA"
- **THEN** trade.underlying is set to "TSLA"
- **AND** user does not manually enter this field

#### Scenario: TradeExecutionForm does not expose field

- **WHEN** user fills out trade execution form in Phase 1A
- **THEN** underlying field is not displayed in UI
- **AND** field is auto-populated behind the scenes
- **AND** user only sees quantity, price, date, trade type

---

### Requirement: Backward Compatibility

The system SHALL support existing trades without `underlying` field through computed values.

#### Scenario: Load existing trade without underlying

- **WHEN** loading trade from database that was created before this change
- **AND** trade does not have `underlying` field
- **THEN** system computes underlying as position.symbol
- **AND** P&L calculations work correctly
- **AND** no error is thrown

#### Scenario: New trades require underlying

- **WHEN** creating new trade after this change is deployed
- **THEN** system validates that `underlying` field is present
- **AND** rejects trade creation if underlying is missing
- **AND** displays error: "Trade must have underlying field"

---

### Requirement: Validation

The system SHALL validate the `underlying` field for new trades.

#### Scenario: Valid stock symbol format

- **WHEN** validating trade with underlying "AAPL"
- **THEN** validation passes
- **AND** trade can be created

#### Scenario: Valid OCC option symbol format (Phase 3+)

- **WHEN** validating trade with underlying "AAPL  250117C00150000"
- **THEN** validation passes
- **AND** trade can be created

#### Scenario: Empty underlying rejected

- **WHEN** attempting to create trade with empty underlying ""
- **THEN** validation fails
- **AND** error message: "Underlying cannot be empty"

---

### Requirement: Price Lookup Integration

The system SHALL use the `underlying` field to look up current prices from PriceHistory for P&L calculations.

#### Scenario: Price lookup for stock trade

- **WHEN** calculating P&L for trade with underlying "AAPL"
- **THEN** system fetches latest PriceHistory where underlying = "AAPL"
- **AND** uses close price from that record

#### Scenario: Price lookup for option trade (Phase 3+)

- **WHEN** calculating P&L for trade with underlying "AAPL  250117C00150000"
- **THEN** system fetches latest PriceHistory where underlying = "AAPL  250117C00150000"
- **AND** uses close price from that record
- **AND** does NOT use stock price for option P&L

#### Scenario: Multiple trades with different underlyings (Phase 3+)

- **WHEN** position has trade 1 with underlying "AAPL  " (stock)
- **AND** position has trade 2 with underlying "AAPL  250117C00150000" (option)
- **THEN** system fetches two different PriceHistory records
- **AND** calculates P&L for each trade independently
- **AND** sums to get position P&L
