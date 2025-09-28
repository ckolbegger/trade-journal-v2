# ADR-002: Journal Entry Content Model and Validation Architecture

## Status
Accepted (September 28, 2025)

## Context
The trading journal system requires a content model that supports behavioral training through structured reflection while maintaining flexibility for different entry types. Key requirements include:

- Enable guided reflection through structured prompts and responses
- Support multiple entry types (position_plan, trade_execution, future types)
- Provide content validation for quality assurance and habit formation
- Allow field-specific validation rules (thesis vs optional fields)
- Enable future extensibility for new prompt types and validation rules
- Maintain cross-branch compatibility with existing implementations
- Support behavioral training through mandatory vs optional field distinctions

During implementation, we compared two distinct approaches from parallel development branches:
- **claude-code branch**: Structured `JournalField[]` array model
- **glm-code branch**: Simple content string model

## Decision
We will implement a **structured journal field model** with **content-specific validation** using the `JournalField[]` array architecture.

### Architecture Components

**Journal Entry Structure:**
```typescript
interface JournalEntry {
  id: string;
  position_id?: string;
  trade_id?: string;
  entry_type: 'position_plan' | 'trade_execution';
  fields: JournalField[];          // ← Structured field array
  created_at: string;
  executed_at?: string;
}

interface JournalField {
  name: string;                    // Field identifier (thesis, emotional_state, etc.)
  prompt: string;                  // Question presented to user
  response: string;                // User's response content
}
```

**Centralized Prompt Configuration:**
```typescript
export const JOURNAL_PROMPTS = {
  position_plan: [
    {
      name: 'thesis',
      prompt: 'Why are you planning this position? What\'s your market outlook and strategy?',
      required: true
    },
    {
      name: 'emotional_state',
      prompt: 'How are you feeling about this trade?',
      required: false
    }
    // ... additional fields
  ],
  trade_execution: [
    // Different field set for trade execution entries
  ]
} as const;
```

**Content Validation Rules:**
- **Thesis Field**: 10-2000 character limit when not empty (behavioral training)
- **Required Fields**: Enforced at service layer with specific error messages
- **Optional Fields**: Can be empty but have same length limits when filled
- **Entry Type Validation**: Must have either position_id or trade_id
- **Field Array Validation**: Must contain at least one field

## Alternatives Considered

### Alternative 1: Simple Content String Model (glm-code approach)
```typescript
interface JournalEntry {
  id: string;
  position_id?: string;
  content: string;               // ← Single content field
  optional_field_1?: string;
  optional_field_2?: string;
}
```

**Rejected because:**
- Less structured reflection (no guided prompts)
- Harder to implement field-specific validation
- Poor support for behavioral training through structured questions
- Difficult to extend with new entry types and prompts
- No clear separation between different types of reflection content

### Alternative 2: Hybrid Model (Simple + Optional Structure)
```typescript
interface JournalEntry {
  content: string;               // Primary content
  structured_fields?: JournalField[];  // Optional structure
}
```

**Rejected because:**
- Adds complexity without clear benefits
- Creates ambiguity about which content model to use
- Harder to validate consistently
- Poor developer experience with dual content approaches

### Alternative 3: No Validation Model
**Rejected because:**
- Misses opportunity for behavioral training through content requirements
- Poor user experience with no guidance on content quality
- Harder to ensure meaningful journal entries for learning
- No quality assurance for reflection content

## Consequences

### Positive
- **Behavioral Training Support**: Structured prompts guide meaningful reflection
- **Content Quality Assurance**: Validation ensures sufficient content for learning
- **Extensible Architecture**: Easy to add new entry types and validation rules
- **Type Safety**: Full TypeScript support for all field interactions
- **Flexible UI Generation**: Forms can render dynamically from prompt configuration
- **Field-Specific Features**: Different validation rules per field type (thesis vs notes)
- **Future-Proof Design**: Supports complex prompts for options strategies and advanced features

### Negative
- **Increased Complexity**: More complex data model compared to simple string approach
- **Validation Overhead**: Additional validation logic required at service layer
- **Migration Complexity**: More complex to migrate if content model changes
- **Storage Overhead**: Slightly larger storage footprint due to structured metadata

### Neutral
- **Learning Curve**: Developers need to understand prompt configuration system
- **Testing Complexity**: More test scenarios required for validation edge cases

## Implementation Notes

### Content Validation Strategy
```typescript
private validateThesisContent(content: string): void {
  if (content.trim().length > 0 && content.trim().length < 10) {
    throw new Error('Thesis response must be at least 10 characters');
  }
  if (content.length > 2000) {
    throw new Error('Thesis response cannot exceed 2000 characters');
  }
}
```

### Dynamic Form Generation
The `EnhancedJournalEntryForm` component uses the centralized prompt configuration:
```typescript
const prompts = JOURNAL_PROMPTS[entryType]
const fields: JournalField[] = prompts.map(prompt => ({
  name: prompt.name,
  prompt: prompt.prompt,
  response: getResponseForField(prompt.name)
}))
```

### Cross-Branch Compatibility
To maintain compatibility with glm-code branch patterns, we implemented dual method names:
- Legacy methods: `findById()`, `findByPositionId()` (return undefined for missing)
- Standardized methods: `getById()`, `getByPositionId()` (return null for missing)

### Behavioral Training Integration
- **Mandatory Fields**: Thesis field required for position_plan entries (minimum 10 characters)
- **Progressive Disclosure**: Form guides users through structured reflection process
- **Content Quality**: Length requirements ensure meaningful reflection content
- **Prompt Standardization**: Consistent questions across all users for comparable insights

## Future Considerations

### Extensibility for New Entry Types
```typescript
// Easy to add new entry types:
export const JOURNAL_PROMPTS = {
  position_plan: [...],
  trade_execution: [...],
  position_review: [        // ← Future Phase 1B
    {
      name: 'position_assessment',
      prompt: 'How is this position performing vs your plan?',
      required: true
    }
  ],
  market_observation: [     // ← Future standalone entries
    {
      name: 'market_change',
      prompt: 'What changed in the market today?',
      required: true
    }
  ]
}
```

### Advanced Validation Rules
The architecture supports field-specific validation beyond simple length checks:
- Risk assessment scoring validation
- Date format validation for time-based fields
- Numerical validation for quantitative assessments
- Cross-field validation (e.g., consistency between emotional state and execution strategy)

## Related Decisions
- Builds on ADR-001's Position vs Trade separation
- Enables future ADR-003 for Daily Review integration
- Supports planned ADR-004 for Options strategy journaling

## Validation Through Implementation
This decision was validated through comprehensive testing:
- **28 unit tests** covering all validation edge cases
- **Integration tests** verifying cross-service functionality
- **End-to-end workflow tests** confirming user experience
- **Cross-branch compatibility tests** ensuring method standardization works

## Review Date
To be reviewed after Phase 1B Daily Review implementation and initial user feedback on journaling effectiveness.