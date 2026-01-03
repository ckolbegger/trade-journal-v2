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

describe('Integration: Short Put Validation Error Flow', () => {
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

  it('should display error for negative strike price and allow correction', async () => {
    await act(async () => {
      window.history.pushState({}, 'Test', '/position/create')
      render(<App />)
    })

    await waitFor(() => {
      expect(screen.getByText('Position Plan')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'MSFT' } })

    const strategySelect = screen.getByLabelText(/Strategy Type/i)
    fireEvent.change(strategySelect, { target: { value: 'Short Put' } })

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /Strike Price/i })).toBeInTheDocument()
    })

    fireEvent.change(screen.getByRole('textbox', { name: /Strike Price/i }), { target: { value: '-50' } })

    const nextButton = screen.getByText('Next: Trading Journal')
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText('Strike price must be positive')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByRole('textbox', { name: /Strike Price/i }), { target: { value: '400' } })

    expect(screen.queryByText('Strike price must be positive')).not.toBeInTheDocument()
  })

  it('should display error for zero strike price', async () => {
    await act(async () => {
      window.history.pushState({}, 'Test', '/position/create')
      render(<App />)
    })

    await waitFor(() => {
      expect(screen.getByText('Position Plan')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'AAPL' } })

    const strategySelect = screen.getByLabelText(/Strategy Type/i)
    fireEvent.change(strategySelect, { target: { value: 'Short Put' } })

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /Strike Price/i })).toBeInTheDocument()
    })

    fireEvent.change(screen.getByRole('textbox', { name: /Strike Price/i }), { target: { value: '0' } })

    const nextButton = screen.getByText('Next: Trading Journal')
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText('Strike price must be positive')).toBeInTheDocument()
    })
  })

  it('should show multiple validation errors at once for Short Put', async () => {
    await act(async () => {
      window.history.pushState({}, 'Test', '/position/create')
      render(<App />)
    })

    await waitFor(() => {
      expect(screen.getByText('Position Plan')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'TSLA' } })

    const strategySelect = screen.getByLabelText(/Strategy Type/i)
    fireEvent.change(strategySelect, { target: { value: 'Short Put' } })

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /Strike Price/i })).toBeInTheDocument()
    })

    const nextButton = screen.getByText('Next: Trading Journal')
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText('Strike price is required')).toBeInTheDocument()
      expect(screen.getByText('Expiration date is required')).toBeInTheDocument()
      expect(screen.getByText('Premium per contract is required')).toBeInTheDocument()
    })
  })

  it('should clear strike price error when a valid value is entered', async () => {
    await act(async () => {
      window.history.pushState({}, 'Test', '/position/create')
      render(<App />)
    })

    await waitFor(() => {
      expect(screen.getByText('Position Plan')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'NVDA' } })

    const strategySelect = screen.getByLabelText(/Strategy Type/i)
    fireEvent.change(strategySelect, { target: { value: 'Short Put' } })

    await waitFor(() => {
      expect(screen.getByRole('textbox', { name: /Strike Price/i })).toBeInTheDocument()
    })

    const nextButton = screen.getByText('Next: Trading Journal')
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText('Strike price is required')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByRole('textbox', { name: /Strike Price/i }), { target: { value: '500' } })

    expect(screen.queryByText('Strike price is required')).not.toBeInTheDocument()
  })

  it('should clear premium error when a valid value is entered', async () => {
    await act(async () => {
      window.history.pushState({}, 'Test', '/position/create')
      render(<App />)
    })

    await waitFor(() => {
      expect(screen.getByText('Position Plan')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'AMD' } })

    const strategySelect = screen.getByLabelText(/Strategy Type/i)
    fireEvent.change(strategySelect, { target: { value: 'Short Put' } })

    await waitFor(() => {
      expect(screen.getByLabelText(/Premium per Contract/i)).toBeInTheDocument()
    })

    const nextButton = screen.getByText('Next: Trading Journal')
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText('Premium per contract is required')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/Premium per Contract/i), { target: { value: '2.50' } })

    expect(screen.queryByText('Premium per contract is required')).not.toBeInTheDocument()
  })

  it('should verify form validation and navigation through all steps with Short Put data', async () => {
    await act(async () => {
      window.history.pushState({}, 'Test', '/position/create')
      render(<App />)
    })

    await waitFor(() => {
      expect(screen.getByText('Position Plan')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'SPY' } })

    const strategySelect = screen.getByLabelText(/Strategy Type/i)
    fireEvent.change(strategySelect, { target: { value: 'Short Put' } })

    await waitFor(() => {
      expect(screen.getByLabelText(/Premium per Contract/i)).toBeInTheDocument()
    })

    const futureDate = new Date()
    futureDate.setMonth(futureDate.getMonth() + 1)
    const futureDateStr = futureDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })

    fireEvent.change(screen.getByRole('textbox', { name: /Strike Price/i }), { target: { value: '575' } })
    fireEvent.change(screen.getByLabelText(/Expiration Date/i), { target: { value: futureDateStr } })
    fireEvent.change(screen.getByLabelText(/Premium per Contract/i), { target: { value: '3.50' } })
    fireEvent.change(screen.getByLabelText(/Target Underlying Price/i), { target: { value: '570' } })
    fireEvent.change(screen.getByLabelText(/Target Quantity/i), { target: { value: '5' } })
    fireEvent.change(screen.getByLabelText(/Profit Target/i), { target: { value: '573' } })
    fireEvent.change(screen.getByLabelText(/Stop Loss/i), { target: { value: '565' } })
    fireEvent.change(screen.getByLabelText(/Position Thesis/i), {
      target: { value: 'SPY consolidation with bullish bias expected into year end' }
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

    expect(screen.getByText(/\$1,750\.00/)).toBeInTheDocument()

    const nextToConfirmButton = screen.getByRole('button', { name: /Next: Confirmation/i })
    fireEvent.click(nextToConfirmButton)

    await waitFor(() => {
      expect(screen.getByText('Confirmation')).toBeInTheDocument()
    })

    expect(screen.getByText(/\$575\.00/)).toBeInTheDocument()
    expect(screen.getByText(/\$3\.50/)).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('should verify position saved via service layer after validation passes', async () => {
    await act(async () => {
      window.history.pushState({}, 'Test', '/position/create')
      render(<App />)
    })

    await waitFor(() => {
      expect(screen.getByText('Position Plan')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'QQQ' } })

    const strategySelect = screen.getByLabelText(/Strategy Type/i)
    fireEvent.change(strategySelect, { target: { value: 'Short Put' } })

    await waitFor(() => {
      expect(screen.getByLabelText(/Premium per Contract/i)).toBeInTheDocument()
    })

    const futureDate = new Date()
    futureDate.setMonth(futureDate.getMonth() + 2)
    const futureDateStr = futureDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })

    fireEvent.change(screen.getByRole('textbox', { name: /Strike Price/i }), { target: { value: '520' } })
    fireEvent.change(screen.getByLabelText(/Expiration Date/i), { target: { value: futureDateStr } })
    fireEvent.change(screen.getByLabelText(/Premium per Contract/i), { target: { value: '2.25' } })
    fireEvent.change(screen.getByLabelText(/Target Underlying Price/i), { target: { value: '515' } })
    fireEvent.change(screen.getByLabelText(/Target Quantity/i), { target: { value: '10' } })
    fireEvent.change(screen.getByLabelText(/Profit Target/i), { target: { value: '518' } })
    fireEvent.change(screen.getByLabelText(/Stop Loss/i), { target: { value: '510' } })
    fireEvent.change(screen.getByLabelText(/Position Thesis/i), {
      target: { value: 'QQQ tech sector rotation play with support at $500' }
    })

    const nextButton = screen.getByText('Next: Trading Journal')
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText('📝 Position Plan')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/Rationale/i), {
      target: { value: 'Semiconductor sector recovery expected in coming months' }
    })

    const nextToRiskButton = screen.getByRole('button', { name: /Next: Risk Assessment/i })
    fireEvent.click(nextToRiskButton)

    await waitFor(() => {
      expect(screen.getByText('Risk Assessment')).toBeInTheDocument()
    })

    const nextToConfirmButton = screen.getByRole('button', { name: /Next: Confirmation/i })
    fireEvent.click(nextToConfirmButton)

    await waitFor(() => {
      expect(screen.getByText('Confirmation')).toBeInTheDocument()
    })

    const immutableCheckbox = screen.getByLabelText(/immutable/i)
    fireEvent.click(immutableCheckbox)

    const createButton = screen.getByRole('button', { name: /Create Position Plan/i })
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(screen.getByText('QQQ')).toBeInTheDocument()
    }, { timeout: 5000 })

    const testId = 'short-put-test-' + Date.now()
    const shortPutPosition = {
      id: testId,
      symbol: 'QQQ',
      strategy_type: 'Short Put' as const,
      trade_kind: 'option' as const,
      option_type: 'put' as const,
      strike_price: 520,
      expiration_date: new Date(futureDate),
      premium_per_contract: 2.25,
      profit_target_basis: 'stock_price' as const,
      stop_loss_basis: 'stock_price' as const,
      target_entry_price: 515,
      target_quantity: 10,
      profit_target: 518,
      stop_loss: 510,
      position_thesis: 'QQQ tech sector rotation play with support at $500',
      created_date: new Date(),
      status: 'planned' as const,
      journal_entry_ids: [],
      trades: []
    }

    const createdPosition = await positionService.create(shortPutPosition)

    expect(createdPosition.id).toBe(testId)
    expect(createdPosition.symbol).toBe('QQQ')
    expect(createdPosition.strategy_type).toBe('Short Put')
    expect(createdPosition.trade_kind).toBe('option')
    expect(createdPosition.option_type).toBe('put')
    expect(createdPosition.strike_price).toBe(520)
    expect(createdPosition.expiration_date).toBeInstanceOf(Date)
    expect(createdPosition.premium_per_contract).toBe(2.25)
    expect(createdPosition.status).toBe('planned')

    const retrievedPosition = await positionService.getById(createdPosition.id)
    expect(retrievedPosition).toEqual(createdPosition)

    const allPositions = await positionService.getAll()
    expect(allPositions.length).toBeGreaterThanOrEqual(1)
  })
})
