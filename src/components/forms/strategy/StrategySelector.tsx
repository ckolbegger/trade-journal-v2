import { Label } from '@/components/ui/label'

export interface StrategySelectorProps {
  value: 'Long Stock' | 'Short Put'
  onChange: (value: 'Long Stock' | 'Short Put') => void
  id?: string
  className?: string
}

/**
 * StrategySelector component - Dropdown for selecting position strategy type
 *
 * Allows users to choose between 'Long Stock' and 'Short Put' strategies.
 * Future-proof design can accommodate additional option strategies.
 */
export function StrategySelector({ value, onChange, id = 'strategy_type', className = '' }: StrategySelectorProps) {
  return (
    <div className={className}>
      <Label htmlFor={id} className="block text-sm font-medium mb-1.5 text-gray-700">
        Strategy Type *
      </Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as 'Long Stock' | 'Short Put')}
        className="w-full p-3 border border-gray-300 rounded-md text-base bg-white"
      >
        <option value="Long Stock">Long Stock</option>
        <option value="Short Put">Short Put</option>
      </select>
    </div>
  )
}
