import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PositionCreate } from '../PositionCreate'
import { ServiceProvider } from '@/contexts/ServiceContext'
import { ServiceContainer } from '@/services/ServiceContainer'

describe('PositionCreate - Option Fields', () => {
  let container: ServiceContainer

  beforeEach(async () => {
    container = new ServiceContainer()
    await container.initialize()
  })

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <ServiceProvider container={container}>
          <PositionCreate />
        </ServiceProvider>
      </MemoryRouter>
    )
  }

  it('shows option fields only when Short Put selected', async () => {
    renderComponent()

    // Wait for component to finish loading
    await waitFor(() => {
      expect(screen.getByText('Position Plan')).toBeInTheDocument()
    })

    // Initially Long Stock is selected - option fields should not be present
    const strategySelector = screen.getByLabelText('Strategy Type')
    expect(strategySelector).toBeInTheDocument()
    expect((strategySelector as HTMLSelectElement).value).toBe('Long Stock')

    // Option fields should not be present for Long Stock
    expect(screen.queryByLabelText('Strike Price')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Expiration Date')).not.toBeInTheDocument()
    expect(screen.queryByText('Stock')).not.toBeInTheDocument() // PriceBasisSelector labels
    expect(screen.queryByText('Option')).not.toBeInTheDocument()

    // Change to Short Put
    fireEvent.change(strategySelector, { target: { value: 'Short Put' } })

    // Option fields should now be visible
    await waitFor(() => {
      expect(screen.getByLabelText('Strike Price')).toBeInTheDocument()
      expect(screen.getByLabelText('Expiration Date')).toBeInTheDocument()
      // Should have multiple "Stock" and "Option" labels (one set for profit target, one for stop loss)
      expect(screen.getAllByText('Stock').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Option').length).toBeGreaterThan(0)
    })
  })

  it('hides option fields for Long Stock', async () => {
    renderComponent()

    // Wait for component to finish loading
    await waitFor(() => {
      expect(screen.getByText('Position Plan')).toBeInTheDocument()
    })

    // Default is Long Stock
    const strategySelector = screen.getByLabelText('Strategy Type')
    expect((strategySelector as HTMLSelectElement).value).toBe('Long Stock')

    // Option fields should not be visible
    expect(screen.queryByLabelText('Strike Price')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Expiration Date')).not.toBeInTheDocument()
    expect(screen.queryByText('Stock')).not.toBeInTheDocument()
    expect(screen.queryByText('Option')).not.toBeInTheDocument()
  })

  it('validates required option fields for Short Put', async () => {
    renderComponent()

    // Wait for component to finish loading
    await waitFor(() => {
      expect(screen.getByText('Position Plan')).toBeInTheDocument()
    })

    // Change to Short Put
    const strategySelector = screen.getByLabelText('Strategy Type')
    fireEvent.change(strategySelector, { target: { value: 'Short Put' } })

    // Fill in required stock fields
    fireEvent.change(screen.getByLabelText('Symbol *'), { target: { value: 'AAPL' } })
    fireEvent.change(screen.getByLabelText('Target Entry Price *'), { target: { value: '150' } })
    fireEvent.change(screen.getByLabelText('Target Quantity *'), { target: { value: '100' } })
    fireEvent.change(screen.getByLabelText('Profit Target *'), { target: { value: '170' } })
    fireEvent.change(screen.getByLabelText('Stop Loss *'), { target: { value: '140' } })
    fireEvent.change(screen.getByLabelText('Position Thesis *'), {
      target: { value: 'Bullish on AAPL fundamentals' }
    })

    // Do NOT fill in option fields (strike, expiration)
    // Try to proceed to next step
    const nextButton = screen.getByText('Next: Trading Journal')
    expect(nextButton).toBeVisible()
    fireEvent.click(nextButton)

    // Should show validation errors for option fields
    await waitFor(() => {
      expect(screen.getByText('Strike price is required')).toBeInTheDocument()
      expect(screen.getByText('Expiration date is required')).toBeInTheDocument()
    })

    // Should not proceed to next step
    expect(screen.getByText('Position Plan')).toBeInTheDocument()
  })

  it('allows form submission with all valid option data', async () => {
    renderComponent()

    // Wait for component to finish loading
    await waitFor(() => {
      expect(screen.getByText('Position Plan')).toBeInTheDocument()
    })

    // Change to Short Put
    const strategySelector = screen.getByLabelText('Strategy Type')
    fireEvent.change(strategySelector, { target: { value: 'Short Put' } })

    // Fill in all required fields
    fireEvent.change(screen.getByLabelText('Symbol *'), { target: { value: 'AAPL' } })
    fireEvent.change(screen.getByLabelText('Target Entry Price *'), { target: { value: '150' } })
    fireEvent.change(screen.getByLabelText('Target Quantity *'), { target: { value: '100' } })
    fireEvent.change(screen.getByLabelText('Profit Target *'), { target: { value: '170' } })
    fireEvent.change(screen.getByLabelText('Stop Loss *'), { target: { value: '140' } })
    fireEvent.change(screen.getByLabelText('Position Thesis *'), {
      target: { value: 'Bullish on AAPL fundamentals' }
    })

    // Fill in option fields
    await waitFor(() => {
      expect(screen.getByLabelText('Strike Price')).toBeInTheDocument()
    })

    const strikeInput = screen.getByLabelText('Strike Price')
    fireEvent.change(strikeInput, { target: { value: '145' } })

    const expirationInput = screen.getByLabelText('Expiration Date')
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)
    const dateString = futureDate.toISOString().split('T')[0]
    fireEvent.change(expirationInput, { target: { value: dateString } })

    // Select price basis (there are two sets - profit target and stop loss)
    // Just verify they're present - no need to click for validation
    const stockBasisRadios = screen.getAllByLabelText('Stock')
    expect(stockBasisRadios.length).toBeGreaterThan(0)

    // Try to proceed to next step
    const nextButton = screen.getByText('Next: Trading Journal')
    expect(nextButton).toBeVisible()
    fireEvent.click(nextButton)

    // Should proceed without validation errors
    await waitFor(() => {
      expect(screen.queryByText('Strike price is required')).not.toBeInTheDocument()
      expect(screen.queryByText('Expiration date is required')).not.toBeInTheDocument()
      expect(screen.queryByText('Position Plan')).not.toBeInTheDocument()
    })
  })
})
