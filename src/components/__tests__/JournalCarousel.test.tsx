import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { JournalCarousel } from '@/components/JournalCarousel'
import type { JournalEntry } from '@/types/journal'

describe('JournalCarousel', () => {
  const mockEntries: JournalEntry[] = [
    {
      id: 'journal-1',
      position_id: 'pos-1',
      entry_type: 'position_plan',
      fields: [
        {
          name: 'core_thesis',
          prompt: 'What is the core thesis for this position?',
          response: 'Strong technical setup with institutional support.'
        }
      ],
      created_at: '2024-09-04T10:00:00Z'
    },
    {
      id: 'journal-2',
      position_id: 'pos-1',
      entry_type: 'trade_execution',
      trade_id: 'trade-1',
      fields: [
        {
          name: 'execution_timing',
          prompt: 'Why did I execute this trade now?',
          response: 'Price reached target entry with confirming volume.'
        }
      ],
      created_at: '2024-09-05T14:30:00Z'
    },
    {
      id: 'journal-3',
      position_id: 'pos-1',
      entry_type: 'position_plan',
      fields: [
        {
          name: 'position_update',
          prompt: 'What changed since my last review?',
          response: 'Market showing unexpected weakness.'
        }
      ],
      created_at: '2024-09-07T09:15:00Z'
    }
  ]

  it('renders empty state with no entries', () => {
    render(<JournalCarousel entries={[]} />)

    const container = screen.getByTestId('carousel-container')
    expect(container).toBeInTheDocument()

    // Should have carousel wrapper but no slides
    const wrapper = screen.getByTestId('carousel-wrapper')
    expect(wrapper).toBeInTheDocument()
    expect(wrapper.children.length).toBe(0)
  })

  it('renders single entry without navigation', () => {
    const singleEntry = [mockEntries[0]]
    render(<JournalCarousel entries={singleEntry} />)

    // Should render the entry
    expect(screen.getByText('What is the core thesis for this position?')).toBeInTheDocument()
    expect(screen.getByText('Strong technical setup with institutional support.')).toBeInTheDocument()

    // Should show entry type and date
    expect(screen.getByText('POSITION PLAN')).toBeInTheDocument()
    expect(screen.getByText('Sep 4, 2024')).toBeInTheDocument()
  })

  it('renders multiple entries with first entry visible by default', () => {
    render(<JournalCarousel entries={mockEntries} />)

    // First entry should be visible
    expect(screen.getByText('What is the core thesis for this position?')).toBeInTheDocument()
    expect(screen.getByText('Strong technical setup with institutional support.')).toBeInTheDocument()

    // Other entries should be in DOM but not necessarily visible (they're in slides)
    const wrapper = screen.getByTestId('carousel-wrapper')
    expect(wrapper.children.length).toBe(3)
  })

  it('applies custom transition duration from props', () => {
    render(<JournalCarousel entries={mockEntries} transitionDuration={0.5} />)

    const wrapper = screen.getByTestId('carousel-wrapper')

    // Check that transition property includes the custom duration
    expect(wrapper.style.transition).toContain('0.5s')
  })

  it('changes visible entry when currentIndex prop changes', () => {
    const { rerender } = render(<JournalCarousel entries={mockEntries} currentIndex={0} />)

    // First entry visible
    expect(screen.getByText('What is the core thesis for this position?')).toBeInTheDocument()

    // Change to second entry
    rerender(<JournalCarousel entries={mockEntries} currentIndex={1} />)

    // Verify transform changed (slide moved)
    const wrapper = screen.getByTestId('carousel-wrapper')
    expect(wrapper.style.transform).toBe('translateX(-100%)')
  })

  it('matches mockup styling with elevated card design', () => {
    render(<JournalCarousel entries={mockEntries} />)

    const container = screen.getByTestId('carousel-container')
    const wrapper = screen.getByTestId('carousel-wrapper')
    const slide = screen.getAllByTestId('carousel-slide')[0]
    const card = screen.getAllByTestId('entry-card')[0]

    // Verify key styling elements are present
    expect(container).toBeInTheDocument()
    expect(wrapper).toBeInTheDocument()
    expect(slide).toBeInTheDocument()
    expect(card).toBeInTheDocument()

    // Check that cards have proper styling classes for elevation
    expect(card.className).toMatch(/bg-white/)

    // Border radius and shadow are applied via inline style
    expect(card.style.borderRadius).toBe('10px')
    expect(card.style.boxShadow).toBe('0 12px 24px -18px rgba(15, 23, 42, 0.8)')
  })
})
