import { render } from '@testing-library/react'
import * as React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ServiceProvider } from '@/contexts/ServiceContext'

/**
 * Test Rendering Utilities
 *
 * Centralized render helpers to eliminate duplication across test files
 */

/**
 * Render a component with React Router context and ServiceProvider
 * @param component - The React component to render
 * @returns Render result from testing-library
 */
export const renderWithRouter = (component: React.ReactElement) => {
  return render(
    React.createElement(ServiceProvider, null,
      React.createElement(BrowserRouter, null, component)
    )
  )
}

/**
 * Render a component with React Router context, ServiceProvider, and optional props injection
 * @param component - The React component to render
 * @param props - Optional props to inject into the component (deprecated - use ServiceProvider instead)
 * @returns Render result from testing-library
 */
export const renderWithRouterAndProps = <T extends {}>(
  component: React.ReactElement,
  props?: T
) => {
  const elementToRender = props
    ? React.cloneElement(component, props as React.ComponentProps<any>)
    : component

  return render(
    React.createElement(ServiceProvider, null,
      React.createElement(BrowserRouter, null, elementToRender)
    )
  )
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
 * @param component - The React component to render
 * @param providers - Array of provider components to wrap around the component
 * @returns Render result from testing-library
 */
export const renderWithProviders = (
  component: React.ReactElement,
  providers: React.ReactElement[] = []
) => {
  let wrappedComponent = component
  for (const Provider of providers.reverse()) {
    wrappedComponent = React.cloneElement(Provider, {}, wrappedComponent)
  }

  return render(
    React.createElement(ServiceProvider, null,
      React.createElement(BrowserRouter, null, wrappedComponent)
    )
  )
}