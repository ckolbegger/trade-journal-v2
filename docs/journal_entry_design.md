# Journal Entry Design

## Overview

The journal system is a core behavioral training component that encourages systematic thinking and emotional awareness throughout the trading lifecycle. It balances structured prompts for consistency with free-form responses for natural expression.

## Core Design Principles

1. **Optional but Encouraged**: Journal entries are prompted at key moments but not forced, adapting to each trader's natural workflow
2. **Risk-Focused Deviations**: Emphasis on tracking deviations that add risk, not minor execution differences
3. **Temporal Flexibility**: Traders can journal during execution or later during review
4. **Pattern Detection Ready**: Structured for future LLM analysis while maintaining human readability

## Data Structure

### Journal Entry Interface

```typescript
interface JournalEntry {
  id: string;
  position_id?: string;  // Optional for market observations
  trade_id?: string;     // Links to specific execution
  entry_type: 'position_plan' | 'trade_execution' | 'market_observation' | 'position_review' | 'position_close';

  // Structured prompts with free-form responses
  fields: {
    prompt: string;      // "Why this trade?"
    response: string;    // User's natural language answer
  }[];

  created_at: DateTime;  // When journal entry was written
  executed_at?: DateTime; // When the trade/action actually happened
}
```

### Position Interface Updates

```typescript
interface Position {
  // Immutable plan (facts only)
  id: string;
  symbol: string;
  strategy_type: string;
  target_entry_price: number;
  target_quantity: number;
  profit_target: number;
  stop_loss: number;
  max_risk: number;  // Dollar amount willing to lose

  created_at: DateTime;

  // Positions can have many journal entries
  journal_entry_ids: string[];  // All related journal entries
}
```

## Journal Entry Types & Prompts

### Position Plan (At Creation)
**Purpose**: Capture initial thesis and risk awareness
```typescript
[
  "Why this trade? Why now?",
  "What could invalidate this thesis?",
  "How will you know if you're wrong?",
  "What's your edge in this trade?"
]
```

### Trade Execution (Opening/Scaling/Closing)
**Purpose**: Document execution reality and emotional state
```typescript
[
  "Describe the execution (price, size, fills)",
  "How do you feel about this entry/exit?",
  "Any deviations from plan? Why?",
  "Failed/cancelled orders? What happened?",
  "Additional risk taken beyond plan?" // Key deviation we care about
]
```

### Market Observation (Ad-hoc)
**Purpose**: Capture market context and missed opportunities
```typescript
[
  "What market conditions changed?",
  "Impact on open positions?",
  "Planned response?",
  "Positions you considered but didn't take?"
]
```

### Position Review (During Daily Review)
**Purpose**: Systematic position evaluation and planning
```typescript
[
  "Current thesis still valid?",
  "Position performing as expected?",
  "Deviations increasing risk?", // Risk-focused deviation check
  "Next actions planned?"
]
```

### Position Close (At Exit)
**Purpose**: Learning and pattern recognition
```typescript
[
  "Why exit now?",
  "How did execution compare to plan?",
  "Risk management: Did you follow your rules?",
  "Lessons learned?",
  "What would you do differently?"
]
```

## Implementation Strategy

### Phase 1: Core Journal System
1. Create JournalEntry data model and service
2. Add position_plan journal to position creation flow
3. Build basic journal entry UI component
4. Create journal history view

### Phase 2: Trade Integration
1. Add trade_execution journals to trade entry flow
2. Link journal entries to specific trades
3. Support failed/cancelled order documentation

### Phase 3: Daily Review Integration
1. Add position_review journal prompts during review
2. Highlight positions without recent journals
3. Show deviation alerts for risk-increasing changes

### Phase 4: Analysis Features
1. Journal search and filtering
2. Pattern detection across entries
3. Behavioral insights dashboard

## Key Behavioral Training Elements

### Risk Deviation Focus
Rather than flagging all plan deviations, the system specifically tracks:
- Positions sized larger than planned
- Stops moved further away (increased risk)
- Entries at worse prices that increase potential loss
- Holding beyond planned timeframe without stop adjustment

### Temporal Awareness
- Timestamps show when journal was written vs when trade executed
- Helps identify patterns like "rushed entries have poor outcomes"
- Reveals if thoughtful evening reviews lead to better decisions

### Multi-Leg Strategy Support
- Each leg execution can have its own journal entry
- Tracks emotional state during complex position building
- Captures adjustments and rolls with reasoning

## Future Enhancements

### LLM Analysis (Future)
- Pattern detection across journal entries
- Sentiment analysis correlation with outcomes
- Personalized prompt evolution based on trader patterns
- Quality scoring of journal entries

### Configurable Enforcement (Future)
- User setting for mandatory vs optional journaling
- Customizable prompts per trader preference
- Minimum word counts or quality thresholds

### Advanced Features (Future)
- Voice-to-text journal entries
- Image attachments (charts, screenshots)
- Journal templates for repeated strategies
- Collaborative journals for mentorship