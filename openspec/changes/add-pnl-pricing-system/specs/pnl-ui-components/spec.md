# P&L UI Components Specification

## ADDED Requirements

### Requirement: PriceUpdateCard Component

The system SHALL provide PriceUpdateCard component for manually updating current market prices with date selection and validation.

#### Scenario: Render price update form

- **WHEN** PriceUpdateCard component is rendered
- **THEN** displays date picker input defaulting to today
- **AND** displays price input field for closing price
- **AND** displays last known price with timestamp if available
- **AND** displays "Update Price" button

#### Scenario: Display last known price

- **WHEN** underlying has existing price record from 2 hours ago
- **THEN** displays "Last: $265.00 on 2024-10-25 (2 hours ago)"
- **AND** helps user see staleness of data

#### Scenario: Submit price update

- **WHEN** user enters price $270.00 for today's date
- **AND** clicks "Update Price" button
- **THEN** calls PriceService.updatePrice() with underlying, date, price
- **AND** displays success message "Price updated!"
- **AND** triggers onPriceUpdated callback to refresh P&L displays

#### Scenario: Validate non-zero price

- **WHEN** user enters price 0
- **AND** attempts to submit
- **THEN** displays error "Price must be positive"
- **AND** does not submit update

#### Scenario: Validate non-negative price

- **WHEN** user enters price -100
- **AND** attempts to submit
- **THEN** displays error "Price must be positive"
- **AND** does not submit update

#### Scenario: Show confirmation dialog for large change

- **WHEN** last known price was $150.00
- **AND** user enters $200.00 (33.3% change)
- **AND** clicks "Update Price"
- **THEN** displays PriceConfirmationDialog
- **AND** shows old price, new price, percent change
- **AND** waits for user confirmation before submitting

#### Scenario: Backdate price entry

- **WHEN** user selects yesterday's date in date picker
- **AND** enters price $265.00
- **AND** submits
- **THEN** creates/updates price record for yesterday
- **AND** does not affect today's price

#### Scenario: Handle update errors

- **WHEN** price update fails due to IndexedDB error
- **THEN** displays error message "Failed to update price. Please try again."
- **AND** does not clear user's input
- **AND** user can retry

---

### Requirement: PriceConfirmationDialog Component

The system SHALL provide confirmation dialog for price changes exceeding 20%.

#### Scenario: Display confirmation dialog

- **WHEN** price change requires confirmation
- **THEN** displays modal dialog with:
  - Title: "Confirm Large Price Change"
  - Last price: "$150.00"
  - New price: "$200.00"
  - Change: "33.3% increase"
  - Message: "Are you sure this price is correct?"
  - "Yes, Update" button
  - "Cancel" button

#### Scenario: Confirm price update

- **WHEN** user clicks "Yes, Update" button
- **THEN** dialog closes
- **AND** price update proceeds
- **AND** PriceHistory record is created/updated

#### Scenario: Cancel price update

- **WHEN** user clicks "Cancel" button
- **THEN** dialog closes
- **AND** price update is cancelled
- **AND** no PriceHistory record is created/updated
- **AND** user input remains in form for correction

---

### Requirement: PnLDisplay Component

The system SHALL provide PnLDisplay component for color-coded profit/loss visualization.

#### Scenario: Display profit with green color

- **WHEN** P&L is +$1,500.00
- **AND** percentage is +10.0%
- **THEN** displays "+$1,500.00 (+10.0%)" in green color (text-green-600)
- **AND** indicates positive performance

#### Scenario: Display loss with red color

- **WHEN** P&L is -$1,000.00
- **AND** percentage is -5.0%
- **THEN** displays "-$1,000.00 (-5.0%)" in red color (text-red-600)
- **AND** indicates negative performance

#### Scenario: Display zero P&L with gray color

- **WHEN** P&L is $0.00
- **THEN** displays "$0.00" in gray color (text-gray-600)
- **AND** indicates break-even position

#### Scenario: Display missing P&L data

- **WHEN** P&L is null (no price data available)
- **THEN** displays "—" in gray color (text-gray-400)
- **AND** indicates missing data

#### Scenario: Format large dollar amounts

- **WHEN** P&L is $15,234.56
- **THEN** displays "+$15,234.56"
- **AND** uses proper decimal formatting

#### Scenario: Responsive sizing

- **WHEN** size prop is "sm"
- **THEN** uses smaller font size appropriate for cards
- **WHEN** size prop is "lg"
- **THEN** uses larger font size appropriate for headers

---

### Requirement: ProgressIndicator Component

The system SHALL provide ProgressIndicator component showing position progress between stop loss and profit target.

#### Scenario: Render progress bar

- **WHEN** ProgressIndicator is rendered
- **AND** stop loss is $240.00
- **AND** profit target is $280.00
- **AND** current price is $265.00
- **THEN** displays horizontal progress bar
- **AND** shows stop loss label on left: "Stop: $240.00"
- **AND** shows profit target label on right: "Target: $280.00"
- **AND** shows progress fill at 62.5% width
- **AND** shows current price marker at 62.5% position

#### Scenario: Color gradient visualization

- **WHEN** progress bar is rendered
- **THEN** fill uses linear gradient from red → yellow → green
- **AND** represents risk (red) to reward (green) spectrum

#### Scenario: Show captured profit percentage

- **WHEN** current price is 62.5% from stop to target
- **THEN** displays text "Captured 62.5% of potential profit"
- **AND** helps user understand position status

#### Scenario: Handle price below stop loss

- **WHEN** current price is $230.00 (below $240.00 stop)
- **THEN** progress percentage is negative
- **AND** marker is positioned before the start of bar
- **AND** displays appropriate warning styling

#### Scenario: Handle price above profit target

- **WHEN** current price is $290.00 (above $280.00 target)
- **THEN** progress percentage exceeds 100%
- **AND** marker is positioned after the end of bar
- **AND** displays appropriate success styling

#### Scenario: Mobile responsive design

- **WHEN** viewed on 414px screen
- **THEN** progress bar is full width
- **AND** labels are readable
- **AND** touch targets are adequately sized

---

### Requirement: PositionCard P&L Integration

The system SHALL update PositionCard component to display real P&L instead of placeholder text.

#### Scenario: Show P&L for position with trades and price

- **WHEN** rendering PositionCard for position with trades
- **AND** price data exists for the underlying
- **THEN** replaces placeholder with PnLDisplay component
- **AND** shows real-time P&L value
- **AND** shows P&L percentage

#### Scenario: Show placeholder for position without price

- **WHEN** rendering PositionCard for position with trades
- **AND** no price data exists for the underlying
- **THEN** displays "—" using PnLDisplay with null value
- **AND** does not show percentage

#### Scenario: Show placeholder for planned position

- **WHEN** rendering PositionCard for position with zero trades
- **THEN** displays "—" using PnLDisplay with null value
- **AND** indicates position is in planning state only

#### Scenario: Update P&L when price changes

- **WHEN** user updates price for underlying
- **THEN** PositionCard re-calculates P&L
- **AND** PnLDisplay updates to show new value
- **AND** color changes if P&L crosses zero

---

### Requirement: PositionDetail P&L Integration

The system SHALL update PositionDetail page to include price update card, P&L display, and progress indicator.

#### Scenario: Display price update section

- **WHEN** viewing PositionDetail page
- **THEN** displays PriceUpdateCard component
- **AND** allows updating price for position's underlying
- **AND** positioned before trade history section

#### Scenario: Display current P&L

- **WHEN** viewing PositionDetail with trades and price data
- **THEN** displays large PnLDisplay at top of page
- **AND** shows total position P&L
- **AND** shows P&L percentage
- **AND** uses prominent styling

#### Scenario: Display progress indicator

- **WHEN** viewing PositionDetail with current price
- **THEN** displays ProgressIndicator component
- **AND** shows visual progress from stop to target
- **AND** positioned near P&L display

#### Scenario: Real-time P&L updates

- **WHEN** user updates price via PriceUpdateCard
- **AND** price update succeeds
- **THEN** P&L display immediately refreshes
- **AND** progress indicator updates position
- **AND** no page reload required

---

### Requirement: Dashboard P&L Summary

The system SHALL update Dashboard page to display portfolio-level P&L summary.

#### Scenario: Display total portfolio P&L

- **WHEN** viewing Dashboard with multiple positions
- **THEN** displays portfolio summary section at top
- **AND** shows total P&L across all positions
- **AND** uses large PnLDisplay component
- **AND** shows count of open positions

#### Scenario: Calculate portfolio P&L

- **WHEN** user has 3 positions:
  - Position 1: +$1,500 P&L
  - Position 2: -$500 P&L
  - Position 3: null P&L (no price data)
- **THEN** total portfolio P&L is +$1,000
- **AND** null P&L positions are excluded from sum

#### Scenario: Show position counts

- **WHEN** viewing Dashboard
- **THEN** displays "Open Positions: 5"
- **AND** displays "Planned: 2"
- **AND** helps user understand portfolio composition

#### Scenario: Batch fetch prices for efficiency

- **WHEN** Dashboard loads with 20 positions
- **THEN** fetches all latest prices in single batch operation
- **AND** calculates all P&Ls in parallel
- **AND** completes in <1 second

---

### Requirement: Loading and Error States

The system SHALL provide appropriate loading and error states for all P&L components.

#### Scenario: Show loading state during price update

- **WHEN** user submits price update
- **AND** update is in progress
- **THEN** displays loading spinner
- **AND** disables submit button
- **AND** shows "Updating..." text

#### Scenario: Show loading state during P&L calculation

- **WHEN** fetching price data for P&L calculation
- **THEN** displays skeleton loader or "Loading P&L..."
- **AND** does not show stale P&L value

#### Scenario: Handle price fetch errors

- **WHEN** fetching price data fails due to IndexedDB error
- **THEN** displays error message "Unable to load price data"
- **AND** shows "—" for P&L value
- **AND** logs error for debugging

#### Scenario: Handle calculation errors

- **WHEN** P&L calculation throws unexpected error
- **THEN** catches error gracefully
- **AND** displays "—" for P&L value
- **AND** logs error for debugging
- **AND** does not crash application

---

### Requirement: Mobile Responsiveness

The system SHALL ensure all P&L UI components are mobile-responsive and work correctly on 414px screens.

#### Scenario: PriceUpdateCard on mobile

- **WHEN** viewing PriceUpdateCard on 414px screen
- **THEN** date picker is full width
- **AND** price input is full width
- **AND** button is full width
- **AND** all elements are touch-friendly (min 44px height)

#### Scenario: ProgressIndicator on mobile

- **WHEN** viewing ProgressIndicator on 414px screen
- **THEN** progress bar spans full available width
- **AND** labels are readable
- **AND** marker is visible and properly positioned

#### Scenario: PnLDisplay on mobile

- **WHEN** viewing PnLDisplay on 414px screen
- **THEN** text size is appropriate for screen
- **AND** values are readable
- **AND** color coding is visible

---

### Requirement: Accessibility

The system SHALL ensure P&L components are accessible to screen readers and keyboard users.

#### Scenario: ARIA labels for P&L values

- **WHEN** screen reader reads PnLDisplay showing +$1,500
- **THEN** announces "Profit: $1,500"
- **WHEN** screen reader reads PnLDisplay showing -$500
- **THEN** announces "Loss: $500"

#### Scenario: Keyboard navigation for price form

- **WHEN** user navigates PriceUpdateCard with keyboard
- **THEN** can tab to date picker
- **AND** can tab to price input
- **AND** can tab to submit button
- **AND** can press Enter to submit

#### Scenario: Color contrast for P&L values

- **WHEN** displaying green P&L (profit)
- **THEN** color contrast ratio meets WCAG AA standard (≥4.5:1)
- **WHEN** displaying red P&L (loss)
- **THEN** color contrast ratio meets WCAG AA standard (≥4.5:1)

#### Scenario: Focus indicators

- **WHEN** keyboard user focuses on interactive elements
- **THEN** visible focus indicator is displayed
- **AND** focus order is logical
