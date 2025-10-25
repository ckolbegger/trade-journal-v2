/**
 * Price history data for a specific underlying instrument on a specific date.
 * Uses OHLC (Open/High/Low/Close) structure for future charting capabilities.
 * Only the close price is used for P&L calculations.
 */
export interface PriceHistory {
  /** Unique identifier for this price record */
  id: string;

  /**
   * The underlying instrument symbol
   * Stock symbols (e.g., "AAPL", "TSLA") for Phase 1A
   * OCC option symbols (e.g., "AAPL  250117C00150000") for Phase 3+
   */
  underlying: string;

  /** Date in YYYY-MM-DD format for this price data */
  date: string;

  /** Opening price for the day (auto-filled to close value in Phase 1A) */
  open: number;

  /** Highest price during the day (auto-filled to close value in Phase 1A) */
  high: number;

  /** Lowest price during the day (auto-filled to close value in Phase 1A) */
  low: number;

  /**
   * Closing price used for all P&L calculations
   * This is the primary price field for position valuation
   */
  close: number;

  /**
   * Timestamp when this price record was last updated by the user
   * Used for tracking when price data was entered/modified
   */
  updated_at: Date;
}

/**
 * Parameters for creating or updating a price record
 */
export interface PriceHistoryInput {
  /** The underlying instrument symbol */
  underlying: string;

  /** Date in YYYY-MM-DD format */
  date: string;

  /** Closing price (required) */
  close: number;

  /** Optional opening price (defaults to close if not provided) */
  open?: number;

  /** Optional high price (defaults to close if not provided) */
  high?: number;

  /** Optional low price (defaults to close if not provided) */
  low?: number;
}

/**
 * Result of price validation operations
 */
export interface PriceValidationResult {
  /** Whether the price passed validation */
  isValid: boolean;

  /** Error message if validation failed */
  errorMessage?: string;

  /** Whether user confirmation is required for large price changes */
  requiresConfirmation: boolean;

  /** Percentage change from previous price (if available) */
  percentChange?: number;

  /** Previous price for comparison */
  previousPrice?: number;
}