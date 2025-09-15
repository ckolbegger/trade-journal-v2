import { vi } from 'vitest'

// Create a comprehensive mock PositionService with all required methods
export const createMockPositionService = (customMethods = {}) => {
  const defaultMethods = {
    create: vi.fn().mockImplementation((position: any) => Promise.resolve(position)),
    getById: vi.fn(),
    getAll: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    clearAll: vi.fn(),
    getDB: vi.fn(),
    validatePosition: vi.fn(),
    dbName: 'TradingJournalDB',
    version: 1,
    positionStore: 'positions'
  }

  return { ...defaultMethods, ...customMethods }
}

// Helper to reset mock service methods between tests
export const resetMockService = (mockService: any) => {
  if (!mockService) return

  Object.keys(mockService).forEach(key => {
    if (typeof mockService[key] === 'function' && key !== 'dbName' && key !== 'version' && key !== 'positionStore') {
      mockService[key].mockClear()
    }
  })
}

// Pre-configured mock module for easy import
export const mockPositionServiceModule = {
  create: vi.fn().mockImplementation((position: any) => Promise.resolve(position)),
  getById: vi.fn(),
  getAll: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  clearAll: vi.fn(),
  getDB: vi.fn(),
  validatePosition: vi.fn(),
  dbName: 'TradingJournalDB',
  version: 1,
  positionStore: 'positions'
}