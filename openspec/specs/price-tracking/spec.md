# price-tracking Specification

## Purpose
TBD - created by archiving change add-pnl-pricing-system. Update Purpose after archive.
## Requirements
### Requirement: Manual Price Management with OHLC Structure

The system SHALL provide manual price tracking using OHLC (Open/High/Low/Close) data structure for each underlying instrument, stored per date with a unique constraint on `[underlying, date]`.

#### Scenario: Create new price record

- **WHEN** user updates price for an underlying on a specific date
- **AND** no price record exists for that underlying+date combination
- **THEN** system creates new PriceHistory record with OHLC fields
- **AND** stores the close price as provided
- **AND** auto-fills open, high, low with close value if not provided
- **AND** stores timestamp in updated_at field

#### Scenario: Update existing price record

- **WHEN** user updates price for an underlying on a specific date
- **AND** a price record already exists for that underlying+date combination
- **THEN** system overwrites the existing record
- **AND** latest update timestamp is stored

#### Scenario: Simple price entry (Phase 1A)

- **WHEN** user enters only "current price" value
- **THEN** system sets close = user input
- **AND** system auto-fills open = close
- **AND** system auto-fills high = close
- **AND** system auto-fills low = close

---

### Requirement: Underlying-Based Pricing

The system SHALL store one price per underlying instrument (stock symbol or OCC option symbol) per date, not per position or trade.

#### Scenario: Multiple positions with same underlying

- **WHEN** user has 3 TSLA positions
- **AND** user updates TSLA price to $265.00
- **THEN** all 3 TSLA positions use the same price for P&L calculations
- **AND** only one price record is stored in database

#### Scenario: Stock symbol format (Phase 1A)

- **WHEN** recording price for stock trade
- **THEN** underlying is the stock symbol (e.g., "AAPL", "TSLA", "NVDA")

#### Scenario: OCC symbol format (Phase 3+)

- **WHEN** recording price for option trade
- **THEN** underlying is the OCC symbol (21 characters)
- **AND** format is "Symbol(6) + YYMMDD + C/P + Strike(8)"
- **AND** example: "AAPL  250117C00150000" for AAPL Jan 17, 2025 $150 Call

---

### Requirement: Price Retrieval Operations

The system SHALL provide efficient queries for retrieving price data by underlying and date.

#### Scenario: Get latest price for underlying

- **WHEN** requesting latest price for "AAPL"
- **THEN** system returns most recent PriceHistory record ordered by date descending
- **AND** returns null if no prices exist

#### Scenario: Get price for specific date

- **WHEN** requesting price for "AAPL" on "2024-10-25"
- **THEN** system returns PriceHistory record matching that underlying and date
- **AND** returns null if no record exists

#### Scenario: Get price history for visualization

- **WHEN** requesting price history for "AAPL"
- **AND** specifying limit of 30 records
- **THEN** system returns last 30 PriceHistory records ordered by date descending

---

### Requirement: Price Validation

The system SHALL validate price updates and require user confirmation for large price changes exceeding 20%.

#### Scenario: Price change within 20%

- **WHEN** user updates AAPL price from $150.00 to $165.00 (10% change)
- **THEN** system allows update without confirmation
- **AND** creates/updates price record immediately

#### Scenario: Price change exceeds 20%

- **WHEN** user updates AAPL price from $150.00 to $200.00 (33.3% change)
- **THEN** system requires user confirmation before proceeding
- **AND** displays message: "Price changed 33.3% from last update. Confirm?"
- **AND** shows old price ($150.00) and new price ($200.00)
- **AND** only creates/updates record after user confirms

#### Scenario: First price entry (no validation)

- **WHEN** user enters price for underlying with no existing price records
- **THEN** system allows update without confirmation
- **AND** no percent change validation is performed

#### Scenario: Prevent zero or negative prices

- **WHEN** user attempts to enter price of 0 or negative value
- **THEN** system rejects the update
- **AND** displays error message: "Price must be positive"

---

### Requirement: Backdating Support

The system SHALL allow users to enter prices for past dates, with default date picker set to today.

#### Scenario: Default to today's date

- **WHEN** user opens price update form
- **THEN** date picker defaults to today's date
- **AND** user can submit without changing date

#### Scenario: Backdate price entry

- **WHEN** user selects yesterday's date in date picker
- **AND** enters price for that date
- **THEN** system creates/updates PriceHistory record for yesterday
- **AND** does not affect today's price record

#### Scenario: Correct historical price

- **WHEN** user entered wrong price yesterday
- **AND** user backdates to yesterday and enters correct price
- **THEN** system overwrites yesterday's incorrect price record
- **AND** timestamp reflects when correction was made

---

### Requirement: Data Model

The system SHALL implement PriceHistory entity with OHLC structure and IndexedDB storage.

#### Scenario: PriceHistory data structure

- **WHEN** PriceHistory record is created
- **THEN** it contains the following fields:
  - id: string (UUID)
  - underlying: string (stock symbol or OCC option symbol)
  - date: string (YYYY-MM-DD format)
  - open: number (opening price)
  - high: number (highest price)
  - low: number (lowest price)
  - close: number (closing price, used for all P&L calculations)
  - updated_at: Date (timestamp when user entered/updated)

#### Scenario: IndexedDB object store

- **WHEN** application initializes database
- **THEN** price_history object store exists
- **AND** primary key is id field
- **AND** index exists on underlying field
- **AND** index exists on date field
- **AND** compound unique index exists on [underlying, date]

#### Scenario: Close price for calculations

- **WHEN** calculating P&L or performing any price-based computation
- **THEN** system MUST use the close field from PriceHistory
- **AND** system SHALL NOT use open, high, or low fields for P&L calculations

---

### Requirement: Batch Price Operations

The system SHALL provide efficient batch operations for fetching multiple latest prices.

#### Scenario: Get all latest prices for dashboard

- **WHEN** dashboard needs prices for 20 different underlyings
- **THEN** system provides getAllLatestPrices() method
- **AND** returns Map<string, PriceHistory> with one entry per underlying
- **AND** each entry contains the most recent price for that underlying
- **AND** operation completes in single database transaction for efficiency

