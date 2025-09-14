# Trading Position Tracker & Journal App Specification

## Product Vision & User Profile

### Target Users
- **Primary**: Retail traders with stock and options experience who have not yet achieved consistent profitability
- **Secondary**: Experienced stock traders ready to explore options trading
- **Tertiary**: Beginners seeking to learn systematic trading discipline

### Core Vision
A standalone analytical tool that combines trade tracking with behavioral training to help traders develop consistent profitability through systematic decision-making, disciplined execution, and enhanced self-awareness. The app emphasizes learning and habit formation over complex analytics, positioning itself as a holistic educational tool rather than competing with subscription-based platforms.

### Key Principles
- **Learning-focused**: Support traders progressing from simple to complex strategies
- **Behavioral training**: Enforce discipline through immutable planning and mandatory journaling
- **Self-awareness**: Help traders recognize and improve their decision-making patterns
- **Privacy-first**: Completely personal tool with no external data sharing
- **Free and accessible**: No subscription model, designed to complement rather than compete with paid tools

## Core Purpose
A standalone analytical tool to track actual stock and option positions, combining trade execution tracking, scenario analysis, behavioral pattern recognition, and integrated journaling for swing trades (days/weeks) to long-term holdings (years).

## Key Features Overview

### 1. Trade Entry & Management
- **Manual trade entry** with step-by-step strategy builder
- **Mandatory trade journaling** - every trade entry requires an accompanying journal entry
- **Incomplete position support** - track planned strategies as you leg in over time
- **Trade plan documentation** - capture targets, stops, thesis, and time horizon
- **Execution tracking** - compare actual vs. planned execution

### 2. Position Analysis & Risk Management
- **Real-time P&L calculation** based on current market prices
- **Risk/Reward visualization** - current risk vs. remaining profit potential
- **Strategy-specific position detail views** - adaptive UI for different options strategies
- **Manual price update system** - real-time pricing interface for all position views
- **Multi-leg position visualization** - clear display of complex options strategies
- **Progress tracking indicators** - visual progress bars showing position relative to targets
- **Extrinsic value tracking** - separate intrinsic from extrinsic option value
- **Historical extrinsic charts** - visualize how price movements affected option premiums over holding period

### 3. Daily Review Process
- **Position prioritization algorithm** - automatically ranks open positions by urgency of attention needed
- **Volatility-based sorting** - positions with highest daily movements weighted by position size get priority
- **Guided review mode** - step-by-step review process for beginning traders
- **Review habit tracking** - monitor consistency and patterns in daily review behavior
- **Streamlined journaling integration** - easy journal entry opportunities during position reviews

### 4. Scenario Analysis Engine
- **Configurable stress testing** - model position behavior under various market moves
- **Multi-level analysis** - up to 5 customizable percentage moves (up/down)
- **Portfolio aggregation** - stack individual position scenarios for total portfolio impact
- **Trade-specific parameters** - different defaults for swing vs. long-term positions

### 5. Integrated Journaling System
- **Mandatory trade journaling** - every trade entry requires an accompanying journal entry
- **Position-specific entries** - tie thoughts to specific trades chronologically
- **Market event journaling** - capture reactions to broader market moves
- **Behavioral pattern tracking** - identify decision-making patterns over time

### 6. Performance Analytics
- **Strategy-based win/loss ratios** - performance by trade type
- **Plan deviation analysis** - track when and why you deviated from original plans
- **Risk/reward pattern recognition** - identify behavioral tendencies

## Detailed Feature Specifications

### Options Strategy Detail Architecture

**Purpose:** Provide strategy-specific position management interfaces that adapt to the complexity and requirements of different options strategies.

**Core Requirements:**
1. **Strategy-Adaptive UI Components**
   - Position detail views that automatically adapt based on strategy type
   - Flexible leg display components supporting 1-4 option legs
   - Strategy-specific risk metrics and progress indicators
   - Educational context integration for each strategy type

2. **Multi-Leg Position Visualization**
   - **Long Stock**: Simple dual-input pricing (stock price only)
   - **Covered Call**: Dual pricing model with stock and option value inputs
   - **Bull Put Spread**: Single spread value with dual breakeven visualization
   - **Long Call Butterfly**: Range-based progress with optimal profit zone display
   - **Calendar Spread**: Time-based visualization with DTE indicators

3. **Strategy-Specific Risk Metrics**
   - **Directional Strategies**: Distance to stop loss, current risk amount
   - **Spread Strategies**: Multiple breakeven points, max profit/loss zones
   - **Range Strategies**: Distance to optimal zone, non-linear payoff visualization
   - **Time-Sensitive Strategies**: Differential time decay rates, expiration awareness

4. **Visual Hierarchy Adaptation**
   - Color coding varies by strategy (directional vs zone-based)
   - Progress indicators adapt to strategy-optimal scenarios
   - Status indicators explain strategy-specific conditions
   - Risk metrics framed around strategy-specific considerations

### Manual Price Update System

**Purpose:** Enable real-time position analysis through manual price entry while maintaining privacy and behavioral engagement.

**Core Functionality:**
1. **Universal Price Update Interface**
   - Dedicated price update card/header on all position views
   - Immediate P&L recalculation upon price entry
   - Visual feedback system for successful updates
   - Last update timestamp tracking

2. **Strategy-Specific Pricing Models**
   - **Simple Strategies**: Single underlying price input
   - **Multi-Leg Strategies**: Separate inputs for underlying and spread/option values
   - **Complex Strategies**: Multiple pricing inputs with dependency calculations
   - **Time-Sensitive Strategies**: Price inputs with time decay considerations

3. **Real-Time Calculation Engine**
   - Instant P&L updates across all position metrics
   - Dynamic progress bar recalculation
   - Strategy-specific risk metric updates
   - Portfolio-level impact calculation

4. **Price Data Management**
   - Current prices used for real-time calculations
   - Historical closing prices maintained for analysis
   - Automatic fallback to most recent closing price
   - Price update history for position timeline

### Enhanced User Interface Specifications

**Purpose:** Define comprehensive UI standards that support behavioral training and habit formation through consistent, mobile-first design.

**Design System Standards:**
1. **Color Palette & Semantic Usage**
   - **Primary Blue (#3b82f6)**: CTA buttons, active states, progress completion
   - **Success Green (#16a34a)**: Profitable positions, positive outcomes, completion states
   - **Alert Red (#dc2626)**: Losing positions, warnings, immutability notices
   - **Attention Orange (#f59e0b)**: Positions needing review, proximity alerts
   - **Neutral Grays**: Background (#f8fafc), text hierarchy, inactive states

2. **Typography & Information Hierarchy**
   - **Header Text (18px)**: Mobile app bar, navigation headers
   - **Title Text (24px)**: Main page titles, section headers
   - **Body Text (16px)**: Primary content, form labels, descriptions
   - **Secondary Text (14px)**: Metadata, timestamps, auxiliary information
   - **Micro Text (12px)**: Navigation labels, fine print, technical details

3. **Layout & Spacing Standards**
   - **Mobile Container**: 414px max width (iPhone Pro Max reference)
   - **Content Padding**: 20px horizontal, 16px vertical for main areas
   - **Card Internal Padding**: 16px for content cards
   - **Button Padding**: 16px vertical, 32px horizontal for primary actions
   - **Border Radius**: 8px for buttons and cards, 6px for small elements

4. **Interactive Element Patterns**
   - **Performance Headers**: Gradient backgrounds reflecting profit/loss status
   - **Progress Indicators**: Color-coded bars showing position relative to targets
   - **Status Badges**: Contextual indicators for position conditions
   - **Action Buttons**: Bottom-anchored primary actions, header secondary actions
   - **Form Controls**: Consistent input styling with validation states

5. **Behavioral Psychology Elements**
   - **Attention System**: Yellow backgrounds + orange borders for review-needed positions
   - **Immutability Warnings**: Red backgrounds with lock icons for unchangeable elements
   - **Progress Visualization**: Color-coded advancement toward goals
   - **Success Reinforcement**: Positive visual feedback for completed actions
   - **Information Prioritization**: Visual hierarchy directing attention to critical data

## Detailed Feature Specifications

### Trade Entry Workflow
1. **Strategy Selection**
   - Choose from pre-built templates (covered call, iron condor, etc.)
   - Or build custom multi-leg strategies
   - Support for legging in over time while maintaining strategy classification

2. **Trade Plan Documentation**
   - Target entry/exit prices for each leg
   - Stop loss levels
   - Profit targets
   - Maximum loss tolerance
   - Time horizon and market thesis
   - Expected holding period
   - **Trade invalidation criteria:** "How will you know this trade has violated your initial thesis?"
   - **Predetermined response:** "What specific action will you take when invalidation occurs?"

3. **Trade Plan Commitment**
   - **Immutable confirmation system:** User confirms trade plan details before locking them in
   - **Behavioral training focus:** All trade plan details become uneditable after confirmation to mirror real-world trading discipline
   - **Amendment tracking:** Changes can only be made through dated notes, creating a complete decision history

4. **Execution Tracking**
   - Record actual fill prices and timestamps
   - Visual comparison of planned vs. actual execution
   - Calculate slippage and execution quality
   - **Invalidation tracking:** Compare market conditions against predetermined invalidation criteria
   - **Action compliance monitoring:** Flag when predetermined invalidation response wasn't taken

### Daily Review Process
**Purpose:** Create a systematic habit of position evaluation and decision-making reflection.

**Core Functionality:**
- **Position prioritization algorithm:** Automatically ranks open positions by urgency of attention needed
- **Volatility-based sorting:** Primary algorithm focuses on positions with highest daily price movements weighted by position size
- **Alternative sorting approaches:** 
  - Risk-weighted urgency (positions near stops/targets)
  - Time-sensitive priority (short-dated options, overdue reviews)
  - Behavioral nudge focus (positions likely to trigger emotional decisions)
- **Guided review mode:** Step-by-step review process for beginning traders
- **Flexible review options:** Advanced users can disable guidance and review individual positions
- **Review habit tracking:** Timestamp tracking for review sessions and individual position reviews
- **Behavioral insights:** Monitor review time patterns during market runups and drawdowns
- **Streamlined journaling:** Easy journal entry opportunities during review process

**Review Session Features:**
- Review completion tracking for habit consistency
- Position-by-position navigation with price update integration
- Optional journal prompts and behavioral nudges
- Review time correlation analysis for future pattern recognition

### Risk Management Dashboard
1. **Current Position Summary**
   - Total portfolio risk (maximum potential loss)
   - Unrealized P&L by position and total
   - Risk/Reward ratio for each position
   - Days held vs. planned holding period

2. **Profit Management Analysis**
   - Current unrealized profit as % of maximum potential
   - Remaining profit potential vs. current risk
   - Example: "90% profit captured, risking $400 to potentially gain $40 more"

3. **Portfolio Risk Aggregation**
   - Total capital at risk across all positions
   - Concentration analysis (% of portfolio in similar strategies)
   - Correlation warnings for related positions

### Extrinsic Value Visualization
1. **Real-time Extrinsic Calculation**
   - Current option price minus intrinsic value
   - Track extrinsic value as percentage of total premium

2. **Historical Extrinsic Charts**
   - Timeline showing extrinsic value changes during holding period
   - Overlay with underlying price movements
   - Identify theta acceleration periods and volatility impact
   - Help develop intuition for option behavior patterns

### Scenario Analysis Engine
1. **Configurable Parameters**
   - Default scenarios for swing trades: 1%, 2%, 5%, 10%, 20%
   - Default scenarios for long-term: 2%, 5%, 10%, 25%, 50%
   - Custom scenario creation capability

2. **Position-Level Analysis**
   - Show P&L for each scenario (up/down moves)
   - Highlight break-even points and maximum loss levels
   - Visual representation of profit/loss curves

3. **Portfolio-Level Stacking**
   - Aggregate all positions under same market move scenarios
   - Perfect correlation assumption (all assets move together)
   - Total portfolio P&L under each scenario
   - Risk concentration alerts

### Journaling Integration
1. **Mandatory Trade Journaling**
   - Every trade entry requires an accompanying journal entry
   - Future enhancement: LLM quality checking for journal entries
   - Behavioral reinforcement through required reflection

2. **Position-Specific Entries**
   - Chronological journal tied to each trade
   - Entry types: Trade rationale, market observations, emotional state
   - Link journal entries to specific price points or events

3. **Daily Review Integration**
   - Optional but prominent journal entry opportunities during position reviews
   - Streamlined interface for quick thoughts and observations
   - Review session journaling for broader market reactions

4. **Market Event Logging**
   - Capture broader market movements and personal reactions
   - Tag entries with market conditions (volatility, sector rotation, etc.)
   - Cross-reference with open positions at time of event

5. **Pattern Recognition**
   - Behavioral tags: emotional decisions, plan deviations, market timing
   - Searchable and filterable journal entries
   - Trend analysis over time

### Performance Analytics
1. **Strategy Performance Tracking**
   - Win/loss ratios by strategy type
   - Average holding periods vs. planned
   - Profit/loss distribution analysis

2. **Behavioral Analysis**
   - Plan deviation frequency and outcomes
   - Emotional decision tracking
   - Market timing patterns

3. **Risk Management Effectiveness**
   - Stop loss hit rates and effectiveness
   - Profit target achievement rates
   - Risk/reward ratio trends over time

## Data Model Architecture

### Core Entity Design
The application uses a **Position vs Trade separation architecture** with **strategy-aware data models** to support both behavioral training and accurate financial tracking across simple stock positions to complex multi-leg option strategies.

**Position Entity:**
- Contains the immutable trade plan (strategy intent, price targets, stop levels, thesis)
- Represents the trader's original strategic decision and risk parameters
- **Strategy-specific metadata**: Stores strategy type and configuration for UI adaptation
- **Multi-leg support**: Accommodates 1-4 leg structures with individual leg specifications
- **Strategy classification**: Enables strategy-specific calculations and UI rendering
- Stores planned quantities and per-share/per-contract price levels
- Status automatically derived from trade activity (open/closed based on net quantity)
- Dollar-based risk/reward amounts computed dynamically from actual trades

**Trade Entity:**  
- Individual execution records (buy/sell transactions) within a position
- Each trade maintains its own cost basis, quantity, and timestamp
- **Enhanced options support**: option_type, strike_price, expiration_date for each leg
- **Multi-expiration tracking**: Supports strategies with different expiration dates per leg
- **Leg identification**: Associates each trade with specific strategy leg for complex positions
- Enables accurate tracking of partial fills, scale-ins, and complex strategy execution

**Strategy Configuration Entity:**
- **Strategy templates**: Pre-defined configurations for common strategies (covered calls, spreads, etc.)
- **Leg definitions**: Specifications for each leg including option type, direction, and relationships
- **Risk calculations**: Strategy-specific formulas for breakeven points, max profit/loss
- **UI metadata**: Information for adaptive user interface rendering
- **Educational content**: Strategy-specific help text and guidance

### P&L Calculation Methodology
- **Strategy-aware calculations**: P&L formulas adapt to position structure and strategy type
- **Trade-level cost basis tracking** with FIFO (first-in-first-out) matching for exits
- **Position P&L** calculated by summing all trade-level P&L within the position  
- **Multi-leg coordination**: Complex strategies calculate P&L across all legs simultaneously
- **Separate cost basis tracking** per instrument type (stock vs each unique option contract)
- **Time-based calculations**: Support for strategies with multiple expiration dates
- **Brokerage statement matching** through FIFO methodology alignment
- **Plan vs execution analysis** enabled through position intent vs trade reality comparison

### Component Architecture Requirements
- **Flexible leg display components** that can handle 1-4 legs with different configurations
- **Strategy-aware calculation engines** for different payoff structures and risk metrics
- **Adaptive UI components** that render based on strategy type and complexity
- **Educational content system** that provides strategy-specific guidance and help text

This architecture scales from simple stock positions to complex multi-leg option strategies while maintaining behavioral training capabilities and accurate financial calculations. The strategy-aware design ensures that both data storage and user interface adapt appropriately to the complexity and requirements of each position type.

## Technical Requirements

### Data Management & Price Updates
- **Dual pricing system:**
  - **Historical closing prices** - permanent record for analysis and performance tracking
  - **Temporary current prices** - intraday planning and risk assessment (not stored long-term)
- **Integrated position-level price updates:**
  - **Price update header** - constant header on all position views allowing instant price updates
  - **Real-time impact visualization** - immediately see P&L, risk/reward, and extrinsic value changes
  - **Multi-leg strategy support** - update underlying price affects all legs of complex strategies simultaneously
- **Evening routine (primary)** - review each position and update to closing prices
  - Navigate through portfolio position by position
  - Behavioral reinforcement integration - triggers reminders and alerts:
    - Stop loss/profit target proximity warnings
    - Trade invalidation criteria alerts  
    - Predetermined action reminders when thresholds are met
  - Creates permanent historical record
- **Morning routine (optional)** - review positions and enter current/opening prices
  - Enables risk manager emergency view with current market conditions
  - Provides real-time P&L, risk/reward, and extrinsic value calculations
  - Current prices automatically discarded at end of trading day
- **Calculation priority system** - use current price when available, fall back to most recent closing price
- **Historical price data storage** - maintains complete closing price history for analysis
- **Future API enhancement** - designed to accommodate automated price feeds while maintaining behavioral reinforcement touchpoints
- **Export capabilities** - for external analysis

### User Interface
- Clean, professional dashboard design
- Mobile-responsive for position monitoring
- Quick entry forms for trades and journal entries
- Visual charts and graphs for analysis

### Security & Privacy
- IndexedDB data storage (no cloud requirement)
- Data backup and export functionality
- Privacy-focused design (standalone tool)

## Success Metrics
- Improved trade execution discipline
- Better risk management decisions
- Enhanced self-awareness of behavioral patterns
- Increased profitability through better position management
- More systematic approach to profit-taking and loss-cutting

## Future Enhancement Possibilities

### Risk Manager Emergency View
**Purpose:** Provide rapid decision support during volatile market conditions without real-time data feeds.

**Functionality:**
- **Manual market input:** User enters current broad market movement (e.g., "SPY -3.5%", "NQ +2.1%")
- **Position prioritization algorithm:** Automatically ranks all open positions by urgency of attention needed
- **Priority ranking criteria:**
  1. Positions that have already exceeded stop loss or profit targets (immediate action required)
  2. Positions approaching stop/profit levels (within user-defined threshold, e.g., 90% of target)
  3. Short-dated options prioritized over long-dated (time urgency factor)
  4. Largest dollar risk positions when other factors are equal
- **Emergency dashboard:** Simplified view showing only essential information
  - Position rank, current estimated P&L based on market input
  - Original stop/profit targets vs. current estimated levels
  - Days to expiration for option strategies
  - Recommended action (close, adjust, monitor)
- **Quick action logging:** Streamlined interface to record emergency decisions and rationale
- **Post-crisis review:** Compare emergency actions taken vs. what the original plan called for

### AI Trading Coach Integration
**Purpose:** Leverage pattern recognition and behavioral analysis to provide personalized coaching insights.

**Three Primary Coaching Approaches:**

1. **Pattern Recognition Coach**
   - Analyzes journal entry quality and frequency patterns
   - Identifies behavioral correlations (e.g., shorter entries during losing streaks)
   - Flags when trader ignores their own scenario analysis or plan deviations
   - Suggests specific areas for improvement based on historical data
   - Provides periodic "coaching reports" highlighting blind spots

2. **Risk Management Coach**
   - Monitors for signs of increasing risk tolerance during winning/losing streaks
   - Alerts when portfolio concentration exceeds historical comfort levels
   - Identifies emotional decision patterns that correlate with poor outcomes
   - Suggests position sizing adjustments based on recent performance patterns
   - Tracks adherence to original risk management rules

3. **Execution Discipline Coach**
   - Compares planned vs. actual execution across all trades
   - Identifies systematic biases (always exiting winners too early, etc.)
   - Suggests optimal profit-taking levels based on historical success rates
   - Provides pre-trade "reality checks" based on similar past situations
   - Tracks improvement in execution discipline over time

### Compliance Risk Awareness System
**Purpose:** Help users maintain appropriate documentation standards and avoid potentially problematic journal language.

**Features:**
- **Language flagging:** Identify potentially problematic phrases in journal entries
  - Market manipulation implications
  - Insider information references  
  - Aggressive or predatory language
  - Tax avoidance vs. tax evasion distinctions
- **Documentation best practices:** Suggest professional language alternatives
- **Legal disclaimer integration:** Optional templates for maintaining proper documentation standards
- **Audit trail protection:** Ensure all entries are timestamped and uneditable after submission
- **Educational resources:** Links to resources about proper trading documentation

### Additional Enhancements
- Advanced correlation modeling
- Integration with brokerage APIs
- Machine learning pattern recognition
- Community features for strategy sharing
- Advanced Greeks calculations (optional module)