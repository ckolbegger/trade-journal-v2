# Project Context

## Purpose
A trading journal application designed to help traders track positions, execute trades, and improve their trading behavior through plan vs execution analysis. The app focuses on behavioral training by maintaining immutable trade plans while allowing flexible execution tracking.

## Tech Stack
- **Frontend**: React 19.1.1 with TypeScript 5.8.3
- **Build Tool**: Vite 7.1.2 with React plugin
- **Styling**: Tailwind CSS 4.1.13 with PostCSS
- **UI Components**: Radix UI primitives, Lucide React icons
- **State Management**: Local state with IndexedDB persistence
- **Testing**: Vitest 3.2.4 with React Testing Library
- **Linting**: ESLint with TypeScript ESLint, React Hooks, and React Refresh plugins
- **Database**: IndexedDB (browser-based) for local data persistence

## Project Conventions

### Code Style
- TypeScript strict mode enabled with comprehensive type checking
- ESLint configuration enforces React and TypeScript best practices
- Component files use `.tsx` extension, utility files use `.ts`
- Import alias `@/` points to `src/` directory for clean imports
- Functional components with hooks pattern
- Interface definitions for all data structures

### Architecture Patterns
- **Position vs Trade Separation**: Immutable position plans vs mutable trade executions (ADR-001)
- **Service Layer Pattern**: Dedicated service classes for data operations (PositionService, JournalService, TradeService)
- **Component Architecture**: Separation of UI components, pages, and business logic
- **Local-First**: IndexedDB for data persistence with service layer abstraction
- **FIFO Cost Basis**: Trade-level cost basis tracking with First-In-First-Out matching

### Testing Strategy
- **Unit Tests**: Component and utility function testing with Vitest
- **Integration Tests**: End-to-end workflow testing for critical user journeys
- **Test Coverage**: Coverage reporting enabled with `vitest run --coverage`
- **Test Environment**: jsdom with React Testing Library for component testing
- **Mock Data**: Factory patterns for generating test data in `src/test/data-factories.ts`
- **Test Setup**: Centralized test configuration in `src/test/setup.ts`

### Git Workflow
- **Feature Branch Development**: Create branches for new features and fixes
- **Staged Commits**: Always stage individual files explicitly (never use `git add .`)
- **Commit Review**: Show staged files for review before committing
- **No Auto-Commits**: Wait for explicit approval before creating commits

## Domain Context

### Trading Concepts
- **Position**: Strategic trade plan with entry/exit targets, thesis, and risk parameters
- **Trade**: Individual execution record (buy/sell) within a position
- **FIFO Cost Basis**: First-In-First-Out matching for accurate P&L calculation
- **Strategy Types**: Currently supports "Long Stock", future-proofed for options strategies
- **Status States**: planned → open → closed (derived from trade activity)

### Behavioral Training
- **Immutable Plans**: Position plans become uneditable after confirmation
- **Plan vs Execution**: Compare intended trades against actual executions
- **Mandatory Journaling**: Required journal entries for position planning and trade execution
- **Emotional Tracking**: Journal prompts capture emotional state for behavioral analysis

## Important Constraints
- **Browser-Only**: No backend server - all data stored locally in IndexedDB
- **Single User**: Designed for individual trader use (no multi-user features)
- **Phase 1A Scope**: Focus on stock positions with simple buy/sell trades
- **No Real-Time Data**: Manual trade entry (no market data integration)
- **Local Storage Limits**: Constrained by browser IndexedDB storage quotas

## External Dependencies
- **No External APIs**: Self-contained application with no external service dependencies
- **Browser APIs**: IndexedDB for storage, standard Web APIs
- **Build Dependencies**: Development tools and libraries from npm registry
- **No Broker Integration**: Manual trade entry (no brokerage API connections)
