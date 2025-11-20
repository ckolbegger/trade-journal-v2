import { describe, it, expect } from 'vitest'
import { JournalValidator } from '../validators/JournalValidator'
import type { CreateJournalEntryRequest, UpdateJournalEntryRequest } from '@/services/JournalService'
import type { JournalField } from '@/types/journal'

describe('JournalValidator', () => {
  describe('validateCreateRequest', () => {
    const validRequest: CreateJournalEntryRequest = {
      position_id: 'pos-123',
      entry_type: 'position_plan',
      fields: [
        { name: 'thesis', prompt: 'Why?', response: 'Valid thesis with enough characters' }
      ]
    }

    it('should pass for valid request with position_id', () => {
      expect(() => JournalValidator.validateCreateRequest(validRequest)).not.toThrow()
    })

    it('should pass for valid request with trade_id', () => {
      const request = { ...validRequest, position_id: undefined, trade_id: 'trade-123' }
      expect(() => JournalValidator.validateCreateRequest(request)).not.toThrow()
    })

    it('should reject missing both position_id and trade_id', () => {
      const request = { ...validRequest, position_id: undefined }
      expect(() => JournalValidator.validateCreateRequest(request))
        .toThrow('Journal entry must have either position_id or trade_id')
    })

    it('should reject empty string trade_id', () => {
      const request = { ...validRequest, position_id: undefined, trade_id: '' }
      expect(() => JournalValidator.validateCreateRequest(request))
        .toThrow('trade_id cannot be empty string')
    })

    it('should reject empty fields array', () => {
      const request = { ...validRequest, fields: [] }
      expect(() => JournalValidator.validateCreateRequest(request))
        .toThrow('At least one journal field is required')
    })

    it('should reject missing fields', () => {
      const request = { ...validRequest, fields: undefined as any }
      expect(() => JournalValidator.validateCreateRequest(request))
        .toThrow('At least one journal field is required')
    })

    it('should validate thesis field content when present', () => {
      const request = {
        ...validRequest,
        fields: [{ name: 'thesis', prompt: 'Why?', response: 'Short' }] // Less than 10 chars
      }
      expect(() => JournalValidator.validateCreateRequest(request))
        .toThrow('Thesis response must be at least 10 characters')
    })

    it('should pass when thesis field is not present', () => {
      const request = {
        ...validRequest,
        fields: [{ name: 'other', prompt: 'What?', response: 'Something' }]
      }
      expect(() => JournalValidator.validateCreateRequest(request)).not.toThrow()
    })
  })

  describe('validateUpdateRequest', () => {
    it('should pass for valid update with no thesis', () => {
      const request: UpdateJournalEntryRequest = {
        fields: [{ name: 'other', prompt: 'What?', response: 'Something' }]
      }
      expect(() => JournalValidator.validateUpdateRequest(request)).not.toThrow()
    })

    it('should validate thesis content when present', () => {
      const request: UpdateJournalEntryRequest = {
        fields: [{ name: 'thesis', prompt: 'Why?', response: 'Short' }] // Less than 10 chars
      }
      expect(() => JournalValidator.validateUpdateRequest(request))
        .toThrow('Thesis response must be at least 10 characters')
    })

    it('should pass for empty update request', () => {
      const request: UpdateJournalEntryRequest = {}
      expect(() => JournalValidator.validateUpdateRequest(request)).not.toThrow()
    })
  })

  describe('validateThesisContent', () => {
    it('should pass for valid thesis content', () => {
      const validContent = 'This is a valid thesis with sufficient length'
      expect(() => JournalValidator.validateThesisContent(validContent)).not.toThrow()
    })

    it('should reject content less than 10 characters (when not empty)', () => {
      const shortContent = 'Short'
      expect(() => JournalValidator.validateThesisContent(shortContent))
        .toThrow('Thesis response must be at least 10 characters')
    })

    it('should reject content exceeding 2000 characters', () => {
      const longContent = 'a'.repeat(2001)
      expect(() => JournalValidator.validateThesisContent(longContent))
        .toThrow('Thesis response cannot exceed 2000 characters')
    })

    it('should allow empty thesis content', () => {
      expect(() => JournalValidator.validateThesisContent('')).not.toThrow()
    })

    it('should allow whitespace-only thesis content', () => {
      expect(() => JournalValidator.validateThesisContent('   ')).not.toThrow()
    })

    it('should accept exactly 10 characters', () => {
      const content = '1234567890' // Exactly 10
      expect(() => JournalValidator.validateThesisContent(content)).not.toThrow()
    })

    it('should accept exactly 2000 characters', () => {
      const content = 'a'.repeat(2000) // Exactly 2000
      expect(() => JournalValidator.validateThesisContent(content)).not.toThrow()
    })

    it('should reject 9 characters (just under minimum)', () => {
      const content = '123456789' // 9 characters
      expect(() => JournalValidator.validateThesisContent(content))
        .toThrow('Thesis response must be at least 10 characters')
    })
  })
})
