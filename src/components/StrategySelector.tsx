import type { StrategyType } from '@/lib/position'

interface StrategySelectorProps {
  value: StrategyType
  onChange: (value: StrategyType) => void
}

export function StrategySelector({ value, onChange }: StrategySelectorProps) {
  return (
    <div>
      <label htmlFor="strategy-type">Strategy Type</label>
      <select
        id="strategy-type"
        aria-label="Strategy Type"
        value={value}
        onChange={(e) => onChange(e.target.value as StrategyType)}
      >
        <option value="Long Stock">Long Stock</option>
        <option value="Short Put">Short Put</option>
      </select>
    </div>
  )
}
