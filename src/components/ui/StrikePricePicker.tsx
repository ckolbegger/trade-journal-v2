import React, { useState, useEffect, useRef } from 'react'

interface StrikePricePickerProps {
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
}

const formatStrikePrice = (input: string): string => {
  const numericValue = input.replace(/[^0-9.]/g, '')
  
  const parts = numericValue.split('.')
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('')
  }
  
  let formatted = parts[0]
  if (parts.length === 2) {
    formatted += '.' + parts[1].slice(0, 4)
  }
  
  if (formatted === '') return ''
  
  const numValue = parseFloat(formatted)
  if (isNaN(numValue)) return ''
  
  if (formatted.includes('.')) {
    const [whole, decimal] = formatted.split('.')
    const paddedDecimal = decimal.padEnd(2, '0')
    return `$${whole}.${paddedDecimal}`
  }
  
  return `$${formatted}.00`
}

export const StrikePricePicker: React.FC<StrikePricePickerProps> = ({
  value,
  onChange,
  error,
  disabled
}) => {
  const [displayValue, setDisplayValue] = useState('')
  const [localError, setLocalError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (value === '') {
      setDisplayValue('')
    } else {
      setDisplayValue(formatStrikePrice(value))
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    
    const rawValue = e.target.value
    
    if (rawValue === '') {
      onChange('')
      setLocalError('')
      return
    }
    
    const numericOnly = rawValue.replace(/[^0-9.-]/g, '')
    
    if (numericOnly === '') {
      return
    }
    
    const parts = numericOnly.split('.')
    if (parts.length > 2) {
      return
    }
    
    let valueToUse = numericOnly
    if (parts[1] && parts[1].length > 4) {
      valueToUse = parts[0] + '.' + parts[1].slice(0, 4)
    }
    
    const numValue = parseFloat(valueToUse)
    if (isNaN(numValue)) {
      return
    }

    if (numValue < 0) {
      setLocalError('Strike price must be positive')
      const filteredValue = valueToUse.replace(/-/g, '')
      onChange(filteredValue)
      return
    }
    
    setLocalError('')
    onChange(valueToUse)
  }

  const handleBlur = () => {
    if (value === '') {
      setLocalError('')
      return
    }
    
    const num = parseFloat(value)
    if (isNaN(num)) {
      setLocalError('Invalid strike price')
    } else if (num < 0) {
      setLocalError('Strike price must be positive')
    } else {
      setLocalError('')
    }
  }

  const handleReset = () => {
    if (disabled) return
    onChange('')
    setLocalError('')
    inputRef.current?.focus()
  }

  const getInputClassName = (): string => {
    const baseClass = 'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 placeholder-gray-400'
    
    if (error || localError) {
      return `${baseClass} border-red-500 focus:ring-red-200`
    }
    
    return `${baseClass} border-gray-300 focus:ring-blue-200 focus:border-blue-500`
  }

  return (
    <div className="strike-price-picker">
      <label htmlFor="strike-price-input" className="block text-sm font-medium text-gray-700 mb-1">
        Strike Price
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id="strike-price-input"
          type="text"
          inputMode="decimal"
          className={getInputClassName()}
          placeholder="$0.00"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          aria-label="Strike Price"
          aria-invalid={!!(error || localError)}
          aria-describedby={error || localError ? 'strike-price-error' : undefined}
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={handleReset}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear strike price"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {(error || localError) && (
        <p id="strike-price-error" className="mt-1 text-sm text-red-600" role="alert">
          {error || localError}
        </p>
      )}
    </div>
  )
}
