# Research: Short Put Strategy Support

**Feature**: 002-short-put-strategy
**Date**: 2025-12-27
**Status**: Complete

This research resolves technical context clarifications and documents the key implementation decisions for short put support.

## Decision: Use existing React + IndexedDB architecture with schema migration to v4
**Rationale**: The app is a local-first SPA with IndexedDB persistence; extending the current schema preserves privacy-first guarantees and avoids new infrastructure.
**Alternatives considered**: Introducing a backend API or a second storage layer; rejected due to privacy constraints and added complexity.

## Decision: Represent option legs via OCC symbol and trade_kind discriminator
**Rationale**: The spec defines OCC as the unique instrument identifier; a trade_kind + occ_symbol model supports multi-leg strategies without a new Leg entity.
**Alternatives considered**: Creating a separate Leg table with joins; rejected for additional complexity and migration risk.

## Decision: Share price entries by instrument_id + date
**Rationale**: Shared pricing avoids duplicate entries when the same stock/option appears in multiple positions (FR-029, FR-030) and matches existing PriceService patterns.
**Alternatives considered**: Storing prices per position; rejected because it prevents reuse and complicates staleness warnings.

## Decision: Compute intrinsic/extrinsic values from stored stock and option prices
**Rationale**: Intrinsic = max(0, strike - stock) for puts and extrinsic = option - intrinsic satisfies FR-010/FR-011 and is deterministic without external APIs.
**Alternatives considered**: Delayed calculations via external quotes; rejected by privacy-first constraints.

## Decision: Maintain FIFO cost basis per instrument (stock symbol or OCC)
**Rationale**: Required by FR-020 and aligns with existing FIFO methodology in the codebase and constitution principle VIII.
**Alternatives considered**: Average-cost or user-selected lot matching; rejected because it diverges from the constitution and brokerage-aligned FIFO.

## Decision: Assignment recorded as BTC at $0 with stock position creation
**Rationale**: Mirrors brokerage flows and provides an immutable audit trail; premium adjustment stored on resulting stock trade (FR-015–FR-018).
**Alternatives considered**: Collapsing assignment into a single position transform; rejected because it obscures the original option execution history.
