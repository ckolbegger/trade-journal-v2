import type { RenderOptions } from '@testing-library/react'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { BrowserRouter } from 'react-router-dom'

// Custom render function that includes Router context
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <BrowserRouter>{children}</BrowserRouter>
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Helper function to click visible elements with validation
export const clickVisibleElement = async (element: HTMLElement, user: ReturnType<typeof import('@testing-library/user-event').default.setup>) => {
  const { expect } = await import('vitest')
  expect(element).toBeVisible()
  await user.click(element)
}