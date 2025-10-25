import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PriceConfirmationDialog } from '@/components/PriceConfirmationDialog'

/**
 * Tests for PriceConfirmationDialog Component
 *
 * Confirmation dialog for large price changes (>20%)
 */

describe('PriceConfirmationDialog Component', () => {
  describe('Rendering', () => {
    it('[Unit] should display old and new prices', () => {
      // Arrange & Act
      render(
        <PriceConfirmationDialog
          oldPrice={100.00}
          newPrice={125.00}
          percentChange={25.0}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // Assert
      expect(screen.getByText(/confirm price change/i)).toBeInTheDocument()
      expect(screen.getByText(/\$100\.00/)).toBeInTheDocument()
      expect(screen.getByText(/\$125\.00/)).toBeInTheDocument()
    })

    it('[Unit] should display positive percent change', () => {
      // Arrange & Act
      render(
        <PriceConfirmationDialog
          oldPrice={100.00}
          newPrice={130.00}
          percentChange={30.0}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // Assert
      expect(screen.getByText(/\+30\.0%/)).toBeInTheDocument()
    })

    it('[Unit] should display negative percent change', () => {
      // Arrange & Act
      render(
        <PriceConfirmationDialog
          oldPrice={100.00}
          newPrice={70.00}
          percentChange={-30.0}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // Assert
      expect(screen.getByText(/-30\.0%/)).toBeInTheDocument()
    })

    it('[Unit] should display confirm and cancel buttons', () => {
      // Arrange & Act
      render(
        <PriceConfirmationDialog
          oldPrice={100.00}
          newPrice={125.00}
          percentChange={25.0}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // Assert
      expect(screen.getByRole('button', { name: /yes.*update/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('[Unit] should call onConfirm when "Yes, Update" is clicked', () => {
      // Arrange
      const onConfirm = vi.fn()
      render(
        <PriceConfirmationDialog
          oldPrice={100.00}
          newPrice={125.00}
          percentChange={25.0}
          onConfirm={onConfirm}
          onCancel={vi.fn()}
        />
      )

      const confirmButton = screen.getByRole('button', { name: /yes.*update/i })

      // Act
      fireEvent.click(confirmButton)

      // Assert
      expect(onConfirm).toHaveBeenCalledTimes(1)
    })

    it('[Unit] should call onCancel when "Cancel" is clicked', () => {
      // Arrange
      const onCancel = vi.fn()
      render(
        <PriceConfirmationDialog
          oldPrice={100.00}
          newPrice={125.00}
          percentChange={25.0}
          onConfirm={vi.fn()}
          onCancel={onCancel}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /cancel/i })

      // Act
      fireEvent.click(cancelButton)

      // Assert
      expect(onCancel).toHaveBeenCalledTimes(1)
    })
  })

  describe('Styling for Large Changes', () => {
    it('[Unit] should highlight large positive changes', () => {
      // Arrange & Act
      const { container } = render(
        <PriceConfirmationDialog
          oldPrice={100.00}
          newPrice={150.00}
          percentChange={50.0}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // Assert - Should have visual indicator for large change
      expect(container.querySelector('.text-red-600, .text-orange-600')).toBeTruthy()
    })

    it('[Unit] should highlight large negative changes', () => {
      // Arrange & Act
      const { container } = render(
        <PriceConfirmationDialog
          oldPrice={100.00}
          newPrice={50.00}
          percentChange={-50.0}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      // Assert - Should have visual indicator for large change
      expect(container.querySelector('.text-red-600, .text-orange-600')).toBeTruthy()
    })
  })
})
