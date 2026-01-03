import React from 'react'
import { StatusBadge } from './StatusBadge'
import { PnLDisplay } from './PnLDisplay'
import type { Position } from '@/lib/position'

// Helper function to format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[date.getMonth()]
  const day = date.getDate()
  const year = date.getFullYear()
  return `${month} ${day}, ${year}`
}

export interface PositionCardProps {
  position: Position
  onViewDetails: (positionId: string) => void
  // Metrics calculated by parent (pure presentation component)
  avgCost: number
  pnl: number | null
  pnlPercentage: number | undefined
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
  pnlPercentage
}) => {
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

      {/* Option-specific fields for Short Put */}
      {position.strategy_type === 'Short Put' && (
        <div className="grid grid-cols-3 gap-3 mb-3 py-2 border-t border-b border-gray-200">
          <div className="text-center">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Strike</div>
            <div className="text-sm font-medium text-gray-900">
              {position.strike_price !== undefined ? `$${position.strike_price.toFixed(2)}` : '—'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Expires</div>
            <div className="text-sm font-medium text-gray-900">
              {position.expiration_date ? formatDate(position.expiration_date) : '—'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Premium</div>
            <div className="text-sm font-medium text-gray-900">
              {position.premium_per_contract !== undefined ? `$${position.premium_per_contract.toFixed(2)}` : '—'}
            </div>
          </div>
        </div>
      )}

      {/* Position footer */}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>
          {position.strategy_type === 'Short Put'
            ? `Contracts: ${position.target_quantity}`
            : `Target Qty: ${position.target_quantity}`
          }
        </span>
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