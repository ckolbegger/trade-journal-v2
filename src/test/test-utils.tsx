import type { RenderOptions } from '@testing-library/react'
import { render, waitFor, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ServiceProvider } from '@/contexts/ServiceContext'

// Custom render function that includes Router and Service context
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ServiceProvider>
      <BrowserRouter>{children}</BrowserRouter>
    </ServiceProvider>
  )
}

/**
 * Wait for ServiceProvider initialization to complete
 * ServiceProvider shows "Loading..." while initializing the database
 */
const waitForServiceInit = async () => {
  await waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  }, { timeout: 3000 })
}

const customRender = async (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  const result = render(ui, { wrapper: AllTheProviders, ...options })
  await waitForServiceInit()
  return result
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Helper function to click visible elements with validation
export const clickVisibleElement = async (element: HTMLElement, user: ReturnType<typeof import('@testing-library/user-event').default.setup>) => {
  const { expect } = await import('vitest')
  expect(element).toBeVisible()
  await user.click(element)
}