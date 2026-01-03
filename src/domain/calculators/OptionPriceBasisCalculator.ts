/**
 * Option Price Basis Calculator
 *
 * Converts option price basis values to dollar amounts for display.
 *
 * For option positions (e.g., Short Put), the profit_target and stop_loss can be
 * specified relative to either the stock price or the option price:
 *
 * - stock_price basis: Use raw dollar values (no conversion needed)
 * - option_price basis: Convert percentage to dollar value using (strike_price - premium) × percentage
 *
 * Examples:
 * - Strike $100, Premium $3, Basis='option_price', Target=20% → ($100 - $3) × 0.20 = $19.40
 * - Strike $95, Premium $2.50, Basis='stock_price', Target=$105 → profit_target = $105 (no conversion)
 */

export type PriceBasis = 'stock_price' | 'option_price'
export type TargetType = 'dollar' | 'percentage' | 'percentage_decimal'

export interface OptionBasisCalculationParams {
  /** The strike price of the option contract */
  strikePrice: number
  /** The premium received per contract (in dollars) */
  premium: number
  /** Whether the target is based on stock_price or option_price */
  basis: PriceBasis
  /** The target value (dollars for stock_price basis, percentage for option_price basis) */
  targetValue: number
  /** Type of target value: 'dollar' for stock_price basis, 'percentage' or 'percentage_decimal' for option_price basis */
  targetType: TargetType
}

/**
 * Calculates the effective dollar value for profit_target or stop_loss based on price basis.
 *
 * For stock_price basis: Returns the raw dollar value (no conversion)
 * For option_price basis: Converts percentage to dollar value using (strike_price - premium) × percentage
 *
 * @param params - Calculation parameters including strike, premium, basis, target value, and target type
 * @returns The effective dollar value
 *
 * @example
 * // Option price basis: Strike $100, Premium $3, Target 20% → $19.40
 * calculateOptionBasisDollarValue({
 *   strikePrice: 100,
 *   premium: 3,
 *   basis: 'option_price',
 *   targetValue: 20,
 *   targetType: 'percentage'
 * })
 * // Returns: 19.40
 *
 * @example
 * // Stock price basis: Target $105 → $105 (no conversion)
 * calculateOptionBasisDollarValue({
 *   strikePrice: 95,
 *   premium: 2.50,
 *   basis: 'stock_price',
 *   targetValue: 105,
 *   targetType: 'dollar'
 * })
 * // Returns: 105
 */
export function calculateOptionBasisDollarValue(params: OptionBasisCalculationParams): number {
  const { strikePrice, premium, basis, targetValue, targetType } = params

  if (basis === 'stock_price') {
    // For stock_price basis, return the raw dollar value (no conversion needed)
    return targetValue
  }

  // For option_price basis, convert percentage to dollar value
  // Formula: (strike_price - premium) × percentage
  const optionValue = strikePrice - premium

  if (targetType === 'percentage') {
    // targetValue is a percentage like 20 (for 20%)
    return optionValue * (targetValue / 100)
  } else if (targetType === 'percentage_decimal') {
    // targetValue is a decimal like 0.20 (for 20%)
    return optionValue * targetValue
  }

  // targetType is 'dollar' but basis is 'option_price' - this is inconsistent
  // but we'll still calculate it as a percentage of option value
  return optionValue * targetValue
}
