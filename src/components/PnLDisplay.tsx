interface PnLDisplayProps {
  pnl: number | null
  percentage?: number
}

/**
 * PnLDisplay Component
 *
 * Displays profit/loss with color coding:
 * - Positive P&L: Green
 * - Negative P&L: Red
 * - Zero P&L: Gray
 * - No data: "—" in gray
 *
 * Optionally displays percentage change alongside dollar amount.
 */
export function PnLDisplay({ pnl, percentage }: PnLDisplayProps) {
  // No data available
  if (pnl === null) {
    return <span className="text-gray-500">—</span>
  }

  // Determine color based on P&L value
  let colorClass = 'text-gray-500' // Default for zero
  if (pnl > 0) {
    colorClass = 'text-green-600'
  } else if (pnl < 0) {
    colorClass = 'text-red-600'
  }

  // Format dollar amount
  const formattedPnL = pnl >= 0
    ? `$${pnl.toFixed(2)}`
    : `-$${Math.abs(pnl).toFixed(2)}`

  // Format percentage if provided
  const formattedPercentage = percentage !== undefined
    ? percentage === 0
      ? '0.0%'
      : percentage > 0
        ? `+${percentage.toFixed(1)}%`
        : `${percentage.toFixed(1)}%`
    : null

  return (
    <span className={`font-semibold ${colorClass}`}>
      {formattedPnL}
      {formattedPercentage && (
        <span className="text-sm ml-1">({formattedPercentage})</span>
      )}
    </span>
  )
}
