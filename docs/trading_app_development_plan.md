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

### Phase 1A: Core Trade Lifecycle Foundation (Single-Trade Focus)
**Deliverable Focus**: Build architectural foundation for all strategies, expose simple single-trade stock functionality

**SIMPLIFIED APPROACH**: Restrict Phase 1 to single opening trade + single closing trade per position to dramatically accelerate development and validate behavioral training hypothesis.

**Core Features (Stock-Only UI, Single-Trade Limitation):**
- **Trade Entry System**
  - Simple stock buy/sell position entry (UI simplified, data model supports all strategies)
  - Immutable trade plan documentation (entry target, profit target, stop loss, thesis, target quantity)
  - Strategy selection framework (stock-only initially, extensible for options)
  - Trade plan confirmation step before locking
  - **Forced journaling**: Every trade entry requires journal entry
  - Timestamp locking of all trade plan details

- **Position Management**
  - Manual price updates with real-time P&L calculation (single instrument, multi-instrument ready)
  - Current vs incremental profit visualization
    - *"You've captured 80% of potential profit, risking $200 to potentially gain $50 more"*
  - Position dashboard with attention-based prioritization (algorithm supports mixed portfolios)
  - Strategy-adaptive position detail views (renders based on position complexity)
  - **Single-trade limitation**: Clear UI messaging when users attempt multiple trades

- **Position Closing**
  - Exit trade functionality with simple cost basis tracking (no FIFO complexity)
  - Exit journaling requirement with structured reason selection
  - Plan vs actual execution comparison (educational analysis framework)
  - **Phase 1 Limitation**: Only single closing trade per position

**Architectural Foundation Elements:**
- **Data Models**: Full Position/Trade entities with options fields (unused in Phase 1)
- **Component Architecture**: Strategy-adaptive UI components that scale from stock to complex spreads  
- **Calculation Engines**: Strategy-aware P&L and risk calculations (single-trade initially, FIFO-ready)
- **Manual Pricing System**: Multi-instrument price update framework (single instrument exposed)
- **Behavioral Training Patterns**: Immutable planning and forced journaling that work for all strategies

**Technical Specs:**
- TypeScript + React + Vite
- Mobile-first responsive web app  
- Local data storage only
- Manual price entry system (dual pricing: closing prices stored, current prices temporary)
- Component architecture guided by full strategy mockups (04a-04d)

**Timeline**: 3-4 weeks (reduced from 7-9 weeks through FIFO deferral)

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

### Phase 2: Multi-Trade & FIFO Implementation  
**Deliverable Focus**: Enable multiple trades per position with accurate cost basis tracking

**Features:**
- **FIFO Cost Basis Engine**
  - Complete FIFO matching algorithm implementation
  - Accurate cost basis tracking matching brokerage statements
  - Cost basis visualization and educational transparency
- **Multi-Trade Support**
  - Scale-in/scale-out functionality
  - Multiple buy/sell trades per position
  - Partial fill handling and tracking
- **Enhanced Position Management**
  - Advanced cost basis visualization in trade history
  - Portfolio risk aggregation (total capital at risk)
  - Enhanced journaling with position timeline views
- **Performance & Validation**
  - Testing against real brokerage statements
  - Performance optimization for high-volume traders

**Timeline**: 3-4 weeks
**Total Stock Functionality**: Phase 1A + Phase 1B + Phase 2 = 8-11 weeks (vs 7-9 weeks original)

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

### Single-Trade Phase 1 Approach
- **Philosophy**: Validate behavioral training hypothesis before complex implementation
- **Implementation**: Restrict to single opening + single closing trade per position
- **Behavioral Goal**: Focus on immutable planning and journaling habits without complexity overhead
- **Extension Path**: Phase 2 adds multi-trade support without architectural changes
- **User Communication**: Clear messaging about Phase 1 limitations with "coming soon" indicators

### Trade Plan Immutability
- **Philosophy**: Mirror real-world trading - no "undo" on executed plans
- **Implementation**: True immutability with confirmation step
- **Behavioral Goal**: Build pattern of thinking through decisions before execution
- **Multi-Trade Support**: Deferred to Phase 2 with FIFO cost basis tracking

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

### Phase 1A Validation Metrics
- **Behavioral Training Validation**: Do users find value despite single-trade limitation?
- **Architecture Validation**: Does framework support future complexity without rewrites?
- **User Experience**: How often do users hit single-trade limitations?
- **Development Velocity**: Did simplification actually accelerate delivery?

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

## Development Timeline Summary

### Accelerated Approach Benefits
- **Phase 1A (Single-Trade)**: 3-4 weeks - Validate behavioral training hypothesis
- **Phase 1B (Daily Review)**: 2-3 weeks - Complete habit formation workflows
- **Phase 2 (Multi-Trade + FIFO)**: 3-4 weeks - Complete stock functionality
- **Total Stock Development**: 8-11 weeks vs 7-9 weeks original estimate
- **Time to MVP Validation**: 5-7 weeks (Phase 1A + 1B combined)

### Risk Mitigation
- **User Limitation Risk**: Clear communication about Phase 1 restrictions
- **Architecture Risk**: Complete data models prevent future refactoring
- **Market Validation**: Earlier feedback on core behavioral training value
- **Extension Test**: Phase 2 should require minimal architectural changes

## Validation Approach
- **Primary**: Personal use by product owner
- **Secondary**: Feedback from trading board community
- **Iterative**: Build, use, learn, improve cycle
- **Privacy-First**: No data sharing, purely individual tool

---

## Architectural Vision: Completed Mockup Development (September 2025)

### Full-Vision Mockups Status: ✅ COMPLETED
Comprehensive HTML mockups representing the **complete architectural vision** across all planned phases:

**Core User Journey (All Phases):**
1. **01-empty-app-state.html** - First-time user onboarding experience
2. **02-position-creation-flow.html** - Position planning workflow with strategy selection
3. **02b-add-trade-flow.html** - Trade execution interface against position plan
4. **03-position-dashboard.html** - Position dashboard with attention-based prioritization
5. **05-position-closing-flow.html** - Position closing with plan vs execution analysis
6. **06-journal-history-view.html** - Journal timeline for behavioral pattern recognition

**Strategy-Specific Detail Views (Phases 1-5):**
- **04-position-detail-view.html** - Simple stock position (Phase 1 target)
- **04a-covered-call-detail-view.html** - Covered call strategy (Phase 3)
- **04b-bull-put-spread-detail-view.html** - Bull put spread (Phase 4)
- **04c-long-call-butterfly-detail-view.html** - Complex spread (Phase 5)
- **04d-call-calendar-spread-detail-view.html** - Time-sensitive strategy (Phase 5)

### Critical Understanding: Mockups as Architectural North Star

**These mockups serve as the architectural vision for the entire product, NOT the Phase 1 implementation scope.** Their primary purpose is to:

1. **Guide Future-Proof Architecture**: Show how Phase 1 decisions must accommodate complex multi-leg strategies
2. **Inform Data Model Design**: Demonstrate why Position vs Trade separation is essential
3. **Direct Component Architecture**: Show how simple stock components must extend to options
4. **Validate UX Patterns**: Ensure consistent interaction patterns across all strategy types
5. **Prevent Dead Ends**: Visualize the complete system to avoid architectural constraints

### Key Architectural Clarifications from Mockup Development
- **Strategy-Adaptive Architecture**: UI components must flexibly support 1-4 leg strategies
- **Position vs Trade Separation**: Critical for both behavioral training and complex strategy support
- **Behavioral Consistency**: Immutable planning and forced journaling patterns scale across all strategies
- **Manual Price Update System**: Privacy-first approach works for both simple and complex positions
- **Attention-Based Prioritization**: Algorithm must work for mixed stock/options portfolios

### Phase 1 Implementation Approach
**Build the architectural foundation shown in mockups, expose only stock functionality:**
- Implement full Position/Trade data models (including unused options fields)
- Build flexible UI components that render based on strategy complexity
- Create strategy-aware calculation engines (initially only stock calculations)
- Establish behavioral training patterns that work for all future strategies
- Set up manual price update system supporting multi-instrument positions

### Documentation Created
- `/mockups/design-decisions.md` - Comprehensive design rationale and behavioral psychology principles
- Updated `CLAUDE.md` with mockup preservation rules and UI consistency standards
- `/docs/strategy-ui-patterns-guide.md` - Analysis of strategy-specific UI patterns from mockups

## Phase 1 Implementation Strategy: Architecture vs Exposure

### The Future-Proofing Approach
**Build comprehensive architecture, expose simple functionality.** Phase 1 creates the foundation that enables all future phases without requiring rewrites or migrations.

**What This Means in Practice:**

**Data Models**: Implement complete Position and Trade entities from ADR-001, including all options fields
- Expose: Basic stock position fields in UI
- Include: option_type, strike_price, expiration_date fields in database (unused)
- Benefit: Phase 3+ can activate options without data migration

**UI Components**: Build strategy-adaptive components guided by mockups 04a-04d
- Expose: Simple stock position rendering (`strategy_type: 'stock'`)
- Include: Multi-leg display logic, conditional rendering based on strategy complexity
- Benefit: Adding covered calls just requires changing strategy type and exposing existing UI

**Calculation Engines**: Implement strategy-aware P&L and risk calculations
- Expose: Stock P&L calculations only (`(current_price - avg_cost) * quantity`)
- Include: Options pricing framework, multi-leg calculation scaffolding
- Benefit: Complex strategy calculations slot into existing engine

**Manual Price System**: Build multi-instrument price update architecture
- Expose: Single stock price input
- Include: Multi-instrument pricing models, spread calculations
- Benefit: Bull put spread pricing just activates existing framework

### Phase Relationship to Mockups

**Phase 1A Target**: 04-position-detail-view.html (simple stock)
- Full mockup functionality implemented
- Architecture supports 04a-04d mockups (not exposed)
- Users see simple, focused stock trading interface

**Phase 3 Target**: 04a-covered-call-detail-view.html  
- Activate covered call UI components (already built)
- Enable dual pricing model (stock + option)
- Turn on options fields in forms

**Phase 4-5 Targets**: 04b-04d mockups
- Multi-leg display components activate
- Complex calculation engines surface
- Advanced pricing models become available

### Success Criteria for Phase 1
- ✅ Simple stock positions work perfectly (user-facing)
- ✅ Architecture accommodates all mockup complexity (internal)
- ✅ No rewrites required for Phase 3+ (future-proofing validated)
- ✅ Clean codebase without unused complexity cluttering UX (focused experience)

## Next Steps
1. ✅ ~~Create architectural vision mockups~~ **COMPLETED**
2. ✅ ~~Define Position vs Trade separation architecture~~ **CLARIFIED**
3. ✅ ~~Document mockup role as architectural north star~~ **CLARIFIED** 
4. ✅ ~~Plan future-proofing implementation approach~~ **PLANNED**
5. ✅ ~~Simplify Phase 1 scope for accelerated delivery~~ **COMPLETED**
6. **Begin Phase 1A development** - Build foundation architecture, expose single-trade stock functionality (3-4 weeks)
7. **Phase 1B development** - Add daily review workflows and habit formation (2-3 weeks) 
8. **Phase 2 development** - Implement multi-trade support and FIFO cost basis tracking (3-4 weeks)