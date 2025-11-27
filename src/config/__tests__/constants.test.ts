import { describe, it, expect } from 'vitest'
import {
  PRICE_CHANGE_THRESHOLD_PERCENT,
  PLAN_VS_EXECUTION_TOLERANCE,
  DECIMAL_PRECISION
} from '../constants'

describe('Configuration Constants', () => {
  describe('PRICE_CHANGE_THRESHOLD_PERCENT', () => {
    it('should be defined', () => {
      expect(PRICE_CHANGE_THRESHOLD_PERCENT).toBeDefined()
    })

    it('should be a positive number', () => {
      expect(PRICE_CHANGE_THRESHOLD_PERCENT).toBeGreaterThan(0)
    })

    it('should have expected value of 20', () => {
      expect(PRICE_CHANGE_THRESHOLD_PERCENT).toBe(20)
    })
  })

  describe('PLAN_VS_EXECUTION_TOLERANCE', () => {
    it('should be defined', () => {
      expect(PLAN_VS_EXECUTION_TOLERANCE).toBeDefined()
    })

    it('should be a small positive number', () => {
      expect(PLAN_VS_EXECUTION_TOLERANCE).toBeGreaterThan(0)
      expect(PLAN_VS_EXECUTION_TOLERANCE).toBeLessThan(1)
    })

    it('should have expected value of 0.01', () => {
      expect(PLAN_VS_EXECUTION_TOLERANCE).toBe(0.01)
    })
  })

  describe('DECIMAL_PRECISION', () => {
    it('should be defined', () => {
      expect(DECIMAL_PRECISION).toBeDefined()
    })

    it('should be a positive integer', () => {
      expect(Number.isInteger(DECIMAL_PRECISION)).toBe(true)
      expect(DECIMAL_PRECISION).toBeGreaterThan(0)
    })

    it('should have expected value of 2', () => {
      expect(DECIMAL_PRECISION).toBe(2)
    })
  })
})
