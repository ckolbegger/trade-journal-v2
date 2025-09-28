import { fireEvent, waitFor, screen } from '@testing-library/react'

/**
 * Integration Test Helpers for Position Creation Flow
 *
 * These helpers eliminate duplicated form-filling logic across integration tests
 * and provide consistent, reusable test scenarios.
 */

export interface PositionFormData {
  symbol?: string
  targetEntryPrice?: string
  targetQuantity?: string
  profitTarget?: string
  stopLoss?: string
  positionThesis?: string
}

/**
 * Fill out the Position Plan form (Step 1) with provided or default values
 */
export const fillPositionForm = async (data: PositionFormData = {}) => {
  const {
    symbol = 'AAPL',
    targetEntryPrice = '150.00',
    targetQuantity = '100',
    profitTarget = '165.00',
    stopLoss = '135.00',
    positionThesis = 'Integration test: Bullish on Q4 earnings and iPhone cycle'
  } = data

  // Fill out all form fields
  fireEvent.change(screen.getByLabelText(/Symbol/i), { target: { value: symbol } })
  fireEvent.change(screen.getByLabelText(/Target Entry Price/i), { target: { value: targetEntryPrice } })
  fireEvent.change(screen.getByLabelText(/Target Quantity/i), { target: { value: targetQuantity } })
  fireEvent.change(screen.getByLabelText(/Profit Target/i), { target: { value: profitTarget } })
  fireEvent.change(screen.getByLabelText(/Stop Loss/i), { target: { value: stopLoss } })
  fireEvent.change(screen.getByLabelText(/Position Thesis/i), {
    target: { value: positionThesis }
  })

  // Verify strategy type is locked to "Long Stock"
  const strategyInput = screen.getByLabelText(/Strategy Type/i)
  expect(strategyInput).toHaveValue('Long Stock')
  expect(strategyInput).toHaveAttribute('readonly')
}

/**
 * Navigate from Position Plan to Risk Assessment (Step 1 → Step 2)
 */
export const proceedToRiskAssessment = async () => {
  const nextButton = screen.getByText('Next: Risk Assessment')
  expect(nextButton).toBeVisible()
  fireEvent.click(nextButton)

  // Verify Step 2 displays
  await waitFor(() => {
    expect(screen.getByText('Risk Assessment')).toBeInTheDocument()
  })

  // Verify risk calculations are displayed
  expect(screen.getByText('$15,000.00')).toBeInTheDocument() // Total investment
  expect(screen.getAllByText('$1,500.00')).toHaveLength(2)   // Max profit and loss
  expect(screen.getByText('1:1')).toBeInTheDocument()        // Risk/reward ratio
}

/**
 * Navigate from Risk Assessment to Trading Journal (Step 2 → Step 3)
 */
export const proceedToTradingJournal = async () => {
  const nextToJournalButton = screen.getByText('Next: Trading Journal')
  expect(nextToJournalButton).toBeVisible()
  fireEvent.click(nextToJournalButton)

  // Verify Step 3 displays
  await waitFor(() => {
    expect(screen.getByText('📝 Position Plan')).toBeInTheDocument()
  })

  // Verify enhanced journal form is displayed
  expect(screen.getByLabelText(/Rationale/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/Emotional State/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/Market Conditions/i)).toBeInTheDocument()
  expect(screen.getByLabelText(/Execution Strategy/i)).toBeInTheDocument()
}

/**
 * Fill out the Trading Journal form (Step 3)
 */
export const fillTradingJournal = async () => {
  // Fill out journal form
  fireEvent.change(screen.getByLabelText(/Rationale/i), {
    target: { value: 'Strong technical support at current levels with bullish momentum' }
  })
  fireEvent.change(screen.getByLabelText(/Emotional State/i), {
    target: { value: 'Confident' }
  })
  fireEvent.change(screen.getByLabelText(/Market Conditions/i), {
    target: { value: 'Bullish trend with Fed pause expected' }
  })
  fireEvent.change(screen.getByLabelText(/Execution Strategy/i), {
    target: { value: 'Limit order at support level' }
  })
}

/**
 * Navigate from Trading Journal to Confirmation (Step 3 → Step 4)
 */
export const proceedToConfirmation = async () => {
  // Submit journal form
  const submitJournal = screen.getByRole('button', { name: /Next: Confirmation/i })
  expect(submitJournal).toBeVisible()
  fireEvent.click(submitJournal)

  // Verify Step 4 displays
  await waitFor(() => {
    expect(screen.getByText('Confirmation')).toBeInTheDocument()
  })

  // Verify position summary displays
  expect(screen.getByText('AAPL')).toBeInTheDocument()
  expect(screen.getByText('Long Stock')).toBeInTheDocument()
  expect(screen.getByText('$150.00')).toBeInTheDocument()
  expect(screen.getByText('100 shares')).toBeInTheDocument()
}

/**
 * Complete the entire position creation flow from start to finish
 */
export const completePositionCreationFlow = async (formData?: PositionFormData) => {
  // Step 1: Fill position form
  await fillPositionForm(formData)

  // Step 1 → Step 2: Risk Assessment
  await proceedToRiskAssessment()

  // Step 2 → Step 3: Trading Journal
  await proceedToTradingJournal()

  // Step 3: Fill Trading Journal
  await fillTradingJournal()

  // Step 3 → Step 4: Confirmation
  await proceedToConfirmation()

  // Step 4: Confirm immutable checkbox and create position
  const immutableCheckbox = screen.getByRole('checkbox', {
    name: /I understand this position plan will be immutable/i
  })
  expect(immutableCheckbox).toBeInTheDocument()
  expect(immutableCheckbox).not.toBeChecked()

  const createPositionButton = screen.getByText('Create Position Plan')
  expect(createPositionButton).toBeDisabled()

  // Check the immutable checkbox to enable the button
  fireEvent.click(immutableCheckbox)
  expect(createPositionButton).toBeEnabled()

  // Create the position
  fireEvent.click(createPositionButton)
}

/**
 * Verify dashboard displays created position
 */
export const verifyDashboardPosition = async (symbol: string = 'AAPL') => {
  await waitFor(() => {
    expect(screen.getByRole('heading', { name: 'Positions' })).toBeInTheDocument()
    expect(screen.getByText(symbol)).toBeInTheDocument()
    expect(screen.getByText('Long Stock')).toBeInTheDocument()
    expect(screen.getByText('No trades executed')).toBeInTheDocument()
  })
}