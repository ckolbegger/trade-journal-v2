import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from '../StatusBadge'
import type { Position } from '@/lib/position'

const createTestPosition = (overrides?: Partial<Position>): Position => ({
  id: 'pos-123',
  symbol: 'AAPL',
  strategy_type: 'Long Stock',
  target_entry_price: 150,
  target_quantity: 100,
  profit_target: 165,
  stop_loss: 135,
  position_thesis: 'Test position thesis',
  created_date: new Date('2024-01-15T00:00:00.000Z'),
  status: 'planned',
  journal_entry_ids: [],
  trades: [],
  ...overrides
})

describe('Batch 1: Status UI Integration - StatusBadge Component', () => {
  describe('[Integration] Display status badges correctly', () => {
    it('[Integration] should display "planned" badge for positions with no trades', () => {
      // Arrange - Create planned position (no trades)
      const plannedPosition = createTestPosition({
        id: 'planned-pos-123',
        status: 'planned',
        trades: []
      })

      // Act - Render StatusBadge
      render(<StatusBadge position={plannedPosition} />)

      // Assert - Should show planned badge
      const badge = screen.getByTestId('status-badge')
      expect(badge).toBeVisible()
      expect(badge).toHaveTextContent('planned')
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800')
    })

    it('[Integration] should display "open" badge for positions with trades', () => {
      // Arrange - Create open position (has trades)
      const openPosition = createTestPosition({
        id: 'open-pos-123',
        status: 'open',
        trades: [{
          id: 'trade-123',
          position_id: 'open-pos-123',
          trade_type: 'buy',
          quantity: 100,
          price: 150.25,
          timestamp: new Date('2024-01-15T10:30:00.000Z')
        }]
      })

      // Act - Render StatusBadge
      render(<StatusBadge position={openPosition} />)

      // Assert - Should show open badge
      const badge = screen.getByTestId('status-badge')
      expect(badge).toBeVisible()
      expect(badge).toHaveTextContent('open')
      expect(badge).toHaveClass('bg-green-100', 'text-green-800')
    })

    it('[Integration] should update badge after trade execution', () => {
      // Arrange - Create planned position
      const plannedPosition = createTestPosition({
        id: 'update-pos-123',
        status: 'planned',
        trades: []
      })

      const { rerender } = render(<StatusBadge position={plannedPosition} />)

      // Assert - Initially shows planned
      const badge = screen.getByTestId('status-badge')
      expect(badge).toHaveTextContent('planned')
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800')

      // Act - Position gets a trade (status changes to open)
      const openPosition = createTestPosition({
        id: 'update-pos-123',
        status: 'open',
        trades: [{
          id: 'trade-123',
          position_id: 'update-pos-123',
          trade_type: 'buy',
          quantity: 100,
          price: 150.25,
          timestamp: new Date('2024-01-15T10:30:00.000Z')
        }]
      })

      rerender(<StatusBadge position={openPosition} />)

      // Assert - Now shows open
      const updatedBadge = screen.getByTestId('status-badge')
      expect(updatedBadge).toHaveTextContent('open')
      expect(updatedBadge).toHaveClass('bg-green-100', 'text-green-800')
    })

    it('[Integration] should apply correct CSS classes by status', () => {
      // Arrange & Act - Test planned status with small size
      const plannedPosition = createTestPosition({ status: 'planned', trades: [] })
      const { unmount } = render(<StatusBadge position={plannedPosition} size="small" />)

      const plannedBadge = screen.getByTestId('status-badge')
      expect(plannedBadge).toHaveClass('bg-gray-100', 'text-gray-800', 'px-2', 'py-1', 'rounded-full', 'text-xs', 'font-medium')

      // Cleanup and re-render for open status
      unmount()
      const openPosition = createTestPosition({
        status: 'open',
        trades: [{
          id: 'trade-123',
          position_id: 'test-pos',
          trade_type: 'buy',
          quantity: 100,
          price: 150.25,
          timestamp: new Date('2024-01-15T10:30:00.000Z')
        }]
      })
      render(<StatusBadge position={openPosition} size="small" />)

      const openBadge = screen.getByTestId('status-badge')
      expect(openBadge).toHaveClass('bg-green-100', 'text-green-800', 'px-2', 'py-1', 'rounded-full', 'text-xs', 'font-medium')
    })

    it('[Integration] should support different badge sizes', () => {
      // Arrange - Test different sizes
      const position = createTestPosition({ status: 'planned', trades: [] })

      // Act - Small size
      const { rerender } = render(<StatusBadge position={position} size="small" />)
      let badge = screen.getByTestId('status-badge')
      expect(badge).toHaveClass('text-xs')

      // Act - Medium size (default)
      rerender(<StatusBadge position={position} size="medium" />)
      badge = screen.getByTestId('status-badge')
      expect(badge).toHaveClass('text-sm')

      // Act - Large size
      rerender(<StatusBadge position={position} size="large" />)
      badge = screen.getByTestId('status-badge')
      expect(badge).toHaveClass('text-base')
    })

    it('[Integration] should be accessible with proper aria attributes', () => {
      // Arrange
      const position = createTestPosition({ status: 'planned', trades: [] })

      // Act
      render(<StatusBadge position={position} />)

      // Assert
      const badge = screen.getByTestId('status-badge')
      expect(badge).toHaveAttribute('role', 'status')
      expect(badge).toHaveAttribute('aria-label', 'Position status: planned')
    })

    it('[Integration] should handle position status changes gracefully', () => {
      // Arrange - Test edge case where status might be undefined
      const positionWithUndefinedStatus = createTestPosition({
        status: undefined as any,
        trades: []
      })

      // Act - Should handle gracefully
      render(<StatusBadge position={positionWithUndefinedStatus} />)

      // Assert - Should default to planned styling
      const badge = screen.getByTestId('status-badge')
      expect(badge).toBeVisible()
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800')
    })

    it('[Integration] should show consistent styling across different positions', () => {
      // Arrange - Multiple positions with same status
      const position1 = createTestPosition({ id: 'pos-1', status: 'open', trades: [] })
      const position2 = createTestPosition({ id: 'pos-2', status: 'open', trades: [] })

      // Act
      const { rerender } = render(<StatusBadge position={position1} />)
      const badge1 = screen.getByTestId('status-badge')
      const classes1 = badge1.className

      rerender(<StatusBadge position={position2} />)
      const badge2 = screen.getByTestId('status-badge')
      const classes2 = badge2.className

      // Assert - Same status should have same styling
      expect(classes1).toBe(classes2)
    })
  })

  describe('[Integration] StatusBadge edge cases and error handling', () => {
    it('[Integration] should handle missing position gracefully', () => {
      // Arrange - Position is undefined
      const undefinedPosition = undefined as any

      // Act - Should not crash
      expect(() => render(<StatusBadge position={undefinedPosition} />))
        .not.toThrow()
    })

    it('[Integration] should handle position with null trades', () => {
      // Arrange - Position with null trades array
      const positionWithNullTrades = createTestPosition({
        trades: null as any
      })

      // Act
      render(<StatusBadge position={positionWithNullTrades} />)

      // Assert - Should default to planned status
      const badge = screen.getByTestId('status-badge')
      expect(badge).toHaveTextContent('planned')
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800')
    })

    it('[Integration] should maintain performance with many badges', () => {
      // Arrange - Create many positions (performance test)
      const positions = Array.from({ length: 100 }, (_, i) =>
        createTestPosition({
          id: `pos-${i}`,
          status: i % 2 === 0 ? 'planned' : 'open',
          trades: i % 2 === 0 ? [] : [{
            id: `trade-${i}`,
            position_id: `pos-${i}`,
            trade_type: 'buy',
            quantity: 100,
            price: 150.25,
            timestamp: new Date('2024-01-15T10:30:00.000Z')
          }]
        })
      )

      // Act - Render all badges (measure performance)
      const startTime = performance.now()

      positions.forEach(position => {
        const { unmount } = render(<StatusBadge position={position} />)
        unmount()
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Assert - Should be fast (<3ms per badge on average)
      expect(renderTime).toBeLessThan(300) // 300ms for 100 badges = 3ms each
    })
  })
})