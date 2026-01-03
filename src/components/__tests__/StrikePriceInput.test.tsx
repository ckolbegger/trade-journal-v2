import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StrikePriceInput } from '../StrikePriceInput';

describe('StrikePriceInput', () => {
  it('renders number input for strike price', () => {
    const handleChange = vi.fn();
    render(<StrikePriceInput value={100} onChange={handleChange} />);

    const input = screen.getByLabelText(/strike price/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'number');
  });

  it('accepts decimal values', () => {
    const handleChange = vi.fn();
    render(<StrikePriceInput value={0} onChange={handleChange} />);

    const input = screen.getByLabelText(/strike price/i);
    fireEvent.change(input, { target: { value: '45.50' } });

    expect(handleChange).toHaveBeenCalledWith(45.50);
  });

  it('calls onChange with parsed number', () => {
    const handleChange = vi.fn();
    render(<StrikePriceInput value={0} onChange={handleChange} />);

    const input = screen.getByLabelText(/strike price/i);
    fireEvent.change(input, { target: { value: '123.45' } });

    expect(handleChange).toHaveBeenCalledWith(123.45);
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('validates minimum value > 0', () => {
    const handleChange = vi.fn();
    render(<StrikePriceInput value={0} onChange={handleChange} />);

    const input = screen.getByLabelText(/strike price/i);
    expect(input).toHaveAttribute('min', '0.01');
  });

  it('shows validation error for invalid input', () => {
    const handleChange = vi.fn();
    render(<StrikePriceInput value={-5} onChange={handleChange} error="Strike price must be greater than 0" />);

    const errorMessage = screen.getByText(/strike price must be greater than 0/i);
    expect(errorMessage).toBeInTheDocument();
  });
});
