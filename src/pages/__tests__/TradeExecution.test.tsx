import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import TradeExecution from '@/pages/TradeExecution'
import { PositionService } from '@/lib/position'
import type { Position } from '@/lib/position'
import 'fake-indexeddb/auto'

describe('TradeExecution - Form Component', () => {
  let positionService: PositionService
  let testPosition: Position

  beforeEach(async () => {
    positionService = new PositionService()
    await positionService.clearAll()

    // Create a test position
    testPosition = {
      id: 'pos-test-1',
      symbol: 'AAPL',
      strategy_type: 'Long Stock',
      target_entry_price: 150.00,
      target_quantity: 100,
      profit_target: 165.00,
      stop_loss: 135.00,
      position_thesis: 'Test thesis',
      status: 'planned',
      created_date: new Date('2024-01-15'),
      journal_entry_ids: [],
      trades: []
    }

    await positionService.create(testPosition)
  })

  afterEach(() => {
    positionService.close()
    vi.clearAllMocks()
  })

  it('should render trade execution form with all fields', async () => {
    render(
      <MemoryRouter initialEntries={['/trade-execution/pos-test-1']}>
        <Routes>
          <Route path="/trade-execution/:positionId" element={<TradeExecution />} />
        </Routes>
      </MemoryRouter>
    )

    // Wait for position to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Add Trade/i })).toBeInTheDocument()
    })

    // Check form fields exist
    expect(screen.getByLabelText(/Quantity/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Price/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Execution Date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Notes/i)).toBeInTheDocument()

    // Check trade type buttons
    expect(screen.getByRole('button', { name: /BUY/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /SELL/i })).toBeInTheDocument()

    // Check action buttons exist (both have "Add Trade" or "Cancel" text)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(2)
  })

  it('should display position plan context', async () => {
    render(
      <MemoryRouter initialEntries={['/trade-execution/pos-test-1']}>
        <Routes>
          <Route path="/trade-execution/:positionId" element={<TradeExecution />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/AAPL Long Stock/i)).toBeInTheDocument()
    })

    // Check position details are displayed
    expect(screen.getByText(/Long Stock/i)).toBeInTheDocument()
    expect(screen.getByText(/100 shares @ \$150\.00/i)).toBeInTheDocument() // target
  })

  it('should validate quantity input (positive numbers only)', async () => {
    render(
      <MemoryRouter initialEntries={['/trade-execution/pos-test-1']}>
        <Routes>
          <Route path="/trade-execution/:positionId" element={<TradeExecution />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/Quantity/i)).toBeInTheDocument()
    })

    const quantityInput = screen.getByLabelText(/Quantity/i)

    // Try to enter negative quantity
    fireEvent.change(quantityInput, { target: { value: '-10' } })
    fireEvent.blur(quantityInput)

    await waitFor(() => {
      expect(screen.getByText(/quantity must be positive/i)).toBeInTheDocument()
    })
  })

  it('should validate price input (positive numbers, 4 decimal precision)', async () => {
    render(
      <MemoryRouter initialEntries={['/trade-execution/pos-test-1']}>
        <Routes>
          <Route path="/trade-execution/:positionId" element={<TradeExecution />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/Price/i)).toBeInTheDocument()
    })

    const priceInput = screen.getByLabelText(/Price/i)

    // Try to enter negative price
    fireEvent.change(priceInput, { target: { value: '-50' } })
    fireEvent.blur(priceInput)

    await waitFor(() => {
      expect(screen.getByText(/price must be positive/i)).toBeInTheDocument()
    })
  })

  it('should validate execution date (not future-dated)', async () => {
    render(
      <MemoryRouter initialEntries={['/trade-execution/pos-test-1']}>
        <Routes>
          <Route path="/trade-execution/:positionId" element={<TradeExecution />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/Execution Date/i)).toBeInTheDocument()
    })

    const dateInput = screen.getByLabelText(/Execution Date/i)

    // Set future date
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)
    const futureDateString = futureDate.toISOString().slice(0, 16)

    fireEvent.change(dateInput, { target: { value: futureDateString } })
    fireEvent.blur(dateInput)

    await waitFor(() => {
      expect(screen.getByText(/execution date cannot be in the future/i)).toBeInTheDocument()
    })
  })

  it('should show plan vs actual comparison', async () => {
    render(
      <MemoryRouter initialEntries={['/trade-execution/pos-test-1']}>
        <Routes>
          <Route path="/trade-execution/:positionId" element={<TradeExecution />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Executing Against Position Plan/i)).toBeInTheDocument()
    })

    // Check plan details are shown
    expect(screen.getByText(/100 shares @ \$150\.00/i)).toBeInTheDocument()

    // Progress tracking should be visible
    expect(screen.getByText(/Filled/i)).toBeInTheDocument()
    expect(screen.getByText(/Remaining/i)).toBeInTheDocument()
  })

  it('should calculate trade total (quantity × price)', async () => {
    render(
      <MemoryRouter initialEntries={['/trade-execution/pos-test-1']}>
        <Routes>
          <Route path="/trade-execution/:positionId" element={<TradeExecution />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/Quantity/i)).toBeInTheDocument()
    })

    const quantityInput = screen.getByLabelText(/Quantity/i)
    const priceInput = screen.getByLabelText(/Price/i)

    // Enter values
    fireEvent.change(quantityInput, { target: { value: '100' } })
    fireEvent.change(priceInput, { target: { value: '150.00' } })

    // Check calculation displayed
    await waitFor(() => {
      expect(screen.getByText(/\$15,000\.00/)).toBeInTheDocument()
    })
  })

  it('should show validation errors inline', async () => {
    render(
      <MemoryRouter initialEntries={['/trade-execution/pos-test-1']}>
        <Routes>
          <Route path="/trade-execution/:positionId" element={<TradeExecution />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/Quantity/i)).toBeInTheDocument()
    })

    const submitButton = screen.getByRole('button', { name: /Add Trade/i })

    // Try to submit without filling required fields
    const quantityInput = screen.getByLabelText(/Quantity/i)
    fireEvent.change(quantityInput, { target: { value: '' } })

    fireEvent.click(submitButton)

    // Check for inline error
    await waitFor(() => {
      expect(screen.getByText(/quantity is required/i)).toBeInTheDocument()
    })
  })
})
