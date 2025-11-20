import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { ServiceProvider, useServices } from '../ServiceContext'
import { ServiceContainer } from '@/services/ServiceContainer'
import 'fake-indexeddb/auto'

describe('ServiceContext', () => {
  beforeEach(() => {
    // Reset singleton
    // @ts-expect-error - accessing private static for testing
    ServiceContainer.instance = null
  })

  it('should provide ServiceContainer to children', () => {
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

    expect(capturedServices).toBeInstanceOf(ServiceContainer)
  })

  it('should throw error when used outside provider', () => {
    function TestComponent() {
      useServices()
      return <div>Test</div>
    }

    expect(() => render(<TestComponent />)).toThrow()
  })

  it('should return same container instance across renders', () => {
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

    rerender(
      <ServiceProvider>
        <TestComponent id={1} />
      </ServiceProvider>
    )

    expect(instances[0]).toBe(instances[1])
  })
})
