import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StrikePriceInput } from '@/components/StrikePriceInput'

describe('StrikePriceInput', () => {
  it('[Unit] should render label and input', () => {
    render(
      <StrikePriceInput
        value=""
        onChange={vi.fn()}
      />
    )

    expect(screen.getByLabelText(/strike price/i)).toBeInTheDocument()
  })

  it('[Unit] should call onChange when typing', () => {
    const onChange = vi.fn()
    render(
      <StrikePriceInput
        value=""
        onChange={onChange}
      />
    )

    fireEvent.change(screen.getByLabelText(/strike price/i), { target: { value: '105' } })
    expect(onChange).toHaveBeenCalledWith('105')
  })

  it('[Unit] should display error text when provided', () => {
    render(
      <StrikePriceInput
        value=""
        onChange={vi.fn()}
        error="Strike price is required"
      />
    )

    expect(screen.getByText(/strike price is required/i)).toBeInTheDocument()
  })

  it('[Unit] should render suggested strike buttons and apply selection', () => {
    const onChange = vi.fn()
    render(
      <StrikePriceInput
        value=""
        onChange={onChange}
        suggestedStrikes={[95, 100, 105]}
      />
    )

    const pickButton = screen.getByRole('button', { name: /\$100\.00/i })
    fireEvent.click(pickButton)
    expect(onChange).toHaveBeenCalledWith('100.00')
  })
})
