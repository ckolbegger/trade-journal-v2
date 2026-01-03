import type { ChangeEvent } from 'react'

export interface StrategySelectorProps {
  value: 'Long Stock' | 'Short Put'
  onChange: (value: 'Long Stock' | 'Short Put') => void
}

/**
 * Stub StrategySelector component
 * In production, this will be implemented in T014
 */
export function StrategySelector({ value, onChange }: StrategySelectorProps) {
  // Stub implementation - T014 will implement the actual component
  return (
    <label>
      Strategy Type
      <select value={value} onChange={(e) => onChange(e.target.value as 'Long Stock' | 'Short Put')}>
        <option value="Long Stock">Long Stock</option>
        <option value="Short Put">Short Put</option>
      </select>
    </label>
  )
}
