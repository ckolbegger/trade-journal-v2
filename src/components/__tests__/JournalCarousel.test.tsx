import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

  it('renders multiple entries with last entry visible by default', () => {
    render(<JournalCarousel entries={mockEntries} />)

    // Last entry (most recent) should be visible by default
    expect(screen.getByText('What changed since my last review?')).toBeInTheDocument()
    expect(screen.getByText('Market showing unexpected weakness.')).toBeInTheDocument()

    // Other entries should be in DOM but not necessarily visible (they're in slides)
    const wrapper = screen.getByTestId('carousel-wrapper')
    expect(wrapper.children.length).toBe(3)

    // Should start at last slide (index 2 of 3 entries)
    expect(wrapper.style.transform).toBe('translateX(-200%)')
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

describe('JournalCarousel - Navigation', () => {
  const mockEntries: JournalEntry[] = [
    {
      id: 'journal-1',
      position_id: 'pos-1',
      entry_type: 'position_plan',
      fields: [
        {
          name: 'core_thesis',
          prompt: 'What is the core thesis?',
          response: 'First entry'
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
          prompt: 'Why now?',
          response: 'Second entry'
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
          prompt: 'What changed?',
          response: 'Third entry'
        }
      ],
      created_at: '2024-09-07T09:15:00Z'
    }
  ]

  it('hides navigation when no entries exist', () => {
    render(<JournalCarousel entries={[]} />)

    expect(screen.queryByTestId('carousel-nav')).not.toBeInTheDocument()
  })

  it('hides navigation when only one entry exists', () => {
    const singleEntry = [mockEntries[0]]
    render(<JournalCarousel entries={singleEntry} />)

    expect(screen.queryByTestId('carousel-nav')).not.toBeInTheDocument()
  })

  it('shows navigation with multiple entries', () => {
    render(<JournalCarousel entries={mockEntries} />)

    expect(screen.getByTestId('carousel-nav')).toBeInTheDocument()
    expect(screen.getByTestId('prev-arrow')).toBeInTheDocument()
    expect(screen.getByTestId('next-arrow')).toBeInTheDocument()
    expect(screen.getByTestId('carousel-dots')).toBeInTheDocument()
  })

  it('disables right arrow on last slide by default', () => {
    render(<JournalCarousel entries={mockEntries} />)

    // Now starts at last slide, so right arrow should be disabled
    const nextArrow = screen.getByTestId('next-arrow')
    expect(nextArrow).toBeDisabled()
  })

  it('disables left arrow on first slide when navigated to', () => {
    render(<JournalCarousel entries={mockEntries} currentIndex={0} />)

    const prevArrow = screen.getByTestId('prev-arrow')
    expect(prevArrow).toBeDisabled()
  })

  it('disables right arrow on last slide', () => {
    render(<JournalCarousel entries={mockEntries} currentIndex={2} />)

    const nextArrow = screen.getByTestId('next-arrow')
    expect(nextArrow).toBeDisabled()
  })

  it('enables both arrows on middle slides', () => {
    render(<JournalCarousel entries={mockEntries} currentIndex={1} />)

    const prevArrow = screen.getByTestId('prev-arrow')
    const nextArrow = screen.getByTestId('next-arrow')

    expect(prevArrow).not.toBeDisabled()
    expect(nextArrow).not.toBeDisabled()
  })

  it('advances to next slide when right arrow clicked', () => {
    // Start at first slide explicitly
    const { rerender } = render(<JournalCarousel entries={mockEntries} currentIndex={0} />)

    // Initially showing first entry
    expect(screen.getByText('First entry')).toBeInTheDocument()

    // Click next arrow
    const nextArrow = screen.getByTestId('next-arrow')
    fireEvent.click(nextArrow)

    // Verify transform changed
    const wrapper = screen.getByTestId('carousel-wrapper')
    expect(wrapper.style.transform).toBe('translateX(-100%)')
  })

  it('goes to previous slide when left arrow clicked', () => {
    render(<JournalCarousel entries={mockEntries} currentIndex={1} />)

    // Initially showing second entry
    const wrapper = screen.getByTestId('carousel-wrapper')
    expect(wrapper.style.transform).toBe('translateX(-100%)')

    // Click prev arrow
    const prevArrow = screen.getByTestId('prev-arrow')
    fireEvent.click(prevArrow)

    // Verify transform changed to first slide
    expect(wrapper.style.transform).toBe('translateX(-0%)')
  })

  it('jumps to specific slide when dot clicked', () => {
    render(<JournalCarousel entries={mockEntries} />)

    // Click the third dot
    const dots = screen.getAllByTestId(/^carousel-dot-/)
    fireEvent.click(dots[2])

    // Verify transform changed to third slide
    const wrapper = screen.getByTestId('carousel-wrapper')
    expect(wrapper.style.transform).toBe('translateX(-200%)')
  })

  it('highlights active dot corresponding to current slide', () => {
    const { rerender } = render(<JournalCarousel entries={mockEntries} currentIndex={0} />)

    // First dot should be active
    const dot0 = screen.getByTestId('carousel-dot-0')
    expect(dot0.className).toMatch(/active/)

    // Change to second slide
    rerender(<JournalCarousel entries={mockEntries} currentIndex={1} />)

    // Second dot should be active
    const dot1 = screen.getByTestId('carousel-dot-1')
    expect(dot1.className).toMatch(/active/)
  })
})
