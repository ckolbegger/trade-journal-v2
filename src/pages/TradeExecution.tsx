import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Position } from '@/lib/position'
import { PositionService } from '@/lib/position'

interface FormErrors {
  quantity?: string
  price?: string
  executionDate?: string
}

const TradeExecution = () => {
  const { positionId } = useParams<{ positionId: string }>()
  const navigate = useNavigate()
  const [position, setPosition] = useState<Position | null>(null)
  const [loading, setLoading] = useState(true)

  // Form state
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy')
  const [quantity, setQuantity] = useState<string>('')
  const [price, setPrice] = useState<string>('')
  const [executionDate, setExecutionDate] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    const loadPosition = async () => {
      const positionService = new PositionService()
      const pos = await positionService.getById(positionId!)
      setPosition(pos)
      setLoading(false)
      positionService.close()
    }

    if (positionId) {
      loadPosition()
    }
  }, [positionId])

  const validateQuantity = (value: string): string | undefined => {
    if (!value || value.trim() === '') {
      return 'Quantity is required'
    }
    const num = parseFloat(value)
    if (isNaN(num) || num <= 0) {
      return 'Quantity must be positive'
    }
    return undefined
  }

  const validatePrice = (value: string): string | undefined => {
    if (!value || value.trim() === '') {
      return 'Price is required'
    }
    const num = parseFloat(value)
    if (isNaN(num) || num <= 0) {
      return 'Price must be positive'
    }
    return undefined
  }

  const validateExecutionDate = (value: string): string | undefined => {
    if (!value || value.trim() === '') {
      return 'Execution date is required'
    }
    const date = new Date(value)
    const now = new Date()
    if (date > now) {
      return 'Execution date cannot be in the future'
    }
    return undefined
  }

  const handleQuantityBlur = () => {
    const error = validateQuantity(quantity)
    setErrors(prev => ({ ...prev, quantity: error }))
  }

  const handlePriceBlur = () => {
    const error = validatePrice(price)
    setErrors(prev => ({ ...prev, price: error }))
  }

  const handleExecutionDateBlur = () => {
    const error = validateExecutionDate(executionDate)
    setErrors(prev => ({ ...prev, executionDate: error }))
  }

  const calculateTotal = (): string => {
    const qty = parseFloat(quantity)
    const prc = parseFloat(price)
    if (isNaN(qty) || isNaN(prc)) {
      return '$0.00'
    }
    const total = qty * prc
    return `$${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const handleSubmit = () => {
    // Validate all fields
    const quantityError = validateQuantity(quantity)
    const priceError = validatePrice(price)
    const dateError = validateExecutionDate(executionDate)

    setErrors({
      quantity: quantityError,
      price: priceError,
      executionDate: dateError
    })

    if (quantityError || priceError || dateError) {
      return
    }

    // Navigate to journal entry page (will be implemented in next phase)
    console.log('Trade form submitted', { tradeType, quantity, price, executionDate, notes })
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!position) {
    return <div>Position not found</div>
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-gray-800 text-white p-4 flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="mr-4"
        >
          ←
        </button>
        <h1 className="text-lg font-semibold">Add Trade</h1>
      </header>

      {/* Plan Context Section */}
      <section className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="text-xs text-gray-600 uppercase tracking-wide mb-2">
          Executing Against Position Plan
        </div>
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="font-semibold text-gray-900">
              {position.symbol} {position.strategy_type}
            </div>
            <div className="text-xs text-gray-600">
              Target: {position.target_quantity} shares @ ${position.target_entry_price.toFixed(2)}
            </div>
          </div>
          <div className="text-right text-xs text-gray-600">
            <div>Target: ${position.profit_target.toFixed(2)}</div>
            <div>Stop: ${position.stop_loss.toFixed(2)}</div>
          </div>
        </div>

        {/* Progress Summary */}
        <div className="grid grid-cols-3 gap-4 mb-3">
          <div className="text-center">
            <div className="text-xs text-gray-600 uppercase">Filled</div>
            <div className="text-sm font-medium">{position.trades.length > 0 ? position.trades[0].quantity : 0} / {position.target_quantity}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600 uppercase">Avg Price</div>
            <div className="text-sm font-medium">—</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600 uppercase">Remaining</div>
            <div className="text-sm font-medium">{position.target_quantity} shares</div>
          </div>
        </div>
      </section>

      {/* Form Content */}
      <main className="p-4 pb-24">
        {/* Trade Type Selector */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={() => setTradeType('buy')}
            className={`p-3 border-2 rounded-lg font-medium ${
              tradeType === 'buy'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700'
            }`}
          >
            📈 BUY
          </button>
          <button
            type="button"
            onClick={() => setTradeType('sell')}
            className={`p-3 border-2 rounded-lg font-medium ${
              tradeType === 'sell'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700'
            }`}
          >
            📉 SELL
          </button>
        </div>

        {/* Quantity and Price Inputs */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
              Quantity *
            </label>
            <input
              type="number"
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onBlur={handleQuantityBlur}
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="100"
            />
            <div className="text-xs text-gray-500 mt-1">Shares to {tradeType}</div>
            {errors.quantity && (
              <div className="text-xs text-red-600 mt-1">{errors.quantity}</div>
            )}
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Price *
            </label>
            <input
              type="number"
              id="price"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              onBlur={handlePriceBlur}
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="150.00"
            />
            <div className="text-xs text-gray-500 mt-1">Execution price</div>
            {errors.price && (
              <div className="text-xs text-red-600 mt-1">{errors.price}</div>
            )}
          </div>
        </div>

        {/* Execution Date */}
        <div className="mb-4">
          <label htmlFor="executionDate" className="block text-sm font-medium text-gray-700 mb-1">
            Execution Date & Time *
          </label>
          <input
            type="datetime-local"
            id="executionDate"
            value={executionDate}
            onChange={(e) => setExecutionDate(e.target.value)}
            onBlur={handleExecutionDateBlur}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
          <div className="text-xs text-gray-500 mt-1">When this trade was executed</div>
          {errors.executionDate && (
            <div className="text-xs text-red-600 mt-1">{errors.executionDate}</div>
          )}
        </div>

        {/* Notes */}
        <div className="mb-4">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <input
            type="text"
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
            placeholder="Optional execution notes"
          />
        </div>

        {/* Trade Calculation */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <div className="text-sm font-medium mb-3">Trade Calculation</div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Shares:</span>
            <span className="font-medium">{quantity || '0'}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Price per Share:</span>
            <span className="font-medium">${price || '0.00'}</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t border-gray-200 font-semibold">
            <span>Gross Amount:</span>
            <span>{calculateTotal()}</span>
          </div>
        </div>
      </main>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          Add Trade
        </button>
      </div>
    </div>
  )
}

export default TradeExecution
