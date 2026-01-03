import React from 'react'
import { StatusBadge } from './StatusBadge'
import { PnLDisplay } from './PnLDisplay'
import type { Position } from '@/lib/position'

export interface PositionCardProps {
  position: Position
  onViewDetails: (positionId: string) => void
  // Metrics calculated by parent (pure presentation component)
  avgCost: number
  pnl: number | null
  pnlPercentage: number | undefined
  // Optional current price for ITM/OTM calculation
  currentPrice?: number
}

/**
 * PositionCard component displays a position card matching the mockup design
 * Pure presentation component - receives all metrics as props
 */
export const PositionCard: React.FC<PositionCardProps> = ({
  position,
  onViewDetails,
  avgCost,
  pnl,
  pnlPercentage,
  currentPrice
}) => {
  // Determine card styling based on position status
  const isPlanned = position.trades.length === 0
  const isShortPut = position.strategy_type === 'Short Put'
  const contractCount = position.target_quantity * 100

  // Calculate ITM/OTM for Short Put positions
  const getItmOtmIndicator = () => {
    if (!isShortPut || !position.strike_price || currentPrice === undefined) {
      return null
    }
    const isItm = currentPrice > position.strike_price
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isItm ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
        {isItm ? 'ITM' : 'OTM'}
      </span>
    )
  }

  const cardClasses = `
    rounded-xl border border-gray-200 shadow-sm hover:shadow-lg
    transition-all cursor-pointer p-4
    ${isPlanned ? 'bg-gray-50 border-l-4 border-l-gray-500' : 'bg-white'}
  `.trim().replace(/\s+/g, ' ')

  const formatDate = (date: Date | undefined) => {
    if (!date) return null
    const d = new Date(date)
    const month = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
    const day = d.getUTCDate()
    const year = d.getUTCFullYear()
    return `${month} ${day}, ${year}`
  }

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return null
    return `$${value.toFixed(2)}`
  }

  return (
    <div
      data-testid="position-card"
      data-position-id={position.id}
      className={cardClasses}
      onClick={() => onViewDetails(position.id)}
    >
      {/* Header with symbol, status, and P&L */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3
              data-testid={`position-symbol-${position.id}`}
              className="text-lg font-semibold text-gray-900"
            >
              {position.symbol}
            </h3>
            <div className="text-xs">
              <StatusBadge position={position} data-testid="position-status-badge" />
            </div>
            {getItmOtmIndicator()}
          </div>
          <p className="text-xs text-gray-600 uppercase tracking-wide mt-1">{position.strategy_type}</p>
        </div>

        {/* P&L Display */}
        <div className="text-right">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">P&L</div>
          <div className="text-lg">
            <PnLDisplay pnl={pnl} percentage={pnlPercentage} />
          </div>
        </div>
      </div>

      {/* Short Put specific fields */}
      {isShortPut && (
        <div className="grid grid-cols-3 gap-3 mb-3">
          {position.strike_price && (
            <div className="text-center">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Strike</div>
              <div className="text-sm font-medium text-gray-900">{formatCurrency(position.strike_price)}</div>
            </div>
          )}
          {position.expiration_date && (
            <div className="text-center">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Expires</div>
              <div className="text-sm font-medium text-gray-900">{formatDate(position.expiration_date)}</div>
            </div>
          )}
          {position.premium_per_contract !== undefined && (
            <div className="text-center">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Premium</div>
              <div className="text-sm font-medium text-gray-900">{formatCurrency(position.premium_per_contract)}</div>
            </div>
          )}
        </div>
      )}

      {/* Position metrics grid */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{isShortPut ? 'Contracts' : 'Avg Cost'}</div>
          <div className="text-sm font-medium text-gray-900">
            {isShortPut ? contractCount.toLocaleString() : `$${avgCost.toFixed(2)}`}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Target</div>
          <div className="text-sm font-medium text-green-600">${position.profit_target.toFixed(2)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Stop</div>
          <div className="text-sm font-medium text-red-600">${position.stop_loss.toFixed(2)}</div>
        </div>
      </div>

      {/* Position footer */}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>Target Qty: {position.target_quantity}</span>
        <span>
          {position.trades.length > 0
            ? `${position.trades.length} trade${position.trades.length > 1 ? 's' : ''}`
            : 'No trades'
          }
        </span>
      </div>
    </div>
  )
}