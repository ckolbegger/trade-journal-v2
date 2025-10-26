import React from 'react'
import { StatusBadge } from './StatusBadge'
import { PnLDisplay } from './PnLDisplay'
import type { Position } from '@/lib/position'
import type { PriceHistory } from '@/types/priceHistory'
import { calculatePositionPnL, calculatePnLPercentage } from '@/utils/pnl'

export interface PositionCardProps {
  position: Position
  priceHistory?: PriceHistory | null
  onViewDetails: (positionId: string) => void
}

/**
 * PositionCard component displays a position card matching the mockup design
 */
export const PositionCard: React.FC<PositionCardProps> = ({ position, priceHistory, onViewDetails }) => {
  // Calculate average cost from trades
  const avgCost = position.trades.length > 0
    ? position.trades.reduce((sum, trade) => sum + trade.price, 0) / position.trades.length
    : position.target_entry_price

  // Calculate P&L if price data exists and position has trades
  const priceMap = priceHistory ? new Map([[priceHistory.underlying, priceHistory]]) : new Map()
  const pnl = position.trades.length > 0 ? calculatePositionPnL(position, priceMap) : null

  // Calculate cost basis for percentage
  const costBasis = position.trades.reduce((sum, trade) => {
    if (trade.trade_type === 'buy') {
      return sum + (trade.price * trade.quantity)
    }
    return sum
  }, 0)

  const pnlPercentage = pnl !== null && costBasis > 0
    ? calculatePnLPercentage(pnl, costBasis)
    : undefined

  // Determine card styling based on position status
  const isPlanned = position.trades.length === 0

  const cardClasses = `
    rounded-xl border border-gray-200 shadow-sm hover:shadow-lg
    transition-all cursor-pointer p-4
    ${isPlanned ? 'bg-gray-50 border-l-4 border-l-gray-500' : 'bg-white'}
  `.trim().replace(/\s+/g, ' ')

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

      {/* Position metrics grid */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Avg Cost</div>
          <div className="text-sm font-medium text-gray-900">${avgCost.toFixed(2)}</div>
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