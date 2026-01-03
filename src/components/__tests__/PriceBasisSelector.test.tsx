import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PriceBasisSelector } from '../PriceBasisSelector';

describe('PriceBasisSelector', () => {
  it('renders radio buttons for stock and option', () => {
    const mockOnChange = vi.fn();
    render(<PriceBasisSelector name="test-basis" value={undefined} onChange={mockOnChange} />);

    expect(screen.getByRole('radio', { name: /stock/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /option/i })).toBeInTheDocument();
  });

  it('calls onChange with selected basis when user clicks a radio button', () => {
    const mockOnChange = vi.fn();
    render(<PriceBasisSelector name="test-basis" value={undefined} onChange={mockOnChange} />);

    const stockRadio = screen.getByRole('radio', { name: /stock/i });
    fireEvent.click(stockRadio);

    expect(mockOnChange).toHaveBeenCalledWith('stock');
  });

  it('calls onChange with option basis when option is selected', () => {
    const mockOnChange = vi.fn();
    render(<PriceBasisSelector name="test-basis" value={undefined} onChange={mockOnChange} />);

    const optionRadio = screen.getByRole('radio', { name: /option/i });
    fireEvent.click(optionRadio);

    expect(mockOnChange).toHaveBeenCalledWith('option');
  });

  it('defaults to no selection when value is undefined', () => {
    const mockOnChange = vi.fn();
    render(<PriceBasisSelector name="test-basis" value={undefined} onChange={mockOnChange} />);

    const stockRadio = screen.getByRole('radio', { name: /stock/i }) as HTMLInputElement;
    const optionRadio = screen.getByRole('radio', { name: /option/i }) as HTMLInputElement;

    expect(stockRadio.checked).toBe(false);
    expect(optionRadio.checked).toBe(false);
  });

  it('ensures radio buttons are mutually exclusive', () => {
    const mockOnChange = vi.fn();
    const { rerender } = render(<PriceBasisSelector name="test-basis" value={undefined} onChange={mockOnChange} />);

    const stockRadio = screen.getByRole('radio', { name: /stock/i }) as HTMLInputElement;
    const optionRadio = screen.getByRole('radio', { name: /option/i }) as HTMLInputElement;

    // Initially unchecked
    expect(stockRadio.checked).toBe(false);
    expect(optionRadio.checked).toBe(false);

    // Select stock
    rerender(<PriceBasisSelector name="test-basis" value="stock" onChange={mockOnChange} />);
    expect(stockRadio.checked).toBe(true);
    expect(optionRadio.checked).toBe(false);

    // Select option
    rerender(<PriceBasisSelector name="test-basis" value="option" onChange={mockOnChange} />);
    expect(stockRadio.checked).toBe(false);
    expect(optionRadio.checked).toBe(true);
  });

  it('reflects the current value prop in the selected radio button', () => {
    const mockOnChange = vi.fn();
    render(<PriceBasisSelector name="test-basis" value="stock" onChange={mockOnChange} />);

    const stockRadio = screen.getByRole('radio', { name: /stock/i }) as HTMLInputElement;
    const optionRadio = screen.getByRole('radio', { name: /option/i }) as HTMLInputElement;

    expect(stockRadio.checked).toBe(true);
    expect(optionRadio.checked).toBe(false);
  });

  it('allows multiple independent instances with unique radio groups via name prop', () => {
    const mockOnChangeProfit = vi.fn();
    const mockOnChangeStop = vi.fn();

    render(
      <div>
        <PriceBasisSelector
          name="profit-target-basis"
          value="stock"
          onChange={mockOnChangeProfit}
        />
        <PriceBasisSelector
          name="stop-loss-basis"
          value="option"
          onChange={mockOnChangeStop}
        />
      </div>
    );

    // Get all radio buttons
    const allRadios = screen.getAllByRole('radio') as HTMLInputElement[];

    // First instance should have "profit-target-basis" name and "stock" checked
    const profitStockRadio = allRadios.find(r => r.name === 'profit-target-basis' && r.value === 'stock');
    const profitOptionRadio = allRadios.find(r => r.name === 'profit-target-basis' && r.value === 'option');

    // Second instance should have "stop-loss-basis" name and "option" checked
    const stopStockRadio = allRadios.find(r => r.name === 'stop-loss-basis' && r.value === 'stock');
    const stopOptionRadio = allRadios.find(r => r.name === 'stop-loss-basis' && r.value === 'option');

    // Verify both selections are independent
    expect(profitStockRadio?.checked).toBe(true);
    expect(profitOptionRadio?.checked).toBe(false);
    expect(stopStockRadio?.checked).toBe(false);
    expect(stopOptionRadio?.checked).toBe(true);
  });
});
