import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JournalEntryForm } from '@/components/JournalEntryForm';

describe('JournalEntryForm', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Position Plan Entry', () => {
    it('should render the form', () => {
      render(
        <JournalEntryForm
          entryType="position_plan"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByText('Position Thesis')).toBeInTheDocument();
    });
  });
});