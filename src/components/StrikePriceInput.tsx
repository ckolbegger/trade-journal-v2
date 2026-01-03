import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface StrikePriceInputProps {
  id?: string
  label?: string
  value: string
  onChange: (value: string) => void
  error?: string
  suggestedStrikes?: number[]
  disabled?: boolean
}

export function StrikePriceInput({
  id = 'strike_price',
  label = 'Strike Price *',
  value,
  onChange,
  error,
  disabled = false
}: StrikePriceInputProps) {
  return (
    <div>
      <Label htmlFor={id} className="block text-sm font-medium mb-1.5 text-gray-700">
        {label}
      </Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
        <Input
          id={id}
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0.00"
          className="w-full p-3 pl-7 border border-gray-300 rounded-md text-base"
          disabled={disabled}
        />
      </div>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  )
}
