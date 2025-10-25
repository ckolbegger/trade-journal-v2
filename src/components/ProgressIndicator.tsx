interface ProgressIndicatorProps {
  currentPrice: number
  stopLoss: number
  profitTarget: number
}

/**
 * ProgressIndicator Component
 *
 * Visual progress bar showing current price position relative to stop loss and profit target.
 *
 * Features:
 * - Gradient bar from red (stop) to green (target)
 * - Position marker showing current price
 * - Displays captured profit percentage
 * - Warning colors when price is outside range
 */
export function ProgressIndicator({
  currentPrice,
  stopLoss,
  profitTarget
}: ProgressIndicatorProps) {
  // Calculate progress percentage (0-100)
  const range = profitTarget - stopLoss
  const distance = currentPrice - stopLoss
  const rawProgress = (distance / range) * 100

  // Clamp to 0-100 range
  const progress = Math.max(0, Math.min(100, rawProgress))

  // Determine if price is outside normal range
  const belowStop = currentPrice < stopLoss
  const aboveTarget = currentPrice > profitTarget

  // Color indicators for out-of-range prices
  let markerColor = 'bg-blue-500' // Default
  if (belowStop) {
    markerColor = 'bg-red-600'
  } else if (aboveTarget) {
    markerColor = 'bg-green-600'
  }

  let textColor = 'text-gray-700' // Default
  if (belowStop) {
    textColor = 'text-red-600'
  } else if (aboveTarget) {
    textColor = 'text-green-600'
  }

  return (
    <div className="space-y-3">
      {/* Header: Captured Profit Percentage */}
      <div className="text-center">
        <div className="text-xs text-gray-600">Captured Profit</div>
        <div className={`text-lg font-bold ${textColor}`}>
          {progress.toFixed(1)}%
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" />

        {/* Position Marker */}
        <div
          className={`absolute top-0 bottom-0 w-1 ${markerColor} shadow-lg z-10`}
          style={{ left: `${progress}%` }}
        >
          {/* Triangle indicator */}
          <div className={`absolute top-[-4px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent ${markerColor.replace('bg-', 'border-b-')}`} />
        </div>
      </div>

      {/* Labels: Stop Loss and Profit Target */}
      <div className="flex justify-between items-center text-xs">
        <div className="text-left">
          <div className="text-gray-500">Stop</div>
          <div className="font-semibold text-red-600">${stopLoss.toFixed(2)}</div>
        </div>
        <div className="text-right">
          <div className="text-gray-500">Target</div>
          <div className="font-semibold text-green-600">${profitTarget.toFixed(2)}</div>
        </div>
      </div>
    </div>
  )
}
