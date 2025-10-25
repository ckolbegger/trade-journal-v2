interface PriceConfirmationDialogProps {
  oldPrice: number
  newPrice: number
  percentChange: number
  onConfirm: () => void
  onCancel: () => void
}

/**
 * PriceConfirmationDialog Component
 *
 * Modal dialog shown when price change exceeds 20% threshold.
 * Prevents accidental data entry errors.
 */
export function PriceConfirmationDialog({
  oldPrice,
  newPrice,
  percentChange,
  onConfirm,
  onCancel
}: PriceConfirmationDialogProps) {
  const isIncrease = percentChange > 0
  const changeColor = Math.abs(percentChange) > 20 ? 'text-orange-600' : 'text-gray-700'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Confirm Price Change
        </h2>

        {/* Warning Message */}
        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            This price change is larger than 20%. Please confirm this is correct.
          </p>

          {/* Price Comparison */}
          <div className="bg-gray-50 border border-gray-200 rounded p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Previous Price:</span>
              <span className="text-lg font-semibold">${oldPrice.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">New Price:</span>
              <span className="text-lg font-semibold">${newPrice.toFixed(2)}</span>
            </div>

            <div className="pt-2 border-t border-gray-300">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Change:</span>
                <span className={`text-lg font-bold ${changeColor}`}>
                  {isIncrease ? '+' : ''}{percentChange.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700"
          >
            Yes, Update
          </button>
        </div>
      </div>
    </div>
  )
}
