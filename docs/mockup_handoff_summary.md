# Phase 1A Mockup Development - Claude Code Handoff

## Current Development Status
We've completed product specification, architecture design (Position vs Trade separation with FIFO cost basis), and development planning. Ready to create interactive mockups for Phase 1A using React + TypeScript + Tailwind + shadcn/ui.

## Phase 1A Mockup Sequence
Follow the complete user journey for a trader's first experience with the app:

### 1. Empty App State Mockup
- **Purpose**: Show initial app layout and navigation structure
- **Key Elements**:
  - Main navigation (Dashboard, Journal, potentially Settings)
  - Empty state with clear call-to-action: "Create Your First Position"
  - Professional, clean design (light theme)
  - Mobile-first responsive layout
  - Set expectation for what app will look like when populated

### 2. Position Creation Flow Mockup
- **Purpose**: Complete trade entry workflow with immutable planning
- **Key Screens**:
  - Position entry form (symbol, quantity, entry target, profit target, stop loss, thesis, time horizon)
  - Mandatory journal entry modal (cannot proceed without journal entry)
  - Trade plan confirmation screen (review all details before locking)
  - Success state showing locked position plan
- **Critical UX**: Make immutability clear - once confirmed, plan cannot be changed

### 3. Position Dashboard Mockup
- **Purpose**: Show newly created position in main dashboard view
- **Key Elements**:
  - Position card/list item showing key metrics
  - Current P&L (with manual price update capability)
  - Current vs incremental profit visualization: "90% profit captured, risking $400 to potentially gain $50 more"
  - Navigation to position detail view
  - Foundation for displaying multiple positions

### 4. Position Detail View Mockup
- **Purpose**: Individual position drill-down with complete information
- **Key Elements**:
  - Full position details (original plan, current status, P&L)
  - Plan vs actual execution comparison
  - "View Journal" navigation link
  - "Close Position" action button
  - Manual price update interface for this position

### 5. Position Closing Flow Mockup
- **Purpose**: Complete position exit workflow
- **Key Screens**:
  - Close position interface (actual fill prices, quantity)
  - Exit details form (execution tracking vs original plan)
  - Mandatory exit journal entry
  - Plan vs actual execution summary (show deviations)
  - Position closure confirmation

### 6. Basic Journal History View Mockup
- **Purpose**: Review journal entries for completed position
- **Key Elements**:
  - Chronological timeline of all journal entries for this position
  - Entry types: Initial trade rationale, exit thoughts
  - Simple date/time stamps and journal text display
  - Navigation back to position (or dashboard if position closed)

## Technical Implementation Requirements

### UI Component Stack
- React + TypeScript
- Tailwind CSS (core utility classes only)
- shadcn/ui components (@/components/ui/*)
- Lucide React icons
- Mobile-first responsive design

### Key Components to Build
- `AppLayout` - main navigation and responsive layout
- `PositionCard` - dashboard position display
- `TradeEntryForm` - position creation with validation
- `JournalEntry` - mandatory journaling modal
- `PositionDetail` - individual position view
- `ProfitVisualization` - current vs incremental profit display
- `JournalTimeline` - chronological journal history

### Data Model Types Needed
```typescript
interface Position {
  id: string;
  symbol: string;
  quantity: number;
  entryTarget: number;
  profitTarget: number;
  stopLoss: number;
  thesis: string;
  timeHorizon: string;
  status: 'open' | 'closed';
  createdAt: Date;
}

interface Trade {
  id: string;
  positionId: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  timestamp: Date;
}

interface JournalEntry {
  id: string;
  positionId: string;
  type: 'entry' | 'review' | 'exit';
  content: string;
  createdAt: Date;
}
```

### Sample Data for Mockups
Use realistic examples:
- AAPL stock at $175, target $192, stop $160
- 100 share position sizes
- Realistic journal entries: "Strong earnings beat with good forward guidance. Tech sector rotation looks favorable. Planning 2-3 week hold."

### Design Guidelines
- **Professional appearance**: Clean, modern financial application aesthetic
- **Clear information hierarchy**: Important numbers (P&L, targets) prominently displayed
- **Mobile-responsive**: Touch-friendly interface, readable on phone screens
- **Form validation**: Required field indicators, clear error messages
- **Confirmation flows**: Clear warnings before irreversible actions
- **Loading states**: Show appropriate feedback during form submissions

### Behavioral Elements to Emphasize
- **Immutability**: Visual cues when plans become locked
- **Mandatory journaling**: Cannot proceed without thoughtful entries
- **Risk awareness**: Always show dollar amounts, not just percentages
- **Plan tracking**: Highlight deviations from original intent

## File Organization Suggestions
```
src/
  components/
    ui/ (shadcn components)
    trading/
      AppLayout.tsx
      PositionCard.tsx
      TradeEntryForm.tsx
      JournalEntry.tsx
      PositionDetail.tsx
      ProfitVisualization.tsx
  mockups/
    1-EmptyAppState.tsx
    2-PositionCreationFlow.tsx
    3-PositionDashboard.tsx
    4-PositionDetailView.tsx
    5-PositionClosingFlow.tsx
    6-JournalHistoryView.tsx
  types/
    trading.ts
```

## Success Criteria
Each mockup should:
- Demonstrate actual interactive behavior (clickable buttons, form submissions)
- Show realistic data and use cases
- Be mobile-responsive
- Follow the complete user journey logically
- Validate the UX before implementation begins

Create mockups that feel like working applications rather than static designs. The goal is to validate the complete Phase 1A user experience through interactive prototypes.