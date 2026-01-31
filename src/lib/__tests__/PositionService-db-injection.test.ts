import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PositionService } from '../position'
import type { Position } from '../position'
import { SchemaManager } from '@/services/SchemaManager'
import { createPosition } from '@/test/data-factories'
import 'fake-indexeddb/auto'

describe('PositionService with IDBDatabase injection', () => {
  let db: IDBDatabase
  let positionService: PositionService

  beforeEach(async () => {
    // Delete database to ensure clean state
    const deleteRequest = indexedDB.deleteDatabase('TestDB')
    await new Promise<void>((resolve) => {
      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => resolve()
      deleteRequest.onblocked = () => resolve()
    })

    // Create test database with schema
    db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('TestDB', 1)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result
        SchemaManager.initializeSchema(database, 1)
      }
    })

    // Create service with injected database
    positionService = new PositionService(db)
  })

  afterEach(() => {
    db?.close()
    indexedDB.deleteDatabase('TestDB')
  })

  it('should accept IDBDatabase in constructor', () => {
    expect(positionService).toBeDefined()
    expect(positionService).toBeInstanceOf(PositionService)
  })

  it('should use injected database for create operations', async () => {
    const position = createPosition({ id: 'test-create' })

    const created = await positionService.create(position)

    expect(created).toBeDefined()
    expect(created.id).toBe('test-create')
  })

  it('should use injected database for read operations', async () => {
    const position = createPosition({ id: 'test-read' })
    await positionService.create(position)

    const retrieved = await positionService.getById('test-read')

    expect(retrieved).toBeDefined()
    expect(retrieved!.id).toBe('test-read')
    expect(retrieved!.symbol).toBe('AAPL')
  })

  it('should use injected database for update operations', async () => {
    const position = createPosition({ id: 'test-update' })
    await positionService.create(position)

    const updated = { ...position, symbol: 'MSFT' }
    await positionService.update(updated)

    const retrieved = await positionService.getById('test-update')
    expect(retrieved!.symbol).toBe('MSFT')
  })

  it('should use injected database for delete operations', async () => {
    const position = createPosition({ id: 'test-delete' })
    await positionService.create(position)

    await positionService.delete('test-delete')

    const retrieved = await positionService.getById('test-delete')
    expect(retrieved).toBeNull()
  })

  it('should use injected database for getAll operations', async () => {
    const position1 = createPosition({ id: 'test-1' })
    const position2 = createPosition({ id: 'test-2' })

    await positionService.create(position1)
    await positionService.create(position2)

    const all = await positionService.getAll()

    expect(all).toHaveLength(2)
    expect(all.map(p => p.id)).toContain('test-1')
    expect(all.map(p => p.id)).toContain('test-2')
  })

  it('should not have getDB() method', () => {
    // Service should not manage database connection lifecycle
    expect((positionService as any).getDB).toBeUndefined()
  })
})
