import { screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'

/**
 * Custom Assertion Helpers
 *
 * Specialized assertions to eliminate duplication and improve test readability
 */

/**
 * Position-related assertions for dashboard and position tests
 */
export const assertPositionInDashboard = (symbol: string, expectedCount: number = 1) => {
  const positions = screen.getAllByText(symbol)
  expect(positions).toHaveLength(expectedCount)
}

export const assertPositionDetails = (symbol: string, details: {
  strategy?: string
  entryPrice?: string
  quantity?: string
  stopLoss?: string
  status?: string
}) => {
  if (details.strategy) {
    expect(screen.getAllByText(details.strategy)).toHaveLength(symbol === 'ALL' ? -1 : 1)
  }
  if (details.entryPrice) {
    expect(screen.getByText(new RegExp(`\\$${details.entryPrice}`))).toBeInTheDocument()
  }
  if (details.stopLoss) {
    expect(screen.getByText(new RegExp(`\\$${details.stopLoss}`))).toBeInTheDocument()
  }
}

export const assertEmptyState = () => {
  expect(screen.getByText('Start Your Trading Journey')).toBeInTheDocument()
  expect(screen.getByText(/Track your trades, learn from your decisions/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /Create Your First Position/i })).toBeInTheDocument()
}

/**
 * Form validation assertions
 */
export const assertFormValidationErrors = (expectedErrors: string[]) => {
  expectedErrors.forEach(error => {
    expect(screen.getByText(new RegExp(error, 'i'))).toBeInTheDocument()
  })
}

export const assertFormFieldValues = (fieldValues: Record<string, string>) => {
  Object.entries(fieldValues).forEach(([label, value]) => {
    const field = screen.getByLabelText(new RegExp(label, 'i'))
    expect(field).toHaveValue(value)
  })
}

export const assertButtonState = (buttonText: string, enabled: boolean) => {
  const button = screen.getByRole('button', { name: new RegExp(buttonText, 'i') })
  if (enabled) {
    expect(button).toBeEnabled()
  } else {
    expect(button).toBeDisabled()
  }
}

/**
 * Navigation and step assertions
 */
export const assertStepVisible = (stepName: string) => {
  expect(screen.getByText(stepName)).toBeInTheDocument()
}

export const assertStepDotsStatus = (expectedStatus: {
  active?: number
  completed?: number[]
}) => {
  const stepDots = screen.getAllByTestId(/step-dot/)

  if (expectedStatus.active !== undefined) {
    expect(stepDots[expectedStatus.active]).toHaveClass('active')
  }

  if (expectedStatus.completed) {
    expectedStatus.completed.forEach(index => {
      expect(stepDots[index]).toHaveClass('completed')
    })
  }
}

/**
 * Risk assessment assertions
 */
export const assertRiskCalculations = (calculations: {
  totalInvestment?: string
  maxProfit?: string
  maxLoss?: string
  riskRewardRatio?: string
}) => {
  if (calculations.totalInvestment) {
    expect(screen.getByText(new RegExp(`\\$${calculations.totalInvestment}`))).toBeInTheDocument()
  }
  if (calculations.maxProfit) {
    const profitElements = screen.getAllByText(new RegExp(`\\$${calculations.maxProfit}`))
    expect(profitElements.length).toBeGreaterThan(0)
  }
  if (calculations.maxLoss) {
    const lossElements = screen.getAllByText(new RegExp(`\\$${calculations.maxLoss}`))
    expect(lossElements.length).toBeGreaterThan(0)
  }
  if (calculations.riskRewardRatio) {
    expect(screen.getByText(calculations.riskRewardRatio)).toBeInTheDocument()
  }
}

/**
 * UI component assertions
 */
export const assertFabButtonVisible = () => {
  const fabButtons = screen.getAllByRole('link', { name: '' })
  const fabButton = fabButtons.find(button => button.classList.contains('fixed'))
  expect(fabButton).toBeInTheDocument()
  expect(fabButton).toHaveClass('fixed', 'bottom-24', 'right-4')
}

export const assertMobileResponsive = (elementTestId: string, expectedClasses: string[]) => {
  const element = screen.getByTestId(elementTestId)
  expectedClasses.forEach(className => {
    expect(element).toHaveClass(className)
  })
}

/**
 * Immutable confirmation assertions
 */
export const assertImmutableConfirmationVisible = () => {
  const checkbox = screen.getByRole('checkbox', {
    name: /I understand this position plan will be immutable/i
  })
  expect(checkbox).toBeInTheDocument()
  expect(checkbox).not.toBeChecked()

  const createButton = screen.getByText('Create Position Plan')
  expect(createButton).toBeDisabled()
}

export const assertImmutableConfirmationComplete = () => {
  const checkbox = screen.getByRole('checkbox', {
    name: /I understand this position plan will be immutable/i
  })
  expect(checkbox).toBeChecked()

  const createButton = screen.getByText('Create Position Plan')
  expect(createButton).toBeEnabled()
}

/**
 * Navigation assertions
 */
export const assertNavigationTo = (path: string) => {
  expect(window.location.pathname).toBe(path)
}

/**
 * Content existence assertions with improved error messages
 */
export const assertTextExists = (text: string | RegExp, options?: {
  exact?: boolean
  count?: number
}) => {
  if (typeof text === 'string' && options?.exact) {
    const elements = screen.getAllByText(text, { exact: true })
    expect(elements).toHaveLength(options.count || 1)
  } else if (options?.count) {
    const elements = screen.getAllByText(text)
    expect(elements).toHaveLength(options.count)
  } else {
    expect(screen.getByText(text)).toBeInTheDocument()
  }
}

export const assertTextDoesNotExist = (text: string | RegExp) => {
  expect(screen.queryByText(text)).not.toBeInTheDocument()
}

/**
 * Element visibility assertions
 */
export const assertElementVisible = (element: HTMLElement) => {
  expect(element).toBeVisible()
}

export const assertElementsVisible = (elements: HTMLElement[]) => {
  elements.forEach(element => {
    assertElementVisible(element)
  })
}

/**
 * Form field assertions
 */
export const assertFormFieldExists = (label: string | RegExp) => {
  expect(screen.getByLabelText(label)).toBeInTheDocument()
}

export const assertFormFieldDisabled = (label: string | RegExp) => {
  const field = screen.getByLabelText(label)
  expect(field).toHaveAttribute('readonly')
}

export const assertStrategyTypeLocked = () => {
  // Updated to verify strategy selector has both options (Long Stock and Short Put)
  const strategySelect = screen.getByRole('combobox', { name: /Strategy Type/i })
  expect(strategySelect).toBeInTheDocument()

  // Check that both options exist
  expect(screen.getByText('Long Stock')).toBeInTheDocument()
  expect(screen.getByText('Short Put')).toBeInTheDocument()

  // Default is Long Stock
  expect(strategySelect).toHaveValue('Long Stock')
}