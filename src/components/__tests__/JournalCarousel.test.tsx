import { render, screen, fireEvent } from '@testing-library/react';
import { JournalCarousel } from '../JournalCarousel';
import type { JournalEntry } from '../../types/journal';

const mockEntries: JournalEntry[] = [
  {
    id: 'journal-1',
    position_id: 'pos-1',
    entry_type: 'position_plan',
    created_at: '2024-09-04T10:00:00Z',
    fields: [
      {
        name: 'core_thesis',
        prompt: 'What is the core thesis for this position?',
        response: 'TSLA showing strong institutional support.',
      },
    ],
  },
  {
    id: 'journal-2',
    position_id: 'pos-1',
    entry_type: 'trade_execution',
    created_at: '2024-09-05T11:00:00Z',
    fields: [
      {
        name: 'execution_notes',
        prompt: 'How was the trade execution?',
        response: 'Filled at the target price with no slippage.',
      },
    ],
  },
];

describe('<JournalCarousel />', () => {
  describe('when there is a single entry', () => {
    it('should render the content of the entry', () => {
      render(<JournalCarousel entries={[mockEntries[0]]} />);
      expect(screen.getByText('Position Plan')).toBeInTheDocument();
      expect(screen.getByText('Sep 4, 2024')).toBeInTheDocument();
      expect(screen.getByText('What is the core thesis for this position?')).toBeInTheDocument();
      expect(screen.getByText('TSLA showing strong institutional support.')).toBeInTheDocument();
    });
  });

  describe('when there are multiple entries', () => {
    it('should only display the first entry by default', () => {
      render(<JournalCarousel entries={mockEntries} />);
      // First entry should be visible
      expect(screen.getByText('Position Plan')).toBeVisible();
      // Second entry should be in the DOM but not visible
      expect(screen.getByText('Trade Execution').closest('.carousel-slide')).toHaveAttribute('aria-hidden', 'true');
    });

    it('should display the second entry after clicking next', () => {
      render(<JournalCarousel entries={mockEntries} />);
      fireEvent.click(screen.getByTestId('next-button'));
      // Second entry should be visible
      expect(screen.getByText('Trade Execution')).toBeVisible();
      // First entry should be in the DOM but not visible
      expect(screen.getByText('Position Plan').closest('.carousel-slide')).toHaveAttribute('aria-hidden', 'true');
    });

    it('should display the first entry again after clicking next then previous', () => {
      render(<JournalCarousel entries={mockEntries} />);
      // Go to next
      fireEvent.click(screen.getByTestId('next-button'));
      expect(screen.getByText('Trade Execution')).toBeInTheDocument();
      // Go back to previous
      fireEvent.click(screen.getByTestId('previous-button'));
      expect(screen.getByText('Position Plan')).toBeInTheDocument();
    });

    it('should not allow going past the last entry or before the first entry', () => {
        render(<JournalCarousel entries={mockEntries} />);
        // At first entry, previous button should be disabled
        expect(screen.getByTestId('previous-button')).toBeDisabled();

        // Go to next (last) entry
        fireEvent.click(screen.getByTestId('next-button'));
        expect(screen.getByText('Trade Execution')).toBeInTheDocument();

        // At last entry, next button should be disabled
        expect(screen.getByTestId('next-button')).toBeDisabled();
    });
  });
});
