import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from '../App'
import { PositionService } from '@/lib/position'
import {
  fillPositionForm,
  proceedToRiskAssessment,
  proceedToTradingJournal,
  fillTradingJournal,
  proceedToConfirmation,
  completePositionCreationFlow,
  verifyDashboardPosition
} from '@/test/integration-helpers'
import { createIntegrationTestData } from '@/test/data-factories'
import {
  assertEmptyState,
  assertStepVisible,
  assertFabButtonVisible
} from '@/test/assertion-helpers'

describe('Integration: Position Dashboard Display Flow', () => {
  let positionService: PositionService

  beforeEach(async () => {
    positionService = new PositionService()
    // Clear IndexedDB before each test
    await positionService.clearAll()
  })

  afterEach(() => {
    // Close database connection to prevent memory leaks
    if (positionService) {
      positionService.close()
    }
  })

  it('should complete full user journey: Empty State → Position Creation → Dashboard Display', async () => {
    // 1. VERIFY: Start at empty state with Dashboard routing
    window.history.pushState({}, 'Test', '/')
    render(<App />)

    // Should show EmptyState with "Create Your First Position" button
    await waitFor(() => {
      assertEmptyState()
    }, { timeout: 2000 })

    // 2. ACTION: Click "Create Your First Position" button
    const createButton = screen.getByRole('button', { name: /Create Your First Position/i })
    expect(createButton).toBeVisible()
    fireEvent.click(createButton)

    // 3. VERIFY: Navigate to position creation (Step 1)
    await waitFor(() => {
      assertStepVisible('Position Plan')
      expect(screen.getByText('Create Position')).toBeInTheDocument() // Header title
    })

    // 4. ACTION: Fill out Step 1 - Position Plan
    await fillPositionForm()

    // 5. ACTION: Proceed to Step 2 - Risk Assessment
    await proceedToRiskAssessment()

    // 6. ACTION: Proceed to Step 3 - Trading Journal
    await proceedToTradingJournal()

    // 7. ACTION: Fill Trading Journal
    await fillTradingJournal()

    // 8. ACTION: Proceed to Step 4 - Confirmation
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

    // 13. VERIFY: Navigate to Position Detail with created position
    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument()
      expect(screen.getByText(/Long Stock/)).toBeInTheDocument()
      expect(screen.getByText('Trade Plan')).toBeInTheDocument()
      expect(screen.getByText('Add Trade')).toBeInTheDocument()
    }, { timeout: 3000 })

    // 14. VERIFY: Position Detail displays correct position information
    expect(screen.getByText('No trades executed yet')).toBeInTheDocument()
    expect(screen.getAllByText('$135.00')).toHaveLength(2) // Stop Loss appears in performance section and trade plan
    expect(screen.getAllByText('Integration test: Bullish on Q4 earnings and iPhone cycle')).toHaveLength(2) // Position thesis appears in Trade Plan and Journal Entries

    // 15. VERIFY: Bottom action buttons are present
    expect(screen.getByText('Add Trade')).toBeInTheDocument()
    expect(screen.getByText('Close Position')).toBeInTheDocument()

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
    expect(savedPosition.id).toMatch(/^pos-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/) // UUID format

    // 17. BONUS: Test position retrieval by ID
    const retrievedPosition = await positionService.getById(savedPosition.id)
    expect(retrievedPosition).toEqual(savedPosition)
  })

  it('should show Dashboard with multiple positions', async () => {
    // Create two positions using data factory
    const testData = createIntegrationTestData()
    await positionService.create(testData.multiple[0])
    await positionService.create(testData.multiple[1])

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
    // Create a position using data factory
    const testData = createIntegrationTestData()
    await positionService.create(testData.navigation)

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