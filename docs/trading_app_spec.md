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
The application uses a **Position vs Trade separation architecture** to support both behavioral training and accurate financial tracking.

**Position Entity:**
- Contains the immutable trade plan (strategy intent, price targets, stop levels, thesis)
- Represents the trader's original strategic decision and risk parameters
- Stores planned quantities and per-share/per-contract price levels
- Status automatically derived from trade activity (open/closed based on net quantity)
- Dollar-based risk/reward amounts computed dynamically from actual trades

**Trade Entity:**  
- Individual execution records (buy/sell transactions) within a position
- Each trade maintains its own cost basis, quantity, and timestamp
- Supports both stock trades (symbol, quantity, price) and options trades (adding option_type, strike_price, expiration_date)
- Enables accurate tracking of partial fills, scale-ins, and complex strategy execution

### P&L Calculation Methodology
- **Trade-level cost basis tracking** with FIFO (first-in-first-out) matching for exits
- **Position P&L** calculated by summing all trade-level P&L within the position  
- **Separate cost basis tracking** per instrument type (stock vs each unique option contract)
- **Brokerage statement matching** through FIFO methodology alignment
- **Plan vs execution analysis** enabled through position intent vs trade reality comparison

This architecture scales from simple stock positions to complex multi-leg option strategies while maintaining behavioral training capabilities and accurate financial calculations.

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
- Local data storage (no cloud requirement)
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