import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from '../App'
import { PositionService } from '@/lib/position'
import {
  fillPositionForm,
  proceedToRiskAssessment,
  proceedToConfirmation,
  completePositionCreationFlow
} from '@/test/integration-helpers'

describe('Integration: Position Creation Flow', () => {
  let positionService: PositionService

  beforeEach(async () => {
    positionService = new PositionService()
    // Clear IndexedDB before each test
    await positionService.clearAll()
  })

  it('should complete full user journey: Empty State → Position Creation → Save to IndexedDB', async () => {
    // Ensure we start at the root route and render the full app
    window.history.pushState({}, 'Test', '/')
    render(<App />)

    // 1. VERIFY: Start at empty state
    await waitFor(() => {
      expect(screen.getByText('Start Your Trading Journey')).toBeInTheDocument()
      expect(screen.getByText(/Track your trades, learn from your decisions/)).toBeInTheDocument()
    }, { timeout: 2000 })

    // 2. ACTION: Click "Create Your First Position" button
    const createButton = screen.getByRole('button', { name: /Create Your First Position/i })
    expect(createButton).toBeVisible()
    fireEvent.click(createButton)

    // 3. VERIFY: Navigate to position creation (Step 1)
    await waitFor(() => {
      expect(screen.getByText('Position Plan')).toBeInTheDocument()
      expect(screen.getByText('Create Position')).toBeInTheDocument() // Header title
    })

    // 4. ACTION: Fill out Step 1 - Position Plan
    await fillPositionForm()

    // 5. ACTION: Proceed to Step 2 - Risk Assessment
    await proceedToRiskAssessment()

    // 7. ACTION: Proceed to Step 3 - Confirmation
    await proceedToConfirmation()

    // 9. VERIFY: Immutable confirmation checkbox is required
    const createPositionButton = screen.getByText('Create Position Plan')
    expect(createPositionButton).toBeDisabled()

    // 10. ACTION: Check immutable confirmation checkbox
    const immutableCheckbox = screen.getByRole('checkbox', {
      name: /I understand this position plan will be immutable/i
    })
    expect(immutableCheckbox).toBeVisible()
    fireEvent.click(immutableCheckbox)

    // 11. VERIFY: Create button is now enabled
    expect(createPositionButton).toBeEnabled()

    // 12. ACTION: Create the position
    expect(createPositionButton).toBeVisible()
    fireEvent.click(createPositionButton)

    // 13. VERIFY: Navigate to dashboard with created position
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Positions' })).toBeInTheDocument()
      expect(screen.getByText('AAPL')).toBeInTheDocument()
      expect(screen.getByText('Long Stock')).toBeInTheDocument()
    }, { timeout: 3000 })

    // 14. INTEGRATION VERIFY: Position was actually saved to IndexedDB
    const savedPositions = await positionService.getAll()
    expect(savedPositions).toHaveLength(1)

    const savedPosition = savedPositions[0]
    expect(savedPosition.symbol).toBe('AAPL')
    expect(savedPosition.strategy_type).toBe('Long Stock')
    expect(savedPosition.target_entry_price).toBe(150)
    expect(savedPosition.target_quantity).toBe(100)
    expect(savedPosition.profit_target).toBe(165)
    expect(savedPosition.stop_loss).toBe(135)
    expect(savedPosition.position_thesis).toBe('Integration test: Bullish on Q4 earnings and iPhone cycle')
    expect(savedPosition.status).toBe('planned')
    expect(savedPosition.created_date).toBeInstanceOf(Date)
    expect(savedPosition.id).toMatch(/^pos-\d+$/) // Generated ID format

    // 15. BONUS: Test position retrieval by ID
    const retrievedPosition = await positionService.getById(savedPosition.id)
    expect(retrievedPosition).toEqual(savedPosition)
  })

  it('should handle form validation during complete flow', async () => {
    // Ensure we start at the root route
    window.history.pushState({}, 'Test', '/')
    render(<App />)

    // Navigate to position creation
    await waitFor(() => {
      const createButton = screen.getByRole('button', { name: /Create Your First Position/i })
      expect(createButton).toBeVisible()
      fireEvent.click(createButton)
    })

    await waitFor(() => {
      expect(screen.getByText('Position Plan')).toBeInTheDocument()
    })

    // Try to proceed without filling required fields
    const nextButton = screen.getByText('Next: Risk Assessment')
    expect(nextButton).toBeVisible()
    fireEvent.click(nextButton)

    // Verify validation errors appear and we stay on Step 1
    await waitFor(() => {
      expect(screen.getByText(/Symbol is required/i)).toBeInTheDocument()
      expect(screen.getByText(/Target entry price is required/i)).toBeInTheDocument()
      expect(screen.getByText(/Target quantity is required/i)).toBeInTheDocument()
    })

    expect(screen.getByText('Position Plan')).toBeInTheDocument() // Still on step 1

    // Fill in invalid data
    fireEvent.change(screen.getByLabelText(/Target Entry Price/i), { target: { value: '-10' } })
    fireEvent.change(screen.getByLabelText(/Target Quantity/i), { target: { value: '0' } })

    const nextButton2 = screen.getByText('Next: Risk Assessment')
    expect(nextButton2).toBeVisible()
    fireEvent.click(nextButton2)

    // Verify specific validation messages
    await waitFor(() => {
      expect(screen.getByText(/Target entry price must be positive/i)).toBeInTheDocument()
      expect(screen.getByText(/Target quantity must be positive/i)).toBeInTheDocument()
    })

    // No positions should be saved due to validation failure
    const savedPositions = await positionService.getAll()
    expect(savedPositions).toHaveLength(0)
  })

  it('should allow navigation back through steps', async () => {
    // Ensure we start at the root route
    window.history.pushState({}, 'Test', '/')
    render(<App />)

    // Navigate to position creation and fill Step 1
    await waitFor(() => {
      const createButton = screen.getByRole('button', { name: /Create Your First Position/i })
      expect(createButton).toBeVisible()
      fireEvent.click(createButton)
    })

    await waitFor(() => {
      expect(screen.getByText('Position Plan')).toBeInTheDocument()
    })

    // Fill valid data
    fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: 'MSFT' } })
    fireEvent.change(screen.getByLabelText(/Target Entry Price/i), { target: { value: '300' } })
    fireEvent.change(screen.getByLabelText(/Target Quantity/i), { target: { value: '50' } })
    fireEvent.change(screen.getByLabelText(/Profit Target/i), { target: { value: '330' } })
    fireEvent.change(screen.getByLabelText(/Stop Loss/i), { target: { value: '270' } })
    fireEvent.change(screen.getByLabelText(/Position Thesis/i), { target: { value: 'Cloud growth' } })

    // Go to Step 2
    const nextToStep2Button = screen.getByText('Next: Risk Assessment')
    expect(nextToStep2Button).toBeVisible()
    fireEvent.click(nextToStep2Button)

    await waitFor(() => {
      expect(screen.getByText('Risk Assessment')).toBeInTheDocument()
    })

    // Go to Step 3
    const nextToStep3Button = screen.getByText('Next: Confirmation')
    expect(nextToStep3Button).toBeVisible()
    fireEvent.click(nextToStep3Button)

    await waitFor(() => {
      expect(screen.getByText('Confirmation')).toBeInTheDocument()
    })

    // Go back to Step 2
    const backToStep2Button = screen.getByText('Back to Risk Assessment')
    expect(backToStep2Button).toBeVisible()
    fireEvent.click(backToStep2Button)

    await waitFor(() => {
      expect(screen.getByText('Risk Assessment')).toBeInTheDocument()
    })

    // Go back to Step 1
    const backToStep1Button = screen.getByText('Back to Position Plan')
    expect(backToStep1Button).toBeVisible()
    fireEvent.click(backToStep1Button)

    await waitFor(() => {
      expect(screen.getByText('Position Plan')).toBeInTheDocument()
    })

    // Verify data is preserved
    expect(screen.getByDisplayValue('MSFT')).toBeInTheDocument()
    expect(screen.getByDisplayValue('300')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Cloud growth')).toBeInTheDocument()
  })
})