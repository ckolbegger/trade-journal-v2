import { useState, useEffect } from 'react'
import { EmptyState } from './EmptyState'
import { Dashboard } from './Dashboard'
import { PositionService } from '@/lib/position'
import { TradeService } from '@/services/TradeService'

interface HomeProps {
  positionService?: PositionService
}

export function Home({ positionService: injectedPositionService }: HomeProps = {}) {
  const [hasPositions, setHasPositions] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const positionService = injectedPositionService || new PositionService()
  const tradeService = new TradeService(positionService)

  useEffect(() => {
    checkForPositions()
  }, [])

  const checkForPositions = async () => {
    try {
      console.log('Checking for positions...')
      const positions = await positionService.getAll()
      console.log('Positions loaded:', positions)
      setHasPositions(positions.length > 0)
      setError(null)
    } catch (error) {
      console.error('Failed to check for positions:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
      setHasPositions(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 p-4">
        <div className="text-red-600 text-center">
          <h3 className="font-bold mb-2">Error Loading App</h3>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (hasPositions) {
    return <Dashboard positionService={positionService} tradeService={tradeService} />
  }

  return <EmptyState />
}