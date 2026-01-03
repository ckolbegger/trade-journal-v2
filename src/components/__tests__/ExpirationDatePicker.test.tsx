import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExpirationDatePicker } from '../ExpirationDatePicker';

describe('ExpirationDatePicker', () => {
  it('renders date input', () => {
    const handleChange = vi.fn();
    const testDate = new Date('2026-03-21');
    render(<ExpirationDatePicker value={testDate} onChange={handleChange} />);

    const input = screen.getByLabelText(/expiration date/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'date');
  });

  it('accepts future dates', () => {
    const handleChange = vi.fn();
    const testDate = new Date('2026-03-21');
    render(<ExpirationDatePicker value={testDate} onChange={handleChange} />);

    const input = screen.getByLabelText(/expiration date/i);
    // Future date: one month from now
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 1);
    const futureDateString = futureDate.toISOString().split('T')[0];

    fireEvent.change(input, { target: { value: futureDateString } });

    expect(handleChange).toHaveBeenCalledWith(expect.any(Date));
    const calledDate = handleChange.mock.calls[0][0];
    expect(calledDate.toISOString().split('T')[0]).toBe(futureDateString);
  });

  it('calls onChange with Date object', () => {
    const handleChange = vi.fn();
    const testDate = new Date('2026-03-21');
    render(<ExpirationDatePicker value={testDate} onChange={handleChange} />);

    const input = screen.getByLabelText(/expiration date/i);
    fireEvent.change(input, { target: { value: '2026-06-19' } });

    expect(handleChange).toHaveBeenCalledWith(expect.any(Date));
    expect(handleChange).toHaveBeenCalledTimes(1);
    const calledDate = handleChange.mock.calls[0][0];
    expect(calledDate).toBeInstanceOf(Date);
  });

  it('validates future date only', () => {
    const handleChange = vi.fn();
    const testDate = new Date('2026-03-21');
    render(<ExpirationDatePicker value={testDate} onChange={handleChange} />);

    const input = screen.getByLabelText(/expiration date/i);
    // The min attribute should be set to today's date
    const today = new Date().toISOString().split('T')[0];
    expect(input).toHaveAttribute('min', today);
  });

  it('shows validation error for past dates', () => {
    const handleChange = vi.fn();
    const testDate = new Date('2026-03-21');
    const error = 'Expiration date must be in the future';
    render(<ExpirationDatePicker value={testDate} onChange={handleChange} error={error} />);

    const errorMessage = screen.getByText(/expiration date must be in the future/i);
    expect(errorMessage).toBeInTheDocument();
  });
});
