import { render } from '@testing-library/react'
import * as React from 'react'

/**
 * Test Rendering Utilities
 *
 * Centralized render helpers to eliminate duplication across test files
 */

/**
 * Render a component with React Router context
 * @param component - The React component to render
 * @returns Render result from testing-library
 */
export const renderWithRouter = (component: React.ReactElement) => {
  const { BrowserRouter } = require('react-router-dom')
  return render(
    React.createElement(BrowserRouter, null, component)
  )
}

/**
 * Render a component with React Router context and optional props injection
 * @param component - The React component to render
 * @param props - Optional props to inject into the component
 * @returns Render result from testing-library
 */
export const renderWithRouterAndProps = <T extends {}>(
  component: React.ReactElement,
  props?: T
) => {
  const { BrowserRouter } = require('react-router-dom')
  const elementToRender = props
    ? React.cloneElement(component, props as React.ComponentProps<any>)
    : component

  return render(
    React.createElement(BrowserRouter, null, elementToRender)
  )
}

/**
 * Render the full App component (useful for integration tests)
 * @returns Render result from testing-library
 */
export const renderApp = () => {
  const { BrowserRouter } = require('react-router-dom')
  const App = require('../App').default
  return render(
    React.createElement(BrowserRouter, null, React.createElement(App))
  )
}

/**
 * Render component with custom providers for advanced testing
 * @param component - The React component to render
 * @param providers - Array of provider components to wrap around the component
 * @returns Render result from testing-library
 */
export const renderWithProviders = (
  component: React.ReactElement,
  providers: React.ReactElement[] = []
) => {
  const { BrowserRouter } = require('react-router-dom')

  let wrappedComponent = component
  for (const Provider of providers.reverse()) {
    wrappedComponent = React.cloneElement(Provider, {}, wrappedComponent)
  }

  return render(
    React.createElement(BrowserRouter, null, wrappedComponent)
  )
}