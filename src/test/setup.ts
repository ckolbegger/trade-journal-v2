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