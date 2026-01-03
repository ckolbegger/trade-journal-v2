import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PriceBasisSelector } from '../PriceBasisSelector';

describe('PriceBasisSelector', () => {
  it('renders radio buttons for stock and option', () => {
    const mockOnChange = vi.fn();
    render(<PriceBasisSelector value={undefined} onChange={mockOnChange} />);

    expect(screen.getByRole('radio', { name: /stock/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /option/i })).toBeInTheDocument();
  });

  it('calls onChange with selected basis when user clicks a radio button', () => {
    const mockOnChange = vi.fn();
    render(<PriceBasisSelector value={undefined} onChange={mockOnChange} />);

    const stockRadio = screen.getByRole('radio', { name: /stock/i });
    fireEvent.click(stockRadio);

    expect(mockOnChange).toHaveBeenCalledWith('stock');
  });

  it('calls onChange with option basis when option is selected', () => {
    const mockOnChange = vi.fn();
    render(<PriceBasisSelector value={undefined} onChange={mockOnChange} />);

    const optionRadio = screen.getByRole('radio', { name: /option/i });
    fireEvent.click(optionRadio);

    expect(mockOnChange).toHaveBeenCalledWith('option');
  });

  it('defaults to no selection when value is undefined', () => {
    const mockOnChange = vi.fn();
    render(<PriceBasisSelector value={undefined} onChange={mockOnChange} />);

    const stockRadio = screen.getByRole('radio', { name: /stock/i }) as HTMLInputElement;
    const optionRadio = screen.getByRole('radio', { name: /option/i }) as HTMLInputElement;

    expect(stockRadio.checked).toBe(false);
    expect(optionRadio.checked).toBe(false);
  });

  it('ensures radio buttons are mutually exclusive', () => {
    const mockOnChange = vi.fn();
    const { rerender } = render(<PriceBasisSelector value={undefined} onChange={mockOnChange} />);

    const stockRadio = screen.getByRole('radio', { name: /stock/i }) as HTMLInputElement;
    const optionRadio = screen.getByRole('radio', { name: /option/i }) as HTMLInputElement;

    // Initially unchecked
    expect(stockRadio.checked).toBe(false);
    expect(optionRadio.checked).toBe(false);

    // Select stock
    rerender(<PriceBasisSelector value="stock" onChange={mockOnChange} />);
    expect(stockRadio.checked).toBe(true);
    expect(optionRadio.checked).toBe(false);

    // Select option
    rerender(<PriceBasisSelector value="option" onChange={mockOnChange} />);
    expect(stockRadio.checked).toBe(false);
    expect(optionRadio.checked).toBe(true);
  });

  it('reflects the current value prop in the selected radio button', () => {
    const mockOnChange = vi.fn();
    render(<PriceBasisSelector value="stock" onChange={mockOnChange} />);

    const stockRadio = screen.getByRole('radio', { name: /stock/i }) as HTMLInputElement;
    const optionRadio = screen.getByRole('radio', { name: /option/i }) as HTMLInputElement;

    expect(stockRadio.checked).toBe(true);
    expect(optionRadio.checked).toBe(false);
  });
});
