import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PnLDisplay } from '@/components/PnLDisplay'

/**
 * Tests for PnLDisplay Component
 *
 * Color-coded P&L display with optional percentage
 */

describe('PnLDisplay Component', () => {
  describe('Color Coding', () => {
    it('[Unit] should display positive P&L in green', () => {
      // Arrange & Act
      const { container } = render(<PnLDisplay pnl={150.50} />)

      // Assert
      expect(screen.getByText(/\$150\.50/)).toBeInTheDocument()
      expect(container.querySelector('.text-green-600')).toBeTruthy()
    })

    it('[Unit] should display negative P&L in red', () => {
      // Arrange & Act
      const { container } = render(<PnLDisplay pnl={-75.25} />)

      // Assert
      expect(screen.getByText(/-\$75\.25/)).toBeInTheDocument()
      expect(container.querySelector('.text-red-600')).toBeTruthy()
    })

    it('[Unit] should display zero P&L in gray', () => {
      // Arrange & Act
      const { container } = render(<PnLDisplay pnl={0} />)

      // Assert
      expect(screen.getByText(/\$0\.00/)).toBeInTheDocument()
      expect(container.querySelector('.text-gray-500')).toBeTruthy()
    })
  })

  describe('Null Handling', () => {
    it('[Unit] should display "—" when P&L is null', () => {
      // Arrange & Act
      render(<PnLDisplay pnl={null} />)

      // Assert
      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('[Unit] should not show percentage when P&L is null', () => {
      // Arrange & Act
      const { container } = render(<PnLDisplay pnl={null} percentage={25.5} />)

      // Assert
      expect(screen.queryByText(/25\.5%/)).not.toBeInTheDocument()
    })
  })

  describe('Percentage Display', () => {
    it('[Unit] should include positive percentage when provided', () => {
      // Arrange & Act
      render(<PnLDisplay pnl={100.00} percentage={15.5} />)

      // Assert
      expect(screen.getByText(/\$100\.00/)).toBeInTheDocument()
      expect(screen.getByText(/\+15\.5%/)).toBeInTheDocument()
    })

    it('[Unit] should include negative percentage when provided', () => {
      // Arrange & Act
      render(<PnLDisplay pnl={-50.00} percentage={-12.3} />)

      // Assert
      expect(screen.getByText(/-\$50\.00/)).toBeInTheDocument()
      expect(screen.getByText(/-12\.3%/)).toBeInTheDocument()
    })

    it('[Unit] should omit percentage when not provided', () => {
      // Arrange & Act
      const { container } = render(<PnLDisplay pnl={75.00} />)

      // Assert
      expect(screen.getByText(/\$75\.00/)).toBeInTheDocument()
      expect(container.textContent).not.toMatch(/%/)
    })

    it('[Unit] should show zero percentage without sign', () => {
      // Arrange & Act
      render(<PnLDisplay pnl={0} percentage={0} />)

      // Assert
      expect(screen.getByText(/0\.0%/)).toBeInTheDocument()
    })
  })

  describe('Dollar Formatting', () => {
    it('[Unit] should format dollar amounts to 2 decimal places', () => {
      // Arrange & Act
      render(<PnLDisplay pnl={1234.567} />)

      // Assert
      expect(screen.getByText(/\$1234\.57/)).toBeInTheDocument()
    })

    it('[Unit] should handle large dollar amounts', () => {
      // Arrange & Act
      render(<PnLDisplay pnl={999999.99} />)

      // Assert
      expect(screen.getByText(/\$999999\.99/)).toBeInTheDocument()
    })

    it('[Unit] should handle small dollar amounts', () => {
      // Arrange & Act
      render(<PnLDisplay pnl={0.01} />)

      // Assert
      expect(screen.getByText(/\$0\.01/)).toBeInTheDocument()
    })

    it('[Unit] should add minus sign before dollar sign for negative', () => {
      // Arrange & Act
      render(<PnLDisplay pnl={-123.45} />)

      // Assert
      expect(screen.getByText(/-\$123\.45/)).toBeInTheDocument()
    })
  })
})
