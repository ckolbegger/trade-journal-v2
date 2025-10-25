# P&L Calculation Specification

## ADDED Requirements

### Requirement: Trade-Level P&L Calculation

The system SHALL calculate unrealized profit/loss (P&L) for individual trades using current market price from PriceHistory.

#### Scenario: Buy trade with profit

- **WHEN** calculating P&L for buy trade
- **AND** trade execution price was $150.00
- **AND** trade quantity was 100 shares
- **AND** current market price is $165.00
- **THEN** unrealized P&L is ($165.00 - $150.00) × 100 = $1,500.00

#### Scenario: Buy trade with loss

- **WHEN** calculating P&L for buy trade
- **AND** trade execution price was $150.00
- **AND** trade quantity was 100 shares
- **AND** current market price is $140.00
- **THEN** unrealized P&L is ($140.00 - $150.00) × 100 = -$1,000.00

#### Scenario: Sell trade has zero unrealized P&L

- **WHEN** calculating P&L for sell trade
- **THEN** unrealized P&L is $0.00
- **AND** sell trades have already realized their P&L

#### Scenario: Missing price data

- **WHEN** calculating P&L for trade
- **AND** no PriceHistory exists for the underlying
- **THEN** P&L calculation is skipped
- **AND** trade does not contribute to position P&L

---

### Requirement: Position-Level P&L Aggregation

The system SHALL calculate total position P&L by summing all trade-level P&L values within the position.

#### Scenario: Single buy trade position

- **WHEN** position has one buy trade for 100 shares at $150.00
- **AND** current price is $165.00
- **THEN** position P&L is $1,500.00

#### Scenario: Multiple trades in same underlying

- **WHEN** position has buy trade 1: 50 shares at $150.00
- **AND** position has buy trade 2: 50 shares at $160.00
- **AND** current price is $170.00
- **THEN** trade 1 P&L is ($170 - $150) × 50 = $1,000
- **AND** trade 2 P&L is ($170 - $160) × 50 = $500
- **AND** position P&L is $1,000 + $500 = $1,500

#### Scenario: Mixed buy and sell trades

- **WHEN** position has buy trade: 100 shares at $150.00
- **AND** position has sell trade: 50 shares at $165.00
- **AND** current price is $170.00
- **THEN** buy trade P&L is ($170 - $150) × 100 = $2,000
- **AND** sell trade P&L is $0 (already realized)
- **AND** position P&L is $2,000

#### Scenario: Empty position (no trades)

- **WHEN** position has zero trades (planned position)
- **THEN** position P&L is null
- **AND** UI displays "—" placeholder

---

### Requirement: P&L Percentage Calculation

The system SHALL calculate percentage gain/loss relative to cost basis.

#### Scenario: Percentage gain calculation

- **WHEN** position P&L is $1,500
- **AND** total cost basis is $15,000
- **THEN** P&L percentage is 10.0%

#### Scenario: Percentage loss calculation

- **WHEN** position P&L is -$1,000
- **AND** total cost basis is $20,000
- **THEN** P&L percentage is -5.0%

#### Scenario: Zero cost basis handling

- **WHEN** calculating P&L percentage
- **AND** cost basis is $0
- **THEN** percentage is 0%
- **AND** system does not throw division by zero error

---

### Requirement: Price Map Helper

The system SHALL provide helper function to fetch all prices needed for a position's P&L calculation.

#### Scenario: Single underlying position (Phase 1A)

- **WHEN** position has trades all with same underlying "AAPL"
- **THEN** getPriceMapForPosition returns Map with one entry
- **AND** entry key is "AAPL"
- **AND** entry value is latest PriceHistory for AAPL

#### Scenario: Multi-underlying position (Phase 3+)

- **WHEN** position has trade with underlying "AAPL  " (stock)
- **AND** position has trade with underlying "AAPL  250117C00150000" (option)
- **THEN** getPriceMapForPosition returns Map with two entries
- **AND** fetches price for each unique underlying

#### Scenario: Missing price for one underlying

- **WHEN** position has trades with underlyings "AAPL" and "TSLA"
- **AND** price exists for AAPL but not for TSLA
- **THEN** price map contains entry for AAPL only
- **AND** TSLA trades are skipped in P&L calculation

---

### Requirement: Progress Calculation

The system SHALL calculate position progress between stop loss and profit target.

#### Scenario: Position between stop and target

- **WHEN** position stop loss is $240.00
- **AND** position profit target is $280.00
- **AND** current price is $265.00
- **THEN** range is $280 - $240 = $40
- **AND** current from stop is $265 - $240 = $25
- **AND** percentage progress is ($25 / $40) × 100 = 62.5%
- **AND** distance to stop is $25
- **AND** distance to target is $15
- **AND** captured profit is 62.5%

#### Scenario: Price below stop loss

- **WHEN** position stop loss is $240.00
- **AND** position profit target is $280.00
- **AND** current price is $230.00
- **THEN** percentage progress is negative
- **AND** distance to stop is -$10 (below stop)

#### Scenario: Price above profit target

- **WHEN** position stop loss is $240.00
- **AND** position profit target is $280.00
- **AND** current price is $290.00
- **THEN** percentage progress exceeds 100%
- **AND** distance to target is -$10 (exceeded target)

---

### Requirement: Calculation Performance

The system SHALL compute P&L calculations efficiently to support real-time UI updates.

#### Scenario: Single position calculation performance

- **WHEN** calculating P&L for one position
- **THEN** calculation completes in <100ms
- **AND** includes fetching price data from IndexedDB

#### Scenario: Dashboard batch calculation

- **WHEN** calculating P&L for 20 positions
- **AND** using batched price fetches
- **THEN** total calculation time is <1000ms
- **AND** dashboard renders without noticeable lag

---

### Requirement: On-Demand Calculation

The system SHALL calculate P&L on-demand when rendering components, not store pre-calculated values.

#### Scenario: Always current calculations

- **WHEN** rendering P&L display component
- **THEN** P&L is calculated using current price data
- **AND** no stale cached P&L values are used
- **AND** price updates immediately reflect in P&L

#### Scenario: No database storage of P&L

- **WHEN** P&L is calculated
- **THEN** result is not stored in Position entity
- **AND** result is not stored in any IndexedDB table
- **AND** calculation is performed fresh for each render
