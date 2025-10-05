import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PositionCard } from '../PositionCard'
import type { Position } from '@/lib/position'

describe('PositionCard', () => {
  const mockPosition: Position = {
    id: 'test-pos-1',
    symbol: 'AAPL',
    strategy_type: 'Long Stock',
    target_entry_price: 150,
    target_quantity: 100,
    profit_target: 160,
    stop_loss: 145,
    position_thesis: 'Test thesis',
    created_date: new Date('2024-01-15'),
    status: 'planned',
    journal_entry_ids: [],
    trades: []
  }

  describe('Card Appearance (Mockup Styling)', () => {
    it('should have rounded corners (rounded-xl = 12px)', () => {
      const { container } = render(
        <PositionCard
          position={mockPosition}
          onViewDetails={vi.fn()}
        />
      )

      const card = container.querySelector('[data-testid="position-card"]')
      expect(card).toHaveClass('rounded-xl')
    })

    it('should have subtle shadow', () => {
      const { container } = render(
        <PositionCard
          position={mockPosition}
          onViewDetails={vi.fn()}
        />
      )

      const card = container.querySelector('[data-testid="position-card"]')
      expect(card).toHaveClass('shadow-sm')
    })

    it('should have grey left border for planned positions', () => {
      const { container } = render(
        <PositionCard
          position={mockPosition}
          onViewDetails={vi.fn()}
        />
      )

      const card = container.querySelector('[data-testid="position-card"]')
      expect(card).toHaveClass('border-l-4')
      expect(card).toHaveClass('border-l-gray-500')
    })

    it('should have light grey background for planned positions', () => {
      const { container } = render(
        <PositionCard
          position={mockPosition}
          onViewDetails={vi.fn()}
        />
      )

      const card = container.querySelector('[data-testid="position-card"]')
      expect(card).toHaveClass('bg-gray-50')
    })
  })

  describe('Card Interaction', () => {
    it('should NOT render Add Trade button', () => {
      render(
        <PositionCard
          position={mockPosition}
          onViewDetails={vi.fn()}
        />
      )

      expect(screen.queryByText('Add Trade')).not.toBeInTheDocument()
    })

    it('should NOT render Details button', () => {
      render(
        <PositionCard
          position={mockPosition}
          onViewDetails={vi.fn()}
        />
      )

      expect(screen.queryByText('Details')).not.toBeInTheDocument()
    })

    it('should call onViewDetails when card is clicked', () => {
      const handleViewDetails = vi.fn()

      const { container } = render(
        <PositionCard
          position={mockPosition}
          onViewDetails={handleViewDetails}
        />
      )

      const card = container.querySelector('[data-testid="position-card"]')
      fireEvent.click(card!)

      expect(handleViewDetails).toHaveBeenCalledWith('test-pos-1')
    })

    it('should be cursor-pointer for entire card', () => {
      const { container } = render(
        <PositionCard
          position={mockPosition}
          onViewDetails={vi.fn()}
        />
      )

      const card = container.querySelector('[data-testid="position-card"]')
      expect(card).toHaveClass('cursor-pointer')
    })
  })

  describe('Position Status Display', () => {
    it('should show position metrics', () => {
      render(
        <PositionCard
          position={mockPosition}
          onViewDetails={vi.fn()}
        />
      )

      expect(screen.getByText('AAPL')).toBeInTheDocument()
      expect(screen.getByText('Long Stock')).toBeInTheDocument()
      expect(screen.getByText('$150.00')).toBeInTheDocument() // Avg Cost
      expect(screen.getByText('$160.00')).toBeInTheDocument() // Target
      expect(screen.getByText('$145.00')).toBeInTheDocument() // Stop
    })
  })
})
