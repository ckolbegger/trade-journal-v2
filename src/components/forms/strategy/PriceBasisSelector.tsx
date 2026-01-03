import { Label } from '@/components/ui/label'

export interface PriceBasisSelectorProps {
  value: 'stock_price' | 'option_price'
  onChange: (value: 'stock_price' | 'option_price') => void
  label?: string
  id?: string
  className?: string
  disabled?: boolean
}

/**
 * Stub PriceBasisSelector component
 * In production, this will be implemented in T020
 */
export function PriceBasisSelector({
  value,
  onChange,
  label = 'Price Basis',
  id = 'price_basis',
  className = '',
  disabled = false
}: PriceBasisSelectorProps) {
  // Stub implementation - T020 will implement the actual component
  return (
    <div className={className}>
      <Label htmlFor={id} className="block text-sm font-medium mb-1.5 text-gray-700">
        {label}
      </Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as 'stock_price' | 'option_price')}
        disabled={disabled}
        className="w-full p-3 border border-gray-300 rounded-md text-base bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="stock_price">Stock Price</option>
        <option value="option_price">Option Premium</option>
      </select>
    </div>
  )
}
