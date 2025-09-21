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

interface FormData {
  content: string
  emotional_state: string
  market_conditions: string
  execution_strategy: string
}

export function EnhancedJournalEntryForm({
  entryType,
  initialFields = [],
  onSave,
  onCancel,
  submitButtonText = 'Save Journal Entry',
  isLoading = false
}: EnhancedJournalEntryFormProps) {
  // Initialize form data from initial fields or empty values
  const getInitialValue = (fieldName: string): string => {
    const field = initialFields.find(f => f.name === fieldName)
    return field?.response || ''
  }

  const [formData, setFormData] = useState<FormData>({
    content: getInitialValue('thesis') || getInitialValue('execution_notes'),
    emotional_state: getInitialValue('emotional_state'),
    market_conditions: getInitialValue('market_conditions'),
    execution_strategy: getInitialValue('execution_strategy')
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.content.trim()) {
      newErrors.content = 'Journal content is required'
    } else if (formData.content.trim().length < 10) {
      newErrors.content = 'Journal content must be at least 10 characters'
    } else if (formData.content.length > 2000) {
      newErrors.content = 'Journal content cannot exceed 2000 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      // Convert structured form data to field-based format
      const prompts = JOURNAL_PROMPTS[entryType]
      const fields: JournalField[] = prompts.map(prompt => {
        let response = ''
        switch (prompt.name) {
          case 'thesis':
          case 'execution_notes':
            response = formData.content
            break
          case 'emotional_state':
            response = formData.emotional_state
            break
          case 'market_conditions':
            response = formData.market_conditions
            break
          case 'execution_strategy':
            response = formData.execution_strategy
            break
          default:
            response = ''
        }

        return {
          name: prompt.name,
          prompt: prompt.prompt,
          response: response.trim()
        }
      })

      onSave(fields)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (field === 'content' && errors.content) {
      setErrors(prev => ({ ...prev, content: '' }))
    }
  }

  const getCharacterCount = () => {
    return formData.content.length
  }

  const getCharacterCountColor = () => {
    const count = getCharacterCount()
    if (count > 1800) return 'text-red-600'
    if (count > 1500) return 'text-yellow-600'
    return 'text-gray-500'
  }

  const isPositionPlan = entryType === 'position_plan'

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

      {/* Main Content Field */}
      <div className="space-y-3">
        <div>
          <Label htmlFor="content" className="block text-sm font-medium mb-1.5 text-gray-700">
            {isPositionPlan ? 'Position Thesis' : 'Trade Notes'} *
          </Label>
          <Textarea
            id="content"
            value={formData.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            placeholder={
              isPositionPlan
                ? 'Why are you planning this position? What\'s your market outlook and strategy?'
                : 'Describe the trade execution, what worked well, what could be improved?'
            }
            className="w-full p-3 border border-gray-300 rounded-md text-base min-h-24 resize-y"
            rows={4}
          />
          {errors.content && <p className="text-red-600 text-xs mt-1">{errors.content}</p>}
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-gray-500">
              {isPositionPlan ? 'Required for every position plan' : 'Required for every trade execution'}
            </p>
            <p className={`text-xs ${getCharacterCountColor()}`}>
              {getCharacterCount()}/2000 characters
            </p>
          </div>
        </div>

        {/* Emotional State */}
        <div>
          <Label htmlFor="emotional_state" className="block text-sm font-medium mb-1.5 text-gray-700">
            {isPositionPlan
              ? 'How are you feeling about this trade? (Optional)'
              : 'How did you feel during execution? (Optional)'
            }
          </Label>
          <Input
            id="emotional_state"
            value={formData.emotional_state}
            onChange={(e) => handleInputChange('emotional_state', e.target.value)}
            placeholder="e.g., Confident, Cautious, Anxious, etc."
            className="w-full p-3 border border-gray-300 rounded-md text-base"
          />
          <p className="text-xs text-gray-500 mt-1">
            {isPositionPlan
              ? 'Describe your emotional state in your own words'
              : 'Describe your emotional state during execution'
            }
          </p>
        </div>

        {/* Market Conditions */}
        <div>
          <Label htmlFor="market_conditions" className="block text-sm font-medium mb-1.5 text-gray-700">
            {isPositionPlan
              ? 'Market Conditions (Optional)'
              : 'Market Conditions During Execution (Optional)'
            }
          </Label>
          <Textarea
            id="market_conditions"
            value={formData.market_conditions}
            onChange={(e) => handleInputChange('market_conditions', e.target.value)}
            placeholder={
              isPositionPlan
                ? 'Describe current market environment and how it affects this trade'
                : 'Describe market conditions when you executed this trade'
            }
            className="w-full p-3 border border-gray-300 rounded-md text-base min-h-20 resize-y"
            rows={2}
          />
          {isPositionPlan && (
            <p className="text-xs text-gray-500 mt-1">Consider volatility, trends, news events</p>
          )}
        </div>

        {/* Execution Strategy/Details */}
        <div>
          <Label htmlFor="execution_strategy" className="block text-sm font-medium mb-1.5 text-gray-700">
            {isPositionPlan
              ? 'Execution Strategy (Optional)'
              : 'Execution Details (Optional)'
            }
          </Label>
          <Textarea
            id="execution_strategy"
            value={formData.execution_strategy}
            onChange={(e) => handleInputChange('execution_strategy', e.target.value)}
            placeholder={
              isPositionPlan
                ? 'How will you enter and exit this position?'
                : 'Fill quality, slippage, timing, any execution challenges?'
            }
            className="w-full p-3 border border-gray-300 rounded-md text-base min-h-20 resize-y"
            rows={2}
          />
          {isPositionPlan && (
            <p className="text-xs text-gray-500 mt-1">Entry timing, order types, exit conditions</p>
          )}
        </div>
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