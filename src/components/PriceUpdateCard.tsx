import { useState, useEffect } from 'react'
import type { PriceService } from '@/services/PriceService'
import type { PriceHistory } from '@/types/priceHistory'
import { PriceConfirmationDialog } from '@/components/PriceConfirmationDialog'

interface PriceUpdateCardProps {
  underlying: string
  priceService: PriceService
  onPriceUpdated: (price: PriceHistory) => void
}

/**
 * PriceUpdateCard Component
 *
 * Manual price entry form with validation and >20% change confirmation.
 * Supports backdating and displays last known price.
 */
export function PriceUpdateCard({ underlying, priceService, onPriceUpdated }: PriceUpdateCardProps) {
  const [price, setPrice] = useState<string>('')
  const [date, setDate] = useState<string>(getTodayDate())
  const [lastPrice, setLastPrice] = useState<PriceHistory | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [pendingUpdate, setPendingUpdate] = useState<{
    price: number
    percentChange: number
    oldPrice: number
  } | null>(null)

  // Load last known price on mount
  useEffect(() => {
    loadLastPrice()
  }, [underlying])

  async function loadLastPrice() {
    try {
      const latest = await priceService.getLatestPrice(underlying)
      setLastPrice(latest)
    } catch (err) {
      console.error('Failed to load last price:', err)
    }
  }

  function getTodayDate(): string {
    return new Date().toISOString().split('T')[0]
  }

  function validatePrice(priceValue: string): string | null {
    if (!priceValue || priceValue.trim() === '') {
      return 'Price is required'
    }

    const numericPrice = parseFloat(priceValue)

    if (isNaN(numericPrice)) {
      return 'Price must be a valid number'
    }

    if (numericPrice < 0) {
      return 'Price cannot be negative'
    }

    if (numericPrice === 0) {
      return 'Price must be greater than zero'
    }

    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    // Validate price
    const validationError = validatePrice(price)
    if (validationError) {
      setError(validationError)
      return
    }

    const numericPrice = parseFloat(price)

    try {
      setLoading(true)

      // Check if confirmation is required for >20% change
      const validation = await priceService.validatePriceChange(underlying, numericPrice)

      if (validation.requiresConfirmation) {
        // Show confirmation dialog
        setPendingUpdate({
          price: numericPrice,
          percentChange: validation.percentChange,
          oldPrice: validation.oldPrice!
        })
        setShowConfirmation(true)
        setLoading(false)
        return
      }

      // No confirmation needed, proceed with update
      await performUpdate(numericPrice)
    } catch (err) {
      setLoading(false)
      setError('Failed to update price: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  async function performUpdate(priceValue: number) {
    try {
      setLoading(true)

      const updated = await priceService.createOrUpdateSimple({
        underlying,
        date,
        close: priceValue
      })

      // Success
      setSuccess(true)
      setError('')
      setPrice('')
      setLastPrice(updated)
      onPriceUpdated(updated)

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError('Failed to update price: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  function handleConfirm() {
    if (pendingUpdate) {
      performUpdate(pendingUpdate.price)
      setShowConfirmation(false)
      setPendingUpdate(null)
    }
  }

  function handleCancel() {
    setShowConfirmation(false)
    setPendingUpdate(null)
    setLoading(false)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Update Price</h3>

      {/* Last Known Price Display */}
      {lastPrice ? (
        <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
          <div className="text-sm text-gray-600">Last known price</div>
          <div className="text-lg font-semibold">${lastPrice.close.toFixed(2)}</div>
          <div className="text-xs text-gray-500">{lastPrice.date}</div>
        </div>
      ) : (
        <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
          <div className="text-sm text-gray-500">No price data available</div>
        </div>
      )}

      {/* Price Update Form */}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="price-input" className="block text-sm font-medium text-gray-700 mb-1">
            Current Price
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              id="price-input"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
              disabled={loading}
            />
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="date-input" className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            id="date-input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-700">Price updated successfully!</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Updating...' : 'Update Price'}
        </button>
      </form>

      {/* Confirmation Dialog */}
      {showConfirmation && pendingUpdate && (
        <PriceConfirmationDialog
          oldPrice={pendingUpdate.oldPrice}
          newPrice={pendingUpdate.price}
          percentChange={pendingUpdate.percentChange}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </div>
  )
}
