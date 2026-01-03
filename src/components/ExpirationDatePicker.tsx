import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ExpirationDatePickerProps {
  id?: string
  label?: string
  value: string
  onChange: (value: string) => void
  error?: string
  min?: string
  disabled?: boolean
}

const getTodayInputValue = () => new Date().toISOString().split('T')[0]

export function ExpirationDatePicker({
  id = 'expiration_date',
  label = 'Expiration Date *',
  value,
  onChange,
  error,
  min,
  disabled = false
}: ExpirationDatePickerProps) {
  const minDate = min ?? getTodayInputValue()

  return (
    <div>
      <Label htmlFor={id} className="block text-sm font-medium mb-1.5 text-gray-700">
        {label}
      </Label>
      <Input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-md text-base"
        min={minDate}
        disabled={disabled}
      />
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  )
}
