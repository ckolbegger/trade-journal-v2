# Trading Position Tracker - Development Plan & Requirements

## Product Vision & User Profile

### Target Users
- **Primary**: Retail traders with stock/options experience but not yet consistently profitable
- **Secondary**: Beginners moving into options trading
- **Tertiary**: Stock traders ready to explore options

### Core Value Proposition
Holistic learning tool combining trade tracking, behavioral discipline, and integrated journaling to help traders achieve consistent profitability through systematic decision-making and self-awareness.

### Key Product Principles
- **Learning-focused**: Risk progression framework from simple to complex strategies
- **Behavioral training**: Immutable trade plans, forced journaling, habit formation
- **Personal/private**: No social features, purely individual self-improvement
- **Standalone**: No paid competition, free holistic approach

## Risk Progression Framework

### Learning Path Sequence
1. **Single stock buy/sell transactions**
2. **Scale-in/scale-out stock positions**  
3. **Basic options**: Covered calls, cash-secured puts
4. **Options expansion**: Long calls/puts, basic spreads
5. **Intermediate options**: Collars, protective strategies
6. **Advanced strategies**: Complex spreads, calendars, butterflies, condors, LEAP strategies

### Template Strategy Support
- Pre-built strategy templates for each risk level
- Guided setup for beginners
- Educational progression through complexity levels

## Development Phases

### Phase 1A: Core Trade Lifecycle
**Deliverable Focus**: Basic trade tracking with journaling integration

**Core Features:**
- **Trade Entry System**
  - Simple stock buy/sell position entry
  - Immutable trade plan documentation (entry target, profit target, stop loss, thesis, target quantity)
  - Trade plan confirmation step before locking
  - **Forced journaling**: Every trade entry requires journal entry
  - Timestamp locking of all trade plan details

- **Position Management**
  - Manual price updates with real-time P&L calculation
  - Current vs incremental profit visualization
    - *"You've captured 80% of potential profit, risking $200 to potentially gain $50 more"*
  - Basic position list view

- **Position Closing**
  - Exit trade functionality with actual execution tracking
  - Exit journaling requirement
  - Plan vs actual execution comparison
  - Partial fill handling (record actual execution, track vs target quantity)

**Technical Specs:**
- TypeScript + React + Vite
- Mobile-first responsive web app
- Local data storage only
- Manual price entry system (dual pricing: closing prices stored, current prices temporary)

### Phase 1B: Daily Review Process
**Deliverable Focus**: Habit-forming review workflow and position monitoring

**Core Features:**
- **Daily Review Workflow**
  - **Manual price update interface**: Update current prices during review sessions
  - **Guided position-by-position review mode** for beginners
  - **Position attention highlighting**: Visual cues for positions needing attention
  - Review session timestamp tracking
  - Review completion tracking for habit consistency

- **Review Process Features**
  - Streamlined journal entry during review (optional but prominent)
  - Price update integration within review flow
  - Review time tracking (future correlation with market conditions)
  - Simple position prioritization (basic sorting when multiple positions exist)

### Phase 2: Stock Position Scaling
**Features:**
- Scale-in/scale-out functionality
- Average cost basis tracking
- Portfolio risk aggregation (total capital at risk)
- Enhanced journaling with position timeline views
- Multi-entry position management

### Phase 3: Basic Options Introduction
**Features:**
- Covered calls and cash-secured puts templates
- Extrinsic value tracking and visualization
- Learning through extrinsic value observation over time
- Basic options P&L calculation (intrinsic + extrinsic)
- Template-guided strategy setup

### Phase 4: Options Expansion
**Features:**
- Long calls/puts for leverage
- Basic vertical spreads
- Enhanced scenario analysis (3-5 market move scenarios)
- Improved risk/reward visualization

### Phase 5: Advanced Strategies
**Features:**
- Complex spreads, calendars, butterflies, condors
- LEAP-based stock substitution strategies
- Advanced multi-leg scenario analysis
- Portfolio correlation modeling

## Key Design Decisions

### Trade Plan Immutability
- **Philosophy**: Mirror real-world trading - no "undo" on executed plans
- **Implementation**: True immutability with confirmation step
- **Behavioral Goal**: Build pattern of thinking through decisions before execution
- **Partial Fills**: Treat as scale-in events, record actual vs planned execution

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
- **Trade Entry**: Forced journal entry for every new position
- **Daily Review**: Optional but prominent journal opportunities
- **Future Enhancement**: LLM quality checking for journal entries
- **Privacy**: Completely personal, no external visibility

### Daily Review Workflow
- **Beginner Mode**: Guided step-by-step review process
- **Advanced Mode**: Dashboard with drill-down capability (future)
- **Habit Tracking**: Timestamp all review sessions and individual position reviews
- **Attention Algorithm**: Volatility × position size prioritization

## Technical Architecture

### Technology Stack
- **Frontend**: TypeScript, React, Vite
- **Styling**: Mobile-first responsive design
- **Data**: Local storage only (privacy-focused)
- **Pricing**: Manual entry system with dual pricing model

### Data Management
- **Historical Data**: Permanent closing price records
- **Current Pricing**: Temporary intraday prices for planning
- **Evening Routine**: Primary data collection touchpoint
- **Morning Routine**: Optional current price updates
- **Export**: Capability for external analysis

## Future Enhancement Roadmap

### Post-MVP Features (Captured for Future)
- **Risk Manager Emergency View**: Rapid decision support during volatile markets
- **AI Trading Coach**: Pattern recognition and behavioral coaching
- **Trader-Defined Position Ordering**: Learn individual "needs attention" patterns
- **Review Time Analysis**: Correlation with market runups/drawdowns
- **Advanced Greeks Calculations**: Optional module for sophisticated users
- **API Integration**: Automated price feeds while maintaining behavioral touchpoints

### Ideas for Future Exploration
- **Position Ordering Learning**: Let traders sort positions manually, learn their prioritization patterns
- **Behavioral Pattern Recognition**: Identify decision-making patterns over time
- **Market Condition Correlation**: Track review behavior vs market volatility
- **Educational Progression Tracking**: Monitor advancement through risk levels

## Success Metrics

### Behavioral Improvements
- Improved trade execution discipline
- Better risk management decisions
- Enhanced self-awareness of trading patterns
- More systematic approach to profit-taking and loss-cutting
- Consistent journaling habit formation

### Product Metrics
- Daily active usage of review process
- Journal entry completion rates
- Trade plan adherence tracking
- Position holding period vs planned duration
- Risk/reward decision improvements over time

## Validation Approach
- **Primary**: Personal use by product owner
- **Secondary**: Feedback from trading board community
- **Iterative**: Build, use, learn, improve cycle
- **Privacy-First**: No data sharing, purely individual tool

---

## Completed Mockup Development (September 2025)

### Phase 1A Mockups Status: ✅ COMPLETED
Six comprehensive HTML mockups have been created covering the complete user journey:

1. **01-empty-app-state.html** - First-time user onboarding with clear call-to-action
2. **02-position-creation-flow.html** - Position planning workflow with immutable plan confirmation
3. **02b-add-trade-flow.html** - Trade execution interface against established position plan
4. **03-position-dashboard.html** - Position dashboard with attention-based prioritization
5. **04-position-detail-view.html** - Individual position management and monitoring
6. **05-position-closing-flow.html** - Position closing with plan vs execution analysis
7. **06-journal-history-view.html** - Journal timeline for behavioral pattern recognition

### Key Architectural Clarifications from Mockup Development
- **Clear separation** between position planning (immutable) and trade execution (mutable)
- **Attention-based prioritization** algorithm for position dashboard ordering
- **Behavioral reinforcement** through mandatory journaling and plan vs execution analysis
- **Educational focus** with profit visualization and decision-making insights

### Documentation Created
- `/mockups/design-decisions.md` - Comprehensive design rationale and behavioral psychology principles
- Updated `CLAUDE.md` with mockup preservation rules and UI consistency standards

## Next Steps
1. ✅ ~~Create detailed mockups for Phase 1A core workflows~~ **COMPLETED**
2. ✅ ~~Define technical implementation approach for immutable trade plans~~ **CLARIFIED**
3. ✅ ~~Design journaling UX integration points~~ **DESIGNED**
4. ✅ ~~Plan manual price update workflow and data model~~ **PLANNED**
5. **Begin Phase 1A development** - Ready to start with validated mockups