import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProgressIndicator } from '@/components/ProgressIndicator'

/**
 * Tests for ProgressIndicator Component
 *
 * Visual progress bar showing current price relative to stop loss and profit target
 */

describe('ProgressIndicator Component', () => {
  describe('Rendering', () => {
    it('[Unit] should render progress bar with gradient', () => {
      // Arrange & Act
      const { container } = render(
        <ProgressIndicator
          currentPrice={110}
          stopLoss={100}
          profitTarget={120}
        />
      )

      // Assert - Should have a gradient bar element
      expect(container.querySelector('.bg-gradient-to-r')).toBeTruthy()
    })

    it('[Unit] should display stop loss price', () => {
      // Arrange & Act
      render(
        <ProgressIndicator
          currentPrice={110}
          stopLoss={100}
          profitTarget={120}
        />
      )

      // Assert
      expect(screen.getByText(/\$100\.00/)).toBeInTheDocument()
      expect(screen.getByText(/stop/i)).toBeInTheDocument()
    })

    it('[Unit] should display profit target price', () => {
      // Arrange & Act
      render(
        <ProgressIndicator
          currentPrice={110}
          stopLoss={100}
          profitTarget={120}
        />
      )

      // Assert
      expect(screen.getByText(/\$120\.00/)).toBeInTheDocument()
      expect(screen.getByText(/target/i)).toBeInTheDocument()
    })
  })

  describe('Position Marker', () => {
    it('[Unit] should position marker at midpoint when price is halfway', () => {
      // Arrange & Act
      // Price: 110, Stop: 100, Target: 120
      // Progress: (110 - 100) / (120 - 100) = 10/20 = 50%
      const { container } = render(
        <ProgressIndicator
          currentPrice={110}
          stopLoss={100}
          profitTarget={120}
        />
      )

      // Assert - Marker should be positioned at 50%
      const marker = container.querySelector('[style*="left: 50%"]')
      expect(marker).toBeTruthy()
    })

    it('[Unit] should position marker at 25% when price is quarter way', () => {
      // Arrange & Act
      // Price: 105, Stop: 100, Target: 120
      // Progress: (105 - 100) / (120 - 100) = 5/20 = 25%
      const { container } = render(
        <ProgressIndicator
          currentPrice={105}
          stopLoss={100}
          profitTarget={120}
        />
      )

      // Assert
      const marker = container.querySelector('[style*="left: 25%"]')
      expect(marker).toBeTruthy()
    })

    it('[Unit] should position marker at 75% when price is three-quarters way', () => {
      // Arrange & Act
      // Price: 115, Stop: 100, Target: 120
      // Progress: (115 - 100) / (120 - 100) = 15/20 = 75%
      const { container } = render(
        <ProgressIndicator
          currentPrice={115}
          stopLoss={100}
          profitTarget={120}
        />
      )

      // Assert
      const marker = container.querySelector('[style*="left: 75%"]')
      expect(marker).toBeTruthy()
    })
  })

  describe('Captured Profit Percentage', () => {
    it('[Unit] should show 50% captured when price is halfway', () => {
      // Arrange & Act
      render(
        <ProgressIndicator
          currentPrice={110}
          stopLoss={100}
          profitTarget={120}
        />
      )

      // Assert
      expect(screen.getByText(/50\.0%/)).toBeInTheDocument()
    })

    it('[Unit] should show 100% captured when price is at target', () => {
      // Arrange & Act
      render(
        <ProgressIndicator
          currentPrice={120}
          stopLoss={100}
          profitTarget={120}
        />
      )

      // Assert
      expect(screen.getByText(/100\.0%/)).toBeInTheDocument()
    })

    it('[Unit] should show 0% captured when price is at stop loss', () => {
      // Arrange & Act
      render(
        <ProgressIndicator
          currentPrice={100}
          stopLoss={100}
          profitTarget={120}
        />
      )

      // Assert
      expect(screen.getByText(/0\.0%/)).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('[Unit] should handle price below stop loss', () => {
      // Arrange & Act
      // Price below stop should clamp to 0%
      const { container } = render(
        <ProgressIndicator
          currentPrice={95}
          stopLoss={100}
          profitTarget={120}
        />
      )

      // Assert - Marker should be at 0% (clamped)
      const marker = container.querySelector('[style*="left: 0%"]')
      expect(marker).toBeTruthy()
    })

    it('[Unit] should handle price above profit target', () => {
      // Arrange & Act
      // Price above target should clamp to 100%
      const { container } = render(
        <ProgressIndicator
          currentPrice={125}
          stopLoss={100}
          profitTarget={120}
        />
      )

      // Assert - Marker should be at 100% (clamped)
      const marker = container.querySelector('[style*="left: 100%"]')
      expect(marker).toBeTruthy()
    })

    it('[Unit] should show warning color when below stop loss', () => {
      // Arrange & Act
      const { container } = render(
        <ProgressIndicator
          currentPrice={95}
          stopLoss={100}
          profitTarget={120}
        />
      )

      // Assert - Should have red/warning indicator
      expect(container.querySelector('.text-red-600, .bg-red-600')).toBeTruthy()
    })

    it('[Unit] should show success color when above target', () => {
      // Arrange & Act
      const { container } = render(
        <ProgressIndicator
          currentPrice={125}
          stopLoss={100}
          profitTarget={120}
        />
      )

      // Assert - Should have green/success indicator
      expect(container.querySelector('.text-green-600, .bg-green-600')).toBeTruthy()
    })
  })
})
