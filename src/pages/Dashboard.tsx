import { Link, useNavigate } from 'react-router-dom'
import { Dashboard as DashboardComponent } from '@/components/Dashboard'
import { PositionService } from '@/lib/position'
import { TradeService } from '@/services/TradeService'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface DashboardProps {
  positionService?: PositionService
}

export function Dashboard({ positionService: injectedPositionService }: DashboardProps = {}) {
  const navigate = useNavigate()
  const positionService = injectedPositionService || new PositionService()
  const tradeService = new TradeService(positionService)

  const handleViewDetails = (positionId: string) => {
    navigate(`/position/${positionId}`)
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

      {/* Main Content */}
      <div className="p-4 pb-24">
        <DashboardComponent
          positionService={positionService}
          tradeService={tradeService}
          onViewDetails={handleViewDetails}
        />
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