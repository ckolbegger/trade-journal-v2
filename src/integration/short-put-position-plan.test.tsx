import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from '../App'
import { PositionService } from '@/lib/position'
import { JournalService } from '@/services/JournalService'
import { ServiceContainer } from '@/services/ServiceContainer'
import 'fake-indexeddb/auto'

describe('Integration: Short Put Position Plan', () => {
  let positionService: PositionService
  let journalService: JournalService

  beforeEach(async () => {
    const deleteRequest = indexedDB.deleteDatabase('TradingJournalDB')
    await new Promise<void>((resolve) => {
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => resolve()
      deleteRequest.onblocked = () => resolve()
    })

    ServiceContainer.resetInstance()
    const services = ServiceContainer.getInstance()
    await services.initialize()

    positionService = services.getPositionService()
    journalService = services.getJournalService()
  })

  afterEach(async () => {
    if (positionService) {
      await positionService.clearAll()
    }

    ServiceContainer.resetInstance()
    const deleteRequest = indexedDB.deleteDatabase('TradingJournalDB')
    await new Promise<void>((resolve) => {
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => resolve()
      deleteRequest.onblocked = () => resolve()
    })
  })

  it('should create a planned short put position with option fields', async () => {
    window.history.pushState({}, 'Test', '/')
    render(<App />)

    const createButton = await screen.findByRole('button', { name: /Create Your First Position/i })
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(screen.getByText('Position Plan')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/Strategy Type/i), { target: { value: 'Short Put' } })
    fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'TSLA' } })
    fireEvent.change(screen.getByLabelText(/Target Entry Price/i), { target: { value: '210' } })
    fireEvent.change(screen.getByLabelText(/Contract Quantity/i), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText(/Strike Price/i), { target: { value: '200' } })
    fireEvent.change(screen.getByLabelText(/Expiration Date/i), { target: { value: '2099-01-17' } })
    fireEvent.change(screen.getByLabelText(/Target Premium/i), { target: { value: '3.50' } })
    fireEvent.change(screen.getByLabelText(/^Profit Target \*$/i), { target: { value: '2.00' } })
    fireEvent.change(screen.getByLabelText(/^Stop Loss \*$/i), { target: { value: '5.00' } })
    fireEvent.change(screen.getByLabelText(/Profit Target Basis/i), { target: { value: 'stock_price' } })
    fireEvent.change(screen.getByLabelText(/Stop Loss Basis/i), { target: { value: 'option_price' } })
    fireEvent.change(screen.getByLabelText(/Position Thesis/i), { target: { value: 'Short put plan' } })

    fireEvent.click(screen.getByText('Next: Trading Journal'))
    await waitFor(() => expect(screen.getByText('📝 Position Plan')).toBeInTheDocument())

    fireEvent.change(screen.getByLabelText(/Rationale/i), {
      target: { value: 'Selling puts at support with defined risk.' }
    })
    fireEvent.click(screen.getByRole('button', { name: /Next: Risk Assessment/i }))
    await waitFor(() => expect(screen.getByText('Risk Assessment')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /Next: Confirmation/i }))
    await waitFor(() => expect(screen.getByText('Confirmation')).toBeInTheDocument())

    const immutableCheckbox = screen.getByRole('checkbox', {
      name: /I understand this position plan will be immutable/i
    })
    fireEvent.click(immutableCheckbox)

    const createPositionButton = screen.getByText('Create Position Plan')
    fireEvent.click(createPositionButton)

    await waitFor(() => {
      expect(screen.getByText('TSLA')).toBeInTheDocument()
      expect(screen.getByText('Short Put')).toBeInTheDocument()
    }, { timeout: 3000 })

    const savedPositions = await positionService.getAll()
    expect(savedPositions).toHaveLength(1)

    const savedPosition = savedPositions[0]
    expect(savedPosition.symbol).toBe('TSLA')
    expect(savedPosition.strategy_type).toBe('Short Put')
    expect(savedPosition.trade_kind).toBe('option')
    expect(savedPosition.target_entry_price).toBe(210)
    expect(savedPosition.target_quantity).toBe(2)
    expect(savedPosition.profit_target).toBe(2)
    expect(savedPosition.profit_target_basis).toBe('stock_price')
    expect(savedPosition.stop_loss).toBe(5)
    expect(savedPosition.stop_loss_basis).toBe('option_price')
    expect(savedPosition.option_type).toBe('put')
    expect(savedPosition.strike_price).toBe(200)
    expect(savedPosition.premium_per_contract).toBe(3.5)
    expect(savedPosition.status).toBe('planned')
    expect(savedPosition.trades).toHaveLength(0)

    expect(savedPosition.expiration_date).toBeInstanceOf(Date)
    expect(savedPosition.expiration_date?.getFullYear()).toBe(2099)
    expect(savedPosition.expiration_date?.getMonth()).toBe(0)
    expect(savedPosition.expiration_date?.getDate()).toBe(17)

    const journalEntries = await journalService.findByPositionId(savedPosition.id)
    expect(journalEntries).toHaveLength(1)
    expect(journalEntries[0].entry_type).toBe('position_plan')
  })
})
