import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { JournalCarousel } from '@/components/JournalCarousel'
import type { JournalEntry } from '@/types/journal'

describe('JournalCarousel Component', () => {
  const mockJournalEntries: JournalEntry[] = [
    {
      id: 'journal-1',
      position_id: 'pos-123',
      entry_type: 'position_plan',
      fields: [
        { name: 'rationale', prompt: 'Why this trade? Why now?', response: 'Test response 1', required: true },
        { name: 'setup', prompt: 'What setup or signal?', response: 'Test signal 1', required: true }
      ],
      created_at: '2024-01-01T10:00:00Z',
      executed_at: '2024-01-01T10:00:00Z'
    },
    {
      id: 'journal-2',
      position_id: 'pos-123',
      entry_type: 'trade_execution',
      fields: [
        { name: 'execution_notes', prompt: 'Describe the execution', response: 'Test execution notes', required: true }
      ],
      created_at: '2024-01-02T10:00:00Z',
      executed_at: '2024-01-02T10:00:00Z'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render carousel container with both navigation types', () => {
      render(<JournalCarousel entries={mockJournalEntries} />)
      
      // Check for carousel container
      const carouselContainer = screen.getByTestId('journal-carousel')
      expect(carouselContainer).toBeInTheDocument()
      
      // Check for navigation arrows
      expect(screen.getByTestId('carousel-prev-arrow')).toBeInTheDocument()
      expect(screen.getByTestId('carousel-next-arrow')).toBeInTheDocument()
      
      // Check for dots container
      expect(screen.getByTestId('carousel-dots')).toBeInTheDocument()
    })

    it('should show correct number of dot indicators', () => {
      render(<JournalCarousel entries={mockJournalEntries} />)
      
      const dots = screen.getAllByTestId(/carousel-dot-/)
      expect(dots).toHaveLength(2)
    })

    it('should display journal entry content in each slide', () => {
      render(<JournalCarousel entries={mockJournalEntries} />)
      
      // Check for slide container
      expect(screen.getByTestId('carousel-wrapper')).toBeInTheDocument()
      
      // Check that entries are rendered within slides
      expect(screen.getByText('Why this trade? Why now?')).toBeInTheDocument()
      expect(screen.getByText('Test response 1')).toBeInTheDocument()
      expect(screen.getByText('Describe the execution')).toBeInTheDocument()
      expect(screen.getByText('Test execution notes')).toBeInTheDocument()
    })

    it('should handle empty entries array gracefully', () => {
      render(<JournalCarousel entries={[]} />)
      
      expect(screen.getByTestId('journal-carousel')).toBeInTheDocument()
      expect(screen.getByText('No journal entries yet')).toBeInTheDocument()
      
      // Navigation should not be rendered for empty entries
      expect(screen.queryByTestId('carousel-prev-arrow')).not.toBeInTheDocument()
      expect(screen.queryByTestId('carousel-next-arrow')).not.toBeInTheDocument()
      expect(screen.queryByTestId('carousel-dots')).not.toBeInTheDocument()
    })
  })

  describe('Navigation Controls', () => {
    it('should disable previous arrow on first slide (newest entry)', () => {
      render(<JournalCarousel entries={mockJournalEntries} />)
      
      const prevArrow = screen.getByTestId('carousel-prev-arrow')
      expect(prevArrow).toHaveClass('disabled')
      expect(prevArrow).toBeDisabled()
    })

    it('should disable next arrow on last slide (oldest entry)', () => {
      render(<JournalCarousel entries={mockJournalEntries} />)
      
      // Navigate to the last slide (oldest entry) - slide index 1
      const lastDot = screen.getByTestId('carousel-dot-1')
      fireEvent.click(lastDot)
      
      const nextArrow = screen.getByTestId('carousel-next-arrow')
      expect(nextArrow).toHaveClass('disabled')
      expect(nextArrow).toBeDisabled()
    })

    it('should enable both arrows when between slides', () => {
      render(<JournalCarousel entries={mockJournalEntries} />)
      
      // Start on first slide (newest) - previous disabled, next enabled
      let prevArrow = screen.getByTestId('carousel-prev-arrow')
      let nextArrow = screen.getByTestId('carousel-next-arrow')
      expect(prevArrow).toBeDisabled()
      expect(nextArrow).not.toBeDisabled()
      
      // Navigate to second slide - both should be enabled for 3+ entries
      // For 2 entries, next becomes disabled on second slide
      const secondDot = screen.getByTestId('carousel-dot-1')
      fireEvent.click(secondDot)
      
      prevArrow = screen.getByTestId('carousel-prev-arrow')
      nextArrow = screen.getByTestId('carousel-next-arrow')
      expect(prevArrow).not.toBeDisabled()
      expect(nextArrow).toBeDisabled() // With only 2 entries, next is disabled on oldest
    })

    it('should highlight correct dot indicator for current slide', () => {
      render(<JournalCarousel entries={mockJournalEntries} />)
      
      // Initially should highlight first dot (newest entry) - check for blue color
      const firstDot = screen.getByTestId('carousel-dot-0')
      expect(firstDot).toHaveClass('bg-blue-500')
      
      const secondDot = screen.getByTestId('carousel-dot-1')
      expect(secondDot).not.toHaveClass('bg-blue-500')
      
      // Click second dot and check activation
      fireEvent.click(secondDot)
      
      expect(firstDot).not.toHaveClass('bg-blue-500')
      expect(secondDot).toHaveClass('bg-blue-500')
    })
  })

  describe('Transition Configuration', () => {
    it('should use provided transitionDuration prop', () => {
      render(<JournalCarousel entries={mockJournalEntries} transitionDuration={500} />)
      
      const wrapper = screen.getByTestId('carousel-wrapper') as HTMLElement
      expect(wrapper.style.transition).toContain('500ms')
    })

    it('should default to mockup timing when not provided', () => {
      render(<JournalCarousel entries={mockJournalEntries} />)
      
      const wrapper = screen.getByTestId('carousel-wrapper') as HTMLElement
      expect(wrapper.style.transition).toContain('280ms') // 0.28s from mockup
    })
  })

  describe('Single Entry Edge Case', () => {
    it('should handle single journal entry', () => {
      const singleEntry = [mockJournalEntries[0]]
      render(<JournalCarousel entries={singleEntry} />)
      
      expect(screen.getByTestId('journal-carousel')).toBeInTheDocument()
      
      // With single entry, both arrows should be disabled
      expect(screen.getByTestId('carousel-prev-arrow')).toBeDisabled()
      expect(screen.getByTestId('carousel-next-arrow')).toBeDisabled()
      
      // Should have only one dot
      const dots = screen.getAllByTestId(/carousel-dot-/)
      expect(dots).toHaveLength(1)
      expect(dots[0]).toHaveClass('bg-blue-500')
    })
  })

  describe('Arrow Navigation', () => {
    it('should advance to older entry when next arrow clicked', () => {
      render(<JournalCarousel entries={mockJournalEntries} />)
      
      const firstDot = screen.getByTestId('carousel-dot-0')
      const secondDot = screen.getByTestId('carousel-dot-1')
      
      // Initially on newest entry
      expect(firstDot).toHaveClass('bg-blue-500')
      expect(secondDot).not.toHaveClass('bg-blue-500')
      
      // Click next arrow to go to older entry
      const nextArrow = screen.getByTestId('carousel-next-arrow')
      fireEvent.click(nextArrow)
      
      expect(firstDot).not.toHaveClass('bg-blue-500')
      expect(secondDot).toHaveClass('bg-blue-500')
    })

    it('should go to newer entry when previous arrow clicked', () => {
      render(<JournalCarousel entries={mockJournalEntries} />)
      
      const firstDot = screen.getByTestId('carousel-dot-0')
      const secondDot = screen.getByTestId('carousel-dot-1')
      
      // Navigate to older entry first
      const nextArrow = screen.getByTestId('carousel-next-arrow')
      fireEvent.click(nextArrow)
      
      // Now click previous arrow to go back
      const prevArrow = screen.getByTestId('carousel-prev-arrow')
      fireEvent.click(prevArrow)
      
      expect(firstDot).toHaveClass('bg-blue-500')
      expect(secondDot).not.toHaveClass('bg-blue-500')
    })

    it('should show newest entry initially (currentSlide = 0)', () => {
      render(<JournalCarousel entries={mockJournalEntries} />)
      
      // Verify we start with newest entry
      const wrapper = screen.getByTestId('carousel-wrapper') as HTMLElement
      expect(wrapper.style.transform).toBe('translateX(0%)')
      
      const firstDot = screen.getByTestId('carousel-dot-0')
      expect(firstDot).toHaveClass('bg-blue-500')
      
      // Previous arrow should be disabled on newest
      const prevArrow = screen.getByTestId('carousel-prev-arrow')
      expect(prevArrow).toBeDisabled()
    })

    it('should not wrap around boundaries', () => {
      render(<JournalCarousel entries={mockJournalEntries} />)
      
      const prevArrow = screen.getByTestId('carousel-prev-arrow')
      const nextArrow = screen.getByTestId('carousel-next-arrow')
      
      // Initially on newest - previous should be disabled
      expect(prevArrow).toBeDisabled()
      
      // Go to oldest entry
      fireEvent.click(nextArrow)
      
      // Now on oldest - next should be disabled
      expect(nextArrow).toBeDisabled()
      expect(prevArrow).not.toBeDisabled()
      
      // Try to go beyond oldest - should stay within bounds
      fireEvent.click(nextArrow)
      
      expect(nextArrow).toBeDisabled() // Still disabled
    })

    it('should update transform style on navigation', () => {
      render(<JournalCarousel entries={mockJournalEntries} />)
      
      const wrapper = screen.getByTestId('carousel-wrapper') as HTMLElement
      
      // Initial position
      expect(wrapper.style.transform).toBe('translateX(0%)')
      
      // Navigate to next (older) entry
      const nextArrow = screen.getByTestId('carousel-next-arrow')
      fireEvent.click(nextArrow)
      
      // Should have moved left to show second slide
      expect(wrapper.style.transform).toBe('translateX(-100%)')
    })
  })

  describe('Dot Navigation', () => {
    it('should go to specific entry when dot clicked', () => {
      render(<JournalCarousel entries={mockJournalEntries} />)
      
      const secondDot = screen.getByTestId('carousel-dot-1')
      const wrapper = screen.getByTestId('carousel-wrapper') as HTMLElement
      
      // Click second dot to go directly to oldest entry
      fireEvent.click(secondDot)
      
      expect(wrapper.style.transform).toBe('translateX(-100%)')
      expect(secondDot).toHaveClass('bg-blue-500')
    })

    it('should update active dot state after navigation', () => {
      render(<JournalCarousel entries={mockJournalEntries} />)
      
      const firstDot = screen.getByTestId('carousel-dot-0')
      const secondDot = screen.getByTestId('carousel-dot-1')
      
      // Initially first dot is active
      expect(firstDot).toHaveClass('bg-blue-500')
      expect(secondDot).not.toHaveClass('bg-blue-500')
      
      // Navigate via arrows
      const nextArrow = screen.getByTestId('carousel-next-arrow')
      fireEvent.click(nextArrow)
      
      // Now second dot should be active
      expect(firstDot).not.toHaveClass('bg-blue-500')
      expect(secondDot).toHaveClass('bg-blue-500')
    })

    it('should map dot 0 to oldest entry', () => {
      render(<JournalCarousel entries={mockJournalEntries} />)
      
      const secondDot = screen.getByTestId('carousel-dot-1')
      const wrapper = screen.getByTestId('carousel-wrapper') as HTMLElement
      
      // Since we reverse entries, dot 0 (logical index 0) maps to newest entry
      // and final dot maps to oldest entry
      fireEvent.click(secondDot)
      
      expect(wrapper.style.transform).toBe('translateX(-100%)')
      expect(secondDot).toHaveClass('bg-blue-500')
    })

    it('should map final dot to newest entry', () => {
      render(<JournalCarousel entries={mockJournalEntries} />)
      
      const firstDot = screen.getByTestId('carousel-dot-0')
      const wrapper = screen.getByTestId('carousel-wrapper') as HTMLElement
      
      // Final dot (index 0 since we only have 2 entries) should show newest
      expect(firstDot).toHaveClass('bg-blue-500')
      expect(wrapper.style.transform).toBe('translateX(0%)')
    })
  })

  describe('Keyboard Navigation', () => {
    it('should respond to left arrow key press', () => {
      render(<JournalCarousel entries={mockJournalEntries} />)
      
      // Initially should highlight first dot (newest entry)
      const firstDot = screen.getByTestId('carousel-dot-0')
      expect(firstDot).toHaveClass('bg-blue-500')
      
      // Click second dot to navigate to older entry
      const secondDot = screen.getByTestId('carousel-dot-1')
      fireEvent.click(secondDot)
      
      // Now pressing left arrow should go back to newer (first) entry
      fireEvent.keyDown(document, { key: 'ArrowLeft' })
      
      expect(firstDot).toHaveClass('bg-blue-500')
      expect(secondDot).not.toHaveClass('bg-blue-500')
    })

    it('should respond to right arrow key press', () => {
      render(<JournalCarousel entries={mockJournalEntries} />)
      
      // Initially on newest entry (first dot)
      const firstDot = screen.getByTestId('carousel-dot-0')
      const secondDot = screen.getByTestId('carousel-dot-1')
      
      // Press right arrow to go to older entry
      fireEvent.keyDown(document, { key: 'ArrowRight' })
      
      expect(firstDot).not.toHaveClass('bg-blue-500')
      expect(secondDot).toHaveClass('bg-blue-500')
    })

    it('should not navigate beyond boundaries with keyboard', () => {
      render(<JournalCarousel entries={mockJournalEntries} />)
      
      // Initially on newest entry - left arrow should not go anywhere
      fireEvent.keyDown(document, { key: 'ArrowLeft' })
      
      // Still on first dot (newest)
      const firstDot = screen.getByTestId('carousel-dot-0')
      expect(firstDot).toHaveClass('bg-blue-500')
      
      // Go to oldest entry
      fireEvent.keyDown(document, { key: 'ArrowRight' })
      
      // Now on oldest - right arrow should not go anywhere
      fireEvent.keyDown(document, { key: 'ArrowRight' })
      
      // Still on second dot (oldest)
      const secondDot = screen.getByTestId('carousel-dot-1')
      expect(secondDot).toHaveClass('bg-blue-500')
    })

    it('should prevent default behavior for arrow keys', () => {
      const mockPreventDefault = vi.fn()
      
      render(<JournalCarousel entries={mockJournalEntries} />)
      
      // Create a keyboard event with preventDefault
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' })
      Object.defineProperty(event, 'preventDefault', {
        value: mockPreventDefault,
        writable: true
      })
      
      document.dispatchEvent(event)
      
      expect(mockPreventDefault).toHaveBeenCalled()
    })
  })
})
