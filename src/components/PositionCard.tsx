import React from 'react'
import { StatusBadge } from './StatusBadge'
import type { Position } from '@/lib/position'

export interface PositionCardProps {
  position: Position
  onTradeClick: (positionId: string) => void
  onViewDetails: (positionId: string) => void
}

/**
 * PositionCard component displays a position with its status and action buttons
 */
export const PositionCard: React.FC<PositionCardProps> = ({ position, onTradeClick, onViewDetails }) => {
  // Determine if position can have trades added (Phase 1A constraint)
  const canAddTrade = position.trades.length === 0

  // Calculate position status for styling
  const getPositionStatusClass = () => {
    if (position.trades.length === 0) return ''

    // For now, since we don't have current prices in Phase 1A,
    // we'll use a neutral state for positions with trades
    return ''
  }

  // Calculate average cost from trades
  const avgCost = position.trades.length > 0
    ? position.trades.reduce((sum, trade) => sum + trade.price, 0) / position.trades.length
    : position.target_entry_price

  return (
    <div
      data-testid="position-card"
      data-position-id={position.id}
      className={`bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer mb-4 ${getPositionStatusClass()}`}
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
          <div className="text-sm font-medium text-gray-500">
            {position.trades.length > 0 ? 'Position Open' : 'Planned'}
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
      <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
        <span>Target Qty: {position.target_quantity}</span>
        <span>
          {position.trades.length > 0
            ? `${position.trades.length} trade${position.trades.length > 1 ? 's' : ''}`
            : 'No trades'
          }
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        {canAddTrade ? (
          <button
            data-testid="trade-execution-button"
            onClick={(e) => {
              e.stopPropagation()
              onTradeClick(position.id)
            }}
            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Add Trade
          </button>
        ) : (
          <div
            data-testid="position-executed-indicator"
            className="flex-1 bg-gray-100 text-gray-600 px-3 py-2 rounded-md text-sm font-medium text-center"
          >
            Position Executed
          </div>
        )}

        <button
          data-testid={`view-details-button-${position.id}`}
          onClick={(e) => {
            e.stopPropagation()
            onViewDetails(position.id)
          }}
          className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          Details
        </button>
      </div>
    </div>
  )
}