import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { PositionCreate } from './PositionCreate'
import { mockPositionServiceModule, resetMockService } from '@/test/mocks/position-service-mock'
import { renderWithRouterAndProps } from '@/test/test-utils'
import {
  assertStepVisible,
  assertFormValidationErrors,
  assertFormFieldExists,
  assertStrategyTypeLocked,
  assertRiskCalculations,
  assertStepDotsStatus,
  assertImmutableConfirmationVisible,
  assertImmutableConfirmationComplete
} from '@/test/assertion-helpers'
import type { PositionService } from '@/lib/position'

// Mock the PositionService using centralized factory
vi.mock('@/lib/position', async () => {
  const actual = await vi.importActual('@/lib/position')
  return {
    ...actual,
    PositionService: vi.fn().mockImplementation(() => mockPositionServiceModule)
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


describe('PositionCreate - Phase 1A: Position Creation Flow', () => {
  let mockPositionService: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Use the mock module directly
    mockPositionService = mockPositionServiceModule
    resetMockService(mockPositionService)
  })

  describe('Step 1: Position Plan', () => {
    it('should display position plan form with all required fields', () => {
      renderWithRouterAndProps(<PositionCreate />)

      assertStepVisible('Position Plan')

      // Check for required form fields
      assertFormFieldExists(/Symbol/i)
      assertFormFieldExists(/Strategy Type/i)
      assertFormFieldExists(/Target Entry Price/i)
      assertFormFieldExists(/Target Quantity/i)
      assertFormFieldExists(/Profit Target/i)
      assertFormFieldExists(/Stop Loss/i)
      assertFormFieldExists(/Position Thesis/i)
    })

    it('should only show "Long Stock" as strategy type option in Phase 1A', () => {
      renderWithRouterAndProps(<PositionCreate />)

      assertStrategyTypeLocked()
    })

    it('should validate required fields before proceeding to step 2', async () => {
      render
    renderWithRouterAndProps(<PositionCreate />)

      const nextButton = screen.getByText('Next: Risk Assessment')
      fireEvent.click(nextButton)

      // Should show validation errors and stay on step 1
      await waitFor(() => {
        assertFormValidationErrors([
          'Symbol is required',
          'Target entry price is required',
          'Target quantity is required'
        ])
      })

      assertStepVisible('Position Plan') // Still on step 1
    })

    it('should validate positive numbers for prices and quantities', async () => {
      render
    renderWithRouterAndProps(<PositionCreate />)

      // Fill in negative values
      fireEvent.change(screen.getByLabelText(/Target Entry Price/i), { target: { value: '-10' } })
      fireEvent.change(screen.getByLabelText(/Target Quantity/i), { target: { value: '0' } })

      const nextButton = screen.getByText('Next: Risk Assessment')
      fireEvent.click(nextButton)

      await waitFor(() => {
        assertFormValidationErrors([
          'Target entry price must be positive',
          'Target quantity must be positive'
        ])
      })
    })

    it('should require non-empty position thesis', async () => {
      render
    renderWithRouterAndProps(<PositionCreate />)

      // Fill required fields but leave thesis empty
      fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'AAPL' } })
      fireEvent.change(screen.getByLabelText(/Target Entry Price/i), { target: { value: '150' } })
      fireEvent.change(screen.getByLabelText(/Target Quantity/i), { target: { value: '100' } })
      fireEvent.change(screen.getByLabelText(/Profit Target/i), { target: { value: '165' } })
      fireEvent.change(screen.getByLabelText(/Stop Loss/i), { target: { value: '135' } })

      const nextButton = screen.getByText('Next: Risk Assessment')
      fireEvent.click(nextButton)

      await waitFor(() => {
        assertFormValidationErrors(['Position thesis is required'])
      })
    })
  })

  describe('Step 2: Risk Assessment', () => {
    beforeEach(async () => {
      // Fill out step 1 completely first
      render
    renderWithRouterAndProps(<PositionCreate />)

      fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'AAPL' } })
      fireEvent.change(screen.getByLabelText(/Target Entry Price/i), { target: { value: '150' } })
      fireEvent.change(screen.getByLabelText(/Target Quantity/i), { target: { value: '100' } })
      fireEvent.change(screen.getByLabelText(/Profit Target/i), { target: { value: '165' } })
      fireEvent.change(screen.getByLabelText(/Stop Loss/i), { target: { value: '135' } })
      fireEvent.change(screen.getByLabelText(/Position Thesis/i), { target: { value: 'Test thesis' } })

      const nextButton = screen.getByText('Next: Risk Assessment')
      fireEvent.click(nextButton)

      await waitFor(() => {
        assertStepVisible('Risk Assessment')
      })
    })

    it('should display risk calculation based on position plan', () => {
      assertStepVisible('Risk Assessment')

      // Should calculate and display risk metrics
      assertRiskCalculations({
        totalInvestment: '15,000.00',
        maxProfit: '1,500.00',
        maxLoss: '1,500.00',
        riskRewardRatio: '1:1'
      })
    })

    it('should allow navigation back to step 1', () => {
      const backButton = screen.getByText('Back to Position Plan')
      fireEvent.click(backButton)

      assertStepVisible('Position Plan')
    })

    it('should proceed to confirmation when Next is clicked', () => {
      const nextButton = screen.getByText('Next: Confirmation')
      fireEvent.click(nextButton)

      assertStepVisible('Confirmation')
    })
  })

  describe('Step 3: Confirmation', () => {
    beforeEach(async () => {
      // Navigate to step 3
      renderWithRouterAndProps(<PositionCreate />, { positionService: mockPositionService })

      // Fill step 1
      fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'AAPL' } })
      fireEvent.change(screen.getByLabelText(/Target Entry Price/i), { target: { value: '150' } })
      fireEvent.change(screen.getByLabelText(/Target Quantity/i), { target: { value: '100' } })
      fireEvent.change(screen.getByLabelText(/Profit Target/i), { target: { value: '165' } })
      fireEvent.change(screen.getByLabelText(/Stop Loss/i), { target: { value: '135' } })
      fireEvent.change(screen.getByLabelText(/Position Thesis/i), { target: { value: 'Test thesis' } })

      // Go to step 2
      fireEvent.click(screen.getByText('Next: Risk Assessment'))
      await waitFor(() => assertStepVisible('Risk Assessment'))

      // Go to step 3
      fireEvent.click(screen.getByText('Next: Confirmation'))
      await waitFor(() => assertStepVisible('Confirmation'))
    })

    it('should display position summary for confirmation', () => {
      assertStepVisible('Confirmation')

      // Should show summary of all entered data
      expect(screen.getByText('AAPL')).toBeInTheDocument()
      expect(screen.getByText('Long Stock')).toBeInTheDocument()
      expect(screen.getByText('$150.00')).toBeInTheDocument()
      expect(screen.getByText('100 shares')).toBeInTheDocument()
      expect(screen.getByText('Test thesis')).toBeInTheDocument()
    })

    it('should show immutability warning with required checkbox', () => {
      assertImmutableConfirmationVisible()
    })

    it('should require immutability checkbox before creating position', async () => {
      assertImmutableConfirmationVisible()

      // Check the immutable checkbox
      const immutableCheckbox = screen.getByRole('checkbox', {
        name: /I understand this position plan will be immutable/i
      })
      fireEvent.click(immutableCheckbox)

      // Button should now be enabled
      assertImmutableConfirmationComplete()
    })

    it('should create position and navigate to position detail when confirmed', async () => {
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

      // Should navigate to position detail
      expect(mockNavigate).toHaveBeenCalledWith(expect.stringMatching(/^\/position\/pos-\d+$/))
    })
  })

  describe('Step Navigation', () => {
    it('should display step progress indicator', () => {
      renderWithRouterAndProps(<PositionCreate />)

      const stepIndicator = screen.getByTestId('step-indicator')
      expect(stepIndicator).toBeInTheDocument()

      // Should show 3 steps with step 1 active
      assertStepDotsStatus({ active: 0 })
    })

    it('should update step indicator as user progresses', async () => {
      renderWithRouterAndProps(<PositionCreate />)

      // Complete step 1
      fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'AAPL' } })
      fireEvent.change(screen.getByLabelText(/Target Entry Price/i), { target: { value: '150' } })
      fireEvent.change(screen.getByLabelText(/Target Quantity/i), { target: { value: '100' } })
      fireEvent.change(screen.getByLabelText(/Profit Target/i), { target: { value: '165' } })
      fireEvent.change(screen.getByLabelText(/Stop Loss/i), { target: { value: '135' } })
      fireEvent.change(screen.getByLabelText(/Position Thesis/i), { target: { value: 'Test thesis' } })

      fireEvent.click(screen.getByText('Next: Risk Assessment'))

      await waitFor(() => {
        assertStepDotsStatus({ active: 1, completed: [0] })
      })
    })
  })
})