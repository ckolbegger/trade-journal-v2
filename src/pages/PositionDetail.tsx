import { useState, useEffect } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate, useParams } from 'react-router-dom'
import { PositionService } from '@/lib/position'
import type { Position, Trade } from '@/lib/position'
import { TradeService } from '@/services/TradeService'
import { JournalService } from '@/services/JournalService'
import type { JournalEntry } from '@/types/journal'
import { Button } from '@/components/ui/button'
import { Accordion } from '@/components/ui/accordion'
import { TradeExecutionForm } from '@/components/TradeExecutionForm'
import { EnhancedJournalEntryForm } from '@/components/EnhancedJournalEntryForm'
import type { JournalField } from '@/types/journal'
import { generateJournalId } from '@/lib/uuid'
import { ArrowLeft, Edit, MoreHorizontal } from 'lucide-react'

interface PositionDetailProps {
  positionService?: PositionService
  tradeService?: TradeService
  journalService?: JournalService
}

export function PositionDetail({ positionService: injectedPositionService, tradeService: injectedTradeService, journalService: injectedJournalService }: PositionDetailProps = {}) {
  const navigate = useNavigate()
  const { id} = useParams<{ id: string }>()
  const [position, setPosition] = useState<Position | null>(null)
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [journalLoading, setJournalLoading] = useState(true)
  const [journalError, setJournalError] = useState<string | null>(null)
  const [showPriceUpdate, setShowPriceUpdate] = useState(false)
  const [showTradeModal, setShowTradeModal] = useState(false)
  const [showJournalModal, setShowJournalModal] = useState(false)
  const [selectedTradeId, setSelectedTradeId] = useState<string | undefined>(undefined)
  const [journalModalError, setJournalModalError] = useState<string | null>(null)
  const [currentPrice, setCurrentPrice] = useState('')
  const [showTradeJournalModal, setShowTradeJournalModal] = useState(false)
  const [pendingTradeForJournal, setPendingTradeForJournal] = useState<Trade | null>(null)
  const [journalPositionSnapshot, setJournalPositionSnapshot] = useState<Position | null>(null)
  const [isTradeJournalSaving, setIsTradeJournalSaving] = useState(false)
  const [tradeJournalError, setTradeJournalError] = useState<string | null>(null)
  const positionServiceInstance = injectedPositionService || new PositionService()
  const tradeServiceInstance = injectedTradeService || new TradeService(positionServiceInstance)

  const getJournalService = async (): Promise<JournalService> => {
    if (injectedJournalService) {
      return injectedJournalService
    }

    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('TradingJournalDB', 2)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })

    return new JournalService(db)
  }

  useEffect(() => {
    loadPosition()
    loadJournalEntries()
  }, [id])

  const loadPosition = async (): Promise<Position | null> => {
    if (!id) return null

    try {
      const loadedPosition = await positionServiceInstance.getById(id)
      setPosition(loadedPosition)
      if (loadedPosition) {
        setCurrentPrice(loadedPosition.target_entry_price?.toString() || '0')
      }
      return loadedPosition || null
    } catch (error) {
      console.error('Failed to load position:', error)
      setPosition(null)
      return null
    } finally {
      setLoading(false)
    }
  }

  const loadJournalEntries = async () => {
    if (!id) return

    try {
      setJournalLoading(true)
      setJournalError(null)
      const journalService = await getJournalService()
      const entries = await journalService.getByPositionId(id)

      // Sort entries chronologically (oldest first)
      const sortedEntries = entries.sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )

      setJournalEntries(sortedEntries)
    } catch (error) {
      console.error('Failed to load journal entries:', error)
      setJournalError('Error loading journal entries')
    } finally {
      setJournalLoading(false)
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

  const formatEntryType = (entryType: string) => {
    switch (entryType) {
      case 'position_plan':
        return 'Position Plan'
      case 'trade_execution':
        return 'Trade Execution'
      default:
        return entryType
    }
  }

  const formatTradeSummary = (trade: Trade): string => {
    const type = trade.trade_type === 'buy' ? 'Buy' : 'Sell'
    const quantity = trade.quantity
    const price = formatCurrency(trade.price)
    const date = formatDate(trade.timestamp)
    return `${type} ${quantity} @ ${price} on ${date}`
  }

  const handlePriceUpdate = () => {
    if (!currentPrice || isNaN(parseFloat(currentPrice))) return

    // Update the price display
    setCurrentPrice(currentPrice)
    setShowPriceUpdate(false)
  }

  const handleAddTrade = () => {
    setShowTradeModal(true)
  }

  const handleTradeAdded = async (trade: Trade) => {
    try {
      const updatedTrades = await tradeServiceInstance.addTrade(trade)
      setShowTradeModal(false)
      const refreshedPosition = await loadPosition() // Refresh position after trade
      const latestTrade = updatedTrades[updatedTrades.length - 1] ?? null
      if (latestTrade) {
        setPendingTradeForJournal(latestTrade)
        setJournalPositionSnapshot(refreshedPosition ?? position ?? null)
        setTradeJournalError(null)
        setShowTradeJournalModal(true)
      }
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
  }

<<<<<<< HEAD
  const handleTradeJournalSave = async (fields: JournalField[]): Promise<void> => {
    if (!pendingTradeForJournal) {
      throw new Error('No trade available for journaling')
    }

    const journalService = await getJournalService()
    setIsTradeJournalSaving(true)
    setTradeJournalError(null)

    try {
      await journalService.create({
        position_id: pendingTradeForJournal.position_id,
        trade_id: pendingTradeForJournal.id,
        entry_type: 'trade_execution',
        fields
      })

      await loadJournalEntries()
      setShowTradeJournalModal(false)
      setPendingTradeForJournal(null)
      setJournalPositionSnapshot(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save journal entry'
      setTradeJournalError(message)
    } finally {
      setIsTradeJournalSaving(false)
    }
  }

  const handleTradeJournalSkip = () => {
    setShowTradeJournalModal(false)
    setPendingTradeForJournal(null)
    setJournalPositionSnapshot(null)
    setTradeJournalError(null)
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading position...</div>
      </div>
    )
  }

  if (!position) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Position not found</h2>
          <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
        </div>
      </div>
    )
  }

  // Calculate metrics from trade data
  const targetEntryPrice = position.target_entry_price || 0
  const stopLoss = position.stop_loss || 0
  const profitTarget = position.profit_target || 0

  // Determine position status based on trades
  const hasTrades = position.trades && position.trades.length > 0
  const isPlannedPosition = !hasTrades

  // Calculate average cost from trades
  const avgCost = position.trades.length > 0
    ? position.trades.reduce((sum, trade) => sum + trade.price, 0) / position.trades.length
    : targetEntryPrice

  // Calculate total quantity from trades
  const totalQuantity = position.trades.reduce((sum, trade) => sum + trade.quantity, 0)

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto bg-white shadow-lg">
      {/* Header */}
      <header className="bg-gray-800 text-white p-4 flex items-center justify-between sticky top-0 z-50">
        <button
          onClick={() => navigate('/')}
          className="text-white text-xl hover:bg-gray-700 rounded p-1 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 ml-4">
          <div className="text-lg font-semibold">{position.symbol}</div>
          <div className="text-xs opacity-80">
            {position.strategy_type} • {totalQuantity || position.target_quantity || 0} shares
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowPriceUpdate(!showPriceUpdate)}
            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-xs transition-colors"
          >
            <Edit className="w-3 h-3 mr-1 inline" />
            Edit Price
          </button>
          <button className="bg-white/20 hover:bg-white/30 text-white p-1 rounded transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Performance Section */}
      <section className="bg-gradient-to-br from-red-600 to-red-800 text-white p-5">
        <div className="flex justify-between items-center mb-4">
          <div className="text-3xl font-bold">
            {formatCurrency(parseFloat(currentPrice))}
          </div>
          <div className="text-right">
            <div className="text-xl font-semibold">-$1,890</div>
            <div className="text-sm opacity-90">-12.4%</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xs opacity-80 uppercase tracking-wide mb-1">Avg Cost</div>
            <div className="text-lg font-semibold">{formatCurrency(avgCost)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs opacity-80 uppercase tracking-wide mb-1">Current</div>
            <div className="text-lg font-semibold">{formatCurrency(parseFloat(currentPrice))}</div>
          </div>
          <div className="text-center">
            <div className="text-xs opacity-80 uppercase tracking-wide mb-1">Stop</div>
            <div className="text-lg font-semibold">{formatCurrency(stopLoss)}</div>
          </div>
        </div>
      </section>

      <main className="pb-24">
        {/* Price Update Section */}
        {showPriceUpdate && (
          <section className="p-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <div className="text-sm font-medium text-yellow-800">Manual Price Update</div>
                <div className="text-xs text-yellow-600">Last: 2 min ago</div>
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(e.target.value)}
                  step="0.01"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Enter price"
                />
                <Button
                  onClick={handlePriceUpdate}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-500 text-white"
                >
                  Update
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Progress to Target */}
        <section className="mb-6">
          <div className="px-4 py-3">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Progress to Target</h3>

            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-600 mb-2">
                <span>Stop {formatCurrency(stopLoss)}</span>
                <span>{totalQuantity > 0 ? `${totalQuantity} shares @ ${formatCurrency(avgCost)}` : 'Pending opening trade'}</span>
                <span>Target {formatCurrency(profitTarget)}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden relative">
                {/* Progress indicator based on current price vs targets */}
                {totalQuantity > 0 && (
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.max(0, ((parseFloat(currentPrice) - avgCost) / (profitTarget - avgCost)) * 100))}%`
                    }}
                  ></div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">To Stop</div>
                <div className="text-lg font-semibold text-gray-500">
                  {totalQuantity > 0 ? formatCurrency(stopLoss - avgCost) : '—'}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-600 uppercase tracking-wide mb-1">Risk Amount</div>
                <div className="text-lg font-semibold text-gray-500">
                  {totalQuantity > 0 ? formatCurrency(Math.abs(avgCost - stopLoss) * totalQuantity) : '—'}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Accordion Sections */}
        <section className="bg-white border-t border-gray-200">
          {/* Trade Plan Accordion */}
          <Accordion
            title="Trade Plan"
            icon="🎯"
            indicator="(Immutable)"
            defaultOpen={isPlannedPosition}
          >
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center bg-red-50 border border-red-200 rounded-lg p-2 mb-3 text-xs text-red-800">
                <span className="mr-2">🔒</span>
                This trade plan is immutable and cannot be modified
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Target Entry Price</div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(targetEntryPrice)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Target Quantity</div>
                  <div className="text-sm font-medium text-gray-900">
                    {position.target_quantity} shares
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Profit Target</div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(profitTarget)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Stop Loss</div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(stopLoss)}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-600 mb-1">Position Thesis</div>
                <div className="text-sm text-gray-700 leading-relaxed bg-white p-3 rounded border border-gray-200">
                  {position.position_thesis}
                </div>
              </div>
            </div>
          </Accordion>

          {/* Trade History Accordion */}
          <Accordion
            title="Trade History"
            icon="📊"
            indicator={`(${position.trades.length})`}
            defaultOpen={hasTrades}
          >
            <div className="bg-white">
              {position.trades.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No trades executed yet
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {position.trades.map((trade, index) => (
                    <div key={trade.id} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            trade.trade_type === 'buy'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {trade.trade_type ? trade.trade_type.toUpperCase() : 'UNKNOWN'}
                          </span>
                          <span className="text-sm text-gray-600">
                            {trade.quantity} shares
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(trade.timestamp)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Price:</span>
                          <span className="ml-2 font-medium">{formatCurrency(trade.price)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Total:</span>
                          <span className="ml-2 font-medium">
                            {formatCurrency(trade.price * trade.quantity)}
                          </span>
                        </div>
                      </div>

                      {trade.notes && (
                        <div className="mt-2 text-xs text-gray-600">
                          <span className="font-medium">Notes:</span> {trade.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Accordion>

          {/* Journal Entries Accordion */}
          <Accordion
            title="Journal Entries"
            icon="📝"
            indicator={`(${journalEntries.length})`}
            defaultOpen={false}
          >
            <div className="bg-white">
              {journalLoading ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Loading journal entries...
                </div>
              ) : journalError ? (
                <div className="p-4 text-center text-red-500 text-sm">
                  {journalError}
                </div>
              ) : journalEntries.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No journal entries yet
                </div>
              ) : (
                journalEntries.map((entry, index) => (
                  <div key={entry.id} className={`p-4 ${index < journalEntries.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-xs text-gray-600 uppercase tracking-wide">
                        {formatEntryType(entry.entry_type)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(new Date(entry.executed_at || entry.created_at))}
                      </div>
                    </div>

                    {/* Display all journal fields */}
                    <div className="space-y-3">
                      {entry.fields.map((field, fieldIndex) => (
                        <div key={fieldIndex}>
                          <div className="text-xs text-gray-600 mb-1 font-medium">
                            {field.prompt}
                          </div>
                          <div className="text-sm text-gray-700 leading-relaxed">
                            {field.response}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Accordion>
        </section>

        {/* Add Journal Entry Button */}
        <section className="px-4 pb-4">
          <button
            onClick={handleAddJournal}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium transition-colors border border-gray-300"
          >
            Add Journal Entry
          </button>
        </section>
      </main>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 p-4">
        <button
          onClick={handleAddTrade}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 px-6 rounded-lg font-semibold transition-colors"
        >
          Add Trade
        </button>
      </div>

      {/* Trade Execution Modal */}
      {showTradeModal && position && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" data-testid="trade-execution-modal">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <TradeExecutionForm
              position={position}
              onTradeAdded={handleTradeAdded}
              onError={handleTradeError}
              onCancel={handleTradeCancel}
            />
          </div>
        </div>
      )}

<<<<<<< HEAD
      {showTradeJournalModal && (journalPositionSnapshot || position) && pendingTradeForJournal && (
        <div data-testid="trade-execution-journal-modal" className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5">
            <EnhancedJournalEntryForm
              entryType="trade_execution"
              onSave={handleTradeJournalSave}
              onCancel={handleTradeJournalSkip}
              submitButtonText="Save Journal"
              cancelButtonText="Skip for now"
              title="Trade Execution Journal"
              subtitle={`${(journalPositionSnapshot ?? position).symbol} • ${pendingTradeForJournal.quantity} shares @ ${pendingTradeForJournal.price.toFixed(2)}`}
              isLoading={isTradeJournalSaving}
              errorMessage={tradeJournalError ?? undefined}
            />
          </div>
        </div>
      )}
    </div>
  )
}
