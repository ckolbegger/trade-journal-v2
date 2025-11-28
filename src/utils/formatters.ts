/**
 * Date and number formatting utilities
 */

import type { Trade } from '@/lib/position'

/**
 * Format a Date object to a localized date string
 * @param date - The date to format
 * @returns Formatted date string (e.g., "Mar 15, 2024")
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

/**
 * Format a number as US currency
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "$150.50")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

/**
 * Format a trade as a summary string
 * @param trade - The trade to format
 * @returns Formatted summary string (e.g., "Buy 100 @ $150.50 on Mar 15, 2024")
 */
export function formatTradeSummary(trade: Trade): string {
  const type = trade.trade_type === 'buy' ? 'Buy' : 'Sell'
  const quantity = trade.quantity
  const price = formatCurrency(trade.price)
  const date = formatDate(trade.timestamp)
  return `${type} ${quantity} @ ${price} on ${date}`
}
