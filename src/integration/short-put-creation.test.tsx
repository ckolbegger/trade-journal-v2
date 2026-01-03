import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import App from '../App'
import { PositionService } from '@/lib/position'
import { JournalService } from '@/services/JournalService'
import { ServiceContainer } from '@/services/ServiceContainer'
import 'fake-indexeddb/auto'

async function clearDatabase() {
  const deleteRequest = indexedDB.deleteDatabase('TradingJournalDB')
  await new Promise<void>((resolve) => {
    deleteRequest.onsuccess = () => resolve()
    deleteRequest.onerror = () => resolve()
    deleteRequest.onblocked = () => resolve()
  })
}

async function resetAndInitServiceContainer() {
  ServiceContainer.resetInstance()
  const services = ServiceContainer.getInstance()
  await services.initialize()
  return services
}

describe('Integration: Short Put Position Creation Flow', () => {
  let positionService: PositionService
  let journalService: JournalService

  beforeEach(async () => {
    await clearDatabase()
    const services = await resetAndInitServiceContainer()
    positionService = services.getPositionService()
    journalService = services.getJournalService()
  })

  afterEach(async () => {
    ServiceContainer.resetInstance()
    await clearDatabase()
  })

  it('should display Short Put position on dashboard with all required fields', async () => {
    await act(async () => {
      const db = (ServiceContainer.getInstance() as any).db
      const positionId = `pos-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const journalId = `journal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const shortPutPosition = {
        id: positionId,
        symbol: 'MSFT',
        strategy_type: 'Short Put' as const,
        trade_kind: 'option' as const,
        option_type: 'put' as const,
        strike_price: 380,
        expiration_date: new Date('2025-03-21'),
        premium_per_contract: 5.00,
        profit_target_basis: 'stock_price' as const,
        stop_loss_basis: 'stock_price' as const,
        target_entry_price: 375,
        target_quantity: 5,
        profit_target: 382,
        stop_loss: 370,
        position_thesis: 'MSFT cloud growth thesis with strong support',
        created_date: new Date(),
        status: 'planned' as const,
        journal_entry_ids: [journalId],
        trades: []
      }

      const transaction = db.transaction(['positions', 'journal_entries'], 'readwrite')
      await new Promise<void>((resolve, reject) => {
        const positionRequest = transaction.objectStore('positions').add(shortPutPosition)
        positionRequest.onerror = () => reject(positionRequest.error)
        positionRequest.onsuccess = () => {
          const journalEntry = {
            id: journalId,
            position_id: positionId,
            entry_type: 'position_plan' as const,
            fields: [
              { name: 'rationale', prompt: 'Rationale', response: 'Strong cloud growth expected' }
            ],
            created_at: new Date().toISOString()
          }
          const journalRequest = transaction.objectStore('journal_entries').add(journalEntry)
          journalRequest.onerror = () => reject(journalRequest.error)
          journalRequest.onsuccess = () => resolve()
        }
      })
    })

    await act(async () => {
      window.history.pushState({}, 'Test', '/')
      render(<App />)
    })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Positions' })).toBeInTheDocument()
      expect(screen.getByText('MSFT')).toBeInTheDocument()
      expect(screen.getByText('Short Put')).toBeInTheDocument()
    }, { timeout: 2000 })

    const positionCard = screen.getByTestId('position-card')
    expect(positionCard).toBeInTheDocument()

    expect(screen.getByText('$380.00')).toBeInTheDocument()
    expect(screen.getByText('Mar 21, 2025')).toBeInTheDocument()
    expect(screen.getByText('$5.00')).toBeInTheDocument()
    expect(screen.getByText('500')).toBeInTheDocument()
    expect(screen.getByText('planned')).toBeInTheDocument()

    const journalEntries = await journalService.findByPositionId(positionCard.getAttribute('data-position-id') || '')
    expect(journalEntries).toHaveLength(1)
    expect(journalEntries[0].fields[0].response).toBe('Strong cloud growth expected')
  })

  it('should navigate from dashboard to Short Put position detail', async () => {
    await act(async () => {
      const db = (ServiceContainer.getInstance() as any).db

      const shortPutPosition = {
        id: 'pos-nav-test',
        symbol: 'NVDA',
        strategy_type: 'Short Put' as const,
        trade_kind: 'option' as const,
        option_type: 'put' as const,
        strike_price: 500,
        expiration_date: new Date('2025-04-18'),
        premium_per_contract: 8.50,
        profit_target_basis: 'stock_price' as const,
        stop_loss_basis: 'stock_price' as const,
        target_entry_price: 495,
        target_quantity: 2,
        profit_target: 502,
        stop_loss: 485,
        position_thesis: 'NVDA AI chip demand thesis',
        created_date: new Date(),
        status: 'planned' as const,
        journal_entry_ids: [],
        trades: []
      }

      const transaction = db.transaction(['positions'], 'readwrite')
      await new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('positions').add(shortPutPosition)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })
    })

    await act(async () => {
      window.history.pushState({}, 'Test', '/')
      render(<App />)
    })

    await waitFor(() => {
      expect(screen.getByText('NVDA')).toBeInTheDocument()
      expect(screen.getByText('Short Put')).toBeInTheDocument()
    })

    const positionCard = screen.getByTestId('position-card')
    fireEvent.click(positionCard)

    await waitFor(() => {
      expect(screen.getByText('NVDA')).toBeInTheDocument()
      expect(screen.getByText(/Short Put/i)).toBeInTheDocument()
      expect(screen.getByText('Trade Plan')).toBeInTheDocument()
      expect(screen.getByText('Target Entry Price')).toBeInTheDocument()
      expect(screen.getByText('Target Quantity')).toBeInTheDocument()
      expect(screen.getByText('NVDA AI chip demand thesis')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('should calculate Short Put risk metrics correctly during form entry', async () => {
    await act(async () => {
      window.history.pushState({}, 'Test', '/')
      render(<App />)
    })

    const createButton = screen.getByRole('button', { name: /Create Your First Position/i })
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(screen.getByText('Position Plan')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'SPY' } })

    const strategySelect = screen.getByLabelText(/Strategy Type/i)
    fireEvent.change(strategySelect, { target: { value: 'Short Put' } })

    await waitFor(() => {
      expect(screen.getByLabelText(/Premium per Contract/i)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/Strike Price/i), { target: { value: '550.00' } })
    fireEvent.change(screen.getByLabelText(/Expiration Date/i), { target: { value: '03/07/2025' } })
    fireEvent.change(screen.getByLabelText(/Premium per Contract/i), { target: { value: '3.00' } })
    fireEvent.change(screen.getByLabelText(/Target Underlying Price/i), { target: { value: '545.00' } })
    fireEvent.change(screen.getByLabelText(/Target Quantity/i), { target: { value: '10' } })
    fireEvent.change(screen.getByLabelText(/Profit Target/i), { target: { value: '547.00' } })
    fireEvent.change(screen.getByLabelText(/Stop Loss/i), { target: { value: '540.00' } })
    fireEvent.change(screen.getByLabelText(/Position Thesis/i), {
      target: { value: 'SPY consolidation with bullish bias expected' }
    })

    const nextButton = screen.getByText('Next: Trading Journal')
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText('📝 Position Plan')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/Rationale/i), {
      target: { value: 'Technical analysis supports continued uptrend' }
    })

    const nextToRiskButton = screen.getByRole('button', { name: /Next: Risk Assessment/i })
    fireEvent.click(nextToRiskButton)

    await waitFor(() => {
      expect(screen.getByText('Risk Assessment')).toBeInTheDocument()
    })

    expect(screen.getByText('$3,000.00')).toBeInTheDocument()
    expect(screen.getByText('$547.00')).toBeInTheDocument()
    expect(screen.getByText('$547,000.00')).toBeInTheDocument()
  })

  it('should verify Short Put position data via service layer', async () => {
    const shortPutPosition = {
      id: 'pos-service-test',
      symbol: 'AAPL',
      strategy_type: 'Short Put' as const,
      trade_kind: 'option' as const,
      option_type: 'put' as const,
      strike_price: 105,
      expiration_date: new Date('2025-02-21'),
      premium_per_contract: 2.50,
      profit_target_basis: 'stock_price' as const,
      stop_loss_basis: 'stock_price' as const,
      target_entry_price: 100,
      target_quantity: 3,
      profit_target: 102,
      stop_loss: 98,
      position_thesis: 'AAPL support level analysis',
      created_date: new Date(),
      status: 'planned' as const,
      journal_entry_ids: [],
      trades: []
    }

    const createdPosition = await positionService.create(shortPutPosition)

    expect(createdPosition.id).toBe('pos-service-test')
    expect(createdPosition.symbol).toBe('AAPL')
    expect(createdPosition.strategy_type).toBe('Short Put')
    expect(createdPosition.trade_kind).toBe('option')
    expect(createdPosition.option_type).toBe('put')
    expect(createdPosition.strike_price).toBe(105)
    expect(createdPosition.expiration_date).toBeInstanceOf(Date)
    expect(createdPosition.premium_per_contract).toBe(2.50)
    expect(createdPosition.target_entry_price).toBe(100)
    expect(createdPosition.target_quantity).toBe(3)
    expect(createdPosition.profit_target).toBe(102)
    expect(createdPosition.stop_loss).toBe(98)
    expect(createdPosition.status).toBe('planned')

    const retrievedPosition = await positionService.getById('pos-service-test')
    expect(retrievedPosition).toEqual(createdPosition)

    const allPositions = await positionService.getAll()
    expect(allPositions).toHaveLength(1)
    expect(allPositions[0]).toEqual(createdPosition)
  })
})
