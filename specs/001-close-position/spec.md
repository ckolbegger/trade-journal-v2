# Feature Specification: Position Closing via Trade Execution

**Feature Branch**: `001-close-position`
**Created**: 2025-11-09
**Status**: Draft
**Input**: User description: "Implement closing a position by adding a closing trade"

## Clarifications

### Session 2025-11-09

- Q: What happens when a trader tries to sell more shares than they currently hold in the position? → A: Prevent trade save with immediate inline validation showing current open quantity. If trader intends to reverse position (oversell), they must first close existing position, then create new position for excess quantity.
- Q: What happens if the trader closes the journal entry form without saving or explicitly skipping? → A: Treat as "Skip for Daily Review" - trade remains unjournaled
- Q: What happens if a trader records a closing trade with price of $0 or negative price? → A: Allow $0 for valid scenarios (expired options), but prevent negative prices
- Q: What happens if a trader has deferred multiple trade journals and tries to skip daily review? → A: Allow skip but display warning showing count of unjournaled trades requiring acknowledgment
- Q: How does the system prioritize unjournaled closing trades vs other daily review items? → A: Unjournaled trades appear first before other daily review items

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Complete Position Exit (Priority: P1)

A trader has an open position they want to fully close. They record a sell trade that matches their entire position quantity, triggering automatic position closure with plan vs execution analysis for learning.

**Why this priority**: Core functionality for the complete trading lifecycle. Without the ability to close positions, traders cannot complete the plan-execute-review learning cycle that is central to the app's behavioral training mission.

**Independent Test**: Can be fully tested by creating an open position with a single entry trade, then adding an exit trade for the full quantity. The position should automatically transition to closed status and display plan vs execution comparison.

**Acceptance Scenarios**:

1. **Given** an open position with 100 shares at $50 average cost, **When** trader records a sell trade for 100 shares at $55, **Then** position status changes to "Closed", realized P&L shows +$500, and plan vs execution comparison is displayed
2. **Given** an open position with multiple entry trades (scale-in), **When** trader records a sell trade that exits the entire net quantity, **Then** FIFO cost basis calculation matches oldest entry trades first, position closes, and complete trade history is preserved
3. **Given** a closed position, **When** trader views the position details, **Then** the closing trade is clearly marked, final P&L is calculated, and plan vs actual analysis shows target vs achieved exit price

---

### User Story 2 - Partial Position Exit (Priority: P2)

A trader wants to reduce position size by selling part of their holdings while keeping the position open. This supports risk management strategies like "taking profits on half" while letting the remainder run.

**Why this priority**: Enables professional-level position management and risk reduction strategies. Less critical than P1 because traders can still function with all-or-nothing exits, but important for habit formation around disciplined profit-taking.

**Independent Test**: Can be fully tested by creating an open position with 100 shares, recording a partial exit for 50 shares, and verifying the position remains open with updated quantity and realized P&L tracking.

**Acceptance Scenarios**:

1. **Given** an open position with 100 shares at $50 average cost, **When** trader records a sell trade for 50 shares at $55, **Then** position remains open with 50 shares remaining, realized P&L shows +$250, unrealized P&L continues for remaining 50 shares
2. **Given** an open position with 100 shares entered at different prices (e.g., 50 @ $48, 50 @ $52), **When** trader sells 50 shares at $55, **Then** FIFO matching applies (sells the $48 batch first), realized P&L reflects $350 gain, remaining position has $52 cost basis
3. **Given** a position with partial exit history, **When** trader views position details, **Then** all entry and exit trades are listed with clear distinction, running total of realized vs unrealized P&L is shown

---

### User Story 3 - Closing Trade Journal Workflow (Priority: P1)

When recording a closing trade (full or partial exit), the trade is saved first (non-transaction save), then a journal entry form opens configured for exit reflection. The trader can either complete the journal immediately or defer it to the daily review process, maintaining flexibility while ensuring eventual journaling compliance.

**Why this priority**: Tied for P1 importance because this workflow matches the established position opening pattern, providing consistency across the app. Mandatory journaling (either immediate or deferred to daily review) is a constitutional principle (Behavioral Training Over Features), making this workflow central to the app's value proposition.

**Independent Test**: Can be fully tested by recording a closing trade, verifying the trade saves immediately, then confirming the journal entry form opens with exit-focused prompts and options to "Save Journal Now" or "Skip for Daily Review".

**Acceptance Scenarios**:

1. **Given** trader completes closing trade details (quantity, price, date), **When** they save the trade, **Then** trade is immediately persisted and journal entry form opens configured for trade execution reflection
2. **Given** journal entry form is open after closing trade save, **When** trader writes exit reflection and clicks "Save Journal Now", **Then** journal entry is linked to the closing trade and both are marked as journaled
3. **Given** journal entry form is open after closing trade save, **When** trader clicks "Skip for Daily Review", **Then** trade is marked as requiring journal entry and will appear in daily review workflow
4. **Given** a closing trade without journal entry, **When** trader performs daily review, **Then** the unjournaled trade appears in review queue with exit-focused journal prompts
5. **Given** a closed position with all trades journaled, **When** trader reviews the position history, **Then** all journal entries (plan, entry trades, exit trades) are accessible in chronological order for learning analysis

---

### Edge Cases

- **Overselling Prevention**: When trader attempts to exit more shares than currently held, system prevents save with inline validation showing current open quantity and error message. Position reversal (going from long to short or vice versa) requires two separate actions: (1) close existing position completely, (2) create new position for opposite direction.
- **Journal Form Closure Without Choice**: If trader closes journal entry form without explicitly clicking "Save Journal Now" or "Skip for Daily Review" (e.g., navigates away, closes browser tab), treat as implicit "Skip for Daily Review" - trade remains unjournaled and appears in daily review queue.
- **Zero and Negative Price Validation**: System allows exit trade price of $0 to support valid scenarios (expired worthless options, gifts, transfers) but prevents negative prices with inline validation error message.
- **Skipping Daily Review with Unjournaled Trades**: When trader attempts to skip daily review with pending unjournaled trades, system displays warning showing count of unjournaled trades and requires explicit acknowledgment before allowing skip. Unjournaled trades persist and will appear in next daily review session.
- **Daily Review Prioritization**: Unjournaled trades (both entry and exit) appear first in daily review workflow before other review items (open positions, price updates), ensuring timely reflection while memory is fresh.
- **Multiple Partial Exits**: System handles multiple partial exits by applying FIFO cost basis to each exit sequentially. Each partial exit reduces open quantity and generates realized P&L. Final closing trade (when net quantity reaches zero) triggers position closure and plan vs execution comparison.
- **Scale-In Positions with Multiple Entry Prices**: When closing trades are recorded against positions with multiple entry trades at different prices, FIFO matching automatically applies oldest entry trades first for cost basis calculation, ensuring accurate realized P&L reporting that matches brokerage statements.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow traders to record exit trades (sells) against open positions
- **FR-002**: System MUST save exit trade immediately upon completion (non-transaction save) before journal entry
- **FR-003**: System MUST automatically open journal entry form after exit trade save, configured for trade execution reflection
- **FR-004**: System MUST provide "Save Journal Now" and "Skip for Daily Review" options in the journal entry form; if form is closed without explicit choice, treat as implicit skip
- **FR-005**: System MUST link journal entries to trades when saved immediately, or leave trade without journal entry when deferred
- **FR-006**: System MUST present unjournaled exit trades during daily review workflow for journal completion, prioritizing unjournaled trades first before other review items
- **FR-016**: System MUST display warning with count of unjournaled trades and require explicit acknowledgment when trader attempts to skip daily review with pending unjournaled trades
- **FR-007**: System MUST calculate FIFO cost basis when matching exit trades to entry trades
- **FR-008**: System MUST automatically detect when net position quantity reaches zero and transition position status to "Closed"
- **FR-009**: System MUST preserve all trade history (entries and exits) as immutable records once saved
- **FR-010**: System MUST calculate and display both realized P&L (from closed trades) and unrealized P&L (from remaining open quantity)
- **FR-011**: System MUST validate that exit quantity does not exceed current open quantity for the position with inline validation before save, displaying current open quantity and preventing overselling
- **FR-015**: System MUST validate that exit trade price is non-negative (>= $0), allowing $0 for valid scenarios but preventing negative prices
- **FR-012**: System MUST display plan vs execution comparison when a position is fully closed (target exit price vs actual average exit price)
- **FR-013**: System MUST maintain separate cost basis tracking per instrument type (if position includes options contracts)
- **FR-014**: System MUST link journal entries to their corresponding exit trades for future review

### Assumptions

- Exit trades are always "sell" type transactions (matching the entry "buy" pattern)
- Closing trades use the same trade data model as entry trades (quantity, price, timestamp, journal status flag)
- The journal workflow for closing trades matches the position opening pattern: save trade first, then prompt for journal with option to defer
- Journal entry type for exit trades aligns with existing journal type taxonomy (e.g., "TRADE_EXECUTION" type or similar)
- Traders who defer journaling are expected to complete it during daily review (not enforced immediately but flagged for review)
- FIFO matching happens automatically without user intervention or selection of specific lots
- Position closing triggers immediate display of plan vs execution analysis (no delayed or separate view)
- Journal entry prompts for closing trades will focus on execution decision-making (why exit now, target vs actual, what was learned)
- Daily review workflow already exists and will include unjournaled exit trades (determined by checking which trades lack linked journal entries)

### Key Entities

- **Trade**: Individual execution record with type (buy/sell), quantity, price, timestamp, and optional linked journal entry. Exit trades are distinguished by "sell" type. Trades without linked journal entries are considered unjournaled.
- **Position**: Contains immutable trade plan and status (open/closed) derived from net quantity calculation across all trades. Status automatically transitions to "Closed" when net quantity reaches zero.
- **Journal Entry**: Reflection text linked to specific trade (entry or exit). Can be created immediately after trade save or deferred to daily review. Exit-focused journal entries prompt for execution decision rationale and learning.
- **FIFO Cost Basis Tracking**: Matches exit trades against oldest entry trades first to calculate realized P&L. Maintains running record of which entry lots have been fully or partially exited.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Traders can record and save an exit trade in under 30 seconds (excluding optional journal entry time)
- **SC-002**: Journal entry form appears immediately (within 1 second) after exit trade save with exit-focused prompts
- **SC-003**: Traders have clear choice to complete journal immediately or defer to daily review on every exit trade
- **SC-004**: 100% of exit trades are eventually linked to journal entries (enforced through daily review workflow)
- **SC-005**: FIFO cost basis calculations produce results matching standard brokerage reporting for all test scenarios
- **SC-006**: Position status automatically transitions to "Closed" within 1 second of recording final exit trade
- **SC-007**: Traders can view complete trade history (all entries and exits) with realized vs unrealized P&L breakdown and journal status for any position
- **SC-008**: Plan vs execution comparison displays immediately upon position closure showing target exit price vs actual average exit price
- **SC-009**: System prevents invalid exit quantities (exceeding open position) 100% of the time with clear error messaging
- **SC-010**: Daily review workflow includes all unjournaled trades for journal completion
