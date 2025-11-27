/**
 * Date and number formatting utilities
 */

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
