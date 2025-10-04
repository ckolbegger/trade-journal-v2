import React, { useState, useEffect } from 'react'
import { PositionCard } from './PositionCard'
import { TradeExecutionForm } from './TradeExecutionForm'
import { PositionService } from '@/lib/position'
import { TradeService } from '@/services/TradeService'
import type { Position, Trade } from '@/lib/position'

export interface DashboardProps {
  positionService: PositionService
  tradeService: TradeService
  filter?: 'all' | 'planned' | 'open'
  onViewDetails?: (positionId: string) => void
}

/**
 * Dashboard component displays all positions with filtering capabilities
 * Manages its own data using PositionService (Option A architecture)
 */
export const Dashboard: React.FC<DashboardProps> = ({ positionService, tradeService, filter = 'all', onViewDetails }) => {
  const [currentFilter, setCurrentFilter] = useState<'all' | 'planned' | 'open'>(filter)
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [showTradeModal, setShowTradeModal] = useState(false)

  // Load positions on mount and when positionService changes
  useEffect(() => {
    loadPositions()
  }, [positionService])

  const loadPositions = async () => {
    try {
      setLoading(true)
      setError(null)
      const loadedPositions = await positionService.getAll()
      setPositions(loadedPositions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load positions')
      setPositions([])
    } finally {
      setLoading(false)
    }
  }

  // Filter positions based on current filter
  const filteredPositions = positions.filter(position => {
    if (currentFilter === 'all') return true
    if (currentFilter === 'planned') return position.trades.length === 0
    if (currentFilter === 'open') return position.trades.length > 0
    return true
  })

  const handleTradeClick = (positionId: string) => {
    const position = positions.find(p => p.id === positionId)
    if (position) {
      setSelectedPosition(position)
      setShowTradeModal(true)
    }
  }

  const handleTradeAdded = async (trade: Trade) => {
    try {
      await tradeService.addTrade(trade)
      setShowTradeModal(false)
      setSelectedPosition(null)
      await loadPositions() // Refresh positions after trade
    } catch (err) {
      // Error is handled by TradeExecutionForm
      throw err
    }
  }

  const handleTradeError = (errorMessage: string) => {
    console.error('Trade execution error:', errorMessage)
  }

  const handleTradeCancel = () => {
    setShowTradeModal(false)
    setSelectedPosition(null)
  }

  const handleViewDetails = (positionId: string) => {
    if (onViewDetails) {
      onViewDetails(positionId)
    } else {
      console.log('View details for position:', positionId)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Trading Positions</h1>
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Loading positions...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Trading Positions</h1>
        <div className="text-center py-12">
          <p className="text-red-500 text-lg">Failed to load positions</p>
          <p className="text-gray-500 mt-2">{error}</p>
          <button
            onClick={loadPositions}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Trading Positions</h1>
        <div className="flex gap-2">
          <button
            data-testid="filter-all"
            onClick={() => setCurrentFilter('all')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              currentFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All ({positions.length})
          </button>
          <button
            data-testid="filter-planned"
            onClick={() => setCurrentFilter('planned')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              currentFilter === 'planned'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Planned ({positions.filter(p => p.trades.length === 0).length})
          </button>
          <button
            data-testid="filter-open"
            onClick={() => setCurrentFilter('open')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              currentFilter === 'open'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Open ({positions.filter(p => p.trades.length > 0).length})
          </button>
        </div>
      </div>

      {/* Position Grid */}
      {filteredPositions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {currentFilter === 'all'
              ? 'No positions found'
              : `No ${currentFilter} positions found`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPositions.map(position => (
            <PositionCard
              key={position.id}
              position={position}
              onTradeClick={handleTradeClick}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      {/* Trade Execution Modal */}
      {showTradeModal && selectedPosition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" data-testid="trade-execution-modal">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <TradeExecutionForm
              position={selectedPosition}
              onTradeAdded={handleTradeAdded}
              onError={handleTradeError}
              onCancel={handleTradeCancel}
            />
          </div>
        </div>
      )}
    </div>
  )
}