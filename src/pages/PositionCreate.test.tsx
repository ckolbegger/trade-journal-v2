import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { PositionCreate } from './PositionCreate'
import { PositionService } from '@/lib/position'

// Mock the PositionService
vi.mock('@/lib/position', async () => {
  const actual = await vi.importActual('@/lib/position')
  const createMockPositionService = () => ({
    create: vi.fn(),
    getById: vi.fn(),
    getAll: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    clearAll: vi.fn(),
    getDB: vi.fn(),
    validatePosition: vi.fn(),
    dbName: 'TradingJournalDB',
    version: 1,
    positionStore: 'positions'
  })

  return {
    ...actual,
    PositionService: vi.fn().mockImplementation(createMockPositionService)
  }
})

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const renderWithRouter = (component: React.ReactElement, positionService?: PositionService) => {
  return render(
    <BrowserRouter>
      {positionService
        ? React.cloneElement(component, { positionService } as React.ComponentProps<typeof PositionCreate>)
        : component
      }
    </BrowserRouter>
  )
}

describe('PositionCreate - Phase 1A: Position Creation Flow', () => {
  let mockPositionService: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Get the mocked instance
    mockPositionService = new PositionService()
  })

  describe('Step 1: Position Plan', () => {
    it('should display position plan form with all required fields', () => {
      renderWithRouter(<PositionCreate />)

      expect(screen.getByText('Position Plan')).toBeInTheDocument()

      // Check for required form fields
      expect(screen.getByLabelText(/Symbol/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Strategy Type/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Target Entry Price/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Target Quantity/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Profit Target/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Stop Loss/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Position Thesis/i)).toBeInTheDocument()
    })

    it('should only show "Long Stock" as strategy type option in Phase 1A', () => {
      renderWithRouter(<PositionCreate />)

      const strategySelect = screen.getByLabelText(/Strategy Type/i)
      expect(strategySelect).toBeInTheDocument()

      // Should be disabled/readonly with only "Long Stock" option
      expect(strategySelect).toHaveValue('Long Stock')
    })

    it('should validate required fields before proceeding to step 2', async () => {
      renderWithRouter(<PositionCreate />)

      const nextButton = screen.getByText('Next: Risk Assessment')
      fireEvent.click(nextButton)

      // Should show validation errors and stay on step 1
      await waitFor(() => {
        expect(screen.getByText(/Symbol is required/i)).toBeInTheDocument()
        expect(screen.getByText(/Target entry price is required/i)).toBeInTheDocument()
        expect(screen.getByText(/Target quantity is required/i)).toBeInTheDocument()
      })

      expect(screen.getByText('Position Plan')).toBeInTheDocument() // Still on step 1
    })

    it('should validate positive numbers for prices and quantities', async () => {
      renderWithRouter(<PositionCreate />)

      // Fill in negative values
      fireEvent.change(screen.getByLabelText(/Target Entry Price/i), { target: { value: '-10' } })
      fireEvent.change(screen.getByLabelText(/Target Quantity/i), { target: { value: '0' } })

      const nextButton = screen.getByText('Next: Risk Assessment')
      fireEvent.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/Target entry price must be positive/i)).toBeInTheDocument()
        expect(screen.getByText(/Target quantity must be positive/i)).toBeInTheDocument()
      })
    })

    it('should require non-empty position thesis', async () => {
      renderWithRouter(<PositionCreate />)

      // Fill required fields but leave thesis empty
      fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'AAPL' } })
      fireEvent.change(screen.getByLabelText(/Target Entry Price/i), { target: { value: '150' } })
      fireEvent.change(screen.getByLabelText(/Target Quantity/i), { target: { value: '100' } })
      fireEvent.change(screen.getByLabelText(/Profit Target/i), { target: { value: '165' } })
      fireEvent.change(screen.getByLabelText(/Stop Loss/i), { target: { value: '135' } })

      const nextButton = screen.getByText('Next: Risk Assessment')
      fireEvent.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/Position thesis is required/i)).toBeInTheDocument()
      })
    })
  })

  describe('Step 2: Risk Assessment', () => {
    beforeEach(async () => {
      // Fill out step 1 completely first
      renderWithRouter(<PositionCreate />)

      fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'AAPL' } })
      fireEvent.change(screen.getByLabelText(/Target Entry Price/i), { target: { value: '150' } })
      fireEvent.change(screen.getByLabelText(/Target Quantity/i), { target: { value: '100' } })
      fireEvent.change(screen.getByLabelText(/Profit Target/i), { target: { value: '165' } })
      fireEvent.change(screen.getByLabelText(/Stop Loss/i), { target: { value: '135' } })
      fireEvent.change(screen.getByLabelText(/Position Thesis/i), { target: { value: 'Test thesis' } })

      const nextButton = screen.getByText('Next: Risk Assessment')
      fireEvent.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText('Risk Assessment')).toBeInTheDocument()
      })
    })

    it('should display risk calculation based on position plan', () => {
      expect(screen.getByText('Risk Assessment')).toBeInTheDocument()

      // Should calculate and display risk metrics
      expect(screen.getByText(/Total Investment/i)).toBeInTheDocument()
      expect(screen.getByText(/Maximum Profit/i)).toBeInTheDocument()
      expect(screen.getByText(/Maximum Loss/i)).toBeInTheDocument()
      expect(screen.getByText(/Risk\/Reward Ratio/i)).toBeInTheDocument()

      // Check calculated values
      expect(screen.getByText('$15,000.00')).toBeInTheDocument() // 150 * 100
      expect(screen.getAllByText('$1,500.00')).toHaveLength(2)   // Both profit and loss = $1,500
      expect(screen.getByText('1:1')).toBeInTheDocument()        // 1500/1500
    })

    it('should allow navigation back to step 1', () => {
      const backButton = screen.getByText('Back to Position Plan')
      fireEvent.click(backButton)

      expect(screen.getByText('Position Plan')).toBeInTheDocument()
    })

    it('should proceed to confirmation when Next is clicked', () => {
      const nextButton = screen.getByText('Next: Confirmation')
      fireEvent.click(nextButton)

      expect(screen.getByText('Confirmation')).toBeInTheDocument()
    })
  })

  describe('Step 3: Confirmation', () => {
    beforeEach(async () => {
      // Navigate to step 3
      renderWithRouter(<PositionCreate />, mockPositionService)

      // Fill step 1
      fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'AAPL' } })
      fireEvent.change(screen.getByLabelText(/Target Entry Price/i), { target: { value: '150' } })
      fireEvent.change(screen.getByLabelText(/Target Quantity/i), { target: { value: '100' } })
      fireEvent.change(screen.getByLabelText(/Profit Target/i), { target: { value: '165' } })
      fireEvent.change(screen.getByLabelText(/Stop Loss/i), { target: { value: '135' } })
      fireEvent.change(screen.getByLabelText(/Position Thesis/i), { target: { value: 'Test thesis' } })

      // Go to step 2
      fireEvent.click(screen.getByText('Next: Risk Assessment'))
      await waitFor(() => expect(screen.getByText('Risk Assessment')).toBeInTheDocument())

      // Go to step 3
      fireEvent.click(screen.getByText('Next: Confirmation'))
      await waitFor(() => expect(screen.getByText('Confirmation')).toBeInTheDocument())
    })

    it('should display position summary for confirmation', () => {
      expect(screen.getByText('Confirmation')).toBeInTheDocument()

      // Should show summary of all entered data
      expect(screen.getByText('AAPL')).toBeInTheDocument()
      expect(screen.getByText('Long Stock')).toBeInTheDocument()
      expect(screen.getByText('$150.00')).toBeInTheDocument()
      expect(screen.getByText('100 shares')).toBeInTheDocument()
      expect(screen.getByText('Test thesis')).toBeInTheDocument()
    })

    it('should show immutability warning with required checkbox', () => {
      expect(screen.getByText(/I understand this position plan will be immutable/i)).toBeInTheDocument()

      const immutableCheckbox = screen.getByRole('checkbox', { name: /immutable/i })
      expect(immutableCheckbox).toBeInTheDocument()
      expect(immutableCheckbox).not.toBeChecked()
    })

    it('should require immutability checkbox before creating position', async () => {
      const createButton = screen.getByText('Create Position Plan')

      // Should be disabled initially
      expect(createButton).toBeDisabled()

      // Check the immutable checkbox
      const immutableCheckbox = screen.getByRole('checkbox', { name: /immutable/i })
      fireEvent.click(immutableCheckbox)

      // Button should now be enabled
      expect(createButton).toBeEnabled()
    })

    it('should create position and navigate to dashboard when confirmed', async () => {
      // Check immutable checkbox
      const immutableCheckbox = screen.getByRole('checkbox', { name: /immutable/i })
      fireEvent.click(immutableCheckbox)

      // Click create button
      const createButton = screen.getByText('Create Position Plan')
      fireEvent.click(createButton)

      // Should call PositionService.create
      await waitFor(() => {
        expect(mockPositionService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            symbol: 'AAPL',
            strategy_type: 'Long Stock',
            target_entry_price: 150,
            target_quantity: 100,
            profit_target: 165,
            stop_loss: 135,
            position_thesis: 'Test thesis',
            status: 'planned'
          })
        )
      })

      // Should navigate to dashboard
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  describe('Step Navigation', () => {
    it('should display step progress indicator', () => {
      renderWithRouter(<PositionCreate />)

      const stepIndicator = screen.getByTestId('step-indicator')
      expect(stepIndicator).toBeInTheDocument()

      // Should show 3 steps with step 1 active
      const stepDots = screen.getAllByTestId('step-dot')
      expect(stepDots).toHaveLength(3)
      expect(stepDots[0]).toHaveClass('active')
    })

    it('should update step indicator as user progresses', async () => {
      renderWithRouter(<PositionCreate />)

      // Complete step 1
      fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'AAPL' } })
      fireEvent.change(screen.getByLabelText(/Target Entry Price/i), { target: { value: '150' } })
      fireEvent.change(screen.getByLabelText(/Target Quantity/i), { target: { value: '100' } })
      fireEvent.change(screen.getByLabelText(/Profit Target/i), { target: { value: '165' } })
      fireEvent.change(screen.getByLabelText(/Stop Loss/i), { target: { value: '135' } })
      fireEvent.change(screen.getByLabelText(/Position Thesis/i), { target: { value: 'Test thesis' } })

      fireEvent.click(screen.getByText('Next: Risk Assessment'))

      await waitFor(() => {
        const stepDots = screen.getAllByTestId('step-dot')
        expect(stepDots[0]).toHaveClass('completed')
        expect(stepDots[1]).toHaveClass('active')
      })
    })
  })
})