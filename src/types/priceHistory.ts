/**
 * Price History Type Definitions
 *
 * Stores OHLC (Open, High, Low, Close) price data for financial instruments.
 * Each record represents price data for a specific underlying on a specific date.
 */

/**
 * Price history record containing OHLC data for an underlying instrument.
 *
 * Key design principles:
 * - One record per underlying per date (enforced by compound unique index)
 * - OHLC structure follows financial industry standards
 * - Phase 1A: Simple UI (single price input) auto-fills all OHLC fields with same value
 * - Phase 3+: Full OHLC data enables advanced visualizations (candlestick charts, etc.)
 * - Always use `close` price for P&L calculations
 */
export interface PriceHistory {
  /**
   * Unique identifier for this price record
   */
  id: string;

  /**
   * The underlying instrument identifier
   * - Stock: Ticker symbol (e.g., "AAPL", "TSLA")
   * - Option: OCC symbol format (e.g., "AAPL  250117C00150000")
   *
   * This field links to Trade.underlying for price lookups.
   */
  underlying: string;

  /**
   * Date for this price data in YYYY-MM-DD format
   *
   * Combined with `underlying`, forms a compound unique index ensuring
   * only one price record exists per instrument per date.
   */
  date: string;

  /**
   * Opening price for the trading day
   *
   * Phase 1A: Auto-filled with same value as close price
   * Phase 3+: Can be manually set or imported from data source
   */
  open: number;

  /**
   * Highest price during the trading day
   *
   * Phase 1A: Auto-filled with same value as close price
   * Phase 3+: Can be manually set or imported from data source
   */
  high: number;

  /**
   * Lowest price during the trading day
   *
   * Phase 1A: Auto-filled with same value as close price
   * Phase 3+: Can be manually set or imported from data source
   */
  low: number;

  /**
   * Closing price for the trading day
   *
   * **CRITICAL**: This is the ONLY price used for P&L calculations.
   * All profit/loss computations use this field exclusively.
   *
   * Phase 1A: User enters this value via "Current Price" input
   * Phase 3+: Can be end-of-day closing price from market data
   */
  close: number;

  /**
   * Timestamp when this record was last updated
   *
   * Automatically set by PriceService on create/update operations.
   * Used for displaying "Last updated" information in UI.
   */
  updated_at: Date;
}

/**
 * Input data for creating or updating a price record
 *
 * Omits computed fields (id, updated_at) that are managed by PriceService.
 */
export interface PriceHistoryInput {
  underlying: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

/**
 * Simplified input for Phase 1A where user enters single price
 *
 * The PriceService will auto-fill open/high/low with the close value.
 */
export interface SimplePriceInput {
  underlying: string;
  date: string;
  close: number;
}
