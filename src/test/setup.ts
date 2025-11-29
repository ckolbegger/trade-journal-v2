import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'
import { vi, beforeEach } from 'vitest'

// Mock localStorage for tests with actual storage behavior
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = String(value)
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Reset storage and mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
})

/**
 * Helper function to initialize or reset ServiceContainer for tests
 * Cleans database and initializes fresh connection
 */
export async function setupServiceContainer() {
  const { ServiceContainer } = await import('@/services/ServiceContainer')

  // Delete database for clean state
  const deleteRequest = indexedDB.deleteDatabase('TradingJournalDB')
  await new Promise<void>((resolve) => {
    deleteRequest.onsuccess = () => resolve()
    deleteRequest.onerror = () => resolve()
    deleteRequest.onblocked = () => resolve()
  })

  // Reset singleton
  ServiceContainer.resetInstance()

  // Initialize with fresh database
  const container = ServiceContainer.getInstance()
  await container.initialize()
  return container
}

/**
 * Helper function to cleanup ServiceContainer and database after tests
 */
export async function cleanupServiceContainer() {
  const { ServiceContainer } = await import('@/services/ServiceContainer')

  ServiceContainer.resetInstance()

  // Clean up database
  const deleteRequest = indexedDB.deleteDatabase('TradingJournalDB')
  await new Promise<void>((resolve) => {
    deleteRequest.onsuccess = () => resolve()
    deleteRequest.onerror = () => resolve()
    deleteRequest.onblocked = () => resolve()
  })
}
