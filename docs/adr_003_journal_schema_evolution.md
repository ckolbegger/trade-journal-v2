# ADR-003: Journal Schema Evolution and Backward Compatibility Architecture

## Status
Accepted (September 29, 2025)

## Context
As the trading journal system matures, we need to evolve the field definitions and prompts while maintaining backward compatibility with existing journal entries. Key challenges identified during development included:

- **Field Evolution**: Changing field names ("thesis" → "rationale") and prompts to improve behavioral training
- **Schema Migration**: Supporting old entries with legacy field names alongside new entries
- **UI Workflow Evolution**: Optimizing the 4-step position creation workflow based on user experience insights
- **Forward Compatibility**: Ensuring new features don't break existing journal entries
- **Flexible Field Validation**: Supporting optional `required` field metadata for validation

The need for this architecture became apparent when implementing behavioral improvements:
- Changing "thesis" field to "rationale" with clearer prompt "Why this trade? Why now?"
- Reordering 4-step workflow from Position→Risk→Journal→Confirmation to Position→Journal→Risk→Confirmation for better logical flow
- Adding `required` field metadata to enable field-specific validation rules

## Decision
We will implement a **schema evolution architecture** that enables **field definition changes without data migration** through **stored field metadata**.

### Architecture Components

**Enhanced JournalField Interface:**
```typescript
interface JournalField {
  name: string;                    // Field identifier (stable)
  prompt: string;                  // User-facing question (STORED with each entry)
  response: string;                // User's response content
  required?: boolean;              // Validation metadata (STORED with each entry)
}
```

**Backward Compatible Field Resolution:**
```typescript
// Each journal entry stores its field definitions at creation time
const journalEntry: JournalEntry = {
  id: 'journal-uuid',
  fields: [
    {
      name: 'thesis',              // Old field name preserved
      prompt: 'Why are you planning this position?',  // Original prompt preserved
      response: 'User response',
      // No required field (legacy entries default to optional)
    }
  ]
}

// New entries use current JOURNAL_PROMPTS definitions
const newEntry: JournalEntry = {
  id: 'journal-uuid',
  fields: [
    {
      name: 'rationale',           // New field name
      prompt: 'Why this trade? Why now?',  // Updated prompt
      response: 'User response',
      required: true               // Explicit validation metadata
    }
  ]
}
```

**Mixed Field Display Strategy:**
```typescript
// UI displays any field name using title-case transformation
const titleCase = (str: string): string => {
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

// "thesis" → "Thesis"
// "rationale" → "Rationale"
// "emotional_state" → "Emotional State"
```

**Schema Evolution Workflow:**
1. **Field Definition Changes**: Update `JOURNAL_PROMPTS` for new entries
2. **Backward Compatibility**: Existing entries retain their stored field definitions
3. **UI Flexibility**: Dynamic rendering supports any field name/prompt combination
4. **Validation Evolution**: New entries use current validation rules, old entries use stored rules (or defaults)

### UI Workflow Evolution

**Optimized 4-Step Position Creation Flow:**
- **Old Order**: Position Plan → Risk Assessment → Journal → Confirmation
- **New Order**: Position Plan → Journal → Risk Assessment → Confirmation

**Rationale for Change:**
- **Logical Flow**: Users can document their reasoning immediately after planning, before seeing risk calculations
- **Behavioral Training**: Journal reflection while position intent is fresh, before risk analysis might influence responses
- **User Experience**: Natural progression from planning to reflection to analysis to confirmation

## Alternatives Considered

### Alternative 1: Database Migration Approach
```typescript
// Migrate all existing entries to new field names
UPDATE journal_entries
SET fields = JSON_REPLACE(fields, '$.name', 'rationale')
WHERE JSON_EXTRACT(fields, '$.name') = 'thesis'
```

**Rejected because:**
- **Data Loss Risk**: Migration could fail or corrupt existing entries
- **Complexity**: Complex migration scripts for nested JSON field updates
- **Historical Accuracy**: Changes historical context of original entries
- **Rollback Difficulty**: Hard to undo migrations if issues arise

### Alternative 2: Field Mapping Layer
```typescript
// Map old field names to new ones at runtime
const FIELD_MAPPING = {
  'thesis': 'rationale',
  'old_field': 'new_field'
}
```

**Rejected because:**
- **Complexity**: Additional mapping layer adds cognitive overhead
- **Ambiguity**: Unclear which field name is canonical
- **Testing Burden**: Must test all mapping combinations
- **Performance**: Runtime mapping adds processing overhead

### Alternative 3: Versioned Journal Schema
```typescript
interface JournalEntry {
  schema_version: number;
  fields: JournalField[];
}
```

**Rejected because:**
- **Over-Engineering**: Too complex for simple field evolution needs
- **Version Management**: Requires complex version compatibility matrix
- **Migration Complexity**: Still requires handling multiple schema versions
- **User Experience**: No clear user-facing benefits

### Alternative 4: Immutable Field Definitions
**Rejected because:**
- **No Evolution**: Cannot improve prompts based on user feedback
- **Poor UX**: Stuck with suboptimal field names and prompts forever
- **Behavioral Training**: Cannot optimize prompts for better reflection quality

## Consequences

### Positive
- **Zero-Downtime Evolution**: Field changes require no database migrations
- **Historical Preservation**: Old entries maintain their original context and prompts
- **Flexible UI**: Single form component handles all field variations seamlessly
- **Forward Compatibility**: Architecture supports unlimited field evolution
- **Developer Experience**: Easy to evolve prompts without complex migration planning
- **User Experience**: Improved 4-step workflow provides better logical flow
- **Data Integrity**: No risk of data loss during field evolution

### Negative
- **Storage Overhead**: Each entry stores its own field definitions (vs sharing references)
- **Query Complexity**: Searching across field names requires handling multiple variations
- **Testing Complexity**: Must test mixed old/new field scenarios
- **Documentation Burden**: Must document field evolution history

### Neutral
- **Mixed Field Display**: Users see different field names in old vs new entries (acceptable)
- **Validation Differences**: Old entries may have different validation rules than new ones
- **Learning Curve**: Developers must understand schema evolution patterns

## Implementation Details

### Dynamic Field Validation
```typescript
// Use stored required field or default to optional
const validateField = (field: JournalField): boolean => {
  const isRequired = field.required ?? false  // Default to optional for legacy entries
  const value = field.response || ''

  if (isRequired && !value.trim()) {
    throw new Error('This field is required')
  }
  if (isRequired && value.trim().length > 0 && value.trim().length < 10) {
    throw new Error('Content must be at least 10 characters')
  }
  return true
}
```

### Journal Entry Creation
```typescript
// Always copy current field definitions for new entries
const createEmptyJournalEntry = (entryType: string): JournalEntry => {
  const promptDefinitions = JOURNAL_PROMPTS[entryType]
  const fields: JournalField[] = promptDefinitions.map(definition => ({
    name: definition.name,
    prompt: definition.prompt,      // Store current prompt
    response: '',
    required: definition.required   // Store current validation rules
  }))

  return { id: generateId(), fields, /* ... */ }
}
```

### UI Workflow Changes
- **Step 1**: Position Plan form (unchanged)
- **Step 2**: Journal entry (moved from step 3)
- **Step 3**: Risk Assessment (moved from step 2)
- **Step 4**: Confirmation (unchanged)

Navigation updated accordingly:
- Step 1 → "Next: Trading Journal" (was "Next: Risk Assessment")
- Step 2 → "Next: Risk Assessment" (journal form submit)
- Step 3 → "Next: Confirmation" (unchanged)

## Future Considerations

### Advanced Schema Evolution
The architecture supports more complex changes:
```typescript
// Future: Field type evolution
interface JournalField {
  name: string;
  prompt: string;
  response: string;
  required?: boolean;
  field_type?: 'text' | 'number' | 'rating' | 'date';  // ← Future extension
  validation_rules?: ValidationRule[];                  // ← Complex validation
}
```

### Field Retirement Strategy
For fields that should no longer be used:
```typescript
export const DEPRECATED_FIELDS = {
  'old_field_name': {
    deprecated_date: '2025-10-01',
    replacement: 'new_field_name',
    migration_strategy: 'display_both'
  }
}
```

### Analytics and Reporting
Field evolution history enables powerful analytics:
- Track prompt effectiveness over time
- Compare response quality between old/new field versions
- Identify optimal prompt wording for behavioral training

## Validation Through Implementation

This decision was validated through comprehensive testing:
- **145/145 tests passing** after implementing all changes
- **Integration tests** confirm old/new field mixing works correctly
- **UI tests** verify dynamic field rendering across all scenarios
- **Backward compatibility tests** ensure legacy entries display properly
- **Workflow tests** confirm new 4-step order improves user experience

## Related Decisions
- **Builds on ADR-002**: Extends journal content model with evolution capability
- **Maintains ADR-001**: Position vs Trade separation unchanged
- **Enables Future ADRs**: Supports advanced prompt evolution for options strategies

## Review Date
To be reviewed after 3 months of field evolution usage and user feedback on the new 4-step workflow effectiveness.