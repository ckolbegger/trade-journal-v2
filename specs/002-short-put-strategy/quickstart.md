# Quickstart Guide: Short Put Strategy Support

**Feature**: 002-short-put-strategy
**Date**: 2025-12-27
**For**: Developers implementing this feature

## Overview

This guide covers setup, testing, and the key implementation touchpoints for adding short put strategy support with option trades, shared price entries, and assignment flows.

## Prerequisites

- Node.js 18+
- Git repository cloned
- Familiarity with TypeScript, React, and IndexedDB

## Environment Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

### 3. Run Tests

```bash
npm test
npm run test:run
npm run test:coverage
npm run test:ui
```

## Project Structure (for this feature)

```
src/
├── services/
│   ├── TradeService.ts       # EXTEND: option trades, FIFO per instrument
│   ├── PositionService.ts    # EXTEND: option plan fields, status derivation
│   ├── PriceService.ts       # EXTEND: instrument_id-based price storage
│   └── SchemaManager.ts      # EXTEND: v4 migration
├── lib/
│   ├── position.ts           # EXTEND: strategy_type, trade_kind, option fields
│   └── utils/                # NEW: OCC symbol + intrinsic/extrinsic helpers
├── components/
│   ├── positions/            # EXTEND: strategy badges, assignment modal
│   ├── trades/               # EXTEND: option trade form (STO/BTC)
│   └── prices/               # EXTEND: price entry by instrument
└── pages/
    ├── Dashboard/            # EXTEND: option summaries
    └── PositionDetail/       # EXTEND: option legs, intrinsic/extrinsic display

specs/002-short-put-strategy/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── contracts/
│   └── openapi.yaml
└── quickstart.md
```

## Key Concepts

### OCC Symbol Derivation

Option trades derive a unique OCC symbol from the underlying, expiration, type, and strike:

```
SYMBOL YYMMDD T PPPPPPPP
```

Example: `AAPL  250117P00105000`

### Intrinsic vs Extrinsic Value (Put)

```typescript
const intrinsic = Math.max(0, strikePrice - stockPrice)
const extrinsic = optionPrice - intrinsic
```

### Assignment Flow

1. Record assignment on/after expiration date.
2. Create BTC trade at $0.00 for assigned contracts.
3. Create new stock position with cost basis = strike - premium received per share.
4. Prompt journal entry with assignment-specific prompts.

## Development Workflow (TDD Required)

### 1. Write Integration Tests First

```typescript
it('records a short put STO trade and opens journaling', async () => {
  // create position plan with short put fields
  // add STO trade
  // assert trade saved, status open, journal prompt appears
})
```

### 2. Run Tests (Red)

```bash
npm test -- short-put
```

### 3. Implement Services and UI (Green)

- Extend `PositionService` to store option plan fields and derive status.
- Extend `TradeService` to validate option trades and FIFO per instrument.
- Extend `PriceService` to use `instrument_id` instead of `underlying`.
- Update UI forms and detail views for option fields, intrinsic/extrinsic display.

### 4. Refactor and Verify (Refactor)

Ensure all integration tests pass and legacy long stock tests remain green.
