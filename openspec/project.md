# Project Context

## Purpose
Trading Position Tracker & Journal App - A standalone analytical tool that helps traders develop consistent profitability through systematic decision-making, disciplined execution, and enhanced self-awareness. The app emphasizes learning and habit formation over complex analytics.

It uses a Position vs Trade separation architecture with trade-level FIFO cost basis tracking to help traders understand their planning versus execution performance. This approach:

- Maintains an immutable Position Plan that represents the trader's original strategic decision and risk parameters
- Records actual Trade executions separately, enabling accurate cost basis calculations using FIFO methodology
- Provides systematic comparison between planned strategy and actual execution to foster behavioral improvements
- Targets retail traders progressing from simple stock trades to complex options strategies

The focus is on behavioral training and habit formation rather than complex analytics or social features. This is a privacy-first tool designed as a free complement to paid trading platforms.

## Tech Stack
- **Frontend**: TypeScript, React, Vite
- **Styling**: Tailwind CSS (mobile-first responsive design)
- **UI Components**: Radix UI, Lucide React icons
- **State Management**: React built-in hooks and context
- **Routing**: React Router DOM
- **Testing**: Vitest, React Testing Library, fake-indexeddb
- **Build Tool**: Vite with TypeScript references
- **Path Aliases**: `@/*` mapping to `./src/*`
- **Data Storage**: Local storage only (privacy-focused)
- **Pricing Model**: Manual entry system with dual pricing model (temporary intraday prices for planning, permanent closing prices for history)

## Project Conventions

### Code Style
- TypeScript with strict mode enabled
- React with functional components and hooks
- Mobile-first responsive design approach
- Clean separation between position planning and trade execution
- Import path consistency using `@/` aliases for all imports
- Verbatim module syntax for explicit import/export declarations
- Strict adherence to type-only imports for interfaces: `import type { MyInterface } from './types'`

### Architecture Patterns
- Position vs Trade Separation Model:
  - Position Entity: Contains immutable trade plan (strategy intent, price targets, stop levels, thesis)
  - Trade Entity: Individual execution records (buy/sell transactions) within a position
- Data Management:
  - Local storage only (privacy-focused)
  - Manual entry system with dual pricing model
  - Historical Data: Permanent closing price records
  - Current Pricing: Temporary intraday prices for planning
- Behavioral Training Focus:
  - Mandatory journaling for every trade entry
  - Daily review workflow with habit tracking
  - Position prioritization algorithm based on volatility × position size
- Habit Formation Through Design:
  - Progressive Disclosure: Multi-step flows prevent cognitive overload
  - Forced Reflection: Mandatory journaling at critical decision points
  - Visual Feedback: Color coding and progress indicators reinforce positive behaviors
  - Attention Direction: Design guides focus to positions requiring action
  - Educational Moments: Transform administrative tasks into learning opportunities

### Testing Strategy
- Test-Driven Development (TDD): Write failing tests first, then implement code to pass
- Integration Tests: Test complete user journeys end-to-end without mocks using fake-indexeddb
- Import Path Consistency: All tests must use same `@/` path aliases as application code
  - Tests using `../types/module` while app uses `@/types/module` will hide import issues
  - Create integration tests that verify actual module resolution works
- Element Visibility Validation: Always verify elements are visible before interaction in tests
  - Use `expect(element).toBeVisible()` before clicking/interacting with elements
  - Catches layout conflicts, CSS hiding, and positioning issues
  - Example: `expect(nextButton).toBeVisible(); fireEvent.click(nextButton)`
- Component Testing: Each component has corresponding test files in `__tests__` directories
- Real Data Persistence: Integration tests use actual IndexedDB (via fake-indexeddb) for realistic testing
- Test Coverage: Comprehensive coverage of all user workflows from start to finish
- Component Import Testing: Tests must verify actual component imports work: `const { Component } = await import('@/components/Component')`

### Git Workflow
- Feature branch development from master
- Conventional commit messages describing changes
- Comprehensive pull request descriptions with summary and test plan
- All changes require passing tests and builds

## Domain Context
- Trading domain with focus on behavioral aspects rather than complex analytics
- Position management with planning (Position Plan) vs execution (Trades) distinction
- FIFO (First-In-First-Out) cost basis tracking for accurate P&L calculation
- Forced journaling at critical decision points to promote reflection
- Progressive disclosure in UI flows to prevent cognitive overload
- Attention-based position sorting to guide user focus
- Clear mental model distinction between strategic intent (planning) and actual results (execution)
- Position prioritization algorithm based on volatility × position size
- Evening Routine: Primary data collection touchpoint with behavioral reinforcement
- Morning Routine: Optional current price updates

## Important Constraints
- Privacy-first: Local storage only, no external data transmission
- TypeScript interface import rules: Use `import type` for interfaces, regular imports for runtime values
  - TypeScript interfaces are erased during compilation and don't exist at runtime
  - Browser module resolution will fail when trying to import non-existent interface exports
- Mockups must be stored in `/mockups` directory, never in `/src`
- Maintain clear distinction between planning and execution terminology throughout interfaces
- Browser compatibility requirements (modern browsers only)
- Git Best Practices: Don't use "git add ." - always specify each individual file to be staged
- Git Best Practices: When staging files, never use wildcards or directories - always list each file individually
- All mockups are immutable design references and should be preserved throughout development
- Mobile-first responsive design approach is mandatory for all UI components
- Consistent language and mental models must be maintained throughout all interfaces

## External Dependencies
- React 19.x
- React Router DOM 7.x
- Tailwind CSS v4
- Radix UI primitives
- Lucide React icons
- Vitest testing framework
- React Testing Library
- fake-indexeddb for IndexedDB mocking in tests

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

## UI Terminology Standards
- **"Position Plan"** - The immutable strategic intent (never "Trade Setup" or "Position Entry")
- **"Target Entry Price/Quantity/Date"** - Planned values from position plan
- **"Avg Cost"** - Actual FIFO cost basis from executed trades (never "Entry Price")
- **"Add Trade"** - Recording actual executions against the plan
- **"Position Plan"** - Journal entry type for planning documentation

## Business Context

This is a **privacy-first, standalone tool** designed as a free alternative to complement rather than compete with paid trading platforms. The focus is on behavioral training and habit formation rather than complex analytics or social features.

The app targets retail traders progressing from simple stock trades to complex option strategies, with emphasis on systematic decision-making and self-awareness development.