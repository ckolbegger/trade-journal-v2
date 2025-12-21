import { describe, it, expect, beforeEach } from 'vitest'
import { render, waitFor, screen } from '@testing-library/react'
import { ServiceProvider, useServices } from '../ServiceContext'
import { ServiceContainer } from '@/services/ServiceContainer'
import 'fake-indexeddb/auto'

describe('ServiceContext', () => {
  beforeEach(() => {
    // Reset singleton
    ServiceContainer.resetInstance()
  })

  it('should provide ServiceContainer to children', async () => {
    let capturedServices: ServiceContainer | null = null

    function TestComponent() {
      capturedServices = useServices()
      return <div>Test</div>
    }

    render(
      <ServiceProvider>
        <TestComponent />
      </ServiceProvider>
    )

    // Wait for ServiceProvider to finish initializing
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    expect(capturedServices).toBeInstanceOf(ServiceContainer)
  })

  it('should throw error when used outside provider', () => {
    function TestComponent() {
      useServices()
      return <div>Test</div>
    }

    expect(() => render(<TestComponent />)).toThrow()
  })

  it('should return same container instance across renders', async () => {
    const instances: ServiceContainer[] = []

    function TestComponent({ id }: { id: number }) {
      const services = useServices()
      instances[id] = services
      return <div>Test {id}</div>
    }

    const { rerender } = render(
      <ServiceProvider>
        <TestComponent id={0} />
      </ServiceProvider>
    )

    // Wait for first render to initialize
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    rerender(
      <ServiceProvider>
        <TestComponent id={1} />
      </ServiceProvider>
    )

    expect(instances[0]).toBe(instances[1])
  })
})
