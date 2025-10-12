import { render, screen } from '@testing-library/react';
import { JournalCarousel } from '../JournalCarousel';
import type { JournalEntry, JournalField } from '../../types/journal';

const mockEntry: JournalEntry = {
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
    {
      name: 'setup_signal',
      prompt: 'What specific setup or signal am I seeing?',
      response: 'Stock formed higher low at $245.',
    },
  ],
};

describe('<JournalCarousel />', () => {
  it('should render the content of a single journal entry', () => {
    render(<JournalCarousel entry={mockEntry} />);

    // Check for header content
    expect(screen.getByText('Position Plan')).toBeInTheDocument();
    expect(screen.getByText('Sep 4, 2024')).toBeInTheDocument();

    // Check for field content
    expect(screen.getByText('What is the core thesis for this position?')).toBeInTheDocument();
    expect(screen.getByText('TSLA showing strong institutional support.')).toBeInTheDocument();

    expect(screen.getByText('What specific setup or signal am I seeing?')).toBeInTheDocument();
    expect(screen.getByText('Stock formed higher low at $245.')).toBeInTheDocument();
  });
});
