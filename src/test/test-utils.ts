import { render, waitFor, screen } from '@testing-library/react'
import * as React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ServiceProvider } from '@/contexts/ServiceContext'

/**
 * Test Rendering Utilities
 *
 * Centralized render helpers to eliminate duplication across test files
 */

/**
 * Wait for ServiceProvider initialization to complete
 * ServiceProvider shows "Loading..." while initializing the database
 */
const waitForServiceInit = async () => {
  await waitFor(() => {
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
  }, { timeout: 3000 })
}

/**
 * Render a component with React Router context and ServiceProvider
 * Waits for ServiceProvider to finish initializing before returning
 * @param component - The React component to render
 * @returns Render result from testing-library
 */
export const renderWithRouter = async (component: React.ReactElement) => {
  const result = render(
    React.createElement(ServiceProvider, null,
      React.createElement(BrowserRouter, null, component)
    )
  )
  await waitForServiceInit()
  return result
}

/**
 * Render a component with React Router context, ServiceProvider, and optional props injection
 * Waits for ServiceProvider to finish initializing before returning
 * @param component - The React component to render
 * @param props - Optional props to inject into the component (deprecated - use ServiceProvider instead)
 * @returns Render result from testing-library
 */
export const renderWithRouterAndProps = async <T extends {}>(
  component: React.ReactElement,
  props?: T
) => {
  const elementToRender = props
    ? React.cloneElement(component, props as React.ComponentProps<any>)
    : component

  const result = render(
    React.createElement(ServiceProvider, null,
      React.createElement(BrowserRouter, null, elementToRender)
    )
  )
  await waitForServiceInit()
  return result
}

/**
 * Render the full App component (useful for integration tests)
 * App already includes ServiceProvider, so no need to wrap again
 * @returns Render result from testing-library
 */
export const renderApp = async () => {
  const App = (await import('../App')).default
  return render(
    React.createElement(BrowserRouter, null, React.createElement(App))
  )
}

/**
 * Render component with custom providers for advanced testing
 * Always includes ServiceProvider and BrowserRouter unless explicitly overridden
 * Waits for ServiceProvider to finish initializing before returning
 * @param component - The React component to render
 * @param providers - Array of provider components to wrap around the component
 * @returns Render result from testing-library
 */
export const renderWithProviders = async (
  component: React.ReactElement,
  providers: React.ReactElement[] = []
) => {
  let wrappedComponent = component
  for (const Provider of providers.reverse()) {
    wrappedComponent = React.cloneElement(Provider, {}, wrappedComponent)
  }

  const result = render(
    React.createElement(ServiceProvider, null,
      React.createElement(BrowserRouter, null, wrappedComponent)
    )
  )
  await waitForServiceInit()
  return result
}