import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PositionCard } from '../PositionCard'
import type { Position } from '@/lib/position'
import { createPosition } from '@/test/data-factories'

describe('PositionCard', () => {
  const mockMetrics = {
    avgCost: 150,
    pnl: null,
    pnlPercentage: undefined
  }

  // Helper function to render PositionCard with default props
  const renderPositionCard = (overrides: { position?: Position; onViewDetails?: () => void } = {}, metrics = mockMetrics) => {
    const position = overrides.position || createPosition()
    const onViewDetails = overrides.onViewDetails || vi.fn()

    return render(
      <PositionCard
        position={position}
        onViewDetails={onViewDetails}
        {...metrics}
      />
    )
  }

  describe('Card Appearance (Mockup Styling)', () => {
    it('should have rounded corners (rounded-xl = 12px)', () => {
      const { container } = renderPositionCard()

      const card = container.querySelector('[data-testid="position-card"]')
      expect(card).toHaveClass('rounded-xl')
    })

    it('should have subtle shadow', () => {
      const { container } = renderPositionCard()

      const card = container.querySelector('[data-testid="position-card"]')
      expect(card).toHaveClass('shadow-sm')
    })

    it('should have grey left border for planned positions', () => {
      const { container } = renderPositionCard()

      const card = container.querySelector('[data-testid="position-card"]')
      expect(card).toHaveClass('border-l-4')
      expect(card).toHaveClass('border-l-gray-500')
    })

    it('should have light grey background for planned positions', () => {
      const { container } = renderPositionCard()

      const card = container.querySelector('[data-testid="position-card"]')
      expect(card).toHaveClass('bg-gray-50')
    })
  })

  describe('Card Interaction', () => {
    it('should NOT render Add Trade button', () => {
      renderPositionCard()

      expect(screen.queryByText('Add Trade')).not.toBeInTheDocument()
    })

    it('should NOT render Details button', () => {
      renderPositionCard()

      expect(screen.queryByText('Details')).not.toBeInTheDocument()
    })

    it('should call onViewDetails when card is clicked', () => {
      const handleViewDetails = vi.fn()
      const position = createPosition({ id: 'test-pos-1' })

      const { container } = renderPositionCard({ position, onViewDetails: handleViewDetails })

      const card = container.querySelector('[data-testid="position-card"]')
      fireEvent.click(card!)

      expect(handleViewDetails).toHaveBeenCalledWith('test-pos-1')
    })

    it('should be cursor-pointer for entire card', () => {
      const { container } = renderPositionCard()

      const card = container.querySelector('[data-testid="position-card"]')
      expect(card).toHaveClass('cursor-pointer')
    })
  })

  describe('Position Status Display', () => {
    it('should show position metrics from props', () => {
      // Create position with explicit values matching test expectations
      const position = createPosition({
        symbol: 'AAPL',
        strategy_type: 'Long Stock',
        profit_target: 160,
        stop_loss: 145
      })
      renderPositionCard({ position })

      expect(screen.getByText('AAPL')).toBeInTheDocument()
      expect(screen.getByText('Long Stock')).toBeInTheDocument()
      expect(screen.getByText('$150.00')).toBeInTheDocument() // Avg Cost from props
      expect(screen.getByText('$160.00')).toBeInTheDocument() // Target from position
      expect(screen.getByText('$145.00')).toBeInTheDocument() // Stop from position
    })
  })
})
