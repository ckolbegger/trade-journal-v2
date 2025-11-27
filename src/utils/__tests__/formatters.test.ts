import { describe, it, expect } from 'vitest'
import { formatDate, formatCurrency } from '../formatters'

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

  describe('formatCurrency', () => {
    it('should format positive amounts correctly', () => {
      expect(formatCurrency(150.50)).toBe('$150.50')
    })

    it('should format zero correctly', () => {
      expect(formatCurrency(0)).toBe('$0.00')
    })

    it('should format negative amounts correctly', () => {
      expect(formatCurrency(-25.99)).toBe('-$25.99')
    })

    it('should format large amounts with commas', () => {
      expect(formatCurrency(1234567.89)).toBe('$1,234,567.89')
    })

    it('should format whole numbers with decimals', () => {
      expect(formatCurrency(100)).toBe('$100.00')
    })

    it('should round to 2 decimal places', () => {
      expect(formatCurrency(10.999)).toBe('$11.00')
    })
  })
})
