<!-- OPENSPEC:START -->
# AGENTS.md

This file provides guidance to AI coding agents working in this repository.

## Build, Lint, and Test Commands

### Core Commands
- `npm run dev` - Start development server with hot reload
- `npm run build` - TypeScript compile + Vite production build
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint on entire codebase

### Testing
- `npm run test` - Run tests in watch mode (recommended during development)
- `npm run test:run` - Run tests once and exit (CI mode)
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ui` - Run tests with Vitest UI browser

**Run a single test file:**
```bash
npx vitest run src/components/__tests__/Dashboard.test.tsx
```

**Run tests matching a pattern:**
```bash
npx vitest run -t "Dashboard renders"
```

**Debug a specific test:**
```bash
npx vitest run --reporter=verbose src/pages/__tests__/Dashboard.test.tsx
```

## Code Style Guidelines

### TypeScript Setup
- **Strict Mode**: Enabled - all strict type checking flags are on
- **Target**: ES2022 with DOM and DOM.Iterable libraries
- **Module**: ESNext with bundler resolution
- **Path Alias**: Use `@/` prefix for imports from `src/` (e.g., `@/components/Widget`)

### Import Conventions (CRITICAL)
```typescript
// Type-only imports - use 'type' keyword
import type { Position, Trade, JournalEntry } from '@/types/journal'

// Runtime value imports - no 'type' keyword
import { JOURNAL_PROMPTS, calculatePnL } from '@/types/journal'
import { JournalService } from '@/services/JournalService'

// Named imports for React
import React, { useState, useEffect, useCallback } from 'react'
```

**Why**: TypeScript interfaces are erased at compile time. Importing them as runtime values will fail in the browser. The `verbatimModuleSyntax` flag enforces this.

### Naming Conventions
- **Interfaces**: PascalCase with descriptive names (`Position`, `TradeRequest`)
- **Types**: Same as interfaces (`type PositionStatus = 'planned' | 'open' | 'closed'`)
- **Constants**: SCREAMING_SNAKE_CASE for values (`const MAX_POSITION_SIZE = 100`)
- **Variables/Functions**: camelCase (`calculateAverageCost`, `positionsList`)
- **Component Files**: PascalCase (`Dashboard.tsx`, `PositionCard.tsx`)
- **Test Files**: `.test.tsx` suffix (`Dashboard.test.tsx`)
- **Test Descriptions**: Descriptive strings (`"Dashboard renders loading state"`)

### Component Patterns
```typescript
// Functional components with TypeScript interfaces
interface DashboardProps {
  filter?: 'all' | 'open' | 'closed'
  onViewDetails?: (positionId: string) => void
}

export const Dashboard: React.FC<DashboardProps> = ({ filter = 'all', onViewDetails }) => {
  // Implementation
}

// Use ServiceContext for dependency injection
import { useServices } from '@/contexts/ServiceContext'
const services = useServices()
```

### Error Handling
- Use typed errors with meaningful messages
- Always catch errors with type guards:
  ```typescript
  try {
    await loadPositions()
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to load positions')
  }
  ```
- Throw `Error` objects, not strings or raw values

### React Patterns
- **Hooks**: Prefer `useState`, `useEffect`, `useCallback`, `useMemo` from React 19
- **Effects**: Always include exhaustive-deps lint disable comment when suppressing:
  ```typescript
  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  ```
- **Testing**: Use React Testing Library with `fake-indexeddb` for integration tests
- **Visibility First**: In tests, verify elements are visible before interaction:
  ```typescript
  expect(button).toBeVisible()
  fireEvent.click(button)
  ```

### Directory Structure
```
src/
  components/     # React UI components
  contexts/       # React contexts (ServiceContext, ThemeContext)
  domain/         # Business logic (calculators, validators)
  integration/    # Integration tests
  lib/            # Utilities, data models, test-utils
  pages/          # Route components
  services/       # Data services (PositionService, JournalService)
  types/          # TypeScript interfaces and types
  utils/          # Helper functions
  __tests__/      # Root-level integration tests
```

### Testing Requirements
- All integration tests must use actual `@/` import paths (not relative paths)
- Test complete user workflows end-to-end
- Use `fake-indexeddb` for realistic IndexedDB testing
- Component tests should verify element visibility before interaction

### UI Terminology Standards
- **Position Plan** - The immutable strategic intent (never "Trade Setup")
- **Avg Cost** - Actual FIFO cost basis from executed trades
- **Add Trade** - Recording actual executions against the plan
- **Position Status**: `planned`, `open`, `closed`

### Styling
- Tailwind CSS for all styling
- Mobile-first responsive design
- Class naming via `cn()` utility:
  ```typescript
  import { cn } from '@/lib/utils'
  <div className={cn('base-class', condition && 'conditional-class')}>
  ```

## OpenSpec Workflow

When working on features involving planning, proposals, or architectural changes:
1. Open `@/openspec/AGENTS.md` for workflow guidance
2. Use `@/openspec/commands/` for spec creation and implementation
3. Follow the Change Proposal process for significant changes

## Quick Reference

| Task | Command |
|------|---------|
| Start dev server | `npm run dev` |
| Run all tests | `npm run test:run` |
| Run lint | `npm run lint` |
| Build for prod | `npm run build` |
| Single test file | `npx vitest run path/to/test.test.tsx` |

<!-- OPENSPEC:END -->
