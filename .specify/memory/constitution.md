<!--
Sync Impact Report:
Version: 0.0.0 → 1.0.0
Modified Principles: Initial constitution creation
Added Sections: All sections (initial creation)
Removed Sections: None
Templates Requiring Updates:
  ✅ .specify/templates/plan-template.md - Constitution Check section aligns with principles
  ✅ .specify/templates/spec-template.md - User scenarios align with behavioral training focus
  ✅ .specify/templates/tasks-template.md - Task categorization supports test-first discipline
Follow-up TODOs: None
-->

# Trading Position Tracker & Journal App Constitution

## Core Principles

### I. Behavioral Training Over Features

The application MUST prioritize habit formation and trader education over feature complexity or analytical sophistication.

**Non-negotiable rules:**
- Every position plan creation MUST require journal entry before completion
- Every trade execution MUST require journal entry before completion
- Daily review workflow MUST be designed to build consistent habits
- UI design MUST use progressive disclosure to prevent cognitive overload
- Educational moments MUST be embedded at critical decision points

**Rationale:** The app's value comes from changing trader behavior, not from providing more data. Features that don't contribute to habit formation or self-awareness development are scope creep.

### II. Immutability Reflects Reality

Trade plans and executed trades MUST be immutable once confirmed, mirroring real-world trading where decisions cannot be undone.

**Non-negotiable rules:**
- Position plans MUST be locked after confirmation (no edits to strategy, targets, stop levels)
- Trade executions MUST be permanent once recorded
- Position plan changes MUST require creating a new position
- UI MUST show clear warnings before locking immutable data
- True immutability MUST include explicit confirmation step

**Rationale:** Prevents revisionist history and forces traders to think through decisions before execution, building pattern of deliberate decision-making rather than reactive adjustments.

### III. Plan vs Execution Separation

The architecture MUST maintain clear separation between strategic planning (Position entity) and tactical execution (Trade entity).

**Non-negotiable rules:**
- Position entity MUST contain only immutable trade plan (strategy intent, price targets, stop levels, thesis)
- Trade entity MUST contain only execution records (actual buy/sell transactions)
- Cost basis MUST be calculated from actual trades using FIFO, never from plan targets
- UI terminology MUST distinguish plan ("Target Entry Price") from execution ("Avg Cost")
- Position status MUST be derived from trade activity (open/closed based on net quantity)

**Rationale:** Maintains conceptual clarity between "what I planned" and "what I did", enabling plan vs execution analysis for learning. Prevents confusion between strategic intent and actual results.

### IV. Test-First Discipline (NON-NEGOTIABLE)

All code changes MUST follow Test-Driven Development (TDD) methodology with integration-focused testing.

**Non-negotiable rules:**
- Tests MUST be written before implementation code
- Tests MUST fail before implementation begins (Red-Green-Refactor)
- Integration tests MUST test complete user journeys end-to-end without mocks
- Tests MUST use same import paths as application code (`@/` aliases, not relative paths)
- Element visibility MUST be validated before interaction in tests: `expect(element).toBeVisible()`
- Real data persistence MUST be used (fake-indexeddb for IndexedDB testing)

**Rationale:** Catches integration problems early, ensures browser module resolution works correctly, prevents "tests pass in Node but fail in browser" issues.

### V. Privacy-First Architecture

The application MUST maintain zero server dependency and complete data locality.

**Non-negotiable rules:**
- All data MUST be stored in browser local storage only (IndexedDB)
- No external API calls for pricing data (manual entry system only)
- No user authentication or account system
- No data transmission to external servers
- No analytics or tracking beyond local usage patterns

**Rationale:** Builds trust with retail traders who are protective of trading strategies and performance data. Positions app as privacy-focused alternative to cloud-based platforms.

### VI. Mobile-First Responsive Design

All UI components MUST be designed mobile-first with progressive enhancement for larger screens.

**Non-negotiable rules:**
- Initial designs MUST target mobile viewport dimensions
- Touch targets MUST be adequately sized (minimum 44x44px)
- Desktop layouts MUST enhance rather than redesign mobile patterns
- Testing MUST verify mobile usability before desktop optimization
- Responsive breakpoints MUST follow mobile → tablet → desktop progression

**Rationale:** Retail traders frequently check positions on mobile devices throughout the trading day. Mobile experience is primary use case, not secondary.

### VII. Type Safety & Import Discipline

TypeScript usage MUST maintain strict type safety with correct distinction between compile-time and runtime imports.

**Non-negotiable rules:**
- Interfaces MUST use type-only imports: `import type { MyInterface } from './types'`
- Runtime values (classes, functions, objects) MUST use regular imports
- Tests MUST use identical import paths as application code
- Browser module resolution failures MUST be caught by integration tests
- No `any` types except in justified edge cases with inline documentation

**Rationale:** Prevents "works in Node.js tests but fails in browser" issues caused by incorrect interface imports. TypeScript interfaces are compile-time only and don't exist at runtime.

### VIII. FIFO Cost Basis Methodology

Position P&L calculation MUST use trade-level FIFO (first-in-first-out) cost basis tracking to match brokerage statements.

**Non-negotiable rules:**
- Each trade MUST maintain its own cost basis, quantity, and timestamp
- Exit trades MUST match against oldest open trades first (FIFO)
- Cost basis MUST be tracked separately per instrument type (stock vs each unique option contract)
- Position P&L MUST be calculated by summing all trade-level P&L
- Methodology MUST align with standard brokerage reporting

**Rationale:** Ensures P&L calculations match brokerage statements for reconciliation. FIFO is industry-standard methodology and aligns with tax reporting requirements (IRS default for US traders).

## Development Workflow

### Test-Driven Development Cycle

1. **Feature Specification**: User story with acceptance scenarios documented in `spec.md`
2. **Test Creation**: Integration tests written first, covering complete user journey
3. **Test Validation**: Verify tests fail appropriately (Red phase)
4. **Implementation**: Write minimal code to make tests pass (Green phase)
5. **Refactoring**: Clean up while keeping tests green (Refactor phase)
6. **Verification**: Run full test suite including browser-based validation

### Code Review Requirements

- All PRs MUST include passing tests
- Integration tests MUST demonstrate actual browser module resolution works
- UI changes MUST include mobile viewport testing
- Immutability violations MUST be rejected
- Privacy violations MUST be rejected

## Technology Constraints

### Approved Technology Stack

- **Frontend Framework**: TypeScript, React, Vite
- **State Management**: React hooks, Context API (no external state libraries without justification)
- **Data Storage**: IndexedDB only (via idb library)
- **Testing**: Vitest, React Testing Library, fake-indexeddb
- **Styling**: CSS modules or styled-components (mobile-first)

### Prohibited Technologies

- Server-side frameworks or databases
- External API services for pricing data
- Analytics or telemetry services that transmit data externally
- Authentication/authorization services
- Cloud storage providers

### Technology Addition Process

New libraries or frameworks MUST be justified with:
1. Specific problem statement current stack cannot solve
2. Privacy impact assessment (data transmission risks)
3. Bundle size impact analysis
4. Mobile performance impact assessment
5. Testing strategy for new dependency

## Design Patterns

### UI Terminology Standards

Terms defined in `CLAUDE.md` MUST be used consistently:
- "Position Plan" (never "Trade Setup" or "Position Entry")
- "Target Entry Price/Quantity/Date" (planned values)
- "Avg Cost" (actual FIFO cost basis, never "Entry Price")
- "Add Trade" (recording executions)
- "Position Plan" (journal entry type)

### Visual Design Patterns

Attention system patterns MUST be applied consistently:
- Yellow background + orange left border = positions requiring review
- Green borders = profitable positions
- Red borders = losing positions
- Orange borders = attention-required positions
- Red background + lock icons = immutable elements

## Governance

### Amendment Process

1. **Proposal**: Document proposed change with rationale in PR description
2. **Impact Analysis**: Assess impact on existing features and templates
3. **Template Updates**: Update all affected templates in `.specify/templates/`
4. **Version Increment**: Follow semantic versioning (MAJOR.MINOR.PATCH)
5. **Approval**: Requires explicit sign-off on constitutional change
6. **Migration**: Update all existing specs/plans to comply with new principles

### Versioning Policy

- **MAJOR**: Backward incompatible principle removals or redefinitions
- **MINOR**: New principle added or materially expanded guidance section
- **PATCH**: Clarifications, wording fixes, non-semantic refinements

### Compliance Enforcement

- All feature specifications (`spec.md`) MUST align with behavioral training principles
- All implementation plans (`plan.md`) MUST include Constitution Check section
- All PRs MUST be reviewed for constitutional compliance
- Complexity additions MUST be justified in plan.md Complexity Tracking table
- Immutability violations in PR MUST be rejected immediately

### Runtime Development Guidance

For day-to-day development decisions and code patterns, refer to `CLAUDE.md` which provides:
- Detailed import guidelines and examples
- Testing approach with specific patterns
- Mockup organization and preservation rules
- UI terminology with usage examples
- Visual design pattern implementations

**Constitution supersedes all other documentation.** In conflicts between constitution and other docs, constitution takes precedence. `CLAUDE.md` provides implementation guidance within constitutional constraints.

**Version**: 1.0.0 | **Ratified**: 2025-11-09 | **Last Amended**: 2025-11-09
