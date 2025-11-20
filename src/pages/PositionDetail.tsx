import { useState, useEffect } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate, useParams } from 'react-router-dom'
import { PositionService } from '@/lib/position'
import type { Position, Trade } from '@/lib/position'
import { TradeService } from '@/services/TradeService'
import { JournalService } from '@/services/JournalService'
import { PriceService } from '@/services/PriceService'
import type { JournalEntry } from '@/types/journal'
import type { PriceHistory } from '@/types/priceHistory'
import { Button } from '@/components/ui/button'
import { Accordion } from '@/components/ui/accordion'
import { TradeExecutionForm } from '@/components/TradeExecutionForm'
import { EnhancedJournalEntryForm } from '@/components/EnhancedJournalEntryForm'
import { PnLDisplay } from '@/components/PnLDisplay'
import { ProgressIndicator } from '@/components/ProgressIndicator'
import { PriceUpdateCard } from '@/components/PriceUpdateCard'
import { PlanVsExecutionCard } from '@/components/PlanVsExecutionCard'
import type { JournalField } from '@/types/journal'
import { generateJournalId } from '@/lib/uuid'
import { calculatePositionPnL, calculatePnLPercentage } from '@/utils/pnl'
import { ArrowLeft, Edit, MoreHorizontal } from 'lucide-react'
import { JournalCarousel } from '@/components/JournalCarousel'

interface PositionDetailProps {
  positionService?: PositionService
  tradeService?: TradeService
  journalService?: JournalService
  priceService?: PriceService
}

export function PositionDetail({ positionService: injectedPositionService, tradeService: injectedTradeService, journalService: injectedJournalService, priceService: injectedPriceService }: PositionDetailProps = {}) {
  const navigate = useNavigate()
  const { id} = useParams<{ id: string }>()
  const [position, setPosition] = useState<Position | null>(null)
  const [priceHistory, setPriceHistory] = useState<PriceHistory | null>(null)
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [journalLoading, setJournalLoading] = useState(true)
  const [journalError, setJournalError] = useState<string | null>(null)
  const [showPriceUpdate, setShowPriceUpdate] = useState(false)
  const [showTradeModal, setShowTradeModal] = useState(false)
  const [showJournalModal, setShowJournalModal] = useState(false)
  const [selectedTradeId, setSelectedTradeId] = useState<string | undefined>(undefined)
  const [journalModalError, setJournalModalError] = useState<string | null>(null)
  const [planVsExecution, setPlanVsExecution] = useState<any>(null)
  const positionServiceInstance = injectedPositionService || new PositionService()
  const tradeServiceInstance = injectedTradeService || new TradeService()
  const priceServiceInstance = injectedPriceService || new PriceService()

  
  const getJournalService = async (): Promise<JournalService> => {
    if (injectedJournalService) {
      return injectedJournalService
    }

    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('TradingJournalDB', 3)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })

    return new JournalService(db)
  }

  useEffect(() => {
    loadPosition()
    loadJournalEntries()
  }, [id])

  useEffect(() => {
    if (position) {
      loadPriceHistory()
    }
  }, [position])

  // Calculate plan vs execution for closed positions
  useEffect(() => {
    const calculatePlanVsExec = async () => {
      if (position?.status === 'closed') {
        try {
          const comparison = await tradeServiceInstance.calculatePlanVsExecution(position.id)
          setPlanVsExecution(comparison)
        } catch (error) {
          console.error('Failed to calculate plan vs execution:', error)
        }
      } else {
        setPlanVsExecution(null)
      }
    }
    calculatePlanVsExec()
  }, [position?.status, position?.id])

  const loadPosition = async () => {
    if (!id) return

    try {
      const loadedPosition = await positionServiceInstance.getById(id)
      setPosition(loadedPosition)
    } catch (error) {
      console.error('Failed to load position:', error)
      setPosition(null)
    } finally {
      setLoading(false)
    }
  }

  const loadPriceHistory = async () => {
    if (!position) return

    try {
      const latestPrice = await priceServiceInstance.getLatestPrice(position.symbol)
      setPriceHistory(latestPrice)
    } catch (error) {
      console.error('Failed to load price history:', error)
      setPriceHistory(null)
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

  // Unused function - kept for potential future use
  // const formatEntryType = (entryType: string) => {
  //   switch (entryType) {
  //     case 'position_plan':
  //       return 'Position Plan'
  //     case 'trade_execution':
  //       return 'Trade Execution'
  //     default:
  //       return entryType
  //   }
  // }

  const formatTradeSummary = (trade: Trade): string => {
    const type = trade.trade_type === 'buy' ? 'Buy' : 'Sell'
    const quantity = trade.quantity
    const price = formatCurrency(trade.price)
    const date = formatDate(trade.timestamp)
    return `${type} ${quantity} @ ${price} on ${date}`
  }

  const handlePriceUpdated = (updatedPrice: PriceHistory) => {
    setPriceHistory(updatedPrice)
  }

  const handleAddTrade = () => {
    setShowTradeModal(true)
  }

  const handleTradeAdded = async (trade: Trade) => {
    try {
      // addTrade returns all trades including the newly added one
      const updatedTrades = await tradeServiceInstance.addTrade(trade)
      setShowTradeModal(false)

      // Refresh position to include the new trade
      await loadPosition()

      // Get the newly added trade (it will be the last one in Phase 1A)
      const newTrade = updatedTrades[updatedTrades.length - 1]

      // Use flushSync to ensure selectedTradeId is set synchronously
      // before opening the modal, guaranteeing the dropdown has the correct value
      flushSync(() => {
        setSelectedTradeId(newTrade.id)
      })

      // Now open the modal - selectedTradeId will be in sync
      setShowJournalModal(true)
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

  const handleAddJournal = () => {
    setSelectedTradeId(undefined) // Default to no trade selected
    setJournalModalError(null) // Clear any previous errors
    setShowJournalModal(true)
  }

  const handleJournalTradeChange = (tradeId: string) => {
    setSelectedTradeId(tradeId || undefined)
  }

  const handleJournalSave = async (fields: JournalField[]) => {
    if (!position) return

    try {
      setJournalModalError(null) // Clear previous errors
      const journalService = await getJournalService()
      const entryType = selectedTradeId ? 'trade_execution' : 'position_plan'

      // Prevent duplicate position plan journal entries
      if (entryType === 'position_plan') {
        const hasPositionPlan = journalEntries.some(entry => entry.entry_type === 'position_plan')
        if (hasPositionPlan) {
          setJournalModalError('This position already has a position plan journal entry. You can only have one position plan journal per position.')
          return
        }
      }

      // Create journal entry
      const journalEntry = await journalService.create({
        id: generateJournalId(),
        position_id: position.id,
        trade_id: selectedTradeId,
        entry_type: entryType,
        fields,
        created_at: new Date().toISOString()
      })

      // Update position to reference the journal entry
      if (position && !position.journal_entry_ids.includes(journalEntry.id)) {
        position.journal_entry_ids.push(journalEntry.id)
        await positionServiceInstance.update(position)
      }

      setShowJournalModal(false)
      setSelectedTradeId(undefined)
      setJournalModalError(null)
      await loadJournalEntries() // Refresh journal list
    } catch (error) {
      console.error('Failed to create journal entry:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create journal entry'
      setJournalModalError(errorMessage)
      // Don't throw - keep modal open for retry
    }
  }

  const handleJournalCancel = () => {
    setShowJournalModal(false)
    setSelectedTradeId(undefined)
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

  // Calculate total cost - unused for now
  // const totalCost = position.trades.reduce((sum, trade) => sum + (trade.price * trade.quantity), 0)

  // Calculate P&L from price history
  const priceMap = priceHistory ? new Map([[priceHistory.underlying, priceHistory]]) : new Map()
  const pnl = hasTrades ? calculatePositionPnL(position, priceMap) : null

  const costBasis = position.trades.reduce((sum, trade) => {
    if (trade.trade_type === 'buy') {
      return sum + (trade.price * trade.quantity)
    }
    return sum
  }, 0)

  const pnlPercentage = pnl !== null && costBasis > 0
    ? calculatePnLPercentage(pnl, costBasis)
    : undefined

  const currentPrice = priceHistory?.close || avgCost

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
      <section className={`p-5 text-white ${
        pnl === null ? 'bg-gray-600' :
        pnl > 0 ? 'bg-gradient-to-br from-green-600 to-green-800' :
        pnl < 0 ? 'bg-gradient-to-br from-red-600 to-red-800' :
        'bg-gray-600'
      }`}>
        <div className="flex justify-between items-center mb-4">
          <div className="text-3xl font-bold">
            {formatCurrency(currentPrice)}
          </div>
          <div className="text-right">
            <div className="text-xl font-semibold">
              <PnLDisplay pnl={pnl} percentage={pnlPercentage} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xs opacity-80 uppercase tracking-wide mb-1">Avg Cost</div>
            <div className="text-lg font-semibold">{formatCurrency(avgCost)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs opacity-80 uppercase tracking-wide mb-1">Current</div>
            <div className="text-lg font-semibold">{formatCurrency(currentPrice)}</div>
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
            <PriceUpdateCard
              underlying={position.symbol}
              priceService={priceServiceInstance}
              onPriceUpdated={handlePriceUpdated}
            />
          </section>
        )}

        {/* Progress to Target */}
        {hasTrades && position.status !== 'closed' && (
          <section className="mb-6">
            <div className="px-4 py-3">
              <ProgressIndicator
                currentPrice={currentPrice}
                stopLoss={stopLoss}
                profitTarget={profitTarget}
              />
            </div>
          </section>
        )}

        {/* Plan vs Execution Analysis (Closed Positions Only) */}
        {position.status === 'closed' && planVsExecution && (
          <section className="mb-6">
            <div className="px-4 py-3">
              <PlanVsExecutionCard comparison={planVsExecution} />
            </div>
          </section>
        )}

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
                  {position.trades.map((trade, _index) => (
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
            {journalLoading ? (
              <div className="p-4 text-center text-gray-500 text-sm bg-white">
                Loading journal entries...
              </div>
            ) : journalError ? (
              <div className="p-4 text-center text-red-500 text-sm bg-white">
                {journalError}
              </div>
            ) : journalEntries.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm bg-white">
                No journal entries yet
              </div>
            ) : (
              <JournalCarousel entries={journalEntries} />
            )}
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

      {/* Add Journal Entry Modal */}
      {showJournalModal && position && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" data-testid="add-journal-modal">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Journal Entry</h2>

            {/* Error Display */}
            {journalModalError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {journalModalError}
              </div>
            )}

            {/* Trade Selection Dropdown */}
            <div className="mb-4">
              <label htmlFor="trade-select" className="block text-sm font-medium text-gray-700 mb-2">
                Select Trade (Optional)
              </label>
              <select
                id="trade-select"
                value={selectedTradeId || ''}
                onChange={(e) => handleJournalTradeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Select trade"
              >
                <option value="">Position Journal (no trade)</option>
                {position.trades.map((trade) => (
                  <option key={trade.id} value={trade.id}>
                    {formatTradeSummary(trade)}
                  </option>
                ))}
              </select>
            </div>

            {/* Enhanced Journal Entry Form */}
            <EnhancedJournalEntryForm
              entryType={selectedTradeId ? 'trade_execution' : 'position_plan'}
              onSave={handleJournalSave}
              onCancel={handleJournalCancel}
              submitButtonText="Save Journal Entry"
            />
          </div>
        </div>
      )}
    </div>
  )
}