import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { JournalCarousel } from '@/components/JournalCarousel'
import type { JournalEntry } from '@/types/journal'

describe('JournalCarousel - Integration', () => {
  it('renders actual journal entry data with all fields and formatting', () => {
    // Create realistic journal entries with multiple fields and longer text
    const realEntries: JournalEntry[] = [
      {
        id: 'journal-position-plan',
        position_id: 'pos-tsla-001',
        entry_type: 'position_plan',
        fields: [
          {
            name: 'core_thesis',
            prompt: 'What is the core thesis for this position?',
            response: 'TSLA showing strong institutional support around $250 level with positive EV delivery momentum building into Q3 earnings. Technical setup suggests consolidation phase completing before next leg up toward $285 resistance. Risk management critical given inherent volatility in name.'
          },
          {
            name: 'setup_signal',
            prompt: 'What specific setup or signal am I seeing?',
            response: 'Stock formed higher low at $245, bouncing off key support zone. Volume profile shows accumulation at current levels. Options flow showing bullish bias with calls outpacing puts 2:1. Bollinger bands tightening indicating volatility compression.'
          },
          {
            name: 'invalidation',
            prompt: 'What could invalidate this trade setup?',
            response: 'Break below $210 support on heavy volume would invalidate bullish setup. Negative news on deliveries or production. Broader market correction taking high-beta stocks down. Fed turning more hawkish than expected.'
          },
          {
            name: 'strategy_fit',
            prompt: 'How does this position fit my overall strategy?',
            response: 'Aligns with swing trading approach - 2-4 week hold time. Position size is 20% of portfolio which matches my risk tolerance for medium conviction setups. Using wider stops due to TSLA volatility but maintaining 2:1 reward/risk ratio.'
          }
        ],
        created_at: '2024-09-04T10:30:00Z'
      },
      {
        id: 'journal-trade-execution',
        position_id: 'pos-tsla-001',
        trade_id: 'trade-001',
        entry_type: 'trade_execution',
        fields: [
          {
            name: 'execution_timing',
            prompt: 'Why did I execute this trade now?',
            response: 'Price reached my target entry of $248.50 with confirming volume. Technical setup looking strong with consolidation complete. Got filled at exact target price - patient waiting paid off.'
          },
          {
            name: 'execution_comparison',
            prompt: 'How did the execution compare to my plan?',
            response: 'Perfect execution - hit target entry exactly at $248.50. Bought full 60 shares as planned in single order. No slippage. Market conditions aligned with thesis at entry.'
          },
          {
            name: 'emotional_state',
            prompt: "What's my emotional state entering this trade?",
            response: 'Calm and confident. Did the work upfront with planning. Position size feels right - can handle the risk. Stop is set and I\'m committed to following the plan. No FOMO or anxiety.'
          }
        ],
        created_at: '2024-09-05T14:30:00Z',
        executed_at: '2024-09-05T14:30:00Z'
      }
    ]

    render(<JournalCarousel entries={realEntries} />)

    // Verify first entry (Position Plan) renders with all fields
    expect(screen.getByText('POSITION PLAN')).toBeInTheDocument()
    expect(screen.getByText('Sep 4, 2024')).toBeInTheDocument()

    // Check all prompts and responses are rendered
    expect(screen.getByText('What is the core thesis for this position?')).toBeInTheDocument()
    expect(screen.getByText(/TSLA showing strong institutional support/)).toBeInTheDocument()

    expect(screen.getByText('What specific setup or signal am I seeing?')).toBeInTheDocument()
    expect(screen.getByText(/Stock formed higher low at \$245/)).toBeInTheDocument()

    expect(screen.getByText('What could invalidate this trade setup?')).toBeInTheDocument()
    expect(screen.getByText(/Break below \$210 support/)).toBeInTheDocument()

    expect(screen.getByText('How does this position fit my overall strategy?')).toBeInTheDocument()
    expect(screen.getByText(/Aligns with swing trading approach/)).toBeInTheDocument()

    // Verify card styling is applied
    const entryCard = screen.getAllByTestId('entry-card')[0]
    expect(entryCard).toBeInTheDocument()
    expect(entryCard.className).toMatch(/bg-white/)

    // Border radius and shadow are applied via inline style
    expect(entryCard.style.borderRadius).toBe('10px')
    expect(entryCard.style.boxShadow).toBe('0 12px 24px -18px rgba(15, 23, 42, 0.8)')

    // Verify text wrapping works - long text should not overflow
    const longTextResponse = screen.getByText(/TSLA showing strong institutional support/)
    expect(longTextResponse).toBeInTheDocument()
    expect(longTextResponse.className).toMatch(/break-words/)

    // Verify slide structure
    const slides = screen.getAllByTestId('carousel-slide')
    expect(slides.length).toBe(2)

    // Verify first slide contains position plan content
    const firstSlide = slides[0]
    expect(firstSlide).toContainElement(screen.getByText('POSITION PLAN'))

    // Verify wrapper has correct transform for first slide (0%)
    const wrapper = screen.getByTestId('carousel-wrapper')
    // Transform could be 'translateX(0%)' or 'translateX(-0%)' - both are valid for first slide
    expect(wrapper.style.transform).toMatch(/translateX\(-?0%\)/)
  })

  it('navigates through full carousel of real journal entries using all controls', () => {
    // Create multiple real journal entries
    const multipleEntries: JournalEntry[] = [
      {
        id: 'journal-1',
        position_id: 'pos-tsla-001',
        entry_type: 'position_plan',
        fields: [
          {
            name: 'core_thesis',
            prompt: 'What is the core thesis for this position?',
            response: 'Entry 1: Strong technical setup with support at $250.'
          }
        ],
        created_at: '2024-09-04T10:00:00Z'
      },
      {
        id: 'journal-2',
        position_id: 'pos-tsla-001',
        entry_type: 'trade_execution',
        trade_id: 'trade-1',
        fields: [
          {
            name: 'execution_timing',
            prompt: 'Why did I execute this trade now?',
            response: 'Entry 2: Price reached target entry with volume.'
          }
        ],
        created_at: '2024-09-05T14:30:00Z'
      },
      {
        id: 'journal-3',
        position_id: 'pos-tsla-001',
        entry_type: 'position_plan',
        fields: [
          {
            name: 'position_update',
            prompt: 'What changed since last review?',
            response: 'Entry 3: Market showing weakness in tech.'
          }
        ],
        created_at: '2024-09-07T09:00:00Z'
      },
      {
        id: 'journal-4',
        position_id: 'pos-tsla-001',
        entry_type: 'position_plan',
        fields: [
          {
            name: 'daily_review',
            prompt: 'What am I observing today?',
            response: 'Entry 4: Position near stop level, considering exit.'
          }
        ],
        created_at: '2024-09-10T16:00:00Z'
      }
    ]

    render(<JournalCarousel entries={multipleEntries} />)

    // Verify navigation controls are present
    expect(screen.getByTestId('carousel-nav')).toBeInTheDocument()
    const prevArrow = screen.getByTestId('prev-arrow')
    const nextArrow = screen.getByTestId('next-arrow')
    const dots = screen.getAllByTestId(/^carousel-dot-/)

    // Should start at first entry
    expect(screen.getByText(/Entry 1:/)).toBeInTheDocument()

    // Left arrow should be disabled
    expect(prevArrow).toBeDisabled()
    expect(nextArrow).not.toBeDisabled()

    // First dot should be active
    expect(dots[0].className).toMatch(/active/)

    // Click next arrow to go to second entry
    fireEvent.click(nextArrow)
    expect(screen.getByText(/Entry 2:/)).toBeInTheDocument()
    const wrapper = screen.getByTestId('carousel-wrapper')
    expect(wrapper.style.transform).toBe('translateX(-100%)')

    // Both arrows should be enabled on middle slide
    expect(prevArrow).not.toBeDisabled()
    expect(nextArrow).not.toBeDisabled()

    // Second dot should be active
    expect(dots[1].className).toMatch(/active/)

    // Click next arrow again to go to third entry
    fireEvent.click(nextArrow)
    expect(screen.getByText(/Entry 3:/)).toBeInTheDocument()
    expect(wrapper.style.transform).toBe('translateX(-200%)')

    // Third dot should be active
    expect(dots[2].className).toMatch(/active/)

    // Click next arrow to reach last entry
    fireEvent.click(nextArrow)
    expect(screen.getByText(/Entry 4:/)).toBeInTheDocument()
    expect(wrapper.style.transform).toBe('translateX(-300%)')

    // Right arrow should be disabled at last entry
    expect(nextArrow).toBeDisabled()
    expect(prevArrow).not.toBeDisabled()

    // Fourth dot should be active
    expect(dots[3].className).toMatch(/active/)

    // Click prev arrow to go back
    fireEvent.click(prevArrow)
    expect(screen.getByText(/Entry 3:/)).toBeInTheDocument()
    expect(wrapper.style.transform).toBe('translateX(-200%)')

    // Click first dot to jump to beginning
    fireEvent.click(dots[0])
    expect(screen.getByText(/Entry 1:/)).toBeInTheDocument()
    expect(wrapper.style.transform).toMatch(/translateX\(-?0%\)/)

    // Left arrow should be disabled again
    expect(prevArrow).toBeDisabled()

    // Click third dot to jump to third entry
    fireEvent.click(dots[2])
    expect(screen.getByText(/Entry 3:/)).toBeInTheDocument()
    expect(wrapper.style.transform).toBe('translateX(-200%)')

    // Verify all entry data remained intact throughout navigation
    expect(screen.getAllByText('POSITION PLAN').length).toBeGreaterThan(0)
    expect(screen.getByText('What changed since last review?')).toBeInTheDocument()
  })
})
