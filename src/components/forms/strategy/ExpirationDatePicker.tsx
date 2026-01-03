import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export interface ExpirationDatePickerProps {
  value: string
  onChange: (value: string) => void
  error?: string
  id?: string
  className?: string
  required?: boolean
}

/**
 * Stub ExpirationDatePicker component
 * In production, this will be implemented in T018
 */
export function ExpirationDatePicker({
  value,
  onChange,
  error,
  id = 'expiration_date',
  className = '',
  required = false
}: ExpirationDatePickerProps) {
  // Calculate min date (today) to prevent past dates
  const today = new Date().toISOString().split('T')[0]

  // Stub implementation - T018 will implement the actual component
  return (
    <div className={className}>
      <Label htmlFor={id} className="block text-sm font-medium mb-1.5 text-gray-700">
        Expiration Date {required && '*'}
      </Label>
      <Input
        id={id}
        type="date"
        min={today}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full p-3 border border-gray-300 rounded-md text-base ${error ? 'border-red-600' : ''}`}
      />
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  )
}
