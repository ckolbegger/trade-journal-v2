import React from 'react'
import type { Position } from '@/lib/position'

export interface StatusBadgeProps {
  position: Position
  size?: 'small' | 'medium' | 'large'
  'data-testid'?: string
}

/**
 * StatusBadge component displays the current status of a position
 * 'planned' = gray badge (no trades)
 * 'open' = green badge (has trades and net quantity > 0)
 * 'closed' = blue badge (net quantity is 0 or position.status is 'closed')
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ position, size = 'medium', 'data-testid': testId }) => {
  if (!position) {
    return null
  }

  // Use explicit status if provided, otherwise compute from trades
  let status: 'planned' | 'open' | 'closed' = 'planned'
  
  if (position.status === 'closed') {
    status = 'closed'
  } else if (position.trades && position.trades.length > 0) {
    // Check if position has open quantity
    const openQuantity = position.trades.reduce((net, trade) => {
      return trade.trade_type === 'buy' ? net + trade.quantity : net - trade.quantity
    }, 0)
    status = openQuantity > 0 ? 'open' : 'closed'
  }

  // Determine CSS classes based on status and size
  const getStatusClasses = () => {
    const baseClasses = 'px-2 py-1 rounded-full font-medium'

    const statusClasses = status === 'open'
      ? 'bg-green-100 text-green-800'
      : status === 'closed'
        ? 'bg-blue-100 text-blue-800'
        : 'bg-gray-100 text-gray-800'

    const sizeClasses = {
      small: 'text-xs',
      medium: 'text-sm',
      large: 'text-base'
    }[size]

    return `${baseClasses} ${statusClasses} ${sizeClasses}`
  }

  // Determine text display
  const getStatusText = () => {
    return status
  }

  return (
    <span
      data-testid={testId || "status-badge"}
      role="status"
      aria-label={`Position status: ${getStatusText()}`}
      className={getStatusClasses()}
    >
      {getStatusText()}
    </span>
  )
}