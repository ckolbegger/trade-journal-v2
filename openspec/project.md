# Project Context

## Purpose

**Trading Position Tracker & Journal App** - A standalone analytical tool that helps traders develop consistent profitability through systematic decision-making, disciplined execution, and enhanced self-awareness. The app emphasizes learning and habit formation over complex analytics.

**Business Model**: Privacy-first, standalone tool designed as a free alternative to complement rather than compete with paid trading platforms. Focus on behavioral training and habit formation rather than complex analytics or social features.

**Target Users**: Retail traders progressing from simple stock trades to complex option strategies, with emphasis on systematic decision-making and self-awareness development.

## Tech Stack

- **Frontend**: TypeScript, React, Vite
- **Styling**: Mobile-first responsive design with Tailwind CSS (PostCSS + autoprefixer), tailwind-merge, class-variance-authority
- **UI Components**: Radix UI primitives, Lucide React icons
- **Routing**: React Router DOM 7
- **Data Storage**: IndexedDB (local storage only, privacy-focused)
- **Testing**: Vitest + React Testing Library + fake-indexeddb
- **Build Tool**: Vite
- **Version Control**: Git

## Project Conventions

### Code Style

- **TypeScript strict mode enabled**
- **TypeScript Configuration**: `verbatimModuleSyntax` enabled for explicit import/export declarations
- **Module Resolution**: Bundler mode with project references (`tsconfig.json`)
- **Import Rules (CRITICAL)**:
  - ❌ NEVER import interfaces as runtime values: `import { MyInterface } from './types'`
  - ✅ ALWAYS use type-only imports for interfaces: `import type { MyInterface } from './types'`
  - ✅ Runtime values use regular imports: `import { MyClass, myFunction } from './module'`
  - All imports must use `@/` path aliases for consistency with browser behavior
- **Mobile-first responsive design approach**
- **Clean separation between position planning and trade execution**

### Architecture Patterns

**Position vs Trade Separation Model (ADR-001)** - Core architectural pattern with trade-level FIFO cost basis tracking:

**Position Entity:**
- Contains immutable trade plan (strategy intent, price targets, stop levels, thesis)
- Represents trader's original strategic decision and risk parameters
- Stores planned quantities and per-share/per-contract price levels
- Status automatically derived from trade activity (open/closed based on net quantity)
- Dollar-based risk/reward amounts computed dynamically from actual trades

**Trade Entity:**
- Individual execution records (buy/sell transactions) within a position
- Each trade maintains its own cost basis, quantity, and timestamp
- Supports both stock trades (symbol, quantity, price) and options trades (adding option_type, strike_price, expiration_date)
- Enables accurate tracking of partial fills, scale-ins, and complex strategy execution

**Key Implementation Details:**
- Position Creation = Planning only (no actual trades recorded)
- Trade Execution = Separate flow recording actual buy/sell against plan
- Progress Tracking = Visual indicators showing plan vs actual execution status
- Cost Basis = Always calculated from actual trades using FIFO, never from plan targets

**P&L Calculation Methodology:**
- Trade-level cost basis tracking with FIFO (first-in-first-out) matching for exits
- Position P&L calculated by summing all trade-level P&L within the position
- Separate cost basis tracking per instrument type (stock vs each unique option contract)
- Brokerage statement matching through FIFO methodology alignment

**Service Layer Pattern:**
- Dedicated service classes for data operations: `PositionService`, `TradeService`, `JournalService`
- Service layer abstracts IndexedDB persistence with validation before writes
- Enables consistent data access patterns and easier testing

### Testing Strategy

**Test-Driven Development (TDD)** approach with comprehensive coverage:

- **Write failing tests first, then implement code to pass**
- **Integration Tests**: Test complete user journeys end-to-end without mocks
- **Import Path Consistency**: Tests MUST use same import paths as application code
  - ❌ Tests using `../types/module` while app uses `@/types/module` will hide import issues
  - ✅ All test imports must use `@/` path aliases to match browser behavior
  - ✅ Create integration tests that verify actual module resolution works
- **Element Visibility Validation**: Always verify elements are visible before interaction
  - Use `expect(element).toBeVisible()` before clicking/interacting with elements
  - Catches layout conflicts, CSS hiding, and positioning issues
- **Real Data Persistence**: Integration tests use actual IndexedDB (via fake-indexeddb)
- **Test Data Factories**: Centralized factory patterns in `src/test/data-factories.ts` for generating consistent test data
- **Test Coverage**: Monitor coverage using `npm run test:coverage` (vitest run --coverage)
- **Integration Test Requirements**:
  - Must test actual component imports: `const { Component } = await import('@/components/Component')`
  - Must test full user workflows from start to finish
  - Must use same module resolution as browser environment
  - Component tests that hang/timeout indicate real integration problems

### Git Workflow

**Strict File-by-File Staging Policy:**
- ❌ NEVER use `git add .` or wildcards
- ❌ NEVER use directory paths to stage multiple files
- ✅ ALWAYS specify each individual file to be staged
- ✅ Show staged files before committing
- ✅ Wait for explicit approval before creating commits

**Branch Strategy:**
- Main branch: `master`
- Feature branches: descriptive names

## Domain Context

### Trading Domain Knowledge

**Phase 1A: Core Trade Lifecycle (Current Focus)**
- Position Plan Creation with immutable trade plan documentation
- Trade Execution System for recording actual trades against plans
- Position Management with manual price updates and real-time P&L calculation
- Position Closing with plan vs actual execution comparison
- **Forced journaling**: Every position plan and trade execution requires journal entry

**Future Phases:**
- Phase 1B: Daily Review Process (volatility-based position sorting, guided review mode)
- Phase 2: Stock Position Scaling (scale-in/scale-out functionality)
- Phase 3: Basic Options Introduction (covered calls, cash-secured puts)
- Phase 4: Options Expansion (long calls/puts, vertical spreads)
- Phase 5: Advanced Strategies (complex spreads, calendars, butterflies, condors)

### Key Design Principles

**Trade Plan Immutability:**
- Mirror real-world trading - no "undo" on executed plans
- True immutability with confirmation step before locking
- Build pattern of thinking through decisions before execution

**Behavioral Training Focus:**
- Mandatory journaling for every trade entry
- Daily review workflow with habit tracking
- Plan vs execution analysis for learning
- Position prioritization algorithm based on volatility × position size

**Habit Formation Through Design:**
- **Progressive Disclosure** - Multi-step flows prevent cognitive overload
- **Forced Reflection** - Mandatory journaling at critical decision points
- **Visual Feedback** - Color coding and progress indicators reinforce positive behaviors
- **Attention Direction** - Design guides focus to positions requiring action
- **Educational Moments** - Transform administrative tasks into learning opportunities

**Consistent Language and Mental Models:**
- Maintain clear distinction between planning and execution throughout all interfaces
- Use consistent terminology to avoid confusion between strategic intent and actual results
- Visual design should reinforce the conceptual separation of plan vs execution

### Data Management

- **Historical Data**: Permanent closing price records
- **Current Pricing**: Temporary intraday prices for planning
- **Evening Routine**: Primary data collection touchpoint with behavioral reinforcement
- **Morning Routine**: Optional current price updates

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

### Mockups and Design

- **All mockups stored in `/mockups` directory structure**
- **Never create mockup files in `/src` directory** - they will be overwritten during development
- Mockup directory structure:
  - `/mockups/static-html` - Static HTML mockup files
  - `/mockups/screenshots` - Screenshot images of mockups
  - `/mockups/wireframes` - Wireframe images and sketches
- Mockups are immutable design references preserved throughout development

**Mockup Sequence:**
- `01-empty-app-state.html` - First-time user onboarding
- `02-position-creation-flow.html` - Position plan creation
- `02b-add-trade-flow.html` - Trade execution against position plan
- `03-position-dashboard.html` - Attention-based position management
- `04-position-detail-view.html` - Individual position management
- `05-position-closing-flow.html` - Educational position closing with plan vs execution analysis
- `06-journal-history-view.html` - Learning laboratory with behavioral insights

**Design Decisions:**
- All design decisions tracked in `/mockups/design-decisions.md`
- Include rationale, alternatives considered, and behavioral psychology reasoning
- Document any changes to established patterns or terminology

## Important Constraints

- **Privacy-First**: Local storage only (IndexedDB), no server/cloud dependencies
- **Manual Pricing**: No automatic price feeds, all prices manually entered
- **Immutability**: Position plans cannot be edited after confirmation (mirrors real trading)
- **Future-Proof**: Design must accommodate options trading without architectural changes
- **Mobile-First**: Primary design target is mobile/responsive interface
- **Browser-Only**: TypeScript interfaces must use type-only imports for browser compatibility
- **No External Analytics**: No tracking, telemetry, or data sharing

## External Dependencies

**None** - This is a completely standalone application:
- No external APIs for pricing data
- No backend services
- No authentication systems
- No cloud storage
- No analytics services

All data stored locally in browser IndexedDB for maximum privacy.
