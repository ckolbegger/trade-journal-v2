import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PositionService } from '@/lib/position'
import type { Position } from '@/lib/position'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface DashboardProps {
  positionService?: PositionService
}

export function Dashboard({ positionService: injectedPositionService }: DashboardProps = {}) {
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const positionService = injectedPositionService || new PositionService()

  useEffect(() => {
    loadPositions()
  }, [])

  const loadPositions = async () => {
    try {
      const loadedPositions = await positionService.getAll()
      setPositions(loadedPositions)
    } catch (error) {
      console.error('Failed to load positions:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const calculateRiskRewardRatio = (profitTarget: number, stopLoss: number, entryPrice: number) => {
    const risk = entryPrice - stopLoss
    const reward = profitTarget - entryPrice
    return reward / risk
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading positions...</div>
      </div>
    )
  }

  if (positions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No positions yet</h2>
          <p className="text-gray-600 mb-4">Create your first position plan to get started</p>
          <Link to="/position/create">
            <Button>Create Position</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-800 text-white p-4 flex items-center justify-between sticky top-0 z-50">
        <h1 className="text-lg font-semibold">Positions</h1>
        <Link to="/position/create">
          <Button
            size="sm"
            className="w-8 h-8 p-0 bg-blue-600 hover:bg-blue-500 border-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </Link>
      </header>

      {/* Position Cards */}
      <div className="p-4 pb-24">
        {positions.map((position) => (
          <div
            key={position.id}
            className="bg-white rounded-lg border border-gray-200 p-4 mb-3 shadow-sm cursor-pointer transition-all hover:shadow-md"
            onClick={() => window.location.href = `/position/${position.id}`}
          >
            {/* Position Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-lg font-semibold text-gray-900">{position.symbol}</div>
                <div className="text-xs text-gray-600 uppercase tracking-wide">{position.strategy_type}</div>
              </div>

              {/* P&L Display */}
              <div className="text-right">
                <div className="text-base font-semibold">No trades executed</div>
                <div className="text-xs text-gray-500">TODO: Current P&L</div>
              </div>
            </div>

            {/* Position Metrics */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center">
                <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Avg Cost</div>
                <div className="text-sm font-medium text-gray-900">TODO</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Current</div>
                <div className="text-sm font-medium text-gray-900">TODO</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Stop</div>
                <div className="text-sm font-medium text-red-600">{formatCurrency(position.stop_loss)}</div>
              </div>
            </div>

            {/* Position Footer */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Updated {formatDate(position.created_date)}
              </div>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Planned
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Action Button */}
      <Link
        to="/position/create"
        className="fixed bottom-24 right-4 w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:shadow-xl"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  )
}