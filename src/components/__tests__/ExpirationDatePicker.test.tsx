import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExpirationDatePicker } from '@/components/ExpirationDatePicker'

describe('ExpirationDatePicker', () => {
  it('[Unit] should render label and input', () => {
    render(
      <ExpirationDatePicker
        value=""
        onChange={vi.fn()}
      />
    )

    expect(screen.getByLabelText(/expiration date/i)).toBeInTheDocument()
  })

  it('[Unit] should call onChange when date changes', () => {
    const onChange = vi.fn()
    render(
      <ExpirationDatePicker
        value=""
        onChange={onChange}
      />
    )

    fireEvent.change(screen.getByLabelText(/expiration date/i), { target: { value: '2099-01-17' } })
    expect(onChange).toHaveBeenCalledWith('2099-01-17')
  })

  it('[Unit] should render error text when provided', () => {
    render(
      <ExpirationDatePicker
        value=""
        onChange={vi.fn()}
        error="Expiration date is required"
      />
    )

    expect(screen.getByText(/expiration date is required/i)).toBeInTheDocument()
  })

  it('[Unit] should default min date to today', () => {
    const today = new Date().toISOString().split('T')[0]
    render(
      <ExpirationDatePicker
        value=""
        onChange={vi.fn()}
      />
    )

    const input = screen.getByLabelText(/expiration date/i)
    expect(input).toHaveAttribute('min', today)
  })
})
