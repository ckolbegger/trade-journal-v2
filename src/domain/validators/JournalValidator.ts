import type { CreateJournalEntryRequest, UpdateJournalEntryRequest } from '@/services/JournalService'

/**
 * JournalValidator - Domain validation for journal entries
 *
 * Enforces business rules for journal entry data integrity.
 */
export class JournalValidator {
  /**
   * Validate journal entry creation request
   *
   * @param request - Creation request to validate
   * @throws Error if validation fails
   */
  static validateCreateRequest(request: CreateJournalEntryRequest): void {
    // Validate trade_id is not empty string (check this first)
    if (request.trade_id === '') {
      throw new Error('trade_id cannot be empty string')
    }

    // Must have either position_id or trade_id
    if (!request.position_id && !request.trade_id) {
      throw new Error('Journal entry must have either position_id or trade_id')
    }

    // Must have at least one field
    if (!request.fields || request.fields.length === 0) {
      throw new Error('At least one journal field is required')
    }

    // Validate thesis field if present
    const thesisField = request.fields.find(field => field.name === 'thesis')
    if (thesisField) {
      this.validateThesisContent(thesisField.response)
    }
  }

  /**
   * Validate journal entry update request
   *
   * @param request - Update request to validate
   * @throws Error if validation fails
   */
  static validateUpdateRequest(request: UpdateJournalEntryRequest): void {
    if (request.fields) {
      const thesisField = request.fields.find(field => field.name === 'thesis')
      if (thesisField) {
        this.validateThesisContent(thesisField.response)
      }
    }
  }

  /**
   * Validate thesis field content
   *
   * @param content - Thesis content to validate
   * @throws Error if validation fails
   */
  static validateThesisContent(content: string): void {
    if (content.trim().length > 0 && content.trim().length < 10) {
      throw new Error('Thesis response must be at least 10 characters')
    }
    if (content.length > 2000) {
      throw new Error('Thesis response cannot exceed 2000 characters')
    }
  }
}
