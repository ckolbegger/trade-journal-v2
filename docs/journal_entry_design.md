# Journal Entry Design

## Overview

This document outlines the design for the journal entry system in the Trading Position Tracker & Journal App. The journal system is designed to support behavioral training, self-awareness development, and comprehensive plan vs execution analysis.

## Core Requirements

- Support position plan creation with immutable strategic intent
- Enable journal entries for trade executions (opening/closing, scaling in/out)
- Allow standalone journal entries for market condition changes
- Provide analysis of trade execution vs plan compliance
- Support emotional state tracking and behavioral pattern recognition
- Accommodate future expansion to complex multi-leg options strategies

## Journal Entry Types

### 1. Position Plan (Immutable)
**Purpose**: Capture the original strategic intent and risk parameters
**Timing**: During position creation (no drafts - immediate immutability)
**Key Fields**: Strategy rationale, thesis, risk management rules, price targets

### 2. Trade Execution
**Purpose**: Document actual trade executions and rationale
**Timing**: During market hours or daily review
**Key Fields**: Execution quality, timing analysis, fill comparison to plan, emotional state

### 3. Market Observation
**Purpose**: Record market conditions and emotional reactions
**Timing**: Real-time during market hours or during daily review
**Key Fields**: Market volatility, emotional triggers, action considerations

### 4. Plan Adjustment
**Purpose**: Document modifications to trading approach mid-position
**Timing**: When user decides to adjust strategy
**Key Fields**: Reason for change, new parameters, emotional drivers

## Data Schema Design

### Position Entity Enhancement

```typescript
interface Position {
  // Core immutable position data
  id: string;
  symbol: string;
  strategy: string;
  created: Date;
  status: 'open' | 'closed';

  // Trade plan as separate immutable object
  tradePlan: TradePlan;

  // Journal entries (separate collection)
  journalEntries: JournalEntry[];

  // Chart links (future feature)
  chartLinks: string[];
}
```

### Trade Plan Entity (Separate & Immutable)

```typescript
interface TradePlan {
  id: string;
  positionId: string;
  strategy: string;
  thesis: string;
  plannedEntry: {
    price: number;
    quantity: number;
    date: Date;
  };
  priceTargets: {
    target1: number;
    target2: number;
    stopLoss: number;
  };
  riskManagement: {
    maxRisk: number;
    positionSizing: string;
  };
  chartLinks: string[]; // Future feature
  createdAt: Date;
  isImmutable: boolean;
}
```

### Journal Entry with Version History

```typescript
interface JournalEntry {
  // Top-level invariant fields
  id: string;
  positionId?: string; // Optional - allows standalone market observation entries
  tradeId?: string; // Optional link to specific trade
  type: 'trade_execution' | 'market_observation' | 'plan_adjustment';

  // Version history array - current entry is at index 0, sorted descending by created timestamp
  versions: JournalEntryVersion[];
}

interface JournalEntryVersion {
  id: string;
  emotionalState: 'confident' | 'fearful' | 'greedy' | 'neutral' | 'uncertain';
  structuredFields: {
    marketConditions: string;
    deviationFromPlan: string;
    lessonsLearned: string;
    // Additional context-specific fields based on entry type
  };
  freeFormText: string;
  createdAt: Date;
  changeReason?: string; // Optional reason for the change (when editing previous versions)
}

// Helper type for the current version
type CurrentJournalEntry = JournalEntry & {
  current: JournalEntryVersion; // The version at index 0
}
```

## UI Pattern Design

### Unified Journal Interface

The journal interface uses a context-aware form that adapts based on entry type:

```
┌─────────────────────────────────────────┐
│ Entry Type: [Trade Execution ▼]         │
│ Position: AAPL Oct Calls (linked)      │
│ Trade: Buy 2 contracts @ $3.50 (linked)│
├─────────────────────────────────────────┤
│ Emotional State: [Confident ▼]         │
├─────────────────────────────────────────┤
│ Market Conditions: [________________]  │
│ Deviation from Plan: [________________] │
│ Lessons Learned: [____________________] │
├─────────────────────────────────────────┤
│ Free-form Notes:                       │
│ [_________________________________]    │
│ [_________________________________]    │
│ [_________________________________]    │
├─────────────────────────────────────────┤
│ [Save Entry] [Cancel]                  │
└─────────────────────────────────────────┘
```

### Context-Specific Field Variations

#### Position Plan (Creation Mode)
- Strategy type and detailed thesis
- Risk parameters and position sizing
- Price targets and stop levels
- Chart analysis and technical indicators

#### Trade Execution
- Execution quality assessment
- Timing vs original plan
- Fill price comparison
- Emotional state during execution

#### Market Observation
- Current market conditions
- Volatility assessment
- Emotional reaction to price action
- Potential action considerations

#### Plan Adjustment
- Reason for strategy change
- New parameters and targets
- Emotional drivers for change
- Impact on overall risk

## Future Options Strategy Support

### Enhanced TradePlan for Options

```typescript
interface OptionsTradePlan extends TradePlan {
  strategyType: 'vertical_spread' | 'iron_condor' | 'calendar' | 'butterfly';
  legs: OptionsLegPlan[];
  maxProfit: number;
  maxLoss: number;
  breakEvens: number[];
  greeksTargets: {
    delta: number;
    theta: number;
    vega: number;
  };
}
```

### Multi-Leg Strategy Relationships

```
Position (Iron Condor on SPX)
├── TradePlan (multi-leg strategy with max profit/loss)
├── JournalEntry #1 (Strategy rationale - linked to position)
├── Trade #1 (Sell Call - linked to journal entry #2)
├── JournalEntry #2 (Call leg execution - linked to trade #1)
├── Trade #2 (Sell Put - linked to journal entry #3)
├── JournalEntry #3 (Put leg execution - linked to trade #2)
└── JournalEntry #4 (Market volatility change - standalone)
```

## Key Design Decisions

### 1. Trade Plan = Separate Immutable Entity
**Rationale**:
- Critical for plan vs execution analysis
- Immutability requirements differ from journal entries
- Different access patterns (frequent reference vs analysis)
- Better supports complex options strategies
- Reinforces behavioral commitment to original strategy

### 2. Journal Entries = Editable with History
**Rationale**:
- Enables "tell us everything" approach
- Tracks plan violations over time
- Supports behavioral pattern recognition
- Allows for learning from changes
- Clean versioning model with current entry at index 0 and historical versions sorted descending by timestamp
- Supports standalone market observation entries through optional positionId

### 3. Flexible Linking System
**Benefits**:
- Entries can link to positions, trades, or stand alone
- Supports both simple and complex strategies
- Enables comprehensive analysis workflows

### 4. Structured + Free-form Approach
**Advantages**:
- Emotional state tracking enables behavioral analysis
- Structured fields facilitate data mining
- Free-form text captures nuanced insights
- Balances quantitative analysis with qualitative reflection

## Behavioral Psychology Integration

### Self-Awareness Features
- **Emotional State Tracking**: Quantifiable emotional data for pattern analysis
- **Plan Violation Detection**: Version history identifies when users deviate from original plans
- **Behavioral Pattern Recognition**: Correlates emotional states with trading outcomes

### Learning Reinforcement
- **Progressive Disclosure**: Multi-step flows prevent cognitive overload
- **Forced Reflection**: Mandatory journaling at critical decision points
- **Visual Feedback**: Color coding and progress indicators reinforce positive behaviors

## Implementation Benefits

1. **Violation Detection**: Systematic identification of plan deviations through version history
2. **Scalability**: Architecture supports simple stocks → complex options evolution
3. **Behavioral Analysis**: Emotional state tracking enables pattern mining
4. **Learning Insights**: Rich data structure supports comprehensive performance analysis
5. **Future-Proof**: Design accommodates additional features like chart attachments and advanced analytics

## Future Enhancements

### Short-term (MVP+)
- Chart link attachments for position plans and journal entries
- Basic violation detection alerts
- Emotional state trend analysis

### Medium-term
- Advanced pattern recognition algorithms
- Integration with market data services
- Multi-leg strategy optimization suggestions

### Long-term
- Machine learning-based behavioral coaching
- Advanced risk analytics based on historical patterns
- Community features for anonymous strategy sharing (optional)

This design provides a robust foundation for behavioral trading education while supporting the full spectrum from simple stock trades to complex multi-leg options strategies.