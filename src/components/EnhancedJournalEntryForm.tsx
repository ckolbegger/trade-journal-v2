import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { JournalField } from '@/types/journal'
import { JOURNAL_PROMPTS } from '@/types/journal'

export interface EnhancedJournalEntryFormProps {
  entryType: 'position_plan' | 'trade_execution'
  initialFields?: JournalField[]
  onSave: (fields: JournalField[]) => void
  onCancel?: () => void
  submitButtonText?: string
  isLoading?: boolean
}

// Helper function to title-case field names for display
const titleCase = (str: string): string => {
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export function EnhancedJournalEntryForm({
  entryType,
  initialFields = [],
  onSave,
  onCancel,
  submitButtonText = 'Save Journal Entry',
  isLoading = false
}: EnhancedJournalEntryFormProps) {
  // Get field definitions - use initialFields if provided, otherwise current JOURNAL_PROMPTS
  const getFieldDefinitions = (): JournalField[] => {
    if (initialFields.length > 0) {
      return initialFields
    }

    // Create fields from current JOURNAL_PROMPTS for new entries
    const promptDefinitions = JOURNAL_PROMPTS[entryType]
    return promptDefinitions.map(definition => ({
      name: definition.name,
      prompt: definition.prompt,
      response: '', // Empty for new entry
      required: definition.required
    }))
  }

  const fieldDefinitions = getFieldDefinitions()

  // Initialize form data dynamically from field definitions
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const initialData: Record<string, string> = {}
    fieldDefinitions.forEach(field => {
      initialData[field.name] = field.response || ''
    })
    return initialData
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validate each field using stored required values
    fieldDefinitions.forEach(field => {
      const isRequired = field.required ?? false
      const value = formData[field.name] || ''

      if (isRequired && !value.trim()) {
        newErrors[field.name] = 'This field is required'
      } else if (isRequired && value.trim().length > 0 && value.trim().length < 10) {
        newErrors[field.name] = 'Content must be at least 10 characters'
      } else if (value.length > 2000) {
        newErrors[field.name] = 'Content cannot exceed 2000 characters'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      // Convert form data back to field format, preserving stored prompts and required values
      const fields: JournalField[] = fieldDefinitions.map(field => ({
        name: field.name,
        prompt: field.prompt, // Use stored prompt
        response: (formData[field.name] || '').trim(),
        required: field.required // Preserve stored required value
      }))

      onSave(fields)
    }
  }

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }))
    }
  }

  // Helper functions for dynamic rendering
  const getCharacterCount = (fieldName: string) => {
    return (formData[fieldName] || '').length
  }

  const getCharacterCountColor = (fieldName: string) => {
    const count = getCharacterCount(fieldName)
    if (count > 1800) return 'text-red-600'
    if (count > 1500) return 'text-yellow-600'
    return 'text-gray-500'
  }

  const isPositionPlan = entryType === 'position_plan'

  // Render field component dynamically
  const renderField = (field: JournalField, index: number) => {
    const fieldValue = formData[field.name] || ''
    const isRequired = field.required ?? false
    const fieldError = errors[field.name]
    const isTextArea = field.name === 'thesis' || field.name === 'rationale' ||
                       field.name === 'execution_notes' || field.name === 'market_conditions' ||
                       field.name === 'execution_strategy'

    return (
      <div key={field.name}>
        <Label htmlFor={field.name} className="block text-sm font-medium mb-1.5 text-gray-700">
          {titleCase(field.name)}{isRequired ? ' *' : ''}
        </Label>
        <p className="text-xs text-gray-500 mb-2">
          {field.prompt}
        </p>
        {isTextArea ? (
          <Textarea
            id={field.name}
            value={fieldValue}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md text-base min-h-20 resize-y"
            rows={field.name === 'thesis' || field.name === 'rationale' ? 4 : 2}
          />
        ) : (
          <Input
            id={field.name}
            value={fieldValue}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md text-base"
          />
        )}
        {fieldError && <p className="text-red-600 text-xs mt-1">{fieldError}</p>}
        {isTextArea && (
          <div className="flex justify-end mt-1">
            <p className={`text-xs ${getCharacterCountColor(field.name)}`}>
              {getCharacterCount(field.name)}/2000 characters
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {isPositionPlan ? '📝 Position Plan' : '⚡ Trade Execution'}
        </h3>
        <p className="text-sm text-gray-600">
          {isPositionPlan
            ? 'Document your trading plan and mindset before entering this position.'
            : 'Record your observations and lessons from this trade execution.'
          }
        </p>
      </div>

      {/* Dynamic Field Rendering */}
      <div className="space-y-3">
        {fieldDefinitions.map((field, index) => renderField(field, index))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-blue-600 hover:bg-blue-500"
        >
          {isLoading ? 'Saving...' : submitButtonText}
        </Button>
      </div>
    </form>
  )
}