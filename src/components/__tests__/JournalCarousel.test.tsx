import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { JournalCarousel } from '@/components/JournalCarousel'
import type { JournalEntry } from '@/types/journal'

// Mock journal entries with unique content for testing
const mockJournalEntries: JournalEntry[] = [
  {
    id: 'journal-1',
    position_id: 'position-1',
    entry_type: 'position_plan',
    fields: [
      {
        name: 'rationale',
        prompt: 'Why this trade? Why now?',
        response: 'Entry 1 rationale response',
      },
      {
        name: 'emotional_state',
        prompt: 'How are you feeling about this trade?',
        response: 'Entry 1 emotional state response',
      }
    ],
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'journal-2',
    position_id: 'position-1',
    entry_type: 'trade_execution',
    fields: [
      {
        name: 'rationale',
        prompt: 'Why this trade? Why now?',
        response: 'Entry 2 rationale response',
      },
      {
        name: 'emotional_state',
        prompt: 'How are you feeling about this trade?',
        response: 'Entry 2 emotional state response',
      }
    ],
    created_at: '2024-01-16T14:30:00Z',
  },
  {
    id: 'journal-3',
    position_id: 'position-1',
    entry_type: 'position_plan',
    fields: [
      {
        name: 'rationale',
        prompt: 'Why this trade? Why now?',
        response: 'Entry 3 rationale response',
      },
      {
        name: 'emotional_state',
        prompt: 'How are you feeling about this trade?',
        response: 'Entry 3 emotional state response',
      }
    ],
    created_at: '2024-01-17T16:45:00Z',
  },
]

describe('JournalCarousel Component', () => {
  describe('Loading State', () => {
    it('[Component] should display loading message when loading is true', () => {
      render(<JournalCarousel journalEntries={[]} loading={true} error={null} />)
      expect(screen.getByText('Loading journal entries...')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('[Component] should display error message when error is provided', () => {
      render(<JournalCarousel journalEntries={[]} loading={false} error="Failed to load" />)
      expect(screen.getByText('Failed to load')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('[Component] should display no entries message when journalEntries is empty', () => {
      render(<JournalCarousel journalEntries={[]} loading={false} error={null} />)
      expect(screen.getByText('No journal entries yet')).toBeInTheDocument()
    })
  })

  describe('Carousel Display', () => {
    it('[Component] should show the last (most recent) entry by default', () => {
      render(<JournalCarousel journalEntries={mockJournalEntries} loading={false} error={null} />)
      
      // The last entry should be visible by default
      expect(screen.getByText('Entry 3 rationale response')).toBeInTheDocument()
      expect(screen.getByText('Entry 3 emotional state response')).toBeInTheDocument()
    })
  })

  describe('Navigation Functionality', () => {
    it('[Interaction] should navigate to previous slide when left arrow clicked', () => {
      render(<JournalCarousel journalEntries={mockJournalEntries} loading={false} error={null} />)
      
      // Initially should show last entry content
      expect(screen.getByText('Entry 3 rationale response')).toBeInTheDocument()
      
      // Click left arrow
      const leftArrow = screen.getByLabelText('Previous slide')
      fireEvent.click(leftArrow)
      
      // Should now show second entry content
      expect(screen.getByText('Entry 2 rationale response')).toBeInTheDocument()
      expect(screen.getByText('Entry 2 emotional state response')).toBeInTheDocument()
    })

    it('[Interaction] should navigate to next slide when right arrow clicked', () => {
      render(<JournalCarousel journalEntries={mockJournalEntries} loading={false} error={null} />)
      
      // Initially should show last entry
      expect(screen.getByText('Entry 3 rationale response')).toBeInTheDocument()
      
      // Click left arrow twice to get to first entry
      const leftArrow = screen.getByLabelText('Previous slide')
      fireEvent.click(leftArrow)
      fireEvent.click(leftArrow)
      
      // Should now show first entry
      expect(screen.getByText('Entry 1 rationale response')).toBeInTheDocument()
      expect(screen.getByText('Entry 1 emotional state response')).toBeInTheDocument()
      
      // Click right arrow
      const rightArrow = screen.getByLabelText('Next slide')
      fireEvent.click(rightArrow)
      
      // Should now show second entry
      expect(screen.getByText('Entry 2 rationale response')).toBeInTheDocument()
      expect(screen.getByText('Entry 2 emotional state response')).toBeInTheDocument()
    })

    it('[Interaction] should navigate to specific slide when dot indicator clicked', () => {
      render(<JournalCarousel journalEntries={mockJournalEntries} loading={false} error={null} />)
      
      // Get all dot indicators
      const dots = screen.getAllByRole('button', { name: /Go to slide/i })
      expect(dots).toHaveLength(3)
      
      // Click first dot
      fireEvent.click(dots[0])
      
      // Should show first entry
      expect(screen.getByText('Entry 1 rationale response')).toBeInTheDocument()
      expect(screen.getByText('Entry 1 emotional state response')).toBeInTheDocument()
    })
  })
})