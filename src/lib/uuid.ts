/**
 * UUID Generation Utilities for Position and Journal IDs
 *
 * Provides future-proof UUID-based ID generation for distributed scenarios
 * while maintaining backward compatibility with existing timestamp-based IDs.
 */

/**
 * Generate a UUID v4 using crypto.randomUUID() with fallback for older browsers
 */
function generateUUID(): string {
  // Use native crypto.randomUUID() if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // Fallback for older browsers or testing environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Generate a position ID with UUID format: pos-{uuid}
 */
export function generatePositionId(): string {
  return `pos-${generateUUID()}`
}

/**
 * Generate a journal ID with UUID format: journal-{uuid}
 */
export function generateJournalId(): string {
  return `journal-${generateUUID()}`
}

/**
 * Validate if an ID follows the expected format
 */
export function isValidPositionId(id: string): boolean {
  return /^pos-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id)
}

export function isValidJournalId(id: string): boolean {
  return /^journal-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id)
}