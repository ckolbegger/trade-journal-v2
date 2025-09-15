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
import { createIntegrationTestData } from '@/test/data-factories'

describe('Integration: Position Detail Routing', () => {
  let positionService: PositionService

  beforeEach(async () => {
    positionService = new PositionService()
    // Clear IndexedDB before each test
    await positionService.clearAll()
  })

  it('should navigate from Dashboard to Position Detail when position is clicked', async () => {
    // 1. Create a position first
    const testData = createIntegrationTestData()
    await positionService.create(testData.multiple[0]) // Use first position from multiple array

    // 2. Start at dashboard
    window.history.pushState({}, 'Test', '/')
    render(<App />)

    // 3. Wait for dashboard to load and click position
    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument()
    }, { timeout: 2000 })

    const positionCard = screen.getByText('AAPL').closest('div[class*="bg-white"]')
    if (positionCard) {
      fireEvent.click(positionCard)
    }

    // 4. Should navigate to position detail
    await waitFor(() => {
      expect(screen.getByText('Loading position...')).toBeInTheDocument()
    }, { timeout: 2000 })

    // 5. Should show position detail view
    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument()
      expect(screen.getByText(/Long Stock/)).toBeInTheDocument()
      expect(screen.getByText('Trade Plan')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should show Position Detail when directly accessing position/:id URL', async () => {
    // 1. Create a position first
    const testData = createIntegrationTestData()
    const position = await positionService.create(testData.multiple[0]) // Use first position from multiple array

    // 2. Navigate directly to position detail
    window.history.pushState({}, 'Test', `/position/${position.id}`)
    render(<App />)

    // 3. Should show position detail view
    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument()
      expect(screen.getByText(/Long Stock/)).toBeInTheDocument()
      expect(screen.getByText('Trade Plan')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should navigate back to Dashboard when back button is clicked in Position Detail', async () => {
    // 1. Create a position first
    const testData = createIntegrationTestData()
    const position = await positionService.create(testData.multiple[0]) // Use first position from multiple array

    // 2. Start directly at position detail
    window.history.pushState({}, 'Test', `/position/${position.id}`)
    render(<App />)

    // 3. Wait for position detail to load
    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument()
    }, { timeout: 3000 })

    // 4. Click back button
    const backButton = screen.getAllByRole('button')[0] // First button is back button
    fireEvent.click(backButton)

    // 5. Should navigate back to dashboard
    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should show Position not found when accessing invalid position ID', async () => {
    // Navigate to non-existent position
    window.history.pushState({}, 'Test', '/position/invalid-id')
    render(<App />)

    // Should show position not found
    await waitFor(() => {
      expect(screen.getByText('Position not found')).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})