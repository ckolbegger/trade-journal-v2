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
 * 'open' = green badge (has trades)
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ position, size = 'medium', 'data-testid': testId }) => {
  if (!position) {
    return null
  }

  // Determine status based on trades array
  const hasTrades = position.trades && position.trades.length > 0
  const status = hasTrades ? 'open' : 'planned'

  // Determine CSS classes based on status and size
  const getStatusClasses = () => {
    const baseClasses = 'px-2 py-1 rounded-full font-medium'

    const statusClasses = status === 'open'
      ? 'bg-green-100 text-green-800'
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
    if (status === 'open') {
      return 'open'
    }
    return 'planned'
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