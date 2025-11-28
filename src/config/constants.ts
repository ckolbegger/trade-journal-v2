/**
 * Application-wide configuration constants
 */

/**
 * Percentage threshold for price change that requires user confirmation
 * Used by PriceValidator to determine when a price update is significant
 */
export const PRICE_CHANGE_THRESHOLD_PERCENT = 20

/**
 * Tolerance for comparing planned vs actual execution prices
 * Used in plan vs execution analysis to account for minor price variations
 */
export const PLAN_VS_EXECUTION_TOLERANCE = 0.01

/**
 * Default decimal precision for calculations and display
 */
export const DECIMAL_PRECISION = 2
