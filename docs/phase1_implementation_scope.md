# Phase 1A Implementation Scope Guide

This document provides concrete guidance on what to build, stub, or prepare for in Phase 1A development, ensuring the architectural foundation supports all future phases without over-engineering the initial user experience.

## Overview: Build Comprehensive, Expose Simple

**Phase 1A Goal**: Create a robust architectural foundation that enables all future phases while providing a focused, simple stock trading experience to users.

**Strategy**: Implement complete data models and component architectures guided by the full mockup vision (04a-04d), but only expose stock functionality in the user interface.

---

## Data Models: Build Complete, Use Selectively

### Position Entity - IMPLEMENT FULLY
```typescript
interface Position {
  // Core fields (EXPOSE in Phase 1)
  id: string;
  symbol: string;
  strategy_type: 'stock' | 'covered_call' | 'bull_put_spread' | 'butterfly' | 'calendar'; // Only 'stock' in UI
  quantity: number;
  entry_target_price: number;
  profit_target_price: number;
  stop_loss_price: number;
  thesis: string;
  time_horizon: string;
  status: 'open' | 'closed';
  created_at: Date;
  
  // Options fields (INCLUDE but don't expose)
  strategy_config?: {
    legs: StrategyLeg[];
    max_profit?: number;
    max_loss?: number;
    breakeven_points?: number[];
  };
  
  // Future fields (INCLUDE for data completeness)
  portfolio_percentage?: number;
  invalidation_criteria?: string;
  predetermined_response?: string;
}

interface StrategyLeg {
  // Build this structure, use only for stock (single leg)
  leg_id: number;
  option_type?: 'CALL' | 'PUT';
  strike_price?: number;
  expiration_date?: Date;
  quantity: number;
  action: 'BUY' | 'SELL';
  target_price: number;
}
```

**Phase 1 Usage**: Only use first leg with `option_type: null`, treat as stock position
**Future Benefit**: Multi-leg options strategies slot in without data migration

### Trade Entity - IMPLEMENT FULLY
```typescript
interface Trade {
  // Core fields (EXPOSE all)
  id: string;
  position_id: string;
  leg_id: number; // Always 1 for Phase 1 stock trades
  trade_type: 'BUY' | 'SELL' | 'ASSIGNMENT' | 'EXERCISE' | 'EXPIRATION';
  quantity: number;
  actual_price: number;
  execution_date: Date;
  
  // Options fields (INCLUDE but unused in Phase 1)
  option_type?: 'CALL' | 'PUT';
  strike_price?: number;
  expiration_date?: Date;
  
  // Future fields
  commission?: number;
  notes?: string;
}
```

**Phase 1 Usage**: Only `BUY`/`SELL` trade types, options fields always null
**Future Benefit**: Options trades work with same FIFO matching logic

### Journal Entry - IMPLEMENT FULLY
```typescript
interface JournalEntry {
  // All fields used in Phase 1
  id: string;
  position_id: string;
  type: 'position_plan' | 'progress_update' | 'position_closed' | 'market_event';
  content: string;
  created_at: Date;
  
  // Future enhancement fields
  tags?: string[];
  market_conditions?: string;
  emotional_state?: number; // 1-5 scale
  ai_analysis?: string; // Future LLM insights
}
```

---

## UI Components: Strategy-Adaptive Architecture

### 1. Position Creation Flow - BUILD FRAMEWORK, EXPOSE STOCK

**02-position-creation-flow.html Implementation:**

```typescript
// Build complete component, render based on strategy
function PositionCreationFlow({ strategy_type = 'stock' }) {
  // IMPLEMENT: Full multi-step wizard framework
  // EXPOSE: Only stock strategy in dropdown
  
  const steps = [
    { id: 'setup', component: StrategySetupStep },     // ✅ Build adaptive, show stock only
    { id: 'risk', component: RiskAssessmentStep },     // ✅ Build complete
    { id: 'journal', component: JournalEntryStep },    // ✅ Build complete  
    { id: 'confirm', component: ConfirmationStep }     // ✅ Build complete
  ];
  
  // Strategy selection dropdown
  const availableStrategies = [
    { id: 'stock', name: 'Long Stock', phase: 1 },
    // INCLUDE but don't expose:
    // { id: 'covered_call', name: 'Covered Call', phase: 3 },
    // { id: 'bull_put_spread', name: 'Bull Put Spread', phase: 4 }
  ];
}

// Strategy Setup Step - BUILD ADAPTIVE
function StrategySetupStep({ strategy_type }) {
  if (strategy_type === 'stock') {
    return <StockSetupForm />;  // EXPOSE: Simple stock form
  }
  // INCLUDE framework for future:
  // if (strategy_type === 'covered_call') return <CoveredCallSetupForm />;
  // if (strategy_type === 'bull_put_spread') return <SpreadSetupForm />;
}
```

**What to Build**: Complete wizard framework with strategy-adaptive steps
**What to Expose**: Only stock strategy selection and forms
**Future Benefit**: Adding covered calls just requires exposing existing components

### 2. Position Dashboard - BUILD FULL ALGORITHM, SIMPLE DATA

**03-position-dashboard.html Implementation:**

```typescript
// IMPLEMENT: Complete attention-based prioritization
function PositionDashboard() {
  const positions = usePositions();
  
  // BUILD: Full attention algorithm (works with mixed portfolios)
  const prioritizedPositions = useMemo(() => {
    return prioritizeByAttention(positions, {
      volatility_weight: 0.4,      // Ready for options Greeks
      time_decay_weight: 0.3,      // Ready for time-sensitive strategies  
      position_size_weight: 0.3,   // Works for all strategies
      // proximity_to_targets: 0.2  // INCLUDE logic, not used yet
    });
  }, [positions]);
  
  return (
    <div>
      <PortfolioSummary positions={positions} />  {/* EXPOSE: Stock stats only */}
      <FilterTabs />                               {/* BUILD: Complete filter system */}
      <PositionList positions={prioritizedPositions} /> {/* EXPOSE: Stock cards only */}
    </div>
  );
}

// BUILD: Strategy-adaptive position card
function PositionCard({ position }) {
  // Render based on strategy complexity
  if (position.strategy_type === 'stock') {
    return <StockPositionCard position={position} />;  // EXPOSE
  }
  // INCLUDE but don't expose:
  // if (position.strategy_type === 'covered_call') return <CoveredCallCard />;
  // if (position.strategy_type === 'bull_put_spread') return <SpreadCard />;
}
```

**What to Build**: Complete dashboard with attention algorithm and filtering
**What to Expose**: Only stock position cards and simple portfolio stats
**Future Benefit**: Mixed stock/options portfolios work with same prioritization

### 3. Position Detail Views - BUILD ADAPTIVE, EXPOSE STOCK

**04-position-detail-view.html + 04a-04d Implementation:**

```typescript
// BUILD: Strategy-adaptive detail view router
function PositionDetailView({ position_id }) {
  const position = usePosition(position_id);
  
  // Route to appropriate detail component based on strategy
  switch (position.strategy_type) {
    case 'stock':
      return <StockPositionDetail position={position} />; // EXPOSE
    // INCLUDE but don't expose:
    // case 'covered_call':
    //   return <CoveredCallDetail position={position} />;
    // case 'bull_put_spread': 
    //   return <BullPutSpreadDetail position={position} />;
    default:
      return <StockPositionDetail position={position} />;
  }
}

// Stock Position Detail - IMPLEMENT FULLY (04-position-detail-view.html)
function StockPositionDetail({ position }) {
  return (
    <div>
      <PerformanceHeader position={position} />    {/* BUILD: Adaptive to strategy */}
      <ManualPriceUpdate position={position} />    {/* BUILD: Multi-instrument ready */}
      <ProgressIndicator position={position} />    {/* BUILD: Strategy-aware progress */}
      <ImmutablePlan position={position} />        {/* BUILD: Multi-leg display ready */}
      <TradeHistory position={position} />         {/* BUILD: FIFO visualization */}
      <JournalSection position={position} />       {/* BUILD: Complete */}
    </div>
  );
}

// INCLUDE: Advanced strategy components (don't expose)
// function CoveredCallDetail() { /* Implementation ready */ }
// function BullPutSpreadDetail() { /* Implementation ready */ }
```

**What to Build**: Complete strategy-adaptive architecture with all detail components
**What to Expose**: Only stock position detail view
**Future Benefit**: Options strategies activate by changing route logic

---

## Calculation Engines: Full Framework, Stock Calculations

### P&L Calculation Engine - BUILD COMPLETE

```typescript
// BUILD: Strategy-aware calculation engine
class PnLCalculationEngine {
  // EXPOSE: Stock P&L calculation
  calculateStockPnL(position: Position, trades: Trade[], current_price: number) {
    const { avgCost, remainingQuantity } = this.calculateFIFOCostBasis(trades);
    return (current_price - avgCost) * remainingQuantity;
  }
  
  // INCLUDE: Options calculation framework (not exposed)
  // calculateOptionsPnL(position: Position, trades: Trade[], pricing: PricingData) {
  //   return position.strategy_config.legs.reduce((total, leg) => {
  //     return total + this.calculateLegPnL(leg, trades, pricing);
  //   }, 0);
  // }
  
  // BUILD: FIFO cost basis (used by all strategies)
  calculateFIFOCostBasis(trades: Trade[]) {
    // Complete FIFO implementation for accurate cost basis tracking
    // Works for both stock and options (per instrument)
  }
}
```

### Risk Calculation Engine - BUILD COMPLETE

```typescript
class RiskCalculationEngine {
  // EXPOSE: Simple stock risk metrics
  calculateStockRisk(position: Position, current_price: number) {
    return {
      current_risk: Math.abs(current_price - position.stop_loss_price) * position.quantity,
      distance_to_stop: current_price - position.stop_loss_price,
      // profit_captured_pct: calculateProfitCaptured(position, current_price)
    };
  }
  
  // INCLUDE: Complex strategy risk calculations
  // calculateSpreadRisk(position: Position, pricing: PricingData) {
  //   const { max_loss, breakeven_points } = position.strategy_config;
  //   return {
  //     max_risk: max_loss,
  //     distance_to_breakevens: breakeven_points.map(bp => pricing.underlying - bp)
  //   };
  // }
}
```

---

## Manual Price Update System: Multi-Instrument Ready

### Price Update Architecture - BUILD COMPLETE

```typescript
// BUILD: Multi-instrument price update system
interface PriceUpdateRequest {
  position_id: string;
  pricing_data: {
    underlying_price: number;           // EXPOSE: Always used
    option_prices?: OptionPricing[];    // INCLUDE: Options pricing
    spread_price?: number;              // INCLUDE: Spread-specific pricing
  };
}

interface OptionPricing {
  option_type: 'CALL' | 'PUT';
  strike_price: number;
  expiration_date: Date;
  bid: number;
  ask: number;
  last: number;
}

// Manual Price Update Component - BUILD ADAPTIVE
function ManualPriceUpdate({ position }) {
  // EXPOSE: Single stock price input
  if (position.strategy_type === 'stock') {
    return (
      <PriceUpdateCard>
        <input 
          type="number" 
          placeholder="Stock Price" 
          onChange={handleStockPriceUpdate}  // Updates all calculations
        />
      </PriceUpdateCard>
    );
  }
  
  // INCLUDE: Multi-instrument pricing (Phase 3+)
  // if (position.strategy_type === 'covered_call') {
  //   return (
  //     <PriceUpdateCard>
  //       <input placeholder="Stock Price" />
  //       <input placeholder="Call Option Price" />
  //     </PriceUpdateCard>
  //   );
  // }
}
```

**What to Build**: Complete multi-instrument price update architecture
**What to Expose**: Single stock price input
**Future Benefit**: Options strategies get multi-input pricing without refactoring

---

## Mockup-by-Mockup Implementation Guide

### Mockup 1: Empty App State (01-empty-app-state.html)
**Phase 1 Implementation**: ✅ Full implementation
- Build complete onboarding flow with feature highlights
- Include bottom navigation structure for all phases
- **Framework Preparation**: Ready for additional feature highlights when options phases activate

**Implementation Notes**:
- Clean, motivational empty state with clear CTA
- Bottom navigation structure established for future features
- Feature highlights should be generic enough to work when options are added

### Mockup 2: Position Creation Flow (02-position-creation-flow.html)
**Phase 1 Implementation**: ✅ Complete wizard framework, stock-only exposure
- **Build**: Full 4-step wizard with strategy-adaptive components
- **Expose**: Only stock strategy in dropdown selection  
- **Prepare**: Include covered call, spread strategy components (disabled/hidden)

**Component Architecture Pattern**:
```typescript
function StrategySetupStep({ strategy_type }) {
  switch (strategy_type) {
    case 'stock': return <StockSetupForm />;        // EXPOSE
    case 'covered_call': return <CoveredCallForm />; // BUILD, don't expose
    case 'bull_put_spread': return <SpreadForm />;   // BUILD, don't expose
    default: return <StockSetupForm />;
  }
}

// Strategy selection dropdown
const availableStrategies = [
  { id: 'stock', name: 'Long Stock', enabled: true },
  // Phase 3+: { id: 'covered_call', name: 'Covered Call', enabled: false }
];
```

**Key Implementation Points**:
- Multi-step wizard framework must be strategy-agnostic
- Risk calculation engine must handle all strategy types
- Form validation should work for both simple and complex strategies

### Mockup 2b: Add Trade Flow (02b-add-trade-flow.html)
**Phase 1 Implementation**: ✅ Full implementation
- Trade execution against position plan
- FIFO cost basis tracking implementation
- Plan vs actual execution comparison

**Architecture Notes**:
- Trade entity must support all future instrument types
- FIFO matching logic must work for options (separate cost basis per contract)
- Execution tracking framework scales to multi-leg strategies

### Mockup 3: Position Dashboard (03-position-dashboard.html)
**Phase 1 Implementation**: ✅ Full attention algorithm, stock cards only
- **Build**: Complete prioritization system that works with mixed portfolios
- **Expose**: Only stock position cards and simple portfolio stats
- **Prepare**: Multi-strategy filtering and advanced portfolio metrics

**Critical Architecture Requirements**:
```typescript
// Attention algorithm must handle future options metrics
function prioritizeByAttention(positions) {
  return positions.sort((a, b) => {
    const aScore = calculateAttentionScore(a, {
      volatility_weight: 0.4,      // Stock volatility now, options Greeks later
      time_decay_weight: 0.3,      // Not used for stock, critical for options
      position_size_weight: 0.3,   // Works for all strategies
    });
    return bScore - aScore;
  });
}

// Position card must render based on strategy type
function PositionCard({ position }) {
  if (position.strategy_type === 'stock') {
    return <StockPositionCard position={position} />; // EXPOSE
  }
  // Framework ready for: <CoveredCallCard />, <SpreadCard />, etc.
}
```

### Mockup 4: Stock Position Detail (04-position-detail-view.html)
**Phase 1 Implementation**: ✅ Full implementation as primary target
- Complete detail view matching mockup exactly
- Manual price update system (multi-instrument ready architecture)
- FIFO cost basis visualization in trade history

**Key Architecture Elements**:
- Price update component must support future multi-instrument pricing
- Progress indicator must adapt to different strategy risk/reward profiles
- Trade history must show FIFO matching clearly for educational purposes

### Mockups 4a-4d: Strategy-Specific Detail Views
**Phase 1 Implementation**: 🏗️ Framework only, not exposed to users

#### 4a: Covered Call Detail (04a-covered-call-detail-view.html)
**Build Framework For**:
- Dual pricing model (stock price + option price inputs)
- Option leg visualization with strike and expiration
- Time decay benefit display
- Assignment risk indicators

**Component Pattern**:
```typescript
function CoveredCallDetail({ position }) {
  return (
    <div>
      <PerformanceHeader position={position} />
      <DualPriceUpdate position={position} />      {/* Stock + Option inputs */}
      <LegVisualization legs={position.legs} />     {/* Stock + Short Call */}
      <RiskMetrics position={position} />           {/* Assignment risk, time decay */}
      <TradeHistory position={position} />
      <JournalSection position={position} />
    </div>
  );
}
```

#### 4b: Bull Put Spread Detail (04b-bull-put-spread-detail-view.html)  
**Build Framework For**:
- Spread pricing model (single spread value input)
- Two-leg visualization (short put + long put)
- Dual breakeven point display
- Max profit/loss zone visualization

#### 4c: Long Call Butterfly Detail (04c-long-call-butterfly-detail-view.html)
**Build Framework For**:
- Range-based progress visualization
- Three-leg structure display (long-short-long)
- Optimal profit zone indicators
- Non-linear P&L visualization

#### 4d: Calendar Spread Detail (04d-call-calendar-spread-detail-view.html)
**Build Framework For**:
- Time-based visualization with DTE indicators
- Different expiration date handling
- Differential time decay display
- Optimal position management (near strike)

**Validation Test**: Changing `position.strategy_type` should render appropriate detail view without code changes.

### Mockup 5: Position Closing Flow (05-position-closing-flow.html)
**Phase 1 Implementation**: ✅ Full educational closing system
- 4-step educational process with plan vs execution comparison
- Structured reason selection for all strategy types
- Performance analysis that scales to complex strategies

**Architecture Notes**:
- Closing reason categories must work for both stock and options
- Plan vs execution framework must handle multi-leg strategies
- Educational lessons should be strategy-specific

### Mockup 6: Journal History View (06-journal-history-view.html)
**Phase 1 Implementation**: ✅ Full implementation
- Complete search, filtering, and insights system
- Strategy-agnostic journaling (works for all position types)
- AI insights integration points prepared

**Implementation Priority Summary**:

### Phase 1A: Full User-Facing Implementation
- ✅ **01-empty-app-state.html** - Complete onboarding
- ✅ **02-position-creation-flow.html** - Stock strategy wizard
- ✅ **02b-add-trade-flow.html** - Trade execution system
- ✅ **03-position-dashboard.html** - Stock position dashboard
- ✅ **04-position-detail-view.html** - Stock position management
- ✅ **05-position-closing-flow.html** - Educational closing system
- ✅ **06-journal-history-view.html** - Complete journaling system

### Phase 1A: Framework Built, Not Exposed  
- 🏗️ **04a-covered-call-detail-view.html** - Component ready, routing disabled
- 🏗️ **04b-bull-put-spread-detail-view.html** - Component ready, routing disabled
- 🏗️ **04c-long-call-butterfly-detail-view.html** - Component ready, routing disabled  
- 🏗️ **04d-call-calendar-spread-detail-view.html** - Component ready, routing disabled

---

## Success Validation

### Phase 1A Completion Criteria

**User Experience Validation:**
- ✅ Simple, focused stock trading interface
- ✅ No confusing options terminology or complexity
- ✅ All behavioral training features work perfectly (immutable plans, journaling)
- ✅ Manual price updates provide real-time P&L calculation

**Architecture Validation:**  
- ✅ Data models accommodate all mockup strategies
- ✅ UI components render different strategies appropriately  
- ✅ Calculation engines handle both simple and complex scenarios
- ✅ No major refactoring needed to activate Phase 3+ features

**Future-Proofing Test:**
1. Change `strategy_type` from 'stock' to 'covered_call' → should render covered call interface
2. Add option legs to position → should display multi-leg UI components  
3. Enable advanced strategy selection → should show options in dropdown
4. Activate complex calculations → should show spread P&L and risk metrics

If all tests pass without code rewrites, the architecture successfully supports the full mockup vision while maintaining Phase 1 simplicity.