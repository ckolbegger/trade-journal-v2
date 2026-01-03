import React, { useState, useEffect, useRef } from 'react'

interface ExpirationDatePickerProps {
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
}

const formatDateForDisplay = (dateStr: string): string => {
  if (!dateStr) return ''

  const parts = dateStr.split('-')
  if (parts.length !== 3) return ''

  const year = parts[0]
  const month = parts[1].padStart(2, '0')
  const day = parts[2].padStart(2, '0')

  return `${month}/${day}/${year}`
}

const parseDateInput = (input: string): string | null => {
  const isoMatch = input.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    const [, year, month, day] = isoMatch
    return `${year}-${month}-${day}`
  }

  const usMatch = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!usMatch) return null

  const [, monthStr, dayStr, yearStr] = usMatch
  const month = parseInt(monthStr, 10)
  const day = parseInt(dayStr, 10)
  const year = parseInt(yearStr, 10)

  if (month < 1 || month > 12) return null
  if (day < 1 || day > 31) return null
  if (year < 1900 || year > 2100) return null

  const maxDays = new Date(year, month, 0).getDate()
  if (day > maxDays) return null

  const formattedMonth = month.toString().padStart(2, '0')
  const formattedDay = day.toString().padStart(2, '0')

  return `${year}-${formattedMonth}-${formattedDay}`
}

const isDateInPast = (dateStr: string): boolean => {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  return dateStr < todayStr
}

const isDateBeforeMinDate = (dateStr: string, minDate?: Date): boolean => {
  if (!minDate) return false
  const minDateStr = minDate.toISOString().split('T')[0]
  return dateStr < minDateStr
}

const isDateAfterMaxDate = (dateStr: string, maxDate?: Date): boolean => {
  if (!maxDate) return false

  const maxDateStr = maxDate.toISOString().split('T')[0]
  return dateStr > maxDateStr
}

export const ExpirationDatePicker: React.FC<ExpirationDatePickerProps> = ({
  value,
  onChange,
  error,
  disabled,
  minDate,
  maxDate
}) => {
  const [displayValue, setDisplayValue] = useState('')
  const [localError, setLocalError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const lastEmittedValueRef = useRef<string>('')

  useEffect(() => {
    if (value === '') {
      setDisplayValue('')
    } else {
      setDisplayValue(formatDateForDisplay(value))
    }
  }, [value])

  useEffect(() => {
    lastEmittedValueRef.current = value
  }, [value])

  const validateDate = (dateStr: string): string => {
    if (!dateStr) return ''

    if (isDateInPast(dateStr)) {
      return 'Expiration date cannot be in the past'
    }

    if (isDateBeforeMinDate(dateStr, minDate)) {
      const minFormatted = minDate ? formatDateForDisplay(minDate.toISOString().split('T')[0]) : ''
      return `Date must be on or after ${minFormatted}`
    }

    if (isDateAfterMaxDate(dateStr, maxDate)) {
      const maxFormatted = maxDate ? formatDateForDisplay(maxDate.toISOString().split('T')[0]) : ''
      return `Date must be on or before ${maxFormatted}`
    }

    return ''
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return

    const rawValue = e.target.value

    if (rawValue === '') {
      onChange('')
      setDisplayValue('')
      setLocalError('')
      return
    }

    const parsed = parseDateInput(rawValue)

    if (!parsed) {
      setLocalError('Invalid date format. Please use MM/DD/YYYY')
      setDisplayValue(rawValue)
      return
    }

    setLocalError('')
    setDisplayValue(rawValue)
    onChange(parsed)
  }

  const handleBlur = () => {
    if (displayValue === '') {
      setLocalError('')
      return
    }

    const parsed = parseDateInput(displayValue)

    if (!parsed) {
      setLocalError('Invalid date format. Please use MM/DD/YYYY')
      return
    }

    const validationError = validateDate(parsed)
    setLocalError(validationError)
  }

  const handleReset = () => {
    if (disabled) return
    onChange('')
    setDisplayValue('')
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

  const formatMinDate = (): string => {
    if (!minDate) return ''
    const dateStr = minDate.toISOString().split('T')[0]
    return formatDateForDisplay(dateStr)
  }

  const formatMaxDate = (): string => {
    if (!maxDate) return ''
    const dateStr = maxDate.toISOString().split('T')[0]
    return formatDateForDisplay(dateStr)
  }

  const minDateDisplay = formatMinDate()
  const maxDateDisplay = formatMaxDate()

  return (
    <div className="expiration-date-picker">
      <label htmlFor="expiration-date-input" className="block text-sm font-medium text-gray-700 mb-1">
        Expiration Date
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id="expiration-date-input"
          type="text"
          inputMode="numeric"
          className={getInputClassName()}
          placeholder="MM/DD/YYYY"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          aria-label="Expiration Date"
          aria-invalid={!!(error || localError)}
          aria-describedby={error || localError ? 'expiration-date-error' : undefined}
        />
        {displayValue && !disabled && (
          <button
            type="button"
            onClick={handleReset}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear expiration date"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {(error || localError) && (
        <p id="expiration-date-error" className="mt-1 text-sm text-red-600" role="alert">
          {error || localError}
        </p>
      )}
      {!error && !localError && (minDateDisplay || maxDateDisplay) && (
        <p className="mt-1 text-xs text-gray-500">
          {minDateDisplay && `Min: ${minDateDisplay}`}
          {minDateDisplay && maxDateDisplay && ' | '}
          {maxDateDisplay && `Max: ${maxDateDisplay}`}
        </p>
      )}
    </div>
  )
}
