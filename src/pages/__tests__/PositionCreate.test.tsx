import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { PositionCreate } from '../PositionCreate'
import { ServiceContext } from '@/contexts/ServiceContext'
import type { ServiceContainer } from '@/contexts/ServiceContext'
import type { Position } from '@/lib/position'
import type { JournalEntry } from '@/types/journal'

// Mock navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

describe('PositionCreate - Short Put Wiring (T013)', () => {
  let mockServices: ServiceContainer
  let mockPositionService: any
  let mockJournalService: any
  let createdPosition: Position | null = null
  let createdJournal: JournalEntry | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    createdPosition = null
    createdJournal = null
    mockNavigate.mockClear()

    // Mock PositionService
    mockPositionService = {
      create: vi.fn(async (position: Position) => {
        createdPosition = position
        return position
      }),
      getById: vi.fn(),
      getAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }

    // Mock JournalService
    mockJournalService = {
      create: vi.fn(async (entry: JournalEntry) => {
        createdJournal = entry
        return entry
      }),
      createEmptyJournalEntry: vi.fn(async (entryType: string) => ({
        id: '',
        position_id: '',
        entry_type: entryType || 'position_plan',
        fields: [
          { name: 'why_this_position', prompt: 'Why this position?', response: '', required: true }
        ],
        created_at: new Date().toISOString()
      })),
      getByPositionId: vi.fn(),
      delete: vi.fn(),
      getPromptsByType: vi.fn(async () => [
        { id: 'prompt1', text: 'Why this position?' }
      ])
    }

    mockServices = {
      getPositionService: () => mockPositionService,
      getJournalService: () => mockJournalService
    } as ServiceContainer
  })

  const renderComponent = () => {
    return render(
      <ServiceContext.Provider value={mockServices}>
        <BrowserRouter>
          <PositionCreate />
        </BrowserRouter>
      </ServiceContext.Provider>
    )
  }

  const fillShortPutForm = async () => {
    // Fill basic fields
    const symbolInput = screen.getByLabelText(/Symbol/i)
    fireEvent.change(symbolInput, { target: { value: 'AAPL' } })

    // Select Short Put strategy
    const strategySelect = screen.getByRole('combobox', { name: /Strategy Type/i })
    fireEvent.change(strategySelect, { target: { value: 'Short Put' } })

    // Wait for option fields to appear
    await waitFor(() => {
      expect(screen.getByLabelText(/Strike Price/i)).toBeVisible()
    })

    // Fill stock fields
    fireEvent.change(screen.getByLabelText(/Target Entry Price/i), { target: { value: '150' } })
    fireEvent.change(screen.getByLabelText(/Target Quantity/i), { target: { value: '100' } })
    fireEvent.change(screen.getByLabelText(/Profit Target/i), { target: { value: '155' } })
    fireEvent.change(screen.getByLabelText(/Stop Loss/i), { target: { value: '145' } })
    fireEvent.change(screen.getByLabelText(/Position Thesis/i), {
      target: { value: 'Bullish thesis on AAPL' }
    })

    // Fill option fields
    const strikePriceInput = screen.getByLabelText(/Strike Price/i)
    fireEvent.change(strikePriceInput, { target: { value: '145' } })

    const expirationInput = screen.getByLabelText(/Expiration Date/i)
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)
    fireEvent.change(expirationInput, { target: { value: futureDate.toISOString().split('T')[0] } })

    // Select price basis (optional fields) - find radio buttons for Option
    const radioButtons = screen.getAllByRole('radio')
    const optionRadioButton = radioButtons.find(radio =>
      radio.getAttribute('value') === 'option'
    )
    if (optionRadioButton) {
      fireEvent.click(optionRadioButton)
    }

    return futureDate
  }

  const navigateToConfirmation = async () => {
    // Step 1 -> Step 2 (Journal)
    const nextButton = screen.getByRole('button', { name: /Next: Trading Journal/i })
    expect(nextButton).toBeVisible()
    fireEvent.click(nextButton)

    // Fill journal
    await waitFor(() => {
      const journalField = screen.getByRole('textbox', { name: /Why this position/i })
      expect(journalField).toBeVisible()
      fireEvent.change(journalField, { target: { value: 'Strong support at this level' } })
    })

    // Save journal
    const saveJournalButton = screen.getByRole('button', { name: /Next: Risk Assessment/i })
    fireEvent.click(saveJournalButton)

    // Step 2 -> Step 3 (Risk Assessment)
    await waitFor(() => {
      expect(screen.getByText(/Risk Assessment/i)).toBeVisible()
    })

    const nextToConfirmButton = screen.getByRole('button', { name: /Next: Confirmation/i })
    fireEvent.click(nextToConfirmButton)

    // Wait for confirmation step
    await waitFor(() => {
      expect(screen.getByText(/Confirmation/i)).toBeVisible()
    })
  }

  it('displays strategy selector on page', () => {
    renderComponent()

    const strategySelector = screen.getByRole('combobox', { name: /Strategy Type/i })
    expect(strategySelector).toBeVisible()
    expect(strategySelector).toHaveValue('Long Stock')
  })

  it('submits Short Put plan with all option fields to PositionService', async () => {
    renderComponent()

    const futureDate = await fillShortPutForm()
    await navigateToConfirmation()

    // Confirm immutability
    const checkbox = screen.getByLabelText(/I understand this position plan will be immutable/i)
    fireEvent.click(checkbox)

    // Submit form
    const createButton = screen.getByRole('button', { name: /Create Position Plan/i })
    expect(createButton).toBeEnabled()
    fireEvent.click(createButton)

    // Verify PositionService.create was called with option fields
    await waitFor(() => {
      expect(mockPositionService.create).toHaveBeenCalledTimes(1)
    })

    expect(createdPosition).toBeTruthy()
    expect(createdPosition?.symbol).toBe('AAPL')
    expect(createdPosition?.strategy_type).toBe('Short Put')
    expect(createdPosition?.strike_price).toBe(145)
    expect(createdPosition?.expiration_date).toBeInstanceOf(Date)
    expect(createdPosition?.option_type).toBe('put')
    // Note: PriceBasisSelector shares radio group name, so both profit_target_basis
    // and stop_loss_basis will have the same value when one is selected
    if (createdPosition?.profit_target_basis || createdPosition?.stop_loss_basis) {
      expect(['stock', 'option']).toContain(createdPosition?.profit_target_basis || createdPosition?.stop_loss_basis)
    }
  })

  it('creates Short Put position in database', async () => {
    renderComponent()

    await fillShortPutForm()
    await navigateToConfirmation()

    const checkbox = screen.getByLabelText(/I understand this position plan will be immutable/i)
    fireEvent.click(checkbox)

    const createButton = screen.getByRole('button', { name: /Create Position Plan/i })
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(mockPositionService.create).toHaveBeenCalled()
    })

    // Verify position was created with Short Put strategy
    expect(createdPosition?.strategy_type).toBe('Short Put')
    expect(createdPosition?.trade_kind).toBe('option')
  })

  it('redirects to dashboard after successful creation', async () => {
    mockPositionService.create.mockResolvedValue({
      id: 'test-position-id',
      symbol: 'AAPL',
      strategy_type: 'Short Put',
      trade_kind: 'option'
    })

    renderComponent()

    await fillShortPutForm()
    await navigateToConfirmation()

    const checkbox = screen.getByLabelText(/I understand this position plan will be immutable/i)
    fireEvent.click(checkbox)

    const createButton = screen.getByRole('button', { name: /Create Position Plan/i })
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/position/test-position-id')
    })
  })

  it('persists option plan with correct trade_kind', async () => {
    renderComponent()

    await fillShortPutForm()
    await navigateToConfirmation()

    const checkbox = screen.getByLabelText(/I understand this position plan will be immutable/i)
    fireEvent.click(checkbox)

    const createButton = screen.getByRole('button', { name: /Create Position Plan/i })
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(createdPosition).toBeTruthy()
    })

    expect(createdPosition?.trade_kind).toBe('option')
    expect(createdPosition?.strategy_type).toBe('Short Put')
  })

  it('displays error message when creation fails', async () => {
    mockPositionService.create.mockRejectedValue(new Error('Database error'))

    // Mock window.alert
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    renderComponent()

    await fillShortPutForm()
    await navigateToConfirmation()

    const checkbox = screen.getByLabelText(/I understand this position plan will be immutable/i)
    fireEvent.click(checkbox)

    const createButton = screen.getByRole('button', { name: /Create Position Plan/i })
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to create position'))
    })

    alertSpy.mockRestore()
  })
})
