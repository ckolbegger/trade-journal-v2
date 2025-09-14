import { useState, useEffect } from 'react'
import { EmptyState } from './EmptyState'
import { Dashboard } from './Dashboard'
import { PositionService } from '@/lib/position'

interface HomeProps {
  positionService?: PositionService
}

export function Home({ positionService: injectedPositionService }: HomeProps = {}) {
  const [hasPositions, setHasPositions] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)
  const positionService = injectedPositionService || new PositionService()

  useEffect(() => {
    checkForPositions()
  }, [])

  const checkForPositions = async () => {
    try {
      const positions = await positionService.getAll()
      setHasPositions(positions.length > 0)
    } catch (error) {
      console.error('Failed to check for positions:', error)
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

  if (hasPositions) {
    return <Dashboard positionService={positionService} />
  }

  return <EmptyState />
}