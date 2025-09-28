import { describe, it, expect } from 'vitest'
import type { JournalField, JournalEntry } from '../journal'

describe('JournalField Migration Compatibility', () => {
  it('should handle JournalField with required property', () => {
    const modernField: JournalField = {
      name: 'rationale',
      prompt: 'Why this trade? Why now?',
      response: 'Strong technical setup',
      required: true
    }

    expect(modernField.required).toBe(true)
    expect(modernField.name).toBe('rationale')
  })

  it('should handle JournalField without required property (backward compatibility)', () => {
    // Simulate old journal field without required property
    const legacyField = {
      name: 'thesis',
      prompt: 'Why are you planning this position?',
      response: 'Bullish on earnings'
      // Note: no required property
    } as JournalField

    // Should default to false when required is undefined
    const isRequired = legacyField.required ?? false
    expect(isRequired).toBe(false)
  })

  it('should handle mixed old and new fields in same journal entry', () => {
    const mixedEntry: JournalEntry = {
      id: 'test-123',
      position_id: 'pos-123',
      entry_type: 'position_plan',
      fields: [
        {
          name: 'thesis',
          prompt: 'Why are you planning this position?',
          response: 'Old style entry'
          // No required property - legacy field
        } as JournalField,
        {
          name: 'emotional_state',
          prompt: 'How are you feeling?',
          response: 'Confident',
          required: false
          // Has required property - modern field
        }
      ],
      created_at: '2024-01-15T10:00:00.000Z'
    }

    expect(mixedEntry.fields).toHaveLength(2)
    expect(mixedEntry.fields[0].required ?? false).toBe(false)
    expect(mixedEntry.fields[1].required ?? false).toBe(false)
  })

  it('should validate field requirements using stored required values', () => {
    const requiredField: JournalField = {
      name: 'rationale',
      prompt: 'Why this trade? Why now?',
      response: '',
      required: true
    }

    const optionalField: JournalField = {
      name: 'emotional_state',
      prompt: 'How are you feeling?',
      response: '',
      required: false
    }

    const legacyField = {
      name: 'thesis',
      prompt: 'Old prompt',
      response: ''
      // No required property
    } as JournalField

    // Validation logic should use stored required values
    const isRequiredFieldValid = (requiredField.required ?? false) ? requiredField.response.length > 0 : true
    const isOptionalFieldValid = (optionalField.required ?? false) ? optionalField.response.length > 0 : true
    const isLegacyFieldValid = (legacyField.required ?? false) ? legacyField.response.length > 0 : true

    expect(isRequiredFieldValid).toBe(false) // Required but empty
    expect(isOptionalFieldValid).toBe(true)  // Optional, empty is OK
    expect(isLegacyFieldValid).toBe(true)    // Legacy defaults to optional
  })
})