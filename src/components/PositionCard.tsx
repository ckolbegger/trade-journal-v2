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

  return (
    <div
      data-testid="position-card"
      data-position-id={position.id}
      className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
      onClick={() => onViewDetails(position.id)}
    >
      {/* Header with symbol and status */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3
            data-testid={`position-symbol-${position.id}`}
            className="text-lg font-semibold text-gray-900"
          >
            {position.symbol}
          </h3>
          <p className="text-sm text-gray-600">{position.strategy_type}</p>
        </div>
        <StatusBadge position={position} data-testid="position-status-badge" />
      </div>

      {/* Position details */}
      <div className="space-y-2 text-sm text-gray-700">
        <div className="flex justify-between">
          <span>Target Entry:</span>
          <span>${position.target_entry_price.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Target Qty:</span>
          <span>{position.target_quantity}</span>
        </div>
        <div className="flex justify-between">
          <span>Profit Target:</span>
          <span className="text-green-600">${position.profit_target.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Stop Loss:</span>
          <span className="text-red-600">${position.stop_loss.toFixed(2)}</span>
        </div>

        {/* Show cost basis if position has trades */}
        {position.trades.length > 0 && (
          <div className="flex justify-between border-t pt-2 mt-2">
            <span>Avg Cost:</span>
            <span className="font-medium">
              ${position.trades[0].price.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex gap-2">
        {canAddTrade ? (
          <button
            data-testid="trade-execution-button"
            onClick={(e) => {
              e.stopPropagation()
              onTradeClick(position.id)
            }}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Add Trade
          </button>
        ) : (
          <div
            data-testid="position-executed-indicator"
            className="flex-1 bg-gray-100 text-gray-600 px-4 py-2 rounded-md text-sm font-medium text-center"
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
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          View Details
        </button>
      </div>
    </div>
  )
}