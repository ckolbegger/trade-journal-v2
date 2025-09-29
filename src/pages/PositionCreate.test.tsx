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

      const nextButton = screen.getByText('Next: Trading Journal')
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

      const nextButton = screen.getByText('Next: Trading Journal')
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

      const nextButton = screen.getByText('Next: Trading Journal')
      fireEvent.click(nextButton)

      await waitFor(() => {
        assertFormValidationErrors(['Position thesis is required'])
      })
    })
  })

  describe('Step 2: Trading Journal', () => {
    beforeEach(async () => {
      // Fill out step 1 completely first, then navigate to step 2 (Journal)
      render
    renderWithRouterAndProps(<PositionCreate />)

      fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'AAPL' } })
      fireEvent.change(screen.getByLabelText(/Target Entry Price/i), { target: { value: '150' } })
      fireEvent.change(screen.getByLabelText(/Target Quantity/i), { target: { value: '100' } })
      fireEvent.change(screen.getByLabelText(/Profit Target/i), { target: { value: '165' } })
      fireEvent.change(screen.getByLabelText(/Stop Loss/i), { target: { value: '135' } })
      fireEvent.change(screen.getByLabelText(/Position Thesis/i), { target: { value: 'Test thesis' } })

      const nextButton = screen.getByText('Next: Trading Journal')
      fireEvent.click(nextButton)

      await waitFor(() => {
        assertStepVisible('📝 Position Plan')
      })
    })

    it('should display journal form fields', () => {
      assertStepVisible('📝 Position Plan')

      // Should show journal form fields
      expect(screen.getByLabelText(/Rationale/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Emotional State/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Market Conditions/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Execution Strategy/i)).toBeInTheDocument()
    })

    it('should allow navigation back to step 1 via Cancel', () => {
      const cancelButton = screen.getByText('Cancel')
      fireEvent.click(cancelButton)

      assertStepVisible('Position Plan')
    })

    it('should proceed to risk assessment when journal is filled and submitted', async () => {
      // Fill required journal field
      fireEvent.change(screen.getByLabelText(/Rationale/i), {
        target: { value: 'Strong technical support at current levels' }
      })

      const nextButton = screen.getByRole('button', { name: /Next: Risk Assessment/i })
      fireEvent.click(nextButton)

      await waitFor(() => {
        assertStepVisible('Risk Assessment')
      })
    })
  })

  describe('Step 3: Risk Assessment', () => {
    beforeEach(async () => {
      // Navigate to step 3 (Risk Assessment)
      render
    renderWithRouterAndProps(<PositionCreate />)

      // Fill step 1
      fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'AAPL' } })
      fireEvent.change(screen.getByLabelText(/Target Entry Price/i), { target: { value: '150' } })
      fireEvent.change(screen.getByLabelText(/Target Quantity/i), { target: { value: '100' } })
      fireEvent.change(screen.getByLabelText(/Profit Target/i), { target: { value: '165' } })
      fireEvent.change(screen.getByLabelText(/Stop Loss/i), { target: { value: '135' } })
      fireEvent.change(screen.getByLabelText(/Position Thesis/i), { target: { value: 'Test thesis' } })

      // Go to step 2 (Journal)
      fireEvent.click(screen.getByText('Next: Trading Journal'))
      await waitFor(() => assertStepVisible('📝 Position Plan'))

      // Fill journal and go to step 3 (Risk Assessment)
      fireEvent.change(screen.getByLabelText(/Rationale/i), {
        target: { value: 'Test trading rationale content' }
      })
      fireEvent.click(screen.getByRole('button', { name: /Next: Risk Assessment/i }))
      await waitFor(() => assertStepVisible('Risk Assessment'))
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

    it('should allow navigation back to step 2 (Journal)', () => {
      const backButton = screen.getByText('Back to Trading Journal')
      fireEvent.click(backButton)

      assertStepVisible('📝 Position Plan')
    })

    it('should proceed to confirmation when Next is clicked', async () => {
      const nextButton = screen.getByText('Next: Confirmation')
      fireEvent.click(nextButton)

      await waitFor(() => assertStepVisible('Confirmation'))
    })
  })

  describe('Step 4: Confirmation', () => {
    beforeEach(async () => {
      // Navigate to step 4
      renderWithRouterAndProps(<PositionCreate />, { positionService: mockPositionService })

      // Fill step 1
      fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'AAPL' } })
      fireEvent.change(screen.getByLabelText(/Target Entry Price/i), { target: { value: '150' } })
      fireEvent.change(screen.getByLabelText(/Target Quantity/i), { target: { value: '100' } })
      fireEvent.change(screen.getByLabelText(/Profit Target/i), { target: { value: '165' } })
      fireEvent.change(screen.getByLabelText(/Stop Loss/i), { target: { value: '135' } })
      fireEvent.change(screen.getByLabelText(/Position Thesis/i), { target: { value: 'Test thesis' } })

      // Go to step 2 (Journal)
      fireEvent.click(screen.getByText('Next: Trading Journal'))
      await waitFor(() => assertStepVisible('📝 Position Plan'))

      // Fill journal form
      fireEvent.change(screen.getByLabelText(/Rationale/i), {
        target: { value: 'Strong bullish thesis' }
      })

      // Go to step 3 (Risk Assessment)
      fireEvent.click(screen.getByRole('button', { name: /Next: Risk Assessment/i }))
      await waitFor(() => assertStepVisible('Risk Assessment'))

      // Go to step 4
      fireEvent.click(screen.getByRole('button', { name: /Next: Confirmation/i }))
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

  })

  describe('Step Navigation', () => {
    it('should display step progress indicator', () => {
      renderWithRouterAndProps(<PositionCreate />)

      const stepIndicator = screen.getByTestId('step-indicator')
      expect(stepIndicator).toBeInTheDocument()

      // Should show 4 steps with step 1 active
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

      fireEvent.click(screen.getByText('Next: Trading Journal'))

      await waitFor(() => {
        assertStepDotsStatus({ active: 1, completed: [0] })
      })
    })
  })
})