# Strategy-Specific UI Patterns Analysis

This document outlines the key UI patterns and differences observed across various options strategies in the position detail views.

## Common Elements Across All Strategies

1. **Immutable Trade Plan Display**
   - Lock icon and warning notice emphasizing that plans cannot be modified
   - Clear separation between planned strategy and actual executions
   - Consistent presentation of risk metrics and position thesis

2. **Manual Price Update System**
   - Dedicated card at the top for price input
   - Real-time P&L calculation upon update
   - Visual feedback for successful updates

3. **Progress Visualization**
   - Color-coded progress indicators showing position relative to key levels
   - Gradient performance headers reflecting profit/loss status

4. **Trade History Section**
   - FIFO-ordered list of all executions
   - Clear BUY/SELL indicators with directional coloring

5. **Integrated Journaling**
   - Journal entries embedded directly in position detail views
   - Multiple entry types (Position Plan, Progress Update, etc.)

## Strategy-Specific Patterns

### Long Stock Position (04-position-detail-view.html)
- **Simple dual-input pricing**: Stock price only
- **Single breakeven point**: Stop loss level
- **Direct P&L calculation**: (Current Price - Avg Cost) × Quantity
- **Risk metric focus**: Distance to stop loss and current risk amount

### Covered Call (04a-covered-call-detail-view.html)
- **Dual pricing model**: Separate inputs for stock price and call option value
- **Option leg display**: Clear visualization of the short call component
- **Pricing breakdown section**: Shows stock and option components separately
- **Specialized risk metrics**: Distance to strike and time decay benefit
- **Progress bar focus**: Stock price progression relative to cost basis and strike

### Bull Put Spread (04b-bull-put-spread-detail-view.html)
- **Single pricing model**: Overall spread value
- **Leg visualization**: Clear display of short and long put legs with color coding
- **Dual breakeven points**: Upper and lower breakeven levels
- **Spread-specific metrics**: Max profit, max loss, breakeven prices
- **Progress bar focus**: Stock price position between short and long strikes
- **Performance header adaptation**: Shows stock price rather than direct P&L

### Long Call Butterfly (04c-long-call-butterfly-detail-view.html)
- **Range-based progress visualization**: Shows optimal profit zone between breakeven points
- **Leg structure display**: Three-tier visualization for long-short-long call structure
- **Specialized metrics**: Breakeven points, max profit zone, center strike focus
- **Range-based risk metrics**: Distance to optimal zone rather than simple directional risk
- **Complex P&L model**: Non-linear payoff structure visualization

### Calendar Spread (04d-call-calendar-spread-detail-view.html)
- **Time-based visualization**: DTE indicators for both short and long options
- **Optimal zone status**: Specialized indicator showing when stock is at/ near strike
- **Leg time differentiation**: Clear display of different expiration dates
- **Time decay focus**: Emphasis on differential decay rates between legs
- **Two-input model**: Stock price and overall calendar spread value

## Key Design Principles Demonstrated

1. **Information Architecture Adaptation**
   - More complex strategies have more detailed leg displays
   - Risk metrics change based on strategy type (e.g., breakeven points vs stop loss)

2. **Visual Hierarchy Adjustments**
   - Color coding varies by strategy (red/green for directional vs zone-based for range strategies)
   - Progress indicators adapt to strategy-specific optimal zones

3. **Pricing Model Flexibility**
   - Simple strategies use basic pricing inputs
   - Complex strategies require multiple or specialized pricing inputs
   - Real-time calculation models adapt to strategy payoff structures

4. **Educational Context Integration**
   - Status indicators explain strategy-specific conditions
   - Progress visualizations show strategy-optimal scenarios
   - Risk metrics framed around strategy-specific considerations

## Implementation Implications

1. **Component Design**
   - Need flexible leg display components that can handle 1-4 legs
   - Pricing update components must support strategy-specific input models
   - Progress visualization components should be adaptable to different payoff structures

2. **Calculation Engine**
   - P&L calculations must be strategy-aware
   - Risk metrics calculations need to be dynamic based on position structure
   - Time-based calculations for strategies with multiple expirations

3. **Data Model**
   - Position entities need to store strategy-specific metadata
   - Trade execution records must capture expiration dates and strike prices
   - Journal entries should include strategy context

4. **User Experience**
   - Strategy selection during position creation should inform UI layout
   - Help text and educational content should be strategy-specific
   - Visual feedback should guide users toward strategy-optimal conditions