import React, { useState } from 'react'
import type { Position, Trade } from '@/lib/position'

export interface TradeExecutionFormProps {
  position: Position
  onTradeAdded: (trade: Trade) => Promise<void> | void
  onError: (error: string) => void
  onCancel?: () => void
}

/**
 * TradeExecutionForm component allows users to execute trades against planned positions
 * Enforces Phase 1A constraint: only one trade per position
 */
export const TradeExecutionForm: React.FC<TradeExecutionFormProps> = ({
  position,
  onTradeAdded,
  onError,
  onCancel
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    trade_type: 'buy' as 'buy' | 'sell',
    quantity: '',
    price: '',
    trade_date: '',
    notes: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Check Phase 1A constraint
  if (position.trades.length > 0) {
    // Show constraint error instead of form
    React.useEffect(() => {
      onError('Phase 1A allows only one trade per position')
    }, [onError])

    return (
      <div data-testid="phase-1a-constraint-error" className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Trade Not Allowed</h3>
        <p className="text-red-700">
          Phase 1A allows only one trade per position. This position already has an executed trade.
        </p>
        <button
          onClick={onCancel || (() => {})}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Close
        </button>
      </div>
    )
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validate quantity
    if (!formData.quantity) {
      newErrors.quantity = 'Quantity is required'
    } else if (isNaN(Number(formData.quantity)) || Number(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be a positive number'
    }

    // Validate price
    if (!formData.price) {
      newErrors.price = 'Price is required'
    } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      newErrors.price = 'Price must be a positive number'
    }

    // Validate trade date
    if (!formData.trade_date) {
      newErrors.trade_date = 'Trade date is required'
    } else if (isNaN(new Date(formData.trade_date).getTime())) {
      newErrors.trade_date = 'Invalid trade date'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Create trade object
      const trade: Trade = {
        id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        position_id: position.id,
        trade_type: formData.trade_type,
        quantity: Number(formData.quantity),
        price: Number(formData.price),
        timestamp: new Date(formData.trade_date),
        notes: formData.notes.trim() || undefined
      }

      // Call callback
      await onTradeAdded(trade)

      // Reset form on success
      setFormData({
        trade_type: 'buy',
        quantity: '',
        price: '',
        trade_date: '',
        notes: ''
      })
      setErrors({})

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to execute trade'
      setErrors({ general: errorMessage })
      onError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
  }

  return (
    <div data-testid="trade-execution-form" className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Execute Trade for {position.symbol}</h2>
        <div className="mt-2 text-sm text-gray-600 space-y-1">
          <p>Target Entry: ${position.target_entry_price.toFixed(2)}</p>
          <p>Target Quantity: {position.target_quantity}</p>
        </div>
      </div>

      {/* Error Display */}
      {errors.general && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {errors.general}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} data-testid="trade-execution-form-element" role="form" className="space-y-4">
        <div>
          <label htmlFor="trade-type" className="block text-sm font-medium text-gray-700 mb-1">
            Trade Type
          </label>
          <select
            id="trade-type"
            value={formData.trade_type}
            onChange={(e) => handleInputChange('trade_type', e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          >
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </div>

        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
            Quantity *
          </label>
          <input
            id="quantity"
            type="number"
            step="0.01"
            value={formData.quantity}
            onChange={(e) => handleInputChange('quantity', e.target.value)}
            disabled={isLoading}
            placeholder="Enter quantity"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          {errors.quantity && (
            <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">Quantity must be a positive number</p>
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            Price *
          </label>
          <input
            id="price"
            type="number"
            step="0.0001"
            value={formData.price}
            onChange={(e) => handleInputChange('price', e.target.value)}
            disabled={isLoading}
            placeholder="Enter price"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          {errors.price && (
            <p className="mt-1 text-sm text-red-600">{errors.price}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">Price must be a positive number</p>
        </div>

        <div>
          <label htmlFor="trade-date" className="block text-sm font-medium text-gray-700 mb-1">
            Trade Date *
          </label>
          <input
            id="trade-date"
            type="datetime-local"
            value={formData.trade_date}
            onChange={(e) => handleInputChange('trade_date', e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          {errors.trade_date && (
            <p className="mt-1 text-sm text-red-600">{errors.trade_date}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">Enter the date and time when the trade was executed</p>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            disabled={isLoading}
            placeholder="Optional notes about this trade execution"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <span data-testid="loading-spinner" className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                Executing...
              </>
            ) : (
              'Execute Trade'
            )}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}