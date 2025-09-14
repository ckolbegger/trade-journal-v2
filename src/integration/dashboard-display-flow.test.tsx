import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from '../App'
import { PositionService } from '@/lib/position'
import {
  fillPositionForm,
  proceedToRiskAssessment,
  proceedToConfirmation,
  completePositionCreationFlow,
  verifyDashboardPosition
} from '@/test/integration-helpers'

describe('Integration: Position Dashboard Display Flow', () => {
  let positionService: PositionService

  beforeEach(async () => {
    positionService = new PositionService()
    // Clear IndexedDB before each test
    await positionService.clearAll()
  })

  it('should complete full user journey: Empty State → Position Creation → Dashboard Display', async () => {
    // 1. VERIFY: Start at empty state with Dashboard routing
    window.history.pushState({}, 'Test', '/')
    render(<App />)

    // Should show EmptyState with "Create Your First Position" button
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

    // 13. VERIFY: Navigate to Dashboard with created position
    await verifyDashboardPosition()

    // 14. VERIFY: Dashboard displays correct position information
    expect(screen.getByText('No trades executed')).toBeInTheDocument()
    expect(screen.getByText('TODO: Current P&L')).toBeInTheDocument()
    expect(screen.getByText('$135.00')).toBeInTheDocument() // Stop Loss
    expect(screen.getAllByText('TODO')).toHaveLength(2) // Avg Cost and Current are TODOs

    // 15. VERIFY: Floating action button is present
    const fabButtons = screen.getAllByRole('link', { name: '' })
    const fabButton = fabButtons.find(button => button.classList.contains('fixed'))
    expect(fabButton).toBeInTheDocument()
    expect(fabButton).toHaveClass('fixed', 'bottom-24', 'right-4')

    // 16. INTEGRATION VERIFY: Position was actually saved to IndexedDB
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

    // 17. BONUS: Test position retrieval by ID
    const retrievedPosition = await positionService.getById(savedPosition.id)
    expect(retrievedPosition).toEqual(savedPosition)
  })

  it('should show Dashboard with multiple positions', async () => {
    // Create two positions directly in IndexedDB (matching how PositionCreate creates them)
    await positionService.create({
      id: `pos-${Date.now()}`,
      symbol: 'AAPL',
      strategy_type: 'Long Stock',
      target_entry_price: 150,
      target_quantity: 100,
      profit_target: 165,
      stop_loss: 135,
      position_thesis: 'First position thesis',
      created_date: new Date(),
      status: 'planned'
    })

    await positionService.create({
      id: `pos-${Date.now() + 1}`,
      symbol: 'MSFT',
      strategy_type: 'Long Stock',
      target_entry_price: 300,
      target_quantity: 50,
      profit_target: 330,
      stop_loss: 270,
      position_thesis: 'Second position thesis',
      created_date: new Date(),
      status: 'planned'
    })

    // Navigate to home
    window.history.pushState({}, 'Test', '/')
    render(<App />)

    // Should show Dashboard with both positions
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Positions' })).toBeInTheDocument()
      expect(screen.getByText('AAPL')).toBeInTheDocument()
      expect(screen.getByText('MSFT')).toBeInTheDocument()
    }, { timeout: 2000 })

    // Verify both positions are displayed with correct data
    expect(screen.getAllByText('Long Stock')).toHaveLength(2)
    expect(screen.getAllByText('No trades executed')).toHaveLength(2)
    expect(screen.getByText('$135.00')).toBeInTheDocument() // AAPL stop loss
    expect(screen.getByText('$270.00')).toBeInTheDocument() // MSFT stop loss
    expect(screen.getAllByText('TODO')).toHaveLength(4) // 2 positions × 2 TODO fields each
  })

  it('should handle Dashboard navigation and maintain position data', async () => {
    // Create a position first (matching how PositionCreate creates them)
    await positionService.create({
      id: `pos-${Date.now()}`,
      symbol: 'TSLA',
      strategy_type: 'Long Stock',
      target_entry_price: 200,
      target_quantity: 75,
      profit_target: 220,
      stop_loss: 180,
      position_thesis: 'Test navigation thesis',
      created_date: new Date(),
      status: 'planned'
    })

    // Navigate to home
    window.history.pushState({}, 'Test', '/')
    render(<App />)

    // Verify Dashboard shows the position
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Positions' })).toBeInTheDocument()
      expect(screen.getByText('TSLA')).toBeInTheDocument()
    })

    // Navigate to position creation using floating action button
    const fabButtons = screen.getAllByRole('link', { name: '' })
    const fabButton = fabButtons.find(button => button.classList.contains('fixed'))
    expect(fabButton).toBeVisible()
    fireEvent.click(fabButton)

    // Verify position creation page loads
    await waitFor(() => {
      expect(screen.getByText('Position Plan')).toBeInTheDocument()
    })

    // Navigate back using browser back button (simulates user behavior)
    window.history.back()

    // Should still show the Dashboard with the same position
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Positions' })).toBeInTheDocument()
      expect(screen.getByText('TSLA')).toBeInTheDocument()
    })
  })
})