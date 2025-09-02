# Trading Journal Mockup Design Decisions

This document tracks design decisions made during mockup creation to maintain consistency and alignment with the app vision.

## Overall Design System

### Color Palette
- **Primary Blue**: #3b82f6 (main CTA buttons, active states)
- **Secondary Blue**: #2563eb (hover states)
- **Dark Gray**: #1f2937 (headers, primary text)
- **Medium Gray**: #6b7280 (secondary text)
- **Light Gray**: #9ca3af (inactive states, icons)
- **Background Gray**: #f8fafc (main background)
- **Success Green**: #16a34a (positive P&L, checkmarks)
- **Success Green Light**: #dcfce7 (success backgrounds)
- **Warning/Alert Red**: #dc2626 (negative P&L, alerts)

### Typography
- **Font Family**: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
- **Header Size**: 18px (mobile app bar)
- **Title Size**: 24px (main page titles)
- **Body Size**: 16px (primary content)
- **Small Size**: 14px (secondary content)
- **Micro Size**: 12px (nav labels, metadata)

### Layout Standards
- **Mobile Container**: 414px max width (iPhone Pro Max reference)
- **Padding Standard**: 20px horizontal, 16px vertical for main content
- **Card Padding**: 16px internal padding
- **Button Padding**: 16px vertical, 32px horizontal for primary CTAs
- **Border Radius**: 8px for buttons and cards
- **Shadow**: 0 0 20px rgba(0,0,0,0.1) for main container

### Navigation Structure
- **Bottom Tab Navigation**: Positions, Journal, Settings
- **Fixed Positioning**: Bottom navigation stays visible during scroll
- **Active State**: Blue color (#3b82f6) for current tab

## Mockup-Specific Decisions

### Mockup 1: Empty App State

**Key Decisions Made:**
1. **Onboarding Approach**: Chose friendly, motivational empty state over tutorial overlay to reduce friction
2. **Primary CTA**: "Create Your First Position" directly launches core user flow
3. **Feature Highlighting**: Added 4 key benefits to build confidence before first use
4. **Visual Identity**: Used 📊 emoji as app icon placeholder (will be replaced with proper icon)
5. **Bottom Navigation**: Implemented immediately to establish information architecture

**Rationale:**
- Empty states should inspire action, not overwhelm with instructions
- Highlighting privacy-first approach addresses common trading app concerns
- Mobile-first design with fixed bottom nav follows native app conventions

### Mockup 2: Position Creation Flow

**Key Decisions Made:**
1. **Multi-Step Flow**: 4-step wizard (Setup → Risk → Journal → Confirm) plus success state
2. **Progressive Disclosure**: Break complex form into digestible chunks to reduce cognitive load
3. **Step Indicator**: Visual dots show progress and allow understanding of flow length
4. **Risk Calculator**: Real-time calculation of position metrics to aid decision-making
5. **Forced Journaling**: Step 3 dedicated entirely to documentation with multiple required fields
6. **Immutable Confirmation**: Final step requires explicit checkbox acknowledgment with warning styling
7. **Form Validation**: Strategic validation points prevent progression with incomplete data
8. **Success Animation**: Positive reinforcement after completion to build habit satisfaction

**Field Decisions:**
- **Trade Setup**: Symbol, strategy dropdown, entry/exit prices, quantity
- **Risk Assessment**: Auto-calculated metrics plus manual portfolio risk percentage
- **Journal Fields**: Trade thesis (required), market conditions, exit strategy
- **Confirmation**: Summary format with red warning styling for immutability

**Interaction Patterns:**
- Fixed bottom action bar with contextual button text
- Back button in header and bottom actions for flexible navigation
- Real-time form field dependencies (risk calculations)
- Disabled final action until user confirms understanding

**Rationale:**
- Multi-step reduces overwhelm while maintaining comprehensive data collection
- Risk calculator helps traders understand position impact before commitment
- Mandatory journaling builds disciplined decision-making habits
- Immutability warning ensures users understand the commitment they're making

---

*This document will be updated as each mockup is completed.*