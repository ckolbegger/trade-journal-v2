/**
 * Price Service Contract
 *
 * Defines the interface for price entry and retrieval.
 * Extended for option pricing with OCC symbol support.
 */

/**
 * Price entry for an instrument on a specific date
 */
export interface PriceEntry {
  id: string
  instrument_id: string  // Stock symbol or OCC symbol
  date: string           // YYYY-MM-DD format
  close_price: number
  open?: number
  high?: number
  low?: number
  updated_at: Date
}

/**
 * Input for creating/updating a price entry
 */
export interface PriceInput {
  instrument_id: string
  date: string
  close_price: number
}

/**
 * Staleness check result
 */
export interface StalenessResult {
  /** Instruments with missing or stale prices */
  staleInstruments: string[]

  /** Whether all required prices are available */
  isComplete: boolean

  /** Last update date for each instrument */
  lastUpdates: Map<string, string>
}

/**
 * Price change confirmation request
 */
export interface PriceChangeConfirmation {
  instrument_id: string
  previous_price: number
  new_price: number
  change_percentage: number
  requires_confirmation: boolean
}

/**
 * Price Service Interface
 *
 * Provides price storage and retrieval for all instruments.
 */
export interface IPriceService {
  /**
   * Get price for an instrument on a specific date
   *
   * @param instrumentId - Stock symbol or OCC symbol
   * @param date - Date in YYYY-MM-DD format
   * @returns Price entry or null if not found
   */
  getPrice(instrumentId: string, date: string): Promise<PriceEntry | null>

  /**
   * Get latest price for an instrument (most recent date)
   *
   * @param instrumentId - Stock symbol or OCC symbol
   * @returns Latest price entry or null if none exist
   */
  getLatestPrice(instrumentId: string): Promise<PriceEntry | null>

  /**
   * Get prices for multiple instruments on a specific date
   *
   * @param instrumentIds - Array of instrument identifiers
   * @param date - Date in YYYY-MM-DD format
   * @returns Map of instrument_id to price entry
   */
  getPricesForDate(
    instrumentIds: string[],
    date: string
  ): Promise<Map<string, PriceEntry>>

  /**
   * Save a price entry (create or update)
   *
   * If price already exists for instrument+date, updates it.
   *
   * @param input - Price data
   * @returns Saved price entry
   */
  savePrice(input: PriceInput): Promise<PriceEntry>

  /**
   * Save multiple prices in a single transaction
   *
   * @param inputs - Array of price data
   * @returns Saved price entries
   */
  savePrices(inputs: PriceInput[]): Promise<PriceEntry[]>

  /**
   * Check price staleness for a position
   *
   * @param instrumentIds - All instruments in position
   * @param today - Today's date in YYYY-MM-DD format
   * @returns Staleness result with missing instruments
   */
  checkStaleness(
    instrumentIds: string[],
    today: string
  ): Promise<StalenessResult>

  /**
   * Check if price change requires confirmation
   *
   * @param instrumentId - Instrument being updated
   * @param newPrice - New price value
   * @returns Confirmation request if change > 20%
   */
  checkPriceChange(
    instrumentId: string,
    newPrice: number
  ): Promise<PriceChangeConfirmation>

  /**
   * Get all instruments that need prices for a position
   *
   * @param position - Position to analyze
   * @returns Array of instrument identifiers (stock + all OCC symbols)
   */
  getRequiredInstruments(position: {
    symbol: string
    trades: Array<{ occ_symbol?: string }>
  }): string[]

  /**
   * Delete all prices for an instrument
   *
   * @param instrumentId - Instrument to delete prices for
   */
  deletePricesForInstrument(instrumentId: string): Promise<void>
}
