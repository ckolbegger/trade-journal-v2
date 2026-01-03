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
    expect(screen.queryByLabelText(/Strike Price/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Expiration Date/i)).not.toBeInTheDocument()
    expect(screen.queryByText('Stock')).not.toBeInTheDocument() // PriceBasisSelector labels
    expect(screen.queryByText('Option')).not.toBeInTheDocument()

    // Change to Short Put
    fireEvent.change(strategySelector, { target: { value: 'Short Put' } })

    // Option fields should now be visible
    await waitFor(() => {
      expect(screen.getByLabelText(/Strike Price/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Expiration Date/i)).toBeInTheDocument()
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
    expect(screen.queryByLabelText(/Strike Price/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Expiration Date/i)).not.toBeInTheDocument()
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

    // Do NOT fill in strike price (expiration date is auto-initialized now)
    // Try to proceed to next step
    const nextButton = screen.getByText('Next: Trading Journal')
    expect(nextButton).toBeVisible()
    fireEvent.click(nextButton)

    // Should show validation error for strike price
    // Note: expiration_date is now auto-initialized when Short Put is selected,
    // so we only expect the strike price error
    await waitFor(() => {
      expect(screen.getByText('Strike price is required')).toBeInTheDocument()
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
      expect(screen.getByLabelText(/Strike Price/i)).toBeInTheDocument()
    })

    const strikeInput = screen.getByLabelText(/Strike Price/i)
    fireEvent.change(strikeInput, { target: { value: '145' } })

    const expirationInput = screen.getByLabelText(/Expiration Date/i)
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)
    const dateString = futureDate.toISOString().split('T')[0]
    fireEvent.change(expirationInput, { target: { value: dateString } })

    // Select price basis (there are two sets - profit target and stop loss)
    // Need to click BOTH to satisfy validation requirements
    const stockBasisRadios = screen.getAllByLabelText('Stock')
    expect(stockBasisRadios.length).toBeGreaterThan(0)
    // Click profit target basis (first Stock radio)
    fireEvent.click(stockBasisRadios[0])
    // Click stop loss basis (second Stock radio)
    fireEvent.click(stockBasisRadios[1])

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

  it('allows form submission when user accepts default expiration date', async () => {
    renderComponent()

    // Wait for component to finish loading
    await waitFor(() => {
      expect(screen.getByText('Position Plan')).toBeInTheDocument()
    })

    // Change to Short Put
    const strategySelector = screen.getByLabelText('Strategy Type')
    fireEvent.change(strategySelector, { target: { value: 'Short Put' } })

    // Fill in all required fields
    fireEvent.change(screen.getByLabelText('Symbol *'), { target: { value: 'TSLA' } })
    fireEvent.change(screen.getByLabelText('Target Entry Price *'), { target: { value: '2.50' } })
    fireEvent.change(screen.getByLabelText('Target Quantity *'), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('Profit Target *'), { target: { value: '200' } })
    fireEvent.change(screen.getByLabelText('Stop Loss *'), { target: { value: '180' } })
    fireEvent.change(screen.getByLabelText('Position Thesis *'), {
      target: { value: 'Testing short put with default expiration date' }
    })

    // Fill in strike price
    await waitFor(() => {
      expect(screen.getByLabelText(/Strike Price/i)).toBeInTheDocument()
    })

    const strikeInput = screen.getByLabelText(/Strike Price/i)
    fireEvent.change(strikeInput, { target: { value: '190' } })

    // DO NOT change the expiration date - accept the default value shown by the picker
    // This is the key difference from the other test - we're testing that the form
    // works when the user doesn't manually change the pre-populated date

    // Select both price basis fields (required as of B0003 fix)
    const stockBasisRadios = screen.getAllByLabelText('Stock')
    // Click profit target basis (first Stock radio)
    fireEvent.click(stockBasisRadios[0])
    // Click stop loss basis (second Stock radio)
    fireEvent.click(stockBasisRadios[1])

    // Try to proceed to next step
    const nextButton = screen.getByText('Next: Trading Journal')
    expect(nextButton).toBeVisible()
    fireEvent.click(nextButton)

    // Should proceed without "Expiration date is required" error
    // This test will FAIL until we fix the bug where expiration_date isn't
    // initialized in form state when Short Put is selected
    await waitFor(() => {
      expect(screen.queryByText('Expiration date is required')).not.toBeInTheDocument()
      expect(screen.queryByText('Position Plan')).not.toBeInTheDocument()
    })
  })

  it('validates profit_target_basis is required for Short Put', async () => {
    renderComponent()

    // Wait for component to finish loading
    await waitFor(() => {
      expect(screen.getByText('Position Plan')).toBeInTheDocument()
    })

    // Change to Short Put
    const strategySelector = screen.getByLabelText('Strategy Type')
    fireEvent.change(strategySelector, { target: { value: 'Short Put' } })

    // Fill in all required fields except profit_target_basis
    fireEvent.change(screen.getByLabelText('Symbol *'), { target: { value: 'AAPL' } })
    fireEvent.change(screen.getByLabelText('Target Entry Price *'), { target: { value: '150' } })
    fireEvent.change(screen.getByLabelText('Target Quantity *'), { target: { value: '100' } })
    fireEvent.change(screen.getByLabelText('Profit Target *'), { target: { value: '170' } })
    fireEvent.change(screen.getByLabelText('Stop Loss *'), { target: { value: '140' } })
    fireEvent.change(screen.getByLabelText('Position Thesis *'), {
      target: { value: 'Bullish on AAPL fundamentals' }
    })

    // Fill in strike price
    await waitFor(() => {
      expect(screen.getByLabelText(/Strike Price/i)).toBeInTheDocument()
    })

    const strikeInput = screen.getByLabelText(/Strike Price/i)
    fireEvent.change(strikeInput, { target: { value: '145' } })

    // Select stop_loss_basis but NOT profit_target_basis
    const stopLossBasisRadios = screen.getAllByLabelText('Stock')
    // The second "Stock" radio is for stop loss basis (first is for profit target)
    fireEvent.click(stopLossBasisRadios[1])

    // Try to proceed to next step
    const nextButton = screen.getByText('Next: Trading Journal')
    expect(nextButton).toBeVisible()
    fireEvent.click(nextButton)

    // Should show validation error for profit_target_basis
    await waitFor(() => {
      expect(screen.getByText('Profit target basis is required')).toBeInTheDocument()
    })

    // Should not proceed to next step
    expect(screen.getByText('Position Plan')).toBeInTheDocument()
  })

  it('validates stop_loss_basis is required for Short Put', async () => {
    renderComponent()

    // Wait for component to finish loading
    await waitFor(() => {
      expect(screen.getByText('Position Plan')).toBeInTheDocument()
    })

    // Change to Short Put
    const strategySelector = screen.getByLabelText('Strategy Type')
    fireEvent.change(strategySelector, { target: { value: 'Short Put' } })

    // Fill in all required fields except stop_loss_basis
    fireEvent.change(screen.getByLabelText('Symbol *'), { target: { value: 'AAPL' } })
    fireEvent.change(screen.getByLabelText('Target Entry Price *'), { target: { value: '150' } })
    fireEvent.change(screen.getByLabelText('Target Quantity *'), { target: { value: '100' } })
    fireEvent.change(screen.getByLabelText('Profit Target *'), { target: { value: '170' } })
    fireEvent.change(screen.getByLabelText('Stop Loss *'), { target: { value: '140' } })
    fireEvent.change(screen.getByLabelText('Position Thesis *'), {
      target: { value: 'Bullish on AAPL fundamentals' }
    })

    // Fill in strike price
    await waitFor(() => {
      expect(screen.getByLabelText(/Strike Price/i)).toBeInTheDocument()
    })

    const strikeInput = screen.getByLabelText(/Strike Price/i)
    fireEvent.change(strikeInput, { target: { value: '145' } })

    // Select profit_target_basis but NOT stop_loss_basis
    const profitTargetBasisRadios = screen.getAllByLabelText('Stock')
    // The first "Stock" radio is for profit target basis
    fireEvent.click(profitTargetBasisRadios[0])

    // Try to proceed to next step
    const nextButton = screen.getByText('Next: Trading Journal')
    expect(nextButton).toBeVisible()
    fireEvent.click(nextButton)

    // Should show validation error for stop_loss_basis
    await waitFor(() => {
      expect(screen.getByText('Stop loss basis is required')).toBeInTheDocument()
    })

    // Should not proceed to next step
    expect(screen.getByText('Position Plan')).toBeInTheDocument()
  })

  it('validates both profit_target_basis and stop_loss_basis are required for Short Put', async () => {
    renderComponent()

    // Wait for component to finish loading
    await waitFor(() => {
      expect(screen.getByText('Position Plan')).toBeInTheDocument()
    })

    // Change to Short Put
    const strategySelector = screen.getByLabelText('Strategy Type')
    fireEvent.change(strategySelector, { target: { value: 'Short Put' } })

    // Fill in all required fields except BOTH basis fields
    fireEvent.change(screen.getByLabelText('Symbol *'), { target: { value: 'AAPL' } })
    fireEvent.change(screen.getByLabelText('Target Entry Price *'), { target: { value: '150' } })
    fireEvent.change(screen.getByLabelText('Target Quantity *'), { target: { value: '100' } })
    fireEvent.change(screen.getByLabelText('Profit Target *'), { target: { value: '170' } })
    fireEvent.change(screen.getByLabelText('Stop Loss *'), { target: { value: '140' } })
    fireEvent.change(screen.getByLabelText('Position Thesis *'), {
      target: { value: 'Bullish on AAPL fundamentals' }
    })

    // Fill in strike price
    await waitFor(() => {
      expect(screen.getByLabelText(/Strike Price/i)).toBeInTheDocument()
    })

    const strikeInput = screen.getByLabelText(/Strike Price/i)
    fireEvent.change(strikeInput, { target: { value: '145' } })

    // Do NOT select either profit_target_basis or stop_loss_basis

    // Try to proceed to next step
    const nextButton = screen.getByText('Next: Trading Journal')
    expect(nextButton).toBeVisible()
    fireEvent.click(nextButton)

    // Should show validation errors for BOTH basis fields
    await waitFor(() => {
      expect(screen.getByText('Profit target basis is required')).toBeInTheDocument()
      expect(screen.getByText('Stop loss basis is required')).toBeInTheDocument()
    })

    // Should not proceed to next step
    expect(screen.getByText('Position Plan')).toBeInTheDocument()
  })
})
