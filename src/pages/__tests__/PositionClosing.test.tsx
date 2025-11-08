import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PositionClosing from '../PositionClosing';
import type { Position } from '@/lib/position';
import type { PriceHistory } from '@/types/priceHistory';

// Mock position data
const mockPosition: Position = {
  id: 'test-position-1',
  symbol: 'AAPL',
  strategy_type: 'Long Stock',
  target_entry_price: 150,
  target_quantity: 100,
  profit_target: 165,
  stop_loss: 135,
  position_thesis: 'Test thesis',
  status: 'open',
  created_date: new Date('2024-01-15'),
  journal_entry_ids: [],
  trades: [
    {
      id: 'trade-1',
      position_id: 'test-position-1',
      trade_type: 'buy',
      quantity: 100,
      price: 149.50,
      execution_date: new Date('2024-01-15'),
      timestamp: new Date('2024-01-15'),
      underlying: 'AAPL',
    },
  ],
};

const mockCurrentPrice: PriceHistory = {
  underlying: 'AAPL',
  date: '2024-01-27',
  close: 165.05,
  open: 164.50,
  high: 165.50,
  low: 164.00,
  updated_at: new Date('2024-01-27'),
};

describe('PositionClosing Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('renders position closing page with header', () => {
      render(
        <BrowserRouter>
          <PositionClosing />
        </BrowserRouter>
      );

      expect(screen.getByText('Close Position')).toBeInTheDocument();
    });

    it('renders step indicator with 4 dots', () => {
      render(
        <BrowserRouter>
          <PositionClosing />
        </BrowserRouter>
      );

      const stepDots = screen.getAllByTestId(/^step-dot-/);
      expect(stepDots).toHaveLength(4);
    });

    it('shows first step as active by default', () => {
      render(
        <BrowserRouter>
          <PositionClosing />
        </BrowserRouter>
      );

      const firstDot = screen.getByTestId('step-dot-1');
      expect(firstDot).toHaveClass('active');
    });

    it('renders bottom action buttons', () => {
      render(
        <BrowserRouter>
          <PositionClosing />
        </BrowserRouter>
      );

      expect(screen.getByText('Continue')).toBeInTheDocument();
    });
  });

  describe('Step Navigation', () => {
    it('hides back button on step 1', () => {
      render(
        <BrowserRouter>
          <PositionClosing />
        </BrowserRouter>
      );

      const backButton = screen.queryByText('Back');
      expect(backButton).not.toBeInTheDocument();
    });

    it('advances to step 2 when continue clicked', async () => {
      render(
        <BrowserRouter>
          <PositionClosing />
        </BrowserRouter>
      );

      const continueButton = screen.getByText('Continue');
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('Why Are You Closing?')).toBeInTheDocument();
      });
    });

    it('shows back button on step 2', async () => {
      render(
        <BrowserRouter>
          <PositionClosing />
        </BrowserRouter>
      );

      // Advance to step 2
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const backButton = screen.getByText('Back');
        expect(backButton).toBeVisible();
      });
    });

    it('goes back to step 1 when back button clicked', async () => {
      render(
        <BrowserRouter>
          <PositionClosing />
        </BrowserRouter>
      );

      // Advance to step 2
      fireEvent.click(screen.getByText('Continue'));
      await waitFor(() => screen.getByText('Why Are You Closing?'));

      // Go back
      fireEvent.click(screen.getByText('Back'));

      await waitFor(() => {
        expect(screen.getByText('Closing Details')).toBeInTheDocument();
      });
    });

    it('updates step dots as user navigates', async () => {
      render(
        <BrowserRouter>
          <PositionClosing />
        </BrowserRouter>
      );

      // Step 1 active
      expect(screen.getByTestId('step-dot-1')).toHaveClass('active');

      // Advance to step 2
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        expect(screen.getByTestId('step-dot-1')).toHaveClass('completed');
        expect(screen.getByTestId('step-dot-2')).toHaveClass('active');
      });
    });

    it('changes header title for each step', async () => {
      render(
        <BrowserRouter>
          <PositionClosing />
        </BrowserRouter>
      );

      expect(screen.getByText('Close Position')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        expect(screen.getByText('Closing Reason')).toBeInTheDocument();
      });
    });
  });

  describe('Step 1: Closing Details', () => {
    it('renders step 1 title and description', () => {
      render(
        <BrowserRouter>
          <PositionClosing />
        </BrowserRouter>
      );

      expect(screen.getByText('Closing Details')).toBeInTheDocument();
      expect(
        screen.getByText(/Enter the details of how you're closing this position/)
      ).toBeInTheDocument();
    });

    it('renders position summary card with P&L', () => {
      render(
        <BrowserRouter>
          <PositionClosing />
        </BrowserRouter>
      );

      // Should show symbol and position type
      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText(/Long Stock/)).toBeInTheDocument();
    });

    it('renders exit price input field', () => {
      render(
        <BrowserRouter>
          <PositionClosing />
        </BrowserRouter>
      );

      const exitPriceInput = screen.getByLabelText(/Exit Price/);
      expect(exitPriceInput).toBeInTheDocument();
      expect(exitPriceInput).toHaveAttribute('type', 'number');
    });

    it('renders quantity input field', () => {
      render(
        <BrowserRouter>
          <PositionClosing />
        </BrowserRouter>
      );

      const quantityInput = screen.getByLabelText(/Quantity/);
      expect(quantityInput).toBeInTheDocument();
      expect(quantityInput).toHaveAttribute('type', 'number');
    });

    it('renders exit date input field', () => {
      render(
        <BrowserRouter>
          <PositionClosing />
        </BrowserRouter>
      );

      const dateInput = screen.getByLabelText(/Exit Date/);
      expect(dateInput).toBeInTheDocument();
      expect(dateInput).toHaveAttribute('type', 'date');
    });

    it('pre-fills exit price with current price', () => {
      render(
        <BrowserRouter>
          <PositionClosing />
        </BrowserRouter>
      );

      const exitPriceInput = screen.getByLabelText(/Exit Price/) as HTMLInputElement;
      expect(exitPriceInput.value).toBeTruthy();
    });

    it('pre-fills quantity with position quantity', () => {
      render(
        <BrowserRouter>
          <PositionClosing />
        </BrowserRouter>
      );

      const quantityInput = screen.getByLabelText(/Quantity/) as HTMLInputElement;
      expect(quantityInput.value).toBeTruthy();
    });

    it('pre-fills exit date with today', () => {
      render(
        <BrowserRouter>
          <PositionClosing />
        </BrowserRouter>
      );

      const dateInput = screen.getByLabelText(/Exit Date/) as HTMLInputElement;
      expect(dateInput.value).toBeTruthy();
    });

    it('validates exit price is required', async () => {
      render(
        <BrowserRouter>
          <PositionClosing />
        </BrowserRouter>
      );

      const exitPriceInput = screen.getByLabelText(/Exit Price/);
      fireEvent.change(exitPriceInput, { target: { value: '' } });

      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        expect(screen.getByText(/Exit price is required/)).toBeInTheDocument();
      });
    });

    it('validates quantity is required', async () => {
      render(
        <BrowserRouter>
          <PositionClosing />
        </BrowserRouter>
      );

      const quantityInput = screen.getByLabelText(/Quantity/);
      fireEvent.change(quantityInput, { target: { value: '' } });

      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        expect(screen.getByText(/Quantity is required/)).toBeInTheDocument();
      });
    });
  });

  describe('Step 2: Closing Reason', () => {
    it('renders step 2 title and description', async () => {
      render(
        <BrowserRouter>
          <PositionClosing />
        </BrowserRouter>
      );

      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        expect(screen.getByText('Why Are You Closing?')).toBeInTheDocument();
        expect(
          screen.getByText(/Select the primary reason for closing this position/)
        ).toBeInTheDocument();
      });
    });

    it('renders all 6 closing reason options', async () => {
      render(
        <BrowserRouter>
          <PositionClosing />
        </BrowserRouter>
      );

      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        expect(screen.getByText(/Target Reached/)).toBeInTheDocument();
        expect(screen.getByText(/Stop Loss Hit/)).toBeInTheDocument();
        expect(screen.getByText(/Time-Based Exit/)).toBeInTheDocument();
        expect(screen.getByText(/Technical Signal/)).toBeInTheDocument();
        expect(screen.getByText(/Fundamental Change/)).toBeInTheDocument();
        expect(screen.getByText(/Portfolio Rebalance/)).toBeInTheDocument();
      });
    });

    it('allows selecting a closing reason', async () => {
      render(
        <BrowserRouter>
          <PositionClosing />
        </BrowserRouter>
      );

      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const targetReached = screen.getByText(/Target Reached/).closest('.closing-reason');
        expect(targetReached).toBeInTheDocument();
        if (targetReached) {
          fireEvent.click(targetReached);
          expect(targetReached).toHaveClass('selected');
        }
      });
    });

    it('deselects previous reason when new one selected', async () => {
      render(
        <BrowserRouter>
          <PositionClosing />
        </BrowserRouter>
      );

      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const targetReached = screen.getByText(/Target Reached/).closest('.closing-reason');
        const stopLoss = screen.getByText(/Stop Loss Hit/).closest('.closing-reason');

        if (targetReached && stopLoss) {
          fireEvent.click(targetReached);
          expect(targetReached).toHaveClass('selected');

          fireEvent.click(stopLoss);
          expect(stopLoss).toHaveClass('selected');
          expect(targetReached).not.toHaveClass('selected');
        }
      });
    });
  });

  describe('Step 3: Plan vs Execution', () => {
    it('renders step 3 title and description', async () => {
      render(
        <BrowserRouter>
          <PositionClosing />
        </BrowserRouter>
      );

      // Navigate to step 3
      fireEvent.click(screen.getByText('Continue'));
      await waitFor(() => screen.getByText(/Target Reached/));
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Plan vs Execution', level: 2 })).toBeInTheDocument();
        expect(
          screen.getByText(/Review how your actual performance compared to your original plan/)
        ).toBeInTheDocument();
      });
    });

    it('renders comparison table with metrics', async () => {
      render(
        <BrowserRouter>
          <PositionClosing />
        </BrowserRouter>
      );

      // Navigate to step 3
      fireEvent.click(screen.getByText('Continue'));
      await waitFor(() => screen.getByText(/Target Reached/));
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        expect(screen.getByText(/Performance Analysis/)).toBeInTheDocument();
        expect(screen.getByText(/Exit Price/)).toBeInTheDocument();
        expect(screen.getByText(/Profit/)).toBeInTheDocument();
        expect(screen.getByText(/Return %/)).toBeInTheDocument();
      });
    });

    it('renders key lessons section', async () => {
      render(
        <BrowserRouter>
          <PositionClosing />
        </BrowserRouter>
      );

      // Navigate to step 3
      fireEvent.click(screen.getByText('Continue'));
      await waitFor(() => screen.getByText(/Target Reached/));
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        expect(screen.getByText(/Key Lessons from This Trade/)).toBeInTheDocument();
      });
    });

    it('renders required closing journal entry field', async () => {
      render(
        <BrowserRouter>
          <PositionClosing />
        </BrowserRouter>
      );

      // Navigate to step 3
      fireEvent.click(screen.getByText('Continue'));
      await waitFor(() => screen.getByText(/Target Reached/));
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const journalField = screen.getByLabelText(/Closing Journal Entry/);
        expect(journalField).toBeInTheDocument();
        expect(journalField.tagName).toBe('TEXTAREA');
      });
    });

    it('validates journal entry is required', async () => {
      render(
        <BrowserRouter>
          <PositionClosing />
        </BrowserRouter>
      );

      // Navigate to step 3
      fireEvent.click(screen.getByText('Continue'));
      await waitFor(() => screen.getByText(/Target Reached/));
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const journalField = screen.getByLabelText(/Closing Journal Entry/);
        fireEvent.change(journalField, { target: { value: '' } });
        fireEvent.click(screen.getByText('Continue'));
      });

      await waitFor(() => {
        expect(screen.getByText(/Journal entry is required/)).toBeInTheDocument();
      });
    });
  });

  describe('Step 4: Confirmation', () => {
    it('renders step 4 title and description', async () => {
      render(
        <BrowserRouter>
          <PositionClosing />
        </BrowserRouter>
      );

      // Navigate to step 4
      fireEvent.click(screen.getByText('Continue')); // Step 2
      await waitFor(() => screen.getByText(/Target Reached/));
      fireEvent.click(screen.getByText('Continue')); // Step 3
      await waitFor(() => screen.getByLabelText(/Closing Journal Entry/));

      // Fill in required journal entry before advancing
      const journalField = screen.getByLabelText(/Closing Journal Entry/);
      fireEvent.change(journalField, { target: { value: 'Test closing journal entry' } });

      fireEvent.click(screen.getByText('Continue')); // Step 4

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Confirm Position Close', level: 2 })).toBeInTheDocument();
        expect(
          screen.getByText(/Review all details before finalizing the position closure/)
        ).toBeInTheDocument();
      });
    });

    it('renders confirmation summary with all details', async () => {
      render(
        <BrowserRouter>
          <PositionClosing />
        </BrowserRouter>
      );

      // Navigate to step 4
      fireEvent.click(screen.getByText('Continue'));
      await waitFor(() => screen.getByText(/Target Reached/));
      fireEvent.click(screen.getByText('Continue'));
      await waitFor(() => screen.getByLabelText(/Closing Journal Entry/));

      // Fill in required journal entry
      const journalField = screen.getByLabelText(/Closing Journal Entry/);
      fireEvent.change(journalField, { target: { value: 'Test closing journal entry' } });

      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        expect(screen.getByText(/Position:/)).toBeInTheDocument();
        expect(screen.getByText(/Quantity:/)).toBeInTheDocument();
        expect(screen.getByText(/Exit Price:/)).toBeInTheDocument();
        expect(screen.getByText(/Exit Date:/)).toBeInTheDocument();
        expect(screen.getByText(/Closing Reason:/)).toBeInTheDocument();
        expect(screen.getByText(/Total Profit:/)).toBeInTheDocument();
      });
    });

    it('renders final confirmation checkbox', async () => {
      render(
        <BrowserRouter>
          <PositionClosing />
        </BrowserRouter>
      );

      // Navigate to step 4
      fireEvent.click(screen.getByText('Continue'));
      await waitFor(() => screen.getByText(/Target Reached/));
      fireEvent.click(screen.getByText('Continue'));
      await waitFor(() => screen.getByLabelText(/Closing Journal Entry/));

      // Fill in required journal entry
      const journalField = screen.getByLabelText(/Closing Journal Entry/);
      fireEvent.change(journalField, { target: { value: 'Test closing journal entry' } });

      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).toBeInTheDocument();
        expect(screen.getByText(/permanently close/)).toBeInTheDocument();
      });
    });

    it('changes button to "Close Position" (danger style) on step 4', async () => {
      render(
        <BrowserRouter>
          <PositionClosing />
        </BrowserRouter>
      );

      // Navigate to step 4
      fireEvent.click(screen.getByText('Continue'));
      await waitFor(() => screen.getByText(/Target Reached/));
      fireEvent.click(screen.getByText('Continue'));
      await waitFor(() => screen.getByLabelText(/Closing Journal Entry/));

      // Fill in required journal entry
      const journalField = screen.getByLabelText(/Closing Journal Entry/);
      fireEvent.change(journalField, { target: { value: 'Test closing journal entry' } });

      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const closeButton = screen.getByText('Close Position');
        expect(closeButton).toBeInTheDocument();
        expect(closeButton).toHaveClass('btn-danger');
      });
    });

    it('disables close button until checkbox checked', async () => {
      render(
        <BrowserRouter>
          <PositionClosing />
        </BrowserRouter>
      );

      // Navigate to step 4
      fireEvent.click(screen.getByText('Continue'));
      await waitFor(() => screen.getByText(/Target Reached/));
      fireEvent.click(screen.getByText('Continue'));
      await waitFor(() => screen.getByLabelText(/Closing Journal Entry/));

      // Fill in required journal entry
      const journalField = screen.getByLabelText(/Closing Journal Entry/);
      fireEvent.change(journalField, { target: { value: 'Test closing journal entry' } });

      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        const closeButton = screen.getByText('Close Position');
        expect(closeButton).toBeDisabled();

        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);

        expect(closeButton).not.toBeDisabled();
      });
    });
  });
});
