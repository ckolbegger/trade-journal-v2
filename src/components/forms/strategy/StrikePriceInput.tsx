import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export interface StrikePriceInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
  id?: string
  className?: string
  placeholder?: string
  required?: boolean
}

/**
 * Stub StrikePriceInput component
 * In production, this will be implemented in T016
 */
export function StrikePriceInput({
  value,
  onChange,
  error,
  id = 'strike_price',
  className = '',
  placeholder = '0.00',
  required = false
}: StrikePriceInputProps) {
  // Stub implementation - T016 will implement the actual component
  const inputWrapperClass = className || 'relative'
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="block text-sm font-medium mb-1.5 text-gray-700">
        Strike Price {required && '*'}
      </Label>
      <div className={inputWrapperClass}>
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
        <Input
          id={id}
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`pl-7 ${error ? 'border-red-600' : ''}`}
        />
      </div>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  )
}
