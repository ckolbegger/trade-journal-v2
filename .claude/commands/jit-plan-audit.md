---
description: Audit implementation plans for premature implementation using Just-In-Time principles.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Purpose

Apply Just-In-Time (JIT) auditing to any implementation plan to identify code being built before it's actually needed. JIT implementation means:
- Only build what the current user story needs
- Defer utilities, calculations, and types until they're immediately required
- Avoid "just in case" code or anticipatory implementations

## When to Use

Apply this skill when:
- Reviewing any tasks.md or implementation plan
- Starting a new feature implementation
- Planning dependencies and utilities
- Before creating a "foundational" or "setup" phase
- Planning utilities that might be "nice to have later"

## Core Audit Questions

For EVERY item in the plan, ask these questions:

### 1. Dependency Audit
```
Q: Does this code depend on data/variables created in a LATER user story?
   - Calculations that use values not yet defined
   - Services that reference entities not yet created
   - Type extensions for types introduced in future phases

   PATTERN: "If X is in Story 5, but Y uses X and Y is in Story 3..."
   → RED FLAG: Y should be deferred to Story 5
```

### 2. Usage Audit
```
Q: Is this code actually CALLED by any user story BEFORE the current phase?
   - Utilities with no callers in current story
   - Services with no methods invoked yet
   - Calculations with no inputs available yet

   PATTERN: "This calculator exists but prices aren't entered until Phase 6"
   → RED FLAG: Defer calculator to Phase 6
```

### 3. Speculation Audit
```
Q: Is this code being built "just in case" a future story needs it?
   - "We might need this later"
   - "Future stories will require this"
   - Anticipatory frameworks or utilities

   PATTERN: "Let's build the full validator framework now"
   → RED FLAG: Build minimal inline validators, extend later
```

### 4. Data Flow Audit
```
Q: Does this code produce output that no current user story CONSUMES?
   - Calculated values not displayed anywhere
   - Derived state not used in UI
   - Transformations with no downstream consumer

   PATTERN: "This calculates risk-reward but no story displays it"
   → RED FLAG: Defer until a story needs to display it
```

## Generalization Patterns

| Premature Pattern | JIT Transformation |
|-------------------|-------------------|
| Calculator before inputs exist | Defer to story that provides inputs |
| Full utility before partial need | Build minimal inline version, extend later |
| Type extension before usage | Extend types in the story that uses them |
| Service before any consumer | Create service when first called |
| Validator framework before validation needs | Inline validators first, extract later |
| "Just in case" code | Remove, implement inline when actually needed |

## Audit Process

### Step 1: Map Data Dependencies
For each calculation, utility, or service:
1. List all inputs/variables it uses
2. Note which story introduces each input
3. If any input comes from a LATER story → flag for deferral

### Step 2: Map Callers/Consumers
For each utility, service, or calculation:
1. List all code that calls/uses it
2. Note which story each caller belongs to
3. If no callers in current or earlier stories → flag for deferral

### Step 3: Identify Speculative Code
Look for:
- "Foundation" or "Setup" phases before user stories
- Utilities described as "we'll need this later"
- Full frameworks when only partial functionality is needed

### Step 4: Generate Recommendations

For each flagged item:
| Item | Built In | Actually Needed In | Recommendation |
|------|----------|-------------------|----------------|
| P&L Calculator | Phase 2 | Phase 6 | Defer to Phase 6 |
| OCC Utilities | Phase 2 | Phase 4 | Move to Phase 4 |
| Validator Framework | Phase 1 | Phase 1+ | Build inline, extract later |

## Output Format

When you complete the audit, output:

```markdown
## JIT Audit Results

### Premature Implementations Found
| Item | Built In | Needed In | Recommendation |
|------|----------|-----------|----------------|
| [name] | [phase] | [phase] | [action] |

### Just-In-Time Score
X/Y items follow JIT principle (Z%)

### Recommendations
1. Move [item] from [early phase] to [correct phase]
2. Remove [item] entirely, implement inline when needed
3. Keep [item] - it's needed by [current story]
4. Convert [item] to minimal inline version in [story]
```

## Example Audit

### Plan Before Audit:
```
Phase 1 (Setup): Build P&L calculator, OCC utilities, validator framework
Phase 2: Create position
Phase 3: Add trade
...
Phase 6: Price entry
```

### Audit Findings:
| Item | Issue |
|------|-------|
| P&L Calculator | Uses prices not available until Phase 6 → DEFER |
| OCC Utilities | Only needed when executing trade in Phase 3 → MOVE |
| Validator Framework | Only symbol validation needed now → INLINE |

### Plan After Audit:
```
Phase 1: Create position (inline validators only)
Phase 2: Add trade (OCC utilities here)
Phase 3: Close trade (realized P&L only)
...
Phase 6: Price entry (extend P&L with unrealized, intrinsic/extrinsic)
```

## Key Principles

1. **Build only what the current user story needs**
2. **Defer everything else** - you know more after completing each story
3. **Inline first, extract later** - don't build frameworks upfront
4. **Types evolve with implementation** - extend when actually used
5. **No "just in case" code** - if you can't name the caller now, defer it

## Key Rules

- Use absolute paths for all file references
- ERROR if items are built before their dependencies exist
- ERROR if items are built with no current consumer
- If unsure whether code is premature, ASK: "What user story needs this RIGHT NOW?"
