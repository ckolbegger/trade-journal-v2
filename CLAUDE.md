# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Trading Position Tracker & Journal App** - A standalone analytical tool that helps traders develop consistent profitability through systematic decision-making, disciplined execution, and enhanced self-awareness. The app emphasizes learning and habit formation over complex analytics.

### Target Technology Stack
- **Frontend**: TypeScript, React, Vite
- **Styling**: Mobile-first responsive design
- **Data**: Local storage only (privacy-focused)
- **Pricing**: Manual entry system with dual pricing model

## Core Architecture

### Position vs Trade Separation Model
The application uses a **Position vs Trade separation architecture** with **trade-level FIFO cost basis tracking**:

**Position Entity:**
- Contains immutable trade plan (strategy intent, price targets, stop levels, thesis)
- Represents the trader's original strategic decision and risk parameters
- Stores planned quantities and per-share/per-contract price levels
- Status automatically derived from trade activity (open/closed based on net quantity)
- Dollar-based risk/reward amounts computed dynamically from actual trades

**Trade Entity:**  
- Individual execution records (buy/sell transactions) within a position
- Each trade maintains its own cost basis, quantity, and timestamp
- Supports both stock trades (symbol, quantity, price) and options trades (adding option_type, strike_price, expiration_date)
- Enables accurate tracking of partial fills, scale-ins, and complex strategy execution

### Position vs Trade Implementation Details
- **Position Creation** = Planning only (no actual trades recorded)
- **Trade Execution** = Separate flow recording actual buy/sell against plan  
- **Progress Tracking** = Visual indicators showing plan vs actual execution status
- **Cost Basis** = Always calculated from actual trades using FIFO, never from plan targets

### P&L Calculation Methodology
- Trade-level cost basis tracking with FIFO (first-in-first-out) matching for exits
- Position P&L calculated by summing all trade-level P&L within the position  
- Separate cost basis tracking per instrument type (stock vs each unique option contract)
- Brokerage statement matching through FIFO methodology alignment

## Development Phases

### Phase 1A: Core Trade Lifecycle (Current Focus)
- **Position Plan Creation** with immutable trade plan documentation  
- **Trade Execution System** for recording actual trades against plans
- Position Management with manual price updates and real-time P&L calculation
- Position Closing with plan vs actual execution comparison
- **Forced journaling**: Every position plan and trade execution requires journal entry

### Phase 1B: Daily Review Process
- Volatility-based "needs attention" position sorting
- Guided position-by-position review mode for beginners
- Review session timestamp tracking and habit consistency

### Future Phases
- Phase 2: Stock Position Scaling (scale-in/scale-out functionality)
- Phase 3: Basic Options Introduction (covered calls, cash-secured puts)
- Phase 4: Options Expansion (long calls/puts, vertical spreads)
- Phase 5: Advanced Strategies (complex spreads, calendars, butterflies, condors)

## Key Design Principles

### Trade Plan Immutability
- Mirror real-world trading - no "undo" on executed plans
- True immutability with confirmation step before locking
- Build pattern of thinking through decisions before execution

### Behavioral Training Focus
- Mandatory journaling for every trade entry
- Daily review workflow with habit tracking
- Plan vs execution analysis for learning
- Position prioritization algorithm based on volatility × position size

### Habit Formation Through Design
- **Progressive Disclosure** - Multi-step flows prevent cognitive overload
- **Forced Reflection** - Mandatory journaling at critical decision points
- **Visual Feedback** - Color coding and progress indicators reinforce positive behaviors
- **Attention Direction** - Design guides focus to positions requiring action
- **Educational Moments** - Transform administrative tasks into learning opportunities

### Consistent Language and Mental Models
- Maintain clear distinction between planning and execution throughout all interfaces
- Use consistent terminology to avoid confusion between strategic intent and actual results
- Visual design should reinforce the conceptual separation of plan vs execution

### Data Management
- **Historical Data**: Permanent closing price records
- **Current Pricing**: Temporary intraday prices for planning
- **Evening Routine**: Primary data collection touchpoint with behavioral reinforcement
- **Morning Routine**: Optional current price updates

## Development Guidelines

### Code Structure
- Mobile-first responsive design approach
- Local data storage only for privacy
- Future-proof design accommodating options without architectural changes
- Clean separation between position planning and trade execution

### Testing Approach
No specific testing framework has been established yet. Check for package.json or other config files to determine testing approach when implementing tests.

### Mockups and Design
- **All mockups must be stored in `/mockups` directory structure**
- **Never create mockup files in `/src` directory** - they will be overwritten during development
- Mockup directory structure:
  - `/mockups/static-html` - Static HTML mockup files
  - `/mockups/screenshots` - Screenshot images of mockups  
  - `/mockups/wireframes` - Wireframe images and sketches
- Mockups are immutable design references and should be preserved throughout development

### Mockup Sequence and Purpose
- `01-empty-app-state.html` - First-time user onboarding experience
- `02-position-creation-flow.html` - Position plan creation (immutable strategy)
- `02b-add-trade-flow.html` - Trade execution against position plan
- `03-position-dashboard.html` - Attention-based position management
- `04-position-detail-view.html` - Individual position management interface  
- `05-position-closing-flow.html` - Educational position closing with plan vs execution analysis
- `06-journal-history-view.html` - Learning laboratory with behavioral insights

### Design Decisions Documentation
- All design decisions must be tracked in `/mockups/design-decisions.md`
- Include rationale, alternatives considered, and behavioral psychology reasoning
- Document any changes to established patterns or terminology

### UI Terminology Standards
- **"Position Plan"** - The immutable strategic intent (never "Trade Setup" or "Position Entry")
- **"Target Entry Price/Quantity/Date"** - Planned values from position plan
- **"Avg Cost"** - Actual FIFO cost basis from executed trades (never "Entry Price")
- **"Add Trade"** - Recording actual executions against the plan
- **"Position Plan"** - Journal entry type for planning documentation

### Visual Design Patterns
- **Attention System**: Yellow background + orange left border for positions requiring review
- **Performance Colors**: Green borders (profitable), Red borders (losing), Orange borders (attention)
- **Prioritization**: Attention-based ordering (needs attention positions always at top)
- **Immutability Warnings**: Red background with lock icons for immutable elements

## Business Context

This is a **privacy-first, standalone tool** designed as a free alternative to complement rather than compete with paid trading platforms. The focus is on behavioral training and habit formation rather than complex analytics or social features.

The app targets retail traders progressing from simple stock trades to complex option strategies, with emphasis on systematic decision-making and self-awareness development.