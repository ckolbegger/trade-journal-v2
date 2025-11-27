import { describe, it, expect } from 'vitest'
import { formatDate } from '../formatters'

describe('formatters', () => {
  describe('formatDate', () => {
    it('should format Date object correctly', () => {
      const date = new Date('2024-03-15T10:30:00Z')
      const result = formatDate(date)
      expect(result).toBe('Mar 15, 2024')
    })

    it('should format another date correctly', () => {
      const date = new Date('2023-12-31T23:59:59Z')
      const result = formatDate(date)
      expect(result).toBe('Dec 31, 2023')
    })

    it('should handle dates at year boundaries', () => {
      const date = new Date('2024-01-01T12:00:00Z')
      const result = formatDate(date)
      expect(result).toBe('Jan 1, 2024')
    })

    it('should format dates consistently', () => {
      const date1 = new Date('2024-06-15')
      const date2 = new Date('2024-06-15')
      expect(formatDate(date1)).toBe(formatDate(date2))
    })
  })
})
