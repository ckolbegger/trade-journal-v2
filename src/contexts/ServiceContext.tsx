import React, { useMemo } from 'react'
import { ServiceContainer } from '@/services/ServiceContainer'

/**
 * ServiceContext - React context for dependency injection
 *
 * Provides ServiceContainer to the component tree
 */

const ServiceContext = React.createContext<ServiceContainer | null>(null)

/**
 * ServiceProvider - Provides ServiceContainer to children
 */
export function ServiceProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const services = useMemo(() => ServiceContainer.getInstance(), [])

  return (
    <ServiceContext.Provider value={services}>
      {children}
    </ServiceContext.Provider>
  )
}

/**
 * useServices hook - Access ServiceContainer from context
 *
 * @throws Error if used outside ServiceProvider
 */
export function useServices(): ServiceContainer {
  const context = React.useContext(ServiceContext)

  if (!context) {
    throw new Error('useServices must be used within ServiceProvider')
  }

  return context
}

export { ServiceContext }
