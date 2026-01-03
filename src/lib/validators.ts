import type { Position } from './position'

export interface ValidationResult {
  isValid: boolean
  error?: string
}

export function validateSymbol(input: string): ValidationResult {
  if (!input || input.trim() === '') {
    return { isValid: false, error: 'Symbol is required' }
  }

  const trimmed = input.trim().toUpperCase()

  if (!/^[A-Z]+$/.test(trimmed)) {
    return { isValid: false, error: 'Symbol must contain only letters A-Z' }
  }

  if (trimmed.length < 1 || trimmed.length > 5) {
    return { isValid: false, error: 'Symbol must be 1-5 characters' }
  }

  return { isValid: true }
}

export function validateExpirationDate(date: Date): ValidationResult {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return { isValid: false, error: 'Invalid date format' }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const expirationDate = new Date(date)
  expirationDate.setHours(0, 0, 0, 0)

  if (expirationDate < today) {
    return { isValid: false, error: 'Expiration date must be in the future' }
  }

  return { isValid: true }
}

export function validateStrikePrice(price: number): ValidationResult {
  if (typeof price !== 'number' || isNaN(price)) {
    return { isValid: false, error: 'Strike price must be a number' }
  }

  if (price <= 0) {
    return { isValid: false, error: 'Strike price must be positive' }
  }

  if (price > 1000000) {
    return { isValid: false, error: 'Strike price seems unreasonably high' }
  }

  const decimals = price.toString().split('.')[1]
  if (decimals && decimals.length > 2) {
    return { isValid: false, error: 'Strike price cannot have more than 2 decimal places' }
  }

  return { isValid: true }
}

export function validateQuantity(qty: number): ValidationResult {
  if (typeof qty !== 'number' || isNaN(qty)) {
    return { isValid: false, error: 'Quantity must be a number' }
  }

  if (!Number.isInteger(qty)) {
    return { isValid: false, error: 'Quantity must be a whole number' }
  }

  if (qty <= 0) {
    return { isValid: false, error: 'Quantity must be positive' }
  }

  if (qty > 10000) {
    return { isValid: false, error: 'Quantity seems unreasonably high' }
  }

  return { isValid: true }
}

export function validateOptionPosition(position: Position): ValidationResult {
  if (position.strategy_type !== 'Short Put') {
    return { isValid: true }
  }

  if (!position.option_type || (position.option_type !== 'call' && position.option_type !== 'put')) {
    return { isValid: false, error: 'Option type (call/put) is required for Short Put positions' }
  }

  if (position.strike_price === undefined || position.strike_price === null) {
    return { isValid: false, error: 'Strike price is required for Short Put positions' }
  }

  const strikeResult = validateStrikePrice(position.strike_price)
  if (!strikeResult.isValid) {
    return strikeResult
  }

  if (!position.expiration_date) {
    return { isValid: false, error: 'Expiration date is required for Short Put positions' }
  }

  const expirationResult = validateExpirationDate(position.expiration_date)
  if (!expirationResult.isValid) {
    return expirationResult
  }

  if (position.premium_per_contract === undefined || position.premium_per_contract === null) {
    return { isValid: false, error: 'Premium per contract is required for Short Put positions' }
  }

  if (typeof position.premium_per_contract !== 'number' || isNaN(position.premium_per_contract)) {
    return { isValid: false, error: 'Premium per contract must be a number' }
  }

  if (position.premium_per_contract < 0) {
    return { isValid: false, error: 'Premium per contract cannot be negative' }
  }

  return { isValid: true }
}
